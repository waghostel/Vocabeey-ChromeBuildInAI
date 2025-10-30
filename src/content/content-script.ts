/**
 * Content Script for Language Learning Chrome Extension
 * Extracts article content from web pages
 */

// Define types inline to avoid ES module compilation
interface ExtractedContent {
  title: string;
  content: string;
  url: string;
  language?: string;
  wordCount: number;
  paragraphCount: number;
}

/**
 * Extract article content from the current page using multiple strategies
 */
function extractContent(): ExtractedContent | null {
  // Strategy 1: Look for article element
  let mainContent: Element | null = document.querySelector('article');

  // Strategy 2: Look for main element
  if (!mainContent) {
    mainContent = document.querySelector('main');
  }

  // Strategy 3: Look for common content containers
  if (!mainContent) {
    const contentSelectors = [
      '[role="main"]',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content',
      '#content',
      '.main-content',
    ];

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent && element.textContent.length > 500) {
        mainContent = element;
        break;
      }
    }
  }

  if (!mainContent) {
    return null;
  }

  // Extract title
  const title = extractTitle();

  // Extract text content
  const content = extractTextContent(mainContent);

  // Validate minimum content length
  if (content.length < 100) {
    return null;
  }

  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
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
 * Extract title from the page
 */
function extractTitle(): string {
  // Try multiple strategies to find the best title
  const titleSelectors = [
    'h1',
    '[class*="title"]',
    '[class*="headline"]',
    'article h1',
    'main h1',
  ];

  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element?.textContent && element.textContent.trim().length > 0) {
      return element.textContent;
    }
  }

  // Fallback to document title
  return document.title || 'Untitled Article';
}

/**
 * Extract clean text content from an element
 */
function extractTextContent(element: Element): string {
  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true) as Element;

  // Remove unwanted elements
  const unwantedSelectors = [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    'aside',
    '.advertisement',
    '.ad',
    '.social-share',
    '.comments',
    '[class*="sidebar"]',
    '[class*="related"]',
  ];

  unwantedSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Get text content and clean it up
  let text = clone.textContent || '';

  // Remove excessive whitespace
  text = text.replace(/\s+/g, ' ');

  // Remove leading/trailing whitespace
  text = text.trim();

  return text;
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
      if (response?.success) {
        showSuccessNotification();
      } else {
        showErrorNotification('Failed to process article');
      }
    })
    .catch(() => {
      showErrorNotification('Failed to communicate with extension');
    });
}

/**
 * Show a temporary success notification
 */
function showSuccessNotification(): void {
  const notification = createNotification(
    '✓ Article extracted successfully',
    'success'
  );
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/**
 * Show a temporary error notification
 */
function showErrorNotification(message: string): void {
  const notification = createNotification(`✗ ${message}`, 'error');
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}

/**
 * Create a notification element
 */
function createNotification(
  message: string,
  type: 'success' | 'error'
): HTMLDivElement {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
  `;

  return notification;
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_CONTENT') {
    const content = extractContent();
    if (content) {
      sendResponse({ success: true, data: content });
    } else {
      sendResponse({ success: false, error: 'Failed to extract content' });
    }
    return true;
  }
  return false;
});

// Extract content when script is injected (wrapped in IIFE to avoid global scope pollution)
(function initContentScript() {
  const extractedContent = extractContent();
  if (extractedContent) {
    sendContentToBackground(extractedContent);
  } else {
    showErrorNotification('Could not find article content on this page');
  }
})();
