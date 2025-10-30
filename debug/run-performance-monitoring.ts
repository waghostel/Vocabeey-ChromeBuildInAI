/**
 * Performance Monitoring Integration Script
 *
 * This script integrates all performance monitoring tests and generates
 * a comprehensive performance report.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { generatePageLoadPerformanceTest } from './test-performance-page-load';
import { generateAIProcessingPerformanceTest } from './test-performance-ai-processing';
import { generateMemoryTrackingTest } from './test-performance-memory';
import { generateNetworkAnalysisTest } from './test-performance-network';

/**
 * Generate complete performance monitoring workflow
 *
 * This function creates a comprehensive test suite that measures all
 * performance aspects of the extension.
 */
export function generateCompletePerformanceMonitoringWorkflow(): {
  description: string;
  testSuites: Array<{
    name: string;
    description: string;
    mcpCalls: any[];
  }>;
  executionOrder: string[];
} {
  // Generate all test suites
  const pageLoadTest = generatePageLoadPerformanceTest();
  const aiProcessingTest = generateAIProcessingPerformanceTest();
  const memoryTest = generateMemoryTrackingTest();
  const networkTest = generateNetworkAnalysisTest();

  return {
    description:
      'Complete performance monitoring workflow covering all performance aspects',
    testSuites: [
      {
        name: 'Page Load Performance',
        description: pageLoadTest.description,
        mcpCalls: pageLoadTest.mcpCalls,
      },
      {
        name: 'AI Processing Performance',
        description: aiProcessingTest.description,
        mcpCalls: aiProcessingTest.mcpCalls,
      },
      {
        name: 'Memory and Resource Usage',
        description: memoryTest.description,
        mcpCalls: memoryTest.mcpCalls,
      },
      {
        name: 'Network Request Analysis',
        description: networkTest.description,
        mcpCalls: networkTest.mcpCalls,
      },
    ],
    executionOrder: [
      'Page Load Performance',
      'AI Processing Performance',
      'Memory and Resource Usage',
      'Network Request Analysis',
    ],
  };
}

/**
 * Generate performance monitoring documentation
 */
export function generatePerformanceMonitoringDocumentation(): string {
  const lines: string[] = [];

  lines.push('# Performance Monitoring System');
  lines.push('');
  lines.push(
    'Comprehensive performance monitoring for the Language Learning Chrome Extension.'
  );
  lines.push('');

  lines.push('## Overview');
  lines.push('');
  lines.push('The performance monitoring system tracks and analyzes:');
  lines.push('');
  lines.push(
    '1. **Page Load Performance** - Extension installation, content script injection, article processing, and UI rendering times'
  );
  lines.push(
    '2. **AI Processing Performance** - Chrome AI API response times, offscreen processing, and batch processing performance'
  );
  lines.push(
    '3. **Memory and Resource Usage** - JS heap usage, storage quota, cache metrics, and memory leak detection'
  );
  lines.push(
    '4. **Network Performance** - Request analysis, slow API calls, failed requests, and network overhead'
  );
  lines.push('');

  lines.push('## Test Suites');
  lines.push('');

  const workflow = generateCompletePerformanceMonitoringWorkflow();

  workflow.testSuites.forEach((suite, index) => {
    lines.push(`### ${index + 1}. ${suite.name}`);
    lines.push('');
    lines.push(suite.description);
    lines.push('');
    lines.push(`**Total Steps:** ${suite.mcpCalls.length}`);
    lines.push('');
    lines.push('**Key Measurements:**');
    lines.push('');

    // Extract key measurements from MCP calls
    const measurements = suite.mcpCalls
      .filter(
        call =>
          call.purpose.includes('Measure') ||
          call.purpose.includes('Track') ||
          call.purpose.includes('Monitor')
      )
      .slice(0, 5);

    measurements.forEach(call => {
      lines.push(`- ${call.purpose}`);
    });
    lines.push('');
  });

  lines.push('## Execution Workflow');
  lines.push('');
  lines.push('```mermaid');
  lines.push('flowchart TD');
  lines.push('    A[Start Performance Monitoring] --> B[Page Load Test]');
  lines.push('    B --> C[AI Processing Test]');
  lines.push('    C --> D[Memory Tracking Test]');
  lines.push('    D --> E[Network Analysis Test]');
  lines.push('    E --> F[Compile Metrics]');
  lines.push('    F --> G[Generate Report]');
  lines.push('    G --> H[Save Report]');
  lines.push('    H --> I[End]');
  lines.push('```');
  lines.push('');

  lines.push('## Performance Thresholds');
  lines.push('');
  lines.push('### Page Load');
  lines.push('');
  lines.push('| Metric | Good | Fair | Slow |');
  lines.push('|--------|------|------|------|');
  lines.push('| Extension Install | < 1000ms | < 1500ms | > 1500ms |');
  lines.push('| Content Script Injection | < 500ms | < 750ms | > 750ms |');
  lines.push('| Article Processing | < 3000ms | < 4500ms | > 4500ms |');
  lines.push('| UI Rendering | < 1000ms | < 1500ms | > 1500ms |');
  lines.push('| Total Load Time | < 5000ms | < 7500ms | > 7500ms |');
  lines.push('');

  lines.push('### AI Processing');
  lines.push('');
  lines.push('| Metric | Good | Fair | Slow |');
  lines.push('|--------|------|------|------|');
  lines.push('| Chrome AI Response | < 2000ms | < 3000ms | > 3000ms |');
  lines.push('| Offscreen Processing | < 4000ms | < 6000ms | > 6000ms |');
  lines.push('| Batch Item Processing | < 400ms | < 600ms | > 600ms |');
  lines.push('');

  lines.push('### Memory');
  lines.push('');
  lines.push('| Metric | Good | Fair | High |');
  lines.push('|--------|------|------|------|');
  lines.push('| Heap Usage | < 60% | < 80% | > 80% |');
  lines.push('| Storage Usage | < 60% | < 80% | > 80% |');
  lines.push('| Cache Hit Rate | > 60% | > 40% | < 40% |');
  lines.push('');

  lines.push('### Network');
  lines.push('');
  lines.push('| Metric | Good | Fair | High |');
  lines.push('|--------|------|------|------|');
  lines.push('| Failed Requests | 0 | < 3 | > 3 |');
  lines.push('| Slow Requests | 0 | < 3 | > 3 |');
  lines.push('| Total Network Time | < 5s | < 10s | > 10s |');
  lines.push('');

  lines.push('## Usage Instructions');
  lines.push('');
  lines.push('### 1. Setup');
  lines.push('');
  lines.push('```bash');
  lines.push('# Ensure Playwright MCP server is configured in mcp-config.json');
  lines.push('# Build the extension');
  lines.push('pnpm build');
  lines.push('```');
  lines.push('');

  lines.push('### 2. Run Performance Tests');
  lines.push('');
  lines.push('Execute each test suite in order:');
  lines.push('');
  lines.push('```typescript');
  lines.push('// 1. Page Load Performance');
  lines.push('const pageLoadTest = generatePageLoadPerformanceTest();');
  lines.push('// Execute MCP calls and collect results');
  lines.push('');
  lines.push('// 2. AI Processing Performance');
  lines.push('const aiTest = generateAIProcessingPerformanceTest();');
  lines.push('// Execute MCP calls and collect results');
  lines.push('');
  lines.push('// 3. Memory Tracking');
  lines.push('const memoryTest = generateMemoryTrackingTest();');
  lines.push('// Execute MCP calls and collect results');
  lines.push('');
  lines.push('// 4. Network Analysis');
  lines.push('const networkTest = generateNetworkAnalysisTest();');
  lines.push('// Execute MCP calls and collect results');
  lines.push('```');
  lines.push('');

  lines.push('### 3. Generate Report');
  lines.push('');
  lines.push('```typescript');
  lines.push(
    "import { generateComprehensivePerformanceReport } from './test-performance-report-generator';"
  );
  lines.push('');
  lines.push('const report = generateComprehensivePerformanceReport(');
  lines.push("  'article-processing-workflow',");
  lines.push('  pageLoadMetrics,');
  lines.push('  aiProcessingMetrics,');
  lines.push('  memoryMetrics,');
  lines.push('  networkMetrics,');
  lines.push('  baseline // optional');
  lines.push(');');
  lines.push('');
  lines.push('// Save report');
  lines.push('savePerformanceReport(report);');
  lines.push('```');
  lines.push('');

  lines.push('## Report Output');
  lines.push('');
  lines.push(
    'Performance reports are saved to `debug/reports/performance/` and include:'
  );
  lines.push('');
  lines.push(
    '- **Markdown Report** - Human-readable report with metrics, analysis, and recommendations'
  );
  lines.push(
    '- **JSON Report** - Machine-readable data for automation and tracking'
  );
  lines.push('');

  lines.push('## Baseline Tracking');
  lines.push('');
  lines.push('To track performance improvements over time:');
  lines.push('');
  lines.push('1. Run initial performance tests and save as baseline');
  lines.push('2. Make performance optimizations');
  lines.push('3. Run tests again with baseline comparison');
  lines.push('4. Review improvements and regressions in report');
  lines.push('');

  lines.push('## Performance Score');
  lines.push('');
  lines.push('Each report includes an overall performance score (0-100):');
  lines.push('');
  lines.push('- **90-100:** Excellent - Optimal performance');
  lines.push('- **80-89:** Good - Acceptable with minor issues');
  lines.push('- **70-79:** Fair - Room for improvement');
  lines.push('- **60-69:** Needs Improvement - Several issues');
  lines.push('- **0-59:** Poor - Significant issues');
  lines.push('');

  lines.push('## Troubleshooting');
  lines.push('');
  lines.push('### High Memory Usage');
  lines.push('');
  lines.push('- Review object retention and remove unnecessary references');
  lines.push('- Implement memory cleanup routines');
  lines.push('- Use WeakMap/WeakSet for cache implementations');
  lines.push('- Profile with Chrome DevTools Memory Profiler');
  lines.push('');

  lines.push('### Slow AI Processing');
  lines.push('');
  lines.push('- Implement result caching for frequently processed content');
  lines.push('- Use streaming responses for better UX');
  lines.push('- Optimize offscreen document processing');
  lines.push('- Consider parallel processing for batch operations');
  lines.push('');

  lines.push('### Network Issues');
  lines.push('');
  lines.push('- Implement exponential backoff retry strategy');
  lines.push('- Add offline fallback mechanisms');
  lines.push('- Use service worker for request caching');
  lines.push('- Optimize API endpoints or use CDN');
  lines.push('');

  return lines.join('\n');
}

/**
 * Main execution function
 */
export function main(): void {
  console.log('🚀 Performance Monitoring System\n');

  const workflow = generateCompletePerformanceMonitoringWorkflow();

  console.log(`📋 ${workflow.description}\n`);

  console.log('Test Suites:');
  workflow.testSuites.forEach((suite, index) => {
    console.log(`\n${index + 1}. ${suite.name}`);
    console.log(`   ${suite.description}`);
    console.log(`   Steps: ${suite.mcpCalls.length}`);
  });

  console.log('\n\n📊 Performance Metrics Tracked:');
  console.log('   ✅ Page load and initialization times');
  console.log('   ✅ AI processing performance');
  console.log('   ✅ Memory and resource usage');
  console.log('   ✅ Network request analysis');
  console.log('   ✅ Comprehensive performance report');

  console.log('\n\n✅ Performance monitoring system ready!');
  console.log('\n💡 Next steps:');
  console.log('   1. Execute test suites using Playwright MCP');
  console.log('   2. Collect metrics from each test');
  console.log('   3. Generate comprehensive performance report');
  console.log('   4. Review recommendations and optimize');
}

if (process.argv[1]?.includes('run-performance-monitoring')) {
  main();
}
