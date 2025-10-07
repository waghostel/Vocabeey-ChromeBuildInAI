/**
 * Service Worker for Language Learning Chrome Extension
 * Handles extension lifecycle and coordinates between components
 */

import type { ExtractedContent } from '../types';

// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab): Promise<void> => {
  if (!tab.id) {
    console.error('No tab ID available');
    return;
  }

  try {
    // Check if we can access the tab
    if (!tab.url || tab.url.startsWith('chrome://')) {
      console.warn('Cannot process chrome:// pages');
      return;
    }

    // Inject content script and process the page
    await processCurrentTab(tab.id);
  } catch (error) {
    console.error('Error processing tab:', error);
  }
});

/**
 * Process the current tab and extract article content
 */
async function processCurrentTab(tabId: number): Promise<void> {
  try {
    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/content-script.js'],
    });

    console.log('Content script injected successfully');
  } catch (error) {
    console.error('Failed to inject content script:', error);
    throw error;
  }
}

/**
 * Handle messages from content scripts
 */
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; data: ExtractedContent },
    _sender,
    sendResponse
  ): boolean => {
    if (message.type === 'CONTENT_EXTRACTED') {
      handleContentExtracted(message.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
    }
    return false;
  }
);

/**
 * Handle extracted content from content script
 */
async function handleContentExtracted(
  content: ExtractedContent
): Promise<void> {
  console.log('Content extracted:', content);
  // TODO: Open learning interface tab with extracted content
}

// Initialize extension
console.log('Language Learning Extension service worker initialized');
