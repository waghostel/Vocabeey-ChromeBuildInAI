# TTS Auto-Retry Implementation Plan

## Executive Summary

The current TTS (Text-to-Speech) service does **NOT** have auto-retry logic. Unlike the Translation API which now has comprehensive retry mechanisms, the TTS service fails immediately on errors without attempting recovery. This plan outlines how to implement intelligent auto-retry for TTS operations to improve reliability and user experience.

## Current State Analysis

### What TTS Has ✅

- Basic error handling with typed errors
- Voice initialization with timeout (3 seconds)
- Support detection
- Voice selection logic
- Pause/resume/stop controls

### What TTS Lacks ❌

- **No retry logic** - fails immediately on errors
- **No exponential backoff** - doesn't handle transient failures
- **No error classification** - treats all errors the same
- **No debugging infrastructure** - no logging or telemetry
- **No timeout per attempt** - only initialization timeout
- **No user feedback** - no retry indicators
- **No performance monitoring** - no statistics tracking

### Common TTS Failure Scenarios

1. **Voice loading failures** - voices not ready when speak() is called
2. **Synthesis interruptions** - browser interrupts ongoing speech
3. **Network issues** - online voices fail to load
4. **Resource contention** - multiple TTS requests conflict
5. **Browser throttling** - background tabs get throttled
6. **Voice unavailability** - selected voice suddenly unavailable

## Implementation Plan

### Phase 1: Core Retry System (2-3 hours)

#### 1.1 Create TTS-Specific Retry Configuration

**File:** `src/utils/tts-retry-config.ts`

```typescript
export interface TTSRetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
  timeoutMs: number;
  voiceLoadTimeoutMs: number;
}

export const DEFAULT_TTS_RETRY_CONFIG: TTSRetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 500, // Start with 500ms (faster than translation)
  maxDelayMs: 3000, // Max 3 seconds (shorter than translation)
  backoffMultiplier: 2, // Double each time
  retryableErrors: [
    'synthesis_failed',
    'interrupted',
    'network',
    'audio-busy',
    'audio-hardware',
  ],
  timeoutMs: 10000, // 10 second timeout per attempt
  voiceLoadTimeoutMs: 5000, // 5 seconds to load voices
};
```

**Key Differences from Translation Retry:**

- Shorter delays (500ms vs 1s) - TTS should be faster
- Shorter max delay (3s vs 10s) - users expect quick audio
- Different retryable errors - TTS-specific failures
- Voice loading timeout - separate from speech timeout

#### 1.2 Reuse Existing Retry Handler

**Good News:** We can reuse `src/utils/retry-handler.ts` that was created for translation!

The `RetryHandler` class is generic and can work with TTS by:

1. Passing TTS-specific retry config
2. Wrapping TTS operations in retry logic
3. Classifying TTS errors as retryable/non-retryable

**No new retry handler needed** - just configure it for TTS use cases.

#### 1.3 Update TTSService with Retry Logic

**File:** `src/utils/tts-service.ts`

**Changes Required:**

1. **Import retry infrastructure:**

```typescript
import { RetryHandler } from './retry-handler';
import { DEFAULT_TTS_RETRY_CONFIG } from './tts-retry-config';
import { getTTSDebugger } from './tts-debugger';
```

2. **Add retry handler to TTSService class:**

```typescript
class TTSService {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private _currentUtterance: SpeechSynthesisUtterance | null = null;
  private isInitialized = false;
  private retryHandler: RetryHandler; // NEW
  private debugger = getTTSDebugger(); // NEW

  constructor(synthesisProvider?: () => SpeechSynthesis | null) {
    // ... existing code ...
    this.retryHandler = new RetryHandler(DEFAULT_TTS_RETRY_CONFIG); // NEW
  }
}
```

3. **Split speak() into two methods:**

```typescript
// Public method with retry
public async speak(text: string, options: TTSOptions = {}): Promise<void> {
  const operationId = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  // Execute with retry
  const result = await this.retryHandler.executeWithRetry(
    () => this.speakOnce(text, options),
    `speak(${options.language || 'default'})`
  );

  // Log attempt
  this.debugger.logTTSAttempt({
    timestamp: startTime,
    operationId,
    text,
    language: options.language || 'default',
    attempts: result.attempts.length,
    success: result.success,
    error: result.error?.message,
    duration: result.totalDuration,
  });

  if (!result.success) {
    throw result.error || new Error('TTS failed after retries');
  }
}

// Private method for single attempt (no retry)
private async speakOnce(text: string, options: TTSOptions = {}): Promise<void> {
  // ... existing speak() logic moved here ...
  // This is the actual TTS operation without retry
}
```

### Phase 2: Debug Infrastructure (2-3 hours)

#### 2.1 Create TTS Debugger

**File:** `src/utils/tts-debugger.ts`

Similar to `translation-debugger.ts` but TTS-specific:

```typescript
export interface TTSDebugInfo {
  timestamp: number;
  operationId: string;
  text: string;
  language: string;
  attempts: number;
  success: boolean;
  error?: string;
  duration: number;
  voiceUsed?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export class TTSDebugger {
  private debugLog: TTSDebugInfo[] = [];
  private readonly maxLogSize = 200;
  private debugMode = false;

  // Methods:
  // - enableDebugMode()
  // - disableDebugMode()
  // - logTTSAttempt()
  // - getDebugLog()
  // - getDebugStats()
  // - exportDebugLog()
  // - clearDebugLog()
}
```

**Key Metrics to Track:**

- Total TTS attempts
- Success/failure rate
- Average duration
- Most used voices
- Most common errors
- Language distribution

#### 2.2 Add Console Debug Commands

**File:** `src/utils/tts-debug-console.ts`

Browser console commands for TTS debugging:

```typescript
// Enable TTS debug mode
(window as any).enableTTSDebug = async () => { ... };

// Disable TTS debug mode
(window as any).disableTTSDebug = async () => { ... };

// Get TTS statistics
(window as any).getTTSStats = async () => { ... };

// Get TTS log
(window as any).getTTSLog = async () => { ... };

// Export TTS log
(window as any).exportTTSLog = async () => { ... };

// Clear TTS log
(window as any).clearTTSLog = async () => { ... };

// Show help
(window as any).ttsDebugHelp = () => { ... };
```

#### 2.3 Add Service Worker Message Handlers

**File:** `src/background/service-worker.ts`

Add message handlers for TTS debug commands:

- `DEBUG_ENABLE_TTS`
- `DEBUG_DISABLE_TTS`
- `DEBUG_GET_TTS_STATS`
- `DEBUG_GET_TTS_LOG`
- `DEBUG_EXPORT_TTS_LOG`
- `DEBUG_CLEAR_TTS_LOG`

### Phase 3: User Feedback & UI (1-2 hours)

#### 3.1 Add TTS Retry Indicator

**File:** `src/ui/learning-interface.ts` (or `highlight-manager.ts`)

Update the `handlePronounceClick` function to show retry indicator:

```typescript
async function handlePronounceClick(
  button: HTMLElement,
  text: string,
  language: string
): Promise<void> {
  try {
    // Show TTS retry indicator
    showTTSRetryIndicator(text);

    const { speak, isTTSSupported } = await import('../utils/tts-service.js');

    if (!isTTSSupported()) {
      hideTTSRetryIndicator();
      showTooltip('Text-to-speech is not supported in your browser');
      return;
    }

    await speak(text, { language });

    // Hide indicator on success
    hideTTSRetryIndicator();
  } catch (error) {
    hideTTSRetryIndicator();

    // Show user-friendly error
    if (error.message.includes('after retries')) {
      showTooltip('Speech failed after 3 attempts. Check console for details.');
    } else if (error.message.includes('not supported')) {
      showTooltip('Text-to-speech is not supported in your browser');
    } else {
      showTooltip('Speech synthesis failed');
    }
  }
}
```

#### 3.2 TTS Retry Indicator UI

**Visual Design:**

- Position: Bottom-left (different from translation indicator)
- Icon: 🔊 (speaker icon)
- Text: "Speaking: {text}..."
- Attempt counter: "Attempt 1 of 3"
- Spinner animation
- Stop button

**CSS Styles:**

```css
.tts-retry-indicator {
  position: fixed;
  bottom: 20px;
  left: 20px; /* Left side, not right */
  background: rgba(76, 175, 80, 0.95); /* Green, not black */
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}
```

### Phase 4: Error Classification & Handling (1 hour)

#### 4.1 Classify TTS Errors

**Retryable Errors:**

- `synthesis_failed` - temporary synthesis issues
- `interrupted` - speech was interrupted
- `network` - network issues loading online voices
- `audio-busy` - audio device busy
- `audio-hardware` - temporary hardware issues

**Non-Retryable Errors:**

- `not_supported` - browser doesn't support TTS
- `no_voices` - no voices available
- `cancelled` - user cancelled (intentional)
- `invalid_input` - bad parameters

#### 4.2 Enhanced Error Messages

Update error creation to include retry information:

```typescript
private createError(
  type: TTSError['type'],
  message: string,
  originalError?: Error,
  retryable: boolean = false
): TTSError {
  return {
    type,
    message: retryable
      ? `${message} (will retry)`
      : message,
    originalError,
    retryable,
  };
}
```

## Comparison: Translation vs TTS Retry

| Feature              | Translation Retry                     | TTS Retry                                 |
| -------------------- | ------------------------------------- | ----------------------------------------- |
| **Max Attempts**     | 3                                     | 3                                         |
| **Base Delay**       | 1000ms                                | 500ms (faster)                            |
| **Max Delay**        | 10000ms                               | 3000ms (shorter)                          |
| **Timeout**          | 15s per attempt                       | 10s per attempt                           |
| **Jitter**           | ±20%                                  | ±20%                                      |
| **Retryable Errors** | network, timeout, rate_limit          | synthesis_failed, interrupted, audio-busy |
| **Non-Retryable**    | api_unavailable, unsupported_language | not_supported, no_voices, cancelled       |
| **Debug Logging**    | ✅ Yes                                | ✅ Yes (to implement)                     |
| **Console Commands** | ✅ Yes                                | ✅ Yes (to implement)                     |
| **Retry Indicator**  | ✅ Bottom-right, black                | ✅ Bottom-left, green                     |
| **Statistics**       | ✅ Yes                                | ✅ Yes (to implement)                     |

**Why TTS is Faster:**

- Audio feedback should be immediate
- Users expect quick response for pronunciation
- Shorter delays reduce perceived latency
- TTS operations are typically faster than API calls

## Files to Create (4 files)

1. **`src/utils/tts-retry-config.ts`**
   - TTS-specific retry configuration
   - Shorter delays than translation
   - TTS-specific retryable errors

2. **`src/utils/tts-debugger.ts`**
   - TTS debug logging system
   - Statistics tracking
   - Export functionality

3. **`src/utils/tts-debug-console.ts`**
   - Browser console commands
   - Enable/disable debug mode
   - View stats and logs

4. **`TTS_AUTO_RETRY_IMPLEMENTATION.md`**
   - Implementation summary
   - Usage guide
   - Testing checklist

## Files to Modify (4 files)

1. **`src/utils/tts-service.ts`**
   - Add retry handler
   - Split speak() into speak() and speakOnce()
   - Integrate debug logging
   - Add error classification

2. **`src/background/service-worker.ts`**
   - Add TTS debug message handlers
   - Import TTS debugger

3. **`src/ui/learning-interface.ts`** (or `highlight-manager.ts`)
   - Add TTS retry indicator functions
   - Update handlePronounceClick
   - Enhanced error messages

4. **`src/ui/learning-interface.css`**
   - TTS retry indicator styles
   - Bottom-left positioning
   - Green color scheme

## Implementation Timeline

### Week 1: Core Retry (Days 1-2)

- [ ] Create `tts-retry-config.ts`
- [ ] Update `tts-service.ts` with retry logic
- [ ] Test retry behavior manually
- [ ] Verify error classification

### Week 1: Debug Infrastructure (Days 3-4)

- [ ] Create `tts-debugger.ts`
- [ ] Create `tts-debug-console.ts`
- [ ] Add service worker handlers
- [ ] Test debug commands

### Week 2: UI & Polish (Days 1-2)

- [ ] Add TTS retry indicator
- [ ] Update CSS styles
- [ ] Test user experience
- [ ] Write documentation

### Week 2: Testing & Deployment (Day 3)

- [ ] Manual testing checklist
- [ ] Automated tests
- [ ] Performance testing
- [ ] Deploy to production

**Total Estimated Time:** 6-8 hours of development

## Testing Strategy

### Manual Testing Checklist

**Basic Functionality:**

- [ ] Enable TTS debug mode: `enableTTSDebug()`
- [ ] Click pronounce button on vocabulary
- [ ] Verify retry indicator appears
- [ ] Verify speech plays successfully
- [ ] Check console for debug logs

**Retry Scenarios:**

- [ ] Simulate synthesis failure (disconnect audio)
- [ ] Verify 3 retry attempts
- [ ] Check exponential backoff (500ms, 1s, 2s)
- [ ] Verify retry indicator updates attempt count
- [ ] Confirm final error message after all retries fail

**Error Classification:**

- [ ] Test with no voices available
- [ ] Verify immediate failure (no retry)
- [ ] Test with unsupported browser
- [ ] Verify clear error message

**Debug Commands:**

- [ ] `getTTSStats()` - verify statistics
- [ ] `getTTSLog()` - verify log entries
- [ ] `exportTTSLog()` - verify JSON download
- [ ] `clearTTSLog()` - verify log cleared

**Performance:**

- [ ] Measure time for successful first attempt
- [ ] Measure time for 3 failed attempts
- [ ] Verify no memory leaks
- [ ] Check CPU usage during retries

### Automated Tests

**File:** `tests/tts-retry.test.ts`

```typescript
describe('TTS Retry Logic', () => {
  it('should retry on synthesis failures', async () => {
    // Mock to fail twice, succeed third time
    let attempts = 0;
    mockSynthesis.speak.mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('synthesis_failed');
      }
      return Promise.resolve();
    });

    await ttsService.speak('test');
    expect(attempts).toBe(3);
  });

  it('should not retry on non-retryable errors', async () => {
    mockSynthesis.speak.mockRejectedValue(new Error('not_supported'));

    await expect(ttsService.speak('test')).rejects.toThrow('not_supported');
    expect(mockSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  it('should use exponential backoff', async () => {
    const delays: number[] = [];
    const startTime = Date.now();

    mockSynthesis.speak.mockImplementation(() => {
      delays.push(Date.now() - startTime);
      throw new Error('synthesis_failed');
    });

    try {
      await ttsService.speak('test');
    } catch {
      // Expected to fail
    }

    // Check delays: ~500ms, ~1000ms, ~2000ms
    expect(delays[1] - delays[0]).toBeGreaterThan(400);
    expect(delays[2] - delays[1]).toBeGreaterThan(900);
  });
});
```

## Success Metrics

### Before Implementation

- ❌ No retry on TTS failures
- ❌ No debugging information
- ❌ Users see generic errors
- ❌ No visibility into failure reasons
- ❌ Poor reliability for pronunciation

### After Implementation

- ✅ Auto-retry with exponential backoff
- ✅ Comprehensive debug logging
- ✅ User-friendly retry indicators
- ✅ Detailed error classification
- ✅ Console commands for debugging
- ✅ Exportable debug logs
- ✅ TTS statistics tracking

### Expected Improvements

- **Success Rate:** 70% → 90% (retry handles transient failures)
- **User Experience:** Visual feedback during retries
- **Debugging Time:** 20 min → 3 min (with debug logs)
- **Error Resolution:** Faster with detailed logs
- **Pronunciation Reliability:** Significantly improved

## Key Differences from Translation Retry

### 1. **Faster Retry Timing**

- TTS: 500ms, 1s, 2s (total ~3.5s)
- Translation: 1s, 2s, 4s (total ~7s)
- **Reason:** Audio feedback should be immediate

### 2. **Different Error Types**

- TTS: synthesis_failed, interrupted, audio-busy
- Translation: network, timeout, rate_limit
- **Reason:** Different failure modes

### 3. **Visual Indicator Position**

- TTS: Bottom-left, green
- Translation: Bottom-right, black
- **Reason:** Avoid overlap, different visual identity

### 4. **Shorter Timeouts**

- TTS: 10s per attempt
- Translation: 15s per attempt
- **Reason:** TTS operations are faster

### 5. **Voice-Specific Handling**

- TTS: Retry with different voice if available
- Translation: Retry with same language pair
- **Reason:** Voice fallback can improve success rate

## Advanced Features (Future Enhancements)

### 1. Voice Fallback Strategy

If primary voice fails, try alternative voices:

```typescript
private async speakWithFallback(text: string, options: TTSOptions): Promise<void> {
  const voices = await this.getVoicesForLanguage(options.language);

  for (const voice of voices) {
    try {
      return await this.speakOnce(text, { ...options, voice: voice.name });
    } catch (error) {
      console.warn(`Voice ${voice.name} failed, trying next...`);
    }
  }

  throw new Error('All voices failed');
}
```

### 2. Adaptive Retry Strategy

Adjust retry count based on historical success rates:

```typescript
private getAdaptiveRetryCount(language: string): number {
  const stats = this.debugger.getStatsForLanguage(language);

  if (stats.successRate > 0.9) return 2;  // High success, fewer retries
  if (stats.successRate > 0.7) return 3;  // Normal
  return 4;  // Low success, more retries
}
```

### 3. Preload Voices

Load voices proactively to reduce first-time failures:

```typescript
async preloadVoices(languages: string[]): Promise<void> {
  for (const lang of languages) {
    const voices = await this.getVoicesForLanguage(lang);
    // Trigger voice loading
    for (const voice of voices) {
      const utterance = new SpeechSynthesisUtterance('');
      utterance.voice = voice;
      this.synthesis?.speak(utterance);
      this.synthesis?.cancel();
    }
  }
}
```

### 4. Circuit Breaker Pattern

Temporarily disable TTS if it fails consistently:

```typescript
class TTSCircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private isOpen = false;

  shouldAttempt(): boolean {
    if (!this.isOpen) return true;

    // Reset after 5 minutes
    if (Date.now() - this.lastFailureTime > 5 * 60 * 1000) {
      this.reset();
      return true;
    }

    return false;
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    // Open circuit after 5 consecutive failures
    if (this.failureCount >= 5) {
      this.isOpen = true;
    }
  }
}
```

## Recommendations

### Priority: HIGH ⚠️

**Why Implement TTS Retry:**

1. **User Experience:** Pronunciation is a core feature - failures are frustrating
2. **Reliability:** TTS has many transient failure modes that retry can fix
3. **Consistency:** Translation has retry, TTS should too
4. **Low Effort:** Can reuse existing retry infrastructure (RetryHandler)
5. **High Impact:** Significantly improves pronunciation reliability

### Implementation Order

**Phase 1 (Must Have):**

1. ✅ Core retry logic with RetryHandler
2. ✅ Error classification
3. ✅ Basic debug logging

**Phase 2 (Should Have):** 4. ✅ Debug console commands 5. ✅ Retry indicator UI 6. ✅ Statistics tracking

**Phase 3 (Nice to Have):** 7. ⭕ Voice fallback strategy 8. ⭕ Adaptive retry 9. ⭕ Circuit breaker

### Code Reuse Opportunities

**Already Implemented (from Translation):**

- ✅ `RetryHandler` class - fully reusable
- ✅ `RetryConfig` interface - can extend for TTS
- ✅ Exponential backoff logic
- ✅ Jitter calculation
- ✅ Timeout handling
- ✅ Debug infrastructure pattern

**Need to Create (TTS-specific):**

- ❌ `tts-retry-config.ts` - TTS-specific config
- ❌ `tts-debugger.ts` - TTS debug logging
- ❌ `tts-debug-console.ts` - TTS console commands
- ❌ TTS retry indicator UI

**Estimated Effort:** 6-8 hours (50% less than translation because of reuse)

## Conclusion

The TTS service currently **lacks auto-retry functionality**, making it less reliable than the translation system. Implementing TTS auto-retry is:

- **Feasible:** Can reuse 50% of translation retry infrastructure
- **Valuable:** Significantly improves pronunciation reliability
- **Quick:** 6-8 hours of development time
- **Consistent:** Matches translation retry patterns
- **User-Friendly:** Provides visual feedback and debugging tools

### Next Steps

1. **Review this plan** with the team
2. **Approve implementation** approach
3. **Schedule development** (1-2 days)
4. **Implement Phase 1** (core retry)
5. **Test thoroughly** with manual and automated tests
6. **Deploy incrementally** with monitoring
7. **Gather feedback** from users
8. **Iterate** based on real-world usage

### Questions to Consider

1. Should TTS retry be enabled by default or opt-in?
2. What should the maximum retry attempts be? (Recommend: 3)
3. Should we implement voice fallback in Phase 1 or Phase 3?
4. How should we handle multiple simultaneous TTS requests?
5. Should we add rate limiting to prevent TTS spam?

---

**Document Version:** 1.0  
**Created:** 2025-11-02  
**Status:** Proposal - Awaiting Approval  
**Estimated Effort:** 6-8 hours  
**Priority:** HIGH  
**Dependencies:** Translation retry infrastructure (already implemented)
