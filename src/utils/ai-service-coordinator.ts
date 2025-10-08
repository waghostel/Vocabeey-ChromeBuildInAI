/**
 * AI Service Coordinator
 * Manages fallback chain: Chrome AI → Gemini API → Error
 * Handles service availability detection and graceful degradation
 */

import {
  ChromeLanguageDetector,
  ChromeSummarizer,
  ChromeRewriter,
  ChromeTranslator,
  ChromeVocabularyAnalyzer,
} from './chrome-ai';
import { GeminiAPIClient } from './gemini-api';

import type {
  AIError,
  AIProcessor,
  AIServiceManager,
  AITask,
  SummaryOptions,
  VocabularyAnalysis,
} from '../types';

// ============================================================================
// Service Availability Status
// ============================================================================

interface ServiceStatus {
  chromeAI: boolean;
  geminiAPI: boolean;
  lastChecked: Date;
}

// ============================================================================
// AI Service Coordinator
// ============================================================================

export class AIServiceCoordinator implements AIProcessor, AIServiceManager {
  private chromeLanguageDetector: ChromeLanguageDetector;
  private chromeSummarizer: ChromeSummarizer;
  private chromeRewriter: ChromeRewriter;
  private chromeTranslator: ChromeTranslator;
  private chromeVocabularyAnalyzer: ChromeVocabularyAnalyzer;
  private geminiClient: GeminiAPIClient | null = null;
  private serviceStatus: ServiceStatus = {
    chromeAI: false,
    geminiAPI: false,
    lastChecked: new Date(0),
  };
  private readonly statusCacheDuration = 60000; // 1 minute

  constructor(geminiApiKey?: string) {
    // Initialize Chrome AI services
    this.chromeLanguageDetector = new ChromeLanguageDetector();
    this.chromeSummarizer = new ChromeSummarizer();
    this.chromeRewriter = new ChromeRewriter();
    this.chromeTranslator = new ChromeTranslator();
    this.chromeVocabularyAnalyzer = new ChromeVocabularyAnalyzer();

    // Initialize Gemini API if key provided
    if (geminiApiKey) {
      this.geminiClient = new GeminiAPIClient({ apiKey: geminiApiKey });
    }
  }

  /**
   * Set or update Gemini API key
   */
  setGeminiApiKey(apiKey: string): void {
    if (this.geminiClient) {
      this.geminiClient.setApiKey(apiKey);
    } else {
      this.geminiClient = new GeminiAPIClient({ apiKey });
    }
    // Invalidate cache to recheck availability
    this.serviceStatus.lastChecked = new Date(0);
  }

  /**
   * Check if any AI service is available
   */
  async isAvailable(): Promise<boolean> {
    await this.updateServiceStatus();
    return this.serviceStatus.chromeAI || this.serviceStatus.geminiAPI;
  }

  /**
   * Get current service status
   */
  async getServiceStatus(): Promise<ServiceStatus> {
    await this.updateServiceStatus();
    return { ...this.serviceStatus };
  }

  /**
   * Detect language with fallback
   */
  async detectLanguage(text: string): Promise<string> {
    return this.processWithFallback('language_detection', { text });
  }

  /**
   * Summarize content with fallback
   */
  async summarizeContent(
    text: string,
    options: SummaryOptions = {}
  ): Promise<string> {
    return this.processWithFallback('summarization', { text, options });
  }

  /**
   * Rewrite content with fallback
   */
  async rewriteContent(text: string, difficulty: number): Promise<string> {
    return this.processWithFallback('rewriting', { text, difficulty });
  }

  /**
   * Translate text with fallback
   */
  async translateText(text: string, from: string, to: string): Promise<string> {
    return this.processWithFallback('translation', { text, from, to });
  }

  /**
   * Analyze vocabulary with fallback
   */
  async analyzeVocabulary(
    words: string[],
    context: string
  ): Promise<VocabularyAnalysis[]> {
    return this.processWithFallback('vocabulary_analysis', { words, context });
  }

  /**
   * Process task with fallback chain
   */
  async processWithFallback<T>(task: AITask, data: unknown): Promise<T> {
    await this.updateServiceStatus();

    const errors: AIError[] = [];

    // Try Chrome AI first
    if (this.serviceStatus.chromeAI) {
      try {
        const result = await this.processChromeAI<T>(task, data);
        return result;
      } catch (error) {
        const aiError = this.normalizeError(error);
        errors.push(aiError);
        console.warn(`Chrome AI failed for ${task}:`, aiError.message);

        // If not retryable, skip to fallback immediately
        if (!aiError.retryable) {
          this.serviceStatus.chromeAI = false;
        }
      }
    }

    // Try Gemini API as fallback
    if (this.serviceStatus.geminiAPI && this.geminiClient) {
      try {
        const result = await this.processGeminiAPI<T>(task, data);
        return result;
      } catch (error) {
        const aiError = this.normalizeError(error);
        errors.push(aiError);
        console.warn(`Gemini API failed for ${task}:`, aiError.message);

        // If not retryable, mark as unavailable
        if (!aiError.retryable) {
          this.serviceStatus.geminiAPI = false;
        }
      }
    }

    // All services failed
    throw this.createCompoundError(task, errors);
  }

  /**
   * Handle error with retry logic
   */
  async handleError(error: AIError): Promise<void> {
    console.error('AI Service Error:', error);

    // If error is retryable, wait before next attempt
    if (error.retryable) {
      await this.exponentialBackoff(1);
    }

    // Update service status
    await this.updateServiceStatus(true);
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.chromeSummarizer.destroy();
    this.chromeRewriter.destroy();
    this.chromeTranslator.destroy();
    this.chromeVocabularyAnalyzer.destroy();
  }

  /**
   * Update service availability status
   */
  private async updateServiceStatus(force: boolean = false): Promise<void> {
    const now = new Date();
    const cacheExpired =
      now.getTime() - this.serviceStatus.lastChecked.getTime() >
      this.statusCacheDuration;

    if (!force && !cacheExpired) {
      return;
    }

    // Check Chrome AI availability (check one representative API)
    try {
      this.serviceStatus.chromeAI =
        await this.chromeLanguageDetector.isAvailable();
    } catch {
      this.serviceStatus.chromeAI = false;
    }

    // Check Gemini API availability
    if (this.geminiClient && this.geminiClient.isConfigured()) {
      try {
        this.serviceStatus.geminiAPI = await this.geminiClient.isAvailable();
      } catch {
        this.serviceStatus.geminiAPI = false;
      }
    } else {
      this.serviceStatus.geminiAPI = false;
    }

    this.serviceStatus.lastChecked = now;
  }

  /**
   * Process task using Chrome AI
   */
  private async processChromeAI<T>(task: AITask, data: unknown): Promise<T> {
    switch (task) {
      case 'language_detection': {
        const { text } = data as { text: string };
        return (await this.chromeLanguageDetector.detectLanguage(text)) as T;
      }

      case 'summarization': {
        const { text, options } = data as {
          text: string;
          options: SummaryOptions;
        };
        return (await this.chromeSummarizer.summarizeContent(
          text,
          options
        )) as T;
      }

      case 'rewriting': {
        const { text, difficulty } = data as {
          text: string;
          difficulty: number;
        };
        return (await this.chromeRewriter.rewriteContent(
          text,
          difficulty
        )) as T;
      }

      case 'translation': {
        const { text, from, to } = data as {
          text: string;
          from: string;
          to: string;
        };
        return (await this.chromeTranslator.translateText(text, from, to)) as T;
      }

      case 'vocabulary_analysis': {
        const { words, context } = data as { words: string[]; context: string };
        return (await this.chromeVocabularyAnalyzer.analyzeVocabulary(
          words,
          context
        )) as T;
      }

      default:
        throw this.createError('invalid_input', `Unknown task type: ${task}`);
    }
  }

  /**
   * Process task using Gemini API
   */
  private async processGeminiAPI<T>(task: AITask, data: unknown): Promise<T> {
    if (!this.geminiClient) {
      throw this.createError('api_unavailable', 'Gemini API not configured');
    }

    switch (task) {
      case 'language_detection': {
        const { text } = data as { text: string };
        return (await this.geminiClient.detectLanguage(text)) as T;
      }

      case 'summarization': {
        const { text, options } = data as {
          text: string;
          options: SummaryOptions;
        };
        return (await this.geminiClient.summarizeContent(text, options)) as T;
      }

      case 'rewriting': {
        const { text, difficulty } = data as {
          text: string;
          difficulty: number;
        };
        return (await this.geminiClient.rewriteContent(text, difficulty)) as T;
      }

      case 'translation': {
        const { text, from, to } = data as {
          text: string;
          from: string;
          to: string;
        };
        return (await this.geminiClient.translateText(text, from, to)) as T;
      }

      case 'vocabulary_analysis': {
        const { words, context } = data as { words: string[]; context: string };
        return (await this.geminiClient.analyzeVocabulary(words, context)) as T;
      }

      default:
        throw this.createError('invalid_input', `Unknown task type: ${task}`);
    }
  }

  /**
   * Create compound error from multiple failures
   */
  private createCompoundError(task: AITask, errors: AIError[]): AIError {
    if (errors.length === 0) {
      return this.createError(
        'api_unavailable',
        `No AI services available for ${task}`
      );
    }

    const messages = errors.map(e => `${e.type}: ${e.message}`).join('; ');
    const allRetryable = errors.every(e => e.retryable);

    return {
      type: 'processing_failed',
      message: `All AI services failed for ${task}. Errors: ${messages}`,
      retryable: allRetryable,
    };
  }

  /**
   * Normalize error to AIError type
   */
  private normalizeError(error: unknown): AIError {
    if (this.isAIError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return {
        type: 'processing_failed',
        message: error.message,
        retryable: false,
        originalError: error,
      };
    }

    return {
      type: 'processing_failed',
      message: 'Unknown error occurred',
      retryable: false,
    };
  }

  /**
   * Exponential backoff for retries
   */
  private async exponentialBackoff(attempt: number): Promise<void> {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Create standardized AI error
   */
  private createError(type: AIError['type'], message: string): AIError {
    return {
      type,
      message,
      retryable: type === 'network' || type === 'rate_limit',
    };
  }

  /**
   * Type guard for AI errors
   */
  private isAIError(error: unknown): error is AIError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      'message' in error
    );
  }
}

// ============================================================================
// Retry Handler
// ============================================================================

export class RetryHandler {
  private readonly maxRetries: number;
  private readonly baseDelay: number;

  constructor(maxRetries: number = 3, baseDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  /**
   * Execute operation with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    shouldRetry: (error: AIError) => boolean = e => e.retryable
  ): Promise<T> {
    let lastError: AIError | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const aiError = this.normalizeError(error);
        lastError = aiError;

        // Don't retry if error is not retryable
        if (!shouldRetry(aiError)) {
          throw aiError;
        }

        // Don't wait after last attempt
        if (attempt < this.maxRetries) {
          await this.exponentialBackoff(attempt);
          console.log(
            `Retry attempt ${attempt}/${this.maxRetries} after error:`,
            aiError.message
          );
        }
      }
    }

    // All retries exhausted
    throw (
      lastError ||
      this.createError('processing_failed', 'All retries exhausted')
    );
  }

  /**
   * Exponential backoff delay
   */
  private async exponentialBackoff(attempt: number): Promise<void> {
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(this.baseDelay * Math.pow(2, attempt - 1), maxDelay);

    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Normalize error to AIError type
   */
  private normalizeError(error: unknown): AIError {
    if (this.isAIError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return {
        type: 'processing_failed',
        message: error.message,
        retryable: false,
        originalError: error,
      };
    }

    return {
      type: 'processing_failed',
      message: 'Unknown error occurred',
      retryable: false,
    };
  }

  /**
   * Create standardized AI error
   */
  private createError(type: AIError['type'], message: string): AIError {
    return {
      type,
      message,
      retryable: type === 'network' || type === 'rate_limit',
    };
  }

  /**
   * Type guard for AI errors
   */
  private isAIError(error: unknown): error is AIError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      'message' in error
    );
  }
}
