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
} from '../src/utils/cache-manager';
import { mockChromeStorage } from './setup/chrome-mock';
import type { ProcessedArticle } from '../src/types';

describe('Cache Manager', () => {
  beforeEach(() => {
    mockChromeStorage();
  });

  afterEach(() => {
    vi.clearAllMocks();
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
        url: 'https://example.com/article2',
        title: 'Test Article 2',
        originalLanguage: 'es',
        processedAt: new Date(),
        parts: [],
        processingStatus: 'completed',
        cacheExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

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
      const context = 'greeting context';

      // Cache the translation
      await cacheManager.cacheVocabularyTranslation(
        word,
        fromLang,
        toLang,
        translation,
        context
      );

      // Retrieve the translation
      const cached = await cacheManager.getCachedTranslation(
        word,
        fromLang,
        toLang,
        context
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
  });

  describe('Cache Management', () => {
    it('should clear all caches', async () => {
      const cacheManager = createCacheManager();

      // Add some cached data
      const article: ProcessedArticle = {
        id: 'test-clear',
        url: 'https://example.com/clear-test',
        title: 'Clear Test',
        originalLanguage: 'en',
        processedAt: new Date(),
        parts: [],
        processingStatus: 'completed',
        cacheExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      await cacheManager.cacheArticle(article);
      await cacheManager.cacheVocabularyTranslation(
        'test',
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
      expect(await cacheManager.getCachedTranslation('test', 'en', 'es')).toBe(
        'prueba'
      );

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
        await cacheManager.getCachedTranslation('test', 'en', 'es')
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
        expect(typeof stats.hitRate).toBe('number');
        expect(typeof stats.missRate).toBe('number');
        expect(typeof stats.totalRequests).toBe('number');
      }
    });
  });
});
