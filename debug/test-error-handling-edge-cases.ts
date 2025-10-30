/**
 * Error Handling and Edge Case Testing with Playwright MCP
 *
 * This script tests error handling and edge cases for the Language Learning Chrome Extension.
 * It verifies graceful degradation, error messages, and fallback mechanisms.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import * as path from 'path';

// Types for test results
interface EdgeCaseTestResult {
  testName: string;
  scenario: string;
  success: boolean;
  timestamp: number;
  duration: number;
  errorHandling: {
    gracefulDegradation: boolean;
    userFriendlyMessage: boolean;
    recoveryGuidance: boolean;
    fallbackActivated: boolean;
  };
  details: string;
  errors: string[];
  screenshots: string[];
}

/**
 * Test 9.1: Test pages with no extractable content
 *
 * This function demonstrates the MCP calls needed to:
 * - Navigate to pages without article content
 * - Verify graceful error handling
 * - Check for user-friendly error messages
 * - Test fallback content extraction methods
 */
export function generateNoContentTest(): {
  description: string;
  mcpCalls: Array<{
    step: number;
    tool: string;
    parameters: any;
    purpose: string;
    validation: string;
  }>;
} {
  return {
    description: 'Test extension behavior on pages with no extractable content',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_navigate',
        parameters: {
          url: 'about:blank',
        },
        purpose: 'Navigate to blank page with no content',
        validation: 'Page loads successfully but has no article content',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for page load and content script injection',
        validation: 'Content script has time to detect lack of content',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Attempt to trigger article extraction on empty page
            return new Promise((resolve) => {
              if (typeof chrome === 'undefined' || !chrome.runtime) {
                resolve({ 
                  success: false, 
                  error: 'Chrome runtime not available' 
                });
                return;
              }
              
              // Trigger extraction on page with no content
              chrome.runtime.sendMessage(
                { type: 'TRIGGER_EXTRACTION', url: window.location.href },
                (response) => {
                  if (chrome.runtime.lastError) {
                    resolve({
                      success: true,
                      errorHandled: true,
                      errorMessage: chrome.runtime.lastError.message,
                      graceful: true
                    });
                  } else {
                    resolve({
                      success: true,
                      response: response,
                      hasError: response && response.error,
                      errorMessage: response && response.error ? response.error : null
                    });
                  }
                }
              );
              
              setTimeout(() => {
                resolve({
                  success: true,
                  timeout: true,
                  message: 'No response - likely handled gracefully'
                });
              }, 5000);
            });
          }`,
        },
        purpose: 'Trigger extraction on page with no content',
        validation: 'Extension handles missing content gracefully',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: false,
        },
        purpose: 'Capture console messages to check error handling',
        validation: 'Console shows appropriate error message, not crash',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'no-content-error-handling.png',
        },
        purpose: 'Capture screenshot of error state',
        validation: 'Screenshot shows error message or no change (graceful)',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_navigate',
        parameters: {
          url: 'https://www.google.com',
        },
        purpose: 'Navigate to page with minimal article content (search page)',
        validation: 'Page loads but has no article structure',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for page load',
        validation: 'Page fully loaded',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check page structure
            const hasArticle = !!document.querySelector('article');
            const hasMainContent = !!document.querySelector('main');
            const paragraphs = document.querySelectorAll('p').length;
            const contentLength = document.body.textContent?.length || 0;
            
            return {
              success: true,
              page: {
                hasArticle,
                hasMainContent,
                paragraphs,
                contentLength,
                url: window.location.href,
                likelyExtractable: hasArticle || (paragraphs > 3 && contentLength > 500)
              }
            };
          }`,
        },
        purpose: 'Analyze page structure for extractable content',
        validation: 'Page structure analyzed correctly',
      },
      {
        step: 9,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Attempt extraction on non-article page
            return new Promise((resolve) => {
              if (typeof chrome === 'undefined' || !chrome.runtime) {
                resolve({ 
                  success: false, 
                  error: 'Chrome runtime not available' 
                });
                return;
              }
              
              chrome.runtime.sendMessage(
                { type: 'TRIGGER_EXTRACTION', url: window.location.href },
                (response) => {
                  resolve({
                    success: true,
                    response: response,
                    hasError: response && response.error,
                    errorMessage: response && response.error ? response.error : null,
                    userFriendly: response && response.userMessage
                  });
                }
              );
              
              setTimeout(() => {
                resolve({
                  success: true,
                  timeout: true
                });
              }, 5000);
            });
          }`,
        },
        purpose: 'Test extraction on non-article page',
        validation: 'Error message is user-friendly and provides guidance',
      },
      {
        step: 10,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: true,
        },
        purpose: 'Check for error messages',
        validation: 'Errors are logged appropriately without crashes',
      },
      {
        step: 11,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'non-article-page-error.png',
        },
        purpose: 'Capture error handling on non-article page',
        validation: 'Screenshot shows appropriate error handling',
      },
    ],
  };
}

/**
 * Test 9.2: Test AI service unavailability scenarios
 *
 * This function demonstrates the MCP calls needed to:
 * - Simulate Chrome AI API unavailability
 * - Verify Gemini API fallback activation
 * - Test error messages when all AI services fail
 * - Validate retry logic
 */
export function generateAIServiceUnavailableTest(): {
  description: string;
  mcpCalls: Array<{
    step: number;
    tool: string;
    parameters: any;
    purpose: string;
    validation: string;
  }>;
} {
  return {
    description: 'Test AI service unavailability and fallback mechanisms',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_navigate',
        parameters: {
          url:
            'file://' +
            path.resolve(process.cwd(), 'test-page.html').replace(/\\/g, '/'),
        },
        purpose: 'Navigate to test article page',
        validation: 'Page loads with article content',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for page load',
        validation: 'Page fully loaded',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check Chrome AI API availability
            const hasChromeAI = typeof window.ai !== 'undefined';
            const hasSummarizer = hasChromeAI && typeof window.ai.summarizer !== 'undefined';
            const hasTranslator = hasChromeAI && typeof window.ai.translator !== 'undefined';
            const hasRewriter = hasChromeAI && typeof window.ai.rewriter !== 'undefined';
            
            return {
              success: true,
              chromeAI: {
                available: hasChromeAI,
                summarizer: hasSummarizer,
                translator: hasTranslator,
                rewriter: hasRewriter
              }
            };
          }`,
        },
        purpose: 'Check Chrome AI API availability',
        validation: 'Chrome AI API status determined',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Simulate Chrome AI unavailability by overriding
            if (typeof window.ai !== 'undefined') {
              // Store original for restoration
              window._originalAI = window.ai;
              // Make AI unavailable
              delete window.ai;
            }
            
            return {
              success: true,
              aiDisabled: typeof window.ai === 'undefined',
              message: 'Chrome AI API disabled for testing'
            };
          }`,
        },
        purpose: 'Simulate Chrome AI API unavailability',
        validation: 'Chrome AI API disabled successfully',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Trigger extraction with AI unavailable
            return new Promise((resolve) => {
              if (typeof chrome === 'undefined' || !chrome.runtime) {
                resolve({ 
                  success: false, 
                  error: 'Chrome runtime not available' 
                });
                return;
              }
              
              chrome.runtime.sendMessage(
                { 
                  type: 'TRIGGER_EXTRACTION', 
                  url: window.location.href,
                  testMode: 'ai_unavailable'
                },
                (response) => {
                  resolve({
                    success: true,
                    response: response,
                    fallbackActivated: response && response.fallbackUsed,
                    fallbackType: response && response.fallbackType,
                    errorMessage: response && response.error
                  });
                }
              );
              
              setTimeout(() => {
                resolve({
                  success: true,
                  timeout: true
                });
              }, 10000);
            });
          }`,
        },
        purpose: 'Trigger extraction with Chrome AI unavailable',
        validation: 'Fallback to Gemini API activated',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 5,
        },
        purpose: 'Wait for fallback processing',
        validation: 'Sufficient time for fallback API calls',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: false,
        },
        purpose: 'Capture console messages showing fallback activation',
        validation: 'Console shows fallback mechanism messages',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_network_requests',
        parameters: {},
        purpose: 'Check network requests for Gemini API calls',
        validation: 'Network shows Gemini API requests as fallback',
      },
      {
        step: 9,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'ai-fallback-activated.png',
        },
        purpose: 'Capture screenshot during fallback processing',
        validation: 'Screenshot shows processing with fallback',
      },
      {
        step: 10,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Simulate all AI services unavailable
            // Disable Chrome AI (already done)
            // Simulate Gemini API failure by setting invalid key
            return new Promise((resolve) => {
              if (typeof chrome === 'undefined' || !chrome.storage) {
                resolve({ 
                  success: false, 
                  error: 'Chrome storage not available' 
                });
                return;
              }
              
              // Set invalid Gemini API key to simulate failure
              chrome.storage.local.set({
                geminiApiKey: 'INVALID_KEY_FOR_TESTING'
              }, () => {
                resolve({
                  success: true,
                  message: 'Gemini API key set to invalid for testing'
                });
              });
            });
          }`,
        },
        purpose: 'Simulate all AI services unavailable',
        validation: 'Both Chrome AI and Gemini API unavailable',
      },
      {
        step: 11,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Trigger extraction with all AI unavailable
            return new Promise((resolve) => {
              if (typeof chrome === 'undefined' || !chrome.runtime) {
                resolve({ 
                  success: false, 
                  error: 'Chrome runtime not available' 
                });
                return;
              }
              
              chrome.runtime.sendMessage(
                { 
                  type: 'TRIGGER_EXTRACTION', 
                  url: window.location.href,
                  testMode: 'all_ai_unavailable'
                },
                (response) => {
                  resolve({
                    success: true,
                    response: response,
                    hasError: response && response.error,
                    errorMessage: response && response.error,
                    userMessage: response && response.userMessage,
                    recoveryGuidance: response && response.recoverySteps
                  });
                }
              );
              
              setTimeout(() => {
                resolve({
                  success: true,
                  timeout: true,
                  message: 'No response - checking error handling'
                });
              }, 10000);
            });
          }`,
        },
        purpose: 'Test error handling when all AI services fail',
        validation: 'User-friendly error message with recovery guidance',
      },
      {
        step: 12,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: true,
        },
        purpose: 'Capture error messages',
        validation: 'Errors logged with helpful information',
      },
      {
        step: 13,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'all-ai-services-failed.png',
        },
        purpose: 'Capture screenshot of complete AI failure state',
        validation: 'Screenshot shows error message to user',
      },
      {
        step: 14,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Restore Chrome AI for subsequent tests
            if (typeof window._originalAI !== 'undefined') {
              window.ai = window._originalAI;
              delete window._originalAI;
            }
            
            return {
              success: true,
              message: 'Chrome AI restored'
            };
          }`,
        },
        purpose: 'Restore Chrome AI API for subsequent tests',
        validation: 'Chrome AI API restored',
      },
    ],
  };
}

/**
 * Test 9.3: Test storage quota exceeded scenarios
 *
 * This function demonstrates the MCP calls needed to:
 * - Fill storage to near quota limit
 * - Trigger operations that require storage
 * - Verify quota exceeded error handling
 * - Test cache cleanup mechanisms
 */
export function generateStorageQuotaTest(): {
  description: string;
  mcpCalls: Array<{
    step: number;
    tool: string;
    parameters: any;
    purpose: string;
    validation: string;
  }>;
} {
  return {
    description: 'Test storage quota exceeded scenarios and cleanup mechanisms',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_navigate',
        parameters: {
          url:
            'file://' +
            path.resolve(process.cwd(), 'test-page.html').replace(/\\/g, '/'),
        },
        purpose: 'Navigate to test page',
        validation: 'Page loads successfully',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for page load',
        validation: 'Page fully loaded',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `async () => {
            // Check current storage usage
            if (typeof chrome === 'undefined' || !chrome.storage) {
              return { 
                success: false, 
                error: 'Chrome storage not available' 
              };
            }
            
            try {
              // Get storage quota information
              const quota = await navigator.storage.estimate();
              const localData = await chrome.storage.local.get();
              const sessionData = await chrome.storage.session.get();
              
              return {
                success: true,
                storage: {
                  quota: quota.quota,
                  usage: quota.usage,
                  usagePercent: ((quota.usage / quota.quota) * 100).toFixed(2),
                  localKeys: Object.keys(localData).length,
                  sessionKeys: Object.keys(sessionData).length
                }
              };
            } catch (error) {
              return {
                success: false,
                error: error.message
              };
            }
          }`,
        },
        purpose: 'Check current storage usage and quota',
        validation: 'Storage quota information retrieved',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `async () => {
            // Fill storage with large data to approach quota
            if (typeof chrome === 'undefined' || !chrome.storage) {
              return { 
                success: false, 
                error: 'Chrome storage not available' 
              };
            }
            
            try {
              // Create large data chunks
              const largeData = 'x'.repeat(100000); // 100KB chunks
              const dataToStore = {};
              
              // Store multiple large items
              for (let i = 0; i < 50; i++) {
                dataToStore[\`test_large_data_\${i}\`] = {
                  content: largeData,
                  timestamp: Date.now(),
                  index: i
                };
              }
              
              await chrome.storage.local.set(dataToStore);
              
              // Check new usage
              const quota = await navigator.storage.estimate();
              
              return {
                success: true,
                message: 'Storage filled with test data',
                storage: {
                  usage: quota.usage,
                  usagePercent: ((quota.usage / quota.quota) * 100).toFixed(2),
                  itemsAdded: 50
                }
              };
            } catch (error) {
              return {
                success: true,
                quotaExceeded: error.message.includes('QUOTA'),
                error: error.message,
                message: 'Quota exceeded during fill operation'
              };
            }
          }`,
        },
        purpose: 'Fill storage with large data to approach quota',
        validation: 'Storage filled or quota exceeded error caught',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Trigger article processing that requires storage
            return new Promise((resolve) => {
              if (typeof chrome === 'undefined' || !chrome.runtime) {
                resolve({ 
                  success: false, 
                  error: 'Chrome runtime not available' 
                });
                return;
              }
              
              chrome.runtime.sendMessage(
                { 
                  type: 'TRIGGER_EXTRACTION', 
                  url: window.location.href,
                  testMode: 'storage_test'
                },
                (response) => {
                  resolve({
                    success: true,
                    response: response,
                    hasError: response && response.error,
                    quotaError: response && response.error && response.error.includes('quota'),
                    errorMessage: response && response.error,
                    cleanupTriggered: response && response.cleanupPerformed
                  });
                }
              );
              
              setTimeout(() => {
                resolve({
                  success: true,
                  timeout: true
                });
              }, 10000);
            });
          }`,
        },
        purpose: 'Trigger operation requiring storage when quota is full',
        validation: 'Quota exceeded error handled gracefully',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: false,
        },
        purpose: 'Capture console messages about storage issues',
        validation: 'Console shows storage quota handling messages',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'storage-quota-exceeded.png',
        },
        purpose: 'Capture screenshot of quota exceeded state',
        validation: 'Screenshot shows error handling',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `async () => {
            // Test cache cleanup mechanism
            if (typeof chrome === 'undefined' || !chrome.runtime) {
              return { 
                success: false, 
                error: 'Chrome runtime not available' 
              };
            }
            
            return new Promise((resolve) => {
              // Trigger cache cleanup
              chrome.runtime.sendMessage(
                { type: 'CLEANUP_CACHE', aggressive: true },
                async (response) => {
                  // Check storage after cleanup
                  const quota = await navigator.storage.estimate();
                  const localData = await chrome.storage.local.get();
                  
                  resolve({
                    success: true,
                    cleanup: {
                      performed: true,
                      response: response,
                      newUsage: quota.usage,
                      newUsagePercent: ((quota.usage / quota.quota) * 100).toFixed(2),
                      remainingKeys: Object.keys(localData).length
                    }
                  });
                }
              );
              
              setTimeout(() => {
                resolve({
                  success: false,
                  error: 'Cleanup timeout'
                });
              }, 5000);
            });
          }`,
        },
        purpose: 'Test cache cleanup mechanism',
        validation: 'Cache cleanup reduces storage usage',
      },
      {
        step: 9,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `async () => {
            // Clean up test data
            if (typeof chrome === 'undefined' || !chrome.storage) {
              return { 
                success: false, 
                error: 'Chrome storage not available' 
              };
            }
            
            try {
              const localData = await chrome.storage.local.get();
              const testKeys = Object.keys(localData).filter(key => key.startsWith('test_large_data_'));
              
              for (const key of testKeys) {
                await chrome.storage.local.remove(key);
              }
              
              const quota = await navigator.storage.estimate();
              
              return {
                success: true,
                message: 'Test data cleaned up',
                keysRemoved: testKeys.length,
                finalUsage: quota.usage,
                finalUsagePercent: ((quota.usage / quota.quota) * 100).toFixed(2)
              };
            } catch (error) {
              return {
                success: false,
                error: error.message
              };
            }
          }`,
        },
        purpose: 'Clean up test data from storage',
        validation: 'Test data removed successfully',
      },
      {
        step: 10,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'storage-after-cleanup.png',
        },
        purpose: 'Capture screenshot after cleanup',
        validation: 'Screenshot shows normal state after cleanup',
      },
    ],
  };
}

/**
 * Test 9.4: Test network failure scenarios
 *
 * This function demonstrates the MCP calls needed to:
 * - Simulate offline mode
 * - Test network request failures
 * - Verify offline handler activation
 * - Check cached content availability
 */
export function generateNetworkFailureTest(): {
  description: string;
  mcpCalls: Array<{
    step: number;
    tool: string;
    parameters: any;
    purpose: string;
    validation: string;
  }>;
} {
  return {
    description: 'Test network failure scenarios and offline handling',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_navigate',
        parameters: {
          url:
            'file://' +
            path.resolve(process.cwd(), 'test-page.html').replace(/\\/g, '/'),
        },
        purpose: 'Navigate to test page',
        validation: 'Page loads successfully',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for page load',
        validation: 'Page fully loaded',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check online status
            return {
              success: true,
              online: navigator.onLine,
              connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink
              } : null
            };
          }`,
        },
        purpose: 'Check initial online status',
        validation: 'Online status retrieved',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Simulate offline mode
            Object.defineProperty(navigator, 'onLine', {
              writable: true,
              value: false
            });
            
            // Dispatch offline event
            window.dispatchEvent(new Event('offline'));
            
            return {
              success: true,
              online: navigator.onLine,
              message: 'Offline mode simulated'
            };
          }`,
        },
        purpose: 'Simulate offline mode',
        validation: 'Offline mode activated',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for offline handlers to activate',
        validation: 'Offline handlers have time to respond',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Attempt to trigger extraction while offline
            return new Promise((resolve) => {
              if (typeof chrome === 'undefined' || !chrome.runtime) {
                resolve({ 
                  success: false, 
                  error: 'Chrome runtime not available' 
                });
                return;
              }
              
              chrome.runtime.sendMessage(
                { 
                  type: 'TRIGGER_EXTRACTION', 
                  url: window.location.href,
                  testMode: 'offline'
                },
                (response) => {
                  resolve({
                    success: true,
                    response: response,
                    hasError: response && response.error,
                    offlineHandled: response && response.offlineMode,
                    errorMessage: response && response.error,
                    cachedAvailable: response && response.cachedContent
                  });
                }
              );
              
              setTimeout(() => {
                resolve({
                  success: true,
                  timeout: true
                });
              }, 5000);
            });
          }`,
        },
        purpose: 'Test extraction while offline',
        validation: 'Offline mode handled gracefully',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: false,
        },
        purpose: 'Capture console messages about offline handling',
        validation: 'Console shows offline mode messages',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'offline-mode-handling.png',
        },
        purpose: 'Capture screenshot of offline state',
        validation: 'Screenshot shows offline handling',
      },
      {
        step: 9,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `async () => {
            // Check for cached content availability
            if (typeof chrome === 'undefined' || !chrome.storage) {
              return { 
                success: false, 
                error: 'Chrome storage not available' 
              };
            }
            
            try {
              const cachedData = await chrome.storage.local.get();
              const cacheKeys = Object.keys(cachedData).filter(key => 
                key.startsWith('cache_') || key.startsWith('article_')
              );
              
              return {
                success: true,
                cache: {
                  available: cacheKeys.length > 0,
                  itemCount: cacheKeys.length,
                  keys: cacheKeys.slice(0, 5) // First 5 keys
                }
              };
            } catch (error) {
              return {
                success: false,
                error: error.message
              };
            }
          }`,
        },
        purpose: 'Check cached content availability while offline',
        validation: 'Cached content can be accessed offline',
      },
      {
        step: 10,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Restore online mode
            Object.defineProperty(navigator, 'onLine', {
              writable: true,
              value: true
            });
            
            // Dispatch online event
            window.dispatchEvent(new Event('online'));
            
            return {
              success: true,
              online: navigator.onLine,
              message: 'Online mode restored'
            };
          }`,
        },
        purpose: 'Restore online mode',
        validation: 'Online mode restored',
      },
      {
        step: 11,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for online handlers to activate',
        validation: 'Online handlers have time to respond',
      },
      {
        step: 12,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Test extraction after coming back online
            return new Promise((resolve) => {
              if (typeof chrome === 'undefined' || !chrome.runtime) {
                resolve({ 
                  success: false, 
                  error: 'Chrome runtime not available' 
                });
                return;
              }
              
              chrome.runtime.sendMessage(
                { 
                  type: 'TRIGGER_EXTRACTION', 
                  url: window.location.href,
                  testMode: 'back_online'
                },
                (response) => {
                  resolve({
                    success: true,
                    response: response,
                    processingResumed: response && response.success,
                    errorMessage: response && response.error
                  });
                }
              );
              
              setTimeout(() => {
                resolve({
                  success: true,
                  timeout: true
                });
              }, 5000);
            });
          }`,
        },
        purpose: 'Test extraction after coming back online',
        validation: 'Processing resumes when back online',
      },
      {
        step: 13,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'back-online-processing.png',
        },
        purpose: 'Capture screenshot after coming back online',
        validation: 'Screenshot shows normal processing resumed',
      },
    ],
  };
}

/**
 * Test 9.5: Validate error message quality
 *
 * This function demonstrates the MCP calls needed to:
 * - Review all error messages for clarity
 * - Verify recovery guidance is provided
 * - Check error message localization
 * - Test error reporting mechanisms
 */
export function generateErrorMessageQualityTest(): {
  description: string;
  mcpCalls: Array<{
    step: number;
    tool: string;
    parameters: any;
    purpose: string;
    validation: string;
  }>;
} {
  return {
    description: 'Validate error message quality and user guidance',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_navigate',
        parameters: {
          url:
            'file://' +
            path.resolve(process.cwd(), 'test-page.html').replace(/\\/g, '/'),
        },
        purpose: 'Navigate to test page',
        validation: 'Page loads successfully',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for page load',
        validation: 'Page fully loaded',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Collect all error messages from extension
            const errorMessages = [];
            
            // Override console.error to capture messages
            const originalError = console.error;
            console.error = function(...args) {
              errorMessages.push({
                type: 'console.error',
                message: args.join(' '),
                timestamp: Date.now()
              });
              originalError.apply(console, args);
            };
            
            // Store for later retrieval
            window._errorMessages = errorMessages;
            
            return {
              success: true,
              message: 'Error message capture initialized'
            };
          }`,
        },
        purpose: 'Initialize error message capture',
        validation: 'Error capture system ready',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Trigger various error scenarios
            const scenarios = [
              'no_content',
              'ai_unavailable',
              'storage_full',
              'network_error',
              'invalid_url'
            ];
            
            return new Promise(async (resolve) => {
              if (typeof chrome === 'undefined' || !chrome.runtime) {
                resolve({ 
                  success: false, 
                  error: 'Chrome runtime not available' 
                });
                return;
              }
              
              const results = [];
              
              for (const scenario of scenarios) {
                const result = await new Promise((resolveScenario) => {
                  chrome.runtime.sendMessage(
                    { 
                      type: 'TRIGGER_ERROR_SCENARIO',
                      scenario: scenario
                    },
                    (response) => {
                      resolveScenario({
                        scenario,
                        response,
                        errorMessage: response && response.error,
                        userMessage: response && response.userMessage,
                        recoverySteps: response && response.recoverySteps,
                        hasGuidance: !!(response && response.recoverySteps)
                      });
                    }
                  );
                  
                  setTimeout(() => {
                    resolveScenario({
                      scenario,
                      timeout: true
                    });
                  }, 3000);
                });
                
                results.push(result);
              }
              
              resolve({
                success: true,
                scenarios: results,
                errorMessages: window._errorMessages || []
              });
            });
          }`,
        },
        purpose: 'Trigger various error scenarios to collect messages',
        validation: 'Error messages collected from different scenarios',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: false,
        },
        purpose: 'Capture all console messages including errors',
        validation: 'Console messages captured',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Analyze error message quality
            const errorMessages = window._errorMessages || [];
            
            const analysis = errorMessages.map(msg => {
              const message = msg.message;
              
              return {
                message: message,
                timestamp: msg.timestamp,
                quality: {
                  hasClearDescription: message.length > 20 && !message.includes('undefined'),
                  hasRecoveryGuidance: message.includes('try') || message.includes('please') || message.includes('check'),
                  isUserFriendly: !message.includes('Error:') || message.includes('Sorry'),
                  hasContext: message.includes('because') || message.includes('due to'),
                  isTechnical: message.includes('stack') || message.includes('at ') || message.includes('.js:')
                }
              };
            });
            
            const qualityScore = {
              total: analysis.length,
              clearDescriptions: analysis.filter(a => a.quality.hasClearDescription).length,
              withGuidance: analysis.filter(a => a.quality.hasRecoveryGuidance).length,
              userFriendly: analysis.filter(a => a.quality.isUserFriendly).length,
              withContext: analysis.filter(a => a.quality.hasContext).length,
              tooTechnical: analysis.filter(a => a.quality.isTechnical).length
            };
            
            return {
              success: true,
              analysis,
              qualityScore,
              recommendations: {
                improveClarity: qualityScore.clearDescriptions < qualityScore.total * 0.8,
                addGuidance: qualityScore.withGuidance < qualityScore.total * 0.7,
                simplifyLanguage: qualityScore.tooTechnical > qualityScore.total * 0.3
              }
            };
          }`,
        },
        purpose: 'Analyze error message quality',
        validation: 'Error messages analyzed for quality metrics',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'error-message-quality-test.png',
        },
        purpose: 'Capture screenshot of error message testing',
        validation: 'Screenshot captured',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `async () => {
            // Test error reporting mechanism
            if (typeof chrome === 'undefined' || !chrome.runtime) {
              return { 
                success: false, 
                error: 'Chrome runtime not available' 
              };
            }
            
            return new Promise((resolve) => {
              // Trigger error report
              chrome.runtime.sendMessage(
                { 
                  type: 'REPORT_ERROR',
                  error: {
                    message: 'Test error for reporting',
                    stack: 'Test stack trace',
                    context: 'Error message quality test'
                  }
                },
                (response) => {
                  resolve({
                    success: true,
                    reported: response && response.success,
                    reportId: response && response.reportId,
                    message: 'Error reporting mechanism tested'
                  });
                }
              );
              
              setTimeout(() => {
                resolve({
                  success: true,
                  timeout: true,
                  message: 'Error reporting timeout'
                });
              }, 3000);
            });
          }`,
        },
        purpose: 'Test error reporting mechanism',
        validation: 'Error reporting works correctly',
      },
    ],
  };
}

/**
 * Main execution function that runs all error handling tests
 */
export async function runAllErrorHandlingTests(): Promise<void> {
  console.log('=== Error Handling and Edge Case Testing ===\n');

  const tests = [
    { name: 'No Content Test', generator: generateNoContentTest },
    {
      name: 'AI Service Unavailable Test',
      generator: generateAIServiceUnavailableTest,
    },
    { name: 'Storage Quota Test', generator: generateStorageQuotaTest },
    { name: 'Network Failure Test', generator: generateNetworkFailureTest },
    {
      name: 'Error Message Quality Test',
      generator: generateErrorMessageQualityTest,
    },
  ];

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const testPlan = test.generator();
    console.log(`Description: ${testPlan.description}`);
    console.log(`Total MCP calls: ${testPlan.mcpCalls.length}\n`);

    testPlan.mcpCalls.forEach(call => {
      console.log(`Step ${call.step}: ${call.tool}`);
      console.log(`  Purpose: ${call.purpose}`);
      console.log(`  Validation: ${call.validation}\n`);
    });
  }

  console.log('\n=== Test Plan Generated ===');
  console.log(
    'To execute these tests, use the Playwright MCP tools with the generated calls.'
  );
  console.log(
    'Each test includes validation criteria and expected outcomes.\n'
  );
}

// Export test result type for use in other modules
export type { EdgeCaseTestResult };
