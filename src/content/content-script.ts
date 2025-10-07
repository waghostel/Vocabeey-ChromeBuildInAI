/**
 * Content Script for Language Learning Chrome Extension
 * Extracts article content from web pages
 */

import type { ExtractedContent } from '../types';

/**
 * Extract article content from the current page
 */
function extractContent(): ExtractedContent | null {
  const title =
    document.querySelector('h1')?.textContent ||
    document.title ||
    'Untitled Article';

  const article = document.querySelector('article');
  const mainContent = article || document.querySelector('main');

  if (!mainContent) {
    console.warn('No article or main content found');
    return null;
  }

  const content = mainContent.textContent || '';
  const wordCount = content.split(/\s+/).length;
  const paragraphCount = mainContent.querySelectorAll('p').length;

  return {
    title: title.trim(),
    content: content.trim(),
    url: window.location.href,
    wordCount,
    paragraphCount,
  };
}

/**
 * Send extracted content to background script
 */
function sendContentToBackground(content: ExtractedContent): void {
  chrome.runtime
    .sendMessage({
      type: 'CONTENT_EXTRACTED',
      data: content,
    })
    .then(response => {
      if (response.success) {
        console.log('Content sent successfully');
      } else {
        console.error('Failed to send content:', response.error);
      }
    })
    .catch(error => {
      console.error('Error sending message:', error);
    });
}

// Main execution
const extractedContent = extractContent();
if (extractedContent) {
  sendContentToBackground(extractedContent);
} else {
  console.error('Failed to extract content from page');
}
