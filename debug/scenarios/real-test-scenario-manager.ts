/**
 * Real Test Scenario Manager
 * Manages real test scenarios with MCP integration and functional testing
 */

import {
  RealTestScenario,
  RealTestResult,
  RealTestScenarioExecutor,
} from './real-test-scenario-executor';
import { allRealTestScenarios } from './real-test-scenarios';
import { MCPConnectionManager } from '../utils/mcp-connection-manager';
import { TestScenarioConfig } from '../types/debug-types';

export interface RealTestScenarioFramework {
  name: string;
  description: string;
  scenarios: RealTestScenario[];
  setup: () => Promise<void>;
  execute: () => Promise<RealTestResult[]>;
  validate: (results: RealTestResult[]) => Promise<boolean>;
  cleanup: () => Promise<void>;
}

export class RealTestScenarioManager {
  private mcpConnectionManager: MCPConnectionManager;
  private executor: RealTestScenarioExecutor;
  private frameworks: Map<string, RealTestScenarioFramework> = new Map();
  private scheduledExecutions: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  constructor(mcpConnectionManager: MCPConnectionManager) {
    this.mcpConnectionManager = mcpConnectionManager;
    this.executor = new RealTestScenarioExecutor(mcpConnectionManager);
  }

  /**
   * Initialize the real test scenario system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log(
      'Initializing real test scenario system with MCP integration...'
    );

    // Verify MCP connection
    const connectionStatus = this.mcpConnectionManager.getConnectionStatus();
    if (!connectionStatus.isConnected) {
      console.warn('MCP connection not established - some real tests may fail');
    } else {
      console.log(
        `✓ MCP connection verified with ${connectionStatus.availableFunctions.length} functions`
      );
    }

    // Register all real test scenarios
    allRealTestScenarios.forEach(scenario => {
      this.executor.registerRealScenario(scenario);
    });

    // Initialize default test frameworks
    this.initializeDefaultFrameworks();

    this.isInitialized = true;
    console.log(
      `✓ Real test scenario system initialized with ${allRealTestScenarios.length} scenarios`
    );
  }

  /**
   * Initialize default test frameworks
   */
  private initializeDefaultFrameworks(): void {
    // Extension Functionality Framework
    const extensionFramework: RealTestScenarioFramework = {
      name: 'Extension Functionality',
      description:
        'Tests core extension functionality with real MCP integration',
      scenarios: [
        allRealTestScenarios.find(
          s => s.name === 'Real Extension Loading Test'
        )!,
        allRealTestScenarios.find(
          s => s.name === 'Real Content Script Integration Test'
        )!,
      ].filter(Boolean),

      async setup(): Promise<void> {
        console.log('Setting up Extension Functionality framework...');
      },

      async execute(): Promise<RealTestResult[]> {
        const results: RealTestResult[] = [];
        for (const scenario of this.scenarios) {
          const result = await scenario.execute();
          results.push(result);
        }
        return results;
      },

      async validate(results: RealTestResult[]): Promise<boolean> {
        return results.every(
          result => result.passed && result.validationResults.passed
        );
      },

      async cleanup(): Promise<void> {
        console.log('Cleaning up Extension Functionality framework...');
      },
    };

    // AI Processing Framework
    const aiFramework: RealTestScenarioFramework = {
      name: 'AI Processing',
      description:
        'Tests AI processing capabilities with real offscreen document integration',
      scenarios: [
        allRealTestScenarios.find(s => s.name === 'Real AI Processing Test')!,
      ].filter(Boolean),

      async setup(): Promise<void> {
        console.log('Setting up AI Processing framework...');
      },

      async execute(): Promise<RealTestResult[]> {
        const results: RealTestResult[] = [];
        for (const scenario of this.scenarios) {
          const result = await scenario.execute();
          results.push(result);
        }
        return results;
      },

      async validate(results: RealTestResult[]): Promise<boolean> {
        return results.every(
          result => result.passed && result.validationResults.passed
        );
      },

      async cleanup(): Promise<void> {
        console.log('Cleaning up AI Processing framework...');
      },
    };

    // Communication Framework
    const communicationFramework: RealTestScenarioFramework = {
      name: 'Cross-Component Communication',
      description: 'Tests real message passing and component integration',
      scenarios: [
        allRealTestScenarios.find(
          s => s.name === 'Real Cross-Component Communication Test'
        )!,
      ].filter(Boolean),

      async setup(): Promise<void> {
        console.log('Setting up Cross-Component Communication framework...');
      },

      async execute(): Promise<RealTestResult[]> {
        const results: RealTestResult[] = [];
        for (const scenario of this.scenarios) {
          const result = await scenario.execute();
          results.push(result);
        }
        return results;
      },

      async validate(results: RealTestResult[]): Promise<boolean> {
        return results.every(
          result => result.passed && result.validationResults.passed
        );
      },

      async cleanup(): Promise<void> {
        console.log('Cleaning up Cross-Component Communication framework...');
      },
    };

    this.frameworks.set('extension', extensionFramework);
    this.frameworks.set('ai', aiFramework);
    this.frameworks.set('communication', communicationFramework);
  }

  /**
   * Execute real test scenarios by framework
   */
  async executeFramework(frameworkName: string): Promise<RealTestResult[]> {
    await this.ensureInitialized();

    const framework = this.frameworks.get(frameworkName);
    if (!framework) {
      throw new Error(`Test framework not found: ${frameworkName}`);
    }

    console.log(`Executing real test framework: ${framework.name}`);

    try {
      // Setup framework
      await framework.setup();

      // Execute scenarios
      const results = await framework.execute();

      // Validate results
      const validationPassed = await framework.validate(results);
      console.log(
        `Framework ${framework.name} validation: ${validationPassed ? 'PASSED' : 'FAILED'}`
      );

      // Cleanup framework
      await framework.cleanup();

      return results;
    } catch (error) {
      console.error(`Framework ${framework.name} execution failed:`, error);
      throw error;
    }
  }

  /**
   * Execute all real test scenarios
   */
  async executeAllRealScenarios(): Promise<RealTestResult[]> {
    await this.ensureInitialized();
    console.log('Executing all real test scenarios...');
    return this.executor.executeAllRealScenarios();
  }

  /**
   * Execute real scenarios with configuration
   */
  async executeRealScenariosWithConfig(
    config: TestScenarioConfig
  ): Promise<RealTestResult[]> {
    await this.ensureInitialized();
    console.log('Executing real scenarios with custom configuration...');
    return this.executor.executeRealScenariosWithConfig(config);
  }

  /**
   * Execute critical real scenarios only
   */
  async executeCriticalRealScenarios(): Promise<RealTestResult[]> {
    await this.ensureInitialized();

    const criticalScenarios = [
      'Real Extension Loading Test',
      'Real Cross-Component Communication Test',
    ];

    console.log('Executing critical real scenarios...');
    return this.executor.executeRealScenarios(criticalScenarios);
  }

  /**
   * Schedule periodic execution of real scenarios
   */
  scheduleRealExecution(
    scenarioNames: string[],
    intervalMs: number,
    scheduleId: string
  ): void {
    // Clear existing schedule if it exists
    this.clearRealSchedule(scheduleId);

    const executeScheduled = async () => {
      try {
        console.log(`Executing scheduled real scenarios: ${scheduleId}`);
        const results = await this.executor.executeRealScenarios(scenarioNames);

        // Log results summary
        const passed = results.filter(r => r.passed).length;
        const validated = results.filter(
          r => r.validationResults.passed
        ).length;
        console.log(
          `Scheduled real execution ${scheduleId}: ${passed}/${results.length} passed, ${validated}/${results.length} validated`
        );

        // Check for critical failures
        const criticalFailures = results.filter(
          r => !r.passed && this.isCriticalScenario(r.scenarioName)
        );

        if (criticalFailures.length > 0) {
          console.error(
            `Critical real scenario failures in ${scheduleId}:`,
            criticalFailures.map(f => f.scenarioName)
          );
        }
      } catch (error) {
        console.error(`Scheduled real execution ${scheduleId} failed:`, error);
      }
    };

    const timeout = setInterval(executeScheduled, intervalMs);
    this.scheduledExecutions.set(scheduleId, timeout);

    console.log(
      `Scheduled real execution '${scheduleId}' every ${intervalMs}ms`
    );
  }

  /**
   * Clear a scheduled real execution
   */
  clearRealSchedule(scheduleId: string): void {
    const timeout = this.scheduledExecutions.get(scheduleId);
    if (timeout) {
      clearInterval(timeout);
      this.scheduledExecutions.delete(scheduleId);
      console.log(`Cleared scheduled real execution: ${scheduleId}`);
    }
  }

  /**
   * Clear all scheduled real executions
   */
  clearAllRealSchedules(): void {
    for (const [scheduleId, timeout] of this.scheduledExecutions) {
      clearInterval(timeout);
    }
    this.scheduledExecutions.clear();
    console.log('Cleared all scheduled real executions');
  }

  /**
   * Generate comprehensive real test report
   */
  generateRealTestReport(): {
    summary: {
      totalFrameworks: number;
      totalScenarios: number;
      executedScenarios: number;
      passedScenarios: number;
      validatedScenarios: number;
      mcpConnectionStatus: string;
      totalMCPCalls: number;
      averageExecutionTime: number;
    };
    frameworkResults: Array<{
      name: string;
      scenarioCount: number;
      executed: boolean;
      passed: boolean;
    }>;
    scenarioResults: Array<{
      name: string;
      passed: boolean;
      validated: boolean;
      executionTime: number;
      mcpCallCount: number;
      errors: string[];
    }>;
    mcpAnalysis: {
      connectionHealthy: boolean;
      availableFunctions: number;
      functionUsage: Array<{
        functionName: string;
        callCount: number;
        averageExecutionTime: number;
      }>;
    };
    recommendations: string[];
  } {
    const executionReport = this.executor.generateRealExecutionReport();
    const connectionStatus = this.mcpConnectionManager.getConnectionStatus();

    const frameworkResults = Array.from(this.frameworks.entries()).map(
      ([key, framework]) => ({
        name: framework.name,
        scenarioCount: framework.scenarios.length,
        executed: false, // Would need to track this
        passed: false, // Would need to track this
      })
    );

    const recommendations = [
      ...executionReport.recommendations,
      ...this.generateMCPRecommendations(connectionStatus),
    ];

    return {
      summary: {
        totalFrameworks: this.frameworks.size,
        totalScenarios: executionReport.summary.totalScenarios,
        executedScenarios: executionReport.summary.executedScenarios,
        passedScenarios: executionReport.summary.passedScenarios,
        validatedScenarios: executionReport.summary.validatedScenarios,
        mcpConnectionStatus: connectionStatus.isConnected
          ? 'Connected'
          : 'Disconnected',
        totalMCPCalls: executionReport.summary.totalMCPCalls,
        averageExecutionTime: executionReport.summary.averageExecutionTime,
      },
      frameworkResults,
      scenarioResults: executionReport.scenarioResults,
      mcpAnalysis: {
        connectionHealthy: this.mcpConnectionManager.isConnectionHealthy(),
        availableFunctions: connectionStatus.availableFunctions.length,
        functionUsage: executionReport.mcpFunctionUsage,
      },
      recommendations,
    };
  }

  /**
   * Generate MCP-specific recommendations
   */
  private generateMCPRecommendations(connectionStatus: any): string[] {
    const recommendations: string[] = [];

    if (!connectionStatus.isConnected) {
      recommendations.push(
        'Establish MCP connection to enable real testing functionality'
      );
    }

    if (connectionStatus.connectionErrors.length > 0) {
      recommendations.push(
        'Review and resolve MCP connection errors for better test reliability'
      );
    }

    if (connectionStatus.connectionLatency > 1000) {
      recommendations.push(
        'High MCP connection latency detected - consider optimizing connection'
      );
    }

    if (connectionStatus.availableFunctions.length < 8) {
      recommendations.push(
        'Some MCP functions may be unavailable - verify chrome-devtools server setup'
      );
    }

    return recommendations;
  }

  /**
   * Get real execution statistics
   */
  getRealExecutionStatistics() {
    return this.executor.getRealScenarioStatistics();
  }

  /**
   * Get real execution history
   */
  getRealExecutionHistory(): RealTestResult[] {
    return this.executor.getRealExecutionHistory();
  }

  /**
   * Get available frameworks
   */
  getAvailableFrameworks(): Map<string, RealTestScenarioFramework> {
    return new Map(this.frameworks);
  }

  /**
   * Get registered real scenarios
   */
  getRegisteredRealScenarios(): string[] {
    return this.executor.getRegisteredRealScenarios();
  }

  /**
   * Check if a scenario is critical
   */
  private isCriticalScenario(scenarioName: string): boolean {
    const criticalScenarios = [
      'Real Extension Loading Test',
      'Real Cross-Component Communication Test',
    ];
    return criticalScenarios.includes(scenarioName);
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
   * Clear execution history
   */
  clearRealHistory(): void {
    this.executor.clearRealHistory();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up real test scenario manager...');
    this.clearAllRealSchedules();
    this.isInitialized = false;
  }
}
