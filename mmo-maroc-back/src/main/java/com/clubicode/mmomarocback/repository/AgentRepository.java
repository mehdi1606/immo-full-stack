package com.clubicode.mmomarocback.repository;

import com.clubicode.mmomarocback.entity.Agent;
import com.clubicode.mmomarocback.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentRepository extends JpaRepository<Agent, Long> {

    @Query("SELECT a FROM Agent a WHERE a.user.status = :status")
    List<Agent> findByUserStatus(@Param("status") UserStatus status);

    @Query("SELECT a FROM Agent a WHERE a.user.status = :status AND a.city = :city")
    List<Agent> findByUserStatusAndCity(@Param("status") UserStatus status, @Param("city") String city);

    Optional<Agent> findByUserId(Long userId);

    @Query("SELECT COUNT(a) FROM Agent a WHERE a.user.status = :status")
    long countByUserStatus(@Param("status") UserStatus status);

    @Query("SELECT a FROM Agent a ORDER BY a.sold DESC, SIZE(a.properties) DESC")
    List<Agent> findTopAgentsBySold(org.springframework.data.domain.Pageable pageable);

    /** Admin: all agents regardless of status, newest first */
    @Query("SELECT a FROM Agent a ORDER BY a.id DESC")
    List<Agent> findAllByOrderByIdDesc();

    /** Return all non-null avatar paths (used by image management to detect linked files) */
    @Query("SELECT a.avatar FROM Agent a WHERE a.avatar IS NOT NULL AND a.avatar <> ''")
    List<String> findAllAvatarPaths();
}
