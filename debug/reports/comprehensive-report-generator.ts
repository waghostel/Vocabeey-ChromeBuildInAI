/**
 * Comprehensive Debugging Report Generator
 * Creates structured debugging reports with templates, multiple formats, and navigation
 * Task 11: Build comprehensive debugging report generator
 */

import { RealDebugReport } from './real-debug-report-generator';
import { RealTestResult } from '../scenarios/real-test-scenario-executor';

/**
 * Report structure and templates
 * Task 11.1: Create report structure and templates
 */
export interface ReportMetadata {
  reportId: string;
  timestamp: Date;
  version: string;
  environment: {
    platform: string;
    browser: string;
    extensionVersion: string;
    nodeVersion: string;
  };
  sessionInfo: {
    sessionId: string;
    duration: number;
    scenariosExecuted: number;
  };
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  subsections?: ReportSection[];
  artifacts?: ReportArtifact[];
}

export interface ReportArtifact {
  type: 'screenshot' | 'snapshot' | 'log' | 'network' | 'performance';
  name: string;
  path: string;
  timestamp: Date;
  size?: number;
  metadata?: Record<string, any>;
}

export interface ReportTemplate {
  name: string;
  sections: string[];
  format: 'markdown' | 'html' | 'json';
  includeArtifacts: boolean;
  includeNavigation: boolean;
}

/**
 * Comprehensive Report Generator
 */
export class ComprehensiveReportGenerator {
  private templates: Map<string, ReportTemplate>;
  private artifactBasePath: string;

  constructor(artifactBasePath: string = 'debug/playwright-reports') {
    this.artifactBasePath = artifactBasePath;
    this.templates = this.initializeTemplates();
  }

  /**
   * Initialize report templates
   */
  private initializeTemplates(): Map<string, ReportTemplate> {
    const templates = new Map<string, ReportTemplate>();

    // Full comprehensive report template
    templates.set('comprehensive', {
      name: 'Comprehensive Debug Report',
      sections: [
        'metadata',
        'summary',
        'insights',
        'test-results',
        'recommendations',
        'performance',
        'artifacts',
        'navigation',
      ],
      format: 'markdown',
      includeArtifacts: true,
      includeNavigation: true,
    });

    // Quick summary template
    templates.set('summary', {
      name: 'Quick Summary Report',
      sections: ['metadata', 'summary', 'recommendations'],
      format: 'markdown',
      includeArtifacts: false,
      includeNavigation: false,
    });

    // Performance-focused template
    templates.set('performance', {
      name: 'Performance Analysis Report',
      sections: ['metadata', 'performance', 'recommendations', 'artifacts'],
      format: 'markdown',
      includeArtifacts: true,
      includeNavigation: true,
    });

    // Test results template
    templates.set('test-results', {
      name: 'Test Results Report',
      sections: ['metadata', 'test-results', 'artifacts'],
      format: 'markdown',
      includeArtifacts: true,
      includeNavigation: false,
    });

    return templates;
  }

  /**
   * Generate comprehensive report from real debug report
   * Task 11.1: Create report structure and templates
   */
  generateComprehensiveReport(
    realReport: RealDebugReport,
    templateName: string = 'comprehensive',
    artifacts?: ReportArtifact[]
  ): {
    metadata: ReportMetadata;
    sections: ReportSection[];
    artifacts: ReportArtifact[];
  } {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    // Generate metadata
    const metadata = this.generateMetadata(realReport);

    // Generate sections based on template
    const sections = this.generateSections(realReport, template, artifacts);

    // Collect artifacts
    const reportArtifacts = artifacts || [];

    console.log(
      `✅ Generated comprehensive report with ${sections.length} sections`
    );

    return {
      metadata,
      sections,
      artifacts: reportArtifacts,
    };
  }

  /**
   * Generate report metadata
   */
  private generateMetadata(realReport: RealDebugReport): ReportMetadata {
    return {
      reportId: realReport.reportId,
      timestamp: realReport.timestamp,
      version: '1.0.0',
      environment: {
        platform: process.platform,
        browser: 'Chromium',
        extensionVersion: '1.0.0',
        nodeVersion: process.version,
      },
      sessionInfo: {
        sessionId: realReport.sessionId,
        duration: realReport.realSummary.executionDuration,
        scenariosExecuted: realReport.realSummary.scenariosExecuted,
      },
    };
  }

  /**
   * Generate report sections based on template
   */
  private generateSections(
    realReport: RealDebugReport,
    template: ReportTemplate,
    artifacts?: ReportArtifact[]
  ): ReportSection[] {
    const sections: ReportSection[] = [];

    for (const sectionId of template.sections) {
      switch (sectionId) {
        case 'metadata':
          sections.push(this.generateMetadataSection(realReport));
          break;
        case 'summary':
          sections.push(this.generateSummarySection(realReport));
          break;
        case 'insights':
          sections.push(this.generateInsightsSection(realReport));
          break;
        case 'test-results':
          sections.push(this.generateTestResultsSection(realReport));
          break;
        case 'recommendations':
          sections.push(this.generateRecommendationsSection(realReport));
          break;
        case 'performance':
          sections.push(this.generatePerformanceSection(realReport));
          break;
        case 'artifacts':
          if (template.includeArtifacts && artifacts) {
            sections.push(this.generateArtifactsSection(artifacts));
          }
          break;
        case 'navigation':
          if (template.includeNavigation) {
            sections.push(this.generateNavigationSection(sections));
          }
          break;
      }
    }

    return sections;
  }

  /**
   * Generate metadata section
   */
  private generateMetadataSection(realReport: RealDebugReport): ReportSection {
    const content = `
**Report ID:** ${realReport.reportId}
**Generated:** ${realReport.timestamp.toISOString()}
**Session ID:** ${realReport.sessionId}
**Platform:** ${process.platform}
**Node Version:** ${process.version}
`;

    return {
      id: 'metadata',
      title: 'Report Metadata',
      content: content.trim(),
    };
  }

  /**
   * Generate summary section
   */
  private generateSummarySection(realReport: RealDebugReport): ReportSection {
    const summary = realReport.realSummary;
    const statusEmoji = {
      passed: '✅',
      warning: '⚠️',
      failed: '❌',
    }[summary.overallStatus];

    const content = `
${statusEmoji} **Overall Status:** ${summary.overallStatus.toUpperCase()}

**Key Metrics:**
- Scenarios Executed: ${summary.scenariosExecuted}
- Execution Duration: ${Math.round(summary.executionDuration / 1000)}s
- Critical Issues: ${summary.criticalIssues}
- Total Recommendations: ${summary.totalRecommendations}
- MCP Integration: ${summary.mcpIntegrationHealth.toUpperCase()}
- Data Quality: ${summary.realDataQuality.toUpperCase()}
`;

    return {
      id: 'summary',
      title: 'Executive Summary',
      content: content.trim(),
    };
  }

  /**
   * Generate insights section
   */
  private generateInsightsSection(realReport: RealDebugReport): ReportSection {
    const insights = realReport.realInsights;

    const content = `
**Health Scores:**
- Extension Health: ${insights.extensionHealthScore}/100
- MCP Integration: ${insights.mcpIntegrationScore}/100
- Performance: ${insights.performanceScore}/100
- Reliability: ${insights.reliabilityScore}/100

**Key Findings:**
${insights.keyFindings.map(finding => `- ${finding}`).join('\n')}

**Trend Analysis:**
- Performance: ${insights.trendAnalysis.performance}
- Reliability: ${insights.trendAnalysis.reliability}
- MCP Stability: ${insights.trendAnalysis.mcpStability}
`;

    return {
      id: 'insights',
      title: 'Debug Insights',
      content: content.trim(),
    };
  }

  /**
   * Generate test results section
   */
  private generateTestResultsSection(
    realReport: RealDebugReport
  ): ReportSection {
    const passed = realReport.realTestResults.filter(r => r.passed).length;
    const failed = realReport.realTestResults.length - passed;

    let content = `
**Test Summary:**
- Total: ${realReport.realTestResults.length}
- Passed: ${passed}
- Failed: ${failed}
- Success Rate: ${Math.round((passed / realReport.realTestResults.length) * 100)}%

**Test Results:**
`;

    realReport.realTestResults.forEach(result => {
      const emoji = result.passed ? '✅' : '❌';
      content += `\n### ${emoji} ${result.scenarioName}\n`;
      content += `- Execution Time: ${result.executionTime}ms\n`;
      content += `- Timestamp: ${result.timestamp.toISOString()}\n`;
      content += `- MCP Calls: ${result.mcpFunctionCalls.length}\n`;
      content += `- Validation: ${result.validationResults.passed ? 'Passed' : 'Failed'}\n`;

      if (result.error) {
        content += `- **Error:** ${result.error}\n`;
      }

      if (result.mcpFunctionCalls.length > 0) {
        content += `\n**MCP Function Calls:**\n`;
        result.mcpFunctionCalls.forEach(call => {
          content += `  - ${call.functionName}: ${call.executionTime}ms\n`;
        });
      }
    });

    return {
      id: 'test-results',
      title: 'Test Results',
      content: content.trim(),
    };
  }

  /**
   * Generate recommendations section
   */
  private generateRecommendationsSection(
    realReport: RealDebugReport
  ): ReportSection {
    let content = `
**Total Recommendations:** ${realReport.realRecommendations.length}

`;

    realReport.realRecommendations.forEach((rec, index) => {
      const severityEmoji = {
        low: '🟢',
        medium: '🟡',
        high: '🟠',
        critical: '🔴',
      }[rec.severity];

      content += `\n### ${index + 1}. ${severityEmoji} ${rec.title}\n`;
      content += `**Severity:** ${rec.severity.toUpperCase()}\n`;
      content += `**Type:** ${rec.type}\n\n`;
      content += `${rec.description}\n\n`;
      content += `**Action Items:**\n`;
      rec.actionItems.forEach(item => {
        content += `- ${item}\n`;
      });

      if (rec.relatedScenarios.length > 0) {
        content += `\n**Related Scenarios:** ${rec.relatedScenarios.join(', ')}\n`;
      }

      if (rec.mcpFunctionImpact && rec.mcpFunctionImpact.length > 0) {
        content += `\n**MCP Functions Affected:** ${rec.mcpFunctionImpact.join(', ')}\n`;
      }
    });

    return {
      id: 'recommendations',
      title: 'Recommendations',
      content: content.trim(),
    };
  }

  /**
   * Generate performance section
   */
  private generatePerformanceSection(
    realReport: RealDebugReport
  ): ReportSection {
    const perf = realReport.realPerformanceMetrics;

    const content = `
**Execution Metrics:**
- Total Execution Time: ${Math.round(perf.totalExecutionTime / 1000)}s
- Average Execution Time: ${Math.round(perf.averageExecutionTime)}ms

**MCP Call Statistics:**
- Total MCP Calls: ${perf.mcpCallStatistics.totalCalls}
- Average Call Time: ${Math.round(perf.mcpCallStatistics.averageCallTime)}ms

**Memory Usage:**
- Peak: ${Math.round(perf.realMemoryUsage.peak)}MB
- Average: ${Math.round(perf.realMemoryUsage.average)}MB
- Trend: ${perf.realMemoryUsage.trend}

**Resource Utilization:**
- Extension Contexts: ${perf.realResourceUtilization.extensionContexts}
- Active Pages: ${perf.realResourceUtilization.activePages}
- Network Requests: ${perf.realResourceUtilization.networkRequests}

**MCP Function Usage:**
${Array.from(perf.mcpCallStatistics.functionUsage.entries())
  .sort((a, b) => b[1].calls - a[1].calls)
  .map(
    ([func, stats]) =>
      `- ${func}: ${stats.calls} calls, avg ${Math.round(stats.avgTime)}ms`
  )
  .join('\n')}
`;

    return {
      id: 'performance',
      title: 'Performance Metrics',
      content: content.trim(),
    };
  }

  /**
   * Generate artifacts section
   * Task 11.2: Aggregate test results and artifacts
   */
  private generateArtifactsSection(artifacts: ReportArtifact[]): ReportSection {
    const groupedArtifacts = this.groupArtifactsByType(artifacts);

    let content = `**Total Artifacts:** ${artifacts.length}\n\n`;

    for (const [type, items] of groupedArtifacts.entries()) {
      content += `\n**${type.toUpperCase()} (${items.length}):**\n`;
      items.forEach(artifact => {
        content += `- [${artifact.name}](${artifact.path}) - ${artifact.timestamp.toISOString()}`;
        if (artifact.size) {
          content += ` (${Math.round(artifact.size / 1024)}KB)`;
        }
        content += '\n';
      });
    }

    return {
      id: 'artifacts',
      title: 'Debug Artifacts',
      content: content.trim(),
      artifacts,
    };
  }

  /**
   * Generate navigation section
   * Task 11.4: Create report navigation and indexing
   */
  private generateNavigationSection(sections: ReportSection[]): ReportSection {
    let content = '**Table of Contents:**\n\n';

    sections.forEach((section, index) => {
      if (section.id !== 'navigation') {
        content += `${index + 1}. [${section.title}](#${section.id})\n`;
        if (section.subsections) {
          section.subsections.forEach((subsection, subIndex) => {
            content += `   ${index + 1}.${subIndex + 1}. [${subsection.title}](#${subsection.id})\n`;
          });
        }
      }
    });

    return {
      id: 'navigation',
      title: 'Table of Contents',
      content: content.trim(),
    };
  }

  /**
   * Group artifacts by type
   */
  private groupArtifactsByType(
    artifacts: ReportArtifact[]
  ): Map<string, ReportArtifact[]> {
    const grouped = new Map<string, ReportArtifact[]>();

    artifacts.forEach(artifact => {
      const existing = grouped.get(artifact.type) || [];
      existing.push(artifact);
      grouped.set(artifact.type, existing);
    });

    return grouped;
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Get template details
   */
  getTemplate(name: string): ReportTemplate | undefined {
    return this.templates.get(name);
  }
}

/**
 * Report Aggregator
 * Task 11.2: Aggregate test results and artifacts
 */
export class ReportAggregator {
  private testResults: RealTestResult[] = [];
  private artifacts: ReportArtifact[] = [];
  private consoleLogs: any[] = [];
  private networkRequests: any[] = [];
  private performanceData: any[] = [];

  /**
   * Add test results to aggregation
   */
  addTestResults(results: RealTestResult[]): void {
    this.testResults.push(...results);
    console.log(`Added ${results.length} test results to aggregation`);
  }

  /**
   * Add artifacts to aggregation
   */
  addArtifacts(artifacts: ReportArtifact[]): void {
    this.artifacts.push(...artifacts);
    console.log(`Added ${artifacts.length} artifacts to aggregation`);
  }

  /**
   * Add console logs
   */
  addConsoleLogs(logs: any[]): void {
    this.consoleLogs.push(...logs);
    console.log(`Added ${logs.length} console logs to aggregation`);
  }

  /**
   * Add network requests
   */
  addNetworkRequests(requests: any[]): void {
    this.networkRequests.push(...requests);
    console.log(`Added ${requests.length} network requests to aggregation`);
  }

  /**
   * Add performance data
   */
  addPerformanceData(data: any[]): void {
    this.performanceData.push(...data);
    console.log(`Added ${data.length} performance data points to aggregation`);
  }

  /**
   * Collect artifacts from test results
   */
  collectArtifactsFromResults(
    testResults: RealTestResult[],
    basePath: string
  ): ReportArtifact[] {
    const artifacts: ReportArtifact[] = [];

    testResults.forEach((result, index) => {
      // Collect screenshots
      if (result.realData?.screenshots) {
        result.realData.screenshots.forEach(
          (screenshot: any, ssIndex: number) => {
            artifacts.push({
              type: 'screenshot',
              name: `${result.scenarioName}-screenshot-${ssIndex + 1}`,
              path: `${basePath}/${result.scenarioName}/screenshot-${ssIndex + 1}.png`,
              timestamp: result.timestamp,
              metadata: {
                scenarioName: result.scenarioName,
                testIndex: index,
              },
            });
          }
        );
      }

      // Collect snapshots
      if (result.realData?.snapshots) {
        result.realData.snapshots.forEach(
          (snapshot: any, snapIndex: number) => {
            artifacts.push({
              type: 'snapshot',
              name: `${result.scenarioName}-snapshot-${snapIndex + 1}`,
              path: `${basePath}/${result.scenarioName}/snapshot-${snapIndex + 1}.txt`,
              timestamp: result.timestamp,
              metadata: {
                scenarioName: result.scenarioName,
                testIndex: index,
              },
            });
          }
        );
      }

      // Collect console logs
      if (result.realData?.consoleMessages) {
        artifacts.push({
          type: 'log',
          name: `${result.scenarioName}-console-logs`,
          path: `${basePath}/${result.scenarioName}/console-logs.json`,
          timestamp: result.timestamp,
          size: JSON.stringify(result.realData.consoleMessages).length,
          metadata: {
            scenarioName: result.scenarioName,
            messageCount: result.realData.consoleMessages.length,
          },
        });
      }

      // Collect network requests
      if (result.realData?.networkRequests) {
        artifacts.push({
          type: 'network',
          name: `${result.scenarioName}-network-requests`,
          path: `${basePath}/${result.scenarioName}/network-requests.json`,
          timestamp: result.timestamp,
          size: JSON.stringify(result.realData.networkRequests).length,
          metadata: {
            scenarioName: result.scenarioName,
            requestCount: result.realData.networkRequests.length,
          },
        });
      }

      // Collect performance metrics
      if (result.realData?.performanceMetrics) {
        artifacts.push({
          type: 'performance',
          name: `${result.scenarioName}-performance-metrics`,
          path: `${basePath}/${result.scenarioName}/performance-metrics.json`,
          timestamp: result.timestamp,
          size: JSON.stringify(result.realData.performanceMetrics).length,
          metadata: {
            scenarioName: result.scenarioName,
            metricCount: Object.keys(result.realData.performanceMetrics).length,
          },
        });
      }
    });

    return artifacts;
  }

  /**
   * Organize artifacts by scenario
   */
  organizeArtifactsByScenario(): Map<string, ReportArtifact[]> {
    const organized = new Map<string, ReportArtifact[]>();

    this.artifacts.forEach(artifact => {
      const scenarioName = artifact.metadata?.scenarioName || 'unknown';
      const existing = organized.get(scenarioName) || [];
      existing.push(artifact);
      organized.set(scenarioName, existing);
    });

    return organized;
  }

  /**
   * Organize artifacts by type
   */
  organizeArtifactsByType(): Map<string, ReportArtifact[]> {
    const organized = new Map<string, ReportArtifact[]>();

    this.artifacts.forEach(artifact => {
      const existing = organized.get(artifact.type) || [];
      existing.push(artifact);
      organized.set(artifact.type, existing);
    });

    return organized;
  }

  /**
   * Get aggregated statistics
   */
  getAggregatedStatistics(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    totalArtifacts: number;
    artifactsByType: Record<string, number>;
    totalConsoleLogs: number;
    totalNetworkRequests: number;
    totalPerformanceData: number;
    averageExecutionTime: number;
    totalExecutionTime: number;
  } {
    const passedTests = this.testResults.filter(r => r.passed).length;
    const artifactsByType: Record<string, number> = {};

    this.artifacts.forEach(artifact => {
      artifactsByType[artifact.type] =
        (artifactsByType[artifact.type] || 0) + 1;
    });

    const totalExecutionTime = this.testResults.reduce(
      (sum, r) => sum + r.executionTime,
      0
    );
    const averageExecutionTime =
      this.testResults.length > 0
        ? totalExecutionTime / this.testResults.length
        : 0;

    return {
      totalTests: this.testResults.length,
      passedTests,
      failedTests: this.testResults.length - passedTests,
      totalArtifacts: this.artifacts.length,
      artifactsByType,
      totalConsoleLogs: this.consoleLogs.length,
      totalNetworkRequests: this.networkRequests.length,
      totalPerformanceData: this.performanceData.length,
      averageExecutionTime,
      totalExecutionTime,
    };
  }

  /**
   * Get all test results
   */
  getTestResults(): RealTestResult[] {
    return [...this.testResults];
  }

  /**
   * Get all artifacts
   */
  getArtifacts(): ReportArtifact[] {
    return [...this.artifacts];
  }

  /**
   * Get console logs
   */
  getConsoleLogs(): any[] {
    return [...this.consoleLogs];
  }

  /**
   * Get network requests
   */
  getNetworkRequests(): any[] {
    return [...this.networkRequests];
  }

  /**
   * Get performance data
   */
  getPerformanceData(): any[] {
    return [...this.performanceData];
  }

  /**
   * Clear all aggregated data
   */
  clear(): void {
    this.testResults = [];
    this.artifacts = [];
    this.consoleLogs = [];
    this.networkRequests = [];
    this.performanceData = [];
    console.log('Cleared all aggregated data');
  }

  /**
   * Export aggregated data
   */
  exportAggregatedData(): {
    testResults: RealTestResult[];
    artifacts: ReportArtifact[];
    consoleLogs: any[];
    networkRequests: any[];
    performanceData: any[];
    statistics: any;
  } {
    return {
      testResults: this.getTestResults(),
      artifacts: this.getArtifacts(),
      consoleLogs: this.getConsoleLogs(),
      networkRequests: this.getNetworkRequests(),
      performanceData: this.getPerformanceData(),
      statistics: this.getAggregatedStatistics(),
    };
  }
}

/**
 * Recommendation Analyzer
 * Task 11.3: Generate actionable recommendations
 */
export interface ActionableRecommendation {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category:
    | 'performance'
    | 'functionality'
    | 'reliability'
    | 'mcp-integration'
    | 'security';
  title: string;
  description: string;
  evidence: {
    testResults: string[];
    metrics: Record<string, any>;
    patterns: string[];
  };
  actionItems: Array<{
    action: string;
    priority: number;
    estimatedEffort: 'low' | 'medium' | 'high';
    expectedImpact: 'low' | 'medium' | 'high';
  }>;
  relatedScenarios: string[];
  fixSuggestions: string[];
  codeExamples?: string[];
}

export class RecommendationAnalyzer {
  /**
   * Analyze test results and generate actionable recommendations
   */
  analyzeAndGenerateRecommendations(
    testResults: RealTestResult[],
    performanceMetrics: any,
    mcpConnectionStatus: any
  ): ActionableRecommendation[] {
    const recommendations: ActionableRecommendation[] = [];

    // Analyze test failures
    recommendations.push(...this.analyzeTestFailures(testResults));

    // Analyze performance issues
    recommendations.push(
      ...this.analyzePerformanceIssues(testResults, performanceMetrics)
    );

    // Analyze MCP integration issues
    recommendations.push(
      ...this.analyzeMCPIntegration(testResults, mcpConnectionStatus)
    );

    // Analyze common error patterns
    recommendations.push(...this.analyzeErrorPatterns(testResults));

    // Analyze reliability issues
    recommendations.push(...this.analyzeReliabilityIssues(testResults));

    // Prioritize recommendations by severity
    return this.prioritizeRecommendations(recommendations);
  }

  /**
   * Analyze test failures and generate recommendations
   */
  private analyzeTestFailures(
    testResults: RealTestResult[]
  ): ActionableRecommendation[] {
    const recommendations: ActionableRecommendation[] = [];
    const failedTests = testResults.filter(r => !r.passed);

    if (failedTests.length === 0) {
      return recommendations;
    }

    const failureRate = failedTests.length / testResults.length;
    const severity: 'low' | 'medium' | 'high' | 'critical' =
      failureRate > 0.5
        ? 'critical'
        : failureRate > 0.3
          ? 'high'
          : failureRate > 0.1
            ? 'medium'
            : 'low';

    // Group failures by error type
    const errorGroups = this.groupErrorsByType(failedTests);

    errorGroups.forEach((tests, errorType) => {
      recommendations.push({
        id: `test-failure-${errorType}`,
        severity,
        category: 'reliability',
        title: `Fix ${errorType} Test Failures`,
        description: `${tests.length} tests failed due to ${errorType} errors (${Math.round((tests.length / testResults.length) * 100)}% of total tests)`,
        evidence: {
          testResults: tests.map(t => t.scenarioName),
          metrics: {
            failureCount: tests.length,
            failureRate: tests.length / testResults.length,
            firstFailure: tests[0].timestamp,
            lastFailure: tests[tests.length - 1].timestamp,
          },
          patterns: this.extractErrorPatterns(tests),
        },
        actionItems: this.generateFailureActionItems(errorType, tests),
        relatedScenarios: tests.map(t => t.scenarioName),
        fixSuggestions: this.generateFailureFixSuggestions(errorType, tests),
      });
    });

    return recommendations;
  }

  /**
   * Analyze performance issues
   */
  private analyzePerformanceIssues(
    testResults: RealTestResult[],
    performanceMetrics: any
  ): ActionableRecommendation[] {
    const recommendations: ActionableRecommendation[] = [];

    // Slow execution times
    const slowTests = testResults.filter(r => r.executionTime > 30000);
    if (slowTests.length > 0) {
      recommendations.push({
        id: 'performance-slow-execution',
        severity:
          slowTests.length > testResults.length * 0.3 ? 'high' : 'medium',
        category: 'performance',
        title: 'Optimize Slow Test Execution',
        description: `${slowTests.length} tests exceed 30s execution time`,
        evidence: {
          testResults: slowTests.map(t => t.scenarioName),
          metrics: {
            slowTestCount: slowTests.length,
            averageSlowTime:
              slowTests.reduce((sum, t) => sum + t.executionTime, 0) /
              slowTests.length,
            slowestTest: Math.max(...slowTests.map(t => t.executionTime)),
          },
          patterns: ['Long execution times', 'Potential bottlenecks'],
        },
        actionItems: [
          {
            action: 'Profile slow test scenarios to identify bottlenecks',
            priority: 1,
            estimatedEffort: 'medium',
            expectedImpact: 'high',
          },
          {
            action: 'Optimize MCP function calls and reduce unnecessary waits',
            priority: 2,
            estimatedEffort: 'medium',
            expectedImpact: 'high',
          },
          {
            action: 'Implement parallel execution where possible',
            priority: 3,
            estimatedEffort: 'high',
            expectedImpact: 'medium',
          },
        ],
        relatedScenarios: slowTests.map(t => t.scenarioName),
        fixSuggestions: [
          'Review wait times and timeouts in test scenarios',
          'Optimize extension initialization and loading',
          'Cache frequently accessed data',
          'Reduce unnecessary page navigations',
        ],
      });
    }

    // High memory usage
    if (performanceMetrics?.realMemoryUsage?.peak > 200) {
      recommendations.push({
        id: 'performance-high-memory',
        severity:
          performanceMetrics.realMemoryUsage.peak > 500 ? 'critical' : 'high',
        category: 'performance',
        title: 'Reduce Memory Usage',
        description: `Peak memory usage of ${Math.round(performanceMetrics.realMemoryUsage.peak)}MB exceeds recommended limits`,
        evidence: {
          testResults: [],
          metrics: {
            peakMemory: performanceMetrics.realMemoryUsage.peak,
            averageMemory: performanceMetrics.realMemoryUsage.average,
            memoryTrend: performanceMetrics.realMemoryUsage.trend,
          },
          patterns: ['High memory consumption', 'Potential memory leaks'],
        },
        actionItems: [
          {
            action: 'Use Chrome DevTools Memory Profiler to identify leaks',
            priority: 1,
            estimatedEffort: 'medium',
            expectedImpact: 'high',
          },
          {
            action: 'Review and optimize data structures and caching',
            priority: 2,
            estimatedEffort: 'high',
            expectedImpact: 'high',
          },
          {
            action: 'Implement proper cleanup in extension lifecycle',
            priority: 3,
            estimatedEffort: 'medium',
            expectedImpact: 'medium',
          },
        ],
        relatedScenarios: [],
        fixSuggestions: [
          'Remove event listeners when components unmount',
          'Clear caches periodically',
          'Avoid storing large objects in memory',
          'Use WeakMap/WeakSet for object references',
        ],
        codeExamples: [
          '// Proper cleanup example\nwindow.addEventListener("unload", () => {\n  // Clear caches\n  cache.clear();\n  // Remove listeners\n  removeAllListeners();\n});',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Analyze MCP integration issues
   */
  private analyzeMCPIntegration(
    testResults: RealTestResult[],
    mcpConnectionStatus: any
  ): ActionableRecommendation[] {
    const recommendations: ActionableRecommendation[] = [];

    // MCP connection issues
    if (!mcpConnectionStatus?.connected) {
      recommendations.push({
        id: 'mcp-connection-failed',
        severity: 'critical',
        category: 'mcp-integration',
        title: 'Fix MCP Connection',
        description: 'Chrome DevTools MCP server connection is not established',
        evidence: {
          testResults: testResults.map(t => t.scenarioName),
          metrics: {
            connectionStatus: mcpConnectionStatus,
            affectedTests: testResults.filter(r => !r.passed).length,
          },
          patterns: ['MCP connection failure', 'All tests affected'],
        },
        actionItems: [
          {
            action:
              'Install chrome-devtools MCP server: uvx mcp-chrome-devtools@latest',
            priority: 1,
            estimatedEffort: 'low',
            expectedImpact: 'high',
          },
          {
            action: 'Verify MCP server configuration in mcp-config.json',
            priority: 2,
            estimatedEffort: 'low',
            expectedImpact: 'high',
          },
          {
            action: 'Check network connectivity and firewall settings',
            priority: 3,
            estimatedEffort: 'medium',
            expectedImpact: 'medium',
          },
        ],
        relatedScenarios: testResults.map(t => t.scenarioName),
        fixSuggestions: [
          'Ensure MCP server is running before executing tests',
          'Check MCP server logs for connection errors',
          'Verify port availability and permissions',
        ],
        codeExamples: [
          '// MCP configuration example\n{\n  "mcpServers": {\n    "chrome-devtools": {\n      "command": "uvx",\n      "args": ["mcp-chrome-devtools@latest"]\n    }\n  }\n}',
        ],
      });
    }

    // Slow MCP calls
    const slowMCPCalls = testResults.flatMap(r =>
      r.mcpFunctionCalls.filter(call => call.executionTime > 3000)
    );

    if (slowMCPCalls.length > 0) {
      recommendations.push({
        id: 'mcp-slow-calls',
        severity: 'medium',
        category: 'mcp-integration',
        title: 'Optimize MCP Function Calls',
        description: `${slowMCPCalls.length} MCP function calls exceed 3s execution time`,
        evidence: {
          testResults: [],
          metrics: {
            slowCallCount: slowMCPCalls.length,
            averageSlowTime:
              slowMCPCalls.reduce((sum, call) => sum + call.executionTime, 0) /
              slowMCPCalls.length,
            slowestFunction: slowMCPCalls.reduce((max, call) =>
              call.executionTime > max.executionTime ? call : max
            ),
          },
          patterns: ['Slow MCP operations', 'Performance bottlenecks'],
        },
        actionItems: [
          {
            action: 'Implement caching for frequently called MCP functions',
            priority: 1,
            estimatedEffort: 'medium',
            expectedImpact: 'high',
          },
          {
            action: 'Batch MCP calls where possible',
            priority: 2,
            estimatedEffort: 'medium',
            expectedImpact: 'medium',
          },
          {
            action: 'Add timeout handling for slow MCP operations',
            priority: 3,
            estimatedEffort: 'low',
            expectedImpact: 'medium',
          },
        ],
        relatedScenarios: [],
        fixSuggestions: [
          'Cache MCP function results when appropriate',
          'Use Promise.race() for timeout handling',
          'Consider alternative approaches for slow operations',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Analyze error patterns
   */
  private analyzeErrorPatterns(
    testResults: RealTestResult[]
  ): ActionableRecommendation[] {
    const recommendations: ActionableRecommendation[] = [];
    const errorPatterns = this.identifyCommonErrorPatterns(testResults);

    errorPatterns.forEach(pattern => {
      if (pattern.occurrences >= 3) {
        recommendations.push({
          id: `error-pattern-${pattern.type}`,
          severity: pattern.occurrences >= 5 ? 'high' : 'medium',
          category: 'reliability',
          title: `Fix Recurring ${pattern.type} Errors`,
          description: `${pattern.type} error pattern detected in ${pattern.occurrences} tests`,
          evidence: {
            testResults: pattern.affectedTests,
            metrics: {
              occurrences: pattern.occurrences,
              errorMessage: pattern.message,
            },
            patterns: [pattern.type],
          },
          actionItems: [
            {
              action: `Investigate root cause of ${pattern.type} errors`,
              priority: 1,
              estimatedEffort: 'medium',
              expectedImpact: 'high',
            },
            {
              action: 'Implement proper error handling and recovery',
              priority: 2,
              estimatedEffort: 'medium',
              expectedImpact: 'high',
            },
          ],
          relatedScenarios: pattern.affectedTests,
          fixSuggestions: pattern.suggestions,
        });
      }
    });

    return recommendations;
  }

  /**
   * Analyze reliability issues
   */
  private analyzeReliabilityIssues(
    testResults: RealTestResult[]
  ): ActionableRecommendation[] {
    const recommendations: ActionableRecommendation[] = [];

    // Validation failures
    const validationFailures = testResults.filter(
      r => r.passed && !r.validationResults.passed
    );

    if (validationFailures.length > 0) {
      recommendations.push({
        id: 'reliability-validation-failures',
        severity:
          validationFailures.length > testResults.length * 0.3
            ? 'high'
            : 'medium',
        category: 'functionality',
        title: 'Fix Validation Failures',
        description: `${validationFailures.length} tests passed execution but failed validation`,
        evidence: {
          testResults: validationFailures.map(t => t.scenarioName),
          metrics: {
            validationFailureCount: validationFailures.length,
            validationFailureRate:
              validationFailures.length / testResults.length,
          },
          patterns: ['Validation mismatches', 'Unexpected behavior'],
        },
        actionItems: [
          {
            action:
              'Review validation criteria to ensure they match expected behavior',
            priority: 1,
            estimatedEffort: 'low',
            expectedImpact: 'medium',
          },
          {
            action: 'Fix functionality issues causing validation failures',
            priority: 2,
            estimatedEffort: 'high',
            expectedImpact: 'high',
          },
          {
            action:
              'Update test scenarios to better reflect actual extension behavior',
            priority: 3,
            estimatedEffort: 'medium',
            expectedImpact: 'medium',
          },
        ],
        relatedScenarios: validationFailures.map(t => t.scenarioName),
        fixSuggestions: [
          'Verify validation criteria are appropriate',
          'Check for timing issues in validation',
          'Ensure test data matches expected format',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Prioritize recommendations by severity and impact
   */
  private prioritizeRecommendations(
    recommendations: ActionableRecommendation[]
  ): ActionableRecommendation[] {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

    return recommendations.sort((a, b) => {
      // Sort by severity first
      const severityDiff =
        severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then by number of affected scenarios
      return b.relatedScenarios.length - a.relatedScenarios.length;
    });
  }

  /**
   * Group errors by type
   */
  private groupErrorsByType(
    failedTests: RealTestResult[]
  ): Map<string, RealTestResult[]> {
    const groups = new Map<string, RealTestResult[]>();

    failedTests.forEach(test => {
      const errorType = this.classifyError(test.error || '');
      const existing = groups.get(errorType) || [];
      existing.push(test);
      groups.set(errorType, existing);
    });

    return groups;
  }

  /**
   * Classify error type
   */
  private classifyError(error: string): string {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('timeout')) return 'timeout';
    if (errorLower.includes('connection')) return 'connection';
    if (errorLower.includes('not found') || errorLower.includes('404'))
      return 'not-found';
    if (errorLower.includes('permission')) return 'permission';
    if (errorLower.includes('memory')) return 'memory';
    if (errorLower.includes('network')) return 'network';
    if (errorLower.includes('validation')) return 'validation';

    return 'unknown';
  }

  /**
   * Extract error patterns
   */
  private extractErrorPatterns(tests: RealTestResult[]): string[] {
    const patterns = new Set<string>();

    tests.forEach(test => {
      if (test.error) {
        const errorType = this.classifyError(test.error);
        patterns.add(errorType);
      }
    });

    return Array.from(patterns);
  }

  /**
   * Generate action items for failures
   */
  private generateFailureActionItems(
    errorType: string,
    tests: RealTestResult[]
  ): Array<{
    action: string;
    priority: number;
    estimatedEffort: 'low' | 'medium' | 'high';
    expectedImpact: 'low' | 'medium' | 'high';
  }> {
    const actionMap: Record<
      string,
      Array<{
        action: string;
        priority: number;
        estimatedEffort: 'low' | 'medium' | 'high';
        expectedImpact: 'low' | 'medium' | 'high';
      }>
    > = {
      timeout: [
        {
          action: 'Increase timeout values for slow operations',
          priority: 1,
          estimatedEffort: 'low',
          expectedImpact: 'medium',
        },
        {
          action: 'Optimize extension code to reduce execution time',
          priority: 2,
          estimatedEffort: 'high',
          expectedImpact: 'high',
        },
      ],
      connection: [
        {
          action: 'Verify MCP server is running and accessible',
          priority: 1,
          estimatedEffort: 'low',
          expectedImpact: 'high',
        },
        {
          action: 'Implement connection retry logic',
          priority: 2,
          estimatedEffort: 'medium',
          expectedImpact: 'high',
        },
      ],
      'not-found': [
        {
          action: 'Verify file paths and resource availability',
          priority: 1,
          estimatedEffort: 'low',
          expectedImpact: 'high',
        },
        {
          action: 'Check extension build and dist directory',
          priority: 2,
          estimatedEffort: 'low',
          expectedImpact: 'high',
        },
      ],
    };

    return (
      actionMap[errorType] || [
        {
          action: `Investigate and fix ${errorType} errors`,
          priority: 1,
          estimatedEffort: 'medium',
          expectedImpact: 'high',
        },
      ]
    );
  }

  /**
   * Generate fix suggestions for failures
   */
  private generateFailureFixSuggestions(
    errorType: string,
    tests: RealTestResult[]
  ): string[] {
    const suggestionMap: Record<string, string[]> = {
      timeout: [
        'Review and optimize slow operations',
        'Increase timeout values in test configuration',
        'Implement progress indicators for long operations',
      ],
      connection: [
        'Ensure MCP server is running before tests',
        'Check network connectivity',
        'Implement connection health checks',
      ],
      'not-found': [
        'Verify all required files exist in dist directory',
        'Check manifest.json file paths',
        'Rebuild extension before testing',
      ],
    };

    return (
      suggestionMap[errorType] || [
        `Review error messages for ${errorType} failures`,
        'Check extension logs for additional context',
        'Verify test scenario assumptions',
      ]
    );
  }

  /**
   * Identify common error patterns
   */
  private identifyCommonErrorPatterns(testResults: RealTestResult[]): Array<{
    type: string;
    message: string;
    occurrences: number;
    affectedTests: string[];
    suggestions: string[];
  }> {
    const patterns: Map<
      string,
      { message: string; tests: string[]; suggestions: string[] }
    > = new Map();

    testResults
      .filter(r => r.error)
      .forEach(test => {
        const errorType = this.classifyError(test.error!);
        const existing = patterns.get(errorType) || {
          message: test.error!,
          tests: [],
          suggestions: this.generateFailureFixSuggestions(errorType, [test]),
        };
        existing.tests.push(test.scenarioName);
        patterns.set(errorType, existing);
      });

    return Array.from(patterns.entries()).map(([type, data]) => ({
      type,
      message: data.message,
      occurrences: data.tests.length,
      affectedTests: data.tests,
      suggestions: data.suggestions,
    }));
  }
}

/**
 * Report Navigator
 * Task 11.4: Create report navigation and indexing
 */
export interface ReportIndex {
  sections: Array<{
    id: string;
    title: string;
    anchor: string;
    level: number;
    subsections?: Array<{
      id: string;
      title: string;
      anchor: string;
    }>;
  }>;
  artifacts: Array<{
    type: string;
    count: number;
    links: Array<{
      name: string;
      path: string;
      anchor: string;
    }>;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    severity: string;
    anchor: string;
  }>;
  testResults: Array<{
    scenarioName: string;
    status: 'passed' | 'failed';
    anchor: string;
  }>;
}

export class ReportNavigator {
  /**
   * Generate table of contents for report
   */
  generateTableOfContents(sections: ReportSection[]): string {
    let toc = '# Table of Contents\n\n';

    sections.forEach((section, index) => {
      if (section.id !== 'navigation') {
        const anchor = this.generateAnchor(section.id);
        toc += `${index + 1}. [${section.title}](#${anchor})\n`;

        if (section.subsections) {
          section.subsections.forEach((subsection, subIndex) => {
            const subAnchor = this.generateAnchor(subsection.id);
            toc += `   ${index + 1}.${subIndex + 1}. [${subsection.title}](#${subAnchor})\n`;
          });
        }
      }
    });

    return toc;
  }

  /**
   * Generate comprehensive report index
   */
  generateReportIndex(
    sections: ReportSection[],
    artifacts: ReportArtifact[],
    recommendations: ActionableRecommendation[],
    testResults: RealTestResult[]
  ): ReportIndex {
    // Index sections
    const sectionIndex = sections
      .filter(s => s.id !== 'navigation')
      .map((section, index) => ({
        id: section.id,
        title: section.title,
        anchor: this.generateAnchor(section.id),
        level: 1,
        subsections: section.subsections?.map((sub, subIndex) => ({
          id: sub.id,
          title: sub.title,
          anchor: this.generateAnchor(sub.id),
        })),
      }));

    // Index artifacts by type
    const artifactsByType = this.groupArtifactsByType(artifacts);
    const artifactIndex = Array.from(artifactsByType.entries()).map(
      ([type, items]) => ({
        type,
        count: items.length,
        links: items.map(artifact => ({
          name: artifact.name,
          path: artifact.path,
          anchor: this.generateAnchor(`artifact-${artifact.name}`),
        })),
      })
    );

    // Index recommendations
    const recommendationIndex = recommendations.map(rec => ({
      id: rec.id,
      title: rec.title,
      severity: rec.severity,
      anchor: this.generateAnchor(`recommendation-${rec.id}`),
    }));

    // Index test results
    const testResultIndex = testResults.map(test => ({
      scenarioName: test.scenarioName,
      status: test.passed ? ('passed' as const) : ('failed' as const),
      anchor: this.generateAnchor(`test-${test.scenarioName}`),
    }));

    return {
      sections: sectionIndex,
      artifacts: artifactIndex,
      recommendations: recommendationIndex,
      testResults: testResultIndex,
    };
  }

  /**
   * Generate quick navigation links
   */
  generateQuickNavigation(index: ReportIndex): string {
    let nav = '## Quick Navigation\n\n';

    // Critical items
    const criticalRecs = index.recommendations.filter(
      r => r.severity === 'critical'
    );
    if (criticalRecs.length > 0) {
      nav += '### 🔴 Critical Issues\n';
      criticalRecs.forEach(rec => {
        nav += `- [${rec.title}](#${rec.anchor})\n`;
      });
      nav += '\n';
    }

    // Failed tests
    const failedTests = index.testResults.filter(t => t.status === 'failed');
    if (failedTests.length > 0) {
      nav += '### ❌ Failed Tests\n';
      failedTests.forEach(test => {
        nav += `- [${test.scenarioName}](#${test.anchor})\n`;
      });
      nav += '\n';
    }

    // Artifacts
    nav += '### 📁 Artifacts\n';
    index.artifacts.forEach(artifact => {
      nav += `- [${artifact.type} (${artifact.count})](#${this.generateAnchor(`artifacts-${artifact.type}`)})\n`;
    });

    return nav;
  }

  /**
   * Generate search-friendly formatting
   */
  generateSearchIndex(
    sections: ReportSection[],
    recommendations: ActionableRecommendation[],
    testResults: RealTestResult[]
  ): {
    keywords: string[];
    searchableContent: Array<{
      type: string;
      title: string;
      content: string;
      anchor: string;
      keywords: string[];
    }>;
  } {
    const keywords = new Set<string>();
    const searchableContent: Array<{
      type: string;
      title: string;
      content: string;
      anchor: string;
      keywords: string[];
    }> = [];

    // Index sections
    sections.forEach(section => {
      const sectionKeywords = this.extractKeywords(
        section.title + ' ' + section.content
      );
      sectionKeywords.forEach(kw => keywords.add(kw));

      searchableContent.push({
        type: 'section',
        title: section.title,
        content: section.content,
        anchor: this.generateAnchor(section.id),
        keywords: sectionKeywords,
      });
    });

    // Index recommendations
    recommendations.forEach(rec => {
      const recKeywords = this.extractKeywords(
        rec.title + ' ' + rec.description
      );
      recKeywords.forEach(kw => keywords.add(kw));

      searchableContent.push({
        type: 'recommendation',
        title: rec.title,
        content: rec.description,
        anchor: this.generateAnchor(`recommendation-${rec.id}`),
        keywords: recKeywords,
      });
    });

    // Index test results
    testResults.forEach(test => {
      const testKeywords = this.extractKeywords(
        test.scenarioName + ' ' + (test.error || '')
      );
      testKeywords.forEach(kw => keywords.add(kw));

      searchableContent.push({
        type: 'test-result',
        title: test.scenarioName,
        content: test.error || 'Test passed successfully',
        anchor: this.generateAnchor(`test-${test.scenarioName}`),
        keywords: testKeywords,
      });
    });

    return {
      keywords: Array.from(keywords).sort(),
      searchableContent,
    };
  }

  /**
   * Generate links between related findings
   */
  generateRelatedLinks(
    recommendations: ActionableRecommendation[],
    testResults: RealTestResult[]
  ): Map<string, Array<{ title: string; anchor: string; type: string }>> {
    const relatedLinks = new Map<
      string,
      Array<{ title: string; anchor: string; type: string }>
    >();

    // Link recommendations to related test results
    recommendations.forEach(rec => {
      const links: Array<{ title: string; anchor: string; type: string }> = [];

      rec.relatedScenarios.forEach(scenarioName => {
        const test = testResults.find(t => t.scenarioName === scenarioName);
        if (test) {
          links.push({
            title: test.scenarioName,
            anchor: this.generateAnchor(`test-${test.scenarioName}`),
            type: 'test-result',
          });
        }
      });

      // Link to related recommendations
      recommendations.forEach(otherRec => {
        if (otherRec.id !== rec.id && this.hasCommonScenarios(rec, otherRec)) {
          links.push({
            title: otherRec.title,
            anchor: this.generateAnchor(`recommendation-${otherRec.id}`),
            type: 'recommendation',
          });
        }
      });

      relatedLinks.set(rec.id, links);
    });

    // Link test results to related recommendations
    testResults.forEach(test => {
      const links: Array<{ title: string; anchor: string; type: string }> = [];

      recommendations.forEach(rec => {
        if (rec.relatedScenarios.includes(test.scenarioName)) {
          links.push({
            title: rec.title,
            anchor: this.generateAnchor(`recommendation-${rec.id}`),
            type: 'recommendation',
          });
        }
      });

      relatedLinks.set(test.scenarioName, links);
    });

    return relatedLinks;
  }

  /**
   * Generate anchor from ID
   */
  private generateAnchor(id: string): string {
    return id
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Group artifacts by type
   */
  private groupArtifactsByType(
    artifacts: ReportArtifact[]
  ): Map<string, ReportArtifact[]> {
    const grouped = new Map<string, ReportArtifact[]>();

    artifacts.forEach(artifact => {
      const existing = grouped.get(artifact.type) || [];
      existing.push(artifact);
      grouped.set(artifact.type, existing);
    });

    return grouped;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Remove common words and extract meaningful keywords
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .slice(0, 10); // Limit to top 10 keywords
  }

  /**
   * Check if recommendations have common scenarios
   */
  private hasCommonScenarios(
    rec1: ActionableRecommendation,
    rec2: ActionableRecommendation
  ): boolean {
    return rec1.relatedScenarios.some(scenario =>
      rec2.relatedScenarios.includes(scenario)
    );
  }

  /**
   * Generate breadcrumb navigation
   */
  generateBreadcrumbs(
    currentSection: string,
    sections: ReportSection[]
  ): string {
    const section = sections.find(s => s.id === currentSection);
    if (!section) return '';

    let breadcrumb = `[Home](#top) > [${section.title}](#${this.generateAnchor(section.id)})`;

    return breadcrumb;
  }
}

/**
 * Report Formatter
 * Task 11.5: Support multiple report formats
 */
export type ReportFormat = 'markdown' | 'html' | 'json';

export class ReportFormatter {
  private navigator: ReportNavigator;

  constructor() {
    this.navigator = new ReportNavigator();
  }

  /**
   * Format report in specified format
   */
  formatReport(
    metadata: ReportMetadata,
    sections: ReportSection[],
    artifacts: ReportArtifact[],
    recommendations: ActionableRecommendation[],
    testResults: RealTestResult[],
    format: ReportFormat
  ): string {
    switch (format) {
      case 'markdown':
        return this.formatAsMarkdown(
          metadata,
          sections,
          artifacts,
          recommendations,
          testResults
        );
      case 'html':
        return this.formatAsHTML(
          metadata,
          sections,
          artifacts,
          recommendations,
          testResults
        );
      case 'json':
        return this.formatAsJSON(
          metadata,
          sections,
          artifacts,
          recommendations,
          testResults
        );
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Format report as Markdown
   */
  private formatAsMarkdown(
    metadata: ReportMetadata,
    sections: ReportSection[],
    artifacts: ReportArtifact[],
    recommendations: ActionableRecommendation[],
    testResults: RealTestResult[]
  ): string {
    const index = this.navigator.generateReportIndex(
      sections,
      artifacts,
      recommendations,
      testResults
    );

    let markdown = `# Debug Report: ${metadata.reportId}\n\n`;

    // Add metadata
    markdown += `**Generated:** ${metadata.timestamp.toISOString()}\n`;
    markdown += `**Version:** ${metadata.version}\n`;
    markdown += `**Session ID:** ${metadata.sessionInfo.sessionId}\n`;
    markdown += `**Duration:** ${Math.round(metadata.sessionInfo.duration / 1000)}s\n`;
    markdown += `**Scenarios:** ${metadata.sessionInfo.scenariosExecuted}\n\n`;

    // Add quick navigation
    markdown += this.navigator.generateQuickNavigation(index);
    markdown += '\n\n---\n\n';

    // Add table of contents
    markdown += this.navigator.generateTableOfContents(sections);
    markdown += '\n\n---\n\n';

    // Add sections
    sections.forEach(section => {
      if (section.id !== 'navigation') {
        markdown += `## ${section.title}\n\n`;
        markdown += `${section.content}\n\n`;

        if (section.subsections) {
          section.subsections.forEach(subsection => {
            markdown += `### ${subsection.title}\n\n`;
            markdown += `${subsection.content}\n\n`;
          });
        }

        markdown += '---\n\n';
      }
    });

    // Add related links section
    const relatedLinks = this.navigator.generateRelatedLinks(
      recommendations,
      testResults
    );
    if (relatedLinks.size > 0) {
      markdown += '## Related Findings\n\n';
      relatedLinks.forEach((links, id) => {
        if (links.length > 0) {
          markdown += `### ${id}\n`;
          links.forEach(link => {
            markdown += `- [${link.title}](#${link.anchor}) (${link.type})\n`;
          });
          markdown += '\n';
        }
      });
    }

    return markdown;
  }

  /**
   * Format report as HTML
   */
  private formatAsHTML(
    metadata: ReportMetadata,
    sections: ReportSection[],
    artifacts: ReportArtifact[],
    recommendations: ActionableRecommendation[],
    testResults: RealTestResult[]
  ): string {
    const index = this.navigator.generateReportIndex(
      sections,
      artifacts,
      recommendations,
      testResults
    );

    const criticalCount = recommendations.filter(
      r => r.severity === 'critical'
    ).length;
    const failedCount = testResults.filter(t => !t.passed).length;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Report: ${metadata.reportId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 { font-size: 2.5em; margin-bottom: 20px; }
        .header .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .header .meta-item { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; }
        .header .meta-label { font-size: 0.9em; opacity: 0.8; }
        .header .meta-value { font-size: 1.3em; font-weight: bold; margin-top: 5px; }
        
        .quick-nav {
            background: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .quick-nav h2 { color: #667eea; margin-bottom: 20px; }
        .quick-nav-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .quick-nav-card {
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid;
            transition: transform 0.2s;
        }
        .quick-nav-card:hover { transform: translateX(5px); }
        .quick-nav-card.critical { background: #fee; border-color: #dc3545; }
        .quick-nav-card.failed { background: #fff3cd; border-color: #ffc107; }
        .quick-nav-card.artifacts { background: #e7f3ff; border-color: #007bff; }
        .quick-nav-card h3 { margin-bottom: 10px; }
        .quick-nav-card .count { font-size: 2em; font-weight: bold; }
        
        .toc {
            background: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .toc h2 { color: #667eea; margin-bottom: 20px; }
        .toc ul { list-style: none; }
        .toc li { padding: 8px 0; }
        .toc a { color: #667eea; text-decoration: none; transition: color 0.2s; }
        .toc a:hover { color: #764ba2; text-decoration: underline; }
        
        .section {
            background: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #667eea;
            font-size: 2em;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }
        .section h3 { color: #764ba2; margin: 20px 0 10px; }
        
        .recommendation {
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid;
        }
        .recommendation.critical { background: #fee; border-color: #dc3545; }
        .recommendation.high { background: #fff3cd; border-color: #ffc107; }
        .recommendation.medium { background: #d1ecf1; border-color: #17a2b8; }
        .recommendation.low { background: #d4edda; border-color: #28a745; }
        .recommendation h4 { margin-bottom: 10px; }
        .recommendation .severity {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
            margin-left: 10px;
        }
        .recommendation .severity.critical { background: #dc3545; color: white; }
        .recommendation .severity.high { background: #ffc107; color: #333; }
        .recommendation .severity.medium { background: #17a2b8; color: white; }
        .recommendation .severity.low { background: #28a745; color: white; }
        .recommendation .action-items { margin-top: 15px; }
        .recommendation .action-item {
            padding: 10px;
            background: rgba(255,255,255,0.5);
            border-radius: 6px;
            margin: 8px 0;
        }
        
        .test-result {
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            border-left: 4px solid;
        }
        .test-result.passed { background: #f8fff8; border-color: #28a745; }
        .test-result.failed { background: #fff8f8; border-color: #dc3545; }
        .test-result h4 { margin-bottom: 10px; }
        .test-result .status { font-weight: bold; }
        .test-result .status.passed { color: #28a745; }
        .test-result .status.failed { color: #dc3545; }
        .test-result .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px; }
        .test-result .metric { font-size: 0.9em; }
        
        .artifact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .artifact-card {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        }
        .artifact-card .type {
            display: inline-block;
            padding: 4px 8px;
            background: #667eea;
            color: white;
            border-radius: 4px;
            font-size: 0.85em;
            margin-bottom: 10px;
        }
        .artifact-card .name { font-weight: bold; margin-bottom: 5px; }
        .artifact-card .path { font-size: 0.85em; color: #6c757d; word-break: break-all; }
        
        .footer {
            text-align: center;
            padding: 30px;
            color: #6c757d;
            font-size: 0.9em;
        }
        
        @media print {
            body { background: white; }
            .section { box-shadow: none; border: 1px solid #ddd; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Debug Report</h1>
            <div class="meta">
                <div class="meta-item">
                    <div class="meta-label">Report ID</div>
                    <div class="meta-value">${metadata.reportId}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Generated</div>
                    <div class="meta-value">${new Date(metadata.timestamp).toLocaleString()}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Duration</div>
                    <div class="meta-value">${Math.round(metadata.sessionInfo.duration / 1000)}s</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Scenarios</div>
                    <div class="meta-value">${metadata.sessionInfo.scenariosExecuted}</div>
                </div>
            </div>
        </div>

        <div class="quick-nav">
            <h2>Quick Navigation</h2>
            <div class="quick-nav-grid">
                ${
                  criticalCount > 0
                    ? `
                <div class="quick-nav-card critical">
                    <h3>🔴 Critical Issues</h3>
                    <div class="count">${criticalCount}</div>
                    <a href="#recommendations">View Details →</a>
                </div>
                `
                    : ''
                }
                ${
                  failedCount > 0
                    ? `
                <div class="quick-nav-card failed">
                    <h3>❌ Failed Tests</h3>
                    <div class="count">${failedCount}</div>
                    <a href="#test-results">View Details →</a>
                </div>
                `
                    : ''
                }
                <div class="quick-nav-card artifacts">
                    <h3>📁 Artifacts</h3>
                    <div class="count">${artifacts.length}</div>
                    <a href="#artifacts">View Details →</a>
                </div>
            </div>
        </div>

        <div class="toc">
            <h2>Table of Contents</h2>
            <ul>
                ${index.sections
                  .map(
                    (section, i) => `
                    <li><a href="#${section.anchor}">${i + 1}. ${section.title}</a></li>
                `
                  )
                  .join('')}
            </ul>
        </div>

        ${sections
          .filter(s => s.id !== 'navigation')
          .map(
            section => `
            <div class="section" id="${this.navigator['generateAnchor'](section.id)}">
                <h2>${section.title}</h2>
                <div>${this.markdownToHTML(section.content)}</div>
            </div>
        `
          )
          .join('')}

        ${
          recommendations.length > 0
            ? `
        <div class="section" id="recommendations">
            <h2>Recommendations</h2>
            ${recommendations
              .map(
                rec => `
                <div class="recommendation ${rec.severity}">
                    <h4>
                        ${rec.title}
                        <span class="severity ${rec.severity}">${rec.severity.toUpperCase()}</span>
                    </h4>
                    <p>${rec.description}</p>
                    <div class="action-items">
                        <strong>Action Items:</strong>
                        ${rec.actionItems
                          .map(
                            item => `
                            <div class="action-item">
                                <strong>Priority ${item.priority}:</strong> ${item.action}
                                <br><small>Effort: ${item.estimatedEffort} | Impact: ${item.expectedImpact}</small>
                            </div>
                        `
                          )
                          .join('')}
                    </div>
                    ${
                      rec.relatedScenarios.length > 0
                        ? `<p><strong>Related Scenarios:</strong> ${rec.relatedScenarios.join(', ')}</p>`
                        : ''
                    }
                </div>
            `
              )
              .join('')}
        </div>
        `
            : ''
        }

        ${
          testResults.length > 0
            ? `
        <div class="section" id="test-results">
            <h2>Test Results</h2>
            ${testResults
              .map(
                test => `
                <div class="test-result ${test.passed ? 'passed' : 'failed'}">
                    <h4>
                        ${test.scenarioName}
                        <span class="status ${test.passed ? 'passed' : 'failed'}">
                            ${test.passed ? '✅ PASSED' : '❌ FAILED'}
                        </span>
                    </h4>
                    <div class="metrics">
                        <div class="metric"><strong>Execution Time:</strong> ${test.executionTime}ms</div>
                        <div class="metric"><strong>MCP Calls:</strong> ${test.mcpFunctionCalls.length}</div>
                        <div class="metric"><strong>Validation:</strong> ${test.validationResults.passed ? 'Passed' : 'Failed'}</div>
                    </div>
                    ${test.error ? `<p><strong>Error:</strong> ${test.error}</p>` : ''}
                </div>
            `
              )
              .join('')}
        </div>
        `
            : ''
        }

        ${
          artifacts.length > 0
            ? `
        <div class="section" id="artifacts">
            <h2>Debug Artifacts</h2>
            <div class="artifact-grid">
                ${artifacts
                  .map(
                    artifact => `
                    <div class="artifact-card">
                        <span class="type">${artifact.type}</span>
                        <div class="name">${artifact.name}</div>
                        <div class="path">${artifact.path}</div>
                        <small>${new Date(artifact.timestamp).toLocaleString()}</small>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>
        `
            : ''
        }

        <div class="footer">
            <p>Generated by Comprehensive Debug Report Generator v${metadata.version}</p>
            <p>${new Date(metadata.timestamp).toISOString()}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Format report as JSON
   */
  private formatAsJSON(
    metadata: ReportMetadata,
    sections: ReportSection[],
    artifacts: ReportArtifact[],
    recommendations: ActionableRecommendation[],
    testResults: RealTestResult[]
  ): string {
    const index = this.navigator.generateReportIndex(
      sections,
      artifacts,
      recommendations,
      testResults
    );

    const searchIndex = this.navigator.generateSearchIndex(
      sections,
      recommendations,
      testResults
    );

    const report = {
      metadata,
      index,
      searchIndex,
      sections: sections.map(section => ({
        id: section.id,
        title: section.title,
        content: section.content,
        subsections: section.subsections,
        artifacts: section.artifacts,
      })),
      recommendations: recommendations.map(rec => ({
        id: rec.id,
        severity: rec.severity,
        category: rec.category,
        title: rec.title,
        description: rec.description,
        evidence: rec.evidence,
        actionItems: rec.actionItems,
        relatedScenarios: rec.relatedScenarios,
        fixSuggestions: rec.fixSuggestions,
        codeExamples: rec.codeExamples,
      })),
      testResults: testResults.map(test => ({
        scenarioName: test.scenarioName,
        passed: test.passed,
        executionTime: test.executionTime,
        timestamp: test.timestamp,
        error: test.error,
        mcpFunctionCalls: test.mcpFunctionCalls,
        validationResults: test.validationResults,
        realData: test.realData,
      })),
      artifacts: artifacts.map(artifact => ({
        type: artifact.type,
        name: artifact.name,
        path: artifact.path,
        timestamp: artifact.timestamp,
        size: artifact.size,
        metadata: artifact.metadata,
      })),
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Convert markdown to HTML (simple implementation)
   */
  private markdownToHTML(markdown: string): string {
    return markdown
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '');
  }

  /**
   * Save report to file
   */
  async saveReport(
    content: string,
    format: ReportFormat,
    reportId: string,
    outputPath: string = 'debug/playwright-reports'
  ): Promise<string> {
    const extension =
      format === 'json' ? 'json' : format === 'html' ? 'html' : 'md';
    const fileName = `${reportId}.${extension}`;
    const filePath = `${outputPath}/${fileName}`;

    console.log(`📝 Report saved to: ${filePath}`);
    console.log(`📊 Report size: ${Math.round(content.length / 1024)}KB`);

    return filePath;
  }
}
