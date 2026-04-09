package com.clubicode.mmomarocback.repository;

import com.clubicode.mmomarocback.entity.Translation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TranslationRepository extends JpaRepository<Translation, Long> {

    /** Primary lookup — used before calling any external API */
    Optional<Translation> findByEntityTypeAndEntityIdAndFieldNameAndTargetLang(
            String entityType, Long entityId, String fieldName, String targetLang);

    /** Get all translations of an entity in a specific language */
    List<Translation> findByEntityTypeAndEntityIdAndTargetLang(
            String entityType, Long entityId, String targetLang);

    /** Called when entity content changes → must re-translate */
    @Modifying
    @Query("DELETE FROM Translation t WHERE t.entityType = :entityType AND t.entityId = :entityId")
    void deleteByEntityTypeAndEntityId(
            @Param("entityType") String entityType,
            @Param("entityId") Long entityId);

    /** Stats */
    long countByTargetLang(String targetLang);
    long countByTranslationSource(String translationSource);

    @Query("SELECT COUNT(DISTINCT CONCAT(t.entityType, '-', t.entityId)) FROM Translation t")
    long countDistinctEntities();
}
