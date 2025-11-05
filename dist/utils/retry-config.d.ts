export interface RetryConfig {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    retryableErrors: string[];
    timeoutMs: number;
}
export declare const DEFAULT_TRANSLATION_RETRY_CONFIG: RetryConfig;
export interface RetryAttempt {
    attemptNumber: number;
    timestamp: number;
    error?: string;
    delayMs?: number;
}
export interface RetryResult<T> {
    success: boolean;
    result?: T;
    error?: Error;
    attempts: RetryAttempt[];
    totalDuration: number;
}
//# sourceMappingURL=retry-config.d.ts.map