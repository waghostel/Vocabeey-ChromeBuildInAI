/**
 * Highlighting System Debugger
 * Specialized debugging for vocabulary and sentence highlighting functionality
 * Implements Requirements: 4.3
 */

export interface HighlightingSystemState {
  currentMode: 'vocabulary' | 'sentence' | 'none';
  isInitialized: boolean;
  articleId: string | null;
  partId: string | null;
  highlightCounts: {
    vocabulary: number;
    sentence: number;
    total: number;
  };
  lastActivity: Date | null;
}

export interface HighlightValidationResult {
  highlightId: string;
  highlightType: 'vocabulary' | 'sentence';
  timestamp: Date;
  isValid: boolean;
  element: {
    exists: boolean;
    hasCorrectClass: boolean;
    hasCorrectStyling: boolean;
    isVisible: boolean;
    isInteractive: boolean;
  };
  content: {
    text: string;
    textLength: number;
    hasTranslation: boolean;
    translationQuality: 'good' | 'poor' | 'missing';
  };
  performance: {
    creationTime: number;
    translationTime: number;
    renderTime: number;
  };
  errors: string[];
}

export interface HighlightingPerformanceMetrics {
  timestamp: Date;
  selectionToHighlightTime: number;
  translationRequestTime: number;
  domManipulationTime: number;
  totalProcessingTime: number;
  memoryUsage: {
    before: number;
    after: number;
    delta: number;
  };
  highlightCount: number;
  errors: string[];
}

export interface HighlightingSystemTest {
  testId: string;
  testName: string;
  timestamp: Date;
  testType: 'vocabulary' | 'sentence' | 'performance' | 'integration';
  isSuccessful: boolean;
  duration: number;
  steps: TestStep[];
  results: any;
  errors: string[];
}

export interface TestStep {
  stepName: string;
  timestamp: Date;
  isSuccessful: boolean;
  duration: number;
  expectedResult: string;
  actualResult: string;
  errors: string[];
}

export class HighlightingSystemDebugger {
  private currentState: HighlightingSystemState;
  private validationResults: HighlightValidationResult[] = [];
  private performanceMetrics: HighlightingPerformanceMetrics[] = [];
  private testResults: HighlightingSystemTest[] = [];
  private isMonitoring: boolean = false;

  constructor() {
    this.currentState = {
      currentMode: 'none',
      isInitialized: false,
      articleId: null,
      partId: null,
      highlightCounts: {
        vocabulary: 0,
        sentence: 0,
        total: 0,
      },
      lastActivity: null,
    };
  }

  /**
   * Start monitoring highlighting system
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('Highlighting system monitoring already active');
      return;
    }

    console.log('Starting highlighting system monitoring...');
    this.isMonitoring = true;

    // Update current state
    this.updateSystemState();

    // Set up event listeners for highlighting events
    this.setupHighlightingEventListeners();
  }

  /**
   * Stop monitoring highlighting system
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.warn('Highlighting system monitoring not active');
      return;
    }

    console.log('Stopping highlighting system monitoring...');
    this.isMonitoring = false;

    // Remove event listeners
    this.removeHighlightingEventListeners();
  }

  /**
   * Update system state
   */
  private updateSystemState(): void {
    try {
      // Check if highlighting system is initialized
      this.currentState.isInitialized =
        typeof (window as any).initializeHighlightManager === 'function';

      // Get current mode from UI
      const activeHighlightBtn = document.querySelector(
        '.highlight-mode-btn.active'
      );
      if (activeHighlightBtn) {
        this.currentState.currentMode =
          ((activeHighlightBtn as HTMLElement).dataset.highlightMode as any) ||
          'none';
      }

      // Count existing highlights
      const vocabHighlights = document.querySelectorAll(
        '.highlight-vocabulary'
      );
      const sentenceHighlights = document.querySelectorAll(
        '.highlight-sentence'
      );

      this.currentState.highlightCounts = {
        vocabulary: vocabHighlights.length,
        sentence: sentenceHighlights.length,
        total: vocabHighlights.length + sentenceHighlights.length,
      };

      this.currentState.lastActivity = new Date();
    } catch (error) {
      console.error('Failed to update highlighting system state:', error);
    }
  }

  /**
   * Set up event listeners for highlighting events
   */
  private setupHighlightingEventListeners(): void {
    // Listen for custom highlighting events
    document.addEventListener(
      'vocabulary-added',
      this.handleVocabularyAdded.bind(this)
    );
    document.addEventListener(
      'sentence-added',
      this.handleSentenceAdded.bind(this)
    );
    document.addEventListener(
      'vocabulary-removed',
      this.handleVocabularyRemoved.bind(this)
    );
    document.addEventListener(
      'sentence-removed',
      this.handleSentenceRemoved.bind(this)
    );

    // Listen for selection events
    document.addEventListener('mouseup', this.handleTextSelection.bind(this));
    document.addEventListener('touchend', this.handleTextSelection.bind(this));
  }

  /**
   * Remove event listeners
   */
  private removeHighlightingEventListeners(): void {
    document.removeEventListener(
      'vocabulary-added',
      this.handleVocabularyAdded.bind(this)
    );
    document.removeEventListener(
      'sentence-added',
      this.handleSentenceAdded.bind(this)
    );
    document.removeEventListener(
      'vocabulary-removed',
      this.handleVocabularyRemoved.bind(this)
    );
    document.removeEventListener(
      'sentence-removed',
      this.handleSentenceRemoved.bind(this)
    );
    document.removeEventListener(
      'mouseup',
      this.handleTextSelection.bind(this)
    );
    document.removeEventListener(
      'touchend',
      this.handleTextSelection.bind(this)
    );
  }

  /**
   * Handle vocabulary added event
   */
  private handleVocabularyAdded(event: CustomEvent): void {
    console.log('[HIGHLIGHT DEBUG] Vocabulary added:', event.detail);
    this.updateSystemState();

    // Validate the new highlight
    if (event.detail && event.detail.id) {
      setTimeout(() => {
        this.validateHighlight(event.detail.id, 'vocabulary');
      }, 100);
    }
  }

  /**
   * Handle sentence added event
   */
  private handleSentenceAdded(event: CustomEvent): void {
    console.log('[HIGHLIGHT DEBUG] Sentence added:', event.detail);
    this.updateSystemState();

    // Validate the new highlight
    if (event.detail && event.detail.id) {
      setTimeout(() => {
        this.validateHighlight(event.detail.id, 'sentence');
      }, 100);
    }
  }

  /**
   * Handle vocabulary removed event
   */
  private handleVocabularyRemoved(event: CustomEvent): void {
    console.log('[HIGHLIGHT DEBUG] Vocabulary removed:', event.detail);
    this.updateSystemState();
  }

  /**
   * Handle sentence removed event
   */
  private handleSentenceRemoved(event: CustomEvent): void {
    console.log('[HIGHLIGHT DEBUG] Sentence removed:', event.detail);
    this.updateSystemState();
  }

  /**
   * Handle text selection for performance monitoring
   */
  private handleTextSelection(event: Event): void {
    if (!this.isMonitoring) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Start performance monitoring
    this.startPerformanceMonitoring(
      selectedText,
      this.currentState.currentMode
    );
  }

  /**
   * Start performance monitoring for highlighting operation
   */
  private startPerformanceMonitoring(
    text: string,
    mode: 'vocabulary' | 'sentence' | 'none'
  ): void {
    if (mode === 'none') return;

    const startTime = performance.now();
    const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

    const metrics: HighlightingPerformanceMetrics = {
      timestamp: new Date(),
      selectionToHighlightTime: 0,
      translationRequestTime: 0,
      domManipulationTime: 0,
      totalProcessingTime: 0,
      memoryUsage: {
        before: memoryBefore,
        after: 0,
        delta: 0,
      },
      highlightCount: this.currentState.highlightCounts.total,
      errors: [],
    };

    // Monitor for highlight creation
    const checkForNewHighlight = () => {
      const currentHighlightCount = document.querySelectorAll(
        '.highlight-vocabulary, .highlight-sentence'
      ).length;

      if (currentHighlightCount > metrics.highlightCount) {
        // New highlight was created
        metrics.selectionToHighlightTime = performance.now() - startTime;
        metrics.totalProcessingTime = metrics.selectionToHighlightTime;

        const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
        metrics.memoryUsage.after = memoryAfter;
        metrics.memoryUsage.delta = memoryAfter - memoryBefore;

        this.performanceMetrics.push(metrics);
        console.log('[HIGHLIGHT DEBUG] Performance metrics captured:', metrics);
      } else if (performance.now() - startTime > 5000) {
        // Timeout - highlighting may have failed
        metrics.errors.push('Highlighting operation timed out');
        metrics.totalProcessingTime = performance.now() - startTime;
        this.performanceMetrics.push(metrics);
      } else {
        // Keep checking
        setTimeout(checkForNewHighlight, 100);
      }
    };

    setTimeout(checkForNewHighlight, 100);
  }

  /**
   * Validate individual highlight
   */
  async validateHighlight(
    highlightId: string,
    type: 'vocabulary' | 'sentence'
  ): Promise<HighlightValidationResult> {
    const startTime = performance.now();

    const result: HighlightValidationResult = {
      highlightId,
      highlightType: type,
      timestamp: new Date(),
      isValid: false,
      element: {
        exists: false,
        hasCorrectClass: false,
        hasCorrectStyling: false,
        isVisible: false,
        isInteractive: false,
      },
      content: {
        text: '',
        textLength: 0,
        hasTranslation: false,
        translationQuality: 'missing',
      },
      performance: {
        creationTime: 0,
        translationTime: 0,
        renderTime: 0,
      },
      errors: [],
    };

    try {
      // Find highlight element in DOM
      const highlightClass =
        type === 'vocabulary' ? '.highlight-vocabulary' : '.highlight-sentence';
      const highlightElements = document.querySelectorAll(highlightClass);

      // For this validation, we'll check the most recent highlight
      const highlightElement = highlightElements[
        highlightElements.length - 1
      ] as HTMLElement;

      if (highlightElement) {
        result.element.exists = true;

        // Check class
        result.element.hasCorrectClass = highlightElement.classList.contains(
          type === 'vocabulary' ? 'highlight-vocabulary' : 'highlight-sentence'
        );

        // Check styling
        const computedStyle = window.getComputedStyle(highlightElement);
        result.element.hasCorrectStyling =
          computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
          computedStyle.backgroundColor !== 'transparent';

        // Check visibility
        result.element.isVisible =
          computedStyle.display !== 'none' &&
          computedStyle.visibility !== 'hidden' &&
          computedStyle.opacity !== '0';

        // Check interactivity
        result.element.isInteractive =
          highlightElement.onclick !== null ||
          highlightElement.getAttribute('onclick') !== null ||
          highlightElement.style.cursor === 'pointer';

        // Get content
        result.content.text = highlightElement.textContent || '';
        result.content.textLength = result.content.text.length;

        // Check for translation (would need to check storage or data attributes)
        result.content.hasTranslation =
          highlightElement.dataset.translation !== undefined;

        if (result.content.hasTranslation) {
          const translation = highlightElement.dataset.translation || '';
          result.content.translationQuality =
            translation.length > 0 ? 'good' : 'poor';
        }

        // Validate overall
        result.isValid =
          result.element.exists &&
          result.element.hasCorrectClass &&
          result.element.hasCorrectStyling &&
          result.element.isVisible &&
          result.content.textLength > 0;
      } else {
        result.errors.push('Highlight element not found in DOM');
      }
    } catch (error) {
      result.errors.push(`Validation error: ${error}`);
    }

    result.performance.renderTime = performance.now() - startTime;

    this.validationResults.push(result);
    console.log('[HIGHLIGHT DEBUG] Highlight validation completed:', result);

    return result;
  }

  /**
   * Test vocabulary highlighting functionality
   */
  async testVocabularyHighlighting(): Promise<HighlightingSystemTest> {
    const testId = this.generateTestId();
    const test: HighlightingSystemTest = {
      testId,
      testName: 'Vocabulary Highlighting Test',
      timestamp: new Date(),
      testType: 'vocabulary',
      isSuccessful: false,
      duration: 0,
      steps: [],
      results: {},
      errors: [],
    };

    const startTime = performance.now();

    try {
      // Step 1: Check if highlighting system is initialized
      const initStep: TestStep = {
        stepName: 'Check System Initialization',
        timestamp: new Date(),
        isSuccessful: false,
        duration: 0,
        expectedResult: 'Highlighting system should be initialized',
        actualResult: '',
        errors: [],
      };

      const stepStartTime = performance.now();

      if (this.currentState.isInitialized) {
        initStep.isSuccessful = true;
        initStep.actualResult = 'Highlighting system is initialized';
      } else {
        initStep.actualResult = 'Highlighting system is not initialized';
        initStep.errors.push('Highlighting system not initialized');
      }

      initStep.duration = performance.now() - stepStartTime;
      test.steps.push(initStep);

      // Step 2: Check vocabulary mode activation
      const modeStep: TestStep = {
        stepName: 'Activate Vocabulary Mode',
        timestamp: new Date(),
        isSuccessful: false,
        duration: 0,
        expectedResult: 'Vocabulary mode should be active',
        actualResult: '',
        errors: [],
      };

      const modeStartTime = performance.now();

      // Try to activate vocabulary mode
      const vocabModeBtn = document.querySelector(
        '[data-highlight-mode="vocabulary"]'
      ) as HTMLElement;
      if (vocabModeBtn) {
        vocabModeBtn.click();

        // Check if mode was activated
        setTimeout(() => {
          this.updateSystemState();
          if (this.currentState.currentMode === 'vocabulary') {
            modeStep.isSuccessful = true;
            modeStep.actualResult = 'Vocabulary mode activated successfully';
          } else {
            modeStep.actualResult = `Current mode is ${this.currentState.currentMode}`;
            modeStep.errors.push('Failed to activate vocabulary mode');
          }
        }, 100);
      } else {
        modeStep.actualResult = 'Vocabulary mode button not found';
        modeStep.errors.push('Vocabulary mode button not found');
      }

      modeStep.duration = performance.now() - modeStartTime;
      test.steps.push(modeStep);

      // Step 3: Test text selection and highlighting
      const highlightStep: TestStep = {
        stepName: 'Test Text Highlighting',
        timestamp: new Date(),
        isSuccessful: false,
        duration: 0,
        expectedResult: 'Selected text should be highlighted',
        actualResult: '',
        errors: [],
      };

      const highlightStartTime = performance.now();

      // Find article content for testing
      const articleContent = document.querySelector('.article-part-content');
      if (articleContent && articleContent.textContent) {
        const initialHighlightCount =
          this.currentState.highlightCounts.vocabulary;

        // Simulate text selection (this would normally be done by user)
        const testText = 'example'; // Look for this word in content
        const textContent = articleContent.textContent;

        if (textContent.includes(testText)) {
          // Create a test highlight programmatically
          const testHighlight = document.createElement('span');
          testHighlight.className = 'highlight-vocabulary test-highlight';
          testHighlight.textContent = testText;
          testHighlight.style.backgroundColor = '#ffeb3b';
          testHighlight.style.padding = '2px';

          articleContent.appendChild(testHighlight);

          // Check if highlight was created
          const newHighlightCount = document.querySelectorAll(
            '.highlight-vocabulary'
          ).length;
          if (newHighlightCount > initialHighlightCount) {
            highlightStep.isSuccessful = true;
            highlightStep.actualResult = `Highlight created successfully (${newHighlightCount} total)`;
          } else {
            highlightStep.actualResult = 'No new highlight detected';
            highlightStep.errors.push('Highlight creation failed');
          }

          // Clean up test highlight
          testHighlight.remove();
        } else {
          highlightStep.actualResult = 'Test text not found in article content';
          highlightStep.errors.push(
            'Cannot test highlighting without suitable text'
          );
        }
      } else {
        highlightStep.actualResult = 'Article content not found';
        highlightStep.errors.push('Article content not available for testing');
      }

      highlightStep.duration = performance.now() - highlightStartTime;
      test.steps.push(highlightStep);

      // Determine overall test success
      test.isSuccessful = test.steps.every(step => step.isSuccessful);

      if (!test.isSuccessful) {
        test.errors.push('One or more test steps failed');
      }
    } catch (error) {
      test.errors.push(`Test execution error: ${error}`);
    }

    test.duration = performance.now() - startTime;
    this.testResults.push(test);

    console.log(
      '[HIGHLIGHT DEBUG] Vocabulary highlighting test completed:',
      test
    );
    return test;
  }

  /**
   * Test sentence highlighting functionality
   */
  async testSentenceHighlighting(): Promise<HighlightingSystemTest> {
    const testId = this.generateTestId();
    const test: HighlightingSystemTest = {
      testId,
      testName: 'Sentence Highlighting Test',
      timestamp: new Date(),
      testType: 'sentence',
      isSuccessful: false,
      duration: 0,
      steps: [],
      results: {},
      errors: [],
    };

    const startTime = performance.now();

    try {
      // Step 1: Activate sentence mode
      const modeStep: TestStep = {
        stepName: 'Activate Sentence Mode',
        timestamp: new Date(),
        isSuccessful: false,
        duration: 0,
        expectedResult: 'Sentence mode should be active',
        actualResult: '',
        errors: [],
      };

      const modeStartTime = performance.now();

      const sentenceModeBtn = document.querySelector(
        '[data-highlight-mode="sentence"]'
      ) as HTMLElement;
      if (sentenceModeBtn) {
        sentenceModeBtn.click();

        setTimeout(() => {
          this.updateSystemState();
          if (this.currentState.currentMode === 'sentence') {
            modeStep.isSuccessful = true;
            modeStep.actualResult = 'Sentence mode activated successfully';
          } else {
            modeStep.actualResult = `Current mode is ${this.currentState.currentMode}`;
            modeStep.errors.push('Failed to activate sentence mode');
          }
        }, 100);
      } else {
        modeStep.actualResult = 'Sentence mode button not found';
        modeStep.errors.push('Sentence mode button not found');
      }

      modeStep.duration = performance.now() - modeStartTime;
      test.steps.push(modeStep);

      // Step 2: Test sentence highlighting
      const highlightStep: TestStep = {
        stepName: 'Test Sentence Highlighting',
        timestamp: new Date(),
        isSuccessful: false,
        duration: 0,
        expectedResult: 'Selected sentence should be highlighted',
        actualResult: '',
        errors: [],
      };

      const highlightStartTime = performance.now();

      const articleContent = document.querySelector('.article-part-content');
      if (articleContent) {
        const initialHighlightCount =
          this.currentState.highlightCounts.sentence;

        // Create a test sentence highlight
        const testSentence =
          'This is a test sentence for highlighting validation.';
        const testHighlight = document.createElement('span');
        testHighlight.className = 'highlight-sentence test-sentence-highlight';
        testHighlight.textContent = testSentence;
        testHighlight.style.backgroundColor = '#e1f5fe';
        testHighlight.style.padding = '4px';
        testHighlight.style.borderRadius = '2px';

        articleContent.appendChild(testHighlight);

        // Check if highlight was created
        const newHighlightCount = document.querySelectorAll(
          '.highlight-sentence'
        ).length;
        if (newHighlightCount > initialHighlightCount) {
          highlightStep.isSuccessful = true;
          highlightStep.actualResult = `Sentence highlight created successfully (${newHighlightCount} total)`;
        } else {
          highlightStep.actualResult = 'No new sentence highlight detected';
          highlightStep.errors.push('Sentence highlight creation failed');
        }

        // Clean up test highlight
        testHighlight.remove();
      } else {
        highlightStep.actualResult = 'Article content not found';
        highlightStep.errors.push('Article content not available for testing');
      }

      highlightStep.duration = performance.now() - highlightStartTime;
      test.steps.push(highlightStep);

      // Determine overall test success
      test.isSuccessful = test.steps.every(step => step.isSuccessful);

      if (!test.isSuccessful) {
        test.errors.push('One or more test steps failed');
      }
    } catch (error) {
      test.errors.push(`Test execution error: ${error}`);
    }

    test.duration = performance.now() - startTime;
    this.testResults.push(test);

    console.log(
      '[HIGHLIGHT DEBUG] Sentence highlighting test completed:',
      test
    );
    return test;
  }

  /**
   * Test highlighting performance under load
   */
  async testHighlightingPerformance(): Promise<HighlightingSystemTest> {
    const testId = this.generateTestId();
    const test: HighlightingSystemTest = {
      testId,
      testName: 'Highlighting Performance Test',
      timestamp: new Date(),
      testType: 'performance',
      isSuccessful: false,
      duration: 0,
      steps: [],
      results: {
        averageCreationTime: 0,
        maxCreationTime: 0,
        minCreationTime: Infinity,
        memoryUsage: 0,
        highlightsCreated: 0,
      },
      errors: [],
    };

    const startTime = performance.now();
    const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

    try {
      const performanceStep: TestStep = {
        stepName: 'Performance Load Test',
        timestamp: new Date(),
        isSuccessful: false,
        duration: 0,
        expectedResult: 'Should create multiple highlights efficiently',
        actualResult: '',
        errors: [],
      };

      const stepStartTime = performance.now();
      const creationTimes: number[] = [];
      const testHighlights: HTMLElement[] = [];

      // Create multiple test highlights to measure performance
      const articleContent = document.querySelector('.article-part-content');
      if (articleContent) {
        for (let i = 0; i < 10; i++) {
          const highlightStartTime = performance.now();

          const testHighlight = document.createElement('span');
          testHighlight.className = `highlight-vocabulary perf-test-${i}`;
          testHighlight.textContent = `test-word-${i}`;
          testHighlight.style.backgroundColor = '#ffeb3b';
          testHighlight.style.padding = '2px';

          articleContent.appendChild(testHighlight);
          testHighlights.push(testHighlight);

          const creationTime = performance.now() - highlightStartTime;
          creationTimes.push(creationTime);
        }

        // Calculate performance metrics
        test.results.averageCreationTime =
          creationTimes.reduce((a, b) => a + b, 0) / creationTimes.length;
        test.results.maxCreationTime = Math.max(...creationTimes);
        test.results.minCreationTime = Math.min(...creationTimes);
        test.results.highlightsCreated = testHighlights.length;

        const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
        test.results.memoryUsage = memoryAfter - memoryBefore;

        // Clean up test highlights
        testHighlights.forEach(highlight => highlight.remove());

        // Validate performance
        if (test.results.averageCreationTime < 10) {
          // Less than 10ms average
          performanceStep.isSuccessful = true;
          performanceStep.actualResult = `Average creation time: ${test.results.averageCreationTime.toFixed(2)}ms`;
        } else {
          performanceStep.actualResult = `Slow performance: ${test.results.averageCreationTime.toFixed(2)}ms average`;
          performanceStep.errors.push(
            'Highlighting performance is below acceptable threshold'
          );
        }
      } else {
        performanceStep.actualResult = 'Article content not found';
        performanceStep.errors.push(
          'Cannot test performance without article content'
        );
      }

      performanceStep.duration = performance.now() - stepStartTime;
      test.steps.push(performanceStep);

      test.isSuccessful = performanceStep.isSuccessful;
    } catch (error) {
      test.errors.push(`Performance test error: ${error}`);
    }

    test.duration = performance.now() - startTime;
    this.testResults.push(test);

    console.log(
      '[HIGHLIGHT DEBUG] Highlighting performance test completed:',
      test
    );
    return test;
  }

  /**
   * Get current system state
   */
  getCurrentState(): HighlightingSystemState {
    this.updateSystemState();
    return { ...this.currentState };
  }

  /**
   * Get validation results
   */
  getValidationResults(): HighlightValidationResult[] {
    return [...this.validationResults];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): HighlightingPerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  /**
   * Get test results
   */
  getTestResults(): HighlightingSystemTest[] {
    return [...this.testResults];
  }

  /**
   * Clear all debugging data
   */
  clearDebuggingData(): void {
    this.validationResults = [];
    this.performanceMetrics = [];
    this.testResults = [];
    console.log('Cleared highlighting system debugging data');
  }

  /**
   * Generate unique test ID
   */
  private generateTestId(): string {
    return `highlight-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get debugging summary
   */
  getDebuggingSummary(): {
    systemState: HighlightingSystemState;
    validationSummary: {
      totalValidations: number;
      successfulValidations: number;
      failedValidations: number;
      successRate: number;
    };
    performanceSummary: {
      totalMetrics: number;
      averageProcessingTime: number;
      averageMemoryUsage: number;
    };
    testSummary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      passRate: number;
    };
  } {
    const validationSummary = {
      totalValidations: this.validationResults.length,
      successfulValidations: this.validationResults.filter(v => v.isValid)
        .length,
      failedValidations: this.validationResults.filter(v => !v.isValid).length,
      successRate: 0,
    };
    validationSummary.successRate =
      validationSummary.totalValidations > 0
        ? (validationSummary.successfulValidations /
            validationSummary.totalValidations) *
          100
        : 0;

    const performanceSummary = {
      totalMetrics: this.performanceMetrics.length,
      averageProcessingTime: 0,
      averageMemoryUsage: 0,
    };
    if (this.performanceMetrics.length > 0) {
      performanceSummary.averageProcessingTime =
        this.performanceMetrics.reduce(
          (sum, m) => sum + m.totalProcessingTime,
          0
        ) / this.performanceMetrics.length;
      performanceSummary.averageMemoryUsage =
        this.performanceMetrics.reduce(
          (sum, m) => sum + m.memoryUsage.delta,
          0
        ) / this.performanceMetrics.length;
    }

    const testSummary = {
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter(t => t.isSuccessful).length,
      failedTests: this.testResults.filter(t => !t.isSuccessful).length,
      passRate: 0,
    };
    testSummary.passRate =
      testSummary.totalTests > 0
        ? (testSummary.passedTests / testSummary.totalTests) * 100
        : 0;

    return {
      systemState: this.getCurrentState(),
      validationSummary,
      performanceSummary,
      testSummary,
    };
  }
}

// Global instance for easy access
let highlightingSystemDebuggerInstance: HighlightingSystemDebugger | null =
  null;

/**
 * Get the global highlighting system debugger instance
 */
export function getHighlightingSystemDebugger(): HighlightingSystemDebugger {
  if (!highlightingSystemDebuggerInstance) {
    highlightingSystemDebuggerInstance = new HighlightingSystemDebugger();
  }
  return highlightingSystemDebuggerInstance;
}

/**
 * Reset the highlighting system debugger instance
 */
export function resetHighlightingSystemDebugger(): void {
  if (highlightingSystemDebuggerInstance) {
    highlightingSystemDebuggerInstance.stopMonitoring();
    highlightingSystemDebuggerInstance = null;
  }
}
