/**
 * TTS Retry Configuration
 * Implements retry logic for Text-to-Speech operations
 */
import { RetryConfig } from './retry-config';
export interface TTSRetryConfig extends RetryConfig {
    voiceLoadTimeoutMs: number;
}
export declare const DEFAULT_TTS_RETRY_CONFIG: TTSRetryConfig;
//# sourceMappingURL=tts-retry-config.d.ts.map