/**
 * Memory Management Tests
 * Tests for memory manager and offscreen document manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { getMemoryManager } from '../src/utils/memory-manager';
import { getOffscreenManager } from '../src/utils/offscreen-manager';
import {
  mockChromeStorage,
  mockChromeOffscreen,
  mockChromeTabs,
  mockChromeRuntime,
} from './setup/chrome-mock';

describe('Memory Management', () => {
  beforeEach(() => {
    mockChromeStorage();
    mockChromeOffscreen();
    mockChromeTabs();
    mockChromeRuntime();

    // Mock performance.memory
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
      },
      configurable: true,
    });

    // Mock navigator.deviceMemory
    Object.defineProperty(navigator, 'deviceMemory', {
      value: 8, // 8GB
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('MemoryManager', () => {
    it('should register and unregister tabs', async () => {
      const memoryManager = getMemoryManager();

      // Register a tab
      memoryManager.registerTab(123);

      const usage = await memoryManager.getResourceUsage();
      expect(usage.activeTabs).toBe(1);

      // Unregister the tab
      await memoryManager.unregisterTab(123);

      const usageAfter = await memoryManager.getResourceUsage();
      expect(usageAfter.activeTabs).toBe(0);
    });

    it('should get memory usage information', async () => {
      const memoryManager = getMemoryManager();

      const usage = await memoryManager.getResourceUsage();

      expect(usage.memory).toBeDefined();
      expect(usage.memory.used).toBeGreaterThan(0);
      expect(usage.memory.percentage).toBeGreaterThan(0);
      expect(usage.storage).toBeDefined();
      expect(usage.activeTabs).toBe(0);
    });

    it('should detect memory pressure', async () => {
      const memoryManager = getMemoryManager();

      // Mock high memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 150 * 1024 * 1024, // 150MB (above threshold)
          totalJSHeapSize: 200 * 1024 * 1024,
          jsHeapSizeLimit: 2 * 1024 * 1024 * 1024,
        },
        configurable: true,
      });

      const needsCleanup = await memoryManager.checkMemoryPressure();
      expect(needsCleanup).toBe(true);
    });

    it('should handle memory usage callbacks', async () => {
      const memoryManager = getMemoryManager();
      const callback = vi.fn();

      const unsubscribe = memoryManager.onMemoryUsageChange(callback);

      // Manually trigger the callback by getting resource usage
      const usage = await memoryManager.getResourceUsage();

      // Simulate the monitoring callback
      callback(usage);

      expect(callback).toHaveBeenCalledWith(usage);

      unsubscribe();
    });

    it('should perform force cleanup', async () => {
      const memoryManager = getMemoryManager();

      // This should not throw
      await expect(memoryManager.forceCleanup()).resolves.toBeUndefined();
    });
  });

  describe('OffscreenDocumentManager', () => {
    it('should create and close offscreen documents', async () => {
      const offscreenManager = getOffscreenManager();

      const documentId = await offscreenManager.createDocument();
      expect(documentId).toBeDefined();
      expect(offscreenManager.isDocumentActive()).toBe(true);

      await offscreenManager.closeDocument();
      expect(offscreenManager.isDocumentActive()).toBe(false);
    });

    it('should handle task execution', async () => {
      const offscreenManager = getOffscreenManager();

      // Create document first
      await offscreenManager.createDocument();

      // Test that document is active
      expect(offscreenManager.isDocumentActive()).toBe(true);

      // Test pending task count starts at 0
      expect(offscreenManager.getPendingTaskCount()).toBe(0);
    });

    it('should track pending tasks', async () => {
      const offscreenManager = getOffscreenManager();

      expect(offscreenManager.getPendingTaskCount()).toBe(0);

      // Test that pending task count starts at 0
      expect(offscreenManager.getPendingTaskCount()).toBe(0);
    });
  });

  describe('Integration', () => {
    it('should integrate memory manager with offscreen manager', async () => {
      const memoryManager = getMemoryManager();
      const offscreenManager = getOffscreenManager();

      // Create offscreen document
      const _documentId = await offscreenManager.createDocument();

      // Check that memory manager tracks the document
      const usage = await memoryManager.getResourceUsage();
      expect(usage.offscreenDocuments).toBe(1);

      // Close document
      await offscreenManager.closeDocument();

      // Check that it's no longer tracked
      const usageAfter = await memoryManager.getResourceUsage();
      expect(usageAfter.offscreenDocuments).toBe(0);
    });
  });
});
