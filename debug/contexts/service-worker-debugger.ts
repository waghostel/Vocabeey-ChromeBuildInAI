/**
 * Service Worker Debugger
 * Debug background script functionality and inter-component communication
 */

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
}

export class ServiceWorkerDebugger {
  private capabilities: ServiceWorkerDebugCapabilities;
  private isMonitoring: boolean = false;
  private currentSession: ServiceWorkerDebugSession | null = null;

  constructor() {
    this.capabilities = {
      monitorStorageOperations: true,
      trackMessagePassing: true,
      captureBackgroundTasks: true,
      analyzeLifecycleEvents: true,
      debugOffscreenAPI: true,
    };
  }

  /**
   * Connect to service worker context and start monitoring
   */
  async connectToServiceWorker(): Promise<boolean> {
    try {
      console.log('Connecting to service worker context...');

      // Get list of available pages to find service worker
      const pages = await this.listPages();
      const serviceWorkerPage = this.findServiceWorkerPage(pages);

      if (!serviceWorkerPage) {
        console.error('Service worker page not found');
        return false;
      }

      // Select the service worker page for debugging
      await this.selectPage(serviceWorkerPage.pageIdx);

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
        `Connected to service worker (page index: ${serviceWorkerPage.pageIdx})`
      );
      return true;
    } catch (error) {
      console.error('Failed to connect to service worker:', error);
      return false;
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
          title: 'Content Script',
          url: 'https://example.com',
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
      console.log(`Selecting page ${pageIndex} for debugging`);
      // This would use mcp_chrome_devtools_select_page when available
      // For now, just log the action
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
      // Inject monitoring code into service worker context
      const storageMonitoringScript = `
        (() => {
          // Store original chrome.storage methods
          const originalGet = chrome.storage.local.get;
          const originalSet = chrome.storage.local.set;
          const originalRemove = chrome.storage.local.remove;
          const originalClear = chrome.storage.local.clear;
          
          // Create monitoring wrapper
          window.storageOperations = window.storageOperations || [];
          
          // Wrap chrome.storage.local.get
          chrome.storage.local.get = function(...args) {
            const timestamp = new Date().toISOString();
            window.storageOperations.push({
              operation: 'get',
              args: args,
              timestamp: timestamp
            });
            console.log('[STORAGE DEBUG] get operation:', args);
            return originalGet.apply(this, args);
          };
          
          // Wrap chrome.storage.local.set
          chrome.storage.local.set = function(...args) {
            const timestamp = new Date().toISOString();
            window.storageOperations.push({
              operation: 'set',
              args: args,
              timestamp: timestamp
            });
            console.log('[STORAGE DEBUG] set operation:', args);
            return originalSet.apply(this, args);
          };
          
          // Wrap chrome.storage.local.remove
          chrome.storage.local.remove = function(...args) {
            const timestamp = new Date().toISOString();
            window.storageOperations.push({
              operation: 'remove',
              args: args,
              timestamp: timestamp
            });
            console.log('[STORAGE DEBUG] remove operation:', args);
            return originalRemove.apply(this, args);
          };
          
          // Wrap chrome.storage.local.clear
          chrome.storage.local.clear = function(...args) {
            const timestamp = new Date().toISOString();
            window.storageOperations.push({
              operation: 'clear',
              args: args,
              timestamp: timestamp
            });
            console.log('[STORAGE DEBUG] clear operation:', args);
            return originalClear.apply(this, args);
          };
          
          console.log('[STORAGE DEBUG] Storage monitoring initialized');
          return 'Storage monitoring setup complete';
        })()
      `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      console.log('Storage monitoring script prepared');
      // Note: storageMonitoringScript would be executed via mcp_chrome_devtools_evaluate_script
    } catch (error) {
      console.error('Failed to setup storage monitoring:', error);
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
      console.log('Capturing service worker console messages...');

      // This would use mcp_chrome_devtools_list_console_messages when available
      const consoleMessages = [
        // Mock data structure for now
        {
          msgid: 1,
          type: 'log',
          text: '[STORAGE DEBUG] Storage monitoring initialized',
          timestamp: new Date().toISOString(),
          source: 'service-worker',
        },
        {
          msgid: 2,
          type: 'log',
          text: '[MESSAGE DEBUG] Message passing tracking initialized',
          timestamp: new Date().toISOString(),
          source: 'service-worker',
        },
      ];

      // Store captured messages in session
      this.currentSession.capturedData.consoleMessages.push(...consoleMessages);

      console.log(`Captured ${consoleMessages.length} console messages`);
      return consoleMessages;
    } catch (error) {
      console.error('Failed to capture console messages:', error);
      return [];
    }
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
      console.log('Tracking service worker network requests...');

      // This would use mcp_chrome_devtools_list_network_requests when available
      // Filter for AI API calls and other relevant requests
      const networkRequests = [
        // Mock data structure for AI API calls
        {
          reqid: 1,
          url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
          method: 'POST',
          status: 200,
          resourceType: 'fetch',
          timestamp: new Date().toISOString(),
          responseTime: 1250,
          requestHeaders: { 'Content-Type': 'application/json' },
          responseHeaders: { 'Content-Type': 'application/json' },
        },
        {
          reqid: 2,
          url: 'chrome-extension://[id]/offscreen.html',
          method: 'GET',
          status: 200,
          resourceType: 'document',
          timestamp: new Date().toISOString(),
          responseTime: 45,
        },
      ];

      // Store captured requests in session
      this.currentSession.capturedData.networkRequests.push(...networkRequests);

      console.log(`Tracked ${networkRequests.length} network requests`);
      return networkRequests;
    } catch (error) {
      console.error('Failed to track network requests:', error);
      return [];
    }
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
      console.log('Debugging storage operations...');

      // Script to inspect current storage state and operations
      const storageDebugScript = `
        () => {
          return new Promise((resolve) => {
            // Get current storage state
            chrome.storage.local.get(null, (items) => {
              const storageInfo = {
                itemCount: Object.keys(items).length,
                totalSize: JSON.stringify(items).length,
                keys: Object.keys(items),
                lastModified: items._lastModified || 'unknown',
                recentOperations: window.storageOperations || [],
                storageQuota: {
                  // This would get actual quota info
                  used: JSON.stringify(items).length,
                  available: 5242880 // 5MB default for local storage
                }
              };
              resolve(storageInfo);
            });
          });
        }
      `;

      // This would use mcp_chrome_devtools_evaluate_script when available
      // For now, return mock data based on typical extension storage
      const storageInfo = {
        itemCount: 5,
        totalSize: 2048,
        keys: [
          'userSettings',
          'cachedArticles',
          'learningProgress',
          'aiServiceConfig',
          '_lastModified',
        ],
        lastModified: new Date().toISOString(),
        recentOperations: this.currentSession.capturedData.storageOperations,
        storageQuota: {
          used: 2048,
          available: 5242880,
        },
      };

      // Store storage debug info in session
      this.currentSession.capturedData.storageOperations.push({
        operation: 'debug_inspection',
        result: storageInfo,
        timestamp: new Date().toISOString(),
      });

      console.log('Storage debugging completed:', storageInfo);
      return storageInfo;
    } catch (error) {
      console.error('Failed to debug storage operations:', error);
      return null;
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
   * Get captured storage operations
   */
  async getCapturedStorageOperations(): Promise<any[]> {
    if (!this.currentSession?.isConnected) {
      return [];
    }

    try {
      // This would use mcp_chrome_devtools_evaluate_script to get window.storageOperations
      const storageOpsScript = `
        () => {
          return window.storageOperations || [];
        }
      `;

      // For now, return mock captured operations
      const operations = [
        {
          operation: 'get',
          args: [['userSettings']],
          timestamp: new Date().toISOString(),
        },
        {
          operation: 'set',
          args: [{ userSettings: { theme: 'dark', language: 'en' } }],
          timestamp: new Date().toISOString(),
        },
      ];

      return operations;
    } catch (error) {
      console.error('Failed to get captured storage operations:', error);
      return [];
    }
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
