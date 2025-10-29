/**
 * Memory Usage Monitor
 * Provides detailed memory tracking, leak detection, and performance optimization monitoring
 * Implements Requirements: 3.3, 5.4, 6.4
 */

export interface MemorySnapshot {
  timestamp: Date;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryPressure: 'low' | 'moderate' | 'high' | 'critical';
  context: string;
  taskId?: string;
}

export interface MemoryLeakAnalysis {
  hasLeak: boolean;
  severity: 'none' | 'minor' | 'moderate' | 'severe';
  trend: 'increasing' | 'stable' | 'decreasing';
  growthRate: number; // bytes per second
  recommendation: string;
  affectedComponents: string[];
}

export interface PerformanceOptimizationMetrics {
  memoryEfficiency: number; // 1-10 score
  gcFrequency: number; // garbage collections per minute
  memoryFragmentation: number; // percentage
  cacheHitRate: number; // percentage
  recommendations: string[];
}

export interface ComponentMemoryUsage {
  component: string;
  memoryUsage: number;
  percentage: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  lastUpdated: Date;
}

export class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private componentUsage: Map<string, ComponentMemoryUsage> = new Map();
  private monitoringInterval: number | null = null;
  private gcObserver: PerformanceObserver | null = null;
  private gcEvents: Date[] = [];
  private readonly maxSnapshots = 1000;
  private readonly monitorIntervalMs = 2000; // 2 seconds
  private readonly leakDetectionWindow = 20; // Number of snapshots to analyze

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      console.warn('Memory monitoring already started');
      return;
    }

    console.log('Starting memory monitoring');

    // Start periodic memory snapshots
    this.monitoringInterval = window.setInterval(() => {
      this.takeMemorySnapshot('periodic');
    }, this.monitorIntervalMs);

    // Set up garbage collection monitoring if available
    this.setupGCMonitoring();

    // Take initial snapshot
    this.takeMemorySnapshot('initial');
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.gcObserver) {
      this.gcObserver.disconnect();
      this.gcObserver = null;
    }

    console.log('Memory monitoring stopped');
  }

  /**
   * Take a memory snapshot
   */
  takeMemorySnapshot(context: string, taskId?: string): MemorySnapshot | null {
    if (!performance.memory) {
      console.warn('Performance memory API not available');
      return null;
    }

    const memory = performance.memory;
    const snapshot: MemorySnapshot = {
      timestamp: new Date(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      memoryPressure: this.calculateMemoryPressure(memory),
      context,
      taskId,
    };

    this.snapshots.push(snapshot);

    // Maintain snapshot history limit
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    // Log critical memory pressure
    if (snapshot.memoryPressure === 'critical') {
      console.warn('Critical memory pressure detected:', snapshot);
      this.triggerMemoryCleanup();
    }

    return snapshot;
  }

  /**
   * Track memory usage for a specific component
   */
  trackComponentMemory(component: string, memoryUsage: number): void {
    const existing = this.componentUsage.get(component);
    const now = new Date();

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';

    if (existing) {
      if (memoryUsage > existing.memoryUsage * 1.1) {
        trend = 'increasing';
      } else if (memoryUsage < existing.memoryUsage * 0.9) {
        trend = 'decreasing';
      }
    }

    // Calculate percentage of total memory
    const totalMemory = performance.memory?.usedJSHeapSize || 1;
    const percentage = (memoryUsage / totalMemory) * 100;

    this.componentUsage.set(component, {
      component,
      memoryUsage,
      percentage,
      trend,
      lastUpdated: now,
    });
  }

  /**
   * Analyze memory for potential leaks
   */
  analyzeMemoryLeaks(): MemoryLeakAnalysis {
    if (this.snapshots.length < this.leakDetectionWindow) {
      return {
        hasLeak: false,
        severity: 'none',
        trend: 'stable',
        growthRate: 0,
        recommendation: 'Insufficient data for leak analysis',
        affectedComponents: [],
      };
    }

    // Analyze recent snapshots
    const recentSnapshots = this.snapshots.slice(-this.leakDetectionWindow);
    const memoryValues = recentSnapshots.map(s => s.usedJSHeapSize);

    // Calculate trend and growth rate
    const { trend, growthRate } = this.calculateMemoryTrend(recentSnapshots);

    // Determine leak severity
    const severity = this.assessLeakSeverity(growthRate, trend);
    const hasLeak = severity !== 'none';

    // Identify affected components
    const affectedComponents = this.identifyAffectedComponents();

    // Generate recommendation
    const recommendation = this.generateLeakRecommendation(
      severity,
      growthRate,
      affectedComponents
    );

    return {
      hasLeak,
      severity,
      trend,
      growthRate,
      recommendation,
      affectedComponents,
    };
  }

  /**
   * Get performance optimization metrics
   */
  getPerformanceOptimizationMetrics(): PerformanceOptimizationMetrics {
    const memoryEfficiency = this.calculateMemoryEfficiency();
    const gcFrequency = this.calculateGCFrequency();
    const memoryFragmentation = this.calculateMemoryFragmentation();
    const cacheHitRate = this.estimateCacheHitRate();
    const recommendations = this.generateOptimizationRecommendations();

    return {
      memoryEfficiency,
      gcFrequency,
      memoryFragmentation,
      cacheHitRate,
      recommendations,
    };
  }

  /**
   * Get current memory usage by component
   */
  getComponentMemoryUsage(): ComponentMemoryUsage[] {
    return Array.from(this.componentUsage.values()).sort(
      (a, b) => b.memoryUsage - a.memoryUsage
    );
  }

  /**
   * Get memory snapshots
   */
  getMemorySnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get recent memory snapshots
   */
  getRecentSnapshots(count: number = 50): MemorySnapshot[] {
    return this.snapshots.slice(-count);
  }

  /**
   * Force garbage collection (if available)
   */
  forceGarbageCollection(): boolean {
    if (window.gc) {
      try {
        window.gc();
        console.log('Forced garbage collection');
        return true;
      } catch (error) {
        console.warn('Failed to force garbage collection:', error);
      }
    } else {
      console.warn('Garbage collection not available');
    }
    return false;
  }

  /**
   * Clear monitoring data
   */
  clearData(): void {
    this.snapshots = [];
    this.componentUsage.clear();
    this.gcEvents = [];
    console.log('Memory monitoring data cleared');
  }

  /**
   * Get memory usage summary
   */
  getMemoryUsageSummary(): {
    current: MemorySnapshot | null;
    peak: MemorySnapshot | null;
    average: number;
    trend: string;
    leakAnalysis: MemoryLeakAnalysis;
  } {
    const current =
      this.snapshots.length > 0
        ? this.snapshots[this.snapshots.length - 1]
        : null;
    const peak = this.snapshots.reduce(
      (max, snapshot) =>
        snapshot.usedJSHeapSize > (max?.usedJSHeapSize || 0) ? snapshot : max,
      null as MemorySnapshot | null
    );

    const average =
      this.snapshots.length > 0
        ? this.snapshots.reduce((sum, s) => sum + s.usedJSHeapSize, 0) /
          this.snapshots.length
        : 0;

    const leakAnalysis = this.analyzeMemoryLeaks();

    return {
      current,
      peak,
      average,
      trend: leakAnalysis.trend,
      leakAnalysis,
    };
  }

  /**
   * Calculate memory pressure level
   */
  private calculateMemoryPressure(
    memory: Performance['memory']
  ): MemorySnapshot['memoryPressure'] {
    const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

    if (usageRatio > 0.9) return 'critical';
    if (usageRatio > 0.75) return 'high';
    if (usageRatio > 0.5) return 'moderate';
    return 'low';
  }

  /**
   * Calculate memory trend and growth rate
   */
  private calculateMemoryTrend(snapshots: MemorySnapshot[]): {
    trend: 'increasing' | 'stable' | 'decreasing';
    growthRate: number;
  } {
    if (snapshots.length < 2) {
      return { trend: 'stable', growthRate: 0 };
    }

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];
    const timeDiff =
      (last.timestamp.getTime() - first.timestamp.getTime()) / 1000; // seconds
    const memoryDiff = last.usedJSHeapSize - first.usedJSHeapSize;

    const growthRate = timeDiff > 0 ? memoryDiff / timeDiff : 0;

    // Analyze trend over multiple points
    let increasingCount = 0;
    let decreasingCount = 0;

    for (let i = 1; i < snapshots.length; i++) {
      const diff =
        snapshots[i].usedJSHeapSize - snapshots[i - 1].usedJSHeapSize;
      if (diff > 0) increasingCount++;
      else if (diff < 0) decreasingCount++;
    }

    const trend =
      increasingCount > decreasingCount
        ? 'increasing'
        : decreasingCount > increasingCount
          ? 'decreasing'
          : 'stable';

    return { trend, growthRate };
  }

  /**
   * Assess leak severity based on growth rate and trend
   */
  private assessLeakSeverity(
    growthRate: number,
    trend: string
  ): MemoryLeakAnalysis['severity'] {
    if (trend !== 'increasing') return 'none';

    const growthRateMB = growthRate / (1024 * 1024); // Convert to MB/s

    if (growthRateMB > 5) return 'severe'; // > 5 MB/s
    if (growthRateMB > 1) return 'moderate'; // > 1 MB/s
    if (growthRateMB > 0.1) return 'minor'; // > 0.1 MB/s
    return 'none';
  }

  /**
   * Identify components that might be causing memory leaks
   */
  private identifyAffectedComponents(): string[] {
    const affected: string[] = [];

    this.componentUsage.forEach((usage, component) => {
      if (usage.trend === 'increasing' && usage.percentage > 10) {
        affected.push(component);
      }
    });

    return affected;
  }

  /**
   * Generate leak recommendation
   */
  private generateLeakRecommendation(
    severity: MemoryLeakAnalysis['severity'],
    growthRate: number,
    affectedComponents: string[]
  ): string {
    if (severity === 'none') {
      return 'No memory leaks detected. Memory usage appears stable.';
    }

    const growthRateMB = (growthRate / (1024 * 1024)).toFixed(2);
    let recommendation = `Memory leak detected (${severity} severity, growing at ${growthRateMB} MB/s). `;

    switch (severity) {
      case 'severe':
        recommendation +=
          'Immediate action required. Stop all non-essential operations and investigate.';
        break;
      case 'moderate':
        recommendation +=
          'Action needed soon. Review recent operations and clean up resources.';
        break;
      case 'minor':
        recommendation +=
          'Monitor closely and consider cleanup of caches and unused objects.';
        break;
    }

    if (affectedComponents.length > 0) {
      recommendation += ` Affected components: ${affectedComponents.join(', ')}.`;
    }

    return recommendation;
  }

  /**
   * Calculate memory efficiency score
   */
  private calculateMemoryEfficiency(): number {
    if (this.snapshots.length === 0) return 10;

    const recent = this.snapshots.slice(-10);
    const avgUsage =
      recent.reduce((sum, s) => sum + s.usedJSHeapSize, 0) / recent.length;
    const avgLimit =
      recent.reduce((sum, s) => sum + s.jsHeapSizeLimit, 0) / recent.length;

    const efficiency = 1 - avgUsage / avgLimit;
    return Math.max(1, Math.min(10, efficiency * 10));
  }

  /**
   * Calculate garbage collection frequency
   */
  private calculateGCFrequency(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentGCs = this.gcEvents.filter(gc => gc.getTime() > oneMinuteAgo);
    return recentGCs.length;
  }

  /**
   * Calculate memory fragmentation percentage
   */
  private calculateMemoryFragmentation(): number {
    if (this.snapshots.length === 0) return 0;

    const latest = this.snapshots[this.snapshots.length - 1];
    const fragmentation =
      ((latest.totalJSHeapSize - latest.usedJSHeapSize) /
        latest.totalJSHeapSize) *
      100;

    return Math.max(0, Math.min(100, fragmentation));
  }

  /**
   * Estimate cache hit rate (placeholder implementation)
   */
  private estimateCacheHitRate(): number {
    // This would need to be implemented based on actual cache metrics
    // For now, return a placeholder value
    return 80; // 80% hit rate
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const efficiency = this.calculateMemoryEfficiency();
    const fragmentation = this.calculateMemoryFragmentation();
    const gcFrequency = this.calculateGCFrequency();

    if (efficiency < 5) {
      recommendations.push(
        'Memory efficiency is low. Consider reducing memory usage or increasing heap size.'
      );
    }

    if (fragmentation > 30) {
      recommendations.push(
        'High memory fragmentation detected. Consider forcing garbage collection.'
      );
    }

    if (gcFrequency > 10) {
      recommendations.push(
        'Frequent garbage collection detected. Review object creation patterns.'
      );
    }

    if (gcFrequency < 1) {
      recommendations.push(
        'Infrequent garbage collection. Memory might not be released efficiently.'
      );
    }

    // Component-specific recommendations
    const heavyComponents = Array.from(this.componentUsage.values())
      .filter(c => c.percentage > 20)
      .map(c => c.component);

    if (heavyComponents.length > 0) {
      recommendations.push(
        `High memory usage components: ${heavyComponents.join(', ')}. Consider optimization.`
      );
    }

    return recommendations;
  }

  /**
   * Set up garbage collection monitoring
   */
  private setupGCMonitoring(): void {
    try {
      if ('PerformanceObserver' in window) {
        this.gcObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            if (entry.entryType === 'measure' && entry.name.includes('gc')) {
              this.gcEvents.push(new Date());

              // Keep only recent GC events (last hour)
              const oneHourAgo = Date.now() - 3600000;
              this.gcEvents = this.gcEvents.filter(
                gc => gc.getTime() > oneHourAgo
              );
            }
          });
        });

        this.gcObserver.observe({ entryTypes: ['measure'] });
      }
    } catch (error) {
      console.warn('Failed to set up GC monitoring:', error);
    }
  }

  /**
   * Trigger memory cleanup when critical pressure is detected
   */
  private triggerMemoryCleanup(): void {
    console.log('Triggering memory cleanup due to critical pressure');

    // Clear old snapshots
    if (this.snapshots.length > 100) {
      this.snapshots = this.snapshots.slice(-100);
    }

    // Clear old GC events
    const oneHourAgo = Date.now() - 3600000;
    this.gcEvents = this.gcEvents.filter(gc => gc.getTime() > oneHourAgo);

    // Force garbage collection if available
    this.forceGarbageCollection();

    // Notify about cleanup
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime
        .sendMessage({
          type: 'MEMORY_CLEANUP_TRIGGERED',
          timestamp: new Date(),
          reason: 'critical_pressure',
        })
        .catch(() => {
          // Ignore errors if no listeners
        });
    }
  }
}

// Global memory monitor instance
let memoryMonitorInstance: MemoryMonitor | null = null;

/**
 * Get the global memory monitor instance
 */
export function getMemoryMonitor(): MemoryMonitor {
  if (!memoryMonitorInstance) {
    memoryMonitorInstance = new MemoryMonitor();
  }
  return memoryMonitorInstance;
}

/**
 * Reset the memory monitor instance
 */
export function resetMemoryMonitor(): void {
  if (memoryMonitorInstance) {
    memoryMonitorInstance.stopMonitoring();
    memoryMonitorInstance.clearData();
    memoryMonitorInstance = null;
  }
}

// Extend Window interface for garbage collection
declare global {
  interface Window {
    gc?: () => void;
  }
}
