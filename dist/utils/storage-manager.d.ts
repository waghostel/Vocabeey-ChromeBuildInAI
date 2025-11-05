/**
 * Storage Manager - Versioned storage schema with validation and quota monitoring
 * Implements Requirements: 8.1, 8.2, 8.4
 */
import { type CacheManager } from './cache-manager';
import type { UserSettings, ProcessedArticle, VocabularyItem, SentenceItem, ProcessingTask } from '../types';
export declare const CURRENT_SCHEMA_VERSION = "1.0.0";
export interface StorageSchema {
    schema_version: string;
    user_settings: UserSettings;
    articles: Record<string, ProcessedArticle>;
    vocabulary: Record<string, VocabularyItem>;
    sentences: Record<string, SentenceItem>;
    processing_queue: ProcessingTask[];
    statistics: {
        articlesProcessed: number;
        vocabularyLearned: number;
        sentencesHighlighted: number;
        lastActivity: string;
    };
}
export declare class StorageManager {
    private cacheManager;
    constructor(cacheManager?: CacheManager);
    /**
     * Initialize storage with default schema if not exists
     */
    initialize(): Promise<void>;
    /**
     * Get current schema version
     */
    getSchemaVersion(): Promise<string>;
    /**
     * Get user settings
     */
    getUserSettings(): Promise<UserSettings>;
    /**
     * Save user settings
     */
    saveUserSettings(settings: UserSettings): Promise<void>;
    /**
     * Save article
     */
    saveArticle(article: ProcessedArticle): Promise<void>;
    /**
     * Get article by ID
     */
    getArticle(articleId: string): Promise<ProcessedArticle | null>;
    /**
     * Get article by URL with intelligent caching
     */
    getArticleByUrl(url: string, language: string): Promise<ProcessedArticle | null>;
    /**
     * Get all articles
     */
    getAllArticles(): Promise<ProcessedArticle[]>;
    /**
     * Delete article
     */
    deleteArticle(articleId: string): Promise<void>;
    /**
     * Save vocabulary item
     */
    saveVocabulary(vocab: VocabularyItem): Promise<void>;
    /**
     * Get vocabulary item by ID
     */
    getVocabulary(vocabId: string): Promise<VocabularyItem | null>;
    /**
     * Get all vocabulary items
     */
    getAllVocabulary(): Promise<VocabularyItem[]>;
    /**
     * Delete vocabulary item
     */
    deleteVocabulary(vocabId: string): Promise<void>;
    /**
     * Save sentence item
     */
    saveSentence(sentence: SentenceItem): Promise<void>;
    /**
     * Get sentence item by ID
     */
    getSentence(sentenceId: string): Promise<SentenceItem | null>;
    /**
     * Get all sentence items
     */
    getAllSentences(): Promise<SentenceItem[]>;
    /**
     * Delete sentence item
     */
    deleteSentence(sentenceId: string): Promise<void>;
    /**
     * Get statistics
     */
    getStatistics(): Promise<StorageSchema['statistics']>;
    /**
     * Update last activity timestamp
     */
    private updateLastActivity;
    /**
     * Increment a statistic counter
     */
    private incrementStatistic;
    /**
     * Check storage quota and alert if necessary
     */
    checkStorageQuota(): Promise<{
        bytesInUse: number;
        quota: number;
        percentUsed: number;
        status: 'ok' | 'warning' | 'critical';
    }>;
    /**
     * Clear all data (for testing or reset)
     */
    clearAll(): Promise<void>;
    /**
     * Export all data to JSON format
     */
    exportData(format: 'json' | 'markdown'): Promise<string>;
    /**
     * Import data from JSON format
     */
    importData(data: string): Promise<void>;
    /**
     * Clean up data associated with a specific tab
     */
    cleanupTabData(tabId: number): Promise<void>;
    /**
     * Perform maintenance cleanup (remove old/expired data)
     */
    performMaintenanceCleanup(): Promise<{
        articlesRemoved: number;
        vocabularyRemoved: number;
        sentencesRemoved: number;
    }>;
    /**
     * Get memory usage estimate for stored data
     */
    getMemoryUsageEstimate(): Promise<{
        totalBytes: number;
        articleBytes: number;
        vocabularyBytes: number;
        sentenceBytes: number;
    }>;
    /**
     * Validate user settings
     */
    private validateUserSettings;
    /**
     * Validate article
     */
    private validateArticle;
    /**
     * Validate vocabulary item
     */
    private validateVocabulary;
    /**
     * Validate sentence item
     */
    private validateSentence;
}
/**
 * Get storage manager instance
 */
export declare function getStorageManager(cacheManager?: CacheManager): StorageManager;
/**
 * Create a new storage manager instance (for testing)
 */
export declare function createStorageManager(cacheManager?: CacheManager): StorageManager;
//# sourceMappingURL=storage-manager.d.ts.map