package com.clubicode.mmomarocback.service;

import java.util.List;
import java.util.Map;

public interface ITranslationService {

    /**
     * Translate any text directly (no entity tracking, no DB persistence).
     */
    String translate(String text, String sourceLang, String targetLang);

    /**
     * Translate a single field of an entity.
     * Flow: Caffeine → DB → API → save → return.
     */
    String translateField(String entityType, Long entityId, String fieldName,
                          String originalText, String targetLang);

    /**
     * HIGH-PERFORMANCE batch translation:
     *  1. ONE DB query fetches all existing translations for this entity+lang
     *  2. Missing fields are translated IN PARALLEL (CompletableFuture)
     *  3. All new translations saved in a single batch DB write
     *  4. Caffeine cache updated for each new entry
     *
     * Result: first call ≈ 1-3s (parallel), every repeat call ≈ 0ms (cache).
     *
     * @param fields map of { fieldName → originalFrenchText }
     * @return       map of { fieldName → translatedText }
     */
    Map<String, String> translateFieldsBatch(String entityType, Long entityId,
                                             Map<String, String> fields, String targetLang);

    /**
     * @deprecated Use translateFieldsBatch() for better performance.
     */
    @Deprecated
    Map<String, String> translateFields(String entityType, Long entityId,
                                        Map<String, String> fields, String targetLang);

    /**
     * Force re-translation, bypassing all cache layers.
     * Use when original content changes.
     */
    String retranslateField(String entityType, Long entityId, String fieldName,
                            String originalText, String targetLang);

    /**
     * Eagerly pre-translate a property into ALL languages (EN + AR) in the background.
     * Call after createProperty() / updateProperty() so first GET is instant.
     *
     * Runs @Async — returns immediately, translation happens in background thread.
     */
    void preTranslateProperty(Long propertyId, String title, String description,
                              String city, String neighborhood, List<String> features);

    /**
     * Delete all translations for entity from DB + evict Caffeine cache.
     */
    void evictEntityTranslations(String entityType, Long entityId);
}
