package com.clubicode.mmomarocback.controller;

import com.clubicode.mmomarocback.dto.response.ImageInfoResponse;
import com.clubicode.mmomarocback.exception.BadRequestException;
import com.clubicode.mmomarocback.repository.AgentRepository;
import com.clubicode.mmomarocback.repository.PropertyImageRepository;
import com.clubicode.mmomarocback.service.IFileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Admin-only: scans the upload directory and cross-references with the database
 * to surface orphaned images (uploaded but not linked to any property or agent).
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/images")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class ImageManagementController {

    private final PropertyImageRepository propertyImageRepository;
    private final AgentRepository         agentRepository;
    private final IFileStorageService     fileStorageService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    /* ── List all uploaded files ─────────────────────────────────────────── */

    /**
     * GET /api/admin/images?orphanOnly=false
     * Returns every file found in the upload directory, annotated with linked/orphaned status.
     */
    @GetMapping
    public ResponseEntity<List<ImageInfoResponse>> listImages(
            @RequestParam(defaultValue = "false") boolean orphanOnly) throws IOException {

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

        // All URLs currently stored in property_images
        Set<String> propertyUrls = propertyImageRepository.findAllUrls();

        // All avatar paths stored in agents
        Set<String> avatarPaths = new HashSet<>(agentRepository.findAllAvatarPaths());

        List<ImageInfoResponse> result = new ArrayList<>();

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(uploadPath)) {
            for (Path file : stream) {
                if (Files.isDirectory(file)) continue;

                String filename = file.getFileName().toString();
                String url      = "/uploads/" + filename;

                BasicFileAttributes attrs = Files.readAttributes(file, BasicFileAttributes.class);
                long sizeBytes = attrs.size();
                LocalDateTime uploadedAt = LocalDateTime.ofInstant(
                        attrs.lastModifiedTime().toInstant(), ZoneId.systemDefault());

                boolean inPropertyImages = propertyUrls.contains(url);
                boolean inAgentAvatar    = avatarPaths.contains(url);
                boolean linked           = inPropertyImages || inAgentAvatar;

                if (orphanOnly && linked) continue;

                List<String> linkedTo = new ArrayList<>();
                if (inPropertyImages) linkedTo.add("property");
                if (inAgentAvatar)    linkedTo.add("agent");

                result.add(ImageInfoResponse.builder()
                        .filename(filename)
                        .url(url)
                        .sizeBytes(sizeBytes)
                        .uploadedAt(uploadedAt)
                        .linked(linked)
                        .linkedTo(linkedTo.isEmpty() ? null : String.join(",", linkedTo))
                        .build());
            }
        }

        // Newest files first
        result.sort(Comparator.comparing(ImageInfoResponse::getUploadedAt).reversed());
        return ResponseEntity.ok(result);
    }

    /* ── Delete a single file ────────────────────────────────────────────── */

    /**
     * DELETE /api/admin/images/{filename}
     * Permanently deletes the physical file. The DB cascade handles property_images rows.
     */
    @DeleteMapping("/{filename}")
    public ResponseEntity<Void> deleteImage(@PathVariable String filename) {
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new BadRequestException("Invalid filename");
        }
        fileStorageService.deleteFile(filename);
        log.info("[Admin] Image deleted: {}", filename);
        return ResponseEntity.noContent().build();
    }

    /* ── Bulk delete ─────────────────────────────────────────────────────── */

    /**
     * POST /api/admin/images/bulk-delete
     * Body: { "filenames": ["abc.jpg", "xyz.png"] }
     * Deletes each file in the list; silently skips files that no longer exist.
     */
    @PostMapping("/bulk-delete")
    public ResponseEntity<Map<String, Object>> bulkDelete(@RequestBody Map<String, List<String>> body) {
        List<String> filenames = body.getOrDefault("filenames", Collections.emptyList());
        int deleted = 0;
        List<String> failed  = new ArrayList<>();

        for (String filename : filenames) {
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                failed.add(filename);
                continue;
            }
            try {
                fileStorageService.deleteFile(filename);
                deleted++;
            } catch (Exception e) {
                log.warn("[Admin] Could not delete {}: {}", filename, e.getMessage());
                failed.add(filename);
            }
        }
        log.info("[Admin] Bulk delete: {} deleted, {} failed", deleted, failed.size());

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("deleted", deleted);
        resp.put("failed", failed);
        return ResponseEntity.ok(resp);
    }
}
