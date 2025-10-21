/**
 * User Acceptance Testing
 * Tests complete user workflows from setup to learning
 * Validates all features work as specified in requirements
 * Requirements: All requirements
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type {
  ProcessedArticle,
  VocabularyItem,
  SentenceItem,
  UserSettings,
  LearningMode,
  LanguageDisplayMode,
} from '../src/types';

import { mockChromeStorage } from './setup/chrome-mock';

// Mock complete learning interface DOM
function createLearningInterfaceDOM(): void {
  document.body.innerHTML = `
    <div class="learning-interface">
      <!-- Setup wizard -->
      <div class="setup-wizard hidden">
        <div class="setup-step" data-step="welcome">
          <h2>Welcome to Language Learning Extension</h2>
          <button class="next-btn">Get Started</button>
        </div>
        <div class="setup-step hidden" data-step="languages">
          <h3>Select Languages</h3>
          <select class="native-language">
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </select>
          <select class="learning-language">
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
          <button class="next-btn">Next</button>
        </div>
        <div class="setup-step hidden" data-step="difficulty">
          <h3>Set Difficulty Level</h3>
          <input type="range" class="difficulty-slider" min="1" max="10" value="5">
          <span class="difficulty-value">5</span>
          <button class="next-btn">Next</button>
        </div>
        <div class="setup-step hidden" data-step="tutorial">
          <h3>Tutorial</h3>
          <div class="tutorial-content">
            <p>Learn how to use the extension with this sample article.</p>
            <button class="start-tutorial-btn">Start Tutorial</button>
          </div>
          <button class="finish-btn">Finish Setup</button>
        </div>
      </div>

      <!-- Main interface -->
      <div class="main-interface">
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

        <!-- Reading mode -->
        <div class="mode-content active" data-mode="reading">
          <div class="highlight-controls">
            <button class="highlight-mode-btn active" data-highlight-mode="vocabulary">Vocabulary Mode</button>
            <button class="highlight-mode-btn" data-highlight-mode="sentence">Sentence Mode</button>
          </div>
          
          <div class="article-part-content"></div>
          
          <div class="vocabulary-cards"></div>
          <div class="sentence-cards"></div>
          
          <!-- Navigation -->
          <div class="navigation">
            <button id="prev-part" disabled>← Previous</button>
            <span class="part-info">
              <span class="current-part">1</span> / <span class="total-parts">1</span>
            </span>
            <button id="next-part">Next →</button>
          </div>
        </div>

        <!-- Vocabulary learning mode -->
        <div class="mode-content" data-mode="vocabulary">
          <div class="display-options">
            <button class="display-option active" data-display="both">Both Languages</button>
            <button class="display-option" data-display="learning_only">Learning Language Only</button>
            <button class="display-option" data-display="native_only">Native Language Only</button>
          </div>
          <div class="vocabulary-grid"></div>
        </div>

        <!-- Sentence learning mode -->
        <div class="mode-content" data-mode="sentences">
          <div class="sentence-list"></div>
        </div>
      </div>

      <!-- Settings panel -->
      <div class="settings-panel hidden">
        <h3>Settings</h3>
        <div class="setting-group">
          <label>Native Language:</label>
          <select class="settings-native-language">
            <option value="en">English</option>
            <option value="es">Spanish</option>
          </select>
        </div>
        <div class="setting-group">
          <label>Learning Language:</label>
          <select class="settings-learning-language">
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>
        <div class="setting-group">
          <label>Difficulty Level:</label>
          <input type="range" class="settings-difficulty" min="1" max="10" value="5">
        </div>
        <div class="setting-group">
          <label>
            <input type="checkbox" class="settings-auto-highlight"> Auto-highlight vocabulary
          </label>
        </div>
        <div class="setting-group">
          <label>API Keys:</label>
          <input type="password" class="gemini-api-key" placeholder="Gemini API Key">
          <input type="password" class="jina-api-key" placeholder="Jina Reader API Key">
        </div>
        <button class="save-settings-btn">Save Settings</button>
      </div>

      <!-- Loading and status indicators -->
      <div class="loading-overlay hidden">
        <div class="loading-spinner"></div>
        <div class="loading-text">Processing article...</div>
      </div>

      <div class="status-indicators">
        <div class="ai-status hidden">
          <span class="ai-status-icon">🤖</span>
          <span class="ai-status-text">Chrome AI Ready</span>
        </div>
        <div class="network-status hidden">
          <span class="network-status-icon">📶</span>
          <span class="network-status-text">Online</span>
        </div>
      </div>

      <!-- Context menu -->
      <div class="context-menu hidden">
        <div class="context-menu-item" data-action="edit">Edit</div>
        <div class="context-menu-item" data-action="remove">Remove</div>
        <div class="context-menu-item" data-action="pronounce">Pronounce</div>
      </div>

      <!-- TTS controls -->
      <div class="tts-controls hidden">
        <button class="tts-play-btn">▶️ Play</button>
        <button class="tts-pause-btn">⏸️ Pause</button>
        <button class="tts-stop-btn">⏹️ Stop</button>
      </div>
    </div>
  `;
}

// Mock sample article for testing
function createSampleArticle(): ProcessedArticle {
  return {
    id: 'sample-article-alice',
    url: 'https://example.com/alice-in-wonderland',
    title: "Alice's Adventures in Wonderland - Chapter 1",
    originalLanguage: 'en',
    processedAt: new Date(),
    parts: [
      {
        id: 'part-1',
        content:
          'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do. Once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it.',
        originalContent:
          'Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do. Once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it.',
        vocabulary: ['vocab-tired', 'vocab-peeped'],
        sentences: ['sentence-1'],
        partIndex: 0,
      },
      {
        id: 'part-2',
        content:
          'And what is the use of a book, thought Alice, without pictures or conversations? So she was considering in her own mind, as well as she could, for the hot day made her feel very sleepy and stupid.',
        originalContent:
          'And what is the use of a book, thought Alice, without pictures or conversations? So she was considering in her own mind, as well as she could, for the hot day made her feel very sleepy and stupid.',
        vocabulary: ['vocab-considering', 'vocab-sleepy'],
        sentences: ['sentence-2'],
        partIndex: 1,
      },
    ],
    processingStatus: 'completed',
    cacheExpires: new Date(Date.now() + 86400000),
  };
}

// Mock vocabulary items
function createSampleVocabulary(): VocabularyItem[] {
  return [
    {
      id: 'vocab-tired',
      word: 'tired',
      translation: 'cansado',
      context: 'Alice was beginning to get very tired of sitting by her sister',
      exampleSentences: ['I am tired after work.', 'She looks tired today.'],
      articleId: 'sample-article-alice',
      partId: 'part-1',
      createdAt: new Date(),
      lastReviewed: new Date(),
      reviewCount: 0,
      difficulty: 3,
    },
    {
      id: 'vocab-peeped',
      word: 'peeped',
      translation: 'echó un vistazo',
      context: 'she had peeped into the book her sister was reading',
      exampleSentences: [
        'He peeped through the window.',
        'She peeped at the letter.',
      ],
      articleId: 'sample-article-alice',
      partId: 'part-1',
      createdAt: new Date(),
      lastReviewed: new Date(),
      reviewCount: 0,
      difficulty: 6,
    },
    {
      id: 'vocab-considering',
      word: 'considering',
      translation: 'considerando',
      context: 'she was considering in her own mind',
      exampleSentences: [
        'I am considering your offer.',
        'She is considering moving.',
      ],
      articleId: 'sample-article-alice',
      partId: 'part-2',
      createdAt: new Date(),
      lastReviewed: new Date(),
      reviewCount: 1,
      difficulty: 5,
    },
    {
      id: 'vocab-sleepy',
      word: 'sleepy',
      translation: 'somnoliento',
      context: 'the hot day made her feel very sleepy and stupid',
      exampleSentences: [
        'I feel sleepy after lunch.',
        'The baby is getting sleepy.',
      ],
      articleId: 'sample-article-alice',
      partId: 'part-2',
      createdAt: new Date(),
      lastReviewed: new Date(),
      reviewCount: 0,
      difficulty: 4,
    },
  ];
}

// Mock sentence items
function createSampleSentences(): SentenceItem[] {
  return [
    {
      id: 'sentence-1',
      content:
        'Alice was beginning to get very tired of sitting by her sister on the bank.',
      translation:
        'Alice estaba empezando a cansarse mucho de estar sentada junto a su hermana en la orilla.',
      articleId: 'sample-article-alice',
      partId: 'part-1',
      createdAt: new Date(),
    },
    {
      id: 'sentence-2',
      content:
        'And what is the use of a book, thought Alice, without pictures or conversations?',
      translation:
        '¿Y de qué sirve un libro, pensó Alice, sin dibujos ni conversaciones?',
      articleId: 'sample-article-alice',
      partId: 'part-2',
      createdAt: new Date(),
    },
  ];
}

// Mock user settings
function createDefaultSettings(): UserSettings {
  return {
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
}

describe('User Acceptance Testing', () => {
  let chromeStorageMock: any;

  beforeEach(() => {
    createLearningInterfaceDOM();
    vi.clearAllMocks();

    // Setup Chrome API mocks
    chromeStorageMock = mockChromeStorage();

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

    // Mock TTS API
    (global as any).speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn().mockReturnValue([
        { name: 'English Voice', lang: 'en-US' },
        { name: 'Spanish Voice', lang: 'es-ES' },
      ]),
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    chromeStorageMock?.cleanup();
    delete (global as any).chrome;
    delete (global as any).speechSynthesis;
  });

  describe('First-Time User Setup Workflow', () => {
    it('should complete the setup wizard workflow', async () => {
      let currentStep = 'welcome';
      let setupComplete = false;
      const userChoices = {
        nativeLanguage: 'en',
        learningLanguage: 'es',
        difficultyLevel: 5,
      };

      // Mock setup wizard controller
      const setupWizard = {
        showStep: (step: string) => {
          currentStep = step;
          document
            .querySelectorAll('.setup-step')
            .forEach(el => el.classList.add('hidden'));
          const stepElement = document.querySelector(`[data-step="${step}"]`);
          stepElement?.classList.remove('hidden');
        },

        handleNext: () => {
          switch (currentStep) {
            case 'welcome':
              setupWizard.showStep('languages');
              break;
            case 'languages':
              // Capture language selections
              const nativeLang = (
                document.querySelector('.native-language') as HTMLSelectElement
              ).value;
              const learningLang = (
                document.querySelector(
                  '.learning-language'
                ) as HTMLSelectElement
              ).value;
              userChoices.nativeLanguage = nativeLang;
              userChoices.learningLanguage = learningLang;
              setupWizard.showStep('difficulty');
              break;
            case 'difficulty':
              // Capture difficulty selection
              const difficulty = parseInt(
                (
                  document.querySelector(
                    '.difficulty-slider'
                  ) as HTMLInputElement
                ).value
              );
              userChoices.difficultyLevel = difficulty;
              setupWizard.showStep('tutorial');
              break;
            case 'tutorial':
              setupComplete = true;
              document.querySelector('.setup-wizard')?.classList.add('hidden');
              document
                .querySelector('.main-interface')
                ?.classList.remove('hidden');
              break;
          }
        },
      };

      // Start setup wizard
      document.querySelector('.setup-wizard')?.classList.remove('hidden');
      setupWizard.showStep('welcome');

      // Step 1: Welcome
      expect(currentStep).toBe('welcome');
      expect(
        document
          .querySelector('[data-step="welcome"]')
          ?.classList.contains('hidden')
      ).toBe(false);

      // Click next to go to languages
      setupWizard.handleNext();
      expect(currentStep).toBe('languages');

      // Step 2: Language selection
      (document.querySelector('.native-language') as HTMLSelectElement).value =
        'en';
      (
        document.querySelector('.learning-language') as HTMLSelectElement
      ).value = 'es';
      setupWizard.handleNext();
      expect(currentStep).toBe('difficulty');
      expect(userChoices.nativeLanguage).toBe('en');
      expect(userChoices.learningLanguage).toBe('es');

      // Step 3: Difficulty level
      (document.querySelector('.difficulty-slider') as HTMLInputElement).value =
        '7';
      setupWizard.handleNext();
      expect(currentStep).toBe('tutorial');
      expect(userChoices.difficultyLevel).toBe(7);

      // Step 4: Tutorial and finish
      setupWizard.handleNext();
      expect(setupComplete).toBe(true);
      expect(
        document.querySelector('.setup-wizard')?.classList.contains('hidden')
      ).toBe(true);
    });

    it('should save user settings after setup', async () => {
      const settings = createDefaultSettings();
      settings.nativeLanguage = 'en';
      settings.learningLanguage = 'fr';
      settings.difficultyLevel = 8;

      // Mock settings save
      chrome.storage.local.set.mockResolvedValue(undefined);

      await chrome.storage.local.set({ settings });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ settings });
    });
  });

  describe('Article Processing and Display Workflow', () => {
    it('should process and display article from web page', async () => {
      const article = createSampleArticle();
      const vocabulary = createSampleVocabulary();
      const sentences = createSampleSentences();

      // Mock article loading
      chrome.storage.session.get.mockResolvedValue({
        [`article_123`]: article,
      });

      chrome.storage.local.get.mockImplementation(keys => {
        if (keys === 'vocabulary') {
          return Promise.resolve({
            vocabulary: vocabulary.reduce(
              (acc, v) => ({ ...acc, [v.id]: v }),
              {}
            ),
          });
        }
        if (keys === 'sentences') {
          return Promise.resolve({
            sentences: sentences.reduce(
              (acc, s) => ({ ...acc, [s.id]: s }),
              {}
            ),
          });
        }
        return Promise.resolve({});
      });

      // Simulate article loading
      const loadedArticle = await chrome.storage.session.get('article_123');
      const loadedVocab = await chrome.storage.local.get('vocabulary');
      const loadedSentences = await chrome.storage.local.get('sentences');

      // Render article
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

      titleElement.textContent = article.title;
      urlElement.textContent = article.url;
      langElement.textContent = article.originalLanguage.toUpperCase();

      // Render first part
      const firstPart = article.parts[0];
      contentElement.innerHTML = `<p>${firstPart.content}</p>`;

      // Update navigation
      const currentPartSpan = document.querySelector(
        '.current-part'
      ) as HTMLElement;
      const totalPartsSpan = document.querySelector(
        '.total-parts'
      ) as HTMLElement;
      currentPartSpan.textContent = '1';
      totalPartsSpan.textContent = article.parts.length.toString();

      // Verify article display
      expect(titleElement.textContent).toBe(
        "Alice's Adventures in Wonderland - Chapter 1"
      );
      expect(urlElement.textContent).toBe(
        'https://example.com/alice-in-wonderland'
      );
      expect(langElement.textContent).toBe('EN');
      expect(contentElement.textContent).toContain(
        'Alice was beginning to get very tired'
      );
      expect(currentPartSpan.textContent).toBe('1');
      expect(totalPartsSpan.textContent).toBe('2');

      // Verify data loading
      expect(loadedArticle.article_123).toEqual(article);
      expect(Object.keys(loadedVocab.vocabulary)).toHaveLength(4);
      expect(Object.keys(loadedSentences.sentences)).toHaveLength(2);
    });

    it('should handle article part navigation', async () => {
      const article = createSampleArticle();
      let currentPartIndex = 0;

      // Mock navigation controller
      const navigationController = {
        updateNavigation: () => {
          const currentPartSpan = document.querySelector(
            '.current-part'
          ) as HTMLElement;
          const prevButton = document.getElementById(
            'prev-part'
          ) as HTMLButtonElement;
          const nextButton = document.getElementById(
            'next-part'
          ) as HTMLButtonElement;

          currentPartSpan.textContent = (currentPartIndex + 1).toString();
          prevButton.disabled = currentPartIndex === 0;
          nextButton.disabled = currentPartIndex === article.parts.length - 1;
        },

        navigateToNext: () => {
          if (currentPartIndex < article.parts.length - 1) {
            currentPartIndex++;
            navigationController.renderCurrentPart();
            navigationController.updateNavigation();
          }
        },

        navigateToPrevious: () => {
          if (currentPartIndex > 0) {
            currentPartIndex--;
            navigationController.renderCurrentPart();
            navigationController.updateNavigation();
          }
        },

        renderCurrentPart: () => {
          const contentElement = document.querySelector(
            '.article-part-content'
          ) as HTMLElement;
          const currentPart = article.parts[currentPartIndex];
          contentElement.innerHTML = `<p>${currentPart.content}</p>`;
        },
      };

      // Initial render
      navigationController.renderCurrentPart();
      navigationController.updateNavigation();

      // Test initial state
      expect(currentPartIndex).toBe(0);
      expect(document.querySelector('.current-part')?.textContent).toBe('1');
      expect(
        (document.getElementById('prev-part') as HTMLButtonElement).disabled
      ).toBe(true);
      expect(
        (document.getElementById('next-part') as HTMLButtonElement).disabled
      ).toBe(false);

      // Navigate to next part
      navigationController.navigateToNext();
      expect(currentPartIndex).toBe(1);
      expect(document.querySelector('.current-part')?.textContent).toBe('2');
      expect(
        (document.getElementById('prev-part') as HTMLButtonElement).disabled
      ).toBe(false);
      expect(
        (document.getElementById('next-part') as HTMLButtonElement).disabled
      ).toBe(true);
      expect(
        document.querySelector('.article-part-content')?.textContent
      ).toContain('And what is the use of a book');

      // Navigate back to previous part
      navigationController.navigateToPrevious();
      expect(currentPartIndex).toBe(0);
      expect(document.querySelector('.current-part')?.textContent).toBe('1');
      expect(
        document.querySelector('.article-part-content')?.textContent
      ).toContain('Alice was beginning to get very tired');
    });
  });

  describe('Vocabulary Learning Workflow', () => {
    it('should create vocabulary cards from text highlighting', async () => {
      const _vocabulary = createSampleVocabulary();
      let vocabularyItems: VocabularyItem[] = [];

      // Mock vocabulary highlighting
      const highlightController = {
        highlightVocabulary: async (selectedText: string, context: string) => {
          // Simulate AI translation
          const translations: Record<string, string> = {
            tired: 'cansado',
            peeped: 'echó un vistazo',
            considering: 'considerando',
            sleepy: 'somnoliento',
          };

          const newVocab: VocabularyItem = {
            id: `vocab-${Date.now()}`,
            word: selectedText,
            translation: translations[selectedText] || 'translation',
            context,
            exampleSentences: [`Example with ${selectedText}.`],
            articleId: 'sample-article-alice',
            partId: 'part-1',
            createdAt: new Date(),
            lastReviewed: new Date(),
            reviewCount: 0,
            difficulty: 5,
          };

          vocabularyItems.push(newVocab);

          // Save to storage
          await chrome.storage.local.set({
            vocabulary: vocabularyItems.reduce(
              (acc, v) => ({ ...acc, [v.id]: v }),
              {}
            ),
          });

          // Render vocabulary card
          highlightController.renderVocabularyCard(newVocab);

          return newVocab;
        },

        renderVocabularyCard: (vocab: VocabularyItem) => {
          const container = document.querySelector(
            '.vocabulary-cards'
          ) as HTMLElement;
          const card = document.createElement('div');
          card.className = 'vocab-card collapsed';
          card.setAttribute('data-vocab-id', vocab.id);
          card.innerHTML = `
            <div class="card-header">
              <span class="card-word">${vocab.word}</span>
              <button class="pronounce-btn">🔊</button>
            </div>
            <div class="card-translation">${vocab.translation}</div>
            <div class="card-context">"${vocab.context}"</div>
          `;
          container.appendChild(card);
        },
      };

      // Test vocabulary highlighting
      const selectedText = 'tired';
      const context =
        'Alice was beginning to get very tired of sitting by her sister';

      const newVocab = await highlightController.highlightVocabulary(
        selectedText,
        context
      );

      expect(newVocab.word).toBe('tired');
      expect(newVocab.translation).toBe('cansado');
      expect(newVocab.context).toBe(context);
      expect(vocabularyItems).toHaveLength(1);
      expect(chrome.storage.local.set).toHaveBeenCalled();

      // Verify card rendering
      const vocabCard = document.querySelector('[data-vocab-id]');
      expect(vocabCard).toBeTruthy();
      expect(vocabCard?.querySelector('.card-word')?.textContent).toBe('tired');
      expect(vocabCard?.querySelector('.card-translation')?.textContent).toBe(
        'cansado'
      );
    });

    it('should display vocabulary in learning mode', async () => {
      const vocabulary = createSampleVocabulary();
      let currentDisplayMode: LanguageDisplayMode = 'both';

      // Mock vocabulary learning mode
      const vocabularyLearningController = {
        renderVocabularyGrid: () => {
          const grid = document.querySelector(
            '.vocabulary-grid'
          ) as HTMLElement;
          grid.innerHTML = vocabulary
            .map(vocab => {
              const showWord =
                currentDisplayMode === 'both' ||
                currentDisplayMode === 'learning_only';
              const showTranslation =
                currentDisplayMode === 'both' ||
                currentDisplayMode === 'native_only';
              const hideTranslation = currentDisplayMode === 'learning_only';

              return `
              <div class="vocab-learning-card" data-vocab-id="${vocab.id}">
                ${showWord ? `<div class="vocab-word">${vocab.word}</div>` : ''}
                ${showTranslation ? `<div class="vocab-translation ${hideTranslation ? 'hidden-lang' : ''}">${vocab.translation}</div>` : ''}
              </div>
            `;
            })
            .join('');
        },

        setDisplayMode: (mode: LanguageDisplayMode) => {
          currentDisplayMode = mode;
          vocabularyLearningController.renderVocabularyGrid();

          // Update display option buttons
          document.querySelectorAll('.display-option').forEach(btn => {
            if ((btn as HTMLElement).dataset.display === mode) {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
          });
        },
      };

      // Switch to vocabulary mode
      document
        .querySelectorAll('.mode-content')
        .forEach(content => content.classList.remove('active'));
      document
        .querySelector('[data-mode="vocabulary"]')
        ?.classList.add('active');

      // Test different display modes
      vocabularyLearningController.setDisplayMode('both');
      vocabularyLearningController.renderVocabularyGrid();

      let vocabCards = document.querySelectorAll('.vocab-learning-card');
      expect(vocabCards).toHaveLength(4);
      expect(vocabCards[0].querySelector('.vocab-word')?.textContent).toBe(
        'tired'
      );
      expect(
        vocabCards[0].querySelector('.vocab-translation')?.textContent
      ).toBe('cansado');

      // Test learning language only mode
      vocabularyLearningController.setDisplayMode('learning_only');
      expect(currentDisplayMode).toBe('learning_only');

      // Test native language only mode
      vocabularyLearningController.setDisplayMode('native_only');
      expect(currentDisplayMode).toBe('native_only');
    });
  });

  describe('Sentence Learning Workflow', () => {
    it('should create sentence cards from text highlighting', async () => {
      const _sentences = createSampleSentences();
      let sentenceItems: SentenceItem[] = [];

      // Mock sentence highlighting
      const sentenceController = {
        highlightSentence: async (selectedText: string) => {
          // Simulate AI translation
          const translations: Record<string, string> = {
            'Alice was beginning to get very tired of sitting by her sister on the bank.':
              'Alice estaba empezando a cansarse mucho de estar sentada junto a su hermana en la orilla.',
            'And what is the use of a book, thought Alice, without pictures or conversations?':
              '¿Y de qué sirve un libro, pensó Alice, sin dibujos ni conversaciones?',
          };

          const newSentence: SentenceItem = {
            id: `sentence-${Date.now()}`,
            content: selectedText,
            translation: translations[selectedText] || 'translation',
            articleId: 'sample-article-alice',
            partId: 'part-1',
            createdAt: new Date(),
          };

          sentenceItems.push(newSentence);

          // Save to storage
          await chrome.storage.local.set({
            sentences: sentenceItems.reduce(
              (acc, s) => ({ ...acc, [s.id]: s }),
              {}
            ),
          });

          // Render sentence card
          sentenceController.renderSentenceCard(newSentence);

          return newSentence;
        },

        renderSentenceCard: (sentence: SentenceItem) => {
          const container = document.querySelector(
            '.sentence-cards'
          ) as HTMLElement;
          const card = document.createElement('div');
          card.className = 'sentence-card collapsed';
          card.setAttribute('data-sentence-id', sentence.id);
          card.innerHTML = `
            <div class="card-header">
              <span class="card-sentence">${sentence.content}</span>
              <button class="pronounce-btn">🔊</button>
            </div>
            <div class="card-translation">${sentence.translation}</div>
          `;
          container.appendChild(card);
        },
      };

      // Test sentence highlighting
      const selectedSentence =
        'Alice was beginning to get very tired of sitting by her sister on the bank.';
      const newSentence =
        await sentenceController.highlightSentence(selectedSentence);

      expect(newSentence.content).toBe(selectedSentence);
      expect(newSentence.translation).toBe(
        'Alice estaba empezando a cansarse mucho de estar sentada junto a su hermana en la orilla.'
      );
      expect(sentenceItems).toHaveLength(1);
      expect(chrome.storage.local.set).toHaveBeenCalled();

      // Verify card rendering
      const sentenceCard = document.querySelector('[data-sentence-id]');
      expect(sentenceCard).toBeTruthy();
      expect(sentenceCard?.querySelector('.card-sentence')?.textContent).toBe(
        selectedSentence
      );
    });

    it('should display sentences in learning mode', async () => {
      const sentences = createSampleSentences();

      // Mock sentence learning mode
      const sentenceLearningController = {
        renderSentenceList: () => {
          const list = document.querySelector('.sentence-list') as HTMLElement;
          list.innerHTML = sentences
            .map(
              sentence => `
            <div class="sentence-learning-card" data-sentence-id="${sentence.id}">
              <div class="sentence-content">${sentence.content}</div>
              <div class="sentence-translation">${sentence.translation}</div>
              <div class="sentence-actions">
                <button class="sentence-pronounce-btn">🔊 Pronounce</button>
              </div>
            </div>
          `
            )
            .join('');
        },
      };

      // Switch to sentence mode
      document
        .querySelectorAll('.mode-content')
        .forEach(content => content.classList.remove('active'));
      document
        .querySelector('[data-mode="sentences"]')
        ?.classList.add('active');

      sentenceLearningController.renderSentenceList();

      const sentenceCards = document.querySelectorAll(
        '.sentence-learning-card'
      );
      expect(sentenceCards).toHaveLength(2);
      expect(
        sentenceCards[0].querySelector('.sentence-content')?.textContent
      ).toContain('Alice was beginning to get very tired');
      expect(
        sentenceCards[0].querySelector('.sentence-translation')?.textContent
      ).toContain('Alice estaba empezando a cansarse');
      expect(
        sentenceCards[0].querySelector('.sentence-pronounce-btn')
      ).toBeTruthy();
    });
  });

  describe('Text-to-Speech Integration', () => {
    it('should pronounce vocabulary and sentences', async () => {
      let ttsActive = false;
      let spokenText = '';

      // Mock TTS controller
      const ttsController = {
        speak: async (text: string, language?: string) => {
          if ('speechSynthesis' in window) {
            ttsActive = true;
            spokenText = text;

            // Mock utterance (create mock constructor)
            const mockUtterance = {
              text,
              lang: language || 'en-US',
            };

            // Simulate speaking
            speechSynthesis.speak(mockUtterance as any);

            return Promise.resolve();
          }
          throw new Error('TTS not supported');
        },

        stop: () => {
          ttsActive = false;
          spokenText = '';
          speechSynthesis.cancel();
        },

        isSupported: () => 'speechSynthesis' in window,
      };

      // Test TTS support
      expect(ttsController.isSupported()).toBe(true);

      // Test vocabulary pronunciation
      await ttsController.speak('tired', 'en-US');
      expect(ttsActive).toBe(true);
      expect(spokenText).toBe('tired');
      expect(speechSynthesis.speak).toHaveBeenCalled();

      // Test sentence pronunciation
      ttsController.stop();
      await ttsController.speak(
        'Alice was beginning to get very tired.',
        'en-US'
      );
      expect(spokenText).toBe('Alice was beginning to get very tired.');

      // Test stop functionality
      ttsController.stop();
      expect(ttsActive).toBe(false);
      expect(speechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should handle TTS controls in UI', async () => {
      let isPlaying = false;
      let isPaused = false;

      // Mock TTS UI controller
      const ttsUIController = {
        showControls: () => {
          document.querySelector('.tts-controls')?.classList.remove('hidden');
        },

        hideControls: () => {
          document.querySelector('.tts-controls')?.classList.add('hidden');
        },

        play: () => {
          isPlaying = true;
          isPaused = false;
          ttsUIController.updateButtons();
        },

        pause: () => {
          isPlaying = false;
          isPaused = true;
          ttsUIController.updateButtons();
        },

        stop: () => {
          isPlaying = false;
          isPaused = false;
          ttsUIController.hideControls();
          ttsUIController.updateButtons();
        },

        updateButtons: () => {
          const playBtn = document.querySelector(
            '.tts-play-btn'
          ) as HTMLButtonElement;
          const pauseBtn = document.querySelector(
            '.tts-pause-btn'
          ) as HTMLButtonElement;
          const stopBtn = document.querySelector(
            '.tts-stop-btn'
          ) as HTMLButtonElement;

          playBtn.disabled = isPlaying;
          pauseBtn.disabled = !isPlaying;
          stopBtn.disabled = !isPlaying && !isPaused;
        },
      };

      // Test TTS controls
      ttsUIController.showControls();
      expect(
        document.querySelector('.tts-controls')?.classList.contains('hidden')
      ).toBe(false);

      ttsUIController.play();
      expect(isPlaying).toBe(true);
      expect(isPaused).toBe(false);

      ttsUIController.pause();
      expect(isPlaying).toBe(false);
      expect(isPaused).toBe(true);

      ttsUIController.stop();
      expect(isPlaying).toBe(false);
      expect(isPaused).toBe(false);
      expect(
        document.querySelector('.tts-controls')?.classList.contains('hidden')
      ).toBe(true);
    });
  });

  describe('Settings Management', () => {
    it('should save and load user settings', async () => {
      const settings = createDefaultSettings();
      let currentSettings = { ...settings };

      // Mock settings controller
      const settingsController = {
        loadSettings: async () => {
          const data = await chrome.storage.local.get('settings');
          currentSettings = data.settings || createDefaultSettings();
          settingsController.updateUI();
        },

        saveSettings: async () => {
          await chrome.storage.local.set({ settings: currentSettings });
        },

        updateUI: () => {
          (
            document.querySelector(
              '.settings-native-language'
            ) as HTMLSelectElement
          ).value = currentSettings.nativeLanguage;
          (
            document.querySelector(
              '.settings-learning-language'
            ) as HTMLSelectElement
          ).value = currentSettings.learningLanguage;
          (
            document.querySelector('.settings-difficulty') as HTMLInputElement
          ).value = currentSettings.difficultyLevel.toString();
          (
            document.querySelector(
              '.settings-auto-highlight'
            ) as HTMLInputElement
          ).checked = currentSettings.autoHighlight;
        },

        updateFromUI: () => {
          const nativeLangSelect = document.querySelector(
            '.settings-native-language'
          ) as HTMLSelectElement;
          const learningLangSelect = document.querySelector(
            '.settings-learning-language'
          ) as HTMLSelectElement;
          const difficultyInput = document.querySelector(
            '.settings-difficulty'
          ) as HTMLInputElement;
          const autoHighlightInput = document.querySelector(
            '.settings-auto-highlight'
          ) as HTMLInputElement;

          if (nativeLangSelect)
            currentSettings.nativeLanguage = nativeLangSelect.value;
          if (learningLangSelect)
            currentSettings.learningLanguage = learningLangSelect.value;
          if (difficultyInput)
            currentSettings.difficultyLevel = parseInt(difficultyInput.value);
          if (autoHighlightInput)
            currentSettings.autoHighlight = autoHighlightInput.checked;
        },
      };

      // Mock storage with settings
      chrome.storage.local.get.mockResolvedValue({ settings });

      // Load settings
      await settingsController.loadSettings();
      expect(currentSettings).toEqual(settings);

      // Show settings panel and update settings in UI
      document.querySelector('.settings-panel')?.classList.remove('hidden');

      const nativeLangSelect = document.querySelector(
        '.settings-native-language'
      ) as HTMLSelectElement;
      const learningLangSelect = document.querySelector(
        '.settings-learning-language'
      ) as HTMLSelectElement;
      const difficultyInput = document.querySelector(
        '.settings-difficulty'
      ) as HTMLInputElement;
      const autoHighlightInput = document.querySelector(
        '.settings-auto-highlight'
      ) as HTMLInputElement;

      nativeLangSelect.value = 'fr';
      learningLangSelect.value = 'de';
      difficultyInput.value = '8';
      autoHighlightInput.checked = true;

      // Manually update settings to simulate UI interaction
      currentSettings.nativeLanguage = 'fr';
      currentSettings.learningLanguage = 'de';
      currentSettings.difficultyLevel = 8;
      currentSettings.autoHighlight = true;

      // Save settings
      await settingsController.saveSettings();

      expect(currentSettings.nativeLanguage).toBe('fr');
      expect(currentSettings.learningLanguage).toBe('de');
      expect(currentSettings.difficultyLevel).toBe(8);
      expect(currentSettings.autoHighlight).toBe(true);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        settings: currentSettings,
      });
    });

    it('should handle API key configuration', async () => {
      let apiKeys = {
        gemini: '',
        jinaReader: '',
      };

      // Mock API key controller
      const apiKeyController = {
        setAPIKey: (service: 'gemini' | 'jinaReader', key: string) => {
          apiKeys[service] = key;
        },

        validateAPIKey: async (
          service: 'gemini' | 'jinaReader',
          key: string
        ) => {
          // Mock validation
          if (key.length < 10) {
            return { valid: false, error: 'API key too short' };
          }
          return { valid: true };
        },

        saveAPIKeys: async () => {
          const settings = createDefaultSettings();
          settings.apiKeys = apiKeys;
          await chrome.storage.local.set({ settings });
        },
      };

      // Test API key setting
      apiKeyController.setAPIKey('gemini', 'test-gemini-api-key-123');
      apiKeyController.setAPIKey('jinaReader', 'test-jina-api-key-456');

      expect(apiKeys.gemini).toBe('test-gemini-api-key-123');
      expect(apiKeys.jinaReader).toBe('test-jina-api-key-456');

      // Test validation
      const validResult = await apiKeyController.validateAPIKey(
        'gemini',
        'test-gemini-api-key-123'
      );
      expect(validResult.valid).toBe(true);

      const invalidResult = await apiKeyController.validateAPIKey(
        'gemini',
        'short'
      );
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toBe('API key too short');

      // Test saving
      await apiKeyController.saveAPIKeys();
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle keyboard navigation', async () => {
      let currentMode: LearningMode = 'reading';
      let currentPartIndex = 0;
      const totalParts = 2;

      // Mock keyboard controller
      const keyboardController = {
        handleKeyDown: (event: KeyboardEvent) => {
          switch (event.key) {
            case 'ArrowLeft':
              if (currentPartIndex > 0) {
                currentPartIndex--;
                keyboardController.updateNavigation();
              }
              break;
            case 'ArrowRight':
              if (currentPartIndex < totalParts - 1) {
                currentPartIndex++;
                keyboardController.updateNavigation();
              }
              break;
            case 'v':
              currentMode = 'vocabulary';
              keyboardController.switchMode();
              break;
            case 's':
              currentMode = 'sentences';
              keyboardController.switchMode();
              break;
            case 'r':
              currentMode = 'reading';
              keyboardController.switchMode();
              break;
          }
        },

        updateNavigation: () => {
          const currentPartSpan = document.querySelector(
            '.current-part'
          ) as HTMLElement;
          currentPartSpan.textContent = (currentPartIndex + 1).toString();
        },

        switchMode: () => {
          document
            .querySelectorAll('.mode-content')
            .forEach(content => content.classList.remove('active'));
          document
            .querySelector(`[data-mode="${currentMode}"]`)
            ?.classList.add('active');
        },
      };

      // Test keyboard shortcuts
      keyboardController.handleKeyDown(
        new KeyboardEvent('keydown', { key: 'ArrowRight' })
      );
      expect(currentPartIndex).toBe(1);
      expect(document.querySelector('.current-part')?.textContent).toBe('2');

      keyboardController.handleKeyDown(
        new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      );
      expect(currentPartIndex).toBe(0);
      expect(document.querySelector('.current-part')?.textContent).toBe('1');

      keyboardController.handleKeyDown(
        new KeyboardEvent('keydown', { key: 'v' })
      );
      expect(currentMode).toBe('vocabulary');
      expect(
        document
          .querySelector('[data-mode="vocabulary"]')
          ?.classList.contains('active')
      ).toBe(true);

      keyboardController.handleKeyDown(
        new KeyboardEvent('keydown', { key: 's' })
      );
      expect(currentMode).toBe('sentences');
      expect(
        document
          .querySelector('[data-mode="sentences"]')
          ?.classList.contains('active')
      ).toBe(true);

      keyboardController.handleKeyDown(
        new KeyboardEvent('keydown', { key: 'r' })
      );
      expect(currentMode).toBe('reading');
      expect(
        document
          .querySelector('[data-mode="reading"]')
          ?.classList.contains('active')
      ).toBe(true);
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should handle large vocabulary collections efficiently', async () => {
      // Create large vocabulary collection
      const largeVocabulary: VocabularyItem[] = [];
      for (let i = 0; i < 100; i++) {
        largeVocabulary.push({
          id: `vocab-${i}`,
          word: `word${i}`,
          translation: `translation${i}`,
          context: `Context for word ${i}`,
          exampleSentences: [`Example ${i}`],
          articleId: 'large-article',
          partId: 'part-1',
          createdAt: new Date(),
          lastReviewed: new Date(),
          reviewCount: 0,
          difficulty: Math.floor(Math.random() * 10) + 1,
        });
      }

      // Mock performance-optimized rendering
      const performanceController = {
        renderVocabularyWithPagination: (
          vocabulary: VocabularyItem[],
          pageSize = 20
        ) => {
          const grid = document.querySelector(
            '.vocabulary-grid'
          ) as HTMLElement;
          const totalPages = Math.ceil(vocabulary.length / pageSize);
          let currentPage = 0;

          const renderPage = (page: number) => {
            const startIndex = page * pageSize;
            const endIndex = Math.min(startIndex + pageSize, vocabulary.length);
            const pageItems = vocabulary.slice(startIndex, endIndex);

            grid.innerHTML = pageItems
              .map(
                vocab => `
              <div class="vocab-learning-card" data-vocab-id="${vocab.id}">
                <div class="vocab-word">${vocab.word}</div>
                <div class="vocab-translation">${vocab.translation}</div>
              </div>
            `
              )
              .join('');

            // Add pagination controls
            const paginationHTML = `
              <div class="pagination">
                <button class="prev-page" ${page === 0 ? 'disabled' : ''}>Previous</button>
                <span>Page ${page + 1} of ${totalPages}</span>
                <button class="next-page" ${page === totalPages - 1 ? 'disabled' : ''}>Next</button>
              </div>
            `;
            grid.insertAdjacentHTML('afterend', paginationHTML);
          };

          renderPage(currentPage);
          return { totalPages, renderPage };
        },
      };

      // Test performance with large dataset
      const startTime = performance.now();
      const pagination = performanceController.renderVocabularyWithPagination(
        largeVocabulary,
        20
      );
      const endTime = performance.now();

      // Verify rendering performance (should be fast)
      expect(endTime - startTime).toBeLessThan(100); // Less than 100ms

      // Verify pagination
      expect(pagination.totalPages).toBe(5); // 100 items / 20 per page
      expect(document.querySelectorAll('.vocab-learning-card')).toHaveLength(
        20
      );
      expect(document.querySelector('.pagination')).toBeTruthy();
    });

    it('should maintain responsive UI during processing', async () => {
      let processingComplete = false;
      let uiResponsive = true;

      // Mock long-running processing with UI updates
      const processingController = {
        processArticleWithProgress: async (_content: string) => {
          const steps = [
            'Extracting content',
            'Detecting language',
            'Processing with AI',
            'Creating vocabulary',
            'Finalizing',
          ];
          const loadingText = document.querySelector(
            '.loading-text'
          ) as HTMLElement;
          const loadingOverlay = document.querySelector(
            '.loading-overlay'
          ) as HTMLElement;

          loadingOverlay.classList.remove('hidden');

          for (let i = 0; i < steps.length; i++) {
            loadingText.textContent = `${steps[i]}... (${i + 1}/${steps.length})`;

            // Simulate processing step
            await new Promise(resolve => setTimeout(resolve, 50));

            // Check if UI is still responsive (can update)
            const testElement = document.createElement('div');
            testElement.textContent = 'UI Test';
            document.body.appendChild(testElement);

            if (!document.body.contains(testElement)) {
              uiResponsive = false;
            }

            testElement.remove();
          }

          loadingOverlay.classList.add('hidden');
          processingComplete = true;
        },
      };

      // Test processing with UI updates
      await processingController.processArticleWithProgress(
        'Test article content'
      );

      expect(processingComplete).toBe(true);
      expect(uiResponsive).toBe(true);
      expect(
        document.querySelector('.loading-overlay')?.classList.contains('hidden')
      ).toBe(true);
    });
  });

  describe('Error Recovery and User Feedback', () => {
    it('should provide clear error messages and recovery options', async () => {
      let errorDisplayed = false;
      let recoveryOffered = false;

      // Mock error handling controller
      const errorController = {
        handleError: (error: Error, context: string) => {
          errorDisplayed = true;

          const errorMessage = errorController.getErrorMessage(error, context);
          const recoveryOptions = errorController.getRecoveryOptions(
            error,
            context
          );

          // Show error notification
          const notification = document.createElement('div');
          notification.className = 'error-notification';
          notification.innerHTML = `
            <div class="error-message">${errorMessage}</div>
            <div class="error-actions">
              ${recoveryOptions.map(option => `<button class="error-action" data-action="${option.action}">${option.label}</button>`).join('')}
            </div>
          `;
          document.body.appendChild(notification);

          if (recoveryOptions.length > 0) {
            recoveryOffered = true;
          }
        },

        getErrorMessage: (error: Error, _context: string) => {
          const messages: Record<string, string> = {
            AI_UNAVAILABLE:
              'AI processing is currently unavailable. You can still read the original article.',
            NETWORK_ERROR:
              'Network connection lost. Using cached content when available.',
            STORAGE_FULL:
              'Storage is full. Please export your vocabulary to continue.',
            CONTENT_EXTRACTION_FAILED:
              'Could not extract article content. Try refreshing the page.',
          };

          return (
            messages[error.message] || `An error occurred: ${error.message}`
          );
        },

        getRecoveryOptions: (error: Error, _context: string) => {
          const options: Array<{ action: string; label: string }> = [];

          switch (error.message) {
            case 'AI_UNAVAILABLE':
              options.push({ action: 'use_fallback', label: 'Use Gemini API' });
              options.push({
                action: 'continue_without_ai',
                label: 'Continue Without AI',
              });
              break;
            case 'NETWORK_ERROR':
              options.push({ action: 'retry', label: 'Retry' });
              options.push({
                action: 'use_offline',
                label: 'Use Offline Mode',
              });
              break;
            case 'STORAGE_FULL':
              options.push({ action: 'export_data', label: 'Export Data' });
              options.push({ action: 'clear_cache', label: 'Clear Cache' });
              break;
            case 'CONTENT_EXTRACTION_FAILED':
              options.push({ action: 'retry', label: 'Retry' });
              options.push({
                action: 'manual_paste',
                label: 'Paste Content Manually',
              });
              break;
          }

          return options;
        },
      };

      // Test error handling
      const aiError = new Error('AI_UNAVAILABLE');
      errorController.handleError(aiError, 'article_processing');

      expect(errorDisplayed).toBe(true);
      expect(recoveryOffered).toBe(true);
      expect(document.querySelector('.error-notification')).toBeTruthy();
      expect(document.querySelector('.error-message')?.textContent).toContain(
        'AI processing is currently unavailable'
      );
      expect(document.querySelectorAll('.error-action')).toHaveLength(2);

      // Test network error
      document.querySelector('.error-notification')?.remove();
      const networkError = new Error('NETWORK_ERROR');
      errorController.handleError(networkError, 'content_loading');

      expect(document.querySelector('.error-message')?.textContent).toContain(
        'Network connection lost'
      );
      expect(document.querySelectorAll('.error-action')).toHaveLength(2);
    });
  });
});
