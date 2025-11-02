export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
  timeoutMs: number;
}

export const DEFAULT_TRANSLATION_RETRY_CONFIG: RetryConfig = {
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
