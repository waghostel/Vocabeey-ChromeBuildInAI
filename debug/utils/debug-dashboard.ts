/**
 * Debug Dashboard
 * Provides debugging data visualization and dashboard functionality
 */

import {
  DebugSessionState,
  PerformanceMetrics,
  TestResult,
  ConsoleMessage,
  NetworkRequest,
  MemorySnapshot,
  ErrorLog,
} from '../types/debug-types.js';

export interface DashboardConfig {
  refreshInterval: number;
  maxDataPoints: number;
  showRealTime: boolean;
  enableCharts: boolean;
  theme: 'light' | 'dark';
}

export interface DashboardData {
  sessionOverview: SessionOverview;
  performanceCharts: PerformanceChartData[];
  errorSummary: ErrorSummary;
  networkActivity: NetworkActivityData;
  memoryUsage: MemoryUsageData;
  testResults: TestResultSummary;
  timeline: TimelineEvent[];
}

export interface SessionOverview {
  sessionId: string;
  status: string;
  duration: number;
  activeContexts: number;
  totalEvents: number;
  lastUpdate: Date;
}

export interface PerformanceChartData {
  name: string;
  type: 'line' | 'bar' | 'pie' | 'gauge';
  data: ChartDataPoint[];
  unit: string;
  threshold?: number;
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
  context?: string;
}

export interface ErrorSummary {
  totalErrors: number;
  errorsByLevel: Record<string, number>;
  recentErrors: ErrorLog[];
  errorTrends: ChartDataPoint[];
}

export interface NetworkActivityData {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  requestsByStatus: Record<number, number>;
  recentRequests: NetworkRequest[];
  activityTimeline: ChartDataPoint[];
}

export interface MemoryUsageData {
  current: number;
  peak: number;
  trend: ChartDataPoint[];
  byContext: Record<string, number>;
  warnings: string[];
}

export interface TestResultSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageExecutionTime: number;
  recentResults: TestResult[];
  successRate: number;
}

export interface TimelineEvent {
  timestamp: Date;
  type: 'test' | 'error' | 'network' | 'performance' | 'context';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: string;
}

export class DebugDashboard {
  private config: DashboardConfig;
  private dashboardData: DashboardData | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<DashboardConfig>) {
    this.config = {
      refreshInterval: 5000, // 5 seconds
      maxDataPoints: 100,
      showRealTime: true,
      enableCharts: true,
      theme: 'light',
      ...config,
    };
  }

  /**
   * Initialize dashboard with session data
   */
  async initializeDashboard(
    sessionState: DebugSessionState
  ): Promise<DashboardData> {
    this.dashboardData = await this.generateDashboardData(sessionState);

    if (this.config.showRealTime) {
      this.startRealTimeUpdates(sessionState);
    }

    return this.dashboardData;
  }

  /**
   * Update dashboard with new session data
   */
  async updateDashboard(
    sessionState: DebugSessionState
  ): Promise<DashboardData> {
    this.dashboardData = await this.generateDashboardData(sessionState);
    return this.dashboardData;
  }

  /**
   * Get current dashboard data
   */
  getDashboardData(): DashboardData | null {
    return this.dashboardData;
  }

  /**
   * Generate performance metrics visualization
   */
  generatePerformanceCharts(
    sessionState: DebugSessionState
  ): PerformanceChartData[] {
    const charts: PerformanceChartData[] = [];

    // Memory usage chart
    const memoryData = sessionState.capturedData.memorySnapshots
      .slice(-this.config.maxDataPoints)
      .map(snapshot => ({
        timestamp: snapshot.timestamp,
        value: snapshot.usedJSHeapSize / 1024 / 1024, // Convert to MB
        context: snapshot.context,
      }));

    charts.push({
      name: 'Memory Usage',
      type: 'line',
      data: memoryData,
      unit: 'MB',
      threshold: 50, // 50MB threshold
    });

    // Performance metrics chart
    const performanceData = sessionState.capturedData.performanceMetrics
      .slice(-this.config.maxDataPoints)
      .map(metric => ({
        timestamp: metric.timestamp,
        value: metric.value,
        label: metric.name,
        context: metric.context,
      }));

    charts.push({
      name: 'Performance Metrics',
      type: 'line',
      data: performanceData,
      unit: 'ms',
    });

    // Network response time chart
    const networkData = sessionState.capturedData.networkRequests
      .slice(-this.config.maxDataPoints)
      .map(request => ({
        timestamp: request.timestamp,
        value: request.responseTime,
        context: request.context,
      }));

    charts.push({
      name: 'Network Response Time',
      type: 'line',
      data: networkData,
      unit: 'ms',
      threshold: 1000, // 1 second threshold
    });

    // Context activity distribution
    const contextActivity = this.calculateContextActivity(sessionState);
    const contextData = Object.entries(contextActivity).map(
      ([context, count]) => ({
        timestamp: new Date(),
        value: count,
        label: context,
      })
    );

    charts.push({
      name: 'Context Activity',
      type: 'pie',
      data: contextData,
      unit: 'events',
    });

    return charts;
  }

  /**
   * Create debugging timeline view
   */
  generateTimeline(sessionState: DebugSessionState): TimelineEvent[] {
    const timeline: TimelineEvent[] = [];

    // Add test results to timeline
    sessionState.testResults.forEach(result => {
      timeline.push({
        timestamp: result.timestamp,
        type: 'test',
        title: `Test: ${result.scenarioName}`,
        description: result.passed
          ? 'Test passed'
          : `Test failed: ${result.error}`,
        severity: result.passed ? 'low' : 'high',
      });
    });

    // Add errors to timeline
    sessionState.capturedData.errorLogs.forEach(error => {
      timeline.push({
        timestamp: error.timestamp,
        type: 'error',
        title: `Error: ${error.level}`,
        description: error.message,
        severity:
          error.level === 'critical'
            ? 'critical'
            : error.level === 'error'
              ? 'high'
              : 'medium',
        context: error.context,
      });
    });

    // Add network events to timeline
    sessionState.capturedData.networkRequests
      .filter(req => req.status >= 400)
      .forEach(request => {
        timeline.push({
          timestamp: request.timestamp,
          type: 'network',
          title: `Network Error: ${request.status}`,
          description: `${request.method} ${request.url}`,
          severity: request.status >= 500 ? 'high' : 'medium',
          context: request.context,
        });
      });

    // Add performance warnings to timeline
    sessionState.capturedData.performanceMetrics
      .filter(metric => this.isPerformanceWarning(metric))
      .forEach(metric => {
        timeline.push({
          timestamp: metric.timestamp,
          type: 'performance',
          title: `Performance Warning: ${metric.name}`,
          description: `Value: ${metric.value}${metric.unit}`,
          severity: 'medium',
          context: metric.context,
        });
      });

    // Sort by timestamp (newest first)
    return timeline.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Generate HTML dashboard
   */
  generateHTMLDashboard(sessionState: DebugSessionState): string {
    const dashboardData =
      this.dashboardData || this.generateDashboardDataSync(sessionState);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Dashboard - ${dashboardData.sessionOverview.sessionId}</title>
    <style>
        ${this.getDashboardCSS()}
    </style>
</head>
<body class="theme-${this.config.theme}">
    <div class="dashboard">
        <header class="dashboard-header">
            <h1>Debug Dashboard</h1>
            <div class="session-info">
                <span class="session-id">${dashboardData.sessionOverview.sessionId}</span>
                <span class="session-status status-${dashboardData.sessionOverview.status}">
                    ${dashboardData.sessionOverview.status}
                </span>
            </div>
        </header>

        <div class="dashboard-grid">
            ${this.generateOverviewSection(dashboardData.sessionOverview)}
            ${this.generatePerformanceSection(dashboardData.performanceCharts)}
            ${this.generateErrorSection(dashboardData.errorSummary)}
            ${this.generateNetworkSection(dashboardData.networkActivity)}
            ${this.generateMemorySection(dashboardData.memoryUsage)}
            ${this.generateTestSection(dashboardData.testResults)}
            ${this.generateTimelineSection(dashboardData.timeline)}
        </div>
    </div>

    <script>
        ${this.getDashboardJS()}
    </script>
</body>
</html>`;
  }

  /**
   * Export dashboard data as JSON
   */
  exportDashboardData(format: 'json' | 'csv' = 'json'): string {
    if (!this.dashboardData) {
      throw new Error('No dashboard data available');
    }

    if (format === 'json') {
      return JSON.stringify(this.dashboardData, null, 2);
    } else {
      return this.convertToCSV(this.dashboardData);
    }
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Private helper methods

  private async generateDashboardData(
    sessionState: DebugSessionState
  ): Promise<DashboardData> {
    return {
      sessionOverview: this.generateSessionOverview(sessionState),
      performanceCharts: this.generatePerformanceCharts(sessionState),
      errorSummary: this.generateErrorSummary(sessionState),
      networkActivity: this.generateNetworkActivity(sessionState),
      memoryUsage: this.generateMemoryUsage(sessionState),
      testResults: this.generateTestResultSummary(sessionState),
      timeline: this.generateTimeline(sessionState),
    };
  }

  private generateDashboardDataSync(
    sessionState: DebugSessionState
  ): DashboardData {
    return {
      sessionOverview: this.generateSessionOverview(sessionState),
      performanceCharts: this.generatePerformanceCharts(sessionState),
      errorSummary: this.generateErrorSummary(sessionState),
      networkActivity: this.generateNetworkActivity(sessionState),
      memoryUsage: this.generateMemoryUsage(sessionState),
      testResults: this.generateTestResultSummary(sessionState),
      timeline: this.generateTimeline(sessionState),
    };
  }

  private generateSessionOverview(
    sessionState: DebugSessionState
  ): SessionOverview {
    const duration = sessionState.endTime
      ? sessionState.endTime.getTime() - sessionState.startTime.getTime()
      : Date.now() - sessionState.startTime.getTime();

    const totalEvents =
      sessionState.capturedData.consoleMessages.length +
      sessionState.capturedData.networkRequests.length +
      sessionState.capturedData.errorLogs.length +
      sessionState.testResults.length;

    return {
      sessionId: sessionState.sessionId,
      status: sessionState.status,
      duration,
      activeContexts: sessionState.activeContexts.filter(ctx => ctx.isActive)
        .length,
      totalEvents,
      lastUpdate: new Date(),
    };
  }

  private generateErrorSummary(sessionState: DebugSessionState): ErrorSummary {
    const errors = sessionState.capturedData.errorLogs;
    const errorsByLevel = errors.reduce(
      (acc, error) => {
        acc[error.level] = (acc[error.level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const errorTrends = this.generateErrorTrends(errors);

    return {
      totalErrors: errors.length,
      errorsByLevel,
      recentErrors: errors.slice(-10),
      errorTrends,
    };
  }

  private generateNetworkActivity(
    sessionState: DebugSessionState
  ): NetworkActivityData {
    const requests = sessionState.capturedData.networkRequests;
    const successfulRequests = requests.filter(
      req => req.status >= 200 && req.status < 400
    );
    const requestsByStatus = requests.reduce(
      (acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    const activityTimeline = requests.map(req => ({
      timestamp: req.timestamp,
      value: req.responseTime,
      context: req.context,
    }));

    return {
      totalRequests: requests.length,
      successRate:
        requests.length > 0
          ? (successfulRequests.length / requests.length) * 100
          : 0,
      averageResponseTime:
        requests.length > 0
          ? requests.reduce((sum, req) => sum + req.responseTime, 0) /
            requests.length
          : 0,
      requestsByStatus,
      recentRequests: requests.slice(-10),
      activityTimeline,
    };
  }

  private generateMemoryUsage(
    sessionState: DebugSessionState
  ): MemoryUsageData {
    const snapshots = sessionState.capturedData.memorySnapshots;
    const currentUsage =
      snapshots.length > 0 ? snapshots[snapshots.length - 1].usedJSHeapSize : 0;
    const peakUsage = Math.max(...snapshots.map(s => s.usedJSHeapSize));

    const trend = snapshots.map(snapshot => ({
      timestamp: snapshot.timestamp,
      value: snapshot.usedJSHeapSize / 1024 / 1024, // Convert to MB
      context: snapshot.context,
    }));

    const byContext = snapshots.reduce(
      (acc, snapshot) => {
        acc[snapshot.context] = Math.max(
          acc[snapshot.context] || 0,
          snapshot.usedJSHeapSize
        );
        return acc;
      },
      {} as Record<string, number>
    );

    const warnings: string[] = [];
    if (currentUsage > 50 * 1024 * 1024) {
      // 50MB
      warnings.push('High memory usage detected');
    }

    return {
      current: currentUsage / 1024 / 1024, // Convert to MB
      peak: peakUsage / 1024 / 1024, // Convert to MB
      trend,
      byContext,
      warnings,
    };
  }

  private generateTestResultSummary(
    sessionState: DebugSessionState
  ): TestResultSummary {
    const results = sessionState.testResults;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = results.length - passedTests;
    const averageExecutionTime =
      results.length > 0
        ? results.reduce((sum, r) => sum + r.executionTime, 0) / results.length
        : 0;

    return {
      totalTests: results.length,
      passedTests,
      failedTests,
      averageExecutionTime,
      recentResults: results.slice(-10),
      successRate:
        results.length > 0 ? (passedTests / results.length) * 100 : 0,
    };
  }

  private calculateContextActivity(
    sessionState: DebugSessionState
  ): Record<string, number> {
    const activity: Record<string, number> = {};

    sessionState.capturedData.consoleMessages.forEach(msg => {
      activity[msg.context] = (activity[msg.context] || 0) + 1;
    });

    sessionState.capturedData.networkRequests.forEach(req => {
      activity[req.context] = (activity[req.context] || 0) + 1;
    });

    return activity;
  }

  private generateErrorTrends(errors: ErrorLog[]): ChartDataPoint[] {
    // Group errors by hour
    const hourlyErrors: Record<string, number> = {};

    errors.forEach(error => {
      const hour = new Date(error.timestamp).toISOString().slice(0, 13);
      hourlyErrors[hour] = (hourlyErrors[hour] || 0) + 1;
    });

    return Object.entries(hourlyErrors).map(([hour, count]) => ({
      timestamp: new Date(hour + ':00:00.000Z'),
      value: count,
    }));
  }

  private isPerformanceWarning(metric: any): boolean {
    // Define performance warning thresholds
    const thresholds: Record<string, number> = {
      response_time: 1000, // 1 second
      memory_usage: 50 * 1024 * 1024, // 50MB
      cpu_usage: 80, // 80%
    };

    return metric.value > (thresholds[metric.name] || Infinity);
  }

  private startRealTimeUpdates(sessionState: DebugSessionState): void {
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateDashboard(sessionState);
      } catch (error) {
        console.error('Failed to update dashboard:', error);
      }
    }, this.config.refreshInterval);
  }

  private getDashboardCSS(): string {
    return `
      /* Dashboard CSS styles would go here */
      .dashboard { font-family: Arial, sans-serif; }
      .dashboard-header { background: #f5f5f5; padding: 1rem; }
      .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; padding: 1rem; }
      .dashboard-section { background: white; border: 1px solid #ddd; border-radius: 4px; padding: 1rem; }
      .status-active { color: green; }
      .status-completed { color: blue; }
      .status-failed { color: red; }
    `;
  }

  private getDashboardJS(): string {
    return `
      // Dashboard JavaScript would go here
      console.log('Debug Dashboard loaded');
    `;
  }

  private generateOverviewSection(overview: SessionOverview): string {
    return `
      <div class="dashboard-section overview">
        <h2>Session Overview</h2>
        <div class="overview-stats">
          <div class="stat">
            <label>Duration:</label>
            <span>${Math.round(overview.duration / 1000)}s</span>
          </div>
          <div class="stat">
            <label>Active Contexts:</label>
            <span>${overview.activeContexts}</span>
          </div>
          <div class="stat">
            <label>Total Events:</label>
            <span>${overview.totalEvents}</span>
          </div>
        </div>
      </div>
    `;
  }

  private generatePerformanceSection(charts: PerformanceChartData[]): string {
    return `
      <div class="dashboard-section performance">
        <h2>Performance Metrics</h2>
        ${charts
          .map(
            chart => `
          <div class="chart">
            <h3>${chart.name}</h3>
            <div class="chart-placeholder">Chart: ${chart.data.length} data points</div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  private generateErrorSection(errorSummary: ErrorSummary): string {
    return `
      <div class="dashboard-section errors">
        <h2>Error Summary</h2>
        <div class="error-stats">
          <div class="stat">
            <label>Total Errors:</label>
            <span>${errorSummary.totalErrors}</span>
          </div>
          <div class="error-levels">
            ${Object.entries(errorSummary.errorsByLevel)
              .map(
                ([level, count]) => `
              <div class="error-level">
                <span class="level-${level}">${level}:</span>
                <span>${count}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;
  }

  private generateNetworkSection(networkActivity: NetworkActivityData): string {
    return `
      <div class="dashboard-section network">
        <h2>Network Activity</h2>
        <div class="network-stats">
          <div class="stat">
            <label>Total Requests:</label>
            <span>${networkActivity.totalRequests}</span>
          </div>
          <div class="stat">
            <label>Success Rate:</label>
            <span>${networkActivity.successRate.toFixed(1)}%</span>
          </div>
          <div class="stat">
            <label>Avg Response Time:</label>
            <span>${networkActivity.averageResponseTime.toFixed(0)}ms</span>
          </div>
        </div>
      </div>
    `;
  }

  private generateMemorySection(memoryUsage: MemoryUsageData): string {
    return `
      <div class="dashboard-section memory">
        <h2>Memory Usage</h2>
        <div class="memory-stats">
          <div class="stat">
            <label>Current:</label>
            <span>${memoryUsage.current.toFixed(1)} MB</span>
          </div>
          <div class="stat">
            <label>Peak:</label>
            <span>${memoryUsage.peak.toFixed(1)} MB</span>
          </div>
          ${
            memoryUsage.warnings.length > 0
              ? `
            <div class="warnings">
              ${memoryUsage.warnings.map(warning => `<div class="warning">${warning}</div>`).join('')}
            </div>
          `
              : ''
          }
        </div>
      </div>
    `;
  }

  private generateTestSection(testResults: TestResultSummary): string {
    return `
      <div class="dashboard-section tests">
        <h2>Test Results</h2>
        <div class="test-stats">
          <div class="stat">
            <label>Total Tests:</label>
            <span>${testResults.totalTests}</span>
          </div>
          <div class="stat">
            <label>Success Rate:</label>
            <span>${testResults.successRate.toFixed(1)}%</span>
          </div>
          <div class="stat">
            <label>Avg Execution Time:</label>
            <span>${testResults.averageExecutionTime.toFixed(0)}ms</span>
          </div>
        </div>
      </div>
    `;
  }

  private generateTimelineSection(timeline: TimelineEvent[]): string {
    return `
      <div class="dashboard-section timeline">
        <h2>Timeline</h2>
        <div class="timeline-events">
          ${timeline
            .slice(0, 10)
            .map(
              event => `
            <div class="timeline-event severity-${event.severity}">
              <div class="event-time">${event.timestamp.toLocaleTimeString()}</div>
              <div class="event-title">${event.title}</div>
              <div class="event-description">${event.description}</div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  private convertToCSV(data: DashboardData): string {
    // Simple CSV conversion - could be enhanced
    const lines: string[] = [];
    lines.push('Type,Timestamp,Value,Context,Description');

    // Add performance data
    data.performanceCharts.forEach(chart => {
      chart.data.forEach(point => {
        lines.push(
          `Performance,${point.timestamp.toISOString()},${point.value},${point.context || ''},${chart.name}`
        );
      });
    });

    return lines.join('\n');
  }
}

// Export singleton instance
export const debugDashboard = new DebugDashboard();
