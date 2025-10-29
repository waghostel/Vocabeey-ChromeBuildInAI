/**
 * Offscreen Document Debugger
 * Monitors AI processing, memory usage, and service coordination in offscreen context
 * Implements Requirements: 3.2, 3.3, 3.4, 3.5, 5.4, 6.4
 */

import {
  MemoryMonitor,
  getMemoryMonitor,
  type MemorySnapshot,
  type MemoryLeakAnalysis,
} from '../utils/memory-monitor';
import {
  ServiceCoordinatorDebugger,
  getServiceCoordinatorDebugger,
  type ServiceCoordinationReport,
  type FallbackChainExecution,
} from '../utils/service-coordinator-debugger';

export interface AIProcessingMetrics {
  taskId: string;
  taskType: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  service: 'chrome-ai' | 'gemini-api' | 'fallback';
  requestSize: number;
  responseSize?: number;
  error?: string;
  memoryUsage?: {
    before: number;
    after: number;
    peak: number;
  };
}

export interface MemoryMetrics {
  timestamp: Date;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryPressure: 'low' | 'moderate' | 'high' | 'critical';
}

export interface ServiceAvailabilityStatus {
  chromeAI: {
    languageDetector: boolean;
    summarizer: boolean;
    rewriter: boolean;
    translator: boolean;
    vocabularyAnalyzer: boolean;
    lastChecked: Date;
  };
  geminiAPI: {
    available: boolean;
    configured: boolean;
    lastChecked: Date;
  };
  fallbackChain: string[];
}

export interface AIResponseQuality {
  taskId: string;
  taskType: string;
  service: string;
  qualityScore: number; // 1-10
  responseTime: number;
  accuracy: number; // 1-10
  completeness: number; // 1-10
  issues: string[];
}

export class OffscreenDebugger {
  private aiProcessingMetrics: Map<string, AIProcessingMetrics> = new Map();
  private memoryMetrics: MemoryMetrics[] = [];
  private serviceStatus: ServiceAvailabilityStatus | null = null;
  private qualityMetrics: AIResponseQuality[] = [];
  private memoryMonitor: MemoryMonitor;
  private serviceCoordinatorDebugger: ServiceCoordinatorDebugger;
  private readonly maxMetricsHistory = 1000;

  constructor() {
    this.memoryMonitor = getMemoryMonitor();
    this.serviceCoordinatorDebugger = getServiceCoordinatorDebugger();
  }

  /**
   * Initialize offscreen document debugging
   */
  async initialize(): Promise<void> {
    console.log('Initializing offscreen document debugger');

    // Start memory monitoring
    this.memoryMonitor.startMonitoring();

    // Check initial service availability
    await this.checkServiceAvailability();

    // Set up message listeners for AI processing events
    this.setupMessageListeners();

    console.log('Offscreen debugger initialized');
  }

  /**
   * Start monitoring AI processing task
   */
  startAIProcessingMonitoring(
    taskId: string,
    taskType: string,
    requestData: any
  ): void {
    const metrics: AIProcessingMetrics = {
      taskId,
      taskType,
      startTime: new Date(),
      status: 'pending',
      service: 'chrome-ai', // Default, will be updated
      requestSize: JSON.stringify(requestData).length,
    };

    // Capture memory before processing
    const memorySnapshot = this.memoryMonitor.takeMemorySnapshot(
      `ai-task-start-${taskType}`,
      taskId
    );
    if (memorySnapshot) {
      metrics.memoryUsage = {
        before: memorySnapshot.usedJSHeapSize,
        after: 0,
        peak: memorySnapshot.usedJSHeapSize,
      };
    }

    // Track component memory usage
    this.memoryMonitor.trackComponentMemory(
      `ai-processor-${taskType}`,
      JSON.stringify(requestData).length
    );

    // Start fallback chain tracking
    this.serviceCoordinatorDebugger.startFallbackChainTracking(
      taskId,
      taskType
    );

    this.aiProcessingMetrics.set(taskId, metrics);
    console.log(`Started monitoring AI task ${taskId} (${taskType})`);
  }

  /**
   * Update AI processing metrics during execution
   */
  updateAIProcessingMetrics(
    taskId: string,
    updates: Partial<AIProcessingMetrics>
  ): void {
    const existing = this.aiProcessingMetrics.get(taskId);
    if (!existing) {
      console.warn(`No metrics found for task ${taskId}`);
      return;
    }

    // Update metrics
    Object.assign(existing, updates);

    // Update memory peak if current usage is higher
    const memorySnapshot = this.memoryMonitor.takeMemorySnapshot(
      `ai-task-update-${existing.taskType}`,
      taskId
    );
    if (memorySnapshot && existing.memoryUsage) {
      if (memorySnapshot.usedJSHeapSize > existing.memoryUsage.peak) {
        existing.memoryUsage.peak = memorySnapshot.usedJSHeapSize;
      }
    }

    this.aiProcessingMetrics.set(taskId, existing);
  }

  /**
   * Complete AI processing monitoring
   */
  completeAIProcessingMonitoring(
    taskId: string,
    result: any,
    service: 'chrome-ai' | 'gemini-api' | 'fallback',
    error?: string
  ): void {
    const metrics = this.aiProcessingMetrics.get(taskId);
    if (!metrics) {
      console.warn(`No metrics found for task ${taskId}`);
      return;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - metrics.startTime.getTime();

    // Update final metrics
    metrics.endTime = endTime;
    metrics.duration = duration;
    metrics.status = error ? 'failed' : 'completed';
    metrics.service = service;
    metrics.error = error;

    if (result) {
      metrics.responseSize = JSON.stringify(result).length;
    }

    // Capture final memory usage
    const finalMemorySnapshot = this.memoryMonitor.takeMemorySnapshot(
      `ai-task-complete-${metrics.taskType}`,
      taskId
    );
    if (finalMemorySnapshot && metrics.memoryUsage) {
      metrics.memoryUsage.after = finalMemorySnapshot.usedJSHeapSize;
    }

    // Record service attempt in fallback chain
    this.serviceCoordinatorDebugger.recordServiceAttempt(
      taskId,
      service,
      !error,
      duration,
      error
    );

    // Complete fallback chain tracking
    this.serviceCoordinatorDebugger.completeFallbackChainExecution(
      taskId,
      duration
    );

    // Monitor response quality
    if (!error && result) {
      const quality = this.analyzeResponseQuality(
        taskId,
        metrics.taskType,
        service,
        result,
        duration
      );
      this.qualityMetrics.push(quality);

      // Also monitor with service coordinator
      this.serviceCoordinatorDebugger.monitorResponseQuality(
        service,
        metrics.taskType,
        result,
        duration
      );
    }

    console.log(
      `Completed monitoring AI task ${taskId}: ${metrics.status} in ${duration}ms using ${service}`
    );

    // Clean up old metrics to prevent memory leaks
    this.cleanupOldMetrics();
  }

  /**
   * Get current memory usage metrics
   */
  getCurrentMemoryMetrics(): MemoryMetrics | null {
    if (!performance.memory) {
      return null;
    }

    const memory = performance.memory;
    const memoryPressure = this.calculateMemoryPressure(memory);

    return {
      timestamp: new Date(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      memoryPressure,
    };
  }

  /**
   * Check service availability
   */
  async checkServiceAvailability(): Promise<ServiceAvailabilityStatus> {
    const status: ServiceAvailabilityStatus = {
      chromeAI: {
        languageDetector: false,
        summarizer: false,
        rewriter: false,
        translator: false,
        vocabularyAnalyzer: false,
        lastChecked: new Date(),
      },
      geminiAPI: {
        available: false,
        configured: false,
        lastChecked: new Date(),
      },
      fallbackChain: [],
    };

    try {
      // Check Chrome AI services
      if (window.ai) {
        // Language Detector
        try {
          if (window.ai.languageDetector) {
            const startTime = Date.now();
            const capabilities =
              await window.ai.languageDetector.capabilities();
            const responseTime = Date.now() - startTime;
            const available = capabilities.available === 'readily';

            status.chromeAI.languageDetector = available;
            this.recordServiceAvailabilityCheck(
              'chrome-ai',
              'languageDetector',
              available,
              responseTime
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.warn('Language detector check failed:', error);
          this.recordServiceAvailabilityCheck(
            'chrome-ai',
            'languageDetector',
            false,
            0,
            errorMessage
          );
        }

        // Summarizer
        try {
          if (window.ai.summarizer) {
            const startTime = Date.now();
            const capabilities = await window.ai.summarizer.capabilities();
            const responseTime = Date.now() - startTime;
            const available = capabilities.available === 'readily';

            status.chromeAI.summarizer = available;
            this.recordServiceAvailabilityCheck(
              'chrome-ai',
              'summarizer',
              available,
              responseTime
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.warn('Summarizer check failed:', error);
          this.recordServiceAvailabilityCheck(
            'chrome-ai',
            'summarizer',
            false,
            0,
            errorMessage
          );
        }

        // Rewriter
        try {
          if (window.ai.rewriter) {
            const startTime = Date.now();
            const capabilities = await window.ai.rewriter.capabilities();
            const responseTime = Date.now() - startTime;
            const available = capabilities.available === 'readily';

            status.chromeAI.rewriter = available;
            this.recordServiceAvailabilityCheck(
              'chrome-ai',
              'rewriter',
              available,
              responseTime
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.warn('Rewriter check failed:', error);
          this.recordServiceAvailabilityCheck(
            'chrome-ai',
            'rewriter',
            false,
            0,
            errorMessage
          );
        }

        // Translator
        try {
          if (window.ai.translator) {
            const startTime = Date.now();
            const capabilities = await window.ai.translator.capabilities();
            const responseTime = Date.now() - startTime;
            const available = capabilities.available === 'readily';

            status.chromeAI.translator = available;
            this.recordServiceAvailabilityCheck(
              'chrome-ai',
              'translator',
              available,
              responseTime
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.warn('Translator check failed:', error);
          this.recordServiceAvailabilityCheck(
            'chrome-ai',
            'translator',
            false,
            0,
            errorMessage
          );
        }

        // Vocabulary Analyzer (Prompt API)
        try {
          if (window.ai.assistant) {
            const startTime = Date.now();
            const capabilities = await window.ai.assistant.capabilities();
            const responseTime = Date.now() - startTime;
            const available = capabilities.available === 'readily';

            status.chromeAI.vocabularyAnalyzer = available;
            this.recordServiceAvailabilityCheck(
              'chrome-ai',
              'vocabularyAnalyzer',
              available,
              responseTime
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.warn('Vocabulary analyzer check failed:', error);
          this.recordServiceAvailabilityCheck(
            'chrome-ai',
            'vocabularyAnalyzer',
            false,
            0,
            errorMessage
          );
        }
      }

      // Check Gemini API availability (basic check)
      try {
        const startTime = Date.now();
        // This would need to be implemented based on actual Gemini API client
        // For now, we'll check if it's configured
        const configured = true; // Placeholder - would check API key presence
        const available = true; // Placeholder - would make test API call
        const responseTime = Date.now() - startTime;

        status.geminiAPI.configured = configured;
        status.geminiAPI.available = available;

        this.recordServiceAvailabilityCheck(
          'gemini-api',
          'general',
          available,
          responseTime
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.warn('Gemini API check failed:', error);
        this.recordServiceAvailabilityCheck(
          'gemini-api',
          'general',
          false,
          0,
          errorMessage
        );
      }

      // Build fallback chain based on availability
      const fallbackChain: string[] = [];

      if (
        status.chromeAI.languageDetector ||
        status.chromeAI.summarizer ||
        status.chromeAI.rewriter ||
        status.chromeAI.translator ||
        status.chromeAI.vocabularyAnalyzer
      ) {
        fallbackChain.push('chrome-ai');
      }

      if (status.geminiAPI.available) {
        fallbackChain.push('gemini-api');
      }

      status.fallbackChain = fallbackChain;
    } catch (error) {
      console.error('Service availability check failed:', error);
    }

    this.serviceStatus = status;
    return status;
  }

  /**
   * Get AI processing metrics
   */
  getAIProcessingMetrics(): AIProcessingMetrics[] {
    return Array.from(this.aiProcessingMetrics.values());
  }

  /**
   * Get memory usage history
   */
  getMemoryMetrics(): MemoryMetrics[] {
    return [...this.memoryMetrics];
  }

  /**
   * Get service availability status
   */
  getServiceStatus(): ServiceAvailabilityStatus | null {
    return this.serviceStatus;
  }

  /**
   * Get AI response quality metrics
   */
  getQualityMetrics(): AIResponseQuality[] {
    return [...this.qualityMetrics];
  }

  /**
   * Get detailed memory analysis
   */
  getMemoryAnalysis(): {
    snapshots: MemorySnapshot[];
    leakAnalysis: MemoryLeakAnalysis;
    componentUsage: any[];
    summary: any;
  } {
    return {
      snapshots: this.memoryMonitor.getRecentSnapshots(100),
      leakAnalysis: this.memoryMonitor.analyzeMemoryLeaks(),
      componentUsage: this.memoryMonitor.getComponentMemoryUsage(),
      summary: this.memoryMonitor.getMemoryUsageSummary(),
    };
  }

  /**
   * Force memory cleanup
   */
  forceMemoryCleanup(): boolean {
    console.log('Forcing memory cleanup from offscreen debugger');
    return this.memoryMonitor.forceGarbageCollection();
  }

  /**
   * Get performance optimization recommendations
   */
  getPerformanceOptimizationRecommendations(): string[] {
    const memoryOptimizations =
      this.memoryMonitor.getPerformanceOptimizationMetrics();
    const aiOptimizations = this.generateOptimizationRecommendations();
    const serviceOptimizations =
      this.serviceCoordinatorDebugger.getServiceCoordinationReport();

    return [
      ...memoryOptimizations.recommendations,
      ...aiOptimizations,
      ...serviceOptimizations.recommendations,
    ];
  }

  /**
   * Get service coordination report
   */
  getServiceCoordinationReport(): ServiceCoordinationReport {
    return this.serviceCoordinatorDebugger.getServiceCoordinationReport();
  }

  /**
   * Get fallback chain execution history
   */
  getFallbackChainExecutions(): FallbackChainExecution[] {
    return this.serviceCoordinatorDebugger.getRecentFallbackExecutions();
  }

  /**
   * Validate current fallback chain configuration
   */
  validateFallbackChain(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    // Get currently available services from service status
    const availableServices: string[] = [];

    if (this.serviceStatus) {
      if (this.serviceStatus.chromeAI.languageDetector)
        availableServices.push('chrome-ai-language-detector');
      if (this.serviceStatus.chromeAI.summarizer)
        availableServices.push('chrome-ai-summarizer');
      if (this.serviceStatus.chromeAI.rewriter)
        availableServices.push('chrome-ai-rewriter');
      if (this.serviceStatus.chromeAI.translator)
        availableServices.push('chrome-ai-translator');
      if (this.serviceStatus.chromeAI.vocabularyAnalyzer)
        availableServices.push('chrome-ai-vocabulary-analyzer');
      if (this.serviceStatus.geminiAPI.available)
        availableServices.push('gemini-api');
    }

    return this.serviceCoordinatorDebugger.validateFallbackChain(
      availableServices
    );
  }

  /**
   * Record service availability check
   */
  recordServiceAvailabilityCheck(
    service: 'chrome-ai' | 'gemini-api',
    component: string,
    available: boolean,
    responseTime: number,
    error?: string
  ): void {
    this.serviceCoordinatorDebugger.recordAvailabilityCheck(
      service,
      component,
      available,
      responseTime,
      error
    );
  }

  /**
   * Detect memory leaks
   */
  detectMemoryLeaks(): {
    hasLeak: boolean;
    trend: 'increasing' | 'stable' | 'decreasing';
    recommendation: string;
  } {
    if (this.memoryMetrics.length < 10) {
      return {
        hasLeak: false,
        trend: 'stable',
        recommendation: 'Insufficient data for leak detection',
      };
    }

    // Analyze last 10 memory measurements
    const recent = this.memoryMetrics.slice(-10);
    const memoryValues = recent.map(m => m.usedJSHeapSize);

    // Calculate trend
    let increasingCount = 0;
    let decreasingCount = 0;

    for (let i = 1; i < memoryValues.length; i++) {
      if (memoryValues[i] > memoryValues[i - 1]) {
        increasingCount++;
      } else if (memoryValues[i] < memoryValues[i - 1]) {
        decreasingCount++;
      }
    }

    const trend =
      increasingCount > decreasingCount
        ? 'increasing'
        : decreasingCount > increasingCount
          ? 'decreasing'
          : 'stable';

    // Check for potential leak (consistent increase over 70% of measurements)
    const hasLeak = trend === 'increasing' && increasingCount >= 7;

    let recommendation = 'Memory usage appears normal';
    if (hasLeak) {
      recommendation =
        'Potential memory leak detected. Consider cleaning up AI sessions and caches.';
    } else if (trend === 'increasing') {
      recommendation =
        'Memory usage is increasing. Monitor for potential leaks.';
    }

    return { hasLeak, trend, recommendation };
  }

  /**
   * Generate performance optimization recommendations
   */
  generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getAIProcessingMetrics();
    const memoryAnalysis = this.detectMemoryLeaks();

    // Analyze processing times
    const completedTasks = metrics.filter(
      m => m.status === 'completed' && m.duration
    );
    if (completedTasks.length > 0) {
      const avgDuration =
        completedTasks.reduce((sum, m) => sum + (m.duration || 0), 0) /
        completedTasks.length;

      if (avgDuration > 10000) {
        // > 10 seconds
        recommendations.push(
          'AI processing times are high. Consider implementing request batching or caching.'
        );
      }

      // Check for failed tasks
      const failedTasks = metrics.filter(m => m.status === 'failed');
      const failureRate = failedTasks.length / metrics.length;

      if (failureRate > 0.1) {
        // > 10% failure rate
        recommendations.push(
          'High AI task failure rate detected. Review error handling and fallback mechanisms.'
        );
      }
    }

    // Memory recommendations
    if (memoryAnalysis.hasLeak) {
      recommendations.push(memoryAnalysis.recommendation);
    }

    // Service availability recommendations
    if (this.serviceStatus) {
      const chromeAIServices = Object.values(
        this.serviceStatus.chromeAI
      ).filter(v => typeof v === 'boolean');
      const availableServices = chromeAIServices.filter(Boolean).length;

      if (availableServices < chromeAIServices.length) {
        recommendations.push(
          'Some Chrome AI services are unavailable. Ensure proper fallback configuration.'
        );
      }
    }

    // Quality recommendations
    if (this.qualityMetrics.length > 0) {
      const avgQuality =
        this.qualityMetrics.reduce((sum, m) => sum + m.qualityScore, 0) /
        this.qualityMetrics.length;

      if (avgQuality < 7) {
        recommendations.push(
          'AI response quality is below optimal. Consider adjusting prompts or switching services.'
        );
      }
    }

    return recommendations;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.memoryMonitor.stopMonitoring();
    this.memoryMonitor.clearData();
    this.serviceCoordinatorDebugger.clearData();

    this.aiProcessingMetrics.clear();
    this.memoryMetrics = [];
    this.qualityMetrics = [];
    this.serviceStatus = null;

    console.log('Offscreen debugger cleaned up');
  }

  /**
   * Analyze response quality
   */
  private analyzeResponseQuality(
    taskId: string,
    taskType: string,
    service: string,
    result: any,
    responseTime: number
  ): AIResponseQuality {
    let qualityScore = 10;
    let accuracy = 10;
    let completeness = 10;
    const issues: string[] = [];

    // Basic quality checks based on task type
    switch (taskType) {
      case 'language_detection':
        if (!result || typeof result !== 'string' || result.length < 2) {
          qualityScore -= 3;
          accuracy -= 3;
          issues.push('Invalid language detection result');
        }
        break;

      case 'summarization':
        if (!result || typeof result !== 'string') {
          qualityScore -= 5;
          completeness -= 5;
          issues.push('Empty or invalid summary');
        } else if (result.length < 50) {
          qualityScore -= 2;
          completeness -= 2;
          issues.push('Summary too short');
        }
        break;

      case 'translation':
        if (!result || typeof result !== 'string') {
          qualityScore -= 5;
          accuracy -= 5;
          issues.push('Empty or invalid translation');
        }
        break;

      case 'vocabulary_analysis':
        if (!Array.isArray(result) || result.length === 0) {
          qualityScore -= 4;
          completeness -= 4;
          issues.push('No vocabulary analysis results');
        }
        break;
    }

    // Response time penalty
    if (responseTime > 10000) {
      // > 10 seconds
      qualityScore -= 2;
      issues.push('Slow response time');
    } else if (responseTime > 5000) {
      // > 5 seconds
      qualityScore -= 1;
      issues.push('Moderate response time');
    }

    return {
      taskId,
      taskType,
      service,
      qualityScore: Math.max(1, qualityScore),
      responseTime,
      accuracy: Math.max(1, accuracy),
      completeness: Math.max(1, completeness),
      issues,
    };
  }

  /**
   * Set up message listeners for AI processing events
   */
  private setupMessageListeners(): void {
    // Listen for AI processing events from the offscreen document
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
          case 'AI_TASK_STARTED':
            this.startAIProcessingMonitoring(
              message.taskId,
              message.taskType,
              message.data
            );
            break;

          case 'AI_TASK_UPDATED':
            this.updateAIProcessingMetrics(message.taskId, message.updates);
            break;

          case 'AI_TASK_COMPLETED':
            this.completeAIProcessingMonitoring(
              message.taskId,
              message.result,
              message.service,
              message.error
            );
            break;
        }
        return false;
      });
    }
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    if (this.aiProcessingMetrics.size > this.maxMetricsHistory) {
      // Remove oldest metrics
      const entries = Array.from(this.aiProcessingMetrics.entries());
      const toRemove = entries
        .sort(([, a], [, b]) => a.startTime.getTime() - b.startTime.getTime())
        .slice(0, entries.length - this.maxMetricsHistory);

      toRemove.forEach(([taskId]) => {
        this.aiProcessingMetrics.delete(taskId);
      });
    }

    // Clean up quality metrics
    if (this.qualityMetrics.length > this.maxMetricsHistory) {
      this.qualityMetrics = this.qualityMetrics.slice(-this.maxMetricsHistory);
    }
  }
}
