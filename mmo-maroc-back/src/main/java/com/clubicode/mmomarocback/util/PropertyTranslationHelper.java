package com.clubicode.mmomarocback.util;

import com.clubicode.mmomarocback.dto.response.PropertyResponse;
import com.clubicode.mmomarocback.dto.response.PropertySummaryResponse;
import com.clubicode.mmomarocback.enums.Language;
import com.clubicode.mmomarocback.service.ITranslationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * Applies automatic translation to property API responses.
 *
 * Performance design:
 *
 *  Single property  (GET /api/properties/{id}?lang=ar):
 *    → ONE DB query + parallel API calls for missing fields only
 *    → First call: ~2s | All repeat calls: 0ms (Caffeine cache)
 *
 *  Property list    (GET /api/properties?lang=ar, 12 items):
 *    → ALL 12 properties processed IN PARALLEL
 *    → Each: ONE DB query + parallel API for missing fields
 *    → First call: ~3-4s | All repeat calls: 0ms
 *
 *  French (no lang param or lang=fr):
 *    → Zero translation work — returns original immediately
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PropertyTranslationHelper {

    private final ITranslationService translationService;
    private static final String ENTITY = "property";

    // ─── Full PropertyResponse ────────────────────────────────────────────────

    public PropertyResponse apply(PropertyResponse r, String lang) {
        if (r == null || isFrench(lang)) return r;

        // Collect ALL translatable fields into one map
        Map<String, String> fields = new LinkedHashMap<>();
        if (r.getTitle() != null)        fields.put("title",        r.getTitle());
        if (r.getDescription() != null)  fields.put("description",  r.getDescription());
        if (r.getCity() != null)         fields.put("city",         r.getCity());
        if (r.getNeighborhood() != null) fields.put("neighborhood", r.getNeighborhood());
        if (r.getFeatures() != null) {
            for (int i = 0; i < r.getFeatures().size(); i++) {
                if (r.getFeatures().get(i) != null)
                    fields.put("feature_" + i, r.getFeatures().get(i));
            }
        }
        if (fields.isEmpty()) return r;

        // ONE batch call: 1 DB query + parallel API for missing
        Map<String, String> t = safeBatch(r.getId(), fields, lang);

        if (t.containsKey("title"))        r.setTitle(t.get("title"));
        if (t.containsKey("description"))  r.setDescription(t.get("description"));
        if (t.containsKey("city"))         r.setCity(t.get("city"));
        if (t.containsKey("neighborhood")) r.setNeighborhood(t.get("neighborhood"));

        if (r.getFeatures() != null && !r.getFeatures().isEmpty()) {
            List<String> tf = new ArrayList<>();
            for (int i = 0; i < r.getFeatures().size(); i++) {
                tf.add(t.getOrDefault("feature_" + i, r.getFeatures().get(i)));
            }
            r.setFeatures(tf);
        }

        return r;
    }

    // ─── PropertySummaryResponse ──────────────────────────────────────────────

    public PropertySummaryResponse apply(PropertySummaryResponse r, String lang) {
        if (r == null || isFrench(lang)) return r;

        Map<String, String> fields = new LinkedHashMap<>();
        if (r.getTitle() != null)        fields.put("title",        r.getTitle());
        if (r.getCity() != null)         fields.put("city",         r.getCity());
        if (r.getNeighborhood() != null) fields.put("neighborhood", r.getNeighborhood());
        if (fields.isEmpty()) return r;

        Map<String, String> t = safeBatch(r.getId(), fields, lang);

        if (t.containsKey("title"))        r.setTitle(t.get("title"));
        if (t.containsKey("city"))         r.setCity(t.get("city"));
        if (t.containsKey("neighborhood")) r.setNeighborhood(t.get("neighborhood"));

        return r;
    }

    /** Translate ALL properties in a Page in parallel. */
    public Page<PropertySummaryResponse> apply(Page<PropertySummaryResponse> page, String lang) {
        if (page == null || page.isEmpty() || isFrench(lang)) return page;
        CompletableFuture<?>[] futures = page.getContent().stream()
                .map(p -> CompletableFuture.runAsync(() -> apply(p, lang)))
                .toArray(CompletableFuture[]::new);
        CompletableFuture.allOf(futures).join();
        return page;
    }

    /** Translate ALL properties in a List in parallel. */
    public List<PropertySummaryResponse> apply(List<PropertySummaryResponse> list, String lang) {
        if (list == null || list.isEmpty() || isFrench(lang)) return list;
        CompletableFuture<?>[] futures = list.stream()
                .map(p -> CompletableFuture.runAsync(() -> apply(p, lang)))
                .toArray(CompletableFuture[]::new);
        CompletableFuture.allOf(futures).join();
        return list;
    }

    // ─── Language resolution ──────────────────────────────────────────────────

    /**
     * Priority: ?lang= param → Accept-Language header → "fr" (default)
     */
    public String resolveLang(String langParam, String acceptLangHeader) {
        if (langParam != null && Language.isSupported(langParam))
            return langParam.toLowerCase();

        if (acceptLangHeader != null && !acceptLangHeader.isBlank()) {
            String primary = acceptLangHeader.split("[,;]")[0].trim();
            if (primary.length() >= 2) {
                String code = primary.substring(0, 2).toLowerCase();
                if (Language.isSupported(code)) return code;
            }
        }
        return "fr";
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Map<String, String> safeBatch(Long id, Map<String, String> fields, String lang) {
        try {
            return translationService.translateFieldsBatch(ENTITY, id, fields, lang);
        } catch (Exception e) {
            log.warn("[TranslationHelper] Batch failed property {}: {}", id, e.getMessage());
            return fields; // graceful: return original French
        }
    }

    private boolean isFrench(String lang) {
        return lang == null || "fr".equalsIgnoreCase(lang);
    }
}
