package com.clubicode.mmomarocback.controller;

import com.clubicode.mmomarocback.dto.request.TranslateTextRequest;
import com.clubicode.mmomarocback.dto.response.TranslateResponse;
import com.clubicode.mmomarocback.entity.Property;
import com.clubicode.mmomarocback.entity.Agent;
import com.clubicode.mmomarocback.enums.Language;
import com.clubicode.mmomarocback.exception.BadRequestException;
import com.clubicode.mmomarocback.exception.ResourceNotFoundException;
import com.clubicode.mmomarocback.repository.AgentRepository;
import com.clubicode.mmomarocback.repository.PropertyRepository;
import com.clubicode.mmomarocback.repository.TranslationRepository;
import com.clubicode.mmomarocback.service.ITranslationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST API for the translation system.
 *
 * Public endpoints (no token required):
 *   POST  /api/translate/text                → translate any text
 *   GET   /api/translate/property/{id}       → get property with translated fields
 *   GET   /api/translate/agent/{id}          → get agent with translated fields
 *   GET   /api/translate/languages           → list supported languages
 *
 * Admin endpoints (ADMIN role required):
 *   DELETE /api/translate/{entityType}/{id}  → evict translations for an entity
 *   GET    /api/translate/stats              → translation DB statistics
 */
@RestController
@RequestMapping("/api/translate")
@RequiredArgsConstructor
public class TranslationController {

    private final ITranslationService translationService;
    private final PropertyRepository  propertyRepository;
    private final AgentRepository     agentRepository;
    private final TranslationRepository translationRepository;

    // ─── 1. Translate any text ───────────────────────────────────────────────

    /**
     * POST /api/translate/text
     * Body: { "text": "Bonjour", "targetLang": "ar" }
     */
    @PostMapping("/text")
    public ResponseEntity<TranslateResponse> translateText(
            @Valid @RequestBody TranslateTextRequest request) {

        validateLang(request.getTargetLang());

        String translated = translationService.translate(
                request.getText(), request.getSourceLang(), request.getTargetLang());

        return ResponseEntity.ok(TranslateResponse.builder()
                .originalText(request.getText())
                .translatedText(translated)
                .sourceLang(request.getSourceLang())
                .targetLang(request.getTargetLang())
                .provider("api")
                .fromCache(false)
                .build());
    }

    // ─── 2. Get property with translated fields ──────────────────────────────

    /**
     * GET /api/translate/property/{id}?lang=ar
     * Also reads Accept-Language header as fallback.
     *
     * Response:
     * {
     *   "id": 1, "lang": "ar",
     *   "translations": {
     *     "title": "شقة عصرية في الدار البيضاء",
     *     "description": "...",
     *     "city": "الدار البيضاء"
     *   }
     * }
     */
    @GetMapping("/property/{id}")
    public ResponseEntity<Map<String, Object>> getPropertyTranslated(
            @PathVariable Long id,
            @RequestParam(defaultValue = "fr") String lang,
            @RequestHeader(value = "Accept-Language", required = false) String acceptLang) {

        String targetLang = resolveLanguage(lang, acceptLang);

        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + id));

        Map<String, String> fields = buildPropertyFields(property);
        Map<String, String> translated = translationService.translateFields(
                "property", id, fields, targetLang);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", id);
        response.put("lang", targetLang);
        response.put("translations", translated);
        return ResponseEntity.ok(response);
    }

    // ─── 3. Get agent with translated fields ─────────────────────────────────

    /**
     * GET /api/translate/agent/{id}?lang=en
     */
    @GetMapping("/agent/{id}")
    public ResponseEntity<Map<String, Object>> getAgentTranslated(
            @PathVariable Long id,
            @RequestParam(defaultValue = "fr") String lang,
            @RequestHeader(value = "Accept-Language", required = false) String acceptLang) {

        String targetLang = resolveLanguage(lang, acceptLang);

        Agent agent = agentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found: " + id));

        Map<String, String> fields = new LinkedHashMap<>();
        if (agent.getBio()  != null) fields.put("bio",  agent.getBio());
        if (agent.getCity() != null) fields.put("city", agent.getCity());

        Map<String, String> translated = translationService.translateFields(
                "agent", id, fields, targetLang);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", id);
        response.put("lang", targetLang);
        response.put("translations", translated);
        return ResponseEntity.ok(response);
    }

    // ─── 4. Force re-translate a specific field ──────────────────────────────

    /**
     * POST /api/translate/property/{id}/retranslate?fieldName=description&lang=ar
     * (Admin only — use when content has been updated)
     */
    @PostMapping("/property/{id}/retranslate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> retranslatePropertyField(
            @PathVariable Long id,
            @RequestParam String fieldName,
            @RequestParam String lang) {

        validateLang(lang);

        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Property not found: " + id));

        String originalText = getPropertyField(property, fieldName);
        String result = translationService.retranslateField("property", id, fieldName, originalText, lang);

        return ResponseEntity.ok(Map.of(
                "propertyId", id,
                "fieldName",  fieldName,
                "lang",       lang,
                "translated", result
        ));
    }

    // ─── 5. Evict all translations for an entity (Admin) ────────────────────

    /**
     * DELETE /api/translate/{entityType}/{entityId}
     * e.g. DELETE /api/translate/property/42
     * Clears DB + Caffeine cache — triggers re-translation on next request.
     */
    @DeleteMapping("/{entityType}/{entityId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> evictTranslations(
            @PathVariable String entityType,
            @PathVariable Long entityId) {

        translationService.evictEntityTranslations(entityType, entityId);
        return ResponseEntity.ok(Map.of(
                "message", "Translations evicted for " + entityType + "/" + entityId,
                "entityType", entityType,
                "entityId", entityId
        ));
    }

    // ─── 6. Supported languages ──────────────────────────────────────────────

    /** GET /api/translate/languages */
    @GetMapping("/languages")
    public ResponseEntity<Object> getSupportedLanguages() {
        var langs = Arrays.stream(Language.values())
                .map(l -> Map.of("code", l.getCode(), "name", l.getName()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(langs);
    }

    // ─── 7. Translation statistics (Admin) ───────────────────────────────────

    /** GET /api/translate/stats */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalTranslations",    translationRepository.count());
        stats.put("translationsInEnglish", translationRepository.countByTargetLang("en"));
        stats.put("translationsInArabic",  translationRepository.countByTargetLang("ar"));
        stats.put("viaLingva",             translationRepository.countByTranslationSource("lingva"));
        stats.put("viaMyMemory",           translationRepository.countByTranslationSource("mymemory"));
        stats.put("distinctEntities",      translationRepository.countDistinctEntities());
        return ResponseEntity.ok(stats);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────

    private String resolveLanguage(String langParam, String acceptLang) {
        // 1. Query param wins
        if (langParam != null && !langParam.isBlank() && Language.isSupported(langParam)) {
            return langParam.toLowerCase();
        }
        // 2. Accept-Language header
        if (acceptLang != null && !acceptLang.isBlank()) {
            String primary = acceptLang.split("[,;]")[0].trim();
            if (primary.length() >= 2) {
                String code = primary.substring(0, 2).toLowerCase();
                if (Language.isSupported(code)) return code;
            }
        }
        // 3. Default: French
        return "fr";
    }

    private void validateLang(String lang) {
        if (!Language.isSupported(lang)) {
            throw new BadRequestException(
                    "Unsupported language '" + lang + "'. Supported: fr, en, ar");
        }
    }

    private Map<String, String> buildPropertyFields(Property property) {
        Map<String, String> fields = new LinkedHashMap<>();
        if (property.getTitle()        != null) fields.put("title",        property.getTitle());
        if (property.getDescription()  != null) fields.put("description",  property.getDescription());
        if (property.getCity()         != null) fields.put("city",         property.getCity());
        if (property.getNeighborhood() != null) fields.put("neighborhood", property.getNeighborhood());
        return fields;
    }

    private String getPropertyField(Property property, String fieldName) {
        return switch (fieldName) {
            case "title"        -> property.getTitle();
            case "description"  -> property.getDescription();
            case "city"         -> property.getCity();
            case "neighborhood" -> property.getNeighborhood();
            default -> throw new BadRequestException("Unknown field: " + fieldName
                    + ". Allowed: title, description, city, neighborhood");
        };
    }
}
