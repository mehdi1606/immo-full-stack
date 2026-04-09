package com.clubicode.mmomarocback.controller;

import com.clubicode.mmomarocback.entity.User;
import com.clubicode.mmomarocback.service.SseNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Server-Sent Events endpoints for real-time notifications.
 *
 * JWT is passed as ?token=<jwt> because the browser's native EventSource
 * API cannot send custom request headers. JwtAuthFilter extracts it from
 * the query string as a fallback.
 *
 *  ADMIN → GET /api/notifications/stream        (all leads + sell-requests)
 *  AGENT → GET /api/notifications/agent/stream  (only this agent's leads)
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final SseNotificationService sseService;

    /** Admin: receives ALL leads and sell-requests in real time. */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public SseEmitter adminStream(
            @RequestParam(value = "clientId", required = false) String clientId) {
        return sseService.subscribeAdmin(clientId);
    }

    /** Agent: receives only leads assigned to this agent's properties. */
    @GetMapping(value = "/agent/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('AGENT')")
    public SseEmitter agentStream(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(value = "clientId", required = false) String clientId) {
        return sseService.subscribeAgent(currentUser.getId(), clientId);
    }
}
