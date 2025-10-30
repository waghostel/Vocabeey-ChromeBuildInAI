/**
 * Tests for Article Processor
 */

import { describe, it, expect } from 'vitest';
import {
  processArticle,
  validateProcessedArticle,
} from '../src/utils/article-processor';
import type { ExtractedContent, ProcessedArticle } from '../src/types';

describe('Article Processor', () => {
  it('should convert ExtractedContent to ProcessedArticle', async () => {
    const extractedContent: ExtractedContent = {
      title: 'Example Domains',
      content:
        'This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.',
      url: 'https://www.iana.org/help/example-domains',
      wordCount: 25,
      paragraphCount: 1,
    };

    const processed = await processArticle(extractedContent);

    expect(processed).toBeDefined();
    expect(processed.id).toMatch(/^article_\d+_[a-z0-9]+$/);
    expect(processed.url).toBe(extractedContent.url);
    expect(processed.title).toBe(extractedContent.title);
    expect(processed.originalLanguage).toBeDefined();
    expect(processed.parts).toHaveLength(1);
    expect(processed.processingStatus).toBe('completed');
  });

  it('should create article parts with correct structure', async () => {
    const extractedContent: ExtractedContent = {
      title: 'Test Article',
      content: 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.',
      url: 'https://example.com/test',
      wordCount: 6,
      paragraphCount: 3,
    };

    const processed = await processArticle(extractedContent);

    expect(processed.parts).toHaveLength(1);

    const part = processed.parts[0];
    expect(part.id).toContain(processed.id);
    expect(part.content).toBe(extractedContent.content);
    expect(part.originalContent).toBe(extractedContent.content);
    expect(part.vocabulary).toEqual([]);
    expect(part.sentences).toEqual([]);
    expect(part.partIndex).toBe(0);
  });

  it('should split long content into multiple parts', async () => {
    // Create content with more than 500 words
    const longContent = Array(100)
      .fill('This is a test paragraph with some words.')
      .join('\n\n');

    const extractedContent: ExtractedContent = {
      title: 'Long Article',
      content: longContent,
      url: 'https://example.com/long',
      wordCount: 800,
      paragraphCount: 100,
    };

    const processed = await processArticle(extractedContent);

    // Should be split into multiple parts
    expect(processed.parts.length).toBeGreaterThan(1);

    // Each part should have correct index
    processed.parts.forEach((part, index) => {
      expect(part.partIndex).toBe(index);
      expect(part.id).toContain(`_part_${index + 1}`);
    });
  });

  it('should detect language from content', async () => {
    const extractedContent: ExtractedContent = {
      title: 'English Article',
      content:
        'The quick brown fox jumps over the lazy dog. This is a test of the language detection system.',
      url: 'https://example.com/en',
      wordCount: 18,
      paragraphCount: 1,
    };

    const processed = await processArticle(extractedContent);

    expect(processed.originalLanguage).toBe('en');
  });

  it('should use provided language if available', async () => {
    const extractedContent: ExtractedContent = {
      title: 'Spanish Article',
      content: 'El rápido zorro marrón salta sobre el perro perezoso.',
      url: 'https://example.com/es',
      language: 'es',
      wordCount: 10,
      paragraphCount: 1,
    };

    const processed = await processArticle(extractedContent);

    expect(processed.originalLanguage).toBe('es');
  });

  it('should validate processed article correctly', async () => {
    const extractedContent: ExtractedContent = {
      title: 'Valid Article',
      content: 'This is valid content.',
      url: 'https://example.com/valid',
      wordCount: 4,
      paragraphCount: 1,
    };

    const processed = await processArticle(extractedContent);
    const isValid = validateProcessedArticle(processed);

    expect(isValid).toBe(true);
  });

  it('should reject invalid processed article', () => {
    const invalidArticle = {
      id: '',
      url: '',
      title: '',
      originalLanguage: '',
      processedAt: new Date(),
      parts: [],
      processingStatus: 'completed',
      cacheExpires: new Date(),
    } as ProcessedArticle;

    const isValid = validateProcessedArticle(invalidArticle);

    expect(isValid).toBe(false);
  });

  it('should handle empty content gracefully', async () => {
    const extractedContent: ExtractedContent = {
      title: 'Empty Article',
      content: '',
      url: 'https://example.com/empty',
      wordCount: 0,
      paragraphCount: 0,
    };

    const processed = await processArticle(extractedContent);

    expect(processed.parts).toHaveLength(1);
    expect(processed.parts[0].content).toBe('');
  });

  it('should set cache expiration to 24 hours', async () => {
    const extractedContent: ExtractedContent = {
      title: 'Test Article',
      content: 'Test content',
      url: 'https://example.com/test',
      wordCount: 2,
      paragraphCount: 1,
    };

    const processed = await processArticle(extractedContent);
    const now = new Date();
    const expectedExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Allow 1 second tolerance for test execution time
    const timeDiff = Math.abs(
      processed.cacheExpires.getTime() - expectedExpiry.getTime()
    );
    expect(timeDiff).toBeLessThan(1000);
  });
});
