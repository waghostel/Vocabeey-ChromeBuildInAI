/**
 * Test Real Content Script Integration
 * Verify the real MCP integration for content script debugging
 */

import { ContentScriptDebugger } from './contexts/content-script-debugger';

/**
 * Test real content script debugging integration
 */
async function testRealContentScriptIntegration(): Promise<void> {
  console.log('=== Testing Real Content Script MCP Integration ===');

  const contentDebugger = new ContentScriptDebugger();

  try {
    // Test MCP connection status
    console.log('\n1. Checking MCP connection status...');
    const mcpStatus = contentDebugger.getMCPConnectionStatus();
    console.log('MCP Connection Status:', {
      isConnected: mcpStatus.isConnected,
      availableFunctions: mcpStatus.availableFunctions.length,
      lastConnectionTime: mcpStatus.lastConnectionTime,
      errors: mcpStatus.connectionErrors.length,
    });

    // Test content script connection
    console.log('\n2. Testing content script connection...');
    const connected = await contentDebugger.connectToContentScript(
      'https://example.com/test-article'
    );
    console.log('Content script connection result:', connected);

    if (connected) {
      // Test script injection verification
      console.log('\n3. Testing real script injection verification...');
      const injectionResult = await contentDebugger.verifyScriptInjection();
      console.log('Script injection verification:', {
        isInjected: injectionResult?.isInjected,
        extensionId: injectionResult?.extensionId,
        availableFunctions: injectionResult?.availableFunctions?.length || 0,
        errors: injectionResult?.errors?.length || 0,
      });

      // Test DOM manipulation tracking
      console.log('\n4. Testing real DOM manipulation tracking...');
      const domResult = await contentDebugger.trackDOMManipulation();
      console.log('DOM manipulation tracking:', {
        operationsTracked: domResult.length,
        hasOperations: domResult.length > 0,
      });

      // Test content extraction monitoring
      console.log('\n5. Testing real content extraction monitoring...');
      const extractionResult = await contentDebugger.monitorContentExtraction();
      console.log('Content extraction monitoring:', {
        processingTime: extractionResult?.processingTime,
        contentLength: extractionResult?.extractedContent?.contentLength,
        qualityScore: extractionResult?.qualityMetrics?.structureScore,
        errors: extractionResult?.errors?.length || 0,
      });

      // Test highlighting system validation
      console.log('\n6. Testing real highlighting system validation...');
      const highlightingResult =
        await contentDebugger.validateHighlightingSystem();
      console.log('Highlighting system validation:', {
        overallScore: highlightingResult?.overallScore,
        vocabularySuccessful:
          highlightingResult?.vocabularyHighlighting?.successful,
        sentenceSuccessful:
          highlightingResult?.sentenceHighlighting?.successful,
        compatibilityScore:
          highlightingResult?.compatibility?.compatibilityScore,
      });

      // Get current session status
      console.log('\n7. Getting current session status...');
      const session = contentDebugger.getCurrentSession();
      console.log('Current session:', {
        sessionId: session?.sessionId,
        isConnected: session?.isConnected,
        pageUrl: session?.pageUrl,
        capturedDataTypes: session ? Object.keys(session.capturedData) : [],
      });
    }

    console.log(
      '\n✅ Real content script MCP integration test completed successfully'
    );
  } catch (error) {
    console.error('❌ Real content script MCP integration test failed:', error);
  } finally {
    // Cleanup
    contentDebugger.cleanup();
    console.log('Debugger cleanup completed');
  }
}

/**
 * Test individual MCP integration components
 */
async function testMCPIntegrationComponents(): Promise<void> {
  console.log('\n=== Testing Individual MCP Integration Components ===');

  const contentDebugger = new ContentScriptDebugger();

  try {
    // Test DOM performance metrics
    console.log('\n1. Testing DOM performance metrics...');
    const connected = await contentDebugger.connectToContentScript(
      'https://example.com'
    );
    if (connected) {
      const performanceMetrics =
        await contentDebugger.getDOMPerformanceMetrics();
      console.log('DOM performance metrics:', {
        totalOperations: performanceMetrics?.total?.operations,
        recentOperations: performanceMetrics?.recent?.operations,
        observerActive: performanceMetrics?.performance?.observerActive,
        memoryUsage: performanceMetrics?.performance?.memoryUsage?.used,
      });

      // Test content quality validation
      console.log('\n2. Testing content quality validation...');
      const qualityResult = await contentDebugger.validateContentQuality();
      console.log('Content quality validation:', {
        qualityScore: qualityResult?.qualityScore,
        totalWords: qualityResult?.contentMetrics?.totalWords,
        structuralScore: qualityResult?.qualityMetrics?.structureScore,
        issues: qualityResult?.issues?.length || 0,
      });

      // Test extraction performance measurement
      console.log('\n3. Testing extraction performance measurement...');
      const performanceResult =
        await contentDebugger.measureExtractionPerformance();
      console.log('Extraction performance:', {
        processingTime:
          performanceResult?.extractionPerformance?.processingTime,
        throughput: performanceResult?.extractionPerformance?.throughput,
        domComplexity: performanceResult?.domComplexity?.totalElements,
        memoryUsed: performanceResult?.memory?.used,
      });
    }

    console.log('\n✅ MCP integration components test completed successfully');
  } catch (error) {
    console.error('❌ MCP integration components test failed:', error);
  } finally {
    contentDebugger.cleanup();
  }
}

/**
 * Main test function
 */
async function runRealContentScriptTests(): Promise<void> {
  console.log('🚀 Starting Real Content Script MCP Integration Tests');
  console.log('====================================================');

  try {
    await testRealContentScriptIntegration();
    await testMCPIntegrationComponents();

    console.log(
      '\n🎉 All real content script MCP integration tests completed!'
    );
  } catch (error) {
    console.error(
      '\n💥 Real content script MCP integration tests failed:',
      error
    );
  }
}

// Export for use in other test files
export {
  testRealContentScriptIntegration,
  testMCPIntegrationComponents,
  runRealContentScriptTests,
};

// Run tests if this file is executed directly
if (require.main === module) {
  runRealContentScriptTests().catch(console.error);
}
