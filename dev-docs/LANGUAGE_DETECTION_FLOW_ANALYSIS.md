# Language Detection Flow Analysis

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER TRIGGERS EXTRACTION                         │
│                    (Clicks extension on IANA page)                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          CONTENT SCRIPT                                  │
│                     (content/content-script.ts)                          │
│                                                                          │
│  1. Extract content from page using Readability                         │
│  2. Send CONTENT_EXTRACTED message to service worker                    │
│     - content: "Example Domains As described..."                        │
│     - wordCount: 115                                                    │
│     - paragraphCount: 2                                                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVICE WORKER                                   │
│                   (background/service-worker.ts)                         │
│                                                                          │
│  handleContentExtracted():                                              │
│  1. Receives extracted content                                          │
│  2. Calls processArticle(content)                                       │
│     ↓                                                                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       ARTICLE PROCESSOR                                  │
│                   (utils/article-processor.ts)                           │
│                                                                          │
│  processArticle():                                                      │
│  1. Generate article ID                                                 │
│  2. Call detectLanguage(extracted) ◄─── WE ARE HERE                    │
│     ↓                                                                   │
│  detectLanguage():                                                      │
│  1. Log content stats                                                   │
│  2. Take first 1000 chars as sample                                     │
│  3. Send DETECT_LANGUAGE message to service worker                      │
│  4. Wait for response...                                                │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVICE WORKER                                   │
│                   (background/service-worker.ts)                         │
│                                                                          │
│  handleDetectLanguage():                                                │
│  1. Receives { text: "Example Domains..." }                             │
│  2. Calls executeOffscreenAITask('language_detection', ...)            │
│     ↓                                                                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      OFFSCREEN MANAGER                                   │
│                   (utils/offscreen-manager.ts)                           │
│                                                                          │
│  executeOffscreenAITask():                                              │
│  1. Ensure offscreen document exists                                    │
│  2. Send OFFSCREEN_TASK message to offscreen document                   │
│  3. Wait for OFFSCREEN_TASK_RESULT response                             │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      OFFSCREEN DOCUMENT                                  │
│                   (offscreen/ai-processor.ts)                            │
│                                                                          │
│  processTask():                                                         │
│  1. Receives taskType: 'language_detection'                             │
│  2. Calls processLanguageDetection(data)                                │
│     ↓                                                                   │
│  processLanguageDetection():                                            │
│  1. Calls chromeAI.detectLanguage(text)                                 │
│     ↓                                                                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CHROME AI MANAGER                                   │
│                      (utils/chrome-ai.ts)                                │
│                                                                          │
│  ChromeLanguageDetector.detectLanguage():                               │
│  1. Check cache (miss)                                                  │
│  2. Check if LanguageDetector API is available                          │
│     typeof LanguageDetector === 'undefined' ? ◄─── CRITICAL CHECK      │
│     ↓                                                                   │
│  IF AVAILABLE:                                                          │
│  3. Create detector: await LanguageDetector.create()                    │
│  4. Detect: await detector.detect(text)                                 │
│  5. Return results with confidence                                      │
│     ↓                                                                   │
│  IF NOT AVAILABLE:                                                      │
│  3. Throw error: 'API not available in this context'                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
         ┌──────────────────┐      ┌──────────────────┐
         │   SUCCESS PATH   │      │   ERROR PATH     │
         └────────┬─────────┘      └────────┬─────────┘
                  │                         │
                  ▼                         ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │ Return to Offscreen  │    │ Catch error          │
    │ { language: 'en',    │    │ Try Gemini fallback  │
    │   confidence: 0.99 } │    │ (if configured)      │
    └──────────┬───────────┘    └──────────┬───────────┘
               │                           │
               └───────────┬───────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │  Send OFFSCREEN_TASK_RESULT     │
         │  back to service worker         │
         └────────────┬────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────┐
         │  Service Worker receives result │
         │  Returns to article-processor   │
         └────────────┬────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────────┐
         │  Article Processor receives:    │
         │  { success: true,               │
         │    data: { language, conf } }   │
         │  OR                             │
         │  { success: false, error: ... } │
         └────────────┬────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
┌────────────────┐      ┌────────────────────┐
│  SUCCESS       │      │  FALLBACK          │
│  Use detected  │      │  Use heuristic     │
│  language with │      │  detection (30%    │
│  high conf     │      │  confidence)       │
└────────┬───────┘      └────────┬───────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Create ProcessedArticle │
         │  with language info      │
         └───────────┬──────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Open Learning Interface │
         └───────────────────────┘
```

## Current Problem: Where Does It Fail?

Based on your console logs showing **30% confidence with heuristic fallback**, the flow is breaking somewhere. Here are the possible failure points:

### Failure Point 1: Message Not Sent

```
article-processor.ts → service-worker.ts
```

**Symptom:** No `🌍 [ServiceWorker] DETECT_LANGUAGE request` log
**Cause:** Message sending failed or service worker not running
**Check:** Look for `📤 Sending DETECT_LANGUAGE message` in logs

### Failure Point 2: Offscreen Document Not Created

```
service-worker.ts → offscreen-manager.ts → offscreen document
```

**Symptom:** `❌ [ServiceWorker] Offscreen language detection failed`
**Cause:** Offscreen document creation failed or not responding
**Check:** Look for offscreen document creation logs

### Failure Point 3: API Not Available (MOST LIKELY)

```
offscreen/ai-processor.ts → chrome-ai.ts → LanguageDetector API
```

**Symptom:** `typeof LanguageDetector: undefined`
**Cause:** Language Detection API not available in offscreen document context
**Check:** Look for `🔎 Checking if LanguageDetector API is available...`

### Failure Point 4: API Call Fails

```
chrome-ai.ts → LanguageDetector.create() → detector.detect()
```

**Symptom:** Error during API call
**Cause:** API available but call fails (permissions, quota, etc.)
**Check:** Look for `❌ Language detection error caught:`

## Diagnostic Log Checkpoints

With the new logging, you should see these checkpoints in order:

### ✅ Checkpoint 1: Article Processor Starts

```
🔍 Detecting article language...
📊 Content stats: { totalLength: 771, wordCount: 115, paragraphCount: 2 }
📝 Analyzing first 771 characters...
```

### ✅ Checkpoint 2: Message Sent

```
📤 Sending DETECT_LANGUAGE message to service worker...
```

### ✅ Checkpoint 3: Service Worker Receives

```
🌍 [ServiceWorker] DETECT_LANGUAGE request: Analyzing 771 characters
📄 [ServiceWorker] Text preview: Example Domains As described...
```

### ✅ Checkpoint 4: Routing to Offscreen

```
📤 [ServiceWorker] Routing to offscreen document...
```

### ✅ Checkpoint 5: Offscreen Receives

```
🔬 [Offscreen] Processing language detection...
📊 Input data: { textLength: 771, textPreview: ..., wordCount: 115 }
```

### ✅ Checkpoint 6: Chrome AI Attempt

```
🎯 [Offscreen] Attempting Chrome AI language detection...
🔬 [ChromeLanguageDetector] Starting language detection...
```

### ✅ Checkpoint 7: API Availability Check

```
🔎 Checking if LanguageDetector API is available...
typeof LanguageDetector: function  ← SHOULD BE 'function', NOT 'undefined'
```

### ✅ Checkpoint 8: API Call

```
🏗️ Creating detector instance...
✅ Detector instance created successfully
🔄 Calling detector.detect() with text...
```

### ✅ Checkpoint 9: Results Received

```
📥 Raw detection results: [{ detectedLanguage: 'en', confidence: 0.99 }]
🌍 Language Detection Results (ranked by confidence):
  1. EN - 99.00% ████████████████████
```

### ✅ Checkpoint 10: Success Response

```
✅ [Offscreen] Chrome AI detection successful: { language: 'en', confidence: 0.99 }
✅ [ServiceWorker] Language detection successful (Chrome AI): EN (99.00% confidence)
📥 Received response from service worker: { success: true, data: {...} }
✅ Language detected: EN (99.00% confidence)
```

## What You're Currently Seeing

Based on your logs:

```
article-processor.ts:93 🔄 Using heuristic fallback detection...
article-processor.ts:95 ⚠️ Fallback detected: EN (30% confidence - heuristic)
```

This means the flow is breaking **before Checkpoint 10**, likely at **Checkpoint 7** (API not available).

## Next Steps

1. **Reload the extension** with the new diagnostic logging
2. **Trigger language detection** on the IANA page
3. **Find which checkpoint fails** by looking at the console logs
4. **Report back** which checkpoint is the last one you see

The diagnostic logs will tell us exactly where the flow breaks and why the API isn't being used.

## Expected vs Actual

### Expected (99% confidence):

- All checkpoints pass
- API is available and called
- Returns high confidence result

### Actual (30% confidence):

- Some checkpoint fails
- Falls back to heuristic detection
- Returns low confidence result

The new logs will show us exactly which checkpoint fails and why.
