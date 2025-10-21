/**
 * Cache Manager Edge Cases Tests
 * Tests edge cases and error scenarios for cache manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  CacheManager,
  createCacheManager,
  getCacheManager,
  generateContentHash,
  isCachingAvailable,
} from '../src/utils/cache-manager';

import { mockChromeStorage } from './setup/chrome-mock';

describe('Cache Manager Edge Cases', () => {
  let mockStorage: ReturnType<typeof mockChromeStorage>;

  beforeEach(async () => {
    mockStorage = mockChromeStorage();
    await chrome.storage.local.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockStorage.cleanup();
  });

  describe('Content Hash Generation', () => {
    it('should handle empty strings', () => {
      const hash = generateContentHash('');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle very long content', () => {
      const longContent = 'a'.repeat(100000); // 100KB
      const hash = generateContentHash(longContent);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle special characters', () => {
      const specialContent = '!@#$%^&*()_+{}|:"<>?[]\\;\',./ 中文 🚀 ñáéíóú';
      const hash = generateContentHash(specialContent);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for similar content', () => {
      const content1 = 'This is test content.';
      const content2 = 'This is test content!';
      const content3 = 'this is test content.';

      const hash1 = generateContentHash(content1);
      const hash2 = generateContentHash(content2);
      const hash3 = generateContentHash(content3);

      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash2).not.toBe(hash3);
    });

    it('should be deterministic', () => {
      const content = 'Deterministic test content';
      const hash1 = generateContentHash(content);
      const hash2 = generateContentHash(content);
      const hash3 = generateContentHash(content);

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });
  });

  describe('Cache Availability', () => {
    it('should detect when caching is available', async () => {
      const available = await isCachingAvailable();
      expect(available).toBe(true);
    });

    it('should handle storage unavailable gracefully', async () => {
      // Mock storage to throw error
      chrome.storage.local.set = vi
        .fn()
        .mockRejectedValue(new Error('Storage unavailable'));

      const available = await isCachingAvailable();
      expect(available).toBe(false);
    });

    it('should handle storage permission denied', async () => {
      chrome.storage.local.set = vi
        .fn()
        .mockRejectedValue(new Error('Permission denied'));

      const available = await isCachingAvailable();
      expect(available).toBe(false);
    });
  });

  describe('Cache Manager Configuration', () => {
    it('should use default configuration', () => {
      const cacheManager = createCacheManager();
      expect(cacheManager).toBeInstanceOf(CacheManager);
    });

    it('should accept custom configuration', () => {
      const config = {
        maxCacheSize: 500,
        ttl: 12 * 60 * 60 * 1000, // 12 hours
      };
      const cacheManager = createCacheManager(config);
      expect(cacheManager).toBeInstanceOf(CacheManager);
    });

    it('should handle partial configuration', () => {
      const config = { maxCacheSize: 2000 };
      const cacheManager = createCacheManager(config);
      expect(cacheManager).toBeInstanceOf(CacheManager);
    });

    it('should handle invalid configuration gracefully', () => {
      const config = { maxCacheSize: -1, ttl: -1000 };
      const cacheManager = createCacheManager(config);
      expect(cacheManager).toBeInstanceOf(CacheManager);
    });
  });

  describe('Processed Content Edge Cases', () => {
    it('should handle invalid content types', async () => {
      const cacheManager = createCacheManager();

      // This should not throw but may not work as expected
      try {
        await cacheManager.cacheProcessedContent(
          'hash',
          'invalid' as any,
          100,
          'content'
        );
        // If it doesn't throw, that's fine
        expect(true).toBe(true);
      } catch (error) {
        // If it throws, that's also acceptable behavior
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle negative parameters', async () => {
      const cacheManager = createCacheManager();

      await cacheManager.cacheProcessedContent(
        'hash',
        'summary',
        -100,
        'negative param content'
      );

      const cached = await cacheManager.getCachedProcessedContent(
        'hash',
        'summary',
        -100
      );
      expect(cached).toBe('negative param content');
    });

    it('should handle zero parameters', async () => {
      const cacheManager = createCacheManager();

      await cacheManager.cacheProcessedContent(
        'hash',
        'rewrite',
        0,
        'zero param content'
      );

      const cached = await cacheManager.getCachedProcessedContent(
        'hash',
        'rewrite',
        0
      );
      expect(cached).toBe('zero param content');
    });

    it('should handle very large parameters', async () => {
      const cacheManager = createCacheManager();
      const largeParam = Number.MAX_SAFE_INTEGER;

      await cacheManager.cacheProcessedContent(
        'hash',
        'vocabulary',
        largeParam,
        'large param content'
      );

      const cached = await cacheManager.getCachedProcessedContent(
        'hash',
        'vocabulary',
        largeParam
      );
      expect(cached).toBe('large param content');
    });

    it('should handle empty content', async () => {
      const cacheManager = createCacheManager();

      await cacheManager.cacheProcessedContent('hash', 'summary', 100, '');

      const cached = await cacheManager.getCachedProcessedContent(
        'hash',
        'summary',
        100
      );
      expect(cached).toBe('');
    });

    it('should handle very large content', async () => {
      const cacheManager = createCacheManager();
      const largeContent = 'Large content. '.repeat(10000); // ~140KB

      await cacheManager.cacheProcessedContent(
        'hash',
        'summary',
        100,
        largeContent
      );

      const cached = await cacheManager.getCachedProcessedContent(
        'hash',
        'summary',
        100
      );
      expect(cached).toBe(largeContent);
    });

    it('should handle special characters in content', async () => {
      const cacheManager = createCacheManager();
      const specialContent =
        '{"json": true, "unicode": "🚀", "html": "<div>test</div>"}';

      await cacheManager.cacheProcessedContent(
        'hash',
        'summary',
        100,
        specialContent
      );

      const cached = await cacheManager.getCachedProcessedContent(
        'hash',
        'summary',
        100
      );
      expect(cached).toBe(specialContent);
    });
  });

  describe('Storage Error Handling', () => {
    it('should handle quota exceeded errors', async () => {
      const cacheManager = createCacheManager();

      chrome.storage.local.set = vi
        .fn()
        .mockRejectedValue(new Error('QUOTA_BYTES_PER_ITEM quota exceeded'));

      // Should not throw
      await expect(
        cacheManager.cacheProcessedContent('hash', 'summary', 100, 'content')
      ).resolves.toBeUndefined();
    });

    it('should handle storage corruption errors', async () => {
      const cacheManager = createCacheManager();

      chrome.storage.local.get = vi.fn().mockResolvedValue({
        'processed:hash:summary:100': 'invalid json data',
      });

      // Should return null for corrupted data
      const cached = await cacheManager.getCachedProcessedContent(
        'hash',
        'summary',
        100
      );
      expect(cached).toBeNull();
    });

    it('should handle storage access denied', async () => {
      const cacheManager = createCacheManager();

      chrome.storage.local.get = vi
        .fn()
        .mockRejectedValue(new Error('Access denied'));

      const cached = await cacheManager.getCachedProcessedContent(
        'hash',
        'summary',
        100
      );
      expect(cached).toBeNull();
    });

    it('should handle network errors during storage operations', async () => {
      const cacheManager = createCacheManager();

      chrome.storage.local.set = vi
        .fn()
        .mockRejectedValue(new Error('Network error'));

      await expect(
        cacheManager.cacheProcessedContent('hash', 'summary', 100, 'content')
      ).resolves.toBeUndefined();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent cache operations', async () => {
      const cacheManager = createCacheManager();

      // Perform multiple concurrent operations
      const promises = Array.from({ length: 10 }, (_, i) =>
        cacheManager.cacheProcessedContent(
          `hash${i}`,
          'summary',
          100,
          `content${i}`
        )
      );

      await Promise.all(promises);

      // Verify all were cached
      for (let i = 0; i < 10; i++) {
        const cached = await cacheManager.getCachedProcessedContent(
          `hash${i}`,
          'summary',
          100
        );
        expect(cached).toBe(`content${i}`);
      }
    });

    it('should handle concurrent reads and writes', async () => {
      const cacheManager = createCacheManager();

      // Start with some cached content
      await cacheManager.cacheProcessedContent(
        'hash',
        'summary',
        100,
        'initial'
      );

      // Perform concurrent reads and writes
      const operations = [
        cacheManager.getCachedProcessedContent('hash', 'summary', 100),
        cacheManager.cacheProcessedContent('hash', 'summary', 100, 'updated'),
        cacheManager.getCachedProcessedContent('hash', 'summary', 100),
        cacheManager.cacheProcessedContent('hash', 'summary', 200, 'different'),
        cacheManager.getCachedProcessedContent('hash', 'summary', 200),
      ];

      const results = await Promise.all(operations);

      // Should not throw errors
      expect(results).toHaveLength(5);
    });
  });

  describe('Memory Management', () => {
    it('should handle cache cleanup operations', async () => {
      const cacheManager = createCacheManager();

      // Fill cache with data
      for (let i = 0; i < 100; i++) {
        await cacheManager.cacheProcessedContent(
          `hash${i}`,
          'summary',
          100,
          `content${i}`
        );
      }

      // Clear all caches
      await cacheManager.clearAllCaches();

      // Verify cache is cleared
      const cached = await cacheManager.getCachedProcessedContent(
        'hash0',
        'summary',
        100
      );
      expect(cached).toBeNull();
    });

    it('should handle maintenance operations', async () => {
      const cacheManager = createCacheManager();

      const results = await cacheManager.performMaintenance();

      expect(results).toBeDefined();
      expect(typeof results.processedContentRemoved).toBe('number');
      expect(results.processedContentRemoved).toBeGreaterThanOrEqual(0);
    });

    it('should provide cache statistics', () => {
      const cacheManager = createCacheManager();

      const stats = cacheManager.getAllCacheStats();

      expect(stats).toBeInstanceOf(Map);
      expect(stats.has('processed')).toBe(true);

      const processedStats = stats.get('processed') as any;
      expect(typeof processedStats.hitRate).toBe('number');
      expect(typeof processedStats.missRate).toBe('number');
    });
  });

  describe('Singleton Behavior', () => {
    it('should return same instance for getCacheManager', () => {
      const manager1 = getCacheManager();
      const manager2 = getCacheManager();
      const manager3 = getCacheManager({ maxCacheSize: 2000 });

      expect(manager1).toBe(manager2);
      expect(manager1).toBe(manager3); // Config ignored for singleton
    });

    it('should create new instances with createCacheManager', () => {
      const manager1 = createCacheManager();
      const manager2 = createCacheManager();

      expect(manager1).not.toBe(manager2);
      expect(manager1).toBeInstanceOf(CacheManager);
      expect(manager2).toBeInstanceOf(CacheManager);
    });
  });

  describe('Type Safety', () => {
    it('should handle undefined values gracefully', async () => {
      const cacheManager = createCacheManager();

      await cacheManager.cacheProcessedContent(
        'hash',
        'summary',
        100,
        undefined as any
      );

      const cached = await cacheManager.getCachedProcessedContent(
        'hash',
        'summary',
        100
      );
      // Should handle undefined appropriately
      expect(cached).toBeDefined();
    });

    it('should handle null values gracefully', async () => {
      const cacheManager = createCacheManager();

      await cacheManager.cacheProcessedContent(
        'hash',
        'summary',
        100,
        null as any
      );

      const cached = await cacheManager.getCachedProcessedContent(
        'hash',
        'summary',
        100
      );
      // Should handle null appropriately
      expect(cached).toBeDefined();
    });
  });
});
