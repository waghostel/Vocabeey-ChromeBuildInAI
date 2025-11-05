/**
 * Memory Profiler - Development tool for monitoring memory usage
 * Provides real-time memory metrics and warnings
 */
export class MemoryProfiler {
    snapshots = [];
    MAX_SNAPSHOTS = 100;
    monitoringInterval = null;
    warningThreshold = 0.8; // 80%
    /**
     * Take a memory snapshot
     */
    takeSnapshot(context = 'manual') {
        if (!('memory' in performance)) {
            console.warn('performance.memory not available');
            return null;
        }
        const mem = performance.memory;
        const snapshot = {
            timestamp: Date.now(),
            used: mem.usedJSHeapSize,
            total: mem.totalJSHeapSize,
            limit: mem.jsHeapSizeLimit,
            percentage: (mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100,
            context,
        };
        // Store snapshot
        this.snapshots.push(snapshot);
        // Keep only recent snapshots
        if (this.snapshots.length > this.MAX_SNAPSHOTS) {
            this.snapshots.shift();
        }
        // Check for warnings
        if (snapshot.percentage > this.warningThreshold * 100) {
            this.logWarning(snapshot);
        }
        return snapshot;
    }
    /**
     * Start continuous monitoring
     */
    startMonitoring(intervalMs = 60000) {
        if (this.monitoringInterval) {
            return;
        }
        this.monitoringInterval = setInterval(() => {
            const snapshot = this.takeSnapshot('monitor');
            if (snapshot) {
                this.logSnapshot(snapshot);
            }
        }, intervalMs);
        console.log(`📊 Memory monitoring started (interval: ${intervalMs}ms)`);
    }
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('📊 Memory monitoring stopped');
        }
    }
    /**
     * Get memory growth since first snapshot
     */
    getMemoryGrowth() {
        if (this.snapshots.length < 2) {
            return null;
        }
        const first = this.snapshots[0];
        const last = this.snapshots[this.snapshots.length - 1];
        const absolute = last.used - first.used;
        const percentage = (absolute / first.used) * 100;
        return {
            absolute,
            percentage,
            formatted: `${(absolute / 1024 / 1024).toFixed(2)}MB (${percentage.toFixed(1)}%)`,
        };
    }
    /**
     * Get all snapshots
     */
    getSnapshots() {
        return [...this.snapshots];
    }
    /**
     * Clear all snapshots
     */
    clearSnapshots() {
        this.snapshots = [];
    }
    /**
     * Export snapshots as CSV
     */
    exportCSV() {
        const headers = 'Timestamp,Context,Used (MB),Total (MB),Limit (MB),Percentage\n';
        const rows = this.snapshots
            .map(s => {
            const date = new Date(s.timestamp).toISOString();
            const used = (s.used / 1024 / 1024).toFixed(2);
            const total = (s.total / 1024 / 1024).toFixed(2);
            const limit = (s.limit / 1024 / 1024).toFixed(2);
            return `${date},${s.context},${used},${total},${limit},${s.percentage.toFixed(2)}`;
        })
            .join('\n');
        return headers + rows;
    }
    /**
     * Log snapshot to console
     */
    logSnapshot(snapshot) {
        const used = (snapshot.used / 1024 / 1024).toFixed(2);
        const limit = (snapshot.limit / 1024 / 1024).toFixed(2);
        const percentage = snapshot.percentage.toFixed(1);
        console.log(`📊 Memory: ${used}MB / ${limit}MB (${percentage}%) [${snapshot.context}]`);
    }
    /**
     * Log memory warning
     */
    logWarning(snapshot) {
        const used = (snapshot.used / 1024 / 1024).toFixed(2);
        const limit = (snapshot.limit / 1024 / 1024).toFixed(2);
        const percentage = snapshot.percentage.toFixed(1);
        console.warn(`⚠️ HIGH MEMORY USAGE: ${used}MB / ${limit}MB (${percentage}%)`);
        console.warn('Consider:');
        console.warn('  - Closing unused tabs');
        console.warn('  - Clearing cache');
        console.warn('  - Reloading the extension');
    }
}
// Singleton instance
let profilerInstance = null;
/**
 * Get memory profiler instance
 */
export function getMemoryProfiler() {
    if (!profilerInstance) {
        profilerInstance = new MemoryProfiler();
    }
    return profilerInstance;
}
/**
 * Quick memory check - logs current memory usage
 */
export function checkMemory(context = 'check') {
    const profiler = getMemoryProfiler();
    profiler.takeSnapshot(context);
}
/**
 * Measure memory impact of an operation
 */
export async function measureMemoryImpact(operation, label) {
    const profiler = getMemoryProfiler();
    const before = profiler.takeSnapshot(`${label}:before`);
    const result = await operation();
    const after = profiler.takeSnapshot(`${label}:after`);
    if (!before || !after) {
        return {
            result,
            memoryDelta: 0,
            formatted: 'N/A',
        };
    }
    const delta = after.used - before.used;
    const formatted = `${(delta / 1024 / 1024).toFixed(2)}MB`;
    console.log(`📊 Memory impact of "${label}": ${formatted}`);
    return {
        result,
        memoryDelta: delta,
        formatted,
    };
}
// Expose to window for console access
if (typeof window !== 'undefined') {
    window.memoryProfiler = {
        check: checkMemory,
        start: () => getMemoryProfiler().startMonitoring(),
        stop: () => getMemoryProfiler().stopMonitoring(),
        growth: () => getMemoryProfiler().getMemoryGrowth(),
        export: () => getMemoryProfiler().exportCSV(),
        snapshots: () => getMemoryProfiler().getSnapshots(),
    };
    console.log('💡 Memory profiler available: window.memoryProfiler');
    console.log('  - memoryProfiler.check() - Take snapshot');
    console.log('  - memoryProfiler.start() - Start monitoring');
    console.log('  - memoryProfiler.stop() - Stop monitoring');
    console.log('  - memoryProfiler.growth() - Show memory growth');
    console.log('  - memoryProfiler.export() - Export as CSV');
}
//# sourceMappingURL=memory-profiler.js.map