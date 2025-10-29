/**
 * Test Storage and Caching Debugging System
 * Comprehensive test suite for storage operation monitoring, cache debugging, and data persistence validation
 */

import { StorageCachingDebugger } from './contexts/storage-caching-debugger';

export class StorageCachingDebugTest {
  private debugger: StorageCachingDebugger;

  constructor() {
    this.debugger = new StorageCachingDebugger();
  }

  /**
   * Run comprehensive storage and caching debugging tests
   */
  async runComprehensiveTests(): Promise<{
    testResults: any[];
    overallSuccess: boolean;
    summary: string;
  }> {
    console.log(
      '🔍 Starting comprehensive storage and caching debugging tests...'
    );

    const testResults: any[] = [];
    let overallSuccess = true;

    try {
      // Test 1: Start debugging session
      const sessionTest = await this.testDebuggingSession();
      testResults.push(sessionTest);
      if (!sessionTest.success) overallSuccess = false;

      // Test 2: Run comprehensive analysis
      const analysisTest = await this.testComprehensiveAnalysis();
      testResults.push(analysisTest);
      if (!analysisTest.success) overallSuccess = false;

      // Test 3: Test recovery scenarios
      const recoveryTest = await this.testRecoveryScenarios();
      testResults.push(recoveryTest);
      if (!recoveryTest.success) overallSuccess = false;

      // Test 4: Test real-time monitoring
      const monitoringTest = await this.testRealTimeMonitoring();
      testResults.push(monitoringTest);
      if (!monitoringTest.success) overallSuccess = false;

      // Test 5: Test individual components
      const componentTest = await this.testIndividualComponents();
      testResults.push(componentTest);
      if (!componentTest.success) overallSuccess = false;

      // Cleanup
      await this.debugger.stopDebuggingSession();

      const summary = this.generateTestSummary(testResults, overallSuccess);

      console.log('✅ Storage and caching debugging tests completed');
      return { testResults, overallSuccess, summary };
    } catch (error) {
      console.error('❌ Storage and caching debugging tests failed:', error);
      return {
        testResults,
        overallSuccess: false,
        summary: `Tests failed with error: ${error}`,
      };
    }
  }

  /**
   * Test debugging session management
   */
  private async testDebuggingSession(): Promise<any> {
    try {
      console.log('Testing debugging session management...');

      // Test session start
      const sessionId = await this.debugger.startDebuggingSession();

      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Failed to start debugging session');
      }

      // Test session status
      const status = this.debugger.getSessionStatus();

      if (!status.hasActiveSession || status.sessionId !== sessionId) {
        throw new Error('Session status not properly tracked');
      }

      return {
        testName: 'Debugging Session Management',
        success: true,
        details: {
          sessionId,
          status,
          message: 'Session started and tracked successfully',
        },
        duration: 0,
      };
    } catch (error) {
      return {
        testName: 'Debugging Session Management',
        success: false,
        error: error.toString(),
        duration: 0,
      };
    }
  }

  /**
   * Test comprehensive analysis functionality
   */
  private async testComprehensiveAnalysis(): Promise<any> {
    const startTime = performance.now();

    try {
      console.log('Testing comprehensive analysis...');

      const report = await this.debugger.runComprehensiveAnalysis();

      // Validate report structure
      const requiredFields = [
        'sessionId',
        'timestamp',
        'storageOperations',
        'cachePerformance',
        'dataIntegrity',
        'overallHealth',
        'actionableRecommendations',
        'nextSteps',
      ];

      for (const field of requiredFields) {
        if (!(field in report)) {
          throw new Error(`Missing required field in report: ${field}`);
        }
      }

      // Validate data types and ranges
      if (
        typeof report.storageOperations.successRate !== 'number' ||
        report.storageOperations.successRate < 0 ||
        report.storageOperations.successRate > 1
      ) {
        throw new Error('Invalid storage success rate');
      }

      if (
        typeof report.cachePerformance.hitRate !== 'number' ||
        report.cachePerformance.hitRate < 0 ||
        report.cachePerformance.hitRate > 1
      ) {
        throw new Error('Invalid cache hit rate');
      }

      if (
        !['excellent', 'good', 'warning', 'critical'].includes(
          report.overallHealth
        )
      ) {
        throw new Error('Invalid overall health status');
      }

      return {
        testName: 'Comprehensive Analysis',
        success: true,
        details: {
          report: {
            overallHealth: report.overallHealth,
            storageSuccessRate: report.storageOperations.successRate,
            cacheHitRate: report.cachePerformance.hitRate,
            dataIntegrityValid: report.dataIntegrity.isValid,
            recommendationCount: report.actionableRecommendations.length,
          },
          message: 'Comprehensive analysis completed successfully',
        },
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Comprehensive Analysis',
        success: false,
        error: error.toString(),
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Test recovery scenarios
   */
  private async testRecoveryScenarios(): Promise<any> {
    const startTime = performance.now();

    try {
      console.log('Testing recovery scenarios...');

      const recoveryResults = await this.debugger.testRecoveryScenarios();

      // Validate recovery results structure
      const requiredFields = [
        'storageRecovery',
        'cacheRecovery',
        'dataRecovery',
        'overallRecoveryReadiness',
      ];

      for (const field of requiredFields) {
        if (!(field in recoveryResults)) {
          throw new Error(
            `Missing required field in recovery results: ${field}`
          );
        }
      }

      // Validate recovery readiness
      if (
        !['excellent', 'good', 'needs_improvement', 'critical'].includes(
          recoveryResults.overallRecoveryReadiness
        )
      ) {
        throw new Error('Invalid recovery readiness status');
      }

      // Validate data recovery tests
      if (!Array.isArray(recoveryResults.dataRecovery)) {
        throw new Error('Data recovery results should be an array');
      }

      const successfulRecoveryTests = recoveryResults.dataRecovery.filter(
        test => test.success
      ).length;
      const totalRecoveryTests = recoveryResults.dataRecovery.length;

      return {
        testName: 'Recovery Scenarios',
        success: true,
        details: {
          overallRecoveryReadiness: recoveryResults.overallRecoveryReadiness,
          successfulRecoveryTests,
          totalRecoveryTests,
          storageRecoveryAvailable: recoveryResults.storageRecovery.length > 0,
          cacheRecoveryAvailable: !!recoveryResults.cacheRecovery,
          message: 'Recovery scenarios tested successfully',
        },
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Recovery Scenarios',
        success: false,
        error: error.toString(),
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Test real-time monitoring
   */
  private async testRealTimeMonitoring(): Promise<any> {
    const startTime = performance.now();

    try {
      console.log('Testing real-time monitoring...');

      // Run monitoring for a short duration (5 seconds for testing)
      const monitoringResults =
        await this.debugger.monitorRealTimeOperations(5000);

      // Validate monitoring results structure
      const requiredFields = [
        'monitoringDuration',
        'operationsSummary',
        'performanceAlerts',
        'recommendations',
      ];

      for (const field of requiredFields) {
        if (!(field in monitoringResults)) {
          throw new Error(
            `Missing required field in monitoring results: ${field}`
          );
        }
      }

      // Validate monitoring duration
      if (
        monitoringResults.monitoringDuration < 4000 ||
        monitoringResults.monitoringDuration > 6000
      ) {
        throw new Error('Monitoring duration outside expected range');
      }

      // Validate operations summary structure
      if (
        !monitoringResults.operationsSummary.storage ||
        !monitoringResults.operationsSummary.cache
      ) {
        throw new Error('Invalid operations summary structure');
      }

      return {
        testName: 'Real-time Monitoring',
        success: true,
        details: {
          monitoringDuration: monitoringResults.monitoringDuration,
          storageOperations:
            monitoringResults.operationsSummary.storage.operations,
          cacheOperations: monitoringResults.operationsSummary.cache.operations,
          performanceAlerts: monitoringResults.performanceAlerts.length,
          recommendations: monitoringResults.recommendations.length,
          message: 'Real-time monitoring completed successfully',
        },
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Real-time Monitoring',
        success: false,
        error: error.toString(),
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Test individual debugging components
   */
  private async testIndividualComponents(): Promise<any> {
    const startTime = performance.now();

    try {
      console.log('Testing individual debugging components...');

      const status = this.debugger.getSessionStatus();

      if (!status.hasActiveSession || !status.componentsStatus) {
        throw new Error('No active session or component status available');
      }

      const { storage, cache } = status.componentsStatus;

      // Validate storage component status
      if (typeof storage.isMonitoring !== 'boolean') {
        throw new Error('Invalid storage monitoring status');
      }

      // Validate cache component status
      if (typeof cache.isMonitoring !== 'boolean') {
        throw new Error('Invalid cache monitoring status');
      }

      // Test debugging history
      const history = this.debugger.getDebuggingHistory();

      if (!Array.isArray(history)) {
        throw new Error('Debugging history should be an array');
      }

      return {
        testName: 'Individual Components',
        success: true,
        details: {
          storageMonitoring: storage.isMonitoring,
          cacheMonitoring: cache.isMonitoring,
          storageOperationCount: storage.operationCount,
          cacheOperationCount: cache.operationCount,
          historyEntries: history.length,
          message: 'Individual components tested successfully',
        },
        duration: performance.now() - startTime,
      };
    } catch (error) {
      return {
        testName: 'Individual Components',
        success: false,
        error: error.toString(),
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Generate test summary
   */
  private generateTestSummary(
    testResults: any[],
    overallSuccess: boolean
  ): string {
    const totalTests = testResults.length;
    const successfulTests = testResults.filter(test => test.success).length;
    const failedTests = totalTests - successfulTests;

    let summary = `Storage and Caching Debugging Test Summary:\n`;
    summary += `Total Tests: ${totalTests}\n`;
    summary += `Successful: ${successfulTests}\n`;
    summary += `Failed: ${failedTests}\n`;
    summary += `Overall Success: ${overallSuccess ? 'PASS' : 'FAIL'}\n\n`;

    summary += `Test Details:\n`;
    testResults.forEach((test, index) => {
      summary += `${index + 1}. ${test.testName}: ${test.success ? 'PASS' : 'FAIL'}`;
      if (test.duration) {
        summary += ` (${test.duration.toFixed(2)}ms)`;
      }
      if (!test.success && test.error) {
        summary += ` - Error: ${test.error}`;
      }
      summary += `\n`;
    });

    if (overallSuccess) {
      summary += `\n✅ All storage and caching debugging features are working correctly.`;
      summary += `\nThe system can successfully monitor storage operations, analyze cache performance,`;
      summary += `\nvalidate data integrity, and test recovery scenarios.`;
    } else {
      summary += `\n❌ Some storage and caching debugging features need attention.`;
      summary += `\nReview the failed tests and address the identified issues.`;
    }

    return summary;
  }

  /**
   * Run quick validation test
   */
  async runQuickValidation(): Promise<boolean> {
    try {
      console.log('Running quick storage and caching debugging validation...');

      // Start session
      const sessionId = await this.debugger.startDebuggingSession();

      // Check session status
      const status = this.debugger.getSessionStatus();

      // Stop session
      await this.debugger.stopDebuggingSession();

      const isValid = sessionId && status.hasActiveSession;

      console.log(`Quick validation result: ${isValid ? 'PASS' : 'FAIL'}`);
      return isValid;
    } catch (error) {
      console.error('Quick validation failed:', error);
      return false;
    }
  }
}

// Export test runner function
export async function testStorageCachingDebugging(): Promise<void> {
  const tester = new StorageCachingDebugTest();

  try {
    const results = await tester.runComprehensiveTests();

    console.log('\n' + '='.repeat(80));
    console.log('STORAGE AND CACHING DEBUGGING TEST RESULTS');
    console.log('='.repeat(80));
    console.log(results.summary);
    console.log('='.repeat(80));

    if (!results.overallSuccess) {
      console.error('\n❌ Some tests failed. Please review the results above.');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed successfully!');
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testStorageCachingDebugging();
}
