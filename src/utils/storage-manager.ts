/**
 * Storage Manager - Versioned storage schema with validation and quota monitoring
 * Implements Requirements: 8.1, 8.2, 8.4
 */

import { getCacheManager, type CacheManager } from './cache-manager';

import type {
  UserSettings,
  ProcessedArticle,
  VocabularyItem,
  SentenceItem,
  ProcessingTask,
} from '../types';

// ============================================================================
// Storage Schema Version
// ============================================================================

export const CURRENT_SCHEMA_VERSION = '1.0.0';

// ============================================================================
// Storage Schema Interface
// ============================================================================

export interface StorageSchema {
  schema_version: string;
  user_settings: UserSettings;
  articles: Record<string, ProcessedArticle>;
  vocabulary: Record<string, VocabularyItem>;
  sentences: Record<string, SentenceItem>;
  processing_queue: ProcessingTask[];
  statistics: {
    articlesProcessed: number;
    vocabularyLearned: number;
    sentencesHighlighted: number;
    lastActivity: string; // ISO date string
  };
}

// ============================================================================
// Storage Quota Configuration
// ============================================================================

const STORAGE_QUOTA_WARNING_THRESHOLD = 0.8; // 80% of quota
const STORAGE_QUOTA_CRITICAL_THRESHOLD = 0.95; // 95% of quota

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_USER_SETTINGS: UserSettings = {
  nativeLanguage: 'en',
  learningLanguage: 'es',
  difficultyLevel: 5,
  autoHighlight: false,
  darkMode: false,
  fontSize: 16,
  apiKeys: {},
  keyboardShortcuts: {
    navigateLeft: 'ArrowLeft',
    navigateRight: 'ArrowRight',
    vocabularyMode: 'v',
    sentenceMode: 's',
    readingMode: 'r',
  },
};

const DEFAULT_STORAGE_SCHEMA: StorageSchema = {
  schema_version: CURRENT_SCHEMA_VERSION,
  user_settings: DEFAULT_USER_SETTINGS,
  articles: {},
  vocabulary: {},
  sentences: {},
  processing_queue: [],
  statistics: {
    articlesProcessed: 0,
    vocabularyLearned: 0,
    sentencesHighlighted: 0,
    lastActivity: new Date().toISOString(),
  },
};

// ============================================================================
// Storage Manager Class
// ============================================================================

export class StorageManager {
  private cacheManager: CacheManager;

  constructor(cacheManager?: CacheManager) {
    this.cacheManager = cacheManager || getCacheManager();
  }

  /**
   * Initialize storage with default schema if not exists
   */
  async initialize(): Promise<void> {
    const data = await chrome.storage.local.get('schema_version');

    if (!data.schema_version) {
      await chrome.storage.local.set(DEFAULT_STORAGE_SCHEMA);
    }
  }

  /**
   * Get current schema version
   */
  async getSchemaVersion(): Promise<string> {
    const data = await chrome.storage.local.get('schema_version');
    return data.schema_version || '0.0.0';
  }

  /**
   * Get user settings
   */
  async getUserSettings(): Promise<UserSettings> {
    const data = await chrome.storage.local.get('user_settings');
    return data.user_settings || DEFAULT_USER_SETTINGS;
  }

  /**
   * Save user settings
   */
  async saveUserSettings(settings: UserSettings): Promise<void> {
    if (!this.validateUserSettings(settings)) {
      throw new Error('Invalid user settings data');
    }

    await chrome.storage.local.set({ user_settings: settings });
    await this.updateLastActivity();
  }

  /**
   * Save article
   */
  async saveArticle(article: ProcessedArticle): Promise<void> {
    if (!this.validateArticle(article)) {
      throw new Error('Invalid article data');
    }

    await this.checkStorageQuota();

    const data = await chrome.storage.local.get('articles');
    const articles = data.articles || {};
    articles[article.id] = article;

    await chrome.storage.local.set({ articles });

    // Cache the article for faster future access
    await this.cacheManager.cacheArticle(article);

    await this.incrementStatistic('articlesProcessed');
    await this.updateLastActivity();
  }

  /**
   * Get article by ID
   */
  async getArticle(articleId: string): Promise<ProcessedArticle | null> {
    // First try to get from storage (cache will be checked internally if URL is available)
    const data = await chrome.storage.local.get('articles');
    const articles = data.articles || {};
    return articles[articleId] || null;
  }

  /**
   * Get article by URL with intelligent caching
   */
  async getArticleByUrl(
    url: string,
    language: string
  ): Promise<ProcessedArticle | null> {
    // First check cache
    const cached = await this.cacheManager.getCachedArticle(url, language);
    if (cached) {
      return cached;
    }

    // If not in cache, search in storage
    const articles = await this.getAllArticles();
    const article = articles.find(
      a => a.url === url && a.originalLanguage === language
    );

    if (article) {
      // Cache for future access
      await this.cacheManager.cacheArticle(article);
    }

    return article || null;
  }

  /**
   * Get all articles
   */
  async getAllArticles(): Promise<ProcessedArticle[]> {
    const data = await chrome.storage.local.get('articles');
    const articles = data.articles || {};
    return Object.values(articles);
  }

  /**
   * Delete article
   */
  async deleteArticle(articleId: string): Promise<void> {
    const data = await chrome.storage.local.get('articles');
    const articles = data.articles || {};
    delete articles[articleId];
    await chrome.storage.local.set({ articles });
  }

  /**
   * Save vocabulary item
   */
  async saveVocabulary(vocab: VocabularyItem): Promise<void> {
    if (!this.validateVocabulary(vocab)) {
      throw new Error('Invalid vocabulary data');
    }

    await this.checkStorageQuota();

    const data = await chrome.storage.local.get('vocabulary');
    const vocabulary = data.vocabulary || {};
    vocabulary[vocab.id] = vocab;

    await chrome.storage.local.set({ vocabulary });

    // Cache the translation for future use
    const settings = await this.getUserSettings();
    await this.cacheManager.cacheVocabularyTranslation(
      vocab.word,
      settings.learningLanguage,
      settings.nativeLanguage,
      vocab.translation
    );

    await this.incrementStatistic('vocabularyLearned');
    await this.updateLastActivity();
  }

  /**
   * Get vocabulary item by ID
   */
  async getVocabulary(vocabId: string): Promise<VocabularyItem | null> {
    const data = await chrome.storage.local.get('vocabulary');
    const vocabulary = data.vocabulary || {};
    return vocabulary[vocabId] || null;
  }

  /**
   * Get all vocabulary items
   */
  async getAllVocabulary(): Promise<VocabularyItem[]> {
    const data = await chrome.storage.local.get('vocabulary');
    const vocabulary = data.vocabulary || {};
    return Object.values(vocabulary);
  }

  /**
   * Delete vocabulary item
   */
  async deleteVocabulary(vocabId: string): Promise<void> {
    const data = await chrome.storage.local.get('vocabulary');
    const vocabulary = data.vocabulary || {};
    delete vocabulary[vocabId];
    await chrome.storage.local.set({ vocabulary });
  }

  /**
   * Save sentence item
   */
  async saveSentence(sentence: SentenceItem): Promise<void> {
    if (!this.validateSentence(sentence)) {
      throw new Error('Invalid sentence data');
    }

    await this.checkStorageQuota();

    const data = await chrome.storage.local.get('sentences');
    const sentences = data.sentences || {};
    sentences[sentence.id] = sentence;

    await chrome.storage.local.set({ sentences });
    await this.incrementStatistic('sentencesHighlighted');
    await this.updateLastActivity();
  }

  /**
   * Get sentence item by ID
   */
  async getSentence(sentenceId: string): Promise<SentenceItem | null> {
    const data = await chrome.storage.local.get('sentences');
    const sentences = data.sentences || {};
    return sentences[sentenceId] || null;
  }

  /**
   * Get all sentence items
   */
  async getAllSentences(): Promise<SentenceItem[]> {
    const data = await chrome.storage.local.get('sentences');
    const sentences = data.sentences || {};
    return Object.values(sentences);
  }

  /**
   * Delete sentence item
   */
  async deleteSentence(sentenceId: string): Promise<void> {
    const data = await chrome.storage.local.get('sentences');
    const sentences = data.sentences || {};
    delete sentences[sentenceId];
    await chrome.storage.local.set({ sentences });
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<StorageSchema['statistics']> {
    const data = await chrome.storage.local.get('statistics');
    return (
      data.statistics || {
        articlesProcessed: 0,
        vocabularyLearned: 0,
        sentencesHighlighted: 0,
        lastActivity: new Date().toISOString(),
      }
    );
  }

  /**
   * Update last activity timestamp
   */
  private async updateLastActivity(): Promise<void> {
    const stats = await this.getStatistics();
    stats.lastActivity = new Date().toISOString();
    await chrome.storage.local.set({ statistics: stats });
  }

  /**
   * Increment a statistic counter
   */
  private async incrementStatistic(
    key: keyof Omit<StorageSchema['statistics'], 'lastActivity'>
  ): Promise<void> {
    const stats = await this.getStatistics();
    stats[key] = (stats[key] || 0) + 1;
    await chrome.storage.local.set({ statistics: stats });
  }

  /**
   * Check storage quota and alert if necessary
   */
  async checkStorageQuota(): Promise<{
    bytesInUse: number;
    quota: number;
    percentUsed: number;
    status: 'ok' | 'warning' | 'critical';
  }> {
    const bytesInUse = await chrome.storage.local.getBytesInUse();
    const quota = chrome.storage.local.QUOTA_BYTES;
    const percentUsed = bytesInUse / quota;

    let status: 'ok' | 'warning' | 'critical' = 'ok';

    if (percentUsed >= STORAGE_QUOTA_CRITICAL_THRESHOLD) {
      status = 'critical';
      console.error(
        `Storage quota critical: ${(percentUsed * 100).toFixed(1)}% used`
      );
    } else if (percentUsed >= STORAGE_QUOTA_WARNING_THRESHOLD) {
      status = 'warning';
      console.warn(
        `Storage quota warning: ${(percentUsed * 100).toFixed(1)}% used`
      );
    }

    return {
      bytesInUse,
      quota,
      percentUsed,
      status,
    };
  }

  /**
   * Clear all data (for testing or reset)
   */
  async clearAll(): Promise<void> {
    await chrome.storage.local.clear();
    await this.initialize();
  }

  /**
   * Export all data to JSON format
   */
  async exportData(format: 'json' | 'markdown'): Promise<string> {
    const allData = await chrome.storage.local.get(null);

    if (format === 'json') {
      return JSON.stringify(allData, null, 2);
    }

    // Markdown format
    let markdown = '# Language Learning Extension - Data Export\n\n';
    markdown += `Export Date: ${new Date().toISOString()}\n\n`;

    // Statistics
    const stats = allData.statistics || {};
    markdown += '## Statistics\n\n';
    markdown += `- Articles Processed: ${stats.articlesProcessed || 0}\n`;
    markdown += `- Vocabulary Learned: ${stats.vocabularyLearned || 0}\n`;
    markdown += `- Sentences Highlighted: ${stats.sentencesHighlighted || 0}\n\n`;

    // Vocabulary
    const vocabulary = allData.vocabulary || {};
    const vocabItems = Object.values(vocabulary);
    if (vocabItems.length > 0) {
      markdown += '## Vocabulary\n\n';
      vocabItems.forEach((item: any) => {
        markdown += `### ${item.word}\n`;
        markdown += `- Translation: ${item.translation}\n`;
        markdown += `- Context: ${item.context}\n`;
        markdown += `- Difficulty: ${item.difficulty}/10\n`;
        markdown += `- Review Count: ${item.reviewCount}\n\n`;
      });
    }

    // Sentences
    const sentences = allData.sentences || {};
    const sentenceItems = Object.values(sentences);
    if (sentenceItems.length > 0) {
      markdown += '## Sentences\n\n';
      sentenceItems.forEach((item: any) => {
        markdown += `- ${item.content}\n`;
        markdown += `  - Translation: ${item.translation}\n\n`;
      });
    }

    return markdown;
  }

  /**
   * Import data from JSON format
   */
  async importData(data: string): Promise<void> {
    try {
      const parsedData = JSON.parse(data);

      // Validate schema version
      if (parsedData.schema_version !== CURRENT_SCHEMA_VERSION) {
        console.warn(
          `Importing data from different schema version: ${parsedData.schema_version}`
        );
      }

      // Merge with existing data
      await chrome.storage.local.set(parsedData);
    } catch {
      throw new Error('Invalid import data format');
    }
  }

  /**
   * Clean up data associated with a specific tab
   */
  async cleanupTabData(tabId: number): Promise<void> {
    try {
      // Remove session storage for this tab
      await chrome.storage.session.remove(`article_${tabId}`);
      await chrome.storage.session.remove(`pending_article_${tabId}`);

      console.log(`Cleaned up storage data for tab ${tabId}`);
    } catch (error) {
      console.error(`Failed to cleanup tab ${tabId} data:`, error);
    }
  }

  /**
   * Perform maintenance cleanup (remove old/expired data)
   */
  async performMaintenanceCleanup(): Promise<{
    articlesRemoved: number;
    vocabularyRemoved: number;
    sentencesRemoved: number;
  }> {
    const results = {
      articlesRemoved: 0,
      vocabularyRemoved: 0,
      sentencesRemoved: 0,
    };

    try {
      // Clean up expired articles (older than 30 days)
      const articles = await this.getAllArticles();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const article of articles) {
        if (new Date(article.processedAt) < thirtyDaysAgo) {
          await this.deleteArticle(article.id);
          results.articlesRemoved++;
        }
      }

      // Clean up old vocabulary (keep only last 1000 items)
      const vocabulary = await this.getAllVocabulary();
      if (vocabulary.length > 1000) {
        const sortedVocab = vocabulary.sort(
          (a, b) =>
            new Date(b.lastReviewed).getTime() -
            new Date(a.lastReviewed).getTime()
        );

        const toRemove = sortedVocab.slice(1000);
        for (const vocab of toRemove) {
          await this.deleteVocabulary(vocab.id);
          results.vocabularyRemoved++;
        }
      }

      // Clean up old sentences (keep only last 1000 items)
      const sentences = await this.getAllSentences();
      if (sentences.length > 1000) {
        const sortedSentences = sentences.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const toRemove = sortedSentences.slice(1000);
        for (const sentence of toRemove) {
          await this.deleteSentence(sentence.id);
          results.sentencesRemoved++;
        }
      }

      // Perform cache maintenance
      await this.cacheManager.performMaintenance();

      console.log('Maintenance cleanup completed:', results);
      return results;
    } catch (error) {
      console.error('Maintenance cleanup failed:', error);
      return results;
    }
  }

  /**
   * Get memory usage estimate for stored data
   */
  async getMemoryUsageEstimate(): Promise<{
    totalBytes: number;
    articleBytes: number;
    vocabularyBytes: number;
    sentenceBytes: number;
  }> {
    try {
      const allData = await chrome.storage.local.get(null);
      const dataString = JSON.stringify(allData);
      const totalBytes = new Blob([dataString]).size;

      // Estimate individual components
      const articles = allData.articles || {};
      const vocabulary = allData.vocabulary || {};
      const sentences = allData.sentences || {};

      const articleBytes = new Blob([JSON.stringify(articles)]).size;
      const vocabularyBytes = new Blob([JSON.stringify(vocabulary)]).size;
      const sentenceBytes = new Blob([JSON.stringify(sentences)]).size;

      return {
        totalBytes,
        articleBytes,
        vocabularyBytes,
        sentenceBytes,
      };
    } catch (error) {
      console.error('Failed to estimate memory usage:', error);
      return {
        totalBytes: 0,
        articleBytes: 0,
        vocabularyBytes: 0,
        sentenceBytes: 0,
      };
    }
  }

  // ============================================================================
  // Validation Methods
  // ============================================================================

  /**
   * Validate user settings
   */
  private validateUserSettings(settings: UserSettings): boolean {
    if (!settings || typeof settings !== 'object') return false;
    if (typeof settings.nativeLanguage !== 'string') return false;
    if (typeof settings.learningLanguage !== 'string') return false;
    if (
      typeof settings.difficultyLevel !== 'number' ||
      settings.difficultyLevel < 1 ||
      settings.difficultyLevel > 10
    )
      return false;
    if (typeof settings.autoHighlight !== 'boolean') return false;
    if (typeof settings.darkMode !== 'boolean') return false;
    if (typeof settings.fontSize !== 'number' || settings.fontSize < 8)
      return false;
    if (!settings.apiKeys || typeof settings.apiKeys !== 'object') return false;

    return true;
  }

  /**
   * Validate article
   */
  private validateArticle(article: ProcessedArticle): boolean {
    if (!article || typeof article !== 'object') return false;
    if (typeof article.id !== 'string' || !article.id) return false;
    if (typeof article.url !== 'string' || !article.url) return false;
    if (typeof article.title !== 'string') return false;
    if (typeof article.originalLanguage !== 'string') return false;
    if (!Array.isArray(article.parts)) return false;
    if (
      !['processing', 'completed', 'failed'].includes(article.processingStatus)
    )
      return false;

    return true;
  }

  /**
   * Validate vocabulary item
   */
  private validateVocabulary(vocab: VocabularyItem): boolean {
    if (!vocab || typeof vocab !== 'object') return false;
    if (typeof vocab.id !== 'string' || !vocab.id) return false;
    if (typeof vocab.word !== 'string' || !vocab.word) return false;
    if (typeof vocab.translation !== 'string') return false;
    if (typeof vocab.context !== 'string') return false;
    if (!Array.isArray(vocab.exampleSentences)) return false;
    if (typeof vocab.articleId !== 'string') return false;
    if (typeof vocab.partId !== 'string') return false;
    if (typeof vocab.reviewCount !== 'number') return false;
    if (
      typeof vocab.difficulty !== 'number' ||
      vocab.difficulty < 1 ||
      vocab.difficulty > 10
    )
      return false;

    return true;
  }

  /**
   * Validate sentence item
   */
  private validateSentence(sentence: SentenceItem): boolean {
    if (!sentence || typeof sentence !== 'object') return false;
    if (typeof sentence.id !== 'string' || !sentence.id) return false;
    if (typeof sentence.content !== 'string' || !sentence.content) return false;
    if (typeof sentence.translation !== 'string') return false;
    if (typeof sentence.articleId !== 'string') return false;
    if (typeof sentence.partId !== 'string') return false;

    return true;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

let storageManagerInstance: StorageManager | null = null;

/**
 * Get storage manager instance
 */
export function getStorageManager(cacheManager?: CacheManager): StorageManager {
  if (!storageManagerInstance) {
    storageManagerInstance = new StorageManager(cacheManager);
  }
  return storageManagerInstance;
}

/**
 * Create a new storage manager instance (for testing)
 */
export function createStorageManager(
  cacheManager?: CacheManager
): StorageManager {
  return new StorageManager(cacheManager);
}
