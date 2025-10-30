# Root Cause Analysis: "No article data found" on IANA Page

## Summary

The "No article data found" error when testing https://www.iana.org/help/example-domains is likely caused by **one of three issues**:

1. **Content extraction working but article not being stored/retrieved correctly** (most likely)
2. **Content extraction failing due to page structure**
3. **Build or deployment issue**

## Page Structure Analysis

The IANA page has this HTML structure:

```html
<article class="hemmed sidenav">
  <main>
    <div class="help-article">
      <h1>Example Domains</h1>
      <p>As described in RFC 2606 and RFC 6761...</p>
      <p>We provide a web service...</p>
      <h2>Further Reading</h2>
      <ul>
        <li>...</li>
      </ul>
    </div>
  </main>
  <nav id="sidenav"></nav>
</article>
```

**Content:** ~200 words, well above the 100-character and 20-word minimum requirements.

**Extraction:** The content script will find the `<article>` element (first priority), which contains the main content. This should work correctly.

## Code Flow Analysis

### 1. Content Extraction (content-script.ts)

```typescript
function extractContent(): ExtractedContent | null {
  // Strategy 1: Look for article element ✅ WILL FIND IT
  let mainContent: Element | null = document.querySelector('article');

  // ... validation ...

  if (content.length < 100) {
    return null; // ✅ IANA content is ~1000 chars, passes
  }

  return {
    title: title.trim(),
    content: content.trim(),
    url: window.location.href,
    wordCount,
    paragraphCount,
  };
}
```

**Status:** ✅ Should work - IANA page has `<article>` with sufficient content

### 2. Message Sending (content-script.ts)

```typescript
function sendContentToBackground(content: ExtractedContent): void {
  chrome.runtime
    .sendMessage({
      type: 'CONTENT_EXTRACTED',
      data: content,
    })
    .then(response => {
      if (response?.success) {
        showSuccessNotification(); // ✅ Green notification
      } else {
        showErrorNotification('Failed to process article'); // ❌ Red notification
      }
    })
    .catch(() => {
      showErrorNotification('Failed to communicate with extension'); // ❌ Red notification
    });
}
```

**Status:** ⚠️ Check which notification appears

### 3. Article Processing (service-worker.ts)

```typescript
async function handleContentExtracted(
  content: ExtractedContent
): Promise<void> {
  console.log('Content extracted:', content); // 🔍 CHECK THIS LOG

  try {
    console.log('Processing article...'); // 🔍 CHECK THIS LOG
    const processedArticle = await processArticle(content);
    console.log('Article processed successfully:', {
      // 🔍 CHECK THIS LOG
      id: processedArticle.id,
      parts: processedArticle.parts.length,
      language: processedArticle.originalLanguage,
    });

    await chrome.storage.session.set({
      [`pending_article_${Date.now()}`]: processedArticle,
    });

    await openLearningInterface(processedArticle);
  } catch (error) {
    console.error('Failed to process article:', error); // 🔍 CHECK THIS LOG
    // ...
  }
}
```

**Status:** ⚠️ Check service worker console for these logs

### 4. Tab Creation and Storage (service-worker.ts)

```typescript
async function openLearningInterface(
  article: ProcessedArticle
): Promise<number> {
  try {
    const tab = await chrome.tabs.create({
      url: chrome.runtime.getURL('ui/learning-interface.html'),
      active: true,
    });

    if (!tab.id) {
      throw new Error('Failed to create tab');
    }

    memoryManager.registerTab(tab.id);

    // 🔍 CRITICAL: Article stored with NEW tab's ID
    await chrome.storage.session.set({
      [`article_${tab.id}`]: article,
    });

    console.log(`Article stored for tab ${tab.id}:`, {
      // 🔍 CHECK THIS LOG
      id: article.id,
      title: article.title,
      parts: article.parts.length,
    });

    return tab.id;
  } catch (error) {
    console.error('Failed to open learning interface:', error); // 🔍 CHECK THIS LOG
    throw error;
  }
}
```

**Status:** ⚠️ Check if article is stored with correct tab ID

### 5. Article Retrieval (learning-interface.ts)

```typescript
async function getCurrentTabId(): Promise<number> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs[0]?.id) {
    throw new Error('No active tab found');
  }
  return tabs[0].id; // 🔍 CRITICAL: Must match the tab ID used in step 4
}

async function getArticleData(tabId: number): Promise<ProcessedArticle | null> {
  const data = await chrome.storage.session.get(`article_${tabId}`);
  return data[`article_${tabId}`] || null; // 🔍 Returns null if key doesn't exist
}
```

**Status:** ⚠️ This is where the error appears

## Most Likely Root Causes

### Hypothesis 1: Timing Issue (70% probability)

**Problem:** The learning interface loads and tries to get the article before it's stored.

**Evidence needed:**

- Check if "Article stored for tab X" appears AFTER "Loading article..." in console
- Check if adding a delay helps

**Test:**

```javascript
// In learning-interface.ts, add retry logic
async function getArticleData(tabId: number): Promise<ProcessedArticle | null> {
  for (let i = 0; i < 10; i++) {
    const data = await chrome.storage.session.get(`article_${tabId}`);
    if (data[`article_${tabId}`]) {
      return data[`article_${tabId}`];
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return null;
}
```

### Hypothesis 2: Tab ID Mismatch (20% probability)

**Problem:** The tab ID used to store the article doesn't match the tab ID retrieved in the learning interface.

**Evidence needed:**

- Compare tab IDs in service worker console vs learning interface console
- Check if multiple tabs are being created

**Test:**

```javascript
// In learning-interface.ts
async function getArticleData(tabId: number): Promise<ProcessedArticle | null> {
  console.log('Looking for article with tab ID:', tabId);

  const allData = await chrome.storage.session.get(null);
  const articleKeys = Object.keys(allData).filter(k => k.startsWith('article_'));
  console.log('Available article keys:', articleKeys);

  const data = await chrome.storage.session.get(`article_${tabId}`);
  return data[`article_${tabId}`] || null;
}
```

### Hypothesis 3: Article Processing Failure (10% probability)

**Problem:** The `processArticle()` function throws an error for IANA content.

**Evidence needed:**

- Check service worker console for "Failed to process article" error
- Check if language detection fails

**Test:**
Run the diagnostic test:

```bash
pnpm test debug/diagnose-iana-issue.ts
```

## Debugging Steps (In Order)

### Step 1: Check Service Worker Console

1. Go to `chrome://extensions`
2. Find your extension
3. Click "service worker" link
4. Navigate to IANA page
5. Click extension icon
6. Look for these logs in order:

```
Expected logs:
✅ 🚀 Starting content script injection: { tabId: X, url: "..." }
✅ ✅ Content script injection successful: { ... }
✅ Content extracted: { title: "Example Domains", content: "...", ... }
✅ Processing article...
✅ Article processed successfully: { id: "...", parts: 1, language: "en" }
✅ Article stored for tab Y: { id: "...", title: "Example Domains", parts: 1 }
```

**If any log is missing, that's where the problem is.**

### Step 2: Check Page Console

1. On IANA page, open DevTools Console
2. Click extension icon
3. Look for notification:
   - ✅ Green: "✓ Article extracted successfully"
   - ❌ Red: Error message

### Step 3: Check Learning Interface Console

1. After new tab opens, open DevTools Console
2. Look for logs:

```
Expected logs:
✅ Loading article...
✅ Getting article data for tab: Y
✅ Article found: true
```

**If you see "No article data found", run this in console:**

```javascript
chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
  const tabId = tabs[0].id;
  console.log('Current tab ID:', tabId);

  const allData = await chrome.storage.session.get(null);
  const articleKeys = Object.keys(allData).filter(k =>
    k.startsWith('article_')
  );
  console.log('Article keys in storage:', articleKeys);

  if (articleKeys.length > 0) {
    console.log('Article exists but with different tab ID!');
    console.log('Expected key:', `article_${tabId}`);
    console.log('Actual keys:', articleKeys);
  } else {
    console.log('No articles in storage at all!');
  }
});
```

## Quick Fixes

### Fix 1: Add Retry Logic (Recommended)

**File:** `src/ui/learning-interface.ts`

```typescript
async function getArticleData(tabId: number): Promise<ProcessedArticle | null> {
  // Try up to 10 times with 100ms delay
  for (let attempt = 0; attempt < 10; attempt++) {
    const data = await chrome.storage.session.get(`article_${tabId}`);
    const article = data[`article_${tabId}`];

    if (article) {
      if (attempt > 0) {
        console.log(`Article found on attempt ${attempt + 1}`);
      }
      return article;
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.error('Article not found after 10 attempts');

  // Debug: Check what keys exist
  const allData = await chrome.storage.session.get(null);
  const articleKeys = Object.keys(allData).filter(k =>
    k.startsWith('article_')
  );
  console.error('Available article keys:', articleKeys);

  return null;
}
```

### Fix 2: Fallback to Any Article

**File:** `src/ui/learning-interface.ts`

```typescript
async function getArticleData(tabId: number): Promise<ProcessedArticle | null> {
  // Try with expected tab ID first
  const data = await chrome.storage.session.get(`article_${tabId}`);
  let article = data[`article_${tabId}`];

  if (article) {
    return article;
  }

  // Fallback: Find any article key
  console.warn('Article not found with expected tab ID, searching...');
  const allData = await chrome.storage.session.get(null);
  const articleKeys = Object.keys(allData).filter(k =>
    k.startsWith('article_')
  );

  if (articleKeys.length > 0) {
    // Use the most recent one (highest tab ID)
    const latestKey = articleKeys.sort().reverse()[0];
    article = allData[latestKey];
    console.warn('Using article from key:', latestKey);
    return article;
  }

  return null;
}
```

### Fix 3: Add More Logging

**File:** `src/ui/learning-interface.ts`

```typescript
async function initialize(): Promise<void> {
  try {
    showLoading('Loading article...');

    initializeMemoryMonitoring();

    const tabId = await getCurrentTabId();
    console.log('Current tab ID:', tabId); // ADD THIS

    const articleData = await getArticleData(tabId);
    console.log('Article data:', articleData ? 'found' : 'not found'); // ADD THIS

    if (!articleData) {
      // ADD THIS DEBUG INFO
      const allData = await chrome.storage.session.get(null);
      const keys = Object.keys(allData);
      console.error('Storage keys:', keys);
      console.error(
        'Article keys:',
        keys.filter(k => k.startsWith('article_'))
      );

      showError('No article data found');
      return;
    }

    await loadArticle(articleData);
    setupEventListeners();
    hideLoading();
  } catch (error) {
    console.error('Initialization error:', error);
    showError('Failed to load article');
  }
}
```

## Action Plan

1. **First:** Add logging (Fix 3) and rebuild
2. **Test:** Click extension on IANA page
3. **Check:** All three consoles (service worker, page, learning interface)
4. **Identify:** Which hypothesis is correct based on logs
5. **Apply:** Appropriate fix (Fix 1 or Fix 2)
6. **Verify:** Test again

## Expected Working Behavior

When everything works:

1. Click extension on IANA page
2. See green notification
3. New tab opens with article
4. Title: "Example Domains"
5. Content displayed with ~200 words
6. Can highlight words/sentences
7. No console errors

## Files to Check

- `src/content/content-script.ts` - Content extraction
- `src/background/service-worker.ts` - Message handling and storage
- `src/utils/article-processor.ts` - Article processing
- `src/ui/learning-interface.ts` - Article retrieval and display
- `dist/` folder - Built files

## Next Steps

Please follow the debugging steps and report:

1. Which logs appear in service worker console
2. Which notification appears on the page
3. What the learning interface console shows
4. Results of the storage check command

This will help identify the exact root cause.
