/**
 * Offscreen Document Manager - Manages offscreen documents for AI processing
 * Implements Requirements: 10.5, 10.6
 */
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
export declare class OffscreenDocumentManager {
    private static instance;
    private activeDocument;
    private pendingTasks;
    private messageListener;
    private readonly TASK_TIMEOUT;
    private readonly MAX_CONCURRENT_TASKS;
    private creationLock;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): OffscreenDocumentManager;
    /**
     * Create offscreen document for AI processing
     * Uses lock to prevent race conditions and checks Chrome's actual state
     */
    createDocument(config?: Partial<OffscreenDocumentConfig>): Promise<string>;
    /**
     * Internal method to actually create the offscreen document
     */
    private _createDocumentInternal;
    /**
     * Close offscreen document
     */
    closeDocument(): Promise<void>;
    /**
     * Execute task in offscreen document
     */
    executeTask<T>(type: OffscreenTask['type'], data: any, timeout?: number): Promise<T>;
    /**
     * Check if offscreen document is active
     */
    isDocumentActive(): boolean;
    /**
     * Get number of pending tasks
     */
    getPendingTaskCount(): number;
    /**
     * Cancel all pending tasks
     */
    cancelAllTasks(): void;
    /**
     * Destroy offscreen manager
     */
    destroy(): Promise<void>;
    /**
     * Setup message listener for offscreen communication
     */
    private setupMessageListener;
    /**
     * Handle task result from offscreen document
     */
    private handleTaskResult;
    /**
     * Cancel a specific task
     */
    private cancelTask;
}
/**
 * Get offscreen document manager instance
 */
export declare function getOffscreenManager(): OffscreenDocumentManager;
/**
 * Execute AI processing task in offscreen document
 */
export declare function executeOffscreenAITask<T>(taskType: 'language_detection' | 'summarization' | 'translation' | 'vocabulary_analysis', data: any, timeout?: number): Promise<T>;
/**
 * Execute content extraction task in offscreen document
 */
export declare function executeOffscreenExtractionTask<T>(data: unknown, timeout?: number): Promise<T>;
/**
 * Check if offscreen processing is available
 */
export declare function isOffscreenAvailable(): boolean;
/**
 * Initialize offscreen document management
 */
export declare function initializeOffscreenManagement(): Promise<void>;
/**
 * Shutdown offscreen document management
 */
export declare function shutdownOffscreenManagement(): Promise<void>;
//# sourceMappingURL=offscreen-manager.d.ts.map