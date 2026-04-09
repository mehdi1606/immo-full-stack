package com.clubicode.mmomarocback;

import com.clubicode.mmomarocback.config.RateLimitFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for {@link RateLimitFilter}.
 *
 * Uses a standalone MockMvc (no Spring context, no DB) so the suite runs fast
 * in any environment. The filter is instantiated directly and wired into a
 * minimal dispatcher with no controllers — requests that pass the filter return
 * HTTP 404 (no matching route), while blocked ones return HTTP 429.
 */
class RateLimitFilterTest {

    /** Unique test IP to avoid cross-test bucket pollution. */
    private static final String TEST_IP = "10.99.88.77";

    private MockMvc         mockMvc;
    private RateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter  = new RateLimitFilter();
        // Standalone setup — no controllers registered; requests that clear the
        // filter will receive 404. That is fine: we only care about 429 vs non-429.
        mockMvc = MockMvcBuilders
                .standaloneSetup()   // no controllers
                .addFilters(filter)
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Performs a POST /api/auth/login from {@value TEST_IP} using remoteAddr. */
    private void postLogin() throws Exception {
        mockMvc.perform(
                post(RateLimitFilter.LOGIN_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@example.com\",\"password\":\"wrong\"}")
                        .with(req -> { req.setRemoteAddr(TEST_IP); return req; })
        ).andReturn(); // don't assert status here — caller decides
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("First 5 login attempts must NOT be rate-limited")
    void first5Attempts_shouldNotBeRateLimited() throws Exception {
        for (int i = 1; i <= RateLimitFilter.CAPACITY; i++) {
            int status = mockMvc.perform(
                    post(RateLimitFilter.LOGIN_PATH)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"test@example.com\",\"password\":\"x\"}")
                            .with(req -> { req.setRemoteAddr(TEST_IP); return req; })
            ).andReturn().getResponse().getStatus();

            assertNotEquals(429, status,
                    "Attempt " + i + " should NOT be rate-limited (got 429 too early)");
        }
    }

    @Test
    @DisplayName("6th login attempt from the same IP must return 429")
    void sixthAttempt_shouldReturn429() throws Exception {
        // Exhaust the bucket (5 tokens)
        for (int i = 0; i < RateLimitFilter.CAPACITY; i++) {
            postLogin();
        }

        // 6th attempt — bucket empty → rate-limited
        mockMvc.perform(
                post(RateLimitFilter.LOGIN_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"test@example.com\",\"password\":\"wrong\"}")
                        .with(req -> { req.setRemoteAddr(TEST_IP); return req; })
        )
        .andExpect(status().is(429))
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
        .andExpect(jsonPath("$.status").value(429))
        .andExpect(jsonPath("$.error").value("Too Many Requests"))
        .andExpect(jsonPath("$.message").value("Trop de tentatives. Réessayez dans 1 minute."))
        .andExpect(jsonPath("$.path").value(RateLimitFilter.LOGIN_PATH)); // requestURI in test
    }

    @Test
    @DisplayName("X-Forwarded-For header is used as client IP (proxy support)")
    void xForwardedFor_shouldBeUsedAsClientIp() throws Exception {
        String proxyIp = "203.0.113.55"; // RFC 5737 documentation IP — safe to use in tests

        // Exhaust bucket for proxyIp
        for (int i = 0; i < RateLimitFilter.CAPACITY; i++) {
            mockMvc.perform(
                    post(RateLimitFilter.LOGIN_PATH)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"x@x.com\",\"password\":\"x\"}")
                            .header("X-Forwarded-For", proxyIp)
                            .with(req -> { req.setRemoteAddr("127.0.0.1"); return req; })
            ).andReturn();
        }

        // 6th from same X-Forwarded-For → 429
        mockMvc.perform(
                post(RateLimitFilter.LOGIN_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"x@x.com\",\"password\":\"x\"}")
                        .header("X-Forwarded-For", proxyIp)
                        .with(req -> { req.setRemoteAddr("127.0.0.1"); return req; })
        ).andExpect(status().is(429));
    }

    @Test
    @DisplayName("Different IPs get independent buckets — IP A limit doesn't affect IP B")
    void differentIps_haveIndependentBuckets() throws Exception {
        String ipA = "1.2.3.4";
        String ipB = "5.6.7.8";

        // Exhaust ipA's bucket
        for (int i = 0; i < RateLimitFilter.CAPACITY; i++) {
            mockMvc.perform(
                    post(RateLimitFilter.LOGIN_PATH)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}")
                            .with(req -> { req.setRemoteAddr(ipA); return req; })
            ).andReturn();
        }

        // ipA is now rate-limited
        mockMvc.perform(
                post(RateLimitFilter.LOGIN_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .with(req -> { req.setRemoteAddr(ipA); return req; })
        ).andExpect(status().is(429));

        // ipB must still be allowed through (different bucket)
        int ipBStatus = mockMvc.perform(
                post(RateLimitFilter.LOGIN_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .with(req -> { req.setRemoteAddr(ipB); return req; })
        ).andReturn().getResponse().getStatus();

        assertNotEquals(429, ipBStatus, "IP B should NOT be rate-limited by IP A's exhausted bucket");
    }

    @Test
    @DisplayName("Non-login endpoints are never rate-limited")
    void nonLoginEndpoints_areNeverRateLimited() throws Exception {
        // Fire many GET requests to a non-login path
        for (int i = 0; i < RateLimitFilter.CAPACITY + 10; i++) {
            int status = mockMvc.perform(
                    get("/api/properties")
                            .with(req -> { req.setRemoteAddr(TEST_IP); return req; })
            ).andReturn().getResponse().getStatus();

            assertNotEquals(429, status,
                    "Non-login endpoint should never return 429 (got it on attempt " + i + ")");
        }
    }

    @Test
    @DisplayName("POST to non-login path is not rate-limited")
    void postToNonLoginPath_isNotRateLimited() throws Exception {
        for (int i = 0; i < RateLimitFilter.CAPACITY + 5; i++) {
            int status = mockMvc.perform(
                    post("/api/leads")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}")
                            .with(req -> { req.setRemoteAddr(TEST_IP); return req; })
            ).andReturn().getResponse().getStatus();

            assertNotEquals(429, status,
                    "/api/leads should not be rate-limited (attempt " + i + ")");
        }
    }
}
