package com.clubicode.mmomarocback.scheduler;

import com.clubicode.mmomarocback.entity.Property;
import com.clubicode.mmomarocback.enums.PropertyStatus;
import com.clubicode.mmomarocback.repository.PropertyRepository;
import com.clubicode.mmomarocback.service.IEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Runs every day at 08:00 and checks for listings that have been
 * VENDU or LOUE for more than 30 days.
 * If any are found, the admin receives an email digest listing them.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExpiredListingsScheduler {

    private final PropertyRepository propertyRepository;
    private final IEmailService      emailService;

    private static final int EXPIRY_DAYS = 30;

    @Scheduled(cron = "0 0 8 * * *")   // every day at 08:00
    public void notifyExpiredListings() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(EXPIRY_DAYS);
        List<Property> expired = propertyRepository.findExpiredListings(threshold);

        if (expired.isEmpty()) {
            log.info("[Scheduler] No expired listings found today.");
            return;
        }

        log.info("[Scheduler] {} expired listing(s) found — notifying admin.", expired.size());
        emailService.sendExpiredListingsNotificationToAdmin(expired);
    }
}
