# Playwright MCP Extension Testing Guide

This guide provides step-by-step instructions for using Playwright MCP to load and validate the Language Learning Chrome Extension.

## Prerequisites

1. ✅ Playwright MCP server configured in `mcp-config.json`
2. ✅ Extension built in `dist/` directory (run `pnpm build`)
3. ✅ Kiro agent with MCP tool access

## Important Note: Extension Loading Limitation

**Chrome extensions cannot be loaded through the chrome://extensions UI via Playwright MCP** because:

- File picker dialogs require native file system access
- Chrome's extension loading is restricted for security
- The "Load unpacked" button triggers a native file dialog that MCP cannot control

### Alternative Approach: Pre-loaded Extension

The recommended approach is to launch Chromium with the extension pre-loaded using launch arguments. However, this requires direct Playwright API access, which is not available through the current MCP server.

**Workaround:** We can still validate the extension by:

1. Manually loading the extension in Chrome
2. Using Playwright MCP to test the loaded extension
3. Verifying contexts and capturing errors

## Manual Extension Loading Steps

1. Open Chrome/Chromium browser
2. Navigate to `chrome://extensions`
3. Enable "Developer mode" toggle (top right)
4. Click "Load unpacked"
5. Select the `dist/` directory
6. Note the Extension ID (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

## Automated Testing with Playwright MCP

Once the extension is manually loaded, use these MCP calls to validate it:

### Step 1: Navigate to Test Page

```typescript
// MCP Call: mcp_playwright_browser_navigate
{
  url: 'https://example.com';
}
```

**Purpose:** Load a test page where content script should inject

### Step 2: Capture Page Snapshot

```typescript
// MCP Call: mcp_playwright_browser_snapshot
{
}
```

**Purpose:** Capture accessibility tree to verify page structure

### Step 3: Check Content Script Injection

```typescript
// MCP Call: mcp_playwright_browser_evaluate
{
  function: `() => {
    return {
      hasExtension: typeof window.__LANGUAGE_LEARNING_EXTENSION__ !== 'undefined',
      hasChromeRuntime: typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined',
      documentReady: document.readyState,
      timestamp: Date.now()
    };
  }`
}
```

**Purpose:** Verify content script successfully injected

### Step 4: Capture Console Messages

```typescript
// MCP Call: mcp_playwright_browser_console_messages
{
  onlyErrors: false;
}
```

**Purpose:** Get all console logs to identify errors

### Step 5: Filter Error Messages

```typescript
// MCP Call: mcp_playwright_browser_console_messages
{
  onlyErrors: true;
}
```

**Purpose:** Get only error messages for analysis

### Step 6: Check Extension Action

```typescript
// MCP Call: mcp_playwright_browser_click
{
  element: "Extension action button",
  ref: "[uid from snapshot]"
}
```

**Purpose:** Trigger extension action to test workflow

### Step 7: Monitor Network Requests

```typescript
// MCP Call: mcp_playwright_browser_network_requests
{
}
```

**Purpose:** Check for failed requests or API errors

### Step 8: Take Screenshot

```typescript
// MCP Call: mcp_playwright_browser_take_screenshot
{
  fullPage: true,
  type: "png"
}
```

**Purpose:** Capture visual state for debugging

## Validation Checklist

After running the MCP calls, verify:

- [ ] Content script injects without errors
- [ ] No console errors related to module loading
- [ ] No 404 errors for JavaScript files
- [ ] Extension action button is clickable
- [ ] Network requests succeed
- [ ] No path resolution errors

## Common Error Patterns

### 1. Module Import Errors

**Error:** `Failed to resolve module specifier`

**Cause:** Missing `.js` extension in import statements

**Check:** Look for imports like `import { foo } from './bar'` instead of `import { foo } from './bar.js'`

### 2. Path Resolution Errors

**Error:** `404 Not Found` for `.js` files

**Cause:** Incorrect relative paths in compiled code

**Check:** Verify paths are relative to `dist/` root

### 3. Service Worker Errors

**Error:** `Service worker registration failed`

**Cause:** Syntax errors or import failures in service worker

**Check:** Console messages for service worker context

### 4. Content Script Injection Failures

**Error:** Content script doesn't inject

**Cause:** Manifest configuration or script errors

**Check:** Verify `content_scripts` in manifest.json

## Console Error Analysis

When analyzing console messages, categorize by type:

1. **Loading Errors:** Extension failed to load
2. **Import Errors:** Module resolution failures
3. **Path Errors:** File not found (404)
4. **Runtime Errors:** Execution failures

## Example Error Analysis Output

```
=== Console Error Analysis ===

Total Errors: 3
Total Warnings: 1

Errors by Type:
  import: 2
  path: 1

First 5 Errors:
  1. Failed to resolve module specifier "./utils/storage-manager"
  2. Failed to fetch: chrome-extension://abc123/background/service-worker.js
  3. Uncaught TypeError: Cannot read property 'sendMessage' of undefined
```

## Extension Context Verification

### Service Worker Check

Navigate to `chrome://serviceworker-internals` and verify:

- Service worker is registered
- Status is "RUNNING" or "ACTIVATED"
- No errors in console

### Content Script Check

Use `mcp_playwright_browser_evaluate` to check:

```javascript
() => {
  return {
    contentScriptLoaded: !!window.__LANGUAGE_LEARNING_EXTENSION__,
    extensionId: document.documentElement.dataset.extensionId,
  };
};
```

### Offscreen Document Check

Offscreen documents are created dynamically, check via:

```javascript
() => {
  return (
    typeof chrome !== 'undefined' && typeof chrome.offscreen !== 'undefined'
  );
};
```

### UI Pages Check

Navigate to extension UI pages:

- `chrome-extension://[extension-id]/ui/learning.html`
- `chrome-extension://[extension-id]/ui/setup.html`

Verify pages load without errors.

## Reporting

Generate a report with:

1. **Summary:** Extension ID, load status, error count
2. **Contexts:** Service worker, content scripts, offscreen, UI pages
3. **Errors:** Categorized by type with file/line info
4. **Screenshots:** Visual state at key points
5. **Console Logs:** Full console output
6. **Recommendations:** Actionable fixes

## Next Steps

After validation:

1. Review error report
2. Fix identified issues
3. Rebuild extension (`pnpm build`)
4. Re-test with Playwright MCP
5. Verify all contexts work correctly

## Limitations

- Cannot automate extension loading via chrome://extensions
- Requires manual extension installation first
- Limited access to extension internals
- Cannot directly inspect service worker state

## Future Enhancements

- Automated extension loading via Playwright launch args
- Direct service worker inspection
- Performance profiling integration
- Visual regression testing
- Automated fix suggestions
