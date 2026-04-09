package com.clubicode.mmomarocback.config.translation;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

/**
 * Fallback translation provider — Google Translate unofficial endpoint.
 *
 * Uses the public `gtx` client endpoint — no API key required,
 * no daily hard limit for reasonable usage.
 *
 * Priority: 2 (used only when MyMemory fails or hits its quota)
 *
 * Response format: nested JSON arrays
 *   [[["translatedText","sourceText",null,null,1],...],null,"fr",...]
 *   → join all translated segments from index [0][*][0]
 */
@Slf4j
@Component
public class GoogleFreeTranslateClient implements TranslationApiClient {

    private static final String BASE_URL = "https://translate.googleapis.com";

    private final RestClient restClient = RestClient.create(BASE_URL);

    @Override
    @SuppressWarnings("unchecked")
    public String translate(String text, String sourceLang, String targetLang) {
        if (text == null || text.isBlank()) return text;

        String uri = UriComponentsBuilder.fromPath("/translate_a/single")
                .queryParam("client", "gtx")
                .queryParam("sl", sourceLang)
                .queryParam("tl", targetLang)
                .queryParam("dt", "t")
                .queryParam("q", text)
                .build()
                .toUriString();

        // The response is a nested array — use List<Object> to parse
        List<Object> response = restClient.get()
                .uri(uri)
                .retrieve()
                .body(new ParameterizedTypeReference<List<Object>>() {});

        if (response == null || response.isEmpty()) {
            throw new RuntimeException("[GoogleFree] null or empty response");
        }

        // response[0] = list of translation segments [[translated, original, ...], ...]
        Object segmentsRaw = response.get(0);
        if (!(segmentsRaw instanceof List<?> segments)) {
            throw new RuntimeException("[GoogleFree] unexpected response format");
        }

        StringBuilder sb = new StringBuilder();
        for (Object seg : segments) {
            if (seg instanceof List<?> part && !part.isEmpty() && part.get(0) instanceof String s) {
                sb.append(s);
            }
        }

        String result = sb.toString().trim();
        if (result.isEmpty()) {
            throw new RuntimeException("[GoogleFree] empty translated text");
        }

        log.debug("[GoogleFree] {}→{} | {} chars → OK", sourceLang, targetLang, text.length());
        return result;
    }

    @Override public String getProviderName() { return "google-free"; }
    @Override public int    getPriority()     { return 2; } // Fallback after MyMemory
}
