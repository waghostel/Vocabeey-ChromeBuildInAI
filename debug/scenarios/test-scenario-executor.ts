/**
 * Test Scenario Executor
 * Automated execution of debugging test scenarios
 */

import {
  TestScenario,
  TestResult,
  TestScenarioConfig,
} from '../types/debug-types';
import { DebugSessionManager } from '../session-manager/debug-session-manager';

export class TestScenarioExecutor {
  private sessionManager: DebugSessionManager;
  private scenarios: Map<string, TestScenario> = new Map();
  private executionHistory: TestResult[] = [];

  constructor(sessionManager: DebugSessionManager) {
    this.sessionManager = sessionManager;
  }

  /**
   * Register a test scenario for execution
   */
  registerScenario(scenario: TestScenario): void {
    this.scenarios.set(scenario.name, scenario);
    console.log(`Registered test scenario: ${scenario.name}`);
  }

  /**
   * Execute a specific test scenario by name
   */
  async executeScenario(scenarioName: string): Promise<TestResult> {
    const scenario = this.scenarios.get(scenarioName);
    if (!scenario) {
      throw new Error(`Test scenario not found: ${scenarioName}`);
    }

    console.log(`Executing test scenario: ${scenarioName}`);
    const startTime = Date.now();

    try {
      // Setup phase
      console.log(`Setting up scenario: ${scenarioName}`);
      await scenario.setup();

      // Execute phase
      console.log(`Executing scenario: ${scenarioName}`);
      const result = await scenario.execute();

      // Cleanup phase
      console.log(`Cleaning up scenario: ${scenarioName}`);
      await scenario.cleanup();

      const executionTime = Date.now() - startTime;
      const finalResult: TestResult = {
        ...result,
        scenarioName,
        executionTime,
        timestamp: new Date(),
      };

      this.executionHistory.push(finalResult);
      console.log(`Scenario ${scenarioName} completed in ${executionTime}ms`);

      return finalResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorResult: TestResult = {
        passed: false,
        scenarioName,
        executionTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metrics: {},
      };

      this.executionHistory.push(errorResult);
      console.error(`Scenario ${scenarioName} failed:`, error);

      // Attempt cleanup even on failure
      try {
        await scenario.cleanup();
      } catch (cleanupError) {
        console.error(
          `Cleanup failed for scenario ${scenarioName}:`,
          cleanupError
        );
      }

      return errorResult;
    }
  }

  /**
   * Execute multiple scenarios in sequence
   */
  async executeScenarios(scenarioNames: string[]): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const scenarioName of scenarioNames) {
      const result = await this.executeScenario(scenarioName);
      results.push(result);

      // Stop execution if a critical scenario fails
      if (!result.passed && this.isCriticalScenario(scenarioName)) {
        console.warn(
          `Critical scenario ${scenarioName} failed, stopping execution`
        );
        break;
      }
    }

    return results;
  }

  /**
   * Execute all registered scenarios
   */
  async executeAllScenarios(): Promise<TestResult[]> {
    const scenarioNames = Array.from(this.scenarios.keys());
    return this.executeScenarios(scenarioNames);
  }

  /**
   * Execute scenarios based on configuration
   */
  async executeWithConfig(config: TestScenarioConfig): Promise<TestResult[]> {
    const scenariosToRun =
      config.scenarios || Array.from(this.scenarios.keys());

    if (config.parallel && config.parallel > 1) {
      return this.executeParallel(scenariosToRun, config.parallel);
    } else {
      return this.executeScenarios(scenariosToRun);
    }
  }

  /**
   * Execute scenarios in parallel (limited concurrency)
   */
  private async executeParallel(
    scenarioNames: string[],
    maxConcurrency: number
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const executing: Promise<TestResult>[] = [];

    for (const scenarioName of scenarioNames) {
      if (executing.length >= maxConcurrency) {
        const completed = await Promise.race(executing);
        results.push(completed);
        const index = executing.findIndex(
          p => p === Promise.resolve(completed)
        );
        executing.splice(index, 1);
      }

      executing.push(this.executeScenario(scenarioName));
    }

    // Wait for remaining scenarios to complete
    const remainingResults = await Promise.all(executing);
    results.push(...remainingResults);

    return results;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): TestResult[] {
    return [...this.executionHistory];
  }

  /**
   * Get scenario statistics
   */
  getScenarioStatistics(): {
    totalScenarios: number;
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
  } {
    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter(
      r => r.passed
    ).length;
    const totalExecutionTime = this.executionHistory.reduce(
      (sum, r) => sum + r.executionTime,
      0
    );

    return {
      totalScenarios: this.scenarios.size,
      totalExecutions,
      successRate:
        totalExecutions > 0 ? successfulExecutions / totalExecutions : 0,
      averageExecutionTime:
        totalExecutions > 0 ? totalExecutionTime / totalExecutions : 0,
    };
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.executionHistory = [];
  }

  /**
   * Check if a scenario is considered critical
   */
  private isCriticalScenario(scenarioName: string): boolean {
    const criticalScenarios = [
      'Extension Loading Test',
      'MCP Connection Test',
      'Service Worker Initialization Test',
    ];
    return criticalScenarios.includes(scenarioName);
  }

  /**
   * Validate test scenario before registration
   */
  private validateScenario(scenario: TestScenario): boolean {
    if (!scenario.name || !scenario.description) {
      return false;
    }
    if (
      typeof scenario.setup !== 'function' ||
      typeof scenario.execute !== 'function' ||
      typeof scenario.cleanup !== 'function'
    ) {
      return false;
    }
    return true;
  }

  /**
   * Get registered scenario names
   */
  getRegisteredScenarios(): string[] {
    return Array.from(this.scenarios.keys());
  }

  /**
   * Get scenario details
   */
  getScenarioDetails(scenarioName: string): TestScenario | undefined {
    return this.scenarios.get(scenarioName);
  }
}
