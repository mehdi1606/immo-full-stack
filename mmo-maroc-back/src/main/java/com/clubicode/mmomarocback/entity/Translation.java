package com.clubicode.mmomarocback.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Stores translated versions of any entity field.
 * Key = (entityType + entityId + fieldName + targetLang)
 *
 * Example row:
 *   entityType  = "property"
 *   entityId    = 42
 *   fieldName   = "description"
 *   sourceLang  = "fr"
 *   targetLang  = "ar"
 *   originalText    = "Appartement moderne..."
 *   translatedText  = "شقة عصرية..."
 *   translationSource = "libretranslate"
 */
@Entity
@Table(
    name = "translations",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_translation_key",
        columnNames = {"entity_type", "entity_id", "field_name", "target_lang"}
    ),
    indexes = {
        @Index(name = "idx_translation_lookup",  columnList = "entity_type, entity_id, target_lang"),
        @Index(name = "idx_translation_lang",    columnList = "target_lang"),
        @Index(name = "idx_translation_source",  columnList = "translation_source")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(of = {"id", "entityType", "entityId", "fieldName", "targetLang"})
@EqualsAndHashCode(of = "id")
public class Translation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** e.g. "property", "agent" */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    /** e.g. 42 (property ID) */
    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    /** e.g. "title", "description", "city", "neighborhood" */
    @Column(name = "field_name", nullable = false, length = 100)
    private String fieldName;

    /** always "fr" in this project */
    @Column(name = "source_lang", nullable = false, length = 5)
    private String sourceLang;

    /** "en" or "ar" */
    @Column(name = "target_lang", nullable = false, length = 5)
    private String targetLang;

    @Column(name = "original_text", nullable = false, columnDefinition = "TEXT")
    private String originalText;

    @Column(name = "translated_text", nullable = false, columnDefinition = "TEXT")
    private String translatedText;

    /** "libretranslate", "mymemory", or "manual" */
    @Column(name = "translation_source", length = 50)
    private String translationSource;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
