package com.clubicode.mmomarocback.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageInfoResponse {

    /** Stored filename (UUID-prefixed) */
    private String filename;

    /** Relative URL: /uploads/{filename} */
    private String url;

    /** File size in bytes */
    private Long sizeBytes;

    /** Last modified time of the file on disk */
    private LocalDateTime uploadedAt;

    /** true = referenced in property_images or agent avatar */
    private boolean linked;

    /**
     * What uses this image: "property", "agent", or null when orphaned.
     * Multiple uses are joined with a comma, e.g. "property,agent".
     */
    private String linkedTo;
}
