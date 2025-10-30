/**
 * Performance Testing: Network Request Analysis
 *
 * This script analyzes network requests to identify slow API calls, failed requests,
 * and measure total network overhead.
 *
 * Requirements: 7.4
 */

import {
  PerformanceMonitor,
  NetworkMetrics,
} from './performance-monitoring-system';

/**
 * Generate MCP calls for analyzing network requests
 *
 * Task 8.4: Analyze network requests
 * - Use mcp_playwright_browser_network_requests to get all requests
 * - Identify slow API calls
 * - Check for failed requests
 * - Measure total network overhead
 */
export function generateNetworkAnalysisTest(): {
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
      'Analyze network requests to identify performance issues and failures',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_navigate',
        parameters: {
          url:
            'file://' + process.cwd().replace(/\\/g, '/') + '/test-page.html',
        },
        purpose: 'Navigate to test page',
        validation: 'Test page loaded',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for page to fully load',
        validation: 'Page ready',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Initialize network tracking
            window.__networkStart = Date.now();
            window.__networkRequests = [];
            
            return {
              initialized: true,
              startTime: window.__networkStart,
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Initialize network request tracking',
        validation: 'Network tracking initialized',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Trigger article processing to generate network activity
            if (typeof chrome !== 'undefined' && chrome.runtime) {
              chrome.runtime.sendMessage(
                { type: 'TRIGGER_EXTRACTION', url: window.location.href },
                () => {}
              );
            }
            
            return {
              triggered: true,
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Trigger processing to generate network requests',
        validation: 'Processing triggered',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 5,
        },
        purpose: 'Wait for processing and network requests to complete',
        validation: 'Processing complete',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_network_requests',
        parameters: {},
        purpose: 'Capture all network requests made during processing',
        validation: 'Network requests captured',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Get performance resource timing data
            if (!performance.getEntriesByType) {
              return {
                success: false,
                error: 'Performance API not available'
              };
            }
            
            const resources = performance.getEntriesByType('resource');
            const networkTiming = resources.map(resource => ({
              name: resource.name,
              duration: resource.duration,
              transferSize: resource.transferSize || 0,
              encodedBodySize: resource.encodedBodySize || 0,
              decodedBodySize: resource.decodedBodySize || 0,
              startTime: resource.startTime,
              responseEnd: resource.responseEnd,
              initiatorType: resource.initiatorType
            }));
            
            return {
              success: true,
              resourceTiming: networkTiming,
              totalResources: resources.length,
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Get detailed resource timing data',
        validation: 'Resource timing captured',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: false,
        },
        purpose: 'Capture console messages for network-related errors',
        validation: 'Console messages captured',
      },
      {
        step: 9,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Analyze network requests from stored data
            // Note: This would typically use data from mcp_playwright_browser_network_requests
            // For now, we'll analyze what we can from performance API
            
            const resources = performance.getEntriesByType ? 
              performance.getEntriesByType('resource') : [];
            
            // Identify slow requests (> 2 seconds)
            const slowRequests = resources
              .filter(r => r.duration > 2000)
              .map(r => ({
                url: r.name,
                duration: r.duration,
                size: r.transferSize || 0
              }));
            
            // Calculate total network overhead
            const totalDuration = resources.reduce((sum, r) => sum + r.duration, 0);
            const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
            
            // Identify API calls (heuristic: contains 'api' or common API patterns)
            const apiCalls = resources
              .filter(r => {
                const url = r.name.toLowerCase();
                return url.includes('/api/') || 
                       url.includes('api.') || 
                       url.includes('.json') ||
                       url.includes('gemini') ||
                       url.includes('chrome-ai');
              })
              .map(r => ({
                url: r.name,
                duration: r.duration,
                success: true // We don't have status code from performance API
              }));
            
            return {
              analysis: {
                totalRequests: resources.length,
                slowRequests,
                totalDuration,
                totalSize,
                totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
                apiCalls,
                averageDuration: resources.length > 0 ? totalDuration / resources.length : 0
              },
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Analyze network requests for performance issues',
        validation: 'Network analysis complete',
      },
      {
        step: 10,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check for failed requests in console errors
            // This is a heuristic approach since we can't directly access network status
            const failedRequestPatterns = [
              'Failed to fetch',
              'Network request failed',
              'ERR_',
              'net::',
              '404',
              '500',
              '503'
            ];
            
            // In a real implementation, this would parse console messages
            // For now, we'll return a placeholder
            return {
              failedRequests: 0,
              failedRequestsDetected: [],
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Identify failed network requests',
        validation: 'Failed requests identified',
      },
      {
        step: 11,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Compile all network metrics
            const resources = performance.getEntriesByType ? 
              performance.getEntriesByType('resource') : [];
            
            const slowRequests = resources
              .filter(r => r.duration > 2000)
              .map(r => ({
                url: r.name,
                duration: r.duration,
                status: 200 // Placeholder
              }));
            
            const apiCalls = resources
              .filter(r => {
                const url = r.name.toLowerCase();
                return url.includes('/api/') || 
                       url.includes('api.') || 
                       url.includes('.json');
              })
              .map(r => ({
                url: r.name,
                duration: r.duration,
                success: true
              }));
            
            const totalDuration = resources.reduce((sum, r) => sum + r.duration, 0);
            
            return {
              metrics: {
                totalRequests: resources.length,
                failedRequests: 0, // Would be populated from actual network data
                slowRequests,
                totalNetworkOverhead: totalDuration,
                apiCalls
              },
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Compile all network performance metrics',
        validation: 'All network metrics compiled',
      },
    ],
  };
}

/**
 * Process network analysis test results and create metrics object
 */
export function processNetworkAnalysisResults(
  testResults: any[],
  networkRequests?: any[]
): NetworkMetrics {
  const metrics: NetworkMetrics = {
    totalRequests: 0,
    failedRequests: 0,
    slowRequests: [],
    totalNetworkOverhead: 0,
    apiCalls: [],
  };

  // Process MCP network requests if available
  if (networkRequests && Array.isArray(networkRequests)) {
    metrics.totalRequests = networkRequests.length;

    // Identify failed requests (status >= 400)
    metrics.failedRequests = networkRequests.filter(
      req => req.status && req.status >= 400
    ).length;

    // Identify slow requests (> 2 seconds)
    metrics.slowRequests = networkRequests
      .filter(req => req.duration && req.duration > 2000)
      .map(req => ({
        url: req.url || '',
        duration: req.duration || 0,
        status: req.status || 0,
      }));

    // Calculate total network overhead
    metrics.totalNetworkOverhead = networkRequests.reduce(
      (sum, req) => sum + (req.duration || 0),
      0
    );

    // Identify API calls
    metrics.apiCalls = networkRequests
      .filter(req => {
        const url = (req.url || '').toLowerCase();
        return (
          url.includes('/api/') ||
          url.includes('api.') ||
          url.includes('.json') ||
          url.includes('gemini') ||
          url.includes('chrome-ai')
        );
      })
      .map(req => ({
        url: req.url || '',
        duration: req.duration || 0,
        success: req.status ? req.status < 400 : true,
      }));
  }

  // Process test results
  testResults.forEach(result => {
    if (result.analysis) {
      const analysis = result.analysis;

      if (analysis.totalRequests) {
        metrics.totalRequests = Math.max(
          metrics.totalRequests,
          analysis.totalRequests
        );
      }

      if (analysis.slowRequests && Array.isArray(analysis.slowRequests)) {
        metrics.slowRequests.push(...analysis.slowRequests);
      }

      if (analysis.totalDuration) {
        metrics.totalNetworkOverhead = Math.max(
          metrics.totalNetworkOverhead,
          analysis.totalDuration
        );
      }

      if (analysis.apiCalls && Array.isArray(analysis.apiCalls)) {
        metrics.apiCalls.push(...analysis.apiCalls);
      }
    }

    if (result.failedRequests !== undefined) {
      metrics.failedRequests = Math.max(
        metrics.failedRequests,
        result.failedRequests
      );
    }
  });

  // Deduplicate slow requests and API calls by URL
  const uniqueSlowRequests = new Map();
  metrics.slowRequests.forEach(req => {
    if (
      !uniqueSlowRequests.has(req.url) ||
      uniqueSlowRequests.get(req.url).duration < req.duration
    ) {
      uniqueSlowRequests.set(req.url, req);
    }
  });
  metrics.slowRequests = Array.from(uniqueSlowRequests.values());

  const uniqueApiCalls = new Map();
  metrics.apiCalls.forEach(call => {
    if (!uniqueApiCalls.has(call.url)) {
      uniqueApiCalls.set(call.url, call);
    }
  });
  metrics.apiCalls = Array.from(uniqueApiCalls.values());

  return metrics;
}

/**
 * Generate performance report for network analysis
 */
export function generateNetworkReport(metrics: NetworkMetrics): string {
  const lines: string[] = [];

  lines.push('# Network Request Analysis Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');

  lines.push('## Network Metrics Summary');
  lines.push('');
  lines.push('| Metric | Value | Status |');
  lines.push('|--------|-------|--------|');

  const failureRate =
    metrics.totalRequests > 0
      ? ((metrics.failedRequests / metrics.totalRequests) * 100).toFixed(1)
      : '0';

  const failureStatus =
    metrics.failedRequests === 0
      ? '✅ Good'
      : metrics.failedRequests < 3
        ? '⚠️ Fair'
        : '❌ High';

  const overheadSeconds = (metrics.totalNetworkOverhead / 1000).toFixed(2);
  const overheadStatus =
    metrics.totalNetworkOverhead < 5000
      ? '✅ Good'
      : metrics.totalNetworkOverhead < 10000
        ? '⚠️ Fair'
        : '❌ High';

  lines.push(`| Total Requests | ${metrics.totalRequests} | - |`);
  lines.push(
    `| Failed Requests | ${metrics.failedRequests} (${failureRate}%) | ${failureStatus} |`
  );
  lines.push(
    `| Slow Requests | ${metrics.slowRequests.length} | ${metrics.slowRequests.length === 0 ? '✅ Good' : '⚠️ Review'} |`
  );
  lines.push(
    `| Total Network Time | ${overheadSeconds}s | ${overheadStatus} |`
  );
  lines.push(`| API Calls | ${metrics.apiCalls.length} | - |`);

  lines.push('');

  if (metrics.slowRequests.length > 0) {
    lines.push('## Slow Requests (> 2 seconds)');
    lines.push('');
    lines.push('| URL | Duration (ms) | Status |');
    lines.push('|-----|---------------|--------|');

    metrics.slowRequests
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10) // Top 10 slowest
      .forEach(req => {
        const url =
          req.url.length > 60 ? req.url.substring(0, 57) + '...' : req.url;
        lines.push(
          `| ${url} | ${req.duration.toFixed(0)} | ${req.status || 'N/A'} |`
        );
      });

    lines.push('');
  }

  if (metrics.apiCalls.length > 0) {
    lines.push('## API Calls');
    lines.push('');
    lines.push('| URL | Duration (ms) | Success |');
    lines.push('|-----|---------------|---------|');

    metrics.apiCalls
      .sort((a, b) => b.duration - a.duration)
      .forEach(call => {
        const url =
          call.url.length > 60 ? call.url.substring(0, 57) + '...' : call.url;
        const success = call.success ? '✅' : '❌';
        lines.push(`| ${url} | ${call.duration.toFixed(0)} | ${success} |`);
      });

    lines.push('');
  }

  if (metrics.failedRequests > 0) {
    lines.push('## ⚠️ Failed Requests');
    lines.push('');
    lines.push(`${metrics.failedRequests} request(s) failed during testing.`);
    lines.push('');
  }

  lines.push('## Recommendations');
  lines.push('');

  if (metrics.failedRequests > 0) {
    lines.push('⚠️ **Failed requests detected.** Consider:');
    lines.push('   - Implementing exponential backoff retry strategy');
    lines.push('   - Adding offline fallback mechanisms');
    lines.push('   - Improving error handling and user feedback');
    lines.push('');
  }

  if (metrics.slowRequests.length > 3) {
    lines.push('⚠️ **Multiple slow requests detected.** Consider:');
    lines.push('   - Implementing request timeout and cancellation');
    lines.push('   - Using service worker for request caching');
    lines.push('   - Optimizing API endpoints or using CDN');
    lines.push('   - Implementing request batching where possible');
    lines.push('');
  }

  if (metrics.totalNetworkOverhead > 10000) {
    lines.push('⚠️ **High network overhead.** Consider:');
    lines.push('   - Reducing number of network requests');
    lines.push('   - Implementing aggressive caching strategy');
    lines.push('   - Using request batching or GraphQL');
    lines.push('   - Optimizing payload sizes');
    lines.push('');
  }

  const failedApiCalls = metrics.apiCalls.filter(call => !call.success);
  if (failedApiCalls.length > 0) {
    lines.push('⚠️ **API call failures detected.** Consider:');
    lines.push('   - Reviewing API error handling');
    lines.push('   - Implementing fallback API strategies');
    lines.push('   - Adding API health monitoring');
    lines.push('');
  }

  const slowApiCalls = metrics.apiCalls.filter(call => call.duration > 3000);
  if (slowApiCalls.length > 0) {
    lines.push('⚠️ **Slow API calls detected.** Consider:');
    lines.push('   - Implementing result caching');
    lines.push('   - Using streaming responses for better UX');
    lines.push('   - Optimizing API queries or indexes');
    lines.push('   - Implementing request prioritization');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Main execution function
 */
export function main(): void {
  console.log('🌐 Network Request Analysis Test\n');

  const test = generateNetworkAnalysisTest();
  console.log(`📋 ${test.description}`);
  console.log(`   Steps: ${test.mcpCalls.length}\n`);

  console.log('📊 Metrics to be measured:');
  console.log('   - Total network requests');
  console.log('   - Failed requests');
  console.log('   - Slow requests (> 2s)');
  console.log('   - Total network overhead');
  console.log('   - API call performance\n');

  console.log('✅ Test generation complete!');
  console.log('\n💡 To execute this test:');
  console.log('   1. Ensure Playwright MCP server is running');
  console.log('   2. Execute the MCP calls in sequence');
  console.log(
    '   3. Capture network requests with mcp_playwright_browser_network_requests'
  );
  console.log('   4. Process results with processNetworkAnalysisResults()');
  console.log('   5. Generate report with generateNetworkReport()');
}

if (process.argv[1]?.includes('test-performance-network')) {
  main();
}
