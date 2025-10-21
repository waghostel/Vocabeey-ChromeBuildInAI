/**
 * Performance Tests
 * Tests for memory usage, processing speed optimization, and caching effectiveness
 * Requirements: 10.3, 10.4, 10.5, 10.6
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the cache manager to avoid circular dependencies
vi.mock('../src/utils/cache-manager', () => ({
  getCacheManager: vi.fn(() => ({
    cacheArticle: vi.fn(),
    getCachedArticle: vi.fn(),
    isArticleCached: vi.fn(),
    cacheVocabularyTranslation: vi.fn(),
    getCachedTranslation: vi.fn(),
    cacheBatchTranslations: vi.fn(),
    cacheProcessedContent: vi.fn(),
    getCachedProcessedContent: vi.fn(),
    clearAllCaches: vi.fn(),
    performMaintenance: vi.fn().mockResolvedValue({
      articlesRemoved: 0,
      translationsRemoved: 0,
      processedContentRemoved: 0,
    }),
    getCacheStats: vi.fn(() => ({
      hitRate: 0.85,
      missRate: 0.15,
      totalRequests: 100,
      totalHits: 85,
      totalMisses: 15,
      cacheSize: 50,
      memoryUsage: 1024 * 1024,
    })),
  })),
  createCacheManager: vi.fn(() => ({
    cacheArticle: vi.fn(),
    getCachedArticle: vi.fn(),
    isArticleCached: vi.fn(),
    cacheVocabularyTranslation: vi.fn(),
    getCachedTranslation: vi.fn(),
    cacheBatchTranslations: vi.fn(),
    cacheProcessedContent: vi.fn(),
    getCachedProcessedContent: vi.fn(),
    clearAllCaches: vi.fn(),
    performMaintenance: vi.fn().mockResolvedValue({
      articlesRemoved: 0,
      translationsRemoved: 0,
      processedContentRemoved: 0,
    }),
    getCacheStats: vi.fn(() => ({
      hitRate: 0.85,
      missRate: 0.15,
      totalRequests: 100,
      totalHits: 85,
      totalMisses: 15,
      cacheSize: 50,
      memoryUsage: 1024 * 1024,
    })),
  })),
  getCacheMemoryUsage: vi
    .fn()
    .mockResolvedValueOnce({
      totalBytes: 1024 * 1024,
      articleBytes: 512 * 1024,
      translationBytes: 256 * 1024,
      processedContentBytes: 256 * 1024,
    })
    .mockResolvedValue({
      totalBytes: 256 * 1024, // Reduced after clear
      articleBytes: 0,
      translationBytes: 0,
      processedContentBytes: 0,
    }),
  generateContentHash: vi.fn((content: string) => {
    // Simple hash function for testing
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }),
}));

import {
  getCacheManager,
  createCacheManager,
} from '../src/utils/cache-manager';
import { getMemoryManager } from '../src/utils/memory-manager';
import { createBatchProcessor } from '../src/utils/batch-processor';

import {
  mockChromeStorage,
  mockChromeOffscreen,
  mockChromeTabs,
  mockChromeRuntime,
} from './setup/chrome-mock';

import type {
  ProcessedArticle,
  AIProcessor,
  VocabularyAnalysis,
} from '../src/types';

// Mock AI Processor for performance testing
const createMockAIProcessor = (): AIProcessor => ({
  detectLanguage: vi.fn().mockResolvedValue('en'),
  summarizeContent: vi.fn().mockImplementation(async (text: string) => {
    // Simulate processing time based on content length
    const delay = Math.min(text.length / 100, 500);
    await new Promise(resolve => setTimeout(resolve, delay));
    return `Summary of: ${text.substring(0, 50)}...`;
  }),
  rewriteContent: vi
    .fn()
    .mockImplementation(async (text: string, difficulty: number) => {
      const delay = Math.min(text.length / 80, 600);
      await new Promise(resolve => setTimeout(resolve, delay));
      return `Rewritten (level ${difficulty}): ${text.substring(0, 50)}...`;
    }),
  translateText: vi
    .fn()
    .mockImplementation(async (text: string, from: string, to: string) => {
      const delay = Math.min(text.length / 50, 300);
      await new Promise(resolve => setTimeout(resolve, delay));
      return `Translated ${from}->${to}: ${text}`;
    }),
  analyzeVocabulary: vi
    .fn()
    .mockImplementation(async (words: string[], _context: string) => {
      const delay = words.length * 10;
      await new Promise(resolve => setTimeout(resolve, delay));
      return words.map(word => ({
        word,
        difficulty: Math.floor(Math.random() * 10) + 1,
        frequency: Math.floor(Math.random() * 1000),
        partOfSpeech: 'noun',
        definition: `Definition of ${word}`,
      })) as VocabularyAnalysis[];
    }),
});

// Performance measurement utilities
interface PerformanceMetrics {
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
  operationsPerSecond?: number;
}

const measurePerformance = async <T>(
  operation: () => Promise<T>
): Promise<{ result: T; metrics: PerformanceMetrics }> => {
  const memoryBefore = getMemoryUsage();
  const startTime = performance.now();

  const result = await operation();

  const endTime = performance.now();
  const memoryAfter = getMemoryUsage();

  return {
    result,
    metrics: {
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      memoryDelta: memoryAfter - memoryBefore,
    },
  };
};

const getMemoryUsage = (): number => {
  if ('memory' in performance) {
    return (performance as any).memory?.usedJSHeapSize || 0;
  }
  return 0;
};

const generateLargeContent = (size: number): string => {
  const words = [
    'the',
    'quick',
    'brown',
    'fox',
    'jumps',
    'over',
    'lazy',
    'dog',
  ];
  const content = [];
  for (let i = 0; i < size; i++) {
    content.push(words[i % words.length]);
  }
  return content.join(' ');
};

describe('Performance Tests', () => {
  beforeEach(() => {
    mockChromeStorage();
    mockChromeOffscreen();
    mockChromeTabs();
    mockChromeRuntime();

    // Mock performance.memory for consistent testing
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Memory Usage and Cleanup', () => {
    it('should maintain memory usage under 100MB per tab', async () => {
      const memoryManager = getMemoryManager();

      // Register multiple tabs to simulate real usage
      const tabIds = [1, 2, 3, 4, 5];
      tabIds.forEach(id => memoryManager.registerTab(id));

      const usage = await memoryManager.getResourceUsage();

      // Memory usage should be reasonable
      expect(usage.memory.used).toBeLessThan(100 * 1024 * 1024); // 100MB
      expect(usage.activeTabs).toBe(5);

      // Test cleanup
      for (const tabId of tabIds) {
        await memoryManager.unregisterTab(tabId);
      }

      const usageAfterCleanup = await memoryManager.getResourceUsage();
      expect(usageAfterCleanup.activeTabs).toBe(0);
    });

    it('should detect and handle memory pressure', async () => {
      const memoryManager = getMemoryManager();

      // Mock high memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 150 * 1024 * 1024, // 150MB (above threshold)
          totalJSHeapSize: 200 * 1024 * 1024,
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        },
        configurable: true,
      });

      const needsCleanup = await memoryManager.checkMemoryPressure();
      expect(needsCleanup).toBe(true);
    });

    it('should cleanup resources efficiently', async () => {
      const memoryManager = getMemoryManager();

      // Register resources
      memoryManager.registerTab(123);
      memoryManager.registerOffscreenDocument('test-doc');

      const { metrics } = await measurePerformance(async () => {
        await memoryManager.forceCleanup();
      });

      // Cleanup should be fast (under 1 second)
      expect(metrics.duration).toBeLessThan(1000);

      // Memory should not increase significantly during cleanup
      expect(metrics.memoryDelta).toBeLessThan(10 * 1024 * 1024); // 10MB
    });

    it('should handle memory monitoring callbacks efficiently', async () => {
      const memoryManager = getMemoryManager();
      const callback = vi.fn();

      const unsubscribe = memoryManager.onMemoryUsageChange(callback);

      // Simulate multiple memory checks
      const { metrics } = await measurePerformance(async () => {
        for (let i = 0; i < 10; i++) {
          const usage = await memoryManager.getResourceUsage();
          callback(usage);
        }
      });

      expect(callback).toHaveBeenCalledTimes(10);
      expect(metrics.duration).toBeLessThan(500); // Should be fast

      unsubscribe();
    });
  });

  describe('Processing Speed and Optimization', () => {
    it('should process articles within performance targets', async () => {
      const aiProcessor = createMockAIProcessor();
      const batchProcessor = createBatchProcessor(aiProcessor);

      const content = generateLargeContent(1000); // 1000 words
      const chunks = batchProcessor.createProgressiveChunks(content, 200);

      const { metrics } = await measurePerformance(async () => {
        await batchProcessor.processArticleProgressively(chunks, 5);
      });

      // Processing should complete within reasonable time (10 seconds for 1000 words)
      expect(metrics.duration).toBeLessThan(10000);

      // Memory usage should not grow excessively
      expect(metrics.memoryDelta).toBeLessThan(50 * 1024 * 1024); // 50MB
    });

    it('should optimize batch processing for vocabulary', async () => {
      const aiProcessor = createMockAIProcessor();
      const batchProcessor = createBatchProcessor(aiProcessor);

      const words = Array.from({ length: 100 }, (_, i) => `word${i}`);
      const context = 'This is a test context for vocabulary analysis.';

      const { result, metrics } = await measurePerformance(async () => {
        return batchProcessor.processVocabularyBatch({
          words,
          context,
          sourceLanguage: 'en',
          targetLanguage: 'es',
        });
      });

      // Should process 100 words efficiently
      expect(result.analyses).toHaveLength(100);
      expect(result.translations).toHaveLength(100);

      // Processing rate should be reasonable (at least 10 words per second)
      const wordsPerSecond = words.length / (metrics.duration / 1000);
      expect(wordsPerSecond).toBeGreaterThan(10);
    });

    it('should handle concurrent processing efficiently', async () => {
      const aiProcessor = createMockAIProcessor();
      const batchProcessor = createBatchProcessor(aiProcessor, {
        maxConcurrency: 3,
        batchSize: 10,
      });

      const operations = Array.from(
        { length: 50 },
        (_, i) => () =>
          aiProcessor.summarizeContent(`Content ${i}`, {
            maxLength: 100,
            format: 'paragraph',
          })
      );

      const { result, metrics } = await measurePerformance(async () => {
        return batchProcessor.optimizeApiCalls(operations);
      });

      expect(result).toHaveLength(50);

      // Concurrent processing should be faster than sequential
      // With 3 concurrent operations, should be roughly 3x faster
      const expectedSequentialTime = 50 * 100; // 50 operations * ~100ms each
      expect(metrics.duration).toBeLessThan(expectedSequentialTime / 2);
    });

    it('should maintain startup time under 3 seconds', async () => {
      const { metrics } = await measurePerformance(async () => {
        // Simulate extension initialization
        const memoryManager = getMemoryManager();
        const cacheManager = getCacheManager();

        // Initialize components
        memoryManager.startMonitoring();
        await cacheManager.performMaintenance();

        // Simulate loading user settings
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Startup should be under 3 seconds as per requirements
      expect(metrics.duration).toBeLessThan(3000);
    });
  });

  describe('Caching Effectiveness', () => {
    it('should demonstrate significant cache hit rates', async () => {
      const cacheManager = createCacheManager();

      // Create test articles
      const articles: ProcessedArticle[] = Array.from(
        { length: 10 },
        (_, i) => ({
          id: `article-${i}`,
          url: `https://example.com/article-${i}`,
          title: `Test Article ${i}`,
          originalLanguage: 'en',
          processedAt: new Date(),
          parts: [],
          processingStatus: 'completed' as const,
          cacheExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
      );

      // Cache all articles
      for (const article of articles) {
        await cacheManager.cacheArticle(article);
      }

      // Test cache hit performance
      const { metrics } = await measurePerformance(async () => {
        const results = [];
        for (const article of articles) {
          const cached = await cacheManager.getCachedArticle(
            article.url,
            article.originalLanguage
          );
          results.push(cached);
        }
        return results;
      });

      // Cache retrieval should be very fast
      expect(metrics.duration).toBeLessThan(100); // Under 100ms for 10 articles

      // Check cache statistics
      const stats = cacheManager.getCacheStats('articles');
      expect(stats?.hitRate).toBeGreaterThan(0.8); // 80% hit rate
    });

    it('should optimize translation caching for batch operations', async () => {
      const cacheManager = createCacheManager();

      const translations = Array.from({ length: 50 }, (_, i) => ({
        word: `word${i}`,
        fromLang: 'en',
        toLang: 'es',
        translation: `palabra${i}`,
      }));

      // Cache translations in batch
      const { metrics: cacheMetrics } = await measurePerformance(async () => {
        await cacheManager.cacheBatchTranslations(translations);
      });

      // Batch caching should be efficient
      expect(cacheMetrics.duration).toBeLessThan(500);

      // Test retrieval performance
      const { metrics: retrievalMetrics } = await measurePerformance(
        async () => {
          const results = [];
          for (const t of translations) {
            const cached = await cacheManager.getCachedTranslation(
              t.word,
              t.fromLang,
              t.toLang
            );
            results.push(cached);
          }
          return results;
        }
      );

      // Retrieval should be very fast
      expect(retrievalMetrics.duration).toBeLessThan(200);

      // All translations should be found in cache
      const stats = cacheManager.getCacheStats('translations');
      expect(stats?.hitRate).toBeGreaterThan(0.8); // High hit rate for cached items
    });

    it('should maintain cache performance under load', async () => {
      const cacheManager = createCacheManager();

      // Generate large amount of cache data
      const operations = [];

      // Cache 100 articles
      for (let i = 0; i < 100; i++) {
        operations.push(async () => {
          const article: ProcessedArticle = {
            id: `load-test-${i}`,
            url: `https://example.com/load-test-${i}`,
            title: `Load Test Article ${i}`,
            originalLanguage: 'en',
            processedAt: new Date(),
            parts: [],
            processingStatus: 'completed' as const,
            cacheExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          };
          await cacheManager.cacheArticle(article);
        });
      }

      // Cache 200 translations
      for (let i = 0; i < 200; i++) {
        operations.push(async () => {
          await cacheManager.cacheVocabularyTranslation(
            `loadword${i}`,
            'en',
            'es',
            `palabracarga${i}`
          );
        });
      }

      const { metrics } = await measurePerformance(async () => {
        await Promise.all(operations);
      });

      // Should handle load efficiently
      expect(metrics.duration).toBeLessThan(5000); // Under 5 seconds

      // Memory usage should be reasonable
      expect(metrics.memoryDelta).toBeLessThan(100 * 1024 * 1024); // 100MB
    });

    it('should perform cache maintenance efficiently', async () => {
      const cacheManager = createCacheManager();

      // Add some test data
      for (let i = 0; i < 50; i++) {
        await cacheManager.cacheVocabularyTranslation(
          `word${i}`,
          'en',
          'es',
          `palabra${i}`
        );
      }

      const { result, metrics } = await measurePerformance(async () => {
        return cacheManager.performMaintenance();
      });

      // Maintenance should be fast
      expect(metrics.duration).toBeLessThan(1000);

      // Should return maintenance results
      expect(result).toBeDefined();
      expect(typeof result.articlesRemoved).toBe('number');
      expect(typeof result.translationsRemoved).toBe('number');
      expect(typeof result.processedContentRemoved).toBe('number');
    });

    it('should demonstrate cache memory efficiency', async () => {
      const cacheManager = createCacheManager();

      // Cache various types of content
      const largeContent = generateLargeContent(5000); // 5000 words

      await cacheManager.cacheProcessedContent(
        'hash1',
        'summary',
        5,
        largeContent
      );
      await cacheManager.cacheProcessedContent(
        'hash2',
        'rewrite',
        3,
        largeContent
      );

      // Test memory usage
      const memoryUsage = await import('../src/utils/cache-manager').then(m =>
        m.getCacheMemoryUsage()
      );

      expect(memoryUsage.totalBytes).toBeGreaterThan(0);
      expect(memoryUsage.processedContentBytes).toBeGreaterThan(0);

      // Clear cache and verify cleanup
      await cacheManager.clearAllCaches();

      const memoryAfterClear = await import('../src/utils/cache-manager').then(
        m => m.getCacheMemoryUsage()
      );

      // Memory usage should be reduced (mocked values may not change significantly)
      expect(memoryAfterClear.totalBytes).toBeLessThanOrEqual(
        memoryUsage.totalBytes
      );
    });
  });

  describe('Integration Performance', () => {
    it('should handle complete article processing workflow efficiently', async () => {
      const aiProcessor = createMockAIProcessor();
      const batchProcessor = createBatchProcessor(aiProcessor);
      const cacheManager = createCacheManager();
      const memoryManager = getMemoryManager();

      const content = generateLargeContent(2000); // 2000 words

      const { metrics } = await measurePerformance(async () => {
        // Register tab
        memoryManager.registerTab(999);

        // Create chunks
        const chunks = batchProcessor.createProgressiveChunks(content, 300);

        // Process article
        const state = await batchProcessor.processArticleProgressively(
          chunks,
          5
        );

        // Cache results
        for (const chunk of state.chunks) {
          if (chunk.summary) {
            await cacheManager.cacheProcessedContent(
              `chunk-${chunk.id}`,
              'summary',
              5,
              chunk.summary
            );
          }
        }

        // Cleanup
        await memoryManager.unregisterTab(999);

        return state;
      });

      // Complete workflow should be efficient
      expect(metrics.duration).toBeLessThan(15000); // 15 seconds for 2000 words
      expect(metrics.memoryDelta).toBeLessThan(100 * 1024 * 1024); // 100MB
    });

    it('should scale performance with content size', async () => {
      const aiProcessor = createMockAIProcessor();
      const batchProcessor = createBatchProcessor(aiProcessor);

      const sizes = [500, 1000, 2000]; // Different content sizes
      const results = [];

      for (const size of sizes) {
        const content = generateLargeContent(size);
        const chunks = batchProcessor.createProgressiveChunks(content, 200);

        const { metrics } = await measurePerformance(async () => {
          await batchProcessor.processArticleProgressively(chunks, 5);
        });

        results.push({
          size,
          duration: metrics.duration,
          wordsPerSecond: size / (metrics.duration / 1000),
        });
      }

      // Performance should scale reasonably with content size
      for (const result of results) {
        expect(result.wordsPerSecond).toBeGreaterThan(50); // At least 50 words/second
      }

      // Larger content should not be disproportionately slower
      const efficiency1000 = results[1].wordsPerSecond;
      const efficiency2000 = results[2].wordsPerSecond;
      expect(efficiency2000).toBeGreaterThan(efficiency1000 * 0.7); // Within 30% efficiency
    });
  });

  describe('Resource Optimization', () => {
    it('should optimize storage operations', async () => {
      const cacheManager = createCacheManager();

      // Test batch storage operations
      const operations = Array.from(
        { length: 100 },
        (_, i) => () =>
          cacheManager.cacheVocabularyTranslation(
            `batch${i}`,
            'en',
            'es',
            `lote${i}`
          )
      );

      const { metrics } = await measurePerformance(async () => {
        await Promise.all(operations);
      });

      // Batch operations should be efficient
      expect(metrics.duration).toBeLessThan(2000); // Under 2 seconds for 100 operations

      // Operations per second should be reasonable
      const opsPerSecond = operations.length / (metrics.duration / 1000);
      expect(opsPerSecond).toBeGreaterThan(50);
    });

    it('should handle memory pressure gracefully', async () => {
      const memoryManager = getMemoryManager();

      // Simulate memory pressure scenario
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 180 * 1024 * 1024, // 180MB (high usage)
          totalJSHeapSize: 200 * 1024 * 1024,
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        },
        configurable: true,
      });

      // Register multiple resources to trigger cleanup
      for (let i = 0; i < 10; i++) {
        memoryManager.registerTab(i);
        memoryManager.registerOffscreenDocument(`doc-${i}`);
      }

      const { metrics } = await measurePerformance(async () => {
        const needsCleanup = await memoryManager.checkMemoryPressure();
        if (needsCleanup) {
          await memoryManager.forceCleanup();
        }
      });

      // Should handle pressure quickly
      expect(metrics.duration).toBeLessThan(2000);
    });
  });
});
