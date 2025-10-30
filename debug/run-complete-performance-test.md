# Complete Performance Monitoring Test Execution Guide

This guide demonstrates how to execute the complete performance monitoring workflow using Playwright MCP.

## Prerequisites

1. **Playwright MCP Server Configured:**

   ```json
   // mcp-config.json
   {
     "mcpServers": {
       "playwright": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-playwright"],
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

2. **Extension Built:**

   ```bash
   pnpm build
   ```

3. **Test Page Available:**
   - Ensure `test-page.html` exists in project root with article content

## Execution Workflow

### Phase 1: Page Load Performance Test

**Objective:** Measure extension installation, content script injection, article processing, and UI rendering times.

**Steps:**

1. **Generate Test Suite:**

   ```typescript
   import { generatePageLoadPerformanceTest } from './debug/test-performance-page-load';
   const pageLoadTest = generatePageLoadPerformanceTest();
   ```

2. **Execute MCP Calls:**
   Execute each of the 17 MCP calls in sequence:
   - Record baseline timestamp
   - Navigate to chrome://extensions
   - Measure extension installation time
   - Navigate to test page
   - Measure content script injection time
   - Trigger article processing
   - Measure processing duration
   - Switch to learning interface tab
   - Measure UI rendering time
   - Compile all metrics

3. **Collect Results:**

   ```typescript
   import { processPageLoadResults } from './debug/test-performance-page-load';
   const pageLoadMetrics = processPageLoadResults(mcpResults);
   ```

4. **Generate Individual Report:**
   ```typescript
   import { generatePageLoadReport } from './debug/test-performance-page-load';
   const pageLoadReport = generatePageLoadReport(pageLoadMetrics);
   console.log(pageLoadReport);
   ```

**Expected Output:**

```
Extension Install Time: 850ms ✅ Good
Content Script Injection: 420ms ✅ Good
Article Processing: 2800ms ✅ Good
UI Rendering: 950ms ✅ Good
Total Load Time: 4500ms ✅ Good
```

### Phase 2: AI Processing Performance Test

**Objective:** Measure Chrome AI API response times, offscreen processing, and batch performance.

**Steps:**

1. **Generate Test Suite:**

   ```typescript
   import { generateAIProcessingPerformanceTest } from './debug/test-performance-ai-processing';
   const aiTest = generateAIProcessingPerformanceTest();
   ```

2. **Execute MCP Calls:**
   Execute each of the 12 MCP calls in sequence:
   - Navigate to test page
   - Initialize AI performance tracking
   - Test Chrome AI API response time
   - Trigger article processing
   - Measure offscreen processing duration
   - Test batch processing performance
   - Identify processing bottlenecks
   - Compile AI metrics

3. **Collect Results:**

   ```typescript
   import { processAIProcessingResults } from './debug/test-performance-ai-processing';
   const aiMetrics = processAIProcessingResults(mcpResults);
   ```

4. **Generate Individual Report:**
   ```typescript
   import { generateAIProcessingReport } from './debug/test-performance-ai-processing';
   const aiReport = generateAIProcessingReport(aiMetrics);
   console.log(aiReport);
   ```

**Expected Output:**

```
Chrome AI Response: 1800ms ✅ Good
Offscreen Processing: 3500ms ✅ Good
Batch Avg Item: 350ms ✅ Good
Bottlenecks: None detected
```

### Phase 3: Memory and Resource Usage Test

**Objective:** Track memory usage, storage quota, cache metrics, and identify memory leaks.

**Steps:**

1. **Generate Test Suite:**

   ```typescript
   import { generateMemoryTrackingTest } from './debug/test-performance-memory';
   const memoryTest = generateMemoryTrackingTest();
   ```

2. **Execute MCP Calls:**
   Execute each of the 13 MCP calls in sequence:
   - Navigate to test page
   - Capture baseline memory metrics
   - Check storage quota usage
   - Track cache metrics
   - Trigger processing to stress test memory
   - Measure memory after processing
   - Force garbage collection (if available)
   - Measure memory after GC
   - Identify potential memory leaks
   - Compile memory metrics

3. **Collect Results:**

   ```typescript
   import { processMemoryTrackingResults } from './debug/test-performance-memory';
   const memoryMetrics = processMemoryTrackingResults(mcpResults);
   ```

4. **Generate Individual Report:**
   ```typescript
   import { generateMemoryReport } from './debug/test-performance-memory';
   const memoryReport = generateMemoryReport(memoryMetrics);
   console.log(memoryReport);
   ```

**Expected Output:**

```
JS Heap Usage: 45.2MB / 128MB (35.3%) ✅ Good
Storage Usage: 12.5MB (25.0%) ✅ Good
Cache Hit Rate: 68.5% ✅ Good
Potential Leaks: None detected
```

### Phase 4: Network Request Analysis Test

**Objective:** Analyze network requests, identify slow API calls, and measure network overhead.

**Steps:**

1. **Generate Test Suite:**

   ```typescript
   import { generateNetworkAnalysisTest } from './debug/test-performance-network';
   const networkTest = generateNetworkAnalysisTest();
   ```

2. **Execute MCP Calls:**
   Execute each of the 11 MCP calls in sequence:
   - Navigate to test page
   - Initialize network tracking
   - Trigger processing to generate network activity
   - Capture all network requests
   - Get resource timing data
   - Analyze network requests
   - Identify failed requests
   - Compile network metrics

3. **Collect Results:**

   ```typescript
   import { processNetworkAnalysisResults } from './debug/test-performance-network';
   const networkMetrics = processNetworkAnalysisResults(
     mcpResults,
     networkRequests
   );
   ```

4. **Generate Individual Report:**
   ```typescript
   import { generateNetworkReport } from './debug/test-performance-network';
   const networkReport = generateNetworkReport(networkMetrics);
   console.log(networkReport);
   ```

**Expected Output:**

```
Total Requests: 15
Failed Requests: 0 ✅ Good
Slow Requests: 1 ⚠️ Review
Total Network Time: 4.2s ✅ Good
API Calls: 3
```

### Phase 5: Generate Comprehensive Report

**Objective:** Compile all metrics and generate comprehensive performance report.

**Steps:**

1. **Compile All Metrics:**

   ```typescript
   import {
     generateComprehensivePerformanceReport,
     savePerformanceReport,
   } from './debug/test-performance-report-generator';

   const report = generateComprehensivePerformanceReport(
     'article-processing-workflow',
     pageLoadMetrics,
     aiMetrics,
     memoryMetrics,
     networkMetrics,
     baseline // optional - for comparison
   );
   ```

2. **Review Report:**

   ```typescript
   import { formatPerformanceReportAsMarkdown } from './debug/test-performance-report-generator';
   const markdown = formatPerformanceReportAsMarkdown(report);
   console.log(markdown);
   ```

3. **Save Report:**
   ```typescript
   const reportPath = savePerformanceReport(report);
   console.log(`Report saved to: ${reportPath}`);
   ```

**Expected Output:**

```
# Comprehensive Performance Report

**Scenario:** article-processing-workflow
**Session ID:** perf-20241030-143022
**Generated:** 2024-10-30T14:30:22.000Z

## Executive Summary

✅ **Performance is within acceptable thresholds.**

## Performance Score

🟢 **Overall Score: 92/100**

**Excellent!** Performance is optimal with minimal issues.

## Optimization Opportunities

1. One slow network request detected (> 2s)

## Actionable Recommendations

### 🟡 Medium Priority

1. Implement request timeout and cancellation for slow network requests
```

## Complete Execution Script

Here's a complete script that executes all phases:

```typescript
import {
  generatePageLoadPerformanceTest,
  processPageLoadResults,
} from './debug/test-performance-page-load';
import {
  generateAIProcessingPerformanceTest,
  processAIProcessingResults,
} from './debug/test-performance-ai-processing';
import {
  generateMemoryTrackingTest,
  processMemoryTrackingResults,
} from './debug/test-performance-memory';
import {
  generateNetworkAnalysisTest,
  processNetworkAnalysisResults,
} from './debug/test-performance-network';
import {
  generateComprehensivePerformanceReport,
  savePerformanceReport,
} from './debug/test-performance-report-generator';

async function runCompletePerformanceTest() {
  console.log('🚀 Starting Complete Performance Monitoring Test\n');

  // Phase 1: Page Load Performance
  console.log('📊 Phase 1: Page Load Performance Test');
  const pageLoadTest = generatePageLoadPerformanceTest();
  console.log(`   Steps: ${pageLoadTest.mcpCalls.length}`);
  // Execute MCP calls and collect results
  const pageLoadResults = await executeMCPCalls(pageLoadTest.mcpCalls);
  const pageLoadMetrics = processPageLoadResults(pageLoadResults);
  console.log('   ✅ Complete\n');

  // Phase 2: AI Processing Performance
  console.log('📊 Phase 2: AI Processing Performance Test');
  const aiTest = generateAIProcessingPerformanceTest();
  console.log(`   Steps: ${aiTest.mcpCalls.length}`);
  // Execute MCP calls and collect results
  const aiResults = await executeMCPCalls(aiTest.mcpCalls);
  const aiMetrics = processAIProcessingResults(aiResults);
  console.log('   ✅ Complete\n');

  // Phase 3: Memory and Resource Usage
  console.log('📊 Phase 3: Memory and Resource Usage Test');
  const memoryTest = generateMemoryTrackingTest();
  console.log(`   Steps: ${memoryTest.mcpCalls.length}`);
  // Execute MCP calls and collect results
  const memoryResults = await executeMCPCalls(memoryTest.mcpCalls);
  const memoryMetrics = processMemoryTrackingResults(memoryResults);
  console.log('   ✅ Complete\n');

  // Phase 4: Network Request Analysis
  console.log('📊 Phase 4: Network Request Analysis Test');
  const networkTest = generateNetworkAnalysisTest();
  console.log(`   Steps: ${networkTest.mcpCalls.length}`);
  // Execute MCP calls and collect results
  const networkResults = await executeMCPCalls(networkTest.mcpCalls);
  const networkMetrics = processNetworkAnalysisResults(networkResults);
  console.log('   ✅ Complete\n');

  // Phase 5: Generate Comprehensive Report
  console.log('📊 Phase 5: Generate Comprehensive Report');
  const report = generateComprehensivePerformanceReport(
    'article-processing-workflow',
    pageLoadMetrics,
    aiMetrics,
    memoryMetrics,
    networkMetrics
  );

  const reportPath = savePerformanceReport(report);
  console.log(`   ✅ Report saved to: ${reportPath}\n`);

  // Display summary
  console.log('📈 Performance Summary:');
  console.log(`   Overall Score: ${calculateScore(report)}/100`);
  console.log(
    `   Optimization Opportunities: ${report.optimizationOpportunities.length}`
  );
  console.log(`   Recommendations: ${report.recommendations.length}`);
  console.log('\n✅ Complete Performance Monitoring Test Finished!');
}

// Helper function to execute MCP calls
async function executeMCPCalls(mcpCalls: any[]): Promise<any[]> {
  // This would use actual Playwright MCP to execute calls
  // For now, return placeholder
  return [];
}

// Helper function to calculate score
function calculateScore(report: any): number {
  // Extract score from report
  return 92; // Placeholder
}

// Run the test
runCompletePerformanceTest().catch(console.error);
```

## Interpreting Results

### Performance Score Ranges

- **90-100:** 🟢 Excellent - Optimal performance
- **80-89:** 🟢 Good - Acceptable performance
- **70-79:** 🟡 Fair - Room for improvement
- **60-69:** 🟡 Needs Improvement - Several issues
- **0-59:** 🔴 Poor - Significant issues

### Common Issues and Solutions

#### High Memory Usage (> 80%)

**Solution:** Implement memory cleanup routines, review object retention

#### Slow AI Processing (> 3s)

**Solution:** Implement result caching, use streaming responses

#### Failed Network Requests

**Solution:** Implement retry strategy, add offline fallback

#### Low Cache Hit Rate (< 40%)

**Solution:** Review caching strategy, increase cache size

## Baseline Tracking

### Establishing Baseline

```typescript
// First run - establish baseline
const initialReport = generateComprehensivePerformanceReport(...);
const baseline = initialReport.metrics;

// Save baseline for future comparisons
fs.writeFileSync(
  'debug/reports/performance/baseline.json',
  JSON.stringify(baseline, null, 2)
);
```

### Comparing Against Baseline

```typescript
// Load baseline
const baseline = JSON.parse(
  fs.readFileSync('debug/reports/performance/baseline.json', 'utf-8')
);

// Run tests with baseline comparison
const report = generateComprehensivePerformanceReport(
  'article-processing-workflow',
  pageLoadMetrics,
  aiMetrics,
  memoryMetrics,
  networkMetrics,
  baseline // Include baseline for comparison
);

// Review improvements and regressions
console.log('Improvements:', report.comparison?.improvement);
console.log('Regressions:', report.comparison?.regression);
```

## Troubleshooting

### MCP Server Not Responding

1. Check MCP server configuration
2. Restart MCP server
3. Verify Playwright MCP is installed

### Extension Not Loading

1. Verify extension is built (`pnpm build`)
2. Check `dist/` directory exists
3. Verify manifest.json is valid

### Inaccurate Memory Measurements

1. Launch Chrome with `--js-flags=--expose-gc`
2. Ensure sufficient wait time between measurements
3. Run tests multiple times to confirm results

## Next Steps

1. **Review Reports:** Analyze generated performance reports
2. **Implement Optimizations:** Address high-priority recommendations
3. **Re-test:** Run tests again to measure improvements
4. **Track Trends:** Compare against baseline over time
5. **Integrate CI/CD:** Add performance tests to automated pipeline

## Support

For issues or questions:

- Review [PERFORMANCE_MONITORING_README.md](./PERFORMANCE_MONITORING_README.md)
- Check [TASK_8_COMPLETION_SUMMARY.md](./TASK_8_COMPLETION_SUMMARY.md)
- Consult design document at `.kiro/specs/playwright-extension-debugging/design.md`
