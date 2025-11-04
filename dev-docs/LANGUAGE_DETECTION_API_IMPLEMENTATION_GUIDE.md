# Language Detection API Implementation Guide

## Overview

The Chrome Built-in Language Detection API enables client-side language detection without sending data to external servers, protecting user privacy. This guide provides practical implementation patterns for integrating language detection into your Chrome extension.

## Browser Support

- **Chrome**: 138+
- **Status**: Early Preview Program (EPP)
- **Availability**: Top-level windows and same-origin iframes by default

## Core Concepts

### What is Language Detection?

The Language Detection API uses a classification model to determine the most likely language(s) used in a given text. It returns ranked results from highest to lowest probability, with confidence scores between 0.0 (lowest) and 1.0 (highest).

### When to Use

- **Pre-translation**: Detect source language before translating content
- **Content Labeling**: Tag user-generated content with appropriate language codes
- **UI Adaptation**: Adjust interface based on detected user language
- **Model Selection**: Load language-specific models for tasks like toxicity detection

## Implementation Steps

### 1. Feature Detection

Always check for API availability before use:

```typescript
// Check if Language Detection API is available
if ('LanguageDetector' in self) {
  console.log('Language Detection API is available');
} else {
  console.warn('Language Detection API not supported');
  // Implement fallback strategy
}
```

### 2. Check Model Availability

The language detection model is downloaded on-demand. Check availability status:

```typescript
async function checkLanguageDetectorAvailability(): Promise<string> {
  if (!('LanguageDetector' in self)) {
    return 'not-supported';
  }

  const availability = await LanguageDetector.availability();
  return availability; // 'readily' | 'downloadable' | 'not-available'
}
```

**Availability States:**

- `readily`: Model is already downloaded and ready
- `downloadable`: Model needs to be downloaded
- `not-available`: Model cannot be downloaded (e.g., user settings)

### 3. Create Detector with Download Progress

When the model needs downloading, monitor progress and inform users:

```typescript
async function createLanguageDetector(): Promise<LanguageDetector> {
  const detector = await LanguageDetector.create({
    monitor(m) {
      m.addEventListener('downloadprogress', e => {
        const percentComplete = Math.round(e.loaded * 100);
        console.log(`Language model download: ${percentComplete}%`);

        // Update UI to show progress
        updateDownloadProgress(percentComplete);
      });
    },
  });

  return detector;
}
```

**Important Notes:**

- Trigger download after [user activation](https://developer.chrome.com/docs/ai/get-started#user-activation)
- The model is very small compared to other AI models
- May already be present (used by other Chrome features)

### 4. Detect Language

Use the `detect()` method to analyze text:

```typescript
interface DetectionResult {
  detectedLanguage: string; // ISO 639-1 language code (e.g., 'en', 'de', 'fr')
  confidence: number; // 0.0 to 1.0
}

async function detectLanguage(
  detector: LanguageDetector,
  text: string
): Promise<DetectionResult[]> {
  const results = await detector.detect(text);

  // Results are ranked from most likely to least likely
  for (const result of results) {
    console.log(
      `Language: ${result.detectedLanguage}, ` +
        `Confidence: ${result.confidence.toFixed(4)}`
    );
  }

  return results;
}
```

**Example Output:**

```
Language: de, Confidence: 0.9994
Language: en, Confidence: 0.0004
Language: nl, Confidence: 0.0001
```

### 5. Get Top Result with Confidence Threshold

For most use cases, you'll want the top result with a minimum confidence:

```typescript
interface LanguageDetectionResult {
  language: string | null;
  confidence: number;
  isConfident: boolean;
}

async function detectPrimaryLanguage(
  detector: LanguageDetector,
  text: string,
  minConfidence: number = 0.7
): Promise<LanguageDetectionResult> {
  const results = await detector.detect(text);

  if (results.length === 0) {
    return {
      language: null,
      confidence: 0,
      isConfident: false,
    };
  }

  const topResult = results[0];
  const isConfident = topResult.confidence >= minConfidence;

  return {
    language: topResult.detectedLanguage,
    confidence: topResult.confidence,
    isConfident,
  };
}
```

## Complete Implementation Example

Here's a complete implementation for your Chrome extension:

```typescript
// src/utils/language-detector.ts

export interface LanguageDetectionConfig {
  minConfidence?: number;
  maxRetries?: number;
}

export class LanguageDetectorService {
  private detector: LanguageDetector | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  private config: Required<LanguageDetectionConfig>;

  constructor(config: LanguageDetectionConfig = {}) {
    this.config = {
      minConfidence: config.minConfidence ?? 0.7,
      maxRetries: config.maxRetries ?? 3,
    };
  }

  /**
   * Check if Language Detection API is supported
   */
  static isSupported(): boolean {
    return 'LanguageDetector' in self;
  }

  /**
   * Initialize the language detector
   */
  async initialize(): Promise<void> {
    // Return existing initialization promise if already initializing
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    // Already initialized
    if (this.detector) {
      return;
    }

    this.isInitializing = true;
    this.initPromise = this._initializeDetector();

    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  private async _initializeDetector(): Promise<void> {
    if (!LanguageDetectorService.isSupported()) {
      throw new Error('Language Detection API is not supported');
    }

    const availability = await LanguageDetector.availability();

    if (availability === 'not-available') {
      throw new Error('Language detection model is not available');
    }

    console.log(`Language detector availability: ${availability}`);

    this.detector = await LanguageDetector.create({
      monitor(m) {
        m.addEventListener('downloadprogress', e => {
          const percent = Math.round(e.loaded * 100);
          console.log(`Language model download progress: ${percent}%`);
        });
      },
    });

    console.log('Language detector initialized successfully');
  }

  /**
   * Detect language from text
   */
  async detect(text: string): Promise<LanguageDetectionResult> {
    // Validate input
    if (!text || text.trim().length === 0) {
      return {
        language: null,
        confidence: 0,
        isConfident: false,
      };
    }

    // Ensure detector is initialized
    if (!this.detector) {
      await this.initialize();
    }

    if (!this.detector) {
      throw new Error('Failed to initialize language detector');
    }

    // Detect language
    const results = await this.detector.detect(text);

    if (results.length === 0) {
      return {
        language: null,
        confidence: 0,
        isConfident: false,
      };
    }

    const topResult = results[0];
    const isConfident = topResult.confidence >= this.config.minConfidence;

    return {
      language: topResult.detectedLanguage,
      confidence: topResult.confidence,
      isConfident,
    };
  }

  /**
   * Detect language with all ranked results
   */
  async detectAll(text: string): Promise<DetectionResult[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    if (!this.detector) {
      await this.initialize();
    }

    if (!this.detector) {
      throw new Error('Failed to initialize language detector');
    }

    return await this.detector.detect(text);
  }

  /**
   * Destroy the detector instance
   */
  destroy(): void {
    this.detector = null;
  }
}
```

## Integration with Your Extension

### In Offscreen Document (AI Processing)

```typescript
// src/offscreen/ai-processor.ts

import { LanguageDetectorService } from '../utils/language-detector';

class AIProcessor {
  private languageDetector: LanguageDetectorService;

  constructor() {
    this.languageDetector = new LanguageDetectorService({
      minConfidence: 0.7,
    });
  }

  async processArticle(content: string): Promise<ProcessedArticle> {
    // Detect article language
    const detection = await this.languageDetector.detect(content);

    if (!detection.isConfident) {
      console.warn(
        `Low confidence language detection: ${detection.language} ` +
          `(${detection.confidence.toFixed(2)})`
      );
    }

    const sourceLanguage = detection.language || 'en'; // fallback to English

    // Use detected language for translation
    const translation = await this.translateContent(
      content,
      sourceLanguage,
      'en' // target language
    );

    return {
      originalContent: content,
      sourceLanguage,
      translation,
      languageConfidence: detection.confidence,
    };
  }
}
```

### In Content Script

```typescript
// src/content/content-script.ts

import { LanguageDetectorService } from '../utils/language-detector';

async function detectPageLanguage(): Promise<string> {
  const detector = new LanguageDetectorService();

  // Get page content
  const pageText = document.body.innerText.slice(0, 1000); // First 1000 chars

  const result = await detector.detect(pageText);

  if (result.isConfident) {
    console.log(`Page language: ${result.language}`);
    return result.language;
  } else {
    console.warn('Could not confidently detect page language');
    return 'unknown';
  }
}
```

## Best Practices

### 1. Text Length Considerations

**⚠️ Warning**: Avoid very short phrases and single words - accuracy will be low.

```typescript
function isTextSuitableForDetection(text: string): boolean {
  const trimmed = text.trim();
  const wordCount = trimmed.split(/\s+/).length;

  // Require at least 5 words for reliable detection
  return wordCount >= 5;
}

async function detectLanguageSafely(
  detector: LanguageDetectorService,
  text: string
): Promise<LanguageDetectionResult> {
  if (!isTextSuitableForDetection(text)) {
    console.warn('Text too short for reliable language detection');
    return {
      language: null,
      confidence: 0,
      isConfident: false,
    };
  }

  return await detector.detect(text);
}
```

### 2. Confidence Thresholds

Use appropriate confidence thresholds based on your use case:

```typescript
const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9, // Use for critical decisions
  MEDIUM: 0.7, // Use for most cases
  LOW: 0.5, // Use for suggestions only
};

function interpretDetectionResult(result: LanguageDetectionResult): string {
  if (result.confidence >= CONFIDENCE_THRESHOLDS.HIGH) {
    return 'highly confident';
  } else if (result.confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) {
    return 'confident';
  } else if (result.confidence >= CONFIDENCE_THRESHOLDS.LOW) {
    return 'low confidence';
  } else {
    return 'uncertain';
  }
}
```

### 3. Error Handling

```typescript
async function detectLanguageWithFallback(text: string): Promise<string> {
  try {
    const detector = new LanguageDetectorService();
    const result = await detector.detect(text);

    if (result.isConfident) {
      return result.language;
    }

    // Low confidence - use document language as fallback
    return document.documentElement.lang || 'en';
  } catch (error) {
    console.error('Language detection failed:', error);

    // Fallback strategies:
    // 1. Check document lang attribute
    if (document.documentElement.lang) {
      return document.documentElement.lang;
    }

    // 2. Check meta tags
    const metaLang = document.querySelector(
      'meta[http-equiv="content-language"]'
    );
    if (metaLang) {
      return metaLang.getAttribute('content') || 'en';
    }

    // 3. Default to English
    return 'en';
  }
}
```

### 4. Caching Results

Cache detection results to avoid redundant API calls:

```typescript
class CachedLanguageDetector {
  private cache = new Map<string, LanguageDetectionResult>();
  private detector: LanguageDetectorService;

  constructor() {
    this.detector = new LanguageDetectorService();
  }

  async detect(text: string): Promise<LanguageDetectionResult> {
    // Create cache key from text hash
    const cacheKey = this.hashText(text);

    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Detect and cache
    const result = await this.detector.detect(text);
    this.cache.set(cacheKey, result);

    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    return result;
  }

  private hashText(text: string): string {
    // Simple hash for cache key
    return text.slice(0, 100); // Use first 100 chars as key
  }
}
```

## Permissions and Cross-Origin Access

### Default Behavior

- Available in top-level windows
- Available in same-origin iframes
- **Not available** in Web Workers

### Cross-Origin iframes

Grant access using the `allow` attribute:

```html
<!-- In your extension's HTML -->
<iframe
  src="https://cross-origin.example.com/"
  allow="language-detector"
></iframe>
```

## Testing

### Unit Test Example

```typescript
// tests/language-detector.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { LanguageDetectorService } from '../src/utils/language-detector';

describe('LanguageDetectorService', () => {
  let detector: LanguageDetectorService;

  beforeEach(() => {
    detector = new LanguageDetectorService();
  });

  it('should detect English text', async () => {
    const text = 'Hello, this is a test of the language detection system.';
    const result = await detector.detect(text);

    expect(result.language).toBe('en');
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.isConfident).toBe(true);
  });

  it('should detect German text', async () => {
    const text = 'Hallo und herzlich willkommen zu unserem Test!';
    const result = await detector.detect(text);

    expect(result.language).toBe('de');
    expect(result.isConfident).toBe(true);
  });

  it('should handle short text gracefully', async () => {
    const text = 'Hi';
    const result = await detector.detect(text);

    // Short text may have low confidence
    expect(result.language).toBeDefined();
  });

  it('should handle empty text', async () => {
    const result = await detector.detect('');

    expect(result.language).toBeNull();
    expect(result.confidence).toBe(0);
    expect(result.isConfident).toBe(false);
  });
});
```

## Common Use Cases

### 1. Pre-Translation Detection

```typescript
async function translateArticle(
  content: string,
  targetLanguage: string
): Promise<string> {
  const detector = new LanguageDetectorService();
  const detection = await detector.detect(content);

  if (!detection.isConfident) {
    throw new Error('Could not reliably detect source language');
  }

  // Skip translation if already in target language
  if (detection.language === targetLanguage) {
    return content;
  }

  // Proceed with translation
  return await translate(content, detection.language, targetLanguage);
}
```

### 2. Multi-Language Content Labeling

```typescript
async function labelUserContent(
  content: string
): Promise<{ text: string; language: string; confidence: number }> {
  const detector = new LanguageDetectorService();
  const result = await detector.detect(content);

  return {
    text: content,
    language: result.language || 'unknown',
    confidence: result.confidence,
  };
}
```

### 3. Adaptive UI Based on Language

```typescript
async function adaptUIToContent(content: string): Promise<void> {
  const detector = new LanguageDetectorService();
  const result = await detector.detect(content);

  if (result.isConfident) {
    // Update UI direction for RTL languages
    if (['ar', 'he', 'fa'].includes(result.language)) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }

    // Update language attribute
    document.documentElement.lang = result.language;
  }
}
```

## Limitations

1. **Language Coverage**: The API is trained on a specific set of languages and may not detect all languages with high accuracy
2. **Short Text**: Very short phrases and single words have low detection accuracy
3. **Mixed Languages**: Text with multiple languages may produce unexpected results
4. **Web Workers**: API is not available in Web Workers
5. **Model Download**: First use requires model download (though it's very small)

## Resources

- [Official Documentation](https://developer.chrome.com/docs/ai/language-detection)
- [Chrome AI Demos](https://chrome.dev/web-ai-demos/)
- [Join Early Preview Program](https://developer.chrome.com/docs/ai/join-epp)

## Summary

The Language Detection API provides a privacy-preserving, client-side solution for detecting text language. Key takeaways:

- ✅ Always check feature availability
- ✅ Monitor model download progress
- ✅ Use appropriate confidence thresholds
- ✅ Avoid very short text inputs
- ✅ Implement fallback strategies
- ✅ Cache results when appropriate
- ✅ Handle errors gracefully

This API is particularly valuable for your language learning extension, enabling automatic source language detection before translation and content processing.
