/**
 * Content Extraction Pipeline Debugger
 * Debug content extraction process, quality validation, and performance metrics
 */

export interface ContentExtractionDebugCapabilities {
  monitorExtractionProcess: boolean;
  validateContentQuality: boolean;
  measurePerformanceMetrics: boolean;
  analyzeExtractionStrategies: boolean;
  trackProcessingSteps: boolean;
}

export interface ExtractionProcessMonitoring {
  processId: string;
  url: string;
  timestamp: Date;
  steps: ExtractionStep[];
  totalProcessingTime: number;
  success: boolean;
  finalResult?: any;
  errors: string[];
}

export interface ExtractionStep {
  stepId: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  input?: any;
  output?: any;
  error?: string;
}

export interface ContentQualityValidation {
  validationId: string;
  url: string;
  timestamp: Date;
  extractedContent: {
    title: string;
    content: string;
    wordCount: number;
    paragraphCount: number;
  };
  qualityMetrics: {
    titleQuality: number;
    contentLength: number;
    readabilityScore: number;
    structureScore: number;
    completenessScore: number;
  };
  issues: string[];
  recommendations: string[];
  overallScore: number;
}

export interface ExtractionPerformanceMetrics {
  metricsId: string;
  url: string;
  timestamp: Date;
  performance: {
    totalTime: number;
    domAnalysisTime: number;
    contentExtractionTime: number;
    cleanupTime: number;
    validationTime: number;
  };
  memory: {
    initialUsage: number;
    peakUsage: number;
    finalUsage: number;
    memoryDelta: number;
  };
  domMetrics: {
    totalElements: number;
    textNodes: number;
    processedElements: number;
    removedElements: number;
  };
}

export class ContentExtractionDebugger {
  private capabilities: ContentExtractionDebugCapabilities;
  private isMonitoring: boolean = false;
  private extractionProcesses: ExtractionProcessMonitoring[] = [];
  private qualityValidations: ContentQualityValidation[] = [];
  private performanceMetrics: ExtractionPerformanceMetrics[] = [];

  constructor() {
    this.capabilities = {
      monitorExtractionProcess: true,
      validateContentQuality: true,
      measurePerformanceMetrics: true,
      analyzeExtractionStrategies: true,
      trackProcessingSteps: true,
    };
  }

  /**
   * Monitor the complete content extraction process
   */
  async monitorExtractionProcess(
    url: string
  ): Promise<ExtractionProcessMonitoring> {
    const processId = `extraction-${Date.now()}`;
    const startTime = performance.now();

    console.log(`Monitoring content extraction process for: ${url}`);

    const monitoring: ExtractionProcessMonitoring = {
      processId,
      url,
      timestamp: new Date(),
      steps: [],
      totalProcessingTime: 0,
      success: false,
      errors: [],
    };

    try {
      // Step 1: DOM Analysis
      const domAnalysisStep = await this.monitorDOMAnalysis();
      monitoring.steps.push(domAnalysisStep);

      // Step 2: Content Selection Strategy
      const selectionStep = await this.monitorContentSelection();
      monitoring.steps.push(selectionStep);

      // Step 3: Content Extraction
      const extractionStep = await this.monitorContentExtraction();
      monitoring.steps.push(extractionStep);

      // Step 4: Content Cleanup
      const cleanupStep = await this.monitorContentCleanup();
      monitoring.steps.push(cleanupStep);

      // Step 5: Content Validation
      const validationStep = await this.monitorContentValidation();
      monitoring.steps.push(validationStep);

      const endTime = performance.now();
      monitoring.totalProcessingTime = endTime - startTime;
      monitoring.success = monitoring.steps.every(step => step.success);

      if (monitoring.success) {
        monitoring.finalResult = {
          title: 'Sample Article Title',
          content: 'This is the extracted content...',
          wordCount: 250,
          paragraphCount: 5,
          url: url,
        };
      }

      this.extractionProcesses.push(monitoring);
      console.log(
        'Content extraction process monitoring completed:',
        monitoring
      );
      return monitoring;
    } catch (error) {
      monitoring.errors.push(error.message);
      monitoring.totalProcessingTime = performance.now() - startTime;
      this.extractionProcesses.push(monitoring);
      console.error('Failed to monitor extraction process:', error);
      return monitoring;
    }
  }

  /**
   * Monitor DOM analysis step
   */
  private async monitorDOMAnalysis(): Promise<ExtractionStep> {
    const stepId = `dom-analysis-${Date.now()}`;
    const startTime = performance.now();

    try {
      console.log('Monitoring DOM analysis step...');

      // Script to analyze DOM structure
      const domAnalysisScript = `
                () => {
                    const analysis = {
                        totalElements: document.querySelectorAll('*').length,
                        articleElements: document.querySelectorAll('article').length,
                        mainElements: document.querySelectorAll('main').length,
                        paragraphs: document.querySelectorAll('p').length,
                        headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
                        contentContainers: 0,
                        textLength: document.body.textContent?.length || 0,
                        potentialSelectors: []
                    };

                    // Check for content containers
                    const selectors = [
                        'article', 'main', '[role="main"]',
                        '.article-content', '.post-content', '.entry-content',
                        '.content', '#content', '.main-content'
                    ];

                    selectors.forEach(selector => {
                        const elements = document.querySelectorAll(selector);
                        if (elements.length > 0) {
                            analysis.contentContainers++;
                            analysis.potentialSelectors.push({
                                selector: selector,
                                count: elements.length,
                                textLength: Array.from(elements).reduce((total, el) => 
                                    total + (el.textContent?.length || 0), 0)
                            });
                        }
                    });

                    return analysis;
                }
            `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      // For now, return mock DOM analysis result
      const analysisResult = {
        totalElements: 150,
        articleElements: 1,
        mainElements: 1,
        paragraphs: 8,
        headings: 3,
        contentContainers: 3,
        textLength: 2500,
        potentialSelectors: [
          { selector: 'article', count: 1, textLength: 2200 },
          { selector: '.article-content', count: 1, textLength: 2100 },
          { selector: 'main', count: 1, textLength: 2300 },
        ],
      };

      const endTime = performance.now();

      return {
        stepId,
        name: 'DOM Analysis',
        startTime,
        endTime,
        duration: endTime - startTime,
        success: true,
        input: { url: 'current-page' },
        output: analysisResult,
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        stepId,
        name: 'DOM Analysis',
        startTime,
        endTime,
        duration: endTime - startTime,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Monitor content selection strategy step
   */
  private async monitorContentSelection(): Promise<ExtractionStep> {
    const stepId = `content-selection-${Date.now()}`;
    const startTime = performance.now();

    try {
      console.log('Monitoring content selection strategy...');

      // Script to test different content selection strategies
      const selectionScript = `
                () => {
                    const strategies = [];
                    
                    // Strategy 1: Article element
                    const articleElements = document.querySelectorAll('article');
                    if (articleElements.length > 0) {
                        strategies.push({
                            name: 'article-element',
                            selector: 'article',
                            elements: articleElements.length,
                            textLength: Array.from(articleElements).reduce((total, el) => 
                                total + (el.textContent?.length || 0), 0),
                            priority: 1
                        });
                    }

                    // Strategy 2: Main element
                    const mainElements = document.querySelectorAll('main');
                    if (mainElements.length > 0) {
                        strategies.push({
                            name: 'main-element',
                            selector: 'main',
                            elements: mainElements.length,
                            textLength: Array.from(mainElements).reduce((total, el) => 
                                total + (el.textContent?.length || 0), 0),
                            priority: 2
                        });
                    }

                    // Strategy 3: Content containers
                    const contentSelectors = [
                        '.article-content', '.post-content', '.entry-content',
                        '.content', '#content', '.main-content'
                    ];

                    contentSelectors.forEach((selector, index) => {
                        const elements = document.querySelectorAll(selector);
                        if (elements.length > 0) {
                            strategies.push({
                                name: 'content-container',
                                selector: selector,
                                elements: elements.length,
                                textLength: Array.from(elements).reduce((total, el) => 
                                    total + (el.textContent?.length || 0), 0),
                                priority: 3 + index
                            });
                        }
                    });

                    // Select best strategy
                    const bestStrategy = strategies.reduce((best, current) => {
                        if (current.textLength > 500 && current.textLength > best.textLength) {
                            return current;
                        }
                        return best;
                    }, strategies[0] || null);

                    return {
                        availableStrategies: strategies,
                        selectedStrategy: bestStrategy,
                        selectionReason: bestStrategy ? 
                            \`Selected \${bestStrategy.name} with \${bestStrategy.textLength} characters\` :
                            'No suitable strategy found'
                    };
                }
            `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      // For now, return mock selection result
      const selectionResult = {
        availableStrategies: [
          {
            name: 'article-element',
            selector: 'article',
            elements: 1,
            textLength: 2200,
            priority: 1,
          },
          {
            name: 'main-element',
            selector: 'main',
            elements: 1,
            textLength: 2300,
            priority: 2,
          },
          {
            name: 'content-container',
            selector: '.article-content',
            elements: 1,
            textLength: 2100,
            priority: 3,
          },
        ],
        selectedStrategy: {
          name: 'main-element',
          selector: 'main',
          elements: 1,
          textLength: 2300,
          priority: 2,
        },
        selectionReason: 'Selected main-element with 2300 characters',
      };

      const endTime = performance.now();

      return {
        stepId,
        name: 'Content Selection Strategy',
        startTime,
        endTime,
        duration: endTime - startTime,
        success: true,
        input: { strategies: 'multiple' },
        output: selectionResult,
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        stepId,
        name: 'Content Selection Strategy',
        startTime,
        endTime,
        duration: endTime - startTime,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Monitor content extraction step
   */
  private async monitorContentExtraction(): Promise<ExtractionStep> {
    const stepId = `content-extraction-${Date.now()}`;
    const startTime = performance.now();

    try {
      console.log('Monitoring content extraction...');

      // Script to extract content using selected strategy
      const extractionScript = `
                () => {
                    const extraction = {
                        title: '',
                        content: '',
                        metadata: {
                            wordCount: 0,
                            paragraphCount: 0,
                            characterCount: 0,
                            extractionMethod: 'main-element'
                        }
                    };

                    try {
                        // Extract title
                        const titleSelectors = ['h1', 'title', '.title', '.headline'];
                        for (const selector of titleSelectors) {
                            const titleElement = document.querySelector(selector);
                            if (titleElement && titleElement.textContent.trim()) {
                                extraction.title = titleElement.textContent.trim();
                                break;
                            }
                        }

                        if (!extraction.title) {
                            extraction.title = document.title || 'Untitled';
                        }

                        // Extract content using main element
                        const mainElement = document.querySelector('main');
                        if (mainElement) {
                            extraction.content = mainElement.textContent || '';
                        } else {
                            // Fallback to article element
                            const articleElement = document.querySelector('article');
                            if (articleElement) {
                                extraction.content = articleElement.textContent || '';
                            }
                        }

                        // Calculate metadata
                        extraction.metadata.characterCount = extraction.content.length;
                        extraction.metadata.wordCount = extraction.content.split(/\\s+/).filter(word => word.length > 0).length;
                        extraction.metadata.paragraphCount = (extraction.content.match(/\\n\\s*\\n/g) || []).length + 1;

                        return extraction;
                    } catch (error) {
                        throw new Error('Content extraction failed: ' + error.message);
                    }
                }
            `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      // For now, return mock extraction result
      const extractionResult = {
        title: 'Sample Article Title',
        content:
          'This is a sample article content that would be extracted from the page. It contains multiple paragraphs and provides meaningful content for language learning purposes.',
        metadata: {
          wordCount: 25,
          paragraphCount: 2,
          characterCount: 150,
          extractionMethod: 'main-element',
        },
      };

      const endTime = performance.now();

      return {
        stepId,
        name: 'Content Extraction',
        startTime,
        endTime,
        duration: endTime - startTime,
        success: true,
        input: { strategy: 'main-element' },
        output: extractionResult,
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        stepId,
        name: 'Content Extraction',
        startTime,
        endTime,
        duration: endTime - startTime,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Monitor content cleanup step
   */
  private async monitorContentCleanup(): Promise<ExtractionStep> {
    const stepId = `content-cleanup-${Date.now()}`;
    const startTime = performance.now();

    try {
      console.log('Monitoring content cleanup...');

      // Mock cleanup process
      const cleanupResult = {
        originalLength: 2500,
        cleanedLength: 2200,
        removedElements: ['script', 'style', 'nav', 'footer'],
        normalizedWhitespace: true,
        removedCharacters: 300,
        cleanupOperations: [
          'Removed script tags',
          'Removed style tags',
          'Normalized whitespace',
          'Removed navigation elements',
          'Cleaned up formatting',
        ],
      };

      const endTime = performance.now();

      return {
        stepId,
        name: 'Content Cleanup',
        startTime,
        endTime,
        duration: endTime - startTime,
        success: true,
        input: { originalContent: 'raw-extracted-content' },
        output: cleanupResult,
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        stepId,
        name: 'Content Cleanup',
        startTime,
        endTime,
        duration: endTime - startTime,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Monitor content validation step
   */
  private async monitorContentValidation(): Promise<ExtractionStep> {
    const stepId = `content-validation-${Date.now()}`;
    const startTime = performance.now();

    try {
      console.log('Monitoring content validation...');

      // Mock validation process
      const validationResult = {
        minLengthCheck: { passed: true, required: 100, actual: 2200 },
        titleCheck: { passed: true, hasTitle: true, titleLength: 20 },
        structureCheck: {
          passed: true,
          hasParagraphs: true,
          paragraphCount: 5,
        },
        qualityCheck: {
          passed: true,
          readabilityScore: 75,
          completenessScore: 85,
        },
        overallValid: true,
        validationScore: 85,
      };

      const endTime = performance.now();

      return {
        stepId,
        name: 'Content Validation',
        startTime,
        endTime,
        duration: endTime - startTime,
        success: true,
        input: { cleanedContent: 'cleaned-content' },
        output: validationResult,
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        stepId,
        name: 'Content Validation',
        startTime,
        endTime,
        duration: endTime - startTime,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate content quality
   */
  async validateContentQuality(
    url: string,
    extractedContent: any
  ): Promise<ContentQualityValidation> {
    const validationId = `quality-validation-${Date.now()}`;

    try {
      console.log('Validating content quality...');

      const validation: ContentQualityValidation = {
        validationId,
        url,
        timestamp: new Date(),
        extractedContent: {
          title: extractedContent?.title || 'No title',
          content: extractedContent?.content || '',
          wordCount: extractedContent?.wordCount || 0,
          paragraphCount: extractedContent?.paragraphCount || 0,
        },
        qualityMetrics: {
          titleQuality: 0,
          contentLength: 0,
          readabilityScore: 0,
          structureScore: 0,
          completenessScore: 0,
        },
        issues: [],
        recommendations: [],
        overallScore: 0,
      };

      // Validate title quality
      if (
        validation.extractedContent.title &&
        validation.extractedContent.title.length > 5
      ) {
        validation.qualityMetrics.titleQuality = Math.min(
          validation.extractedContent.title.length * 2,
          100
        );
      } else {
        validation.issues.push('Title is missing or too short');
        validation.recommendations.push('Verify title extraction strategy');
      }

      // Validate content length
      validation.qualityMetrics.contentLength =
        validation.extractedContent.content.length;
      if (validation.qualityMetrics.contentLength < 500) {
        validation.issues.push(
          'Content length is below recommended minimum (500 characters)'
        );
        validation.recommendations.push(
          'Check if full article content was extracted'
        );
      }

      // Calculate readability score (simplified)
      const avgWordsPerSentence =
        validation.extractedContent.wordCount /
        Math.max(validation.extractedContent.paragraphCount, 1);
      validation.qualityMetrics.readabilityScore = Math.max(
        0,
        100 - (avgWordsPerSentence - 15) * 2
      );

      // Calculate structure score
      if (validation.extractedContent.paragraphCount > 3) {
        validation.qualityMetrics.structureScore = Math.min(
          validation.extractedContent.paragraphCount * 10,
          100
        );
      } else {
        validation.issues.push('Few paragraph elements detected');
        validation.recommendations.push('Verify content structure extraction');
      }

      // Calculate completeness score
      validation.qualityMetrics.completenessScore = Math.min(
        (validation.extractedContent.wordCount / 200) * 100,
        100
      );

      // Calculate overall score
      validation.overallScore = Math.round(
        validation.qualityMetrics.titleQuality * 0.2 +
          validation.qualityMetrics.readabilityScore * 0.3 +
          validation.qualityMetrics.structureScore * 0.2 +
          validation.qualityMetrics.completenessScore * 0.3
      );

      // Add general recommendations
      if (validation.overallScore < 70) {
        validation.recommendations.push(
          'Consider using alternative extraction methods'
        );
      }

      this.qualityValidations.push(validation);
      console.log('Content quality validation completed:', validation);
      return validation;
    } catch (error) {
      const validation: ContentQualityValidation = {
        validationId,
        url,
        timestamp: new Date(),
        extractedContent: {
          title: '',
          content: '',
          wordCount: 0,
          paragraphCount: 0,
        },
        qualityMetrics: {
          titleQuality: 0,
          contentLength: 0,
          readabilityScore: 0,
          structureScore: 0,
          completenessScore: 0,
        },
        issues: [error.message],
        recommendations: ['Manual content verification required'],
        overallScore: 0,
      };

      this.qualityValidations.push(validation);
      console.error('Failed to validate content quality:', error);
      return validation;
    }
  }

  /**
   * Measure extraction performance metrics
   */
  async measurePerformanceMetrics(
    url: string
  ): Promise<ExtractionPerformanceMetrics> {
    const metricsId = `performance-${Date.now()}`;

    try {
      console.log('Measuring extraction performance metrics...');

      // Script to measure performance
      const performanceScript = `
                () => {
                    const metrics = {
                        performance: {
                            totalTime: 0,
                            domAnalysisTime: 0,
                            contentExtractionTime: 0,
                            cleanupTime: 0,
                            validationTime: 0
                        },
                        memory: {
                            initialUsage: performance.memory ? performance.memory.usedJSHeapSize : 0,
                            peakUsage: 0,
                            finalUsage: 0,
                            memoryDelta: 0
                        },
                        domMetrics: {
                            totalElements: document.querySelectorAll('*').length,
                            textNodes: 0,
                            processedElements: 0,
                            removedElements: 0
                        }
                    };

                    // Count text nodes
                    const walker = document.createTreeWalker(
                        document.body,
                        NodeFilter.SHOW_TEXT,
                        null,
                        false
                    );
                    
                    let node;
                    while (node = walker.nextNode()) {
                        metrics.domMetrics.textNodes++;
                    }

                    // Simulate processing metrics
                    metrics.performance.domAnalysisTime = 15;
                    metrics.performance.contentExtractionTime = 45;
                    metrics.performance.cleanupTime = 20;
                    metrics.performance.validationTime = 10;
                    metrics.performance.totalTime = 90;

                    metrics.domMetrics.processedElements = Math.floor(metrics.domMetrics.totalElements * 0.6);
                    metrics.domMetrics.removedElements = Math.floor(metrics.domMetrics.totalElements * 0.1);

                    if (performance.memory) {
                        metrics.memory.finalUsage = performance.memory.usedJSHeapSize;
                        metrics.memory.peakUsage = Math.max(metrics.memory.initialUsage, metrics.memory.finalUsage) + 1024000;
                        metrics.memory.memoryDelta = metrics.memory.finalUsage - metrics.memory.initialUsage;
                    }

                    return metrics;
                }
            `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      // For now, return mock performance metrics
      const performanceMetrics: ExtractionPerformanceMetrics = {
        metricsId,
        url,
        timestamp: new Date(),
        performance: {
          totalTime: 90,
          domAnalysisTime: 15,
          contentExtractionTime: 45,
          cleanupTime: 20,
          validationTime: 10,
        },
        memory: {
          initialUsage: 5000000,
          peakUsage: 6024000,
          finalUsage: 5200000,
          memoryDelta: 200000,
        },
        domMetrics: {
          totalElements: 150,
          textNodes: 45,
          processedElements: 90,
          removedElements: 15,
        },
      };

      this.performanceMetrics.push(performanceMetrics);
      console.log(
        'Performance metrics measurement completed:',
        performanceMetrics
      );
      return performanceMetrics;
    } catch (error) {
      const performanceMetrics: ExtractionPerformanceMetrics = {
        metricsId,
        url,
        timestamp: new Date(),
        performance: {
          totalTime: 0,
          domAnalysisTime: 0,
          contentExtractionTime: 0,
          cleanupTime: 0,
          validationTime: 0,
        },
        memory: {
          initialUsage: 0,
          peakUsage: 0,
          finalUsage: 0,
          memoryDelta: 0,
        },
        domMetrics: {
          totalElements: 0,
          textNodes: 0,
          processedElements: 0,
          removedElements: 0,
        },
      };

      this.performanceMetrics.push(performanceMetrics);
      console.error('Failed to measure performance metrics:', error);
      return performanceMetrics;
    }
  }

  /**
   * Run comprehensive content extraction debugging
   */
  async runExtractionDebugging(url: string): Promise<{
    process: ExtractionProcessMonitoring;
    quality: ContentQualityValidation;
    performance: ExtractionPerformanceMetrics;
  }> {
    console.log(
      `Running comprehensive content extraction debugging for: ${url}`
    );

    try {
      // Monitor the extraction process
      const process = await this.monitorExtractionProcess(url);

      // Validate content quality
      const quality = await this.validateContentQuality(
        url,
        process.finalResult
      );

      // Measure performance metrics
      const performance = await this.measurePerformanceMetrics(url);

      const results = { process, quality, performance };
      console.log('Content extraction debugging completed:', results);
      return results;
    } catch (error) {
      console.error('Failed to run extraction debugging:', error);
      throw error;
    }
  }

  /**
   * Get all extraction processes
   */
  getExtractionProcesses(): ExtractionProcessMonitoring[] {
    return this.extractionProcesses;
  }

  /**
   * Get all quality validations
   */
  getQualityValidations(): ContentQualityValidation[] {
    return this.qualityValidations;
  }

  /**
   * Get all performance metrics
   */
  getPerformanceMetrics(): ExtractionPerformanceMetrics[] {
    return this.performanceMetrics;
  }

  /**
   * Clear all results
   */
  clearResults(): void {
    this.extractionProcesses = [];
    this.qualityValidations = [];
    this.performanceMetrics = [];
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    capabilities: ContentExtractionDebugCapabilities;
  } {
    return {
      isMonitoring: this.isMonitoring,
      capabilities: this.capabilities,
    };
  }
}
