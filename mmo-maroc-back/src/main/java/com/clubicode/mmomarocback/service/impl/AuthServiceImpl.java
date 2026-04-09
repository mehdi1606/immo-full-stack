package com.clubicode.mmomarocback.service.impl;

import com.clubicode.mmomarocback.dto.request.ChangePasswordRequest;
import com.clubicode.mmomarocback.dto.request.LoginRequest;
import com.clubicode.mmomarocback.dto.response.AgentResponse;
import com.clubicode.mmomarocback.dto.response.AuthResponse;
import com.clubicode.mmomarocback.entity.Agent;
import com.clubicode.mmomarocback.entity.User;
import com.clubicode.mmomarocback.exception.ForbiddenException;
import com.clubicode.mmomarocback.exception.TooManyRequestsException;
import com.clubicode.mmomarocback.exception.UnauthorizedException;
import com.clubicode.mmomarocback.repository.AgentRepository;
import com.clubicode.mmomarocback.repository.UserRepository;
import com.clubicode.mmomarocback.service.IAuthService;
import com.clubicode.mmomarocback.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements IAuthService {

    // ── Dependencies ──────────────────────────────────────────────────────────
    private final UserRepository  userRepository;
    private final AgentRepository agentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil         jwtUtil;

    // ── Email-level failed-login tracking (in-memory, resets on restart) ─────
    //
    // Two maps kept intentionally separate so a lookup never requires locking both:
    //   failCounts   — consecutive failure count per normalised email address
    //   blockedUntil — absolute Instant after which the address is unblocked
    //
    // Entries are small (email string + int/Instant) and naturally bounded by the
    // number of distinct user emails — no eviction policy needed for a typical
    // deployment. For a multi-node setup replace with a shared cache (Redis, etc.).

    /** Visible to tests via package-private access (same package). */
    final ConcurrentHashMap<String, AtomicInteger> failCounts   = new ConcurrentHashMap<>();
    final ConcurrentHashMap<String, Instant>       blockedUntil = new ConcurrentHashMap<>();

    static final int      MAX_FAILURES    = 3;
    static final Duration BLOCK_DURATION  = Duration.ofMinutes(5);

    // ── Login ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {

        final String email = request.getEmail().toLowerCase().trim();

        // ── 1. Check email-level block ──────────────────────────────────────
        checkEmailBlock(email);

        // ── 2. Resolve user ─────────────────────────────────────────────────
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    // Count failure even for unknown emails — prevents user-enumeration
                    // via different response timing/code between "no such user" and
                    // "wrong password".
                    recordFailure(email);
                    return new UnauthorizedException("Invalid credentials");
                });

        // ── 3. Verify password ───────────────────────────────────────────────
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            recordFailure(email);
            throw new UnauthorizedException("Invalid credentials");
        }

        // ── 4. Check account status ──────────────────────────────────────────
        if (!user.isEnabled()) {
            throw new UnauthorizedException("Account is inactive");
        }

        // ── 5. Success — reset failure counter ───────────────────────────────
        clearFailures(email);

        // ── 6. Build token & response ────────────────────────────────────────
        String        token    = jwtUtil.generateToken(user);
        Optional<Agent> agentOpt = agentRepository.findByUserId(user.getId());

        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .agentId(agentOpt.map(Agent::getId).orElse(null))
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .avatar(agentOpt.map(Agent::getAvatar).orElse(null))
                .build();
    }

    // ── Change password ───────────────────────────────────────────────────────

    @Override
    @Transactional
    public void changePassword(User currentUser, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPassword())) {
            throw new ForbiddenException("Mot de passe actuel incorrect");
        }
        currentUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(currentUser);
        log.info("Password changed for user: {}", currentUser.getEmail());
    }

    // ── Get current user ──────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public AgentResponse getCurrentUser(User user) {
        Optional<Agent> agentOpt = agentRepository.findByUserId(user.getId());
        return agentOpt.map(AgentServiceImpl::toAgentResponse)
                .orElse(AgentResponse.builder()
                        .userId(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .status(user.getStatus())
                        .createdAt(user.getCreatedAt())
                        .build());
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Throws {@link TooManyRequestsException} if this email is currently blocked.
     * Expired blocks are silently cleaned up on first access after expiry.
     */
    private void checkEmailBlock(String email) {
        Instant until = blockedUntil.get(email);
        if (until == null) return;

        if (Instant.now().isBefore(until)) {
            log.warn("[AuthBlock] Login blocked for email '{}' until {}", email, until);
            throw new TooManyRequestsException(
                    "Compte temporairement bloqué. Réessayez dans 5 minutes.");
        }

        // Block has expired — clean up both maps so memory doesn't grow indefinitely
        blockedUntil.remove(email);
        failCounts.remove(email);
    }

    /**
     * Increments the failure counter for {@code email}.
     * When the counter reaches {@value MAX_FAILURES} the account is blocked for
     * {@value #BLOCK_DURATION} minutes.
     */
    private void recordFailure(String email) {
        int count = failCounts
                .computeIfAbsent(email, k -> new AtomicInteger(0))
                .incrementAndGet();

        log.warn("[AuthBlock] Failed login attempt {}/{} for email '{}'",
                count, MAX_FAILURES, email);

        if (count >= MAX_FAILURES) {
            Instant unblockAt = Instant.now().plus(BLOCK_DURATION);
            blockedUntil.put(email, unblockAt);
            log.warn("[AuthBlock] Email '{}' blocked until {} after {} failures",
                    email, unblockAt, count);
        }
    }

    /** Clears all failure tracking for {@code email} after a successful login. */
    private void clearFailures(String email) {
        failCounts.remove(email);
        blockedUntil.remove(email);
    }
}
