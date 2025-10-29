/**
 * AI Service Coordinator Debugger
 * Monitors service availability, fallback chain validation, and response quality
 * Implements Requirements: 3.4, 3.5
 */

export interface ServiceAvailabilityCheck {
  timestamp: Date;
  service: 'chrome-ai' | 'gemini-api';
  component: string;
  available: boolean;
  responseTime: number;
  error?: string;
}

export interface FallbackChainExecution {
  taskId: string;
  taskType: string;
  timestamp: Date;
  attemptedServices: string[];
  successfulService?: string;
  failedServices: Array<{
    service: string;
    error: string;
    responseTime: number;
  }>;
  totalExecutionTime: number;
  fallbackReason: string;
}

export interface ServiceQualityMetrics {
  service: 'chrome-ai' | 'gemini-api';
  component: string;
  successRate: number;
  averageResponseTime: number;
  qualityScore: number;
  recentFailures: string[];
  lastSuccessfulCall: Date | null;
  totalCalls: number;
  successfulCalls: number;
}

export interface ServiceCoordinationReport {
  timestamp: Date;
  availabilityStatus: Map<string, boolean>;
  fallbackChainHealth: number; // 1-10 score
  serviceReliability: Map<string, number>; // 1-10 score per service
  recommendations: string[];
  criticalIssues: string[];
}

export class ServiceCoordinatorDebugger {
  private availabilityChecks: ServiceAvailabilityCheck[] = [];
  private fallbackExecutions: FallbackChainExecution[] = [];
  private serviceMetrics: Map<string, ServiceQualityMetrics> = new Map();
  private readonly maxHistorySize = 500;

  /**
   * Record service availability check
   */
  recordAvailabilityCheck(
    service: 'chrome-ai' | 'gemini-api',
    component: string,
    available: boolean,
    responseTime: number,
    error?: string
  ): void {
    const check: ServiceAvailabilityCheck = {
      timestamp: new Date(),
      service,
      component,
      available,
      responseTime,
      error,
    };

    this.availabilityChecks.push(check);

    // Maintain history size
    if (this.availabilityChecks.length > this.maxHistorySize) {
      this.availabilityChecks = this.availabilityChecks.slice(
        -this.maxHistorySize
      );
    }

    // Update service metrics
    this.updateServiceMetrics(
      service,
      component,
      available,
      responseTime,
      error
    );

    console.log(
      `Service availability check: ${service}/${component} - ${available ? 'available' : 'unavailable'} (${responseTime}ms)`
    );
  }

  /**
   * Start tracking fallback chain execution
   */
  startFallbackChainTracking(taskId: string, taskType: string): void {
    const execution: FallbackChainExecution = {
      taskId,
      taskType,
      timestamp: new Date(),
      attemptedServices: [],
      failedServices: [],
      totalExecutionTime: 0,
      fallbackReason: 'initial_attempt',
    };

    // Store with taskId as key for easy lookup
    this.fallbackExecutions.push(execution);
  }

  /**
   * Record service attempt in fallback chain
   */
  recordServiceAttempt(
    taskId: string,
    service: string,
    success: boolean,
    responseTime: number,
    error?: string
  ): void {
    const execution = this.fallbackExecutions.find(e => e.taskId === taskId);
    if (!execution) {
      console.warn(`No fallback execution found for task ${taskId}`);
      return;
    }

    execution.attemptedServices.push(service);

    if (success) {
      execution.successfulService = service;
    } else {
      execution.failedServices.push({
        service,
        error: error || 'Unknown error',
        responseTime,
      });
    }

    console.log(
      `Service attempt: ${service} for task ${taskId} - ${success ? 'success' : 'failed'} (${responseTime}ms)`
    );
  }

  /**
   * Complete fallback chain execution
   */
  completeFallbackChainExecution(taskId: string, totalTime: number): void {
    const execution = this.fallbackExecutions.find(e => e.taskId === taskId);
    if (!execution) {
      console.warn(`No fallback execution found for task ${taskId}`);
      return;
    }

    execution.totalExecutionTime = totalTime;

    // Determine fallback reason
    if (execution.failedServices.length > 0) {
      execution.fallbackReason = execution.successfulService
        ? 'primary_service_failed'
        : 'all_services_failed';
    }

    // Maintain history size
    if (this.fallbackExecutions.length > this.maxHistorySize) {
      this.fallbackExecutions = this.fallbackExecutions.slice(
        -this.maxHistorySize
      );
    }

    console.log(
      `Fallback chain completed for task ${taskId}: ${execution.successfulService || 'failed'} (${totalTime}ms)`
    );
  }

  /**
   * Validate fallback chain configuration
   */
  validateFallbackChain(availableServices: string[]): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if we have at least one service available
    if (availableServices.length === 0) {
      issues.push('No AI services are available');
      recommendations.push(
        'Ensure at least one AI service is properly configured'
      );
    }

    // Check service diversity
    const hasChromeAI = availableServices.some(s => s.includes('chrome-ai'));
    const hasGeminiAPI = availableServices.some(s => s.includes('gemini'));

    if (!hasChromeAI && !hasGeminiAPI) {
      issues.push('No recognized AI services in fallback chain');
    } else if (!hasChromeAI) {
      recommendations.push(
        'Consider adding Chrome AI services for better performance'
      );
    } else if (!hasGeminiAPI) {
      recommendations.push(
        'Consider adding Gemini API as fallback for better reliability'
      );
    }

    // Check recent service reliability
    const recentFailures = this.getRecentServiceFailures();
    if (recentFailures.size > 0) {
      recentFailures.forEach((failures, service) => {
        if (failures > 5) {
          issues.push(`Service ${service} has ${failures} recent failures`);
          recommendations.push(`Investigate issues with ${service} service`);
        }
      });
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Monitor AI response quality
   */
  monitorResponseQuality(
    service: string,
    taskType: string,
    response: any,
    responseTime: number
  ): {
    qualityScore: number;
    issues: string[];
  } {
    let qualityScore = 10;
    const issues: string[] = [];

    // Response time penalty
    if (responseTime > 15000) {
      // > 15 seconds
      qualityScore -= 3;
      issues.push('Very slow response time');
    } else if (responseTime > 10000) {
      // > 10 seconds
      qualityScore -= 2;
      issues.push('Slow response time');
    } else if (responseTime > 5000) {
      // > 5 seconds
      qualityScore -= 1;
      issues.push('Moderate response time');
    }

    // Response content validation
    if (!response) {
      qualityScore -= 5;
      issues.push('Empty response');
    } else {
      // Task-specific quality checks
      switch (taskType) {
        case 'language_detection':
          if (typeof response !== 'string' || response.length < 2) {
            qualityScore -= 3;
            issues.push('Invalid language detection format');
          }
          break;

        case 'summarization':
          if (typeof response !== 'string') {
            qualityScore -= 4;
            issues.push('Invalid summary format');
          } else if (response.length < 50) {
            qualityScore -= 2;
            issues.push('Summary too short');
          } else if (response.length > 2000) {
            qualityScore -= 1;
            issues.push('Summary too long');
          }
          break;

        case 'translation':
          if (typeof response !== 'string') {
            qualityScore -= 4;
            issues.push('Invalid translation format');
          }
          break;

        case 'vocabulary_analysis':
          if (!Array.isArray(response)) {
            qualityScore -= 4;
            issues.push('Invalid vocabulary analysis format');
          } else if (response.length === 0) {
            qualityScore -= 2;
            issues.push('No vocabulary analysis results');
          }
          break;
      }
    }

    // Update service quality metrics
    const serviceKey = `${service}-${taskType}`;
    const metrics = this.serviceMetrics.get(serviceKey);
    if (metrics) {
      metrics.qualityScore = (metrics.qualityScore + qualityScore) / 2; // Running average
    }

    return {
      qualityScore: Math.max(1, qualityScore),
      issues,
    };
  }

  /**
   * Get service coordination report
   */
  getServiceCoordinationReport(): ServiceCoordinationReport {
    const timestamp = new Date();
    const availabilityStatus = this.getCurrentAvailabilityStatus();
    const fallbackChainHealth = this.calculateFallbackChainHealth();
    const serviceReliability = this.calculateServiceReliability();
    const recommendations = this.generateRecommendations();
    const criticalIssues = this.identifyCriticalIssues();

    return {
      timestamp,
      availabilityStatus,
      fallbackChainHealth,
      serviceReliability,
      recommendations,
      criticalIssues,
    };
  }

  /**
   * Get recent fallback executions
   */
  getRecentFallbackExecutions(count: number = 50): FallbackChainExecution[] {
    return this.fallbackExecutions.slice(-count);
  }

  /**
   * Get service quality metrics
   */
  getServiceQualityMetrics(): ServiceQualityMetrics[] {
    return Array.from(this.serviceMetrics.values());
  }

  /**
   * Get availability check history
   */
  getAvailabilityCheckHistory(): ServiceAvailabilityCheck[] {
    return [...this.availabilityChecks];
  }

  /**
   * Clear debugging data
   */
  clearData(): void {
    this.availabilityChecks = [];
    this.fallbackExecutions = [];
    this.serviceMetrics.clear();
    console.log('Service coordinator debugging data cleared');
  }

  /**
   * Update service metrics
   */
  private updateServiceMetrics(
    service: 'chrome-ai' | 'gemini-api',
    component: string,
    available: boolean,
    responseTime: number,
    error?: string
  ): void {
    const key = `${service}-${component}`;
    let metrics = this.serviceMetrics.get(key);

    if (!metrics) {
      metrics = {
        service,
        component,
        successRate: 0,
        averageResponseTime: 0,
        qualityScore: 10,
        recentFailures: [],
        lastSuccessfulCall: null,
        totalCalls: 0,
        successfulCalls: 0,
      };
      this.serviceMetrics.set(key, metrics);
    }

    metrics.totalCalls++;

    if (available) {
      metrics.successfulCalls++;
      metrics.lastSuccessfulCall = new Date();
    } else {
      metrics.recentFailures.push(error || 'Unknown error');
      // Keep only recent failures (last 10)
      if (metrics.recentFailures.length > 10) {
        metrics.recentFailures = metrics.recentFailures.slice(-10);
      }
    }

    metrics.successRate = (metrics.successfulCalls / metrics.totalCalls) * 100;
    metrics.averageResponseTime =
      (metrics.averageResponseTime + responseTime) / 2;
  }

  /**
   * Get current availability status
   */
  private getCurrentAvailabilityStatus(): Map<string, boolean> {
    const status = new Map<string, boolean>();
    const recentChecks = this.availabilityChecks.slice(-20); // Last 20 checks

    // Group by service-component
    const serviceGroups = new Map<string, ServiceAvailabilityCheck[]>();
    recentChecks.forEach(check => {
      const key = `${check.service}-${check.component}`;
      if (!serviceGroups.has(key)) {
        serviceGroups.set(key, []);
      }
      serviceGroups.get(key)!.push(check);
    });

    // Determine current status based on most recent check
    serviceGroups.forEach((checks, service) => {
      const latestCheck = checks[checks.length - 1];
      status.set(service, latestCheck.available);
    });

    return status;
  }

  /**
   * Calculate fallback chain health score
   */
  private calculateFallbackChainHealth(): number {
    const recentExecutions = this.fallbackExecutions.slice(-20);
    if (recentExecutions.length === 0) return 10;

    const successfulExecutions = recentExecutions.filter(
      e => e.successfulService
    ).length;
    const successRate = successfulExecutions / recentExecutions.length;

    // Factor in average execution time
    const avgExecutionTime =
      recentExecutions.reduce((sum, e) => sum + e.totalExecutionTime, 0) /
      recentExecutions.length;
    const timeScore = Math.max(0, 10 - avgExecutionTime / 1000); // Penalty for slow execution

    return Math.max(1, Math.min(10, (successRate * 10 + timeScore) / 2));
  }

  /**
   * Calculate service reliability scores
   */
  private calculateServiceReliability(): Map<string, number> {
    const reliability = new Map<string, number>();

    this.serviceMetrics.forEach((metrics, service) => {
      let score = 10;

      // Success rate factor
      score *= metrics.successRate / 100;

      // Response time factor
      if (metrics.averageResponseTime > 10000) score *= 0.5;
      else if (metrics.averageResponseTime > 5000) score *= 0.7;
      else if (metrics.averageResponseTime > 2000) score *= 0.9;

      // Recent failures factor
      if (metrics.recentFailures.length > 5) score *= 0.5;
      else if (metrics.recentFailures.length > 2) score *= 0.8;

      reliability.set(service, Math.max(1, Math.min(10, score)));
    });

    return reliability;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const serviceReliability = this.calculateServiceReliability();

    // Check for unreliable services
    serviceReliability.forEach((score, service) => {
      if (score < 5) {
        recommendations.push(
          `Service ${service} has low reliability (${score.toFixed(1)}/10). Consider investigation.`
        );
      }
    });

    // Check fallback chain health
    const chainHealth = this.calculateFallbackChainHealth();
    if (chainHealth < 7) {
      recommendations.push(
        `Fallback chain health is suboptimal (${chainHealth.toFixed(1)}/10). Review service configuration.`
      );
    }

    // Check for services with frequent failures
    const recentFailures = this.getRecentServiceFailures();
    recentFailures.forEach((failures, service) => {
      if (failures > 3) {
        recommendations.push(
          `Service ${service} has ${failures} recent failures. Check service status.`
        );
      }
    });

    return recommendations;
  }

  /**
   * Identify critical issues
   */
  private identifyCriticalIssues(): string[] {
    const issues: string[] = [];
    const availabilityStatus = this.getCurrentAvailabilityStatus();

    // Check if all services are down
    const availableServices = Array.from(availabilityStatus.values()).filter(
      Boolean
    );
    if (availableServices.length === 0) {
      issues.push('All AI services are currently unavailable');
    }

    // Check for services with 0% success rate
    this.serviceMetrics.forEach((metrics, service) => {
      if (metrics.totalCalls > 5 && metrics.successRate === 0) {
        issues.push(
          `Service ${service} has 0% success rate over ${metrics.totalCalls} calls`
        );
      }
    });

    // Check for very slow services
    this.serviceMetrics.forEach((metrics, service) => {
      if (metrics.averageResponseTime > 30000) {
        // > 30 seconds
        issues.push(
          `Service ${service} has very slow response times (${(metrics.averageResponseTime / 1000).toFixed(1)}s average)`
        );
      }
    });

    return issues;
  }

  /**
   * Get recent service failures count
   */
  private getRecentServiceFailures(): Map<string, number> {
    const failures = new Map<string, number>();
    const recentChecks = this.availabilityChecks.slice(-50); // Last 50 checks

    recentChecks.forEach(check => {
      if (!check.available) {
        const key = `${check.service}-${check.component}`;
        failures.set(key, (failures.get(key) || 0) + 1);
      }
    });

    return failures;
  }
}

// Global service coordinator debugger instance
let serviceCoordinatorDebuggerInstance: ServiceCoordinatorDebugger | null =
  null;

/**
 * Get the global service coordinator debugger instance
 */
export function getServiceCoordinatorDebugger(): ServiceCoordinatorDebugger {
  if (!serviceCoordinatorDebuggerInstance) {
    serviceCoordinatorDebuggerInstance = new ServiceCoordinatorDebugger();
  }
  return serviceCoordinatorDebuggerInstance;
}

/**
 * Reset the service coordinator debugger instance
 */
export function resetServiceCoordinatorDebugger(): void {
  if (serviceCoordinatorDebuggerInstance) {
    serviceCoordinatorDebuggerInstance.clearData();
    serviceCoordinatorDebuggerInstance = null;
  }
}
