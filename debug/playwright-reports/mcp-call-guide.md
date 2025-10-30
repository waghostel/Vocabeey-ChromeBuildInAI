# Playwright MCP Call Guide for Extension Validation

**Extension ID:** ckehhllajbfpeoejdjifemgbidefoaka

## Step 1: Navigate to Test Page

**Tool:** `mcp_playwright_browser_navigate`

**Parameters:**

```json
{
  "url": "https://example.com"
}
```

**Purpose:** Load a page where content script should inject

## Step 2: Capture Page Snapshot

**Tool:** `mcp_playwright_browser_snapshot`

**Parameters:**

```json
{}
```

**Purpose:** Get accessibility tree for structure verification

## Step 3: Check Content Script

**Tool:** `mcp_playwright_browser_evaluate`

**Parameters:**

```json
{
  "function": "() => ({\n              hasExtension: typeof window.__LANGUAGE_LEARNING_EXTENSION__ !== 'undefined',\n              hasChromeRuntime: typeof chrome !== 'undefined',\n              documentReady: document.readyState\n            })"
}
```

**Purpose:** Verify content script successfully injected

## Step 4: Capture All Console Messages

**Tool:** `mcp_playwright_browser_console_messages`

**Parameters:**

```json
{
  "onlyErrors": false
}
```

**Purpose:** Get all console logs for analysis

## Step 5: Capture Error Messages

**Tool:** `mcp_playwright_browser_console_messages`

**Parameters:**

```json
{
  "onlyErrors": true
}
```

**Purpose:** Get filtered error messages

## Step 6: Take Screenshot

**Tool:** `mcp_playwright_browser_take_screenshot`

**Parameters:**

```json
{
  "fullPage": true,
  "type": "png"
}
```

**Purpose:** Capture visual state for debugging

## Step 7: Check Network Requests

**Tool:** `mcp_playwright_browser_network_requests`

**Parameters:**

```json
{}
```

**Purpose:** Identify failed requests or API errors

## Step 8: Navigate to UI Page

**Tool:** `mcp_playwright_browser_navigate`

**Parameters:**

```json
{
  "url": "chrome-extension://ckehhllajbfpeoejdjifemgbidefoaka/ui/learning.html"
}
```

**Purpose:** Test UI page accessibility

## Step 9: Capture UI Console Messages

**Tool:** `mcp_playwright_browser_console_messages`

**Parameters:**

```json
{
  "onlyErrors": true
}
```

**Purpose:** Check for UI page errors

## Step 10: Take UI Screenshot

**Tool:** `mcp_playwright_browser_take_screenshot`

**Parameters:**

```json
{
  "type": "png"
}
```

**Purpose:** Capture UI page state
