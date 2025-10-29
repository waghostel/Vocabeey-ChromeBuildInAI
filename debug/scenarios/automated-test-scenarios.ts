/**
 * Automated Test Scenarios Integration
 * Main entry point for automated test scenario execution
 */

import { TestScenarioManager } from './test-scenario-manager';
import { DebugSessionManager } from '../session-manager/debug-session-manager';
import { allTestScenarios } from './concrete-test-scenarios';
import { TestScenarioConfig, TestResult } from '../types/debug-types';

/**
 * Automated Test Scenario System
 * Provides high-level interface for automated debugging workflows
 */
export class AutomatedTestScenarios {
  private scenarioManager: TestScenarioManager;
  private sessionManager: DebugSessionManager;
  private isInitialized = false;

  constructor() {
    this.sessionManager = new DebugSessionManager();
    this.scenarioManager = new TestScenarioManager(this.sessionManager);
  }

  /**
   * Initialize the automated test scenario system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing automated test scenario system...');

    // Initialize session manager
    await this.sessionManager.initializeDebugSession();

    // Register all concrete test scenarios
    allTestScenarios.forEach(scenario => {
      this.scenarioManager.registerScenario(scenario);
    });

    this.isInitialized = true;
    console.log(`Initialized with ${allTestScenarios.length} test scenarios`);
  }

  /**
   * Execute quick validation scenarios (critical scenarios only)
   */
  async executeQuickValidation(): Promise<TestResult[]> {
    await this.ensureInitialized();
    console.log('Executing quick validation scenarios...');
    return this.scenarioManager.executeCriticalScenarios();
  }

  /**
   * Execute comprehensive test suite
   */
  async executeComprehensiveTest(): Promise<TestResult[]> {
    await this.ensureInitialized();
    console.log('Executing comprehensive test suite...');
    return this.scenarioManager.executeFullSuite();
  }

  /**
   * Execute scenarios by category
   */
  async executeByCategory(categoryName: string): Promise<TestResult[]> {
    await this.ensureInitialized();
    console.log(`Executing scenarios in category: ${categoryName}`);
    return this.scenarioManager.executeByCategory(categoryName);
  }

  /**
   * Execute custom scenario configuration
   */
  async executeCustom(config: TestScenarioConfig): Promise<TestResult[]> {
    await this.ensureInitialized();
    console.log('Executing custom scenario configuration...');
    return this.scenarioManager.executeWithConfig(config);
  }

  /**
   * Schedule periodic execution
   */
  schedulePeriodicExecution(
    scenarios: string[],
    intervalMinutes: number,
    scheduleId: string = 'default'
  ): void {
    const intervalMs = intervalMinutes * 60 * 1000;
    this.scenarioManager.scheduleExecution(scenarios, intervalMs, scheduleId);
    console.log(
      `Scheduled periodic execution every ${intervalMinutes} minutes`
    );
  }

  /**
   * Get execution statistics
   */
  getStatistics() {
    return this.scenarioManager.getExecutionStatistics();
  }

  /**
   * Get execution history
   */
  getHistory(): TestResult[] {
    return this.scenarioManager.getExecutionHistory();
  }

  /**
   * Generate validation summary for results
   */
  generateValidationSummary(results: TestResult[]) {
    return this.scenarioManager.generateValidationSummary(results);
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.scenarioManager.clearHistory();
  }

  /**
   * Get available categories
   */
  getCategories() {
    return this.scenarioManager.getCategories();
  }

  /**
   * Get registered scenarios
   */
  getRegisteredScenarios(): string[] {
    return this.scenarioManager.getRegisteredScenarios();
  }

  /**
   * Stop all scheduled executions
   */
  stopAllSchedules(): void {
    this.scenarioManager.clearAllSchedules();
  }

  /**
   * Export configuration
   */
  exportConfiguration() {
    return this.scenarioManager.exportConfiguration();
  }

  /**
   * Import configuration
   */
  importConfiguration(config: any): void {
    this.scenarioManager.importConfiguration(config);
  }

  /**
   * Ensure system is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up automated test scenario system...');
    this.stopAllSchedules();
    // Session cleanup would be handled by the session manager
    this.isInitialized = false;
  }
}

// Create and export singleton instance
export const automatedTestScenarios = new AutomatedTestScenarios();

// Convenience functions for common operations
export async function runQuickValidation(): Promise<TestResult[]> {
  return automatedTestScenarios.executeQuickValidation();
}

export async function runComprehensiveTest(): Promise<TestResult[]> {
  return automatedTestScenarios.executeComprehensiveTest();
}

export async function runCategoryTest(category: string): Promise<TestResult[]> {
  return automatedTestScenarios.executeByCategory(category);
}

export async function schedulePeriodicTests(
  scenarios: string[],
  intervalMinutes: number
): Promise<void> {
  automatedTestScenarios.schedulePeriodicExecution(scenarios, intervalMinutes);
}

// Example usage configurations
export const commonConfigurations = {
  quickValidation: {
    scenarios: ['Extension Loading Test'],
    timeout: 15000,
    stopOnFailure: true,
  } as TestScenarioConfig,

  contentProcessing: {
    categories: ['Content Processing'],
    timeout: 30000,
    retries: 2,
  } as TestScenarioConfig,

  performanceTest: {
    categories: ['Performance'],
    timeout: 60000,
    parallel: 2,
  } as TestScenarioConfig,

  fullSuite: {
    priority: 5,
    timeout: 120000,
    parallel: 3,
    stopOnFailure: false,
  } as TestScenarioConfig,
};
