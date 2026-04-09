package com.clubicode.mmomarocback.config.translation;

/**
 * Contract for all translation providers.
 * Implementations: LibreTranslateClient (priority 1), MyMemoryClient (priority 2).
 * The service iterates them in priority order; first success wins.
 */
public interface TranslationApiClient {

    /**
     * Translate text from sourceLang → targetLang.
     * @throws RuntimeException if the provider fails (service will try next)
     */
    String translate(String text, String sourceLang, String targetLang);

    /** Human-readable provider name stored in DB for auditing */
    String getProviderName();

    /**
     * Lower number = tried first.
     * LibreTranslate = 1 (primary, self-hosted, unlimited)
     * MyMemory       = 2 (fallback, public free API)
     */
    int getPriority();
}
