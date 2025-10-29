# Chrome Extension Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when debugging the Language Learning Chrome Extension. Each issue includes symptoms, root causes, diagnostic steps, and resolution procedures.

## Common Issues and Solutions

### 1. Extension Loading Issues

#### Symptoms

- Extension not appearing in Chrome extensions list
- Extension icon not visible in toolbar
- Extension functionality not working

#### Root Causes

- Manifest.json errors
- Invalid file paths
- Missing permissions
- Build output issues

#### Diagnostic Steps

1. Check Chrome extensions page for error messages
2. Inspect manifest.json for syntax errors
3. Verify all referenced files exist
4. Check console for loading errors

#### Resolution

```bash
# Validate manifest
pnpm validate:extension

# Rebuild extension
pnpm build

# Check file structure
ls -la dist/
```

**Prevention:**

- Use `pnpm validate:extension` before loading
- Maintain consistent build process
- Verify file paths in manifest

### 2. Service Worker Issues

#### Symptoms

- Background processing not working
- Message passing failures
- Storage operations failing
- Extension lifecycle issues

#### Root Causes

- Service worker crashes
- Unhandled promise rejections
- Memory leaks
- Invalid message formats

#### Diagnostic Steps

1. Open Chrome DevTools for service worker
2. Check console for errors
3. Monitor network requests
4. Inspect storage operations

#### Resolution

```typescript
// Debug service worker
await mcp_chrome_devtools_select_page(serviceWorkerPageIndex);
const consoleMessages = await mcp_chrome_devtools_list_console_messages({
  types: ['error', 'warn'],
});

// Check for common issues
const commonIssues = consoleMessages.filter(
  msg =>
    msg.text.includes('Uncaught') ||
    msg.text.includes('Promise') ||
    msg.text.includes('storage')
);
```

**Common Fixes:**

- Add proper error handling to async operations
- Implement promise rejection handlers
- Clean up event listeners
- Validate message formats

### 3. Content Script Injection Issues

#### Symptoms

- Content scripts not running on pages
- DOM manipulation not working
- Content extraction failing
- Highlighting not appearing

#### Root Causes

- Insufficient permissions
- Content Security Policy conflicts
- Script injection timing issues
- DOM not ready

#### Diagnostic Steps

1. Check extension permissions
2. Inspect page CSP headers
3. Verify script injection timing
4. Monitor content script console

#### Resolution

```typescript
// Debug content script injection
await mcp_chrome_devtools_navigate_page({
  url: 'https://test-page.com'
});

// Check if content script loaded
const contentScriptStatus = await mcp_chrome_devtools_evaluate_script({
  function: '() => !!window.extensionContentExtractor'
});

// Verify DOM readiness
const domStatus = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    readyState: document.readyState,
    hasContent: document.body?.children.length > 0
  })'
});
```

**Common Fixes:**

- Add `activeTab` permission
- Use `document_idle` injection timing
- Implement DOM ready checks
- Handle CSP restrictions

### 4. AI Processing Issues

#### Symptoms

- AI responses not generated
- Processing timeouts
- Fallback chains not working
- Memory usage spikes

#### Root Causes

- API rate limits
- Network connectivity issues
- Invalid API keys
- Memory leaks in processing

#### Diagnostic Steps

1. Check AI service availability
2. Monitor API request/response cycles
3. Verify API key configuration
4. Track memory usage during processing

#### Resolution

```typescript
// Debug AI processing
await mcp_chrome_devtools_select_page(offscreenPageIndex);

// Check AI service status
const aiStatus = await mcp_chrome_devtools_evaluate_script({
  function: `() => ({
    chromeAI: !!window.ai?.summarizer,
    geminiAPI: !!window.geminiApiKey,
    activeServices: window.aiServiceCoordinator?.getActiveServices(),
    processingQueue: window.aiServiceCoordinator?.getQueueStatus()
  })`,
});

// Monitor memory usage
const memoryUsage = await mcp_chrome_devtools_evaluate_script({
  function: '() => performance.memory',
});
```

**Common Fixes:**

- Implement proper API key validation
- Add retry logic with exponential backoff
- Clean up processing resources
- Optimize memory usage

### 5. Storage and Caching Issues

#### Symptoms

- Data not persisting
- Cache misses
- Storage quota exceeded
- Data corruption

#### Root Causes

- Storage API errors
- Cache invalidation issues
- Quota management problems
- Schema version conflicts

#### Diagnostic Steps

1. Check storage API usage
2. Monitor cache hit/miss ratios
3. Verify storage quota
4. Validate data schema

#### Resolution

```typescript
// Debug storage operations
const storageDebugger = new StorageCachingDebugger();
await storageDebugger.initialize();

// Check storage status
const storageStatus = await storageDebugger.validateStorageOperations();

// Monitor cache performance
const cacheMetrics = await storageDebugger.analyzeCachePerformance();

// Validate data integrity
const dataIntegrity = await storageDebugger.validateDataPersistence();
```

**Common Fixes:**

- Implement storage quota monitoring
- Add data validation before storage
- Handle schema migrations properly
- Optimize cache strategies

### 6. UI Component Issues

#### Symptoms

- Components not rendering
- User interactions not working
- Layout problems
- TTS not functioning

#### Root Causes

- CSS conflicts
- JavaScript errors
- Event handler issues
- Audio API problems

#### Diagnostic Steps

1. Inspect component rendering
2. Check for JavaScript errors
3. Validate event handlers
4. Test audio functionality

#### Resolution

```typescript
// Debug UI components
await mcp_chrome_devtools_navigate_page({
  url: 'chrome-extension://[extension-id]/ui/learning-interface.html',
});

// Check component rendering
const uiStatus = await mcp_chrome_devtools_evaluate_script({
  function: `() => ({
    componentsLoaded: !!window.learningInterface,
    currentMode: window.learningInterface?.getCurrentMode(),
    highlightCount: document.querySelectorAll('.highlight').length,
    ttsAvailable: !!window.speechSynthesis
  })`,
});

// Test user interactions
await mcp_chrome_devtools_click({
  element: 'vocabulary button',
  ref: 'button[data-mode="vocabulary"]',
});
```

**Common Fixes:**

- Isolate CSS with proper scoping
- Add comprehensive error handling
- Implement proper event delegation
- Handle audio API permissions

### 7. Performance Issues

#### Symptoms

- Slow processing times
- High memory usage
- UI lag
- Network timeouts

#### Root Causes

- Inefficient algorithms
- Memory leaks
- Blocking operations
- Network bottlenecks

#### Diagnostic Steps

1. Profile memory usage
2. Measure processing times
3. Identify blocking operations
4. Monitor network performance

#### Resolution

```typescript
// Performance debugging
const performanceMonitor = new PerformanceBottleneckDetector();
await performanceMonitor.initialize();

// Identify bottlenecks
const bottlenecks = await performanceMonitor.identifyBottlenecks();

// Monitor memory usage
const memoryMetrics = await performanceMonitor.monitorMemoryUsage();

// Analyze processing times
const processingMetrics = await performanceMonitor.analyzeProcessingTimes();
```

**Common Fixes:**

- Implement lazy loading
- Use web workers for heavy processing
- Add request debouncing
- Optimize data structures

## Debugging Tools and Utilities

### MCP Chrome DevTools Commands

#### Essential Commands

```bash
# List all pages
mcp_chrome_devtools_list_pages()

# Select specific page
mcp_chrome_devtools_select_page(pageIndex)

# Take page snapshot
mcp_chrome_devtools_take_snapshot()

# Execute JavaScript
mcp_chrome_devtools_evaluate_script({
  function: '() => { /* debug code */ }'
})

# Monitor console messages
mcp_chrome_devtools_list_console_messages({
  types: ['error', 'warn', 'log']
})

# Track network requests
mcp_chrome_devtools_list_network_requests()
```

#### Advanced Commands

```bash
# Performance monitoring
mcp_chrome_devtools_performance_start_trace({
  reload: true,
  autoStop: true
})

# Memory analysis
mcp_chrome_devtools_evaluate_script({
  function: '() => performance.memory'
})

# Network throttling
mcp_chrome_devtools_emulate_network({
  throttlingOption: 'Slow 3G'
})
```

### Custom Debugging Utilities

#### Debug Session Manager

```typescript
const debugSession = new DebugSessionManager();
await debugSession.initialize();
await debugSession.captureExtensionState();
```

#### Context-Specific Debuggers

```typescript
// Service worker debugging
const serviceWorkerDebugger = new ServiceWorkerDebugger();
await serviceWorkerDebugger.debugBackgroundProcessing();

// Content script debugging
const contentScriptDebugger = new ContentScriptDebugger();
await contentScriptDebugger.debugContentExtraction();

// UI debugging
const uiDebugger = new UIComponentDebugger();
await uiDebugger.debugUserInteractions();
```

## Emergency Procedures

### Extension Crash Recovery

1. Disable extension
2. Clear extension data
3. Rebuild extension
4. Reload with debugging enabled
5. Monitor for recurring issues

### Data Recovery

1. Export existing data
2. Validate data integrity
3. Implement data migration
4. Restore validated data
5. Verify functionality

### Performance Emergency

1. Identify resource-intensive operations
2. Implement temporary optimizations
3. Monitor system resources
4. Plan permanent fixes
5. Deploy optimized version

## Prevention Strategies

### Code Quality

- Implement comprehensive error handling
- Use TypeScript for type safety
- Add unit tests for critical functions
- Perform code reviews

### Testing

- Run automated test scenarios
- Perform manual testing on different sites
- Test with various network conditions
- Validate on different Chrome versions

### Monitoring

- Implement continuous debugging checks
- Monitor performance metrics
- Track error rates
- Set up alerting systems

## Getting Help

### Internal Resources

- Check debugging documentation
- Review test scenarios
- Consult architecture diagrams
- Examine similar issues in logs

### External Resources

- Chrome Extension documentation
- Chrome DevTools Protocol docs
- MCP server documentation
- Community forums and Stack Overflow

### Escalation Process

1. Document issue thoroughly
2. Collect debugging data
3. Create minimal reproduction case
4. Consult with team members
5. File detailed bug report

## Conclusion

This troubleshooting guide provides systematic approaches to resolving common issues in the Chrome extension. By following these procedures and using the provided debugging tools, most issues can be quickly identified and resolved. Regular use of preventive measures will help maintain extension stability and performance.
