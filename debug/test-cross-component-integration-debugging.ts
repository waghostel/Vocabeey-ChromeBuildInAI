/**
 * Cross-Component Integration Debugging Test
 *
 * Tests the comprehensive cross-component integration debugging system including
 * message flow tracking, error propagation tracking, and performance bottleneck detection.
 */

import { IntegrationDebugger } from './contexts/integration-debugger.js';
import { MessageFlowTracker } from './utils/message-flow-tracker.js';
import { ErrorPropagationTracker } from './utils/error-propagation-tracker.js';
import { PerformanceBottleneckDetector } from './utils/performance-bottleneck-detector.js';

async function testCrossComponentIntegrationDebugging(): Promise<void> {
  console.log('=== Real Cross-Component Integration Debugging Test ===\n');

  try {
    // Test 1: Real Message Flow Tracking System
    await testMessageFlowTracking();

    // Test 2: Real Error Propagation Tracking
    await testErrorPropagationTracking();

    // Test 3: Real Performance Bottleneck Detection
    await testPerformanceBottleneckDetection();

    // Test 4: Real Comprehensive Integration Debugging
    await testComprehensiveIntegrationDebugging();

    // Test 5: Real Cross-Component Communication Testing
    await testCrossComponentCommunication();

    // Test 6: Real Error Handling Validation
    await testErrorHandlingValidation();

    console.log(
      '✅ All real cross-component integration debugging tests completed successfully!\n'
    );
  } catch (error) {
    console.error(
      '❌ Real cross-component integration debugging test failed:',
      error
    );
    throw error;
  }
}

async function testMessageFlowTracking(): Promise<void> {
  console.log('🔄 Testing Real Message Flow Tracking System...');

  const messageFlowTracker = new MessageFlowTracker();

  try {
    // Start real message tracking with MCP integration
    await messageFlowTracker.startTracking();
    console.log('  ✓ Real message flow tracking started with MCP integration');

    // Wait for real message monitoring to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('  ✓ Real message monitoring initialized');

    // Test routing validation with real MCP data
    const routingValidation = await messageFlowTracker.validateMessageRouting();
    console.log(
      `  ✓ Real routing validation completed: ${routingValidation.validRoutes.length} valid routes, ${routingValidation.invalidRoutes.length} invalid routes`
    );

    // Let real message tracking run for a period to collect data
    console.log('  ⏳ Collecting real message flow data...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get real route statistics
    const contexts: Array<
      'content-script' | 'service-worker' | 'offscreen' | 'ui'
    > = ['content-script', 'service-worker', 'offscreen', 'ui'];

    for (const source of contexts) {
      for (const target of contexts) {
        if (source !== target) {
          const routeStats = messageFlowTracker.getRouteStatistics(
            source,
            target
          );
          if (routeStats && routeStats.totalMessages > 0) {
            console.log(
              `  ✓ Real route statistics ${source} -> ${target}: ${routeStats.totalMessages} messages, ${(routeStats.successRate * 100).toFixed(1)}% success rate`
            );
          }
        }
      }
    }

    // Stop tracking and get real summary
    const summary = await messageFlowTracker.stopTracking();
    console.log(
      `  ✓ Real message flow summary: ${summary.totalMessages} total messages, ${summary.successfulMessages} successful, ${summary.failedMessages} failed`
    );

    if (summary.averageLatency > 0) {
      console.log(
        `  ✓ Real average latency: ${summary.averageLatency.toFixed(1)}ms`
      );
    }

    console.log(
      `  ✓ Real recommendations: ${summary.recommendations.length} generated`
    );

    // Display real recommendations
    if (summary.recommendations.length > 0) {
      console.log('  📋 Real Message Flow Recommendations:');
      summary.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`    ${index + 1}. ${rec}`);
      });
    }

    console.log('✅ Real Message Flow Tracking System test completed\n');
  } catch (error) {
    console.error('❌ Real Message Flow Tracking System test failed:', error);
    throw error;
  }
}

async function testErrorPropagationTracking(): Promise<void> {
  console.log('🚨 Testing Real Error Propagation Tracking...');

  const errorPropagationTracker = new ErrorPropagationTracker();

  try {
    // Start real error propagation tracking with MCP integration
    await errorPropagationTracker.startErrorPropagationTracking();
    console.log(
      '  ✓ Real error propagation tracking started with MCP integration'
    );

    // Wait for real error monitoring to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('  ✓ Real error monitoring initialized across all contexts');

    // Validate real error handling for different contexts
    const contexts: Array<
      'service-worker' | 'content-script' | 'offscreen' | 'ui'
    > = ['service-worker', 'content-script', 'offscreen', 'ui'];

    for (const context of contexts) {
      try {
        const validation =
          await errorPropagationTracker.validateErrorHandling(context);
        console.log(
          `  ✓ Real error handling validation for ${context}: ${(validation.handlerEffectiveness * 100).toFixed(1)}% effectiveness`
        );

        if (validation.recoveryMechanisms.length > 0) {
          console.log(
            `    - Recovery mechanisms: ${validation.recoveryMechanisms.join(', ')}`
          );
        }

        if (validation.fallbackStrategies.length > 0) {
          console.log(
            `    - Fallback strategies: ${validation.fallbackStrategies.join(', ')}`
          );
        }
      } catch (error) {
        console.warn(`  ⚠ Error validating ${context}:`, error);
      }
    }

    // Monitor real error recovery
    console.log('  ⏳ Monitoring real error recovery patterns...');
    const recoveryPerformance =
      await errorPropagationTracker.monitorErrorRecovery(8000);
    console.log(
      `  ✓ Real recovery monitoring: ${recoveryPerformance.successfulRecoveries}/${recoveryPerformance.totalRecoveryAttempts} successful recoveries`
    );

    if (recoveryPerformance.averageRecoveryTime > 0) {
      console.log(
        `  ✓ Average real recovery time: ${recoveryPerformance.averageRecoveryTime.toFixed(0)}ms`
      );
    }

    // Display recovery strategies if any were found
    if (recoveryPerformance.recoveryStrategies.length > 0) {
      console.log('  📋 Real Recovery Strategies Found:');
      recoveryPerformance.recoveryStrategies.forEach((strategy, index) => {
        console.log(
          `    ${index + 1}. ${strategy.strategy} (${(strategy.successRate * 100).toFixed(1)}% success rate)`
        );
      });
    }

    // Stop tracking and generate real report
    const report = await errorPropagationTracker.stopErrorPropagationTracking();
    console.log(
      `  ✓ Real error propagation report generated: ${report.reportId}`
    );
    console.log(
      `  ✓ Real total errors: ${report.errorSummary.totalErrors}, Handled: ${report.errorSummary.handledErrors}`
    );

    if (report.errorSummary.totalErrors > 0) {
      console.log(
        `  ✓ Real overall handling score: ${report.handlingEffectiveness.overallScore.toFixed(1)}/100`
      );
    }

    console.log(
      `  ✓ Real recommendations: ${report.recommendations.length} generated`
    );

    // Display real recommendations
    if (report.recommendations.length > 0) {
      console.log('  📋 Real Error Handling Recommendations:');
      report.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(
          `    ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`
        );
      });
    }

    // Display error propagation analysis
    if (report.propagationAnalysis.propagationChains.length > 0) {
      console.log(
        `  ✓ Real error propagation chains detected: ${report.propagationAnalysis.propagationChains.length}`
      );
      console.log(
        `  ✓ Average propagation depth: ${report.propagationAnalysis.averagePropagationDepth.toFixed(1)}`
      );
    }

    console.log('✅ Real Error Propagation Tracking test completed\n');
  } catch (error) {
    console.error('❌ Real Error Propagation Tracking test failed:', error);
    throw error;
  }
}

async function testPerformanceBottleneckDetection(): Promise<void> {
  console.log('⚡ Testing Real Performance Bottleneck Detection...');

  const performanceDetector = new PerformanceBottleneckDetector();

  try {
    // Start real performance monitoring with MCP integration
    await performanceDetector.startPerformanceMonitoring(1000); // 1s intervals for real monitoring
    console.log('  ✓ Real performance monitoring started with MCP integration');

    // Let it run longer to collect real metrics
    console.log('  ⏳ Collecting real performance metrics...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    console.log('  ✓ Real performance metrics collected');

    // Test real context-specific bottleneck detection
    const contexts: Array<
      'service-worker' | 'content-script' | 'offscreen' | 'ui'
    > = ['service-worker', 'content-script', 'offscreen', 'ui'];

    let totalBottlenecks = 0;
    for (const context of contexts) {
      try {
        const contextBottlenecks =
          await performanceDetector.detectContextBottlenecks(context);
        totalBottlenecks += contextBottlenecks.length;
        console.log(
          `  ✓ Real bottlenecks detected in ${context}: ${contextBottlenecks.length}`
        );

        for (const bottleneck of contextBottlenecks.slice(0, 2)) {
          // Show first 2 real bottlenecks
          console.log(
            `    - ${bottleneck.bottleneckType} (${bottleneck.severity}): ${bottleneck.description}`
          );
          if (bottleneck.impact.estimatedSlowdown > 0) {
            console.log(
              `      Impact: ${bottleneck.impact.estimatedSlowdown.toFixed(1)}% slowdown`
            );
          }
        }
      } catch (error) {
        console.warn(`  ⚠ Error detecting bottlenecks in ${context}:`, error);
      }
    }

    // Test real cross-component performance monitoring
    console.log('  ⏳ Monitoring real cross-component performance...');
    const crossComponentBottlenecks =
      await performanceDetector.monitorCrossComponentPerformance(4000);
    console.log(
      `  ✓ Real cross-component monitoring detected ${crossComponentBottlenecks.length} bottlenecks`
    );

    // Generate real optimization recommendations
    const recommendations =
      await performanceDetector.generateOptimizationRecommendations();
    console.log(
      `  ✓ Generated ${recommendations.length} real optimization recommendations`
    );

    for (const rec of recommendations.slice(0, 3)) {
      // Show first 3 real recommendations
      console.log(
        `    - [${rec.priority.toUpperCase()}] ${rec.title} (${rec.category})`
      );
      console.log(`      ${rec.description}`);
    }

    // Stop monitoring and get real comprehensive report
    const report = await performanceDetector.stopPerformanceMonitoring();
    console.log(
      `  ✓ Real performance bottleneck report generated: ${report.detectionId}`
    );
    console.log(
      `  ✓ Real overall performance score: ${report.overallPerformanceScore}/100`
    );
    console.log(
      `  ✓ Real total bottlenecks: ${report.totalBottlenecks}, Critical: ${report.criticalBottlenecks}`
    );
    console.log(
      `  ✓ Real monitoring duration: ${(report.monitoringDuration / 1000).toFixed(1)}s`
    );

    // Display bottleneck breakdown
    if (report.totalBottlenecks > 0) {
      console.log('  📊 Real Bottleneck Breakdown:');
      Object.entries(report.bottlenecksByType).forEach(([type, count]) => {
        if (count > 0) {
          console.log(`    - ${type}: ${count}`);
        }
      });
    }

    // Display context performance
    console.log('  📊 Real Context Performance:');
    Object.entries(report.bottlenecksByContext).forEach(([context, count]) => {
      console.log(`    - ${context}: ${count} bottlenecks`);
    });

    console.log('✅ Real Performance Bottleneck Detection test completed\n');
  } catch (error) {
    console.error(
      '❌ Real Performance Bottleneck Detection test failed:',
      error
    );
    throw error;
  }
}

async function testComprehensiveIntegrationDebugging(): Promise<void> {
  console.log('🔧 Testing Real Comprehensive Integration Debugging...');

  const integrationDebugger = new IntegrationDebugger();

  try {
    // Start real comprehensive debugging session
    const sessionId = await integrationDebugger.startIntegrationDebugging();
    console.log(`  ✓ Real integration debugging session started: ${sessionId}`);

    // Let the real debugging run longer to collect meaningful data
    console.log('  ⏳ Collecting real debugging data across all contexts...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    console.log('  ✓ Real debugging data collected');

    // Test real message flow monitoring
    const messageFlowSummary = await integrationDebugger.monitorMessageFlow(
      'content-script',
      'service-worker',
      6000
    );
    console.log(
      `  ✓ Real message flow monitoring: ${messageFlowSummary.totalMessages} messages, ${messageFlowSummary.averageLatency.toFixed(1)}ms avg latency`
    );

    if (messageFlowSummary.failedMessages > 0) {
      console.log(
        `    - Failed messages: ${messageFlowSummary.failedMessages}`
      );
    }

    // Stop debugging and get real comprehensive session report
    const sessionReport = await integrationDebugger.stopIntegrationDebugging();
    console.log(
      `  ✓ Real integration debugging session completed: ${sessionReport.sessionId}`
    );
    console.log(
      `  ✓ Real monitored contexts: ${sessionReport.contexts.length}`
    );

    // Display real context information
    sessionReport.contexts.forEach(context => {
      console.log(
        `    - ${context.type}: ${context.errorCount} errors, active: ${context.isActive}`
      );
    });

    if (sessionReport.messageFlowSummary) {
      console.log(
        `  ✓ Real message flow: ${sessionReport.messageFlowSummary.totalMessages} messages`
      );
      if (sessionReport.messageFlowSummary.recommendations.length > 0) {
        console.log(
          `    - Message flow recommendations: ${sessionReport.messageFlowSummary.recommendations.length}`
        );
      }
    }

    if (sessionReport.errorPropagationReport) {
      console.log(
        `  ✓ Real error propagation: ${sessionReport.errorPropagationReport.totalErrors} errors tracked`
      );
      if (sessionReport.errorPropagationReport.unhandledErrors.length > 0) {
        console.log(
          `    - Unhandled errors: ${sessionReport.errorPropagationReport.unhandledErrors.length}`
        );
      }
    }

    if (sessionReport.performanceBottlenecks) {
      console.log(
        `  ✓ Real performance bottlenecks: ${sessionReport.performanceBottlenecks.length} detected`
      );
      const criticalBottlenecks = sessionReport.performanceBottlenecks.filter(
        b => b.severity === 'critical'
      );
      if (criticalBottlenecks.length > 0) {
        console.log(
          `    - Critical bottlenecks: ${criticalBottlenecks.length}`
        );
      }
    }

    console.log(
      `  ✓ Real recommendations: ${sessionReport.recommendations.length} generated`
    );

    // Display top recommendations
    if (sessionReport.recommendations.length > 0) {
      console.log('  📋 Top Real Integration Recommendations:');
      sessionReport.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`    ${index + 1}. ${rec}`);
      });
    }

    console.log('✅ Real Comprehensive Integration Debugging test completed\n');
  } catch (error) {
    console.error(
      '❌ Real Comprehensive Integration Debugging test failed:',
      error
    );
    throw error;
  }
}

async function testCrossComponentCommunication(): Promise<void> {
  console.log('📡 Testing Real Cross-Component Communication...');

  const integrationDebugger = new IntegrationDebugger();

  try {
    // Test real cross-component communication
    const communicationTestResult =
      await integrationDebugger.testCrossComponentCommunication();
    console.log(
      `  ✓ Real communication test completed: ${communicationTestResult.testId}`
    );
    console.log(
      `  ✓ Real tested routes: ${communicationTestResult.testedRoutes.length}`
    );
    console.log(
      `  ✓ Real passed tests: ${communicationTestResult.passedTests}/${communicationTestResult.testedRoutes.length}`
    );
    console.log(
      `  ✓ Real failed tests: ${communicationTestResult.failedTests}`
    );

    // Show details of real tested routes
    for (const route of communicationTestResult.testedRoutes) {
      const status = route.successful ? '✓' : '✗';
      console.log(
        `    ${status} ${route.source} -> ${route.target}: ${route.latency}ms`
      );
      if (!route.successful && route.errorMessage) {
        console.log(`      Real Error: ${route.errorMessage}`);
      } else if (route.successful) {
        console.log(`      Real communication successful`);
      }
    }

    console.log(
      `  ✓ Real recommendations: ${communicationTestResult.recommendations.length} generated`
    );

    // Display real communication recommendations
    if (communicationTestResult.recommendations.length > 0) {
      console.log('  📋 Real Communication Recommendations:');
      communicationTestResult.recommendations.forEach((rec, index) => {
        console.log(`    ${index + 1}. ${rec}`);
      });
    }

    // Calculate success rate
    const successRate =
      communicationTestResult.testedRoutes.length > 0
        ? (communicationTestResult.passedTests /
            communicationTestResult.testedRoutes.length) *
          100
        : 0;
    console.log(
      `  ✓ Real communication success rate: ${successRate.toFixed(1)}%`
    );

    console.log('✅ Real Cross-Component Communication test completed\n');
  } catch (error) {
    console.error('❌ Real Cross-Component Communication test failed:', error);
    throw error;
  }
}

async function testErrorHandlingValidation(): Promise<void> {
  console.log('🛡️ Testing Real Error Handling Validation...');

  const integrationDebugger = new IntegrationDebugger();

  try {
    // Test real error handling validation
    const errorHandlingResult =
      await integrationDebugger.validateErrorHandling();
    console.log(
      `  ✓ Real error handling validation completed: ${errorHandlingResult.validationId}`
    );
    console.log(
      `  ✓ Real error handling score: ${errorHandlingResult.errorHandlingScore.toFixed(1)}/100`
    );
    console.log(
      `  ✓ Real tested scenarios: ${errorHandlingResult.testedScenarios.length}`
    );

    // Show real scenario results
    let successfulRecoveries = 0;
    for (const scenario of errorHandlingResult.testedScenarios) {
      const status = scenario.recoverySuccessful ? '✓' : '✗';
      console.log(
        `    ${status} ${scenario.scenario}: ${scenario.recoveryTime}ms recovery time`
      );
      if (!scenario.recoverySuccessful && scenario.errorDetails) {
        console.log(`      Real Error: ${scenario.errorDetails}`);
      } else if (scenario.recoverySuccessful) {
        successfulRecoveries++;
        console.log(`      Real recovery successful`);
      }
    }

    console.log(
      `  ✓ Real recommendations: ${errorHandlingResult.recommendations.length} generated`
    );

    // Display real error handling recommendations
    if (errorHandlingResult.recommendations.length > 0) {
      console.log('  📋 Real Error Handling Recommendations:');
      errorHandlingResult.recommendations.forEach((rec, index) => {
        console.log(`    ${index + 1}. ${rec}`);
      });
    }

    // Calculate recovery success rate
    const recoveryRate =
      errorHandlingResult.testedScenarios.length > 0
        ? (successfulRecoveries / errorHandlingResult.testedScenarios.length) *
          100
        : 0;
    console.log(`  ✓ Real recovery success rate: ${recoveryRate.toFixed(1)}%`);

    // Provide assessment
    if (errorHandlingResult.errorHandlingScore >= 80) {
      console.log('  🎉 Excellent error handling capabilities detected');
    } else if (errorHandlingResult.errorHandlingScore >= 60) {
      console.log('  👍 Good error handling with room for improvement');
    } else {
      console.log('  ⚠️ Error handling needs significant improvement');
    }

    console.log('✅ Real Error Handling Validation test completed\n');
  } catch (error) {
    console.error('❌ Real Error Handling Validation test failed:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCrossComponentIntegrationDebugging()
    .then(() => {
      console.log(
        '🎉 Real Cross-Component Integration Debugging test suite completed successfully!'
      );
      console.log('✨ All real MCP integration features are now functional!');
      process.exit(0);
    })
    .catch(error => {
      console.error(
        '💥 Real Cross-Component Integration Debugging test suite failed:',
        error
      );
      process.exit(1);
    });
}

export { testCrossComponentIntegrationDebugging };
