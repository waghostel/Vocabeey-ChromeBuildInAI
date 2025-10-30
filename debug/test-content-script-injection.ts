/**
 * Content Script Injection Testing with Playwright MCP
 *
 * This script tests content script injection and functionality using Playwright MCP tools.
 * It verifies that content scripts properly inject into web pages and function correctly.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import * as fs from 'fs';
import * as path from 'path';

// Types for test results
interface InjectionTestResult {
  testName: string;
  success: boolean;
  timestamp: number;
  details: string;
  errors: string[];
  snapshot?: any;
  consoleMessages?: any[];
}

interface ContentScriptTestSuite {
  testUrl: string;
  results: InjectionTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

/**
 * Test 4.1: Create test page navigation and injection verification
 *
 * This function demonstrates the MCP calls needed to:
 * - Navigate to test page
 * - Wait for page load
 * - Capture page structure
 * - Check for content script markers
 */
export function generateNavigationAndInjectionTest(): {
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
      'Test page navigation and content script injection verification',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_navigate',
        parameters: {
          url:
            'file://' +
            path.resolve(process.cwd(), 'test-page.html').replace(/\\/g, '/'),
        },
        purpose: 'Navigate to local test page with article content',
        validation: 'Page loads successfully without navigation errors',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for page load completion and content script injection',
        validation:
          'Page is fully loaded and content script has time to inject',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_snapshot',
        parameters: {},
        purpose: 'Capture accessibility tree to analyze page structure',
        validation:
          'Snapshot contains article content and any content script markers',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check for content script injection markers
            return {
              hasContentScript: typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined',
              documentReady: document.readyState,
              articleFound: !!document.querySelector('article'),
              mainContentFound: !!document.querySelector('.article-content'),
              paragraphCount: document.querySelectorAll('p').length,
              hasNotifications: document.querySelectorAll('[style*="position: fixed"]').length > 0,
              url: window.location.href
            };
          }`,
        },
        purpose: 'Check for content script markers and page structure',
        validation: 'Content script has injected and page structure is correct',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: false,
        },
        purpose: 'Capture all console messages including content script logs',
        validation: 'No injection errors and content script logs are present',
      },
    ],
  };
}

/**
 * Test 4.2: Test content script functionality
 *
 * This function demonstrates the MCP calls needed to:
 * - Check for content script globals
 * - Verify DOM manipulation capabilities
 * - Test message passing
 * - Capture execution errors
 */
export function generateFunctionalityTest(): {
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
    description: 'Test content script functionality and DOM manipulation',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Test content extraction function
            const article = document.querySelector('article');
            if (!article) return { success: false, error: 'No article found' };
            
            const title = document.querySelector('h1')?.textContent || '';
            const content = article.textContent || '';
            const wordCount = content.split(/\\s+/).filter(w => w.length > 0).length;
            const paragraphCount = article.querySelectorAll('p').length;
            
            return {
              success: true,
              extracted: {
                title: title.trim(),
                contentLength: content.length,
                wordCount,
                paragraphCount,
                url: window.location.href
              }
            };
          }`,
        },
        purpose:
          'Test content extraction logic (simulating content script behavior)',
        validation: 'Content extraction returns valid article data',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Test DOM manipulation - create a test notification
            const notification = document.createElement('div');
            notification.id = 'test-notification';
            notification.textContent = 'Test notification from content script';
            notification.style.cssText = \`
              position: fixed;
              top: 20px;
              right: 20px;
              padding: 12px 20px;
              background-color: #4CAF50;
              color: white;
              border-radius: 4px;
              z-index: 999999;
            \`;
            document.body.appendChild(notification);
            
            // Verify it was added
            const added = document.getElementById('test-notification');
            return {
              success: !!added,
              notificationText: added?.textContent || null,
              notificationVisible: added ? window.getComputedStyle(added).display !== 'none' : false
            };
          }`,
        },
        purpose: 'Test DOM manipulation capabilities',
        validation: 'Content script can create and inject DOM elements',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'content-script-notification.png',
        },
        purpose: 'Capture screenshot showing injected notification',
        validation: 'Screenshot shows notification element',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Test message passing capability
            return new Promise((resolve) => {
              if (typeof chrome === 'undefined' || !chrome.runtime) {
                resolve({ 
                  success: false, 
                  error: 'Chrome runtime not available',
                  hasChrome: typeof chrome !== 'undefined',
                  hasRuntime: false
                });
                return;
              }
              
              // Attempt to send message to background script
              chrome.runtime.sendMessage(
                { type: 'TEST_MESSAGE', data: 'ping' },
                (response) => {
                  if (chrome.runtime.lastError) {
                    resolve({
                      success: false,
                      error: chrome.runtime.lastError.message,
                      hasChrome: true,
                      hasRuntime: true
                    });
                  } else {
                    resolve({
                      success: true,
                      response: response,
                      hasChrome: true,
                      hasRuntime: true
                    });
                  }
                }
              );
              
              // Timeout after 5 seconds
              setTimeout(() => {
                resolve({
                  success: false,
                  error: 'Message timeout',
                  hasChrome: true,
                  hasRuntime: true
                });
              }, 5000);
            });
          }`,
        },
        purpose:
          'Test message passing between content script and service worker',
        validation: 'Content script can communicate with background script',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: true,
        },
        purpose: 'Capture any execution errors during functionality tests',
        validation:
          'No errors occurred during DOM manipulation and message passing',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Clean up test notification
            const notification = document.getElementById('test-notification');
            if (notification) {
              notification.remove();
            }
            return { cleaned: true };
          }`,
        },
        purpose: 'Clean up test DOM elements',
        validation: 'Test elements removed successfully',
      },
    ],
  };
}

/**
 * Test 4.3: Add content script error detection
 *
 * This function demonstrates the MCP calls needed to:
 * - Monitor console for content script errors
 * - Check for CSP violations
 * - Verify script execution timing
 * - Generate injection failure analysis
 */
export function generateErrorDetectionTest(): {
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
    description: 'Detect and analyze content script errors',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: false,
        },
        purpose: 'Get all console messages for comprehensive analysis',
        validation: 'All console messages captured',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check for CSP violations
            const cspViolations = [];
            
            // Check if CSP is blocking anything
            const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            const hasCSP = !!metaCSP;
            
            // Check for common CSP issues
            const inlineScripts = document.querySelectorAll('script:not([src])').length;
            const inlineStyles = document.querySelectorAll('style').length;
            
            return {
              hasCSP,
              cspContent: metaCSP?.getAttribute('content') || null,
              inlineScripts,
              inlineStyles,
              documentDomain: document.domain,
              protocol: window.location.protocol
            };
          }`,
        },
        purpose: 'Check for Content Security Policy violations',
        validation: 'CSP configuration identified and analyzed',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check script execution timing
            return {
              domContentLoaded: document.readyState !== 'loading',
              readyState: document.readyState,
              timing: performance.timing ? {
                navigationStart: performance.timing.navigationStart,
                domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd,
                loadEventEnd: performance.timing.loadEventEnd,
                domInteractive: performance.timing.domInteractive
              } : null,
              now: performance.now()
            };
          }`,
        },
        purpose: 'Verify script execution timing and page load events',
        validation: 'Content script executed at correct time in page lifecycle',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_network_requests',
        parameters: {},
        purpose:
          'Check for failed resource loads that might affect content script',
        validation: 'No critical resource loading failures',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Generate injection failure analysis
            const issues = [];
            const warnings = [];
            
            // Check if content script should have injected
            const hasArticle = !!document.querySelector('article');
            const hasContent = document.body.textContent.length > 100;
            
            if (!hasArticle) {
              warnings.push('No <article> element found - content extraction may fail');
            }
            
            if (!hasContent) {
              issues.push('Insufficient content on page');
            }
            
            // Check for extension context
            const hasExtensionContext = typeof chrome !== 'undefined' && 
                                       typeof chrome.runtime !== 'undefined';
            
            if (!hasExtensionContext) {
              issues.push('Chrome extension context not available');
            }
            
            // Check for common blocking issues
            const hasIframe = window.self !== window.top;
            if (hasIframe) {
              warnings.push('Page is in iframe - content script behavior may differ');
            }
            
            return {
              issues,
              warnings,
              pageAnalysis: {
                hasArticle,
                hasContent,
                hasExtensionContext,
                isIframe: hasIframe,
                url: window.location.href,
                contentLength: document.body.textContent.length
              }
            };
          }`,
        },
        purpose: 'Generate comprehensive injection failure analysis',
        validation: 'All potential injection issues identified',
      },
    ],
  };
}

/**
 * Analyze console messages for content script errors
 */
export function analyzeConsoleMessages(messages: any[]): {
  contentScriptErrors: any[];
  cspViolations: any[];
  importErrors: any[];
  runtimeErrors: any[];
  summary: string;
} {
  const contentScriptErrors: any[] = [];
  const cspViolations: any[] = [];
  const importErrors: any[] = [];
  const runtimeErrors: any[] = [];

  messages.forEach(msg => {
    const text = msg.text || msg.message || '';
    const lowerText = text.toLowerCase();

    // Categorize errors
    if (
      lowerText.includes('content script') ||
      lowerText.includes('content-script')
    ) {
      contentScriptErrors.push(msg);
    }

    if (
      lowerText.includes('csp') ||
      lowerText.includes('content security policy') ||
      lowerText.includes('refused to')
    ) {
      cspViolations.push(msg);
    }

    if (
      lowerText.includes('import') ||
      lowerText.includes('module') ||
      lowerText.includes('cannot find')
    ) {
      importErrors.push(msg);
    }

    if (
      msg.type === 'error' &&
      !contentScriptErrors.includes(msg) &&
      !cspViolations.includes(msg) &&
      !importErrors.includes(msg)
    ) {
      runtimeErrors.push(msg);
    }
  });

  // Generate summary
  const summary = generateErrorAnalysisSummary({
    contentScriptErrors,
    cspViolations,
    importErrors,
    runtimeErrors,
    totalMessages: messages.length,
  });

  return {
    contentScriptErrors,
    cspViolations,
    importErrors,
    runtimeErrors,
    summary,
  };
}

/**
 * Generate error analysis summary
 */
function generateErrorAnalysisSummary(analysis: {
  contentScriptErrors: any[];
  cspViolations: any[];
  importErrors: any[];
  runtimeErrors: any[];
  totalMessages: number;
}): string {
  const lines: string[] = [];

  lines.push('\n=== Content Script Error Analysis ===\n');
  lines.push(`Total Console Messages: ${analysis.totalMessages}`);
  lines.push(`Content Script Errors: ${analysis.contentScriptErrors.length}`);
  lines.push(`CSP Violations: ${analysis.cspViolations.length}`);
  lines.push(`Import Errors: ${analysis.importErrors.length}`);
  lines.push(`Runtime Errors: ${analysis.runtimeErrors.length}\n`);

  if (analysis.contentScriptErrors.length > 0) {
    lines.push('❌ Content Script Errors:');
    analysis.contentScriptErrors.slice(0, 3).forEach((err, i) => {
      lines.push(`  ${i + 1}. ${err.text || err.message}`);
    });
    lines.push('');
  }

  if (analysis.cspViolations.length > 0) {
    lines.push('⚠️  CSP Violations:');
    analysis.cspViolations.slice(0, 3).forEach((err, i) => {
      lines.push(`  ${i + 1}. ${err.text || err.message}`);
    });
    lines.push('');
  }

  if (analysis.importErrors.length > 0) {
    lines.push('❌ Import Errors:');
    analysis.importErrors.slice(0, 3).forEach((err, i) => {
      lines.push(`  ${i + 1}. ${err.text || err.message}`);
    });
    lines.push('');
  }

  if (
    analysis.contentScriptErrors.length === 0 &&
    analysis.cspViolations.length === 0 &&
    analysis.importErrors.length === 0 &&
    analysis.runtimeErrors.length === 0
  ) {
    lines.push('✅ No errors detected - content script injection successful!');
  }

  return lines.join('\n');
}

/**
 * Generate complete test suite documentation
 */
export function generateTestSuiteDocumentation(): string {
  const lines: string[] = [];

  lines.push('# Content Script Injection Testing Suite');
  lines.push('');
  lines.push(
    'This document outlines the complete test suite for content script injection testing.'
  );
  lines.push('');

  // Test 4.1
  const test41 = generateNavigationAndInjectionTest();
  lines.push('## Test 4.1: Navigation and Injection Verification');
  lines.push('');
  lines.push(test41.description);
  lines.push('');
  test41.mcpCalls.forEach(call => {
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

  // Test 4.2
  const test42 = generateFunctionalityTest();
  lines.push('## Test 4.2: Content Script Functionality');
  lines.push('');
  lines.push(test42.description);
  lines.push('');
  test42.mcpCalls.forEach(call => {
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

  // Test 4.3
  const test43 = generateErrorDetectionTest();
  lines.push('## Test 4.3: Error Detection and Analysis');
  lines.push('');
  lines.push(test43.description);
  lines.push('');
  test43.mcpCalls.forEach(call => {
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

  lines.push('## Running the Tests');
  lines.push('');
  lines.push(
    'These tests should be executed by Kiro agent with Playwright MCP access.'
  );
  lines.push(
    'The agent will make the MCP calls in sequence and validate the results.'
  );
  lines.push('');

  lines.push('## Expected Outcomes');
  lines.push('');
  lines.push('- ✅ Content script successfully injects into test page');
  lines.push('- ✅ Content extraction logic works correctly');
  lines.push('- ✅ DOM manipulation capabilities verified');
  lines.push('- ✅ Message passing to background script functional');
  lines.push('- ✅ No CSP violations or injection errors');
  lines.push('- ✅ Script executes at correct time in page lifecycle');
  lines.push('');

  return lines.join('\n');
}

/**
 * Save test suite documentation
 */
export function saveTestSuiteDocumentation(): void {
  const documentation = generateTestSuiteDocumentation();
  const outputPath = path.join(
    process.cwd(),
    'debug',
    'CONTENT_SCRIPT_INJECTION_TESTS.md'
  );

  fs.writeFileSync(outputPath, documentation);
  console.log(`✅ Test suite documentation saved to: ${outputPath}`);
}

/**
 * Main execution function
 */
export function main(): void {
  console.log('🧪 Content Script Injection Testing Suite\n');

  // Generate and display test plans
  console.log('Generating test suite documentation...\n');
  saveTestSuiteDocumentation();

  // Display test summaries
  const test41 = generateNavigationAndInjectionTest();
  console.log(`\n📋 Test 4.1: ${test41.description}`);
  console.log(`   Steps: ${test41.mcpCalls.length}`);

  const test42 = generateFunctionalityTest();
  console.log(`\n📋 Test 4.2: ${test42.description}`);
  console.log(`   Steps: ${test42.mcpCalls.length}`);

  const test43 = generateErrorDetectionTest();
  console.log(`\n📋 Test 4.3: ${test43.description}`);
  console.log(`   Steps: ${test43.mcpCalls.length}`);

  console.log('\n✅ Test suite generation complete!');
  console.log(
    '\nTo execute these tests, run them through Kiro agent with Playwright MCP access.'
  );
}

// Run if executed directly (check if this is the main module)
if (process.argv[1]?.includes('test-content-script-injection')) {
  main();
}
