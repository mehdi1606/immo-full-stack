package com.clubicode.mmomarocback.service.impl;

import com.clubicode.mmomarocback.dto.response.UploadResponse;
import com.clubicode.mmomarocback.exception.BadRequestException;
import com.clubicode.mmomarocback.exception.FileStorageException;
import com.clubicode.mmomarocback.service.FileValidationService;
import com.clubicode.mmomarocback.service.IFileStorageService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Stores and deletes uploaded files on the local filesystem.
 *
 * <h3>Security measures</h3>
 * <ol>
 *   <li><b>Content-type validation</b> — delegated to {@link FileValidationService} which
 *       uses Apache Tika to read magic bytes and detect the real MIME type.
 *       The file extension claimed by the client is completely ignored.</li>
 *   <li><b>UUID storage name</b> — the name written to disk is always
 *       {@code <UUID>.<detectedExtension>}, never the original filename.</li>
 *   <li><b>Canonical path check</b> — the resolved target path is compared with
 *       the upload root via {@link File#getCanonicalPath()} to catch any
 *       path-traversal attempt that survives {@link Path#normalize()}.</li>
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageServiceImpl implements IFileStorageService {

    private final FileValidationService fileValidationService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    private Path   uploadPath;
    private String uploadCanonical; // cached canonical path of the upload root

    @PostConstruct
    public void init() {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadPath);
            this.uploadCanonical = uploadPath.toFile().getCanonicalPath();
            log.info("Upload directory initialized: {}", uploadCanonical);
        } catch (IOException ex) {
            throw new FileStorageException("Could not initialize upload directory: " + uploadPath, ex);
        }
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    @Override
    public UploadResponse storeFile(MultipartFile file) {

        // ── 1. Full validation (size + real MIME type via Tika) ───────────────
        //    Returns a safe UUID-based storage name with extension derived from
        //    the detected MIME type — original filename is never used on disk.
        String storageName = fileValidationService.validateAndBuildStorageName(file);

        // ── 2. Canonical-path check — defence-in-depth against path traversal ─
        //    Path.normalize() catches ".." in string form but File.getCanonicalPath()
        //    also resolves symlinks and OS-specific quirks.
        Path targetPath = uploadPath.resolve(storageName).normalize();
        assertInsideUploadDir(targetPath, storageName);

        // ── 3. Write to disk ──────────────────────────────────────────────────
        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new FileStorageException("Failed to store uploaded file", ex);
        }

        String sanitizedDisplayName = fileValidationService.sanitizeFilename(file.getOriginalFilename());
        log.info("[FileStorage] Stored '{}' as '{}' ({})",
                sanitizedDisplayName, storageName, file.getContentType());

        return UploadResponse.builder()
                .url("/uploads/" + storageName)
                .filename(storageName)
                .build();
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Override
    public void deleteFile(String filename) {

        // Sanitize the caller-supplied name before building the path
        String safeName = fileValidationService.sanitizeFilename(filename);

        Path targetPath = uploadPath.resolve(safeName).normalize();

        // Double-check with both startsWith (fast) and canonical path (thorough)
        if (!targetPath.startsWith(uploadPath)) {
            log.warn("[FileStorage] Path traversal attempt rejected for filename: '{}'", filename);
            throw new BadRequestException("Chemin de fichier invalide.");
        }
        assertInsideUploadDir(targetPath, filename);

        try {
            boolean deleted = Files.deleteIfExists(targetPath);
            if (deleted) {
                log.info("[FileStorage] Deleted file: '{}'", safeName);
            } else {
                log.warn("[FileStorage] File not found for deletion: '{}'", safeName);
            }
        } catch (IOException ex) {
            throw new FileStorageException("Failed to delete file: " + safeName, ex);
        }
    }

    // ── Generate avatar ───────────────────────────────────────────────────────

    @Override
    public String storeGeneratedAvatar(String svgContent) {
        String filename = UUID.randomUUID() + ".svg";
        Path targetPath = uploadPath.resolve(filename).normalize();
        try {
            Files.writeString(targetPath, svgContent, StandardCharsets.UTF_8);
            log.info("[FileStorage] Generated avatar stored as '{}'", filename);
        } catch (IOException ex) {
            throw new FileStorageException("Failed to store generated avatar", ex);
        }
        return "/uploads/" + filename;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Verifies that {@code target} is inside the upload root directory using the
     * canonical (symlink-resolved, OS-normalised) path. Throws
     * {@link BadRequestException} if the check fails.
     *
     * <p>This is a defence-in-depth complement to {@link Path#normalize()} — it
     * protects against symlink-based escapes and OS path quirks that survive
     * normalisation.
     */
    private void assertInsideUploadDir(Path target, String label) {
        try {
            String targetCanonical = target.toFile().getCanonicalPath();
            // Append separator so "/uploads/img" does not falsely "start with" "/uploads/im"
            if (!targetCanonical.startsWith(uploadCanonical + File.separator)
                    && !targetCanonical.equals(uploadCanonical)) {
                log.warn("[FileStorage] Path-traversal blocked — target='{}', root='{}'",
                        targetCanonical, uploadCanonical);
                throw new BadRequestException("Chemin de fichier invalide.");
            }
        } catch (IOException ex) {
            throw new FileStorageException("Cannot resolve canonical path for: " + label, ex);
        }
    }
}
