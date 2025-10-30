# User Interaction Testing with Playwright MCP

This document describes the user interaction testing suite for the Language Learning Chrome Extension. The tests validate interactive features including vocabulary cards, sentence mode, TTS functionality, and settings configuration.

## Overview

The user interaction testing suite provides comprehensive validation of all interactive elements in the learning interface. It uses Playwright MCP tools to simulate user actions and verify the extension's response to user interactions.

## Test Coverage

### Test 7.1: Vocabulary Card Interactions

**Purpose**: Validate vocabulary card click interactions and translation display

**Key Features Tested**:

- Vocabulary card identification and selection
- Card expansion on click
- Translation content display
- Context and example sentences visibility
- Multiple card interactions

**MCP Tools Used**:

- `mcp_playwright_browser_snapshot` - Capture UI structure
- `mcp_playwright_browser_evaluate` - Find and verify card elements
- `mcp_playwright_browser_click` - Simulate card clicks
- `mcp_playwright_browser_take_screenshot` - Capture visual states

**Expected Outcomes**:

- Vocabulary cards expand when clicked
- Translations are displayed correctly
- Context and examples are visible
- Multiple cards can be expanded simultaneously

### Test 7.2: Sentence Mode Functionality

**Purpose**: Validate sentence mode toggle and sentence highlighting

**Key Features Tested**:

- Sentence mode button location and activation
- Highlighting mode switching (vocabulary ↔ sentence)
- Sentence card interactions
- Contextual translation display
- Mode persistence

**MCP Tools Used**:

- `mcp_playwright_browser_evaluate` - Locate mode toggle buttons
- `mcp_playwright_browser_click` - Toggle sentence mode
- `mcp_playwright_browser_take_screenshot` - Capture highlighting changes
- `mcp_playwright_browser_wait_for` - Allow highlighting to apply

**Expected Outcomes**:

- Sentence mode button toggles highlighting
- Article switches from vocabulary to sentence highlighting
- Sentence cards display contextual translations
- Mode can be toggled back to vocabulary

### Test 7.3: TTS and Audio Features

**Purpose**: Validate text-to-speech functionality for vocabulary and sentences

**Key Features Tested**:

- TTS browser support detection
- Pronounce button functionality
- TTS indicator display
- Audio playback monitoring
- TTS stop functionality
- Both vocabulary and sentence TTS

**MCP Tools Used**:

- `mcp_playwright_browser_evaluate` - Check TTS support and state
- `mcp_playwright_browser_click` - Trigger TTS playback
- `mcp_playwright_browser_take_screenshot` - Capture TTS indicators
- `mcp_playwright_browser_console_messages` - Monitor TTS events

**Expected Outcomes**:

- TTS buttons trigger speech synthesis
- TTS indicator appears during playback
- Speech can be stopped by user
- Both vocabulary and sentences can be pronounced
- No audio-related errors occur

### Test 7.4: Settings and Configuration

**Purpose**: Validate settings configuration and keyboard navigation

**Key Features Tested**:

- Display mode options (both, learning only, native only)
- Display mode switching
- Settings persistence
- Keyboard shortcuts (r, v, s for mode switching)
- Arrow key navigation between article parts

**MCP Tools Used**:

- `mcp_playwright_browser_evaluate` - Locate settings controls
- `mcp_playwright_browser_click` - Change display modes
- `mcp_playwright_browser_press_key` - Test keyboard shortcuts
- `mcp_playwright_browser_take_screenshot` - Capture configuration changes

**Expected Outcomes**:

- Display modes change vocabulary visibility
- Settings apply immediately
- Keyboard shortcuts switch modes correctly
- Arrow keys navigate between article parts
- No errors during configuration changes

## Usage

### Running Individual Tests

```typescript
import {
  generateVocabularyCardInteractionTest,
  generateSentenceModeTest,
  generateTTSFeaturesTest,
  generateSettingsConfigurationTest,
} from './test-user-interaction';

// Generate test for vocabulary card interactions
const test71 = generateVocabularyCardInteractionTest();
console.log('Test 7.1:', test71.description);
console.log('Steps:', test71.mcpCalls.length);

// Execute MCP calls for the test
for (const call of test71.mcpCalls) {
  console.log(`Step ${call.step}: ${call.purpose}`);
  // Execute MCP tool call here
}
```

### Running Complete Suite

```bash
# Compile TypeScript
pnpm build

# Run test suite
node dist/debug/test-user-interaction.js
```

### Generating Documentation

```typescript
import { generateUserInteractionTestDocumentation } from './test-user-interaction';

const documentation = generateUserInteractionTestDocumentation();
console.log(documentation);
```

## Test Execution Flow

### 1. Vocabulary Card Interaction Flow

```
1. Capture initial state with snapshot
2. Identify vocabulary cards
3. Take screenshot before interaction
4. Click first vocabulary card
5. Wait for expansion animation
6. Capture expanded card screenshot
7. Verify translation and details visible
8. Test multiple card interactions
9. Check for errors
```

### 2. Sentence Mode Flow

```
1. Locate sentence mode toggle button
2. Capture vocabulary mode state
3. Click sentence mode button
4. Wait for highlighting to change
5. Capture sentence mode state
6. Verify sentence highlighting active
7. Test sentence card interactions
8. Switch back to vocabulary mode
9. Verify mode switching works
10. Check for errors
```

### 3. TTS Features Flow

```
1. Check TTS browser support
2. Locate TTS buttons
3. Click vocabulary pronounce button
4. Wait for TTS initialization
5. Verify TTS indicator appears
6. Monitor speech synthesis state
7. Test sentence TTS
8. Test TTS stop functionality
9. Verify TTS cleanup
10. Check for audio errors
```

### 4. Settings Configuration Flow

```
1. Locate settings/display options
2. Switch to vocabulary mode
3. Capture current display mode
4. Change to learning-only mode
5. Verify translations hidden
6. Change back to both languages
7. Test keyboard shortcuts (r, v, s)
8. Test arrow key navigation
9. Verify all shortcuts work
10. Check for configuration errors
```

## Prerequisites

### Extension State

Before running user interaction tests, ensure:

1. **Extension is loaded** in Playwright-controlled browser
2. **Article is processed** and learning interface is open
3. **Vocabulary and sentences** are extracted and available
4. **Learning interface** is fully rendered

### Browser Requirements

- Chromium-based browser with extension support
- Speech synthesis API support for TTS tests
- Keyboard event handling enabled

### Test Data

Tests work best with:

- Articles containing multiple vocabulary words
- Articles with complete sentences
- Processed articles with translations
- Multiple article parts for navigation testing

## Validation Points

### Visual Validation

Screenshots are captured at key points:

- Before and after card clicks
- Mode switching transitions
- TTS indicator states
- Display mode changes
- Keyboard navigation results

### Functional Validation

JavaScript evaluation checks:

- Element visibility and state
- Translation content accuracy
- TTS playback status
- Settings persistence
- Keyboard shortcut functionality

### Error Validation

Console monitoring detects:

- Click handler errors
- TTS initialization failures
- Mode switching issues
- Keyboard event problems
- Configuration errors

## Common Issues and Solutions

### Issue: Vocabulary Cards Not Found

**Cause**: Article not processed or no vocabulary extracted

**Solution**:

1. Ensure article processing completed successfully
2. Check that vocabulary extraction ran
3. Verify learning interface loaded article data
4. Check console for extraction errors

### Issue: TTS Not Working

**Cause**: Browser doesn't support speech synthesis or TTS service not initialized

**Solution**:

1. Verify browser supports `window.speechSynthesis`
2. Check TTS service initialization in console
3. Ensure audio permissions are granted
4. Test with simple text first

### Issue: Keyboard Shortcuts Not Responding

**Cause**: Focus on input element or event listener not attached

**Solution**:

1. Ensure focus is on document body
2. Check that event listeners are attached
3. Verify no input elements have focus
4. Test shortcuts after clicking on article content

### Issue: Display Mode Not Changing

**Cause**: Display option buttons not found or state not updating

**Solution**:

1. Ensure in vocabulary or sentences mode
2. Check that display option buttons exist
3. Verify state management is working
4. Check for JavaScript errors in console

## Integration with Other Tests

User interaction tests build on previous test suites:

1. **Extension Loading** (Task 2): Extension must be loaded first
2. **Content Script Injection** (Task 4): Content scripts must be active
3. **Article Processing** (Task 5): Article must be processed
4. **Visual Debugging** (Task 6): Screenshots enhance validation

## Artifacts Generated

### Screenshots

- `vocabulary-cards-before-click.png` - Initial card state
- `vocabulary-card-expanded.png` - Expanded card with translation
- `vocabulary-multiple-cards-expanded.png` - Multiple cards expanded
- `before-sentence-mode.png` - Vocabulary highlighting
- `sentence-mode-active.png` - Sentence highlighting
- `sentence-card-expanded.png` - Sentence translation
- `tts-active-vocabulary.png` - TTS indicator for vocabulary
- `tts-active-sentence.png` - TTS indicator for sentence
- `display-mode-learning-only.png` - Learning language only
- `display-mode-both.png` - Both languages shown
- `keyboard-navigation-test.png` - After keyboard shortcuts

### Console Logs

- Interaction event logs
- TTS initialization messages
- Mode switching events
- Configuration changes
- Error messages

### Test Results

- Interaction success/failure status
- Element visibility verification
- Translation content validation
- TTS playback confirmation
- Keyboard shortcut validation

## Requirements Mapping

- **Requirement 6.1**: Vocabulary card interactions ✅
- **Requirement 6.2**: Sentence mode functionality ✅
- **Requirement 6.3**: TTS and audio features ✅
- **Requirement 6.4**: Settings configuration ✅
- **Requirement 6.5**: Keyboard navigation ✅

## Next Steps

After completing user interaction tests:

1. **Performance Monitoring** (Task 8): Measure interaction response times
2. **Error Handling** (Task 9): Test edge cases and error scenarios
3. **Automated Scenarios** (Task 10): Create reusable test scenarios
4. **Comprehensive Reports** (Task 11): Generate detailed test reports

## References

- [Playwright MCP Documentation](https://github.com/modelcontextprotocol/servers/tree/main/src/playwright)
- [Learning Interface Implementation](../src/ui/learning-interface.ts)
- [Highlight Manager](../src/ui/highlight-manager.ts)
- [TTS Service](../src/utils/tts-service.ts)
