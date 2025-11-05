/**
 * Text-to-Speech Service - Web Speech API integration
 * Implements Requirements: 3.5, 4.5, 5.5
 */
export interface TTSOptions {
    language?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
}
export interface TTSVoice {
    name: string;
    lang: string;
    default: boolean;
    localService: boolean;
}
export interface TTSError {
    type: 'not_supported' | 'no_voices' | 'synthesis_failed' | 'cancelled';
    message: string;
    originalError?: Error;
    retryable?: boolean;
}
declare class TTSService {
    private synthesis;
    private voices;
    private _currentUtterance;
    private isInitialized;
    private retryHandler;
    private debugger;
    private isCancelling;
    constructor(synthesisProvider?: () => SpeechSynthesis | null);
    /**
     * Initialize and load available voices
     */
    private initializeVoices;
    /**
     * Check if TTS is supported
     */
    isSupported(): boolean;
    /**
     * Check if TTS is ready
     */
    isReady(): Promise<boolean>;
    /**
     * Get available voices
     */
    getAvailableVoices(): Promise<TTSVoice[]>;
    /**
     * Get voices for specific language
     */
    getVoicesForLanguage(language: string): Promise<TTSVoice[]>;
    /**
     * Select best voice for language
     */
    private selectVoice;
    /**
     * Speak text with retry logic
     */
    speak(text: string, options?: TTSOptions): Promise<void>;
    /**
     * Speak text once (single attempt, no retry)
     */
    private speakOnce;
    /**
     * Stop current speech
     */
    stop(): void;
    /**
     * Pause current speech
     */
    pause(): void;
    /**
     * Resume paused speech
     */
    resume(): void;
    /**
     * Check if currently speaking
     */
    isSpeaking(): boolean;
    /**
     * Check if currently paused
     */
    isPaused(): boolean;
    /**
     * Create TTS error
     */
    private createError;
}
/**
 * Get TTS service instance
 * @param synthesisProvider Optional provider for testing (allows mock injection)
 */
export declare function getTTSService(synthesisProvider?: () => SpeechSynthesis | null): TTSService;
/**
 * Reset TTS service instance (for testing)
 * @internal
 */
export declare function resetTTSService(): void;
/**
 * Speak text with default options
 */
export declare function speak(text: string, options?: TTSOptions): Promise<void>;
/**
 * Stop speaking
 */
export declare function stopSpeaking(): void;
/**
 * Check if TTS is supported
 */
export declare function isTTSSupported(): boolean;
/**
 * Get available voices
 */
export declare function getAvailableVoices(): Promise<TTSVoice[]>;
/**
 * Get voices for language
 */
export declare function getVoicesForLanguage(language: string): Promise<TTSVoice[]>;

//# sourceMappingURL=tts-service.d.ts.map