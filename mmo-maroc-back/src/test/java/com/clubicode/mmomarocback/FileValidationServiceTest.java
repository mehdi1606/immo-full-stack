package com.clubicode.mmomarocback;

import com.clubicode.mmomarocback.exception.BadRequestException;
import com.clubicode.mmomarocback.service.FileValidationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for {@link FileValidationService}.
 *
 * Uses tiny but real magic-byte sequences so Apache Tika detects the correct
 * MIME type without needing a full valid image file.
 *
 * No Spring context, no DB, no filesystem writes — pure in-memory unit tests.
 */
class FileValidationServiceTest {

    // ── Real magic-byte sequences ─────────────────────────────────────────────

    /** JPEG: SOI marker FF D8 FF E0 followed by JFIF signature */
    private static final byte[] JPEG_MAGIC = {
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0,
            0x00, 0x10, 'J', 'F', 'I', 'F', 0x00
    };

    /** PNG: 8-byte PNG signature */
    private static final byte[] PNG_MAGIC = {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    };

    /** GIF: GIF89a header */
    private static final byte[] GIF_MAGIC = {
            'G', 'I', 'F', '8', '9', 'a'
    };

    /** HTML: DOCTYPE declaration (disguised as photo.jpg) */
    private static final byte[] HTML_BYTES =
            "<!DOCTYPE html><html><body>XSS</body></html>".getBytes();

    /** PHP source (disguised as photo.jpg) */
    private static final byte[] PHP_BYTES =
            "<?php system($_GET['cmd']); ?>".getBytes();

    // ── SUT ───────────────────────────────────────────────────────────────────

    private FileValidationService sut;

    @BeforeEach
    void setUp() {
        sut = new FileValidationService();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // validateAndBuildStorageName
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("validateAndBuildStorageName()")
    class ValidateAndBuildStorageName {

        @Test
        @DisplayName("JPEG bytes → accepted, returns UUID.jpg")
        void jpeg_accepted() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "photo.jpg", "image/jpeg", JPEG_MAGIC);

            String name = sut.validateAndBuildStorageName(file);

            assertThat(name).matches("[0-9a-f-]{36}\\.jpg");
        }

        @Test
        @DisplayName("PNG bytes → accepted, returns UUID.png")
        void png_accepted() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "image.png", "image/png", PNG_MAGIC);

            String name = sut.validateAndBuildStorageName(file);

            assertThat(name).matches("[0-9a-f-]{36}\\.png");
        }

        @Test
        @DisplayName("GIF bytes → accepted, returns UUID.gif")
        void gif_accepted() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "anim.gif", "image/gif", GIF_MAGIC);

            String name = sut.validateAndBuildStorageName(file);

            assertThat(name).matches("[0-9a-f-]{36}\\.gif");
        }

        @Test
        @DisplayName("HTML bytes named photo.jpg → rejected (real type is text/html)")
        void htmlDisguisedAsJpeg_rejected() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "photo.jpg", "image/jpeg", HTML_BYTES);

            assertThatThrownBy(() -> sut.validateAndBuildStorageName(file))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Type de fichier non autorisé");
        }

        @Test
        @DisplayName("PHP bytes named photo.jpg → rejected (real type is text/x-php or text/plain)")
        void phpDisguisedAsJpeg_rejected() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "photo.jpg", "image/jpeg", PHP_BYTES);

            assertThatThrownBy(() -> sut.validateAndBuildStorageName(file))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Type de fichier non autorisé");
        }

        @Test
        @DisplayName("Empty file → rejected")
        void emptyFile_rejected() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "photo.jpg", "image/jpeg", new byte[0]);

            assertThatThrownBy(() -> sut.validateAndBuildStorageName(file))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("vide");
        }

        @Test
        @DisplayName("Null file → rejected")
        void nullFile_rejected() {
            assertThatThrownBy(() -> sut.validateAndBuildStorageName(null))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("vide");
        }

        @Test
        @DisplayName("File exceeding 10 MB → rejected")
        void oversizedFile_rejected() {
            byte[] oversized = new byte[(int) FileValidationService.MAX_FILE_SIZE + 1];
            // Fill with JPEG magic so it's not rejected for wrong type first
            System.arraycopy(JPEG_MAGIC, 0, oversized, 0, JPEG_MAGIC.length);

            MockMultipartFile file = new MockMultipartFile(
                    "file", "huge.jpg", "image/jpeg", oversized);

            assertThatThrownBy(() -> sut.validateAndBuildStorageName(file))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("10");
        }

        @Test
        @DisplayName("Extension in original filename is ignored — storage extension comes from MIME")
        void extensionDerivedFromMime_notFromFilename() {
            // File has PNG magic bytes but caller claims it is a .jpg file
            MockMultipartFile file = new MockMultipartFile(
                    "file", "trick.jpg", "image/jpeg", PNG_MAGIC);

            String name = sut.validateAndBuildStorageName(file);

            // Storage extension must reflect the real MIME (png), not the claim (jpg)
            assertThat(name).endsWith(".png");
        }

        @Test
        @DisplayName("Each call returns a distinct UUID-based filename")
        void uniqueNamesGenerated() {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "photo.jpg", "image/jpeg", JPEG_MAGIC);

            String name1 = sut.validateAndBuildStorageName(file);
            String name2 = sut.validateAndBuildStorageName(file);

            assertThat(name1).isNotEqualTo(name2);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // sanitizeFilename
    // ─────────────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("sanitizeFilename()")
    class SanitizeFilename {

        @Test
        @DisplayName("Normal filename passes through unchanged")
        void normalFilename_unchanged() {
            assertThat(sut.sanitizeFilename("photo.jpg")).isEqualTo("photo.jpg");
        }

        @Test
        @DisplayName("Path traversal sequences are neutralized")
        void pathTraversal_neutralized() {
            String result = sut.sanitizeFilename("../../etc/passwd");
            assertThat(result).doesNotContain("..").doesNotContain("/");
        }

        @Test
        @DisplayName("Windows-style path separators are removed")
        void windowsPathSeparators_removed() {
            String result = sut.sanitizeFilename("C:\\Windows\\evil.exe");
            assertThat(result).doesNotContain("\\").doesNotContain(":");
        }

        @Test
        @DisplayName("Special characters replaced with underscore")
        void specialChars_replaced() {
            String result = sut.sanitizeFilename("my file (1)<2>.jpg");
            assertThat(result).matches("[a-zA-Z0-9._-]+");
        }

        @Test
        @DisplayName("Filename longer than 100 chars is truncated")
        void longFilename_truncated() {
            String long100 = "a".repeat(150) + ".jpg";
            String result = sut.sanitizeFilename(long100);
            assertThat(result).hasSizeLessThanOrEqualTo(FileValidationService.MAX_FILENAME_LENGTH);
        }

        @Test
        @DisplayName("Null input returns 'file'")
        void nullInput_returnsDefault() {
            assertThat(sut.sanitizeFilename(null)).isEqualTo("file");
        }

        @Test
        @DisplayName("Blank input returns 'file'")
        void blankInput_returnsDefault() {
            assertThat(sut.sanitizeFilename("   ")).isEqualTo("file");
        }

        @Test
        @DisplayName("Leading dots removed (would create hidden Unix files)")
        void leadingDots_removed() {
            String result = sut.sanitizeFilename(".hidden");
            assertThat(result).doesNotStartWith(".");
        }
    }
}
