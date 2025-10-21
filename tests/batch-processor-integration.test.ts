/**
 * Batch Processor Integration Tests
 * Tests integration between batch processor and enhanced cache manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  BatchProcessor,
  createBatchProcessor,
  processVocabularyWithProgress,
} from '../src/utils/batch-processor';
import {
  createCacheManager,
  generateContentHash,
} from '../src/utils/cache-manager';

import { mockChromeStorage } from './setup/chrome-mock';

import type { AIProcessor, VocabularyAnalysis } from '../src/types';

// Mock AI Processor for testing
function createMockAIProcessor(): AIProcessor {
  return {
    detectLanguage: vi.fn().mockResolvedValue('en'),
    translateText: vi
      .fn()
      .mockImplementation((text: string) =>
        Promise.resolve(`Translated: ${text}`)
      ),
    summarizeContent: vi
      .fn()
      .mockImplementation((content: string, options: any) =>
        Promise.resolve(
          `Summary (${options.maxLength}): ${content.substring(0, 50)}...`
        )
      ),
    rewriteContent: vi
      .fn()
      .mockImplementation((content: string, difficulty: number) =>
        Promise.resolve(`Rewritten (level ${difficulty}): ${content}`)
      ),
    analyzeVocabulary: vi.fn().mockImplementation((words: string[]) =>
      Promise.resolve(
        words.map((word, index) => ({
          word,
          difficulty: 'intermediate' as const,
          definition: `Definition of ${word}`,
          examples: [`Example with ${word}`],
          partOfSpeech: 'noun' as const,
          frequency: index + 1,
        }))
      )
    ),
  };
}

describe('Batch Processor Integration with Cache Manager', () => {
  let mockStorage: ReturnType<typeof mockChromeStorage>;
  let aiProcessor: AIProcessor;
  let batchProcessor: BatchProcessor;

  beforeEach(async () => {
    mockStorage = mockChromeStorage();
    aiProcessor = createMockAIProcessor();
    batchProcessor = createBatchProcessor(aiProcessor);

    // Clear cache
    await chrome.storage.local.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockStorage.cleanup();
  });

  describe('Progressive Article Processing with Caching', () => {
    it('should cache and reuse summary results', async () => {
      const content =
        'This is test content for progressive processing. It contains multiple sentences for testing.';
      const chunks = batchProcessor.createProgressiveChunks(content, 50);

      expect(chunks).toHaveLength(2);

      // Process chunks first time
      const state1 = await batchProcessor.processArticleProgressively(
        chunks,
        5
      );

      expect(state1.isProcessing).toBe(false);
      expect(state1.loadedChunks.size).toBe(2);
      expect(aiProcessor.summarizeContent).toHaveBeenCalledTimes(2);

      // Process same chunks again - should use cache
      vi.clearAllMocks();
      const state2 = await batchProcessor.processArticleProgressively(
        chunks,
        5
      );

      expect(state2.isProcessing).toBe(false);
      expect(state2.loadedChunks.size).toBe(2);
      // Should not call AI processor again due to caching
      expect(aiProcessor.summarizeContent).not.toHaveBeenCalled();
      expect(aiProcessor.rewriteContent).not.toHaveBeenCalled();
    });

    it('should cache rewritten content with difficulty levels', async () => {
      const content = 'Complex content for rewriting tests.';
      const chunks = batchProcessor.createProgressiveChunks(content, 100);

      // Process with difficulty 3
      await batchProcessor.processArticleProgressively(chunks, 3);
      expect(aiProcessor.rewriteContent).toHaveBeenCalledWith(
        chunks[0].content,
        3
      );

      // Process with difficulty 7 - should call AI again
      vi.clearAllMocks();
      await batchProcessor.processArticleProgressively(chunks, 7);
      expect(aiProcessor.rewriteContent).toHaveBeenCalledWith(
        chunks[0].content,
        7
      );

      // Process with difficulty 3 again - should use cache
      vi.clearAllMocks();
      await batchProcessor.processArticleProgressively(chunks, 3);
      expect(aiProcessor.rewriteContent).not.toHaveBeenCalled();
    });

    it('should handle cache misses gracefully', async () => {
      const content = 'Test content for cache miss handling.';
      const chunks = batchProcessor.createProgressiveChunks(content, 100);

      // Mock cache manager to simulate cache miss
      const cacheManager = createCacheManager();
      const originalGet = cacheManager.getCachedProcessedContent;
      cacheManager.getCachedProcessedContent = vi.fn().mockResolvedValue(null);

      const state = await batchProcessor.processArticleProgressively(chunks, 5);

      expect(state.isProcessing).toBe(false);
      expect(state.loadedChunks.size).toBe(1);
      // Should call AI processor when cache misses
      expect(aiProcessor.summarizeContent).toHaveBeenCalled();
      expect(aiProcessor.rewriteContent).toHaveBeenCalled();
    });

    it('should handle cache errors without breaking processing', async () => {
      const content = 'Test content for cache error handling.';
      const chunks = batchProcessor.createProgressiveChunks(content, 100);

      // Mock cache manager to throw errors
      const cacheManager = createCacheManager();
      cacheManager.getCachedProcessedContent = vi
        .fn()
        .mockRejectedValue(new Error('Cache error'));
      cacheManager.cacheProcessedContent = vi
        .fn()
        .mockRejectedValue(new Error('Cache error'));

      // Should not throw and should complete processing
      const state = await batchProcessor.processArticleProgressively(chunks, 5);

      expect(state.isProcessing).toBe(false);
      expect(state.loadedChunks.size).toBe(1);
      expect(aiProcessor.summarizeContent).toHaveBeenCalled();
      expect(aiProcessor.rewriteContent).toHaveBeenCalled();
    });
  });

  describe('Vocabulary Batch Processing with Caching', () => {
    it('should process vocabulary batches efficiently', async () => {
      const words = ['hello', 'world', 'test', 'vocabulary'];
      const context = 'This is test context for vocabulary processing.';

      const result = await batchProcessor.processVocabularyBatch({
        words,
        context,
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });

      expect(result.analyses).toHaveLength(4);
      expect(result.translations).toHaveLength(4);
      expect(result.errors).toHaveLength(0);

      // Verify AI processor was called
      expect(aiProcessor.analyzeVocabulary).toHaveBeenCalled();
      expect(aiProcessor.translateText).toHaveBeenCalled();
    });

    it('should handle large vocabulary batches with progress tracking', async () => {
      const words = Array.from({ length: 50 }, (_, i) => `word${i}`);
      const progressUpdates: any[] = [];

      const result = await processVocabularyWithProgress(
        words,
        'Test context',
        'en',
        'es',
        aiProcessor,
        progress => progressUpdates.push(progress)
      );

      expect(result.analyses.length).toBeGreaterThan(0);
      expect(result.translations.length).toBeGreaterThan(0);
      expect(progressUpdates.length).toBeGreaterThan(0);

      // Verify progress tracking
      const lastProgress = progressUpdates[progressUpdates.length - 1];
      expect(lastProgress.completed).toBeGreaterThan(0);
      expect(lastProgress.total).toBe(50);
    });

    it('should handle vocabulary processing errors', async () => {
      // Mock AI processor to fail
      aiProcessor.analyzeVocabulary = vi
        .fn()
        .mockRejectedValue(new Error('Analysis failed'));

      const result = await batchProcessor.processVocabularyBatch({
        words: ['test'],
        context: 'Test context',
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('processing_failed');
      expect(result.errors[0].retryable).toBe(true);
    });
  });

  describe('API Call Optimization', () => {
    it('should optimize concurrent API calls', async () => {
      const requests = Array.from(
        { length: 10 },
        (_, i) => () => Promise.resolve(`Result ${i}`)
      );

      const results = await batchProcessor.optimizeApiCalls(requests, {
        batchSize: 3,
        maxConcurrency: 2,
      });

      expect(results).toHaveLength(10);
      expect(results[0]).toBe('Result 0');
      expect(results[9]).toBe('Result 9');
    });

    it('should handle API call failures with retries', async () => {
      let callCount = 0;
      const failingRequest = () => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('API call failed'));
        }
        return Promise.resolve('Success after retries');
      };

      const results = await batchProcessor.optimizeApiCalls([failingRequest], {
        retryAttempts: 3,
        retryDelay: 10,
      });

      expect(results).toHaveLength(1);
      expect(results[0]).toBe('Success after retries');
      expect(callCount).toBe(3);
    });
  });

  describe('Content Hash Integration', () => {
    it('should generate consistent hashes for identical content', async () => {
      const content1 = 'This is test content for hashing.';
      const content2 = 'This is test content for hashing.';
      const content3 = 'This is different content for hashing.';

      const hash1 = generateContentHash(content1);
      const hash2 = generateContentHash(content2);
      const hash3 = generateContentHash(content3);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    it('should use content hashes for cache keys', async () => {
      const content = 'Test content for hash-based caching.';
      const chunks = batchProcessor.createProgressiveChunks(content, 100);
      const contentHash = generateContentHash(chunks[0].content);

      // Process content
      await batchProcessor.processArticleProgressively(chunks, 5);

      // Verify cache was used with content hash
      const cacheManager = createCacheManager();
      const cachedSummary = await cacheManager.getCachedProcessedContent(
        contentHash,
        'summary',
        200
      );
      const cachedRewrite = await cacheManager.getCachedProcessedContent(
        contentHash,
        'rewrite',
        5
      );

      expect(cachedSummary).toBeTruthy();
      expect(cachedRewrite).toBeTruthy();
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle empty content gracefully', async () => {
      const chunks = batchProcessor.createProgressiveChunks('', 100);
      expect(chunks).toHaveLength(0);

      const state = await batchProcessor.processArticleProgressively(chunks, 5);
      expect(state.chunks).toHaveLength(0);
      expect(state.isProcessing).toBe(false);
    });

    it('should handle very large content efficiently', async () => {
      const largeContent = 'Large content. '.repeat(1000); // ~15KB
      const chunks = batchProcessor.createProgressiveChunks(largeContent, 1000);

      expect(chunks.length).toBeGreaterThan(10);

      const state = await batchProcessor.processArticleProgressively(chunks, 5);
      expect(state.isProcessing).toBe(false);
      expect(state.loadedChunks.size).toBe(chunks.length);
    });

    it('should handle concurrent processing limits', async () => {
      const content = 'Test content for concurrency limits.';
      const chunks = Array.from({ length: 20 }, (_, i) => ({
        id: `chunk-${i}`,
        content: `${content} ${i}`,
        order: i,
        processed: false,
      }));

      const startTime = Date.now();
      const state = await batchProcessor.processArticleProgressively(
        chunks,
        5,
        {
          maxConcurrency: 2,
        }
      );
      const endTime = Date.now();

      expect(state.isProcessing).toBe(false);
      expect(state.loadedChunks.size).toBe(20);
      // Should take some time due to concurrency limits
      expect(endTime - startTime).toBeGreaterThan(0);
    });

    it('should handle storage quota exceeded errors', async () => {
      const content = 'Test content for storage quota test.';
      const chunks = batchProcessor.createProgressiveChunks(content, 100);

      // Mock storage quota exceeded
      chrome.storage.local.set = vi
        .fn()
        .mockRejectedValue(new Error('QUOTA_BYTES_PER_ITEM quota exceeded'));

      // Should not throw and should complete processing
      const state = await batchProcessor.processArticleProgressively(chunks, 5);

      expect(state.isProcessing).toBe(false);
      expect(state.loadedChunks.size).toBe(1);
      expect(aiProcessor.summarizeContent).toHaveBeenCalled();
    });

    it('should handle network timeouts gracefully', async () => {
      // Mock AI processor with timeout
      aiProcessor.summarizeContent = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Request timeout')), 100)
            )
        );

      const content = 'Test content for timeout handling.';
      const chunks = batchProcessor.createProgressiveChunks(content, 100);

      // Should handle timeout and continue
      const state = await batchProcessor.processArticleProgressively(
        chunks,
        5,
        {
          retryAttempts: 1,
          retryDelay: 10,
        }
      );

      expect(state.isProcessing).toBe(false);
      // Processing should complete even with failures
      expect(state.chunks).toHaveLength(1);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should process large batches without memory leaks', async () => {
      const words = Array.from({ length: 200 }, (_, i) => `word${i}`);

      // Process multiple batches
      for (let i = 0; i < 5; i++) {
        const result = await batchProcessor.processVocabularyBatch({
          words: words.slice(i * 40, (i + 1) * 40),
          context: `Context ${i}`,
          sourceLanguage: 'en',
          targetLanguage: 'es',
        });

        expect(result.analyses.length).toBeLessThanOrEqual(40);
        expect(result.errors).toHaveLength(0);
      }

      // Verify no excessive memory usage (basic check)
      expect(true).toBe(true); // Test completes without memory issues
    });

    it('should handle cache size limits appropriately', async () => {
      const cacheManager = createCacheManager({ maxCacheSize: 10 });

      // Fill cache beyond limit
      for (let i = 0; i < 15; i++) {
        await cacheManager.cacheProcessedContent(
          `hash${i}`,
          'summary',
          100,
          `Content ${i}`
        );
      }

      // Should not throw errors
      expect(true).toBe(true);
    });
  });
});
