# Error Handling and Edge Case Testing

This module provides comprehensive error handling and edge case testing for the Language Learning Chrome Extension using Playwright MCP tools.

## Overview

The error handling test suite validates that the extension gracefully handles various error scenarios and edge cases, ensuring a robust user experience even when things go wrong.

## Test Scenarios

### 9.1 No Extractable Content Test

Tests extension behavior on pages without article content:

- Blank pages (about:blank)
- Non-article pages (search engines, social media)
- Pages with minimal content
- Validates graceful error handling and user-friendly messages

### 9.2 AI Service Unavailability Test

Tests AI service fallback mechanisms:

- Chrome AI API unavailability
- Gemini API fallback activation
- Complete AI service failure scenarios
- Retry logic validation
- Error message quality when all services fail

### 9.3 Storage Quota Exceeded Test

Tests storage management and cleanup:

- Fill storage to approach quota limit
- Trigger operations requiring storage
- Validate quota exceeded error handling
- Test automatic cache cleanup mechanisms
- Verify storage recovery after cleanup

### 9.4 Network Failure Test

Tests offline and network failure handling:

- Simulate offline mode
- Test network request failures
- Verify offline handler activation
- Check cached content availability
- Test recovery when coming back online

### 9.5 Error Message Quality Test

Validates error message quality across all scenarios:

- Review error messages for clarity
- Verify recovery guidance is provided
- Check error message user-friendliness
- Test error reporting mechanisms
- Analyze error message quality metrics

## Test Structure

Each test function returns a test plan with:

- **description**: What the test validates
- **mcpCalls**: Array of MCP tool calls with:
  - **step**: Sequential step number
  - **tool**: MCP tool name to call
  - **parameters**: Tool parameters
  - **purpose**: Why this step is needed
  - **validation**: Expected outcome

## Usage

### Running All Tests

```typescript
import { runAllErrorHandlingTests } from './test-error-handling-edge-cases';

// Display all test plans
await runAllErrorHandlingTests();
```

### Running Individual Tests

```typescript
import {
  generateNoContentTest,
  generateAIServiceUnavailableTest,
  generateStorageQuotaTest,
  generateNetworkFailureTest,
  generateErrorMessageQualityTest,
} from './test-error-handling-edge-cases';

// Get test plan for no content scenario
const noContentTest = generateNoContentTest();
console.log(noContentTest.description);
console.log(`Steps: ${noContentTest.mcpCalls.length}`);

// Execute each MCP call using Playwright MCP tools
for (const call of noContentTest.mcpCalls) {
  console.log(`Step ${call.step}: ${call.tool}`);
  // Call the MCP tool with call.parameters
  // Validate using call.validation criteria
}
```

### Using with MCP Tools

The test plans are designed to be executed with Playwright MCP tools. Each step specifies:

1. **Tool to call**: e.g., `mcp_playwright_browser_navigate`
2. **Parameters**: Exact parameters to pass to the tool
3. **Purpose**: Why this step is needed in the test
4. **Validation**: What to check in the result

Example execution flow:

```typescript
const test = generateNoContentTest();

for (const call of test.mcpCalls) {
  // Execute MCP tool
  const result = await executeMCPTool(call.tool, call.parameters);

  // Validate result
  console.log(`✓ ${call.validation}`);

  // Log purpose for debugging
  console.log(`  Purpose: ${call.purpose}`);
}
```

## Error Handling Validation Criteria

### Graceful Degradation

- Extension continues to function with reduced capabilities
- No crashes or unhandled exceptions
- User can still access cached content

### User-Friendly Messages

- Clear, non-technical language
- Explains what went wrong
- Provides actionable recovery steps
- Avoids technical jargon and stack traces

### Recovery Guidance

- Suggests specific actions user can take
- Provides alternative workflows
- Links to help documentation when appropriate

### Fallback Activation

- Automatic fallback to alternative services
- Transparent fallback process
- Maintains functionality where possible

## Test Results

Each test captures:

- **Screenshots**: Visual state at key points
- **Console logs**: Error messages and warnings
- **Network requests**: API calls and failures
- **Storage state**: Quota usage and cleanup results
- **Error messages**: All error messages for quality analysis

## Requirements Coverage

- **Requirement 8.1**: No extractable content handling
- **Requirement 8.2**: AI service unavailability
- **Requirement 8.3**: Storage quota exceeded
- **Requirement 8.4**: Network failure scenarios
- **Requirement 8.5**: Error message quality

## Best Practices

1. **Run tests in isolation**: Each test should be independent
2. **Clean up after tests**: Remove test data from storage
3. **Restore state**: Reset any simulated failures
4. **Capture artifacts**: Save screenshots and logs for analysis
5. **Validate thoroughly**: Check all validation criteria

## Integration with Other Tests

These error handling tests complement:

- **Performance monitoring** (Task 8): Validates performance under error conditions
- **User interaction testing** (Task 7): Ensures UI remains functional during errors
- **Article processing** (Task 5): Tests error handling in processing pipeline
- **Content script injection** (Task 4): Validates error handling in content scripts

## Troubleshooting

### Test Failures

If tests fail to execute:

1. Verify Playwright MCP server is running
2. Check extension is loaded in browser
3. Ensure test-page.html exists for file:// URLs
4. Verify Chrome extension APIs are available

### Validation Failures

If validation criteria aren't met:

1. Review console logs for error details
2. Check screenshots for visual state
3. Verify error messages are user-friendly
4. Ensure fallback mechanisms are working

### Cleanup Issues

If cleanup fails:

1. Manually clear extension storage
2. Restart browser to reset state
3. Check for storage quota issues
4. Verify cleanup mechanisms are implemented

## Future Enhancements

Potential improvements:

- Automated test execution with CI/CD
- Error message localization testing
- Performance impact of error handling
- Error recovery time measurements
- User experience metrics during errors
