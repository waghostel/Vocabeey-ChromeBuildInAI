/**
 * Tests for Error Handling System
 * Tests retry mechanisms, error recovery, progress indication, and network error handling
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  ErrorHandler,
  HardwareCapabilityDetector,
  UserErrorPresenter,
  type ExtensionError,
} from '../src/utils/error-handler';
import {
  NetworkMonitor,
  OfflineModeManager,
  NetworkTimeoutHandler,
  RateLimitManager,
  GracefulDegradationManager,
} from '../src/utils/offline-handler';
import {
  ProgressTracker,
  ModelDownloadTracker,
  ArticleProcessingTracker,
  LoadingStateManager,
} from '../src/utils/progress-tracker';

// ============================================================================
// Error Handler Tests - Retry Mechanisms and Error Recovery
// ============================================================================

describe('ErrorHandler - Retry Mechanisms', () => {
  let errorHandler: ErrorHandler;
  let retryCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    retryCallback = vi.fn();
    errorHandler = new ErrorHandler({
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 1000,
      onRetry: retryCallback,
    });
  });

  it('should execute operation successfully on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    const result = await errorHandler.executeWithRetry(operation, 'test');

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(retryCallback).not.toHaveBeenCalled();
  });

  it('should retry retryable errors with exponential backoff', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(
        errorHandler.createError('network', 'Network error', true)
      )
      .mockRejectedValueOnce(
        errorHandler.createError('network', 'Network error', true)
      )
      .mockResolvedValue('success');

    const startTime = Date.now();
    const result = await errorHandler.executeWithRetry(operation, 'test');
    const duration = Date.now() - startTime;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
    expect(retryCallback).toHaveBeenCalledTimes(2);
    // Should have delays (100ms + 200ms = 300ms minimum)
    expect(duration).toBeGreaterThanOrEqual(200);
  });

  it('should not retry non-retryable errors', async () => {
    const error = errorHandler.createError(
      'invalid_input',
      'Invalid input',
      false
    );
    const operation = vi.fn().mockRejectedValue(error);

    await expect(
      errorHandler.executeWithRetry(operation, 'test')
    ).rejects.toThrow('Invalid input');

    expect(operation).toHaveBeenCalledTimes(1);
    expect(retryCallback).not.toHaveBeenCalled();
  });

  it('should throw after max retries exhausted', async () => {
    const error = errorHandler.createError('network', 'Network error', true);
    const operation = vi.fn().mockRejectedValue(error);

    await expect(
      errorHandler.executeWithRetry(operation, 'test')
    ).rejects.toMatchObject({
      userMessage: expect.stringMatching(/Failed after 3 attempts/),
    });

    expect(operation).toHaveBeenCalledTimes(3);
    expect(retryCallback).toHaveBeenCalledTimes(2);
  });

  it('should normalize unknown errors to ExtensionError', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Unknown error'));

    await expect(
      errorHandler.executeWithRetry(operation, 'test')
    ).rejects.toMatchObject({
      type: 'processing_failed',
      message: 'Unknown error',
      retryable: false,
    });
  });

  it('should apply exponential backoff with jitter', async () => {
    const delays: number[] = [];
    let lastTime = Date.now();
    let attemptCount = 0;

    const operation = vi.fn().mockImplementation(async () => {
      const now = Date.now();
      attemptCount++;

      // Record delay for attempts after the first
      if (attemptCount > 1) {
        delays.push(now - lastTime);
      }
      lastTime = now;

      // Fail first 2 attempts, succeed on 3rd
      if (attemptCount < 3) {
        throw errorHandler.createError('network', 'Network error', true);
      }
      return 'success';
    });

    const result = await errorHandler.executeWithRetry(operation, 'test');

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);

    // First delay should be ~100ms, second ~200ms (with jitter)
    expect(delays[0]).toBeGreaterThanOrEqual(80);
    expect(delays[0]).toBeLessThanOrEqual(150);
    expect(delays[1]).toBeGreaterThanOrEqual(180);
    expect(delays[1]).toBeLessThanOrEqual(300);
  });
});

describe('ErrorHandler - Error Creation and Normalization', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  it('should create standardized ExtensionError', () => {
    const error = errorHandler.createError(
      'api_unavailable',
      'Service unavailable',
      true
    );

    expect(error).toMatchObject({
      name: 'ExtensionError',
      type: 'api_unavailable',
      message: 'Service unavailable',
      retryable: true,
      userMessage: 'AI service unavailable',
      suggestedAction: 'Try again later or configure Gemini API as fallback.',
    });
  });

  it('should provide user-friendly messages for all error types', () => {
    const errorTypes: Array<ExtensionError['type']> = [
      'network',
      'api_unavailable',
      'rate_limit',
      'invalid_input',
      'processing_failed',
      'content_extraction_failed',
      'storage_quota_exceeded',
      'invalid_api_key',
      'insufficient_hardware',
    ];

    errorTypes.forEach(type => {
      const error = errorHandler.createError(type, 'Test error', false);
      expect(error.userMessage).toBeTruthy();
      expect(error.suggestedAction).toBeTruthy();
    });
  });
});

// ============================================================================
// Hardware Capability Detection Tests
// ============================================================================

describe('HardwareCapabilityDetector', () => {
  let detector: HardwareCapabilityDetector;

  beforeEach(() => {
    detector = new HardwareCapabilityDetector();
  });

  it('should check system capabilities', async () => {
    const capabilities = await detector.checkCapabilities();

    expect(capabilities).toHaveProperty('chromeAIAvailable');
    expect(capabilities).toHaveProperty('sufficientRAM');
    expect(capabilities).toHaveProperty('sufficientStorage');
    expect(capabilities).toHaveProperty('sufficientVRAM');
    expect(capabilities).toHaveProperty('canUseOffscreen');
  });

  it('should detect Chrome AI availability', async () => {
    const capabilities = await detector.checkCapabilities();

    // Chrome AI availability depends on environment
    expect(typeof capabilities.chromeAIAvailable).toBe('boolean');
  });

  it('should check RAM requirements', async () => {
    const capabilities = await detector.checkCapabilities();

    // Should return true if deviceMemory >= 4GB or cannot determine
    expect(typeof capabilities.sufficientRAM).toBe('boolean');
  });

  it('should check storage requirements', async () => {
    const capabilities = await detector.checkCapabilities();

    // Should check for 22GB available storage
    expect(typeof capabilities.sufficientStorage).toBe('boolean');
  });

  it('should check offscreen document support', async () => {
    const capabilities = await detector.checkCapabilities();

    // Depends on Chrome extension environment
    expect(typeof capabilities.canUseOffscreen).toBe('boolean');
  });

  it('should generate capability report', async () => {
    const report = await detector.getCapabilityReport();

    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(0);
  });

  it('should suggest Gemini API when hardware insufficient', async () => {
    const suggestion = await detector.suggestGeminiAPIIfNeeded();

    // Should return string or null
    expect(suggestion === null || typeof suggestion === 'string').toBe(true);

    if (suggestion) {
      expect(suggestion).toContain('Gemini API');
      expect(suggestion).toContain('https://aistudio.google.com');
    }
  });
});

// ============================================================================
// User Error Presenter Tests
// ============================================================================

describe('UserErrorPresenter', () => {
  let presenter: UserErrorPresenter;
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    presenter = new UserErrorPresenter();
    errorHandler = new ErrorHandler();
  });

  it('should format error for user display', () => {
    const error = errorHandler.createError(
      'network',
      'Connection failed',
      true
    );

    const formatted = presenter.formatError(error);

    expect(formatted).toMatchObject({
      title: 'Connection Issue',
      message: 'Network connection issue',
      action: 'Check your internet connection and try again.',
      severity: 'warning',
    });
  });

  it('should mark non-retryable errors as error severity', () => {
    const error = errorHandler.createError('invalid_input', 'Bad input', false);

    const formatted = presenter.formatError(error);

    expect(formatted.severity).toBe('error');
  });

  it('should mark retryable errors as warning severity', () => {
    const error = errorHandler.createError('rate_limit', 'Rate limited', true);

    const formatted = presenter.formatError(error);

    expect(formatted.severity).toBe('warning');
  });

  it('should create error notification HTML', () => {
    const error = errorHandler.createError(
      'api_unavailable',
      'Service down',
      true
    );

    const html = presenter.createErrorNotification(error);

    expect(html).toContain('error-notification');
    expect(html).toContain('Service Unavailable');
    expect(html).toContain('AI service unavailable');
    expect(html).toContain('Suggested action');
  });
});

// ============================================================================
// Progress Tracker Tests - Progress Indication
// ============================================================================

describe('ProgressTracker', () => {
  let tracker: ProgressTracker;
  let progressCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    progressCallback = vi.fn();
    tracker = new ProgressTracker('article_processing', 100, 'Processing...');
    tracker.onProgress(progressCallback);
  });

  it('should initialize with pending status', () => {
    const state = tracker.getState();

    expect(state).toMatchObject({
      type: 'article_processing',
      current: 0,
      total: 100,
      percentage: 0,
      message: 'Processing...',
      status: 'pending',
    });
  });

  it('should start progress tracking', () => {
    tracker.start('Started processing');

    const state = tracker.getState();
    expect(state.status).toBe('in_progress');
    expect(state.message).toBe('Started processing');
    expect(progressCallback).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'in_progress' })
    );
  });

  it('should update progress and calculate percentage', () => {
    tracker.start();
    tracker.update(50, 'Half done');

    const state = tracker.getState();
    expect(state.current).toBe(50);
    expect(state.percentage).toBe(50);
    expect(state.message).toBe('Half done');
  });

  it('should increment progress', () => {
    tracker.start();
    tracker.increment(10);
    tracker.increment(5);

    const state = tracker.getState();
    expect(state.current).toBe(15);
    expect(state.percentage).toBe(15);
  });

  it('should complete progress automatically when reaching total', () => {
    tracker.start();
    tracker.update(100);

    const state = tracker.getState();
    expect(state.status).toBe('completed');
    expect(state.percentage).toBe(100);
  });

  it('should mark progress as failed', () => {
    tracker.start();
    tracker.fail('Processing failed');

    const state = tracker.getState();
    expect(state.status).toBe('failed');
    expect(state.message).toBe('Processing failed');
  });

  it('should calculate estimated time remaining', () => {
    tracker.start();

    // Simulate some progress over time
    tracker.update(25);

    const state = tracker.getState();
    // ETA should be calculated based on progress rate
    expect(typeof state.estimatedTimeRemaining).toBe('number');
  });

  it('should notify callbacks on progress updates', () => {
    tracker.start();
    tracker.update(50);
    tracker.complete();

    expect(progressCallback).toHaveBeenCalledTimes(3);
  });

  it('should remove callbacks', () => {
    tracker.offProgress(progressCallback);
    tracker.start();

    expect(progressCallback).not.toHaveBeenCalled();
  });
});

describe('ModelDownloadTracker', () => {
  it('should track model download progress', () => {
    const tracker = new ModelDownloadTracker('language-model', 1024 * 1024);

    tracker.start();
    tracker.updateDownload(512 * 1024);

    const state = tracker.getState();
    expect(state.type).toBe('model_download');
    expect(state.percentage).toBe(50);
    expect(state.message).toContain('512 KB');
    expect(state.message).toContain('1 MB');
  });

  it('should format bytes correctly', () => {
    const tracker = new ModelDownloadTracker('test', 1024 * 1024 * 1024);

    tracker.start();
    tracker.updateDownload(500 * 1024 * 1024);

    const state = tracker.getState();
    expect(state.message).toContain('500 MB');
  });
});

describe('ArticleProcessingTracker', () => {
  it('should track article part processing', () => {
    const tracker = new ArticleProcessingTracker(3);

    tracker.start();
    tracker.updateStep(0, 'Extracting content', 50);

    const state = tracker.getState();
    expect(state.message).toContain('Part 1');
    expect(state.message).toContain('Extracting content');
    expect(state.current).toBe(50);
  });

  it('should complete part processing', () => {
    const tracker = new ArticleProcessingTracker(3);

    tracker.start();
    tracker.completePart(0);

    const state = tracker.getState();
    expect(state.current).toBe(100);
    expect(state.message).toContain('Part 1 completed');
  });

  it('should stream word-by-word progress', () => {
    const tracker = new ArticleProcessingTracker(2);

    tracker.start();
    tracker.streamWords(0, 50, 100);

    const state = tracker.getState();
    expect(state.message).toContain('Generating content');
    expect(state.current).toBe(50);
  });
});

describe('LoadingStateManager', () => {
  let manager: LoadingStateManager;

  beforeEach(() => {
    manager = new LoadingStateManager();
  });

  it('should set and check loading state', () => {
    manager.setLoading('operation1', true);

    expect(manager.isLoading('operation1')).toBe(true);
    expect(manager.isLoading('operation2')).toBe(false);
  });

  it('should check if any operation is loading', () => {
    expect(manager.isAnyLoading()).toBe(false);

    manager.setLoading('operation1', true);
    expect(manager.isAnyLoading()).toBe(true);

    manager.setLoading('operation1', false);
    expect(manager.isAnyLoading()).toBe(false);
  });

  it('should notify callbacks on loading state change', () => {
    const callback = vi.fn();
    manager.onLoadingChange('operation1', callback);

    manager.setLoading('operation1', true);
    expect(callback).toHaveBeenCalledWith(true);

    manager.setLoading('operation1', false);
    expect(callback).toHaveBeenCalledWith(false);
  });

  it('should remove callbacks', () => {
    const callback = vi.fn();
    manager.onLoadingChange('operation1', callback);
    manager.offLoadingChange('operation1', callback);

    manager.setLoading('operation1', true);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should wrap async operation with loading state', async () => {
    const operation = vi.fn().mockResolvedValue('result');

    const result = await manager.withLoading('operation1', operation);

    expect(result).toBe('result');
    expect(manager.isLoading('operation1')).toBe(false);
  });

  it('should clear loading state on operation error', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Failed'));

    await expect(manager.withLoading('operation1', operation)).rejects.toThrow(
      'Failed'
    );

    expect(manager.isLoading('operation1')).toBe(false);
  });

  it('should clear specific loading state', () => {
    manager.setLoading('operation1', true);
    manager.clear('operation1');

    expect(manager.isLoading('operation1')).toBe(false);
  });

  it('should clear all loading states', () => {
    manager.setLoading('operation1', true);
    manager.setLoading('operation2', true);
    manager.clearAll();

    expect(manager.isAnyLoading()).toBe(false);
  });
});

// ============================================================================
// Network Monitor Tests - Offline Mode and Network Error Handling
// ============================================================================

describe('NetworkMonitor', () => {
  let monitor: NetworkMonitor;

  beforeEach(() => {
    monitor = new NetworkMonitor();
  });

  it('should detect initial network status', () => {
    const status = monitor.getStatus();

    expect(status).toHaveProperty('online');
    expect(typeof status.online).toBe('boolean');
  });

  it('should check if network is online', () => {
    const isOnline = monitor.isNetworkOnline();

    expect(typeof isOnline).toBe('boolean');
  });

  it('should get connection quality', () => {
    const quality = monitor.getConnectionQuality();

    expect(['good', 'poor', 'offline']).toContain(quality);
  });

  it('should notify listeners on status change', () => {
    const callback = vi.fn();
    monitor.onStatusChange(callback);

    // Simulate offline event
    window.dispatchEvent(new Event('offline'));

    expect(callback).toHaveBeenCalledWith(false);
  });

  it('should remove status change listeners', () => {
    const callback = vi.fn();
    monitor.onStatusChange(callback);
    monitor.offStatusChange(callback);

    window.dispatchEvent(new Event('online'));

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('OfflineModeManager', () => {
  let monitor: NetworkMonitor;
  let manager: OfflineModeManager;
  let chromeMock: ReturnType<
    typeof import('./setup/chrome-mock').mockChromeStorage
  >;

  beforeEach(async () => {
    // Import and setup Chrome storage mock
    const { mockChromeStorage } = await import('./setup/chrome-mock');
    chromeMock = mockChromeStorage({
      articles: {},
      vocabulary: {},
      sentences: {},
    });

    monitor = new NetworkMonitor();
    manager = new OfflineModeManager(monitor);
  });

  afterEach(() => {
    chromeMock.cleanup();
  });

  it('should check if offline mode is available', async () => {
    const available = await manager.isOfflineModeAvailable();

    expect(typeof available).toBe('boolean');
  });

  it('should get offline capabilities', async () => {
    const capabilities = await manager.getOfflineCapabilities();

    expect(capabilities).toHaveProperty('canProcessOffline');
    expect(capabilities).toHaveProperty('cachedArticlesAvailable');
    expect(capabilities).toHaveProperty('cachedVocabularyAvailable');
    expect(capabilities).toHaveProperty('cachedSentencesAvailable');
  });

  it('should get offline mode message', () => {
    const message = manager.getOfflineModeMessage();

    expect(message).toContain('offline');
    expect(message).toContain('cached');
  });
});

describe('NetworkTimeoutHandler', () => {
  let handler: NetworkTimeoutHandler;

  beforeEach(() => {
    handler = new NetworkTimeoutHandler(1000);
  });

  it('should execute request within timeout', async () => {
    const request = vi.fn().mockResolvedValue('success');

    const result = await handler.executeWithTimeout(request, 1000);

    expect(result).toBe('success');
  });

  it('should timeout slow requests', async () => {
    const request = vi.fn().mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve('success'), 2000);
        })
    );

    await expect(handler.executeWithTimeout(request, 500)).rejects.toThrow(
      /timed out/
    );
  });

  it('should handle fetch with timeout', async () => {
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue(new Response('OK'));

    const response = await handler.fetchWithTimeout(
      'https://example.com',
      {},
      1000
    );

    expect(response).toBeInstanceOf(Response);
  });

  it('should abort fetch on timeout', async () => {
    global.fetch = vi.fn().mockImplementation((url, options) => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(new Response('OK'));
        }, 2000);

        // Listen to abort signal
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
        }
      });
    });

    await expect(
      handler.fetchWithTimeout('https://example.com', {}, 500)
    ).rejects.toThrow(/aborted|timed out/i);
  });
});

describe('RateLimitManager', () => {
  let manager: RateLimitManager;

  beforeEach(() => {
    manager = new RateLimitManager();
  });

  it('should check if service is rate limited', () => {
    expect(manager.isRateLimited('test-service')).toBe(false);
  });

  it('should record rate limit', () => {
    const resetTime = new Date(Date.now() + 60000);
    manager.recordRateLimit('test-service', resetTime, 0);

    expect(manager.isRateLimited('test-service')).toBe(true);
  });

  it('should clear rate limit after reset time', () => {
    const resetTime = new Date(Date.now() - 1000); // Past time
    manager.recordRateLimit('test-service', resetTime);

    expect(manager.isRateLimited('test-service')).toBe(false);
  });

  it('should track requests', () => {
    manager.trackRequest('test-service');
    manager.trackRequest('test-service');

    const count = manager.getRequestCount('test-service');
    expect(count).toBe(2);
  });

  it('should check if can make request', () => {
    expect(manager.canMakeRequest('test-service', 5)).toBe(true);

    // Make 5 requests
    for (let i = 0; i < 5; i++) {
      manager.trackRequest('test-service');
    }

    expect(manager.canMakeRequest('test-service', 5)).toBe(false);
  });

  it('should get time until reset', () => {
    const resetTime = new Date(Date.now() + 60000);
    manager.recordRateLimit('test-service', resetTime);

    const timeUntilReset = manager.getTimeUntilReset('test-service');
    expect(timeUntilReset).toBeGreaterThan(0);
    expect(timeUntilReset).toBeLessThanOrEqual(60000);
  });

  it('should get rate limit info', () => {
    const resetTime = new Date(Date.now() + 60000);
    manager.recordRateLimit('test-service', resetTime, 10);

    const info = manager.getRateLimitInfo('test-service');
    expect(info).toMatchObject({
      service: 'test-service',
      limitReached: true,
      resetTime,
      remainingRequests: 10,
    });
  });

  it('should clear rate limit', () => {
    const resetTime = new Date(Date.now() + 60000);
    manager.recordRateLimit('test-service', resetTime);

    manager.clearRateLimit('test-service');
    expect(manager.isRateLimited('test-service')).toBe(false);
  });
});

describe('GracefulDegradationManager', () => {
  let networkMonitor: NetworkMonitor;
  let offlineManager: OfflineModeManager;
  let rateLimitManager: RateLimitManager;
  let degradationManager: GracefulDegradationManager;

  beforeEach(() => {
    networkMonitor = new NetworkMonitor();
    offlineManager = new OfflineModeManager(networkMonitor);
    rateLimitManager = new RateLimitManager();
    degradationManager = new GracefulDegradationManager(
      networkMonitor,
      offlineManager,
      rateLimitManager
    );
  });

  it('should determine best available service', async () => {
    const service = await degradationManager.determineBestService([
      'gemini',
      'chrome_ai',
    ]);

    expect(service).toBeTruthy();
  });

  it('should return chrome_ai when offline', async () => {
    // Simulate offline
    window.dispatchEvent(new Event('offline'));

    const service = await degradationManager.determineBestService([
      'gemini',
      'chrome_ai',
    ]);

    expect(service).toBe('chrome_ai');
  });

  it('should skip rate limited services', async () => {
    const resetTime = new Date(Date.now() + 60000);
    rateLimitManager.recordRateLimit('gemini', resetTime);

    const service = await degradationManager.determineBestService([
      'gemini',
      'chrome_ai',
    ]);

    expect(service).toBe('chrome_ai');
  });

  it('should get degraded mode message', () => {
    const message = degradationManager.getDegradedModeMessage(['gemini']);

    expect(typeof message).toBe('string');
    expect(message.length).toBeGreaterThan(0);
  });

  it('should check if feature is available', async () => {
    const available =
      await degradationManager.isFeatureAvailable('view_cached');

    expect(available).toBe(true);
  });

  it('should get available features', async () => {
    const features = await degradationManager.getAvailableFeatures();

    expect(Array.isArray(features)).toBe(true);
    expect(features).toContain('view_cached');
  });
});
