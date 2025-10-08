/**
 * Unit tests for content extraction utilities
 * Tests Readability.js extraction, fallback mechanisms, and content sanitization
 */

import { JSDOM } from 'jsdom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  ReadabilityExtractor,
  JinaReaderExtractor,
  DOMExtractor,
  ContentExtractionCoordinator,
} from '../src/utils/content-extraction';

describe('ReadabilityExtractor', () => {
  let extractor: ReadabilityExtractor;

  beforeEach(() => {
    extractor = new ReadabilityExtractor();
  });

  describe('extract', () => {
    it('should extract content from a simple article', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Test Article</title></head>
          <body>
            <article>
              <h1>Test Article Title</h1>
              <p>This is the first paragraph with enough content to pass validation. It contains multiple sentences to ensure we meet the minimum word count requirement.</p>
              <p>This is the second paragraph with more content. It also has multiple sentences to make the article substantial enough for extraction.</p>
            </article>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com/article' });
      const document = dom.window.document;

      const result = await extractor.extract(document);

      expect(result.title).toBe('Test Article');
      expect(result.content).toContain('first paragraph');
      expect(result.content).toContain('second paragraph');
      expect(result.url).toBe('https://example.com/article');
      expect(result.wordCount).toBeGreaterThan(20);
      expect(result.paragraphCount).toBeGreaterThan(0);
    });

    it('should extract content from news article format', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Breaking News</title></head>
          <body>
            <header>Navigation</header>
            <main>
              <article>
                <h1>Breaking News Story</h1>
                <div class="article-content">
                  <p>This is a news article with important information. The content is structured in a typical news format with multiple paragraphs.</p>
                  <p>The second paragraph continues the story with additional details and context. This ensures we have enough content for proper extraction.</p>
                  <p>A third paragraph adds even more depth to the story, providing comprehensive coverage of the topic at hand.</p>
                </div>
              </article>
            </main>
            <footer>Footer content</footer>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://news.example.com/story' });
      const document = dom.window.document;

      const result = await extractor.extract(document);

      expect(result.title).toBe('Breaking News');
      expect(result.content).toContain('news article');
      expect(result.content).not.toContain('Navigation');
      expect(result.content).not.toContain('Footer content');
      expect(result.wordCount).toBeGreaterThan(20);
    });

    it('should throw error when Readability fails to parse', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Empty Page</title></head>
          <body>
            <div>Not enough content</div>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      await expect(extractor.extract(document)).rejects.toThrow();
    });

    it('should throw error when content fails validation', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Short</title></head>
          <body>
            <article>
              <p>Too short</p>
            </article>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      await expect(extractor.extract(document)).rejects.toThrow('validation');
    });
  });

  describe('validate', () => {
    it('should return true for valid content', () => {
      const content =
        'This is a valid article with enough content to pass validation. It has more than twenty words and more than one hundred characters in total.';
      expect(extractor.validate(content)).toBe(true);
    });

    it('should return false for empty content', () => {
      expect(extractor.validate('')).toBe(false);
    });

    it('should return false for null content', () => {
      expect(extractor.validate(null as any)).toBe(false);
    });

    it('should return false for content shorter than 100 characters', () => {
      const content = 'Too short';
      expect(extractor.validate(content)).toBe(false);
    });

    it('should return false for content with fewer than 20 words', () => {
      const content =
        'This content has exactly nineteen words but it is still not enough to pass the validation check here.';
      expect(extractor.validate(content)).toBe(false);
    });

    it('should return false for non-string content', () => {
      expect(extractor.validate(123 as any)).toBe(false);
      expect(extractor.validate({} as any)).toBe(false);
    });
  });

  describe('sanitize', () => {
    it('should remove excessive whitespace', () => {
      const content = 'This  has   multiple    spaces';
      const result = extractor.sanitize(content);
      expect(result).toBe('This has multiple spaces');
    });

    it('should trim leading and trailing whitespace', () => {
      const content = '   Content with spaces   ';
      const result = extractor.sanitize(content);
      expect(result).toBe('Content with spaces');
    });

    it('should remove control characters', () => {
      const content = 'Content\x00with\x01control\x02characters';
      const result = extractor.sanitize(content);
      expect(result).not.toContain('\x00');
      expect(result).not.toContain('\x01');
      expect(result).not.toContain('\x02');
    });

    it('should normalize line breaks', () => {
      const content = 'Line 1\r\nLine 2\rLine 3\nLine 4';
      const result = extractor.sanitize(content);
      // Sanitize replaces all whitespace with single spaces first
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      expect(result).toContain('Line 3');
      expect(result).toContain('Line 4');
    });

    it('should remove excessive line breaks', () => {
      const content = 'Paragraph 1\n\n\n\n\nParagraph 2';
      const result = extractor.sanitize(content);
      // Sanitize replaces all whitespace with single spaces
      expect(result).toContain('Paragraph 1');
      expect(result).toContain('Paragraph 2');
      expect(result.length).toBeLessThan(content.length);
    });

    it('should handle empty content', () => {
      expect(extractor.sanitize('')).toBe('');
      expect(extractor.sanitize(null as any)).toBe('');
    });
  });
});

describe('JinaReaderExtractor', () => {
  let extractor: JinaReaderExtractor;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    extractor = new JinaReaderExtractor(mockApiKey);
    vi.clearAllMocks();
  });

  describe('extract', () => {
    it('should extract content using Jina Reader API', async () => {
      const mockContent =
        'This is extracted content from Jina Reader API with enough words to pass validation. It contains multiple sentences and paragraphs to ensure proper extraction.';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockContent,
      });

      const html = `<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>`;
      const dom = new JSDOM(html, { url: 'https://example.com/article' });
      const document = dom.window.document;

      const result = await extractor.extract(document);

      expect(result.title).toBe('Test');
      expect(result.content).toContain('extracted content');
      expect(result.url).toBe('https://example.com/article');
      expect(result.wordCount).toBeGreaterThan(20);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://r.jina.ai/https://example.com/article',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
          }),
        })
      );
    });

    it('should work without API key', async () => {
      const extractorNoKey = new JinaReaderExtractor();
      const mockContent =
        'Content extracted without API key. This has enough words to pass validation and contains multiple sentences for proper testing. We need more words here to ensure we pass the twenty word minimum requirement for validation.';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockContent,
      });

      const html = `<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>`;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      const result = await extractorNoKey.extract(document);

      expect(result.content).toContain('Content extracted');
      // Check that fetch was called without Authorization header
      const fetchCalls = (global.fetch as any).mock.calls;
      expect(fetchCalls.length).toBeGreaterThan(0);
      const headers = fetchCalls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });

    it('should throw error when URL is not available', async () => {
      // Mock fetch to fail so we can test the URL check
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const html = `<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>`;
      const dom = new JSDOM(html);
      const document = dom.window.document;

      await expect(extractor.extract(document)).rejects.toThrow(
        'Jina Reader extraction failed'
      );
    });

    it('should throw error on 401 unauthorized', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const html = `<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>`;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      await expect(extractor.extract(document)).rejects.toThrow(
        'Invalid Jina Reader API key'
      );
    });

    it('should retry on 429 rate limit with exponential backoff', async () => {
      const mockContent =
        'Content after retry with enough words to pass validation. This ensures we have proper content for testing the retry mechanism.';

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => mockContent,
        });

      const html = `<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>`;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      const result = await extractor.extract(document);

      expect(result.content).toContain('Content after retry');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries on 429', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const html = `<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>`;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      await expect(extractor.extract(document)).rejects.toThrow('Rate limit');
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error on empty response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
      });

      const html = `<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>`;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      await expect(extractor.extract(document)).rejects.toThrow(
        'Empty response'
      );
    });

    it('should throw error when content fails validation', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'Too short',
      });

      const html = `<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>`;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      await expect(extractor.extract(document)).rejects.toThrow('validation');
    });
  });

  describe('validate', () => {
    it('should validate content correctly', () => {
      const validContent =
        'This is valid content with more than twenty words and more than one hundred characters to ensure it passes validation.';
      expect(extractor.validate(validContent)).toBe(true);

      expect(extractor.validate('')).toBe(false);
      expect(extractor.validate('short')).toBe(false);
      expect(extractor.validate(null as any)).toBe(false);
    });
  });

  describe('sanitize', () => {
    it('should sanitize content correctly', () => {
      const content = 'Content  with   spaces\r\n\r\nand\nline\nbreaks';
      const result = extractor.sanitize(content);

      expect(result).not.toContain('  ');
      expect(result).not.toContain('\r');
      // Sanitize replaces all whitespace with single spaces
      expect(result).toContain('Content');
      expect(result).toContain('spaces');
    });
  });
});

describe('DOMExtractor', () => {
  let extractor: DOMExtractor;

  beforeEach(() => {
    extractor = new DOMExtractor();
  });

  describe('extract', () => {
    it('should extract content from article element', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>DOM Test</title></head>
          <body>
            <nav>Navigation menu</nav>
            <article>
              <h1>Article Title</h1>
              <p>This is the main article content with enough words to pass validation. It contains multiple sentences and paragraphs.</p>
              <p>Second paragraph with more content to ensure we have substantial text for extraction purposes.</p>
            </article>
            <footer>Footer content</footer>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      const result = await extractor.extract(document);

      expect(result.title).toBe('DOM Test');
      expect(result.content).toContain('main article content');
      expect(result.content).not.toContain('Navigation menu');
      expect(result.content).not.toContain('Footer content');
      expect(result.wordCount).toBeGreaterThan(20);
    });

    it('should extract content from main element', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Main Test</title></head>
          <body>
            <header>Header</header>
            <main>
              <h1>Main Content</h1>
              <p>This is the main content area with sufficient text for validation. It has multiple sentences and enough words.</p>
              <p>Additional paragraph to ensure we have enough content for proper extraction and testing.</p>
            </main>
            <aside>Sidebar</aside>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      const result = await extractor.extract(document);

      expect(result.content).toContain('main content area');
      expect(result.content).not.toContain('Header');
      expect(result.content).not.toContain('Sidebar');
    });

    it('should extract content from role="main" element', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Role Main Test</title></head>
          <body>
            <div role="main">
              <h1>Main Role Content</h1>
              <p>Content in element with role main attribute. This has enough words to pass validation requirements.</p>
              <p>Second paragraph with additional content to ensure proper extraction and validation.</p>
            </div>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      const result = await extractor.extract(document);

      expect(result.content).toContain('role main attribute');
    });

    it('should extract content from .content class', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Content Class Test</title></head>
          <body>
            <div class="content">
              <h1>Content Class</h1>
              <p>This is content in a div with content class. It has enough words to pass validation.</p>
              <p>Additional paragraph to meet the minimum requirements for content extraction.</p>
            </div>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      const result = await extractor.extract(document);

      expect(result.content).toContain('content class');
    });

    it('should fallback to body when no priority elements found', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Body Fallback Test</title></head>
          <body>
            <div>
              <p>This is content directly in body with no semantic elements. It has enough words to pass validation requirements.</p>
              <p>Second paragraph to ensure we have sufficient content for extraction purposes.</p>
            </div>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      const result = await extractor.extract(document);

      expect(result.content).toContain('directly in body');
      expect(result.wordCount).toBeGreaterThan(20);
    });

    it('should remove unwanted elements like scripts and styles', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Unwanted Elements Test</title></head>
          <body>
            <article>
              <script>console.log('script');</script>
              <style>.test { color: red; }</style>
              <p>This is the actual content we want to extract. It has enough words to pass validation.</p>
              <div class="advertisement">Ad content</div>
              <p>More actual content to ensure we have sufficient text for extraction.</p>
              <div class="comments">Comment section</div>
            </article>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      const result = await extractor.extract(document);

      expect(result.content).toContain('actual content');
      expect(result.content).not.toContain('script');
      expect(result.content).not.toContain('color: red');
      expect(result.content).not.toContain('Ad content');
      expect(result.content).not.toContain('Comment section');
    });

    it('should throw error when no content found', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Empty</title></head>
          <body>
            <div>Short</div>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      await expect(extractor.extract(document)).rejects.toThrow();
    });

    it('should throw error when content fails validation', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Invalid Content</title></head>
          <body>
            <article>
              <p>Not enough content here</p>
            </article>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      await expect(extractor.extract(document)).rejects.toThrow(
        'DOM extraction failed'
      );
    });
  });

  describe('validate', () => {
    it('should validate content correctly', () => {
      const validContent =
        'This is valid content with more than twenty words and more than one hundred characters to ensure validation passes successfully with enough text.';
      expect(extractor.validate(validContent)).toBe(true);

      expect(extractor.validate('')).toBe(false);
      expect(extractor.validate('short')).toBe(false);
      expect(extractor.validate(null as any)).toBe(false);
    });
  });

  describe('sanitize', () => {
    it('should sanitize content correctly', () => {
      const content = 'Content  with   spaces\r\n\r\nand\nline\nbreaks';
      const result = extractor.sanitize(content);

      expect(result).not.toContain('  ');
      expect(result).not.toContain('\r');
    });
  });
});

describe('ContentExtractionCoordinator', () => {
  let coordinator: ContentExtractionCoordinator;

  beforeEach(() => {
    coordinator = new ContentExtractionCoordinator('test-api-key');
    vi.clearAllMocks();
  });

  describe('extractContent', () => {
    it('should use Readability.js as primary extraction method', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Primary Test</title></head>
          <body>
            <article>
              <h1>Article Title</h1>
              <p>This is content that Readability.js can extract successfully. It has enough words to pass validation.</p>
              <p>Second paragraph with more content to ensure proper extraction and validation.</p>
            </article>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      const result = await coordinator.extractContent(document);

      expect(result.title).toBe('Primary Test');
      expect(result.content).toContain('Readability.js can extract');
      expect(result.wordCount).toBeGreaterThan(20);
    });

    it('should fallback to Jina Reader when Readability fails', async () => {
      const mockContent =
        'Content from Jina Reader API fallback with enough words to pass validation. This ensures proper testing of the fallback mechanism.';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockContent,
      });

      // Create a document that Readability.js will fail on
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Fallback Test</title></head>
          <body>
            <div>Minimal content</div>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      const result = await coordinator.extractContent(document);

      expect(result.content).toContain('Jina Reader API fallback');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should fallback to DOM extraction when both Readability and Jina fail', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>DOM Fallback Test</title></head>
          <body>
            <article>
              <p>This content will be extracted by DOM parser as final fallback. It has enough words to pass validation.</p>
              <p>Second paragraph to ensure we have sufficient content for extraction purposes.</p>
            </article>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      const result = await coordinator.extractContent(document);

      expect(result.content).toContain('DOM parser as final fallback');
      expect(result.wordCount).toBeGreaterThan(20);
    });

    it('should throw error when all extraction methods fail', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>All Fail Test</title></head>
          <body>
            <div>Short</div>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      await expect(coordinator.extractContent(document)).rejects.toThrow(
        'All content extraction methods failed'
      );
    });

    it('should include all error messages when all methods fail', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('API error'));

      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Error Messages Test</title></head>
          <body>
            <div>Not enough</div>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      try {
        await coordinator.extractContent(document);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('Readability');
        expect(errorMessage).toContain('Jina Reader');
        expect(errorMessage).toContain('DOM Parser');
      }
    });
  });

  describe('updateJinaApiKey', () => {
    it('should update Jina Reader API key', async () => {
      const newApiKey = 'new-api-key';
      coordinator.updateJinaApiKey(newApiKey);

      const mockContent =
        'Content with new API key. This has enough words to pass validation and test the API key update functionality properly with sufficient text content.';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockContent,
      });

      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>API Key Test</title></head>
          <body>
            <div>Minimal</div>
          </body>
        </html>
      `;
      const dom = new JSDOM(html, { url: 'https://example.com' });
      const document = dom.window.document;

      await coordinator.extractContent(document);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${newApiKey}`,
          }),
        })
      );
    });
  });
});

describe('Content Extraction Integration', () => {
  it('should handle complex real-world article structure', async () => {
    const coordinator = new ContentExtractionCoordinator();

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Complex Article Structure</title>
          <meta name="description" content="Article description">
        </head>
        <body>
          <header>
            <nav>
              <a href="/">Home</a>
              <a href="/about">About</a>
            </nav>
          </header>
          <main>
            <article>
              <header>
                <h1>The Future of Web Development</h1>
                <div class="meta">
                  <span class="author">John Doe</span>
                  <time>2024-01-01</time>
                </div>
              </header>
              <div class="article-content">
                <p>Web development has evolved significantly over the past decade. Modern frameworks and tools have made it easier than ever to build complex applications.</p>
                <p>The introduction of new technologies like WebAssembly and Progressive Web Apps has opened up new possibilities for developers. These innovations allow us to create faster, more capable web applications.</p>
                <p>Looking ahead, we can expect even more exciting developments in the field. Artificial intelligence and machine learning are becoming increasingly integrated into web development workflows.</p>
              </div>
              <aside class="related">
                <h3>Related Articles</h3>
                <ul>
                  <li><a href="/article1">Article 1</a></li>
                  <li><a href="/article2">Article 2</a></li>
                </ul>
              </aside>
            </article>
          </main>
          <footer>
            <p>Copyright 2024</p>
          </footer>
        </body>
      </html>
    `;
    const dom = new JSDOM(html, { url: 'https://example.com/article' });
    const document = dom.window.document;

    const result = await coordinator.extractContent(document);

    expect(result.title).toBe('Complex Article Structure');
    expect(result.content).toContain('Web development has evolved');
    expect(result.content).toContain('WebAssembly');
    expect(result.content).toContain('Artificial intelligence');
    expect(result.content).not.toContain('Home');
    expect(result.content).not.toContain('Copyright 2024');
    expect(result.wordCount).toBeGreaterThan(50);
    expect(result.paragraphCount).toBeGreaterThanOrEqual(1);
  });

  it('should handle articles with embedded media and code blocks', async () => {
    const coordinator = new ContentExtractionCoordinator();

    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Technical Article</title></head>
        <body>
          <article>
            <h1>Understanding JavaScript Closures</h1>
            <p>Closures are a fundamental concept in JavaScript that every developer should understand. They allow functions to access variables from an outer scope even after the outer function has returned.</p>
            <pre><code>
              function outer() {
                const message = 'Hello';
                return function inner() {
                  console.log(message);
                };
              }
            </code></pre>
            <p>In this example, the inner function has access to the message variable from the outer function's scope. This is the essence of closures in JavaScript.</p>
            <img src="diagram.png" alt="Closure diagram">
            <p>Understanding closures is essential for writing effective JavaScript code. They are used extensively in modern JavaScript frameworks and libraries.</p>
          </article>
        </body>
      </html>
    `;
    const dom = new JSDOM(html, { url: 'https://example.com/tech' });
    const document = dom.window.document;

    const result = await coordinator.extractContent(document);

    expect(result.content).toContain('Closures are a fundamental concept');
    expect(result.content).toContain('Understanding closures is essential');
    expect(result.wordCount).toBeGreaterThan(30);
  });
});
