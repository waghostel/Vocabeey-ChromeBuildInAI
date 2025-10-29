# LLM Step-by-Step Error Fixing Guide for Chrome Extension Debugging

## Overview

This comprehensive guide provides LLMs with systematic, step-by-step procedures to diagnose and fix Chrome extension errors using the chrome-devtools MCP and our complete debugging toolkit. Follow these procedures in order for efficient error resolution.

## Quick Reference: Available Debugging Tools

### Core MCP Chrome DevTools Commands

- `mcp_chrome_devtools_list_pages()` - List all extension contexts
- `mcp_chrome_devtools_select_page(pageIdx)` - Switch to specific context
- `mcp_chrome_devtools_take_snapshot()` - Get page accessibility snapshot
- `mcp_chrome_devtools_list_console_messages()` - Get console logs
- `mcp_chrome_devtools_list_network_requests()` - Get network activity
- `mcp_chrome_devtools_evaluate_script()` - Execute JavaScript in context

### Our Custom Debugging Tools

- **Service Worker Debugger** (`debug/contexts/service-worker-debugger.ts`)
- **Content Script Debugger** (`debug/contexts/content-script-debugger.ts`)
- **Offscreen Debugger** (`debug/contexts/offscreen-debugger.ts`)
- **UI Component Debugger** (`debug/contexts/ui-component-debugger.ts`)
- **Storage & Caching Debugger** (`debug/contexts/storage-caching-debugger.ts`)
- **Integration Debugger** (`debug/contexts/integration-debugger.ts`)
- **Performance Monitor** (`debug/utils/performance-optimization-system.ts`)
- **Memory Monitor** (`debug/utils/memory-monitor.ts`)

---

## STEP 1: Initial Error Assessment and Context Identification

### 1.1 Gather Initial Information

**Always start here when encountering any error:**

```typescript
// Step 1: List all available extension contexts
const pages = await mcp_chrome_devtools_list_pages();
console.log('Available extension contexts:', pages);

// Step 2: Identify error context from user description
const errorContext = identifyErrorContext(userErrorDescription);
// Possible contexts: 'service-worker', 'content-script', 'offscreen', 'ui-component', 'cross-component'
```

### 1.2 Quick Error Classification

**Classify the error type to determine debugging approach:**

```typescript
const errorTypes = {
  'extension-crash': 'Critical - Extension stops working entirely',
  'content-extraction-failure': 'High - Cannot extract article content',
  'ai-processing-error': 'High - AI services not responding',
  'ui-not-loading': 'High - Learning interface not displaying',
  'performance-degradation': 'Medium - Extension running slowly',
  'storage-issues': 'Medium - Data not saving/loading',
  'highlighting-problems': 'Low - Visual highlighting not working',
  'translation-errors': 'Low - Specific translations failing',
};

// Determine priority and debugging approach
const errorPriority = classifyError(userErrorDescription);
```

### 1.3 Select Primary Debugging Context

**Choose the main context to start debugging:**

```typescript
// Based on error type, select appropriate context
const contextMapping = {
  'extension-crash': 'service-worker',
  'content-extraction-failure': 'content-script',
  'ai-processing-error': 'offscreen',
  'ui-not-loading': 'ui-component',
  'performance-degradation': 'all-contexts',
  'storage-issues': 'service-worker',
  'highlighting-problems': 'content-script',
  'translation-errors': 'offscreen',
};

const primaryContext = contextMapping[errorType];
```

---

## STEP 2: Context-Specific Error Diagnosis

### 2.1 Service Worker Context Debugging

**Use when error involves background processing, storage, or message passing:**

```typescript
// Step 1: Select service worker context
const serviceWorkerPage = pages.find(p => p.type === 'service_worker');
await mcp_chrome_devtools_select_page(serviceWorkerPage.index);

// Step 2: Get console messages for errors
const consoleMessages = await mcp_chrome_devtools_list_console_messages({
  types: ['error', 'warn'],
  includePreservedMessages: true,
});

// Step 3: Check network requests for API failures
const networkRequests = await mcp_chrome_devtools_list_network_requests({
  resourceTypes: ['xhr', 'fetch'],
});

// Step 4: Use our service worker debugger
const serviceWorkerDebugger = new ServiceWorkerDebugger();
await serviceWorkerDebugger.startDebugging();

// Step 5: Check specific service worker functionality
const debugResults = await serviceWorkerDebugger.runDiagnostics();
console.log('Service Worker Diagnostics:', debugResults);

// Step 6: Check storage operations if storage-related error
if (errorType.includes('storage')) {
  const storageDebugger = new StorageCachingDebugger();
  const sessionId = await storageDebugger.startDebuggingSession();
  const storageReport = await storageDebugger.runComprehensiveAnalysis();
  console.log('Storage Analysis:', storageReport);
}
```

### 2.2 Content Script Context Debugging

**Use when error involves content extraction, DOM manipulation, or page interaction:**

```typescript
// Step 1: Navigate to a test page where error occurs
await mcp_chrome_devtools_navigate_page({
  url: 'https://example-article-site.com/article'
});

// Step 2: Take page snapshot to see current state
const snapshot = await mcp_chrome_devtools_take_snapshot();
console.log('Page snapshot:', snapshot);

// Step 3: Check if content script is injected
const injectionCheck = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    extensionInjected: !!window.extensionContentScript,
    contentExtractor: !!window.extensionContentExtractor,
    highlightingSystem: !!window.extensionHighlighting
  })'
});

// Step 4: Use our content script debugger
const contentDebugger = new ContentScriptDebugger();
await contentDebugger.startDebugging();

// Step 5: Test content extraction specifically
const extractionResults = await contentDebugger.testContentExtraction();
console.log('Content Extraction Results:', extractionResults);

// Step 6: Test highlighting system if highlighting issue
if (errorType.includes('highlighting')) {
  const highlightingResults = await contentDebugger.testHighlightingSystems();
  console.log('Highlighting Test Results:', highlightingResults);
}

// Step 7: Check for CSP or permission issues
const cspCheck = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    cspViolations: document.querySelectorAll("[data-csp-violation]").length,
    permissions: navigator.permissions ? "available" : "unavailable"
  })'
});
```

### 2.3 Offscreen Document Debugging

**Use when error involves AI processing, memory issues, or computational tasks:**

```typescript
// Step 1: Find and select offscreen document
const offscreenPage = pages.find(p => p.url.includes('offscreen'));
if (offscreenPage) {
  await mcp_chrome_devtools_select_page(offscreenPage.index);
} else {
  console.error('Offscreen document not found - this may be the issue');
}

// Step 2: Check AI service availability
const aiServiceCheck = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    chromeAI: !!window.ai,
    geminiAPI: !!window.geminiAPI,
    aiCoordinator: !!window.aiServiceCoordinator,
    activeServices: window.aiServiceCoordinator?.getActiveServices()
  })'
});

// Step 3: Use our offscreen debugger
const offscreenDebugger = new OffscreenDebugger();
await offscreenDebugger.startDebugging();

// Step 4: Test AI processing pipeline
const aiTestResults = await offscreenDebugger.testAIProcessing();
console.log('AI Processing Test Results:', aiTestResults);

// Step 5: Check memory usage for memory-related issues
const memoryMonitor = new MemoryMonitor();
const memoryAnalysis = await memoryMonitor.analyzeMemoryUsage();
console.log('Memory Analysis:', memoryAnalysis);

// Step 6: Test fallback chains
const fallbackResults = await offscreenDebugger.testFallbackChains();
console.log('Fallback Chain Results:', fallbackResults);
```

### 2.4 UI Component Debugging

**Use when error involves learning interface, user interactions, or visual components:**

```typescript
// Step 1: Navigate to extension UI
await mcp_chrome_devtools_navigate_page({
  url: `chrome-extension://${extensionId}/ui/learning-interface.html`
});

// Step 2: Take screenshot to see visual state
await mcp_chrome_devtools_take_screenshot({
  filename: 'ui-error-state.png',
  fullPage: true
});

// Step 3: Check component loading
const componentCheck = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    componentsLoaded: !!document.querySelector("[data-component]"),
    reactMounted: !!window.React,
    stateManager: !!window.extensionStateManager,
    ttsService: !!window.extensionTTS
  })'
});

// Step 4: Use our UI component debugger
const uiDebugger = new UIComponentDebugger();
await uiDebugger.startDebugging();

// Step 5: Test user interaction flows
const interactionResults = await uiDebugger.testUserInteractions();
console.log('User Interaction Results:', interactionResults);

// Step 6: Test specific UI functionality based on error
if (errorType.includes('tts')) {
  const ttsResults = await uiDebugger.testTTSFunctionality();
  console.log('TTS Test Results:', ttsResults);
}
```

---

## STEP 3: Cross-Component Integration Analysis

### 3.1 Message Passing Analysis

**Always check message passing when multiple components are involved:**

```typescript
// Step 1: Use integration debugger for cross-component issues
const integrationDebugger = new IntegrationDebugger();
await integrationDebugger.startDebugging();

// Step 2: Test message flow between components
const messageFlowResults = await integrationDebugger.testMessageFlow();
console.log('Message Flow Results:', messageFlowResults);

// Step 3: Check for message passing bottlenecks
const messageBottlenecks =
  await integrationDebugger.identifyMessageBottlenecks();
console.log('Message Bottlenecks:', messageBottlenecks);

// Step 4: Validate data flow integrity
const dataFlowResults = await integrationDebugger.validateDataFlow();
console.log('Data Flow Validation:', dataFlowResults);
```

### 3.2 Performance Impact Analysis

**Check if error is causing or caused by performance issues:**

```typescript
// Step 1: Run comprehensive performance analysis
const performanceOptimizer = new PerformanceOptimizationSystem();
const performanceReport =
  await performanceOptimizer.generateOptimizationReport();
console.log('Performance Report:', performanceReport);

// Step 2: Check for memory leaks
const memoryLeakCheck = await memoryMonitor.detectMemoryLeaks();
console.log('Memory Leak Analysis:', memoryLeakCheck);

// Step 3: Analyze processing bottlenecks
const bottleneckDetector = new PerformanceBottleneckDetector();
const bottlenecks = await bottleneckDetector.identifyBottlenecks();
console.log('Performance Bottlenecks:', bottlenecks);
```

---

## STEP 4: Automated Error Recovery Attempts

### 4.1 Standard Recovery Procedures

**Try these automated recovery steps before manual intervention:**

```typescript
// Step 1: Attempt automatic error recovery
const errorRecovery = {
  'extension-crash': async () => {
    // Restart extension contexts
    await chrome.runtime.reload();
    return 'Extension reloaded';
  },

  'content-extraction-failure': async () => {
    // Clear cache and retry extraction
    const cacheManager = getCacheManager();
    await cacheManager.clearAllCaches();
    return 'Cache cleared, retry extraction';
  },

  'ai-processing-error': async () => {
    // Switch to fallback AI service
    const aiCoordinator = getAIServiceCoordinator();
    await aiCoordinator.switchToFallback();
    return 'Switched to fallback AI service';
  },

  'storage-issues': async () => {
    // Validate and repair storage
    const storageValidator = new DataPersistenceValidator();
    const repairResults = await storageValidator.validateDataIntegrity();
    return `Storage validation: ${repairResults.isValid ? 'OK' : 'Repaired'}`;
  },
};

// Execute appropriate recovery
const recoveryResult = await errorRecovery[errorType]?.();
console.log('Recovery attempt result:', recoveryResult);
```

### 4.2 Validation After Recovery

**Always validate that recovery was successful:**

```typescript
// Step 1: Re-run the failing operation
const validationResults = await rerunFailingOperation();

// Step 2: Check system health after recovery
const healthCheck = await performanceOptimizer.checkSystemHealth();
console.log('Post-recovery health check:', healthCheck);

// Step 3: Verify no new errors introduced
const newErrors = await mcp_chrome_devtools_list_console_messages({
  types: ['error'],
  pageSize: 10,
});

if (newErrors.length === 0) {
  console.log('✅ Recovery successful - no new errors');
} else {
  console.log('⚠️ Recovery incomplete - new errors detected:', newErrors);
}
```

---

## STEP 5: Manual Error Resolution

### 5.1 Code-Level Debugging

**When automated recovery fails, debug at code level:**

```typescript
// Step 1: Identify exact error location
const errorLocation = await mcp_chrome_devtools_evaluate_script({
  function: `() => {
    // Add debugging breakpoints
    window.debugMode = true;
    
    // Override console.error to capture stack traces
    const originalError = console.error;
    console.error = function(...args) {
      originalError.apply(console, args);
      return { args, stack: new Error().stack, timestamp: Date.now() };
    };
    
    return 'Debug mode enabled';
  }`,
});

// Step 2: Execute problematic code with enhanced logging
const debugExecution = await mcp_chrome_devtools_evaluate_script({
  function: `() => {
    try {
      // Execute the failing operation with detailed logging
      return window.extensionDebugger?.executeWithLogging();
    } catch (error) {
      return { 
        error: error.message, 
        stack: error.stack,
        context: window.location.href,
        timestamp: Date.now()
      };
    }
  }`,
});
```

### 5.2 Environment-Specific Fixes

**Apply fixes based on detected environment issues:**

```typescript
// Step 1: Check Chrome version compatibility
const chromeVersion = await mcp_chrome_devtools_evaluate_script({
  function: '() => navigator.userAgent.match(/Chrome\/([0-9.]+)/)[1]',
});

// Step 2: Check extension permissions
const permissionCheck = await mcp_chrome_devtools_evaluate_script({
  function: `() => {
    return chrome.runtime.getManifest().permissions;
  }`,
});

// Step 3: Apply environment-specific fixes
const environmentFixes = {
  'chrome-version-old': 'Update Chrome to latest version',
  'permissions-insufficient': 'Add required permissions to manifest',
  'csp-violation': 'Update Content Security Policy',
  'api-unavailable': 'Check API availability and add fallbacks',
};
```

---

## STEP 6: Comprehensive Testing and Validation

### 6.1 Automated Test Suite Execution

**Run comprehensive tests to ensure fix doesn't break other functionality:**

```typescript
// Step 1: Execute automated test scenarios
const testExecutor = new TestScenarioExecutor();
const testResults = await testExecutor.executeAllScenarios();
console.log('Automated Test Results:', testResults);

// Step 2: Run performance regression tests
const regressionTests = await performanceOptimizer.runRegressionTests();
console.log('Performance Regression Results:', regressionTests);

// Step 3: Validate cross-component integration
const integrationTests = await integrationDebugger.runIntegrationTests();
console.log('Integration Test Results:', integrationTests);
```

### 6.2 User Scenario Validation

**Test the specific user scenario that was failing:**

```typescript
// Step 1: Reproduce original error scenario
const originalScenario = await reproduceOriginalError();

// Step 2: Validate fix resolves the issue
const fixValidation = await validateFixEffectiveness();

// Step 3: Test edge cases around the fix
const edgeCaseTests = await testEdgeCases();

console.log('Fix Validation Results:', {
  originalScenario,
  fixValidation,
  edgeCaseTests,
});
```

---

## STEP 7: Documentation and Prevention

### 7.1 Document the Resolution

**Always document what was found and how it was fixed:**

```typescript
const resolutionDocumentation = {
  errorType: errorType,
  rootCause: identifiedRootCause,
  resolutionSteps: appliedFixes,
  testingPerformed: testResults,
  preventionMeasures: recommendedPrevention,
  timestamp: new Date(),
  affectedComponents: involvedComponents,
};

// Save to debugging knowledge base
await saveToKnowledgeBase(resolutionDocumentation);
```

### 7.2 Implement Prevention Measures

**Add safeguards to prevent similar errors:**

```typescript
// Step 1: Add error handling where missing
const errorHandlingImprovements = [
  'Add try-catch blocks around risky operations',
  'Implement retry mechanisms for network operations',
  'Add input validation for user data',
  'Implement graceful degradation for API failures',
];

// Step 2: Add monitoring for early detection
const monitoringImprovements = [
  'Add performance monitoring for slow operations',
  'Implement error rate tracking',
  'Add memory usage alerts',
  'Monitor API response times',
];

// Step 3: Improve testing coverage
const testingImprovements = [
  'Add test cases for the fixed scenario',
  'Implement automated regression tests',
  'Add performance benchmarks',
  'Create integration test scenarios',
];
```

---

## STEP 8: Final Validation and Cleanup

### 8.1 System Health Check

**Perform final system health validation:**

```typescript
// Step 1: Run comprehensive system health check
const finalHealthCheck = await performanceOptimizer.checkSystemHealth();

// Step 2: Verify all debugging sessions are cleaned up
await serviceWorkerDebugger?.stopDebugging();
await contentDebugger?.stopDebugging();
await offscreenDebugger?.stopDebugging();
await uiDebugger?.stopDebugging();
await integrationDebugger?.stopDebugging();

// Step 3: Generate final debugging report
const debuggingReport = await generateFinalDebuggingReport({
  errorType,
  resolutionSteps,
  testResults,
  systemHealth: finalHealthCheck,
});

console.log('Final Debugging Report:', debuggingReport);
```

### 8.2 User Communication

**Provide clear communication about the resolution:**

```typescript
const userCommunication = {
  issueResolved: true,
  resolutionSummary: 'Brief explanation of what was fixed',
  userActionRequired: 'Any actions the user needs to take',
  preventionTips: 'How to avoid this issue in the future',
  supportContact: 'How to get help if issue recurs',
};

console.log('User Communication:', userCommunication);
```

---

## Common Error Patterns and Quick Fixes

### Pattern 1: Extension Not Loading

```typescript
// Quick diagnostic
const pages = await mcp_chrome_devtools_list_pages();
if (pages.length === 0) {
  return 'Extension not loaded - check developer mode and reload extension';
}
```

### Pattern 2: Content Script Not Injecting

```typescript
// Quick fix
await mcp_chrome_devtools_navigate_page({ url: testUrl });
const injection = await mcp_chrome_devtools_evaluate_script({
  function: '() => !!window.extensionContentScript',
});
if (!injection) {
  return 'Content script injection failed - check manifest permissions';
}
```

### Pattern 3: AI Services Unavailable

```typescript
// Quick diagnostic
const aiCheck = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({ chromeAI: !!window.ai, network: navigator.onLine })',
});
if (!aiCheck.chromeAI && !aiCheck.network) {
  return 'Both Chrome AI and network unavailable - check connectivity';
}
```

### Pattern 4: Storage Quota Exceeded

```typescript
// Quick fix
const storageDebugger = new StorageCachingDebugger();
const analysis = await storageDebugger.runComprehensiveAnalysis();
if (analysis.cachePerformance.totalCacheSize > 5000000) {
  return 'Storage quota exceeded - run cache cleanup';
}
```

---

## Emergency Procedures

### When Extension is Completely Broken

1. **Immediate**: Reload extension via `chrome.runtime.reload()`
2. **If reload fails**: Disable and re-enable extension
3. **If still broken**: Clear all extension data and reinstall
4. **Last resort**: Reset Chrome profile

### When Debugging Tools Fail

1. **Fallback**: Use Chrome DevTools directly
2. **Alternative**: Use console.log debugging
3. **Manual**: Step through code with breakpoints
4. **External**: Use external debugging tools

### When MCP Connection is Lost

1. **Reconnect**: Restart MCP server
2. **Verify**: Check MCP configuration
3. **Alternative**: Use direct Chrome DevTools
4. **Workaround**: Use manual debugging methods

---

## Success Criteria Checklist

Before considering an error "fixed", verify:

- [ ] Original error no longer occurs
- [ ] No new errors introduced
- [ ] Performance not degraded
- [ ] All automated tests pass
- [ ] User scenario works end-to-end
- [ ] Fix is documented
- [ ] Prevention measures implemented
- [ ] System health check passes
- [ ] Debugging sessions cleaned up

---

## Quick Reference Commands

### Essential MCP Commands

```bash
# List all contexts
mcp_chrome_devtools_list_pages()

# Switch context
mcp_chrome_devtools_select_page(0)

# Get errors
mcp_chrome_devtools_list_console_messages({types: ['error']})

# Execute code
mcp_chrome_devtools_evaluate_script({function: '() => window.extensionStatus'})

# Take snapshot
mcp_chrome_devtools_take_snapshot()
```

### Essential Debugging Tools

```typescript
// Service Worker
const swDebugger = new ServiceWorkerDebugger();
await swDebugger.runDiagnostics();

// Content Script
const csDebugger = new ContentScriptDebugger();
await csDebugger.testContentExtraction();

// Performance
const perfOptimizer = new PerformanceOptimizationSystem();
await perfOptimizer.checkSystemHealth();

// Storage
const storageDebugger = new StorageCachingDebugger();
await storageDebugger.runComprehensiveAnalysis();
```

This guide provides a systematic approach to debugging any Chrome extension error. Follow the steps in order, adapt based on the specific error type, and always validate your fixes thoroughly before considering the issue resolved.
