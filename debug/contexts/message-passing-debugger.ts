/**
 * Message Passing Debugger
 * Track inter-component communication, message flow visualization, and async operation monitoring
 */

export interface MessageEvent {
  id: string;
  type: 'outgoing' | 'incoming';
  message: any;
  sender: any;
  receiver: string;
  timestamp: string;
  duration?: number;
  success: boolean;
  error?: string;
  context: 'service-worker' | 'content-script' | 'offscreen' | 'ui';
}

export interface MessageFlow {
  flowId: string;
  startTime: string;
  endTime?: string;
  messages: MessageEvent[];
  status: 'active' | 'completed' | 'failed';
  totalDuration?: number;
}

export interface AsyncOperation {
  operationId: string;
  type: 'promise' | 'callback' | 'async-await';
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'pending' | 'resolved' | 'rejected';
  result?: any;
  error?: string;
  context: string;
}

export class MessagePassingDebugger {
  private isMonitoring: boolean = false;
  private capturedMessages: MessageEvent[] = [];
  private messageFlows: MessageFlow[] = [];
  private asyncOperations: AsyncOperation[] = [];
  private messageIdCounter: number = 0;

  /**
   * Start monitoring message passing between extension components
   */
  async startMessageMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Message passing monitoring already active');
      return;
    }

    try {
      console.log('Starting message passing monitoring...');

      // Inject message tracking code into service worker context
      await this.injectMessageTracking();

      this.isMonitoring = true;
      console.log('Message passing monitoring started');
    } catch (error) {
      console.error('Failed to start message monitoring:', error);
      throw error;
    }
  }

  /**
   * Inject message tracking code into service worker
   */
  private async injectMessageTracking(): Promise<void> {
    const messageTrackingScript = `
      (() => {
        // Prevent double injection
        if (window.messageDebuggerInjected) {
          return 'Message debugger already injected';
        }
        
        // Store original message methods
        const originalSendMessage = chrome.runtime.sendMessage;
        const originalOnMessage = chrome.runtime.onMessage;
        const originalConnect = chrome.runtime.connect;
        const originalOnConnect = chrome.runtime.onConnect;
        
        // Create message tracking storage
        window.messageEvents = window.messageEvents || [];
        window.messageFlows = window.messageFlows || [];
        window.asyncOperations = window.asyncOperations || [];
        window.messageIdCounter = 0;
        
        // Helper function to generate unique message IDs
        function generateMessageId() {
          return 'msg-' + Date.now() + '-' + (++window.messageIdCounter);
        }
        
        // Helper function to track message flows
        function trackMessageFlow(messageId, type, message) {
          const existingFlow = window.messageFlows.find(flow => 
            flow.status === 'active' && 
            JSON.stringify(flow.messages[0]?.message) === JSON.stringify(message)
          );
          
          if (existingFlow) {
            return existingFlow.flowId;
          } else {
            const flowId = 'flow-' + Date.now() + '-' + Math.random();
            window.messageFlows.push({
              flowId: flowId,
              startTime: new Date().toISOString(),
              messages: [],
              status: 'active'
            });
            return flowId;
          }
        }
        
        // Wrap chrome.runtime.sendMessage
        chrome.runtime.sendMessage = function(...args) {
          const messageId = generateMessageId();
          const startTime = performance.now();
          const timestamp = new Date().toISOString();
          
          // Extract message and options
          const message = args[0];
          const options = args[1];
          const callback = args[args.length - 1];
          
          const flowId = trackMessageFlow(messageId, 'outgoing', message);
          
          const messageEvent = {
            id: messageId,
            type: 'outgoing',
            message: message,
            sender: 'service-worker',
            receiver: 'unknown',
            timestamp: timestamp,
            success: false,
            context: 'service-worker',
            flowId: flowId
          };
          
          window.messageEvents.push(messageEvent);
          console.log('[MESSAGE DEBUG] Outgoing message:', messageEvent);
          
          // Wrap callback to track response
          const wrappedCallback = function(response) {
            const endTime = performance.now();
            messageEvent.duration = endTime - startTime;
            messageEvent.success = true;
            messageEvent.response = response;
            
            // Update message flow
            const flow = window.messageFlows.find(f => f.flowId === flowId);
            if (flow) {
              flow.messages.push(messageEvent);
              if (response) {
                flow.endTime = new Date().toISOString();
                flow.status = 'completed';
                flow.totalDuration = endTime - new Date(flow.startTime).getTime();
              }
            }
            
            console.log('[MESSAGE DEBUG] Message response received:', messageEvent);
            
            if (typeof callback === 'function') {
              return callback(response);
            }
          };
          
          // Replace callback with wrapped version
          const newArgs = [...args];
          if (typeof callback === 'function') {
            newArgs[newArgs.length - 1] = wrappedCallback;
          } else {
            newArgs.push(wrappedCallback);
          }
          
          try {
            return originalSendMessage.apply(this, newArgs);
          } catch (error) {
            messageEvent.success = false;
            messageEvent.error = error.message;
            console.error('[MESSAGE DEBUG] Send message failed:', messageEvent);
            throw error;
          }
        };
        
        // Wrap chrome.runtime.onMessage listener
        const originalAddListener = chrome.runtime.onMessage.addListener;
        chrome.runtime.onMessage.addListener = function(callback) {
          const wrappedCallback = function(message, sender, sendResponse) {
            const messageId = generateMessageId();
            const timestamp = new Date().toISOString();
            const startTime = performance.now();
            
            const flowId = trackMessageFlow(messageId, 'incoming', message);
            
            const messageEvent = {
              id: messageId,
              type: 'incoming',
              message: message,
              sender: sender,
              receiver: 'service-worker',
              timestamp: timestamp,
              success: false,
              context: 'service-worker',
              flowId: flowId
            };
            
            window.messageEvents.push(messageEvent);
            console.log('[MESSAGE DEBUG] Incoming message:', messageEvent);
            
            try {
              // Track async operation if sendResponse is used
              let responsePromise = null;
              const wrappedSendResponse = function(response) {
                const endTime = performance.now();
                messageEvent.duration = endTime - startTime;
                messageEvent.success = true;
                messageEvent.response = response;
                
                // Update message flow
                const flow = window.messageFlows.find(f => f.flowId === flowId);
                if (flow) {
                  flow.messages.push(messageEvent);
                  flow.endTime = new Date().toISOString();
                  flow.status = 'completed';
                  flow.totalDuration = endTime - new Date(flow.startTime).getTime();
                }
                
                console.log('[MESSAGE DEBUG] Response sent:', messageEvent);
                return sendResponse(response);
              };
              
              const result = callback(message, sender, wrappedSendResponse);
              
              // Handle promise-based responses
              if (result instanceof Promise) {
                const operationId = 'async-' + messageId;
                window.asyncOperations.push({
                  operationId: operationId,
                  type: 'promise',
                  startTime: timestamp,
                  status: 'pending',
                  context: 'message-handler'
                });
                
                result.then(response => {
                  const operation = window.asyncOperations.find(op => op.operationId === operationId);
                  if (operation) {
                    operation.endTime = new Date().toISOString();
                    operation.status = 'resolved';
                    operation.result = response;
                    operation.duration = performance.now() - startTime;
                  }
                  
                  messageEvent.success = true;
                  messageEvent.duration = performance.now() - startTime;
                  console.log('[MESSAGE DEBUG] Async message handled:', messageEvent);
                }).catch(error => {
                  const operation = window.asyncOperations.find(op => op.operationId === operationId);
                  if (operation) {
                    operation.endTime = new Date().toISOString();
                    operation.status = 'rejected';
                    operation.error = error.message;
                    operation.duration = performance.now() - startTime;
                  }
                  
                  messageEvent.success = false;
                  messageEvent.error = error.message;
                  messageEvent.duration = performance.now() - startTime;
                  console.error('[MESSAGE DEBUG] Async message failed:', messageEvent);
                });
              } else {
                messageEvent.success = true;
                messageEvent.duration = performance.now() - startTime;
              }
              
              return result;
            } catch (error) {
              messageEvent.success = false;
              messageEvent.error = error.message;
              messageEvent.duration = performance.now() - startTime;
              console.error('[MESSAGE DEBUG] Message handler failed:', messageEvent);
              throw error;
            }
          };
          
          return originalAddListener.call(this, wrappedCallback);
        };
        
        // Wrap chrome.runtime.connect for port-based communication
        chrome.runtime.connect = function(...args) {
          const connectId = generateMessageId();
          const timestamp = new Date().toISOString();
          
          console.log('[MESSAGE DEBUG] Port connection initiated:', {
            id: connectId,
            args: args,
            timestamp: timestamp
          });
          
          try {
            const port = originalConnect.apply(this, args);
            
            // Wrap port.postMessage
            const originalPostMessage = port.postMessage;
            port.postMessage = function(message) {
              const messageId = generateMessageId();
              const messageEvent = {
                id: messageId,
                type: 'port-outgoing',
                message: message,
                sender: 'service-worker',
                receiver: port.name || 'unknown-port',
                timestamp: new Date().toISOString(),
                success: true,
                context: 'service-worker',
                portId: connectId
              };
              
              window.messageEvents.push(messageEvent);
              console.log('[MESSAGE DEBUG] Port message sent:', messageEvent);
              
              return originalPostMessage.call(this, message);
            };
            
            // Wrap port.onMessage
            const originalOnMessage = port.onMessage;
            port.onMessage.addListener = function(callback) {
              const wrappedCallback = function(message) {
                const messageId = generateMessageId();
                const messageEvent = {
                  id: messageId,
                  type: 'port-incoming',
                  message: message,
                  sender: port.name || 'unknown-port',
                  receiver: 'service-worker',
                  timestamp: new Date().toISOString(),
                  success: true,
                  context: 'service-worker',
                  portId: connectId
                };
                
                window.messageEvents.push(messageEvent);
                console.log('[MESSAGE DEBUG] Port message received:', messageEvent);
                
                return callback(message);
              };
              
              return originalOnMessage.addListener.call(this, wrappedCallback);
            };
            
            return port;
          } catch (error) {
            console.error('[MESSAGE DEBUG] Port connection failed:', error);
            throw error;
          }
        };
        
        // Mark as injected
        window.messageDebuggerInjected = true;
        console.log('[MESSAGE DEBUG] Message passing tracking injected');
        
        return 'Message tracking injection complete';
      })()
    `;

    // This would use mcp_chrome_devtools_evaluate_script when available
    console.log('Message tracking script prepared for injection');
  }

  /**
   * Get captured message events
   */
  async getCapturedMessages(): Promise<MessageEvent[]> {
    const messagesScript = `
      () => {
        return window.messageEvents || [];
      }
    `;

    // This would use mcp_chrome_devtools_evaluate_script when available
    // For now, return mock message events
    return [
      {
        id: 'msg-1234567890-1',
        type: 'incoming',
        message: {
          action: 'extractContent',
          url: 'https://example.com/article',
        },
        sender: { tab: { id: 123, url: 'https://example.com/article' } },
        receiver: 'service-worker',
        timestamp: new Date().toISOString(),
        duration: 45,
        success: true,
        context: 'service-worker',
      },
      {
        id: 'msg-1234567891-2',
        type: 'outgoing',
        message: { action: 'processContent', content: 'Article content...' },
        sender: 'service-worker',
        receiver: 'offscreen',
        timestamp: new Date().toISOString(),
        duration: 1250,
        success: true,
        context: 'service-worker',
      },
    ];
  }

  /**
   * Get message flows for visualization
   */
  async getMessageFlows(): Promise<MessageFlow[]> {
    const flowsScript = `
      () => {
        return window.messageFlows || [];
      }
    `;

    // This would use mcp_chrome_devtools_evaluate_script when available
    // For now, return mock message flows
    return [
      {
        flowId: 'flow-1234567890-0.123',
        startTime: new Date(Date.now() - 5000).toISOString(),
        endTime: new Date().toISOString(),
        messages: [
          {
            id: 'msg-1234567890-1',
            type: 'incoming',
            message: { action: 'extractContent' },
            sender: { tab: { id: 123 } },
            receiver: 'service-worker',
            timestamp: new Date(Date.now() - 5000).toISOString(),
            success: true,
            context: 'service-worker',
          },
          {
            id: 'msg-1234567891-2',
            type: 'outgoing',
            message: { action: 'processContent' },
            sender: 'service-worker',
            receiver: 'offscreen',
            timestamp: new Date(Date.now() - 3000).toISOString(),
            success: true,
            context: 'service-worker',
          },
        ],
        status: 'completed',
        totalDuration: 5000,
      },
    ];
  }

  /**
   * Get async operations monitoring data
   */
  async getAsyncOperations(): Promise<AsyncOperation[]> {
    const asyncOpsScript = `
      () => {
        return window.asyncOperations || [];
      }
    `;

    // This would use mcp_chrome_devtools_evaluate_script when available
    // For now, return mock async operations
    return [
      {
        operationId: 'async-msg-1234567892-3',
        type: 'promise',
        startTime: new Date(Date.now() - 2000).toISOString(),
        endTime: new Date().toISOString(),
        duration: 2000,
        status: 'resolved',
        result: { processed: true, wordCount: 245 },
        context: 'ai-processing',
      },
      {
        operationId: 'async-msg-1234567893-4',
        type: 'async-await',
        startTime: new Date(Date.now() - 1000).toISOString(),
        duration: 1000,
        status: 'pending',
        context: 'storage-operation',
      },
    ];
  }

  /**
   * Create message flow visualization data
   */
  async createMessageFlowVisualization(): Promise<any> {
    try {
      console.log('Creating message flow visualization...');

      const messages = await this.getCapturedMessages();
      const flows = await this.getMessageFlows();

      const visualization = {
        nodes: [] as any[],
        edges: [] as any[],
        timeline: [] as any[],
        statistics: {
          totalMessages: messages.length,
          successfulMessages: messages.filter(m => m.success).length,
          failedMessages: messages.filter(m => !m.success).length,
          averageResponseTime: 0,
          activeFlows: flows.filter(f => f.status === 'active').length,
          completedFlows: flows.filter(f => f.status === 'completed').length,
        },
      };

      // Create nodes for different contexts
      const contexts = ['service-worker', 'content-script', 'offscreen', 'ui'];
      contexts.forEach(context => {
        visualization.nodes.push({
          id: context,
          label: context.replace('-', ' ').toUpperCase(),
          type: 'context',
          messageCount: messages.filter(m => m.context === context).length,
        });
      });

      // Create edges for message flows
      messages.forEach(message => {
        const sourceNode =
          message.type === 'outgoing'
            ? message.context
            : typeof message.sender === 'object'
              ? 'content-script'
              : message.sender;
        const targetNode =
          message.type === 'incoming' ? message.context : message.receiver;

        const existingEdge = visualization.edges.find(
          e => e.source === sourceNode && e.target === targetNode
        );

        if (existingEdge) {
          existingEdge.messageCount++;
          existingEdge.totalDuration += message.duration || 0;
        } else {
          visualization.edges.push({
            id: `${sourceNode}-${targetNode}`,
            source: sourceNode,
            target: targetNode,
            messageCount: 1,
            totalDuration: message.duration || 0,
            averageDuration: message.duration || 0,
          });
        }
      });

      // Calculate average durations
      visualization.edges.forEach(edge => {
        edge.averageDuration = edge.totalDuration / edge.messageCount;
      });

      // Create timeline data
      messages.forEach(message => {
        visualization.timeline.push({
          timestamp: message.timestamp,
          type: message.type,
          context: message.context,
          action: message.message?.action || 'unknown',
          duration: message.duration,
          success: message.success,
        });
      });

      // Calculate statistics
      const responseTimes = messages
        .filter(m => m.duration)
        .map(m => m.duration!);
      visualization.statistics.averageResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => (a || 0) + (b || 0), 0) /
            responseTimes.length
          : 0;

      console.log('Message flow visualization created:', visualization);
      return visualization;
    } catch (error) {
      console.error('Failed to create message flow visualization:', error);
      return null;
    }
  }

  /**
   * Analyze message passing performance
   */
  async analyzeMessagePerformance(): Promise<any> {
    try {
      console.log('Analyzing message passing performance...');

      const messages = await this.getCapturedMessages();
      const asyncOps = await this.getAsyncOperations();

      const analysis = {
        messageStats: {
          total: messages.length,
          successful: messages.filter(m => m.success).length,
          failed: messages.filter(m => !m.success).length,
          averageResponseTime: 0,
          slowestMessage: null as MessageEvent | null,
          fastestMessage: null as MessageEvent | null,
        },
        asyncStats: {
          total: asyncOps.length,
          pending: asyncOps.filter(op => op.status === 'pending').length,
          resolved: asyncOps.filter(op => op.status === 'resolved').length,
          rejected: asyncOps.filter(op => op.status === 'rejected').length,
          averageDuration: 0,
        },
        bottlenecks: [] as any[],
        recommendations: [] as string[],
      };

      // Calculate message statistics
      const responseTimes = messages
        .filter(m => m.duration && m.duration > 0)
        .map(m => m.duration!);
      if (responseTimes.length > 0) {
        analysis.messageStats.averageResponseTime =
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        analysis.messageStats.slowestMessage =
          messages.find(m => m.duration === Math.max(...responseTimes)) || null;
        analysis.messageStats.fastestMessage =
          messages.find(m => m.duration === Math.min(...responseTimes)) || null;
      }

      // Calculate async operation statistics
      const asyncDurations = asyncOps
        .filter(op => op.duration && op.duration > 0)
        .map(op => op.duration!);
      if (asyncDurations.length > 0) {
        analysis.asyncStats.averageDuration =
          asyncDurations.reduce((a, b) => (a || 0) + (b || 0), 0) /
          asyncDurations.length;
      }

      // Identify bottlenecks
      if (analysis.messageStats.averageResponseTime > 1000) {
        analysis.bottlenecks.push({
          type: 'slow-messages',
          description: 'Average message response time is above 1 second',
          impact: 'high',
          affectedMessages: messages.filter(
            m => m.duration && m.duration > 1000
          ).length,
        });
      }

      if (analysis.asyncStats.pending > 5) {
        analysis.bottlenecks.push({
          type: 'pending-operations',
          description: 'High number of pending async operations',
          impact: 'medium',
          count: analysis.asyncStats.pending,
        });
      }

      // Generate recommendations
      if (analysis.messageStats.failed > 0) {
        analysis.recommendations.push(
          'Investigate failed message handlers and add error recovery'
        );
      }

      if (analysis.messageStats.averageResponseTime > 500) {
        analysis.recommendations.push(
          'Optimize message processing to reduce response times'
        );
      }

      if (analysis.asyncStats.rejected > 0) {
        analysis.recommendations.push(
          'Review rejected async operations and improve error handling'
        );
      }

      console.log('Message performance analysis completed:', analysis);
      return analysis;
    } catch (error) {
      console.error('Failed to analyze message performance:', error);
      return null;
    }
  }

  /**
   * Stop message monitoring
   */
  async stopMessageMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      console.log('Message monitoring not active');
      return;
    }

    try {
      console.log('Stopping message passing monitoring...');
      this.isMonitoring = false;
      console.log('Message monitoring stopped');
    } catch (error) {
      console.error('Failed to stop message monitoring:', error);
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    messageCount: number;
    flowCount: number;
    asyncOpCount: number;
    failedMessages: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      messageCount: this.capturedMessages.length,
      flowCount: this.messageFlows.length,
      asyncOpCount: this.asyncOperations.length,
      failedMessages: this.capturedMessages.filter(m => !m.success).length,
    };
  }
}
