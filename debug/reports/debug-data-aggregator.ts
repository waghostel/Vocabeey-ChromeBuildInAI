/**
 * Debug Data Aggregator
 * Aggregates debugging data from multiple sources and sessions
 */

import {
  TestResult,
  DebugReport,
  CapturedDebugData,
  ConsoleMessage,
  NetworkRequest,
  PerformanceMetric,
  ErrorLog,
  StorageOperation,
  MemorySnapshot,
} from '../types/debug-types';

export interface AggregatedData {
  timeRange: {
    start: Date;
    end: Date;
  };
  testResults: {
    total: number;
    passed: number;
    failed: number;
    byCategory: Map<string, { passed: number; failed: number }>;
    byScenario: Map<
      string,
      { executions: number; successRate: number; avgTime: number }
    >;
  };
  performance: {
    executionTimes: {
      min: number;
      max: number;
      average: number;
      median: number;
    };
    memoryUsage: {
      min: number;
      max: number;
      average: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
    errorRate: number;
  };
  issues: {
    recurring: Array<{
      error: string;
      count: number;
      scenarios: string[];
      firstSeen: Date;
      lastSeen: Date;
    }>;
    trends: Array<{
      type: 'performance' | 'reliability' | 'functionality';
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      dataPoints: number;
    }>;
  };
  recommendations: {
    priority: Array<{
      title: string;
      description: string;
      impact: 'low' | 'medium' | 'high' | 'critical';
      effort: 'low' | 'medium' | 'high';
      affectedScenarios: string[];
    }>;
  };
}

export class DebugDataAggregator {
  private reports: DebugReport[] = [];
  private capturedData: CapturedDebugData[] = [];

  /**
   * Add a debug report to the aggregation
   */
  addReport(report: DebugReport): void {
    this.reports.push(report);
    console.log(`Added report ${report.reportId} to aggregation`);
  }

  /**
   * Add captured debug data
   */
  addCapturedData(data: CapturedDebugData): void {
    this.capturedData.push(data);
    console.log(
      `Added captured debug data with ${data.consoleMessages.length} console messages`
    );
  }

  /**
   * Aggregate all data within a time range
   */
  aggregateData(startDate?: Date, endDate?: Date): AggregatedData {
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default: last 24 hours
    const end = endDate || now;

    // Filter reports within time range
    const relevantReports = this.reports.filter(
      report => report.timestamp >= start && report.timestamp <= end
    );

    // Aggregate test results
    const testResults = this.aggregateTestResults(relevantReports);

    // Aggregate performance data
    const performance = this.aggregatePerformanceData(relevantReports);

    // Identify issues and trends
    const issues = this.identifyIssuesAndTrends(relevantReports);

    // Generate prioritized recommendations
    const recommendations = this.generatePrioritizedRecommendations(
      relevantReports,
      issues
    );

    return {
      timeRange: { start, end },
      testResults,
      performance,
      issues,
      recommendations,
    };
  }

  /**
   * Aggregate test results data
   */
  private aggregateTestResults(reports: DebugReport[]) {
    const allResults = reports.flatMap(report => report.testResults);
    const total = allResults.length;
    const passed = allResults.filter(r => r.passed).length;
    const failed = total - passed;

    // Group by category (inferred from scenario names)
    const byCategory = new Map<string, { passed: number; failed: number }>();
    allResults.forEach(result => {
      const category = this.inferCategory(result.scenarioName);
      const current = byCategory.get(category) || { passed: 0, failed: 0 };
      if (result.passed) {
        current.passed++;
      } else {
        current.failed++;
      }
      byCategory.set(category, current);
    });

    // Group by scenario
    const byScenario = new Map<
      string,
      { executions: number; successRate: number; avgTime: number }
    >();
    const scenarioGroups = new Map<string, TestResult[]>();

    allResults.forEach(result => {
      const existing = scenarioGroups.get(result.scenarioName) || [];
      existing.push(result);
      scenarioGroups.set(result.scenarioName, existing);
    });

    scenarioGroups.forEach((results, scenarioName) => {
      const executions = results.length;
      const successes = results.filter(r => r.passed).length;
      const successRate = executions > 0 ? successes / executions : 0;
      const avgTime =
        results.reduce((sum, r) => sum + r.executionTime, 0) / executions;

      byScenario.set(scenarioName, { executions, successRate, avgTime });
    });

    return {
      total,
      passed,
      failed,
      byCategory,
      byScenario,
    };
  }

  /**
   * Aggregate performance data
   */
  private aggregatePerformanceData(reports: DebugReport[]) {
    const allResults = reports.flatMap(report => report.testResults);
    const executionTimes = allResults.map(r => r.executionTime);
    const memoryUsages = allResults
      .map(r => r.metrics?.memoryUsage || 0)
      .filter(usage => usage > 0);

    // Calculate execution time statistics
    const sortedTimes = [...executionTimes].sort((a, b) => a - b);
    const executionTimeStats = {
      min: sortedTimes[0] || 0,
      max: sortedTimes[sortedTimes.length - 1] || 0,
      average:
        executionTimes.reduce((sum, time) => sum + time, 0) /
          executionTimes.length || 0,
      median: sortedTimes[Math.floor(sortedTimes.length / 2)] || 0,
    };

    // Calculate memory usage statistics and trend
    const memoryStats = {
      min: memoryUsages.length > 0 ? Math.min(...memoryUsages) : 0,
      max: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
      average:
        memoryUsages.reduce((sum, usage) => sum + usage, 0) /
          memoryUsages.length || 0,
      trend: this.calculateTrend(memoryUsages) as
        | 'increasing'
        | 'decreasing'
        | 'stable',
    };

    // Calculate error rate
    const errorRate =
      allResults.filter(r => !r.passed).length / allResults.length || 0;

    return {
      executionTimes: executionTimeStats,
      memoryUsage: memoryStats,
      errorRate,
    };
  }

  /**
   * Identify recurring issues and trends
   */
  private identifyIssuesAndTrends(reports: DebugReport[]) {
    const allResults = reports.flatMap(report => report.testResults);
    const errorResults = allResults.filter(r => r.error);

    // Group recurring errors
    const errorGroups = new Map<string, TestResult[]>();
    errorResults.forEach(result => {
      const errorKey = this.normalizeError(result.error!);
      const existing = errorGroups.get(errorKey) || [];
      existing.push(result);
      errorGroups.set(errorKey, existing);
    });

    const recurring = Array.from(errorGroups.entries())
      .filter(([_, results]) => results.length > 1)
      .map(([error, results]) => ({
        error,
        count: results.length,
        scenarios: [...new Set(results.map(r => r.scenarioName))],
        firstSeen: new Date(
          Math.min(...results.map(r => r.timestamp.getTime()))
        ),
        lastSeen: new Date(
          Math.max(...results.map(r => r.timestamp.getTime()))
        ),
      }))
      .sort((a, b) => b.count - a.count);

    // Identify trends
    const trends = this.identifyTrends(reports);

    return {
      recurring,
      trends,
    };
  }

  /**
   * Identify performance and reliability trends
   */
  private identifyTrends(reports: DebugReport[]) {
    const trends: Array<{
      type: 'performance' | 'reliability' | 'functionality';
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      dataPoints: number;
    }> = [];

    // Performance trends
    const performanceMetrics = reports.map(
      r => r.performanceMetrics.averageExecutionTime
    );
    if (performanceMetrics.length >= 3) {
      const trend = this.calculateTrend(performanceMetrics);
      if (trend === 'increasing') {
        trends.push({
          type: 'performance',
          description: 'Average execution time is increasing over time',
          severity:
            performanceMetrics[performanceMetrics.length - 1] > 10000
              ? 'high'
              : 'medium',
          dataPoints: performanceMetrics.length,
        });
      }
    }

    // Reliability trends
    const failureRates = reports.map(r => {
      const failed = r.testResults.filter(tr => !tr.passed).length;
      return failed / r.testResults.length;
    });

    if (failureRates.length >= 3) {
      const trend = this.calculateTrend(failureRates);
      if (trend === 'increasing') {
        trends.push({
          type: 'reliability',
          description: 'Test failure rate is increasing over time',
          severity:
            failureRates[failureRates.length - 1] > 0.3 ? 'critical' : 'high',
          dataPoints: failureRates.length,
        });
      }
    }

    // Memory usage trends
    const memoryUsages = reports.map(
      r => r.performanceMetrics.memoryUsage.peak
    );
    if (memoryUsages.length >= 3) {
      const trend = this.calculateTrend(memoryUsages);
      if (trend === 'increasing') {
        trends.push({
          type: 'performance',
          description: 'Memory usage is consistently increasing',
          severity:
            memoryUsages[memoryUsages.length - 1] > 150 ? 'critical' : 'medium',
          dataPoints: memoryUsages.length,
        });
      }
    }

    return trends;
  }

  /**
   * Generate prioritized recommendations
   */
  private generatePrioritizedRecommendations(
    reports: DebugReport[],
    issues: any
  ) {
    const recommendations: Array<{
      title: string;
      description: string;
      impact: 'low' | 'medium' | 'high' | 'critical';
      effort: 'low' | 'medium' | 'high';
      affectedScenarios: string[];
    }> = [];

    // High-impact recommendations based on recurring issues
    issues.recurring.forEach((issue: any) => {
      if (issue.count >= 3) {
        recommendations.push({
          title: `Fix Recurring Error: ${issue.error}`,
          description: `This error has occurred ${issue.count} times across multiple scenarios`,
          impact: issue.count >= 5 ? 'critical' : 'high',
          effort: 'medium',
          affectedScenarios: issue.scenarios,
        });
      }
    });

    // Performance recommendations
    const avgExecutionTime =
      reports.reduce(
        (sum, r) => sum + r.performanceMetrics.averageExecutionTime,
        0
      ) / reports.length;

    if (avgExecutionTime > 10000) {
      recommendations.push({
        title: 'Optimize Test Execution Performance',
        description: `Average execution time of ${Math.round(avgExecutionTime)}ms is above recommended threshold`,
        impact: 'medium',
        effort: 'high',
        affectedScenarios: reports.flatMap(r =>
          r.testResults.map(tr => tr.scenarioName)
        ),
      });
    }

    // Memory optimization recommendations
    const avgMemoryUsage =
      reports.reduce(
        (sum, r) => sum + r.performanceMetrics.memoryUsage.average,
        0
      ) / reports.length;

    if (avgMemoryUsage > 100) {
      recommendations.push({
        title: 'Optimize Memory Usage',
        description: `Average memory usage of ${Math.round(avgMemoryUsage)}MB exceeds recommended limits`,
        impact: 'high',
        effort: 'medium',
        affectedScenarios: [],
      });
    }

    // Sort by impact and effort (high impact, low effort first)
    const impactScore = { low: 1, medium: 2, high: 3, critical: 4 };
    const effortScore = { low: 1, medium: 2, high: 3 };

    recommendations.sort((a, b) => {
      const aScore = impactScore[a.impact] / effortScore[a.effort];
      const bScore = impactScore[b.impact] / effortScore[b.effort];
      return bScore - aScore;
    });

    return {
      priority: recommendations.slice(0, 10), // Top 10 recommendations
    };
  }

  /**
   * Calculate trend direction for a series of values
   */
  private calculateTrend(
    values: number[]
  ): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const threshold = firstAvg * 0.1; // 10% threshold

    if (secondAvg > firstAvg + threshold) return 'increasing';
    if (secondAvg < firstAvg - threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * Normalize error messages for grouping
   */
  private normalizeError(error: string): string {
    // Remove specific details like timestamps, IDs, etc.
    return error
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '[TIMESTAMP]')
      .replace(/\b\d+ms\b/g, '[TIME]')
      .replace(
        /\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/g,
        '[UUID]'
      )
      .replace(/\b\d+\b/g, '[NUMBER]')
      .toLowerCase()
      .trim();
  }

  /**
   * Infer category from scenario name
   */
  private inferCategory(scenarioName: string): string {
    const name = scenarioName.toLowerCase();
    if (name.includes('loading') || name.includes('initialization'))
      return 'Extension Lifecycle';
    if (name.includes('content') || name.includes('extraction'))
      return 'Content Processing';
    if (name.includes('ai') || name.includes('processing'))
      return 'AI Integration';
    if (name.includes('ui') || name.includes('interface'))
      return 'UI Components';
    if (name.includes('storage') || name.includes('cache'))
      return 'Storage & Caching';
    if (name.includes('performance') || name.includes('memory'))
      return 'Performance';
    return 'Other';
  }

  /**
   * Get summary statistics
   */
  getSummaryStatistics(): {
    totalReports: number;
    totalTestResults: number;
    overallSuccessRate: number;
    averageExecutionTime: number;
    mostCommonErrors: string[];
  } {
    const totalReports = this.reports.length;
    const allResults = this.reports.flatMap(r => r.testResults);
    const totalTestResults = allResults.length;
    const successfulResults = allResults.filter(r => r.passed).length;
    const overallSuccessRate =
      totalTestResults > 0 ? successfulResults / totalTestResults : 0;
    const averageExecutionTime =
      allResults.reduce((sum, r) => sum + r.executionTime, 0) /
        totalTestResults || 0;

    // Find most common errors
    const errorCounts = new Map<string, number>();
    allResults
      .filter(r => r.error)
      .forEach(r => {
        const normalizedError = this.normalizeError(r.error!);
        errorCounts.set(
          normalizedError,
          (errorCounts.get(normalizedError) || 0) + 1
        );
      });

    const mostCommonErrors = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error]) => error);

    return {
      totalReports,
      totalTestResults,
      overallSuccessRate,
      averageExecutionTime,
      mostCommonErrors,
    };
  }

  /**
   * Clear aggregated data
   */
  clear(): void {
    this.reports = [];
    this.capturedData = [];
    console.log('Cleared all aggregated debug data');
  }

  /**
   * Export aggregated data
   */
  exportAggregatedData(): {
    reports: DebugReport[];
    capturedData: CapturedDebugData[];
    summary: any;
  } {
    return {
      reports: [...this.reports],
      capturedData: [...this.capturedData],
      summary: this.getSummaryStatistics(),
    };
  }
}
