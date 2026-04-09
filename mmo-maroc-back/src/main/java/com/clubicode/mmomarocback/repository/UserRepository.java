package com.clubicode.mmomarocback.repository;

import com.clubicode.mmomarocback.entity.User;
import com.clubicode.mmomarocback.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByStatus(UserStatus status);
}
