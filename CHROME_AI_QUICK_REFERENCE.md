# Chrome Built-in AI APIs - Quick Reference Guide

## API Namespace Overview

```
Chrome Built-in AI APIs
│
├── Global APIs (top-level, NOT under window.ai)
│   ├── Translator
│   └── LanguageDetector
│
└── window.ai APIs
    ├── summarizer
    ├── rewriter
    └── languageModel (Prompt API)
```

## Quick Usage Examples

### 1. Translator API (Global)

```typescript
// Check availability
if (typeof Translator !== 'undefined') {
  // Check language pair support
  const availability = await Translator.availability({
    sourceLanguage: 'en',
    targetLanguage: 'es',
  });
  // Returns: 'readily' | 'after-download' | 'no'

  // Create translator
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'es',
  });

  // Translate
  const translation = await translator.translate('Hello, world!');
  console.log(translation); // "¡Hola, mundo!"

  // Streaming translation (for long text)
  const stream = translator.translateStreaming(longText);
  for await (const chunk of stream) {
    console.log(chunk);
  }

  // Clean up
  translator.destroy();
}
```

### 2. Language Detector API (Global)

```typescript
// Check availability
if (typeof LanguageDetector !== 'undefined') {
  // Create detector
  const detector = await LanguageDetector.create();

  // Detect language
  const results = await detector.detect('Bonjour le monde');
  console.log(results);
  // [{ detectedLanguage: 'fr', confidence: 0.95 }]

  // Get top result
  const topResult = results[0];
  console.log(topResult.detectedLanguage); // 'fr'
}
```

### 3. Summarizer API (window.ai)

```typescript
// Check availability
if (window.ai?.summarizer) {
  const capabilities = await window.ai.summarizer.capabilities();

  if (capabilities.available === 'readily') {
    // Create summarizer
    const summarizer = await window.ai.summarizer.create({
      type: 'tl;dr',
      format: 'plain-text',
      length: 'medium',
    });

    // Summarize
    const summary = await summarizer.summarize(longArticle);
    console.log(summary);

    // Clean up
    summarizer.destroy();
  }
}
```

### 4. Rewriter API (window.ai)

```typescript
// Check availability
if (window.ai?.rewriter) {
  const capabilities = await window.ai.rewriter.capabilities();

  if (capabilities.available === 'readily') {
    // Create rewriter
    const rewriter = await window.ai.rewriter.create({
      tone: 'more-casual',
      format: 'plain-text',
      length: 'as-is',
    });

    // Rewrite
    const rewritten = await rewriter.rewrite(text);
    console.log(rewritten);

    // Clean up
    rewriter.destroy();
  }
}
```

### 5. Prompt API / languageModel (window.ai)

```typescript
// Check availability
if (window.ai?.languageModel) {
  const capabilities = await window.ai.languageModel.capabilities();

  if (capabilities.available === 'readily') {
    // Create session
    const session = await window.ai.languageModel.create({
      systemPrompt: 'You are a helpful assistant.',
    });

    // Prompt
    const response = await session.prompt('What is the capital of France?');
    console.log(response);

    // Clean up
    session.destroy();
  }
}
```

## Download Progress Monitoring

```typescript
// Translator with download progress
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'ja',
  monitor(m) {
    m.addEventListener('downloadprogress', e => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});
```

## Context Availability Matrix

| API              | Top-level Window | Same-origin iframe | Cross-origin iframe\* | Offscreen Document | Service Worker | Web Worker |
| ---------------- | ---------------- | ------------------ | --------------------- | ------------------ | -------------- | ---------- |
| Translator       | ✅               | ✅                 | ✅                    | ✅                 | ❌             | ❌         |
| LanguageDetector | ✅               | ✅                 | ✅                    | ✅                 | ❌             | ❌         |
| Summarizer       | ✅               | ✅                 | ✅                    | ✅                 | ❌             | ❌         |
| Rewriter         | ✅               | ✅                 | ✅                    | ✅                 | ❌             | ❌         |
| Prompt API       | ✅               | ✅                 | ✅                    | ✅                 | ❌             | ❌         |

\*Requires Permissions Policy

## Permissions Policy for Cross-origin iframes

```html
<!-- Grant Translator API access to cross-origin iframe -->
<iframe src="https://cross-origin.example.com/" allow="translator"> </iframe>

<!-- Grant multiple APIs -->
<iframe
  src="https://cross-origin.example.com/"
  allow="translator; language-detector"
>
</iframe>
```

## Common Patterns

### Pattern 1: Check and Use

```typescript
async function translateText(text: string): Promise<string> {
  if (typeof Translator === 'undefined') {
    throw new Error('Translator API not available');
  }

  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'es',
  });

  try {
    return await translator.translate(text);
  } finally {
    translator.destroy();
  }
}
```

### Pattern 2: Session Reuse

```typescript
class TranslationService {
  private translator: TranslatorInstance | null = null;

  async translate(text: string): Promise<string> {
    if (!this.translator) {
      this.translator = await Translator.create({
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });
    }
    return await this.translator.translate(text);
  }

  destroy() {
    if (this.translator) {
      this.translator.destroy();
      this.translator = null;
    }
  }
}
```

### Pattern 3: Fallback Chain

```typescript
async function translateWithFallback(text: string): Promise<string> {
  // Try Chrome built-in AI
  if (typeof Translator !== 'undefined') {
    try {
      const translator = await Translator.create({
        sourceLanguage: 'en',
        targetLanguage: 'es',
      });
      const result = await translator.translate(text);
      translator.destroy();
      return result;
    } catch (error) {
      console.warn('Chrome AI translation failed:', error);
    }
  }

  // Fallback to cloud API
  return await cloudTranslationAPI.translate(text, 'en', 'es');
}
```

## Error Handling

```typescript
try {
  const translator = await Translator.create({
    sourceLanguage: 'en',
    targetLanguage: 'unknown-lang',
  });
} catch (error) {
  if (error.message.includes('not available')) {
    // Language pair not supported
    console.error('Language pair not supported');
  } else if (error.message.includes('download')) {
    // Model download failed
    console.error('Failed to download translation model');
  } else {
    // Other error
    console.error('Translation error:', error);
  }
}
```

## Best Practices

1. **Always check availability** before using APIs
2. **Reuse sessions** when possible to avoid recreation overhead
3. **Clean up resources** by calling `destroy()` when done
4. **Handle download progress** for better UX
5. **Implement fallbacks** for when APIs are unavailable
6. **Cache translations** to reduce API calls
7. **Use streaming** for long content
8. **Monitor errors** and provide user feedback

## Language Codes

Use BCP 47 language codes:

- `'en'` - English
- `'es'` - Spanish
- `'fr'` - French
- `'de'` - German
- `'ja'` - Japanese
- `'zh'` - Chinese
- `'ko'` - Korean
- `'pt'` - Portuguese
- `'it'` - Italian
- `'ru'` - Russian

## Browser Support

- Chrome 138+ (with flags enabled)
- Edge: Not yet supported
- Firefox: Not supported
- Safari: Not supported

Enable in Chrome:

1. Navigate to `chrome://flags`
2. Enable "Prompt API for Gemini Nano"
3. Enable "Translation API"
4. Restart browser
