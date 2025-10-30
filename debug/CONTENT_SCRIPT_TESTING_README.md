# Content Script Injection Testing

This directory contains comprehensive testing tools for validating content script injection and functionality using Playwright MCP.

## Overview

Task 4 implements three key testing capabilities:

1. **Test 4.1:** Navigation and injection verification
2. **Test 4.2:** Content script functionality testing
3. **Test 4.3:** Error detection and analysis

## Files

### Core Implementation

- **`test-content-script-injection.ts`** - Main test suite implementation
  - Generates MCP call plans for all three test phases
  - Provides console message analysis utilities
  - Includes error categorization and reporting

### Documentation

- **`run-content-script-injection-tests.md`** - Complete execution guide
  - Step-by-step MCP call instructions
  - Expected outputs and validation criteria
  - Troubleshooting common issues
  - Success criteria and interpretation

- **`CONTENT_SCRIPT_INJECTION_TESTS.md`** - Auto-generated test documentation
  - Detailed test specifications
  - MCP tool parameters
  - Validation requirements

## Quick Start

### 1. Build the Extension

```bash
pnpm build
```

### 2. Generate Test Documentation

```bash
npx tsx debug/test-content-script-injection.ts
```

This generates `CONTENT_SCRIPT_INJECTION_TESTS.md` with complete test specifications.

### 3. Execute Tests via Kiro Agent

Ask Kiro to execute the tests:

```
Execute the content script injection tests from
debug/run-content-script-injection-tests.md using Playwright MCP.
Test all three phases and generate a report.
```

## Test Phases

### Phase 1: Navigation and Injection (Test 4.1)

**Purpose:** Verify content script successfully injects into test page

**Key Checks:**

- ✅ Page loads without errors
- ✅ Article structure detected
- ✅ Chrome extension context available
- ✅ No console errors during injection

**MCP Tools Used:**

- `mcp_playwright_browser_navigate`
- `mcp_playwright_browser_wait_for`
- `mcp_playwright_browser_snapshot`
- `mcp_playwright_browser_evaluate`
- `mcp_playwright_browser_console_messages`

### Phase 2: Functionality Testing (Test 4.2)

**Purpose:** Validate content script can extract content, manipulate DOM, and communicate

**Key Checks:**

- ✅ Content extraction works correctly
- ✅ DOM manipulation successful
- ✅ Message passing to background script functional
- ✅ No runtime errors

**MCP Tools Used:**

- `mcp_playwright_browser_evaluate` (multiple calls)
- `mcp_playwright_browser_take_screenshot`
- `mcp_playwright_browser_console_messages`

### Phase 3: Error Detection (Test 4.3)

**Purpose:** Identify and analyze any content script errors or issues

**Key Checks:**

- ✅ No CSP violations
- ✅ Correct script execution timing
- ✅ No resource loading failures
- ✅ Comprehensive error analysis

**MCP Tools Used:**

- `mcp_playwright_browser_console_messages`
- `mcp_playwright_browser_evaluate`
- `mcp_playwright_browser_network_requests`

## Test Results

### Success Indicators

All tests pass when:

1. Content script injects without errors
2. Content extraction returns valid data
3. DOM manipulation works
4. Message passing succeeds (if extension loaded)
5. No CSP violations
6. No import or path errors

### Common Issues

#### Extension Not Loaded

**Symptoms:**

- "Chrome runtime not available"
- No extension context in evaluate calls

**Solution:**

- Load extension manually in browser
- Verify `dist/` directory exists
- Check manifest.json configuration

#### Content Script Not Injecting

**Symptoms:**

- No content script markers found
- Article detection fails

**Solution:**

- Check content_scripts configuration in manifest
- Verify test page URL matches patterns
- Review console for injection errors

#### Message Passing Fails

**Symptoms:**

- Message timeout errors
- "No response from background script"

**Solution:**

- Verify service worker is active
- Check background script message listeners
- Review service worker console

## Integration with Other Tests

This test suite integrates with:

- **Task 2:** Extension loading and validation
- **Task 3:** Path validation system
- **Task 5:** Article processing workflow (next)

## Requirements Coverage

This implementation satisfies:

- **Requirement 3.1:** Navigate to test page using MCP
- **Requirement 3.2:** Verify content script injection
- **Requirement 3.3:** Test DOM manipulation capabilities
- **Requirement 3.4:** Capture console messages for errors
- **Requirement 3.5:** Detect injection failures

## Next Steps

After successful content script injection testing:

1. Proceed to Task 5: Article processing workflow test
2. Test complete user workflows
3. Validate learning interface rendering
4. Test interactive features

## Troubleshooting

### TypeScript Compilation Errors

If you encounter TypeScript errors:

```bash
# Check for syntax errors
pnpm tsc debug/test-content-script-injection.ts --noEmit

# Run with tsx for execution
npx tsx debug/test-content-script-injection.ts
```

### MCP Connection Issues

If Playwright MCP is not responding:

1. Check `mcp-config.json` configuration
2. Verify Playwright MCP server is enabled
3. Restart Kiro to reconnect MCP servers
4. Check MCP server logs for errors

### Test Page Not Loading

If test page fails to load:

1. Verify `test-page.html` exists in workspace root
2. Use absolute file path in navigate call
3. Check browser console for loading errors
4. Try alternative test URLs (e.g., example.com)

## Additional Resources

- [Playwright MCP Documentation](https://github.com/modelcontextprotocol/servers/tree/main/src/playwright)
- [Chrome Extension Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Design Document](.kiro/specs/playwright-extension-debugging/design.md)
- [Requirements Document](.kiro/specs/playwright-extension-debugging/requirements.md)

## Support

For issues or questions:

1. Review the execution guide: `run-content-script-injection-tests.md`
2. Check the design document for architecture details
3. Examine existing test output in `playwright-reports/`
4. Ask Kiro for assistance with specific test failures
