# Chrome Extension Debugging Environment

This directory contains debugging tools and utilities for the Language Learning Chrome Extension using chrome-devtools MCP.

## 🤖 For Coding Agents (Gemini, Kiro, Amazon Q, etc.)

### Quick Start for LLMs

**To debug Chrome extension issues using MCP chrome-devtools:**

1. **Connect to Extension**: Use `mcp_chrome_devtools_list_pages()` to find extension contexts
2. **Select Context**: Use `mcp_chrome_devtools_select_page(pageIdx)` to target specific context
3. **Inspect Issues**: Use `mcp_chrome_devtools_list_console_messages()` for errors
4. **Execute Fixes**: Use `mcp_chrome_devtools_evaluate_script()` to test solutions
5. **Validate**: Re-run diagnostics to confirm fixes

### Essential MCP Commands for Error Fixing

```typescript
// 1. Find extension pages
await mcp_chrome_devtools_list_pages();

// 2. Select service worker (usually index 0-2)
await mcp_chrome_devtools_select_page({ pageIdx: 0 });

// 3. Check for errors
await mcp_chrome_devtools_list_console_messages({ types: ['error', 'warn'] });

// 4. Inspect network issues
await mcp_chrome_devtools_list_network_requests({
  resourceTypes: ['xhr', 'fetch'],
});

// 5. Test code fixes
await mcp_chrome_devtools_evaluate_script({
  function: '() => { /* your test code */ }',
});

// 6. Monitor storage issues
await mcp_chrome_devtools_evaluate_script({
  function: '() => chrome.storage.local.get(null)',
});
```

### Common Error Patterns & MCP Solutions

#### Service Worker Errors

```typescript
// Check service worker status
await mcp_chrome_devtools_evaluate_script({
  function: '() => navigator.serviceWorker.ready',
});

// Test message passing
await mcp_chrome_devtools_evaluate_script({
  function: "() => chrome.runtime.sendMessage({type: 'test'})",
});
```

#### Content Script Issues

```typescript
// Navigate to test page
await mcp_chrome_devtools_navigate_page({ url: 'https://example.com' });

// Check content script injection
await mcp_chrome_devtools_evaluate_script({
  function: '() => window.contentScriptLoaded',
});

// Test DOM manipulation
await mcp_chrome_devtools_evaluate_script({
  function: "() => document.querySelector('.highlight')",
});
```

#### AI Processing Errors

```typescript
// Check Chrome AI availability
await mcp_chrome_devtools_evaluate_script({
  function: "() => 'ai' in window && 'summarizer' in window.ai",
});

// Test AI service calls
await mcp_chrome_devtools_evaluate_script({
  function:
    'async () => { const summarizer = await window.ai.summarizer.create(); return summarizer.ready; }',
});
```

### Automated Debugging Workflow

Use the built-in debugging utilities:

```typescript
// Run comprehensive system check
node debug/test-comprehensive-mcp-integration.ts

// Test specific context
node debug/test-real-content-script-integration.ts

// Validate performance
node debug/test-real-debugging-system-optimization.ts
```

## 📖 Documentation

### Playwright MCP Debugging (New!)

**For automated browser testing and visual debugging:**

- **[Playwright Debugging Guide](./PLAYWRIGHT_DEBUGGING_GUIDE.md)** - Complete guide to Playwright MCP debugging
  - Setup and configuration
  - Running debugging sessions
  - Understanding reports
  - Common issues and solutions
  - Example debugging sessions
  - Best practices

- **[Quick Debug Scenarios](./QUICK_DEBUG_SCENARIOS.md)** - Quick reference for common issues
  - 10 most common scenarios with quick fixes
  - Command reference
  - Troubleshooting decision tree

- **[Troubleshooting Flowchart](./TROUBLESHOOTING_FLOWCHART.md)** - Visual debugging guides
  - Flowcharts for common issues
  - Decision trees
  - Priority matrix

**Quick Start with Playwright:**

```bash
# Build extension
pnpm build

# Run extension validation
npx tsx debug/run-extension-validation.ts

# Test article processing workflow
npx tsx debug/test-article-processing-workflow.ts

# Generate comprehensive report
npx tsx debug/run-comprehensive-report-generator.ts
```

### LLM-Specific Guides

- **[LLM Comprehensive Guide Index](./LLM_COMPREHENSIVE_GUIDE_INDEX.md)** - Master index for all LLM documentation
- **[LLM Quick Reference Guide](./LLM_QUICK_REFERENCE_GUIDE.md)** - Essential commands and patterns for immediate use
- **[LLM Extension Architecture Guide](./LLM_EXTENSION_ARCHITECTURE_GUIDE.md)** - Comprehensive system architecture overview
- **[LLM Chrome Extension Examination Guide](./LLM_CHROME_EXTENSION_EXAMINATION_GUIDE.md)** - Detailed examination methodology
- **[LLM Debugging Workflow Guide](./LLM_DEBUGGING_WORKFLOW_GUIDE.md)** - Step-by-step debugging procedures
- **[MCP Debugging Commands Cheatsheet](./MCP_DEBUGGING_COMMANDS_CHEATSHEET.md)** - Quick reference for MCP commands

### Core Debugging Documentation

- **[Debugging Workflow](./DEBUGGING_WORKFLOW.md)** - Complete step-by-step debugging process and procedures
- **[Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)** - Solutions to common issues and systematic problem resolution
- **[Best Practices](./DEBUGGING_BEST_PRACTICES.md)** - Guidelines and best practices for effective debugging

### Implementation Summaries

- **[Service Worker Debugging](./SERVICE_WORKER_DEBUGGING_SUMMARY.md)** - Service worker debugging implementation
- **[UI Component Debugging](./UI_COMPONENT_DEBUGGING_SUMMARY.md)** - UI component debugging implementation
- **[Storage & Caching Debugging](./STORAGE_CACHING_DEBUGGING_SUMMARY.md)** - Storage and caching debugging implementation
- **[Cross-Component Integration](./CROSS_COMPONENT_INTEGRATION_DEBUGGING_SUMMARY.md)** - Integration debugging implementation
- **[Setup Complete](./SETUP_COMPLETE.md)** - Debugging environment setup summary

## Structure

- `session-manager/` - Debug session management and orchestration
- `contexts/` - Context-specific debugging tools
- `scenarios/` - Automated test scenarios
- `reports/` - Generated debugging reports
- `utils/` - Debugging utilities and helpers
- `monitoring/` - Continuous monitoring and alert systems
- `types/` - TypeScript type definitions

## 🚀 Quick Start for Coding Agents

### Prerequisites

- Chrome DevTools MCP server configured and running
- Extension loaded in Chrome with developer mode enabled
- Access to chrome-devtools MCP tools through Kiro/Amazon Q

### Step-by-Step Error Fixing Process

#### 1. Initial Diagnosis

```typescript
// List all available pages/contexts
const pages = await mcp_chrome_devtools_list_pages();
console.log('Available contexts:', pages);

// Select service worker (typically first in list)
await mcp_chrome_devtools_select_page({ pageIdx: 0 });

// Check for immediate errors
const errors = await mcp_chrome_devtools_list_console_messages({
  types: ['error', 'warn'],
});
```

#### 2. Context-Specific Debugging

**Service Worker Issues:**

```typescript
// Check service worker registration
await mcp_chrome_devtools_evaluate_script({
  function: '() => navigator.serviceWorker.getRegistrations()',
});

// Test storage operations
await mcp_chrome_devtools_evaluate_script({
  function: '() => chrome.storage.local.get(null)',
});

// Verify message handling
await mcp_chrome_devtools_evaluate_script({
  function: '() => chrome.runtime.onMessage.hasListeners()',
});
```

**Content Script Issues:**

```typescript
// Navigate to test page
await mcp_chrome_devtools_navigate_page({ url: 'https://example.com' });

// Check script injection
await mcp_chrome_devtools_evaluate_script({
  function: "() => window.hasOwnProperty('contentScriptLoaded')",
});

// Test DOM interactions
await mcp_chrome_devtools_evaluate_script({
  function: "() => document.querySelectorAll('.language-highlight').length",
});
```

**AI Processing Issues:**

```typescript
// Check Chrome AI availability
await mcp_chrome_devtools_evaluate_script({
  function:
    "() => ({ hasAI: 'ai' in window, hasSummarizer: 'ai' in window && 'summarizer' in window.ai })",
});

// Test AI service creation
await mcp_chrome_devtools_evaluate_script({
  function:
    "async () => { try { const s = await window.ai.summarizer.create(); return 'success'; } catch(e) { return e.message; } }",
});
```

#### 3. Performance Analysis

```typescript
// Check memory usage
await mcp_chrome_devtools_evaluate_script({
  function: '() => performance.memory',
});

// Monitor network requests
const requests = await mcp_chrome_devtools_list_network_requests({
  resourceTypes: ['xhr', 'fetch'],
});

// Check for failed requests
const failedRequests = requests.filter(r => r.status >= 400);
```

#### 4. Fix Validation

```typescript
// After applying fixes, re-run diagnostics
const postFixErrors = await mcp_chrome_devtools_list_console_messages({
  types: ['error'],
});

// Verify functionality
await mcp_chrome_devtools_evaluate_script({
  function: '() => { /* test your fix */ }',
});
```

### Automated Debugging Tools

```typescript
// Run comprehensive system check
node debug/test-comprehensive-mcp-integration.ts

// Test specific functionality
node debug/test-real-content-script-integration.ts
node debug/test-offscreen-debugging-real.ts
node debug/test-ui-component-debugging.ts

// Performance validation
node debug/test-real-debugging-system-optimization.ts
```

## 🔧 LLM Debugging Workflow

### For Coding Agents (Kiro, Amazon Q, Claude, etc.)

#### Phase 1: Context Discovery

1. **List Pages**: `mcp_chrome_devtools_list_pages()` - Find all extension contexts
2. **Identify Target**: Determine which context has the issue (service worker, content script, etc.)
3. **Select Context**: `mcp_chrome_devtools_select_page({pageIdx: N})` - Focus on problematic context

#### Phase 2: Error Analysis

1. **Console Errors**: `mcp_chrome_devtools_list_console_messages({types: ["error", "warn"]})`
2. **Network Issues**: `mcp_chrome_devtools_list_network_requests()` - Check for failed API calls
3. **Script Evaluation**: `mcp_chrome_devtools_evaluate_script()` - Test specific functionality

#### Phase 3: Root Cause Investigation

1. **Storage Issues**: Check `chrome.storage` operations
2. **Message Passing**: Verify `chrome.runtime.sendMessage` functionality
3. **AI Services**: Test Chrome AI API availability and functionality
4. **DOM Issues**: Inspect content script DOM interactions

#### Phase 4: Fix Implementation

1. **Code Changes**: Apply fixes to source files
2. **Live Testing**: Use `mcp_chrome_devtools_evaluate_script()` to test fixes
3. **Validation**: Re-run error checks to confirm resolution

#### Phase 5: Comprehensive Validation

1. **Run Test Suite**: Execute automated debugging tests
2. **Performance Check**: Validate no performance regression
3. **Cross-Context Testing**: Ensure fix doesn't break other contexts

### Common Error Scenarios & Solutions

#### "Service Worker Not Responding"

```typescript
// Diagnose
await mcp_chrome_devtools_evaluate_script({
  function: '() => navigator.serviceWorker.controller?.state',
});

// Fix: Usually requires service worker restart
// Check registration and re-register if needed
```

#### "Content Script Not Injected"

```typescript
// Diagnose
await mcp_chrome_devtools_navigate_page({ url: 'https://test-page.com' });
await mcp_chrome_devtools_evaluate_script({
  function: '() => window.contentScriptLoaded',
});

// Fix: Check manifest.json content_scripts configuration
```

#### "AI API Not Available"

```typescript
// Diagnose
await mcp_chrome_devtools_evaluate_script({
  function: "() => 'ai' in window",
});

// Fix: Enable Chrome AI flags or implement Gemini fallback
```

#### "Storage Quota Exceeded"

```typescript
// Diagnose
await mcp_chrome_devtools_evaluate_script({
  function: '() => navigator.storage.estimate()',
});

// Fix: Implement cache cleanup or data compression
```

## 🎯 Key Features for LLMs

### Real MCP Integration

- **Direct Chrome DevTools Access** - No mock data, real debugging information
- **Live Extension Monitoring** - Real-time error detection and analysis
- **Context Switching** - Debug service worker, content scripts, offscreen docs, and UI
- **Script Execution** - Test fixes directly in extension contexts

### Automated Error Detection

- **Console Message Monitoring** - Automatic error and warning capture
- **Network Request Analysis** - Failed API calls and performance issues
- **Memory Usage Tracking** - Memory leaks and performance degradation
- **Storage Operation Validation** - Chrome storage API issues

### Intelligent Debugging

- **Context-Aware Analysis** - Different debugging strategies per extension context
- **Performance Impact Monitoring** - Ensure debugging doesn't affect extension performance
- **Automated Recovery** - Self-healing mechanisms for common issues
- **Comprehensive Reporting** - Detailed analysis with actionable recommendations

### LLM-Optimized Interface

- **Simple MCP Commands** - Easy-to-use debugging functions
- **Structured Output** - JSON responses perfect for LLM processing
- **Error Pattern Recognition** - Common Chrome extension issues with known solutions
- **Validation Workflows** - Automated testing to confirm fixes work

## Requirements Addressed

- **Requirement 1.1**: Service worker debugging capabilities
- **Requirement 2.1**: Content script monitoring and validation
- **Requirement 3.2**: AI processing debugging and optimization
- **Requirement 4.1**: UI component rendering and interaction debugging
- **Requirement 5.1**: Storage and caching system debugging
- **Requirement 6.1**: Cross-component integration debugging
- **Requirement 7.1**: Automated debugging workflows
- **Requirement 7.3**: Debugging report generation
- **Requirement 7.4**: Comprehensive debugging documentation

## 📚 Getting Started

### For Coding Agents

1. **Start Here**: Use the MCP commands in the "Quick Start for LLMs" section above
2. **Common Issues**: Check the "Common Error Scenarios & Solutions" for typical problems
3. **Advanced Debugging**: Run the automated test scripts for comprehensive analysis

### For Human Developers

- **[Debugging Workflow](./DEBUGGING_WORKFLOW.md)** - Complete step-by-step debugging process
- **[Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)** - Solutions to common issues
- **[Best Practices](./DEBUGGING_BEST_PRACTICES.md)** - Guidelines for effective debugging
- **[Real Debugging Best Practices](./REAL_DEBUGGING_BEST_PRACTICES.md)** - Production-ready debugging strategies

### Quick Reference

- **[MCP Commands Cheatsheet](./MCP_DEBUGGING_COMMANDS_CHEATSHEET.md)** - Essential MCP debugging commands
- **[LLM Quick Reference](./LLM_QUICK_REFERENCE_GUIDE.md)** - Fast debugging patterns for LLMs

## 🤝 Integration Examples

### Kiro Integration

```typescript
// Kiro can directly use these MCP commands:
await mcp_chrome_devtools_list_pages();
await mcp_chrome_devtools_select_page({ pageIdx: 0 });
await mcp_chrome_devtools_list_console_messages();
```

### Amazon Q Integration

```typescript
// Amazon Q can execute debugging workflows:
const debugResult = await runComprehensiveDebug();
const recommendations = await generateFixRecommendations(debugResult);
```

### Claude/GPT Integration

```typescript
// Any LLM with MCP access can use:
const extensionHealth = await checkExtensionHealth();
const performanceMetrics = await analyzePerformance();
const errorAnalysis = await analyzeErrors();
```

## 💬 LLM Prompting Patterns

### For Debugging Chrome Extension Issues

**Pattern 1: Initial Diagnosis**

```
"Debug my Chrome extension using MCP chrome-devtools. Start by listing all pages, then check for console errors in the service worker context."
```

**Pattern 2: Specific Context Issues**

```
"My Chrome extension's content script isn't working on example.com. Use MCP to navigate to the page, check if the content script loaded, and identify any DOM manipulation issues."
```

**Pattern 3: AI Processing Problems**

```
"The Chrome AI summarizer isn't working in my extension. Use MCP to check if Chrome AI APIs are available and test the summarizer creation process."
```

**Pattern 4: Performance Issues**

```
"My extension is using too much memory. Use MCP to check memory usage across all contexts and identify potential memory leaks."
```

**Pattern 5: Storage Problems**

```
"Chrome storage operations are failing. Use MCP to inspect storage quota, test storage operations, and check for corruption."
```

### Effective LLM Instructions

1. **Be Specific**: Mention the exact context (service worker, content script, etc.)
2. **Request MCP Usage**: Explicitly ask to use chrome-devtools MCP functions
3. **Ask for Validation**: Request confirmation that fixes work
4. **Include Context**: Provide error messages or symptoms you're seeing

### Sample Complete Debugging Request

```
"I'm getting 'Service worker not responding' errors in my Chrome extension. Please:

1. Use mcp_chrome_devtools_list_pages() to find the service worker
2. Select the service worker context
3. Check console messages for specific errors
4. Test service worker registration status
5. Verify message passing functionality
6. Provide specific fixes for any issues found
7. Validate the fixes work by re-testing

Focus on the language learning extension's AI processing and storage operations."
```
