package com.clubicode.mmomarocback.controller;

import com.clubicode.mmomarocback.entity.Property;
import com.clubicode.mmomarocback.entity.PropertyImage;
import com.clubicode.mmomarocback.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/og")
@RequiredArgsConstructor
public class OgController {

    private final PropertyRepository propertyRepository;

    @Value("${app.base-url:http://localhost:8090}")
    private String baseUrl;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Returns an HTML page with Open Graph meta tags for WhatsApp / social previews.
     * WhatsApp's crawler reads the OG tags → shows the rich card.
     * Real users are immediately redirected to the React SPA.
     */
    @Transactional(readOnly = true)
    @GetMapping(value = "/property/{id}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> propertyOgPage(@PathVariable Long id) {

        String redirectUrl = frontendUrl + "/propriete/" + id;

        // ── defaults (fallback if property not found) ──────────────────────
        String title       = "IMMO 21 – Annonce immobilière";
        String description = "Découvrez cette annonce sur IMMO 21, la plateforme immobilière au Maroc.";
        String imageUrl    = baseUrl + "/img/og-default.jpg";

        // ── load property ───────────────────────────────────────────────────
        Property property = propertyRepository.findById(id).orElse(null);

        if (property != null) {

            // Title: "Appartement 3 pièces – Casablanca"
            title = property.getTitle() != null ? property.getTitle() : title;
            if (property.getCity() != null && !property.getCity().isBlank()) {
                title += " – " + property.getCity();
            }

            // Description: price · raw description
            StringBuilder desc = new StringBuilder();
            if (property.getPrice() != null) {
                long p = property.getPrice().longValue();
                // Format price with spaces: 1 250 000 DH
                desc.append(formatNumber(p)).append(" DH");
                if (property.getPurpose() != null &&
                        "LOCATION".equalsIgnoreCase(property.getPurpose().name())) {
                    desc.append("/mois");
                }
                desc.append(" · ");
            }
            if (property.getDescription() != null && !property.getDescription().isBlank()) {
                String raw = property.getDescription().trim();
                desc.append(raw, 0, Math.min(raw.length(), 130));
                if (raw.length() > 130) desc.append("…");
            } else {
                desc.append("Annonce disponible sur IMMO 21.");
            }
            description = desc.toString();

            // Image: prefer main image, fall back to first
            if (property.getImages() != null && !property.getImages().isEmpty()) {
                PropertyImage img = property.getImages().stream()
                        .filter(i -> Boolean.TRUE.equals(i.getIsMain()))
                        .findFirst()
                        .orElse(property.getImages().get(0));

                String rawUrl = img.getUrl();
                // If the stored URL already starts with http, use as-is; otherwise prefix uploads/
                if (rawUrl != null && rawUrl.startsWith("http")) {
                    imageUrl = rawUrl;
                } else if (rawUrl != null) {
                    imageUrl = baseUrl + "/uploads/" + rawUrl;
                }
            }
        }

        String html = buildHtml(title, description, imageUrl, redirectUrl);

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(html);
    }

    // ── helpers ─────────────────────────────────────────────────────────────

    private String buildHtml(String title, String description,
                              String imageUrl, String redirectUrl) {
        String t   = esc(title);
        String d   = esc(description);
        String img = esc(imageUrl);
        String url = esc(redirectUrl);

        return "<!DOCTYPE html>\n"
             + "<html lang=\"fr\">\n"
             + "<head>\n"
             + "  <meta charset=\"utf-8\" />\n"
             + "  <title>" + t + "</title>\n"
             + "\n"
             + "  <!-- Open Graph -->\n"
             + "  <meta property=\"og:type\"        content=\"website\" />\n"
             + "  <meta property=\"og:site_name\"   content=\"IMMO 21\" />\n"
             + "  <meta property=\"og:title\"       content=\"" + t   + "\" />\n"
             + "  <meta property=\"og:description\" content=\"" + d   + "\" />\n"
             + "  <meta property=\"og:image\"       content=\"" + img + "\" />\n"
             + "  <meta property=\"og:image:width\"  content=\"1200\" />\n"
             + "  <meta property=\"og:image:height\" content=\"630\" />\n"
             + "  <meta property=\"og:url\"         content=\"" + url + "\" />\n"
             + "\n"
             + "  <!-- Twitter / WhatsApp fallback -->\n"
             + "  <meta name=\"twitter:card\"        content=\"summary_large_image\" />\n"
             + "  <meta name=\"twitter:title\"       content=\"" + t   + "\" />\n"
             + "  <meta name=\"twitter:description\" content=\"" + d   + "\" />\n"
             + "  <meta name=\"twitter:image\"       content=\"" + img + "\" />\n"
             + "\n"
             + "  <!-- Instant redirect for real users -->\n"
             + "  <meta http-equiv=\"refresh\" content=\"0;url=" + url + "\" />\n"
             + "</head>\n"
             + "<body>\n"
             + "  <script>window.location.replace('" + esc(redirectUrl) + "');</script>\n"
             + "  <p>Redirection… <a href=\"" + url + "\">Cliquez ici</a></p>\n"
             + "</body>\n"
             + "</html>\n";
    }

    /** Format a long number with space separators: 1250000 → "1 250 000" */
    private String formatNumber(long n) {
        String s   = Long.toString(n);
        StringBuilder sb = new StringBuilder();
        int rem = s.length() % 3;
        for (int i = 0; i < s.length(); i++) {
            if (i != 0 && (i - rem) % 3 == 0) sb.append(' ');
            sb.append(s.charAt(i));
        }
        return sb.toString();
    }

    /** Escape HTML special chars for safe embedding in attributes / text. */
    private String esc(String text) {
        if (text == null) return "";
        return text
                .replace("&",  "&amp;")
                .replace("<",  "&lt;")
                .replace(">",  "&gt;")
                .replace("\"", "&quot;")
                .replace("'",  "&#39;");
    }
}
