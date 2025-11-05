/**
 * Gemini API client for fallback AI processing
 * Provides language detection, summarization, rewriting, translation, and vocabulary analysis
 */
import type { AIProcessor, SummaryOptions, VocabularyAnalysis } from '../types';
interface GeminiConfig {
    apiKey: string;
    model?: string;
    baseUrl?: string;
}
export declare class GeminiAPIClient implements AIProcessor {
    private config;
    private rateLimiter;
    private readonly defaultModel;
    private readonly baseUrl;
    constructor(config: GeminiConfig);
    /**
     * Update API key
     */
    setApiKey(apiKey: string): void;
    /**
     * Check if API key is configured
     */
    isConfigured(): boolean;
    /**
     * Detect language of text
     * Returns language code with medium confidence (0.5) since Gemini doesn't provide confidence scores
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
     * Translate text from source to target language
     */
    translateText(text: string, from: string, to: string): Promise<string>;
    /**
     * Analyze vocabulary words
     */
    analyzeVocabulary(words: string[], context: string): Promise<VocabularyAnalysis[]>;
    /**
     * Check if Gemini API is available
     */
    isAvailable(): Promise<boolean>;
    /**
     * Generate content using Gemini API
     */
    private generateContent;
    /**
     * Handle API error responses
     */
    private handleAPIError;
    /**
     * Get difficulty description for prompts
     */
    private getDifficultyDescription;
    /**
     * Create standardized AI error
     */
    private createError;
    /**
     * Type guard for AI errors
     */
    private isAIError;
}

//# sourceMappingURL=gemini-api.d.ts.map