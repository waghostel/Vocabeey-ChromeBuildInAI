# Technical Architecture

## System Overview

The Language Learning Chrome Extension uses a Manifest V3 architecture with service worker background processing, content script injection, and offscreen documents for AI processing.

## Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Content       │    │   Service        │    │   Learning      │
│   Script        │───▶│   Worker         │───▶│   Interface     │
│                 │    │                  │    │   (New Tab)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   DOM           │    │   Offscreen      │    │   Chrome        │
│   Extraction    │    │   Document       │    │   Storage       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Chrome AI      │
                       │   APIs           │
                       └──────────────────┘
```

## Core Components

### 1. Service Worker (`src/background/`)

**Purpose**: Extension lifecycle management and message routing

**Responsibilities**:

- Handle extension icon clicks
- Manage tab creation and cleanup
- Route messages between components
- Initialize extension settings
- Coordinate AI processing requests

**Limitations**:

- No DOM access
- No `window` or `document` objects
- Limited to Chrome extension APIs

### 2. Content Scripts (`src/content/`)

**Purpose**: Web page interaction and content extraction

**Responsibilities**:

- Extract article content from web pages
- Inject learning interface elements
- Handle user interactions on pages
- Communicate with service worker

**Capabilities**:

- Full DOM access
- Page script isolation
- Chrome messaging APIs

### 3. Offscreen Documents (`src/offscreen/`)

**Purpose**: Heavy AI processing without service worker timeouts

**Responsibilities**:

- Chrome AI API calls
- Content processing and analysis
- Vocabulary and translation processing
- Maintain processing context

**Advantages**:

- No service worker timeout limits
- DOM access for processing
- Persistent context for AI sessions

### 4. UI Components (`src/ui/`)

**Purpose**: Learning interface and user interaction

**Responsibilities**:

- Render learning interface in new tabs
- Handle vocabulary and sentence highlighting
- Manage learning modes and navigation
- Settings and configuration interface

## Data Flow Architecture

### 1. Content Extraction Flow

```
Web Page → Content Script → Service Worker → Offscreen Document → AI APIs
```

1. User clicks extension icon on article page
2. Content script extracts article content
3. Service worker receives extraction message
4. Offscreen document processes content with AI
5. Results stored in Chrome storage
6. Learning interface opened in new tab

### 2. Learning Interface Flow

```
New Tab → UI Components → Chrome Storage → Display Content
```

1. Service worker creates new tab with learning interface
2. UI components load from Chrome storage
3. Article content rendered in card-based layout
4. User interactions update storage and UI

### 3. AI Processing Pipeline

```
Raw Content → Language Detection → Summarization → Translation → Vocabulary Analysis
```

1. **Language Detection**: Identify article language
2. **Content Processing**: Summarize and clean content
3. **Difficulty Adaptation**: Rewrite based on user level
4. **Translation**: Translate vocabulary and sentences
5. **Analysis**: Generate learning materials

## Storage Architecture

### Storage Strategy

- **Session Storage**: Temporary processing state
- **Local Storage**: Persistent user data and settings
- **Cache Management**: AI results and processed content

### Data Schema

```typescript
interface StorageSchema {
  schema_version: string;
  user_settings: UserSettings;
  articles: Record<string, ProcessedArticle>;
  vocabulary: Record<string, VocabularyItem>;
  sentences: Record<string, SentenceItem>;
  processing_queue: ProcessingTask[];
  statistics: UserStatistics;
}
```

### Storage Patterns

- **Versioned Schema**: Migration support for updates
- **Relational Structure**: Articles → Parts → Vocabulary/Sentences
- **Automatic Cleanup**: Quota management and archiving
- **Export/Import**: User data portability

## AI Service Integration

### Chrome Built-in AI APIs

- **Language Detector**: Article language identification
- **Summarizer**: Content processing and subdivision
- **Rewriter**: Difficulty-based content adaptation
- **Translator**: Vocabulary and sentence translation
- **Prompt API**: Advanced vocabulary analysis

### Fallback Chain

```
Chrome AI (Primary) → Gemini API (Fallback) → Error Handling
```

### Service Coordination

```typescript
class AIServiceCoordinator {
  async processContent(content: string): Promise<ProcessedContent> {
    try {
      return await this.chromeAI.process(content);
    } catch (error) {
      if (this.geminiAPI.isAvailable()) {
        return await this.geminiAPI.process(content);
      }
      throw new ProcessingError('All AI services unavailable');
    }
  }
}
```

## Component Communication

### Message Passing System

All inter-component communication uses typed message interfaces:

```typescript
interface MessageTypes {
  EXTRACT_CONTENT: { url: string };
  CONTENT_EXTRACTED: { content: string; metadata: ContentMetadata };
  PROCESS_ARTICLE: { articleId: string };
  PROCESSING_COMPLETE: { articleId: string; result: ProcessedArticle };
  OPEN_LEARNING_INTERFACE: { articleId: string };
}
```

### Communication Patterns

**Content Script → Service Worker**:

```typescript
chrome.runtime.sendMessage({
  type: 'CONTENT_EXTRACTED',
  content: extractedContent,
  metadata: { title, url, language },
});
```

**Service Worker → Offscreen Document**:

```typescript
chrome.runtime.sendMessage({
  type: 'PROCESS_ARTICLE',
  articleId: 'article_123',
});
```

**UI Components → Storage**:

```typescript
const article = await chrome.storage.local.get(['articles']);
await chrome.storage.local.set({ articles: updatedArticles });
```

## Performance Optimizations

### 1. Batch Processing

- **Translation Batching**: Up to 20 words per API call
- **Vocabulary Analysis**: Batch processing for efficiency
- **Storage Operations**: Bulk read/write operations

### 2. Caching Strategy

- **Language Detection Cache**: 100 entries, LRU eviction
- **Translation Cache**: 500 entries, LRU eviction
- **Session Reuse**: AI service session management
- **Content Caching**: Processed articles with expiration

### 3. Memory Management

- **Resource Cleanup**: Automatic AI session cleanup
- **Storage Monitoring**: Quota usage tracking
- **Progressive Loading**: Incremental content processing
- **Lazy Initialization**: On-demand component loading

### 4. Chunking and Streaming

- **Content Chunking**: Large articles split for processing
- **Hierarchical Summarization**: Multi-level content reduction
- **Progressive Display**: Stream results to UI
- **Background Processing**: Non-blocking operations

## Error Handling Architecture

### Error Classification

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

### Recovery Strategies

- **Retry Logic**: Exponential backoff for retryable errors
- **Fallback Services**: Chrome AI → Gemini API chain
- **Graceful Degradation**: Partial functionality when services fail
- **User Feedback**: Clear error messages and recovery options

### Error Propagation

```
Component Error → Error Handler → User Notification → Recovery Action
```

## Security Considerations

### Content Security Policy

- **Strict CSP**: No inline scripts or eval
- **Extension APIs Only**: Limited external resource access
- **Secure Communication**: Message validation and sanitization

### Data Protection

- **Local Processing**: AI processing happens locally or with user keys
- **No Telemetry**: Privacy-focused with no usage tracking
- **Secure Storage**: Chrome storage with proper access controls
- **Content Sanitization**: XSS prevention in content processing

### API Key Management

- **User-Provided Keys**: Gemini API keys stored securely
- **Key Validation**: API key format and permission checking
- **Secure Transmission**: HTTPS-only API communication

## Scalability Patterns

### Horizontal Scaling

- **Multiple Tabs**: Independent learning interface instances
- **Concurrent Processing**: Parallel AI service calls
- **Distributed Storage**: Per-tab session storage

### Vertical Scaling

- **Resource Monitoring**: Memory and CPU usage tracking
- **Adaptive Processing**: Adjust batch sizes based on performance
- **Progressive Enhancement**: Feature availability based on capabilities

### Performance Monitoring

```typescript
interface PerformanceMetrics {
  processingTime: number;
  memoryUsage: number;
  apiCallCount: number;
  cacheHitRate: number;
  errorRate: number;
}
```

## Extension Lifecycle

### Installation Flow

1. Extension installed → Service worker activated
2. Default settings initialized in storage
3. Setup wizard presented to user
4. Chrome AI availability detected
5. User preferences configured

### Update Flow

1. Extension updated → Service worker restarted
2. Storage schema migration if needed
3. New features enabled
4. User notified of changes

### Uninstall Flow

1. User data export offered
2. Storage cleanup performed
3. Extension removed

## Development Patterns

### Dependency Injection

```typescript
class ComponentManager {
  constructor(
    private aiService: AIService,
    private storage: StorageManager,
    private cache: CacheManager
  ) {}
}
```

### Factory Pattern

```typescript
class AIServiceFactory {
  static create(): AIService {
    if (ChromeAI.isAvailable()) {
      return new ChromeAIService();
    }
    return new GeminiAPIService();
  }
}
```

### Observer Pattern

```typescript
class StorageManager extends EventTarget {
  async set(data: any): Promise<void> {
    await chrome.storage.local.set(data);
    this.dispatchEvent(new CustomEvent('storage-updated', { detail: data }));
  }
}
```

## Testing Architecture

### Test Categories

- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component interaction
- **User Acceptance Tests**: End-to-end workflows
- **System Tests**: Extension lifecycle and performance

### Mock Strategy

- **Chrome API Mocks**: Complete extension API simulation
- **AI Service Mocks**: Configurable AI response simulation
- **Storage Mocks**: In-memory storage with quota simulation
- **DOM Mocks**: Learning interface DOM structure

### Test Isolation

- **Independent Tests**: No shared state between tests
- **Mock Cleanup**: Proper cleanup after each test
- **Deterministic Results**: Consistent test outcomes

This architecture provides a robust, scalable, and maintainable foundation for the Language Learning Chrome Extension, with clear separation of concerns and comprehensive error handling.
