package com.clubicode.mmomarocback.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * In-memory cache for translations using Caffeine.
 *
 * Cache name: "translations"
 * Key pattern: "entityType:entityId:fieldName:targetLang"
 *
 * Layered cache strategy:
 *   L1 → Caffeine (in-memory, sub-millisecond)   — max 10,000 entries, 24h TTL
 *   L2 → PostgreSQL translations table            — unlimited, permanent
 *   L3 → External API (LibreTranslate / MyMemory) — called only on first miss
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Value("${app.translation.cache.max-size:10000}")
    private long maxSize;

    @Value("${app.translation.cache.expire-hours:24}")
    private long expireHours;

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager("translations");
        manager.setCaffeine(
                Caffeine.newBuilder()
                        .maximumSize(maxSize)
                        .expireAfterWrite(expireHours, TimeUnit.HOURS)
                        .recordStats() // enables hit/miss stats in actuator
        );
        return manager;
    }
}
