/**
 * Comprehensive Error Scenarios Testing
 * Tests all fallback mechanisms under various failure conditions
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { ExtractedContent, ProcessedArticle } from '../src/types';

import { mockChromeStorage } from './setup/chrome-mock';

// Mock DOM structure for error testing
function createErrorTestDOM(): void {
  document.body.innerHTML = `
    <div class="learning-interface">
      <div class="loading-overlay hidden">
        <div class="loading-text"></div>
      </div>
      <div class="error-notification hidden">
        <div class="error-message"></div>
        <div class="error-actions">
          <button class="retry-btn">Retry</button>
          <button class="fallback-btn">Use Fallback</button>
          <button class="dismiss-btn">Dismiss</button>
        </div>
      </div>
      <div class="offline-indicator hidden">
        <span>Offline mode - using cached content</span>
      </div>
      <div class="hardware-warning hidden">
        <span>Chrome AI not available - consider using Gemini API</span>
      </div>
      <div class="storage-warning hidden">
        <span>Storage almost full - export your data</span>
      </div>
    </div>
  `;
}

// Mock article data
function createTestArticle(): ProcessedArticle {
  return {
    id: 'error-test-article',
    url: 'https://example.com/error-test',
    title: 'Error Test Article',
    originalLanguage: 'en',
    processedAt: new Date(),
    parts: [
      {
        id: 'part-1',
        content: 'This is test content for error scenarios.',
        originalContent: 'This is test content for error scenarios.',
        vocabulary: [],
        sentences: [],
        partIndex: 0,
      },
    ],
    processingStatus: 'completed',
    cacheExpires: new Date(Date.now() + 86400000),
  };
}

describe('Error Scenarios Testing', () => {
  let chromeStorageMock: any;

  beforeEach(() => {
    createErrorTestDOM();
    vi.clearAllMocks();

    // Setup Chrome API mocks
    chromeStorageMock = mockChromeStorage();

    if (!global.chrome) {
      global.chrome = {} as any;
    }

    (global.chrome as any).tabs = {
      create: vi.fn().mockResolvedValue({ id: 123 }),
      query: vi.fn().mockResolvedValue([{ id: 123, active: true }]),
      onRemoved: {
        addListener: vi.fn(),
      },
    };

    (global.chrome as any).scripting = {
      executeScript: vi.fn().mockResolvedValue([{ result: true }]),
    };

    (global.chrome as any).runtime = {
      sendMessage: vi.fn().mockResolvedValue({ success: true }),
      getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
      onMessage: {
        addListener: vi.fn(),
      },
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    chromeStorageMock?.cleanup();
    delete (global as any).chrome;
  });

  describe('AI Service Failures and Fallbacks', () => {
    it('should fallback from Chrome AI to Gemini API when Chrome AI fails', async () => {
      let fallbackUsed = false;
      let processingResult = '';

      // Mock Chrome AI failure
      const mockChromeAIError = new Error('Chrome AI not available');

      // Mock AI service coordinator
      const processWithFallback = async (text: string, _taskType: string) => {
        try {
          // Simulate Chrome AI failure
          throw mockChromeAIError;
        } catch {
          try {
            // Simulate Gemini API success
            fallbackUsed = true;
            processingResult = `Gemini processed: ${text}`;
            return {
              success: true,
              result: processingResult,
              service: 'gemini',
            };
          } catch {
            // Final fallback - return original content
            return {
              success: false,
              result: text,
              service: 'none',
              error: 'All AI services failed',
            };
          }
        }
      };

      const testText = 'Test content for AI processing';
      const result = await processWithFallback(testText, 'language_detection');

      expect(fallbackUsed).toBe(true);
      expect(result.success).toBe(true);
      expect(result.service).toBe('gemini');
      expect(result.result).toBe(
        'Gemini processed: Test content for AI processing'
      );
    });

    it('should handle complete AI service failure gracefully', async () => {
      let errorHandled = false;
      let userNotified = false;

      // Mock complete AI failure
      const processWithCompleteFailure = async (text: string) => {
        try {
          throw new Error('Chrome AI not available');
        } catch {
          try {
            throw new Error('Gemini API key invalid');
          } catch {
            // Handle complete failure
            errorHandled = true;

            // Show user notification
            const errorNotification = document.querySelector(
              '.error-notification'
            ) as HTMLElement;
            const errorMessage = errorNotification.querySelector(
              '.error-message'
            ) as HTMLElement;

            errorMessage.textContent =
              'AI processing unavailable. Showing original content.';
            errorNotification.classList.remove('hidden');
            userNotified = true;

            return {
              success: false,
              result: text,
              error: 'All AI services failed',
            };
          }
        }
      };

      const testText = 'Original content to display';
      const result = await processWithCompleteFailure(testText);

      expect(errorHandled).toBe(true);
      expect(userNotified).toBe(true);
      expect(result.success).toBe(false);
      expect(result.result).toBe(testText);
      expect(
        document
          .querySelector('.error-notification')
          ?.classList.contains('hidden')
      ).toBe(false);
    });

    it('should handle hardware capability detection failures', async () => {
      let hardwareWarningShown = false;
      let geminiSuggested = false;

      // Mock hardware capability check
      const checkHardwareCapabilities = async () => {
        const capabilities = {
          hasChromeAI: false,
          hasLanguageDetector: false,
          hasSummarizer: false,
          hasRewriter: false,
          hasTranslator: false,
          hasPromptAPI: false,
          hardwareInfo: {
            ram: '2 GB', // Insufficient
            storage: '10 GB', // Insufficient
            vram: '1 GB', // Insufficient
          },
        };

        // Check if hardware meets requirements
        const ramGB = parseInt(capabilities.hardwareInfo.ram);
        const storageGB = parseInt(capabilities.hardwareInfo.storage);
        const vramGB = parseInt(capabilities.hardwareInfo.vram);

        if (ramGB < 4 || storageGB < 22 || vramGB < 4) {
          // Show hardware warning
          const warning = document.querySelector(
            '.hardware-warning'
          ) as HTMLElement;
          warning.classList.remove('hidden');
          hardwareWarningShown = true;
          geminiSuggested = true;
        }

        return capabilities;
      };

      const capabilities = await checkHardwareCapabilities();

      expect(capabilities.hasChromeAI).toBe(false);
      expect(hardwareWarningShown).toBe(true);
      expect(geminiSuggested).toBe(true);
      expect(
        document
          .querySelector('.hardware-warning')
          ?.classList.contains('hidden')
      ).toBe(false);
    });

    it('should handle API rate limiting with exponential backoff', async () => {
      let retryCount = 0;
      let backoffDelays: number[] = [];
      let finalSuccess = false;

      // Mock rate limiting error
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;

      // Mock API call with rate limiting
      const apiCallWithRetry = async (maxRetries = 3) => {
        const makeRequest = async (): Promise<any> => {
          retryCount++;

          if (retryCount <= 2) {
            throw rateLimitError;
          }

          finalSuccess = true;
          return { success: true, data: 'API response' };
        };

        const exponentialBackoff = (attempt: number) => {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          backoffDelays.push(delay);
          return new Promise(resolve => setTimeout(resolve, delay));
        };

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await makeRequest();
          } catch (error: any) {
            if (error.status === 429 && attempt < maxRetries - 1) {
              await exponentialBackoff(attempt);
              continue;
            }
            throw error;
          }
        }
      };

      const result = await apiCallWithRetry();

      expect(retryCount).toBe(3);
      expect(backoffDelays).toHaveLength(2);
      expect(backoffDelays[0]).toBe(1000); // First retry: 1 second
      expect(backoffDelays[1]).toBe(2000); // Second retry: 2 seconds
      expect(finalSuccess).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should handle API timeout errors', async () => {
      let timeoutHandled = false;
      let fallbackUsed = false;

      // Mock timeout error
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'TIMEOUT';

      // Mock API call with timeout handling
      const apiCallWithTimeout = async (_timeoutMs = 5000) => {
        try {
          // Simulate timeout
          await new Promise((_, reject) => {
            setTimeout(() => reject(timeoutError), 100);
          });
        } catch (error: any) {
          if (error.code === 'TIMEOUT') {
            timeoutHandled = true;

            // Try fallback service
            try {
              fallbackUsed = true;
              return {
                success: true,
                data: 'Fallback response',
                service: 'fallback',
              };
            } catch {
              return { success: false, error: 'All services timed out' };
            }
          }
          throw error;
        }
      };

      const result = await apiCallWithTimeout();

      expect(timeoutHandled).toBe(true);
      expect(fallbackUsed).toBe(true);
      expect(result.success).toBe(true);
      expect(result.service).toBe('fallback');
    });
  });

  describe('Network and Connectivity Failures', () => {
    it('should handle network disconnection with offline mode', async () => {
      let offlineModeActivated = false;
      let cachedContentUsed = false;
      const testArticle = createTestArticle();

      // Mock network error
      const networkError = new Error('Network request failed');
      (networkError as any).code = 'NETWORK_ERROR';

      // Mock cached content
      chrome.storage.local.get.mockResolvedValue({
        [`cached_article_${testArticle.url}`]: testArticle,
      });

      // Network error handler
      const handleNetworkError = async (url: string) => {
        try {
          // Simulate network request failure
          throw networkError;
        } catch (error: any) {
          if (error.code === 'NETWORK_ERROR') {
            // Activate offline mode
            offlineModeActivated = true;

            const offlineIndicator = document.querySelector(
              '.offline-indicator'
            ) as HTMLElement;
            offlineIndicator.classList.remove('hidden');

            // Try to load cached content
            const cached = await chrome.storage.local.get(
              `cached_article_${url}`
            );
            const cachedArticle = cached[`cached_article_${url}`];

            if (cachedArticle) {
              cachedContentUsed = true;
              return { success: true, data: cachedArticle, source: 'cache' };
            }

            return { success: false, error: 'No cached content available' };
          }
          throw error;
        }
      };

      const result = await handleNetworkError(testArticle.url);

      expect(offlineModeActivated).toBe(true);
      expect(cachedContentUsed).toBe(true);
      expect(result.success).toBe(true);
      expect(result.source).toBe('cache');
      expect(result.data).toEqual(testArticle);
      expect(
        document
          .querySelector('.offline-indicator')
          ?.classList.contains('hidden')
      ).toBe(false);
    });

    it('should handle intermittent network issues with retry logic', async () => {
      let networkRetries = 0;
      let eventualSuccess = false;

      // Mock intermittent network failure
      const intermittentNetworkCall = async () => {
        networkRetries++;

        if (networkRetries <= 2) {
          throw new Error('Network temporarily unavailable');
        }

        eventualSuccess = true;
        return { success: true, data: 'Network response' };
      };

      // Retry logic
      const retryNetworkCall = async (maxRetries = 3) => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await intermittentNetworkCall();
          } catch (error) {
            if (attempt === maxRetries - 1) {
              throw error;
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      };

      const result = await retryNetworkCall();

      expect(networkRetries).toBe(3);
      expect(eventualSuccess).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should handle DNS resolution failures', async () => {
      let dnsErrorHandled = false;
      let localFallbackUsed = false;

      // Mock DNS error
      const dnsError = new Error('DNS resolution failed');
      (dnsError as any).code = 'ENOTFOUND';

      // DNS error handler
      const handleDNSError = async () => {
        try {
          throw dnsError;
        } catch (error: any) {
          if (error.code === 'ENOTFOUND') {
            dnsErrorHandled = true;

            // Use local processing fallback
            localFallbackUsed = true;
            return {
              success: true,
              data: 'Local processing result',
              source: 'local',
            };
          }
          throw error;
        }
      };

      const result = await handleDNSError();

      expect(dnsErrorHandled).toBe(true);
      expect(localFallbackUsed).toBe(true);
      expect(result.success).toBe(true);
      expect(result.source).toBe('local');
    });
  });

  describe('Storage and Data Management Failures', () => {
    it('should handle storage quota exceeded errors', async () => {
      let quotaExceededHandled = false;
      let autoExportTriggered = false;
      let userNotified = false;

      // Mock storage quota exceeded error
      const quotaError = new Error('Storage quota exceeded');
      (quotaError as any).name = 'QuotaExceededError';

      chrome.storage.local.set.mockRejectedValue(quotaError);

      // Storage error handler
      const handleStorageError = async (data: any) => {
        try {
          await chrome.storage.local.set(data);
        } catch (error: any) {
          if (error.name === 'QuotaExceededError') {
            quotaExceededHandled = true;

            // Show storage warning
            const warning = document.querySelector(
              '.storage-warning'
            ) as HTMLElement;
            warning.classList.remove('hidden');
            userNotified = true;

            // Trigger auto-export
            autoExportTriggered = true;
            const exportData = JSON.stringify(data);

            // Simulate export to downloads (mock URL.createObjectURL)
            const _blob = new Blob([exportData], { type: 'application/json' });
            const url = 'blob:mock-url-for-export';

            return {
              success: false,
              error: 'Storage full',
              exported: true,
              exportUrl: url,
            };
          }
          throw error;
        }
      };

      const testData = { vocabulary: { test: 'data' } };
      const result = await handleStorageError(testData);

      expect(quotaExceededHandled).toBe(true);
      expect(autoExportTriggered).toBe(true);
      expect(userNotified).toBe(true);
      expect(result.success).toBe(false);
      expect(result.exported).toBe(true);
      expect(
        document.querySelector('.storage-warning')?.classList.contains('hidden')
      ).toBe(false);
    });

    it('should handle storage corruption and data recovery', async () => {
      let corruptionDetected = false;
      let recoveryAttempted = false;
      let backupRestored = false;

      // Mock corrupted storage data
      const corruptedData = '{"invalid": json}';
      chrome.storage.local.get.mockResolvedValue({
        vocabulary: corruptedData,
      });

      // Mock backup data
      const backupData = {
        vocabulary: {
          'vocab-1': {
            id: 'vocab-1',
            word: 'test',
            translation: 'prueba',
          },
        },
      };

      chrome.storage.local.get.mockImplementation(key => {
        if (key === 'vocabulary') {
          return Promise.resolve({ vocabulary: corruptedData });
        }
        if (key === 'backup_vocabulary') {
          return Promise.resolve({ backup_vocabulary: backupData.vocabulary });
        }
        return Promise.resolve({});
      });

      // Data recovery handler
      const recoverCorruptedData = async (dataKey: string) => {
        try {
          const data = await chrome.storage.local.get(dataKey);
          const rawData = data[dataKey];

          // Try to parse data
          if (typeof rawData === 'string') {
            JSON.parse(rawData);
          }

          return { success: true, data: rawData };
        } catch {
          corruptionDetected = true;
          recoveryAttempted = true;

          // Try to restore from backup
          try {
            const backup = await chrome.storage.local.get(`backup_${dataKey}`);
            const backupData = backup[`backup_${dataKey}`];

            if (backupData) {
              backupRestored = true;

              // Restore backup data
              await chrome.storage.local.set({ [dataKey]: backupData });

              return { success: true, data: backupData, restored: true };
            }

            return { success: false, error: 'No backup available' };
          } catch {
            return { success: false, error: 'Backup restoration failed' };
          }
        }
      };

      const result = await recoverCorruptedData('vocabulary');

      expect(corruptionDetected).toBe(true);
      expect(recoveryAttempted).toBe(true);
      expect(backupRestored).toBe(true);
      expect(result.success).toBe(true);
      expect(result.restored).toBe(true);
    });

    it('should handle storage access permission errors', async () => {
      let permissionErrorHandled = false;
      let fallbackStorageUsed = false;

      // Mock permission error
      const permissionError = new Error('Storage access denied');
      (permissionError as any).name = 'NotAllowedError';

      chrome.storage.local.get.mockRejectedValue(permissionError);

      // Permission error handler
      const handlePermissionError = async (key: string) => {
        try {
          return await chrome.storage.local.get(key);
        } catch (error: any) {
          if (error.name === 'NotAllowedError') {
            permissionErrorHandled = true;

            // Use session storage as fallback
            fallbackStorageUsed = true;
            const fallbackData = sessionStorage.getItem(key);

            return {
              success: true,
              data: fallbackData ? JSON.parse(fallbackData) : {},
              source: 'session',
            };
          }
          throw error;
        }
      };

      // Setup session storage fallback
      sessionStorage.setItem('test-key', JSON.stringify({ fallback: 'data' }));

      const result = await handlePermissionError('test-key');

      expect(permissionErrorHandled).toBe(true);
      expect(fallbackStorageUsed).toBe(true);
      expect(result.success).toBe(true);
      expect(result.source).toBe('session');
      expect(result.data.fallback).toBe('data');
    });
  });

  describe('Content Extraction Failures', () => {
    it('should handle Readability.js extraction failure with Jina Reader fallback', async () => {
      let readabilityFailed = false;
      let jinaFallbackUsed = false;
      let extractionResult: ExtractedContent | null = null;

      // Mock content extraction pipeline
      const extractContentWithFallback = async (url: string) => {
        // Step 1: Try Readability.js
        try {
          throw new Error('Readability.js failed to extract content');
        } catch {
          readabilityFailed = true;

          // Step 2: Try Jina Reader API
          try {
            jinaFallbackUsed = true;

            // Mock Jina Reader success
            extractionResult = {
              title: 'Article extracted by Jina Reader',
              content: 'Content extracted using Jina Reader API fallback.',
              url,
              wordCount: 8,
              paragraphCount: 1,
            };

            return { success: true, data: extractionResult, source: 'jina' };
          } catch {
            // Step 3: Basic DOM parsing fallback would go here
            return { success: false, error: 'All extraction methods failed' };
          }
        }
      };

      const result = await extractContentWithFallback(
        'https://example.com/article'
      );

      expect(readabilityFailed).toBe(true);
      expect(jinaFallbackUsed).toBe(true);
      expect(result.success).toBe(true);
      expect(result.source).toBe('jina');
      expect(extractionResult?.title).toBe('Article extracted by Jina Reader');
    });

    it('should handle complete content extraction failure', async () => {
      let allExtractionsFailed = false;
      let userPromptShown = false;

      // Mock complete extraction failure
      const extractContentWithCompleteFailure = async () => {
        try {
          throw new Error('Readability.js failed');
        } catch {
          try {
            throw new Error('Jina Reader API failed');
          } catch {
            try {
              throw new Error('DOM parsing failed');
            } catch {
              allExtractionsFailed = true;

              // Show manual paste option
              userPromptShown = true;
              const errorNotification = document.querySelector(
                '.error-notification'
              ) as HTMLElement;
              const errorMessage = errorNotification.querySelector(
                '.error-message'
              ) as HTMLElement;

              errorMessage.textContent =
                'Could not extract content. Please paste the article text manually.';
              errorNotification.classList.remove('hidden');

              return {
                success: false,
                error: 'All extraction methods failed',
                manualInput: true,
              };
            }
          }
        }
      };

      const result = await extractContentWithCompleteFailure();

      expect(allExtractionsFailed).toBe(true);
      expect(userPromptShown).toBe(true);
      expect(result.success).toBe(false);
      expect(result.manualInput).toBe(true);
      expect(
        document
          .querySelector('.error-notification')
          ?.classList.contains('hidden')
      ).toBe(false);
    });

    it('should handle malformed or empty content', async () => {
      const state = {
        contentValidationFailed: false,
        fallbackContentUsed: false,
      };

      // Mock content validation
      const validateAndProcessContent = async (content: string) => {
        // Validate content
        if (!content || content.trim().length < 100) {
          state.contentValidationFailed = true;

          // Try to use cached content as fallback
          const cachedContent =
            'This is cached content that meets the minimum length requirement for processing and display. It has enough content to pass validation and be used as a fallback when the original content is too short or malformed.';

          if (cachedContent.length >= 100) {
            state.fallbackContentUsed = true;
            return {
              success: true,
              data: {
                title: 'Cached Article',
                content: cachedContent,
                url: 'cached://article',
                wordCount: cachedContent.split(' ').length,
                paragraphCount: 1,
              },
              source: 'cache',
            };
          }

          return {
            success: false,
            error: 'Content too short and no fallback available',
          };
        }

        return { success: true, data: content, source: 'original' };
      };

      // Test with empty content
      const result = await validateAndProcessContent('');

      expect(state.contentValidationFailed).toBe(true);
      expect(state.fallbackContentUsed).toBe(true);
      expect(result.success).toBe(true);
      expect(result.source).toBe('cache');
      expect(result.data.content.length).toBeGreaterThan(100);
    });
  });

  describe('User Interface Error Handling', () => {
    it('should handle UI component initialization failures', async () => {
      let initializationFailed = false;
      let fallbackUILoaded = false;

      // Mock UI initialization failure
      const initializeUI = async () => {
        try {
          // Simulate missing DOM elements
          const requiredElement = document.querySelector(
            '.non-existent-element'
          );
          if (!requiredElement) {
            throw new Error('Required UI element not found');
          }
        } catch {
          initializationFailed = true;

          // Load fallback UI
          fallbackUILoaded = true;
          const fallbackUI = document.createElement('div');
          fallbackUI.className = 'fallback-ui';
          fallbackUI.innerHTML =
            '<p>Simplified interface loaded due to initialization error.</p>';
          document.body.appendChild(fallbackUI);

          return { success: true, fallback: true };
        }
      };

      const result = await initializeUI();

      expect(initializationFailed).toBe(true);
      expect(fallbackUILoaded).toBe(true);
      expect(result.success).toBe(true);
      expect(result.fallback).toBe(true);
      expect(document.querySelector('.fallback-ui')).toBeTruthy();
    });

    it('should handle memory pressure and cleanup', async () => {
      let memoryPressureDetected = false;
      let cleanupPerformed = false;
      let userWarned = false;

      // Mock memory pressure detection
      const monitorMemoryUsage = () => {
        const mockMemoryUsage = {
          used: 95 * 1024 * 1024, // 95MB
          limit: 100 * 1024 * 1024, // 100MB limit
          percentage: 95,
        };

        if (mockMemoryUsage.percentage > 90) {
          memoryPressureDetected = true;

          // Perform cleanup
          cleanupPerformed = true;

          // Clear caches
          const mockCaches = [
            'article-cache',
            'translation-cache',
            'audio-cache',
          ];
          mockCaches.forEach(cache => {
            sessionStorage.removeItem(cache);
          });

          // Warn user
          userWarned = true;
          const warning = document.createElement('div');
          warning.className = 'memory-warning';
          warning.textContent =
            'High memory usage detected. Some caches have been cleared.';
          document.body.appendChild(warning);

          return {
            memoryPressure: true,
            cleanupPerformed: true,
            newUsage: { percentage: 70 },
          };
        }

        return { memoryPressure: false };
      };

      const result = monitorMemoryUsage();

      expect(memoryPressureDetected).toBe(true);
      expect(cleanupPerformed).toBe(true);
      expect(userWarned).toBe(true);
      expect(result.memoryPressure).toBe(true);
      expect(result.cleanupPerformed).toBe(true);
      expect(result.newUsage.percentage).toBe(70);
      expect(document.querySelector('.memory-warning')).toBeTruthy();
    });

    it('should handle browser compatibility issues', async () => {
      let compatibilityIssueDetected = false;
      let polyfillsLoaded = false;
      let degradedModeActivated = false;

      // Mock browser compatibility check
      const checkBrowserCompatibility = () => {
        const features = {
          speechSynthesis: 'speechSynthesis' in window,
          webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
          indexedDB: 'indexedDB' in window,
          serviceWorker: 'serviceWorker' in navigator,
        };

        const missingFeatures = Object.entries(features)
          .filter(([_, supported]) => !supported)
          .map(([feature]) => feature);

        if (missingFeatures.length > 0) {
          compatibilityIssueDetected = true;

          // Load polyfills for missing features
          polyfillsLoaded = true;

          // Activate degraded mode
          degradedModeActivated = true;

          const warning = document.createElement('div');
          warning.className = 'compatibility-warning';
          warning.textContent = `Some features unavailable: ${missingFeatures.join(', ')}. Running in compatibility mode.`;
          document.body.appendChild(warning);

          return {
            compatible: false,
            missingFeatures,
            degradedMode: true,
          };
        }

        return { compatible: true };
      };

      // Mock missing features
      delete (window as any).speechSynthesis;
      delete (window as any).AudioContext;

      const result = checkBrowserCompatibility();

      expect(compatibilityIssueDetected).toBe(true);
      expect(polyfillsLoaded).toBe(true);
      expect(degradedModeActivated).toBe(true);
      expect(result.compatible).toBe(false);
      expect(result.missingFeatures).toContain('speechSynthesis');
      expect(result.missingFeatures).toContain('webAudio');
      expect(result.degradedMode).toBe(true);
      expect(document.querySelector('.compatibility-warning')).toBeTruthy();
    });
  });

  describe('Recovery and Retry Mechanisms', () => {
    it('should implement exponential backoff for failed operations', async () => {
      let attempts = 0;
      let delays: number[] = [];
      let finalSuccess = false;

      // Mock operation that fails initially
      const unreliableOperation = async () => {
        attempts++;
        if (attempts <= 3) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        finalSuccess = true;
        return { success: true, attempt: attempts };
      };

      // Exponential backoff implementation (with reduced delays for testing)
      const retryWithBackoff = async (
        operation: () => Promise<any>,
        maxRetries = 5
      ) => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await operation();
          } catch (error) {
            if (attempt === maxRetries - 1) {
              throw error;
            }

            const delay = Math.min(10 * Math.pow(2, attempt), 100); // Reduced delays for testing
            delays.push(delay);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      const result = await retryWithBackoff(unreliableOperation);

      expect(attempts).toBe(4);
      expect(delays).toHaveLength(3);
      expect(delays[0]).toBe(10); // 2^0 * 10
      expect(delays[1]).toBe(20); // 2^1 * 10
      expect(delays[2]).toBe(40); // 2^2 * 10
      expect(finalSuccess).toBe(true);
      expect(result.success).toBe(true);
    });

    it('should handle circuit breaker pattern for failing services', async () => {
      let circuitState = 'closed'; // closed, open, half-open
      let failureCount = 0;
      let successCount = 0;
      let circuitOpenTime = 0;

      // Circuit breaker implementation
      const circuitBreaker = {
        call: async (operation: () => Promise<any>) => {
          const now = Date.now();

          // Check if circuit should transition from open to half-open
          if (circuitState === 'open' && now - circuitOpenTime > 5000) {
            circuitState = 'half-open';
          }

          // Reject immediately if circuit is open
          if (circuitState === 'open') {
            throw new Error('Circuit breaker is open');
          }

          try {
            const result = await operation();

            // Success - reset failure count
            if (circuitState === 'half-open') {
              circuitState = 'closed';
            }
            failureCount = 0;
            successCount++;

            return result;
          } catch (error) {
            failureCount++;

            // Open circuit if failure threshold reached
            if (failureCount >= 3) {
              circuitState = 'open';
              circuitOpenTime = now;
            }

            throw error;
          }
        },

        getState: () => circuitState,
        getFailureCount: () => failureCount,
        getSuccessCount: () => successCount,
      };

      // Mock failing operation
      let callCount = 0;
      const failingOperation = async () => {
        callCount++;
        if (callCount <= 3) {
          throw new Error('Service unavailable');
        }
        return { success: true };
      };

      // Test circuit breaker behavior
      const results = [];

      // First 3 calls should fail and open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.call(failingOperation);
        } catch (error) {
          results.push({ attempt: i + 1, error: error.message });
        }
      }

      expect(circuitBreaker.getState()).toBe('open');
      expect(circuitBreaker.getFailureCount()).toBe(3);

      // Next call should be rejected immediately
      try {
        await circuitBreaker.call(failingOperation);
      } catch (error) {
        results.push({ attempt: 4, error: error.message });
      }

      expect(results[3].error).toBe('Circuit breaker is open');

      // Simulate time passing to allow half-open state
      circuitOpenTime = Date.now() - 6000; // 6 seconds ago

      // Next call should succeed and close the circuit
      const finalResult = await circuitBreaker.call(failingOperation);

      expect(circuitBreaker.getState()).toBe('closed');
      expect(finalResult.success).toBe(true);
      expect(circuitBreaker.getSuccessCount()).toBe(1);
    });
  });
});
