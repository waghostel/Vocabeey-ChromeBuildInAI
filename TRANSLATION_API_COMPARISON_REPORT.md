# Translation API Comparison Report

## Executive Summary

Your translation feature is failing because the Chrome Built-in AI Translation API is **not available in the service worker context**. The working Google Chrome Labs example runs in a **regular web page context** where `window.ai` is accessible, but your extension tries to access it from a service worker where it doesn't exist.

## Error Analysis

### Current Error Messages

```
window.ai exists: false
❌ Translator API not available
Translation API not available and no Gemini API key configured
```

### Root Cause

The service worker is checking for `(self as any).ai` but the Translation API is only available in:

- Regular web pages (window context)
- Offscreen documents
- **NOT in service workers**

## Key Differences

### 1. **Execution Context**

#### Working Example (Google Chrome Labs)

```javascript
// Runs in regular web page context
if ('Translator' in self) {
  const translator = await Translator.create({
    sourceLanguage,
    targetLanguage,
  });
}
```

- ✅ Has access to `window.ai` / `self.ai`
- ✅ Has access to `Translator`, `LanguageDetector` APIs
- ✅ Runs in browser tab with full Web AI API access

#### Your Implementation (Service Worker)

```typescript
// service-worker.ts - line 520
if ((self as any).ai && (self as any).ai.translator) {
  const ai = (self as any).ai;
  // This will NEVER work in service worker!
}
```

- ❌ Service workers **cannot access** `window.ai`
- ❌ Service workers **cannot access** Chrome Built-in AI APIs
- ❌ Wrong execution context

### 2. **API Access Pattern**

#### Working Example

```javascript
// Direct access to global Translator API
const availability = await Translator.availability({
  sourceLanguage,
  targetLanguage,
});

const translator = await Translator.create({
  sourceLanguage,
  targetLanguage,
});

const translation = await translator.translate(text);
```

#### Your Implementation

```typescript
// Trying to access through window.ai (which doesn't exist in service worker)
if (!window.ai?.translator) {
  throw this.createError('api_unavailable', 'Translator API not available');
}

const capabilities = await window.ai.translator.capabilities();
```

### 3. **Correct API Namespace**

The working example uses:

- `Translator` (global)
- `LanguageDetector` (global)

Your code tries to use:

- `window.ai.translator` ❌
- `self.ai.translator` ❌

## Solution: Use Offscreen Document

Your extension **already has** the infrastructure for this! You have an offscreen document system but aren't using it for translation.

### Architecture Fix

```
Content Script → Service Worker → Offscreen Document → Chrome AI APIs
     ↓                ↓                    ↓
  User Action    Message Router      Actual AI Processing
```

### Implementation Steps

#### Step 1: Update Offscreen Document (ai-processor.ts)

Add translation handler to your offscreen document:

```typescript
// src/offscreen/ai-processor.ts

case 'TRANSLATE_TEXT':
  handleTranslateText(message.payload)
    .then(result => sendResponse({ success: true, data: result }))
    .catch(error => sendResponse({ success: false, error: error.message }));
  return true;

async function handleTranslateText(payload: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  context?: string;
}): Promise<{ translation: string }> {
  try {
    // Check if Translator API is available
    if (!('Translator' in self)) {
      throw new Error('Translator API not available');
    }

    // Check language pair availability
    const availability = await (self as any).Translator.availability({
      sourceLanguage: payload.sourceLanguage,
      targetLanguage: payload.targetLanguage
    });

    if (availability === 'no') {
      throw new Error(`Translation not available for ${payload.sourceLanguage} to ${payload.targetLanguage}`);
    }

    // Create translator
    const translator = await (self as any).Translator.create({
      sourceLanguage: payload.sourceLanguage,
      targetLanguage: payload.targetLanguage
    });

    // Translate with context if provided
    const textToTranslate = payload.context
      ? `${payload.context}\n\n${payload.text}`
      : payload.text;

    const translation = await translator.translate(textToTranslate);

    // Clean up
    translator.destroy();

    // Extract translation if context was added
    const finalTranslation = payload.context
      ? extractTranslationFromContext(translation)
      : translation;

    return { translation: finalTranslation };
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

function extractTranslationFromContext(fullTranslation: string): string {
  const parts = fullTranslation.split(/\n\n+/);
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return fullTranslation.trim();
}
```

#### Step 2: Update Service Worker

Remove the direct AI access attempt and route through offscreen:

```typescript
// src/background/service-worker.ts

async function handleTranslateText(payload: {
  text: string;
  context?: string;
  type?: 'vocabulary' | 'sentence';
}): Promise<string> {
  try {
    console.log('TRANSLATE_TEXT request:', payload);

    // Get user settings for language preferences
    const { settings } = await chrome.storage.local.get('settings');
    const sourceLanguage = settings?.learningLanguage || 'es';
    const targetLanguage = settings?.nativeLanguage || 'en';

    // Route to offscreen document for Chrome AI processing
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_TEXT',
        payload: {
          text: payload.text,
          sourceLanguage,
          targetLanguage,
          context: payload.context,
        },
      });

      if (response.success) {
        console.log(
          'Translation successful (Chrome AI):',
          response.data.translation
        );
        return response.data.translation;
      }
    } catch (chromeAIError) {
      console.warn(
        'Chrome AI translation failed, falling back to Gemini:',
        chromeAIError
      );
    }

    // Fallback to Gemini API
    const { apiKeys } = settings || {};
    const geminiKey = apiKeys?.gemini;

    if (!geminiKey) {
      throw new Error(
        'Translation API not available and no Gemini API key configured'
      );
    }

    const { GeminiAPIClient } = await import('../utils/gemini-api');
    const geminiAPI = new GeminiAPIClient({ apiKey: geminiKey });

    const translation = await geminiAPI.translateText(
      payload.text,
      sourceLanguage,
      targetLanguage
    );

    console.log('Translation successful (Gemini):', translation);
    return translation;
  } catch (error) {
    console.error('TRANSLATE_TEXT error:', error);
    throw error;
  }
}
```

#### Step 3: Update Chrome AI Utility

Your `chrome-ai.ts` should only be used in contexts where `window.ai` exists (offscreen documents, not service workers):

```typescript
// src/utils/chrome-ai.ts

// Add a check at the top of ChromeTranslator methods
async translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  context?: string
): Promise<string> {
  try {
    // Check if we're in the right context
    if (typeof window === 'undefined' || !window.ai) {
      throw this.createError(
        'api_unavailable',
        'Translator API only available in window context (offscreen document)'
      );
    }

    // ... rest of implementation
  }
}
```

## Testing the Fix

### 1. Check API Availability in Offscreen Document

Add this test to your offscreen document:

```javascript
// In offscreen document console
console.log('Translator available:', 'Translator' in self);
console.log('LanguageDetector available:', 'LanguageDetector' in self);
console.log(
  'window.ai available:',
  typeof window !== 'undefined' && 'ai' in window
);
```

### 2. Test Translation Flow

```javascript
// Test message to offscreen
chrome.runtime.sendMessage(
  {
    type: 'TRANSLATE_TEXT',
    payload: {
      text: 'Hello, world!',
      sourceLanguage: 'en',
      targetLanguage: 'es',
    },
  },
  response => {
    console.log('Translation result:', response);
  }
);
```

## Chrome Flags Required

Make sure these flags are enabled in `chrome://flags`:

1. **Translator API**: `chrome://flags/#translation-api`
2. **Language Detection API**: `chrome://flags/#language-detection-api`
3. **Prompt API**: `chrome://flags/#prompt-api-for-gemini-nano`

## Summary of Changes Needed

1. ✅ **Move translation logic to offscreen document** - This is where Chrome AI APIs are accessible
2. ✅ **Update service worker** - Route translation requests to offscreen instead of trying direct access
3. ✅ **Keep chrome-ai.ts for offscreen use only** - Add context checks
4. ✅ **Ensure offscreen document is created** - Your offscreen-manager.ts should handle this
5. ✅ **Test in correct context** - Offscreen document, not service worker

## Why the Google Example Works

The Google Chrome Labs example works because:

- It's a **regular web page**, not an extension
- It runs in **window context** with full access to Web AI APIs
- It uses the **global `Translator` API** directly
- No service worker limitations

Your extension needs to:

- Use **offscreen documents** for AI processing
- Route requests from **service worker → offscreen**
- Access APIs in the **correct context**

## Next Steps

1. Update `src/offscreen/ai-processor.ts` with translation handler
2. Modify `src/background/service-worker.ts` to route through offscreen
3. Test with Chrome flags enabled
4. Verify offscreen document is created on extension load
5. Check console logs in offscreen document (not service worker)
