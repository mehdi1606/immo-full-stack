package com.clubicode.mmomarocback.config.translation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;


/**
 * DISABLED — Lingva URL-encodes the path segment which corrupts special chars
 * (é, à, —, etc.) in the translation output.
 * MyMemoryClient (query-param based) is used instead.
 *
 * To re-enable: add @Component back.
 */
@Slf4j
public class LingvaTranslateClient implements TranslationApiClient {

    @Value("${app.translation.lingva.instances:https://lingva.ml,https://translate.plausibility.social,https://lingva.garudalinux.org}")
    private String instancesConfig;

    private final RestClient restClient;

    public LingvaTranslateClient(RestClient.Builder builder) {
        this.restClient = builder.build();
    }

    @Override
    @SuppressWarnings("unchecked")
    public String translate(String text, String sourceLang, String targetLang) {
        List<String> instances = List.of(instancesConfig.split(","));

        Exception lastException = null;

        for (String baseUrl : instances) {
            String instance = baseUrl.trim();
            try {
                // URL-encode the text so special chars (é, à, ç, spaces) are safe
                String encodedText = UriUtils.encodePath(text, StandardCharsets.UTF_8);

                String url = instance + "/api/v1/" + sourceLang + "/" + targetLang + "/" + encodedText;

                Map<String, Object> response = restClient.get()
                        .uri(url)
                        .retrieve()
                        .body(Map.class);

                if (response == null || !response.containsKey("translation")) {
                    log.warn("[Lingva] Instance {} returned no 'translation' field", instance);
                    continue;
                }

                String translated = (String) response.get("translation");
                if (translated == null || translated.isBlank()) {
                    log.warn("[Lingva] Instance {} returned empty translation", instance);
                    continue;
                }

                log.debug("[Lingva] {} → {} via {} | {} chars",
                        sourceLang, targetLang, instance, text.length());
                return translated;

            } catch (Exception e) {
                lastException = e;
                log.warn("[Lingva] Instance {} failed: {}", instance, e.getMessage());
                // Try next instance
            }
        }

        throw new RuntimeException(
                "All Lingva instances failed. Last error: " +
                (lastException != null ? lastException.getMessage() : "unknown"), lastException);
    }

    @Override public String getProviderName() { return "lingva"; }
    @Override public int    getPriority()     { return 1; }
}
