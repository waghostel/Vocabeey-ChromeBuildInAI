/**
 * User Interaction Debugger
 * Specialized debugging for user interactions, event handling, and user flow validation
 * Implements Requirements: 4.2, 4.4
 */

export interface InteractionEventCapture {
  eventId: string;
  timestamp: Date;
  eventType: string;
  targetElement: {
    tagName: string;
    id?: string;
    className?: string;
    textContent?: string;
  };
  coordinates?: { x: number; y: number };
  keyboardEvent?: {
    key: string;
    code: string;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
  };
  mouseEvent?: {
    button: number;
    buttons: number;
    clientX: number;
    clientY: number;
  };
  beforeState: any;
  afterState: any;
  responseTime: number;
  errors: string[];
}

export interface UserFlowValidation {
  flowId: string;
  flowName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  steps: FlowStep[];
  isCompleted: boolean;
  isSuccessful: boolean;
  errors: string[];
}

export interface FlowStep {
  stepId: string;
  stepName: string;
  timestamp: Date;
  expectedOutcome: string;
  actualOutcome: string;
  isSuccessful: boolean;
  duration: number;
  errors: string[];
}

export interface TTSDebuggingResult {
  timestamp: Date;
  testType: 'availability' | 'functionality' | 'performance';
  isSupported: boolean;
  isWorking: boolean;
  voiceCount: number;
  testResults: {
    canInitialize: boolean;
    canSpeak: boolean;
    canStop: boolean;
    canPause: boolean;
    responseTime: number;
    errorRate: number;
  };
  performanceMetrics: {
    initializationTime: number;
    speechStartTime: number;
    speechEndTime: number;
    totalDuration: number;
  };
  errors: string[];
}

export class UserInteractionDebugger {
  private capturedEvents: InteractionEventCapture[] = [];
  private activeFlows: Map<string, UserFlowValidation> = new Map();
  private isCapturing: boolean = false;
  private eventListeners: Map<string, EventListener> = new Map();

  /**
   * Start capturing user interactions
   */
  startCapturing(): void {
    if (this.isCapturing) {
      console.warn('User interaction capturing already active');
      return;
    }

    console.log('Starting user interaction capture...');
    this.isCapturing = true;

    // Set up event listeners for different interaction types
    this.setupEventListeners();
  }

  /**
   * Stop capturing user interactions
   */
  stopCapturing(): void {
    if (!this.isCapturing) {
      console.warn('User interaction capturing not active');
      return;
    }

    console.log('Stopping user interaction capture...');
    this.isCapturing = false;

    // Remove event listeners
    this.removeEventListeners();
  }

  /**
   * Set up event listeners for interaction capture
   */
  private setupEventListeners(): void {
    const eventTypes = [
      'click',
      'dblclick',
      'mousedown',
      'mouseup',
      'mousemove',
      'keydown',
      'keyup',
      'keypress',
      'focus',
      'blur',
      'change',
      'input',
      'scroll',
      'resize',
      'touchstart',
      'touchend',
      'touchmove',
    ];

    eventTypes.forEach(eventType => {
      const listener = (event: Event) => this.captureInteractionEvent(event);
      document.addEventListener(eventType, listener, true);
      this.eventListeners.set(eventType, listener);
    });
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    this.eventListeners.forEach((listener, eventType) => {
      document.removeEventListener(eventType, listener, true);
    });
    this.eventListeners.clear();
  }

  /**
   * Capture individual interaction event
   */
  private captureInteractionEvent(event: Event): void {
    if (!this.isCapturing) return;

    const startTime = performance.now();
    const beforeState = this.captureUIState();

    // Create interaction event capture
    const eventCapture: InteractionEventCapture = {
      eventId: this.generateEventId(),
      timestamp: new Date(),
      eventType: event.type,
      targetElement: {
        tagName: (event.target as HTMLElement)?.tagName || 'unknown',
        id: (event.target as HTMLElement)?.id || undefined,
        className: (event.target as HTMLElement)?.className || undefined,
        textContent:
          (event.target as HTMLElement)?.textContent?.substring(0, 100) ||
          undefined,
      },
      beforeState,
      afterState: null,
      responseTime: 0,
      errors: [],
    };

    // Capture event-specific data
    if (event instanceof MouseEvent) {
      eventCapture.coordinates = { x: event.clientX, y: event.clientY };
      eventCapture.mouseEvent = {
        button: event.button,
        buttons: event.buttons,
        clientX: event.clientX,
        clientY: event.clientY,
      };
    }

    if (event instanceof KeyboardEvent) {
      eventCapture.keyboardEvent = {
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
      };
    }

    // Capture state after a short delay to allow for DOM updates
    setTimeout(() => {
      eventCapture.afterState = this.captureUIState();
      eventCapture.responseTime = performance.now() - startTime;

      // Validate the interaction
      this.validateInteraction(eventCapture);

      this.capturedEvents.push(eventCapture);

      // Limit captured events to prevent memory issues
      if (this.capturedEvents.length > 1000) {
        this.capturedEvents = this.capturedEvents.slice(-500);
      }
    }, 50);
  }

  /**
   * Capture current UI state
   */
  private captureUIState(): any {
    return {
      activeElement: document.activeElement?.tagName || null,
      scrollPosition: { x: window.scrollX, y: window.scrollY },
      currentMode:
        document
          .querySelector('.tab-button.active')
          ?.getAttribute('data-mode') || null,
      visibleCards: document.querySelectorAll(
        '.vocab-card:not(.collapsed), .sentence-card:not(.collapsed)'
      ).length,
      highlightCount: document.querySelectorAll(
        '.highlight-vocabulary, .highlight-sentence'
      ).length,
      loadingState:
        document
          .querySelector('.loading-overlay')
          ?.classList.contains('hidden') === false,
      modalOpen: document.querySelector('.modal:not(.hidden)') !== null,
    };
  }

  /**
   * Validate interaction for common issues
   */
  private validateInteraction(eventCapture: InteractionEventCapture): void {
    // Check for slow response times
    if (eventCapture.responseTime > 100) {
      eventCapture.errors.push(
        `Slow response time: ${eventCapture.responseTime.toFixed(2)}ms`
      );
    }

    // Check for failed state changes
    if (eventCapture.eventType === 'click') {
      const target = eventCapture.targetElement;

      // Check if button clicks resulted in expected changes
      if (target.className?.includes('tab-button')) {
        const modeChanged =
          eventCapture.beforeState.currentMode !==
          eventCapture.afterState.currentMode;
        if (!modeChanged) {
          eventCapture.errors.push('Tab button click did not change mode');
        }
      }

      // Check if card clicks resulted in state changes
      if (target.className?.includes('card')) {
        const cardCountChanged =
          eventCapture.beforeState.visibleCards !==
          eventCapture.afterState.visibleCards;
        if (!cardCountChanged && target.className?.includes('collapsed')) {
          eventCapture.errors.push(
            'Card click did not change visibility state'
          );
        }
      }
    }

    // Check for keyboard shortcut effectiveness
    if (eventCapture.eventType === 'keydown' && eventCapture.keyboardEvent) {
      const key = eventCapture.keyboardEvent.key;
      if (['v', 's', 'r', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        // These should trigger mode or navigation changes
        const stateChanged =
          JSON.stringify(eventCapture.beforeState) !==
          JSON.stringify(eventCapture.afterState);
        if (!stateChanged) {
          eventCapture.errors.push(
            `Keyboard shortcut '${key}' did not trigger expected state change`
          );
        }
      }
    }
  }

  /**
   * Start user flow validation
   */
  startUserFlow(flowName: string, expectedSteps: string[]): string {
    const flowId = this.generateFlowId();

    const flow: UserFlowValidation = {
      flowId,
      flowName,
      startTime: new Date(),
      steps: expectedSteps.map(stepName => ({
        stepId: this.generateStepId(),
        stepName,
        timestamp: new Date(),
        expectedOutcome: '',
        actualOutcome: '',
        isSuccessful: false,
        duration: 0,
        errors: [],
      })),
      isCompleted: false,
      isSuccessful: false,
      errors: [],
    };

    this.activeFlows.set(flowId, flow);
    console.log(`Started user flow validation: ${flowName} (${flowId})`);

    return flowId;
  }

  /**
   * Complete user flow step
   */
  completeFlowStep(
    flowId: string,
    stepName: string,
    isSuccessful: boolean,
    actualOutcome: string
  ): void {
    const flow = this.activeFlows.get(flowId);
    if (!flow) {
      console.error(`Flow ${flowId} not found`);
      return;
    }

    const step = flow.steps.find(s => s.stepName === stepName);
    if (!step) {
      console.error(`Step ${stepName} not found in flow ${flowId}`);
      return;
    }

    step.isSuccessful = isSuccessful;
    step.actualOutcome = actualOutcome;
    step.duration = Date.now() - step.timestamp.getTime();

    if (!isSuccessful) {
      step.errors.push(`Step failed: ${actualOutcome}`);
    }

    console.log(
      `Completed flow step: ${stepName} - ${isSuccessful ? 'SUCCESS' : 'FAILED'}`
    );
  }

  /**
   * Complete user flow
   */
  completeUserFlow(flowId: string): UserFlowValidation | null {
    const flow = this.activeFlows.get(flowId);
    if (!flow) {
      console.error(`Flow ${flowId} not found`);
      return null;
    }

    flow.endTime = new Date();
    flow.duration = flow.endTime.getTime() - flow.startTime.getTime();
    flow.isCompleted = true;
    flow.isSuccessful = flow.steps.every(step => step.isSuccessful);

    if (!flow.isSuccessful) {
      flow.errors.push('One or more steps failed');
    }

    this.activeFlows.delete(flowId);
    console.log(
      `Completed user flow: ${flow.flowName} - ${flow.isSuccessful ? 'SUCCESS' : 'FAILED'}`
    );

    return flow;
  }

  /**
   * Debug TTS functionality
   */
  async debugTTSFunctionality(): Promise<TTSDebuggingResult> {
    console.log('Starting TTS functionality debugging...');

    const result: TTSDebuggingResult = {
      timestamp: new Date(),
      testType: 'functionality',
      isSupported: false,
      isWorking: false,
      voiceCount: 0,
      testResults: {
        canInitialize: false,
        canSpeak: false,
        canStop: false,
        canPause: false,
        responseTime: 0,
        errorRate: 0,
      },
      performanceMetrics: {
        initializationTime: 0,
        speechStartTime: 0,
        speechEndTime: 0,
        totalDuration: 0,
      },
      errors: [],
    };

    try {
      const startTime = performance.now();

      // Test Speech Synthesis API availability
      if ('speechSynthesis' in window) {
        result.isSupported = true;
        result.testResults.canInitialize = true;
        result.performanceMetrics.initializationTime =
          performance.now() - startTime;

        // Get available voices
        const voices = speechSynthesis.getVoices();
        result.voiceCount = voices.length;

        if (voices.length === 0) {
          // Wait for voices to load
          await new Promise<void>(resolve => {
            const checkVoices = () => {
              const loadedVoices = speechSynthesis.getVoices();
              if (loadedVoices.length > 0) {
                result.voiceCount = loadedVoices.length;
                resolve();
              } else {
                setTimeout(checkVoices, 100);
              }
            };
            checkVoices();
          });
        }

        // Test speaking capability
        if (result.voiceCount > 0) {
          const testPromise = new Promise<void>((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance('test');
            utterance.volume = 0; // Silent test
            utterance.rate = 10; // Very fast

            const speechStartTime = performance.now();

            utterance.onstart = () => {
              result.testResults.canSpeak = true;
              result.performanceMetrics.speechStartTime =
                performance.now() - speechStartTime;
            };

            utterance.onend = () => {
              result.performanceMetrics.speechEndTime =
                performance.now() - speechStartTime;
              result.isWorking = true;
              resolve();
            };

            utterance.onerror = error => {
              result.errors.push(`Speech error: ${error.error}`);
              result.testResults.errorRate++;
              reject(error);
            };

            speechSynthesis.speak(utterance);

            // Test stop functionality
            setTimeout(() => {
              speechSynthesis.cancel();
              result.testResults.canStop = true;
              resolve();
            }, 100);
          });

          await testPromise.catch(() => {
            // Error handled in onerror callback
          });
        } else {
          result.errors.push('No voices available for TTS');
        }

        // Test pause functionality
        try {
          speechSynthesis.pause();
          speechSynthesis.resume();
          result.testResults.canPause = true;
        } catch (error) {
          result.errors.push(`Pause/resume error: ${error}`);
        }
      } else {
        result.errors.push('Speech Synthesis API not supported');
      }

      result.performanceMetrics.totalDuration = performance.now() - startTime;
      result.testResults.responseTime = result.performanceMetrics.totalDuration;
    } catch (error) {
      result.errors.push(`TTS debugging error: ${error}`);
    }

    console.log('TTS functionality debugging completed:', result);
    return result;
  }

  /**
   * Get captured interaction events
   */
  getCapturedEvents(): InteractionEventCapture[] {
    return [...this.capturedEvents];
  }

  /**
   * Get recent interaction events
   */
  getRecentEvents(count: number = 50): InteractionEventCapture[] {
    return this.capturedEvents.slice(-count);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string): InteractionEventCapture[] {
    return this.capturedEvents.filter(event => event.eventType === eventType);
  }

  /**
   * Get events with errors
   */
  getEventsWithErrors(): InteractionEventCapture[] {
    return this.capturedEvents.filter(event => event.errors.length > 0);
  }

  /**
   * Clear captured events
   */
  clearCapturedEvents(): void {
    this.capturedEvents = [];
    console.log('Cleared captured interaction events');
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique flow ID
   */
  private generateFlowId(): string {
    return `flow-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique step ID
   */
  private generateStepId(): string {
    return `step-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get interaction statistics
   */
  getInteractionStatistics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    averageResponseTime: number;
    errorRate: number;
    slowInteractions: number;
  } {
    const totalEvents = this.capturedEvents.length;
    const eventsByType: Record<string, number> = {};
    let totalResponseTime = 0;
    let errorCount = 0;
    let slowInteractions = 0;

    this.capturedEvents.forEach(event => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      totalResponseTime += event.responseTime;

      if (event.errors.length > 0) {
        errorCount++;
      }

      if (event.responseTime > 100) {
        slowInteractions++;
      }
    });

    return {
      totalEvents,
      eventsByType,
      averageResponseTime:
        totalEvents > 0 ? totalResponseTime / totalEvents : 0,
      errorRate: totalEvents > 0 ? (errorCount / totalEvents) * 100 : 0,
      slowInteractions,
    };
  }
}

// Global instance for easy access
let userInteractionDebuggerInstance: UserInteractionDebugger | null = null;

/**
 * Get the global user interaction debugger instance
 */
export function getUserInteractionDebugger(): UserInteractionDebugger {
  if (!userInteractionDebuggerInstance) {
    userInteractionDebuggerInstance = new UserInteractionDebugger();
  }
  return userInteractionDebuggerInstance;
}

/**
 * Reset the user interaction debugger instance
 */
export function resetUserInteractionDebugger(): void {
  if (userInteractionDebuggerInstance) {
    userInteractionDebuggerInstance.stopCapturing();
    userInteractionDebuggerInstance = null;
  }
}
