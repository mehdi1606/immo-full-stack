package com.clubicode.mmomarocback.service.impl;

import com.clubicode.mmomarocback.config.translation.TranslationApiClient;
import com.clubicode.mmomarocback.entity.Translation;
import com.clubicode.mmomarocback.repository.TranslationRepository;
import com.clubicode.mmomarocback.service.ITranslationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Translation service — 3-layer cache strategy:
 *
 *  Layer 1 → Caffeine in-memory  (sub-ms, 24h TTL)
 *  Layer 2 → PostgreSQL DB       (permanent persistence)
 *  Layer 3 → MyMemory API        (free, no Docker, no API key, no encoding bugs)
 *
 * Key optimization — translateFieldsBatch():
 *   ONE DB query for all fields → missing ones translated IN PARALLEL
 *   → single batch DB insert → Caffeine updated → return
 *
 * Speed: 23s → ~2s first call | 0ms all repeat calls
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TranslationServiceImpl implements ITranslationService {

    private final TranslationRepository     translationRepository;
    private final List<TranslationApiClient> apiClients;
    private final CacheManager              cacheManager;

    private static final List<String> ALL_LANGUAGES = List.of("en", "ar");

    // ─── 1. One-off text translation (no persistence) ────────────────────────

    @Override
    public String translate(String text, String sourceLang, String targetLang) {
        if (isBlank(text) || sourceLang.equalsIgnoreCase(targetLang)) return text;
        String result = callApi(text, sourceLang, targetLang);
        return result != null ? result : text;
    }

    // ─── 2. Single-field with Caffeine + DB layers ───────────────────────────

    @Override
    @Cacheable(
        value  = "translations",
        key    = "#entityType + ':' + #entityId + ':' + #fieldName + ':' + #targetLang",
        unless = "#result == null"
    )
    @Transactional
    public String translateField(String entityType, Long entityId, String fieldName,
                                 String originalText, String targetLang) {
        if (isBlank(originalText) || isFrench(targetLang)) return originalText;

        Optional<Translation> existing = translationRepository
                .findByEntityTypeAndEntityIdAndFieldNameAndTargetLang(
                        entityType, entityId, fieldName, targetLang);
        if (existing.isPresent()) return existing.get().getTranslatedText();

        String[] prov = {null};
        String translated = callApiWithProvider(originalText, "fr", targetLang, prov);
        if (translated == null) return originalText;

        translationRepository.save(build(entityType, entityId, fieldName,
                "fr", targetLang, originalText, translated, prov[0]));

        return translated;
    }

    // ─── 3. HIGH-PERFORMANCE BATCH — ONE DB query + PARALLEL API calls ───────

    @Override
    @Transactional
    public Map<String, String> translateFieldsBatch(String entityType, Long entityId,
                                                    Map<String, String> fields,
                                                    String targetLang) {
        if (fields == null || fields.isEmpty() || isFrench(targetLang)) return fields;

        // STEP 1 — ONE DB query for ALL fields
        Map<String, String> dbMap = translationRepository
                .findByEntityTypeAndEntityIdAndTargetLang(entityType, entityId, targetLang)
                .stream()
                .collect(Collectors.toMap(Translation::getFieldName, Translation::getTranslatedText));

        // STEP 2 — Build result: originals + DB overrides
        Map<String, String> result = new LinkedHashMap<>(fields);
        result.putAll(dbMap);

        // STEP 3 — Find fields not in DB
        Map<String, String> missing = new LinkedHashMap<>();
        fields.forEach((k, v) -> {
            if (!dbMap.containsKey(k) && !isBlank(v)) missing.put(k, v);
        });

        if (missing.isEmpty()) {
            log.debug("[Batch] {}/{} → {} | all {} from DB", entityType, entityId, targetLang, dbMap.size());
            return result;
        }

        log.info("[Batch] {}/{} → {} | {} cached, {} via API (parallel)",
                entityType, entityId, targetLang, dbMap.size(), missing.size());

        // STEP 4 — Launch ALL API calls in parallel
        Map<String, CompletableFuture<String[]>> futures = new LinkedHashMap<>();
        missing.forEach((fieldName, text) ->
            futures.put(fieldName, CompletableFuture.supplyAsync(() -> {
                String[] prov = {null};
                String   out  = callApiWithProvider(text, "fr", targetLang, prov);
                return new String[]{out, prov[0]};
            }))
        );

        // STEP 5 — Collect, save batch, fill Caffeine
        List<Translation> toSave = new ArrayList<>();
        futures.forEach((fieldName, future) -> {
            String originalText = missing.get(fieldName);
            try {
                String[] res        = future.get(15, TimeUnit.SECONDS);
                String   translated = res[0];
                String   provider   = res[1];

                if (translated != null && !translated.isBlank()) {
                    result.put(fieldName, translated);
                    toSave.add(build(entityType, entityId, fieldName,
                            "fr", targetLang, originalText, translated, provider));
                    pushToCache(entityType, entityId, fieldName, targetLang, translated);
                }
            } catch (Exception ex) {
                log.warn("[Batch] field '{}' failed: {}", fieldName, ex.getMessage());
                // result keeps original French — graceful degradation
            }
        });

        if (!toSave.isEmpty()) {
            translationRepository.saveAll(toSave);
            log.info("[Batch] Saved {} translations for {}/{} → {}",
                    toSave.size(), entityType, entityId, targetLang);
        }

        return result;
    }

    // ─── 4. Deprecated sequential batch (delegates to batch) ─────────────────

    @Override
    @Deprecated
    @Transactional
    public Map<String, String> translateFields(String entityType, Long entityId,
                                               Map<String, String> fields, String targetLang) {
        return translateFieldsBatch(entityType, entityId, fields, targetLang);
    }

    // ─── 5. Force re-translation ─────────────────────────────────────────────

    @Override
    @Transactional
    public String retranslateField(String entityType, Long entityId, String fieldName,
                                   String originalText, String targetLang) {
        String[] prov = {null};
        String translated = callApiWithProvider(originalText, "fr", targetLang, prov);
        if (translated == null) return originalText;

        translationRepository
                .findByEntityTypeAndEntityIdAndFieldNameAndTargetLang(
                        entityType, entityId, fieldName, targetLang)
                .ifPresentOrElse(t -> {
                    t.setTranslatedText(translated);
                    t.setTranslationSource(prov[0]);
                    t.setUpdatedAt(LocalDateTime.now());
                    translationRepository.save(t);
                }, () -> translationRepository.save(
                        build(entityType, entityId, fieldName,
                                "fr", targetLang, originalText, translated, prov[0])));

        pushToCache(entityType, entityId, fieldName, targetLang, translated);
        return translated;
    }

    // ─── 6. Pre-translate property on create/update (background @Async) ──────

    @Override
    @Async
    @Transactional
    public void preTranslateProperty(Long propertyId, String title, String description,
                                     String city, String neighborhood, List<String> features) {
        Map<String, String> fields = new LinkedHashMap<>();
        if (!isBlank(title))        fields.put("title", title);
        if (!isBlank(description))  fields.put("description", description);
        if (!isBlank(city))         fields.put("city", city);
        if (!isBlank(neighborhood)) fields.put("neighborhood", neighborhood);
        if (features != null) {
            for (int i = 0; i < features.size(); i++) {
                if (!isBlank(features.get(i))) fields.put("feature_" + i, features.get(i));
            }
        }
        if (fields.isEmpty()) return;

        for (String lang : ALL_LANGUAGES) {
            try {
                translateFieldsBatch("property", propertyId, fields, lang);
                log.info("[PreTranslate] property {} → {} done", propertyId, lang);
            } catch (Exception e) {
                log.warn("[PreTranslate] property {} → {} error: {}", propertyId, lang, e.getMessage());
            }
        }
    }

    // ─── 7. Evict entity translations ────────────────────────────────────────

    @Override
    @CacheEvict(value = "translations", allEntries = true)
    @Transactional
    public void evictEntityTranslations(String entityType, Long entityId) {
        translationRepository.deleteByEntityTypeAndEntityId(entityType, entityId);
        log.info("[Evict] {}/{} translations cleared", entityType, entityId);
    }

    // ─── Internals ────────────────────────────────────────────────────────────

    private String callApi(String text, String source, String target) {
        String[] p = {null};
        return callApiWithProvider(text, source, target, p);
    }

    private String callApiWithProvider(String text, String source, String target, String[] prov) {
        List<TranslationApiClient> sorted = apiClients.stream()
                .sorted(Comparator.comparingInt(TranslationApiClient::getPriority))
                .toList();
        for (TranslationApiClient client : sorted) {
            try {
                String res = client.translate(text, source, target);
                prov[0] = client.getProviderName();
                return res;
            } catch (Exception e) {
                log.warn("[{}] {}", client.getProviderName(), e.getMessage());
            }
        }
        return null;
    }

    private void pushToCache(String entityType, Long entityId,
                             String fieldName, String targetLang, String value) {
        Cache cache = cacheManager.getCache("translations");
        if (cache != null) {
            cache.put(entityType + ":" + entityId + ":" + fieldName + ":" + targetLang, value);
        }
    }

    private Translation build(String et, Long eid, String fn,
                               String sl, String tl, String orig, String trans, String prov) {
        return Translation.builder()
                .entityType(et).entityId(eid).fieldName(fn)
                .sourceLang(sl).targetLang(tl)
                .originalText(orig).translatedText(trans)
                .translationSource(prov)
                .build();
    }

    private boolean isBlank(String s)    { return s == null || s.isBlank(); }
    private boolean isFrench(String lang) { return "fr".equalsIgnoreCase(lang); }
}
