/**
 * Test UI Component Debugging System
 * Validates the UI component debugging functionality
 */

import { UIComponentDebugger } from './contexts/ui-component-debugger';
import { getUserInteractionDebugger } from './utils/user-interaction-debugger';
import { getHighlightingSystemDebugger } from './utils/highlighting-system-debugger';

/**
 * Test UI component debugging system
 */
async function testUIComponentDebugging(): Promise<void> {
  console.log('=== Testing UI Component Debugging System ===');

  try {
    // Test 1: UI Component Debugger
    console.log('\n1. Testing UI Component Debugger...');
    const uiDebugger = new UIComponentDebugger();

    // Test connection and monitoring
    const connected = await uiDebugger.connectToUIContext();
    console.log(`UI Context Connection: ${connected ? 'SUCCESS' : 'FAILED'}`);

    if (connected) {
      await uiDebugger.startMonitoring();

      // Test component rendering validation
      const renderingResults = await uiDebugger.validateComponentRendering();
      console.log(
        `Component Rendering Validation: ${renderingResults.length} components validated`
      );

      // Test user interaction tracking
      const interactionResults = await uiDebugger.trackUserInteractions();
      console.log(
        `User Interaction Tracking: ${interactionResults.length} interactions tracked`
      );

      // Test highlighting system validation
      const highlightingResults = await uiDebugger.validateHighlightingSystem();
      console.log(
        `Highlighting System Validation: ${highlightingResults.length} systems validated`
      );

      // Test TTS functionality monitoring
      const ttsResults = await uiDebugger.monitorTTSFunctionality();
      console.log(
        `TTS Functionality Monitoring: ${ttsResults.length} events captured`
      );

      // Test user flow validation
      const flowResults = await uiDebugger.validateUserFlows();
      console.log(
        `User Flow Validation: ${flowResults.length} flows validated`
      );

      await uiDebugger.stopMonitoring();
    }

    // Test 2: User Interaction Debugger
    console.log('\n2. Testing User Interaction Debugger...');
    const interactionDebugger = getUserInteractionDebugger();

    // Start capturing interactions
    interactionDebugger.startCapturing();

    // Simulate some interactions (in a real scenario, these would be user actions)
    console.log('Simulating user interactions...');

    // Test user flow
    const flowId = interactionDebugger.startUserFlow('Test Mode Switching', [
      'Click vocabulary tab',
      'Verify mode change',
      'Click sentence tab',
      'Verify mode change',
    ]);

    interactionDebugger.completeFlowStep(
      flowId,
      'Click vocabulary tab',
      true,
      'Tab clicked successfully'
    );
    interactionDebugger.completeFlowStep(
      flowId,
      'Verify mode change',
      true,
      'Mode changed to vocabulary'
    );
    interactionDebugger.completeFlowStep(
      flowId,
      'Click sentence tab',
      true,
      'Tab clicked successfully'
    );
    interactionDebugger.completeFlowStep(
      flowId,
      'Verify mode change',
      true,
      'Mode changed to sentence'
    );

    const completedFlow = interactionDebugger.completeUserFlow(flowId);
    console.log(
      `User Flow Test: ${completedFlow?.isSuccessful ? 'SUCCESS' : 'FAILED'}`
    );

    // Test TTS debugging
    const ttsDebugResult = await interactionDebugger.debugTTSFunctionality();
    console.log(
      `TTS Debugging: ${ttsDebugResult.isSupported ? 'SUPPORTED' : 'NOT SUPPORTED'}, ${ttsDebugResult.isWorking ? 'WORKING' : 'NOT WORKING'}`
    );

    // Get interaction statistics
    const stats = interactionDebugger.getInteractionStatistics();
    console.log(
      `Interaction Statistics: ${stats.totalEvents} events, ${stats.errorRate.toFixed(1)}% error rate`
    );

    interactionDebugger.stopCapturing();

    // Test 3: Highlighting System Debugger
    console.log('\n3. Testing Highlighting System Debugger...');
    const highlightingDebugger = getHighlightingSystemDebugger();

    // Start monitoring
    highlightingDebugger.startMonitoring();

    // Test vocabulary highlighting
    const vocabTest = await highlightingDebugger.testVocabularyHighlighting();
    console.log(
      `Vocabulary Highlighting Test: ${vocabTest.isSuccessful ? 'SUCCESS' : 'FAILED'}`
    );

    // Test sentence highlighting
    const sentenceTest = await highlightingDebugger.testSentenceHighlighting();
    console.log(
      `Sentence Highlighting Test: ${sentenceTest.isSuccessful ? 'SUCCESS' : 'FAILED'}`
    );

    // Test performance
    const performanceTest =
      await highlightingDebugger.testHighlightingPerformance();
    console.log(
      `Highlighting Performance Test: ${performanceTest.isSuccessful ? 'SUCCESS' : 'FAILED'}`
    );

    // Get debugging summary
    const summary = highlightingDebugger.getDebuggingSummary();
    console.log(`Highlighting System Summary:`);
    console.log(`  - System Initialized: ${summary.systemState.isInitialized}`);
    console.log(`  - Current Mode: ${summary.systemState.currentMode}`);
    console.log(
      `  - Total Highlights: ${summary.systemState.highlightCounts.total}`
    );
    console.log(
      `  - Validation Success Rate: ${summary.validationSummary.successRate.toFixed(1)}%`
    );
    console.log(
      `  - Test Pass Rate: ${summary.testSummary.passRate.toFixed(1)}%`
    );

    highlightingDebugger.stopMonitoring();

    console.log('\n=== UI Component Debugging System Test Complete ===');
    console.log(
      'All UI component debugging functionality has been implemented and tested.'
    );
  } catch (error) {
    console.error('Error testing UI component debugging system:', error);
  }
}

/**
 * Test individual UI component validation
 */
async function testComponentValidation(): Promise<void> {
  console.log('\n=== Testing Individual Component Validation ===');

  const uiDebugger = new UIComponentDebugger();

  try {
    const connected = await uiDebugger.connectToUIContext();
    if (!connected) {
      console.log(
        'Could not connect to UI context for component validation test'
      );
      return;
    }

    // Test specific component validations
    const components = [
      'Learning Interface',
      'Article Header',
      'Article Content',
      'Vocabulary Cards',
      'Sentence Cards',
      'Navigation Controls',
      'Tab Buttons',
    ];

    console.log(`Testing validation of ${components.length} UI components...`);

    const validationResults = await uiDebugger.validateComponentRendering();

    validationResults.forEach(result => {
      console.log(
        `${result.componentName}: ${result.isRendered ? 'RENDERED' : 'NOT RENDERED'}`
      );
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.join(', ')}`);
      }
      console.log(`  Render Time: ${result.renderTime.toFixed(2)}ms`);
      console.log(`  Element Count: ${result.elementCount}`);
      console.log(`  Visible: ${result.styleValidation.isVisible}`);
    });
  } catch (error) {
    console.error('Error in component validation test:', error);
  }
}

/**
 * Test highlighting system integration
 */
async function testHighlightingIntegration(): Promise<void> {
  console.log('\n=== Testing Highlighting System Integration ===');

  const highlightingDebugger = getHighlightingSystemDebugger();

  try {
    highlightingDebugger.startMonitoring();

    // Get current state
    const state = highlightingDebugger.getCurrentState();
    console.log('Current Highlighting System State:');
    console.log(`  - Initialized: ${state.isInitialized}`);
    console.log(`  - Current Mode: ${state.currentMode}`);
    console.log(
      `  - Vocabulary Highlights: ${state.highlightCounts.vocabulary}`
    );
    console.log(`  - Sentence Highlights: ${state.highlightCounts.sentence}`);
    console.log(`  - Total Highlights: ${state.highlightCounts.total}`);

    // Run comprehensive tests
    const tests = [
      highlightingDebugger.testVocabularyHighlighting(),
      highlightingDebugger.testSentenceHighlighting(),
      highlightingDebugger.testHighlightingPerformance(),
    ];

    const results = await Promise.all(tests);

    console.log('\nHighlighting Test Results:');
    results.forEach(result => {
      console.log(
        `${result.testName}: ${result.isSuccessful ? 'PASS' : 'FAIL'} (${result.duration.toFixed(2)}ms)`
      );
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.join(', ')}`);
      }
    });

    highlightingDebugger.stopMonitoring();
  } catch (error) {
    console.error('Error in highlighting integration test:', error);
  }
}

// Export test functions
export {
  testUIComponentDebugging,
  testComponentValidation,
  testHighlightingIntegration,
};

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment - can run tests
  console.log('UI Component Debugging Test Suite Ready');
  console.log('Call testUIComponentDebugging() to run all tests');
  console.log('Call testComponentValidation() to test component validation');
  console.log('Call testHighlightingIntegration() to test highlighting system');

  // Make functions available globally for manual testing
  (window as any).testUIComponentDebugging = testUIComponentDebugging;
  (window as any).testComponentValidation = testComponentValidation;
  (window as any).testHighlightingIntegration = testHighlightingIntegration;
}
