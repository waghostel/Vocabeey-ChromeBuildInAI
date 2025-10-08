/**
 * Cache Manager - Article processing cache with expiration and automatic cleanup
 * Implements Requirements: 8.3, 8.4, 8.5
 */

import { storageManager } from './storage-manager';

import type { ProcessedArticle, VocabularyItem, SentenceItem } from '../types';

// ============================================================================
// Cache Configuration
// ============================================================================

const CACHE_EXPIRATION_DAYS = 30; // Articles expire after 30 days
const CLEANUP_THRESHOLD = 0.85; // Trigger cleanup at 85% storage usage
const CLEANUP_TARGET = 0.7; // Clean up to 70% storage usage

// ============================================================================
// Cache Manager Class
// ============================================================================

export class CacheManager {
  /**
   * Cache an article with expiration
   */
  async cacheArticle(article: ProcessedArticle): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + CACHE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
    );

    // Set cache expiration on the article
    article.cacheExpires = expiresAt;

    await storageManager.saveArticle(article);

    // Check if cleanup is needed
    await this.checkAndCleanup();
  }

  /**
   * Get cached article if not expired
   */
  async getCachedArticle(articleId: string): Promise<ProcessedArticle | null> {
    const article = await storageManager.getArticle(articleId);

    if (!article) {
      return null;
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(article.cacheExpires);

    if (now > expiresAt) {
      console.log(`Article ${articleId} has expired, removing from cache`);
      await storageManager.deleteArticle(articleId);
      return null;
    }

    return article;
  }

  /**
   * Get cached article by URL
   */
  async getCachedArticleByUrl(url: string): Promise<ProcessedArticle | null> {
    const articles = await storageManager.getAllArticles();

    for (const article of articles) {
      if (article.url === url) {
        // Check if expired
        const now = new Date();
        const expiresAt = new Date(article.cacheExpires);

        if (now > expiresAt) {
          console.log(`Article ${article.id} has expired, removing from cache`);
          await storageManager.deleteArticle(article.id);
          continue;
        }

        return article;
      }
    }

    return null;
  }

  /**
   * Invalidate (delete) cached article
   */
  async invalidateArticle(articleId: string): Promise<void> {
    await storageManager.deleteArticle(articleId);
  }

  /**
   * Cache vocabulary item
   */
  async cacheVocabulary(vocab: VocabularyItem): Promise<void> {
    await storageManager.saveVocabulary(vocab);
    await this.checkAndCleanup();
  }

  /**
   * Get vocabulary items for an article
   */
  async getVocabularyForArticle(articleId: string): Promise<VocabularyItem[]> {
    const allVocab = await storageManager.getAllVocabulary();
    return allVocab.filter(vocab => vocab.articleId === articleId);
  }

  /**
   * Cache sentence item
   */
  async cacheSentence(sentence: SentenceItem): Promise<void> {
    await storageManager.saveSentence(sentence);
    await this.checkAndCleanup();
  }

  /**
   * Get sentences for an article
   */
  async getSentencesForArticle(articleId: string): Promise<SentenceItem[]> {
    const allSentences = await storageManager.getAllSentences();
    return allSentences.filter(sentence => sentence.articleId === articleId);
  }

  /**
   * Clean up expired articles
   */
  async cleanupExpiredArticles(): Promise<number> {
    const articles = await storageManager.getAllArticles();
    const now = new Date();
    let cleanedCount = 0;

    for (const article of articles) {
      const expiresAt = new Date(article.cacheExpires);

      if (now > expiresAt) {
        await storageManager.deleteArticle(article.id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired articles`);
    }

    return cleanedCount;
  }

  /**
   * Clean up old vocabulary items (least recently reviewed)
   */
  async cleanupOldVocabulary(targetCount: number): Promise<number> {
    const allVocab = await storageManager.getAllVocabulary();

    if (allVocab.length <= targetCount) {
      return 0;
    }

    // Sort by last reviewed date (oldest first)
    const sorted = allVocab.sort((a, b) => {
      const dateA = new Date(a.lastReviewed).getTime();
      const dateB = new Date(b.lastReviewed).getTime();
      return dateA - dateB;
    });

    // Remove oldest items
    const toRemove = sorted.slice(0, allVocab.length - targetCount);

    for (const vocab of toRemove) {
      await storageManager.deleteVocabulary(vocab.id);
    }

    console.log(`Cleaned up ${toRemove.length} old vocabulary items`);
    return toRemove.length;
  }

  /**
   * Clean up old sentences (oldest first)
   */
  async cleanupOldSentences(targetCount: number): Promise<number> {
    const allSentences = await storageManager.getAllSentences();

    if (allSentences.length <= targetCount) {
      return 0;
    }

    // Sort by creation date (oldest first)
    const sorted = allSentences.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateA - dateB;
    });

    // Remove oldest items
    const toRemove = sorted.slice(0, allSentences.length - targetCount);

    for (const sentence of toRemove) {
      await storageManager.deleteSentence(sentence.id);
    }

    console.log(`Cleaned up ${toRemove.length} old sentences`);
    return toRemove.length;
  }

  /**
   * Check storage quota and trigger cleanup if needed
   */
  async checkAndCleanup(): Promise<void> {
    const quotaInfo = await storageManager.checkStorageQuota();

    if (quotaInfo.percentUsed >= CLEANUP_THRESHOLD) {
      console.log(
        `Storage usage at ${(quotaInfo.percentUsed * 100).toFixed(1)}%, triggering cleanup`
      );
      await this.performAutomaticCleanup();
    }
  }

  /**
   * Perform automatic cleanup to free up storage space
   */
  async performAutomaticCleanup(): Promise<{
    articlesRemoved: number;
    vocabularyRemoved: number;
    sentencesRemoved: number;
    bytesFreed: number;
  }> {
    const beforeQuota = await storageManager.checkStorageQuota();

    // Step 1: Remove expired articles
    const articlesRemoved = await this.cleanupExpiredArticles();

    // Check if we've reached target
    let currentQuota = await storageManager.checkStorageQuota();

    if (currentQuota.percentUsed <= CLEANUP_TARGET) {
      return {
        articlesRemoved,
        vocabularyRemoved: 0,
        sentencesRemoved: 0,
        bytesFreed: beforeQuota.bytesInUse - currentQuota.bytesInUse,
      };
    }

    // Step 2: Remove oldest articles (keep last 10)
    const articles = await storageManager.getAllArticles();
    if (articles.length > 10) {
      const sorted = articles.sort((a, b) => {
        const dateA = new Date(a.processedAt).getTime();
        const dateB = new Date(b.processedAt).getTime();
        return dateA - dateB;
      });

      const toRemove = sorted.slice(0, articles.length - 10);
      for (const article of toRemove) {
        await storageManager.deleteArticle(article.id);
      }
    }

    currentQuota = await storageManager.checkStorageQuota();

    if (currentQuota.percentUsed <= CLEANUP_TARGET) {
      const afterQuota = await storageManager.checkStorageQuota();
      return {
        articlesRemoved,
        vocabularyRemoved: 0,
        sentencesRemoved: 0,
        bytesFreed: beforeQuota.bytesInUse - afterQuota.bytesInUse,
      };
    }

    // Step 3: Clean up old vocabulary (keep last 500)
    const vocabularyRemoved = await this.cleanupOldVocabulary(500);

    currentQuota = await storageManager.checkStorageQuota();

    if (currentQuota.percentUsed <= CLEANUP_TARGET) {
      const afterQuota = await storageManager.checkStorageQuota();
      return {
        articlesRemoved,
        vocabularyRemoved,
        sentencesRemoved: 0,
        bytesFreed: beforeQuota.bytesInUse - afterQuota.bytesInUse,
      };
    }

    // Step 4: Clean up old sentences (keep last 500)
    const sentencesRemoved = await this.cleanupOldSentences(500);

    const afterQuota = await storageManager.checkStorageQuota();

    console.log(
      `Cleanup complete: ${articlesRemoved} articles, ${vocabularyRemoved} vocabulary, ${sentencesRemoved} sentences removed`
    );
    console.log(
      `Storage freed: ${((beforeQuota.bytesInUse - afterQuota.bytesInUse) / 1024).toFixed(2)} KB`
    );

    return {
      articlesRemoved,
      vocabularyRemoved,
      sentencesRemoved,
      bytesFreed: beforeQuota.bytesInUse - afterQuota.bytesInUse,
    };
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalArticles: number;
    expiredArticles: number;
    totalVocabulary: number;
    totalSentences: number;
    storageUsed: number;
    storageQuota: number;
    percentUsed: number;
  }> {
    const articles = await storageManager.getAllArticles();
    const vocabulary = await storageManager.getAllVocabulary();
    const sentences = await storageManager.getAllSentences();
    const quotaInfo = await storageManager.checkStorageQuota();

    const now = new Date();
    const expiredArticles = articles.filter(article => {
      const expiresAt = new Date(article.cacheExpires);
      return now > expiresAt;
    }).length;

    return {
      totalArticles: articles.length,
      expiredArticles,
      totalVocabulary: vocabulary.length,
      totalSentences: sentences.length,
      storageUsed: quotaInfo.bytesInUse,
      storageQuota: quotaInfo.quota,
      percentUsed: quotaInfo.percentUsed,
    };
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    const articles = await storageManager.getAllArticles();
    const vocabulary = await storageManager.getAllVocabulary();
    const sentences = await storageManager.getAllSentences();

    for (const article of articles) {
      await storageManager.deleteArticle(article.id);
    }

    for (const vocab of vocabulary) {
      await storageManager.deleteVocabulary(vocab.id);
    }

    for (const sentence of sentences) {
      await storageManager.deleteSentence(sentence.id);
    }

    console.log('All cache cleared');
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const cacheManager = new CacheManager();
