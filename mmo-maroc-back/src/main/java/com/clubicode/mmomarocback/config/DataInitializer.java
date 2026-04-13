package com.clubicode.mmomarocback.config;

import com.clubicode.mmomarocback.entity.User;
import com.clubicode.mmomarocback.enums.Role;
import com.clubicode.mmomarocback.enums.UserStatus;
import com.clubicode.mmomarocback.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        for (int attempt = 1; attempt <= 10; attempt++) {
            try {
                if (!userRepository.existsByEmail("admin@immomaroc.ma")) {
                    User admin = User.builder()
                            .name("Administrateur ImmoMaroc")
                            .email("admin@immomaroc.ma")
                            .password(passwordEncoder.encode("admin123"))
                            .role(Role.ADMIN)
                            .status(UserStatus.ACTIVE)
                            .build();
                    userRepository.save(admin);
                    log.info("✅ Admin user created — email: admin@immomaroc.ma | password: admin123");
                } else {
                    log.info("ℹ️  Admin user already exists, skipping seed.");
                }
                return;
            } catch (Exception e) {
                log.warn("⚠️  DataInitializer attempt {}/10 failed (DB not ready?): {}", attempt, e.getMessage());
                try { Thread.sleep(3000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); return; }
            }
        }
        log.error("❌ DataInitializer failed after 10 attempts — admin user not created.");
    }
}
