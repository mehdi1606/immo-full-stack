package com.clubicode.mmomarocback.service;

import com.clubicode.mmomarocback.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

/**
 * Validates and sanitizes uploaded files before they are written to disk.
 *
 * <h3>Why Tika instead of trusting the filename or Content-Type header?</h3>
 * <p>A client can trivially rename {@code evil.php} to {@code photo.jpg} or set any
 * {@code Content-Type} header they like. Apache Tika reads the actual bytes of the
 * file (magic-byte / file-header inspection) to determine the real MIME type,
 * independent of what the client claims. This is the only reliable defence.</p>
 *
 * <h3>Storage name strategy</h3>
 * <p>The filename written to disk is always {@code UUID.extension} where the
 * extension is derived from the <em>detected</em> MIME type, never from the
 * original filename. This prevents extension-spoofing and removes any user-
 * controlled data from the filesystem path.</p>
 */
@Slf4j
@Service
public class FileValidationService {

    // ── Configuration ─────────────────────────────────────────────────────────

    /** Absolute maximum file size accepted by this endpoint (10 MiB). */
    public static final long MAX_FILE_SIZE = 10L * 1024 * 1024;

    /** Maximum number of characters kept from a sanitized display filename. */
    public static final int MAX_FILENAME_LENGTH = 100;

    /**
     * Allowlist: real MIME type → canonical file extension used for storage.
     * Any MIME type not present here is rejected.
     */
    static final Map<String, String> ALLOWED_MIME_TO_EXTENSION = Map.of(
            "image/jpeg", "jpg",
            "image/png",  "png",
            "image/webp", "webp",
            "image/gif",  "gif"
    );

    // ── Tika instance — thread-safe, reusable ─────────────────────────────────
    // Tika.detect() reads only the first few hundred bytes (magic-byte pattern)
    // and does NOT parse the full file, keeping latency negligible.
    private final Tika tika = new Tika();

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Validates {@code file} and returns a safe storage filename.
     *
     * <p>Checks performed (in order):
     * <ol>
     *   <li>File is present and not empty.</li>
     *   <li>File size ≤ {@value MAX_FILE_SIZE} bytes (10 MiB).</li>
     *   <li>Real MIME type (detected from byte content) is in the allowlist.</li>
     * </ol>
     *
     * @param file the uploaded file
     * @return a collision-free storage filename of the form {@code <UUID>.<ext>}
     *         where {@code <ext>} is derived from the detected MIME type
     * @throws BadRequestException if any validation check fails
     */
    public String validateAndBuildStorageName(MultipartFile file) {

        // ── 1. Presence ───────────────────────────────────────────────────────
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Le fichier ne doit pas être vide.");
        }

        // ── 2. Size ───────────────────────────────────────────────────────────
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException(
                    "La taille du fichier dépasse la limite de 10 Mo.");
        }

        // ── 3. Real MIME type (magic-byte detection, ignores filename/header) ─
        String detectedMime = detectMimeType(file);
        String extension    = ALLOWED_MIME_TO_EXTENSION.get(detectedMime);

        if (extension == null) {
            log.warn("[FileValidation] Rejected upload — detected MIME: '{}', claimed name: '{}'",
                    detectedMime, file.getOriginalFilename());
            throw new BadRequestException(
                    "Type de fichier non autorisé. Seuls JPG, PNG, WebP et GIF sont acceptés.");
        }

        // ── 4. Build storage name from UUID + detected extension ──────────────
        String storageName = UUID.randomUUID() + "." + extension;
        log.debug("[FileValidation] Accepted upload — MIME: '{}', stored as: '{}'",
                detectedMime, storageName);
        return storageName;
    }

    /**
     * Sanitizes a user-supplied display filename so it can be logged or returned
     * in responses without risk of log injection or path traversal.
     *
     * <p>Rules applied:
     * <ul>
     *   <li>Strip any directory component (e.g. {@code ../../etc/passwd} → {@code passwd}).</li>
     *   <li>Replace every character that is not {@code [a-zA-Z0-9._-]} with {@code _}.</li>
     *   <li>Truncate to {@value MAX_FILENAME_LENGTH} characters.</li>
     * </ul>
     *
     * <p><b>Note:</b> this name is only used for display/logging purposes.
     * It is <em>never</em> used as the actual on-disk filename — that role is
     * fulfilled by the UUID-based name returned from
     * {@link #validateAndBuildStorageName}.
     *
     * @param filename the raw filename supplied by the client
     * @return a safe, human-readable display name (never blank)
     */
    public String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "file";
        }

        // Strip any directory component the client might have injected
        // (e.g. "../../etc/passwd" or "C:\\Windows\\system32\\cmd.exe")
        String name = filename
                .replaceAll("[/\\\\]", "_")   // replace separators first
                .replaceAll("\\.\\.", "_");    // neutralise ".." sequences

        // Keep only filesystem-safe characters
        name = name.replaceAll("[^a-zA-Z0-9._-]", "_");

        // Remove leading dots (would create hidden files on Unix)
        name = name.replaceAll("^\\.+", "_");

        // Truncate
        return name.length() > MAX_FILENAME_LENGTH
                ? name.substring(0, MAX_FILENAME_LENGTH)
                : name;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Detects the real MIME type by reading the file's magic bytes via Apache Tika.
     * Uses {@link MultipartFile#getBytes()} so the underlying stream is not consumed,
     * leaving a fresh {@link MultipartFile#getInputStream()} available for storage.
     */
    private String detectMimeType(MultipartFile file) {
        try {
            // getBytes() reads the full file into memory (already bounded by the 10 MB check).
            // tika.detect(byte[]) inspects magic-byte patterns without parsing the full content.
            byte[] bytes = file.getBytes();
            return tika.detect(bytes);
        } catch (IOException e) {
            log.warn("[FileValidation] Could not read file bytes for MIME detection: {}", e.getMessage());
            throw new BadRequestException("Impossible de lire le fichier téléversé.");
        }
    }
}
