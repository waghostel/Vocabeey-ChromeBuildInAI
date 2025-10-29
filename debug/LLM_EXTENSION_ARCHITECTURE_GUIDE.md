# LLM Extension Architecture Guide

This guide provides a comprehensive architectural overview of the Language Learning Chrome Extension for Large Language Models to understand the system design, data flow, and component interactions.

## 🏗️ High-Level Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chrome Extension Ecosystem                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Service   │  │   Content   │  │  Offscreen  │  │   UI    │ │
│  │   Worker    │  │   Scripts   │  │  Documents  │  │ Components│ │
│  │             │  │             │  │             │  │         │ │
│  │ • Lifecycle │  │ • DOM       │  │ • AI        │  │ • Learning│ │
│  │ • Messages  │  │ • Injection │  │ • Processing│  │ • Settings│ │
│  │ • Storage   │  │ • Events    │  │ • Memory    │  │ • Setup   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│         │                │                │              │      │
│         └────────────────┼────────────────┼──────────────┘      │
│                          │                │                     │
├─────────────────────────────────────────────────────────────────┤
│                    Shared Infrastructure                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Types     │  │   Utils     │  │   Storage   │  │  Debug  │ │
│  │             │  │             │  │             │  │         │ │
│  │ • Interfaces│  │ • Services  │  │ • Manager   │  │ • Tools │ │
│  │ • Enums     │  │ • Helpers   │  │ • Cache     │  │ • Tests │ │
│  │ • Constants │  │ • Validators│  │ • Sync      │  │ • Reports│ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Core Principles

1. **Separation of Concerns**: Each context has specific responsibilities
2. **Message-Driven Architecture**: Communication via Chrome's message passing
3. **Centralized State Management**: Shared storage and caching layer
4. **AI-First Design**: Built around Chrome's Built-in AI APIs
5. **Performance Optimization**: Lazy loading and efficient resource usage

## 🔧 Component Architecture

### Service Worker (Background Context)

**File**: `src/background/service-worker.ts`

**Responsibilities**:

- Extension lifecycle management
- Message routing between contexts
- Background task orchestration
- Storage operations coordination
- Network request handling

**Key Interfaces**:

```typescript
interface ServiceWorkerMessage {
  type: 'PROCESS_ARTICLE' | 'UPDATE_SETTINGS' | 'CACHE_OPERATION';
  data: any;
  contextId?: string;
  timestamp: number;
}

interface BackgroundTask {
  id: string;
  type: 'ai-processing' | 'cache-cleanup' | 'data-sync';
  priority: number;
  payload: any;
}
```

**Architecture Pattern**:

```typescript
class ServiceWorkerManager {
  private messageRouter: MessageRouter;
  private taskQueue: BackgroundTaskQueue;
  private storageManager: StorageManager;

  async initialize() {
    await this.setupMessageHandlers();
    await this.initializeStorage();
    await this.startTaskProcessor();
  }

  private async handleMessage(message: ServiceWorkerMessage) {
    switch (message.type) {
      case 'PROCESS_ARTICLE':
        return this.routeToOffscreen(message);
      case 'UPDATE_SETTINGS':
        return this.updateSettings(message.data);
      // ... other message types
    }
  }
}
```

### Content Scripts

**File**: `src/content/content-script.ts`

**Responsibilities**:

- DOM manipulation and content extraction
- User interaction handling
- Learning interface injection
- Page-specific functionality

**Key Interfaces**:

```typescript
interface ContentExtractionResult {
  title: string;
  content: string;
  language: string;
  metadata: PageMetadata;
  extractionMethod: 'readability' | 'jina' | 'dom-parsing';
}

interface LearningInterface {
  mode: 'vocabulary' | 'sentence' | 'reading';
  highlightedElements: HTMLElement[];
  interactionHandlers: Map<string, EventListener>;
}
```

**Architecture Pattern**:

```typescript
class ContentScriptManager {
  private contentExtractor: ContentExtractor;
  private uiRenderer: UIRenderer;
  private interactionHandler: InteractionHandler;

  async initialize() {
    await this.extractPageContent();
    await this.setupLearningInterface();
    await this.bindEventHandlers();
  }

  private async extractPageContent(): Promise<ContentExtractionResult> {
    // Multi-strategy content extraction
    const strategies = [
      this.contentExtractor.useReadability,
      this.contentExtractor.useJinaReader,
      this.contentExtractor.useDOMParsing,
    ];

    for (const strategy of strategies) {
      try {
        const result = await strategy();
        if (this.validateContent(result)) {
          return result;
        }
      } catch (error) {
        console.warn('Content extraction strategy failed:', error);
      }
    }

    throw new Error('All content extraction strategies failed');
  }
}
```

### Offscreen Documents

**File**: `src/offscreen/ai-processor.ts`

**Responsibilities**:

- Heavy AI processing operations
- Chrome Built-in AI API integration
- Gemini API fallback handling
- Memory-intensive computations

**Key Interfaces**:

```typescript
interface AIProcessingRequest {
  type: 'summarize' | 'translate' | 'rewrite' | 'detect-language';
  content: string;
  options: AIProcessingOptions;
  fallbackEnabled: boolean;
}

interface AIProcessingResult {
  success: boolean;
  result?: any;
  error?: string;
  processingTime: number;
  memoryUsage: number;
  apiUsed: 'chrome-builtin' | 'gemini-fallback';
}
```

**Architecture Pattern**:

```typescript
class AIProcessor {
  private chromeAI: ChromeBuiltinAI;
  private geminiAPI: GeminiAPI;
  private memoryManager: MemoryManager;

  async processRequest(
    request: AIProcessingRequest
  ): Promise<AIProcessingResult> {
    const startTime = performance.now();
    const initialMemory = this.memoryManager.getCurrentUsage();

    try {
      // Try Chrome Built-in AI first
      if (await this.chromeAI.isAvailable(request.type)) {
        const result = await this.chromeAI.process(request);
        return this.createResult(
          result,
          'chrome-builtin',
          startTime,
          initialMemory
        );
      }

      // Fallback to Gemini API
      if (request.fallbackEnabled) {
        const result = await this.geminiAPI.process(request);
        return this.createResult(
          result,
          'gemini-fallback',
          startTime,
          initialMemory
        );
      }

      throw new Error('No AI service available');
    } catch (error) {
      return this.createErrorResult(error, startTime, initialMemory);
    }
  }
}
```

### UI Components

**Files**: `src/ui/learning-interface.html`, `src/ui/settings.html`, `src/ui/setup-wizard.html`

**Responsibilities**:

- Learning interface rendering
- User settings management
- Setup wizard flow
- Visual feedback and interactions

**Key Interfaces**:

```typescript
interface LearningInterfaceState {
  mode: 'vocabulary' | 'sentence' | 'reading';
  currentArticle: ProcessedArticle;
  highlightedWords: HighlightedWord[];
  userProgress: UserProgress;
  settings: UserSettings;
}

interface UIComponent {
  element: HTMLElement;
  state: any;
  render(): void;
  bindEvents(): void;
  cleanup(): void;
}
```

## 📊 Data Flow Architecture

### Primary Data Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Content   │───▶│   Service   │───▶│  Offscreen  │───▶│     UI      │
│   Script    │    │   Worker    │    │  Document   │    │ Components  │
│             │    │             │    │             │    │             │
│ • Extract   │    │ • Route     │    │ • Process   │    │ • Render    │
│ • Validate  │    │ • Queue     │    │ • Analyze   │    │ • Interact  │
│ • Send      │    │ • Store     │    │ • Transform │    │ • Update    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       └───────────────────┼───────────────────┼───────────────────┘
                           │                   │
                    ┌─────────────┐    ┌─────────────┐
                    │   Storage   │    │    Cache    │
                    │   Manager   │    │   Manager   │
                    │             │    │             │
                    │ • Persist   │    │ • Store     │
                    │ • Sync      │    │ • Retrieve  │
                    │ • Backup    │    │ • Invalidate│
                    └─────────────┘    └─────────────┘
```

### Message Flow Patterns

#### 1. Article Processing Flow

```typescript
// Content Script → Service Worker
chrome.runtime.sendMessage({
  type: 'PROCESS_ARTICLE',
  data: {
    content: extractedContent,
    url: window.location.href,
    language: detectedLanguage,
  },
});

// Service Worker → Offscreen Document
chrome.offscreen.createDocument({
  url: 'offscreen/ai-processor.html',
  reasons: ['BLOBS'],
  justification: 'AI processing for language learning',
});

// Offscreen Document → Service Worker
chrome.runtime.sendMessage({
  type: 'PROCESSING_COMPLETE',
  data: processedResult,
});

// Service Worker → Content Script
chrome.tabs.sendMessage(tabId, {
  type: 'RENDER_LEARNING_INTERFACE',
  data: processedResult,
});
```

#### 2. Settings Update Flow

```typescript
// UI Component → Service Worker
chrome.runtime.sendMessage({
  type: 'UPDATE_SETTINGS',
  data: newSettings,
});

// Service Worker → Storage
await chrome.storage.sync.set({ settings: newSettings });

// Service Worker → All Contexts
chrome.runtime.sendMessage({
  type: 'SETTINGS_UPDATED',
  data: newSettings,
});
```

#### 3. Error Propagation Flow

```typescript
// Any Context → Service Worker
chrome.runtime.sendMessage({
  type: 'ERROR_OCCURRED',
  data: {
    error: errorDetails,
    context: 'content-script',
    timestamp: Date.now(),
  },
});

// Service Worker → Error Handler
await this.errorHandler.handleError(errorData);

// Service Worker → Debug System (if enabled)
await this.debugSystem.logError(errorData);
```

## 🗄️ Storage Architecture

### Storage Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Storage Architecture                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Chrome    │  │   Memory    │  │   Cache     │         │
│  │   Storage   │  │   Storage   │  │   Storage   │         │
│  │             │  │             │  │             │         │
│  │ • sync      │  │ • session   │  │ • articles  │         │
│  │ • local     │  │ • temporary │  │ • processed │         │
│  │ • managed   │  │ • volatile  │  │ • results   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                │
│         └────────────────┼────────────────┘                │
│                          │                                 │
├─────────────────────────────────────────────────────────────┤
│                  Storage Manager                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Schema    │  │ Versioning  │  │ Migration   │         │
│  │ Management  │  │   System    │  │   System    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Storage Schema

```typescript
interface StorageSchema {
  version: number;
  settings: UserSettings;
  articles: StoredArticle[];
  cache: CacheEntry[];
  userProgress: UserProgress;
  debugData?: DebugData;
}

interface UserSettings {
  language: {
    learning: string;
    native: string;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  features: {
    vocabularyMode: boolean;
    sentenceMode: boolean;
    ttsEnabled: boolean;
  };
  ai: {
    preferredService: 'chrome-builtin' | 'gemini';
    fallbackEnabled: boolean;
  };
}

interface StoredArticle {
  id: string;
  url: string;
  title: string;
  content: string;
  processedContent?: ProcessedContent;
  metadata: ArticleMetadata;
  timestamp: number;
  expiresAt: number;
}
```

## 🔄 State Management

### State Flow Architecture

```typescript
class StateManager {
  private state: ApplicationState;
  private subscribers: Map<string, StateSubscriber[]>;
  private middleware: StateMiddleware[];

  async updateState(action: StateAction): Promise<void> {
    // Apply middleware
    for (const middleware of this.middleware) {
      action = await middleware.process(action);
    }

    // Update state
    const newState = this.reducer(this.state, action);
    const changes = this.calculateChanges(this.state, newState);
    this.state = newState;

    // Notify subscribers
    await this.notifySubscribers(changes);

    // Persist if needed
    if (action.persist) {
      await this.persistState(changes);
    }
  }

  subscribe(context: string, subscriber: StateSubscriber): void {
    if (!this.subscribers.has(context)) {
      this.subscribers.set(context, []);
    }
    this.subscribers.get(context)!.push(subscriber);
  }
}
```

### Context State Synchronization

```typescript
// Service Worker maintains global state
class GlobalStateManager {
  private state: GlobalState;

  async syncWithContext(contextId: string, contextState: any): Promise<void> {
    const mergedState = this.mergeStates(this.state, contextState);
    await this.updateGlobalState(mergedState);
    await this.broadcastStateUpdate(contextId, mergedState);
  }

  private async broadcastStateUpdate(
    excludeContext: string,
    state: GlobalState
  ): Promise<void> {
    // Notify all contexts except the sender
    const contexts = ['content-script', 'offscreen', 'ui'];
    for (const context of contexts) {
      if (context !== excludeContext) {
        await this.sendStateUpdate(context, state);
      }
    }
  }
}
```

## 🚀 Performance Architecture

### Performance Optimization Strategies

1. **Lazy Loading**: Load components and data on-demand
2. **Caching**: Multi-layer caching for processed content
3. **Memory Management**: Aggressive cleanup and garbage collection
4. **Request Batching**: Batch AI processing requests
5. **Background Processing**: Offload heavy operations to service worker

### Memory Management

```typescript
class MemoryManager {
  private memoryThresholds = {
    warning: 50 * 1024 * 1024, // 50MB
    critical: 100 * 1024 * 1024, // 100MB
  };

  async monitorMemoryUsage(): Promise<void> {
    const usage = this.getCurrentMemoryUsage();

    if (usage > this.memoryThresholds.critical) {
      await this.performAggressiveCleanup();
    } else if (usage > this.memoryThresholds.warning) {
      await this.performStandardCleanup();
    }
  }

  private async performAggressiveCleanup(): Promise<void> {
    // Clear all caches
    await this.cacheManager.clearAll();

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    // Compress stored data
    await this.storageManager.compressData();
  }
}
```

## 🔐 Security Architecture

### Security Principles

1. **Content Security Policy**: Strict CSP for all contexts
2. **Permission Minimization**: Request only necessary permissions
3. **Data Sanitization**: Sanitize all user inputs and external data
4. **Secure Communication**: Encrypted communication with external APIs
5. **Privacy Protection**: Local-first data processing

### Security Implementation

```typescript
class SecurityManager {
  private csp: ContentSecurityPolicy;
  private sanitizer: DataSanitizer;

  async validateContent(content: string): Promise<string> {
    // Sanitize HTML content
    const sanitized = this.sanitizer.sanitizeHTML(content);

    // Validate against CSP
    if (!this.csp.validate(sanitized)) {
      throw new SecurityError('Content violates CSP');
    }

    return sanitized;
  }

  async encryptSensitiveData(data: any): Promise<string> {
    // Encrypt sensitive data before storage
    return this.cryptoManager.encrypt(JSON.stringify(data));
  }
}
```

## 🧪 Testing Architecture

### Testing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Testing Architecture                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Unit     │  │ Integration │  │   E2E       │         │
│  │   Tests     │  │   Tests     │  │   Tests     │         │
│  │             │  │             │  │             │         │
│  │ • Utils     │  │ • Contexts  │  │ • User      │         │
│  │ • Services  │  │ • Messages  │  │ • Flows     │         │
│  │ • Components│  │ • Storage   │  │ • Scenarios │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                │                │
│         └────────────────┼────────────────┘                │
│                          │                                 │
├─────────────────────────────────────────────────────────────┤
│                  Debug Testing System                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Automated   │  │ Performance │  │ Monitoring  │         │
│  │ Scenarios   │  │ Testing     │  │ & Alerts    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 📈 Monitoring and Observability

### Monitoring Architecture

```typescript
class MonitoringSystem {
  private metrics: MetricsCollector;
  private alerts: AlertManager;
  private dashboard: DebugDashboard;

  async initialize(): Promise<void> {
    await this.metrics.startCollection();
    await this.alerts.setupAlertRules();
    await this.dashboard.initialize();
  }

  async collectMetrics(): Promise<void> {
    const metrics = {
      performance: await this.collectPerformanceMetrics(),
      memory: await this.collectMemoryMetrics(),
      errors: await this.collectErrorMetrics(),
      usage: await this.collectUsageMetrics(),
    };

    await this.metrics.store(metrics);
    await this.alerts.evaluate(metrics);
    await this.dashboard.update(metrics);
  }
}
```

## 🎯 Architecture Best Practices

### Design Principles

1. **Single Responsibility**: Each component has a clear, focused purpose
2. **Loose Coupling**: Components communicate through well-defined interfaces
3. **High Cohesion**: Related functionality is grouped together
4. **Dependency Injection**: Dependencies are injected rather than hard-coded
5. **Error Boundaries**: Errors are contained and handled gracefully

### Code Organization

```
src/
├── background/          # Service worker context
│   ├── service-worker.ts
│   ├── message-router.ts
│   └── task-queue.ts
├── content/            # Content script context
│   ├── content-script.ts
│   ├── content-extractor.ts
│   └── ui-renderer.ts
├── offscreen/          # Offscreen document context
│   ├── ai-processor.ts
│   ├── chrome-ai.ts
│   └── gemini-api.ts
├── ui/                 # UI components
│   ├── learning-interface/
│   ├── settings/
│   └── setup-wizard/
├── utils/              # Shared utilities
│   ├── storage-manager.ts
│   ├── cache-manager.ts
│   └── error-handler.ts
└── types/              # Type definitions
    └── index.ts
```

This architectural guide provides LLMs with a comprehensive understanding of the Chrome Extension's design, enabling effective examination and debugging of the system.
