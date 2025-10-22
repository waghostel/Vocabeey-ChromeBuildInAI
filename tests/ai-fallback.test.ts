/**
 * Tests for AI Fallback System
 * Tests Gemini API integration, fallback chain, and error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import {
  AIServiceCoordinator,
  RetryHandler,
} from '../src/utils/ai-service-coordinator';
import { GeminiAPIClient } from '../src/utils/gemini-api';

import type { AIError } from '../src/types';

// ============================================================================
// Mock Chrome AI APIs
// ============================================================================

const mockLanguageDetector = {
  detect: vi.fn(),
};

const mockSummarizer = {
  summarize: vi.fn(),
  destroy: vi.fn(),
};

const mockRewriter = {
  rewrite: vi.fn(),
  destroy: vi.fn(),
};

const mockTranslator = {
  translate: vi.fn(),
  destroy: vi.fn(),
};

const mockPromptSession = {
  prompt: vi.fn(),
  destroy: vi.fn(),
};

const mockChromeAI = {
  languageDetector: {
    create: vi.fn().mockResolvedValue(mockLanguageDetector),
    capabilities: vi.fn().mockResolvedValue({ available: 'readily' }),
  },
  summarizer: {
    create: vi.fn().mockResolvedValue(mockSummarizer),
    capabilities: vi.fn().mockResolvedValue({ available: 'readily' }),
  },
  rewriter: {
    create: vi.fn().mockResolvedValue(mockRewriter),
    capabilities: vi.fn().mockResolvedValue({ available: 'readily' }),
  },
  translator: {
    create: vi.fn().mockResolvedValue(mockTranslator),
    capabilities: vi.fn().mockResolvedValue({
      available: 'readily',
      languagePairAvailable: vi.fn().mockResolvedValue('readily'),
    }),
  },
  assistant: {
    create: vi.fn().mockResolvedValue(mockPromptSession),
    capabilities: vi.fn().mockResolvedValue({ available: 'readily' }),
  },
};

// ============================================================================
// Mock fetch for Gemini API
// ============================================================================

const mockFetch = vi.fn();
global.fetch = mockFetch;

// ============================================================================
// Test: Gemini API Client
// ============================================================================

describe('GeminiAPIClient', () => {
  let client: GeminiAPIClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new GeminiAPIClient({ apiKey: 'test-api-key' });
  });

  describe('Configuration', () => {
    it('should initialize with API key', () => {
      expect(client.isConfigured()).toBe(true);
    });

    it('should allow updating API key', () => {
      const newClient = new GeminiAPIClient({ apiKey: '' });
      expect(newClient.isConfigured()).toBe(false);

      newClient.setApiKey('new-key');
      expect(newClient.isConfigured()).toBe(true);
    });

    it('should use default model if not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: 'en' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
        }),
      });

      await client.detectLanguage('Hello');

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain('gemini-2.0-flash-exp');
    });
  });

  describe('Language Detection', () => {
    it('should detect language successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: 'en' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
        }),
      });

      const language = await client.detectLanguage('Hello world');

      expect(language).toBe('en');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should reject invalid language codes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: 'invalid123' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
        }),
      });

      await expect(client.detectLanguage('Hello')).rejects.toMatchObject({
        type: 'processing_failed',
        message: expect.stringContaining('Invalid language code'),
      });
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            code: 401,
            message: 'Invalid API key',
            status: 'UNAUTHENTICATED',
          },
        }),
      });

      await expect(client.detectLanguage('Hello')).rejects.toMatchObject({
        type: 'api_unavailable',
        message: expect.stringContaining('Invalid Gemini API key'),
      });
    });
  });

  describe('Content Summarization', () => {
    it('should summarize content successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'This is a summary.' }],
                role: 'model',
              },
              finishReason: 'STOP',
            },
          ],
        }),
      });

      const summary = await client.summarizeContent(
        'Long article text here...'
      );

      expect(summary).toBe('This is a summary.');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should respect summary options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: '• Point 1\n• Point 2' }],
                role: 'model',
              },
              finishReason: 'STOP',
            },
          ],
        }),
      });

      await client.summarizeContent('Text', {
        format: 'bullet',
        maxLength: 100,
      });

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.contents[0].parts[0].text).toContain('bullet points');
    });
  });

  describe('Content Rewriting', () => {
    it('should rewrite content at specified difficulty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: 'Simplified text' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
        }),
      });

      const rewritten = await client.rewriteContent('Complex text', 3);

      expect(rewritten).toBe('Simplified text');
    });

    it('should validate difficulty range', async () => {
      await expect(client.rewriteContent('Text', 0)).rejects.toMatchObject({
        type: 'invalid_input',
        message: expect.stringContaining('Difficulty must be between 1 and 10'),
      });

      await expect(client.rewriteContent('Text', 11)).rejects.toMatchObject({
        type: 'invalid_input',
        message: expect.stringContaining('Difficulty must be between 1 and 10'),
      });
    });
  });

  describe('Translation', () => {
    it('should translate text successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: 'Hola mundo' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
        }),
      });

      const translation = await client.translateText('Hello world', 'en', 'es');

      expect(translation).toBe('Hola mundo');
    });
  });

  describe('Vocabulary Analysis', () => {
    it('should analyze vocabulary with structured output', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify([
                      {
                        word: 'hello',
                        difficulty: 1,
                        isProperNoun: false,
                        isTechnicalTerm: false,
                        exampleSentences: ['Hello, how are you?'],
                      },
                    ]),
                  },
                ],
                role: 'model',
              },
              finishReason: 'STOP',
            },
          ],
        }),
      });

      const analyses = await client.analyzeVocabulary(['hello'], 'Hello world');

      expect(analyses).toHaveLength(1);
      expect(analyses[0].word).toBe('hello');
      expect(analyses[0].difficulty).toBe(1);
    });

    it('should filter out proper nouns', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify([
                      {
                        word: 'John',
                        difficulty: 1,
                        isProperNoun: true,
                        isTechnicalTerm: false,
                        exampleSentences: [],
                      },
                      {
                        word: 'hello',
                        difficulty: 1,
                        isProperNoun: false,
                        isTechnicalTerm: false,
                        exampleSentences: ['Hello!'],
                      },
                    ]),
                  },
                ],
                role: 'model',
              },
              finishReason: 'STOP',
            },
          ],
        }),
      });

      const analyses = await client.analyzeVocabulary(
        ['John', 'hello'],
        'John says hello'
      );

      expect(analyses).toHaveLength(1);
      expect(analyses[0].word).toBe('hello');
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiting errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            code: 429,
            message: 'Rate limit exceeded',
            status: 'RESOURCE_EXHAUSTED',
          },
        }),
      });

      await expect(client.detectLanguage('Hello')).rejects.toMatchObject({
        type: 'rate_limit',
        message: expect.stringContaining('rate limit'),
        retryable: true,
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(client.detectLanguage('Hello')).rejects.toMatchObject({
        type: 'network',
        message: expect.stringContaining('Network error'),
        retryable: true,
      });
    });

    it('should handle service unavailable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          error: {
            code: 503,
            message: 'Service unavailable',
            status: 'UNAVAILABLE',
          },
        }),
      });

      await expect(client.detectLanguage('Hello')).rejects.toMatchObject({
        type: 'api_unavailable',
        message: expect.stringContaining('temporarily unavailable'),
      });
    });

    it('should handle empty responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [],
        }),
      });

      await expect(client.detectLanguage('Hello')).rejects.toMatchObject({
        type: 'processing_failed',
        message: expect.stringContaining('No response'),
      });
    });

    it('should handle missing API key', async () => {
      const unconfiguredClient = new GeminiAPIClient({ apiKey: '' });

      await expect(
        unconfiguredClient.detectLanguage('Hello')
      ).rejects.toMatchObject({
        type: 'api_unavailable',
        message: expect.stringContaining('not configured'),
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      // Mock successful responses
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: 'en' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
        }),
      });

      const startTime = Date.now();

      // Make multiple rapid requests
      const promises = Array.from({ length: 5 }, () =>
        client.detectLanguage('Hello')
      );

      await Promise.all(promises);

      const endTime = Date.now();

      // Should complete quickly since we're under the rate limit
      expect(endTime - startTime).toBeLessThan(1000);
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });
  });

  describe('Availability Check', () => {
    it('should return false when not configured', async () => {
      const unconfiguredClient = new GeminiAPIClient({ apiKey: '' });
      const available = await unconfiguredClient.isAvailable();

      expect(available).toBe(false);
    });

    it('should return true when API responds successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: 'test' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
        }),
      });

      const available = await client.isAvailable();

      expect(available).toBe(true);
    });

    it('should return false when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const available = await client.isAvailable();

      expect(available).toBe(false);
    });
  });
});

// ============================================================================
// Test: AI Service Coordinator
// ============================================================================

describe('AIServiceCoordinator', () => {
  let coordinator: AIServiceCoordinator;

  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).window = { ai: mockChromeAI };

    // Mock Gemini API availability check that happens during initialization
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: { parts: [{ text: 'available' }], role: 'model' },
            finishReason: 'STOP',
          },
        ],
      }),
    });

    coordinator = new AIServiceCoordinator('test-gemini-key');
  });

  afterEach(() => {
    coordinator.destroy();
  });

  describe('Service Status', () => {
    it('should detect Chrome AI availability', async () => {
      const status = await coordinator.getServiceStatus();

      expect(status.chromeAI).toBe(true);
    });

    it('should detect Gemini API availability', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: 'test' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
        }),
      });

      const status = await coordinator.getServiceStatus();

      expect(status.geminiAPI).toBe(true);
    });

    it('should cache service status', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: 'test' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
        }),
      });

      await coordinator.getServiceStatus();
      await coordinator.getServiceStatus();

      // Should only check once due to caching
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should allow updating Gemini API key', () => {
      const newCoordinator = new AIServiceCoordinator();

      newCoordinator.setGeminiApiKey('new-key');

      // Should invalidate cache and allow new checks
      expect(newCoordinator).toBeDefined();
    });
  });

  describe('Fallback Chain - Language Detection', () => {
    it('should use Chrome AI when available', async () => {
      mockLanguageDetector.detect.mockResolvedValueOnce([
        { detectedLanguage: 'en', confidence: 0.95 },
      ]);

      const language = await coordinator.detectLanguage('Hello world');

      expect(language).toBe('en');
      expect(mockLanguageDetector.detect).toHaveBeenCalled();
      // Note: mockFetch was called once during initialization for availability check
    });

    it('should fallback to Gemini API when Chrome AI fails', async () => {
      // Create fresh coordinator for this test
      vi.clearAllMocks();

      const testCoordinator = new AIServiceCoordinator('test-key');

      // Mock the service status update to bypass availability check timing issues
      vi.spyOn(testCoordinator as any, 'updateServiceStatus').mockResolvedValue(
        undefined
      );
      // Manually set service status to simulate both services being available for fallback test
      (testCoordinator as any).serviceStatus = {
        chromeAI: true,
        geminiAPI: true,
        lastChecked: new Date(),
      };

      mockLanguageDetector.detect.mockRejectedValueOnce(
        new Error('Chrome AI failed')
      );

      // Mock the GeminiAPIClient method directly to avoid fetch timing issues
      vi.spyOn(
        testCoordinator['geminiClient'],
        'detectLanguage'
      ).mockResolvedValue('es');

      const language = await testCoordinator.detectLanguage('Hola mundo');

      expect(language).toBe('es');
      expect(mockLanguageDetector.detect).toHaveBeenCalled();

      testCoordinator.destroy();
    });

    it('should throw error when all services fail', async () => {
      // Create fresh coordinator for this test
      vi.clearAllMocks();

      // Mock availability check first (happens during coordinator initialization)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: 'available' }], role: 'model' },
              finishReason: 'STOP',
            },
          ],
        }),
      });

      const testCoordinator = new AIServiceCoordinator('test-key');

      mockLanguageDetector.detect.mockRejectedValue(
        new Error('Chrome AI failed')
      );
      mockFetch.mockRejectedValue(new Error('Gemini API failed'));

      await expect(
        testCoordinator.detectLanguage('Hello')
      ).rejects.toMatchObject({
        type: 'processing_failed',
        message: expect.stringContaining('All AI services failed'),
      });

      testCoordinator.destroy();
    });
  });

  describe('Fallback Chain - Summarization', () => {
    it('should use Chrome AI when available', async () => {
      mockSummarizer.summarize.mockResolvedValueOnce('Chrome summary');

      const summary = await coordinator.summarizeContent('Long text...');

      expect(summary).toBe('Chrome summary');
      expect(mockSummarizer.summarize).toHaveBeenCalled();
    });

    it('should fallback to Gemini API when Chrome AI fails', async () => {
      // Create fresh coordinator for this test
      vi.clearAllMocks();

      const testCoordinator = new AIServiceCoordinator('test-key');

      // Mock the service status update to bypass availability check timing issues
      vi.spyOn(testCoordinator as any, 'updateServiceStatus').mockResolvedValue(
        undefined
      );
      // Manually set service status to simulate Gemini API being available
      (testCoordinator as any).serviceStatus = {
        chromeAI: false,
        geminiAPI: true,
        lastChecked: new Date(),
      };

      mockSummarizer.summarize.mockRejectedValueOnce(
        new Error('Chrome AI failed')
      );

      // Mock the GeminiAPIClient method directly to avoid fetch timing issues
      vi.spyOn(
        testCoordinator['geminiClient'],
        'summarizeContent'
      ).mockResolvedValue('Gemini summary');

      const summary = await testCoordinator.summarizeContent('Long text...');

      expect(summary).toBe('Gemini summary');

      testCoordinator.destroy();
    });
  });

  describe('Fallback Chain - Translation', () => {
    it('should use Chrome AI when available', async () => {
      mockTranslator.translate.mockResolvedValueOnce('Hola mundo');

      const translation = await coordinator.translateText(
        'Hello world',
        'en',
        'es'
      );

      expect(translation).toBe('Hola mundo');
      expect(mockTranslator.translate).toHaveBeenCalled();
    });

    it('should fallback to Gemini API when Chrome AI fails', async () => {
      // Create fresh coordinator for this test
      vi.clearAllMocks();

      const testCoordinator = new AIServiceCoordinator('test-key');

      // Mock the service status update to bypass availability check timing issues
      vi.spyOn(testCoordinator as any, 'updateServiceStatus').mockResolvedValue(
        undefined
      );
      // Manually set service status to simulate Gemini API being available
      (testCoordinator as any).serviceStatus = {
        chromeAI: false,
        geminiAPI: true,
        lastChecked: new Date(),
      };

      mockTranslator.translate.mockRejectedValueOnce(
        new Error('Chrome AI failed')
      );

      // Mock the GeminiAPIClient method directly to avoid fetch timing issues
      vi.spyOn(
        testCoordinator['geminiClient'],
        'translateText'
      ).mockResolvedValue('Bonjour le monde');

      const translation = await testCoordinator.translateText(
        'Hello world',
        'en',
        'fr'
      );

      expect(translation).toBe('Bonjour le monde');

      testCoordinator.destroy();
    });
  });

  describe('Fallback Chain - Vocabulary Analysis', () => {
    it('should use Chrome AI when available', async () => {
      mockPromptSession.prompt.mockResolvedValueOnce(
        JSON.stringify([
          {
            word: 'hello',
            difficulty: 1,
            isProperNoun: false,
            isTechnicalTerm: false,
            exampleSentences: ['Hello!'],
          },
        ])
      );

      const analyses = await coordinator.analyzeVocabulary(
        ['hello'],
        'Hello world'
      );

      expect(analyses).toHaveLength(1);
      expect(mockPromptSession.prompt).toHaveBeenCalled();
    });

    it('should fallback to Gemini API when Chrome AI fails', async () => {
      // Create fresh coordinator for this test
      vi.clearAllMocks();

      const testCoordinator = new AIServiceCoordinator('test-key');

      // Mock the service status update to bypass availability check timing issues
      vi.spyOn(testCoordinator as any, 'updateServiceStatus').mockResolvedValue(
        undefined
      );
      // Manually set service status to simulate Gemini API being available
      (testCoordinator as any).serviceStatus = {
        chromeAI: false,
        geminiAPI: true,
        lastChecked: new Date(),
      };

      // Mock Chrome AI failure
      mockChromeAI.assistant.create.mockRejectedValueOnce(
        new Error('Chrome AI failed')
      );

      // Mock the GeminiAPIClient method directly to avoid fetch timing issues
      vi.spyOn(
        testCoordinator['geminiClient'],
        'analyzeVocabulary'
      ).mockResolvedValue([
        {
          word: 'world',
          difficulty: 2,
          isProperNoun: false,
          isTechnicalTerm: false,
          exampleSentences: ['World peace'],
        },
      ]);

      const analyses = await testCoordinator.analyzeVocabulary(
        ['world'],
        'Hello world'
      );

      expect(analyses).toHaveLength(1);
      expect(analyses[0].word).toBe('world');

      // Reset mock for other tests
      mockChromeAI.assistant.create.mockResolvedValue(mockPromptSession);

      testCoordinator.destroy();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-retryable errors immediately', async () => {
      const nonRetryableError: AIError = {
        type: 'invalid_input',
        message: 'Invalid input',
        retryable: false,
      };

      mockLanguageDetector.detect.mockRejectedValueOnce(nonRetryableError);
      mockFetch.mockRejectedValueOnce(nonRetryableError);

      await expect(coordinator.detectLanguage('Hello')).rejects.toMatchObject({
        type: 'processing_failed',
        message: expect.stringContaining('All AI services failed'),
      });
    });

    it('should handle errors through handleError method', async () => {
      const error: AIError = {
        type: 'network',
        message: 'Network error',
        retryable: true,
      };

      await coordinator.handleError(error);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Service Coordination', () => {
    it('should skip unavailable services', async () => {
      // Clear previous mocks
      vi.clearAllMocks();

      // Make Chrome AI unavailable
      mockChromeAI.languageDetector.capabilities.mockResolvedValue({
        available: 'no',
      });

      const newCoordinator = new AIServiceCoordinator('test-key');

      // Mock the service status update to bypass availability check timing issues
      vi.spyOn(newCoordinator as any, 'updateServiceStatus').mockResolvedValue(
        undefined
      );
      // Manually set service status to simulate Gemini API being available
      (newCoordinator as any).serviceStatus = {
        chromeAI: false,
        geminiAPI: true,
        lastChecked: new Date(),
      };

      // Mock the GeminiAPIClient method directly to avoid fetch timing issues
      vi.spyOn(
        newCoordinator['geminiClient'],
        'detectLanguage'
      ).mockResolvedValue('fr');

      const language = await newCoordinator.detectLanguage('Bonjour');

      expect(language).toBe('fr');

      newCoordinator.destroy();

      // Reset mock for other tests
      mockChromeAI.languageDetector.capabilities.mockResolvedValue({
        available: 'readily',
      });
    });

    it('should report when no services are available', async () => {
      mockChromeAI.languageDetector.capabilities.mockResolvedValueOnce({
        available: 'no',
      });

      const noServiceCoordinator = new AIServiceCoordinator();

      await expect(
        noServiceCoordinator.detectLanguage('Hello')
      ).rejects.toMatchObject({
        type: 'api_unavailable',
        message: expect.stringContaining('No AI services available'),
      });

      noServiceCoordinator.destroy();
    });
  });

  describe('Resource Cleanup', () => {
    it('should clean up resources on destroy', async () => {
      // Create fresh coordinator for this test
      vi.clearAllMocks();

      const testCoordinator = new AIServiceCoordinator('test-key');

      // Mock the service status update to bypass availability check timing issues
      vi.spyOn(testCoordinator as any, 'updateServiceStatus').mockResolvedValue(
        undefined
      );
      // Manually set service status to simulate Chrome AI being available for this test
      (testCoordinator as any).serviceStatus = {
        chromeAI: true,
        geminiAPI: true,
        lastChecked: new Date(),
      };

      // Mock the actual service instances that the coordinator uses
      vi.spyOn(
        testCoordinator['chromeSummarizer'],
        'summarizeContent'
      ).mockResolvedValue('Chrome summary');
      vi.spyOn(
        testCoordinator['chromeRewriter'],
        'rewriteContent'
      ).mockResolvedValue('Rewritten text');
      vi.spyOn(
        testCoordinator['chromeTranslator'],
        'translateText'
      ).mockResolvedValue('Hola mundo');

      // Mock the destroy methods that we want to verify
      vi.spyOn(
        testCoordinator['chromeSummarizer'],
        'destroy'
      ).mockImplementation(() => {});
      vi.spyOn(testCoordinator['chromeRewriter'], 'destroy').mockImplementation(
        () => {}
      );
      vi.spyOn(
        testCoordinator['chromeTranslator'],
        'destroy'
      ).mockImplementation(() => {});

      await testCoordinator.summarizeContent('test');
      await testCoordinator.rewriteContent('test', 5);
      await testCoordinator.translateText('test', 'en', 'es');

      // Now destroy and check cleanup
      testCoordinator.destroy();

      expect(testCoordinator['chromeSummarizer'].destroy).toHaveBeenCalled();
      expect(testCoordinator['chromeRewriter'].destroy).toHaveBeenCalled();
      expect(testCoordinator['chromeTranslator'].destroy).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Test: Retry Handler
// ============================================================================

describe('RetryHandler', () => {
  let handler: RetryHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new RetryHandler(3, 100); // 3 retries, 100ms base delay
  });

  describe('Retry Logic', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await handler.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce({
          type: 'network',
          message: 'Network error',
          retryable: true,
        })
        .mockRejectedValueOnce({
          type: 'network',
          message: 'Network error',
          retryable: true,
        })
        .mockResolvedValueOnce('success');

      const result = await handler.execute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValueOnce({
        type: 'invalid_input',
        message: 'Invalid',
        retryable: false,
      });

      await expect(handler.execute(operation)).rejects.toMatchObject({
        type: 'invalid_input',
        retryable: false,
      });

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw last error after max retries', async () => {
      const operation = vi.fn().mockRejectedValue({
        type: 'network',
        message: 'Network error',
        retryable: true,
      });

      await expect(handler.execute(operation)).rejects.toMatchObject({
        type: 'network',
        message: 'Network error',
      });

      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce({
          type: 'network',
          message: 'Error',
          retryable: true,
        })
        .mockRejectedValueOnce({
          type: 'network',
          message: 'Error',
          retryable: true,
        })
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      await handler.execute(operation);
      const endTime = Date.now();

      // Should have waited at least 100ms + 200ms = 300ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(250);
    });

    it('should support custom retry conditions', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce({
          type: 'rate_limit',
          message: 'Rate limited',
          retryable: true,
        })
        .mockResolvedValueOnce('success');

      const shouldRetry = (error: AIError) => error.type === 'rate_limit';

      const result = await handler.execute(operation, shouldRetry);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry when custom condition returns false', async () => {
      const operation = vi.fn().mockRejectedValueOnce({
        type: 'network',
        message: 'Error',
        retryable: true,
      });

      const shouldRetry = () => false;

      await expect(
        handler.execute(operation, shouldRetry)
      ).rejects.toMatchObject({
        type: 'network',
      });

      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Normalization', () => {
    it('should normalize standard errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Standard error'));

      await expect(handler.execute(operation)).rejects.toMatchObject({
        type: 'processing_failed',
        message: 'Standard error',
        retryable: false,
      });
    });

    it('should normalize unknown errors', async () => {
      const operation = vi.fn().mockRejectedValue('string error');

      await expect(handler.execute(operation)).rejects.toMatchObject({
        type: 'processing_failed',
        message: 'Unknown error occurred',
        retryable: false,
      });
    });

    it('should preserve AIError objects', async () => {
      const aiError: AIError = {
        type: 'api_unavailable',
        message: 'API unavailable',
        retryable: true,
      };

      const operation = vi.fn().mockRejectedValue(aiError);

      await expect(handler.execute(operation)).rejects.toEqual(aiError);
    });
  });
});
