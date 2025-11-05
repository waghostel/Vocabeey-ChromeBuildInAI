/**
 * TTS Retry Configuration
 * Implements retry logic for Text-to-Speech operations
 */
export const DEFAULT_TTS_RETRY_CONFIG = {
    maxAttempts: 3,
    baseDelayMs: 500, // Start with 500ms (faster than translation)
    maxDelayMs: 3000, // Max 3 seconds (shorter than translation)
    backoffMultiplier: 2, // Double each time
    retryableErrors: [
        'synthesis_failed',
        'interrupted',
        'network',
        'audio-busy',
        'audio-hardware',
    ],
    timeoutMs: 10000, // 10 second timeout per attempt
    voiceLoadTimeoutMs: 5000, // 5 seconds to load voices
};
//# sourceMappingURL=tts-retry-config.js.map