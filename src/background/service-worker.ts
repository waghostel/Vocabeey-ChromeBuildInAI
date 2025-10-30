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
import { globalErrorHandler } from '../utils/error-handler';

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

interface InjectionError {
  attemptedPath: string;
  tabId: number;
  tabUrl?: string;
  error: string;
  timestamp: number;
  suggestions: string[];
  chromeErrorCode?: string;
  contextInfo: {
    manifestVersion: string;
    extensionId: string;
    buildTimestamp?: string;
  };
}

interface InjectionSuccess {
  scriptPath: string;
  tabId: number;
  tabUrl?: string;
  timestamp: number;
  injectionTime: number;
  contextInfo: {
    manifestVersion: string;
    extensionId: string;
  };
}

// Memory manager will handle tab tracking
const memoryManager = getMemoryManager();

/**
 * Extract Chrome-specific error code from error message
 */
function extractChromeErrorCode(error: unknown): string | undefined {
  if (error instanceof Error) {
    // Look for Chrome extension error patterns
    const message = error.message;

    // Common Chrome extension error patterns
    const patterns = [
      /Cannot access contents of url "([^"]+)"/,
      /Cannot access a chrome:\/\/ URL/,
      /Cannot access a chrome-extension:\/\/ URL/,
      /The extensions gallery cannot be scripted/,
      /Cannot access a chrome-search:\/\/ URL/,
      /This page cannot be scripted due to an ExtensionsSettings policy/,
      /Could not load file '([^']+)'/,
      /File not found: ([^\s]+)/,
    ];

    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return message.match(pattern)?.[0] || 'CHROME_ERROR';
      }
    }

    // Generic Chrome API error detection
    if (
      message.includes('chrome.scripting') ||
      message.includes('executeScript')
    ) {
      return 'CHROME_SCRIPTING_ERROR';
    }
  }

  return undefined;
}

/**
 * Get build timestamp if available
 */
function getBuildTimestamp(): string | undefined {
  try {
    // Try to get build timestamp from manifest or other sources
    const manifest = chrome.runtime.getManifest();
    return manifest.version_name || manifest.version;
  } catch {
    return undefined;
  }
}

/**
 * Get recent injection errors for debugging
 */
async function getRecentInjectionErrors(
  limit: number = 5
): Promise<InjectionError[]> {
  try {
    const sessionData = await chrome.storage.session.get();
    const errors: InjectionError[] = [];

    for (const [key, value] of Object.entries(sessionData)) {
      if (
        key.startsWith('injection_error_') &&
        value &&
        typeof value === 'object'
      ) {
        errors.push(value as InjectionError);
      }
    }

    // Sort by timestamp (most recent first) and limit results
    return errors.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  } catch (error) {
    console.warn('Failed to retrieve injection errors:', error);
    return [];
  }
}

/**
 * Get recent injection successes for debugging
 */
async function getRecentInjectionSuccesses(
  limit: number = 5
): Promise<InjectionSuccess[]> {
  try {
    const sessionData = await chrome.storage.session.get();
    const successes: InjectionSuccess[] = [];

    for (const [key, value] of Object.entries(sessionData)) {
      if (
        key.startsWith('injection_success_') &&
        value &&
        typeof value === 'object'
      ) {
        successes.push(value as InjectionSuccess);
      }
    }

    // Sort by timestamp (most recent first) and limit results
    return successes.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  } catch (error) {
    console.warn('Failed to retrieve injection successes:', error);
    return [];
  }
}

/**
 * Get comprehensive injection debug information
 */
async function getInjectionDebugInfo(): Promise<{
  recentErrors: InjectionError[];
  recentSuccesses: InjectionSuccess[];
  statistics: {
    totalErrors: number;
    totalSuccesses: number;
    successRate: number;
    averageInjectionTime: number;
  };
  systemInfo: {
    manifestVersion: string;
    extensionId: string;
    buildVersion: string;
  };
}> {
  const [recentErrors, recentSuccesses] = await Promise.all([
    getRecentInjectionErrors(10),
    getRecentInjectionSuccesses(10),
  ]);

  // Calculate statistics
  const totalErrors = recentErrors.length;
  const totalSuccesses = recentSuccesses.length;
  const total = totalErrors + totalSuccesses;
  const successRate = total > 0 ? (totalSuccesses / total) * 100 : 0;

  const averageInjectionTime =
    recentSuccesses.length > 0
      ? recentSuccesses.reduce(
          (sum, success) => sum + success.injectionTime,
          0
        ) / recentSuccesses.length
      : 0;

  const manifest = chrome.runtime.getManifest();

  return {
    recentErrors,
    recentSuccesses,
    statistics: {
      totalErrors,
      totalSuccesses,
      successRate: Math.round(successRate * 100) / 100,
      averageInjectionTime: Math.round(averageInjectionTime * 100) / 100,
    },
    systemInfo: {
      manifestVersion: manifest.manifest_version.toString(),
      extensionId: chrome.runtime.id,
      buildVersion: manifest.version,
    },
  };
}

// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab): Promise<void> => {
  if (!tab.id) {
    const error = globalErrorHandler.createError(
      'invalid_input',
      'No tab ID available for content script injection',
      false
    );
    console.error('❌ Extension activation failed:', error.userMessage);
    return;
  }

  try {
    // Check if we can access the tab
    if (
      !tab.url ||
      tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://') ||
      tab.url.startsWith('chrome-search://') ||
      tab.url.startsWith('edge://') ||
      tab.url.startsWith('about:')
    ) {
      console.warn('⚠️ Cannot process restricted pages:', {
        tabId: tab.id,
        url: tab.url,
        reason: 'Chrome internal or extension page',
        suggestions: [
          'Try clicking the extension on a regular website',
          'Navigate to a news article or blog post',
          'Avoid chrome://, extension://, or about: pages',
        ],
      });
      return;
    }

    console.log('🚀 Starting content script injection:', {
      tabId: tab.id,
      url: tab.url,
      title: tab.title,
    });

    // Inject content script and process the page
    await processCurrentTab(tab.id);
  } catch (error) {
    // Enhanced error logging for the main action handler
    const extensionError = globalErrorHandler.normalizeError(
      error,
      'extension activation'
    );

    console.error('❌ Extension activation failed:', {
      tabId: tab.id,
      url: tab.url,
      error: extensionError.userMessage,
      suggestions: extensionError.suggestedAction,
      retryable: extensionError.retryable,
    });

    // Store error for potential user notification
    await chrome.storage.session.set({
      [`activation_error_${tab.id}`]: {
        error: extensionError,
        timestamp: Date.now(),
        tabInfo: {
          id: tab.id,
          url: tab.url,
          title: tab.title,
        },
      },
    });
  }
});

/**
 * Process the current tab and extract article content
 */
async function processCurrentTab(tabId: number): Promise<void> {
  const scriptPath = 'src/content/content-script.js';
  const startTime = Date.now();

  // Get tab information for context
  let tabInfo: chrome.tabs.Tab | undefined;
  try {
    tabInfo = await chrome.tabs.get(tabId);
  } catch (error) {
    console.warn('Could not get tab information:', error);
  }

  try {
    // Inject content script with enhanced error context
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [scriptPath],
    });

    const injectionTime = Date.now() - startTime;

    // Log successful injection with detailed context
    const successInfo: InjectionSuccess = {
      scriptPath,
      tabId,
      tabUrl: tabInfo?.url,
      timestamp: Date.now(),
      injectionTime,
      contextInfo: {
        manifestVersion: chrome.runtime
          .getManifest()
          .manifest_version.toString(),
        extensionId: chrome.runtime.id,
      },
    };

    console.log('✅ Content script injection successful:', {
      path: scriptPath,
      tabId,
      url: tabInfo?.url || 'unknown',
      injectionTime: `${injectionTime}ms`,
      timestamp: new Date(successInfo.timestamp).toISOString(),
    });

    // Store success metrics for debugging
    await chrome.storage.session.set({
      [`injection_success_${tabId}`]: successInfo,
    });
  } catch (error) {
    const injectionTime = Date.now() - startTime;

    // Create detailed error context
    const injectionError: InjectionError = {
      attemptedPath: scriptPath,
      tabId,
      tabUrl: tabInfo?.url,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
      suggestions: [
        'Verify content script file exists in dist/content/',
        'Check manifest.json content_scripts paths match',
        'Ensure build process completed successfully',
        'Verify tab permissions and URL accessibility',
        'Check Chrome extension file path resolution',
      ],
      chromeErrorCode: extractChromeErrorCode(error),
      contextInfo: {
        manifestVersion: chrome.runtime
          .getManifest()
          .manifest_version.toString(),
        extensionId: chrome.runtime.id,
        buildTimestamp: getBuildTimestamp(),
      },
    };

    // Enhanced error logging with structured information
    console.error('❌ Content script injection failed:', {
      path: scriptPath,
      tabId,
      url: tabInfo?.url || 'unknown',
      error: injectionError.error,
      chromeErrorCode: injectionError.chromeErrorCode,
      injectionTime: `${injectionTime}ms`,
      timestamp: new Date(injectionError.timestamp).toISOString(),
      suggestions: injectionError.suggestions,
    });

    // Store error details for debugging and user support
    await chrome.storage.session.set({
      [`injection_error_${tabId}`]: injectionError,
    });

    // Create user-friendly error using the error handler
    const extensionError = globalErrorHandler.createError(
      'processing_failed',
      `Failed to inject content script: ${injectionError.error}`,
      true, // retryable
      error instanceof Error ? error : new Error(String(error))
    );

    // Add specific suggestions for content script injection
    extensionError.suggestedAction =
      'Try refreshing the page or reloading the extension. ' +
      'If the problem persists, check that the extension was built correctly.';

    throw extensionError;
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

      case 'GET_INJECTION_DEBUG_INFO':
        getInjectionDebugInfo()
          .then(debugInfo => sendResponse({ success: true, data: debugInfo }))
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
      url: chrome.runtime.getURL('ui/learning-interface.html'),
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
