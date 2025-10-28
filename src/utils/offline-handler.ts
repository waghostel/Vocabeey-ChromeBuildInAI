/**
 * Offline and Network Error Handling
 * Creates offline mode with cached content
 * Handles network timeouts and API rate limiting
 * Implements graceful degradation for service failures
 */

import { CacheManager } from './cache-manager';
import { getStorageManager, type StorageManager } from './storage-manager';

import type { ProcessedArticle, ExtractedContent } from '../types';

// ============================================================================
// Network Status Types
// ============================================================================

export interface NetworkStatus {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

export interface OfflineCapabilities {
  canProcessOffline: boolean;
  cachedArticlesAvailable: number;
  cachedVocabularyAvailable: number;
  cachedSentencesAvailable: number;
}

export interface RateLimitInfo {
  service: string;
  limitReached: boolean;
  resetTime?: Date;
  remainingRequests?: number;
}

// ============================================================================
// Network Monitor
// ============================================================================

export class NetworkMonitor {
  private isOnline: boolean = navigator.onLine;
  private listeners: ((online: boolean) => void)[] = [];
  private connectionQuality: 'good' | 'poor' | 'offline' = 'good';

  constructor() {
    this.setupListeners();
    this.checkConnectionQuality();
  }

  /**
   * Setup network event listeners
   */
  private setupListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.connectionQuality = 'good';
      this.notifyListeners(true);
      console.log('Network: Online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.connectionQuality = 'offline';
      this.notifyListeners(false);
      console.log('Network: Offline');
    });

    // Monitor connection quality if available
    if ('connection' in navigator) {
      const connection = (
        navigator as unknown as {
          connection?: {
            addEventListener: (event: string, callback: () => void) => void;
          };
        }
      ).connection;
      if (connection) {
        connection.addEventListener('change', () => {
          this.checkConnectionQuality();
        });
      }
    }
  }

  /**
   * Check connection quality
   */
  private checkConnectionQuality(): void {
    if (!this.isOnline) {
      this.connectionQuality = 'offline';
      return;
    }

    if ('connection' in navigator) {
      const connection = (
        navigator as unknown as { connection?: { effectiveType?: string } }
      ).connection;
      const effectiveType = connection?.effectiveType;

      // Consider 'slow-2g' and '2g' as poor connection
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        this.connectionQuality = 'poor';
      } else {
        this.connectionQuality = 'good';
      }
    }
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    const status: NetworkStatus = {
      online: this.isOnline,
    };

    if ('connection' in navigator) {
      const connection = (
        navigator as unknown as {
          connection?: {
            effectiveType?: string;
            downlink?: number;
            rtt?: number;
            saveData?: boolean;
          };
        }
      ).connection;
      if (connection) {
        status.effectiveType = connection.effectiveType;
        status.downlink = connection.downlink;
        status.rtt = connection.rtt;
        status.saveData = connection.saveData;
      }
    }

    return status;
  }

  /**
   * Check if online
   */
  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get connection quality
   */
  getConnectionQuality(): 'good' | 'poor' | 'offline' {
    return this.connectionQuality;
  }

  /**
   * Subscribe to network status changes
   */
  onStatusChange(callback: (online: boolean) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Unsubscribe from network status changes
   */
  offStatusChange(callback: (online: boolean) => void): void {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(online: boolean): void {
    this.listeners.forEach(callback => {
      try {
        callback(online);
      } catch (error) {
        console.error('Network status callback error:', error);
      }
    });
  }
}

// ============================================================================
// Offline Mode Manager
// ============================================================================

export class OfflineModeManager {
  private networkMonitor: NetworkMonitor;
  private storageManager: StorageManager;

  constructor(networkMonitor: NetworkMonitor, storageManager?: StorageManager) {
    this.networkMonitor = networkMonitor;
    this.storageManager = storageManager || getStorageManager();
  }

  /**
   * Check if offline mode is available
   */
  async isOfflineModeAvailable(): Promise<boolean> {
    const capabilities = await this.getOfflineCapabilities();
    return capabilities.cachedArticlesAvailable > 0;
  }

  /**
   * Get offline capabilities
   */
  async getOfflineCapabilities(): Promise<OfflineCapabilities> {
    const articles = await this.storageManager.getAllArticles();
    const vocabulary = await this.storageManager.getAllVocabulary();
    const sentences = await this.storageManager.getAllSentences();

    // Filter out expired articles
    const now = new Date();
    const validArticles = articles.filter(article => {
      const expiresAt = new Date(article.cacheExpires);
      return now <= expiresAt;
    });

    return {
      canProcessOffline: validArticles.length > 0,
      cachedArticlesAvailable: validArticles.length,
      cachedVocabularyAvailable: vocabulary.length,
      cachedSentencesAvailable: sentences.length,
    };
  }

  /**
   * Get cached article for offline viewing
   */
  async getCachedArticle(articleId: string): Promise<ProcessedArticle | null> {
    if (this.networkMonitor.isNetworkOnline()) {
      // Online - use normal cache retrieval
      const cacheManager = new CacheManager();
      return await cacheManager.getCachedArticle(articleId, 'en'); // Default language
    }

    // Offline - get from storage without expiration check
    return await this.storageManager.getArticle(articleId);
  }

  /**
   * Get all available cached articles for offline mode
   */
  async getAvailableCachedArticles(): Promise<ProcessedArticle[]> {
    const articles = await this.storageManager.getAllArticles();

    // If offline, return all articles regardless of expiration
    if (!this.networkMonitor.isNetworkOnline()) {
      return articles;
    }

    // If online, filter expired articles
    const now = new Date();
    return articles.filter(article => {
      const expiresAt = new Date(article.cacheExpires);
      return now <= expiresAt;
    });
  }

  /**
   * Check if content can be processed offline
   */
  canProcessContentOffline(_content: ExtractedContent): boolean {
    // Can only process if Chrome AI is available (doesn't require network)
    // Cannot use Gemini API or Jina Reader offline
    return this.networkMonitor.isNetworkOnline() === false;
  }

  /**
   * Get offline mode message
   */
  getOfflineModeMessage(): string {
    return 'You are currently offline. You can view cached articles and vocabulary, but cannot process new content.';
  }
}

// ============================================================================
// Network Timeout Handler
// ============================================================================

export class NetworkTimeoutHandler {
  private readonly defaultTimeout: number;

  constructor(defaultTimeout: number = 30000) {
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Execute request with timeout
   */
  async executeWithTimeout<T>(
    request: () => Promise<T>,
    timeout: number = this.defaultTimeout
  ): Promise<T> {
    return Promise.race([request(), this.createTimeoutPromise<T>(timeout)]);
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Execute fetch with timeout
   */
  async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = this.defaultTimeout
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request to ${url} timed out after ${timeout}ms`);
      }
      throw error;
    }
  }
}

// ============================================================================
// Rate Limit Manager
// ============================================================================

export class RateLimitManager {
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private requestCounts: Map<string, number[]> = new Map();

  /**
   * Check if service is rate limited
   */
  isRateLimited(service: string): boolean {
    const info = this.rateLimits.get(service);
    if (!info || !info.limitReached) {
      return false;
    }

    // Check if reset time has passed
    if (info.resetTime && new Date() >= info.resetTime) {
      this.clearRateLimit(service);
      return false;
    }

    return true;
  }

  /**
   * Record rate limit from API response
   */
  recordRateLimit(
    service: string,
    resetTime: Date,
    remainingRequests?: number
  ): void {
    this.rateLimits.set(service, {
      service,
      limitReached: true,
      resetTime,
      remainingRequests,
    });

    console.warn(
      `Rate limit reached for ${service}. Resets at ${resetTime.toISOString()}`
    );
  }

  /**
   * Clear rate limit for service
   */
  clearRateLimit(service: string): void {
    this.rateLimits.delete(service);
  }

  /**
   * Track request for rate limiting
   */
  trackRequest(service: string, windowMs: number = 60000): boolean {
    const now = Date.now();
    const requests = this.requestCounts.get(service) || [];

    // Remove requests outside the time window
    const recentRequests = requests.filter(time => now - time < windowMs);

    // Add current request
    recentRequests.push(now);
    this.requestCounts.set(service, recentRequests);

    return true;
  }

  /**
   * Get request count in time window
   */
  getRequestCount(service: string, windowMs: number = 60000): number {
    const now = Date.now();
    const requests = this.requestCounts.get(service) || [];
    return requests.filter(time => now - time < windowMs).length;
  }

  /**
   * Check if can make request (client-side rate limiting)
   */
  canMakeRequest(
    service: string,
    maxRequests: number,
    windowMs: number = 60000
  ): boolean {
    if (this.isRateLimited(service)) {
      return false;
    }

    const count = this.getRequestCount(service, windowMs);
    return count < maxRequests;
  }

  /**
   * Get time until rate limit reset
   */
  getTimeUntilReset(service: string): number | null {
    const info = this.rateLimits.get(service);
    if (!info || !info.resetTime) {
      return null;
    }

    const now = new Date();
    const resetTime = info.resetTime;

    if (now >= resetTime) {
      this.clearRateLimit(service);
      return null;
    }

    return resetTime.getTime() - now.getTime();
  }

  /**
   * Get rate limit info
   */
  getRateLimitInfo(service: string): RateLimitInfo | null {
    return this.rateLimits.get(service) || null;
  }
}

// ============================================================================
// Graceful Degradation Manager
// ============================================================================

export class GracefulDegradationManager {
  private networkMonitor: NetworkMonitor;
  private offlineManager: OfflineModeManager;
  private rateLimitManager: RateLimitManager;

  constructor(
    networkMonitor: NetworkMonitor,
    offlineManager: OfflineModeManager,
    rateLimitManager: RateLimitManager
  ) {
    this.networkMonitor = networkMonitor;
    this.offlineManager = offlineManager;
    this.rateLimitManager = rateLimitManager;
  }

  /**
   * Determine best available service
   */
  async determineBestService(
    preferredServices: string[]
  ): Promise<string | null> {
    // If offline, no external services available
    if (!this.networkMonitor.isNetworkOnline()) {
      return 'chrome_ai'; // Only local Chrome AI works offline
    }

    // Check each service in order of preference
    for (const service of preferredServices) {
      if (!this.rateLimitManager.isRateLimited(service)) {
        return service;
      }
    }

    // All services rate limited
    return null;
  }

  /**
   * Get degraded mode message
   */
  getDegradedModeMessage(unavailableServices: string[]): string {
    if (!this.networkMonitor.isNetworkOnline()) {
      return 'Offline mode: Only cached content and Chrome AI features are available.';
    }

    const rateLimited = unavailableServices.filter(service =>
      this.rateLimitManager.isRateLimited(service)
    );

    if (rateLimited.length > 0) {
      return `Some services are temporarily unavailable due to rate limiting: ${rateLimited.join(', ')}. Using fallback options.`;
    }

    return 'Some services are temporarily unavailable. Using fallback options.';
  }

  /**
   * Check if feature is available in current mode
   */
  async isFeatureAvailable(feature: string): Promise<boolean> {
    const online = this.networkMonitor.isNetworkOnline();

    switch (feature) {
      case 'process_new_article':
        return online || (await this.offlineManager.isOfflineModeAvailable());

      case 'translate':
        return online && !this.rateLimitManager.isRateLimited('translator');

      case 'gemini_api':
        return online && !this.rateLimitManager.isRateLimited('gemini');

      case 'jina_reader':
        return online && !this.rateLimitManager.isRateLimited('jina');

      case 'view_cached':
        return true; // Always available

      default:
        return online;
    }
  }

  /**
   * Get available features in current mode
   */
  async getAvailableFeatures(): Promise<string[]> {
    const features = [
      'process_new_article',
      'translate',
      'gemini_api',
      'jina_reader',
      'view_cached',
    ];

    const available: string[] = [];

    for (const feature of features) {
      if (await this.isFeatureAvailable(feature)) {
        available.push(feature);
      }
    }

    return available;
  }
}

// ============================================================================
// Global Instances
// ============================================================================

export const networkMonitor = new NetworkMonitor();
export const offlineModeManager = new OfflineModeManager(networkMonitor);
export const networkTimeoutHandler = new NetworkTimeoutHandler(30000);
export const rateLimitManager = new RateLimitManager();
export const gracefulDegradationManager = new GracefulDegradationManager(
  networkMonitor,
  offlineModeManager,
  rateLimitManager
);
