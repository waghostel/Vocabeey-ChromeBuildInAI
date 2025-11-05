/**
 * Comprehensive Error Handling System
 * Implements retry logic with exponential backoff for AI failures
 * Creates user-friendly error messages with suggested actions
 * Handles hardware capability detection and Gemini API suggestions
 */
import type { ErrorType } from '../types';
export interface ExtensionError extends Error {
    type: ErrorType | 'content_extraction_failed' | 'storage_quota_exceeded' | 'invalid_api_key' | 'insufficient_hardware';
    retryable: boolean;
    userMessage: string;
    suggestedAction?: string;
    originalError?: Error;
}
export interface ErrorHandlerOptions {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: ExtensionError) => void;
}
export interface SystemCapabilities {
    chromeAIAvailable: boolean;
    sufficientRAM: boolean;
    sufficientStorage: boolean;
    sufficientVRAM: boolean;
    canUseOffscreen: boolean;
}
export declare class ErrorHandler {
    private readonly maxRetries;
    private readonly baseDelay;
    private readonly maxDelay;
    private readonly onRetry?;
    constructor(options?: ErrorHandlerOptions);
    /**
     * Execute operation with retry logic and exponential backoff
     */
    executeWithRetry<T>(operation: () => Promise<T>, context?: string): Promise<T>;
    /**
     * Calculate exponential backoff delay
     */
    private calculateBackoff;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
    /**
     * Normalize any error to ExtensionError
     */
    normalizeError(error: unknown, context?: string): ExtensionError;
    /**
     * Convert AIError to ExtensionError
     */
    private aiErrorToExtensionError;
    /**
     * Create standardized ExtensionError
     */
    createError(type: ExtensionError['type'], message: string, retryable: boolean, originalError?: Error): ExtensionError;
    /**
     * Type guard for ExtensionError
     */
    private isExtensionError;
    /**
     * Type guard for AIError
     */
    private isAIError;
}
export declare class HardwareCapabilityDetector {
    /**
     * Check system capabilities for Chrome AI
     */
    checkCapabilities(): Promise<SystemCapabilities>;
    /**
     * Check if Chrome AI is available
     */
    private checkChromeAI;
    /**
     * Check if device has sufficient RAM
     */
    private checkRAM;
    /**
     * Check if device has sufficient storage
     */
    private checkStorage;
    /**
     * Check if offscreen documents are supported
     */
    private checkOffscreenSupport;
    /**
     * Get user-friendly capability report
     */
    getCapabilityReport(): Promise<string>;
    /**
     * Suggest Gemini API if hardware insufficient
     */
    suggestGeminiAPIIfNeeded(): Promise<string | null>;
}
export declare class UserErrorPresenter {
    /**
     * Format error for user display
     */
    formatError(error: ExtensionError): {
        title: string;
        message: string;
        action?: string;
        severity: 'error' | 'warning' | 'info';
    };
    /**
     * Get user-friendly error title
     */
    private getErrorTitle;
    /**
     * Create error notification HTML
     */
    createErrorNotification(error: ExtensionError): string;
    /**
     * Get icon for error severity
     */
    private getErrorIcon;
}
export declare const globalErrorHandler: ErrorHandler;
export declare const hardwareDetector: HardwareCapabilityDetector;
export declare const errorPresenter: UserErrorPresenter;
//# sourceMappingURL=error-handler.d.ts.map