# MCP Chrome DevTools Debugging Commands Cheat Sheet

## 🚀 Essential Setup Commands

### List All Extension Contexts

```typescript
const pages = await mcp_chrome_devtools_list_pages();
console.log(
  'Available contexts:',
  pages.map(p => ({
    index: p.index,
    type: p.type,
    title: p.title,
    url: p.url,
  }))
);
```

### Select Specific Context

```typescript
// Service Worker (usually index 0)
await mcp_chrome_devtools_select_page(0);

// Content Script (find by URL)
const contentPage = pages.find(p => p.url.includes('example.com'));
await mcp_chrome_devtools_select_page(contentPage.index);

// Offscreen Document (find by type)
const offscreenPage = pages.find(p => p.url.includes('offscreen'));
await mcp_chrome_devtools_select_page(offscreenPage.index);

// Extension UI (find by extension ID)
const uiPage = pages.find(p => p.url.includes('chrome-extension://'));
await mcp_chrome_devtools_select_page(uiPage.index);
```

---

## 📊 Information Gathering Commands

### Console Messages

```typescript
// Get all error messages
const errors = await mcp_chrome_devtools_list_console_messages({
  types: ['error'],
  includePreservedMessages: true,
  pageSize: 50,
});

// Get warnings and errors
const issues = await mcp_chrome_devtools_list_console_messages({
  types: ['error', 'warn'],
  includePreservedMessages: true,
});

// Get all console output
const allMessages = await mcp_chrome_devtools_list_console_messages({
  includePreservedMessages: true,
});

// Get specific message details
const messageDetails = await mcp_chrome_devtools_get_console_message({
  msgid: 123,
});
```

### Network Requests

```typescript
// Get all network requests
const allRequests = await mcp_chrome_devtools_list_network_requests();

// Get only XHR/Fetch requests
const apiRequests = await mcp_chrome_devtools_list_network_requests({
  resourceTypes: ['xhr', 'fetch'],
});

// Get failed requests
const failedRequests = await mcp_chrome_devtools_list_network_requests({
  resourceTypes: ['xhr', 'fetch', 'document'],
});

// Get specific request details
const requestDetails = await mcp_chrome_devtools_get_network_request({
  reqid: 456,
});
```

### Page State

```typescript
// Take accessibility snapshot
const snapshot = await mcp_chrome_devtools_take_snapshot();

// Take screenshot
await mcp_chrome_devtools_take_screenshot({
  filename: 'debug-screenshot.png',
  fullPage: true,
});

// Take element screenshot
await mcp_chrome_devtools_take_screenshot({
  element: 'error dialog',
  ref: '.error-dialog',
  filename: 'error-dialog.png',
});
```

---

## 🔍 Code Execution Commands

### Basic Script Execution

```typescript
// Check extension status
const extensionStatus = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    runtime: !!chrome.runtime,
    storage: !!chrome.storage,
    tabs: !!chrome.tabs,
    extensionId: chrome.runtime?.id
  })'
});

// Get page information
const pageInfo = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    url: window.location.href,
    title: document.title,
    readyState: document.readyState,
    userAgent: navigator.userAgent
  })'
});

// Check memory usage
const memoryInfo = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    memory: performance.memory,
    timing: performance.timing,
    navigation: performance.navigation
  })'
});
```

### Extension-Specific Checks

```typescript
// Service Worker checks
const serviceWorkerStatus = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    backgroundPage: !!chrome.runtime.getBackgroundPage,
    onInstalled: !!chrome.runtime.onInstalled,
    onMessage: !!chrome.runtime.onMessage,
    storage: !!chrome.storage.local
  })'
});

// Content Script checks
const contentScriptStatus = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    contentScript: !!window.extensionContentScript,
    contentExtractor: !!window.extensionContentExtractor,
    highlighting: !!window.extensionHighlighting,
    domReady: document.readyState === "complete"
  })'
});

// Offscreen Document checks
const offscreenStatus = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    aiCoordinator: !!window.aiServiceCoordinator,
    chromeAI: !!window.ai,
    geminiAPI: !!window.geminiAPI,
    activeServices: window.aiServiceCoordinator?.getActiveServices()
  })'
});

// UI Component checks
const uiStatus = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    components: document.querySelectorAll("[data-component]").length,
    react: !!window.React,
    stateManager: !!window.extensionStateManager,
    ttsService: !!window.extensionTTS
  })'
});
```

### Storage Operations

```typescript
// Get all storage data
const allStorage = await mcp_chrome_devtools_evaluate_script({
  function: '() => new Promise(resolve => {
    chrome.storage.local.get(null, items => {
      resolve({
        items: items,
        size: JSON.stringify(items).length,
        keys: Object.keys(items)
      });
    });
  })'
});

// Get specific storage keys
const userSettings = await mcp_chrome_devtools_evaluate_script({
  function: '() => new Promise(resolve => {
    chrome.storage.local.get(["userSettings", "cachedArticles"], resolve);
  })'
});

// Check storage quota
const storageQuota = await mcp_chrome_devtools_evaluate_script({
  function: '() => new Promise(resolve => {
    chrome.storage.local.getBytesInUse(null, bytes => {
      resolve({
        bytesUsed: bytes,
        quotaBytes: chrome.storage.local.QUOTA_BYTES,
        percentageUsed: (bytes / chrome.storage.local.QUOTA_BYTES) * 100
      });
    });
  })'
});
```

---

## 🛠️ Interactive Debugging Commands

### Navigation

```typescript
// Navigate to specific page
await mcp_chrome_devtools_navigate_page({
  url: 'https://example-article.com/test-article',
});

// Navigate to extension UI
await mcp_chrome_devtools_navigate_page({
  url: 'chrome-extension://[extension-id]/ui/learning-interface.html',
});

// Go back
await mcp_chrome_devtools_navigate_page_history({
  navigate: 'back',
});

// Go forward
await mcp_chrome_devtools_navigate_page_history({
  navigate: 'forward',
});
```

### User Interactions

```typescript
// Click elements
await mcp_chrome_devtools_click({
  element: 'vocabulary mode button',
  ref: 'button[data-mode="vocabulary"]',
});

// Fill forms
await mcp_chrome_devtools_fill_form({
  elements: [
    {
      name: 'search input',
      type: 'textbox',
      ref: 'input[type="search"]',
      value: 'test query',
    },
  ],
});

// Type text
await mcp_chrome_devtools_type({
  element: 'text input',
  ref: 'input[type="text"]',
  text: 'Hello world',
  submit: true,
});

// Hover over elements
await mcp_chrome_devtools_hover({
  element: 'vocabulary word',
  ref: '.vocabulary-word',
});
```

### Wait Operations

```typescript
// Wait for text to appear
await mcp_chrome_devtools_wait_for({
  text: 'Content loaded successfully',
});

// Wait for specific time
await mcp_chrome_devtools_wait_for({
  time: 5, // seconds
});
```

---

## 🔧 Advanced Debugging Commands

### Performance Monitoring

```typescript
// Start performance trace
await mcp_chrome_devtools_performance_start_trace({
  reload: true,
  autoStop: true,
});

// Stop performance trace
const traceResults = await mcp_chrome_devtools_performance_stop_trace();

// Analyze performance insights
const insights = await mcp_chrome_devtools_performance_analyze_insight({
  insightName: 'LCPBreakdown',
});
```

### Memory Analysis

```typescript
// Get detailed memory info
const detailedMemory = await mcp_chrome_devtools_evaluate_script({
  function: '() => {
    const mem = performance.memory;
    return {
      used: mem.usedJSHeapSize,
      total: mem.totalJSHeapSize,
      limit: mem.jsHeapSizeLimit,
      percentage: (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100,
      available: mem.jsHeapSizeLimit - mem.usedJSHeapSize
    };
  }'
});

// Check for memory leaks
const memoryLeakCheck = await mcp_chrome_devtools_evaluate_script({
  function: '() => {
    // Force garbage collection if available
    if (window.gc) window.gc();

    const before = performance.memory.usedJSHeapSize;

    // Simulate some operations
    const testArray = new Array(10000).fill("test");
    testArray.length = 0;

    setTimeout(() => {
      if (window.gc) window.gc();
      const after = performance.memory.usedJSHeapSize;
      return { before, after, leaked: after > before };
    }, 1000);
  }'
});
```

### Error Injection for Testing

```typescript
// Inject test errors
const errorInjection = await mcp_chrome_devtools_evaluate_script({
  function: '() => {
    // Override fetch to simulate network errors
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      if (Math.random() < 0.1) { // 10% failure rate
        return Promise.reject(new Error("Simulated network error"));
      }
      return originalFetch.apply(this, args);
    };

    return "Error injection enabled";
  }'
});

// Simulate storage quota exceeded
const storageErrorTest = await mcp_chrome_devtools_evaluate_script({
  function: '() => {
    const originalSet = chrome.storage.local.set;
    chrome.storage.local.set = function(items, callback) {
      // Simulate quota exceeded error
      const error = { message: "QUOTA_BYTES quota exceeded" };
      chrome.runtime.lastError = error;
      if (callback) callback();
    };

    return "Storage error simulation enabled";
  }'
});
```

---

## 🎯 Context-Specific Command Sets

### Service Worker Debugging Set

```typescript
// 1. Select service worker
const swPage = pages.find(p => p.type === 'service_worker');
await mcp_chrome_devtools_select_page(swPage.index);

// 2. Check service worker status
const swStatus = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    registration: !!navigator.serviceWorker,
    controller: !!navigator.serviceWorker.controller,
    ready: navigator.serviceWorker.ready.then ? "pending" : "ready"
  })'
});

// 3. Monitor background tasks
const bgTasks = await mcp_chrome_devtools_evaluate_script({
  function: '() => Object.keys(self).filter(key => key.includes("Task") || key.includes("Worker"))'
});

// 4. Check message handlers
const messageHandlers = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    onMessage: !!chrome.runtime.onMessage.hasListeners(),
    onInstalled: !!chrome.runtime.onInstalled.hasListeners(),
    onStartup: !!chrome.runtime.onStartup.hasListeners()
  })'
});
```

### Content Script Debugging Set

```typescript
// 1. Navigate to test page
await mcp_chrome_devtools_navigate_page({
  url: 'https://example-article.com'
});

// 2. Check injection
const injection = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    contentScript: !!window.extensionContentScript,
    readyState: document.readyState,
    scriptsLoaded: document.querySelectorAll("script[src*=\\"extension\\"]").length
  })'
});

// 3. Test content extraction
const extraction = await mcp_chrome_devtools_evaluate_script({
  function: '() => {
    if (window.extensionContentExtractor) {
      return window.extensionContentExtractor.extractContent();
    }
    return "Content extractor not available";
  }'
});

// 4. Test highlighting
await mcp_chrome_devtools_click({
  element: 'vocabulary highlight button',
  ref: 'button[data-mode="vocabulary"]'
});
```

### Offscreen Debugging Set

```typescript
// 1. Find and select offscreen document
const offscreenPage = pages.find(p => p.url.includes('offscreen'));
await mcp_chrome_devtools_select_page(offscreenPage.index);

// 2. Check AI services
const aiServices = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    chromeAI: {
      available: !!window.ai,
      summarizer: !!window.ai?.summarizer,
      translator: !!window.ai?.translator,
      rewriter: !!window.ai?.rewriter
    },
    geminiAPI: !!window.geminiAPI,
    coordinator: !!window.aiServiceCoordinator
  })'
});

// 3. Test AI processing
const aiTest = await mcp_chrome_devtools_evaluate_script({
  function: '() => {
    if (window.aiServiceCoordinator) {
      return window.aiServiceCoordinator.testAllServices();
    }
    return "AI coordinator not available";
  }'
});
```

---

## 🚨 Emergency Commands

### Extension Recovery

```typescript
// Reload extension
await mcp_chrome_devtools_evaluate_script({
  function: '() => chrome.runtime.reload()'
});

// Clear all storage
await mcp_chrome_devtools_evaluate_script({
  function: '() => new Promise(resolve => {
    chrome.storage.local.clear(() => {
      resolve("Storage cleared");
    });
  })'
});

// Reset to defaults
await mcp_chrome_devtools_evaluate_script({
  function: '() => new Promise(resolve => {
    const defaults = {
      userSettings: { language: "en", theme: "light", difficulty: 5 },
      cachedArticles: [],
      learningProgress: { totalWords: 0, knownWords: 0, studiedArticles: 0 }
    };
    chrome.storage.local.set(defaults, () => {
      resolve("Defaults restored");
    });
  })'
});
```

### Debug Mode Activation

```typescript
// Enable debug mode
await mcp_chrome_devtools_evaluate_script({
  function: '() => {
    window.debugMode = true;
    localStorage.setItem("debugMode", "true");

    // Override console methods for better logging
    const originalLog = console.log;
    console.log = function(...args) {
      originalLog.apply(console, ["[DEBUG]", new Date().toISOString(), ...args]);
    };

    return "Debug mode enabled";
  }'
});

// Disable debug mode
await mcp_chrome_devtools_evaluate_script({
  function: '() => {
    window.debugMode = false;
    localStorage.removeItem("debugMode");
    return "Debug mode disabled";
  }'
});
```

---

## 📝 Command Templates

### Custom Function Template

```typescript
const customDebugFunction = await mcp_chrome_devtools_evaluate_script({
  function: `(/* parameters */) => {
    try {
      // Your custom debugging logic here
      const result = /* your code */;
      
      return {
        success: true,
        result: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
    }
  }`,
});
```

### Async Operation Template

```typescript
const asyncOperation = await mcp_chrome_devtools_evaluate_script({
  function: '() => new Promise(async (resolve) => {
    try {
      // Your async operation here
      const result = await someAsyncFunction();
      resolve({ success: true, result });
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  })'
});
```

### Element Interaction Template

```typescript
// Find element and interact
await mcp_chrome_devtools_click({
  element: 'descriptive element name',
  ref: 'css-selector-or-xpath'
});

// With error handling
const clickResult = await mcp_chrome_devtools_evaluate_script({
  function: '() => {
    const element = document.querySelector("your-selector");
    if (element) {
      element.click();
      return "Element clicked successfully";
    }
    return "Element not found";
  }'
});
```

This cheat sheet provides quick access to all essential MCP Chrome DevTools commands for debugging Chrome extensions. Use it alongside the main LLM Error Fixing Guide for comprehensive debugging capabilities.
