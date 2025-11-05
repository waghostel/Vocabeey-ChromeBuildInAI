# TTS Rapid Click Cancellation Fix

## Problem

When users clicked rapidly between different vocabulary words before TTS pronunciation finished, the extension reported errors:

```
[RETRY] speak(en) - Attempt 1 failed: [object Object]
[RETRY] speak(en) - All 3 attempts failed (282ms)
TTS error: Error: [object Object]
```

This was the user's intended action (switching between words), but the system treated it as an error.

## Root Cause

When a new word was clicked while another was speaking:

1. The `stop()` method was called to cancel the current speech
2. The Web Speech API triggered a 'canceled' error event
3. This error was caught by the retry mechanism
4. The retry logic reported it as a failure

## Solution Implemented

### 1. Added Cancellation State Tracking

- Added `isCancelling` flag to `TTSService` class to track intentional cancellations
- This flag distinguishes between user-initiated cancellations and real errors

### 2. Modified `speakOnce()` Method

- Set `isCancelling = true` before calling `stop()`
- Added 50ms delay to ensure cancellation completes cleanly
- Reset `isCancelling = false` after cancellation

### 3. Enhanced Error Handler

- Modified `utterance.onerror` to check `isCancelling` flag
- If cancellation is intentional, resolve the promise silently instead of rejecting
- Added multiple checks throughout the promise lifecycle to handle cancellation at any point

### 4. Improved `stop()` Method

- Wrapped `synthesis.cancel()` in try-catch to silently ignore cancellation errors
- Prevents errors when there's nothing to cancel

### 5. Added Promise Resolution Guards

- Added `isResolved` flag to prevent double resolution/rejection
- Checks for cancellation state at multiple points in the promise lifecycle

## Files Modified

- `src/utils/tts-service.ts` - Core TTS service with cancellation handling

## Expected Behavior

- Users can now click rapidly between vocabulary words without seeing error messages
- Speech switches immediately to the new word
- Only genuine TTS failures (network issues, API problems) trigger error reporting
- Smooth user experience with immediate word switching

## Testing

Created `tests/tts-cancellation.test.ts` to verify:

- Rapid switching between two words doesn't throw errors
- Multiple rapid cancellations are handled gracefully
