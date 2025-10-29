# Quick Debug Reference Card

## 🚨 Emergency Quick Fixes

### Extension Won't Load

```typescript
// 1. Check if extension is loaded
const pages = await mcp_chrome_devtools_list_pages();
// 2. If empty, reload extension
await chrome.runtime.reload();
```

### Content Not Extracting

```typescript
// 1. Navigate to test page
await mcp_chrome_devtools_navigate_page({ url: 'https://example.com/article' });
// 2. Check content script injection
const check = await mcp_chrome_devtools_evaluate_script({
  function: '() => !!window.extensionContentScript',
});
// 3. If false, check manifest permissions
```

### AI Not Working

```typescript
// 1. Check AI availability
const aiCheck = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({chromeAI: !!window.ai, gemini: !!window.geminiAPI})',
});
// 2. Switch to fallback if needed
```

### UI Not Loading

```typescript
// 1. Navigate to extension UI
await mcp_chrome_devtools_navigate_page({
  url: 'chrome-extension://[id]/ui/learning-interface.html',
});
// 2. Take screenshot to see state
await mcp_chrome_devtools_take_screenshot({ filename: 'ui-debug.png' });
```

---

## 🔍 Quick Diagnostic Commands

### Get All Errors

```typescript
const errors = await mcp_chrome_devtools_list_console_messages({
  types: ['error'],
  includePreservedMessages: true,
});
```

### Check Extension Status

```typescript
const status = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    serviceWorker: !!chrome.runtime,
    contentScript: !!window.extensionContentScript,
    offscreen: !!window.aiServiceCoordinator,
    storage: !!chrome.storage
  })'
});
```

### Performance Quick Check

```typescript
const perf = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    memory: performance.memory,
    timing: performance.timing,
    navigation: performance.navigation
  })'
});
```

---

## 🛠️ Context-Specific Quick Fixes

### Service Worker Issues

```typescript
// Select service worker
const swPage = pages.find(p => p.type === 'service_worker');
await mcp_chrome_devtools_select_page(swPage.index);

// Check background tasks
const bgTasks = await mcp_chrome_devtools_evaluate_script({
  function: '() => Object.keys(chrome.runtime.getBackgroundPage() || {})',
});
```

### Content Script Issues

```typescript
// Check injection on current page
const injection = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    injected: !!window.extensionContentScript,
    readyState: document.readyState,
    url: window.location.href
  })'
});
```

### Offscreen Issues

```typescript
// Find offscreen document
const offscreenPage = pages.find(p => p.url.includes('offscreen'));
if (offscreenPage) {
  await mcp_chrome_devtools_select_page(offscreenPage.index);

  // Check AI services
  const aiStatus = await mcp_chrome_devtools_evaluate_script({
    function: '() => ({
      chromeAI: !!window.ai,
      coordinator: !!window.aiServiceCoordinator,
      activeServices: window.aiServiceCoordinator?.getActiveServices()
    })'
  });
}
```

---

## 📊 Quick Health Checks

### Memory Check

```typescript
const memoryCheck = await mcp_chrome_devtools_evaluate_script({
  function: '() => {
    const mem = performance.memory;
    return {
      used: mem.usedJSHeapSize,
      total: mem.totalJSHeapSize,
      limit: mem.jsHeapSizeLimit,
      percentage: (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100
    };
  }'
});
```

### Storage Check

```typescript
const storageCheck = await mcp_chrome_devtools_evaluate_script({
  function: '() => new Promise(resolve => {
    chrome.storage.local.get(null, items => {
      const size = JSON.stringify(items).length;
      resolve({
        itemCount: Object.keys(items).length,
        totalSize: size,
        quotaUsed: (size / 5242880) * 100 // 5MB limit
      });
    });
  })'
});
```

### Network Check

```typescript
const networkRequests = await mcp_chrome_devtools_list_network_requests({
  resourceTypes: ['xhr', 'fetch'],
  pageSize: 10,
});

const failedRequests = networkRequests.filter(req => req.status >= 400);
```

---

## 🔧 Common Fix Patterns

### Clear Cache and Retry

```typescript
// Clear extension cache
await mcp_chrome_devtools_evaluate_script({
  function: '() => {
    if (window.cacheManager) {
      return window.cacheManager.clearAllCaches();
    }
    return "Cache manager not available";
  }'
});
```

### Restart Extension Context

```typescript
// Reload extension
await mcp_chrome_devtools_evaluate_script({
  function: '() => chrome.runtime.reload()',
});
```

### Switch AI Service

```typescript
// Switch to fallback AI service
await mcp_chrome_devtools_evaluate_script({
  function: '() => {
    if (window.aiServiceCoordinator) {
      return window.aiServiceCoordinator.switchToFallback();
    }
    return "AI coordinator not available";
  }'
});
```

### Reset User Settings

```typescript
// Reset to default settings
await mcp_chrome_devtools_evaluate_script({
  function: '() => new Promise(resolve => {
    const defaults = {
      language: "en",
      theme: "light",
      difficulty: 5
    };
    chrome.storage.local.set({userSettings: defaults}, () => {
      resolve("Settings reset to defaults");
    });
  })'
});
```

---

## 🎯 Error Type Quick Identification

### Extension Crash Symptoms

- No pages returned from `list_pages()`
- Console shows "Extension context invalidated"
- UI completely unresponsive

### Content Extraction Failure Symptoms

- Empty content returned
- "Cannot read property" errors
- Content script not injected

### AI Processing Error Symptoms

- Timeout errors in offscreen context
- "AI service unavailable" messages
- Fallback chain not activating

### UI Loading Issues Symptoms

- Blank extension pages
- CSS/JS not loading
- Component render errors

### Performance Issues Symptoms

- High memory usage (>100MB)
- Slow response times (>2s)
- Browser freezing/lagging

### Storage Issues Symptoms

- Data not persisting
- "Quota exceeded" errors
- Corrupted data warnings

---

## 📋 Quick Validation Checklist

After any fix, run these quick validations:

```typescript
// 1. Check no new errors
const newErrors = await mcp_chrome_devtools_list_console_messages({
  types: ['error'],
  pageSize: 5
});

// 2. Verify core functionality
const coreCheck = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    extensionLoaded: !!chrome.runtime,
    contentExtraction: !!window.extensionContentScript,
    aiProcessing: !!window.aiServiceCoordinator,
    uiComponents: !!document.querySelector("[data-component]")
  })'
});

// 3. Quick performance check
const perfCheck = await mcp_chrome_devtools_evaluate_script({
  function: '() => ({
    memoryOK: performance.memory.usedJSHeapSize < 100000000, // <100MB
    responseTime: Date.now() // Check if responsive
  })'
});
```

---

## 🆘 When All Else Fails

### Nuclear Options (Use Sparingly)

1. **Full Extension Reload**: `chrome.runtime.reload()`
2. **Clear All Data**: Reset storage and cache completely
3. **Disable/Re-enable**: Through Chrome extensions page
4. **Fresh Install**: Remove and reinstall extension

### Fallback Debugging

1. **Direct DevTools**: Use Chrome DevTools manually
2. **Console Logging**: Add console.log statements
3. **Alert Debugging**: Use alert() for critical points
4. **External Tools**: Use external debugging utilities

### Get Help

1. **Check Logs**: Review all console messages
2. **Document Issue**: Save error messages and steps
3. **Reproduce**: Ensure issue is reproducible
4. **Report**: Provide detailed error report

---

## 💡 Pro Tips

- **Always start with `list_pages()`** to see available contexts
- **Take snapshots** before making changes for comparison
- **Check console messages first** - they often contain the answer
- **Use evaluate_script** to check internal state
- **Clean up debugging sessions** when done
- **Document successful fixes** for future reference

Remember: Most issues can be resolved by following the systematic approach in the main LLM Error Fixing Guide. Use this quick reference for common scenarios and emergency fixes.
