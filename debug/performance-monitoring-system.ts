/**
 * Performance Monitoring System
 *
 * This module provides comprehensive performance monitoring for the extension,
 * tracking page load times, AI processing performance, memory usage, and network requests.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

export interface PerformanceMetrics {
  timestamp: string;
  scenario: string;
  measurements: {
    pageLoad?: PageLoadMetrics;
    aiProcessing?: AIProcessingMetrics;
    memory?: MemoryMetrics;
    network?: NetworkMetrics;
  };
}

export interface PageLoadMetrics {
  extensionInstallTime: number;
  contentScriptInjectionTime: number;
  articleProcessingDuration: number;
  uiRenderingTime: number;
  totalLoadTime: number;
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
}

export interface AIProcessingMetrics {
  chromeAIResponseTime: number;
  offscreenProcessingDuration: number;
  batchProcessingPerformance: {
    totalItems: number;
    totalDuration: number;
    averageItemDuration: number;
  };
  bottlenecks: string[];
}

export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  storageQuotaUsage: {
    used: number;
    quota: number;
    percentUsed: number;
  };
  cacheMetrics: {
    size: number;
    hitRate: number;
    missRate: number;
  };
  potentialLeaks: string[];
}

export interface NetworkMetrics {
  totalRequests: number;
  failedRequests: number;
  slowRequests: Array<{
    url: string;
    duration: number;
    status: number;
  }>;
  totalNetworkOverhead: number;
  apiCalls: Array<{
    url: string;
    duration: number;
    success: boolean;
  }>;
}

export interface PerformanceReport {
  sessionId: string;
  timestamp: string;
  scenario: string;
  metrics: PerformanceMetrics;
  optimizationOpportunities: string[];
  recommendations: string[];
  baseline?: PerformanceMetrics;
  comparison?: {
    improvement: Record<string, number>;
    regression: Record<string, number>;
  };
}

/**
 * Performance Monitor Class
 *
 * Tracks and analyzes performance metrics across extension workflows
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics>;
  private baselines: Map<string, PerformanceMetrics>;
  private sessionId: string;

  constructor(sessionId?: string) {
    this.metrics = new Map();
    this.baselines = new Map();
    this.sessionId = sessionId || this.generateSessionId();
  }

  private generateSessionId(): string {
    const now = new Date();
    return `perf-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  }

  /**
   * Record page load metrics
   */
  recordPageLoadMetrics(scenario: string, metrics: PageLoadMetrics): void {
    const existing = this.metrics.get(scenario) || {
      timestamp: new Date().toISOString(),
      scenario,
      measurements: {},
    };

    existing.measurements.pageLoad = metrics;
    this.metrics.set(scenario, existing);
  }

  /**
   * Record AI processing metrics
   */
  recordAIProcessingMetrics(
    scenario: string,
    metrics: AIProcessingMetrics
  ): void {
    const existing = this.metrics.get(scenario) || {
      timestamp: new Date().toISOString(),
      scenario,
      measurements: {},
    };

    existing.measurements.aiProcessing = metrics;
    this.metrics.set(scenario, existing);
  }

  /**
   * Record memory metrics
   */
  recordMemoryMetrics(scenario: string, metrics: MemoryMetrics): void {
    const existing = this.metrics.get(scenario) || {
      timestamp: new Date().toISOString(),
      scenario,
      measurements: {},
    };

    existing.measurements.memory = metrics;
    this.metrics.set(scenario, existing);
  }

  /**
   * Record network metrics
   */
  recordNetworkMetrics(scenario: string, metrics: NetworkMetrics): void {
    const existing = this.metrics.get(scenario) || {
      timestamp: new Date().toISOString(),
      scenario,
      measurements: {},
    };

    existing.measurements.network = metrics;
    this.metrics.set(scenario, existing);
  }

  /**
   * Set baseline metrics for comparison
   */
  setBaseline(scenario: string, metrics: PerformanceMetrics): void {
    this.baselines.set(scenario, metrics);
  }

  /**
   * Get metrics for a scenario
   */
  getMetrics(scenario: string): PerformanceMetrics | undefined {
    return this.metrics.get(scenario);
  }

  /**
   * Generate performance report
   */
  generateReport(scenario: string): PerformanceReport {
    const metrics = this.metrics.get(scenario);
    if (!metrics) {
      throw new Error(`No metrics found for scenario: ${scenario}`);
    }

    const baseline = this.baselines.get(scenario);
    const optimizationOpportunities =
      this.identifyOptimizationOpportunities(metrics);
    const recommendations = this.generateRecommendations(metrics);
    const comparison = baseline
      ? this.compareMetrics(metrics, baseline)
      : undefined;

    return {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      scenario,
      metrics,
      optimizationOpportunities,
      recommendations,
      baseline,
      comparison,
    };
  }

  /**
   * Identify optimization opportunities
   */
  private identifyOptimizationOpportunities(
    metrics: PerformanceMetrics
  ): string[] {
    const opportunities: string[] = [];

    // Check page load performance
    if (metrics.measurements.pageLoad) {
      const pageLoad = metrics.measurements.pageLoad;
      if (pageLoad.contentScriptInjectionTime > 1000) {
        opportunities.push(
          'Content script injection is slow (>1s). Consider lazy loading or code splitting.'
        );
      }
      if (pageLoad.articleProcessingDuration > 5000) {
        opportunities.push(
          'Article processing is slow (>5s). Consider batch processing or caching.'
        );
      }
      if (pageLoad.uiRenderingTime > 2000) {
        opportunities.push(
          'UI rendering is slow (>2s). Consider virtual scrolling or progressive rendering.'
        );
      }
    }

    // Check AI processing performance
    if (metrics.measurements.aiProcessing) {
      const ai = metrics.measurements.aiProcessing;
      if (ai.chromeAIResponseTime > 3000) {
        opportunities.push(
          'Chrome AI API response is slow (>3s). Consider implementing request caching.'
        );
      }
      if (ai.batchProcessingPerformance.averageItemDuration > 500) {
        opportunities.push(
          'Batch processing is slow (>500ms per item). Consider parallel processing.'
        );
      }
      if (ai.bottlenecks.length > 0) {
        opportunities.push(
          `Processing bottlenecks detected: ${ai.bottlenecks.join(', ')}`
        );
      }
    }

    // Check memory usage
    if (metrics.measurements.memory) {
      const memory = metrics.measurements.memory;
      const heapUsagePercent =
        (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (heapUsagePercent > 80) {
        opportunities.push(
          `High memory usage (${heapUsagePercent.toFixed(1)}%). Consider memory optimization.`
        );
      }
      if (memory.storageQuotaUsage.percentUsed > 80) {
        opportunities.push(
          `Storage quota nearly full (${memory.storageQuotaUsage.percentUsed.toFixed(1)}%). Implement cleanup strategy.`
        );
      }
      if (memory.cacheMetrics.hitRate < 0.5) {
        opportunities.push(
          `Low cache hit rate (${(memory.cacheMetrics.hitRate * 100).toFixed(1)}%). Review caching strategy.`
        );
      }
      if (memory.potentialLeaks.length > 0) {
        opportunities.push(
          `Potential memory leaks detected: ${memory.potentialLeaks.join(', ')}`
        );
      }
    }

    // Check network performance
    if (metrics.measurements.network) {
      const network = metrics.measurements.network;
      if (network.failedRequests > 0) {
        opportunities.push(
          `${network.failedRequests} failed network requests. Implement retry logic.`
        );
      }
      if (network.slowRequests.length > 0) {
        opportunities.push(
          `${network.slowRequests.length} slow network requests detected. Consider request optimization.`
        );
      }
      if (network.totalNetworkOverhead > 10000) {
        opportunities.push(
          'High network overhead. Consider request batching or caching.'
        );
      }
    }

    return opportunities;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    // Page load recommendations
    if (metrics.measurements.pageLoad) {
      const pageLoad = metrics.measurements.pageLoad;
      if (pageLoad.totalLoadTime > 10000) {
        recommendations.push(
          'Implement progressive loading to improve perceived performance'
        );
        recommendations.push(
          'Consider code splitting to reduce initial bundle size'
        );
      }
    }

    // AI processing recommendations
    if (metrics.measurements.aiProcessing) {
      const ai = metrics.measurements.aiProcessing;
      if (ai.chromeAIResponseTime > 3000) {
        recommendations.push(
          'Implement result caching for frequently processed content'
        );
        recommendations.push(
          'Consider using streaming responses for better UX'
        );
      }
      if (ai.offscreenProcessingDuration > 5000) {
        recommendations.push(
          'Optimize offscreen document processing with Web Workers'
        );
      }
    }

    // Memory recommendations
    if (metrics.measurements.memory) {
      const memory = metrics.measurements.memory;
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
        recommendations.push('Implement memory cleanup routines');
        recommendations.push(
          'Review object retention and remove unnecessary references'
        );
      }
      if (memory.storageQuotaUsage.percentUsed > 80) {
        recommendations.push('Implement LRU cache eviction strategy');
        recommendations.push('Add storage quota monitoring and cleanup');
      }
    }

    // Network recommendations
    if (metrics.measurements.network) {
      const network = metrics.measurements.network;
      if (network.failedRequests > 0) {
        recommendations.push('Implement exponential backoff retry strategy');
        recommendations.push('Add offline fallback mechanisms');
      }
      if (network.slowRequests.length > 3) {
        recommendations.push('Implement request timeout and cancellation');
        recommendations.push(
          'Consider using service worker for request caching'
        );
      }
    }

    return recommendations;
  }

  /**
   * Compare metrics against baseline
   */
  private compareMetrics(
    current: PerformanceMetrics,
    baseline: PerformanceMetrics
  ): {
    improvement: Record<string, number>;
    regression: Record<string, number>;
  } {
    const improvement: Record<string, number> = {};
    const regression: Record<string, number> = {};

    // Compare page load metrics
    if (current.measurements.pageLoad && baseline.measurements.pageLoad) {
      const currentLoad = current.measurements.pageLoad.totalLoadTime;
      const baselineLoad = baseline.measurements.pageLoad.totalLoadTime;
      const diff = ((currentLoad - baselineLoad) / baselineLoad) * 100;

      if (diff < 0) {
        improvement['pageLoadTime'] = Math.abs(diff);
      } else if (diff > 0) {
        regression['pageLoadTime'] = diff;
      }
    }

    // Compare AI processing metrics
    if (
      current.measurements.aiProcessing &&
      baseline.measurements.aiProcessing
    ) {
      const currentAI = current.measurements.aiProcessing.chromeAIResponseTime;
      const baselineAI =
        baseline.measurements.aiProcessing.chromeAIResponseTime;
      const diff = ((currentAI - baselineAI) / baselineAI) * 100;

      if (diff < 0) {
        improvement['aiResponseTime'] = Math.abs(diff);
      } else if (diff > 0) {
        regression['aiResponseTime'] = diff;
      }
    }

    // Compare memory metrics
    if (current.measurements.memory && baseline.measurements.memory) {
      const currentMem = current.measurements.memory.usedJSHeapSize;
      const baselineMem = baseline.measurements.memory.usedJSHeapSize;
      const diff = ((currentMem - baselineMem) / baselineMem) * 100;

      if (diff < 0) {
        improvement['memoryUsage'] = Math.abs(diff);
      } else if (diff > 0) {
        regression['memoryUsage'] = diff;
      }
    }

    return { improvement, regression };
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    const data = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      metrics: Array.from(this.metrics.entries()).map(
        ([_scenario, metrics]) => ({
          ...metrics,
        })
      ),
      baselines: Array.from(this.baselines.entries()).map(
        ([_scenario, metrics]) => ({
          ...metrics,
        })
      ),
    };

    return JSON.stringify(data, null, 2);
  }
}
