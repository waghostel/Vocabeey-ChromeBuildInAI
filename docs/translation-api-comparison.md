# Translation API Implementation Comparison

## Error Analysis

**Current Error**:

```
Translation API not available and no Gemini API key configured
```

**Location**: `service-worker.ts:547` in `handleTranslateText()`

## Key Differences

### 1. API Access Context

| Aspect            | Chrome Labs Demo           | Your Implementation                |
| ----------------- | -------------------------- | ---------------------------------- |
| **Context**       | Regular web page           | Service Worker (background script) |
| **API Access**    | `self.Translator` (global) | `(self as any).ai.translator`      |
| **Window Object** | Available                  | NOT available in service worker    |

### 2. API Namespace

**Chrome Labs (Working)**:

```javascript
// Direct global access
if ('Translator' in self) {
  const availability = await Translator.availability({
    sourceLanguage,
    targetLanguage,
  });

  const translator = await Translator.create({
    sourceLanguage,
    targetLanguage,
  });
}
```

**Your Code (Service Worker)**:

```javascript
// Trying to access via self.ai
if ((self as any).ai && (self as any).ai.translator) {
  const ai = (self as any).ai;
  const capabilities = await ai.translator.capabilities();
  // ...
}
```

**Your Code (Utils - Content Script Context)**:

```javascript
// Trying to access via window.ai
if (!window.ai?.translator) {
  throw new Error('Translator API not available');
}
```

## Root Cause

**The Chrome Translation API is NOT available in Service Workers!**

Chrome's built-in AI APIs have different availability:

| API                | Web Page | Service Worker | Offscreen Document |
| ------------------ | -------- | -------------- | ------------------ |
| `Translator`       | ✅ Yes   | ❌ No          | ✅ Yes             |
| `LanguageDetector` | ✅ Yes   | ❌ No          | ✅ Yes             |
| `Summarizer`       | ✅ Yes   | ❌ No          | ✅ Yes             |
| `Rewriter`         | ✅ Yes   | ❌ No          | ✅ Yes             |
| `ai.languageModel` | ✅ Yes   | ❌ No          | ✅ Yes             |

## Solution

You need to use an **Offscreen Document** to access the Translation API, just like you do for other AI APIs.

### Current Architecture (Broken)

```
Content Script → Service Worker → Try self.ai.translator ❌
                                → Fallback to Gemini
```

### Correct Architecture (Working)

```
Content Script → Service Worker → Offscreen Document → self.Translator ✅
                                → Fallback to Gemini (if offscreen fails)
```

## Implementation Fix

### Step 1: Add Translation to Offscreen Document

**File**: `src/offscreen/offscreen.ts`

```typescript
case 'TRANSLATE_TEXT': {
  const { text, sourceLanguage, targetLanguage, context } = message.data;

  // Check if Translator API is available
  if (!('Translator' in self)) {
    throw new Error('Translator API not available');
  }

  // Check availability
  const availability = await self.Translator.availability({
    sourceLanguage,
    targetLanguage
  });

  if (availability === 'unavailable') {
    throw new Error(`Translation unavailable for ${sourceLanguage} → ${targetLanguage}`);
  }

  // Create translator
  const translator = await self.Translator.create({
    sourceLanguage,
    targetLanguage
  });

  // Translate
  const textToTranslate = context ? `${context}\n\n${text}` : text;
  const translation = await translator.translate(textToTranslate);

  // Extract if context was used
  const result = context ? extractTranslation(translation) : translation;

  sendResponse({ success: true, result });
  break;
}
```

### Step 2: Update Service Worker

**File**: `src/background/service-worker.ts`

```typescript
async function handleTranslateText(payload: {
  text: string;
  context?: string;
  type?: 'vocabulary' | 'sentence';
}): Promise<string> {
  try {
    const { settings } = await chrome.storage.local.get('settings');
    const sourceLanguage = settings?.learningLanguage || 'es';
    const targetLanguage = settings?.nativeLanguage || 'en';

    // Use offscreen document for Translation API
    try {
      await ensureOffscreenDocument();

      const response = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_TEXT',
        data: {
          text: payload.text,
          sourceLanguage,
          targetLanguage,
          context: payload.context,
        },
      });

      if (response?.success) {
        return response.result;
      }
    } catch (offscreenError) {
      console.warn('Offscreen translation failed:', offscreenError);
    }

    // Fallback to Gemini
    const geminiKey = settings?.apiKeys?.gemini;
    if (!geminiKey) {
      throw new Error(
        'Translation API not available and no Gemini API key configured'
      );
    }

    // ... existing Gemini fallback code
  } catch (error) {
    console.error('TRANSLATE_TEXT error:', error);
    throw error;
  }
}
```

## Why This Happens

### Chrome Extension Contexts

1. **Service Worker** (background.js):
   - No DOM access
   - No `window` object
   - Limited AI API access
   - Persistent background process

2. **Content Script**:
   - Has DOM access
   - Has `window` object
   - Can access page-level APIs
   - Runs in page context

3. **Offscreen Document**:
   - Hidden HTML page
   - Has `window` and DOM
   - Full AI API access
   - Created on-demand

### Chrome Labs Demo Context

- Runs as a **regular web page**
- Has full `window` object
- Direct access to `self.Translator`
- No service worker restrictions

## Verification Steps

1. Check if offscreen document is being created:

```javascript
// In service-worker.ts
console.log('Offscreen document created:', await hasOffscreenDocument());
```

2. Check API availability in offscreen:

```javascript
// In offscreen.ts
console.log('Translator available:', 'Translator' in self);
```

3. Test with simple translation:

```javascript
// In offscreen.ts
const translator = await self.Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es',
});
console.log(await translator.translate('Hello'));
```

## Additional Notes

### API Naming Differences

**Chrome Labs uses**:

- `self.Translator` (capital T)
- `self.LanguageDetector` (capital L)

**Your code expects**:

- `self.ai.translator` (lowercase t)
- `window.ai.translator`

This suggests you might be using an older API specification or different API version.

### Correct API Access

According to Chrome's documentation and the working example:

```javascript
// Correct (in web page or offscreen document)
const translator = await self.Translator.create({ ... });
const detector = await self.LanguageDetector.create();

// Incorrect (doesn't exist)
const translator = await self.ai.translator.create({ ... });
const translator = await window.ai.translator.create({ ... });
```

## Recommended Changes

1. ✅ Move translation logic to offscreen document
2. ✅ Use `self.Translator` instead of `self.ai.translator`
3. ✅ Use `Translator.availability()` instead of `capabilities()`
4. ✅ Keep Gemini as fallback
5. ✅ Add proper error handling for unsupported language pairs

## Summary

**Problem**: Trying to access Translation API from Service Worker where it's not available

**Solution**: Use Offscreen Document (like you already do for other AI APIs)

**Quick Fix**: Route translation requests through offscreen document instead of trying to access the API directly in the service worker.
