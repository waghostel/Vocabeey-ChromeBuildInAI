/**
 * Debug Utilities Index
 * Exports all debugging utilities and helpers
 */

// Session Management
export {
  DebugSessionManager,
  debugSessionManager,
} from './debug-session-manager.js';

// Data Visualization
export {
  DebugDashboard,
  debugDashboard,
  type DashboardConfig,
  type DashboardData,
  type SessionOverview,
  type PerformanceChartData,
  type ChartDataPoint,
  type ErrorSummary,
  type NetworkActivityData,
  type MemoryUsageData,
  type TestResultSummary,
  type TimelineEvent,
} from './debug-dashboard.js';

// Configuration Management
export {
  DebugConfigManager,
  debugConfigManager,
  type DebugProfile,
  type DebugSettings,
  type ToolCustomization,
} from './debug-config-manager.js';

// Context-specific debuggers
export { ServiceWorkerDebugger } from '../contexts/service-worker-debugger.js';
export { ContentScriptDebugger } from '../contexts/content-script-debugger.js';
export { OffscreenDebugger } from '../contexts/offscreen-debugger.js';
export { UIComponentDebugger } from '../contexts/ui-component-debugger.js';
export { StorageCachingDebugger } from '../contexts/storage-caching-debugger.js';
export { IntegrationDebugger } from '../contexts/integration-debugger.js';

// Specialized utilities
export { MessageFlowTracker } from './message-flow-tracker.js';
export { ErrorPropagationTracker } from './error-propagation-tracker.js';
export { PerformanceBottleneckDetector } from './performance-bottleneck-detector.js';
export { MemoryMonitor } from './memory-monitor.js';
export { ServiceCoordinatorDebugger } from './service-coordinator-debugger.js';
export { UserInteractionDebugger } from './user-interaction-debugger.js';
export { HighlightingSystemDebugger } from './highlighting-system-debugger.js';
export { CacheSystemDebugger } from './cache-system-debugger.js';
export { DataPersistenceValidator } from './data-persistence-validator.js';

// Test scenario management
export { TestScenarioManager } from '../scenarios/test-scenario-manager.js';
export { TestScenarioExecutor } from '../scenarios/test-scenario-executor.js';
export { TestResultValidator } from '../scenarios/test-result-validator.js';
export { AutomatedTestScenarios } from '../scenarios/automated-test-scenarios.js';

// Report generation
export { DebugReportGenerator } from '../reports/debug-report-generator.js';
export { DebugDataAggregator } from '../reports/debug-data-aggregator.js';
export { RecommendationSystem } from '../reports/recommendation-system.js';
export { AutomatedReportGeneration } from '../reports/automated-report-generation.js';

// Monitoring and alerts
export { ContinuousDebugMonitor } from '../monitoring/continuous-debug-monitor.js';
export { DebugAlertSystem } from '../monitoring/debug-alert-system.js';
export { DebugWorkflowIntegration } from '../monitoring/debug-workflow-integration.js';
export { ContinuousDebuggingSystem } from '../monitoring/continuous-debugging-system.js';

// Performance optimization
export {
  DebugPerformanceOptimizer,
  debugPerformanceOptimizer,
  type PerformanceThresholds,
  type OptimizationStrategy,
} from './debug-performance-optimizer.js';
export {
  DebugEfficiencyMonitor,
  debugEfficiencyMonitor,
  type EfficiencyBenchmark,
  type EfficiencyReport,
} from './debug-efficiency-monitor.js';
export {
  PerformanceOptimizationSystem,
  performanceOptimizationSystem,
  type OptimizationPlan,
  type OptimizationAction,
  type OptimizationResult,
} from './performance-optimization-system.js';

// MCP Integration
export {
  MCPConnectionManager,
  type MCPConfiguration,
  type MCPConnectionStatus,
  type MCPFunctionResult,
} from './mcp-connection-manager.js';
export {
  MCPFunctionVerifier,
  type MCPFunctionTest,
  type MCPFunctionVerificationResult,
  type MCPVerificationReport,
  type MCPHealthCheckConfig,
} from './mcp-function-verifier.js';
export { MCPConnectionValidator } from './mcp-connection-validator.js';

// Types
export * from '../types/debug-types.js';
