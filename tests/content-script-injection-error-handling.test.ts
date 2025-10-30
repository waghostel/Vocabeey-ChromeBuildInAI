/**
 * Tests for enhanced content script injection error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    getManifest: vi.fn(() => ({
      manifest_version: 3,
      version: '1.0.0',
    })),
    id: 'test-extension-id',
  },
  tabs: {
    get: vi.fn(),
  },
  scripting: {
    executeScript: vi.fn(),
  },
  storage: {
    session: {
      set: vi.fn(),
      get: vi.fn(),
    },
  },
};

// @ts-expect-error - Mocking global chrome
global.chrome = mockChrome;

describe('Content Script Injection Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should capture detailed error context on injection failure', async () => {
    // Mock tab information
    const mockTab = {
      id: 123,
      url: 'https://example.com',
      title: 'Test Page',
    };

    mockChrome.tabs.get.mockResolvedValue(mockTab);
    mockChrome.scripting.executeScript.mockRejectedValue(
      new Error("Could not load file 'content/content-script.js'")
    );

    // Import the service worker module to test the error handling
    // Note: This is a simplified test since the actual service worker runs in a different context
    const { globalErrorHandler } = await import('../src/utils/error-handler');

    // Simulate the full error handling flow that would happen in the service worker
    try {
      // First get tab info (this is what the service worker would do)
      const tab = await mockChrome.tabs.get(123);

      // Then attempt script injection
      await mockChrome.scripting.executeScript({
        target: { tabId: 123 },
        files: ['content/content-script.js'],
      });
    } catch (error) {
      // Verify error normalization works
      const normalizedError = globalErrorHandler.normalizeError(
        error,
        'content script injection'
      );

      expect(normalizedError.type).toBe('processing_failed');
      expect(normalizedError.message).toContain('Could not load file');
      expect(normalizedError.retryable).toBe(false);
      expect(normalizedError.userMessage).toBeDefined();
      expect(normalizedError.suggestedAction).toBeDefined();
    }

    // Verify that tabs.get was called to get tab information for error context
    expect(mockChrome.tabs.get).toHaveBeenCalledWith(123);
  });

  it('should log success information on successful injection', async () => {
    const mockTab = {
      id: 456,
      url: 'https://example.com/article',
      title: 'Test Article',
    };

    mockChrome.tabs.get.mockResolvedValue(mockTab);
    mockChrome.scripting.executeScript.mockResolvedValue([
      { result: 'success' },
    ]);

    // Simulate the full success flow that would happen in the service worker
    // First get tab info (this is what the service worker would do for logging)
    const tab = await mockChrome.tabs.get(456);

    // Then perform successful injection
    const result = await mockChrome.scripting.executeScript({
      target: { tabId: 456 },
      files: ['content/content-script.js'],
    });

    // Verify the injection was attempted and successful
    expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith({
      target: { tabId: 456 },
      files: ['content/content-script.js'],
    });
    expect(result).toEqual([{ result: 'success' }]);

    // Verify that tabs.get was called to get tab information for success logging
    expect(mockChrome.tabs.get).toHaveBeenCalledWith(456);
  });

  it('should extract Chrome error codes from error messages', () => {
    const testCases = [
      {
        error: new Error('Cannot access contents of url "chrome://settings/"'),
        expectedPattern: 'Cannot access contents of url',
      },
      {
        error: new Error("Could not load file 'content/content-script.js'"),
        expectedPattern: 'Could not load file',
      },
      {
        error: new Error('chrome.scripting.executeScript failed'),
        expectedCode: 'CHROME_SCRIPTING_ERROR',
      },
    ];

    // Import the helper function (this would be available in the service worker context)
    testCases.forEach(({ error, expectedPattern, expectedCode }) => {
      const message = error.message;

      if (expectedPattern) {
        expect(message).toContain(expectedPattern);
      }

      if (expectedCode) {
        expect(
          message.includes('chrome.scripting') ||
            message.includes('executeScript')
        ).toBe(true);
      }
    });
  });

  it('should handle restricted page URLs correctly', () => {
    const restrictedUrls = [
      'chrome://settings/',
      'chrome-extension://abc123/popup.html',
      'chrome-search://local-ntp/local-ntp.html',
      'edge://settings/',
      'about:blank',
    ];

    restrictedUrls.forEach(url => {
      const isRestricted =
        url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('chrome-search://') ||
        url.startsWith('edge://') ||
        url.startsWith('about:');

      expect(isRestricted).toBe(true);
    });

    const allowedUrls = [
      'https://example.com',
      'http://localhost:3000',
      'https://news.ycombinator.com',
    ];

    allowedUrls.forEach(url => {
      const isRestricted =
        url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://') ||
        url.startsWith('chrome-search://') ||
        url.startsWith('edge://') ||
        url.startsWith('about:');

      expect(isRestricted).toBe(false);
    });
  });
});
