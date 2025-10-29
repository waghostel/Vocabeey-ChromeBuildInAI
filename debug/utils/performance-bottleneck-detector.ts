/**
 * Performance Bottleneck Detector
 *
 * Implements performance monitoring across Chrome extension components,
 * creates bottleneck detection algorithms, and provides performance optimization recommendations.
 */

export interface PerformanceMetrics {
  timestamp: Date;
  context: ExtensionContext;
  memoryUsage: MemoryMetrics;
  cpuUsage: CPUMetrics;
  networkMetrics: NetworkMetrics;
  messagePassingMetrics: MessagePassingMetrics;
  renderingMetrics?: RenderingMetrics;
  aiProcessingMetrics?: AIProcessingMetrics;
}

export interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryLeaks: MemoryLeak[];
  garbageCollectionEvents: GCEvent[];
}

export interface CPUMetrics {
  cpuUsage: number; // Percentage
  longTasks: LongTask[];
  scriptExecutionTime: number;
  idleTime: number;
  blockingOperations: BlockingOperation[];
}

export interface NetworkMetrics {
  totalRequests: number;
  failedRequests: number;
  averageLatency: number;
  slowRequests: SlowRequest[];
  bandwidthUsage: number;
}

export interface MessagePassingMetrics {
  totalMessages: number;
  averageLatency: number;
  failedMessages: number;
  slowMessages: SlowMessage[];
  queueBacklog: number;
}

export interface RenderingMetrics {
  frameRate: number;
  layoutThrashing: number;
  paintEvents: number;
  reflows: number;
  domSize: number;
}

export interface AIProcessingMetrics {
  processingTime: number;
  queueLength: number;
  cacheHitRate: number;
  modelSwitches: number;
  failureRate: number;
}

export interface PerformanceBottleneck {
  id: string;
  timestamp: Date;
  context: ExtensionContext;
  bottleneckType: BottleneckType;
  severity: BottleneckSeverity;
  description: string;
  metrics: any;
  impact: PerformanceImpact;
  rootCause: string;
  recommendations: OptimizationRecommendation[];
  estimatedFixTime: number; // minutes
}

export interface PerformanceImpact {
  userExperience: 'none' | 'minimal' | 'moderate' | 'severe';
  systemResources: 'low' | 'medium' | 'high' | 'critical';
  functionality: 'unaffected' | 'degraded' | 'limited' | 'broken';
  estimatedSlowdown: number; // percentage
}

export interface OptimizationRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'memory' | 'cpu' | 'network' | 'algorithm' | 'architecture';
  title: string;
  description: string;
  implementation: string;
  estimatedImpact: string;
  effort: 'low' | 'medium' | 'high';
  dependencies: string[];
}

export interface BottleneckDetectionResult {
  detectionId: string;
  timestamp: Date;
  monitoringDuration: number;
  totalBottlenecks: number;
  criticalBottlenecks: number;
  bottlenecksByContext: Record<ExtensionContext, number>;
  bottlenecksByType: Record<BottleneckType, number>;
  overallPerformanceScore: number; // 0-100
  recommendations: OptimizationRecommendation[];
  detectedBottlenecks: PerformanceBottleneck[];
}

export type ExtensionContext =
  | 'service-worker'
  | 'content-script'
  | 'offscreen'
  | 'ui';
export type BottleneckType =
  | 'memory-leak'
  | 'cpu-intensive'
  | 'network-latency'
  | 'message-queue'
  | 'rendering'
  | 'ai-processing'
  | 'storage-io'
  | 'algorithm-inefficiency';
export type BottleneckSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface MemoryLeak {
  id: string;
  detectedAt: Date;
  growthRate: number; // bytes per second
  suspectedSource: string;
  currentSize: number;
}

export interface GCEvent {
  timestamp: Date;
  duration: number;
  freedMemory: number;
  type: 'minor' | 'major';
}

export interface LongTask {
  startTime: number;
  duration: number;
  source: string;
  blocking: boolean;
}

export interface BlockingOperation {
  operation: string;
  duration: number;
  context: string;
  impact: 'ui-freeze' | 'delayed-response' | 'resource-contention';
}

export interface SlowRequest {
  url: string;
  method: string;
  duration: number;
  status: number;
  size: number;
}

export interface SlowMessage {
  messageType: string;
  source: ExtensionContext;
  target: ExtensionContext;
  latency: number;
  payloadSize: number;
}

export class PerformanceBottleneckDetector {
  private performanceMetrics: Map<string, PerformanceMetrics[]> = new Map();
  private detectedBottlenecks: Map<string, PerformanceBottleneck> = new Map();
  private isMonitoring: boolean = false;
  private monitoringStartTime: Date | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private contextPages: Map<ExtensionContext, number> = new Map();

  /**
   * Start comprehensive performance monitoring across all extension contexts
   */
  async startPerformanceMonitoring(intervalMs: number = 1000): Promise<void> {
    this.isMonitoring = true;
    this.monitoringStartTime = new Date();
    this.performanceMetrics.clear();
    this.detectedBottlenecks.clear();

    console.log(
      '[PerformanceBottleneckDetector] Started performance monitoring'
    );

    // Initialize context monitoring
    await this.initializeContextMonitoring();

    // Start periodic performance collection
    this.monitoringInterval = setInterval(async () => {
      await this.collectPerformanceMetrics();
      await this.analyzeBottlenecks();
    }, intervalMs);
  }

  /**
   * Stop monitoring and generate comprehensive bottleneck report
   */
  async stopPerformanceMonitoring(): Promise<BottleneckDetectionResult> {
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    const result = await this.generateBottleneckReport();

    console.log(
      '[PerformanceBottleneckDetector] Stopped monitoring. Generated report:',
      result.detectionId
    );
    return result;
  }

  /**
   * Detect performance bottlenecks in a specific context
   */
  async detectContextBottlenecks(
    context: ExtensionContext
  ): Promise<PerformanceBottleneck[]> {
    console.log(
      `[PerformanceBottleneckDetector] Detecting bottlenecks in ${context}`
    );

    const contextMetrics = this.performanceMetrics.get(context) || [];
    const bottlenecks: PerformanceBottleneck[] = [];

    if (contextMetrics.length === 0) {
      console.warn(
        `[PerformanceBottleneckDetector] No metrics available for ${context}`
      );
      return bottlenecks;
    }

    // Analyze different types of bottlenecks
    bottlenecks.push(
      ...(await this.detectMemoryBottlenecks(context, contextMetrics))
    );
    bottlenecks.push(
      ...(await this.detectCPUBottlenecks(context, contextMetrics))
    );
    bottlenecks.push(
      ...(await this.detectNetworkBottlenecks(context, contextMetrics))
    );
    bottlenecks.push(
      ...(await this.detectMessagePassingBottlenecks(context, contextMetrics))
    );

    // Context-specific bottlenecks
    if (context === 'ui' || context === 'content-script') {
      bottlenecks.push(
        ...(await this.detectRenderingBottlenecks(context, contextMetrics))
      );
    }

    if (context === 'offscreen') {
      bottlenecks.push(
        ...(await this.detectAIProcessingBottlenecks(context, contextMetrics))
      );
    }

    return bottlenecks;
  }

  /**
   * Monitor performance across components for cross-component bottlenecks
   */
  async monitorCrossComponentPerformance(
    duration: number = 60000
  ): Promise<PerformanceBottleneck[]> {
    console.log(
      `[PerformanceBottleneckDetector] Monitoring cross-component performance for ${duration}ms`
    );

    const startTime = Date.now();
    const crossComponentBottlenecks: PerformanceBottleneck[] = [];

    while (Date.now() - startTime < duration && this.isMonitoring) {
      // Collect metrics from all contexts
      await this.collectPerformanceMetrics();

      // Analyze cross-component interactions
      const interactionBottlenecks =
        await this.analyzeCrossComponentInteractions();
      crossComponentBottlenecks.push(...interactionBottlenecks);

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return crossComponentBottlenecks;
  }

  /**
   * Generate performance optimization recommendations
   */
  async generateOptimizationRecommendations(): Promise<
    OptimizationRecommendation[]
  > {
    console.log(
      '[PerformanceBottleneckDetector] Generating optimization recommendations'
    );

    const recommendations: OptimizationRecommendation[] = [];
    const bottlenecks = Array.from(this.detectedBottlenecks.values());

    // Group bottlenecks by type and severity
    const bottleneckGroups = this.groupBottlenecksByType(bottlenecks);

    for (const [type, typeBottlenecks] of bottleneckGroups) {
      const typeRecommendations = this.generateTypeSpecificRecommendations(
        type,
        typeBottlenecks
      );
      recommendations.push(...typeRecommendations);
    }

    // Add general performance recommendations
    recommendations.push(...this.generateGeneralRecommendations(bottlenecks));

    // Sort by priority and impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async initializeContextMonitoring(): Promise<void> {
    try {
      // Get available pages/contexts
      const pages = await mcp_chrome_devtools_list_pages();

      for (const page of pages) {
        const contextType = this.identifyContextType(page.url);
        if (contextType) {
          this.contextPages.set(contextType, page.index);
          this.performanceMetrics.set(contextType, []);
        }
      }
    } catch (error) {
      console.warn(
        '[PerformanceBottleneckDetector] Failed to initialize context monitoring:',
        error
      );
    }
  }

  private async collectPerformanceMetrics(): Promise<void> {
    for (const [context, pageIndex] of this.contextPages) {
      try {
        await mcp_chrome_devtools_select_page({ pageIdx: pageIndex });
        const metrics = await this.collectContextMetrics(context);

        if (metrics) {
          const contextMetrics = this.performanceMetrics.get(context) || [];
          contextMetrics.push(metrics);

          // Keep only last 100 metrics to prevent memory issues
          if (contextMetrics.length > 100) {
            contextMetrics.splice(0, contextMetrics.length - 100);
          }

          this.performanceMetrics.set(context, contextMetrics);
        }
      } catch (error) {
        console.warn(
          `[PerformanceBottleneckDetector] Failed to collect metrics for ${context}:`,
          error
        );
      }
    }
  }

  private async collectContextMetrics(
    context: ExtensionContext
  ): Promise<PerformanceMetrics | null> {
    try {
      const metricsScript = `
        () => {
          const metrics = {
            timestamp: Date.now(),
            memory: performance.memory ? {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null,
            timing: performance.timing ? {
              navigationStart: performance.timing.navigationStart,
              loadEventEnd: performance.timing.loadEventEnd,
              domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd
            } : null,
            navigation: performance.navigation ? {
              type: performance.navigation.type,
              redirectCount: performance.navigation.redirectCount
            } : null
          };
          
          // Add context-specific metrics
          if (typeof window !== 'undefined') {
            metrics.dom = {
              elementCount: document.querySelectorAll('*').length,
              scriptCount: document.scripts.length,
              styleSheetCount: document.styleSheets.length
            };
          }
          
          return metrics;
        }
      `;

      const rawMetrics = await mcp_chrome_devtools_evaluate_script({
        function: metricsScript,
      });

      if (!rawMetrics) return null;

      // Transform raw metrics into structured format
      const performanceMetrics: PerformanceMetrics = {
        timestamp: new Date(rawMetrics.timestamp || Date.now()),
        context,
        memoryUsage: {
          usedJSHeapSize: rawMetrics.memory?.usedJSHeapSize || 0,
          totalJSHeapSize: rawMetrics.memory?.totalJSHeapSize || 0,
          jsHeapSizeLimit: rawMetrics.memory?.jsHeapSizeLimit || 0,
          memoryLeaks: [],
          garbageCollectionEvents: [],
        },
        cpuUsage: {
          cpuUsage: 0, // Would need more sophisticated measurement
          longTasks: [],
          scriptExecutionTime: 0,
          idleTime: 0,
          blockingOperations: [],
        },
        networkMetrics: {
          totalRequests: 0,
          failedRequests: 0,
          averageLatency: 0,
          slowRequests: [],
          bandwidthUsage: 0,
        },
        messagePassingMetrics: {
          totalMessages: 0,
          averageLatency: 0,
          failedMessages: 0,
          slowMessages: [],
          queueBacklog: 0,
        },
      };

      // Add context-specific metrics
      if (context === 'ui' || context === 'content-script') {
        performanceMetrics.renderingMetrics = {
          frameRate: 60, // Default assumption
          layoutThrashing: 0,
          paintEvents: 0,
          reflows: 0,
          domSize: rawMetrics.dom?.elementCount || 0,
        };
      }

      if (context === 'offscreen') {
        performanceMetrics.aiProcessingMetrics = {
          processingTime: 0,
          queueLength: 0,
          cacheHitRate: 0.8, // Default assumption
          modelSwitches: 0,
          failureRate: 0,
        };
      }

      return performanceMetrics;
    } catch (error) {
      console.warn(
        `[PerformanceBottleneckDetector] Failed to collect metrics for ${context}:`,
        error
      );
      return null;
    }
  }

  private async analyzeBottlenecks(): Promise<void> {
    for (const [context, metrics] of this.performanceMetrics) {
      if (metrics.length < 2) continue; // Need at least 2 data points

      const recentMetrics = metrics.slice(-10); // Analyze last 10 metrics
      const bottlenecks = await this.detectContextBottlenecks(context);

      for (const bottleneck of bottlenecks) {
        this.detectedBottlenecks.set(bottleneck.id, bottleneck);
      }
    }
  }

  private async detectMemoryBottlenecks(
    context: ExtensionContext,
    metrics: PerformanceMetrics[]
  ): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    if (metrics.length < 2) return bottlenecks;

    const recentMetrics = metrics.slice(-5);
    const memoryUsages = recentMetrics.map(m => m.memoryUsage.usedJSHeapSize);

    // Check for memory growth trend
    const memoryGrowth = this.calculateGrowthTrend(memoryUsages);
    if (memoryGrowth > 1024 * 1024) {
      // 1MB growth per measurement
      bottlenecks.push({
        id: this.generateBottleneckId(),
        timestamp: new Date(),
        context,
        bottleneckType: 'memory-leak',
        severity: memoryGrowth > 10 * 1024 * 1024 ? 'critical' : 'high',
        description: `Memory leak detected: ${(memoryGrowth / 1024 / 1024).toFixed(1)}MB growth trend`,
        metrics: {
          memoryGrowth,
          currentUsage: memoryUsages[memoryUsages.length - 1],
        },
        impact: {
          userExperience:
            memoryGrowth > 50 * 1024 * 1024 ? 'severe' : 'moderate',
          systemResources: 'high',
          functionality: 'degraded',
          estimatedSlowdown: Math.min(50, (memoryGrowth / (1024 * 1024)) * 2),
        },
        rootCause:
          'Potential memory leak in event listeners, closures, or DOM references',
        recommendations:
          this.generateMemoryOptimizationRecommendations(memoryGrowth),
        estimatedFixTime: 60,
      });
    }

    // Check for high memory usage
    const currentMemory = memoryUsages[memoryUsages.length - 1];
    const memoryLimit =
      recentMetrics[recentMetrics.length - 1].memoryUsage.jsHeapSizeLimit;
    const memoryUsagePercent = (currentMemory / memoryLimit) * 100;

    if (memoryUsagePercent > 80) {
      bottlenecks.push({
        id: this.generateBottleneckId(),
        timestamp: new Date(),
        context,
        bottleneckType: 'memory-leak',
        severity: memoryUsagePercent > 95 ? 'critical' : 'high',
        description: `High memory usage: ${memoryUsagePercent.toFixed(1)}% of heap limit`,
        metrics: { memoryUsagePercent, currentMemory, memoryLimit },
        impact: {
          userExperience: memoryUsagePercent > 95 ? 'severe' : 'moderate',
          systemResources: 'critical',
          functionality: memoryUsagePercent > 95 ? 'limited' : 'degraded',
          estimatedSlowdown: Math.min(80, (memoryUsagePercent - 50) * 2),
        },
        rootCause:
          'High memory consumption from large data structures or memory leaks',
        recommendations:
          this.generateMemoryOptimizationRecommendations(currentMemory),
        estimatedFixTime: 45,
      });
    }

    return bottlenecks;
  }

  private async detectCPUBottlenecks(
    context: ExtensionContext,
    metrics: PerformanceMetrics[]
  ): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    // For CPU bottlenecks, we'd need more sophisticated measurement
    // This is a simplified implementation

    const recentMetrics = metrics.slice(-5);

    // Check for blocking operations (simplified)
    for (const metric of recentMetrics) {
      if (metric.cpuUsage.blockingOperations.length > 0) {
        const totalBlockingTime = metric.cpuUsage.blockingOperations.reduce(
          (sum, op) => sum + op.duration,
          0
        );

        if (totalBlockingTime > 100) {
          // 100ms of blocking
          bottlenecks.push({
            id: this.generateBottleneckId(),
            timestamp: new Date(),
            context,
            bottleneckType: 'cpu-intensive',
            severity: totalBlockingTime > 500 ? 'high' : 'medium',
            description: `CPU-intensive operations detected: ${totalBlockingTime}ms blocking time`,
            metrics: {
              blockingTime: totalBlockingTime,
              operations: metric.cpuUsage.blockingOperations,
            },
            impact: {
              userExperience: totalBlockingTime > 500 ? 'severe' : 'moderate',
              systemResources: 'high',
              functionality: 'degraded',
              estimatedSlowdown: Math.min(60, totalBlockingTime / 10),
            },
            rootCause: 'Synchronous operations blocking the main thread',
            recommendations:
              this.generateCPUOptimizationRecommendations(totalBlockingTime),
            estimatedFixTime: 30,
          });
        }
      }
    }

    return bottlenecks;
  }

  private async detectNetworkBottlenecks(
    context: ExtensionContext,
    metrics: PerformanceMetrics[]
  ): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    const recentMetrics = metrics.slice(-5);

    for (const metric of recentMetrics) {
      const networkMetrics = metric.networkMetrics;

      // Check for high latency
      if (networkMetrics.averageLatency > 2000) {
        // 2 seconds
        bottlenecks.push({
          id: this.generateBottleneckId(),
          timestamp: new Date(),
          context,
          bottleneckType: 'network-latency',
          severity: networkMetrics.averageLatency > 5000 ? 'high' : 'medium',
          description: `High network latency: ${networkMetrics.averageLatency}ms average`,
          metrics: {
            averageLatency: networkMetrics.averageLatency,
            slowRequests: networkMetrics.slowRequests,
          },
          impact: {
            userExperience:
              networkMetrics.averageLatency > 5000 ? 'severe' : 'moderate',
            systemResources: 'medium',
            functionality: 'degraded',
            estimatedSlowdown: Math.min(
              70,
              networkMetrics.averageLatency / 100
            ),
          },
          rootCause: 'Slow network requests or inefficient API calls',
          recommendations:
            this.generateNetworkOptimizationRecommendations(networkMetrics),
          estimatedFixTime: 45,
        });
      }

      // Check for high failure rate
      const failureRate =
        networkMetrics.totalRequests > 0
          ? (networkMetrics.failedRequests / networkMetrics.totalRequests) * 100
          : 0;

      if (failureRate > 10) {
        // 10% failure rate
        bottlenecks.push({
          id: this.generateBottleneckId(),
          timestamp: new Date(),
          context,
          bottleneckType: 'network-latency',
          severity: failureRate > 25 ? 'high' : 'medium',
          description: `High network failure rate: ${failureRate.toFixed(1)}%`,
          metrics: {
            failureRate,
            failedRequests: networkMetrics.failedRequests,
            totalRequests: networkMetrics.totalRequests,
          },
          impact: {
            userExperience: failureRate > 25 ? 'severe' : 'moderate',
            systemResources: 'low',
            functionality: failureRate > 50 ? 'limited' : 'degraded',
            estimatedSlowdown: Math.min(40, failureRate),
          },
          rootCause: 'Network connectivity issues or server problems',
          recommendations:
            this.generateNetworkReliabilityRecommendations(failureRate),
          estimatedFixTime: 30,
        });
      }
    }

    return bottlenecks;
  }

  private async detectMessagePassingBottlenecks(
    context: ExtensionContext,
    metrics: PerformanceMetrics[]
  ): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    const recentMetrics = metrics.slice(-5);

    for (const metric of recentMetrics) {
      const messageMetrics = metric.messagePassingMetrics;

      // Check for message queue backlog
      if (messageMetrics.queueBacklog > 10) {
        bottlenecks.push({
          id: this.generateBottleneckId(),
          timestamp: new Date(),
          context,
          bottleneckType: 'message-queue',
          severity: messageMetrics.queueBacklog > 50 ? 'high' : 'medium',
          description: `Message queue backlog: ${messageMetrics.queueBacklog} pending messages`,
          metrics: {
            queueBacklog: messageMetrics.queueBacklog,
            slowMessages: messageMetrics.slowMessages,
          },
          impact: {
            userExperience:
              messageMetrics.queueBacklog > 50 ? 'severe' : 'moderate',
            systemResources: 'medium',
            functionality: 'degraded',
            estimatedSlowdown: Math.min(50, messageMetrics.queueBacklog * 2),
          },
          rootCause: 'Message processing slower than message generation rate',
          recommendations:
            this.generateMessagePassingOptimizationRecommendations(
              messageMetrics
            ),
          estimatedFixTime: 40,
        });
      }

      // Check for high message latency
      if (messageMetrics.averageLatency > 200) {
        // 200ms
        bottlenecks.push({
          id: this.generateBottleneckId(),
          timestamp: new Date(),
          context,
          bottleneckType: 'message-queue',
          severity: messageMetrics.averageLatency > 1000 ? 'high' : 'medium',
          description: `High message passing latency: ${messageMetrics.averageLatency}ms average`,
          metrics: {
            averageLatency: messageMetrics.averageLatency,
            slowMessages: messageMetrics.slowMessages,
          },
          impact: {
            userExperience:
              messageMetrics.averageLatency > 1000 ? 'severe' : 'moderate',
            systemResources: 'low',
            functionality: 'degraded',
            estimatedSlowdown: Math.min(30, messageMetrics.averageLatency / 50),
          },
          rootCause: 'Inefficient message serialization or processing',
          recommendations:
            this.generateMessageLatencyOptimizationRecommendations(
              messageMetrics.averageLatency
            ),
          estimatedFixTime: 35,
        });
      }
    }

    return bottlenecks;
  }

  private async detectRenderingBottlenecks(
    context: ExtensionContext,
    metrics: PerformanceMetrics[]
  ): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    const recentMetrics = metrics.slice(-5);

    for (const metric of recentMetrics) {
      const renderingMetrics = metric.renderingMetrics;
      if (!renderingMetrics) continue;

      // Check for low frame rate
      if (renderingMetrics.frameRate < 30) {
        bottlenecks.push({
          id: this.generateBottleneckId(),
          timestamp: new Date(),
          context,
          bottleneckType: 'rendering',
          severity: renderingMetrics.frameRate < 15 ? 'high' : 'medium',
          description: `Low frame rate: ${renderingMetrics.frameRate} FPS`,
          metrics: {
            frameRate: renderingMetrics.frameRate,
            layoutThrashing: renderingMetrics.layoutThrashing,
          },
          impact: {
            userExperience:
              renderingMetrics.frameRate < 15 ? 'severe' : 'moderate',
            systemResources: 'high',
            functionality: 'degraded',
            estimatedSlowdown: Math.min(
              60,
              (60 - renderingMetrics.frameRate) * 2
            ),
          },
          rootCause: 'Heavy DOM manipulation or inefficient CSS',
          recommendations:
            this.generateRenderingOptimizationRecommendations(renderingMetrics),
          estimatedFixTime: 50,
        });
      }

      // Check for large DOM size
      if (renderingMetrics.domSize > 5000) {
        bottlenecks.push({
          id: this.generateBottleneckId(),
          timestamp: new Date(),
          context,
          bottleneckType: 'rendering',
          severity: renderingMetrics.domSize > 10000 ? 'high' : 'medium',
          description: `Large DOM size: ${renderingMetrics.domSize} elements`,
          metrics: {
            domSize: renderingMetrics.domSize,
            reflows: renderingMetrics.reflows,
          },
          impact: {
            userExperience:
              renderingMetrics.domSize > 10000 ? 'severe' : 'moderate',
            systemResources: 'high',
            functionality: 'degraded',
            estimatedSlowdown: Math.min(
              40,
              (renderingMetrics.domSize - 1000) / 200
            ),
          },
          rootCause: 'Excessive DOM elements affecting rendering performance',
          recommendations: this.generateDOMOptimizationRecommendations(
            renderingMetrics.domSize
          ),
          estimatedFixTime: 60,
        });
      }
    }

    return bottlenecks;
  }

  private async detectAIProcessingBottlenecks(
    context: ExtensionContext,
    metrics: PerformanceMetrics[]
  ): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    const recentMetrics = metrics.slice(-5);

    for (const metric of recentMetrics) {
      const aiMetrics = metric.aiProcessingMetrics;
      if (!aiMetrics) continue;

      // Check for long processing times
      if (aiMetrics.processingTime > 10000) {
        // 10 seconds
        bottlenecks.push({
          id: this.generateBottleneckId(),
          timestamp: new Date(),
          context,
          bottleneckType: 'ai-processing',
          severity: aiMetrics.processingTime > 30000 ? 'high' : 'medium',
          description: `Long AI processing time: ${(aiMetrics.processingTime / 1000).toFixed(1)}s`,
          metrics: {
            processingTime: aiMetrics.processingTime,
            queueLength: aiMetrics.queueLength,
          },
          impact: {
            userExperience:
              aiMetrics.processingTime > 30000 ? 'severe' : 'moderate',
            systemResources: 'high',
            functionality: 'degraded',
            estimatedSlowdown: Math.min(70, aiMetrics.processingTime / 500),
          },
          rootCause: 'Inefficient AI model usage or large input processing',
          recommendations:
            this.generateAIOptimizationRecommendations(aiMetrics),
          estimatedFixTime: 45,
        });
      }

      // Check for low cache hit rate
      if (aiMetrics.cacheHitRate < 0.5) {
        // 50%
        bottlenecks.push({
          id: this.generateBottleneckId(),
          timestamp: new Date(),
          context,
          bottleneckType: 'ai-processing',
          severity: aiMetrics.cacheHitRate < 0.2 ? 'high' : 'medium',
          description: `Low AI cache hit rate: ${(aiMetrics.cacheHitRate * 100).toFixed(1)}%`,
          metrics: {
            cacheHitRate: aiMetrics.cacheHitRate,
            processingTime: aiMetrics.processingTime,
          },
          impact: {
            userExperience:
              aiMetrics.cacheHitRate < 0.2 ? 'severe' : 'moderate',
            systemResources: 'high',
            functionality: 'degraded',
            estimatedSlowdown: Math.min(
              50,
              (0.8 - aiMetrics.cacheHitRate) * 100
            ),
          },
          rootCause: 'Ineffective caching strategy for AI processing results',
          recommendations: this.generateCacheOptimizationRecommendations(
            aiMetrics.cacheHitRate
          ),
          estimatedFixTime: 30,
        });
      }
    }

    return bottlenecks;
  }

  private async analyzeCrossComponentInteractions(): Promise<
    PerformanceBottleneck[]
  > {
    const bottlenecks: PerformanceBottleneck[] = [];

    // Analyze interactions between different contexts
    const allMetrics = Array.from(this.performanceMetrics.entries());

    // Check for synchronized performance degradation across contexts
    const degradationPattern = this.detectSynchronizedDegradation(allMetrics);
    if (degradationPattern) {
      bottlenecks.push({
        id: this.generateBottleneckId(),
        timestamp: new Date(),
        context: 'service-worker', // Primary context for cross-component issues
        bottleneckType: 'algorithm-inefficiency',
        severity: 'high',
        description:
          'Synchronized performance degradation across multiple contexts',
        metrics: degradationPattern,
        impact: {
          userExperience: 'severe',
          systemResources: 'critical',
          functionality: 'limited',
          estimatedSlowdown: 60,
        },
        rootCause:
          'Cross-component resource contention or inefficient coordination',
        recommendations:
          this.generateCrossComponentOptimizationRecommendations(),
        estimatedFixTime: 90,
      });
    }

    return bottlenecks;
  }

  private detectSynchronizedDegradation(
    allMetrics: [ExtensionContext, PerformanceMetrics[]][]
  ): any | null {
    // Simplified implementation - would need more sophisticated analysis
    const recentTimeWindow = Date.now() - 30000; // Last 30 seconds

    let degradedContexts = 0;

    for (const [context, metrics] of allMetrics) {
      const recentMetrics = metrics.filter(
        m => m.timestamp.getTime() > recentTimeWindow
      );
      if (recentMetrics.length < 2) continue;

      // Check for memory growth in this context
      const memoryGrowth = this.calculateGrowthTrend(
        recentMetrics.map(m => m.memoryUsage.usedJSHeapSize)
      );

      if (memoryGrowth > 5 * 1024 * 1024) {
        // 5MB growth
        degradedContexts++;
      }
    }

    // If more than half the contexts show degradation, it's likely a cross-component issue
    if (degradedContexts > allMetrics.length / 2) {
      return { degradedContexts, totalContexts: allMetrics.length };
    }

    return null;
  }

  private calculateGrowthTrend(values: number[]): number {
    if (values.length < 2) return 0;

    // Simple linear regression to calculate growth trend
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + index * val, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squared indices

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private groupBottlenecksByType(
    bottlenecks: PerformanceBottleneck[]
  ): Map<BottleneckType, PerformanceBottleneck[]> {
    const groups = new Map<BottleneckType, PerformanceBottleneck[]>();

    for (const bottleneck of bottlenecks) {
      const existing = groups.get(bottleneck.bottleneckType) || [];
      existing.push(bottleneck);
      groups.set(bottleneck.bottleneckType, existing);
    }

    return groups;
  }

  private generateTypeSpecificRecommendations(
    type: BottleneckType,
    bottlenecks: PerformanceBottleneck[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    switch (type) {
      case 'memory-leak':
        recommendations.push({
          priority: 'high',
          category: 'memory',
          title: 'Fix Memory Leaks',
          description: `${bottlenecks.length} memory leak(s) detected across contexts`,
          implementation:
            'Review event listeners, closures, and DOM references for proper cleanup',
          estimatedImpact: 'Reduce memory usage by 40-60%',
          effort: 'medium',
          dependencies: ['memory profiling tools', 'code review'],
        });
        break;

      case 'cpu-intensive':
        recommendations.push({
          priority: 'high',
          category: 'cpu',
          title: 'Optimize CPU-Intensive Operations',
          description: `${bottlenecks.length} CPU bottleneck(s) causing thread blocking`,
          implementation:
            'Move heavy computations to web workers or use async/await patterns',
          estimatedImpact: 'Reduce blocking time by 70-80%',
          effort: 'medium',
          dependencies: ['web worker implementation', 'async refactoring'],
        });
        break;

      case 'network-latency':
        recommendations.push({
          priority: 'medium',
          category: 'network',
          title: 'Optimize Network Performance',
          description: `${bottlenecks.length} network performance issue(s) detected`,
          implementation:
            'Implement request caching, connection pooling, and retry logic',
          estimatedImpact: 'Reduce network latency by 30-50%',
          effort: 'medium',
          dependencies: ['caching infrastructure', 'network monitoring'],
        });
        break;

      case 'ai-processing':
        recommendations.push({
          priority: 'high',
          category: 'algorithm',
          title: 'Optimize AI Processing',
          description: `${bottlenecks.length} AI processing bottleneck(s) affecting performance`,
          implementation:
            'Implement result caching, batch processing, and model optimization',
          estimatedImpact: 'Reduce AI processing time by 50-70%',
          effort: 'high',
          dependencies: ['AI service optimization', 'caching system'],
        });
        break;
    }

    return recommendations;
  }

  private generateGeneralRecommendations(
    bottlenecks: PerformanceBottleneck[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    const criticalBottlenecks = bottlenecks.filter(
      b => b.severity === 'critical'
    );
    if (criticalBottlenecks.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'architecture',
        title: 'Address Critical Performance Issues',
        description: `${criticalBottlenecks.length} critical performance bottlenecks require immediate attention`,
        implementation:
          'Prioritize fixing critical bottlenecks before implementing new features',
        estimatedImpact:
          'Prevent system instability and user experience degradation',
        effort: 'high',
        dependencies: [
          'performance monitoring',
          'dedicated optimization sprint',
        ],
      });
    }

    if (bottlenecks.length > 10) {
      recommendations.push({
        priority: 'medium',
        category: 'architecture',
        title: 'Implement Performance Monitoring',
        description:
          'High number of performance issues suggests need for continuous monitoring',
        implementation:
          'Set up automated performance monitoring and alerting system',
        estimatedImpact:
          'Early detection and prevention of performance regressions',
        effort: 'medium',
        dependencies: ['monitoring infrastructure', 'alerting system'],
      });
    }

    return recommendations;
  }

  private generateMemoryOptimizationRecommendations(
    memoryIssue: number
  ): OptimizationRecommendation[] {
    return [
      {
        priority: 'high',
        category: 'memory',
        title: 'Implement Memory Cleanup',
        description: 'Add proper cleanup for event listeners and references',
        implementation: 'Review and fix memory leaks in component lifecycle',
        estimatedImpact: 'Reduce memory usage by 40-60%',
        effort: 'medium',
        dependencies: ['memory profiling'],
      },
    ];
  }

  private generateCPUOptimizationRecommendations(
    blockingTime: number
  ): OptimizationRecommendation[] {
    return [
      {
        priority: 'high',
        category: 'cpu',
        title: 'Reduce Main Thread Blocking',
        description: 'Move heavy operations off the main thread',
        implementation:
          'Use web workers or async processing for heavy computations',
        estimatedImpact: 'Reduce blocking time by 70-80%',
        effort: 'medium',
        dependencies: ['web worker setup'],
      },
    ];
  }

  private generateNetworkOptimizationRecommendations(
    networkMetrics: NetworkMetrics
  ): OptimizationRecommendation[] {
    return [
      {
        priority: 'medium',
        category: 'network',
        title: 'Optimize Network Requests',
        description: 'Implement caching and request optimization',
        implementation:
          'Add request caching, connection pooling, and retry logic',
        estimatedImpact: 'Reduce network latency by 30-50%',
        effort: 'medium',
        dependencies: ['caching system'],
      },
    ];
  }

  private generateNetworkReliabilityRecommendations(
    failureRate: number
  ): OptimizationRecommendation[] {
    return [
      {
        priority: 'high',
        category: 'network',
        title: 'Improve Network Reliability',
        description: 'Add retry logic and error handling for network requests',
        implementation:
          'Implement exponential backoff and circuit breaker patterns',
        estimatedImpact: 'Reduce failure rate by 60-80%',
        effort: 'medium',
        dependencies: ['retry mechanism', 'error handling'],
      },
    ];
  }

  private generateMessagePassingOptimizationRecommendations(
    messageMetrics: MessagePassingMetrics
  ): OptimizationRecommendation[] {
    return [
      {
        priority: 'medium',
        category: 'algorithm',
        title: 'Optimize Message Processing',
        description: 'Improve message queue processing efficiency',
        implementation: 'Implement message batching and priority queuing',
        estimatedImpact: 'Reduce queue backlog by 70-80%',
        effort: 'medium',
        dependencies: ['queue optimization'],
      },
    ];
  }

  private generateMessageLatencyOptimizationRecommendations(
    latency: number
  ): OptimizationRecommendation[] {
    return [
      {
        priority: 'medium',
        category: 'algorithm',
        title: 'Reduce Message Latency',
        description: 'Optimize message serialization and processing',
        implementation:
          'Use more efficient serialization and reduce message payload size',
        estimatedImpact: 'Reduce message latency by 40-60%',
        effort: 'low',
        dependencies: ['serialization optimization'],
      },
    ];
  }

  private generateRenderingOptimizationRecommendations(
    renderingMetrics: RenderingMetrics
  ): OptimizationRecommendation[] {
    return [
      {
        priority: 'high',
        category: 'algorithm',
        title: 'Optimize Rendering Performance',
        description: 'Reduce DOM manipulation and improve CSS efficiency',
        implementation:
          'Use virtual DOM, batch DOM updates, and optimize CSS selectors',
        estimatedImpact: 'Improve frame rate by 50-70%',
        effort: 'high',
        dependencies: ['rendering optimization'],
      },
    ];
  }

  private generateDOMOptimizationRecommendations(
    domSize: number
  ): OptimizationRecommendation[] {
    return [
      {
        priority: 'medium',
        category: 'algorithm',
        title: 'Reduce DOM Size',
        description:
          'Implement virtual scrolling and lazy loading for large DOM trees',
        implementation:
          'Use virtual scrolling for large lists and lazy load content',
        estimatedImpact: 'Reduce DOM size by 60-80%',
        effort: 'high',
        dependencies: ['virtual scrolling implementation'],
      },
    ];
  }

  private generateAIOptimizationRecommendations(
    aiMetrics: AIProcessingMetrics
  ): OptimizationRecommendation[] {
    return [
      {
        priority: 'high',
        category: 'algorithm',
        title: 'Optimize AI Processing',
        description: 'Implement AI result caching and batch processing',
        implementation:
          'Cache AI results, use batch processing, and optimize model usage',
        estimatedImpact: 'Reduce AI processing time by 50-70%',
        effort: 'medium',
        dependencies: ['AI caching system', 'batch processing'],
      },
    ];
  }

  private generateCacheOptimizationRecommendations(
    cacheHitRate: number
  ): OptimizationRecommendation[] {
    return [
      {
        priority: 'medium',
        category: 'algorithm',
        title: 'Improve Cache Effectiveness',
        description: 'Optimize caching strategy and cache key generation',
        implementation:
          'Review cache key strategy and implement smarter cache invalidation',
        estimatedImpact: 'Increase cache hit rate to 80-90%',
        effort: 'medium',
        dependencies: ['cache strategy review'],
      },
    ];
  }

  private generateCrossComponentOptimizationRecommendations(): OptimizationRecommendation[] {
    return [
      {
        priority: 'critical',
        category: 'architecture',
        title: 'Fix Cross-Component Performance Issues',
        description:
          'Address synchronized performance degradation across contexts',
        implementation:
          'Review component coordination and implement resource management',
        estimatedImpact: 'Improve overall system performance by 40-60%',
        effort: 'high',
        dependencies: ['architecture review', 'resource management'],
      },
    ];
  }

  private async generateBottleneckReport(): Promise<BottleneckDetectionResult> {
    const bottlenecks = Array.from(this.detectedBottlenecks.values());

    const bottlenecksByContext: Record<ExtensionContext, number> = {
      'service-worker': 0,
      'content-script': 0,
      offscreen: 0,
      ui: 0,
    };

    const bottlenecksByType: Record<BottleneckType, number> = {
      'memory-leak': 0,
      'cpu-intensive': 0,
      'network-latency': 0,
      'message-queue': 0,
      rendering: 0,
      'ai-processing': 0,
      'storage-io': 0,
      'algorithm-inefficiency': 0,
    };

    for (const bottleneck of bottlenecks) {
      bottlenecksByContext[bottleneck.context]++;
      bottlenecksByType[bottleneck.bottleneckType]++;
    }

    const criticalBottlenecks = bottlenecks.filter(
      b => b.severity === 'critical'
    ).length;

    // Calculate overall performance score (0-100)
    const maxPossibleScore = 100;
    const severityPenalties = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 3,
    };

    let totalPenalty = 0;
    for (const bottleneck of bottlenecks) {
      totalPenalty += severityPenalties[bottleneck.severity];
    }

    const overallPerformanceScore = Math.max(
      0,
      maxPossibleScore - totalPenalty
    );

    const recommendations = await this.generateOptimizationRecommendations();

    return {
      detectionId: this.generateDetectionId(),
      timestamp: new Date(),
      monitoringDuration: this.monitoringStartTime
        ? Date.now() - this.monitoringStartTime.getTime()
        : 0,
      totalBottlenecks: bottlenecks.length,
      criticalBottlenecks,
      bottlenecksByContext,
      bottlenecksByType,
      overallPerformanceScore,
      recommendations,
      detectedBottlenecks: bottlenecks,
    };
  }

  private identifyContextType(url: string): ExtensionContext | null {
    if (url.includes('service-worker')) return 'service-worker';
    if (url.includes('offscreen')) return 'offscreen';
    if (url.includes('chrome-extension://') && url.includes('/ui/'))
      return 'ui';
    if (url.startsWith('http')) return 'content-script';
    return null;
  }

  private generateBottleneckId(): string {
    return `bottleneck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDetectionId(): string {
    return `detection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global MCP function declarations
declare global {
  function mcp_chrome_devtools_list_pages(): Promise<any[]>;
  function mcp_chrome_devtools_select_page(params: {
    pageIdx: number;
  }): Promise<void>;
  function mcp_chrome_devtools_evaluate_script(params: {
    function: string;
  }): Promise<any>;
}
