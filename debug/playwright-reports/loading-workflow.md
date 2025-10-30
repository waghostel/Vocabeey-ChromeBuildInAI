# Extension Loading Workflow

## Manual Loading (Required)

Since Playwright MCP cannot automate the "Load unpacked" file picker dialog,
the extension must be loaded manually:

1. Open Chrome/Chromium browser
2. Navigate to chrome://extensions
3. Enable "Developer mode" toggle (top right)
4. Click "Load unpacked"
5. Select the dist/ directory: C:\Users\Cheney\Documents\Github\ChromeBuildInAI\dist
6. Copy the Extension ID (e.g., abcdefghijklmnopqrstuvwxyz123456)

## Automated Validation (After Manual Loading)

Once loaded, use Playwright MCP to validate:

### 1. Navigate to Test Page

```
mcp_playwright_browser_navigate({ url: "https://example.com" })
```

### 2. Check Content Script Injection

```
mcp_playwright_browser_evaluate({
  function: "() => ({ hasExtension: typeof window.__LANGUAGE_LEARNING_EXTENSION__ !== 'undefined' })"
})
```

### 3. Capture Console Messages

```
mcp_playwright_browser_console_messages({ onlyErrors: false })
```

### 4. Take Screenshot

```
mcp_playwright_browser_take_screenshot({ fullPage: true })
```
