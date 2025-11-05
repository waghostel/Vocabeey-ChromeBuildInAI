/**
 * TTS Debugger
 * Debug logging and statistics for Text-to-Speech operations
 */
export interface TTSDebugInfo {
    timestamp: number;
    operationId: string;
    text: string;
    language: string;
    attempts: number;
    success: boolean;
    error?: string;
    duration: number;
    voiceUsed?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
}
export declare class TTSDebugger {
    private debugLog;
    private readonly maxLogSize;
    private debugMode;
    constructor();
    /**
     * Load debug mode from storage
     */
    private loadDebugMode;
    /**
     * Enable debug mode
     */
    enableDebugMode(): Promise<void>;
    /**
     * Disable debug mode
     */
    disableDebugMode(): Promise<void>;
    /**
     * Log TTS attempt
     */
    logTTSAttempt(info: TTSDebugInfo): void;
    /**
     * Log to console with formatting
     */
    private logToConsole;
    /**
     * Get debug log
     */
    getDebugLog(): TTSDebugInfo[];
    /**
     * Get debug statistics
     */
    getDebugStats(): {
        total: number;
        successful: number;
        failed: number;
        avgDuration: number;
        avgAttempts: number;
        errorTypes: Record<string, number>;
        languageDistribution: Record<string, number>;
        mostUsedVoices: Record<string, number>;
    };
    /**
     * Export debug log as JSON
     */
    exportDebugLog(): string;
    /**
     * Save debug log to storage
     */
    private saveDebugLog;
    /**
     * Load debug log from storage
     */
    loadDebugLog(): Promise<void>;
    /**
     * Clear debug log
     */
    clearDebugLog(): Promise<void>;
}
export declare function getTTSDebugger(): TTSDebugger;
//# sourceMappingURL=tts-debugger.d.ts.map