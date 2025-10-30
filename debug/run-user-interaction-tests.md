# Running User Interaction Tests

This guide explains how to execute the user interaction tests for the Language Learning Chrome Extension using Playwright MCP.

## Prerequisites

1. **Playwright MCP Server Configured**: Ensure `mcp-config.json` has Playwright server entry
2. **Extension Built**: Run `pnpm build` to compile extension to `dist/` directory
3. **Test Page Available**: Ensure `test-page.html` exists with article content
4. **Article Processed**: Extension should have processed an article with vocabulary and sentences

## Quick Start

### Step 1: Compile Test Scripts

```bash
# Compile TypeScript files
pnpm build
```

### Step 2: Run Test Suite

```bash
# Run the complete user interaction test suite
node dist/debug/test-user-interaction.js
```

This will output:

```
🧪 User Interaction Testing Suite

📋 Test 7.1: Test vocabulary card click interactions and translation display
   Steps: 12

📋 Test 7.2: Test sentence mode toggle and sentence highlighting functionality
   Steps: 15

📋 Test 7.3: Test text-to-speech functionality for vocabulary and sentences
   Steps: 17

📋 Test 7.4: Test settings configuration and keyboard navigation
   Steps: 25

✅ User interaction test suite generation complete!

📝 Total test steps: 69
```

## Running Individual Tests

### Test 7.1: Vocabulary Card Interactions

```typescript
import { generateVocabularyCardInteractionTest } from './debug/test-user-interaction';

const test = generateVocabularyCardInteractionTest();

// Execute each MCP call
for (const call of test.mcpCalls) {
  console.log(`\nStep ${call.step}: ${call.purpose}`);
  console.log(`Tool: ${call.tool}`);
  console.log(`Validation: ${call.validation}`);

  // Execute the MCP tool call here
  // await executeMCPTool(call.tool, call.parameters);
}
```

**Expected Results**:

- Vocabulary cards are found and clickable
- Cards expand to show translations
- Multiple cards can be expanded
- No errors during interactions

### Test 7.2: Sentence Mode Functionality

```typescript
import { generateSentenceModeTest } from './debug/test-user-interaction';

const test = generateSentenceModeTest();

// Execute test steps
for (const call of test.mcpCalls) {
  console.log(`\nStep ${call.step}: ${call.purpose}`);
  // Execute MCP call
}
```

**Expected Results**:

- Sentence mode button toggles highlighting
- Article switches from vocabulary to sentence highlighting
- Sentence cards show contextual translations
- Mode can be toggled back to vocabulary

### Test 7.3: TTS and Audio Features

```typescript
import { generateTTSFeaturesTest } from './debug/test-user-interaction';

const test = generateTTSFeaturesTest();

// Execute test steps
for (const call of test.mcpCalls) {
  console.log(`\nStep ${call.step}: ${call.purpose}`);
  // Execute MCP call
}
```

**Expected Results**:

- TTS buttons trigger speech synthesis
- TTS indicator appears during playback
- Speech can be stopped by user
- Both vocabulary and sentences can be pronounced

### Test 7.4: Settings and Configuration

```typescript
import { generateSettingsConfigurationTest } from './debug/test-user-interaction';

const test = generateSettingsConfigurationTest();

// Execute test steps
for (const call of test.mcpCalls) {
  console.log(`\nStep ${call.step}: ${call.purpose}`);
  // Execute MCP call
}
```

**Expected Results**:

- Display modes change vocabulary visibility
- Keyboard shortcuts switch modes correctly
- Arrow keys navigate between article parts
- No errors during configuration changes

## Manual Execution with MCP Tools

### Using Kiro Agent

If you're using Kiro with Playwright MCP configured, you can execute tests interactively:

1. **Start a conversation** with Kiro
2. **Request test execution**: "Run user interaction test 7.1"
3. **Review results**: Kiro will execute MCP calls and show results
4. **Check screenshots**: Review captured screenshots in `debug/playwright-reports/`

### Example MCP Call Sequence

```javascript
// Step 1: Capture initial state
await mcp_playwright_browser_snapshot();

// Step 2: Find vocabulary cards
await mcp_playwright_browser_evaluate({
  function: `() => {
    const vocabCards = document.querySelectorAll('.vocab-card');
    return { totalCards: vocabCards.length };
  }`,
});

// Step 3: Take screenshot
await mcp_playwright_browser_take_screenshot({
  filename: 'vocabulary-cards-before-click.png',
  fullPage: true,
});

// Step 4: Click first card
await mcp_playwright_browser_click({
  element: 'First vocabulary card',
  ref: '.vocab-card',
});

// Step 5: Wait for expansion
await mcp_playwright_browser_wait_for({ time: 1 });

// Step 6: Capture expanded state
await mcp_playwright_browser_take_screenshot({
  filename: 'vocabulary-card-expanded.png',
});
```

## Test Execution Workflow

### Complete Test Flow

```
1. Load Extension
   ↓
2. Navigate to Article Page
   ↓
3. Process Article
   ↓
4. Open Learning Interface
   ↓
5. Run Test 7.1: Vocabulary Cards
   ↓
6. Run Test 7.2: Sentence Mode
   ↓
7. Run Test 7.3: TTS Features
   ↓
8. Run Test 7.4: Settings
   ↓
9. Review Results and Screenshots
```

### Prerequisites for Each Test

**Test 7.1 Prerequisites**:

- Learning interface open
- Article processed with vocabulary
- Vocabulary cards visible

**Test 7.2 Prerequisites**:

- Learning interface open
- Article processed with sentences
- Highlight mode buttons available

**Test 7.3 Prerequisites**:

- Learning interface open
- Vocabulary or sentence cards visible
- Browser supports speech synthesis

**Test 7.4 Prerequisites**:

- Learning interface open
- Display mode options available
- Keyboard event listeners attached

## Validation and Verification

### Visual Validation

Check screenshots for:

- ✅ Vocabulary cards expand correctly
- ✅ Translations are visible
- ✅ Sentence highlighting changes
- ✅ TTS indicators appear
- ✅ Display modes change visibility

### Functional Validation

Verify through console output:

- ✅ Elements found successfully
- ✅ Click events registered
- ✅ State changes applied
- ✅ TTS playback initiated
- ✅ Keyboard shortcuts work

### Error Validation

Check console messages for:

- ❌ No click handler errors
- ❌ No TTS initialization failures
- ❌ No mode switching issues
- ❌ No keyboard event problems

## Troubleshooting

### Issue: Vocabulary Cards Not Found

**Symptoms**:

```
{
  success: false,
  error: 'No vocabulary cards found'
}
```

**Solutions**:

1. Ensure article has been processed
2. Check vocabulary extraction completed
3. Verify learning interface loaded
4. Check console for extraction errors

### Issue: TTS Not Working

**Symptoms**:

```
{
  tts: {
    browserSupported: false
  }
}
```

**Solutions**:

1. Use Chromium-based browser
2. Check speech synthesis API availability
3. Verify TTS service initialized
4. Test with simple text first

### Issue: Keyboard Shortcuts Not Responding

**Symptoms**:

- Keyboard shortcuts don't switch modes
- Arrow keys don't navigate

**Solutions**:

1. Ensure focus on document body
2. Check event listeners attached
3. Verify no input has focus
4. Click on article content first

### Issue: Display Mode Not Changing

**Symptoms**:

- Display options don't change visibility
- Translations still visible in learning-only mode

**Solutions**:

1. Ensure in vocabulary mode
2. Check display option buttons exist
3. Verify state management working
4. Check for JavaScript errors

## Artifacts Location

All test artifacts are saved to:

```
debug/playwright-reports/
  session-YYYYMMDD-HHMMSS/
    screenshots/
      vocabulary-cards-before-click.png
      vocabulary-card-expanded.png
      vocabulary-multiple-cards-expanded.png
      before-sentence-mode.png
      sentence-mode-active.png
      sentence-card-expanded.png
      back-to-vocabulary-mode.png
      tts-active-vocabulary.png
      tts-active-sentence.png
      after-tts-stop.png
      vocabulary-mode-with-display-options.png
      display-mode-learning-only.png
      display-mode-both.png
      keyboard-navigation-test.png
    logs/
      console-logs.json
      test-results.json
```

## Integration with CI/CD

### Automated Test Execution

```yaml
# .github/workflows/user-interaction-tests.yml
name: User Interaction Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Build extension
        run: pnpm build

      - name: Run user interaction tests
        run: node dist/debug/test-user-interaction.js

      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots
          path: debug/playwright-reports/
```

## Next Steps

After running user interaction tests:

1. **Review Screenshots**: Check all captured screenshots for visual issues
2. **Analyze Console Logs**: Look for warnings or errors
3. **Performance Testing**: Measure interaction response times (Task 8)
4. **Error Scenarios**: Test edge cases and error handling (Task 9)
5. **Generate Reports**: Create comprehensive test reports (Task 11)

## References

- [User Interaction Testing README](./USER_INTERACTION_TESTING_README.md)
- [Test Implementation](./test-user-interaction.ts)
- [Playwright MCP Documentation](https://github.com/modelcontextprotocol/servers/tree/main/src/playwright)
- [Learning Interface](../src/ui/learning-interface.ts)
