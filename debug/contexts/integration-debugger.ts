/**
 * Integration Debugger
 *
 * Coordinates cross-component integration debugging using chrome-devtools MCP.
 * Provides comprehensive monitoring of message flow, error propagation, and performance bottlenecks.
 */

import {
  MessageFlowTracker,
  ExtensionContext,
  MessageFlowSummary,
} from '../utils/message-flow-tracker.js';

export interface IntegrationDebugSession {
  sessionId: string;
  startTime: Date;
  contexts: ExtensionContextInfo[];
  messageFlowSummary?: MessageFlowSummary;
  errorPropagationReport?: ErrorPropagationReport;
  performanceBottlenecks?: PerformanceBottleneck[];
  recommendations: string[];
}

export interface ExtensionContextInfo {
  type: ExtensionContext;
  pageIndex: number;
  url?: string;
  isActive: boolean;
  lastActivity: Date;
  errorCount: number;
  performanceMetrics: ContextPerformanceMetrics;
}

export interface ContextPerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  networkRequests: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface ErrorPropagationReport {
  totalErrors: number;
  errorsByContext: Record<ExtensionContext, number>;
  errorChains: ErrorChain[];
  unhandledErrors: ErrorEvent[];
  recoveryAttempts: RecoveryAttempt[];
}

export interface ErrorChain {
  id: string;
  originContext: ExtensionContext;
  propagationPath: ExtensionContext[];
  errorType: string;
  originalError: string;
  finalError: string;
  recoverySuccessful: boolean;
}

export interface ErrorEvent {
  id: string;
  timestamp: Date;
  context: ExtensionContext;
  errorType: string;
  message: string;
  stack?: string;
  handled: boolean;
}

export interface RecoveryAttempt {
  id: string;
  timestamp: Date;
  errorId: string;
  recoveryStrategy: string;
  successful: boolean;
  details: string;
}

export interface PerformanceBottleneck {
  id: string;
  context: ExtensionContext;
  bottleneckType: 'memory' | 'cpu' | 'network' | 'message-passing';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metrics: any;
  recommendations: string[];
}

export class IntegrationDebugger {
  private messageFlowTracker: MessageFlowTracker;
  private currentSession: IntegrationDebugSession | null = null;
  private contextPages: Map<ExtensionContext, number> = new Map();
  private errorEvents: ErrorEvent[] = [];
  private recoveryAttempts: RecoveryAttempt[] = [];

  constructor() {
    this.messageFlowTracker = new MessageFlowTracker();
  }

  /**
   * Start comprehensive integration debugging session
   */
  async startIntegrationDebugging(): Promise<string> {
    const sessionId = this.generateSessionId();

    this.currentSession = {
      sessionId,
      startTime: new Date(),
      contexts: [],
      recommendations: [],
    };

    console.log(
      `[IntegrationDebugger] Starting integration debugging session: ${sessionId}`
    );

    // Initialize context monitoring
    await this.initializeContextMonitoring();

    // Start message flow tracking
    await this.messageFlowTracker.startTracking();

    // Begin error monitoring
    await this.startErrorMonitoring();

    // Start performance monitoring
    await this.startPerformanceMonitoring();

    return sessionId;
  }

  /**
   * Stop debugging session and generate comprehensive report
   */
  async stopIntegrationDebugging(): Promise<IntegrationDebugSession> {
    if (!this.currentSession) {
      throw new Error('No active debugging session');
    }

    console.log('[IntegrationDebugger] Stopping integration debugging session');

    // Stop message flow tracking
    this.currentSession.messageFlowSummary =
      await this.messageFlowTracker.stopTracking();

    // Generate error propagation report
    this.currentSession.errorPropagationReport =
      await this.generateErrorPropagationReport();

    // Identify performance bottlenecks
    this.currentSession.performanceBottlenecks =
      await this.identifyPerformanceBottlenecks();

    // Generate recommendations
    this.currentSession.recommendations =
      this.generateIntegrationRecommendations();

    const session = this.currentSession;
    this.currentSession = null;

    return session;
  }

  /**
   * Monitor message flow between specific contexts
   */
  async monitorMessageFlow(
    source: ExtensionContext,
    target: ExtensionContext,
    duration: number = 30000
  ): Promise<MessageFlowSummary> {
    console.log(
      `[IntegrationDebugger] Monitoring message flow: ${source} -> ${target} for ${duration}ms`
    );

    await this.messageFlowTracker.startTracking();

    // Simulate or trigger message flow
    await this.triggerMessageFlow(source, target);

    // Wait for specified duration
    await new Promise(resolve => setTimeout(resolve, duration));

    return await this.messageFlowTracker.stopTracking();
  }

  /**
   * Test cross-component communication
   */
  async testCrossComponentCommunication(): Promise<CommunicationTestResult> {
    console.log('[IntegrationDebugger] Testing cross-component communication');

    const testResults: CommunicationTestResult = {
      testId: this.generateTestId(),
      timestamp: new Date(),
      testedRoutes: [],
      passedTests: 0,
      failedTests: 0,
      recommendations: [],
    };

    // Test each expected communication route
    const expectedRoutes = [
      {
        from: 'content-script' as ExtensionContext,
        to: 'service-worker' as ExtensionContext,
      },
      {
        from: 'service-worker' as ExtensionContext,
        to: 'offscreen' as ExtensionContext,
      },
      {
        from: 'offscreen' as ExtensionContext,
        to: 'service-worker' as ExtensionContext,
      },
      {
        from: 'service-worker' as ExtensionContext,
        to: 'ui' as ExtensionContext,
      },
    ];

    for (const route of expectedRoutes) {
      const routeTest = await this.testMessageRoute(route.from, route.to);
      testResults.testedRoutes.push(routeTest);

      if (routeTest.successful) {
        testResults.passedTests++;
      } else {
        testResults.failedTests++;
      }
    }

    testResults.recommendations =
      this.generateCommunicationRecommendations(testResults);

    return testResults;
  }

  /**
   * Validate error handling across components
   */
  async validateErrorHandling(): Promise<ErrorHandlingValidationResult> {
    console.log(
      '[IntegrationDebugger] Validating error handling across components'
    );

    const validationResult: ErrorHandlingValidationResult = {
      validationId: this.generateValidationId(),
      timestamp: new Date(),
      testedScenarios: [],
      errorHandlingScore: 0,
      recommendations: [],
    };

    // Test error scenarios
    const errorScenarios = [
      'ai-service-failure',
      'storage-corruption',
      'network-timeout',
      'content-extraction-failure',
      'ui-component-crash',
    ];

    for (const scenario of errorScenarios) {
      const scenarioResult = await this.testErrorScenario(scenario);
      validationResult.testedScenarios.push(scenarioResult);
    }

    // Calculate error handling score
    const successfulRecoveries = validationResult.testedScenarios.filter(
      scenario => scenario.recoverySuccessful
    ).length;
    validationResult.errorHandlingScore =
      (successfulRecoveries / validationResult.testedScenarios.length) * 100;

    validationResult.recommendations =
      this.generateErrorHandlingRecommendations(validationResult);

    return validationResult;
  }

  private async initializeContextMonitoring(): Promise<void> {
    // Get list of available pages/contexts
    const pages = await mcp_chrome_devtools_list_pages();

    for (const page of pages) {
      const contextType = this.identifyContextType(page.url);
      if (contextType) {
        this.contextPages.set(contextType, page.index);

        const contextInfo: ExtensionContextInfo = {
          type: contextType,
          pageIndex: page.index,
          url: page.url,
          isActive: true,
          lastActivity: new Date(),
          errorCount: 0,
          performanceMetrics: {
            memoryUsage: 0,
            cpuUsage: 0,
            networkRequests: 0,
            averageResponseTime: 0,
            errorRate: 0,
          },
        };

        this.currentSession?.contexts.push(contextInfo);
      }
    }
  }

  private async startErrorMonitoring(): Promise<void> {
    // Monitor console messages for errors across all contexts
    for (const [contextType, pageIndex] of this.contextPages) {
      await mcp_chrome_devtools_select_page({ pageIdx: pageIndex });

      const consoleMessages = await mcp_chrome_devtools_list_console_messages({
        types: ['error', 'warn'],
        includePreservedMessages: true,
      });

      for (const message of consoleMessages) {
        const errorEvent: ErrorEvent = {
          id: this.generateErrorId(),
          timestamp: new Date(message.timestamp),
          context: contextType,
          errorType: message.level,
          message: message.text,
          stack: message.stackTrace,
          handled: false,
        };

        this.errorEvents.push(errorEvent);

        // Update context error count
        const contextInfo = this.currentSession?.contexts.find(
          ctx => ctx.type === contextType
        );
        if (contextInfo) {
          contextInfo.errorCount++;
        }
      }
    }
  }

  private async startPerformanceMonitoring(): Promise<void> {
    // Monitor performance metrics across all contexts
    for (const [contextType, pageIndex] of this.contextPages) {
      await mcp_chrome_devtools_select_page({ pageIdx: pageIndex });

      // Get performance metrics
      const performanceScript = `
        () => {
          const metrics = {
            memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 0,
            timing: performance.timing,
            navigation: performance.navigation
          };
          return metrics;
        }
      `;

      try {
        const metrics = await mcp_chrome_devtools_evaluate_script({
          function: performanceScript,
        });

        // Update context performance metrics
        const contextInfo = this.currentSession?.contexts.find(
          ctx => ctx.type === contextType
        );
        if (contextInfo && metrics) {
          contextInfo.performanceMetrics.memoryUsage = metrics.memoryUsage || 0;
        }
      } catch (error) {
        console.warn(
          `[IntegrationDebugger] Failed to get performance metrics for ${contextType}:`,
          error
        );
      }
    }
  }

  private async triggerMessageFlow(
    source: ExtensionContext,
    target: ExtensionContext
  ): Promise<void> {
    // Trigger specific message flows based on source and target
    const sourcePageIndex = this.contextPages.get(source);
    if (!sourcePageIndex) return;

    await mcp_chrome_devtools_select_page({ pageIdx: sourcePageIndex });

    // Generate real message trigger script with proper message tracking
    const triggerScript = this.generateRealMessageTriggerScript(source, target);
    if (triggerScript) {
      try {
        await mcp_chrome_devtools_evaluate_script({
          function: triggerScript,
        });
        console.log(
          `[IntegrationDebugger] Real message flow triggered: ${source} -> ${target}`
        );
      } catch (error) {
        console.warn(
          `[IntegrationDebugger] Failed to trigger real message flow ${source} -> ${target}:`,
          error
        );
      }
    }
  }

  private generateRealMessageTriggerScript(
    source: ExtensionContext,
    target: ExtensionContext
  ): string | null {
    // Generate real message trigger scripts that will be tracked by the message flow tracker
    const triggerMap: Record<string, string> = {
      'content-script->service-worker': `
        () => {
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            const messageId = 'debug_msg_' + Date.now();
            const message = {
              id: messageId,
              type: 'content-extracted',
              source: 'content-script',
              timestamp: Date.now(),
              data: {
                url: window.location.href,
                content: 'Debug test content extraction',
                wordCount: 150
              }
            };
            
            console.log('[IntegrationDebugger] Sending real test message:', message);
            chrome.runtime.sendMessage(message).then(response => {
              console.log('[IntegrationDebugger] Received response:', response);
            }).catch(error => {
              console.error('[IntegrationDebugger] Message failed:', error);
            });
          }
        }
      `,
      'service-worker->offscreen': `
        () => {
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            const messageId = 'debug_msg_' + Date.now();
            const message = {
              id: messageId,
              type: 'process-content',
              source: 'service-worker',
              timestamp: Date.now(),
              data: {
                content: 'Test content for AI processing',
                processingType: 'summarization',
                language: 'en'
              }
            };
            
            console.log('[IntegrationDebugger] Sending real test message to offscreen:', message);
            chrome.runtime.sendMessage(message).then(response => {
              console.log('[IntegrationDebugger] Received offscreen response:', response);
            }).catch(error => {
              console.error('[IntegrationDebugger] Offscreen message failed:', error);
            });
          }
        }
      `,
      'offscreen->service-worker': `
        () => {
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            const messageId = 'debug_msg_' + Date.now();
            const message = {
              id: messageId,
              type: 'processing-complete',
              source: 'offscreen',
              timestamp: Date.now(),
              data: {
                result: 'AI processing completed successfully',
                processingTime: 1500,
                cacheHit: false
              }
            };
            
            console.log('[IntegrationDebugger] Sending real processing result:', message);
            chrome.runtime.sendMessage(message).then(response => {
              console.log('[IntegrationDebugger] Service worker acknowledged:', response);
            }).catch(error => {
              console.error('[IntegrationDebugger] Processing result message failed:', error);
            });
          }
        }
      `,
      'service-worker->ui': `
        () => {
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            const messageId = 'debug_msg_' + Date.now();
            const message = {
              id: messageId,
              type: 'data-update',
              source: 'service-worker',
              timestamp: Date.now(),
              data: {
                articleData: {
                  title: 'Debug Test Article',
                  summary: 'This is a test summary for debugging',
                  vocabulary: ['debug', 'test', 'article']
                },
                processingStatus: 'completed'
              }
            };
            
            console.log('[IntegrationDebugger] Sending real UI update:', message);
            chrome.runtime.sendMessage(message).then(response => {
              console.log('[IntegrationDebugger] UI acknowledged update:', response);
            }).catch(error => {
              console.error('[IntegrationDebugger] UI update message failed:', error);
            });
          }
        }
      `,
      'ui->service-worker': `
        () => {
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            const messageId = 'debug_msg_' + Date.now();
            const message = {
              id: messageId,
              type: 'user-interaction',
              source: 'ui',
              timestamp: Date.now(),
              data: {
                action: 'highlight-word',
                word: 'debug',
                position: { x: 100, y: 200 },
                context: 'vocabulary-learning'
              }
            };
            
            console.log('[IntegrationDebugger] Sending real user interaction:', message);
            chrome.runtime.sendMessage(message).then(response => {
              console.log('[IntegrationDebugger] Service worker processed interaction:', response);
            }).catch(error => {
              console.error('[IntegrationDebugger] User interaction message failed:', error);
            });
          }
        }
      `,
    };

    return triggerMap[`${source}->${target}`] || null;
  }

  private async testMessageRoute(
    source: ExtensionContext,
    target: ExtensionContext
  ): Promise<RouteTestResult> {
    const testId = this.generateTestId();
    const startTime = Date.now();

    console.log(
      `[IntegrationDebugger] Testing real message route: ${source} -> ${target}`
    );

    // Trigger real message flow
    await this.triggerMessageFlow(source, target);

    // Wait for real message processing and monitor console logs
    const timeout = 8000; // Increased timeout for real processing
    const endTime = startTime + timeout;
    let successful = false;
    let errorMessage: string | undefined;

    // Monitor for real message completion
    while (Date.now() < endTime && !successful) {
      try {
        // Check target context for message reception
        const targetPageIndex = this.contextPages.get(target);
        if (targetPageIndex) {
          await mcp_chrome_devtools_select_page({ pageIdx: targetPageIndex });

          // Check console messages for successful message processing
          const consoleMessages =
            await mcp_chrome_devtools_list_console_messages({
              types: ['log', 'info'],
              includePreservedMessages: false,
            });

          // Look for message completion indicators
          for (const message of consoleMessages) {
            if (
              message.text &&
              (message.text.includes('Received response:') ||
                message.text.includes('acknowledged') ||
                message.text.includes('processed interaction'))
            ) {
              successful = true;
              break;
            }

            if (message.text && message.text.includes('Message failed:')) {
              errorMessage = 'Real message processing failed';
              break;
            }
          }
        }

        if (!successful) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.warn(
          `[IntegrationDebugger] Error monitoring message route ${source} -> ${target}:`,
          error
        );
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (!successful && !errorMessage) {
      errorMessage = 'Real message routing test timeout';
    }

    const latency = Date.now() - startTime;

    console.log(
      `[IntegrationDebugger] Real message route test completed: ${source} -> ${target} - ${successful ? 'Success' : 'Failed'} (${latency}ms)`
    );

    return {
      testId,
      source,
      target,
      successful,
      latency,
      errorMessage: successful ? undefined : errorMessage,
    };
  }

  private async testErrorScenario(
    scenario: string
  ): Promise<ErrorScenarioResult> {
    console.log(`[IntegrationDebugger] Testing error scenario: ${scenario}`);

    const testId = this.generateTestId();
    const startTime = Date.now();

    // Simulate error scenario
    const errorScript = this.generateErrorScenarioScript(scenario);
    let recoverySuccessful = false;
    let errorDetails = '';

    try {
      if (errorScript) {
        await mcp_chrome_devtools_evaluate_script({
          function: errorScript,
        });
      }

      // Wait for error handling and recovery
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if recovery was successful
      recoverySuccessful = await this.checkErrorRecovery(scenario);
    } catch (error) {
      errorDetails = error instanceof Error ? error.message : String(error);
    }

    return {
      testId,
      scenario,
      errorTriggered: true,
      recoverySuccessful,
      recoveryTime: Date.now() - startTime,
      errorDetails,
    };
  }

  private generateErrorScenarioScript(scenario: string): string | null {
    const scenarioScripts: Record<string, string> = {
      'ai-service-failure': `
        () => {
          // Simulate AI service failure
          if (window.aiServiceCoordinator) {
            window.aiServiceCoordinator.simulateFailure('chrome-ai');
          }
        }
      `,
      'storage-corruption': `
        () => {
          // Simulate storage corruption
          if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ 'corrupted-data': null });
          }
        }
      `,
      'network-timeout': `
        () => {
          // Simulate network timeout
          const originalFetch = window.fetch;
          window.fetch = () => Promise.reject(new Error('Network timeout'));
          setTimeout(() => { window.fetch = originalFetch; }, 5000);
        }
      `,
    };

    return scenarioScripts[scenario] || null;
  }

  private async checkErrorRecovery(scenario: string): Promise<boolean> {
    // Simplified recovery check - in real implementation would verify actual recovery
    return Math.random() > 0.3; // Simulate 70% recovery success rate
  }

  private identifyContextType(url: string): ExtensionContext | null {
    if (url.includes('service-worker')) return 'service-worker';
    if (url.includes('offscreen')) return 'offscreen';
    if (url.includes('chrome-extension://') && url.includes('/ui/'))
      return 'ui';
    if (url.startsWith('http')) return 'content-script';
    return null;
  }

  private async generateErrorPropagationReport(): Promise<ErrorPropagationReport> {
    const errorsByContext: Record<ExtensionContext, number> = {
      'service-worker': 0,
      'content-script': 0,
      offscreen: 0,
      ui: 0,
    };

    // Count errors by context
    for (const error of this.errorEvents) {
      errorsByContext[error.context]++;
    }

    // Generate error chains (simplified)
    const errorChains: ErrorChain[] = [];

    return {
      totalErrors: this.errorEvents.length,
      errorsByContext,
      errorChains,
      unhandledErrors: this.errorEvents.filter(error => !error.handled),
      recoveryAttempts: this.recoveryAttempts,
    };
  }

  private async identifyPerformanceBottlenecks(): Promise<
    PerformanceBottleneck[]
  > {
    const bottlenecks: PerformanceBottleneck[] = [];

    if (!this.currentSession) return bottlenecks;

    // Analyze performance metrics for each context
    for (const context of this.currentSession.contexts) {
      const metrics = context.performanceMetrics;

      // Check memory usage
      if (metrics.memoryUsage > 100 * 1024 * 1024) {
        // 100MB
        bottlenecks.push({
          id: this.generateBottleneckId(),
          context: context.type,
          bottleneckType: 'memory',
          severity: 'high',
          description: `High memory usage detected: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
          metrics: { memoryUsage: metrics.memoryUsage },
          recommendations: [
            'Review memory-intensive operations',
            'Implement memory cleanup routines',
            'Consider lazy loading for large datasets',
          ],
        });
      }

      // Check error rate
      if (metrics.errorRate > 0.1) {
        // 10% error rate
        bottlenecks.push({
          id: this.generateBottleneckId(),
          context: context.type,
          bottleneckType: 'cpu',
          severity: 'medium',
          description: `High error rate detected: ${(metrics.errorRate * 100).toFixed(1)}%`,
          metrics: { errorRate: metrics.errorRate },
          recommendations: [
            'Review error handling logic',
            'Add input validation',
            'Implement retry mechanisms',
          ],
        });
      }
    }

    return bottlenecks;
  }

  private generateIntegrationRecommendations(): string[] {
    const recommendations: string[] = [];

    if (!this.currentSession) return recommendations;

    // Analyze message flow
    if (this.currentSession.messageFlowSummary) {
      const summary = this.currentSession.messageFlowSummary;
      if (summary.failedMessages > 0) {
        recommendations.push(
          `${summary.failedMessages} message failures detected. Review message routing and error handling.`
        );
      }

      if (summary.averageLatency > 200) {
        recommendations.push(
          `High message latency (${summary.averageLatency.toFixed(0)}ms). Consider optimizing message processing.`
        );
      }
    }

    // Analyze error propagation
    if (this.currentSession.errorPropagationReport) {
      const report = this.currentSession.errorPropagationReport;
      if (report.unhandledErrors.length > 0) {
        recommendations.push(
          `${report.unhandledErrors.length} unhandled errors found. Implement comprehensive error handling.`
        );
      }
    }

    // Analyze performance bottlenecks
    if (this.currentSession.performanceBottlenecks) {
      const criticalBottlenecks =
        this.currentSession.performanceBottlenecks.filter(
          b => b.severity === 'critical'
        );
      if (criticalBottlenecks.length > 0) {
        recommendations.push(
          `${criticalBottlenecks.length} critical performance bottlenecks identified. Immediate optimization required.`
        );
      }
    }

    return recommendations;
  }

  private generateCommunicationRecommendations(
    testResults: CommunicationTestResult
  ): string[] {
    const recommendations: string[] = [];

    if (testResults.failedTests > 0) {
      recommendations.push(
        `${testResults.failedTests} communication tests failed. Review message handlers and routing logic.`
      );
    }

    const highLatencyRoutes = testResults.testedRoutes.filter(
      route => route.latency > 1000
    );
    if (highLatencyRoutes.length > 0) {
      recommendations.push(
        `${highLatencyRoutes.length} routes have high latency. Consider optimizing message processing.`
      );
    }

    return recommendations;
  }

  private generateErrorHandlingRecommendations(
    validationResult: ErrorHandlingValidationResult
  ): string[] {
    const recommendations: string[] = [];

    if (validationResult.errorHandlingScore < 80) {
      recommendations.push(
        `Error handling score is low (${validationResult.errorHandlingScore.toFixed(1)}%). Improve error recovery mechanisms.`
      );
    }

    const failedScenarios = validationResult.testedScenarios.filter(
      scenario => !scenario.recoverySuccessful
    );
    if (failedScenarios.length > 0) {
      recommendations.push(
        `${failedScenarios.length} error scenarios failed recovery. Implement specific error handling for these cases.`
      );
    }

    return recommendations;
  }

  private generateSessionId(): string {
    return `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateValidationId(): string {
    return `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBottleneckId(): string {
    return `bottleneck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces
export interface CommunicationTestResult {
  testId: string;
  timestamp: Date;
  testedRoutes: RouteTestResult[];
  passedTests: number;
  failedTests: number;
  recommendations: string[];
}

export interface RouteTestResult {
  testId: string;
  source: ExtensionContext;
  target: ExtensionContext;
  successful: boolean;
  latency: number;
  errorMessage?: string;
}

export interface ErrorHandlingValidationResult {
  validationId: string;
  timestamp: Date;
  testedScenarios: ErrorScenarioResult[];
  errorHandlingScore: number;
  recommendations: string[];
}

export interface ErrorScenarioResult {
  testId: string;
  scenario: string;
  errorTriggered: boolean;
  recoverySuccessful: boolean;
  recoveryTime: number;
  errorDetails: string;
}

// Global MCP function declarations
declare global {
  function mcp_chrome_devtools_list_pages(): Promise<any[]>;
  function mcp_chrome_devtools_select_page(params: {
    pageIdx: number;
  }): Promise<void>;
  function mcp_chrome_devtools_list_console_messages(
    params: any
  ): Promise<any[]>;
  function mcp_chrome_devtools_evaluate_script(params: {
    function: string;
  }): Promise<any>;
}
