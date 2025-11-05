/**
 * Service Worker for Language Learning Chrome Extension
 * Handles extension lifecycle and coordinates between components
 */
import { getMemoryManager, initializeMemoryManagement, shutdownMemoryManagement, } from '../utils/memory-manager.js';
import { initializeOffscreenManagement, shutdownOffscreenManagement, executeOffscreenAITask, } from '../utils/offscreen-manager.js';
import { globalErrorHandler } from '../utils/error-handler.js';
import { processArticle } from '../utils/article-processor.js';
import { GeminiAPIClient } from '../utils/gemini-api.js';
import { getTranslationDebugger } from '../utils/translation-debugger.js';
// Memory manager will handle tab tracking
const memoryManager = getMemoryManager();
/**
 * Extract Chrome-specific error code from error message
 */
function extractChromeErrorCode(error) {
    if (error instanceof Error) {
        // Look for Chrome extension error patterns
        const message = error.message;
        // Common Chrome extension error patterns
        const patterns = [
            /Cannot access contents of url "([^"]+)"/,
            /Cannot access a chrome:\/\/ URL/,
            /Cannot access a chrome-extension:\/\/ URL/,
            /The extensions gallery cannot be scripted/,
            /Cannot access a chrome-search:\/\/ URL/,
            /This page cannot be scripted due to an ExtensionsSettings policy/,
            /Could not load file '([^']+)'/,
            /File not found: ([^\s]+)/,
        ];
        for (const pattern of patterns) {
            if (pattern.test(message)) {
                return message.match(pattern)?.[0] || 'CHROME_ERROR';
            }
        }
        // Generic Chrome API error detection
        if (message.includes('chrome.scripting') ||
            message.includes('executeScript')) {
            return 'CHROME_SCRIPTING_ERROR';
        }
    }
    return undefined;
}
/**
 * Get build timestamp if available
 */
function getBuildTimestamp() {
    try {
        // Try to get build timestamp from manifest or other sources
        const manifest = chrome.runtime.getManifest();
        return manifest.version_name || manifest.version;
    }
    catch {
        return undefined;
    }
}
/**
 * Get recent injection errors for debugging
 */
async function getRecentInjectionErrors(limit = 5) {
    try {
        const sessionData = await chrome.storage.session.get();
        const errors = [];
        for (const [key, value] of Object.entries(sessionData)) {
            if (key.startsWith('injection_error_') &&
                value &&
                typeof value === 'object') {
                errors.push(value);
            }
        }
        // Sort by timestamp (most recent first) and limit results
        return errors.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    }
    catch (error) {
        console.warn('Failed to retrieve injection errors:', error);
        return [];
    }
}
/**
 * Get recent injection successes for debugging
 */
async function getRecentInjectionSuccesses(limit = 5) {
    try {
        const sessionData = await chrome.storage.session.get();
        const successes = [];
        for (const [key, value] of Object.entries(sessionData)) {
            if (key.startsWith('injection_success_') &&
                value &&
                typeof value === 'object') {
                successes.push(value);
            }
        }
        // Sort by timestamp (most recent first) and limit results
        return successes.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    }
    catch (error) {
        console.warn('Failed to retrieve injection successes:', error);
        return [];
    }
}
/**
 * Get comprehensive injection debug information
 */
async function getInjectionDebugInfo() {
    const [recentErrors, recentSuccesses] = await Promise.all([
        getRecentInjectionErrors(10),
        getRecentInjectionSuccesses(10),
    ]);
    // Calculate statistics
    const totalErrors = recentErrors.length;
    const totalSuccesses = recentSuccesses.length;
    const total = totalErrors + totalSuccesses;
    const successRate = total > 0 ? (totalSuccesses / total) * 100 : 0;
    const averageInjectionTime = recentSuccesses.length > 0
        ? recentSuccesses.reduce((sum, success) => sum + success.injectionTime, 0) / recentSuccesses.length
        : 0;
    const manifest = chrome.runtime.getManifest();
    return {
        recentErrors,
        recentSuccesses,
        statistics: {
            totalErrors,
            totalSuccesses,
            successRate: Math.round(successRate * 100) / 100,
            averageInjectionTime: Math.round(averageInjectionTime * 100) / 100,
        },
        systemInfo: {
            manifestVersion: manifest.manifest_version.toString(),
            extensionId: chrome.runtime.id,
            buildVersion: manifest.version,
        },
    };
}
// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) {
        const error = globalErrorHandler.createError('invalid_input', 'No tab ID available for content script injection', false);
        console.error('❌ Extension activation failed:', error.userMessage);
        return;
    }
    try {
        // Check if we can access the tab
        if (!tab.url ||
            tab.url.startsWith('chrome://') ||
            tab.url.startsWith('chrome-extension://') ||
            tab.url.startsWith('chrome-search://') ||
            tab.url.startsWith('edge://') ||
            tab.url.startsWith('about:')) {
            console.warn('⚠️ Cannot process restricted pages:', {
                tabId: tab.id,
                url: tab.url,
                reason: 'Chrome internal or extension page',
                suggestions: [
                    'Try clicking the extension on a regular website',
                    'Navigate to a news article or blog post',
                    'Avoid chrome://, extension://, or about: pages',
                ],
            });
            return;
        }
        console.log('🚀 Starting content script injection:', {
            tabId: tab.id,
            url: tab.url,
            title: tab.title,
        });
        // Inject content script and process the page
        await processCurrentTab(tab.id);
    }
    catch (error) {
        // Enhanced error logging for the main action handler
        const extensionError = globalErrorHandler.normalizeError(error, 'extension activation');
        console.error('❌ Extension activation failed:', {
            tabId: tab.id,
            url: tab.url,
            error: extensionError.userMessage,
            suggestions: extensionError.suggestedAction,
            retryable: extensionError.retryable,
        });
        // Store error for potential user notification
        await chrome.storage.session.set({
            [`activation_error_${tab.id}`]: {
                error: extensionError,
                timestamp: Date.now(),
                tabInfo: {
                    id: tab.id,
                    url: tab.url,
                    title: tab.title,
                },
            },
        });
    }
});
/**
 * Process the current tab and extract article content
 */
async function processCurrentTab(tabId) {
    const scriptPath = 'content/content-script.js';
    const startTime = Date.now();
    // Get tab information for context
    let tabInfo;
    try {
        tabInfo = await chrome.tabs.get(tabId);
    }
    catch (error) {
        console.warn('Could not get tab information:', error);
    }
    try {
        // Inject content script with enhanced error context
        await chrome.scripting.executeScript({
            target: { tabId },
            files: [scriptPath],
        });
        const injectionTime = Date.now() - startTime;
        // Log successful injection with detailed context
        const successInfo = {
            scriptPath,
            tabId,
            tabUrl: tabInfo?.url,
            timestamp: Date.now(),
            injectionTime,
            contextInfo: {
                manifestVersion: chrome.runtime
                    .getManifest()
                    .manifest_version.toString(),
                extensionId: chrome.runtime.id,
            },
        };
        console.log('✅ Content script injection successful:', {
            path: scriptPath,
            tabId,
            url: tabInfo?.url || 'unknown',
            injectionTime: `${injectionTime}ms`,
            timestamp: new Date(successInfo.timestamp).toISOString(),
        });
        // Store success metrics for debugging
        await chrome.storage.session.set({
            [`injection_success_${tabId}`]: successInfo,
        });
    }
    catch (error) {
        const injectionTime = Date.now() - startTime;
        // Create detailed error context
        const injectionError = {
            attemptedPath: scriptPath,
            tabId,
            tabUrl: tabInfo?.url,
            error: error instanceof Error ? error.message : String(error),
            timestamp: Date.now(),
            suggestions: [
                'Verify content script file exists in dist/content/',
                'Check manifest.json content_scripts paths match',
                'Ensure build process completed successfully',
                'Verify tab permissions and URL accessibility',
                'Check Chrome extension file path resolution',
            ],
            chromeErrorCode: extractChromeErrorCode(error),
            contextInfo: {
                manifestVersion: chrome.runtime
                    .getManifest()
                    .manifest_version.toString(),
                extensionId: chrome.runtime.id,
                buildTimestamp: getBuildTimestamp(),
            },
        };
        // Enhanced error logging with structured information
        console.error('❌ Content script injection failed:', {
            path: scriptPath,
            tabId,
            url: tabInfo?.url || 'unknown',
            error: injectionError.error,
            chromeErrorCode: injectionError.chromeErrorCode,
            injectionTime: `${injectionTime}ms`,
            timestamp: new Date(injectionError.timestamp).toISOString(),
            suggestions: injectionError.suggestions,
        });
        // Store error details for debugging and user support
        await chrome.storage.session.set({
            [`injection_error_${tabId}`]: injectionError,
        });
        // Create user-friendly error using the error handler
        const extensionError = globalErrorHandler.createError('processing_failed', `Failed to inject content script: ${injectionError.error}`, true, // retryable
        error instanceof Error ? error : new Error(String(error)));
        // Add specific suggestions for content script injection
        extensionError.suggestedAction =
            'Try refreshing the page or reloading the extension. ' +
                'If the problem persists, check that the extension was built correctly.';
        throw extensionError;
    }
}
/**
 * Handle messages from content scripts and other components
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.type) {
        case 'CONTENT_EXTRACTED':
            handleContentExtracted(message.data)
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
        case 'CHECK_SYSTEM_CAPABILITIES':
            checkSystemCapabilities()
                .then(capabilities => sendResponse({ success: true, data: capabilities }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
        case 'OPEN_LEARNING_INTERFACE':
            openLearningInterface(message.data)
                .then(tabId => sendResponse({ success: true, data: { tabId } }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
        case 'GET_INJECTION_DEBUG_INFO':
            getInjectionDebugInfo()
                .then(debugInfo => sendResponse({ success: true, data: debugInfo }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
        case 'DETECT_LANGUAGE':
            console.log('🎯 [ServiceWorker] DETECT_LANGUAGE case matched, calling handler...');
            console.log('📦 [ServiceWorker] Message data:', message.data || message.payload);
            handleDetectLanguage((message.data || message.payload))
                .then(result => {
                console.log('✅ [ServiceWorker] handleDetectLanguage resolved with:', result);
                sendResponse({ success: true, data: result });
            })
                .catch(error => {
                console.error('❌ [ServiceWorker] handleDetectLanguage rejected with:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true;
        case 'TRANSLATE_TEXT':
            handleTranslateText((message.payload || message.data))
                .then(translation => sendResponse({ success: true, data: { translation } }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
        case 'DEBUG_ENABLE_TRANSLATION':
            handleDebugEnableTranslation()
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
        case 'DEBUG_DISABLE_TRANSLATION':
            handleDebugDisableTranslation()
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
        case 'DEBUG_GET_TRANSLATION_STATS':
            handleDebugGetTranslationStats()
                .then(stats => sendResponse({ success: true, data: stats }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
        case 'DEBUG_GET_TRANSLATION_LOG':
            handleDebugGetTranslationLog()
                .then(log => sendResponse({ success: true, data: log }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
        case 'DEBUG_EXPORT_TRANSLATION_LOG':
            handleDebugExportTranslationLog()
                .then(exported => sendResponse({ success: true, data: exported }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
        case 'DEBUG_CLEAR_TRANSLATION_LOG':
            handleDebugClearTranslationLog()
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
        default:
            return false;
    }
});
/**
 * Handle language detection request
 * Routes detection to offscreen document where Chrome AI APIs are available
 *
 * Exported as handleDetectLanguageInternal for direct calls from service worker context
 */
export async function handleDetectLanguageInternal(payload) {
    return handleDetectLanguage(payload);
}
/**
 * Internal handler for language detection
 */
async function handleDetectLanguage(payload) {
    try {
        console.log(`🌍 [ServiceWorker] DETECT_LANGUAGE request: Analyzing ${payload.text.length} characters`);
        console.log('📄 [ServiceWorker] Text preview:', payload.text.substring(0, 200) + '...');
        // Route language detection to offscreen document where Chrome AI APIs are available
        try {
            console.log('📤 [ServiceWorker] Routing to offscreen document...');
            const result = await executeOffscreenAITask('language_detection', { text: payload.text }, 10000 // 10 second timeout for language detection
            );
            const confidencePercent = (result.confidence * 100).toFixed(2);
            console.log(`✅ [ServiceWorker] Language detection successful (Chrome AI): ${result.language.toUpperCase()} (${confidencePercent}% confidence)`);
            console.log('📥 [ServiceWorker] Full result:', result);
            return result;
        }
        catch (offscreenError) {
            console.error('❌ [ServiceWorker] Offscreen language detection failed:', offscreenError);
            console.error('Error details:', {
                name: offscreenError instanceof Error ? offscreenError.name : 'Unknown',
                message: offscreenError instanceof Error
                    ? offscreenError.message
                    : String(offscreenError),
            });
            console.warn('🔄 [ServiceWorker] Falling back to Gemini API...');
        }
        // Fallback to Gemini API
        const { settings } = await chrome.storage.local.get(['settings']);
        const { apiKeys } = settings || {};
        const geminiKey = apiKeys?.gemini;
        if (!geminiKey) {
            throw new Error('Language Detection API not available and no Gemini API key configured');
        }
        console.log('🔄 Using Gemini API for language detection...');
        const geminiAPI = new GeminiAPIClient({ apiKey: geminiKey });
        const result = await geminiAPI.detectLanguage(payload.text);
        const confidencePercent = (result.confidence * 100).toFixed(2);
        console.log(`✅ Language detection successful (Gemini): ${result.language.toUpperCase()} (${confidencePercent}% confidence)`);
        return result;
    }
    catch (error) {
        console.error('DETECT_LANGUAGE error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(errorMessage);
    }
}
/**
 * Handle text translation request
 * Routes translation to offscreen document where Chrome AI APIs are available
 */
async function handleTranslateText(payload) {
    try {
        // Get user settings and current article language
        const { settings, targetLanguage: userSelectedLanguage, currentArticleLanguage, } = await chrome.storage.local.get([
            'settings',
            'targetLanguage',
            'currentArticleLanguage',
        ]);
        // Determine source language with priority:
        // 1. Explicit sourceLanguage in payload (highest priority)
        // 2. Current article's detected language from session storage
        // 3. User's learningLanguage setting (fallback for backward compatibility)
        const sourceLanguage = payload.sourceLanguage ||
            currentArticleLanguage ||
            settings?.learningLanguage ||
            'es';
        // Use user-selected target language, fallback to settings, then default to 'en'
        const targetLanguage = payload.targetLanguage ||
            userSelectedLanguage ||
            settings?.nativeLanguage ||
            'en';
        // Check if source and target languages are the same
        if (sourceLanguage === targetLanguage) {
            return payload.text;
        }
        // Route translation to offscreen document where Chrome AI APIs are available
        try {
            // Execute translation task in offscreen document
            const translation = await executeOffscreenAITask('translation', {
                text: payload.text,
                sourceLanguage,
                targetLanguage,
                context: payload.context,
            }, 15000 // 15 second timeout for translation
            );
            console.log('Translation successful (Chrome AI via offscreen):', translation);
            return translation;
        }
        catch (offscreenError) {
            console.warn('Offscreen translation failed, falling back to Gemini:', offscreenError);
        }
        // Fallback to Gemini API
        const { apiKeys } = settings || {};
        const geminiKey = apiKeys?.gemini;
        if (!geminiKey) {
            throw new Error('Translation API not available and no Gemini API key configured');
        }
        // Use Gemini API (already imported at top)
        const geminiAPI = new GeminiAPIClient({ apiKey: geminiKey });
        const translation = await geminiAPI.translateText(payload.text, sourceLanguage, targetLanguage);
        return translation;
    }
    catch (error) {
        console.error('TRANSLATE_TEXT error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(errorMessage);
    }
}
/**
 * Handle debug enable translation request
 */
async function handleDebugEnableTranslation() {
    const translationDebugger = getTranslationDebugger();
    await translationDebugger.enableDebugMode();
}
/**
 * Handle debug disable translation request
 */
async function handleDebugDisableTranslation() {
    const translationDebugger = getTranslationDebugger();
    await translationDebugger.disableDebugMode();
}
/**
 * Handle debug get translation stats request
 */
async function handleDebugGetTranslationStats() {
    const translationDebugger = getTranslationDebugger();
    return translationDebugger.getDebugStats();
}
/**
 * Handle debug get translation log request
 */
async function handleDebugGetTranslationLog() {
    const translationDebugger = getTranslationDebugger();
    return translationDebugger.getDebugLog();
}
/**
 * Handle debug export translation log request
 */
async function handleDebugExportTranslationLog() {
    const translationDebugger = getTranslationDebugger();
    return translationDebugger.exportDebugLog();
}
/**
 * Handle debug clear translation log request
 */
async function handleDebugClearTranslationLog() {
    const translationDebugger = getTranslationDebugger();
    await translationDebugger.clearDebugLog();
}
/**
 * Handle extracted content from content script
 */
async function handleContentExtracted(content) {
    console.log('Content extracted:', content);
    try {
        // Process the extracted content into a structured article
        console.log('🔄 === PROCESSING ARTICLE ===');
        console.log('📥 Extracted Content:', {
            title: content.title,
            url: content.url,
            contentLength: content.content.length,
            wordCount: content.wordCount,
            paragraphCount: content.paragraphCount,
            language: content.language,
        });
        // Pass the language detection handler to avoid message passing to self
        const processedArticle = await processArticle(content, handleDetectLanguage);
        console.log('✅ Article processed successfully:', {
            id: processedArticle.id,
            parts: processedArticle.parts.length,
            language: processedArticle.originalLanguage,
            confidence: processedArticle.detectedLanguageConfidence,
            partsBreakdown: processedArticle.parts.map((p, i) => ({
                index: i + 1,
                id: p.id,
                contentLength: p.content.length,
            })),
        });
        console.log('🔄 === END PROCESSING ===\n');
        // Store the processed article temporarily
        await chrome.storage.session.set({
            [`pending_article_${Date.now()}`]: processedArticle,
        });
        // Open learning interface tab with processed article
        await openLearningInterface(processedArticle);
    }
    catch (error) {
        console.error('Failed to process article:', error);
        const processingError = globalErrorHandler.normalizeError(error, 'article processing');
        throw processingError;
    }
}
/**
 * Open learning interface in a new tab
 */
async function openLearningInterface(article) {
    try {
        const tab = await chrome.tabs.create({
            url: chrome.runtime.getURL('ui/learning-interface.html'),
            active: true,
        });
        if (!tab.id) {
            throw new Error('Failed to create tab');
        }
        // Register tab with memory manager
        memoryManager.registerTab(tab.id);
        // Store processed article for the new tab to retrieve
        await chrome.storage.session.set({
            [`article_${tab.id}`]: article,
        });
        // Store the article's detected language globally for translation
        await chrome.storage.local.set({
            currentArticleLanguage: article.originalLanguage,
        });
        console.log(`Article stored for tab ${tab.id}:`, {
            id: article.id,
            title: article.title,
            parts: article.parts.length,
            language: article.originalLanguage,
        });
        return tab.id;
    }
    catch (error) {
        console.error('Failed to open learning interface:', error);
        throw error;
    }
}
/**
 * Check system capabilities for Chrome AI APIs
 */
async function checkSystemCapabilities() {
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
    try {
        // Check for window.ai APIs (Summarizer, Rewriter, Prompt API)
        if ('ai' in self) {
            capabilities.hasChromeAI = true;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ai = self.ai;
            capabilities.hasSummarizer = 'summarizer' in ai;
            capabilities.hasRewriter = 'rewriter' in ai;
            capabilities.hasPromptAPI = 'languageModel' in ai;
        }
        // Check for global APIs (Translator, LanguageDetector)
        // Note: These are NOT under window.ai
        capabilities.hasTranslator =
            typeof self.Translator !== 'undefined';
        capabilities.hasLanguageDetector =
            typeof self.LanguageDetector !== 'undefined';
        // Try to get hardware info if available
        if ('navigator' in self && 'deviceMemory' in navigator) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            capabilities.hardwareInfo.ram = `${navigator.deviceMemory} GB`;
        }
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            if (estimate.quota) {
                capabilities.hardwareInfo.storage = `${Math.round(estimate.quota / 1024 ** 3)} GB`;
            }
        }
    }
    catch (error) {
        console.error('Error checking system capabilities:', error);
    }
    return capabilities;
}
// Tab removal is now handled by memory manager automatically
/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        console.log('Extension installed, checking system capabilities...');
        const capabilities = await checkSystemCapabilities();
        console.log('System capabilities:', capabilities);
        // Set default settings
        await chrome.storage.local.set({
            settings: {
                nativeLanguage: 'en',
                learningLanguage: 'es',
                difficultyLevel: 5,
                autoHighlight: false,
                darkMode: false,
                fontSize: 16,
                apiKeys: {},
            },
        });
    }
    // Initialize memory and offscreen management
    await initializeMemoryManagement();
    await initializeOffscreenManagement();
});
/**
 * Handle extension shutdown
 */
chrome.runtime.onSuspend.addListener(async () => {
    console.log('Extension suspending, cleaning up resources...');
    await shutdownMemoryManagement();
    await shutdownOffscreenManagement();
});
// Initialize extension
console.log('Language Learning Extension service worker initialized');
//# sourceMappingURL=service-worker.js.map