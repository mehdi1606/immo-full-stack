package com.clubicode.mmomarocback.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TranslateTextRequest {

    @NotBlank(message = "Text is required")
    @Size(max = 5000, message = "Text must not exceed 5000 characters")
    private String text;

    /** Source language code — defaults to French */
    private String sourceLang = "fr";

    /** Target language code: "en" or "ar" */
    @NotBlank(message = "Target language is required (en, ar, fr)")
    private String targetLang;
}
