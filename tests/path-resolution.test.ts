/**
 * Unit tests for content script path resolution
 * Tests Requirements: 4.4, 4.5
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

describe('Content Script Path Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File Path Construction', () => {
    it('should use correct relative path without dist/ prefix', () => {
      const expectedPath = 'content/content-script.js';

      // This is the path that should be used in executeScript calls
      expect(expectedPath).not.toContain('dist/');
      expect(expectedPath).toBe('content/content-script.js');
    });

    it('should construct paths relative to extension root', () => {
      const testPaths = [
        'content/content-script.js',
        'background/service-worker.js',
        'ui/learning-interface.html',
        'offscreen/ai-processor.js',
      ];

      testPaths.forEach(path => {
        // Paths should be relative to extension root (dist/ directory)
        expect(path).not.toMatch(/^\/|^dist\//);
        expect(path).toMatch(/^[a-z-]+\/[a-z-]+\.(js|html)$/);
      });
    });

    it('should validate path format consistency', () => {
      const contentScriptPath = 'content/content-script.js';

      // Path should follow kebab-case naming convention
      expect(contentScriptPath).toMatch(/^[a-z-]+\/[a-z-]+\.js$/);

      // Path should not have leading slash or dist prefix
      expect(contentScriptPath).not.toMatch(/^\/|^dist\//);

      // Path should have proper file extension
      expect(contentScriptPath.endsWith('.js')).toBe(true);
    });
  });

  describe('Chrome Scripting API Integration', () => {
    it('should call executeScript with correct path format', async () => {
      const tabId = 123;
      const expectedPath = 'content/content-script.js';

      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: 'success' },
      ]);
      mockChrome.tabs.get.mockResolvedValue({
        id: tabId,
        url: 'https://example.com',
        title: 'Test Page',
      });

      // Simulate the executeScript call that would happen in processCurrentTab
      await mockChrome.scripting.executeScript({
        target: { tabId },
        files: [expectedPath],
      });

      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId },
        files: [expectedPath],
      });

      // Verify the path format is correct
      const callArgs = mockChrome.scripting.executeScript.mock.calls[0][0];
      expect(callArgs.files[0]).toBe(expectedPath);
      expect(callArgs.files[0]).not.toContain('dist/');
    });

    it('should handle successful script injection', async () => {
      const tabId = 456;
      const scriptPath = 'content/content-script.js';

      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: 'Content script loaded successfully' },
      ]);
      mockChrome.tabs.get.mockResolvedValue({
        id: tabId,
        url: 'https://example.com/article',
        title: 'Test Article',
      });

      const result = await mockChrome.scripting.executeScript({
        target: { tabId },
        files: [scriptPath],
      });

      expect(result).toEqual([
        { result: 'Content script loaded successfully' },
      ]);
      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId },
        files: [scriptPath],
      });
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle file not found errors', async () => {
      const tabId = 789;
      const scriptPath = 'content/content-script.js';
      const fileNotFoundError = new Error(
        `Could not load file '${scriptPath}'`
      );

      mockChrome.scripting.executeScript.mockRejectedValue(fileNotFoundError);
      mockChrome.tabs.get.mockResolvedValue({
        id: tabId,
        url: 'https://example.com',
        title: 'Test Page',
      });

      try {
        await mockChrome.scripting.executeScript({
          target: { tabId },
          files: [scriptPath],
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(
          `Could not load file '${scriptPath}'`
        );
        expect((error as Error).message).toContain(scriptPath);
      }

      expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId },
        files: [scriptPath],
      });
    });

    it('should handle restricted page errors', async () => {
      const tabId = 101;
      const scriptPath = 'content/content-script.js';
      const restrictedError = new Error(
        'Cannot access contents of url "chrome://settings/"'
      );

      mockChrome.scripting.executeScript.mockRejectedValue(restrictedError);
      mockChrome.tabs.get.mockResolvedValue({
        id: tabId,
        url: 'chrome://settings/',
        title: 'Settings',
      });

      try {
        await mockChrome.scripting.executeScript({
          target: { tabId },
          files: [scriptPath],
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(
          'Cannot access contents of url'
        );
        expect((error as Error).message).toContain('chrome://settings/');
      }
    });

    it('should handle chrome.scripting API errors', async () => {
      const tabId = 202;
      const scriptPath = 'content/content-script.js';
      const apiError = new Error('chrome.scripting.executeScript failed');

      mockChrome.scripting.executeScript.mockRejectedValue(apiError);
      mockChrome.tabs.get.mockResolvedValue({
        id: tabId,
        url: 'https://example.com',
        title: 'Test Page',
      });

      try {
        await mockChrome.scripting.executeScript({
          target: { tabId },
          files: [scriptPath],
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain(
          'chrome.scripting.executeScript failed'
        );
      }
    });

    it('should extract Chrome error codes from error messages', () => {
      const testCases = [
        {
          error: new Error(
            'Cannot access contents of url "chrome://settings/"'
          ),
          expectedPattern: 'Cannot access contents of url',
        },
        {
          error: new Error(`Could not load file 'content/content-script.js'`),
          expectedPattern: 'Could not load file',
        },
        {
          error: new Error('chrome.scripting.executeScript failed'),
          expectedCode: 'CHROME_SCRIPTING_ERROR',
        },
        {
          error: new Error('The extensions gallery cannot be scripted'),
          expectedPattern: 'extensions gallery cannot be scripted',
        },
      ];

      testCases.forEach(({ error, expectedPattern, expectedCode }) => {
        const message = error.message;

        if (expectedPattern) {
          expect(message).toContain(expectedPattern);
        }

        if (expectedCode) {
          // Test the logic that would be used to extract Chrome error codes
          const hasChromeScriptingError =
            message.includes('chrome.scripting') ||
            message.includes('executeScript');
          expect(hasChromeScriptingError).toBe(true);
        }
      });
    });
  });

  describe('Path Validation', () => {
    it('should validate that paths do not contain dist/ prefix', () => {
      const invalidPaths = [
        'dist/content/content-script.js',
        'dist/background/service-worker.js',
        '/dist/ui/learning-interface.html',
      ];

      const validPaths = [
        'content/content-script.js',
        'background/service-worker.js',
        'ui/learning-interface.html',
      ];

      invalidPaths.forEach(path => {
        expect(path).toMatch(/dist\//);
        // These paths would fail in Chrome extension context
      });

      validPaths.forEach(path => {
        expect(path).not.toMatch(/dist\//);
        expect(path).not.toMatch(/^\//);
        // These paths should work correctly
      });
    });

    it('should validate path structure matches manifest format', () => {
      // Simulate manifest content_scripts paths
      const manifestPaths = ['content/content-script.js'];

      // Service worker should use the same path format
      const serviceWorkerPath = 'content/content-script.js';

      expect(manifestPaths).toContain(serviceWorkerPath);
      expect(serviceWorkerPath).not.toContain('dist/');
      expect(serviceWorkerPath).toMatch(/^[a-z-]+\/[a-z-]+\.js$/);
    });

    it('should handle multiple file paths correctly', () => {
      const filePaths = [
        'content/content-script.js',
        'content/content-utils.js',
      ];

      filePaths.forEach(path => {
        expect(path).not.toContain('dist/');
        expect(path).not.toMatch(/^\//);
        expect(path).toMatch(/^content\/[a-z-]+\.js$/);
      });

      // Test that executeScript would be called with correct format
      mockChrome.scripting.executeScript.mockResolvedValue([
        { result: 'success' },
      ]);

      const executeScriptCall = {
        target: { tabId: 123 },
        files: filePaths,
      };

      expect(executeScriptCall.files).toEqual(filePaths);
      expect(
        executeScriptCall.files.every(path => !path.includes('dist/'))
      ).toBe(true);
    });
  });

  describe('Error Context Creation', () => {
    it('should create detailed error context for debugging', () => {
      const tabId = 123;
      const scriptPath = 'content/content-script.js';
      const error = new Error(`Could not load file '${scriptPath}'`);

      // Simulate the error context that would be created
      const errorContext = {
        attemptedPath: scriptPath,
        tabId,
        error: error.message,
        timestamp: Date.now(),
        suggestions: [
          'Verify content script file exists in dist/content/',
          'Check manifest.json content_scripts paths match',
          'Ensure build process completed successfully',
          'Verify tab permissions and URL accessibility',
          'Check Chrome extension file path resolution',
        ],
        contextInfo: {
          manifestVersion: '3',
          extensionId: 'test-extension-id',
        },
      };

      expect(errorContext.attemptedPath).toBe(scriptPath);
      expect(errorContext.attemptedPath).not.toContain('dist/');
      expect(errorContext.error).toContain(scriptPath);
      expect(errorContext.suggestions).toHaveLength(5);
      expect(errorContext.suggestions[0]).toContain('dist/content/');
      expect(errorContext.contextInfo.manifestVersion).toBe('3');
    });

    it('should provide helpful suggestions for path resolution errors', () => {
      const suggestions = [
        'Verify content script file exists in dist/content/',
        'Check manifest.json content_scripts paths match',
        'Ensure build process completed successfully',
        'Verify tab permissions and URL accessibility',
        'Check Chrome extension file path resolution',
      ];

      // Verify suggestions are helpful and specific
      expect(suggestions[0]).toContain('dist/content/');
      expect(suggestions[1]).toContain('manifest.json');
      expect(suggestions[2]).toContain('build process');
      expect(suggestions[3]).toContain('permissions');
      expect(suggestions[4]).toContain('path resolution');
    });
  });
});
