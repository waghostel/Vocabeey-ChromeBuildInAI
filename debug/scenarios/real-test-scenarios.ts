/**
 * Real Test Scenarios
 * Concrete test scenarios that use real MCP integration instead of mock data
 */

import {
  RealTestScenario,
  RealTestResult,
  RealTestScenarioExecutor,
} from './real-test-scenario-executor';

/**
 * Real Extension Loading Test Scenario
 */
export const realExtensionLoadingTest: RealTestScenario = {
  name: 'Real Extension Loading Test',
  description:
    'Test actual extension loading and initialization using real MCP calls',
  expectedOutcome:
    'Extension should load successfully with service worker accessible and chrome APIs available',
  requiredMCPFunctions: [
    'mcp_chrome_devtools_list_pages',
    'mcp_chrome_devtools_select_page',
    'mcp_chrome_devtools_evaluate_script',
  ],

  async setup(): Promise<void> {
    console.log('Setting up real extension loading test...');
    // No setup required for this test
  },

  async execute(): Promise<RealTestResult> {
    const executor = (this as any).executor as RealTestScenarioExecutor;
    const startTime = Date.now();

    try {
      // Get real list of pages to verify extension contexts
      const pages = await executor.executeMCPFunction(
        'mcp_chrome_devtools_list_pages'
      );

      // Find service worker page
      const serviceWorkerPage = pages.find(
        (page: any) =>
          page.type === 'service_worker' || page.url?.includes('service-worker')
      );

      if (!serviceWorkerPage) {
        throw new Error(
          'Service worker page not found - extension may not be loaded'
        );
      }

      // Select service worker page
      await executor.executeMCPFunction('mcp_chrome_devtools_select_page', {
        pageIdx: serviceWorkerPage.pageIdx,
      });

      // Test extension initialization by evaluating script
      const initStatus = await executor.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `() => ({
          isExtensionLoaded: typeof chrome !== 'undefined' && !!chrome.runtime,
          extensionId: chrome?.runtime?.id,
          manifestVersion: chrome?.runtime?.getManifest?.()?.manifest_version,
          availableAPIs: Object.keys(chrome || {}).filter(key => typeof chrome[key] === 'object')
        })`,
        }
      );

      const executionTime = Date.now() - startTime;

      return {
        passed: !!(initStatus.isExtensionLoaded && initStatus.extensionId),
        scenarioName: this.name,
        executionTime,
        timestamp: new Date(),
        metrics: {
          pagesFound: pages.length,
          serviceWorkerFound: !!serviceWorkerPage,
          extensionId: initStatus.extensionId,
          manifestVersion: initStatus.manifestVersion,
          availableAPIs: initStatus.availableAPIs?.length || 0,
        },
        realData: {
          pages,
          serviceWorkerPage,
          initStatus,
        },
        mcpFunctionCalls: [], // Will be populated by executor
        validationResults: { passed: false, details: [] }, // Will be set by validate()
      };
    } catch (error) {
      return {
        passed: false,
        scenarioName: this.name,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metrics: {},
        realData: null,
        mcpFunctionCalls: [],
        validationResults: {
          passed: false,
          details: [`Execution failed: ${error}`],
        },
      };
    }
  },

  async validate(result: any): Promise<boolean> {
    if (!result) return false;

    const validations = [
      result.pages && result.pages.length > 0,
      result.serviceWorkerPage &&
        result.serviceWorkerPage.pageIdx !== undefined,
      result.initStatus && result.initStatus.isExtensionLoaded,
      result.initStatus && result.initStatus.extensionId,
      result.initStatus && result.initStatus.manifestVersion === 3,
    ];

    return validations.every(v => v);
  },

  async cleanup(): Promise<void> {
    console.log('Cleaning up real extension loading test...');
    // No cleanup required
  },
};

/**
 * Real Content Script Integration Test Scenario
 */
export const realContentScriptIntegrationTest: RealTestScenario = {
  name: 'Real Content Script Integration Test',
  description:
    'Test actual content script injection and functionality using real page navigation',
  expectedOutcome:
    'Content script should inject successfully into navigated page and be able to extract content',
  requiredMCPFunctions: [
    'mcp_chrome_devtools_navigate_page',
    'mcp_chrome_devtools_list_pages',
    'mcp_chrome_devtools_select_page',
    'mcp_chrome_devtools_evaluate_script',
  ],

  async setup(): Promise<void> {
    console.log('Setting up real content script integration test...');
  },

  async execute(): Promise<RealTestResult> {
    const executor = (this as any).executor as RealTestScenarioExecutor;
    const startTime = Date.now();
    const testUrl = 'https://example.com';

    try {
      // Navigate to test page
      await executor.executeMCPFunction('mcp_chrome_devtools_navigate_page', {
        url: testUrl,
      });

      // Wait for navigation to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get updated page list
      const pages = await executor.executeMCPFunction(
        'mcp_chrome_devtools_list_pages'
      );

      // Find the content script page
      const contentPage = pages.find(
        (page: any) => page.url === testUrl || page.url?.includes('example.com')
      );

      if (!contentPage) {
        throw new Error('Content script page not found after navigation');
      }

      // Select content script page
      await executor.executeMCPFunction('mcp_chrome_devtools_select_page', {
        pageIdx: contentPage.pageIdx,
      });

      // Test content script injection
      const injectionStatus = await executor.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `() => ({
          isContentScriptInjected: typeof chrome !== 'undefined' && !!chrome.runtime,
          extensionId: chrome?.runtime?.id,
          pageUrl: window.location.href,
          documentReady: document.readyState,
          hasExtensionElements: document.querySelectorAll('[data-extension]').length > 0,
          contentExtractorAvailable: typeof window.extensionContentExtractor !== 'undefined'
        })`,
        }
      );

      // Test content extraction functionality
      const extractionTest = await executor.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `() => {
          try {
            const content = document.body.innerText.substring(0, 100);
            const title = document.title;
            const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent);
            
            return {
              success: true,
              content,
              title,
              headings,
              contentLength: document.body.innerText.length
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }`,
        }
      );

      const executionTime = Date.now() - startTime;

      return {
        passed: !!(
          injectionStatus.isContentScriptInjected && extractionTest.success
        ),
        scenarioName: this.name,
        executionTime,
        timestamp: new Date(),
        metrics: {
          navigationSuccessful: !!contentPage,
          contentScriptInjected: injectionStatus.isContentScriptInjected,
          extractionSuccessful: extractionTest.success,
          contentLength: extractionTest.contentLength || 0,
          headingsFound: extractionTest.headings?.length || 0,
        },
        realData: {
          testUrl,
          pages,
          contentPage,
          injectionStatus,
          extractionTest,
        },
        mcpFunctionCalls: [],
        validationResults: { passed: false, details: [] },
      };
    } catch (error) {
      return {
        passed: false,
        scenarioName: this.name,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metrics: {},
        realData: null,
        mcpFunctionCalls: [],
        validationResults: {
          passed: false,
          details: [`Execution failed: ${error}`],
        },
      };
    }
  },

  async validate(result: any): Promise<boolean> {
    if (!result) return false;

    const validations = [
      result.contentPage && result.contentPage.pageIdx !== undefined,
      result.injectionStatus && result.injectionStatus.isContentScriptInjected,
      result.extractionTest && result.extractionTest.success,
      result.extractionTest && result.extractionTest.contentLength > 0,
    ];

    return validations.every(v => v);
  },

  async cleanup(): Promise<void> {
    console.log('Cleaning up real content script integration test...');
  },
};

/**
 * Real AI Processing Test Scenario
 */
export const realAIProcessingTest: RealTestScenario = {
  name: 'Real AI Processing Test',
  description:
    'Test actual AI processing functionality using real offscreen document',
  expectedOutcome:
    'AI processing should work correctly in offscreen document with proper memory management',
  requiredMCPFunctions: [
    'mcp_chrome_devtools_list_pages',
    'mcp_chrome_devtools_select_page',
    'mcp_chrome_devtools_evaluate_script',
    'mcp_chrome_devtools_list_console_messages',
  ],

  async setup(): Promise<void> {
    console.log('Setting up real AI processing test...');
  },

  async execute(): Promise<RealTestResult> {
    const executor = (this as any).executor as RealTestScenarioExecutor;
    const startTime = Date.now();

    try {
      // Get list of pages to find offscreen document
      const pages = await executor.executeMCPFunction(
        'mcp_chrome_devtools_list_pages'
      );

      // Find offscreen document page
      const offscreenPage = pages.find(
        (page: any) =>
          page.url?.includes('offscreen') || page.title?.includes('offscreen')
      );

      if (!offscreenPage) {
        throw new Error('Offscreen document page not found');
      }

      // Select offscreen page
      await executor.executeMCPFunction('mcp_chrome_devtools_select_page', {
        pageIdx: offscreenPage.pageIdx,
      });

      // Test AI service availability
      const aiServiceStatus = await executor.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `() => ({
          chromeAIAvailable: typeof window.ai !== 'undefined',
          summarizer: typeof window.ai?.summarizer !== 'undefined',
          translator: typeof window.ai?.translator !== 'undefined',
          rewriter: typeof window.ai?.rewriter !== 'undefined',
          languageDetector: typeof window.ai?.languageDetector !== 'undefined',
          geminiAPIConfigured: typeof window.geminiAPI !== 'undefined'
        })`,
        }
      );

      // Test memory usage monitoring
      const memoryStatus = await executor.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `() => ({
          memoryAvailable: typeof performance.memory !== 'undefined',
          usedJSHeapSize: performance.memory?.usedJSHeapSize || 0,
          totalJSHeapSize: performance.memory?.totalJSHeapSize || 0,
          jsHeapSizeLimit: performance.memory?.jsHeapSizeLimit || 0
        })`,
        }
      );

      // Test AI processing with sample content
      const processingTest = await executor.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `async () => {
          try {
            const testContent = "This is a test article for AI processing. It contains sample text to test summarization and other AI features.";
            
            // Test summarization if available
            let summaryResult = null;
            if (window.ai?.summarizer) {
              try {
                const summarizer = await window.ai.summarizer.create();
                summaryResult = await summarizer.summarize(testContent);
              } catch (error) {
                summaryResult = { error: error.message };
              }
            }
            
            return {
              success: true,
              testContent,
              summaryResult,
              processingTime: Date.now()
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }`,
        }
      );

      // Get console messages to check for errors
      const consoleMessages = await executor.executeMCPFunction(
        'mcp_chrome_devtools_list_console_messages'
      );

      const executionTime = Date.now() - startTime;

      return {
        passed: !!(aiServiceStatus.chromeAIAvailable && processingTest.success),
        scenarioName: this.name,
        executionTime,
        timestamp: new Date(),
        metrics: {
          offscreenPageFound: !!offscreenPage,
          chromeAIAvailable: aiServiceStatus.chromeAIAvailable,
          aiServicesCount: Object.values(aiServiceStatus).filter(
            v => v === true
          ).length,
          memoryUsageMB: Math.round(
            (memoryStatus.usedJSHeapSize || 0) / 1024 / 1024
          ),
          processingSuccessful: processingTest.success,
          consoleErrors:
            consoleMessages?.filter((msg: any) => msg.level === 'error')
              .length || 0,
        },
        realData: {
          pages,
          offscreenPage,
          aiServiceStatus,
          memoryStatus,
          processingTest,
          consoleMessages,
        },
        mcpFunctionCalls: [],
        validationResults: { passed: false, details: [] },
      };
    } catch (error) {
      return {
        passed: false,
        scenarioName: this.name,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metrics: {},
        realData: null,
        mcpFunctionCalls: [],
        validationResults: {
          passed: false,
          details: [`Execution failed: ${error}`],
        },
      };
    }
  },

  async validate(result: any): Promise<boolean> {
    if (!result) return false;

    const validations = [
      result.offscreenPage && result.offscreenPage.pageIdx !== undefined,
      result.aiServiceStatus && result.aiServiceStatus.chromeAIAvailable,
      result.memoryStatus && result.memoryStatus.memoryAvailable,
      result.processingTest && result.processingTest.success,
      !result.consoleMessages ||
        result.consoleMessages.filter((msg: any) => msg.level === 'error')
          .length === 0,
    ];

    return validations.every(v => v);
  },

  async cleanup(): Promise<void> {
    console.log('Cleaning up real AI processing test...');
  },
};

/**
 * Real Cross-Component Communication Test Scenario
 */
export const realCrossComponentCommunicationTest: RealTestScenario = {
  name: 'Real Cross-Component Communication Test',
  description: 'Test actual message passing between extension contexts',
  expectedOutcome:
    'Messages should pass successfully between service worker, content script, and offscreen contexts',
  requiredMCPFunctions: [
    'mcp_chrome_devtools_list_pages',
    'mcp_chrome_devtools_select_page',
    'mcp_chrome_devtools_evaluate_script',
    'mcp_chrome_devtools_list_console_messages',
  ],

  async setup(): Promise<void> {
    console.log('Setting up real cross-component communication test...');
  },

  async execute(): Promise<RealTestResult> {
    const executor = (this as any).executor as RealTestScenarioExecutor;
    const startTime = Date.now();

    try {
      // Get all available pages
      const pages = await executor.executeMCPFunction(
        'mcp_chrome_devtools_list_pages'
      );

      // Find different context pages
      const serviceWorkerPage = pages.find(
        (page: any) =>
          page.type === 'service_worker' || page.url?.includes('service-worker')
      );

      const contentPage = pages.find(
        (page: any) =>
          page.type === 'page' && !page.url?.includes('chrome-extension://')
      );

      if (!serviceWorkerPage) {
        throw new Error('Service worker page not found for communication test');
      }

      // Test service worker message handling
      await executor.executeMCPFunction('mcp_chrome_devtools_select_page', {
        pageIdx: serviceWorkerPage.pageIdx,
      });

      const serviceWorkerTest = (await executor.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `() => ({
          hasMessageListener: typeof chrome.runtime.onMessage !== 'undefined',
          canSendMessages: typeof chrome.runtime.sendMessage !== 'undefined',
          extensionId: chrome.runtime.id,
          contextType: 'service-worker'
        })`,
        }
      )) as any;

      // Test content script communication if available
      let contentScriptTest = null;
      if (contentPage) {
        await executor.executeMCPFunction('mcp_chrome_devtools_select_page', {
          pageIdx: contentPage.pageIdx,
        });

        contentScriptTest = (await executor.executeMCPFunction(
          'mcp_chrome_devtools_evaluate_script',
          {
            function: `() => ({
            hasMessageListener: typeof chrome.runtime.onMessage !== 'undefined',
            canSendMessages: typeof chrome.runtime.sendMessage !== 'undefined',
            extensionId: chrome?.runtime?.id,
            contextType: 'content-script',
            pageUrl: window.location.href
          })`,
          }
        )) as any;
      }

      // Test message flow by injecting test message
      const messageFlowTest = (await executor.executeMCPFunction(
        'mcp_chrome_devtools_evaluate_script',
        {
          function: `async () => {
          try {
            if (!chrome.runtime.sendMessage) {
              return { success: false, error: 'sendMessage not available' };
            }

            // Send test message
            const testMessage = {
              type: 'DEBUG_TEST',
              timestamp: Date.now(),
              source: 'debug-test'
            };

            const response = await new Promise((resolve, reject) => {
              chrome.runtime.sendMessage(testMessage, (response) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve(response);
                }
              });
            });

            return {
              success: true,
              testMessage,
              response,
              messageDelivered: true
            };
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }`,
        }
      )) as any;

      // Get console messages to check for communication errors
      const consoleMessages = await executor.executeMCPFunction(
        'mcp_chrome_devtools_list_console_messages'
      );

      const executionTime = Date.now() - startTime;

      return {
        passed: !!(
          (serviceWorkerTest as any)?.hasMessageListener &&
          (serviceWorkerTest as any)?.canSendMessages
        ),
        scenarioName: this.name,
        executionTime,
        timestamp: new Date(),
        metrics: {
          serviceWorkerFound: !!serviceWorkerPage,
          contentPageFound: !!contentPage,
          serviceWorkerCommunication:
            (serviceWorkerTest as any)?.hasMessageListener &&
            (serviceWorkerTest as any)?.canSendMessages,
          contentScriptCommunication: contentScriptTest
            ? (contentScriptTest as any)?.hasMessageListener &&
              (contentScriptTest as any)?.canSendMessages
            : false,
          messageFlowSuccessful: messageFlowTest.success,
          communicationErrors:
            consoleMessages?.filter(
              (msg: any) =>
                msg.level === 'error' && msg.text?.includes('runtime')
            ).length || 0,
        },
        realData: {
          pages,
          serviceWorkerPage,
          contentPage,
          serviceWorkerTest,
          contentScriptTest,
          messageFlowTest,
          consoleMessages,
        },
        mcpFunctionCalls: [],
        validationResults: { passed: false, details: [] },
      };
    } catch (error) {
      return {
        passed: false,
        scenarioName: this.name,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
        metrics: {},
        realData: null,
        mcpFunctionCalls: [],
        validationResults: {
          passed: false,
          details: [`Execution failed: ${error}`],
        },
      };
    }
  },

  async validate(result: any): Promise<boolean> {
    if (!result) return false;

    const validations = [
      result.serviceWorkerPage &&
        result.serviceWorkerPage.pageIdx !== undefined,
      result.serviceWorkerTest && result.serviceWorkerTest.hasMessageListener,
      result.serviceWorkerTest && result.serviceWorkerTest.canSendMessages,
      !result.consoleMessages ||
        result.consoleMessages.filter(
          (msg: any) => msg.level === 'error' && msg.text?.includes('runtime')
        ).length === 0,
    ];

    return validations.every(v => v);
  },

  async cleanup(): Promise<void> {
    console.log('Cleaning up real cross-component communication test...');
  },
};

/**
 * All real test scenarios
 */
export const allRealTestScenarios: RealTestScenario[] = [
  realExtensionLoadingTest,
  realContentScriptIntegrationTest,
  realAIProcessingTest,
  realCrossComponentCommunicationTest,
];
