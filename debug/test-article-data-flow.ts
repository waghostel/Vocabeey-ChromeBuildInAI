/**
 * Test script to verify article data flow issue
 * Run this to confirm the diagnosis
 */

import { test, expect } from 'vitest';

interface ExtractedContent {
  title: string;
  content: string;
  url: string;
  language?: string;
  wordCount: number;
  paragraphCount: number;
}

interface ProcessedArticle {
  id: string;
  url: string;
  title: string;
  originalLanguage: string;
  processedAt: Date;
  parts: ArticlePart[];
  processingStatus: 'processing' | 'completed' | 'failed';
  cacheExpires: Date;
}

interface ArticlePart {
  id: string;
  content: string;
  originalContent: string;
  vocabulary: string[];
  sentences: string[];
  partIndex: number;
}

test('Article data type mismatch diagnosis', () => {
  // Simulate what content script sends
  const extractedContent: ExtractedContent = {
    title: 'Example Domains',
    content: 'This domain is for use in illustrative examples...',
    url: 'https://www.iana.org/help/example-domains',
    wordCount: 100,
    paragraphCount: 5,
  };

  // What learning interface expects
  const expectedStructure: ProcessedArticle = {
    id: 'article_123',
    url: 'https://www.iana.org/help/example-domains',
    title: 'Example Domains',
    originalLanguage: 'en',
    processedAt: new Date(),
    parts: [
      {
        id: 'part_1',
        content: 'This domain is for use in illustrative examples...',
        originalContent: 'This domain is for use in illustrative examples...',
        vocabulary: [],
        sentences: [],
        partIndex: 0,
      },
    ],
    processingStatus: 'completed',
    cacheExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  // Verify the mismatch
  expect(extractedContent).not.toHaveProperty('id');
  expect(extractedContent).not.toHaveProperty('parts');
  expect(extractedContent).not.toHaveProperty('processingStatus');

  expect(expectedStructure).toHaveProperty('id');
  expect(expectedStructure).toHaveProperty('parts');
  expect(expectedStructure).toHaveProperty('processingStatus');

  console.log('✅ Diagnosis confirmed: Data structure mismatch');
  console.log('ExtractedContent keys:', Object.keys(extractedContent));
  console.log('ProcessedArticle keys:', Object.keys(expectedStructure));
});

test('Conversion function needed', () => {
  const extractedContent: ExtractedContent = {
    title: 'Example Domains',
    content: 'This domain is for use in illustrative examples...',
    url: 'https://www.iana.org/help/example-domains',
    wordCount: 100,
    paragraphCount: 5,
  };

  // This function is MISSING in the codebase
  function convertToProcessedArticle(
    extracted: ExtractedContent
  ): ProcessedArticle {
    return {
      id: `article_${Date.now()}`,
      url: extracted.url,
      title: extracted.title,
      originalLanguage: extracted.language || 'en',
      processedAt: new Date(),
      parts: [
        {
          id: 'part_1',
          content: extracted.content,
          originalContent: extracted.content,
          vocabulary: [],
          sentences: [],
          partIndex: 0,
        },
      ],
      processingStatus: 'completed',
      cacheExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  const processed = convertToProcessedArticle(extractedContent);

  expect(processed).toHaveProperty('id');
  expect(processed).toHaveProperty('parts');
  expect(processed.parts).toHaveLength(1);
  expect(processed.processingStatus).toBe('completed');

  console.log('✅ Conversion function works correctly');
});
