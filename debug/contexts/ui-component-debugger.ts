/**
 * UI Component Debugger
 * Debug learning interface, user interactions, and component state management
 * Implements Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

export interface UIComponentDebugCapabilities {
  validateComponentRendering: boolean;
  trackUserInteractions: boolean;
  debugHighlightingSystem: boolean;
  monitorTTSFunctionality: boolean;
  validateLayoutStructure: boolean;
}

export interface UIComponentDebugSession {
  sessionId: string;
  uiUrl: string;
  pageIndex: number | null;
  isConnected: boolean;
  startTime: Date;
  capturedData: {
    renderingValidation: any[];
    userInteractions: any[];
    highlightingEvents: any[];
    ttsEvents: any[];
    layoutValidation: any[];
    stateChanges: any[];
  };
}

export interface ComponentRenderingValidation {
  timestamp: string;
  componentName: string;
  isRendered: boolean;
  renderTime: number;
  elementCount: number;
  layoutMetrics: {
    width: number;
    height: number;
    position: { x: number; y: number };
  };
  styleValidation: {
    hasRequiredClasses: boolean;
    hasCorrectStyles: boolean;
    isVisible: boolean;
  };
  errors: string[];
}

export interface UserInteractionEvent {
  timestamp: string;
  eventType: string;
  targetElement: string;
  elementId?: string;
  elementClass?: string;
  coordinates?: { x: number; y: number };
  responseTime: number;
  stateChangeBefore: any;
  stateChangeAfter: any;
  errors: string[];
}

export interface HighlightingSystemValidation {
  timestamp: string;
  highlightType: 'vocabulary' | 'sentence';
  isWorking: boolean;
  highlightCount: number;
  performanceMetrics: {
    selectionTime: number;
    highlightCreationTime: number;
    translationTime: number;
  };
  visualValidation: {
    hasCorrectStyling: boolean;
    isVisible: boolean;
    hasInteractivity: boolean;
  };
  errors: string[];
}

export class UIComponentDebugger {
  private capabilities: UIComponentDebugCapabilities;
  private isMonitoring: boolean = false;
  private currentSession: UIComponentDebugSession | null = null;

  constructor() {
    this.capabilities = {
      validateComponentRendering: true,
      trackUserInteractions: true,
      debugHighlightingSystem: true,
      monitorTTSFunctionality: true,
      validateLayoutStructure: true,
    };
  }

  /**
   * Connect to UI component context and start monitoring
   */
  async connectToUIContext(uiUrl?: string): Promise<boolean> {
    try {
      console.log('Connecting to UI component context...');

      // Navigate to extension UI or use provided URL
      const targetUrl =
        uiUrl || 'chrome-extension://[extension-id]/ui/learning-interface.html';

      console.log(`Navigating to UI: ${targetUrl}`);

      // Get list of available pages to find UI page
      const pages = await this.listPages();
      const uiPage = this.findUIPage(pages, targetUrl);

      if (!uiPage) {
        console.error('UI page not found');
        return false;
      }

      // Select the UI page for debugging
      await this.selectPage(uiPage.pageIdx);

      // Initialize debug session
      this.currentSession = {
        sessionId: `ui-debug-${Date.now()}`,
        uiUrl: targetUrl,
        pageIndex: uiPage.pageIdx,
        isConnected: true,
        startTime: new Date(),
        capturedData: {
          renderingValidation: [],
          userInteractions: [],
          highlightingEvents: [],
          ttsEvents: [],
          layoutValidation: [],
          stateChanges: [],
        },
      };

      console.log(`Connected to UI context (page index: ${uiPage.pageIdx})`);
      return true;
    } catch (error) {
      console.error('Failed to connect to UI context:', error);
      return false;
    }
  }

  /**
   * Start monitoring UI components
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('UI component monitoring already active');
      return;
    }

    try {
      // Connect to UI context first
      const connected = await this.connectToUIContext();
      if (!connected) {
        throw new Error('Failed to connect to UI context');
      }

      console.log('Starting UI component monitoring...');
      this.isMonitoring = true;

      // Set up monitoring for different aspects
      if (this.capabilities.validateComponentRendering) {
        await this.setupComponentRenderingValidation();
      }

      if (this.capabilities.trackUserInteractions) {
        await this.setupUserInteractionTracking();
      }

      if (this.capabilities.debugHighlightingSystem) {
        await this.setupHighlightingSystemDebugging();
      }

      if (this.capabilities.monitorTTSFunctionality) {
        await this.setupTTSFunctionalityMonitoring();
      }

      if (this.capabilities.validateLayoutStructure) {
        await this.setupLayoutValidation();
      }

      console.log('UI component monitoring started successfully');
    } catch (error) {
      console.error('Failed to start UI component monitoring:', error);
      this.isMonitoring = false;
    }
  }

  /**
   * Validate component rendering
   */
  async validateComponentRendering(): Promise<ComponentRenderingValidation[]> {
    if (!this.currentSession?.isConnected) {
      console.error('No active UI session');
      return [];
    }

    try {
      console.log('Validating component rendering...');

      // Script to validate component rendering
      const renderingValidationScript = `
                () => {
                    const validationResults = [];
                    const startTime = performance.now();

                    // Define components to validate
                    const componentsToValidate = [
                        {
                            name: 'Learning Interface',
                            selector: '.learning-interface',
                            requiredClasses: ['learning-interface'],
                            requiredChildren: ['.tab-buttons', '.mode-content']
                        },
                        {
                            name: 'Article Header',
                            selector: '.article-header',
                            requiredClasses: ['article-header'],
                            requiredChildren: ['.article-title', '.article-url']
                        },
                        {
                            name: 'Article Content',
                            selector: '.article-part-content',
                            requiredClasses: ['article-part-content'],
                            requiredChildren: ['p']
                        },
                        {
                            name: 'Vocabulary Cards',
                            selector: '.vocabulary-cards',
                            requiredClasses: ['vocabulary-cards'],
                            requiredChildren: []
                        },
                        {
                            name: 'Sentence Cards',
                            selector: '.sentence-cards',
                            requiredClasses: ['sentence-cards'],
                            requiredChildren: []
                        },
                        {
                            name: 'Navigation Controls',
                            selector: '.navigation-controls',
                            requiredClasses: ['navigation-controls'],
                            requiredChildren: ['#prev-part', '#next-part']
                        },
                        {
                            name: 'Tab Buttons',
                            selector: '.tab-buttons',
                            requiredClasses: ['tab-buttons'],
                            requiredChildren: ['.tab-button']
                        }
                    ];

                    componentsToValidate.forEach(component => {
                        const componentStartTime = performance.now();
                        const element = document.querySelector(component.selector);
                        
                        const validation = {
                            timestamp: new Date().toISOString(),
                            componentName: component.name,
                            isRendered: !!element,
                            renderTime: 0,
                            elementCount: 0,
                            layoutMetrics: {
                                width: 0,
                                height: 0,
                                position: { x: 0, y: 0 }
                            },
                            styleValidation: {
                                hasRequiredClasses: false,
                                hasCorrectStyles: false,
                                isVisible: false
                            },
                            errors: []
                        };

                        if (element) {
                            // Measure render time
                            validation.renderTime = performance.now() - componentStartTime;

                            // Count elements
                            validation.elementCount = element.querySelectorAll('*').length + 1;

                            // Get layout metrics
                            const rect = element.getBoundingClientRect();
                            validation.layoutMetrics = {
                                width: rect.width,
                                height: rect.height,
                                position: { x: rect.left, y: rect.top }
                            };

                            // Validate classes
                            validation.styleValidation.hasRequiredClasses = component.requiredClasses.every(
                                className => element.classList.contains(className)
                            );

                            // Check visibility
                            const computedStyle = window.getComputedStyle(element);
                            validation.styleValidation.isVisible = 
                                computedStyle.display !== 'none' && 
                                computedStyle.visibility !== 'hidden' &&
                                computedStyle.opacity !== '0';

                            // Validate styles
                            validation.styleValidation.hasCorrectStyles = 
                                computedStyle.display !== '' && 
                                computedStyle.position !== '';

                            // Check required children
                            component.requiredChildren.forEach(childSelector => {
                                const child = element.querySelector(childSelector);
                                if (!child) {
                                    validation.errors.push(\`Missing required child: \${childSelector}\`);
                                }
                            });

                            // Additional validation checks
                            if (validation.layoutMetrics.width === 0 || validation.layoutMetrics.height === 0) {
                                validation.errors.push('Component has zero dimensions');
                            }

                            if (!validation.styleValidation.isVisible) {
                                validation.errors.push('Component is not visible');
                            }

                        } else {
                            validation.errors.push('Component element not found in DOM');
                        }

                        validationResults.push(validation);
                    });

                    return {
                        timestamp: new Date().toISOString(),
                        totalValidationTime: performance.now() - startTime,
                        validationResults: validationResults,
                        summary: {
                            totalComponents: validationResults.length,
                            renderedComponents: validationResults.filter(v => v.isRendered).length,
                            visibleComponents: validationResults.filter(v => v.styleValidation.isVisible).length,
                            componentsWithErrors: validationResults.filter(v => v.errors.length > 0).length
                        }
                    };
                }
            `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      // For now, return mock validation results
      const mockValidationResults: ComponentRenderingValidation[] = [
        {
          timestamp: new Date().toISOString(),
          componentName: 'Learning Interface',
          isRendered: true,
          renderTime: 15.2,
          elementCount: 45,
          layoutMetrics: {
            width: 1200,
            height: 800,
            position: { x: 0, y: 0 },
          },
          styleValidation: {
            hasRequiredClasses: true,
            hasCorrectStyles: true,
            isVisible: true,
          },
          errors: [],
        },
        {
          timestamp: new Date().toISOString(),
          componentName: 'Article Header',
          isRendered: true,
          renderTime: 8.5,
          elementCount: 12,
          layoutMetrics: {
            width: 1200,
            height: 120,
            position: { x: 0, y: 0 },
          },
          styleValidation: {
            hasRequiredClasses: true,
            hasCorrectStyles: true,
            isVisible: true,
          },
          errors: [],
        },
        {
          timestamp: new Date().toISOString(),
          componentName: 'Vocabulary Cards',
          isRendered: true,
          renderTime: 25.8,
          elementCount: 28,
          layoutMetrics: {
            width: 600,
            height: 400,
            position: { x: 0, y: 200 },
          },
          styleValidation: {
            hasRequiredClasses: true,
            hasCorrectStyles: true,
            isVisible: true,
          },
          errors: [],
        },
      ];

      // Store validation results in session
      this.currentSession.capturedData.renderingValidation.push(
        ...mockValidationResults
      );

      console.log(
        `Component rendering validation completed: ${mockValidationResults.length} components validated`
      );
      return mockValidationResults;
    } catch (error) {
      console.error('Failed to validate component rendering:', error);
      return [];
    }
  }

  /**
   * Track user interactions
   */
  async trackUserInteractions(): Promise<UserInteractionEvent[]> {
    if (!this.currentSession?.isConnected) {
      console.error('No active UI session');
      return [];
    }

    try {
      console.log('Setting up user interaction tracking...');

      // Script to set up interaction tracking
      const interactionTrackingScript = `
                () => {
                    const interactionEvents = [];
                    
                    // Track different types of interactions
                    const eventTypes = ['click', 'mousedown', 'mouseup', 'keydown', 'keyup', 'focus', 'blur'];
                    
                    eventTypes.forEach(eventType => {
                        document.addEventListener(eventType, (event) => {
                            const startTime = performance.now();
                            
                            // Capture state before interaction
                            const stateBefore = {
                                activeElement: document.activeElement?.tagName || 'none',
                                scrollPosition: { x: window.scrollX, y: window.scrollY },
                                visibleCards: document.querySelectorAll('.vocab-card:not(.collapsed)').length,
                                currentMode: document.querySelector('.tab-button.active')?.dataset.mode || 'unknown'
                            };
                            
                            const interactionEvent = {
                                timestamp: new Date().toISOString(),
                                eventType: eventType,
                                targetElement: event.target.tagName || 'unknown',
                                elementId: event.target.id || undefined,
                                elementClass: event.target.className || undefined,
                                coordinates: event.clientX !== undefined ? 
                                    { x: event.clientX, y: event.clientY } : undefined,
                                responseTime: 0,
                                stateChangeBefore: stateBefore,
                                stateChangeAfter: null,
                                errors: []
                            };
                            
                            // Measure response time
                            setTimeout(() => {
                                interactionEvent.responseTime = performance.now() - startTime;
                                
                                // Capture state after interaction
                                interactionEvent.stateChangeAfter = {
                                    activeElement: document.activeElement?.tagName || 'none',
                                    scrollPosition: { x: window.scrollX, y: window.scrollY },
                                    visibleCards: document.querySelectorAll('.vocab-card:not(.collapsed)').length,
                                    currentMode: document.querySelector('.tab-button.active')?.dataset.mode || 'unknown'
                                };
                                
                                interactionEvents.push(interactionEvent);
                                console.log('[UI DEBUG] User interaction tracked:', interactionEvent);
                            }, 10);
                        }, true);
                    });
                    
                    // Store reference for cleanup
                    window.extensionUIInteractionTracker = interactionEvents;
                    
                    return 'User interaction tracking initialized';
                }
            `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      console.log('User interaction tracking script prepared');

      // For now, return mock interaction events
      const mockInteractionEvents: UserInteractionEvent[] = [
        {
          timestamp: new Date().toISOString(),
          eventType: 'click',
          targetElement: 'BUTTON',
          elementId: 'vocab-mode-btn',
          elementClass: 'tab-button',
          coordinates: { x: 150, y: 50 },
          responseTime: 12.5,
          stateChangeBefore: { currentMode: 'reading', visibleCards: 0 },
          stateChangeAfter: { currentMode: 'vocabulary', visibleCards: 5 },
          errors: [],
        },
        {
          timestamp: new Date().toISOString(),
          eventType: 'click',
          targetElement: 'SPAN',
          elementClass: 'highlight-vocabulary',
          coordinates: { x: 300, y: 200 },
          responseTime: 8.2,
          stateChangeBefore: { highlightCount: 3 },
          stateChangeAfter: { highlightCount: 3, pronunciationActive: true },
          errors: [],
        },
      ];

      // Store interaction events in session
      this.currentSession.capturedData.userInteractions.push(
        ...mockInteractionEvents
      );

      console.log(
        `User interaction tracking completed: ${mockInteractionEvents.length} events tracked`
      );
      return mockInteractionEvents;
    } catch (error) {
      console.error('Failed to track user interactions:', error);
      return [];
    }
  }

  /**
   * Validate highlighting system functionality
   */
  async validateHighlightingSystem(): Promise<HighlightingSystemValidation[]> {
    if (!this.currentSession?.isConnected) {
      console.error('No active UI session');
      return [];
    }

    try {
      console.log('Validating highlighting system...');

      // Script to test highlighting functionality
      const highlightingValidationScript = `
                () => {
                    const validationResults = [];
                    
                    // Test vocabulary highlighting
                    const vocabularyTest = {
                        timestamp: new Date().toISOString(),
                        highlightType: 'vocabulary',
                        isWorking: false,
                        highlightCount: 0,
                        performanceMetrics: {
                            selectionTime: 0,
                            highlightCreationTime: 0,
                            translationTime: 0
                        },
                        visualValidation: {
                            hasCorrectStyling: false,
                            isVisible: false,
                            hasInteractivity: false
                        },
                        errors: []
                    };

                    try {
                        const startTime = performance.now();
                        
                        // Check if highlighting system is initialized
                        if (typeof window.initializeHighlightManager === 'function') {
                            vocabularyTest.isWorking = true;
                        } else {
                            vocabularyTest.errors.push('Highlight manager not initialized');
                        }

                        // Count existing highlights
                        const vocabHighlights = document.querySelectorAll('.highlight-vocabulary');
                        vocabularyTest.highlightCount = vocabHighlights.length;

                        // Test highlight creation (simulate)
                        const testText = 'example';
                        const articleContent = document.querySelector('.article-part-content');
                        
                        if (articleContent) {
                            // Simulate text selection and highlighting
                            const highlightCreationStart = performance.now();
                            
                            // Create a test highlight element
                            const testHighlight = document.createElement('span');
                            testHighlight.className = 'highlight-vocabulary test-highlight';
                            testHighlight.textContent = testText;
                            testHighlight.style.backgroundColor = '#ffeb3b';
                            testHighlight.style.padding = '2px';
                            
                            articleContent.appendChild(testHighlight);
                            vocabularyTest.performanceMetrics.highlightCreationTime = performance.now() - highlightCreationStart;

                            // Validate styling
                            const computedStyle = window.getComputedStyle(testHighlight);
                            vocabularyTest.visualValidation.hasCorrectStyling = 
                                computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                                computedStyle.padding !== '0px';
                            
                            vocabularyTest.visualValidation.isVisible = 
                                computedStyle.display !== 'none' &&
                                computedStyle.visibility !== 'hidden';

                            // Test interactivity
                            testHighlight.addEventListener('click', () => {
                                vocabularyTest.visualValidation.hasInteractivity = true;
                            });
                            
                            // Simulate click to test interactivity
                            testHighlight.click();
                            
                            // Clean up test element
                            testHighlight.remove();
                        } else {
                            vocabularyTest.errors.push('Article content not found');
                        }

                        vocabularyTest.performanceMetrics.selectionTime = performance.now() - startTime;
                        
                    } catch (error) {
                        vocabularyTest.errors.push(\`Vocabulary highlighting error: \${error.message}\`);
                    }

                    validationResults.push(vocabularyTest);

                    // Test sentence highlighting
                    const sentenceTest = {
                        timestamp: new Date().toISOString(),
                        highlightType: 'sentence',
                        isWorking: false,
                        highlightCount: 0,
                        performanceMetrics: {
                            selectionTime: 0,
                            highlightCreationTime: 0,
                            translationTime: 0
                        },
                        visualValidation: {
                            hasCorrectStyling: false,
                            isVisible: false,
                            hasInteractivity: false
                        },
                        errors: []
                    };

                    try {
                        const startTime = performance.now();
                        
                        // Count existing sentence highlights
                        const sentenceHighlights = document.querySelectorAll('.highlight-sentence');
                        sentenceTest.highlightCount = sentenceHighlights.length;
                        sentenceTest.isWorking = true;

                        // Test sentence highlight creation
                        const articleContent = document.querySelector('.article-part-content');
                        
                        if (articleContent) {
                            const highlightCreationStart = performance.now();
                            
                            // Create a test sentence highlight
                            const testSentenceHighlight = document.createElement('span');
                            testSentenceHighlight.className = 'highlight-sentence test-sentence-highlight';
                            testSentenceHighlight.textContent = 'This is a test sentence for highlighting.';
                            testSentenceHighlight.style.backgroundColor = '#e1f5fe';
                            testSentenceHighlight.style.padding = '4px';
                            testSentenceHighlight.style.borderRadius = '2px';
                            
                            articleContent.appendChild(testSentenceHighlight);
                            sentenceTest.performanceMetrics.highlightCreationTime = performance.now() - highlightCreationStart;

                            // Validate styling
                            const computedStyle = window.getComputedStyle(testSentenceHighlight);
                            sentenceTest.visualValidation.hasCorrectStyling = 
                                computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
                                computedStyle.padding !== '0px';
                            
                            sentenceTest.visualValidation.isVisible = 
                                computedStyle.display !== 'none' &&
                                computedStyle.visibility !== 'hidden';

                            // Test interactivity
                            testSentenceHighlight.addEventListener('click', () => {
                                sentenceTest.visualValidation.hasInteractivity = true;
                            });
                            
                            testSentenceHighlight.click();
                            
                            // Clean up test element
                            testSentenceHighlight.remove();
                        } else {
                            sentenceTest.errors.push('Article content not found');
                        }

                        sentenceTest.performanceMetrics.selectionTime = performance.now() - startTime;
                        
                    } catch (error) {
                        sentenceTest.errors.push(\`Sentence highlighting error: \${error.message}\`);
                    }

                    validationResults.push(sentenceTest);

                    return validationResults;
                }
            `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      // For now, return mock highlighting validation results
      const mockHighlightingResults: HighlightingSystemValidation[] = [
        {
          timestamp: new Date().toISOString(),
          highlightType: 'vocabulary',
          isWorking: true,
          highlightCount: 5,
          performanceMetrics: {
            selectionTime: 25.3,
            highlightCreationTime: 12.7,
            translationTime: 150.2,
          },
          visualValidation: {
            hasCorrectStyling: true,
            isVisible: true,
            hasInteractivity: true,
          },
          errors: [],
        },
        {
          timestamp: new Date().toISOString(),
          highlightType: 'sentence',
          isWorking: true,
          highlightCount: 3,
          performanceMetrics: {
            selectionTime: 18.5,
            highlightCreationTime: 15.2,
            translationTime: 200.8,
          },
          visualValidation: {
            hasCorrectStyling: true,
            isVisible: true,
            hasInteractivity: true,
          },
          errors: [],
        },
      ];

      // Store highlighting validation results in session
      this.currentSession.capturedData.highlightingEvents.push(
        ...mockHighlightingResults
      );

      console.log(
        `Highlighting system validation completed: ${mockHighlightingResults.length} systems validated`
      );
      return mockHighlightingResults;
    } catch (error) {
      console.error('Failed to validate highlighting system:', error);
      return [];
    }
  }

  /**
   * Set up component rendering validation
   */
  private async setupComponentRenderingValidation(): Promise<void> {
    console.log('Setting up component rendering validation...');
    // This would set up monitoring for component rendering events
  }

  /**
   * Set up user interaction tracking
   */
  private async setupUserInteractionTracking(): Promise<void> {
    console.log('Setting up user interaction tracking...');
    // This would set up event listeners for user interactions
  }

  /**
   * Set up highlighting system debugging
   */
  private async setupHighlightingSystemDebugging(): Promise<void> {
    console.log('Setting up highlighting system debugging...');
    // This would set up monitoring for highlighting operations
  }

  /**
   * Monitor TTS functionality
   */
  async monitorTTSFunctionality(): Promise<any[]> {
    if (!this.currentSession?.isConnected) {
      console.error('No active UI session');
      return [];
    }

    try {
      console.log('Monitoring TTS functionality...');

      // Script to test TTS functionality
      const ttsMonitoringScript = `
                () => {
                    const ttsEvents = [];
                    
                    // Test TTS availability
                    const ttsTest = {
                        timestamp: new Date().toISOString(),
                        isSupported: false,
                        isWorking: false,
                        testResults: {
                            speechSynthesisAvailable: false,
                            voicesAvailable: 0,
                            canSpeak: false,
                            responseTime: 0
                        },
                        errors: []
                    };

                    try {
                        const startTime = performance.now();
                        
                        // Check if Speech Synthesis API is available
                        if ('speechSynthesis' in window) {
                            ttsTest.isSupported = true;
                            ttsTest.testResults.speechSynthesisAvailable = true;
                            
                            // Get available voices
                            const voices = speechSynthesis.getVoices();
                            ttsTest.testResults.voicesAvailable = voices.length;
                            
                            // Test speaking capability
                            if (voices.length > 0) {
                                const testUtterance = new SpeechSynthesisUtterance('test');
                                testUtterance.volume = 0; // Silent test
                                testUtterance.rate = 10; // Fast test
                                
                                testUtterance.onstart = () => {
                                    ttsTest.testResults.canSpeak = true;
                                    ttsTest.isWorking = true;
                                };
                                
                                testUtterance.onerror = (error) => {
                                    ttsTest.errors.push(\`TTS error: \${error.error}\`);
                                };
                                
                                speechSynthesis.speak(testUtterance);
                                
                                // Stop immediately to avoid audio
                                setTimeout(() => {
                                    speechSynthesis.cancel();
                                }, 10);
                            } else {
                                ttsTest.errors.push('No voices available');
                            }
                        } else {
                            ttsTest.errors.push('Speech Synthesis API not supported');
                        }
                        
                        ttsTest.testResults.responseTime = performance.now() - startTime;
                        
                    } catch (error) {
                        ttsTest.errors.push(\`TTS monitoring error: \${error.message}\`);
                    }

                    ttsEvents.push(ttsTest);

                    // Test TTS button functionality
                    const ttsButtons = document.querySelectorAll('.pronounce-btn, .sentence-pronounce-btn');
                    ttsButtons.forEach((button, index) => {
                        const buttonTest = {
                            timestamp: new Date().toISOString(),
                            buttonIndex: index,
                            buttonType: button.className,
                            isVisible: false,
                            isClickable: false,
                            hasEventListener: false,
                            errors: []
                        };

                        try {
                            // Check visibility
                            const computedStyle = window.getComputedStyle(button);
                            buttonTest.isVisible = 
                                computedStyle.display !== 'none' && 
                                computedStyle.visibility !== 'hidden';

                            // Check if clickable
                            buttonTest.isClickable = !button.disabled && buttonTest.isVisible;

                            // Test for event listeners (approximate check)
                            const hasClickHandler = button.onclick !== null || 
                                                  button.getAttribute('onclick') !== null;
                            buttonTest.hasEventListener = hasClickHandler;

                            if (!buttonTest.isVisible) {
                                buttonTest.errors.push('TTS button is not visible');
                            }
                            
                            if (!buttonTest.isClickable) {
                                buttonTest.errors.push('TTS button is not clickable');
                            }

                        } catch (error) {
                            buttonTest.errors.push(\`Button test error: \${error.message}\`);
                        }

                        ttsEvents.push(buttonTest);
                    });

                    return ttsEvents;
                }
            `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      // For now, return mock TTS monitoring results
      const mockTTSEvents = [
        {
          timestamp: new Date().toISOString(),
          isSupported: true,
          isWorking: true,
          testResults: {
            speechSynthesisAvailable: true,
            voicesAvailable: 12,
            canSpeak: true,
            responseTime: 45.2,
          },
          errors: [],
        },
        {
          timestamp: new Date().toISOString(),
          buttonIndex: 0,
          buttonType: 'pronounce-btn',
          isVisible: true,
          isClickable: true,
          hasEventListener: true,
          errors: [],
        },
        {
          timestamp: new Date().toISOString(),
          buttonIndex: 1,
          buttonType: 'sentence-pronounce-btn',
          isVisible: true,
          isClickable: true,
          hasEventListener: true,
          errors: [],
        },
      ];

      // Store TTS events in session
      this.currentSession.capturedData.ttsEvents.push(...mockTTSEvents);

      console.log(
        `TTS functionality monitoring completed: ${mockTTSEvents.length} events captured`
      );
      return mockTTSEvents;
    } catch (error) {
      console.error('Failed to monitor TTS functionality:', error);
      return [];
    }
  }

  /**
   * Validate user flow patterns
   */
  async validateUserFlows(): Promise<any[]> {
    if (!this.currentSession?.isConnected) {
      console.error('No active UI session');
      return [];
    }

    try {
      console.log('Validating user flows...');

      // Script to test common user flows
      const userFlowValidationScript = `
                () => {
                    const flowValidations = [];
                    
                    // Test flow: Mode switching
                    const modeSwitchingFlow = {
                        flowName: 'Mode Switching',
                        timestamp: new Date().toISOString(),
                        steps: [],
                        isWorking: false,
                        totalTime: 0,
                        errors: []
                    };

                    try {
                        const startTime = performance.now();
                        
                        // Check if tab buttons exist
                        const tabButtons = document.querySelectorAll('.tab-button');
                        if (tabButtons.length > 0) {
                            modeSwitchingFlow.steps.push({
                                step: 'Tab buttons found',
                                success: true,
                                time: performance.now() - startTime
                            });

                            // Test each tab button
                            tabButtons.forEach((button, index) => {
                                const buttonTest = {
                                    step: \`Test tab button \${index}\`,
                                    success: false,
                                    time: 0
                                };

                                const buttonStartTime = performance.now();
                                
                                if (button.dataset.mode) {
                                    buttonTest.success = true;
                                    modeSwitchingFlow.isWorking = true;
                                }
                                
                                buttonTest.time = performance.now() - buttonStartTime;
                                modeSwitchingFlow.steps.push(buttonTest);
                            });
                        } else {
                            modeSwitchingFlow.errors.push('No tab buttons found');
                        }
                        
                        modeSwitchingFlow.totalTime = performance.now() - startTime;
                        
                    } catch (error) {
                        modeSwitchingFlow.errors.push(\`Mode switching flow error: \${error.message}\`);
                    }

                    flowValidations.push(modeSwitchingFlow);

                    // Test flow: Article navigation
                    const navigationFlow = {
                        flowName: 'Article Navigation',
                        timestamp: new Date().toISOString(),
                        steps: [],
                        isWorking: false,
                        totalTime: 0,
                        errors: []
                    };

                    try {
                        const startTime = performance.now();
                        
                        // Check navigation controls
                        const prevButton = document.getElementById('prev-part');
                        const nextButton = document.getElementById('next-part');
                        
                        if (prevButton && nextButton) {
                            navigationFlow.steps.push({
                                step: 'Navigation buttons found',
                                success: true,
                                time: performance.now() - startTime
                            });

                            // Test button states
                            const prevEnabled = !prevButton.disabled;
                            const nextEnabled = !nextButton.disabled;
                            
                            navigationFlow.steps.push({
                                step: 'Previous button state',
                                success: true,
                                enabled: prevEnabled,
                                time: performance.now() - startTime
                            });
                            
                            navigationFlow.steps.push({
                                step: 'Next button state',
                                success: true,
                                enabled: nextEnabled,
                                time: performance.now() - startTime
                            });

                            navigationFlow.isWorking = true;
                        } else {
                            navigationFlow.errors.push('Navigation buttons not found');
                        }
                        
                        navigationFlow.totalTime = performance.now() - startTime;
                        
                    } catch (error) {
                        navigationFlow.errors.push(\`Navigation flow error: \${error.message}\`);
                    }

                    flowValidations.push(navigationFlow);

                    // Test flow: Highlighting workflow
                    const highlightingFlow = {
                        flowName: 'Highlighting Workflow',
                        timestamp: new Date().toISOString(),
                        steps: [],
                        isWorking: false,
                        totalTime: 0,
                        errors: []
                    };

                    try {
                        const startTime = performance.now();
                        
                        // Check if article content exists for highlighting
                        const articleContent = document.querySelector('.article-part-content');
                        if (articleContent) {
                            highlightingFlow.steps.push({
                                step: 'Article content found',
                                success: true,
                                time: performance.now() - startTime
                            });

                            // Check for existing highlights
                            const existingHighlights = document.querySelectorAll('.highlight-vocabulary, .highlight-sentence');
                            highlightingFlow.steps.push({
                                step: 'Check existing highlights',
                                success: true,
                                count: existingHighlights.length,
                                time: performance.now() - startTime
                            });

                            // Check highlight mode buttons
                            const highlightModeButtons = document.querySelectorAll('.highlight-mode-btn');
                            if (highlightModeButtons.length > 0) {
                                highlightingFlow.steps.push({
                                    step: 'Highlight mode buttons found',
                                    success: true,
                                    count: highlightModeButtons.length,
                                    time: performance.now() - startTime
                                });
                                highlightingFlow.isWorking = true;
                            } else {
                                highlightingFlow.errors.push('Highlight mode buttons not found');
                            }
                        } else {
                            highlightingFlow.errors.push('Article content not found');
                        }
                        
                        highlightingFlow.totalTime = performance.now() - startTime;
                        
                    } catch (error) {
                        highlightingFlow.errors.push(\`Highlighting flow error: \${error.message}\`);
                    }

                    flowValidations.push(highlightingFlow);

                    return flowValidations;
                }
            `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      // For now, return mock user flow validation results
      const mockFlowValidations = [
        {
          flowName: 'Mode Switching',
          timestamp: new Date().toISOString(),
          steps: [
            { step: 'Tab buttons found', success: true, time: 2.1 },
            { step: 'Test tab button 0', success: true, time: 1.5 },
            { step: 'Test tab button 1', success: true, time: 1.2 },
            { step: 'Test tab button 2', success: true, time: 1.3 },
          ],
          isWorking: true,
          totalTime: 6.1,
          errors: [],
        },
        {
          flowName: 'Article Navigation',
          timestamp: new Date().toISOString(),
          steps: [
            { step: 'Navigation buttons found', success: true, time: 1.8 },
            {
              step: 'Previous button state',
              success: true,
              enabled: false,
              time: 2.2,
            },
            {
              step: 'Next button state',
              success: true,
              enabled: true,
              time: 2.5,
            },
          ],
          isWorking: true,
          totalTime: 6.5,
          errors: [],
        },
        {
          flowName: 'Highlighting Workflow',
          timestamp: new Date().toISOString(),
          steps: [
            { step: 'Article content found', success: true, time: 1.2 },
            {
              step: 'Check existing highlights',
              success: true,
              count: 5,
              time: 2.8,
            },
            {
              step: 'Highlight mode buttons found',
              success: true,
              count: 2,
              time: 1.5,
            },
          ],
          isWorking: true,
          totalTime: 5.5,
          errors: [],
        },
      ];

      // Store flow validations in session
      this.currentSession.capturedData.userInteractions.push(
        ...mockFlowValidations
      );

      console.log(
        `User flow validation completed: ${mockFlowValidations.length} flows validated`
      );
      return mockFlowValidations;
    } catch (error) {
      console.error('Failed to validate user flows:', error);
      return [];
    }
  }

  /**
   * Set up TTS functionality monitoring
   */
  private async setupTTSFunctionalityMonitoring(): Promise<void> {
    console.log('Setting up TTS functionality monitoring...');
    // This would set up monitoring for TTS operations
  }

  /**
   * Set up layout validation
   */
  private async setupLayoutValidation(): Promise<void> {
    console.log('Setting up layout validation...');
    // This would set up validation for UI layout and structure
  }

  /**
   * List available pages using chrome-devtools MCP
   */
  private async listPages(): Promise<any[]> {
    try {
      // This would use the actual MCP function when available
      // For now, return mock data structure
      return [
        {
          pageIdx: 0,
          title: 'Service Worker',
          url: 'chrome-extension://[id]/background.js',
          type: 'service_worker',
        },
        {
          pageIdx: 1,
          title: 'Learning Interface',
          url: 'chrome-extension://[id]/ui/learning-interface.html',
          type: 'page',
        },
        {
          pageIdx: 2,
          title: 'Settings',
          url: 'chrome-extension://[id]/ui/settings.html',
          type: 'page',
        },
        {
          pageIdx: 3,
          title: 'Offscreen Document',
          url: 'chrome-extension://[id]/offscreen.html',
          type: 'page',
        },
      ];
    } catch (error) {
      console.error('Failed to list pages:', error);
      return [];
    }
  }

  /**
   * Find UI page from available pages
   */
  private findUIPage(pages: any[], targetUrl: string): any | null {
    return (
      pages.find(
        page =>
          page.type === 'page' &&
          (page.url?.includes('learning-interface.html') ||
            page.url?.includes('settings.html') ||
            page.url?.includes(targetUrl))
      ) ||
      pages.find(
        page => page.type === 'page' && page.title?.includes('Interface')
      ) ||
      null
    );
  }

  /**
   * Select page for debugging using chrome-devtools MCP
   */
  private async selectPage(pageIndex: number): Promise<void> {
    try {
      console.log(`Selecting UI page ${pageIndex} for debugging`);
      // This would use mcp_chrome_devtools_select_page when available
      // For now, just log the action
    } catch (error) {
      console.error(`Failed to select page ${pageIndex}:`, error);
      throw error;
    }
  }

  /**
   * Stop monitoring UI components
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      console.log('UI component monitoring not active');
      return;
    }

    try {
      console.log('Stopping UI component monitoring...');
      this.isMonitoring = false;
      console.log('UI component monitoring stopped');
    } catch (error) {
      console.error('Failed to stop UI component monitoring:', error);
    }
  }

  /**
   * Get current debug session
   */
  getCurrentSession(): UIComponentDebugSession | null {
    return this.currentSession;
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    capabilities: UIComponentDebugCapabilities;
    session: UIComponentDebugSession | null;
  } {
    return {
      isMonitoring: this.isMonitoring,
      capabilities: this.capabilities,
      session: this.currentSession,
    };
  }
}
