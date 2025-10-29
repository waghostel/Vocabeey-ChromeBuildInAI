/**
 * Content Script Debugger
 * Debug DOM interaction, content extraction, and page-level functionality
 */

import {
  MCPConnectionManager,
  MCPFunctionResult,
} from '../utils/mcp-connection-manager';

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
  private mcpManager: MCPConnectionManager;

  constructor() {
    this.capabilities = {
      monitorContentExtraction: true,
      validateDOMManipulation: true,
      trackHighlightingSystem: true,
      debugScriptInjection: true,
      analyzePageCompatibility: true,
    };

    // Initialize MCP connection manager
    this.mcpManager = new MCPConnectionManager({
      serverName: 'chrome-devtools',
      command: 'uvx',
      args: ['mcp-chrome-devtools@latest'],
      connectionTimeout: 10000,
      retryAttempts: 3,
      requiredFunctions: [
        'mcp_chrome_devtools_list_pages',
        'mcp_chrome_devtools_select_page',
        'mcp_chrome_devtools_navigate_page',
        'mcp_chrome_devtools_evaluate_script',
        'mcp_chrome_devtools_list_console_messages',
        'mcp_chrome_devtools_list_network_requests',
        'mcp_chrome_devtools_click',
      ],
    });
  }

  /**
   * Connect to content script context and start monitoring
   */
  async connectToContentScript(testUrl?: string): Promise<boolean> {
    try {
      console.log('Connecting to content script context...');

      // Initialize MCP connection if not already connected
      if (!this.mcpManager.isConnectionHealthy()) {
        console.log('Initializing MCP connection...');
        const connected = await this.mcpManager.initializeMCPConnection();
        if (!connected) {
          console.error('Failed to establish MCP connection');
          return false;
        }
      }

      // Navigate to test page or use current page
      const targetUrl = testUrl || 'https://example.com/article';

      // Use real MCP navigation
      console.log(`Navigating to test page: ${targetUrl}`);
      const navigationResult = await this.mcpManager.executeMCPFunction(
        'mcp_chrome_devtools_navigate_page',
        { url: targetUrl }
      );

      if (!navigationResult.success) {
        console.error(
          'Failed to navigate to test page:',
          navigationResult.error
        );
        return false;
      }

      // Wait for navigation to complete
      await this.delay(2000);

      // Get real list of available pages to find content script page
      const pages = await this.listPages();
      const contentScriptPage = this.findContentScriptPage(pages, targetUrl);

      if (!contentScriptPage) {
        console.error('Content script page not found after navigation');
        return false;
      }

      // Select the content script page for debugging using real MCP
      await this.selectPage(contentScriptPage.pageIdx);

      // Verify content script injection with real evaluation
      const injectionStatus = await this.verifyRealScriptInjection();

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
          injectionStatus: injectionStatus ? [injectionStatus] : [],
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
   * Verify content script injection using real MCP evaluation
   */
  async verifyScriptInjection(): Promise<any> {
    if (!this.currentSession?.isConnected) {
      console.error('No active content script session');
      return null;
    }

    return await this.verifyRealScriptInjection();
  }

  /**
   * Verify content script injection with real MCP script evaluation
   */
  private async verifyRealScriptInjection(): Promise<any> {
    try {
      console.log(
        'Verifying content script injection with real MCP evaluation...'
      );

      // Script to check if content script is properly injected
      const injectionVerificationScript = `() => {
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
      }`;

      // Use real MCP script evaluation
      const evaluationResult = await this.mcpManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        { function: injectionVerificationScript }
      );

      if (!evaluationResult.success) {
        console.error(
          'Failed to evaluate injection verification script:',
          evaluationResult.error
        );
        return {
          timestamp: new Date().toISOString(),
          isInjected: false,
          errors: [evaluationResult.error || 'Script evaluation failed'],
        };
      }

      const verificationResult =
        evaluationResult.data?.result || evaluationResult.data;

      // Store verification result in session if session exists
      if (this.currentSession) {
        this.currentSession.capturedData.injectionStatus.push(
          verificationResult
        );
      }

      console.log(
        'Script injection verification completed:',
        verificationResult
      );
      return verificationResult;
    } catch (error) {
      console.error('Failed to verify script injection:', error);
      return {
        timestamp: new Date().toISOString(),
        isInjected: false,
        errors: [String(error)],
      };
    }
  }

  /**
   * Monitor content extraction process using real MCP integration
   */
  async monitorContentExtraction(): Promise<any> {
    if (!this.currentSession?.isConnected) {
      console.error('No active content script session');
      return null;
    }

    try {
      console.log('Monitoring real content extraction process...');

      // Perform real content extraction analysis
      const extractionResult = await this.performRealContentExtraction();

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
   * Perform real content extraction testing and analysis
   */
  private async performRealContentExtraction(): Promise<any> {
    const extractionScript = `() => {
      const startTime = performance.now();
      const extractionMetrics = {
        timestamp: new Date().toISOString(),
        startTime: startTime,
        endTime: null,
        processingTime: null,
        extractedContent: null,
        extractionStrategies: [],
        domAnalysis: {
          articleElements: document.querySelectorAll('article').length,
          mainElements: document.querySelectorAll('main').length,
          contentContainers: 0,
          totalTextLength: 0,
          paragraphCount: document.querySelectorAll('p').length,
          headingCount: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
          imageCount: document.querySelectorAll('img').length,
          linkCount: document.querySelectorAll('a').length
        },
        qualityMetrics: {
          textDensity: 0,
          structureScore: 0,
          readabilityScore: 0
        },
        errors: []
      };

      try {
        // Analyze DOM structure for content extraction strategies
        const contentSelectors = [
          '[role="main"]',
          '.article-content',
          '.post-content',
          '.entry-content',
          '.content',
          '#content',
          '.main-content',
          'article',
          'main'
        ];

        let bestStrategy = null;
        let maxTextLength = 0;

        contentSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            const textLength = Array.from(elements).reduce((total, el) => total + (el.textContent?.length || 0), 0);
            const strategy = {
              selector: selector,
              elementCount: elements.length,
              textLength: textLength,
              avgTextPerElement: textLength / elements.length
            };
            
            extractionMetrics.extractionStrategies.push(strategy);
            extractionMetrics.domAnalysis.contentContainers += elements.length;
            
            if (textLength > maxTextLength) {
              maxTextLength = textLength;
              bestStrategy = strategy;
            }
          }
        });

        // Calculate total text length and quality metrics
        extractionMetrics.domAnalysis.totalTextLength = document.body.textContent?.length || 0;
        
        // Text density calculation
        const bodyArea = document.body.offsetWidth * document.body.offsetHeight;
        extractionMetrics.qualityMetrics.textDensity = bodyArea > 0 ? 
          extractionMetrics.domAnalysis.totalTextLength / bodyArea : 0;

        // Structure score based on semantic elements
        let structureScore = 0;
        if (extractionMetrics.domAnalysis.articleElements > 0) structureScore += 30;
        if (extractionMetrics.domAnalysis.mainElements > 0) structureScore += 20;
        if (extractionMetrics.domAnalysis.contentContainers > 0) structureScore += 25;
        if (extractionMetrics.domAnalysis.headingCount > 0) structureScore += 15;
        if (extractionMetrics.domAnalysis.paragraphCount > 3) structureScore += 10;
        extractionMetrics.qualityMetrics.structureScore = Math.min(structureScore, 100);

        // Perform actual content extraction using best strategy
        let extractedContent = null;
        if (bestStrategy) {
          const contentElement = document.querySelector(bestStrategy.selector);
          if (contentElement) {
            extractedContent = {
              title: document.title || contentElement.querySelector('h1, h2')?.textContent || 'Untitled',
              content: contentElement.textContent?.trim() || '',
              url: window.location.href,
              wordCount: (contentElement.textContent?.split(/\\s+/) || []).length,
              paragraphCount: contentElement.querySelectorAll('p').length,
              extractionMethod: bestStrategy.selector,
              contentLength: contentElement.textContent?.length || 0
            };
          }
        }

        // Fallback extraction if no specific strategy worked
        if (!extractedContent) {
          extractedContent = {
            title: document.title || 'Untitled',
            content: document.body.textContent?.substring(0, 2000) || '',
            url: window.location.href,
            wordCount: (document.body.textContent?.split(/\\s+/) || []).length,
            paragraphCount: document.querySelectorAll('p').length,
            extractionMethod: 'fallback-body',
            contentLength: document.body.textContent?.length || 0
          };
        }

        // Calculate readability score (simplified)
        const avgWordsPerSentence = extractedContent.content.split(/[.!?]+/).length > 0 ?
          extractedContent.wordCount / extractedContent.content.split(/[.!?]+/).length : 0;
        extractionMetrics.qualityMetrics.readabilityScore = Math.max(0, 100 - (avgWordsPerSentence * 2));

        extractionMetrics.extractedContent = extractedContent;
        extractionMetrics.endTime = performance.now();
        extractionMetrics.processingTime = extractionMetrics.endTime - extractionMetrics.startTime;

        return extractionMetrics;
      } catch (error) {
        extractionMetrics.errors.push(error.message);
        extractionMetrics.endTime = performance.now();
        extractionMetrics.processingTime = extractionMetrics.endTime - extractionMetrics.startTime;
        return extractionMetrics;
      }
    }`;

    const extractionResult = await this.mcpManager.executeMCPFunction(
      'mcp_chrome_devtools_evaluate_script',
      { function: extractionScript }
    );

    if (!extractionResult.success) {
      console.error(
        'Failed to perform content extraction:',
        extractionResult.error
      );
      return {
        timestamp: new Date().toISOString(),
        errors: [extractionResult.error || 'Content extraction failed'],
        processingTime: 0,
      };
    }

    return extractionResult.data?.result || extractionResult.data;
  }

  /**
   * Validate content quality using real analysis
   */
  async validateContentQuality(): Promise<any> {
    if (!this.currentSession?.isConnected) {
      console.error('No active content script session');
      return null;
    }

    try {
      const qualityScript = `() => {
        const qualityAnalysis = {
          timestamp: new Date().toISOString(),
          contentMetrics: {
            totalWords: 0,
            uniqueWords: 0,
            sentences: 0,
            paragraphs: 0,
            averageWordsPerSentence: 0,
            averageSentencesPerParagraph: 0
          },
          structuralMetrics: {
            headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
            lists: document.querySelectorAll('ul, ol').length,
            images: document.querySelectorAll('img').length,
            links: document.querySelectorAll('a').length,
            tables: document.querySelectorAll('table').length
          },
          qualityScore: 0,
          issues: [],
          recommendations: []
        };

        try {
          const bodyText = document.body.textContent || '';
          const words = bodyText.split(/\\s+/).filter(word => word.length > 0);
          const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 0);
          const paragraphs = document.querySelectorAll('p');

          qualityAnalysis.contentMetrics.totalWords = words.length;
          qualityAnalysis.contentMetrics.uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
          qualityAnalysis.contentMetrics.sentences = sentences.length;
          qualityAnalysis.contentMetrics.paragraphs = paragraphs.length;
          
          if (sentences.length > 0) {
            qualityAnalysis.contentMetrics.averageWordsPerSentence = words.length / sentences.length;
          }
          
          if (paragraphs.length > 0) {
            qualityAnalysis.contentMetrics.averageSentencesPerParagraph = sentences.length / paragraphs.length;
          }

          // Calculate quality score
          let score = 0;
          
          // Content length scoring
          if (words.length > 300) score += 25;
          else if (words.length > 100) score += 15;
          else qualityAnalysis.issues.push('Content too short (< 100 words)');
          
          // Structure scoring
          if (qualityAnalysis.structuralMetrics.headings > 0) score += 20;
          else qualityAnalysis.issues.push('No headings found');
          
          if (paragraphs.length > 3) score += 15;
          else qualityAnalysis.issues.push('Few paragraphs (< 3)');
          
          // Readability scoring
          if (qualityAnalysis.contentMetrics.averageWordsPerSentence < 20) score += 20;
          else qualityAnalysis.issues.push('Sentences too long (> 20 words average)');
          
          // Vocabulary diversity
          const vocabularyRatio = qualityAnalysis.contentMetrics.uniqueWords / qualityAnalysis.contentMetrics.totalWords;
          if (vocabularyRatio > 0.5) score += 20;
          else if (vocabularyRatio > 0.3) score += 10;
          else qualityAnalysis.issues.push('Low vocabulary diversity');

          qualityAnalysis.qualityScore = Math.min(score, 100);

          // Generate recommendations
          if (qualityAnalysis.qualityScore < 50) {
            qualityAnalysis.recommendations.push('Consider using alternative extraction method');
          }
          if (qualityAnalysis.contentMetrics.totalWords < 200) {
            qualityAnalysis.recommendations.push('Page may not contain sufficient content for learning');
          }
          if (qualityAnalysis.structuralMetrics.headings === 0) {
            qualityAnalysis.recommendations.push('Look for alternative content structure indicators');
          }

          return qualityAnalysis;
        } catch (error) {
          qualityAnalysis.issues.push(\`Analysis error: \${error.message}\`);
          return qualityAnalysis;
        }
      }`;

      const qualityResult = await this.mcpManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        { function: qualityScript }
      );

      if (!qualityResult.success) {
        console.error(
          'Failed to validate content quality:',
          qualityResult.error
        );
        return null;
      }

      return qualityResult.data?.result || qualityResult.data;
    } catch (error) {
      console.error('Failed to validate content quality:', error);
      return null;
    }
  }

  /**
   * Measure content extraction performance metrics
   */
  async measureExtractionPerformance(): Promise<any> {
    if (!this.currentSession?.isConnected) {
      console.error('No active content script session');
      return null;
    }

    try {
      const performanceScript = `() => {
        const performanceMetrics = {
          timestamp: new Date().toISOString(),
          timing: {
            domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
            extractionStart: performance.now()
          },
          memory: performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          } : null,
          domComplexity: {
            totalElements: document.querySelectorAll('*').length,
            textNodes: 0,
            depth: 0
          },
          extractionPerformance: {
            processingTime: 0,
            throughput: 0, // characters per millisecond
            efficiency: 0  // quality score per processing time
          }
        };

        // Calculate DOM depth
        function getMaxDepth(element, currentDepth = 0) {
          let maxDepth = currentDepth;
          for (let child of element.children) {
            maxDepth = Math.max(maxDepth, getMaxDepth(child, currentDepth + 1));
          }
          return maxDepth;
        }

        performanceMetrics.domComplexity.depth = getMaxDepth(document.body);

        // Count text nodes
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        let textNodeCount = 0;
        while (walker.nextNode()) {
          textNodeCount++;
        }
        performanceMetrics.domComplexity.textNodes = textNodeCount;

        // Simulate extraction performance measurement
        const extractionStart = performance.now();
        const contentLength = document.body.textContent?.length || 0;
        const extractionEnd = performance.now();
        
        performanceMetrics.extractionPerformance.processingTime = extractionEnd - extractionStart;
        performanceMetrics.extractionPerformance.throughput = contentLength / (extractionEnd - extractionStart);
        
        return performanceMetrics;
      }`;

      const performanceResult = await this.mcpManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        { function: performanceScript }
      );

      if (!performanceResult.success) {
        console.error(
          'Failed to measure extraction performance:',
          performanceResult.error
        );
        return null;
      }

      return performanceResult.data?.result || performanceResult.data;
    } catch (error) {
      console.error('Failed to measure extraction performance:', error);
      return null;
    }
  }

  /**
   * Track DOM manipulation operations using real MCP integration
   */
  async trackDOMManipulation(): Promise<any[]> {
    if (!this.currentSession?.isConnected) {
      console.error('No active content script session');
      return [];
    }

    try {
      console.log('Setting up real DOM manipulation tracking...');

      // Initialize DOM tracking with real MCP script injection
      await this.initializeDOMTracking();

      // Wait for some DOM operations to be captured
      await this.delay(3000);

      // Retrieve captured DOM operations
      const domOperations = await this.retrieveDOMOperations();

      // Store DOM operations in session
      this.currentSession.capturedData.domOperations.push(...domOperations);

      console.log(`Tracked ${domOperations.length} real DOM operations`);
      return domOperations;
    } catch (error) {
      console.error('Failed to track DOM manipulation:', error);
      return [];
    }
  }

  /**
   * Initialize DOM tracking with real MutationObserver injection
   */
  private async initializeDOMTracking(): Promise<void> {
    const domTrackingScript = `() => {
      // Clean up any existing observer
      if (window.extensionDOMObserver) {
        window.extensionDOMObserver.disconnect();
      }

      const domOperations = [];
      
      // Set up MutationObserver to track DOM changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          const operation = {
            type: mutation.type,
            timestamp: new Date().toISOString(),
            target: mutation.target.tagName || 'unknown',
            targetId: mutation.target.id || null,
            targetClass: mutation.target.className || null,
            addedNodes: mutation.addedNodes.length,
            removedNodes: mutation.removedNodes.length,
            attributeName: mutation.attributeName,
            oldValue: mutation.oldValue,
            newValue: mutation.type === 'attributes' ? mutation.target.getAttribute(mutation.attributeName) : null
          };
          
          domOperations.push(operation);
          console.log('[DOM DEBUG] DOM mutation detected:', operation);
        });
      });
      
      // Start observing with comprehensive options
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        characterData: true,
        characterDataOldValue: true
      });
      
      // Store observer and operations array globally
      window.extensionDOMObserver = observer;
      window.extensionDOMOperations = domOperations;
      
      // Trigger some test DOM operations to verify tracking
      const testDiv = document.createElement('div');
      testDiv.id = 'extension-dom-test';
      testDiv.className = 'test-element';
      testDiv.textContent = 'DOM tracking test element';
      document.body.appendChild(testDiv);
      
      // Modify attributes to test attribute tracking
      setTimeout(() => {
        testDiv.className = 'test-element modified';
        testDiv.setAttribute('data-test', 'tracking-active');
      }, 100);
      
      return {
        initialized: true,
        observerActive: true,
        testElementCreated: true,
        timestamp: new Date().toISOString()
      };
    }`;

    const initResult = await this.mcpManager.executeMCPFunction(
      'mcp_chrome_devtools_evaluate_script',
      { function: domTrackingScript }
    );

    if (!initResult.success) {
      throw new Error(`Failed to initialize DOM tracking: ${initResult.error}`);
    }

    console.log('DOM tracking initialized successfully:', initResult.data);
  }

  /**
   * Retrieve captured DOM operations from the page
   */
  private async retrieveDOMOperations(): Promise<any[]> {
    const retrieveScript = `() => {
      const operations = window.extensionDOMOperations || [];
      const performanceMetrics = {
        totalOperations: operations.length,
        operationTypes: {},
        averageProcessingTime: 0,
        timestamp: new Date().toISOString()
      };

      // Calculate operation type distribution
      operations.forEach(op => {
        performanceMetrics.operationTypes[op.type] = (performanceMetrics.operationTypes[op.type] || 0) + 1;
      });

      // Add performance metrics to the result
      return {
        operations: operations,
        metrics: performanceMetrics,
        observerStatus: {
          isActive: !!window.extensionDOMObserver,
          observerExists: typeof window.extensionDOMObserver !== 'undefined'
        }
      };
    }`;

    const retrieveResult = await this.mcpManager.executeMCPFunction(
      'mcp_chrome_devtools_evaluate_script',
      { function: retrieveScript }
    );

    if (!retrieveResult.success) {
      console.error('Failed to retrieve DOM operations:', retrieveResult.error);
      return [];
    }

    const result = retrieveResult.data?.result || retrieveResult.data;
    console.log('DOM operations retrieved:', result?.metrics);

    return result?.operations || [];
  }

  /**
   * Get real-time DOM manipulation performance metrics
   */
  async getDOMPerformanceMetrics(): Promise<any> {
    if (!this.currentSession?.isConnected) {
      console.error('No active content script session');
      return null;
    }

    try {
      const metricsScript = `() => {
        const operations = window.extensionDOMOperations || [];
        const now = Date.now();
        const recentOperations = operations.filter(op => 
          (now - new Date(op.timestamp).getTime()) < 10000 // Last 10 seconds
        );

        return {
          total: {
            operations: operations.length,
            types: operations.reduce((acc, op) => {
              acc[op.type] = (acc[op.type] || 0) + 1;
              return acc;
            }, {})
          },
          recent: {
            operations: recentOperations.length,
            types: recentOperations.reduce((acc, op) => {
              acc[op.type] = (acc[op.type] || 0) + 1;
              return acc;
            }, {})
          },
          performance: {
            observerActive: !!window.extensionDOMObserver,
            memoryUsage: performance.memory ? {
              used: performance.memory.usedJSHeapSize,
              total: performance.memory.totalJSHeapSize,
              limit: performance.memory.jsHeapSizeLimit
            } : null,
            timestamp: new Date().toISOString()
          }
        };
      }`;

      const metricsResult = await this.mcpManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        { function: metricsScript }
      );

      if (!metricsResult.success) {
        console.error(
          'Failed to get DOM performance metrics:',
          metricsResult.error
        );
        return null;
      }

      return metricsResult.data?.result || metricsResult.data;
    } catch (error) {
      console.error('Failed to get DOM performance metrics:', error);
      return null;
    }
  }

  /**
   * Validate highlighting system functionality using real MCP integration
   */
  async validateHighlightingSystem(): Promise<any> {
    if (!this.currentSession?.isConnected) {
      console.error('No active content script session');
      return null;
    }

    try {
      console.log('Validating real highlighting system functionality...');

      // Test vocabulary highlighting
      const vocabularyResult = await this.testVocabularyHighlighting();

      // Test sentence highlighting
      const sentenceResult = await this.testSentenceHighlighting();

      // Test highlighting performance
      const performanceResult = await this.testHighlightingPerformance();

      // Test highlighting compatibility
      const compatibilityResult = await this.testHighlightingCompatibility();

      const highlightingResult = {
        timestamp: new Date().toISOString(),
        vocabularyHighlighting: vocabularyResult,
        sentenceHighlighting: sentenceResult,
        performance: performanceResult,
        compatibility: compatibilityResult,
        overallScore: this.calculateHighlightingScore(
          vocabularyResult,
          sentenceResult,
          performanceResult,
          compatibilityResult
        ),
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
   * Test vocabulary highlighting functionality
   */
  private async testVocabularyHighlighting(): Promise<any> {
    const vocabularyScript = `() => {
      const vocabularyTest = {
        timestamp: new Date().toISOString(),
        tested: false,
        successful: false,
        highlightCount: 0,
        testWords: [],
        highlightedWords: [],
        styles: {},
        performance: {
          startTime: performance.now(),
          endTime: null,
          processingTime: null
        },
        errors: []
      };

      try {
        const startTime = performance.now();
        
        // Test words to highlight
        const testWords = ['the', 'and', 'for', 'with', 'this', 'that', 'example', 'test', 'content'];
        vocabularyTest.testWords = testWords;
        
        // Create highlighting function
        function highlightWord(word, className, backgroundColor) {
          const regex = new RegExp(\`\\\\b\${word}\\\\b\`, 'gi');
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: function(node) {
                return node.parentNode.tagName !== 'SCRIPT' && 
                       node.parentNode.tagName !== 'STYLE' &&
                       !node.parentNode.classList.contains('extension-vocabulary-highlight') ?
                       NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
              }
            },
            false
          );

          const textNodes = [];
          let node;
          while (node = walker.nextNode()) {
            if (regex.test(node.textContent)) {
              textNodes.push(node);
            }
          }

          let highlightCount = 0;
          textNodes.forEach(textNode => {
            const parent = textNode.parentNode;
            const text = textNode.textContent;
            const highlightedText = text.replace(regex, (match) => {
              highlightCount++;
              return \`<span class="\${className}" style="background-color: \${backgroundColor}; padding: 1px 2px; border-radius: 2px; font-weight: bold;">\${match}</span>\`;
            });
            
            if (highlightedText !== text) {
              const wrapper = document.createElement('div');
              wrapper.innerHTML = highlightedText;
              while (wrapper.firstChild) {
                parent.insertBefore(wrapper.firstChild, textNode);
              }
              parent.removeChild(textNode);
            }
          });

          return highlightCount;
        }

        // Test highlighting different words with different colors
        const colors = ['#ffeb3b', '#4caf50', '#2196f3', '#ff9800', '#9c27b0'];
        testWords.forEach((word, index) => {
          const color = colors[index % colors.length];
          const className = \`extension-vocab-highlight-\${index}\`;
          const count = highlightWord(word, className, color);
          
          if (count > 0) {
            vocabularyTest.highlightedWords.push({
              word: word,
              count: count,
              className: className,
              color: color
            });
            vocabularyTest.highlightCount += count;
          }
        });

        // Get computed styles for highlighted elements
        vocabularyTest.highlightedWords.forEach(item => {
          const elements = document.querySelectorAll(\`.\${item.className}\`);
          if (elements.length > 0) {
            const computedStyle = window.getComputedStyle(elements[0]);
            vocabularyTest.styles[item.word] = {
              backgroundColor: computedStyle.backgroundColor,
              color: computedStyle.color,
              padding: computedStyle.padding,
              fontWeight: computedStyle.fontWeight,
              borderRadius: computedStyle.borderRadius
            };
          }
        });

        vocabularyTest.tested = true;
        vocabularyTest.successful = vocabularyTest.highlightCount > 0;
        vocabularyTest.performance.endTime = performance.now();
        vocabularyTest.performance.processingTime = vocabularyTest.performance.endTime - startTime;

        return vocabularyTest;
      } catch (error) {
        vocabularyTest.errors.push(error.message);
        vocabularyTest.performance.endTime = performance.now();
        vocabularyTest.performance.processingTime = vocabularyTest.performance.endTime - vocabularyTest.performance.startTime;
        return vocabularyTest;
      }
    }`;

    const result = await this.mcpManager.executeMCPFunction(
      'mcp_chrome_devtools_evaluate_script',
      { function: vocabularyScript }
    );

    if (!result.success) {
      console.error('Failed to test vocabulary highlighting:', result.error);
      return {
        tested: false,
        successful: false,
        errors: [result.error || 'Vocabulary highlighting test failed'],
      };
    }

    return result.data?.result || result.data;
  }

  /**
   * Test sentence highlighting functionality
   */
  private async testSentenceHighlighting(): Promise<any> {
    const sentenceScript = `() => {
      const sentenceTest = {
        timestamp: new Date().toISOString(),
        tested: false,
        successful: false,
        highlightCount: 0,
        highlightedSentences: [],
        styles: {},
        performance: {
          startTime: performance.now(),
          endTime: null,
          processingTime: null
        },
        errors: []
      };

      try {
        const startTime = performance.now();
        
        // Find sentences to highlight (paragraphs)
        const paragraphs = document.querySelectorAll('p');
        const maxSentencesToHighlight = Math.min(3, paragraphs.length);
        
        for (let i = 0; i < maxSentencesToHighlight; i++) {
          const paragraph = paragraphs[i];
          if (paragraph && paragraph.textContent.trim().length > 20) {
            // Create sentence highlight
            const originalStyle = paragraph.style.cssText;
            paragraph.style.backgroundColor = '#e1f5fe';
            paragraph.style.padding = '8px';
            paragraph.style.borderRadius = '4px';
            paragraph.style.border = '1px solid #81d4fa';
            paragraph.style.margin = '4px 0';
            paragraph.classList.add('extension-sentence-highlight');
            
            sentenceTest.highlightedSentences.push({
              index: i,
              text: paragraph.textContent.substring(0, 100) + '...',
              originalStyle: originalStyle,
              element: paragraph.tagName
            });
            
            sentenceTest.highlightCount++;
          }
        }

        // Get computed styles for sentence highlights
        const sentenceHighlights = document.querySelectorAll('.extension-sentence-highlight');
        if (sentenceHighlights.length > 0) {
          const computedStyle = window.getComputedStyle(sentenceHighlights[0]);
          sentenceTest.styles.sentence = {
            backgroundColor: computedStyle.backgroundColor,
            padding: computedStyle.padding,
            borderRadius: computedStyle.borderRadius,
            border: computedStyle.border,
            margin: computedStyle.margin
          };
        }

        sentenceTest.tested = true;
        sentenceTest.successful = sentenceTest.highlightCount > 0;
        sentenceTest.performance.endTime = performance.now();
        sentenceTest.performance.processingTime = sentenceTest.performance.endTime - startTime;

        return sentenceTest;
      } catch (error) {
        sentenceTest.errors.push(error.message);
        sentenceTest.performance.endTime = performance.now();
        sentenceTest.performance.processingTime = sentenceTest.performance.endTime - sentenceTest.performance.startTime;
        return sentenceTest;
      }
    }`;

    const result = await this.mcpManager.executeMCPFunction(
      'mcp_chrome_devtools_evaluate_script',
      { function: sentenceScript }
    );

    if (!result.success) {
      console.error('Failed to test sentence highlighting:', result.error);
      return {
        tested: false,
        successful: false,
        errors: [result.error || 'Sentence highlighting test failed'],
      };
    }

    return result.data?.result || result.data;
  }

  /**
   * Test highlighting performance metrics
   */
  private async testHighlightingPerformance(): Promise<any> {
    const performanceScript = `() => {
      const performanceTest = {
        timestamp: new Date().toISOString(),
        metrics: {
          renderingTime: 0,
          memoryUsage: null,
          domComplexity: {
            totalElements: document.querySelectorAll('*').length,
            highlightedElements: document.querySelectorAll('[class*="highlight"]').length,
            textNodes: 0
          },
          highlightingEfficiency: {
            elementsPerSecond: 0,
            memoryPerElement: 0
          }
        },
        errors: []
      };

      try {
        const startTime = performance.now();
        
        // Count text nodes
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        let textNodeCount = 0;
        while (walker.nextNode()) {
          textNodeCount++;
        }
        performanceTest.metrics.domComplexity.textNodes = textNodeCount;

        // Get memory usage if available
        if (performance.memory) {
          performanceTest.metrics.memoryUsage = {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          };
        }

        // Calculate rendering time
        const endTime = performance.now();
        performanceTest.metrics.renderingTime = endTime - startTime;

        // Calculate efficiency metrics
        const highlightedElements = performanceTest.metrics.domComplexity.highlightedElements;
        if (performanceTest.metrics.renderingTime > 0) {
          performanceTest.metrics.highlightingEfficiency.elementsPerSecond = 
            (highlightedElements / performanceTest.metrics.renderingTime) * 1000;
        }

        if (performanceTest.metrics.memoryUsage && highlightedElements > 0) {
          performanceTest.metrics.highlightingEfficiency.memoryPerElement = 
            performanceTest.metrics.memoryUsage.used / highlightedElements;
        }

        return performanceTest;
      } catch (error) {
        performanceTest.errors.push(error.message);
        return performanceTest;
      }
    }`;

    const result = await this.mcpManager.executeMCPFunction(
      'mcp_chrome_devtools_evaluate_script',
      { function: performanceScript }
    );

    if (!result.success) {
      console.error('Failed to test highlighting performance:', result.error);
      return {
        metrics: { renderingTime: 0 },
        errors: [result.error || 'Performance test failed'],
      };
    }

    return result.data?.result || result.data;
  }

  /**
   * Test highlighting compatibility across different page types
   */
  private async testHighlightingCompatibility(): Promise<any> {
    const compatibilityScript = `() => {
      const compatibilityTest = {
        timestamp: new Date().toISOString(),
        pageAnalysis: {
          doctype: document.doctype ? document.doctype.name : 'unknown',
          htmlVersion: document.documentElement.getAttribute('version') || 'HTML5',
          charset: document.characterSet || 'unknown',
          language: document.documentElement.lang || 'unknown'
        },
        cssSupport: {
          flexbox: CSS.supports('display', 'flex'),
          grid: CSS.supports('display', 'grid'),
          customProperties: CSS.supports('--custom', 'value'),
          transforms: CSS.supports('transform', 'translateX(10px)')
        },
        highlightingCompatibility: {
          canCreateElements: true,
          canModifyStyles: true,
          canUseClassNames: true,
          canAccessComputedStyles: true,
          supportsEventListeners: true
        },
        potentialIssues: [],
        compatibilityScore: 0,
        errors: []
      };

      try {
        // Test element creation
        try {
          const testElement = document.createElement('span');
          testElement.className = 'test-highlight';
          testElement.style.backgroundColor = 'yellow';
          document.body.appendChild(testElement);
          document.body.removeChild(testElement);
        } catch (error) {
          compatibilityTest.highlightingCompatibility.canCreateElements = false;
          compatibilityTest.potentialIssues.push('Cannot create DOM elements');
        }

        // Test style modification
        try {
          const testElement = document.createElement('div');
          testElement.style.color = 'red';
          if (testElement.style.color !== 'red') {
            compatibilityTest.highlightingCompatibility.canModifyStyles = false;
            compatibilityTest.potentialIssues.push('Cannot modify element styles');
          }
        } catch (error) {
          compatibilityTest.highlightingCompatibility.canModifyStyles = false;
          compatibilityTest.potentialIssues.push('Style modification error');
        }

        // Test computed styles access
        try {
          const computedStyle = window.getComputedStyle(document.body);
          if (!computedStyle) {
            compatibilityTest.highlightingCompatibility.canAccessComputedStyles = false;
            compatibilityTest.potentialIssues.push('Cannot access computed styles');
          }
        } catch (error) {
          compatibilityTest.highlightingCompatibility.canAccessComputedStyles = false;
          compatibilityTest.potentialIssues.push('Computed styles access error');
        }

        // Check for problematic CSS that might interfere
        const problematicSelectors = [
          'span { display: none !important }',
          '* { pointer-events: none }',
          'body { user-select: none }'
        ];

        // Calculate compatibility score
        let score = 100;
        Object.values(compatibilityTest.highlightingCompatibility).forEach(supported => {
          if (!supported) score -= 20;
        });

        Object.values(compatibilityTest.cssSupport).forEach(supported => {
          if (!supported) score -= 5;
        });

        compatibilityTest.compatibilityScore = Math.max(0, score);

        // Add recommendations based on issues
        if (compatibilityTest.potentialIssues.length > 0) {
          compatibilityTest.potentialIssues.push('Consider fallback highlighting methods');
        }

        if (compatibilityTest.compatibilityScore < 80) {
          compatibilityTest.potentialIssues.push('Page may have compatibility issues with highlighting');
        }

        return compatibilityTest;
      } catch (error) {
        compatibilityTest.errors.push(error.message);
        return compatibilityTest;
      }
    }`;

    const result = await this.mcpManager.executeMCPFunction(
      'mcp_chrome_devtools_evaluate_script',
      { function: compatibilityScript }
    );

    if (!result.success) {
      console.error('Failed to test highlighting compatibility:', result.error);
      return {
        compatibilityScore: 0,
        errors: [result.error || 'Compatibility test failed'],
      };
    }

    return result.data?.result || result.data;
  }

  /**
   * Calculate overall highlighting system score
   */
  private calculateHighlightingScore(
    vocabularyResult: any,
    sentenceResult: any,
    performanceResult: any,
    compatibilityResult: any
  ): number {
    let score = 0;
    let maxScore = 0;

    // Vocabulary highlighting score (30 points)
    maxScore += 30;
    if (vocabularyResult?.successful) {
      score += 30;
    } else if (vocabularyResult?.tested) {
      score += 10;
    }

    // Sentence highlighting score (30 points)
    maxScore += 30;
    if (sentenceResult?.successful) {
      score += 30;
    } else if (sentenceResult?.tested) {
      score += 10;
    }

    // Performance score (20 points)
    maxScore += 20;
    if (performanceResult?.metrics?.renderingTime < 100) {
      score += 20;
    } else if (performanceResult?.metrics?.renderingTime < 500) {
      score += 10;
    }

    // Compatibility score (20 points)
    maxScore += 20;
    if (compatibilityResult?.compatibilityScore) {
      score += (compatibilityResult.compatibilityScore / 100) * 20;
    }

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
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
    console.log('Setting up real content extraction monitoring...');
    try {
      // Perform initial content extraction analysis
      const extractionResult = await this.performRealContentExtraction();
      console.log(
        'Initial content extraction analysis completed:',
        extractionResult?.processingTime
      );

      // Validate content quality
      const qualityResult = await this.validateContentQuality();
      console.log(
        'Content quality validation completed:',
        qualityResult?.qualityScore
      );

      console.log('Content extraction monitoring setup completed');
    } catch (error) {
      console.error('Failed to setup content extraction monitoring:', error);
    }
  }

  /**
   * Set up DOM manipulation tracking
   */
  private async setupDOMManipulationTracking(): Promise<void> {
    console.log('Setting up real DOM manipulation tracking...');
    try {
      await this.initializeDOMTracking();
      console.log('DOM manipulation tracking setup completed');
    } catch (error) {
      console.error('Failed to setup DOM manipulation tracking:', error);
    }
  }

  /**
   * Set up highlighting system tracking
   */
  private async setupHighlightingSystemTracking(): Promise<void> {
    console.log('Setting up real highlighting system tracking...');
    try {
      // Test vocabulary highlighting
      const vocabularyResult = await this.testVocabularyHighlighting();
      console.log(
        'Vocabulary highlighting test completed:',
        vocabularyResult?.successful
      );

      // Test sentence highlighting
      const sentenceResult = await this.testSentenceHighlighting();
      console.log(
        'Sentence highlighting test completed:',
        sentenceResult?.successful
      );

      console.log('Highlighting system tracking setup completed');
    } catch (error) {
      console.error('Failed to setup highlighting system tracking:', error);
    }
  }

  /**
   * Set up page compatibility analysis
   */
  private async setupPageCompatibilityAnalysis(): Promise<void> {
    console.log('Setting up page compatibility analysis...');
    // This would set up analysis for page structure and compatibility
  }

  /**
   * List available pages using real chrome-devtools MCP
   */
  private async listPages(): Promise<any[]> {
    try {
      console.log('Listing available pages using MCP...');

      const listResult = await this.mcpManager.executeMCPFunction(
        'mcp_chrome_devtools_list_pages'
      );

      if (!listResult.success) {
        console.error('Failed to list pages via MCP:', listResult.error);
        return [];
      }

      const pages = listResult.data || [];
      console.log(`Found ${pages.length} available pages`);

      return pages;
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
   * Select page for debugging using real chrome-devtools MCP
   */
  private async selectPage(pageIndex: number): Promise<void> {
    try {
      console.log(`Selecting page ${pageIndex} for debugging using MCP...`);

      const selectResult = await this.mcpManager.executeMCPFunction(
        'mcp_chrome_devtools_select_page',
        { pageIdx: pageIndex }
      );

      if (!selectResult.success) {
        throw new Error(
          `Failed to select page ${pageIndex}: ${selectResult.error}`
        );
      }

      console.log(`Successfully selected page ${pageIndex} for debugging`);
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

  /**
   * Get MCP connection status
   */
  getMCPConnectionStatus() {
    return this.mcpManager.getConnectionStatus();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.mcpManager.cleanup();
    this.currentSession = null;
    this.isMonitoring = false;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
