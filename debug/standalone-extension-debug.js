/**
 * Standalone Extension Debug Script
 * Run this in your regular Chrome's DevTools console to debug the extension
 */

(function () {
  'use strict';

  console.log('🔍 Starting Language Learning Extension Debug...');

  // Debug utilities
  const debug = {
    log: (message, data) => {
      console.log(`🔍 [Extension Debug] ${message}`, data || '');
    },
    error: (message, error) => {
      console.error(`❌ [Extension Debug] ${message}`, error || '');
    },
    success: (message, data) => {
      console.log(`✅ [Extension Debug] ${message}`, data || '');
    },
  };

  // Check Chrome Extension APIs
  function checkExtensionAPIs() {
    debug.log('Checking Chrome Extension APIs...');

    const apis = {
      chrome: typeof chrome !== 'undefined',
      runtime: typeof chrome?.runtime !== 'undefined',
      storage: typeof chrome?.storage !== 'undefined',
      tabs: typeof chrome?.tabs !== 'undefined',
      scripting: typeof chrome?.scripting !== 'undefined',
      action: typeof chrome?.action !== 'undefined',
    };

    debug.log('API Availability:', apis);
    return apis;
  }

  // Check Chrome AI APIs
  function checkChromeAI() {
    debug.log('Checking Chrome AI APIs...');

    const aiAPIs = {
      hasAI: 'ai' in window,
      hasSummarizer: 'ai' in window && 'summarizer' in window.ai,
      hasTranslator: 'ai' in window && 'translator' in window.ai,
      hasRewriter: 'ai' in window && 'rewriter' in window.ai,
      hasLanguageDetector: 'ai' in window && 'languageDetector' in window.ai,
    };

    debug.log('Chrome AI APIs:', aiAPIs);
    return aiAPIs;
  }

  // Test Chrome AI Summarizer
  async function testSummarizer() {
    debug.log('Testing Chrome AI Summarizer...');

    try {
      if (!('ai' in window) || !('summarizer' in window.ai)) {
        debug.error('Chrome AI Summarizer not available');
        return false;
      }

      const summarizer = await window.ai.summarizer.create();
      debug.log('Summarizer created:', summarizer);

      const testText =
        'This is a test article about machine learning. Machine learning is a subset of artificial intelligence that focuses on algorithms and statistical models.';
      const summary = await summarizer.summarize(testText);

      debug.success('Summarizer test successful:', summary);
      summarizer.destroy();
      return true;
    } catch (error) {
      debug.error('Summarizer test failed:', error);
      return false;
    }
  }

  // Check Extension Storage
  async function checkExtensionStorage() {
    debug.log('Checking Extension Storage...');

    try {
      if (!chrome?.storage?.local) {
        debug.error('Chrome storage API not available');
        return false;
      }

      // Test storage write
      await chrome.storage.local.set({ debugTest: Date.now() });
      debug.success('Storage write test passed');

      // Test storage read
      const result = await chrome.storage.local.get('debugTest');
      debug.success('Storage read test passed:', result);

      // Clean up
      await chrome.storage.local.remove('debugTest');
      debug.success('Storage cleanup completed');

      return true;
    } catch (error) {
      debug.error('Storage test failed:', error);
      return false;
    }
  }

  // Check Content Script Injection
  async function checkContentScriptInjection() {
    debug.log('Checking Content Script Injection...');

    try {
      if (!chrome?.tabs || !chrome?.scripting) {
        debug.error('Chrome tabs/scripting API not available');
        return false;
      }

      // Get current tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab.id) {
        debug.error('No active tab found');
        return false;
      }

      debug.log('Current tab:', { id: tab.id, url: tab.url, title: tab.title });

      // Test script injection
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            url: window.location.href,
            title: document.title,
            hasContentScript: window.hasOwnProperty('contentScriptLoaded'),
            timestamp: Date.now(),
          };
        },
      });

      debug.success('Content script injection test passed:', results[0].result);
      return true;
    } catch (error) {
      debug.error('Content script injection test failed:', error);
      return false;
    }
  }

  // Check Extension Manifest
  function checkExtensionManifest() {
    debug.log('Checking Extension Manifest...');

    try {
      if (!chrome?.runtime?.getManifest) {
        debug.error('Chrome runtime API not available');
        return false;
      }

      const manifest = chrome.runtime.getManifest();
      debug.success('Extension manifest:', {
        name: manifest.name,
        version: manifest.version,
        manifest_version: manifest.manifest_version,
        permissions: manifest.permissions,
        host_permissions: manifest.host_permissions,
      });

      return true;
    } catch (error) {
      debug.error('Manifest check failed:', error);
      return false;
    }
  }

  // Run comprehensive debug
  async function runComprehensiveDebug() {
    debug.log('🚀 Starting Comprehensive Extension Debug...');

    const results = {
      apis: checkExtensionAPIs(),
      manifest: checkExtensionManifest(),
      chromeAI: checkChromeAI(),
      storage: await checkExtensionStorage(),
      contentScript: await checkContentScriptInjection(),
      summarizer: await testSummarizer(),
    };

    debug.log('📊 Debug Results Summary:', results);

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    if (passedTests === totalTests) {
      debug.success(`🎉 All tests passed! (${passedTests}/${totalTests})`);
    } else {
      debug.error(`⚠️ Some tests failed: ${passedTests}/${totalTests} passed`);
    }

    return results;
  }

  // Expose debug functions globally
  window.extensionDebug = {
    checkAPIs: checkExtensionAPIs,
    checkChromeAI: checkChromeAI,
    testSummarizer: testSummarizer,
    checkStorage: checkExtensionStorage,
    checkContentScript: checkContentScriptInjection,
    checkManifest: checkExtensionManifest,
    runAll: runComprehensiveDebug,
  };

  debug.success(
    'Extension debug utilities loaded! Use window.extensionDebug to access functions.'
  );
  debug.log('Available functions:', Object.keys(window.extensionDebug));
  debug.log('Run window.extensionDebug.runAll() for comprehensive testing');
})();
