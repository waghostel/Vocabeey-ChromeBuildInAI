/**
 * Memory Manager - Comprehensive memory management and resource cleanup
 * Implements Requirements: 10.5, 10.6
 */
export interface MemoryUsage {
    used: number;
    total: number;
    percentage: number;
    jsHeapSizeLimit?: number;
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
}
export interface ResourceUsage {
    memory: MemoryUsage;
    storage: {
        used: number;
        quota: number;
        percentage: number;
    };
    activeTabs: number;
    aiSessions: number;
    offscreenDocuments: number;
}
export declare class MemoryManager {
    private static instance;
    private monitoringInterval;
    private readonly MEMORY_THRESHOLD;
    private readonly MONITORING_INTERVAL;
    private readonly activeTabs;
    private readonly activeOffscreenDocs;
    private memoryCallbacks;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): MemoryManager;
    /**
     * Register a tab as active learning interface
     */
    registerTab(tabId: number): void;
    /**
     * Unregister a tab and cleanup its resources
     */
    unregisterTab(tabId: number): Promise<void>;
    /**
     * Register an offscreen document
     */
    registerOffscreenDocument(documentId: string): void;
    /**
     * Unregister and cleanup offscreen document
     */
    unregisterOffscreenDocument(documentId: string): Promise<void>;
    /**
     * Get current resource usage
     */
    getResourceUsage(): Promise<ResourceUsage>;
    /**
     * Force cleanup of all resources
     */
    forceCleanup(): Promise<void>;
    /**
     * Check memory pressure and cleanup if needed
     */
    checkMemoryPressure(): Promise<boolean>;
    /**
     * Add memory usage callback
     */
    onMemoryUsageChange(callback: (usage: ResourceUsage) => void): () => void;
    /**
     * Start memory monitoring
     */
    startMonitoring(): void;
    /**
     * Stop memory monitoring
     */
    stopMonitoring(): void;
    /**
     * Destroy memory manager and cleanup all resources
     */
    destroy(): Promise<void>;
    /**
     * Setup tab event listeners
     */
    private setupTabListeners;
    /**
     * Setup memory monitoring
     */
    private setupMemoryMonitoring;
    /**
     * Get current memory usage
     */
    private getMemoryUsage;
    /**
     * Get current storage usage
     */
    private getStorageUsage;
    /**
     * Get count of active AI sessions
     */
    private getAISessionCount;
    /**
     * Cleanup resources for a specific tab
     */
    private cleanupTabResources;
    /**
     * Cleanup AI sessions
     */
    private cleanupAISessions;
    /**
     * Cleanup offscreen documents
     */
    private cleanupOffscreenDocuments;
    /**
     * Cleanup storage cache
     */
    private cleanupStorageCache;
    /**
     * Perform memory-focused cleanup
     */
    private performMemoryCleanup;
    /**
     * Perform resource-focused cleanup
     */
    private performResourceCleanup;
    /**
     * Force garbage collection if available
     */
    private forceGarbageCollection;
}
/**
 * Get the memory manager instance
 */
export declare function getMemoryManager(): MemoryManager;
/**
 * Initialize memory management for the extension
 */
export declare function initializeMemoryManagement(): Promise<void>;
/**
 * Cleanup memory management (for extension shutdown)
 */
export declare function shutdownMemoryManagement(): Promise<void>;
//# sourceMappingURL=memory-manager.d.ts.map