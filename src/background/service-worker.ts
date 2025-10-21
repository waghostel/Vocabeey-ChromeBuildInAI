/**
 * Service Worker for Language Learning Chrome Extension
 * Handles extension lifecycle and coordinates between components
 */

import {
  getMemoryManager,
  initializeMemoryManagement,
  shutdownMemoryManagement,
} from '../utils/memory-manager';
import {
  initializeOffscreenManagement,
  shutdownOffscreenManagement,
} from '../utils/offscreen-manager';

import type { ExtractedContent } from '../types';

interface SystemCapabilities {
  hasChromeAI: boolean;
  hasLanguageDetector: boolean;
  hasSummarizer: boolean;
  hasRewriter: boolean;
  hasTranslator: boolean;
  hasPromptAPI: boolean;
  hardwareInfo: {
    ram: string;
    storage: string;
    vram: string;
  };
}

// Memory manager will handle tab tracking
const memoryManager = getMemoryManager();

// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab): Promise<void> => {
  if (!tab.id) {
    console.error('No tab ID available');
    return;
  }

  try {
    // Check if we can access the tab
    if (
      !tab.url ||
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://')
    ) {
      console.warn('Cannot process chrome:// or extension pages');
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
      files: ['dist/content/content-script.js'],
    });

    console.log('Content script injected successfully');
  } catch (error) {
    console.error('Failed to inject content script:', error);
    throw error;
  }
}

/**
 * Handle messages from content scripts and other components
 */
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; data?: unknown },
    _sender,
    sendResponse
  ): boolean => {
    switch (message.type) {
      case 'CONTENT_EXTRACTED':
        handleContentExtracted(message.data as ExtractedContent)
          .then(() => sendResponse({ success: true }))
          .catch(error =>
            sendResponse({ success: false, error: error.message })
          );
        return true;

      case 'CHECK_SYSTEM_CAPABILITIES':
        checkSystemCapabilities()
          .then(capabilities =>
            sendResponse({ success: true, data: capabilities })
          )
          .catch(error =>
            sendResponse({ success: false, error: error.message })
          );
        return true;

      case 'OPEN_LEARNING_INTERFACE':
        openLearningInterface(message.data as ExtractedContent)
          .then(tabId => sendResponse({ success: true, data: { tabId } }))
          .catch(error =>
            sendResponse({ success: false, error: error.message })
          );
        return true;

      default:
        return false;
    }
  }
);

/**
 * Handle extracted content from content script
 */
async function handleContentExtracted(
  content: ExtractedContent
): Promise<void> {
  console.log('Content extracted:', content);

  // Store the extracted content temporarily
  await chrome.storage.session.set({
    [`pending_article_${Date.now()}`]: content,
  });

  // Open learning interface tab with extracted content
  await openLearningInterface(content);
}

/**
 * Open learning interface in a new tab
 */
async function openLearningInterface(
  content: ExtractedContent
): Promise<number> {
  try {
    const tab = await chrome.tabs.create({
      url: chrome.runtime.getURL('dist/ui/learning-interface.html'),
      active: true,
    });

    if (!tab.id) {
      throw new Error('Failed to create tab');
    }

    // Register tab with memory manager
    memoryManager.registerTab(tab.id);

    // Store content for the new tab to retrieve
    await chrome.storage.session.set({
      [`article_${tab.id}`]: content,
    });

    return tab.id;
  } catch (error) {
    console.error('Failed to open learning interface:', error);
    throw error;
  }
}

/**
 * Check system capabilities for Chrome AI APIs
 */
async function checkSystemCapabilities(): Promise<SystemCapabilities> {
  const capabilities: SystemCapabilities = {
    hasChromeAI: false,
    hasLanguageDetector: false,
    hasSummarizer: false,
    hasRewriter: false,
    hasTranslator: false,
    hasPromptAPI: false,
    hardwareInfo: {
      ram: 'Unknown',
      storage: 'Unknown',
      vram: 'Unknown',
    },
  };

  try {
    // Check for Chrome AI APIs availability
    // Note: These APIs are experimental and may not be available
    if ('ai' in self) {
      capabilities.hasChromeAI = true;

      // Check individual API availability
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ai = (self as any).ai;
      capabilities.hasLanguageDetector = 'languageDetector' in ai;
      capabilities.hasSummarizer = 'summarizer' in ai;
      capabilities.hasRewriter = 'rewriter' in ai;
      capabilities.hasTranslator = 'translator' in ai;
      capabilities.hasPromptAPI = 'languageModel' in ai;
    }

    // Try to get hardware info if available
    if ('navigator' in self && 'deviceMemory' in navigator) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      capabilities.hardwareInfo.ram = `${(navigator as any).deviceMemory} GB`;
    }

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota) {
        capabilities.hardwareInfo.storage = `${Math.round(estimate.quota / 1024 ** 3)} GB`;
      }
    }
  } catch (error) {
    console.error('Error checking system capabilities:', error);
  }

  return capabilities;
}

// Tab removal is now handled by memory manager automatically

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async details => {
  if (details.reason === 'install') {
    console.log('Extension installed, checking system capabilities...');
    const capabilities = await checkSystemCapabilities();
    console.log('System capabilities:', capabilities);

    // Set default settings
    await chrome.storage.local.set({
      settings: {
        nativeLanguage: 'en',
        learningLanguage: 'es',
        difficultyLevel: 5,
        autoHighlight: false,
        darkMode: false,
        fontSize: 16,
        apiKeys: {},
      },
    });
  }

  // Initialize memory and offscreen management
  await initializeMemoryManagement();
  await initializeOffscreenManagement();
});

/**
 * Handle extension shutdown
 */
chrome.runtime.onSuspend.addListener(async () => {
  console.log('Extension suspending, cleaning up resources...');
  await shutdownMemoryManagement();
  await shutdownOffscreenManagement();
});

// Initialize extension
console.log('Language Learning Extension service worker initialized');
