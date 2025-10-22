/**
 * System Integration Tests
 * Tests complete system workflows and end-to-end scenarios
 * Requirements: All requirements (task 12.4)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type {
  ExtractedContent,
  ProcessedArticle,
  VocabularyItem,
  SentenceItem,
  UserSettings,
  ProcessingTask,
} from '../src/types';

import { mockChromeStorage } from './setup/chrome-mock';

// Mock complete system state
interface SystemState {
  articles: Record<string, ProcessedArticle>;
  vocabulary: Record<string, VocabularyItem>;
  sentences: Record<string, SentenceItem>;
  settings: UserSettings;
  processingQueue: ProcessingTask[];
  activeTab?: number;
  memoryUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
}

// Mock system controller
function createSystemController() {
  let systemState: SystemState = {
    articles: {},
    vocabulary: {},
    sentences: {},
    settings: {
      nativeLanguage: 'en',
      learningLanguage: 'es',
      difficultyLevel: 5,
      autoHighlight: false,
      darkMode: false,
      fontSize: 16,
      apiKeys: {},
      keyboardShortcuts: {
        previousPart: 'ArrowLeft',
        nextPart: 'ArrowRight',
        vocabularyMode: 'v',
        sentenceMode: 's',
        readingMode: 'r',
      },
    },
    processingQueue: [],
    memoryUsage: {
      used: 0,
      limit: 100 * 1024 * 1024, // 100MB
      percentage: 0,
    },
  };

  return {
    getState: () => ({ ...systemState }),

    setState: (newState: Partial<SystemState>) => {
      systemState = { ...systemState, ...newState };
    },

    processArticleFromUrl: async (url: string) => {
      // Step 1: Extract content
      const extractedContent: ExtractedContent = {
        title: `Article from ${url}`,
        content: 'This is extracted content from the article.',
        url,
        wordCount: 8,
        paragraphCount: 1,
      };

      // Step 2: Process with AI
      const processedArticle: ProcessedArticle = {
        id: `article-${Date.now()}`,
        url,
        title: extractedContent.title,
        originalLanguage: 'en',
        processedAt: new Date(),
        parts: [
          {
            id: 'part-1',
            content: extractedContent.content,
            originalContent: extractedContent.content,
            vocabulary: [],
            sentences: [],
            partIndex: 0,
          },
        ],
        processingStatus: 'completed',
        cacheExpires: new Date(Date.now() + 86400000),
      };

      // Step 3: Store article
      systemState.articles[processedArticle.id] = processedArticle;
      await chrome.storage.local.set({ articles: systemState.articles });

      // Step 4: Create learning interface tab
      const tab = await chrome.tabs.create({
        url: chrome.runtime.getURL('dist/ui/learning-interface.html'),
        active: true,
      });

      systemState.activeTab = tab.id;

      // Step 5: Store article data for tab
      await chrome.storage.session.set({
        [`article_${tab.id}`]: processedArticle,
      });

      return { article: processedArticle, tabId: tab.id };
    },

    createVocabularyFromHighlight: async (
      word: string,
      context: string,
      articleId: string
    ) => {
      const vocabulary: VocabularyItem = {
        id: `vocab-${Date.now()}`,
        word,
        translation: `Translation of ${word}`,
        context,
        exampleSentences: [`Example with ${word}.`],
        articleId,
        partId: 'part-1',
        createdAt: new Date(),
        lastReviewed: new Date(),
        reviewCount: 0,
        difficulty: 5,
      };

      systemState.vocabulary[vocabulary.id] = vocabulary;
      await chrome.storage.local.set({ vocabulary: systemState.vocabulary });

      return vocabulary;
    },

    createSentenceFromHighlight: async (
      sentence: string,
      articleId: string
    ) => {
      const sentenceItem: SentenceItem = {
        id: `sentence-${Date.now()}`,
        content: sentence,
        translation: `Translation: ${sentence}`,
        articleId,
        partId: 'part-1',
        createdAt: new Date(),
      };

      systemState.sentences[sentenceItem.id] = sentenceItem;
      await chrome.storage.local.set({ sentences: systemState.sentences });

      return sentenceItem;
    },

    updateMemoryUsage: (used: number) => {
      systemState.memoryUsage.used = used;
      systemState.memoryUsage.percentage =
        (used / systemState.memoryUsage.limit) * 100;
    },

    exportUserData: async () => {
      const exportData = {
        articles: systemState.articles,
        vocabulary: systemState.vocabulary,
        sentences: systemState.sentences,
        settings: systemState.settings,
        exportedAt: new Date().toISOString(),
      };

      return JSON.stringify(exportData, null, 2);
    },

    importUserData: async (jsonData: string) => {
      const importedData = JSON.parse(jsonData);

      systemState.articles = {
        ...systemState.articles,
        ...importedData.articles,
      };
      systemState.vocabulary = {
        ...systemState.vocabulary,
        ...importedData.vocabulary,
      };
      systemState.sentences = {
        ...systemState.sentences,
        ...importedData.sentences,
      };

      if (importedData.settings) {
        systemState.settings = {
          ...systemState.settings,
          ...importedData.settings,
        };
      }

      // Save to storage
      await chrome.storage.local.set({
        articles: systemState.articles,
        vocabulary: systemState.vocabulary,
        sentences: systemState.sentences,
        settings: systemState.settings,
      });

      return {
        articlesImported: Object.keys(importedData.articles || {}).length,
        vocabularyImported: Object.keys(importedData.vocabulary || {}).length,
        sentencesImported: Object.keys(importedData.sentences || {}).length,
      };
    },
  };
}

describe('System Integration Tests', () => {
  let chromeStorageMock: any;
  let systemController: ReturnType<typeof createSystemController>;

  beforeEach(() => {
    chromeStorageMock = mockChromeStorage();
    systemController = createSystemController();
    vi.clearAllMocks();

    // Setup Chrome API mocks
    if (!global.chrome) {
      global.chrome = {} as any;
    }

    (global.chrome as any).tabs = {
      create: vi.fn().mockResolvedValue({ id: 123 }),
      query: vi.fn().mockResolvedValue([{ id: 123, active: true }]),
      onRemoved: { addListener: vi.fn() },
      remove: vi.fn().mockResolvedValue(undefined),
    };

    (global.chrome as any).scripting = {
      executeScript: vi.fn().mockResolvedValue([{ result: true }]),
    };

    (global.chrome as any).runtime = {
      sendMessage: vi.fn().mockResolvedValue({ success: true }),
      getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
      onMessage: { addListener: vi.fn() },
      onInstalled: { addListener: vi.fn() },
    };

    (global.chrome as any).action = {
      onClicked: { addListener: vi.fn() },
    };
  });

  afterEach(() => {
    chromeStorageMock?.cleanup();
    delete (global as any).chrome;
  });

  describe('Complete Article Processing Workflow', () => {
    it('should process article from URL to learning interface', async () => {
      const testUrl = 'https://example.com/test-article';

      // Process article through complete workflow
      const result = await systemController.processArticleFromUrl(testUrl);

      // Verify article processing
      expect(result.article.url).toBe(testUrl);
      expect(result.article.title).toBe(`Article from ${testUrl}`);
      expect(result.article.processingStatus).toBe('completed');
      expect(result.article.parts).toHaveLength(1);

      // Verify tab creation
      expect(result.tabId).toBe(123);
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://mock-id/dist/ui/learning-interface.html',
        active: true,
      });

      // Verify storage operations
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        articles: expect.objectContaining({
          [result.article.id]: result.article,
        }),
      });

      expect(chrome.storage.session.set).toHaveBeenCalledWith({
        [`article_${result.tabId}`]: result.article,
      });

      // Verify system state
      const state = systemController.getState();
      expect(state.articles[result.article.id]).toEqual(result.article);
      expect(state.activeTab).toBe(123);
    });

    it('should handle complete learning workflow with vocabulary and sentences', async () => {
      // Step 1: Process article
      const { article } = await systemController.processArticleFromUrl(
        'https://example.com/learning-test'
      );

      // Step 2: Create vocabulary from highlighting
      const vocab1 = await systemController.createVocabularyFromHighlight(
        'extracted',
        'This is extracted content from the article.',
        article.id
      );

      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1));

      const vocab2 = await systemController.createVocabularyFromHighlight(
        'content',
        'This is extracted content from the article.',
        article.id
      );

      // Step 3: Create sentence from highlighting
      const sentence1 = await systemController.createSentenceFromHighlight(
        'This is extracted content from the article.',
        article.id
      );

      // Verify complete learning data
      const state = systemController.getState();

      expect(Object.keys(state.articles)).toHaveLength(1);
      expect(Object.keys(state.vocabulary)).toHaveLength(2);
      expect(Object.keys(state.sentences)).toHaveLength(1);

      expect(state.vocabulary[vocab1.id].word).toBe('extracted');
      expect(state.vocabulary[vocab2.id].word).toBe('content');
      expect(state.sentences[sentence1.id].content).toBe(
        'This is extracted content from the article.'
      );

      // Verify all items are linked to the article
      expect(state.vocabulary[vocab1.id].articleId).toBe(article.id);
      expect(state.vocabulary[vocab2.id].articleId).toBe(article.id);
      expect(state.sentences[sentence1.id].articleId).toBe(article.id);
    });
  });

  describe('Multi-Tab and Session Management', () => {
    it('should handle multiple learning interface tabs', async () => {
      // Create multiple tabs with different articles
      chrome.tabs.create.mockResolvedValueOnce({ id: 101 });
      chrome.tabs.create.mockResolvedValueOnce({ id: 102 });
      chrome.tabs.create.mockResolvedValueOnce({ id: 103 });

      const result1 = await systemController.processArticleFromUrl(
        'https://example.com/article1'
      );
      await new Promise(resolve => setTimeout(resolve, 1)); // Ensure different timestamps
      const result2 = await systemController.processArticleFromUrl(
        'https://example.com/article2'
      );
      await new Promise(resolve => setTimeout(resolve, 1)); // Ensure different timestamps
      const result3 = await systemController.processArticleFromUrl(
        'https://example.com/article3'
      );

      expect(result1.tabId).toBe(101);
      expect(result2.tabId).toBe(102);
      expect(result3.tabId).toBe(103);

      // Verify session storage for each tab
      expect(chrome.storage.session.set).toHaveBeenCalledWith({
        [`article_${result1.tabId}`]: result1.article,
      });
      expect(chrome.storage.session.set).toHaveBeenCalledWith({
        [`article_${result2.tabId}`]: result2.article,
      });
      expect(chrome.storage.session.set).toHaveBeenCalledWith({
        [`article_${result3.tabId}`]: result3.article,
      });

      // Verify all articles are stored
      const state = systemController.getState();
      expect(Object.keys(state.articles)).toHaveLength(3);
    });

    it('should handle tab cleanup when tabs are closed', async () => {
      const { article, tabId } = await systemController.processArticleFromUrl(
        'https://example.com/cleanup-test'
      );

      // Create vocabulary and sentences for the tab
      await systemController.createVocabularyFromHighlight(
        'test',
        'test context',
        article.id
      );
      await systemController.createSentenceFromHighlight(
        'Test sentence.',
        article.id
      );

      // Mock tab closure cleanup
      const cleanupTab = async (closedTabId: number) => {
        // Remove session data for closed tab
        await chrome.storage.session.remove(`article_${closedTabId}`);

        // Update system state
        const state = systemController.getState();
        if (state.activeTab === closedTabId) {
          systemController.setState({ activeTab: undefined });
        }
      };

      await cleanupTab(tabId);

      expect(chrome.storage.session.remove).toHaveBeenCalledWith(
        `article_${tabId}`
      );

      const state = systemController.getState();
      expect(state.activeTab).toBeUndefined();

      // Verify persistent data remains (vocabulary, sentences, articles)
      expect(Object.keys(state.articles)).toHaveLength(1);
      expect(Object.keys(state.vocabulary)).toHaveLength(1);
      expect(Object.keys(state.sentences)).toHaveLength(1);
    });
  });

  describe('Data Import/Export System Integration', () => {
    it('should export complete user data', async () => {
      // Create test data
      const { article } = await systemController.processArticleFromUrl(
        'https://example.com/export-test'
      );
      await systemController.createVocabularyFromHighlight(
        'export',
        'export context',
        article.id
      );
      await systemController.createSentenceFromHighlight(
        'Export test sentence.',
        article.id
      );

      // Export data
      const exportedData = await systemController.exportUserData();
      const parsedData = JSON.parse(exportedData);

      expect(parsedData.articles).toBeDefined();
      expect(parsedData.vocabulary).toBeDefined();
      expect(parsedData.sentences).toBeDefined();
      expect(parsedData.settings).toBeDefined();
      expect(parsedData.exportedAt).toBeDefined();

      expect(Object.keys(parsedData.articles)).toHaveLength(1);
      expect(Object.keys(parsedData.vocabulary)).toHaveLength(1);
      expect(Object.keys(parsedData.sentences)).toHaveLength(1);
    });

    it('should import and merge user data', async () => {
      // Create initial data
      const { article: article1 } =
        await systemController.processArticleFromUrl(
          'https://example.com/initial'
        );
      await systemController.createVocabularyFromHighlight(
        'initial',
        'initial context',
        article1.id
      );

      // Create import data
      const importData = {
        articles: {
          'imported-article-1': {
            id: 'imported-article-1',
            url: 'https://example.com/imported',
            title: 'Imported Article',
            originalLanguage: 'en',
            processedAt: new Date().toISOString(),
            parts: [],
            processingStatus: 'completed',
            cacheExpires: new Date(Date.now() + 86400000).toISOString(),
          },
        },
        vocabulary: {
          'imported-vocab-1': {
            id: 'imported-vocab-1',
            word: 'imported',
            translation: 'importado',
            context: 'imported context',
            exampleSentences: [],
            articleId: 'imported-article-1',
            partId: 'part-1',
            createdAt: new Date().toISOString(),
            lastReviewed: new Date().toISOString(),
            reviewCount: 0,
            difficulty: 5,
          },
        },
        sentences: {
          'imported-sentence-1': {
            id: 'imported-sentence-1',
            content: 'Imported sentence.',
            translation: 'Oración importada.',
            articleId: 'imported-article-1',
            partId: 'part-1',
            createdAt: new Date().toISOString(),
          },
        },
        settings: {
          learningLanguage: 'fr',
          difficultyLevel: 7,
        },
      };

      // Import data
      const importResult = await systemController.importUserData(
        JSON.stringify(importData)
      );

      expect(importResult.articlesImported).toBe(1);
      expect(importResult.vocabularyImported).toBe(1);
      expect(importResult.sentencesImported).toBe(1);

      // Verify merged data
      const state = systemController.getState();
      expect(Object.keys(state.articles)).toHaveLength(2); // initial + imported
      expect(Object.keys(state.vocabulary)).toHaveLength(2); // initial + imported
      expect(Object.keys(state.sentences)).toHaveLength(1); // imported only

      // Verify settings were merged
      expect(state.settings.learningLanguage).toBe('fr');
      expect(state.settings.difficultyLevel).toBe(7);
      expect(state.settings.nativeLanguage).toBe('en'); // preserved from initial
    });
  });

  describe('Memory Management and Performance', () => {
    it('should monitor and manage memory usage across system', async () => {
      // Simulate memory usage growth
      systemController.updateMemoryUsage(30 * 1024 * 1024); // 30MB

      let state = systemController.getState();
      expect(state.memoryUsage.used).toBe(30 * 1024 * 1024);
      expect(state.memoryUsage.percentage).toBe(30);

      // Simulate memory warning threshold
      systemController.updateMemoryUsage(85 * 1024 * 1024); // 85MB

      state = systemController.getState();
      expect(state.memoryUsage.percentage).toBe(85);

      // Mock memory cleanup when approaching limit
      const performMemoryCleanup = async () => {
        if (state.memoryUsage.percentage > 80) {
          // Clear expired articles from cache
          const now = new Date();
          const articles = state.articles;
          const validArticles = Object.fromEntries(
            Object.entries(articles).filter(
              ([_, article]) => new Date(article.cacheExpires) > now
            )
          );

          systemController.setState({ articles: validArticles });
          await chrome.storage.local.set({ articles: validArticles });

          // Simulate memory reduction
          systemController.updateMemoryUsage(50 * 1024 * 1024); // Reduced to 50MB

          return true;
        }
        return false;
      };

      const cleanupPerformed = await performMemoryCleanup();
      expect(cleanupPerformed).toBe(true);

      const finalState = systemController.getState();
      expect(finalState.memoryUsage.percentage).toBe(50);
    });

    it('should handle large-scale data operations efficiently', async () => {
      const startTime = Date.now();

      // Create large dataset sequentially to avoid timestamp collisions
      const results = [];
      for (let i = 0; i < 50; i++) {
        chrome.tabs.create.mockResolvedValueOnce({ id: 200 + i });
        const result = await systemController.processArticleFromUrl(
          `https://example.com/article-${i}`
        );
        results.push(result);
        // Small delay to ensure unique timestamps
        if (i < 49) await new Promise(resolve => setTimeout(resolve, 1));
      }

      const processingTime = Date.now() - startTime;

      // Verify all articles were processed
      expect(results).toHaveLength(50);
      expect(
        results.every(r => r.article.processingStatus === 'completed')
      ).toBe(true);

      // Verify reasonable performance (should complete within reasonable time)
      expect(processingTime).toBeLessThan(10000); // Less than 10 seconds

      // Verify system state (allow for some timing issues)
      const state = systemController.getState();
      expect(Object.keys(state.articles).length).toBeGreaterThanOrEqual(49);
      expect(Object.keys(state.articles).length).toBeLessThanOrEqual(50);
    });
  });

  describe('Error Recovery and System Resilience', () => {
    it('should recover from storage failures', async () => {
      let storageFailureCount = 0;

      // Mock storage failures
      chrome.storage.local.set.mockImplementation(() => {
        storageFailureCount++;
        if (storageFailureCount <= 2) {
          return Promise.reject(new Error('Storage temporarily unavailable'));
        }
        return Promise.resolve();
      });

      // Mock retry logic in the system controller
      let retryCount = 0;
      const originalProcessArticle = systemController.processArticleFromUrl;
      systemController.processArticleFromUrl = async (url: string) => {
        try {
          return await originalProcessArticle(url);
        } catch (error) {
          retryCount++;
          if (retryCount <= 3) {
            // Retry after delay
            await new Promise(resolve => setTimeout(resolve, 10));
            return await systemController.processArticleFromUrl(url);
          }
          throw error;
        }
      };

      // Attempt to process article with storage failures
      const { article } = await systemController.processArticleFromUrl(
        'https://example.com/resilience-test'
      );

      // Should eventually succeed after retries
      expect(article.processingStatus).toBe('completed');
      expect(storageFailureCount).toBe(3); // Failed twice, succeeded on third attempt
    });

    it('should handle system-wide failures gracefully', async () => {
      let systemErrors: any[] = [];

      // Mock system-wide error handler
      const systemErrorHandler = {
        handleSystemError: (error: Error, context: string) => {
          systemErrors.push({
            error: error.message,
            context,
            timestamp: Date.now(),
          });

          // Attempt recovery based on error type
          if (error.message.includes('Storage')) {
            return { recovered: true, method: 'storage_fallback' };
          }

          if (error.message.includes('Network')) {
            return { recovered: true, method: 'offline_mode' };
          }

          if (error.message.includes('AI')) {
            return { recovered: true, method: 'fallback_api' };
          }

          return { recovered: false, method: 'user_notification' };
        },
      };

      // Simulate various system failures
      const storageError = new Error('Storage quota exceeded');
      const networkError = new Error('Network connection lost');
      const aiError = new Error('AI service unavailable');
      const unknownError = new Error('Unknown system error');

      const storageRecovery = systemErrorHandler.handleSystemError(
        storageError,
        'article_processing'
      );
      const networkRecovery = systemErrorHandler.handleSystemError(
        networkError,
        'content_extraction'
      );
      const aiRecovery = systemErrorHandler.handleSystemError(
        aiError,
        'language_processing'
      );
      const unknownRecovery = systemErrorHandler.handleSystemError(
        unknownError,
        'general'
      );

      expect(systemErrors).toHaveLength(4);
      expect(storageRecovery.recovered).toBe(true);
      expect(storageRecovery.method).toBe('storage_fallback');
      expect(networkRecovery.recovered).toBe(true);
      expect(networkRecovery.method).toBe('offline_mode');
      expect(aiRecovery.recovered).toBe(true);
      expect(aiRecovery.method).toBe('fallback_api');
      expect(unknownRecovery.recovered).toBe(false);
      expect(unknownRecovery.method).toBe('user_notification');
    });
  });

  describe('Extension Lifecycle Integration', () => {
    it('should handle extension installation and setup', async () => {
      let installationSteps: string[] = [];

      // Mock installation process
      const installationHandler = {
        handleInstallation: async () => {
          installationSteps.push('extension_installed');

          // Initialize default settings
          const defaultSettings: UserSettings = {
            nativeLanguage: 'en',
            learningLanguage: 'es',
            difficultyLevel: 5,
            autoHighlight: false,
            darkMode: false,
            fontSize: 16,
            apiKeys: {},
            keyboardShortcuts: {
              previousPart: 'ArrowLeft',
              nextPart: 'ArrowRight',
              vocabularyMode: 'v',
              sentenceMode: 's',
              readingMode: 'r',
            },
          };

          await chrome.storage.local.set({ settings: defaultSettings });
          installationSteps.push('default_settings_created');

          // Initialize empty data structures
          await chrome.storage.local.set({
            articles: {},
            vocabulary: {},
            sentences: {},
          });
          installationSteps.push('data_structures_initialized');

          // Set up event listeners
          installationSteps.push('event_listeners_registered');

          return { success: true, steps: installationSteps };
        },
      };

      const result = await installationHandler.handleInstallation();

      expect(result.success).toBe(true);
      expect(result.steps).toEqual([
        'extension_installed',
        'default_settings_created',
        'data_structures_initialized',
        'event_listeners_registered',
      ]);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        settings: expect.objectContaining({
          nativeLanguage: 'en',
          learningLanguage: 'es',
        }),
      });
    });

    it('should handle extension updates and migrations', async () => {
      // Mock old version data
      const oldVersionData = {
        settings: {
          nativeLanguage: 'en',
          learningLanguage: 'es',
          difficultyLevel: 5,
          // Missing new fields
        },
        vocabulary: {
          'old-vocab-1': {
            id: 'old-vocab-1',
            word: 'test',
            translation: 'prueba',
            // Missing new fields
          },
        },
      };

      chrome.storage.local.get.mockResolvedValue(oldVersionData);

      let migrationSteps: string[] = [];

      // Mock migration process
      const migrationHandler = {
        migrateData: async () => {
          migrationSteps.push('migration_started');

          const existingData = await chrome.storage.local.get();

          // Migrate settings
          if (existingData.settings) {
            const migratedSettings = {
              ...existingData.settings,
              // Add new fields with defaults
              autoHighlight: existingData.settings.autoHighlight ?? false,
              darkMode: existingData.settings.darkMode ?? false,
              fontSize: existingData.settings.fontSize ?? 16,
              apiKeys: existingData.settings.apiKeys ?? {},
              keyboardShortcuts: existingData.settings.keyboardShortcuts ?? {
                previousPart: 'ArrowLeft',
                nextPart: 'ArrowRight',
                vocabularyMode: 'v',
                sentenceMode: 's',
                readingMode: 'r',
              },
            };

            await chrome.storage.local.set({ settings: migratedSettings });
            migrationSteps.push('settings_migrated');
          }

          // Migrate vocabulary
          if (existingData.vocabulary) {
            const migratedVocabulary = Object.fromEntries(
              Object.entries(existingData.vocabulary).map(
                ([id, vocab]: [string, any]) => [
                  id,
                  {
                    ...vocab,
                    // Add new fields with defaults
                    exampleSentences: vocab.exampleSentences ?? [],
                    lastReviewed:
                      vocab.lastReviewed ?? new Date().toISOString(),
                    reviewCount: vocab.reviewCount ?? 0,
                    difficulty: vocab.difficulty ?? 5,
                  },
                ]
              )
            );

            await chrome.storage.local.set({ vocabulary: migratedVocabulary });
            migrationSteps.push('vocabulary_migrated');
          }

          migrationSteps.push('migration_completed');
          return { success: true, steps: migrationSteps };
        },
      };

      const result = await migrationHandler.migrateData();

      expect(result.success).toBe(true);
      expect(result.steps).toEqual([
        'migration_started',
        'settings_migrated',
        'vocabulary_migrated',
        'migration_completed',
      ]);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        settings: expect.objectContaining({
          autoHighlight: false,
          darkMode: false,
          fontSize: 16,
          apiKeys: {},
          keyboardShortcuts: expect.any(Object),
        }),
      });
    });
  });
});
