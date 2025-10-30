/**
 * Performance Testing: Memory and Resource Usage
 *
 * This script tracks memory usage, storage quota, cache metrics, and identifies
 * potential memory leaks using performance.memory API.
 *
 * Requirements: 7.3
 */

import {
  PerformanceMonitor,
  MemoryMetrics,
} from './performance-monitoring-system';

/**
 * Generate MCP calls for tracking memory and resource usage
 *
 * Task 8.3: Track memory and resource usage
 * - Use mcp_playwright_browser_evaluate with performance.memory
 * - Monitor storage quota usage
 * - Track cache size and hit rates
 * - Identify memory leaks
 */
export function generateMemoryTrackingTest(): {
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
      'Track memory and resource usage to identify leaks and optimization opportunities',
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
            // Capture baseline memory metrics
            const memoryInfo = performance.memory ? {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
              usedPercent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
            } : null;
            
            // Store baseline for leak detection
            window.__memoryBaseline = memoryInfo;
            
            return {
              baseline: memoryInfo,
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Capture baseline memory metrics',
        validation: 'Baseline memory captured',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `async () => {
            // Check storage quota usage
            if (!navigator.storage || !navigator.storage.estimate) {
              return {
                success: false,
                error: 'Storage API not available'
              };
            }
            
            try {
              const estimate = await navigator.storage.estimate();
              const used = estimate.usage || 0;
              const quota = estimate.quota || 0;
              const percentUsed = quota > 0 ? (used / quota) * 100 : 0;
              
              return {
                success: true,
                storageQuota: {
                  used,
                  quota,
                  percentUsed,
                  usedMB: (used / (1024 * 1024)).toFixed(2),
                  quotaMB: (quota / (1024 * 1024)).toFixed(2)
                },
                timestamp: new Date().toISOString()
              };
            } catch (error) {
              return {
                success: false,
                error: error.message
              };
            }
          }`,
        },
        purpose: 'Monitor storage quota usage',
        validation: 'Storage quota measured',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `async () => {
            // Check cache metrics from extension storage
            if (typeof chrome === 'undefined' || !chrome.storage) {
              return {
                success: false,
                error: 'Chrome storage not available'
              };
            }
            
            try {
              // Get cache data from local storage
              const localData = await chrome.storage.local.get();
              
              // Count cached articles
              const cacheKeys = Object.keys(localData).filter(key => 
                key.startsWith('article_') || key.startsWith('cache_')
              );
              
              // Calculate cache size (approximate)
              const cacheSize = cacheKeys.reduce((total, key) => {
                const item = localData[key];
                const itemSize = JSON.stringify(item).length;
                return total + itemSize;
              }, 0);
              
              // Get cache statistics if available
              const cacheStats = localData.cacheStats || {
                hits: 0,
                misses: 0,
                totalRequests: 0
              };
              
              const hitRate = cacheStats.totalRequests > 0 
                ? cacheStats.hits / cacheStats.totalRequests 
                : 0;
              const missRate = cacheStats.totalRequests > 0 
                ? cacheStats.misses / cacheStats.totalRequests 
                : 0;
              
              return {
                success: true,
                cacheMetrics: {
                  size: cacheSize,
                  sizeMB: (cacheSize / (1024 * 1024)).toFixed(2),
                  itemCount: cacheKeys.length,
                  hitRate,
                  missRate,
                  hits: cacheStats.hits,
                  misses: cacheStats.misses,
                  totalRequests: cacheStats.totalRequests
                },
                timestamp: new Date().toISOString()
              };
            } catch (error) {
              return {
                success: false,
                error: error.message
              };
            }
          }`,
        },
        purpose: 'Track cache size and hit rates',
        validation: 'Cache metrics captured',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Trigger article processing to stress test memory
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
        purpose: 'Trigger processing to observe memory usage under load',
        validation: 'Processing triggered',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 5,
        },
        purpose: 'Wait for processing to complete',
        validation: 'Processing complete',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Capture memory after processing
            const memoryInfo = performance.memory ? {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
              usedPercent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
            } : null;
            
            // Calculate memory increase
            const baseline = window.__memoryBaseline;
            const memoryIncrease = baseline && memoryInfo 
              ? memoryInfo.usedJSHeapSize - baseline.usedJSHeapSize 
              : 0;
            
            return {
              afterProcessing: memoryInfo,
              memoryIncrease,
              memoryIncreaseMB: (memoryIncrease / (1024 * 1024)).toFixed(2),
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Measure memory usage after processing',
        validation: 'Post-processing memory captured',
      },
      {
        step: 9,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Force garbage collection if available (Chrome with --js-flags=--expose-gc)
            if (typeof gc === 'function') {
              gc();
            }
            
            return {
              gcTriggered: typeof gc === 'function',
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Trigger garbage collection to identify retained objects',
        validation: 'GC attempted',
      },
      {
        step: 10,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for garbage collection to complete',
        validation: 'GC complete',
      },
      {
        step: 11,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Capture memory after GC
            const memoryInfo = performance.memory ? {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
              usedPercent: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
            } : null;
            
            // Calculate retained memory (potential leak)
            const baseline = window.__memoryBaseline;
            const retainedMemory = baseline && memoryInfo 
              ? memoryInfo.usedJSHeapSize - baseline.usedJSHeapSize 
              : 0;
            
            return {
              afterGC: memoryInfo,
              retainedMemory,
              retainedMemoryMB: (retainedMemory / (1024 * 1024)).toFixed(2),
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Measure memory after GC to identify leaks',
        validation: 'Post-GC memory captured',
      },
      {
        step: 12,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Identify potential memory leaks
            const potentialLeaks = [];
            const baseline = window.__memoryBaseline;
            
            if (!performance.memory || !baseline) {
              return {
                potentialLeaks: ['Unable to detect leaks - performance.memory not available'],
                timestamp: new Date().toISOString()
              };
            }
            
            const currentMemory = performance.memory.usedJSHeapSize;
            const retainedMemory = currentMemory - baseline.usedJSHeapSize;
            const retainedPercent = (retainedMemory / baseline.usedJSHeapSize) * 100;
            
            // Check for significant memory retention after GC
            if (retainedMemory > 10 * 1024 * 1024) { // > 10MB retained
              potentialLeaks.push(\`Significant memory retained after GC: \${(retainedMemory / (1024 * 1024)).toFixed(2)}MB\`);
            }
            
            if (retainedPercent > 50) { // > 50% increase
              potentialLeaks.push(\`Memory increased by \${retainedPercent.toFixed(1)}% after processing\`);
            }
            
            // Check for high overall memory usage
            const usedPercent = (currentMemory / performance.memory.jsHeapSizeLimit) * 100;
            if (usedPercent > 80) {
              potentialLeaks.push(\`High memory usage: \${usedPercent.toFixed(1)}% of heap limit\`);
            }
            
            // Check for detached DOM nodes (if available)
            if (typeof window.getDetachedDOMNodes === 'function') {
              const detachedNodes = window.getDetachedDOMNodes();
              if (detachedNodes > 100) {
                potentialLeaks.push(\`\${detachedNodes} detached DOM nodes detected\`);
              }
            }
            
            return {
              potentialLeaks,
              memoryAnalysis: {
                baseline: baseline.usedJSHeapSize,
                current: currentMemory,
                retained: retainedMemory,
                retainedPercent,
                usedPercent
              },
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Identify potential memory leaks',
        validation: 'Memory leak analysis complete',
      },
      {
        step: 13,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Compile all memory and resource metrics
            const baseline = window.__memoryBaseline;
            const current = performance.memory ? {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null;
            
            return {
              metrics: {
                baseline,
                current,
                storageQuota: window.__storageQuota,
                cacheMetrics: window.__cacheMetrics,
                potentialLeaks: window.__potentialLeaks || []
              },
              timestamp: new Date().toISOString()
            };
          }`,
        },
        purpose: 'Compile all memory and resource usage metrics',
        validation: 'All memory metrics compiled',
      },
    ],
  };
}

/**
 * Process memory tracking test results and create metrics object
 */
export function processMemoryTrackingResults(
  testResults: any[]
): MemoryMetrics {
  const metrics: MemoryMetrics = {
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    storageQuotaUsage: {
      used: 0,
      quota: 0,
      percentUsed: 0,
    },
    cacheMetrics: {
      size: 0,
      hitRate: 0,
      missRate: 0,
    },
    potentialLeaks: [],
  };

  // Parse results and populate metrics
  testResults.forEach(result => {
    // Memory info
    if (result.afterGC || result.current) {
      const memInfo = result.afterGC || result.current;
      metrics.usedJSHeapSize = memInfo.usedJSHeapSize || 0;
      metrics.totalJSHeapSize = memInfo.totalJSHeapSize || 0;
      metrics.jsHeapSizeLimit = memInfo.jsHeapSizeLimit || 0;
    }

    // Storage quota
    if (result.storageQuota) {
      metrics.storageQuotaUsage = {
        used: result.storageQuota.used || 0,
        quota: result.storageQuota.quota || 0,
        percentUsed: result.storageQuota.percentUsed || 0,
      };
    }

    // Cache metrics
    if (result.cacheMetrics) {
      metrics.cacheMetrics = {
        size: result.cacheMetrics.size || 0,
        hitRate: result.cacheMetrics.hitRate || 0,
        missRate: result.cacheMetrics.missRate || 0,
      };
    }

    // Potential leaks
    if (result.potentialLeaks && Array.isArray(result.potentialLeaks)) {
      metrics.potentialLeaks.push(...result.potentialLeaks);
    }
  });

  // Deduplicate leaks
  metrics.potentialLeaks = Array.from(new Set(metrics.potentialLeaks));

  return metrics;
}

/**
 * Generate performance report for memory and resource usage
 */
export function generateMemoryReport(metrics: MemoryMetrics): string {
  const lines: string[] = [];

  lines.push('# Memory and Resource Usage Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push('');

  lines.push('## Memory Metrics');
  lines.push('');
  lines.push('| Metric | Value | Status |');
  lines.push('|--------|-------|--------|');

  const usedMB = (metrics.usedJSHeapSize / (1024 * 1024)).toFixed(2);
  const totalMB = (metrics.totalJSHeapSize / (1024 * 1024)).toFixed(2);
  const limitMB = (metrics.jsHeapSizeLimit / (1024 * 1024)).toFixed(2);
  const usedPercent =
    metrics.jsHeapSizeLimit > 0
      ? ((metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100).toFixed(1)
      : '0';

  const memoryStatus =
    parseFloat(usedPercent) < 60
      ? '✅ Good'
      : parseFloat(usedPercent) < 80
        ? '⚠️ Fair'
        : '❌ High';

  lines.push(`| Used JS Heap | ${usedMB} MB | ${memoryStatus} |`);
  lines.push(`| Total JS Heap | ${totalMB} MB | - |`);
  lines.push(`| JS Heap Limit | ${limitMB} MB | - |`);
  lines.push(`| Heap Usage | ${usedPercent}% | ${memoryStatus} |`);

  lines.push('');
  lines.push('## Storage Quota');
  lines.push('');
  lines.push('| Metric | Value | Status |');
  lines.push('|--------|-------|--------|');

  const usedStorageMB = (
    metrics.storageQuotaUsage.used /
    (1024 * 1024)
  ).toFixed(2);
  const quotaMB = (metrics.storageQuotaUsage.quota / (1024 * 1024)).toFixed(2);
  const storagePercent = metrics.storageQuotaUsage.percentUsed.toFixed(1);

  const storageStatus =
    metrics.storageQuotaUsage.percentUsed < 60
      ? '✅ Good'
      : metrics.storageQuotaUsage.percentUsed < 80
        ? '⚠️ Fair'
        : '❌ High';

  lines.push(`| Used Storage | ${usedStorageMB} MB | ${storageStatus} |`);
  lines.push(`| Storage Quota | ${quotaMB} MB | - |`);
  lines.push(`| Storage Usage | ${storagePercent}% | ${storageStatus} |`);

  lines.push('');
  lines.push('## Cache Metrics');
  lines.push('');
  lines.push('| Metric | Value | Status |');
  lines.push('|--------|-------|--------|');

  const cacheSizeMB = (metrics.cacheMetrics.size / (1024 * 1024)).toFixed(2);
  const hitRatePercent = (metrics.cacheMetrics.hitRate * 100).toFixed(1);
  const missRatePercent = (metrics.cacheMetrics.missRate * 100).toFixed(1);

  const cacheStatus =
    metrics.cacheMetrics.hitRate > 0.6
      ? '✅ Good'
      : metrics.cacheMetrics.hitRate > 0.4
        ? '⚠️ Fair'
        : '❌ Low';

  lines.push(`| Cache Size | ${cacheSizeMB} MB | - |`);
  lines.push(`| Hit Rate | ${hitRatePercent}% | ${cacheStatus} |`);
  lines.push(`| Miss Rate | ${missRatePercent}% | - |`);

  lines.push('');

  if (metrics.potentialLeaks.length > 0) {
    lines.push('## ⚠️ Potential Memory Leaks');
    lines.push('');
    metrics.potentialLeaks.forEach((leak, index) => {
      lines.push(`${index + 1}. ${leak}`);
    });
    lines.push('');
  }

  lines.push('## Recommendations');
  lines.push('');

  if (parseFloat(usedPercent) > 80) {
    lines.push('⚠️ **High memory usage detected.** Consider:');
    lines.push('   - Implementing memory cleanup routines');
    lines.push(
      '   - Reviewing object retention and removing unnecessary references'
    );
    lines.push('   - Using WeakMap/WeakSet for cache implementations');
    lines.push('');
  }

  if (metrics.storageQuotaUsage.percentUsed > 80) {
    lines.push('⚠️ **Storage quota nearly full.** Consider:');
    lines.push('   - Implementing LRU cache eviction strategy');
    lines.push('   - Adding storage quota monitoring and cleanup');
    lines.push('   - Compressing stored data');
    lines.push('');
  }

  if (metrics.cacheMetrics.hitRate < 0.5) {
    lines.push('⚠️ **Low cache hit rate.** Consider:');
    lines.push('   - Reviewing caching strategy and key generation');
    lines.push('   - Increasing cache size or TTL');
    lines.push('   - Implementing cache warming for common requests');
    lines.push('');
  }

  if (metrics.potentialLeaks.length > 0) {
    lines.push('⚠️ **Potential memory leaks detected.** Actions:');
    lines.push(
      '   - Use Chrome DevTools Memory Profiler to identify leak sources'
    );
    lines.push('   - Review event listener cleanup and object disposal');
    lines.push('   - Check for circular references and detached DOM nodes');
    lines.push('   - Implement proper cleanup in component lifecycle methods');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Main execution function
 */
export function main(): void {
  console.log('💾 Memory and Resource Usage Test\n');

  const test = generateMemoryTrackingTest();
  console.log(`📋 ${test.description}`);
  console.log(`   Steps: ${test.mcpCalls.length}\n`);

  console.log('📊 Metrics to be measured:');
  console.log('   - JS heap memory usage');
  console.log('   - Storage quota usage');
  console.log('   - Cache size and hit rates');
  console.log('   - Potential memory leaks\n');

  console.log('✅ Test generation complete!');
  console.log('\n💡 To execute this test:');
  console.log('   1. Ensure Playwright MCP server is running');
  console.log('   2. Launch Chrome with --js-flags=--expose-gc for GC testing');
  console.log('   3. Execute the MCP calls in sequence');
  console.log(
    '   4. Collect results and process with processMemoryTrackingResults()'
  );
  console.log('   5. Generate report with generateMemoryReport()');
}

if (process.argv[1]?.includes('test-performance-memory')) {
  main();
}
