/**
 * Workflow Test Scenarios Index
 *
 * Central export point for all workflow test scenarios.
 * Combines scenarios from multiple files for easy import.
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { TestScenario, TestResult } from '../types/debug-types';
import {
  ArticleExtractionTestScenario,
  VocabularyWorkflowTestScenario,
  SentenceModeTestScenario,
} from './workflow-test-scenarios';
import {
  TTSFunctionalityTestScenario,
  SettingsConfigurationTestScenario,
} from './workflow-test-scenarios-part2';

/**
 * All workflow test scenarios
 */
export const allWorkflowTestScenarios: TestScenario[] = [
  new ArticleExtractionTestScenario(),
  new VocabularyWorkflowTestScenario(),
  new SentenceModeTestScenario(),
  new TTSFunctionalityTestScenario(),
  new SettingsConfigurationTestScenario(),
];

/**
 * Get scenario by name
 */
export function getWorkflowScenario(name: string): TestScenario | undefined {
  return allWorkflowTestScenarios.find(scenario => scenario.name === name);
}

/**
 * Get scenarios by category
 */
export function getWorkflowScenariosByCategory(
  category: string
): TestScenario[] {
  return allWorkflowTestScenarios.filter(
    scenario => scenario.category === category
  );
}

/**
 * Get all scenario names
 */
export function getAllWorkflowScenarioNames(): string[] {
  return allWorkflowTestScenarios.map(scenario => scenario.name);
}

/**
 * Get all scenario categories
 */
export function getAllWorkflowCategories(): string[] {
  const categories = new Set(
    allWorkflowTestScenarios
      .map(s => s.category)
      .filter((c): c is string => c !== undefined)
  );
  return Array.from(categories);
}

/**
 * Execute all workflow scenarios sequentially
 */
export async function executeAllWorkflowScenarios(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('\n========================================');
  console.log('  Workflow Test Scenarios Execution');
  console.log('========================================\n');

  for (const scenario of allWorkflowTestScenarios) {
    console.log(`\n=== Executing ${scenario.name} ===`);
    console.log(`Category: ${scenario.category}`);
    console.log(`Priority: ${scenario.priority}`);
    console.log(`Timeout: ${scenario.timeout}ms\n`);

    try {
      await scenario.setup();
      const result = await scenario.execute();
      results.push(result);
      await scenario.cleanup();

      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`\n${status} - ${scenario.name}`);
      console.log(
        `Execution Time: ${(result.executionTime / 1000).toFixed(2)}s\n`
      );
    } catch (error) {
      console.error(`\n❌ FAILED - ${scenario.name}`);
      console.error(
        `Error: ${error instanceof Error ? error.message : String(error)}\n`
      );

      results.push({
        passed: false,
        scenarioName: scenario.name,
        executionTime: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metrics: {},
      });
    }
  }

  console.log('\n========================================');
  console.log('  Execution Complete');
  console.log('========================================\n');

  return results;
}

/**
 * Execute scenarios by category
 */
export async function executeWorkflowScenariosByCategory(
  category: string
): Promise<TestResult[]> {
  const scenarios = getWorkflowScenariosByCategory(category);
  const results: TestResult[] = [];

  console.log(`\n=== Executing ${category} Scenarios ===\n`);

  for (const scenario of scenarios) {
    console.log(`\nExecuting: ${scenario.name}`);

    try {
      await scenario.setup();
      const result = await scenario.execute();
      results.push(result);
      await scenario.cleanup();

      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} - ${scenario.name}\n`);
    } catch (error) {
      console.error(`❌ FAILED - ${scenario.name}`);
      console.error(`Error: ${error}\n`);

      results.push({
        passed: false,
        scenarioName: scenario.name,
        executionTime: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metrics: {},
      });
    }
  }

  return results;
}

/**
 * Execute specific scenario by name
 */
export async function executeWorkflowScenario(
  name: string
): Promise<TestResult | null> {
  const scenario = getWorkflowScenario(name);

  if (!scenario) {
    console.error(`Scenario not found: ${name}`);
    return null;
  }

  console.log(`\n=== Executing ${scenario.name} ===\n`);

  try {
    await scenario.setup();
    const result = await scenario.execute();
    await scenario.cleanup();

    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`\n${status} - ${scenario.name}\n`);

    return result;
  } catch (error) {
    console.error(`\n❌ FAILED - ${scenario.name}`);
    console.error(`Error: ${error}\n`);

    return {
      passed: false,
      scenarioName: scenario.name,
      executionTime: 0,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : String(error),
      metrics: {},
    };
  }
}

/**
 * Generate summary report for workflow test results
 */
export function generateWorkflowTestSummary(results: TestResult[]): string {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);
  const avgTime = totalTests > 0 ? totalTime / totalTests : 0;

  let summary = '# Workflow Test Summary\n\n';
  summary += `**Generated:** ${new Date().toISOString()}\n\n`;
  summary += `## Overall Results\n\n`;
  summary += `- **Total Tests:** ${totalTests}\n`;
  summary += `- **Passed:** ${passedTests} ✅\n`;
  summary += `- **Failed:** ${failedTests} ❌\n`;
  summary += `- **Success Rate:** ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%\n`;
  summary += `- **Total Execution Time:** ${(totalTime / 1000).toFixed(2)}s\n`;
  summary += `- **Average Execution Time:** ${(avgTime / 1000).toFixed(2)}s\n\n`;

  // Group by category
  const byCategory = new Map<string, TestResult[]>();
  results.forEach(result => {
    const scenario = allWorkflowTestScenarios.find(
      s => s.name === result.scenarioName
    );
    const category = scenario?.category || 'Unknown';

    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }
    byCategory.get(category)!.push(result);
  });

  summary += '## Results by Category\n\n';
  byCategory.forEach((categoryResults, category) => {
    const passed = categoryResults.filter(r => r.passed).length;
    const total = categoryResults.length;
    summary += `### ${category}\n`;
    summary += `- Tests: ${total}\n`;
    summary += `- Passed: ${passed}\n`;
    summary += `- Success Rate: ${((passed / total) * 100).toFixed(1)}%\n\n`;
  });

  summary += '## Detailed Test Results\n\n';
  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    const scenario = allWorkflowTestScenarios.find(
      s => s.name === result.scenarioName
    );

    summary += `### ${result.scenarioName} - ${status}\n\n`;
    summary += `- **Category:** ${scenario?.category || 'Unknown'}\n`;
    summary += `- **Execution Time:** ${(result.executionTime / 1000).toFixed(2)}s\n`;
    summary += `- **Timestamp:** ${result.timestamp.toISOString()}\n`;

    if (result.error) {
      summary += `- **Error:** ${result.error}\n`;
    }

    if (result.metrics.totalSteps) {
      summary += `- **Total Steps:** ${result.metrics.totalSteps}\n`;
    }

    if (
      result.metrics.screenshots &&
      Array.isArray(result.metrics.screenshots)
    ) {
      summary += `- **Screenshots:** ${result.metrics.screenshots.length}\n`;
    }

    if (result.metrics.snapshots && Array.isArray(result.metrics.snapshots)) {
      summary += `- **Snapshots:** ${result.metrics.snapshots.length}\n`;
    }

    if (
      result.metrics.interactions &&
      Array.isArray(result.metrics.interactions)
    ) {
      summary += `- **Interactions:** ${result.metrics.interactions.length}\n`;
    }

    if (result.metrics.reportPath) {
      summary += `- **Report:** ${result.metrics.reportPath}\n`;
    }

    summary += '\n';
  });

  // Add recommendations section
  summary += '## Recommendations\n\n';

  if (failedTests > 0) {
    summary += '### Failed Tests\n\n';
    results
      .filter(r => !r.passed)
      .forEach(result => {
        summary += `- **${result.scenarioName}:** ${result.error || 'Unknown error'}\n`;
      });
    summary += '\n';
  }

  summary += '### Next Steps\n\n';
  summary += '1. Review failed test details and error messages\n';
  summary += '2. Check screenshots and snapshots for visual issues\n';
  summary += '3. Examine console logs for runtime errors\n';
  summary += '4. Verify extension functionality manually if needed\n';
  summary += '5. Re-run failed tests after fixes\n\n';

  return summary;
}

/**
 * Export scenario classes for direct instantiation
 */
export {
  ArticleExtractionTestScenario,
  VocabularyWorkflowTestScenario,
  SentenceModeTestScenario,
  TTSFunctionalityTestScenario,
  SettingsConfigurationTestScenario,
};
