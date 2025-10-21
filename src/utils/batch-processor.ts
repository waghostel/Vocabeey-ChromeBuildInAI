/**
 * Batch Processing System
 * Optimizes AI API calls by batching requests and implementing progressive loading
 */

import { getCacheManager, generateContentHash } from './cache-manager';

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
export class BatchProcessor {
  private readonly defaultOptions: BatchProcessingOptions = {
    batchSize: 20,
    maxConcurrency: 3,
    retryAttempts: 3,
    retryDelay: 1000,
  };
  private cacheManager = getCacheManager();

  constructor(
    private aiProcessor: AIProcessor,
    private options: Partial<BatchProcessingOptions> = {}
  ) {}

  /**
   * Process vocabulary in batches with translations
   */
  async processVocabularyBatch(
    request: VocabularyBatchRequest,
    options?: Partial<BatchProcessingOptions>
  ): Promise<VocabularyBatchResult> {
    const config = { ...this.defaultOptions, ...this.options, ...options };
    const { words, context, sourceLanguage, targetLanguage } = request;

    const result: VocabularyBatchResult = {
      analyses: [],
      translations: [],
      errors: [],
    };

    // Split words into batches
    const batches = this.createBatches(words, config.batchSize);
    const totalBatches = batches.length;

    // Process batches with concurrency control
    const semaphore = new Semaphore(config.maxConcurrency);
    const promises = batches.map(async (batch, index) => {
      return semaphore.acquire(async () => {
        try {
          // Process vocabulary analysis
          const analyses = await this.retryOperation(
            () => this.aiProcessor.analyzeVocabulary(batch, context),
            config.retryAttempts,
            config.retryDelay
          );

          // Process translations
          const translations = await this.retryOperation(
            () =>
              this.aiProcessor.translateText(
                batch.join('\n'),
                sourceLanguage,
                targetLanguage
              ),
            config.retryAttempts,
            config.retryDelay
          );

          // Parse translation results
          const translationResults: TranslationResult[] = batch.map(
            (word, i) => ({
              original: word,
              translation: translations.split('\n')[i] || word,
              context: context.substring(0, 100),
            })
          );

          result.analyses.push(...analyses);
          result.translations.push(...translationResults);

          // Report progress
          if (config.progressCallback) {
            config.progressCallback({
              completed: (index + 1) * config.batchSize,
              total: words.length,
              currentBatch: index + 1,
              totalBatches,
              errors: result.errors,
            });
          }
        } catch (error) {
          const aiError: AIError = {
            type: 'processing_failed',
            message: `Failed to process batch ${index + 1}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            retryable: true,
            originalError: error instanceof Error ? error : undefined,
          };
          result.errors.push(aiError);
        }
      });
    });

    await Promise.all(promises);
    return result;
  }

  /**
   * Create progressive loading chunks for large articles
   */
  createProgressiveChunks(
    content: string,
    chunkSize: number = 1000
  ): ArticleProcessingChunk[] {
    const sentences = this.splitIntoSentences(content);
    const chunks: ArticleProcessingChunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk) {
        chunks.push({
          id: `chunk-${chunkIndex}`,
          content: currentChunk.trim(),
          order: chunkIndex,
          processed: false,
        });
        currentChunk = sentence;
        chunkIndex++;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    // Add final chunk
    if (currentChunk) {
      chunks.push({
        id: `chunk-${chunkIndex}`,
        content: currentChunk.trim(),
        order: chunkIndex,
        processed: false,
      });
    }

    return chunks;
  }

  /**
   * Process article chunks progressively
   */
  async processArticleProgressively(
    chunks: ArticleProcessingChunk[],
    difficulty: number,
    options?: Partial<BatchProcessingOptions>
  ): Promise<ProgressiveLoadingState> {
    const config = { ...this.defaultOptions, ...this.options, ...options };

    const state: ProgressiveLoadingState = {
      chunks: [...chunks],
      currentChunk: 0,
      totalChunks: chunks.length,
      isProcessing: true,
      loadedChunks: new Set(),
    };

    // Process chunks with controlled concurrency
    const semaphore = new Semaphore(config.maxConcurrency);
    const promises = chunks.map(async (chunk, index) => {
      return semaphore.acquire(async () => {
        try {
          const contentHash = generateContentHash(chunk.content);

          // Check cache for summary
          let summary = await this.cacheManager.getCachedProcessedContent(
            contentHash,
            'summary',
            200
          );

          if (!summary) {
            summary = await this.retryOperation(
              () =>
                this.aiProcessor.summarizeContent(chunk.content, {
                  maxLength: 200,
                  format: 'paragraph',
                }),
              config.retryAttempts,
              config.retryDelay
            );
            // Cache the summary
            await this.cacheManager.cacheProcessedContent(
              contentHash,
              'summary',
              200,
              summary
            );
          }

          // Check cache for rewritten content
          let rewritten = await this.cacheManager.getCachedProcessedContent(
            contentHash,
            'rewrite',
            difficulty
          );

          if (!rewritten) {
            rewritten = await this.retryOperation(
              () => this.aiProcessor.rewriteContent(chunk.content, difficulty),
              config.retryAttempts,
              config.retryDelay
            );
            // Cache the rewritten content
            await this.cacheManager.cacheProcessedContent(
              contentHash,
              'rewrite',
              difficulty,
              rewritten
            );
          }

          // Extract and analyze vocabulary
          const words = this.extractVocabulary(chunk.content);
          const vocabulary = await this.retryOperation(
            () => this.aiProcessor.analyzeVocabulary(words, chunk.content),
            config.retryAttempts,
            config.retryDelay
          );

          // Update chunk
          chunk.summary = summary;
          chunk.rewritten = rewritten;
          chunk.vocabulary = vocabulary;
          chunk.processed = true;

          state.loadedChunks.add(chunk.id);

          // Report progress
          if (config.progressCallback) {
            config.progressCallback({
              completed: state.loadedChunks.size,
              total: state.totalChunks,
              currentBatch: index + 1,
              totalBatches: state.totalChunks,
              errors: [],
            });
          }
        } catch (error) {
          console.error(`Failed to process chunk ${chunk.id}:`, error);
        }
      });
    });

    await Promise.all(promises);
    state.isProcessing = false;
    return state;
  }

  /**
   * Optimize API calls by batching similar requests
   */
  async optimizeApiCalls<T>(
    requests: (() => Promise<T>)[],
    options?: Partial<BatchProcessingOptions>
  ): Promise<T[]> {
    const config = { ...this.defaultOptions, ...this.options, ...options };
    const results: T[] = [];
    const semaphore = new Semaphore(config.maxConcurrency);

    // Process requests in batches
    const batches = this.createBatches(requests, config.batchSize);

    for (const batch of batches) {
      const batchPromises = batch.map(request =>
        semaphore.acquire(() =>
          this.retryOperation(request, config.retryAttempts, config.retryDelay)
        )
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxAttempts: number,
    baseDelay: number
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt === maxAttempts) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay =
          baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Split content into sentences
   */
  private splitIntoSentences(content: string): string[] {
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Extract vocabulary words from content
   */
  private extractVocabulary(content: string): string[] {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter((word, index, arr) => arr.indexOf(word) === index)
      .slice(0, 50); // Limit to 50 unique words
  }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire<T>(task: () => Promise<T>): Promise<T> {
    await this.waitForPermit();
    try {
      return await task();
    } finally {
      this.release();
    }
  }

  private async waitForPermit(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>(resolve => {
      this.waiting.push(resolve);
    });
  }

  private release(): void {
    this.permits++;
    const next = this.waiting.shift();
    if (next) {
      this.permits--;
      next();
    }
  }
}

/**
 * Factory function for creating batch processor instances
 */
export function createBatchProcessor(
  aiProcessor: AIProcessor,
  options?: Partial<BatchProcessingOptions>
): BatchProcessor {
  return new BatchProcessor(aiProcessor, options);
}

/**
 * Utility function for processing vocabulary with progress tracking
 */
export async function processVocabularyWithProgress(
  words: string[],
  context: string,
  sourceLanguage: string,
  targetLanguage: string,
  aiProcessor: AIProcessor,
  onProgress?: (progress: BatchProgress) => void
): Promise<VocabularyBatchResult> {
  const batchProcessor = createBatchProcessor(aiProcessor, {
    progressCallback: onProgress,
  });

  return batchProcessor.processVocabularyBatch({
    words,
    context,
    sourceLanguage,
    targetLanguage,
  });
}
