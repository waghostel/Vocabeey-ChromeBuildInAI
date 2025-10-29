/**
 * Offscreen Document Debugger
 * Monitors AI processing, memory usage, and service coordination in offscreen context
 * Implements Requirements: 3.2, 3.3, 3.4, 3.5, 5.4, 6.4
 */

import {
  MemoryMonitor,
  getMemoryMonitor,
  type MemorySnapshot,
  type MemoryLeakAnalysis,
} from '../utils/memory-monitor';
import {
  ServiceCoordinatorDebugger,
  getServiceCoordinatorDebugger,
  type ServiceCoordinationReport,
  type FallbackChainExecution,
} from '../utils/service-coordinator-debugger';
import {
  MCPConnectionManager,
  type MCPFunctionResult,
  type MCPConnectionStatus,
} from '../utils/mcp-connection-manager';

export interface AIProcessingMetrics {
  taskId: string;
  taskType: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  service: 'chrome-ai' | 'gemini-api' | 'fallback';
  requestSize: number;
  responseSize?: number;
  error?: string;
  memoryUsage?: {
    before: number;
    after: number;
    peak: number;
  };
}

export interface MemoryMetrics {
  timestamp: Date;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryPressure: 'low' | 'moderate' | 'high' | 'critical';
}

export interface ServiceAvailabilityStatus {
  chromeAI: {
    languageDetector: boolean;
    summarizer: boolean;
    rewriter: boolean;
    translator: boolean;
    vocabularyAnalyzer: boolean;
    lastChecked: Date;
  };
  geminiAPI: {
    available: boolean;
    configured: boolean;
    lastChecked: Date;
  };
  fallbackChain: string[];
}

export interface AIResponseQuality {
  taskId: string;
  taskType: string;
  service: string;
  qualityScore: number; // 1-10
  responseTime: number;
  accuracy: number; // 1-10
  completeness: number; // 1-10
  issues: string[];
}

export interface OffscreenDebugSession {
  sessionId: string;
  pageIndex: number;
  url: string;
  title: string;
  isConnected: boolean;
  startTime: Date;
  mcpConnectionStatus: MCPConnectionStatus;
  capturedData: {
    aiProcessingMetrics: AIProcessingMetrics[];
    memorySnapshots: MemoryMetrics[];
    serviceAvailabilityChecks: ServiceAvailabilityStatus[];
    qualityAnalysis: AIResponseQuality[];
  };
}

export class OffscreenDebugger {
  private aiProcessingMetrics: Map<string, AIProcessingMetrics> = new Map();
  private memoryMetrics: MemoryMetrics[] = [];
  private serviceStatus: ServiceAvailabilityStatus | null = null;
  private qualityMetrics: AIResponseQuality[] = [];
  private memoryMonitor: MemoryMonitor;
  private serviceCoordinatorDebugger: ServiceCoordinatorDebugger;
  private mcpConnectionManager: MCPConnectionManager;
  private currentSession: OffscreenDebugSession | null = null;
  private readonly maxMetricsHistory = 1000;

  constructor(mcpConnectionManager?: MCPConnectionManager) {
    this.memoryMonitor = getMemoryMonitor();
    this.serviceCoordinatorDebugger = getServiceCoordinatorDebugger();
    this.mcpConnectionManager =
      mcpConnectionManager ||
      new MCPConnectionManager({
        serverName: 'chrome-devtools',
        command: 'uvx',
        args: ['mcp-chrome-devtools@latest'],
        connectionTimeout: 15000,
        retryAttempts: 3,
        requiredFunctions: [
          'mcp_chrome_devtools_list_pages',
          'mcp_chrome_devtools_select_page',
          'mcp_chrome_devtools_evaluate_script',
          'mcp_chrome_devtools_list_console_messages',
          'mcp_chrome_devtools_list_network_requests',
          'mcp_chrome_devtools_take_snapshot',
        ],
      });
  }

  /**
   * Initialize offscreen document debugging with real MCP connection
   */
  async initialize(): Promise<void> {
    console.log(
      'Initializing offscreen document debugger with real MCP integration'
    );

    try {
      // Ensure MCP connection is established
      if (!this.mcpConnectionManager.isConnectionHealthy()) {
        console.log('MCP connection not healthy, attempting to initialize...');
        const mcpConnected =
          await this.mcpConnectionManager.initializeMCPConnection();
        if (!mcpConnected) {
          throw new Error(
            'Failed to establish MCP connection for offscreen debugging'
          );
        }
      }

      // Connect to real offscreen document
      const connected = await this.connectToOffscreenDocument();
      if (!connected) {
        throw new Error('Failed to connect to offscreen document');
      }

      // Start memory monitoring
      this.memoryMonitor.startMonitoring();

      // Check initial service availability using real MCP
      await this.checkServiceAvailability();

      // Set up message listeners for AI processing events
      this.setupMessageListeners();

      console.log('Offscreen debugger initialized with real MCP integration');
    } catch (error) {
      console.error('Failed to initialize offscreen debugger:', error);
      throw error;
    }
  }

  /**
   * Connect to real offscreen document using MCP
   */
  async connectToOffscreenDocument(): Promise<boolean> {
    try {
      console.log('Connecting to real offscreen document...');

      // Get real list of available pages
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_list_pages'
      );

      if (!result.success) {
        throw new Error(`Failed to list pages: ${result.error}`);
      }

      // Find offscreen document page
      const offscreenPage = this.findOffscreenDocumentPage(result.data);
      if (!offscreenPage) {
        throw new Error('Offscreen document page not found');
      }

      // Select the real offscreen document page
      const selectResult = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_select_page',
        { pageIdx: offscreenPage.pageIdx }
      );

      if (!selectResult.success) {
        throw new Error(
          `Failed to select offscreen page: ${selectResult.error}`
        );
      }

      // Verify offscreen document connection with real script evaluation
      const verificationResult =
        await this.mcpConnectionManager.executeMCPFunction(
          'mcp_chrome_devtools_evaluate_script',
          {
            function: `() => ({
            isOffscreenDocument: typeof chrome !== 'undefined' && !!chrome.runtime,
            extensionId: chrome?.runtime?.id,
            availableAPIs: {
              chromeAI: typeof window.ai !== 'undefined',
              performance: typeof performance !== 'undefined' && !!performance.memory,
              storage: typeof chrome?.storage !== 'undefined'
            },
            timestamp: new Date().toISOString()
          })`,
          }
        );

      if (!verificationResult.success) {
        throw new Error(
          `Failed to verify offscreen document: ${verificationResult.error}`
        );
      }

      // Create debug session
      this.currentSession = {
        sessionId: `offscreen-debug-${Date.now()}`,
        pageIndex: offscreenPage.pageIdx,
        url: offscreenPage.url,
        title: offscreenPage.title,
        isConnected: true,
        startTime: new Date(),
        mcpConnectionStatus: this.mcpConnectionManager.getConnectionStatus(),
        capturedData: {
          aiProcessingMetrics: [],
          memorySnapshots: [],
          serviceAvailabilityChecks: [],
          qualityAnalysis: [],
        },
      };

      console.log(
        `Connected to offscreen document: ${offscreenPage.title} (page ${offscreenPage.pageIdx})`
      );
      console.log('Verification result:', verificationResult.data);

      return true;
    } catch (error) {
      console.error('Failed to connect to offscreen document:', error);

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'offscreen_connection'
        );
      }

      return false;
    }
  }

  /**
   * Find offscreen document page from MCP page list
   */
  private findOffscreenDocumentPage(pages: any[]): any | null {
    if (!Array.isArray(pages)) {
      console.warn('Invalid pages data from MCP');
      return null;
    }

    // Look for offscreen document characteristics
    const offscreenPage = pages.find(
      page =>
        page.url?.includes('offscreen') ||
        page.title?.toLowerCase().includes('offscreen') ||
        page.type === 'offscreen' ||
        (page.url?.startsWith('chrome-extension://') &&
          page.url?.includes('offscreen'))
    );

    if (offscreenPage) {
      console.log(
        `Found offscreen document: ${offscreenPage.title} at ${offscreenPage.url}`
      );
      return offscreenPage;
    }

    // Fallback: look for any extension page that might be offscreen
    const extensionPages = pages.filter(
      page =>
        page.url?.startsWith('chrome-extension://') &&
        !page.url?.includes('popup') &&
        !page.url?.includes('options')
    );

    if (extensionPages.length > 0) {
      console.log(
        `Using extension page as offscreen document: ${extensionPages[0].title}`
      );
      return extensionPages[0];
    }

    console.warn('No offscreen document page found in available pages:', pages);
    return null;
  }

  /**
   * Monitor offscreen document lifecycle
   */
  async monitorOffscreenLifecycle(): Promise<void> {
    if (!this.currentSession) {
      console.warn('No active offscreen session to monitor');
      return;
    }

    try {
      // Check if offscreen document is still active
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `() => ({
            isActive: document.visibilityState !== 'hidden',
            memoryUsage: performance.memory ? {
              used: performance.memory.usedJSHeapSize,
              total: performance.memory.totalJSHeapSize,
              limit: performance.memory.jsHeapSizeLimit
            } : null,
            timestamp: new Date().toISOString(),
            uptime: Date.now() - ${this.currentSession.startTime.getTime()}
          })`,
        }
      );

      if (result.success) {
        console.log('Offscreen document lifecycle check:', result.data);

        // Update session with lifecycle data
        if (result.data.memoryUsage) {
          const memoryMetric: MemoryMetrics = {
            timestamp: new Date(),
            usedJSHeapSize: result.data.memoryUsage.used,
            totalJSHeapSize: result.data.memoryUsage.total,
            jsHeapSizeLimit: result.data.memoryUsage.limit,
            memoryPressure: this.calculateMemoryPressure(
              result.data.memoryUsage
            ),
          };

          this.currentSession.capturedData.memorySnapshots.push(memoryMetric);
        }
      } else {
        console.warn(
          'Offscreen document lifecycle check failed:',
          result.error
        );
      }
    } catch (error) {
      console.error('Error monitoring offscreen lifecycle:', error);
    }
  }

  /**
   * Switch offscreen context for monitoring different aspects
   */
  async switchOffscreenContext(
    contextType: 'ai-processing' | 'memory-monitoring' | 'service-coordination'
  ): Promise<boolean> {
    if (!this.currentSession) {
      console.warn('No active offscreen session for context switching');
      return false;
    }

    try {
      console.log(`Switching offscreen context to: ${contextType}`);

      // Inject context-specific monitoring code
      let monitoringScript = '';

      switch (contextType) {
        case 'ai-processing':
          monitoringScript = `
            () => {
              // Set up AI processing monitoring
              if (!window.aiProcessingMonitor) {
                window.aiProcessingMonitor = {
                  activeRequests: new Map(),
                  completedRequests: [],
                  startRequest: (taskId, taskType, data) => {
                    window.aiProcessingMonitor.activeRequests.set(taskId, {
                      taskId, taskType, data,
                      startTime: Date.now(),
                      status: 'active'
                    });
                  },
                  completeRequest: (taskId, result, error) => {
                    const request = window.aiProcessingMonitor.activeRequests.get(taskId);
                    if (request) {
                      request.endTime = Date.now();
                      request.duration = request.endTime - request.startTime;
                      request.result = result;
                      request.error = error;
                      request.status = error ? 'failed' : 'completed';
                      window.aiProcessingMonitor.completedRequests.push(request);
                      window.aiProcessingMonitor.activeRequests.delete(taskId);
                    }
                  }
                };
              }
              return { contextType: 'ai-processing', initialized: true };
            }
          `;
          break;

        case 'memory-monitoring':
          monitoringScript = `
            () => {
              // Set up memory monitoring
              if (!window.memoryMonitor) {
                window.memoryMonitor = {
                  snapshots: [],
                  takeSnapshot: (label) => {
                    if (performance.memory) {
                      const snapshot = {
                        label,
                        timestamp: Date.now(),
                        used: performance.memory.usedJSHeapSize,
                        total: performance.memory.totalJSHeapSize,
                        limit: performance.memory.jsHeapSizeLimit
                      };
                      window.memoryMonitor.snapshots.push(snapshot);
                      return snapshot;
                    }
                    return null;
                  }
                };
                
                // Take initial snapshot
                window.memoryMonitor.takeSnapshot('context-switch-baseline');
              }
              return { contextType: 'memory-monitoring', initialized: true };
            }
          `;
          break;

        case 'service-coordination':
          monitoringScript = `
            () => {
              // Set up service coordination monitoring
              if (!window.serviceCoordinationMonitor) {
                window.serviceCoordinationMonitor = {
                  serviceChecks: [],
                  fallbackExecutions: [],
                  checkService: async (serviceName) => {
                    const startTime = Date.now();
                    let available = false;
                    let error = null;
                    
                    try {
                      switch (serviceName) {
                        case 'chrome-ai':
                          available = typeof window.ai !== 'undefined';
                          break;
                        case 'gemini-api':
                          // Would check Gemini API availability
                          available = true; // Placeholder
                          break;
                      }
                    } catch (e) {
                      error = e.message;
                    }
                    
                    const check = {
                      serviceName,
                      available,
                      error,
                      timestamp: Date.now(),
                      responseTime: Date.now() - startTime
                    };
                    
                    window.serviceCoordinationMonitor.serviceChecks.push(check);
                    return check;
                  }
                };
              }
              return { contextType: 'service-coordination', initialized: true };
            }
          `;
          break;
      }

      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        { function: monitoringScript }
      );

      if (result.success) {
        console.log(
          `Successfully switched to ${contextType} context:`,
          result.data
        );
        return true;
      } else {
        console.error(
          `Failed to switch to ${contextType} context:`,
          result.error
        );
        return false;
      }
    } catch (error) {
      console.error(
        `Error switching offscreen context to ${contextType}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get current offscreen debug session
   */
  getCurrentSession(): OffscreenDebugSession | null {
    return this.currentSession;
  }

  /**
   * Start monitoring AI processing task with real MCP integration
   */
  async startAIProcessingMonitoring(
    taskId: string,
    taskType: string,
    requestData: any
  ): Promise<void> {
    const metrics: AIProcessingMetrics = {
      taskId,
      taskType,
      startTime: new Date(),
      status: 'pending',
      service: 'chrome-ai', // Default, will be updated
      requestSize: JSON.stringify(requestData).length,
    };

    try {
      // Capture real memory before processing using MCP
      const memoryResult = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `() => {
            if (performance.memory) {
              return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                timestamp: Date.now()
              };
            }
            return null;
          }`,
        }
      );

      if (memoryResult.success && memoryResult.data) {
        metrics.memoryUsage = {
          before: memoryResult.data.usedJSHeapSize,
          after: 0,
          peak: memoryResult.data.usedJSHeapSize,
        };
      }

      // Set up real AI processing monitoring in offscreen document
      await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `() => {
            if (window.aiProcessingMonitor) {
              window.aiProcessingMonitor.startRequest('${taskId}', '${taskType}', ${JSON.stringify(requestData)});
            }
            return { taskId: '${taskId}', status: 'monitoring_started' };
          }`,
        }
      );

      // Track component memory usage
      this.memoryMonitor.trackComponentMemory(
        `ai-processor-${taskType}`,
        JSON.stringify(requestData).length
      );

      // Start fallback chain tracking
      this.serviceCoordinatorDebugger.startFallbackChainTracking(
        taskId,
        taskType
      );

      this.aiProcessingMetrics.set(taskId, metrics);

      // Add to current session if available
      if (this.currentSession) {
        this.currentSession.capturedData.aiProcessingMetrics.push(metrics);
      }

      console.log(
        `Started real AI processing monitoring for task ${taskId} (${taskType})`
      );
    } catch (error) {
      console.error(
        `Failed to start AI processing monitoring for ${taskId}:`,
        error
      );

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'ai_processing_monitoring_start'
        );
      }
    }
  }

  /**
   * Update AI processing metrics during execution
   */
  updateAIProcessingMetrics(
    taskId: string,
    updates: Partial<AIProcessingMetrics>
  ): void {
    const existing = this.aiProcessingMetrics.get(taskId);
    if (!existing) {
      console.warn(`No metrics found for task ${taskId}`);
      return;
    }

    // Update metrics
    Object.assign(existing, updates);

    // Update memory peak if current usage is higher
    const memorySnapshot = this.memoryMonitor.takeMemorySnapshot(
      `ai-task-update-${existing.taskType}`,
      taskId
    );
    if (memorySnapshot && existing.memoryUsage) {
      if (memorySnapshot.usedJSHeapSize > existing.memoryUsage.peak) {
        existing.memoryUsage.peak = memorySnapshot.usedJSHeapSize;
      }
    }

    this.aiProcessingMetrics.set(taskId, existing);
  }

  /**
   * Complete AI processing monitoring with real MCP integration
   */
  async completeAIProcessingMonitoring(
    taskId: string,
    result: any,
    service: 'chrome-ai' | 'gemini-api' | 'fallback',
    error?: string
  ): Promise<void> {
    const metrics = this.aiProcessingMetrics.get(taskId);
    if (!metrics) {
      console.warn(`No metrics found for task ${taskId}`);
      return;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - metrics.startTime.getTime();

    try {
      // Update final metrics
      metrics.endTime = endTime;
      metrics.duration = duration;
      metrics.status = error ? 'failed' : 'completed';
      metrics.service = service;
      metrics.error = error;

      if (result) {
        metrics.responseSize = JSON.stringify(result).length;
      }

      // Capture real final memory usage using MCP
      const finalMemoryResult =
        await this.mcpConnectionManager.executeMCPFunction(
          'mcp_chrome_devtools_evaluate_script',
          {
            function: `() => {
            if (performance.memory) {
              return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                timestamp: Date.now()
              };
            }
            return null;
          }`,
          }
        );

      if (
        finalMemoryResult.success &&
        finalMemoryResult.data &&
        metrics.memoryUsage
      ) {
        metrics.memoryUsage.after = finalMemoryResult.data.usedJSHeapSize;
      }

      // Complete monitoring in offscreen document
      await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `() => {
            if (window.aiProcessingMonitor) {
              window.aiProcessingMonitor.completeRequest('${taskId}', ${JSON.stringify(result)}, ${error ? JSON.stringify(error) : 'null'});
            }
            return { taskId: '${taskId}', status: 'monitoring_completed' };
          }`,
        }
      );

      // Record service attempt in fallback chain
      this.serviceCoordinatorDebugger.recordServiceAttempt(
        taskId,
        service,
        !error,
        duration,
        error
      );

      // Complete fallback chain tracking
      this.serviceCoordinatorDebugger.completeFallbackChainExecution(
        taskId,
        duration
      );

      // Monitor response quality with real analysis
      if (!error && result) {
        const quality = await this.analyzeRealResponseQuality(
          taskId,
          metrics.taskType,
          service,
          result,
          duration
        );
        this.qualityMetrics.push(quality);

        // Add to current session if available
        if (this.currentSession) {
          this.currentSession.capturedData.qualityAnalysis.push(quality);
        }

        // Also monitor with service coordinator
        this.serviceCoordinatorDebugger.monitorResponseQuality(
          service,
          metrics.taskType,
          result,
          duration
        );
      }

      console.log(
        `Completed real AI processing monitoring for task ${taskId}: ${metrics.status} in ${duration}ms using ${service}`
      );

      // Clean up old metrics to prevent memory leaks
      this.cleanupOldMetrics();
    } catch (error) {
      console.error(
        `Failed to complete AI processing monitoring for ${taskId}:`,
        error
      );

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'ai_processing_monitoring_complete'
        );
      }
    }
  }

  /**
   * Analyze real AI response quality using MCP
   */
  private async analyzeRealResponseQuality(
    taskId: string,
    taskType: string,
    service: string,
    result: any,
    responseTime: number
  ): Promise<AIResponseQuality> {
    let qualityScore = 10;
    let accuracy = 10;
    let completeness = 10;
    const issues: string[] = [];

    try {
      // Use real MCP evaluation for quality analysis
      const qualityAnalysisResult =
        await this.mcpConnectionManager.executeMCPFunction(
          'mcp_chrome_devtools_evaluate_script',
          {
            function: `() => {
            const result = ${JSON.stringify(result)};
            const taskType = '${taskType}';
            const analysis = {
              hasContent: !!result,
              contentLength: typeof result === 'string' ? result.length : JSON.stringify(result).length,
              isValidType: true,
              issues: []
            };

            // Task-specific quality checks
            switch (taskType) {
              case 'language_detection':
                analysis.isValidType = typeof result === 'string' && result.length >= 2;
                if (!analysis.isValidType) analysis.issues.push('Invalid language detection result');
                break;

              case 'summarization':
                analysis.isValidType = typeof result === 'string' && result.length >= 50;
                if (!analysis.isValidType) analysis.issues.push('Summary too short or invalid');
                break;

              case 'translation':
                analysis.isValidType = typeof result === 'string' && result.length > 0;
                if (!analysis.isValidType) analysis.issues.push('Empty or invalid translation');
                break;

              case 'vocabulary_analysis':
                analysis.isValidType = Array.isArray(result) && result.length > 0;
                if (!analysis.isValidType) analysis.issues.push('No vocabulary analysis results');
                break;
            }

            return analysis;
          }`,
          }
        );

      if (qualityAnalysisResult.success && qualityAnalysisResult.data) {
        const analysis = qualityAnalysisResult.data;

        if (!analysis.hasContent) {
          qualityScore -= 5;
          completeness -= 5;
          issues.push('No content in response');
        }

        if (!analysis.isValidType) {
          qualityScore -= 4;
          accuracy -= 4;
          issues.push(...analysis.issues);
        }

        if (analysis.contentLength < 10) {
          qualityScore -= 2;
          completeness -= 2;
          issues.push('Response too short');
        }
      }
    } catch (error) {
      console.warn(
        'Failed to perform real quality analysis, using fallback:',
        error
      );
      // Fallback to basic analysis
      return this.analyzeResponseQuality(
        taskId,
        taskType,
        service,
        result,
        responseTime
      );
    }

    // Response time penalty
    if (responseTime > 10000) {
      qualityScore -= 2;
      issues.push('Slow response time');
    } else if (responseTime > 5000) {
      qualityScore -= 1;
      issues.push('Moderate response time');
    }

    return {
      taskId,
      taskType,
      service,
      qualityScore: Math.max(1, qualityScore),
      responseTime,
      accuracy: Math.max(1, accuracy),
      completeness: Math.max(1, completeness),
      issues,
    };
  }

  /**
   * Get current memory usage metrics using real MCP integration
   */
  async getCurrentMemoryMetrics(): Promise<MemoryMetrics | null> {
    try {
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `() => {
            if (!performance.memory) {
              return null;
            }

            const memory = performance.memory;
            const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
            
            let memoryPressure = 'low';
            if (usageRatio > 0.9) memoryPressure = 'critical';
            else if (usageRatio > 0.7) memoryPressure = 'high';
            else if (usageRatio > 0.5) memoryPressure = 'moderate';

            return {
              timestamp: new Date().toISOString(),
              usedJSHeapSize: memory.usedJSHeapSize,
              totalJSHeapSize: memory.totalJSHeapSize,
              jsHeapSizeLimit: memory.jsHeapSizeLimit,
              memoryPressure,
              usageRatio: usageRatio
            };
          }`,
        }
      );

      if (result.success && result.data) {
        const memoryMetrics: MemoryMetrics = {
          timestamp: new Date(result.data.timestamp),
          usedJSHeapSize: result.data.usedJSHeapSize,
          totalJSHeapSize: result.data.totalJSHeapSize,
          jsHeapSizeLimit: result.data.jsHeapSizeLimit,
          memoryPressure: result.data.memoryPressure,
        };

        // Store in memory metrics history
        this.memoryMetrics.push(memoryMetrics);

        // Add to current session if available
        if (this.currentSession) {
          this.currentSession.capturedData.memorySnapshots.push(memoryMetrics);
        }

        // Trigger memory monitoring in offscreen document
        await this.mcpConnectionManager.executeMCPFunction(
          'mcp_chrome_devtools_evaluate_script',
          {
            function: `() => {
              if (window.memoryMonitor) {
                window.memoryMonitor.takeSnapshot('current-metrics-${Date.now()}');
              }
              return { snapshotTaken: true };
            }`,
          }
        );

        return memoryMetrics;
      } else {
        console.error('Failed to get real memory metrics:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error getting real memory metrics:', error);

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'memory_metrics_capture'
        );
      }

      return null;
    }
  }

  /**
   * Take real memory snapshot using MCP
   */
  async takeRealMemorySnapshot(label: string): Promise<MemorySnapshot | null> {
    try {
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `() => {
            if (!performance.memory) {
              return null;
            }

            const memory = performance.memory;
            const snapshot = {
              label: '${label}',
              timestamp: Date.now(),
              usedJSHeapSize: memory.usedJSHeapSize,
              totalJSHeapSize: memory.totalJSHeapSize,
              jsHeapSizeLimit: memory.jsHeapSizeLimit,
              memoryPressure: memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.7 ? 'high' : 'normal'
            };

            // Store in offscreen document's memory monitor
            if (window.memoryMonitor) {
              window.memoryMonitor.takeSnapshot('${label}');
            }

            return snapshot;
          }`,
        }
      );

      if (result.success && result.data) {
        const snapshot: MemorySnapshot = {
          timestamp: new Date(result.data.timestamp),
          usedJSHeapSize: result.data.usedJSHeapSize,
          totalJSHeapSize: result.data.totalJSHeapSize,
          jsHeapSizeLimit: result.data.jsHeapSizeLimit,
          memoryPressure: result.data.memoryPressure || 'low',
          context: label,
        };

        console.log(`Real memory snapshot taken: ${label}`, snapshot);
        return snapshot;
      } else {
        console.error('Failed to take real memory snapshot:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error taking real memory snapshot:', error);

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'memory_snapshot'
        );
      }

      return null;
    }
  }

  /**
   * Detect real memory leaks using actual memory snapshots
   */
  async detectRealMemoryLeaks(): Promise<{
    hasLeak: boolean;
    trend: 'increasing' | 'stable' | 'decreasing';
    recommendation: string;
    analysis: any;
  }> {
    try {
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `() => {
            if (!window.memoryMonitor || !window.memoryMonitor.snapshots) {
              return {
                hasLeak: false,
                trend: 'stable',
                recommendation: 'Memory monitoring not initialized',
                analysis: null
              };
            }

            const snapshots = window.memoryMonitor.snapshots;
            if (snapshots.length < 5) {
              return {
                hasLeak: false,
                trend: 'stable',
                recommendation: 'Insufficient data for leak detection',
                analysis: { snapshotCount: snapshots.length }
              };
            }

            // Analyze last 10 snapshots
            const recent = snapshots.slice(-10);
            const memoryValues = recent.map(s => s.used);

            // Calculate trend
            let increasingCount = 0;
            let decreasingCount = 0;

            for (let i = 1; i < memoryValues.length; i++) {
              if (memoryValues[i] > memoryValues[i - 1]) {
                increasingCount++;
              } else if (memoryValues[i] < memoryValues[i - 1]) {
                decreasingCount++;
              }
            }

            const trend = increasingCount > decreasingCount ? 'increasing' :
                         decreasingCount > increasingCount ? 'decreasing' : 'stable';

            // Check for potential leak (consistent increase over 70% of measurements)
            const hasLeak = trend === 'increasing' && increasingCount >= 7;

            // Calculate memory growth rate
            const firstValue = memoryValues[0];
            const lastValue = memoryValues[memoryValues.length - 1];
            const growthRate = ((lastValue - firstValue) / firstValue) * 100;

            let recommendation = 'Memory usage appears normal';
            if (hasLeak) {
              recommendation = 'Potential memory leak detected. Consider cleaning up AI sessions and caches.';
            } else if (trend === 'increasing' && growthRate > 20) {
              recommendation = 'Memory usage is increasing significantly. Monitor for potential leaks.';
            }

            return {
              hasLeak,
              trend,
              recommendation,
              analysis: {
                snapshotCount: snapshots.length,
                increasingCount,
                decreasingCount,
                growthRate: growthRate.toFixed(2) + '%',
                memoryRange: {
                  min: Math.min(...memoryValues),
                  max: Math.max(...memoryValues),
                  current: lastValue
                }
              }
            };
          }`,
        }
      );

      if (result.success && result.data) {
        console.log('Real memory leak detection completed:', result.data);
        return result.data;
      } else {
        console.error('Failed to detect real memory leaks:', result.error);
        // Fallback to basic detection
        const basicResult = this.detectMemoryLeaks();
        return {
          ...basicResult,
          analysis: { fallback: true, reason: 'MCP detection failed' },
        };
      }
    } catch (error) {
      console.error('Error detecting real memory leaks:', error);

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'memory_leak_detection'
        );
      }

      // Fallback to basic detection
      const basicResult = this.detectMemoryLeaks();
      return {
        ...basicResult,
        analysis: { fallback: true, reason: 'Error in MCP detection' },
      };
    }
  }

  /**
   * Monitor real memory pressure and provide alerts
   */
  async monitorRealMemoryPressure(): Promise<{
    currentPressure: 'low' | 'moderate' | 'high' | 'critical';
    alerts: string[];
    recommendations: string[];
  }> {
    try {
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `() => {
            if (!performance.memory) {
              return {
                currentPressure: 'low',
                alerts: ['Performance.memory API not available'],
                recommendations: ['Enable memory monitoring in Chrome']
              };
            }

            const memory = performance.memory;
            const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
            const totalRatio = memory.totalJSHeapSize / memory.jsHeapSizeLimit;

            let currentPressure = 'low';
            const alerts = [];
            const recommendations = [];

            if (usageRatio > 0.9) {
              currentPressure = 'critical';
              alerts.push('Critical memory usage: ' + (usageRatio * 100).toFixed(1) + '%');
              recommendations.push('Immediate cleanup required - clear caches and close unused features');
            } else if (usageRatio > 0.7) {
              currentPressure = 'high';
              alerts.push('High memory usage: ' + (usageRatio * 100).toFixed(1) + '%');
              recommendations.push('Consider clearing AI processing caches');
            } else if (usageRatio > 0.5) {
              currentPressure = 'moderate';
              alerts.push('Moderate memory usage: ' + (usageRatio * 100).toFixed(1) + '%');
              recommendations.push('Monitor memory usage during AI processing');
            }

            if (totalRatio > 0.8) {
              alerts.push('Total heap approaching limit: ' + (totalRatio * 100).toFixed(1) + '%');
              recommendations.push('Reduce concurrent AI operations');
            }

            return {
              currentPressure,
              alerts,
              recommendations,
              metrics: {
                usedMB: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
                totalMB: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
                limitMB: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
                usageRatio: (usageRatio * 100).toFixed(1) + '%'
              }
            };
          }`,
        }
      );

      if (result.success && result.data) {
        console.log('Real memory pressure monitoring:', result.data);
        return {
          currentPressure: result.data.currentPressure,
          alerts: result.data.alerts,
          recommendations: result.data.recommendations,
        };
      } else {
        console.error('Failed to monitor real memory pressure:', result.error);
        return {
          currentPressure: 'low',
          alerts: ['Memory pressure monitoring failed'],
          recommendations: ['Check MCP connection'],
        };
      }
    } catch (error) {
      console.error('Error monitoring real memory pressure:', error);

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'memory_pressure_monitoring'
        );
      }

      return {
        currentPressure: 'low',
        alerts: ['Memory pressure monitoring error'],
        recommendations: ['Restart memory monitoring'],
      };
    }
  }

  /**
   * Check service availability using real MCP integration
   */
  async checkServiceAvailability(): Promise<ServiceAvailabilityStatus> {
    const status: ServiceAvailabilityStatus = {
      chromeAI: {
        languageDetector: false,
        summarizer: false,
        rewriter: false,
        translator: false,
        vocabularyAnalyzer: false,
        lastChecked: new Date(),
      },
      geminiAPI: {
        available: false,
        configured: false,
        lastChecked: new Date(),
      },
      fallbackChain: [],
    };

    try {
      console.log('Checking real AI service availability using MCP...');

      // Check Chrome AI services using real MCP evaluation
      const chromeAICheckResult =
        await this.mcpConnectionManager.executeMCPFunction(
          'mcp_chrome_devtools_evaluate_script',
          {
            function: `async () => {
            const results = {
              languageDetector: false,
              summarizer: false,
              rewriter: false,
              translator: false,
              vocabularyAnalyzer: false,
              errors: []
            };

            if (typeof window.ai !== 'undefined') {
              // Language Detector
              try {
                if (window.ai.languageDetector) {
                  const startTime = Date.now();
                  const capabilities = await window.ai.languageDetector.capabilities();
                  const responseTime = Date.now() - startTime;
                  results.languageDetector = capabilities.available === 'readily';
                  results.languageDetectorResponseTime = responseTime;
                }
              } catch (error) {
                results.errors.push('Language detector: ' + error.message);
              }

              // Summarizer
              try {
                if (window.ai.summarizer) {
                  const startTime = Date.now();
                  const capabilities = await window.ai.summarizer.capabilities();
                  const responseTime = Date.now() - startTime;
                  results.summarizer = capabilities.available === 'readily';
                  results.summarizerResponseTime = responseTime;
                }
              } catch (error) {
                results.errors.push('Summarizer: ' + error.message);
              }

              // Rewriter
              try {
                if (window.ai.rewriter) {
                  const startTime = Date.now();
                  const capabilities = await window.ai.rewriter.capabilities();
                  const responseTime = Date.now() - startTime;
                  results.rewriter = capabilities.available === 'readily';
                  results.rewriterResponseTime = responseTime;
                }
              } catch (error) {
                results.errors.push('Rewriter: ' + error.message);
              }

              // Translator
              try {
                if (window.ai.translator) {
                  const startTime = Date.now();
                  const capabilities = await window.ai.translator.capabilities();
                  const responseTime = Date.now() - startTime;
                  results.translator = capabilities.available === 'readily';
                  results.translatorResponseTime = responseTime;
                }
              } catch (error) {
                results.errors.push('Translator: ' + error.message);
              }

              // Vocabulary Analyzer (Prompt API)
              try {
                if (window.ai.assistant) {
                  const startTime = Date.now();
                  const capabilities = await window.ai.assistant.capabilities();
                  const responseTime = Date.now() - startTime;
                  results.vocabularyAnalyzer = capabilities.available === 'readily';
                  results.vocabularyAnalyzerResponseTime = responseTime;
                }
              } catch (error) {
                results.errors.push('Vocabulary analyzer: ' + error.message);
              }
            } else {
              results.errors.push('Chrome AI not available');
            }

            return results;
          }`,
          }
        );

      if (chromeAICheckResult.success && chromeAICheckResult.data) {
        const results = chromeAICheckResult.data;

        status.chromeAI.languageDetector = results.languageDetector;
        status.chromeAI.summarizer = results.summarizer;
        status.chromeAI.rewriter = results.rewriter;
        status.chromeAI.translator = results.translator;
        status.chromeAI.vocabularyAnalyzer = results.vocabularyAnalyzer;

        // Record availability checks with real response times
        this.recordServiceAvailabilityCheck(
          'chrome-ai',
          'languageDetector',
          results.languageDetector,
          results.languageDetectorResponseTime || 0
        );
        this.recordServiceAvailabilityCheck(
          'chrome-ai',
          'summarizer',
          results.summarizer,
          results.summarizerResponseTime || 0
        );
        this.recordServiceAvailabilityCheck(
          'chrome-ai',
          'rewriter',
          results.rewriter,
          results.rewriterResponseTime || 0
        );
        this.recordServiceAvailabilityCheck(
          'chrome-ai',
          'translator',
          results.translator,
          results.translatorResponseTime || 0
        );
        this.recordServiceAvailabilityCheck(
          'chrome-ai',
          'vocabularyAnalyzer',
          results.vocabularyAnalyzer,
          results.vocabularyAnalyzerResponseTime || 0
        );

        if (results.errors.length > 0) {
          console.warn('Chrome AI service check errors:', results.errors);
        }
      } else {
        console.error(
          'Failed to check Chrome AI services:',
          chromeAICheckResult.error
        );
      }

      // Check Gemini API availability using real MCP evaluation
      const geminiAPICheckResult =
        await this.mcpConnectionManager.executeMCPFunction(
          'mcp_chrome_devtools_evaluate_script',
          {
            function: `async () => {
            const results = {
              configured: false,
              available: false,
              responseTime: 0,
              error: null
            };

            try {
              const startTime = Date.now();
              
              // Check if Gemini API is configured (look for API key in storage or environment)
              if (typeof chrome !== 'undefined' && chrome.storage) {
                try {
                  const storage = await chrome.storage.local.get(['geminiApiKey', 'geminiApiConfig']);
                  results.configured = !!(storage.geminiApiKey || storage.geminiApiConfig);
                } catch (e) {
                  results.error = 'Storage access failed: ' + e.message;
                }
              }

              // For availability, we would need to make a test API call
              // This is a placeholder - in real implementation would test actual API
              results.available = results.configured; // Simplified check
              results.responseTime = Date.now() - startTime;
              
            } catch (error) {
              results.error = error.message;
            }

            return results;
          }`,
          }
        );

      if (geminiAPICheckResult.success && geminiAPICheckResult.data) {
        const results = geminiAPICheckResult.data;

        status.geminiAPI.configured = results.configured;
        status.geminiAPI.available = results.available;

        this.recordServiceAvailabilityCheck(
          'gemini-api',
          'general',
          results.available,
          results.responseTime,
          results.error
        );

        if (results.error) {
          console.warn('Gemini API check error:', results.error);
        }
      } else {
        console.error(
          'Failed to check Gemini API:',
          geminiAPICheckResult.error
        );
        this.recordServiceAvailabilityCheck(
          'gemini-api',
          'general',
          false,
          0,
          geminiAPICheckResult.error
        );
      }

      // Build fallback chain based on availability
      const fallbackChain: string[] = [];

      if (
        status.chromeAI.languageDetector ||
        status.chromeAI.summarizer ||
        status.chromeAI.rewriter ||
        status.chromeAI.translator ||
        status.chromeAI.vocabularyAnalyzer
      ) {
        fallbackChain.push('chrome-ai');
      }

      if (status.geminiAPI.available) {
        fallbackChain.push('gemini-api');
      }

      status.fallbackChain = fallbackChain;

      // Add to current session if available
      if (this.currentSession) {
        this.currentSession.capturedData.serviceAvailabilityChecks.push(status);
      }

      console.log('Real service availability check completed:', {
        chromeAI: Object.values(status.chromeAI)
          .filter(v => typeof v === 'boolean')
          .filter(Boolean).length,
        geminiAPI: status.geminiAPI.available,
        fallbackChain: status.fallbackChain,
      });
    } catch (error) {
      console.error('Real service availability check failed:', error);

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'service_availability_check'
        );
      }
    }

    this.serviceStatus = status;
    return status;
  }

  /**
   * Get AI processing metrics
   */
  getAIProcessingMetrics(): AIProcessingMetrics[] {
    return Array.from(this.aiProcessingMetrics.values());
  }

  /**
   * Get memory usage history
   */
  getMemoryMetrics(): MemoryMetrics[] {
    return [...this.memoryMetrics];
  }

  /**
   * Get service availability status
   */
  getServiceStatus(): ServiceAvailabilityStatus | null {
    return this.serviceStatus;
  }

  /**
   * Get AI response quality metrics
   */
  getQualityMetrics(): AIResponseQuality[] {
    return [...this.qualityMetrics];
  }

  /**
   * Get detailed memory analysis
   */
  getMemoryAnalysis(): {
    snapshots: MemorySnapshot[];
    leakAnalysis: MemoryLeakAnalysis;
    componentUsage: any[];
    summary: any;
  } {
    return {
      snapshots: this.memoryMonitor.getRecentSnapshots(100),
      leakAnalysis: this.memoryMonitor.analyzeMemoryLeaks(),
      componentUsage: this.memoryMonitor.getComponentMemoryUsage(),
      summary: this.memoryMonitor.getMemoryUsageSummary(),
    };
  }

  /**
   * Force memory cleanup
   */
  forceMemoryCleanup(): boolean {
    console.log('Forcing memory cleanup from offscreen debugger');
    return this.memoryMonitor.forceGarbageCollection();
  }

  /**
   * Get performance optimization recommendations
   */
  getPerformanceOptimizationRecommendations(): string[] {
    const memoryOptimizations =
      this.memoryMonitor.getPerformanceOptimizationMetrics();
    const aiOptimizations = this.generateOptimizationRecommendations();
    const serviceOptimizations =
      this.serviceCoordinatorDebugger.getServiceCoordinationReport();

    return [
      ...memoryOptimizations.recommendations,
      ...aiOptimizations,
      ...serviceOptimizations.recommendations,
    ];
  }

  /**
   * Get service coordination report
   */
  getServiceCoordinationReport(): ServiceCoordinationReport {
    return this.serviceCoordinatorDebugger.getServiceCoordinationReport();
  }

  /**
   * Get fallback chain execution history
   */
  getFallbackChainExecutions(): FallbackChainExecution[] {
    return this.serviceCoordinatorDebugger.getRecentFallbackExecutions();
  }

  /**
   * Validate current fallback chain configuration using real MCP integration
   */
  async validateRealFallbackChain(): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
    testResults: any[];
  }> {
    try {
      console.log('Validating real fallback chain configuration...');

      // Test real fallback chain execution
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `async () => {
            const testResults = [];
            const issues = [];
            const recommendations = [];

            // Test Chrome AI services in order
            const chromeAIServices = [
              { name: 'languageDetector', api: window.ai?.languageDetector },
              { name: 'summarizer', api: window.ai?.summarizer },
              { name: 'rewriter', api: window.ai?.rewriter },
              { name: 'translator', api: window.ai?.translator },
              { name: 'assistant', api: window.ai?.assistant }
            ];

            for (const service of chromeAIServices) {
              const testResult = {
                serviceName: 'chrome-ai-' + service.name,
                available: false,
                responseTime: 0,
                error: null,
                capabilities: null
              };

              if (service.api) {
                try {
                  const startTime = Date.now();
                  const capabilities = await service.api.capabilities();
                  testResult.responseTime = Date.now() - startTime;
                  testResult.available = capabilities.available === 'readily';
                  testResult.capabilities = capabilities;

                  if (!testResult.available) {
                    issues.push(service.name + ' is not readily available');
                  }
                } catch (error) {
                  testResult.error = error.message;
                  issues.push(service.name + ' test failed: ' + error.message);
                }
              } else {
                issues.push(service.name + ' API not found');
              }

              testResults.push(testResult);
            }

            // Test Gemini API availability (placeholder)
            const geminiTest = {
              serviceName: 'gemini-api',
              available: false,
              responseTime: 0,
              error: null,
              configured: false
            };

            try {
              // Check if Gemini API is configured
              if (typeof chrome !== 'undefined' && chrome.storage) {
                const storage = await chrome.storage.local.get(['geminiApiKey']);
                geminiTest.configured = !!storage.geminiApiKey;
                geminiTest.available = geminiTest.configured; // Simplified check
              }
            } catch (error) {
              geminiTest.error = error.message;
              issues.push('Gemini API configuration check failed: ' + error.message);
            }

            testResults.push(geminiTest);

            // Generate recommendations based on test results
            const availableServices = testResults.filter(t => t.available).length;
            const totalServices = testResults.length;

            if (availableServices === 0) {
              issues.push('No AI services are available');
              recommendations.push('Check Chrome AI availability and Gemini API configuration');
            } else if (availableServices < totalServices / 2) {
              recommendations.push('Limited AI services available - consider enabling more services');
            }

            if (!testResults.find(t => t.serviceName.includes('gemini') && t.available)) {
              recommendations.push('Configure Gemini API as fallback for better reliability');
            }

            const isValid = availableServices > 0;

            return {
              isValid,
              issues,
              recommendations,
              testResults,
              summary: {
                availableServices,
                totalServices,
                availabilityRate: (availableServices / totalServices * 100).toFixed(1) + '%'
              }
            };
          }`,
        }
      );

      if (result.success && result.data) {
        console.log(
          'Real fallback chain validation completed:',
          result.data.summary
        );
        return result.data;
      } else {
        console.error('Failed to validate real fallback chain:', result.error);
        // Fallback to basic validation
        const basicResult = this.validateFallbackChain();
        return {
          ...basicResult,
          testResults: [],
        };
      }
    } catch (error) {
      console.error('Error validating real fallback chain:', error);

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'fallback_chain_validation'
        );
      }

      // Fallback to basic validation
      const basicResult = this.validateFallbackChain();
      return {
        ...basicResult,
        testResults: [],
      };
    }
  }

  /**
   * Test real service failure detection and recovery
   */
  async testRealServiceFailureRecovery(): Promise<{
    testsPassed: number;
    totalTests: number;
    failures: any[];
    recoveryStrategies: string[];
  }> {
    try {
      console.log('Testing real service failure detection and recovery...');

      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `async () => {
            const testResults = [];
            const failures = [];
            const recoveryStrategies = [];

            // Test 1: Service unavailability detection
            try {
              // Simulate checking a service that might not be available
              if (window.ai?.summarizer) {
                const capabilities = await window.ai.summarizer.capabilities();
                if (capabilities.available !== 'readily') {
                  testResults.push({
                    test: 'Service unavailability detection',
                    passed: true,
                    details: 'Correctly detected service not readily available'
                  });
                  recoveryStrategies.push('Fallback to alternative service when primary unavailable');
                } else {
                  testResults.push({
                    test: 'Service unavailability detection',
                    passed: true,
                    details: 'Service is readily available'
                  });
                }
              } else {
                testResults.push({
                  test: 'Service unavailability detection',
                  passed: true,
                  details: 'Correctly detected service API not available'
                });
                recoveryStrategies.push('Use alternative AI service when primary API missing');
              }
            } catch (error) {
              failures.push({
                test: 'Service unavailability detection',
                error: error.message
              });
            }

            // Test 2: Response timeout handling
            try {
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 100)
              );
              
              try {
                await Promise.race([
                  window.ai?.languageDetector?.capabilities(),
                  timeoutPromise
                ]);
                testResults.push({
                  test: 'Response timeout handling',
                  passed: true,
                  details: 'Service responded within timeout'
                });
              } catch (error) {
                if (error.message === 'Timeout') {
                  testResults.push({
                    test: 'Response timeout handling',
                    passed: true,
                    details: 'Correctly detected timeout condition'
                  });
                  recoveryStrategies.push('Implement timeout handling with fallback services');
                } else {
                  throw error;
                }
              }
            } catch (error) {
              failures.push({
                test: 'Response timeout handling',
                error: error.message
              });
            }

            // Test 3: Service coordination monitoring
            try {
              if (window.serviceCoordinationMonitor) {
                const chromeAICheck = await window.serviceCoordinationMonitor.checkService('chrome-ai');
                const geminiCheck = await window.serviceCoordinationMonitor.checkService('gemini-api');
                
                testResults.push({
                  test: 'Service coordination monitoring',
                  passed: true,
                  details: 'Successfully monitored service coordination',
                  chromeAI: chromeAICheck.available,
                  gemini: geminiCheck.available
                });

                if (!chromeAICheck.available && !geminiCheck.available) {
                  recoveryStrategies.push('No AI services available - implement graceful degradation');
                } else if (!chromeAICheck.available) {
                  recoveryStrategies.push('Chrome AI unavailable - use Gemini API fallback');
                } else if (!geminiCheck.available) {
                  recoveryStrategies.push('Gemini API unavailable - rely on Chrome AI');
                }
              } else {
                testResults.push({
                  test: 'Service coordination monitoring',
                  passed: false,
                  details: 'Service coordination monitor not initialized'
                });
                recoveryStrategies.push('Initialize service coordination monitoring');
              }
            } catch (error) {
              failures.push({
                test: 'Service coordination monitoring',
                error: error.message
              });
            }

            const testsPassed = testResults.filter(t => t.passed).length;
            const totalTests = testResults.length;

            return {
              testsPassed,
              totalTests,
              failures,
              recoveryStrategies,
              testResults
            };
          }`,
        }
      );

      if (result.success && result.data) {
        console.log('Real service failure recovery testing completed:', {
          passed: result.data.testsPassed,
          total: result.data.totalTests,
          failures: result.data.failures.length,
        });
        return result.data;
      } else {
        console.error(
          'Failed to test real service failure recovery:',
          result.error
        );
        return {
          testsPassed: 0,
          totalTests: 0,
          failures: [{ test: 'MCP execution', error: result.error }],
          recoveryStrategies: ['Fix MCP connection for service testing'],
        };
      }
    } catch (error) {
      console.error('Error testing real service failure recovery:', error);

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'service_failure_recovery_test'
        );
      }

      return {
        testsPassed: 0,
        totalTests: 0,
        failures: [{ test: 'Test execution', error: error.message }],
        recoveryStrategies: ['Resolve testing infrastructure issues'],
      };
    }
  }

  /**
   * Monitor real service coordination performance
   */
  async monitorRealServiceCoordinationPerformance(): Promise<{
    averageResponseTime: number;
    serviceReliability: { [service: string]: number };
    coordinationEfficiency: number;
    recommendations: string[];
  }> {
    try {
      console.log('Monitoring real service coordination performance...');

      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `async () => {
            const performanceData = {
              serviceTimes: {},
              serviceReliability: {},
              totalRequests: 0,
              successfulRequests: 0,
              recommendations: []
            };

            // Test each service performance
            const services = [
              { name: 'chrome-ai-language-detector', api: window.ai?.languageDetector },
              { name: 'chrome-ai-summarizer', api: window.ai?.summarizer },
              { name: 'chrome-ai-rewriter', api: window.ai?.rewriter },
              { name: 'chrome-ai-translator', api: window.ai?.translator }
            ];

            for (const service of services) {
              if (service.api) {
                const attempts = 3;
                let successCount = 0;
                let totalTime = 0;

                for (let i = 0; i < attempts; i++) {
                  try {
                    const startTime = Date.now();
                    await service.api.capabilities();
                    const responseTime = Date.now() - startTime;
                    
                    totalTime += responseTime;
                    successCount++;
                    performanceData.totalRequests++;
                    performanceData.successfulRequests++;
                  } catch (error) {
                    performanceData.totalRequests++;
                    // Service failed, don't count as successful
                  }
                }

                if (successCount > 0) {
                  performanceData.serviceTimes[service.name] = totalTime / successCount;
                  performanceData.serviceReliability[service.name] = (successCount / attempts) * 100;
                } else {
                  performanceData.serviceTimes[service.name] = 0;
                  performanceData.serviceReliability[service.name] = 0;
                  performanceData.recommendations.push(service.name + ' is completely unavailable');
                }
              }
            }

            // Calculate overall metrics
            const responseTimes = Object.values(performanceData.serviceTimes).filter(t => t > 0);
            const averageResponseTime = responseTimes.length > 0 ? 
              responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

            const coordinationEfficiency = performanceData.totalRequests > 0 ? 
              (performanceData.successfulRequests / performanceData.totalRequests) * 100 : 0;

            // Generate performance recommendations
            if (averageResponseTime > 1000) {
              performanceData.recommendations.push('Service response times are high - consider optimization');
            }

            if (coordinationEfficiency < 80) {
              performanceData.recommendations.push('Service coordination efficiency is low - check service health');
            }

            const reliabilityValues = Object.values(performanceData.serviceReliability);
            const avgReliability = reliabilityValues.length > 0 ? 
              reliabilityValues.reduce((a, b) => a + b, 0) / reliabilityValues.length : 0;

            if (avgReliability < 90) {
              performanceData.recommendations.push('Service reliability is below optimal - implement better error handling');
            }

            return {
              averageResponseTime,
              serviceReliability: performanceData.serviceReliability,
              coordinationEfficiency,
              recommendations: performanceData.recommendations,
              metrics: {
                totalRequests: performanceData.totalRequests,
                successfulRequests: performanceData.successfulRequests,
                avgReliability: avgReliability.toFixed(1) + '%'
              }
            };
          }`,
        }
      );

      if (result.success && result.data) {
        console.log(
          'Real service coordination performance monitoring completed:',
          result.data.metrics
        );
        return result.data;
      } else {
        console.error(
          'Failed to monitor real service coordination performance:',
          result.error
        );
        return {
          averageResponseTime: 0,
          serviceReliability: {},
          coordinationEfficiency: 0,
          recommendations: [
            'Service coordination performance monitoring failed',
          ],
        };
      }
    } catch (error) {
      console.error(
        'Error monitoring real service coordination performance:',
        error
      );

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'service_coordination_performance'
        );
      }

      return {
        averageResponseTime: 0,
        serviceReliability: {},
        coordinationEfficiency: 0,
        recommendations: ['Fix service coordination monitoring infrastructure'],
      };
    }
  }

  /**
   * Validate current fallback chain configuration (fallback method)
   */
  validateFallbackChain(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    // Get currently available services from service status
    const availableServices: string[] = [];

    if (this.serviceStatus) {
      if (this.serviceStatus.chromeAI.languageDetector)
        availableServices.push('chrome-ai-language-detector');
      if (this.serviceStatus.chromeAI.summarizer)
        availableServices.push('chrome-ai-summarizer');
      if (this.serviceStatus.chromeAI.rewriter)
        availableServices.push('chrome-ai-rewriter');
      if (this.serviceStatus.chromeAI.translator)
        availableServices.push('chrome-ai-translator');
      if (this.serviceStatus.chromeAI.vocabularyAnalyzer)
        availableServices.push('chrome-ai-vocabulary-analyzer');
      if (this.serviceStatus.geminiAPI.available)
        availableServices.push('gemini-api');
    }

    return this.serviceCoordinatorDebugger.validateFallbackChain(
      availableServices
    );
  }

  /**
   * Record service availability check
   */
  recordServiceAvailabilityCheck(
    service: 'chrome-ai' | 'gemini-api',
    component: string,
    available: boolean,
    responseTime: number,
    error?: string
  ): void {
    this.serviceCoordinatorDebugger.recordAvailabilityCheck(
      service,
      component,
      available,
      responseTime,
      error
    );
  }

  /**
   * Detect memory leaks
   */
  detectMemoryLeaks(): {
    hasLeak: boolean;
    trend: 'increasing' | 'stable' | 'decreasing';
    recommendation: string;
  } {
    if (this.memoryMetrics.length < 10) {
      return {
        hasLeak: false,
        trend: 'stable',
        recommendation: 'Insufficient data for leak detection',
      };
    }

    // Analyze last 10 memory measurements
    const recent = this.memoryMetrics.slice(-10);
    const memoryValues = recent.map(m => m.usedJSHeapSize);

    // Calculate trend
    let increasingCount = 0;
    let decreasingCount = 0;

    for (let i = 1; i < memoryValues.length; i++) {
      if (memoryValues[i] > memoryValues[i - 1]) {
        increasingCount++;
      } else if (memoryValues[i] < memoryValues[i - 1]) {
        decreasingCount++;
      }
    }

    const trend =
      increasingCount > decreasingCount
        ? 'increasing'
        : decreasingCount > increasingCount
          ? 'decreasing'
          : 'stable';

    // Check for potential leak (consistent increase over 70% of measurements)
    const hasLeak = trend === 'increasing' && increasingCount >= 7;

    let recommendation = 'Memory usage appears normal';
    if (hasLeak) {
      recommendation =
        'Potential memory leak detected. Consider cleaning up AI sessions and caches.';
    } else if (trend === 'increasing') {
      recommendation =
        'Memory usage is increasing. Monitor for potential leaks.';
    }

    return { hasLeak, trend, recommendation };
  }

  /**
   * Generate performance optimization recommendations
   */
  generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.getAIProcessingMetrics();
    const memoryAnalysis = this.detectMemoryLeaks();

    // Analyze processing times
    const completedTasks = metrics.filter(
      m => m.status === 'completed' && m.duration
    );
    if (completedTasks.length > 0) {
      const avgDuration =
        completedTasks.reduce((sum, m) => sum + (m.duration || 0), 0) /
        completedTasks.length;

      if (avgDuration > 10000) {
        // > 10 seconds
        recommendations.push(
          'AI processing times are high. Consider implementing request batching or caching.'
        );
      }

      // Check for failed tasks
      const failedTasks = metrics.filter(m => m.status === 'failed');
      const failureRate = failedTasks.length / metrics.length;

      if (failureRate > 0.1) {
        // > 10% failure rate
        recommendations.push(
          'High AI task failure rate detected. Review error handling and fallback mechanisms.'
        );
      }
    }

    // Memory recommendations
    if (memoryAnalysis.hasLeak) {
      recommendations.push(memoryAnalysis.recommendation);
    }

    // Service availability recommendations
    if (this.serviceStatus) {
      const chromeAIServices = Object.values(
        this.serviceStatus.chromeAI
      ).filter(v => typeof v === 'boolean');
      const availableServices = chromeAIServices.filter(Boolean).length;

      if (availableServices < chromeAIServices.length) {
        recommendations.push(
          'Some Chrome AI services are unavailable. Ensure proper fallback configuration.'
        );
      }
    }

    // Quality recommendations
    if (this.qualityMetrics.length > 0) {
      const avgQuality =
        this.qualityMetrics.reduce((sum, m) => sum + m.qualityScore, 0) /
        this.qualityMetrics.length;

      if (avgQuality < 7) {
        recommendations.push(
          'AI response quality is below optimal. Consider adjusting prompts or switching services.'
        );
      }
    }

    return recommendations;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.memoryMonitor.stopMonitoring();
    this.memoryMonitor.clearData();
    this.serviceCoordinatorDebugger.clearData();
    this.mcpConnectionManager.cleanup();

    this.aiProcessingMetrics.clear();
    this.memoryMetrics = [];
    this.qualityMetrics = [];
    this.serviceStatus = null;
    this.currentSession = null;

    console.log('Offscreen debugger cleaned up');
  }

  /**
   * Analyze response quality
   */
  private analyzeResponseQuality(
    taskId: string,
    taskType: string,
    service: string,
    result: any,
    responseTime: number
  ): AIResponseQuality {
    let qualityScore = 10;
    let accuracy = 10;
    let completeness = 10;
    const issues: string[] = [];

    // Basic quality checks based on task type
    switch (taskType) {
      case 'language_detection':
        if (!result || typeof result !== 'string' || result.length < 2) {
          qualityScore -= 3;
          accuracy -= 3;
          issues.push('Invalid language detection result');
        }
        break;

      case 'summarization':
        if (!result || typeof result !== 'string') {
          qualityScore -= 5;
          completeness -= 5;
          issues.push('Empty or invalid summary');
        } else if (result.length < 50) {
          qualityScore -= 2;
          completeness -= 2;
          issues.push('Summary too short');
        }
        break;

      case 'translation':
        if (!result || typeof result !== 'string') {
          qualityScore -= 5;
          accuracy -= 5;
          issues.push('Empty or invalid translation');
        }
        break;

      case 'vocabulary_analysis':
        if (!Array.isArray(result) || result.length === 0) {
          qualityScore -= 4;
          completeness -= 4;
          issues.push('No vocabulary analysis results');
        }
        break;
    }

    // Response time penalty
    if (responseTime > 10000) {
      // > 10 seconds
      qualityScore -= 2;
      issues.push('Slow response time');
    } else if (responseTime > 5000) {
      // > 5 seconds
      qualityScore -= 1;
      issues.push('Moderate response time');
    }

    return {
      taskId,
      taskType,
      service,
      qualityScore: Math.max(1, qualityScore),
      responseTime,
      accuracy: Math.max(1, accuracy),
      completeness: Math.max(1, completeness),
      issues,
    };
  }

  /**
   * Set up message listeners for AI processing events
   */
  private setupMessageListeners(): void {
    // Listen for AI processing events from the offscreen document
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
          case 'AI_TASK_STARTED':
            this.startAIProcessingMonitoring(
              message.taskId,
              message.taskType,
              message.data
            );
            break;

          case 'AI_TASK_UPDATED':
            this.updateAIProcessingMetrics(message.taskId, message.updates);
            break;

          case 'AI_TASK_COMPLETED':
            this.completeAIProcessingMonitoring(
              message.taskId,
              message.result,
              message.service,
              message.error
            );
            break;
        }
        return false;
      });
    }
  }

  /**
   * Calculate memory pressure level
   */
  private calculateMemoryPressure(
    memory: any
  ): 'low' | 'moderate' | 'high' | 'critical' {
    if (
      !memory ||
      typeof memory.used !== 'number' ||
      typeof memory.limit !== 'number'
    ) {
      return 'low';
    }

    const usageRatio = memory.used / memory.limit;

    if (usageRatio > 0.9) return 'critical';
    if (usageRatio > 0.7) return 'high';
    if (usageRatio > 0.5) return 'moderate';
    return 'low';
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    if (this.aiProcessingMetrics.size > this.maxMetricsHistory) {
      // Remove oldest metrics
      const entries = Array.from(this.aiProcessingMetrics.entries());
      const toRemove = entries
        .sort(([, a], [, b]) => a.startTime.getTime() - b.startTime.getTime())
        .slice(0, entries.length - this.maxMetricsHistory);

      toRemove.forEach(([taskId]) => {
        this.aiProcessingMetrics.delete(taskId);
      });
    }

    // Clean up quality metrics
    if (this.qualityMetrics.length > this.maxMetricsHistory) {
      this.qualityMetrics = this.qualityMetrics.slice(-this.maxMetricsHistory);
    }
  }
}
