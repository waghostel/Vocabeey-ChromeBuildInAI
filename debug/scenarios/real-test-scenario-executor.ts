/**
 * Real Test Scenario Executor
 * Replaces mock implementations with real MCP-based test scenario execution
 */

import {
  TestScenario,
  TestResult,
  TestScenarioConfig,
} from '../types/debug-types';
import { MCPConnectionManager } from '../utils/mcp-connection-manager';

export interface RealTestScenario extends TestScenario {
  requiredMCPFunctions: string[];
  setup: () => Promise<void>;
  execute: () => Promise<RealTestResult>;
  validate: (result: any) => Promise<boolean>;
  cleanup: () => Promise<void>;
}

export interface RealTestResult extends TestResult {
  realData: any;
  mcpFunctionCalls: Array<{
    functionName: string;
    params: any;
    result: any;
    executionTime: number;
    error?: string;
  }>;
  validationResults: {
    passed: boolean;
    details: string[];
  };
}

export class RealTestScenarioExecutor {
  private mcpConnectionManager: MCPConnectionManager;
  private scenarios: Map<string, RealTestScenario> = new Map();
  private executionHistory: RealTestResult[] = [];
  private currentExecution: {
    scenarioName: string;
    startTime: number;
    mcpCalls: Array<{
      functionName: string;
      params: any;
      result: any;
      executionTime: number;
      error?: string;
    }>;
  } | null = null;

  constructor(mcpConnectionManager: MCPConnectionManager) {
    this.mcpConnectionManager = mcpConnectionManager;
  }

  /**
   * Register a real test scenario for execution
   */
  registerRealScenario(scenario: RealTestScenario): void {
    // Validate scenario has required MCP functions
    if (
      !scenario.requiredMCPFunctions ||
      scenario.requiredMCPFunctions.length === 0
    ) {
      throw new Error(
        `Real test scenario '${scenario.name}' must specify required MCP functions`
      );
    }

    this.scenarios.set(scenario.name, scenario);
    console.log(
      `Registered real test scenario: ${scenario.name} (requires ${scenario.requiredMCPFunctions.length} MCP functions)`
    );
  }

  /**
   * Execute a real test scenario with MCP integration
   */
  async executeRealScenario(scenarioName: string): Promise<RealTestResult> {
    const scenario = this.scenarios.get(scenarioName);
    if (!scenario) {
      throw new Error(`Real test scenario not found: ${scenarioName}`);
    }

    console.log(`Executing real test scenario: ${scenarioName}`);
    const startTime = Date.now();

    // Initialize execution tracking
    this.currentExecution = {
      scenarioName,
      startTime,
      mcpCalls: [],
    };

    try {
      // Verify MCP connection and required functions
      await this.verifyMCPRequirements(scenario);

      // Setup phase with real MCP calls
      console.log(`Setting up real scenario: ${scenarioName}`);
      await scenario.setup();

      // Execute phase with real MCP integration
      console.log(`Executing real scenario: ${scenarioName}`);
      const result = await scenario.execute();

      // Validate results against real data
      console.log(`Validating real scenario results: ${scenarioName}`);
      const validationPassed = await scenario.validate(result.realData);

      // Cleanup phase
      console.log(`Cleaning up real scenario: ${scenarioName}`);
      await scenario.cleanup();

      const executionTime = Date.now() - startTime;
      const finalResult: RealTestResult = {
        ...result,
        scenarioName,
        executionTime,
        timestamp: new Date(),
        mcpFunctionCalls: [...this.currentExecution.mcpCalls],
        validationResults: {
          passed: validationPassed,
          details: validationPassed
            ? ['All validations passed']
            : ['Validation failed'],
        },
      };

      this.executionHistory.push(finalResult);
      console.log(
        `Real scenario ${scenarioName} completed in ${executionTime}ms (validation: ${validationPassed ? 'PASSED' : 'FAILED'})`
      );

      return finalResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorResult: RealTestResult = {
        passed: false,
        scenarioName,
        executionTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metrics: {},
        realData: null,
        mcpFunctionCalls: this.currentExecution?.mcpCalls || [],
        validationResults: {
          passed: false,
          details: [
            `Execution failed: ${error instanceof Error ? error.message : String(error)}`,
          ],
        },
      };

      this.executionHistory.push(errorResult);
      console.error(`Real scenario ${scenarioName} failed:`, error);

      // Attempt cleanup even on failure
      try {
        await scenario.cleanup();
      } catch (cleanupError) {
        console.error(
          `Cleanup failed for real scenario ${scenarioName}:`,
          cleanupError
        );
      }

      return errorResult;
    } finally {
      this.currentExecution = null;
    }
  }

  /**
   * Verify MCP connection and required functions for scenario
   */
  private async verifyMCPRequirements(
    scenario: RealTestScenario
  ): Promise<void> {
    const connectionStatus = this.mcpConnectionManager.getConnectionStatus();

    if (!connectionStatus.isConnected) {
      throw new Error(
        `MCP connection required for real scenario '${scenario.name}' but not connected`
      );
    }

    // Check if all required functions are available
    const missingFunctions = scenario.requiredMCPFunctions.filter(
      func => !connectionStatus.availableFunctions.includes(func)
    );

    if (missingFunctions.length > 0) {
      throw new Error(
        `Real scenario '${scenario.name}' requires MCP functions not available: ${missingFunctions.join(', ')}`
      );
    }

    console.log(`✓ MCP requirements verified for scenario '${scenario.name}'`);
  }

  /**
   * Execute MCP function and track the call
   */
  async executeMCPFunction(
    functionName: string,
    params: any = {}
  ): Promise<any> {
    if (!this.currentExecution) {
      throw new Error('No active scenario execution to track MCP calls');
    }

    const startTime = Date.now();
    const result = await this.mcpConnectionManager.executeMCPFunction(
      functionName,
      params
    );
    const executionTime = Date.now() - startTime;

    // Track the MCP call
    this.currentExecution.mcpCalls.push({
      functionName,
      params,
      result: result.data,
      executionTime,
    });

    if (!result.success) {
      throw new Error(`MCP function ${functionName} failed: ${result.error}`);
    }

    return result.data;
  }

  /**
   * Execute multiple real scenarios in sequence
   */
  async executeRealScenarios(
    scenarioNames: string[]
  ): Promise<RealTestResult[]> {
    const results: RealTestResult[] = [];

    for (const scenarioName of scenarioNames) {
      const result = await this.executeRealScenario(scenarioName);
      results.push(result);

      // Stop execution if a critical scenario fails
      if (!result.passed && this.isCriticalScenario(scenarioName)) {
        console.warn(
          `Critical real scenario ${scenarioName} failed, stopping execution`
        );
        break;
      }
    }

    return results;
  }

  /**
   * Execute all registered real scenarios
   */
  async executeAllRealScenarios(): Promise<RealTestResult[]> {
    const scenarioNames = Array.from(this.scenarios.keys());
    return this.executeRealScenarios(scenarioNames);
  }

  /**
   * Execute real scenarios with configuration
   */
  async executeRealScenariosWithConfig(
    config: TestScenarioConfig
  ): Promise<RealTestResult[]> {
    const scenariosToRun =
      config.scenarios || Array.from(this.scenarios.keys());

    if (config.parallel && config.parallel > 1) {
      return this.executeRealScenariosParallel(scenariosToRun, config.parallel);
    } else {
      return this.executeRealScenarios(scenariosToRun);
    }
  }

  /**
   * Execute real scenarios in parallel (limited concurrency)
   */
  private async executeRealScenariosParallel(
    scenarioNames: string[],
    maxConcurrency: number
  ): Promise<RealTestResult[]> {
    const results: RealTestResult[] = [];
    const executing: Promise<RealTestResult>[] = [];

    for (const scenarioName of scenarioNames) {
      if (executing.length >= maxConcurrency) {
        const completed = await Promise.race(executing);
        results.push(completed);
        const index = executing.findIndex(
          p => p === Promise.resolve(completed)
        );
        executing.splice(index, 1);
      }

      executing.push(this.executeRealScenario(scenarioName));
    }

    // Wait for remaining scenarios to complete
    const remainingResults = await Promise.all(executing);
    results.push(...remainingResults);

    return results;
  }

  /**
   * Get real execution history
   */
  getRealExecutionHistory(): RealTestResult[] {
    return [...this.executionHistory];
  }

  /**
   * Get real scenario statistics
   */
  getRealScenarioStatistics(): {
    totalScenarios: number;
    totalExecutions: number;
    successRate: number;
    validationRate: number;
    averageExecutionTime: number;
    averageMCPCalls: number;
    mcpFunctionUsage: Map<string, number>;
  } {
    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter(
      r => r.passed
    ).length;
    const validatedExecutions = this.executionHistory.filter(
      r => r.validationResults.passed
    ).length;
    const totalExecutionTime = this.executionHistory.reduce(
      (sum, r) => sum + r.executionTime,
      0
    );
    const totalMCPCalls = this.executionHistory.reduce(
      (sum, r) => sum + r.mcpFunctionCalls.length,
      0
    );

    // Track MCP function usage
    const mcpFunctionUsage = new Map<string, number>();
    this.executionHistory.forEach(result => {
      result.mcpFunctionCalls.forEach(call => {
        const current = mcpFunctionUsage.get(call.functionName) || 0;
        mcpFunctionUsage.set(call.functionName, current + 1);
      });
    });

    return {
      totalScenarios: this.scenarios.size,
      totalExecutions,
      successRate:
        totalExecutions > 0 ? successfulExecutions / totalExecutions : 0,
      validationRate:
        totalExecutions > 0 ? validatedExecutions / totalExecutions : 0,
      averageExecutionTime:
        totalExecutions > 0 ? totalExecutionTime / totalExecutions : 0,
      averageMCPCalls:
        totalExecutions > 0 ? totalMCPCalls / totalExecutions : 0,
      mcpFunctionUsage,
    };
  }

  /**
   * Generate real execution report
   */
  generateRealExecutionReport(): {
    summary: {
      totalScenarios: number;
      executedScenarios: number;
      passedScenarios: number;
      validatedScenarios: number;
      totalMCPCalls: number;
      averageExecutionTime: number;
    };
    scenarioResults: Array<{
      name: string;
      passed: boolean;
      validated: boolean;
      executionTime: number;
      mcpCallCount: number;
      errors: string[];
    }>;
    mcpFunctionUsage: Array<{
      functionName: string;
      callCount: number;
      averageExecutionTime: number;
    }>;
    recommendations: string[];
  } {
    const stats = this.getRealScenarioStatistics();

    const scenarioResults = this.executionHistory.map(result => ({
      name: result.scenarioName,
      passed: result.passed,
      validated: result.validationResults.passed,
      executionTime: result.executionTime,
      mcpCallCount: result.mcpFunctionCalls.length,
      errors: result.error ? [result.error] : [],
    }));

    const mcpFunctionUsage = Array.from(stats.mcpFunctionUsage.entries())
      .map(([functionName, callCount]) => {
        const totalTime = this.executionHistory.reduce((sum, result) => {
          const functionCalls = result.mcpFunctionCalls.filter(
            call => call.functionName === functionName
          );
          return (
            sum +
            functionCalls.reduce(
              (callSum, call) => callSum + call.executionTime,
              0
            )
          );
        }, 0);

        return {
          functionName,
          callCount,
          averageExecutionTime: callCount > 0 ? totalTime / callCount : 0,
        };
      })
      .sort((a, b) => b.callCount - a.callCount);

    const recommendations = this.generateRecommendations(stats);

    return {
      summary: {
        totalScenarios: stats.totalScenarios,
        executedScenarios: stats.totalExecutions,
        passedScenarios: this.executionHistory.filter(r => r.passed).length,
        validatedScenarios: this.executionHistory.filter(
          r => r.validationResults.passed
        ).length,
        totalMCPCalls: this.executionHistory.reduce(
          (sum, r) => sum + r.mcpFunctionCalls.length,
          0
        ),
        averageExecutionTime: stats.averageExecutionTime,
      },
      scenarioResults,
      mcpFunctionUsage,
      recommendations,
    };
  }

  /**
   * Generate recommendations based on execution data
   */
  private generateRecommendations(stats: any): string[] {
    const recommendations: string[] = [];

    if (stats.successRate < 0.8) {
      recommendations.push(
        'Consider reviewing failed scenarios to improve success rate'
      );
    }

    if (stats.validationRate < 0.9) {
      recommendations.push(
        'Review validation criteria - some scenarios pass execution but fail validation'
      );
    }

    if (stats.averageExecutionTime > 30000) {
      recommendations.push(
        'Consider optimizing scenario execution time - average exceeds 30 seconds'
      );
    }

    if (stats.averageMCPCalls > 20) {
      recommendations.push(
        'High number of MCP calls per scenario - consider optimizing MCP usage'
      );
    }

    // Check for frequently failing MCP functions
    const failedFunctions = new Set<string>();
    this.executionHistory.forEach(result => {
      if (!result.passed) {
        result.mcpFunctionCalls.forEach(call => {
          if (!call.result) {
            failedFunctions.add(call.functionName);
          }
        });
      }
    });

    if (failedFunctions.size > 0) {
      recommendations.push(
        `Review MCP functions with frequent failures: ${Array.from(failedFunctions).join(', ')}`
      );
    }

    return recommendations;
  }

  /**
   * Check if a scenario is considered critical
   */
  private isCriticalScenario(scenarioName: string): boolean {
    const criticalScenarios = [
      'Real Extension Loading Test',
      'Real MCP Connection Test',
      'Real Service Worker Initialization Test',
    ];
    return criticalScenarios.includes(scenarioName);
  }

  /**
   * Clear execution history
   */
  clearRealHistory(): void {
    this.executionHistory = [];
  }

  /**
   * Get registered real scenario names
   */
  getRegisteredRealScenarios(): string[] {
    return Array.from(this.scenarios.keys());
  }

  /**
   * Get real scenario details
   */
  getRealScenarioDetails(scenarioName: string): RealTestScenario | undefined {
    return this.scenarios.get(scenarioName);
  }
}
