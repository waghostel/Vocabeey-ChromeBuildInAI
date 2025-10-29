/**
 * MCP Integration Test
 * Tests the complete MCP connection and function verification system
 */

import { MCPConnectionManager } from './utils/mcp-connection-manager';
import { MCPFunctionVerifier } from './utils/mcp-function-verifier';

/**
 * Test MCP integration system
 */
export async function testMCPIntegration(): Promise<void> {
  console.log('=== MCP Integration Test ===');

  try {
    // Initialize MCP connection manager
    console.log('\n1. Initializing MCP Connection Manager...');
    const connectionManager = new MCPConnectionManager({
      connectionTimeout: 15000,
      retryAttempts: 3,
    });

    // Test connection initialization
    console.log('\n2. Testing MCP Connection...');
    const connectionResult = await connectionManager.initializeMCPConnection();

    if (!connectionResult) {
      console.error('❌ MCP connection failed');
      console.log(
        'Connection Status:',
        connectionManager.getConnectionSummary()
      );
      return;
    }

    console.log('✅ MCP connection established successfully');
    console.log('Connection Status:', connectionManager.getConnectionSummary());

    // Initialize function verifier
    console.log('\n3. Initializing Function Verifier...');
    const functionVerifier = new MCPFunctionVerifier(connectionManager);

    // Test function verification
    console.log('\n4. Verifying MCP Functions...');
    const verificationReport = await functionVerifier.verifyAllFunctions();

    console.log('\n=== Verification Report ===');
    console.log(`Timestamp: ${verificationReport.timestamp.toISOString()}`);
    console.log(`Total Functions: ${verificationReport.totalFunctions}`);
    console.log(
      `Available Functions: ${verificationReport.availableFunctions}`
    );
    console.log(`Passed Tests: ${verificationReport.passedTests}`);
    console.log(`Critical Failures: ${verificationReport.criticalFailures}`);
    console.log(`Overall Health: ${verificationReport.overallHealth}`);

    // Display function results
    console.log('\n=== Function Test Results ===');
    for (const result of verificationReport.functionResults) {
      const status = result.testPassed ? '✅' : '❌';
      const fallback = result.fallbackAvailable ? '(fallback available)' : '';
      console.log(
        `${status} ${result.functionName} - ${result.executionTime}ms ${fallback}`
      );
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }

    // Display recommendations
    if (verificationReport.recommendations.length > 0) {
      console.log('\n=== Recommendations ===');
      verificationReport.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    // Test fallback strategies for failed functions
    const failedFunctions = verificationReport.functionResults
      .filter(r => !r.testPassed)
      .map(r => r.functionName);

    if (failedFunctions.length > 0) {
      console.log('\n5. Testing Fallback Strategies...');
      const fallbackResults =
        await functionVerifier.testFallbackStrategies(failedFunctions);

      console.log('\n=== Fallback Strategy Results ===');
      for (const [functionName, works] of Object.entries(fallbackResults)) {
        const status = works ? '✅' : '❌';
        const strategy = verificationReport.fallbackStrategies[functionName];
        console.log(`${status} ${functionName}: ${strategy}`);
      }
    }

    // Test health monitoring
    console.log('\n6. Testing Health Monitoring...');
    functionVerifier.startHealthMonitoring();

    // Wait for one health check cycle
    console.log('Waiting for health check...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const healthCheckResult = await functionVerifier.performHealthCheck();
    console.log(
      `Health Check Result: ${healthCheckResult ? '✅ Healthy' : '❌ Unhealthy'}`
    );

    // Test individual function execution
    console.log('\n7. Testing Individual Function Execution...');
    const testFunctions = [
      'mcp_chrome_devtools_list_pages',
      'mcp_chrome_devtools_evaluate_script',
    ];

    for (const functionName of testFunctions) {
      try {
        const result = await connectionManager.executeMCPFunction(
          functionName,
          {}
        );
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${functionName} - ${result.executionTime}ms`);
        if (!result.success) {
          console.log(`   Error: ${result.error}`);
        }
      } catch (error) {
        console.log(`❌ ${functionName} - Exception: ${error}`);
      }
    }

    // Test error handling
    console.log('\n8. Testing Error Handling...');
    const errorResult = await connectionManager.handleMCPError(
      'Test error for error handling verification',
      'integration_test'
    );
    console.log(`Error Handling Result: ${errorResult ? '✅' : '❌'}`);

    // Display final status
    console.log('\n=== Final Status ===');
    console.log(
      `Connection Healthy: ${connectionManager.isConnectionHealthy() ? '✅' : '❌'}`
    );
    console.log(
      `Functions Verified: ${verificationReport.passedTests}/${verificationReport.totalFunctions}`
    );
    console.log(
      `System Status: ${verificationReport.overallHealth.toUpperCase()}`
    );

    // Cleanup
    console.log('\n9. Cleaning up...');
    functionVerifier.cleanup();
    connectionManager.cleanup();

    console.log('\n✅ MCP Integration Test Completed Successfully');
  } catch (error) {
    console.error('\n❌ MCP Integration Test Failed:', error);
    throw error;
  }
}

/**
 * Run the test if this file is executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  testMCPIntegration()
    .then(() => {
      console.log('\nTest completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\nTest failed:', error);
      process.exit(1);
    });
}
