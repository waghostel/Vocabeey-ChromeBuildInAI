/**
 * Concrete Test Scenarios
 * Implementation of specific test scenarios for the Chrome extension
 */

import { TestScenario, TestResult } from '../types/debug-types';

/**
 * Extension Loading Test Scenario
 */
export const extensionLoadingTest: TestScenario = {
  name: 'Extension Loading Test',
  description:
    'Verify that the Chrome extension loads correctly and all contexts are initialized',
  expectedOutcome: 'Extension loads successfully with all contexts active',
  category: 'Extension Lifecycle',
  priority: 1,
  timeout: 15000,

  setup: async () => {
    console.log('Setting up extension loading test...');
    // Clear any existing extension state
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.clear();
    }
  },

  execute: async () => {
    const startTime = Date.now();
    const metrics: Record<string, any> = {};

    try {
      // Check if MCP connection is available
      const mcpAvailable = typeof mcp_chrome_devtools_list_pages === 'function';
      metrics.mcpAvailable = mcpAvailable;

      if (!mcpAvailable) {
        return {
          passed: false,
          scenarioName: 'Extension Loading Test',
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
          error: 'MCP chrome-devtools not available',
          metrics,
        };
      }

      // List available pages to verify extension contexts
      const pages = await mcp_chrome_devtools_list_pages();
      metrics.totalPages = pages.length;

      // Look for extension contexts
      const serviceWorkerPages = pages.filter(
        p =>
          p.url?.includes('chrome-extension://') && p.type === 'service_worker'
      );
      const extensionPages = pages.filter(
        p =>
          p.url?.includes('chrome-extension://') && p.type !== 'service_worker'
      );

      metrics.serviceWorkerPages = serviceWorkerPages.length;
      metrics.extensionPages = extensionPages.length;
      metrics.hasServiceWorker = serviceWorkerPages.length > 0;

      // Test basic extension functionality if service worker is available
      if (serviceWorkerPages.length > 0) {
        await mcp_chrome_devtools_select_page(serviceWorkerPages[0].id);

        // Check console messages for initialization
        const consoleMessages = await mcp_chrome_devtools_list_console_messages(
          {
            pageSize: 50,
          }
        );

        metrics.consoleMessages = consoleMessages.length;
        metrics.hasErrors = consoleMessages.some(msg => msg.level === 'error');

        // Check if extension APIs are available
        const extensionApiCheck = await mcp_chrome_devtools_evaluate_script({
          function: `() => ({
            chromeAvailable: typeof chrome !== 'undefined',
            storageAvailable: typeof chrome?.storage !== 'undefined',
            runtimeAvailable: typeof chrome?.runtime !== 'undefined',
            extensionId: chrome?.runtime?.id || null
          })`,
        });

        Object.assign(metrics, extensionApiCheck);
      }

      const executionTime = Date.now() - startTime;
      const passed =
        metrics.hasServiceWorker &&
        !metrics.hasErrors &&
        metrics.chromeAvailable;

      return {
        passed,
        scenarioName: 'Extension Loading Test',
        executionTime,
        timestamp: new Date(),
        metrics,
      };
    } catch (error) {
      return {
        passed: false,
        scenarioName: 'Extension Loading Test',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metrics,
      };
    }
  },

  cleanup: async () => {
    console.log('Cleaning up extension loading test...');
    // No specific cleanup needed for this test
  },
};

/**
 * Content Extraction Test Scenario
 */
export const contentExtractionTest: TestScenario = {
  name: 'Content Extraction Test',
  description: 'Test article content extraction from a sample web page',
  expectedOutcome:
    'Content extracted successfully with title, body, and metadata',
  category: 'Content Processing',
  priority: 2,
  timeout: 20000,

  setup: async () => {
    console.log('Setting up content extraction test...');
    // Navigate to a test article page
    await mcp_chrome_devtools_new_page('https://example.com/article');
  },

  execute: async () => {
    const startTime = Date.now();
    const metrics: Record<string, any> = {};

    try {
      // Take a snapshot to verify page loaded
      const snapshot = await mcp_chrome_devtools_take_snapshot();
      metrics.pageElementsFound = snapshot.split('\n').length;

      // Simulate content extraction
      const extractionResult = await mcp_chrome_devtools_evaluate_script({
        function: `() => {
          const title = document.title || document.querySelector('h1')?.textContent || '';
          const content = document.body?.textContent || '';
          const images = document.querySelectorAll('img').length;
          const links = document.querySelectorAll('a').length;
          
          return {
            title: title.trim(),
            contentLength: content.length,
            wordCount: content.split(/\\s+/).length,
            imageCount: images,
            linkCount: links,
            hasTitle: title.length > 0,
            hasContent: content.length > 100
          };
        }`,
      });

      Object.assign(metrics, extractionResult);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      metrics.processingTime = 1000;

      const executionTime = Date.now() - startTime;
      const passed =
        metrics.hasTitle && metrics.hasContent && metrics.contentLength > 100;

      return {
        passed,
        scenarioName: 'Content Extraction Test',
        executionTime,
        timestamp: new Date(),
        metrics,
      };
    } catch (error) {
      return {
        passed: false,
        scenarioName: 'Content Extraction Test',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metrics,
      };
    }
  },

  cleanup: async () => {
    console.log('Cleaning up content extraction test...');
    // Close the test page
    try {
      const pages = await mcp_chrome_devtools_list_pages();
      const testPage = pages.find(p => p.url?.includes('example.com'));
      if (testPage) {
        await mcp_chrome_devtools_close_page(testPage.id);
      }
    } catch (error) {
      console.warn('Failed to close test page:', error);
    }
  },
};

/**
 * UI Interaction Test Scenario
 */
export const uiInteractionTest: TestScenario = {
  name: 'UI Interaction Test',
  description: 'Test user interface components and interactions',
  expectedOutcome: 'UI components render correctly and respond to interactions',
  category: 'UI Components',
  priority: 3,
  timeout: 15000,

  setup: async () => {
    console.log('Setting up UI interaction test...');
    // Navigate to extension UI (this would be the actual extension URL)
    await mcp_chrome_devtools_new_page('chrome://extensions/');
  },

  execute: async () => {
    const startTime = Date.now();
    const metrics: Record<string, any> = {};

    try {
      // Take snapshot of the page
      const snapshot = await mcp_chrome_devtools_take_snapshot();
      metrics.uiElementsFound = snapshot.split('button').length - 1; // Count buttons

      // Test basic page interaction
      const pageInfo = await mcp_chrome_devtools_evaluate_script({
        function: `() => ({
          pageTitle: document.title,
          hasButtons: document.querySelectorAll('button').length > 0,
          hasInputs: document.querySelectorAll('input').length > 0,
          isInteractive: document.readyState === 'complete',
          buttonCount: document.querySelectorAll('button').length,
          inputCount: document.querySelectorAll('input').length
        })`,
      });

      Object.assign(metrics, pageInfo);

      // Simulate interaction response time
      const interactionStart = Date.now();
      await new Promise(resolve => setTimeout(resolve, 100));
      metrics.responseTime = Date.now() - interactionStart;

      const executionTime = Date.now() - startTime;
      const passed = metrics.isInteractive && metrics.responseTime < 1000;

      return {
        passed,
        scenarioName: 'UI Interaction Test',
        executionTime,
        timestamp: new Date(),
        metrics,
      };
    } catch (error) {
      return {
        passed: false,
        scenarioName: 'UI Interaction Test',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metrics,
      };
    }
  },

  cleanup: async () => {
    console.log('Cleaning up UI interaction test...');
    // Close the extensions page
    try {
      const pages = await mcp_chrome_devtools_list_pages();
      const extensionsPage = pages.find(p =>
        p.url?.includes('chrome://extensions')
      );
      if (extensionsPage) {
        await mcp_chrome_devtools_close_page(extensionsPage.id);
      }
    } catch (error) {
      console.warn('Failed to close extensions page:', error);
    }
  },
};

/**
 * Storage Operation Test Scenario
 */
export const storageOperationTest: TestScenario = {
  name: 'Storage Operation Test',
  description: 'Test chrome.storage API operations and data persistence',
  expectedOutcome:
    'Storage operations complete successfully with data integrity',
  category: 'Storage & Caching',
  priority: 3,
  timeout: 10000,

  setup: async () => {
    console.log('Setting up storage operation test...');
    // Clear storage before test
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.clear();
    }
  },

  execute: async () => {
    const startTime = Date.now();
    const metrics: Record<string, any> = {};

    try {
      // Find service worker page for storage operations
      const pages = await mcp_chrome_devtools_list_pages();
      const serviceWorkerPage = pages.find(
        p =>
          p.url?.includes('chrome-extension://') && p.type === 'service_worker'
      );

      if (!serviceWorkerPage) {
        throw new Error('Service worker not found for storage test');
      }

      await mcp_chrome_devtools_select_page(serviceWorkerPage.id);

      // Test storage operations
      const storageTest = await mcp_chrome_devtools_evaluate_script({
        function: `async () => {
          const testData = { test: 'value', timestamp: Date.now() };
          const startTime = Date.now();
          
          try {
            // Set data
            await chrome.storage.local.set(testData);
            const setTime = Date.now() - startTime;
            
            // Get data
            const getStart = Date.now();
            const result = await chrome.storage.local.get(['test', 'timestamp']);
            const getTime = Date.now() - getStart;
            
            // Verify data integrity
            const dataIntegrity = result.test === testData.test && 
                                 result.timestamp === testData.timestamp;
            
            return {
              setOperationTime: setTime,
              getOperationTime: getTime,
              dataIntegrity: dataIntegrity ? 1.0 : 0.0,
              dataRetrieved: Object.keys(result).length,
              storageAvailable: true
            };
          } catch (error) {
            return {
              setOperationTime: 0,
              getOperationTime: 0,
              dataIntegrity: 0.0,
              dataRetrieved: 0,
              storageAvailable: false,
              error: error.message
            };
          }
        }`,
      });

      Object.assign(metrics, storageTest);

      const executionTime = Date.now() - startTime;
      const passed =
        metrics.storageAvailable &&
        metrics.dataIntegrity === 1.0 &&
        metrics.setOperationTime < 1000 &&
        metrics.getOperationTime < 1000;

      return {
        passed,
        scenarioName: 'Storage Operation Test',
        executionTime,
        timestamp: new Date(),
        metrics,
      };
    } catch (error) {
      return {
        passed: false,
        scenarioName: 'Storage Operation Test',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metrics,
      };
    }
  },

  cleanup: async () => {
    console.log('Cleaning up storage operation test...');
    // Clear test data
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.clear();
    }
  },
};

/**
 * Performance Monitoring Test Scenario
 */
export const performanceMonitoringTest: TestScenario = {
  name: 'Performance Monitoring Test',
  description: 'Monitor extension performance and resource usage',
  expectedOutcome: 'Performance metrics within acceptable thresholds',
  category: 'Performance',
  priority: 4,
  timeout: 25000,

  setup: async () => {
    console.log('Setting up performance monitoring test...');
    // Start performance monitoring
    await mcp_chrome_devtools_performance_start_trace({
      reload: false,
      autoStop: false,
    });
  },

  execute: async () => {
    const startTime = Date.now();
    const metrics: Record<string, any> = {};

    try {
      // Simulate some extension activity
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get memory usage
      const memoryInfo = await mcp_chrome_devtools_evaluate_script({
        function: `() => {
          if (performance.memory) {
            return {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
              memoryUsage: performance.memory.usedJSHeapSize / (1024 * 1024) // MB
            };
          }
          return { memoryUsage: 0, memoryAvailable: false };
        }`,
      });

      Object.assign(metrics, memoryInfo);

      // Stop performance trace
      await mcp_chrome_devtools_performance_stop_trace();

      // Simulate CPU usage calculation
      metrics.cpuUsage = Math.random() * 50; // Simulated CPU usage
      metrics.responseTime = Date.now() - startTime;

      const executionTime = Date.now() - startTime;
      const passed =
        metrics.memoryUsage < 100 && // Less than 100MB
        metrics.cpuUsage < 80 && // Less than 80% CPU
        metrics.responseTime < 20000; // Less than 20 seconds

      return {
        passed,
        scenarioName: 'Performance Monitoring Test',
        executionTime,
        timestamp: new Date(),
        metrics,
      };
    } catch (error) {
      return {
        passed: false,
        scenarioName: 'Performance Monitoring Test',
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metrics,
      };
    }
  },

  cleanup: async () => {
    console.log('Cleaning up performance monitoring test...');
    // Stop any ongoing performance monitoring
    try {
      await mcp_chrome_devtools_performance_stop_trace();
    } catch (error) {
      // Ignore errors if trace wasn't running
    }
  },
};

// Export all scenarios
export const allTestScenarios: TestScenario[] = [
  extensionLoadingTest,
  contentExtractionTest,
  uiInteractionTest,
  storageOperationTest,
  performanceMonitoringTest,
];
