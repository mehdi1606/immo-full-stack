package com.clubicode.mmomarocback.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter      jwtAuthFilter;
    private final RateLimitFilter    rateLimitFilter;      // ← new
    private final DaoAuthenticationProvider authenticationProvider;
    private final CorsConfigurationSource   corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Auth
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
                // Properties — public read
                .requestMatchers(HttpMethod.GET, "/api/properties").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/properties/**").permitAll()
                // Agents — public read
                .requestMatchers(HttpMethod.GET, "/api/agents").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/agents/**").permitAll()
                // Leads — public create
                .requestMatchers(HttpMethod.POST, "/api/leads").permitAll()
                // Sell requests — public create
                .requestMatchers(HttpMethod.POST, "/api/sell-requests").permitAll()
                // Contact — public submit
                .requestMatchers(HttpMethod.POST, "/api/contact").permitAll()
                // Static uploads
                .requestMatchers("/uploads/**").permitAll()
                // Translation — public read endpoints
                .requestMatchers(HttpMethod.GET,  "/api/translate/languages").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/translate/property/**").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/translate/agent/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/translate/text").permitAll()
                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider)
            // Filter order (innermost = runs first):
            //   RateLimitFilter → JwtAuthFilter → UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthFilter,   UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(rateLimitFilter, JwtAuthFilter.class);

        return http.build();
    }
}
