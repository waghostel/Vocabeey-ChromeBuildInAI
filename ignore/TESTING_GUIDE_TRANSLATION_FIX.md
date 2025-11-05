# Testing Guide: Dynamic Translation Popup Fix

## Prerequisites

1. Build the extension: `pnpm build`
2. Load the extension in Chrome
3. Open an article in a foreign language

## Test Scenarios

### Test 1: Basic Translation Popup

**Steps:**

1. Open an article (e.g., Spanish article)
2. Set target language to English
3. Highlight a word in vocabulary mode
4. Hover over the highlighted word

**Expected Result:**

- Popup shows English translation
- Translation appears within 50-200ms

### Test 2: Language Switch - New Highlight

**Steps:**

1. Open an article (e.g., Spanish article)
2. Set target language to English
3. Highlight a word "hola"
4. Hover over "hola" → should show "hello"
5. Switch target language to French
6. Hover over "hola" again

**Expected Result:**

- First hover shows "hello" (English)
- After switching to French, hover shows "bonjour"
- Card also shows "bonjour"

### Test 3: Language Switch - Multiple Times

**Steps:**

1. Highlight a word with target language = English
2. Hover → see English translation
3. Switch to Spanish → hover → see Spanish translation
4. Switch to French → hover → see French translation
5. Switch back to English → hover → see English translation

**Expected Result:**

- Each language switch shows correct translation
- Switching back to English is instant (cached)
- No errors in console

### Test 4: Multiple Highlights

**Steps:**

1. Set target language to English
2. Highlight 3 different words
3. Hover over each → verify English translations
4. Switch to Spanish
5. Hover over each word again

**Expected Result:**

- All 3 words show Spanish translations
- All cards update to Spanish
- Popups match card translations

### Test 5: Sentence Mode

**Steps:**

1. Switch to sentence mode
2. Set target language to English
3. Highlight a sentence
4. Hover over sentence → see English translation
5. Switch to French
6. Hover over sentence again

**Expected Result:**

- Sentence popup shows French translation
- Sentence card shows French translation
- Both match

### Test 6: Cache Performance

**Steps:**

1. Highlight a word with English as target
2. Hover → note the delay (first time)
3. Hover again → should be instant (cached)
4. Switch to Spanish
5. Hover → note the delay (first time for Spanish)
6. Hover again → should be instant (cached)
7. Switch back to English
8. Hover → should be instant (already cached)

**Expected Result:**

- First hover per language: slight delay
- Subsequent hovers: instant
- Switching back to previous language: instant

### Test 7: Page Navigation

**Steps:**

1. Highlight words on Part 1 with English target
2. Navigate to Part 2
3. Navigate back to Part 1
4. Switch target language to Spanish
5. Highlight new words

**Expected Result:**

- Old highlights are not visible (expected behavior)
- New highlights show Spanish translations
- No errors

### Test 8: Reload Page

**Steps:**

1. Highlight words with English target
2. Reload the page
3. Set target language to Spanish
4. Highlight new words
5. Hover over new highlights

**Expected Result:**

- New highlights show Spanish translations
- No errors in console

### Test 9: Error Handling

**Steps:**

1. Highlight a word
2. Open DevTools → Network tab
3. Throttle network to "Offline"
4. Switch target language
5. Hover over highlight

**Expected Result:**

- Shows error message gracefully
- No console errors
- Can retry when back online

### Test 10: Backward Compatibility

**Steps:**

1. If you have old highlights from before this fix
2. Hover over them
3. Switch language
4. Hover again

**Expected Result:**

- Old highlights work correctly
- Translations are fetched and cached
- No errors

## Console Checks

Open DevTools Console and verify:

1. **No errors** during normal operation
2. **Translation requests** are logged (if debug enabled)
3. **Cache hits** are faster than cache misses
4. **Storage updates** happen correctly

## Performance Checks

1. **First hover**: Should be < 200ms
2. **Cached hover**: Should be < 10ms
3. **Language switch**: Should update within 200ms
4. **Multiple highlights**: All should update smoothly

## Known Limitations

1. **Highlights not persisted**: Highlights disappear when navigating away (existing behavior)
2. **First hover delay**: Slight delay on first hover per language (expected)
3. **Offline mode**: Translations fail gracefully (expected)

## Debugging Tips

### Check Storage

Open DevTools → Application → Storage → Local Storage:

```javascript
// Check vocabulary items
chrome.storage.local.get('vocabulary', data => {
  console.log('Vocabulary:', data.vocabulary);
});

// Check if translations are cached
chrome.storage.local.get('vocabulary', data => {
  const vocab = Object.values(data.vocabulary)[0];
  console.log('Translations cache:', vocab.translations);
});
```

### Check Current Target Language

```javascript
chrome.storage.local.get('targetLanguage', data => {
  console.log('Current target language:', data.targetLanguage);
});
```

### Monitor Translation Requests

Watch the Network tab for translation API calls when hovering over highlights.

## Success Criteria

✅ All 10 test scenarios pass
✅ No console errors
✅ Translations match between cards and popups
✅ Performance is acceptable (< 200ms first hover)
✅ Cache works correctly (instant on repeat hover)
✅ Language switching works smoothly

## Reporting Issues

If you find any issues, please report:

1. **Test scenario** that failed
2. **Expected behavior**
3. **Actual behavior**
4. **Console errors** (if any)
5. **Steps to reproduce**
6. **Browser version**
7. **Extension version**
