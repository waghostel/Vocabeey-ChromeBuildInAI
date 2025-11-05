/**
 * Text-to-Speech Service - Web Speech API integration
 * Implements Requirements: 3.5, 4.5, 5.5
 */
import { RetryHandler } from './retry-handler.js';
import { DEFAULT_TTS_RETRY_CONFIG } from './tts-retry-config.js';
import { getTTSDebugger } from './tts-debugger.js';
// ============================================================================
// TTS Service Class
// ============================================================================
class TTSService {
    synthesis = null;
    voices = [];
    // @ts-ignore - Used in event handlers
    _currentUtterance = null;
    isInitialized = false;
    retryHandler;
    debugger = getTTSDebugger();
    isCancelling = false; // Track intentional cancellations
    constructor(synthesisProvider) {
        // Allow injection for testing, default to window.speechSynthesis
        if (synthesisProvider) {
            this.synthesis = synthesisProvider();
        }
        else if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        }
        if (this.synthesis) {
            void this.initializeVoices();
        }
        // Initialize retry handler
        this.retryHandler = new RetryHandler(DEFAULT_TTS_RETRY_CONFIG);
    }
    /**
     * Initialize and load available voices
     */
    async initializeVoices() {
        if (!this.synthesis)
            return;
        // Load voices
        this.voices = this.synthesis.getVoices();
        // If voices not loaded yet, wait for voiceschanged event
        if (this.voices.length === 0) {
            await new Promise(resolve => {
                if (!this.synthesis) {
                    resolve();
                    return;
                }
                this.synthesis.addEventListener('voiceschanged', () => {
                    if (this.synthesis) {
                        this.voices = this.synthesis.getVoices();
                    }
                    resolve();
                });
                // Timeout after 3 seconds
                setTimeout(() => resolve(), 3000);
            });
        }
        this.isInitialized = true;
    }
    /**
     * Check if TTS is supported
     */
    isSupported() {
        return this.synthesis !== null && 'speechSynthesis' in window;
    }
    /**
     * Check if TTS is ready
     */
    async isReady() {
        if (!this.isSupported())
            return false;
        if (!this.isInitialized) {
            await this.initializeVoices();
        }
        return this.voices.length > 0;
    }
    /**
     * Get available voices
     */
    async getAvailableVoices() {
        if (!this.isSupported())
            return [];
        if (!this.isInitialized) {
            await this.initializeVoices();
        }
        return this.voices.map(voice => ({
            name: voice.name,
            lang: voice.lang,
            default: voice.default,
            localService: voice.localService,
        }));
    }
    /**
     * Get voices for specific language
     */
    async getVoicesForLanguage(language) {
        const allVoices = await this.getAvailableVoices();
        // Normalize language code (e.g., 'en-US' or 'en')
        const normalizedLang = language.toLowerCase();
        return allVoices.filter(voice => {
            const voiceLang = voice.lang.toLowerCase();
            return (voiceLang === normalizedLang ||
                voiceLang.startsWith(`${normalizedLang}-`));
        });
    }
    /**
     * Select best voice for language
     */
    async selectVoice(language) {
        if (!this.isInitialized) {
            await this.initializeVoices();
        }
        if (this.voices.length === 0)
            return null;
        // If no language specified, use default voice
        if (!language) {
            return this.voices.find(v => v.default) || this.voices[0];
        }
        // Normalize language code
        const normalizedLang = language.toLowerCase();
        // Try exact match first
        let voice = this.voices.find(v => v.lang.toLowerCase() === normalizedLang);
        // Try language prefix match (e.g., 'en' matches 'en-US')
        if (!voice) {
            voice = this.voices.find(v => v.lang.toLowerCase().startsWith(`${normalizedLang}-`));
        }
        // Try reverse match (e.g., 'en-US' matches 'en')
        if (!voice && normalizedLang.includes('-')) {
            const langPrefix = normalizedLang.split('-')[0];
            voice = this.voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
        }
        // Fallback to default voice
        return voice || this.voices.find(v => v.default) || this.voices[0];
    }
    /**
     * Speak text with retry logic
     */
    async speak(text, options = {}) {
        const operationId = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        // Execute with retry
        const result = await this.retryHandler.executeWithRetry(() => this.speakOnce(text, options), `speak(${options.language || 'default'})`);
        // Log attempt
        this.debugger.logTTSAttempt({
            timestamp: startTime,
            operationId,
            text,
            language: options.language || 'default',
            attempts: result.attempts.length,
            success: result.success,
            error: result.error?.message,
            duration: result.totalDuration,
            rate: options.rate,
            pitch: options.pitch,
            volume: options.volume,
        });
        if (!result.success) {
            throw result.error || new Error('TTS failed after retries');
        }
    }
    /**
     * Speak text once (single attempt, no retry)
     */
    async speakOnce(text, options = {}) {
        if (!this.isSupported()) {
            throw this.createError('not_supported', 'Text-to-speech is not supported in this browser', undefined, false);
        }
        if (!this.synthesis) {
            throw this.createError('not_supported', 'Speech synthesis not available', undefined, false);
        }
        // Cancel any ongoing speech (mark as intentional)
        this.isCancelling = true;
        this.stop();
        // Small delay to ensure cancellation completes
        await new Promise(resolve => setTimeout(resolve, 50));
        this.isCancelling = false;
        // Wait for voices to load
        if (!this.isInitialized) {
            await this.initializeVoices();
        }
        if (this.voices.length === 0) {
            throw this.createError('no_voices', 'No speech synthesis voices available', undefined, false);
        }
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            let isResolved = false;
            // Set voice
            const voice = this.selectVoice(options.language);
            void voice.then(selectedVoice => {
                // Check if we were cancelled while waiting for voice
                if (this.isCancelling) {
                    if (!isResolved) {
                        isResolved = true;
                        resolve();
                    }
                    return;
                }
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
                // Set language
                if (options.language) {
                    utterance.lang = options.language;
                }
                // Set speech parameters
                utterance.rate = options.rate ?? 1;
                utterance.pitch = options.pitch ?? 1;
                utterance.volume = options.volume ?? 1;
                // Event handlers
                utterance.onend = () => {
                    this._currentUtterance = null;
                    if (!isResolved) {
                        isResolved = true;
                        resolve();
                    }
                };
                utterance.onerror = event => {
                    this._currentUtterance = null;
                    if (isResolved)
                        return;
                    // Check if it was cancelled
                    if (event.error === 'canceled' || event.error === 'interrupted') {
                        // If this is an intentional cancellation (user clicked new word), resolve silently
                        if (this.isCancelling) {
                            isResolved = true;
                            resolve();
                            return;
                        }
                        // Otherwise, treat as a cancellation error
                        isResolved = true;
                        reject(this.createError('cancelled', 'Speech synthesis was cancelled', event.error, false));
                    }
                    else {
                        isResolved = true;
                        reject(this.createError('synthesis_failed', `Speech synthesis failed: ${event.error}`, event.error, true));
                    }
                };
                // Store current utterance
                this._currentUtterance = utterance;
                // Check again if we were cancelled before speaking
                if (this.isCancelling) {
                    if (!isResolved) {
                        isResolved = true;
                        resolve();
                    }
                    return;
                }
                // Speak
                try {
                    this.synthesis.speak(utterance);
                }
                catch (error) {
                    this._currentUtterance = null;
                    if (!isResolved) {
                        isResolved = true;
                        reject(this.createError('synthesis_failed', 'Failed to start speech synthesis', error, true));
                    }
                }
            });
        });
    }
    /**
     * Stop current speech
     */
    stop() {
        if (this.synthesis) {
            try {
                this.synthesis.cancel();
            }
            catch {
                // Silently ignore cancellation errors
                // This can happen if there's nothing to cancel
            }
            this._currentUtterance = null;
        }
    }
    /**
     * Pause current speech
     */
    pause() {
        if (this.synthesis && this.synthesis.speaking) {
            this.synthesis.pause();
        }
    }
    /**
     * Resume paused speech
     */
    resume() {
        if (this.synthesis && this.synthesis.paused) {
            this.synthesis.resume();
        }
    }
    /**
     * Check if currently speaking
     */
    isSpeaking() {
        return this.synthesis?.speaking ?? false;
    }
    /**
     * Check if currently paused
     */
    isPaused() {
        return this.synthesis?.paused ?? false;
    }
    /**
     * Create TTS error
     */
    createError(type, message, originalError, retryable = false) {
        return {
            type,
            message: retryable ? `${message} (will retry)` : message,
            originalError,
            retryable,
        };
    }
}
// ============================================================================
// Singleton Instance
// ============================================================================
let ttsServiceInstance = null;
/**
 * Get TTS service instance
 * @param synthesisProvider Optional provider for testing (allows mock injection)
 */
export function getTTSService(synthesisProvider) {
    if (!ttsServiceInstance) {
        ttsServiceInstance = new TTSService(synthesisProvider);
    }
    return ttsServiceInstance;
}
/**
 * Reset TTS service instance (for testing)
 * @internal
 */
export function resetTTSService() {
    if (ttsServiceInstance) {
        ttsServiceInstance.stop();
    }
    ttsServiceInstance = null;
}
// ============================================================================
// Convenience Functions
// ============================================================================
/**
 * Speak text with default options
 */
export async function speak(text, options) {
    const service = getTTSService();
    return service.speak(text, options);
}
/**
 * Stop speaking
 */
export function stopSpeaking() {
    const service = getTTSService();
    service.stop();
}
/**
 * Check if TTS is supported
 */
export function isTTSSupported() {
    const service = getTTSService();
    return service.isSupported();
}
/**
 * Get available voices
 */
export async function getAvailableVoices() {
    const service = getTTSService();
    return service.getAvailableVoices();
}
/**
 * Get voices for language
 */
export async function getVoicesForLanguage(language) {
    const service = getTTSService();
    return service.getVoicesForLanguage(language);
}
//# sourceMappingURL=tts-service.js.map