/**
 * Article Processing Workflow Testing with Playwright MCP
 *
 * This script tests the complete article processing workflow using Playwright MCP tools.
 * It verifies the end-to-end flow from article extraction to learning interface rendering.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import * as fs from 'fs';
import * as path from 'path';

// Types for test results
interface WorkflowTestResult {
  testName: string;
  success: boolean;
  timestamp: number;
  duration: number;
  details: string;
  errors: string[];
  screenshots: string[];
  snapshots: string[];
}

interface ArticleProcessingTestSuite {
  testUrl: string;
  results: WorkflowTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
  artifacts: {
    screenshots: string[];
    snapshots: string[];
    consoleLogs: string;
    networkRequests: string;
  };
}

/**
 * Test 5.1: Implement article page navigation and action trigger
 *
 * This function demonstrates the MCP calls needed to:
 * - Navigate to article page with extractable content
 * - Capture initial page state with screenshot
 * - Click extension action button
 * - Monitor for processing start indicators
 */
export function generateNavigationAndActionTest(): {
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
    description: 'Navigate to article page and trigger extension action',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_navigate',
        parameters: {
          url:
            'file://' +
            path.resolve(process.cwd(), 'test-page.html').replace(/\\/g, '/'),
        },
        purpose: 'Navigate to test article page with extractable content',
        validation: 'Page loads successfully with article content visible',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for page load completion and content script injection',
        validation: 'Page fully loaded and content script ready',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'article-page-initial.png',
          fullPage: true,
        },
        purpose: 'Capture initial page state before processing',
        validation: 'Screenshot shows article content clearly',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_snapshot',
        parameters: {},
        purpose: 'Capture initial page structure for comparison',
        validation: 'Snapshot contains article elements and structure',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check if extension action button is available
            // Note: Extension action buttons are in browser chrome, not page DOM
            // We'll verify extension context instead
            return {
              hasExtensionContext: typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined',
              extensionId: typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.id : null,
              pageReady: document.readyState === 'complete',
              articleFound: !!document.querySelector('article'),
              contentLength: document.body.textContent.length,
              url: window.location.href
            };
          }`,
        },
        purpose: 'Verify extension context and page readiness before action',
        validation: 'Extension context available and article detected',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Simulate extension action click by triggering content extraction
            // In real scenario, user clicks extension icon which triggers service worker
            // For testing, we'll directly trigger the extraction logic
            return new Promise((resolve) => {
              if (typeof chrome === 'undefined' || !chrome.runtime) {
                resolve({ 
                  success: false, 
                  error: 'Chrome runtime not available' 
                });
                return;
              }
              
              // Send message to trigger processing (simulating action click)
              chrome.runtime.sendMessage(
                { type: 'TRIGGER_EXTRACTION', url: window.location.href },
                (response) => {
                  if (chrome.runtime.lastError) {
                    resolve({
                      success: false,
                      error: chrome.runtime.lastError.message
                    });
                  } else {
                    resolve({
                      success: true,
                      triggered: true,
                      timestamp: Date.now()
                    });
                  }
                }
              );
              
              // Timeout after 5 seconds
              setTimeout(() => {
                resolve({
                  success: false,
                  error: 'Trigger timeout'
                });
              }, 5000);
            });
          }`,
        },
        purpose: 'Trigger extension action to start article processing',
        validation: 'Processing triggered successfully',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 3,
        },
        purpose:
          'Wait for processing to start and initial indicators to appear',
        validation: 'Processing indicators visible or new tab opening detected',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: false,
        },
        purpose: 'Capture console messages to monitor processing start',
        validation: 'Console shows processing messages without critical errors',
      },
      {
        step: 9,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'article-page-processing.png',
        },
        purpose: 'Capture page state after triggering action',
        validation: 'Screenshot shows any processing indicators or changes',
      },
    ],
  };
}

/**
 * Test 5.2: Monitor processing pipeline across contexts
 *
 * This function demonstrates the MCP calls needed to:
 * - Track service worker processing messages
 * - Monitor offscreen document AI processing
 * - Verify cache manager operations
 * - Check storage manager data persistence
 */
export function generateProcessingMonitoringTest(): {
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
    description:
      'Monitor article processing pipeline across extension contexts',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check for service worker processing indicators
            return new Promise((resolve) => {
              if (typeof chrome === 'undefined' || !chrome.runtime) {
                resolve({ 
                  success: false, 
                  error: 'Chrome runtime not available' 
                });
                return;
              }
              
              // Query service worker for processing status
              chrome.runtime.sendMessage(
                { type: 'GET_PROCESSING_STATUS' },
                (response) => {
                  if (chrome.runtime.lastError) {
                    resolve({
                      success: false,
                      error: chrome.runtime.lastError.message
                    });
                  } else {
                    resolve({
                      success: true,
                      processingStatus: response,
                      timestamp: Date.now()
                    });
                  }
                }
              );
              
              setTimeout(() => {
                resolve({
                  success: false,
                  error: 'Status query timeout'
                });
              }, 5000);
            });
          }`,
        },
        purpose: 'Query service worker for processing status',
        validation: 'Service worker responds with processing information',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `async () => {
            // Check storage for processing artifacts
            if (typeof chrome === 'undefined' || !chrome.storage) {
              return { 
                success: false, 
                error: 'Chrome storage not available' 
              };
            }
            
            try {
              // Check session storage for pending articles
              const sessionData = await chrome.storage.session.get();
              const pendingArticles = Object.keys(sessionData)
                .filter(key => key.startsWith('pending_article_'))
                .map(key => sessionData[key]);
              
              // Check local storage for cached data
              const localData = await chrome.storage.local.get();
              const cachedArticles = Object.keys(localData)
                .filter(key => key.startsWith('article_'))
                .length;
              
              return {
                success: true,
                storage: {
                  pendingArticles: pendingArticles.length,
                  cachedArticles,
                  sessionKeys: Object.keys(sessionData).length,
                  localKeys: Object.keys(localData).length
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
        purpose: 'Check storage manager for processing data persistence',
        validation: 'Storage contains processing artifacts and cached data',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_network_requests',
        parameters: {},
        purpose:
          'Monitor network requests for AI API calls and resource loading',
        validation: 'Network requests show AI processing or API calls',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: false,
        },
        purpose: 'Capture all console messages from processing pipeline',
        validation: 'Console shows processing progress across contexts',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check for offscreen document processing indicators
            // Note: Offscreen documents run in separate context
            // We check for messages or storage updates that indicate processing
            return {
              timestamp: Date.now(),
              performance: {
                memory: performance.memory ? {
                  usedJSHeapSize: performance.memory.usedJSHeapSize,
                  totalJSHeapSize: performance.memory.totalJSHeapSize,
                  jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                } : null,
                timing: performance.timing ? {
                  navigationStart: performance.timing.navigationStart,
                  loadEventEnd: performance.timing.loadEventEnd
                } : null
              },
              documentState: document.readyState,
              visibilityState: document.visibilityState
            };
          }`,
        },
        purpose: 'Monitor performance and resource usage during processing',
        validation: 'Performance metrics captured successfully',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_tabs',
        parameters: {
          action: 'list',
        },
        purpose: 'Check if new tab opened for learning interface',
        validation:
          'Tab list shows new learning interface tab if processing complete',
      },
    ],
  };
}

/**
 * Test 5.3: Validate learning interface rendering
 *
 * This function demonstrates the MCP calls needed to:
 * - Wait for learning interface to open in new tab
 * - Capture UI structure with snapshot
 * - Verify article content display
 * - Check for vocabulary highlighting elements
 * - Take screenshot of rendered interface
 */
export function generateLearningInterfaceTest(): {
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
    description: 'Validate learning interface rendering and content display',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 5,
        },
        purpose: 'Wait for learning interface tab to open and render',
        validation: 'Sufficient time for tab creation and initial rendering',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_tabs',
        parameters: {
          action: 'list',
        },
        purpose: 'List all open tabs to find learning interface',
        validation: 'Learning interface tab appears in tab list',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_tabs',
        parameters: {
          action: 'select',
          index: 1,
        },
        purpose:
          'Switch to learning interface tab (assuming it is tab index 1)',
        validation: 'Successfully switched to learning interface tab',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 3,
        },
        purpose: 'Wait for learning interface to fully load and render',
        validation: 'Interface has time to load article content and render UI',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_snapshot',
        parameters: {},
        purpose: 'Capture learning interface structure with accessibility tree',
        validation: 'Snapshot shows article content and UI elements',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Verify article content is displayed
            const articleContainer = document.querySelector('[data-article-content]') || 
                                    document.querySelector('.article-content') ||
                                    document.querySelector('article') ||
                                    document.querySelector('main');
            
            if (!articleContainer) {
              return {
                success: false,
                error: 'Article container not found',
                bodyContent: document.body.textContent.substring(0, 200)
              };
            }
            
            const content = articleContainer.textContent || '';
            const paragraphs = articleContainer.querySelectorAll('p').length;
            
            // Check for vocabulary highlighting elements
            const highlightedWords = document.querySelectorAll('[data-vocabulary]').length ||
                                    document.querySelectorAll('.vocabulary-highlight').length ||
                                    document.querySelectorAll('.highlighted-word').length;
            
            // Check for UI controls
            const hasControls = !!document.querySelector('[data-controls]') ||
                               !!document.querySelector('.controls') ||
                               !!document.querySelector('button');
            
            return {
              success: true,
              article: {
                found: true,
                contentLength: content.length,
                wordCount: content.split(/\\s+/).filter(w => w.length > 0).length,
                paragraphs,
                hasTitle: !!articleContainer.querySelector('h1, h2')
              },
              highlighting: {
                highlightedWords,
                hasHighlighting: highlightedWords > 0
              },
              ui: {
                hasControls,
                buttons: document.querySelectorAll('button').length,
                inputs: document.querySelectorAll('input, select').length
              },
              url: window.location.href
            };
          }`,
        },
        purpose: 'Verify article content display and vocabulary highlighting',
        validation:
          'Article content rendered with highlighting elements present',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'learning-interface-rendered.png',
          fullPage: true,
        },
        purpose: 'Capture full screenshot of rendered learning interface',
        validation: 'Screenshot shows complete learning interface with article',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: true,
        },
        purpose: 'Check for rendering errors in learning interface',
        validation: 'No critical errors during interface rendering',
      },
    ],
  };
}

/**
 * Test 5.4: Test interactive features
 *
 * This function demonstrates the MCP calls needed to:
 * - Click vocabulary cards to test translation display
 * - Toggle sentence mode and verify highlighting
 * - Test difficulty level changes
 * - Verify TTS button functionality
 */
export function generateInteractiveFeaturesTest(): {
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
    description: 'Test interactive features of learning interface',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_snapshot',
        parameters: {},
        purpose:
          'Capture initial interface state to identify interactive elements',
        validation:
          'Snapshot contains element references (uid) for interaction',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Find first vocabulary card or highlighted word
            const vocabElement = document.querySelector('[data-vocabulary]') ||
                                document.querySelector('.vocabulary-highlight') ||
                                document.querySelector('.highlighted-word');
            
            if (!vocabElement) {
              return {
                success: false,
                error: 'No vocabulary elements found to click'
              };
            }
            
            // Get element information for clicking
            const rect = vocabElement.getBoundingClientRect();
            const word = vocabElement.textContent || '';
            
            return {
              success: true,
              vocabulary: {
                word: word.trim(),
                position: {
                  x: rect.x + rect.width / 2,
                  y: rect.y + rect.height / 2
                },
                selector: vocabElement.className || vocabElement.tagName,
                hasDataAttribute: vocabElement.hasAttribute('data-vocabulary')
              }
            };
          }`,
        },
        purpose: 'Identify vocabulary card to click for translation test',
        validation: 'Vocabulary element found and position identified',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'First vocabulary card',
          ref: '[data-vocabulary]',
        },
        purpose: 'Click vocabulary card to display translation',
        validation: 'Click registered and translation popup should appear',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for translation popup to appear',
        validation: 'Translation has time to load and display',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'vocabulary-translation-popup.png',
        },
        purpose: 'Capture screenshot showing translation popup',
        validation: 'Screenshot shows translation displayed for clicked word',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check if translation popup is visible
            const popup = document.querySelector('[data-translation-popup]') ||
                         document.querySelector('.translation-popup') ||
                         document.querySelector('.popup') ||
                         document.querySelector('[role="dialog"]');
            
            if (!popup) {
              return {
                success: false,
                error: 'Translation popup not found',
                visibleElements: Array.from(document.querySelectorAll('[style*="position: fixed"], [style*="position: absolute"]'))
                  .map(el => el.className || el.tagName)
              };
            }
            
            const isVisible = window.getComputedStyle(popup).display !== 'none' &&
                             window.getComputedStyle(popup).visibility !== 'hidden';
            
            return {
              success: true,
              popup: {
                visible: isVisible,
                content: popup.textContent?.substring(0, 200),
                className: popup.className,
                hasTranslation: popup.textContent && popup.textContent.length > 0
              }
            };
          }`,
        },
        purpose: 'Verify translation popup is visible and contains content',
        validation: 'Translation popup displayed with translation text',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Find sentence mode toggle button
            const sentenceModeBtn = document.querySelector('[data-sentence-mode]') ||
                                   document.querySelector('button[aria-label*="sentence"]') ||
                                   Array.from(document.querySelectorAll('button'))
                                     .find(btn => btn.textContent?.toLowerCase().includes('sentence'));
            
            if (!sentenceModeBtn) {
              return {
                success: false,
                error: 'Sentence mode button not found',
                buttons: Array.from(document.querySelectorAll('button'))
                  .map(btn => btn.textContent?.trim())
              };
            }
            
            return {
              success: true,
              button: {
                text: sentenceModeBtn.textContent?.trim(),
                enabled: !sentenceModeBtn.hasAttribute('disabled'),
                className: sentenceModeBtn.className
              }
            };
          }`,
        },
        purpose: 'Locate sentence mode toggle button',
        validation: 'Sentence mode button found and accessible',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'Sentence mode toggle button',
          ref: '[data-sentence-mode]',
        },
        purpose: 'Toggle sentence mode on',
        validation: 'Sentence mode activated',
      },
      {
        step: 9,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for sentence highlighting to apply',
        validation: 'Highlighting changes applied',
      },
      {
        step: 10,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'sentence-mode-active.png',
          fullPage: true,
        },
        purpose: 'Capture screenshot with sentence mode active',
        validation:
          'Screenshot shows sentence highlighting instead of word highlighting',
      },
      {
        step: 11,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Verify sentence highlighting is active
            const sentenceElements = document.querySelectorAll('[data-sentence]').length ||
                                    document.querySelectorAll('.sentence-highlight').length;
            
            const wordElements = document.querySelectorAll('[data-vocabulary]').length ||
                                document.querySelectorAll('.vocabulary-highlight').length;
            
            return {
              success: true,
              highlighting: {
                sentenceElements,
                wordElements,
                sentenceModeActive: sentenceElements > 0,
                mode: sentenceElements > 0 ? 'sentence' : 'vocabulary'
              }
            };
          }`,
        },
        purpose: 'Verify sentence mode highlighting is active',
        validation: 'Sentence highlighting elements present',
      },
      {
        step: 12,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Find difficulty level control
            const difficultyControl = document.querySelector('[data-difficulty]') ||
                                     document.querySelector('select[name="difficulty"]') ||
                                     document.querySelector('input[type="range"]');
            
            if (!difficultyControl) {
              return {
                success: false,
                error: 'Difficulty control not found'
              };
            }
            
            const currentValue = difficultyControl.value || 
                                difficultyControl.getAttribute('data-value') ||
                                '5';
            
            return {
              success: true,
              difficulty: {
                currentLevel: currentValue,
                controlType: difficultyControl.tagName.toLowerCase(),
                hasOptions: difficultyControl.tagName === 'SELECT'
              }
            };
          }`,
        },
        purpose: 'Locate and check difficulty level control',
        validation: 'Difficulty control found with current level',
      },
      {
        step: 13,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Find TTS button
            const ttsButton = document.querySelector('[data-tts]') ||
                             document.querySelector('button[aria-label*="speak"]') ||
                             document.querySelector('button[aria-label*="audio"]') ||
                             Array.from(document.querySelectorAll('button'))
                               .find(btn => {
                                 const text = btn.textContent?.toLowerCase() || '';
                                 const label = btn.getAttribute('aria-label')?.toLowerCase() || '';
                                 return text.includes('speak') || text.includes('audio') || 
                                        label.includes('speak') || label.includes('audio') ||
                                        btn.innerHTML.includes('🔊') || btn.innerHTML.includes('speaker');
                               });
            
            if (!ttsButton) {
              return {
                success: false,
                error: 'TTS button not found',
                buttons: Array.from(document.querySelectorAll('button'))
                  .map(btn => ({
                    text: btn.textContent?.trim(),
                    label: btn.getAttribute('aria-label')
                  }))
              };
            }
            
            return {
              success: true,
              tts: {
                found: true,
                text: ttsButton.textContent?.trim(),
                label: ttsButton.getAttribute('aria-label'),
                enabled: !ttsButton.hasAttribute('disabled')
              }
            };
          }`,
        },
        purpose: 'Locate TTS (text-to-speech) button',
        validation: 'TTS button found and enabled',
      },
      {
        step: 14,
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'TTS button',
          ref: '[data-tts]',
        },
        purpose: 'Click TTS button to test audio functionality',
        validation: 'TTS button clicked successfully',
      },
      {
        step: 15,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for TTS audio to initialize and play',
        validation: 'Audio has time to start playing',
      },
      {
        step: 16,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: false,
        },
        purpose: 'Check console for TTS initialization and playback messages',
        validation: 'Console shows TTS activity without errors',
      },
    ],
  };
}

/**
 * Generate complete workflow test documentation
 */
export function generateWorkflowTestDocumentation(): string {
  const lines: string[] = [];

  lines.push('# Article Processing Workflow Test Suite');
  lines.push('');
  lines.push(
    'Complete end-to-end testing of article processing workflow from navigation to interactive features.'
  );
  lines.push('');

  // Test 5.1
  const test51 = generateNavigationAndActionTest();
  lines.push('## Test 5.1: Article Page Navigation and Action Trigger');
  lines.push('');
  lines.push(test51.description);
  lines.push('');
  test51.mcpCalls.forEach(call => {
    lines.push(`### Step ${call.step}: ${call.purpose}`);
    lines.push('');
    lines.push(`**MCP Tool:** \`${call.tool}\``);
    lines.push('');
    lines.push('**Parameters:**');
    lines.push('```json');
    lines.push(JSON.stringify(call.parameters, null, 2));
    lines.push('```');
    lines.push('');
    lines.push(`**Validation:** ${call.validation}`);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Main execution function
 */
export function main(): void {
  console.log('🧪 Article Processing Workflow Test Suite\n');

  const test51 = generateNavigationAndActionTest();
  console.log(`\n📋 Test 5.1: ${test51.description}`);
  console.log(`   Steps: ${test51.mcpCalls.length}`);

  const test52 = generateProcessingMonitoringTest();
  console.log(`\n📋 Test 5.2: ${test52.description}`);
  console.log(`   Steps: ${test52.mcpCalls.length}`);

  const test53 = generateLearningInterfaceTest();
  console.log(`\n📋 Test 5.3: ${test53.description}`);
  console.log(`   Steps: ${test53.mcpCalls.length}`);

  const test54 = generateInteractiveFeaturesTest();
  console.log(`\n📋 Test 5.4: ${test54.description}`);
  console.log(`   Steps: ${test54.mcpCalls.length}`);

  console.log('\n✅ Test suite generation complete!');
}

if (process.argv[1]?.includes('test-article-processing-workflow')) {
  main();
}
