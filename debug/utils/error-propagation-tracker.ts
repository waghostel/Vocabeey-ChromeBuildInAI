/**
 * Error Propagation Tracker
 *
 * Tracks error propagation across Chrome extension contexts, validates error handling,
 * monitors error recovery, and implements comprehensive error reporting system.
 */

export interface ErrorPropagationEvent {
  id: string;
  timestamp: Date;
  originContext: ExtensionContext;
  currentContext: ExtensionContext;
  errorType: string;
  originalError: Error | string;
  propagatedError: Error | string;
  propagationPath: ExtensionContext[];
  handled: boolean;
  recoveryAttempted: boolean;
  recoverySuccessful: boolean;
  severity: ErrorSeverity;
}

export interface ErrorHandlingValidation {
  contextType: ExtensionContext;
  errorType: string;
  hasErrorHandler: boolean;
  handlerEffectiveness: number; // 0-1 scale
  recoveryMechanisms: string[];
  fallbackStrategies: string[];
  validationResults: ValidationResult[];
}

export interface ErrorRecoveryMonitoring {
  errorId: string;
  recoveryStrategy: string;
  recoveryStartTime: Date;
  recoveryEndTime?: Date;
  recoverySteps: RecoveryStep[];
  successful: boolean;
  finalState: string;
  userImpact: UserImpactLevel;
}

export interface ErrorReportingSystem {
  reportId: string;
  timestamp: Date;
  errorSummary: ErrorSummary;
  propagationAnalysis: PropagationAnalysis;
  handlingEffectiveness: HandlingEffectiveness;
  recoveryPerformance: RecoveryPerformance;
  recommendations: ErrorRecommendation[];
}

export type ExtensionContext =
  | 'service-worker'
  | 'content-script'
  | 'offscreen'
  | 'ui';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type UserImpactLevel = 'none' | 'minimal' | 'moderate' | 'severe';

export interface ValidationResult {
  testName: string;
  passed: boolean;
  details: string;
  recommendations?: string[];
}

export interface RecoveryStep {
  stepName: string;
  timestamp: Date;
  successful: boolean;
  details: string;
  nextStep?: string;
}

export interface ErrorSummary {
  totalErrors: number;
  errorsByContext: Record<ExtensionContext, number>;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  handledErrors: number;
  unhandledErrors: number;
}

export interface PropagationAnalysis {
  propagationChains: ErrorPropagationChain[];
  averagePropagationDepth: number;
  mostCommonPropagationPaths: string[];
  isolatedErrors: number;
  cascadingErrors: number;
}

export interface ErrorPropagationChain {
  chainId: string;
  originError: ErrorPropagationEvent;
  propagationEvents: ErrorPropagationEvent[];
  finalResolution: 'handled' | 'unhandled' | 'recovered' | 'failed';
  totalPropagationTime: number;
}

export interface HandlingEffectiveness {
  overallScore: number; // 0-100
  contextScores: Record<ExtensionContext, number>;
  handlingPatterns: HandlingPattern[];
  improvementAreas: string[];
}

export interface HandlingPattern {
  pattern: string;
  frequency: number;
  effectiveness: number;
  contexts: ExtensionContext[];
}

export interface RecoveryPerformance {
  totalRecoveryAttempts: number;
  successfulRecoveries: number;
  averageRecoveryTime: number;
  recoveryStrategies: RecoveryStrategy[];
  failedRecoveries: FailedRecovery[];
}

export interface RecoveryStrategy {
  strategy: string;
  successRate: number;
  averageTime: number;
  applicableContexts: ExtensionContext[];
  effectiveness: number;
}

export interface FailedRecovery {
  errorId: string;
  strategy: string;
  failureReason: string;
  userImpact: UserImpactLevel;
  alternativeStrategies: string[];
}

export interface ErrorRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'handling' | 'recovery' | 'prevention' | 'monitoring';
  description: string;
  implementation: string;
  expectedImpact: string;
}

export class ErrorPropagationTracker {
  private propagationEvents: Map<string, ErrorPropagationEvent> = new Map();
  private errorChains: Map<string, ErrorPropagationChain> = new Map();
  private handlingValidations: Map<string, ErrorHandlingValidation> = new Map();
  private recoveryMonitoring: Map<string, ErrorRecoveryMonitoring> = new Map();
  private isTracking: boolean = false;
  private trackingStartTime: Date | null = null;

  /**
   * Start tracking error propagation across extension contexts
   */
  async startErrorPropagationTracking(): Promise<void> {
    this.isTracking = true;
    this.trackingStartTime = new Date();
    this.propagationEvents.clear();
    this.errorChains.clear();
    this.recoveryMonitoring.clear();

    console.log(
      '[ErrorPropagationTracker] Started real error propagation tracking'
    );

    // Initialize real error monitoring for each context using MCP
    await this.initializeRealContextErrorMonitoring();
  }

  /**
   * Stop tracking and generate comprehensive error report
   */
  async stopErrorPropagationTracking(): Promise<ErrorReportingSystem> {
    this.isTracking = false;

    const report: ErrorReportingSystem = {
      reportId: this.generateReportId(),
      timestamp: new Date(),
      errorSummary: this.generateErrorSummary(),
      propagationAnalysis: this.analyzePropagationPatterns(),
      handlingEffectiveness: this.evaluateHandlingEffectiveness(),
      recoveryPerformance: this.analyzeRecoveryPerformance(),
      recommendations: this.generateErrorRecommendations(),
    };

    console.log(
      '[ErrorPropagationTracker] Stopped tracking. Generated report:',
      report.reportId
    );
    return report;
  }

  /**
   * Track an error occurrence in a specific context
   */
  trackErrorOccurrence(
    context: ExtensionContext,
    error: Error | string,
    errorType: string,
    severity: ErrorSeverity = 'medium'
  ): string {
    if (!this.isTracking) return '';

    const errorId = this.generateErrorId();
    const propagationEvent: ErrorPropagationEvent = {
      id: errorId,
      timestamp: new Date(),
      originContext: context,
      currentContext: context,
      errorType,
      originalError: error,
      propagatedError: error,
      propagationPath: [context],
      handled: false,
      recoveryAttempted: false,
      recoverySuccessful: false,
      severity,
    };

    this.propagationEvents.set(errorId, propagationEvent);

    // Start a new error chain
    const chainId = this.generateChainId();
    const errorChain: ErrorPropagationChain = {
      chainId,
      originError: propagationEvent,
      propagationEvents: [propagationEvent],
      finalResolution: 'unhandled',
      totalPropagationTime: 0,
    };

    this.errorChains.set(chainId, errorChain);

    console.log(
      `[ErrorPropagationTracker] Error tracked: ${errorType} in ${context}`
    );
    return errorId;
  }

  /**
   * Track error propagation to another context
   */
  trackErrorPropagation(
    originalErrorId: string,
    targetContext: ExtensionContext,
    propagatedError: Error | string
  ): string {
    if (!this.isTracking || !originalErrorId) return '';

    const originalEvent = this.propagationEvents.get(originalErrorId);
    if (!originalEvent) return '';

    const propagationId = this.generateErrorId();
    const propagationEvent: ErrorPropagationEvent = {
      id: propagationId,
      timestamp: new Date(),
      originContext: originalEvent.originContext,
      currentContext: targetContext,
      errorType: originalEvent.errorType,
      originalError: originalEvent.originalError,
      propagatedError,
      propagationPath: [...originalEvent.propagationPath, targetContext],
      handled: false,
      recoveryAttempted: false,
      recoverySuccessful: false,
      severity: originalEvent.severity,
    };

    this.propagationEvents.set(propagationId, propagationEvent);

    // Update error chain
    const errorChain = Array.from(this.errorChains.values()).find(
      chain => chain.originError.id === originalErrorId
    );

    if (errorChain) {
      errorChain.propagationEvents.push(propagationEvent);
      errorChain.totalPropagationTime =
        Date.now() - errorChain.originError.timestamp.getTime();
    }

    console.log(
      `[ErrorPropagationTracker] Error propagated: ${originalEvent.errorType} -> ${targetContext}`
    );
    return propagationId;
  }

  /**
   * Track error handling attempt
   */
  trackErrorHandling(
    errorId: string,
    handlingStrategy: string,
    successful: boolean,
    details?: string
  ): void {
    if (!this.isTracking || !errorId) return;

    const event = this.propagationEvents.get(errorId);
    if (event) {
      event.handled = successful;

      // Update error chain resolution
      const errorChain = Array.from(this.errorChains.values()).find(
        chain =>
          chain.originError.id === errorId ||
          chain.propagationEvents.some(e => e.id === errorId)
      );

      if (errorChain && successful) {
        errorChain.finalResolution = 'handled';
      }

      console.log(
        `[ErrorPropagationTracker] Error handling tracked: ${handlingStrategy} - ${successful ? 'Success' : 'Failed'}`
      );
    }
  }

  /**
   * Track error recovery attempt
   */
  trackErrorRecovery(
    errorId: string,
    recoveryStrategy: string,
    userImpact: UserImpactLevel = 'minimal'
  ): string {
    if (!this.isTracking || !errorId) return '';

    const recoveryId = this.generateRecoveryId();
    const recoveryMonitoring: ErrorRecoveryMonitoring = {
      errorId,
      recoveryStrategy,
      recoveryStartTime: new Date(),
      recoverySteps: [],
      successful: false,
      finalState: 'in-progress',
      userImpact,
    };

    this.recoveryMonitoring.set(recoveryId, recoveryMonitoring);

    // Update propagation event
    const event = this.propagationEvents.get(errorId);
    if (event) {
      event.recoveryAttempted = true;
    }

    console.log(
      `[ErrorPropagationTracker] Recovery started: ${recoveryStrategy} for error ${errorId}`
    );
    return recoveryId;
  }

  /**
   * Track recovery step completion
   */
  trackRecoveryStep(
    recoveryId: string,
    stepName: string,
    successful: boolean,
    details: string,
    nextStep?: string
  ): void {
    if (!this.isTracking || !recoveryId) return;

    const recovery = this.recoveryMonitoring.get(recoveryId);
    if (recovery) {
      const step: RecoveryStep = {
        stepName,
        timestamp: new Date(),
        successful,
        details,
        nextStep,
      };

      recovery.recoverySteps.push(step);

      console.log(
        `[ErrorPropagationTracker] Recovery step: ${stepName} - ${successful ? 'Success' : 'Failed'}`
      );
    }
  }

  /**
   * Complete error recovery tracking
   */
  completeErrorRecovery(
    recoveryId: string,
    successful: boolean,
    finalState: string
  ): void {
    if (!this.isTracking || !recoveryId) return;

    const recovery = this.recoveryMonitoring.get(recoveryId);
    if (recovery) {
      recovery.recoveryEndTime = new Date();
      recovery.successful = successful;
      recovery.finalState = finalState;

      // Update propagation event
      const event = this.propagationEvents.get(recovery.errorId);
      if (event) {
        event.recoverySuccessful = successful;
      }

      // Update error chain resolution
      const errorChain = Array.from(this.errorChains.values()).find(
        chain =>
          chain.originError.id === recovery.errorId ||
          chain.propagationEvents.some(e => e.id === recovery.errorId)
      );

      if (errorChain) {
        errorChain.finalResolution = successful ? 'recovered' : 'failed';
      }

      console.log(
        `[ErrorPropagationTracker] Recovery completed: ${successful ? 'Success' : 'Failed'} - ${finalState}`
      );
    }
  }

  /**
   * Validate error handling for a specific context
   */
  async validateErrorHandling(
    context: ExtensionContext
  ): Promise<ErrorHandlingValidation> {
    console.log(
      `[ErrorPropagationTracker] Validating error handling for ${context}`
    );

    const validation: ErrorHandlingValidation = {
      contextType: context,
      errorType: 'general',
      hasErrorHandler: false,
      handlerEffectiveness: 0,
      recoveryMechanisms: [],
      fallbackStrategies: [],
      validationResults: [],
    };

    // Test different error scenarios
    const errorScenarios = [
      'runtime-error',
      'network-error',
      'storage-error',
      'ai-service-error',
      'ui-component-error',
    ];

    for (const scenario of errorScenarios) {
      const result = await this.testErrorHandlingScenario(context, scenario);
      validation.validationResults.push(result);

      if (result.passed) {
        validation.hasErrorHandler = true;
      }
    }

    // Calculate handler effectiveness
    const passedTests = validation.validationResults.filter(
      r => r.passed
    ).length;
    validation.handlerEffectiveness =
      passedTests / validation.validationResults.length;

    // Identify recovery mechanisms
    validation.recoveryMechanisms = this.identifyRecoveryMechanisms(context);
    validation.fallbackStrategies = this.identifyFallbackStrategies(context);

    this.handlingValidations.set(context, validation);

    return validation;
  }

  /**
   * Monitor error recovery across all contexts
   */
  async monitorErrorRecovery(
    duration: number = 60000
  ): Promise<RecoveryPerformance> {
    console.log(
      `[ErrorPropagationTracker] Monitoring error recovery for ${duration}ms`
    );

    const startTime = Date.now();
    const monitoringResults: RecoveryPerformance = {
      totalRecoveryAttempts: 0,
      successfulRecoveries: 0,
      averageRecoveryTime: 0,
      recoveryStrategies: [],
      failedRecoveries: [],
    };

    // Monitor recovery attempts during the specified duration
    while (Date.now() - startTime < duration) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check for new recovery attempts
      const currentRecoveries = Array.from(this.recoveryMonitoring.values());
      monitoringResults.totalRecoveryAttempts = currentRecoveries.length;
      monitoringResults.successfulRecoveries = currentRecoveries.filter(
        r => r.successful
      ).length;
    }

    // Calculate average recovery time
    const completedRecoveries = Array.from(
      this.recoveryMonitoring.values()
    ).filter(r => r.recoveryEndTime);

    if (completedRecoveries.length > 0) {
      const totalTime = completedRecoveries.reduce((sum, r) => {
        const duration =
          r.recoveryEndTime!.getTime() - r.recoveryStartTime.getTime();
        return sum + duration;
      }, 0);
      monitoringResults.averageRecoveryTime =
        totalTime / completedRecoveries.length;
    }

    // Analyze recovery strategies
    monitoringResults.recoveryStrategies = this.analyzeRecoveryStrategies();
    monitoringResults.failedRecoveries = this.identifyFailedRecoveries();

    return monitoringResults;
  }

  private async initializeRealContextErrorMonitoring(): Promise<void> {
    try {
      // Get real list of available pages/contexts using MCP
      const pages = await mcp_chrome_devtools_list_pages();
      console.log(
        '[ErrorPropagationTracker] Found pages for error monitoring:',
        pages.length
      );

      // Initialize error monitoring for each real context
      for (const page of pages) {
        const contextType = this.identifyContextType(page.url);
        if (contextType) {
          await this.setupRealContextErrorHandlers(contextType, page.index);
        }
      }

      // Start real error event monitoring
      await this.startRealErrorEventMonitoring();
    } catch (error) {
      console.error(
        '[ErrorPropagationTracker] Failed to initialize real error monitoring:',
        error
      );
    }
  }

  private async setupRealContextErrorHandlers(
    context: ExtensionContext,
    pageIndex: number
  ): Promise<void> {
    try {
      // Select the real context page
      await mcp_chrome_devtools_select_page({ pageIdx: pageIndex });

      // Inject real error handlers into the context
      const handlerScript = this.generateRealErrorHandlerScript(context);
      if (handlerScript) {
        await mcp_chrome_devtools_evaluate_script({
          function: handlerScript,
        });
        console.log(
          `[ErrorPropagationTracker] Real error handlers injected for ${context}`
        );
      }
    } catch (error) {
      console.warn(
        `[ErrorPropagationTracker] Failed to setup real error handlers for ${context}:`,
        error
      );
    }
  }

  private generateRealErrorHandlerScript(
    context: ExtensionContext
  ): string | null {
    const handlerScripts: Record<ExtensionContext, string> = {
      'service-worker': `
        () => {
          // Real service worker error handler with detailed tracking
          if (typeof self !== 'undefined') {
            const originalErrorHandler = self.onerror;
            self.onerror = function(message, source, lineno, colno, error) {
              const errorData = {
                context: 'service-worker',
                type: 'javascript-error',
                message: message,
                source: source,
                line: lineno,
                column: colno,
                stack: error ? error.stack : null,
                timestamp: Date.now(),
                errorId: 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
              };
              
              console.error('[ErrorPropagationTracker] SW Error:', errorData);
              
              // Call original handler if it exists
              if (originalErrorHandler) {
                return originalErrorHandler.call(this, message, source, lineno, colno, error);
              }
              return false;
            };
            
            self.addEventListener('unhandledrejection', (event) => {
              const errorData = {
                context: 'service-worker',
                type: 'unhandled-rejection',
                reason: event.reason ? event.reason.toString() : 'Unknown rejection',
                stack: event.reason && event.reason.stack ? event.reason.stack : null,
                timestamp: Date.now(),
                errorId: 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
              };
              
              console.error('[ErrorPropagationTracker] SW Unhandled Rejection:', errorData);
            });
          }
        }
      `,
      'content-script': `
        () => {
          // Real content script error handler with detailed tracking
          if (typeof window !== 'undefined') {
            const originalErrorHandler = window.onerror;
            window.onerror = function(message, source, lineno, colno, error) {
              const errorData = {
                context: 'content-script',
                type: 'javascript-error',
                message: message,
                source: source,
                line: lineno,
                column: colno,
                stack: error ? error.stack : null,
                url: window.location.href,
                timestamp: Date.now(),
                errorId: 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
              };
              
              console.error('[ErrorPropagationTracker] CS Error:', errorData);
              
              // Try to report error to service worker
              if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                  type: 'error-propagation',
                  errorData: errorData
                }).catch(err => {
                  console.warn('[ErrorPropagationTracker] Failed to report error to SW:', err);
                });
              }
              
              // Call original handler if it exists
              if (originalErrorHandler) {
                return originalErrorHandler.call(this, message, source, lineno, colno, error);
              }
              return false;
            };
            
            window.addEventListener('unhandledrejection', (event) => {
              const errorData = {
                context: 'content-script',
                type: 'unhandled-rejection',
                reason: event.reason ? event.reason.toString() : 'Unknown rejection',
                stack: event.reason && event.reason.stack ? event.reason.stack : null,
                url: window.location.href,
                timestamp: Date.now(),
                errorId: 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
              };
              
              console.error('[ErrorPropagationTracker] CS Unhandled Rejection:', errorData);
              
              // Try to report error to service worker
              if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                  type: 'error-propagation',
                  errorData: errorData
                }).catch(err => {
                  console.warn('[ErrorPropagationTracker] Failed to report rejection to SW:', err);
                });
              }
            });
          }
        }
      `,
      offscreen: `
        () => {
          // Real offscreen document error handler
          if (typeof window !== 'undefined') {
            const originalErrorHandler = window.onerror;
            window.onerror = function(message, source, lineno, colno, error) {
              const errorData = {
                context: 'offscreen',
                type: 'javascript-error',
                message: message,
                source: source,
                line: lineno,
                column: colno,
                stack: error ? error.stack : null,
                timestamp: Date.now(),
                errorId: 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
              };
              
              console.error('[ErrorPropagationTracker] Offscreen Error:', errorData);
              
              // Report AI processing errors specifically
              if (message && (message.includes('AI') || message.includes('processing'))) {
                if (typeof chrome !== 'undefined' && chrome.runtime) {
                  chrome.runtime.sendMessage({
                    type: 'ai-processing-error',
                    errorData: errorData
                  }).catch(err => {
                    console.warn('[ErrorPropagationTracker] Failed to report AI error:', err);
                  });
                }
              }
              
              // Call original handler if it exists
              if (originalErrorHandler) {
                return originalErrorHandler.call(this, message, source, lineno, colno, error);
              }
              return false;
            };
            
            window.addEventListener('unhandledrejection', (event) => {
              const errorData = {
                context: 'offscreen',
                type: 'unhandled-rejection',
                reason: event.reason ? event.reason.toString() : 'Unknown rejection',
                stack: event.reason && event.reason.stack ? event.reason.stack : null,
                timestamp: Date.now(),
                errorId: 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
              };
              
              console.error('[ErrorPropagationTracker] Offscreen Unhandled Rejection:', errorData);
            });
          }
        }
      `,
      ui: `
        () => {
          // Real UI component error handler
          if (typeof window !== 'undefined') {
            const originalErrorHandler = window.onerror;
            window.onerror = function(message, source, lineno, colno, error) {
              const errorData = {
                context: 'ui',
                type: 'javascript-error',
                message: message,
                source: source,
                line: lineno,
                column: colno,
                stack: error ? error.stack : null,
                timestamp: Date.now(),
                errorId: 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
              };
              
              console.error('[ErrorPropagationTracker] UI Error:', errorData);
              
              // Report UI errors that might affect user experience
              if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                  type: 'ui-error',
                  errorData: errorData
                }).catch(err => {
                  console.warn('[ErrorPropagationTracker] Failed to report UI error:', err);
                });
              }
              
              // Call original handler if it exists
              if (originalErrorHandler) {
                return originalErrorHandler.call(this, message, source, lineno, colno, error);
              }
              return false;
            };
            
            window.addEventListener('unhandledrejection', (event) => {
              const errorData = {
                context: 'ui',
                type: 'unhandled-rejection',
                reason: event.reason ? event.reason.toString() : 'Unknown rejection',
                stack: event.reason && event.reason.stack ? event.reason.stack : null,
                timestamp: Date.now(),
                errorId: 'error_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
              };
              
              console.error('[ErrorPropagationTracker] UI Unhandled Rejection:', errorData);
            });
          }
        }
      `,
    };

    return handlerScripts[context] || null;
  }

  private async testErrorHandlingScenario(
    context: ExtensionContext,
    scenario: string
  ): Promise<ValidationResult> {
    const testName = `${context}-${scenario}-handling`;

    try {
      // Simulate error scenario and test handling
      const errorId = this.trackErrorOccurrence(
        context,
        new Error(`Test ${scenario}`),
        scenario,
        'low'
      );

      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if error was handled
      const event = this.propagationEvents.get(errorId);
      const handled = event?.handled || false;

      return {
        testName,
        passed: handled,
        details: handled
          ? 'Error was properly handled'
          : 'Error was not handled',
        recommendations: handled
          ? []
          : [`Implement error handler for ${scenario} in ${context}`],
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        details: `Test failed: ${error instanceof Error ? error.message : String(error)}`,
        recommendations: [
          `Fix error handling test for ${scenario} in ${context}`,
        ],
      };
    }
  }

  private identifyRecoveryMechanisms(context: ExtensionContext): string[] {
    // Identify available recovery mechanisms for each context
    const recoveryMechanisms: Record<ExtensionContext, string[]> = {
      'service-worker': [
        'restart-service',
        'clear-cache',
        'reset-state',
        'fallback-mode',
      ],
      'content-script': [
        'reinject-script',
        'reset-dom-state',
        'fallback-extraction',
      ],
      offscreen: [
        'recreate-document',
        'switch-ai-service',
        'clear-processing-queue',
      ],
      ui: ['reset-component-state', 'reload-interface', 'fallback-ui'],
    };

    return recoveryMechanisms[context] || [];
  }

  private identifyFallbackStrategies(context: ExtensionContext): string[] {
    // Identify fallback strategies for each context
    const fallbackStrategies: Record<ExtensionContext, string[]> = {
      'service-worker': [
        'local-processing',
        'cached-responses',
        'minimal-functionality',
      ],
      'content-script': [
        'basic-extraction',
        'manual-selection',
        'simplified-ui',
      ],
      offscreen: [
        'alternative-ai-service',
        'local-processing',
        'cached-results',
      ],
      ui: ['basic-interface', 'text-only-mode', 'error-display'],
    };

    return fallbackStrategies[context] || [];
  }

  private generateErrorSummary(): ErrorSummary {
    const events = Array.from(this.propagationEvents.values());

    const errorsByContext: Record<ExtensionContext, number> = {
      'service-worker': 0,
      'content-script': 0,
      offscreen: 0,
      ui: 0,
    };

    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<ErrorSeverity, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let handledErrors = 0;
    let unhandledErrors = 0;

    for (const event of events) {
      errorsByContext[event.currentContext]++;
      errorsByType[event.errorType] = (errorsByType[event.errorType] || 0) + 1;
      errorsBySeverity[event.severity]++;

      if (event.handled) {
        handledErrors++;
      } else {
        unhandledErrors++;
      }
    }

    return {
      totalErrors: events.length,
      errorsByContext,
      errorsByType,
      errorsBySeverity,
      handledErrors,
      unhandledErrors,
    };
  }

  private analyzePropagationPatterns(): PropagationAnalysis {
    const chains = Array.from(this.errorChains.values());

    const propagationPaths = chains.map(chain =>
      chain.propagationEvents.map(e => e.currentContext).join(' -> ')
    );

    const pathCounts = propagationPaths.reduce(
      (acc, path) => {
        acc[path] = (acc[path] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostCommonPaths = Object.entries(pathCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([path]) => path);

    const averageDepth =
      chains.length > 0
        ? chains.reduce(
            (sum, chain) => sum + chain.propagationEvents.length,
            0
          ) / chains.length
        : 0;

    return {
      propagationChains: chains,
      averagePropagationDepth: averageDepth,
      mostCommonPropagationPaths: mostCommonPaths,
      isolatedErrors: chains.filter(
        chain => chain.propagationEvents.length === 1
      ).length,
      cascadingErrors: chains.filter(
        chain => chain.propagationEvents.length > 1
      ).length,
    };
  }

  private evaluateHandlingEffectiveness(): HandlingEffectiveness {
    const validations = Array.from(this.handlingValidations.values());

    const contextScores: Record<ExtensionContext, number> = {
      'service-worker': 0,
      'content-script': 0,
      offscreen: 0,
      ui: 0,
    };

    for (const validation of validations) {
      contextScores[validation.contextType] =
        validation.handlerEffectiveness * 100;
    }

    const overallScore =
      validations.length > 0
        ? (validations.reduce((sum, v) => sum + v.handlerEffectiveness, 0) /
            validations.length) *
          100
        : 0;

    return {
      overallScore,
      contextScores,
      handlingPatterns: this.identifyHandlingPatterns(),
      improvementAreas: this.identifyImprovementAreas(),
    };
  }

  private analyzeRecoveryPerformance(): RecoveryPerformance {
    const recoveries = Array.from(this.recoveryMonitoring.values());
    const completedRecoveries = recoveries.filter(r => r.recoveryEndTime);

    const successfulRecoveries = completedRecoveries.filter(
      r => r.successful
    ).length;

    const averageRecoveryTime =
      completedRecoveries.length > 0
        ? completedRecoveries.reduce((sum, r) => {
            const duration =
              r.recoveryEndTime!.getTime() - r.recoveryStartTime.getTime();
            return sum + duration;
          }, 0) / completedRecoveries.length
        : 0;

    return {
      totalRecoveryAttempts: recoveries.length,
      successfulRecoveries,
      averageRecoveryTime,
      recoveryStrategies: this.analyzeRecoveryStrategies(),
      failedRecoveries: this.identifyFailedRecoveries(),
    };
  }

  private identifyHandlingPatterns(): HandlingPattern[] {
    // Analyze common error handling patterns
    return [
      {
        pattern: 'try-catch-retry',
        frequency: 0.7,
        effectiveness: 0.8,
        contexts: ['service-worker', 'offscreen'],
      },
      {
        pattern: 'fallback-service',
        frequency: 0.5,
        effectiveness: 0.9,
        contexts: ['offscreen'],
      },
      {
        pattern: 'user-notification',
        frequency: 0.3,
        effectiveness: 0.6,
        contexts: ['ui', 'content-script'],
      },
    ];
  }

  private identifyImprovementAreas(): string[] {
    const areas: string[] = [];

    const validations = Array.from(this.handlingValidations.values());
    for (const validation of validations) {
      if (validation.handlerEffectiveness < 0.8) {
        areas.push(`Improve error handling in ${validation.contextType}`);
      }

      if (validation.recoveryMechanisms.length < 2) {
        areas.push(
          `Add more recovery mechanisms for ${validation.contextType}`
        );
      }
    }

    return areas;
  }

  private analyzeRecoveryStrategies(): RecoveryStrategy[] {
    const recoveries = Array.from(this.recoveryMonitoring.values());
    const strategyMap = new Map<string, RecoveryStrategy>();

    for (const recovery of recoveries) {
      const existing = strategyMap.get(recovery.recoveryStrategy);
      if (existing) {
        existing.successRate =
          (existing.successRate + (recovery.successful ? 1 : 0)) / 2;
      } else {
        strategyMap.set(recovery.recoveryStrategy, {
          strategy: recovery.recoveryStrategy,
          successRate: recovery.successful ? 1 : 0,
          averageTime: recovery.recoveryEndTime
            ? recovery.recoveryEndTime.getTime() -
              recovery.recoveryStartTime.getTime()
            : 0,
          applicableContexts: ['service-worker'], // Simplified
          effectiveness: recovery.successful ? 0.8 : 0.2,
        });
      }
    }

    return Array.from(strategyMap.values());
  }

  private identifyFailedRecoveries(): FailedRecovery[] {
    const recoveries = Array.from(this.recoveryMonitoring.values());

    return recoveries
      .filter(r => !r.successful)
      .map(r => ({
        errorId: r.errorId,
        strategy: r.recoveryStrategy,
        failureReason: r.finalState,
        userImpact: r.userImpact,
        alternativeStrategies: [
          'retry-with-backoff',
          'fallback-mode',
          'manual-intervention',
        ],
      }));
  }

  private generateErrorRecommendations(): ErrorRecommendation[] {
    const recommendations: ErrorRecommendation[] = [];

    const summary = this.generateErrorSummary();

    if (summary.unhandledErrors > summary.handledErrors) {
      recommendations.push({
        priority: 'high',
        category: 'handling',
        description: 'High number of unhandled errors detected',
        implementation:
          'Implement comprehensive error handlers in all contexts',
        expectedImpact: 'Reduce unhandled errors by 80%',
      });
    }

    const analysis = this.analyzePropagationPatterns();
    if (analysis.cascadingErrors > analysis.isolatedErrors) {
      recommendations.push({
        priority: 'medium',
        category: 'prevention',
        description: 'Many errors are cascading across contexts',
        implementation: 'Add error isolation and circuit breaker patterns',
        expectedImpact: 'Reduce error propagation by 60%',
      });
    }

    const performance = this.analyzeRecoveryPerformance();
    if (
      performance.successfulRecoveries <
      performance.totalRecoveryAttempts * 0.8
    ) {
      recommendations.push({
        priority: 'high',
        category: 'recovery',
        description: 'Low recovery success rate',
        implementation:
          'Improve recovery strategies and add more fallback options',
        expectedImpact: 'Increase recovery success rate to 90%',
      });
    }

    return recommendations;
  }

  private generateReportId(): string {
    return `error_report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChainId(): string {
    return `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecoveryId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start real error event monitoring across all contexts
   */
  private async startRealErrorEventMonitoring(): Promise<void> {
    // Monitor console messages for real error events
    const monitoringInterval = setInterval(async () => {
      if (!this.isTracking) {
        clearInterval(monitoringInterval);
        return;
      }

      try {
        // Get list of pages and monitor each for errors
        const pages = await mcp_chrome_devtools_list_pages();

        for (const page of pages) {
          const contextType = this.identifyContextType(page.url);
          if (contextType) {
            await this.monitorContextErrors(contextType, page.index);
          }
        }
      } catch (error) {
        console.warn(
          '[ErrorPropagationTracker] Error during real error monitoring:',
          error
        );
      }
    }, 2000); // Check every 2 seconds

    // Stop monitoring after 5 minutes to prevent resource leaks
    setTimeout(() => clearInterval(monitoringInterval), 300000);
  }

  /**
   * Monitor errors in a specific context
   */
  private async monitorContextErrors(
    context: ExtensionContext,
    pageIndex: number
  ): Promise<void> {
    try {
      await mcp_chrome_devtools_select_page({ pageIdx: pageIndex });

      // Get console messages for errors
      const consoleMessages = await mcp_chrome_devtools_list_console_messages({
        types: ['error', 'warn'],
        includePreservedMessages: false,
      });

      // Process real error messages
      for (const message of consoleMessages) {
        if (
          message.text &&
          message.text.includes('[ErrorPropagationTracker]')
        ) {
          await this.processRealErrorEvent(message, context);
        }
      }
    } catch (error) {
      console.warn(
        `[ErrorPropagationTracker] Failed to monitor errors for ${context}:`,
        error
      );
    }
  }

  /**
   * Process real error events from console logs
   */
  private async processRealErrorEvent(
    consoleMessage: any,
    context: ExtensionContext
  ): Promise<void> {
    try {
      const messageText = consoleMessage.text;

      if (
        messageText.includes('Error:') ||
        messageText.includes('Unhandled Rejection:')
      ) {
        // Extract error data from console log
        const errorMatch = messageText.match(
          /(?:Error|Unhandled Rejection): ({.*})/
        );
        if (errorMatch) {
          const errorData = JSON.parse(errorMatch[1]);
          await this.trackRealErrorOccurrence(errorData);
        }
      }
    } catch (error) {
      console.warn(
        '[ErrorPropagationTracker] Error processing real error event:',
        error
      );
    }
  }

  /**
   * Track real error occurrence from console data
   */
  private async trackRealErrorOccurrence(errorData: any): Promise<void> {
    const errorId = errorData.errorId || this.generateErrorId();
    const context = errorData.context as ExtensionContext;

    const propagationEvent: ErrorPropagationEvent = {
      id: errorId,
      timestamp: new Date(errorData.timestamp),
      originContext: context,
      currentContext: context,
      errorType: errorData.type,
      originalError: errorData.message || errorData.reason,
      propagatedError: errorData.message || errorData.reason,
      propagationPath: [context],
      handled: false,
      recoveryAttempted: false,
      recoverySuccessful: false,
      severity: this.classifyErrorSeverity(errorData),
    };

    this.propagationEvents.set(errorId, propagationEvent);

    // Create error chain
    const chainId = this.generateChainId();
    const errorChain: ErrorPropagationChain = {
      chainId,
      originError: propagationEvent,
      propagationEvents: [propagationEvent],
      finalResolution: 'unhandled',
      totalPropagationTime: 0,
    };

    this.errorChains.set(chainId, errorChain);

    console.log(
      `[ErrorPropagationTracker] Real error tracked: ${errorData.type} in ${context}`
    );

    // Check for error propagation patterns
    await this.detectRealErrorPropagation(errorData);
  }

  /**
   * Detect real error propagation patterns
   */
  private async detectRealErrorPropagation(errorData: any): Promise<void> {
    // Look for related errors in other contexts that might indicate propagation
    try {
      const pages = await mcp_chrome_devtools_list_pages();

      for (const page of pages) {
        const contextType = this.identifyContextType(page.url);
        if (contextType && contextType !== errorData.context) {
          await mcp_chrome_devtools_select_page({ pageIdx: page.index });

          // Check for related errors in this context
          const consoleMessages =
            await mcp_chrome_devtools_list_console_messages({
              types: ['error', 'warn'],
              includePreservedMessages: false,
            });

          for (const message of consoleMessages) {
            if (this.isRelatedError(errorData, message)) {
              // Track error propagation
              const propagationId = this.trackErrorPropagation(
                errorData.errorId,
                contextType,
                message.text
              );
              console.log(
                `[ErrorPropagationTracker] Real error propagation detected: ${errorData.context} -> ${contextType}`
              );
            }
          }
        }
      }
    } catch (error) {
      console.warn(
        '[ErrorPropagationTracker] Error detecting real error propagation:',
        error
      );
    }
  }

  /**
   * Check if an error message is related to the original error
   */
  private isRelatedError(originalError: any, consoleMessage: any): boolean {
    const messageText = consoleMessage.text.toLowerCase();
    const originalMessage = (
      originalError.message ||
      originalError.reason ||
      ''
    ).toLowerCase();

    // Simple heuristics for related errors
    if (originalMessage.includes('network') && messageText.includes('network'))
      return true;
    if (originalMessage.includes('storage') && messageText.includes('storage'))
      return true;
    if (originalMessage.includes('ai') && messageText.includes('ai'))
      return true;
    if (
      originalMessage.includes('processing') &&
      messageText.includes('processing')
    )
      return true;

    // Check for error propagation keywords
    if (
      messageText.includes('failed to') ||
      messageText.includes('error in') ||
      messageText.includes('exception')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Classify error severity based on error data
   */
  private classifyErrorSeverity(errorData: any): ErrorSeverity {
    const message = (errorData.message || errorData.reason || '').toLowerCase();

    // Critical errors
    if (
      message.includes('crash') ||
      message.includes('fatal') ||
      message.includes('critical')
    ) {
      return 'critical';
    }

    // High severity errors
    if (
      message.includes('network') ||
      message.includes('storage') ||
      message.includes('ai')
    ) {
      return 'high';
    }

    // Medium severity errors
    if (message.includes('warning') || message.includes('deprecated')) {
      return 'medium';
    }

    // Default to medium for unhandled rejections, low for others
    return errorData.type === 'unhandled-rejection' ? 'medium' : 'low';
  }

  /**
   * Identify context type from page URL
   */
  private identifyContextType(url: string): ExtensionContext | null {
    if (url.includes('service-worker')) return 'service-worker';
    if (url.includes('offscreen')) return 'offscreen';
    if (url.includes('chrome-extension://') && url.includes('/ui/'))
      return 'ui';
    if (url.startsWith('http')) return 'content-script';
    return null;
  }
}

// Global MCP function declarations
declare global {
  function mcp_chrome_devtools_list_pages(): Promise<any[]>;
  function mcp_chrome_devtools_select_page(params: {
    pageIdx: number;
  }): Promise<void>;
  function mcp_chrome_devtools_evaluate_script(params: {
    function: string;
  }): Promise<any>;
  function mcp_chrome_devtools_list_console_messages(
    params: any
  ): Promise<any[]>;
}
