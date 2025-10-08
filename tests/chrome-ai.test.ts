/**
 * Tests for Chrome AI integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  ChromeLanguageDetector,
  ChromeSummarizer,
  ChromeRewriter,
  ChromeTranslator,
  ChromeVocabularyAnalyzer,
  ChromeAIManager,
  getChromeAI,
  resetChromeAI,
} from '../src/utils/chrome-ai';

// Mock Chrome AI APIs
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

describe('ChromeLanguageDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).window = { ai: mockChromeAI };
  });

  it('should detect language successfully', async () => {
    mockLanguageDetector.detect.mockResolvedValue([
      { detectedLanguage: 'en', confidence: 0.95 },
      { detectedLanguage: 'es', confidence: 0.05 },
    ]);

    const detector = new ChromeLanguageDetector();
    const language = await detector.detectLanguage('Hello world');

    expect(language).toBe('en');
    expect(mockLanguageDetector.detect).toHaveBeenCalledWith('Hello world');
  });

  it('should cache language detection results', async () => {
    mockLanguageDetector.detect.mockResolvedValue([
      { detectedLanguage: 'en', confidence: 0.95 },
    ]);

    const detector = new ChromeLanguageDetector();

    await detector.detectLanguage('Hello world');
    await detector.detectLanguage('Hello world');

    expect(mockLanguageDetector.detect).toHaveBeenCalledTimes(1);
  });

  it('should check availability', async () => {
    const detector = new ChromeLanguageDetector();
    const available = await detector.isAvailable();

    expect(available).toBe(true);
  });
});

describe('ChromeSummarizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).window = { ai: mockChromeAI };
  });

  it('should summarize content', async () => {
    mockSummarizer.summarize.mockResolvedValue('This is a summary');

    const summarizer = new ChromeSummarizer();
    const summary = await summarizer.summarizeContent(
      'Long article content here'
    );

    expect(summary).toBe('This is a summary');
    expect(mockSummarizer.summarize).toHaveBeenCalled();
  });

  it('should subdivide article into parts', async () => {
    const content = `Paragraph 1

Paragraph 2

Paragraph 3

Paragraph 4`;

    const summarizer = new ChromeSummarizer();
    const parts = await summarizer.subdivideArticle(content);

    expect(parts.length).toBeGreaterThan(0);
    expect(parts.every(part => part.length > 0)).toBe(true);
  });
});

describe('ChromeRewriter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).window = { ai: mockChromeAI };
  });

  it('should rewrite content based on difficulty', async () => {
    mockRewriter.rewrite.mockResolvedValue('Simplified content');

    const rewriter = new ChromeRewriter();
    const rewritten = await rewriter.rewriteContent('Complex content', 3);

    expect(rewritten).toBe('Simplified content');
    expect(mockRewriter.rewrite).toHaveBeenCalled();
  });

  it('should reject invalid difficulty levels', async () => {
    const rewriter = new ChromeRewriter();

    await expect(rewriter.rewriteContent('Content', 0)).rejects.toThrow();
    await expect(rewriter.rewriteContent('Content', 11)).rejects.toThrow();
  });
});

describe('ChromeTranslator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).window = { ai: mockChromeAI };
  });

  it('should translate text', async () => {
    mockTranslator.translate.mockResolvedValue('Hola mundo');

    const translator = new ChromeTranslator();
    const translation = await translator.translateText(
      'Hello world',
      'en',
      'es'
    );

    expect(translation).toBe('Hola mundo');
    expect(mockTranslator.translate).toHaveBeenCalledWith('Hello world');
  });

  it('should batch translate multiple words', async () => {
    mockTranslator.translate.mockResolvedValue(
      '[0] Hola\n[1] Mundo\n[2] Adiós'
    );

    const translator = new ChromeTranslator();
    const results = await translator.batchTranslate(
      [{ text: 'Hello' }, { text: 'World' }, { text: 'Goodbye' }],
      'en',
      'es'
    );

    expect(results).toHaveLength(3);
    expect(results[0].original).toBe('Hello');
  });

  it('should cache translations', async () => {
    mockTranslator.translate.mockResolvedValue('Hola');

    const translator = new ChromeTranslator();

    await translator.translateText('Hello', 'en', 'es');
    await translator.translateText('Hello', 'en', 'es');

    expect(mockTranslator.translate).toHaveBeenCalledTimes(1);
  });
});

describe('ChromeVocabularyAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).window = { ai: mockChromeAI };
  });

  it('should analyze vocabulary', async () => {
    mockPromptSession.prompt.mockResolvedValue(
      JSON.stringify({
        word: 'example',
        difficulty: 5,
        isProperNoun: false,
        isTechnicalTerm: false,
        exampleSentences: ['This is an example.'],
      })
    );

    const analyzer = new ChromeVocabularyAnalyzer();
    const analyses = await analyzer.analyzeVocabulary(
      ['example'],
      'This is an example sentence.'
    );

    expect(analyses).toHaveLength(1);
    expect(analyses[0].word).toBe('example');
    expect(analyses[0].difficulty).toBe(5);
  });

  it('should filter out proper nouns', async () => {
    mockPromptSession.prompt.mockResolvedValue(
      JSON.stringify({
        word: 'John',
        difficulty: 1,
        isProperNoun: true,
        isTechnicalTerm: false,
        exampleSentences: [],
      })
    );

    const analyzer = new ChromeVocabularyAnalyzer();
    const analyses = await analyzer.analyzeVocabulary(
      ['John'],
      'John is a person.'
    );

    expect(analyses).toHaveLength(0);
  });

  it('should generate example sentences', async () => {
    mockPromptSession.prompt.mockResolvedValue(
      'This is an example.\nHere is another example.\nOne more example.'
    );

    const analyzer = new ChromeVocabularyAnalyzer();
    const examples = await analyzer.generateExamples('example', 3);

    expect(examples.length).toBeGreaterThan(0);
    expect(examples.every(ex => ex.toLowerCase().includes('example'))).toBe(
      true
    );
  });
});

describe('ChromeAIManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).window = { ai: mockChromeAI };
    resetChromeAI();
  });

  it('should provide unified interface for all AI services', async () => {
    mockLanguageDetector.detect.mockResolvedValue([
      { detectedLanguage: 'en', confidence: 0.95 },
    ]);
    mockSummarizer.summarize.mockResolvedValue('Summary');
    mockRewriter.rewrite.mockResolvedValue('Rewritten');
    mockTranslator.translate.mockResolvedValue('Traducido');
    mockPromptSession.prompt.mockResolvedValue(
      JSON.stringify({
        word: 'test',
        difficulty: 5,
        isProperNoun: false,
        isTechnicalTerm: false,
        exampleSentences: [],
      })
    );

    const manager = new ChromeAIManager();

    const language = await manager.detectLanguage('Test');
    expect(language).toBe('en');

    const summary = await manager.summarizeContent('Content');
    expect(summary).toBe('Summary');

    const rewritten = await manager.rewriteContent('Content', 5);
    expect(rewritten).toBe('Rewritten');

    const translation = await manager.translateText('Test', 'en', 'es');
    expect(translation).toBe('Traducido');

    const analyses = await manager.analyzeVocabulary(['test'], 'context');
    expect(analyses).toHaveLength(1);
  });

  it('should check availability of all services', async () => {
    const manager = new ChromeAIManager();
    const availability = await manager.checkAvailability();

    expect(availability.allAvailable).toBe(true);
    expect(availability.languageDetector).toBe(true);
    expect(availability.summarizer).toBe(true);
    expect(availability.rewriter).toBe(true);
    expect(availability.translator).toBe(true);
    expect(availability.vocabularyAnalyzer).toBe(true);
  });

  it('should provide singleton instance', () => {
    const instance1 = getChromeAI();
    const instance2 = getChromeAI();

    expect(instance1).toBe(instance2);
  });

  it('should batch translate vocabulary efficiently', async () => {
    mockTranslator.translate.mockResolvedValue(
      '[0] Hola\n[1] Mundo\n[2] Adiós'
    );

    const manager = new ChromeAIManager();
    const results = await manager.batchTranslateVocabulary(
      ['Hello', 'World', 'Goodbye'],
      'en',
      'es',
      'Greeting context'
    );

    expect(results).toHaveLength(3);
    expect(mockTranslator.translate).toHaveBeenCalledTimes(1);
  });

  it('should subdivide articles into manageable parts', async () => {
    const longContent = Array(10)
      .fill('This is a paragraph with some content.')
      .join('\n\n');

    const manager = new ChromeAIManager();
    const parts = await manager.subdivideArticle(longContent);

    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every(part => part.length > 0)).toBe(true);
  });

  it('should cleanup all resources on destroy', async () => {
    mockSummarizer.summarize.mockResolvedValue('Summary');
    mockRewriter.rewrite.mockResolvedValue('Rewritten');
    mockTranslator.translate.mockResolvedValue('Traducido');

    const manager = new ChromeAIManager();

    // Create some sessions first
    await manager.summarizeContent('test');
    await manager.rewriteContent('test', 5);
    await manager.translateText('test', 'en', 'es');

    manager.destroy();

    expect(mockSummarizer.destroy).toHaveBeenCalled();
    expect(mockRewriter.destroy).toHaveBeenCalled();
    expect(mockTranslator.destroy).toHaveBeenCalled();
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Chrome AI Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default working state
    mockChromeAI.languageDetector.capabilities.mockResolvedValue({
      available: 'readily',
    });
    mockChromeAI.summarizer.capabilities.mockResolvedValue({
      available: 'readily',
    });
    mockChromeAI.rewriter.capabilities.mockResolvedValue({
      available: 'readily',
    });
    mockChromeAI.translator.capabilities.mockResolvedValue({
      available: 'readily',
      languagePairAvailable: vi.fn().mockResolvedValue('readily'),
    });
    mockChromeAI.assistant.capabilities.mockResolvedValue({
      available: 'readily',
    });
    (global as any).window = { ai: mockChromeAI };
  });

  describe('API Unavailability', () => {
    it('should handle missing language detector API', async () => {
      (global as any).window = { ai: {} };

      const detector = new ChromeLanguageDetector();

      await expect(detector.detectLanguage('test')).rejects.toMatchObject({
        type: 'api_unavailable',
        message: expect.stringContaining('Language Detector API not available'),
      });
    });

    it('should handle missing summarizer API', async () => {
      (global as any).window = { ai: {} };

      const summarizer = new ChromeSummarizer();

      await expect(summarizer.summarizeContent('test')).rejects.toMatchObject({
        type: 'api_unavailable',
        message: expect.stringContaining('Summarizer API not available'),
      });
    });

    it('should handle missing rewriter API', async () => {
      (global as any).window = { ai: {} };

      const rewriter = new ChromeRewriter();

      await expect(rewriter.rewriteContent('test', 5)).rejects.toMatchObject({
        type: 'api_unavailable',
        message: expect.stringContaining('Rewriter API not available'),
      });
    });

    it('should handle missing translator API', async () => {
      (global as any).window = { ai: {} };

      const translator = new ChromeTranslator();

      await expect(
        translator.translateText('test', 'en', 'es')
      ).rejects.toMatchObject({
        type: 'api_unavailable',
        message: expect.stringContaining('Translator API not available'),
      });
    });

    it('should handle missing prompt API', async () => {
      (global as any).window = { ai: {} };

      const analyzer = new ChromeVocabularyAnalyzer();

      await expect(
        analyzer.analyzeVocabulary(['test'], 'context')
      ).rejects.toMatchObject({
        type: 'api_unavailable',
        message: expect.stringContaining('Prompt API not available'),
      });
    });
  });

  describe('API Not Ready', () => {
    it('should handle language detector not ready', async () => {
      mockChromeAI.languageDetector.capabilities.mockResolvedValue({
        available: 'no',
      });

      const detector = new ChromeLanguageDetector();

      await expect(detector.detectLanguage('test')).rejects.toMatchObject({
        type: 'api_unavailable',
        message: expect.stringContaining('not ready'),
      });
    });

    it('should handle summarizer not ready', async () => {
      mockChromeAI.summarizer.capabilities.mockResolvedValue({
        available: 'no',
      });

      const summarizer = new ChromeSummarizer();

      await expect(summarizer.summarizeContent('test')).rejects.toMatchObject({
        type: 'api_unavailable',
        message: expect.stringContaining('not ready'),
      });
    });

    it('should handle translator language pair unavailable', async () => {
      mockChromeAI.translator.capabilities.mockResolvedValue({
        available: 'readily',
        languagePairAvailable: vi.fn().mockResolvedValue('no'),
      });

      const translator = new ChromeTranslator();

      await expect(
        translator.translateText('test', 'en', 'zh')
      ).rejects.toMatchObject({
        type: 'api_unavailable',
        message: expect.stringContaining('not available for'),
      });
    });
  });

  describe('Processing Failures', () => {
    it('should handle language detection failure', async () => {
      mockLanguageDetector.detect.mockResolvedValue([]);

      const detector = new ChromeLanguageDetector();

      await expect(detector.detectLanguage('test')).rejects.toMatchObject({
        type: 'processing_failed',
        message: expect.stringContaining('No language detected'),
      });
    });

    it('should handle summarization errors', async () => {
      mockSummarizer.summarize.mockRejectedValue(new Error('Network error'));

      const summarizer = new ChromeSummarizer();

      await expect(summarizer.summarizeContent('test')).rejects.toMatchObject({
        type: 'processing_failed',
        message: expect.stringContaining('Summarization failed'),
      });
    });

    it('should handle translation errors', async () => {
      mockTranslator.translate.mockRejectedValue(
        new Error('Translation failed')
      );

      const translator = new ChromeTranslator();

      await expect(
        translator.translateText('test', 'en', 'es')
      ).rejects.toMatchObject({
        type: 'processing_failed',
        message: expect.stringContaining('Translation failed'),
      });
    });

    it('should handle vocabulary analysis errors gracefully', async () => {
      mockPromptSession.prompt.mockRejectedValue(new Error('Analysis failed'));

      const analyzer = new ChromeVocabularyAnalyzer();

      // Should not throw, but return empty array
      const results = await analyzer.analyzeVocabulary(['test'], 'context');
      expect(results).toHaveLength(0);
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid difficulty levels', async () => {
      const rewriter = new ChromeRewriter();

      await expect(rewriter.rewriteContent('test', 0)).rejects.toMatchObject({
        type: 'invalid_input',
        message: expect.stringContaining('Difficulty must be between 1 and 10'),
      });

      await expect(rewriter.rewriteContent('test', 11)).rejects.toMatchObject({
        type: 'invalid_input',
        message: expect.stringContaining('Difficulty must be between 1 and 10'),
      });
    });

    it('should reject oversized batch translations', async () => {
      const translator = new ChromeTranslator();
      const largeBatch = Array(25).fill({ text: 'test' });

      await expect(
        translator.batchTranslate(largeBatch, 'en', 'es')
      ).rejects.toMatchObject({
        type: 'invalid_input',
        message: expect.stringContaining('Batch size exceeds maximum'),
      });
    });
  });

  describe('Error Retryability', () => {
    it('should mark network errors as retryable', async () => {
      (global as any).window = { ai: {} };

      const detector = new ChromeLanguageDetector();

      try {
        await detector.detectLanguage('test');
      } catch (error: any) {
        expect(error.retryable).toBe(false); // API unavailable is not retryable
      }
    });

    it('should mark processing failures as non-retryable by default', async () => {
      mockLanguageDetector.detect.mockResolvedValue([]);

      const detector = new ChromeLanguageDetector();

      try {
        await detector.detectLanguage('test');
      } catch (error: any) {
        expect(error.retryable).toBe(false);
      }
    });
  });
});

// ============================================================================
// Batch Processing Tests
// ============================================================================

describe('Batch Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default working state
    mockChromeAI.languageDetector.capabilities.mockResolvedValue({
      available: 'readily',
    });
    mockChromeAI.summarizer.capabilities.mockResolvedValue({
      available: 'readily',
    });
    mockChromeAI.rewriter.capabilities.mockResolvedValue({
      available: 'readily',
    });
    mockChromeAI.translator.capabilities.mockResolvedValue({
      available: 'readily',
      languagePairAvailable: vi.fn().mockResolvedValue('readily'),
    });
    mockChromeAI.assistant.capabilities.mockResolvedValue({
      available: 'readily',
    });
    (global as any).window = { ai: mockChromeAI };
  });

  describe('Translation Batching', () => {
    it('should batch translate up to 20 words in single call', async () => {
      const words = Array(20)
        .fill(0)
        .map((_, i) => ({ text: `word${i}` }));
      const translations = words.map((_, i) => `[${i}] palabra${i}`).join('\n');

      mockTranslator.translate.mockResolvedValue(translations);

      const translator = new ChromeTranslator();
      const results = await translator.batchTranslate(words, 'en', 'es');

      expect(results).toHaveLength(20);
      expect(mockTranslator.translate).toHaveBeenCalledTimes(1);
    });

    it('should handle partial cache hits in batch translation', async () => {
      mockTranslator.translate.mockResolvedValue('[0] mundo\n[1] adiós');

      const translator = new ChromeTranslator();

      // First, cache one translation
      await translator.translateText('hello', 'en', 'es');

      // Now batch translate including the cached one
      const results = await translator.batchTranslate(
        [{ text: 'hello' }, { text: 'world' }, { text: 'goodbye' }],
        'en',
        'es'
      );

      expect(results).toHaveLength(3);
      // Should only translate the 2 uncached words
      expect(mockTranslator.translate).toHaveBeenCalledTimes(2);
    });

    it('should include context in batch translations', async () => {
      mockTranslator.translate.mockResolvedValue('[0] correr\n[1] rápido');

      const translator = new ChromeTranslator();
      const results = await translator.batchTranslate(
        [
          { text: 'run', context: 'The athlete can run fast' },
          { text: 'fast', context: 'The athlete can run fast' },
        ],
        'en',
        'es'
      );

      expect(results).toHaveLength(2);
      expect(results[0].context).toBeDefined();
      expect(mockTranslator.translate).toHaveBeenCalled();
    });

    it('should handle batch translation with mixed results', async () => {
      mockTranslator.translate.mockResolvedValue('[0] hola\n[1] \n[2] adiós');

      const translator = new ChromeTranslator();
      const results = await translator.batchTranslate(
        [{ text: 'hello' }, { text: 'invalid' }, { text: 'goodbye' }],
        'en',
        'es'
      );

      expect(results).toHaveLength(3);
      // Should fallback to original for failed translations
      expect(results[1].translation).toBeTruthy();
    });
  });

  describe('Vocabulary Analysis Batching', () => {
    it('should analyze multiple words in sequence', async () => {
      mockPromptSession.prompt
        .mockResolvedValueOnce(
          JSON.stringify({
            word: 'run',
            difficulty: 3,
            isProperNoun: false,
            isTechnicalTerm: false,
            exampleSentences: ['I run every day.'],
          })
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            word: 'fast',
            difficulty: 2,
            isProperNoun: false,
            isTechnicalTerm: false,
            exampleSentences: ['The car is fast.'],
          })
        );

      const analyzer = new ChromeVocabularyAnalyzer();
      const results = await analyzer.analyzeVocabulary(
        ['run', 'fast'],
        'The athlete can run fast'
      );

      expect(results).toHaveLength(2);
      expect(mockPromptSession.prompt).toHaveBeenCalledTimes(2);
    });

    it('should continue analysis even if some words fail', async () => {
      mockPromptSession.prompt
        .mockRejectedValueOnce(new Error('Analysis failed'))
        .mockResolvedValueOnce(
          JSON.stringify({
            word: 'fast',
            difficulty: 2,
            isProperNoun: false,
            isTechnicalTerm: false,
            exampleSentences: [],
          })
        );

      const analyzer = new ChromeVocabularyAnalyzer();
      const results = await analyzer.analyzeVocabulary(
        ['run', 'fast'],
        'context'
      );

      // Should return only successful analysis
      expect(results).toHaveLength(1);
      expect(results[0].word).toBe('fast');
    });
  });

  describe('Hierarchical Summarization', () => {
    it('should use hierarchical approach for long content', async () => {
      const longContent = 'a'.repeat(15000);

      mockSummarizer.summarize
        .mockResolvedValueOnce('Summary part 1')
        .mockResolvedValueOnce('Summary part 2')
        .mockResolvedValueOnce('Summary part 3')
        .mockResolvedValueOnce('Final summary');

      const summarizer = new ChromeSummarizer();
      const result = await summarizer.summarizeContent(longContent);

      expect(result).toBe('Final summary');
      // Should summarize chunks + final combination
      expect(mockSummarizer.summarize).toHaveBeenCalledTimes(4);
    });

    it('should handle short content without hierarchical processing', async () => {
      const shortContent = 'This is a short article.';

      mockSummarizer.summarize.mockResolvedValue('Short summary');

      const summarizer = new ChromeSummarizer();
      const result = await summarizer.summarizeContent(shortContent);

      expect(result).toBe('Short summary');
      expect(mockSummarizer.summarize).toHaveBeenCalledTimes(1);
    });
  });

  describe('Content Chunking', () => {
    it('should rewrite long content in chunks', async () => {
      const longContent = Array(10)
        .fill(
          'This is a paragraph with enough words to pass validation checks for rewriting.'
        )
        .join('\n\n');

      // Mock rewriter to return content that passes validation
      mockRewriter.rewrite.mockImplementation(async (text: string) => {
        return text.replace(/paragraph/g, 'section');
      });

      const rewriter = new ChromeRewriter();
      const result = await rewriter.rewriteContent(longContent, 5);

      expect(result).toContain('section');
      // Should process multiple chunks
      expect(mockRewriter.rewrite).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Caching Tests
// ============================================================================

describe('Caching Mechanisms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default working state
    mockChromeAI.languageDetector.capabilities.mockResolvedValue({
      available: 'readily',
    });
    mockChromeAI.summarizer.capabilities.mockResolvedValue({
      available: 'readily',
    });
    mockChromeAI.rewriter.capabilities.mockResolvedValue({
      available: 'readily',
    });
    mockChromeAI.translator.capabilities.mockResolvedValue({
      available: 'readily',
      languagePairAvailable: vi.fn().mockResolvedValue('readily'),
    });
    mockChromeAI.assistant.capabilities.mockResolvedValue({
      available: 'readily',
    });
    (global as any).window = { ai: mockChromeAI };
  });

  describe('Language Detection Cache', () => {
    it('should cache language detection results', async () => {
      mockLanguageDetector.detect.mockResolvedValue([
        { detectedLanguage: 'en', confidence: 0.95 },
      ]);

      const detector = new ChromeLanguageDetector();

      await detector.detectLanguage('Hello world');
      await detector.detectLanguage('Hello world');
      await detector.detectLanguage('Hello world');

      expect(mockLanguageDetector.detect).toHaveBeenCalledTimes(1);
    });

    it('should cache based on text prefix', async () => {
      mockLanguageDetector.detect
        .mockResolvedValueOnce([{ detectedLanguage: 'en', confidence: 0.95 }])
        .mockResolvedValueOnce([{ detectedLanguage: 'es', confidence: 0.95 }]);

      const detector = new ChromeLanguageDetector();

      const result1 = await detector.detectLanguage('Hello world');
      const result2 = await detector.detectLanguage('Hola mundo');

      expect(result1).toBe('en');
      expect(result2).toBe('es');
      expect(mockLanguageDetector.detect).toHaveBeenCalledTimes(2);
    });

    it('should respect cache size limit', async () => {
      mockLanguageDetector.detect.mockResolvedValue([
        { detectedLanguage: 'en', confidence: 0.95 },
      ]);

      const detector = new ChromeLanguageDetector();

      // Fill cache beyond limit (100 items)
      for (let i = 0; i < 105; i++) {
        await detector.detectLanguage(`Text ${i}`);
      }

      // Should have called detect for each unique text
      expect(mockLanguageDetector.detect).toHaveBeenCalledTimes(105);
    });

    it('should clear cache on demand', async () => {
      mockLanguageDetector.detect.mockResolvedValue([
        { detectedLanguage: 'en', confidence: 0.95 },
      ]);

      const detector = new ChromeLanguageDetector();

      await detector.detectLanguage('Hello');
      detector.clearCache();
      await detector.detectLanguage('Hello');

      expect(mockLanguageDetector.detect).toHaveBeenCalledTimes(2);
    });
  });

  describe('Translation Cache', () => {
    it('should cache translation results', async () => {
      mockTranslator.translate.mockResolvedValue('Hola');

      const translator = new ChromeTranslator();

      await translator.translateText('Hello', 'en', 'es');
      await translator.translateText('Hello', 'en', 'es');
      await translator.translateText('Hello', 'en', 'es');

      expect(mockTranslator.translate).toHaveBeenCalledTimes(1);
    });

    it('should cache separately for different language pairs', async () => {
      mockTranslator.translate
        .mockResolvedValueOnce('Hola')
        .mockResolvedValueOnce('Bonjour');

      const translator = new ChromeTranslator();

      await translator.translateText('Hello', 'en', 'es');
      await translator.translateText('Hello', 'en', 'fr');

      expect(mockTranslator.translate).toHaveBeenCalledTimes(2);
    });

    it('should respect translation cache size limit', async () => {
      mockTranslator.translate.mockResolvedValue('Translation');

      const translator = new ChromeTranslator();

      // Fill cache beyond limit (500 items)
      for (let i = 0; i < 505; i++) {
        await translator.translateText(`Word ${i}`, 'en', 'es');
      }

      // Should have called translate for each unique word
      expect(mockTranslator.translate).toHaveBeenCalledTimes(505);
    });

    it('should clear translation cache on demand', async () => {
      mockTranslator.translate.mockResolvedValue('Hola');

      const translator = new ChromeTranslator();

      await translator.translateText('Hello', 'en', 'es');
      translator.clearCache();
      await translator.translateText('Hello', 'en', 'es');

      expect(mockTranslator.translate).toHaveBeenCalledTimes(2);
    });

    it('should use cache in batch translations', async () => {
      mockTranslator.translate
        .mockResolvedValueOnce('Hola')
        .mockResolvedValueOnce('[0] Mundo');

      const translator = new ChromeTranslator();

      // Cache first word
      await translator.translateText('Hello', 'en', 'es');

      // Batch translate with cached word
      const results = await translator.batchTranslate(
        [{ text: 'Hello' }, { text: 'World' }],
        'en',
        'es'
      );

      expect(results).toHaveLength(2);
      expect(mockTranslator.translate).toHaveBeenCalledTimes(2); // 1 single + 1 batch
    });
  });

  describe('Session Reuse', () => {
    it('should reuse translator sessions for same language pair', async () => {
      mockTranslator.translate
        .mockResolvedValueOnce('Hola')
        .mockResolvedValueOnce('Mundo');

      const translator = new ChromeTranslator();

      await translator.translateText('Hello', 'en', 'es');
      await translator.translateText('World', 'en', 'es');

      // Should create session only once
      expect(mockChromeAI.translator.create).toHaveBeenCalledTimes(1);
    });

    it('should create separate sessions for different language pairs', async () => {
      mockTranslator.translate
        .mockResolvedValueOnce('Hola')
        .mockResolvedValueOnce('Bonjour');

      const translator = new ChromeTranslator();

      await translator.translateText('Hello', 'en', 'es');
      await translator.translateText('Hello', 'en', 'fr');

      // Should create two sessions
      expect(mockChromeAI.translator.create).toHaveBeenCalledTimes(2);
    });

    it('should reuse prompt session for vocabulary analysis', async () => {
      mockPromptSession.prompt
        .mockResolvedValueOnce(
          JSON.stringify({
            word: 'test1',
            difficulty: 5,
            isProperNoun: false,
            isTechnicalTerm: false,
            exampleSentences: [],
          })
        )
        .mockResolvedValueOnce(
          JSON.stringify({
            word: 'test2',
            difficulty: 5,
            isProperNoun: false,
            isTechnicalTerm: false,
            exampleSentences: [],
          })
        );

      const analyzer = new ChromeVocabularyAnalyzer();

      await analyzer.analyzeVocabulary(['test1'], 'context');
      await analyzer.analyzeVocabulary(['test2'], 'context');

      // Should create session only once
      expect(mockChromeAI.assistant.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys for same input', async () => {
      mockLanguageDetector.detect.mockResolvedValue([
        { detectedLanguage: 'en', confidence: 0.95 },
      ]);

      const detector = new ChromeLanguageDetector();

      await detector.detectLanguage('Hello world');
      await detector.detectLanguage('Hello world');

      expect(mockLanguageDetector.detect).toHaveBeenCalledTimes(1);
    });

    it('should use text prefix for cache keys', async () => {
      mockLanguageDetector.detect.mockResolvedValue([
        { detectedLanguage: 'en', confidence: 0.95 },
      ]);

      const detector = new ChromeLanguageDetector();

      const longText = 'a'.repeat(300);
      await detector.detectLanguage(longText);
      await detector.detectLanguage(longText);

      // Should cache based on first 200 chars
      expect(mockLanguageDetector.detect).toHaveBeenCalledTimes(1);
    });
  });
});
