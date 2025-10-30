# Example: Content Script Injection Test Execution

This document provides a concrete example of executing the content script injection tests using Playwright MCP through Kiro.

## Scenario

Test content script injection on the local test page to verify:

1. Content script successfully injects
2. Content extraction works
3. DOM manipulation functions
4. No errors occur

## Step-by-Step Execution

### Step 1: Prepare Environment

```bash
# Build the extension
pnpm build

# Verify test page exists
ls test-page.html
```

### Step 2: Start Playwright Browser

Ask Kiro to start a Playwright browser session:

```
Start a Playwright browser session and navigate to the local test page at:
file:///C:/Users/Cheney/Documents/Github/ChromeBuildInAI/test-page.html
```

### Step 3: Execute Test 4.1 - Navigation and Injection

Ask Kiro to execute the navigation test:

```
Execute Test 4.1 from debug/test-content-script-injection.ts:
1. Navigate to the test page
2. Wait 2 seconds for page load
3. Capture a snapshot of the page
4. Evaluate JavaScript to check for content script markers
5. Capture console messages

Show me the results of each step.
```

**Expected Results:**

```json
{
  "hasContentScript": true,
  "documentReady": "complete",
  "articleFound": true,
  "mainContentFound": true,
  "paragraphCount": 6,
  "url": "file:///C:/Users/Cheney/Documents/Github/ChromeBuildInAI/test-page.html"
}
```

### Step 4: Execute Test 4.2 - Functionality

Ask Kiro to test content script functionality:

```
Execute Test 4.2 from debug/test-content-script-injection.ts:
1. Test content extraction by evaluating the extraction logic
2. Test DOM manipulation by creating a test notification
3. Take a screenshot showing the notification
4. Test message passing to the background script
5. Check for any errors

Show me the extracted content and screenshot.
```

**Expected Results:**

Content extraction:

```json
{
  "success": true,
  "extracted": {
    "title": "The Future of Artificial Intelligence in Language Learning",
    "contentLength": 2500,
    "wordCount": 400,
    "paragraphCount": 6
  }
}
```

DOM manipulation:

```json
{
  "success": true,
  "notificationText": "Test notification from content script",
  "notificationVisible": true
}
```

Screenshot: `content-script-notification.png` showing green notification in top-right

### Step 5: Execute Test 4.3 - Error Detection

Ask Kiro to analyze for errors:

```
Execute Test 4.3 from debug/test-content-script-injection.ts:
1. Capture all console messages
2. Check for CSP violations
3. Verify script execution timing
4. Monitor network requests
5. Generate injection failure analysis

Provide a summary of any issues found.
```

**Expected Results:**

```json
{
  "issues": [],
  "warnings": [],
  "pageAnalysis": {
    "hasArticle": true,
    "hasContent": true,
    "hasExtensionContext": true,
    "isIframe": false,
    "contentLength": 2800
  }
}
```

Console analysis:

```
=== Content Script Error Analysis ===

Total Console Messages: 5
Content Script Errors: 0
CSP Violations: 0
Import Errors: 0
Runtime Errors: 0

✅ No errors detected - content script injection successful!
```

## Complete Test Execution (All at Once)

For a comprehensive test, ask Kiro:

```
Execute all content script injection tests from debug/test-content-script-injection.ts:

1. Run Test 4.1 (Navigation and Injection)
2. Run Test 4.2 (Functionality)
3. Run Test 4.3 (Error Detection)

Generate a comprehensive report with:
- All test results
- Screenshots captured
- Console message analysis
- Any issues or warnings found
- Overall pass/fail status

Save the report to debug/playwright-reports/content-script-test-{timestamp}/
```

## Sample Kiro Conversation

**You:**

```
I want to test content script injection using Playwright MCP.
Execute the tests from debug/test-content-script-injection.ts
on the local test page.
```

**Kiro:**

```
I'll execute the content script injection tests. Let me start by
navigating to the test page and checking for content script injection.

[Executes mcp_playwright_browser_navigate]
[Executes mcp_playwright_browser_wait_for]
[Executes mcp_playwright_browser_snapshot]
[Executes mcp_playwright_browser_evaluate]

Results from Test 4.1:
✅ Page loaded successfully
✅ Article structure detected (6 paragraphs)
✅ Content script markers found
✅ No console errors

Now testing content script functionality...

[Executes content extraction test]
[Executes DOM manipulation test]
[Takes screenshot]

Results from Test 4.2:
✅ Content extraction successful (400 words)
✅ DOM manipulation works (notification created)
✅ Screenshot captured: content-script-notification.png

Now checking for errors...

[Analyzes console messages]
[Checks CSP]
[Verifies timing]

Results from Test 4.3:
✅ No content script errors
✅ No CSP violations
✅ Correct execution timing
✅ All resources loaded successfully

Overall: All tests passed! Content script injection is working correctly.
```

## Troubleshooting Example

If tests fail, Kiro will provide specific guidance:

**Scenario: Extension not loaded**

**Kiro:**

```
❌ Test 4.1 failed: Chrome runtime not available

Issue: Content script cannot access chrome.runtime API
Cause: Extension not loaded in browser

Solution:
1. Build the extension: pnpm build
2. Load extension manually in browser
3. Verify extension appears in chrome://extensions
4. Re-run tests

Would you like me to help you load the extension?
```

**Scenario: Content extraction fails**

**Kiro:**

```
⚠️  Test 4.2 warning: Content extraction returned empty

Issue: No article content found
Cause: Page structure doesn't match expected selectors

Analysis:
- Article element: ❌ Not found
- Main element: ✅ Found
- Content length: 150 characters (below threshold)

Recommendation:
1. Check test page structure
2. Verify article element exists
3. Review content script selectors

Would you like me to inspect the page structure?
```

## Advanced Usage

### Custom Test Page

To test on a different page:

```
Execute content script injection tests on this URL:
https://example.com/article

Use the same test suite from debug/test-content-script-injection.ts
```

### Specific Test Only

To run just one test:

```
Execute only Test 4.2 (functionality testing) from
debug/test-content-script-injection.ts on the test page.
```

### With Extension Loading

To test with extension loading:

```
1. Load the extension from dist/ directory
2. Navigate to test page
3. Execute all content script injection tests
4. Generate comprehensive report
```

## Report Example

After execution, Kiro generates a report like:

```markdown
# Content Script Injection Test Report

**Date:** 2025-10-30
**Test Page:** file:///C:/Users/Cheney/Documents/Github/ChromeBuildInAI/test-page.html
**Duration:** 15 seconds

## Summary

- Total Tests: 3
- Passed: 3
- Failed: 0
- Warnings: 0

## Test Results

### Test 4.1: Navigation and Injection ✅

- Page loaded: ✅
- Content script injected: ✅
- Article detected: ✅
- Console errors: 0

### Test 4.2: Functionality ✅

- Content extraction: ✅ (400 words)
- DOM manipulation: ✅
- Message passing: ✅
- Screenshot: content-script-notification.png

### Test 4.3: Error Detection ✅

- Console messages: 5 (0 errors)
- CSP violations: 0
- Timing: Correct
- Network requests: All successful

## Artifacts

- Screenshot: content-script-notification.png
- Snapshot: page-structure.txt
- Console log: console-messages.json

## Conclusion

All content script injection tests passed successfully.
Content script is functioning correctly with no errors detected.
```

## Next Steps

After successful testing:

1. Proceed to Task 5: Article processing workflow test
2. Test complete user workflows
3. Validate learning interface rendering
4. Test interactive features

## References

- Test Implementation: `debug/test-content-script-injection.ts`
- Execution Guide: `debug/run-content-script-injection-tests.md`
- README: `debug/CONTENT_SCRIPT_TESTING_README.md`
- Completion Summary: `debug/TASK_4_COMPLETION_SUMMARY.md`
