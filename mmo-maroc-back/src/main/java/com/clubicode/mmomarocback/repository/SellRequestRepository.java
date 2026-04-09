package com.clubicode.mmomarocback.repository;

import com.clubicode.mmomarocback.entity.SellRequest;
import com.clubicode.mmomarocback.enums.SellRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SellRequestRepository extends JpaRepository<SellRequest, Long> {

    List<SellRequest> findByStatus(SellRequestStatus status);

    List<SellRequest> findAllByOrderByCreatedAtDesc();
}
