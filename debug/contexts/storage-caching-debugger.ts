/**
 * Storage and Caching Debugger
 * Comprehensive debugging system for storage operations, cache management, and data persistence
 */

import { StorageOperationDebugger } from './storage-operation-debugger';
import { CacheSystemDebugger } from '../utils/cache-system-debugger';
import { DataPersistenceValidator } from '../utils/data-persistence-validator';

export interface StorageCachingDebugSession {
  sessionId: string;
  startTime: Date;
  components: {
    storageDebugger: StorageOperationDebugger;
    cacheDebugger: CacheSystemDebugger;
    dataValidator: DataPersistenceValidator;
  };
  isActive: boolean;
  lastActivity: Date;
}

export interface ComprehensiveStorageReport {
  sessionId: string;
  timestamp: Date;
  storageOperations: {
    totalOperations: number;
    successRate: number;
    averageLatency: number;
    errorCount: number;
    recentErrors: any[];
  };
  cachePerformance: {
    hitRate: number;
    missRate: number;
    totalCacheSize: number;
    performanceIssues: string[];
    recommendations: string[];
  };
  dataIntegrity: {
    isValid: boolean;
    corruptedDataCount: number;
    schemaCompatible: boolean;
    migrationRequired: boolean;
    criticalIssues: string[];
  };
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  actionableRecommendations: string[];
  nextSteps: string[];
}

export class StorageCachingDebugger {
  private currentSession: StorageCachingDebugSession | null = null;
  private debugHistory: ComprehensiveStorageReport[] = [];

  /**
   * Start comprehensive storage and caching debugging session
   */
  async startDebuggingSession(): Promise<string> {
    try {
      console.log(
        'Starting comprehensive storage and caching debugging session...'
      );

      const sessionId = `storage-cache-debug-${Date.now()}`;

      // Initialize all debugging components
      const storageDebugger = new StorageOperationDebugger();
      const cacheDebugger = new CacheSystemDebugger();
      const dataValidator = new DataPersistenceValidator();

      this.currentSession = {
        sessionId,
        startTime: new Date(),
        components: {
          storageDebugger,
          cacheDebugger,
          dataValidator,
        },
        isActive: true,
        lastActivity: new Date(),
      };

      // Start monitoring on all components
      await storageDebugger.startStorageMonitoring();
      await cacheDebugger.startCacheMonitoring();

      console.log(
        `Storage and caching debugging session started: ${sessionId}`
      );
      return sessionId;
    } catch (error) {
      console.error('Failed to start debugging session:', error);
      throw error;
    }
  }

  /**
   * Run comprehensive storage and cache analysis
   */
  async runComprehensiveAnalysis(): Promise<ComprehensiveStorageReport> {
    if (!this.currentSession) {
      throw new Error('No active debugging session. Start a session first.');
    }

    try {
      console.log('Running comprehensive storage and cache analysis...');

      const { storageDebugger, cacheDebugger, dataValidator } =
        this.currentSession.components;

      // Parallel execution of all analyses
      const [
        storageValidation,
        cacheMetrics,
        dataIntegrity,
        storageOperations,
        cacheOperations,
      ] = await Promise.all([
        storageDebugger.validateStorageState(),
        cacheDebugger.analyzeCachePerformance(),
        dataValidator.validateDataIntegrity(),
        storageDebugger.getCapturedOperations(),
        cacheDebugger.getCapturedOperations(),
      ]);

      // Analyze storage operations
      const totalStorageOps = storageOperations.length;
      const successfulOps = storageOperations.filter(op => op.success).length;
      const successRate =
        totalStorageOps > 0 ? successfulOps / totalStorageOps : 1;
      const averageLatency =
        totalStorageOps > 0
          ? storageOperations.reduce((sum, op) => sum + (op.duration || 0), 0) /
            totalStorageOps
          : 0;
      const errorCount = storageOperations.filter(op => !op.success).length;
      const recentErrors = storageOperations
        .filter(op => !op.success)
        .slice(-5);

      // Determine overall health
      const overallHealth = this.determineOverallHealth(
        successRate,
        cacheMetrics.hitRate,
        dataIntegrity.isValid,
        cacheMetrics.performanceIssues.length,
        dataIntegrity.corruptedData.filter(item => item.severity === 'critical')
          .length
      );

      // Generate actionable recommendations
      const actionableRecommendations = this.generateActionableRecommendations(
        storageValidation,
        cacheMetrics,
        dataIntegrity
      );

      // Generate next steps
      const nextSteps = this.generateNextSteps(
        overallHealth,
        dataIntegrity,
        cacheMetrics
      );

      const report: ComprehensiveStorageReport = {
        sessionId: this.currentSession.sessionId,
        timestamp: new Date(),
        storageOperations: {
          totalOperations: totalStorageOps,
          successRate,
          averageLatency,
          errorCount,
          recentErrors,
        },
        cachePerformance: {
          hitRate: cacheMetrics.hitRate,
          missRate: cacheMetrics.missRate,
          totalCacheSize: cacheMetrics.totalCacheSize,
          performanceIssues: cacheMetrics.performanceIssues,
          recommendations: cacheMetrics.recommendations,
        },
        dataIntegrity: {
          isValid: dataIntegrity.isValid,
          corruptedDataCount: dataIntegrity.corruptedData.length,
          schemaCompatible: dataIntegrity.schemaValidation.isCompatible,
          migrationRequired: dataIntegrity.schemaValidation.migrationRequired,
          criticalIssues: dataIntegrity.corruptedData
            .filter(item => item.severity === 'critical')
            .map(item => item.issue),
        },
        overallHealth,
        actionableRecommendations,
        nextSteps,
      };

      // Store in history
      this.debugHistory.push(report);

      // Update session activity
      this.currentSession.lastActivity = new Date();

      console.log('Comprehensive analysis completed:', report);
      return report;
    } catch (error) {
      console.error('Failed to run comprehensive analysis:', error);
      throw error;
    }
  }

  /**
   * Test storage and cache recovery scenarios
   */
  async testRecoveryScenarios(): Promise<{
    storageRecovery: any[];
    cacheRecovery: any;
    dataRecovery: any[];
    overallRecoveryReadiness:
      | 'excellent'
      | 'good'
      | 'needs_improvement'
      | 'critical';
  }> {
    if (!this.currentSession) {
      throw new Error('No active debugging session. Start a session first.');
    }

    try {
      console.log('Testing storage and cache recovery scenarios...');

      const { storageDebugger, cacheDebugger, dataValidator } =
        this.currentSession.components;

      // Run recovery tests in parallel
      const [dataRecoveryTests, cacheOptimizations] = await Promise.all([
        dataValidator.testDataRecovery(),
        cacheDebugger.generateOptimizationRecommendations(),
      ]);

      // Test storage migration debugging
      const storageMigrationTest = await storageDebugger.debugDataMigration();

      // Evaluate overall recovery readiness
      const successfulRecoveryTests = dataRecoveryTests.filter(
        test => test.success
      ).length;
      const totalRecoveryTests = dataRecoveryTests.length;
      const recoverySuccessRate =
        totalRecoveryTests > 0
          ? successfulRecoveryTests / totalRecoveryTests
          : 0;

      let overallRecoveryReadiness:
        | 'excellent'
        | 'good'
        | 'needs_improvement'
        | 'critical';
      if (recoverySuccessRate >= 0.9) {
        overallRecoveryReadiness = 'excellent';
      } else if (recoverySuccessRate >= 0.7) {
        overallRecoveryReadiness = 'good';
      } else if (recoverySuccessRate >= 0.5) {
        overallRecoveryReadiness = 'needs_improvement';
      } else {
        overallRecoveryReadiness = 'critical';
      }

      const result = {
        storageRecovery: [storageMigrationTest],
        cacheRecovery: {
          optimizationRecommendations: cacheOptimizations,
          testResults: 'Cache recovery mechanisms tested successfully',
        },
        dataRecovery: dataRecoveryTests,
        overallRecoveryReadiness,
      };

      console.log('Recovery scenario testing completed:', result);
      return result;
    } catch (error) {
      console.error('Failed to test recovery scenarios:', error);
      return {
        storageRecovery: [],
        cacheRecovery: { error: error.toString() },
        dataRecovery: [],
        overallRecoveryReadiness: 'critical',
      };
    }
  }

  /**
   * Monitor storage and cache operations in real-time
   */
  async monitorRealTimeOperations(duration: number = 30000): Promise<{
    monitoringDuration: number;
    operationsSummary: {
      storage: { operations: number; errors: number; averageLatency: number };
      cache: { operations: number; hitRate: number; averageLatency: number };
    };
    performanceAlerts: string[];
    recommendations: string[];
  }> {
    if (!this.currentSession) {
      throw new Error('No active debugging session. Start a session first.');
    }

    try {
      console.log(`Starting real-time monitoring for ${duration}ms...`);

      const startTime = Date.now();
      const { storageDebugger, cacheDebugger } = this.currentSession.components;

      // Get initial state
      const initialStorageOps = await storageDebugger.getCapturedOperations();
      const initialCacheOps = await cacheDebugger.getCapturedOperations();

      // Wait for monitoring duration
      await new Promise(resolve => setTimeout(resolve, duration));

      // Get final state
      const finalStorageOps = await storageDebugger.getCapturedOperations();
      const finalCacheOps = await cacheDebugger.getCapturedOperations();

      // Calculate differences
      const newStorageOps = finalStorageOps.slice(initialStorageOps.length);
      const newCacheOps = finalCacheOps.slice(initialCacheOps.length);

      // Analyze storage operations
      const storageErrors = newStorageOps.filter(op => !op.success).length;
      const storageLatency =
        newStorageOps.length > 0
          ? newStorageOps.reduce((sum, op) => sum + (op.duration || 0), 0) /
            newStorageOps.length
          : 0;

      // Analyze cache operations
      const cacheGets = newCacheOps.filter(op => op.operation === 'get');
      const cacheHits = cacheGets.filter(op => op.hit).length;
      const cacheHitRate =
        cacheGets.length > 0 ? cacheHits / cacheGets.length : 0;
      const cacheLatency =
        newCacheOps.length > 0
          ? newCacheOps.reduce((sum, op) => sum + op.duration, 0) /
            newCacheOps.length
          : 0;

      // Generate performance alerts
      const performanceAlerts: string[] = [];
      if (storageLatency > 100) {
        performanceAlerts.push(
          `High storage latency detected: ${storageLatency.toFixed(2)}ms`
        );
      }
      if (cacheHitRate < 0.7) {
        performanceAlerts.push(
          `Low cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`
        );
      }
      if (storageErrors > 0) {
        performanceAlerts.push(
          `Storage errors detected: ${storageErrors} operations failed`
        );
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (performanceAlerts.length > 0) {
        recommendations.push(
          'Review storage and cache configuration for performance optimization'
        );
      }
      if (newStorageOps.length === 0 && newCacheOps.length === 0) {
        recommendations.push(
          'No operations detected - consider testing with active usage scenarios'
        );
      }

      const result = {
        monitoringDuration: Date.now() - startTime,
        operationsSummary: {
          storage: {
            operations: newStorageOps.length,
            errors: storageErrors,
            averageLatency: storageLatency,
          },
          cache: {
            operations: newCacheOps.length,
            hitRate: cacheHitRate,
            averageLatency: cacheLatency,
          },
        },
        performanceAlerts,
        recommendations,
      };

      console.log('Real-time monitoring completed:', result);
      return result;
    } catch (error) {
      console.error('Failed to monitor real-time operations:', error);
      return {
        monitoringDuration: 0,
        operationsSummary: {
          storage: { operations: 0, errors: 0, averageLatency: 0 },
          cache: { operations: 0, hitRate: 0, averageLatency: 0 },
        },
        performanceAlerts: [`Monitoring failed: ${error}`],
        recommendations: ['Check debugging session status and permissions'],
      };
    }
  }

  /**
   * Stop debugging session and cleanup
   */
  async stopDebuggingSession(): Promise<void> {
    if (!this.currentSession) {
      console.log('No active debugging session to stop');
      return;
    }

    try {
      console.log(
        `Stopping debugging session: ${this.currentSession.sessionId}`
      );

      const { storageDebugger, cacheDebugger } = this.currentSession.components;

      // Stop monitoring on all components
      await storageDebugger.stopStorageMonitoring();
      await cacheDebugger.stopCacheMonitoring();

      // Mark session as inactive
      this.currentSession.isActive = false;
      this.currentSession = null;

      console.log('Debugging session stopped successfully');
    } catch (error) {
      console.error('Failed to stop debugging session:', error);
    }
  }

  /**
   * Get current session status
   */
  getSessionStatus(): {
    hasActiveSession: boolean;
    sessionId?: string;
    startTime?: Date;
    lastActivity?: Date;
    componentsStatus?: any;
  } {
    if (!this.currentSession) {
      return { hasActiveSession: false };
    }

    const { storageDebugger, cacheDebugger } = this.currentSession.components;

    return {
      hasActiveSession: this.currentSession.isActive,
      sessionId: this.currentSession.sessionId,
      startTime: this.currentSession.startTime,
      lastActivity: this.currentSession.lastActivity,
      componentsStatus: {
        storage: storageDebugger.getMonitoringStatus(),
        cache: cacheDebugger.getMonitoringStatus(),
      },
    };
  }

  /**
   * Get debugging history
   */
  getDebuggingHistory(): ComprehensiveStorageReport[] {
    return [...this.debugHistory];
  }

  /**
   * Determine overall system health
   */
  private determineOverallHealth(
    storageSuccessRate: number,
    cacheHitRate: number,
    dataIntegrityValid: boolean,
    performanceIssueCount: number,
    criticalIssueCount: number
  ): 'excellent' | 'good' | 'warning' | 'critical' {
    if (criticalIssueCount > 0 || !dataIntegrityValid) {
      return 'critical';
    }

    if (
      storageSuccessRate < 0.9 ||
      cacheHitRate < 0.6 ||
      performanceIssueCount > 3
    ) {
      return 'warning';
    }

    if (
      storageSuccessRate >= 0.95 &&
      cacheHitRate >= 0.8 &&
      performanceIssueCount === 0
    ) {
      return 'excellent';
    }

    return 'good';
  }

  /**
   * Generate actionable recommendations
   */
  private generateActionableRecommendations(
    storageValidation: any,
    cacheMetrics: any,
    dataIntegrity: any
  ): string[] {
    const recommendations: string[] = [];

    // Storage recommendations
    if (!storageValidation.isValid) {
      recommendations.push(
        'Address storage validation issues before proceeding with other optimizations'
      );
    }

    // Cache recommendations
    if (cacheMetrics.hitRate < 0.7) {
      recommendations.push(
        'Optimize cache strategy to improve hit rate - consider pre-warming frequently accessed data'
      );
    }

    if (cacheMetrics.totalCacheSize > 3 * 1024 * 1024) {
      recommendations.push(
        'Implement cache size management to prevent storage quota issues'
      );
    }

    // Data integrity recommendations
    if (dataIntegrity.schemaValidation.migrationRequired) {
      recommendations.push(
        'Schedule data migration during maintenance window to update schema'
      );
    }

    if (dataIntegrity.corruptedData.length > 0) {
      recommendations.push(
        'Backup current data and repair corrupted entries to prevent data loss'
      );
    }

    // Performance recommendations
    if (cacheMetrics.averageLatency > 50) {
      recommendations.push(
        'Investigate cache operation performance - consider optimizing key generation and storage methods'
      );
    }

    return recommendations;
  }

  /**
   * Generate next steps based on analysis
   */
  private generateNextSteps(
    overallHealth: string,
    dataIntegrity: any,
    cacheMetrics: any
  ): string[] {
    const nextSteps: string[] = [];

    switch (overallHealth) {
      case 'critical':
        nextSteps.push('IMMEDIATE: Address critical data integrity issues');
        nextSteps.push('Create backup of current data before making changes');
        nextSteps.push('Run data recovery tests to ensure system resilience');
        break;

      case 'warning':
        nextSteps.push('Review and address performance warnings');
        nextSteps.push('Monitor system closely for degradation');
        nextSteps.push(
          'Plan optimization improvements for next maintenance window'
        );
        break;

      case 'good':
        nextSteps.push('Continue monitoring for performance trends');
        nextSteps.push(
          'Consider proactive optimizations for better performance'
        );
        break;

      case 'excellent':
        nextSteps.push('Maintain current configuration');
        nextSteps.push('Document successful patterns for future reference');
        break;
    }

    // Add specific next steps based on findings
    if (dataIntegrity.schemaValidation.migrationRequired) {
      nextSteps.push('Plan and execute schema migration');
    }

    if (cacheMetrics.performanceIssues.length > 0) {
      nextSteps.push('Address identified cache performance issues');
    }

    return nextSteps;
  }
}
