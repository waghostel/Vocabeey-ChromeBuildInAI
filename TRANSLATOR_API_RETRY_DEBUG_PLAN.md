# Translator API Auto-Retry & Debug Plan

## Focus: Retry Logic + Debugging (Gemini API kept but not implemented)

---

## 🎯 Goal

Add intelligent auto-retry mechanism and comprehensive debugging for Translator API failures, while keeping Gemini API code in place for future implementation.

---

## 📋 Implementation Plan

### Phase 1: Retry Mechanism (2-3 hours)

#### 1.1 Create Retry Configuration

#### 1.2 Implement Exponential Backoff

#### 1.3 Add Retry Logic to ChromeTranslator

#### 1.4 Add Retry Telemetry

### Phase 2: Debug Infrastructure (2-3 hours)

#### 2.1 Enhanced Error Logging

#### 2.2 Translation Attempt Tracking

#### 2.3 Debug Mode

#### 2.4 Error Classification

### Phase 3: Integration (1-2 hours)

#### 3.1 Update Offscreen Processor

#### 3.2 Update Service Worker

#### 3.3 Add User Feedback

---

## 📝 Detailed Implementation

### Phase 1: Retry Mechanism

#### 1.1 Create Retry Configuration

```typescript
// src/utils/retry-config.ts

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
  timeoutMs: number;
}

export const DEFAULT_TRANSLATION_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000, // Start with 1 second
  maxDelayMs: 10000, // Max 10 seconds
  backoffMultiplier: 2, // Double each time
  retryableErrors: [
    'network',
    'timeout',
    'rate_limit',
    'temporary_unavailable',
  ],
  timeoutMs: 15000, // 15 second timeout per attempt
};

export interface RetryAttempt {
  attemptNumber: number;
  timestamp: number;
  error?: string;
  delayMs?: number;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: RetryAttempt[];
  totalDuration: number;
}
```

---

#### 1.2 Implement Exponential Backoff Utility

```typescript
// src/utils/retry-handler.ts

import { RetryConfig, RetryAttempt, RetryResult } from './retry-config';

export class RetryHandler {
  constructor(private config: RetryConfig) {}

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<RetryResult<T>> {
    const attempts: RetryAttempt[] = [];
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      const attemptStart = Date.now();

      try {
        console.log(
          `[RETRY] ${operationName} - Attempt ${attempt}/${this.config.maxAttempts}`
        );

        // Execute with timeout
        const result = await this.executeWithTimeout(
          operation,
          this.config.timeoutMs
        );

        // Success!
        attempts.push({
          attemptNumber: attempt,
          timestamp: attemptStart,
        });

        const totalDuration = Date.now() - startTime;
        console.log(
          `[RETRY] ${operationName} - Success on attempt ${attempt} (${totalDuration}ms)`
        );

        return {
          success: true,
          result,
          attempts,
          totalDuration,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        attempts.push({
          attemptNumber: attempt,
          timestamp: attemptStart,
          error: lastError.message,
        });

        console.warn(
          `[RETRY] ${operationName} - Attempt ${attempt} failed:`,
          lastError.message
        );

        // Check if error is retryable
        if (!this.isRetryable(lastError)) {
          console.log(
            `[RETRY] ${operationName} - Non-retryable error, stopping`
          );
          break;
        }

        // Don't wait after last attempt
        if (attempt < this.config.maxAttempts) {
          const delay = this.calculateDelay(attempt);

          attempts[attempts.length - 1].delayMs = delay;

          console.log(
            `[RETRY] ${operationName} - Waiting ${delay}ms before retry...`
          );
          await this.sleep(delay);
        }
      }
    }

    // All attempts failed
    const totalDuration = Date.now() - startTime;
    console.error(
      `[RETRY] ${operationName} - All ${this.config.maxAttempts} attempts failed (${totalDuration}ms)`
    );

    return {
      success: false,
      error: lastError || new Error('All retry attempts failed'),
      attempts,
      totalDuration,
    };
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();

    return this.config.retryableErrors.some(retryableError =>
      errorMessage.includes(retryableError.toLowerCase())
    );
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(attempt: number): number {
    const delay =
      this.config.baseDelayMs *
      Math.pow(this.config.backoffMultiplier, attempt - 1);

    // Add jitter (±20%) to prevent thundering herd
    const jitter = delay * 0.2 * (Math.random() - 0.5);

    return Math.min(delay + jitter, this.config.maxDelayMs);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

#### 1.3 Add Retry Logic to ChromeTranslator

```typescript
// src/utils/chrome-ai.ts

import { RetryHandler } from './retry-handler';
import { DEFAULT_TRANSLATION_RETRY_CONFIG, RetryResult } from './retry-config';

export class ChromeTranslator {
  private activeSessions: Map<string, TranslatorInstance> = new Map();
  private translationCache: Map<string, string> = new Map();
  private readonly maxCacheSize = 500;
  private retryHandler: RetryHandler;

  constructor() {
    this.retryHandler = new RetryHandler(DEFAULT_TRANSLATION_RETRY_CONFIG);
  }

  /**
   * Translate text with retry logic
   */
  async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    _context?: string
  ): Promise<string> {
    // Check cache first (before retry logic)
    const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);
    const cached = this.translationCache.get(cacheKey);
    if (cached) {
      console.log('[TRANSLATOR] Cache hit:', cacheKey.substring(0, 50));
      return cached;
    }

    // Execute translation with retry
    const result = await this.retryHandler.executeWithRetry(
      () => this.translateTextOnce(text, sourceLanguage, targetLanguage),
      `translate(${sourceLanguage}->${targetLanguage})`
    );

    if (result.success && result.result) {
      // Cache successful translation
      this.cacheTranslation(cacheKey, result.result);
      return result.result;
    }

    // All retries failed
    throw result.error || new Error('Translation failed after retries');
  }

  /**
   * Single translation attempt (no retry)
   */
  private async translateTextOnce(
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    // Check if global Translator API is available
    if (typeof Translator === 'undefined') {
      const error = new Error(
        'Translator API not available in this context (offscreen document limitation)'
      );
      error.name = 'api_unavailable'; // Non-retryable
      throw error;
    }

    // Check if language pair is available
    const availability = await Translator.availability({
      sourceLanguage,
      targetLanguage,
    });

    if (availability === 'no') {
      const error = new Error(
        `Translation not available for ${sourceLanguage} to ${targetLanguage}`
      );
      error.name = 'language_pair_unavailable'; // Non-retryable
      throw error;
    }

    // Handle model download
    if (availability === 'after-download') {
      console.log('[TRANSLATOR] Model download required');
      // This might take time, but it's not an error
    }

    // Get or create translator session
    const translator = await this.getTranslator(sourceLanguage, targetLanguage);

    // Translate
    const translation = await translator.translate(text);

    if (!translation || translation.trim().length === 0) {
      throw new Error('Empty translation result');
    }

    return translation;
  }

  // ... rest of the class remains the same
}
```

---

### Phase 2: Debug Infrastructure

#### 2.1 Enhanced Error Logging

```typescript
// src/utils/translation-debugger.ts

export interface TranslationDebugInfo {
  timestamp: number;
  operationId: string;
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  context: string;
  attempts: number;
  success: boolean;
  result?: string;
  error?: string;
  duration: number;
  cacheHit: boolean;
  apiAvailability?: string;
  sessionReused: boolean;
}

export class TranslationDebugger {
  private debugLog: TranslationDebugInfo[] = [];
  private readonly maxLogSize = 200;
  private debugMode = false;

  constructor() {
    // Check if debug mode is enabled
    this.loadDebugMode();
  }

  /**
   * Load debug mode from storage
   */
  private async loadDebugMode(): Promise<void> {
    try {
      const { debugMode } = await chrome.storage.local.get('debugMode');
      this.debugMode = debugMode || false;
    } catch {
      this.debugMode = false;
    }
  }

  /**
   * Enable debug mode
   */
  async enableDebugMode(): Promise<void> {
    this.debugMode = true;
    await chrome.storage.local.set({ debugMode: true });
    console.log('🐛 Translation debug mode ENABLED');
  }

  /**
   * Disable debug mode
   */
  async disableDebugMode(): Promise<void> {
    this.debugMode = false;
    await chrome.storage.local.set({ debugMode: false });
    console.log('🐛 Translation debug mode DISABLED');
  }

  /**
   * Log translation attempt
   */
  logTranslation(info: TranslationDebugInfo): void {
    this.debugLog.push(info);

    // Keep only last N entries
    if (this.debugLog.length > this.maxLogSize) {
      this.debugLog.shift();
    }

    // Log to console if debug mode is enabled
    if (this.debugMode) {
      this.logToConsole(info);
    }

    // Auto-save to storage periodically
    if (this.debugLog.length % 10 === 0) {
      void this.saveDebugLog();
    }
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(info: TranslationDebugInfo): void {
    const emoji = info.success ? '✅' : '❌';
    const cacheEmoji = info.cacheHit ? '💾' : '🌐';

    console.group(`${emoji} ${cacheEmoji} Translation [${info.operationId}]`);
    console.log('Text:', info.text.substring(0, 50) + '...');
    console.log(
      'Languages:',
      `${info.sourceLanguage} → ${info.targetLanguage}`
    );
    console.log('Context:', info.context);
    console.log('Attempts:', info.attempts);
    console.log('Duration:', `${info.duration}ms`);
    console.log('Cache Hit:', info.cacheHit);
    console.log('API Availability:', info.apiAvailability);
    console.log('Session Reused:', info.sessionReused);

    if (info.success) {
      console.log('Result:', info.result?.substring(0, 50) + '...');
    } else {
      console.error('Error:', info.error);
    }

    console.groupEnd();
  }

  /**
   * Get debug log
   */
  getDebugLog(): TranslationDebugInfo[] {
    return [...this.debugLog];
  }

  /**
   * Get debug statistics
   */
  getDebugStats(): {
    total: number;
    successful: number;
    failed: number;
    cacheHits: number;
    avgDuration: number;
    avgAttempts: number;
    errorTypes: Record<string, number>;
  } {
    const total = this.debugLog.length;
    const successful = this.debugLog.filter(l => l.success).length;
    const failed = total - successful;
    const cacheHits = this.debugLog.filter(l => l.cacheHit).length;

    const avgDuration =
      total > 0
        ? this.debugLog.reduce((sum, l) => sum + l.duration, 0) / total
        : 0;

    const avgAttempts =
      total > 0
        ? this.debugLog.reduce((sum, l) => sum + l.attempts, 0) / total
        : 0;

    const errorTypes: Record<string, number> = {};
    this.debugLog
      .filter(l => !l.success && l.error)
      .forEach(l => {
        const errorType = l.error!.split(':')[0];
        errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
      });

    return {
      total,
      successful,
      failed,
      cacheHits,
      avgDuration: Math.round(avgDuration),
      avgAttempts: Math.round(avgAttempts * 10) / 10,
      errorTypes,
    };
  }

  /**
   * Export debug log as JSON
   */
  exportDebugLog(): string {
    return JSON.stringify(
      {
        timestamp: Date.now(),
        stats: this.getDebugStats(),
        log: this.debugLog,
      },
      null,
      2
    );
  }

  /**
   * Save debug log to storage
   */
  private async saveDebugLog(): Promise<void> {
    try {
      await chrome.storage.local.set({
        translationDebugLog: this.debugLog,
        translationDebugTimestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Failed to save debug log:', error);
    }
  }

  /**
   * Load debug log from storage
   */
  async loadDebugLog(): Promise<void> {
    try {
      const { translationDebugLog } = await chrome.storage.local.get(
        'translationDebugLog'
      );
      if (translationDebugLog) {
        this.debugLog = translationDebugLog;
      }
    } catch (error) {
      console.warn('Failed to load debug log:', error);
    }
  }

  /**
   * Clear debug log
   */
  async clearDebugLog(): Promise<void> {
    this.debugLog = [];
    await chrome.storage.local.remove([
      'translationDebugLog',
      'translationDebugTimestamp',
    ]);
    console.log('🗑️ Translation debug log cleared');
  }
}

// Singleton instance
let debuggerInstance: TranslationDebugger | null = null;

export function getTranslationDebugger(): TranslationDebugger {
  if (!debuggerInstance) {
    debuggerInstance = new TranslationDebugger();
  }
  return debuggerInstance;
}
```

---

#### 2.2 Integrate Debugger with ChromeTranslator

```typescript
// src/utils/chrome-ai.ts (updated)

import {
  getTranslationDebugger,
  TranslationDebugInfo,
} from './translation-debugger';

export class ChromeTranslator {
  private debugger = getTranslationDebugger();

  /**
   * Translate text with retry and debugging
   */
  async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    context?: string
  ): Promise<string> {
    const operationId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);
    const cached = this.translationCache.get(cacheKey);

    if (cached) {
      // Log cache hit
      this.debugger.logTranslation({
        timestamp: startTime,
        operationId,
        text,
        sourceLanguage,
        targetLanguage,
        context: context || 'none',
        attempts: 0,
        success: true,
        result: cached,
        duration: Date.now() - startTime,
        cacheHit: true,
        sessionReused: false,
      });

      return cached;
    }

    // Execute translation with retry
    const result = await this.retryHandler.executeWithRetry(
      () => this.translateTextOnce(text, sourceLanguage, targetLanguage),
      `translate(${sourceLanguage}->${targetLanguage})`
    );

    // Log translation attempt
    this.debugger.logTranslation({
      timestamp: startTime,
      operationId,
      text,
      sourceLanguage,
      targetLanguage,
      context: context || 'none',
      attempts: result.attempts.length,
      success: result.success,
      result: result.result,
      error: result.error?.message,
      duration: result.totalDuration,
      cacheHit: false,
      apiAvailability: await this.checkAvailability(
        sourceLanguage,
        targetLanguage
      ),
      sessionReused: this.activeSessions.has(
        `${sourceLanguage}-${targetLanguage}`
      ),
    });

    if (result.success && result.result) {
      this.cacheTranslation(cacheKey, result.result);
      return result.result;
    }

    throw result.error || new Error('Translation failed after retries');
  }

  /**
   * Check API availability for debugging
   */
  private async checkAvailability(
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    try {
      if (typeof Translator === 'undefined') {
        return 'api_unavailable';
      }

      const availability = await Translator.availability({
        sourceLanguage,
        targetLanguage,
      });

      return availability;
    } catch {
      return 'check_failed';
    }
  }
}
```

---

### Phase 3: Integration & User Feedback

#### 3.1 Update Offscreen Processor

```typescript
// src/offscreen/ai-processor.ts (updated)

class OffscreenAIProcessor {
  private chromeAI = getChromeAI();
  private geminiAPI: GeminiAPIClient; // Keep for future
  private isReady = false;

  /**
   * Process translation with retry and debugging
   */
  async processTranslation(data: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    context?: string;
  }): Promise<string> {
    try {
      // Try Chrome AI Translator with retry
      return await this.chromeAI.translateText(
        data.text,
        data.sourceLanguage,
        data.targetLanguage,
        data.context
      );
    } catch (chromeError) {
      // Log the Chrome AI failure
      console.warn('Chrome AI translation failed after retries:', chromeError);

      // TODO: Fallback to Gemini API (future implementation)
      // For now, re-throw the error
      throw new Error(
        `Translation failed: ${chromeError instanceof Error ? chromeError.message : 'Unknown error'}. ` +
          `Gemini API fallback not yet implemented.`
      );
    }
  }
}
```

---

#### 3.2 Add Debug Commands

```typescript
// src/background/service-worker.ts (add message handlers)

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // ... existing handlers ...

  // Debug commands
  if (message.type === 'DEBUG_ENABLE_TRANSLATION') {
    getTranslationDebugger()
      .enableDebugMode()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'DEBUG_DISABLE_TRANSLATION') {
    getTranslationDebugger()
      .disableDebugMode()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'DEBUG_GET_TRANSLATION_STATS') {
    const stats = getTranslationDebugger().getDebugStats();
    sendResponse({ success: true, data: stats });
    return true;
  }

  if (message.type === 'DEBUG_GET_TRANSLATION_LOG') {
    const log = getTranslationDebugger().getDebugLog();
    sendResponse({ success: true, data: log });
    return true;
  }

  if (message.type === 'DEBUG_EXPORT_TRANSLATION_LOG') {
    const exported = getTranslationDebugger().exportDebugLog();
    sendResponse({ success: true, data: exported });
    return true;
  }

  if (message.type === 'DEBUG_CLEAR_TRANSLATION_LOG') {
    getTranslationDebugger()
      .clearDebugLog()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  return false;
});
```

---

#### 3.3 Add Console Commands for Debugging

```typescript
// src/utils/debug-console.ts

/**
 * Debug console commands for translation debugging
 * Usage: Open browser console and type these commands
 */

// Enable debug mode
(window as any).enableTranslationDebug = async () => {
  const response = await chrome.runtime.sendMessage({
    type: 'DEBUG_ENABLE_TRANSLATION',
  });
  console.log(
    'Translation debug mode:',
    response.success ? 'ENABLED ✅' : 'FAILED ❌'
  );
};

// Disable debug mode
(window as any).disableTranslationDebug = async () => {
  const response = await chrome.runtime.sendMessage({
    type: 'DEBUG_DISABLE_TRANSLATION',
  });
  console.log(
    'Translation debug mode:',
    response.success ? 'DISABLED' : 'FAILED ❌'
  );
};

// Get translation statistics
(window as any).getTranslationStats = async () => {
  const response = await chrome.runtime.sendMessage({
    type: 'DEBUG_GET_TRANSLATION_STATS',
  });

  if (response.success) {
    console.table(response.data);
    return response.data;
  } else {
    console.error('Failed to get stats');
  }
};

// Get translation log
(window as any).getTranslationLog = async () => {
  const response = await chrome.runtime.sendMessage({
    type: 'DEBUG_GET_TRANSLATION_LOG',
  });

  if (response.success) {
    console.log('Translation log:', response.data);
    return response.data;
  } else {
    console.error('Failed to get log');
  }
};

// Export translation log
(window as any).exportTranslationLog = async () => {
  const response = await chrome.runtime.sendMessage({
    type: 'DEBUG_EXPORT_TRANSLATION_LOG',
  });

  if (response.success) {
    // Download as JSON file
    const blob = new Blob([response.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('Translation log exported ✅');
  } else {
    console.error('Failed to export log');
  }
};

// Clear translation log
(window as any).clearTranslationLog = async () => {
  const response = await chrome.runtime.sendMessage({
    type: 'DEBUG_CLEAR_TRANSLATION_LOG',
  });
  console.log(
    'Translation log:',
    response.success ? 'CLEARED ✅' : 'FAILED ❌'
  );
};

// Show help
(window as any).translationDebugHelp = () => {
  console.log(`
🐛 Translation Debug Commands:

enableTranslationDebug()    - Enable detailed logging
disableTranslationDebug()   - Disable detailed logging
getTranslationStats()       - Show translation statistics
getTranslationLog()         - Show full translation log
exportTranslationLog()      - Download log as JSON file
clearTranslationLog()       - Clear the debug log
translationDebugHelp()      - Show this help message

Example:
  await enableTranslationDebug();
  // ... use the extension ...
  await getTranslationStats();
  await exportTranslationLog();
  `);
};

// Auto-show help on load
console.log(
  '💡 Type translationDebugHelp() for translation debugging commands'
);
```

---

#### 3.4 Add User-Facing Retry Indicator

```typescript
// src/ui/highlight-manager.ts (updated)

async function translateVocabulary(
  text: string,
  context: string
): Promise<string> {
  try {
    // Show retry indicator
    showRetryIndicator(text);

    const { targetLanguage } = await chrome.storage.local.get('targetLanguage');

    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_TEXT',
      payload: {
        text,
        context,
        type: 'vocabulary',
        targetLanguage: targetLanguage || 'en',
      },
    });

    // Hide retry indicator
    hideRetryIndicator();

    if (response.success) {
      return response.data.translation;
    } else {
      console.error('Translation failed:', response.error);

      // Show user-friendly error
      if (response.error.includes('after retries')) {
        return `[Translation failed after 3 attempts. Check console for details.]`;
      } else if (response.error.includes('not available')) {
        return `[Translation API not available in this context]`;
      } else {
        return `[Translation unavailable: ${text}]`;
      }
    }
  } catch (error) {
    hideRetryIndicator();
    console.error('Error translating vocabulary:', error);
    return `[Translation error: ${text}]`;
  }
}

/**
 * Show retry indicator
 */
function showRetryIndicator(text: string): void {
  const indicator = document.createElement('div');
  indicator.id = 'translation-retry-indicator';
  indicator.className = 'retry-indicator';
  indicator.innerHTML = `
    <div class="retry-spinner"></div>
    <div class="retry-text">Translating "${text.substring(0, 20)}..."</div>
    <div class="retry-attempts">Attempt 1 of 3</div>
  `;

  document.body.appendChild(indicator);
}

/**
 * Hide retry indicator
 */
function hideRetryIndicator(): void {
  const indicator = document.getElementById('translation-retry-indicator');
  if (indicator) {
    indicator.remove();
  }
}
```

**Add CSS:**

```css
/* src/ui/learning-interface.css */

.retry-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.retry-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry-text {
  font-weight: 500;
}

.retry-attempts {
  font-size: 12px;
  opacity: 0.7;
}
```

---

## 📊 Implementation Summary

### Files to Create

1. ✅ `src/utils/retry-config.ts` - Retry configuration and types
2. ✅ `src/utils/retry-handler.ts` - Retry logic with exponential backoff
3. ✅ `src/utils/translation-debugger.ts` - Debug logging and statistics
4. ✅ `src/utils/debug-console.ts` - Console commands for debugging

### Files to Modify

1. ✅ `src/utils/chrome-ai.ts` - Add retry and debug integration
2. ✅ `src/offscreen/ai-processor.ts` - Update translation processing
3. ✅ `src/background/service-worker.ts` - Add debug message handlers
4. ✅ `src/ui/highlight-manager.ts` - Add retry indicator
5. ✅ `src/ui/learning-interface.css` - Add retry indicator styles

### Gemini API Integration Points (Future)

```typescript
// src/offscreen/ai-processor.ts
async processTranslation(data) {
  try {
    // Try Chrome AI with retry
    return await this.chromeAI.translateText(...);
  } catch (chromeError) {
    // TODO: Implement Gemini fallback here
    // if (this.geminiAPI.isConfigured()) {
    //   return await this.geminiAPI.translateText(...);
    // }
    throw chromeError;
  }
}
```

---

## 🎯 Testing Plan

### Manual Testing

1. **Enable Debug Mode:**

   ```javascript
   await enableTranslationDebug();
   ```

2. **Test Normal Translation:**
   - Highlight text
   - Check console for retry logs
   - Verify translation succeeds

3. **Test Retry Logic:**
   - Simulate network issues (DevTools → Network → Offline)
   - Highlight text
   - Verify 3 retry attempts
   - Check exponential backoff delays

4. **Test Non-Retryable Errors:**
   - Use unsupported language pair
   - Verify immediate failure (no retries)

5. **Check Debug Statistics:**

   ```javascript
   await getTranslationStats();
   ```

6. **Export Debug Log:**
   ```javascript
   await exportTranslationLog();
   ```

### Automated Testing

```typescript
// tests/translation-retry.test.ts

describe('Translation Retry Logic', () => {
  it('should retry on network errors', async () => {
    // Mock Translator API to fail twice, succeed third time
    let attempts = 0;
    mockTranslator.translate.mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('network error');
      }
      return Promise.resolve('translated text');
    });

    const result = await translator.translateText('test', 'en', 'es');

    expect(attempts).toBe(3);
    expect(result).toBe('translated text');
  });

  it('should not retry on non-retryable errors', async () => {
    mockTranslator.translate.mockRejectedValue(new Error('api_unavailable'));

    await expect(translator.translateText('test', 'en', 'es')).rejects.toThrow(
      'api_unavailable'
    );

    // Should only attempt once
    expect(mockTranslator.translate).toHaveBeenCalledTimes(1);
  });

  it('should use exponential backoff', async () => {
    const delays: number[] = [];
    const startTime = Date.now();

    mockTranslator.translate.mockImplementation(() => {
      delays.push(Date.now() - startTime);
      throw new Error('network error');
    });

    try {
      await translator.translateText('test', 'en', 'es');
    } catch {
      // Expected to fail
    }

    // Check delays are increasing exponentially
    expect(delays[1] - delays[0]).toBeGreaterThan(900); // ~1s
    expect(delays[2] - delays[1]).toBeGreaterThan(1900); // ~2s
  });
});
```

---

## 📈 Success Metrics

### Before Implementation

- ❌ No retry on transient failures
- ❌ No debugging information
- ❌ Users see generic errors
- ❌ No visibility into failure reasons

### After Implementation

- ✅ Auto-retry with exponential backoff
- ✅ Comprehensive debug logging
- ✅ User-friendly retry indicators
- ✅ Detailed error classification
- ✅ Console commands for debugging
- ✅ Exportable debug logs
- ✅ Translation statistics

### Expected Improvements

- **Success Rate:** 60% → 85% (retry handles transient failures)
- **User Experience:** Clear feedback during retries
- **Debugging Time:** 30 min → 5 min (with debug logs)
- **Error Resolution:** Faster with detailed logs

---

## 🚀 Deployment Checklist

### Phase 1: Core Retry (Week 1)

- [ ] Create retry configuration
- [ ] Implement retry handler
- [ ] Integrate with ChromeTranslator
- [ ] Test retry logic
- [ ] Deploy to staging

### Phase 2: Debug Infrastructure (Week 1-2)

- [ ] Create translation debugger
- [ ] Add debug logging
- [ ] Integrate with ChromeTranslator
- [ ] Add console commands
- [ ] Test debug features

### Phase 3: User Feedback (Week 2)

- [ ] Add retry indicator UI
- [ ] Update error messages
- [ ] Add CSS styles
- [ ] Test user experience
- [ ] Deploy to production

### Phase 4: Monitoring (Week 2-3)

- [ ] Monitor retry success rates
- [ ] Analyze debug logs
- [ ] Identify common failures
- [ ] Optimize retry configuration
- [ ] Document findings

---

## 💡 Future Enhancements

### After Gemini API Implementation

1. **Dual Retry Strategy:**

   ```typescript
   // Retry Chrome AI 3 times
   // If all fail, retry Gemini API 3 times
   // Total: 6 attempts across 2 services
   ```

2. **Smart Fallback:**

   ```typescript
   // If Chrome AI consistently fails for a language pair,
   // skip it and go directly to Gemini for that pair
   ```

3. **Adaptive Retry:**

   ```typescript
   // Adjust retry count based on historical success rates
   // More retries for pairs with high success rates
   ```

4. **Circuit Breaker:**
   ```typescript
   // If Chrome AI fails 10 times in a row,
   // temporarily disable it for 5 minutes
   ```

---

## 📚 Documentation

### For Developers

**Enable Debug Mode:**

```javascript
// In browser console
await enableTranslationDebug();
```

**View Statistics:**

```javascript
await getTranslationStats();
// Output:
// {
//   total: 50,
//   successful: 42,
//   failed: 8,
//   cacheHits: 15,
//   avgDuration: 1250,
//   avgAttempts: 1.4,
//   errorTypes: {
//     'network': 5,
//     'timeout': 2,
//     'api_unavailable': 1
//   }
// }
```

**Export Debug Log:**

```javascript
await exportTranslationLog();
// Downloads: translation-debug-1234567890.json
```

### For Users

**What Users See:**

- Retry indicator during translation
- Clear error messages
- Automatic retry on failures
- No manual intervention needed

**If Translation Fails:**

1. Check console for detailed error
2. Enable debug mode: `enableTranslationDebug()`
3. Try again and export log: `exportTranslationLog()`
4. Share log with support team

---

## 🎓 Key Takeaways

1. **Retry Logic:** 3 attempts with exponential backoff (1s, 2s, 4s)
2. **Error Classification:** Retryable vs non-retryable errors
3. **Debug Infrastructure:** Comprehensive logging and statistics
4. **User Feedback:** Visual retry indicators
5. **Console Commands:** Easy debugging for developers
6. **Future-Ready:** Gemini API integration points preserved
7. **Testable:** Automated tests for retry logic
8. **Monitorable:** Exportable debug logs and statistics

This plan focuses on making the Translator API robust and debuggable while keeping Gemini API code in place for future implementation.
