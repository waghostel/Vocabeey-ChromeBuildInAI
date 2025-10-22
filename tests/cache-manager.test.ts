/**
 * Cache Manager Tests
 * Tests for intelligent caching functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  CacheManager,
  getCacheManager,
  createCacheManager,
  generateContentHash,
  isCachingAvailable,
  resetCacheManagerInstance,
} from '../src/utils/cache-manager';

import { mockChromeStorage } from './setup/chrome-mock';

import type { ProcessedArticle } from '../src/types';

describe('Cache Manager', () => {
  let mockStorage: ReturnType<typeof mockChromeStorage>;

  beforeEach(async () => {
    // Create fresh mock storage for each test
    mockStorage = mockChromeStorage();
    // Clear any existing cache data
    await chrome.storage.local.clear();
    // Reset singleton instance
    resetCacheManagerInstance();
  });

  afterEach(async () => {
    // Comprehensive cleanup procedures
    try {
      // Clear all cache data
      await chrome.storage.local.clear();
      // Reset singleton instance
      resetCacheManagerInstance();
      // Clear all mocks
      vi.clearAllMocks();
      // Cleanup mock storage
      mockStorage.cleanup();
    } catch (error) {
      // Ignore cleanup errors in tests
      console.warn('Test cleanup error:', error);
    }
  });

  describe('Basic Functionality', () => {
    it('should create cache manager instance', () => {
      const cacheManager = createCacheManager();
      expect(cacheManager).toBeInstanceOf(CacheManager);
    });

    it('should get singleton cache manager', () => {
      const manager1 = getCacheManager();
      const manager2 = getCacheManager();
      expect(manager1).toBe(manager2);
    });

    it('should check if caching is available', async () => {
      const available = await isCachingAvailable();
      expect(available).toBe(true);
    });

    it('should generate content hash', () => {
      const content = 'This is test content';
      const hash = generateContentHash(content);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('Article Caching', () => {
    it('should cache and retrieve articles', async () => {
      const cacheManager = createCacheManager();

      const article: ProcessedArticle = {
        id: 'test-article-1',
        url: 'https://example.com/article',
        title: 'Test Article',
        originalLanguage: 'en',
        processedAt: new Date(),
        parts: [],
        processingStatus: 'completed',
        cacheExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      // Cache the article
      await cacheManager.cacheArticle(article);

      // Retrieve the article
      const cached = await cacheManager.getCachedArticle(
        article.url,
        article.originalLanguage
      );

      expect(cached).toBeDefined();
      expect(cached?.id).toBe(article.id);
      expect(cached?.url).toBe(article.url);
      expect(cached?.title).toBe(article.title);
    });

    it('should check if article is cached', async () => {
      const cacheManager = createCacheManager();

      const article: ProcessedArticle = {
        id: 'test-article-2',
        url: 'https://example.com/article2-unique-check',
        title: 'Test Article 2',
        originalLanguage: 'es',
        processedAt: new Date(),
        parts: [],
        processingStatus: 'completed',
        cacheExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      // Ensure clean state before checking
      await chrome.storage.local.clear();

      // Should not be cached initially
      const initialCheck = await cacheManager.isArticleCached(
        article.url,
        article.originalLanguage
      );
      expect(initialCheck).toBe(false);

      // Cache the article
      await cacheManager.cacheArticle(article);

      // Should be cached now
      const afterCacheCheck = await cacheManager.isArticleCached(
        article.url,
        article.originalLanguage
      );
      expect(afterCacheCheck).toBe(true);
    });
  });

  describe('Translation Caching', () => {
    it('should cache and retrieve translations', async () => {
      const cacheManager = createCacheManager();

      const word = 'hello';
      const fromLang = 'en';
      const toLang = 'es';
      const translation = 'hola';
      const _context = 'greeting context';

      // Cache the translation
      await cacheManager.cacheVocabularyTranslation(
        word,
        fromLang,
        toLang,
        translation
      );

      // Retrieve the translation
      const cached = await cacheManager.getCachedTranslation(
        word,
        fromLang,
        toLang
      );

      expect(cached).toBe(translation);
    });

    it('should cache batch translations', async () => {
      const cacheManager = createCacheManager();

      const translations = [
        { word: 'cat', fromLang: 'en', toLang: 'es', translation: 'gato' },
        { word: 'dog', fromLang: 'en', toLang: 'es', translation: 'perro' },
        { word: 'bird', fromLang: 'en', toLang: 'es', translation: 'pájaro' },
      ];

      // Cache batch translations
      await cacheManager.cacheBatchTranslations(translations);

      // Verify each translation is cached
      for (const t of translations) {
        const cached = await cacheManager.getCachedTranslation(
          t.word,
          t.fromLang,
          t.toLang
        );
        expect(cached).toBe(t.translation);
      }
    });
  });

  describe('Processed Content Caching', () => {
    it('should cache and retrieve processed content', async () => {
      const cacheManager = createCacheManager();

      const contentHash = 'abc123';
      const processType = 'summary';
      const difficulty = 5;
      const result = 'This is a summary of the content.';

      // Cache the processed content
      await cacheManager.cacheProcessedContent(
        contentHash,
        processType,
        difficulty,
        result
      );

      // Retrieve the processed content
      const cached = await cacheManager.getCachedProcessedContent(
        contentHash,
        processType,
        difficulty
      );

      expect(cached).toBe(result);
    });

    it('should return null for non-existent processed content', async () => {
      const cacheManager = createCacheManager();

      const cached = await cacheManager.getCachedProcessedContent(
        'nonexistent',
        'summary',
        5
      );
      expect(cached).toBeNull();
    });

    it('should handle different content types correctly', async () => {
      const cacheManager = createCacheManager();
      const contentHash = 'test123';

      // Test summary caching
      await cacheManager.cacheProcessedContent(
        contentHash,
        'summary',
        200,
        'Summary content'
      );

      // Test rewrite caching
      await cacheManager.cacheProcessedContent(
        contentHash,
        'rewrite',
        5,
        'Rewritten content'
      );

      // Test vocabulary caching
      await cacheManager.cacheProcessedContent(
        contentHash,
        'vocabulary',
        100,
        'Vocabulary analysis'
      );

      // Verify each type is cached separately
      expect(
        await cacheManager.getCachedProcessedContent(
          contentHash,
          'summary',
          200
        )
      ).toBe('Summary content');
      expect(
        await cacheManager.getCachedProcessedContent(contentHash, 'rewrite', 5)
      ).toBe('Rewritten content');
      expect(
        await cacheManager.getCachedProcessedContent(
          contentHash,
          'vocabulary',
          100
        )
      ).toBe('Vocabulary analysis');
    });

    it('should handle different parameters for same content type', async () => {
      const cacheManager = createCacheManager();
      const contentHash = 'param123';

      // Cache same content with different parameters
      await cacheManager.cacheProcessedContent(
        contentHash,
        'summary',
        100,
        'Short summary'
      );
      await cacheManager.cacheProcessedContent(
        contentHash,
        'summary',
        200,
        'Long summary'
      );

      // Verify parameters create separate cache entries
      expect(
        await cacheManager.getCachedProcessedContent(
          contentHash,
          'summary',
          100
        )
      ).toBe('Short summary');
      expect(
        await cacheManager.getCachedProcessedContent(
          contentHash,
          'summary',
          200
        )
      ).toBe('Long summary');
    });

    it('should handle cache errors gracefully', async () => {
      const cacheManager = createCacheManager();

      // Mock storage error
      const originalSet = chrome.storage.local.set;
      chrome.storage.local.set = vi
        .fn()
        .mockRejectedValue(new Error('Storage error'));

      // Should not throw error
      await expect(
        cacheManager.cacheProcessedContent('hash', 'summary', 100, 'content')
      ).resolves.toBeUndefined();

      // Mock get error
      const originalGet = chrome.storage.local.get;
      chrome.storage.local.get = vi
        .fn()
        .mockRejectedValue(new Error('Get error'));

      // Should return null on error
      const result = await cacheManager.getCachedProcessedContent(
        'hash',
        'summary',
        100
      );
      expect(result).toBeNull();

      // Restore original functions
      chrome.storage.local.set = originalSet;
      chrome.storage.local.get = originalGet;
    });

    it('should respect TTL for processed content', async () => {
      const cacheManager = createCacheManager({ ttl: 100 }); // 100ms TTL
      const contentHash = 'ttl123';

      // Cache content
      await cacheManager.cacheProcessedContent(
        contentHash,
        'summary',
        100,
        'TTL test content'
      );

      // Should be available immediately
      expect(
        await cacheManager.getCachedProcessedContent(
          contentHash,
          'summary',
          100
        )
      ).toBe('TTL test content');

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be null after TTL expires
      expect(
        await cacheManager.getCachedProcessedContent(
          contentHash,
          'summary',
          100
        )
      ).toBeNull();
    });

    it('should generate consistent cache keys', async () => {
      const cacheManager = createCacheManager();
      const contentHash = 'key123';

      // Cache content
      await cacheManager.cacheProcessedContent(
        contentHash,
        'summary',
        150,
        'Key test content'
      );

      // Should retrieve with same parameters
      expect(
        await cacheManager.getCachedProcessedContent(
          contentHash,
          'summary',
          150
        )
      ).toBe('Key test content');

      // Should not retrieve with different parameters
      expect(
        await cacheManager.getCachedProcessedContent(
          contentHash,
          'summary',
          151
        )
      ).toBeNull();
      expect(
        await cacheManager.getCachedProcessedContent(
          contentHash,
          'rewrite',
          150
        )
      ).toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('should clear all caches', async () => {
      const cacheManager = createCacheManager();

      // Ensure clean state before starting
      await chrome.storage.local.clear();

      // Add some cached data
      const article: ProcessedArticle = {
        id: 'test-clear-unique-v2',
        url: 'https://example.com/clear-test-unique-v2',
        title: 'Clear Test',
        originalLanguage: 'en',
        processedAt: new Date(),
        parts: [],
        processingStatus: 'completed',
        cacheExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      await cacheManager.cacheArticle(article);
      await cacheManager.cacheVocabularyTranslation(
        'testclear-v2',
        'en',
        'es',
        'prueba'
      );

      // Verify data is cached
      expect(
        await cacheManager.isArticleCached(
          article.url,
          article.originalLanguage
        )
      ).toBe(true);
      expect(
        await cacheManager.getCachedTranslation('testclear-v2', 'en', 'es')
      ).toBe('prueba');

      // Clear all caches
      await cacheManager.clearAllCaches();

      // Verify data is cleared
      expect(
        await cacheManager.isArticleCached(
          article.url,
          article.originalLanguage
        )
      ).toBe(false);
      expect(
        await cacheManager.getCachedTranslation('testclear-v2', 'en', 'es')
      ).toBeNull();
    });

    it('should perform cache maintenance', async () => {
      const cacheManager = createCacheManager();

      // This should not throw and should return cleanup results
      const results = await cacheManager.performMaintenance();

      expect(results).toBeDefined();
      expect(typeof results.articlesRemoved).toBe('number');
      expect(typeof results.translationsRemoved).toBe('number');
      expect(typeof results.processedContentRemoved).toBe('number');
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache statistics', async () => {
      const cacheManager = createCacheManager();

      // Get initial stats
      const allStats = cacheManager.getAllCacheStats();
      expect(allStats).toBeInstanceOf(Map);
      expect(allStats.size).toBeGreaterThan(0);

      // Each namespace should have stats
      for (const [_namespace, stats] of allStats) {
        expect(stats).toBeDefined();
        expect(typeof (stats as any).hitRate).toBe('number');
        expect(typeof (stats as any).missRate).toBe('number');
        expect(typeof (stats as any).totalRequests).toBe('number');
      }
    });
  });
});
