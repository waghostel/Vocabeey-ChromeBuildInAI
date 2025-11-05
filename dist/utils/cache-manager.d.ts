/**
 * Cache Manager
 * Simple cache manager implementation for Chrome extension
 */
import type { ProcessedArticle } from '../types';
export interface CacheConfig {
    maxCacheSize: number;
    ttl: number;
}
export interface CacheItem<T = unknown> {
    value: T;
    timestamp: number;
}
export interface ProcessedContentCache {
    contentHash: string;
    type: 'summary' | 'rewrite' | 'vocabulary';
    difficulty?: number;
    maxLength?: number;
    content: string;
    timestamp: number;
    ttl: number;
}
export declare class CacheManager {
    private config;
    private performanceMetrics;
    private cacheSize;
    private readonly MAX_CACHE_SIZE_BYTES;
    private accessTimes;
    constructor(config?: Partial<CacheConfig>);
    get<T = unknown>(key: string): Promise<T | null>;
    set<T = unknown>(key: string, value: T): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
    getCachedProcessedContent(contentHash: string, type: 'summary' | 'rewrite' | 'vocabulary', parameter: number): Promise<string | null>;
    cacheProcessedContent(contentHash: string, type: 'summary' | 'rewrite' | 'vocabulary', parameter: number, content: string): Promise<void>;
    cacheArticle(article: ProcessedArticle): Promise<void>;
    getCachedArticle(url: string, language: string): Promise<ProcessedArticle | null>;
    isArticleCached(url: string, language: string): Promise<boolean>;
    cacheVocabularyTranslation(word: string, fromLang: string, toLang: string, translation: string): Promise<void>;
    getCachedTranslation(word: string, fromLang: string, toLang: string): Promise<string | null>;
    cacheBatchTranslations(translations: {
        word: string;
        fromLang: string;
        toLang: string;
        translation: string;
        context?: string;
    }[]): Promise<void>;
    getCacheStats(type: string): {
        hitRate: number;
        missRate: number;
        totalRequests: number;
    } | null;
    getAllCacheStats(): Map<string, unknown>;
    performMaintenance(): Promise<{
        articlesRemoved: number;
        vocabularyRemoved: number;
        sentencesRemoved: number;
        translationsRemoved: number;
        processedContentRemoved: number;
    }>;
    clearAllCaches(): Promise<void>;
    getPerformanceMetrics(): {
        operations: number;
        averageLatency: number;
        hitRate: number;
        missRate: number;
        totalTime: number;
    };
    resetPerformanceMetrics(): void;
    /**
     * Evict least recently used item from cache
     */
    private evictLRU;
    /**
     * Estimate size of value in bytes
     */
    private estimateSize;
    /**
     * Get current cache size in bytes
     */
    getCacheSize(): number;
    /**
     * Get cache size as human-readable string
     */
    getCacheSizeFormatted(): string;
    private generateProcessedContentKey;
}
export declare function getCacheManager(config?: Partial<CacheConfig>): CacheManager;
export declare function resetCacheManagerInstance(): void;
export declare function createCacheManager(config?: Partial<CacheConfig>): CacheManager;
export declare function generateContentHash(content: string): string;
export declare function isCachingAvailable(): Promise<boolean>;
//# sourceMappingURL=cache-manager.d.ts.map