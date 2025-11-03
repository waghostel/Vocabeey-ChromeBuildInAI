/**
 * Learning Interface - Main UI controller for article rendering and learning modes
 * Implements Requirements: 1.7, 6.1, 6.2, 6.4, 3.1, 3.2, 3.4, 3.5
 */

import { getMemoryManager, type ResourceUsage } from '../utils/memory-manager';

import {
  initializeHighlightManager,
  setHighlightMode,
  cleanupHighlightManager,
  showContextMenu,
  type HighlightMode,
} from './highlight-manager';

import { initializeHamburgerMenu } from './components/hamburger-menu';

import type {
  ProcessedArticle,
  ArticlePart,
  VocabularyItem,
  SentenceItem,
  LearningMode,
  LanguageDisplayMode,
} from '../types';

// ============================================================================
// Language Data
// ============================================================================

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'cs', name: 'Czech' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'ro', name: 'Romanian' },
  { code: 'uk', name: 'Ukrainian' },
];

// ============================================================================
// State Management
// ============================================================================

interface UIState {
  currentMode: LearningMode;
  currentArticle: ProcessedArticle | null;
  currentPartIndex: number;
  displayMode: LanguageDisplayMode;
  vocabularyItems: VocabularyItem[];
  sentenceItems: SentenceItem[];
  highlightMode: HighlightMode;
  targetLanguage: string;
}

const state: UIState = {
  currentMode: 'reading',
  currentArticle: null,
  currentPartIndex: 0,
  displayMode: 'both',
  vocabularyItems: [],
  sentenceItems: [],
  highlightMode: 'vocabulary',
  targetLanguage: 'en',
};

// ============================================================================
// DOM Elements
// ============================================================================

const elements = {
  // Mode tabs
  tabButtons: document.querySelectorAll(
    '.tab-button'
  ) as NodeListOf<HTMLButtonElement>,
  modeContents: document.querySelectorAll(
    '.mode-content'
  ) as NodeListOf<HTMLElement>,

  // Article header
  articleTitle: document.querySelector('.article-title') as HTMLElement,
  articleUrl: document.querySelector('.article-url') as HTMLElement,
  languageBadge: document.querySelector('.language-badge') as HTMLElement,
  languageCode: document.querySelector('.language-code') as HTMLElement,
  confidenceIndicator: document.querySelector(
    '.confidence-indicator'
  ) as HTMLElement,

  // Language selector
  languageInput: document.getElementById(
    'target-language-input'
  ) as HTMLInputElement,
  languageDropdown: document.querySelector('.language-dropdown') as HTMLElement,
  languageOptions: document.querySelector('.language-options') as HTMLElement,

  // Article content
  articlePartContent: document.querySelector(
    '.article-part-content'
  ) as HTMLElement,
  vocabularyCardsSection: document.querySelector(
    '.vocabulary-cards'
  ) as HTMLElement,
  sentenceCardsSection: document.querySelector(
    '.sentence-cards'
  ) as HTMLElement,

  // Navigation
  prevButton: document.getElementById('prev-part') as HTMLButtonElement,
  nextButton: document.getElementById('next-part') as HTMLButtonElement,
  currentPartSpan: document.querySelector('.current-part') as HTMLElement,
  totalPartsSpan: document.querySelector('.total-parts') as HTMLElement,

  // Learning modes
  displayOptions: document.querySelectorAll(
    '.display-option'
  ) as NodeListOf<HTMLButtonElement>,
  vocabularyGrid: document.querySelector('.vocabulary-grid') as HTMLElement,
  sentenceList: document.querySelector('.sentence-list') as HTMLElement,

  // Loading overlay
  loadingOverlay: document.querySelector('.loading-overlay') as HTMLElement,
  loadingText: document.querySelector('.loading-text') as HTMLElement,

  // Context menu
  contextMenu: document.querySelector('.context-menu') as HTMLElement,
};

// ============================================================================
// Initialization
// ============================================================================

async function initialize(): Promise<void> {
  try {
    showLoading('Loading article...');

    // Initialize hamburger menu
    initializeHamburgerMenu();

    // Initialize memory monitoring
    initializeMemoryMonitoring();

    // Initialize TTS debug console
    const { initTTSDebugConsole } = await import(
      '../utils/tts-debug-console.js'
    );
    initTTSDebugConsole();

    // Initialize language selector
    await initializeLanguageSelector();

    // Get article data from session storage
    const tabId = await getCurrentTabId();
    const articleData = await getArticleData(tabId);

    if (!articleData) {
      showError('No article data found');
      return;
    }

    // Load article
    await loadArticle(articleData);

    // Setup event listeners
    setupEventListeners();

    hideLoading();
  } catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to load article');
  }
}

/**
 * Get current tab ID
 */
async function getCurrentTabId(): Promise<number> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]?.id) {
    throw new Error('No active tab found');
  }
  return tabs[0].id;
}

/**
 * Get article data from session storage
 */
async function getArticleData(tabId: number): Promise<ProcessedArticle | null> {
  const data = await chrome.storage.session.get(`article_${tabId}`);
  return data[`article_${tabId}`] || null;
}

// ============================================================================
// Article Loading and Rendering
// ============================================================================

/**
 * Load and display article
 */
async function loadArticle(article: ProcessedArticle): Promise<void> {
  state.currentArticle = article;
  state.currentPartIndex = 0;

  // Store article language in local storage for translation to access
  await chrome.storage.local.set({
    currentArticleLanguage: article.originalLanguage,
  });

  // Render article header
  renderArticleHeader(article);

  // Render first article part
  renderArticlePart(0);

  // Load vocabulary and sentences for this article
  await loadVocabularyAndSentences(article.id);
}

/**
 * Render article header
 */
function renderArticleHeader(article: ProcessedArticle): void {
  elements.articleTitle.textContent = article.title;
  elements.articleUrl.textContent = article.url;
  elements.articleUrl.title = article.url;

  // Render language badge with confidence indicator
  renderLanguageBadge(
    article.originalLanguage,
    article.detectedLanguageConfidence
  );
}

/**
 * Render language badge with confidence indicator
 */
function renderLanguageBadge(
  languageCode: string,
  confidence: number = 0.5
): void {
  // Get full language name
  const language = LANGUAGES.find(l => l.code === languageCode);
  const languageName = language?.name || languageCode.toUpperCase();

  // Set language code
  elements.languageCode.textContent = languageCode.toUpperCase();

  // Determine confidence level
  let confidenceClass: string;
  let confidenceText: string;

  if (confidence >= 0.8) {
    confidenceClass = 'high-confidence';
    confidenceText = 'High confidence';
  } else if (confidence >= 0.5) {
    confidenceClass = 'medium-confidence';
    confidenceText = 'Medium confidence';
  } else {
    confidenceClass = 'low-confidence';
    confidenceText = 'Low confidence';
  }

  // Hide confidence indicator (no emoji)
  elements.confidenceIndicator.textContent = '';

  // Update badge class
  elements.languageBadge.className = `language-badge ${confidenceClass}`;

  // Set tooltip with detailed information
  const confidencePercent = Math.round(confidence * 100);
  elements.languageBadge.title = `${languageName}\n${confidenceText} (${confidencePercent}%)\nDetected using Chrome AI`;
}

/**
 * Render article part
 */
function renderArticlePart(partIndex: number): void {
  if (!state.currentArticle) return;

  const part = state.currentArticle.parts[partIndex];
  if (!part) return;

  state.currentPartIndex = partIndex;

  // Cleanup previous highlight manager
  cleanupHighlightManager();

  // Render content
  elements.articlePartContent.innerHTML = formatArticleContent(part.content);

  // Add copy buttons to paragraphs
  addCopyButtonsToParagraphs();

  // Initialize highlight manager for this part
  initializeHighlightManager(
    state.currentArticle.id,
    part.id,
    state.highlightMode
  );

  // Update navigation
  updateNavigation();

  // Render vocabulary and sentence cards for this part
  renderPartVocabularyCards(part);
  renderPartSentenceCards(part);

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Format article content into paragraphs
 */
function formatArticleContent(content: string): string {
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  return paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Add copy buttons to all paragraphs
 */
function addCopyButtonsToParagraphs(): void {
  const paragraphs = elements.articlePartContent.querySelectorAll('p');

  paragraphs.forEach(paragraph => {
    // Create copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'paragraph-copy-btn';
    copyBtn.setAttribute('aria-label', 'Copy paragraph');
    copyBtn.setAttribute('title', 'Copy paragraph');

    // Add copy icon (SVG)
    copyBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    // Add click handler
    copyBtn.addEventListener('click', e => {
      e.stopPropagation();
      void handleParagraphCopy(paragraph, copyBtn);
    });

    // Add mousemove handler to show button only when near top-right corner
    paragraph.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = paragraph.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Define the trigger area: top-right corner (80px from right, 40px from top)
      const triggerWidth = 80;
      const triggerHeight = 40;
      const isInTopRightCorner =
        mouseX > rect.width - triggerWidth && mouseY < triggerHeight;

      if (isInTopRightCorner) {
        copyBtn.style.opacity = '1';
      } else {
        copyBtn.style.opacity = '0';
      }
    });

    // Hide button when mouse leaves paragraph
    paragraph.addEventListener('mouseleave', () => {
      copyBtn.style.opacity = '0';
    });

    // Add right-click context menu handler
    paragraph.addEventListener('contextmenu', e => {
      e.preventDefault();
      showParagraphContextMenu(paragraph, e as MouseEvent);
    });

    // Append to paragraph
    paragraph.appendChild(copyBtn);
  });
}

/**
 * Handle paragraph copy action
 */
async function handleParagraphCopy(
  paragraph: Element,
  button: HTMLElement
): Promise<void> {
  try {
    // Get paragraph text (excluding the copy button)
    const copyButton = paragraph.querySelector('.paragraph-copy-btn');
    const textToCopy = Array.from(paragraph.childNodes)
      .filter(node => node !== copyButton)
      .map(node => node.textContent || '')
      .join('')
      .trim();

    // Copy to clipboard
    await navigator.clipboard.writeText(textToCopy);

    // Change icon to checkmark (same color, no background)
    button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    // Show tooltip
    showTooltip('Paragraph copied!');

    // Reset after 2 seconds
    setTimeout(() => {
      button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy paragraph:', error);
    showTooltip('Failed to copy paragraph');
  }
}

/**
 * Show context menu for paragraph right-click
 */
function showParagraphContextMenu(paragraph: Element, event: MouseEvent): void {
  const contextMenu = elements.contextMenu;
  if (!contextMenu) return;

  // Store paragraph reference and context type
  contextMenu.dataset.itemType = 'paragraph';
  contextMenu.dataset.paragraphElement = 'true';

  // Store paragraph element reference (we'll use it in the action handler)
  (contextMenu as any)._paragraphElement = paragraph;

  // Update menu items visibility - show only "Copy"
  updateContextMenuItems('paragraph');

  // Position menu at cursor
  contextMenu.style.left = `${event.pageX}px`;
  contextMenu.style.top = `${event.pageY}px`;

  // Show menu
  contextMenu.classList.remove('hidden');
}

/**
 * Update context menu items based on context type
 */
function updateContextMenuItems(
  contextType: 'paragraph' | 'vocabulary' | 'sentence' | 'selection'
): void {
  const menuItems = document.querySelectorAll('.context-menu-item');

  menuItems.forEach(item => {
    const action = (item as HTMLElement).dataset.action;

    if (contextType === 'paragraph') {
      // For paragraphs, show only "Copy"
      if (action === 'copy') {
        (item as HTMLElement).style.display = 'block';
      } else {
        (item as HTMLElement).style.display = 'none';
      }
    } else {
      // For other contexts, hide "Copy" and show relevant items
      if (action === 'copy') {
        (item as HTMLElement).style.display = 'none';
      } else {
        // Reset to default display for other items
        (item as HTMLElement).style.display = 'block';
      }
    }
  });
}

/**
 * Update navigation controls
 */
function updateNavigation(): void {
  if (!state.currentArticle) return;

  const totalParts = state.currentArticle.parts.length;
  const currentPart = state.currentPartIndex + 1;

  elements.currentPartSpan.textContent = currentPart.toString();
  elements.totalPartsSpan.textContent = totalParts.toString();

  // Update button states
  elements.prevButton.disabled = state.currentPartIndex === 0;
  elements.nextButton.disabled = state.currentPartIndex === totalParts - 1;
}

// ============================================================================
// Vocabulary and Sentence Cards
// ============================================================================

/**
 * Load vocabulary and sentences for article
 */
async function loadVocabularyAndSentences(articleId: string): Promise<void> {
  try {
    // Get all vocabulary items
    const vocabData = await chrome.storage.local.get('vocabulary');
    const allVocab: Record<string, VocabularyItem> = vocabData.vocabulary || {};
    state.vocabularyItems = Object.values(allVocab).filter(
      v => v.articleId === articleId
    );

    // Get all sentence items
    const sentenceData = await chrome.storage.local.get('sentences');
    const allSentences: Record<string, SentenceItem> =
      sentenceData.sentences || {};
    state.sentenceItems = Object.values(allSentences).filter(
      s => s.articleId === articleId
    );
  } catch (error) {
    console.error('Error loading vocabulary and sentences:', error);
  }
}

/**
 * Render vocabulary cards for current part
 */
function renderPartVocabularyCards(part: ArticlePart): void {
  const partVocab = state.vocabularyItems.filter(v => v.partId === part.id);

  if (partVocab.length === 0) {
    elements.vocabularyCardsSection.innerHTML =
      '<p class="text-secondary">No vocabulary items yet. Highlight words to add them.</p>';
    return;
  }

  elements.vocabularyCardsSection.innerHTML = partVocab
    .map(vocab => createVocabularyCardHTML(vocab))
    .join('');

  // Add event listeners to cards
  partVocab.forEach(vocab => {
    const card = document.querySelector(`[data-vocab-id="${vocab.id}"]`);
    if (card) {
      card.addEventListener('click', () =>
        toggleCardCollapse(vocab.id, 'vocab')
      );

      // Original language speaker
      const pronounceBtn = card.querySelector('.pronounce-btn');
      if (pronounceBtn) {
        pronounceBtn.addEventListener('click', e => {
          e.stopPropagation();
          void handlePronounceClick(
            pronounceBtn as HTMLElement,
            vocab.word,
            state.currentArticle?.originalLanguage
          );
        });
      }

      // Translation language speaker
      const pronounceBtnTranslation = card.querySelector(
        '.pronounce-btn-translation'
      );
      if (pronounceBtnTranslation) {
        pronounceBtnTranslation.addEventListener('click', e => {
          e.stopPropagation();
          void handlePronounceClick(
            pronounceBtnTranslation as HTMLElement,
            vocab.translation,
            state.targetLanguage
          );
        });
      }

      // Add context menu listener
      card.addEventListener('contextmenu', e => {
        e.preventDefault();
        showContextMenu(
          card as HTMLElement,
          vocab.id,
          'vocabulary',
          e as MouseEvent
        );
      });
    }
  });
}

/**
 * Create vocabulary card HTML
 */
function createVocabularyCardHTML(vocab: VocabularyItem): string {
  return `
    <div class="vocab-card collapsed" data-vocab-id="${vocab.id}">
      <div class="card-header">
        <span class="card-word">${escapeHtml(vocab.word)}</span>
        <div class="card-actions">
          <button class="card-action-btn pronounce-btn" data-lang="original" title="Pronounce original">🔊</button>
        </div>
      </div>
      <div class="card-translation">
        ${escapeHtml(vocab.translation)}
        <button class="card-action-btn pronounce-btn-translation" data-lang="translation" title="Pronounce translation">🔊</button>
      </div>
      <div class="card-details">
        <div class="card-context">"${escapeHtml(vocab.context)}"</div>
        ${
          vocab.exampleSentences.length > 0
            ? `
          <div class="card-examples">
            <div class="card-examples-title">Example sentences:</div>
            ${vocab.exampleSentences.map(ex => `<div class="card-example">• ${escapeHtml(ex)}</div>`).join('')}
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;
}

/**
 * Render sentence cards for current part
 */
function renderPartSentenceCards(part: ArticlePart): void {
  const partSentences = state.sentenceItems.filter(s => s.partId === part.id);

  if (partSentences.length === 0) {
    elements.sentenceCardsSection.innerHTML =
      '<p class="text-secondary">No sentences yet. Highlight sentences to add them.</p>';
    return;
  }

  elements.sentenceCardsSection.innerHTML = partSentences
    .map(sentence => createSentenceCardHTML(sentence))
    .join('');

  // Add event listeners to cards
  partSentences.forEach(sentence => {
    const card = document.querySelector(`[data-sentence-id="${sentence.id}"]`);
    if (card) {
      card.addEventListener('click', () =>
        toggleCardCollapse(sentence.id, 'sentence')
      );

      // Original language speaker
      const pronounceBtn = card.querySelector('.pronounce-btn');
      if (pronounceBtn) {
        pronounceBtn.addEventListener('click', e => {
          e.stopPropagation();
          void handlePronounceClick(
            pronounceBtn as HTMLElement,
            sentence.content,
            state.currentArticle?.originalLanguage
          );
        });
      }

      // Translation language speaker
      const pronounceBtnTranslation = card.querySelector(
        '.pronounce-btn-translation'
      );
      if (pronounceBtnTranslation) {
        pronounceBtnTranslation.addEventListener('click', e => {
          e.stopPropagation();
          void handlePronounceClick(
            pronounceBtnTranslation as HTMLElement,
            sentence.translation,
            state.targetLanguage
          );
        });
      }

      // Add context menu listener
      card.addEventListener('contextmenu', e => {
        e.preventDefault();
        showContextMenu(
          card as HTMLElement,
          sentence.id,
          'sentence',
          e as MouseEvent
        );
      });
    }
  });
}

/**
 * Create sentence card HTML
 */
function createSentenceCardHTML(sentence: SentenceItem): string {
  return `
    <div class="sentence-card collapsed" data-sentence-id="${sentence.id}">
      <div class="card-header">
        <span class="card-sentence">${escapeHtml(sentence.content)}</span>
        <div class="card-actions">
          <button class="card-action-btn pronounce-btn" data-lang="original" title="Pronounce original">🔊</button>
        </div>
      </div>
      <div class="card-details">
        <div class="card-translation">
          ${escapeHtml(sentence.translation)}
          <button class="card-action-btn pronounce-btn-translation" data-lang="translation" title="Pronounce translation">🔊</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Toggle card collapse state
 */
function toggleCardCollapse(id: string, type: 'vocab' | 'sentence'): void {
  const card = document.querySelector(
    `[data-${type === 'vocab' ? 'vocab' : 'sentence'}-id="${id}"]`
  );
  if (card) {
    card.classList.toggle('collapsed');
  }
}

// ============================================================================
// Mode Switching
// ============================================================================

/**
 * Switch learning mode
 */
function switchMode(mode: LearningMode): void {
  state.currentMode = mode;

  // Update tab buttons
  elements.tabButtons.forEach(btn => {
    if (btn.dataset.mode === mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update content visibility
  elements.modeContents.forEach(content => {
    if (content.dataset.mode === mode) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });

  // Render mode-specific content
  if (mode === 'vocabulary') {
    renderVocabularyLearningMode();
  } else if (mode === 'sentences') {
    renderSentenceLearningMode();
  }
}

/**
 * Render vocabulary learning mode
 */
function renderVocabularyLearningMode(): void {
  if (state.vocabularyItems.length === 0) {
    elements.vocabularyGrid.innerHTML =
      '<p class="text-center text-secondary">No vocabulary items yet. Go to Reading mode and highlight words.</p>';
    return;
  }

  elements.vocabularyGrid.innerHTML = state.vocabularyItems
    .map(vocab => createVocabularyLearningCardHTML(vocab))
    .join('');

  // Add event listeners
  state.vocabularyItems.forEach(vocab => {
    const card = document.querySelector(
      `[data-vocab-learning-id="${vocab.id}"]`
    ) as HTMLElement;
    if (card) {
      // Add click listener to the word (original language)
      const wordElement = card.querySelector(
        '.vocab-learning-word'
      ) as HTMLElement;
      if (wordElement) {
        wordElement.addEventListener('click', e => {
          e.stopPropagation();
          void handlePronounceClick(
            wordElement,
            vocab.word,
            state.currentArticle?.originalLanguage
          );
        });
      }

      // Add click listener to the translation (target language)
      const translationElement = card.querySelector(
        '.vocab-learning-translation'
      ) as HTMLElement;
      if (translationElement) {
        translationElement.addEventListener('click', e => {
          e.stopPropagation();
          void handlePronounceClick(
            translationElement,
            vocab.translation,
            state.targetLanguage
          );
        });
      }

      // Fallback: clicking on card (but not on word or translation) pronounces the word
      card.addEventListener('click', () => {
        void handlePronounceClick(
          card,
          vocab.word,
          state.currentArticle?.originalLanguage
        );
      });
    }
  });
}

/**
 * Create vocabulary learning card HTML
 */
function createVocabularyLearningCardHTML(vocab: VocabularyItem): string {
  const showWord =
    state.displayMode === 'both' || state.displayMode === 'learning_only';
  const showTranslation =
    state.displayMode === 'both' || state.displayMode === 'native_only';
  const hideTranslation = state.displayMode === 'learning_only';

  return `
    <div class="vocab-learning-card" data-vocab-learning-id="${vocab.id}">
      ${showWord ? `<div class="vocab-learning-word clickable-text" title="Click to pronounce">${escapeHtml(vocab.word)}</div>` : ''}
      ${showTranslation ? `<div class="vocab-learning-translation clickable-text ${hideTranslation ? 'hidden-lang' : ''}" title="Click to pronounce translation">${escapeHtml(vocab.translation)}</div>` : ''}
    </div>
  `;
}

/**
 * Render sentence learning mode
 */
function renderSentenceLearningMode(): void {
  if (state.sentenceItems.length === 0) {
    elements.sentenceList.innerHTML =
      '<p class="text-center text-secondary">No sentences yet. Go to Reading mode and highlight sentences.</p>';
    return;
  }

  elements.sentenceList.innerHTML = state.sentenceItems
    .map(sentence => createSentenceLearningCardHTML(sentence))
    .join('');

  // Add event listeners
  state.sentenceItems.forEach(sentence => {
    const card = document.querySelector(
      `[data-sentence-learning-id="${sentence.id}"]`
    ) as HTMLElement;
    if (card) {
      // Add click listener to the sentence content (original language)
      const contentElement = card.querySelector(
        '.sentence-learning-content'
      ) as HTMLElement;
      if (contentElement) {
        contentElement.addEventListener('click', e => {
          e.stopPropagation();
          void handlePronounceClick(
            contentElement,
            sentence.content,
            state.currentArticle?.originalLanguage
          );
        });
      }

      // Add click listener to the translation (target language)
      const translationElement = card.querySelector(
        '.sentence-learning-translation'
      ) as HTMLElement;
      if (translationElement) {
        translationElement.addEventListener('click', e => {
          e.stopPropagation();
          void handlePronounceClick(
            translationElement,
            sentence.translation,
            state.targetLanguage
          );
        });
      }

      // Fallback: clicking on card (but not on content or translation) pronounces the sentence
      card.addEventListener('click', () => {
        void handlePronounceClick(
          card,
          sentence.content,
          state.currentArticle?.originalLanguage
        );
      });
    }
  });
}

/**
 * Create sentence learning card HTML
 */
function createSentenceLearningCardHTML(sentence: SentenceItem): string {
  return `
    <div class="sentence-learning-card" data-sentence-learning-id="${sentence.id}">
      <div class="sentence-learning-content clickable-text" title="Click to pronounce">${escapeHtml(sentence.content)}</div>
      <div class="sentence-learning-translation clickable-text" title="Click to pronounce translation">${escapeHtml(sentence.translation)}</div>
    </div>
  `;
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners(): void {
  // Mode tab switching
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode as LearningMode;
      switchMode(mode);
    });
  });

  // Navigation buttons
  elements.prevButton.addEventListener('click', () => {
    if (state.currentPartIndex > 0) {
      renderArticlePart(state.currentPartIndex - 1);
    }
  });

  elements.nextButton.addEventListener('click', () => {
    if (
      state.currentArticle &&
      state.currentPartIndex < state.currentArticle.parts.length - 1
    ) {
      renderArticlePart(state.currentPartIndex + 1);
    }
  });

  // Display mode options
  elements.displayOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      const displayMode = btn.dataset.display as LanguageDisplayMode;
      state.displayMode = displayMode;

      // Update active state
      elements.displayOptions.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Re-render vocabulary learning mode
      renderVocabularyLearningMode();
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);

  // Close context menu on click outside
  document.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    // Don't hide if clicking inside the context menu
    if (!elements.contextMenu.contains(target)) {
      elements.contextMenu.classList.add('hidden');
    }
  });

  // Highlight mode switching
  const highlightModeButtons = document.querySelectorAll('.highlight-mode-btn');
  highlightModeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = (btn as HTMLElement).dataset.highlightMode as HighlightMode;
      switchHighlightMode(mode);
    });
  });

  // Listen for highlight events
  document.addEventListener('vocabulary-added', handleVocabularyAdded);
  document.addEventListener('sentence-added', handleSentenceAdded);
  document.addEventListener('vocabulary-removed', handleVocabularyRemoved);
  document.addEventListener('sentence-removed', handleSentenceRemoved);

  // Context menu actions
  const contextMenuItems = document.querySelectorAll('.context-menu-item');
  contextMenuItems.forEach(item => {
    item.addEventListener('click', e => {
      e.stopPropagation(); // Prevent document click from hiding menu prematurely
      void handleContextMenuAction(e);
    });
  });
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(event: KeyboardEvent): void {
  // Ignore if typing in input
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement
  ) {
    return;
  }

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault();
      if (state.currentPartIndex > 0) {
        renderArticlePart(state.currentPartIndex - 1);
      }
      break;

    case 'ArrowRight':
      event.preventDefault();
      if (
        state.currentArticle &&
        state.currentPartIndex < state.currentArticle.parts.length - 1
      ) {
        renderArticlePart(state.currentPartIndex + 1);
      }
      break;

    case 'v':
      event.preventDefault();
      switchMode('vocabulary');
      break;

    case 's':
      event.preventDefault();
      switchMode('sentences');
      break;

    case 'r':
      event.preventDefault();
      switchMode('reading');
      break;

    case 'Escape':
      event.preventDefault();
      switchHighlightMode('none');
      break;

    case '1':
      event.preventDefault();
      switchHighlightMode('vocabulary');
      break;

    case '2':
      event.preventDefault();
      switchHighlightMode('sentence');
      break;

    case '0':
    case '3':
      event.preventDefault();
      switchHighlightMode('none');
      break;
  }
}

// ============================================================================
// Highlight Mode Switching
// ============================================================================

/**
 * Switch highlight mode and update UI
 */
function switchHighlightMode(mode: HighlightMode): void {
  // Update state
  state.highlightMode = mode;

  // Update highlight manager
  setHighlightMode(mode);

  // Update button active states
  const highlightModeButtons = document.querySelectorAll('.highlight-mode-btn');
  highlightModeButtons.forEach(btn => {
    const btnMode = (btn as HTMLElement).dataset.highlightMode;
    if (btnMode === mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Show brief feedback
  const modeNames = {
    vocabulary: 'Vocabulary',
    sentence: 'Sentences',
    none: 'None',
  };
  showTooltip(`Highlight mode: ${modeNames[mode]}`);
}

// ============================================================================
// Text-to-Speech
// ============================================================================

let currentSpeakingButton: HTMLElement | null = null;
let userCancelledTTS = false;

/**
 * Handle pronounce button click with visual feedback
 */
async function handlePronounceClick(
  button: HTMLElement,
  text: string,
  language?: string
): Promise<void> {
  try {
    const { speak, stopSpeaking, isTTSSupported, getTTSService } = await import(
      '../utils/tts-service.js'
    );

    if (!isTTSSupported()) {
      showTooltip('Text-to-speech is not supported in your browser');
      return;
    }

    const ttsService = getTTSService();

    // If already speaking, determine if we should stop or switch
    if (ttsService.isSpeaking()) {
      // Check if clicking the same button (stop) or different button (switch)
      if (currentSpeakingButton === button) {
        // Same button: stop speaking
        stopSpeaking();
        removeSpeakingIndicators();
        return;
      } else {
        // Different button: interrupt current speech and switch to new word
        userCancelledTTS = true; // Mark as user-initiated interruption
        stopSpeaking();
        removeSpeakingIndicators();
        // Continue to speak the new word (don't return)
      }
    }

    // Add speaking class to button
    button.classList.add('speaking');
    currentSpeakingButton = button;

    // Show TTS retry indicator
    showTTSRetryIndicator(text);

    // Speak the text with specified language
    await speak(text, { language });

    // Remove speaking indicators when done
    hideTTSRetryIndicator();
    removeSpeakingIndicators();
    userCancelledTTS = false; // Reset flag on success
  } catch (error: unknown) {
    console.error('TTS error:', error);

    // Hide retry indicator
    hideTTSRetryIndicator();

    // Check if it was cancelled
    const ttsError = error as { type?: string; message?: string };
    // Only show error if not cancelled OR not user-initiated
    if (ttsError.type !== 'cancelled' && !userCancelledTTS) {
      // Show user-friendly error message
      if (ttsError.message?.includes('after retries')) {
        showTooltip(
          'Speech failed after 3 attempts. Check console for details.'
        );
      } else if (ttsError.message?.includes('not supported')) {
        showTooltip('Text-to-speech is not supported in your browser');
      } else {
        showTooltip('Speech synthesis failed');
      }
    }

    removeSpeakingIndicators();
    userCancelledTTS = false; // Reset flag
  }
}

/**
 * Remove speaking indicators
 */
function removeSpeakingIndicators(): void {
  if (currentSpeakingButton) {
    currentSpeakingButton.classList.remove('speaking');
    currentSpeakingButton = null;
  }
}

/**
 * Show tooltip message
 */
function showTooltip(message: string): void {
  const tooltip = document.createElement('div');
  tooltip.className = 'tts-tooltip';
  tooltip.textContent = message;
  tooltip.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(tooltip);

  setTimeout(() => {
    tooltip.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => tooltip.remove(), 300);
  }, 3000);
}

let currentTTSRetryIndicator: HTMLElement | null = null;

/**
 * Show TTS retry indicator
 */
function showTTSRetryIndicator(text: string): void {
  // Remove existing indicator
  if (currentTTSRetryIndicator) {
    currentTTSRetryIndicator.remove();
  }

  const indicator = document.createElement('div');
  indicator.className = 'tts-retry-indicator';

  const truncatedText = text.length > 30 ? text.substring(0, 30) + '...' : text;

  indicator.innerHTML = `
    <div class="tts-retry-content">
      <span class="tts-retry-icon">🔊</span>
      <div class="tts-retry-text">
        <div class="tts-retry-label">Speaking</div>
        <div class="tts-retry-message">"${truncatedText}"</div>
      </div>
      <button class="tts-cancel-btn">Cancel</button>
    </div>
  `;

  document.body.appendChild(indicator);
  currentTTSRetryIndicator = indicator;

  // Add event listener to cancel button
  const cancelBtn = indicator.querySelector('.tts-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', async () => {
      userCancelledTTS = true; // Set flag before stopping
      const { stopSpeaking } = await import('../utils/tts-service.js');
      stopSpeaking();
      hideTTSRetryIndicator();
      removeSpeakingIndicators();
    });
  }
}

/**
 * Hide TTS retry indicator
 */
function hideTTSRetryIndicator(): void {
  if (currentTTSRetryIndicator) {
    currentTTSRetryIndicator.remove();
    currentTTSRetryIndicator = null;
  }
}

// ============================================================================
// Loading and Error States
// ============================================================================

function showLoading(message: string): void {
  elements.loadingText.textContent = message;
  elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading(): void {
  elements.loadingOverlay.classList.add('hidden');
}

function showError(message: string): void {
  hideLoading();
  alert(message); // TODO: Replace with better error UI
}

// ============================================================================
// Highlight Event Handlers
// ============================================================================

/**
 * Handle vocabulary added event
 */
function handleVocabularyAdded(event: Event): void {
  const customEvent = event as CustomEvent;
  const vocab = customEvent.detail as VocabularyItem;

  // Add to state
  state.vocabularyItems.push(vocab);

  // Re-render vocabulary cards for current part
  if (state.currentArticle) {
    const part = state.currentArticle.parts[state.currentPartIndex];
    if (part) {
      renderPartVocabularyCards(part);
    }
  }
}

/**
 * Handle sentence added event
 */
function handleSentenceAdded(event: Event): void {
  const customEvent = event as CustomEvent;
  const sentence = customEvent.detail as SentenceItem;

  // Add to state
  state.sentenceItems.push(sentence);

  // Re-render sentence cards for current part
  if (state.currentArticle) {
    const part = state.currentArticle.parts[state.currentPartIndex];
    if (part) {
      renderPartSentenceCards(part);
    }
  }
}

/**
 * Handle vocabulary removed event
 */
function handleVocabularyRemoved(event: Event): void {
  const customEvent = event as CustomEvent;
  const { id } = customEvent.detail as { id: string };

  // Remove from state
  state.vocabularyItems = state.vocabularyItems.filter(v => v.id !== id);

  // Re-render vocabulary cards for current part
  if (state.currentArticle) {
    const part = state.currentArticle.parts[state.currentPartIndex];
    if (part) {
      renderPartVocabularyCards(part);
    }
  }
}

/**
 * Handle sentence removed event
 */
function handleSentenceRemoved(event: Event): void {
  const customEvent = event as CustomEvent;
  const { id } = customEvent.detail as { id: string };

  // Remove from state
  state.sentenceItems = state.sentenceItems.filter(s => s.id !== id);

  // Re-render sentence cards for current part
  if (state.currentArticle) {
    const part = state.currentArticle.parts[state.currentPartIndex];
    if (part) {
      renderPartSentenceCards(part);
    }
  }
}

/**
 * Handle context menu actions
 */
async function handleContextMenuAction(event: Event): Promise<void> {
  const target = event.target as HTMLElement;
  const action = target.dataset.action;
  const contextMenu = document.querySelector('.context-menu') as HTMLElement;

  if (!contextMenu) return;

  const itemId = contextMenu.dataset.itemId;
  const itemType = contextMenu.dataset.itemType as
    | 'vocabulary'
    | 'sentence'
    | 'selection'
    | 'paragraph';

  // Handle paragraph context menu
  if (itemType === 'paragraph') {
    if (action === 'copy') {
      const paragraph = (contextMenu as any)._paragraphElement as Element;
      if (paragraph) {
        try {
          // Get paragraph text (excluding the copy button)
          const copyButton = paragraph.querySelector('.paragraph-copy-btn');
          const textToCopy = Array.from(paragraph.childNodes)
            .filter(node => node !== copyButton)
            .map(node => node.textContent || '')
            .join('')
            .trim();

          // Copy to clipboard
          await navigator.clipboard.writeText(textToCopy);

          // Show tooltip
          showTooltip('Paragraph copied!');
        } catch (error) {
          console.error('Failed to copy paragraph:', error);
          showTooltip('Failed to copy paragraph');
        }
      }
    }
    contextMenu.classList.add('hidden');
    return;
  }

  // Handle selection context menu (None mode)
  if (itemType === 'selection') {
    if (
      action === 'add-vocabulary' ||
      action === 'add-sentence' ||
      action === 'pronounce'
    ) {
      const { handleSelectionContextMenuAction } = await import(
        './highlight-manager.js'
      );
      await handleSelectionContextMenuAction(action);
    }
    contextMenu.classList.add('hidden');
    return;
  }

  // Handle existing highlight context menu
  if (!itemId || !itemType) return;

  if (action === 'remove') {
    const { removeHighlight } = await import('./highlight-manager.js');
    await removeHighlight(itemId, itemType);

    // Direct state update and re-render as fallback
    if (itemType === 'vocabulary') {
      state.vocabularyItems = state.vocabularyItems.filter(
        v => v.id !== itemId
      );
      if (state.currentArticle) {
        const part = state.currentArticle.parts[state.currentPartIndex];
        if (part) {
          renderPartVocabularyCards(part);
        }
      }
    } else if (itemType === 'sentence') {
      state.sentenceItems = state.sentenceItems.filter(s => s.id !== itemId);
      if (state.currentArticle) {
        const part = state.currentArticle.parts[state.currentPartIndex];
        if (part) {
          renderPartSentenceCards(part);
        }
      }
    }
  } else if (action === 'change-to-sentence') {
    // Convert vocabulary to sentence
    const { convertVocabularyToSentence } = await import(
      './highlight-manager.js'
    );
    await convertVocabularyToSentence(itemId);

    // Reload vocabulary and sentences to reflect changes
    if (state.currentArticle) {
      await loadVocabularyAndSentences(state.currentArticle.id);
      const part = state.currentArticle.parts[state.currentPartIndex];
      if (part) {
        renderPartVocabularyCards(part);
        renderPartSentenceCards(part);
      }
    }
  } else if (action === 'change-to-vocabulary') {
    // Convert sentence to vocabulary
    const { convertSentenceToVocabulary } = await import(
      './highlight-manager.js'
    );
    await convertSentenceToVocabulary(itemId);

    // Reload vocabulary and sentences to reflect changes
    if (state.currentArticle) {
      await loadVocabularyAndSentences(state.currentArticle.id);
      const part = state.currentArticle.parts[state.currentPartIndex];
      if (part) {
        renderPartVocabularyCards(part);
        renderPartSentenceCards(part);
      }
    }
  } else if (action === 'pronounce') {
    // Get the highlight element and pronounce its text
    const highlightElement = document.querySelector(
      `[data-highlight-id="${itemId}"]`
    );
    if (highlightElement) {
      const text = highlightElement.textContent || '';
      await handlePronounceClick(
        highlightElement as HTMLElement,
        text,
        state.currentArticle?.originalLanguage
      );
    }
  }

  // Hide context menu
  contextMenu.classList.add('hidden');
}

// ============================================================================
// Memory Monitoring
// ============================================================================

function initializeMemoryMonitoring(): void {
  const memoryManager = getMemoryManager();

  // Add memory usage callback
  const unsubscribe = memoryManager.onMemoryUsageChange(
    (usage: ResourceUsage) => {
      updateMemoryIndicator(usage);

      // Show warning if memory usage is high
      if (usage.memory.percentage > 80) {
        showMemoryWarning(usage);
      }
    }
  );

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    unsubscribe();
  });
}

function updateMemoryIndicator(usage: ResourceUsage): void {
  // Create or update memory indicator in the UI
  let indicator = document.getElementById('memory-indicator');

  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'memory-indicator';
    indicator.className = 'memory-indicator';
    document.body.appendChild(indicator);
  }

  const memoryMB = (usage.memory.used / 1024 / 1024).toFixed(1);
  const storagePercent = usage.storage.percentage.toFixed(1);

  indicator.innerHTML = `
    <div class="memory-stats">
      <span>Memory: ${memoryMB}MB</span>
      <span>Storage: ${storagePercent}%</span>
      <span>Tabs: ${usage.activeTabs}</span>
    </div>
  `;

  // Add warning class if usage is high
  if (usage.memory.percentage > 80 || usage.storage.percentage > 80) {
    indicator.classList.add('warning');
  } else {
    indicator.classList.remove('warning');
  }
}

function showMemoryWarning(_usage: ResourceUsage): void {
  // Show a non-intrusive warning about high memory usage
  const warning = document.createElement('div');
  warning.className = 'memory-warning';
  warning.innerHTML = `
    <div class="warning-content">
      <span>⚠️ High memory usage detected</span>
      <button class="cleanup-btn">Clean up</button>
      <button class="dismiss-btn">×</button>
    </div>
  `;

  // Add event listeners
  const cleanupBtn = warning.querySelector('.cleanup-btn');
  const dismissBtn = warning.querySelector('.dismiss-btn');

  cleanupBtn?.addEventListener('click', async () => {
    const memoryManager = getMemoryManager();
    await memoryManager.forceCleanup();
    warning.remove();
  });

  dismissBtn?.addEventListener('click', () => {
    warning.remove();
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    warning.remove();
  }, 10000);

  document.body.appendChild(warning);
}

// ============================================================================
// Language Selector
// ============================================================================

/**
 * Initialize language selector
 */
async function initializeLanguageSelector(): Promise<void> {
  // Load saved target language
  const data = await chrome.storage.local.get('targetLanguage');
  state.targetLanguage = data.targetLanguage || 'en';

  // Set initial value
  const selectedLang = LANGUAGES.find(l => l.code === state.targetLanguage);
  if (selectedLang && elements.languageInput) {
    elements.languageInput.value = selectedLang.name;
  }

  // Populate language options
  populateLanguageOptions();

  // Setup event listeners
  if (elements.languageInput) {
    elements.languageInput.addEventListener('focus', () => {
      showLanguageDropdown();
    });

    elements.languageInput.addEventListener('input', () => {
      filterLanguageOptions(elements.languageInput.value);
    });

    elements.languageInput.addEventListener('blur', () => {
      // Delay to allow click on option
      setTimeout(() => {
        hideLanguageDropdown();
      }, 200);
    });
  }
}

/**
 * Populate language options
 */
function populateLanguageOptions(): void {
  if (!elements.languageOptions) return;

  elements.languageOptions.innerHTML = LANGUAGES.map(lang => {
    const isSelected = lang.code === state.targetLanguage;
    return `
    <div class="language-option ${isSelected ? 'selected' : ''}" data-code="${lang.code}">
      <span class="language-option-name">${escapeHtml(lang.name)}</span>
      ${isSelected ? '<span class="language-option-checkmark">✓</span>' : ''}
    </div>
  `;
  }).join('');

  // Add click listeners
  const options = elements.languageOptions.querySelectorAll('.language-option');
  options.forEach(option => {
    option.addEventListener('click', () => {
      const code = (option as HTMLElement).dataset.code;
      if (code) {
        void selectLanguage(code);
      }
    });
  });
}

/**
 * Show language dropdown
 */
function showLanguageDropdown(): void {
  if (elements.languageDropdown) {
    elements.languageDropdown.classList.add('active');
  }

  // Clear input to show all languages when dropdown opens
  if (elements.languageInput) {
    elements.languageInput.value = '';
  }

  // Show all languages initially
  filterLanguageOptions('');
}

/**
 * Hide language dropdown
 */
function hideLanguageDropdown(): void {
  if (elements.languageDropdown) {
    elements.languageDropdown.classList.remove('active');
  }
}

/**
 * Filter language options based on search
 */
function filterLanguageOptions(search: string): void {
  if (!elements.languageOptions) return;

  const searchLower = search.toLowerCase();
  const options = elements.languageOptions.querySelectorAll('.language-option');

  options.forEach(option => {
    const nameElement = option.querySelector('.language-option-name');
    const name = nameElement?.textContent?.toLowerCase() || '';
    if (name.includes(searchLower)) {
      (option as HTMLElement).style.display = 'flex';
    } else {
      (option as HTMLElement).style.display = 'none';
    }
  });
}

/**
 * Select a language
 */
async function selectLanguage(code: string): Promise<void> {
  const lang = LANGUAGES.find(l => l.code === code);
  if (!lang) return;

  const previousLanguage = state.targetLanguage;

  // Update state
  state.targetLanguage = code;

  // Update input to show selected language name
  if (elements.languageInput) {
    elements.languageInput.value = lang.name;
  }

  // Save to storage
  await chrome.storage.local.set({ targetLanguage: code });

  // Repopulate options to update checkmark
  populateLanguageOptions();

  // Hide dropdown
  hideLanguageDropdown();

  // Show confirmation with option to re-translate
  if (previousLanguage !== code && state.vocabularyItems.length > 0) {
    showLanguageChangeConfirmation(lang.name);
  } else {
    showTooltip(`Translation language set to ${lang.name}`);
  }
}

/**
 * Show language change confirmation with re-translate option
 */
function showLanguageChangeConfirmation(languageName: string): void {
  const confirmation = document.createElement('div');
  confirmation.className = 'language-change-confirmation';
  confirmation.innerHTML = `
    <div class="confirmation-content">
      <p>Translation language changed to <strong>${languageName}</strong></p>
      <p>Would you like to re-translate existing vocabulary?</p>
      <div class="confirmation-actions">
        <button class="btn-retranslate">Re-translate</button>
        <button class="btn-dismiss">Not now</button>
      </div>
    </div>
  `;

  document.body.appendChild(confirmation);

  // Add event listeners
  const retranslateBtn = confirmation.querySelector('.btn-retranslate');
  const dismissBtn = confirmation.querySelector('.btn-dismiss');

  retranslateBtn?.addEventListener('click', async () => {
    confirmation.remove();
    await retranslateAllVocabulary();
  });

  dismissBtn?.addEventListener('click', () => {
    confirmation.remove();
    showTooltip(`Translation language set to ${languageName}`);
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (document.body.contains(confirmation)) {
      confirmation.remove();
      showTooltip(`Translation language set to ${languageName}`);
    }
  }, 10000);
}

/**
 * Re-translate all vocabulary items to the new target language
 */
async function retranslateAllVocabulary(): Promise<void> {
  if (state.vocabularyItems.length === 0) return;

  showLoading(
    `Re-translating ${state.vocabularyItems.length} vocabulary items...`
  );

  try {
    let successCount = 0;
    let failCount = 0;

    // Re-translate each vocabulary item
    for (const vocab of state.vocabularyItems) {
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'TRANSLATE_TEXT',
          payload: {
            text: vocab.word,
            context: vocab.context,
            type: 'vocabulary',
            targetLanguage: state.targetLanguage,
            sourceLanguage: state.currentArticle?.originalLanguage,
          },
        });

        if (response.success) {
          // Update the vocabulary item with new translation
          vocab.translation = response.data.translation;
          successCount++;
        } else {
          failCount++;
          console.error('Failed to translate:', vocab.word, response.error);
        }
      } catch (error) {
        failCount++;
        console.error('Error translating:', vocab.word, error);
      }
    }

    // Save updated vocabulary to storage
    const vocabMap: Record<string, VocabularyItem> = {};
    state.vocabularyItems.forEach(v => {
      vocabMap[v.id] = v;
    });
    await chrome.storage.local.set({ vocabulary: vocabMap });

    // Re-render current part
    if (state.currentArticle) {
      const part = state.currentArticle.parts[state.currentPartIndex];
      if (part) {
        renderPartVocabularyCards(part);
      }
    }

    // Re-render vocabulary learning mode if active
    if (state.currentMode === 'vocabulary') {
      renderVocabularyLearningMode();
    }

    hideLoading();

    // Show result
    if (failCount === 0) {
      showTooltip(`✓ Successfully re-translated ${successCount} items`);
    } else {
      showTooltip(`Re-translated ${successCount} items (${failCount} failed)`);
    }
  } catch (error) {
    console.error('Error during re-translation:', error);
    hideLoading();
    showTooltip('Failed to re-translate vocabulary');
  }
}

// ============================================================================
// Initialize on page load
// ============================================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void initialize();
  });
} else {
  void initialize();
}
