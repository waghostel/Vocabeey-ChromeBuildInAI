/**
 * Debug Alert System
 * Manages debugging alerts and notifications
 */

import { MonitoringAlert, DebugEvent } from '../types/debug-types';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (data: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownPeriod: number; // milliseconds
  enabled: boolean;
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'console' | 'email' | 'webhook' | 'report' | 'custom';
  config: Record<string, any>;
  enabled: boolean;
}

export interface AlertChannel {
  id: string;
  name: string;
  type: 'console' | 'email' | 'webhook' | 'file';
  config: Record<string, any>;
  enabled: boolean;
}

export class DebugAlertSystem {
  private alerts: MonitoringAlert[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private alertChannels: Map<string, AlertChannel> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();
  private eventListeners: Map<string, Array<(alert: MonitoringAlert) => void>> =
    new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'critical-failure-rate',
        name: 'Critical Failure Rate',
        description: 'Triggers when failure rate exceeds 50%',
        condition: data => data.failureRate > 0.5,
        severity: 'critical',
        cooldownPeriod: 300000, // 5 minutes
        enabled: true,
        actions: [
          { type: 'console', config: {}, enabled: true },
          { type: 'report', config: { immediate: true }, enabled: true },
        ],
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        description: 'Triggers when memory usage exceeds 300MB',
        condition: data => data.memoryUsage > 300,
        severity: 'high',
        cooldownPeriod: 600000, // 10 minutes
        enabled: true,
        actions: [{ type: 'console', config: {}, enabled: true }],
      },
      {
        id: 'slow-execution',
        name: 'Slow Execution',
        description: 'Triggers when execution time exceeds 60 seconds',
        condition: data => data.executionTime > 60000,
        severity: 'medium',
        cooldownPeriod: 900000, // 15 minutes
        enabled: true,
        actions: [{ type: 'console', config: {}, enabled: true }],
      },
      {
        id: 'extension-context-failure',
        name: 'Extension Context Failure',
        description: 'Triggers when extension contexts fail to load',
        condition: data =>
          data.error && data.error.toLowerCase().includes('extension'),
        severity: 'high',
        cooldownPeriod: 180000, // 3 minutes
        enabled: true,
        actions: [
          { type: 'console', config: {}, enabled: true },
          { type: 'report', config: { immediate: true }, enabled: true },
        ],
      },
      {
        id: 'mcp-connection-failure',
        name: 'MCP Connection Failure',
        description: 'Triggers when MCP connection fails',
        condition: data =>
          data.error && data.error.toLowerCase().includes('mcp'),
        severity: 'critical',
        cooldownPeriod: 120000, // 2 minutes
        enabled: true,
        actions: [{ type: 'console', config: {}, enabled: true }],
      },
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });

    console.log(`Initialized ${defaultRules.length} default alert rules`);
  }

  /**
   * Initialize default alert channels
   */
  private initializeDefaultChannels(): void {
    const defaultChannels: AlertChannel[] = [
      {
        id: 'console',
        name: 'Console Output',
        type: 'console',
        config: { colorize: true },
        enabled: true,
      },
      {
        id: 'debug-log',
        name: 'Debug Log File',
        type: 'file',
        config: {
          filePath: 'debug/logs/alerts.log',
          maxSize: 10 * 1024 * 1024, // 10MB
        },
        enabled: true,
      },
    ];

    defaultChannels.forEach(channel => {
      this.alertChannels.set(channel.id, channel);
    });

    console.log(`Initialized ${defaultChannels.length} default alert channels`);
  }

  /**
   * Process data and generate alerts based on rules
   */
  processData(data: any): MonitoringAlert[] {
    const generatedAlerts: MonitoringAlert[] = [];
    const timestamp = new Date();

    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown period
      const lastAlert = this.alertCooldowns.get(rule.id);
      if (
        lastAlert &&
        timestamp.getTime() - lastAlert.getTime() < rule.cooldownPeriod
      ) {
        continue;
      }

      try {
        if (rule.condition(data)) {
          const alert: MonitoringAlert = {
            id: this.generateAlertId(),
            timestamp,
            type: 'custom_rule',
            severity: rule.severity,
            message: `${rule.name}: ${rule.description}`,
            details: {
              ruleId: rule.id,
              ruleName: rule.name,
              triggeredData: data,
            },
          };

          generatedAlerts.push(alert);
          this.alerts.push(alert);
          this.alertCooldowns.set(rule.id, timestamp);

          // Execute alert actions
          this.executeAlertActions(alert, rule.actions);

          // Emit alert event
          this.emitAlertEvent(alert);
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${rule.id}:`, error);
      }
    }

    return generatedAlerts;
  }

  /**
   * Add a custom alert manually
   */
  addAlert(alert: Omit<MonitoringAlert, 'id' | 'timestamp'>): MonitoringAlert {
    const fullAlert: MonitoringAlert = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: new Date(),
    };

    this.alerts.push(fullAlert);
    this.emitAlertEvent(fullAlert);

    // Send to all enabled channels
    this.sendToAllChannels(fullAlert);

    return fullAlert;
  }

  /**
   * Execute alert actions
   */
  private executeAlertActions(
    alert: MonitoringAlert,
    actions: AlertAction[]
  ): void {
    actions.forEach(action => {
      if (!action.enabled) return;

      try {
        switch (action.type) {
          case 'console':
            this.executeConsoleAction(alert, action.config);
            break;
          case 'email':
            this.executeEmailAction(alert, action.config);
            break;
          case 'webhook':
            this.executeWebhookAction(alert, action.config);
            break;
          case 'report':
            this.executeReportAction(alert, action.config);
            break;
          case 'custom':
            this.executeCustomAction(alert, action.config);
            break;
        }
      } catch (error) {
        console.error(`Error executing alert action ${action.type}:`, error);
      }
    });
  }

  /**
   * Execute console action
   */
  private executeConsoleAction(alert: MonitoringAlert, config: any): void {
    const emoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨',
    }[alert.severity];

    const message = `${emoji} [${alert.severity.toUpperCase()}] ${alert.message}`;

    if (config.colorize) {
      const colors = {
        low: '\x1b[33m', // Yellow
        medium: '\x1b[35m', // Magenta
        high: '\x1b[31m', // Red
        critical: '\x1b[41m\x1b[37m', // Red background, white text
      };
      const reset = '\x1b[0m';
      console.log(`${colors[alert.severity]}${message}${reset}`);
    } else {
      console.log(message);
    }

    if (alert.details) {
      console.log('Alert details:', alert.details);
    }
  }

  /**
   * Execute email action (placeholder implementation)
   */
  private executeEmailAction(alert: MonitoringAlert, config: any): void {
    console.log(
      `[EMAIL] Would send alert to: ${config.recipients?.join(', ') || 'default recipients'}`
    );
    console.log(`Subject: ${alert.message}`);
  }

  /**
   * Execute webhook action (placeholder implementation)
   */
  private executeWebhookAction(alert: MonitoringAlert, config: any): void {
    console.log(`[WEBHOOK] Would send alert to: ${config.url}`);
    console.log(`Payload:`, JSON.stringify(alert, null, 2));
  }

  /**
   * Execute report action
   */
  private executeReportAction(alert: MonitoringAlert, config: any): void {
    if (config.immediate) {
      console.log(
        `[REPORT] Triggering immediate report generation for alert: ${alert.id}`
      );
      // This would trigger report generation in a real implementation
    } else {
      console.log(
        `[REPORT] Scheduling report generation for alert: ${alert.id}`
      );
    }
  }

  /**
   * Execute custom action
   */
  private executeCustomAction(alert: MonitoringAlert, config: any): void {
    console.log(`[CUSTOM] Executing custom action for alert: ${alert.id}`);
    if (config.handler && typeof config.handler === 'function') {
      config.handler(alert);
    }
  }

  /**
   * Send alert to all enabled channels
   */
  private sendToAllChannels(alert: MonitoringAlert): void {
    for (const channel of this.alertChannels.values()) {
      if (!channel.enabled) continue;

      try {
        this.sendToChannel(alert, channel);
      } catch (error) {
        console.error(`Error sending alert to channel ${channel.id}:`, error);
      }
    }
  }

  /**
   * Send alert to specific channel
   */
  private sendToChannel(alert: MonitoringAlert, channel: AlertChannel): void {
    switch (channel.type) {
      case 'console':
        this.executeConsoleAction(alert, channel.config);
        break;
      case 'file':
        this.writeToFile(alert, channel.config);
        break;
      case 'email':
        this.executeEmailAction(alert, channel.config);
        break;
      case 'webhook':
        this.executeWebhookAction(alert, channel.config);
        break;
    }
  }

  /**
   * Write alert to file
   */
  private writeToFile(alert: MonitoringAlert, config: any): void {
    const logEntry = {
      timestamp: alert.timestamp.toISOString(),
      severity: alert.severity,
      type: alert.type,
      message: alert.message,
      details: alert.details,
    };

    console.log(`[FILE] Would write alert to: ${config.filePath}`);
    console.log('Log entry:', JSON.stringify(logEntry, null, 2));
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    console.log(`Added custom alert rule: ${rule.name}`);
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      this.alertCooldowns.delete(ruleId);
      console.log(`Removed alert rule: ${ruleId}`);
    }
    return removed;
  }

  /**
   * Update alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    const updatedRule = { ...rule, ...updates };
    this.alertRules.set(ruleId, updatedRule);
    console.log(`Updated alert rule: ${ruleId}`);
    return true;
  }

  /**
   * Add alert channel
   */
  addAlertChannel(channel: AlertChannel): void {
    this.alertChannels.set(channel.id, channel);
    console.log(`Added alert channel: ${channel.name}`);
  }

  /**
   * Remove alert channel
   */
  removeAlertChannel(channelId: string): boolean {
    const removed = this.alertChannels.delete(channelId);
    if (removed) {
      console.log(`Removed alert channel: ${channelId}`);
    }
    return removed;
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
   * Get alerts by type
   */
  getAlertsByType(type: string): MonitoringAlert[] {
    return this.alerts.filter(alert => alert.type === type);
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 10): MonitoringAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    const clearedCount = this.alerts.length;
    this.alerts = [];
    console.log(`Cleared ${clearedCount} alerts`);
  }

  /**
   * Clear alerts older than specified time
   */
  clearOldAlerts(olderThanMs: number): void {
    const cutoffTime = new Date(Date.now() - olderThanMs);
    const initialCount = this.alerts.length;
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);
    const clearedCount = initialCount - this.alerts.length;
    console.log(`Cleared ${clearedCount} alerts older than ${olderThanMs}ms`);
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(): {
    totalAlerts: number;
    alertsBySeverity: Record<string, number>;
    alertsByType: Record<string, number>;
    alertsInLastHour: number;
    alertsInLastDay: number;
    mostActiveRules: Array<{ ruleId: string; count: number }>;
  } {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const alertsBySeverity: Record<string, number> = {};
    const alertsByType: Record<string, number> = {};
    const ruleActivity: Record<string, number> = {};

    let alertsInLastHour = 0;
    let alertsInLastDay = 0;

    this.alerts.forEach(alert => {
      // Count by severity
      alertsBySeverity[alert.severity] =
        (alertsBySeverity[alert.severity] || 0) + 1;

      // Count by type
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;

      // Count by time
      const alertAge = now - alert.timestamp.getTime();
      if (alertAge <= oneHour) alertsInLastHour++;
      if (alertAge <= oneDay) alertsInLastDay++;

      // Count rule activity
      if (alert.details?.ruleId) {
        const ruleId = alert.details.ruleId;
        ruleActivity[ruleId] = (ruleActivity[ruleId] || 0) + 1;
      }
    });

    const mostActiveRules = Object.entries(ruleActivity)
      .map(([ruleId, count]) => ({ ruleId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalAlerts: this.alerts.length,
      alertsBySeverity,
      alertsByType,
      alertsInLastHour,
      alertsInLastDay,
      mostActiveRules,
    };
  }

  /**
   * Add event listener for alerts
   */
  addEventListener(
    eventType: string,
    listener: (alert: MonitoringAlert) => void
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
    listener: (alert: MonitoringAlert) => void
  ): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(eventType, listeners);
    }
  }

  /**
   * Emit alert event
   */
  private emitAlertEvent(alert: MonitoringAlert): void {
    const listeners = this.eventListeners.get('alert') || [];
    listeners.forEach(listener => {
      try {
        listener(alert);
      } catch (error) {
        console.error('Error in alert event listener:', error);
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
   * Export alert system configuration
   */
  exportConfiguration(): {
    rules: AlertRule[];
    channels: AlertChannel[];
    statistics: any;
  } {
    return {
      rules: Array.from(this.alertRules.values()),
      channels: Array.from(this.alertChannels.values()),
      statistics: this.getAlertStatistics(),
    };
  }

  /**
   * Import alert system configuration
   */
  importConfiguration(config: {
    rules?: AlertRule[];
    channels?: AlertChannel[];
  }): void {
    if (config.rules) {
      this.alertRules.clear();
      config.rules.forEach(rule => {
        this.alertRules.set(rule.id, rule);
      });
      console.log(`Imported ${config.rules.length} alert rules`);
    }

    if (config.channels) {
      this.alertChannels.clear();
      config.channels.forEach(channel => {
        this.alertChannels.set(channel.id, channel);
      });
      console.log(`Imported ${config.channels.length} alert channels`);
    }
  }
}
