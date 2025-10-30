# Performance Monitoring Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide gets you running performance tests quickly.

## Prerequisites

```bash
# 1. Build the extension
pnpm build

# 2. Ensure Playwright MCP is configured
# Check .kiro/settings/mcp.json has playwright entry
```

## Quick Test Execution

### Option 1: Run Individual Test Suites

```typescript
// 1. Page Load Performance
import { generatePageLoadPerformanceTest } from './debug/test-performance-page-load';
const test = generatePageLoadPerformanceTest();
// Execute test.mcpCalls using Playwright MCP

// 2. AI Processing Performance
import { generateAIProcessingPerformanceTest } from './debug/test-performance-ai-processing';
const test = generateAIProcessingPerformanceTest();
// Execute test.mcpCalls using Playwright MCP

// 3. Memory Tracking
import { generateMemoryTrackingTest } from './debug/test-performance-memory';
const test = generateMemoryTrackingTest();
// Execute test.mcpCalls using Playwright MCP

// 4. Network Analysis
import { generateNetworkAnalysisTest } from './debug/test-performance-network';
const test = generateNetworkAnalysisTest();
// Execute test.mcpCalls using Playwright MCP
```

### Option 2: Run Complete Workflow

```typescript
import { generateCompletePerformanceMonitoringWorkflow } from './debug/run-performance-monitoring';

const workflow = generateCompletePerformanceMonitoringWorkflow();

// Execute all test suites in order
workflow.testSuites.forEach(suite => {
  console.log(`Running: ${suite.name}`);
  // Execute suite.mcpCalls using Playwright MCP
});
```

## Generate Report

```typescript
import {
  generateComprehensivePerformanceReport,
  savePerformanceReport,
} from './debug/test-performance-report-generator';

// After collecting all metrics
const report = generateComprehensivePerformanceReport(
  'my-test-scenario',
  pageLoadMetrics,
  aiMetrics,
  memoryMetrics,
  networkMetrics
);

// Save report
const path = savePerformanceReport(report);
console.log(`Report saved: ${path}`);
```

## Understanding Results

### Performance Score

- **90-100:** 🟢 Excellent
- **80-89:** 🟢 Good
- **70-79:** 🟡 Fair
- **60-69:** 🟡 Needs Improvement
- **0-59:** 🔴 Poor

### Quick Metrics Check

**Page Load:**

- Extension Install: Should be < 1000ms
- Content Script: Should be < 500ms
- Article Processing: Should be < 3000ms
- UI Rendering: Should be < 1000ms

**AI Processing:**

- Chrome AI Response: Should be < 2000ms
- Offscreen Processing: Should be < 4000ms

**Memory:**

- Heap Usage: Should be < 60%
- Storage Usage: Should be < 60%
- Cache Hit Rate: Should be > 60%

**Network:**

- Failed Requests: Should be 0
- Slow Requests: Should be 0

## Common Issues

### High Memory Usage

```typescript
// Solution: Implement cleanup
window.addEventListener('unload', () => {
  // Clean up references
  cache.clear();
  listeners.removeAll();
});
```

### Slow AI Processing

```typescript
// Solution: Add caching
const cache = new Map();
if (cache.has(text)) {
  return cache.get(text);
}
const result = await ai.process(text);
cache.set(text, result);
```

### Network Failures

```typescript
// Solution: Add retry logic
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(1000 * Math.pow(2, i));
    }
  }
}
```

## Next Steps

1. **Review Full Documentation:** [PERFORMANCE_MONITORING_README.md](./PERFORMANCE_MONITORING_README.md)
2. **See Complete Guide:** [run-complete-performance-test.md](./run-complete-performance-test.md)
3. **Check Implementation:** [TASK_8_COMPLETION_SUMMARY.md](./TASK_8_COMPLETION_SUMMARY.md)

## Need Help?

- Check [PERFORMANCE_MONITORING_README.md](./PERFORMANCE_MONITORING_README.md) for detailed documentation
- Review [TASK_8_FINAL_VERIFICATION.md](./TASK_8_FINAL_VERIFICATION.md) for verification details
- See [run-complete-performance-test.md](./run-complete-performance-test.md) for step-by-step execution
