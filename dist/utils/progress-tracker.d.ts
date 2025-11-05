/**
 * Progress Indication System
 * Creates progress bars for AI model downloads
 * Implements streaming progress for article processing
 * Adds loading states for all async operations
 */
export type ProgressType = 'model_download' | 'article_processing' | 'content_extraction' | 'translation' | 'vocabulary_analysis' | 'storage_operation';
export interface ProgressState {
    type: ProgressType;
    current: number;
    total: number;
    percentage: number;
    message: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    startTime: Date;
    estimatedTimeRemaining?: number;
}
export interface ProgressCallback {
    (state: ProgressState): void;
}
export interface StreamingProgressOptions {
    onProgress?: ProgressCallback;
    onComplete?: () => void;
    onError?: (error: Error) => void;
}
export declare class ProgressTracker {
    private progressState;
    private callbacks;
    private updateInterval;
    constructor(type: ProgressType, total: number, message?: string);
    /**
     * Start progress tracking
     */
    start(message?: string): void;
    /**
     * Update progress
     */
    update(current: number, message?: string): void;
    /**
     * Increment progress by amount
     */
    increment(amount?: number, message?: string): void;
    /**
     * Complete progress
     */
    complete(message?: string): void;
    /**
     * Mark progress as failed
     */
    fail(message: string): void;
    /**
     * Add progress callback
     */
    onProgress(callback: ProgressCallback): void;
    /**
     * Remove progress callback
     */
    offProgress(callback: ProgressCallback): void;
    /**
     * Get current progress state
     */
    getState(): ProgressState;
    /**
     * Calculate percentage
     */
    private calculatePercentage;
    /**
     * Calculate estimated time remaining
     */
    private calculateETA;
    /**
     * Notify all callbacks
     */
    private notifyCallbacks;
    /**
     * Cleanup resources
     */
    private cleanup;
}
export declare class ModelDownloadTracker extends ProgressTracker {
    constructor(modelName: string, totalSize: number);
    /**
     * Update download progress with bytes downloaded
     */
    updateDownload(bytesDownloaded: number): void;
    /**
     * Format bytes to human-readable string
     */
    private formatBytes;
}
export declare class ArticleProcessingTracker extends ProgressTracker {
    constructor(totalParts: number);
    /**
     * Update processing step
     */
    updateStep(partIndex: number, step: string, progress?: number): void;
    /**
     * Complete part processing
     */
    completePart(partIndex: number): void;
    /**
     * Stream word-by-word progress
     */
    streamWords(partIndex: number, currentWord: number, totalWords: number): void;
}
export declare class StreamingProgressHandler {
    private tracker;
    private options;
    constructor(type: ProgressType, total: number, message: string, options?: StreamingProgressOptions);
    /**
     * Start streaming
     */
    start(): void;
    /**
     * Update streaming progress
     */
    update(current: number, message?: string): void;
    /**
     * Stream text word by word
     */
    streamText(text: string, delayMs?: number): Promise<void>;
    /**
     * Complete streaming
     */
    complete(message?: string): void;
    /**
     * Fail streaming
     */
    fail(error: Error): void;
    /**
     * Get tracker instance
     */
    getTracker(): ProgressTracker;
    /**
     * Sleep utility
     */
    private sleep;
}
export declare class LoadingStateManager {
    private loadingStates;
    private callbacks;
    /**
     * Set loading state for operation
     */
    setLoading(operationId: string, loading: boolean): void;
    /**
     * Check if operation is loading
     */
    isLoading(operationId: string): boolean;
    /**
     * Check if any operation is loading
     */
    isAnyLoading(): boolean;
    /**
     * Subscribe to loading state changes
     */
    onLoadingChange(operationId: string, callback: (loading: boolean) => void): void;
    /**
     * Unsubscribe from loading state changes
     */
    offLoadingChange(operationId: string, callback: (loading: boolean) => void): void;
    /**
     * Clear loading state
     */
    clear(operationId: string): void;
    /**
     * Clear all loading states
     */
    clearAll(): void;
    /**
     * Notify callbacks
     */
    private notifyCallbacks;
    /**
     * Wrap async operation with loading state
     */
    withLoading<T>(operationId: string, operation: () => Promise<T>): Promise<T>;
}
export declare class ProgressUIBuilder {
    /**
     * Create progress bar HTML
     */
    createProgressBar(state: ProgressState): string;
    /**
     * Create loading spinner HTML
     */
    createLoadingSpinner(message?: string): string;
    /**
     * Create streaming text display
     */
    createStreamingDisplay(text: string, isComplete?: boolean): string;
    /**
     * Format time in milliseconds to human-readable string
     */
    private formatTime;
}
export declare const globalLoadingManager: LoadingStateManager;
export declare const progressUIBuilder: ProgressUIBuilder;
//# sourceMappingURL=progress-tracker.d.ts.map