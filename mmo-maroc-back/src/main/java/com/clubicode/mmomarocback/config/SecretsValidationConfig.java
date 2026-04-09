package com.clubicode.mmomarocback.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.ArrayList;
import java.util.List;

/**
 * Validates that all required secrets are present and well-formed when the
 * application starts in the "prod" Spring profile.
 *
 * Activation: set the environment variable  SPRING_PROFILES_ACTIVE=prod
 *
 * If any check fails the application refuses to start and logs a clear,
 * human-readable error instead of silently using empty / insecure values.
 */
@Configuration
@Profile("prod")
public class SecretsValidationConfig {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Value("${spring.mail.username}")
    private String mailUsername;

    @Value("${spring.mail.password}")
    private String mailPassword;

    @Value("${app.cors.allowed-origins}")
    private String corsOrigins;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${app.admin.email}")
    private String adminEmail;

    @PostConstruct
    public void validateSecrets() {
        List<String> errors = new ArrayList<>();

        // ── JWT ──────────────────────────────────────────────────────────────
        if (isBlank(jwtSecret)) {
            errors.add("JWT_SECRET is not set");
        } else if (jwtSecret.length() < 32) {
            errors.add("JWT_SECRET must be at least 32 characters (256 bits). "
                    + "Current length: " + jwtSecret.length()
                    + ". Generate one with:  openssl rand -base64 48");
        } else if (jwtSecret.startsWith("immoMarocDEV")) {
            errors.add("JWT_SECRET still uses the development placeholder — "
                    + "replace it with a real secret in production");
        }

        // ── Database ─────────────────────────────────────────────────────────
        if (isBlank(dbUrl)) {
            errors.add("DB_URL is not set (e.g. jdbc:postgresql://host:5432/immomaroc)");
        }
        if (isBlank(dbUsername)) {
            errors.add("DB_USERNAME is not set");
        }
        if (isBlank(dbPassword)) {
            errors.add("DB_PASSWORD is not set");
        } else if ("0000".equals(dbPassword)) {
            errors.add("DB_PASSWORD is still the local-dev default '0000' — use a strong password in production");
        }

        // ── Mail ─────────────────────────────────────────────────────────────
        if (isBlank(mailUsername)) {
            errors.add("MAIL_USERNAME is not set — email notifications will not work");
        }
        if (isBlank(mailPassword)) {
            errors.add("MAIL_PASSWORD is not set — email notifications will not work");
        }

        // ── CORS ─────────────────────────────────────────────────────────────
        if (isBlank(corsOrigins)) {
            errors.add("CORS_ALLOWED_ORIGINS is not set (e.g. https://immomaroc.ma)");
        } else if (corsOrigins.contains("localhost")) {
            errors.add("CORS_ALLOWED_ORIGINS still points to localhost — set it to your real domain");
        }

        // ── Upload dir ───────────────────────────────────────────────────────
        if (isBlank(uploadDir)) {
            errors.add("UPLOAD_DIR is not set (e.g. /var/immomaroc/uploads/)");
        }

        // ── Admin email ──────────────────────────────────────────────────────
        if (isBlank(adminEmail)) {
            errors.add("ADMIN_EMAIL is not set");
        }

        // ── Report ───────────────────────────────────────────────────────────
        if (!errors.isEmpty()) {
            String separator = "\n  ✗ ";
            throw new IllegalStateException(
                "\n\n" +
                "╔══════════════════════════════════════════════════════════════╗\n" +
                "║   ImmoMaroc — PRODUCTION STARTUP FAILURE                    ║\n" +
                "║   The following required environment variables are missing   ║\n" +
                "║   or invalid. Fix them before restarting the application.   ║\n" +
                "╚══════════════════════════════════════════════════════════════╝" +
                separator + String.join(separator, errors) +
                "\n\n  See .env.example for setup instructions.\n"
            );
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
