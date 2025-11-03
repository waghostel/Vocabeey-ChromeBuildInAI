/**
 * Tests for same-language translation bypass
 * Verifies that when source and target languages are the same,
 * the original text is returned without calling translation APIs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIServiceCoordinator } from '../src/utils/ai-service-coordinator';
import { ChromeTranslator } from '../src/utils/chrome-ai';
import { GeminiAPIClient } from '../src/utils/gemini-api';

describe('Same-Language Translation Bypass', () => {
  describe('AIServiceCoordinator', () => {
    it('should return original text when source and target languages are the same', async () => {
      const coordinator = new AIServiceCoordinator();
      const originalText = 'Hello world';

      const result = await coordinator.translateText(originalText, 'en', 'en');

      expect(result).toBe(originalText);
    });

    it('should handle different language codes correctly', async () => {
      const coordinator = new AIServiceCoordinator();
      const originalText = 'Bonjour le monde';

      const result = await coordinator.translateText(originalText, 'fr', 'fr');

      expect(result).toBe(originalText);
    });
  });

  describe('GeminiAPIClient', () => {
    it('should return original text when source and target languages are the same', async () => {
      const client = new GeminiAPIClient({ apiKey: 'test-key' });
      const originalText = 'Test text';

      const result = await client.translateText(originalText, 'es', 'es');

      expect(result).toBe(originalText);
    });

    it('should not make API calls for same-language translation', async () => {
      const client = new GeminiAPIClient({ apiKey: 'test-key' });
      const generateContentSpy = vi.spyOn(client as any, 'generateContent');

      await client.translateText('Test', 'de', 'de');

      expect(generateContentSpy).not.toHaveBeenCalled();
    });
  });

  describe('ChromeTranslator - Batch Translation', () => {
    it('should return original texts for batch translation with same language', async () => {
      const translator = new ChromeTranslator();
      const requests = [
        { text: 'word1' },
        { text: 'word2', context: 'some context' },
        { text: 'word3' },
      ];

      const results = await translator.batchTranslate(requests, 'en', 'en');

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({
        original: 'word1',
        translation: 'word1',
        context: undefined,
      });
      expect(results[1]).toEqual({
        original: 'word2',
        translation: 'word2',
        context: 'some context',
      });
      expect(results[2]).toEqual({
        original: 'word3',
        translation: 'word3',
        context: undefined,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text with same language', async () => {
      const coordinator = new AIServiceCoordinator();
      const result = await coordinator.translateText('', 'en', 'en');
      expect(result).toBe('');
    });

    it('should handle whitespace-only text with same language', async () => {
      const coordinator = new AIServiceCoordinator();
      const whitespace = '   \n\t  ';
      const result = await coordinator.translateText(whitespace, 'ja', 'ja');
      expect(result).toBe(whitespace);
    });

    it('should handle special characters with same language', async () => {
      const coordinator = new AIServiceCoordinator();
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const result = await coordinator.translateText(specialText, 'zh', 'zh');
      expect(result).toBe(specialText);
    });

    it('should handle very long text with same language', async () => {
      const coordinator = new AIServiceCoordinator();
      const longText = 'a'.repeat(10000);
      const result = await coordinator.translateText(longText, 'ko', 'ko');
      expect(result).toBe(longText);
    });
  });

  describe('Performance', () => {
    it('should return immediately for same-language translation', async () => {
      const coordinator = new AIServiceCoordinator();
      const startTime = Date.now();

      await coordinator.translateText('Test text', 'en', 'en');

      const duration = Date.now() - startTime;
      // Should complete in less than 10ms (no API calls)
      expect(duration).toBeLessThan(10);
    });
  });
});
