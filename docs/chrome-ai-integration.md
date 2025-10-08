# Chrome AI Integration Documentation

## Overview

This document describes the Chrome Built-in AI APIs integration for the Language Learning Chrome Extension. The implementation provides a unified interface for language detection, content summarization, rewriting, translation, and vocabulary analysis.

## Architecture

### Core Components

1. **ChromeLanguageDetector** - Language detection with caching
2. **ChromeSummarizer** - Content summarization with hierarchical processing
3. **ChromeRewriter** - Difficulty-based content adaptation
4. **ChromeTranslator** - Translation with batch processing and caching
5. **ChromeVocabularyAnalyzer** - Vocabulary analysis and example generation
6. **ChromeAIManager** - Unified interface coordinating all services

## Features

### Language Detection

```typescript
const detector = new ChromeLanguageDetector();
const language = await detector.detectLanguage('Hello world');
// Returns: 'en'
```

**Features:**

- Automatic language detection using Chrome's Language Detector API
- Result caching (up to 100 entries)
- Confidence-based selection of detected language
- Availability checking

### Content Summarization

```typescript
const summarizer = new ChromeSummarizer();
const summary = await summarizer.summarizeContent(longArticle, {
  maxLength: 200,
  format: 'paragraph',
});
```

**Features:**

- Hierarchical summarization for long content (>10,000 chars)
- Article subdivision into 1-3 paragraph parts
- Noise filtering (ads, navigation elements)
- Automatic session management

### Content Rewriting

```typescript
const rewriter = new ChromeRewriter();
const adapted = await rewriter.rewriteContent(text, 5); // difficulty 1-10
```

**Features:**

- Difficulty-based adaptation (1-10 scale)
- Maintains factual accuracy
- Chunk-based processing for long content
- Validation of rewritten content

**Difficulty Mapping:**

- 1-3: Simpler, more formal language
- 4-7: Moderate, casual language
- 8-10: Preserve original complexity

### Translation

```typescript
const translator = new ChromeTranslator();

// Single translation
const translation = await translator.translateText(
  'Hello',
  'en',
  'es',
  'greeting context'
);

// Batch translation (up to 20 items)
const results = await translator.batchTranslate(
  [
    { text: 'Hello', context: 'greeting' },
    { text: 'Goodbye', context: 'farewell' },
  ],
  'en',
  'es'
);
```

**Features:**

- Context-aware translation
- Batch processing (up to 20 words per call)
- Translation caching (up to 500 entries)
- Language pair availability checking
- Session reuse for same language pairs

### Vocabulary Analysis

```typescript
const analyzer = new ChromeVocabularyAnalyzer();

// Analyze vocabulary
const analyses = await analyzer.analyzeVocabulary(
  ['example', 'complex'],
  'This is an example of complex text.'
);

// Generate examples
const examples = await analyzer.generateExamples('example', 3);
```

**Features:**

- Difficulty assessment (1-10 scale)
- Proper noun detection and filtering
- Technical term identification
- Example sentence generation (1-3 per word)
- Context-aware analysis

### Unified Manager

```typescript
import { getChromeAI } from './utils/chrome-ai';

const ai = getChromeAI();

// Use any service through unified interface
const language = await ai.detectLanguage(text);
const summary = await ai.summarizeContent(text);
const rewritten = await ai.rewriteContent(text, 5);
const translation = await ai.translateText(text, 'en', 'es');
const analyses = await ai.analyzeVocabulary(['word'], context);

// Check availability
const availability = await ai.checkAvailability();
console.log(availability.allAvailable); // true if all services ready

// Cleanup
ai.destroy();
```

## Error Handling

All services throw standardized `AIError` objects:

```typescript
interface AIError {
  type:
    | 'network'
    | 'api_unavailable'
    | 'rate_limit'
    | 'invalid_input'
    | 'processing_failed';
  message: string;
  retryable: boolean;
  originalError?: Error;
}
```

**Error Types:**

- `api_unavailable`: Chrome AI API not available or not ready
- `network`: Network-related errors
- `rate_limit`: API rate limit exceeded
- `invalid_input`: Invalid parameters provided
- `processing_failed`: Processing error occurred

## Performance Optimizations

### Caching

1. **Language Detection Cache**
   - Stores up to 100 detection results
   - Key: First 200 characters of text
   - LRU eviction policy

2. **Translation Cache**
   - Stores up to 500 translations
   - Key: `source:target:text` (first 100 chars)
   - LRU eviction policy

### Batch Processing

- Translator supports batching up to 20 items per call
- Reduces API calls and improves performance
- Automatic cache checking before translation

### Session Management

- Reuses translator sessions for same language pairs
- Automatic cleanup on destroy
- Prevents memory leaks

### Chunking

- Long content automatically split into manageable chunks
- Summarizer: 5,000 character chunks
- Rewriter: 3 paragraph chunks
- Hierarchical processing for very long content

## Browser Compatibility

**Requirements:**

- Chrome 140+ (for built-in AI APIs)
- Minimum hardware:
  - 4GB RAM
  - 22GB storage
  - 4GB VRAM

**Availability Checking:**

```typescript
const ai = getChromeAI();
const availability = await ai.checkAvailability();

if (!availability.allAvailable) {
  console.log('Missing services:', {
    languageDetector: availability.languageDetector,
    summarizer: availability.summarizer,
    rewriter: availability.rewriter,
    translator: availability.translator,
    vocabularyAnalyzer: availability.vocabularyAnalyzer,
  });
}
```

## Testing

Comprehensive test suite with 16 tests covering:

- Language detection with caching
- Content summarization and subdivision
- Difficulty-based rewriting
- Translation with batching and caching
- Vocabulary analysis and filtering
- Unified manager interface
- Availability checking

Run tests:

```bash
npm test -- chrome-ai.test.ts --run
```

## Usage Examples

### Complete Article Processing

```typescript
const ai = getChromeAI();

// 1. Detect language
const language = await ai.detectLanguage(articleContent);

// 2. Summarize and clean content
const summary = await ai.summarizeContent(articleContent);

// 3. Subdivide into parts
const parts = await ai.subdivideArticle(summary);

// 4. Adapt difficulty for each part
const adaptedParts = await Promise.all(
  parts.map(part => ai.rewriteContent(part, userDifficulty))
);

// 5. Extract and translate vocabulary
const vocabulary = extractVocabulary(adaptedParts[0]);
const translations = await ai.batchTranslateVocabulary(
  vocabulary,
  language,
  userNativeLanguage
);

// 6. Analyze vocabulary
const analyses = await ai.analyzeVocabulary(vocabulary, adaptedParts[0]);

// Cleanup
ai.destroy();
```

### Error Handling Pattern

```typescript
try {
  const translation = await ai.translateText(text, 'en', 'es');
} catch (error) {
  if (error.type === 'api_unavailable') {
    // Fallback to Gemini API
    console.log('Chrome AI unavailable, using fallback');
  } else if (error.retryable) {
    // Retry with exponential backoff
    console.log('Retrying...');
  } else {
    // Show error to user
    console.error('Translation failed:', error.message);
  }
}
```

## API Reference

See `src/utils/chrome-ai.ts` for complete API documentation and type definitions.

## Future Enhancements

1. **Streaming Support**: Add streaming for long-running operations
2. **Progress Callbacks**: Provide progress updates for batch operations
3. **Advanced Caching**: Implement persistent cache with IndexedDB
4. **Retry Logic**: Built-in exponential backoff for retryable errors
5. **Metrics**: Track API usage and performance metrics

## Related Documentation

- [Chrome Built-in AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Requirements Document](../.kiro/specs/language-learning-extension/requirements.md)
- [Design Document](../.kiro/specs/language-learning-extension/design.md)
