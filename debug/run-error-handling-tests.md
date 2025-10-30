# Running Error Handling and Edge Case Tests

This guide explains how to execute the error handling and edge case tests for the Language Learning Chrome Extension.

## Prerequisites

1. **Playwright MCP Server**: Must be running and configured
2. **Extension Loaded**: Chrome extension must be loaded in the browser
3. **Test Page**: `test-page.html` should exist in the project root
4. **MCP Tools**: Access to Playwright MCP tools

## Quick Start

### 1. View All Test Plans

```bash
# Run the test plan generator
node -e "require('./debug/test-error-handling-edge-cases').runAllErrorHandlingTests()"
```

This will display all test scenarios with their steps, purposes, and validation criteria.

### 2. Execute Individual Tests

Each test can be executed by calling its MCP tools in sequence. Below are the execution guides for each test.

## Test Execution Guides

### Test 9.1: No Extractable Content

**Purpose**: Validate graceful handling of pages without article content

**Steps**:

1. Navigate to `about:blank`
2. Wait for content script injection
3. Trigger extraction on empty page
4. Capture console messages
5. Take screenshot of error state
6. Navigate to non-article page (Google)
7. Analyze page structure
8. Attempt extraction on non-article page
9. Verify error messages
10. Capture final screenshot

**Expected Outcomes**:

- No crashes or unhandled exceptions
- User-friendly error messages
- Graceful degradation of functionality

**MCP Tools Used**:

- `mcp_playwright_browser_navigate`
- `mcp_playwright_browser_wait_for`
- `mcp_playwright_browser_evaluate`
- `mcp_playwright_browser_console_messages`
- `mcp_playwright_browser_take_screenshot`

### Test 9.2: AI Service Unavailability

**Purpose**: Validate AI service fallback mechanisms

**Steps**:

1. Navigate to test page
2. Check Chrome AI API availability
3. Simulate Chrome AI unavailability
4. Trigger extraction (should fallback to Gemini)
5. Wait for fallback processing
6. Capture console messages showing fallback
7. Check network requests for Gemini API calls
8. Take screenshot during fallback
9. Simulate all AI services unavailable
10. Trigger extraction with all AI unavailable
11. Verify error messages with recovery guidance
12. Capture error screenshots
13. Restore Chrome AI for subsequent tests

**Expected Outcomes**:

- Automatic fallback to Gemini API
- Clear error messages when all services fail
- Recovery guidance provided to user
- No data loss during fallback

**MCP Tools Used**:

- `mcp_playwright_browser_navigate`
- `mcp_playwright_browser_wait_for`
- `mcp_playwright_browser_evaluate`
- `mcp_playwright_browser_console_messages`
- `mcp_playwright_browser_network_requests`
- `mcp_playwright_browser_take_screenshot`

### Test 9.3: Storage Quota Exceeded

**Purpose**: Validate storage management and cleanup

**Steps**:

1. Navigate to test page
2. Check current storage usage
3. Fill storage with large test data
4. Trigger operation requiring storage
5. Capture console messages about storage issues
6. Take screenshot of quota exceeded state
7. Trigger cache cleanup mechanism
8. Verify storage usage reduced
9. Clean up test data
10. Take screenshot after cleanup

**Expected Outcomes**:

- Quota exceeded error handled gracefully
- Automatic cache cleanup activated
- Storage usage reduced after cleanup
- User notified of storage issues

**MCP Tools Used**:

- `mcp_playwright_browser_navigate`
- `mcp_playwright_browser_wait_for`
- `mcp_playwright_browser_evaluate`
- `mcp_playwright_browser_console_messages`
- `mcp_playwright_browser_take_screenshot`

### Test 9.4: Network Failure

**Purpose**: Validate offline and network failure handling

**Steps**:

1. Navigate to test page
2. Check initial online status
3. Simulate offline mode
4. Wait for offline handlers to activate
5. Attempt extraction while offline
6. Capture console messages about offline handling
7. Take screenshot of offline state
8. Check cached content availability
9. Restore online mode
10. Wait for online handlers to activate
11. Test extraction after coming back online
12. Take screenshot of resumed processing

**Expected Outcomes**:

- Offline mode detected and handled
- Cached content remains available
- Processing resumes when back online
- User informed of offline status

**MCP Tools Used**:

- `mcp_playwright_browser_navigate`
- `mcp_playwright_browser_wait_for`
- `mcp_playwright_browser_evaluate`
- `mcp_playwright_browser_console_messages`
- `mcp_playwright_browser_take_screenshot`

### Test 9.5: Error Message Quality

**Purpose**: Validate error message quality across all scenarios

**Steps**:

1. Navigate to test page
2. Initialize error message capture
3. Trigger various error scenarios
4. Capture all console messages
5. Analyze error message quality
6. Take screenshot of error testing
7. Test error reporting mechanism

**Expected Outcomes**:

- Error messages are clear and user-friendly
- Recovery guidance provided
- No technical jargon in user-facing messages
- Error reporting mechanism works

**MCP Tools Used**:

- `mcp_playwright_browser_navigate`
- `mcp_playwright_browser_wait_for`
- `mcp_playwright_browser_evaluate`
- `mcp_playwright_browser_console_messages`
- `mcp_playwright_browser_take_screenshot`

## Execution Tips

### Sequential Execution

Run tests in order to avoid state conflicts:

1. No Content Test (9.1)
2. AI Service Unavailability (9.2)
3. Storage Quota (9.3)
4. Network Failure (9.4)
5. Error Message Quality (9.5)

### Cleanup Between Tests

After each test:

- Clear browser storage
- Reset any simulated failures
- Close extra tabs
- Clear console logs

### Artifact Collection

For each test, collect:

- Screenshots (saved with descriptive names)
- Console logs (errors and warnings)
- Network requests (for API failures)
- Storage state (before and after)

### Validation Checklist

For each test, verify:

- ✓ No unhandled exceptions
- ✓ User-friendly error messages
- ✓ Recovery guidance provided
- ✓ Fallback mechanisms work
- ✓ State properly restored

## Interpreting Results

### Success Criteria

A test passes if:

- All MCP calls execute successfully
- Validation criteria are met
- No crashes or unhandled exceptions
- Error messages are user-friendly
- Recovery mechanisms work

### Failure Analysis

If a test fails:

1. Review console logs for errors
2. Check screenshots for visual issues
3. Verify MCP tool parameters
4. Ensure extension is properly loaded
5. Check for timing issues (increase wait times)

### Common Issues

**Issue**: Chrome runtime not available

- **Solution**: Ensure extension is loaded and content script injected

**Issue**: Timeout waiting for response

- **Solution**: Increase timeout duration or check service worker

**Issue**: Storage quota not exceeded

- **Solution**: Increase test data size or reduce quota limit

**Issue**: Offline mode not detected

- **Solution**: Verify navigator.onLine override works

## Reporting

### Test Report Structure

For each test, document:

- Test name and scenario
- Execution timestamp
- Duration
- Success/failure status
- Error handling quality metrics
- Screenshots and artifacts
- Recommendations

### Quality Metrics

Track these metrics:

- Error message clarity score
- Recovery guidance presence
- Fallback activation success rate
- User-friendliness rating
- Technical jargon count

## Integration with CI/CD

To automate these tests:

1. Set up Playwright MCP server in CI environment
2. Load extension in headless Chrome
3. Execute test plans sequentially
4. Collect and archive artifacts
5. Generate test reports
6. Fail build if critical errors found

## Next Steps

After completing error handling tests:

1. Review error messages and improve clarity
2. Enhance fallback mechanisms
3. Optimize cache cleanup strategies
4. Improve offline handling
5. Add error analytics tracking

## Related Documentation

- [Error Handling Testing README](./ERROR_HANDLING_TESTING_README.md)
- [Performance Monitoring](./PERFORMANCE_MONITORING_README.md)
- [User Interaction Testing](./USER_INTERACTION_TESTING_README.md)
- [Article Processing Workflow](./ARTICLE_PROCESSING_WORKFLOW_README.md)
