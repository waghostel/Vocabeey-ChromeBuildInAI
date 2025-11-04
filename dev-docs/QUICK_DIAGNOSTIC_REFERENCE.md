# Quick Diagnostic Reference Card

## 🚀 Quick Start

1. **Build:** `pnpm build`
2. **Reload:** Extension in `chrome://extensions/`
3. **Open:** Service worker console (click "service worker" link)
4. **Test:** Go to https://www.iana.org/help/example-domains
5. **Trigger:** Click extension to extract content
6. **Watch:** Console logs flow through

## 🔍 What to Look For

### ✅ SUCCESS Pattern (99% confidence)

```
🔍 Detecting article language...
📤 Sending DETECT_LANGUAGE message...
🌍 [ServiceWorker] DETECT_LANGUAGE request...
🔬 [Offscreen] Processing language detection...
🔎 Checking if LanguageDetector API is available...
typeof LanguageDetector: function  ← KEY!
✅ LanguageDetector API is available
🔄 Calling detector.detect()...
📥 Raw detection results: [...]
🌍 Language Detection Results:
  1. EN - 99.00% ████████████████████
✅ Language detected: EN (99.00% confidence)
```

### ❌ FAILURE Pattern (30% confidence)

```
🔍 Detecting article language...
📤 Sending DETECT_LANGUAGE message...
[... some logs ...]
❌ [Some error message]
🔄 Using heuristic fallback detection...
⚠️ Fallback detected: EN (30% confidence - heuristic)
```

## 🎯 Key Checkpoints

| #   | Checkpoint               | Log to Look For                                   | If Missing                 |
| --- | ------------------------ | ------------------------------------------------- | -------------------------- |
| 1   | Article processor starts | `🔍 Detecting article language...`                | Extension not triggered    |
| 2   | Message sent             | `📤 Sending DETECT_LANGUAGE message...`           | Message sending failed     |
| 3   | Service worker receives  | `🌍 [ServiceWorker] DETECT_LANGUAGE request`      | Service worker not running |
| 4   | Routing to offscreen     | `📤 [ServiceWorker] Routing to offscreen...`      | Offscreen routing failed   |
| 5   | Offscreen receives       | `🔬 [Offscreen] Processing language detection...` | Offscreen not responding   |
| 6   | Chrome AI attempt        | `🎯 [Offscreen] Attempting Chrome AI...`          | Not reaching Chrome AI     |
| 7   | API availability check   | `typeof LanguageDetector: function`               | **API NOT AVAILABLE**      |
| 8   | API call                 | `🔄 Calling detector.detect()...`                 | API call failed            |
| 9   | Results received         | `📥 Raw detection results: [...]`                 | No results returned        |
| 10  | Success                  | `✅ Language detected: EN (99.00%)`               | Flow completed             |

## 🔧 Most Likely Issues

### Issue 1: API Not Available (90% probability)

**Symptom:**

```
typeof LanguageDetector: undefined
❌ LanguageDetector API is undefined!
```

**Cause:** Language Detection API not available in offscreen document context

**Check:**

- Chrome version (need 128+)
- Chrome flags enabled
- API supported in your region

**Test:**
Run in regular page console:

```javascript
console.log('typeof LanguageDetector:', typeof LanguageDetector);
```

### Issue 2: Wrong Content (5% probability)

**Symptom:**

```
📄 Text sample: { preview: "Advertisement...", fullLength: 50 }
```

**Cause:** Content extraction picking up ads/navigation instead of article

**Check:**

- Compare text preview in logs with actual page content
- Check if Readability is working correctly

### Issue 3: Offscreen Not Working (3% probability)

**Symptom:**

```
📤 [ServiceWorker] Routing to offscreen...
❌ [ServiceWorker] Offscreen language detection failed
```

**Cause:** Offscreen document not created or not responding

**Check:**

- Look for offscreen document creation logs
- Check if offscreen document console exists

### Issue 4: Message Not Sent (2% probability)

**Symptom:**

```
📤 Sending DETECT_LANGUAGE message...
❌ Language detection failed with error: ...
```

**Cause:** Message passing failed

**Check:**

- Service worker running?
- Extension context valid?

## 🧪 Quick Tests

### Test 1: API Availability (Run in any page console)

```javascript
console.log('typeof LanguageDetector:', typeof LanguageDetector);
```

**Expected:** `function` (if available) or `undefined` (if not)

### Test 2: Direct API Test (Run in any page console)

```javascript
if (typeof LanguageDetector !== 'undefined') {
  LanguageDetector.create()
    .then(d => d.detect('This is a test in English'))
    .then(r => console.log('Results:', r));
} else {
  console.log('API not available');
}
```

### Test 3: Extension Message Test (Run in extension context)

```javascript
chrome.runtime.sendMessage(
  { type: 'DETECT_LANGUAGE', data: { text: 'Test text' } },
  r => console.log('Response:', r)
);
```

## 📊 Log Emoji Guide

| Emoji | Meaning               |
| ----- | --------------------- |
| 🔍    | Starting detection    |
| 📊    | Statistics/data       |
| 📝    | Text analysis         |
| 📄    | Content preview       |
| 📤    | Sending message       |
| 📥    | Receiving response    |
| 🌍    | Language detection    |
| 🔬    | Detailed analysis     |
| 🎯    | Attempting operation  |
| 🔎    | Checking availability |
| 🏗️    | Creating instance     |
| 🔄    | Processing/calling    |
| ✅    | Success               |
| ❌    | Error                 |
| ⚠️    | Warning/fallback      |
| 💾    | Cache operation       |

## 📝 What to Report

When sharing results, include:

1. **Last successful checkpoint:** (e.g., "Checkpoint 7")
2. **First failed checkpoint:** (e.g., "Checkpoint 8")
3. **typeof LanguageDetector value:** (e.g., "undefined")
4. **Any error messages:** (copy full error)
5. **Text preview from logs:** (to verify correct content)
6. **Chrome version:** (e.g., "Chrome 131.0.6778.86")

## 🎓 Understanding the Results

### If you see: `typeof LanguageDetector: undefined`

→ **API not available in this context**
→ Need to investigate Chrome version, flags, or alternative approach

### If you see: `typeof LanguageDetector: function` but still 30%

→ **API available but not being called**
→ Check for errors in API call or offscreen communication

### If you see: `99% confidence` in logs but 30% in UI

→ **Response not being passed back correctly**
→ Check message passing between components

### If you see: Different text in preview vs page

→ **Content extraction issue**
→ Fix content extraction logic

## 🔗 Related Documents

- **DIAGNOSTIC_IMPLEMENTATION_SUMMARY.md** - Complete overview
- **LANGUAGE_DETECTION_DIAGNOSTIC_LOGGING.md** - Detailed logging guide
- **LANGUAGE_DETECTION_FLOW_ANALYSIS.md** - Flow diagram and analysis
- **LANGUAGE_DETECTION_TEST_SCRIPT.md** - Manual test scripts

## ⚡ TL;DR

1. Build and reload extension
2. Open service worker console
3. Test on IANA page
4. Look for `typeof LanguageDetector: function` or `undefined`
5. If `undefined` → API not available (most likely issue)
6. If `function` → Check for errors in API call
7. Report findings with checkpoint number and error messages
