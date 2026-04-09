package com.clubicode.mmomarocback.controller;

import com.clubicode.mmomarocback.dto.response.UploadResponse;
import com.clubicode.mmomarocback.service.IFileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {

    private final IFileStorageService fileStorageService;

    @PostMapping("/image")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
    public ResponseEntity<UploadResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(fileStorageService.storeFile(file));
    }

    @DeleteMapping("/{filename}")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
    public ResponseEntity<Void> deleteFile(@PathVariable String filename) {
        fileStorageService.deleteFile(filename);
        return ResponseEntity.noContent().build();
    }
}
