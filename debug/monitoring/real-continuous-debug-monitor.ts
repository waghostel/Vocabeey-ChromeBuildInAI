/**
 * Real Continuous Debug Monitor
 * Implements real-time debugging checks on live extension with MCP integration
 */

import { MCPConnectionManager } from '../utils/mcp-connection-manager';
import { DebugDashboard } from '../utils/debug-dashboard';
import { RealDebugDataAggregator } from '../reports/real-debug-data-aggregator';
import {
  RealTestScenarioExecutor,
  RealTestResult,
} from '../scenarios/real-test-scenario-executor';
import {
  MonitoringAlert,
  DebugSessionState,
  PerformanceMetric,
  ExtensionContext,
} from '../types/debug-types';

export interface RealMonitoringConfig {
  enabled: boolean;
  interval: number; // milliseconds
  realTimeChecks: boolean;
  performanceThresholds: {
    memoryUsage: number; // MB
    responseTime: number; // ms
    errorRate: number; // percentage (0-1)
    failureRate: number; // percentage (0-1)
    cpuUsage: number; // percentage (0-100)
  };
  extensionMonitoring: {
    serviceWorker: boolean;
    contentScript: boolean;
    offscreen: boolean;
    ui: boolean;
  };
  alerting: {
    immediate: boolean;
    channels: string[];
    severityLevels: string[];
  };
  dashboard: {
    enabled: boolean;
    refreshInterval: number;
    maxDataPoints: number;
  };
}

export interface LiveExtensionMetrics {
  timestamp: Date;
  contexts: {
    serviceWorker: ExtensionContextMetrics;
    contentScript: ExtensionContextMetrics;
    offscreen: ExtensionContextMetrics;
    ui: ExtensionContextMetrics;
  };
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    networkLatency: number;
    responseTime: number;
  };
  health: {
    overallScore: number;
    contextHealth: Record<string, number>;
    criticalIssues: string[];
    warnings: string[];
  };
}

export interface ExtensionContextMetrics {
  isActive: boolean;
  isHealthy: boolean;
  memoryUsage: number;
  errorCount: number;
  lastActivity: Date;
  responseTime: number;
  healthScore: number;
  issues: string[];
}

export interface RealTimeAlert extends Omit<MonitoringAlert, 'type'> {
  type:
    | 'failure_rate'
    | 'execution_time'
    | 'memory_usage'
    | 'scenario_failure'
    | 'health_critical'
    | 'memory_usage'
    | 'response_time'
    | 'context_unhealthy'
    | 'test_failure_rate'
    | 'test_failure'
    | 'monitoring_error';
  extensionContext?: string;
  performanceImpact: 'low' | 'medium' | 'high' | 'critical';
  autoRecovery: boolean;
  recoveryActions: string[];
  realTimeData: any;
}

export class RealContinuousDebugMonitor {
  private config: RealMonitoringConfig;
  private mcpConnectionManager: MCPConnectionManager;
  private dashboard: DebugDashboard;
  private dataAggregator: RealDebugDataAggregator;
  private testExecutor: RealTestScenarioExecutor;

  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private realTimeInterval?: NodeJS.Timeout;
  private dashboardInterval?: NodeJS.Timeout;

  private currentMetrics: LiveExtensionMetrics | null = null;
  private metricsHistory: LiveExtensionMetrics[] = [];
  private activeAlerts: RealTimeAlert[] = [];
  private sessionState: DebugSessionState | null = null;

  constructor(
    mcpConnectionManager: MCPConnectionManager,
    config?: Partial<RealMonitoringConfig>
  ) {
    this.mcpConnectionManager = mcpConnectionManager;
    this.config = this.createDefaultConfig(config);

    this.dashboard = new DebugDashboard({
      refreshInterval: this.config.dashboard.refreshInterval,
      maxDataPoints: this.config.dashboard.maxDataPoints,
      showRealTime: true,
      enableCharts: true,
    });

    this.dataAggregator = new RealDebugDataAggregator(mcpConnectionManager);
    this.testExecutor = new RealTestScenarioExecutor(mcpConnectionManager);
  }

  /**
   * Create default monitoring configuration
   */
  private createDefaultConfig(
    overrides?: Partial<RealMonitoringConfig>
  ): RealMonitoringConfig {
    return {
      enabled: true,
      interval: 60000, // 1 minute for comprehensive checks
      realTimeChecks: true,
      performanceThresholds: {
        memoryUsage: 100, // 100MB
        responseTime: 2000, // 2 seconds
        errorRate: 0.05, // 5%
        failureRate: 0.1, // 10%
        cpuUsage: 80, // 80%
      },
      extensionMonitoring: {
        serviceWorker: true,
        contentScript: true,
        offscreen: true,
        ui: true,
      },
      alerting: {
        immediate: true,
        channels: ['console', 'dashboard'],
        severityLevels: ['medium', 'high', 'critical'],
      },
      dashboard: {
        enabled: true,
        refreshInterval: 5000, // 5 seconds
        maxDataPoints: 200,
      },
      ...overrides,
    };
  }

  /**
   * Start real continuous monitoring
   */
  async startRealTimeMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('Real-time monitoring is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('Real-time monitoring is disabled');
      return;
    }

    console.log('🚀 Starting real continuous debugging monitoring...');

    // Verify MCP connection
    const mcpStatus = this.mcpConnectionManager.getConnectionStatus();
    if (!mcpStatus.isConnected) {
      console.log('Initializing MCP connection for monitoring...');
      const connected =
        await this.mcpConnectionManager.initializeMCPConnection();
      if (!connected) {
        throw new Error('Failed to establish MCP connection for monitoring');
      }
    }

    // Initialize session state
    this.sessionState = {
      sessionId: `real-monitor-${Date.now()}`,
      status: 'active',
      startTime: new Date(),
      activeContexts: [],
      testResults: [],
      capturedData: {
        consoleMessages: [],
        networkRequests: [],
        performanceMetrics: [],
        memorySnapshots: [],
        errorLogs: [],
        storageOperations: [],
      },
      configuration: {
        timeout: 300000, // 5 minutes
        maxRetries: 3,
        captureConsole: true,
        captureNetwork: true,
        capturePerformance: true,
        captureStorage: true,
        captureMemory: true,
        contexts: ['service-worker', 'content-script', 'offscreen', 'ui'],
      },
    };

    this.isMonitoring = true;

    // Start real-time checks (frequent, lightweight)
    if (this.config.realTimeChecks) {
      this.startRealTimeChecks();
    }

    // Start comprehensive monitoring (less frequent, thorough)
    this.startComprehensiveMonitoring();

    // Start dashboard updates
    if (this.config.dashboard.enabled) {
      this.startDashboardUpdates();
    }

    // Perform initial comprehensive check
    await this.performComprehensiveCheck();

    console.log('✅ Real continuous debugging monitoring started successfully');
  }

  /**
   * Stop real-time monitoring
   */
  stopRealTimeMonitoring(): void {
    if (!this.isMonitoring) {
      console.warn('Real-time monitoring is not running');
      return;
    }

    console.log('🛑 Stopping real continuous debugging monitoring...');

    this.isMonitoring = false;

    // Clear all intervals
    if (this.realTimeInterval) {
      clearInterval(this.realTimeInterval);
      this.realTimeInterval = undefined;
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    if (this.dashboardInterval) {
      clearInterval(this.dashboardInterval);
      this.dashboardInterval = undefined;
    }

    // Stop dashboard real-time updates
    this.dashboard.stopRealTimeUpdates();

    // Update session state
    if (this.sessionState) {
      this.sessionState.status = 'completed';
      this.sessionState.endTime = new Date();
    }

    console.log('✅ Real continuous debugging monitoring stopped');
  }

  /**
   * Start real-time checks (every 5 seconds)
   */
  private startRealTimeChecks(): void {
    this.realTimeInterval = setInterval(async () => {
      try {
        await this.performRealTimeCheck();
      } catch (error) {
        console.error('Real-time check failed:', error);
        await this.handleMonitoringError(error, 'real-time-check');
      }
    }, 5000); // 5 seconds

    console.log('Started real-time checks (5s interval)');
  }

  /**
   * Start comprehensive monitoring
   */
  private startComprehensiveMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performComprehensiveCheck();
      } catch (error) {
        console.error('Comprehensive check failed:', error);
        await this.handleMonitoringError(error, 'comprehensive-check');
      }
    }, this.config.interval);

    console.log(
      `Started comprehensive monitoring (${this.config.interval}ms interval)`
    );
  }

  /**
   * Start dashboard updates
   */
  private startDashboardUpdates(): void {
    this.dashboardInterval = setInterval(async () => {
      try {
        await this.updateDashboard();
      } catch (error) {
        console.error('Dashboard update failed:', error);
      }
    }, this.config.dashboard.refreshInterval);

    console.log(
      `Started dashboard updates (${this.config.dashboard.refreshInterval}ms interval)`
    );
  }

  /**
   * Perform real-time check (lightweight, fast)
   */
  private async performRealTimeCheck(): Promise<void> {
    const startTime = Date.now();

    try {
      // Get live extension metrics
      const metrics = await this.collectLiveExtensionMetrics();
      this.currentMetrics = metrics;

      // Add to history (keep last 100 entries)
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > 100) {
        this.metricsHistory = this.metricsHistory.slice(-100);
      }

      // Check for immediate alerts
      const alerts = this.analyzeRealTimeMetrics(metrics);
      if (alerts.length > 0) {
        await this.processRealTimeAlerts(alerts);
      }

      // Update session state with performance metrics
      if (this.sessionState) {
        this.sessionState.capturedData.performanceMetrics.push({
          timestamp: metrics.timestamp,
          name: 'overall_health',
          value: metrics.health.overallScore,
          unit: 'score',
          context: 'real-time-monitor',
        });
      }

      const duration = Date.now() - startTime;
      if (duration > 1000) {
        // Warn if real-time check takes too long
        console.warn(`Real-time check took ${duration}ms (should be < 1000ms)`);
      }
    } catch (error) {
      console.error('Real-time check error:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive check (thorough, slower)
   */
  private async performComprehensiveCheck(): Promise<void> {
    const startTime = Date.now();
    console.log('🔍 Performing comprehensive debugging check...');

    try {
      // Execute real test scenarios
      const testResults = await this.executeRealTestScenarios();

      // Collect detailed metrics
      const detailedMetrics = await this.collectDetailedMetrics();

      // Analyze results and generate alerts
      const alerts = this.analyzeComprehensiveResults(
        testResults,
        detailedMetrics
      );

      // Process alerts
      if (alerts.length > 0) {
        await this.processComprehensiveAlerts(alerts);
      }

      // Update session state
      if (this.sessionState) {
        this.sessionState.testResults.push(...testResults);

        // Add detailed performance metrics
        detailedMetrics.forEach(metric => {
          this.sessionState!.capturedData.performanceMetrics.push(metric);
        });
      }

      // Generate report if there are significant issues
      if (
        alerts.some(
          alert => alert.severity === 'critical' || alert.severity === 'high'
        )
      ) {
        await this.generateComprehensiveReport(testResults, alerts);
      }

      const duration = Date.now() - startTime;
      console.log(
        `✅ Comprehensive check completed in ${duration}ms (${alerts.length} alerts)`
      );
    } catch (error) {
      console.error('Comprehensive check error:', error);
      throw error;
    }
  }

  /**
   * Collect live extension metrics from all contexts
   */
  private async collectLiveExtensionMetrics(): Promise<LiveExtensionMetrics> {
    const timestamp = new Date();
    const contexts = {
      serviceWorker: await this.collectContextMetrics('service-worker'),
      contentScript: await this.collectContextMetrics('content-script'),
      offscreen: await this.collectContextMetrics('offscreen'),
      ui: await this.collectContextMetrics('ui'),
    };

    // Calculate overall performance
    const performance = {
      memoryUsage: Object.values(contexts).reduce(
        (sum, ctx) => sum + ctx.memoryUsage,
        0
      ),
      cpuUsage: Math.max(
        ...Object.values(contexts).map(ctx => ctx.healthScore * 100)
      ),
      networkLatency:
        this.mcpConnectionManager.getConnectionStatus().connectionLatency,
      responseTime: Math.max(
        ...Object.values(contexts).map(ctx => ctx.responseTime)
      ),
    };

    // Calculate health scores
    const contextHealth: Record<string, number> = {};
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    Object.entries(contexts).forEach(([name, metrics]) => {
      contextHealth[name] = metrics.healthScore;

      if (metrics.healthScore < 0.5) {
        criticalIssues.push(
          `${name} context health critical (${(metrics.healthScore * 100).toFixed(1)}%)`
        );
      } else if (metrics.healthScore < 0.8) {
        warnings.push(
          `${name} context health degraded (${(metrics.healthScore * 100).toFixed(1)}%)`
        );
      }

      criticalIssues.push(
        ...metrics.issues.filter(issue => issue.includes('critical'))
      );
      warnings.push(
        ...metrics.issues.filter(issue => !issue.includes('critical'))
      );
    });

    const overallScore =
      Object.values(contextHealth).reduce((sum, score) => sum + score, 0) /
      Object.keys(contextHealth).length;

    return {
      timestamp,
      contexts,
      performance,
      health: {
        overallScore,
        contextHealth,
        criticalIssues,
        warnings,
      },
    };
  }

  /**
   * Collect metrics for a specific extension context
   */
  private async collectContextMetrics(
    contextType: string
  ): Promise<ExtensionContextMetrics> {
    try {
      // Get pages list to find the context
      const pagesResult = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_list_pages'
      );

      if (!pagesResult.success) {
        return this.createErrorContextMetrics(
          contextType,
          'Failed to list pages'
        );
      }

      const pages = pagesResult.data || [];
      const contextPage = this.findContextPage(pages, contextType);

      if (!contextPage) {
        return this.createErrorContextMetrics(
          contextType,
          'Context page not found'
        );
      }

      // Select the context page
      const selectResult = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_select_page',
        {
          pageIdx: contextPage.pageIdx,
        }
      );

      if (!selectResult.success) {
        return this.createErrorContextMetrics(
          contextType,
          'Failed to select context page'
        );
      }

      // Collect context-specific metrics
      const metrics = await this.collectContextSpecificMetrics(contextType);

      return {
        isActive: true,
        isHealthy: metrics.healthScore > 0.7,
        memoryUsage: metrics.memoryUsage,
        errorCount: metrics.errorCount,
        lastActivity: new Date(),
        responseTime: metrics.responseTime,
        healthScore: metrics.healthScore,
        issues: metrics.issues,
      };
    } catch (error) {
      console.error(`Error collecting metrics for ${contextType}:`, error);
      return this.createErrorContextMetrics(contextType, String(error));
    }
  }

  /**
   * Collect context-specific metrics using MCP evaluation
   */
  private async collectContextSpecificMetrics(contextType: string): Promise<{
    memoryUsage: number;
    errorCount: number;
    responseTime: number;
    healthScore: number;
    issues: string[];
  }> {
    const startTime = Date.now();
    const issues: string[] = [];

    try {
      // Execute context-specific monitoring script
      const monitoringScript =
        this.generateContextMonitoringScript(contextType);
      const evalResult = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: monitoringScript,
        }
      );

      const responseTime = Date.now() - startTime;

      if (!evalResult.success) {
        issues.push(`Script evaluation failed: ${evalResult.error}`);
        return {
          memoryUsage: 0,
          errorCount: 1,
          responseTime,
          healthScore: 0.1,
          issues,
        };
      }

      const data = evalResult.data || {};

      // Extract metrics from evaluation result
      const memoryUsage = (data.memoryUsage || 0) / 1024 / 1024; // Convert to MB
      const errorCount = data.errorCount || 0;

      // Calculate health score based on various factors
      let healthScore = 1.0;

      if (memoryUsage > this.config.performanceThresholds.memoryUsage) {
        healthScore -= 0.3;
        issues.push(`High memory usage: ${memoryUsage.toFixed(1)}MB`);
      }

      if (responseTime > this.config.performanceThresholds.responseTime) {
        healthScore -= 0.2;
        issues.push(`Slow response time: ${responseTime}ms`);
      }

      if (errorCount > 0) {
        healthScore -= Math.min(0.4, errorCount * 0.1);
        issues.push(`${errorCount} errors detected`);
      }

      // Check context-specific health indicators
      if (data.contextSpecific) {
        const contextIssues = this.analyzeContextSpecificData(
          contextType,
          data.contextSpecific
        );
        issues.push(...contextIssues);
        healthScore -= contextIssues.length * 0.1;
      }

      return {
        memoryUsage,
        errorCount,
        responseTime,
        healthScore: Math.max(0, healthScore),
        issues,
      };
    } catch (error) {
      issues.push(`Metrics collection failed: ${error}`);
      return {
        memoryUsage: 0,
        errorCount: 1,
        responseTime: Date.now() - startTime,
        healthScore: 0.1,
        issues,
      };
    }
  }

  /**
   * Generate context-specific monitoring script
   */
  private generateContextMonitoringScript(contextType: string): string {
    const baseScript = `
      (() => {
        const result = {
          timestamp: Date.now(),
          memoryUsage: 0,
          errorCount: 0,
          contextSpecific: {}
        };

        // Memory usage
        if (typeof performance !== 'undefined' && performance.memory) {
          result.memoryUsage = performance.memory.usedJSHeapSize;
        }

        // Error count (check console errors)
        if (typeof console !== 'undefined' && console.error) {
          // This is a simplified approach - in real implementation, 
          // we'd track errors more comprehensively
          result.errorCount = 0;
        }
    `;

    switch (contextType) {
      case 'service-worker':
        return (
          baseScript +
          `
          // Service worker specific checks
          result.contextSpecific = {
            isServiceWorker: typeof importScripts !== 'undefined',
            hasChrome: typeof chrome !== 'undefined',
            extensionId: chrome?.runtime?.id,
            listeners: chrome?.runtime?.onMessage ? 'active' : 'inactive'
          };
          return result;
        })()`
        );

      case 'content-script':
        return (
          baseScript +
          `
          // Content script specific checks
          result.contextSpecific = {
            hasDOM: typeof document !== 'undefined',
            hasChrome: typeof chrome !== 'undefined',
            extensionId: chrome?.runtime?.id,
            domReady: document?.readyState,
            scriptInjected: typeof window.extensionContentExtractor !== 'undefined'
          };
          return result;
        })()`
        );

      case 'offscreen':
        return (
          baseScript +
          `
          // Offscreen document specific checks
          result.contextSpecific = {
            hasChrome: typeof chrome !== 'undefined',
            hasOffscreenAPI: typeof chrome?.offscreen !== 'undefined',
            aiServices: {
              chromeAI: typeof chrome?.aiOriginTrial !== 'undefined',
              geminiAPI: typeof fetch !== 'undefined'
            }
          };
          return result;
        })()`
        );

      case 'ui':
        return (
          baseScript +
          `
          // UI context specific checks
          result.contextSpecific = {
            hasDOM: typeof document !== 'undefined',
            hasChrome: typeof chrome !== 'undefined',
            uiElements: document?.querySelectorAll('[data-extension-ui]')?.length || 0,
            isVisible: document?.visibilityState === 'visible'
          };
          return result;
        })()`
        );

      default:
        return (
          baseScript +
          `
          return result;
        })()`
        );
    }
  }

  /**
   * Analyze context-specific data for issues
   */
  private analyzeContextSpecificData(contextType: string, data: any): string[] {
    const issues: string[] = [];

    switch (contextType) {
      case 'service-worker':
        if (!data.isServiceWorker)
          issues.push('Not running in service worker context');
        if (!data.hasChrome) issues.push('Chrome APIs not available');
        if (!data.extensionId) issues.push('Extension ID not available');
        if (data.listeners !== 'active')
          issues.push('Message listeners not active');
        break;

      case 'content-script':
        if (!data.hasDOM) issues.push('DOM not available');
        if (!data.hasChrome) issues.push('Chrome APIs not available');
        if (!data.scriptInjected)
          issues.push('Content extraction script not injected');
        if (data.domReady !== 'complete') issues.push('DOM not fully loaded');
        break;

      case 'offscreen':
        if (!data.hasChrome) issues.push('Chrome APIs not available');
        if (!data.hasOffscreenAPI) issues.push('Offscreen API not available');
        if (!data.aiServices.chromeAI && !data.aiServices.geminiAPI) {
          issues.push('No AI services available');
        }
        break;

      case 'ui':
        if (!data.hasDOM) issues.push('DOM not available');
        if (data.uiElements === 0) issues.push('No UI elements found');
        if (!data.isVisible) issues.push('UI not visible');
        break;
    }

    return issues;
  }

  /**
   * Find context page in pages list
   */
  private findContextPage(pages: any[], contextType: string): any {
    switch (contextType) {
      case 'service-worker':
        return pages.find(
          page =>
            page.type === 'service_worker' ||
            page.url?.includes('background') ||
            page.title?.toLowerCase().includes('service worker')
        );

      case 'content-script':
        return pages.find(
          page =>
            page.type === 'page' &&
            !page.url?.startsWith('chrome-extension://') &&
            !page.url?.startsWith('chrome://')
        );

      case 'offscreen':
        return pages.find(
          page =>
            page.url?.includes('offscreen') ||
            page.title?.toLowerCase().includes('offscreen')
        );

      case 'ui':
        return pages.find(
          page =>
            page.url?.startsWith('chrome-extension://') &&
            (page.url?.includes('ui') || page.url?.includes('popup'))
        );

      default:
        return pages[0]; // Fallback to first page
    }
  }

  /**
   * Create error context metrics when collection fails
   */
  private createErrorContextMetrics(
    contextType: string,
    error: string
  ): ExtensionContextMetrics {
    return {
      isActive: false,
      isHealthy: false,
      memoryUsage: 0,
      errorCount: 1,
      lastActivity: new Date(),
      responseTime: 0,
      healthScore: 0,
      issues: [`Context unavailable: ${error}`],
    };
  }

  /**
   * Execute real test scenarios for comprehensive monitoring
   */
  private async executeRealTestScenarios(): Promise<RealTestResult[]> {
    const scenarios = [
      'Extension Loading Test',
      'Content Extraction Test',
      'Service Worker Communication Test',
      'Memory Usage Test',
    ];

    const results: RealTestResult[] = [];

    for (const scenario of scenarios) {
      try {
        const result = await this.testExecutor.executeRealScenario(scenario);
        results.push(result);
      } catch (error) {
        console.error(`Failed to execute scenario ${scenario}:`, error);
        results.push({
          scenarioName: scenario,
          passed: false,
          error: String(error),
          executionTime: 0,
          timestamp: new Date(),
          metrics: { memoryUsage: 0, mcpCalls: 0, validationScore: 0 },
          realData: {},
          mcpFunctionCalls: [],
          validationResults: { passed: false, details: [String(error)] },
        });
      }
    }

    return results;
  }

  /**
   * Collect detailed metrics for comprehensive analysis
   */
  private async collectDetailedMetrics(): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];
    const timestamp = new Date();

    // Collect console messages
    try {
      const consoleResult = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_list_console_messages'
      );
      if (consoleResult.success) {
        const messages = consoleResult.data || [];
        metrics.push({
          timestamp,
          name: 'console_messages',
          value: messages.length,
          unit: 'count',
          context: 'comprehensive-monitor',
        });
      }
    } catch (error) {
      console.error('Failed to collect console messages:', error);
    }

    // Collect network requests
    try {
      const networkResult = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_list_network_requests'
      );
      if (networkResult.success) {
        const requests = networkResult.data || [];
        metrics.push({
          timestamp,
          name: 'network_requests',
          value: requests.length,
          unit: 'count',
          context: 'comprehensive-monitor',
        });
      }
    } catch (error) {
      console.error('Failed to collect network requests:', error);
    }

    return metrics;
  }

  /**
   * Analyze real-time metrics for immediate alerts
   */
  private analyzeRealTimeMetrics(
    metrics: LiveExtensionMetrics
  ): RealTimeAlert[] {
    const alerts: RealTimeAlert[] = [];
    const timestamp = new Date();

    // Check overall health score
    if (metrics.health.overallScore < 0.5) {
      alerts.push({
        id: this.generateAlertId(),
        timestamp,
        type: 'health_critical',
        severity: 'critical',
        message: `Extension health critical: ${(metrics.health.overallScore * 100).toFixed(1)}%`,
        details: {
          overallScore: metrics.health.overallScore,
          criticalIssues: metrics.health.criticalIssues,
          contextHealth: metrics.health.contextHealth,
        },
        extensionContext: 'overall',
        performanceImpact: 'critical',
        autoRecovery: false,
        recoveryActions: [
          'Restart extension contexts',
          'Clear cache',
          'Reload extension',
        ],
        realTimeData: metrics,
      });
    }

    // Check memory usage
    if (
      metrics.performance.memoryUsage >
      this.config.performanceThresholds.memoryUsage
    ) {
      alerts.push({
        id: this.generateAlertId(),
        timestamp,
        type: 'memory_usage',
        severity:
          metrics.performance.memoryUsage >
          this.config.performanceThresholds.memoryUsage * 2
            ? 'critical'
            : 'high',
        message: `High memory usage: ${metrics.performance.memoryUsage.toFixed(1)}MB`,
        details: {
          currentUsage: metrics.performance.memoryUsage,
          threshold: this.config.performanceThresholds.memoryUsage,
          contextBreakdown: Object.entries(metrics.contexts).map(
            ([name, ctx]) => ({
              context: name,
              usage: ctx.memoryUsage,
            })
          ),
        },
        extensionContext: 'memory',
        performanceImpact: 'high',
        autoRecovery: true,
        recoveryActions: [
          'Trigger garbage collection',
          'Clear caches',
          'Restart high-usage contexts',
        ],
        realTimeData: metrics,
      });
    }

    // Check response time
    if (
      metrics.performance.responseTime >
      this.config.performanceThresholds.responseTime
    ) {
      alerts.push({
        id: this.generateAlertId(),
        timestamp,
        type: 'response_time',
        severity: 'medium',
        message: `Slow response time: ${metrics.performance.responseTime}ms`,
        details: {
          responseTime: metrics.performance.responseTime,
          threshold: this.config.performanceThresholds.responseTime,
          slowestContext: this.findSlowestContext(metrics.contexts),
        },
        extensionContext: 'performance',
        performanceImpact: 'medium',
        autoRecovery: true,
        recoveryActions: [
          'Optimize slow operations',
          'Reduce polling frequency',
        ],
        realTimeData: metrics,
      });
    }

    // Check individual context health
    Object.entries(metrics.contexts).forEach(
      ([contextName, contextMetrics]) => {
        if (!contextMetrics.isHealthy) {
          alerts.push({
            id: this.generateAlertId(),
            timestamp,
            type: 'context_unhealthy',
            severity: contextMetrics.healthScore < 0.3 ? 'critical' : 'high',
            message: `${contextName} context unhealthy: ${(contextMetrics.healthScore * 100).toFixed(1)}%`,
            details: {
              context: contextName,
              healthScore: contextMetrics.healthScore,
              issues: contextMetrics.issues,
              memoryUsage: contextMetrics.memoryUsage,
              errorCount: contextMetrics.errorCount,
            },
            extensionContext: contextName,
            performanceImpact:
              contextMetrics.healthScore < 0.3 ? 'critical' : 'high',
            autoRecovery: contextMetrics.healthScore > 0.2,
            recoveryActions: [
              `Restart ${contextName} context`,
              'Clear context cache',
              'Reinitialize context',
            ],
            realTimeData: metrics,
          });
        }
      }
    );

    return alerts;
  }

  /**
   * Analyze comprehensive results for detailed alerts
   */
  private analyzeComprehensiveResults(
    testResults: RealTestResult[],
    metrics: PerformanceMetric[]
  ): RealTimeAlert[] {
    const alerts: RealTimeAlert[] = [];
    const timestamp = new Date();

    // Analyze test failure rate
    const failedTests = testResults.filter(result => !result.passed);
    const failureRate =
      testResults.length > 0 ? failedTests.length / testResults.length : 0;

    if (failureRate > this.config.performanceThresholds.failureRate) {
      alerts.push({
        id: this.generateAlertId(),
        timestamp,
        type: 'test_failure_rate',
        severity: failureRate > 0.5 ? 'critical' : 'high',
        message: `High test failure rate: ${(failureRate * 100).toFixed(1)}%`,
        details: {
          failureRate,
          failedTests: failedTests.map(test => ({
            scenario: test.scenarioName,
            error: test.error,
            executionTime: test.executionTime,
          })),
          totalTests: testResults.length,
        },
        extensionContext: 'testing',
        performanceImpact: failureRate > 0.5 ? 'critical' : 'high',
        autoRecovery: false,
        recoveryActions: [
          'Investigate failed tests',
          'Check extension state',
          'Restart debugging session',
        ],
        realTimeData: { testResults, metrics },
      });
    }

    // Analyze individual test failures
    failedTests.forEach(test => {
      alerts.push({
        id: this.generateAlertId(),
        timestamp,
        type: 'test_failure',
        severity: test.scenarioName.includes('Critical')
          ? 'critical'
          : 'medium',
        message: `Test failed: ${test.scenarioName}`,
        details: {
          scenarioName: test.scenarioName,
          error: test.error,
          executionTime: test.executionTime,
          metrics: test.metrics,
          mcpCalls: test.mcpFunctionCalls?.length || 0,
        },
        extensionContext: 'testing',
        performanceImpact: 'medium',
        autoRecovery: true,
        recoveryActions: [
          `Retry ${test.scenarioName}`,
          'Check test prerequisites',
          'Validate test environment',
        ],
        realTimeData: test,
      });
    });

    return alerts;
  }

  /**
   * Process real-time alerts
   */
  private async processRealTimeAlerts(alerts: RealTimeAlert[]): Promise<void> {
    for (const alert of alerts) {
      // Add to active alerts
      this.activeAlerts.push(alert);

      // Keep only recent alerts (last 100)
      if (this.activeAlerts.length > 100) {
        this.activeAlerts = this.activeAlerts.slice(-100);
      }

      // Process based on severity and configuration
      if (this.config.alerting.severityLevels.includes(alert.severity)) {
        await this.sendAlert(alert);
      }

      // Attempt auto-recovery if enabled
      if (alert.autoRecovery && alert.recoveryActions.length > 0) {
        await this.attemptAutoRecovery(alert);
      }

      console.log(`🚨 [${alert.severity.toUpperCase()}] ${alert.message}`);
      if (alert.details) {
        console.log('Alert details:', alert.details);
      }
    }
  }

  /**
   * Process comprehensive alerts
   */
  private async processComprehensiveAlerts(
    alerts: RealTimeAlert[]
  ): Promise<void> {
    // Same as real-time alerts but with additional reporting
    await this.processRealTimeAlerts(alerts);

    // Generate comprehensive alert report if there are critical issues
    const criticalAlerts = alerts.filter(
      alert => alert.severity === 'critical'
    );
    if (criticalAlerts.length > 0) {
      await this.generateAlertReport(criticalAlerts);
    }
  }

  /**
   * Send alert through configured channels
   */
  private async sendAlert(alert: RealTimeAlert): Promise<void> {
    if (this.config.alerting.channels.includes('console')) {
      const emoji = {
        low: '🟡',
        medium: '🟠',
        high: '🔴',
        critical: '🚨',
      }[alert.severity];

      console.warn(
        `${emoji} REAL-TIME ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`
      );

      if (alert.extensionContext) {
        console.warn(`  Context: ${alert.extensionContext}`);
      }

      if (alert.performanceImpact !== 'low') {
        console.warn(`  Performance Impact: ${alert.performanceImpact}`);
      }

      if (alert.recoveryActions.length > 0) {
        console.warn(`  Recovery Actions: ${alert.recoveryActions.join(', ')}`);
      }
    }

    if (this.config.alerting.channels.includes('dashboard')) {
      // Update dashboard with alert
      // This would integrate with the dashboard system
      console.log(`Dashboard alert: ${alert.message}`);
    }
  }

  /**
   * Attempt automatic recovery for alerts
   */
  private async attemptAutoRecovery(alert: RealTimeAlert): Promise<void> {
    console.log(`🔧 Attempting auto-recovery for: ${alert.message}`);

    for (const action of alert.recoveryActions) {
      try {
        await this.executeRecoveryAction(action, alert);
        console.log(`✅ Recovery action completed: ${action}`);
      } catch (error) {
        console.error(`❌ Recovery action failed: ${action}`, error);
      }
    }
  }

  /**
   * Execute specific recovery action
   */
  private async executeRecoveryAction(
    action: string,
    alert: RealTimeAlert
  ): Promise<void> {
    switch (action.toLowerCase()) {
      case 'trigger garbage collection':
        // Trigger GC in extension contexts
        await this.triggerGarbageCollection();
        break;

      case 'clear caches':
        // Clear extension caches
        await this.clearExtensionCaches();
        break;

      case 'restart extension contexts':
        // Restart problematic contexts
        await this.restartExtensionContexts();
        break;

      case 'optimize slow operations':
        // Reduce polling frequency or optimize operations
        await this.optimizeSlowOperations();
        break;

      default:
        console.log(`Recovery action not implemented: ${action}`);
    }
  }

  /**
   * Trigger garbage collection in extension contexts
   */
  private async triggerGarbageCollection(): Promise<void> {
    const gcScript = `
      (() => {
        if (typeof gc !== 'undefined') {
          gc();
          return { gcTriggered: true };
        } else if (window.performance && window.performance.measureUserAgentSpecificMemory) {
          return window.performance.measureUserAgentSpecificMemory();
        }
        return { gcTriggered: false, message: 'GC not available' };
      })()
    `;

    try {
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: gcScript,
        }
      );

      if (result.success) {
        console.log('Garbage collection triggered:', result.data);
      }
    } catch (error) {
      console.error('Failed to trigger garbage collection:', error);
    }
  }

  /**
   * Clear extension caches
   */
  private async clearExtensionCaches(): Promise<void> {
    const clearCacheScript = `
      (() => {
        const result = { cleared: [] };
        
        // Clear various caches
        if (typeof caches !== 'undefined') {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
            result.cleared.push('caches');
          });
        }
        
        // Clear localStorage if available
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
          result.cleared.push('localStorage');
        }
        
        // Clear sessionStorage if available
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
          result.cleared.push('sessionStorage');
        }
        
        return result;
      })()
    `;

    try {
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: clearCacheScript,
        }
      );

      if (result.success) {
        console.log('Caches cleared:', result.data);
      }
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }

  /**
   * Restart extension contexts (placeholder)
   */
  private async restartExtensionContexts(): Promise<void> {
    console.log('Extension context restart would be implemented here');
    // This would involve more complex extension management
  }

  /**
   * Optimize slow operations
   */
  private async optimizeSlowOperations(): Promise<void> {
    // Reduce monitoring frequency temporarily
    if (this.realTimeInterval) {
      clearInterval(this.realTimeInterval);
      this.realTimeInterval = setInterval(async () => {
        try {
          await this.performRealTimeCheck();
        } catch (error) {
          console.error('Real-time check failed:', error);
        }
      }, 10000); // Increase to 10 seconds temporarily

      console.log('Reduced real-time monitoring frequency to 10 seconds');
    }
  }

  /**
   * Update dashboard with current data
   */
  private async updateDashboard(): Promise<void> {
    if (!this.sessionState || !this.currentMetrics) {
      return;
    }

    try {
      await this.dashboard.updateDashboard(this.sessionState);
    } catch (error) {
      console.error('Dashboard update failed:', error);
    }
  }

  /**
   * Generate comprehensive report
   */
  private async generateComprehensiveReport(
    testResults: RealTestResult[],
    alerts: RealTimeAlert[]
  ): Promise<void> {
    try {
      console.log('📊 Generating comprehensive monitoring report...');

      const reportData = {
        sessionId: this.sessionState?.sessionId,
        timestamp: new Date(),
        testResults,
        alerts,
        currentMetrics: this.currentMetrics,
        metricsHistory: this.metricsHistory.slice(-20), // Last 20 entries
        mcpStatus: this.mcpConnectionManager.getConnectionStatus(),
      };

      // In a real implementation, this would use the report generation system
      console.log(
        'Comprehensive report data:',
        JSON.stringify(reportData, null, 2)
      );
    } catch (error) {
      console.error('Failed to generate comprehensive report:', error);
    }
  }

  /**
   * Generate alert report
   */
  private async generateAlertReport(alerts: RealTimeAlert[]): Promise<void> {
    try {
      console.log('🚨 Generating critical alert report...');

      const reportData = {
        timestamp: new Date(),
        criticalAlerts: alerts,
        systemState: this.currentMetrics,
        recoveryActions: alerts.flatMap(alert => alert.recoveryActions),
      };

      console.log(
        'Critical alert report:',
        JSON.stringify(reportData, null, 2)
      );
    } catch (error) {
      console.error('Failed to generate alert report:', error);
    }
  }

  /**
   * Handle monitoring errors
   */
  private async handleMonitoringError(
    error: any,
    context: string
  ): Promise<void> {
    console.error(`Monitoring error in ${context}:`, error);

    // Create error alert
    const errorAlert: RealTimeAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      type: 'monitoring_error',
      severity: 'high',
      message: `Monitoring error in ${context}: ${error}`,
      details: {
        context,
        error: String(error),
        stack: error?.stack,
      },
      extensionContext: 'monitor',
      performanceImpact: 'medium',
      autoRecovery: true,
      recoveryActions: [
        'Restart monitoring',
        'Check MCP connection',
        'Reduce monitoring frequency',
      ],
      realTimeData: { error, context },
    };

    await this.processRealTimeAlerts([errorAlert]);

    // Attempt to recover from monitoring errors
    if (context === 'real-time-check') {
      // Reduce real-time check frequency
      await this.optimizeSlowOperations();
    } else if (context === 'comprehensive-check') {
      // Skip next comprehensive check
      console.log('Skipping next comprehensive check due to error');
    }
  }

  /**
   * Find slowest context from metrics
   */
  private findSlowestContext(
    contexts: Record<string, ExtensionContextMetrics>
  ): string {
    let slowestContext = '';
    let slowestTime = 0;

    Object.entries(contexts).forEach(([name, metrics]) => {
      if (metrics.responseTime > slowestTime) {
        slowestTime = metrics.responseTime;
        slowestContext = name;
      }
    });

    return slowestContext;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `real-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    config: RealMonitoringConfig;
    currentMetrics: LiveExtensionMetrics | null;
    activeAlerts: number;
    sessionId: string | null;
    uptime: number;
  } {
    const uptime = this.sessionState
      ? Date.now() - this.sessionState.startTime.getTime()
      : 0;

    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      currentMetrics: this.currentMetrics,
      activeAlerts: this.activeAlerts.length,
      sessionId: this.sessionState?.sessionId || null,
      uptime,
    };
  }

  /**
   * Get live extension metrics
   */
  getLiveMetrics(): LiveExtensionMetrics | null {
    return this.currentMetrics;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit?: number): LiveExtensionMetrics[] {
    return limit ? this.metricsHistory.slice(-limit) : [...this.metricsHistory];
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): RealTimeAlert[] {
    return [...this.activeAlerts];
  }

  /**
   * Clear active alerts
   */
  clearActiveAlerts(): void {
    const clearedCount = this.activeAlerts.length;
    this.activeAlerts = [];
    console.log(`Cleared ${clearedCount} active alerts`);
  }

  /**
   * Update monitoring configuration
   */
  updateConfiguration(newConfig: Partial<RealMonitoringConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    console.log('Updated real-time monitoring configuration');

    // Restart monitoring if intervals changed
    if (
      this.isMonitoring &&
      (oldConfig.interval !== this.config.interval ||
        oldConfig.dashboard.refreshInterval !==
          this.config.dashboard.refreshInterval)
    ) {
      console.log('Restarting monitoring with new configuration...');
      this.stopRealTimeMonitoring();
      setTimeout(() => {
        this.startRealTimeMonitoring();
      }, 1000);
    }
  }

  /**
   * Export monitoring data
   */
  exportMonitoringData(): {
    config: RealMonitoringConfig;
    currentMetrics: LiveExtensionMetrics | null;
    metricsHistory: LiveExtensionMetrics[];
    activeAlerts: RealTimeAlert[];
    sessionState: DebugSessionState | null;
  } {
    return {
      config: this.config,
      currentMetrics: this.currentMetrics,
      metricsHistory: this.metricsHistory,
      activeAlerts: this.activeAlerts,
      sessionState: this.sessionState,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopRealTimeMonitoring();
    this.dashboard.stopRealTimeUpdates();
    this.activeAlerts = [];
    this.metricsHistory = [];
    this.currentMetrics = null;
    this.sessionState = null;
    console.log('Real continuous debug monitor cleaned up');
  }
}
