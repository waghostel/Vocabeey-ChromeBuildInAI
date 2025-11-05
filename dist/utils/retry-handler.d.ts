import { RetryConfig, RetryResult } from './retry-config';
export declare class RetryHandler {
    private config;
    constructor(config: RetryConfig);
    /**
     * Execute operation with retry logic
     */
    executeWithRetry<T>(operation: () => Promise<T>, operationName: string): Promise<RetryResult<T>>;
    /**
     * Execute operation with timeout
     */
    private executeWithTimeout;
    /**
     * Check if error is retryable
     */
    private isRetryable;
    /**
     * Calculate delay with exponential backoff
     */
    private calculateDelay;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
}
//# sourceMappingURL=retry-handler.d.ts.map