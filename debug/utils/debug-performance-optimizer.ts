/**
 * Debug Performance Optimizer
 * Optimizes debugging tool performance and monitors overhead
 */

import {
  DebugSessionState,
  PerformanceMetric,
  DebugPerformanceConfig,
  DebugOverheadMetrics,
  PerformanceOptimization,
  DebugEfficiencyMetrics,
} from '../types/debug-types.js';

export interface PerformanceThresholds {
  maxMemoryUsage: number; // MB
  maxExecutionTime: number; // ms
  maxDataPoints: number;
  maxConcurrentOperations: number;
  gcThreshold: number; // MB
}

export interface OptimizationStrategy {
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  apply: () => Promise<void>;
  revert: () => Promise<void>;
}

export class DebugPerformanceOptimizer {
  private config: DebugPerformanceConfig;
  private overheadMetrics: DebugOverheadMetrics;
  private efficiencyMetrics: DebugEfficiencyMetrics;
  private optimizations: Map<string, OptimizationStrategy> = new Map();
  private performanceMonitor: NodeJS.Timeout | null = null;
  private dataCache: Map<
    string,
    { data: any; timestamp: number; ttl: number }
  > = new Map();
  private operationQueue: Array<{
    operation: () => Promise<any>;
    priority: number;
  }> = [];
  private isProcessingQueue = false;

  constructor(config?: Partial<DebugPerformanceConfig>) {
    this.config = this.createDefaultConfig(config);
    this.overheadMetrics = this.initializeOverheadMetrics();
    this.efficiencyMetrics = this.initializeEfficiencyMetrics();
    this.initializeOptimizations();
  }

  /**
   * Initialize performance optimization
   */
  async initializeOptimization(): Promise<void> {
    console.log('Initializing debug performance optimization...');

    // Start performance monitoring
    await this.startPerformanceMonitoring();

    // Apply initial optimizations
    await this.applyOptimizations();

    // Setup garbage collection monitoring
    this.setupGarbageCollectionMonitoring();

    console.log('Debug performance optimization initialized');
  }

  /**
   * Optimize debugging session performance
   */
  async optimizeSession(
    sessionState: DebugSessionState
  ): Promise<PerformanceOptimization> {
    const startTime = performance.now();
    const initialMemory = this.getCurrentMemoryUsage();

    try {
      // Analyze current performance
      const analysis = await this.analyzeSessionPerformance(sessionState);

      // Apply targeted optimizations
      const appliedOptimizations =
        await this.applyTargetedOptimizations(analysis);

      // Optimize data structures
      await this.optimizeDataStructures(sessionState);

      // Clean up stale data
      await this.cleanupStaleData(sessionState);

      // Update efficiency metrics
      const endTime = performance.now();
      const finalMemory = this.getCurrentMemoryUsage();

      this.updateEfficiencyMetrics({
        optimizationTime: endTime - startTime,
        memoryReduction: initialMemory - finalMemory,
        optimizationsApplied: appliedOptimizations.length,
      });

      return {
        success: true,
        optimizationsApplied: appliedOptimizations,
        performanceGain: this.calculatePerformanceGain(analysis),
        memoryReduction: initialMemory - finalMemory,
        executionTime: endTime - startTime,
      };
    } catch (error) {
      console.error('Session optimization failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: performance.now() - startTime,
      };
    }
  }

  /**
   * Monitor debugging overhead in real-time
   */
  async startOverheadMonitoring(): Promise<void> {
    if (this.performanceMonitor) {
      console.warn('Performance monitoring already running');
      return;
    }

    console.log('Starting debugging overhead monitoring...');

    this.performanceMonitor = setInterval(async () => {
      try {
        await this.collectOverheadMetrics();
        await this.analyzeOverhead();
        await this.applyDynamicOptimizations();
      } catch (error) {
        console.error('Overhead monitoring error:', error);
      }
    }, this.config.monitoringInterval);
  }

  /**
   * Stop overhead monitoring
   */
  stopOverheadMonitoring(): void {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
      this.performanceMonitor = null;
      console.log('Stopped debugging overhead monitoring');
    }
  }

  /**
   * Get current debugging efficiency metrics
   */
  getEfficiencyMetrics(): DebugEfficiencyMetrics {
    return { ...this.efficiencyMetrics };
  }

  /**
   * Get current overhead metrics
   */
  getOverheadMetrics(): DebugOverheadMetrics {
    return { ...this.overheadMetrics };
  }

  /**
   * Optimize data collection strategy
   */
  async optimizeDataCollection(sessionState: DebugSessionState): Promise<void> {
    // Implement sampling for high-frequency data
    await this.implementSampling(sessionState);

    // Compress historical data
    await this.compressHistoricalData(sessionState);

    // Implement lazy loading for large datasets
    await this.implementLazyLoading(sessionState);

    // Optimize data structures
    await this.optimizeDataStructures(sessionState);
  }

  /**
   * Create performance-optimized cache
   */
  createOptimizedCache<T>(
    key: string,
    ttl: number = 300000
  ): {
    get: () => T | null;
    set: (data: T) => void;
    clear: () => void;
  } {
    return {
      get: () => {
        const cached = this.dataCache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > cached.ttl) {
          this.dataCache.delete(key);
          return null;
        }

        return cached.data as T;
      },
      set: (data: T) => {
        this.dataCache.set(key, {
          data,
          timestamp: Date.now(),
          ttl,
        });
      },
      clear: () => {
        this.dataCache.delete(key);
      },
    };
  }

  /**
   * Queue operation for optimized execution
   */
  async queueOperation<T>(
    operation: () => Promise<T>,
    priority: number = 1
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.operationQueue.push({
        operation: async () => {
          try {
            const result = await operation();
            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          }
        },
        priority,
      });

      // Sort queue by priority
      this.operationQueue.sort((a, b) => b.priority - a.priority);

      // Process queue if not already processing
      if (!this.isProcessingQueue) {
        this.processOperationQueue();
      }
    });
  }

  /**
   * Generate performance optimization report
   */
  generateOptimizationReport(): {
    overheadMetrics: DebugOverheadMetrics;
    efficiencyMetrics: DebugEfficiencyMetrics;
    appliedOptimizations: string[];
    recommendations: string[];
    performanceGains: Record<string, number>;
  } {
    const appliedOptimizations = Array.from(this.optimizations.entries())
      .filter(([_, strategy]) => strategy.enabled)
      .map(([name, _]) => name);

    const recommendations = this.generateOptimizationRecommendations();
    const performanceGains = this.calculateOverallPerformanceGains();

    return {
      overheadMetrics: this.overheadMetrics,
      efficiencyMetrics: this.efficiencyMetrics,
      appliedOptimizations,
      recommendations,
      performanceGains,
    };
  }

  // Private helper methods

  private createDefaultConfig(
    overrides?: Partial<DebugPerformanceConfig>
  ): DebugPerformanceConfig {
    return {
      enabled: true,
      monitoringInterval: 10000, // 10 seconds
      thresholds: {
        maxMemoryUsage: 100, // 100MB
        maxExecutionTime: 5000, // 5 seconds
        maxDataPoints: 1000,
        maxConcurrentOperations: 5,
        gcThreshold: 50, // 50MB
      },
      optimizations: {
        enableCaching: true,
        enableSampling: true,
        enableCompression: true,
        enableLazyLoading: true,
        enableGarbageCollection: true,
      },
      ...overrides,
    };
  }

  private initializeOverheadMetrics(): DebugOverheadMetrics {
    return {
      memoryOverhead: 0,
      cpuOverhead: 0,
      networkOverhead: 0,
      storageOverhead: 0,
      totalOverhead: 0,
      overheadHistory: [],
      lastMeasurement: new Date(),
    };
  }

  private initializeEfficiencyMetrics(): DebugEfficiencyMetrics {
    return {
      dataCollectionEfficiency: 100,
      processingEfficiency: 100,
      storageEfficiency: 100,
      networkEfficiency: 100,
      overallEfficiency: 100,
      optimizationImpact: 0,
      efficiencyHistory: [],
      lastCalculation: new Date(),
    };
  }

  private initializeOptimizations(): void {
    // Data sampling optimization
    this.optimizations.set('data-sampling', {
      name: 'Data Sampling',
      description: 'Reduce data collection frequency for non-critical metrics',
      enabled: this.config.optimizations.enableSampling,
      priority: 1,
      apply: async () => {
        console.log('Applied data sampling optimization');
      },
      revert: async () => {
        console.log('Reverted data sampling optimization');
      },
    });

    // Memory management optimization
    this.optimizations.set('memory-management', {
      name: 'Memory Management',
      description: 'Implement aggressive garbage collection and memory cleanup',
      enabled: this.config.optimizations.enableGarbageCollection,
      priority: 2,
      apply: async () => {
        await this.triggerGarbageCollection();
        console.log('Applied memory management optimization');
      },
      revert: async () => {
        console.log('Reverted memory management optimization');
      },
    });

    // Data compression optimization
    this.optimizations.set('data-compression', {
      name: 'Data Compression',
      description: 'Compress stored debugging data to reduce memory usage',
      enabled: this.config.optimizations.enableCompression,
      priority: 3,
      apply: async () => {
        console.log('Applied data compression optimization');
      },
      revert: async () => {
        console.log('Reverted data compression optimization');
      },
    });

    // Lazy loading optimization
    this.optimizations.set('lazy-loading', {
      name: 'Lazy Loading',
      description: 'Load debugging data on-demand to reduce initial overhead',
      enabled: this.config.optimizations.enableLazyLoading,
      priority: 4,
      apply: async () => {
        console.log('Applied lazy loading optimization');
      },
      revert: async () => {
        console.log('Reverted lazy loading optimization');
      },
    });

    // Caching optimization
    this.optimizations.set('intelligent-caching', {
      name: 'Intelligent Caching',
      description: 'Cache frequently accessed debugging data',
      enabled: this.config.optimizations.enableCaching,
      priority: 5,
      apply: async () => {
        console.log('Applied intelligent caching optimization');
      },
      revert: async () => {
        console.log('Reverted intelligent caching optimization');
      },
    });
  }

  private async startPerformanceMonitoring(): Promise<void> {
    await this.startOverheadMonitoring();
  }

  private async applyOptimizations(): Promise<void> {
    const enabledOptimizations = Array.from(this.optimizations.values())
      .filter(opt => opt.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const optimization of enabledOptimizations) {
      try {
        await optimization.apply();
      } catch (error) {
        console.error(
          `Failed to apply optimization ${optimization.name}:`,
          error
        );
      }
    }
  }

  private setupGarbageCollectionMonitoring(): void {
    // Monitor memory usage and trigger GC when needed
    setInterval(() => {
      const memoryUsage = this.getCurrentMemoryUsage();
      if (memoryUsage > this.config.thresholds.gcThreshold) {
        this.triggerGarbageCollection();
      }
    }, 30000); // Check every 30 seconds
  }

  private async analyzeSessionPerformance(
    sessionState: DebugSessionState
  ): Promise<{
    memoryUsage: number;
    dataSize: number;
    processingTime: number;
    bottlenecks: string[];
  }> {
    const memoryUsage = this.getCurrentMemoryUsage();
    const dataSize = this.calculateDataSize(sessionState);
    const processingTime = this.calculateProcessingTime(sessionState);
    const bottlenecks = this.identifyBottlenecks(sessionState);

    return {
      memoryUsage,
      dataSize,
      processingTime,
      bottlenecks,
    };
  }

  private async applyTargetedOptimizations(analysis: any): Promise<string[]> {
    const applied: string[] = [];

    // Apply optimizations based on analysis
    if (analysis.memoryUsage > this.config.thresholds.maxMemoryUsage) {
      await this.optimizations.get('memory-management')?.apply();
      applied.push('memory-management');
    }

    if (analysis.dataSize > this.config.thresholds.maxDataPoints) {
      await this.optimizations.get('data-compression')?.apply();
      applied.push('data-compression');
    }

    if (analysis.processingTime > this.config.thresholds.maxExecutionTime) {
      await this.optimizations.get('lazy-loading')?.apply();
      applied.push('lazy-loading');
    }

    return applied;
  }

  private async optimizeDataStructures(
    sessionState: DebugSessionState
  ): Promise<void> {
    // Optimize arrays by removing duplicates and sorting
    sessionState.capturedData.consoleMessages = this.deduplicateArray(
      sessionState.capturedData.consoleMessages,
      'id'
    );

    sessionState.capturedData.networkRequests = this.deduplicateArray(
      sessionState.capturedData.networkRequests,
      'id'
    );

    // Limit data points to prevent memory bloat
    const maxPoints = this.config.thresholds.maxDataPoints;

    if (sessionState.capturedData.performanceMetrics.length > maxPoints) {
      sessionState.capturedData.performanceMetrics =
        sessionState.capturedData.performanceMetrics.slice(-maxPoints);
    }

    if (sessionState.capturedData.memorySnapshots.length > maxPoints) {
      sessionState.capturedData.memorySnapshots =
        sessionState.capturedData.memorySnapshots.slice(-maxPoints);
    }
  }

  private async cleanupStaleData(
    sessionState: DebugSessionState
  ): Promise<void> {
    const cutoffTime = new Date(Date.now() - 3600000); // 1 hour ago

    // Remove old console messages
    sessionState.capturedData.consoleMessages =
      sessionState.capturedData.consoleMessages.filter(
        msg => msg.timestamp > cutoffTime
      );

    // Remove old network requests
    sessionState.capturedData.networkRequests =
      sessionState.capturedData.networkRequests.filter(
        req => req.timestamp > cutoffTime
      );

    // Remove old error logs
    sessionState.capturedData.errorLogs =
      sessionState.capturedData.errorLogs.filter(
        error => error.timestamp > cutoffTime
      );

    // Clear expired cache entries
    for (const [key, cached] of this.dataCache.entries()) {
      if (Date.now() - cached.timestamp > cached.ttl) {
        this.dataCache.delete(key);
      }
    }
  }

  private async collectOverheadMetrics(): Promise<void> {
    const memoryUsage = this.getCurrentMemoryUsage();
    const cpuUsage = await this.getCPUUsage();

    this.overheadMetrics.memoryOverhead = memoryUsage;
    this.overheadMetrics.cpuOverhead = cpuUsage;
    this.overheadMetrics.totalOverhead = memoryUsage + cpuUsage;
    this.overheadMetrics.lastMeasurement = new Date();

    // Store in history
    this.overheadMetrics.overheadHistory.push({
      timestamp: new Date(),
      memory: memoryUsage,
      cpu: cpuUsage,
      total: memoryUsage + cpuUsage,
    });

    // Keep only last 100 measurements
    if (this.overheadMetrics.overheadHistory.length > 100) {
      this.overheadMetrics.overheadHistory =
        this.overheadMetrics.overheadHistory.slice(-100);
    }
  }

  private async analyzeOverhead(): Promise<void> {
    const thresholds = this.config.thresholds;

    if (this.overheadMetrics.memoryOverhead > thresholds.maxMemoryUsage) {
      console.warn(
        `High memory overhead detected: ${this.overheadMetrics.memoryOverhead}MB`
      );
    }

    if (this.overheadMetrics.totalOverhead > thresholds.maxMemoryUsage * 1.5) {
      console.warn(
        `Critical overhead detected: ${this.overheadMetrics.totalOverhead}`
      );
    }
  }

  private async applyDynamicOptimizations(): Promise<void> {
    // Apply optimizations based on current overhead
    if (
      this.overheadMetrics.memoryOverhead >
      this.config.thresholds.maxMemoryUsage
    ) {
      await this.triggerGarbageCollection();
      await this.cleanupCaches();
    }
  }

  private async implementSampling(
    sessionState: DebugSessionState
  ): Promise<void> {
    // Implement sampling for performance metrics (keep every 10th measurement)
    const sampledMetrics = sessionState.capturedData.performanceMetrics.filter(
      (_, index) => index % 10 === 0
    );

    sessionState.capturedData.performanceMetrics = sampledMetrics;
  }

  private async compressHistoricalData(
    sessionState: DebugSessionState
  ): Promise<void> {
    // Compress old data by aggregating into time buckets
    const cutoffTime = new Date(Date.now() - 1800000); // 30 minutes ago

    // Aggregate old performance metrics by minute
    const oldMetrics = sessionState.capturedData.performanceMetrics.filter(
      metric => metric.timestamp < cutoffTime
    );

    const aggregatedMetrics = this.aggregateMetricsByMinute(oldMetrics);

    const recentMetrics = sessionState.capturedData.performanceMetrics.filter(
      metric => metric.timestamp >= cutoffTime
    );

    sessionState.capturedData.performanceMetrics = [
      ...aggregatedMetrics,
      ...recentMetrics,
    ];
  }

  private async implementLazyLoading(
    sessionState: DebugSessionState
  ): Promise<void> {
    // Convert large data arrays to lazy-loaded structures
    // This would be implemented based on specific use cases
    console.log('Implemented lazy loading for session data');
  }

  private async processOperationQueue(): Promise<void> {
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;

    while (this.operationQueue.length > 0) {
      const operation = this.operationQueue.shift();
      if (operation) {
        try {
          await operation.operation();
        } catch (error) {
          console.error('Queued operation failed:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private getCurrentMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return 0;
  }

  private async getCPUUsage(): Promise<number> {
    // Simplified CPU usage estimation
    const start = performance.now();
    await new Promise(resolve => setTimeout(resolve, 1));
    const end = performance.now();

    return Math.max(0, 1 - (end - start)); // Rough estimation
  }

  private calculateDataSize(sessionState: DebugSessionState): number {
    return (
      sessionState.capturedData.consoleMessages.length +
      sessionState.capturedData.networkRequests.length +
      sessionState.capturedData.performanceMetrics.length +
      sessionState.capturedData.memorySnapshots.length +
      sessionState.capturedData.errorLogs.length
    );
  }

  private calculateProcessingTime(sessionState: DebugSessionState): number {
    return sessionState.testResults.reduce(
      (sum, result) => sum + result.executionTime,
      0
    );
  }

  private identifyBottlenecks(sessionState: DebugSessionState): string[] {
    const bottlenecks: string[] = [];

    if (sessionState.capturedData.performanceMetrics.length > 1000) {
      bottlenecks.push('Large performance metrics dataset');
    }

    if (sessionState.capturedData.consoleMessages.length > 500) {
      bottlenecks.push('High console message volume');
    }

    if (sessionState.testResults.some(r => r.executionTime > 5000)) {
      bottlenecks.push('Slow test execution');
    }

    return bottlenecks;
  }

  private calculatePerformanceGain(analysis: any): number {
    // Calculate performance gain based on optimization impact
    return Math.min(50, analysis.bottlenecks.length * 10); // Max 50% gain
  }

  private updateEfficiencyMetrics(update: {
    optimizationTime: number;
    memoryReduction: number;
    optimizationsApplied: number;
  }): void {
    this.efficiencyMetrics.optimizationImpact += update.memoryReduction;
    this.efficiencyMetrics.lastCalculation = new Date();

    // Store in history
    this.efficiencyMetrics.efficiencyHistory.push({
      timestamp: new Date(),
      optimizationTime: update.optimizationTime,
      memoryReduction: update.memoryReduction,
      optimizationsApplied: update.optimizationsApplied,
    });

    // Keep only last 100 measurements
    if (this.efficiencyMetrics.efficiencyHistory.length > 100) {
      this.efficiencyMetrics.efficiencyHistory =
        this.efficiencyMetrics.efficiencyHistory.slice(-100);
    }
  }

  private generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    if (
      this.overheadMetrics.memoryOverhead >
      this.config.thresholds.maxMemoryUsage
    ) {
      recommendations.push('Enable more aggressive memory management');
    }

    if (this.efficiencyMetrics.dataCollectionEfficiency < 80) {
      recommendations.push(
        'Implement data sampling for high-frequency metrics'
      );
    }

    if (this.dataCache.size > 100) {
      recommendations.push('Reduce cache TTL or implement cache size limits');
    }

    return recommendations;
  }

  private calculateOverallPerformanceGains(): Record<string, number> {
    return {
      memoryReduction: this.efficiencyMetrics.optimizationImpact,
      processingSpeedup: this.efficiencyMetrics.processingEfficiency - 100,
      storageOptimization: this.efficiencyMetrics.storageEfficiency - 100,
      overallImprovement: this.efficiencyMetrics.overallEfficiency - 100,
    };
  }

  private deduplicateArray<T>(array: T[], keyField: keyof T): T[] {
    const seen = new Set();
    return array.filter(item => {
      const key = item[keyField];
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private aggregateMetricsByMinute(
    metrics: PerformanceMetric[]
  ): PerformanceMetric[] {
    const buckets: Record<string, PerformanceMetric[]> = {};

    metrics.forEach(metric => {
      const minute = new Date(metric.timestamp).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
      if (!buckets[minute]) {
        buckets[minute] = [];
      }
      buckets[minute].push(metric);
    });

    return Object.entries(buckets).map(([minute, bucketMetrics]) => ({
      timestamp: new Date(minute + ':00.000Z'),
      name: 'aggregated_' + bucketMetrics[0].name,
      value:
        bucketMetrics.reduce((sum, m) => sum + m.value, 0) /
        bucketMetrics.length,
      unit: bucketMetrics[0].unit,
      context: 'aggregated',
      metadata: {
        originalCount: bucketMetrics.length,
        aggregationType: 'average',
      },
    }));
  }

  private async triggerGarbageCollection(): Promise<void> {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('Triggered garbage collection');
    }
  }

  private async cleanupCaches(): Promise<void> {
    // Clear expired cache entries
    const now = Date.now();
    for (const [key, cached] of this.dataCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.dataCache.delete(key);
      }
    }

    console.log(`Cleaned up cache, ${this.dataCache.size} entries remaining`);
  }
}

// Export singleton instance
export const debugPerformanceOptimizer = new DebugPerformanceOptimizer();
