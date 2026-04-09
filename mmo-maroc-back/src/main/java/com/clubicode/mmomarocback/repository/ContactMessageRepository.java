package com.clubicode.mmomarocback.repository;

import com.clubicode.mmomarocback.entity.ContactMessage;
import com.clubicode.mmomarocback.enums.ContactMessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {

    List<ContactMessage> findAllByOrderByCreatedAtDesc();

    List<ContactMessage> findByStatusOrderByCreatedAtDesc(ContactMessageStatus status);
}
