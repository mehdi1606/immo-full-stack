package com.clubicode.mmomarocback.controller;

import com.clubicode.mmomarocback.dto.request.ChangePasswordRequest;
import com.clubicode.mmomarocback.dto.request.LoginRequest;
import com.clubicode.mmomarocback.dto.response.AgentResponse;
import com.clubicode.mmomarocback.dto.response.AuthResponse;
import com.clubicode.mmomarocback.entity.User;
import com.clubicode.mmomarocback.service.IAuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String COOKIE_NAME = "immo_token";

    private final IAuthService authService;

    /** Driven by app.cookie.secure — false for HTTP dev, true for HTTPS prod. */
    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    /** Mirror of jwt.expiration so cookie lifetime matches token lifetime. */
    @Value("${app.jwt.expiration:86400000}")
    private long jwtExpirationMs;

    // ── Login ────────────────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        AuthResponse auth = authService.login(request);

        // Set httpOnly cookie — browser clients authenticate via cookie from now on.
        // The token is ALSO present in the JSON body so Postman / API clients keep working.
        ResponseCookie cookie = buildCookie(auth.getToken(), Duration.ofMillis(jwtExpirationMs));
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(auth);
    }

    // ── Logout ───────────────────────────────────────────────────────────────

    /**
     * Clears the auth cookie by replacing it with an expired one (maxAge=0).
     * Public endpoint — no authentication required so a user with an expired
     * token can still call it without getting a 401.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie expiredCookie = buildCookie("", Duration.ZERO);
        response.addHeader(HttpHeaders.SET_COOKIE, expiredCookie.toString());
        return ResponseEntity.noContent().build();
    }

    // ── Me ───────────────────────────────────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<AgentResponse> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(authService.getCurrentUser(currentUser));
    }

    // ── Change password ───────────────────────────────────────────────────────

    @PatchMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(currentUser, request);
        return ResponseEntity.noContent().build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ResponseCookie buildCookie(String value, Duration maxAge) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)          // not readable by JavaScript — XSS protection
                .secure(cookieSecure)    // HTTPS-only in prod; false for localhost HTTP
                .sameSite("Lax")         // CSRF protection while allowing normal navigation
                .path("/")              // sent on every request to this server
                .maxAge(maxAge)
                .build();
    }
}
