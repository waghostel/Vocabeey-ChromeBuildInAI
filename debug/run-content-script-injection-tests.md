# Content Script Injection Testing - Execution Guide

This guide provides step-by-step instructions for executing content script injection tests using Playwright MCP.

## Prerequisites

1. ✅ Extension built in `dist/` directory (`pnpm build`)
2. ✅ Playwright MCP server configured in `mcp-config.json`
3. ✅ Test page available at `test-page.html`
4. ✅ Kiro agent with MCP access

## Test Execution Steps

### Phase 1: Setup and Extension Loading

Before testing content script injection, ensure the extension is loaded:

```bash
# Build the extension
pnpm build

# Verify dist/ directory exists
ls dist/
```

### Phase 2: Test 4.1 - Navigation and Injection Verification

**Objective:** Navigate to test page and verify content script injection

#### Step 1: Navigate to Test Page

Use Playwright MCP to navigate to the local test page:

**MCP Call:**

```
Tool: mcp_playwright_browser_navigate
Parameters: {
  "url": "file:///[ABSOLUTE_PATH]/test-page.html"
}
```

Replace `[ABSOLUTE_PATH]` with your workspace path.

#### Step 2: Wait for Page Load

Allow time for page load and content script injection:

**MCP Call:**

```
Tool: mcp_playwright_browser_wait_for
Parameters: {
  "time": 2
}
```

#### Step 3: Capture Page Snapshot

Capture the accessibility tree to analyze page structure:

**MCP Call:**

```
Tool: mcp_playwright_browser_snapshot
Parameters: {}
```

**Expected Output:**

- Article element visible in snapshot
- Page structure shows h1, article, paragraphs
- Any content script injected elements visible

#### Step 4: Check for Content Script Markers

Evaluate JavaScript to check for content script presence:

**MCP Call:**

```
Tool: mcp_playwright_browser_evaluate
Parameters: {
  "function": "() => { return { hasContentScript: typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined', documentReady: document.readyState, articleFound: !!document.querySelector('article'), mainContentFound: !!document.querySelector('.article-content'), paragraphCount: document.querySelectorAll('p').length, hasNotifications: document.querySelectorAll('[style*=\"position: fixed\"]').length > 0, url: window.location.href }; }"
}
```

**Expected Output:**

```json
{
  "hasContentScript": true,
  "documentReady": "complete",
  "articleFound": true,
  "mainContentFound": true,
  "paragraphCount": 6,
  "hasNotifications": false,
  "url": "file:///.../test-page.html"
}
```

#### Step 5: Capture Console Messages

Get all console messages to check for injection logs:

**MCP Call:**

```
Tool: mcp_playwright_browser_console_messages
Parameters: {
  "onlyErrors": false
}
```

**Validation:**

- ✅ No "Failed to load extension" errors
- ✅ No module import errors
- ✅ Content script logs present (if any)

---

### Phase 3: Test 4.2 - Content Script Functionality

**Objective:** Test content extraction, DOM manipulation, and message passing

#### Step 1: Test Content Extraction

Simulate content script extraction logic:

**MCP Call:**

```
Tool: mcp_playwright_browser_evaluate
Parameters: {
  "function": "() => { const article = document.querySelector('article'); if (!article) return { success: false, error: 'No article found' }; const title = document.querySelector('h1')?.textContent || ''; const content = article.textContent || ''; const wordCount = content.split(/\\s+/).filter(w => w.length > 0).length; const paragraphCount = article.querySelectorAll('p').length; return { success: true, extracted: { title: title.trim(), contentLength: content.length, wordCount, paragraphCount, url: window.location.href } }; }"
}
```

**Expected Output:**

```json
{
  "success": true,
  "extracted": {
    "title": "The Future of Artificial Intelligence in Language Learning",
    "contentLength": 2500,
    "wordCount": 400,
    "paragraphCount": 6,
    "url": "file:///.../test-page.html"
  }
}
```

#### Step 2: Test DOM Manipulation

Create a test notification element:

**MCP Call:**

```
Tool: mcp_playwright_browser_evaluate
Parameters: {
  "function": "() => { const notification = document.createElement('div'); notification.id = 'test-notification'; notification.textContent = 'Test notification from content script'; notification.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 12px 20px; background-color: #4CAF50; color: white; border-radius: 4px; z-index: 999999;'; document.body.appendChild(notification); const added = document.getElementById('test-notification'); return { success: !!added, notificationText: added?.textContent || null, notificationVisible: added ? window.getComputedStyle(added).display !== 'none' : false }; }"
}
```

**Expected Output:**

```json
{
  "success": true,
  "notificationText": "Test notification from content script",
  "notificationVisible": true
}
```

#### Step 3: Capture Screenshot

Take screenshot showing the injected notification:

**MCP Call:**

```
Tool: mcp_playwright_browser_take_screenshot
Parameters: {
  "filename": "content-script-notification.png"
}
```

**Validation:**

- ✅ Screenshot saved successfully
- ✅ Green notification visible in top-right corner

#### Step 4: Test Message Passing

Test communication with background script:

**MCP Call:**

```
Tool: mcp_playwright_browser_evaluate
Parameters: {
  "function": "() => { return new Promise((resolve) => { if (typeof chrome === 'undefined' || !chrome.runtime) { resolve({ success: false, error: 'Chrome runtime not available', hasChrome: typeof chrome !== 'undefined', hasRuntime: false }); return; } chrome.runtime.sendMessage({ type: 'TEST_MESSAGE', data: 'ping' }, (response) => { if (chrome.runtime.lastError) { resolve({ success: false, error: chrome.runtime.lastError.message, hasChrome: true, hasRuntime: true }); } else { resolve({ success: true, response: response, hasChrome: true, hasRuntime: true }); } }); setTimeout(() => { resolve({ success: false, error: 'Message timeout', hasChrome: true, hasRuntime: true }); }, 5000); }); }"
}
```

**Expected Output (if extension loaded):**

```json
{
  "success": true,
  "response": { "received": true },
  "hasChrome": true,
  "hasRuntime": true
}
```

**Expected Output (if extension not loaded):**

```json
{
  "success": false,
  "error": "Chrome runtime not available",
  "hasChrome": false,
  "hasRuntime": false
}
```

#### Step 5: Check for Errors

Capture any errors during functionality tests:

**MCP Call:**

```
Tool: mcp_playwright_browser_console_messages
Parameters: {
  "onlyErrors": true
}
```

**Validation:**

- ✅ No errors during DOM manipulation
- ✅ No errors during message passing

#### Step 6: Cleanup

Remove test notification:

**MCP Call:**

```
Tool: mcp_playwright_browser_evaluate
Parameters: {
  "function": "() => { const notification = document.getElementById('test-notification'); if (notification) { notification.remove(); } return { cleaned: true }; }"
}
```

---

### Phase 4: Test 4.3 - Error Detection and Analysis

**Objective:** Detect and analyze content script errors, CSP violations, and timing issues

#### Step 1: Get All Console Messages

Capture comprehensive console log:

**MCP Call:**

```
Tool: mcp_playwright_browser_console_messages
Parameters: {
  "onlyErrors": false
}
```

**Analysis:**

- Count total messages
- Filter by type (error, warning, info, log)
- Categorize errors (content script, CSP, import, runtime)

#### Step 2: Check for CSP Violations

Analyze Content Security Policy:

**MCP Call:**

```
Tool: mcp_playwright_browser_evaluate
Parameters: {
  "function": "() => { const metaCSP = document.querySelector('meta[http-equiv=\"Content-Security-Policy\"]'); const hasCSP = !!metaCSP; const inlineScripts = document.querySelectorAll('script:not([src])').length; const inlineStyles = document.querySelectorAll('style').length; return { hasCSP, cspContent: metaCSP?.getAttribute('content') || null, inlineScripts, inlineStyles, documentDomain: document.domain, protocol: window.location.protocol }; }"
}
```

**Expected Output:**

```json
{
  "hasCSP": false,
  "cspContent": null,
  "inlineScripts": 0,
  "inlineStyles": 1,
  "documentDomain": "",
  "protocol": "file:"
}
```

#### Step 3: Check Script Execution Timing

Verify content script executed at correct time:

**MCP Call:**

```
Tool: mcp_playwright_browser_evaluate
Parameters: {
  "function": "() => { return { domContentLoaded: document.readyState !== 'loading', readyState: document.readyState, timing: performance.timing ? { navigationStart: performance.timing.navigationStart, domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd, loadEventEnd: performance.timing.loadEventEnd, domInteractive: performance.timing.domInteractive } : null, now: performance.now() }; }"
}
```

**Validation:**

- ✅ `readyState` is "complete"
- ✅ `domContentLoaded` is true
- ✅ Timing metrics available

#### Step 4: Check Network Requests

Verify no failed resource loads:

**MCP Call:**

```
Tool: mcp_playwright_browser_network_requests
Parameters: {}
```

**Validation:**

- ✅ All resources loaded successfully (200 status)
- ✅ No 404 errors for extension files

#### Step 5: Generate Injection Failure Analysis

Comprehensive analysis of potential issues:

**MCP Call:**

```
Tool: mcp_playwright_browser_evaluate
Parameters: {
  "function": "() => { const issues = []; const warnings = []; const hasArticle = !!document.querySelector('article'); const hasContent = document.body.textContent.length > 100; if (!hasArticle) { warnings.push('No <article> element found - content extraction may fail'); } if (!hasContent) { issues.push('Insufficient content on page'); } const hasExtensionContext = typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined'; if (!hasExtensionContext) { issues.push('Chrome extension context not available'); } const hasIframe = window.self !== window.top; if (hasIframe) { warnings.push('Page is in iframe - content script behavior may differ'); } return { issues, warnings, pageAnalysis: { hasArticle, hasContent, hasExtensionContext, isIframe: hasIframe, url: window.location.href, contentLength: document.body.textContent.length } }; }"
}
```

**Expected Output:**

```json
{
  "issues": [],
  "warnings": [],
  "pageAnalysis": {
    "hasArticle": true,
    "hasContent": true,
    "hasExtensionContext": true,
    "isIframe": false,
    "url": "file:///.../test-page.html",
    "contentLength": 2800
  }
}
```

---

## Test Results Interpretation

### Success Criteria

All tests pass if:

1. ✅ **Test 4.1:** Content script injects successfully
   - Page loads without errors
   - Article structure detected
   - Chrome extension context available

2. ✅ **Test 4.2:** Content script functions correctly
   - Content extraction works
   - DOM manipulation successful
   - Message passing functional (if extension loaded)

3. ✅ **Test 4.3:** No critical errors detected
   - No CSP violations
   - Correct execution timing
   - No resource loading failures
   - No injection issues

### Common Issues and Solutions

#### Issue: "Chrome runtime not available"

**Cause:** Extension not loaded or content script not injected

**Solution:**

1. Verify extension is built: `pnpm build`
2. Load extension in browser manually
3. Check manifest.json content_scripts configuration
4. Verify test page URL matches content_scripts.matches pattern

#### Issue: "No article found"

**Cause:** Test page structure incorrect

**Solution:**

1. Verify test-page.html contains `<article>` element
2. Check page loaded correctly
3. Inspect page snapshot for structure

#### Issue: CSP Violations

**Cause:** Content Security Policy blocking content script

**Solution:**

1. Check page CSP headers
2. Verify extension has proper permissions
3. Review manifest.json CSP configuration

#### Issue: Message passing timeout

**Cause:** Background script not responding

**Solution:**

1. Verify service worker is active
2. Check background script message listeners
3. Review service worker console for errors

---

## Automated Test Execution

To run all tests automatically, use the Kiro agent with this prompt:

```
Execute content script injection tests using the test plan in
debug/run-content-script-injection-tests.md. Run all three test phases
(4.1, 4.2, 4.3) and generate a comprehensive report with results.
```

The agent will:

1. Execute all MCP calls in sequence
2. Validate results against expected outputs
3. Capture screenshots and snapshots
4. Generate error analysis
5. Create comprehensive test report

---

## Report Generation

After test execution, generate a report including:

- Test execution timestamp
- Pass/fail status for each test
- Screenshots captured
- Console messages analysis
- Error categorization
- Recommendations for fixes

Save report to: `debug/playwright-reports/content-script-injection-{timestamp}/`

---

## Next Steps

After successful content script injection testing:

1. ✅ Proceed to Task 5: Article processing workflow test
2. ✅ Test complete user workflows
3. ✅ Validate learning interface rendering
4. ✅ Test interactive features

---

## References

- Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
- Design Document: `.kiro/specs/playwright-extension-debugging/design.md`
- Content Script Source: `src/content/content-script.ts`
- Test Page: `test-page.html`
