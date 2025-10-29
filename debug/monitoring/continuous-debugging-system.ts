/**
 * Continuous Debugging System
 * Main entry point for continuous debugging monitoring and automation
 */

import { ContinuousDebugMonitor } from './continuous-debug-monitor';
import { DebugAlertSystem } from './debug-alert-system';
import { DebugWorkflowIntegration } from './debug-workflow-integration';
import { AutomatedTestScenarios } from '../scenarios/automated-test-scenarios';
import { AutomatedReportGeneration } from '../reports/automated-report-generation';
import {
  MonitoringConfig,
  MonitoringAlert,
  DebugWorkflow,
} from '../types/debug-types';

export interface ContinuousDebuggingConfig {
  monitoring: Partial<MonitoringConfig>;
  enableWorkflows: boolean;
  enableAlerts: boolean;
  autoStart: boolean;
  reportingConfig: {
    generateDailyReports: boolean;
    generateIncidentReports: boolean;
    reportFormats: string[];
  };
}

export class ContinuousDebuggingSystem {
  private monitor: ContinuousDebugMonitor;
  private alertSystem: DebugAlertSystem;
  private workflowIntegration: DebugWorkflowIntegration;
  private testScenarios: AutomatedTestScenarios;
  private reportGeneration: AutomatedReportGeneration;
  private isInitialized = false;
  private config: ContinuousDebuggingConfig;

  constructor(config?: Partial<ContinuousDebuggingConfig>) {
    this.config = this.createDefaultConfig(config);

    // Initialize core components
    this.testScenarios = new AutomatedTestScenarios();
    this.reportGeneration = new AutomatedReportGeneration();
    this.alertSystem = new DebugAlertSystem();
    this.monitor = new ContinuousDebugMonitor(
      this.testScenarios,
      this.reportGeneration,
      this.config.monitoring
    );
    this.workflowIntegration = new DebugWorkflowIntegration(
      this.monitor,
      this.alertSystem,
      this.testScenarios,
      this.reportGeneration
    );
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(
    overrides?: Partial<ContinuousDebuggingConfig>
  ): ContinuousDebuggingConfig {
    const defaultConfig: ContinuousDebuggingConfig = {
      monitoring: {
        enabled: true,
        interval: 300000, // 5 minutes
        scenarios: ['Extension Loading Test'],
        alertThresholds: {
          failureRate: 0.3,
          executionTime: 30000,
          memoryUsage: 200,
        },
        notifications: {
          console: true,
        },
      },
      enableWorkflows: true,
      enableAlerts: true,
      autoStart: false,
      reportingConfig: {
        generateDailyReports: true,
        generateIncidentReports: true,
        reportFormats: ['json', 'markdown'],
      },
    };

    return { ...defaultConfig, ...overrides };
  }

  /**
   * Initialize the continuous debugging system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Continuous debugging system is already initialized');
      return;
    }

    console.log('Initializing continuous debugging system...');

    try {
      // Initialize test scenarios
      await this.testScenarios.initialize();

      // Setup integrations
      this.setupIntegrations();

      // Schedule workflows if enabled
      if (this.config.enableWorkflows) {
        this.workflowIntegration.scheduleWorkflows();
      }

      // Auto-start monitoring if configured
      if (this.config.autoStart) {
        await this.startMonitoring();
      }

      this.isInitialized = true;
      console.log('Continuous debugging system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize continuous debugging system:', error);
      throw error;
    }
  }

  /**
   * Setup integrations between components
   */
  private setupIntegrations(): void {
    // Connect alert system to monitoring
    this.monitor.addEventListener('monitoring_check_completed', event => {
      if (this.config.enableAlerts) {
        const alerts = this.alertSystem.processData(event.data);
        if (alerts.length > 0) {
          console.log(
            `Generated ${alerts.length} alerts from monitoring check`
          );
        }
      }
    });

    // Connect workflows to alerts
    if (this.config.enableWorkflows) {
      this.alertSystem.addEventListener('alert', (alert: MonitoringAlert) => {
        console.log(`Alert system triggered: ${alert.message}`);
      });
    }

    console.log('Setup component integrations');
  }

  /**
   * Start continuous monitoring
   */
  async startMonitoring(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('Starting continuous debugging monitoring...');
    await this.monitor.startMonitoring();
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    console.log('Stopping continuous debugging monitoring...');
    this.monitor.stopMonitoring();

    if (this.config.enableWorkflows) {
      this.workflowIntegration.stopScheduledWorkflows();
    }
  }

  /**
   * Execute immediate health check
   */
  async executeHealthCheck(): Promise<{
    testResults: any[];
    alerts: MonitoringAlert[];
    report?: any;
  }> {
    console.log('Executing immediate health check...');

    // Run critical scenarios
    const testResults = await this.testScenarios.executeQuickValidation();

    // Generate alerts based on results
    const alerts = this.config.enableAlerts
      ? this.alertSystem.processData({
          testResults,
          failureRate:
            testResults.filter(r => !r.passed).length / testResults.length,
          executionTime: Math.max(...testResults.map(r => r.executionTime)),
          memoryUsage: Math.max(
            ...testResults.map(r => r.metrics?.memoryUsage || 0)
          ),
        })
      : [];

    // Generate report if there are issues
    let report;
    if (alerts.some(a => a.severity === 'high' || a.severity === 'critical')) {
      const validationSummary =
        this.testScenarios.generateValidationSummary(testResults);
      report = await this.reportGeneration.generateReport(
        `health-check-${Date.now()}`,
        testResults,
        validationSummary,
        {
          formats: this.config.reportingConfig.reportFormats as any[],
          autoSave: true,
        }
      );
    }

    return { testResults, alerts, report };
  }

  /**
   * Execute comprehensive system check
   */
  async executeComprehensiveCheck(): Promise<{
    testResults: any[];
    alerts: MonitoringAlert[];
    report: any;
  }> {
    console.log('Executing comprehensive system check...');

    // Run full test suite
    const testResults = await this.testScenarios.executeComprehensiveTest();

    // Generate alerts
    const alerts = this.config.enableAlerts
      ? this.alertSystem.processData({
          testResults,
          failureRate:
            testResults.filter(r => !r.passed).length / testResults.length,
          executionTime: Math.max(...testResults.map(r => r.executionTime)),
          memoryUsage: Math.max(
            ...testResults.map(r => r.metrics?.memoryUsage || 0)
          ),
        })
      : [];

    // Always generate comprehensive report
    const validationSummary =
      this.testScenarios.generateValidationSummary(testResults);
    const report = await this.reportGeneration.generateReport(
      `comprehensive-check-${Date.now()}`,
      testResults,
      validationSummary,
      {
        formats: this.config.reportingConfig.reportFormats as any[],
        includeRecommendations: true,
        autoSave: true,
      }
    );

    return { testResults, alerts, report };
  }

  /**
   * Get system status
   */
  getSystemStatus(): {
    isInitialized: boolean;
    monitoring: any;
    alerts: {
      total: number;
      recent: MonitoringAlert[];
      statistics: any;
    };
    workflows: {
      total: number;
      executions: any;
      statistics: any;
    };
    lastHealthCheck?: Date;
  } {
    const monitoringStatus = this.monitor.getMonitoringStatus();
    const alertStatistics = this.alertSystem.getAlertStatistics();
    const workflowStatistics =
      this.workflowIntegration.getExecutionStatistics();

    return {
      isInitialized: this.isInitialized,
      monitoring: monitoringStatus,
      alerts: {
        total: alertStatistics.totalAlerts,
        recent: this.alertSystem.getRecentAlerts(5),
        statistics: alertStatistics,
      },
      workflows: {
        total: Object.keys(workflowStatistics.executionsByWorkflow).length,
        executions: workflowStatistics.totalExecutions,
        statistics: workflowStatistics,
      },
      lastHealthCheck: monitoringStatus.lastCheckTime,
    };
  }

  /**
   * Update system configuration
   */
  updateConfiguration(newConfig: Partial<ContinuousDebuggingConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    console.log('Updated continuous debugging system configuration');

    // Update monitoring configuration
    if (newConfig.monitoring) {
      this.monitor.updateConfiguration(newConfig.monitoring);
    }

    // Restart workflows if workflow settings changed
    if (newConfig.enableWorkflows !== oldConfig.enableWorkflows) {
      if (newConfig.enableWorkflows) {
        this.workflowIntegration.scheduleWorkflows();
      } else {
        this.workflowIntegration.stopScheduledWorkflows();
      }
    }
  }

  /**
   * Add custom workflow
   */
  addCustomWorkflow(workflow: DebugWorkflow): void {
    this.workflowIntegration.addWorkflow(workflow);
    console.log(`Added custom workflow: ${workflow.name}`);
  }

  /**
   * Execute specific workflow
   */
  async executeWorkflow(workflowId: string, triggerData?: any): Promise<any> {
    return this.workflowIntegration.executeWorkflow(workflowId, triggerData);
  }

  /**
   * Get monitoring history
   */
  getMonitoringHistory(limit?: number): any[] {
    return this.monitor.getMonitoringHistory(limit);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): MonitoringAlert[] {
    return this.alertSystem.getAllAlerts();
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alertSystem.clearAlerts();
  }

  /**
   * Generate system health report
   */
  async generateSystemHealthReport(): Promise<any> {
    const systemStatus = this.getSystemStatus();
    const monitoringHistory = this.getMonitoringHistory(10);
    const recentAlerts = this.alertSystem.getRecentAlerts(20);

    // Create synthetic test results for system health
    const healthMetrics = {
      systemUptime: systemStatus.monitoring.isMonitoring,
      totalAlerts: systemStatus.alerts.total,
      recentAlertRate: recentAlerts.length,
      monitoringChecks: monitoringHistory.length,
      workflowExecutions: systemStatus.workflows.executions,
    };

    const validationSummary = {
      totalTests: 1,
      passedTests: systemStatus.monitoring.isMonitoring ? 1 : 0,
      validTests: systemStatus.monitoring.isMonitoring ? 1 : 0,
      averageScore: systemStatus.monitoring.isMonitoring ? 1.0 : 0.0,
      overallViolations: recentAlerts.map(a => a.message),
      overallRecommendations: [],
    };

    return this.reportGeneration.generateReport(
      `system-health-${Date.now()}`,
      [], // No specific test results
      validationSummary,
      {
        formats: ['json', 'html'],
        includeRecommendations: true,
        autoSave: true,
      }
    );
  }

  /**
   * Export system configuration and data
   */
  exportSystemData(): {
    config: ContinuousDebuggingConfig;
    monitoring: any;
    alerts: any;
    workflows: any;
    reports: any;
  } {
    return {
      config: this.config,
      monitoring: this.monitor.exportMonitoringData(),
      alerts: this.alertSystem.exportConfiguration(),
      workflows: this.workflowIntegration.exportConfiguration(),
      reports: this.reportGeneration.exportAllReports(),
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down continuous debugging system...');

    this.stopMonitoring();
    await this.testScenarios.cleanup();
    this.reportGeneration.clearReportHistory();

    this.isInitialized = false;
    console.log('Continuous debugging system shutdown complete');
  }

  /**
   * Get individual components for advanced usage
   */
  getComponents(): {
    monitor: ContinuousDebugMonitor;
    alertSystem: DebugAlertSystem;
    workflowIntegration: DebugWorkflowIntegration;
    testScenarios: AutomatedTestScenarios;
    reportGeneration: AutomatedReportGeneration;
  } {
    return {
      monitor: this.monitor,
      alertSystem: this.alertSystem,
      workflowIntegration: this.workflowIntegration,
      testScenarios: this.testScenarios,
      reportGeneration: this.reportGeneration,
    };
  }
}

// Create and export singleton instance
export const continuousDebuggingSystem = new ContinuousDebuggingSystem();

// Convenience functions for common operations
export async function startContinuousDebugging(
  config?: Partial<ContinuousDebuggingConfig>
): Promise<void> {
  if (config) {
    continuousDebuggingSystem.updateConfiguration(config);
  }
  await continuousDebuggingSystem.initialize();
  await continuousDebuggingSystem.startMonitoring();
}

export function stopContinuousDebugging(): void {
  continuousDebuggingSystem.stopMonitoring();
}

export async function executeQuickHealthCheck(): Promise<any> {
  return continuousDebuggingSystem.executeHealthCheck();
}

export async function executeFullSystemCheck(): Promise<any> {
  return continuousDebuggingSystem.executeComprehensiveCheck();
}

export function getSystemStatus(): any {
  return continuousDebuggingSystem.getSystemStatus();
}
