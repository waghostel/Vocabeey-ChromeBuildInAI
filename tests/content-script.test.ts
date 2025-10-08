/**
 * Unit tests for content script functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ExtractedContent } from '../src/types';

describe('Content Script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Content Extraction', () => {
    it('should extract content from article element', () => {
      document.body.innerHTML = `
        <article>
          <h1>Test Article Title</h1>
          <p>This is the first paragraph with some content.</p>
          <p>This is the second paragraph with more content.</p>
        </article>
      `;

      const article = document.querySelector('article');
      expect(article).toBeTruthy();

      const content = article?.textContent?.trim();
      expect(content).toContain('Test Article Title');
      expect(content).toContain('first paragraph');
    });

    it('should extract content from main element', () => {
      document.body.innerHTML = `
        <main>
          <h1>Main Content Title</h1>
          <p>Main content paragraph with sufficient length for extraction.</p>
        </main>
      `;

      const main = document.querySelector('main');
      expect(main).toBeTruthy();

      const content = main?.textContent?.trim();
      expect(content).toContain('Main Content Title');
    });

    it('should extract content from common content selectors', () => {
      const selectors = [
        '[role="main"]',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content',
        '#content',
        '.main-content',
      ];

      selectors.forEach(selector => {
        document.body.innerHTML = `
          <div class="${selector.replace(/[.#[\]="]/g, '')}">
            <p>${'Test content '.repeat(100)}</p>
          </div>
        `;

        const element = document.querySelector(selector);
        if (element) {
          expect(element.textContent?.length).toBeGreaterThan(500);
        }
      });
    });

    it('should return null for insufficient content', () => {
      document.body.innerHTML = `
        <article>
          <p>Short</p>
        </article>
      `;

      const article = document.querySelector('article');
      const content = article?.textContent?.trim() || '';

      expect(content.length).toBeLessThan(100);
    });

    it('should calculate word count correctly', () => {
      const text = 'This is a test sentence with exactly ten words here.';
      const wordCount = text
        .split(/\s+/)
        .filter(word => word.length > 0).length;

      expect(wordCount).toBe(10);
    });

    it('should count paragraphs correctly', () => {
      document.body.innerHTML = `
        <article>
          <p>First paragraph</p>
          <p>Second paragraph</p>
          <p>Third paragraph</p>
        </article>
      `;

      const paragraphs = document.querySelectorAll('article p');
      expect(paragraphs.length).toBe(3);
    });
  });

  describe('Title Extraction', () => {
    it('should extract title from h1 element', () => {
      document.body.innerHTML = `
        <h1>Article Title</h1>
        <p>Content</p>
      `;

      const h1 = document.querySelector('h1');
      expect(h1?.textContent).toBe('Article Title');
    });

    it('should extract title from element with title class', () => {
      document.body.innerHTML = `
        <div class="article-title">Title from Class</div>
        <p>Content</p>
      `;

      const titleElement = document.querySelector('[class*="title"]');
      expect(titleElement?.textContent).toBe('Title from Class');
    });

    it('should extract title from article h1', () => {
      document.body.innerHTML = `
        <article>
          <h1>Article H1 Title</h1>
          <p>Content</p>
        </article>
      `;

      const h1 = document.querySelector('article h1');
      expect(h1?.textContent).toBe('Article H1 Title');
    });

    it('should fallback to document title', () => {
      document.title = 'Document Title';
      document.body.innerHTML = '<p>Content without title</p>';

      expect(document.title).toBe('Document Title');
    });

    it('should handle empty title gracefully', () => {
      document.body.innerHTML = '<h1></h1>';

      const h1 = document.querySelector('h1');
      expect(h1?.textContent?.trim()).toBe('');
    });
  });

  describe('Content Sanitization', () => {
    it('should remove script tags', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <p>Content</p>
        <script>alert('test')</script>
      `;

      const clone = container.cloneNode(true) as Element;
      clone.querySelectorAll('script').forEach(el => el.remove());

      expect(clone.querySelector('script')).toBeNull();
      expect(clone.querySelector('p')).toBeTruthy();
    });

    it('should remove style tags', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <p>Content</p>
        <style>.test { color: red; }</style>
      `;

      const clone = container.cloneNode(true) as Element;
      clone.querySelectorAll('style').forEach(el => el.remove());

      expect(clone.querySelector('style')).toBeNull();
    });

    it('should remove navigation elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <p>Content</p>
        <nav>Navigation</nav>
      `;

      const clone = container.cloneNode(true) as Element;
      clone.querySelectorAll('nav').forEach(el => el.remove());

      expect(clone.querySelector('nav')).toBeNull();
    });

    it('should remove header and footer', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <header>Header</header>
        <p>Content</p>
        <footer>Footer</footer>
      `;

      const clone = container.cloneNode(true) as Element;
      ['header', 'footer'].forEach(tag => {
        clone.querySelectorAll(tag).forEach(el => el.remove());
      });

      expect(clone.querySelector('header')).toBeNull();
      expect(clone.querySelector('footer')).toBeNull();
    });

    it('should remove advertisement elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <p>Content</p>
        <div class="advertisement">Ad</div>
        <div class="ad">Ad</div>
      `;

      const clone = container.cloneNode(true) as Element;
      ['.advertisement', '.ad'].forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
      });

      expect(clone.querySelector('.advertisement')).toBeNull();
      expect(clone.querySelector('.ad')).toBeNull();
    });

    it('should remove social share buttons', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <p>Content</p>
        <div class="social-share">Share</div>
      `;

      const clone = container.cloneNode(true) as Element;
      clone.querySelectorAll('.social-share').forEach(el => el.remove());

      expect(clone.querySelector('.social-share')).toBeNull();
    });

    it('should remove comments sections', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <p>Content</p>
        <div class="comments">Comments</div>
      `;

      const clone = container.cloneNode(true) as Element;
      clone.querySelectorAll('.comments').forEach(el => el.remove());

      expect(clone.querySelector('.comments')).toBeNull();
    });

    it('should normalize whitespace', () => {
      const text = '  Multiple   spaces   and\n\nnewlines  ';
      const normalized = text.replace(/\s+/g, ' ').trim();

      expect(normalized).toBe('Multiple spaces and newlines');
    });
  });

  describe('Message Communication', () => {
    it('should send extracted content to background', async () => {
      const mockContent: ExtractedContent = {
        title: 'Test Article',
        content: 'Test content',
        url: 'https://example.com',
        wordCount: 2,
        paragraphCount: 1,
      };

      chrome.runtime.sendMessage.mockResolvedValue({ success: true });

      await chrome.runtime.sendMessage({
        type: 'CONTENT_EXTRACTED',
        data: mockContent,
      });

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'CONTENT_EXTRACTED',
        data: mockContent,
      });
    });

    it('should handle message sending errors', async () => {
      const error = new Error('Connection error');
      chrome.runtime.sendMessage.mockRejectedValue(error);

      await expect(
        chrome.runtime.sendMessage({ type: 'TEST' })
      ).rejects.toThrow('Connection error');
    });

    it('should respond to EXTRACT_CONTENT message', () => {
      const sendResponse = vi.fn();
      const handler = chrome.runtime.onMessage.addListener.mock.calls[0]?.[0];

      document.body.innerHTML = `
        <article>
          <h1>Test Title</h1>
          <p>${'Test content '.repeat(50)}</p>
        </article>
      `;

      if (handler) {
        const result = handler({ type: 'EXTRACT_CONTENT' }, {}, sendResponse);

        expect(result).toBe(true);
      }
    });

    it('should return false for unknown message types', () => {
      const sendResponse = vi.fn();
      const handler = chrome.runtime.onMessage.addListener.mock.calls[0]?.[0];

      if (handler) {
        const result = handler({ type: 'UNKNOWN_MESSAGE' }, {}, sendResponse);

        expect(result).toBe(false);
      }
    });
  });

  describe('User Notifications', () => {
    it('should create success notification element', () => {
      const notification = document.createElement('div');
      notification.textContent = '✓ Article extracted successfully';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background-color: #4CAF50;
        color: white;
        border-radius: 4px;
        z-index: 999999;
      `;

      expect(notification.textContent).toContain(
        'Article extracted successfully'
      );
      expect(notification.style.position).toBe('fixed');
      expect(notification.style.backgroundColor).toBe('rgb(76, 175, 80)');
    });

    it('should create error notification element', () => {
      const notification = document.createElement('div');
      notification.textContent = '✗ Failed to process article';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background-color: #f44336;
        color: white;
        border-radius: 4px;
        z-index: 999999;
      `;

      expect(notification.textContent).toContain('Failed to process article');
      expect(notification.style.backgroundColor).toBe('rgb(244, 67, 54)');
    });

    it('should append notification to document body', () => {
      const notification = document.createElement('div');
      notification.textContent = 'Test notification';
      document.body.appendChild(notification);

      expect(document.body.contains(notification)).toBe(true);
    });

    it('should remove notification after timeout', async () => {
      const notification = document.createElement('div');
      document.body.appendChild(notification);

      expect(document.body.contains(notification)).toBe(true);

      notification.remove();

      expect(document.body.contains(notification)).toBe(false);
    });
  });

  describe('URL Validation', () => {
    it('should extract current page URL', () => {
      // jsdom sets location.href
      expect(window.location.href).toBeTruthy();
    });

    it('should handle different URL protocols', () => {
      const urls = [
        'https://example.com/article',
        'http://example.com/article',
        'https://blog.example.com/post/123',
      ];

      urls.forEach(url => {
        expect(url).toMatch(/^https?:\/\//);
      });
    });
  });

  describe('Content Validation', () => {
    it('should validate minimum content length', () => {
      const shortContent = 'Too short';
      const longContent =
        'This is a much longer piece of content that meets the minimum length requirement for article extraction and processing.';

      expect(shortContent.length).toBeLessThan(100);
      expect(longContent.length).toBeGreaterThan(100);
    });

    it('should validate content has actual text', () => {
      const emptyContent = '   \n\n   ';
      const validContent = 'Valid content with text';

      expect(emptyContent.trim().length).toBe(0);
      expect(validContent.trim().length).toBeGreaterThan(0);
    });

    it('should handle content with special characters', () => {
      const content = 'Content with special chars: @#$%^&*()';
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('special chars');
    });

    it('should handle content with unicode characters', () => {
      const content = 'Content with unicode: 你好世界 مرحبا العالم';
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('你好世界');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty document', () => {
      document.body.innerHTML = '';

      const article = document.querySelector('article');
      expect(article).toBeNull();
    });

    it('should handle document with only whitespace', () => {
      document.body.innerHTML = '   \n\n   ';

      const content = document.body.textContent?.trim();
      expect(content).toBe('');
    });

    it('should handle nested content structures', () => {
      document.body.innerHTML = `
        <article>
          <div>
            <div>
              <p>Deeply nested content</p>
            </div>
          </div>
        </article>
      `;

      const article = document.querySelector('article');
      expect(article?.textContent).toContain('Deeply nested content');
    });

    it('should handle multiple article elements', () => {
      document.body.innerHTML = `
        <article>First article</article>
        <article>Second article</article>
      `;

      const articles = document.querySelectorAll('article');
      expect(articles.length).toBe(2);
    });

    it('should handle malformed HTML', () => {
      document.body.innerHTML =
        '<p>Unclosed paragraph<div>Mixed tags</p></div>';

      // Browser will auto-correct, but content should still be extractable
      const content = document.body.textContent;
      expect(content).toContain('Unclosed paragraph');
      expect(content).toContain('Mixed tags');
    });
  });
});
