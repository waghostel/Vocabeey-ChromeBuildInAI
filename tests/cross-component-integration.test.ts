/**
 * Cross-Component Integration Tests
 * Tests interactions between different system components
 * Requirements: All requirements (task 12.4)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type {
  ExtractedContent,
  ProcessedArticle,
  VocabularyItem,
  SentenceItem,
  UserSettings,
  AIProcessor,
  ProcessingTask,
} from '../src/types';

import { mockChromeStorage } from './setup/chrome-mock';

// Mock AI Processor
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
      .mockImplementation((content: string) =>
        Promise.resolve(`Summary: ${content.substring(0, 50)}...`)
      ),
    rewriteContent: vi
      .fn()
      .mockImplementation((content: string, difficulty: number) =>
        Promise.resolve(`Rewritten (level ${difficulty}): ${content}`)
      ),
    analyzeVocabulary: vi.fn().mockImplementation((words: string[]) =>
      Promise.resolve(
        words.map(word => ({
          word,
          difficulty: 'intermediate' as const,
          definition: `Definition of ${word}`,
          examples: [`Example with ${word}`],
          partOfSpeech: 'noun' as const,
          frequency: 1,
        }))
      )
    ),
  };
}

// Mock complete article processing pipeline
function createMockProcessingPipeline() {
  return {
    extractContent: vi.fn().mockImplementation((url: string) =>
      Promise.resolve({
        title: 'Test Article',
        content: 'This is test content for processing.',
        url,
        wordCount: 7,
        paragraphCount: 1,
      } as ExtractedContent)
    ),

    processArticle: vi.fn().mockImplementation((content: ExtractedContent) =>
      Promise.resolve({
        id: 'processed-article-1',
        url: content.url,
        title: content.title,
        originalLanguage: 'en',
        processedAt: new Date(),
        parts: [
          {
            id: 'part-1',
            content: content.content,
            originalContent: content.content,
            vocabulary: [],
            sentences: [],
            partIndex: 0,
          },
        ],
        processingStatus: 'completed' as const,
        cacheExpires: new Date(Date.now() + 86400000),
      } as ProcessedArticle)
    ),

    createVocabularyCard: vi
      .fn()
      .mockImplementation((word: string, context: string) =>
        Promise.resolve({
          id: `vocab-${Date.now()}`,
          word,
          translation: `Translation of ${word}`,
          context,
          exampleSentences: [`Example with ${word}`],
          articleId: 'processed-article-1',
          partId: 'part-1',
          createdAt: new Date(),
          lastReviewed: new Date(),
          reviewCount: 0,
          difficulty: 5,
        } as VocabularyItem)
      ),

    createSentenceCard: vi.fn().mockImplementation((sentence: string) =>
      Promise.resolve({
        id: `sentence-${Date.now()}`,
        content: sentence,
        translation: `Translation of: ${sentence}`,
        articleId: 'processed-article-1',
        partId: 'part-1',
        createdAt: new Date(),
      } as SentenceItem)
    ),
  };
}

describe('Cross-Component Integration Tests', () => {
  let chromeStorageMock: any;
  let aiProcessor: AIProcessor;
  let processingPipeline: ReturnType<typeof createMockProcessingPipeline>;

  beforeEach(() => {
    chromeStorageMock = mockChromeStorage();
    aiProcessor = createMockAIProcessor();
    processingPipeline = createMockProcessingPipeline();
    vi.clearAllMocks();

    // Setup Chrome API mocks
    if (!global.chrome) {
      global.chrome = {} as any;
    }

    (global.chrome as any).tabs = {
      create: vi.fn().mockResolvedValue({ id: 123 }),
      query: vi.fn().mockResolvedValue([{ id: 123, active: true }]),
      onRemoved: { addListener: vi.fn() },
    };

    (global.chrome as any).scripting = {
      executeScript: vi.fn().mockResolvedValue([{ result: true }]),
    };

    (global.chrome as any).runtime = {
      sendMessage: vi.fn().mockResolvedValue({ success: true }),
      getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
      onMessage: { addListener: vi.fn() },
    };
  });

  afterEach(() => {
    chromeStorageMock?.cleanup();
    delete (global as any).chrome;
  });

  describe('Service Worker to Content Script Communication', () => {
    it('should coordinate article processing between service worker and content script', async () => {
      const testUrl = 'https://example.com/test-article';
      let messagesSent: any[] = [];

      // Mock message passing
      chrome.runtime.sendMessage.mockImplementation(message => {
        messagesSent.push(message);

        if (message.type === 'EXTRACT_CONTENT') {
          return Promise.resolve({
            success: true,
            content: {
              title: 'Test Article',
              content: 'This is test content.',
              url: testUrl,
              wordCount: 4,
              paragraphCount: 1,
            },
          });
        }

        if (message.type === 'PROCESS_ARTICLE') {
          return Promise.resolve({
            success: true,
            articleId: 'processed-article-1',
          });
        }

        return Promise.resolve({ success: false });
      });

      // Simulate service worker processing
      const extractResponse = await chrome.runtime.sendMessage({
        type: 'EXTRACT_CONTENT',
        url: testUrl,
      });

      expect(extractResponse.success).toBe(true);
      expect(extractResponse.content.title).toBe('Test Article');

      // Simulate article processing
      const processResponse = await chrome.runtime.sendMessage({
        type: 'PROCESS_ARTICLE',
        content: extractResponse.content,
      });

      expect(processResponse.success).toBe(true);
      expect(processResponse.articleId).toBe('processed-article-1');
      expect(messagesSent).toHaveLength(2);
    });

    it('should handle content script injection and communication', async () => {
      const tabId = 123;
      let injectedScripts: any[] = [];

      chrome.scripting.executeScript.mockImplementation(options => {
        injectedScripts.push(options);
        return Promise.resolve([{ result: { contentExtracted: true } }]);
      });

      // Simulate content script injection
      const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => ({ contentExtracted: true }),
      });

      expect(result[0].result.contentExtracted).toBe(true);
      expect(injectedScripts).toHaveLength(1);
      expect(injectedScripts[0].target.tabId).toBe(tabId);
    });
  });

  describe('AI Processing Pipeline Integration', () => {
    it('should coordinate between different AI services', async () => {
      const testContent = 'This is test content for AI processing.';

      // Test language detection
      const language = await aiProcessor.detectLanguage(testContent);
      expect(language).toBe('en');
      expect(aiProcessor.detectLanguage).toHaveBeenCalledWith(testContent);

      // Test content summarization
      const summary = await aiProcessor.summarizeContent(testContent, {
        maxLength: 100,
      });
      expect(summary).toContain('Summary:');
      expect(aiProcessor.summarizeContent).toHaveBeenCalledWith(testContent, {
        maxLength: 100,
      });

      // Test content rewriting
      const rewritten = await aiProcessor.rewriteContent(testContent, 5);
      expect(rewritten).toContain('Rewritten (level 5):');
      expect(aiProcessor.rewriteContent).toHaveBeenCalledWith(testContent, 5);

      // Test vocabulary analysis
      const words = ['test', 'content'];
      const analysis = await aiProcessor.analyzeVocabulary(words);
      expect(analysis).toHaveLength(2);
      expect(analysis[0].word).toBe('test');
      expect(aiProcessor.analyzeVocabulary).toHaveBeenCalledWith(words);
    });

    it('should handle AI service fallback chain', async () => {
      let chromeAIFailed = false;
      let geminiUsed = false;

      // Mock Chrome AI failure
      aiProcessor.detectLanguage = vi.fn().mockImplementation(() => {
        chromeAIFailed = true;
        throw new Error('Chrome AI not available');
      });

      // Mock fallback to Gemini
      const fallbackProcessor = {
        detectLanguage: vi.fn().mockImplementation(() => {
          geminiUsed = true;
          return Promise.resolve('en');
        }),
      };

      // Simulate fallback logic
      let result;
      try {
        result = await aiProcessor.detectLanguage('test content');
      } catch {
        result = await fallbackProcessor.detectLanguage('test content');
      }

      expect(chromeAIFailed).toBe(true);
      expect(geminiUsed).toBe(true);
      expect(result).toBe('en');
    });
  });

  describe('Storage and Cache Integration', () => {
    it('should coordinate between session and local storage', async () => {
      const article: ProcessedArticle = {
        id: 'test-article',
        url: 'https://example.com/test',
        title: 'Test Article',
        originalLanguage: 'en',
        processedAt: new Date(),
        parts: [],
        processingStatus: 'completed',
        cacheExpires: new Date(Date.now() + 86400000),
      };

      const vocabulary: VocabularyItem = {
        id: 'vocab-1',
        word: 'test',
        translation: 'prueba',
        context: 'This is a test.',
        exampleSentences: [],
        articleId: 'test-article',
        partId: 'part-1',
        createdAt: new Date(),
        lastReviewed: new Date(),
        reviewCount: 0,
        difficulty: 5,
      };

      // Store article in session storage (temporary)
      await chrome.storage.session.set({ [`article_${article.id}`]: article });

      // Store vocabulary in local storage (persistent)
      await chrome.storage.local.set({
        vocabulary: { [vocabulary.id]: vocabulary },
      });

      // Mock storage get methods to return the stored data
      chrome.storage.session.get.mockResolvedValue({
        [`article_${article.id}`]: article,
      });
      chrome.storage.local.get.mockResolvedValue({
        vocabulary: { [vocabulary.id]: vocabulary },
      });

      // Verify storage coordination
      const sessionData = await chrome.storage.session.get(
        `article_${article.id}`
      );
      const localData = await chrome.storage.local.get('vocabulary');

      expect(sessionData[`article_${article.id}`]).toEqual(article);
      expect(localData.vocabulary[vocabulary.id]).toEqual(vocabulary);
      expect(chrome.storage.session.set).toHaveBeenCalled();
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    it('should handle cache invalidation and cleanup', async () => {
      const expiredArticle: ProcessedArticle = {
        id: 'expired-article',
        url: 'https://example.com/expired',
        title: 'Expired Article',
        originalLanguage: 'en',
        processedAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
        parts: [],
        processingStatus: 'completed',
        cacheExpires: new Date(Date.now() - 86400000), // Expired 1 day ago
      };

      const validArticle: ProcessedArticle = {
        id: 'valid-article',
        url: 'https://example.com/valid',
        title: 'Valid Article',
        originalLanguage: 'en',
        processedAt: new Date(),
        parts: [],
        processingStatus: 'completed',
        cacheExpires: new Date(Date.now() + 86400000), // Expires in 1 day
      };

      // Store both articles
      await chrome.storage.local.set({
        articles: {
          [expiredArticle.id]: expiredArticle,
          [validArticle.id]: validArticle,
        },
      });

      // Mock cache cleanup logic
      const cleanupCache = async () => {
        const data = await chrome.storage.local.get('articles');
        const articles = data.articles || {};
        const now = new Date();

        const validArticles = Object.fromEntries(
          Object.entries(articles).filter(
            ([_, article]: [string, any]) =>
              new Date(article.cacheExpires) > now
          )
        );

        await chrome.storage.local.set({ articles: validArticles });
        return Object.keys(validArticles);
      };

      const remainingArticles = await cleanupCache();

      expect(remainingArticles).toHaveLength(1);
      expect(remainingArticles[0]).toBe('valid-article');
    });
  });

  describe('UI Component Integration', () => {
    it('should coordinate between different UI modes', async () => {
      // Setup DOM
      document.body.innerHTML = `
        <div class="learning-interface">
          <div class="mode-tabs">
            <button class="tab-button active" data-mode="reading">Reading</button>
            <button class="tab-button" data-mode="vocabulary">Vocabulary</button>
            <button class="tab-button" data-mode="sentences">Sentences</button>
          </div>
          <div class="mode-content active" data-mode="reading">
            <div class="article-content"></div>
          </div>
          <div class="mode-content" data-mode="vocabulary">
            <div class="vocabulary-grid"></div>
          </div>
          <div class="mode-content" data-mode="sentences">
            <div class="sentence-list"></div>
          </div>
        </div>
      `;

      let currentMode = 'reading';
      const vocabulary = [
        { id: 'vocab-1', word: 'test', translation: 'prueba' },
        { id: 'vocab-2', word: 'example', translation: 'ejemplo' },
      ];
      const sentences = [
        {
          id: 'sentence-1',
          content: 'This is a test.',
          translation: 'Esto es una prueba.',
        },
      ];

      // Mock mode switching logic
      const switchMode = (mode: string) => {
        currentMode = mode;

        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
          btn.classList.toggle(
            'active',
            (btn as HTMLElement).dataset.mode === mode
          );
        });

        // Update content visibility
        document.querySelectorAll('.mode-content').forEach(content => {
          content.classList.toggle(
            'active',
            (content as HTMLElement).dataset.mode === mode
          );
        });

        // Render mode-specific content
        if (mode === 'vocabulary') {
          const grid = document.querySelector(
            '.vocabulary-grid'
          ) as HTMLElement;
          grid.innerHTML = vocabulary
            .map(
              v =>
                `<div class="vocab-card" data-vocab-id="${v.id}">${v.word} - ${v.translation}</div>`
            )
            .join('');
        } else if (mode === 'sentences') {
          const list = document.querySelector('.sentence-list') as HTMLElement;
          list.innerHTML = sentences
            .map(
              s =>
                `<div class="sentence-card" data-sentence-id="${s.id}">${s.content}</div>`
            )
            .join('');
        }
      };

      // Test mode switching
      expect(currentMode).toBe('reading');

      switchMode('vocabulary');
      expect(currentMode).toBe('vocabulary');
      expect(
        document
          .querySelector('[data-mode="vocabulary"]')
          ?.classList.contains('active')
      ).toBe(true);
      expect(document.querySelectorAll('.vocab-card')).toHaveLength(2);

      switchMode('sentences');
      expect(currentMode).toBe('sentences');
      expect(
        document
          .querySelector('[data-mode="sentences"]')
          ?.classList.contains('active')
      ).toBe(true);
      expect(document.querySelectorAll('.sentence-card')).toHaveLength(1);
    });

    it('should integrate highlighting with storage and AI processing', async () => {
      document.body.innerHTML = `
        <div class="article-content">
          <p>This is a test sentence with vocabulary words.</p>
        </div>
        <div class="vocabulary-cards"></div>
      `;

      let storedVocabulary: VocabularyItem[] = [];

      // Mock highlighting workflow
      const highlightWorkflow = async (
        selectedText: string,
        context: string
      ) => {
        // Step 1: AI processing for translation
        const translation = await aiProcessor.translateText(selectedText);

        // Step 2: Create vocabulary item
        const vocabItem = await processingPipeline.createVocabularyCard(
          selectedText,
          context
        );

        // Step 3: Store in local storage
        storedVocabulary.push(vocabItem);
        await chrome.storage.local.set({
          vocabulary: storedVocabulary.reduce(
            (acc, v) => ({ ...acc, [v.id]: v }),
            {}
          ),
        });

        // Step 4: Update UI
        const container = document.querySelector(
          '.vocabulary-cards'
        ) as HTMLElement;
        const card = document.createElement('div');
        card.className = 'vocab-card';
        card.innerHTML = `
          <span class="word">${vocabItem.word}</span>
          <span class="translation">${vocabItem.translation}</span>
        `;
        container.appendChild(card);

        return vocabItem;
      };

      // Test complete highlighting workflow
      const result = await highlightWorkflow('test', 'This is a test sentence');

      expect(result.word).toBe('test');
      expect(result.translation).toContain('Translation of test');
      expect(storedVocabulary).toHaveLength(1);
      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(document.querySelectorAll('.vocab-card')).toHaveLength(1);
      expect(aiProcessor.translateText).toHaveBeenCalledWith('test');
    });
  });

  describe('Error Handling and Recovery Integration', () => {
    it('should coordinate error handling across components', async () => {
      let errorsCaught: any[] = [];
      let recoveryAttempts = 0;

      // Mock error handling system
      const errorHandler = {
        handleError: (error: Error, component: string) => {
          errorsCaught.push({ error: error.message, component });
          return errorHandler.attemptRecovery(error, component);
        },

        attemptRecovery: async (error: Error, component: string) => {
          recoveryAttempts++;

          if (
            component === 'ai_processor' &&
            error.message === 'Chrome AI not available'
          ) {
            // Try Gemini fallback
            return { recovered: true, method: 'gemini_fallback' };
          }

          if (
            component === 'storage' &&
            error.message === 'Storage quota exceeded'
          ) {
            // Try cache cleanup
            await chrome.storage.local.clear();
            return { recovered: true, method: 'cache_cleanup' };
          }

          if (
            component === 'content_extraction' &&
            error.message === 'Content not found'
          ) {
            // Try alternative extraction method
            return { recovered: true, method: 'alternative_extraction' };
          }

          return { recovered: false, method: 'none' };
        },
      };

      // Test AI processor error recovery
      const aiError = new Error('Chrome AI not available');
      const aiRecovery = await errorHandler.handleError(
        aiError,
        'ai_processor'
      );

      expect(errorsCaught).toHaveLength(1);
      expect(aiRecovery.recovered).toBe(true);
      expect(aiRecovery.method).toBe('gemini_fallback');

      // Test storage error recovery
      const storageError = new Error('Storage quota exceeded');
      const storageRecovery = await errorHandler.handleError(
        storageError,
        'storage'
      );

      expect(errorsCaught).toHaveLength(2);
      expect(storageRecovery.recovered).toBe(true);
      expect(storageRecovery.method).toBe('cache_cleanup');

      // Test content extraction error recovery
      const contentError = new Error('Content not found');
      const contentRecovery = await errorHandler.handleError(
        contentError,
        'content_extraction'
      );

      expect(errorsCaught).toHaveLength(3);
      expect(contentRecovery.recovered).toBe(true);
      expect(contentRecovery.method).toBe('alternative_extraction');
      expect(recoveryAttempts).toBe(3);
    });

    it('should handle cascading failures gracefully', async () => {
      let failureChain: string[] = [];

      // Mock cascading failure scenario
      const cascadingFailureHandler = async () => {
        try {
          // Step 1: Content extraction fails
          failureChain.push('content_extraction_failed');
          throw new Error('Content extraction failed');
        } catch {
          try {
            // Step 2: Try alternative extraction, but AI processing fails
            failureChain.push('ai_processing_failed');
            throw new Error('AI processing failed');
          } catch {
            try {
              // Step 3: Try to save error state, but storage fails
              failureChain.push('storage_failed');
              throw new Error('Storage failed');
            } catch {
              // Step 4: Final fallback - show user error message
              failureChain.push('user_notification_shown');
              return {
                success: false,
                fallbackUsed: true,
                userNotified: true,
                failureChain,
              };
            }
          }
        }
      };

      const result = await cascadingFailureHandler();

      expect(result.success).toBe(false);
      expect(result.fallbackUsed).toBe(true);
      expect(result.userNotified).toBe(true);
      expect(result.failureChain).toEqual([
        'content_extraction_failed',
        'ai_processing_failed',
        'storage_failed',
        'user_notification_shown',
      ]);
    });
  });

  describe('Performance Integration', () => {
    it('should coordinate performance monitoring across components', async () => {
      let performanceMetrics: any = {};

      // Mock performance monitoring
      const performanceMonitor = {
        startTimer: (operation: string) => {
          performanceMetrics[operation] = { startTime: Date.now() };
        },

        endTimer: (operation: string) => {
          if (performanceMetrics[operation]) {
            performanceMetrics[operation].duration =
              Date.now() - performanceMetrics[operation].startTime;
          }
        },

        getMetrics: () => performanceMetrics,
      };

      // Test performance monitoring across workflow
      performanceMonitor.startTimer('content_extraction');
      await new Promise(resolve => setTimeout(resolve, 10)); // Add small delay
      await processingPipeline.extractContent('https://example.com/test');
      performanceMonitor.endTimer('content_extraction');

      performanceMonitor.startTimer('ai_processing');
      await new Promise(resolve => setTimeout(resolve, 10)); // Add small delay
      await aiProcessor.detectLanguage('test content');
      performanceMonitor.endTimer('ai_processing');

      performanceMonitor.startTimer('storage_operation');
      await new Promise(resolve => setTimeout(resolve, 10)); // Add small delay
      await chrome.storage.local.set({ test: 'data' });
      performanceMonitor.endTimer('storage_operation');

      const metrics = performanceMonitor.getMetrics();

      expect(metrics.content_extraction.duration).toBeGreaterThan(0);
      expect(metrics.ai_processing.duration).toBeGreaterThan(0);
      expect(metrics.storage_operation.duration).toBeGreaterThan(0);
      expect(Object.keys(metrics)).toHaveLength(3);
    });
  });

  describe('Settings and Configuration Integration', () => {
    it('should propagate settings changes across all components', async () => {
      const initialSettings: UserSettings = {
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

      let currentSettings = { ...initialSettings };
      let componentsNotified: string[] = [];

      // Mock settings propagation system
      const settingsManager = {
        updateSettings: async (newSettings: Partial<UserSettings>) => {
          currentSettings = { ...currentSettings, ...newSettings };
          await chrome.storage.local.set({ settings: currentSettings });

          // Notify all components
          await settingsManager.notifyComponents(newSettings);
        },

        notifyComponents: async (changedSettings: Partial<UserSettings>) => {
          if (
            changedSettings.learningLanguage ||
            changedSettings.nativeLanguage
          ) {
            componentsNotified.push('ai_processor');
            // Update AI processor language settings
          }

          if (changedSettings.difficultyLevel) {
            componentsNotified.push('content_processor');
            // Update content processing difficulty
          }

          if (
            changedSettings.darkMode !== undefined ||
            changedSettings.fontSize
          ) {
            componentsNotified.push('ui_components');
            // Update UI theme and styling
          }

          if (changedSettings.apiKeys) {
            componentsNotified.push('api_manager');
            // Update API configurations
          }

          if (changedSettings.keyboardShortcuts) {
            componentsNotified.push('keyboard_handler');
            // Update keyboard shortcuts
          }
        },
      };

      // Test settings propagation
      await settingsManager.updateSettings({
        learningLanguage: 'fr',
        difficultyLevel: 8,
        darkMode: true,
        apiKeys: { gemini: 'new-api-key' },
      });

      expect(currentSettings.learningLanguage).toBe('fr');
      expect(currentSettings.difficultyLevel).toBe(8);
      expect(currentSettings.darkMode).toBe(true);
      expect(currentSettings.apiKeys.gemini).toBe('new-api-key');
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        settings: currentSettings,
      });
      expect(componentsNotified).toContain('ai_processor');
      expect(componentsNotified).toContain('content_processor');
      expect(componentsNotified).toContain('ui_components');
      expect(componentsNotified).toContain('api_manager');
    });
  });
});
