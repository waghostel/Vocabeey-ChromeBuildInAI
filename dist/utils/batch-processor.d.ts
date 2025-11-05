/**
 * Batch Processing System
 * Optimizes AI API calls by batching requests and implementing progressive loading
 */
import type { AIProcessor, VocabularyAnalysis, AIError } from '../types';
import type { TranslationResult } from './chrome-ai';
export interface BatchProcessingOptions {
    batchSize: number;
    maxConcurrency: number;
    retryAttempts: number;
    retryDelay: number;
    progressCallback?: (progress: BatchProgress) => void;
}
export interface BatchProgress {
    completed: number;
    total: number;
    currentBatch: number;
    totalBatches: number;
    errors: AIError[];
}
export interface VocabularyBatchRequest {
    words: string[];
    context: string;
    sourceLanguage: string;
    targetLanguage: string;
}
export interface VocabularyBatchResult {
    analyses: VocabularyAnalysis[];
    translations: TranslationResult[];
    errors: AIError[];
}
export interface ArticleProcessingChunk {
    id: string;
    content: string;
    order: number;
    processed: boolean;
    summary?: string;
    rewritten?: string;
    vocabulary?: VocabularyAnalysis[];
    translations?: TranslationResult[];
}
export interface ProgressiveLoadingState {
    chunks: ArticleProcessingChunk[];
    currentChunk: number;
    totalChunks: number;
    isProcessing: boolean;
    loadedChunks: Set<string>;
}
/**
 * Batch Processing System for optimizing AI API calls
 */
export declare class BatchProcessor {
    private aiProcessor;
    private options;
    private readonly defaultOptions;
    private cacheManager;
    constructor(aiProcessor: AIProcessor, options?: Partial<BatchProcessingOptions>);
    /**
     * Process vocabulary in batches with translations
     */
    processVocabularyBatch(request: VocabularyBatchRequest, options?: Partial<BatchProcessingOptions>): Promise<VocabularyBatchResult>;
    /**
     * Create progressive loading chunks for large articles
     */
    createProgressiveChunks(content: string, chunkSize?: number): ArticleProcessingChunk[];
    /**
     * Process article chunks progressively
     */
    processArticleProgressively(chunks: ArticleProcessingChunk[], difficulty: number, options?: Partial<BatchProcessingOptions>): Promise<ProgressiveLoadingState>;
    /**
     * Optimize API calls by batching similar requests
     */
    optimizeApiCalls<T>(requests: (() => Promise<T>)[], options?: Partial<BatchProcessingOptions>): Promise<T[]>;
    /**
     * Create batches from array
     */
    private createBatches;
    /**
     * Retry operation with exponential backoff
     */
    private retryOperation;
    /**
     * Split content into sentences
     */
    private splitIntoSentences;
    /**
     * Extract vocabulary words from content
     */
    private extractVocabulary;
}
/**
 * Factory function for creating batch processor instances
 */
export declare function createBatchProcessor(aiProcessor: AIProcessor, options?: Partial<BatchProcessingOptions>): BatchProcessor;
/**
 * Utility function for processing vocabulary with progress tracking
 */
export declare function processVocabularyWithProgress(words: string[], context: string, sourceLanguage: string, targetLanguage: string, aiProcessor: AIProcessor, onProgress?: (progress: BatchProgress) => void): Promise<VocabularyBatchResult>;
//# sourceMappingURL=batch-processor.d.ts.map