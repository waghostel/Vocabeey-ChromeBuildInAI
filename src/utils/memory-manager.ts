/**
 * Memory Manager - Comprehensive memory management and resource cleanup
 * Implements Requirements: 10.5, 10.6
 */

// Memory manager types and utilities
import { resetChromeAI } from './chrome-ai';
import { getStorageManager } from './storage-manager';

// ============================================================================
// Memory Usage Monitoring
// ============================================================================

export interface MemoryUsage {
  used: number; // bytes
  total: number; // bytes
  percentage: number; // 0-100
  jsHeapSizeLimit?: number;
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
}

export interface ResourceUsage {
  memory: MemoryUsage;
  storage: {
    used: number;
    quota: number;
    percentage: number;
  };
  activeTabs: number;
  aiSessions: number;
  offscreenDocuments: number;
}

// ============================================================================
// Memory Manager Class
// ============================================================================

export class MemoryManager {
  private static instance: MemoryManager | null = null;
  private monitoringInterval: number | null = null;
  private readonly MEMORY_THRESHOLD = 200 * 1024 * 1024; // 200MB (increased to reduce false alarms)
  private readonly MONITORING_INTERVAL = 30000; // 30 seconds
  private readonly activeTabs = new Set<number>();
  private readonly activeOffscreenDocs = new Set<string>();
  private memoryCallbacks: Array<(usage: ResourceUsage) => void> = [];

  private constructor() {
    this.setupTabListeners();
    this.setupMemoryMonitoring();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Register a tab as active learning interface
   */
  registerTab(tabId: number): void {
    this.activeTabs.add(tabId);
    console.log(
      `Registered tab ${tabId}, total active tabs: ${this.activeTabs.size}`
    );
  }

  /**
   * Unregister a tab and cleanup its resources
   */
  async unregisterTab(tabId: number): Promise<void> {
    if (!this.activeTabs.has(tabId)) {
      return;
    }

    this.activeTabs.delete(tabId);
    console.log(
      `Unregistered tab ${tabId}, remaining active tabs: ${this.activeTabs.size}`
    );

    // Cleanup tab-specific resources
    await this.cleanupTabResources(tabId);

    // Check if we should perform global cleanup
    await this.checkMemoryPressure();
  }

  /**
   * Register an offscreen document
   */
  registerOffscreenDocument(documentId: string): void {
    this.activeOffscreenDocs.add(documentId);
    console.log(`Registered offscreen document ${documentId}`);
  }

  /**
   * Unregister and cleanup offscreen document
   */
  async unregisterOffscreenDocument(documentId: string): Promise<void> {
    if (!this.activeOffscreenDocs.has(documentId)) {
      return;
    }

    this.activeOffscreenDocs.delete(documentId);
    console.log(`Unregistered offscreen document ${documentId}`);

    // Close the offscreen document
    try {
      await chrome.offscreen.closeDocument();
    } catch (error) {
      console.warn('Failed to close offscreen document:', error);
    }
  }

  /**
   * Get current resource usage
   */
  async getResourceUsage(): Promise<ResourceUsage> {
    const memory = await this.getMemoryUsage();
    const storage = await this.getStorageUsage();

    return {
      memory,
      storage,
      activeTabs: this.activeTabs.size,
      aiSessions: this.getAISessionCount(),
      offscreenDocuments: this.activeOffscreenDocs.size,
    };
  }

  /**
   * Force cleanup of all resources
   */
  async forceCleanup(): Promise<void> {
    console.log('Forcing comprehensive resource cleanup...');

    // Cleanup AI sessions
    await this.cleanupAISessions();

    // Cleanup offscreen documents
    await this.cleanupOffscreenDocuments();

    // Cleanup storage cache
    await this.cleanupStorageCache();

    // Force garbage collection if available
    this.forceGarbageCollection();

    console.log('Comprehensive cleanup completed');
  }

  /**
   * Check memory pressure and cleanup if needed
   */
  async checkMemoryPressure(): Promise<boolean> {
    const usage = await this.getResourceUsage();

    // Check if memory usage is above threshold
    if (usage.memory.used > this.MEMORY_THRESHOLD) {
      console.warn(
        `Memory usage high: ${(usage.memory.used / 1024 / 1024).toFixed(1)}MB`
      );
      await this.performMemoryCleanup();
      return true;
    }

    // Check if too many resources are active (increased thresholds)
    if (
      usage.activeTabs > 10 ||
      usage.aiSessions > 20 ||
      usage.offscreenDocuments > 3
    ) {
      console.warn('Too many active resources, performing cleanup');
      await this.performResourceCleanup();
      return true;
    }

    return false;
  }

  /**
   * Add memory usage callback
   */
  onMemoryUsageChange(callback: (usage: ResourceUsage) => void): () => void {
    this.memoryCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.memoryCallbacks.indexOf(callback);
      if (index > -1) {
        this.memoryCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(async () => {
      const usage = await this.getResourceUsage();

      // Notify callbacks
      this.memoryCallbacks.forEach(callback => {
        try {
          callback(usage);
        } catch (error) {
          console.error('Memory callback error:', error);
        }
      });

      // Check for cleanup needs
      await this.checkMemoryPressure();
    }, this.MONITORING_INTERVAL) as unknown as number;

    console.log('Memory monitoring started');
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('Memory monitoring stopped');
    }
  }

  /**
   * Destroy memory manager and cleanup all resources
   */
  async destroy(): Promise<void> {
    this.stopMonitoring();
    await this.forceCleanup();
    this.memoryCallbacks = [];
    MemoryManager.instance = null;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Setup tab event listeners
   */
  private setupTabListeners(): void {
    // Listen for tab removal
    chrome.tabs.onRemoved.addListener(async (tabId: number) => {
      await this.unregisterTab(tabId);
    });

    // Listen for tab updates (navigation away)
    chrome.tabs.onUpdated.addListener(async (tabId: number, changeInfo) => {
      if (changeInfo.url && this.activeTabs.has(tabId)) {
        // Get the learning interface URL
        const learningInterfaceUrl = chrome.runtime.getURL(
          'ui/learning-interface.html'
        );

        // Only cleanup if navigating away from learning interface
        // Don't cleanup when initially loading the learning interface
        if (
          !changeInfo.url.startsWith(learningInterfaceUrl) &&
          !changeInfo.url.startsWith('chrome-extension://')
        ) {
          console.log(
            `Tab ${tabId} navigated away from learning interface to ${changeInfo.url}`
          );
          await this.unregisterTab(tabId);
        } else {
          console.log(
            `Tab ${tabId} is still on learning interface, keeping registered`
          );
        }
      }
    });
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    // Start monitoring automatically
    this.startMonitoring();

    // Listen for memory pressure events if available
    if (
      'memory' in performance &&
      'addEventListener' in (performance as any).memory
    ) {
      try {
        (performance as any).memory.addEventListener(
          'memorypressure',
          async () => {
            console.warn('Memory pressure detected, performing cleanup');
            await this.performMemoryCleanup();
          }
        );
      } catch {
        // Memory pressure events not supported
      }
    }
  }

  /**
   * Get current memory usage
   */
  private async getMemoryUsage(): Promise<MemoryUsage> {
    let memoryInfo: MemoryUsage = {
      used: 0,
      total: 0,
      percentage: 0,
    };

    try {
      // Try to get memory info from performance API
      if ('memory' in performance) {
        const perfMemory = (performance as any).memory;
        memoryInfo = {
          used: perfMemory.usedJSHeapSize || 0,
          total: perfMemory.totalJSHeapSize || 0,
          percentage: perfMemory.totalJSHeapSize
            ? (perfMemory.usedJSHeapSize / perfMemory.totalJSHeapSize) * 100
            : 0,
          jsHeapSizeLimit: perfMemory.jsHeapSizeLimit,
          usedJSHeapSize: perfMemory.usedJSHeapSize,
          totalJSHeapSize: perfMemory.totalJSHeapSize,
        };
      }

      // Fallback: estimate based on navigator.deviceMemory
      if (memoryInfo.used === 0 && 'deviceMemory' in navigator) {
        const deviceMemory =
          (navigator as any).deviceMemory * 1024 * 1024 * 1024; // Convert GB to bytes
        memoryInfo.total = deviceMemory;
        memoryInfo.used = Math.min(deviceMemory * 0.1, this.MEMORY_THRESHOLD); // Estimate 10% usage
        memoryInfo.percentage = (memoryInfo.used / memoryInfo.total) * 100;
      }
    } catch (error) {
      console.warn('Failed to get memory usage:', error);
    }

    return memoryInfo;
  }

  /**
   * Get current storage usage
   */
  private async getStorageUsage(): Promise<{
    used: number;
    quota: number;
    percentage: number;
  }> {
    try {
      const storageManager = getStorageManager();
      const quotaInfo = await storageManager.checkStorageQuota();

      return {
        used: quotaInfo.bytesInUse,
        quota: quotaInfo.quota,
        percentage: quotaInfo.percentUsed * 100,
      };
    } catch (error) {
      console.warn('Failed to get storage usage:', error);
      return { used: 0, quota: 0, percentage: 0 };
    }
  }

  /**
   * Get count of active AI sessions
   */
  private getAISessionCount(): number {
    // This is an approximation - we can't directly count sessions
    // but we can estimate based on active tabs
    return this.activeTabs.size * 2; // Estimate 2 sessions per tab on average
  }

  /**
   * Cleanup resources for a specific tab
   */
  private async cleanupTabResources(tabId: number): Promise<void> {
    try {
      // Remove tab-specific session storage
      await chrome.storage.session.remove(`article_${tabId}`);

      // Remove any pending processing tasks for this tab
      const storageManager = getStorageManager();
      await storageManager.cleanupTabData(tabId);

      console.log(`Cleaned up resources for tab ${tabId}`);
    } catch (error) {
      console.error(`Failed to cleanup tab ${tabId} resources:`, error);
    }
  }

  /**
   * Cleanup AI sessions
   */
  private async cleanupAISessions(): Promise<void> {
    try {
      // Reset Chrome AI instance to cleanup all sessions
      resetChromeAI();
      console.log('AI sessions cleaned up');
    } catch (error) {
      console.error('Failed to cleanup AI sessions:', error);
    }
  }

  /**
   * Cleanup offscreen documents
   */
  private async cleanupOffscreenDocuments(): Promise<void> {
    const docIds = Array.from(this.activeOffscreenDocs);

    for (const docId of docIds) {
      await this.unregisterOffscreenDocument(docId);
    }
  }

  /**
   * Cleanup storage cache
   */
  private async cleanupStorageCache(): Promise<void> {
    try {
      const storageManager = getStorageManager();
      await storageManager.performMaintenanceCleanup();
      console.log('Storage cache cleaned up');
    } catch (error) {
      console.error('Failed to cleanup storage cache:', error);
    }
  }

  /**
   * Perform memory-focused cleanup
   */
  private async performMemoryCleanup(): Promise<void> {
    console.log('Performing memory cleanup...');

    // Cleanup AI sessions first (biggest memory users)
    await this.cleanupAISessions();

    // Force garbage collection
    this.forceGarbageCollection();

    // If still high memory usage, cleanup storage cache
    const usage = await this.getMemoryUsage();
    if (usage.used > this.MEMORY_THRESHOLD * 0.8) {
      await this.cleanupStorageCache();
    }
  }

  /**
   * Perform resource-focused cleanup
   */
  private async performResourceCleanup(): Promise<void> {
    console.log('Performing resource cleanup...');

    // Close excess offscreen documents
    if (this.activeOffscreenDocs.size > 1) {
      const docs = Array.from(this.activeOffscreenDocs);
      for (let i = 1; i < docs.length; i++) {
        await this.unregisterOffscreenDocument(docs[i]);
      }
    }

    // Cleanup old AI sessions
    await this.cleanupAISessions();
  }

  /**
   * Force garbage collection if available
   */
  private forceGarbageCollection(): void {
    try {
      // Try to trigger garbage collection
      // Note: gc() is only available with --js-flags=--expose-gc in Chrome
      if ('gc' in globalThis) {
        (globalThis as any).gc();
        console.log('Forced garbage collection');
      }
      // Service workers don't have requestAnimationFrame, so we skip that fallback
    } catch {
      // GC not available or failed
    }
  }
}

// ============================================================================
// Singleton Access
// ============================================================================

/**
 * Get the memory manager instance
 */
export function getMemoryManager(): MemoryManager {
  return MemoryManager.getInstance();
}

/**
 * Initialize memory management for the extension
 */
export async function initializeMemoryManagement(): Promise<void> {
  const memoryManager = getMemoryManager();

  // Start monitoring
  memoryManager.startMonitoring();

  console.log('Memory management initialized');
}

/**
 * Cleanup memory management (for extension shutdown)
 */
export async function shutdownMemoryManagement(): Promise<void> {
  const memoryManager = getMemoryManager();
  await memoryManager.destroy();

  console.log('Memory management shutdown');
}
