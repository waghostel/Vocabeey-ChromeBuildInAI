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
  console.log('=== Cross-Component Integration Debugging Test ===\n');

  try {
    // Test 1: Message Flow Tracking System
    await testMessageFlowTracking();

    // Test 2: Error Propagation Tracking
    await testErrorPropagationTracking();

    // Test 3: Performance Bottleneck Detection
    await testPerformanceBottleneckDetection();

    // Test 4: Comprehensive Integration Debugging
    await testComprehensiveIntegrationDebugging();

    // Test 5: Cross-Component Communication Testing
    await testCrossComponentCommunication();

    // Test 6: Error Handling Validation
    await testErrorHandlingValidation();

    console.log(
      '✅ All cross-component integration debugging tests completed successfully!\n'
    );
  } catch (error) {
    console.error(
      '❌ Cross-component integration debugging test failed:',
      error
    );
    throw error;
  }
}

async function testMessageFlowTracking(): Promise<void> {
  console.log('🔄 Testing Message Flow Tracking System...');

  const messageFlowTracker = new MessageFlowTracker();

  try {
    // Start tracking
    await messageFlowTracker.startTracking();
    console.log('  ✓ Message flow tracking started');

    // Simulate message flows
    const messageId1 = messageFlowTracker.trackMessageSent(
      'content-script',
      'service-worker',
      'content-extracted',
      { content: 'test article content', url: 'https://example.com' }
    );
    console.log('  ✓ Tracked message sent: content-script -> service-worker');

    // Simulate message reception
    setTimeout(() => {
      messageFlowTracker.trackMessageReceived(messageId1, 45);
    }, 50);

    const messageId2 = messageFlowTracker.trackMessageSent(
      'service-worker',
      'offscreen',
      'process-content',
      { content: 'test content', processingType: 'ai-analysis' }
    );
    console.log('  ✓ Tracked message sent: service-worker -> offscreen');

    // Simulate message failure
    messageFlowTracker.trackMessageFailure(
      messageId2,
      'timeout',
      'Offscreen document not responding'
    );
    console.log('  ✓ Tracked message failure');

    // Test routing validation
    const routingValidation = await messageFlowTracker.validateMessageRouting();
    console.log(
      `  ✓ Routing validation completed: ${routingValidation.validRoutes.length} valid routes, ${routingValidation.invalidRoutes.length} invalid routes`
    );

    // Get route statistics
    const routeStats = messageFlowTracker.getRouteStatistics(
      'content-script',
      'service-worker'
    );
    if (routeStats) {
      console.log(
        `  ✓ Route statistics: ${routeStats.totalMessages} messages, ${(routeStats.successRate * 100).toFixed(1)}% success rate`
      );
    }

    // Stop tracking and get summary
    const summary = await messageFlowTracker.stopTracking();
    console.log(
      `  ✓ Message flow summary: ${summary.totalMessages} total messages, ${summary.successfulMessages} successful, ${summary.failedMessages} failed`
    );
    console.log(`  ✓ Average latency: ${summary.averageLatency.toFixed(1)}ms`);
    console.log(
      `  ✓ Recommendations: ${summary.recommendations.length} generated`
    );

    console.log('✅ Message Flow Tracking System test completed\n');
  } catch (error) {
    console.error('❌ Message Flow Tracking System test failed:', error);
    throw error;
  }
}

async function testErrorPropagationTracking(): Promise<void> {
  console.log('🚨 Testing Error Propagation Tracking...');

  const errorPropagationTracker = new ErrorPropagationTracker();

  try {
    // Start error propagation tracking
    await errorPropagationTracker.startErrorPropagationTracking();
    console.log('  ✓ Error propagation tracking started');

    // Track error occurrence
    const errorId1 = errorPropagationTracker.trackErrorOccurrence(
      'content-script',
      new Error('Failed to extract content'),
      'content-extraction-error',
      'high'
    );
    console.log('  ✓ Tracked error occurrence in content-script');

    // Track error propagation
    const propagationId = errorPropagationTracker.trackErrorPropagation(
      errorId1,
      'service-worker',
      new Error('Content extraction failed, switching to fallback')
    );
    console.log('  ✓ Tracked error propagation to service-worker');

    // Track error handling
    errorPropagationTracker.trackErrorHandling(
      propagationId,
      'fallback-extraction',
      true,
      'Successfully used fallback extraction method'
    );
    console.log('  ✓ Tracked error handling');

    // Track error recovery
    const recoveryId = errorPropagationTracker.trackErrorRecovery(
      errorId1,
      'retry-with-different-method',
      'minimal'
    );
    console.log('  ✓ Started error recovery tracking');

    // Track recovery steps
    errorPropagationTracker.trackRecoveryStep(
      recoveryId,
      'switch-extraction-method',
      true,
      'Switched to DOM-based extraction',
      'validate-content'
    );

    errorPropagationTracker.trackRecoveryStep(
      recoveryId,
      'validate-content',
      true,
      'Content validation successful'
    );
    console.log('  ✓ Tracked recovery steps');

    // Complete recovery
    errorPropagationTracker.completeErrorRecovery(
      recoveryId,
      true,
      'Content successfully extracted using fallback method'
    );
    console.log('  ✓ Completed error recovery');

    // Validate error handling for different contexts
    const contexts: Array<
      'service-worker' | 'content-script' | 'offscreen' | 'ui'
    > = ['service-worker', 'content-script', 'offscreen', 'ui'];

    for (const context of contexts) {
      const validation =
        await errorPropagationTracker.validateErrorHandling(context);
      console.log(
        `  ✓ Error handling validation for ${context}: ${(validation.handlerEffectiveness * 100).toFixed(1)}% effectiveness`
      );
    }

    // Monitor error recovery
    const recoveryPerformance =
      await errorPropagationTracker.monitorErrorRecovery(5000);
    console.log(
      `  ✓ Recovery monitoring: ${recoveryPerformance.successfulRecoveries}/${recoveryPerformance.totalRecoveryAttempts} successful recoveries`
    );

    // Stop tracking and generate report
    const report = await errorPropagationTracker.stopErrorPropagationTracking();
    console.log(`  ✓ Error propagation report generated: ${report.reportId}`);
    console.log(
      `  ✓ Total errors: ${report.errorSummary.totalErrors}, Handled: ${report.errorSummary.handledErrors}`
    );
    console.log(
      `  ✓ Overall handling score: ${report.handlingEffectiveness.overallScore.toFixed(1)}/100`
    );
    console.log(
      `  ✓ Recommendations: ${report.recommendations.length} generated`
    );

    console.log('✅ Error Propagation Tracking test completed\n');
  } catch (error) {
    console.error('❌ Error Propagation Tracking test failed:', error);
    throw error;
  }
}

async function testPerformanceBottleneckDetection(): Promise<void> {
  console.log('⚡ Testing Performance Bottleneck Detection...');

  const performanceDetector = new PerformanceBottleneckDetector();

  try {
    // Start performance monitoring
    await performanceDetector.startPerformanceMonitoring(500); // 500ms intervals
    console.log('  ✓ Performance monitoring started');

    // Let it run for a few seconds to collect metrics
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('  ✓ Performance metrics collected');

    // Test context-specific bottleneck detection
    const contexts: Array<
      'service-worker' | 'content-script' | 'offscreen' | 'ui'
    > = ['service-worker', 'content-script', 'offscreen', 'ui'];

    for (const context of contexts) {
      const contextBottlenecks =
        await performanceDetector.detectContextBottlenecks(context);
      console.log(
        `  ✓ Detected ${contextBottlenecks.length} bottlenecks in ${context}`
      );

      for (const bottleneck of contextBottlenecks.slice(0, 2)) {
        // Show first 2
        console.log(
          `    - ${bottleneck.bottleneckType} (${bottleneck.severity}): ${bottleneck.description}`
        );
      }
    }

    // Test cross-component performance monitoring
    const crossComponentBottlenecks =
      await performanceDetector.monitorCrossComponentPerformance(2000);
    console.log(
      `  ✓ Cross-component monitoring detected ${crossComponentBottlenecks.length} bottlenecks`
    );

    // Generate optimization recommendations
    const recommendations =
      await performanceDetector.generateOptimizationRecommendations();
    console.log(
      `  ✓ Generated ${recommendations.length} optimization recommendations`
    );

    for (const rec of recommendations.slice(0, 3)) {
      // Show first 3
      console.log(`    - ${rec.priority}: ${rec.title} (${rec.category})`);
    }

    // Stop monitoring and get comprehensive report
    const report = await performanceDetector.stopPerformanceMonitoring();
    console.log(
      `  ✓ Performance bottleneck report generated: ${report.detectionId}`
    );
    console.log(
      `  ✓ Overall performance score: ${report.overallPerformanceScore}/100`
    );
    console.log(
      `  ✓ Total bottlenecks: ${report.totalBottlenecks}, Critical: ${report.criticalBottlenecks}`
    );
    console.log(
      `  ✓ Monitoring duration: ${(report.monitoringDuration / 1000).toFixed(1)}s`
    );

    console.log('✅ Performance Bottleneck Detection test completed\n');
  } catch (error) {
    console.error('❌ Performance Bottleneck Detection test failed:', error);
    throw error;
  }
}

async function testComprehensiveIntegrationDebugging(): Promise<void> {
  console.log('🔧 Testing Comprehensive Integration Debugging...');

  const integrationDebugger = new IntegrationDebugger();

  try {
    // Start comprehensive debugging session
    const sessionId = await integrationDebugger.startIntegrationDebugging();
    console.log(`  ✓ Integration debugging session started: ${sessionId}`);

    // Let the debugging run for a few seconds
    await new Promise(resolve => setTimeout(resolve, 4000));
    console.log('  ✓ Debugging data collected');

    // Test message flow monitoring
    const messageFlowSummary = await integrationDebugger.monitorMessageFlow(
      'content-script',
      'service-worker',
      5000
    );
    console.log(
      `  ✓ Message flow monitoring: ${messageFlowSummary.totalMessages} messages, ${messageFlowSummary.averageLatency.toFixed(1)}ms avg latency`
    );

    // Stop debugging and get comprehensive session report
    const sessionReport = await integrationDebugger.stopIntegrationDebugging();
    console.log(
      `  ✓ Integration debugging session completed: ${sessionReport.sessionId}`
    );
    console.log(`  ✓ Monitored contexts: ${sessionReport.contexts.length}`);

    if (sessionReport.messageFlowSummary) {
      console.log(
        `  ✓ Message flow: ${sessionReport.messageFlowSummary.totalMessages} messages`
      );
    }

    if (sessionReport.errorPropagationReport) {
      console.log(
        `  ✓ Error propagation: ${sessionReport.errorPropagationReport.totalErrors} errors tracked`
      );
    }

    if (sessionReport.performanceBottlenecks) {
      console.log(
        `  ✓ Performance bottlenecks: ${sessionReport.performanceBottlenecks.length} detected`
      );
    }

    console.log(
      `  ✓ Recommendations: ${sessionReport.recommendations.length} generated`
    );

    console.log('✅ Comprehensive Integration Debugging test completed\n');
  } catch (error) {
    console.error('❌ Comprehensive Integration Debugging test failed:', error);
    throw error;
  }
}

async function testCrossComponentCommunication(): Promise<void> {
  console.log('📡 Testing Cross-Component Communication...');

  const integrationDebugger = new IntegrationDebugger();

  try {
    // Test cross-component communication
    const communicationTestResult =
      await integrationDebugger.testCrossComponentCommunication();
    console.log(
      `  ✓ Communication test completed: ${communicationTestResult.testId}`
    );
    console.log(
      `  ✓ Tested routes: ${communicationTestResult.testedRoutes.length}`
    );
    console.log(
      `  ✓ Passed tests: ${communicationTestResult.passedTests}/${communicationTestResult.testedRoutes.length}`
    );
    console.log(`  ✓ Failed tests: ${communicationTestResult.failedTests}`);

    // Show details of tested routes
    for (const route of communicationTestResult.testedRoutes) {
      const status = route.successful ? '✓' : '✗';
      console.log(
        `    ${status} ${route.source} -> ${route.target}: ${route.latency}ms`
      );
      if (!route.successful && route.errorMessage) {
        console.log(`      Error: ${route.errorMessage}`);
      }
    }

    console.log(
      `  ✓ Recommendations: ${communicationTestResult.recommendations.length} generated`
    );

    console.log('✅ Cross-Component Communication test completed\n');
  } catch (error) {
    console.error('❌ Cross-Component Communication test failed:', error);
    throw error;
  }
}

async function testErrorHandlingValidation(): Promise<void> {
  console.log('🛡️ Testing Error Handling Validation...');

  const integrationDebugger = new IntegrationDebugger();

  try {
    // Test error handling validation
    const errorHandlingResult =
      await integrationDebugger.validateErrorHandling();
    console.log(
      `  ✓ Error handling validation completed: ${errorHandlingResult.validationId}`
    );
    console.log(
      `  ✓ Error handling score: ${errorHandlingResult.errorHandlingScore.toFixed(1)}/100`
    );
    console.log(
      `  ✓ Tested scenarios: ${errorHandlingResult.testedScenarios.length}`
    );

    // Show scenario results
    for (const scenario of errorHandlingResult.testedScenarios) {
      const status = scenario.recoverySuccessful ? '✓' : '✗';
      console.log(
        `    ${status} ${scenario.scenario}: ${scenario.recoveryTime}ms recovery time`
      );
      if (!scenario.recoverySuccessful && scenario.errorDetails) {
        console.log(`      Error: ${scenario.errorDetails}`);
      }
    }

    console.log(
      `  ✓ Recommendations: ${errorHandlingResult.recommendations.length} generated`
    );

    console.log('✅ Error Handling Validation test completed\n');
  } catch (error) {
    console.error('❌ Error Handling Validation test failed:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCrossComponentIntegrationDebugging()
    .then(() => {
      console.log(
        '🎉 Cross-Component Integration Debugging test suite completed successfully!'
      );
      process.exit(0);
    })
    .catch(error => {
      console.error(
        '💥 Cross-Component Integration Debugging test suite failed:',
        error
      );
      process.exit(1);
    });
}

export { testCrossComponentIntegrationDebugging };
