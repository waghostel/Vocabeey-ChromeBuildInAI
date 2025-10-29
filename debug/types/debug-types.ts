/**
 * Debug Types
 * Type definitions for the debugging system
 */

// Test Scenario Types
export interface TestScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  execute: () => Promise<TestResult>;
  cleanup: () => Promise<void>;
  expectedOutcome: string;
  category?: string;
  priority?: number;
  timeout?: number;
}

export interface TestResult {
  passed: boolean;
  scenarioName: string;
  executionTime: number;
  timestamp: Date;
  error?: string;
  metrics: Record<string, any>;
}

export interface TestScenarioConfig {
  scenarios?: string[];
  parallel?: number;
  timeout?: number;
  retries?: number;
  stopOnFailure?: boolean;
  categories?: string[];
  priority?: number;
}

// Validation Types
export interface ValidationCriteria {
  maxExecutionTime?: number;
  requiredMetrics?: string[];
  metricThresholds?: Record<string, { min?: number; max?: number }>;
  customValidation?: (result: TestResult) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  violations: string[];
  recommendations: string[];
}

// Scenario Management Types
export interface ScenarioCategory {
  name: string;
  description: string;
  priority: number;
  scenarios: string[];
}

// Debug Report Types
export interface DebugReport {
  reportId: string;
  timestamp: Date;
  sessionId: string;
  testResults: TestResult[];
  validationSummary: ValidationSummary;
  performanceMetrics: PerformanceMetrics;
  recommendations: Recommendation[];
  summary: ReportSummary;
}

export interface ValidationSummary {
  totalTests: number;
  passedTests: number;
  validTests: number;
  averageScore: number;
  overallViolations: string[];
  overallRecommendations: string[];
}

export interface PerformanceMetrics {
  totalExecutionTime: number;
  averageExecutionTime: number;
  memoryUsage: {
    peak: number;
    average: number;
    current: number;
  };
  resourceUtilization: {
    cpu: number;
    memory: number;
    network: number;
  };
}

export interface Recommendation {
  type: 'performance' | 'functionality' | 'reliability' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionItems: string[];
  relatedScenarios: string[];
}

export interface ReportSummary {
  overallStatus: 'passed' | 'failed' | 'warning';
  criticalIssues: number;
  totalRecommendations: number;
  executionDuration: number;
  scenariosExecuted: number;
}

// Monitoring Types
export interface MonitoringConfig {
  enabled: boolean;
  interval: number;
  scenarios: string[];
  alertThresholds: {
    failureRate: number;
    executionTime: number;
    memoryUsage: number;
  };
  notifications: {
    email?: string[];
    webhook?: string;
    console: boolean;
  };
}

export interface MonitoringAlert {
  id: string;
  timestamp: Date;
  type: 'failure_rate' | 'execution_time' | 'memory_usage' | 'scenario_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  scenarioName?: string;
}

// Debug Session Types
export interface DebugSessionState {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  activeContexts: ExtensionContext[];
  capturedData: CapturedDebugData;
  testResults: TestResult[];
  configuration: DebugSessionConfig;
}

export interface ExtensionContext {
  type: 'service-worker' | 'content-script' | 'offscreen' | 'ui';
  pageIndex: number;
  url?: string;
  isActive: boolean;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

export interface CapturedDebugData {
  consoleMessages: ConsoleMessage[];
  networkRequests: NetworkRequest[];
  performanceMetrics: PerformanceMetric[];
  errorLogs: ErrorLog[];
  storageOperations: StorageOperation[];
  memorySnapshots: MemorySnapshot[];
}

export interface ConsoleMessage {
  id: number;
  timestamp: Date;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  context: string;
}

export interface NetworkRequest {
  id: number;
  timestamp: Date;
  method: string;
  url: string;
  status: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  context: string;
}

export interface PerformanceMetric {
  timestamp: Date;
  name: string;
  value: number;
  unit: string;
  context: string;
  metadata?: Record<string, any>;
}

export interface ErrorLog {
  timestamp: Date;
  level: 'warning' | 'error' | 'critical';
  message: string;
  stack?: string;
  context: string;
  scenarioName?: string;
}

export interface StorageOperation {
  timestamp: Date;
  operation: 'get' | 'set' | 'remove' | 'clear';
  key: string;
  size?: number;
  success: boolean;
  duration: number;
}

export interface MemorySnapshot {
  timestamp: Date;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
  context: string;
}

export interface DebugSessionConfig {
  timeout: number;
  maxRetries: number;
  captureConsole: boolean;
  captureNetwork: boolean;
  capturePerformance: boolean;
  captureStorage: boolean;
  captureMemory: boolean;
  contexts: string[];
}

// Workflow Types
export interface DebugWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  schedule?: WorkflowSchedule;
  enabled: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'scenario' | 'validation' | 'report' | 'notification' | 'custom';
  config: Record<string, any>;
  dependencies?: string[];
  timeout?: number;
  retries?: number;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'event' | 'condition';
  config: Record<string, any>;
}

export interface WorkflowSchedule {
  type: 'interval' | 'cron';
  expression: string;
  timezone?: string;
}

// Utility Types
export type DebugLevel = 'debug' | 'info' | 'warn' | 'error';
export type ScenarioStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';
export type ReportFormat = 'json' | 'html' | 'markdown' | 'csv';

// Event Types
export interface DebugEvent {
  type: string;
  timestamp: Date;
  data: Record<string, any>;
  source: string;
}

export interface ScenarioEvent extends DebugEvent {
  scenarioName: string;
  status: ScenarioStatus;
}

export interface ValidationEvent extends DebugEvent {
  scenarioName: string;
  validationResult: ValidationResult;
}

export interface ReportEvent extends DebugEvent {
  reportId: string;
  format: ReportFormat;
}

// Performance Optimization Types
export interface DebugPerformanceConfig {
  enabled: boolean;
  monitoringInterval: number;
  thresholds: PerformanceThresholds;
  optimizations: OptimizationSettings;
}

export interface PerformanceThresholds {
  maxMemoryUsage: number; // MB
  maxExecutionTime: number; // ms
  maxDataPoints: number;
  maxConcurrentOperations: number;
  gcThreshold: number; // MB
}

export interface OptimizationSettings {
  enableCaching: boolean;
  enableSampling: boolean;
  enableCompression: boolean;
  enableLazyLoading: boolean;
  enableGarbageCollection: boolean;
}

export interface DebugOverheadMetrics {
  memoryOverhead: number;
  cpuOverhead: number;
  networkOverhead: number;
  storageOverhead: number;
  totalOverhead: number;
  overheadHistory: Array<{
    timestamp: Date;
    memory: number;
    cpu: number;
    total: number;
  }>;
  lastMeasurement: Date;
}

export interface DebugEfficiencyMetrics {
  dataCollectionEfficiency: number;
  processingEfficiency: number;
  storageEfficiency: number;
  networkEfficiency: number;
  overallEfficiency: number;
  optimizationImpact: number;
  efficiencyHistory: Array<{
    timestamp: Date;
    optimizationTime: number;
    memoryReduction: number;
    optimizationsApplied: number;
  }>;
  lastCalculation: Date;
}

export interface PerformanceOptimization {
  success: boolean;
  optimizationsApplied?: string[];
  performanceGain?: number;
  memoryReduction?: number;
  executionTime: number;
  error?: string;
}
