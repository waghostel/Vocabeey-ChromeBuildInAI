# Article Segmentation Diagnostic Guide

## 🎯 Purpose

This guide will help you diagnose why long articles aren't being segmented into multiple parts. Follow these steps to identify the root cause.

---

## 📋 Prerequisites

1. Build the extension with diagnostic logging: `pnpm build`
2. Reload the extension in Chrome (chrome://extensions → click reload)
3. Have a long article ready (1000+ words recommended)

---

## 🔍 Diagnostic Steps

### **Step 1: Test with a Fresh Article**

This will tell us if the segmentation logic itself is working.

#### Actions:

1. **Clear all storage** (to ensure we're testing fresh):
   - Open Chrome DevTools (F12)
   - Go to **Application** tab → **Storage** section
   - Click "Clear site data" or manually clear:
     - Local Storage
     - Session Storage
     - IndexedDB (if any)

2. **Process a new long article**:
   - Find a long article online (1000+ words)
   - Right-click on the page
   - Select your extension's context menu option to process the article

3. **Check the console logs**:
   - Open Chrome DevTools Console
   - Look for these log sections:

#### What to Look For:

**A. In Service Worker Console** (chrome://extensions → Details → Service Worker → Inspect):

```
🔄 === PROCESSING ARTICLE ===
📥 Extracted Content: {
  title: "...",
  contentLength: 5000,  ← Should be large for long articles
  wordCount: 1000,      ← Should be >500 for segmentation
  paragraphCount: 20    ← Should be multiple paragraphs
}

🔪 === ARTICLE SEGMENTATION DIAGNOSTIC ===
📊 Article Info: {
  contentLength: 5000,
  totalWords: 1000,
  maxWordsPerPart: 500
}
📄 Paragraph Detection: {
  paragraphsFound: 20   ← Should be >1 for segmentation
}
✅ Segmentation Complete: {
  totalParts: 3         ← Should be >1 for long articles
}
```

**B. In Learning Interface Console**:

```
📖 === LOADING ARTICLE DIAGNOSTIC ===
📊 Article Structure: {
  partsCount: 3         ← Should match segmentation output
}
📄 Parts Details: [
  { index: 1, wordCount: 450 },
  { index: 2, wordCount: 480 },
  { index: 3, wordCount: 70 }
]
```

#### ✅ Expected Results:

- `paragraphsFound` > 1
- `totalParts` > 1 (for articles >500 words)
- Parts are created with reasonable word counts

#### ❌ Problem Indicators:

- `paragraphsFound: 0` or `1` → Content extraction issue
- `totalParts: 1` despite high word count → Segmentation logic issue
- `partsCount: 0` → Critical structure issue

---

### **Step 2: Test with an Existing Article**

This will tell us if old articles have the parts structure.

#### Actions:

1. **Load an article you processed before** (don't clear storage this time)
2. **Check the console logs** for the same diagnostic output

#### What to Look For:

```
📖 === LOADING ARTICLE DIAGNOSTIC ===
📊 Article Structure: {
  partsCount: ???       ← Check this value
}
```

#### ✅ Expected Results:

- `partsCount` > 1 for long articles

#### ❌ Problem Indicators:

- `partsCount: 0` → Old article missing parts structure
- `partsCount: 1` for long article → Old article not segmented
- Error: "NO PARTS FOUND IN ARTICLE!" → Needs migration

---

### **Step 3: Use the Diagnostic Function**

We've added a special function you can call from the console.

#### Actions:

1. **Open the learning interface** with any article
2. **Open Chrome DevTools Console**
3. **Type and run**: `window.diagnoseArticle()`

#### What to Look For:

```
🔍 === ARTICLE DIAGNOSTIC REPORT ===
📊 Basic Info: { ... }
📄 Parts Structure: {
  hasParts: true/false,  ← Should be true
  partsCount: ???        ← Should be >1 for long articles
}
📝 Parts Details:
  Part 1: { wordCount: 450, ... }
  Part 2: { wordCount: 480, ... }
```

#### ✅ Expected Results:

- `hasParts: true`
- `partsCount` matches article length
- Each part has reasonable word count

#### ❌ Problem Indicators:

- `hasParts: false` → Critical structure issue
- `partsCount: 0` → No parts array
- Error: "NO PARTS ARRAY FOUND!" → Needs migration

---

### **Step 4: Inspect Storage Directly**

This will show us the raw data structure.

#### Actions:

1. **Open Chrome DevTools** → **Application** tab
2. **Navigate to Storage** → **Session Storage**
3. **Look for keys** like `article_<number>`
4. **Click on the key** to see the JSON structure

#### What to Look For:

```json
{
  "id": "article_...",
  "title": "...",
  "parts": [           ← Should exist and be an array
    {
      "id": "article_..._part_1",
      "content": "...",
      "partIndex": 0
    },
    {
      "id": "article_..._part_2",
      "content": "...",
      "partIndex": 1
    }
  ]
}
```

#### ✅ Expected Results:

- `parts` array exists
- Multiple part objects for long articles
- Each part has `id`, `content`, `partIndex`

#### ❌ Problem Indicators:

- No `parts` field → Old article format
- `parts: []` → Empty parts array
- Single part with all content → Not segmented

---

### **Step 5: Check Content Structure**

This will help us understand if the content has proper paragraph breaks.

#### Actions:

1. **In the console**, after loading an article, run:

```javascript
// Check the raw content structure
const article = JSON.parse(
  sessionStorage.getItem('article_' + chrome.devtools.inspectedWindow.tabId)
);
console.log('Content preview:', article.parts[0].content.substring(0, 500));
console.log('Has double newlines:', article.parts[0].content.includes('\n\n'));
console.log(
  'Newline count:',
  (article.parts[0].content.match(/\n/g) || []).length
);
```

#### What to Look For:

- Content should have `\n\n` (double newlines) between paragraphs
- Multiple newlines indicate paragraph structure

#### ❌ Problem Indicators:

- No `\n\n` found → Content is one long string
- Very few newlines → Poor paragraph detection

---

## 📊 Diagnostic Results Summary

After completing the steps above, fill in this checklist:

### Fresh Article Test:

- [ ] Paragraphs detected: **\_** (should be >1)
- [ ] Parts created: **\_** (should be >1 for long articles)
- [ ] Segmentation logs show proper splitting: Yes / No

### Existing Article Test:

- [ ] Parts count: **\_** (should be >1 for long articles)
- [ ] Has parts structure: Yes / No
- [ ] Shows "NO PARTS FOUND" error: Yes / No

### Diagnostic Function:

- [ ] `hasParts`: true / false
- [ ] `partsCount`: **\_**
- [ ] Parts have reasonable word counts: Yes / No

### Storage Inspection:

- [ ] `parts` array exists: Yes / No
- [ ] Multiple parts for long article: Yes / No
- [ ] Parts have proper structure: Yes / No

### Content Structure:

- [ ] Has `\n\n` (paragraph breaks): Yes / No
- [ ] Newline count: **\_**

---

## 🎯 Diagnosis Conclusions

Based on your results, identify which scenario matches:

### **Scenario A: Fresh articles work, old articles don't**

**Root Cause**: Old articles don't have the parts structure
**Solution**: Need to implement migration for old articles

### **Scenario B: No articles are segmented**

**Root Cause**: Segmentation logic issue or content extraction issue
**Solution**: Fix the segmentation algorithm or content extraction

### **Scenario C: Paragraphs not detected**

**Root Cause**: Content doesn't have proper paragraph breaks
**Solution**: Improve paragraph detection with fallback logic

### **Scenario D: Parts created but not displayed**

**Root Cause**: UI rendering issue
**Solution**: Fix the rendering logic in learning-interface.ts

---

## 📝 Report Your Findings

Please share:

1. **Which scenario** matches your situation (A, B, C, or D)
2. **Console logs** from the diagnostic sections (copy/paste)
3. **Storage structure** (screenshot or JSON)
4. **Article details**:
   - Word count
   - Is it a fresh article or existing one?
   - URL (if public)

This information will help me implement the exact fix needed!

---

## 🔧 Quick Fixes to Try

While diagnosing, you can try these quick fixes:

### **If old articles are the issue:**

```javascript
// Run in console to force re-segmentation
// (This is temporary - we'll implement proper migration)
localStorage.clear();
sessionStorage.clear();
// Then reload and process article again
```

### **If content has no paragraph breaks:**

The diagnostic logs will show this, and we'll implement fallback splitting logic.

---

## ✅ Next Steps

Once you've completed the diagnostic:

1. Share your findings
2. I'll implement the specific fix needed
3. We'll test the fix together
4. Deploy the solution

Let's find out what's happening! 🚀
