# Translation API - Official Documentation vs Our Implementation

## Key Findings from Official Chrome Documentation

### 1. **Global API Access (CRITICAL DIFFERENCE)**

**Official Documentation:**

- The Translator API is accessed via a **global `Translator` object** (not `window.ai.translator`)
- Similar to Language Detector, it's a top-level global API

```javascript
// Official way to check availability
if ('Translator' in self) {
  // The Translator API is supported.
}

// Official way to check language pair support
const translatorCapabilities = await Translator.availability({
  sourceLanguage: 'es',
  targetLanguage: 'fr',
});

// Official way to create translator
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
});
```

**Our Current Implementation:**

```typescript
// ❌ INCORRECT - We're trying to access via window.ai
interface ChromeAI {
  translator?: {
    create(options: {...}): Promise<TranslatorInstance>;
    availability(options: {...}): Promise<string>;
  };
}
```

### 2. **API Structure**

**Official Structure:**

```javascript
// Global Translator API
const Translator = {
  availability: async (options: {
    sourceLanguage: string;
    targetLanguage: string;
  }) => Promise<'readily' | 'after-download' | 'no'>,

  create: async (options: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (m: EventTarget) => void;
  }) => Promise<TranslatorInstance>
};

// Translator Instance
interface TranslatorInstance {
  translate: (text: string) => Promise<string>;
  translateStreaming: (text: string) => AsyncIterable<string>;
  destroy: () => void;
}
```

### 3. **Download Progress Monitoring**

**Official Way:**

```javascript
const translator = await Translator.create({
  sourceLanguage: 'es',
  targetLanguage: 'fr',
  monitor(m) {
    m.addEventListener('downloadprogress', e => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});
```

### 4. **Context Availability**

**Official Documentation States:**

- Available in **top-level windows**
- Available in **same-origin iframes**
- Can be delegated to **cross-origin iframes** via Permissions Policy
- **NOT available in Web Workers** (explicitly stated)
- **NOT available in Service Workers** (implied by context restrictions)

**Our Implementation:**

- ✅ Correctly routes to offscreen document (which is a valid context)
- ❌ Uses wrong API namespace

### 5. **Streaming Support**

**Official API:**

```javascript
const stream = translator.translateStreaming(longText);
for await (const chunk of stream) {
  console.log(chunk);
}
```

**Our Implementation:**

- ❌ We don't implement streaming translation

## Required Fixes

### Fix 1: Update Type Definitions in `chrome-ai.ts`

```typescript
// ============================================================================
// Chrome AI API Type Definitions - CORRECTED
// ============================================================================

// Global Translator API (NOT under window.ai)
interface TranslatorAPI {
  availability(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<'readily' | 'after-download' | 'no'>;

  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (m: EventTarget) => void;
  }): Promise<TranslatorInstance>;
}

interface TranslatorInstance {
  translate(text: string): Promise<string>;
  translateStreaming(text: string): AsyncIterable<string>;
  destroy(): void;
}

// Global Language Detector API (NOT under window.ai)
interface LanguageDetectorAPI {
  create(): Promise<LanguageDetectorInstance>;
}

interface LanguageDetectorInstance {
  detect(text: string): Promise<{ detectedLanguage: string; confidence: number }[]>;
}

// window.ai namespace (for Summarizer, Rewriter, Prompt API only)
interface ChromeAI {
  summarizer?: {
    create(options?: {...}): Promise<SummarizerInstance>;
    capabilities(): Promise<{ available: string }>;
  };
  rewriter?: {
    create(options?: {...}): Promise<RewriterInstance>;
    capabilities(): Promise<{ available: string }>;
  };
  languageModel?: {
    create(options?: {...}): Promise<PromptSession>;
    capabilities(): Promise<{ available: string }>;
  };
  // ❌ NO translator here!
  // ❌ NO languageDetector here!
}

declare global {
  // Global APIs (top-level, not under window.ai)
  const Translator: TranslatorAPI;
  const LanguageDetector: LanguageDetectorAPI;

  interface Window {
    ai?: ChromeAI;
  }
}
```

### Fix 2: Update ChromeTranslator Class

```typescript
export class ChromeTranslator {
  async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    context?: string
  ): Promise<string> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);
      const cached = this.translationCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // ✅ CORRECT: Check for global Translator API
      if (typeof Translator === 'undefined') {
        throw this.createError(
          'api_unavailable',
          'Translator API not available in this context'
        );
      }

      // ✅ CORRECT: Check availability using global Translator
      const availability = await Translator.availability({
        sourceLanguage,
        targetLanguage,
      });

      if (availability === 'no') {
        throw this.createError(
          'api_unavailable',
          `Translation not available for ${sourceLanguage} to ${targetLanguage}`
        );
      }

      // ✅ CORRECT: Create translator using global Translator
      const translator = await this.getTranslator(
        sourceLanguage,
        targetLanguage
      );

      // Translate
      const translation = await translator.translate(text);

      // Cache and return
      this.cacheTranslation(cacheKey, translation);
      return translation;
    } catch (error) {
      // Error handling...
    }
  }

  private async getTranslator(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslatorInstance> {
    const sessionKey = `${sourceLanguage}-${targetLanguage}`;

    let translator = this.activeSessions.get(sessionKey);
    if (!translator) {
      // ✅ CORRECT: Use global Translator.create()
      translator = await Translator.create({
        sourceLanguage,
        targetLanguage,
      });
      this.activeSessions.set(sessionKey, translator);
    }

    return translator;
  }

  async isAvailable(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<boolean> {
    try {
      // ✅ CORRECT: Check for global Translator
      if (typeof Translator === 'undefined') {
        return false;
      }

      const availability = await Translator.availability({
        sourceLanguage,
        targetLanguage,
      });

      return availability === 'readily' || availability === 'after-download';
    } catch {
      return false;
    }
  }
}
```

### Fix 3: Add Streaming Support

```typescript
export class ChromeTranslator {
  /**
   * Translate text with streaming for long content
   */
  async translateStreaming(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      const translator = await this.getTranslator(
        sourceLanguage,
        targetLanguage
      );

      let fullTranslation = '';
      const stream = translator.translateStreaming(text);

      for await (const chunk of stream) {
        fullTranslation += chunk;
        onChunk(chunk);
      }

      return fullTranslation;
    } catch (error) {
      throw this.createError(
        'processing_failed',
        `Streaming translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
```

## Summary of Issues in Our Code

### ❌ Critical Issues:

1. **Wrong API namespace**: Using `window.ai.translator` instead of global `Translator`
2. **Wrong availability check**: Checking `window.ai?.translator` instead of `typeof Translator`
3. **Missing streaming support**: Not implementing `translateStreaming()`

### ✅ What We Got Right:

1. **Context routing**: Correctly routing to offscreen document (valid context)
2. **Caching strategy**: Good implementation of translation caching
3. **Batch translation**: Good approach (though needs API namespace fix)
4. **Error handling**: Proper error handling with fallbacks
5. **Session management**: Good translator instance reuse

## Action Items

1. ✅ Update type definitions to use global `Translator` and `LanguageDetector`
2. ✅ Fix all references from `window.ai.translator` to `Translator`
3. ✅ Fix all references from `window.ai.languageDetector` to `LanguageDetector`
4. ✅ Add streaming translation support
5. ✅ Update availability checks
6. ✅ Test in offscreen document context

## References

- Official Documentation: https://developer.chrome.com/docs/ai/translator-api
- Language Detector API: https://developer.chrome.com/docs/ai/language-detection
- Permissions Policy: https://developer.chrome.com/docs/privacy-security/permissions-policy
