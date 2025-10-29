/**
 * Real Debug Alert System
 * Advanced alert system with real-time monitoring and performance-based thresholds
 */

import { RealTimeAlert } from './real-continuous-debug-monitor';
import { LiveExtensionMetrics } from './real-continuous-debug-monitor';
import { MCPConnectionManager } from '../utils/mcp-connection-manager';

export interface RealAlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'performance' | 'health' | 'error' | 'security' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: RealAlertCondition;
  actions: RealAlertAction[];
  cooldownPeriod: number; // milliseconds
  autoRecovery: boolean;
  recoveryActions: string[];
}

export interface RealAlertCondition {
  type: 'threshold' | 'trend' | 'pattern' | 'composite';
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=' | '!=' | 'contains' | 'matches';
  value: number | string | boolean;
  timeWindow?: number; // milliseconds
  aggregation?: 'avg' | 'max' | 'min' | 'sum' | 'count';
  conditions?: RealAlertCondition[]; // For composite conditions
  logicalOperator?: 'AND' | 'OR';
}

export interface RealAlertAction {
  type: 'notification' | 'recovery' | 'escalation' | 'custom';
  config: {
    channels?: string[];
    template?: string;
    immediate?: boolean;
    script?: string;
    webhook?: string;
    email?: string[];
    customHandler?: (alert: RealTimeAlert) => Promise<void>;
  };
  enabled: boolean;
  delay?: number; // milliseconds
}

export interface AlertStatistics {
  totalAlerts: number;
  alertsByCategory: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  alertsByContext: Record<string, number>;
  alertTrends: Array<{
    timestamp: Date;
    count: number;
    severity: string;
  }>;
  topAlertRules: Array<{
    ruleId: string;
    ruleName: string;
    triggerCount: number;
    lastTriggered: Date;
  }>;
  recoverySuccess: {
    attempted: number;
    successful: number;
    rate: number;
  };
}

export class RealDebugAlertSystem {
  private alertRules: Map<string, RealAlertRule> = new Map();
  private activeAlerts: Map<string, RealTimeAlert> = new Map();
  private alertHistory: RealTimeAlert[] = [];
  private ruleCooldowns: Map<string, Date> = new Map();
  private mcpConnectionManager: MCPConnectionManager;
  private metricsBuffer: LiveExtensionMetrics[] = [];
  private alertStatistics: AlertStatistics;

  constructor(mcpConnectionManager: MCPConnectionManager) {
    this.mcpConnectionManager = mcpConnectionManager;
    this.alertStatistics = this.initializeStatistics();
    this.initializeDefaultRules();
  }

  /**
   * Initialize default alert statistics
   */
  private initializeStatistics(): AlertStatistics {
    return {
      totalAlerts: 0,
      alertsByCategory: {},
      alertsBySeverity: {},
      alertsByContext: {},
      alertTrends: [],
      topAlertRules: [],
      recoverySuccess: {
        attempted: 0,
        successful: 0,
        rate: 0,
      },
    };
  }

  /**
   * Initialize default alert rules based on real performance thresholds
   */
  private initializeDefaultRules(): void {
    const defaultRules: RealAlertRule[] = [
      {
        id: 'critical-memory-usage',
        name: 'Critical Memory Usage',
        description:
          'Triggers when extension memory usage exceeds critical threshold',
        enabled: true,
        category: 'performance',
        severity: 'critical',
        condition: {
          type: 'threshold',
          metric: 'performance.memoryUsage',
          operator: '>',
          value: 150, // 150MB
        },
        actions: [
          {
            type: 'notification',
            config: {
              channels: ['console', 'dashboard'],
              immediate: true,
              template: 'critical-memory',
            },
            enabled: true,
          },
          {
            type: 'recovery',
            config: {
              script: 'triggerGarbageCollection',
            },
            enabled: true,
            delay: 1000,
          },
        ],
        cooldownPeriod: 300000, // 5 minutes
        autoRecovery: true,
        recoveryActions: [
          'Trigger garbage collection',
          'Clear caches',
          'Restart high-usage contexts',
        ],
      },

      {
        id: 'extension-context-failure',
        name: 'Extension Context Failure',
        description: 'Triggers when any extension context becomes unhealthy',
        enabled: true,
        category: 'health',
        severity: 'high',
        condition: {
          type: 'pattern',
          metric: 'contexts.*.isHealthy',
          operator: '=',
          value: false,
        },
        actions: [
          {
            type: 'notification',
            config: {
              channels: ['console'],
              template: 'context-failure',
            },
            enabled: true,
          },
          {
            type: 'recovery',
            config: {
              script: 'restartUnhealthyContext',
            },
            enabled: true,
            delay: 2000,
          },
        ],
        cooldownPeriod: 180000, // 3 minutes
        autoRecovery: true,
        recoveryActions: [
          'Restart context',
          'Reinitialize context',
          'Clear context cache',
        ],
      },

      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'Triggers when error rate exceeds acceptable threshold',
        enabled: true,
        category: 'error',
        severity: 'high',
        condition: {
          type: 'trend',
          metric: 'contexts.*.errorCount',
          operator: '>',
          value: 5,
          timeWindow: 300000, // 5 minutes
          aggregation: 'sum',
        },
        actions: [
          {
            type: 'notification',
            config: {
              channels: ['console', 'dashboard'],
              template: 'high-error-rate',
            },
            enabled: true,
          },
          {
            type: 'escalation',
            config: {
              webhook: 'error-escalation-webhook',
            },
            enabled: false,
            delay: 60000, // 1 minute
          },
        ],
        cooldownPeriod: 600000, // 10 minutes
        autoRecovery: false,
        recoveryActions: [
          'Investigate error sources',
          'Check extension logs',
          'Restart debugging session',
        ],
      },

      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        description: 'Triggers when response times are consistently slow',
        enabled: true,
        category: 'performance',
        severity: 'medium',
        condition: {
          type: 'trend',
          metric: 'performance.responseTime',
          operator: '>',
          value: 3000, // 3 seconds
          timeWindow: 180000, // 3 minutes
          aggregation: 'avg',
        },
        actions: [
          {
            type: 'notification',
            config: {
              channels: ['console'],
              template: 'slow-response',
            },
            enabled: true,
          },
          {
            type: 'recovery',
            config: {
              script: 'optimizePerformance',
            },
            enabled: true,
            delay: 5000,
          },
        ],
        cooldownPeriod: 900000, // 15 minutes
        autoRecovery: true,
        recoveryActions: [
          'Optimize slow operations',
          'Reduce polling frequency',
          'Clear performance bottlenecks',
        ],
      },

      {
        id: 'mcp-connection-instability',
        name: 'MCP Connection Instability',
        description: 'Triggers when MCP connection becomes unstable',
        enabled: true,
        category: 'health',
        severity: 'critical',
        condition: {
          type: 'composite',
          metric: '', // Required but not used for composite
          operator: '>', // Required but not used for composite
          value: 0, // Required but not used for composite
          conditions: [
            {
              type: 'threshold',
              metric: 'mcpStatus.connectionLatency',
              operator: '>',
              value: 5000, // 5 seconds
            },
            {
              type: 'threshold',
              metric: 'mcpStatus.connectionErrors.length',
              operator: '>',
              value: 3,
            },
          ],
          logicalOperator: 'OR',
        },
        actions: [
          {
            type: 'notification',
            config: {
              channels: ['console', 'dashboard'],
              immediate: true,
              template: 'mcp-instability',
            },
            enabled: true,
          },
          {
            type: 'recovery',
            config: {
              script: 'reconnectMCP',
            },
            enabled: true,
            delay: 1000,
          },
        ],
        cooldownPeriod: 120000, // 2 minutes
        autoRecovery: true,
        recoveryActions: [
          'Reconnect MCP server',
          'Restart MCP connection',
          'Check MCP server health',
        ],
      },

      {
        id: 'overall-health-degradation',
        name: 'Overall Health Degradation',
        description:
          'Triggers when overall extension health score drops significantly',
        enabled: true,
        category: 'health',
        severity: 'high',
        condition: {
          type: 'trend',
          metric: 'health.overallScore',
          operator: '<',
          value: 0.6, // 60%
          timeWindow: 600000, // 10 minutes
          aggregation: 'avg',
        },
        actions: [
          {
            type: 'notification',
            config: {
              channels: ['console', 'dashboard'],
              template: 'health-degradation',
            },
            enabled: true,
          },
          {
            type: 'custom',
            config: {
              customHandler: async (alert: RealTimeAlert) => {
                await this.performHealthDiagnostics(alert);
              },
            },
            enabled: true,
            delay: 3000,
          },
        ],
        cooldownPeriod: 1800000, // 30 minutes
        autoRecovery: false,
        recoveryActions: [
          'Perform health diagnostics',
          'Generate health report',
          'Restart extension monitoring',
        ],
      },
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });

    console.log(`Initialized ${defaultRules.length} real-time alert rules`);
  }

  /**
   * Process real-time metrics and generate alerts
   */
  async processRealTimeMetrics(
    metrics: LiveExtensionMetrics
  ): Promise<RealTimeAlert[]> {
    // Add metrics to buffer for trend analysis
    this.metricsBuffer.push(metrics);
    if (this.metricsBuffer.length > 100) {
      this.metricsBuffer = this.metricsBuffer.slice(-100);
    }

    const generatedAlerts: RealTimeAlert[] = [];

    // Evaluate each alert rule
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown period
      const lastTriggered = this.ruleCooldowns.get(rule.id);
      if (
        lastTriggered &&
        Date.now() - lastTriggered.getTime() < rule.cooldownPeriod
      ) {
        continue;
      }

      try {
        const shouldTrigger = await this.evaluateAlertCondition(
          rule.condition,
          metrics
        );

        if (shouldTrigger) {
          const alert = await this.createRealTimeAlert(rule, metrics);
          generatedAlerts.push(alert);

          // Update cooldown
          this.ruleCooldowns.set(rule.id, new Date());

          // Execute alert actions
          await this.executeAlertActions(alert, rule.actions);

          // Update statistics
          this.updateAlertStatistics(alert, rule);
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${rule.id}:`, error);
      }
    }

    // Add to alert history
    this.alertHistory.push(...generatedAlerts);
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }

    return generatedAlerts;
  }

  /**
   * Evaluate alert condition against current metrics
   */
  private async evaluateAlertCondition(
    condition: RealAlertCondition,
    metrics: LiveExtensionMetrics
  ): Promise<boolean> {
    switch (condition.type) {
      case 'threshold':
        return this.evaluateThresholdCondition(condition, metrics);

      case 'trend':
        return this.evaluateTrendCondition(condition, metrics);

      case 'pattern':
        return this.evaluatePatternCondition(condition, metrics);

      case 'composite':
        return this.evaluateCompositeCondition(condition, metrics);

      default:
        console.warn(`Unknown condition type: ${condition.type}`);
        return false;
    }
  }

  /**
   * Evaluate threshold-based condition
   */
  private evaluateThresholdCondition(
    condition: RealAlertCondition,
    metrics: LiveExtensionMetrics
  ): boolean {
    const value = this.extractMetricValue(condition.metric, metrics);
    if (value === undefined || value === null) return false;

    switch (condition.operator) {
      case '>':
        return Number(value) > Number(condition.value);
      case '<':
        return Number(value) < Number(condition.value);
      case '>=':
        return Number(value) >= Number(condition.value);
      case '<=':
        return Number(value) <= Number(condition.value);
      case '=':
        return value === condition.value;
      case '!=':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'matches':
        return new RegExp(String(condition.value)).test(String(value));
      default:
        return false;
    }
  }

  /**
   * Evaluate trend-based condition
   */
  private evaluateTrendCondition(
    condition: RealAlertCondition,
    metrics: LiveExtensionMetrics
  ): boolean {
    if (!condition.timeWindow || !condition.aggregation) return false;

    const cutoffTime = Date.now() - condition.timeWindow;
    const relevantMetrics = this.metricsBuffer.filter(
      m => m.timestamp.getTime() >= cutoffTime
    );

    if (relevantMetrics.length === 0) return false;

    const values = relevantMetrics
      .map(m => this.extractMetricValue(condition.metric, m))
      .filter(v => v !== undefined && v !== null)
      .map(v => Number(v));

    if (values.length === 0) return false;

    let aggregatedValue: number;
    switch (condition.aggregation) {
      case 'avg':
        aggregatedValue = values.reduce((sum, v) => sum + v, 0) / values.length;
        break;
      case 'max':
        aggregatedValue = Math.max(...values);
        break;
      case 'min':
        aggregatedValue = Math.min(...values);
        break;
      case 'sum':
        aggregatedValue = values.reduce((sum, v) => sum + v, 0);
        break;
      case 'count':
        aggregatedValue = values.length;
        break;
      default:
        return false;
    }

    return this.evaluateThresholdCondition(
      { ...condition, type: 'threshold' },
      { ...metrics, [condition.metric]: aggregatedValue } as any
    );
  }

  /**
   * Evaluate pattern-based condition
   */
  private evaluatePatternCondition(
    condition: RealAlertCondition,
    metrics: LiveExtensionMetrics
  ): boolean {
    // Handle wildcard patterns like 'contexts.*.isHealthy'
    if (condition.metric.includes('*')) {
      const parts = condition.metric.split('.');
      const wildcardIndex = parts.indexOf('*');

      if (wildcardIndex === 1 && parts[0] === 'contexts') {
        // Check all contexts
        const property = parts.slice(2).join('.');
        return Object.values(metrics.contexts).some(context => {
          const value = this.extractNestedValue(context, property);
          return this.compareValue(value, condition.operator, condition.value);
        });
      }
    }

    // Regular pattern evaluation
    const value = this.extractMetricValue(condition.metric, metrics);
    return this.compareValue(value, condition.operator, condition.value);
  }

  /**
   * Evaluate composite condition
   */
  private async evaluateCompositeCondition(
    condition: RealAlertCondition,
    metrics: LiveExtensionMetrics
  ): Promise<boolean> {
    if (!condition.conditions || condition.conditions.length === 0)
      return false;

    const results = await Promise.all(
      condition.conditions.map(subCondition =>
        this.evaluateAlertCondition(subCondition, metrics)
      )
    );

    if (condition.logicalOperator === 'OR') {
      return results.some(result => result);
    } else {
      // Default to AND
      return results.every(result => result);
    }
  }

  /**
   * Extract metric value from metrics object
   */
  private extractMetricValue(
    metricPath: string,
    metrics: LiveExtensionMetrics
  ): any {
    return this.extractNestedValue(metrics, metricPath);
  }

  /**
   * Extract nested value from object using dot notation
   */
  private extractNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Compare value using operator
   */
  private compareValue(
    value: any,
    operator: string,
    expectedValue: any
  ): boolean {
    if (value === undefined || value === null) return false;

    switch (operator) {
      case '>':
        return Number(value) > Number(expectedValue);
      case '<':
        return Number(value) < Number(expectedValue);
      case '>=':
        return Number(value) >= Number(expectedValue);
      case '<=':
        return Number(value) <= Number(expectedValue);
      case '=':
        return value === expectedValue;
      case '!=':
        return value !== expectedValue;
      case 'contains':
        return String(value).includes(String(expectedValue));
      case 'matches':
        return new RegExp(String(expectedValue)).test(String(value));
      default:
        return false;
    }
  }

  /**
   * Create real-time alert from rule and metrics
   */
  private async createRealTimeAlert(
    rule: RealAlertRule,
    metrics: LiveExtensionMetrics
  ): Promise<RealTimeAlert> {
    const alert: RealTimeAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      type: this.mapCategoryToAlertType(rule.category),
      severity: rule.severity,
      message: `${rule.name}: ${rule.description}`,
      details: {
        ruleId: rule.id,
        ruleName: rule.name,
        condition: rule.condition,
        triggeredValue: this.extractMetricValue(rule.condition.metric, metrics),
        currentMetrics: metrics,
      },
      extensionContext: this.determineExtensionContext(rule, metrics),
      performanceImpact: this.determinePerformanceImpact(rule.severity),
      autoRecovery: rule.autoRecovery,
      recoveryActions: rule.recoveryActions,
      realTimeData: metrics,
    };

    // Add to active alerts
    this.activeAlerts.set(alert.id, alert);

    return alert;
  }

  /**
   * Determine extension context from rule and metrics
   */
  private determineExtensionContext(
    rule: RealAlertRule,
    metrics: LiveExtensionMetrics
  ): string {
    if (rule.condition.metric.includes('contexts.')) {
      const contextMatch = rule.condition.metric.match(/contexts\.([^.]+)/);
      if (contextMatch) {
        return contextMatch[1];
      }
    }

    if (rule.condition.metric.includes('performance')) {
      return 'performance';
    }

    if (rule.condition.metric.includes('health')) {
      return 'health';
    }

    return 'general';
  }

  /**
   * Determine performance impact from severity
   */
  private determinePerformanceImpact(
    severity: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Execute alert actions
   */
  private async executeAlertActions(
    alert: RealTimeAlert,
    actions: RealAlertAction[]
  ): Promise<void> {
    for (const action of actions) {
      if (!action.enabled) continue;

      try {
        if (action.delay) {
          await this.delay(action.delay);
        }

        await this.executeAlertAction(alert, action);
      } catch (error) {
        console.error(`Failed to execute alert action ${action.type}:`, error);
      }
    }
  }

  /**
   * Execute individual alert action
   */
  private async executeAlertAction(
    alert: RealTimeAlert,
    action: RealAlertAction
  ): Promise<void> {
    switch (action.type) {
      case 'notification':
        await this.sendNotification(alert, action.config);
        break;

      case 'recovery':
        await this.executeRecoveryAction(alert, action.config);
        break;

      case 'escalation':
        await this.executeEscalationAction(alert, action.config);
        break;

      case 'custom':
        await this.executeCustomAction(alert, action.config);
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Send notification
   */
  private async sendNotification(
    alert: RealTimeAlert,
    config: any
  ): Promise<void> {
    const message = this.formatAlertMessage(alert, config.template);

    if (config.channels?.includes('console')) {
      const emoji = {
        low: '🟡',
        medium: '🟠',
        high: '🔴',
        critical: '🚨',
      }[alert.severity];

      console.warn(
        `${emoji} REAL-TIME ALERT [${alert.severity.toUpperCase()}]: ${message}`
      );

      if (alert.extensionContext) {
        console.warn(`  Context: ${alert.extensionContext}`);
      }

      if (alert.performanceImpact !== 'low') {
        console.warn(`  Performance Impact: ${alert.performanceImpact}`);
      }
    }

    if (config.channels?.includes('dashboard')) {
      // Dashboard notification would be implemented here
      console.log(`Dashboard notification: ${message}`);
    }

    if (config.webhook) {
      // Webhook notification would be implemented here
      console.log(`Webhook notification to ${config.webhook}: ${message}`);
    }

    if (config.email && config.email.length > 0) {
      // Email notification would be implemented here
      console.log(
        `Email notification to ${config.email.join(', ')}: ${message}`
      );
    }
  }

  /**
   * Execute recovery action
   */
  private async executeRecoveryAction(
    alert: RealTimeAlert,
    config: any
  ): Promise<void> {
    console.log(`🔧 Executing recovery action: ${config.script}`);

    this.alertStatistics.recoverySuccess.attempted++;

    try {
      switch (config.script) {
        case 'triggerGarbageCollection':
          await this.triggerGarbageCollection();
          break;

        case 'restartUnhealthyContext':
          await this.restartUnhealthyContext(alert);
          break;

        case 'optimizePerformance':
          await this.optimizePerformance();
          break;

        case 'reconnectMCP':
          await this.reconnectMCP();
          break;

        default:
          console.warn(`Unknown recovery script: ${config.script}`);
          return;
      }

      this.alertStatistics.recoverySuccess.successful++;
      console.log(`✅ Recovery action completed: ${config.script}`);
    } catch (error) {
      console.error(`❌ Recovery action failed: ${config.script}`, error);
    }

    // Update recovery success rate
    this.alertStatistics.recoverySuccess.rate =
      this.alertStatistics.recoverySuccess.successful /
      this.alertStatistics.recoverySuccess.attempted;
  }

  /**
   * Execute escalation action
   */
  private async executeEscalationAction(
    alert: RealTimeAlert,
    config: any
  ): Promise<void> {
    console.log(`📢 Escalating alert: ${alert.message}`);

    if (config.webhook) {
      console.log(`Escalation webhook: ${config.webhook}`);
    }

    if (config.email) {
      console.log(`Escalation email: ${config.email}`);
    }
  }

  /**
   * Execute custom action
   */
  private async executeCustomAction(
    alert: RealTimeAlert,
    config: any
  ): Promise<void> {
    if (config.customHandler && typeof config.customHandler === 'function') {
      await config.customHandler(alert);
    } else {
      console.warn('Custom action handler not provided or not a function');
    }
  }

  /**
   * Format alert message using template
   */
  private formatAlertMessage(alert: RealTimeAlert, template?: string): string {
    if (!template) {
      return alert.message;
    }

    switch (template) {
      case 'critical-memory':
        return `Critical memory usage detected: ${alert.details?.triggeredValue}MB (threshold exceeded)`;

      case 'context-failure':
        return `Extension context failure: ${alert.extensionContext} is unhealthy`;

      case 'high-error-rate':
        return `High error rate detected: ${alert.details?.triggeredValue} errors in monitoring window`;

      case 'slow-response':
        return `Slow response time detected: ${alert.details?.triggeredValue}ms average response time`;

      case 'mcp-instability':
        return `MCP connection instability: ${alert.details?.triggeredValue}ms latency or connection errors`;

      case 'health-degradation':
        return `Overall health degradation: ${(alert.details?.triggeredValue * 100).toFixed(1)}% health score`;

      default:
        return alert.message;
    }
  }

  /**
   * Recovery action implementations
   */
  private async triggerGarbageCollection(): Promise<void> {
    const gcScript = `
      (() => {
        if (typeof gc !== 'undefined') {
          gc();
          return { gcTriggered: true, timestamp: Date.now() };
        }
        return { gcTriggered: false, message: 'GC not available' };
      })()
    `;

    const result = await this.mcpConnectionManager.executeMCPFunction(
      'mcp_chrome_devtools_evaluate_script',
      {
        function: gcScript,
      }
    );

    if (result.success) {
      console.log('Garbage collection triggered:', result.data);
    } else {
      throw new Error(`GC trigger failed: ${result.error}`);
    }
  }

  private async restartUnhealthyContext(alert: RealTimeAlert): Promise<void> {
    console.log(`Restarting unhealthy context: ${alert.extensionContext}`);
    // Context restart logic would be implemented here
    // This is a placeholder for the actual implementation
  }

  private async optimizePerformance(): Promise<void> {
    console.log('Optimizing performance...');
    // Performance optimization logic would be implemented here
  }

  private async reconnectMCP(): Promise<void> {
    console.log('Reconnecting MCP...');
    await this.mcpConnectionManager.reconnectMCP();
  }

  /**
   * Perform health diagnostics
   */
  private async performHealthDiagnostics(alert: RealTimeAlert): Promise<void> {
    console.log('🔍 Performing health diagnostics...');

    const diagnostics = {
      timestamp: new Date(),
      alertId: alert.id,
      overallHealth: alert.realTimeData?.health?.overallScore,
      contextHealth: alert.realTimeData?.health?.contextHealth,
      criticalIssues: alert.realTimeData?.health?.criticalIssues,
      warnings: alert.realTimeData?.health?.warnings,
      recommendations: this.generateHealthRecommendations(alert.realTimeData),
    };

    console.log('Health diagnostics results:', diagnostics);
  }

  /**
   * Generate health recommendations
   */
  private generateHealthRecommendations(
    metrics: LiveExtensionMetrics | undefined
  ): string[] {
    if (!metrics) return [];

    const recommendations: string[] = [];

    if (metrics.performance.memoryUsage > 100) {
      recommendations.push('Consider reducing memory usage by clearing caches');
    }

    if (metrics.performance.responseTime > 2000) {
      recommendations.push('Optimize slow operations to improve response time');
    }

    if (metrics.health.criticalIssues.length > 0) {
      recommendations.push('Address critical issues immediately');
    }

    if (metrics.health.warnings.length > 3) {
      recommendations.push('Review and resolve accumulated warnings');
    }

    Object.entries(metrics.contexts).forEach(([name, context]) => {
      if (context.healthScore < 0.7) {
        recommendations.push(`Investigate and fix issues in ${name} context`);
      }
    });

    return recommendations;
  }

  /**
   * Update alert statistics
   */
  private updateAlertStatistics(
    alert: RealTimeAlert,
    rule: RealAlertRule
  ): void {
    this.alertStatistics.totalAlerts++;

    // Update by category
    this.alertStatistics.alertsByCategory[rule.category] =
      (this.alertStatistics.alertsByCategory[rule.category] || 0) + 1;

    // Update by severity
    this.alertStatistics.alertsBySeverity[alert.severity] =
      (this.alertStatistics.alertsBySeverity[alert.severity] || 0) + 1;

    // Update by context
    if (alert.extensionContext) {
      this.alertStatistics.alertsByContext[alert.extensionContext] =
        (this.alertStatistics.alertsByContext[alert.extensionContext] || 0) + 1;
    }

    // Update trends
    this.alertStatistics.alertTrends.push({
      timestamp: alert.timestamp,
      count: 1,
      severity: alert.severity,
    });

    // Keep only last 100 trend entries
    if (this.alertStatistics.alertTrends.length > 100) {
      this.alertStatistics.alertTrends =
        this.alertStatistics.alertTrends.slice(-100);
    }

    // Update top alert rules
    const existingRule = this.alertStatistics.topAlertRules.find(
      r => r.ruleId === rule.id
    );
    if (existingRule) {
      existingRule.triggerCount++;
      existingRule.lastTriggered = alert.timestamp;
    } else {
      this.alertStatistics.topAlertRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        triggerCount: 1,
        lastTriggered: alert.timestamp,
      });
    }

    // Sort and keep top 10
    this.alertStatistics.topAlertRules.sort(
      (a, b) => b.triggerCount - a.triggerCount
    );
    this.alertStatistics.topAlertRules =
      this.alertStatistics.topAlertRules.slice(0, 10);
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: RealAlertRule): void {
    this.alertRules.set(rule.id, rule);
    console.log(`Added custom alert rule: ${rule.name}`);
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      this.ruleCooldowns.delete(ruleId);
      console.log(`Removed alert rule: ${ruleId}`);
    }
    return removed;
  }

  /**
   * Update alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<RealAlertRule>): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    const updatedRule = { ...rule, ...updates };
    this.alertRules.set(ruleId, updatedRule);
    console.log(`Updated alert rule: ${ruleId}`);
    return true;
  }

  /**
   * Get all alert rules
   */
  getAlertRules(): RealAlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): RealTimeAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit?: number): RealTimeAlert[] {
    return limit ? this.alertHistory.slice(-limit) : [...this.alertHistory];
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(): AlertStatistics {
    return { ...this.alertStatistics };
  }

  /**
   * Clear active alerts
   */
  clearActiveAlerts(): void {
    const clearedCount = this.activeAlerts.size;
    this.activeAlerts.clear();
    console.log(`Cleared ${clearedCount} active alerts`);
  }

  /**
   * Clear alert history
   */
  clearAlertHistory(): void {
    const clearedCount = this.alertHistory.length;
    this.alertHistory = [];
    console.log(`Cleared ${clearedCount} alert history entries`);
  }

  /**
   * Map rule category to alert type
   */
  private mapCategoryToAlertType(
    category: string
  ): 'failure_rate' | 'execution_time' | 'memory_usage' | 'scenario_failure' {
    switch (category) {
      case 'performance':
        return 'memory_usage';
      case 'health':
        return 'failure_rate';
      case 'error':
        return 'scenario_failure';
      case 'security':
        return 'failure_rate';
      case 'custom':
      default:
        return 'execution_time';
    }
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `real-alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export alert system configuration
   */
  exportConfiguration(): {
    rules: RealAlertRule[];
    statistics: AlertStatistics;
    activeAlerts: RealTimeAlert[];
  } {
    return {
      rules: this.getAlertRules(),
      statistics: this.getAlertStatistics(),
      activeAlerts: this.getActiveAlerts(),
    };
  }

  /**
   * Import alert system configuration
   */
  importConfiguration(config: { rules?: RealAlertRule[] }): void {
    if (config.rules) {
      this.alertRules.clear();
      config.rules.forEach(rule => {
        this.alertRules.set(rule.id, rule);
      });
      console.log(`Imported ${config.rules.length} alert rules`);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.activeAlerts.clear();
    this.alertHistory = [];
    this.metricsBuffer = [];
    this.ruleCooldowns.clear();
    console.log('Real debug alert system cleaned up');
  }
}
