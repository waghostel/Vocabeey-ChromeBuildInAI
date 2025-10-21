/**
 * Offscreen AI Processor - Handles AI processing tasks in offscreen document
 * Implements Requirements: 10.5, 10.6
 */

import { getChromeAI } from '../utils/chrome-ai';
import { GeminiAPIClient } from '../utils/gemini-api';

// ============================================================================
// AI Processing in Offscreen Context
// ============================================================================

class OffscreenAIProcessor {
  private chromeAI = getChromeAI();
  private geminiAPI = new GeminiAPIClient({
    apiKey: '', // Will be set from user settings
    model: 'gemini-pro',
  });
  private isReady = false;

  constructor() {
    void this.initialize();
  }

  /**
   * Initialize the processor
   */
  private async initialize(): Promise<void> {
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
    } catch (error) {
      console.error('Failed to initialize offscreen AI processor:', error);
    }
  }

  /**
   * Process AI task
   */
  async processTask(taskId: string, taskType: string, data: any): Promise<any> {
    if (!this.isReady) {
      throw new Error('AI processor not ready');
    }

    try {
      let result: any;

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
    } catch (error) {
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
  private async processLanguageDetection(data: {
    text: string;
  }): Promise<string> {
    try {
      return await this.chromeAI.detectLanguage(data.text);
    } catch {
      // Fallback to Gemini API
      console.warn('Chrome AI language detection failed, trying Gemini API');
      return await this.geminiAPI.detectLanguage(data.text);
    }
  }

  /**
   * Process content summarization
   */
  private async processSummarization(data: {
    text: string;
    options?: { maxLength?: number; format?: string };
  }): Promise<string> {
    try {
      const options = data.options || {};
      return await this.chromeAI.summarizeContent(data.text, {
        maxLength: options.maxLength,
        format: options.format === 'bullet' ? 'bullet' : 'paragraph',
      });
    } catch {
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
  private async processTranslation(data: {
    text: string;
    sourceLanguage: string;
    targetLanguage: string;
    context?: string;
  }): Promise<string> {
    try {
      return await this.chromeAI.translateText(
        data.text,
        data.sourceLanguage,
        data.targetLanguage
      );
    } catch {
      // Fallback to Gemini API
      console.warn('Chrome AI translation failed, trying Gemini API');
      return await this.geminiAPI.translateText(
        data.text,
        data.sourceLanguage,
        data.targetLanguage
      );
    }
  }

  /**
   * Process vocabulary analysis
   */
  private async processVocabularyAnalysis(data: {
    words: string[];
    context: string;
  }): Promise<any[]> {
    try {
      return await this.chromeAI.analyzeVocabulary(data.words, data.context);
    } catch {
      // Fallback to Gemini API
      console.warn('Chrome AI vocabulary analysis failed, trying Gemini API');
      return await this.geminiAPI.analyzeVocabulary(data.words, data.context);
    }
  }

  /**
   * Process content rewriting
   */
  private async processContentRewriting(data: {
    text: string;
    difficulty: number;
  }): Promise<string> {
    try {
      return await this.chromeAI.rewriteContent(data.text, data.difficulty);
    } catch {
      // Fallback to Gemini API
      console.warn('Chrome AI rewriting failed, trying Gemini API');
      return await this.geminiAPI.rewriteContent(data.text, data.difficulty);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    try {
      this.chromeAI.destroy();
      console.log('Offscreen AI processor cleaned up');
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// ============================================================================
// Message Handling
// ============================================================================

let processor: OffscreenAIProcessor | null = null;

// Initialize processor
processor = new OffscreenAIProcessor();

// Handle messages from service worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OFFSCREEN_TASK' && processor) {
    // Process task asynchronously
    processor
      .processTask(message.taskId, message.taskType, message.data)
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
