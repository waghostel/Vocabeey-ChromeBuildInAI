A# Chrome Built-in AI APIs - Code Snippets Guide

This document provides code snippets for implementing Chrome's Built-in AI APIs, focusing on model download triggers and language learning use cases.

## Table of Contents

1. [Language Detector API](#language-detector-api)
2. [Summarizer API](#summarizer-api)
3. [Rewriter API](#rewriter-api)
4. [Translator API](#translator-api)
5. [Prompt API (Language Model)](#prompt-api-language-model)
6. [Model Download Patterns](#model-download-patterns)
7. [Language Learning Patterns](#language-learning-patterns)

---

## Language Detector API

**Reference**: https://developer.chrome.com/docs/ai/language-detection

### Check Availability

```typescript
async function checkLanguageDetectorAvailability(): Promise<string> {
  if (typeof LanguageDetector === 'undefined') {
    return 'unavailable';
  }

  // This is a placeholder for the actual capabilities check
  return 'readily';
}
```

### Trigger Model Download

```typescript
async function triggerLanguageDetectorDownload(): Promise<void> {
  const status = await checkLanguageDetectorAvailability();

  if (status === 'downloadable') {
    // Requires user activation (click, tap, key press)
    const detector = await LanguageDetector.create();
    console.log('Language Detector download triggered');
    // Keep detector alive to ensure download completes
  }
}
```

### Detect Language (Language Learning Use Case)

```typescript
async function detectArticleLanguage(text: string): Promise<string> {
  try {
    const detector = await LanguageDetector.create();
    const results = await detector.detect(text);

    // Get highest confidence result
    const bestMatch = results.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev
    );

    return bestMatch.detectedLanguage; // e.g., 'en', 'es', 'fr'
  } catch (error) {
    console.error('Language detection failed:', error);
    throw error;
  }
}
```

### With Caching (Production Pattern)

```typescript
class LanguageDetectorWithCache {
  private cache = new Map<string, string>();
  private detector: any = null;

  async detectLanguage(text: string): Promise<string> {
    // Cache key: first 200 chars
    const cacheKey = text.slice(0, 200).trim();

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (!this.detector) {
      this.detector = await LanguageDetector.create();
    }

    const results = await this.detector.detect(text);
    const language = results[0]?.detectedLanguage || 'unknown';

    this.cache.set(cacheKey, language);
    return language;
  }
}
```

---

## Summarizer API

**Reference**: https://developer.chrome.com/docs/ai/summarizer-api

### Check Availability

```typescript
async function checkSummarizerAvailability(): Promise<string> {
  if (!window.ai?.summarizer) {
    return 'unavailable';
  }

  const capabilities = await window.ai.summarizer.capabilities();
  return capabilities.available;
}
```

### Trigger Model Download

```typescript
async function triggerSummarizerDownload(): Promise<void> {
  const status = await checkSummarizerAvailability();

  if (status === 'downloadable') {
    // Requires user activation
    const summarizer = await window.ai.summarizer.create({
      type: 'key-points',
      format: 'plain-text',
      length: 'medium',
    });
    console.log('Summarizer download triggered');
  }
}
```

### Summarize Article (Language Learning Use Case)

```typescript
async function summarizeArticleForLearning(
  text: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<string> {
  const lengthMap = {
    beginner: 'short',
    intermediate: 'medium',
    advanced: 'long',
  };

  const summarizer = await window.ai.summarizer.create({
    type: 'key-points',
    format: 'plain-text',
    length: lengthMap[difficulty],
  });

  try {
    const summary = await summarizer.summarize(text);
    return summary;
  } finally {
    summarizer.destroy(); // Clean up
  }
}
```

### Streaming Summary (For Long Articles)

```typescript
async function streamSummary(
  text: string,
  onChunk: (chunk: string) => void
): Promise<void> {
  const summarizer = await window.ai.summarizer.create({
    type: 'key-points',
    format: 'plain-text',
    length: 'medium',
  });

  try {
    const stream = await summarizer.summarizeStreaming(text);

    for await (const chunk of stream) {
      onChunk(chunk);
    }
  } finally {
    summarizer.destroy();
  }
}
```

---

## Rewriter API

**Reference**: https://developer.chrome.com/docs/ai/rewriter-api

### Check Availability

```typescript
async function checkRewriterAvailability(): Promise<string> {
  if (!window.ai?.rewriter) {
    return 'unavailable';
  }

  const capabilities = await window.ai.rewriter.capabilities();
  return capabilities.available;
}
```

### Trigger Model Download

```typescript
async function triggerRewriterDownload(): Promise<void> {
  const status = await checkRewriterAvailability();

  if (status === 'downloadable') {
    // Requires user activation
    const rewriter = await window.ai.rewriter.create({
      tone: 'neutral',
      length: 'as-is',
    });
    console.log('Rewriter download triggered');
  }
}
```

### Rewrite for Difficulty Level (Language Learning Use Case)

```typescript
async function rewriteForDifficulty(
  text: string,
  difficulty: number // 1-10 scale
): Promise<string> {
  // Map difficulty to tone and length
  const tone =
    difficulty <= 3 ? 'casual' : difficulty <= 7 ? 'neutral' : 'formal';
  const length = difficulty <= 3 ? 'shorter' : 'as-is';

  const rewriter = await window.ai.rewriter.create({
    tone,
    length,
    format: 'plain-text',
  });

  try {
    const rewritten = await rewriter.rewrite(text);
    return rewritten;
  } finally {
    rewriter.destroy();
  }
}
```

### Simplify Vocabulary (Beginner Learners)

```typescript
async function simplifyTextForBeginners(text: string): Promise<string> {
  const rewriter = await window.ai.rewriter.create({
    tone: 'casual',
    length: 'shorter',
    format: 'plain-text',
  });

  try {
    const simplified = await rewriter.rewrite(text);
    return simplified;
  } finally {
    rewriter.destroy();
  }
}
```

---

## Translator API

**Reference**: https://developer.chrome.com/docs/ai/translator-api

### Check Availability

```typescript
async function checkTranslatorAvailability(
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  if (typeof Translator === 'undefined') {
    return 'unavailable';
  }

  const availability = await Translator.availability({
    sourceLanguage,
    targetLanguage,
  });

  return availability; // 'readily', 'after-download', 'no'
}
```

### Trigger Model Download

```typescript
async function triggerTranslatorDownload(
  sourceLanguage: string,
  targetLanguage: string
): Promise<void> {
  const status = await checkTranslatorAvailability(
    sourceLanguage,
    targetLanguage
  );

  if (status === 'after-download') {
    // Requires user activation
    const translator = await Translator.create({
      sourceLanguage,
      targetLanguage,
    });
    console.log(
      `Translator ${sourceLanguage}->${targetLanguage} download triggered`
    );
  }
}
```

### Translate Vocabulary (Language Learning Use Case)

```typescript
async function translateVocabulary(
  word: string,
  learningLanguage: string,
  nativeLanguage: string
): Promise<string> {
  const translator = await Translator.create({
    sourceLanguage: learningLanguage,
    targetLanguage: nativeLanguage,
  });

  try {
    const translation = await translator.translate(word);
    return translation;
  } finally {
    translator.destroy();
  }
}
```

### Translate Sentence with Context

```typescript
async function translateSentenceWithContext(
  sentence: string,
  context: string,
  learningLanguage: string,
  nativeLanguage: string
): Promise<string> {
  const translator = await Translator.create({
    sourceLanguage: learningLanguage,
    targetLanguage: nativeLanguage,
  });

  try {
    // Include context for better translation
    const fullText = `${context}\n\n${sentence}`;
    const translation = await translator.translate(fullText);

    // Extract just the sentence translation
    const lines = translation.split('\n');
    return lines[lines.length - 1];
  } finally {
    translator.destroy();
  }
}
```

### Batch Translation (Efficient)

```typescript
import { ChromeTranslator, TranslationRequest } from '../utils/chrome-ai';

async function batchTranslateVocabulary(
  words: string[],
  learningLanguage: string,
  nativeLanguage: string
): Promise<Map<string, string>> {
  const translator = new ChromeTranslator();
  const requests: TranslationRequest[] = words.map(word => ({ text: word }));

  const results = await translator.batchTranslate(
    requests,
    learningLanguage,
    nativeLanguage
  );

  const translations = new Map<string, string>();
  for (const result of results) {
    translations.set(result.original, result.translation);
  }

  return translations;
}
```

---

## Prompt API (Language Model)

**Reference**: https://developer.chrome.com/docs/ai/prompt-api

### Check Availability

```typescript
async function checkLanguageModelAvailability(): Promise<string> {
  if (!window.ai?.languageModel) {
    return 'unavailable';
  }

  const capabilities = await window.ai.languageModel.capabilities();
  return capabilities.available;
}
```

### Trigger Model Download (Gemini Nano)

```typescript
async function triggerGeminiNanoDownload(): Promise<void> {
  const status = await checkLanguageModelAvailability();

  if (status === 'downloadable') {
    // Requires user activation - this is the KEY to trigger download
    const session = await window.ai.languageModel.create({
      systemPrompt: 'You are a language learning assistant.',
    });
    console.log('Gemini Nano download triggered');

    // Keep session alive or use it
    const response = await session.prompt('Hello');
    console.log('Model ready:', response);

    session.destroy();
  }
}
```

### Monitor Download Progress

```typescript
async function monitorModelDownload(
  onProgress: (progress: number) => void
): Promise<void> {
  const session = await window.ai.languageModel.create({
    monitor: m => {
      m.addEventListener('downloadprogress', e => {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      });
    },
  });
}
```

### Analyze Vocabulary Difficulty (Language Learning Use Case)

```typescript
async function analyzeVocabularyDifficulty(
  words: string[],
  context: string,
  learningLanguage: string
): Promise<Array<{ word: string; difficulty: number; explanation: string }>> {
  const session = await window.ai.languageModel.create({
    systemPrompt: `You are a language learning assistant. Analyze vocabulary difficulty on a scale of 1-10 for ${learningLanguage} learners.`,
  });

  try {
    const prompt = `
Analyze these words from the context: ${words.join(', ')}

Context: ${context}

For each word, provide:
1. Difficulty level (1-10)
2. Brief explanation

Format as JSON array.
`;

    const response = await session.prompt(prompt);
    return JSON.parse(response);
  } finally {
    session.destroy();
  }
}
```

### Generate Example Sentences

```typescript
async function generateExampleSentences(
  word: string,
  learningLanguage: string,
  difficulty: number
): Promise<string[]> {
  const session = await window.ai.languageModel.create({
    systemPrompt: `You are a ${learningLanguage} language teacher. Generate example sentences appropriate for difficulty level ${difficulty}/10.`,
  });

  try {
    const prompt = `Generate 3 example sentences using the word "${word}" in ${learningLanguage}. Make them contextually relevant and at difficulty level ${difficulty}/10.`;

    const response = await session.prompt(prompt);
    return response.split('\n').filter(line => line.trim());
  } finally {
    session.destroy();
  }
}
```

### Streaming Response (For Long Analysis)

```typescript
async function streamVocabularyAnalysis(
  words: string[],
  onChunk: (chunk: string) => void
): Promise<void> {
  const session = await window.ai.languageModel.create({
    systemPrompt: 'You are a language learning assistant.',
  });

  try {
    const prompt = `Analyze these vocabulary words: ${words.join(', ')}`;
    const stream = await session.promptStreaming(prompt);

    for await (const chunk of stream) {
      onChunk(chunk);
    }
  } finally {
    session.destroy();
  }
}
```

---

## Model Download Patterns

### Universal Download Trigger with User Activation

```typescript
async function triggerAllModelsDownload(): Promise<void> {
  // This function should be called from a user gesture (button click)

  const apis = [
    { name: 'Language Detector', api: window.ai?.languageDetector },
    { name: 'Summarizer', api: window.ai?.summarizer },
    { name: 'Rewriter', api: window.ai?.rewriter },
    { name: 'Translator', api: window.ai?.translator },
    { name: 'Language Model', api: window.ai?.languageModel },
  ];

  for (const { name, api } of apis) {
    if (!api) continue;

    try {
      const caps = await api.capabilities();

      if (
        caps.available === 'downloadable' ||
        caps.available === 'after-download'
      ) {
        console.log(`Triggering ${name} download...`);

        // Create instance to trigger download
        const instance = await api.create();
        console.log(`${name} download triggered`);

        // Keep instance alive briefly
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (instance.destroy) {
          instance.destroy();
        }
      }
    } catch (error) {
      console.error(`Failed to trigger ${name} download:`, error);
    }
  }
}
```

### Check All Models Status

```typescript
async function checkAllModelsStatus(): Promise<Record<string, string>> {
  const status: Record<string, string> = {};

  if (window.ai?.languageDetector) {
    const caps = await window.ai.languageDetector.capabilities();
    status.languageDetector = caps.available;
  }

  if (window.ai?.summarizer) {
    const caps = await window.ai.summarizer.capabilities();
    status.summarizer = caps.available;
  }

  if (window.ai?.rewriter) {
    const caps = await window.ai.rewriter.capabilities();
    status.rewriter = caps.available;
  }

  if (window.ai?.translator) {
    const caps = await window.ai.translator.capabilities();
    status.translator = caps.available;
  }

  if (window.ai?.languageModel) {
    const caps = await window.ai.languageModel.capabilities();
    status.languageModel = caps.available;
  }

  return status;
}
```

### Download Button Component (HTML + JS)

```html
<!DOCTYPE html>
<html>
  <body>
    <button id="downloadModels">Download AI Models</button>
    <div id="status"></div>
    <div id="progress"></div>

    <script>
      document
        .getElementById('downloadModels')
        .addEventListener('click', async () => {
          const statusDiv = document.getElementById('status');
          const progressDiv = document.getElementById('progress');

          statusDiv.textContent = 'Checking model availability...';

          try {
            // Check Language Model (Gemini Nano) - main model
            if (window.ai?.languageModel) {
              const caps = await window.ai.languageModel.capabilities();

              if (caps.available === 'downloadable') {
                statusDiv.textContent = 'Starting Gemini Nano download...';

                const session = await window.ai.languageModel.create({
                  monitor: m => {
                    m.addEventListener('downloadprogress', e => {
                      const percent = Math.round((e.loaded / e.total) * 100);
                      progressDiv.textContent = `Download progress: ${percent}%`;
                    });
                  },
                });

                statusDiv.textContent =
                  'Download started! Check chrome://on-device-internals';
                session.destroy();
              } else if (caps.available === 'readily') {
                statusDiv.textContent = 'Model already downloaded!';
              } else if (caps.available === 'downloading') {
                statusDiv.textContent = 'Download already in progress...';
              } else {
                statusDiv.textContent = 'Model not available on this device';
              }
            } else {
              statusDiv.textContent =
                'Chrome AI not available. Check chrome://flags';
            }
          } catch (error) {
            statusDiv.textContent = 'Error: ' + error.message;
          }
        });
    </script>
  </body>
</html>
```

---

## Language Learning Patterns

### Complete Article Processing Pipeline

```typescript
import { AIServiceCoordinator } from '../utils/ai-service-coordinator';

async function processArticleForLearning(
  articleText: string,
  userDifficulty: number,
  nativeLanguage: string,
  geminiApiKey?: string
): Promise<{
  detectedLanguage: string;
  summary: string;
  rewrittenText: string;
}> {
  const coordinator = new AIServiceCoordinator(geminiApiKey);

  try {
    // 1. Detect language
    const detectedLanguage = await coordinator.detectLanguage(articleText);

    // 2. Summarize content
    const summary = await coordinator.summarizeContent(articleText, {
      maxLength: 200,
    });

    // 3. Rewrite for difficulty level
    const rewrittenText = await coordinator.rewriteContent(
      articleText,
      userDifficulty
    );

    return {
      detectedLanguage,
      summary,
      rewrittenText,
    };
  } finally {
    coordinator.destroy();
  }
}
```

### Interactive Vocabulary Learning

```typescript
async function createVocabularyCard(
  word: string,
  context: string,
  learningLanguage: string,
  nativeLanguage: string
): Promise<{
  word: string;
  translation: string;
  difficulty: number;
  examples: string[];
}> {
  // Translate word
  const translator = await window.ai.translator.create({
    sourceLanguage: learningLanguage,
    targetLanguage: nativeLanguage,
  });
  const translation = await translator.translate(word);
  translator.destroy();

  // Analyze difficulty and generate examples
  const session = await window.ai.languageModel.create({
    systemPrompt: `You are a ${learningLanguage} language teacher.`,
  });

  const prompt = `
For the word "${word}" in context: "${context}"

Provide:
1. Difficulty level (1-10)
2. Three example sentences in ${learningLanguage}

Format as JSON: {"difficulty": number, "examples": [string, string, string]}
`;

  const response = await session.prompt(prompt);
  const analysis = JSON.parse(response);
  session.destroy();

  return {
    word,
    translation,
    difficulty: analysis.difficulty,
    examples: analysis.examples,
  };
}
```

### Real-time Translation Helper

```typescript
class TranslationHelper {
  private translator: any = null;
  private learningLang: string;
  private nativeLang: string;

  constructor(learningLanguage: string, nativeLanguage: string) {
    this.learningLang = learningLanguage;
    this.nativeLang = nativeLanguage;
  }

  async initialize(): Promise<void> {
    this.translator = await window.ai.translator.create({
      sourceLanguage: this.learningLang,
      targetLanguage: this.nativeLang,
    });
  }

  async translateSelection(text: string): Promise<string> {
    if (!this.translator) {
      await this.initialize();
    }
    return await this.translator.translate(text);
  }

  destroy(): void {
    if (this.translator) {
      this.translator.destroy();
      this.translator = null;
    }
  }
}
```

---

## Error Handling Pattern

```typescript
import { RetryHandler } from '../utils/retry-handler';
import { DEFAULT_TRANSLATION_RETRY_CONFIG } from '../utils/retry-config';

async function safeAPICall<T>(
  apiCall: () => Promise<T>
): Promise<T | undefined> {
  const retryHandler = new RetryHandler(DEFAULT_TRANSLATION_RETRY_CONFIG);

  try {
    const result = await retryHandler.executeWithRetry(apiCall, 'api_call');
    if (result.success) {
      return result.result;
    }
  } catch (error) {
    console.error('API call failed after multiple retries:', error);
  }

  return undefined;
}

// Usage
const translation = await safeAPICall(() =>
  translateVocabulary('hello', 'en', 'es')
);

if (translation) {
  console.log('Translation:', translation);
}
```

---

## Key Takeaways for LLMs

1. **User Activation Required**: All model downloads require user gesture (click, tap, key press)
2. **Check Availability First**: Always call `capabilities()` before `create()`
3. **Destroy Sessions**: Call `destroy()` to free resources
4. **Cache Instances**: Reuse translator/detector instances when possible
5. **Handle Errors Gracefully**: Provide fallbacks for unavailable APIs
6. **Monitor Progress**: Use `monitor` option for download progress
7. **Language Pairs**: Check `languagePairAvailable()` for translator
8. **Streaming**: Use streaming APIs for long content to improve UX

## References

- Language Detector: https://developer.chrome.com/docs/ai/language-detection
- Summarizer: https://developer.chrome.com/docs/ai/summarizer-api
- Rewriter: https://developer.chrome.com/docs/ai/rewriter-api
- Translator: https://developer.chrome.com/docs/ai/translator-api
- Prompt API: https://developer.chrome.com/docs/ai/prompt-api
