package com.clubicode.mmomarocback.config.translation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

/**
 * Primary translation provider — MyMemory free public API.
 *
 * Why MyMemory instead of Lingva:
 *  - Uses query params (?q=text) → NO URL-path encoding issues
 *  - Handles French accents, em-dashes, Arabic correctly
 *  - No setup required, no Docker, no API key
 *
 * Free limits:
 *  - 5,000  chars/day  (no email)
 *  - 10,000 chars/day  (with email in app.translation.mymemory.email)
 *
 * With DB + Caffeine cache, same text is NEVER translated twice.
 * Daily limit in practice is rarely hit.
 */
@Slf4j
@Component
public class MyMemoryClient implements TranslationApiClient {

    @Value("${app.translation.mymemory.email:noreply@immomaroc.ma}")
    private String email;

    // No RestClient.Builder injection — avoids the Spring Boot 4 auto-config issue.
    // RestClient.create(baseUrl) is equivalent and has zero dependencies.
    private final RestClient restClient;

    public MyMemoryClient(
            @Value("${app.translation.mymemory.url:https://api.mymemory.translated.net}") String baseUrl) {
        this.restClient = RestClient.create(baseUrl);
    }

    @Override
    @SuppressWarnings("unchecked")
    public String translate(String text, String sourceLang, String targetLang) {
        if (text == null || text.isBlank()) return text;

        // Trim to MyMemory's safe limit per request (500 chars for free tier reliability)
        String safeText = text.length() > 500 ? text.substring(0, 500) : text;

        String langPair = sourceLang + "|" + targetLang;

        // UriComponentsBuilder properly encodes query params — no path-encoding issues
        // Only append &de= when email is set (empty email = no benefit, may trigger errors)
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.fromPath("/get")
                .queryParam("q", safeText)
                .queryParam("langpair", langPair);
        if (email != null && !email.isBlank()) {
            uriBuilder.queryParam("de", email);
        }
        String uri = uriBuilder.build().toUriString();

        Map<String, Object> response = restClient.get()
                .uri(uri)
                .retrieve()
                .body(Map.class);

        if (response == null) {
            throw new RuntimeException("[MyMemory] null response");
        }

        Object statusObj = response.get("responseStatus");
        int status;
        if (statusObj instanceof Number n) {
            status = n.intValue();
        } else if (statusObj instanceof String s) {
            try { status = Integer.parseInt(s); } catch (NumberFormatException e) { status = 0; }
        } else {
            status = 0;
        }

        if (status != 200) {
            throw new RuntimeException("[MyMemory] API error (status=" + status + "): "
                    + response.get("responseDetails"));
        }

        Map<String, Object> data = (Map<String, Object>) response.get("responseData");
        if (data == null || data.get("translatedText") == null) {
            throw new RuntimeException("[MyMemory] missing responseData.translatedText");
        }

        String translated = (String) data.get("translatedText");

        // Quota exceeded warning
        if (translated.startsWith("MYMEMORY WARNING")) {
            throw new RuntimeException("[MyMemory] daily quota exceeded: " + translated);
        }

        log.debug("[MyMemory] {}→{} | {} chars → OK", sourceLang, targetLang, safeText.length());
        return translated;
    }

    @Override public String getProviderName() { return "mymemory"; }
    @Override public int    getPriority()     { return 1; } // Primary provider
}
