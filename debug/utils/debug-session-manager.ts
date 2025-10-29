/**
 * Debug Session Manager
 * Manages debugging sessions with initialization, cleanup, and context switching
 */

import {
  DebugSessionState,
  ExtensionContext,
  CapturedDebugData,
  DebugSessionConfig,
  ConsoleMessage,
  NetworkRequest,
  PerformanceMetric,
  ErrorLog,
  StorageOperation,
  MemorySnapshot,
} from '../types/debug-types.js';

export class DebugSessionManager {
  private activeSessions: Map<string, DebugSessionState> = new Map();
  private currentSessionId: string | null = null;
  private sessionStorage: Map<string, DebugSessionState> = new Map();

  /**
   * Initialize a new debugging session
   */
  async initializeDebugSession(
    config?: Partial<DebugSessionConfig>
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    const defaultConfig: DebugSessionConfig = {
      timeout: 300000, // 5 minutes
      maxRetries: 3,
      captureConsole: true,
      captureNetwork: true,
      capturePerformance: true,
      captureStorage: true,
      captureMemory: true,
      contexts: ['service-worker', 'content-script', 'offscreen', 'ui'],
      ...config,
    };

    const sessionState: DebugSessionState = {
      sessionId,
      startTime: new Date(),
      status: 'active',
      activeContexts: [],
      capturedData: this.initializeCapturedData(),
      testResults: [],
      configuration: defaultConfig,
    };

    this.activeSessions.set(sessionId, sessionState);
    this.currentSessionId = sessionId;

    // Initialize contexts based on configuration
    await this.initializeContexts(sessionState);

    console.log(`Debug session ${sessionId} initialized`);
    return sessionId;
  }

  /**
   * Get current active session
   */
  getCurrentSession(): DebugSessionState | null {
    if (!this.currentSessionId) return null;
    return this.activeSessions.get(this.currentSessionId) || null;
  }

  /**
   * Switch to a different debugging context
   */
  async switchContext(
    contextType: ExtensionContext['type'],
    url?: string
  ): Promise<boolean> {
    const session = this.getCurrentSession();
    if (!session) {
      throw new Error('No active debug session');
    }

    try {
      // Find existing context or create new one
      let context = session.activeContexts.find(
        ctx => ctx.type === contextType
      );

      if (!context) {
        context = await this.createContext(contextType, url);
        session.activeContexts.push(context);
      }

      // Update context activity
      context.lastActivity = new Date();
      context.isActive = true;

      // Deactivate other contexts
      session.activeContexts.forEach(ctx => {
        if (ctx !== context) {
          ctx.isActive = false;
        }
      });

      console.log(`Switched to ${contextType} context`);
      return true;
    } catch (error) {
      console.error(`Failed to switch to ${contextType} context:`, error);
      return false;
    }
  }

  /**
   * Capture debug data for current session
   */
  async captureDebugData(): Promise<void> {
    const session = this.getCurrentSession();
    if (!session) return;

    const activeContext = session.activeContexts.find(ctx => ctx.isActive);
    if (!activeContext) return;

    try {
      if (session.configuration.captureConsole) {
        await this.captureConsoleMessages(session, activeContext);
      }

      if (session.configuration.captureNetwork) {
        await this.captureNetworkRequests(session, activeContext);
      }

      if (session.configuration.capturePerformance) {
        await this.capturePerformanceMetrics(session, activeContext);
      }

      if (session.configuration.captureStorage) {
        await this.captureStorageOperations(session, activeContext);
      }

      if (session.configuration.captureMemory) {
        await this.captureMemorySnapshot(session, activeContext);
      }
    } catch (error) {
      console.error('Failed to capture debug data:', error);
      this.logError(
        session,
        'error',
        `Debug data capture failed: ${error.message}`
      );
    }
  }

  /**
   * Cleanup debugging session
   */
  async cleanupSession(sessionId?: string): Promise<void> {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) return;

    const session = this.activeSessions.get(targetSessionId);
    if (!session) return;

    try {
      // Mark session as completed
      session.status = 'completed';
      session.endTime = new Date();

      // Cleanup contexts
      await this.cleanupContexts(session);

      // Persist session data
      await this.persistSessionState(session);

      // Remove from active sessions
      this.activeSessions.delete(targetSessionId);

      // Update current session if this was the active one
      if (this.currentSessionId === targetSessionId) {
        this.currentSessionId = null;
      }

      console.log(`Debug session ${targetSessionId} cleaned up`);
    } catch (error) {
      console.error(`Failed to cleanup session ${targetSessionId}:`, error);
      session.status = 'failed';
    }
  }

  /**
   * Get session state for persistence or analysis
   */
  getSessionState(sessionId?: string): DebugSessionState | null {
    const targetSessionId = sessionId || this.currentSessionId;
    if (!targetSessionId) return null;

    return (
      this.activeSessions.get(targetSessionId) ||
      this.sessionStorage.get(targetSessionId) ||
      null
    );
  }

  /**
   * List all sessions (active and stored)
   */
  listSessions(): { active: string[]; stored: string[] } {
    return {
      active: Array.from(this.activeSessions.keys()),
      stored: Array.from(this.sessionStorage.keys()),
    };
  }

  /**
   * Restore session from storage
   */
  async restoreSession(sessionId: string): Promise<boolean> {
    const storedSession = this.sessionStorage.get(sessionId);
    if (!storedSession) return false;

    try {
      // Restore as active session
      this.activeSessions.set(sessionId, storedSession);
      this.currentSessionId = sessionId;
      storedSession.status = 'active';

      // Re-initialize contexts if needed
      await this.initializeContexts(storedSession);

      console.log(`Session ${sessionId} restored`);
      return true;
    } catch (error) {
      console.error(`Failed to restore session ${sessionId}:`, error);
      return false;
    }
  }

  // Private helper methods

  private generateSessionId(): string {
    return `debug-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeCapturedData(): CapturedDebugData {
    return {
      consoleMessages: [],
      networkRequests: [],
      performanceMetrics: [],
      errorLogs: [],
      storageOperations: [],
      memorySnapshots: [],
    };
  }

  private async initializeContexts(session: DebugSessionState): Promise<void> {
    for (const contextType of session.configuration.contexts) {
      try {
        const context = await this.createContext(
          contextType as ExtensionContext['type']
        );
        session.activeContexts.push(context);
      } catch (error) {
        console.warn(`Failed to initialize ${contextType} context:`, error);
      }
    }
  }

  private async createContext(
    type: ExtensionContext['type'],
    url?: string
  ): Promise<ExtensionContext> {
    // This would integrate with chrome-devtools MCP to create actual contexts
    // For now, creating a mock context structure
    return {
      type,
      pageIndex: Math.floor(Math.random() * 1000), // Would be actual page index from MCP
      url,
      isActive: false,
      lastActivity: new Date(),
      metadata: {
        created: new Date(),
        contextType: type,
      },
    };
  }

  private async captureConsoleMessages(
    session: DebugSessionState,
    context: ExtensionContext
  ): Promise<void> {
    // This would use chrome-devtools MCP to capture actual console messages
    // For now, creating a placeholder structure
    const message: ConsoleMessage = {
      id: Date.now(),
      timestamp: new Date(),
      level: 'info',
      message: `Debug capture from ${context.type} context`,
      source: context.type,
      context: context.type,
    };

    session.capturedData.consoleMessages.push(message);
  }

  private async captureNetworkRequests(
    session: DebugSessionState,
    context: ExtensionContext
  ): Promise<void> {
    // Placeholder for network request capture
    const request: NetworkRequest = {
      id: Date.now(),
      timestamp: new Date(),
      method: 'GET',
      url: context.url || 'unknown',
      status: 200,
      responseTime: Math.random() * 1000,
      requestSize: 0,
      responseSize: 0,
      context: context.type,
    };

    session.capturedData.networkRequests.push(request);
  }

  private async capturePerformanceMetrics(
    session: DebugSessionState,
    context: ExtensionContext
  ): Promise<void> {
    const metric: PerformanceMetric = {
      timestamp: new Date(),
      name: 'context_performance',
      value: Math.random() * 100,
      unit: 'ms',
      context: context.type,
      metadata: {
        pageIndex: context.pageIndex,
      },
    };

    session.capturedData.performanceMetrics.push(metric);
  }

  private async captureStorageOperations(
    session: DebugSessionState,
    context: ExtensionContext
  ): Promise<void> {
    const operation: StorageOperation = {
      timestamp: new Date(),
      operation: 'get',
      key: 'debug_data',
      success: true,
      duration: Math.random() * 10,
    };

    session.capturedData.storageOperations.push(operation);
  }

  private async captureMemorySnapshot(
    session: DebugSessionState,
    context: ExtensionContext
  ): Promise<void> {
    const snapshot: MemorySnapshot = {
      timestamp: new Date(),
      totalJSHeapSize: Math.random() * 100000000,
      usedJSHeapSize: Math.random() * 50000000,
      jsHeapSizeLimit: 100000000,
      context: context.type,
    };

    session.capturedData.memorySnapshots.push(snapshot);
  }

  private async cleanupContexts(session: DebugSessionState): Promise<void> {
    for (const context of session.activeContexts) {
      try {
        // Cleanup context-specific resources
        context.isActive = false;
        console.log(`Cleaned up ${context.type} context`);
      } catch (error) {
        console.warn(`Failed to cleanup ${context.type} context:`, error);
      }
    }
  }

  private async persistSessionState(session: DebugSessionState): Promise<void> {
    try {
      // Store session in memory storage (could be extended to use chrome.storage)
      this.sessionStorage.set(session.sessionId, { ...session });
      console.log(`Session ${session.sessionId} persisted`);
    } catch (error) {
      console.error(`Failed to persist session ${session.sessionId}:`, error);
    }
  }

  private logError(
    session: DebugSessionState,
    level: ErrorLog['level'],
    message: string,
    stack?: string
  ): void {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      level,
      message,
      stack,
      context: 'session-manager',
    };

    session.capturedData.errorLogs.push(errorLog);
  }
}

// Export singleton instance
export const debugSessionManager = new DebugSessionManager();
