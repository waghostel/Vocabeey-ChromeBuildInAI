/**
 * Debug Workflow Integration
 * Integrates debugging workflows with continuous monitoring
 */

import {
  DebugWorkflow,
  WorkflowStep,
  WorkflowTrigger,
  WorkflowSchedule,
  TestResult,
  DebugReport,
  MonitoringAlert,
} from '../types/debug-types';
import { ContinuousDebugMonitor } from './continuous-debug-monitor';
import { DebugAlertSystem } from './debug-alert-system';
import { AutomatedTestScenarios } from '../scenarios/automated-test-scenarios';
import { AutomatedReportGeneration } from '../reports/automated-report-generation';

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  steps: Array<{
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime?: Date;
    endTime?: Date;
    result?: any;
    error?: string;
  }>;
  triggerData?: any;
  results?: any;
}

export class DebugWorkflowIntegration {
  private workflows: Map<string, DebugWorkflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private scheduledWorkflows: Map<string, NodeJS.Timeout> = new Map();
  private monitor: ContinuousDebugMonitor;
  private alertSystem: DebugAlertSystem;
  private testScenarios: AutomatedTestScenarios;
  private reportGeneration: AutomatedReportGeneration;

  constructor(
    monitor: ContinuousDebugMonitor,
    alertSystem: DebugAlertSystem,
    testScenarios: AutomatedTestScenarios,
    reportGeneration: AutomatedReportGeneration
  ) {
    this.monitor = monitor;
    this.alertSystem = alertSystem;
    this.testScenarios = testScenarios;
    this.reportGeneration = reportGeneration;

    this.initializeDefaultWorkflows();
    this.setupEventListeners();
  }

  /**
   * Initialize default debugging workflows
   */
  private initializeDefaultWorkflows(): void {
    const defaultWorkflows: DebugWorkflow[] = [
      {
        id: 'daily-health-check',
        name: 'Daily Health Check',
        description:
          'Comprehensive daily debugging check with report generation',
        enabled: true,
        schedule: {
          type: 'cron',
          expression: '0 9 * * *', // 9 AM daily
        },
        triggers: [
          {
            type: 'schedule',
            config: { schedule: 'daily' },
          },
        ],
        steps: [
          {
            id: 'run-critical-scenarios',
            name: 'Run Critical Scenarios',
            type: 'scenario',
            config: {
              scenarios: ['Extension Loading Test'],
              timeout: 30000,
            },
          },
          {
            id: 'run-comprehensive-test',
            name: 'Run Comprehensive Test Suite',
            type: 'scenario',
            config: {
              categories: ['Extension Lifecycle', 'Content Processing'],
              timeout: 120000,
            },
            dependencies: ['run-critical-scenarios'],
          },
          {
            id: 'generate-daily-report',
            name: 'Generate Daily Report',
            type: 'report',
            config: {
              formats: ['html', 'json'],
              includeRecommendations: true,
            },
            dependencies: ['run-comprehensive-test'],
          },
          {
            id: 'send-summary-notification',
            name: 'Send Summary Notification',
            type: 'notification',
            config: {
              channels: ['console'],
              template: 'daily-summary',
            },
            dependencies: ['generate-daily-report'],
          },
        ],
      },

      {
        id: 'alert-response-workflow',
        name: 'Alert Response Workflow',
        description: 'Automated response to critical alerts',
        enabled: true,
        triggers: [
          {
            type: 'event',
            config: {
              eventType: 'alert',
              condition: 'severity === "critical"',
            },
          },
        ],
        steps: [
          {
            id: 'investigate-alert',
            name: 'Investigate Alert',
            type: 'scenario',
            config: {
              scenarios: ['Extension Loading Test', 'Content Extraction Test'],
              timeout: 60000,
            },
          },
          {
            id: 'generate-incident-report',
            name: 'Generate Incident Report',
            type: 'report',
            config: {
              formats: ['json', 'markdown'],
              includeRecommendations: true,
              minSeverityLevel: 'high',
            },
            dependencies: ['investigate-alert'],
          },
          {
            id: 'notify-incident',
            name: 'Notify Incident',
            type: 'notification',
            config: {
              channels: ['console'],
              template: 'incident-alert',
              immediate: true,
            },
            dependencies: ['generate-incident-report'],
          },
        ],
      },

      {
        id: 'performance-monitoring',
        name: 'Performance Monitoring Workflow',
        description: 'Regular performance monitoring and optimization',
        enabled: true,
        schedule: {
          type: 'interval',
          expression: '3600000', // Every hour
        },
        triggers: [
          {
            type: 'schedule',
            config: { interval: 3600000 },
          },
        ],
        steps: [
          {
            id: 'run-performance-tests',
            name: 'Run Performance Tests',
            type: 'scenario',
            config: {
              categories: ['Performance'],
              timeout: 180000,
            },
          },
          {
            id: 'analyze-performance',
            name: 'Analyze Performance Metrics',
            type: 'custom',
            config: {
              handler: 'analyzePerformanceMetrics',
            },
            dependencies: ['run-performance-tests'],
          },
          {
            id: 'generate-performance-report',
            name: 'Generate Performance Report',
            type: 'report',
            config: {
              type: 'performance',
              formats: ['json'],
            },
            dependencies: ['analyze-performance'],
            timeout: 30000,
          },
        ],
      },

      {
        id: 'failure-recovery',
        name: 'Failure Recovery Workflow',
        description: 'Automated recovery from test failures',
        enabled: true,
        triggers: [
          {
            type: 'condition',
            config: {
              condition: 'failureRate > 0.5',
            },
          },
        ],
        steps: [
          {
            id: 'diagnose-failures',
            name: 'Diagnose Failures',
            type: 'scenario',
            config: {
              scenarios: ['Extension Loading Test'],
              retries: 3,
            },
          },
          {
            id: 'attempt-recovery',
            name: 'Attempt Recovery',
            type: 'custom',
            config: {
              handler: 'attemptRecovery',
            },
            dependencies: ['diagnose-failures'],
          },
          {
            id: 'validate-recovery',
            name: 'Validate Recovery',
            type: 'scenario',
            config: {
              scenarios: ['Extension Loading Test', 'Content Extraction Test'],
            },
            dependencies: ['attempt-recovery'],
          },
          {
            id: 'report-recovery-status',
            name: 'Report Recovery Status',
            type: 'notification',
            config: {
              channels: ['console'],
              template: 'recovery-status',
            },
            dependencies: ['validate-recovery'],
          },
        ],
      },
    ];

    defaultWorkflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });

    console.log(
      `Initialized ${defaultWorkflows.length} default debugging workflows`
    );
  }

  /**
   * Setup event listeners for workflow triggers
   */
  private setupEventListeners(): void {
    // Listen for monitoring alerts
    this.alertSystem.addEventListener('alert', (alert: MonitoringAlert) => {
      this.handleAlertTrigger(alert);
    });

    // Listen for monitoring events
    this.monitor.addEventListener('monitoring_check_completed', event => {
      this.handleMonitoringEvent(event);
    });

    console.log('Setup workflow event listeners');
  }

  /**
   * Handle alert-triggered workflows
   */
  private handleAlertTrigger(alert: MonitoringAlert): void {
    for (const workflow of this.workflows.values()) {
      if (!workflow.enabled) continue;

      const alertTriggers = workflow.triggers.filter(t => t.type === 'event');
      for (const trigger of alertTriggers) {
        if (this.evaluateAlertTrigger(trigger, alert)) {
          console.log(
            `Triggering workflow ${workflow.name} due to alert: ${alert.message}`
          );
          this.executeWorkflow(workflow.id, { alert });
        }
      }
    }
  }

  /**
   * Handle monitoring event-triggered workflows
   */
  private handleMonitoringEvent(event: any): void {
    for (const workflow of this.workflows.values()) {
      if (!workflow.enabled) continue;

      const conditionTriggers = workflow.triggers.filter(
        t => t.type === 'condition'
      );
      for (const trigger of conditionTriggers) {
        if (this.evaluateConditionTrigger(trigger, event.data)) {
          console.log(`Triggering workflow ${workflow.name} due to condition`);
          this.executeWorkflow(workflow.id, event.data);
        }
      }
    }
  }

  /**
   * Evaluate alert trigger conditions
   */
  private evaluateAlertTrigger(
    trigger: WorkflowTrigger,
    alert: MonitoringAlert
  ): boolean {
    try {
      if (trigger.config.condition) {
        // Simple condition evaluation (in production, use a proper expression evaluator)
        const condition = trigger.config.condition.replace(
          'severity',
          `"${alert.severity}"`
        );
        return eval(condition);
      }
      return true;
    } catch (error) {
      console.error('Error evaluating alert trigger:', error);
      return false;
    }
  }

  /**
   * Evaluate condition trigger
   */
  private evaluateConditionTrigger(
    trigger: WorkflowTrigger,
    data: any
  ): boolean {
    try {
      if (trigger.config.condition) {
        // Replace variables in condition with actual values
        let condition = trigger.config.condition;
        Object.keys(data).forEach(key => {
          condition = condition.replace(new RegExp(key, 'g'), data[key]);
        });
        return eval(condition);
      }
      return false;
    } catch (error) {
      console.error('Error evaluating condition trigger:', error);
      return false;
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    triggerData?: any
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const execution: WorkflowExecution = {
      id: this.generateExecutionId(),
      workflowId,
      startTime: new Date(),
      status: 'running',
      steps: workflow.steps.map(step => ({
        stepId: step.id,
        status: 'pending',
      })),
      triggerData,
    };

    this.executions.set(execution.id, execution);
    console.log(
      `Starting workflow execution: ${execution.id} for workflow: ${workflow.name}`
    );

    try {
      await this.executeWorkflowSteps(workflow, execution);
      execution.status = 'completed';
      execution.endTime = new Date();
      console.log(`Completed workflow execution: ${execution.id}`);
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      console.error(`Failed workflow execution: ${execution.id}`, error);
    }

    return execution;
  }

  /**
   * Execute workflow steps
   */
  private async executeWorkflowSteps(
    workflow: DebugWorkflow,
    execution: WorkflowExecution
  ): Promise<void> {
    const completedSteps = new Set<string>();

    for (const step of workflow.steps) {
      // Check dependencies
      if (step.dependencies) {
        const unmetDependencies = step.dependencies.filter(
          dep => !completedSteps.has(dep)
        );
        if (unmetDependencies.length > 0) {
          console.log(
            `Skipping step ${step.id} due to unmet dependencies: ${unmetDependencies.join(', ')}`
          );
          const stepExecution = execution.steps.find(
            s => s.stepId === step.id
          )!;
          stepExecution.status = 'skipped';
          continue;
        }
      }

      const stepExecution = execution.steps.find(s => s.stepId === step.id)!;
      stepExecution.status = 'running';
      stepExecution.startTime = new Date();

      try {
        console.log(`Executing step: ${step.name}`);
        const result = await this.executeWorkflowStep(step, execution);

        stepExecution.status = 'completed';
        stepExecution.endTime = new Date();
        stepExecution.result = result;
        completedSteps.add(step.id);

        console.log(`Completed step: ${step.name}`);
      } catch (error) {
        stepExecution.status = 'failed';
        stepExecution.endTime = new Date();
        stepExecution.error =
          error instanceof Error ? error.message : String(error);

        console.error(`Failed step: ${step.name}`, error);

        // Stop execution on step failure (could be configurable)
        throw error;
      }
    }
  }

  /**
   * Execute individual workflow step
   */
  private async executeWorkflowStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<any> {
    switch (step.type) {
      case 'scenario':
        return this.executeScenarioStep(step, execution);
      case 'validation':
        return this.executeValidationStep(step, execution);
      case 'report':
        return this.executeReportStep(step, execution);
      case 'notification':
        return this.executeNotificationStep(step, execution);
      case 'custom':
        return this.executeCustomStep(step, execution);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute scenario step
   */
  private async executeScenarioStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<TestResult[]> {
    const config = step.config;

    if (config.scenarios) {
      return this.testScenarios.executeCustom({
        scenarios: config.scenarios,
        timeout: config.timeout || step.timeout,
        retries: config.retries,
      });
    } else if (config.categories) {
      const results: TestResult[] = [];
      for (const category of config.categories) {
        const categoryResults =
          await this.testScenarios.executeByCategory(category);
        results.push(...categoryResults);
      }
      return results;
    } else {
      throw new Error('Scenario step must specify scenarios or categories');
    }
  }

  /**
   * Execute validation step
   */
  private async executeValidationStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<any> {
    // Get test results from previous steps
    const testResults = this.getTestResultsFromExecution(execution);

    if (testResults.length === 0) {
      throw new Error('No test results available for validation');
    }

    return this.testScenarios.generateValidationSummary(testResults);
  }

  /**
   * Execute report step
   */
  private async executeReportStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<DebugReport> {
    const config = step.config;
    const testResults = this.getTestResultsFromExecution(execution);
    const validationSummary =
      this.testScenarios.generateValidationSummary(testResults);

    if (config.type === 'performance') {
      return this.reportGeneration.generatePerformanceReport(
        execution.id,
        testResults
      );
    } else {
      return this.reportGeneration.generateReport(
        execution.id,
        testResults,
        validationSummary,
        {
          formats: config.formats,
          includeRecommendations: config.includeRecommendations,
          minSeverityLevel: config.minSeverityLevel,
          autoSave: true,
        }
      );
    }
  }

  /**
   * Execute notification step
   */
  private async executeNotificationStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<void> {
    const config = step.config;
    const message = this.generateNotificationMessage(
      config.template,
      execution
    );

    console.log(`[NOTIFICATION] ${message}`);

    // In a real implementation, this would send notifications through configured channels
    if (config.channels) {
      config.channels.forEach((channel: string) => {
        console.log(`Sending notification to channel: ${channel}`);
      });
    }
  }

  /**
   * Execute custom step
   */
  private async executeCustomStep(
    step: WorkflowStep,
    execution: WorkflowExecution
  ): Promise<any> {
    const config = step.config;

    switch (config.handler) {
      case 'analyzePerformanceMetrics':
        return this.analyzePerformanceMetrics(execution);
      case 'attemptRecovery':
        return this.attemptRecovery(execution);
      default:
        throw new Error(`Unknown custom handler: ${config.handler}`);
    }
  }

  /**
   * Analyze performance metrics (custom handler)
   */
  private async analyzePerformanceMetrics(
    execution: WorkflowExecution
  ): Promise<any> {
    const testResults = this.getTestResultsFromExecution(execution);

    const performanceMetrics = {
      averageExecutionTime:
        testResults.reduce((sum, r) => sum + r.executionTime, 0) /
        testResults.length,
      maxExecutionTime: Math.max(...testResults.map(r => r.executionTime)),
      memoryUsage: testResults
        .map(r => r.metrics?.memoryUsage || 0)
        .filter(m => m > 0),
      failureRate:
        testResults.filter(r => !r.passed).length / testResults.length,
    };

    console.log('Performance analysis results:', performanceMetrics);
    return performanceMetrics;
  }

  /**
   * Attempt recovery (custom handler)
   */
  private async attemptRecovery(execution: WorkflowExecution): Promise<any> {
    console.log('Attempting system recovery...');

    // Simulate recovery actions
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      recoveryAttempted: true,
      recoveryActions: [
        'Cleared cache',
        'Restarted services',
        'Reset configuration',
      ],
      timestamp: new Date(),
    };
  }

  /**
   * Get test results from workflow execution
   */
  private getTestResultsFromExecution(
    execution: WorkflowExecution
  ): TestResult[] {
    const testResults: TestResult[] = [];

    execution.steps.forEach(step => {
      if (step.result && Array.isArray(step.result)) {
        testResults.push(...step.result);
      }
    });

    return testResults;
  }

  /**
   * Generate notification message
   */
  private generateNotificationMessage(
    template: string,
    execution: WorkflowExecution
  ): string {
    const workflow = this.workflows.get(execution.workflowId)!;
    const testResults = this.getTestResultsFromExecution(execution);

    switch (template) {
      case 'daily-summary':
        const passed = testResults.filter(r => r.passed).length;
        return `Daily Health Check: ${passed}/${testResults.length} scenarios passed`;

      case 'incident-alert':
        return `INCIDENT: Critical alert triggered workflow ${workflow.name}`;

      case 'recovery-status':
        const recoveryStep = execution.steps.find(
          s => s.stepId === 'validate-recovery'
        );
        const recoverySuccess = recoveryStep?.status === 'completed';
        return `Recovery ${recoverySuccess ? 'successful' : 'failed'} for workflow ${workflow.name}`;

      default:
        return `Workflow ${workflow.name} completed with status: ${execution.status}`;
    }
  }

  /**
   * Schedule workflows with cron-like scheduling
   */
  scheduleWorkflows(): void {
    for (const workflow of this.workflows.values()) {
      if (!workflow.enabled || !workflow.schedule) continue;

      if (workflow.schedule.type === 'interval') {
        const interval = parseInt(workflow.schedule.expression);
        const timeout = setInterval(() => {
          this.executeWorkflow(workflow.id);
        }, interval);

        this.scheduledWorkflows.set(workflow.id, timeout);
        console.log(
          `Scheduled workflow ${workflow.name} with interval ${interval}ms`
        );
      }
      // Cron scheduling would require a cron library in a real implementation
    }
  }

  /**
   * Stop scheduled workflows
   */
  stopScheduledWorkflows(): void {
    for (const [workflowId, timeout] of this.scheduledWorkflows) {
      clearInterval(timeout);
    }
    this.scheduledWorkflows.clear();
    console.log('Stopped all scheduled workflows');
  }

  /**
   * Add custom workflow
   */
  addWorkflow(workflow: DebugWorkflow): void {
    this.workflows.set(workflow.id, workflow);
    console.log(`Added custom workflow: ${workflow.name}`);
  }

  /**
   * Remove workflow
   */
  removeWorkflow(workflowId: string): boolean {
    const removed = this.workflows.delete(workflowId);
    if (removed) {
      const timeout = this.scheduledWorkflows.get(workflowId);
      if (timeout) {
        clearInterval(timeout);
        this.scheduledWorkflows.delete(workflowId);
      }
      console.log(`Removed workflow: ${workflowId}`);
    }
    return removed;
  }

  /**
   * Get workflow executions
   */
  getExecutions(workflowId?: string): WorkflowExecution[] {
    const executions = Array.from(this.executions.values());
    return workflowId
      ? executions.filter(e => e.workflowId === workflowId)
      : executions;
  }

  /**
   * Get workflow execution statistics
   */
  getExecutionStatistics(): {
    totalExecutions: number;
    executionsByStatus: Record<string, number>;
    executionsByWorkflow: Record<string, number>;
    averageExecutionTime: number;
  } {
    const executions = Array.from(this.executions.values());
    const totalExecutions = executions.length;

    const executionsByStatus: Record<string, number> = {};
    const executionsByWorkflow: Record<string, number> = {};
    let totalExecutionTime = 0;

    executions.forEach(execution => {
      executionsByStatus[execution.status] =
        (executionsByStatus[execution.status] || 0) + 1;
      executionsByWorkflow[execution.workflowId] =
        (executionsByWorkflow[execution.workflowId] || 0) + 1;

      if (execution.endTime) {
        totalExecutionTime +=
          execution.endTime.getTime() - execution.startTime.getTime();
      }
    });

    const averageExecutionTime =
      totalExecutions > 0 ? totalExecutionTime / totalExecutions : 0;

    return {
      totalExecutions,
      executionsByStatus,
      executionsByWorkflow,
      averageExecutionTime,
    };
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export workflow configuration
   */
  exportConfiguration(): {
    workflows: DebugWorkflow[];
    executions: WorkflowExecution[];
    statistics: any;
  } {
    return {
      workflows: Array.from(this.workflows.values()),
      executions: Array.from(this.executions.values()),
      statistics: this.getExecutionStatistics(),
    };
  }
}
