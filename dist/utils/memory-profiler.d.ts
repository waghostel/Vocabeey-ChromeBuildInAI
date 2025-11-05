/**
 * Memory Profiler - Development tool for monitoring memory usage
 * Provides real-time memory metrics and warnings
 */
export interface MemorySnapshot {
    timestamp: number;
    used: number;
    total: number;
    limit: number;
    percentage: number;
    context: string;
}
export declare class MemoryProfiler {
    private snapshots;
    private readonly MAX_SNAPSHOTS;
    private monitoringInterval;
    private warningThreshold;
    /**
     * Take a memory snapshot
     */
    takeSnapshot(context?: string): MemorySnapshot | null;
    /**
     * Start continuous monitoring
     */
    startMonitoring(intervalMs?: number): void;
    /**
     * Stop monitoring
     */
    stopMonitoring(): void;
    /**
     * Get memory growth since first snapshot
     */
    getMemoryGrowth(): {
        absolute: number;
        percentage: number;
        formatted: string;
    } | null;
    /**
     * Get all snapshots
     */
    getSnapshots(): MemorySnapshot[];
    /**
     * Clear all snapshots
     */
    clearSnapshots(): void;
    /**
     * Export snapshots as CSV
     */
    exportCSV(): string;
    /**
     * Log snapshot to console
     */
    private logSnapshot;
    /**
     * Log memory warning
     */
    private logWarning;
}
/**
 * Get memory profiler instance
 */
export declare function getMemoryProfiler(): MemoryProfiler;
/**
 * Quick memory check - logs current memory usage
 */
export declare function checkMemory(context?: string): void;
/**
 * Measure memory impact of an operation
 */
export declare function measureMemoryImpact<T>(operation: () => Promise<T>, label: string): Promise<{
    result: T;
    memoryDelta: number;
    formatted: string;
}>;
//# sourceMappingURL=memory-profiler.d.ts.map