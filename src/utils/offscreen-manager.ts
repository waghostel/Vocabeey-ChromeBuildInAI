/**
 * Offscreen Document Manager - Manages offscreen documents for AI processing
 * Implements Requirements: 10.5, 10.6
 */

import { getMemoryManager } from './memory-manager';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface OffscreenDocumentConfig {
  url: string;
  reasons: chrome.offscreen.Reason[];
  justification: string;
}

export interface OffscreenTask {
  id: string;
  type: 'ai_processing' | 'content_extraction' | 'translation';
  data: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timeout?: number;
}

// ============================================================================
// Offscreen Document Manager
// ============================================================================

export class OffscreenDocumentManager {
  private static instance: OffscreenDocumentManager | null = null;
  private activeDocument: string | null = null;
  private pendingTasks = new Map<string, OffscreenTask>();
  private messageListener:
    | ((message: any, sender: any, sendResponse: any) => void)
    | null = null;
  private readonly TASK_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_CONCURRENT_TASKS = 5;

  private constructor() {
    this.setupMessageListener();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): OffscreenDocumentManager {
    if (!OffscreenDocumentManager.instance) {
      OffscreenDocumentManager.instance = new OffscreenDocumentManager();
    }
    return OffscreenDocumentManager.instance;
  }

  /**
   * Create offscreen document for AI processing
   */
  async createDocument(
    config?: Partial<OffscreenDocumentConfig>
  ): Promise<string> {
    // Check if document already exists
    if (this.activeDocument) {
      return this.activeDocument;
    }

    const documentConfig: OffscreenDocumentConfig = {
      url: chrome.runtime.getURL('dist/offscreen/ai-processor.html'),
      reasons: [
        chrome.offscreen.Reason.DOM_PARSER,
        chrome.offscreen.Reason.USER_MEDIA,
      ],
      justification: 'Process AI tasks and handle heavy computations',
      ...config,
    };

    try {
      // Check if offscreen API is available
      if (!chrome.offscreen) {
        throw new Error('Offscreen API not available');
      }

      // Create the offscreen document
      await chrome.offscreen.createDocument(documentConfig);

      const documentId = `offscreen_${Date.now()}`;
      this.activeDocument = documentId;

      // Register with memory manager
      const memoryManager = getMemoryManager();
      memoryManager.registerOffscreenDocument(documentId);

      console.log(`Created offscreen document: ${documentId}`);
      return documentId;
    } catch (error) {
      console.error('Failed to create offscreen document:', error);
      throw error;
    }
  }

  /**
   * Close offscreen document
   */
  async closeDocument(): Promise<void> {
    if (!this.activeDocument) {
      return;
    }

    try {
      // Cancel all pending tasks
      this.cancelAllTasks();

      // Close the document
      await chrome.offscreen.closeDocument();

      // Unregister from memory manager
      const memoryManager = getMemoryManager();
      await memoryManager.unregisterOffscreenDocument(this.activeDocument);

      console.log(`Closed offscreen document: ${this.activeDocument}`);
      this.activeDocument = null;
    } catch (error) {
      console.error('Failed to close offscreen document:', error);
      this.activeDocument = null; // Reset state even if close failed
    }
  }

  /**
   * Execute task in offscreen document
   */
  async executeTask<T>(
    type: OffscreenTask['type'],
    data: any,
    timeout?: number
  ): Promise<T> {
    // Check if we have too many concurrent tasks
    if (this.pendingTasks.size >= this.MAX_CONCURRENT_TASKS) {
      throw new Error('Too many concurrent offscreen tasks');
    }

    // Ensure document exists
    if (!this.activeDocument) {
      await this.createDocument();
    }

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return new Promise<T>((resolve, reject) => {
      const task: OffscreenTask = {
        id: taskId,
        type,
        data,
        resolve,
        reject,
        timeout: timeout || this.TASK_TIMEOUT,
      };

      // Store task
      this.pendingTasks.set(taskId, task);

      // Set timeout
      const timeoutId = setTimeout(() => {
        this.cancelTask(taskId, new Error('Task timeout'));
      }, task.timeout);

      // Update task with timeout ID for cleanup
      task.data = { ...task.data, _timeoutId: timeoutId };

      // Send message to offscreen document
      chrome.runtime
        .sendMessage({
          type: 'OFFSCREEN_TASK',
          taskId,
          taskType: type,
          data,
        })
        .catch(error => {
          this.cancelTask(taskId, error);
        });
    });
  }

  /**
   * Check if offscreen document is active
   */
  isDocumentActive(): boolean {
    return this.activeDocument !== null;
  }

  /**
   * Get number of pending tasks
   */
  getPendingTaskCount(): number {
    return this.pendingTasks.size;
  }

  /**
   * Cancel all pending tasks
   */
  cancelAllTasks(): void {
    const tasks = Array.from(this.pendingTasks.values());

    for (const task of tasks) {
      this.cancelTask(task.id, new Error('Document closing'));
    }
  }

  /**
   * Destroy offscreen manager
   */
  async destroy(): Promise<void> {
    // Remove message listener
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
      this.messageListener = null;
    }

    // Close document
    await this.closeDocument();

    // Clear instance
    OffscreenDocumentManager.instance = null;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Setup message listener for offscreen communication
   */
  private setupMessageListener(): void {
    this.messageListener = (message, _sender, _sendResponse) => {
      if (message.type === 'OFFSCREEN_TASK_RESULT') {
        this.handleTaskResult(message.taskId, message.result, message.error);
        return true;
      }

      if (message.type === 'OFFSCREEN_READY') {
        console.log('Offscreen document ready');
        return true;
      }

      return false;
    };

    chrome.runtime.onMessage.addListener(this.messageListener);
  }

  /**
   * Handle task result from offscreen document
   */
  private handleTaskResult(taskId: string, result: any, error: any): void {
    const task = this.pendingTasks.get(taskId);
    if (!task) {
      console.warn(`Received result for unknown task: ${taskId}`);
      return;
    }

    // Clear timeout
    if (task.data._timeoutId) {
      clearTimeout(task.data._timeoutId);
    }

    // Remove task
    this.pendingTasks.delete(taskId);

    // Resolve or reject
    if (error) {
      task.reject(new Error(error));
    } else {
      task.resolve(result);
    }
  }

  /**
   * Cancel a specific task
   */
  private cancelTask(taskId: string, error: Error): void {
    const task = this.pendingTasks.get(taskId);
    if (!task) {
      return;
    }

    // Clear timeout
    if (task.data._timeoutId) {
      clearTimeout(task.data._timeoutId);
    }

    // Remove task
    this.pendingTasks.delete(taskId);

    // Reject with error (but catch any unhandled rejections)
    try {
      task.reject(error);
    } catch (rejectionError) {
      console.warn('Task rejection error:', rejectionError);
    }
  }
}

// ============================================================================
// Singleton Access and Utilities
// ============================================================================

/**
 * Get offscreen document manager instance
 */
export function getOffscreenManager(): OffscreenDocumentManager {
  return OffscreenDocumentManager.getInstance();
}

/**
 * Execute AI processing task in offscreen document
 */
export async function executeOffscreenAITask<T>(
  taskType:
    | 'language_detection'
    | 'summarization'
    | 'translation'
    | 'vocabulary_analysis',
  data: any,
  timeout?: number
): Promise<T> {
  const manager = getOffscreenManager();
  return await manager.executeTask<T>(
    'ai_processing',
    { taskType, ...data },
    timeout
  );
}

/**
 * Execute content extraction task in offscreen document
 */
export async function executeOffscreenExtractionTask<T>(
  data: unknown,
  timeout?: number
): Promise<T> {
  const manager = getOffscreenManager();
  return await manager.executeTask<T>('content_extraction', data, timeout);
}

/**
 * Check if offscreen processing is available
 */
export function isOffscreenAvailable(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    'offscreen' in chrome &&
    typeof chrome.offscreen.createDocument === 'function'
  );
}

/**
 * Initialize offscreen document management
 */
export async function initializeOffscreenManagement(): Promise<void> {
  if (!isOffscreenAvailable()) {
    console.warn('Offscreen API not available');
    return;
  }

  const manager = getOffscreenManager();

  // Pre-create document for faster task execution
  try {
    await manager.createDocument();
    console.log('Offscreen management initialized');
  } catch (error) {
    console.error('Failed to initialize offscreen management:', error);
  }
}

/**
 * Shutdown offscreen document management
 */
export async function shutdownOffscreenManagement(): Promise<void> {
  const manager = getOffscreenManager();
  await manager.destroy();
  console.log('Offscreen management shutdown');
}
