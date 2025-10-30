# Content Script Injection Testing Suite

This document outlines the complete test suite for content script injection testing.

## Test 4.1: Navigation and Injection Verification

Test page navigation and content script injection verification

### Step 1: Navigate to local test page with article content

**MCP Tool:** `mcp_playwright_browser_navigate`

**Parameters:**

```json
{
  "url": "file://C:/Users/Cheney/Documents/Github/ChromeBuildInAI/test-page.html"
}
```

**Validation:** Page loads successfully without navigation errors

### Step 2: Wait for page load completion and content script injection

**MCP Tool:** `mcp_playwright_browser_wait_for`

**Parameters:**

```json
{
  "time": 2
}
```

**Validation:** Page is fully loaded and content script has time to inject

### Step 3: Capture accessibility tree to analyze page structure

**MCP Tool:** `mcp_playwright_browser_snapshot`

**Parameters:**

```json
{}
```

**Validation:** Snapshot contains article content and any content script markers

### Step 4: Check for content script markers and page structure

**MCP Tool:** `mcp_playwright_browser_evaluate`

**Parameters:**

```json
{
  "function": "() => {\n            // Check for content script injection markers\n            return {\n              hasContentScript: typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined',\n              documentReady: document.readyState,\n              articleFound: !!document.querySelector('article'),\n              mainContentFound: !!document.querySelector('.article-content'),\n              paragraphCount: document.querySelectorAll('p').length,\n              hasNotifications: document.querySelectorAll('[style*=\"position: fixed\"]').length > 0,\n              url: window.location.href\n            };\n          }"
}
```

**Validation:** Content script has injected and page structure is correct

### Step 5: Capture all console messages including content script logs

**MCP Tool:** `mcp_playwright_browser_console_messages`

**Parameters:**

```json
{
  "onlyErrors": false
}
```

**Validation:** No injection errors and content script logs are present

## Test 4.2: Content Script Functionality

Test content script functionality and DOM manipulation

### Step 1: Test content extraction logic (simulating content script behavior)

**MCP Tool:** `mcp_playwright_browser_evaluate`

**Parameters:**

```json
{
  "function": "() => {\n            // Test content extraction function\n            const article = document.querySelector('article');\n            if (!article) return { success: false, error: 'No article found' };\n            \n            const title = document.querySelector('h1')?.textContent || '';\n            const content = article.textContent || '';\n            const wordCount = content.split(/\\s+/).filter(w => w.length > 0).length;\n            const paragraphCount = article.querySelectorAll('p').length;\n            \n            return {\n              success: true,\n              extracted: {\n                title: title.trim(),\n                contentLength: content.length,\n                wordCount,\n                paragraphCount,\n                url: window.location.href\n              }\n            };\n          }"
}
```

**Validation:** Content extraction returns valid article data

### Step 2: Test DOM manipulation capabilities

**MCP Tool:** `mcp_playwright_browser_evaluate`

**Parameters:**

```json
{
  "function": "() => {\n            // Test DOM manipulation - create a test notification\n            const notification = document.createElement('div');\n            notification.id = 'test-notification';\n            notification.textContent = 'Test notification from content script';\n            notification.style.cssText = `\n              position: fixed;\n              top: 20px;\n              right: 20px;\n              padding: 12px 20px;\n              background-color: #4CAF50;\n              color: white;\n              border-radius: 4px;\n              z-index: 999999;\n            `;\n            document.body.appendChild(notification);\n            \n            // Verify it was added\n            const added = document.getElementById('test-notification');\n            return {\n              success: !!added,\n              notificationText: added?.textContent || null,\n              notificationVisible: added ? window.getComputedStyle(added).display !== 'none' : false\n            };\n          }"
}
```

**Validation:** Content script can create and inject DOM elements

### Step 3: Capture screenshot showing injected notification

**MCP Tool:** `mcp_playwright_browser_take_screenshot`

**Parameters:**

```json
{
  "filename": "content-script-notification.png"
}
```

**Validation:** Screenshot shows notification element

### Step 4: Test message passing between content script and service worker

**MCP Tool:** `mcp_playwright_browser_evaluate`

**Parameters:**

```json
{
  "function": "() => {\n            // Test message passing capability\n            return new Promise((resolve) => {\n              if (typeof chrome === 'undefined' || !chrome.runtime) {\n                resolve({ \n                  success: false, \n                  error: 'Chrome runtime not available',\n                  hasChrome: typeof chrome !== 'undefined',\n                  hasRuntime: false\n                });\n                return;\n              }\n              \n              // Attempt to send message to background script\n              chrome.runtime.sendMessage(\n                { type: 'TEST_MESSAGE', data: 'ping' },\n                (response) => {\n                  if (chrome.runtime.lastError) {\n                    resolve({\n                      success: false,\n                      error: chrome.runtime.lastError.message,\n                      hasChrome: true,\n                      hasRuntime: true\n                    });\n                  } else {\n                    resolve({\n                      success: true,\n                      response: response,\n                      hasChrome: true,\n                      hasRuntime: true\n                    });\n                  }\n                }\n              );\n              \n              // Timeout after 5 seconds\n              setTimeout(() => {\n                resolve({\n                  success: false,\n                  error: 'Message timeout',\n                  hasChrome: true,\n                  hasRuntime: true\n                });\n              }, 5000);\n            });\n          }"
}
```

**Validation:** Content script can communicate with background script

### Step 5: Capture any execution errors during functionality tests

**MCP Tool:** `mcp_playwright_browser_console_messages`

**Parameters:**

```json
{
  "onlyErrors": true
}
```

**Validation:** No errors occurred during DOM manipulation and message passing

### Step 6: Clean up test DOM elements

**MCP Tool:** `mcp_playwright_browser_evaluate`

**Parameters:**

```json
{
  "function": "() => {\n            // Clean up test notification\n            const notification = document.getElementById('test-notification');\n            if (notification) {\n              notification.remove();\n            }\n            return { cleaned: true };\n          }"
}
```

**Validation:** Test elements removed successfully

## Test 4.3: Error Detection and Analysis

Detect and analyze content script errors

### Step 1: Get all console messages for comprehensive analysis

**MCP Tool:** `mcp_playwright_browser_console_messages`

**Parameters:**

```json
{
  "onlyErrors": false
}
```

**Validation:** All console messages captured

### Step 2: Check for Content Security Policy violations

**MCP Tool:** `mcp_playwright_browser_evaluate`

**Parameters:**

```json
{
  "function": "() => {\n            // Check for CSP violations\n            const cspViolations = [];\n            \n            // Check if CSP is blocking anything\n            const metaCSP = document.querySelector('meta[http-equiv=\"Content-Security-Policy\"]');\n            const hasCSP = !!metaCSP;\n            \n            // Check for common CSP issues\n            const inlineScripts = document.querySelectorAll('script:not([src])').length;\n            const inlineStyles = document.querySelectorAll('style').length;\n            \n            return {\n              hasCSP,\n              cspContent: metaCSP?.getAttribute('content') || null,\n              inlineScripts,\n              inlineStyles,\n              documentDomain: document.domain,\n              protocol: window.location.protocol\n            };\n          }"
}
```

**Validation:** CSP configuration identified and analyzed

### Step 3: Verify script execution timing and page load events

**MCP Tool:** `mcp_playwright_browser_evaluate`

**Parameters:**

```json
{
  "function": "() => {\n            // Check script execution timing\n            return {\n              domContentLoaded: document.readyState !== 'loading',\n              readyState: document.readyState,\n              timing: performance.timing ? {\n                navigationStart: performance.timing.navigationStart,\n                domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd,\n                loadEventEnd: performance.timing.loadEventEnd,\n                domInteractive: performance.timing.domInteractive\n              } : null,\n              now: performance.now()\n            };\n          }"
}
```

**Validation:** Content script executed at correct time in page lifecycle

### Step 4: Check for failed resource loads that might affect content script

**MCP Tool:** `mcp_playwright_browser_network_requests`

**Parameters:**

```json
{}
```

**Validation:** No critical resource loading failures

### Step 5: Generate comprehensive injection failure analysis

**MCP Tool:** `mcp_playwright_browser_evaluate`

**Parameters:**

```json
{
  "function": "() => {\n            // Generate injection failure analysis\n            const issues = [];\n            const warnings = [];\n            \n            // Check if content script should have injected\n            const hasArticle = !!document.querySelector('article');\n            const hasContent = document.body.textContent.length > 100;\n            \n            if (!hasArticle) {\n              warnings.push('No <article> element found - content extraction may fail');\n            }\n            \n            if (!hasContent) {\n              issues.push('Insufficient content on page');\n            }\n            \n            // Check for extension context\n            const hasExtensionContext = typeof chrome !== 'undefined' && \n                                       typeof chrome.runtime !== 'undefined';\n            \n            if (!hasExtensionContext) {\n              issues.push('Chrome extension context not available');\n            }\n            \n            // Check for common blocking issues\n            const hasIframe = window.self !== window.top;\n            if (hasIframe) {\n              warnings.push('Page is in iframe - content script behavior may differ');\n            }\n            \n            return {\n              issues,\n              warnings,\n              pageAnalysis: {\n                hasArticle,\n                hasContent,\n                hasExtensionContext,\n                isIframe: hasIframe,\n                url: window.location.href,\n                contentLength: document.body.textContent.length\n              }\n            };\n          }"
}
```

**Validation:** All potential injection issues identified

## Running the Tests

These tests should be executed by Kiro agent with Playwright MCP access.
The agent will make the MCP calls in sequence and validate the results.

## Expected Outcomes

- ✅ Content script successfully injects into test page
- ✅ Content extraction logic works correctly
- ✅ DOM manipulation capabilities verified
- ✅ Message passing to background script functional
- ✅ No CSP violations or injection errors
- ✅ Script executes at correct time in page lifecycle
