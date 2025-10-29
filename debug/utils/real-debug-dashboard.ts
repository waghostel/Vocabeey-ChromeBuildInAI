/**
 * Real Debug Dashboard
 * Live debugging dashboard with real-time extension metrics and interactive controls
 */

import {
  LiveExtensionMetrics,
  RealTimeAlert,
} from '../monitoring/real-continuous-debug-monitor';
import { RealDebugAlertSystem } from '../monitoring/real-debug-alert-system';
import { MCPConnectionManager } from './mcp-connection-manager';
import { DebugSessionState } from '../types/debug-types';

export interface RealDashboardConfig {
  refreshInterval: number;
  maxDataPoints: number;
  showRealTime: boolean;
  enableCharts: boolean;
  theme: 'light' | 'dark' | 'auto';
  layout: 'grid' | 'tabs' | 'sidebar';
  autoSave: boolean;
  notifications: boolean;
}

export interface LiveDashboardData {
  timestamp: Date;
  sessionInfo: {
    sessionId: string;
    status: string;
    uptime: number;
    isMonitoring: boolean;
  };
  extensionMetrics: LiveExtensionMetrics;
  alertSummary: {
    activeAlerts: number;
    criticalAlerts: number;
    recentAlerts: RealTimeAlert[];
    alertTrends: Array<{ timestamp: Date; count: number; severity: string }>;
  };
  performanceCharts: RealPerformanceChart[];
  healthIndicators: HealthIndicator[];
  contextStatus: ContextStatusData[];
  mcpStatus: MCPStatusData;
  quickActions: QuickAction[];
  recommendations: DashboardRecommendation[];
}

export interface RealPerformanceChart {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'gauge' | 'pie' | 'area';
  data: ChartDataPoint[];
  config: {
    unit: string;
    threshold?: number;
    warningThreshold?: number;
    criticalThreshold?: number;
    timeRange: number; // milliseconds
    refreshRate: number; // milliseconds
  };
  status: 'normal' | 'warning' | 'critical';
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  context?: string;
  metadata?: any;
}

export interface HealthIndicator {
  id: string;
  name: string;
  value: number;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  trend: 'improving' | 'stable' | 'degrading';
  description: string;
  lastUpdated: Date;
}

export interface ContextStatusData {
  contextType: string;
  isActive: boolean;
  isHealthy: boolean;
  healthScore: number;
  memoryUsage: number;
  errorCount: number;
  responseTime: number;
  lastActivity: Date;
  issues: string[];
  actions: string[];
}

export interface MCPStatusData {
  isConnected: boolean;
  connectionLatency: number;
  availableFunctions: number;
  totalFunctions: number;
  connectionErrors: number;
  lastConnectionTime: Date;
  healthScore: number;
}

export interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'monitoring' | 'recovery' | 'analysis' | 'testing';
  enabled: boolean;
  handler: () => Promise<void>;
}

export interface DashboardRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'health' | 'security' | 'maintenance';
  actions: string[];
  estimatedImpact: string;
  timeToImplement: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'status' | 'log' | 'action' | 'custom';
  position: { x: number; y: number; width: number; height: number };
  config: any;
  visible: boolean;
  refreshInterval?: number;
}

export class RealDebugDashboard {
  private config: RealDashboardConfig;
  private mcpConnectionManager: MCPConnectionManager;
  private alertSystem: RealDebugAlertSystem;

  private dashboardData: LiveDashboardData | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private metricsHistory: LiveExtensionMetrics[] = [];
  private widgets: Map<string, DashboardWidget> = new Map();

  private isActive = false;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(
    mcpConnectionManager: MCPConnectionManager,
    alertSystem: RealDebugAlertSystem,
    config?: Partial<RealDashboardConfig>
  ) {
    this.mcpConnectionManager = mcpConnectionManager;
    this.alertSystem = alertSystem;
    this.config = this.createDefaultConfig(config);

    this.initializeDefaultWidgets();
  }

  /**
   * Create default dashboard configuration
   */
  private createDefaultConfig(
    overrides?: Partial<RealDashboardConfig>
  ): RealDashboardConfig {
    return {
      refreshInterval: 2000, // 2 seconds for real-time feel
      maxDataPoints: 300, // 10 minutes at 2-second intervals
      showRealTime: true,
      enableCharts: true,
      theme: 'dark',
      layout: 'grid',
      autoSave: true,
      notifications: true,
      ...overrides,
    };
  }

  /**
   * Initialize default dashboard widgets
   */
  private initializeDefaultWidgets(): void {
    const defaultWidgets: DashboardWidget[] = [
      {
        id: 'system-health',
        title: 'System Health',
        type: 'metric',
        position: { x: 0, y: 0, width: 2, height: 1 },
        config: { metric: 'health.overallScore', format: 'percentage' },
        visible: true,
      },
      {
        id: 'memory-usage',
        title: 'Memory Usage',
        type: 'chart',
        position: { x: 2, y: 0, width: 4, height: 2 },
        config: { chartType: 'line', metric: 'performance.memoryUsage' },
        visible: true,
        refreshInterval: 1000,
      },
      {
        id: 'response-time',
        title: 'Response Time',
        type: 'chart',
        position: { x: 6, y: 0, width: 4, height: 2 },
        config: { chartType: 'line', metric: 'performance.responseTime' },
        visible: true,
        refreshInterval: 1000,
      },
      {
        id: 'context-status',
        title: 'Extension Contexts',
        type: 'status',
        position: { x: 0, y: 1, width: 2, height: 2 },
        config: { showDetails: true },
        visible: true,
      },
      {
        id: 'active-alerts',
        title: 'Active Alerts',
        type: 'log',
        position: { x: 10, y: 0, width: 2, height: 3 },
        config: { maxEntries: 10, showSeverity: true },
        visible: true,
      },
      {
        id: 'mcp-status',
        title: 'MCP Connection',
        type: 'status',
        position: { x: 0, y: 3, width: 3, height: 1 },
        config: { showLatency: true, showFunctions: true },
        visible: true,
      },
      {
        id: 'quick-actions',
        title: 'Quick Actions',
        type: 'action',
        position: { x: 3, y: 3, width: 3, height: 1 },
        config: { showIcons: true, layout: 'horizontal' },
        visible: true,
      },
      {
        id: 'recommendations',
        title: 'Recommendations',
        type: 'custom',
        position: { x: 6, y: 2, width: 4, height: 2 },
        config: { maxRecommendations: 5, showPriority: true },
        visible: true,
      },
    ];

    defaultWidgets.forEach(widget => {
      this.widgets.set(widget.id, widget);
    });

    console.log(`Initialized ${defaultWidgets.length} dashboard widgets`);
  }

  /**
   * Start real-time dashboard
   */
  async startRealTimeDashboard(): Promise<void> {
    if (this.isActive) {
      console.warn('Real-time dashboard is already active');
      return;
    }

    console.log('🚀 Starting real-time debug dashboard...');

    this.isActive = true;

    // Start real-time updates
    if (this.config.showRealTime) {
      this.startRealTimeUpdates();
    }

    // Initialize dashboard data
    await this.updateDashboardData();

    console.log('✅ Real-time debug dashboard started');
  }

  /**
   * Stop real-time dashboard
   */
  stopRealTimeDashboard(): void {
    if (!this.isActive) {
      console.warn('Real-time dashboard is not active');
      return;
    }

    console.log('🛑 Stopping real-time debug dashboard...');

    this.isActive = false;

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log('✅ Real-time debug dashboard stopped');
  }

  /**
   * Start real-time updates
   */
  private startRealTimeUpdates(): void {
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateDashboardData();
        this.emitEvent('dashboard-updated', this.dashboardData);
      } catch (error) {
        console.error('Dashboard update failed:', error);
      }
    }, this.config.refreshInterval);

    console.log(
      `Started real-time dashboard updates (${this.config.refreshInterval}ms interval)`
    );
  }

  /**
   * Update dashboard data
   */
  async updateDashboardData(
    metrics?: LiveExtensionMetrics
  ): Promise<LiveDashboardData> {
    const timestamp = new Date();

    // If metrics not provided, get current metrics (placeholder)
    if (!metrics) {
      metrics = await this.getCurrentMetrics();
    }

    // Add to metrics history
    if (metrics) {
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > this.config.maxDataPoints) {
        this.metricsHistory = this.metricsHistory.slice(
          -this.config.maxDataPoints
        );
      }
    }

    // Get alert data
    const activeAlerts = this.alertSystem.getActiveAlerts();
    const alertStats = this.alertSystem.getAlertStatistics();

    // Build dashboard data
    this.dashboardData = {
      timestamp,
      sessionInfo: this.getSessionInfo(),
      extensionMetrics: metrics || this.createEmptyMetrics(),
      alertSummary: {
        activeAlerts: activeAlerts.length,
        criticalAlerts: activeAlerts.filter(a => a.severity === 'critical')
          .length,
        recentAlerts: activeAlerts.slice(-5),
        alertTrends: alertStats.alertTrends.slice(-20),
      },
      performanceCharts: this.generatePerformanceCharts(),
      healthIndicators: this.generateHealthIndicators(metrics),
      contextStatus: this.generateContextStatus(metrics),
      mcpStatus: this.generateMCPStatus(),
      quickActions: this.generateQuickActions(),
      recommendations: this.generateRecommendations(metrics, activeAlerts),
    };

    return this.dashboardData;
  }

  /**
   * Get current metrics (placeholder - would integrate with monitor)
   */
  private async getCurrentMetrics(): Promise<LiveExtensionMetrics> {
    // This would integrate with the real continuous monitor
    // For now, return a placeholder
    return this.createEmptyMetrics();
  }

  /**
   * Create empty metrics structure
   */
  private createEmptyMetrics(): LiveExtensionMetrics {
    return {
      timestamp: new Date(),
      contexts: {
        serviceWorker: this.createEmptyContextMetrics(),
        contentScript: this.createEmptyContextMetrics(),
        offscreen: this.createEmptyContextMetrics(),
        ui: this.createEmptyContextMetrics(),
      },
      performance: {
        memoryUsage: 0,
        cpuUsage: 0,
        networkLatency: 0,
        responseTime: 0,
      },
      health: {
        overallScore: 0,
        contextHealth: {},
        criticalIssues: [],
        warnings: [],
      },
    };
  }

  /**
   * Create empty context metrics
   */
  private createEmptyContextMetrics(): any {
    return {
      isActive: false,
      isHealthy: false,
      memoryUsage: 0,
      errorCount: 0,
      lastActivity: new Date(),
      responseTime: 0,
      healthScore: 0,
      issues: [],
    };
  }

  /**
   * Get session information
   */
  private getSessionInfo(): any {
    // This would integrate with the monitoring system
    return {
      sessionId: 'dashboard-session',
      status: 'active',
      uptime: Date.now(),
      isMonitoring: this.isActive,
    };
  }

  /**
   * Generate performance charts
   */
  private generatePerformanceCharts(): RealPerformanceChart[] {
    const charts: RealPerformanceChart[] = [];

    // Memory usage chart
    const memoryData = this.metricsHistory.map(m => ({
      timestamp: m.timestamp,
      value: m.performance.memoryUsage,
      context: 'memory',
    }));

    charts.push({
      id: 'memory-usage-chart',
      title: 'Memory Usage',
      type: 'line',
      data: memoryData,
      config: {
        unit: 'MB',
        threshold: 100,
        warningThreshold: 80,
        criticalThreshold: 120,
        timeRange: 600000, // 10 minutes
        refreshRate: 2000,
      },
      status: this.getChartStatus(memoryData, 100),
    });

    // Response time chart
    const responseTimeData = this.metricsHistory.map(m => ({
      timestamp: m.timestamp,
      value: m.performance.responseTime,
      context: 'response-time',
    }));

    charts.push({
      id: 'response-time-chart',
      title: 'Response Time',
      type: 'line',
      data: responseTimeData,
      config: {
        unit: 'ms',
        threshold: 2000,
        warningThreshold: 1500,
        criticalThreshold: 3000,
        timeRange: 600000,
        refreshRate: 2000,
      },
      status: this.getChartStatus(responseTimeData, 2000),
    });

    // Health score gauge
    const currentHealth =
      this.metricsHistory.length > 0
        ? this.metricsHistory[this.metricsHistory.length - 1].health
            .overallScore
        : 0;

    charts.push({
      id: 'health-gauge',
      title: 'Overall Health',
      type: 'gauge',
      data: [
        {
          timestamp: new Date(),
          value: currentHealth * 100,
          context: 'health',
        },
      ],
      config: {
        unit: '%',
        threshold: 80,
        warningThreshold: 60,
        criticalThreshold: 40,
        timeRange: 0,
        refreshRate: 2000,
      },
      status: this.getGaugeStatus(currentHealth * 100),
    });

    // Context activity pie chart
    if (this.metricsHistory.length > 0) {
      const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
      const contextData = Object.entries(latestMetrics.contexts).map(
        ([name, ctx]) => ({
          timestamp: new Date(),
          value: ctx.memoryUsage,
          label: name,
          context: name,
        })
      );

      charts.push({
        id: 'context-activity-pie',
        title: 'Context Memory Distribution',
        type: 'pie',
        data: contextData,
        config: {
          unit: 'MB',
          timeRange: 0,
          refreshRate: 5000,
        },
        status: 'normal',
      });
    }

    return charts;
  }

  /**
   * Generate health indicators
   */
  private generateHealthIndicators(
    metrics?: LiveExtensionMetrics
  ): HealthIndicator[] {
    const indicators: HealthIndicator[] = [];

    if (metrics) {
      // Overall health
      indicators.push({
        id: 'overall-health',
        name: 'Overall Health',
        value: metrics.health.overallScore * 100,
        status: this.getHealthStatus(metrics.health.overallScore * 100),
        trend: this.calculateHealthTrend('overallScore'),
        description: 'Overall extension health score',
        lastUpdated: metrics.timestamp,
      });

      // Memory health
      const memoryHealth = Math.max(
        0,
        100 - metrics.performance.memoryUsage / 2
      ); // Rough calculation
      indicators.push({
        id: 'memory-health',
        name: 'Memory Health',
        value: memoryHealth,
        status: this.getHealthStatus(memoryHealth),
        trend: this.calculateHealthTrend('memoryUsage', true), // Inverted trend
        description: 'Memory usage efficiency',
        lastUpdated: metrics.timestamp,
      });

      // Response time health
      const responseHealth = Math.max(
        0,
        100 - metrics.performance.responseTime / 50
      ); // Rough calculation
      indicators.push({
        id: 'response-health',
        name: 'Response Health',
        value: responseHealth,
        status: this.getHealthStatus(responseHealth),
        trend: this.calculateHealthTrend('responseTime', true), // Inverted trend
        description: 'Response time performance',
        lastUpdated: metrics.timestamp,
      });

      // Context health
      Object.entries(metrics.contexts).forEach(([name, context]) => {
        indicators.push({
          id: `${name}-health`,
          name: `${name} Health`,
          value: context.healthScore * 100,
          status: this.getHealthStatus(context.healthScore * 100),
          trend: 'stable', // Would calculate from history
          description: `${name} context health`,
          lastUpdated: metrics.timestamp,
        });
      });
    }

    // MCP connection health
    const mcpStatus = this.mcpConnectionManager.getConnectionStatus();
    const mcpHealth = mcpStatus.isConnected
      ? Math.max(0, 100 - mcpStatus.connectionLatency / 50)
      : 0;

    indicators.push({
      id: 'mcp-health',
      name: 'MCP Health',
      value: mcpHealth,
      status: this.getHealthStatus(mcpHealth),
      trend: 'stable',
      description: 'MCP connection health',
      lastUpdated: mcpStatus.lastConnectionTime,
    });

    return indicators;
  }

  /**
   * Generate context status data
   */
  private generateContextStatus(
    metrics?: LiveExtensionMetrics
  ): ContextStatusData[] {
    if (!metrics) return [];

    return Object.entries(metrics.contexts).map(([contextType, context]) => ({
      contextType,
      isActive: context.isActive,
      isHealthy: context.isHealthy,
      healthScore: context.healthScore,
      memoryUsage: context.memoryUsage,
      errorCount: context.errorCount,
      responseTime: context.responseTime,
      lastActivity: context.lastActivity,
      issues: context.issues,
      actions: this.generateContextActions(contextType, context),
    }));
  }

  /**
   * Generate context actions
   */
  private generateContextActions(contextType: string, context: any): string[] {
    const actions: string[] = [];

    if (!context.isHealthy) {
      actions.push(`Restart ${contextType}`);
      actions.push(`Clear ${contextType} cache`);
    }

    if (context.memoryUsage > 50) {
      actions.push('Trigger garbage collection');
    }

    if (context.errorCount > 0) {
      actions.push('View error logs');
      actions.push('Clear error count');
    }

    return actions;
  }

  /**
   * Generate MCP status data
   */
  private generateMCPStatus(): MCPStatusData {
    const status = this.mcpConnectionManager.getConnectionStatus();
    const config = this.mcpConnectionManager.getConfiguration();

    return {
      isConnected: status.isConnected,
      connectionLatency: status.connectionLatency,
      availableFunctions: status.availableFunctions.length,
      totalFunctions: config.requiredFunctions.length,
      connectionErrors: status.connectionErrors.length,
      lastConnectionTime: status.lastConnectionTime,
      healthScore: status.isConnected
        ? Math.max(0, 100 - status.connectionLatency / 50)
        : 0,
    };
  }

  /**
   * Generate quick actions
   */
  private generateQuickActions(): QuickAction[] {
    return [
      {
        id: 'trigger-gc',
        name: 'Trigger GC',
        description: 'Force garbage collection',
        icon: '🗑️',
        category: 'recovery',
        enabled: true,
        handler: async () => {
          console.log('Triggering garbage collection...');
          // Implementation would go here
        },
      },
      {
        id: 'clear-caches',
        name: 'Clear Caches',
        description: 'Clear all extension caches',
        icon: '🧹',
        category: 'recovery',
        enabled: true,
        handler: async () => {
          console.log('Clearing caches...');
          // Implementation would go here
        },
      },
      {
        id: 'run-health-check',
        name: 'Health Check',
        description: 'Run comprehensive health check',
        icon: '🏥',
        category: 'analysis',
        enabled: true,
        handler: async () => {
          console.log('Running health check...');
          // Implementation would go here
        },
      },
      {
        id: 'export-metrics',
        name: 'Export Metrics',
        description: 'Export current metrics data',
        icon: '📊',
        category: 'analysis',
        enabled: true,
        handler: async () => {
          console.log('Exporting metrics...');
          // Implementation would go here
        },
      },
      {
        id: 'restart-monitoring',
        name: 'Restart Monitor',
        description: 'Restart monitoring system',
        icon: '🔄',
        category: 'monitoring',
        enabled: true,
        handler: async () => {
          console.log('Restarting monitoring...');
          // Implementation would go here
        },
      },
    ];
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    metrics?: LiveExtensionMetrics,
    alerts?: RealTimeAlert[]
  ): DashboardRecommendation[] {
    const recommendations: DashboardRecommendation[] = [];

    if (metrics) {
      // Memory recommendations
      if (metrics.performance.memoryUsage > 100) {
        recommendations.push({
          id: 'reduce-memory',
          title: 'Reduce Memory Usage',
          description: `Current memory usage (${metrics.performance.memoryUsage.toFixed(1)}MB) exceeds recommended threshold`,
          priority: 'high',
          category: 'performance',
          actions: [
            'Trigger garbage collection',
            'Clear caches',
            'Optimize data structures',
          ],
          estimatedImpact: 'High - Improved performance and stability',
          timeToImplement: '5-10 minutes',
        });
      }

      // Response time recommendations
      if (metrics.performance.responseTime > 2000) {
        recommendations.push({
          id: 'improve-response-time',
          title: 'Improve Response Time',
          description: `Response time (${metrics.performance.responseTime}ms) is slower than optimal`,
          priority: 'medium',
          category: 'performance',
          actions: [
            'Optimize slow operations',
            'Reduce polling frequency',
            'Cache frequently accessed data',
          ],
          estimatedImpact: 'Medium - Better user experience',
          timeToImplement: '15-30 minutes',
        });
      }

      // Health recommendations
      if (metrics.health.overallScore < 0.8) {
        recommendations.push({
          id: 'improve-health',
          title: 'Improve System Health',
          description: `Overall health score (${(metrics.health.overallScore * 100).toFixed(1)}%) needs attention`,
          priority: 'high',
          category: 'health',
          actions: [
            'Address critical issues',
            'Fix context problems',
            'Review error logs',
          ],
          estimatedImpact: 'High - System stability and reliability',
          timeToImplement: '20-45 minutes',
        });
      }

      // Context-specific recommendations
      Object.entries(metrics.contexts).forEach(([name, context]) => {
        if (!context.isHealthy) {
          recommendations.push({
            id: `fix-${name}-context`,
            title: `Fix ${name} Context`,
            description: `${name} context is unhealthy (${(context.healthScore * 100).toFixed(1)}% health)`,
            priority: context.healthScore < 0.3 ? 'critical' : 'high',
            category: 'health',
            actions: [
              `Restart ${name} context`,
              `Clear ${name} cache`,
              `Debug ${name} issues`,
            ],
            estimatedImpact: 'High - Context functionality restoration',
            timeToImplement: '10-20 minutes',
          });
        }
      });
    }

    // Alert-based recommendations
    if (alerts && alerts.length > 0) {
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        recommendations.push({
          id: 'address-critical-alerts',
          title: 'Address Critical Alerts',
          description: `${criticalAlerts.length} critical alerts require immediate attention`,
          priority: 'critical',
          category: 'maintenance',
          actions: [
            'Review critical alerts',
            'Execute recovery actions',
            'Monitor resolution',
          ],
          estimatedImpact: 'Critical - System stability',
          timeToImplement: 'Immediate',
        });
      }
    }

    // MCP recommendations
    const mcpStatus = this.mcpConnectionManager.getConnectionStatus();
    if (!mcpStatus.isConnected || mcpStatus.connectionErrors.length > 0) {
      recommendations.push({
        id: 'fix-mcp-connection',
        title: 'Fix MCP Connection',
        description: 'MCP connection issues detected',
        priority: 'high',
        category: 'maintenance',
        actions: [
          'Reconnect MCP server',
          'Check MCP configuration',
          'Restart MCP service',
        ],
        estimatedImpact: 'High - Debugging functionality',
        timeToImplement: '5-15 minutes',
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    recommendations.sort(
      (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
    );

    return recommendations.slice(0, 10); // Limit to top 10
  }

  /**
   * Helper methods for status calculation
   */
  private getChartStatus(
    data: ChartDataPoint[],
    threshold: number
  ): 'normal' | 'warning' | 'critical' {
    if (data.length === 0) return 'normal';

    const latestValue = data[data.length - 1].value;
    if (latestValue > threshold * 1.5) return 'critical';
    if (latestValue > threshold) return 'warning';
    return 'normal';
  }

  private getGaugeStatus(value: number): 'normal' | 'warning' | 'critical' {
    if (value < 40) return 'critical';
    if (value < 60) return 'warning';
    return 'normal';
  }

  private getHealthStatus(
    value: number
  ): 'healthy' | 'warning' | 'critical' | 'unknown' {
    if (value >= 80) return 'healthy';
    if (value >= 60) return 'warning';
    if (value > 0) return 'critical';
    return 'unknown';
  }

  private calculateHealthTrend(
    metric: string,
    inverted = false
  ): 'improving' | 'stable' | 'degrading' {
    if (this.metricsHistory.length < 5) return 'stable';

    const recent = this.metricsHistory.slice(-3);
    const older = this.metricsHistory.slice(-6, -3);

    if (recent.length === 0 || older.length === 0) return 'stable';

    // This is a simplified trend calculation
    const recentAvg =
      recent.reduce((sum, m) => sum + this.getMetricValue(m, metric), 0) /
      recent.length;
    const olderAvg =
      older.reduce((sum, m) => sum + this.getMetricValue(m, metric), 0) /
      older.length;

    const improving = inverted ? recentAvg < olderAvg : recentAvg > olderAvg;
    const degrading = inverted ? recentAvg > olderAvg : recentAvg < olderAvg;

    if (improving && Math.abs(recentAvg - olderAvg) > 0.1) return 'improving';
    if (degrading && Math.abs(recentAvg - olderAvg) > 0.1) return 'degrading';
    return 'stable';
  }

  private getMetricValue(metrics: LiveExtensionMetrics, path: string): number {
    const parts = path.split('.');
    let value: any = metrics;

    for (const part of parts) {
      value = value?.[part];
    }

    return typeof value === 'number' ? value : 0;
  }

  /**
   * Generate HTML dashboard
   */
  generateHTMLDashboard(): string {
    if (!this.dashboardData) {
      return '<div>Dashboard not initialized</div>';
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Real-Time Debug Dashboard</title>
    <style>
        ${this.getDashboardCSS()}
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="theme-${this.config.theme}">
    <div class="dashboard-container">
        ${this.generateDashboardHeader()}
        ${this.generateDashboardGrid()}
        ${this.generateDashboardFooter()}
    </div>
    
    <script>
        ${this.getDashboardJS()}
    </script>
</body>
</html>`;
  }

  /**
   * Generate dashboard header
   */
  private generateDashboardHeader(): string {
    const data = this.dashboardData!;

    return `
    <header class="dashboard-header">
        <div class="header-left">
            <h1>🔍 Real-Time Debug Dashboard</h1>
            <div class="session-info">
                <span class="session-id">${data.sessionInfo.sessionId}</span>
                <span class="status-badge status-${data.sessionInfo.status}">${data.sessionInfo.status}</span>
                <span class="uptime">Uptime: ${this.formatDuration(data.sessionInfo.uptime)}</span>
            </div>
        </div>
        <div class="header-right">
            <div class="health-indicator">
                <span class="health-score">${(data.extensionMetrics.health.overallScore * 100).toFixed(1)}%</span>
                <span class="health-label">Health</span>
            </div>
            <div class="alert-indicator">
                <span class="alert-count ${data.alertSummary.criticalAlerts > 0 ? 'critical' : ''}">${data.alertSummary.activeAlerts}</span>
                <span class="alert-label">Alerts</span>
            </div>
            <button class="refresh-btn" onclick="refreshDashboard()">🔄</button>
        </div>
    </header>`;
  }

  /**
   * Generate dashboard grid
   */
  private generateDashboardGrid(): string {
    const widgets = Array.from(this.widgets.values()).filter(w => w.visible);

    return `
    <main class="dashboard-grid">
        ${widgets.map(widget => this.generateWidget(widget)).join('')}
    </main>`;
  }

  /**
   * Generate individual widget
   */
  private generateWidget(widget: DashboardWidget): string {
    const style = `
        grid-column: ${widget.position.x + 1} / span ${widget.position.width};
        grid-row: ${widget.position.y + 1} / span ${widget.position.height};
    `;

    switch (widget.type) {
      case 'chart':
        return this.generateChartWidget(widget, style);
      case 'metric':
        return this.generateMetricWidget(widget, style);
      case 'status':
        return this.generateStatusWidget(widget, style);
      case 'log':
        return this.generateLogWidget(widget, style);
      case 'action':
        return this.generateActionWidget(widget, style);
      case 'custom':
        return this.generateCustomWidget(widget, style);
      default:
        return `<div class="widget" style="${style}"><h3>${widget.title}</h3><p>Unknown widget type</p></div>`;
    }
  }

  /**
   * Generate chart widget
   */
  private generateChartWidget(widget: DashboardWidget, style: string): string {
    const chart = this.dashboardData!.performanceCharts.find(c =>
      c.title
        .toLowerCase()
        .includes(widget.config.metric?.split('.').pop()?.toLowerCase() || '')
    );

    return `
    <div class="widget chart-widget" style="${style}">
        <div class="widget-header">
            <h3>${widget.title}</h3>
            <span class="status-indicator status-${chart?.status || 'normal'}"></span>
        </div>
        <div class="widget-content">
            <canvas id="chart-${widget.id}" width="400" height="200"></canvas>
        </div>
    </div>`;
  }

  /**
   * Generate metric widget
   */
  private generateMetricWidget(widget: DashboardWidget, style: string): string {
    const value = this.getMetricValue(
      this.dashboardData!.extensionMetrics,
      widget.config.metric
    );
    const formattedValue =
      widget.config.format === 'percentage'
        ? `${(value * 100).toFixed(1)}%`
        : value.toFixed(1);

    return `
    <div class="widget metric-widget" style="${style}">
        <div class="widget-header">
            <h3>${widget.title}</h3>
        </div>
        <div class="widget-content">
            <div class="metric-value">${formattedValue}</div>
            <div class="metric-trend">📈 Stable</div>
        </div>
    </div>`;
  }

  /**
   * Generate status widget
   */
  private generateStatusWidget(widget: DashboardWidget, style: string): string {
    if (widget.id === 'context-status') {
      return this.generateContextStatusWidget(widget, style);
    } else if (widget.id === 'mcp-status') {
      return this.generateMCPStatusWidget(widget, style);
    }

    return `<div class="widget" style="${style}"><h3>${widget.title}</h3></div>`;
  }

  /**
   * Generate context status widget
   */
  private generateContextStatusWidget(
    widget: DashboardWidget,
    style: string
  ): string {
    const contexts = this.dashboardData!.contextStatus;

    return `
    <div class="widget status-widget" style="${style}">
        <div class="widget-header">
            <h3>${widget.title}</h3>
        </div>
        <div class="widget-content">
            ${contexts
              .map(
                ctx => `
                <div class="context-item">
                    <div class="context-name">${ctx.contextType}</div>
                    <div class="context-status">
                        <span class="status-dot ${ctx.isHealthy ? 'healthy' : 'unhealthy'}"></span>
                        <span class="health-score">${(ctx.healthScore * 100).toFixed(0)}%</span>
                    </div>
                    <div class="context-memory">${ctx.memoryUsage.toFixed(1)}MB</div>
                </div>
            `
              )
              .join('')}
        </div>
    </div>`;
  }

  /**
   * Generate MCP status widget
   */
  private generateMCPStatusWidget(
    widget: DashboardWidget,
    style: string
  ): string {
    const mcp = this.dashboardData!.mcpStatus;

    return `
    <div class="widget status-widget" style="${style}">
        <div class="widget-header">
            <h3>${widget.title}</h3>
        </div>
        <div class="widget-content">
            <div class="mcp-status">
                <div class="status-item">
                    <span class="status-dot ${mcp.isConnected ? 'connected' : 'disconnected'}"></span>
                    <span>${mcp.isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                <div class="status-item">
                    <span>Latency: ${mcp.connectionLatency}ms</span>
                </div>
                <div class="status-item">
                    <span>Functions: ${mcp.availableFunctions}/${mcp.totalFunctions}</span>
                </div>
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate log widget
   */
  private generateLogWidget(widget: DashboardWidget, style: string): string {
    const alerts = this.dashboardData!.alertSummary.recentAlerts;

    return `
    <div class="widget log-widget" style="${style}">
        <div class="widget-header">
            <h3>${widget.title}</h3>
            <span class="alert-count">${alerts.length}</span>
        </div>
        <div class="widget-content">
            <div class="log-entries">
                ${alerts
                  .map(
                    alert => `
                    <div class="log-entry severity-${alert.severity}">
                        <div class="log-time">${alert.timestamp.toLocaleTimeString()}</div>
                        <div class="log-message">${alert.message}</div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate action widget
   */
  private generateActionWidget(widget: DashboardWidget, style: string): string {
    const actions = this.dashboardData!.quickActions.filter(a => a.enabled);

    return `
    <div class="widget action-widget" style="${style}">
        <div class="widget-header">
            <h3>${widget.title}</h3>
        </div>
        <div class="widget-content">
            <div class="action-buttons">
                ${actions
                  .map(
                    action => `
                    <button class="action-btn" onclick="executeAction('${action.id}')" title="${action.description}">
                        <span class="action-icon">${action.icon}</span>
                        <span class="action-name">${action.name}</span>
                    </button>
                `
                  )
                  .join('')}
            </div>
        </div>
    </div>`;
  }

  /**
   * Generate custom widget (recommendations)
   */
  private generateCustomWidget(widget: DashboardWidget, style: string): string {
    if (widget.id === 'recommendations') {
      const recommendations = this.dashboardData!.recommendations.slice(0, 5);

      return `
      <div class="widget custom-widget" style="${style}">
          <div class="widget-header">
              <h3>${widget.title}</h3>
          </div>
          <div class="widget-content">
              <div class="recommendations">
                  ${recommendations
                    .map(
                      rec => `
                      <div class="recommendation priority-${rec.priority}">
                          <div class="rec-title">${rec.title}</div>
                          <div class="rec-description">${rec.description}</div>
                          <div class="rec-actions">
                              ${rec.actions
                                .slice(0, 2)
                                .map(
                                  action => `
                                  <button class="rec-action-btn">${action}</button>
                              `
                                )
                                .join('')}
                          </div>
                      </div>
                  `
                    )
                    .join('')}
              </div>
          </div>
      </div>`;
    }

    return `<div class="widget" style="${style}"><h3>${widget.title}</h3></div>`;
  }

  /**
   * Generate dashboard footer
   */
  private generateDashboardFooter(): string {
    return `
    <footer class="dashboard-footer">
        <div class="footer-left">
            <span>Last updated: ${this.dashboardData!.timestamp.toLocaleTimeString()}</span>
            <span>Refresh rate: ${this.config.refreshInterval}ms</span>
        </div>
        <div class="footer-right">
            <button onclick="exportDashboard()">📊 Export</button>
            <button onclick="toggleTheme()">🌓 Theme</button>
            <button onclick="openSettings()">⚙️ Settings</button>
        </div>
    </footer>`;
  }

  /**
   * Get dashboard CSS
   */
  private getDashboardCSS(): string {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #ffffff;
            overflow-x: hidden;
        }
        
        .dashboard-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .dashboard-header {
            background: #2d2d2d;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #404040;
        }
        
        .header-left h1 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }
        
        .session-info {
            display: flex;
            gap: 1rem;
            font-size: 0.9rem;
            color: #cccccc;
        }
        
        .status-badge {
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            text-transform: uppercase;
        }
        
        .status-active { background: #28a745; }
        .status-monitoring { background: #007bff; }
        .status-error { background: #dc3545; }
        
        .header-right {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .health-indicator, .alert-indicator {
            text-align: center;
        }
        
        .health-score, .alert-count {
            display: block;
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .alert-count.critical { color: #dc3545; }
        
        .refresh-btn {
            background: #007bff;
            border: none;
            color: white;
            padding: 0.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
        }
        
        .dashboard-grid {
            flex: 1;
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            grid-template-rows: repeat(auto-fit, 200px);
            gap: 1rem;
            padding: 1rem;
        }
        
        .widget {
            background: #2d2d2d;
            border: 1px solid #404040;
            border-radius: 8px;
            padding: 1rem;
            display: flex;
            flex-direction: column;
        }
        
        .widget-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #404040;
        }
        
        .widget-header h3 {
            font-size: 1rem;
            color: #ffffff;
        }
        
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        
        .status-normal { background: #28a745; }
        .status-warning { background: #ffc107; }
        .status-critical { background: #dc3545; }
        
        .widget-content {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            text-align: center;
            margin: 1rem 0;
        }
        
        .metric-trend {
            text-align: center;
            color: #cccccc;
            font-size: 0.9rem;
        }
        
        .context-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid #404040;
        }
        
        .context-item:last-child {
            border-bottom: none;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 0.5rem;
        }
        
        .status-dot.healthy { background: #28a745; }
        .status-dot.unhealthy { background: #dc3545; }
        .status-dot.connected { background: #28a745; }
        .status-dot.disconnected { background: #dc3545; }
        
        .log-entries {
            max-height: 150px;
            overflow-y: auto;
        }
        
        .log-entry {
            padding: 0.5rem;
            margin-bottom: 0.5rem;
            border-radius: 4px;
            border-left: 3px solid;
        }
        
        .log-entry.severity-low { border-left-color: #28a745; background: rgba(40, 167, 69, 0.1); }
        .log-entry.severity-medium { border-left-color: #ffc107; background: rgba(255, 193, 7, 0.1); }
        .log-entry.severity-high { border-left-color: #fd7e14; background: rgba(253, 126, 20, 0.1); }
        .log-entry.severity-critical { border-left-color: #dc3545; background: rgba(220, 53, 69, 0.1); }
        
        .log-time {
            font-size: 0.8rem;
            color: #cccccc;
        }
        
        .log-message {
            font-size: 0.9rem;
            margin-top: 0.2rem;
        }
        
        .action-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .action-btn {
            background: #007bff;
            border: none;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
        }
        
        .action-btn:hover {
            background: #0056b3;
        }
        
        .recommendations {
            max-height: 150px;
            overflow-y: auto;
        }
        
        .recommendation {
            padding: 0.5rem;
            margin-bottom: 0.5rem;
            border-radius: 4px;
            border-left: 3px solid;
        }
        
        .recommendation.priority-low { border-left-color: #28a745; }
        .recommendation.priority-medium { border-left-color: #ffc107; }
        .recommendation.priority-high { border-left-color: #fd7e14; }
        .recommendation.priority-critical { border-left-color: #dc3545; }
        
        .rec-title {
            font-weight: bold;
            margin-bottom: 0.2rem;
        }
        
        .rec-description {
            font-size: 0.9rem;
            color: #cccccc;
            margin-bottom: 0.5rem;
        }
        
        .rec-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .rec-action-btn {
            background: #6c757d;
            border: none;
            color: white;
            padding: 0.2rem 0.5rem;
            border-radius: 3px;
            cursor: pointer;
            font-size: 0.8rem;
        }
        
        .dashboard-footer {
            background: #2d2d2d;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #404040;
            font-size: 0.9rem;
            color: #cccccc;
        }
        
        .footer-left {
            display: flex;
            gap: 1rem;
        }
        
        .footer-right {
            display: flex;
            gap: 0.5rem;
        }
        
        .footer-right button {
            background: #6c757d;
            border: none;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        .footer-right button:hover {
            background: #5a6268;
        }
    `;
  }

  /**
   * Get dashboard JavaScript
   */
  private getDashboardJS(): string {
    return `
        // Dashboard JavaScript functionality
        let dashboardData = ${JSON.stringify(this.dashboardData)};
        let refreshInterval;
        
        function refreshDashboard() {
            console.log('Refreshing dashboard...');
            // In a real implementation, this would fetch new data
            location.reload();
        }
        
        function executeAction(actionId) {
            console.log('Executing action:', actionId);
            // Action execution would be implemented here
        }
        
        function exportDashboard() {
            const data = JSON.stringify(dashboardData, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dashboard-data.json';
            a.click();
            URL.revokeObjectURL(url);
        }
        
        function toggleTheme() {
            document.body.classList.toggle('theme-light');
            document.body.classList.toggle('theme-dark');
        }
        
        function openSettings() {
            console.log('Opening settings...');
            // Settings modal would be implemented here
        }
        
        // Initialize charts
        function initializeCharts() {
            const chartElements = document.querySelectorAll('canvas[id^="chart-"]');
            chartElements.forEach(canvas => {
                const ctx = canvas.getContext('2d');
                const chartId = canvas.id.replace('chart-', '');
                
                // Find corresponding chart data
                const chartData = dashboardData.performanceCharts.find(c => 
                    c.id.includes(chartId) || chartId.includes(c.id.split('-')[0])
                );
                
                if (chartData) {
                    new Chart(ctx, {
                        type: chartData.type === 'gauge' ? 'doughnut' : chartData.type,
                        data: {
                            labels: chartData.data.map(d => new Date(d.timestamp).toLocaleTimeString()),
                            datasets: [{
                                label: chartData.title,
                                data: chartData.data.map(d => d.value),
                                borderColor: '#007bff',
                                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                                tension: 0.4
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                }
                            },
                            scales: chartData.type !== 'pie' && chartData.type !== 'doughnut' ? {
                                y: {
                                    beginAtZero: true,
                                    grid: {
                                        color: '#404040'
                                    },
                                    ticks: {
                                        color: '#cccccc'
                                    }
                                },
                                x: {
                                    grid: {
                                        color: '#404040'
                                    },
                                    ticks: {
                                        color: '#cccccc'
                                    }
                                }
                            } : {}
                        }
                    });
                }
            });
        }
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            initializeCharts();
            
            // Start auto-refresh
            refreshInterval = setInterval(refreshDashboard, ${this.config.refreshInterval});
        });
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', function() {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        });
    `;
  }

  /**
   * Format duration helper
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Event system
   */
  addEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  removeEventListener(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Public API methods
   */

  /**
   * Get current dashboard data
   */
  getDashboardData(): LiveDashboardData | null {
    return this.dashboardData;
  }

  /**
   * Update dashboard configuration
   */
  updateConfiguration(newConfig: Partial<RealDashboardConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.isActive) {
      // Restart with new configuration
      this.stopRealTimeDashboard();
      setTimeout(() => {
        this.startRealTimeDashboard();
      }, 100);
    }
  }

  /**
   * Add custom widget
   */
  addWidget(widget: DashboardWidget): void {
    this.widgets.set(widget.id, widget);
    console.log(`Added dashboard widget: ${widget.title}`);
  }

  /**
   * Remove widget
   */
  removeWidget(widgetId: string): boolean {
    const removed = this.widgets.delete(widgetId);
    if (removed) {
      console.log(`Removed dashboard widget: ${widgetId}`);
    }
    return removed;
  }

  /**
   * Export dashboard data
   */
  exportDashboardData(format: 'json' | 'csv' = 'json'): string {
    if (!this.dashboardData) {
      throw new Error('No dashboard data available');
    }

    if (format === 'json') {
      return JSON.stringify(this.dashboardData, null, 2);
    } else {
      // CSV export would be implemented here
      return 'CSV export not implemented';
    }
  }

  /**
   * Get dashboard status
   */
  getDashboardStatus(): {
    isActive: boolean;
    config: RealDashboardConfig;
    widgetCount: number;
    lastUpdate: Date | null;
    metricsHistorySize: number;
  } {
    return {
      isActive: this.isActive,
      config: this.config,
      widgetCount: this.widgets.size,
      lastUpdate: this.dashboardData?.timestamp || null,
      metricsHistorySize: this.metricsHistory.length,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopRealTimeDashboard();
    this.widgets.clear();
    this.metricsHistory = [];
    this.dashboardData = null;
    this.eventListeners.clear();
    console.log('Real debug dashboard cleaned up');
  }
}
