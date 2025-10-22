# API Documentation

## Chrome AI Integration

The Language Learning Chrome Extension integrates with Chrome's built-in AI APIs and provides fallback to Gemini API for extended functionality.

## Chrome Built-in AI APIs

### Overview

Chrome's built-in AI APIs provide local, privacy-focused AI processing without requiring external API keys or internet connectivity for basic operations.

### Requirements

- **Chrome Version**: 140+ (stable channel)
- **Hardware**: 4GB RAM, 22GB storage, 4GB VRAM (recommended)
- **Platform**: Windows 10+, macOS 13+, Linux, ChromeOS

### API Availability Check

```typescript
import { getChromeAI } from './utils/chrome-ai';

const ai = getChromeAI();
const availability = await ai.checkAvailability();

console.log(availability);
// {
//   allAvailable: true,
//   languageDetector: true,
//   summarizer: true,
//   rewriter: true,
//   translator: true,
//   vocabularyAnalyzer: true
// }
```

## Core AI Services

### 1. Language Detection

**Purpose**: Automatically detect the language of article content

**Usage**:

```typescript
const detector = new ChromeLanguageDetector();
const language = await detector.detectLanguage('Hello world, this is a test.');
console.log(language); // 'en'
```

**Features**:

- **Caching**: Results cached for up to 100 entries (LRU eviction)
- **Cache Key**: First 200 characters of text
- **Confidence**: Uses highest confidence detection result
- **Fallback**: Returns 'unknown' if detection fails

**API Reference**:

```typescript
class ChromeLanguageDetector {
  async detectLanguage(text: string): Promise<string>;
  async isAvailable(): Promise<boolean>;
  clearCache(): void;
  destroy(): void;
}
```

### 2. Content Summarization

**Purpose**: Process and summarize article content for learning

**Usage**:

```typescript
const summarizer = new ChromeSummarizer();

// Basic summarization
const summary = await summarizer.summarizeContent(longArticle);

// Article subdivision
const parts = await summarizer.subdivideArticle(longArticle, {
  maxPartsCount: 5,
  targetWordsPerPart: 200,
});
```

**Features**:

- **Hierarchical Processing**: Multi-level summarization for long content (>10,000 chars)
- **Article Subdivision**: Split content into 1-3 paragraph learning parts
- **Noise Filtering**: Remove ads, navigation, and non-content elements
- **Session Management**: Automatic session creation and cleanup

**API Reference**:

```typescript
class ChromeSummarizer {
  async summarizeContent(
    content: string,
    options?: SummarizeOptions
  ): Promise<string>;
  async subdivideArticle(
    content: string,
    options?: SubdivideOptions
  ): Promise<string[]>;
  async isAvailable(): Promise<boolean>;
  destroy(): void;
}

interface SummarizeOptions {
  maxLength?: number;
  format?: 'paragraph' | 'bullet-points';
  focus?: string;
}
```

### 3. Content Rewriting

**Purpose**: Adapt content difficulty for different learning levels

**Usage**:

```typescript
const rewriter = new ChromeRewriter();

// Adapt content for difficulty level (1-10)
const adapted = await rewriter.rewriteContent(originalText, 5);

// Batch rewriting for long content
const adaptedParts = await rewriter.rewriteContentInChunks(longText, 3);
```

**Features**:

- **Difficulty Scaling**: 1-10 scale (1=beginner, 10=advanced)
- **Chunk Processing**: Automatic chunking for long content
- **Factual Preservation**: Maintains accuracy while adapting language
- **Validation**: Ensures rewritten content meets quality standards

**Difficulty Mapping**:

- **1-3**: Simpler vocabulary, shorter sentences, more formal language
- **4-7**: Moderate complexity, casual language, balanced structure
- **8-10**: Preserve original complexity, advanced vocabulary

**API Reference**:

```typescript
class ChromeRewriter {
  async rewriteContent(content: string, difficulty: number): Promise<string>;
  async rewriteContentInChunks(
    content: string,
    difficulty: number
  ): Promise<string[]>;
  async isAvailable(): Promise<boolean>;
  destroy(): void;
}
```

### 4. Translation

**Purpose**: Translate vocabulary and sentences with context awareness

**Usage**:

```typescript
const translator = new ChromeTranslator();

// Single translation
const translation = await translator.translateText(
  'Hello world',
  'en',
  'es',
  'greeting context'
);

// Batch translation (up to 20 items)
const results = await translator.batchTranslate(
  [
    { text: 'Hello', context: 'greeting' },
    { text: 'Goodbye', context: 'farewell' },
    { text: 'Thank you', context: 'gratitude' },
  ],
  'en',
  'es'
);
```

**Features**:

- **Context Awareness**: Translations consider article context
- **Batch Processing**: Up to 20 words per API call for efficiency
- **Caching**: Translation results cached (500 entries, LRU eviction)
- **Session Reuse**: Reuses translator sessions for same language pairs
- **Language Pair Validation**: Checks availability before translation

**API Reference**:

```typescript
class ChromeTranslator {
  async translateText(
    text: string,
    from: string,
    to: string,
    context?: string
  ): Promise<string>;
  async batchTranslate(
    items: TranslationItem[],
    from: string,
    to: string
  ): Promise<TranslationResult[]>;
  async isLanguagePairAvailable(from: string, to: string): Promise<boolean>;
  async isAvailable(): Promise<boolean>;
  clearCache(): void;
  destroy(): void;
}

interface TranslationItem {
  text: string;
  context?: string;
}

interface TranslationResult {
  original: string;
  translation: string;
  context?: string;
}
```

### 5. Vocabulary Analysis

**Purpose**: Analyze vocabulary difficulty and generate learning materials

**Usage**:

```typescript
const analyzer = new ChromeVocabularyAnalyzer();

// Analyze vocabulary difficulty
const analyses = await analyzer.analyzeVocabulary(
  ['example', 'sophisticated', 'elementary'],
  'This is an example of sophisticated yet elementary text.'
);

// Generate example sentences
const examples = await analyzer.generateExamples('sophisticated', 3);
```

**Features**:

- **Difficulty Assessment**: 1-10 scale based on complexity
- **Proper Noun Filtering**: Automatically excludes names, places, brands
- **Technical Term Detection**: Identifies and explains technical vocabulary
- **Example Generation**: Creates 1-3 contextual example sentences
- **Context Awareness**: Analysis considers article context

**API Reference**:

```typescript
class ChromeVocabularyAnalyzer {
  async analyzeVocabulary(
    words: string[],
    context: string
  ): Promise<VocabularyAnalysis[]>;
  async generateExamples(word: string, count?: number): Promise<string[]>;
  async isAvailable(): Promise<boolean>;
  destroy(): void;
}

interface VocabularyAnalysis {
  word: string;
  difficulty: number; // 1-10 scale
  isProperNoun: boolean;
  isTechnicalTerm: boolean;
  definition?: string;
  examples?: string[];
}
```

## Unified AI Manager

### Purpose

Provides a single interface to all AI services with automatic availability checking and resource management.

### Usage

```typescript
import { getChromeAI } from './utils/chrome-ai';

const ai = getChromeAI();

// Use any service through unified interface
const language = await ai.detectLanguage(text);
const summary = await ai.summarizeContent(text);
const translation = await ai.translateText(text, 'en', 'es');

// Check overall availability
const availability = await ai.checkAvailability();

// Cleanup all resources
ai.destroy();
```

### API Reference

```typescript
class ChromeAIManager {
  // Language Detection
  async detectLanguage(text: string): Promise<string>;

  // Content Processing
  async summarizeContent(
    content: string,
    options?: SummarizeOptions
  ): Promise<string>;
  async subdivideArticle(
    content: string,
    options?: SubdivideOptions
  ): Promise<string[]>;
  async rewriteContent(content: string, difficulty: number): Promise<string>;

  // Translation
  async translateText(
    text: string,
    from: string,
    to: string,
    context?: string
  ): Promise<string>;
  async batchTranslateVocabulary(
    words: string[],
    from: string,
    to: string,
    context?: string
  ): Promise<TranslationResult[]>;

  // Vocabulary Analysis
  async analyzeVocabulary(
    words: string[],
    context: string
  ): Promise<VocabularyAnalysis[]>;

  // System
  async checkAvailability(): Promise<AIAvailability>;
  destroy(): void;
}
```

## Error Handling

### Error Types

All AI services throw standardized `AIError` objects:

```typescript
interface AIError {
  type:
    | 'api_unavailable'
    | 'network'
    | 'rate_limit'
    | 'invalid_input'
    | 'processing_failed';
  message: string;
  retryable: boolean;
  originalError?: Error;
}
```

### Error Handling Pattern

```typescript
try {
  const result = await ai.translateText('Hello', 'en', 'es');
} catch (error) {
  if (error.type === 'api_unavailable') {
    // Fallback to Gemini API
    console.log('Chrome AI unavailable, using fallback');
  } else if (error.retryable) {
    // Retry with exponential backoff
    console.log('Retrying operation...');
  } else {
    // Show error to user
    console.error('Operation failed:', error.message);
  }
}
```

## Gemini API Fallback

### Purpose

Provides extended functionality when Chrome AI is unavailable or for unsupported language pairs.

### Configuration

```typescript
// User provides API key in settings
const geminiConfig = {
  apiKey: 'user-provided-key',
  model: 'gemini-2.5-pro', // or 'gemini-2.5-flash'
  baseUrl: 'https://generativelanguage.googleapis.com',
};
```

### Fallback Chain

```typescript
class AIServiceCoordinator {
  async processContent(content: string): Promise<ProcessedContent> {
    try {
      // Try Chrome AI first
      return await this.chromeAI.process(content);
    } catch (chromeError) {
      if (this.geminiAPI.isConfigured()) {
        try {
          // Fallback to Gemini API
          return await this.geminiAPI.process(content);
        } catch (geminiError) {
          throw new Error('All AI services unavailable');
        }
      }
      throw chromeError;
    }
  }
}
```

## Performance Optimizations

### Caching Strategy

- **Language Detection**: 100 entries, keyed by text prefix (200 chars)
- **Translation**: 500 entries, keyed by `source:target:text` (100 chars)
- **LRU Eviction**: Least recently used items removed when cache full

### Batch Processing

- **Translation Batching**: Up to 20 words per API call
- **Cache Integration**: Check cache before batching
- **Partial Results**: Handle mixed cache hits/misses

### Session Management

- **Session Reuse**: Same language pairs reuse translator sessions
- **Automatic Cleanup**: Sessions destroyed on component cleanup
- **Memory Efficiency**: Prevents session accumulation

### Chunking Strategy

- **Summarizer**: 5,000 character chunks with overlap
- **Rewriter**: 3 paragraph chunks for readability
- **Hierarchical**: Multi-level processing for very long content

## Browser Compatibility

### Requirements

- **Chrome 140+**: Required for built-in AI APIs
- **Hardware Detection**: Automatic capability checking
- **Graceful Degradation**: Fallback to Gemini API when hardware insufficient

### Availability Checking

```typescript
const availability = await ai.checkAvailability();

if (!availability.allAvailable) {
  // Show hardware requirements or suggest Gemini API
  console.log('Missing services:', {
    languageDetector: availability.languageDetector,
    summarizer: availability.summarizer,
    rewriter: availability.rewriter,
    translator: availability.translator,
    vocabularyAnalyzer: availability.vocabularyAnalyzer,
  });
}
```

## Usage Examples

### Complete Article Processing

```typescript
const ai = getChromeAI();

try {
  // 1. Detect language
  const language = await ai.detectLanguage(articleContent);

  // 2. Summarize and subdivide
  const parts = await ai.subdivideArticle(articleContent);

  // 3. Adapt difficulty
  const adaptedParts = await Promise.all(
    parts.map(part => ai.rewriteContent(part, userDifficulty))
  );

  // 4. Extract and translate vocabulary
  const vocabulary = extractVocabulary(adaptedParts[0]);
  const translations = await ai.batchTranslateVocabulary(
    vocabulary,
    language,
    userNativeLanguage
  );

  // 5. Analyze vocabulary
  const analyses = await ai.analyzeVocabulary(vocabulary, adaptedParts[0]);

  console.log('Processing complete:', {
    language,
    parts: adaptedParts,
    vocabulary: translations,
    analyses,
  });
} catch (error) {
  console.error('Processing failed:', error);
} finally {
  // Always cleanup resources
  ai.destroy();
}
```

### Error Recovery Example

```typescript
async function processWithRetry(
  operation: () => Promise<any>,
  maxRetries = 3
): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!error.retryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const result = await processWithRetry(() =>
  ai.translateText('Hello', 'en', 'es')
);
```

This API documentation provides comprehensive coverage of the Chrome AI integration, including usage patterns, error handling, and performance optimizations for the Language Learning Chrome Extension.
