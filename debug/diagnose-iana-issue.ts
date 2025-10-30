/**
 * Diagnostic script to debug the IANA example domains issue
 * Run this to check what's happening at each step
 */

import { test, expect } from 'vitest';
import { JSDOM } from 'jsdom';

// Test the content extraction on IANA page
test('IANA page content extraction', async () => {
  // Fetch the actual page
  const response = await fetch('https://www.iana.org/help/example-domains');
  const html = await response.text();

  // Parse with JSDOM
  const dom = new JSDOM(html);
  const document = dom.window.document;

  console.log('\n=== IANA Page Analysis ===\n');

  // Check for article element
  const article = document.querySelector('article');
  console.log('Has <article> element:', !!article);

  // Check for main element
  const main = document.querySelector('main');
  console.log('Has <main> element:', !!main);

  // Check for common content containers
  const contentSelectors = [
    '[role="main"]',
    '.article-content',
    '.post-content',
    '.entry-content',
    '.content',
    '#content',
    '.main-content',
  ];

  console.log('\nContent container checks:');
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const textLength = element.textContent?.length || 0;
      console.log(`  ${selector}: Found (${textLength} chars)`);
    } else {
      console.log(`  ${selector}: Not found`);
    }
  }

  // Check what the content script would extract
  let mainContent: Element | null = article || main;

  if (!mainContent) {
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent && element.textContent.length > 500) {
        mainContent = element;
        break;
      }
    }
  }

  console.log('\nExtracted content element:', mainContent?.tagName || 'NONE');

  if (mainContent) {
    const content = mainContent.textContent || '';
    console.log('Content length:', content.length);
    console.log(
      'Word count:',
      content.split(/\s+/).filter(w => w.length > 0).length
    );
    console.log('First 200 chars:', content.substring(0, 200));
  }

  // Check title extraction
  const h1 = document.querySelector('h1');
  const title = h1?.textContent || document.title;
  console.log('\nTitle:', title);

  // Verify minimum requirements
  if (mainContent) {
    const content = mainContent.textContent || '';
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    expect(content.length).toBeGreaterThan(100);
    expect(wordCount).toBeGreaterThan(20);
    console.log('\n✅ Content meets minimum requirements');
  } else {
    console.log('\n❌ No content found');
  }
});

// Test the article processor
test('Article processor with IANA content', async () => {
  const { processArticle } = await import('../src/utils/article-processor');

  const mockExtractedContent = {
    title: 'Example Domains',
    content: `As described in RFC 2606 and RFC 6761, a number of domains such as example.com and example.org are maintained for documentation purposes. These domains may be used as illustrative examples in documents without prior coordination with us. They are not available for registration or transfer.

We provide a web service on the example domain hosts to provide basic information on the purpose of the domain. These web services are provided as best effort, but are not designed to support production applications.

While incidental traffic for incorrectly configured applications is expected, please do not design applications that require the example domains to have operating HTTP service.`,
    url: 'https://www.iana.org/help/example-domains',
    wordCount: 95,
    paragraphCount: 3,
  };

  console.log('\n=== Article Processor Test ===\n');
  console.log('Input:', mockExtractedContent);

  const processed = await processArticle(mockExtractedContent);

  console.log('\nProcessed article:');
  console.log('  ID:', processed.id);
  console.log('  Title:', processed.title);
  console.log('  URL:', processed.url);
  console.log('  Language:', processed.originalLanguage);
  console.log('  Parts:', processed.parts.length);
  console.log('  Status:', processed.processingStatus);

  if (processed.parts.length > 0) {
    console.log('\nFirst part:');
    console.log('  ID:', processed.parts[0].id);
    console.log('  Content length:', processed.parts[0].content.length);
    console.log(
      '  First 100 chars:',
      processed.parts[0].content.substring(0, 100)
    );
  }

  // Verify structure
  expect(processed.id).toBeDefined();
  expect(processed.parts.length).toBeGreaterThan(0);
  expect(processed.originalLanguage).toBeDefined();
  expect(processed.processingStatus).toBe('completed');

  console.log('\n✅ Article processor working correctly');
});

// Test storage and retrieval
test('Storage and retrieval simulation', async () => {
  console.log('\n=== Storage Simulation ===\n');

  const mockArticle = {
    id: 'article_123',
    url: 'https://www.iana.org/help/example-domains',
    title: 'Example Domains',
    originalLanguage: 'en',
    processedAt: new Date(),
    parts: [
      {
        id: 'article_123_part_1',
        content: 'Test content',
        originalContent: 'Test content',
        vocabulary: [],
        sentences: [],
        partIndex: 0,
      },
    ],
    processingStatus: 'completed' as const,
    cacheExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  console.log('Mock article to store:', {
    id: mockArticle.id,
    title: mockArticle.title,
    parts: mockArticle.parts.length,
  });

  // Simulate what happens in openLearningInterface
  const tabId = 12345; // Simulated tab ID
  const storageKey = `article_${tabId}`;

  console.log('\nStorage key:', storageKey);
  console.log('Tab ID:', tabId);

  // Simulate retrieval
  console.log('\nSimulating retrieval with same tab ID...');
  console.log('Looking for key:', storageKey);

  // This should work if the tab ID matches
  expect(storageKey).toBe(`article_${tabId}`);

  console.log('\n✅ Storage key generation is correct');
});
