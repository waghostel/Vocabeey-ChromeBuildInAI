/**
 * Real Debug Report Generator
 * Creates structured debugging reports with real MCP data and actionable recommendations
 */

import { RealTestResult } from '../scenarios/real-test-scenario-executor';
import { MCPConnectionManager } from '../utils/mcp-connection-manager';

export interface RealDebugReport {
  reportId: string;
  timestamp: Date;
  sessionId: string;
  mcpConnectionStatus: {
    connected: boolean;
    healthy: boolean;
    latency: number;
    availableFunctions: number;
    errors: string[];
  };
  realTestResults: RealTestResult[];
  realPerformanceMetrics: RealPerformanceMetrics;
  realRecommendations: RealRecommendation[];
  realSummary: RealReportSummary;
  realInsights: RealDebugInsights;
}

export interface RealPerformanceMetrics {
  totalExecutionTime: number;
  averageExecutionTime: number;
  mcpCallStatistics: {
    totalCalls: number;
    averageCallTime: number;
    functionUsage: Map<string, { calls: number; avgTime: number }>;
  };
  realMemoryUsage: {
    peak: number;
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  realResourceUtilization: {
    extensionContexts: number;
    activePages: number;
    networkRequests: number;
  };
}

export interface RealRecommendation {
  type: 'performance' | 'functionality' | 'reliability' | 'mcp-integration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  realDataEvidence: any;
  actionItems: string[];
  relatedScenarios: string[];
  mcpFunctionImpact?: string[];
}

export interface RealReportSummary {
  overallStatus: 'passed' | 'failed' | 'warning';
  criticalIssues: number;
  totalRecommendations: number;
  executionDuration: number;
  scenariosExecuted: number;
  mcpIntegrationHealth: 'excellent' | 'good' | 'poor' | 'failed';
  realDataQuality: 'high' | 'medium' | 'low';
}

export interface RealDebugInsights {
  extensionHealthScore: number;
  mcpIntegrationScore: number;
  performanceScore: number;
  reliabilityScore: number;
  keyFindings: string[];
  trendAnalysis: {
    performance: 'improving' | 'stable' | 'degrading';
    reliability: 'improving' | 'stable' | 'degrading';
    mcpStability: 'improving' | 'stable' | 'degrading';
  };
}

export class RealDebugReportGenerator {
  private mcpConnectionManager: MCPConnectionManager;
  private reportCounter = 0;

  constructor(mcpConnectionManager: MCPConnectionManager) {
    this.mcpConnectionManager = mcpConnectionManager;
  }

  /**
   * Generate comprehensive real debug report with MCP data
   */
  generateRealReport(
    sessionId: string,
    realTestResults: RealTestResult[]
  ): RealDebugReport {
    const reportId = this.generateReportId();
    const timestamp = new Date();

    console.log(
      `Generating real debug report ${reportId} with ${realTestResults.length} test results...`
    );

    // Get MCP connection status
    const mcpConnectionStatus = this.getMCPConnectionStatus();

    // Generate real performance metrics from actual test data
    const realPerformanceMetrics =
      this.generateRealPerformanceMetrics(realTestResults);

    // Generate real recommendations based on actual data
    const realRecommendations = this.generateRealRecommendations(
      realTestResults,
      mcpConnectionStatus,
      realPerformanceMetrics
    );

    // Generate real insights from debugging data
    const realInsights = this.generateRealDebugInsights(
      realTestResults,
      mcpConnectionStatus,
      realPerformanceMetrics
    );

    // Generate summary
    const realSummary = this.generateRealReportSummary(
      realTestResults,
      mcpConnectionStatus,
      realRecommendations,
      realInsights
    );

    const report: RealDebugReport = {
      reportId,
      timestamp,
      sessionId,
      mcpConnectionStatus,
      realTestResults,
      realPerformanceMetrics,
      realRecommendations,
      realSummary,
      realInsights,
    };

    console.log(`✅ Generated real debug report ${reportId}`);
    console.log(
      `📊 Summary: ${realSummary.scenariosExecuted} scenarios, ${realSummary.overallStatus} status`
    );
    console.log(`🔧 MCP Integration: ${realSummary.mcpIntegrationHealth}`);
    console.log(`💡 Recommendations: ${realRecommendations.length} generated`);

    return report;
  } /**
 
  * Get current MCP connection status
   */
  private getMCPConnectionStatus() {
    const connectionStatus = this.mcpConnectionManager.getConnectionStatus();
    const isHealthy = this.mcpConnectionManager.isConnectionHealthy();

    return {
      connected: connectionStatus.isConnected,
      healthy: isHealthy,
      latency: connectionStatus.connectionLatency,
      availableFunctions: connectionStatus.availableFunctions.length,
      errors: connectionStatus.connectionErrors,
    };
  }

  /**
   * Generate real performance metrics from actual test execution data
   */
  private generateRealPerformanceMetrics(
    realTestResults: RealTestResult[]
  ): RealPerformanceMetrics {
    const executionTimes = realTestResults.map(r => r.executionTime);
    const totalExecutionTime = executionTimes.reduce(
      (sum, time) => sum + time,
      0
    );
    const averageExecutionTime =
      executionTimes.length > 0
        ? totalExecutionTime / executionTimes.length
        : 0;

    // Analyze MCP call statistics from real test data
    const allMCPCalls = realTestResults.flatMap(r => r.mcpFunctionCalls);
    const totalMCPCalls = allMCPCalls.length;
    const averageMCPCallTime =
      totalMCPCalls > 0
        ? allMCPCalls.reduce((sum, call) => sum + call.executionTime, 0) /
          totalMCPCalls
        : 0;

    // Function usage statistics
    const functionUsage = new Map<string, { calls: number; avgTime: number }>();
    allMCPCalls.forEach(call => {
      const existing = functionUsage.get(call.functionName) || {
        calls: 0,
        avgTime: 0,
      };
      existing.calls++;
      existing.avgTime =
        (existing.avgTime * (existing.calls - 1) + call.executionTime) /
        existing.calls;
      functionUsage.set(call.functionName, existing);
    });

    // Extract real memory usage from test results
    const memoryUsages = realTestResults
      .map(r => r.realData?.memoryStatus?.usedJSHeapSize || 0)
      .filter(usage => usage > 0)
      .map(usage => usage / 1024 / 1024); // Convert to MB

    const realMemoryUsage = {
      peak: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
      average:
        memoryUsages.length > 0
          ? memoryUsages.reduce((sum, usage) => sum + usage, 0) /
            memoryUsages.length
          : 0,
      trend: this.calculateTrend(memoryUsages) as
        | 'increasing'
        | 'decreasing'
        | 'stable',
    };

    // Extract real resource utilization
    const extensionContexts = new Set(
      realTestResults.flatMap(
        r => r.realData?.pages?.map((p: any) => p.type) || []
      )
    ).size;

    const activePages = realTestResults.reduce(
      (max, r) => Math.max(max, r.realData?.pages?.length || 0),
      0
    );

    const networkRequests = realTestResults.reduce(
      (sum, r) => sum + (r.realData?.networkRequests?.length || 0),
      0
    );

    return {
      totalExecutionTime,
      averageExecutionTime,
      mcpCallStatistics: {
        totalCalls: totalMCPCalls,
        averageCallTime: averageMCPCallTime,
        functionUsage,
      },
      realMemoryUsage,
      realResourceUtilization: {
        extensionContexts,
        activePages,
        networkRequests,
      },
    };
  }

  /**
   * Generate real recommendations based on actual debugging data
   */
  private generateRealRecommendations(
    realTestResults: RealTestResult[],
    mcpConnectionStatus: any,
    performanceMetrics: RealPerformanceMetrics
  ): RealRecommendation[] {
    const recommendations: RealRecommendation[] = [];

    // MCP Integration Recommendations
    if (!mcpConnectionStatus.connected) {
      recommendations.push({
        type: 'mcp-integration',
        severity: 'critical',
        title: 'MCP Connection Failed',
        description: 'Chrome DevTools MCP server connection is not established',
        realDataEvidence: {
          connectionStatus: mcpConnectionStatus,
          affectedTests: realTestResults.filter(r => !r.passed).length,
        },
        actionItems: [
          'Install and start chrome-devtools MCP server: uvx mcp-chrome-devtools@latest',
          'Verify MCP server configuration in mcp-config.json',
          'Check network connectivity and firewall settings',
          'Review MCP server logs for connection errors',
        ],
        relatedScenarios: realTestResults.map(r => r.scenarioName),
        mcpFunctionImpact: ['All MCP functions unavailable'],
      });
    } else if (!mcpConnectionStatus.healthy) {
      recommendations.push({
        type: 'mcp-integration',
        severity: 'high',
        title: 'MCP Connection Unstable',
        description: `MCP connection has ${mcpConnectionStatus.errors.length} errors and ${mcpConnectionStatus.latency}ms latency`,
        realDataEvidence: {
          connectionLatency: mcpConnectionStatus.latency,
          connectionErrors: mcpConnectionStatus.errors,
          availableFunctions: mcpConnectionStatus.availableFunctions,
        },
        actionItems: [
          'Restart chrome-devtools MCP server',
          'Check system resources and network stability',
          'Implement connection retry logic with exponential backoff',
          'Monitor MCP server performance and logs',
        ],
        relatedScenarios: realTestResults
          .filter(r => !r.passed)
          .map(r => r.scenarioName),
        mcpFunctionImpact: ['Connection reliability issues'],
      });
    }

    // Performance Recommendations based on real data
    if (performanceMetrics.averageExecutionTime > 30000) {
      const slowTests = realTestResults.filter(r => r.executionTime > 30000);
      recommendations.push({
        type: 'performance',
        severity:
          performanceMetrics.averageExecutionTime > 60000 ? 'critical' : 'high',
        title: 'Slow Test Execution Detected',
        description: `Average test execution time is ${Math.round(performanceMetrics.averageExecutionTime / 1000)}s, with ${slowTests.length} tests exceeding 30s`,
        realDataEvidence: {
          averageExecutionTime: performanceMetrics.averageExecutionTime,
          slowTests: slowTests.map(t => ({
            name: t.scenarioName,
            time: t.executionTime,
          })),
          mcpCallOverhead: performanceMetrics.mcpCallStatistics.averageCallTime,
        },
        actionItems: [
          'Profile slow test scenarios to identify bottlenecks',
          'Optimize MCP function calls and reduce unnecessary calls',
          'Implement parallel execution where possible',
          'Add timeout handling for long-running operations',
          'Consider breaking down complex scenarios',
        ],
        relatedScenarios: slowTests.map(r => r.scenarioName),
        mcpFunctionImpact: Array.from(
          performanceMetrics.mcpCallStatistics.functionUsage.entries()
        )
          .filter(([_, stats]) => stats.avgTime > 5000)
          .map(([func, _]) => func),
      });
    }

    // Memory Usage Recommendations
    if (performanceMetrics.realMemoryUsage.peak > 200) {
      const highMemoryTests = realTestResults.filter(
        r => (r.realData?.memoryStatus?.usedJSHeapSize || 0) / 1024 / 1024 > 200
      );

      recommendations.push({
        type: 'performance',
        severity:
          performanceMetrics.realMemoryUsage.peak > 500 ? 'critical' : 'high',
        title: 'High Memory Usage Detected',
        description: `Peak memory usage reached ${Math.round(performanceMetrics.realMemoryUsage.peak)}MB with ${performanceMetrics.realMemoryUsage.trend} trend`,
        realDataEvidence: {
          peakMemory: performanceMetrics.realMemoryUsage.peak,
          averageMemory: performanceMetrics.realMemoryUsage.average,
          memoryTrend: performanceMetrics.realMemoryUsage.trend,
          highMemoryTests: highMemoryTests.map(t => t.scenarioName),
        },
        actionItems: [
          'Use Chrome DevTools Memory tab to identify memory leaks',
          'Review extension cleanup procedures and event listener disposal',
          'Optimize data structures and implement proper caching strategies',
          'Monitor memory usage in production extension',
          'Implement memory pressure handling',
        ],
        relatedScenarios: highMemoryTests.map(r => r.scenarioName),
      });
    }

    // Test Reliability Recommendations
    const failedTests = realTestResults.filter(r => !r.passed);
    const validationFailures = realTestResults.filter(
      r => !r.validationResults.passed
    );

    if (failedTests.length > 0) {
      const failureRate = failedTests.length / realTestResults.length;
      recommendations.push({
        type: 'reliability',
        severity:
          failureRate > 0.5
            ? 'critical'
            : failureRate > 0.2
              ? 'high'
              : 'medium',
        title: 'Test Failures Detected',
        description: `${failedTests.length}/${realTestResults.length} tests failed (${Math.round(failureRate * 100)}% failure rate)`,
        realDataEvidence: {
          failedTests: failedTests.map(t => ({
            name: t.scenarioName,
            error: t.error,
            mcpCalls: t.mcpFunctionCalls.length,
          })),
          failureRate,
          commonErrors: this.extractCommonErrors(failedTests),
        },
        actionItems: [
          'Investigate root causes of test failures',
          'Improve error handling and recovery mechanisms',
          'Stabilize extension initialization and state management',
          'Add retry logic for flaky operations',
          'Review test scenario assumptions and expectations',
        ],
        relatedScenarios: failedTests.map(r => r.scenarioName),
      });
    }

    if (validationFailures.length > 0) {
      recommendations.push({
        type: 'functionality',
        severity:
          validationFailures.length > realTestResults.length * 0.3
            ? 'high'
            : 'medium',
        title: 'Validation Failures Detected',
        description: `${validationFailures.length} tests passed execution but failed validation`,
        realDataEvidence: {
          validationFailures: validationFailures.map(t => ({
            name: t.scenarioName,
            validationDetails: t.validationResults.details,
          })),
        },
        actionItems: [
          'Review validation criteria to ensure they match expected behavior',
          'Fix functionality issues causing validation failures',
          'Update test scenarios to better reflect actual extension behavior',
          'Improve real data capture and validation logic',
        ],
        relatedScenarios: validationFailures.map(r => r.scenarioName),
      });
    }

    // MCP Function Usage Recommendations
    const inefficientFunctions = Array.from(
      performanceMetrics.mcpCallStatistics.functionUsage.entries()
    )
      .filter(([_, stats]) => stats.avgTime > 3000)
      .sort((a, b) => b[1].avgTime - a[1].avgTime);

    if (inefficientFunctions.length > 0) {
      recommendations.push({
        type: 'mcp-integration',
        severity: 'medium',
        title: 'Optimize MCP Function Usage',
        description: `${inefficientFunctions.length} MCP functions have high average execution times`,
        realDataEvidence: {
          inefficientFunctions: inefficientFunctions.map(([func, stats]) => ({
            function: func,
            averageTime: stats.avgTime,
            callCount: stats.calls,
          })),
        },
        actionItems: [
          'Optimize usage of slow MCP functions',
          'Implement caching for frequently called functions',
          'Batch MCP calls where possible',
          'Add timeout handling for slow MCP operations',
          'Consider alternative approaches for slow operations',
        ],
        relatedScenarios: [],
        mcpFunctionImpact: inefficientFunctions.map(([func, _]) => func),
      });
    }

    return recommendations.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  } /**

   * Generate real debug insights from actual debugging data
   */
  private generateRealDebugInsights(
    realTestResults: RealTestResult[],
    mcpConnectionStatus: any,
    performanceMetrics: RealPerformanceMetrics
  ): RealDebugInsights {
    // Calculate extension health score based on real data
    const passedTests = realTestResults.filter(r => r.passed).length;
    const validatedTests = realTestResults.filter(
      r => r.validationResults.passed
    ).length;
    const testSuccessRate =
      realTestResults.length > 0 ? passedTests / realTestResults.length : 0;
    const validationSuccessRate =
      realTestResults.length > 0 ? validatedTests / realTestResults.length : 0;

    const extensionHealthScore = Math.round(
      (testSuccessRate * 0.6 + validationSuccessRate * 0.4) * 100
    );

    // Calculate MCP integration score
    let mcpIntegrationScore = 0;
    if (mcpConnectionStatus.connected) {
      mcpIntegrationScore += 40;
      if (mcpConnectionStatus.healthy) mcpIntegrationScore += 30;
      if (mcpConnectionStatus.latency < 1000) mcpIntegrationScore += 20;
      if (mcpConnectionStatus.errors.length === 0) mcpIntegrationScore += 10;
    }

    // Calculate performance score
    let performanceScore = 100;
    if (performanceMetrics.averageExecutionTime > 30000) performanceScore -= 30;
    if (performanceMetrics.averageExecutionTime > 60000) performanceScore -= 30;
    if (performanceMetrics.realMemoryUsage.peak > 200) performanceScore -= 20;
    if (performanceMetrics.realMemoryUsage.peak > 500) performanceScore -= 20;
    performanceScore = Math.max(0, performanceScore);

    // Calculate reliability score
    const errorRate =
      realTestResults.filter(r => !r.passed).length / realTestResults.length;
    const reliabilityScore = Math.round((1 - errorRate) * 100);

    // Generate key findings
    const keyFindings: string[] = [];

    if (extensionHealthScore >= 90) {
      keyFindings.push(
        'Extension is functioning excellently with high test success rates'
      );
    } else if (extensionHealthScore >= 70) {
      keyFindings.push(
        'Extension is functioning well with some areas for improvement'
      );
    } else {
      keyFindings.push(
        'Extension has significant functionality issues requiring attention'
      );
    }

    if (mcpIntegrationScore >= 80) {
      keyFindings.push(
        'MCP integration is working well with stable connection'
      );
    } else if (mcpIntegrationScore >= 50) {
      keyFindings.push('MCP integration has some stability issues');
    } else {
      keyFindings.push('MCP integration requires immediate attention');
    }

    if (performanceMetrics.realMemoryUsage.trend === 'increasing') {
      keyFindings.push(
        'Memory usage is increasing - potential memory leak detected'
      );
    }

    if (performanceMetrics.mcpCallStatistics.totalCalls > 0) {
      const avgMCPTime = performanceMetrics.mcpCallStatistics.averageCallTime;
      if (avgMCPTime > 2000) {
        keyFindings.push(
          `MCP calls are slow (avg ${Math.round(avgMCPTime)}ms) - optimization needed`
        );
      } else {
        keyFindings.push(
          `MCP calls are performing well (avg ${Math.round(avgMCPTime)}ms)`
        );
      }
    }

    // Analyze trends (simplified - would need historical data for real trend analysis)
    const trendAnalysis = {
      performance: 'stable' as 'improving' | 'stable' | 'degrading',
      reliability:
        testSuccessRate >= 0.8 ? ('stable' as const) : ('degrading' as const),
      mcpStability: mcpConnectionStatus.healthy
        ? ('stable' as const)
        : ('degrading' as const),
    };

    return {
      extensionHealthScore,
      mcpIntegrationScore,
      performanceScore,
      reliabilityScore,
      keyFindings,
      trendAnalysis,
    };
  }

  /**
   * Generate real report summary
   */
  private generateRealReportSummary(
    realTestResults: RealTestResult[],
    mcpConnectionStatus: any,
    recommendations: RealRecommendation[],
    insights: RealDebugInsights
  ): RealReportSummary {
    const passedTests = realTestResults.filter(r => r.passed).length;
    const failedTests = realTestResults.length - passedTests;
    const criticalRecommendations = recommendations.filter(
      r => r.severity === 'critical'
    ).length;
    const totalExecutionTime = realTestResults.reduce(
      (sum, r) => sum + r.executionTime,
      0
    );

    // Determine overall status
    let overallStatus: 'passed' | 'failed' | 'warning';
    if (
      criticalRecommendations > 0 ||
      failedTests > realTestResults.length * 0.5
    ) {
      overallStatus = 'failed';
    } else if (failedTests > 0 || recommendations.length > 0) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'passed';
    }

    // Determine MCP integration health
    let mcpIntegrationHealth: 'excellent' | 'good' | 'poor' | 'failed';
    if (!mcpConnectionStatus.connected) {
      mcpIntegrationHealth = 'failed';
    } else if (
      mcpConnectionStatus.healthy &&
      mcpConnectionStatus.errors.length === 0
    ) {
      mcpIntegrationHealth = 'excellent';
    } else if (mcpConnectionStatus.healthy) {
      mcpIntegrationHealth = 'good';
    } else {
      mcpIntegrationHealth = 'poor';
    }

    // Determine real data quality
    const hasRealData = realTestResults.some(
      r => r.realData && Object.keys(r.realData).length > 0
    );
    const mcpCallsPresent = realTestResults.some(
      r => r.mcpFunctionCalls.length > 0
    );

    let realDataQuality: 'high' | 'medium' | 'low';
    if (hasRealData && mcpCallsPresent && mcpConnectionStatus.connected) {
      realDataQuality = 'high';
    } else if (hasRealData || mcpCallsPresent) {
      realDataQuality = 'medium';
    } else {
      realDataQuality = 'low';
    }

    return {
      overallStatus,
      criticalIssues: criticalRecommendations,
      totalRecommendations: recommendations.length,
      executionDuration: totalExecutionTime,
      scenariosExecuted: realTestResults.length,
      mcpIntegrationHealth,
      realDataQuality,
    };
  }

  /**
   * Extract common error patterns from failed tests
   */
  private extractCommonErrors(
    failedTests: RealTestResult[]
  ): Array<{ error: string; count: number }> {
    const errorCounts = new Map<string, number>();

    failedTests.forEach(test => {
      if (test.error) {
        const normalizedError = this.normalizeError(test.error);
        errorCounts.set(
          normalizedError,
          (errorCounts.get(normalizedError) || 0) + 1
        );
      }
    });

    return Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
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
   * Normalize error messages for pattern matching
   */
  private normalizeError(error: string): string {
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
   * Generate unique report ID
   */
  private generateReportId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `real-debug-report-${timestamp}-${++this.reportCounter}`;
  }

  /**
   * Export real report in different formats
   */
  exportRealReport(
    report: RealDebugReport,
    format: 'json' | 'html' | 'markdown'
  ): string {
    switch (format) {
      case 'json':
        return this.exportAsJSON(report);
      case 'html':
        return this.exportAsHTML(report);
      case 'markdown':
        return this.exportAsMarkdown(report);
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }

  /**
   * Export report as JSON
   */
  private exportAsJSON(report: RealDebugReport): string {
    // Convert Map objects to plain objects for JSON serialization
    const serializable = {
      ...report,
      realPerformanceMetrics: {
        ...report.realPerformanceMetrics,
        mcpCallStatistics: {
          ...report.realPerformanceMetrics.mcpCallStatistics,
          functionUsage: Object.fromEntries(
            report.realPerformanceMetrics.mcpCallStatistics.functionUsage
          ),
        },
      },
    };
    return JSON.stringify(serializable, null, 2);
  }

  /**
   * Export report as HTML
   */
  private exportAsHTML(report: RealDebugReport): string {
    const statusColor = {
      passed: '#28a745',
      warning: '#ffc107',
      failed: '#dc3545',
    }[report.realSummary.overallStatus];

    const mcpHealthColor = {
      excellent: '#28a745',
      good: '#17a2b8',
      poor: '#ffc107',
      failed: '#dc3545',
    }[report.realSummary.mcpIntegrationHealth];

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Real Debug Report ${report.reportId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .status { color: ${statusColor}; font-weight: bold; font-size: 1.2em; }
        .mcp-status { color: ${mcpHealthColor}; font-weight: bold; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .insights { background: #e7f3ff; }
        .recommendations { background: #fff3cd; }
        .test-result { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .test-passed { border-left-color: #28a745; background: #f8fff8; }
        .test-failed { border-left-color: #dc3545; background: #fff8f8; }
        .recommendation { margin: 10px 0; padding: 15px; border-radius: 5px; }
        .rec-critical { background: #f8d7da; border-left: 4px solid #dc3545; }
        .rec-high { background: #fff3cd; border-left: 4px solid #ffc107; }
        .rec-medium { background: #d1ecf1; border-left: 4px solid #17a2b8; }
        .rec-low { background: #d4edda; border-left: 4px solid #28a745; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metric-card { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #6c757d; font-size: 0.9em; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .mcp-function { font-family: monospace; background: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Real Debug Report ${report.reportId}</h1>
        <p><strong>Generated:</strong> ${report.timestamp.toISOString()}</p>
        <p><strong>Session ID:</strong> ${report.sessionId}</p>
        <p><strong>Status:</strong> <span class="status">${report.realSummary.overallStatus.toUpperCase()}</span></p>
        <p><strong>MCP Integration:</strong> <span class="mcp-status">${report.realSummary.mcpIntegrationHealth.toUpperCase()}</span></p>
        <p><strong>Real Data Quality:</strong> ${report.realSummary.realDataQuality.toUpperCase()}</p>
    </div>

    <div class="section insights">
        <h2>🎯 Real Debug Insights</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${report.realInsights.extensionHealthScore}</div>
                <div class="metric-label">Extension Health Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.realInsights.mcpIntegrationScore}</div>
                <div class="metric-label">MCP Integration Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.realInsights.performanceScore}</div>
                <div class="metric-label">Performance Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.realInsights.reliabilityScore}</div>
                <div class="metric-label">Reliability Score</div>
            </div>
        </div>
        
        <h3>Key Findings</h3>
        <ul>
            ${report.realInsights.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>📊 Real Performance Metrics</h2>
        <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Total Execution Time</td><td>${Math.round(report.realPerformanceMetrics.totalExecutionTime / 1000)}s</td></tr>
            <tr><td>Average Execution Time</td><td>${Math.round(report.realPerformanceMetrics.averageExecutionTime / 1000)}s</td></tr>
            <tr><td>Total MCP Calls</td><td>${report.realPerformanceMetrics.mcpCallStatistics.totalCalls}</td></tr>
            <tr><td>Average MCP Call Time</td><td>${Math.round(report.realPerformanceMetrics.mcpCallStatistics.averageCallTime)}ms</td></tr>
            <tr><td>Peak Memory Usage</td><td>${Math.round(report.realPerformanceMetrics.realMemoryUsage.peak)}MB</td></tr>
            <tr><td>Memory Trend</td><td>${report.realPerformanceMetrics.realMemoryUsage.trend}</td></tr>
            <tr><td>Extension Contexts</td><td>${report.realPerformanceMetrics.realResourceUtilization.extensionContexts}</td></tr>
        </table>
    </div>

    <div class="section">
        <h2>🧪 Real Test Results</h2>
        ${report.realTestResults
          .map(
            result => `
            <div class="test-result ${result.passed ? 'test-passed' : 'test-failed'}">
                <h4>${result.scenarioName} ${result.passed ? '✅' : '❌'}</h4>
                <p><strong>Execution Time:</strong> ${Math.round(result.executionTime / 1000)}s</p>
                <p><strong>MCP Calls:</strong> ${result.mcpFunctionCalls.length}</p>
                <p><strong>Validation:</strong> ${result.validationResults.passed ? '✅ Passed' : '❌ Failed'}</p>
                ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
                ${
                  result.mcpFunctionCalls.length > 0
                    ? `
                    <details>
                        <summary>MCP Function Calls (${result.mcpFunctionCalls.length})</summary>
                        <ul>
                            ${result.mcpFunctionCalls
                              .map(
                                call =>
                                  `<li><span class="mcp-function">${call.functionName}</span> - ${call.executionTime}ms</li>`
                              )
                              .join('')}
                        </ul>
                    </details>
                `
                    : ''
                }
            </div>
        `
          )
          .join('')}
    </div>

    <div class="section recommendations">
        <h2>💡 Real Recommendations</h2>
        ${report.realRecommendations
          .map(
            rec => `
            <div class="recommendation rec-${rec.severity}">
                <h4>${rec.title} (${rec.severity.toUpperCase()})</h4>
                <p>${rec.description}</p>
                <h5>Action Items:</h5>
                <ul>
                    ${rec.actionItems.map(item => `<li>${item}</li>`).join('')}
                </ul>
                ${
                  rec.mcpFunctionImpact && rec.mcpFunctionImpact.length > 0
                    ? `
                    <p><strong>MCP Functions Affected:</strong> ${rec.mcpFunctionImpact.map(f => `<span class="mcp-function">${f}</span>`).join(', ')}</p>
                `
                    : ''
                }
                ${
                  rec.relatedScenarios.length > 0
                    ? `
                    <p><strong>Related Scenarios:</strong> ${rec.relatedScenarios.join(', ')}</p>
                `
                    : ''
                }
            </div>
        `
          )
          .join('')}
    </div>

    <div class="section">
        <h2>🔧 MCP Connection Status</h2>
        <table>
            <tr><th>Property</th><th>Value</th></tr>
            <tr><td>Connected</td><td>${report.mcpConnectionStatus.connected ? '✅ Yes' : '❌ No'}</td></tr>
            <tr><td>Healthy</td><td>${report.mcpConnectionStatus.healthy ? '✅ Yes' : '❌ No'}</td></tr>
            <tr><td>Latency</td><td>${report.mcpConnectionStatus.latency}ms</td></tr>
            <tr><td>Available Functions</td><td>${report.mcpConnectionStatus.availableFunctions}</td></tr>
            <tr><td>Connection Errors</td><td>${report.mcpConnectionStatus.errors.length}</td></tr>
        </table>
    </div>
</body>
</html>`;
  }

  /**
   * Export report as Markdown
   */
  private exportAsMarkdown(report: RealDebugReport): string {
    const statusEmoji = {
      passed: '✅',
      warning: '⚠️',
      failed: '❌',
    }[report.realSummary.overallStatus];

    const mcpHealthEmoji = {
      excellent: '🟢',
      good: '🔵',
      poor: '🟡',
      failed: '🔴',
    }[report.realSummary.mcpIntegrationHealth];

    return `# 🔍 Real Debug Report ${report.reportId}

**Generated:** ${report.timestamp.toISOString()}  
**Session ID:** ${report.sessionId}  
**Status:** ${statusEmoji} ${report.realSummary.overallStatus.toUpperCase()}  
**MCP Integration:** ${mcpHealthEmoji} ${report.realSummary.mcpIntegrationHealth.toUpperCase()}  
**Real Data Quality:** ${report.realSummary.realDataQuality.toUpperCase()}

## 🎯 Real Debug Insights

| Metric | Score |
|--------|-------|
| Extension Health | ${report.realInsights.extensionHealthScore}/100 |
| MCP Integration | ${report.realInsights.mcpIntegrationScore}/100 |
| Performance | ${report.realInsights.performanceScore}/100 |
| Reliability | ${report.realInsights.reliabilityScore}/100 |

### Key Findings

${report.realInsights.keyFindings.map(finding => `- ${finding}`).join('\n')}

## 📊 Real Performance Metrics

- **Total Execution Time:** ${Math.round(report.realPerformanceMetrics.totalExecutionTime / 1000)}s
- **Average Execution Time:** ${Math.round(report.realPerformanceMetrics.averageExecutionTime / 1000)}s
- **Total MCP Calls:** ${report.realPerformanceMetrics.mcpCallStatistics.totalCalls}
- **Average MCP Call Time:** ${Math.round(report.realPerformanceMetrics.mcpCallStatistics.averageCallTime)}ms
- **Peak Memory Usage:** ${Math.round(report.realPerformanceMetrics.realMemoryUsage.peak)}MB
- **Memory Trend:** ${report.realPerformanceMetrics.realMemoryUsage.trend}
- **Extension Contexts:** ${report.realPerformanceMetrics.realResourceUtilization.extensionContexts}

## 🧪 Real Test Results

${report.realTestResults
  .map(
    result => `
### ${result.scenarioName} ${result.passed ? '✅' : '❌'}

- **Execution Time:** ${Math.round(result.executionTime / 1000)}s
- **MCP Calls:** ${result.mcpFunctionCalls.length}
- **Validation:** ${result.validationResults.passed ? '✅ Passed' : '❌ Failed'}
- **Timestamp:** ${result.timestamp.toISOString()}
${result.error ? `- **Error:** ${result.error}` : ''}

${
  result.mcpFunctionCalls.length > 0
    ? `
**MCP Function Calls:**
${result.mcpFunctionCalls.map(call => `- \`${call.functionName}\` - ${call.executionTime}ms`).join('\n')}
`
    : ''
}
`
  )
  .join('')}

## 💡 Real Recommendations

${report.realRecommendations
  .map(
    rec => `
### ${rec.title} (${rec.severity.toUpperCase()})

${rec.description}

**Action Items:**
${rec.actionItems.map(item => `- ${item}`).join('\n')}

${rec.mcpFunctionImpact && rec.mcpFunctionImpact.length > 0 ? `**MCP Functions Affected:** ${rec.mcpFunctionImpact.map(f => `\`${f}\``).join(', ')}` : ''}

${rec.relatedScenarios.length > 0 ? `**Related Scenarios:** ${rec.relatedScenarios.join(', ')}` : ''}
`
  )
  .join('')}

## 🔧 MCP Connection Status

| Property | Value |
|----------|-------|
| Connected | ${report.mcpConnectionStatus.connected ? '✅ Yes' : '❌ No'} |
| Healthy | ${report.mcpConnectionStatus.healthy ? '✅ Yes' : '❌ No'} |
| Latency | ${report.mcpConnectionStatus.latency}ms |
| Available Functions | ${report.mcpConnectionStatus.availableFunctions} |
| Connection Errors | ${report.mcpConnectionStatus.errors.length} |

---
*Report generated by Real Debug Report Generator with MCP integration*`;
  }
}
