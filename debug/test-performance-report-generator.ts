/**
 * Performance Report Generator
 *
 * This script compiles all performance metrics, identifies optimization opportunities,
 * provides actionable recommendations, and compares against performance baselines.
 *
 * Requirements: 7.5
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  PerformanceMonitor,
  PerformanceReport,
  PerformanceMetrics,
  PageLoadMetrics,
  AIProcessingMetrics,
  MemoryMetrics,
  NetworkMetrics,
} from './performance-monitoring-system';

/**
 * Generate comprehensive performance report
 *
 * Task 8.5: Generate performance report
 * - Compile all performance metrics
 * - Identify optimization opportunities
 * - Provide actionable recommendations
 * - Compare against performance baselines
 */
export function generateComprehensivePerformanceReport(
  scenario: string,
  pageLoadMetrics: PageLoadMetrics,
  aiProcessingMetrics: AIProcessingMetrics,
  memoryMetrics: MemoryMetrics,
  networkMetrics: NetworkMetrics,
  baseline?: PerformanceMetrics
): PerformanceReport {
  // Create performance monitor
  const monitor = new PerformanceMonitor();

  // Record all metrics
  monitor.recordPageLoadMetrics(scenario, pageLoadMetrics);
  monitor.recordAIProcessingMetrics(scenario, aiProcessingMetrics);
  monitor.recordMemoryMetrics(scenario, memoryMetrics);
  monitor.recordNetworkMetrics(scenario, networkMetrics);

  // Set baseline if provided
  if (baseline) {
    monitor.setBaseline(scenario, baseline);
  }

  // Generate report
  return monitor.generateReport(scenario);
}

/**
 * Format performance report as markdown
 */
export function formatPerformanceReportAsMarkdown(
  report: PerformanceReport
): string {
  const lines: string[] = [];

  lines.push('# Comprehensive Performance Report');
  lines.push('');
  lines.push(`**Scenario:** ${report.scenario}`);
  lines.push(`**Session ID:** ${report.sessionId}`);
  lines.push(`**Generated:** ${report.timestamp}`);
  lines.push('');

  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');

  const metrics = report.metrics.measurements;
  const hasIssues = report.optimizationOpportunities.length > 0;

  if (hasIssues) {
    lines.push(
      `⚠️ **${report.optimizationOpportunities.length} optimization opportunities identified.**`
    );
  } else {
    lines.push('✅ **Performance is within acceptable thresholds.**');
  }
  lines.push('');

  // Performance Metrics Overview
  lines.push('## Performance Metrics Overview');
  lines.push('');

  // Page Load Metrics
  if (metrics.pageLoad) {
    lines.push('### Page Load Performance');
    lines.push('');
    lines.push('| Metric | Value | Threshold | Status |');
    lines.push('|--------|-------|-----------|--------|');

    const addPageLoadMetric = (
      name: string,
      value: number,
      threshold: number
    ) => {
      const status =
        value <= threshold
          ? '✅ Good'
          : value <= threshold * 1.5
            ? '⚠️ Fair'
            : '❌ Slow';
      lines.push(
        `| ${name} | ${value.toFixed(0)}ms | ${threshold}ms | ${status} |`
      );
    };

    addPageLoadMetric(
      'Extension Install',
      metrics.pageLoad.extensionInstallTime,
      1000
    );
    addPageLoadMetric(
      'Content Script Injection',
      metrics.pageLoad.contentScriptInjectionTime,
      500
    );
    addPageLoadMetric(
      'Article Processing',
      metrics.pageLoad.articleProcessingDuration,
      3000
    );
    addPageLoadMetric('UI Rendering', metrics.pageLoad.uiRenderingTime, 1000);
    addPageLoadMetric('Total Load Time', metrics.pageLoad.totalLoadTime, 5000);

    lines.push('');
  }

  // AI Processing Metrics
  if (metrics.aiProcessing) {
    lines.push('### AI Processing Performance');
    lines.push('');
    lines.push('| Metric | Value | Threshold | Status |');
    lines.push('|--------|-------|-----------|--------|');

    const addAIMetric = (name: string, value: number, threshold: number) => {
      const status =
        value <= threshold
          ? '✅ Good'
          : value <= threshold * 1.5
            ? '⚠️ Fair'
            : '❌ Slow';
      lines.push(
        `| ${name} | ${value.toFixed(0)}ms | ${threshold}ms | ${status} |`
      );
    };

    addAIMetric(
      'Chrome AI Response',
      metrics.aiProcessing.chromeAIResponseTime,
      2000
    );
    addAIMetric(
      'Offscreen Processing',
      metrics.aiProcessing.offscreenProcessingDuration,
      4000
    );
    addAIMetric(
      'Batch Avg Item',
      metrics.aiProcessing.batchProcessingPerformance.averageItemDuration,
      400
    );

    lines.push('');

    if (metrics.aiProcessing.bottlenecks.length > 0) {
      lines.push('**Processing Bottlenecks:**');
      lines.push('');
      metrics.aiProcessing.bottlenecks.forEach(bottleneck => {
        lines.push(`- ${bottleneck}`);
      });
      lines.push('');
    }
  }

  // Memory Metrics
  if (metrics.memory) {
    lines.push('### Memory and Resource Usage');
    lines.push('');
    lines.push('| Metric | Value | Status |');
    lines.push('|--------|-------|--------|');

    const usedMB = (metrics.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2);
    const limitMB = (metrics.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2);
    const usedPercent = (
      (metrics.memory.usedJSHeapSize / metrics.memory.jsHeapSizeLimit) *
      100
    ).toFixed(1);
    const memoryStatus =
      parseFloat(usedPercent) < 60
        ? '✅ Good'
        : parseFloat(usedPercent) < 80
          ? '⚠️ Fair'
          : '❌ High';

    lines.push(
      `| JS Heap Usage | ${usedMB}MB / ${limitMB}MB (${usedPercent}%) | ${memoryStatus} |`
    );

    const storageMB = (
      metrics.memory.storageQuotaUsage.used /
      (1024 * 1024)
    ).toFixed(2);
    const storagePercent =
      metrics.memory.storageQuotaUsage.percentUsed.toFixed(1);
    const storageStatus =
      metrics.memory.storageQuotaUsage.percentUsed < 60
        ? '✅ Good'
        : metrics.memory.storageQuotaUsage.percentUsed < 80
          ? '⚠️ Fair'
          : '❌ High';

    lines.push(
      `| Storage Usage | ${storageMB}MB (${storagePercent}%) | ${storageStatus} |`
    );

    const hitRatePercent = (metrics.memory.cacheMetrics.hitRate * 100).toFixed(
      1
    );
    const cacheStatus =
      metrics.memory.cacheMetrics.hitRate > 0.6
        ? '✅ Good'
        : metrics.memory.cacheMetrics.hitRate > 0.4
          ? '⚠️ Fair'
          : '❌ Low';

    lines.push(`| Cache Hit Rate | ${hitRatePercent}% | ${cacheStatus} |`);

    lines.push('');

    if (metrics.memory.potentialLeaks.length > 0) {
      lines.push('**⚠️ Potential Memory Leaks:**');
      lines.push('');
      metrics.memory.potentialLeaks.forEach(leak => {
        lines.push(`- ${leak}`);
      });
      lines.push('');
    }
  }

  // Network Metrics
  if (metrics.network) {
    lines.push('### Network Performance');
    lines.push('');
    lines.push('| Metric | Value | Status |');
    lines.push('|--------|-------|--------|');

    const failureRate =
      metrics.network.totalRequests > 0
        ? (
            (metrics.network.failedRequests / metrics.network.totalRequests) *
            100
          ).toFixed(1)
        : '0';
    const failureStatus =
      metrics.network.failedRequests === 0
        ? '✅ Good'
        : metrics.network.failedRequests < 3
          ? '⚠️ Fair'
          : '❌ High';

    lines.push(`| Total Requests | ${metrics.network.totalRequests} | - |`);
    lines.push(
      `| Failed Requests | ${metrics.network.failedRequests} (${failureRate}%) | ${failureStatus} |`
    );
    lines.push(
      `| Slow Requests | ${metrics.network.slowRequests.length} | ${metrics.network.slowRequests.length === 0 ? '✅ Good' : '⚠️ Review'} |`
    );

    const overheadSeconds = (
      metrics.network.totalNetworkOverhead / 1000
    ).toFixed(2);
    const overheadStatus =
      metrics.network.totalNetworkOverhead < 5000
        ? '✅ Good'
        : metrics.network.totalNetworkOverhead < 10000
          ? '⚠️ Fair'
          : '❌ High';

    lines.push(
      `| Total Network Time | ${overheadSeconds}s | ${overheadStatus} |`
    );

    lines.push('');
  }

  // Baseline Comparison
  if (report.baseline && report.comparison) {
    lines.push('## Baseline Comparison');
    lines.push('');

    const hasImprovements =
      Object.keys(report.comparison.improvement).length > 0;
    const hasRegressions = Object.keys(report.comparison.regression).length > 0;

    if (hasImprovements) {
      lines.push('### ✅ Improvements');
      lines.push('');
      Object.entries(report.comparison.improvement).forEach(
        ([metric, percent]) => {
          lines.push(`- **${metric}:** ${percent.toFixed(1)}% faster`);
        }
      );
      lines.push('');
    }

    if (hasRegressions) {
      lines.push('### ⚠️ Regressions');
      lines.push('');
      Object.entries(report.comparison.regression).forEach(
        ([metric, percent]) => {
          lines.push(`- **${metric}:** ${percent.toFixed(1)}% slower`);
        }
      );
      lines.push('');
    }

    if (!hasImprovements && !hasRegressions) {
      lines.push('No significant changes compared to baseline.');
      lines.push('');
    }
  }

  // Optimization Opportunities
  if (report.optimizationOpportunities.length > 0) {
    lines.push('## Optimization Opportunities');
    lines.push('');
    report.optimizationOpportunities.forEach((opportunity, index) => {
      lines.push(`${index + 1}. ${opportunity}`);
    });
    lines.push('');
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push('## Actionable Recommendations');
    lines.push('');

    // Group recommendations by priority
    const highPriority: string[] = [];
    const mediumPriority: string[] = [];
    const lowPriority: string[] = [];

    report.recommendations.forEach(rec => {
      if (
        rec.includes('memory leak') ||
        rec.includes('failed') ||
        rec.includes('critical')
      ) {
        highPriority.push(rec);
      } else if (
        rec.includes('slow') ||
        rec.includes('high') ||
        rec.includes('optimize')
      ) {
        mediumPriority.push(rec);
      } else {
        lowPriority.push(rec);
      }
    });

    if (highPriority.length > 0) {
      lines.push('### 🔴 High Priority');
      lines.push('');
      highPriority.forEach((rec, index) => {
        lines.push(`${index + 1}. ${rec}`);
      });
      lines.push('');
    }

    if (mediumPriority.length > 0) {
      lines.push('### 🟡 Medium Priority');
      lines.push('');
      mediumPriority.forEach((rec, index) => {
        lines.push(`${index + 1}. ${rec}`);
      });
      lines.push('');
    }

    if (lowPriority.length > 0) {
      lines.push('### 🟢 Low Priority');
      lines.push('');
      lowPriority.forEach((rec, index) => {
        lines.push(`${index + 1}. ${rec}`);
      });
      lines.push('');
    }
  }

  // Performance Score
  lines.push('## Performance Score');
  lines.push('');
  const score = calculatePerformanceScore(report.metrics);
  const scoreEmoji = score >= 90 ? '🟢' : score >= 70 ? '🟡' : '🔴';
  lines.push(`${scoreEmoji} **Overall Score: ${score}/100**`);
  lines.push('');
  lines.push(getScoreInterpretation(score));
  lines.push('');

  return lines.join('\n');
}

/**
 * Calculate overall performance score (0-100)
 */
function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100;
  const measurements = metrics.measurements;

  // Page load scoring (30 points)
  if (measurements.pageLoad) {
    const pageLoad = measurements.pageLoad;
    if (pageLoad.totalLoadTime > 7500) score -= 15;
    else if (pageLoad.totalLoadTime > 5000) score -= 8;

    if (pageLoad.contentScriptInjectionTime > 750) score -= 5;
    else if (pageLoad.contentScriptInjectionTime > 500) score -= 2;

    if (pageLoad.articleProcessingDuration > 4500) score -= 7;
    else if (pageLoad.articleProcessingDuration > 3000) score -= 3;

    if (pageLoad.uiRenderingTime > 1500) score -= 3;
    else if (pageLoad.uiRenderingTime > 1000) score -= 1;
  }

  // AI processing scoring (25 points)
  if (measurements.aiProcessing) {
    const ai = measurements.aiProcessing;
    if (ai.chromeAIResponseTime > 3000) score -= 10;
    else if (ai.chromeAIResponseTime > 2000) score -= 5;

    if (ai.offscreenProcessingDuration > 6000) score -= 8;
    else if (ai.offscreenProcessingDuration > 4000) score -= 4;

    if (ai.bottlenecks.length > 2) score -= 7;
    else if (ai.bottlenecks.length > 0) score -= 3;
  }

  // Memory scoring (25 points)
  if (measurements.memory) {
    const memory = measurements.memory;
    const heapUsagePercent =
      (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    if (heapUsagePercent > 80) score -= 10;
    else if (heapUsagePercent > 60) score -= 5;

    if (memory.storageQuotaUsage.percentUsed > 80) score -= 8;
    else if (memory.storageQuotaUsage.percentUsed > 60) score -= 4;

    if (memory.cacheMetrics.hitRate < 0.4) score -= 5;
    else if (memory.cacheMetrics.hitRate < 0.6) score -= 2;

    if (memory.potentialLeaks.length > 0) score -= 2;
  }

  // Network scoring (20 points)
  if (measurements.network) {
    const network = measurements.network;
    if (network.failedRequests > 5) score -= 10;
    else if (network.failedRequests > 0) score -= 5;

    if (network.slowRequests.length > 5) score -= 6;
    else if (network.slowRequests.length > 2) score -= 3;

    if (network.totalNetworkOverhead > 10000) score -= 4;
    else if (network.totalNetworkOverhead > 5000) score -= 2;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get score interpretation
 */
function getScoreInterpretation(score: number): string {
  if (score >= 90) {
    return '**Excellent!** Performance is optimal with minimal issues.';
  } else if (score >= 80) {
    return '**Good.** Performance is acceptable with minor optimization opportunities.';
  } else if (score >= 70) {
    return '**Fair.** Performance is adequate but has room for improvement.';
  } else if (score >= 60) {
    return '**Needs Improvement.** Several performance issues should be addressed.';
  } else {
    return '**Poor.** Significant performance issues require immediate attention.';
  }
}

/**
 * Save performance report to file
 */
export function savePerformanceReport(
  report: PerformanceReport,
  outputDir: string = './debug/reports/performance'
): string {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `performance-report-${report.scenario}-${timestamp}.md`;
  const filepath = path.join(outputDir, filename);

  // Format and save report
  const markdown = formatPerformanceReportAsMarkdown(report);
  fs.writeFileSync(filepath, markdown, 'utf-8');

  // Also save JSON version
  const jsonFilename = `performance-report-${report.scenario}-${timestamp}.json`;
  const jsonFilepath = path.join(outputDir, jsonFilename);
  fs.writeFileSync(jsonFilepath, JSON.stringify(report, null, 2), 'utf-8');

  return filepath;
}

/**
 * Main execution function
 */
export function main(): void {
  console.log('📊 Performance Report Generator\n');

  console.log(
    'This module provides comprehensive performance reporting including:'
  );
  console.log('');
  console.log('✅ Compilation of all performance metrics');
  console.log('✅ Identification of optimization opportunities');
  console.log('✅ Actionable recommendations prioritized by severity');
  console.log('✅ Baseline comparison for tracking improvements');
  console.log('✅ Overall performance score (0-100)');
  console.log('');

  console.log('📋 Report Sections:');
  console.log('   1. Executive Summary');
  console.log('   2. Performance Metrics Overview');
  console.log('   3. Baseline Comparison (if available)');
  console.log('   4. Optimization Opportunities');
  console.log('   5. Actionable Recommendations (prioritized)');
  console.log('   6. Performance Score');
  console.log('');

  console.log('💡 Usage:');
  console.log('   1. Collect metrics from all performance tests');
  console.log('   2. Call generateComprehensivePerformanceReport()');
  console.log('   3. Format with formatPerformanceReportAsMarkdown()');
  console.log('   4. Save with savePerformanceReport()');
  console.log('');

  console.log('✅ Report generator ready!');
}

if (process.argv[1]?.includes('test-performance-report-generator')) {
  main();
}
