/**
 * Test Scenario Manager
 * Manages test scenarios, their execution, and results
 */

import {
  TestScenario,
  TestResult,
  TestScenarioConfig,
  ScenarioCategory,
} from '../types/debug-types';
import { TestScenarioExecutor } from './test-scenario-executor';
import { TestResultValidator } from './test-result-validator';
import { DebugSessionManager } from '../session-manager/debug-session-manager';

export class TestScenarioManager {
  private executor: TestScenarioExecutor;
  private validator: TestResultValidator;
  private sessionManager: DebugSessionManager;
  private scenarioCategories: Map<string, ScenarioCategory> = new Map();
  private scheduledExecutions: Map<string, NodeJS.Timeout> = new Map();

  constructor(sessionManager: DebugSessionManager) {
    this.sessionManager = sessionManager;
    this.executor = new TestScenarioExecutor(sessionManager);
    this.validator = new TestResultValidator();

    this.initializeDefaultCategories();
    this.validator.autoRegisterDefaultCriteria();
  }

  /**
   * Initialize default scenario categories
   */
  private initializeDefaultCategories(): void {
    const categories: ScenarioCategory[] = [
      {
        name: 'Extension Lifecycle',
        description:
          'Tests for extension loading, initialization, and shutdown',
        priority: 1,
        scenarios: [],
      },
      {
        name: 'Content Processing',
        description: 'Tests for content extraction and processing',
        priority: 2,
        scenarios: [],
      },
      {
        name: 'AI Integration',
        description: 'Tests for AI service integration and processing',
        priority: 2,
        scenarios: [],
      },
      {
        name: 'UI Components',
        description: 'Tests for user interface components and interactions',
        priority: 3,
        scenarios: [],
      },
      {
        name: 'Storage & Caching',
        description: 'Tests for data storage and caching systems',
        priority: 3,
        scenarios: [],
      },
      {
        name: 'Performance',
        description: 'Tests for performance and resource usage',
        priority: 4,
        scenarios: [],
      },
      {
        name: 'Integration',
        description: 'Tests for cross-component integration',
        priority: 5,
        scenarios: [],
      },
    ];

    categories.forEach(category => {
      this.scenarioCategories.set(category.name, category);
    });
  }

  /**
   * Register a test scenario with category assignment
   */
  registerScenario(scenario: TestScenario, categoryName?: string): void {
    this.executor.registerScenario(scenario);

    // Auto-assign category if not specified
    if (!categoryName) {
      categoryName = this.autoAssignCategory(scenario);
    }

    const category = this.scenarioCategories.get(categoryName);
    if (category) {
      category.scenarios.push(scenario.name);
    }

    console.log(
      `Registered scenario '${scenario.name}' in category '${categoryName}'`
    );
  }

  /**
   * Auto-assign category based on scenario name and description
   */
  private autoAssignCategory(scenario: TestScenario): string {
    const name = scenario.name.toLowerCase();
    const description = scenario.description.toLowerCase();

    if (
      name.includes('loading') ||
      name.includes('initialization') ||
      name.includes('startup')
    ) {
      return 'Extension Lifecycle';
    }
    if (
      name.includes('content') ||
      name.includes('extraction') ||
      description.includes('article')
    ) {
      return 'Content Processing';
    }
    if (
      name.includes('ai') ||
      name.includes('processing') ||
      description.includes('ai')
    ) {
      return 'AI Integration';
    }
    if (
      name.includes('ui') ||
      name.includes('interface') ||
      name.includes('interaction')
    ) {
      return 'UI Components';
    }
    if (
      name.includes('storage') ||
      name.includes('cache') ||
      name.includes('data')
    ) {
      return 'Storage & Caching';
    }
    if (
      name.includes('performance') ||
      name.includes('memory') ||
      name.includes('speed')
    ) {
      return 'Performance';
    }
    if (name.includes('integration') || name.includes('cross-component')) {
      return 'Integration';
    }

    return 'Extension Lifecycle'; // Default category
  }

  /**
   * Execute scenarios by category
   */
  async executeByCategory(categoryName: string): Promise<TestResult[]> {
    const category = this.scenarioCategories.get(categoryName);
    if (!category) {
      throw new Error(`Category not found: ${categoryName}`);
    }

    console.log(`Executing scenarios in category: ${categoryName}`);
    return this.executor.executeScenarios(category.scenarios);
  }

  /**
   * Execute scenarios by priority level
   */
  async executeByPriority(maxPriority: number): Promise<TestResult[]> {
    const scenariosToRun: string[] = [];

    for (const category of this.scenarioCategories.values()) {
      if (category.priority <= maxPriority) {
        scenariosToRun.push(...category.scenarios);
      }
    }

    console.log(`Executing scenarios with priority <= ${maxPriority}`);
    return this.executor.executeScenarios(scenariosToRun);
  }

  /**
   * Execute critical scenarios only
   */
  async executeCriticalScenarios(): Promise<TestResult[]> {
    return this.executeByPriority(1);
  }

  /**
   * Execute full test suite
   */
  async executeFullSuite(): Promise<TestResult[]> {
    console.log('Executing full test suite');
    return this.executor.executeAllScenarios();
  }

  /**
   * Execute scenarios with custom configuration
   */
  async executeWithConfig(config: TestScenarioConfig): Promise<TestResult[]> {
    return this.executor.executeWithConfig(config);
  }

  /**
   * Schedule periodic execution of scenarios
   */
  scheduleExecution(
    scenarioNames: string[],
    intervalMs: number,
    scheduleId: string
  ): void {
    // Clear existing schedule if it exists
    this.clearSchedule(scheduleId);

    const executeScheduled = async () => {
      try {
        console.log(`Executing scheduled scenarios: ${scheduleId}`);
        const results = await this.executor.executeScenarios(scenarioNames);

        // Log results summary
        const passed = results.filter(r => r.passed).length;
        console.log(
          `Scheduled execution ${scheduleId}: ${passed}/${results.length} scenarios passed`
        );

        // Validate results
        const validationSummary =
          this.validator.generateValidationSummary(results);
        if (validationSummary.overallViolations.length > 0) {
          console.warn(
            `Scheduled execution ${scheduleId} has validation violations:`,
            validationSummary.overallViolations
          );
        }
      } catch (error) {
        console.error(`Scheduled execution ${scheduleId} failed:`, error);
      }
    };

    const timeout = setInterval(executeScheduled, intervalMs);
    this.scheduledExecutions.set(scheduleId, timeout);

    console.log(`Scheduled execution '${scheduleId}' every ${intervalMs}ms`);
  }

  /**
   * Clear a scheduled execution
   */
  clearSchedule(scheduleId: string): void {
    const timeout = this.scheduledExecutions.get(scheduleId);
    if (timeout) {
      clearInterval(timeout);
      this.scheduledExecutions.delete(scheduleId);
      console.log(`Cleared scheduled execution: ${scheduleId}`);
    }
  }

  /**
   * Clear all scheduled executions
   */
  clearAllSchedules(): void {
    for (const [scheduleId, timeout] of this.scheduledExecutions) {
      clearInterval(timeout);
    }
    this.scheduledExecutions.clear();
    console.log('Cleared all scheduled executions');
  }

  /**
   * Get scenario execution statistics
   */
  getExecutionStatistics(): {
    byCategory: Map<
      string,
      { total: number; executed: number; successRate: number }
    >;
    overall: { total: number; executed: number; successRate: number };
  } {
    const history = this.executor.getExecutionHistory();
    const byCategory = new Map<
      string,
      { total: number; executed: number; successRate: number }
    >();

    // Initialize category stats
    for (const [categoryName, category] of this.scenarioCategories) {
      byCategory.set(categoryName, {
        total: category.scenarios.length,
        executed: 0,
        successRate: 0,
      });
    }

    // Calculate execution stats
    for (const result of history) {
      const categoryName = this.findScenarioCategory(result.scenarioName);
      if (categoryName) {
        const stats = byCategory.get(categoryName)!;
        stats.executed++;
        if (result.passed) {
          stats.successRate =
            (stats.successRate * (stats.executed - 1) + 1) / stats.executed;
        } else {
          stats.successRate =
            (stats.successRate * (stats.executed - 1)) / stats.executed;
        }
      }
    }

    const totalScenarios = Array.from(this.scenarioCategories.values()).reduce(
      (sum, cat) => sum + cat.scenarios.length,
      0
    );
    const totalExecuted = history.length;
    const totalPassed = history.filter(r => r.passed).length;

    return {
      byCategory,
      overall: {
        total: totalScenarios,
        executed: totalExecuted,
        successRate: totalExecuted > 0 ? totalPassed / totalExecuted : 0,
      },
    };
  }

  /**
   * Find which category a scenario belongs to
   */
  private findScenarioCategory(scenarioName: string): string | undefined {
    for (const [categoryName, category] of this.scenarioCategories) {
      if (category.scenarios.includes(scenarioName)) {
        return categoryName;
      }
    }
    return undefined;
  }

  /**
   * Get all categories
   */
  getCategories(): Map<string, ScenarioCategory> {
    return new Map(this.scenarioCategories);
  }

  /**
   * Get scenarios in a specific category
   */
  getScenariosInCategory(categoryName: string): string[] {
    const category = this.scenarioCategories.get(categoryName);
    return category ? [...category.scenarios] : [];
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): TestResult[] {
    return this.executor.getExecutionHistory();
  }

  /**
   * Validate test results
   */
  validateResults(results: TestResult[]) {
    return this.validator.validateResults(results);
  }

  /**
   * Generate validation summary
   */
  generateValidationSummary(results: TestResult[]) {
    return this.validator.generateValidationSummary(results);
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executor.clearHistory();
  }

  /**
   * Get registered scenarios
   */
  getRegisteredScenarios(): string[] {
    return this.executor.getRegisteredScenarios();
  }

  /**
   * Export scenario configuration
   */
  exportConfiguration(): {
    categories: ScenarioCategory[];
    scenarios: string[];
    validationRules: Array<{ scenarioName: string; criteria: any }>;
  } {
    const categories = Array.from(this.scenarioCategories.values());
    const scenarios = this.executor.getRegisteredScenarios();
    const validationRules = Array.from(
      this.validator.getValidationRules().entries()
    ).map(([scenarioName, criteria]) => ({ scenarioName, criteria }));

    return {
      categories,
      scenarios,
      validationRules,
    };
  }

  /**
   * Import scenario configuration
   */
  importConfiguration(config: {
    categories?: ScenarioCategory[];
    validationRules?: Array<{ scenarioName: string; criteria: any }>;
  }): void {
    if (config.categories) {
      this.scenarioCategories.clear();
      config.categories.forEach(category => {
        this.scenarioCategories.set(category.name, category);
      });
    }

    if (config.validationRules) {
      this.validator.clearValidationCriteria();
      config.validationRules.forEach(({ scenarioName, criteria }) => {
        this.validator.registerValidationCriteria(scenarioName, criteria);
      });
    }

    console.log('Imported scenario configuration');
  }
}
