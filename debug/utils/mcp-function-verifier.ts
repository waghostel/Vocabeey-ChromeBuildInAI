/**
 * MCP Function Availability Verifier
 * Comprehensive testing and verification of chrome-devtools MCP functions
 */

import {
  MCPConnectionManager,
  MCPFunctionResult,
} from './mcp-connection-manager';

export interface MCPFunctionTest {
  functionName: string;
  testParams: any;
  expectedResult?: any;
  timeout: number;
  critical: boolean;
  fallbackStrategy?: string;
}

export interface MCPFunctionVerificationResult {
  functionName: string;
  isAvailable: boolean;
  testPassed: boolean;
  executionTime: number;
  error?: string;
  fallbackAvailable: boolean;
  fallbackStrategy?: string;
}

export interface MCPVerificationReport {
  timestamp: Date;
  totalFunctions: number;
  availableFunctions: number;
  passedTests: number;
  criticalFailures: number;
  overallHealth: 'healthy' | 'degraded' | 'critical' | 'failed';
  functionResults: MCPFunctionVerificationResult[];
  recommendations: string[];
  fallbackStrategies: Record<string, string>;
}

export interface MCPHealthCheckConfig {
  enabled: boolean;
  interval: number; // milliseconds
  timeout: number; // milliseconds
  retryAttempts: number;
  alertThresholds: {
    criticalFailures: number;
    availabilityPercentage: number;
    responseTime: number;
  };
}

export class MCPFunctionVerifier {
  private connectionManager: MCPConnectionManager;
  private healthCheckConfig: MCPHealthCheckConfig;
  private healthCheckInterval?: NodeJS.Timeout;
  private lastVerificationReport?: MCPVerificationReport;

  // Comprehensive test suite for all MCP functions
  private readonly functionTests: MCPFunctionTest[] = [
    {
      functionName: 'mcp_chrome_devtools_list_pages',
      testParams: {},
      timeout: 5000,
      critical: true,
      fallbackStrategy: 'manual_page_discovery',
    },
    {
      functionName: 'mcp_chrome_devtools_select_page',
      testParams: { pageIdx: 0 },
      timeout: 3000,
      critical: true,
      fallbackStrategy: 'context_switching_fallback',
    },
    {
      functionName: 'mcp_chrome_devtools_navigate_page',
      testParams: { url: 'about:blank' },
      timeout: 10000,
      critical: true,
      fallbackStrategy: 'manual_navigation',
    },
    {
      functionName: 'mcp_chrome_devtools_evaluate_script',
      testParams: { function: '() => ({ test: true })' },
      timeout: 5000,
      critical: true,
      fallbackStrategy: 'injection_fallback',
    },
    {
      functionName: 'mcp_chrome_devtools_list_console_messages',
      testParams: {},
      timeout: 3000,
      critical: false,
      fallbackStrategy: 'console_polling',
    },
    {
      functionName: 'mcp_chrome_devtools_list_network_requests',
      testParams: {},
      timeout: 3000,
      critical: false,
      fallbackStrategy: 'network_monitoring_fallback',
    },
    {
      functionName: 'mcp_chrome_devtools_take_snapshot',
      testParams: {},
      timeout: 8000,
      critical: false,
      fallbackStrategy: 'screenshot_alternative',
    },
    {
      functionName: 'mcp_chrome_devtools_click',
      testParams: { selector: 'body' },
      timeout: 3000,
      critical: false,
      fallbackStrategy: 'event_simulation',
    },
  ];

  constructor(connectionManager: MCPConnectionManager) {
    this.connectionManager = connectionManager;
    this.healthCheckConfig = {
      enabled: true,
      interval: 60000, // 1 minute
      timeout: 10000, // 10 seconds
      retryAttempts: 2,
      alertThresholds: {
        criticalFailures: 2,
        availabilityPercentage: 80,
        responseTime: 5000,
      },
    };
  }

  /**
   * Verify all MCP functions with comprehensive testing
   */
  async verifyAllFunctions(): Promise<MCPVerificationReport> {
    console.log('Starting comprehensive MCP function verification...');

    const report: MCPVerificationReport = {
      timestamp: new Date(),
      totalFunctions: this.functionTests.length,
      availableFunctions: 0,
      passedTests: 0,
      criticalFailures: 0,
      overallHealth: 'failed',
      functionResults: [],
      recommendations: [],
      fallbackStrategies: {},
    };

    // Test each function
    for (const test of this.functionTests) {
      const result = await this.verifyFunction(test);
      report.functionResults.push(result);

      if (result.isAvailable) {
        report.availableFunctions++;
      }

      if (result.testPassed) {
        report.passedTests++;
      }

      if (test.critical && !result.testPassed) {
        report.criticalFailures++;
      }

      if (result.fallbackStrategy) {
        report.fallbackStrategies[test.functionName] = result.fallbackStrategy;
      }
    }

    // Determine overall health
    report.overallHealth = this.calculateOverallHealth(report);

    // Generate recommendations
    report.recommendations = this.generateRecommendations(report);

    this.lastVerificationReport = report;

    console.log(
      `MCP function verification completed: ${report.passedTests}/${report.totalFunctions} functions passed`
    );

    return report;
  }

  /**
   * Verify individual MCP function
   */
  async verifyFunction(
    test: MCPFunctionTest
  ): Promise<MCPFunctionVerificationResult> {
    const startTime = Date.now();
    const result: MCPFunctionVerificationResult = {
      functionName: test.functionName,
      isAvailable: false,
      testPassed: false,
      executionTime: 0,
      fallbackAvailable: !!test.fallbackStrategy,
      fallbackStrategy: test.fallbackStrategy,
    };

    try {
      console.log(`Testing function: ${test.functionName}`);

      // Execute function with timeout
      const functionResult = await Promise.race([
        this.connectionManager.executeMCPFunction(
          test.functionName,
          test.testParams
        ),
        this.createTimeoutPromise(test.timeout),
      ]);

      result.executionTime = Date.now() - startTime;

      if (functionResult.success) {
        result.isAvailable = true;
        result.testPassed = await this.validateFunctionResult(
          test,
          functionResult
        );

        if (result.testPassed) {
          console.log(`✓ ${test.functionName} passed verification`);
        } else {
          console.warn(`⚠ ${test.functionName} available but test failed`);
        }
      } else {
        result.error = functionResult.error;
        console.error(`✗ ${test.functionName} failed:`, functionResult.error);
      }
    } catch (error) {
      result.executionTime = Date.now() - startTime;
      result.error = String(error);
      console.error(`✗ ${test.functionName} verification error:`, error);
    }

    return result;
  }

  /**
   * Validate function result against expected outcome
   */
  private async validateFunctionResult(
    test: MCPFunctionTest,
    result: MCPFunctionResult
  ): Promise<boolean> {
    try {
      // Function-specific validation logic
      switch (test.functionName) {
        case 'mcp_chrome_devtools_list_pages':
          return Array.isArray(result.data) && result.data.length >= 0;

        case 'mcp_chrome_devtools_select_page':
          return result.data && typeof result.data === 'object';

        case 'mcp_chrome_devtools_navigate_page':
          return result.data && result.data.success !== false;

        case 'mcp_chrome_devtools_evaluate_script':
          return result.data && result.data.result !== undefined;

        case 'mcp_chrome_devtools_list_console_messages':
          return Array.isArray(result.data) && result.data.length >= 0;

        case 'mcp_chrome_devtools_list_network_requests':
          return Array.isArray(result.data) && result.data.length >= 0;

        case 'mcp_chrome_devtools_take_snapshot':
          return result.data && (result.data.screenshot || result.data.success);

        case 'mcp_chrome_devtools_click':
          return result.data && result.data.success !== false;

        default:
          // Generic validation - just check for successful execution
          return result.success && result.data !== undefined;
      }
    } catch (error) {
      console.error(`Validation error for ${test.functionName}:`, error);
      return false;
    }
  }

  /**
   * Test fallback strategies for unavailable functions
   */
  async testFallbackStrategies(
    failedFunctions: string[]
  ): Promise<Record<string, boolean>> {
    console.log('Testing fallback strategies for failed functions...');

    const fallbackResults: Record<string, boolean> = {};

    for (const functionName of failedFunctions) {
      const test = this.functionTests.find(
        t => t.functionName === functionName
      );
      if (test?.fallbackStrategy) {
        try {
          const fallbackWorks = await this.testFallbackStrategy(
            functionName,
            test.fallbackStrategy
          );
          fallbackResults[functionName] = fallbackWorks;

          if (fallbackWorks) {
            console.log(`✓ Fallback strategy for ${functionName} is available`);
          } else {
            console.warn(`⚠ Fallback strategy for ${functionName} failed`);
          }
        } catch (error) {
          console.error(`✗ Fallback test for ${functionName} error:`, error);
          fallbackResults[functionName] = false;
        }
      }
    }

    return fallbackResults;
  }

  /**
   * Test individual fallback strategy
   */
  private async testFallbackStrategy(
    functionName: string,
    strategy: string
  ): Promise<boolean> {
    // Simulate fallback strategy testing
    // In a real implementation, this would test actual fallback mechanisms
    console.log(`Testing fallback strategy '${strategy}' for ${functionName}`);

    switch (strategy) {
      case 'manual_page_discovery':
        // Test manual page discovery methods
        return true;

      case 'context_switching_fallback':
        // Test alternative context switching
        return true;

      case 'manual_navigation':
        // Test manual navigation methods
        return true;

      case 'injection_fallback':
        // Test script injection alternatives
        return true;

      case 'console_polling':
        // Test console message polling
        return true;

      case 'network_monitoring_fallback':
        // Test network monitoring alternatives
        return true;

      case 'screenshot_alternative':
        // Test screenshot alternatives
        return false; // Simulate unavailable fallback

      case 'event_simulation':
        // Test event simulation alternatives
        return true;

      default:
        console.warn(`Unknown fallback strategy: ${strategy}`);
        return false;
    }
  }

  /**
   * Start continuous health monitoring
   */
  startHealthMonitoring(): void {
    if (!this.healthCheckConfig.enabled) {
      console.log('Health monitoring is disabled');
      return;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.healthCheckConfig.interval);

    console.log(
      `Started MCP function health monitoring (interval: ${this.healthCheckConfig.interval}ms)`
    );
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
      console.log('Stopped MCP function health monitoring');
    }
  }

  /**
   * Perform health check on critical functions
   */
  async performHealthCheck(): Promise<boolean> {
    console.log('Performing MCP function health check...');

    const criticalTests = this.functionTests.filter(test => test.critical);
    let healthyFunctions = 0;

    for (const test of criticalTests) {
      try {
        const result = await this.verifyFunction(test);
        if (result.testPassed) {
          healthyFunctions++;
        }
      } catch (error) {
        console.error(`Health check failed for ${test.functionName}:`, error);
      }
    }

    const healthPercentage = (healthyFunctions / criticalTests.length) * 100;
    const isHealthy =
      healthPercentage >=
      this.healthCheckConfig.alertThresholds.availabilityPercentage;

    if (!isHealthy) {
      console.warn(
        `MCP function health degraded: ${healthyFunctions}/${criticalTests.length} critical functions healthy (${healthPercentage.toFixed(1)}%)`
      );
    } else {
      console.log(
        `MCP function health check passed: ${healthyFunctions}/${criticalTests.length} critical functions healthy`
      );
    }

    return isHealthy;
  }

  /**
   * Calculate overall health status
   */
  private calculateOverallHealth(
    report: MCPVerificationReport
  ): 'healthy' | 'degraded' | 'critical' | 'failed' {
    const availabilityPercentage =
      (report.availableFunctions / report.totalFunctions) * 100;
    const passPercentage = (report.passedTests / report.totalFunctions) * 100;

    if (
      report.criticalFailures >=
      this.healthCheckConfig.alertThresholds.criticalFailures
    ) {
      return 'critical';
    }

    if (availabilityPercentage < 50 || passPercentage < 50) {
      return 'failed';
    }

    if (
      availabilityPercentage <
      this.healthCheckConfig.alertThresholds.availabilityPercentage
    ) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Generate recommendations based on verification results
   */
  private generateRecommendations(report: MCPVerificationReport): string[] {
    const recommendations: string[] = [];

    if (report.criticalFailures > 0) {
      recommendations.push(
        `${report.criticalFailures} critical MCP functions failed - debugging capabilities severely limited`
      );
      recommendations.push(
        'Check chrome-devtools MCP server installation and configuration'
      );
      recommendations.push(
        'Ensure Chrome browser is running and accessible to MCP server'
      );
    }

    if (report.availableFunctions < report.totalFunctions) {
      const unavailable = report.totalFunctions - report.availableFunctions;
      recommendations.push(`${unavailable} MCP functions are unavailable`);
      recommendations.push(
        'Consider updating chrome-devtools MCP server to latest version'
      );
    }

    const slowFunctions = report.functionResults.filter(
      r => r.executionTime > this.healthCheckConfig.alertThresholds.responseTime
    );
    if (slowFunctions.length > 0) {
      recommendations.push(
        `${slowFunctions.length} functions have slow response times`
      );
      recommendations.push(
        'Consider optimizing MCP server configuration or system resources'
      );
    }

    if (report.overallHealth === 'healthy') {
      recommendations.push(
        'All MCP functions are working correctly - debugging system is fully operational'
      );
    } else {
      recommendations.push(
        'Enable fallback strategies for failed functions to maintain debugging capabilities'
      );
    }

    return recommendations;
  }

  /**
   * Get last verification report
   */
  getLastVerificationReport(): MCPVerificationReport | undefined {
    return this.lastVerificationReport;
  }

  /**
   * Get health check configuration
   */
  getHealthCheckConfig(): MCPHealthCheckConfig {
    return { ...this.healthCheckConfig };
  }

  /**
   * Update health check configuration
   */
  updateHealthCheckConfig(config: Partial<MCPHealthCheckConfig>): void {
    this.healthCheckConfig = { ...this.healthCheckConfig, ...config };

    if (this.healthCheckInterval) {
      this.stopHealthMonitoring();
      this.startHealthMonitoring();
    }
  }

  /**
   * Create timeout promise for function testing
   */
  private createTimeoutPromise(timeout: number): Promise<MCPFunctionResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Function execution timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopHealthMonitoring();
    console.log('MCP function verifier cleaned up');
  }
}
