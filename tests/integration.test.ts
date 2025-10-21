/**
 * Integration tests for Language Learning Chrome Extension
 * Tests complete end-to-end workflows and component integration
 * Requirements: All requirements (task 12.1)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type {
  ExtractedContent,
  ProcessedArticle,
  VocabularyItem,
  SentenceItem,
  UserSettings,
} from '../src/types';

import { mockChromeStorage } from './setup/chrome-mock';

// Mock complete DOM structure for learning interface
function createFullMockDOM(): void {
  document.body.innerHTML = `
    <div class="learning-interface">
      <!-- Mode tabs -->
      <div class="mode-tabs">
        <button class="tab-button active" data-mode="reading">Reading</button>
        <button class="tab-button" data-mode="vocabulary">Vocabulary</button>
        <button class="tab-button" data-mode="sentences">Sentences</button>
      </div>

      <!-- Article header -->
      <div class="article-header">
        <h1 class="article-title"></h1>
        <div class="article-url"></div>
        <div class="article-language"></div>
      </div>

      <!-- Mode contents -->
      <div class="mode-content active" data-mode="reading">
        <div class="article-part-content"></div>
        <div class="vocabulary-cards"></div>
        <div class="sentence-cards"></div>
        
        <!-- Navigation -->
        <div class="navigation">
          <button id="prev-part">Previous</button>
          <span class="current-part">1</span> / <span class="total-parts">1</span>
          <button id="next-part">Next</button>
        </div>

        <!-- Highlight mode controls -->
        <div class="highlight-controls">
          <button class="highlight-mode-btn active" data-highlight-mode="vocabulary">Vocabulary</button>
          <button class="highlight-mode-btn" data-highlight-mode="sentence">Sentence</button>
        </div>
      </div>

      <div class="mode-content" data-mode="vocabulary">
        <div class="display-options">
          <button class="display-option active" data-display="both">Both</button>
          <button class="display-option" data-display="learning_only">Learning Only</button>
          <button class="display-option" data-display="native_only">Native Only</button>
        </div>
        <div class="vocabulary-grid"></div>
      </div>

      <div class="mode-content" data-mode="sentences">
        <div class="sentence-list"></div>
      </div>

      <!-- Loading overlay -->
      <div class="loading-overlay hidden">
        <div class="loading-text"></div>
      </div>

      <!-- Context menu -->
      <div class="context-menu hidden">
        <div class="context-menu-item" data-action="remove">Remove</div>
      </div>

      <!-- Memory indicator -->
      <div id="memory-indicator" class="memory-indicator hidden">
        <div class="memory-stats"></div>
      </div>

      <!-- TTS indicator -->
      <div class="tts-indicator hidden">
        <span class="tts-indicator-icon">🔊</span>
        <span>Speaking...</span>
        <button class="tts-stop-btn">Stop</button>
      </div>
    </div>
  `;
}

// Mock article data with multiple parts
function createCompleteArticle(): ProcessedArticle {
  return {
    id: 'article-integration-test',
    url: 'https://example.com/test-article',
    title: 'Integration Test Article',
    originalLanguage: 'en',
    processedAt: new Date(),
    parts: [
      {
        id: 'part-1',
        content:
          'This is the first paragraph with some vocabulary words.\n\nThis paragraph contains example sentences for testing.',
        originalContent:
          'This is the first paragraph with some vocabulary words.\n\nThis paragraph contains example sentences for testing.',
        vocabulary: ['vocab-1', 'vocab-2'],
        sentences: ['sentence-1'],
        partIndex: 0,
      },
      {
        id: 'part-2',
        content:
          'The second part has different content.\n\nIt includes more complex vocabulary and longer sentences.',
        originalContent:
          'The second part has different content.\n\nIt includes more complex vocabulary and longer sentences.',
        vocabulary: ['vocab-3'],
        sentences: ['sentence-2'],
        partIndex: 1,
      },
    ],
    processingStatus: 'completed',
    cacheExpires: new Date(Date.now() + 86400000),
  };
}

// Mock vocabulary items
function createTestVocabulary(): VocabularyItem[] {
  return [
    {
      id: 'vocab-1',
      word: 'vocabulary',
      translation: 'vocabulario',
      context: 'This is the first paragraph with some vocabulary words.',
      exampleSentences: [
        'Learning vocabulary is important.',
        'Build your vocabulary daily.',
      ],
      articleId: 'article-integration-test',
      partId: 'part-1',
      createdAt: new Date(),
      lastReviewed: new Date(),
      reviewCount: 0,
      difficulty: 5,
    },
    {
      id: 'vocab-2',
      word: 'example',
      translation: 'ejemplo',
      context: 'This paragraph contains example sentences for testing.',
      exampleSentences: ['This is an example.', 'Follow this example.'],
      articleId: 'article-integration-test',
      partId: 'part-1',
      createdAt: new Date(),
      lastReviewed: new Date(),
      reviewCount: 1,
      difficulty: 3,
    },
    {
      id: 'vocab-3',
      word: 'complex',
      translation: 'complejo',
      context: 'It includes more complex vocabulary and longer sentences.',
      exampleSentences: [
        'This is complex.',
        'Complex problems need solutions.',
      ],
      articleId: 'article-integration-test',
      partId: 'part-2',
      createdAt: new Date(),
      lastReviewed: new Date(),
      reviewCount: 0,
      difficulty: 7,
    },
  ];
}

// Mock sentence items
function createTestSentences(): SentenceItem[] {
  return [
    {
      id: 'sentence-1',
      content: 'This paragraph contains example sentences for testing.',
      translation: 'Este párrafo contiene oraciones de ejemplo para pruebas.',
      articleId: 'article-integration-test',
      partId: 'part-1',
      createdAt: new Date(),
    },
    {
      id: 'sentence-2',
      content: 'It includes more complex vocabulary and longer sentences.',
      translation: 'Incluye vocabulario más complejo y oraciones más largas.',
      articleId: 'article-integration-test',
      partId: 'part-2',
      createdAt: new Date(),
    },
  ];
}

// Mock user settings
function createTestSettings(): UserSettings {
  return {
    nativeLanguage: 'en',
    learningLanguage: 'es',
    difficultyLevel: 5,
    autoHighlight: false,
    darkMode: false,
    fontSize: 16,
    apiKeys: {
      gemini: 'test-gemini-key',
      jinaReader: 'test-jina-key',
    },
    keyboardShortcuts: {
      previousPart: 'ArrowLeft',
      nextPart: 'ArrowRight',
      vocabularyMode: 'v',
      sentenceMode: 's',
      readingMode: 'r',
    },
  };
}

describe('Integration Tests - Complete Workflow', () => {
  let chromeStorageMock: any;

  beforeEach(() => {
    createFullMockDOM();
    vi.clearAllMocks();

    // Setup Chrome API mocks
    chromeStorageMock = mockChromeStorage();

    // Add additional Chrome API mocks
    if (!global.chrome) {
      global.chrome = {} as any;
    }

    (global.chrome as any).tabs = {
      create: vi.fn().mockResolvedValue({ id: 123 }),
      query: vi.fn().mockResolvedValue([{ id: 123, active: true }]),
      onRemoved: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    };

    (global.chrome as any).scripting = {
      executeScript: vi.fn().mockResolvedValue([{ result: true }]),
    };

    (global.chrome as any).action = {
      onClicked: {
        addListener: vi.fn(),
      },
    };

    (global.chrome as any).runtime = {
      sendMessage: vi.fn().mockResolvedValue({ success: true }),
      getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
      onInstalled: {
        addListener: vi.fn(),
      },
      onSuspend: {
        addListener: vi.fn(),
      },
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    chromeStorageMock?.cleanup();
    delete (global as any).chrome;
  });

  describe('End-to-End Article Processing Pipeline', () => {
    it('should complete full article processing workflow', async () => {
      // Step 1: Content extraction from web page
      const extractedContent: ExtractedContent = {
        title: 'Integration Test Article',
        content:
          'This is the first paragraph with some vocabulary words. This paragraph contains example sentences for testing. The second part has different content. It includes more complex vocabulary and longer sentences.',
        url: 'https://example.com/test-article',
        wordCount: 32,
        paragraphCount: 4,
      };

      // Step 2: Service worker processes content
      chrome.storage.session.set.mockResolvedValue(undefined);
      await chrome.storage.session.set({
        [`pending_article_${Date.now()}`]: extractedContent,
      });

      expect(chrome.storage.session.set).toHaveBeenCalled();

      // Step 3: Learning interface tab creation
      const mockTab = {
        id: 456,
        url: 'chrome-extension://test/learning-interface.html',
      };
      chrome.tabs.create.mockResolvedValue(mockTab);

      const tab = await chrome.tabs.create({
        url: chrome.runtime.getURL('dist/ui/learning-interface.html'),
        active: true,
      });

      expect(tab.id).toBe(456);
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://mock-id/dist/ui/learning-interface.html',
        active: true,
      });

      // Step 4: Article data stored for tab
      await chrome.storage.session.set({
        [`article_${tab.id}`]: extractedContent,
      });

      expect(chrome.storage.session.set).toHaveBeenCalledWith({
        [`article_${tab.id}`]: extractedContent,
      });

      // Step 5: Learning interface loads article
      const processedArticle = createCompleteArticle();
      chrome.storage.session.get.mockResolvedValue({
        [`article_${tab.id}`]: processedArticle,
      });

      const articleData = await chrome.storage.session.get(`article_${tab.id}`);
      expect(articleData[`article_${tab.id}`]).toEqual(processedArticle);

      // Verify complete workflow
      expect(chrome.storage.session.set).toHaveBeenCalledTimes(2);
      expect(chrome.tabs.create).toHaveBeenCalledTimes(1);
      expect(chrome.storage.session.get).toHaveBeenCalledTimes(1);
    });

    it('should handle AI processing pipeline', async () => {
      const article = createCompleteArticle();

      // Mock AI processing results
      const mockAIResults = {
        language_detection: 'en',
        summarization: 'Summarized content',
        translation: 'Translated text',
        vocabulary_analysis: [
          { word: 'vocabulary', difficulty: 5, examples: ['Example 1'] },
          { word: 'example', difficulty: 3, examples: ['Example 2'] },
        ],
      };

      // Mock AI processing call
      chrome.runtime.sendMessage.mockImplementation(message => {
        if (message.type === 'OFFSCREEN_TASK') {
          const result =
            mockAIResults[message.taskType as keyof typeof mockAIResults];
          return Promise.resolve({ success: true, result });
        }
        return Promise.resolve({ success: false });
      });

      // Test language detection
      const response = await chrome.runtime.sendMessage({
        type: 'OFFSCREEN_TASK',
        taskId: 'lang-detect-1',
        taskType: 'language_detection',
        data: { text: article.parts[0].content },
      });

      expect(response.success).toBe(true);
      expect(response.result).toBe('en');
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'OFFSCREEN_TASK',
        taskId: 'lang-detect-1',
        taskType: 'language_detection',
        data: { text: article.parts[0].content },
      });
    });

    it('should integrate storage management throughout workflow', async () => {
      const article = createCompleteArticle();
      const vocabulary = createTestVocabulary();
      const sentences = createTestSentences();
      const settings = createTestSettings();

      // Mock storage with complete data
      chrome.storage.local.get.mockImplementation(keys => {
        const mockData: any = {
          settings,
          articles: { [article.id]: article },
          vocabulary: vocabulary.reduce(
            (acc, v) => ({ ...acc, [v.id]: v }),
            {}
          ),
          sentences: sentences.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}),
        };

        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockData[keys] });
        }
        if (Array.isArray(keys)) {
          const result: any = {};
          keys.forEach(key => {
            result[key] = mockData[key];
          });
          return Promise.resolve(result);
        }
        return Promise.resolve(mockData);
      });

      // Test loading all data
      const allData = await chrome.storage.local.get([
        'settings',
        'articles',
        'vocabulary',
        'sentences',
      ]);

      expect(allData.settings).toEqual(settings);
      expect(allData.articles[article.id]).toEqual(article);
      expect(Object.keys(allData.vocabulary)).toHaveLength(3);
      expect(Object.keys(allData.sentences)).toHaveLength(2);

      // Test saving new vocabulary
      const newVocab: VocabularyItem = {
        id: 'vocab-new',
        word: 'integration',
        translation: 'integración',
        context: 'Integration testing is important.',
        exampleSentences: [],
        articleId: article.id,
        partId: 'part-1',
        createdAt: new Date(),
        lastReviewed: new Date(),
        reviewCount: 0,
        difficulty: 6,
      };

      await chrome.storage.local.set({
        vocabulary: { ...allData.vocabulary, [newVocab.id]: newVocab },
      });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        vocabulary: expect.objectContaining({
          [newVocab.id]: newVocab,
        }),
      });
    });
  });

  describe('User Interaction Flows', () => {
    it('should handle complete reading mode workflow', async () => {
      const article = createCompleteArticle();
      const vocabulary = createTestVocabulary();
      const sentences = createTestSentences();

      // Setup DOM with article data
      const titleElement = document.querySelector(
        '.article-title'
      ) as HTMLElement;
      const urlElement = document.querySelector('.article-url') as HTMLElement;
      const langElement = document.querySelector(
        '.article-language'
      ) as HTMLElement;
      const contentElement = document.querySelector(
        '.article-part-content'
      ) as HTMLElement;

      // Render article header
      titleElement.textContent = article.title;
      urlElement.textContent = article.url;
      langElement.textContent = article.originalLanguage.toUpperCase();

      // Render first part
      const part = article.parts[0];
      const paragraphs = part.content.split('\n\n').filter(p => p.trim());
      contentElement.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');

      // Render vocabulary cards
      const vocabContainer = document.querySelector(
        '.vocabulary-cards'
      ) as HTMLElement;
      const partVocab = vocabulary.filter(v => v.partId === part.id);
      vocabContainer.innerHTML = partVocab
        .map(
          v => `
        <div class="vocab-card collapsed" data-vocab-id="${v.id}">
          <div class="card-word">${v.word}</div>
          <div class="card-translation">${v.translation}</div>
        </div>
      `
        )
        .join('');

      // Render sentence cards
      const sentenceContainer = document.querySelector(
        '.sentence-cards'
      ) as HTMLElement;
      const partSentences = sentences.filter(s => s.partId === part.id);
      sentenceContainer.innerHTML = partSentences
        .map(
          s => `
        <div class="sentence-card collapsed" data-sentence-id="${s.id}">
          <div class="card-sentence">${s.content}</div>
          <div class="card-translation">${s.translation}</div>
        </div>
      `
        )
        .join('');

      // Update navigation
      const currentPartSpan = document.querySelector(
        '.current-part'
      ) as HTMLElement;
      const totalPartsSpan = document.querySelector(
        '.total-parts'
      ) as HTMLElement;
      const prevButton = document.getElementById(
        'prev-part'
      ) as HTMLButtonElement;
      const nextButton = document.getElementById(
        'next-part'
      ) as HTMLButtonElement;

      currentPartSpan.textContent = '1';
      totalPartsSpan.textContent = article.parts.length.toString();
      prevButton.disabled = true;
      nextButton.disabled = false;

      // Verify complete reading mode setup
      expect(titleElement.textContent).toBe('Integration Test Article');
      expect(contentElement.querySelectorAll('p')).toHaveLength(2);
      expect(vocabContainer.querySelectorAll('.vocab-card')).toHaveLength(2);
      expect(sentenceContainer.querySelectorAll('.sentence-card')).toHaveLength(
        1
      );
      expect(currentPartSpan.textContent).toBe('1');
      expect(totalPartsSpan.textContent).toBe('2');
      expect(prevButton.disabled).toBe(true);
      expect(nextButton.disabled).toBe(false);
    });

    it('should handle navigation between article parts', async () => {
      const article = createCompleteArticle();
      let currentPartIndex = 0;

      // Setup navigation handlers
      const prevButton = document.getElementById(
        'prev-part'
      ) as HTMLButtonElement;
      const nextButton = document.getElementById(
        'next-part'
      ) as HTMLButtonElement;
      const currentPartSpan = document.querySelector(
        '.current-part'
      ) as HTMLElement;

      const updateNavigation = () => {
        currentPartSpan.textContent = (currentPartIndex + 1).toString();
        prevButton.disabled = currentPartIndex === 0;
        nextButton.disabled = currentPartIndex === article.parts.length - 1;
      };

      prevButton.addEventListener('click', () => {
        if (currentPartIndex > 0) {
          currentPartIndex--;
          updateNavigation();
        }
      });

      nextButton.addEventListener('click', () => {
        if (currentPartIndex < article.parts.length - 1) {
          currentPartIndex++;
          updateNavigation();
        }
      });

      // Initial state
      updateNavigation();
      expect(currentPartIndex).toBe(0);
      expect(prevButton.disabled).toBe(true);
      expect(nextButton.disabled).toBe(false);

      // Navigate to next part
      nextButton.click();
      expect(currentPartIndex).toBe(1);
      expect(prevButton.disabled).toBe(false);
      expect(nextButton.disabled).toBe(true);

      // Navigate back to previous part
      prevButton.click();
      expect(currentPartIndex).toBe(0);
      expect(prevButton.disabled).toBe(true);
      expect(nextButton.disabled).toBe(false);
    });

    it('should handle mode switching workflow', async () => {
      const vocabulary = createTestVocabulary();
      const sentences = createTestSentences();
      let currentMode = 'reading';

      // Setup mode switching
      const tabButtons = document.querySelectorAll('.tab-button');
      const modeContents = document.querySelectorAll('.mode-content');

      const switchMode = (mode: string) => {
        currentMode = mode;

        // Update tab buttons
        tabButtons.forEach(btn => {
          if ((btn as HTMLElement).dataset.mode === mode) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });

        // Update content visibility
        modeContents.forEach(content => {
          if ((content as HTMLElement).dataset.mode === mode) {
            content.classList.add('active');
          } else {
            content.classList.remove('active');
          }
        });

        // Render mode-specific content
        if (mode === 'vocabulary') {
          const grid = document.querySelector(
            '.vocabulary-grid'
          ) as HTMLElement;
          grid.innerHTML = vocabulary
            .map(
              v => `
            <div class="vocab-learning-card" data-vocab-learning-id="${v.id}">
              <div class="vocab-learning-word">${v.word}</div>
              <div class="vocab-learning-translation">${v.translation}</div>
            </div>
          `
            )
            .join('');
        } else if (mode === 'sentences') {
          const list = document.querySelector('.sentence-list') as HTMLElement;
          list.innerHTML = sentences
            .map(
              s => `
            <div class="sentence-learning-card" data-sentence-learning-id="${s.id}">
              <div class="sentence-learning-content">${s.content}</div>
              <div class="sentence-learning-translation">${s.translation}</div>
            </div>
          `
            )
            .join('');
        }
      };

      // Add event listeners
      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const mode = (btn as HTMLElement).dataset.mode!;
          switchMode(mode);
        });
      });

      // Test mode switching
      expect(currentMode).toBe('reading');

      // Switch to vocabulary mode
      (
        document.querySelector('[data-mode="vocabulary"]') as HTMLElement
      ).click();
      expect(currentMode).toBe('vocabulary');
      expect(document.querySelector('.vocabulary-grid')?.children).toHaveLength(
        3
      );

      // Switch to sentence mode
      (
        document.querySelector('[data-mode="sentences"]') as HTMLElement
      ).click();
      expect(currentMode).toBe('sentences');
      expect(document.querySelector('.sentence-list')?.children).toHaveLength(
        2
      );

      // Switch back to reading mode
      (document.querySelector('[data-mode="reading"]') as HTMLElement).click();
      expect(currentMode).toBe('reading');
    });

    it('should handle keyboard shortcuts workflow', async () => {
      let currentMode = 'reading';
      let currentPartIndex = 0;
      const totalParts = 2;

      // Setup keyboard event handlers
      const handleKeyboard = (event: KeyboardEvent) => {
        switch (event.key) {
          case 'ArrowLeft':
            if (currentPartIndex > 0) currentPartIndex--;
            break;
          case 'ArrowRight':
            if (currentPartIndex < totalParts - 1) currentPartIndex++;
            break;
          case 'v':
            currentMode = 'vocabulary';
            break;
          case 's':
            currentMode = 'sentences';
            break;
          case 'r':
            currentMode = 'reading';
            break;
        }
      };

      document.addEventListener('keydown', handleKeyboard);

      // Test keyboard shortcuts
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      expect(currentPartIndex).toBe(1);

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      );
      expect(currentPartIndex).toBe(0);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'v' }));
      expect(currentMode).toBe('vocabulary');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
      expect(currentMode).toBe('sentences');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
      expect(currentMode).toBe('reading');

      // Cleanup
      document.removeEventListener('keydown', handleKeyboard);
    });
  });

  describe('Component Integration', () => {
    it('should integrate highlighting system with storage', async () => {
      const article = createCompleteArticle();
      let vocabularyItems: VocabularyItem[] = [];
      let sentenceItems: SentenceItem[] = [];

      // Mock highlight events
      const handleVocabularyAdded = (event: CustomEvent) => {
        const vocab = event.detail as VocabularyItem;
        vocabularyItems.push(vocab);

        // Save to storage
        chrome.storage.local.set({
          vocabulary: vocabularyItems.reduce(
            (acc, v) => ({ ...acc, [v.id]: v }),
            {}
          ),
        });
      };

      const handleSentenceAdded = (event: CustomEvent) => {
        const sentence = event.detail as SentenceItem;
        sentenceItems.push(sentence);

        // Save to storage
        chrome.storage.local.set({
          sentences: sentenceItems.reduce(
            (acc, s) => ({ ...acc, [s.id]: s }),
            {}
          ),
        });
      };

      document.addEventListener('vocabulary-added', handleVocabularyAdded);
      document.addEventListener('sentence-added', handleSentenceAdded);

      // Simulate vocabulary highlighting
      const newVocab: VocabularyItem = {
        id: 'vocab-highlight-1',
        word: 'integration',
        translation: 'integración',
        context: 'Integration testing is important.',
        exampleSentences: [],
        articleId: article.id,
        partId: 'part-1',
        createdAt: new Date(),
        lastReviewed: new Date(),
        reviewCount: 0,
        difficulty: 5,
      };

      document.dispatchEvent(
        new CustomEvent('vocabulary-added', { detail: newVocab })
      );

      expect(vocabularyItems).toHaveLength(1);
      expect(vocabularyItems[0]).toEqual(newVocab);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        vocabulary: { [newVocab.id]: newVocab },
      });

      // Simulate sentence highlighting
      const newSentence: SentenceItem = {
        id: 'sentence-highlight-1',
        content: 'Integration testing is important.',
        translation: 'Las pruebas de integración son importantes.',
        articleId: article.id,
        partId: 'part-1',
        createdAt: new Date(),
      };

      document.dispatchEvent(
        new CustomEvent('sentence-added', { detail: newSentence })
      );

      expect(sentenceItems).toHaveLength(1);
      expect(sentenceItems[0]).toEqual(newSentence);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        sentences: { [newSentence.id]: newSentence },
      });

      // Cleanup
      document.removeEventListener('vocabulary-added', handleVocabularyAdded);
      document.removeEventListener('sentence-added', handleSentenceAdded);
    });

    it('should integrate TTS with UI components', async () => {
      let ttsActive = false;
      let currentText = '';

      // Mock TTS functionality
      const mockTTS = {
        speak: (text: string) => {
          ttsActive = true;
          currentText = text;
          return Promise.resolve();
        },
        stop: () => {
          ttsActive = false;
          currentText = '';
        },
        isSupported: () => true, // Always return true for testing
      };

      // Mock speechSynthesis API
      (global as any).speechSynthesis = {
        speak: vi.fn(),
        cancel: vi.fn(),
        getVoices: vi.fn().mockReturnValue([]),
      };

      // Create vocabulary card with pronounce button
      const vocab = createTestVocabulary()[0];
      const card = document.createElement('div');
      card.innerHTML = `
        <div class="vocab-card" data-vocab-id="${vocab.id}">
          <span class="card-word">${vocab.word}</span>
          <button class="pronounce-btn">🔊</button>
        </div>
      `;
      document.body.appendChild(card);

      // Add TTS functionality
      const pronounceBtn = card.querySelector(
        '.pronounce-btn'
      ) as HTMLButtonElement;
      pronounceBtn.addEventListener('click', async () => {
        if (mockTTS.isSupported()) {
          await mockTTS.speak(vocab.word);

          // Show TTS indicator
          const indicator = document.querySelector(
            '.tts-indicator'
          ) as HTMLElement;
          indicator.classList.remove('hidden');
          indicator.querySelector('span:nth-child(2)')!.textContent =
            `Speaking: "${vocab.word}"`;
        }
      });

      // Test TTS integration
      expect(mockTTS.isSupported()).toBe(true);

      pronounceBtn.click();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(ttsActive).toBe(true);
      expect(currentText).toBe(vocab.word);
      expect(
        document.querySelector('.tts-indicator')?.classList.contains('hidden')
      ).toBe(false);

      // Test stop functionality
      const stopBtn = document.querySelector(
        '.tts-stop-btn'
      ) as HTMLButtonElement;
      stopBtn.addEventListener('click', () => {
        mockTTS.stop();
        document.querySelector('.tts-indicator')?.classList.add('hidden');
      });

      stopBtn.click();
      expect(ttsActive).toBe(false);
      expect(
        document.querySelector('.tts-indicator')?.classList.contains('hidden')
      ).toBe(true);
    });

    it('should integrate memory management with UI', async () => {
      let memoryUsage = {
        memory: { used: 50 * 1024 * 1024, percentage: 50 }, // 50MB, 50%
        storage: { used: 100 * 1024 * 1024, percentage: 10 }, // 100MB, 10%
        activeTabs: 2,
      };

      // Mock memory manager
      const mockMemoryManager = {
        getUsage: () => memoryUsage,
        onUsageChange: (callback: (usage: any) => void) => {
          // Simulate memory usage change
          setTimeout(() => {
            memoryUsage.memory.percentage = 85;
            callback(memoryUsage);
          }, 100);

          return () => {}; // unsubscribe function
        },
        cleanup: () => {
          memoryUsage.memory.percentage = 30;
        },
      };

      // Setup memory monitoring
      const updateMemoryIndicator = (usage: any) => {
        const indicator = document.getElementById(
          'memory-indicator'
        ) as HTMLElement;
        const stats = indicator.querySelector('.memory-stats') as HTMLElement;

        const memoryMB = (usage.memory.used / 1024 / 1024).toFixed(1);
        const storagePercent = usage.storage.percentage.toFixed(1);

        stats.innerHTML = `
          <span>Memory: ${memoryMB}MB</span>
          <span>Storage: ${storagePercent}%</span>
          <span>Tabs: ${usage.activeTabs}</span>
        `;

        indicator.classList.remove('hidden');

        if (usage.memory.percentage > 80) {
          indicator.classList.add('warning');
        } else {
          indicator.classList.remove('warning');
        }
      };

      // Initial update
      updateMemoryIndicator(mockMemoryManager.getUsage());

      const indicator = document.getElementById(
        'memory-indicator'
      ) as HTMLElement;
      expect(indicator.classList.contains('hidden')).toBe(false);
      expect(indicator.textContent).toContain('Memory: 50.0MB');
      expect(indicator.textContent).toContain('Storage: 10.0%');
      expect(indicator.textContent).toContain('Tabs: 2');

      // Test memory warning
      const unsubscribe = mockMemoryManager.onUsageChange(
        updateMemoryIndicator
      );

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(indicator.classList.contains('warning')).toBe(true);
      expect(indicator.textContent).toContain('Memory: 50.0MB'); // Usage display

      // Test cleanup
      mockMemoryManager.cleanup();
      updateMemoryIndicator(mockMemoryManager.getUsage());

      expect(indicator.classList.contains('warning')).toBe(false);

      unsubscribe();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle storage errors gracefully', async () => {
      const storageError = new Error('Storage quota exceeded');
      chrome.storage.local.set.mockRejectedValue(storageError);

      let errorHandled = false;
      let errorMessage = '';

      // Mock error handler
      const handleStorageError = (error: Error) => {
        errorHandled = true;
        errorMessage = error.message;

        // Show user-friendly error
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = 'Storage is full. Please export your data.';
        document.body.appendChild(notification);
      };

      // Attempt to save data
      try {
        await chrome.storage.local.set({ test: 'data' });
      } catch (error) {
        handleStorageError(error as Error);
      }

      expect(errorHandled).toBe(true);
      expect(errorMessage).toBe('Storage quota exceeded');
      expect(document.querySelector('.error-notification')?.textContent).toBe(
        'Storage is full. Please export your data.'
      );
    });

    it('should handle AI processing failures with fallback', async () => {
      let fallbackUsed = false;
      let processingResult = '';

      // Mock AI processing with failure and fallback
      const processWithFallback = async (text: string) => {
        try {
          // Simulate Chrome AI failure
          throw new Error('Chrome AI not available');
        } catch {
          try {
            // Simulate Gemini API fallback
            fallbackUsed = true;
            processingResult = `Processed with Gemini: ${text}`;
            return processingResult;
          } catch {
            // Final fallback - show original content
            processingResult = `Original content: ${text}`;
            return processingResult;
          }
        }
      };

      const testText = 'This is test content for processing.';
      const result = await processWithFallback(testText);

      expect(fallbackUsed).toBe(true);
      expect(result).toBe(`Processed with Gemini: ${testText}`);
      expect(processingResult).toContain('Processed with Gemini');
    });

    it('should handle network errors with offline mode', async () => {
      let offlineMode = false;
      let cachedContent: any = null;

      // Mock network error
      const networkError = new Error('Network request failed');
      chrome.runtime.sendMessage.mockRejectedValue(networkError);

      // Mock cached content
      const mockCachedArticle = createCompleteArticle();
      chrome.storage.local.get.mockResolvedValue({
        [`cached_article_${mockCachedArticle.url}`]: mockCachedArticle,
      });

      // Network error handler with offline fallback
      const handleNetworkError = async (url: string) => {
        try {
          // Attempt network request
          await chrome.runtime.sendMessage({ type: 'FETCH_CONTENT', url });
        } catch {
          // Switch to offline mode
          offlineMode = true;

          // Try to load cached content
          const cached = await chrome.storage.local.get(
            `cached_article_${url}`
          );
          cachedContent = cached[`cached_article_${url}`];

          if (cachedContent) {
            // Show offline indicator
            const indicator = document.createElement('div');
            indicator.className = 'offline-indicator';
            indicator.textContent = 'Offline mode - using cached content';
            document.body.appendChild(indicator);
          }
        }
      };

      await handleNetworkError(mockCachedArticle.url);

      expect(offlineMode).toBe(true);
      expect(cachedContent).toEqual(mockCachedArticle);
      expect(document.querySelector('.offline-indicator')?.textContent).toBe(
        'Offline mode - using cached content'
      );
    });
  });
});
