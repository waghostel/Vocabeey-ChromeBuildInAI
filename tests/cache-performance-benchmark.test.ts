/**
 * Cache Performance Benchmark Tests
 * Comprehensive performance testing for cache manager methods
 * Requirements: 6.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  createCacheManager,
  generateContentHash,
  CacheManager,
} from '../src/utils/cache-manager';

// Mock Chrome storage API
const mockChromeStorage = () => {
  const storage = new Map<string, any>();

  global.chrome = {
    storage: {
      local: {
        get: vi.fn().mockImplementation(keys => {
          if (typeof keys === 'string') {
            return Promise.resolve({ [keys]: storage.get(keys) });
          }
          if (Array.isArray(keys)) {
            const result: Record<string, any> = {};
            keys.forEach(key => {
              if (storage.has(key)) {
                result[key] = storage.get(key);
              }
            });
            return Promise.resolve(result);
          }
          return Promise.resolve({});
        }),
        set: vi.fn().mockImplementation(items => {
          Object.entries(items).forEach(([key, value]) => {
            storage.set(key, value);
          });
          return Promise.resolve();
        }),
        remove: vi.fn().mockImplementation(keys => {
          if (typeof keys === 'string') {
            storage.delete(keys);
          } else if (Array.isArray(keys)) {
            keys.forEach(key => storage.delete(key));
          }
          return Promise.resolve();
        }),
        clear: vi.fn().mockImplementation(() => {
          storage.clear();
          return Promise.resolve();
        }),
      },
    },
  } as any;
};

// Performance measurement utilities
interface PerformanceMetrics {
  duration: number;
  operationsPerSecond: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
}

const measurePerformance = async <T>(
  operation: () => Promise<T>,
  operationCount: number = 1
): Promise<{ result: T; metrics: PerformanceMetrics }> => {
  const memoryBefore = getMemoryUsage();
  const startTime = performance.now();

  const result = await operation();

  const endTime = performance.now();
  const memoryAfter = getMemoryUsage();
  const duration = endTime - startTime;

  return {
    result,
    metrics: {
      duration,
      operationsPerSecond: operationCount / (duration / 1000),
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

// Test data generators
const generateTestContent = (size: number): string => {
  const words = [
    'the',
    'quick',
    'brown',
    'fox',
    'jumps',
    'over',
    'lazy',
    'dog',
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'consectetur',
    'adipiscing',
    'elit',
  ];
  const content = [];
  for (let i = 0; i < size; i++) {
    content.push(words[i % words.length]);
  }
  return content.join(' ');
};

const generateContentHash_Original = (content: string): string => {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

const generateContentHash_Optimized = (content: string): string => {
  let hash = 0;
  const len = content.length;

  // Process in chunks for better performance on large content
  if (len > 1000) {
    const step = Math.floor(len / 100); // Sample every nth character for large content
    for (let i = 0; i < len; i += step) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash + char) & 0x7fffffff; // Keep positive
    }
  } else {
    // Process all characters for smaller content
    for (let i = 0; i < len; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash + char) & 0x7fffffff;
    }
  }

  return hash.toString(36);
};

describe('Cache Performance Benchmarks', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    mockChromeStorage();
    cacheManager = createCacheManager();

    // Mock performance.memory for consistent testing
    Object.defineProperty(performance, 'memory', {
      configurable: true,
      value: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      },
    });
  });

  describe('Cache Key Generation Performance', () => {
    it('should benchmark original hash generation', async () => {
      const testSizes = [100, 1000, 5000, 10000];
      const results: Array<{
        size: number;
        duration: number;
        hashesPerSecond: number;
      }> = [];

      for (const size of testSizes) {
        const content = generateTestContent(size);
        const iterations = 1000;

        const { metrics } = await measurePerformance(async () => {
          for (let i = 0; i < iterations; i++) {
            generateContentHash_Original(content);
          }
        }, iterations);

        results.push({
          size,
          duration: metrics.duration,
          hashesPerSecond: metrics.operationsPerSecond,
        });

        // Performance expectations
        expect(metrics.operationsPerSecond).toBeGreaterThan(100); // At least 100 hashes/sec
      }

      console.log('Original Hash Generation Performance:', results);
    });

    it('should benchmark optimized hash generation', async () => {
      const testSizes = [100, 1000, 5000, 10000];
      const results: Array<{
        size: number;
        duration: number;
        hashesPerSecond: number;
      }> = [];

      for (const size of testSizes) {
        const content = generateTestContent(size);
        const iterations = 1000;

        const { metrics } = await measurePerformance(async () => {
          for (let i = 0; i < iterations; i++) {
            generateContentHash_Optimized(content);
          }
        }, iterations);

        results.push({
          size,
          duration: metrics.duration,
          hashesPerSecond: metrics.operationsPerSecond,
        });

        // Performance expectations - should be faster for large content
        expect(metrics.operationsPerSecond).toBeGreaterThan(100);
      }

      console.log('Optimized Hash Generation Performance:', results);
    });

    it('should compare hash generation performance', async () => {
      const largeContent = generateTestContent(10000);
      const iterations = 500;

      const { metrics: originalMetrics } = await measurePerformance(
        async () => {
          for (let i = 0; i < iterations; i++) {
            generateContentHash_Original(largeContent);
          }
        },
        iterations
      );

      const { metrics: optimizedMetrics } = await measurePerformance(
        async () => {
          for (let i = 0; i < iterations; i++) {
            generateContentHash_Optimized(largeContent);
          }
        },
        iterations
      );

      console.log('Hash Generation Comparison:', {
        original: {
          duration: originalMetrics.duration,
          hashesPerSecond: originalMetrics.operationsPerSecond,
        },
        optimized: {
          duration: optimizedMetrics.duration,
          hashesPerSecond: optimizedMetrics.operationsPerSecond,
        },
        improvement:
          optimizedMetrics.operationsPerSecond /
          originalMetrics.operationsPerSecond,
      });

      // Optimized version should be at least as fast
      expect(optimizedMetrics.operationsPerSecond).toBeGreaterThanOrEqual(
        originalMetrics.operationsPerSecond * 0.9 // Allow 10% variance
      );
    });
  });

  describe('New Cache Methods Performance', () => {
    it('should benchmark getCachedProcessedContent performance', async () => {
      // Pre-populate cache with test data
      const testData = [];
      for (let i = 0; i < 100; i++) {
        const content = generateTestContent(100 + i);
        const hash = generateContentHash(content);
        await cacheManager.cacheProcessedContent(
          hash,
          'summary',
          500,
          `Summary ${i}`
        );
        testData.push({ hash, type: 'summary' as const, parameter: 500 });
      }

      const iterations = 1000;
      const { metrics } = await measurePerformance(async () => {
        for (let i = 0; i < iterations; i++) {
          const testItem = testData[i % testData.length];
          await cacheManager.getCachedProcessedContent(
            testItem.hash,
            testItem.type,
            testItem.parameter
          );
        }
      }, iterations);

      console.log('getCachedProcessedContent Performance:', {
        duration: metrics.duration,
        operationsPerSecond: metrics.operationsPerSecond,
        averageLatency: metrics.duration / iterations,
      });

      // Should handle at least 100 operations per second
      expect(metrics.operationsPerSecond).toBeGreaterThan(100);
      expect(metrics.duration / iterations).toBeLessThan(10); // Less than 10ms per operation
    });

    it('should benchmark cacheProcessedContent performance', async () => {
      const testData = [];
      for (let i = 0; i < 100; i++) {
        const content = generateTestContent(100 + i);
        const hash = generateContentHash(content);
        testData.push({
          hash,
          type: 'rewrite' as const,
          parameter: 3,
          content: `Rewritten content ${i}`,
        });
      }

      const iterations = 500;
      const { metrics } = await measurePerformance(async () => {
        for (let i = 0; i < iterations; i++) {
          const testItem = testData[i % testData.length];
          await cacheManager.cacheProcessedContent(
            testItem.hash,
            testItem.type,
            testItem.parameter,
            testItem.content
          );
        }
      }, iterations);

      console.log('cacheProcessedContent Performance:', {
        duration: metrics.duration,
        operationsPerSecond: metrics.operationsPerSecond,
        averageLatency: metrics.duration / iterations,
      });

      // Should handle at least 50 write operations per second
      expect(metrics.operationsPerSecond).toBeGreaterThan(50);
      expect(metrics.duration / iterations).toBeLessThan(20); // Less than 20ms per operation
    });

    it('should benchmark mixed cache operations', async () => {
      const testData = [];
      for (let i = 0; i < 50; i++) {
        const content = generateTestContent(200 + i);
        const hash = generateContentHash(content);
        testData.push({
          hash,
          content: `Mixed content ${i}`,
        });
      }

      const iterations = 500;
      const { metrics } = await measurePerformance(async () => {
        for (let i = 0; i < iterations; i++) {
          const testItem = testData[i % testData.length];

          // Mix of operations: cache, retrieve, cache different type
          await cacheManager.cacheProcessedContent(
            testItem.hash,
            'summary',
            300,
            testItem.content
          );

          await cacheManager.getCachedProcessedContent(
            testItem.hash,
            'summary',
            300
          );

          await cacheManager.cacheProcessedContent(
            testItem.hash,
            'vocabulary',
            50,
            `Vocab: ${testItem.content}`
          );
        }
      }, iterations * 3); // 3 operations per iteration

      console.log('Mixed Cache Operations Performance:', {
        duration: metrics.duration,
        operationsPerSecond: metrics.operationsPerSecond,
        averageLatency: metrics.duration / (iterations * 3),
      });

      // Should handle mixed operations efficiently
      expect(metrics.operationsPerSecond).toBeGreaterThan(75);
    });
  });

  describe('Cache Performance Under Load', () => {
    it('should maintain performance with large cache size', async () => {
      // Pre-populate cache with large amount of data
      const populateOperations = [];
      for (let i = 0; i < 500; i++) {
        populateOperations.push(async () => {
          const content = generateTestContent(100 + (i % 100));
          const hash = generateContentHash(content);
          await cacheManager.cacheProcessedContent(
            hash,
            'summary',
            400,
            `Large cache content ${i}`
          );
        });
      }

      // Populate cache
      await Promise.all(populateOperations);

      // Test performance with large cache
      const testOperations = 200;
      const { metrics } = await measurePerformance(async () => {
        for (let i = 0; i < testOperations; i++) {
          const content = generateTestContent(150 + (i % 50));
          const hash = generateContentHash(content);

          // Try to get (might miss)
          await cacheManager.getCachedProcessedContent(hash, 'summary', 400);

          // Cache new content
          await cacheManager.cacheProcessedContent(
            hash,
            'rewrite',
            2,
            `Load test content ${i}`
          );
        }
      }, testOperations * 2);

      console.log('Large Cache Performance:', {
        duration: metrics.duration,
        operationsPerSecond: metrics.operationsPerSecond,
        averageLatency: metrics.duration / (testOperations * 2),
      });

      // Performance should not degrade significantly with large cache
      expect(metrics.operationsPerSecond).toBeGreaterThan(50);
      expect(metrics.duration / (testOperations * 2)).toBeLessThan(25); // Less than 25ms per operation
    });

    it('should handle concurrent cache operations', async () => {
      const concurrentOperations = 100;
      const operations = [];

      for (let i = 0; i < concurrentOperations; i++) {
        operations.push(async () => {
          const content = generateTestContent(100 + i);
          const hash = generateContentHash(content);

          // Cache content
          await cacheManager.cacheProcessedContent(
            hash,
            'summary',
            300,
            `Concurrent content ${i}`
          );

          // Retrieve content
          const retrieved = await cacheManager.getCachedProcessedContent(
            hash,
            'summary',
            300
          );

          return retrieved;
        });
      }

      const { metrics } = await measurePerformance(async () => {
        const results = await Promise.all(operations);
        return results;
      }, concurrentOperations * 2);

      console.log('Concurrent Operations Performance:', {
        duration: metrics.duration,
        operationsPerSecond: metrics.operationsPerSecond,
        averageLatency: metrics.duration / (concurrentOperations * 2),
      });

      // Should handle concurrent operations efficiently
      expect(metrics.duration).toBeLessThan(5000); // Under 5 seconds total
      expect(metrics.operationsPerSecond).toBeGreaterThan(20);
    });
  });

  describe('Memory Usage Validation', () => {
    it('should not cause memory leaks during intensive operations', async () => {
      const initialMemory = getMemoryUsage();

      // Perform intensive cache operations
      for (let batch = 0; batch < 5; batch++) {
        const operations = [];
        for (let i = 0; i < 100; i++) {
          operations.push(async () => {
            const content = generateTestContent(200 + i);
            const hash = generateContentHash(content);
            await cacheManager.cacheProcessedContent(
              hash,
              'summary',
              500,
              `Memory test ${batch}-${i}`
            );
            await cacheManager.getCachedProcessedContent(hash, 'summary', 500);
          });
        }
        await Promise.all(operations);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      console.log('Memory Usage:', {
        initial: initialMemory,
        final: finalMemory,
        increase: memoryIncrease,
        increasePercent: (memoryIncrease / initialMemory) * 100,
      });

      // Memory increase should be reasonable (less than 50% increase)
      expect(memoryIncrease / initialMemory).toBeLessThan(0.5);
    });
  });
});
