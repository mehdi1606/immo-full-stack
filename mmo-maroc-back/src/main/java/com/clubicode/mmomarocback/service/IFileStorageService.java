package com.clubicode.mmomarocback.service;

import com.clubicode.mmomarocback.dto.response.UploadResponse;
import org.springframework.web.multipart.MultipartFile;

public interface IFileStorageService {

    UploadResponse storeFile(MultipartFile file);

    void deleteFile(String filename);

    /**
     * Writes pre-generated text content (e.g. an SVG avatar) directly to the
     * upload directory and returns its public URL ({@code /uploads/<uuid>.svg}).
     *
     * <p>This bypasses the file-upload validation pipeline because the content
     * is server-generated, not user-supplied.</p>
     *
     * @param svgContent  the SVG markup to persist
     * @return            the public URL of the stored file
     */
    String storeGeneratedAvatar(String svgContent);
}
