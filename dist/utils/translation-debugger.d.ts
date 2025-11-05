export interface TranslationDebugInfo {
    timestamp: number;
    operationId: string;
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    context: string;
    attempts: number;
    success: boolean;
    result?: string;
    error?: string;
    duration: number;
    cacheHit: boolean;
    apiAvailability?: string;
    sessionReused: boolean;
    sameLanguage?: boolean;
}
export declare class TranslationDebugger {
    private debugLog;
    private readonly maxLogSize;
    private debugMode;
    private storageAvailable;
    private storageWarningLogged;
    constructor();
    /**
     * Check if chrome.storage.local is available
     */
    private checkStorageAvailability;
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
     * Log translation attempt
     */
    logTranslation(info: TranslationDebugInfo): void;
    /**
     * Log to console with formatting
     */
    private logToConsole;
    /**
     * Get debug log
     */
    getDebugLog(): TranslationDebugInfo[];
    /**
     * Get debug statistics
     */
    getDebugStats(): {
        total: number;
        successful: number;
        failed: number;
        cacheHits: number;
        avgDuration: number;
        avgAttempts: number;
        errorTypes: Record<string, number>;
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
export declare function getTranslationDebugger(): TranslationDebugger;
//# sourceMappingURL=translation-debugger.d.ts.map