package com.clubicode.mmomarocback.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TranslateResponse {

    private String originalText;
    private String translatedText;
    private String sourceLang;
    private String targetLang;

    /** Which provider produced this translation: "libretranslate", "mymemory", "cache", "db" */
    private String provider;

    /** true if returned from Caffeine in-memory cache */
    private boolean fromCache;
}
