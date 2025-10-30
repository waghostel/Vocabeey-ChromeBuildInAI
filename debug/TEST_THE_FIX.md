# Testing the Fix for "No article data found"

## ✅ Fix Applied Successfully

The fix has been applied to `src/utils/memory-manager.ts` and the extension has been built successfully.

## What Was Fixed

The memory manager was deleting article data immediately after storing it. The fix ensures that article data is only deleted when the tab **actually navigates away**, not when it **initially loads** the learning interface.

## How to Test

### Step 1: Reload the Extension

1. Open Chrome and go to `chrome://extensions`
2. Find your "Language Learning Chrome Extension"
3. Click the **reload** button (circular arrow icon)
4. Verify the extension reloaded successfully

### Step 2: Open Service Worker Console

1. On the extensions page, find your extension
2. Click the **"service worker"** link (it will say "service worker" in blue)
3. This opens the service worker DevTools console
4. Keep this window open to monitor logs

### Step 3: Test on IANA Page

1. Open a new tab and navigate to: https://www.iana.org/help/example-domains
2. Click your extension icon in the toolbar
3. Watch the service worker console

### Step 4: Verify the Logs

**You should see these logs in order:**

```
✅ 🚀 Starting content script injection: { tabId: X, url: "https://www.iana.org/help/example-domains" }
✅ ✅ Content script injection successful: { ... }
✅ Content extracted: { title: "Example Domains", content: "...", wordCount: ~95 }
✅ Processing article...
✅ Article processed successfully: { id: "...", parts: 1, language: "en" }
✅ Registered tab Y, total active tabs: 1
✅ Article stored for tab Y: { id: "...", title: "Example Domains", parts: 1 }
✅ Tab Y is still on learning interface, keeping registered  ← NEW LOG!
```

**You should NOT see these logs anymore:**

```
❌ Unregistered tab Y, remaining active tabs: 0
❌ Cleaned up storage data for tab Y
❌ Cleaned up resources for tab Y
```

### Step 5: Verify Learning Interface

1. A new tab should open automatically
2. The learning interface should display:
   - **Title:** "Example Domains"
   - **Content:** Article about example domains (RFC 2606, RFC 6761, etc.)
   - **Word count:** ~95 words
   - **No errors**

3. You should be able to:
   - Read the article
   - Switch between Reading/Vocabulary/Sentences tabs
   - Highlight words (though no vocabulary yet)

### Step 6: Test Navigation Away

To verify cleanup still works when actually navigating away:

1. In the learning interface tab, navigate to a different URL (e.g., google.com)
2. Check service worker console
3. You should now see:

```
✅ Tab Y navigated away from learning interface to https://www.google.com
✅ Unregistered tab Y, remaining active tabs: 0
✅ Cleaned up storage data for tab Y
```

This confirms cleanup still works when needed!

## Expected Results

### ✅ Success Indicators

- [ ] Extension reloads without errors
- [ ] Service worker console shows all expected logs
- [ ] "Tab X is still on learning interface, keeping registered" appears
- [ ] NO premature "Unregistered tab" or "Cleaned up storage" logs
- [ ] Learning interface opens and displays article
- [ ] Article title: "Example Domains"
- [ ] Article content visible (~200 words)
- [ ] No "No article data found" error
- [ ] Can switch between tabs (Reading/Vocabulary/Sentences)

### ❌ If It Still Fails

If you still see "No article data found", check:

1. **Service worker console** - Are there any errors?
2. **Learning interface console** - Open DevTools on the learning interface tab
3. **Run this in learning interface console:**

```javascript
chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
  const tabId = tabs[0].id;
  console.log('Current tab ID:', tabId);

  const allData = await chrome.storage.session.get(null);
  const articleKeys = Object.keys(allData).filter(k =>
    k.startsWith('article_')
  );
  console.log('Article keys in storage:', articleKeys);

  const data = await chrome.storage.session.get(`article_${tabId}`);
  console.log('Article data for this tab:', data);
});
```

4. **Report back with:**
   - Service worker console logs
   - Learning interface console output
   - Any error messages

## Test on Other Pages

Once IANA works, test on other pages to ensure the fix is robust:

### Easy Test Pages

1. **Example.com** - https://example.com (very simple)
2. **Wikipedia** - Any Wikipedia article
3. **Medium** - Any Medium article
4. **News sites** - CNN, BBC, etc.

### Expected Behavior

All pages should:

- Extract content successfully
- Store article data
- Keep tab registered
- Display in learning interface
- No premature cleanup

## Troubleshooting

### Issue: Extension won't reload

**Solution:**

- Remove and re-add the extension
- Load from the `dist/` folder

### Issue: Service worker console closes

**Solution:**

- Click "service worker" link again to reopen
- Or use `chrome://serviceworker-internals/`

### Issue: No logs appear

**Solution:**

- Make sure you're looking at the service worker console, not the page console
- Try clicking the extension icon again

### Issue: Different error appears

**Solution:**

- Note the exact error message
- Check both service worker and learning interface consoles
- Report the new error

## Success Confirmation

When everything works, you should see:

1. ✅ Green notification on IANA page: "✓ Article extracted successfully"
2. ✅ New tab opens automatically
3. ✅ Article displays with title and content
4. ✅ No errors in any console
5. ✅ Service worker logs show proper flow
6. ✅ Article data persists until you navigate away

## Next Steps After Testing

Once confirmed working:

1. Test on multiple pages
2. Test navigation away (cleanup should still work)
3. Test closing tabs (cleanup should work)
4. Monitor for memory leaks over time
5. Consider the issue resolved! 🎉

---

**Need Help?**

If you encounter any issues:

1. Check service worker console logs
2. Check learning interface console
3. Run the diagnostic commands above
4. Report back with the console output
