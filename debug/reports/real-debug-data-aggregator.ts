/**
 * Real Debug Data Aggregator
 * Aggregates real debugging data from MCP integration and test execution
 */

import { RealTestResult } from '../scenarios/real-test-scenario-executor';
import { RealDebugReport } from './real-debug-report-generator';
import { MCPConnectionManager } from '../utils/mcp-connection-manager';

export interface RealAggregatedData {
  timeRange: {
    start: Date;
    end: Date;
  };
  realTestResults: {
    total: number;
    passed: number;
    failed: number;
    validated: number;
    byScenario: Map<
      string,
      {
        executions: number;
        successRate: number;
        validationRate: number;
        avgExecutionTime: number;
        avgMCPCalls: number;
      }
    >;
  };
  realPerformance: {
    executionTimes: {
      min: number;
      max: number;
      average: number;
      median: number;
    };
    mcpPerformance: {
      totalCalls: number;
      averageCallTime: number;
      functionUsage: Map<
        string,
        {
          calls: number;
          avgTime: number;
          successRate: number;
        }
      >;
      connectionStability: number;
    };
    realMemoryUsage: {
      min: number;
      max: number;
      average: number;
      trend: 'increasing' | 'decreasing' | 'stable';
      leakIndicators: string[];
    };
    errorRate: number;
  };
  realIssues: {
    recurring: Array<{
      error: string;
      count: number;
      scenarios: string[];
      firstSeen: Date;
      lastSeen: Date;
      mcpFunctionsInvolved: string[];
    }>;
    mcpIssues: Array<{
      type: 'connection' | 'function' | 'performance' | 'timeout';
      description: string;
      frequency: number;
      impact: 'low' | 'medium' | 'high' | 'critical';
    }>;
    trends: Array<{
      type: 'performance' | 'reliability' | 'mcp-stability';
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      dataPoints: number;
      evidence: any[];
    }>;
  };
  realRecommendations: {
    priority: Array<{
      title: string;
      description: string;
      impact: 'low' | 'medium' | 'high' | 'critical';
      effort: 'low' | 'medium' | 'high';
      affectedScenarios: string[];
      mcpFunctionsAffected: string[];
      realDataEvidence: any;
    }>;
  };
}

export class RealDebugDataAggregator {
  private reports: RealDebugReport[] = [];
  private testResults: RealTestResult[] = [];
  private mcpConnectionManager: MCPConnectionManager;

  constructor(mcpConnectionManager: MCPConnectionManager) {
    this.mcpConnectionManager = mcpConnectionManager;
  }

  /**
   * Add a real debug report to the aggregation
   */
  addRealReport(report: RealDebugReport): void {
    this.reports.push(report);
    this.testResults.push(...report.realTestResults);
    console.log(
      `Added real debug report ${report.reportId} with ${report.realTestResults.length} test results`
    );
  }

  /**
   * Add individual real test results
   */
  addRealTestResults(results: RealTestResult[]): void {
    this.testResults.push(...results);
    console.log(`Added ${results.length} real test results to aggregation`);
  }

  /**
   * Aggregate all real data within a time range
   */
  aggregateRealData(startDate?: Date, endDate?: Date): RealAggregatedData {
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const end = endDate || now;

    const relevantReports = this.reports.filter(
      report => report.timestamp >= start && report.timestamp <= end
    );

    const relevantResults = this.testResults.filter(
      result => result.timestamp >= start && result.timestamp <= end
    );

    const realTestResults = this.aggregateRealTestResults(relevantResults);
    const realPerformance = this.aggregateRealPerformanceData(
      relevantResults,
      relevantReports
    );
    const realIssues = this.identifyRealIssuesAndTrends(
      relevantResults,
      relevantReports
    );
    const realRecommendations = this.generatePrioritizedRealRecommendations(
      relevantResults,
      relevantReports,
      realIssues
    );

    return {
      timeRange: { start, end },
      realTestResults,
      realPerformance,
      realIssues,
      realRecommendations,
    };
  }

  private aggregateRealTestResults(results: RealTestResult[]) {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    const validated = results.filter(r => r.validationResults.passed).length;

    const byScenario = new Map<
      string,
      {
        executions: number;
        successRate: number;
        validationRate: number;
        avgExecutionTime: number;
        avgMCPCalls: number;
      }
    >();

    const scenarioGroups = new Map<string, RealTestResult[]>();
    results.forEach(result => {
      const existing = scenarioGroups.get(result.scenarioName) || [];
      existing.push(result);
      scenarioGroups.set(result.scenarioName, existing);
    });

    scenarioGroups.forEach((scenarioResults, scenarioName) => {
      const executions = scenarioResults.length;
      const successes = scenarioResults.filter(r => r.passed).length;
      const validations = scenarioResults.filter(
        r => r.validationResults.passed
      ).length;
      const successRate = executions > 0 ? successes / executions : 0;
      const validationRate = executions > 0 ? validations / executions : 0;
      const avgExecutionTime =
        scenarioResults.reduce((sum, r) => sum + r.executionTime, 0) /
        executions;
      const avgMCPCalls =
        scenarioResults.reduce((sum, r) => sum + r.mcpFunctionCalls.length, 0) /
        executions;

      byScenario.set(scenarioName, {
        executions,
        successRate,
        validationRate,
        avgExecutionTime,
        avgMCPCalls,
      });
    });

    return { total, passed, failed, validated, byScenario };
  }

  private aggregateRealPerformanceData(
    results: RealTestResult[],
    reports: RealDebugReport[]
  ) {
    const executionTimes = results.map(r => r.executionTime);
    const sortedTimes = [...executionTimes].sort((a, b) => a - b);

    const executionTimeStats = {
      min: sortedTimes[0] || 0,
      max: sortedTimes[sortedTimes.length - 1] || 0,
      average:
        executionTimes.reduce((sum, time) => sum + time, 0) /
          executionTimes.length || 0,
      median: sortedTimes[Math.floor(sortedTimes.length / 2)] || 0,
    };

    const allMCPCalls = results.flatMap(r => r.mcpFunctionCalls);
    const totalMCPCalls = allMCPCalls.length;
    const averageCallTime =
      totalMCPCalls > 0
        ? allMCPCalls.reduce((sum, call) => sum + call.executionTime, 0) /
          totalMCPCalls
        : 0;

    const functionUsage = new Map<
      string,
      { calls: number; avgTime: number; successRate: number }
    >();
    allMCPCalls.forEach(call => {
      const existing = functionUsage.get(call.functionName) || {
        calls: 0,
        avgTime: 0,
        successRate: 0,
      };
      existing.calls++;
      existing.avgTime =
        (existing.avgTime * (existing.calls - 1) + call.executionTime) /
        existing.calls;
      const success =
        call.result !== null && call.result !== undefined && !call.error;
      existing.successRate =
        (existing.successRate * (existing.calls - 1) + (success ? 1 : 0)) /
        existing.calls;
      functionUsage.set(call.functionName, existing);
    });

    const connectionStability =
      reports.length > 0
        ? reports.filter(r => r.mcpConnectionStatus.healthy).length /
          reports.length
        : 0;

    const memoryUsages = results
      .map(r => r.realData?.memoryStatus?.usedJSHeapSize || 0)
      .filter(usage => usage > 0)
      .map(usage => usage / 1024 / 1024);

    const realMemoryUsage = {
      min: memoryUsages.length > 0 ? Math.min(...memoryUsages) : 0,
      max: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
      average:
        memoryUsages.length > 0
          ? memoryUsages.reduce((sum, usage) => sum + usage, 0) /
            memoryUsages.length
          : 0,
      trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
      leakIndicators: [],
    };

    const errorRate =
      results.filter(r => !r.passed).length / results.length || 0;

    return {
      executionTimes: executionTimeStats,
      mcpPerformance: {
        totalCalls: totalMCPCalls,
        averageCallTime,
        functionUsage,
        connectionStability,
      },
      realMemoryUsage,
      errorRate,
    };
  }

  private identifyRealIssuesAndTrends(
    results: RealTestResult[],
    reports: RealDebugReport[]
  ) {
    const errorResults = results.filter(r => r.error);

    const errorGroups = new Map<string, RealTestResult[]>();
    errorResults.forEach(result => {
      const errorKey = result.error!;
      const existing = errorGroups.get(errorKey) || [];
      existing.push(result);
      errorGroups.set(errorKey, existing);
    });

    const recurring = Array.from(errorGroups.entries())
      .filter(([_, results]) => results.length > 1)
      .map(([error, errorResults]) => ({
        error,
        count: errorResults.length,
        scenarios: [...new Set(errorResults.map(r => r.scenarioName))],
        firstSeen: new Date(
          Math.min(...errorResults.map(r => r.timestamp.getTime()))
        ),
        lastSeen: new Date(
          Math.max(...errorResults.map(r => r.timestamp.getTime()))
        ),
        mcpFunctionsInvolved: [
          ...new Set(
            errorResults.flatMap(r =>
              r.mcpFunctionCalls.map(c => c.functionName)
            )
          ),
        ],
      }))
      .sort((a, b) => b.count - a.count);

    const mcpIssues: Array<{
      type: 'connection' | 'function' | 'performance' | 'timeout';
      description: string;
      frequency: number;
      impact: 'low' | 'medium' | 'high' | 'critical';
    }> = [];

    const trends: Array<{
      type: 'performance' | 'reliability' | 'mcp-stability';
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      dataPoints: number;
      evidence: any[];
    }> = [];

    return { recurring, mcpIssues, trends };
  }

  private generatePrioritizedRealRecommendations(
    results: RealTestResult[],
    reports: RealDebugReport[],
    issues: any
  ) {
    const recommendations: Array<{
      title: string;
      description: string;
      impact: 'low' | 'medium' | 'high' | 'critical';
      effort: 'low' | 'medium' | 'high';
      affectedScenarios: string[];
      mcpFunctionsAffected: string[];
      realDataEvidence: any;
    }> = [];

    return { priority: recommendations };
  }

  getAggregationStats(): {
    totalReports: number;
    totalTestResults: number;
    timeSpan: { start: Date | null; end: Date | null };
    mcpConnectionManager: boolean;
  } {
    const allTimestamps = [
      ...this.reports.map(r => r.timestamp),
      ...this.testResults.map(r => r.timestamp),
    ];

    return {
      totalReports: this.reports.length,
      totalTestResults: this.testResults.length,
      timeSpan: {
        start:
          allTimestamps.length > 0
            ? new Date(Math.min(...allTimestamps.map(t => t.getTime())))
            : null,
        end:
          allTimestamps.length > 0
            ? new Date(Math.max(...allTimestamps.map(t => t.getTime())))
            : null,
      },
      mcpConnectionManager: !!this.mcpConnectionManager,
    };
  }

  clearAggregatedData(): void {
    this.reports = [];
    this.testResults = [];
    console.log('Cleared all aggregated debug data');
  }

  exportAggregatedData(): {
    reports: RealDebugReport[];
    testResults: RealTestResult[];
    exportTimestamp: Date;
  } {
    return {
      reports: [...this.reports],
      testResults: [...this.testResults],
      exportTimestamp: new Date(),
    };
  }
}
