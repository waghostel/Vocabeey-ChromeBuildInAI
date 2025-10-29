/**
 * Real Debug Workflow Integration
 * Integrates real-time debugging workflows with development process
 */

import {
  RealContinuousDebugMonitor,
  RealTimeAlert,
  LiveExtensionMetrics,
} from './real-continuous-debug-monitor';
import { RealDebugAlertSystem } from './real-debug-alert-system';
import { MCPConnectionManager } from '../utils/mcp-connection-manager';
import { RealTestScenarioExecutor } from '../scenarios/real-test-scenario-executor';
import { RealDebugDataAggregator } from '../reports/real-debug-data-aggregator';

export interface DevelopmentWorkflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  schedule?: WorkflowSchedule;
  conditions?: WorkflowCondition[];
  notifications: WorkflowNotification[];
  autoExecution: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface WorkflowTrigger {
  type:
    | 'alert'
    | 'metric_threshold'
    | 'time_based'
    | 'manual'
    | 'git_event'
    | 'build_event';
  config: {
    alertSeverity?: string[];
    metricPath?: string;
    threshold?: number;
    schedule?: string;
    gitBranch?: string;
    buildStatus?: string;
    customCondition?: string;
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'test' | 'analysis' | 'report' | 'notification' | 'recovery' | 'custom';
  config: any;
  dependencies?: string[];
  timeout?: number;
  retries?: number;
  continueOnFailure?: boolean;
}

export interface WorkflowSchedule {
  type: 'cron' | 'interval' | 'once';
  expression: string;
  timezone?: string;
}

export interface WorkflowCondition {
  type: 'metric' | 'alert' | 'time' | 'custom';
  condition: string;
  required: boolean;
}

export interface WorkflowNotification {
  type: 'console' | 'email' | 'slack' | 'webhook' | 'dashboard';
  config: any;
  events: string[]; // 'start', 'complete', 'error', 'step_complete'
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  trigger: string;
  steps: WorkflowStepExecution[];
  results: any;
  metrics: {
    duration: number;
    stepsCompleted: number;
    stepsTotal: number;
    successRate: number;
  };
  logs: WorkflowLog[];
}

export interface WorkflowStepExecution {
  stepId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  retryCount: number;
}

export interface WorkflowLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: any;
}

export interface DevelopmentIntegration {
  gitIntegration: {
    enabled: boolean;
    repository: string;
    branches: string[];
    webhookUrl?: string;
  };
  buildIntegration: {
    enabled: boolean;
    buildTool: string;
    buildScript: string;
    testScript: string;
  };
  cicdIntegration: {
    enabled: boolean;
    platform: string;
    pipelineId: string;
    webhookUrl?: string;
  };
  ideIntegration: {
    enabled: boolean;
    ide: string;
    extensionId?: string;
    statusBarUpdates: boolean;
  };
}

export class RealDebugWorkflowIntegration {
  private monitor?: RealContinuousDebugMonitor;
  private alertSystem?: RealDebugAlertSystem;
  private testExecutor: RealTestScenarioExecutor;

  private workflows: Map<string, DevelopmentWorkflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private scheduledWorkflows: Map<string, NodeJS.Timeout> = new Map();
  private developmentIntegration: DevelopmentIntegration;

  private isIntegrationActive = false;
  private workflowQueue: Array<{
    workflowId: string;
    trigger: string;
    data?: any;
  }> = [];
  private executionHistory: WorkflowExecution[] = [];

  constructor(mcpConnectionManager: MCPConnectionManager) {
    this.testExecutor = new RealTestScenarioExecutor(mcpConnectionManager);

    this.developmentIntegration = this.createDefaultIntegration();
    this.initializeDefaultWorkflows();
    this.setupEventListeners();
  }

  /**
   * Set monitor and alert system (optional)
   */
  setMonitorAndAlertSystem(
    monitor: RealContinuousDebugMonitor,
    alertSystem: RealDebugAlertSystem
  ): void {
    this.monitor = monitor;
    this.alertSystem = alertSystem;
  }

  /**
   * Create default development integration configuration
   */
  private createDefaultIntegration(): DevelopmentIntegration {
    return {
      gitIntegration: {
        enabled: false,
        repository: '',
        branches: ['main', 'develop'],
      },
      buildIntegration: {
        enabled: true,
        buildTool: 'npm',
        buildScript: 'npm run build',
        testScript: 'npm test',
      },
      cicdIntegration: {
        enabled: false,
        platform: '',
        pipelineId: '',
      },
      ideIntegration: {
        enabled: true,
        ide: 'vscode',
        statusBarUpdates: true,
      },
    };
  }

  /**
   * Initialize default development workflows
   */
  private initializeDefaultWorkflows(): void {
    const defaultWorkflows: DevelopmentWorkflow[] = [
      {
        id: 'pre-commit-validation',
        name: 'Pre-commit Validation',
        description: 'Validates extension health before code commits',
        enabled: true,
        triggers: [
          {
            type: 'git_event',
            config: {
              gitBranch: 'main',
              customCondition: 'pre-commit',
            },
          },
        ],
        steps: [
          {
            id: 'health-check',
            name: 'Extension Health Check',
            type: 'test',
            config: {
              scenarios: ['Extension Loading Test', 'Content Extraction Test'],
              timeout: 30000,
            },
          },
          {
            id: 'performance-validation',
            name: 'Performance Validation',
            type: 'analysis',
            config: {
              thresholds: {
                memoryUsage: 100,
                responseTime: 2000,
              },
            },
            dependencies: ['health-check'],
          },
          {
            id: 'commit-report',
            name: 'Generate Commit Report',
            type: 'report',
            config: {
              format: 'summary',
              includeMetrics: true,
            },
            dependencies: ['performance-validation'],
          },
        ],
        notifications: [
          {
            type: 'console',
            config: {},
            events: ['complete', 'error'],
          },
        ],
        autoExecution: true,
        priority: 'high',
      },

      {
        id: 'build-validation',
        name: 'Build Validation',
        description: 'Validates extension after successful build',
        enabled: true,
        triggers: [
          {
            type: 'build_event',
            config: {
              buildStatus: 'success',
            },
          },
        ],
        steps: [
          {
            id: 'post-build-test',
            name: 'Post-build Testing',
            type: 'test',
            config: {
              scenarios: [
                'Extension Loading Test',
                'Service Worker Communication Test',
              ],
              timeout: 60000,
            },
          },
          {
            id: 'integration-test',
            name: 'Integration Testing',
            type: 'test',
            config: {
              scenarios: ['Cross-component Integration Test'],
              timeout: 120000,
            },
            dependencies: ['post-build-test'],
          },
          {
            id: 'build-report',
            name: 'Generate Build Report',
            type: 'report',
            config: {
              format: 'detailed',
              includeRecommendations: true,
            },
            dependencies: ['integration-test'],
          },
        ],
        notifications: [
          {
            type: 'console',
            config: {},
            events: ['complete', 'error'],
          },
          {
            type: 'dashboard',
            config: {},
            events: ['complete'],
          },
        ],
        autoExecution: true,
        priority: 'medium',
      },

      {
        id: 'critical-alert-response',
        name: 'Critical Alert Response',
        description: 'Automated response to critical alerts during development',
        enabled: true,
        triggers: [
          {
            type: 'alert',
            config: {
              alertSeverity: ['critical'],
            },
          },
        ],
        steps: [
          {
            id: 'immediate-diagnosis',
            name: 'Immediate Diagnosis',
            type: 'analysis',
            config: {
              analysisType: 'critical-issue',
              includeContexts: ['all'],
            },
          },
          {
            id: 'emergency-recovery',
            name: 'Emergency Recovery',
            type: 'recovery',
            config: {
              actions: ['restart-contexts', 'clear-caches', 'reset-state'],
            },
            dependencies: ['immediate-diagnosis'],
          },
          {
            id: 'incident-report',
            name: 'Generate Incident Report',
            type: 'report',
            config: {
              format: 'incident',
              priority: 'urgent',
              includeRecoveryActions: true,
            },
            dependencies: ['emergency-recovery'],
          },
          {
            id: 'developer-notification',
            name: 'Notify Developer',
            type: 'notification',
            config: {
              channels: ['console', 'dashboard'],
              urgency: 'high',
            },
            dependencies: ['incident-report'],
          },
        ],
        notifications: [
          {
            type: 'console',
            config: { immediate: true },
            events: ['start', 'complete', 'error'],
          },
        ],
        autoExecution: true,
        priority: 'critical',
      },

      {
        id: 'performance-monitoring',
        name: 'Continuous Performance Monitoring',
        description: 'Monitors performance metrics during development',
        enabled: true,
        triggers: [
          {
            type: 'time_based',
            config: {
              schedule: '*/15 * * * *', // Every 15 minutes
            },
          },
        ],
        schedule: {
          type: 'cron',
          expression: '*/15 * * * *',
        },
        steps: [
          {
            id: 'performance-analysis',
            name: 'Performance Analysis',
            type: 'analysis',
            config: {
              metrics: ['memory', 'response-time', 'error-rate'],
              timeWindow: 900000, // 15 minutes
            },
          },
          {
            id: 'trend-analysis',
            name: 'Trend Analysis',
            type: 'analysis',
            config: {
              analysisType: 'trend',
              lookbackPeriod: 3600000, // 1 hour
            },
            dependencies: ['performance-analysis'],
          },
          {
            id: 'performance-report',
            name: 'Performance Report',
            type: 'report',
            config: {
              format: 'performance',
              includeCharts: true,
            },
            dependencies: ['trend-analysis'],
            continueOnFailure: true,
          },
        ],
        conditions: [
          {
            type: 'metric',
            condition: 'monitor.isMonitoring === true',
            required: true,
          },
        ],
        notifications: [
          {
            type: 'dashboard',
            config: {},
            events: ['complete'],
          },
        ],
        autoExecution: true,
        priority: 'low',
      },

      {
        id: 'development-session-summary',
        name: 'Development Session Summary',
        description: 'Generates summary at end of development session',
        enabled: true,
        triggers: [
          {
            type: 'manual',
            config: {},
          },
        ],
        steps: [
          {
            id: 'session-analysis',
            name: 'Session Analysis',
            type: 'analysis',
            config: {
              analysisType: 'session-summary',
              includeAllMetrics: true,
            },
          },
          {
            id: 'recommendations',
            name: 'Generate Recommendations',
            type: 'analysis',
            config: {
              analysisType: 'recommendations',
              basedOnSession: true,
            },
            dependencies: ['session-analysis'],
          },
          {
            id: 'session-report',
            name: 'Session Report',
            type: 'report',
            config: {
              format: 'comprehensive',
              includeRecommendations: true,
              includeCharts: true,
            },
            dependencies: ['recommendations'],
          },
        ],
        notifications: [
          {
            type: 'console',
            config: {},
            events: ['complete'],
          },
          {
            type: 'dashboard',
            config: {},
            events: ['complete'],
          },
        ],
        autoExecution: false,
        priority: 'medium',
      },
    ];

    defaultWorkflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });

    console.log(`Initialized ${defaultWorkflows.length} development workflows`);
  }

  /**
   * Setup event listeners for workflow triggers
   */
  private setupEventListeners(): void {
    // Note: Event listeners would be implemented when the alert system supports them
    // For now, we'll use polling or direct method calls to check for alerts
    console.log('Setup workflow event listeners');
  }

  /**
   * Start workflow integration
   */
  async startWorkflowIntegration(): Promise<void> {
    if (this.isIntegrationActive) {
      console.warn('Workflow integration is already active');
      return;
    }

    console.log('🔄 Starting real debug workflow integration...');

    this.isIntegrationActive = true;

    // Schedule time-based workflows
    this.scheduleTimeBasedWorkflows();

    // Start processing workflow queue
    this.startWorkflowQueueProcessor();

    // Initialize development integrations
    await this.initializeDevelopmentIntegrations();

    console.log('✅ Real debug workflow integration started');
  }

  /**
   * Stop workflow integration
   */
  stopWorkflowIntegration(): void {
    if (!this.isIntegrationActive) {
      console.warn('Workflow integration is not active');
      return;
    }

    console.log('🛑 Stopping real debug workflow integration...');

    this.isIntegrationActive = false;

    // Clear scheduled workflows
    this.scheduledWorkflows.forEach(timeout => {
      clearTimeout(timeout);
    });
    this.scheduledWorkflows.clear();

    // Cancel running executions
    this.executions.forEach(execution => {
      if (execution.status === 'running') {
        execution.status = 'cancelled';
        execution.endTime = new Date();
      }
    });

    console.log('✅ Real debug workflow integration stopped');
  }

  /**
   * Schedule time-based workflows
   */
  private scheduleTimeBasedWorkflows(): void {
    this.workflows.forEach(workflow => {
      if (!workflow.enabled || !workflow.schedule) return;

      const timeBasedTriggers = workflow.triggers.filter(
        t => t.type === 'time_based'
      );
      if (timeBasedTriggers.length === 0) return;

      if (workflow.schedule.type === 'interval') {
        const interval = parseInt(workflow.schedule.expression);
        const timeout = setInterval(() => {
          this.queueWorkflow(workflow.id, 'scheduled');
        }, interval);

        this.scheduledWorkflows.set(workflow.id, timeout as any);
        console.log(
          `Scheduled workflow ${workflow.name} with interval ${interval}ms`
        );
      }
      // Cron scheduling would require a cron library in a real implementation
    });
  }

  /**
   * Start workflow queue processor
   */
  private startWorkflowQueueProcessor(): void {
    const processQueue = async () => {
      if (!this.isIntegrationActive) return;

      while (this.workflowQueue.length > 0) {
        const queueItem = this.workflowQueue.shift();
        if (queueItem) {
          try {
            await this.executeWorkflow(
              queueItem.workflowId,
              queueItem.trigger,
              queueItem.data
            );
          } catch (error) {
            console.error(
              `Failed to execute queued workflow ${queueItem.workflowId}:`,
              error
            );
          }
        }
      }

      // Process queue every 5 seconds
      setTimeout(processQueue, 5000);
    };

    processQueue();
  }

  /**
   * Initialize development integrations
   */
  private async initializeDevelopmentIntegrations(): Promise<void> {
    if (this.developmentIntegration.buildIntegration.enabled) {
      console.log('Initialized build integration');
      // Build integration setup would go here
    }

    if (this.developmentIntegration.ideIntegration.enabled) {
      console.log('Initialized IDE integration');
      // IDE integration setup would go here
    }

    if (this.developmentIntegration.gitIntegration.enabled) {
      console.log('Initialized Git integration');
      // Git integration setup would go here
    }
  }

  /**
   * Handle alert-triggered workflows
   */
  private handleAlertTrigger(alert: RealTimeAlert): void {
    this.workflows.forEach(workflow => {
      if (!workflow.enabled) return;

      const alertTriggers = workflow.triggers.filter(t => t.type === 'alert');
      for (const trigger of alertTriggers) {
        if (this.shouldTriggerOnAlert(trigger, alert)) {
          console.log(
            `Triggering workflow ${workflow.name} due to alert: ${alert.message}`
          );
          this.queueWorkflow(workflow.id, 'alert', { alert });
        }
      }
    });
  }

  /**
   * Check if workflow should trigger on alert
   */
  private shouldTriggerOnAlert(
    trigger: WorkflowTrigger,
    alert: RealTimeAlert
  ): boolean {
    if (trigger.config.alertSeverity) {
      return trigger.config.alertSeverity.includes(alert.severity);
    }
    return true;
  }

  /**
   * Queue workflow for execution
   */
  private queueWorkflow(workflowId: string, trigger: string, data?: any): void {
    this.workflowQueue.push({ workflowId, trigger, data });
    console.log(`Queued workflow ${workflowId} (trigger: ${trigger})`);
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(
    workflowId: string,
    trigger: string,
    data?: any
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Check conditions
    if (workflow.conditions) {
      const conditionsMet = await this.checkWorkflowConditions(
        workflow.conditions
      );
      if (!conditionsMet) {
        console.log(
          `Workflow ${workflow.name} conditions not met, skipping execution`
        );
        throw new Error('Workflow conditions not met');
      }
    }

    const execution: WorkflowExecution = {
      id: this.generateExecutionId(),
      workflowId,
      startTime: new Date(),
      status: 'running',
      trigger,
      steps: workflow.steps.map(step => ({
        stepId: step.id,
        name: step.name,
        status: 'pending',
        retryCount: 0,
      })),
      results: {},
      metrics: {
        duration: 0,
        stepsCompleted: 0,
        stepsTotal: workflow.steps.length,
        successRate: 0,
      },
      logs: [],
    };

    this.executions.set(execution.id, execution);
    this.addWorkflowLog(
      execution,
      'info',
      `Starting workflow: ${workflow.name}`,
      { trigger, data }
    );

    // Send start notifications
    await this.sendWorkflowNotifications(workflow, execution, 'start');

    try {
      await this.executeWorkflowSteps(workflow, execution, data);

      execution.status = 'completed';
      execution.endTime = new Date();
      execution.metrics.duration =
        execution.endTime.getTime() - execution.startTime.getTime();
      execution.metrics.successRate =
        execution.metrics.stepsCompleted / execution.metrics.stepsTotal;

      this.addWorkflowLog(execution, 'info', `Workflow completed successfully`);
      await this.sendWorkflowNotifications(workflow, execution, 'complete');
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.metrics.duration =
        execution.endTime.getTime() - execution.startTime.getTime();

      this.addWorkflowLog(execution, 'error', `Workflow failed: ${error}`, {
        error,
      });
      await this.sendWorkflowNotifications(workflow, execution, 'error');
    }

    // Add to execution history
    this.executionHistory.push(execution);
    if (this.executionHistory.length > 100) {
      this.executionHistory = this.executionHistory.slice(-100);
    }

    return execution;
  }

  /**
   * Check workflow conditions
   */
  private async checkWorkflowConditions(
    conditions: WorkflowCondition[]
  ): Promise<boolean> {
    for (const condition of conditions) {
      const conditionMet = await this.evaluateWorkflowCondition(condition);
      if (condition.required && !conditionMet) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate individual workflow condition
   */
  private async evaluateWorkflowCondition(
    condition: WorkflowCondition
  ): Promise<boolean> {
    switch (condition.type) {
      case 'metric':
        return this.evaluateMetricCondition(condition.condition);

      case 'alert':
        return this.evaluateAlertCondition(condition.condition);

      case 'time':
        return this.evaluateTimeCondition(condition.condition);

      case 'custom':
        return this.evaluateCustomCondition(condition.condition);

      default:
        return true;
    }
  }

  /**
   * Evaluate metric condition
   */
  private evaluateMetricCondition(condition: string): boolean {
    try {
      if (!this.monitor) {
        console.warn('Monitor not available for metric condition evaluation');
        return false;
      }

      // Simple condition evaluation - in production, use a proper expression evaluator
      const monitorStatus = this.monitor.getMonitoringStatus();
      const context = {
        monitor: monitorStatus,
        isMonitoring: monitorStatus.isMonitoring,
      };

      // Replace variables in condition
      let evaluableCondition = condition;
      Object.entries(context).forEach(([key, value]) => {
        evaluableCondition = evaluableCondition.replace(
          new RegExp(`\\b${key}\\b`, 'g'),
          JSON.stringify(value)
        );
      });

      return eval(evaluableCondition);
    } catch (error) {
      console.error('Error evaluating metric condition:', error);
      return false;
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateAlertCondition(_condition: string): boolean {
    // Placeholder for alert condition evaluation
    return true;
  }

  /**
   * Evaluate time condition
   */
  private evaluateTimeCondition(_condition: string): boolean {
    // Placeholder for time condition evaluation
    return true;
  }

  /**
   * Evaluate custom condition
   */
  private evaluateCustomCondition(_condition: string): boolean {
    // Placeholder for custom condition evaluation
    return true;
  }

  /**
   * Execute workflow steps
   */
  private async executeWorkflowSteps(
    workflow: DevelopmentWorkflow,
    execution: WorkflowExecution,
    data?: any
  ): Promise<void> {
    const completedSteps = new Set<string>();

    for (const step of workflow.steps) {
      // Check dependencies
      if (step.dependencies) {
        const unmetDependencies = step.dependencies.filter(
          dep => !completedSteps.has(dep)
        );
        if (unmetDependencies.length > 0) {
          this.addWorkflowLog(
            execution,
            'warn',
            `Skipping step ${step.name} due to unmet dependencies: ${unmetDependencies.join(', ')}`
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

      this.addWorkflowLog(execution, 'info', `Executing step: ${step.name}`);

      try {
        const result = await this.executeWorkflowStep(step, execution, data);

        stepExecution.status = 'completed';
        stepExecution.endTime = new Date();
        stepExecution.result = result;
        completedSteps.add(step.id);
        execution.metrics.stepsCompleted++;

        this.addWorkflowLog(execution, 'info', `Step completed: ${step.name}`);
        await this.sendWorkflowNotifications(
          workflow,
          execution,
          'step_complete',
          { step, result }
        );
      } catch (error) {
        stepExecution.status = 'failed';
        stepExecution.endTime = new Date();
        stepExecution.error =
          error instanceof Error ? error.message : String(error);

        this.addWorkflowLog(execution, 'error', `Step failed: ${step.name}`, {
          error,
        });

        // Handle retries
        if (step.retries && stepExecution.retryCount < step.retries) {
          stepExecution.retryCount++;
          this.addWorkflowLog(
            execution,
            'info',
            `Retrying step: ${step.name} (attempt ${stepExecution.retryCount + 1})`
          );
          // Retry logic would go here
        }

        // Continue on failure if configured
        if (!step.continueOnFailure) {
          throw error;
        }
      }
    }
  }

  /**
   * Execute individual workflow step
   */
  private async executeWorkflowStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    data?: any
  ): Promise<any> {
    switch (step.type) {
      case 'test':
        return this.executeTestStep(step, execution, data);

      case 'analysis':
        return this.executeAnalysisStep(step, execution, data);

      case 'report':
        return this.executeReportStep(step, execution, data);

      case 'notification':
        return this.executeNotificationStep(step, execution, data);

      case 'recovery':
        return this.executeRecoveryStep(step, execution, data);

      case 'custom':
        return this.executeCustomStep(step, execution, data);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute test step
   */
  private async executeTestStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    _data?: any
  ): Promise<any> {
    const config = step.config;
    const results: any[] = [];

    if (config.scenarios) {
      for (const scenario of config.scenarios) {
        try {
          const result = await this.testExecutor.executeRealScenario(scenario);
          results.push(result);
        } catch (error) {
          this.addWorkflowLog(
            execution,
            'error',
            `Test scenario failed: ${scenario}`,
            { error }
          );
          throw error;
        }
      }
    }

    return {
      testResults: results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length,
      },
    };
  }

  /**
   * Execute analysis step
   */
  private async executeAnalysisStep(
    step: WorkflowStep,
    _execution: WorkflowExecution,
    data?: any
  ): Promise<any> {
    const config = step.config;

    switch (config.analysisType) {
      case 'critical-issue':
        return this.analyzeCriticalIssues(config, data);

      case 'performance':
        return this.analyzePerformance(config, data);

      case 'trend':
        return this.analyzeTrends(config, data);

      case 'session-summary':
        return this.analyzeSession(config, data);

      case 'recommendations':
        return this.generateRecommendations(config, data);

      default:
        return {
          analysisType: config.analysisType,
          result: 'Analysis completed',
        };
    }
  }

  /**
   * Execute report step
   */
  private async executeReportStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    data?: any
  ): Promise<any> {
    const config = step.config;

    // Collect data from previous steps
    const stepResults = execution.steps
      .filter(s => s.status === 'completed' && s.result)
      .map(s => s.result);

    const reportData = {
      workflowId: execution.workflowId,
      executionId: execution.id,
      timestamp: new Date(),
      stepResults,
      config,
      data,
    };

    this.addWorkflowLog(execution, 'info', `Generated ${config.format} report`);

    return {
      reportId: `workflow-report-${execution.id}`,
      format: config.format,
      data: reportData,
      generated: new Date(),
    };
  }

  /**
   * Execute notification step
   */
  private async executeNotificationStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    _data?: any
  ): Promise<any> {
    const config = step.config;
    const message = `Workflow notification: ${execution.workflowId}`;

    if (config.channels?.includes('console')) {
      console.log(`📢 ${message}`);
    }

    if (config.channels?.includes('dashboard')) {
      console.log(`Dashboard notification: ${message}`);
    }

    return { notificationSent: true, channels: config.channels };
  }

  /**
   * Execute recovery step
   */
  private async executeRecoveryStep(
    step: WorkflowStep,
    _execution: WorkflowExecution,
    _data?: any
  ): Promise<any> {
    const config = step.config;
    const recoveryResults: Array<{
      action: any;
      result?: any;
      error?: string;
      success: boolean;
    }> = [];

    if (config.actions) {
      for (const action of config.actions) {
        try {
          const result = await this.executeRecoveryAction(action);
          recoveryResults.push({ action, result, success: true });
        } catch (error) {
          recoveryResults.push({
            action,
            error: String(error),
            success: false,
          });
        }
      }
    }

    return {
      recoveryActions: recoveryResults,
      successCount: recoveryResults.filter(r => r.success).length,
      totalCount: recoveryResults.length,
    };
  }

  /**
   * Execute custom step
   */
  private async executeCustomStep(
    step: WorkflowStep,
    _execution: WorkflowExecution,
    _data?: any
  ): Promise<any> {
    // Custom step execution would be implemented based on specific requirements
    return { customStepExecuted: true, stepId: step.id };
  }

  /**
   * Analysis method implementations
   */
  private async analyzeCriticalIssues(_config: any, _data?: any): Promise<any> {
    const currentMetrics = this.monitor?.getLiveMetrics();
    const activeAlerts = this.alertSystem?.getActiveAlerts() || [];

    return {
      criticalIssues: activeAlerts.filter(
        alert => alert.severity === 'critical'
      ),
      systemHealth: currentMetrics?.health?.overallScore || 0,
      recommendations: this.generateCriticalIssueRecommendations(activeAlerts),
    };
  }

  private async analyzePerformance(config: any, _data?: any): Promise<any> {
    const metricsHistory = this.monitor?.getMetricsHistory(20) || [];

    if (metricsHistory.length === 0) {
      return { error: 'No metrics available for analysis' };
    }

    const avgMemory =
      metricsHistory.reduce((sum, m) => sum + m.performance.memoryUsage, 0) /
      metricsHistory.length;
    const avgResponseTime =
      metricsHistory.reduce((sum, m) => sum + m.performance.responseTime, 0) /
      metricsHistory.length;

    return {
      averageMemoryUsage: avgMemory,
      averageResponseTime: avgResponseTime,
      performanceTrend: this.calculatePerformanceTrend(metricsHistory),
      thresholdViolations: this.checkThresholdViolations(config.thresholds, {
        avgMemory,
        avgResponseTime,
      }),
    };
  }

  private async analyzeTrends(_config: any, _data?: any): Promise<any> {
    const metricsHistory = this.monitor?.getMetricsHistory() || [];

    return {
      memoryTrend: this.calculateTrend(
        metricsHistory.map(m => m.performance.memoryUsage)
      ),
      responseTimeTrend: this.calculateTrend(
        metricsHistory.map(m => m.performance.responseTime)
      ),
      healthTrend: this.calculateTrend(
        metricsHistory.map(m => m.health.overallScore)
      ),
    };
  }

  private async analyzeSession(_config: any, _data?: any): Promise<any> {
    const monitoringStatus = this.monitor?.getMonitoringStatus();
    const alertStatistics = this.alertSystem?.getAlertStatistics();

    return {
      sessionDuration: monitoringStatus?.uptime || 0,
      totalAlerts: alertStatistics?.totalAlerts || 0,
      alertsBySeverity: alertStatistics?.alertsBySeverity || {},
      currentHealth:
        monitoringStatus?.currentMetrics?.health?.overallScore || 0,
      recommendations: this.generateSessionRecommendations(
        alertStatistics || { totalAlerts: 0, alertsBySeverity: {} }
      ),
    };
  }

  private async generateRecommendations(config: any, data?: any): Promise<any> {
    const recommendations: string[] = [];
    const currentMetrics = this.monitor?.getLiveMetrics();
    const alertStats = this.alertSystem?.getAlertStatistics();

    if (
      currentMetrics?.performance?.memoryUsage &&
      currentMetrics.performance.memoryUsage > 100
    ) {
      recommendations.push('Consider optimizing memory usage');
    }

    if (alertStats && alertStats.totalAlerts > 10) {
      recommendations.push('Review and address recurring alerts');
    }

    if (
      currentMetrics?.health?.overallScore &&
      currentMetrics.health.overallScore < 0.8
    ) {
      recommendations.push('Investigate and fix health issues');
    }

    return { recommendations };
  }

  /**
   * Helper methods
   */
  private generateCriticalIssueRecommendations(
    alerts: RealTimeAlert[]
  ): string[] {
    const recommendations: string[] = [];

    alerts.forEach(alert => {
      if (alert.recoveryActions && alert.recoveryActions.length > 0) {
        recommendations.push(`For ${alert.type}: ${alert.recoveryActions[0]}`);
      }
    });

    return recommendations;
  }

  private calculatePerformanceTrend(metrics: LiveExtensionMetrics[]): string {
    if (metrics.length < 2) return 'insufficient-data';

    const recent = metrics.slice(-5);
    const older = metrics.slice(-10, -5);

    const recentAvg =
      recent.reduce((sum, m) => sum + m.health.overallScore, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, m) => sum + m.health.overallScore, 0) / older.length;

    if (recentAvg > olderAvg * 1.1) return 'improving';
    if (recentAvg < olderAvg * 0.9) return 'degrading';
    return 'stable';
  }

  private checkThresholdViolations(thresholds: any, values: any): string[] {
    const violations: string[] = [];

    if (thresholds.memoryUsage && values.avgMemory > thresholds.memoryUsage) {
      violations.push(
        `Memory usage exceeds threshold: ${values.avgMemory}MB > ${thresholds.memoryUsage}MB`
      );
    }

    if (
      thresholds.responseTime &&
      values.avgResponseTime > thresholds.responseTime
    ) {
      violations.push(
        `Response time exceeds threshold: ${values.avgResponseTime}ms > ${thresholds.responseTime}ms`
      );
    }

    return violations;
  }

  private calculateTrend(values: number[]): string {
    if (values.length < 2) return 'insufficient-data';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg =
      firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.1) return 'increasing';
    if (secondAvg < firstAvg * 0.9) return 'decreasing';
    return 'stable';
  }

  private generateSessionRecommendations(alertStats: any): string[] {
    const recommendations: string[] = [];

    if (alertStats.totalAlerts > 20) {
      recommendations.push(
        'High alert volume - consider adjusting alert thresholds'
      );
    }

    if (
      alertStats.alertsBySeverity &&
      alertStats.alertsBySeverity.critical > 0
    ) {
      recommendations.push(
        'Critical alerts detected - immediate attention required'
      );
    }

    return recommendations;
  }

  private async executeRecoveryAction(action: string): Promise<any> {
    switch (action) {
      case 'restart-contexts':
        return { action: 'restart-contexts', result: 'Contexts restarted' };

      case 'clear-caches':
        return { action: 'clear-caches', result: 'Caches cleared' };

      case 'reset-state':
        return { action: 'reset-state', result: 'State reset' };

      default:
        throw new Error(`Unknown recovery action: ${action}`);
    }
  }

  /**
   * Send workflow notifications
   */
  private async sendWorkflowNotifications(
    workflow: DevelopmentWorkflow,
    execution: WorkflowExecution,
    event: string,
    context?: any
  ): Promise<void> {
    const relevantNotifications = workflow.notifications.filter(n =>
      n.events.includes(event)
    );

    for (const notification of relevantNotifications) {
      try {
        await this.sendNotification(
          notification,
          workflow,
          execution,
          event,
          context
        );
      } catch (error) {
        console.error(
          `Failed to send ${notification.type} notification:`,
          error
        );
      }
    }
  }

  /**
   * Send individual notification
   */
  private async sendNotification(
    notification: WorkflowNotification,
    workflow: DevelopmentWorkflow,
    execution: WorkflowExecution,
    event: string,
    context?: any
  ): Promise<void> {
    const message = this.formatNotificationMessage(
      workflow,
      execution,
      event,
      context
    );

    switch (notification.type) {
      case 'console':
        console.log(`🔔 [${workflow.name}] ${message}`);
        break;

      case 'dashboard':
        console.log(`Dashboard: [${workflow.name}] ${message}`);
        break;

      case 'email':
        console.log(`Email: [${workflow.name}] ${message}`);
        break;

      case 'slack':
        console.log(`Slack: [${workflow.name}] ${message}`);
        break;

      case 'webhook':
        console.log(`Webhook: [${workflow.name}] ${message}`);
        break;
    }
  }

  /**
   * Format notification message
   */
  private formatNotificationMessage(
    _workflow: DevelopmentWorkflow,
    execution: WorkflowExecution,
    event: string,
    context?: any
  ): string {
    switch (event) {
      case 'start':
        return `Workflow started (trigger: ${execution.trigger})`;

      case 'complete':
        return `Workflow completed successfully in ${execution.metrics.duration}ms`;

      case 'error':
        return `Workflow failed after ${execution.metrics.duration}ms`;

      case 'step_complete':
        return `Step completed: ${context?.step?.name}`;

      default:
        return `Workflow event: ${event}`;
    }
  }

  /**
   * Add workflow log entry
   */
  private addWorkflowLog(
    execution: WorkflowExecution,
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    context?: any
  ): void {
    execution.logs.push({
      timestamp: new Date(),
      level,
      message,
      context,
    });

    // Keep only last 100 log entries per execution
    if (execution.logs.length > 100) {
      execution.logs = execution.logs.slice(-100);
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `workflow-exec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Public API methods
   */

  /**
   * Add custom workflow
   */
  addWorkflow(workflow: DevelopmentWorkflow): void {
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
        clearTimeout(timeout);
        this.scheduledWorkflows.delete(workflowId);
      }
      console.log(`Removed workflow: ${workflowId}`);
    }
    return removed;
  }

  /**
   * Execute workflow manually
   */
  async executeWorkflowManually(
    workflowId: string,
    data?: any
  ): Promise<WorkflowExecution> {
    return this.executeWorkflow(workflowId, 'manual', data);
  }

  /**
   * Get workflow executions
   */
  getWorkflowExecutions(workflowId?: string): WorkflowExecution[] {
    const executions = Array.from(this.executions.values());
    return workflowId
      ? executions.filter(e => e.workflowId === workflowId)
      : executions;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit?: number): WorkflowExecution[] {
    return limit
      ? this.executionHistory.slice(-limit)
      : [...this.executionHistory];
  }

  /**
   * Get workflow statistics
   */
  getWorkflowStatistics(): {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    executionsByStatus: Record<string, number>;
    executionsByWorkflow: Record<string, number>;
    averageExecutionTime: number;
  } {
    const executions = this.executionHistory;
    const totalExecutions = executions.length;

    const executionsByStatus: Record<string, number> = {};
    const executionsByWorkflow: Record<string, number> = {};
    let totalExecutionTime = 0;

    executions.forEach(execution => {
      executionsByStatus[execution.status] =
        (executionsByStatus[execution.status] || 0) + 1;
      executionsByWorkflow[execution.workflowId] =
        (executionsByWorkflow[execution.workflowId] || 0) + 1;
      totalExecutionTime += execution.metrics.duration;
    });

    return {
      totalWorkflows: this.workflows.size,
      activeWorkflows: Array.from(this.workflows.values()).filter(
        w => w.enabled
      ).length,
      totalExecutions,
      executionsByStatus,
      executionsByWorkflow,
      averageExecutionTime:
        totalExecutions > 0 ? totalExecutionTime / totalExecutions : 0,
    };
  }

  /**
   * Update development integration configuration
   */
  updateDevelopmentIntegration(config: Partial<DevelopmentIntegration>): void {
    this.developmentIntegration = { ...this.developmentIntegration, ...config };
    console.log('Updated development integration configuration');
  }

  /**
   * Get integration status
   */
  getIntegrationStatus(): {
    isActive: boolean;
    queuedWorkflows: number;
    runningExecutions: number;
    scheduledWorkflows: number;
    developmentIntegration: DevelopmentIntegration;
  } {
    return {
      isActive: this.isIntegrationActive,
      queuedWorkflows: this.workflowQueue.length,
      runningExecutions: Array.from(this.executions.values()).filter(
        e => e.status === 'running'
      ).length,
      scheduledWorkflows: this.scheduledWorkflows.size,
      developmentIntegration: this.developmentIntegration,
    };
  }

  /**
   * Export workflow configuration
   */
  exportConfiguration(): {
    workflows: DevelopmentWorkflow[];
    developmentIntegration: DevelopmentIntegration;
    statistics: any;
  } {
    return {
      workflows: Array.from(this.workflows.values()),
      developmentIntegration: this.developmentIntegration,
      statistics: this.getWorkflowStatistics(),
    };
  }

  /**
   * Integrate with development workflow
   * Main integration method called by the test
   */
  async integrateWithDevelopmentWorkflow(data: {
    monitoringData: any;
    alerts: RealTimeAlert[];
    sessionId: string;
  }): Promise<{
    success: boolean;
    recommendations?: string[];
    automatedActions?: string[];
    error?: string;
  }> {
    try {
      console.log(
        `🔄 Integrating with development workflow for session: ${data.sessionId}`
      );

      const recommendations: string[] = [];
      const automatedActions: string[] = [];

      // Analyze monitoring data for recommendations
      if (data.monitoringData) {
        if (data.monitoringData.performance?.memoryUsage > 100) {
          recommendations.push(
            'Optimize memory usage - current usage exceeds 100MB'
          );
          automatedActions.push('trigger-garbage-collection');
        }

        if (data.monitoringData.health?.overallScore < 0.7) {
          recommendations.push(
            'Address system health issues - overall score below 70%'
          );
          automatedActions.push('run-health-diagnostics');
        }

        if (data.monitoringData.performance?.responseTime > 2000) {
          recommendations.push(
            'Improve response time - currently above 2 seconds'
          );
          automatedActions.push('optimize-performance');
        }
      }

      // Process alerts for workflow triggers
      if (data.alerts && data.alerts.length > 0) {
        const criticalAlerts = data.alerts.filter(
          alert => alert.severity === 'critical'
        );
        const highAlerts = data.alerts.filter(
          alert => alert.severity === 'high'
        );

        if (criticalAlerts.length > 0) {
          recommendations.push(
            `Address ${criticalAlerts.length} critical alerts immediately`
          );
          automatedActions.push('execute-critical-alert-workflow');

          // Trigger critical alert response workflow
          this.queueWorkflow('critical-alert-response', 'integration', {
            alerts: criticalAlerts,
          });
        }

        if (highAlerts.length > 0) {
          recommendations.push(
            `Review ${highAlerts.length} high-priority alerts`
          );
          automatedActions.push('execute-high-alert-workflow');
        }

        // Add alert-specific recommendations
        data.alerts.forEach(alert => {
          if (alert.recoveryActions && alert.recoveryActions.length > 0) {
            recommendations.push(
              `For ${alert.type}: ${alert.recoveryActions[0]}`
            );
          }
        });
      }

      // Check if any workflows should be triggered
      const triggeredWorkflows = this.checkWorkflowTriggers(data);
      if (triggeredWorkflows.length > 0) {
        automatedActions.push(
          `triggered-${triggeredWorkflows.length}-workflows`
        );
        console.log(
          `Triggered ${triggeredWorkflows.length} workflows based on integration data`
        );
      }

      // Generate development session recommendations
      const sessionRecommendations =
        await this.generateDevelopmentSessionRecommendations(data);
      recommendations.push(...sessionRecommendations);

      console.log(`✅ Development workflow integration completed successfully`);
      console.log(
        `Generated ${recommendations.length} recommendations and ${automatedActions.length} automated actions`
      );

      return {
        success: true,
        recommendations,
        automatedActions,
      };
    } catch (error) {
      console.error('❌ Development workflow integration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check which workflows should be triggered based on integration data
   */
  private checkWorkflowTriggers(data: {
    monitoringData: any;
    alerts: RealTimeAlert[];
    sessionId: string;
  }): string[] {
    const triggeredWorkflows: string[] = [];

    this.workflows.forEach((workflow, workflowId) => {
      if (!workflow.enabled) return;

      let shouldTrigger = false;

      workflow.triggers.forEach(trigger => {
        switch (trigger.type) {
          case 'alert':
            if (data.alerts.length > 0) {
              const matchingAlerts = data.alerts.filter(
                alert =>
                  !trigger.config.alertSeverity ||
                  trigger.config.alertSeverity.includes(alert.severity)
              );
              if (matchingAlerts.length > 0) {
                shouldTrigger = true;
              }
            }
            break;

          case 'metric_threshold':
            if (
              data.monitoringData &&
              trigger.config.metricPath &&
              trigger.config.threshold
            ) {
              const metricValue = this.getNestedValue(
                data.monitoringData,
                trigger.config.metricPath
              );
              if (
                metricValue !== undefined &&
                metricValue > trigger.config.threshold
              ) {
                shouldTrigger = true;
              }
            }
            break;
        }
      });

      if (shouldTrigger) {
        triggeredWorkflows.push(workflowId);
        this.queueWorkflow(workflowId, 'integration', data);
      }
    });

    return triggeredWorkflows;
  }

  /**
   * Generate development session recommendations
   */
  private async generateDevelopmentSessionRecommendations(data: {
    monitoringData: any;
    alerts: RealTimeAlert[];
    sessionId: string;
  }): Promise<string[]> {
    const recommendations: string[] = [];

    // Performance-based recommendations
    if (data.monitoringData?.performance) {
      const perf = data.monitoringData.performance;

      if (perf.memoryUsage > 150) {
        recommendations.push(
          'Consider implementing memory optimization strategies'
        );
      }

      if (perf.cpuUsage > 80) {
        recommendations.push(
          'High CPU usage detected - review computational efficiency'
        );
      }

      if (perf.responseTime > 3000) {
        recommendations.push(
          'Response times are slow - consider performance profiling'
        );
      }
    }

    // Context-based recommendations
    if (data.monitoringData?.contexts) {
      Object.entries(data.monitoringData.contexts).forEach(
        ([contextName, context]: [string, any]) => {
          if (context.healthScore < 0.5) {
            recommendations.push(
              `${contextName} context needs attention - health score: ${(context.healthScore * 100).toFixed(1)}%`
            );
          }

          if (context.errorCount > 5) {
            recommendations.push(
              `${contextName} context has high error count: ${context.errorCount}`
            );
          }
        }
      );
    }

    // Alert pattern recommendations
    if (data.alerts.length > 10) {
      recommendations.push(
        'High alert volume - consider reviewing alert thresholds and system stability'
      );
    }

    const alertTypes = [...new Set(data.alerts.map(alert => alert.type))];
    if (alertTypes.length > 5) {
      recommendations.push(
        'Multiple alert types detected - comprehensive system review recommended'
      );
    }

    return recommendations;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopWorkflowIntegration();
    this.executions.clear();
    this.executionHistory = [];
    this.workflowQueue = [];
    console.log('Real debug workflow integration cleaned up');
  }
}
