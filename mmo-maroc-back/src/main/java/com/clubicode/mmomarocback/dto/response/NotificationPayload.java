package com.clubicode.mmomarocback.dto.response;

import java.time.LocalDateTime;

/**
 * Lightweight payload pushed to admin clients via Server-Sent Events.
 */
public record NotificationPayload(
        String type,        // "LEAD" | "SELL_REQUEST"
        Long   id,
        String name,        // contact's name
        String subject,     // property title (lead) or city (sell request)
        LocalDateTime timestamp
) {}
