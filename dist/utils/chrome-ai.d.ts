/**
 * Chrome Built-in AI APIs integration
 * Provides language detection, summarization, rewriting, translation, and vocabulary analysis
 */
import type { AIProcessor, SummaryOptions, VocabularyAnalysis } from '../types';
interface LanguageDetectorInstance {
    detect(text: string): Promise<{
        detectedLanguage: string;
        confidence: number;
    }[]>;
}
interface SummarizerInstance {
    summarize(text: string, options?: {
        length?: 'short' | 'medium' | 'long';
    }): Promise<string>;
    destroy(): void;
}
interface RewriterInstance {
    rewrite(text: string, options?: {
        tone?: string;
        length?: string;
    }): Promise<string>;
    destroy(): void;
}
interface TranslatorInstance {
    translate(text: string): Promise<string>;
    translateStreaming(text: string): AsyncIterable<string>;
    destroy(): void;
}
interface PromptSession {
    prompt(text: string): Promise<string>;
    destroy(): void;
}
interface TranslatorAPI {
    availability(options: {
        sourceLanguage: string;
        targetLanguage: string;
    }): Promise<'readily' | 'after-download' | 'no'>;
    create(options: {
        sourceLanguage: string;
        targetLanguage: string;
        monitor?: (m: EventTarget) => void;
    }): Promise<TranslatorInstance>;
}
interface LanguageDetectorAPI {
    create(): Promise<LanguageDetectorInstance>;
}
interface ChromeAI {
    summarizer?: {
        create(options?: {
            type?: string;
            format?: string;
            length?: string;
        }): Promise<SummarizerInstance>;
        capabilities(): Promise<{
            available: string;
        }>;
    };
    rewriter?: {
        create(options?: {
            tone?: string;
            format?: string;
            length?: string;
        }): Promise<RewriterInstance>;
        capabilities(): Promise<{
            available: string;
        }>;
    };
    languageModel?: {
        create(options?: {
            systemPrompt?: string;
        }): Promise<PromptSession>;
        capabilities(): Promise<{
            available: string;
        }>;
    };
}
declare global {
    const Translator: TranslatorAPI;
    const LanguageDetector: LanguageDetectorAPI;
    interface Window {
        ai?: ChromeAI;
    }
}
export declare class ChromeLanguageDetector {
    private cache;
    private readonly maxCacheSize;
    private activeSessions;
    /**
     * Detect language of text using Chrome's Language Detector API
     * Returns language code and confidence score
     */
    detectLanguage(text: string): Promise<{
        language: string;
        confidence: number;
    }>;
    /**
     * Destroy all active sessions
     */
    destroyAllSessions(): void;
    /**
     * Check if Language Detector API is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Clear the language detection cache
     */
    clearCache(): void;
    /**
     * Destroy and cleanup all resources
     */
    destroy(): void;
    /**
     * Generate cache key from text (first 200 chars)
     */
    private getCacheKey;
    /**
     * Cache detection result with size limit
     */
    private cacheResult;
    /**
     * Create standardized AI error
     */
    private createError;
    /**
     * Type guard for AI errors
     */
    private isAIError;
}
export declare class ChromeSummarizer {
    private activeSessions;
    /**
     * Summarize content with hierarchical approach for long content
     */
    summarizeContent(text: string, options?: SummaryOptions): Promise<string>;
    /**
     * Subdivide article into 1-3 paragraph parts
     */
    subdivideArticle(content: string): Promise<string[]>;
    /**
     * Check if Summarizer API is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Clean up all active summarizer sessions
     */
    destroy(): void;
    /**
     * Hierarchical summarization for long content
     */
    private hierarchicalSummarize;
    /**
     * Summarize a single chunk of text
     */
    private summarizeChunk;
    /**
     * Filter out noise like ads and navigation elements
     */
    private filterNoise;
    /**
     * Map maxLength option to Chrome API length parameter
     */
    private mapLength;
    /**
     * Create standardized AI error
     */
    private createError;
    /**
     * Type guard for AI errors
     */
    private isAIError;
}
export declare class ChromeRewriter {
    private activeSessions;
    /**
     * Rewrite content based on user difficulty level (1-10)
     */
    rewriteContent(text: string, difficulty: number): Promise<string>;
    /**
     * Check if Rewriter API is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Clean up all active rewriter sessions
     */
    destroy(): void;
    /**
     * Map difficulty level to rewriting tone
     * 1-3: More formal, simpler vocabulary
     * 4-7: Casual, moderate vocabulary
     * 8-10: As-is, preserve original complexity
     */
    private mapDifficultyToTone;
    /**
     * Rewrite content in chunks for long text
     */
    private rewriteInChunks;
    /**
     * Rewrite a single chunk of text
     */
    private rewriteChunk;
    /**
     * Validate that rewritten content maintains factual accuracy
     * Basic checks: similar length, structure preserved
     */
    private validateRewrite;
    /**
     * Create standardized AI error
     */
    private createError;
    /**
     * Type guard for AI errors
     */
    private isAIError;
}
export interface TranslationRequest {
    text: string;
    context?: string;
}
export interface TranslationResult {
    original: string;
    translation: string;
    context?: string;
}
export declare class ChromeTranslator {
    private activeSessions;
    private translationCache;
    private readonly maxCacheSize;
    private readonly maxBatchSize;
    private retryHandler;
    private debugger;
    constructor();
    /**
     * Translate text from source to target language with retry and debugging
     */
    translateText(text: string, sourceLanguage: string, targetLanguage: string, context?: string): Promise<string>;
    /**
     * Single translation attempt (no retry)
     */
    private translateTextOnce;
    /**
     * Check API availability for debugging
     */
    private checkAvailability;
    /**
     * Translate text with streaming for long content
     */
    translateStreaming(text: string, sourceLanguage: string, targetLanguage: string, onChunk: (chunk: string) => void): Promise<string>;
    /**
     * Batch translate multiple words/phrases (up to 20 per call)
     */
    batchTranslate(requests: TranslationRequest[], sourceLanguage: string, targetLanguage: string): Promise<TranslationResult[]>;
    /**
     * Check if Translator API is available for a language pair
     */
    isAvailable(sourceLanguage: string, targetLanguage: string): Promise<boolean>;
    /**
     * Get download progress for a language pair
     */
    createWithProgress(sourceLanguage: string, targetLanguage: string, onProgress: (loaded: number, total: number) => void): Promise<TranslatorInstance>;
    /**
     * Clear translation cache
     */
    clearCache(): void;
    /**
     * Get or create translator session for language pair
     */
    private getTranslator;
    /**
     * Split batch translation back into individual translations
     */
    private splitBatchTranslation;
    /**
     * Generate cache key for translation
     */
    private getCacheKey;
    /**
     * Cache translation with size limit
     */
    private cacheTranslation;
    /**
     * Create standardized AI error
     */
    private createError;
    /**
     * Type guard for AI errors
     */
    private isAIError;
    /**
     * Destroy all active translator sessions
     */
    destroyAllSessions(): void;
    /**
     * Destroy and cleanup all resources
     */
    destroy(): void;
}
export declare class ChromeVocabularyAnalyzer {
    private activeSession;
    private readonly systemPrompt;
    /**
     * Analyze vocabulary words for difficulty and generate examples
     */
    analyzeVocabulary(words: string[], context: string): Promise<VocabularyAnalysis[]>;
    /**
     * Generate example sentences for a vocabulary word
     */
    generateExamples(word: string, count?: number): Promise<string[]>;
    /**
     * Check if Prompt API is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Clean up active session
     */
    destroy(): void;
    /**
     * Get or create prompt session
     */
    private getSession;
    /**
     * Analyze a single word
     */
    private analyzeWord;
    /**
     * Validate and normalize difficulty level
     */
    private validateDifficulty;
    /**
     * Estimate difficulty based on word length and complexity
     */
    private estimateDifficulty;
    /**
     * Check if word is likely a proper noun
     */
    private isLikelyProperNoun;
    /**
     * Create standardized AI error
     */
    private createError;
    /**
     * Type guard for AI errors
     */
    private isAIError;
}
export declare class ChromeAIManager implements AIProcessor {
    private languageDetector;
    private summarizer;
    private rewriter;
    private translator;
    private vocabularyAnalyzer;
    constructor();
    /**
     * Detect language of text
     */
    detectLanguage(text: string): Promise<{
        language: string;
        confidence: number;
    }>;
    /**
     * Summarize content
     */
    summarizeContent(text: string, options?: SummaryOptions): Promise<string>;
    /**
     * Rewrite content based on difficulty level
     */
    rewriteContent(text: string, difficulty: number): Promise<string>;
    /**
     * Translate text
     */
    translateText(text: string, from: string, to: string): Promise<string>;
    /**
     * Analyze vocabulary words
     */
    analyzeVocabulary(words: string[], context: string): Promise<VocabularyAnalysis[]>;
    /**
     * Batch translate vocabulary items
     */
    batchTranslateVocabulary(words: string[], sourceLanguage: string, targetLanguage: string, context?: string): Promise<TranslationResult[]>;
    /**
     * Subdivide article into parts
     */
    subdivideArticle(content: string): Promise<string[]>;
    /**
     * Generate example sentences for vocabulary
     */
    generateExamples(word: string, count?: number): Promise<string[]>;
    /**
     * Check if all Chrome AI services are available
     */
    checkAvailability(): Promise<{
        languageDetector: boolean;
        summarizer: boolean;
        rewriter: boolean;
        translator: boolean;
        vocabularyAnalyzer: boolean;
        allAvailable: boolean;
    }>;
    /**
     * Check if specific translator language pair is available
     */
    isTranslatorAvailable(sourceLanguage: string, targetLanguage: string): Promise<boolean>;
    /**
     * Clear all caches
     */
    clearCaches(): void;
    /**
     * Clean up all active sessions
     */
    destroy(): void;
}
export declare function getChromeAI(): ChromeAIManager;
/**
 * Reset the singleton instance (useful for testing)
 */
export declare function resetChromeAI(): void;

//# sourceMappingURL=chrome-ai.d.ts.map