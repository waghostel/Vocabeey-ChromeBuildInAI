/**
 * Debug Report Generator
 * Creates structured debugging reports with actionable recommendations
 */

import {
  DebugReport,
  TestResult,
  ValidationSummary,
  PerformanceMetrics,
  Recommendation,
  ReportSummary,
  ReportFormat,
} from '../types/debug-types';

export class DebugReportGenerator {
  private reportCounter = 0;

  /**
   * Generate a comprehensive debug report
   */
  generateReport(
    sessionId: string,
    testResults: TestResult[],
    validationSummary: ValidationSummary,
    additionalData?: {
      performanceMetrics?: PerformanceMetrics;
      customRecommendations?: Recommendation[];
    }
  ): DebugReport {
    const reportId = this.generateReportId();
    const timestamp = new Date();

    // Generate performance metrics if not provided
    const performanceMetrics =
      additionalData?.performanceMetrics ||
      this.generatePerformanceMetrics(testResults);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      testResults,
      validationSummary,
      performanceMetrics,
      additionalData?.customRecommendations
    );

    // Generate summary
    const summary = this.generateReportSummary(
      testResults,
      validationSummary,
      recommendations
    );

    const report: DebugReport = {
      reportId,
      timestamp,
      sessionId,
      testResults,
      validationSummary,
      performanceMetrics,
      recommendations,
      summary,
    };

    console.log(
      `Generated debug report ${reportId} with ${testResults.length} test results`
    );
    return report;
  }

  /**
   * Generate performance metrics from test results
   */
  private generatePerformanceMetrics(
    testResults: TestResult[]
  ): PerformanceMetrics {
    const executionTimes = testResults.map(r => r.executionTime);
    const totalExecutionTime = executionTimes.reduce(
      (sum, time) => sum + time,
      0
    );
    const averageExecutionTime =
      executionTimes.length > 0
        ? totalExecutionTime / executionTimes.length
        : 0;

    // Extract memory usage from test metrics
    const memoryUsages = testResults
      .map(r => r.metrics?.memoryUsage || 0)
      .filter(usage => usage > 0);

    const memoryUsage = {
      peak: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
      average:
        memoryUsages.length > 0
          ? memoryUsages.reduce((sum, usage) => sum + usage, 0) /
            memoryUsages.length
          : 0,
      current:
        memoryUsages.length > 0 ? memoryUsages[memoryUsages.length - 1] : 0,
    };

    // Extract resource utilization
    const cpuUsages = testResults
      .map(r => r.metrics?.cpuUsage || 0)
      .filter(usage => usage > 0);

    const resourceUtilization = {
      cpu:
        cpuUsages.length > 0
          ? cpuUsages.reduce((sum, usage) => sum + usage, 0) / cpuUsages.length
          : 0,
      memory: memoryUsage.average,
      network: 0, // Could be calculated from network request metrics
    };

    return {
      totalExecutionTime,
      averageExecutionTime,
      memoryUsage,
      resourceUtilization,
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    testResults: TestResult[],
    validationSummary: ValidationSummary,
    performanceMetrics: PerformanceMetrics,
    customRecommendations?: Recommendation[]
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Add custom recommendations first
    if (customRecommendations) {
      recommendations.push(...customRecommendations);
    }

    // Performance recommendations
    if (performanceMetrics.averageExecutionTime > 10000) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        title: 'High Average Execution Time',
        description: `Average test execution time is ${Math.round(performanceMetrics.averageExecutionTime)}ms, which may indicate performance issues.`,
        actionItems: [
          'Review test scenarios for unnecessary delays',
          'Optimize extension code for better performance',
          'Consider increasing timeout values for complex operations',
        ],
        relatedScenarios: testResults
          .filter(r => r.executionTime > 10000)
          .map(r => r.scenarioName),
      });
    }

    if (performanceMetrics.memoryUsage.peak > 100) {
      recommendations.push({
        type: 'performance',
        severity: 'high',
        title: 'High Memory Usage',
        description: `Peak memory usage of ${Math.round(performanceMetrics.memoryUsage.peak)}MB exceeds recommended limits.`,
        actionItems: [
          'Investigate memory leaks in extension code',
          'Optimize data structures and caching strategies',
          'Implement memory cleanup in extension lifecycle',
        ],
        relatedScenarios: testResults
          .filter(r => (r.metrics?.memoryUsage || 0) > 100)
          .map(r => r.scenarioName),
      });
    }

    // Reliability recommendations
    const failedTests = testResults.filter(r => !r.passed);
    if (failedTests.length > 0) {
      const failureRate = failedTests.length / testResults.length;
      const severity =
        failureRate > 0.5 ? 'critical' : failureRate > 0.2 ? 'high' : 'medium';

      recommendations.push({
        type: 'reliability',
        severity,
        title: 'Test Failures Detected',
        description: `${failedTests.length} out of ${testResults.length} tests failed (${Math.round(failureRate * 100)}% failure rate).`,
        actionItems: [
          'Investigate root causes of test failures',
          'Review error messages and stack traces',
          'Improve error handling in extension code',
          'Consider adding retry mechanisms for flaky operations',
        ],
        relatedScenarios: failedTests.map(r => r.scenarioName),
      });
    }

    // Functionality recommendations
    if (validationSummary.overallViolations.length > 0) {
      recommendations.push({
        type: 'functionality',
        severity: 'medium',
        title: 'Validation Violations',
        description: `${validationSummary.overallViolations.length} validation violations detected.`,
        actionItems: [
          'Review validation criteria and ensure they are appropriate',
          'Fix issues causing validation violations',
          'Update test scenarios to better reflect expected behavior',
        ],
        relatedScenarios: validationSummary.overallViolations
          .map(v => v.split(':')[0])
          .filter((v, i, arr) => arr.indexOf(v) === i), // Remove duplicates
      });
    }

    // Security recommendations (basic checks)
    const securityIssues = testResults.filter(
      r =>
        r.error?.toLowerCase().includes('security') ||
        r.error?.toLowerCase().includes('permission') ||
        r.error?.toLowerCase().includes('cors')
    );

    if (securityIssues.length > 0) {
      recommendations.push({
        type: 'security',
        severity: 'high',
        title: 'Security-Related Issues',
        description: `${securityIssues.length} tests encountered security-related errors.`,
        actionItems: [
          'Review extension permissions and manifest configuration',
          'Ensure proper handling of cross-origin requests',
          'Validate content security policy settings',
        ],
        relatedScenarios: securityIssues.map(r => r.scenarioName),
      });
    }

    return recommendations;
  }

  /**
   * Generate report summary
   */
  private generateReportSummary(
    testResults: TestResult[],
    validationSummary: ValidationSummary,
    recommendations: Recommendation[]
  ): ReportSummary {
    const passedTests = testResults.filter(r => r.passed).length;
    const failedTests = testResults.length - passedTests;
    const criticalRecommendations = recommendations.filter(
      r => r.severity === 'critical'
    ).length;
    const totalExecutionTime = testResults.reduce(
      (sum, r) => sum + r.executionTime,
      0
    );

    let overallStatus: 'passed' | 'failed' | 'warning';
    if (criticalRecommendations > 0 || failedTests > testResults.length * 0.5) {
      overallStatus = 'failed';
    } else if (failedTests > 0 || recommendations.length > 0) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'passed';
    }

    return {
      overallStatus,
      criticalIssues: criticalRecommendations,
      totalRecommendations: recommendations.length,
      executionDuration: totalExecutionTime,
      scenariosExecuted: testResults.length,
    };
  }

  /**
   * Export report in different formats
   */
  exportReport(report: DebugReport, format: ReportFormat): string {
    switch (format) {
      case 'json':
        return this.exportAsJSON(report);
      case 'html':
        return this.exportAsHTML(report);
      case 'markdown':
        return this.exportAsMarkdown(report);
      case 'csv':
        return this.exportAsCSV(report);
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  /**
   * Export report as JSON
   */
  private exportAsJSON(report: DebugReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as HTML
   */
  private exportAsHTML(report: DebugReport): string {
    const statusColor = {
      passed: '#28a745',
      warning: '#ffc107',
      failed: '#dc3545',
    }[report.summary.overallStatus];

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Debug Report ${report.reportId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 5px; }
        .status { color: ${statusColor}; font-weight: bold; }
        .section { margin: 20px 0; }
        .test-result { margin: 10px 0; padding: 10px; border-left: 3px solid #ddd; }
        .test-passed { border-left-color: #28a745; }
        .test-failed { border-left-color: #dc3545; }
        .recommendation { margin: 10px 0; padding: 15px; border-radius: 5px; }
        .rec-critical { background: #f8d7da; }
        .rec-high { background: #fff3cd; }
        .rec-medium { background: #d1ecf1; }
        .rec-low { background: #d4edda; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Debug Report ${report.reportId}</h1>
        <p><strong>Generated:</strong> ${report.timestamp.toISOString()}</p>
        <p><strong>Session ID:</strong> ${report.sessionId}</p>
        <p><strong>Status:</strong> <span class="status">${report.summary.overallStatus.toUpperCase()}</span></p>
    </div>

    <div class="section">
        <h2>Summary</h2>
        <ul>
            <li>Scenarios Executed: ${report.summary.scenariosExecuted}</li>
            <li>Total Execution Time: ${Math.round(report.summary.executionDuration / 1000)}s</li>
            <li>Critical Issues: ${report.summary.criticalIssues}</li>
            <li>Total Recommendations: ${report.summary.totalRecommendations}</li>
        </ul>
    </div>

    <div class="section">
        <h2>Test Results</h2>
        ${report.testResults
          .map(
            result => `
            <div class="test-result ${result.passed ? 'test-passed' : 'test-failed'}">
                <h4>${result.scenarioName} ${result.passed ? '✓' : '✗'}</h4>
                <p>Execution Time: ${result.executionTime}ms</p>
                ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
            </div>
        `
          )
          .join('')}
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        ${report.recommendations
          .map(
            rec => `
            <div class="recommendation rec-${rec.severity}">
                <h4>${rec.title} (${rec.severity.toUpperCase()})</h4>
                <p>${rec.description}</p>
                <ul>
                    ${rec.actionItems.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `
          )
          .join('')}
    </div>

    <div class="section">
        <h2>Performance Metrics</h2>
        <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Average Execution Time</td><td>${Math.round(report.performanceMetrics.averageExecutionTime)}ms</td></tr>
            <tr><td>Peak Memory Usage</td><td>${Math.round(report.performanceMetrics.memoryUsage.peak)}MB</td></tr>
            <tr><td>Average CPU Usage</td><td>${Math.round(report.performanceMetrics.resourceUtilization.cpu)}%</td></tr>
        </table>
    </div>
</body>
</html>`;
  }

  /**
   * Export report as Markdown
   */
  private exportAsMarkdown(report: DebugReport): string {
    const statusEmoji = {
      passed: '✅',
      warning: '⚠️',
      failed: '❌',
    }[report.summary.overallStatus];

    return `# Debug Report ${report.reportId}

**Generated:** ${report.timestamp.toISOString()}  
**Session ID:** ${report.sessionId}  
**Status:** ${statusEmoji} ${report.summary.overallStatus.toUpperCase()}

## Summary

- **Scenarios Executed:** ${report.summary.scenariosExecuted}
- **Total Execution Time:** ${Math.round(report.summary.executionDuration / 1000)}s
- **Critical Issues:** ${report.summary.criticalIssues}
- **Total Recommendations:** ${report.summary.totalRecommendations}

## Test Results

${report.testResults
  .map(
    result => `
### ${result.scenarioName} ${result.passed ? '✅' : '❌'}

- **Execution Time:** ${result.executionTime}ms
- **Timestamp:** ${result.timestamp.toISOString()}
${result.error ? `- **Error:** ${result.error}` : ''}
`
  )
  .join('')}

## Recommendations

${report.recommendations
  .map(
    rec => `
### ${rec.title} (${rec.severity.toUpperCase()})

${rec.description}

**Action Items:**
${rec.actionItems.map(item => `- ${item}`).join('\n')}

**Related Scenarios:** ${rec.relatedScenarios.join(', ')}
`
  )
  .join('')}

## Performance Metrics

| Metric | Value |
|--------|-------|
| Average Execution Time | ${Math.round(report.performanceMetrics.averageExecutionTime)}ms |
| Peak Memory Usage | ${Math.round(report.performanceMetrics.memoryUsage.peak)}MB |
| Average CPU Usage | ${Math.round(report.performanceMetrics.resourceUtilization.cpu)}% |

## Validation Summary

- **Total Tests:** ${report.validationSummary.totalTests}
- **Passed Tests:** ${report.validationSummary.passedTests}
- **Valid Tests:** ${report.validationSummary.validTests}
- **Average Score:** ${Math.round(report.validationSummary.averageScore * 100)}%
`;
  }

  /**
   * Export report as CSV
   */
  private exportAsCSV(report: DebugReport): string {
    const headers = [
      'Scenario Name',
      'Passed',
      'Execution Time (ms)',
      'Timestamp',
      'Error',
    ];

    const rows = report.testResults.map(result => [
      result.scenarioName,
      result.passed ? 'Yes' : 'No',
      result.executionTime.toString(),
      result.timestamp.toISOString(),
      result.error || '',
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `debug-report-${timestamp}-${++this.reportCounter}`;
  }

  /**
   * Save report to file (would be implemented based on environment)
   */
  async saveReport(
    report: DebugReport,
    format: ReportFormat,
    filePath?: string
  ): Promise<string> {
    const content = this.exportReport(report, format);
    const fileName = filePath || `${report.reportId}.${format}`;

    // In a real implementation, this would save to filesystem
    console.log(`Report saved as ${fileName} (${content.length} characters)`);

    return fileName;
  }
}
