/**
 * Comprehensive Error Handling System
 * Implements retry logic with exponential backoff for AI failures
 * Creates user-friendly error messages with suggested actions
 * Handles hardware capability detection and Gemini API suggestions
 */
// ============================================================================
// Error Handler Class
// ============================================================================
export class ErrorHandler {
    maxRetries;
    baseDelay;
    maxDelay;
    onRetry;
    constructor(options = {}) {
        this.maxRetries = options.maxRetries ?? 3;
        this.baseDelay = options.baseDelay ?? 1000;
        this.maxDelay = options.maxDelay ?? 30000;
        this.onRetry = options.onRetry;
    }
    /**
     * Execute operation with retry logic and exponential backoff
     */
    async executeWithRetry(operation, context = 'operation') {
        let lastError = null;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                const extensionError = this.normalizeError(error, context);
                lastError = extensionError;
                // Don't retry if error is not retryable
                if (!extensionError.retryable) {
                    throw extensionError;
                }
                // Don't wait after last attempt
                if (attempt < this.maxRetries) {
                    const delay = this.calculateBackoff(attempt);
                    // Call retry callback if provided
                    if (this.onRetry) {
                        this.onRetry(attempt, extensionError);
                    }
                    console.warn(`Retry attempt ${attempt}/${this.maxRetries} for ${context} after ${delay}ms. Error: ${extensionError.message}`);
                    await this.sleep(delay);
                }
            }
        }
        // All retries exhausted
        if (lastError) {
            lastError.userMessage = `Failed after ${this.maxRetries} attempts: ${lastError.userMessage}`;
            throw lastError;
        }
        throw this.createError('processing_failed', `All retries exhausted for ${context}`, false);
    }
    /**
     * Calculate exponential backoff delay
     */
    calculateBackoff(attempt) {
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.3 * delay;
        return Math.min(delay + jitter, this.maxDelay);
    }
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Normalize any error to ExtensionError
     */
    normalizeError(error, context = 'operation') {
        if (this.isExtensionError(error)) {
            return error;
        }
        if (this.isAIError(error)) {
            return this.aiErrorToExtensionError(error);
        }
        if (error instanceof Error) {
            return this.createError('processing_failed', error.message, false, error);
        }
        return this.createError('processing_failed', `Unknown error in ${context}`, false);
    }
    /**
     * Convert AIError to ExtensionError
     */
    aiErrorToExtensionError(error) {
        const userMessages = {
            network: 'Network connection issue. Please check your internet connection.',
            api_unavailable: 'AI service is currently unavailable.',
            rate_limit: 'Too many requests. Please wait a moment and try again.',
            invalid_input: 'Invalid input provided.',
            processing_failed: 'Failed to process your request.',
        };
        const suggestedActions = {
            network: 'Check your internet connection and try again.',
            api_unavailable: 'Try again later or configure Gemini API as fallback.',
            rate_limit: 'Wait a few moments before trying again.',
            invalid_input: 'Please check your input and try again.',
            processing_failed: 'Try reloading the page or contact support.',
        };
        return {
            name: 'ExtensionError',
            type: error.type,
            message: error.message,
            retryable: error.retryable,
            userMessage: userMessages[error.type] || error.message,
            suggestedAction: suggestedActions[error.type],
            originalError: error.originalError,
        };
    }
    /**
     * Create standardized ExtensionError
     */
    createError(type, message, retryable, originalError) {
        const userMessages = {
            network: 'Network connection issue',
            api_unavailable: 'AI service unavailable',
            rate_limit: 'Too many requests',
            invalid_input: 'Invalid input',
            processing_failed: 'Processing failed',
            content_extraction_failed: 'Failed to extract article content',
            storage_quota_exceeded: 'Storage limit reached',
            invalid_api_key: 'Invalid API key',
            insufficient_hardware: 'Insufficient hardware capabilities',
        };
        const suggestedActions = {
            network: 'Check your internet connection and try again.',
            api_unavailable: 'Try again later or configure Gemini API as fallback.',
            rate_limit: 'Wait a few moments before trying again.',
            invalid_input: 'Please check your input and try again.',
            processing_failed: 'Try reloading the page.',
            content_extraction_failed: 'Try a different article or configure Jina Reader API.',
            storage_quota_exceeded: 'Export your data and clear old articles.',
            invalid_api_key: 'Check your API key in settings.',
            insufficient_hardware: 'Configure Gemini API as fallback in settings.',
        };
        return {
            name: 'ExtensionError',
            type,
            message,
            retryable,
            userMessage: userMessages[type] || message,
            suggestedAction: suggestedActions[type],
            originalError,
        };
    }
    /**
     * Type guard for ExtensionError
     */
    isExtensionError(error) {
        return (typeof error === 'object' &&
            error !== null &&
            'type' in error &&
            'userMessage' in error &&
            'retryable' in error);
    }
    /**
     * Type guard for AIError
     */
    isAIError(error) {
        return (typeof error === 'object' &&
            error !== null &&
            'type' in error &&
            'message' in error &&
            'retryable' in error);
    }
}
// ============================================================================
// Hardware Capability Detection
// ============================================================================
export class HardwareCapabilityDetector {
    /**
     * Check system capabilities for Chrome AI
     */
    async checkCapabilities() {
        const capabilities = {
            chromeAIAvailable: false,
            sufficientRAM: false,
            sufficientStorage: false,
            sufficientVRAM: false,
            canUseOffscreen: false,
        };
        // Check Chrome AI availability
        try {
            capabilities.chromeAIAvailable = await this.checkChromeAI();
        }
        catch (error) {
            console.warn('Chrome AI check failed:', error);
        }
        // Check RAM (estimate based on device memory API)
        try {
            capabilities.sufficientRAM = this.checkRAM();
        }
        catch (error) {
            console.warn('RAM check failed:', error);
        }
        // Check storage
        try {
            capabilities.sufficientStorage = await this.checkStorage();
        }
        catch (error) {
            console.warn('Storage check failed:', error);
        }
        // Check offscreen document support
        try {
            capabilities.canUseOffscreen = this.checkOffscreenSupport();
        }
        catch (error) {
            console.warn('Offscreen check failed:', error);
        }
        // VRAM cannot be directly checked, assume sufficient if Chrome AI is available
        capabilities.sufficientVRAM = capabilities.chromeAIAvailable;
        return capabilities;
    }
    /**
     * Check if Chrome AI is available
     */
    async checkChromeAI() {
        // Check if AI APIs exist
        if (!('ai' in self)) {
            return false;
        }
        try {
            // Try to check language model availability
            const ai = self.ai;
            if (ai && ai.languageModel) {
                const capabilities = await ai.languageModel.capabilities();
                return capabilities.available !== 'no';
            }
        }
        catch (error) {
            console.warn('Chrome AI availability check failed:', error);
        }
        return false;
    }
    /**
     * Check if device has sufficient RAM
     */
    checkRAM() {
        // Use Device Memory API if available
        const nav = navigator;
        if ('deviceMemory' in nav && nav.deviceMemory !== undefined) {
            const deviceMemory = nav.deviceMemory; // in GB
            return deviceMemory >= 4; // Minimum 4GB
        }
        // Cannot determine, assume sufficient
        return true;
    }
    /**
     * Check if device has sufficient storage
     */
    async checkStorage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const quota = estimate.quota || 0;
                const usage = estimate.usage || 0;
                const available = quota - usage;
                // Need at least 22GB available (Chrome AI requirement)
                const requiredBytes = 22 * 1024 * 1024 * 1024;
                return available >= requiredBytes;
            }
            catch (error) {
                console.warn('Storage estimate failed:', error);
            }
        }
        // Cannot determine, assume sufficient
        return true;
    }
    /**
     * Check if offscreen documents are supported
     */
    checkOffscreenSupport() {
        return (typeof chrome !== 'undefined' &&
            'offscreen' in chrome &&
            typeof chrome.offscreen.createDocument === 'function');
    }
    /**
     * Get user-friendly capability report
     */
    async getCapabilityReport() {
        const capabilities = await this.checkCapabilities();
        const issues = [];
        if (!capabilities.chromeAIAvailable) {
            issues.push('Chrome AI is not available on this device');
        }
        if (!capabilities.sufficientRAM) {
            issues.push('Insufficient RAM (minimum 4GB required)');
        }
        if (!capabilities.sufficientStorage) {
            issues.push('Insufficient storage (minimum 22GB required)');
        }
        if (!capabilities.canUseOffscreen) {
            issues.push('Offscreen documents not supported');
        }
        if (issues.length === 0) {
            return 'All system requirements met';
        }
        return `System requirements not met:\n${issues.map(i => `• ${i}`).join('\n')}`;
    }
    /**
     * Suggest Gemini API if hardware insufficient
     */
    async suggestGeminiAPIIfNeeded() {
        const capabilities = await this.checkCapabilities();
        if (!capabilities.chromeAIAvailable ||
            !capabilities.sufficientRAM ||
            !capabilities.sufficientStorage) {
            return ('Your device does not meet the requirements for Chrome AI. ' +
                'Please configure Gemini API in settings as a fallback option. ' +
                'Get your API key from: https://aistudio.google.com/app/apikey');
        }
        return null;
    }
}
// ============================================================================
// User-Friendly Error Messages
// ============================================================================
export class UserErrorPresenter {
    /**
     * Format error for user display
     */
    formatError(error) {
        const severity = error.retryable ? 'warning' : 'error';
        return {
            title: this.getErrorTitle(error.type),
            message: error.userMessage,
            action: error.suggestedAction,
            severity,
        };
    }
    /**
     * Get user-friendly error title
     */
    getErrorTitle(type) {
        const titles = {
            network: 'Connection Issue',
            api_unavailable: 'Service Unavailable',
            rate_limit: 'Rate Limit Reached',
            invalid_input: 'Invalid Input',
            processing_failed: 'Processing Failed',
            content_extraction_failed: 'Content Extraction Failed',
            storage_quota_exceeded: 'Storage Full',
            invalid_api_key: 'Invalid API Key',
            insufficient_hardware: 'Hardware Requirements Not Met',
        };
        return titles[type] || 'Error';
    }
    /**
     * Create error notification HTML
     */
    createErrorNotification(error) {
        const formatted = this.formatError(error);
        const severityClass = `error-${formatted.severity}`;
        return `
      <div class="error-notification ${severityClass}">
        <div class="error-header">
          <span class="error-icon">${this.getErrorIcon(formatted.severity)}</span>
          <h3 class="error-title">${formatted.title}</h3>
        </div>
        <p class="error-message">${formatted.message}</p>
        ${formatted.action ? `<p class="error-action"><strong>Suggested action:</strong> ${formatted.action}</p>` : ''}
      </div>
    `;
    }
    /**
     * Get icon for error severity
     */
    getErrorIcon(severity) {
        const icons = {
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
        };
        return icons[severity];
    }
}
// ============================================================================
// Global Error Handler Instance
// ============================================================================
export const globalErrorHandler = new ErrorHandler({
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
});
export const hardwareDetector = new HardwareCapabilityDetector();
export const errorPresenter = new UserErrorPresenter();
//# sourceMappingURL=error-handler.js.map