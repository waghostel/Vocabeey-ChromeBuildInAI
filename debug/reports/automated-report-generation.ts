/**
 * Automated Report Generation
 * Main entry point for automated debugging report generation
 */

import { DebugReportGenerator } from './debug-report-generator';
import { DebugDataAggregator } from './debug-data-aggregator';
import {
  RecommendationSystem,
  RecommendationContext,
} from './recommendation-system';
import {
  DebugReport,
  TestResult,
  ValidationSummary,
  ReportFormat,
  PerformanceMetrics,
} from '../types/debug-types';

export interface ReportGenerationConfig {
  includePerformanceMetrics: boolean;
  includeRecommendations: boolean;
  includeHistoricalData: boolean;
  formats: ReportFormat[];
  outputDirectory?: string;
  autoSave: boolean;
  minSeverityLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export class AutomatedReportGeneration {
  private reportGenerator: DebugReportGenerator;
  private dataAggregator: DebugDataAggregator;
  private recommendationSystem: RecommendationSystem;
  private generatedReports: DebugReport[] = [];

  constructor() {
    this.reportGenerator = new DebugReportGenerator();
    this.dataAggregator = new DebugDataAggregator();
    this.recommendationSystem = new RecommendationSystem();
  }

  /**
   * Generate a comprehensive debug report
   */
  async generateReport(
    sessionId: string,
    testResults: TestResult[],
    validationSummary: ValidationSummary,
    config: Partial<ReportGenerationConfig> = {}
  ): Promise<DebugReport> {
    const defaultConfig: ReportGenerationConfig = {
      includePerformanceMetrics: true,
      includeRecommendations: true,
      includeHistoricalData: false,
      formats: ['json'],
      autoSave: false,
    };

    const finalConfig = { ...defaultConfig, ...config };

    console.log(`Generating debug report for session ${sessionId}...`);

    // Generate performance metrics if requested
    let performanceMetrics: PerformanceMetrics | undefined;
    if (finalConfig.includePerformanceMetrics) {
      performanceMetrics = this.generatePerformanceMetrics(testResults);
    }

    // Generate recommendations if requested
    let customRecommendations;
    if (finalConfig.includeRecommendations) {
      const context: RecommendationContext = {
        testResults,
        validationSummary,
        performanceMetrics: performanceMetrics!,
        historicalData: finalConfig.includeHistoricalData
          ? {
              previousReports: this.generatedReports.slice(-5), // Last 5 reports
              trends: [],
            }
          : undefined,
      };

      customRecommendations =
        this.recommendationSystem.generateRecommendations(context);

      // Filter by severity if specified
      if (finalConfig.minSeverityLevel) {
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        const minLevel = severityOrder[finalConfig.minSeverityLevel];
        customRecommendations = customRecommendations.filter(
          rec => severityOrder[rec.severity] >= minLevel
        );
      }
    }

    // Generate the report
    const report = this.reportGenerator.generateReport(
      sessionId,
      testResults,
      validationSummary,
      {
        performanceMetrics,
        customRecommendations,
      }
    );

    // Store the report
    this.generatedReports.push(report);
    this.dataAggregator.addReport(report);

    // Auto-save in requested formats
    if (finalConfig.autoSave) {
      await this.saveReportInFormats(
        report,
        finalConfig.formats,
        finalConfig.outputDirectory
      );
    }

    console.log(
      `Generated debug report ${report.reportId} with ${report.recommendations.length} recommendations`
    );
    return report;
  }

  /**
   * Generate batch reports for multiple sessions
   */
  async generateBatchReports(
    sessions: Array<{
      sessionId: string;
      testResults: TestResult[];
      validationSummary: ValidationSummary;
    }>,
    config: Partial<ReportGenerationConfig> = {}
  ): Promise<DebugReport[]> {
    console.log(`Generating batch reports for ${sessions.length} sessions...`);

    const reports: DebugReport[] = [];
    for (const session of sessions) {
      try {
        const report = await this.generateReport(
          session.sessionId,
          session.testResults,
          session.validationSummary,
          config
        );
        reports.push(report);
      } catch (error) {
        console.error(
          `Failed to generate report for session ${session.sessionId}:`,
          error
        );
      }
    }

    return reports;
  }

  /**
   * Generate aggregated report from historical data
   */
  async generateAggregatedReport(
    timeRange?: { start: Date; end: Date },
    config: Partial<ReportGenerationConfig> = {}
  ): Promise<{
    aggregatedData: any;
    report: DebugReport;
  }> {
    console.log('Generating aggregated report from historical data...');

    // Get aggregated data
    const aggregatedData = this.dataAggregator.aggregateData(
      timeRange?.start,
      timeRange?.end
    );

    // Create synthetic test results and validation summary for the aggregated report
    const syntheticTestResults: TestResult[] = [];
    const syntheticValidationSummary: ValidationSummary = {
      totalTests: aggregatedData.testResults.total,
      passedTests: aggregatedData.testResults.passed,
      validTests: aggregatedData.testResults.passed, // Simplified
      averageScore: 1.0, // Simplified
      overallViolations: [],
      overallRecommendations: [],
    };

    // Generate report with aggregated insights
    const report = await this.generateReport(
      `aggregated-${Date.now()}`,
      syntheticTestResults,
      syntheticValidationSummary,
      {
        ...config,
        includeHistoricalData: true,
      }
    );

    // Add aggregated insights to recommendations
    report.recommendations.unshift(
      ...aggregatedData.recommendations.priority.map(rec => ({
        type: 'functionality' as const,
        severity: rec.impact,
        title: rec.title,
        description: rec.description,
        actionItems: [rec.description],
        relatedScenarios: rec.affectedScenarios,
      }))
    );

    return {
      aggregatedData,
      report,
    };
  }

  /**
   * Generate performance-focused report
   */
  async generatePerformanceReport(
    sessionId: string,
    testResults: TestResult[]
  ): Promise<DebugReport> {
    console.log(
      `Generating performance-focused report for session ${sessionId}...`
    );

    // Filter for performance-related test results
    const performanceResults = testResults.filter(
      result =>
        result.scenarioName.toLowerCase().includes('performance') ||
        result.executionTime > 10000 ||
        (result.metrics?.memoryUsage || 0) > 50
    );

    // Create performance-focused validation summary
    const validationSummary: ValidationSummary = {
      totalTests: performanceResults.length,
      passedTests: performanceResults.filter(r => r.passed).length,
      validTests: performanceResults.filter(r => r.passed).length,
      averageScore:
        performanceResults.filter(r => r.passed).length /
        performanceResults.length,
      overallViolations: [],
      overallRecommendations: [],
    };

    return this.generateReport(
      sessionId,
      performanceResults,
      validationSummary,
      {
        includePerformanceMetrics: true,
        includeRecommendations: true,
        minSeverityLevel: 'medium',
      }
    );
  }

  /**
   * Generate reliability-focused report
   */
  async generateReliabilityReport(
    sessionId: string,
    testResults: TestResult[]
  ): Promise<DebugReport> {
    console.log(
      `Generating reliability-focused report for session ${sessionId}...`
    );

    // Focus on failed tests and error patterns
    const failedResults = testResults.filter(result => !result.passed);
    const allResults = testResults; // Include all for context

    const validationSummary: ValidationSummary = {
      totalTests: allResults.length,
      passedTests: allResults.filter(r => r.passed).length,
      validTests: allResults.filter(r => r.passed).length,
      averageScore: allResults.filter(r => r.passed).length / allResults.length,
      overallViolations: failedResults.map(
        r => `${r.scenarioName}: ${r.error || 'Test failed'}`
      ),
      overallRecommendations: [],
    };

    return this.generateReport(sessionId, allResults, validationSummary, {
      includeRecommendations: true,
      minSeverityLevel: 'medium',
    });
  }

  /**
   * Save report in multiple formats
   */
  private async saveReportInFormats(
    report: DebugReport,
    formats: ReportFormat[],
    outputDirectory?: string
  ): Promise<string[]> {
    const savedFiles: string[] = [];

    for (const format of formats) {
      try {
        const fileName = await this.reportGenerator.saveReport(
          report,
          format,
          outputDirectory
            ? `${outputDirectory}/${report.reportId}.${format}`
            : undefined
        );
        savedFiles.push(fileName);
      } catch (error) {
        console.error(`Failed to save report in ${format} format:`, error);
      }
    }

    return savedFiles;
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
   * Get report generation statistics
   */
  getReportStatistics(): {
    totalReports: number;
    reportsByType: Record<string, number>;
    averageRecommendations: number;
    mostCommonIssues: string[];
  } {
    const totalReports = this.generatedReports.length;
    const reportsByType: Record<string, number> = {};
    let totalRecommendations = 0;
    const issueFrequency = new Map<string, number>();

    this.generatedReports.forEach(report => {
      // Count by overall status
      const type = report.summary.overallStatus;
      reportsByType[type] = (reportsByType[type] || 0) + 1;

      // Count recommendations
      totalRecommendations += report.recommendations.length;

      // Track common issues
      report.recommendations.forEach(rec => {
        issueFrequency.set(rec.title, (issueFrequency.get(rec.title) || 0) + 1);
      });
    });

    const averageRecommendations =
      totalReports > 0 ? totalRecommendations / totalReports : 0;
    const mostCommonIssues = Array.from(issueFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([issue]) => issue);

    return {
      totalReports,
      reportsByType,
      averageRecommendations,
      mostCommonIssues,
    };
  }

  /**
   * Export all generated reports
   */
  exportAllReports(): DebugReport[] {
    return [...this.generatedReports];
  }

  /**
   * Clear report history
   */
  clearReportHistory(): void {
    this.generatedReports = [];
    this.dataAggregator.clear();
    console.log('Cleared all report history');
  }

  /**
   * Get recommendation system for custom rule management
   */
  getRecommendationSystem(): RecommendationSystem {
    return this.recommendationSystem;
  }

  /**
   * Get data aggregator for historical analysis
   */
  getDataAggregator(): DebugDataAggregator {
    return this.dataAggregator;
  }
}

// Create and export singleton instance
export const automatedReportGeneration = new AutomatedReportGeneration();

// Convenience functions for common operations
export async function generateQuickReport(
  sessionId: string,
  testResults: TestResult[],
  validationSummary: ValidationSummary
): Promise<DebugReport> {
  return automatedReportGeneration.generateReport(
    sessionId,
    testResults,
    validationSummary,
    {
      formats: ['json', 'markdown'],
      autoSave: true,
    }
  );
}

export async function generatePerformanceReport(
  sessionId: string,
  testResults: TestResult[]
): Promise<DebugReport> {
  return automatedReportGeneration.generatePerformanceReport(
    sessionId,
    testResults
  );
}

export async function generateReliabilityReport(
  sessionId: string,
  testResults: TestResult[]
): Promise<DebugReport> {
  return automatedReportGeneration.generateReliabilityReport(
    sessionId,
    testResults
  );
}
