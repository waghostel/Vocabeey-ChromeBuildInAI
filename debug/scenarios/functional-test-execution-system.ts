/**
 * Functional Test Execution System
 * Main entry point for real test scenario execution with MCP integration
 */

import { RealTestScenarioManager } from './real-test-scenario-manager';
import { MCPConnectionManager } from '../utils/mcp-connection-manager';
import { TestScenarioConfig } from '../types/debug-types';
import { RealTestResult } from './real-test-scenario-executor';

/**
 * Functional Test Execution System
 * Provides high-level interface for executing real test scenarios with MCP integration
 */
export class FunctionalTestExecutionSystem {
  private mcpConnectionManager: MCPConnectionManager;
  private realScenarioManager: RealTestScenarioManager;
  private isInitialized = false;

  constructor() {
    // Initialize MCP connection manager with chrome-devtools configuration
    this.mcpConnectionManager = new MCPConnectionManager({
      serverName: 'chrome-devtools',
      command: 'uvx',
      args: ['mcp-chrome-devtools@latest'],
      connectionTimeout: 15000,
      retryAttempts: 3,
      requiredFunctions: [
        'mcp_chrome_devtools_list_pages',
        'mcp_chrome_devtools_select_page',
        'mcp_chrome_devtools_navigate_page',
        'mcp_chrome_devtools_evaluate_script',
        'mcp_chrome_devtools_list_console_messages',
        'mcp_chrome_devtools_list_network_requests',
        'mcp_chrome_devtools_take_snapshot',
        'mcp_chrome_devtools_click',
      ],
    });

    this.realScenarioManager = new RealTestScenarioManager(
      this.mcpConnectionManager
    );
  }

  /**
   * Initialize the functional test execution system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('=== Initializing Functional Test Execution System ===');

    try {
      // Initialize MCP connection
      console.log('1. Establishing MCP connection...');
      const mcpConnected =
        await this.mcpConnectionManager.initializeMCPConnection();

      if (mcpConnected) {
        console.log('✓ MCP connection established successfully');
        console.log(
          `✓ Connection summary: ${this.mcpConnectionManager.getConnectionSummary()}`
        );
      } else {
        console.warn(
          '⚠ MCP connection failed - tests will run in fallback mode'
        );
        console.warn(
          '  Note: Install chrome-devtools MCP server for full functionality'
        );
      }

      // Initialize real scenario manager
      console.log('2. Initializing real test scenario manager...');
      await this.realScenarioManager.initialize();
      console.log('✓ Real test scenario manager initialized');

      this.isInitialized = true;
      console.log('✅ Functional Test Execution System ready');
      console.log(
        `📊 Available scenarios: ${this.realScenarioManager.getRegisteredRealScenarios().length}`
      );
      console.log(
        `🔧 Available frameworks: ${this.realScenarioManager.getAvailableFrameworks().size}`
      );
    } catch (error) {
      console.error(
        '❌ Failed to initialize Functional Test Execution System:',
        error
      );
      throw error;
    }
  }

  /**
   * Execute quick validation with real extension interaction
   */
  async executeQuickValidation(): Promise<RealTestResult[]> {
    await this.ensureInitialized();
    console.log(
      '🚀 Executing quick validation with real extension interaction...'
    );

    const results =
      await this.realScenarioManager.executeCriticalRealScenarios();

    console.log(
      `✅ Quick validation completed: ${results.filter(r => r.passed).length}/${results.length} scenarios passed`
    );
    return results;
  }

  /**
   * Execute comprehensive test suite with real MCP integration
   */
  async executeComprehensiveTest(): Promise<RealTestResult[]> {
    await this.ensureInitialized();
    console.log(
      '🔍 Executing comprehensive test suite with real MCP integration...'
    );

    const results = await this.realScenarioManager.executeAllRealScenarios();

    const passed = results.filter(r => r.passed).length;
    const validated = results.filter(r => r.validationResults.passed).length;
    console.log(
      `✅ Comprehensive test completed: ${passed}/${results.length} passed, ${validated}/${results.length} validated`
    );

    return results;
  }

  /**
   * Execute test framework with real functionality
   */
  async executeTestFramework(frameworkName: string): Promise<RealTestResult[]> {
    await this.ensureInitialized();
    console.log(`🎯 Executing test framework: ${frameworkName}`);

    const results =
      await this.realScenarioManager.executeFramework(frameworkName);

    console.log(
      `✅ Framework ${frameworkName} completed: ${results.filter(r => r.passed).length}/${results.length} scenarios passed`
    );
    return results;
  }

  /**
   * Execute custom test configuration with real scenarios
   */
  async executeCustomConfiguration(
    config: TestScenarioConfig
  ): Promise<RealTestResult[]> {
    await this.ensureInitialized();
    console.log('⚙️ Executing custom test configuration...');

    const results =
      await this.realScenarioManager.executeRealScenariosWithConfig(config);

    console.log(
      `✅ Custom configuration completed: ${results.filter(r => r.passed).length}/${results.length} scenarios passed`
    );
    return results;
  }

  /**
   * Schedule continuous monitoring with real extension testing
   */
  scheduleContinuousMonitoring(
    scenarios: string[],
    intervalMinutes: number,
    scheduleId: string = 'continuous-monitoring'
  ): void {
    const intervalMs = intervalMinutes * 60 * 1000;
    this.realScenarioManager.scheduleRealExecution(
      scenarios,
      intervalMs,
      scheduleId
    );

    console.log(
      `📅 Scheduled continuous monitoring every ${intervalMinutes} minutes`
    );
    console.log(`🔍 Monitoring scenarios: ${scenarios.join(', ')}`);
  }

  /**
   * Stop continuous monitoring
   */
  stopContinuousMonitoring(scheduleId: string = 'continuous-monitoring'): void {
    this.realScenarioManager.clearRealSchedule(scheduleId);
    console.log(`⏹️ Stopped continuous monitoring: ${scheduleId}`);
  }

  /**
   * Generate comprehensive real test report
   */
  generateComprehensiveReport(): any {
    const report = this.realScenarioManager.generateRealTestReport();

    console.log('📋 Generated comprehensive real test report');
    console.log(
      `📊 Summary: ${report.summary.passedScenarios}/${report.summary.executedScenarios} scenarios passed`
    );
    console.log(`🔧 MCP Status: ${report.summary.mcpConnectionStatus}`);
    console.log(
      `⚡ Average execution time: ${report.summary.averageExecutionTime.toFixed(0)}ms`
    );

    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    return report;
  }

  /**
   * Get real-time system status
   */
  getSystemStatus(): {
    initialized: boolean;
    mcpConnection: {
      connected: boolean;
      healthy: boolean;
      latency: number;
      availableFunctions: number;
      errors: string[];
    };
    scenarios: {
      registered: number;
      executed: number;
      successRate: number;
      validationRate: number;
    };
    frameworks: {
      available: number;
      names: string[];
    };
  } {
    const connectionStatus = this.mcpConnectionManager.getConnectionStatus();
    const executionStats =
      this.realScenarioManager.getRealExecutionStatistics();
    const frameworks = this.realScenarioManager.getAvailableFrameworks();

    return {
      initialized: this.isInitialized,
      mcpConnection: {
        connected: connectionStatus.isConnected,
        healthy: this.mcpConnectionManager.isConnectionHealthy(),
        latency: connectionStatus.connectionLatency,
        availableFunctions: connectionStatus.availableFunctions.length,
        errors: connectionStatus.connectionErrors,
      },
      scenarios: {
        registered: executionStats.totalScenarios,
        executed: executionStats.totalExecutions,
        successRate: executionStats.successRate,
        validationRate: executionStats.validationRate,
      },
      frameworks: {
        available: frameworks.size,
        names: Array.from(frameworks.keys()),
      },
    };
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): RealTestResult[] {
    return this.realScenarioManager.getRealExecutionHistory();
  }

  /**
   * Get available test frameworks
   */
  getAvailableFrameworks(): string[] {
    return Array.from(this.realScenarioManager.getAvailableFrameworks().keys());
  }

  /**
   * Get registered scenarios
   */
  getRegisteredScenarios(): string[] {
    return this.realScenarioManager.getRegisteredRealScenarios();
  }

  /**
   * Clear execution history
   */
  clearHistory(): void {
    this.realScenarioManager.clearRealHistory();
    console.log('🗑️ Execution history cleared');
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
    console.log('🧹 Cleaning up Functional Test Execution System...');

    await this.realScenarioManager.cleanup();
    this.mcpConnectionManager.cleanup();

    this.isInitialized = false;
    console.log('✅ Cleanup completed');
  }
}

// Create and export singleton instance
export const functionalTestExecutionSystem =
  new FunctionalTestExecutionSystem();

// Convenience functions for common operations
export async function runRealQuickValidation(): Promise<RealTestResult[]> {
  return functionalTestExecutionSystem.executeQuickValidation();
}

export async function runRealComprehensiveTest(): Promise<RealTestResult[]> {
  return functionalTestExecutionSystem.executeComprehensiveTest();
}

export async function runRealFrameworkTest(
  framework: string
): Promise<RealTestResult[]> {
  return functionalTestExecutionSystem.executeTestFramework(framework);
}

export async function scheduleRealContinuousMonitoring(
  scenarios: string[],
  intervalMinutes: number
): Promise<void> {
  functionalTestExecutionSystem.scheduleContinuousMonitoring(
    scenarios,
    intervalMinutes
  );
}

export function generateRealTestReport(): any {
  return functionalTestExecutionSystem.generateComprehensiveReport();
}

// Example configurations for real testing
export const realTestConfigurations = {
  quickValidation: {
    scenarios: ['Real Extension Loading Test'],
    timeout: 30000,
    stopOnFailure: true,
  } as TestScenarioConfig,

  extensionFunctionality: {
    scenarios: [
      'Real Extension Loading Test',
      'Real Content Script Integration Test',
    ],
    timeout: 60000,
    retries: 2,
  } as TestScenarioConfig,

  aiProcessing: {
    scenarios: ['Real AI Processing Test'],
    timeout: 90000,
    parallel: 1, // AI tests should run sequentially
  } as TestScenarioConfig,

  communication: {
    scenarios: ['Real Cross-Component Communication Test'],
    timeout: 45000,
    retries: 1,
  } as TestScenarioConfig,

  fullSuite: {
    scenarios: [
      'Real Extension Loading Test',
      'Real Content Script Integration Test',
      'Real AI Processing Test',
      'Real Cross-Component Communication Test',
    ],
    timeout: 180000,
    parallel: 2,
    stopOnFailure: false,
  } as TestScenarioConfig,
};
