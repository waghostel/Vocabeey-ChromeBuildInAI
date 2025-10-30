# Performance Monitoring System

Comprehensive performance monitoring for the Language Learning Chrome Extension using Playwright MCP.

## Overview

The performance monitoring system provides automated testing and analysis of extension performance across four key areas:

1. **Page Load Performance** - Measures extension installation, content script injection, article processing, and UI rendering times
2. **AI Processing Performance** - Tracks Chrome AI API response times, offscreen document processing, and batch processing performance
3. **Memory and Resource Usage** - Monitors JS heap usage, storage quota, cache metrics, and detects potential memory leaks
4. **Network Performance** - Analyzes network requests, identifies slow API calls, failed requests, and measures network overhead

## Requirements

- Playwright MCP server configured in `mcp-config.json`
- Extension built in `dist/` directory
- Chrome browser with extension support
- Node.js 18+ and pnpm

## Quick Start

### 1. Setup

```bash
# Build the extension
pnpm build

# Ensure Playwright MCP server is configured
# Check mcp-config.json for playwright server entry
```

### 2. Run Performance Tests

```typescript
import { generatePageLoadPerformanceTest } from './debug/test-performance-page-load';
import { generateAIProcessingPerformanceTest } from './debug/test-performance-ai-processing';
import { generateMemoryTrackingTest } from './debug/test-performance-memory';
import { generateNetworkAnalysisTest } from './debug/test-performance-network';

// Generate test suites
const pageLoadTest = generatePageLoadPerformanceTest();
const aiTest = generateAIProcessingPerformanceTest();
const memoryTest = generateMemoryTrackingTest();
const networkTest = generateNetworkAnalysisTest();

// Execute MCP calls for each test suite
// Collect results from each test
```

### 3. Generate Report

```typescript
import {
  generateComprehensivePerformanceReport,
  savePerformanceReport,
} from './debug/test-performance-report-generator';

// Compile all metrics
const report = generateComprehensivePerformanceReport(
  'article-processing-workflow',
  pageLoadMetrics,
  aiProcessingMetrics,
  memoryMetrics,
  networkMetrics,
  baseline // optional - for comparison
);

// Save report to file
const reportPath = savePerformanceReport(report);
console.log(`Report saved to: ${reportPath}`);
```

## Test Suites

### 1. Page Load Performance Test

**File:** `test-performance-page-load.ts`

**Measures:**

- Extension installation time
- Content script injection time
- Article processing duration
- UI rendering time
- Total load time
- DOM content loaded time
- Load complete time

**Thresholds:**

- Extension Install: < 1000ms (Good), < 1500ms (Fair), > 1500ms (Slow)
- Content Script Injection: < 500ms (Good), < 750ms (Fair), > 750ms (Slow)
- Article Processing: < 3000ms (Good), < 4500ms (Fair), > 4500ms (Slow)
- UI Rendering: < 1000ms (Good), < 1500ms (Fair), > 1500ms (Slow)
- Total Load Time: < 5000ms (Good), < 7500ms (Fair), > 7500ms (Slow)

### 2. AI Processing Performance Test

**File:** `test-performance-ai-processing.ts`

**Measures:**

- Chrome AI API response time
- Offscreen document processing duration
- Batch processing performance (total items, duration, average per item)
- Processing bottlenecks

**Thresholds:**

- Chrome AI Response: < 2000ms (Good), < 3000ms (Fair), > 3000ms (Slow)
- Offscreen Processing: < 4000ms (Good), < 6000ms (Fair), > 6000ms (Slow)
- Batch Item Processing: < 400ms (Good), < 600ms (Fair), > 600ms (Slow)

### 3. Memory and Resource Usage Test

**File:** `test-performance-memory.ts`

**Measures:**

- JS heap memory usage (used, total, limit)
- Storage quota usage (used, quota, percentage)
- Cache metrics (size, hit rate, miss rate)
- Potential memory leaks

**Thresholds:**

- Heap Usage: < 60% (Good), < 80% (Fair), > 80% (High)
- Storage Usage: < 60% (Good), < 80% (Fair), > 80% (High)
- Cache Hit Rate: > 60% (Good), > 40% (Fair), < 40% (Low)

**Note:** For accurate memory leak detection, launch Chrome with `--js-flags=--expose-gc` to enable garbage collection testing.

### 4. Network Request Analysis Test

**File:** `test-performance-network.ts`

**Measures:**

- Total network requests
- Failed requests (status >= 400)
- Slow requests (> 2 seconds)
- Total network overhead
- API call performance

**Thresholds:**

- Failed Requests: 0 (Good), < 3 (Fair), > 3 (High)
- Slow Requests: 0 (Good), < 3 (Fair), > 3 (High)
- Total Network Time: < 5s (Good), < 10s (Fair), > 10s (High)

## Performance Report

The comprehensive performance report includes:

### Executive Summary

- Overall performance status
- Number of optimization opportunities identified

### Performance Metrics Overview

- Page load performance table
- AI processing performance table
- Memory and resource usage table
- Network performance table

### Baseline Comparison (if provided)

- Improvements over baseline
- Regressions from baseline

### Optimization Opportunities

- List of identified performance issues
- Specific areas needing attention

### Actionable Recommendations

Prioritized by severity:

- 🔴 **High Priority** - Critical issues (memory leaks, failures)
- 🟡 **Medium Priority** - Performance issues (slow operations)
- 🟢 **Low Priority** - Minor optimizations

### Performance Score

- Overall score (0-100)
- Score interpretation
- Performance grade

## Performance Score Breakdown

The performance score is calculated based on:

- **Page Load (30 points)** - Total load time, content script injection, article processing, UI rendering
- **AI Processing (25 points)** - Chrome AI response time, offscreen processing, bottlenecks
- **Memory (25 points)** - Heap usage, storage usage, cache hit rate, memory leaks
- **Network (20 points)** - Failed requests, slow requests, network overhead

**Score Interpretation:**

- **90-100:** Excellent - Optimal performance with minimal issues
- **80-89:** Good - Acceptable performance with minor optimization opportunities
- **70-79:** Fair - Adequate performance with room for improvement
- **60-69:** Needs Improvement - Several performance issues should be addressed
- **0-59:** Poor - Significant performance issues require immediate attention

## Baseline Tracking

To track performance improvements over time:

1. **Establish Baseline:**

   ```typescript
   // Run initial tests
   const initialReport = generateComprehensivePerformanceReport(...);

   // Save baseline metrics
   const baseline = initialReport.metrics;
   ```

2. **Make Optimizations:**
   - Implement performance improvements
   - Optimize code, caching, or architecture

3. **Compare Against Baseline:**

   ```typescript
   // Run tests again with baseline
   const newReport = generateComprehensivePerformanceReport(
     scenario,
     pageLoadMetrics,
     aiProcessingMetrics,
     memoryMetrics,
     networkMetrics,
     baseline // Include baseline for comparison
   );
   ```

4. **Review Results:**
   - Check improvements section for performance gains
   - Review regressions section for any slowdowns
   - Track performance score over time

## Common Performance Issues and Solutions

### High Memory Usage

**Symptoms:**

- Heap usage > 80%
- Potential memory leaks detected
- Browser becomes sluggish

**Solutions:**

- Implement memory cleanup routines
- Review object retention and remove unnecessary references
- Use WeakMap/WeakSet for cache implementations
- Profile with Chrome DevTools Memory Profiler
- Implement proper cleanup in component lifecycle methods

### Slow AI Processing

**Symptoms:**

- Chrome AI response time > 3s
- Offscreen processing > 6s
- Processing bottlenecks detected

**Solutions:**

- Implement result caching for frequently processed content
- Use streaming responses for better UX
- Optimize offscreen document processing with Web Workers
- Reduce input text size or chunk large texts
- Implement parallel batch processing

### Network Issues

**Symptoms:**

- Failed requests
- Slow API calls (> 2s)
- High network overhead

**Solutions:**

- Implement exponential backoff retry strategy
- Add offline fallback mechanisms
- Use service worker for request caching
- Implement request timeout and cancellation
- Optimize API endpoints or use CDN
- Reduce payload sizes

### Storage Quota Issues

**Symptoms:**

- Storage usage > 80%
- Quota exceeded errors

**Solutions:**

- Implement LRU cache eviction strategy
- Add storage quota monitoring and cleanup
- Compress stored data
- Implement data expiration policies

## Files and Structure

```
debug/
├── performance-monitoring-system.ts       # Core performance monitoring classes
├── test-performance-page-load.ts          # Page load performance tests
├── test-performance-ai-processing.ts      # AI processing performance tests
├── test-performance-memory.ts             # Memory and resource usage tests
├── test-performance-network.ts            # Network request analysis tests
├── test-performance-report-generator.ts   # Report generation and formatting
├── run-performance-monitoring.ts          # Integration script
├── PERFORMANCE_MONITORING_README.md       # This file
└── reports/
    └── performance/                       # Generated reports
        ├── performance-report-*.md        # Markdown reports
        └── performance-report-*.json      # JSON reports
```

## Integration with CI/CD

To integrate performance monitoring into your CI/CD pipeline:

1. **Add Performance Tests to CI:**

   ```yaml
   - name: Run Performance Tests
     run: |
       pnpm build
       node debug/run-performance-monitoring.ts
   ```

2. **Set Performance Thresholds:**
   - Fail build if performance score < 70
   - Warn if performance score < 80

3. **Track Performance Over Time:**
   - Store baseline metrics
   - Compare each build against baseline
   - Alert on significant regressions

4. **Generate Performance Trends:**
   - Collect performance scores from each build
   - Create performance trend graphs
   - Monitor for gradual degradation

## Troubleshooting

### MCP Server Connection Issues

If Playwright MCP server is not responding:

1. Check `mcp-config.json` configuration
2. Verify Playwright MCP server is installed: `npx -y @modelcontextprotocol/server-playwright --version`
3. Restart MCP server
4. Check MCP server logs for errors

### Extension Not Loading

If extension fails to load during tests:

1. Verify extension is built: `pnpm build`
2. Check `dist/` directory exists and contains manifest.json
3. Verify manifest.json is valid
4. Check browser console for loading errors

### Inaccurate Memory Measurements

For accurate memory leak detection:

1. Launch Chrome with `--js-flags=--expose-gc`
2. Ensure sufficient wait time between measurements
3. Run tests multiple times to confirm leaks
4. Use Chrome DevTools Memory Profiler for detailed analysis

## Best Practices

1. **Run Tests Regularly:**
   - Run performance tests before major releases
   - Track performance trends over time
   - Set up automated performance testing in CI/CD

2. **Establish Baselines:**
   - Create baseline metrics for each major feature
   - Update baselines after significant optimizations
   - Compare against baselines to track improvements

3. **Prioritize Optimizations:**
   - Focus on high-priority recommendations first
   - Address critical issues (memory leaks, failures) immediately
   - Balance performance improvements with feature development

4. **Monitor Production Performance:**
   - Use performance monitoring in production (with user consent)
   - Track real-world performance metrics
   - Identify performance issues affecting users

5. **Document Performance Changes:**
   - Document performance optimizations in commit messages
   - Track performance improvements in release notes
   - Share performance reports with team

## Support

For issues or questions about the performance monitoring system:

1. Check this README for common issues and solutions
2. Review generated performance reports for specific recommendations
3. Consult the design document at `.kiro/specs/playwright-extension-debugging/design.md`
4. Check the requirements document at `.kiro/specs/playwright-extension-debugging/requirements.md`

## Related Documentation

- [Visual Debugging System](./VISUAL_DEBUGGING_SYSTEM_README.md)
- [Article Processing Workflow](./ARTICLE_PROCESSING_WORKFLOW_README.md)
- [User Interaction Testing](./USER_INTERACTION_TESTING_README.md)
- [Artifact Management](./ARTIFACT_MANAGEMENT_README.md)
