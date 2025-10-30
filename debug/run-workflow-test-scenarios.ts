/**
 * Workflow Test Scenarios Runner
 *
 * Script to execute automated workflow test scenarios for the Chrome extension.
 * This provides a command-line interface to run individual scenarios, categories,
 * or the complete test suite.
 *
 * Usage:
 *   - Run all scenarios: ts-node debug/run-workflow-test-scenarios.ts
 *   - Run specific scenario: ts-node debug/run-workflow-test-scenarios.ts --scenario "Article Extraction Test"
 *   - Run by category: ts-node debug/run-workflow-test-scenarios.ts --category "User Interaction"
 *   - List scenarios: ts-node debug/run-workflow-test-scenarios.ts --list
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  allWorkflowTestScenarios,
  executeAllWorkflowScenarios,
  executeWorkflowScenariosByCategory,
  executeWorkflowScenario,
  generateWorkflowTestSummary,
  getAllWorkflowScenarioNames,
  getAllWorkflowCategories,
} from './scenarios/workflow-test-scenarios-index';

/**
 * Parse command line arguments
 */
function parseArgs(): {
  action: 'run-all' | 'run-scenario' | 'run-category' | 'list';
  scenario?: string;
  category?: string;
} {
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    return { action: 'list' };
  }

  const scenarioIndex = args.indexOf('--scenario');
  if (scenarioIndex !== -1 && args[scenarioIndex + 1]) {
    return {
      action: 'run-scenario',
      scenario: args[scenarioIndex + 1],
    };
  }

  const categoryIndex = args.indexOf('--category');
  if (categoryIndex !== -1 && args[categoryIndex + 1]) {
    return {
      action: 'run-category',
      category: args[categoryIndex + 1],
    };
  }

  return { action: 'run-all' };
}

/**
 * List all available scenarios and categories
 */
function listScenarios(): void {
  console.log('\n========================================');
  console.log('  Available Workflow Test Scenarios');
  console.log('========================================\n');

  const categories = getAllWorkflowCategories();

  categories.forEach(category => {
    console.log(`\n📁 ${category}`);
    console.log('─'.repeat(40));

    const scenarios = allWorkflowTestScenarios.filter(
      s => s.category === category
    );
    scenarios.forEach(scenario => {
      console.log(`  • ${scenario.name}`);
      console.log(`    ${scenario.description}`);
      console.log(
        `    Priority: ${scenario.priority} | Timeout: ${scenario.timeout}ms`
      );
    });
  });

  console.log('\n========================================');
  console.log(`Total Scenarios: ${allWorkflowTestScenarios.length}`);
  console.log(`Total Categories: ${categories.length}`);
  console.log('========================================\n');

  console.log('Usage Examples:');
  console.log('  Run all:        ts-node debug/run-workflow-test-scenarios.ts');
  console.log(
    '  Run scenario:   ts-node debug/run-workflow-test-scenarios.ts --scenario "Article Extraction Test"'
  );
  console.log(
    '  Run category:   ts-node debug/run-workflow-test-scenarios.ts --category "User Interaction"'
  );
  console.log(
    '  List scenarios: ts-node debug/run-workflow-test-scenarios.ts --list\n'
  );
}

/**
 * Save test results to file
 */
function saveResults(summary: string, filename: string): void {
  const reportDir = path.join(process.cwd(), 'debug', 'playwright-reports');

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filepath = path.join(reportDir, `${filename}-${timestamp}.md`);

  fs.writeFileSync(filepath, summary, 'utf-8');

  console.log(`\n📄 Report saved to: ${filepath}\n`);
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const config = parseArgs();

  try {
    switch (config.action) {
      case 'list':
        listScenarios();
        break;

      case 'run-scenario':
        if (!config.scenario) {
          console.error('Error: Scenario name required');
          process.exit(1);
        }

        console.log(`\n🚀 Running scenario: ${config.scenario}\n`);
        const scenarioResult = await executeWorkflowScenario(config.scenario);

        if (scenarioResult) {
          const summary = generateWorkflowTestSummary([scenarioResult]);
          console.log('\n' + summary);
          saveResults(
            summary,
            `workflow-scenario-${config.scenario.replace(/\s+/g, '-').toLowerCase()}`
          );
        } else {
          console.error(`\n❌ Scenario not found: ${config.scenario}\n`);
          console.log('Available scenarios:');
          getAllWorkflowScenarioNames().forEach(name =>
            console.log(`  - ${name}`)
          );
          process.exit(1);
        }
        break;

      case 'run-category':
        if (!config.category) {
          console.error('Error: Category name required');
          process.exit(1);
        }

        console.log(`\n🚀 Running category: ${config.category}\n`);
        const categoryResults = await executeWorkflowScenariosByCategory(
          config.category
        );

        if (categoryResults.length > 0) {
          const summary = generateWorkflowTestSummary(categoryResults);
          console.log('\n' + summary);
          saveResults(
            summary,
            `workflow-category-${config.category.replace(/\s+/g, '-').toLowerCase()}`
          );
        } else {
          console.error(
            `\n❌ No scenarios found in category: ${config.category}\n`
          );
          console.log('Available categories:');
          getAllWorkflowCategories().forEach(cat => console.log(`  - ${cat}`));
          process.exit(1);
        }
        break;

      case 'run-all':
      default:
        console.log('\n🚀 Running all workflow test scenarios\n');
        const allResults = await executeAllWorkflowScenarios();
        const summary = generateWorkflowTestSummary(allResults);
        console.log('\n' + summary);
        saveResults(summary, 'workflow-test-suite');

        // Exit with error code if any tests failed
        const failedCount = allResults.filter(r => !r.passed).length;
        if (failedCount > 0) {
          console.error(`\n❌ ${failedCount} test(s) failed\n`);
          process.exit(1);
        } else {
          console.log('\n✅ All tests passed!\n');
        }
        break;
    }
  } catch (error) {
    console.error('\n❌ Error executing workflow tests:');
    console.error(error);
    process.exit(1);
  }
}

// Execute main function
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as runWorkflowTestScenarios };
