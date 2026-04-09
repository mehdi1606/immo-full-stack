package com.clubicode.mmomarocback.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Language {

    FR("fr", "Français"),
    EN("en", "English"),
    AR("ar", "العربية");

    private final String code;
    private final String name;

    /** Resolve a language code to enum, defaulting to FR if unknown. */
    public static Language fromCode(String code) {
        if (code == null || code.isBlank()) return FR;
        for (Language lang : values()) {
            if (lang.code.equalsIgnoreCase(code)) return lang;
        }
        return FR;
    }

    public static boolean isSupported(String code) {
        if (code == null) return false;
        for (Language lang : values()) {
            if (lang.code.equalsIgnoreCase(code)) return true;
        }
        return false;
    }
}
