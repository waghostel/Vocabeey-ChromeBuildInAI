/**
 * Offline and Network Error Handling
 * Creates offline mode with cached content
 * Handles network timeouts and API rate limiting
 * Implements graceful degradation for service failures
 */
import { type StorageManager } from './storage-manager';
import type { ProcessedArticle, ExtractedContent } from '../types';
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
export declare class NetworkMonitor {
    private isOnline;
    private listeners;
    private connectionQuality;
    constructor();
    /**
     * Setup network event listeners
     */
    private setupListeners;
    /**
     * Check connection quality
     */
    private checkConnectionQuality;
    /**
     * Get current network status
     */
    getStatus(): NetworkStatus;
    /**
     * Check if online
     */
    isNetworkOnline(): boolean;
    /**
     * Get connection quality
     */
    getConnectionQuality(): 'good' | 'poor' | 'offline';
    /**
     * Subscribe to network status changes
     */
    onStatusChange(callback: (online: boolean) => void): void;
    /**
     * Unsubscribe from network status changes
     */
    offStatusChange(callback: (online: boolean) => void): void;
    /**
     * Notify all listeners
     */
    private notifyListeners;
}
export declare class OfflineModeManager {
    private networkMonitor;
    private storageManager;
    constructor(networkMonitor: NetworkMonitor, storageManager?: StorageManager);
    /**
     * Check if offline mode is available
     */
    isOfflineModeAvailable(): Promise<boolean>;
    /**
     * Get offline capabilities
     */
    getOfflineCapabilities(): Promise<OfflineCapabilities>;
    /**
     * Get cached article for offline viewing
     */
    getCachedArticle(articleId: string): Promise<ProcessedArticle | null>;
    /**
     * Get all available cached articles for offline mode
     */
    getAvailableCachedArticles(): Promise<ProcessedArticle[]>;
    /**
     * Check if content can be processed offline
     */
    canProcessContentOffline(_content: ExtractedContent): boolean;
    /**
     * Get offline mode message
     */
    getOfflineModeMessage(): string;
}
export declare class NetworkTimeoutHandler {
    private readonly defaultTimeout;
    constructor(defaultTimeout?: number);
    /**
     * Execute request with timeout
     */
    executeWithTimeout<T>(request: () => Promise<T>, timeout?: number): Promise<T>;
    /**
     * Create timeout promise
     */
    private createTimeoutPromise;
    /**
     * Execute fetch with timeout
     */
    fetchWithTimeout(url: string, options?: RequestInit, timeout?: number): Promise<Response>;
}
export declare class RateLimitManager {
    private rateLimits;
    private requestCounts;
    /**
     * Check if service is rate limited
     */
    isRateLimited(service: string): boolean;
    /**
     * Record rate limit from API response
     */
    recordRateLimit(service: string, resetTime: Date, remainingRequests?: number): void;
    /**
     * Clear rate limit for service
     */
    clearRateLimit(service: string): void;
    /**
     * Track request for rate limiting
     */
    trackRequest(service: string, windowMs?: number): boolean;
    /**
     * Get request count in time window
     */
    getRequestCount(service: string, windowMs?: number): number;
    /**
     * Check if can make request (client-side rate limiting)
     */
    canMakeRequest(service: string, maxRequests: number, windowMs?: number): boolean;
    /**
     * Get time until rate limit reset
     */
    getTimeUntilReset(service: string): number | null;
    /**
     * Get rate limit info
     */
    getRateLimitInfo(service: string): RateLimitInfo | null;
}
export declare class GracefulDegradationManager {
    private networkMonitor;
    private offlineManager;
    private rateLimitManager;
    constructor(networkMonitor: NetworkMonitor, offlineManager: OfflineModeManager, rateLimitManager: RateLimitManager);
    /**
     * Determine best available service
     */
    determineBestService(preferredServices: string[]): Promise<string | null>;
    /**
     * Get degraded mode message
     */
    getDegradedModeMessage(unavailableServices: string[]): string;
    /**
     * Check if feature is available in current mode
     */
    isFeatureAvailable(feature: string): Promise<boolean>;
    /**
     * Get available features in current mode
     */
    getAvailableFeatures(): Promise<string[]>;
}
export declare const networkMonitor: NetworkMonitor;
export declare const offlineModeManager: OfflineModeManager;
export declare const networkTimeoutHandler: NetworkTimeoutHandler;
export declare const rateLimitManager: RateLimitManager;
export declare const gracefulDegradationManager: GracefulDegradationManager;
//# sourceMappingURL=offline-handler.d.ts.map