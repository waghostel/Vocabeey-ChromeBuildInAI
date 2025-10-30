/**
 * Test Real Debug Data Aggregator
 * Tests the real debug data aggregation functionality
 */

import { RealDebugDataAggregator } from './reports/real-debug-data-aggregator';

import { RealTestResult } from './scenarios/real-test-scenario-executor';
import { RealDebugReport } from './reports/real-debug-report-generator';

import { describe, it, expect } from 'vitest';

describe('Real Debug Data Aggregator', () => {
  it('should aggregate real debugging data correctly', async () => {
    console.log('Testing Real Debug Data Aggregator...');

    // Create mock MCP connection manager
    const mcpConnectionManager = {} as any;

    // Create aggregator
    const aggregator = new RealDebugDataAggregator(mcpConnectionManager);

    // Create sample test results with real data structure
    const sampleTestResults: RealTestResult[] = [
      {
        scenarioName: 'service-worker-debugging',
        passed: true,
        error: undefined,
        executionTime: 2500,
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        metrics: {
          memoryUsage: 15,
          mcpCalls: 2,
          validationScore: 1.0,
        },
        realData: {
          memoryStatus: {
            usedJSHeapSize: 15 * 1024 * 1024, // 15MB
            totalJSHeapSize: 20 * 1024 * 1024,
            jsHeapSizeLimit: 100 * 1024 * 1024,
          },
        },
        mcpFunctionCalls: [
          {
            functionName: 'mcp_chrome_devtools_list_pages',
            params: {},
            result: { pages: [{ id: 1, url: 'chrome-extension://test' }] },
            executionTime: 500,
          },
          {
            functionName: 'mcp_chrome_devtools_select_page',
            params: { pageIdx: 0 },
            result: { success: true },
            executionTime: 300,
          },
        ],
        validationResults: {
          passed: true,
          details: [
            'Service worker connection successful',
            'Console messages captured',
          ],
        },
      },
      {
        scenarioName: 'content-script-debugging',
        passed: false,
        error: 'Navigation timeout after 10 seconds',
        executionTime: 12000,
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        metrics: {
          memoryUsage: 25,
          mcpCalls: 1,
          validationScore: 0.0,
          timeoutCount: 1,
        },
        realData: {
          memoryStatus: {
            usedJSHeapSize: 25 * 1024 * 1024, // 25MB
            totalJSHeapSize: 30 * 1024 * 1024,
            jsHeapSizeLimit: 100 * 1024 * 1024,
          },
        },
        mcpFunctionCalls: [
          {
            functionName: 'mcp_chrome_devtools_navigate_page',
            params: { url: 'https://example.com' },
            result: null,
            executionTime: 11000,
            error: 'Navigation timeout after 10 seconds',
          },
        ],
        validationResults: {
          passed: false,
          details: [
            'Navigation failed',
            'Content script injection not verified',
          ],
        },
      },
      {
        scenarioName: 'service-worker-debugging',
        passed: true,
        error: undefined,
        executionTime: 3200,
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
        metrics: {
          memoryUsage: 18,
          mcpCalls: 2,
          validationScore: 1.0,
        },
        realData: {
          memoryStatus: {
            usedJSHeapSize: 18 * 1024 * 1024, // 18MB
            totalJSHeapSize: 22 * 1024 * 1024,
            jsHeapSizeLimit: 100 * 1024 * 1024,
          },
        },
        mcpFunctionCalls: [
          {
            functionName: 'mcp_chrome_devtools_list_pages',
            params: {},
            result: { pages: [{ id: 1, url: 'chrome-extension://test' }] },
            executionTime: 600,
          },
          {
            functionName: 'mcp_chrome_devtools_list_console_messages',
            params: {},
            result: {
              messages: [{ level: 'info', text: 'Service worker started' }],
            },
            executionTime: 800,
          },
        ],
        validationResults: {
          passed: true,
          details: [
            'Service worker connection successful',
            'Console messages captured',
          ],
        },
      },
    ];

    // Create sample debug report
    const sampleReport: RealDebugReport = {
      reportId: 'test-report-1',
      timestamp: new Date(),
      sessionId: 'test-session-1',
      mcpConnectionStatus: {
        connected: true,
        healthy: true,
        latency: 150,
        availableFunctions: 8,
        errors: [],
      },
      realTestResults: sampleTestResults,
      realPerformanceMetrics: {
        totalExecutionTime: 17700,
        averageExecutionTime: 5900,
        mcpCallStatistics: {
          totalCalls: 5,
          averageCallTime: 560,
          functionUsage: new Map([
            ['mcp_chrome_devtools_list_pages', { calls: 2, avgTime: 550 }],
            ['mcp_chrome_devtools_select_page', { calls: 1, avgTime: 300 }],
            [
              'mcp_chrome_devtools_list_console_messages',
              { calls: 1, avgTime: 800 },
            ],
            ['mcp_chrome_devtools_navigate_page', { calls: 1, avgTime: 11000 }],
          ]),
        },
        realMemoryUsage: {
          peak: 25,
          average: 19.3,
          trend: 'stable',
        },
        realResourceUtilization: {
          extensionContexts: 3,
          activePages: 2,
          networkRequests: 15,
        },
      },
      realRecommendations: [
        {
          type: 'performance',
          severity: 'high',
          title: 'Increase navigation timeout',
          description: 'Consider increasing timeout for slow-loading pages',
          realDataEvidence: {
            timeoutCount: 1,
            averageNavigationTime: 11000,
          },
          actionItems: [
            'Increase navigation timeout from 10s to 30s',
            'Add retry logic for failed navigations',
          ],
          relatedScenarios: ['content-script-debugging'],
          mcpFunctionImpact: ['mcp_chrome_devtools_navigate_page'],
        },
      ],
      realSummary: {
        overallStatus: 'warning',
        criticalIssues: 0,
        totalRecommendations: 1,
        executionDuration: 17700,
        scenariosExecuted: 3,
        mcpIntegrationHealth: 'good',
        realDataQuality: 'high',
      },
      realInsights: {
        extensionHealthScore: 0.75,
        mcpIntegrationScore: 0.95,
        performanceScore: 0.7,
        reliabilityScore: 0.67,
        keyFindings: [
          'Navigation timeout detected in content script debugging',
          'Memory usage is stable across test executions',
          'MCP connection is healthy with good latency',
        ],
        trendAnalysis: {
          performance: 'stable',
          reliability: 'stable',
          mcpStability: 'stable',
        },
      },
    };

    // Add data to aggregator
    console.log('Adding report to aggregator (which includes test results)...');
    // Only add the report, which will automatically include the test results
    // Don't add test results separately to avoid duplication
    aggregator.addRealReport(sampleReport);

    // Test aggregation
    console.log('Aggregating data...');
    const aggregatedData = aggregator.aggregateRealData();

    // Display results
    console.log('\n=== Aggregation Results ===');
    console.log(
      `Time Range: ${aggregatedData.timeRange.start.toISOString()} to ${aggregatedData.timeRange.end.toISOString()}`
    );
    console.log(`Total Test Results: ${aggregatedData.realTestResults.total}`);
    console.log(`Passed: ${aggregatedData.realTestResults.passed}`);
    console.log(`Failed: ${aggregatedData.realTestResults.failed}`);
    console.log(`Validated: ${aggregatedData.realTestResults.validated}`);

    console.log('\n=== Performance Metrics ===');
    console.log(
      `Average Execution Time: ${aggregatedData.realPerformance.executionTimes.average.toFixed(2)}ms`
    );
    console.log(
      `Total MCP Calls: ${aggregatedData.realPerformance.mcpPerformance.totalCalls}`
    );
    console.log(
      `Average MCP Call Time: ${aggregatedData.realPerformance.mcpPerformance.averageCallTime.toFixed(2)}ms`
    );
    console.log(
      `Error Rate: ${(aggregatedData.realPerformance.errorRate * 100).toFixed(1)}%`
    );

    console.log('\n=== Memory Usage ===');
    console.log(
      `Average Memory: ${aggregatedData.realPerformance.realMemoryUsage.average.toFixed(2)}MB`
    );
    console.log(
      `Memory Trend: ${aggregatedData.realPerformance.realMemoryUsage.trend}`
    );
    console.log(
      `Memory Leak Indicators: ${aggregatedData.realPerformance.realMemoryUsage.leakIndicators.length}`
    );

    console.log('\n=== Issues Found ===');
    console.log(
      `Recurring Issues: ${aggregatedData.realIssues.recurring.length}`
    );
    console.log(`MCP Issues: ${aggregatedData.realIssues.mcpIssues.length}`);
    console.log(`Trends: ${aggregatedData.realIssues.trends.length}`);

    console.log('\n=== Recommendations ===');
    console.log(
      `Priority Recommendations: ${aggregatedData.realRecommendations.priority.length}`
    );
    aggregatedData.realRecommendations.priority.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.impact.toUpperCase()}] ${rec.title}`);
      console.log(`     ${rec.description}`);
      console.log(
        `     Affected Scenarios: ${rec.affectedScenarios.join(', ')}`
      );
    });

    // Test aggregation stats
    console.log('\n=== Aggregation Stats ===');
    const stats = aggregator.getAggregationStats();
    console.log(`Total Reports: ${stats.totalReports}`);
    console.log(`Total Test Results: ${stats.totalTestResults}`);
    console.log(
      `Time Span: ${stats.timeSpan.start?.toISOString()} to ${stats.timeSpan.end?.toISOString()}`
    );
    console.log(
      `MCP Connection Manager: ${stats.mcpConnectionManager ? 'Available' : 'Not Available'}`
    );

    console.log('\n✅ Real Debug Data Aggregator test completed successfully!');

    // Verify the aggregation worked
    expect(aggregatedData.realTestResults.total).toBe(3);
    expect(aggregatedData.realTestResults.passed).toBe(2);
    expect(aggregatedData.realTestResults.failed).toBe(1);
    expect(
      aggregatedData.realPerformance.mcpPerformance.totalCalls
    ).toBeGreaterThan(0);
    expect(aggregatedData.realRecommendations.priority.length).toBeGreaterThan(
      0
    );
  });
});
