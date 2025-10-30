# Article Processing Workflow Testing

Quick reference guide for testing the complete article processing workflow using Playwright MCP.

## Overview

This test suite validates the end-to-end article processing workflow:

- Article page navigation and action trigger
- Processing pipeline monitoring across contexts
- Learning interface rendering validation
- Interactive features testing

## Quick Start

### 1. Generate Test Suite

```bash
npx tsx debug/test-article-processing-workflow.ts
```

### 2. Execute Tests via Kiro

Ask Kiro to execute the tests:

```
Execute the article processing workflow tests from
debug/run-article-processing-workflow-tests.md using Playwright MCP.
Test all four phases and generate a report.
```

### 3. Review Results

Check the generated artifacts:

- Screenshots in `debug/playwright-reports/`
- Console logs and network requests
- Test report with findings

## Test Phases

### Phase 1: Navigation & Action Trigger (5.1)

- **Steps:** 9
- **Duration:** ~10 seconds
- **Validates:** Page load, extension context, action trigger

### Phase 2: Processing Pipeline Monitoring (5.2)

- **Steps:** 6
- **Duration:** ~5 seconds
- **Validates:** Service worker, storage, network, performance

### Phase 3: Learning Interface Rendering (5.3)

- **Steps:** 8
- **Duration:** ~8 seconds
- **Validates:** Tab creation, content display, highlighting, UI controls

### Phase 4: Interactive Features (5.4)

- **Steps:** 16
- **Duration:** ~12 seconds
- **Validates:** Vocabulary cards, translation, sentence mode, TTS

**Total:** 39 steps, ~35 seconds

## Success Indicators

✅ All phases complete without errors
✅ Screenshots captured at key points
✅ Article content displays correctly
✅ Vocabulary highlighting present
✅ Interactive features functional
✅ No console errors

## Common Issues

### Extension Not Loaded

**Solution:** Build extension and load in browser first

```bash
pnpm build
# Then load dist/ in chrome://extensions
```

### Learning Interface Not Opening

**Solution:** Check service worker and storage

- Verify service worker is active
- Check storage for article data
- Review console for errors

### Interactive Features Not Working

**Solution:** Verify UI fully rendered

- Wait longer for interface to load
- Check element selectors match UI
- Review snapshot for element references

## Files

- **Implementation:** `debug/test-article-processing-workflow.ts`
- **Execution Guide:** `debug/run-article-processing-workflow-tests.md`
- **Completion Summary:** `debug/TASK_5_COMPLETION_SUMMARY.md`
- **This README:** `debug/ARTICLE_PROCESSING_WORKFLOW_README.md`

## Requirements Coverage

- ✅ Requirement 4.1: Navigate and trigger action
- ✅ Requirement 4.2: Monitor processing pipeline
- ✅ Requirement 4.3: Validate interface rendering
- ✅ Requirement 4.4: Verify content display
- ✅ Requirement 4.5: Test interactive features

## Next Steps

After successful workflow testing:

1. **Task 6:** Build visual debugging system
2. **Task 7:** Implement user interaction testing
3. **Task 8:** Add performance monitoring

## Support

For detailed execution instructions, see:

- `debug/run-article-processing-workflow-tests.md`

For troubleshooting, see:

- Common Issues section in execution guide
- Console logs in test artifacts
- Completion summary for technical details
