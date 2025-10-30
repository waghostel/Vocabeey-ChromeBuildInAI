/**
 * Performance Testing: AI Processing Performance
 *
 * This script measures Chrome AI API response times, offscreen document processing duration,
 * batch processing performance, and identifies processing bottlenecks.
 *
 * Requirements: 7.2
 */

import {
  PerformanceMonitor,
  AIProcessingMetrics,
} from './performance-monitoring-system';

/**
 * Generate MCP calls for measuring AI processing performance
 *
 * Task 8.2: Monitor AI processing performance
 * - Measure Chrome AI API response times
 * - Track offscreen document processing duration
 * - Monitor batch processing performance
 * - Identify processing bottlenecks
 */
export function generateAIProcessingPerformanceTest(): {
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
    description: 'Measure AI processing performance and identify bottlenecks',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_navigate',
        parameters: {
          url:
            'file://' + process.cwd().replace(/\\/g, '/') + '/test-page.html',
        },
        purpose: 'Navigate to test page with article content',
        validation: 'Test page loaded',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for page and content script to load',
        validation: 'Page ready for processing',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Initialize performance tracking for AI processing
            window.__aiPerfMetrics = {
              chromeAIStart: null,
              chromeAIEnd: null,
              offscreenStart: null,
              offscreenEnd: null,
              batchItems: [],
              bottlenecks: []
            };
            
            // Record Chrome AI API call start time
            window.__aiPerfMetrics.chromeAIStart = Date.now();
            
            return {
              initialized: true,
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Initialize AI performance tracking',
        validation: 'Performance tracking initialized',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `async () => {
            // Test Chrome AI API availability and response time
            const startTime = Date.now();
            
            try {
              // Check if Chrome AI APIs are available
              const hasAI = typeof window.ai !== 'undefined';
              
              if (!hasAI) {
                return {
                  success: false,
                  error: 'Chrome AI APIs not available',
                  chromeAIResponseTime: 0
                };
              }
              
              // Test summarizer API
              let summarizerTime = 0;
              try {
                const summarizer = await window.ai.summarizer.create();
                const testText = 'This is a test sentence for measuring API response time.';
                const summaryStart = Date.now();
                await summarizer.summarize(testText);
                summarizerTime = Date.now() - summaryStart;
                summarizer.destroy();
              } catch (e) {
                // Summarizer not available or failed
              }
              
              const totalTime = Date.now() - startTime;
              
              return {
                success: true,
                chromeAIResponseTime: summarizerTime || totalTime,
                apiAvailable: hasAI,
                summarizerTested: summarizerTime > 0,
                timestamp: new Date().toISOString()
              };
            } catch (error) {
              return {
                success: false,
                error: error.message,
                chromeAIResponseTime: Date.now() - startTime
              };
            }
          }`,
        },
        purpose: 'Measure Chrome AI API response time',
        validation: 'Chrome AI API response time measured',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Trigger article processing to measure offscreen document performance
            window.__aiPerfMetrics.offscreenStart = Date.now();
            
            return new Promise((resolve) => {
              if (typeof chrome === 'undefined' || !chrome.runtime) {
                resolve({
                  success: false,
                  error: 'Chrome runtime not available'
                });
                return;
              }
              
              // Send message to trigger processing
              chrome.runtime.sendMessage(
                { 
                  type: 'TRIGGER_EXTRACTION', 
                  url: window.location.href,
                  measurePerformance: true
                },
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
                      offscreenStart: window.__aiPerfMetrics.offscreenStart,
                      timestamp: new Date().toISOString()
                    });
                  }
                }
              );
              
              // Timeout after 10 seconds
              setTimeout(() => {
                resolve({
                  success: false,
                  error: 'Processing trigger timeout'
                });
              }, 10000);
            });
          }`,
        },
        purpose:
          'Trigger article processing and start offscreen performance measurement',
        validation: 'Article processing triggered',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 8,
        },
        purpose: 'Wait for offscreen document processing to complete',
        validation: 'Processing has time to complete',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Measure offscreen processing duration
            return new Promise((resolve) => {
              if (typeof chrome === 'undefined' || !chrome.runtime) {
                resolve({
                  success: false,
                  error: 'Chrome runtime not available'
                });
                return;
              }
              
              // Query for processing completion and performance data
              chrome.runtime.sendMessage(
                { type: 'GET_PROCESSING_PERFORMANCE' },
                (response) => {
                  const offscreenDuration = Date.now() - (window.__aiPerfMetrics.offscreenStart || Date.now());
                  
                  resolve({
                    success: true,
                    offscreenProcessingDuration: offscreenDuration,
                    processingData: response,
                    timestamp: new Date().toISOString()
                  });
                }
              );
              
              // Timeout after 3 seconds
              setTimeout(() => {
                const offscreenDuration = Date.now() - (window.__aiPerfMetrics.offscreenStart || Date.now());
                resolve({
                  success: false,
                  error: 'Performance query timeout',
                  offscreenProcessingDuration: offscreenDuration
                });
              }, 3000);
            });
          }`,
        },
        purpose: 'Measure offscreen document processing duration',
        validation: 'Offscreen processing duration measured',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `async () => {
            // Test batch processing performance
            const batchItems = [
              'First test sentence for batch processing.',
              'Second test sentence for batch processing.',
              'Third test sentence for batch processing.',
              'Fourth test sentence for batch processing.',
              'Fifth test sentence for batch processing.'
            ];
            
            const batchStart = Date.now();
            const itemDurations = [];
            
            try {
              // Check if Chrome AI is available
              if (typeof window.ai === 'undefined' || !window.ai.summarizer) {
                return {
                  success: false,
                  error: 'Chrome AI not available for batch testing',
                  batchProcessingPerformance: {
                    totalItems: 0,
                    totalDuration: 0,
                    averageItemDuration: 0
                  }
                };
              }
              
              const summarizer = await window.ai.summarizer.create();
              
              // Process items in batch
              for (const item of batchItems) {
                const itemStart = Date.now();
                try {
                  await summarizer.summarize(item);
                  const itemDuration = Date.now() - itemStart;
                  itemDurations.push(itemDuration);
                } catch (e) {
                  // Item processing failed
                  itemDurations.push(0);
                }
              }
              
              summarizer.destroy();
              
              const totalDuration = Date.now() - batchStart;
              const averageDuration = itemDurations.reduce((a, b) => a + b, 0) / itemDurations.length;
              
              return {
                success: true,
                batchProcessingPerformance: {
                  totalItems: batchItems.length,
                  totalDuration,
                  averageItemDuration: averageDuration,
                  itemDurations
                },
                timestamp: new Date().toISOString()
              };
            } catch (error) {
              return {
                success: false,
                error: error.message,
                batchProcessingPerformance: {
                  totalItems: batchItems.length,
                  totalDuration: Date.now() - batchStart,
                  averageItemDuration: 0
                }
              };
            }
          }`,
        },
        purpose: 'Measure batch processing performance',
        validation: 'Batch processing performance measured',
      },
      {
        step: 9,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: false,
        },
        purpose: 'Capture console messages to identify processing bottlenecks',
        validation: 'Console messages captured',
      },
      {
        step: 10,
        tool: 'mcp_playwright_browser_network_requests',
        parameters: {},
        purpose: 'Analyze network requests for AI API calls',
        validation: 'Network requests captured',
      },
      {
        step: 11,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Identify processing bottlenecks
            const bottlenecks = [];
            
            // Check for slow AI API responses
            if (window.__aiPerfMetrics) {
              const chromeAITime = window.__aiPerfMetrics.chromeAIEnd - window.__aiPerfMetrics.chromeAIStart;
              if (chromeAITime > 3000) {
                bottlenecks.push('Chrome AI API response time > 3s');
              }
              
              const offscreenTime = window.__aiPerfMetrics.offscreenEnd - window.__aiPerfMetrics.offscreenStart;
              if (offscreenTime > 5000) {
                bottlenecks.push('Offscreen document processing > 5s');
              }
            }
            
            // Check for memory pressure
            if (performance.memory) {
              const heapUsagePercent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
              if (heapUsagePercent > 80) {
                bottlenecks.push(\`High memory usage (\${heapUsagePercent.toFixed(1)}%)\`);
              }
            }
            
            // Check for long tasks
            if (performance.getEntriesByType) {
              const longTasks = performance.getEntriesByType('longtask');
              if (longTasks.length > 0) {
                bottlenecks.push(\`\${longTasks.length} long tasks detected\`);
              }
            }
            
            return {
              bottlenecks,
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Identify processing bottlenecks',
        validation: 'Bottlenecks identified',
      },
      {
        step: 12,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Compile all AI processing metrics
            const metrics = {
              chromeAIResponseTime: window.__chromeAIResponseTime || 0,
              offscreenProcessingDuration: window.__offscreenProcessingDuration || 0,
              batchProcessingPerformance: window.__batchProcessingPerformance || {
                totalItems: 0,
                totalDuration: 0,
                averageItemDuration: 0
              },
              bottlenecks: window.__bottlenecks || []
            };
            
            return {
              metrics,
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Compile all AI processing performance metrics',
        validation: 'All AI metrics compiled',
      },
    ],
  };
}

/**
 * Process AI performance test results and create metrics object
 */
export function processAIProcessingResults(
  testResults: any[]
): AIProcessingMetrics {
  const metrics: AIProcessingMetrics = {
    chromeAIResponseTime: 0,
    offscreenProcessingDuration: 0,
    batchProcessingPerformance: {
      totalItems: 0,
      totalDuration: 0,
      averageItemDuration: 0,
    },
    bottlenecks: [],
  };

  // Parse results and populate metrics
  testResults.forEach(result => {
    if (result.chromeAIResponseTime !== undefined) {
      metrics.chromeAIResponseTime = result.chromeAIResponseTime;
    }
    if (result.offscreenProcessingDuration !== undefined) {
      metrics.offscreenProcessingDuration = result.offscreenProcessingDuration;
    }
    if (result.batchProcessingPerformance) {
      metrics.batchProcessingPerformance = result.batchProcessingPerformance;
    }
    if (result.bottlenecks && Array.isArray(result.bottlenecks)) {
      metrics.bottlenecks.push(...result.bottlenecks);
    }
  });

  // Deduplicate bottlenecks
  metrics.bottlenecks = Array.from(new Set(metrics.bottlenecks));

  return metrics;
}

/**
 * Generate performance report for AI processing metrics
 */
export function generateAIProcessingReport(
  metrics: AIProcessingMetrics
): string {
  const lines: string[] = [];

  lines.push('# AI Processing Performance Report');
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

  addMetric('Chrome AI API Response', metrics.chromeAIResponseTime, 2000);
  addMetric('Offscreen Processing', metrics.offscreenProcessingDuration, 4000);
  addMetric(
    'Batch Avg Item Duration',
    metrics.batchProcessingPerformance.averageItemDuration,
    400
  );

  lines.push('');
  lines.push('## Batch Processing Details');
  lines.push('');
  lines.push(
    `- **Total Items:** ${metrics.batchProcessingPerformance.totalItems}`
  );
  lines.push(
    `- **Total Duration:** ${metrics.batchProcessingPerformance.totalDuration.toFixed(0)}ms`
  );
  lines.push(
    `- **Average Item Duration:** ${metrics.batchProcessingPerformance.averageItemDuration.toFixed(0)}ms`
  );
  lines.push('');

  if (metrics.bottlenecks.length > 0) {
    lines.push('## Identified Bottlenecks');
    lines.push('');
    metrics.bottlenecks.forEach((bottleneck, index) => {
      lines.push(`${index + 1}. ${bottleneck}`);
    });
    lines.push('');
  }

  lines.push('## Performance Thresholds');
  lines.push('');
  lines.push(
    '- **Chrome AI API:** < 2000ms (Good), < 3000ms (Fair), > 3000ms (Slow)'
  );
  lines.push(
    '- **Offscreen Processing:** < 4000ms (Good), < 6000ms (Fair), > 6000ms (Slow)'
  );
  lines.push(
    '- **Batch Item Processing:** < 400ms (Good), < 600ms (Fair), > 600ms (Slow)'
  );
  lines.push('');

  lines.push('## Recommendations');
  lines.push('');

  if (metrics.chromeAIResponseTime > 3000) {
    lines.push('⚠️ **Chrome AI API is slow.** Consider:');
    lines.push(
      '   - Implementing result caching for frequently processed content'
    );
    lines.push('   - Using streaming responses for better UX');
    lines.push('   - Reducing input text size or chunking large texts');
    lines.push('');
  }

  if (metrics.offscreenProcessingDuration > 6000) {
    lines.push('⚠️ **Offscreen processing is slow.** Consider:');
    lines.push('   - Optimizing processing logic in offscreen document');
    lines.push('   - Using Web Workers for parallel processing');
    lines.push('   - Implementing progressive processing with status updates');
    lines.push('');
  }

  if (metrics.batchProcessingPerformance.averageItemDuration > 600) {
    lines.push('⚠️ **Batch processing is slow.** Consider:');
    lines.push('   - Implementing parallel batch processing');
    lines.push('   - Reducing batch size for better responsiveness');
    lines.push('   - Caching results for similar items');
    lines.push('');
  }

  if (metrics.bottlenecks.length > 0) {
    lines.push(
      '⚠️ **Processing bottlenecks detected.** Review the bottlenecks list above and:'
    );
    lines.push('   - Profile the code to identify specific slow operations');
    lines.push('   - Optimize or refactor bottleneck areas');
    lines.push('   - Consider architectural changes if needed');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Main execution function
 */
export function main(): void {
  console.log('🤖 AI Processing Performance Test\n');

  const test = generateAIProcessingPerformanceTest();
  console.log(`📋 ${test.description}`);
  console.log(`   Steps: ${test.mcpCalls.length}\n`);

  console.log('📊 Metrics to be measured:');
  console.log('   - Chrome AI API response time');
  console.log('   - Offscreen document processing duration');
  console.log('   - Batch processing performance');
  console.log('   - Processing bottlenecks\n');

  console.log('✅ Test generation complete!');
  console.log('\n💡 To execute this test:');
  console.log('   1. Ensure Playwright MCP server is running');
  console.log('   2. Execute the MCP calls in sequence');
  console.log(
    '   3. Collect results and process with processAIProcessingResults()'
  );
  console.log('   4. Generate report with generateAIProcessingReport()');
}

if (process.argv[1]?.includes('test-performance-ai-processing')) {
  main();
}
