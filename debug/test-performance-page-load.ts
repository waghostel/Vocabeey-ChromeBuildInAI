/**
 * Performance Testing: Page Load and Initialization Times
 *
 * This script measures extension installation time, content script injection time,
 * article processing duration, and UI rendering time.
 *
 * Requirements: 7.1
 */

import {
  PerformanceMonitor,
  PageLoadMetrics,
} from './performance-monitoring-system';

/**
 * Generate MCP calls for measuring page load and initialization times
 *
 * Task 8.1: Measure page load and initialization times
 * - Record extension installation time
 * - Measure content script injection time
 * - Track article processing duration
 * - Calculate UI rendering time
 */
export function generatePageLoadPerformanceTest(): {
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
    description: 'Measure page load and initialization performance metrics',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Record start time for extension installation measurement
            window.__perfStart = Date.now();
            return {
              startTime: window.__perfStart,
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Record baseline timestamp for performance measurements',
        validation: 'Start time recorded successfully',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_navigate',
        parameters: {
          url: 'chrome://extensions',
        },
        purpose: 'Navigate to extensions page to measure installation time',
        validation: 'Extensions page loaded',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for extension to fully initialize',
        validation: 'Extension initialization complete',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            const installTime = Date.now() - (window.__perfStart || Date.now());
            return {
              extensionInstallTime: installTime,
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Calculate extension installation time',
        validation: 'Installation time measured',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Record content script injection start time
            window.__contentScriptStart = Date.now();
            return {
              contentScriptStart: window.__contentScriptStart
            };
          }`,
        },
        purpose: 'Record start time for content script injection measurement',
        validation: 'Content script start time recorded',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_navigate',
        parameters: {
          url:
            'file://' + process.cwd().replace(/\\/g, '/') + '/test-page.html',
        },
        purpose: 'Navigate to test page to measure content script injection',
        validation: 'Test page loaded',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for content script to inject',
        validation: 'Content script injection complete',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            const injectionTime = Date.now() - (window.__contentScriptStart || Date.now());
            
            // Check if content script is actually injected
            const hasExtensionContext = typeof chrome !== 'undefined' && 
                                       typeof chrome.runtime !== 'undefined';
            
            // Get performance timing data
            const perfData = performance.timing ? {
              navigationStart: performance.timing.navigationStart,
              domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd,
              loadEventEnd: performance.timing.loadEventEnd,
              domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
              loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart
            } : null;
            
            return {
              contentScriptInjectionTime: injectionTime,
              hasExtensionContext,
              performanceTiming: perfData,
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Measure content script injection time and page load timing',
        validation: 'Content script injection time measured',
      },
      {
        step: 9,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Record article processing start time
            window.__processingStart = Date.now();
            
            // Trigger article processing
            if (typeof chrome !== 'undefined' && chrome.runtime) {
              chrome.runtime.sendMessage(
                { type: 'TRIGGER_EXTRACTION', url: window.location.href },
                () => {
                  window.__processingTriggered = Date.now();
                }
              );
            }
            
            return {
              processingStart: window.__processingStart,
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Trigger article processing and record start time',
        validation: 'Article processing started',
      },
      {
        step: 10,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 5,
        },
        purpose: 'Wait for article processing to complete',
        validation: 'Processing has time to complete',
      },
      {
        step: 11,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            const processingDuration = Date.now() - (window.__processingStart || Date.now());
            
            // Check for processing completion indicators
            return new Promise((resolve) => {
              if (typeof chrome === 'undefined' || !chrome.runtime) {
                resolve({
                  articleProcessingDuration: processingDuration,
                  processingComplete: false,
                  error: 'Chrome runtime not available'
                });
                return;
              }
              
              // Query for processing status
              chrome.runtime.sendMessage(
                { type: 'GET_PROCESSING_STATUS' },
                (response) => {
                  resolve({
                    articleProcessingDuration: processingDuration,
                    processingComplete: response?.complete || false,
                    processingStatus: response,
                    timestamp: new Date().toISOString()
                  });
                }
              );
              
              // Timeout after 2 seconds
              setTimeout(() => {
                resolve({
                  articleProcessingDuration: processingDuration,
                  processingComplete: false,
                  error: 'Status query timeout'
                });
              }, 2000);
            });
          }`,
        },
        purpose: 'Measure article processing duration',
        validation: 'Processing duration measured',
      },
      {
        step: 12,
        tool: 'mcp_playwright_browser_tabs',
        parameters: {
          action: 'list',
        },
        purpose: 'Check if learning interface tab opened',
        validation: 'Tab list retrieved',
      },
      {
        step: 13,
        tool: 'mcp_playwright_browser_tabs',
        parameters: {
          action: 'select',
          index: 1,
        },
        purpose: 'Switch to learning interface tab',
        validation: 'Switched to learning interface',
      },
      {
        step: 14,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Record UI rendering start time
            window.__uiRenderStart = Date.now();
            return {
              uiRenderStart: window.__uiRenderStart
            };
          }`,
        },
        purpose: 'Record UI rendering start time',
        validation: 'UI render start time recorded',
      },
      {
        step: 15,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 3,
        },
        purpose: 'Wait for UI to fully render',
        validation: 'UI has time to render',
      },
      {
        step: 16,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            const uiRenderTime = Date.now() - (window.__uiRenderStart || Date.now());
            
            // Check if UI is rendered
            const articleContainer = document.querySelector('[data-article-content]') || 
                                    document.querySelector('.article-content') ||
                                    document.querySelector('article') ||
                                    document.querySelector('main');
            
            const hasContent = articleContainer && articleContainer.textContent.length > 0;
            const hasHighlighting = document.querySelectorAll('[data-vocabulary]').length > 0 ||
                                   document.querySelectorAll('.vocabulary-highlight').length > 0;
            
            // Get paint timing if available
            const paintTiming = performance.getEntriesByType ? 
              performance.getEntriesByType('paint').reduce((acc, entry) => {
                acc[entry.name] = entry.startTime;
                return acc;
              }, {}) : null;
            
            // Calculate total load time
            const totalLoadTime = Date.now() - (window.__perfStart || Date.now());
            
            return {
              uiRenderingTime: uiRenderTime,
              totalLoadTime,
              uiRendered: hasContent,
              hasHighlighting,
              paintTiming,
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Measure UI rendering time and calculate total load time',
        validation: 'UI rendering time measured',
      },
      {
        step: 17,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Compile all performance metrics
            const metrics = {
              extensionInstallTime: window.__extensionInstallTime || 0,
              contentScriptInjectionTime: window.__contentScriptInjectionTime || 0,
              articleProcessingDuration: window.__articleProcessingDuration || 0,
              uiRenderingTime: window.__uiRenderingTime || 0,
              totalLoadTime: Date.now() - (window.__perfStart || Date.now()),
              navigationStart: performance.timing?.navigationStart || 0,
              domContentLoaded: performance.timing ? 
                (performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart) : 0,
              loadComplete: performance.timing ? 
                (performance.timing.loadEventEnd - performance.timing.navigationStart) : 0
            };
            
            return {
              metrics,
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Compile all page load and initialization metrics',
        validation: 'All metrics compiled successfully',
      },
    ],
  };
}

/**
 * Process performance test results and create metrics object
 */
export function processPageLoadResults(testResults: any[]): PageLoadMetrics {
  // Extract metrics from test results
  const metrics: PageLoadMetrics = {
    extensionInstallTime: 0,
    contentScriptInjectionTime: 0,
    articleProcessingDuration: 0,
    uiRenderingTime: 0,
    totalLoadTime: 0,
    navigationStart: 0,
    domContentLoaded: 0,
    loadComplete: 0,
  };

  // Parse results and populate metrics
  testResults.forEach(result => {
    if (result.extensionInstallTime !== undefined) {
      metrics.extensionInstallTime = result.extensionInstallTime;
    }
    if (result.contentScriptInjectionTime !== undefined) {
      metrics.contentScriptInjectionTime = result.contentScriptInjectionTime;
    }
    if (result.articleProcessingDuration !== undefined) {
      metrics.articleProcessingDuration = result.articleProcessingDuration;
    }
    if (result.uiRenderingTime !== undefined) {
      metrics.uiRenderingTime = result.uiRenderingTime;
    }
    if (result.totalLoadTime !== undefined) {
      metrics.totalLoadTime = result.totalLoadTime;
    }
    if (result.performanceTiming) {
      metrics.navigationStart = result.performanceTiming.navigationStart || 0;
      metrics.domContentLoaded = result.performanceTiming.domContentLoaded || 0;
      metrics.loadComplete = result.performanceTiming.loadComplete || 0;
    }
  });

  return metrics;
}

/**
 * Generate performance report for page load metrics
 */
export function generatePageLoadReport(metrics: PageLoadMetrics): string {
  const lines: string[] = [];

  lines.push('# Page Load and Initialization Performance Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');

  lines.push('## Metrics Summary');
  lines.push('');
  lines.push('| Metric | Duration (ms) | Status |');
  lines.push('|--------|---------------|--------|');

  const addMetric = (name: string, value: number, threshold: number) => {
    const status =
      value <= threshold
        ? '✅ Good'
        : value <= threshold * 1.5
          ? '⚠️ Fair'
          : '❌ Slow';
    lines.push(`| ${name} | ${value.toFixed(0)} | ${status} |`);
  };

  addMetric('Extension Install Time', metrics.extensionInstallTime, 1000);
  addMetric(
    'Content Script Injection',
    metrics.contentScriptInjectionTime,
    500
  );
  addMetric('Article Processing', metrics.articleProcessingDuration, 3000);
  addMetric('UI Rendering', metrics.uiRenderingTime, 1000);
  addMetric('Total Load Time', metrics.totalLoadTime, 5000);
  addMetric('DOM Content Loaded', metrics.domContentLoaded, 2000);
  addMetric('Load Complete', metrics.loadComplete, 3000);

  lines.push('');
  lines.push('## Performance Thresholds');
  lines.push('');
  lines.push(
    '- **Extension Install:** < 1000ms (Good), < 1500ms (Fair), > 1500ms (Slow)'
  );
  lines.push(
    '- **Content Script Injection:** < 500ms (Good), < 750ms (Fair), > 750ms (Slow)'
  );
  lines.push(
    '- **Article Processing:** < 3000ms (Good), < 4500ms (Fair), > 4500ms (Slow)'
  );
  lines.push(
    '- **UI Rendering:** < 1000ms (Good), < 1500ms (Fair), > 1500ms (Slow)'
  );
  lines.push(
    '- **Total Load Time:** < 5000ms (Good), < 7500ms (Fair), > 7500ms (Slow)'
  );
  lines.push('');

  lines.push('## Analysis');
  lines.push('');

  // Analyze metrics and provide insights
  if (metrics.extensionInstallTime > 1500) {
    lines.push(
      '⚠️ **Extension installation is slow.** Consider optimizing service worker initialization.'
    );
    lines.push('');
  }

  if (metrics.contentScriptInjectionTime > 750) {
    lines.push(
      '⚠️ **Content script injection is slow.** Consider lazy loading or code splitting.'
    );
    lines.push('');
  }

  if (metrics.articleProcessingDuration > 4500) {
    lines.push(
      '⚠️ **Article processing is slow.** Consider implementing caching or batch processing.'
    );
    lines.push('');
  }

  if (metrics.uiRenderingTime > 1500) {
    lines.push(
      '⚠️ **UI rendering is slow.** Consider progressive rendering or virtual scrolling.'
    );
    lines.push('');
  }

  if (metrics.totalLoadTime > 7500) {
    lines.push(
      '⚠️ **Total load time is slow.** Review all performance metrics for optimization opportunities.'
    );
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Main execution function
 */
export function main(): void {
  console.log('⏱️  Page Load and Initialization Performance Test\n');

  const test = generatePageLoadPerformanceTest();
  console.log(`📋 ${test.description}`);
  console.log(`   Steps: ${test.mcpCalls.length}\n`);

  console.log('📊 Metrics to be measured:');
  console.log('   - Extension installation time');
  console.log('   - Content script injection time');
  console.log('   - Article processing duration');
  console.log('   - UI rendering time');
  console.log('   - Total load time');
  console.log('   - DOM content loaded time');
  console.log('   - Load complete time\n');

  console.log('✅ Test generation complete!');
  console.log('\n💡 To execute this test:');
  console.log('   1. Ensure Playwright MCP server is running');
  console.log('   2. Execute the MCP calls in sequence');
  console.log(
    '   3. Collect results and process with processPageLoadResults()'
  );
  console.log('   4. Generate report with generatePageLoadReport()');
}

if (process.argv[1]?.includes('test-performance-page-load')) {
  main();
}
