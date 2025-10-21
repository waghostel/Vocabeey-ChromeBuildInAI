/**
 * Progress Indication System
 * Creates progress bars for AI model downloads
 * Implements streaming progress for article processing
 * Adds loading states for all async operations
 */

// ============================================================================
// Progress Types and Interfaces
// ============================================================================

export type ProgressType =
  | 'model_download'
  | 'article_processing'
  | 'content_extraction'
  | 'translation'
  | 'vocabulary_analysis'
  | 'storage_operation';

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

// ============================================================================
// Progress Tracker Class
// ============================================================================

export class ProgressTracker {
  private progressState: ProgressState;
  private callbacks: ProgressCallback[] = [];
  private updateInterval: number | null = null;

  constructor(type: ProgressType, total: number, message: string = '') {
    this.progressState = {
      type,
      current: 0,
      total,
      percentage: 0,
      message,
      status: 'pending',
      startTime: new Date(),
    };
  }

  /**
   * Start progress tracking
   */
  start(message?: string): void {
    this.progressState.status = 'in_progress';
    this.progressState.startTime = new Date();
    if (message) {
      this.progressState.message = message;
    }
    this.notifyCallbacks();
  }

  /**
   * Update progress
   */
  update(current: number, message?: string): void {
    this.progressState.current = Math.min(current, this.progressState.total);
    this.progressState.percentage = this.calculatePercentage();
    this.progressState.estimatedTimeRemaining = this.calculateETA();

    if (message) {
      this.progressState.message = message;
    }

    this.notifyCallbacks();

    // Auto-complete if reached total
    if (this.progressState.current >= this.progressState.total) {
      this.complete();
    }
  }

  /**
   * Increment progress by amount
   */
  increment(amount: number = 1, message?: string): void {
    this.update(this.progressState.current + amount, message);
  }

  /**
   * Complete progress
   */
  complete(message?: string): void {
    this.progressState.current = this.progressState.total;
    this.progressState.percentage = 100;
    this.progressState.status = 'completed';

    if (message) {
      this.progressState.message = message;
    }

    this.notifyCallbacks();
    this.cleanup();
  }

  /**
   * Mark progress as failed
   */
  fail(message: string): void {
    this.progressState.status = 'failed';
    this.progressState.message = message;
    this.notifyCallbacks();
    this.cleanup();
  }

  /**
   * Add progress callback
   */
  onProgress(callback: ProgressCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Remove progress callback
   */
  offProgress(callback: ProgressCallback): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  /**
   * Get current progress state
   */
  getState(): ProgressState {
    return { ...this.progressState };
  }

  /**
   * Calculate percentage
   */
  private calculatePercentage(): number {
    if (this.progressState.total === 0) return 0;
    return Math.round(
      (this.progressState.current / this.progressState.total) * 100
    );
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateETA(): number | undefined {
    if (this.progressState.current === 0) return undefined;

    const elapsed = Date.now() - this.progressState.startTime.getTime();
    const rate = this.progressState.current / elapsed;
    const remaining = this.progressState.total - this.progressState.current;

    return Math.round(remaining / rate);
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(): void {
    const state = this.getState();
    this.callbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// ============================================================================
// Model Download Progress Tracker
// ============================================================================

export class ModelDownloadTracker extends ProgressTracker {
  constructor(modelName: string, totalSize: number) {
    super('model_download', totalSize, `Downloading ${modelName}...`);
  }

  /**
   * Update download progress with bytes downloaded
   */
  updateDownload(bytesDownloaded: number): void {
    const message = `Downloading... ${this.formatBytes(bytesDownloaded)} / ${this.formatBytes(this.getState().total)}`;
    this.update(bytesDownloaded, message);
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// ============================================================================
// Article Processing Progress Tracker
// ============================================================================

export class ArticleProcessingTracker extends ProgressTracker {
  constructor(totalParts: number) {
    super('article_processing', totalParts * 100, 'Processing article...');
  }

  /**
   * Update processing step
   */
  updateStep(partIndex: number, step: string, progress: number = 0): void {
    const baseProgress = partIndex * 100;
    const message = `Part ${partIndex + 1}: ${step}`;
    this.update(baseProgress + progress, message);
  }

  /**
   * Complete part processing
   */
  completePart(partIndex: number): void {
    const progress = (partIndex + 1) * 100;
    this.update(progress, `Part ${partIndex + 1} completed`);
  }

  /**
   * Stream word-by-word progress
   */
  streamWords(
    partIndex: number,
    currentWord: number,
    totalWords: number
  ): void {
    const wordProgress = Math.round((currentWord / totalWords) * 100);
    this.updateStep(partIndex, 'Generating content', wordProgress);
  }
}

// ============================================================================
// Streaming Progress Handler
// ============================================================================

export class StreamingProgressHandler {
  private tracker: ProgressTracker;
  private options: StreamingProgressOptions;

  constructor(
    type: ProgressType,
    total: number,
    message: string,
    options: StreamingProgressOptions = {}
  ) {
    this.tracker = new ProgressTracker(type, total, message);
    this.options = options;

    if (options.onProgress) {
      this.tracker.onProgress(options.onProgress);
    }
  }

  /**
   * Start streaming
   */
  start(): void {
    this.tracker.start();
  }

  /**
   * Update streaming progress
   */
  update(current: number, message?: string): void {
    this.tracker.update(current, message);
  }

  /**
   * Stream text word by word
   */
  async streamText(text: string, delayMs: number = 50): Promise<void> {
    const words = text.split(/\s+/);
    this.tracker.start(`Streaming ${words.length} words...`);

    for (let i = 0; i < words.length; i++) {
      this.tracker.update(i + 1, `Word ${i + 1}/${words.length}`);
      await this.sleep(delayMs);
    }

    this.complete();
  }

  /**
   * Complete streaming
   */
  complete(message?: string): void {
    this.tracker.complete(message);
    if (this.options.onComplete) {
      this.options.onComplete();
    }
  }

  /**
   * Fail streaming
   */
  fail(error: Error): void {
    this.tracker.fail(error.message);
    if (this.options.onError) {
      this.options.onError(error);
    }
  }

  /**
   * Get tracker instance
   */
  getTracker(): ProgressTracker {
    return this.tracker;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Loading State Manager
// ============================================================================

export class LoadingStateManager {
  private loadingStates: Map<string, boolean> = new Map();
  private callbacks: Map<string, ((loading: boolean) => void)[]> = new Map();

  /**
   * Set loading state for operation
   */
  setLoading(operationId: string, loading: boolean): void {
    this.loadingStates.set(operationId, loading);
    this.notifyCallbacks(operationId, loading);
  }

  /**
   * Check if operation is loading
   */
  isLoading(operationId: string): boolean {
    return this.loadingStates.get(operationId) ?? false;
  }

  /**
   * Check if any operation is loading
   */
  isAnyLoading(): boolean {
    return Array.from(this.loadingStates.values()).some(loading => loading);
  }

  /**
   * Subscribe to loading state changes
   */
  onLoadingChange(
    operationId: string,
    callback: (loading: boolean) => void
  ): void {
    if (!this.callbacks.has(operationId)) {
      this.callbacks.set(operationId, []);
    }
    this.callbacks.get(operationId)!.push(callback);
  }

  /**
   * Unsubscribe from loading state changes
   */
  offLoadingChange(
    operationId: string,
    callback: (loading: boolean) => void
  ): void {
    const callbacks = this.callbacks.get(operationId);
    if (callbacks) {
      this.callbacks.set(
        operationId,
        callbacks.filter(cb => cb !== callback)
      );
    }
  }

  /**
   * Clear loading state
   */
  clear(operationId: string): void {
    this.loadingStates.delete(operationId);
    this.callbacks.delete(operationId);
  }

  /**
   * Clear all loading states
   */
  clearAll(): void {
    this.loadingStates.clear();
    this.callbacks.clear();
  }

  /**
   * Notify callbacks
   */
  private notifyCallbacks(operationId: string, loading: boolean): void {
    const callbacks = this.callbacks.get(operationId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(loading);
        } catch (error) {
          console.error('Loading state callback error:', error);
        }
      });
    }
  }

  /**
   * Wrap async operation with loading state
   */
  async withLoading<T>(
    operationId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    this.setLoading(operationId, true);
    try {
      return await operation();
    } finally {
      this.setLoading(operationId, false);
    }
  }
}

// ============================================================================
// Progress UI Builder
// ============================================================================

export class ProgressUIBuilder {
  /**
   * Create progress bar HTML
   */
  createProgressBar(state: ProgressState): string {
    const statusClass = `progress-${state.status}`;
    const eta = state.estimatedTimeRemaining
      ? this.formatTime(state.estimatedTimeRemaining)
      : '';

    return `
      <div class="progress-container ${statusClass}">
        <div class="progress-header">
          <span class="progress-message">${state.message}</span>
          <span class="progress-percentage">${state.percentage}%</span>
        </div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar" style="width: ${state.percentage}%"></div>
        </div>
        ${eta ? `<div class="progress-eta">Estimated time remaining: ${eta}</div>` : ''}
      </div>
    `;
  }

  /**
   * Create loading spinner HTML
   */
  createLoadingSpinner(message: string = 'Loading...'): string {
    return `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <span class="loading-message">${message}</span>
      </div>
    `;
  }

  /**
   * Create streaming text display
   */
  createStreamingDisplay(text: string, isComplete: boolean = false): string {
    const cursor = isComplete ? '' : '<span class="streaming-cursor">|</span>';
    return `
      <div class="streaming-text">
        ${text}${cursor}
      </div>
    `;
  }

  /**
   * Format time in milliseconds to human-readable string
   */
  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// ============================================================================
// Global Instances
// ============================================================================

export const globalLoadingManager = new LoadingStateManager();
export const progressUIBuilder = new ProgressUIBuilder();
