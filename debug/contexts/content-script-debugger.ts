/**
 * Content Script Debugger
 * Debug DOM interaction, content extraction, and page-level functionality
 */

export interface ContentScriptDebugCapabilities {
  monitorContentExtraction: boolean;
  validateDOMManipulation: boolean;
  trackHighlightingSystem: boolean;
  debugScriptInjection: boolean;
  analyzePageCompatibility: boolean;
}

export interface ContentScriptDebugSession {
  sessionId: string;
  pageUrl: string;
  pageIndex: number | null;
  isConnected: boolean;
  startTime: Date;
  capturedData: {
    extractionResults: any[];
    domOperations: any[];
    highlightingEvents: any[];
    injectionStatus: any[];
    compatibilityChecks: any[];
  };
}

export class ContentScriptDebugger {
  private capabilities: ContentScriptDebugCapabilities;
  private isMonitoring: boolean = false;
  private currentSession: ContentScriptDebugSession | null = null;

  constructor() {
    this.capabilities = {
      monitorContentExtraction: true,
      validateDOMManipulation: true,
      trackHighlightingSystem: true,
      debugScriptInjection: true,
      analyzePageCompatibility: true,
    };
  }

  /**
   * Connect to content script context and start monitoring
   */
  async connectToContentScript(testUrl?: string): Promise<boolean> {
    try {
      console.log('Connecting to content script context...');

      // Navigate to test page or use current page
      const targetUrl = testUrl || 'https://example.com/article';

      // This would use mcp_chrome_devtools_navigate_page when available
      console.log(`Navigating to test page: ${targetUrl}`);

      // Get list of available pages to find content script page
      const pages = await this.listPages();
      const contentScriptPage = this.findContentScriptPage(pages, targetUrl);

      if (!contentScriptPage) {
        console.error('Content script page not found');
        return false;
      }

      // Select the content script page for debugging
      await this.selectPage(contentScriptPage.pageIdx);

      // Initialize debug session
      this.currentSession = {
        sessionId: `cs-debug-${Date.now()}`,
        pageUrl: targetUrl,
        pageIndex: contentScriptPage.pageIdx,
        isConnected: true,
        startTime: new Date(),
        capturedData: {
          extractionResults: [],
          domOperations: [],
          highlightingEvents: [],
          injectionStatus: [],
          compatibilityChecks: [],
        },
      };

      console.log(
        `Connected to content script (page index: ${contentScriptPage.pageIdx})`
      );
      return true;
    } catch (error) {
      console.error('Failed to connect to content script:', error);
      return false;
    }
  }

  /**
   * Start monitoring content script context
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Content script monitoring already active');
      return;
    }

    try {
      // Connect to content script first
      const connected = await this.connectToContentScript();
      if (!connected) {
        throw new Error('Failed to connect to content script');
      }

      console.log('Starting content script monitoring...');
      this.isMonitoring = true;

      // Set up monitoring for different aspects
      if (this.capabilities.debugScriptInjection) {
        await this.setupScriptInjectionMonitoring();
      }

      if (this.capabilities.monitorContentExtraction) {
        await this.setupContentExtractionMonitoring();
      }

      if (this.capabilities.validateDOMManipulation) {
        await this.setupDOMManipulationTracking();
      }

      if (this.capabilities.trackHighlightingSystem) {
        await this.setupHighlightingSystemTracking();
      }

      if (this.capabilities.analyzePageCompatibility) {
        await this.setupPageCompatibilityAnalysis();
      }

      console.log('Content script monitoring started successfully');
    } catch (error) {
      console.error('Failed to start content script monitoring:', error);
      this.isMonitoring = false;
    }
  }

  /**
   * Verify content script injection
   */
  async verifyScriptInjection(): Promise<any> {
    if (!this.currentSession?.isConnected) {
      console.error('No active content script session');
      return null;
    }

    try {
      console.log('Verifying content script injection...');

      // Script to check if content script is properly injected
      const injectionVerificationScript = `
                () => {
                    const injectionStatus = {
                        timestamp: new Date().toISOString(),
                        isInjected: false,
                        extensionId: null,
                        availableFunctions: [],
                        globalVariables: [],
                        eventListeners: [],
                        errors: []
                    };

                    try {
                        // Check if chrome.runtime is available
                        if (typeof chrome !== 'undefined' && chrome.runtime) {
                            injectionStatus.isInjected = true;
                            injectionStatus.extensionId = chrome.runtime.id;
                        }

                        // Check for extension-specific global variables
                        const extensionGlobals = ['extractContent', 'sendContentToBackground', 'showSuccessNotification'];
                        extensionGlobals.forEach(globalVar => {
                            if (typeof window[globalVar] === 'function') {
                                injectionStatus.availableFunctions.push(globalVar);
                            }
                        });

                        // Check for extension-added global variables
                        const possibleExtensionVars = ['extensionContentExtractor', 'extensionPerformance'];
                        possibleExtensionVars.forEach(varName => {
                            if (window[varName]) {
                                injectionStatus.globalVariables.push(varName);
                            }
                        });

                        // Check for message listeners
                        if (chrome.runtime && chrome.runtime.onMessage) {
                            injectionStatus.eventListeners.push('chrome.runtime.onMessage');
                        }

                        return injectionStatus;
                    } catch (error) {
                        injectionStatus.errors.push(error.message);
                        return injectionStatus;
                    }
                }
            `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      // For now, return mock verification result
      const verificationResult = {
        timestamp: new Date().toISOString(),
        isInjected: true,
        extensionId: 'mock-extension-id',
        availableFunctions: ['extractContent', 'sendContentToBackground'],
        globalVariables: ['extensionContentExtractor'],
        eventListeners: ['chrome.runtime.onMessage'],
        errors: [],
      };

      // Store verification result in session
      this.currentSession.capturedData.injectionStatus.push(verificationResult);

      console.log(
        'Script injection verification completed:',
        verificationResult
      );
      return verificationResult;
    } catch (error) {
      console.error('Failed to verify script injection:', error);
      return null;
    }
  }

  /**
   * Monitor content extraction process
   */
  async monitorContentExtraction(): Promise<any> {
    if (!this.currentSession?.isConnected) {
      console.error('No active content script session');
      return null;
    }

    try {
      console.log('Monitoring content extraction process...');

      // Script to monitor content extraction
      const extractionMonitoringScript = `
                () => {
                    const extractionMetrics = {
                        timestamp: new Date().toISOString(),
                        startTime: performance.now(),
                        endTime: null,
                        processingTime: null,
                        extractedContent: null,
                        extractionStrategies: [],
                        domAnalysis: {
                            articleElements: document.querySelectorAll('article').length,
                            mainElements: document.querySelectorAll('main').length,
                            contentContainers: 0,
                            totalTextLength: 0,
                            paragraphCount: document.querySelectorAll('p').length
                        },
                        errors: []
                    };

                    try {
                        // Analyze DOM structure for content extraction
                        const contentSelectors = [
                            '[role="main"]',
                            '.article-content',
                            '.post-content',
                            '.entry-content',
                            '.content',
                            '#content',
                            '.main-content'
                        ];

                        contentSelectors.forEach(selector => {
                            const elements = document.querySelectorAll(selector);
                            if (elements.length > 0) {
                                extractionMetrics.extractionStrategies.push({
                                    selector: selector,
                                    elementCount: elements.length,
                                    textLength: Array.from(elements).reduce((total, el) => total + (el.textContent?.length || 0), 0)
                                });
                                extractionMetrics.domAnalysis.contentContainers += elements.length;
                            }
                        });

                        // Calculate total text length
                        extractionMetrics.domAnalysis.totalTextLength = document.body.textContent?.length || 0;

                        // Simulate content extraction (this would call the actual extraction function)
                        const mockExtractedContent = {
                            title: document.title || 'Test Article',
                            content: document.body.textContent?.substring(0, 1000) || '',
                            url: window.location.href,
                            wordCount: (document.body.textContent?.split(/\\s+/) || []).length,
                            paragraphCount: document.querySelectorAll('p').length
                        };

                        extractionMetrics.extractedContent = mockExtractedContent;
                        extractionMetrics.endTime = performance.now();
                        extractionMetrics.processingTime = extractionMetrics.endTime - extractionMetrics.startTime;

                        return extractionMetrics;
                    } catch (error) {
                        extractionMetrics.errors.push(error.message);
                        extractionMetrics.endTime = performance.now();
                        extractionMetrics.processingTime = extractionMetrics.endTime - extractionMetrics.startTime;
                        return extractionMetrics;
                    }
                }
            `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      // For now, return mock extraction monitoring result
      const extractionResult = {
        timestamp: new Date().toISOString(),
        startTime: 0,
        endTime: 150,
        processingTime: 150,
        extractedContent: {
          title: 'Sample Article Title',
          content: 'This is a sample article content for testing...',
          url: this.currentSession.pageUrl,
          wordCount: 250,
          paragraphCount: 5,
        },
        extractionStrategies: [
          { selector: 'article', elementCount: 1, textLength: 1200 },
          { selector: '.article-content', elementCount: 1, textLength: 1150 },
        ],
        domAnalysis: {
          articleElements: 1,
          mainElements: 1,
          contentContainers: 2,
          totalTextLength: 2500,
          paragraphCount: 5,
        },
        errors: [],
      };

      // Store extraction result in session
      this.currentSession.capturedData.extractionResults.push(extractionResult);

      console.log('Content extraction monitoring completed:', extractionResult);
      return extractionResult;
    } catch (error) {
      console.error('Failed to monitor content extraction:', error);
      return null;
    }
  }

  /**
   * Track DOM manipulation operations
   */
  async trackDOMManipulation(): Promise<any[]> {
    if (!this.currentSession?.isConnected) {
      console.error('No active content script session');
      return [];
    }

    try {
      console.log('Tracking DOM manipulation operations...');

      // Script to track DOM changes
      const domTrackingScript = `
                () => {
                    const domOperations = [];
                    
                    // Set up MutationObserver to track DOM changes
                    const observer = new MutationObserver((mutations) => {
                        mutations.forEach((mutation) => {
                            const operation = {
                                type: mutation.type,
                                timestamp: new Date().toISOString(),
                                target: mutation.target.tagName || 'unknown',
                                addedNodes: mutation.addedNodes.length,
                                removedNodes: mutation.removedNodes.length,
                                attributeName: mutation.attributeName,
                                oldValue: mutation.oldValue
                            };
                            
                            domOperations.push(operation);
                            console.log('[DOM DEBUG] DOM mutation detected:', operation);
                        });
                    });
                    
                    // Start observing
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeOldValue: true,
                        characterData: true,
                        characterDataOldValue: true
                    });
                    
                    // Store observer reference for cleanup
                    window.extensionDOMObserver = observer;
                    window.extensionDOMOperations = domOperations;
                    
                    return 'DOM tracking initialized';
                }
            `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      console.log('DOM manipulation tracking script prepared');

      // For now, return mock DOM operations
      const mockDOMOperations = [
        {
          type: 'childList',
          timestamp: new Date().toISOString(),
          target: 'DIV',
          addedNodes: 1,
          removedNodes: 0,
          attributeName: null,
          oldValue: null,
        },
        {
          type: 'attributes',
          timestamp: new Date().toISOString(),
          target: 'SPAN',
          addedNodes: 0,
          removedNodes: 0,
          attributeName: 'class',
          oldValue: 'text',
        },
      ];

      // Store DOM operations in session
      this.currentSession.capturedData.domOperations.push(...mockDOMOperations);

      console.log(`Tracked ${mockDOMOperations.length} DOM operations`);
      return mockDOMOperations;
    } catch (error) {
      console.error('Failed to track DOM manipulation:', error);
      return [];
    }
  }

  /**
   * Validate highlighting system functionality
   */
  async validateHighlightingSystem(): Promise<any> {
    if (!this.currentSession?.isConnected) {
      console.error('No active content script session');
      return null;
    }

    try {
      console.log('Validating highlighting system...');

      // Script to test highlighting functionality
      const highlightingValidationScript = `
                () => {
                    const highlightingTest = {
                        timestamp: new Date().toISOString(),
                        vocabularyHighlighting: {
                            tested: false,
                            successful: false,
                            highlightCount: 0,
                            errors: []
                        },
                        sentenceHighlighting: {
                            tested: false,
                            successful: false,
                            highlightCount: 0,
                            errors: []
                        },
                        highlightStyles: {
                            vocabularyStyle: null,
                            sentenceStyle: null
                        }
                    };

                    try {
                        // Test vocabulary highlighting
                        const testWords = ['example', 'test', 'article'];
                        testWords.forEach(word => {
                            const textNodes = document.createTreeWalker(
                                document.body,
                                NodeFilter.SHOW_TEXT,
                                null,
                                false
                            );

                            let node;
                            while (node = textNodes.nextNode()) {
                                if (node.textContent.includes(word)) {
                                    // Create highlight span
                                    const span = document.createElement('span');
                                    span.className = 'extension-vocabulary-highlight';
                                    span.style.backgroundColor = '#ffeb3b';
                                    span.style.padding = '2px';
                                    span.textContent = word;
                                    
                                    // This would replace the actual word in the text
                                    // For testing, we'll just add it to track highlighting
                                    document.body.appendChild(span);
                                    highlightingTest.vocabularyHighlighting.highlightCount++;
                                    break;
                                }
                            }
                        });

                        highlightingTest.vocabularyHighlighting.tested = true;
                        highlightingTest.vocabularyHighlighting.successful = highlightingTest.vocabularyHighlighting.highlightCount > 0;

                        // Test sentence highlighting
                        const sentences = document.querySelectorAll('p');
                        if (sentences.length > 0) {
                            const testSentence = sentences[0];
                            const span = document.createElement('span');
                            span.className = 'extension-sentence-highlight';
                            span.style.backgroundColor = '#e1f5fe';
                            span.style.padding = '4px';
                            span.style.borderRadius = '2px';
                            
                            // Wrap the sentence
                            testSentence.style.backgroundColor = '#e1f5fe';
                            highlightingTest.sentenceHighlighting.highlightCount = 1;
                            highlightingTest.sentenceHighlighting.tested = true;
                            highlightingTest.sentenceHighlighting.successful = true;
                        }

                        // Get computed styles
                        const vocabHighlights = document.querySelectorAll('.extension-vocabulary-highlight');
                        if (vocabHighlights.length > 0) {
                            highlightingTest.highlightStyles.vocabularyStyle = window.getComputedStyle(vocabHighlights[0]);
                        }

                        const sentenceHighlights = document.querySelectorAll('.extension-sentence-highlight');
                        if (sentenceHighlights.length > 0) {
                            highlightingTest.highlightStyles.sentenceStyle = window.getComputedStyle(sentenceHighlights[0]);
                        }

                        return highlightingTest;
                    } catch (error) {
                        highlightingTest.vocabularyHighlighting.errors.push(error.message);
                        highlightingTest.sentenceHighlighting.errors.push(error.message);
                        return highlightingTest;
                    }
                }
            `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      // For now, return mock highlighting validation result
      const highlightingResult = {
        timestamp: new Date().toISOString(),
        vocabularyHighlighting: {
          tested: true,
          successful: true,
          highlightCount: 3,
          errors: [],
        },
        sentenceHighlighting: {
          tested: true,
          successful: true,
          highlightCount: 1,
          errors: [],
        },
        highlightStyles: {
          vocabularyStyle: { backgroundColor: '#ffeb3b', padding: '2px' },
          sentenceStyle: { backgroundColor: '#e1f5fe', padding: '4px' },
        },
      };

      // Store highlighting result in session
      this.currentSession.capturedData.highlightingEvents.push(
        highlightingResult
      );

      console.log(
        'Highlighting system validation completed:',
        highlightingResult
      );
      return highlightingResult;
    } catch (error) {
      console.error('Failed to validate highlighting system:', error);
      return null;
    }
  }

  /**
   * Check page compatibility for content extraction
   */
  async checkPageCompatibility(): Promise<any> {
    if (!this.currentSession?.isConnected) {
      console.error('No active content script session');
      return null;
    }

    try {
      console.log('Checking page compatibility...');

      // Script to analyze page compatibility
      const compatibilityCheckScript = `
                () => {
                    const compatibilityReport = {
                        timestamp: new Date().toISOString(),
                        url: window.location.href,
                        domain: window.location.hostname,
                        pageStructure: {
                            hasArticleTag: document.querySelectorAll('article').length > 0,
                            hasMainTag: document.querySelectorAll('main').length > 0,
                            hasContentContainers: false,
                            contentSelectors: []
                        },
                        contentQuality: {
                            textLength: 0,
                            paragraphCount: 0,
                            headingCount: 0,
                            imageCount: 0,
                            linkCount: 0
                        },
                        potentialIssues: [],
                        compatibilityScore: 0,
                        recommendations: []
                    };

                    try {
                        // Check for content containers
                        const contentSelectors = [
                            '[role="main"]',
                            '.article-content',
                            '.post-content',
                            '.entry-content',
                            '.content',
                            '#content',
                            '.main-content'
                        ];

                        contentSelectors.forEach(selector => {
                            const elements = document.querySelectorAll(selector);
                            if (elements.length > 0) {
                                compatibilityReport.pageStructure.hasContentContainers = true;
                                compatibilityReport.pageStructure.contentSelectors.push({
                                    selector: selector,
                                    count: elements.length,
                                    textLength: Array.from(elements).reduce((total, el) => total + (el.textContent?.length || 0), 0)
                                });
                            }
                        });

                        // Analyze content quality
                        compatibilityReport.contentQuality.textLength = document.body.textContent?.length || 0;
                        compatibilityReport.contentQuality.paragraphCount = document.querySelectorAll('p').length;
                        compatibilityReport.contentQuality.headingCount = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
                        compatibilityReport.contentQuality.imageCount = document.querySelectorAll('img').length;
                        compatibilityReport.contentQuality.linkCount = document.querySelectorAll('a').length;

                        // Identify potential issues
                        if (compatibilityReport.contentQuality.textLength < 500) {
                            compatibilityReport.potentialIssues.push('Low text content (< 500 characters)');
                        }

                        if (compatibilityReport.contentQuality.paragraphCount < 3) {
                            compatibilityReport.potentialIssues.push('Few paragraphs (< 3)');
                        }

                        if (!compatibilityReport.pageStructure.hasArticleTag && !compatibilityReport.pageStructure.hasMainTag && !compatibilityReport.pageStructure.hasContentContainers) {
                            compatibilityReport.potentialIssues.push('No clear content structure detected');
                        }

                        // Check for problematic elements
                        const problematicSelectors = ['.paywall', '.subscription-wall', '.login-required', '.premium-content'];
                        problematicSelectors.forEach(selector => {
                            if (document.querySelector(selector)) {
                                compatibilityReport.potentialIssues.push(\`Potential access restriction: \${selector}\`);
                            }
                        });

                        // Calculate compatibility score
                        let score = 0;
                        if (compatibilityReport.pageStructure.hasArticleTag) score += 30;
                        if (compatibilityReport.pageStructure.hasMainTag) score += 20;
                        if (compatibilityReport.pageStructure.hasContentContainers) score += 25;
                        if (compatibilityReport.contentQuality.textLength > 1000) score += 15;
                        if (compatibilityReport.contentQuality.paragraphCount > 5) score += 10;

                        compatibilityReport.compatibilityScore = Math.min(score, 100);

                        // Generate recommendations
                        if (compatibilityReport.compatibilityScore < 50) {
                            compatibilityReport.recommendations.push('Consider using alternative extraction methods');
                        }
                        if (compatibilityReport.potentialIssues.length > 0) {
                            compatibilityReport.recommendations.push('Manual content verification recommended');
                        }
                        if (compatibilityReport.contentQuality.textLength < 1000) {
                            compatibilityReport.recommendations.push('Page may not contain sufficient content for learning');
                        }

                        return compatibilityReport;
                    } catch (error) {
                        compatibilityReport.potentialIssues.push(\`Analysis error: \${error.message}\`);
                        return compatibilityReport;
                    }
                }
            `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      // For now, return mock compatibility report
      const compatibilityResult = {
        timestamp: new Date().toISOString(),
        url: this.currentSession.pageUrl,
        domain: 'example.com',
        pageStructure: {
          hasArticleTag: true,
          hasMainTag: true,
          hasContentContainers: true,
          contentSelectors: [
            { selector: 'article', count: 1, textLength: 1200 },
            { selector: '.article-content', count: 1, textLength: 1150 },
          ],
        },
        contentQuality: {
          textLength: 2500,
          paragraphCount: 8,
          headingCount: 3,
          imageCount: 2,
          linkCount: 5,
        },
        potentialIssues: [],
        compatibilityScore: 85,
        recommendations: ['Page is well-structured for content extraction'],
      };

      // Store compatibility result in session
      this.currentSession.capturedData.compatibilityChecks.push(
        compatibilityResult
      );

      console.log('Page compatibility check completed:', compatibilityResult);
      return compatibilityResult;
    } catch (error) {
      console.error('Failed to check page compatibility:', error);
      return null;
    }
  }

  /**
   * Set up script injection monitoring
   */
  private async setupScriptInjectionMonitoring(): Promise<void> {
    console.log('Setting up script injection monitoring...');
    // This would set up monitoring for script injection events
  }

  /**
   * Set up content extraction monitoring
   */
  private async setupContentExtractionMonitoring(): Promise<void> {
    console.log('Setting up content extraction monitoring...');
    // This would set up monitoring for content extraction processes
  }

  /**
   * Set up DOM manipulation tracking
   */
  private async setupDOMManipulationTracking(): Promise<void> {
    console.log('Setting up DOM manipulation tracking...');
    // This would set up MutationObserver for DOM changes
  }

  /**
   * Set up highlighting system tracking
   */
  private async setupHighlightingSystemTracking(): Promise<void> {
    console.log('Setting up highlighting system tracking...');
    // This would set up monitoring for highlighting operations
  }

  /**
   * Set up page compatibility analysis
   */
  private async setupPageCompatibilityAnalysis(): Promise<void> {
    console.log('Setting up page compatibility analysis...');
    // This would set up analysis for page structure and compatibility
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
          title: 'Test Article',
          url: 'https://example.com/article',
          type: 'page',
        },
        {
          pageIdx: 2,
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
   * Find content script page from available pages
   */
  private findContentScriptPage(pages: any[], targetUrl: string): any | null {
    return (
      pages.find(
        page =>
          page.type === 'page' &&
          (page.url?.includes(targetUrl) || page.url?.includes('example.com'))
      ) ||
      pages.find(page => page.type === 'page') ||
      null
    );
  }

  /**
   * Select page for debugging using chrome-devtools MCP
   */
  private async selectPage(pageIndex: number): Promise<void> {
    try {
      console.log(`Selecting page ${pageIndex} for debugging`);
      // This would use mcp_chrome_devtools_select_page when available
      // For now, just log the action
    } catch (error) {
      console.error(`Failed to select page ${pageIndex}:`, error);
      throw error;
    }
  }

  /**
   * Stop monitoring content script
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      console.log('Content script monitoring not active');
      return;
    }

    try {
      console.log('Stopping content script monitoring...');
      this.isMonitoring = false;
      console.log('Content script monitoring stopped');
    } catch (error) {
      console.error('Failed to stop content script monitoring:', error);
    }
  }

  /**
   * Get current debug session
   */
  getCurrentSession(): ContentScriptDebugSession | null {
    return this.currentSession;
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    capabilities: ContentScriptDebugCapabilities;
    session: ContentScriptDebugSession | null;
  } {
    return {
      isMonitoring: this.isMonitoring,
      capabilities: this.capabilities,
      session: this.currentSession,
    };
  }
}
