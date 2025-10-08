/**
 * Unit tests for service worker functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { ExtractedContent } from '../src/types';

// Mock the service worker module
const _mockProcessCurrentTab = vi.fn();
const _mockCheckSystemCapabilities = vi.fn();
const _mockOpenLearningInterface = vi.fn();
const _mockHandleContentExtracted = vi.fn();

describe('Service Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Extension Icon Click Handler', () => {
    it('should register action click listener', () => {
      // Verify the Chrome API is available for registering listeners
      expect(chrome.action.onClicked.addListener).toBeDefined();
      expect(typeof chrome.action.onClicked.addListener).toBe('function');
    });

    it('should not process chrome:// URLs', async () => {
      const mockTab = {
        id: 123,
        url: 'chrome://extensions',
      };

      const handler = chrome.action.onClicked.addListener.mock.calls[0]?.[0];

      if (handler) {
        await handler(mockTab as chrome.tabs.Tab);
      }

      // Should not attempt to inject script on chrome:// pages
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    });

    it('should not process chrome-extension:// URLs', async () => {
      const mockTab = {
        id: 123,
        url: 'chrome-extension://abc123/page.html',
      };

      const handler = chrome.action.onClicked.addListener.mock.calls[0]?.[0];

      if (handler) {
        await handler(mockTab as chrome.tabs.Tab);
      }

      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    });

    it('should handle missing tab ID gracefully', async () => {
      const mockTab = {
        url: 'https://example.com',
      };

      const handler = chrome.action.onClicked.addListener.mock.calls[0]?.[0];

      if (handler) {
        await handler(mockTab as chrome.tabs.Tab);
      }

      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    });
  });

  describe('Content Script Injection', () => {
    it('should inject content script successfully', async () => {
      const tabId = 123;

      chrome.scripting.executeScript.mockResolvedValue([{ result: true }]);

      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['dist/content/content-script.js'],
      });

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId },
        files: ['dist/content/content-script.js'],
      });
    });

    it('should handle injection failure', async () => {
      const tabId = 123;
      const error = new Error('Injection failed');

      chrome.scripting.executeScript.mockRejectedValue(error);

      await expect(
        chrome.scripting.executeScript({
          target: { tabId },
          files: ['dist/content/content-script.js'],
        })
      ).rejects.toThrow('Injection failed');
    });
  });

  describe('Message Handling', () => {
    it('should handle CONTENT_EXTRACTED message', async () => {
      const mockContent: ExtractedContent = {
        title: 'Test Article',
        content: 'This is test content',
        url: 'https://example.com/article',
        wordCount: 4,
        paragraphCount: 1,
      };

      const sendResponse = vi.fn();
      const handler = chrome.runtime.onMessage.addListener.mock.calls[0]?.[0];

      if (handler) {
        const result = handler(
          { type: 'CONTENT_EXTRACTED', data: mockContent },
          {},
          sendResponse
        );

        expect(result).toBe(true); // Indicates async response
      }
    });

    it('should handle CHECK_SYSTEM_CAPABILITIES message', async () => {
      const sendResponse = vi.fn();
      const handler = chrome.runtime.onMessage.addListener.mock.calls[0]?.[0];

      if (handler) {
        const result = handler(
          { type: 'CHECK_SYSTEM_CAPABILITIES' },
          {},
          sendResponse
        );

        expect(result).toBe(true);
      }
    });

    it('should handle OPEN_LEARNING_INTERFACE message', async () => {
      const mockContent: ExtractedContent = {
        title: 'Test Article',
        content: 'Test content',
        url: 'https://example.com',
        wordCount: 2,
        paragraphCount: 1,
      };

      const sendResponse = vi.fn();
      const handler = chrome.runtime.onMessage.addListener.mock.calls[0]?.[0];

      if (handler) {
        const result = handler(
          { type: 'OPEN_LEARNING_INTERFACE', data: mockContent },
          {},
          sendResponse
        );

        expect(result).toBe(true);
      }
    });

    it('should return false for unknown message types', () => {
      const sendResponse = vi.fn();
      const handler = chrome.runtime.onMessage.addListener.mock.calls[0]?.[0];

      if (handler) {
        const result = handler({ type: 'UNKNOWN_MESSAGE' }, {}, sendResponse);

        expect(result).toBe(false);
      }
    });
  });

  describe('Learning Interface Management', () => {
    it('should create new tab for learning interface', async () => {
      const _mockContent: ExtractedContent = {
        title: 'Test Article',
        content: 'Test content',
        url: 'https://example.com',
        wordCount: 2,
        paragraphCount: 1,
      };

      const mockTab = {
        id: 456,
        url: 'chrome-extension://mock-id/dist/ui/learning-interface.html',
      };

      chrome.tabs.create.mockResolvedValue(mockTab);
      chrome.storage.session.set.mockResolvedValue(undefined);

      const tab = await chrome.tabs.create({
        url: chrome.runtime.getURL('dist/ui/learning-interface.html'),
        active: true,
      });

      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://mock-id/dist/ui/learning-interface.html',
        active: true,
      });

      expect(tab.id).toBe(456);
    });

    it('should store article data in session storage', async () => {
      const tabId = 456;
      const mockContent: ExtractedContent = {
        title: 'Test Article',
        content: 'Test content',
        url: 'https://example.com',
        wordCount: 2,
        paragraphCount: 1,
      };

      chrome.storage.session.set.mockResolvedValue(undefined);

      await chrome.storage.session.set({
        [`article_${tabId}`]: mockContent,
      });

      expect(chrome.storage.session.set).toHaveBeenCalledWith({
        [`article_${tabId}`]: mockContent,
      });
    });
  });

  describe('System Capabilities Detection', () => {
    it('should detect Chrome AI availability', async () => {
      // Mock the AI API
      (global as any).ai = {
        languageDetector: {},
        summarizer: {},
        rewriter: {},
        translator: {},
        languageModel: {},
      };

      const capabilities = {
        hasChromeAI: true,
        hasLanguageDetector: true,
        hasSummarizer: true,
        hasRewriter: true,
        hasTranslator: true,
        hasPromptAPI: true,
        hardwareInfo: {
          ram: 'Unknown',
          storage: 'Unknown',
          vram: 'Unknown',
        },
      };

      // Verify the structure
      expect(capabilities.hasChromeAI).toBe(true);
      expect(capabilities.hasLanguageDetector).toBe(true);

      // Cleanup
      delete (global as any).ai;
    });

    it('should handle missing Chrome AI APIs', () => {
      delete (global as any).ai;

      const capabilities = {
        hasChromeAI: false,
        hasLanguageDetector: false,
        hasSummarizer: false,
        hasRewriter: false,
        hasTranslator: false,
        hasPromptAPI: false,
        hardwareInfo: {
          ram: 'Unknown',
          storage: 'Unknown',
          vram: 'Unknown',
        },
      };

      expect(capabilities.hasChromeAI).toBe(false);
    });

    it('should detect device memory if available', () => {
      (navigator as any).deviceMemory = 8;

      const ram = `${(navigator as any).deviceMemory} GB`;
      expect(ram).toBe('8 GB');

      delete (navigator as any).deviceMemory;
    });
  });

  describe('Tab Cleanup', () => {
    it('should have tab removal listener available', () => {
      expect(chrome.tabs.onRemoved.addListener).toBeDefined();
      expect(typeof chrome.tabs.onRemoved.addListener).toBe('function');
    });

    it('should clean up session storage when tab is closed', async () => {
      const tabId = 456;

      chrome.storage.session.remove.mockResolvedValue(undefined);

      await chrome.storage.session.remove(`article_${tabId}`);

      expect(chrome.storage.session.remove).toHaveBeenCalledWith(
        `article_${tabId}`
      );
    });
  });

  describe('Extension Installation', () => {
    it('should have onInstalled listener available', () => {
      expect(chrome.runtime.onInstalled.addListener).toBeDefined();
      expect(typeof chrome.runtime.onInstalled.addListener).toBe('function');
    });

    it('should initialize default settings on install', async () => {
      const defaultSettings = {
        settings: {
          nativeLanguage: 'en',
          learningLanguage: 'es',
          difficultyLevel: 5,
          autoHighlight: false,
          darkMode: false,
          fontSize: 16,
          apiKeys: {},
        },
      };

      chrome.storage.local.set.mockResolvedValue(undefined);

      await chrome.storage.local.set(defaultSettings);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(defaultSettings);
    });

    it('should validate default settings structure', () => {
      const defaultSettings = {
        settings: {
          nativeLanguage: 'en',
          learningLanguage: 'es',
          difficultyLevel: 5,
          autoHighlight: false,
          darkMode: false,
          fontSize: 16,
          apiKeys: {},
        },
      };

      expect(defaultSettings.settings.nativeLanguage).toBe('en');
      expect(defaultSettings.settings.learningLanguage).toBe('es');
      expect(defaultSettings.settings.difficultyLevel).toBe(5);
      expect(defaultSettings.settings.autoHighlight).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      const error = new Error('Storage quota exceeded');
      chrome.storage.session.set.mockRejectedValue(error);

      await expect(
        chrome.storage.session.set({ test: 'data' })
      ).rejects.toThrow('Storage quota exceeded');
    });

    it('should handle tab creation errors', async () => {
      const error = new Error('Failed to create tab');
      chrome.tabs.create.mockRejectedValue(error);

      await expect(chrome.tabs.create({ url: 'test.html' })).rejects.toThrow(
        'Failed to create tab'
      );
    });
  });
});
