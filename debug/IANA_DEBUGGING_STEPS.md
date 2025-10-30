# Debugging "No article data found" for IANA Example Domains

## Issue

When testing https://www.iana.org/help/example-domains, you get "No article data found" error.

## Root Cause Analysis

Based on the code review, the article processing pipeline is correctly implemented:

1. ✅ Content script extracts content
2. ✅ Service worker processes it with `processArticle()`
3. ✅ Service worker stores it with correct key
4. ✅ Learning interface retrieves it

**The issue is likely one of these:**

### Possibility 1: Content Extraction Failure

The IANA page might not have the expected HTML structure.

**How to check:**

1. Open https://www.iana.org/help/example-domains
2. Open DevTools Console
3. Run this code:

```javascript
// Check for content containers
console.log('article:', document.querySelector('article'));
console.log('main:', document.querySelector('main'));
console.log('#content:', document.querySelector('#content'));

// Check what would be extracted
const main =
  document.querySelector('main') || document.querySelector('#content');
if (main) {
  const text = main.textContent;
  console.log('Content length:', text.length);
  console.log(
    'Word count:',
    text.split(/\s+/).filter(w => w.length > 0).length
  );
  console.log('First 200 chars:', text.substring(0, 200));
}
```

**Expected result:** Should find content with >100 characters and >20 words.

### Possibility 2: Timing Issue

The learning interface might load before the article is stored.

**How to check:**

1. Click the extension icon on IANA page
2. When the new tab opens, immediately open DevTools Console
3. Run this code:

```javascript
// Check what's in session storage
chrome.storage.session.get(null, data => {
  console.log('All session storage:', data);

  // Look for article keys
  const articleKeys = Object.keys(data).filter(k => k.startsWith('article_'));
  console.log('Article keys found:', articleKeys);

  // Get current tab ID
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const currentTabId = tabs[0].id;
    console.log('Current tab ID:', currentTabId);
    console.log('Looking for key:', `article_${currentTabId}`);
    console.log('Article data:', data[`article_${currentTabId}`]);
  });
});
```

**Expected result:** Should find an article with the current tab ID.

### Possibility 3: Build Issue

The extension might not be built correctly.

**How to check:**

1. Run `pnpm build`
2. Check that `dist/content/content-script.js` exists
3. Check that `dist/background/service-worker.js` exists
4. Check that `dist/utils/article-processor.js` exists
5. Reload the extension in Chrome

### Possibility 4: Content Script Not Injecting

The content script might fail to inject on the IANA page.

**How to check:**

1. Open https://www.iana.org/help/example-domains
2. Open DevTools Console
3. Click the extension icon
4. Look for console messages:
   - "Content extracted:" (from content script)
   - "Processing article..." (from service worker)
   - "Article processed successfully:" (from service worker)

**If you don't see these messages:**

- Content script failed to inject
- Check service worker console for injection errors

## Step-by-Step Debugging Process

### Step 1: Check Service Worker Console

1. Go to `chrome://extensions`
2. Find your extension
3. Click "service worker" link
4. This opens the service worker console
5. Navigate to IANA page and click extension icon
6. Look for these messages:

```
🚀 Starting content script injection: { tabId: X, url: "https://www.iana.org/help/example-domains" }
✅ Content script injection successful: { path: "content/content-script.js", tabId: X }
Content extracted: { title: "...", content: "...", url: "...", wordCount: X }
Processing article...
Article processed successfully: { id: "...", parts: 1, language: "en" }
Article stored for tab Y: { id: "...", title: "...", parts: 1 }
```

**If you see errors instead:**

- Note the error message
- Check if it's a file path issue
- Check if it's a permissions issue

### Step 2: Check Content Script Execution

1. Open https://www.iana.org/help/example-domains
2. Open DevTools Console (on the page, not extension)
3. Click extension icon
4. Look for notification or console messages

**Expected:**

- Green notification: "✓ Article extracted successfully"
- OR Red notification: "✗ Could not find article content on this page"

### Step 3: Check Learning Interface Console

1. After clicking extension icon, new tab opens
2. Open DevTools Console on the learning interface tab
3. Look for these messages:

```
Loading article...
Current article: { id: "...", title: "...", parts: [...] }
```

**If you see "No article data found":**

- The article wasn't stored correctly
- OR the tab ID doesn't match

### Step 4: Manual Storage Check

In the learning interface console, run:

```javascript
// Get current tab ID
chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
  const tabId = tabs[0].id;
  console.log('Current tab ID:', tabId);

  // Check session storage
  const data = await chrome.storage.session.get(`article_${tabId}`);
  console.log('Article data:', data);

  // Check all article keys
  const allData = await chrome.storage.session.get(null);
  const articleKeys = Object.keys(allData).filter(k =>
    k.startsWith('article_')
  );
  console.log('All article keys:', articleKeys);

  // Try to get any article
  if (articleKeys.length > 0) {
    const firstKey = articleKeys[0];
    console.log('First article:', allData[firstKey]);
  }
});
```

## Quick Fixes to Try

### Fix 1: Add More Logging

Add this to `src/ui/learning-interface.ts` in the `getArticleData` function:

```typescript
async function getArticleData(tabId: number): Promise<ProcessedArticle | null> {
  console.log('Getting article data for tab:', tabId);

  const data = await chrome.storage.session.get(`article_${tabId}`);
  console.log('Storage data:', data);

  const article = data[`article_${tabId}`];
  console.log('Article found:', !!article);

  if (article) {
    console.log('Article details:', {
      id: article.id,
      title: article.title,
      parts: article.parts?.length,
    });
  }

  return article || null;
}
```

### Fix 2: Add Retry Logic

If it's a timing issue, add retry logic:

```typescript
async function getArticleData(tabId: number): Promise<ProcessedArticle | null> {
  // Try multiple times with delay
  for (let i = 0; i < 5; i++) {
    const data = await chrome.storage.session.get(`article_${tabId}`);
    const article = data[`article_${tabId}`];

    if (article) {
      console.log(`Article found on attempt ${i + 1}`);
      return article;
    }

    console.log(`Attempt ${i + 1}: No article found, retrying...`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.error('Article not found after 5 attempts');
  return null;
}
```

### Fix 3: Check All Storage Keys

If the tab ID is wrong, try finding any article:

```typescript
async function getArticleData(tabId: number): Promise<ProcessedArticle | null> {
  // First try with the expected tab ID
  const data = await chrome.storage.session.get(`article_${tabId}`);
  let article = data[`article_${tabId}`];

  if (article) {
    return article;
  }

  // If not found, look for any article key
  console.warn('Article not found with tab ID, searching all keys...');
  const allData = await chrome.storage.session.get(null);
  const articleKeys = Object.keys(allData).filter(k =>
    k.startsWith('article_')
  );

  if (articleKeys.length > 0) {
    console.log('Found article keys:', articleKeys);
    // Use the most recent one
    const latestKey = articleKeys[articleKeys.length - 1];
    article = allData[latestKey];
    console.log('Using article from key:', latestKey);
    return article;
  }

  return null;
}
```

## Expected Behavior

When everything works correctly:

1. **On IANA page:**
   - Click extension icon
   - See green notification: "✓ Article extracted successfully"
   - New tab opens automatically

2. **In learning interface:**
   - Article title: "Example Domains"
   - Article content displayed
   - Can highlight words/sentences
   - No errors in console

3. **In service worker console:**
   - All steps logged successfully
   - No errors

## Next Steps

1. Follow the debugging steps above
2. Note which step fails
3. Check the console messages
4. Try the relevant quick fix
5. Report back with:
   - Which step failed
   - Console error messages
   - Whether quick fixes helped

## Common Issues and Solutions

| Issue                            | Cause                                       | Solution                                   |
| -------------------------------- | ------------------------------------------- | ------------------------------------------ |
| "Could not find article content" | IANA page structure doesn't match selectors | Update content extraction selectors        |
| "No article data found"          | Timing issue or tab ID mismatch             | Add retry logic or use fallback key search |
| No notification appears          | Content script not injecting                | Check build output and reload extension    |
| Service worker errors            | File path issues                            | Run `pnpm build` and check dist/ folder    |
| Empty content extracted          | Wrong element selected                      | Check DOM structure and update selectors   |

## Test with Different Pages

Try these pages to isolate the issue:

1. **Simple page:** https://example.com (very simple structure)
2. **News article:** Any major news site article
3. **Blog post:** Medium article or similar
4. **IANA page:** https://www.iana.org/help/example-domains

If it works on some but not IANA, it's a content extraction issue.
If it doesn't work on any page, it's a more fundamental issue.
