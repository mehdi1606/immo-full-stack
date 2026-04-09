package com.clubicode.mmomarocback.repository;

import com.clubicode.mmomarocback.entity.Property;
import com.clubicode.mmomarocback.enums.PropertyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long>, JpaSpecificationExecutor<Property> {

    @Modifying
    @Query("UPDATE Property p SET p.views = p.views + 1 WHERE p.id = :id")
    void incrementViews(@Param("id") Long id);

    List<Property> findByFeaturedTrueAndStatus(PropertyStatus status);

    List<Property> findByAgentId(Long agentId);

    long countByStatus(PropertyStatus status);

    @Query("SELECT SUM(p.views) FROM Property p")
    Long sumAllViews();

    @Query("SELECT COUNT(p) FROM Property p WHERE p.createdAt >= :since")
    long countCreatedSince(@Param("since") LocalDateTime since);

    @Query("SELECT p.city, COUNT(p) FROM Property p GROUP BY p.city ORDER BY COUNT(p) DESC")
    List<Object[]> countByCity();

    @Query("SELECT p.type, COUNT(p) FROM Property p GROUP BY p.type ORDER BY COUNT(p) DESC")
    List<Object[]> countByType();

    /**
     * Listings that have been VENDU or LOUE for longer than the given threshold date.
     * These are candidates for admin review / deletion.
     */
    @Query("SELECT p FROM Property p WHERE p.status IN ('VENDU', 'LOUE') AND p.statusChangedAt IS NOT NULL AND p.statusChangedAt <= :threshold")
    List<Property> findExpiredListings(@Param("threshold") LocalDateTime threshold);

    @Query(value = "SELECT EXTRACT(MONTH FROM created_at), EXTRACT(YEAR FROM created_at), COUNT(*) " +
            "FROM properties WHERE created_at >= :since " +
            "GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at) " +
            "ORDER BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)", nativeQuery = true)
    List<Object[]> countByMonth(@Param("since") LocalDateTime since);
}
