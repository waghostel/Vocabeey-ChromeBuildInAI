/**
 * Comprehensive Report Generator Example
 * Demonstrates how to use the comprehensive debugging report generator
 */

import {
  ComprehensiveReportGenerator,
  ReportAggregator,
  RecommendationAnalyzer,
  ReportNavigator,
  ReportFormatter,
  ReportFormat,
} from './reports/comprehensive-report-generator';
import { RealDebugReportGenerator } from './reports/real-debug-report-generator';
import { MCPConnectionManager } from './utils/mcp-connection-manager';
import { RealTestScenarioExecutor } from './scenarios/real-test-scenario-executor';

/**
 * Example: Generate comprehensive debug report
 */
async function generateComprehensiveReport() {
  console.log('🚀 Starting comprehensive report generation...\n');

  // Initialize components
  const mcpConnectionManager = new MCPConnectionManager();
  const realReportGenerator = new RealDebugReportGenerator(
    mcpConnectionManager
  );
  const comprehensiveGenerator = new ComprehensiveReportGenerator();
  const aggregator = new ReportAggregator();
  const recommendationAnalyzer = new RecommendationAnalyzer();
  const formatter = new ReportFormatter();

  try {
    // Step 1: Execute test scenarios (example - would normally come from test execution)
    console.log('📋 Step 1: Collecting test results...');
    const testExecutor = new RealTestScenarioExecutor(mcpConnectionManager);

    // Example test scenarios (in real usage, these would be executed)
    const testResults = [
      // These would be actual test results from scenario execution
    ];

    // Step 2: Generate real debug report
    console.log('📊 Step 2: Generating real debug report...');
    const sessionId = `session-${Date.now()}`;
    const realReport = realReportGenerator.generateRealReport(
      sessionId,
      testResults
    );

    // Step 3: Collect and aggregate artifacts
    console.log('📁 Step 3: Aggregating artifacts...');
    const artifacts = aggregator.collectArtifactsFromResults(
      testResults,
      'debug/playwright-reports'
    );
    aggregator.addTestResults(testResults);
    aggregator.addArtifacts(artifacts);

    // Step 4: Generate actionable recommendations
    console.log('💡 Step 4: Analyzing and generating recommendations...');
    const recommendations =
      recommendationAnalyzer.analyzeAndGenerateRecommendations(
        testResults,
        realReport.realPerformanceMetrics,
        realReport.mcpConnectionStatus
      );

    // Step 5: Generate comprehensive report structure
    console.log('📝 Step 5: Building comprehensive report structure...');
    const comprehensiveReport =
      comprehensiveGenerator.generateComprehensiveReport(
        realReport,
        'comprehensive',
        artifacts
      );

    // Step 6: Format report in multiple formats
    console.log('🎨 Step 6: Formatting report in multiple formats...\n');

    // Format as Markdown
    const markdownReport = formatter.formatReport(
      comprehensiveReport.metadata,
      comprehensiveReport.sections,
      comprehensiveReport.artifacts,
      recommendations,
      testResults,
      'markdown'
    );
    const markdownPath = await formatter.saveReport(
      markdownReport,
      'markdown',
      realReport.reportId
    );
    console.log(`✅ Markdown report: ${markdownPath}`);

    // Format as HTML
    const htmlReport = formatter.formatReport(
      comprehensiveReport.metadata,
      comprehensiveReport.sections,
      comprehensiveReport.artifacts,
      recommendations,
      testResults,
      'html'
    );
    const htmlPath = await formatter.saveReport(
      htmlReport,
      'html',
      realReport.reportId
    );
    console.log(`✅ HTML report: ${htmlPath}`);

    // Format as JSON
    const jsonReport = formatter.formatReport(
      comprehensiveReport.metadata,
      comprehensiveReport.sections,
      comprehensiveReport.artifacts,
      recommendations,
      testResults,
      'json'
    );
    const jsonPath = await formatter.saveReport(
      jsonReport,
      'json',
      realReport.reportId
    );
    console.log(`✅ JSON report: ${jsonPath}`);

    // Step 7: Display summary
    console.log('\n📊 Report Summary:');
    console.log(`   Report ID: ${realReport.reportId}`);
    console.log(`   Status: ${realReport.realSummary.overallStatus}`);
    console.log(`   Scenarios: ${realReport.realSummary.scenariosExecuted}`);
    console.log(`   Critical Issues: ${realReport.realSummary.criticalIssues}`);
    console.log(`   Recommendations: ${recommendations.length}`);
    console.log(`   Artifacts: ${artifacts.length}`);
    console.log(
      `   MCP Health: ${realReport.realSummary.mcpIntegrationHealth}`
    );

    // Step 8: Display aggregated statistics
    const stats = aggregator.getAggregatedStatistics();
    console.log('\n📈 Aggregated Statistics:');
    console.log(`   Total Tests: ${stats.totalTests}`);
    console.log(`   Passed: ${stats.passedTests}`);
    console.log(`   Failed: ${stats.failedTests}`);
    console.log(
      `   Success Rate: ${Math.round((stats.passedTests / stats.totalTests) * 100)}%`
    );
    console.log(
      `   Avg Execution Time: ${Math.round(stats.averageExecutionTime)}ms`
    );

    console.log('\n✅ Comprehensive report generation completed!\n');

    return {
      realReport,
      comprehensiveReport,
      recommendations,
      artifacts,
      formats: {
        markdown: markdownPath,
        html: htmlPath,
        json: jsonPath,
      },
    };
  } catch (error) {
    console.error('❌ Error generating comprehensive report:', error);
    throw error;
  }
}

/**
 * Example: Generate report with custom template
 */
async function generateCustomTemplateReport() {
  console.log('🎨 Generating report with custom template...\n');

  const generator = new ComprehensiveReportGenerator();

  // Get available templates
  const templates = generator.getAvailableTemplates();
  console.log('📋 Available templates:', templates);

  // Use performance-focused template
  const template = generator.getTemplate('performance');
  console.log(`\n📊 Using template: ${template?.name}`);
  console.log(`   Sections: ${template?.sections.join(', ')}`);

  // Generate report with custom template
  // (would use actual test data in real usage)
}

/**
 * Example: Generate navigation and index
 */
async function generateNavigationExample() {
  console.log('🧭 Generating navigation and index example...\n');

  const navigator = new ReportNavigator();

  // Example sections
  const sections = [
    {
      id: 'summary',
      title: 'Executive Summary',
      content: 'Report summary content...',
    },
    {
      id: 'test-results',
      title: 'Test Results',
      content: 'Test results content...',
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      content: 'Recommendations content...',
    },
  ];

  // Generate table of contents
  const toc = navigator.generateTableOfContents(sections);
  console.log('📑 Table of Contents:');
  console.log(toc);

  // Generate report index
  const index = navigator.generateReportIndex(sections, [], [], []);
  console.log('\n📇 Report Index:');
  console.log(`   Sections: ${index.sections.length}`);
  console.log(`   Artifacts: ${index.artifacts.length}`);
  console.log(`   Recommendations: ${index.recommendations.length}`);
  console.log(`   Test Results: ${index.testResults.length}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Comprehensive Debug Report Generator - Examples');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Example 1: Generate comprehensive report
    await generateComprehensiveReport();

    // Example 2: Custom template
    console.log('\n' + '═'.repeat(55) + '\n');
    await generateCustomTemplateReport();

    // Example 3: Navigation example
    console.log('\n' + '═'.repeat(55) + '\n');
    await generateNavigationExample();

    console.log('\n' + '═'.repeat(55));
    console.log('✅ All examples completed successfully!');
    console.log('═'.repeat(55) + '\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  generateComprehensiveReport,
  generateCustomTemplateReport,
  generateNavigationExample,
};
