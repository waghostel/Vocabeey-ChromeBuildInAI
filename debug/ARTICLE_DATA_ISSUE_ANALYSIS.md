# Article Data Issue - Complete Analysis

## Issue Summary

**Error:** "No article data found" when testing https://www.iana.org/help/example-domains

**Root Cause:** Missing article processing step between content extraction and display

## Technical Analysis

### The Problem

The extension has three main components that handle article data:

1. **Content Script** (`src/content/content-script.ts`)
   - Extracts article content from web pages
   - Produces: `ExtractedContent` object

2. **Service Worker** (`src/background/service-worker.ts`)
   - Receives extracted content
   - **PROBLEM:** Stores it directly without processing
   - Should produce: `ProcessedArticle` object

3. **Learning Interface** (`src/ui/learning-interface.ts`)
   - Displays the article
   - **EXPECTS:** `ProcessedArticle` object
   - **RECEIVES:** `ExtractedContent` object (wrong type!)

### Data Flow Diagram

```
┌─────────────────┐
│ Content Script  │
│                 │
│ Extracts from   │
│ web page        │
└────────┬────────┘
         │
         │ ExtractedContent
         │ {
         │   title: string
         │   content: string
         │   url: string
         │   wordCount: number
         │   paragraphCount: number
         │ }
         │
         ▼
┌─────────────────┐
│ Service Worker  │
│                 │
│ ❌ MISSING:     │
│ Article         │
│ Processing      │
│                 │
│ Should convert  │
│ to              │
│ ProcessedArticle│
└────────┬────────┘
         │
         │ ExtractedContent (WRONG!)
         │ Should be: ProcessedArticle
         │
         ▼
┌─────────────────┐
│ Learning        │
│ Interface       │
│                 │
│ Expects:        │
│ ProcessedArticle│
│ {               │
│   id: string    │
│   parts: []     │
│   language: str │
│   status: str   │
│ }               │
│                 │
│ ❌ Gets null    │
│ Shows error     │
└─────────────────┘
```

### Type Mismatch Details

#### ExtractedContent (What's stored)

```typescript
interface ExtractedContent {
  title: string;
  content: string;
  url: string;
  language?: string;
  wordCount: number;
  paragraphCount: number;
}
```

#### ProcessedArticle (What's expected)

```typescript
interface ProcessedArticle {
  id: string; // ❌ Missing
  url: string; // ✅ Present
  title: string; // ✅ Present
  originalLanguage: string; // ❌ Missing (optional in ExtractedContent)
  processedAt: Date; // ❌ Missing
  parts: ArticlePart[]; // ❌ Missing (critical!)
  processingStatus: string; // ❌ Missing
  cacheExpires: Date; // ❌ Missing
}
```

## Code Locations

### 1. Service Worker - Where the bug occurs

**File:** `src/background/service-worker.ts`
**Function:** `handleContentExtracted()` (around line 450)

```typescript
async function handleContentExtracted(
  content: ExtractedContent
): Promise<void> {
  console.log('Content extracted:', content);

  // ❌ BUG: Stores ExtractedContent directly
  await chrome.storage.session.set({
    [`pending_article_${Date.now()}`]: content,
  });

  // Opens learning interface with wrong data type
  await openLearningInterface(content);
}
```

**What it should do:**

```typescript
async function handleContentExtracted(
  content: ExtractedContent
): Promise<void> {
  console.log('Content extracted:', content);

  // ✅ FIX: Process the article first
  const processedArticle = await processArticle(content);

  // Store the processed article
  await chrome.storage.session.set({
    [`pending_article_${Date.now()}`]: processedArticle,
  });

  // Open learning interface with correct data type
  await openLearningInterface(processedArticle);
}
```

### 2. Learning Interface - Where the error appears

**File:** `src/ui/learning-interface.ts`
**Function:** `getArticleData()` (around line 100)

```typescript
async function getArticleData(tabId: number): Promise<ProcessedArticle | null> {
  const data = await chrome.storage.session.get(`article_${tabId}`);

  // ❌ Returns null because data doesn't match ProcessedArticle structure
  return data[`article_${tabId}`] || null;
}
```

### 3. Missing Component - Article Processor

**File:** `src/utils/article-processor.ts` (DOES NOT EXIST!)

This file should contain:

- `processArticle()` function
- Language detection logic
- Content splitting into parts
- ProcessedArticle structure creation

## Solution

### Option 1: Quick Fix (Temporary)

Modify the learning interface to accept ExtractedContent and convert it on the fly:

**File:** `src/ui/learning-interface.ts`

```typescript
async function getArticleData(tabId: number): Promise<ProcessedArticle | null> {
  const data = await chrome.storage.session.get(`article_${tabId}`);
  const extracted = data[`article_${tabId}`];

  if (!extracted) return null;

  // Quick fix: Convert ExtractedContent to ProcessedArticle
  return {
    id: `article_${Date.now()}`,
    url: extracted.url,
    title: extracted.title,
    originalLanguage: extracted.language || 'en',
    processedAt: new Date(),
    parts: [
      {
        id: 'part_1',
        content: extracted.content,
        originalContent: extracted.content,
        vocabulary: [],
        sentences: [],
        partIndex: 0,
      },
    ],
    processingStatus: 'completed',
    cacheExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}
```

### Option 2: Proper Fix (Recommended)

Create a proper article processing pipeline:

#### Step 1: Create Article Processor

**File:** `src/utils/article-processor.ts` (NEW)

```typescript
import type { ExtractedContent, ProcessedArticle, ArticlePart } from '../types';

export async function processArticle(
  extracted: ExtractedContent
): Promise<ProcessedArticle> {
  // Generate unique ID
  const articleId = `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Detect language (use AI or fallback to 'en')
  const language =
    extracted.language || (await detectLanguage(extracted.content)) || 'en';

  // Split content into parts (chunks for better UX)
  const parts = splitContentIntoParts(extracted.content, articleId);

  // Create ProcessedArticle
  return {
    id: articleId,
    url: extracted.url,
    title: extracted.title,
    originalLanguage: language,
    processedAt: new Date(),
    parts,
    processingStatus: 'completed',
    cacheExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

function splitContentIntoParts(
  content: string,
  articleId: string
): ArticlePart[] {
  // Split by paragraphs or by word count (e.g., 500 words per part)
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  // For now, create one part with all content
  // TODO: Implement smart splitting based on word count
  return [
    {
      id: `${articleId}_part_1`,
      content: content,
      originalContent: content,
      vocabulary: [],
      sentences: [],
      partIndex: 0,
    },
  ];
}

async function detectLanguage(text: string): Promise<string> {
  try {
    // Use Chrome AI or Gemini API for language detection
    const response = await chrome.runtime.sendMessage({
      type: 'DETECT_LANGUAGE',
      data: { text: text.substring(0, 1000) }, // First 1000 chars
    });
    return response.language || 'en';
  } catch {
    return 'en'; // Fallback to English
  }
}
```

#### Step 2: Update Service Worker

**File:** `src/background/service-worker.ts`

```typescript
import { processArticle } from '../utils/article-processor';

async function handleContentExtracted(
  content: ExtractedContent
): Promise<void> {
  console.log('Content extracted:', content);

  try {
    // Process the article
    const processedArticle = await processArticle(content);

    // Store processed article temporarily
    await chrome.storage.session.set({
      [`pending_article_${Date.now()}`]: processedArticle,
    });

    // Open learning interface with processed article
    await openLearningInterface(processedArticle);
  } catch (error) {
    console.error('Failed to process article:', error);
    // Handle error appropriately
  }
}
```

#### Step 3: Update openLearningInterface signature

**File:** `src/background/service-worker.ts`

```typescript
async function openLearningInterface(
  content: ProcessedArticle // Changed from ExtractedContent
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

    // Store ProcessedArticle for the new tab
    await chrome.storage.session.set({
      [`article_${tab.id}`]: content,
    });

    return tab.id;
  } catch (error) {
    console.error('Failed to open learning interface:', error);
    throw error;
  }
}
```

## Testing the Fix

### Test Case 1: IANA Example Domains

**URL:** https://www.iana.org/help/example-domains

**Expected Result:**

1. Content extracted successfully ✅
2. Article processed into ProcessedArticle ✅
3. Learning interface displays article ✅
4. No "No article data found" error ✅

### Test Case 2: Short Content

**URL:** Any page with < 100 words

**Expected Result:**

- Should fail validation in content extraction
- Should show appropriate error message

### Test Case 3: Complex Article

**URL:** Long news article or blog post

**Expected Result:**

- Content split into multiple parts
- Each part has unique ID
- Navigation between parts works

## Verification Steps

1. **Check storage after extraction:**

```javascript
// In browser console after clicking extension
chrome.storage.session.get(null, data => {
  console.log('Session storage:', data);
  // Should see ProcessedArticle with id, parts, etc.
});
```

2. **Check learning interface state:**

```javascript
// In learning interface console
console.log('Current article:', state.currentArticle);
// Should show ProcessedArticle structure
```

3. **Run diagnostic test:**

```bash
pnpm test debug/test-article-data-flow.ts
```

## Related Files

- `src/types/index.ts` - Type definitions
- `src/content/content-script.ts` - Content extraction
- `src/background/service-worker.ts` - Message handling
- `src/ui/learning-interface.ts` - Article display
- `src/offscreen/ai-processor.ts` - AI processing
- `src/utils/chrome-ai.ts` - Chrome AI APIs
- `src/utils/gemini-api.ts` - Gemini fallback

## Next Steps

1. **Immediate:** Implement Quick Fix to verify diagnosis
2. **Short-term:** Implement Proper Fix with article processor
3. **Long-term:** Add comprehensive article processing:
   - Smart content splitting
   - Language detection
   - Vocabulary pre-analysis
   - Caching and optimization

## Additional Notes

- The offscreen AI processor already exists and has language detection
- The Chrome AI utilities are already implemented
- Just need to wire them together in the article processing pipeline
- Consider adding loading states during processing
- Add error handling for processing failures
