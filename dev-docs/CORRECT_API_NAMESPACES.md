# Correct Chrome Built-in AI API Namespaces

## Official API Namespaces (Confirmed from Chrome Documentation)

Based on the official Chrome documentation, here are the **correct** API namespaces:

### ✅ Global APIs (NOT window.ai)

These APIs are available as **global objects** in window/self context:

1. **Translator** - Global object
2. **LanguageDetector** - Global object

```javascript
// ✅ CORRECT
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es',
});

const detector = await LanguageDetector.create();
```

### ✅ window.ai APIs

These APIs are available through the **window.ai** namespace:

1. **window.ai.summarizer** - Summarizer API
2. **window.ai.rewriter** - Rewriter API
3. **window.ai.writer** - Writer API
4. **window.ai.languageModel** - Prompt API (formerly assistant)

```javascript
// ✅ CORRECT
const summarizer = await window.ai.summarizer.create({
  type: 'tl;dr',
  format: 'plain-text',
  length: 'medium',
});

const rewriter = await window.ai.rewriter.create({
  tone: 'more-casual',
});

const session = await window.ai.languageModel.create({
  systemPrompt: 'You are a helpful assistant',
});
```

## What Needs to Change in Your Code

### ❌ WRONG - Current Implementation

```typescript
// src/utils/chrome-ai.ts

// WRONG for Translator
if (!window.ai?.translator) { ... }
const capabilities = await window.ai.translator.capabilities();

// WRONG for Language Detector
if (!window.ai?.languageDetector) { ... }
const capabilities = await window.ai.languageDetector.capabilities();

// CORRECT for Summarizer (already correct!)
if (!window.ai?.summarizer) { ... }
const capabilities = await window.ai.summarizer.capabilities();

// CORRECT for Rewriter (already correct!)
if (!window.ai?.rewriter) { ... }
const capabilities = await window.ai.rewriter.capabilities();

// NEEDS UPDATE - assistant is now languageModel
if (!window.ai?.assistant) { ... }
const session = await window.ai.assistant.create();
```

### ✅ CORRECT - Fixed Implementation

```typescript
// src/utils/chrome-ai.ts

// ✅ CORRECT for Translator - Use global object
if (typeof Translator === 'undefined') { ... }
const availability = await Translator.availability({
  sourceLanguage: 'en',
  targetLanguage: 'es'
});
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'es'
});

// ✅ CORRECT for Language Detector - Use global object
if (typeof LanguageDetector === 'undefined') { ... }
const detector = await LanguageDetector.create();

// ✅ CORRECT for Summarizer - Keep as is (window.ai)
if (!window.ai?.summarizer) { ... }
const capabilities = await window.ai.summarizer.capabilities();

// ✅ CORRECT for Rewriter - Keep as is (window.ai)
if (!window.ai?.rewriter) { ... }
const capabilities = await window.ai.rewriter.capabilities();

// ✅ UPDATE - assistant → languageModel
if (!window.ai?.languageModel) { ... }
const session = await window.ai.languageModel.create();
```

## Summary of Required Changes

| API                  | Current (Wrong)              | Correct                     | Action Needed      |
| -------------------- | ---------------------------- | --------------------------- | ------------------ |
| **Translator**       | `window.ai.translator`       | `Translator` (global)       | ✅ **CHANGE**      |
| **LanguageDetector** | `window.ai.languageDetector` | `LanguageDetector` (global) | ✅ **CHANGE**      |
| **Summarizer**       | `window.ai.summarizer`       | `window.ai.summarizer`      | ✅ **NO CHANGE**   |
| **Rewriter**         | `window.ai.rewriter`         | `window.ai.rewriter`        | ✅ **NO CHANGE**   |
| **Prompt API**       | `window.ai.assistant`        | `window.ai.languageModel`   | ⚠️ **UPDATE NAME** |

## Files That Need Updates

### 1. src/utils/chrome-ai.ts

**ChromeTranslator class:**

- Change from `window.ai.translator` to global `Translator`
- Update all capability checks
- Update create() calls

**ChromeLanguageDetector class:**

- Change from `window.ai.languageDetector` to global `LanguageDetector`
- Update all capability checks
- Update create() calls

**ChromeSummarizer class:**

- ✅ No changes needed (already using `window.ai.summarizer`)

**ChromeRewriter class:**

- ✅ No changes needed (already using `window.ai.rewriter`)

**ChromeVocabularyAnalyzer class:**

- Update from `window.ai.assistant` to `window.ai.languageModel`

### 2. Type Definitions

Update your TypeScript type definitions:

```typescript
// Global APIs
declare global {
  const Translator: {
    availability(options: {
      sourceLanguage: string;
      targetLanguage: string;
    }): Promise<'readily' | 'after-download' | 'no'>;

    create(options: {
      sourceLanguage: string;
      targetLanguage: string;
    }): Promise<{
      translate(text: string): Promise<string>;
      destroy(): void;
    }>;
  };

  const LanguageDetector: {
    create(): Promise<{
      detect(text: string): Promise<
        Array<{
          detectedLanguage: string;
          confidence: number;
        }>
      >;
    }>;
  };

  interface Window {
    ai?: {
      summarizer?: any;
      rewriter?: any;
      writer?: any;
      languageModel?: any; // Updated from 'assistant'
    };
  }
}
```

## Why This Matters

1. **Translator and LanguageDetector** are part of the **Translation and Language Detection APIs** which use a different namespace than the other AI APIs
2. **Summarizer, Rewriter, Writer, and Prompt API** are part of the **Prompt API family** which use the `window.ai` namespace
3. The Google Chrome Labs example works because it correctly uses `Translator` as a global object
4. Your code fails because it tries to access `window.ai.translator` which doesn't exist

## Context Availability Reminder

Remember: **NONE** of these APIs work in service workers!

```javascript
// ❌ Service Worker Context
Translator; // Not available
LanguageDetector; // Not available
window.ai; // window is undefined

// ✅ Offscreen Document / Web Page Context
Translator; // Available as global
LanguageDetector; // Available as global
window.ai; // Available on window object
```

You must use your offscreen document to access these APIs!
