# Testing Guide - Chrome AI Translation Fix

## Pre-Testing Setup

### 1. Enable Chrome Flags

Navigate to `chrome://flags` and enable:

- ✅ **Prompt API for Gemini Nano** - `#prompt-api-for-gemini-nano`
- ✅ **Translation API** - `#translation-api`
- ✅ **Language Detection API** - `#language-detection-api`

Restart Chrome after enabling flags.

### 2. Reload Extension

1. Navigate to `chrome://extensions`
2. Find "Language Learning Chrome Extension"
3. Click the reload icon 🔄
4. Verify no errors in the extension console

## Testing Checklist

### Test 1: System Capabilities Check

**Expected Result:** All APIs should be detected correctly

1. Open extension popup or background console
2. Check system capabilities
3. Verify output shows:
   ```javascript
   {
     hasChromeAI: true,
     hasLanguageDetector: true,  // Should be true now
     hasSummarizer: true,
     hasRewriter: true,
     hasTranslator: true,         // Should be true now
     hasPromptAPI: true
   }
   ```

**How to test:**

```javascript
// In background service worker console
chrome.runtime.sendMessage({ type: 'CHECK_SYSTEM_CAPABILITIES' }, response =>
  console.log(response)
);
```

### Test 2: Translation in Offscreen Document

**Expected Result:** Translation should work without errors

1. Navigate to any article page
2. Click the extension icon
3. Wait for article processing
4. Click on a vocabulary word
5. Check console for translation logs

**Expected Console Output:**

```
TRANSLATE_TEXT request: { text: "palabra", type: "vocabulary" }
Translation successful (Chrome AI via offscreen): word
```

**Should NOT see:**

```
❌ Translation API not available and no Gemini API key configured
```

### Test 3: Vocabulary Highlighting

**Expected Result:** Words should be highlighted and translatable

1. Open a processed article
2. Enable vocabulary highlighting
3. Click on highlighted words
4. Verify translations appear
5. Check that translations are cached (second click is instant)

### Test 4: Sentence Translation

**Expected Result:** Sentences should translate correctly

1. Open a processed article
2. Enable sentence mode
3. Click on a sentence
4. Verify translation appears
5. Check console for translation logs

### Test 5: Language Detection

**Expected Result:** Language should be detected automatically

1. Open an article in Spanish
2. Check console for language detection
3. Verify correct language is detected

**Expected Console Output:**

```
Detected language: es
```

### Test 6: Batch Translation

**Expected Result:** Multiple words should translate efficiently

1. Open article with many highlighted words
2. Hover over multiple words quickly
3. Verify translations load
4. Check that batch processing is used (console logs)

## Debugging Commands

### Check API Availability in Offscreen Document

Open DevTools for the offscreen document:

1. Navigate to `chrome://extensions`
2. Find your extension
3. Click "Inspect views: offscreen.html"
4. Run in console:

```javascript
// Check global APIs
console.log('Translator available:', typeof Translator !== 'undefined');
console.log(
  'LanguageDetector available:',
  typeof LanguageDetector !== 'undefined'
);

// Check window.ai APIs
console.log('window.ai available:', typeof window.ai !== 'undefined');
console.log('Summarizer available:', window.ai?.summarizer !== undefined);
console.log('Rewriter available:', window.ai?.rewriter !== undefined);
console.log('Prompt API available:', window.ai?.languageModel !== undefined);
```

### Test Translation Directly

In offscreen document console:

```javascript
// Test Translator API
if (typeof Translator !== 'undefined') {
  const translator = await Translator.create({
    sourceLanguage: 'es',
    targetLanguage: 'en',
  });

  const result = await translator.translate('Hola mundo');
  console.log('Translation:', result);

  translator.destroy();
} else {
  console.error('Translator API not available');
}
```

### Test Language Detection

In offscreen document console:

```javascript
// Test Language Detector API
if (typeof LanguageDetector !== 'undefined') {
  const detector = await LanguageDetector.create();
  const results = await detector.detect('Bonjour le monde');
  console.log('Detection results:', results);
} else {
  console.error('LanguageDetector API not available');
}
```

## Common Issues and Solutions

### Issue 1: "Translator is not defined"

**Cause:** Chrome flags not enabled or Chrome version too old

**Solution:**

1. Check Chrome version (need 138+)
2. Enable Translation API flag
3. Restart Chrome
4. Reload extension

### Issue 2: "Translation API not available in this context"

**Cause:** Trying to use API in service worker instead of offscreen document

**Solution:**

- Verify code is running in offscreen document
- Check that offscreen document is created successfully
- Review offscreen manager logs

### Issue 3: Translations are slow

**Cause:** Model downloading or not cached

**Solution:**

1. Wait for initial model download
2. Check download progress in console
3. Subsequent translations should be faster
4. Verify caching is working

### Issue 4: Language pair not supported

**Cause:** Chrome doesn't support that language pair yet

**Solution:**

1. Check supported language pairs
2. Implement Gemini API fallback
3. Show user-friendly error message

## Performance Benchmarks

Expected performance after fix:

| Operation                         | Expected Time | Notes             |
| --------------------------------- | ------------- | ----------------- |
| First translation (with download) | 5-30 seconds  | One-time download |
| Subsequent translations           | 100-500ms     | Cached model      |
| Cached translation                | <10ms         | From memory cache |
| Language detection                | 50-200ms      | Fast              |
| Batch translation (10 words)      | 500-1000ms    | Sequential        |

## Success Criteria

✅ All tests pass
✅ No console errors
✅ Translations work correctly
✅ Language detection works
✅ Performance is acceptable
✅ Caching works
✅ Fallback to Gemini works (if configured)

## Reporting Issues

If you encounter issues, collect:

1. **Chrome version:** `chrome://version`
2. **Extension version:** Check manifest.json
3. **Console logs:** From background, offscreen, and content script
4. **API availability:** Output from debugging commands
5. **Network logs:** Check if models are downloading
6. **Steps to reproduce:** Detailed steps

## Next Steps After Testing

If all tests pass:

1. ✅ Mark translation feature as working
2. ✅ Update documentation
3. ✅ Consider adding streaming translation UI
4. ✅ Implement download progress indicators
5. ✅ Add more language pairs
6. ✅ Optimize caching strategy

If tests fail:

1. Review console errors
2. Check API availability
3. Verify Chrome flags are enabled
4. Check offscreen document creation
5. Review code changes
6. Test in different contexts
