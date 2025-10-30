# Article Data Issue Diagnosis

## Problem

User gets "No article data found" when testing https://www.iana.org/help/example-domains

## Root Cause

The extension has a **missing processing step** between content extraction and display:

### Current Flow (BROKEN)

```
1. Content Script extracts content → ExtractedContent
2. Service Worker stores ExtractedContent directly
3. Learning Interface expects ProcessedArticle → ❌ MISMATCH
```

### Expected Flow (CORRECT)

```
1. Content Script extracts content → ExtractedContent
2. Service Worker processes ExtractedContent → ProcessedArticle
   - Detect language
   - Split into parts
   - Create proper structure
3. Learning Interface receives ProcessedArticle → ✅ WORKS
```

## Data Structure Mismatch

### What's Being Stored (ExtractedContent)

```typescript
{
  title: string;
  content: string;
  url: string;
  language?: string;
  wordCount: number;
  paragraphCount: number;
}
```

### What's Expected (ProcessedArticle)

```typescript
{
  id: string;
  url: string;
  title: string;
  originalLanguage: string;
  processedAt: Date;
  parts: ArticlePart[];
  processingStatus: 'processing' | 'completed' | 'failed';
  cacheExpires: Date;
}
```

## Code Locations

### Service Worker (src/background/service-worker.ts)

**Line ~450-460:** `handleContentExtracted()` function

- Currently: Stores raw `ExtractedContent`
- Should: Process into `ProcessedArticle` before storing

### Learning Interface (src/ui/learning-interface.ts)

**Line ~100-110:** `getArticleData()` function

- Expects: `ProcessedArticle`
- Receives: `ExtractedContent` (wrong type)

## Solution Required

Create an article processing function that:

1. **Takes ExtractedContent as input**
2. **Detects language** using AI processor
3. **Splits content into parts** (chunks for better UX)
4. **Creates ProcessedArticle structure** with:
   - Unique ID
   - Processing timestamps
   - Article parts with IDs
   - Processing status
5. **Stores ProcessedArticle** in session storage

## Test Case

URL: https://www.iana.org/help/example-domains

**Expected behavior:**

- Content extracted successfully
- Article processed into parts
- Learning interface displays article

**Actual behavior:**

- Content extracted successfully ✅
- Article NOT processed ❌
- Learning interface shows "No article data found" ❌

## Files That Need Changes

1. **src/background/service-worker.ts**
   - Add `processArticle()` function
   - Modify `handleContentExtracted()` to call processing

2. **src/utils/article-processor.ts** (NEW FILE NEEDED)
   - Create article processing logic
   - Language detection
   - Content splitting
   - Structure creation

3. **src/offscreen/ai-processor.ts** (Already exists)
   - Already has language detection
   - Already has AI capabilities
   - Just needs to be called properly

## Quick Fix for Testing

To test if this is the issue, you can temporarily modify the learning interface to accept `ExtractedContent` and create a mock `ProcessedArticle`:

```typescript
async function getArticleData(tabId: number): Promise<ProcessedArticle | null> {
  const data = await chrome.storage.session.get(`article_${tabId}`);
  const extracted = data[`article_${tabId}`];

  if (!extracted) return null;

  // Temporary: Convert ExtractedContent to ProcessedArticle
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

This would confirm the diagnosis and allow the article to display.
