# Chrome Built-in AI API Namespaces - Correct Usage

## Two Different API Namespaces

Chrome provides Built-in AI APIs through **two different namespaces** depending on the API:

### 1. Global APIs (Origin Trial APIs)

These are available as **global objects** in window/self context:

```javascript
// ✅ CORRECT - Use global objects
Translator;
LanguageDetector;
```

### 2. Window.ai APIs (Prompt API)

These are available through the **window.ai** namespace:

```javascript
// ✅ CORRECT - Use window.ai
window.ai.languageModel;
window.ai.summarizer;
window.ai.rewriter;
window.ai.writer;
```

## API Breakdown

### Translation & Language Detection (Global APIs)

```javascript
// ❌ WRONG
window.ai.translator;
self.ai.translator;
window.ai.languageDetector;

// ✅ CORRECT
Translator;
LanguageDetector;
```

**Example Usage:**

```javascript
// Check availability
const availability = await Translator.availability({
  sourceLanguage: 'en',
  targetLanguage: 'es',
});

// Create translator
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es',
});

// Translate
const result = await translator.translate('Hello, world!');

// Detect language
const detector = await LanguageDetector.create();
const results = await detector.detect('Hola, mundo!');
```

### Prompt API (window.ai namespace)

```javascript
// ✅ CORRECT
window.ai.languageModel;
window.ai.summarizer;
window.ai.rewriter;
window.ai.writer;
```

**Example Usage:**

```javascript
// Summarizer
const summarizer = await window.ai.summarizer.create({
  type: 'tl;dr',
  format: 'plain-text',
  length: 'medium',
});
const summary = await summarizer.summarize(text);

// Rewriter
const rewriter = await window.ai.rewriter.create({
  tone: 'more-casual',
  format: 'plain-text',
});
const rewritten = await rewriter.rewrite(text);

// Language Model (Prompt API)
const session = await window.ai.languageModel.create({
  systemPrompt: 'You are a helpful assistant',
});
const response = await session.prompt('Hello!');
```

## Context Availability

### Service Worker Context

```javascript
// ❌ NONE of these work in service worker
Translator; // Not available
LanguageDetector; // Not available
window.ai; // window is undefined
self.ai; // ai doesn't exist on self
```

### Offscreen Document / Web Page Context

```javascript
// ✅ These work in offscreen document or web page
Translator; // Available as global
LanguageDetector; // Available as global
window.ai; // Available on window object
```

## Your Code Fixes

### Current (WRONG) Implementation

```typescript
// src/utils/chrome-ai.ts - ChromeTranslator class
async translateText(...) {
  // ❌ WRONG - window.ai.translator doesn't exist
  if (!window.ai?.translator) {
    throw this.createError('api_unavailable', 'Translator API not available');
  }

  const capabilities = await window.ai.translator.capabilities();
  // ...
}
```

### Corrected Implementation

```typescript
// src/utils/chrome-ai.ts - ChromeTranslator class
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

    // ✅ CORRECT - Check for global Translator API
    if (typeof Translator === 'undefined') {
      throw this.createError(
        'api_unavailable',
        'Translator API not available in this context'
      );
    }

    // ✅ CORRECT - Use global Translator.availability()
    const availability = await Translator.availability({
      sourceLanguage,
      targetLanguage
    });

    if (availability === 'no') {
      throw this.createError(
        'api_unavailable',
        `Translation not available for ${sourceLanguage} to ${targetLanguage}`
      );
    }

    // ✅ CORRECT - Use global Translator.create()
    const translator = await Translator.create({
      sourceLanguage,
      targetLanguage
    });

    // Translate with context if provided
    const textToTranslate = context ? `${context}\n\n${text}` : text;
    const translation = await translator.translate(textToTranslate);

    // Clean up
    translator.destroy();

    // Extract translation if context was added
    const finalTranslation = context
      ? this.extractTranslation(translation)
      : translation;

    // Cache the result
    this.cacheTranslation(cacheKey, finalTranslation);

    return finalTranslation;
  } catch (error) {
    if (this.isAIError(error)) {
      throw error;
    }
    throw this.createError(
      'processing_failed',
      `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if Translator API is available for a language pair
 */
async isAvailable(
  sourceLanguage: string,
  targetLanguage: string
): Promise<boolean> {
  try {
    // ✅ CORRECT - Check for global Translator
    if (typeof Translator === 'undefined') {
      return false;
    }

    const availability = await Translator.availability({
      sourceLanguage,
      targetLanguage
    });

    return availability === 'readily' || availability === 'after-download';
  } catch {
    return false;
  }
}
```

### Language Detector Fix

```typescript
// src/utils/chrome-ai.ts - ChromeLanguageDetector class
async detectLanguage(text: string): Promise<string> {
  // Check cache first
  const cacheKey = this.getCacheKey(text);
  const cached = this.cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // ✅ CORRECT - Check for global LanguageDetector API
    if (typeof LanguageDetector === 'undefined') {
      throw this.createError(
        'api_unavailable',
        'Language Detector API not available in this context'
      );
    }

    // ✅ CORRECT - Use global LanguageDetector.create()
    const detector = await LanguageDetector.create();
    const results = await detector.detect(text);

    if (!results || results.length === 0) {
      throw this.createError('processing_failed', 'No language detected');
    }

    // Get the most confident result
    const topResult = results.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev
    );

    const detectedLanguage = topResult.detectedLanguage;

    // Cache the result
    this.cacheResult(cacheKey, detectedLanguage);

    return detectedLanguage;
  } catch (error) {
    if (this.isAIError(error)) {
      throw error;
    }
    throw this.createError(
      'processing_failed',
      `Language detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

async isAvailable(): Promise<boolean> {
  try {
    // ✅ CORRECT - Check for global LanguageDetector
    return typeof LanguageDetector !== 'undefined';
  } catch {
    return false;
  }
}
```

## TypeScript Type Definitions

Update your type definitions to match the correct APIs:

```typescript
// src/utils/chrome-ai.ts - Type Definitions

// ✅ CORRECT - Global API interfaces
interface TranslatorAPI {
  availability(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<'readily' | 'after-download' | 'no'>;

  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<TranslatorInstance>;
}

interface TranslatorInstance {
  translate(text: string): Promise<string>;
  destroy(): void;
}

interface LanguageDetectorAPI {
  create(): Promise<LanguageDetectorInstance>;
}

interface LanguageDetectorInstance {
  detect(text: string): Promise<
    Array<{
      detectedLanguage: string;
      confidence: number;
    }>
  >;
}

// Declare global APIs
declare global {
  const Translator: TranslatorAPI;
  const LanguageDetector: LanguageDetectorAPI;

  interface Window {
    ai?: {
      languageModel?: any;
      summarizer?: any;
      rewriter?: any;
      writer?: any;
    };
  }
}
```

## Summary

| API              | Correct Namespace           | Wrong Namespace                 |
| ---------------- | --------------------------- | ------------------------------- |
| Translator       | `Translator` (global)       | ❌ `window.ai.translator`       |
| LanguageDetector | `LanguageDetector` (global) | ❌ `window.ai.languageDetector` |
| Summarizer       | `window.ai.summarizer`      | ❌ `Summarizer` (global)        |
| Rewriter         | `window.ai.rewriter`        | ❌ `Rewriter` (global)          |
| Language Model   | `window.ai.languageModel`   | ❌ `LanguageModel` (global)     |

**Key Takeaway**: Translation and Language Detection use **global APIs**, while Summarizer, Rewriter, and Language Model use **window.ai namespace**.
