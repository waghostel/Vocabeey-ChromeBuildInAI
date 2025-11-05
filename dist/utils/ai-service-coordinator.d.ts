/**
 * AI Service Coordinator
 * Manages fallback chain: Chrome AI → Gemini API → Error
 * Handles service availability detection and graceful degradation
 */
import type { AIError, AIProcessor, AIServiceManager, AITask, SummaryOptions, VocabularyAnalysis } from '../types';
interface ServiceStatus {
    chromeAI: boolean;
    geminiAPI: boolean;
    lastChecked: Date;
}
export declare class AIServiceCoordinator implements AIProcessor, AIServiceManager {
    private chromeLanguageDetector;
    private chromeSummarizer;
    private chromeRewriter;
    private chromeTranslator;
    private chromeVocabularyAnalyzer;
    private geminiClient;
    private serviceStatus;
    private readonly statusCacheDuration;
    constructor(geminiApiKey?: string);
    /**
     * Set or update Gemini API key
     */
    setGeminiApiKey(apiKey: string): void;
    /**
     * Check if any AI service is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Get current service status
     */
    getServiceStatus(): Promise<ServiceStatus>;
    /**
     * Detect language with fallback
     */
    detectLanguage(text: string): Promise<{
        language: string;
        confidence: number;
    }>;
    /**
     * Summarize content with fallback
     */
    summarizeContent(text: string, options?: SummaryOptions): Promise<string>;
    /**
     * Rewrite content with fallback
     */
    rewriteContent(text: string, difficulty: number): Promise<string>;
    /**
     * Translate text with fallback
     */
    translateText(text: string, from: string, to: string): Promise<string>;
    /**
     * Analyze vocabulary with fallback
     */
    analyzeVocabulary(words: string[], context: string): Promise<VocabularyAnalysis[]>;
    /**
     * Process task with fallback chain
     */
    processWithFallback<T>(task: AITask, data: unknown): Promise<T>;
    /**
     * Handle error with retry logic
     */
    handleError(error: AIError): Promise<void>;
    /**
     * Clean up all resources
     */
    destroy(): void;
    /**
     * Update service availability status
     */
    private updateServiceStatus;
    /**
     * Process task using Chrome AI
     */
    private processChromeAI;
    /**
     * Process task using Gemini API
     */
    private processGeminiAPI;
    /**
     * Create compound error from multiple failures
     */
    private createCompoundError;
    /**
     * Normalize error to AIError type
     */
    private normalizeError;
    /**
     * Exponential backoff for retries
     */
    private exponentialBackoff;
    /**
     * Create standardized AI error
     */
    private createError;
    /**
     * Type guard for AI errors
     */
    private isAIError;
}
export declare class RetryHandler {
    private readonly maxRetries;
    private readonly baseDelay;
    constructor(maxRetries?: number, baseDelay?: number);
    /**
     * Execute operation with retry logic
     */
    execute<T>(operation: () => Promise<T>, shouldRetry?: (error: AIError) => boolean): Promise<T>;
    /**
     * Exponential backoff delay
     */
    private exponentialBackoff;
    /**
     * Normalize error to AIError type
     */
    private normalizeError;
    /**
     * Create standardized AI error
     */
    private createError;
    /**
     * Type guard for AI errors
     */
    private isAIError;
}

//# sourceMappingURL=ai-service-coordinator.d.ts.map