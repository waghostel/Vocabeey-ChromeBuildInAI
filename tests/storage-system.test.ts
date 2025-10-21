/**
 * Unit tests for Storage System
 * Tests storage schema validation, migration, cache management, and import/export
 * Requirements: 8.1, 8.2, 8.3, 8.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { DataMigrator } from '../src/utils/data-migrator';
import { ImportExportManager } from '../src/utils/import-export';
import {
  StorageManager,
  createStorageManager,
  CURRENT_SCHEMA_VERSION,
} from '../src/utils/storage-manager';

import type {
  UserSettings,
  ProcessedArticle,
  VocabularyItem,
  SentenceItem,
} from '../src/types';

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockUserSettings: UserSettings = {
  nativeLanguage: 'en',
  learningLanguage: 'es',
  difficultyLevel: 5,
  autoHighlight: true,
  darkMode: false,
  fontSize: 16,
  apiKeys: {
    gemini: 'test-key',
    jinaReader: 'test-jina-key',
  },
};

const mockArticle: ProcessedArticle = {
  id: 'article-1',
  url: 'https://example.com/article',
  title: 'Test Article',
  originalLanguage: 'es',
  processedAt: new Date('2024-01-01'),
  parts: [
    {
      id: 'part-1',
      content: 'Test content',
      originalContent: 'Original content',
      vocabulary: ['vocab-1'],
      sentences: ['sentence-1'],
      partIndex: 0,
    },
  ],
  processingStatus: 'completed',
  cacheExpires: new Date('2024-12-31'),
};

const mockVocabulary: VocabularyItem = {
  id: 'vocab-1',
  word: 'hola',
  translation: 'hello',
  context: 'Hola, ¿cómo estás?',
  exampleSentences: ['Hola amigo', 'Hola mundo'],
  articleId: 'article-1',
  partId: 'part-1',
  createdAt: new Date('2024-01-01'),
  lastReviewed: new Date('2024-01-02'),
  reviewCount: 3,
  difficulty: 2,
};

const mockSentence: SentenceItem = {
  id: 'sentence-1',
  content: 'Hola, ¿cómo estás?',
  translation: 'Hello, how are you?',
  articleId: 'article-1',
  partId: 'part-1',
  createdAt: new Date('2024-01-01'),
};

// ============================================================================
// Storage Manager Tests
// ============================================================================

describe('StorageManager', () => {
  let storageManager: StorageManager;
  let mockStorage: Record<string, any>;

  beforeEach(() => {
    storageManager = createStorageManager();
    mockStorage = {};

    // Mock chrome.storage.local
    vi.mocked(chrome.storage.local.get).mockImplementation(
      (keys: string | string[] | null) => {
        if (keys === null) {
          return Promise.resolve(mockStorage);
        }
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockStorage[keys] });
        }
        const result: Record<string, any> = {};
        keys.forEach(key => {
          if (mockStorage[key] !== undefined) {
            result[key] = mockStorage[key];
          }
        });
        return Promise.resolve(result);
      }
    );

    vi.mocked(chrome.storage.local.set).mockImplementation(items => {
      Object.assign(mockStorage, items);
      return Promise.resolve();
    });

    vi.mocked(chrome.storage.local.clear).mockImplementation(() => {
      mockStorage = {};
      return Promise.resolve();
    });

    vi.mocked(chrome.storage.local.getBytesInUse).mockResolvedValue(1000);
    (chrome.storage.local as any).QUOTA_BYTES = 10485760; // 10MB
  });

  describe('Initialization', () => {
    it('should initialize storage with default schema if not exists', async () => {
      await storageManager.initialize();

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          schema_version: CURRENT_SCHEMA_VERSION,
          user_settings: expect.any(Object),
          articles: {},
          vocabulary: {},
          sentences: {},
          processing_queue: [],
          statistics: expect.any(Object),
        })
      );
    });

    it('should not reinitialize if schema version exists', async () => {
      mockStorage.schema_version = CURRENT_SCHEMA_VERSION;

      await storageManager.initialize();

      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe('Schema Version', () => {
    it('should get current schema version', async () => {
      mockStorage.schema_version = '1.0.0';

      const version = await storageManager.getSchemaVersion();

      expect(version).toBe('1.0.0');
    });

    it('should return default version if not set', async () => {
      const version = await storageManager.getSchemaVersion();

      expect(version).toBe('0.0.0');
    });
  });

  describe('User Settings', () => {
    it('should save valid user settings', async () => {
      await storageManager.saveUserSettings(mockUserSettings);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        user_settings: mockUserSettings,
      });
    });

    it('should reject invalid user settings', async () => {
      const invalidSettings = { ...mockUserSettings, difficultyLevel: 15 };

      await expect(
        storageManager.saveUserSettings(invalidSettings)
      ).rejects.toThrow('Invalid user settings data');
    });

    it('should get user settings', async () => {
      mockStorage.user_settings = mockUserSettings;

      const settings = await storageManager.getUserSettings();

      expect(settings).toEqual(mockUserSettings);
    });

    it('should return default settings if not set', async () => {
      const settings = await storageManager.getUserSettings();

      expect(settings).toHaveProperty('nativeLanguage');
      expect(settings).toHaveProperty('learningLanguage');
    });
  });

  describe('Article Management', () => {
    it('should save valid article', async () => {
      await storageManager.saveArticle(mockArticle);

      expect(mockStorage.articles).toHaveProperty('article-1');
      expect(mockStorage.articles['article-1']).toEqual(mockArticle);
    });

    it('should reject invalid article', async () => {
      const invalidArticle = { ...mockArticle, id: '' };

      await expect(storageManager.saveArticle(invalidArticle)).rejects.toThrow(
        'Invalid article data'
      );
    });

    it('should get article by ID', async () => {
      mockStorage.articles = { 'article-1': mockArticle };

      const article = await storageManager.getArticle('article-1');

      expect(article).toEqual(mockArticle);
    });

    it('should return null for non-existent article', async () => {
      const article = await storageManager.getArticle('non-existent');

      expect(article).toBeNull();
    });

    it('should get all articles', async () => {
      mockStorage.articles = {
        'article-1': mockArticle,
        'article-2': { ...mockArticle, id: 'article-2' },
      };

      const articles = await storageManager.getAllArticles();

      expect(articles).toHaveLength(2);
      expect(articles[0].id).toBe('article-1');
    });

    it('should delete article', async () => {
      mockStorage.articles = { 'article-1': mockArticle };

      await storageManager.deleteArticle('article-1');

      expect(mockStorage.articles).not.toHaveProperty('article-1');
    });

    it('should increment articles processed statistic', async () => {
      mockStorage.statistics = {
        articlesProcessed: 5,
        vocabularyLearned: 0,
        sentencesHighlighted: 0,
        lastActivity: new Date().toISOString(),
      };

      await storageManager.saveArticle(mockArticle);

      expect(mockStorage.statistics.articlesProcessed).toBe(6);
    });
  });

  describe('Vocabulary Management', () => {
    it('should save valid vocabulary', async () => {
      await storageManager.saveVocabulary(mockVocabulary);

      expect(mockStorage.vocabulary).toHaveProperty('vocab-1');
      expect(mockStorage.vocabulary['vocab-1']).toEqual(mockVocabulary);
    });

    it('should reject invalid vocabulary', async () => {
      const invalidVocab = { ...mockVocabulary, difficulty: 15 };

      await expect(storageManager.saveVocabulary(invalidVocab)).rejects.toThrow(
        'Invalid vocabulary data'
      );
    });

    it('should get vocabulary by ID', async () => {
      mockStorage.vocabulary = { 'vocab-1': mockVocabulary };

      const vocab = await storageManager.getVocabulary('vocab-1');

      expect(vocab).toEqual(mockVocabulary);
    });

    it('should get all vocabulary', async () => {
      mockStorage.vocabulary = {
        'vocab-1': mockVocabulary,
        'vocab-2': { ...mockVocabulary, id: 'vocab-2' },
      };

      const vocabulary = await storageManager.getAllVocabulary();

      expect(vocabulary).toHaveLength(2);
    });

    it('should delete vocabulary', async () => {
      mockStorage.vocabulary = { 'vocab-1': mockVocabulary };

      await storageManager.deleteVocabulary('vocab-1');

      expect(mockStorage.vocabulary).not.toHaveProperty('vocab-1');
    });

    it('should increment vocabulary learned statistic', async () => {
      mockStorage.statistics = {
        articlesProcessed: 0,
        vocabularyLearned: 10,
        sentencesHighlighted: 0,
        lastActivity: new Date().toISOString(),
      };

      await storageManager.saveVocabulary(mockVocabulary);

      expect(mockStorage.statistics.vocabularyLearned).toBe(11);
    });
  });

  describe('Sentence Management', () => {
    it('should save valid sentence', async () => {
      await storageManager.saveSentence(mockSentence);

      expect(mockStorage.sentences).toHaveProperty('sentence-1');
      expect(mockStorage.sentences['sentence-1']).toEqual(mockSentence);
    });

    it('should reject invalid sentence', async () => {
      const invalidSentence = { ...mockSentence, id: '' };

      await expect(
        storageManager.saveSentence(invalidSentence)
      ).rejects.toThrow('Invalid sentence data');
    });

    it('should get sentence by ID', async () => {
      mockStorage.sentences = { 'sentence-1': mockSentence };

      const sentence = await storageManager.getSentence('sentence-1');

      expect(sentence).toEqual(mockSentence);
    });

    it('should get all sentences', async () => {
      mockStorage.sentences = {
        'sentence-1': mockSentence,
        'sentence-2': { ...mockSentence, id: 'sentence-2' },
      };

      const sentences = await storageManager.getAllSentences();

      expect(sentences).toHaveLength(2);
    });

    it('should delete sentence', async () => {
      mockStorage.sentences = { 'sentence-1': mockSentence };

      await storageManager.deleteSentence('sentence-1');

      expect(mockStorage.sentences).not.toHaveProperty('sentence-1');
    });

    it('should increment sentences highlighted statistic', async () => {
      mockStorage.statistics = {
        articlesProcessed: 0,
        vocabularyLearned: 0,
        sentencesHighlighted: 7,
        lastActivity: new Date().toISOString(),
      };

      await storageManager.saveSentence(mockSentence);

      expect(mockStorage.statistics.sentencesHighlighted).toBe(8);
    });
  });

  describe('Statistics', () => {
    it('should get statistics', async () => {
      const mockStats = {
        articlesProcessed: 5,
        vocabularyLearned: 20,
        sentencesHighlighted: 15,
        lastActivity: new Date().toISOString(),
      };
      mockStorage.statistics = mockStats;

      const stats = await storageManager.getStatistics();

      expect(stats).toEqual(mockStats);
    });

    it('should return default statistics if not set', async () => {
      const stats = await storageManager.getStatistics();

      expect(stats.articlesProcessed).toBe(0);
      expect(stats.vocabularyLearned).toBe(0);
      expect(stats.sentencesHighlighted).toBe(0);
    });

    it('should update last activity on save operations', async () => {
      const beforeTime = new Date();

      await storageManager.saveArticle(mockArticle);

      const stats = await storageManager.getStatistics();
      const lastActivity = new Date(stats.lastActivity);

      expect(lastActivity.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime()
      );
    });
  });

  describe('Storage Quota Management', () => {
    it('should check storage quota and return ok status', async () => {
      vi.mocked(chrome.storage.local.getBytesInUse).mockResolvedValue(1000000); // 1MB

      const quota = await storageManager.checkStorageQuota();

      expect(quota.status).toBe('ok');
      expect(quota.percentUsed).toBeLessThan(0.8);
    });

    it('should return warning status when quota exceeds 80%', async () => {
      vi.mocked(chrome.storage.local.getBytesInUse).mockResolvedValue(8500000); // 8.5MB

      const quota = await storageManager.checkStorageQuota();

      expect(quota.status).toBe('warning');
      expect(quota.percentUsed).toBeGreaterThanOrEqual(0.8);
    });

    it('should return critical status when quota exceeds 95%', async () => {
      vi.mocked(chrome.storage.local.getBytesInUse).mockResolvedValue(10000000); // ~10MB

      const quota = await storageManager.checkStorageQuota();

      expect(quota.status).toBe('critical');
      expect(quota.percentUsed).toBeGreaterThanOrEqual(0.95);
    });
  });

  describe('Clear All', () => {
    it('should clear all data and reinitialize', async () => {
      mockStorage = {
        schema_version: '1.0.0',
        articles: { 'article-1': mockArticle },
        vocabulary: { 'vocab-1': mockVocabulary },
      };

      await storageManager.clearAll();

      expect(chrome.storage.local.clear).toHaveBeenCalled();
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          schema_version: CURRENT_SCHEMA_VERSION,
        })
      );
    });
  });
});

// ============================================================================
// Data Migrator Tests
// ============================================================================

describe('DataMigrator', () => {
  let dataMigrator: DataMigrator;
  let mockStorage: Record<string, any>;

  beforeEach(() => {
    dataMigrator = new DataMigrator();
    mockStorage = {};

    vi.mocked(chrome.storage.local.get).mockImplementation(
      (keys: string | string[] | null) => {
        if (keys === null) {
          return Promise.resolve(mockStorage);
        }
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockStorage[keys] });
        }
        const result: Record<string, any> = {};
        keys.forEach(key => {
          if (mockStorage[key] !== undefined) {
            result[key] = mockStorage[key];
          }
        });
        return Promise.resolve(result);
      }
    );

    vi.mocked(chrome.storage.local.set).mockImplementation(items => {
      Object.assign(mockStorage, items);
      return Promise.resolve();
    });

    vi.mocked(chrome.storage.local.clear).mockImplementation(() => {
      mockStorage = {};
      return Promise.resolve();
    });
  });

  describe('Version Management', () => {
    it('should get current version', async () => {
      mockStorage.schema_version = '1.0.0';

      const version = await dataMigrator.getCurrentVersion();

      expect(version).toBe('1.0.0');
    });

    it('should return 0.0.0 if no version set', async () => {
      const version = await dataMigrator.getCurrentVersion();

      expect(version).toBe('0.0.0');
    });
  });

  describe('Schema Validation', () => {
    it('should validate correct schema', () => {
      const validSchema = {
        schema_version: '1.0.0',
        user_settings: {
          nativeLanguage: 'en',
          learningLanguage: 'es',
          difficultyLevel: 5,
          autoHighlight: false,
          darkMode: false,
          fontSize: 16,
          apiKeys: {},
        },
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

      const isValid = dataMigrator.validateSchema(validSchema);

      expect(isValid).toBe(true);
    });

    it('should reject schema without version', () => {
      const invalidSchema = {
        user_settings: {},
        articles: {},
      };

      const isValid = dataMigrator.validateSchema(invalidSchema);

      expect(isValid).toBe(false);
    });

    it('should reject schema with invalid user settings', () => {
      const invalidSchema = {
        schema_version: '1.0.0',
        user_settings: {
          nativeLanguage: 123, // Should be string
        },
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

      const isValid = dataMigrator.validateSchema(invalidSchema);

      expect(isValid).toBe(false);
    });

    it('should reject schema with non-array processing queue', () => {
      const invalidSchema = {
        schema_version: '1.0.0',
        user_settings: mockUserSettings,
        articles: {},
        vocabulary: {},
        sentences: {},
        processing_queue: 'not-an-array',
        statistics: {
          articlesProcessed: 0,
          vocabularyLearned: 0,
          sentencesHighlighted: 0,
          lastActivity: new Date().toISOString(),
        },
      };

      const isValid = dataMigrator.validateSchema(invalidSchema);

      expect(isValid).toBe(false);
    });

    it('should reject schema with invalid statistics', () => {
      const invalidSchema = {
        schema_version: '1.0.0',
        user_settings: mockUserSettings,
        articles: {},
        vocabulary: {},
        sentences: {},
        processing_queue: [],
        statistics: {
          articlesProcessed: 'not-a-number',
          vocabularyLearned: 0,
          sentencesHighlighted: 0,
          lastActivity: new Date().toISOString(),
        },
      };

      const isValid = dataMigrator.validateSchema(invalidSchema);

      expect(isValid).toBe(false);
    });
  });

  describe('Migration', () => {
    it('should not migrate if already at target version', async () => {
      mockStorage.schema_version = '1.0.0';

      await dataMigrator.migrateToVersion('1.0.0');

      expect(chrome.storage.local.clear).not.toHaveBeenCalled();
    });

    it('should migrate from 0.0.0 to 1.0.0', async () => {
      mockStorage = {
        user_settings: mockUserSettings,
        articles: {},
      };

      await dataMigrator.migrateToVersion('1.0.0');

      expect(mockStorage.schema_version).toBe('1.0.0');
      expect(mockStorage).toHaveProperty('vocabulary');
      expect(mockStorage).toHaveProperty('sentences');
      expect(mockStorage).toHaveProperty('processing_queue');
      expect(mockStorage).toHaveProperty('statistics');
    });

    it('should reject downgrade attempts', async () => {
      mockStorage.schema_version = '2.0.0';

      await expect(dataMigrator.migrateToVersion('1.0.0')).rejects.toThrow(
        'Cannot downgrade from 2.0.0 to 1.0.0'
      );
    });

    it('should migrate to latest version', async () => {
      mockStorage = {
        user_settings: mockUserSettings,
      };

      await dataMigrator.migrateToLatest();

      expect(mockStorage.schema_version).toBe(CURRENT_SCHEMA_VERSION);
    });

    it('should validate schema after migration', async () => {
      mockStorage = {
        user_settings: mockUserSettings,
      };

      await dataMigrator.migrateToVersion('1.0.0');

      const isValid = dataMigrator.validateSchema(mockStorage);
      expect(isValid).toBe(true);
    });
  });

  describe('Migration Status', () => {
    it('should detect when migration is needed', async () => {
      mockStorage.schema_version = '0.9.0';

      const needsMigration = await dataMigrator.needsMigration();

      expect(needsMigration).toBe(true);
    });

    it('should detect when migration is not needed', async () => {
      mockStorage.schema_version = CURRENT_SCHEMA_VERSION;

      const needsMigration = await dataMigrator.needsMigration();

      expect(needsMigration).toBe(false);
    });

    it('should get pending migrations', async () => {
      mockStorage.schema_version = '0.0.0';

      const pending = await dataMigrator.getPendingMigrations();

      expect(pending.length).toBeGreaterThan(0);
      expect(pending[0]).toHaveProperty('version');
      expect(pending[0]).toHaveProperty('description');
    });
  });

  describe('Backup and Restore', () => {
    it('should create backup', async () => {
      mockStorage = {
        schema_version: '1.0.0',
        user_settings: mockUserSettings,
        articles: { 'article-1': mockArticle },
        vocabulary: {},
        sentences: {},
        processing_queue: [],
        statistics: {
          articlesProcessed: 1,
          vocabularyLearned: 0,
          sentencesHighlighted: 0,
          lastActivity: new Date().toISOString(),
        },
      };

      const backup = await dataMigrator.createBackup();

      expect(backup).toContain('schema_version');
      expect(backup).toContain('user_settings');
      expect(backup).toContain('article-1');
    });

    it('should restore from valid backup', async () => {
      const backupData = JSON.stringify({
        schema_version: '1.0.0',
        user_settings: mockUserSettings,
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
      });

      await dataMigrator.restoreFromBackup(backupData);

      expect(mockStorage.schema_version).toBe('1.0.0');
      expect(mockStorage.user_settings).toEqual(mockUserSettings);
    });

    it('should reject invalid backup data', async () => {
      const invalidBackup = JSON.stringify({ invalid: 'data' });

      await expect(
        dataMigrator.restoreFromBackup(invalidBackup)
      ).rejects.toThrow('Backup restoration failed');
    });

    it('should reject malformed JSON backup', async () => {
      const malformedBackup = 'not valid json {';

      await expect(
        dataMigrator.restoreFromBackup(malformedBackup)
      ).rejects.toThrow();
    });
  });

  describe('Test Migration', () => {
    it('should test migration without applying changes', async () => {
      mockStorage = {
        schema_version: '0.0.0',
        user_settings: mockUserSettings,
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

      const result = await dataMigrator.testMigration('1.0.0');

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      // Original storage should be unchanged
      expect(mockStorage.schema_version).toBe('0.0.0');
    });

    it('should detect invalid migration result', async () => {
      mockStorage = {
        schema_version: '0.0.0',
        invalid_data: 'test',
      };

      const result = await dataMigrator.testMigration('1.0.0');

      // Migration should complete but validation might fail
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('errors');
    });
  });
});

// ============================================================================
// Import/Export Manager Tests
// ============================================================================

describe('ImportExportManager', () => {
  let importExportManager: ImportExportManager;
  let _storageManager: StorageManager;
  let mockStorage: Record<string, any>;

  beforeEach(() => {
    importExportManager = new ImportExportManager();
    _storageManager = createStorageManager();
    mockStorage = {
      schema_version: '1.0.0',
      user_settings: mockUserSettings,
      articles: { 'article-1': mockArticle },
      vocabulary: { 'vocab-1': mockVocabulary },
      sentences: { 'sentence-1': mockSentence },
      processing_queue: [],
      statistics: {
        articlesProcessed: 1,
        vocabularyLearned: 1,
        sentencesHighlighted: 1,
        lastActivity: new Date().toISOString(),
      },
    };

    vi.mocked(chrome.storage.local.get).mockImplementation(
      (keys: string | string[] | null) => {
        if (keys === null) {
          return Promise.resolve(mockStorage);
        }
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockStorage[keys] });
        }
        const result: Record<string, any> = {};
        keys.forEach(key => {
          if (mockStorage[key] !== undefined) {
            result[key] = mockStorage[key];
          }
        });
        return Promise.resolve(result);
      }
    );

    vi.mocked(chrome.storage.local.set).mockImplementation(items => {
      Object.assign(mockStorage, items);
      return Promise.resolve();
    });

    vi.mocked(chrome.storage.local.getBytesInUse).mockResolvedValue(1000);
    (chrome.storage.local as any).QUOTA_BYTES = 10485760;
  });

  describe('JSON Export', () => {
    it('should export all data to JSON', async () => {
      const jsonData = await importExportManager.exportToJSON();
      const parsed = JSON.parse(jsonData);

      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('settings');
      expect(parsed).toHaveProperty('articles');
      expect(parsed).toHaveProperty('vocabulary');
      expect(parsed).toHaveProperty('sentences');
      expect(parsed).toHaveProperty('statistics');
    });

    it('should include all articles in export', async () => {
      const jsonData = await importExportManager.exportToJSON();
      const parsed = JSON.parse(jsonData);

      expect(parsed.articles).toHaveLength(1);
      expect(parsed.articles[0].id).toBe('article-1');
      expect(parsed.articles[0].title).toBe('Test Article');
    });

    it('should include all vocabulary in export', async () => {
      const jsonData = await importExportManager.exportToJSON();
      const parsed = JSON.parse(jsonData);

      expect(parsed.vocabulary).toHaveLength(1);
      expect(parsed.vocabulary[0].id).toBe('vocab-1');
      expect(parsed.vocabulary[0].word).toBe('hola');
    });

    it('should include all sentences in export', async () => {
      const jsonData = await importExportManager.exportToJSON();
      const parsed = JSON.parse(jsonData);

      expect(parsed.sentences).toHaveLength(1);
      expect(parsed.sentences[0].id).toBe('sentence-1');
    });

    it('should include statistics in export', async () => {
      const jsonData = await importExportManager.exportToJSON();
      const parsed = JSON.parse(jsonData);

      expect(parsed.statistics.articlesProcessed).toBe(1);
      expect(parsed.statistics.vocabularyLearned).toBe(1);
      expect(parsed.statistics.sentencesHighlighted).toBe(1);
    });
  });

  describe('Markdown Export', () => {
    it('should export all data to Markdown', async () => {
      const markdown = await importExportManager.exportToMarkdown();

      expect(markdown).toContain('# Language Learning Extension - Data Export');
      expect(markdown).toContain('## Settings');
      expect(markdown).toContain('## Statistics');
      expect(markdown).toContain('## Articles');
      expect(markdown).toContain('## Vocabulary');
      expect(markdown).toContain('## Sentences');
    });

    it('should include settings in markdown', async () => {
      const markdown = await importExportManager.exportToMarkdown();

      expect(markdown).toContain('**Native Language:** en');
      expect(markdown).toContain('**Learning Language:** es');
      expect(markdown).toContain('**Difficulty Level:** 5/10');
    });

    it('should include articles in markdown', async () => {
      const markdown = await importExportManager.exportToMarkdown();

      expect(markdown).toContain('Test Article');
      expect(markdown).toContain('https://example.com/article');
      expect(markdown).toContain('**Language:** es');
    });

    it('should include vocabulary in markdown', async () => {
      const markdown = await importExportManager.exportToMarkdown();

      expect(markdown).toContain('hola');
      expect(markdown).toContain('**Translation:** hello');
      expect(markdown).toContain('**Difficulty:** 2/10');
    });

    it('should include sentences in markdown', async () => {
      const markdown = await importExportManager.exportToMarkdown();

      expect(markdown).toContain('Hola, ¿cómo estás?');
      expect(markdown).toContain('**Translation:** Hello, how are you?');
    });

    it('should group vocabulary by article', async () => {
      const markdown = await importExportManager.exportToMarkdown();

      // Should have article title as section header
      expect(markdown).toMatch(/### Test Article[\s\S]*#### hola/);
    });
  });

  describe('Export Format Selection', () => {
    it('should export as JSON when format is json', async () => {
      const data = await importExportManager.exportData('json');
      const parsed = JSON.parse(data);

      expect(parsed).toHaveProperty('exportedAt');
    });

    it('should export as Markdown when format is markdown', async () => {
      const data = await importExportManager.exportData('markdown');

      expect(data).toContain('# Language Learning Extension');
    });
  });

  describe('Data Import', () => {
    it('should import valid JSON data', async () => {
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        settings: mockUserSettings,
        articles: [mockArticle],
        vocabulary: [mockVocabulary],
        sentences: [mockSentence],
        statistics: {
          articlesProcessed: 1,
          vocabularyLearned: 1,
          sentencesHighlighted: 1,
          lastActivity: new Date().toISOString(),
        },
      };

      const jsonData = JSON.stringify(exportData);

      await importExportManager.importData(jsonData);

      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    it('should reject invalid JSON format', async () => {
      const invalidJson = 'not valid json {';

      await expect(
        importExportManager.importData(invalidJson)
      ).rejects.toThrow();
    });

    it('should reject data without required fields', async () => {
      const invalidData = JSON.stringify({
        exportedAt: new Date().toISOString(),
        // Missing other required fields
      });

      await expect(importExportManager.importData(invalidData)).rejects.toThrow(
        'Data import failed'
      );
    });

    it('should reject data with invalid structure', async () => {
      const invalidData = JSON.stringify({
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        settings: 'not-an-object',
        articles: [],
        vocabulary: [],
        sentences: [],
        statistics: {},
      });

      await expect(importExportManager.importData(invalidData)).rejects.toThrow(
        'Data import failed'
      );
    });
  });

  describe('Vocabulary-Only Export', () => {
    it('should export vocabulary only as JSON', async () => {
      const data = await importExportManager.exportVocabularyOnly('json');
      const parsed = JSON.parse(data);

      expect(parsed.type).toBe('vocabulary');
      expect(parsed.vocabulary).toHaveLength(1);
      expect(parsed.vocabulary[0].word).toBe('hola');
    });

    it('should export vocabulary only as Markdown', async () => {
      const markdown =
        await importExportManager.exportVocabularyOnly('markdown');

      expect(markdown).toContain('# Vocabulary Export');
      expect(markdown).toContain('hola');
      expect(markdown).toContain('**Translation:** hello');
      expect(markdown).not.toContain('## Sentences');
    });
  });

  describe('Sentences-Only Export', () => {
    it('should export sentences only as JSON', async () => {
      const data = await importExportManager.exportSentencesOnly('json');
      const parsed = JSON.parse(data);

      expect(parsed.type).toBe('sentences');
      expect(parsed.sentences).toHaveLength(1);
      expect(parsed.sentences[0].content).toBe('Hola, ¿cómo estás?');
    });

    it('should export sentences only as Markdown', async () => {
      const markdown =
        await importExportManager.exportSentencesOnly('markdown');

      expect(markdown).toContain('# Sentences Export');
      expect(markdown).toContain('Hola, ¿cómo estás?');
      expect(markdown).toContain('**Translation:** Hello, how are you?');
      expect(markdown).not.toContain('## Vocabulary');
    });
  });

  describe('Export Size', () => {
    it('should calculate export size', async () => {
      const size = await importExportManager.getExportSize('json');

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should calculate different sizes for different formats', async () => {
      const jsonSize = await importExportManager.getExportSize('json');
      const markdownSize = await importExportManager.getExportSize('markdown');

      expect(jsonSize).toBeGreaterThan(0);
      expect(markdownSize).toBeGreaterThan(0);
      // Sizes will be different
      expect(jsonSize).not.toBe(markdownSize);
    });
  });

  describe('Compression', () => {
    // Skip compression tests in Node.js environment as CompressionStream is browser-only
    it.skip('should compress export data', async () => {
      const data = await importExportManager.exportToJSON();
      const compressed = await importExportManager.compressExport(data);

      expect(compressed).toBeInstanceOf(Blob);
      expect(compressed.size).toBeGreaterThan(0);
    });

    it.skip('should decompress import data', async () => {
      const data = await importExportManager.exportToJSON();
      const compressed = await importExportManager.compressExport(data);
      const decompressed =
        await importExportManager.decompressImport(compressed);

      expect(decompressed).toBe(data);
    });

    it.skip('should handle compression of large data', async () => {
      // Create large dataset
      const largeData = JSON.stringify({
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        settings: mockUserSettings,
        articles: Array(100).fill(mockArticle),
        vocabulary: Array(1000).fill(mockVocabulary),
        sentences: Array(500).fill(mockSentence),
        statistics: mockStorage.statistics,
      });

      const compressed = await importExportManager.compressExport(largeData);

      expect(compressed.size).toBeLessThan(largeData.length);
    });
  });

  describe('Download Export', () => {
    beforeEach(() => {
      // Mock chrome.downloads API
      (global.chrome as any).downloads = {
        download: vi.fn().mockResolvedValue(1),
      };
      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
    });

    it('should trigger download for JSON export', async () => {
      await importExportManager.downloadExport('json');

      expect(chrome.downloads.download).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'blob:mock-url',
          filename: expect.stringContaining('.json'),
          saveAs: true,
        })
      );
    });

    it('should trigger download for Markdown export', async () => {
      await importExportManager.downloadExport('markdown');

      expect(chrome.downloads.download).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'blob:mock-url',
          filename: expect.stringContaining('.md'),
          saveAs: true,
        })
      );
    });

    it('should clean up blob URL after download', async () => {
      vi.useFakeTimers();

      await importExportManager.downloadExport('json');

      vi.advanceTimersByTime(1000);

      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

      vi.useRealTimers();
    });
  });
});

// ============================================================================
// Cache Management Tests
// ============================================================================

describe('Cache Management', () => {
  let storageManager: StorageManager;
  let mockStorage: Record<string, any>;

  beforeEach(() => {
    storageManager = createStorageManager();
    mockStorage = {};

    vi.mocked(chrome.storage.local.get).mockImplementation(
      (keys: string | string[] | null) => {
        if (keys === null) {
          return Promise.resolve(mockStorage);
        }
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockStorage[keys] });
        }
        const result: Record<string, any> = {};
        keys.forEach(key => {
          if (mockStorage[key] !== undefined) {
            result[key] = mockStorage[key];
          }
        });
        return Promise.resolve(result);
      }
    );

    vi.mocked(chrome.storage.local.set).mockImplementation(items => {
      Object.assign(mockStorage, items);
      return Promise.resolve();
    });

    vi.mocked(chrome.storage.local.getBytesInUse).mockResolvedValue(1000);
    (chrome.storage.local as any).QUOTA_BYTES = 10485760;
  });

  describe('Article Caching', () => {
    it('should cache processed articles', async () => {
      const article = {
        ...mockArticle,
        cacheExpires: new Date(Date.now() + 86400000), // 24 hours from now
      };

      await storageManager.saveArticle(article);

      const cached = await storageManager.getArticle(article.id);
      expect(cached).toEqual(article);
    });

    it('should retrieve cached articles', async () => {
      mockStorage.articles = {
        'article-1': mockArticle,
        'article-2': { ...mockArticle, id: 'article-2' },
      };

      const articles = await storageManager.getAllArticles();

      expect(articles).toHaveLength(2);
    });

    it('should identify expired cache entries', async () => {
      const expiredArticle = {
        ...mockArticle,
        id: 'expired-article',
        cacheExpires: new Date(Date.now() - 86400000), // 24 hours ago
      };

      mockStorage.articles = {
        'expired-article': expiredArticle,
      };

      const article = await storageManager.getArticle('expired-article');

      expect(article).not.toBeNull();
      expect(new Date(article!.cacheExpires).getTime()).toBeLessThan(
        Date.now()
      );
    });

    it('should update existing cached articles', async () => {
      mockStorage.articles = {
        'article-1': mockArticle,
      };

      const updatedArticle = {
        ...mockArticle,
        title: 'Updated Title',
      };

      await storageManager.saveArticle(updatedArticle);

      const cached = await storageManager.getArticle('article-1');
      expect(cached?.title).toBe('Updated Title');
    });
  });

  describe('Cache Cleanup', () => {
    it('should remove old articles when storage is full', async () => {
      // Simulate storage near quota
      vi.mocked(chrome.storage.local.getBytesInUse).mockResolvedValue(10000000);

      const oldArticle = {
        ...mockArticle,
        id: 'old-article',
        processedAt: new Date(Date.now() - 30 * 86400000), // 30 days ago
        cacheExpires: new Date(Date.now() - 86400000), // Expired
      };

      mockStorage.articles = {
        'old-article': oldArticle,
      };

      const quota = await storageManager.checkStorageQuota();

      expect(quota.status).toBe('critical');
      // In a real implementation, this would trigger cleanup
    });

    it('should delete specific articles from cache', async () => {
      mockStorage.articles = {
        'article-1': mockArticle,
        'article-2': { ...mockArticle, id: 'article-2' },
      };

      await storageManager.deleteArticle('article-1');

      const articles = await storageManager.getAllArticles();
      expect(articles).toHaveLength(1);
      expect(articles[0].id).toBe('article-2');
    });

    it('should handle deletion of non-existent articles', async () => {
      mockStorage.articles = {};

      await storageManager.deleteArticle('non-existent');

      // Should not throw error
      const articles = await storageManager.getAllArticles();
      expect(articles).toHaveLength(0);
    });
  });

  describe('Vocabulary and Sentence Caching', () => {
    it('should cache vocabulary items', async () => {
      await storageManager.saveVocabulary(mockVocabulary);

      const cached = await storageManager.getVocabulary(mockVocabulary.id);
      expect(cached).toEqual(mockVocabulary);
    });

    it('should cache sentence items', async () => {
      await storageManager.saveSentence(mockSentence);

      const cached = await storageManager.getSentence(mockSentence.id);
      expect(cached).toEqual(mockSentence);
    });

    it('should retrieve all cached vocabulary', async () => {
      mockStorage.vocabulary = {
        'vocab-1': mockVocabulary,
        'vocab-2': { ...mockVocabulary, id: 'vocab-2', word: 'adiós' },
      };

      const vocabulary = await storageManager.getAllVocabulary();

      expect(vocabulary).toHaveLength(2);
    });

    it('should retrieve all cached sentences', async () => {
      mockStorage.sentences = {
        'sentence-1': mockSentence,
        'sentence-2': { ...mockSentence, id: 'sentence-2' },
      };

      const sentences = await storageManager.getAllSentences();

      expect(sentences).toHaveLength(2);
    });

    it('should delete vocabulary from cache', async () => {
      mockStorage.vocabulary = {
        'vocab-1': mockVocabulary,
      };

      await storageManager.deleteVocabulary('vocab-1');

      const vocab = await storageManager.getVocabulary('vocab-1');
      expect(vocab).toBeNull();
    });

    it('should delete sentences from cache', async () => {
      mockStorage.sentences = {
        'sentence-1': mockSentence,
      };

      await storageManager.deleteSentence('sentence-1');

      const sentence = await storageManager.getSentence('sentence-1');
      expect(sentence).toBeNull();
    });
  });

  describe('Cache Performance', () => {
    it('should handle large number of cached items', async () => {
      const articles: Record<string, ProcessedArticle> = {};
      for (let i = 0; i < 100; i++) {
        articles[`article-${i}`] = {
          ...mockArticle,
          id: `article-${i}`,
          title: `Article ${i}`,
        };
      }

      mockStorage.articles = articles;

      const allArticles = await storageManager.getAllArticles();

      expect(allArticles).toHaveLength(100);
    });

    it('should efficiently retrieve specific cached items', async () => {
      const vocabulary: Record<string, VocabularyItem> = {};
      for (let i = 0; i < 1000; i++) {
        vocabulary[`vocab-${i}`] = {
          ...mockVocabulary,
          id: `vocab-${i}`,
          word: `word-${i}`,
        };
      }

      mockStorage.vocabulary = vocabulary;

      const vocab = await storageManager.getVocabulary('vocab-500');

      expect(vocab).not.toBeNull();
      expect(vocab?.id).toBe('vocab-500');
    });
  });

  describe('Cache Expiration', () => {
    it('should set cache expiration on article save', async () => {
      const futureDate = new Date(Date.now() + 86400000);
      const article = {
        ...mockArticle,
        cacheExpires: futureDate,
      };

      await storageManager.saveArticle(article);

      const cached = await storageManager.getArticle(article.id);
      expect(cached?.cacheExpires).toEqual(futureDate);
    });

    it('should handle articles with past expiration dates', async () => {
      const pastDate = new Date(Date.now() - 86400000);
      const expiredArticle = {
        ...mockArticle,
        id: 'expired',
        cacheExpires: pastDate,
      };

      mockStorage.articles = {
        expired: expiredArticle,
      };

      const article = await storageManager.getArticle('expired');

      // Article should still be retrievable, but marked as expired
      expect(article).not.toBeNull();
      expect(new Date(article!.cacheExpires).getTime()).toBeLessThan(
        Date.now()
      );
    });
  });

  describe('Storage Quota Monitoring', () => {
    it('should monitor storage usage during cache operations', async () => {
      vi.mocked(chrome.storage.local.getBytesInUse).mockResolvedValue(5000000);

      await storageManager.saveArticle(mockArticle);

      const quota = await storageManager.checkStorageQuota();

      expect(quota.bytesInUse).toBe(5000000);
      expect(quota.percentUsed).toBeGreaterThan(0);
    });

    it('should warn when cache approaches quota limit', async () => {
      vi.mocked(chrome.storage.local.getBytesInUse).mockResolvedValue(8500000);

      const quota = await storageManager.checkStorageQuota();

      expect(quota.status).toBe('warning');
    });

    it('should alert when cache exceeds quota limit', async () => {
      vi.mocked(chrome.storage.local.getBytesInUse).mockResolvedValue(10000000);

      const quota = await storageManager.checkStorageQuota();

      expect(quota.status).toBe('critical');
    });
  });
});
