/**
 * Debug Efficiency Monitor
 * Monitors and tracks debugging efficiency metrics
 */

import {
  DebugEfficiencyMetrics,
  DebugOverheadMetrics,
  PerformanceMetric,
  TestResult,
  DebugSessionState,
} from '../types/debug-types.js';

export interface EfficiencyBenchmark {
  name: string;
  baseline: number;
  current: number;
  target: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface EfficiencyReport {
  timestamp: Date;
  overallScore: number;
  benchmarks: EfficiencyBenchmark[];
  recommendations: string[];
  trends: {
    shortTerm: 'improving' | 'stable' | 'degrading';
    longTerm: 'improving' | 'stable' | 'degrading';
  };
}

export class DebugEfficiencyMonitor {
  private efficiencyMetrics: DebugEfficiencyMetrics;
  private benchmarks: Map<string, EfficiencyBenchmark> = new Map();
  private measurementHistory: Array<{
    timestamp: Date;
    metrics: DebugEfficiencyMetrics;
  }> = [];
  private baselineMetrics: DebugEfficiencyMetrics | null = null;

  constructor() {
    this.efficiencyMetrics = this.initializeEfficiencyMetrics();
    this.initializeBenchmarks();
  }

  /**
   * Initialize efficiency monitoring
   */
  async initializeMonitoring(): Promise<void> {
    console.log('Initializing debug efficiency monitoring...');

    // Establish baseline metrics
    await this.establishBaseline();

    // Start periodic efficiency measurement
    this.startPeriodicMeasurement();

    console.log('Debug efficiency monitoring initialized');
  }

  /**
   * Measure current debugging efficiency
   */
  async measureEfficiency(
    sessionState: DebugSessionState
  ): Promise<DebugEfficiencyMetrics> {
    const startTime = performance.now();

    try {
      // Measure data collection efficiency
      const dataCollectionEfficiency =
        await this.measureDataCollectionEfficiency(sessionState);

      // Measure processing efficiency
      const processingEfficiency =
        await this.measureProcessingEfficiency(sessionState);

      // Measure storage efficiency
      const storageEfficiency =
        await this.measureStorageEfficiency(sessionState);

      // Measure network efficiency
      const networkEfficiency =
        await this.measureNetworkEfficiency(sessionState);

      // Calculate overall efficiency
      const overallEfficiency = this.calculateOverallEfficiency({
        dataCollectionEfficiency,
        processingEfficiency,
        storageEfficiency,
        networkEfficiency,
      });

      // Update metrics
      this.efficiencyMetrics = {
        dataCollectionEfficiency,
        processingEfficiency,
        storageEfficiency,
        networkEfficiency,
        overallEfficiency,
        optimizationImpact: this.calculateOptimizationImpact(),
        efficiencyHistory: [...this.efficiencyMetrics.efficiencyHistory],
        lastCalculation: new Date(),
      };

      // Add to history
      this.addToHistory();

      // Update benchmarks
      this.updateBenchmarks();

      const measurementTime = performance.now() - startTime;
      console.log(
        `Efficiency measurement completed in ${measurementTime.toFixed(2)}ms`
      );

      return this.efficiencyMetrics;
    } catch (error) {
      console.error('Failed to measure efficiency:', error);
      throw error;
    }
  }

  /**
   * Get current efficiency metrics
   */
  getCurrentEfficiency(): DebugEfficiencyMetrics {
    return { ...this.efficiencyMetrics };
  }

  /**
   * Get efficiency benchmarks
   */
  getBenchmarks(): EfficiencyBenchmark[] {
    return Array.from(this.benchmarks.values());
  }

  /**
   * Generate efficiency report
   */
  generateEfficiencyReport(): EfficiencyReport {
    const overallScore = this.calculateOverallScore();
    const benchmarks = this.getBenchmarks();
    const recommendations = this.generateRecommendations();
    const trends = this.analyzeTrends();

    return {
      timestamp: new Date(),
      overallScore,
      benchmarks,
      recommendations,
      trends,
    };
  }

  /**
   * Track optimization impact
   */
  trackOptimizationImpact(
    optimizationName: string,
    beforeMetrics: DebugEfficiencyMetrics,
    afterMetrics: DebugEfficiencyMetrics
  ): {
    impact: number;
    improvements: Record<string, number>;
    degradations: Record<string, number>;
  } {
    const improvements: Record<string, number> = {};
    const degradations: Record<string, number> = {};

    // Compare each efficiency metric
    const metrics = [
      'dataCollectionEfficiency',
      'processingEfficiency',
      'storageEfficiency',
      'networkEfficiency',
      'overallEfficiency',
    ] as const;

    metrics.forEach(metric => {
      const before = beforeMetrics[metric];
      const after = afterMetrics[metric];
      const change = after - before;

      if (change > 0) {
        improvements[metric] = change;
      } else if (change < 0) {
        degradations[metric] = Math.abs(change);
      }
    });

    // Calculate overall impact
    const totalImprovements = Object.values(improvements).reduce(
      (sum, val) => sum + val,
      0
    );
    const totalDegradations = Object.values(degradations).reduce(
      (sum, val) => sum + val,
      0
    );
    const impact = totalImprovements - totalDegradations;

    console.log(
      `Optimization "${optimizationName}" impact: ${impact.toFixed(2)}`
    );

    return {
      impact,
      improvements,
      degradations,
    };
  }

  /**
   * Set efficiency targets
   */
  setEfficiencyTargets(targets: {
    dataCollection?: number;
    processing?: number;
    storage?: number;
    network?: number;
    overall?: number;
  }): void {
    if (targets.dataCollection) {
      this.updateBenchmarkTarget('dataCollection', targets.dataCollection);
    }
    if (targets.processing) {
      this.updateBenchmarkTarget('processing', targets.processing);
    }
    if (targets.storage) {
      this.updateBenchmarkTarget('storage', targets.storage);
    }
    if (targets.network) {
      this.updateBenchmarkTarget('network', targets.network);
    }
    if (targets.overall) {
      this.updateBenchmarkTarget('overall', targets.overall);
    }

    console.log('Updated efficiency targets');
  }

  /**
   * Get efficiency trends
   */
  getEfficiencyTrends(timeframe: 'hour' | 'day' | 'week' = 'hour'): {
    dataPoints: Array<{ timestamp: Date; efficiency: number }>;
    trend: 'improving' | 'stable' | 'degrading';
    changeRate: number;
  } {
    const cutoffTime = this.getCutoffTime(timeframe);
    const recentHistory = this.measurementHistory.filter(
      entry => entry.timestamp > cutoffTime
    );

    const dataPoints = recentHistory.map(entry => ({
      timestamp: entry.timestamp,
      efficiency: entry.metrics.overallEfficiency,
    }));

    const trend = this.calculateTrend(dataPoints);
    const changeRate = this.calculateChangeRate(dataPoints);

    return {
      dataPoints,
      trend,
      changeRate,
    };
  }

  /**
   * Export efficiency data
   */
  exportEfficiencyData(): {
    currentMetrics: DebugEfficiencyMetrics;
    benchmarks: EfficiencyBenchmark[];
    history: Array<{ timestamp: Date; metrics: DebugEfficiencyMetrics }>;
    report: EfficiencyReport;
  } {
    return {
      currentMetrics: this.efficiencyMetrics,
      benchmarks: this.getBenchmarks(),
      history: [...this.measurementHistory],
      report: this.generateEfficiencyReport(),
    };
  }

  // Private helper methods

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

  private initializeBenchmarks(): void {
    this.benchmarks.set('dataCollection', {
      name: 'Data Collection Efficiency',
      baseline: 100,
      current: 100,
      target: 95,
      trend: 'stable',
    });

    this.benchmarks.set('processing', {
      name: 'Processing Efficiency',
      baseline: 100,
      current: 100,
      target: 90,
      trend: 'stable',
    });

    this.benchmarks.set('storage', {
      name: 'Storage Efficiency',
      baseline: 100,
      current: 100,
      target: 85,
      trend: 'stable',
    });

    this.benchmarks.set('network', {
      name: 'Network Efficiency',
      baseline: 100,
      current: 100,
      target: 80,
      trend: 'stable',
    });

    this.benchmarks.set('overall', {
      name: 'Overall Efficiency',
      baseline: 100,
      current: 100,
      target: 85,
      trend: 'stable',
    });
  }

  private async establishBaseline(): Promise<void> {
    // Create a minimal session state for baseline measurement
    const baselineSession: DebugSessionState = {
      sessionId: 'baseline',
      startTime: new Date(),
      status: 'active',
      activeContexts: [],
      capturedData: {
        consoleMessages: [],
        networkRequests: [],
        performanceMetrics: [],
        errorLogs: [],
        storageOperations: [],
        memorySnapshots: [],
      },
      testResults: [],
      configuration: {
        timeout: 30000,
        maxRetries: 3,
        captureConsole: true,
        captureNetwork: true,
        capturePerformance: true,
        captureStorage: true,
        captureMemory: true,
        contexts: ['service-worker'],
      },
    };

    this.baselineMetrics = await this.measureEfficiency(baselineSession);
    console.log('Established baseline efficiency metrics');
  }

  private startPeriodicMeasurement(): void {
    // Measure efficiency every 5 minutes
    setInterval(() => {
      // This would be called with actual session state in real usage
      console.log('Periodic efficiency measurement (placeholder)');
    }, 300000);
  }

  private async measureDataCollectionEfficiency(
    sessionState: DebugSessionState
  ): Promise<number> {
    const totalDataPoints = this.getTotalDataPoints(sessionState);
    const expectedDataPoints = this.getExpectedDataPoints(sessionState);

    if (expectedDataPoints === 0) return 100;

    // Calculate efficiency based on data collection overhead
    const collectionOverhead = this.calculateCollectionOverhead(sessionState);
    const efficiency = Math.max(0, 100 - collectionOverhead);

    return Math.min(100, efficiency);
  }

  private async measureProcessingEfficiency(
    sessionState: DebugSessionState
  ): Promise<number> {
    const testResults = sessionState.testResults;
    if (testResults.length === 0) return 100;

    // Calculate processing efficiency based on execution times
    const totalExecutionTime = testResults.reduce(
      (sum, result) => sum + result.executionTime,
      0
    );
    const averageExecutionTime = totalExecutionTime / testResults.length;

    // Efficiency decreases as execution time increases
    const baselineExecutionTime = 1000; // 1 second baseline
    const efficiency = Math.max(
      0,
      100 -
        ((averageExecutionTime - baselineExecutionTime) /
          baselineExecutionTime) *
          100
    );

    return Math.min(100, efficiency);
  }

  private async measureStorageEfficiency(
    sessionState: DebugSessionState
  ): Promise<number> {
    const storageOperations = sessionState.capturedData.storageOperations;
    if (storageOperations.length === 0) return 100;

    // Calculate storage efficiency based on operation success rate and speed
    const successfulOperations = storageOperations.filter(
      op => op.success
    ).length;
    const successRate = successfulOperations / storageOperations.length;

    const averageDuration =
      storageOperations.reduce((sum, op) => sum + op.duration, 0) /
      storageOperations.length;
    const speedEfficiency = Math.max(0, 100 - averageDuration); // Assuming 1ms baseline

    return (successRate * 100 + speedEfficiency) / 2;
  }

  private async measureNetworkEfficiency(
    sessionState: DebugSessionState
  ): Promise<number> {
    const networkRequests = sessionState.capturedData.networkRequests;
    if (networkRequests.length === 0) return 100;

    // Calculate network efficiency based on response times and success rates
    const successfulRequests = networkRequests.filter(
      req => req.status >= 200 && req.status < 400
    ).length;
    const successRate = successfulRequests / networkRequests.length;

    const averageResponseTime =
      networkRequests.reduce((sum, req) => sum + req.responseTime, 0) /
      networkRequests.length;
    const speedEfficiency = Math.max(
      0,
      100 - (averageResponseTime / 1000) * 10
    ); // 1 second = 10% penalty

    return (successRate * 100 + speedEfficiency) / 2;
  }

  private calculateOverallEfficiency(metrics: {
    dataCollectionEfficiency: number;
    processingEfficiency: number;
    storageEfficiency: number;
    networkEfficiency: number;
  }): number {
    // Weighted average of all efficiency metrics
    const weights = {
      dataCollection: 0.3,
      processing: 0.4,
      storage: 0.2,
      network: 0.1,
    };

    return (
      metrics.dataCollectionEfficiency * weights.dataCollection +
      metrics.processingEfficiency * weights.processing +
      metrics.storageEfficiency * weights.storage +
      metrics.networkEfficiency * weights.network
    );
  }

  private calculateOptimizationImpact(): number {
    if (!this.baselineMetrics) return 0;

    return (
      this.efficiencyMetrics.overallEfficiency -
      this.baselineMetrics.overallEfficiency
    );
  }

  private addToHistory(): void {
    this.measurementHistory.push({
      timestamp: new Date(),
      metrics: { ...this.efficiencyMetrics },
    });

    // Keep only last 1000 measurements
    if (this.measurementHistory.length > 1000) {
      this.measurementHistory = this.measurementHistory.slice(-1000);
    }
  }

  private updateBenchmarks(): void {
    this.benchmarks.get('dataCollection')!.current =
      this.efficiencyMetrics.dataCollectionEfficiency;
    this.benchmarks.get('processing')!.current =
      this.efficiencyMetrics.processingEfficiency;
    this.benchmarks.get('storage')!.current =
      this.efficiencyMetrics.storageEfficiency;
    this.benchmarks.get('network')!.current =
      this.efficiencyMetrics.networkEfficiency;
    this.benchmarks.get('overall')!.current =
      this.efficiencyMetrics.overallEfficiency;

    // Update trends
    this.benchmarks.forEach(benchmark => {
      benchmark.trend = this.calculateBenchmarkTrend(benchmark);
    });
  }

  private calculateOverallScore(): number {
    const benchmarks = this.getBenchmarks();
    const totalScore = benchmarks.reduce((sum, benchmark) => {
      const targetRatio = benchmark.current / benchmark.target;
      return sum + Math.min(100, targetRatio * 100);
    }, 0);

    return totalScore / benchmarks.length;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const benchmarks = this.getBenchmarks();

    benchmarks.forEach(benchmark => {
      if (benchmark.current < benchmark.target) {
        const gap = benchmark.target - benchmark.current;
        if (gap > 10) {
          recommendations.push(
            `Improve ${benchmark.name.toLowerCase()} (${gap.toFixed(1)}% below target)`
          );
        }
      }

      if (benchmark.trend === 'degrading') {
        recommendations.push(
          `Address degrading ${benchmark.name.toLowerCase()}`
        );
      }
    });

    // Add general recommendations
    if (this.efficiencyMetrics.overallEfficiency < 80) {
      recommendations.push('Consider enabling more aggressive optimizations');
    }

    if (this.efficiencyMetrics.optimizationImpact < 0) {
      recommendations.push('Review recent optimizations for negative impact');
    }

    return recommendations;
  }

  private analyzeTrends(): {
    shortTerm: 'improving' | 'stable' | 'degrading';
    longTerm: 'improving' | 'stable' | 'degrading';
  } {
    const shortTermTrend = this.getEfficiencyTrends('hour').trend;
    const longTermTrend = this.getEfficiencyTrends('day').trend;

    return {
      shortTerm: shortTermTrend,
      longTerm: longTermTrend,
    };
  }

  private updateBenchmarkTarget(benchmarkKey: string, target: number): void {
    const benchmark = this.benchmarks.get(benchmarkKey);
    if (benchmark) {
      benchmark.target = target;
    }
  }

  private getCutoffTime(timeframe: 'hour' | 'day' | 'week'): Date {
    const now = new Date();
    switch (timeframe) {
      case 'hour':
        return new Date(now.getTime() - 3600000); // 1 hour ago
      case 'day':
        return new Date(now.getTime() - 86400000); // 1 day ago
      case 'week':
        return new Date(now.getTime() - 604800000); // 1 week ago
      default:
        return new Date(now.getTime() - 3600000);
    }
  }

  private calculateTrend(
    dataPoints: Array<{ timestamp: Date; efficiency: number }>
  ): 'improving' | 'stable' | 'degrading' {
    if (dataPoints.length < 2) return 'stable';

    const first = dataPoints[0].efficiency;
    const last = dataPoints[dataPoints.length - 1].efficiency;
    const change = last - first;

    if (change > 2) return 'improving';
    if (change < -2) return 'degrading';
    return 'stable';
  }

  private calculateChangeRate(
    dataPoints: Array<{ timestamp: Date; efficiency: number }>
  ): number {
    if (dataPoints.length < 2) return 0;

    const first = dataPoints[0];
    const last = dataPoints[dataPoints.length - 1];
    const timeDiff = last.timestamp.getTime() - first.timestamp.getTime();
    const efficiencyDiff = last.efficiency - first.efficiency;

    // Return change per hour
    return (efficiencyDiff / timeDiff) * 3600000;
  }

  private calculateBenchmarkTrend(
    benchmark: EfficiencyBenchmark
  ): 'improving' | 'stable' | 'degrading' {
    const change = benchmark.current - benchmark.baseline;

    if (change > 2) return 'improving';
    if (change < -2) return 'degrading';
    return 'stable';
  }

  private getTotalDataPoints(sessionState: DebugSessionState): number {
    return (
      sessionState.capturedData.consoleMessages.length +
      sessionState.capturedData.networkRequests.length +
      sessionState.capturedData.performanceMetrics.length +
      sessionState.capturedData.errorLogs.length +
      sessionState.capturedData.storageOperations.length +
      sessionState.capturedData.memorySnapshots.length
    );
  }

  private getExpectedDataPoints(sessionState: DebugSessionState): number {
    // Calculate expected data points based on session duration and configuration
    const duration = sessionState.endTime
      ? sessionState.endTime.getTime() - sessionState.startTime.getTime()
      : Date.now() - sessionState.startTime.getTime();

    const durationMinutes = duration / 60000;

    // Rough estimate: 10 data points per minute per active context
    return Math.floor(
      durationMinutes * sessionState.activeContexts.length * 10
    );
  }

  private calculateCollectionOverhead(sessionState: DebugSessionState): number {
    // Calculate overhead as percentage of total processing time spent on data collection
    const totalDataPoints = this.getTotalDataPoints(sessionState);
    const estimatedCollectionTime = totalDataPoints * 0.1; // 0.1ms per data point
    const totalSessionTime = sessionState.endTime
      ? sessionState.endTime.getTime() - sessionState.startTime.getTime()
      : Date.now() - sessionState.startTime.getTime();

    return (estimatedCollectionTime / totalSessionTime) * 100;
  }
}

// Export singleton instance
export const debugEfficiencyMonitor = new DebugEfficiencyMonitor();
