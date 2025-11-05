export const DEFAULT_TRANSLATION_RETRY_CONFIG = {
    maxAttempts: 3,
    baseDelayMs: 1000, // Start with 1 second
    maxDelayMs: 10000, // Max 10 seconds
    backoffMultiplier: 2, // Double each time
    retryableErrors: [
        'network',
        'timeout',
        'rate_limit',
        'temporary_unavailable',
    ],
    timeoutMs: 15000, // 15 second timeout per attempt
};
//# sourceMappingURL=retry-config.js.map