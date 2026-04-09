package com.clubicode.mmomarocback.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.annotation.Nonnull;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servlet filter that enforces IP-based rate limiting on the login endpoint.
 *
 * <p>Algorithm: token bucket (Bucket4j, in-memory)
 * <ul>
 *   <li>Each unique client IP gets its own bucket.</li>
 *   <li>Bucket capacity: {@value CAPACITY} tokens — refilled every {@value REFILL_MINUTES} minute(s).</li>
 *   <li>Exceeding the limit returns HTTP 429 with a JSON body before any
 *       authentication logic runs.</li>
 * </ul>
 *
 * <p>IP resolution priority:
 * <ol>
 *   <li>{@code X-Forwarded-For} header (first hop when behind a reverse proxy)</li>
 *   <li>{@link HttpServletRequest#getRemoteAddr()} as fallback</li>
 * </ol>
 *
 * <p>Registered in {@link SecurityConfig} <em>before</em> {@link JwtAuthFilter}
 * so the request never reaches authentication logic when rate-limited.
 */
@Slf4j
@Component
@Order(1) // run as early as possible in the filter chain
public class RateLimitFilter extends OncePerRequestFilter {

    // ── Configuration ─────────────────────────────────────────────────────────
    public static final String LOGIN_PATH     = "/api/auth/login";
    public static final int    CAPACITY       = 5;
    public static final int    REFILL_MINUTES = 1;

    // ── State ─────────────────────────────────────────────────────────────────
    // One Bucket per unique client IP. ConcurrentHashMap + computeIfAbsent
    // guarantees that no two threads ever create a bucket for the same IP.
    final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    // ── Filter logic ──────────────────────────────────────────────────────────

    @Override
    protected void doFilterInternal(@Nonnull HttpServletRequest  request,
                                    @Nonnull HttpServletResponse response,
                                    @Nonnull FilterChain         chain)
            throws ServletException, IOException {

        // Only rate-limit POST /api/auth/login — all other paths pass through.
        // Check both getServletPath() (production) and getRequestURI() (MockMvc / tests)
        // because standaloneSetup leaves servletPath empty and sets requestURI instead.
        boolean isLoginPath = LOGIN_PATH.equals(request.getServletPath())
                           || LOGIN_PATH.equals(request.getRequestURI());
        if (!HttpMethod.POST.name().equalsIgnoreCase(request.getMethod()) || !isLoginPath) {
            chain.doFilter(request, response);
            return;
        }

        String ip     = resolveClientIp(request);
        Bucket bucket = buckets.computeIfAbsent(ip, k -> buildBucket());

        if (bucket.tryConsume(1)) {
            // Token consumed — proceed normally
            chain.doFilter(request, response);
        } else {
            // Bucket empty — client is rate-limited
            log.warn("[RateLimit] IP {} exceeded {} login attempts per {} min — 429 returned",
                    ip, CAPACITY, REFILL_MINUTES);
            // Use requestURI (never blank) as the path in the error body
            writeTooManyRequests(response, request.getRequestURI());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Builds a new bucket: {@value CAPACITY} tokens, refilled greedily
     * ({@value REFILL_MINUTES} token per minute up to capacity).
     */
    private Bucket buildBucket() {
        Bandwidth limit = Bandwidth.builder()
                .capacity(CAPACITY)
                .refillGreedy(CAPACITY, Duration.ofMinutes(REFILL_MINUTES))
                .build();
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Returns the real client IP, preferring the first value of
     * {@code X-Forwarded-For} (set by load balancers / reverse proxies).
     */
    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // "client, proxy1, proxy2" — first entry is the originating IP
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Writes an HTTP 429 JSON response directly to the servlet output stream,
     * bypassing Spring MVC (no exception thrown — the response is already committed).
     * Uses string formatting instead of ObjectMapper to avoid a Jackson dependency.
     */
    private void writeTooManyRequests(HttpServletResponse response, String path)
            throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");

        // Manual JSON — values are hard-coded constants, no escaping risk
        String body = String.format(
                "{\"status\":429,\"error\":\"Too Many Requests\","
                + "\"message\":\"Trop de tentatives. R\\u00e9essayez dans 1 minute.\","
                + "\"path\":\"%s\"}",
                path.replace("\"", "\\\""));   // path-traversal-safe escape

        response.getWriter().write(body);
    }
}
