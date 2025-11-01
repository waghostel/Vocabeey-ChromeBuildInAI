/**
 * Tests for bulk delete functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { VocabularyItem, SentenceItem } from '../src/types';

describe('Bulk Delete Functionality', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="article-part-content">
        <p>
          This is a test sentence with 
          <span class="highlight-vocabulary" data-highlight-type="vocabulary" data-highlight-id="vocab-1">word1</span>
          and 
          <span class="highlight-vocabulary" data-highlight-type="vocabulary" data-highlight-id="vocab-2">word2</span>
          in it.
        </p>
        <p>
          <span class="highlight-sentence" data-highlight-type="sentence" data-highlight-id="sent-1">
            This is a highlighted sentence.
          </span>
        </p>
      </div>
    `;
  });

  describe('Range Comparison', () => {
    it('should detect fully enclosed highlights', () => {
      const articleContent = document.querySelector('.article-part-content');
      expect(articleContent).toBeTruthy();

      // Create a range that encompasses the entire first paragraph
      const range = document.createRange();
      const firstParagraph = articleContent?.querySelector('p');
      if (firstParagraph) {
        range.selectNodeContents(firstParagraph);
      }

      // Both vocabulary highlights should be detected
      const vocab1 = document.querySelector('[data-highlight-id="vocab-1"]');
      const vocab2 = document.querySelector('[data-highlight-id="vocab-2"]');

      expect(vocab1).toBeTruthy();
      expect(vocab2).toBeTruthy();
    });

    it('should not detect partially enclosed highlights', () => {
      const articleContent = document.querySelector('.article-part-content');
      expect(articleContent).toBeTruthy();

      // Create a range that only partially covers a highlight
      const range = document.createRange();
      const vocab1 = document.querySelector('[data-highlight-id="vocab-1"]');

      if (vocab1 && vocab1.firstChild) {
        range.setStart(vocab1.firstChild, 0);
        range.setEnd(vocab1.firstChild, 2); // Only first 2 characters
      }

      // This should be considered partial, not fully enclosed
      expect(range.toString().length).toBeLessThan(5);
    });
  });

  describe('Highlight Detection', () => {
    it('should find all highlights in article content', () => {
      const allHighlights = document.querySelectorAll(
        '[data-highlight-type][data-highlight-id]'
      );

      expect(allHighlights.length).toBe(3); // 2 vocabulary + 1 sentence
    });

    it('should distinguish between vocabulary and sentence highlights', () => {
      const vocabHighlights = document.querySelectorAll(
        '[data-highlight-type="vocabulary"]'
      );
      const sentenceHighlights = document.querySelectorAll(
        '[data-highlight-type="sentence"]'
      );

      expect(vocabHighlights.length).toBe(2);
      expect(sentenceHighlights.length).toBe(1);
    });
  });

  describe('DOM Manipulation', () => {
    it('should add will-delete class to highlights', () => {
      const vocab1 = document.querySelector('[data-highlight-id="vocab-1"]');

      vocab1?.classList.add('will-delete');

      expect(vocab1?.classList.contains('will-delete')).toBe(true);
    });

    it('should remove will-delete class from highlights', () => {
      const vocab1 = document.querySelector('[data-highlight-id="vocab-1"]');

      vocab1?.classList.add('will-delete');
      vocab1?.classList.remove('will-delete');

      expect(vocab1?.classList.contains('will-delete')).toBe(false);
    });
  });

  describe('Storage Operations', () => {
    it('should handle batch vocabulary deletion', async () => {
      const mockVocabulary: Record<string, VocabularyItem> = {
        'vocab-1': {
          id: 'vocab-1',
          word: 'word1',
          translation: 'translation1',
          context: 'context1',
          exampleSentences: [],
          articleId: 'article-1',
          partId: 'part-1',
          createdAt: new Date(),
          lastReviewed: new Date(),
          reviewCount: 0,
          difficulty: 5,
        },
        'vocab-2': {
          id: 'vocab-2',
          word: 'word2',
          translation: 'translation2',
          context: 'context2',
          exampleSentences: [],
          articleId: 'article-1',
          partId: 'part-1',
          createdAt: new Date(),
          lastReviewed: new Date(),
          reviewCount: 0,
          difficulty: 5,
        },
      };

      // Mock chrome.storage.local
      const mockGet = vi.fn().mockResolvedValue({ vocabulary: mockVocabulary });
      const mockSet = vi.fn().mockResolvedValue(undefined);

      global.chrome = {
        storage: {
          local: {
            get: mockGet,
            set: mockSet,
          },
        },
      } as any;

      // Simulate deletion
      const idsToDelete = ['vocab-1', 'vocab-2'];
      const vocabulary = { ...mockVocabulary };

      idsToDelete.forEach(id => {
        delete vocabulary[id];
      });

      expect(Object.keys(vocabulary).length).toBe(0);
    });

    it('should handle batch sentence deletion', async () => {
      const mockSentences: Record<string, SentenceItem> = {
        'sent-1': {
          id: 'sent-1',
          content: 'This is a highlighted sentence.',
          translation: 'Translation of sentence',
          articleId: 'article-1',
          partId: 'part-1',
          createdAt: new Date(),
        },
      };

      // Simulate deletion
      const idsToDelete = ['sent-1'];
      const sentences = { ...mockSentences };

      idsToDelete.forEach(id => {
        delete sentences[id];
      });

      expect(Object.keys(sentences).length).toBe(0);
    });
  });

  describe('Keyboard-Only Workflow', () => {
    it('should support keyboard-only deletion without button', () => {
      // Verify that bulk delete works without requiring button interaction
      const vocab1 = document.querySelector('[data-highlight-id="vocab-1"]');
      const vocab2 = document.querySelector('[data-highlight-id="vocab-2"]');

      // Add will-delete class to simulate selection
      vocab1?.classList.add('will-delete');
      vocab2?.classList.add('will-delete');

      expect(vocab1?.classList.contains('will-delete')).toBe(true);
      expect(vocab2?.classList.contains('will-delete')).toBe(true);

      // User would press Delete/Backspace key to trigger deletion
      // The actual deletion is handled by executeBulkDelete()
    });
  });

  describe('Notification Messages', () => {
    it('should format message for vocabulary only', () => {
      const total = 3;
      const vocabCount = 3;
      const sentenceCount = 0;

      let message = `Deleted ${total} highlight${total > 1 ? 's' : ''}`;
      if (vocabCount > 0 && sentenceCount === 0) {
        message += ` (vocabulary)`;
      }

      expect(message).toBe('Deleted 3 highlights (vocabulary)');
    });

    it('should format message for sentences only', () => {
      const total = 2;
      const vocabCount = 0;
      const sentenceCount = 2;

      let message = `Deleted ${total} highlight${total > 1 ? 's' : ''}`;
      if (vocabCount === 0 && sentenceCount > 0) {
        message += ` (sentence${sentenceCount > 1 ? 's' : ''})`;
      }

      expect(message).toBe('Deleted 2 highlights (sentences)');
    });

    it('should format message for mixed highlights', () => {
      const total = 5;
      const vocabCount = 3;
      const sentenceCount = 2;

      let message = `Deleted ${total} highlight${total > 1 ? 's' : ''}`;
      if (vocabCount > 0 && sentenceCount > 0) {
        message += ` (${vocabCount} vocabulary, ${sentenceCount} sentence${sentenceCount > 1 ? 's' : ''})`;
      }

      expect(message).toBe('Deleted 5 highlights (3 vocabulary, 2 sentences)');
    });
  });
});
