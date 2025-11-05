/**
 * Offscreen AI Processor - Handles AI processing tasks in offscreen document
 * Implements Requirements: 10.5, 10.6
 */
import { getChromeAI } from '../utils/chrome-ai.js';
import { GeminiAPIClient } from '../utils/gemini-api.js';
// ============================================================================
// AI Processing in Offscreen Context
// ============================================================================
class OffscreenAIProcessor {
    chromeAI = getChromeAI();
    geminiAPI = new GeminiAPIClient({
        apiKey: '', // Will be set from user settings
        model: 'gemini-pro',
    });
    isReady = false;
    constructor() {
        void this.initialize();
    }
    /**
     * Initialize the processor
     */
    async initialize() {
        try {
            // Check Chrome AI availability
            const availability = await this.chromeAI.checkAvailability();
            console.log('Chrome AI availability:', availability);
            this.isReady = true;
            // Notify that we're ready
            void chrome.runtime.sendMessage({
                type: 'OFFSCREEN_READY',
                timestamp: Date.now(),
            });
            console.log('Offscreen AI processor initialized');
        }
        catch (error) {
            console.error('Failed to initialize offscreen AI processor:', error);
        }
    }
    /**
     * Process AI task
     */
    async processTask(taskId, taskType, data) {
        if (!this.isReady) {
            throw new Error('AI processor not ready');
        }
        try {
            let result;
            switch (taskType) {
                case 'language_detection':
                    result = await this.processLanguageDetection(data);
                    break;
                case 'summarization':
                    result = await this.processSummarization(data);
                    break;
                case 'translation':
                    result = await this.processTranslation(data);
                    break;
                case 'vocabulary_analysis':
                    result = await this.processVocabularyAnalysis(data);
                    break;
                case 'content_rewriting':
                    result = await this.processContentRewriting(data);
                    break;
                default:
                    throw new Error(`Unknown task type: ${taskType}`);
            }
            // Send result back
            void chrome.runtime.sendMessage({
                type: 'OFFSCREEN_TASK_RESULT',
                taskId,
                result,
            });
            return result;
        }
        catch (error) {
            console.error(`Task ${taskId} failed:`, error);
            // Send error back
            void chrome.runtime.sendMessage({
                type: 'OFFSCREEN_TASK_RESULT',
                taskId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Process language detection
     */
    async processLanguageDetection(data) {
        console.log('🔬 [Offscreen] Processing language detection...');
        console.log('📊 Input data:', {
            textLength: data.text.length,
            textPreview: data.text.substring(0, 150) + '...',
            wordCount: data.text.split(/\s+/).length,
        });
        try {
            console.log('🎯 [Offscreen] Attempting Chrome AI language detection...');
            const result = await this.chromeAI.detectLanguage(data.text);
            console.log('✅ [Offscreen] Chrome AI detection successful:', result);
            return result;
        }
        catch (error) {
            // Fallback to Gemini API
            console.error('❌ [Offscreen] Chrome AI language detection failed:', error);
            console.error('Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
            });
            console.warn('🔄 [Offscreen] Trying Gemini API fallback...');
            try {
                const result = await this.geminiAPI.detectLanguage(data.text);
                console.log('✅ [Offscreen] Gemini API detection successful:', result);
                return result;
            }
            catch (geminiError) {
                console.error('❌ [Offscreen] Gemini API also failed:', geminiError);
                throw geminiError;
            }
        }
    }
    /**
     * Process content summarization
     */
    async processSummarization(data) {
        try {
            const options = data.options || {};
            return await this.chromeAI.summarizeContent(data.text, {
                maxLength: options.maxLength,
                format: options.format === 'bullet' ? 'bullet' : 'paragraph',
            });
        }
        catch {
            // Fallback to Gemini API
            console.warn('Chrome AI summarization failed, trying Gemini API');
            const options = data.options || {};
            return await this.geminiAPI.summarizeContent(data.text, {
                maxLength: options.maxLength,
                format: options.format === 'bullet' ? 'bullet' : 'paragraph',
            });
        }
    }
    /**
     * Process translation
     */
    async processTranslation(data) {
        try {
            return await this.chromeAI.translateText(data.text, data.sourceLanguage, data.targetLanguage);
        }
        catch {
            // Fallback to Gemini API
            console.warn('Chrome AI translation failed, trying Gemini API');
            return await this.geminiAPI.translateText(data.text, data.sourceLanguage, data.targetLanguage);
        }
    }
    /**
     * Process vocabulary analysis
     */
    async processVocabularyAnalysis(data) {
        try {
            return await this.chromeAI.analyzeVocabulary(data.words, data.context);
        }
        catch {
            // Fallback to Gemini API
            console.warn('Chrome AI vocabulary analysis failed, trying Gemini API');
            return await this.geminiAPI.analyzeVocabulary(data.words, data.context);
        }
    }
    /**
     * Process content rewriting
     */
    async processContentRewriting(data) {
        try {
            return await this.chromeAI.rewriteContent(data.text, data.difficulty);
        }
        catch {
            // Fallback to Gemini API
            console.warn('Chrome AI rewriting failed, trying Gemini API');
            return await this.geminiAPI.rewriteContent(data.text, data.difficulty);
        }
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        try {
            this.chromeAI.destroy();
            console.log('Offscreen AI processor cleaned up');
        }
        catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}
// ============================================================================
// Message Handling
// ============================================================================
let processor = null;
// Initialize processor
processor = new OffscreenAIProcessor();
// Handle messages from service worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'OFFSCREEN_TASK' && processor) {
        // Extract the actual task type
        // If taskType is 'ai_processing', use the taskType from data
        const actualTaskType = message.taskType === 'ai_processing' && message.data?.taskType
            ? message.data.taskType
            : message.taskType;
        // Process task asynchronously
        processor
            .processTask(message.taskId, actualTaskType, message.data)
            .then(() => {
            // Task result is sent via separate message
            sendResponse({ success: true });
        })
            .catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true; // Keep message channel open for async response
    }
    if (message.type === 'OFFSCREEN_CLEANUP') {
        if (processor) {
            processor.cleanup();
            processor = null;
        }
        sendResponse({ success: true });
        return true;
    }
    return false;
});
// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (processor) {
        processor.cleanup();
    }
});
console.log('Offscreen AI processor script loaded');
//# sourceMappingURL=ai-processor.js.map