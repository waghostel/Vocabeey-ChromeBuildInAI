# Translator API Optimization Recommendations

## (While Keeping Current Offscreen Document Architecture)

Since the Translator API fundamentally cannot work in offscreen documents, here are optimizations to handle this gracefully and prepare for future architectural changes.

---

## 🎯 Immediate Optimizations (No Architecture Change)

### 1. **Fast-Fail Detection with Better Error Messages**

**Current Code:**

```typescript
// src/utils/chrome-ai.ts
if (typeof Translator === 'undefined') {
  throw this.createError(
    'api_unavailable',
    'Translator API not available in this context'
  );
}
```

**Optimized Code:**

```typescript
// src/utils/chrome-ai.ts
if (typeof Translator === 'undefined') {
  throw this.createError(
    'api_unavailable',
    'Translator API not available in offscreen documents. Using Gemini API fallback.',
    {
      reason: 'offscreen_context',
      documentation: 'https://developer.chrome.com/docs/ai/translator-api',
      suggestion: 'Configure Gemini API key for translations',
    }
  );
}
```

**Benefits:**

- ✅ Clearer error message
- ✅ Explains why it failed
- ✅ Provides actionable guidance
- ✅ Links to documentation

---

### 2. **Skip Translator API Check Entirely in Offscreen Context**

**Current Flow:**

```
Offscreen Document → Try Translator API → Fail → Try Gemini API
```

**Optimized Flow:**

```
Offscreen Document → Detect Context → Skip Translator API → Try Gemini API Directly
```

**Implementation:**

```typescript
// src/offscreen/ai-processor.ts
class OffscreenAIProcessor {
  private chromeAI = getChromeAI();
  private geminiAPI: GeminiAPIClient;
  private isOffscreenContext = true; // Flag to indicate offscreen context

  /**
   * Process translation - optimized for offscreen context
   */
  async processTranslation(data: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    context?: string;
  }): Promise<string> {
    // Skip Chrome AI Translator in offscreen context (it won't work)
    if (this.isOffscreenContext) {
      console.log(
        '[TRANSLATION] Offscreen context detected, using Gemini API directly'
      );

      if (!this.geminiAPI.isConfigured()) {
        throw new Error(
          'Translation requires Gemini API key in offscreen context. ' +
            'Configure your API key in extension settings.'
        );
      }

      return await this.geminiAPI.translateText(
        data.text,
        data.sourceLanguage,
        data.targetLanguage
      );
    }

    // Fallback to original logic (for future when context changes)
    try {
      return await this.chromeAI.translateText(
        data.text,
        data.sourceLanguage,
        data.targetLanguage
      );
    } catch (error) {
      console.warn('Chrome AI translation failed, trying Gemini API:', error);
      return await this.geminiAPI.translateText(
        data.text,
        data.sourceLanguage,
        data.targetLanguage
      );
    }
  }
}
```

**Benefits:**

- ✅ Eliminates unnecessary API check
- ✅ Faster failure detection (no try-catch overhead)
- ✅ Clearer code intent
- ✅ Easier to refactor later
- ✅ Reduces console noise

---

### 3. **Add Context Detection Utility**

**Create a utility to detect execution context:**

```typescript
// src/utils/context-detector.ts

export type ExecutionContext =
  | 'offscreen-document'
  | 'service-worker'
  | 'content-script'
  | 'web-page'
  | 'unknown';

export interface ContextCapabilities {
  context: ExecutionContext;
  canUseTranslatorAPI: boolean;
  canUseWindowAI: boolean;
  canAccessDOM: boolean;
  canUseChrome: boolean;
}

/**
 * Detect current execution context
 */
export function detectExecutionContext(): ExecutionContext {
  // Check if we're in a service worker
  if (
    typeof ServiceWorkerGlobalScope !== 'undefined' &&
    self instanceof ServiceWorkerGlobalScope
  ) {
    return 'service-worker';
  }

  // Check if we're in an offscreen document
  // Offscreen documents have chrome.offscreen API available
  if (typeof chrome !== 'undefined' && chrome.offscreen && !document.body) {
    return 'offscreen-document';
  }

  // Check if we're in a content script
  if (typeof chrome !== 'undefined' && chrome.runtime && document.body) {
    return 'content-script';
  }

  // Check if we're in a regular web page
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'web-page';
  }

  return 'unknown';
}

/**
 * Get capabilities for current context
 */
export function getContextCapabilities(): ContextCapabilities {
  const context = detectExecutionContext();

  switch (context) {
    case 'offscreen-document':
      return {
        context,
        canUseTranslatorAPI: false, // ❌ Not available
        canUseWindowAI: true, // ✅ Available (Summarizer, Rewriter, etc.)
        canAccessDOM: true, // ✅ Available
        canUseChrome: true, // ✅ Available
      };

    case 'service-worker':
      return {
        context,
        canUseTranslatorAPI: false, // ❌ Not available
        canUseWindowAI: false, // ❌ Not available
        canAccessDOM: false, // ❌ Not available
        canUseChrome: true, // ✅ Available
      };

    case 'content-script':
      return {
        context,
        canUseTranslatorAPI: true, // ✅ Available
        canUseWindowAI: true, // ✅ Available
        canAccessDOM: true, // ✅ Available
        canUseChrome: true, // ✅ Available (limited)
      };

    case 'web-page':
      return {
        context,
        canUseTranslatorAPI: true, // ✅ Available
        canUseWindowAI: true, // ✅ Available
        canAccessDOM: true, // ✅ Available
        canUseChrome: false, // ❌ Not available
      };

    default:
      return {
        context,
        canUseTranslatorAPI: false,
        canUseWindowAI: false,
        canAccessDOM: false,
        canUseChrome: false,
      };
  }
}

/**
 * Check if Translator API is available in current context
 */
export function canUseTranslatorAPI(): boolean {
  const capabilities = getContextCapabilities();
  return capabilities.canUseTranslatorAPI && typeof Translator !== 'undefined';
}
```

**Usage in ChromeAI:**

```typescript
// src/utils/chrome-ai.ts
import {
  canUseTranslatorAPI,
  getContextCapabilities,
} from './context-detector';

export class ChromeTranslator {
  /**
   * Translate text from source to target language
   */
  async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    _context?: string
  ): Promise<string> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);
      const cached = this.translationCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Fast-fail if Translator API cannot work in this context
      if (!canUseTranslatorAPI()) {
        const capabilities = getContextCapabilities();
        throw this.createError(
          'api_unavailable',
          `Translator API not available in ${capabilities.context} context. ` +
            `Please use Gemini API fallback or move translation to content script.`
        );
      }

      // Check if language pair is available
      const availability = await Translator.availability({
        sourceLanguage,
        targetLanguage,
      });

      if (availability === 'no') {
        throw this.createError(
          'api_unavailable',
          `Translation not available for ${sourceLanguage} to ${targetLanguage}`
        );
      }

      // Get or create translator session
      const translator = await this.getTranslator(
        sourceLanguage,
        targetLanguage
      );

      const translation = await translator.translate(text);
      this.cacheTranslation(cacheKey, translation);

      return translation;
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
}
```

**Benefits:**

- ✅ Centralized context detection
- ✅ Reusable across codebase
- ✅ Clear capability documentation
- ✅ Easier to test
- ✅ Prepares for future context changes

---

### 4. **Add Telemetry for Translation Attempts**

**Track which API is being used and why:**

```typescript
// src/offscreen/ai-processor.ts
interface TranslationTelemetry {
  timestamp: number;
  context: string;
  attemptedAPI: 'chrome-translator' | 'gemini' | 'none';
  success: boolean;
  errorReason?: string;
  fallbackUsed: boolean;
  duration: number;
}

class OffscreenAIProcessor {
  private translationMetrics: TranslationTelemetry[] = [];
  private readonly maxMetrics = 100;

  async processTranslation(data: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    context?: string;
  }): Promise<string> {
    const startTime = Date.now();
    const telemetry: TranslationTelemetry = {
      timestamp: startTime,
      context: 'offscreen-document',
      attemptedAPI: 'none',
      success: false,
      fallbackUsed: false,
      duration: 0,
    };

    try {
      // Skip Chrome Translator in offscreen context
      telemetry.attemptedAPI = 'gemini';

      const translation = await this.geminiAPI.translateText(
        data.text,
        data.sourceLanguage,
        data.targetLanguage
      );

      telemetry.success = true;
      telemetry.duration = Date.now() - startTime;

      this.recordMetric(telemetry);

      return translation;
    } catch (error) {
      telemetry.success = false;
      telemetry.errorReason =
        error instanceof Error ? error.message : 'Unknown';
      telemetry.duration = Date.now() - startTime;

      this.recordMetric(telemetry);

      throw error;
    }
  }

  private recordMetric(metric: TranslationTelemetry): void {
    this.translationMetrics.push(metric);

    // Keep only last 100 metrics
    if (this.translationMetrics.length > this.maxMetrics) {
      this.translationMetrics.shift();
    }

    // Log summary periodically
    if (this.translationMetrics.length % 10 === 0) {
      this.logMetricsSummary();
    }
  }

  private logMetricsSummary(): void {
    const total = this.translationMetrics.length;
    const successful = this.translationMetrics.filter(m => m.success).length;
    const avgDuration =
      this.translationMetrics.reduce((sum, m) => sum + m.duration, 0) / total;

    console.log('[TRANSLATION METRICS]', {
      total,
      successful,
      successRate: `${((successful / total) * 100).toFixed(1)}%`,
      avgDuration: `${avgDuration.toFixed(0)}ms`,
      geminiUsage: this.translationMetrics.filter(
        m => m.attemptedAPI === 'gemini'
      ).length,
    });
  }

  /**
   * Get translation metrics for debugging
   */
  getTranslationMetrics(): TranslationTelemetry[] {
    return [...this.translationMetrics];
  }
}
```

**Benefits:**

- ✅ Track translation success/failure rates
- ✅ Identify performance bottlenecks
- ✅ Monitor API usage patterns
- ✅ Debug production issues
- ✅ Inform architectural decisions

---

### 5. **Optimize Cache Strategy**

**Current cache is basic. Enhance it:**

```typescript
// src/utils/chrome-ai.ts
export class ChromeTranslator {
  private translationCache: Map<string, CachedTranslation> = new Map();
  private readonly maxCacheSize = 500;
  private readonly cacheExpiryMs = 24 * 60 * 60 * 1000; // 24 hours

  interface CachedTranslation {
    translation: string;
    timestamp: number;
    hits: number;
    sourceLanguage: string;
    targetLanguage: string;
  }

  /**
   * Get cached translation with expiry check
   */
  private getCachedTranslation(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): string | null {
    const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);
    const cached = this.translationCache.get(cacheKey);

    if (!cached) {
      return null;
    }

    // Check if cache entry is expired
    const age = Date.now() - cached.timestamp;
    if (age > this.cacheExpiryMs) {
      this.translationCache.delete(cacheKey);
      return null;
    }

    // Increment hit counter
    cached.hits++;

    return cached.translation;
  }

  /**
   * Cache translation with metadata
   */
  private cacheTranslation(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    translation: string
  ): void {
    const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);

    // Implement LRU eviction if at capacity
    if (this.translationCache.size >= this.maxCacheSize) {
      this.evictLeastUsed();
    }

    this.translationCache.set(cacheKey, {
      translation,
      timestamp: Date.now(),
      hits: 1,
      sourceLanguage,
      targetLanguage,
    });
  }

  /**
   * Evict least recently used cache entries
   */
  private evictLeastUsed(): void {
    // Find entry with lowest hits and oldest timestamp
    let leastUsedKey: string | null = null;
    let leastUsedScore = Infinity;

    for (const [key, value] of this.translationCache.entries()) {
      // Score = hits / age (lower is worse)
      const age = Date.now() - value.timestamp;
      const score = value.hits / (age / 1000); // hits per second

      if (score < leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.translationCache.delete(leastUsedKey);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number;
    mostUsedEntry: number;
  } {
    const entries = Array.from(this.translationCache.values());

    return {
      size: this.translationCache.size,
      maxSize: this.maxCacheSize,
      hitRate: entries.reduce((sum, e) => sum + e.hits, 0) / entries.length || 0,
      oldestEntry: Math.min(...entries.map(e => e.timestamp)),
      mostUsedEntry: Math.max(...entries.map(e => e.hits)),
    };
  }

  /**
   * Persist cache to storage (optional)
   */
  async persistCache(): Promise<void> {
    const cacheData = Array.from(this.translationCache.entries());
    await chrome.storage.local.set({
      translationCache: cacheData,
      cacheTimestamp: Date.now(),
    });
  }

  /**
   * Load cache from storage (optional)
   */
  async loadCache(): Promise<void> {
    const { translationCache, cacheTimestamp } =
      await chrome.storage.local.get(['translationCache', 'cacheTimestamp']);

    if (!translationCache || !cacheTimestamp) {
      return;
    }

    // Check if cache is not too old (7 days)
    const age = Date.now() - cacheTimestamp;
    if (age > 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    this.translationCache = new Map(translationCache);
  }
}
```

**Benefits:**

- ✅ Cache expiry prevents stale translations
- ✅ LRU eviction keeps most useful entries
- ✅ Hit tracking identifies popular translations
- ✅ Cache persistence across sessions
- ✅ Cache statistics for monitoring

---

### 6. **Add Graceful Degradation Message**

**Show users why Translator API isn't working:**

```typescript
// src/offscreen/ai-processor.ts
private async initialize(): Promise<void> {
  try {
    // Load Gemini API key from storage
    const { settings } = await chrome.storage.local.get('settings');
    const geminiKey = settings?.apiKeys?.gemini;

    if (geminiKey) {
      this.geminiAPI.setApiKey(geminiKey);
      console.log('✅ Gemini API key loaded successfully');
    } else {
      console.warn('⚠️ No Gemini API key configured');
      console.warn('ℹ️ Translator API is not available in offscreen documents');
      console.warn('ℹ️ Please configure Gemini API key for translations');
      console.warn('ℹ️ Get your key at: https://makersuite.google.com/app/apikey');
    }

    // Check Chrome AI availability (for other APIs)
    const availability = await this.chromeAI.checkAvailability();
    console.log('Chrome AI availability:', availability);

    // Log context information
    console.log('📍 Execution context: offscreen-document');
    console.log('📍 Translator API available: ❌ No (offscreen limitation)');
    console.log('📍 window.ai APIs available: ✅ Yes (Summarizer, Rewriter, etc.)');
    console.log('📍 Gemini API configured:', geminiKey ? '✅ Yes' : '❌ No');

    this.isReady = true;

    // Notify that we're ready
    void chrome.runtime.sendMessage({
      type: 'OFFSCREEN_READY',
      timestamp: Date.now(),
      capabilities: {
        translatorAPI: false,
        windowAI: true,
        geminiAPI: !!geminiKey,
      },
    });

    console.log('✅ Offscreen AI processor initialized');
  } catch (error) {
    console.error('❌ Failed to initialize offscreen AI processor:', error);
  }
}
```

**Benefits:**

- ✅ Clear logging of capabilities
- ✅ Explains why Translator API isn't available
- ✅ Provides actionable guidance
- ✅ Links to API key signup
- ✅ Helps debugging

---

## 📊 Summary of Optimizations

| Optimization                       | Effort | Impact | Benefit                            |
| ---------------------------------- | ------ | ------ | ---------------------------------- |
| Fast-fail detection                | Low    | Medium | Clearer errors, faster failure     |
| Skip Translator API check          | Low    | High   | Eliminates unnecessary overhead    |
| Context detection utility          | Medium | High   | Reusable, testable, clear intent   |
| Translation telemetry              | Medium | Medium | Monitor usage, debug issues        |
| Enhanced cache strategy            | Medium | High   | Better performance, persistence    |
| Graceful degradation messages      | Low    | Medium | Better UX, clearer debugging       |
| Persist cache to storage           | Low    | Medium | Faster startup, better UX          |
| Cache statistics                   | Low    | Low    | Monitor cache effectiveness        |
| Context capabilities documentation | Low    | High   | Clear API availability per context |
| Structured error messages          | Low    | High   | Actionable guidance for users      |

---

## 🎯 Recommended Implementation Order

### Phase 1: Quick Wins (1-2 hours)

1. ✅ Skip Translator API check in offscreen context
2. ✅ Add graceful degradation messages
3. ✅ Improve error messages

### Phase 2: Foundation (2-3 hours)

4. ✅ Create context detection utility
5. ✅ Add translation telemetry
6. ✅ Enhance cache strategy

### Phase 3: Polish (1-2 hours)

7. ✅ Add cache persistence
8. ✅ Add cache statistics
9. ✅ Document context capabilities

---

## 💡 Key Takeaways

1. **Accept the limitation:** Translator API won't work in offscreen documents
2. **Optimize around it:** Skip unnecessary checks, fail fast, provide clear errors
3. **Prepare for future:** Use context detection to make architectural changes easier
4. **Monitor usage:** Add telemetry to understand translation patterns
5. **Improve cache:** Better caching reduces API calls and improves performance

These optimizations make the current architecture work better while preparing for eventual migration to a proper context for the Translator API.
