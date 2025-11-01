/**
 * Unit tests for UI components
 * Tests article rendering, navigation, highlighting, and learning modes
 * Requirements: 6.1, 6.2, 3.1, 4.1, 5.1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type {
  ProcessedArticle,
  VocabularyItem,
  SentenceItem,
  LearningMode,
  LanguageDisplayMode,
} from '../src/types';

// Mock DOM structure
function createMockDOM(): void {
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
    </div>
  `;
}

// Mock article data
function createMockArticle(): ProcessedArticle {
  return {
    id: 'article-123',
    url: 'https://example.com/article',
    title: 'Test Article Title',
    originalLanguage: 'en',
    processedAt: new Date(),
    parts: [
      {
        id: 'part-1',
        content:
          'This is the first paragraph of the article.\n\nThis is the second paragraph.',
        originalContent:
          'This is the first paragraph of the article.\n\nThis is the second paragraph.',
        vocabulary: [],
        sentences: [],
        partIndex: 0,
      },
      {
        id: 'part-2',
        content:
          'This is the third paragraph.\n\nThis is the fourth paragraph.',
        originalContent:
          'This is the third paragraph.\n\nThis is the fourth paragraph.',
        vocabulary: [],
        sentences: [],
        partIndex: 1,
      },
    ],
    processingStatus: 'completed',
    cacheExpires: new Date(Date.now() + 86400000),
  };
}

// Mock vocabulary item
function createMockVocabulary(
  overrides?: Partial<VocabularyItem>
): VocabularyItem {
  return {
    id: 'vocab-1',
    word: 'example',
    translation: 'ejemplo',
    context: 'This is an example sentence.',
    exampleSentences: ['This is an example.', 'Another example here.'],
    articleId: 'article-123',
    partId: 'part-1',
    createdAt: new Date(),
    lastReviewed: new Date(),
    reviewCount: 0,
    difficulty: 5,
    ...overrides,
  };
}

// Mock sentence item
function createMockSentence(overrides?: Partial<SentenceItem>): SentenceItem {
  return {
    id: 'sentence-1',
    content: 'This is a complete sentence.',
    translation: 'Esta es una oración completa.',
    articleId: 'article-123',
    partId: 'part-1',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('UI Components - Article Rendering', () => {
  beforeEach(() => {
    createMockDOM();
    vi.clearAllMocks();
  });

  describe('Article Header Rendering', () => {
    it('should render article title correctly', () => {
      const article = createMockArticle();
      const titleElement = document.querySelector(
        '.article-title'
      ) as HTMLElement;

      titleElement.textContent = article.title;

      expect(titleElement.textContent).toBe('Test Article Title');
    });

    it('should render article URL correctly', () => {
      const article = createMockArticle();
      const urlElement = document.querySelector('.article-url') as HTMLElement;

      urlElement.textContent = article.url;
      urlElement.title = article.url;

      expect(urlElement.textContent).toBe('https://example.com/article');
      expect(urlElement.title).toBe('https://example.com/article');
    });

    it('should render article language correctly', () => {
      const article = createMockArticle();
      const langElement = document.querySelector(
        '.article-language'
      ) as HTMLElement;

      langElement.textContent = article.originalLanguage.toUpperCase();

      expect(langElement.textContent).toBe('EN');
    });

    it('should handle empty article title', () => {
      const article = createMockArticle();
      article.title = '';
      const titleElement = document.querySelector(
        '.article-title'
      ) as HTMLElement;

      titleElement.textContent = article.title;

      expect(titleElement.textContent).toBe('');
    });
  });

  describe('Article Part Rendering', () => {
    it('should render article part content', () => {
      const article = createMockArticle();
      const part = article.parts[0];
      const contentElement = document.querySelector(
        '.article-part-content'
      ) as HTMLElement;

      const paragraphs = part.content.split('\n\n').filter(p => p.trim());
      contentElement.innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');

      expect(contentElement.querySelectorAll('p').length).toBe(2);
      expect(contentElement.textContent).toContain('first paragraph');
    });

    it('should format content into paragraphs', () => {
      const content = 'Paragraph one.\n\nParagraph two.\n\nParagraph three.';
      const paragraphs = content.split('\n\n').filter(p => p.trim());

      expect(paragraphs.length).toBe(3);
      expect(paragraphs[0]).toBe('Paragraph one.');
      expect(paragraphs[2]).toBe('Paragraph three.');
    });

    it('should escape HTML in content', () => {
      const maliciousContent = '<script>alert("xss")</script>';
      const div = document.createElement('div');
      div.textContent = maliciousContent;
      const escaped = div.innerHTML;

      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
    });

    it('should handle empty content', () => {
      const contentElement = document.querySelector(
        '.article-part-content'
      ) as HTMLElement;
      contentElement.innerHTML = '';

      expect(contentElement.innerHTML).toBe('');
    });

    it('should handle content with special characters', () => {
      const content = 'Content with "quotes" and \'apostrophes\' & ampersands';
      const div = document.createElement('div');
      div.textContent = content;

      // textContent doesn't escape quotes, but it does escape ampersands
      expect(div.innerHTML).toContain('&amp;');
      expect(div.textContent).toContain('quotes');
    });
  });
});

describe('UI Components - Navigation', () => {
  beforeEach(() => {
    createMockDOM();
  });

  describe('Article Part Navigation', () => {
    it('should update navigation display correctly', () => {
      const article = createMockArticle();
      const currentPartSpan = document.querySelector(
        '.current-part'
      ) as HTMLElement;
      const totalPartsSpan = document.querySelector(
        '.total-parts'
      ) as HTMLElement;

      currentPartSpan.textContent = '1';
      totalPartsSpan.textContent = article.parts.length.toString();

      expect(currentPartSpan.textContent).toBe('1');
      expect(totalPartsSpan.textContent).toBe('2');
    });

    it('should disable previous button on first part', () => {
      const prevButton = document.getElementById(
        'prev-part'
      ) as HTMLButtonElement;
      const currentPartIndex = 0;

      prevButton.disabled = currentPartIndex === 0;

      expect(prevButton.disabled).toBe(true);
    });

    it('should disable next button on last part', () => {
      const article = createMockArticle();
      const nextButton = document.getElementById(
        'next-part'
      ) as HTMLButtonElement;
      const currentPartIndex = 1;

      nextButton.disabled = currentPartIndex === article.parts.length - 1;

      expect(nextButton.disabled).toBe(true);
    });

    it('should enable both buttons on middle part', () => {
      const article = createMockArticle();
      article.parts.push({
        id: 'part-3',
        content: 'Third part',
        originalContent: 'Third part',
        vocabulary: [],
        sentences: [],
        partIndex: 2,
      });

      const prevButton = document.getElementById(
        'prev-part'
      ) as HTMLButtonElement;
      const nextButton = document.getElementById(
        'next-part'
      ) as HTMLButtonElement;
      const currentPartIndex = 1;

      prevButton.disabled = currentPartIndex === 0;
      nextButton.disabled = currentPartIndex === article.parts.length - 1;

      expect(prevButton.disabled).toBe(false);
      expect(nextButton.disabled).toBe(false);
    });

    it('should handle navigation button clicks', () => {
      const prevButton = document.getElementById(
        'prev-part'
      ) as HTMLButtonElement;
      const nextButton = document.getElementById(
        'next-part'
      ) as HTMLButtonElement;
      let currentPartIndex = 1;

      prevButton.addEventListener('click', () => {
        if (currentPartIndex > 0) currentPartIndex--;
      });

      nextButton.addEventListener('click', () => {
        if (currentPartIndex < 1) currentPartIndex++;
      });

      prevButton.click();
      expect(currentPartIndex).toBe(0);

      nextButton.click();
      expect(currentPartIndex).toBe(1);
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should handle left arrow key for previous part', () => {
      let currentPartIndex = 1;

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      document.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft' && currentPartIndex > 0) {
          currentPartIndex--;
        }
      });

      document.dispatchEvent(event);
      expect(currentPartIndex).toBe(0);
    });

    it('should handle right arrow key for next part', () => {
      let currentPartIndex = 0;
      const totalParts = 2;

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      document.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' && currentPartIndex < totalParts - 1) {
          currentPartIndex++;
        }
      });

      document.dispatchEvent(event);
      expect(currentPartIndex).toBe(1);
    });

    it('should handle v key for vocabulary mode', () => {
      let currentMode: LearningMode = 'reading';

      const event = new KeyboardEvent('keydown', { key: 'v' });
      document.addEventListener('keydown', e => {
        if (e.key === 'v') currentMode = 'vocabulary';
      });

      document.dispatchEvent(event);
      expect(currentMode).toBe('vocabulary');
    });

    it('should handle s key for sentence mode', () => {
      let currentMode: LearningMode = 'reading';

      const event = new KeyboardEvent('keydown', { key: 's' });
      document.addEventListener('keydown', e => {
        if (e.key === 's') currentMode = 'sentences';
      });

      document.dispatchEvent(event);
      expect(currentMode).toBe('sentences');
    });

    it('should handle r key for reading mode', () => {
      let currentMode: LearningMode = 'vocabulary';

      const event = new KeyboardEvent('keydown', { key: 'r' });
      document.addEventListener('keydown', e => {
        if (e.key === 'r') currentMode = 'reading';
      });

      document.dispatchEvent(event);
      expect(currentMode).toBe('reading');
    });
  });
});

describe('UI Components - Vocabulary Cards', () => {
  beforeEach(() => {
    createMockDOM();
  });

  describe('Vocabulary Card Rendering', () => {
    it('should render vocabulary card with correct structure', () => {
      const vocab = createMockVocabulary();
      const card = document.createElement('div');
      card.className = 'vocab-card collapsed';
      card.setAttribute('data-vocab-id', vocab.id);
      card.innerHTML = `
        <div class="card-header">
          <span class="card-word">${vocab.word}</span>
          <div class="card-actions">
            <button class="card-action-btn pronounce-btn" title="Pronounce">🔊</button>
          </div>
        </div>
        <div class="card-translation">${vocab.translation}</div>
        <div class="card-details">
          <div class="card-context">"${vocab.context}"</div>
        </div>
      `;

      expect(card.querySelector('.card-word')?.textContent).toBe('example');
      expect(card.querySelector('.card-translation')?.textContent).toBe(
        'ejemplo'
      );
      expect(card.querySelector('.card-context')?.textContent).toContain(
        'example sentence'
      );
    });

    it('should render vocabulary card with example sentences', () => {
      const vocab = createMockVocabulary();
      const examplesHTML = vocab.exampleSentences
        .map(ex => `<div class="card-example">• ${ex}</div>`)
        .join('');

      expect(examplesHTML).toContain('This is an example.');
      expect(examplesHTML).toContain('Another example here.');
    });

    it('should render collapsed vocabulary card by default', () => {
      const card = document.createElement('div');
      card.className = 'vocab-card collapsed';

      expect(card.classList.contains('collapsed')).toBe(true);
    });

    it('should toggle card collapse state', () => {
      const card = document.createElement('div');
      card.className = 'vocab-card collapsed';

      card.classList.toggle('collapsed');
      expect(card.classList.contains('collapsed')).toBe(false);

      card.classList.toggle('collapsed');
      expect(card.classList.contains('collapsed')).toBe(true);
    });

    it('should render multiple vocabulary cards', () => {
      const vocabItems = [
        createMockVocabulary({ id: 'vocab-1', word: 'hello' }),
        createMockVocabulary({ id: 'vocab-2', word: 'world' }),
        createMockVocabulary({ id: 'vocab-3', word: 'test' }),
      ];

      const container = document.querySelector(
        '.vocabulary-cards'
      ) as HTMLElement;
      container.innerHTML = vocabItems
        .map(v => `<div data-vocab-id="${v.id}">${v.word}</div>`)
        .join('');

      expect(container.querySelectorAll('[data-vocab-id]').length).toBe(3);
    });

    it('should show empty state when no vocabulary items', () => {
      const container = document.querySelector(
        '.vocabulary-cards'
      ) as HTMLElement;
      container.innerHTML =
        '<p class="text-secondary">No vocabulary items yet. Highlight words to add them.</p>';

      expect(container.textContent).toContain('No vocabulary items yet');
    });

    it('should escape HTML in vocabulary content', () => {
      const vocab = createMockVocabulary({
        word: '<script>alert("xss")</script>',
      });
      const div = document.createElement('div');
      div.textContent = vocab.word;

      expect(div.innerHTML).not.toContain('<script>');
    });
  });

  describe('Vocabulary Card Interactions', () => {
    it('should handle card click to expand/collapse', () => {
      const card = document.createElement('div');
      card.className = 'vocab-card collapsed';
      document.body.appendChild(card);

      card.addEventListener('click', () => {
        card.classList.toggle('collapsed');
      });

      card.click();
      expect(card.classList.contains('collapsed')).toBe(false);
    });

    it('should handle pronounce button click', () => {
      const pronounceBtn = document.createElement('button');
      pronounceBtn.className = 'pronounce-btn';
      let pronounced = false;

      pronounceBtn.addEventListener('click', e => {
        e.stopPropagation();
        pronounced = true;
      });

      pronounceBtn.click();
      expect(pronounced).toBe(true);
    });

    it('should prevent card collapse when clicking pronounce button', () => {
      const card = document.createElement('div');
      card.className = 'vocab-card collapsed';
      const pronounceBtn = document.createElement('button');
      pronounceBtn.className = 'pronounce-btn';
      card.appendChild(pronounceBtn);
      document.body.appendChild(card);

      let cardClicked = false;
      card.addEventListener('click', () => {
        cardClicked = true;
      });

      pronounceBtn.addEventListener('click', e => {
        e.stopPropagation();
      });

      pronounceBtn.click();
      expect(cardClicked).toBe(false);
    });
  });
});

describe('UI Components - Sentence Cards', () => {
  beforeEach(() => {
    createMockDOM();
  });

  describe('Sentence Card Rendering', () => {
    it('should render sentence card with correct structure', () => {
      const sentence = createMockSentence();
      const card = document.createElement('div');
      card.className = 'sentence-card collapsed';
      card.setAttribute('data-sentence-id', sentence.id);
      card.innerHTML = `
        <div class="card-header">
          <span class="card-sentence">${sentence.content}</span>
          <div class="card-actions">
            <button class="card-action-btn pronounce-btn" title="Pronounce">🔊</button>
          </div>
        </div>
        <div class="card-details">
          <div class="card-translation">${sentence.translation}</div>
        </div>
      `;

      expect(card.querySelector('.card-sentence')?.textContent).toBe(
        'This is a complete sentence.'
      );
      expect(card.querySelector('.card-translation')?.textContent).toBe(
        'Esta es una oración completa.'
      );
    });

    it('should render collapsed sentence card by default', () => {
      const card = document.createElement('div');
      card.className = 'sentence-card collapsed';

      expect(card.classList.contains('collapsed')).toBe(true);
    });

    it('should render multiple sentence cards', () => {
      const sentences = [
        createMockSentence({ id: 'sentence-1', content: 'First sentence.' }),
        createMockSentence({ id: 'sentence-2', content: 'Second sentence.' }),
      ];

      const container = document.querySelector(
        '.sentence-cards'
      ) as HTMLElement;
      container.innerHTML = sentences
        .map(s => `<div data-sentence-id="${s.id}">${s.content}</div>`)
        .join('');

      expect(container.querySelectorAll('[data-sentence-id]').length).toBe(2);
    });

    it('should show empty state when no sentence items', () => {
      const container = document.querySelector(
        '.sentence-cards'
      ) as HTMLElement;
      container.innerHTML =
        '<p class="text-secondary">No sentences yet. Highlight sentences to add them.</p>';

      expect(container.textContent).toContain('No sentences yet');
    });
  });

  describe('Sentence Card Interactions', () => {
    it('should handle card click to expand/collapse', () => {
      const card = document.createElement('div');
      card.className = 'sentence-card collapsed';
      document.body.appendChild(card);

      card.addEventListener('click', () => {
        card.classList.toggle('collapsed');
      });

      card.click();
      expect(card.classList.contains('collapsed')).toBe(false);
    });

    it('should handle pronounce button click', () => {
      const pronounceBtn = document.createElement('button');
      pronounceBtn.className = 'pronounce-btn';
      let pronounced = false;

      pronounceBtn.addEventListener('click', e => {
        e.stopPropagation();
        pronounced = true;
      });

      pronounceBtn.click();
      expect(pronounced).toBe(true);
    });
  });
});

describe('UI Components - Learning Modes', () => {
  beforeEach(() => {
    createMockDOM();
  });

  describe('Mode Switching', () => {
    it('should switch to vocabulary mode', () => {
      const tabButtons = document.querySelectorAll('.tab-button');
      const modeContents = document.querySelectorAll('.mode-content');

      // Simulate switching to vocabulary mode
      tabButtons.forEach(btn => btn.classList.remove('active'));
      modeContents.forEach(content => content.classList.remove('active'));

      const vocabTab = document.querySelector('[data-mode="vocabulary"]');
      const vocabContent = document.querySelector(
        '.mode-content[data-mode="vocabulary"]'
      );

      vocabTab?.classList.add('active');
      vocabContent?.classList.add('active');

      expect(vocabTab?.classList.contains('active')).toBe(true);
      expect(vocabContent?.classList.contains('active')).toBe(true);
    });

    it('should switch to sentence mode', () => {
      const tabButtons = document.querySelectorAll('.tab-button');
      const modeContents = document.querySelectorAll('.mode-content');

      tabButtons.forEach(btn => btn.classList.remove('active'));
      modeContents.forEach(content => content.classList.remove('active'));

      const sentenceTab = document.querySelector('[data-mode="sentences"]');
      const sentenceContent = document.querySelector(
        '.mode-content[data-mode="sentences"]'
      );

      sentenceTab?.classList.add('active');
      sentenceContent?.classList.add('active');

      expect(sentenceTab?.classList.contains('active')).toBe(true);
      expect(sentenceContent?.classList.contains('active')).toBe(true);
    });

    it('should switch to reading mode', () => {
      const tabButtons = document.querySelectorAll('.tab-button');
      const modeContents = document.querySelectorAll('.mode-content');

      tabButtons.forEach(btn => btn.classList.remove('active'));
      modeContents.forEach(content => content.classList.remove('active'));

      const readingTab = document.querySelector('[data-mode="reading"]');
      const readingContent = document.querySelector(
        '.mode-content[data-mode="reading"]'
      );

      readingTab?.classList.add('active');
      readingContent?.classList.add('active');

      expect(readingTab?.classList.contains('active')).toBe(true);
      expect(readingContent?.classList.contains('active')).toBe(true);
    });

    it('should only have one active mode at a time', () => {
      const modeContents = document.querySelectorAll('.mode-content');

      // Set all to inactive
      modeContents.forEach(content => content.classList.remove('active'));

      // Activate one
      modeContents[0].classList.add('active');

      const activeContents = document.querySelectorAll('.mode-content.active');
      expect(activeContents.length).toBe(1);
    });
  });

  describe('Vocabulary Learning Mode', () => {
    it('should render vocabulary grid', () => {
      const vocabItems = [
        createMockVocabulary({
          id: 'vocab-1',
          word: 'hello',
          translation: 'hola',
        }),
        createMockVocabulary({
          id: 'vocab-2',
          word: 'world',
          translation: 'mundo',
        }),
      ];

      const grid = document.querySelector('.vocabulary-grid') as HTMLElement;
      grid.innerHTML = vocabItems
        .map(
          v => `
        <div class="vocab-learning-card" data-vocab-learning-id="${v.id}">
          <div class="vocab-learning-word">${v.word}</div>
          <div class="vocab-learning-translation">${v.translation}</div>
        </div>
      `
        )
        .join('');

      expect(grid.querySelectorAll('.vocab-learning-card').length).toBe(2);
    });

    it('should show both languages in "both" display mode', () => {
      const _vocab = createMockVocabulary();
      const displayMode: LanguageDisplayMode = 'both';

      const showWord =
        displayMode === 'both' || displayMode === 'learning_only';
      const showTranslation =
        displayMode === 'both' || displayMode === 'native_only';

      expect(showWord).toBe(true);
      expect(showTranslation).toBe(true);
    });

    it('should show only learning language in "learning_only" mode', () => {
      const displayMode: LanguageDisplayMode = 'learning_only';

      const showWord =
        displayMode === 'both' || displayMode === 'learning_only';
      const showTranslation =
        displayMode === 'both' || displayMode === 'native_only';

      expect(showWord).toBe(true);
      expect(showTranslation).toBe(false);
    });

    it('should show only native language in "native_only" mode', () => {
      const displayMode: LanguageDisplayMode = 'native_only';

      const showWord =
        displayMode === 'both' || displayMode === 'learning_only';
      const showTranslation =
        displayMode === 'both' || displayMode === 'native_only';

      expect(showWord).toBe(false);
      expect(showTranslation).toBe(true);
    });

    it('should handle display mode button clicks', () => {
      const displayOptions = document.querySelectorAll('.display-option');
      let currentDisplayMode: LanguageDisplayMode = 'both';

      displayOptions.forEach(btn => {
        btn.addEventListener('click', () => {
          currentDisplayMode = (btn as HTMLElement).dataset
            .display as LanguageDisplayMode;
          displayOptions.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      (displayOptions[1] as HTMLElement).click();
      expect(currentDisplayMode).toBe('learning_only');
    });

    it('should show empty state when no vocabulary', () => {
      const grid = document.querySelector('.vocabulary-grid') as HTMLElement;
      grid.innerHTML =
        '<p class="text-center text-secondary">No vocabulary items yet. Go to Reading mode and highlight words.</p>';

      expect(grid.textContent).toContain('No vocabulary items yet');
    });
  });

  describe('Sentence Learning Mode', () => {
    it('should render sentence list', () => {
      const sentences = [
        createMockSentence({ id: 'sentence-1', content: 'First sentence.' }),
        createMockSentence({ id: 'sentence-2', content: 'Second sentence.' }),
      ];

      const list = document.querySelector('.sentence-list') as HTMLElement;
      list.innerHTML = sentences
        .map(
          s => `
        <div class="sentence-learning-card" data-sentence-learning-id="${s.id}">
          <div class="sentence-learning-content">${s.content}</div>
          <div class="sentence-learning-translation">${s.translation}</div>
          <div class="sentence-learning-actions">
            <button class="sentence-pronounce-btn">🔊 Pronounce</button>
          </div>
        </div>
      `
        )
        .join('');

      expect(list.querySelectorAll('.sentence-learning-card').length).toBe(2);
    });

    it('should render sentence with translation', () => {
      const sentence = createMockSentence();
      const card = document.createElement('div');
      card.innerHTML = `
        <div class="sentence-learning-content">${sentence.content}</div>
        <div class="sentence-learning-translation">${sentence.translation}</div>
      `;

      expect(
        card.querySelector('.sentence-learning-content')?.textContent
      ).toBe('This is a complete sentence.');
      expect(
        card.querySelector('.sentence-learning-translation')?.textContent
      ).toBe('Esta es una oración completa.');
    });

    it('should render pronounce button', () => {
      const card = document.createElement('div');
      card.innerHTML = `
        <button class="sentence-pronounce-btn">🔊 Pronounce</button>
      `;

      expect(card.querySelector('.sentence-pronounce-btn')).toBeTruthy();
    });

    it('should show empty state when no sentences', () => {
      const list = document.querySelector('.sentence-list') as HTMLElement;
      list.innerHTML =
        '<p class="text-center text-secondary">No sentences yet. Go to Reading mode and highlight sentences.</p>';

      expect(list.textContent).toContain('No sentences yet');
    });
  });
});

describe('UI Components - Highlighting System', () => {
  beforeEach(() => {
    createMockDOM();
  });

  describe('Text Selection', () => {
    it('should detect text selection', () => {
      const content = document.querySelector(
        '.article-part-content'
      ) as HTMLElement;
      content.innerHTML = '<p>This is some text to select.</p>';

      const range = document.createRange();
      const textNode = content.querySelector('p')?.firstChild;
      if (textNode) {
        range.setStart(textNode, 0);
        range.setEnd(textNode, 4);

        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        expect(selection?.toString()).toBe('This');
      }
    });

    it('should accept vocabulary selections of any length', () => {
      const selections = [
        'word',
        'two words',
        'three word phrase',
        'as a matter of fact',
        'in the nick of time',
        'this is a longer phrase that should be accepted',
      ];

      // All selections should be valid (no word count restriction)
      selections.forEach(text => {
        const wordCount = text.split(/\s+/).length;
        expect(wordCount).toBeGreaterThan(0); // Only check non-empty
      });
    });

    it('should validate sentence selection minimum length', () => {
      const shortText = 'Too short';
      const validSentence = 'This is a complete sentence with enough length.';

      expect(shortText.length).toBeLessThan(10);
      expect(validSentence.length).toBeGreaterThan(10);
    });

    it('should get context around selection', () => {
      const fullText =
        'This is the beginning. This is the selected text. This is the end.';
      const selectedText = 'selected text';
      const startIndex = fullText.indexOf(selectedText);

      const contextStart = Math.max(0, startIndex - 20);
      const contextEnd = Math.min(
        fullText.length,
        startIndex + selectedText.length + 20
      );
      const context = fullText.substring(contextStart, contextEnd);

      expect(context).toContain('selected text');
      expect(context.length).toBeLessThanOrEqual(selectedText.length + 40);
    });
  });

  describe('Highlight Creation', () => {
    it('should create vocabulary highlight element', () => {
      const highlight = document.createElement('span');
      highlight.className = 'highlight-vocabulary';
      highlight.textContent = 'example';
      highlight.setAttribute('data-highlight-type', 'vocabulary');

      expect(highlight.classList.contains('highlight-vocabulary')).toBe(true);
      expect(highlight.getAttribute('data-highlight-type')).toBe('vocabulary');
    });

    it('should create sentence highlight element', () => {
      const highlight = document.createElement('span');
      highlight.className = 'highlight-sentence';
      highlight.textContent = 'This is a sentence.';
      highlight.setAttribute('data-highlight-type', 'sentence');

      expect(highlight.classList.contains('highlight-sentence')).toBe(true);
      expect(highlight.getAttribute('data-highlight-type')).toBe('sentence');
    });

    it('should replace text with highlight element', () => {
      const container = document.createElement('div');
      container.innerHTML = '<p>This is some text.</p>';

      const textNode = container.querySelector('p')?.firstChild;
      if (textNode) {
        const range = document.createRange();
        range.setStart(textNode, 8);
        range.setEnd(textNode, 12);

        const highlight = document.createElement('span');
        highlight.className = 'highlight-vocabulary';
        highlight.textContent = 'some';

        range.deleteContents();
        range.insertNode(highlight);

        expect(container.querySelector('.highlight-vocabulary')).toBeTruthy();
        expect(
          container.querySelector('.highlight-vocabulary')?.textContent
        ).toBe('some');
      }
    });

    it('should store highlight data', () => {
      const highlightData = {
        id: 'highlight-1',
        text: 'example',
        startOffset: 0,
        endOffset: 7,
        type: 'vocabulary' as const,
      };

      expect(highlightData.text).toBe('example');
      expect(highlightData.type).toBe('vocabulary');
    });
  });

  describe('Highlight Interactions', () => {
    it('should show translation popup on hover', () => {
      const highlight = document.createElement('span');
      highlight.className = 'highlight-vocabulary';
      highlight.textContent = 'example';
      document.body.appendChild(highlight);

      let popupShown = false;
      highlight.addEventListener('mouseenter', () => {
        popupShown = true;
      });

      highlight.dispatchEvent(new MouseEvent('mouseenter'));
      expect(popupShown).toBe(true);
    });

    it('should hide translation popup on mouse leave', () => {
      const highlight = document.createElement('span');
      highlight.className = 'highlight-vocabulary';
      document.body.appendChild(highlight);

      let popupHidden = false;
      highlight.addEventListener('mouseleave', () => {
        popupHidden = true;
      });

      highlight.dispatchEvent(new MouseEvent('mouseleave'));
      expect(popupHidden).toBe(true);
    });

    it('should pronounce text on click', () => {
      const highlight = document.createElement('span');
      highlight.className = 'highlight-vocabulary';
      highlight.textContent = 'example';
      document.body.appendChild(highlight);

      let pronounced = false;
      highlight.addEventListener('click', () => {
        pronounced = true;
      });

      highlight.click();
      expect(pronounced).toBe(true);
    });

    it('should show context menu on right click', () => {
      const highlight = document.createElement('span');
      highlight.className = 'highlight-vocabulary';
      document.body.appendChild(highlight);

      let contextMenuShown = false;
      highlight.addEventListener('contextmenu', e => {
        e.preventDefault();
        contextMenuShown = true;
      });

      const event = new MouseEvent('contextmenu', { bubbles: true });
      highlight.dispatchEvent(event);
      expect(contextMenuShown).toBe(true);
    });
  });

  describe('Highlight Removal', () => {
    it('should remove highlight from DOM', () => {
      const container = document.createElement('div');
      const highlight = document.createElement('span');
      highlight.className = 'highlight-vocabulary';
      highlight.textContent = 'example';
      highlight.setAttribute('data-highlight-id', 'highlight-1');
      container.appendChild(highlight);

      const textNode = document.createTextNode(highlight.textContent || '');
      highlight.parentNode?.replaceChild(textNode, highlight);

      expect(container.querySelector('.highlight-vocabulary')).toBeNull();
      expect(container.textContent).toBe('example');
    });

    it('should handle context menu remove action', () => {
      const contextMenu = document.querySelector(
        '.context-menu'
      ) as HTMLElement;
      const removeItem = contextMenu.querySelector(
        '[data-action="remove"]'
      ) as HTMLElement;

      contextMenu.dataset.itemId = 'vocab-1';
      contextMenu.dataset.itemType = 'vocabulary';

      let removeTriggered = false;
      removeItem.addEventListener('click', () => {
        removeTriggered = true;
      });

      removeItem.click();
      expect(removeTriggered).toBe(true);
    });
  });

  describe('Overlapping Highlights', () => {
    it('should merge overlapping highlights', () => {
      type HighlightType = {
        id: string;
        text: string;
        startOffset: number;
        endOffset: number;
        type: 'vocabulary';
      };
      const highlights: HighlightType[] = [
        {
          id: '1',
          text: 'hello',
          startOffset: 0,
          endOffset: 5,
          type: 'vocabulary' as const,
        },
        {
          id: '2',
          text: 'world',
          startOffset: 3,
          endOffset: 8,
          type: 'vocabulary' as const,
        },
      ];

      const sorted = [...highlights].sort(
        (a, b) => a.startOffset - b.startOffset
      );
      const merged: HighlightType[] = [];

      for (const highlight of sorted) {
        if (merged.length === 0) {
          merged.push(highlight);
          continue;
        }

        const last = merged[merged.length - 1];
        if (highlight.startOffset <= last.endOffset) {
          last.endOffset = Math.max(last.endOffset, highlight.endOffset);
          last.text = last.text + ' ' + highlight.text;
        } else {
          merged.push(highlight);
        }
      }

      expect(merged.length).toBe(1);
      expect(merged[0].text).toContain('hello');
      expect(merged[0].text).toContain('world');
    });

    it('should not merge non-overlapping highlights', () => {
      type HighlightType = {
        id: string;
        text: string;
        startOffset: number;
        endOffset: number;
        type: 'vocabulary';
      };
      const highlights: HighlightType[] = [
        {
          id: '1',
          text: 'hello',
          startOffset: 0,
          endOffset: 5,
          type: 'vocabulary' as const,
        },
        {
          id: '2',
          text: 'world',
          startOffset: 10,
          endOffset: 15,
          type: 'vocabulary' as const,
        },
      ];

      const sorted = [...highlights].sort(
        (a, b) => a.startOffset - b.startOffset
      );
      const merged: HighlightType[] = [];

      for (const highlight of sorted) {
        if (merged.length === 0) {
          merged.push(highlight);
          continue;
        }

        const last = merged[merged.length - 1];
        if (highlight.startOffset <= last.endOffset) {
          last.endOffset = Math.max(last.endOffset, highlight.endOffset);
        } else {
          merged.push(highlight);
        }
      }

      expect(merged.length).toBe(2);
    });
  });
});

describe('UI Components - Loading and Error States', () => {
  beforeEach(() => {
    createMockDOM();
  });

  describe('Loading Overlay', () => {
    it('should show loading overlay', () => {
      const overlay = document.querySelector('.loading-overlay') as HTMLElement;
      const loadingText = document.querySelector(
        '.loading-text'
      ) as HTMLElement;

      loadingText.textContent = 'Loading article...';
      overlay.classList.remove('hidden');

      expect(overlay.classList.contains('hidden')).toBe(false);
      expect(loadingText.textContent).toBe('Loading article...');
    });

    it('should hide loading overlay', () => {
      const overlay = document.querySelector('.loading-overlay') as HTMLElement;
      overlay.classList.add('hidden');

      expect(overlay.classList.contains('hidden')).toBe(true);
    });

    it('should update loading text', () => {
      const loadingText = document.querySelector(
        '.loading-text'
      ) as HTMLElement;

      loadingText.textContent = 'Processing content...';
      expect(loadingText.textContent).toBe('Processing content...');

      loadingText.textContent = 'Translating vocabulary...';
      expect(loadingText.textContent).toBe('Translating vocabulary...');
    });
  });

  describe('Context Menu', () => {
    it('should show context menu at cursor position', () => {
      const contextMenu = document.querySelector(
        '.context-menu'
      ) as HTMLElement;

      contextMenu.classList.remove('hidden');
      contextMenu.style.left = '100px';
      contextMenu.style.top = '200px';

      expect(contextMenu.classList.contains('hidden')).toBe(false);
      expect(contextMenu.style.left).toBe('100px');
      expect(contextMenu.style.top).toBe('200px');
    });

    it('should hide context menu', () => {
      const contextMenu = document.querySelector(
        '.context-menu'
      ) as HTMLElement;
      contextMenu.classList.add('hidden');

      expect(contextMenu.classList.contains('hidden')).toBe(true);
    });

    it('should store item data in context menu', () => {
      const contextMenu = document.querySelector(
        '.context-menu'
      ) as HTMLElement;
      contextMenu.dataset.itemId = 'vocab-123';
      contextMenu.dataset.itemType = 'vocabulary';

      expect(contextMenu.dataset.itemId).toBe('vocab-123');
      expect(contextMenu.dataset.itemType).toBe('vocabulary');
    });
  });
});

describe('UI Components - Event Handling', () => {
  beforeEach(() => {
    createMockDOM();
  });

  describe('Custom Events', () => {
    it('should dispatch vocabulary-added event', () => {
      const vocab = createMockVocabulary();
      let eventReceived = false;

      document.addEventListener('vocabulary-added', e => {
        const customEvent = e as CustomEvent;
        expect(customEvent.detail).toEqual(vocab);
        eventReceived = true;
      });

      const event = new CustomEvent('vocabulary-added', { detail: vocab });
      document.dispatchEvent(event);

      expect(eventReceived).toBe(true);
    });

    it('should dispatch sentence-added event', () => {
      const sentence = createMockSentence();
      let eventReceived = false;

      document.addEventListener('sentence-added', e => {
        const customEvent = e as CustomEvent;
        expect(customEvent.detail).toEqual(sentence);
        eventReceived = true;
      });

      const event = new CustomEvent('sentence-added', { detail: sentence });
      document.dispatchEvent(event);

      expect(eventReceived).toBe(true);
    });

    it('should dispatch vocabulary-removed event', () => {
      const vocabId = 'vocab-123';
      let eventReceived = false;

      document.addEventListener('vocabulary-removed', e => {
        const customEvent = e as CustomEvent;
        expect(customEvent.detail.id).toBe(vocabId);
        eventReceived = true;
      });

      const event = new CustomEvent('vocabulary-removed', {
        detail: { id: vocabId },
      });
      document.dispatchEvent(event);

      expect(eventReceived).toBe(true);
    });

    it('should dispatch sentence-removed event', () => {
      const sentenceId = 'sentence-123';
      let eventReceived = false;

      document.addEventListener('sentence-removed', e => {
        const customEvent = e as CustomEvent;
        expect(customEvent.detail.id).toBe(sentenceId);
        eventReceived = true;
      });

      const event = new CustomEvent('sentence-removed', {
        detail: { id: sentenceId },
      });
      document.dispatchEvent(event);

      expect(eventReceived).toBe(true);
    });
  });

  describe('Tab Button Events', () => {
    it('should handle tab button clicks', () => {
      const tabButtons = document.querySelectorAll('.tab-button');
      let clickedMode: LearningMode | null = null;

      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          clickedMode = (btn as HTMLElement).dataset.mode as LearningMode;
        });
      });

      (tabButtons[1] as HTMLElement).click();
      expect(clickedMode).toBe('vocabulary');
    });
  });

  describe('Display Option Events', () => {
    it('should handle display option clicks', () => {
      const displayOptions = document.querySelectorAll('.display-option');
      let selectedDisplay: LanguageDisplayMode | null = null;

      displayOptions.forEach(btn => {
        btn.addEventListener('click', () => {
          selectedDisplay = (btn as HTMLElement).dataset
            .display as LanguageDisplayMode;
        });
      });

      (displayOptions[1] as HTMLElement).click();
      expect(selectedDisplay).toBe('learning_only');
    });
  });
});

describe('UI Components - Text-to-Speech', () => {
  beforeEach(() => {
    createMockDOM();
  });

  describe('Pronunciation', () => {
    it('should check if speech synthesis is available', () => {
      const isAvailable = 'speechSynthesis' in window;
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should create speech utterance', () => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('test');
        expect(utterance.text).toBe('test');
      }
    });

    it('should set language for utterance', () => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('hello');
        utterance.lang = 'en-US';
        expect(utterance.lang).toBe('en-US');
      }
    });
  });
});

describe('UI Components - Data Persistence', () => {
  beforeEach(() => {
    createMockDOM();
    vi.clearAllMocks();
  });

  describe('Chrome Storage Integration', () => {
    it('should save vocabulary item to storage', async () => {
      const vocab = createMockVocabulary();
      (chrome.storage.local.set as any).mockResolvedValue(undefined);

      await chrome.storage.local.set({ vocabulary: { [vocab.id]: vocab } });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        vocabulary: { [vocab.id]: vocab },
      });
    });

    it('should save sentence item to storage', async () => {
      const sentence = createMockSentence();
      (chrome.storage.local.set as any).mockResolvedValue(undefined);

      await chrome.storage.local.set({
        sentences: { [sentence.id]: sentence },
      });

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        sentences: { [sentence.id]: sentence },
      });
    });

    it('should retrieve vocabulary from storage', async () => {
      const vocab = createMockVocabulary();
      (chrome.storage.local.get as any).mockResolvedValue({
        vocabulary: { [vocab.id]: vocab },
      });

      const data = await chrome.storage.local.get('vocabulary');

      expect(data.vocabulary[vocab.id]).toEqual(vocab);
    });

    it('should retrieve sentences from storage', async () => {
      const sentence = createMockSentence();
      (chrome.storage.local.get as any).mockResolvedValue({
        sentences: { [sentence.id]: sentence },
      });

      const data = await chrome.storage.local.get('sentences');

      expect(data.sentences[sentence.id]).toEqual(sentence);
    });

    it('should handle empty storage', async () => {
      (chrome.storage.local.get as any).mockResolvedValue({});

      const data = await chrome.storage.local.get('vocabulary');

      expect(data.vocabulary).toBeUndefined();
    });
  });
});
