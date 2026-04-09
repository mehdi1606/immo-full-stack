package com.clubicode.mmomarocback.exception;

/**
 * Thrown when a client exceeds an in-application rate limit
 * (e.g. too many consecutive failed login attempts for the same email).
 * Handled by {@link GlobalExceptionHandler} → HTTP 429 Too Many Requests.
 *
 * Note: IP-level rate limiting (Bucket4j) writes the 429 response directly
 * in {@link com.clubicode.mmomarocback.config.RateLimitFilter} before Spring
 * MVC is involved, so that path does NOT use this exception class.
 */
public class TooManyRequestsException extends RuntimeException {

    public TooManyRequestsException(String message) {
        super(message);
    }
}
