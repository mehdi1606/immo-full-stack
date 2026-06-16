package com.clubicode.mmomarocback.config;

import com.clubicode.mmomarocback.util.JwtUtil;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.annotation.Nonnull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String COOKIE_NAME = "immo_token";

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(@Nonnull HttpServletRequest request,
                                    @Nonnull HttpServletResponse response,
                                    @Nonnull FilterChain filterChain)
            throws ServletException, IOException {

        final String token = resolveToken(request);

        if (token != null) {
            try {
                final String userEmail = jwtUtil.extractEmail(token);

                if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

                    if (jwtUtil.isTokenValid(token, userDetails)) {
                        UsernamePasswordAuthenticationToken authToken =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails,
                                        null,
                                        userDetails.getAuthorities()
                                );
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            } catch (JwtException | IllegalArgumentException ex) {
                log.warn("Invalid JWT token: {}", ex.getMessage());
            } catch (org.springframework.security.core.userdetails.UsernameNotFoundException ex) {
                log.warn("JWT references deleted user '{}' — treating as unauthenticated", ex.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Resolves the JWT from the incoming request using a three-tier priority:
     *
     * 1. {@code Authorization: Bearer <token>} header
     *    → used by Postman, REST clients, and programmatic API consumers.
     *
     * 2. {@code immo_token} httpOnly cookie
     *    → used by browser SPA after login. Cookie is set server-side so it is
     *      never accessible to JavaScript (XSS-safe).
     *    Note: {@link java.net.http.HttpClient} / {@link jakarta.servlet.http.Cookie}
     *    Note: EventSource (SSE) automatically sends cookies — no special handling needed.
     *
     * 3. {@code ?token=<jwt>} query parameter
     *    → legacy fallback kept for backward compatibility with any direct URL
     *      usage. Should not be relied upon for new integrations.
     *
     * @return the raw JWT string, or {@code null} if no token is found
     */
    private String resolveToken(HttpServletRequest request) {
        // Priority 1 — Authorization header
        final String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        // Priority 2 — httpOnly cookie
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (COOKIE_NAME.equals(cookie.getName())) {
                    String value = cookie.getValue();
                    if (value != null && !value.isBlank()) {
                        return value;
                    }
                }
            }
        }

        // Priority 3 — query param (SSE / legacy)
        String tokenParam = request.getParameter("token");
        if (tokenParam != null && !tokenParam.isBlank()) {
            return tokenParam;
        }

        return null;
    }
}
