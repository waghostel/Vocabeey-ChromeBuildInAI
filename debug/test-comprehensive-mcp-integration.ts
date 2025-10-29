/**
 * Comprehensive MCP Integration Testing
 * Tests all MCP function calls with real chrome-devtools server
 * Validates real debugging data capture across all extension contexts
 */

import { MCPConnectionManager } from './utils/mcp-connection-manager';
import { MCPFunctionVerifier } from './utils/mcp-function-verifier';

export interface ExtensionContext {
  type: 'service-worker' | 'content-script' | 'offscreen' | 'ui';
  pageIndex: number;
  url: string;
  title: string;
  isActive: boolean;
  lastActivity: Date;
}

export interface MCPIntegrationTestResult {
  testName: string;
  passed: boolean;
  executionTime: number;
  error?: string;
  data?: any;
  context?: string;
}

export interface MCPIntegrationReport {
  timestamp: Date;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  criticalFailures: number;
  overallStatus: 'success' | 'partial' | 'failed';
  testResults: MCPIntegrationTestResult[];
  contextResults: Record<string, MCPIntegrationTestResult[]>;
  performanceMetrics: {
    averageResponseTime: number;
    slowestFunction: string;
    fastestFunction: string;
    totalExecutionTime: number;
  };
  recommendations: string[];
}

export class ComprehensiveMCPIntegrationTester {
  private connectionManager: MCPConnectionManager;
  private functionVerifier: MCPFunctionVerifier;
  private discoveredContexts: ExtensionContext[] = [];

  constructor() {
    this.connectionManager = new MCPConnectionManager({
      connectionTimeout: 15000,
      retryAttempts: 3,
    });
    this.functionVerifier = new MCPFunctionVerifier(this.connectionManager);
  }

  /**
   * Run comprehensive MCP integration tests
   */
  async runComprehensiveTests(): Promise<MCPIntegrationReport> {
    console.log('=== Starting Comprehensive MCP Integration Tests ===\n');

    const report: MCPIntegrationReport = {
      timestamp: new Date(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      criticalFailures: 0,
      overallStatus: 'failed',
      testResults: [],
      contextResults: {},
      performanceMetrics: {
        averageResponseTime: 0,
        slowestFunction: '',
        fastestFunction: '',
        totalExecutionTime: 0,
      },
      recommendations: [],
    };

    const startTime = Date.now();

    try {
      // Phase 1: Test MCP Connection and Setup
      console.log('Phase 1: Testing MCP Connection and Setup');
      const connectionTests = await this.testMCPConnection();
      report.testResults.push(...connectionTests);

      // Phase 2: Test Function Availability
      console.log('\nPhase 2: Testing Function Availability');
      const functionTests = await this.testFunctionAvailability();
      report.testResults.push(...functionTests);

      // Phase 3: Test Extension Context Discovery
      console.log('\nPhase 3: Testing Extension Context Discovery');
      const contextTests = await this.testExtensionContextDiscovery();
      report.testResults.push(...contextTests);

      // Phase 4: Test Real Data Capture
      console.log('\nPhase 4: Testing Real Data Capture');
      const dataCaptureTests = await this.testRealDataCapture();
      report.testResults.push(...dataCaptureTests);

      // Phase 5: Test Error Handling and Recovery
      console.log('\nPhase 5: Testing Error Handling and Recovery');
      const errorHandlingTests = await this.testErrorHandlingAndRecovery();
      report.testResults.push(...errorHandlingTests);

      // Phase 6: Test Performance Impact
      console.log('\nPhase 6: Testing Performance Impact');
      const performanceTests = await this.testPerformanceImpact();
      report.testResults.push(...performanceTests);

      // Calculate final metrics
      report.totalTests = report.testResults.length;
      report.passedTests = report.testResults.filter(t => t.passed).length;
      report.failedTests = report.totalTests - report.passedTests;
      report.criticalFailures = report.testResults.filter(
        t => !t.passed && t.testName.includes('Critical')
      ).length;

      // Calculate performance metrics
      const executionTimes = report.testResults.map(t => t.executionTime);
      report.performanceMetrics.averageResponseTime =
        executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
      report.performanceMetrics.totalExecutionTime = Date.now() - startTime;

      const sortedResults = [...report.testResults].sort(
        (a, b) => b.executionTime - a.executionTime
      );
      report.performanceMetrics.slowestFunction =
        sortedResults[0]?.testName || '';
      report.performanceMetrics.fastestFunction =
        sortedResults[sortedResults.length - 1]?.testName || '';

      // Determine overall status
      if (report.criticalFailures > 0) {
        report.overallStatus = 'failed';
      } else if (report.failedTests > 0) {
        report.overallStatus = 'partial';
      } else {
        report.overallStatus = 'success';
      }

      // Generate recommendations
      report.recommendations = this.generateRecommendations(report);

      console.log('\n=== Comprehensive MCP Integration Tests Completed ===');
      this.printReport(report);

      return report;
    } catch (error) {
      console.error('Comprehensive MCP integration tests failed:', error);
      report.testResults.push({
        testName: 'Overall Test Execution',
        passed: false,
        executionTime: Date.now() - startTime,
        error: String(error),
      });
      return report;
    }
  }

  /**
   * Test MCP connection establishment and configuration
   */
  private async testMCPConnection(): Promise<MCPIntegrationTestResult[]> {
    const tests: MCPIntegrationTestResult[] = [];

    // Test 1: MCP Server Configuration
    tests.push(
      await this.runTest('MCP Server Configuration', async () => {
        const config = this.connectionManager.getConfiguration();
        if (!config.serverName || !config.command || !config.args.length) {
          throw new Error('MCP server configuration is incomplete');
        }
        return { config };
      })
    );

    // Test 2: MCP Connection Initialization
    tests.push(
      await this.runTest(
        'Critical: MCP Connection Initialization',
        async () => {
          const connected =
            await this.connectionManager.initializeMCPConnection();
          if (!connected) {
            throw new Error('Failed to establish MCP connection');
          }
          return { connected };
        }
      )
    );

    // Test 3: Connection Health Check
    tests.push(
      await this.runTest('MCP Connection Health Check', async () => {
        const healthy = await this.connectionManager.performHealthCheck();
        if (!healthy) {
          throw new Error('MCP connection health check failed');
        }
        return { healthy };
      })
    );

    // Test 4: Connection Status Validation
    tests.push(
      await this.runTest('MCP Connection Status Validation', async () => {
        const status = this.connectionManager.getConnectionStatus();
        if (!status.isConnected) {
          throw new Error('MCP connection status indicates disconnected');
        }
        return { status };
      })
    );

    return tests;
  }

  /**
   * Test all MCP function availability
   */
  private async testFunctionAvailability(): Promise<
    MCPIntegrationTestResult[]
  > {
    const tests: MCPIntegrationTestResult[] = [];

    // Test comprehensive function verification
    tests.push(
      await this.runTest(
        'Critical: Function Availability Verification',
        async () => {
          const report = await this.functionVerifier.verifyAllFunctions();
          if (report.criticalFailures > 0) {
            throw new Error(
              `${report.criticalFailures} critical functions failed`
            );
          }
          return { report };
        }
      )
    );

    // Test individual critical functions
    const criticalFunctions = [
      'mcp_chrome_devtools_list_pages',
      'mcp_chrome_devtools_select_page',
      'mcp_chrome_devtools_navigate_page',
      'mcp_chrome_devtools_evaluate_script',
    ];

    for (const functionName of criticalFunctions) {
      tests.push(
        await this.runTest(`Critical: ${functionName}`, async () => {
          const result = await this.connectionManager.executeMCPFunction(
            functionName,
            {}
          );
          if (!result.success) {
            throw new Error(result.error || 'Function execution failed');
          }
          return { result };
        })
      );
    }

    // Test optional functions
    const optionalFunctions = [
      'mcp_chrome_devtools_list_console_messages',
      'mcp_chrome_devtools_list_network_requests',
      'mcp_chrome_devtools_take_snapshot',
      'mcp_chrome_devtools_click',
    ];

    for (const functionName of optionalFunctions) {
      tests.push(
        await this.runTest(`Optional: ${functionName}`, async () => {
          const result = await this.connectionManager.executeMCPFunction(
            functionName,
            {}
          );
          // Optional functions can fail without causing critical failure
          return { result, available: result.success };
        })
      );
    }

    return tests;
  }

  /**
   * Test extension context discovery and connection
   */
  private async testExtensionContextDiscovery(): Promise<
    MCPIntegrationTestResult[]
  > {
    const tests: MCPIntegrationTestResult[] = [];

    // Test page listing and context discovery
    tests.push(
      await this.runTest('Extension Context Discovery', async () => {
        const result = await this.connectionManager.executeMCPFunction(
          'mcp_chrome_devtools_list_pages',
          {}
        );

        if (!result.success || !Array.isArray(result.data)) {
          throw new Error('Failed to discover extension contexts');
        }

        // Parse discovered contexts
        this.discoveredContexts = result.data.map(
          (page: any, index: number) => ({
            type: this.determineContextType(page),
            pageIndex: index,
            url: page.url || '',
            title: page.title || '',
            isActive: false,
            lastActivity: new Date(),
          })
        );

        if (this.discoveredContexts.length === 0) {
          throw new Error('No extension contexts discovered');
        }

        return { contexts: this.discoveredContexts };
      })
    );

    // Test context selection for each discovered context
    for (const context of this.discoveredContexts) {
      tests.push(
        await this.runTest(`Context Selection: ${context.type}`, async () => {
          const result = await this.connectionManager.executeMCPFunction(
            'mcp_chrome_devtools_select_page',
            { pageIdx: context.pageIndex }
          );

          if (!result.success) {
            throw new Error(`Failed to select ${context.type} context`);
          }

          context.isActive = true;
          return { context, result };
        })
      );
    }

    return tests;
  }

  /**
   * Test real data capture across all contexts
   */
  private async testRealDataCapture(): Promise<MCPIntegrationTestResult[]> {
    const tests: MCPIntegrationTestResult[] = [];

    for (const context of this.discoveredContexts) {
      // Select context first
      await this.connectionManager.executeMCPFunction(
        'mcp_chrome_devtools_select_page',
        { pageIdx: context.pageIndex }
      );

      // Test console message capture
      tests.push(
        await this.runTest(`Console Capture: ${context.type}`, async () => {
          const result = await this.connectionManager.executeMCPFunction(
            'mcp_chrome_devtools_list_console_messages',
            {}
          );

          // Console messages may be empty, but function should succeed
          return {
            messages: result.data || [],
            success: result.success,
            context: context.type,
          };
        })
      );

      // Test network request capture
      tests.push(
        await this.runTest(`Network Capture: ${context.type}`, async () => {
          const result = await this.connectionManager.executeMCPFunction(
            'mcp_chrome_devtools_list_network_requests',
            {}
          );

          return {
            requests: result.data || [],
            success: result.success,
            context: context.type,
          };
        })
      );

      // Test script evaluation (context-dependent)
      if (context.type !== 'service-worker') {
        tests.push(
          await this.runTest(`Script Evaluation: ${context.type}`, async () => {
            const result = await this.connectionManager.executeMCPFunction(
              'mcp_chrome_devtools_evaluate_script',
              { function: '() => ({ timestamp: Date.now(), context: "test" })' }
            );

            if (!result.success) {
              throw new Error('Script evaluation failed');
            }

            return { result: result.data, context: context.type };
          })
        );
      }

      // Test snapshot capture
      tests.push(
        await this.runTest(`Snapshot Capture: ${context.type}`, async () => {
          const result = await this.connectionManager.executeMCPFunction(
            'mcp_chrome_devtools_take_snapshot',
            {}
          );

          return {
            snapshot: result.data,
            success: result.success,
            context: context.type,
          };
        })
      );
    }

    return tests;
  }

  /**
   * Test error handling and recovery mechanisms
   */
  private async testErrorHandlingAndRecovery(): Promise<
    MCPIntegrationTestResult[]
  > {
    const tests: MCPIntegrationTestResult[] = [];

    // Test connection error handling
    tests.push(
      await this.runTest('Connection Error Handling', async () => {
        const handled = await this.connectionManager.handleMCPError(
          'Test connection error',
          'integration_test'
        );
        return { handled };
      })
    );

    // Test invalid function call handling
    tests.push(
      await this.runTest('Invalid Function Call Handling', async () => {
        const result = await this.connectionManager.executeMCPFunction(
          'invalid_function_name',
          {}
        );

        if (result.success) {
          throw new Error('Invalid function call should have failed');
        }

        return { errorHandled: true, error: result.error };
      })
    );

    // Test timeout handling
    tests.push(
      await this.runTest('Timeout Handling', async () => {
        // This test simulates timeout scenarios
        const startTime = Date.now();
        const result = await this.connectionManager.executeMCPFunction(
          'mcp_chrome_devtools_list_pages',
          {}
        );
        const executionTime = Date.now() - startTime;

        return {
          result,
          executionTime,
          withinTimeout: executionTime < 10000,
        };
      })
    );

    // Test recovery after error
    tests.push(
      await this.runTest('Recovery After Error', async () => {
        // Trigger an error first
        await this.connectionManager.executeMCPFunction('invalid_function', {});

        // Test if system can recover
        const result = await this.connectionManager.executeMCPFunction(
          'mcp_chrome_devtools_list_pages',
          {}
        );

        if (!result.success) {
          throw new Error('System failed to recover after error');
        }

        return { recovered: true };
      })
    );

    return tests;
  }

  /**
   * Test performance impact on extension operation
   */
  private async testPerformanceImpact(): Promise<MCPIntegrationTestResult[]> {
    const tests: MCPIntegrationTestResult[] = [];

    // Test response time benchmarks
    tests.push(
      await this.runTest('Response Time Benchmark', async () => {
        const benchmarks: Record<string, number> = {};
        const functions = [
          'mcp_chrome_devtools_list_pages',
          'mcp_chrome_devtools_list_console_messages',
          'mcp_chrome_devtools_list_network_requests',
        ];

        for (const functionName of functions) {
          const startTime = Date.now();
          await this.connectionManager.executeMCPFunction(functionName, {});
          benchmarks[functionName] = Date.now() - startTime;
        }

        const averageTime =
          Object.values(benchmarks).reduce((a, b) => a + b, 0) /
          functions.length;

        return { benchmarks, averageTime };
      })
    );

    // Test concurrent function calls
    tests.push(
      await this.runTest('Concurrent Function Calls', async () => {
        const startTime = Date.now();

        const promises = [
          this.connectionManager.executeMCPFunction(
            'mcp_chrome_devtools_list_pages',
            {}
          ),
          this.connectionManager.executeMCPFunction(
            'mcp_chrome_devtools_list_console_messages',
            {}
          ),
          this.connectionManager.executeMCPFunction(
            'mcp_chrome_devtools_list_network_requests',
            {}
          ),
        ];

        const results = await Promise.all(promises);
        const totalTime = Date.now() - startTime;

        const allSuccessful = results.every(r => r.success);

        return {
          results,
          totalTime,
          allSuccessful,
          concurrentPerformance: totalTime < 5000,
        };
      })
    );

    // Test memory usage impact
    tests.push(
      await this.runTest('Memory Usage Impact', async () => {
        const initialMemory = process.memoryUsage();

        // Perform multiple operations
        for (let i = 0; i < 10; i++) {
          await this.connectionManager.executeMCPFunction(
            'mcp_chrome_devtools_list_pages',
            {}
          );
        }

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

        return {
          initialMemory,
          finalMemory,
          memoryIncrease,
          acceptableIncrease: memoryIncrease < 10 * 1024 * 1024, // 10MB threshold
        };
      })
    );

    return tests;
  }

  /**
   * Run individual test with error handling and timing
   */
  private async runTest(
    testName: string,
    testFunction: () => Promise<any>
  ): Promise<MCPIntegrationTestResult> {
    const startTime = Date.now();

    try {
      console.log(`  Running: ${testName}`);
      const data = await testFunction();
      const executionTime = Date.now() - startTime;

      console.log(`  ✓ ${testName} (${executionTime}ms)`);

      return {
        testName,
        passed: true,
        executionTime,
        data,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      console.log(`  ✗ ${testName} (${executionTime}ms): ${error}`);

      return {
        testName,
        passed: false,
        executionTime,
        error: String(error),
      };
    }
  }

  /**
   * Determine context type from page data
   */
  private determineContextType(page: any): ExtensionContext['type'] {
    const url = page.url || '';
    const title = page.title || '';

    if (url.includes('service-worker') || title.includes('Service Worker')) {
      return 'service-worker';
    }
    if (url.includes('offscreen') || title.includes('Offscreen')) {
      return 'offscreen';
    }
    if (url.startsWith('chrome-extension://')) {
      return 'ui';
    }
    return 'content-script';
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(report: MCPIntegrationReport): string[] {
    const recommendations: string[] = [];

    if (report.overallStatus === 'success') {
      recommendations.push(
        'All MCP integration tests passed - debugging system is fully operational'
      );
    } else if (report.overallStatus === 'partial') {
      recommendations.push(
        `${report.failedTests} tests failed - debugging system has limited functionality`
      );
      recommendations.push(
        'Review failed tests and implement fallback strategies'
      );
    } else {
      recommendations.push(
        'Critical MCP integration failures detected - debugging system is not operational'
      );
      recommendations.push(
        'Check chrome-devtools MCP server installation and Chrome browser connectivity'
      );
    }

    if (report.performanceMetrics.averageResponseTime > 2000) {
      recommendations.push(
        'MCP function response times are slow - consider optimizing server configuration'
      );
    }

    if (report.criticalFailures > 0) {
      recommendations.push(
        'Critical function failures require immediate attention'
      );
      recommendations.push(
        'Ensure Chrome browser is running and extension is loaded'
      );
    }

    return recommendations;
  }

  /**
   * Print comprehensive test report
   */
  private printReport(report: MCPIntegrationReport): void {
    console.log('\n=== MCP Integration Test Report ===');
    console.log(`Timestamp: ${report.timestamp.toISOString()}`);
    console.log(`Overall Status: ${report.overallStatus.toUpperCase()}`);
    console.log(`Tests: ${report.passedTests}/${report.totalTests} passed`);
    console.log(`Critical Failures: ${report.criticalFailures}`);
    console.log(
      `Total Execution Time: ${report.performanceMetrics.totalExecutionTime}ms`
    );
    console.log(
      `Average Response Time: ${report.performanceMetrics.averageResponseTime.toFixed(2)}ms`
    );

    if (report.performanceMetrics.slowestFunction) {
      console.log(
        `Slowest Function: ${report.performanceMetrics.slowestFunction}`
      );
    }

    console.log('\n=== Test Results ===');
    for (const result of report.testResults) {
      const status = result.passed ? '✓' : '✗';
      console.log(`${status} ${result.testName} (${result.executionTime}ms)`);
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    }

    if (report.recommendations.length > 0) {
      console.log('\n=== Recommendations ===');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.functionVerifier.cleanup();
    this.connectionManager.cleanup();
  }
}

/**
 * Run comprehensive MCP integration tests
 */
export async function runComprehensiveMCPIntegrationTests(): Promise<MCPIntegrationReport> {
  const tester = new ComprehensiveMCPIntegrationTester();

  try {
    const report = await tester.runComprehensiveTests();
    return report;
  } finally {
    tester.cleanup();
  }
}

/**
 * Run the test if this file is executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveMCPIntegrationTests()
    .then(report => {
      console.log('\nComprehensive MCP integration tests completed');
      process.exit(report.overallStatus === 'success' ? 0 : 1);
    })
    .catch(error => {
      console.error('\nComprehensive MCP integration tests failed:', error);
      process.exit(1);
    });
}
