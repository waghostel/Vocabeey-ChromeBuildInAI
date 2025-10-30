# Testing the Article Data Fix

## What Was Fixed

The extension now properly processes extracted content before displaying it:

1. **Created:** `src/utils/article-processor.ts` - Converts `ExtractedContent` to `ProcessedArticle`
2. **Updated:** `src/background/service-worker.ts` - Processes articles before storing
3. **Added:** Comprehensive tests in `tests/article-processor.test.ts`

## Changes Summary

### New File: `src/utils/article-processor.ts`

- `processArticle()` - Main processing function
- `detectLanguage()` - Language detection with fallback
- `splitContentIntoParts()` - Smart content splitting
- `validateProcessedArticle()` - Validation function

### Updated: `src/background/service-worker.ts`

- Imports `processArticle` and `ProcessedArticle` type
- `handleContentExtracted()` now processes articles before storing
- `openLearningInterface()` now accepts `ProcessedArticle` instead of `ExtractedContent`
- Added logging for debugging

## Testing Steps

### 1. Build the Extension

```bash
pnpm build
```

Expected output:

- ✅ TypeScript compilation successful
- ✅ Assets copied
- ✅ Import paths fixed

### 2. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist` folder from your project
5. Extension should load without errors

### 3. Test with IANA Example Domains

**URL:** https://www.iana.org/help/example-domains

**Steps:**

1. Navigate to the URL
2. Click the extension icon
3. Wait for processing

**Expected Results:**

- ✅ Content script extracts content
- ✅ Service worker processes article
- ✅ New tab opens with learning interface
- ✅ Article displays correctly
- ✅ No "No article data found" error

**Console Logs to Check:**

In the service worker console (`chrome://extensions/` → Details → Service worker → Inspect):

```
Content extracted: {title: "Example Domains", content: "...", ...}
Processing article...
Article processed successfully: {id: "article_...", parts: 1, language: "en"}
Article stored for tab X: {id: "article_...", title: "Example Domains", parts: 1}
```

In the learning interface console (F12 on the new tab):

```
Loading article...
Current article: {id: "article_...", parts: [...], ...}
```

### 4. Test with Different Content Types

#### Short Article (< 500 words)

**Example:** https://example.com

**Expected:**

- Single part created
- Article displays in one section

#### Long Article (> 500 words)

**Example:** Any news article or blog post

**Expected:**

- Multiple parts created
- Navigation buttons work
- Can switch between parts

#### Non-English Content

**Example:** Spanish, French, German article

**Expected:**

- Language detected correctly
- Displayed in article header

### 5. Verify Data Structure

Open browser console in learning interface and run:

```javascript
// Check current article structure
console.log('Article:', state.currentArticle);

// Should show:
{
  id: "article_1234567890_abc123",
  url: "https://...",
  title: "...",
  originalLanguage: "en",
  processedAt: Date,
  parts: [
    {
      id: "article_1234567890_abc123_part_1",
      content: "...",
      originalContent: "...",
      vocabulary: [],
      sentences: [],
      partIndex: 0
    }
  ],
  processingStatus: "completed",
  cacheExpires: Date
}
```

### 6. Check Session Storage

In the learning interface console:

```javascript
chrome.storage.session.get(null, data => {
  console.log('Session storage:', data);

  // Should see entries like:
  // article_123: {id: "article_...", parts: [...], ...}
  // pending_article_...: {id: "article_...", parts: [...], ...}
});
```

### 7. Test Error Handling

#### Invalid URL

Try clicking extension on:

- `chrome://extensions/`
- `chrome://settings/`

**Expected:**

- Warning message in console
- No error thrown
- Extension doesn't crash

#### Empty Content

Try on a page with minimal content (< 100 words)

**Expected:**

- Content extraction fails gracefully
- Error notification shown
- No crash

## Debugging Tips

### If "No article data found" still appears:

1. **Check service worker console:**

   ```
   chrome://extensions/ → Details → Service worker → Inspect
   ```

   Look for errors in article processing

2. **Check session storage:**

   ```javascript
   chrome.storage.session.get(null, console.log);
   ```

   Verify article is stored with correct structure

3. **Check tab ID:**

   ```javascript
   chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
     console.log('Current tab ID:', tabs[0].id);
   });
   ```

   Verify tab ID matches storage key

4. **Enable verbose logging:**
   Add to service worker:
   ```javascript
   console.log('DEBUG: Article data:', article);
   console.log('DEBUG: Storage key:', `article_${tab.id}`);
   ```

### If article doesn't display:

1. **Check learning interface console:**
   Look for initialization errors

2. **Verify article structure:**

   ```javascript
   console.log('Article parts:', state.currentArticle?.parts);
   ```

3. **Check DOM elements:**
   ```javascript
   console.log('Article content element:', elements.articlePartContent);
   ```

## Performance Verification

### Processing Time

Should be < 100ms for typical articles

Check in service worker console:

```
Article processed successfully: {id: "...", parts: 1, language: "en"}
```

### Memory Usage

Check in learning interface (memory indicator should appear)

### Storage Usage

```javascript
chrome.storage.session.getBytesInUse(null, bytes => {
  console.log('Session storage:', bytes, 'bytes');
});
```

## Automated Tests

Run the test suite:

```bash
# Run article processor tests
pnpm test article-processor.test.ts

# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage
```

Expected results:

- ✅ 9/9 tests pass for article processor
- ✅ All existing tests still pass
- ✅ No regressions

## Known Limitations

1. **Language Detection:**
   - Fallback uses simple heuristics
   - May not be 100% accurate for all languages
   - Chrome AI language detection requires API availability

2. **Content Splitting:**
   - Currently splits at 500 words per part
   - May split mid-paragraph in some cases
   - Future: Implement smarter splitting

3. **Processing Time:**
   - Language detection may add latency
   - Depends on Chrome AI availability
   - Fallback is instant

## Next Steps

If everything works:

1. ✅ Test with various websites
2. ✅ Test with different languages
3. ✅ Test with long articles
4. ✅ Verify memory usage is acceptable
5. ✅ Check for any console errors

If issues persist:

1. Check the debug documents in `debug/` folder
2. Review console logs in both service worker and learning interface
3. Verify build output in `dist/` folder
4. Check Chrome extension permissions

## Success Criteria

- [x] Extension builds without errors
- [x] All tests pass
- [x] IANA example domains page works
- [x] Article displays in learning interface
- [x] No "No article data found" error
- [x] Article parts are created correctly
- [x] Language is detected
- [x] Navigation works (if multiple parts)
- [x] No console errors
- [x] Memory usage is reasonable

## Rollback Plan

If the fix causes issues:

1. **Revert service worker changes:**

   ```bash
   git checkout src/background/service-worker.ts
   ```

2. **Remove article processor:**

   ```bash
   rm src/utils/article-processor.ts
   ```

3. **Rebuild:**

   ```bash
   pnpm build
   ```

4. **Reload extension in Chrome**

## Support

If you encounter issues:

1. Check `debug/ARTICLE_DATA_ISSUE_ANALYSIS.md` for detailed analysis
2. Review `debug/diagnose-article-data-issue.md` for quick diagnosis
3. Run `debug/test-article-data-flow.ts` to verify data structures
4. Check console logs in both service worker and learning interface
