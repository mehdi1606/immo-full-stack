package com.clubicode.mmomarocback.repository;

import com.clubicode.mmomarocback.entity.Lead;
import com.clubicode.mmomarocback.enums.LeadStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {

    @EntityGraph(attributePaths = {"property", "agent", "agent.user"})
    List<Lead> findByPropertyAgentId(Long agentId);

    @EntityGraph(attributePaths = {"property", "agent", "agent.user"})
    List<Lead> findByPropertyAgentIdAndStatus(Long agentId, LeadStatus status);

    @EntityGraph(attributePaths = {"property", "agent", "agent.user"})
    List<Lead> findByStatus(LeadStatus status);

    @EntityGraph(attributePaths = {"property", "agent", "agent.user"})
    List<Lead> findAllByOrderByCreatedAtDesc();
}
