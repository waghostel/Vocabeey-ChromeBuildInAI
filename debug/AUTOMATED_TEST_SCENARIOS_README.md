# Automated Test Scenarios

This document describes the automated test scenarios for validating common extension workflows using Playwright MCP.

## Overview

The automated test scenarios provide reusable, comprehensive tests for the most important user workflows in the Language Learning Chrome Extension. Each scenario includes:

- Complete test setup and teardown
- Step-by-step validation
- Screenshot and snapshot capture
- Scenario-specific reports
- Error handling and recovery

## Requirements Coverage

These scenarios fulfill Requirements 9.1-9.5 from the design document:

- **9.1**: Basic article extraction and learning interface display
- **9.2**: Vocabulary highlighting and translation workflow
- **9.3**: Sentence mode and contextual learning
- **9.4**: TTS functionality and audio playback
- **9.5**: Settings configuration and persistence

## Available Scenarios

### 1. Article Extraction Test

**Category:** Content Processing  
**Priority:** 10 (Highest)  
**Timeout:** 45 seconds

Tests the complete article extraction workflow from navigation to learning interface display.

**Steps:**

1. Navigate to article page
2. Wait for page load and content script injection
3. Capture initial page state
4. Verify page content and article detection
5. Trigger article extraction
6. Monitor processing pipeline
7. Check for learning interface tab
8. Switch to learning interface
9. Verify article content display
10. Check vocabulary highlighting
11. Capture accessibility snapshot
12. Verify no console errors

**Validation:**

- Article extracted successfully
- Learning interface displays content
- Vocabulary highlighting present
- No critical errors

### 2. Vocabulary Workflow Test

**Category:** User Interaction  
**Priority:** 9  
**Timeout:** 40 seconds

Tests vocabulary card interactions and translation display.

**Steps:**

1. Capture initial vocabulary state
2. Identify vocabulary cards
3. Click first vocabulary card
4. Wait for card expansion
5. Verify translation display
6. Click second vocabulary card
7. Capture multiple expanded cards
8. Check for interaction errors

**Validation:**

- Vocabulary cards expand correctly
- Translations display accurately
- Multiple cards can be expanded
- No interaction errors

### 3. Sentence Mode Test

**Category:** User Interaction  
**Priority:** 8  
**Timeout:** 35 seconds

Tests sentence mode activation and contextual translation.

**Steps:**

1. Capture vocabulary mode state
2. Locate sentence mode button
3. Click sentence mode button
4. Wait for mode change
5. Verify sentence highlighting
6. Click sentence card
7. Verify contextual translation
8. Switch back to vocabulary mode
9. Verify mode switch

**Validation:**

- Sentence mode activates correctly
- Sentence highlighting applied
- Contextual translations display
- Mode switching works bidirectionally

### 4. TTS Functionality Test

**Category:** Audio Features  
**Priority:** 7  
**Timeout:** 40 seconds

Tests text-to-speech functionality for vocabulary and sentences.

**Steps:**

1. Check TTS browser support
2. Locate TTS buttons
3. Click vocabulary TTS button
4. Wait for TTS initialization
5. Verify TTS is active
6. Check console for TTS messages
7. Wait for TTS completion
8. Test sentence TTS
9. Test TTS stop functionality
10. Check for TTS errors

**Validation:**

- TTS supported in browser
- TTS activates for vocabulary
- TTS activates for sentences
- TTS can be stopped
- No TTS errors

### 5. Settings Configuration Test

**Category:** Configuration  
**Priority:** 6  
**Timeout:** 30 seconds

Tests settings configuration and persistence.

**Steps:**

1. Locate settings controls
2. Capture initial settings state
3. Get current display mode
4. Change display mode
5. Verify mode change
6. Test difficulty level change
7. Verify settings persistence
8. Test keyboard navigation
9. Verify focus management
10. Check for errors

**Validation:**

- Settings controls accessible
- Settings changes apply correctly
- Settings persist to storage
- Keyboard navigation works
- No configuration errors

## Usage

### Running All Scenarios

```bash
ts-node debug/run-workflow-test-scenarios.ts
```

### Running Specific Scenario

```bash
ts-node debug/run-workflow-test-scenarios.ts --scenario "Article Extraction Test"
```

### Running by Category

```bash
ts-node debug/run-workflow-test-scenarios.ts --category "User Interaction"
```

### Listing Available Scenarios

```bash
ts-node debug/run-workflow-test-scenarios.ts --list
```

## Programmatic Usage

```typescript
import {
  executeAllWorkflowScenarios,
  executeWorkflowScenario,
  executeWorkflowScenariosByCategory,
  generateWorkflowTestSummary,
} from './scenarios/workflow-test-scenarios-index';

// Execute all scenarios
const results = await executeAllWorkflowScenarios();
const summary = generateWorkflowTestSummary(results);
console.log(summary);

// Execute specific scenario
const result = await executeWorkflowScenario('Article Extraction Test');

// Execute by category
const categoryResults =
  await executeWorkflowScenariosByCategory('User Interaction');
```

## Test Results

Each test execution generates:

1. **Screenshots**: Visual captures at key workflow points
2. **Snapshots**: Accessibility tree snapshots for structure validation
3. **Console Logs**: Captured console messages for debugging
4. **Network Requests**: Monitored network activity
5. **Scenario Report**: Detailed markdown report with findings and recommendations

Results are saved to: `debug/playwright-reports/`

## Report Structure

```
debug/playwright-reports/
├── workflow-test-suite-{timestamp}.md
├── workflow-scenario-{name}-{timestamp}.md
└── workflow-category-{category}-{timestamp}.md
```

Each report includes:

- Overall results summary
- Results by category
- Detailed test results
- Execution metrics
- Error details (if any)
- Recommendations

## Metrics Captured

Each scenario captures:

- **Execution Time**: Total time to complete scenario
- **Steps Executed**: Number of test steps completed
- **Screenshots**: Number of screenshots captured
- **Snapshots**: Number of accessibility snapshots
- **Interactions**: Number of user interactions simulated
- **Errors**: Any errors encountered during execution

## Integration with Existing Systems

These scenarios integrate with:

- **Visual Debugging System**: For screenshot and snapshot capture
- **Artifact Management System**: For organizing test artifacts
- **Test Scenario Manager**: For scenario registration and execution
- **Debug Session Manager**: For session tracking

## Best Practices

1. **Run scenarios regularly** during development to catch regressions
2. **Review screenshots** to identify visual issues
3. **Check console logs** for runtime errors
4. **Examine snapshots** for structural problems
5. **Update scenarios** when workflows change
6. **Add new scenarios** for new features

## Troubleshooting

### Scenario Fails to Execute

- Check that extension is built (`pnpm build`)
- Verify test-page.html exists
- Ensure Playwright MCP server is configured
- Check console for error messages

### Screenshots Not Captured

- Verify Visual Debugging System is initialized
- Check file permissions in debug/playwright-reports/
- Ensure sufficient disk space

### Timeouts

- Increase scenario timeout if needed
- Check for slow network or AI processing
- Verify extension is not stuck in error state

## Future Enhancements

Potential improvements for automated test scenarios:

1. **Parallel Execution**: Run multiple scenarios concurrently
2. **Visual Regression Testing**: Compare screenshots across runs
3. **Performance Benchmarking**: Track execution time trends
4. **CI/CD Integration**: Automated testing in build pipeline
5. **Custom Assertions**: Domain-specific validation rules
6. **Test Data Management**: Reusable test articles and content
7. **Failure Recovery**: Automatic retry with different strategies
8. **Real-time Monitoring**: Live test execution dashboard

## Related Documentation

- [Visual Debugging System](./VISUAL_DEBUGGING_SYSTEM_README.md)
- [Artifact Management](./ARTIFACT_MANAGEMENT_README.md)
- [User Interaction Testing](./USER_INTERACTION_TESTING_README.md)
- [Article Processing Workflow](./ARTICLE_PROCESSING_WORKFLOW_README.md)
- [Performance Monitoring](./PERFORMANCE_MONITORING_README.md)

## Contributing

When adding new scenarios:

1. Extend `WorkflowTestScenario` base class
2. Implement `setup()`, `execute()`, and `cleanup()` methods
3. Add comprehensive step-by-step validation
4. Capture screenshots at key points
5. Generate scenario-specific report
6. Add to scenario index
7. Update this README

## Support

For issues or questions about automated test scenarios:

1. Check existing documentation
2. Review scenario implementation
3. Examine test execution logs
4. Check Playwright MCP configuration
5. Verify extension functionality manually
