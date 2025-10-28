# API Documentation

## Chrome AI Integration

The Language Learning Chrome Extension integrates with Chrome's built-in AI APIs and provides fallback to Gemini API for extended functionality. This documentation covers all implemented Chrome AI services and their usage patterns.

## Chrome Built-in AI APIs

### Overview

Chrome's built-in AI APIs provide local, privacy-focused AI processing without requiring external API keys or internet connectivity for basic operations. The extension uses these APIs for language detection, content summarization, rewriting, translation, and vocabulary analysis.

### Requirements

- **Chrome Version**: 140+ (stable channel)
- **Hardware**: 4GB RAM, 22GB storage, 4GB VRAM (recommended)
- **Platform**: Windows 10+, macOS 13+, Linux, ChromeOS

### Global AI Interface

Chrome AI APIs are accessed through the global `window.ai` object:

```typescript
// Check if Chrome AI is available
if (window.ai?.languageDetector) {
  const capabilities = await window.ai.languageDetector.capabilities();
  console.log(
    'Language Detector available:',
    capabilities.available === 'readily'
  );
}
```

## Core AI Services

### 1. Language Detection

**Purpose**: Automatically detect the language of article content using Chrome's Language Detector API

**Implementation**: `src/utils/chrome-ai.ts` - `ChromeLanguageDetector` class

**Usage**:

```typescript
import { ChromeLanguageDetector } from '../utils/chrome-ai';

const detector = new ChromeLanguageDetector();

// Detect language of text
const language = await detector.detectLanguage('Hello world, this is a test.');
console.log(language); // 'en'

// Check if service is available
const available = await detector.isAvailable();
if (!available) {
  console.log('Language Detector not available');
}
```

**Features**:

- **Caching**: Results cached for up to 100 entries with LRU eviction
- **Cache Key**: First 200 characters of text (trimmed)
- **Confidence-Based**: Uses highest confidence detection result from multiple candidates
- **Error Handling**: Throws standardized `AIError` objects
- **Availability Check**: Verifies API readiness before use

**Caching Strategy**:

- Cache size: 100 entries maximum
- Cache key: First 200 characters of input text
- Eviction: Least Recently Used (LRU) when cache is full
- Cache clearing: Manual via `clearCache()` method

**API Reference**:

```typescript
class ChromeLanguageDetector {
  async detectLanguage(text: string): Promise<string>;
  async isAvailable(): Promise<boolean>;
  clearCache(): void;

  // Private methods for caching and error handling
  private getCacheKey(text: string): string;
  private cacheResult(key: string, language: string): void;
  private createError(type: AIError['type'], message: string): AIError;
}
```

**Error Types**:

- `api_unavailable`: Language Detector API not available or not ready
- `processing_failed`: Detection failed or no language detected

### 2. Content Summarization

**Purpose**: Process and summarize article content for learning using Chrome's Summarizer API

**Implementation**: `src/utils/chrome-ai.ts` - `ChromeSummarizer` class

**Usage**:

```typescript
import { ChromeSummarizer } from '../utils/chrome-ai';
import type { SummaryOptions } from '../types';

const summarizer = new ChromeSummarizer();

// Basic summarization
const summary = await summarizer.summarizeContent(longArticle);

// Summarization with options
const summary = await summarizer.summarizeContent(longArticle, {
  maxLength: 200,
  format: 'bullet',
});

// Article subdivision for learning
const parts = await summarizer.subdivideArticle(longArticle);
console.log(`Article split into ${parts.length} parts`);

// Check availability
const available = await summarizer.isAvailable();

// Cleanup resources
summarizer.destroy();
```

**Features**:

- **Hierarchical Processing**: Multi-level summarization for long content (>10,000 chars)
- **Article Subdivision**: Split content into 1-3 paragraph learning parts (~500 words each)
- **Noise Filtering**: Removes ads, navigation, and promotional content
- **Session Management**: Automatic session creation, tracking, and cleanup
- **Length Mapping**: Maps user preferences to Chrome API length parameters

**Hierarchical Summarization**:
For content longer than 10,000 characters:

1. Split into ~5,000 character chunks
2. Summarize each chunk individually
3. Combine summaries and re-summarize if multiple chunks

**Article Subdivision Algorithm**:

- Target: ~500 words per part
- Maximum: 3 paragraphs per part
- Maintains paragraph boundaries
- Balances content distribution

**API Reference**:

```typescript
class ChromeSummarizer {
  async summarizeContent(
    text: string,
    options?: SummaryOptions
  ): Promise<string>;
  async subdivideArticle(content: string): Promise<string[]>;
  async isAvailable(): Promise<boolean>;
  destroy(): void;

  // Private methods
  private hierarchicalSummarize(
    text: string,
    options: SummaryOptions
  ): Promise<string>;
  private summarizeChunk(
    text: string,
    options: SummaryOptions
  ): Promise<string>;
  private filterNoise(text: string): string;
  private mapLength(maxLength?: number): 'short' | 'medium' | 'long';
}

// From src/types/index.ts
interface SummaryOptions {
  maxLength?: number;
  format?: 'paragraph' | 'bullet';
}
```

**Chrome API Parameters**:

- **type**: Always 'tl;dr' for article summarization
- **format**: 'markdown' for bullet points, 'plain-text' for paragraphs
- **length**: Mapped from maxLength (short: <100, medium: <300, long: >=300)

**Error Types**:

- `api_unavailable`: Summarizer API not available or not ready
- `processing_failed`: Summarization failed or returned empty result

### 3. Content Rewriting

**Purpose**: Adapt content difficulty for different learning levels using Chrome's Rewriter API

**Implementation**: `src/utils/chrome-ai.ts` - `ChromeRewriter` class

**Usage**:

```typescript
import { ChromeRewriter } from '../utils/chrome-ai';

const rewriter = new ChromeRewriter();

// Adapt content for difficulty level (1-10)
const adapted = await rewriter.rewriteContent(originalText, 5);

// For long content (>5000 chars), automatic chunking is used
const longAdapted = await rewriter.rewriteContent(longArticle, 3);

// Check availability
const available = await rewriter.isAvailable();

// Cleanup resources
rewriter.destroy();
```

**Features**:

- **Difficulty Scaling**: 1-10 scale mapped to Chrome API tone parameters
- **Automatic Chunking**: Processes long content (>5000 chars) in paragraph chunks
- **Factual Preservation**: Validates rewritten content maintains accuracy
- **Session Management**: Tracks and cleans up rewriter sessions
- **Structure Preservation**: Maintains paragraph boundaries and overall structure

**Difficulty to Tone Mapping**:

- **1-3 (Beginner)**: `more-formal` - Simpler vocabulary, clearer structure
- **4-7 (Intermediate)**: `more-casual` - Moderate complexity, accessible language
- **8-10 (Advanced)**: `as-is` - Preserves original complexity and vocabulary

**Chunking Strategy**:
For content longer than 5,000 characters:

- Split by paragraph boundaries (`\n\n+`)
- Process 3 paragraphs at a time
- Rejoin with original paragraph spacing

**Content Validation**:
Rewritten content is validated to ensure:

- Not empty or whitespace-only
- Length within 50%-150% of original
- Paragraph structure roughly maintained (±50% paragraph count)

**API Reference**:

```typescript
class ChromeRewriter {
  async rewriteContent(text: string, difficulty: number): Promise<string>;
  async isAvailable(): Promise<boolean>;
  destroy(): void;

  // Private methods
  private mapDifficultyToTone(difficulty: number): string;
  private rewriteInChunks(text: string, tone: string): Promise<string>;
  private rewriteChunk(text: string, tone: string): Promise<string>;
  private validateRewrite(original: string, rewritten: string): boolean;
}
```

**Chrome API Parameters**:

- **tone**: Mapped from difficulty level (more-formal, more-casual, as-is)
- **format**: Always 'plain-text' to preserve readability
- **length**: Always 'as-is' to maintain original content length

**Error Types**:

- `api_unavailable`: Rewriter API not available or not ready
- `invalid_input`: Difficulty level not between 1-10
- `processing_failed`: Rewriting failed or validation failed

### 4. Translation

**Purpose**: Translate vocabulary and sentences with context awareness using Chrome's Translator API

**Implementation**: `src/utils/chrome-ai.ts` - `ChromeTranslator` class

**Usage**:

```typescript
import {
  ChromeTranslator,
  TranslationRequest,
  TranslationResult,
} from '../utils/chrome-ai';

const translator = new ChromeTranslator();

// Single translation with context
const translation = await translator.translateText(
  'Hello world',
  'en',
  'es',
  'This is a greeting in a casual conversation'
);

// Batch translation (up to 20 items)
const requests: TranslationRequest[] = [
  { text: 'Hello', context: 'greeting' },
  { text: 'Goodbye', context: 'farewell' },
  { text: 'Thank you', context: 'gratitude' },
];

const results = await translator.batchTranslate(requests, 'en', 'es');

// Check language pair availability
const available = await translator.isAvailable('en', 'es');

// Cleanup
translator.destroy();
```

**Features**:

- **Context-Aware Translation**: Prepends context to improve translation accuracy
- **Batch Processing**: Up to 20 words per API call with intelligent batching
- **Caching**: Translation results cached (500 entries, LRU eviction)
- **Session Reuse**: Maintains translator sessions per language pair
- **Language Pair Validation**: Checks availability before attempting translation
- **Mixed Cache Handling**: Efficiently handles partial cache hits in batch operations

**Caching Strategy**:

- Cache size: 500 entries maximum
- Cache key format: `{sourceLanguage}:{targetLanguage}:{text.substring(0, 100)}`
- Eviction: Least Recently Used (LRU) when cache is full
- Batch optimization: Checks cache before batching, only translates uncached items

**Batch Translation Process**:

1. Check cache for each request individually
2. Combine uncached requests with markers: `[0] context: text`
3. Send combined text to translator API
4. Split response back using markers and patterns
5. Cache all new translations
6. Return complete results array

**Context Handling**:

- Context prepended as: `{context}\n\n{text}`
- Response parsed to extract just the text translation
- Fallback parsing if context separation fails

**API Reference**:

```typescript
class ChromeTranslator {
  async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    context?: string
  ): Promise<string>;

  async batchTranslate(
    requests: TranslationRequest[],
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<TranslationResult[]>;

  async isAvailable(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<boolean>;
  clearCache(): void;
  destroy(): void;

  // Private methods
  private getTranslator(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<Translator>;
  private extractTranslation(fullTranslation: string): string;
  private splitBatchTranslation(combined: string, count: number): string[];
}

// Interfaces from implementation
interface TranslationRequest {
  text: string;
  context?: string;
}

interface TranslationResult {
  original: string;
  translation: string;
  context?: string;
}
```

**Session Management**:

- Sessions keyed by `{sourceLanguage}-{targetLanguage}`
- Automatic session creation and reuse
- Cleanup on destroy() or individual session errors

**Error Types**:

- `api_unavailable`: Translator API not available or language pair not supported
- `invalid_input`: Batch size exceeds maximum of 20 items
- `processing_failed`: Translation failed or response parsing failed

### 5. Vocabulary Analysis

**Purpose**: Analyze vocabulary difficulty and generate learning materials using Chrome's Prompt API

**Implementation**: `src/utils/chrome-ai.ts` - `ChromeVocabularyAnalyzer` class

**Usage**:

```typescript
import { ChromeVocabularyAnalyzer } from '../utils/chrome-ai';
import type { VocabularyAnalysis } from '../types';

const analyzer = new ChromeVocabularyAnalyzer();

// Analyze vocabulary difficulty with context
const analyses = await analyzer.analyzeVocabulary(
  ['example', 'sophisticated', 'elementary'],
  'This is an example of sophisticated yet elementary text used in academic writing.'
);

// Filter out proper nouns automatically
console.log(analyses); // Only returns non-proper nouns

// Generate example sentences for a specific word
const examples = await analyzer.generateExamples('sophisticated', 3);
console.log(examples); // Array of 3 example sentences

// Check availability
const available = await analyzer.isAvailable();

// Cleanup
analyzer.destroy();
```

**Features**:

- **Structured Analysis**: Uses JSON-formatted prompts for consistent responses
- **Difficulty Assessment**: 1-10 scale based on vocabulary complexity
- **Proper Noun Filtering**: Automatically excludes names, places, brands from results
- **Technical Term Detection**: Identifies domain-specific vocabulary
- **Example Generation**: Creates 1-3 contextual example sentences per word
- **Context-Aware**: Analysis considers surrounding article content
- **Session Management**: Maintains single prompt session with system prompt

**System Prompt**:
The analyzer uses a specialized system prompt that instructs the AI to:

1. Assess difficulty level (1-10, where 1 is basic and 10 is advanced)
2. Identify proper nouns (names, places, brands)
3. Identify technical terms
4. Generate 1-3 example sentences showing different contexts
5. Respond in structured JSON format

**Analysis Process**:

1. For each word, sends analysis request with context
2. Parses JSON response for structured data
3. Filters out proper nouns from final results
4. Continues processing remaining words on individual failures

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

  // Private methods
  private getSession(): Promise<PromptSession>;
  private analyzeWord(
    session: PromptSession,
    word: string,
    context: string
  ): Promise<VocabularyAnalysis>;
}

// From src/types/index.ts
interface VocabularyAnalysis {
  word: string;
  difficulty: number; // 1-10 scale
  isProperNoun: boolean;
  isTechnicalTerm: boolean;
  exampleSentences: string[];
}
```

**JSON Response Format**:

```json
{
  "word": "sophisticated",
  "difficulty": 7,
  "isProperNoun": false,
  "isTechnicalTerm": false,
  "exampleSentences": [
    "The sophisticated algorithm processes complex data efficiently.",
    "She has a sophisticated understanding of classical music.",
    "The restaurant offers sophisticated dining experiences."
  ]
}
```

**Example Generation**:

- Generates specified number of sentences (default: 3)
- Ensures each sentence contains the target word
- Provides diverse contextual usage
- Filters and validates sentence quality

**Session Management**:

- Single session with predefined system prompt
- Session reused across multiple analysis requests
- Automatic cleanup on destroy() or errors

**Error Types**:

- `api_unavailable`: Prompt API not available or not ready
- `processing_failed`: Analysis failed, JSON parsing failed, or example generation failed

## AI Service Coordination and Fallback

### Purpose

The `AIServiceCoordinator` provides unified access to all AI services with automatic fallback from Chrome AI to Gemini API when services are unavailable.

**Implementation**: `src/utils/ai-service-coordinator.ts` - `AIServiceCoordinator` class

### Usage

```typescript
import { AIServiceCoordinator } from '../utils/ai-service-coordinator';

// Initialize with optional Gemini API key
const coordinator = new AIServiceCoordinator('your-gemini-api-key');

// All methods automatically handle fallback
const language = await coordinator.detectLanguage(text);
const summary = await coordinator.summarizeContent(text, { maxLength: 200 });
const translation = await coordinator.translateText(text, 'en', 'es');
const analyses = await coordinator.analyzeVocabulary(words, context);

// Check service availability
const available = await coordinator.isAvailable();
const status = await coordinator.getServiceStatus();

// Update API key dynamically
coordinator.setGeminiApiKey('new-api-key');

// Cleanup all resources
coordinator.destroy();
```

### Fallback Strategy

The coordinator implements a two-tier fallback system:

1. **Primary**: Chrome Built-in AI APIs (local, privacy-focused)
2. **Fallback**: Gemini API (requires user-provided API key)

**Fallback Triggers**:

- Chrome AI API unavailable (`api_unavailable` error)
- Hardware requirements not met
- Non-retryable errors (invalid input, processing failures)

**Service Status Caching**:

- Status cached for 60 seconds to avoid repeated availability checks
- Force refresh available via `updateServiceStatus(true)`
- Automatic invalidation on API key changes

### API Reference

```typescript
class AIServiceCoordinator implements AIProcessor, AIServiceManager {
  constructor(geminiApiKey?: string);

  // Configuration
  setGeminiApiKey(apiKey: string): void;

  // Service Management
  async isAvailable(): Promise<boolean>;
  async getServiceStatus(): Promise<ServiceStatus>;

  // AI Processing (with automatic fallback)
  async detectLanguage(text: string): Promise<string>;
  async summarizeContent(
    text: string,
    options?: SummaryOptions
  ): Promise<string>;
  async rewriteContent(text: string, difficulty: number): Promise<string>;
  async translateText(text: string, from: string, to: string): Promise<string>;
  async analyzeVocabulary(
    words: string[],
    context: string
  ): Promise<VocabularyAnalysis[]>;

  // Unified Processing Interface
  async processWithFallback<T>(task: AITask, data: unknown): Promise<T>;
  async handleError(error: AIError): Promise<void>;

  // Cleanup
  destroy(): void;
}

interface ServiceStatus {
  chromeAI: boolean;
  geminiAPI: boolean;
  lastChecked: Date;
}

type AITask =
  | 'language_detection'
  | 'summarization'
  | 'rewriting'
  | 'translation'
  | 'vocabulary_analysis';
```

### Retry Handler

The coordinator includes a `RetryHandler` class for robust error recovery:

```typescript
import { RetryHandler } from '../utils/ai-service-coordinator';

const retryHandler = new RetryHandler(3, 1000); // 3 retries, 1s base delay

const result = await retryHandler.execute(
  () => coordinator.translateText('Hello', 'en', 'es'),
  error => error.retryable // Custom retry condition
);
```

**Retry Features**:

- Configurable maximum retries (default: 3)
- Exponential backoff with configurable base delay (default: 1s)
- Maximum delay cap (30 seconds)
- Custom retry conditions via callback function

## Error Handling

### Error Types

All AI services throw standardized `AIError` objects defined in `src/types/index.ts`:

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

type ErrorType =
  | 'network'
  | 'api_unavailable'
  | 'rate_limit'
  | 'invalid_input'
  | 'processing_failed';
```

**Error Type Descriptions**:

- **`api_unavailable`**: Chrome AI API not available, not ready, or language pair unsupported
- **`network`**: Network connectivity issues (retryable)
- **`rate_limit`**: API rate limits exceeded (retryable)
- **`invalid_input`**: Invalid parameters (difficulty out of range, empty text, etc.)
- **`processing_failed`**: AI processing failed, validation failed, or unknown errors

### Error Handling Patterns

**Basic Error Handling**:

```typescript
try {
  const result = await coordinator.translateText('Hello', 'en', 'es');
} catch (error) {
  if (error.type === 'api_unavailable') {
    console.log(
      'Service unavailable, fallback will be attempted automatically'
    );
  } else if (error.retryable) {
    console.log('Retryable error, consider retry with backoff');
  } else {
    console.error('Non-retryable error:', error.message);
  }
}
```

**Comprehensive Error Recovery**:

```typescript
async function processWithErrorHandling(text: string) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      return await coordinator.summarizeContent(text);
    } catch (error) {
      attempt++;

      if (!error.retryable || attempt >= maxRetries) {
        // Log error details for debugging
        console.error('Processing failed:', {
          type: error.type,
          message: error.message,
          retryable: error.retryable,
          attempt,
          originalError: error.originalError,
        });
        throw error;
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

**Service-Specific Error Handling**:

```typescript
// Language Detection
try {
  const language = await detector.detectLanguage(text);
} catch (error) {
  if (
    error.type === 'processing_failed' &&
    error.message.includes('No language detected')
  ) {
    // Handle undetectable language
    return 'unknown';
  }
  throw error;
}

// Translation
try {
  const translation = await translator.translateText(word, 'en', 'es');
} catch (error) {
  if (
    error.type === 'api_unavailable' &&
    error.message.includes('not available for')
  ) {
    // Handle unsupported language pair
    console.log('Language pair not supported by Chrome AI');
    // Coordinator will automatically try Gemini API
  }
  throw error;
}

// Vocabulary Analysis
try {
  const analyses = await analyzer.analyzeVocabulary(words, context);
} catch (error) {
  if (error.type === 'processing_failed') {
    // Individual word analysis failures are handled internally
    // This error means complete failure
    console.log('Vocabulary analysis completely failed');
  }
  throw error;
}
```

### Error Recovery in AI Service Coordinator

The `AIServiceCoordinator` implements sophisticated error recovery:

**Compound Error Handling**:
When both Chrome AI and Gemini API fail, a compound error is created:

```typescript
// Example compound error
{
  type: 'processing_failed',
  message: 'All AI services failed for translation. Errors: api_unavailable: Chrome AI not ready; network: Gemini API timeout',
  retryable: false // Only retryable if ALL errors are retryable
}
```

**Service Status Management**:

- Non-retryable errors mark services as unavailable
- Status cache prevents repeated failed attempts
- Automatic status refresh on retryable errors

**Exponential Backoff**:

- Base delay: 1 second
- Maximum delay: 30 seconds
- Applied automatically for retryable errors

## Caching System

### Purpose

The caching system optimizes performance and reduces API calls by storing processed results locally using Chrome's storage API.

**Implementation**: `src/utils/cache-manager.ts` - `CacheManager` class

### Cache Types

**1. Language Detection Cache**:

- **Location**: `ChromeLanguageDetector` class
- **Size**: 100 entries (LRU eviction)
- **Key Format**: First 200 characters of text (trimmed)
- **TTL**: No expiration (cleared manually or on cache size limit)

**2. Translation Cache**:

- **Location**: `ChromeTranslator` class
- **Size**: 500 entries (LRU eviction)
- **Key Format**: `{sourceLanguage}:{targetLanguage}:{text.substring(0, 100)}`
- **TTL**: No expiration (cleared manually or on cache size limit)

**3. Processed Content Cache**:

- **Location**: `CacheManager` class
- **Key Format**: `processed:{contentHash}:{type}:{parameter}`
- **Types**: 'summary', 'rewrite', 'vocabulary'
- **TTL**: 24 hours (configurable)

**4. Article Cache**:

- **Location**: `CacheManager` class
- **Key Format**: `article:{url}:{language}`
- **TTL**: 24 hours (configurable)

### Usage Examples

```typescript
import { CacheManager, generateContentHash } from '../utils/cache-manager';

const cacheManager = new CacheManager({
  maxCacheSize: 1000,
  ttl: 24 * 60 * 60 * 1000, // 24 hours
});

// Cache processed content
const contentHash = generateContentHash(articleText);
await cacheManager.cacheProcessedContent(
  contentHash,
  'summary',
  200, // maxLength parameter
  summaryResult
);

// Retrieve cached content
const cached = await cacheManager.getCachedProcessedContent(
  contentHash,
  'summary',
  200
);

// Cache translations
await cacheManager.cacheVocabularyTranslation('hello', 'en', 'es', 'hola');
const translation = await cacheManager.getCachedTranslation(
  'hello',
  'en',
  'es'
);

// Performance metrics
const metrics = cacheManager.getPerformanceMetrics();
console.log(
  `Hit rate: ${metrics.hitRate}, Average latency: ${metrics.averageLatency}ms`
);
```

### Content Hash Generation

```typescript
// Optimized hash generation for large content
function generateContentHash(content: string): string {
  let hash = 0;
  const len = content.length;

  if (len > 1000) {
    // Sample every nth character for large content
    const step = Math.floor(len / 100);
    for (let i = 0; i < len; i += step) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash + char) & 0x7fffffff;
    }
  } else {
    // Process all characters for smaller content
    for (let i = 0; i < len; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash + char) & 0x7fffffff;
    }
  }

  return hash.toString(36);
}
```

### Cache Performance Monitoring

```typescript
// Get performance metrics
const metrics = cacheManager.getPerformanceMetrics();
console.log({
  operations: metrics.operations,
  averageLatency: metrics.averageLatency,
  hitRate: metrics.hitRate,
  missRate: metrics.missRate,
  totalTime: metrics.totalTime,
});

// Get cache statistics by type
const stats = cacheManager.getCacheStats('processed');
console.log({
  hitRate: stats.hitRate,
  missRate: stats.missRate,
  totalRequests: stats.totalRequests,
});

// Reset metrics
cacheManager.resetPerformanceMetrics();
```

## Performance Optimizations

### Caching Strategies

**Language Detection**:

- **Size**: 100 entries with LRU eviction
- **Key**: First 200 characters of text (trimmed)
- **Benefit**: Avoids repeated detection of similar content

**Translation**:

- **Size**: 500 entries with LRU eviction
- **Key**: `{sourceLanguage}:{targetLanguage}:{text.substring(0, 100)}`
- **Batch Optimization**: Checks cache before batching, only translates uncached items

**Processed Content**:

- **TTL**: 24 hours with automatic expiration
- **Key**: `processed:{contentHash}:{type}:{parameter}`
- **Hash Optimization**: Sampling for large content (>1000 chars) for faster hashing

### Batch Processing

**Translation Batching**:

- **Batch Size**: Up to 20 words per API call
- **Cache Integration**: Mixed cache hits/misses handled efficiently
- **Marker System**: Uses `[0]`, `[1]` markers to separate combined translations
- **Fallback Parsing**: Multiple parsing strategies for robust response handling

### Session Management

**Translator Sessions**:

- **Session Reuse**: Sessions keyed by `{sourceLanguage}-{targetLanguage}`
- **Automatic Cleanup**: All sessions destroyed on `destroy()` call
- **Memory Efficiency**: Prevents session accumulation and memory leaks

**Other Services**:

- **Active Session Tracking**: Summarizer and Rewriter track active sessions
- **Graceful Cleanup**: Individual session cleanup on completion
- **Error Recovery**: Sessions cleaned up even on errors

### Chunking Strategies

**Summarizer**:

- **Threshold**: 10,000 characters for hierarchical processing
- **Chunk Size**: ~5,000 characters with natural boundaries
- **Hierarchical**: Multi-level summarization for very long content

**Rewriter**:

- **Threshold**: 5,000 characters for chunk processing
- **Chunk Strategy**: 3 paragraphs at a time, maintaining paragraph boundaries
- **Structure Preservation**: Rejoins with original paragraph spacing

**Content Hash Generation**:

- **Large Content**: Samples every nth character for performance
- **Small Content**: Processes all characters for accuracy
- **Threshold**: 1,000 characters determines sampling strategy

## Browser Compatibility and Requirements

### Chrome Version Requirements

- **Minimum**: Chrome 140+ (stable channel)
- **APIs**: Language Detector, Summarizer, Rewriter, Translator, Prompt API
- **Hardware**: Varies by API, automatically detected

### Availability Detection

Each service implements individual availability checking:

```typescript
// Individual service availability
const languageAvailable = await detector.isAvailable();
const summarizerAvailable = await summarizer.isAvailable();
const rewriterAvailable = await rewriter.isAvailable();
const translatorAvailable = await translator.isAvailable('en', 'es');
const analyzerAvailable = await analyzer.isAvailable();

// Coordinator overall availability
const coordinatorAvailable = await coordinator.isAvailable();
const status = await coordinator.getServiceStatus();
console.log({
  chromeAI: status.chromeAI,
  geminiAPI: status.geminiAPI,
  lastChecked: status.lastChecked,
});
```

### Hardware Requirements

Chrome AI APIs have varying hardware requirements:

- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 22GB for model downloads
- **GPU**: 4GB VRAM recommended for optimal performance

### Graceful Degradation

When Chrome AI is unavailable:

1. **Automatic Fallback**: Coordinator automatically tries Gemini API
2. **User Notification**: Extension can inform users about hardware requirements
3. **API Key Setup**: Guide users to configure Gemini API key for fallback
4. **Feature Limitation**: Some features may be limited without Chrome AI

## Complete Usage Examples

### Article Processing Pipeline

```typescript
import { AIServiceCoordinator } from '../utils/ai-service-coordinator';
import { CacheManager, generateContentHash } from '../utils/cache-manager';
import type { ProcessedArticle, VocabularyItem } from '../types';

async function processArticleForLearning(
  articleContent: string,
  userDifficulty: number,
  userNativeLanguage: string,
  geminiApiKey?: string
): Promise<ProcessedArticle> {
  const coordinator = new AIServiceCoordinator(geminiApiKey);
  const cacheManager = new CacheManager();

  try {
    // 1. Detect article language
    console.log('Detecting language...');
    const language = await coordinator.detectLanguage(articleContent);
    console.log(`Detected language: ${language}`);

    // 2. Check cache for processed content
    const contentHash = generateContentHash(articleContent);
    let summary = await cacheManager.getCachedProcessedContent(
      contentHash,
      'summary',
      200
    );

    if (!summary) {
      // 3. Summarize and subdivide article
      console.log('Summarizing content...');
      summary = await coordinator.summarizeContent(articleContent, {
        maxLength: 200,
        format: 'paragraph',
      });

      // Cache the summary
      await cacheManager.cacheProcessedContent(
        contentHash,
        'summary',
        200,
        summary
      );
    }

    // 4. Subdivide article into learning parts
    console.log('Subdividing article...');
    const summarizer = new ChromeSummarizer();
    const parts = await summarizer.subdivideArticle(articleContent);

    // 5. Adapt each part for user difficulty
    console.log(
      `Adapting ${parts.length} parts for difficulty ${userDifficulty}...`
    );
    const adaptedParts = await Promise.all(
      parts.map(async (part, index) => {
        // Check cache first
        let adapted = await cacheManager.getCachedProcessedContent(
          generateContentHash(part),
          'rewrite',
          userDifficulty
        );

        if (!adapted) {
          adapted = await coordinator.rewriteContent(part, userDifficulty);
          await cacheManager.cacheProcessedContent(
            generateContentHash(part),
            'rewrite',
            userDifficulty,
            adapted
          );
        }

        return {
          id: `part-${index}`,
          content: adapted,
          originalContent: part,
          vocabulary: [],
          sentences: [],
          partIndex: index,
        };
      })
    );

    // 6. Extract vocabulary from first part
    const vocabulary = extractVocabularyWords(adaptedParts[0].content);
    console.log(`Extracted ${vocabulary.length} vocabulary words`);

    // 7. Batch translate vocabulary
    console.log('Translating vocabulary...');
    const translationRequests = vocabulary.map(word => ({
      text: word,
      context: adaptedParts[0].content.substring(0, 200),
    }));

    const translations = await coordinator.translateText(
      translationRequests.map(r => r.text).join(', '),
      language,
      userNativeLanguage
    );

    // 8. Analyze vocabulary difficulty
    console.log('Analyzing vocabulary...');
    const analyses = await coordinator.analyzeVocabulary(
      vocabulary,
      adaptedParts[0].content
    );

    // 9. Create processed article
    const processedArticle: ProcessedArticle = {
      id: generateContentHash(articleContent),
      url: window.location.href,
      title: document.title,
      originalLanguage: language,
      processedAt: new Date(),
      parts: adaptedParts,
      processingStatus: 'completed',
      cacheExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    console.log('Article processing complete');
    return processedArticle;
  } catch (error) {
    console.error('Article processing failed:', error);
    throw error;
  } finally {
    // Always cleanup resources
    coordinator.destroy();
  }
}

// Helper function to extract vocabulary words
function extractVocabularyWords(text: string): string[] {
  return (
    text
      .toLowerCase()
      .match(/\b[a-z]{3,}\b/g) // Words 3+ characters
      ?.filter((word, index, arr) => arr.indexOf(word) === index) // Unique
      ?.slice(0, 20) || []
  ); // Limit to 20 words
}
```

### Robust Error Handling with Fallback

```typescript
import { RetryHandler } from '../utils/ai-service-coordinator';

class RobustAIProcessor {
  private coordinator: AIServiceCoordinator;
  private retryHandler: RetryHandler;

  constructor(geminiApiKey?: string) {
    this.coordinator = new AIServiceCoordinator(geminiApiKey);
    this.retryHandler = new RetryHandler(3, 1000); // 3 retries, 1s base delay
  }

  async processWithFallback<T>(
    operation: () => Promise<T>,
    fallbackOperation?: () => Promise<T>
  ): Promise<T> {
    try {
      // Try main operation with retry
      return await this.retryHandler.execute(operation);
    } catch (primaryError) {
      console.warn('Primary operation failed:', primaryError.message);

      if (fallbackOperation) {
        try {
          console.log('Attempting fallback operation...');
          return await fallbackOperation();
        } catch (fallbackError) {
          console.error(
            'Fallback operation also failed:',
            fallbackError.message
          );
          throw new Error(
            `Both primary and fallback operations failed: ${primaryError.message}; ${fallbackError.message}`
          );
        }
      }

      throw primaryError;
    }
  }

  async translateWithFallback(
    text: string,
    from: string,
    to: string
  ): Promise<string> {
    return this.processWithFallback(
      // Primary: Use coordinator (Chrome AI -> Gemini API)
      () => this.coordinator.translateText(text, from, to),

      // Fallback: Simple word-by-word translation
      async () => {
        console.log('Using simple fallback translation');
        return `[Translation of: ${text}]`; // Placeholder fallback
      }
    );
  }

  async analyzeWithGracefulDegradation(
    words: string[],
    context: string
  ): Promise<VocabularyAnalysis[]> {
    try {
      return await this.coordinator.analyzeVocabulary(words, context);
    } catch (error) {
      console.warn(
        'Vocabulary analysis failed, using basic analysis:',
        error.message
      );

      // Graceful degradation: basic analysis
      return words.map(word => ({
        word,
        difficulty: Math.min(Math.max(word.length - 2, 1), 10), // Length-based difficulty
        isProperNoun: /^[A-Z]/.test(word),
        isTechnicalTerm: false,
        exampleSentences: [`Example sentence with ${word}.`],
      }));
    }
  }

  destroy(): void {
    this.coordinator.destroy();
  }
}

// Usage
const processor = new RobustAIProcessor('your-gemini-api-key');

try {
  const translation = await processor.translateWithFallback(
    'Hello',
    'en',
    'es'
  );
  const analysis = await processor.analyzeWithGracefulDegradation(
    ['hello', 'world'],
    'Hello world context'
  );

  console.log({ translation, analysis });
} finally {
  processor.destroy();
}
```

### Performance Monitoring and Optimization

```typescript
import { CacheManager } from '../utils/cache-manager';

class PerformanceMonitor {
  private cacheManager: CacheManager;
  private operationTimes: Map<string, number[]> = new Map();

  constructor() {
    this.cacheManager = new CacheManager();
  }

  async monitorOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await operation();
      const duration = performance.now() - startTime;

      // Track operation times
      if (!this.operationTimes.has(operationName)) {
        this.operationTimes.set(operationName, []);
      }
      this.operationTimes.get(operationName)!.push(duration);

      console.log(`${operationName} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(
        `${operationName} failed after ${duration.toFixed(2)}ms:`,
        error.message
      );
      throw error;
    }
  }

  getPerformanceReport(): Record<string, any> {
    const report: Record<string, any> = {};

    // Operation performance
    for (const [operation, times] of this.operationTimes) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      report[operation] = {
        averageTime: avgTime.toFixed(2),
        minTime: minTime.toFixed(2),
        maxTime: maxTime.toFixed(2),
        totalCalls: times.length,
      };
    }

    // Cache performance
    report.cache = this.cacheManager.getPerformanceMetrics();

    return report;
  }

  resetMetrics(): void {
    this.operationTimes.clear();
    this.cacheManager.resetPerformanceMetrics();
  }
}

// Usage
const monitor = new PerformanceMonitor();
const coordinator = new AIServiceCoordinator();

// Monitor operations
const language = await monitor.monitorOperation('language_detection', () =>
  coordinator.detectLanguage(text)
);

const summary = await monitor.monitorOperation('summarization', () =>
  coordinator.summarizeContent(text, { maxLength: 200 })
);

// Get performance report
const report = monitor.getPerformanceReport();
console.log('Performance Report:', JSON.stringify(report, null, 2));
```

## Related Documentation

- **[Architecture Overview](../architecture/README.md)** - System design and component relationships
- **[Development Guide](../development/README.md)** - Setup and contribution guidelines
- **[Testing Guide](../testing/README.md)** - API testing strategies and mocks
- **[User Guide](../user-guide/README.md)** - End-user feature documentation

This comprehensive API documentation covers all implemented Chrome AI services, error handling patterns, caching strategies, and real-world usage examples for the Language Learning Chrome Extension.
