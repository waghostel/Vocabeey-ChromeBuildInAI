/**
 * Offline and Network Error Handling
 * Creates offline mode with cached content
 * Handles network timeouts and API rate limiting
 * Implements graceful degradation for service failures
 */
import { CacheManager } from './cache-manager.js';
import { getStorageManager } from './storage-manager.js';
// ============================================================================
// Network Monitor
// ============================================================================
export class NetworkMonitor {
    isOnline = navigator.onLine;
    listeners = [];
    connectionQuality = 'good';
    constructor() {
        this.setupListeners();
        this.checkConnectionQuality();
    }
    /**
     * Setup network event listeners
     */
    setupListeners() {
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
            const connection = navigator.connection;
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
    checkConnectionQuality() {
        if (!this.isOnline) {
            this.connectionQuality = 'offline';
            return;
        }
        if ('connection' in navigator) {
            const connection = navigator.connection;
            const effectiveType = connection?.effectiveType;
            // Consider 'slow-2g' and '2g' as poor connection
            if (effectiveType === 'slow-2g' || effectiveType === '2g') {
                this.connectionQuality = 'poor';
            }
            else {
                this.connectionQuality = 'good';
            }
        }
    }
    /**
     * Get current network status
     */
    getStatus() {
        const status = {
            online: this.isOnline,
        };
        if ('connection' in navigator) {
            const connection = navigator.connection;
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
    isNetworkOnline() {
        return this.isOnline;
    }
    /**
     * Get connection quality
     */
    getConnectionQuality() {
        return this.connectionQuality;
    }
    /**
     * Subscribe to network status changes
     */
    onStatusChange(callback) {
        this.listeners.push(callback);
    }
    /**
     * Unsubscribe from network status changes
     */
    offStatusChange(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }
    /**
     * Notify all listeners
     */
    notifyListeners(online) {
        this.listeners.forEach(callback => {
            try {
                callback(online);
            }
            catch (error) {
                console.error('Network status callback error:', error);
            }
        });
    }
}
// ============================================================================
// Offline Mode Manager
// ============================================================================
export class OfflineModeManager {
    networkMonitor;
    storageManager;
    constructor(networkMonitor, storageManager) {
        this.networkMonitor = networkMonitor;
        this.storageManager = storageManager || getStorageManager();
    }
    /**
     * Check if offline mode is available
     */
    async isOfflineModeAvailable() {
        const capabilities = await this.getOfflineCapabilities();
        return capabilities.cachedArticlesAvailable > 0;
    }
    /**
     * Get offline capabilities
     */
    async getOfflineCapabilities() {
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
    async getCachedArticle(articleId) {
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
    async getAvailableCachedArticles() {
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
    canProcessContentOffline(_content) {
        // Can only process if Chrome AI is available (doesn't require network)
        // Cannot use Gemini API or Jina Reader offline
        return this.networkMonitor.isNetworkOnline() === false;
    }
    /**
     * Get offline mode message
     */
    getOfflineModeMessage() {
        return 'You are currently offline. You can view cached articles and vocabulary, but cannot process new content.';
    }
}
// ============================================================================
// Network Timeout Handler
// ============================================================================
export class NetworkTimeoutHandler {
    defaultTimeout;
    constructor(defaultTimeout = 30000) {
        this.defaultTimeout = defaultTimeout;
    }
    /**
     * Execute request with timeout
     */
    async executeWithTimeout(request, timeout = this.defaultTimeout) {
        return Promise.race([request(), this.createTimeoutPromise(timeout)]);
    }
    /**
     * Create timeout promise
     */
    createTimeoutPromise(timeout) {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Request timed out after ${timeout}ms`));
            }, timeout);
        });
    }
    /**
     * Execute fetch with timeout
     */
    async fetchWithTimeout(url, options = {}, timeout = this.defaultTimeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        }
        catch (error) {
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
    rateLimits = new Map();
    requestCounts = new Map();
    /**
     * Check if service is rate limited
     */
    isRateLimited(service) {
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
    recordRateLimit(service, resetTime, remainingRequests) {
        this.rateLimits.set(service, {
            service,
            limitReached: true,
            resetTime,
            remainingRequests,
        });
        console.warn(`Rate limit reached for ${service}. Resets at ${resetTime.toISOString()}`);
    }
    /**
     * Clear rate limit for service
     */
    clearRateLimit(service) {
        this.rateLimits.delete(service);
    }
    /**
     * Track request for rate limiting
     */
    trackRequest(service, windowMs = 60000) {
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
    getRequestCount(service, windowMs = 60000) {
        const now = Date.now();
        const requests = this.requestCounts.get(service) || [];
        return requests.filter(time => now - time < windowMs).length;
    }
    /**
     * Check if can make request (client-side rate limiting)
     */
    canMakeRequest(service, maxRequests, windowMs = 60000) {
        if (this.isRateLimited(service)) {
            return false;
        }
        const count = this.getRequestCount(service, windowMs);
        return count < maxRequests;
    }
    /**
     * Get time until rate limit reset
     */
    getTimeUntilReset(service) {
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
    getRateLimitInfo(service) {
        return this.rateLimits.get(service) || null;
    }
}
// ============================================================================
// Graceful Degradation Manager
// ============================================================================
export class GracefulDegradationManager {
    networkMonitor;
    offlineManager;
    rateLimitManager;
    constructor(networkMonitor, offlineManager, rateLimitManager) {
        this.networkMonitor = networkMonitor;
        this.offlineManager = offlineManager;
        this.rateLimitManager = rateLimitManager;
    }
    /**
     * Determine best available service
     */
    async determineBestService(preferredServices) {
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
    getDegradedModeMessage(unavailableServices) {
        if (!this.networkMonitor.isNetworkOnline()) {
            return 'Offline mode: Only cached content and Chrome AI features are available.';
        }
        const rateLimited = unavailableServices.filter(service => this.rateLimitManager.isRateLimited(service));
        if (rateLimited.length > 0) {
            return `Some services are temporarily unavailable due to rate limiting: ${rateLimited.join(', ')}. Using fallback options.`;
        }
        return 'Some services are temporarily unavailable. Using fallback options.';
    }
    /**
     * Check if feature is available in current mode
     */
    async isFeatureAvailable(feature) {
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
    async getAvailableFeatures() {
        const features = [
            'process_new_article',
            'translate',
            'gemini_api',
            'jina_reader',
            'view_cached',
        ];
        const available = [];
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
export const gracefulDegradationManager = new GracefulDegradationManager(networkMonitor, offlineModeManager, rateLimitManager);
//# sourceMappingURL=offline-handler.js.map