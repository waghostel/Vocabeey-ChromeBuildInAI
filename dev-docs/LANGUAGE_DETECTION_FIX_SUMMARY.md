# Language Detection Fix - Root Cause and Solution

## 🎯 Root Cause Identified!

### The Problem

The diagnostic logs revealed the exact issue:

```
service-worker.ts:425 📨 [ServiceWorker] Message received: OFFSCREEN_READY
service-worker.ts:425 📨 [ServiceWorker] Message received: CONTENT_EXTRACTED
article-processor.ts:82 📤 Sending DETECT_LANGUAGE message to service worker...
article-processor.ts:88 📥 Received response from service worker: undefined
```

**Key Observation:** The service worker receives `OFFSCREEN_READY` and `CONTENT_EXTRACTED` messages, but **NEVER receives the `DETECT_LANGUAGE` message**!

### Why This Happened

The issue is a **context mismatch**:

1. `processArticle()` is called **inside the service worker** (from `handleContentExtracted`)
2. `processArticle()` calls `detectLanguage()`
3. `detectLanguage()` tries to send a message with `chrome.runtime.sendMessage()`
4. **Problem:** When you call `chrome.runtime.sendMessage()` from within a service worker, it doesn't work the same way as from a content script

The message was being sent to the service worker **from itself**, which Chrome doesn't handle properly, resulting in `undefined` response.

### The Flow

```
Content Script
    ↓ (sends CONTENT_EXTRACTED message)
Service Worker (handleContentExtracted)
    ↓ (calls processArticle directly)
Article Processor (running IN service worker)
    ↓ (tries to send DETECT_LANGUAGE message)
Service Worker (never receives it - same context!)
    ↓
undefined response
    ↓
Fallback to heuristic (30% confidence)
```

## ✅ The Solution

Instead of using message passing when already in the service worker context, we now:

1. **Detect the context** - Check if we're running in service worker
2. **Call directly** - If in service worker, call the handler function directly
3. **Use messages** - If in content script, use message passing as before

### Code Changes

#### 1. Article Processor (`src/utils/article-processor.ts`)

Added context detection:

```typescript
// Check if we're in service worker context
const isServiceWorker =
  typeof window === 'undefined' && typeof chrome !== 'undefined';

if (isServiceWorker) {
  // We're in service worker - call handler directly
  console.log(
    '🔧 Running in service worker context - calling handler directly...'
  );

  const { handleDetectLanguageInternal } = await import(
    '../background/service-worker.js'
  );
  const result = await handleDetectLanguageInternal({ text: textSample });

  return result;
} else {
  // We're in content script - use message passing
  console.log('📤 Sending DETECT_LANGUAGE message to service worker...');
  const response = await chrome.runtime.sendMessage({
    type: 'DETECT_LANGUAGE',
    data: { text: textSample },
  });
  // ...
}
```

#### 2. Service Worker (`src/background/service-worker.ts`)

Exported the handler function:

```typescript
/**
 * Exported for direct calls from service worker context
 */
export async function handleDetectLanguageInternal(payload: {
  text: string;
}): Promise<{ language: string; confidence: number }> {
  return handleDetectLanguage(payload);
}
```

## 🔄 New Flow

```
Content Script
    ↓ (sends CONTENT_EXTRACTED message)
Service Worker (handleContentExtracted)
    ↓ (calls processArticle directly)
Article Processor (running IN service worker)
    ↓ (detects service worker context)
    ↓ (imports and calls handleDetectLanguageInternal directly)
Service Worker Handler (handleDetectLanguage)
    ↓ (routes to offscreen document)
Offscreen Document
    ↓ (calls Chrome AI Language Detection API)
Chrome AI API
    ↓ (returns language with high confidence)
Result: EN with 99% confidence! ✅
```

## 📊 Expected Results

After this fix, you should see:

```
🔍 Detecting article language...
📊 Content stats: { totalLength: 771, wordCount: 115, paragraphCount: 2 }
📝 Analyzing first 771 characters...
📄 Text sample being analyzed: { preview: "Example Domains...", fullLength: 771 }
🔧 Running in service worker context - calling handler directly...
🌍 [ServiceWorker] DETECT_LANGUAGE request: Analyzing 771 characters
📤 [ServiceWorker] Routing to offscreen document...
🔬 [Offscreen] Processing language detection...
🎯 [Offscreen] Attempting Chrome AI language detection...
🔬 [ChromeLanguageDetector] Starting language detection...
🔎 Checking if LanguageDetector API is available...
typeof LanguageDetector: function
✅ LanguageDetector API is available
🔄 Calling detector.detect() with text...
📥 Raw detection results: [{ detectedLanguage: 'en', confidence: 0.99 }]
🌍 Language Detection Results (ranked by confidence):
  1. EN - 99.00% ████████████████████
✅ Selected: EN (99.00% confidence)
✅ Language detected: EN (99.00% confidence)
```

## 🧪 How to Test

1. **Reload the extension** in `chrome://extensions/`
2. **Open service worker console**
3. **Navigate to** https://www.iana.org/help/example-domains
4. **Trigger extraction**
5. **Look for:**
   - `🔧 Running in service worker context - calling handler directly...`
   - Language detection logs from offscreen and Chrome AI
   - **99% confidence** instead of 30%!

## 🎓 What We Learned

### Key Insight

**Context matters in Chrome extensions!**

- **Content Script → Service Worker:** Use `chrome.runtime.sendMessage()`
- **Service Worker → Service Worker:** Call functions directly
- **Service Worker → Offscreen:** Use message passing (different context)

### Why Message Passing Failed

When `chrome.runtime.sendMessage()` is called from within a service worker:

- Chrome doesn't route it back to the same service worker's message listener
- The message gets lost or returns `undefined`
- This is by design - message passing is for cross-context communication

### The Fix Pattern

```typescript
// Detect context
const isServiceWorker = typeof window === 'undefined';

if (isServiceWorker) {
  // Same context - direct call
  const result = await handlerFunction(data);
} else {
  // Different context - message passing
  const response = await chrome.runtime.sendMessage({ type: 'ACTION', data });
}
```

## 📝 Files Modified

1. **`src/utils/article-processor.ts`**
   - Added context detection
   - Added direct handler call for service worker context
   - Kept message passing for content script context

2. **`src/background/service-worker.ts`**
   - Exported `handleDetectLanguageInternal` function
   - Kept original message handler for content script calls

## ✅ Build Status

- ✅ TypeScript compilation successful
- ✅ No errors or warnings
- ✅ All imports fixed
- ✅ Ready to test

## 🚀 Expected Outcome

After reloading the extension, language detection should now:

- ✅ Work correctly with **99% confidence** (not 30%)
- ✅ Use the actual Chrome Language Detection API
- ✅ Show all diagnostic logs from offscreen and Chrome AI
- ✅ Match the demo page results

The 30% → 99% confidence jump will confirm the fix is working!

## 🔍 Verification

To verify the fix is working, check for:

1. **New log:** `🔧 Running in service worker context - calling handler directly...`
2. **Offscreen logs:** `🔬 [Offscreen] Processing language detection...`
3. **Chrome AI logs:** `🔬 [ChromeLanguageDetector] Starting language detection...`
4. **API availability:** `typeof LanguageDetector: function`
5. **High confidence:** `✅ Selected: EN (99.00% confidence)`

If you see all of these, the fix is working perfectly!
