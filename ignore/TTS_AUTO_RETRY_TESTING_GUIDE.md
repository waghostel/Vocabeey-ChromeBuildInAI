# TTS Auto-Retry Testing Guide

## Quick Start Testing

### 1. Load the Extension

```bash
# Build the extension
pnpm build

# Load in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the 'dist' folder
```

### 2. Enable Debug Mode

```javascript
// Open any article in learning mode
// Open browser console (F12)
// Enable TTS debug mode
enableTTSDebug();
```

### 3. Test Basic Functionality

1. Click any pronounce button (🔊) on vocabulary or sentences
2. Observe:
   - Green retry indicator appears (bottom-left)
   - Text is spoken
   - Indicator disappears on completion
   - Console shows debug log (if debug mode enabled)

### 4. View Statistics

```javascript
// In console
getTTSStats();

// Expected output:
// 📊 TTS Statistics:
// Total Attempts: X
// Successful: Y
// Failed: Z
// Success Rate: XX.X%
// Avg Duration: XXXms
// Avg Attempts: X.X
```

## Detailed Test Scenarios

### Scenario 1: Successful Speech (Happy Path)

**Steps:**

1. Enable debug mode: `enableTTSDebug()`
2. Click pronounce button on any word
3. Wait for speech to complete

**Expected Results:**

- ✅ Green indicator appears immediately
- ✅ Speech plays successfully
- ✅ Indicator disappears after completion
- ✅ Console shows: "✅ 🔊 TTS [tts_xxx]"
- ✅ Statistics show 1 successful attempt

### Scenario 2: Retry on Failure

**Steps:**

1. Enable debug mode
2. Disconnect audio output (unplug headphones/speakers)
3. Click pronounce button
4. Observe retry attempts

**Expected Results:**

- ✅ Green indicator appears
- ✅ Console shows 3 retry attempts
- ✅ Delays between attempts: ~500ms, ~1s, ~2s
- ✅ Final error message: "Speech failed after 3 attempts"
- ✅ Statistics show 1 failed attempt with 3 tries

### Scenario 3: Non-Retryable Error

**Steps:**

1. Test in browser without TTS support (if possible)
2. Or modify code to simulate non-retryable error

**Expected Results:**

- ✅ Immediate failure (no retry)
- ✅ Error message: "Text-to-speech is not supported"
- ✅ Only 1 attempt logged

### Scenario 4: Multiple Pronunciations

**Steps:**

1. Enable debug mode
2. Click pronounce buttons on 5-10 different words
3. View statistics

**Expected Results:**

- ✅ All pronunciations tracked
- ✅ Statistics show total count
- ✅ Average duration calculated
- ✅ Language distribution shown

### Scenario 5: Export Debug Log

**Steps:**

1. Enable debug mode
2. Click several pronounce buttons
3. Run: `exportTTSLog()`

**Expected Results:**

- ✅ JSON file downloads
- ✅ File contains all log entries
- ✅ Statistics included in export
- ✅ Timestamp for each entry

## Console Commands Reference

### Enable/Disable Debug Mode

```javascript
// Enable
enableTTSDebug();
// Output: ✅ TTS debug mode enabled

// Disable
disableTTSDebug();
// Output: ✅ TTS debug mode disabled
```

### View Statistics

```javascript
getTTSStats();
// Returns object with:
// - total: number
// - successful: number
// - failed: number
// - avgDuration: number (ms)
// - avgAttempts: number
// - errorTypes: object
// - languageDistribution: object
// - mostUsedVoices: object
```

### View Debug Log

```javascript
getTTSLog();
// Returns array of log entries
// Each entry contains:
// - timestamp
// - operationId
// - text
// - language
// - attempts
// - success
// - duration
// - voiceUsed
// - rate, pitch, volume
```

### Export Log

```javascript
exportTTSLog();
// Downloads: tts-debug-log-{timestamp}.json
```

### Clear Log

```javascript
clearTTSLog();
// Output: ✅ TTS debug log cleared
```

### Show Help

```javascript
ttsDebugHelp();
// Shows all available commands
```

## Visual Indicators

### TTS Retry Indicator

- **Position:** Bottom-left corner
- **Color:** Green (rgba(76, 175, 80, 0.95))
- **Content:**
  - 🔊 Speaker icon (animated pulse)
  - "Speaking" label
  - Truncated text being spoken
  - Spinner animation

### Error Tooltips

- **Position:** Top-right corner
- **Color:** Dark gray (#333)
- **Duration:** 3 seconds
- **Messages:**
  - "Speech failed after 3 attempts. Check console for details."
  - "Text-to-speech is not supported in your browser"
  - "Speech synthesis failed"

## Performance Testing

### Test 1: Single Pronunciation

```javascript
// Measure time for successful pronunciation
console.time('tts-single');
// Click pronounce button
// Wait for completion
console.timeEnd('tts-single');
// Expected: < 2 seconds
```

### Test 2: Multiple Pronunciations

```javascript
// Click 10 pronounce buttons rapidly
// Check statistics
getTTSStats();
// Verify:
// - All 10 tracked
// - Average duration reasonable
// - No memory leaks
```

### Test 3: Retry Performance

```javascript
// Simulate failure scenario
// Measure total retry time
// Expected: ~3.5 seconds for 3 attempts
// (500ms + 1000ms + 2000ms + processing)
```

## Edge Cases

### Edge Case 1: Very Long Text

**Test:** Pronounce text > 100 characters
**Expected:** Truncated in indicator, full text spoken

### Edge Case 2: Special Characters

**Test:** Pronounce text with emojis, symbols
**Expected:** Handles gracefully or skips special chars

### Edge Case 3: Unsupported Language

**Test:** Request language not available
**Expected:** Falls back to default voice or fails gracefully

### Edge Case 4: Rapid Clicking

**Test:** Click pronounce button multiple times quickly
**Expected:** Stops previous speech, starts new one

### Edge Case 5: Browser Tab Inactive

**Test:** Switch tabs while speech is playing
**Expected:** Speech continues or pauses appropriately

## Debugging Tips

### Issue: No Sound

**Check:**

1. Audio output connected?
2. Browser has audio permission?
3. Volume not muted?
4. Check console for errors

### Issue: Retry Not Working

**Check:**

1. Debug mode enabled?
2. Check console for retry logs
3. Verify error is retryable
4. Check retry config

### Issue: Indicator Not Showing

**Check:**

1. CSS loaded correctly?
2. Check browser console for errors
3. Verify indicator element created
4. Check z-index conflicts

### Issue: Statistics Not Updating

**Check:**

1. Debug mode enabled?
2. Storage permissions granted?
3. Check console for storage errors
4. Try clearing and re-enabling debug mode

## Automated Testing (Future)

### Unit Tests to Create

```typescript
// tests/tts-retry.test.ts

describe('TTS Retry Logic', () => {
  it('should retry on synthesis failures', async () => {
    // Mock to fail twice, succeed third time
    // Verify 3 attempts made
  });

  it('should not retry on non-retryable errors', async () => {
    // Mock non-retryable error
    // Verify only 1 attempt
  });

  it('should use exponential backoff', async () => {
    // Mock failures
    // Verify delays: ~500ms, ~1000ms, ~2000ms
  });

  it('should log debug information', async () => {
    // Enable debug mode
    // Perform TTS operation
    // Verify log entry created
  });
});
```

## Success Criteria

### Minimum Requirements

- ✅ Build succeeds without errors
- ✅ Type checking passes
- ✅ Linting passes
- ✅ Basic pronunciation works
- ✅ Retry indicator appears
- ✅ Debug mode can be enabled

### Full Success

- ✅ All manual test scenarios pass
- ✅ Retry logic works correctly
- ✅ Statistics tracking accurate
- ✅ Export functionality works
- ✅ No console errors
- ✅ Performance acceptable
- ✅ Edge cases handled

## Reporting Issues

If you find issues, report with:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Console logs** (with debug mode enabled)
5. **Debug statistics** (from `getTTSStats()`)
6. **Browser version**
7. **Operating system**

## Next Steps After Testing

1. **Document findings** - Note any issues or improvements
2. **Create automated tests** - Based on manual test scenarios
3. **Adjust retry timing** - If needed based on real-world usage
4. **Gather user feedback** - Deploy to test users
5. **Monitor metrics** - Track success rates in production

---

**Testing Status:** Ready for Manual Testing  
**Automated Tests:** To be created  
**Documentation:** Complete
