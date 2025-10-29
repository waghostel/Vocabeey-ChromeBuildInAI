/**
 * Continuous Debug Monitor
 * Implements automated debugging checks and monitoring
 */

import {
  MonitoringConfig,
  MonitoringAlert,
  TestResult,
  DebugReport,
  DebugEvent,
  ScenarioEvent,
  ValidationEvent,
} from '../types/debug-types';
import { AutomatedTestScenarios } from '../scenarios/automated-test-scenarios';
import { AutomatedReportGeneration } from '../reports/automated-report-generation';

export class ContinuousDebugMonitor {
  private config: MonitoringConfig;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private alerts: MonitoringAlert[] = [];
  private eventListeners: Map<string, Array<(event: DebugEvent) => void>> =
    new Map();
  private testScenarios: AutomatedTestScenarios;
  private reportGeneration: AutomatedReportGeneration;
  private monitoringHistory: Array<{
    timestamp: Date;
    results: TestResult[];
    alerts: MonitoringAlert[];
  }> = [];

  constructor(
    testScenarios: AutomatedTestScenarios,
    reportGeneration: AutomatedReportGeneration,
    config?: Partial<MonitoringConfig>
  ) {
    this.testScenarios = testScenarios;
    this.reportGeneration = reportGeneration;
    this.config = this.createDefaultConfig(config);
  }

  /**
   * Create default monitoring configuration
   */
  private createDefaultConfig(
    overrides?: Partial<MonitoringConfig>
  ): MonitoringConfig {
    const defaultConfig: MonitoringConfig = {
      enabled: true,
      interval: 300000, // 5 minutes
      scenarios: ['Extension Loading Test'], // Default to critical scenarios
      alertThresholds: {
        failureRate: 0.3, // 30% failure rate
        executionTime: 30000, // 30 seconds
        memoryUsage: 200, // 200MB
      },
      notifications: {
        console: true,
      },
    };

    return { ...defaultConfig, ...overrides };
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('Continuous monitoring is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('Continuous monitoring is disabled in configuration');
      return;
    }

    console.log(
      `Starting continuous debugging monitoring (interval: ${this.config.interval}ms)`
    );

    // Initialize test scenarios
    await this.testScenarios.initialize();

    this.isMonitoring = true;

    // Run initial check
    await this.performMonitoringCheck();

    // Schedule periodic checks
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performMonitoringCheck();
      } catch (error) {
        console.error('Error during monitoring check:', error);
        this.emitEvent({
          type: 'monitoring_error',
          timestamp: new Date(),
          data: {
            error: error instanceof Error ? error.message : String(error),
          },
          source: 'continuous-monitor',
        });
      }
    }, this.config.interval);

    this.emitEvent({
      type: 'monitoring_started',
      timestamp: new Date(),
      data: { config: this.config },
      source: 'continuous-monitor',
    });
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.warn('Continuous monitoring is not running');
      return;
    }

    console.log('Stopping continuous debugging monitoring');

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.emitEvent({
      type: 'monitoring_stopped',
      timestamp: new Date(),
      data: { totalAlerts: this.alerts.length },
      source: 'continuous-monitor',
    });
  }

  /**
   * Perform a single monitoring check
   */
  private async performMonitoringCheck(): Promise<void> {
    console.log('Performing monitoring check...');
    const checkStartTime = Date.now();

    try {
      // Execute configured scenarios
      const results = await this.testScenarios.executeCustom({
        scenarios: this.config.scenarios,
        timeout: this.config.alertThresholds.executionTime,
        stopOnFailure: false,
      });

      // Analyze results and generate alerts
      const newAlerts = this.analyzeResults(results);

      // Store monitoring history
      this.monitoringHistory.push({
        timestamp: new Date(),
        results,
        alerts: newAlerts,
      });

      // Keep only last 100 monitoring checks
      if (this.monitoringHistory.length > 100) {
        this.monitoringHistory = this.monitoringHistory.slice(-100);
      }

      // Process alerts
      if (newAlerts.length > 0) {
        this.alerts.push(...newAlerts);
        await this.processAlerts(newAlerts);
      }

      // Generate report if there are significant issues
      if (
        newAlerts.some(
          alert => alert.severity === 'critical' || alert.severity === 'high'
        )
      ) {
        await this.generateMonitoringReport(results, newAlerts);
      }

      const checkDuration = Date.now() - checkStartTime;
      console.log(
        `Monitoring check completed in ${checkDuration}ms (${newAlerts.length} alerts)`
      );

      this.emitEvent({
        type: 'monitoring_check_completed',
        timestamp: new Date(),
        data: {
          duration: checkDuration,
          scenariosExecuted: results.length,
          alertsGenerated: newAlerts.length,
          passedScenarios: results.filter(r => r.passed).length,
        },
        source: 'continuous-monitor',
      });
    } catch (error) {
      console.error('Monitoring check failed:', error);

      const criticalAlert: MonitoringAlert = {
        id: this.generateAlertId(),
        timestamp: new Date(),
        type: 'scenario_failure',
        severity: 'critical',
        message: 'Monitoring check failed completely',
        details: {
          error: error instanceof Error ? error.message : String(error),
          checkDuration: Date.now() - checkStartTime,
        },
      };

      this.alerts.push(criticalAlert);
      await this.processAlerts([criticalAlert]);
    }
  }

  /**
   * Analyze test results and generate alerts
   */
  private analyzeResults(results: TestResult[]): MonitoringAlert[] {
    const alerts: MonitoringAlert[] = [];
    const timestamp = new Date();

    // Check failure rate
    const failedTests = results.filter(r => !r.passed);
    const failureRate =
      results.length > 0 ? failedTests.length / results.length : 0;

    if (failureRate > this.config.alertThresholds.failureRate) {
      alerts.push({
        id: this.generateAlertId(),
        timestamp,
        type: 'failure_rate',
        severity:
          failureRate > 0.7
            ? 'critical'
            : failureRate > 0.5
              ? 'high'
              : 'medium',
        message: `High failure rate detected: ${Math.round(failureRate * 100)}%`,
        details: {
          failureRate,
          failedScenarios: failedTests.map(r => r.scenarioName),
          totalScenarios: results.length,
        },
      });
    }

    // Check execution times
    const slowTests = results.filter(
      r => r.executionTime > this.config.alertThresholds.executionTime
    );
    if (slowTests.length > 0) {
      const avgSlowTime =
        slowTests.reduce((sum, r) => sum + r.executionTime, 0) /
        slowTests.length;

      alerts.push({
        id: this.generateAlertId(),
        timestamp,
        type: 'execution_time',
        severity:
          avgSlowTime > this.config.alertThresholds.executionTime * 2
            ? 'high'
            : 'medium',
        message: `Slow execution detected: ${slowTests.length} scenarios exceeded ${this.config.alertThresholds.executionTime}ms`,
        details: {
          slowScenarios: slowTests.map(r => ({
            name: r.scenarioName,
            time: r.executionTime,
          })),
          averageSlowTime: avgSlowTime,
          threshold: this.config.alertThresholds.executionTime,
        },
      });
    }

    // Check memory usage
    const highMemoryTests = results.filter(
      r =>
        (r.metrics?.memoryUsage || 0) > this.config.alertThresholds.memoryUsage
    );

    if (highMemoryTests.length > 0) {
      const maxMemory = Math.max(
        ...highMemoryTests.map(r => r.metrics?.memoryUsage || 0)
      );

      alerts.push({
        id: this.generateAlertId(),
        timestamp,
        type: 'memory_usage',
        severity:
          maxMemory > this.config.alertThresholds.memoryUsage * 2
            ? 'critical'
            : 'high',
        message: `High memory usage detected: peak ${Math.round(maxMemory)}MB`,
        details: {
          highMemoryScenarios: highMemoryTests.map(r => ({
            name: r.scenarioName,
            memory: r.metrics?.memoryUsage || 0,
          })),
          peakMemory: maxMemory,
          threshold: this.config.alertThresholds.memoryUsage,
        },
      });
    }

    // Check for specific scenario failures
    failedTests.forEach(result => {
      alerts.push({
        id: this.generateAlertId(),
        timestamp,
        type: 'scenario_failure',
        severity: this.config.scenarios.includes(result.scenarioName)
          ? 'high'
          : 'medium',
        message: `Scenario failed: ${result.scenarioName}`,
        details: {
          scenarioName: result.scenarioName,
          error: result.error,
          executionTime: result.executionTime,
          metrics: result.metrics,
        },
        scenarioName: result.scenarioName,
      });
    });

    return alerts;
  }

  /**
   * Process and handle alerts
   */
  private async processAlerts(alerts: MonitoringAlert[]): Promise<void> {
    for (const alert of alerts) {
      // Emit alert event
      this.emitEvent({
        type: 'alert_generated',
        timestamp: alert.timestamp,
        data: alert,
        source: 'continuous-monitor',
      });

      // Send notifications
      await this.sendNotifications(alert);

      console.log(`[${alert.severity.toUpperCase()}] ${alert.message}`);
      if (alert.details) {
        console.log('Alert details:', alert.details);
      }
    }
  }

  /**
   * Send notifications for alerts
   */
  private async sendNotifications(alert: MonitoringAlert): Promise<void> {
    // Console notification
    if (this.config.notifications.console) {
      const emoji = {
        low: '🟡',
        medium: '🟠',
        high: '🔴',
        critical: '🚨',
      }[alert.severity];

      console.warn(
        `${emoji} ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`
      );
    }

    // Email notifications (would be implemented based on environment)
    if (
      this.config.notifications.email &&
      this.config.notifications.email.length > 0
    ) {
      console.log(
        `Would send email alert to: ${this.config.notifications.email.join(', ')}`
      );
    }

    // Webhook notifications (would be implemented based on environment)
    if (this.config.notifications.webhook) {
      console.log(
        `Would send webhook alert to: ${this.config.notifications.webhook}`
      );
    }
  }

  /**
   * Generate monitoring report for significant issues
   */
  private async generateMonitoringReport(
    results: TestResult[],
    alerts: MonitoringAlert[]
  ): Promise<void> {
    try {
      const validationSummary =
        this.testScenarios.generateValidationSummary(results);
      const sessionId = `monitoring-${Date.now()}`;

      const report = await this.reportGeneration.generateReport(
        sessionId,
        results,
        validationSummary,
        {
          includeRecommendations: true,
          formats: ['json', 'markdown'],
          autoSave: true,
          minSeverityLevel: 'medium',
        }
      );

      console.log(`Generated monitoring report: ${report.reportId}`);

      this.emitEvent({
        type: 'monitoring_report_generated',
        timestamp: new Date(),
        data: {
          reportId: report.reportId,
          alertCount: alerts.length,
          recommendationCount: report.recommendations.length,
        },
        source: 'continuous-monitor',
      });
    } catch (error) {
      console.error('Failed to generate monitoring report:', error);
    }
  }

  /**
   * Update monitoring configuration
   */
  updateConfiguration(newConfig: Partial<MonitoringConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    console.log('Updated monitoring configuration');

    this.emitEvent({
      type: 'configuration_updated',
      timestamp: new Date(),
      data: { oldConfig, newConfig: this.config },
      source: 'continuous-monitor',
    });

    // Restart monitoring if interval changed and monitoring is active
    if (this.isMonitoring && oldConfig.interval !== this.config.interval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    config: MonitoringConfig;
    totalAlerts: number;
    recentAlerts: MonitoringAlert[];
    lastCheckTime?: Date;
    nextCheckTime?: Date;
  } {
    const recentAlerts = this.alerts.slice(-10); // Last 10 alerts
    const lastCheck = this.monitoringHistory[this.monitoringHistory.length - 1];

    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      totalAlerts: this.alerts.length,
      recentAlerts,
      lastCheckTime: lastCheck?.timestamp,
      nextCheckTime: this.isMonitoring
        ? new Date(Date.now() + this.config.interval)
        : undefined,
    };
  }

  /**
   * Get monitoring history
   */
  getMonitoringHistory(limit?: number): Array<{
    timestamp: Date;
    results: TestResult[];
    alerts: MonitoringAlert[];
  }> {
    const history = [...this.monitoringHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): MonitoringAlert[] {
    return [...this.alerts];
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): MonitoringAlert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    const clearedCount = this.alerts.length;
    this.alerts = [];

    console.log(`Cleared ${clearedCount} alerts`);

    this.emitEvent({
      type: 'alerts_cleared',
      timestamp: new Date(),
      data: { clearedCount },
      source: 'continuous-monitor',
    });
  }

  /**
   * Add event listener
   */
  addEventListener(
    eventType: string,
    listener: (event: DebugEvent) => void
  ): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(listener);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * Remove event listener
   */
  removeEventListener(
    eventType: string,
    listener: (event: DebugEvent) => void
  ): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(eventType, listeners);
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: DebugEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    });
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStatistics(): {
    totalChecks: number;
    totalAlerts: number;
    alertsByType: Record<string, number>;
    alertsBySeverity: Record<string, number>;
    averageCheckDuration: number;
    uptime: number;
  } {
    const totalChecks = this.monitoringHistory.length;
    const totalAlerts = this.alerts.length;

    const alertsByType: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};

    this.alerts.forEach(alert => {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      alertsBySeverity[alert.severity] =
        (alertsBySeverity[alert.severity] || 0) + 1;
    });

    // Calculate average check duration from events
    const checkEvents = this.monitoringHistory.map(h => h.timestamp);
    const averageCheckDuration =
      checkEvents.length > 1
        ? (checkEvents[checkEvents.length - 1].getTime() -
            checkEvents[0].getTime()) /
          checkEvents.length
        : 0;

    const uptime = this.isMonitoring
      ? Date.now() - (checkEvents[0]?.getTime() || Date.now())
      : 0;

    return {
      totalChecks,
      totalAlerts,
      alertsByType,
      alertsBySeverity,
      averageCheckDuration,
      uptime,
    };
  }

  /**
   * Export monitoring data
   */
  exportMonitoringData(): {
    config: MonitoringConfig;
    alerts: MonitoringAlert[];
    history: any[];
    statistics: any;
  } {
    return {
      config: this.config,
      alerts: this.alerts,
      history: this.monitoringHistory,
      statistics: this.getMonitoringStatistics(),
    };
  }
}
