/**
 * Test TTS cancellation behavior when user clicks rapidly between words
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTTSService, resetTTSService } from '../src/utils/tts-service';

describe('TTS Rapid Click Cancellation', () => {
  beforeEach(() => {
    resetTTSService();
  });

  it('should not throw errors when rapidly switching between words', async () => {
    // Mock speech synthesis
    const mockUtterance = {
      onend: null as (() => void) | null,
      onerror: null as ((event: { error: string }) => void) | null,
      voice: null,
      lang: '',
      rate: 1,
      pitch: 1,
      volume: 1,
    };

    const mockSynthesis = {
      speaking: false,
      paused: false,
      pending: false,
      getVoices: () => [
        {
          name: 'Test Voice',
          lang: 'en-US',
          default: true,
          localService: true,
          voiceURI: 'test',
        },
      ],
      speak: vi.fn((utterance: typeof mockUtterance) => {
        // Simulate speaking
        mockSynthesis.speaking = true;

        // Simulate completion after a delay
        setTimeout(() => {
          if (utterance.onend) {
            utterance.onend();
          }
          mockSynthesis.speaking = false;
        }, 100);
      }),
      cancel: vi.fn(() => {
        // Simulate cancellation triggering error
        mockSynthesis.speaking = false;
        if (mockUtterance.onerror) {
          mockUtterance.onerror({ error: 'canceled' });
        }
      }),
      pause: vi.fn(),
      resume: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    const ttsService = getTTSService(
      () => mockSynthesis as unknown as SpeechSynthesis
    );

    // Simulate rapid clicks: start speaking word1, then immediately word2
    const speak1Promise = ttsService.speak('vocabulary1', { language: 'en' });

    // Wait a tiny bit to ensure first speech starts
    await new Promise(resolve => setTimeout(resolve, 10));

    // Immediately start speaking word2 (this should cancel word1)
    const speak2Promise = ttsService.speak('vocabulary2', { language: 'en' });

    // Both should complete without throwing errors
    await expect(speak1Promise).resolves.not.toThrow();
    await expect(speak2Promise).resolves.not.toThrow();
  });

  it('should handle multiple rapid cancellations gracefully', async () => {
    const mockSynthesis = {
      speaking: false,
      paused: false,
      pending: false,
      getVoices: () => [
        {
          name: 'Test Voice',
          lang: 'en-US',
          default: true,
          localService: true,
          voiceURI: 'test',
        },
      ],
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    const ttsService = getTTSService(
      () => mockSynthesis as unknown as SpeechSynthesis
    );

    // Simulate clicking through multiple words rapidly
    const promises = [
      ttsService.speak('word1', { language: 'en' }),
      ttsService.speak('word2', { language: 'en' }),
      ttsService.speak('word3', { language: 'en' }),
      ttsService.speak('word4', { language: 'en' }),
    ];

    // All should complete without errors
    await expect(Promise.all(promises)).resolves.toBeDefined();
  });
});
