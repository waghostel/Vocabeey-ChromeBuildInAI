# Chrome Extension Debugging Workflow

## Overview

This document outlines the comprehensive debugging workflow for the Language Learning Chrome Extension using the chrome-devtools MCP. The workflow provides systematic approaches for identifying, diagnosing, and resolving issues across all extension contexts.

## Prerequisites

### Required Tools

- Chrome DevTools MCP server configured and running
- Extension loaded in Chrome with developer mode enabled
- Access to chrome-devtools MCP tools through Kiro

### Environment Setup

1. Ensure chrome-devtools MCP server is running
2. Load extension in Chrome developer mode
3. Open debugging workspace in Kiro
4. Verify MCP connection is active

## Debugging Workflow Steps

### 1. Initialize Debug Session

```typescript
// Start debugging session
const debugSession = new DebugSessionManager();
await debugSession.initialize();

// Connect to extension contexts
await debugSession.connectToAllContexts();
```

**Actions:**

- Connect to service worker context
- Identify content script pages
- Locate offscreen documents
- Verify UI components are accessible

### 2. Context-Specific Debugging

#### Service Worker Debugging

**Purpose:** Debug background processing, message routing, and storage operations

**Steps:**

1. Select service worker context
2. Monitor console messages
3. Track network requests
4. Inspect storage operations
5. Analyze message passing

**MCP Commands:**

```bash
# Select service worker page
mcp_chrome_devtools_select_page(serviceWorkerPageIndex)

# Monitor console messages
mcp_chrome_devtools_list_console_messages({
  types: ['error', 'warn', 'log'],
  includePreservedMessages: true
})

# Track network requests
mcp_chrome_devtools_list_network_requests({
  resourceTypes: ['xhr', 'fetch']
})
```

#### Content Script Debugging

**Purpose:** Debug DOM interaction, content extraction, and page-level functionality

**Steps:**

1. Navigate to test page
2. Take page snapshot
3. Monitor content extraction
4. Validate DOM manipulation
5. Check highlighting systems

**MCP Commands:**

```bash
# Navigate to test page
mcp_chrome_devtools_navigate_page({
  url: 'https://example-article.com'
})

# Take page snapshot
mcp_chrome_devtools_take_snapshot()

# Monitor content extraction
mcp_chrome_devtools_evaluate_script({
  function: '() => window.extensionContentExtractor?.getContent()'
})
```

#### Offscreen Document Debugging

**Purpose:** Debug AI processing, memory management, and computational tasks

**Steps:**

1. Connect to offscreen context
2. Monitor AI processing
3. Track memory usage
4. Validate API responses
5. Check fallback chains

**MCP Commands:**

```bash
# Select offscreen document
mcp_chrome_devtools_select_page(offscreenPageIndex)

# Monitor AI processing
mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    activeServices: window.aiServiceCoordinator?.getActiveServices(),
    memoryUsage: performance.memory
  })'
})
```

#### UI Component Debugging

**Purpose:** Debug learning interface, user interactions, and component state

**Steps:**

1. Navigate to extension UI
2. Test user interactions
3. Validate component rendering
4. Monitor state changes
5. Check TTS functionality

**MCP Commands:**

```bash
# Navigate to extension UI
mcp_chrome_devtools_navigate_page({
  url: 'chrome-extension://[extension-id]/ui/learning-interface.html'
})

# Test interactions
mcp_chrome_devtools_click({
  element: 'vocabulary highlight button',
  ref: 'button[data-mode="vocabulary"]'
})
```

### 3. Automated Test Execution

**Purpose:** Run predefined test scenarios to validate functionality

**Steps:**

1. Load test scenarios
2. Execute automated tests
3. Collect test results
4. Generate test reports

**Implementation:**

```typescript
// Execute test scenarios
const testExecutor = new TestScenarioExecutor();
const scenarios = await testExecutor.loadScenarios();

for (const scenario of scenarios) {
  const result = await testExecutor.executeScenario(scenario);
  await testExecutor.validateResults(result);
}
```

### 4. Performance Analysis

**Purpose:** Identify performance bottlenecks and optimization opportunities

**Metrics to Monitor:**

- Memory usage across contexts
- Processing time for AI operations
- Network request latency
- UI responsiveness
- Cache hit rates

**Analysis Steps:**

1. Collect performance metrics
2. Identify bottlenecks
3. Compare against thresholds
4. Generate optimization recommendations

### 5. Error Analysis and Recovery

**Purpose:** Systematic error identification and resolution

**Error Categories:**

- **Critical:** Extension crashes, data corruption
- **Warning:** Performance degradation, fallback activation
- **Info:** Normal operation logs, debug information

**Recovery Procedures:**

1. Identify error type and context
2. Execute appropriate recovery procedure
3. Validate recovery success
4. Document resolution steps

### 6. Report Generation

**Purpose:** Create comprehensive debugging reports with actionable insights

**Report Components:**

- Executive summary
- Context-specific findings
- Performance metrics
- Error analysis
- Recommendations
- Test results

**Implementation:**

```typescript
// Generate debugging report
const reportGenerator = new DebugReportGenerator();
const report = await reportGenerator.generateReport({
  sessionId: debugSession.id,
  includeMetrics: true,
  includeRecommendations: true,
});
```

## Workflow Integration

### Development Workflow

1. **Pre-Development:** Set up debugging environment
2. **During Development:** Continuous debugging validation
3. **Testing Phase:** Automated debugging scenarios
4. **Pre-Release:** Comprehensive debugging audit

### CI/CD Integration

- Automated debugging checks in build pipeline
- Performance regression detection
- Error threshold monitoring
- Debugging report generation

## Best Practices

### Session Management

- Initialize clean debugging sessions
- Maintain context isolation
- Clean up resources after debugging
- Document session findings

### Data Collection

- Collect comprehensive metrics
- Maintain debugging logs
- Preserve error contexts
- Track performance trends

### Issue Resolution

- Follow systematic debugging approach
- Document resolution steps
- Validate fixes thoroughly
- Update debugging procedures

## Troubleshooting Common Issues

### MCP Connection Issues

- Verify MCP server is running
- Check network connectivity
- Restart MCP server if needed
- Validate MCP configuration

### Context Access Issues

- Ensure extension is loaded
- Check developer mode is enabled
- Verify page permissions
- Restart Chrome if needed

### Performance Issues

- Monitor memory usage
- Check for memory leaks
- Optimize processing algorithms
- Implement caching strategies

## Conclusion

This debugging workflow provides a systematic approach to identifying and resolving issues in the Chrome extension. By following these procedures, developers can efficiently debug complex extension functionality and maintain high code quality.
