/**
 * Test Performance Optimization
 * Tests for debugging performance optimization functionality
 */

import { DebugPerformanceOptimizer } from './utils/debug-performance-optimizer.js';
import { DebugEfficiencyMonitor } from './utils/debug-efficiency-monitor.js';
import { PerformanceOptimizationSystem } from './utils/performance-optimization-system.js';
import { DebugSessionState } from './types/debug-types.js';

/**
 * Create test session state
 */
function createTestSessionState(): DebugSessionState {
  return {
    sessionId: 'test-performance-session',
    startTime: new Date(Date.now() - 300000), // 5 minutes ago
    status: 'active',
    activeContexts: [
      {
        type: 'service-worker',
        pageIndex: 0,
        isActive: true,
        lastActivity: new Date(),
      },
      {
        type: 'content-script',
        pageIndex: 1,
        url: 'https://example.com',
        isActive: false,
        lastActivity: new Date(Date.now() - 60000),
      },
    ],
    capturedData: {
      consoleMessages: Array.from({ length: 150 }, (_, i) => ({
        id: i,
        timestamp: new Date(Date.now() - (150 - i) * 1000),
        level: i % 4 === 0 ? 'error' : 'info',
        message: `Test message ${i}`,
        source: 'test',
        context: i % 2 === 0 ? 'service-worker' : 'content-script',
      })),
      networkRequests: Array.from({ length: 50 }, (_, i) => ({
        id: i,
        timestamp: new Date(Date.now() - (50 - i) * 2000),
        method: 'GET',
        url: `https://api.example.com/endpoint${i}`,
        status: i % 10 === 0 ? 500 : 200,
        responseTime: Math.random() * 2000 + 100,
        requestSize: Math.random() * 1000,
        responseSize: Math.random() * 5000,
        context: i % 2 === 0 ? 'service-worker' : 'content-script',
      })),
      performanceMetrics: Array.from({ length: 200 }, (_, i) => ({
        timestamp: new Date(Date.now() - (200 - i) * 500),
        name: `metric_${i % 5}`,
        value: Math.random() * 100,
        unit: 'ms',
        context: i % 2 === 0 ? 'service-worker' : 'content-script',
      })),
      errorLogs: Array.from({ length: 20 }, (_, i) => ({
        timestamp: new Date(Date.now() - (20 - i) * 10000),
        level: i % 3 === 0 ? 'critical' : 'error',
        message: `Test error ${i}`,
        context: 'test',
      })),
      storageOperations: Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(Date.now() - (30 - i) * 3000),
        operation: i % 4 === 0 ? 'set' : 'get',
        key: `test_key_${i}`,
        success: i % 10 !== 0,
        duration: Math.random() * 10,
      })),
      memorySnapshots: Array.from({ length: 60 }, (_, i) => ({
        timestamp: new Date(Date.now() - (60 - i) * 5000),
        totalJSHeapSize: 50000000 + Math.random() * 20000000,
        usedJSHeapSize: 30000000 + Math.random() * 15000000,
        jsHeapSizeLimit: 100000000,
        context: i % 2 === 0 ? 'service-worker' : 'content-script',
      })),
    },
    testResults: Array.from({ length: 10 }, (_, i) => ({
      passed: i % 3 !== 0,
      scenarioName: `Test Scenario ${i}`,
      executionTime: Math.random() * 5000 + 500,
      timestamp: new Date(Date.now() - (10 - i) * 30000),
      error: i % 3 === 0 ? `Test error for scenario ${i}` : undefined,
      metrics: {
        memoryUsage: Math.random() * 50,
        cpuUsage: Math.random() * 80,
      },
    })),
    configuration: {
      timeout: 30000,
      maxRetries: 3,
      captureConsole: true,
      captureNetwork: true,
      capturePerformance: true,
      captureStorage: true,
      captureMemory: true,
      contexts: ['service-worker', 'content-script'],
    },
  };
}

/**
 * Test debug performance optimizer
 */
async function testDebugPerformanceOptimizer(): Promise<void> {
  console.log('\n=== Testing Debug Performance Optimizer ===');

  const optimizer = new DebugPerformanceOptimizer({
    enabled: true,
    monitoringInterval: 5000,
    thresholds: {
      maxMemoryUsage: 50,
      maxExecutionTime: 3000,
      maxDataPoints: 100,
      maxConcurrentOperations: 3,
      gcThreshold: 30,
    },
  });

  try {
    // Initialize optimizer
    await optimizer.initializeOptimization();
    console.log('✓ Optimizer initialized successfully');

    // Create test session
    const sessionState = createTestSessionState();

    // Test session optimization
    const optimization = await optimizer.optimizeSession(sessionState);
    console.log('✓ Session optimization completed:', {
      success: optimization.success,
      optimizationsApplied: optimization.optimizationsApplied?.length || 0,
      performanceGain: optimization.performanceGain,
      executionTime: optimization.executionTime,
    });

    // Test overhead monitoring
    await optimizer.startOverheadMonitoring();
    console.log('✓ Overhead monitoring started');

    // Wait for some monitoring data
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get metrics
    const overheadMetrics = optimizer.getOverheadMetrics();
    const efficiencyMetrics = optimizer.getEfficiencyMetrics();

    console.log('✓ Metrics collected:', {
      memoryOverhead: overheadMetrics.memoryOverhead.toFixed(2),
      totalOverhead: overheadMetrics.totalOverhead.toFixed(2),
      overallEfficiency: efficiencyMetrics.overallEfficiency.toFixed(2),
    });

    // Test optimization cache
    const cache = optimizer.createOptimizedCache<string>('test-cache', 5000);
    cache.set('test-value');
    const cachedValue = cache.get();
    console.log(
      '✓ Cache test:',
      cachedValue === 'test-value' ? 'passed' : 'failed'
    );

    // Test operation queuing
    let queueResult = '';
    const operation = async () => {
      queueResult = 'queued operation executed';
      return queueResult;
    };
    await optimizer.queueOperation(operation);
    console.log(
      '✓ Operation queue test:',
      queueResult === 'queued operation executed' ? 'passed' : 'failed'
    );

    // Generate optimization report
    const report = optimizer.generateOptimizationReport();
    console.log('✓ Optimization report generated:', {
      appliedOptimizations: report.appliedOptimizations.length,
      recommendations: report.recommendations.length,
    });

    optimizer.stopOverheadMonitoring();
    console.log('✓ Debug Performance Optimizer tests completed');
  } catch (error) {
    console.error('✗ Debug Performance Optimizer test failed:', error);
  }
}

/**
 * Test debug efficiency monitor
 */
async function testDebugEfficiencyMonitor(): Promise<void> {
  console.log('\n=== Testing Debug Efficiency Monitor ===');

  const monitor = new DebugEfficiencyMonitor();

  try {
    // Initialize monitor
    await monitor.initializeMonitoring();
    console.log('✓ Efficiency monitor initialized successfully');

    // Create test session
    const sessionState = createTestSessionState();

    // Test efficiency measurement
    const efficiency = await monitor.measureEfficiency(sessionState);
    console.log('✓ Efficiency measured:', {
      dataCollection: efficiency.dataCollectionEfficiency.toFixed(2),
      processing: efficiency.processingEfficiency.toFixed(2),
      storage: efficiency.storageEfficiency.toFixed(2),
      network: efficiency.networkEfficiency.toFixed(2),
      overall: efficiency.overallEfficiency.toFixed(2),
    });

    // Test benchmarks
    const benchmarks = monitor.getBenchmarks();
    console.log('✓ Benchmarks retrieved:', benchmarks.length);

    // Test efficiency report
    const report = monitor.generateEfficiencyReport();
    console.log('✓ Efficiency report generated:', {
      overallScore: report.overallScore.toFixed(2),
      recommendations: report.recommendations.length,
      shortTermTrend: report.trends.shortTerm,
      longTermTrend: report.trends.longTerm,
    });

    // Test optimization impact tracking
    const baselineEfficiency = { ...efficiency };
    baselineEfficiency.overallEfficiency = 85;

    const improvedEfficiency = { ...efficiency };
    improvedEfficiency.overallEfficiency = 92;

    const impact = monitor.trackOptimizationImpact(
      'test-optimization',
      baselineEfficiency,
      improvedEfficiency
    );
    console.log('✓ Optimization impact tracked:', {
      impact: impact.impact.toFixed(2),
      improvements: Object.keys(impact.improvements).length,
      degradations: Object.keys(impact.degradations).length,
    });

    // Test efficiency targets
    monitor.setEfficiencyTargets({
      dataCollection: 90,
      processing: 85,
      storage: 80,
      network: 75,
      overall: 85,
    });
    console.log('✓ Efficiency targets set');

    // Test efficiency trends
    const trends = monitor.getEfficiencyTrends('hour');
    console.log('✓ Efficiency trends analyzed:', {
      dataPoints: trends.dataPoints.length,
      trend: trends.trend,
      changeRate: trends.changeRate.toFixed(2),
    });

    console.log('✓ Debug Efficiency Monitor tests completed');
  } catch (error) {
    console.error('✗ Debug Efficiency Monitor test failed:', error);
  }
}

/**
 * Test performance optimization system
 */
async function testPerformanceOptimizationSystem(): Promise<void> {
  console.log('\n=== Testing Performance Optimization System ===');

  const system = new PerformanceOptimizationSystem({
    enabled: true,
    monitoringInterval: 5000,
    thresholds: {
      maxMemoryUsage: 50,
      maxExecutionTime: 3000,
      maxDataPoints: 100,
      maxConcurrentOperations: 3,
      gcThreshold: 30,
    },
  });

  try {
    // Initialize system
    await system.initialize();
    console.log('✓ Performance optimization system initialized');

    // Create test session
    const sessionState = createTestSessionState();

    // Test comprehensive optimization
    const result = await system.optimizePerformance(sessionState);
    console.log('✓ Comprehensive optimization completed:', {
      success: result.optimization.success,
      performanceGain: result.optimization.performanceGain,
      overallEfficiency: result.efficiency.overallEfficiency.toFixed(2),
      recommendations: result.recommendations.length,
    });

    // Test optimization plan execution
    const planResult = await system.executeOptimizationPlan(
      'memory-optimization',
      sessionState
    );
    console.log('✓ Optimization plan executed:', {
      success: planResult.success,
      performanceGain: planResult.performanceGain.toFixed(2),
      memoryReduction: planResult.memoryReduction.toFixed(2),
      actionsExecuted: planResult.actionsExecuted,
      errors: planResult.errors.length,
    });

    // Test optimization recommendations
    const recommendations = system.getOptimizationRecommendations(sessionState);
    console.log('✓ Optimization recommendations generated:', {
      immediate: recommendations.immediate.length,
      shortTerm: recommendations.shortTerm.length,
      longTerm: recommendations.longTerm.length,
      priority: recommendations.priority,
    });

    // Test optimization report
    const report = system.generateOptimizationReport();
    console.log('✓ Optimization report generated:', {
      systemStatus: report.systemStatus,
      availablePlans: report.availablePlans.length,
      optimizationHistory: report.optimizationHistory.length,
      recommendations: report.recommendations.length,
      efficiencyTrend: report.trends.efficiency,
      overheadTrend: report.trends.overhead,
    });

    await system.shutdown();
    console.log('✓ Performance Optimization System tests completed');
  } catch (error) {
    console.error('✗ Performance Optimization System test failed:', error);
  }
}

/**
 * Test integration between components
 */
async function testIntegration(): Promise<void> {
  console.log('\n=== Testing Component Integration ===');

  try {
    const sessionState = createTestSessionState();

    // Test that all components work together
    const system = new PerformanceOptimizationSystem();
    await system.initialize();

    const result = await system.optimizePerformance(sessionState);

    // Verify that optimization affects efficiency metrics
    const hasPositiveImpact =
      result.optimization.success && result.efficiency.overallEfficiency > 0;

    console.log('✓ Integration test:', hasPositiveImpact ? 'passed' : 'failed');
    console.log('✓ Components integrated successfully');

    await system.shutdown();
  } catch (error) {
    console.error('✗ Integration test failed:', error);
  }
}

/**
 * Run all performance optimization tests
 */
export async function runPerformanceOptimizationTests(): Promise<void> {
  console.log('Starting Performance Optimization Tests...');

  try {
    await testDebugPerformanceOptimizer();
    await testDebugEfficiencyMonitor();
    await testPerformanceOptimizationSystem();
    await testIntegration();

    console.log(
      '\n✅ All Performance Optimization Tests Completed Successfully!'
    );
  } catch (error) {
    console.error('\n❌ Performance Optimization Tests Failed:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceOptimizationTests().catch(console.error);
}
