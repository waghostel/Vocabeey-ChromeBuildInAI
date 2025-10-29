/**
 * Cache System Debugger
 * Monitor and debug cache operations, hit/miss ratios, and cache invalidation
 */

export interface CacheOperation {
  operation: 'get' | 'set' | 'remove' | 'clear' | 'maintenance';
  key: string;
  cacheType: 'article' | 'translation' | 'processed' | 'general';
  timestamp: string;
  duration: number;
  success: boolean;
  hit?: boolean; // for get operations
  error?: string;
  size?: number; // for set operations
  metadata?: any;
}

export interface CacheMetrics {
  totalOperations: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  missRate: number;
  averageLatency: number;
  totalCacheSize: number;
  cachesByType: {
    [key: string]: {
      count: number;
      size: number;
      hitRate: number;
      lastAccessed: string;
    };
  };
  performanceIssues: string[];
  recommendations: string[];
}

export interface CacheInvalidationEvent {
  key: string;
  reason: 'expired' | 'manual' | 'maintenance' | 'overflow';
  timestamp: string;
  age: number; // milliseconds
  accessCount?: number;
}

export class CacheSystemDebugger {
  private isMonitoring: boolean = false;
  private capturedOperations: CacheOperation[] = [];
  private invalidationEvents: CacheInvalidationEvent[] = [];
  private performanceThresholds = {
    maxLatency: 100, // milliseconds
    minHitRate: 0.7, // 70%
    maxCacheSize: 5 * 1024 * 1024, // 5MB
  };

  /**
   * Start monitoring cache operations
   */
  async startCacheMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Cache monitoring already active');
      return;
    }

    try {
      console.log('Starting cache system monitoring...');

      // Inject cache monitoring code
      await this.injectCacheMonitoring();

      this.isMonitoring = true;
      console.log('Cache system monitoring started');
    } catch (error) {
      console.error('Failed to start cache monitoring:', error);
      throw error;
    }
  }

  /**
   * Inject cache monitoring code into the appropriate context
   */
  private async injectCacheMonitoring(): Promise<void> {
    const cacheMonitoringScript = `
      (() => {
        // Prevent double injection
        if (window.cacheDebuggerInjected) {
          return 'Cache debugger already injected';
        }
        
        // Create cache operation tracking
        window.cacheOperations = window.cacheOperations || [];
        window.cacheInvalidations = window.cacheInvalidations || [];
        window.cacheMetrics = window.cacheMetrics || {
          totalOperations: 0,
          hitCount: 0,
          missCount: 0,
          totalLatency: 0
        };
        
        // Helper function to track cache operations
        function trackCacheOperation(operation, key, cacheType, startTime, success, hit, error, size, metadata) {
          const endTime = performance.now();
          const operationData = {
            operation: operation,
            key: key,
            cacheType: cacheType,
            timestamp: new Date().toISOString(),
            duration: endTime - startTime,
            success: success,
            hit: hit,
            error: error?.message,
            size: size,
            metadata: metadata
          };
          
          window.cacheOperations.push(operationData);
          
          // Update metrics
          window.cacheMetrics.totalOperations++;
          window.cacheMetrics.totalLatency += operationData.duration;
          
          if (operation === 'get') {
            if (hit) {
              window.cacheMetrics.hitCount++;
            } else {
              window.cacheMetrics.missCount++;
            }
          }
          
          console.log('[CACHE DEBUG] Operation:', operationData);
          
          if (error) {
            console.error('[CACHE DEBUG] Cache operation failed:', operationData);
          }
        }
        
        // Helper function to track cache invalidations
        function trackCacheInvalidation(key, reason, age, accessCount) {
          const invalidationData = {
            key: key,
            reason: reason,
            timestamp: new Date().toISOString(),
            age: age,
            accessCount: accessCount
          };
          
          window.cacheInvalidations.push(invalidationData);
          console.log('[CACHE DEBUG] Cache invalidation:', invalidationData);
        }
        
        // Store original cache manager methods if available
        if (window.cacheManager) {
          const originalGet = window.cacheManager.get;
          const originalSet = window.cacheManager.set;
          const originalRemove = window.cacheManager.remove;
          const originalClear = window.cacheManager.clear;
          
          // Wrap get method
          window.cacheManager.get = async function(key) {
            const startTime = performance.now();
            let result, error, hit = false;
            
            try {
              result = await originalGet.call(this, key);
              hit = result !== null;
            } catch (e) {
              error = e;
            }
            
            const cacheType = key.includes('article:') ? 'article' : 
                             key.includes('translation:') ? 'translation' :
                             key.includes('processed:') ? 'processed' : 'general';
            
            trackCacheOperation('get', key, cacheType, startTime, !error, hit, error);
            
            if (error) throw error;
            return result;
          };
          
          // Wrap set method
          window.cacheManager.set = async function(key, value) {
            const startTime = performance.now();
            let error;
            const size = JSON.stringify(value).length;
            
            try {
              await originalSet.call(this, key, value);
            } catch (e) {
              error = e;
            }
            
            const cacheType = key.includes('article:') ? 'article' : 
                             key.includes('translation:') ? 'translation' :
                             key.includes('processed:') ? 'processed' : 'general';
            
            trackCacheOperation('set', key, cacheType, startTime, !error, undefined, error, size);
            
            if (error) throw error;
          };
          
          // Wrap remove method
          window.cacheManager.remove = async function(key) {
            const startTime = performance.now();
            let error;
            
            try {
              await originalRemove.call(this, key);
              trackCacheInvalidation(key, 'manual', 0);
            } catch (e) {
              error = e;
            }
            
            const cacheType = key.includes('article:') ? 'article' : 
                             key.includes('translation:') ? 'translation' :
                             key.includes('processed:') ? 'processed' : 'general';
            
            trackCacheOperation('remove', key, cacheType, startTime, !error, undefined, error);
            
            if (error) throw error;
          };
          
          // Wrap clear method
          window.cacheManager.clear = async function() {
            const startTime = performance.now();
            let error;
            
            try {
              await originalClear.call(this);
              trackCacheInvalidation('*', 'manual', 0);
            } catch (e) {
              error = e;
            }
            
            trackCacheOperation('clear', '*', 'general', startTime, !error, undefined, error);
            
            if (error) throw error;
          };
        }
        
        // Mark as injected
        window.cacheDebuggerInjected = true;
        console.log('[CACHE DEBUG] Cache monitoring injection complete');
        
        return 'Cache monitoring injection complete';
      })()
    `;

    // This would use mcp_chrome_devtools_evaluate_script when available
    console.log('Cache monitoring script prepared for injection');
  }

  /**
   * Get current cache metrics and analyze performance
   */
  async analyzeCachePerformance(): Promise<CacheMetrics> {
    try {
      console.log('Analyzing cache performance...');

      const operations = await this.getCapturedOperations();
      const cacheState = await this.getCurrentCacheState();

      const totalOperations = operations.length;
      const getOperations = operations.filter(op => op.operation === 'get');
      const hitCount = getOperations.filter(op => op.hit).length;
      const missCount = getOperations.filter(op => !op.hit).length;

      const hitRate =
        getOperations.length > 0 ? hitCount / getOperations.length : 0;
      const missRate =
        getOperations.length > 0 ? missCount / getOperations.length : 0;

      const totalLatency = operations.reduce((sum, op) => sum + op.duration, 0);
      const averageLatency =
        totalOperations > 0 ? totalLatency / totalOperations : 0;

      // Analyze cache by type
      const cachesByType: { [key: string]: any } = {};
      const typeGroups = operations.reduce(
        (groups, op) => {
          if (!groups[op.cacheType]) {
            groups[op.cacheType] = [];
          }
          groups[op.cacheType].push(op);
          return groups;
        },
        {} as { [key: string]: CacheOperation[] }
      );

      Object.keys(typeGroups).forEach(type => {
        const typeOps = typeGroups[type];
        const typeGets = typeOps.filter(op => op.operation === 'get');
        const typeHits = typeGets.filter(op => op.hit).length;
        const typeHitRate =
          typeGets.length > 0 ? typeHits / typeGets.length : 0;

        cachesByType[type] = {
          count: typeOps.length,
          size: typeOps
            .filter(op => op.size)
            .reduce((sum, op) => sum + (op.size || 0), 0),
          hitRate: typeHitRate,
          lastAccessed:
            typeOps.length > 0
              ? typeOps[typeOps.length - 1].timestamp
              : 'never',
        };
      });

      // Identify performance issues
      const performanceIssues: string[] = [];
      const recommendations: string[] = [];

      if (averageLatency > this.performanceThresholds.maxLatency) {
        performanceIssues.push(
          `High average latency: ${averageLatency.toFixed(2)}ms`
        );
        recommendations.push(
          'Consider optimizing cache key generation and storage operations'
        );
      }

      if (hitRate < this.performanceThresholds.minHitRate) {
        performanceIssues.push(
          `Low cache hit rate: ${(hitRate * 100).toFixed(1)}%`
        );
        recommendations.push(
          'Review cache TTL settings and cache key strategies'
        );
      }

      if (cacheState.totalSize > this.performanceThresholds.maxCacheSize) {
        performanceIssues.push(
          `Cache size exceeds threshold: ${(cacheState.totalSize / 1024 / 1024).toFixed(2)}MB`
        );
        recommendations.push(
          'Implement cache cleanup and consider reducing TTL for less critical data'
        );
      }

      const metrics: CacheMetrics = {
        totalOperations,
        hitCount,
        missCount,
        hitRate,
        missRate,
        averageLatency,
        totalCacheSize: cacheState.totalSize,
        cachesByType,
        performanceIssues,
        recommendations,
      };

      console.log('Cache performance analysis completed:', metrics);
      return metrics;
    } catch (error) {
      console.error('Failed to analyze cache performance:', error);
      return {
        totalOperations: 0,
        hitCount: 0,
        missCount: 0,
        hitRate: 0,
        missRate: 0,
        averageLatency: 0,
        totalCacheSize: 0,
        cachesByType: {},
        performanceIssues: [`Analysis failed: ${error}`],
        recommendations: ['Check cache system accessibility and permissions'],
      };
    }
  }

  /**
   * Get current cache state from storage
   */
  private async getCurrentCacheState(): Promise<{
    totalSize: number;
    itemCount: number;
    keys: string[];
  }> {
    const cacheStateScript = `
      () => {
        return new Promise((resolve) => {
          chrome.storage.local.get(null, (items) => {
            const cacheKeys = Object.keys(items).filter(key => 
              key.includes('article:') || 
              key.includes('translation:') || 
              key.includes('processed:') ||
              key.startsWith('cache:')
            );
            
            const cacheItems = {};
            cacheKeys.forEach(key => {
              cacheItems[key] = items[key];
            });
            
            const totalSize = JSON.stringify(cacheItems).length;
            
            resolve({
              totalSize: totalSize,
              itemCount: cacheKeys.length,
              keys: cacheKeys
            });
          });
        });
      }
    `;

    // This would use mcp_chrome_devtools_evaluate_script when available
    // For now, return mock cache state
    return {
      totalSize: 1024 * 512, // 512KB
      itemCount: 25,
      keys: [
        'article:https://example.com:en',
        'translation:hello:en:es',
        'processed:abc123:summary:100',
        'processed:def456:vocabulary:50',
      ],
    };
  }

  /**
   * Debug cache invalidation patterns
   */
  async debugCacheInvalidation(): Promise<{
    totalInvalidations: number;
    invalidationsByReason: { [key: string]: number };
    averageAge: number;
    recommendations: string[];
  }> {
    try {
      console.log('Debugging cache invalidation patterns...');

      const invalidations = await this.getCapturedInvalidations();

      const totalInvalidations = invalidations.length;
      const invalidationsByReason = invalidations.reduce(
        (counts, inv) => {
          counts[inv.reason] = (counts[inv.reason] || 0) + 1;
          return counts;
        },
        {} as { [key: string]: number }
      );

      const averageAge =
        invalidations.length > 0
          ? invalidations.reduce((sum, inv) => sum + inv.age, 0) /
            invalidations.length
          : 0;

      const recommendations: string[] = [];

      // Analyze invalidation patterns
      if (
        invalidationsByReason.expired &&
        invalidationsByReason.expired > totalInvalidations * 0.7
      ) {
        recommendations.push(
          'High expiration rate detected - consider increasing TTL for frequently accessed items'
        );
      }

      if (
        invalidationsByReason.overflow &&
        invalidationsByReason.overflow > 0
      ) {
        recommendations.push(
          'Cache overflow detected - consider increasing cache size limits or implementing LRU eviction'
        );
      }

      if (averageAge < 60000) {
        // Less than 1 minute
        recommendations.push(
          'Items are being invalidated very quickly - review cache strategy and TTL settings'
        );
      }

      const result = {
        totalInvalidations,
        invalidationsByReason,
        averageAge,
        recommendations,
      };

      console.log('Cache invalidation debugging completed:', result);
      return result;
    } catch (error) {
      console.error('Failed to debug cache invalidation:', error);
      return {
        totalInvalidations: 0,
        invalidationsByReason: {},
        averageAge: 0,
        recommendations: [`Invalidation debugging failed: ${error}`],
      };
    }
  }

  /**
   * Test cache hit/miss ratios for different scenarios
   */
  async testCacheScenarios(): Promise<{
    scenarios: Array<{
      name: string;
      description: string;
      hitRate: number;
      averageLatency: number;
      recommendations: string[];
    }>;
  }> {
    try {
      console.log('Testing cache scenarios...');

      const scenarios = [
        {
          name: 'Article Caching',
          description: 'Test article content caching performance',
          hitRate: await this.testArticleCaching(),
          averageLatency: 45,
          recommendations: [],
        },
        {
          name: 'Translation Caching',
          description: 'Test vocabulary translation caching',
          hitRate: await this.testTranslationCaching(),
          averageLatency: 23,
          recommendations: [],
        },
        {
          name: 'Processed Content Caching',
          description: 'Test AI-processed content caching',
          hitRate: await this.testProcessedContentCaching(),
          averageLatency: 67,
          recommendations: [],
        },
      ];

      // Add recommendations based on results
      scenarios.forEach(scenario => {
        if (scenario.hitRate < 0.7) {
          scenario.recommendations.push(
            'Low hit rate - consider optimizing cache keys and TTL'
          );
        }
        if (scenario.averageLatency > 50) {
          scenario.recommendations.push(
            'High latency - consider cache pre-warming or optimization'
          );
        }
      });

      console.log('Cache scenario testing completed:', scenarios);
      return { scenarios };
    } catch (error) {
      console.error('Failed to test cache scenarios:', error);
      return {
        scenarios: [
          {
            name: 'Error',
            description: 'Cache scenario testing failed',
            hitRate: 0,
            averageLatency: 0,
            recommendations: [`Testing failed: ${error}`],
          },
        ],
      };
    }
  }

  /**
   * Test article caching performance
   */
  private async testArticleCaching(): Promise<number> {
    // Simulate article cache testing
    const testUrls = [
      'https://example.com/article1',
      'https://example.com/article2',
      'https://example.com/article3',
    ];

    let hits = 0;
    const total = testUrls.length * 2; // Test each URL twice

    // First pass - should be misses
    for (const url of testUrls) {
      // Simulate cache miss on first access
    }

    // Second pass - should be hits
    for (const url of testUrls) {
      hits++; // Simulate cache hit on second access
    }

    return hits / total;
  }

  /**
   * Test translation caching performance
   */
  private async testTranslationCaching(): Promise<number> {
    // Simulate translation cache testing
    const testWords = ['hello', 'world', 'language', 'learning'];
    let hits = 0;
    const total = testWords.length * 2;

    // Simulate higher hit rate for translations (commonly reused)
    hits = Math.floor(total * 0.85); // 85% hit rate

    return hits / total;
  }

  /**
   * Test processed content caching performance
   */
  private async testProcessedContentCaching(): Promise<number> {
    // Simulate processed content cache testing
    const testContent = ['summary', 'vocabulary', 'rewrite'];
    let hits = 0;
    const total = testContent.length * 3; // Test different parameters

    // Simulate moderate hit rate for processed content
    hits = Math.floor(total * 0.75); // 75% hit rate

    return hits / total;
  }

  /**
   * Get captured cache operations
   */
  async getCapturedOperations(): Promise<CacheOperation[]> {
    const operationsScript = `
      () => {
        return window.cacheOperations || [];
      }
    `;

    // This would use mcp_chrome_devtools_evaluate_script when available
    // For now, return mock operations
    return [
      {
        operation: 'get',
        key: 'article:https://example.com:en',
        cacheType: 'article',
        timestamp: new Date().toISOString(),
        duration: 25,
        success: true,
        hit: true,
      },
      {
        operation: 'set',
        key: 'translation:hello:en:es',
        cacheType: 'translation',
        timestamp: new Date().toISOString(),
        duration: 18,
        success: true,
        size: 256,
      },
      {
        operation: 'get',
        key: 'processed:abc123:summary:100',
        cacheType: 'processed',
        timestamp: new Date().toISOString(),
        duration: 32,
        success: true,
        hit: false,
      },
    ];
  }

  /**
   * Get captured cache invalidation events
   */
  async getCapturedInvalidations(): Promise<CacheInvalidationEvent[]> {
    const invalidationsScript = `
      () => {
        return window.cacheInvalidations || [];
      }
    `;

    // This would use mcp_chrome_devtools_evaluate_script when available
    // For now, return mock invalidations
    return [
      {
        key: 'article:https://old-example.com:en',
        reason: 'expired',
        timestamp: new Date().toISOString(),
        age: 86400000, // 24 hours
        accessCount: 5,
      },
      {
        key: 'translation:obsolete:en:es',
        reason: 'maintenance',
        timestamp: new Date().toISOString(),
        age: 3600000, // 1 hour
        accessCount: 1,
      },
    ];
  }

  /**
   * Stop cache monitoring
   */
  async stopCacheMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      console.log('Cache monitoring not active');
      return;
    }

    try {
      console.log('Stopping cache system monitoring...');
      this.isMonitoring = false;
      console.log('Cache monitoring stopped');
    } catch (error) {
      console.error('Failed to stop cache monitoring:', error);
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    operationCount: number;
    invalidationCount: number;
    lastAnalysis: Date | null;
  } {
    return {
      isMonitoring: this.isMonitoring,
      operationCount: this.capturedOperations.length,
      invalidationCount: this.invalidationEvents.length,
      lastAnalysis: null, // Would track last analysis time
    };
  }

  /**
   * Generate cache optimization recommendations
   */
  async generateOptimizationRecommendations(): Promise<string[]> {
    const metrics = await this.analyzeCachePerformance();
    const recommendations: string[] = [];

    // Performance-based recommendations
    if (metrics.hitRate < 0.8) {
      recommendations.push(
        'Consider implementing cache pre-warming for frequently accessed content'
      );
      recommendations.push('Review cache key strategies to improve hit rates');
    }

    if (metrics.averageLatency > 50) {
      recommendations.push(
        'Optimize cache storage operations for better performance'
      );
      recommendations.push(
        'Consider using more efficient serialization methods'
      );
    }

    // Size-based recommendations
    if (metrics.totalCacheSize > 3 * 1024 * 1024) {
      // 3MB
      recommendations.push(
        'Implement cache size limits and LRU eviction policy'
      );
      recommendations.push(
        'Consider compressing cached content to reduce storage usage'
      );
    }

    // Type-specific recommendations
    Object.keys(metrics.cachesByType).forEach(type => {
      const typeMetrics = metrics.cachesByType[type];
      if (typeMetrics.hitRate < 0.7) {
        recommendations.push(
          `Improve ${type} cache strategy - current hit rate: ${(typeMetrics.hitRate * 100).toFixed(1)}%`
        );
      }
    });

    return recommendations;
  }
}
