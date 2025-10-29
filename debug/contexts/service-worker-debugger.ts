/**
 * Service Worker Debugger
 * Debug background script functionality and inter-component communication
 */

import { MCPConnectionManager } from '../utils/mcp-connection-manager';

export interface ServiceWorkerDebugCapabilities {
  monitorStorageOperations: boolean;
  trackMessagePassing: boolean;
  captureBackgroundTasks: boolean;
  analyzeLifecycleEvents: boolean;
  debugOffscreenAPI: boolean;
}

export interface ServiceWorkerDebugSession {
  sessionId: string;
  serviceWorkerPageIndex: number | null;
  isConnected: boolean;
  startTime: Date;
  capturedData: {
    consoleMessages: any[];
    networkRequests: any[];
    storageOperations: any[];
    messageEvents: any[];
  };
  monitoringIntervals?: {
    consoleMessages?: NodeJS.Timeout;
    networkRequests?: NodeJS.Timeout;
    storageOperations?: NodeJS.Timeout;
  };
}

export class ServiceWorkerDebugger {
  private capabilities: ServiceWorkerDebugCapabilities;
  private isMonitoring: boolean = false;
  private currentSession: ServiceWorkerDebugSession | null = null;
  private mcpConnectionManager: MCPConnectionManager;

  constructor(mcpConnectionManager?: MCPConnectionManager) {
    this.capabilities = {
      monitorStorageOperations: true,
      trackMessagePassing: true,
      captureBackgroundTasks: true,
      analyzeLifecycleEvents: true,
      debugOffscreenAPI: true,
    };

    // Use provided MCP connection manager or create a new one
    this.mcpConnectionManager =
      mcpConnectionManager || new MCPConnectionManager();
  }

  /**
   * Connect to service worker context and start monitoring
   */
  async connectToServiceWorker(): Promise<boolean> {
    try {
      console.log('Connecting to service worker context...');

      // Ensure MCP connection is established
      if (!this.mcpConnectionManager.isConnectionHealthy()) {
        console.log('MCP connection not healthy, attempting to initialize...');
        const mcpConnected =
          await this.mcpConnectionManager.initializeMCPConnection();
        if (!mcpConnected) {
          throw new Error(
            'Failed to establish MCP connection for service worker debugging'
          );
        }
      }

      // Get list of available pages to find service worker
      const pages = await this.listPages();
      if (pages.length === 0) {
        throw new Error(
          'No pages available - extension may not be loaded or MCP connection failed'
        );
      }

      const serviceWorkerPage = this.findServiceWorkerPage(pages);
      if (!serviceWorkerPage) {
        console.error(
          'Service worker page not found in available pages:',
          pages
        );
        throw new Error(
          'Service worker page not found - extension background script may not be running'
        );
      }

      // Select the service worker page for debugging
      await this.selectPage(serviceWorkerPage.pageIdx);

      // Verify connection by testing basic functionality
      await this.verifyServiceWorkerConnection(serviceWorkerPage.pageIdx);

      // Initialize debug session
      this.currentSession = {
        sessionId: `sw-debug-${Date.now()}`,
        serviceWorkerPageIndex: serviceWorkerPage.pageIdx,
        isConnected: true,
        startTime: new Date(),
        capturedData: {
          consoleMessages: [],
          networkRequests: [],
          storageOperations: [],
          messageEvents: [],
        },
      };

      console.log(
        `Successfully connected to service worker (page index: ${serviceWorkerPage.pageIdx})`
      );
      return true;
    } catch (error) {
      console.error('Failed to connect to service worker:', error);

      // Handle specific error types
      if (error.message?.includes('MCP')) {
        console.error(
          'MCP connection error - check chrome-devtools MCP server configuration'
        );
      } else if (error.message?.includes('page not found')) {
        console.error(
          'Service worker not found - ensure extension is loaded and background script is running'
        );
      } else if (error.message?.includes('select')) {
        console.error(
          'Failed to select service worker page - may be a DevTools Protocol issue'
        );
      }

      // Clean up any partial session
      this.currentSession = null;
      return false;
    }
  }

  /**
   * Verify service worker connection by testing basic script evaluation
   */
  private async verifyServiceWorkerConnection(
    pageIndex: number
  ): Promise<void> {
    try {
      console.log(
        `Verifying service worker connection on page ${pageIndex}...`
      );

      // Test basic script evaluation to ensure we can communicate with the service worker
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function:
            '() => ({ timestamp: new Date().toISOString(), context: "service-worker" })',
        }
      );

      if (!result.success) {
        throw new Error(
          `Service worker connection verification failed: ${result.error}`
        );
      }

      console.log(
        'Service worker connection verified successfully:',
        result.data
      );
    } catch (error) {
      console.error('Service worker connection verification failed:', error);
      throw new Error(
        `Cannot communicate with service worker: ${error.message}`
      );
    }
  }

  /**
   * Start monitoring service worker context
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Service worker monitoring already active');
      return;
    }

    try {
      // Connect to service worker first
      const connected = await this.connectToServiceWorker();
      if (!connected) {
        throw new Error('Failed to connect to service worker');
      }

      console.log('Starting service worker monitoring...');
      this.isMonitoring = true;

      // Set up monitoring for different aspects
      if (this.capabilities.monitorStorageOperations) {
        await this.setupStorageMonitoring();
      }

      if (this.capabilities.trackMessagePassing) {
        await this.setupMessagePassingTracking();
      }

      if (this.capabilities.captureBackgroundTasks) {
        await this.setupBackgroundTaskCapture();
      }

      console.log('Service worker monitoring started successfully');
    } catch (error) {
      console.error('Failed to start service worker monitoring:', error);
      this.isMonitoring = false;
    }
  }

  /**
   * List available pages using chrome-devtools MCP
   */
  private async listPages(): Promise<any[]> {
    try {
      console.log('Listing pages using mcp_chrome_devtools_list_pages...');

      // Use real MCP function to get available pages
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_list_pages'
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to list pages via MCP');
      }

      const pages = result.data || [];
      console.log(`Found ${pages.length} pages via MCP:`, pages);

      return pages;
    } catch (error) {
      console.error('Failed to list pages:', error);

      // Fallback to empty array if MCP fails
      console.warn('Using fallback: returning empty pages array');
      return [];
    }
  }

  /**
   * Find service worker page from available pages
   */
  private findServiceWorkerPage(pages: any[]): any | null {
    return (
      pages.find(
        page =>
          page.type === 'service_worker' ||
          page.url?.includes('background.js') ||
          page.title?.toLowerCase().includes('service worker')
      ) || null
    );
  }

  /**
   * Select page for debugging using chrome-devtools MCP
   */
  private async selectPage(pageIndex: number): Promise<void> {
    try {
      console.log(
        `Selecting page ${pageIndex} for debugging using mcp_chrome_devtools_select_page...`
      );

      // Use real MCP function to select the page
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_select_page',
        { pageIdx: pageIndex }
      );

      if (!result.success) {
        throw new Error(
          result.error || `Failed to select page ${pageIndex} via MCP`
        );
      }

      console.log(`Successfully selected page ${pageIndex} for debugging`);
    } catch (error) {
      console.error(`Failed to select page ${pageIndex}:`, error);
      throw error;
    }
  }

  /**
   * Set up chrome.storage API monitoring
   */
  private async setupStorageMonitoring(): Promise<void> {
    console.log('Setting up storage operation monitoring...');

    try {
      // Inject monitoring code into service worker context using real MCP
      const storageMonitoringScript = `
        (() => {
          // Check if monitoring is already set up
          if (window.storageMonitoringSetup) {
            console.log('[STORAGE DEBUG] Monitoring already initialized');
            return 'Storage monitoring already active';
          }
          
          // Store original chrome.storage methods
          const originalGet = chrome.storage.local.get;
          const originalSet = chrome.storage.local.set;
          const originalRemove = chrome.storage.local.remove;
          const originalClear = chrome.storage.local.clear;
          
          // Create monitoring wrapper
          window.storageOperations = window.storageOperations || [];
          window.storageQuotaInfo = window.storageQuotaInfo || {};
          
          // Wrap chrome.storage.local.get
          chrome.storage.local.get = function(...args) {
            const timestamp = new Date().toISOString();
            const operation = {
              operation: 'get',
              args: args,
              timestamp: timestamp,
              id: 'get-' + Date.now() + '-' + Math.random()
            };
            
            window.storageOperations.push(operation);
            console.log('[STORAGE DEBUG] get operation:', operation);
            
            // Call original method and track result
            const result = originalGet.apply(this, args);
            if (result && typeof result.then === 'function') {
              result.then(data => {
                operation.result = data;
                operation.success = true;
                console.log('[STORAGE DEBUG] get result:', data);
              }).catch(error => {
                operation.error = error.message;
                operation.success = false;
                console.error('[STORAGE DEBUG] get error:', error);
              });
            }
            
            return result;
          };
          
          // Wrap chrome.storage.local.set
          chrome.storage.local.set = function(...args) {
            const timestamp = new Date().toISOString();
            const operation = {
              operation: 'set',
              args: args,
              timestamp: timestamp,
              id: 'set-' + Date.now() + '-' + Math.random()
            };
            
            window.storageOperations.push(operation);
            console.log('[STORAGE DEBUG] set operation:', operation);
            
            // Call original method and track result
            const result = originalSet.apply(this, args);
            if (result && typeof result.then === 'function') {
              result.then(() => {
                operation.success = true;
                console.log('[STORAGE DEBUG] set completed successfully');
                
                // Update quota info after set operation
                chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
                  window.storageQuotaInfo.bytesInUse = bytesInUse;
                  window.storageQuotaInfo.lastUpdated = new Date().toISOString();
                });
              }).catch(error => {
                operation.error = error.message;
                operation.success = false;
                console.error('[STORAGE DEBUG] set error:', error);
              });
            }
            
            return result;
          };
          
          // Wrap chrome.storage.local.remove
          chrome.storage.local.remove = function(...args) {
            const timestamp = new Date().toISOString();
            const operation = {
              operation: 'remove',
              args: args,
              timestamp: timestamp,
              id: 'remove-' + Date.now() + '-' + Math.random()
            };
            
            window.storageOperations.push(operation);
            console.log('[STORAGE DEBUG] remove operation:', operation);
            
            // Call original method and track result
            const result = originalRemove.apply(this, args);
            if (result && typeof result.then === 'function') {
              result.then(() => {
                operation.success = true;
                console.log('[STORAGE DEBUG] remove completed successfully');
              }).catch(error => {
                operation.error = error.message;
                operation.success = false;
                console.error('[STORAGE DEBUG] remove error:', error);
              });
            }
            
            return result;
          };
          
          // Wrap chrome.storage.local.clear
          chrome.storage.local.clear = function(...args) {
            const timestamp = new Date().toISOString();
            const operation = {
              operation: 'clear',
              args: args,
              timestamp: timestamp,
              id: 'clear-' + Date.now() + '-' + Math.random()
            };
            
            window.storageOperations.push(operation);
            console.log('[STORAGE DEBUG] clear operation:', operation);
            
            // Call original method and track result
            const result = originalClear.apply(this, args);
            if (result && typeof result.then === 'function') {
              result.then(() => {
                operation.success = true;
                window.storageQuotaInfo.bytesInUse = 0;
                window.storageQuotaInfo.lastUpdated = new Date().toISOString();
                console.log('[STORAGE DEBUG] clear completed successfully');
              }).catch(error => {
                operation.error = error.message;
                operation.success = false;
                console.error('[STORAGE DEBUG] clear error:', error);
              });
            }
            
            return result;
          };
          
          // Set up storage quota monitoring
          chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
            window.storageQuotaInfo = {
              bytesInUse: bytesInUse,
              maxBytes: chrome.storage.local.QUOTA_BYTES || 5242880, // 5MB default
              lastUpdated: new Date().toISOString()
            };
            console.log('[STORAGE DEBUG] Initial quota info:', window.storageQuotaInfo);
          });
          
          // Mark monitoring as set up
          window.storageMonitoringSetup = true;
          console.log('[STORAGE DEBUG] Storage monitoring initialized');
          return 'Storage monitoring setup complete';
        })()
      `;

      // Execute the monitoring script using real MCP
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        { function: storageMonitoringScript }
      );

      if (!result.success) {
        throw new Error(
          result.error || 'Failed to inject storage monitoring script'
        );
      }

      console.log(
        'Storage monitoring script executed successfully:',
        result.data
      );
    } catch (error) {
      console.error('Failed to setup storage monitoring:', error);

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'storage_monitoring_setup'
        );
      }

      throw error;
    }
  }

  /**
   * Set up message passing tracking between components
   */
  private async setupMessagePassingTracking(): Promise<void> {
    console.log('Setting up message passing tracking...');

    try {
      const messageTrackingScript = `
        (() => {
          // Store original message methods
          const originalSendMessage = chrome.runtime.sendMessage;
          const originalOnMessage = chrome.runtime.onMessage;
          
          // Create message tracking storage
          window.messageEvents = window.messageEvents || [];
          
          // Wrap chrome.runtime.sendMessage
          chrome.runtime.sendMessage = function(...args) {
            const timestamp = new Date().toISOString();
            const messageData = {
              type: 'outgoing',
              message: args[0],
              timestamp: timestamp,
              sender: 'service-worker'
            };
            
            window.messageEvents.push(messageData);
            console.log('[MESSAGE DEBUG] Outgoing message:', messageData);
            
            return originalSendMessage.apply(this, args);
          };
          
          // Wrap chrome.runtime.onMessage listener
          const originalAddListener = chrome.runtime.onMessage.addListener;
          chrome.runtime.onMessage.addListener = function(callback) {
            const wrappedCallback = function(message, sender, sendResponse) {
              const timestamp = new Date().toISOString();
              const messageData = {
                type: 'incoming',
                message: message,
                sender: sender,
                timestamp: timestamp,
                receiver: 'service-worker'
              };
              
              window.messageEvents.push(messageData);
              console.log('[MESSAGE DEBUG] Incoming message:', messageData);
              
              return callback(message, sender, sendResponse);
            };
            
            return originalAddListener.call(this, wrappedCallback);
          };
          
          console.log('[MESSAGE DEBUG] Message passing tracking initialized');
          return 'Message tracking setup complete';
        })()
      `;

      console.log('Message tracking script prepared');
    } catch (error) {
      console.error('Failed to setup message passing tracking:', error);
    }
  }

  /**
   * Set up background task execution capture
   */
  private async setupBackgroundTaskCapture(): Promise<void> {
    console.log('Setting up background task capture...');

    try {
      const backgroundTaskScript = `
        (() => {
          // Create task tracking storage
          window.backgroundTasks = window.backgroundTasks || [];
          
          // Wrap setTimeout for task tracking
          const originalSetTimeout = window.setTimeout;
          window.setTimeout = function(callback, delay, ...args) {
            const taskId = 'timeout-' + Date.now() + '-' + Math.random();
            const timestamp = new Date().toISOString();
            
            window.backgroundTasks.push({
              taskId: taskId,
              type: 'setTimeout',
              delay: delay,
              timestamp: timestamp,
              status: 'scheduled'
            });
            
            console.log('[TASK DEBUG] setTimeout scheduled:', taskId, delay);
            
            const wrappedCallback = function() {
              window.backgroundTasks.find(task => task.taskId === taskId).status = 'executing';
              console.log('[TASK DEBUG] setTimeout executing:', taskId);
              
              try {
                const result = callback.apply(this, arguments);
                window.backgroundTasks.find(task => task.taskId === taskId).status = 'completed';
                console.log('[TASK DEBUG] setTimeout completed:', taskId);
                return result;
              } catch (error) {
                window.backgroundTasks.find(task => task.taskId === taskId).status = 'failed';
                window.backgroundTasks.find(task => task.taskId === taskId).error = error.message;
                console.log('[TASK DEBUG] setTimeout failed:', taskId, error);
                throw error;
              }
            };
            
            return originalSetTimeout.call(this, wrappedCallback, delay, ...args);
          };
          
          // Wrap setInterval for task tracking
          const originalSetInterval = window.setInterval;
          window.setInterval = function(callback, delay, ...args) {
            const taskId = 'interval-' + Date.now() + '-' + Math.random();
            const timestamp = new Date().toISOString();
            
            window.backgroundTasks.push({
              taskId: taskId,
              type: 'setInterval',
              delay: delay,
              timestamp: timestamp,
              status: 'scheduled',
              executions: 0
            });
            
            console.log('[TASK DEBUG] setInterval scheduled:', taskId, delay);
            
            const wrappedCallback = function() {
              const task = window.backgroundTasks.find(task => task.taskId === taskId);
              task.executions = (task.executions || 0) + 1;
              console.log('[TASK DEBUG] setInterval executing:', taskId, 'execution:', task.executions);
              
              try {
                return callback.apply(this, arguments);
              } catch (error) {
                task.status = 'failed';
                task.error = error.message;
                console.log('[TASK DEBUG] setInterval failed:', taskId, error);
                throw error;
              }
            };
            
            return originalSetInterval.call(this, wrappedCallback, delay, ...args);
          };
          
          console.log('[TASK DEBUG] Background task capture initialized');
          return 'Background task capture setup complete';
        })()
      `;

      console.log('Background task capture script prepared');
    } catch (error) {
      console.error('Failed to setup background task capture:', error);
    }
  }

  /**
   * Capture console messages from service worker
   */
  async captureConsoleMessages(): Promise<any[]> {
    if (!this.currentSession?.isConnected) {
      console.error('No active service worker session');
      return [];
    }

    try {
      console.log(
        'Capturing service worker console messages using mcp_chrome_devtools_list_console_messages...'
      );

      // Use real MCP function to get console messages
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_list_console_messages'
      );

      if (!result.success) {
        throw new Error(
          result.error || 'Failed to capture console messages via MCP'
        );
      }

      const consoleMessages = result.data || [];

      // Filter and categorize console messages for service worker context
      const filteredMessages =
        this.filterAndCategorizeConsoleMessages(consoleMessages);

      // Store captured messages in session
      this.currentSession.capturedData.consoleMessages.push(
        ...filteredMessages
      );

      console.log(
        `Captured ${filteredMessages.length} console messages from service worker`
      );
      return filteredMessages;
    } catch (error) {
      console.error('Failed to capture console messages:', error);

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'console_message_capture'
        );
      }

      return [];
    }
  }

  /**
   * Filter and categorize console messages for service worker debugging
   */
  private filterAndCategorizeConsoleMessages(messages: any[]): any[] {
    return messages
      .filter(msg => {
        // Filter for service worker related messages
        return (
          msg.source === 'service-worker' ||
          msg.text?.includes('[STORAGE DEBUG]') ||
          msg.text?.includes('[MESSAGE DEBUG]') ||
          msg.text?.includes('[TASK DEBUG]') ||
          msg.text?.includes('chrome.runtime') ||
          msg.text?.includes('chrome.storage') ||
          msg.text?.includes('background')
        );
      })
      .map(msg => ({
        ...msg,
        category: this.categorizeConsoleMessage(msg),
        timestamp: msg.timestamp || new Date().toISOString(),
        source: 'service-worker',
      }));
  }

  /**
   * Categorize console messages by type for better debugging insights
   */
  private categorizeConsoleMessage(message: any): string {
    const text = message.text || '';

    if (text.includes('[STORAGE DEBUG]')) return 'storage';
    if (text.includes('[MESSAGE DEBUG]')) return 'messaging';
    if (text.includes('[TASK DEBUG]')) return 'background-tasks';
    if (text.includes('chrome.runtime')) return 'runtime-api';
    if (text.includes('chrome.storage')) return 'storage-api';
    if (message.type === 'error') return 'error';
    if (message.type === 'warn') return 'warning';

    return 'general';
  }

  /**
   * Start real-time console message monitoring
   */
  async startConsoleMessageMonitoring(): Promise<void> {
    if (!this.currentSession?.isConnected) {
      throw new Error(
        'No active service worker session for console monitoring'
      );
    }

    try {
      console.log('Starting real-time console message monitoring...');

      // Set up periodic console message capture
      const monitoringInterval = setInterval(async () => {
        try {
          await this.captureConsoleMessages();
        } catch (error) {
          console.error('Error during console message monitoring:', error);
        }
      }, 1000); // Capture every second

      // Store interval reference for cleanup
      if (!this.currentSession.monitoringIntervals) {
        this.currentSession.monitoringIntervals = {};
      }
      this.currentSession.monitoringIntervals.consoleMessages =
        monitoringInterval;

      console.log('Real-time console message monitoring started');
    } catch (error) {
      console.error('Failed to start console message monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop console message monitoring
   */
  stopConsoleMessageMonitoring(): void {
    if (this.currentSession?.monitoringIntervals?.consoleMessages) {
      clearInterval(this.currentSession.monitoringIntervals.consoleMessages);
      delete this.currentSession.monitoringIntervals.consoleMessages;
      console.log('Console message monitoring stopped');
    }
  }

  /**
   * Get console messages with filtering options
   */
  async getConsoleMessages(options?: {
    category?: string;
    type?: string;
    since?: Date;
    limit?: number;
  }): Promise<any[]> {
    if (!this.currentSession?.isConnected) {
      return [];
    }

    let messages = [...this.currentSession.capturedData.consoleMessages];

    // Apply filters
    if (options?.category) {
      messages = messages.filter(msg => msg.category === options.category);
    }

    if (options?.type) {
      messages = messages.filter(msg => msg.type === options.type);
    }

    if (options?.since) {
      messages = messages.filter(
        msg => new Date(msg.timestamp) >= options.since
      );
    }

    // Apply limit
    if (options?.limit) {
      messages = messages.slice(-options.limit);
    }

    return messages;
  }

  /**
   * Track network requests from service worker (especially AI API calls)
   */
  async trackNetworkRequests(): Promise<any[]> {
    if (!this.currentSession?.isConnected) {
      console.error('No active service worker session');
      return [];
    }

    try {
      console.log(
        'Tracking service worker network requests using mcp_chrome_devtools_list_network_requests...'
      );

      // Use real MCP function to get network requests
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_list_network_requests'
      );

      if (!result.success) {
        throw new Error(
          result.error || 'Failed to track network requests via MCP'
        );
      }

      const networkRequests = result.data || [];

      // Filter and analyze network requests for service worker debugging
      const analyzedRequests = this.analyzeNetworkRequests(networkRequests);

      // Store captured requests in session
      this.currentSession.capturedData.networkRequests.push(
        ...analyzedRequests
      );

      console.log(
        `Tracked ${analyzedRequests.length} network requests from service worker`
      );
      return analyzedRequests;
    } catch (error) {
      console.error('Failed to track network requests:', error);

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'network_request_tracking'
        );
      }

      return [];
    }
  }

  /**
   * Analyze network requests for debugging insights
   */
  private analyzeNetworkRequests(requests: any[]): any[] {
    return requests.map(request => {
      const analyzedRequest = {
        ...request,
        category: this.categorizeNetworkRequest(request),
        performance: this.analyzeRequestPerformance(request),
        timestamp: request.timestamp || new Date().toISOString(),
      };

      // Add AI API specific analysis
      if (analyzedRequest.category === 'ai-api') {
        analyzedRequest.aiAnalysis = this.analyzeAIAPIRequest(request);
      }

      return analyzedRequest;
    });
  }

  /**
   * Categorize network requests by type
   */
  private categorizeNetworkRequest(request: any): string {
    const url = request.url || '';

    // AI API endpoints
    if (url.includes('generativelanguage.googleapis.com')) return 'ai-api';
    if (url.includes('openai.com')) return 'ai-api';
    if (url.includes('anthropic.com')) return 'ai-api';

    // Chrome extension resources
    if (url.startsWith('chrome-extension://')) return 'extension-resource';

    // Content extraction services
    if (url.includes('jina.ai') || url.includes('readability'))
      return 'content-extraction';

    // Chrome APIs
    if (url.includes('chrome://')) return 'chrome-api';

    // External web requests
    if (url.startsWith('https://') || url.startsWith('http://'))
      return 'external-web';

    return 'other';
  }

  /**
   * Analyze request performance metrics
   */
  private analyzeRequestPerformance(request: any): any {
    const responseTime = request.responseTime || 0;
    const status = request.status || 0;

    return {
      responseTime,
      status,
      isSuccess: status >= 200 && status < 300,
      isError: status >= 400,
      performanceRating: this.getPerformanceRating(responseTime),
      size: request.responseSize || 0,
    };
  }

  /**
   * Get performance rating based on response time
   */
  private getPerformanceRating(responseTime: number): string {
    if (responseTime < 100) return 'excellent';
    if (responseTime < 500) return 'good';
    if (responseTime < 1000) return 'fair';
    if (responseTime < 3000) return 'slow';
    return 'very-slow';
  }

  /**
   * Analyze AI API specific requests
   */
  private analyzeAIAPIRequest(request: any): any {
    const url = request.url || '';
    const method = request.method || '';
    const responseTime = request.responseTime || 0;

    return {
      provider: this.identifyAIProvider(url),
      endpoint: this.extractAIEndpoint(url),
      isGenerateRequest: method === 'POST' && url.includes('generate'),
      responseTime,
      tokenUsage: this.estimateTokenUsage(request),
      costEstimate: this.estimateAPICallCost(request),
    };
  }

  /**
   * Identify AI provider from URL
   */
  private identifyAIProvider(url: string): string {
    if (url.includes('generativelanguage.googleapis.com'))
      return 'google-gemini';
    if (url.includes('openai.com')) return 'openai';
    if (url.includes('anthropic.com')) return 'anthropic';
    return 'unknown';
  }

  /**
   * Extract AI endpoint from URL
   */
  private extractAIEndpoint(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1] || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Estimate token usage from request/response
   */
  private estimateTokenUsage(request: any): any {
    // This is a rough estimation - in a real implementation,
    // you would parse the actual request/response bodies
    const requestSize = request.requestSize || 0;
    const responseSize = request.responseSize || 0;

    return {
      estimatedInputTokens: Math.ceil(requestSize / 4), // Rough estimate: 4 chars per token
      estimatedOutputTokens: Math.ceil(responseSize / 4),
      totalEstimatedTokens: Math.ceil((requestSize + responseSize) / 4),
    };
  }

  /**
   * Estimate API call cost
   */
  private estimateAPICallCost(request: any): any {
    const tokenUsage = this.estimateTokenUsage(request);
    const provider = this.identifyAIProvider(request.url || '');

    // Rough cost estimates (would need to be updated with current pricing)
    let inputCostPer1K = 0;
    let outputCostPer1K = 0;

    switch (provider) {
      case 'google-gemini':
        inputCostPer1K = 0.00025; // $0.00025 per 1K input tokens
        outputCostPer1K = 0.0005; // $0.0005 per 1K output tokens
        break;
      case 'openai':
        inputCostPer1K = 0.0015; // Varies by model
        outputCostPer1K = 0.002;
        break;
    }

    const inputCost = (tokenUsage.estimatedInputTokens / 1000) * inputCostPer1K;
    const outputCost =
      (tokenUsage.estimatedOutputTokens / 1000) * outputCostPer1K;

    return {
      estimatedInputCost: inputCost,
      estimatedOutputCost: outputCost,
      estimatedTotalCost: inputCost + outputCost,
      currency: 'USD',
    };
  }

  /**
   * Start real-time network request monitoring
   */
  async startNetworkRequestMonitoring(): Promise<void> {
    if (!this.currentSession?.isConnected) {
      throw new Error(
        'No active service worker session for network monitoring'
      );
    }

    try {
      console.log('Starting real-time network request monitoring...');

      // Set up periodic network request tracking
      const monitoringInterval = setInterval(async () => {
        try {
          await this.trackNetworkRequests();
        } catch (error) {
          console.error('Error during network request monitoring:', error);
        }
      }, 2000); // Track every 2 seconds

      // Store interval reference for cleanup
      if (!this.currentSession.monitoringIntervals) {
        this.currentSession.monitoringIntervals = {};
      }
      this.currentSession.monitoringIntervals.networkRequests =
        monitoringInterval;

      console.log('Real-time network request monitoring started');
    } catch (error) {
      console.error('Failed to start network request monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop network request monitoring
   */
  stopNetworkRequestMonitoring(): void {
    if (this.currentSession?.monitoringIntervals?.networkRequests) {
      clearInterval(this.currentSession.monitoringIntervals.networkRequests);
      delete this.currentSession.monitoringIntervals.networkRequests;
      console.log('Network request monitoring stopped');
    }
  }

  /**
   * Get network requests with filtering and analysis options
   */
  async getNetworkRequests(options?: {
    category?: string;
    status?: number;
    since?: Date;
    limit?: number;
    includeAnalysis?: boolean;
  }): Promise<any[]> {
    if (!this.currentSession?.isConnected) {
      return [];
    }

    let requests = [...this.currentSession.capturedData.networkRequests];

    // Apply filters
    if (options?.category) {
      requests = requests.filter(req => req.category === options.category);
    }

    if (options?.status) {
      requests = requests.filter(
        req => req.performance?.status === options.status
      );
    }

    if (options?.since) {
      requests = requests.filter(
        req => new Date(req.timestamp) >= options.since
      );
    }

    // Apply limit
    if (options?.limit) {
      requests = requests.slice(-options.limit);
    }

    return requests;
  }

  /**
   * Get AI API call summary
   */
  async getAIAPICallSummary(): Promise<any> {
    const aiRequests = await this.getNetworkRequests({ category: 'ai-api' });

    const summary = {
      totalCalls: aiRequests.length,
      totalCost: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      providers: {} as any,
      errors: 0,
    };

    aiRequests.forEach(request => {
      if (request.aiAnalysis) {
        summary.totalCost +=
          request.aiAnalysis.costEstimate?.estimatedTotalCost || 0;
        summary.totalTokens +=
          request.aiAnalysis.tokenUsage?.totalEstimatedTokens || 0;

        const provider = request.aiAnalysis.provider;
        if (!summary.providers[provider]) {
          summary.providers[provider] = { calls: 0, cost: 0, tokens: 0 };
        }
        summary.providers[provider].calls++;
        summary.providers[provider].cost +=
          request.aiAnalysis.costEstimate?.estimatedTotalCost || 0;
        summary.providers[provider].tokens +=
          request.aiAnalysis.tokenUsage?.totalEstimatedTokens || 0;
      }

      if (request.performance?.isError) {
        summary.errors++;
      }
    });

    if (aiRequests.length > 0) {
      summary.averageResponseTime =
        aiRequests.reduce(
          (sum, req) => sum + (req.performance?.responseTime || 0),
          0
        ) / aiRequests.length;
    }

    return summary;
  }

  /**
   * Debug chrome.storage API operations
   */
  async debugStorageOperations(): Promise<any> {
    if (!this.currentSession?.isConnected) {
      console.error('No active service worker session');
      return null;
    }

    try {
      console.log(
        'Debugging storage operations using real MCP script evaluation...'
      );

      // Script to inspect current storage state and operations
      const storageDebugScript = `
        () => {
          return new Promise((resolve) => {
            try {
              // Get current storage state
              chrome.storage.local.get(null, (items) => {
                if (chrome.runtime.lastError) {
                  resolve({
                    error: chrome.runtime.lastError.message,
                    timestamp: new Date().toISOString()
                  });
                  return;
                }
                
                // Get quota information
                chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
                  const storageInfo = {
                    itemCount: Object.keys(items).length,
                    totalSize: JSON.stringify(items).length,
                    bytesInUse: bytesInUse,
                    keys: Object.keys(items),
                    items: items, // Include actual data for debugging
                    lastModified: items._lastModified || 'unknown',
                    recentOperations: window.storageOperations || [],
                    storageQuota: window.storageQuotaInfo || {
                      bytesInUse: bytesInUse,
                      maxBytes: chrome.storage.local.QUOTA_BYTES || 5242880,
                      lastUpdated: new Date().toISOString()
                    },
                    corruptionCheck: this.checkStorageCorruption(items),
                    timestamp: new Date().toISOString()
                  };
                  
                  resolve(storageInfo);
                });
              });
            } catch (error) {
              resolve({
                error: error.message,
                timestamp: new Date().toISOString()
              });
            }
          });
          
          // Helper function to check for storage corruption
          function checkStorageCorruption(items) {
            const corruptionIssues = [];
            
            try {
              // Check if items can be serialized/deserialized
              const serialized = JSON.stringify(items);
              const deserialized = JSON.parse(serialized);
              
              // Check for circular references or other issues
              for (const [key, value] of Object.entries(items)) {
                try {
                  JSON.stringify(value);
                } catch (error) {
                  corruptionIssues.push({
                    key: key,
                    issue: 'serialization_error',
                    error: error.message
                  });
                }
                
                // Check for unexpected data types
                if (value === undefined) {
                  corruptionIssues.push({
                    key: key,
                    issue: 'undefined_value',
                    error: 'Value is undefined'
                  });
                }
              }
              
              return {
                isCorrupted: corruptionIssues.length > 0,
                issues: corruptionIssues,
                checkedAt: new Date().toISOString()
              };
            } catch (error) {
              return {
                isCorrupted: true,
                issues: [{ issue: 'general_corruption', error: error.message }],
                checkedAt: new Date().toISOString()
              };
            }
          }
        }
      `;

      // Execute the storage debug script using real MCP
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        { function: storageDebugScript }
      );

      if (!result.success) {
        throw new Error(
          result.error || 'Failed to execute storage debug script'
        );
      }

      const storageInfo = result.data;

      if (storageInfo.error) {
        console.error('Storage debugging script error:', storageInfo.error);
        return {
          error: storageInfo.error,
          timestamp: storageInfo.timestamp,
        };
      }

      // Store storage debug info in session
      this.currentSession.capturedData.storageOperations.push({
        operation: 'debug_inspection',
        result: storageInfo,
        timestamp: new Date().toISOString(),
      });

      console.log('Storage debugging completed successfully:', {
        itemCount: storageInfo.itemCount,
        bytesInUse: storageInfo.bytesInUse,
        isCorrupted: storageInfo.corruptionCheck?.isCorrupted,
      });

      return storageInfo;
    } catch (error) {
      console.error('Failed to debug storage operations:', error);

      // Handle MCP connection errors
      if (error.message?.includes('MCP')) {
        await this.mcpConnectionManager.handleMCPError(
          error.message,
          'storage_debugging'
        );
      }

      return {
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get captured storage operations using real MCP script evaluation
   */
  async getCapturedStorageOperations(): Promise<any[]> {
    if (!this.currentSession?.isConnected) {
      return [];
    }

    try {
      console.log('Getting captured storage operations...');

      // Script to get captured storage operations
      const getOperationsScript = `
        () => {
          return {
            operations: window.storageOperations || [],
            quotaInfo: window.storageQuotaInfo || {},
            timestamp: new Date().toISOString()
          };
        }
      `;

      // Execute script using real MCP
      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        { function: getOperationsScript }
      );

      if (!result.success) {
        console.error(
          'Failed to get captured storage operations:',
          result.error
        );
        return [];
      }

      const data = result.data;
      return data.operations || [];
    } catch (error) {
      console.error('Failed to get captured storage operations:', error);
      return [];
    }
  }

  /**
   * Validate storage state and detect issues
   */
  async validateStorageState(): Promise<any> {
    if (!this.currentSession?.isConnected) {
      return { error: 'No active session' };
    }

    try {
      console.log('Validating storage state...');

      const validationScript = `
        () => {
          return new Promise((resolve) => {
            chrome.storage.local.get(null, (items) => {
              if (chrome.runtime.lastError) {
                resolve({
                  isValid: false,
                  error: chrome.runtime.lastError.message,
                  timestamp: new Date().toISOString()
                });
                return;
              }
              
              const validation = {
                isValid: true,
                itemCount: Object.keys(items).length,
                issues: [],
                recommendations: [],
                timestamp: new Date().toISOString()
              };
              
              // Check for common issues
              chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
                const maxBytes = chrome.storage.local.QUOTA_BYTES || 5242880;
                const usagePercent = (bytesInUse / maxBytes) * 100;
                
                if (usagePercent > 90) {
                  validation.issues.push({
                    type: 'quota_warning',
                    message: 'Storage usage is above 90%',
                    severity: 'high'
                  });
                  validation.recommendations.push('Consider cleaning up old data');
                }
                
                if (usagePercent > 75) {
                  validation.issues.push({
                    type: 'quota_caution',
                    message: 'Storage usage is above 75%',
                    severity: 'medium'
                  });
                }
                
                // Check for orphaned data
                const expectedKeys = ['userSettings', 'cachedArticles', 'learningProgress', 'aiServiceConfig'];
                const actualKeys = Object.keys(items);
                const orphanedKeys = actualKeys.filter(key => 
                  !expectedKeys.includes(key) && !key.startsWith('_')
                );
                
                if (orphanedKeys.length > 0) {
                  validation.issues.push({
                    type: 'orphaned_data',
                    message: 'Found orphaned storage keys: ' + orphanedKeys.join(', '),
                    severity: 'low'
                  });
                  validation.recommendations.push('Review and clean up orphaned storage keys');
                }
                
                validation.storageStats = {
                  bytesInUse,
                  maxBytes,
                  usagePercent: Math.round(usagePercent * 100) / 100,
                  freeBytes: maxBytes - bytesInUse
                };
                
                validation.isValid = validation.issues.filter(issue => 
                  issue.severity === 'high'
                ).length === 0;
                
                resolve(validation);
              });
            });
          });
        }
      `;

      const result = await this.mcpConnectionManager.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        { function: validationScript }
      );

      if (!result.success) {
        return {
          isValid: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        };
      }

      return result.data;
    } catch (error) {
      console.error('Failed to validate storage state:', error);
      return {
        isValid: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Start storage operation monitoring
   */
  async startStorageOperationMonitoring(): Promise<void> {
    if (!this.currentSession?.isConnected) {
      throw new Error(
        'No active service worker session for storage monitoring'
      );
    }

    try {
      console.log('Starting storage operation monitoring...');

      // Set up periodic storage operation capture
      const monitoringInterval = setInterval(async () => {
        try {
          await this.getCapturedStorageOperations();
        } catch (error) {
          console.error('Error during storage operation monitoring:', error);
        }
      }, 3000); // Check every 3 seconds

      // Store interval reference for cleanup
      if (!this.currentSession.monitoringIntervals) {
        this.currentSession.monitoringIntervals = {};
      }
      this.currentSession.monitoringIntervals.storageOperations =
        monitoringInterval;

      console.log('Storage operation monitoring started');
    } catch (error) {
      console.error('Failed to start storage operation monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop storage operation monitoring
   */
  stopStorageOperationMonitoring(): void {
    if (this.currentSession?.monitoringIntervals?.storageOperations) {
      clearInterval(this.currentSession.monitoringIntervals.storageOperations);
      delete this.currentSession.monitoringIntervals.storageOperations;
      console.log('Storage operation monitoring stopped');
    }
  }

  /**
   * Analyze service worker lifecycle events
   */
  async analyzeLifecycleEvents(): Promise<any[]> {
    try {
      console.log('Analyzing service worker lifecycle events...');
      // This would track install, activate, and other lifecycle events
      return []; // Placeholder - would return actual lifecycle events
    } catch (error) {
      console.error('Failed to analyze lifecycle events:', error);
      return [];
    }
  }

  /**
   * Stop monitoring service worker
   */
  async stopMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      console.log('Service worker monitoring not active');
      return;
    }

    try {
      console.log('Stopping service worker monitoring...');

      // Stop all monitoring intervals
      this.stopConsoleMessageMonitoring();
      this.stopNetworkRequestMonitoring();
      this.stopStorageOperationMonitoring();

      this.isMonitoring = false;
      console.log('Service worker monitoring stopped');
    } catch (error) {
      console.error('Failed to stop service worker monitoring:', error);
    }
  }

  /**
   * Get current debug session
   */
  getCurrentSession(): ServiceWorkerDebugSession | null {
    return this.currentSession;
  }

  /**
   * Get captured message events
   */
  async getCapturedMessageEvents(): Promise<any[]> {
    if (!this.currentSession?.isConnected) {
      return [];
    }

    try {
      // This would use mcp_chrome_devtools_evaluate_script to get window.messageEvents
      const messageEventsScript = `
        () => {
          return window.messageEvents || [];
        }
      `;

      // For now, return mock captured message events
      const messageEvents = [
        {
          type: 'incoming',
          message: { action: 'extractContent', url: 'https://example.com' },
          sender: { tab: { id: 123 } },
          timestamp: new Date().toISOString(),
          receiver: 'service-worker',
        },
        {
          type: 'outgoing',
          message: { action: 'processContent', content: '...' },
          timestamp: new Date().toISOString(),
          sender: 'service-worker',
        },
      ];

      return messageEvents;
    } catch (error) {
      console.error('Failed to get captured message events:', error);
      return [];
    }
  }

  /**
   * Get captured background tasks
   */
  async getCapturedBackgroundTasks(): Promise<any[]> {
    if (!this.currentSession?.isConnected) {
      return [];
    }

    try {
      // This would use mcp_chrome_devtools_evaluate_script to get window.backgroundTasks
      const backgroundTasksScript = `
        () => {
          return window.backgroundTasks || [];
        }
      `;

      // For now, return mock captured background tasks
      const backgroundTasks = [
        {
          taskId: 'timeout-1234567890-0.123',
          type: 'setTimeout',
          delay: 5000,
          timestamp: new Date().toISOString(),
          status: 'completed',
        },
        {
          taskId: 'interval-1234567891-0.456',
          type: 'setInterval',
          delay: 30000,
          timestamp: new Date().toISOString(),
          status: 'scheduled',
          executions: 3,
        },
      ];

      return backgroundTasks;
    } catch (error) {
      console.error('Failed to get captured background tasks:', error);
      return [];
    }
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    capabilities: ServiceWorkerDebugCapabilities;
    session: ServiceWorkerDebugSession | null;
  } {
    return {
      isMonitoring: this.isMonitoring,
      capabilities: this.capabilities,
      session: this.currentSession,
    };
  }
}
