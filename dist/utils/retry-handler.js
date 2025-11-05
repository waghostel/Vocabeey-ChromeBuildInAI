export class RetryHandler {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Execute operation with retry logic
     */
    async executeWithRetry(operation, operationName) {
        const attempts = [];
        const startTime = Date.now();
        let lastError = null;
        for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
            const attemptStart = Date.now();
            try {
                console.log(`[RETRY] ${operationName} - Attempt ${attempt}/${this.config.maxAttempts}`);
                // Execute with timeout
                const result = await this.executeWithTimeout(operation, this.config.timeoutMs);
                // Success!
                attempts.push({
                    attemptNumber: attempt,
                    timestamp: attemptStart,
                });
                const totalDuration = Date.now() - startTime;
                console.log(`[RETRY] ${operationName} - Success on attempt ${attempt} (${totalDuration}ms)`);
                return {
                    success: true,
                    result,
                    attempts,
                    totalDuration,
                };
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                attempts.push({
                    attemptNumber: attempt,
                    timestamp: attemptStart,
                    error: lastError.message,
                });
                console.warn(`[RETRY] ${operationName} - Attempt ${attempt} failed:`, lastError.message);
                // Check if error is retryable
                if (!this.isRetryable(lastError)) {
                    console.log(`[RETRY] ${operationName} - Non-retryable error, stopping`);
                    break;
                }
                // Don't wait after last attempt
                if (attempt < this.config.maxAttempts) {
                    const delay = this.calculateDelay(attempt);
                    attempts[attempts.length - 1].delayMs = delay;
                    console.log(`[RETRY] ${operationName} - Waiting ${delay}ms before retry...`);
                    await this.sleep(delay);
                }
            }
        }
        // All attempts failed
        const totalDuration = Date.now() - startTime;
        console.error(`[RETRY] ${operationName} - All ${this.config.maxAttempts} attempts failed (${totalDuration}ms)`);
        return {
            success: false,
            error: lastError || new Error('All retry attempts failed'),
            attempts,
            totalDuration,
        };
    }
    /**
     * Execute operation with timeout
     */
    async executeWithTimeout(operation, timeoutMs) {
        return Promise.race([
            operation(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)),
        ]);
    }
    /**
     * Check if error is retryable
     */
    isRetryable(error) {
        const errorMessage = error.message.toLowerCase();
        return this.config.retryableErrors.some(retryableError => errorMessage.includes(retryableError.toLowerCase()));
    }
    /**
     * Calculate delay with exponential backoff
     */
    calculateDelay(attempt) {
        const delay = this.config.baseDelayMs *
            Math.pow(this.config.backoffMultiplier, attempt - 1);
        // Add jitter (±20%) to prevent thundering herd
        const jitter = delay * 0.2 * (Math.random() - 0.5);
        return Math.min(delay + jitter, this.config.maxDelayMs);
    }
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
//# sourceMappingURL=retry-handler.js.map