package com.clubicode.mmomarocback.service;

import com.clubicode.mmomarocback.dto.response.NotificationPayload;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Manages two SSE channels:
 *
 *  1. ADMIN channel  — all admin browser tabs, receives every lead + sell-request
 *  2. AGENT channel  — per-agent connections keyed by userId,
 *                      each agent only receives notifications for their own leads
 *
 * No Jackson / no external dependencies — payload serialized manually.
 */
@Slf4j
@Service
public class SseNotificationService {

    /** Admin connections: clientId → SseEmitter */
    private final Map<String, SseEmitter> adminEmitters = new ConcurrentHashMap<>();

    /** Agent connections: "userId:clientId" → SseEmitter */
    private final Map<String, SseEmitter> agentEmitters = new ConcurrentHashMap<>();

    // ── Admin channel ─────────────────────────────────────────────────────────

    public SseEmitter subscribeAdmin(String clientId) {
        String id = resolveId(clientId);
        SseEmitter emitter = buildEmitter(id, adminEmitters);
        log.info("SSE ADMIN connected: {} | total={}", id, adminEmitters.size());
        return emitter;
    }

    /** Broadcast to every connected admin tab. */
    public void broadcast(NotificationPayload payload) {
        sendToMap(adminEmitters, toJson(payload), payload.type());
    }

    // ── Agent channel ─────────────────────────────────────────────────────────

    /**
     * Subscribe an agent browser tab.
     *
     * @param agentUserId the User.id of the authenticated agent
     * @param clientId    optional browser-tab identifier for multi-tab support
     */
    public SseEmitter subscribeAgent(Long agentUserId, String clientId) {
        String key = agentUserId + ":" + resolveId(clientId);
        SseEmitter emitter = buildEmitter(key, agentEmitters);
        log.info("SSE AGENT connected: userId={} key={} | total={}", agentUserId, key, agentEmitters.size());
        return emitter;
    }

    /**
     * Send a notification only to the agent identified by agentUserId.
     * Targets all open tabs of that agent (keys start with "userId:").
     */
    public void broadcastToAgent(Long agentUserId, NotificationPayload payload) {
        if (agentEmitters.isEmpty()) return;
        String prefix  = agentUserId + ":";
        String json    = toJson(payload);
        List<String> dead = new ArrayList<>();

        agentEmitters.forEach((key, emitter) -> {
            if (!key.startsWith(prefix)) return;
            try {
                emitter.send(SseEmitter.event().name("notification").data(json));
            } catch (IOException e) {
                dead.add(key);
            }
        });

        dead.forEach(agentEmitters::remove);
        log.info("Notification → agent userId={} [{}]", agentUserId, payload.type());
    }

    // ── Shared helpers ────────────────────────────────────────────────────────

    private static String resolveId(String clientId) {
        return (clientId != null && !clientId.isBlank()) ? clientId : UUID.randomUUID().toString();
    }

    private static SseEmitter buildEmitter(String key, Map<String, SseEmitter> map) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);

        emitter.onCompletion(() -> { map.remove(key); log.debug("SSE done: {}", key); });
        emitter.onTimeout(()    -> { map.remove(key); log.debug("SSE timeout: {}", key); });
        emitter.onError(ex     -> { map.remove(key); log.debug("SSE error ({}): {}", key, ex.getMessage()); });

        map.put(key, emitter);

        try {
            emitter.send(SseEmitter.event().comment("connected").id(key));
        } catch (IOException e) {
            map.remove(key);
        }
        return emitter;
    }

    private static void sendToMap(Map<String, SseEmitter> map, String json, String type) {
        if (map.isEmpty()) return;
        List<String> dead = new ArrayList<>();
        map.forEach((id, emitter) -> {
            try {
                emitter.send(SseEmitter.event().name("notification").data(json));
            } catch (IOException e) {
                dead.add(id);
            }
        });
        if (!dead.isEmpty()) {
            dead.forEach(map::remove);
            log.debug("Removed {} dead SSE clients", dead.size());
        }
        log.info("Broadcast [{}] to {} clients", type, map.size());
    }

    // ── JSON serialization (no Jackson) ──────────────────────────────────────

    private static String toJson(NotificationPayload p) {
        return "{"
                + "\"type\":"      + jsonStr(p.type())    + ","
                + "\"id\":"        + p.id()               + ","
                + "\"name\":"      + jsonStr(p.name())     + ","
                + "\"subject\":"   + jsonStr(p.subject())  + ","
                + "\"timestamp\":" + jsonStr(p.timestamp() != null ? p.timestamp().toString() : "")
                + "}";
    }

    private static String jsonStr(String value) {
        if (value == null) return "null";
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
