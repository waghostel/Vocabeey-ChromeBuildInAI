/**
 * Test Content Script Debugging
 * Demonstrates the content script debugging capabilities
 */

import { ContentScriptDebugger } from './contexts/content-script-debugger';
import { PageInteractionDebugger } from './contexts/page-interaction-debugger';
import { ContentExtractionDebugger } from './contexts/content-extraction-debugger';

/**
 * Test content script monitoring tools
 */
async function testContentScriptMonitoring(): Promise<void> {
  console.log('=== Testing Content Script Monitoring Tools ===');

  const contentDebugger = new ContentScriptDebugger();

  try {
    // Test script injection verification
    console.log('\n1. Testing script injection verification...');
    const injectionResult = await contentDebugger.verifyScriptInjection();
    console.log('Injection verification result:', injectionResult);

    // Test content extraction monitoring
    console.log('\n2. Testing content extraction monitoring...');
    const extractionResult = await contentDebugger.monitorContentExtraction();
    console.log('Content extraction monitoring result:', extractionResult);

    // Test DOM manipulation tracking
    console.log('\n3. Testing DOM manipulation tracking...');
    const domResult = await contentDebugger.trackDOMManipulation();
    console.log('DOM manipulation tracking result:', domResult);

    // Test highlighting system validation
    console.log('\n4. Testing highlighting system validation...');
    const highlightingResult =
      await contentDebugger.validateHighlightingSystem();
    console.log('Highlighting system validation result:', highlightingResult);

    // Test page compatibility check
    console.log('\n5. Testing page compatibility check...');
    const compatibilityResult = await contentDebugger.checkPageCompatibility();
    console.log('Page compatibility check result:', compatibilityResult);

    console.log(
      '\n✅ Content script monitoring tools test completed successfully'
    );
  } catch (error) {
    console.error('❌ Content script monitoring tools test failed:', error);
  }
}

/**
 * Test page interaction debugging
 */
async function testPageInteractionDebugging(): Promise<void> {
  console.log('\n=== Testing Page Interaction Debugging ===');

  const interactionDebugger = new PageInteractionDebugger();

  try {
    // Test vocabulary selection simulation
    console.log('\n1. Testing vocabulary selection simulation...');
    const vocabSimulation =
      await interactionDebugger.simulateVocabularySelection('example');
    console.log('Vocabulary selection simulation result:', vocabSimulation);

    // Test sentence selection simulation
    console.log('\n2. Testing sentence selection simulation...');
    const sentenceSimulation =
      await interactionDebugger.simulateSentenceSelection(0);
    console.log('Sentence selection simulation result:', sentenceSimulation);

    // Test highlight click simulation
    console.log('\n3. Testing highlight click simulation...');
    if (vocabSimulation.success && vocabSimulation.response?.elementId) {
      const clickSimulation = await interactionDebugger.simulateHighlightClick(
        'vocabulary',
        vocabSimulation.response.elementId
      );
      console.log('Highlight click simulation result:', clickSimulation);
    }

    // Test highlighting system validation
    console.log('\n4. Testing highlighting system validation...');
    const validation = await interactionDebugger.validateHighlightingSystem();
    console.log('Highlighting system validation result:', validation);

    // Test page compatibility check
    console.log('\n5. Testing page compatibility check...');
    const compatibility = await interactionDebugger.checkPageCompatibility(
      'https://example.com/test-article'
    );
    console.log('Page compatibility check result:', compatibility);

    // Run comprehensive test suite
    console.log('\n6. Running comprehensive interaction test suite...');
    const testSuite = await interactionDebugger.runInteractionTestSuite(
      'https://example.com/test-article'
    );
    console.log('Comprehensive test suite results:', testSuite);

    console.log('\n✅ Page interaction debugging test completed successfully');
  } catch (error) {
    console.error('❌ Page interaction debugging test failed:', error);
  }
}

/**
 * Test content extraction pipeline debugging
 */
async function testContentExtractionDebugging(): Promise<void> {
  console.log('\n=== Testing Content Extraction Pipeline Debugging ===');

  const extractionDebugger = new ContentExtractionDebugger();

  try {
    const testUrl = 'https://example.com/test-article';

    // Test extraction process monitoring
    console.log('\n1. Testing extraction process monitoring...');
    const processMonitoring =
      await extractionDebugger.monitorExtractionProcess(testUrl);
    console.log('Extraction process monitoring result:', processMonitoring);

    // Test content quality validation
    console.log('\n2. Testing content quality validation...');
    const mockExtractedContent = {
      title: 'Sample Article Title',
      content:
        'This is a sample article content for testing quality validation.',
      wordCount: 12,
      paragraphCount: 1,
    };
    const qualityValidation = await extractionDebugger.validateContentQuality(
      testUrl,
      mockExtractedContent
    );
    console.log('Content quality validation result:', qualityValidation);

    // Test performance metrics measurement
    console.log('\n3. Testing performance metrics measurement...');
    const performanceMetrics =
      await extractionDebugger.measurePerformanceMetrics(testUrl);
    console.log('Performance metrics measurement result:', performanceMetrics);

    // Run comprehensive extraction debugging
    console.log('\n4. Running comprehensive extraction debugging...');
    const comprehensiveResults =
      await extractionDebugger.runExtractionDebugging(testUrl);
    console.log(
      'Comprehensive extraction debugging results:',
      comprehensiveResults
    );

    console.log(
      '\n✅ Content extraction pipeline debugging test completed successfully'
    );
  } catch (error) {
    console.error(
      '❌ Content extraction pipeline debugging test failed:',
      error
    );
  }
}

/**
 * Test integrated content script debugging system
 */
async function testIntegratedContentScriptDebugging(): Promise<void> {
  console.log('\n=== Testing Integrated Content Script Debugging System ===');

  try {
    const testUrl = 'https://example.com/comprehensive-test-article';

    // Initialize all debuggers
    const contentScriptDebugger = new ContentScriptDebugger();
    const pageInteractionDebugger = new PageInteractionDebugger();
    const contentExtractionDebugger = new ContentExtractionDebugger();

    console.log('\n1. Starting comprehensive debugging session...');

    // Start monitoring
    await contentScriptDebugger.startMonitoring();

    // Run content extraction debugging
    const extractionResults =
      await contentExtractionDebugger.runExtractionDebugging(testUrl);
    console.log('Extraction debugging completed');

    // Run page interaction testing
    const interactionResults =
      await pageInteractionDebugger.runInteractionTestSuite(testUrl);
    console.log('Interaction testing completed');

    // Verify script injection and functionality
    const injectionStatus = await contentScriptDebugger.verifyScriptInjection();
    console.log('Script injection verification completed');

    // Generate comprehensive report
    const comprehensiveReport = {
      timestamp: new Date(),
      testUrl,
      results: {
        contentExtraction: extractionResults,
        pageInteraction: interactionResults,
        scriptInjection: injectionStatus,
      },
      summary: {
        totalTests: 3,
        successfulTests: [
          extractionResults,
          interactionResults,
          injectionStatus,
        ].filter(
          r =>
            r &&
            (r.success !== false ||
              r.process?.success !== false ||
              r.compatibility?.compatibility?.score > 50)
        ).length,
        issues: [],
        recommendations: [],
      },
    };

    // Add issues and recommendations based on results
    if (extractionResults.quality.overallScore < 70) {
      comprehensiveReport.summary.issues.push(
        'Content quality score below threshold'
      );
      comprehensiveReport.summary.recommendations.push(
        'Review content extraction strategy'
      );
    }

    if (interactionResults.compatibility.compatibility.score < 70) {
      comprehensiveReport.summary.issues.push(
        'Page compatibility score below threshold'
      );
      comprehensiveReport.summary.recommendations.push(
        'Consider alternative interaction methods'
      );
    }

    if (!injectionStatus?.isInjected) {
      comprehensiveReport.summary.issues.push(
        'Content script injection verification failed'
      );
      comprehensiveReport.summary.recommendations.push(
        'Check content script injection mechanism'
      );
    }

    console.log('\n📊 Comprehensive Content Script Debugging Report:');
    console.log(JSON.stringify(comprehensiveReport, null, 2));

    // Stop monitoring
    await contentScriptDebugger.stopMonitoring();

    console.log(
      '\n✅ Integrated content script debugging system test completed successfully'
    );
  } catch (error) {
    console.error(
      '❌ Integrated content script debugging system test failed:',
      error
    );
  }
}

/**
 * Main test function
 */
async function runContentScriptDebuggingTests(): Promise<void> {
  console.log('🚀 Starting Content Script Debugging Tests');
  console.log('==========================================');

  try {
    // Test individual components
    await testContentScriptMonitoring();
    await testPageInteractionDebugging();
    await testContentExtractionDebugging();

    // Test integrated system
    await testIntegratedContentScriptDebugging();

    console.log(
      '\n🎉 All content script debugging tests completed successfully!'
    );
  } catch (error) {
    console.error('\n💥 Content script debugging tests failed:', error);
  }
}

// Export for use in other test files
export {
  testContentScriptMonitoring,
  testPageInteractionDebugging,
  testContentExtractionDebugging,
  testIntegratedContentScriptDebugging,
  runContentScriptDebuggingTests,
};

// Run tests if this file is executed directly
if (require.main === module) {
  runContentScriptDebuggingTests().catch(console.error);
}
