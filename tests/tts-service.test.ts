/**
 * TTS Service Tests
 * Tests for Web Speech API integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import {
  getTTSService,
  resetTTSService,
  speak,
  stopSpeaking,
  isTTSSupported,
  getAvailableVoices,
  getVoicesForLanguage,
} from '../src/utils/tts-service';

// Mock SpeechSynthesis API
const mockVoices = [
  {
    name: 'Google US English',
    lang: 'en-US',
    default: true,
    localService: false,
    voiceURI: 'Google US English',
  },
  {
    name: 'Google UK English',
    lang: 'en-GB',
    default: false,
    localService: false,
    voiceURI: 'Google UK English',
  },
  {
    name: 'Google español',
    lang: 'es-ES',
    default: false,
    localService: false,
    voiceURI: 'Google español',
  },
  {
    name: 'Google français',
    lang: 'fr-FR',
    default: false,
    localService: false,
    voiceURI: 'Google français',
  },
];

describe('TTS Service', () => {
  let mockSpeechSynthesis: {
    speak: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
    getVoices: ReturnType<typeof vi.fn>;
    speaking: boolean;
    paused: boolean;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Reset singleton instance
    resetTTSService();

    // Reset mocks
    mockSpeechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn(() => mockVoices),
      speaking: false,
      paused: false,
      addEventListener: vi.fn((event, handler) => {
        // Immediately call handler for voiceschanged to simulate voices being ready
        if (event === 'voiceschanged') {
          setTimeout(() => handler(), 0);
        }
      }),
      removeEventListener: vi.fn(),
    };

    // Mock window.speechSynthesis
    Object.defineProperty(window, 'speechSynthesis', {
      value: mockSpeechSynthesis,
      writable: true,
      configurable: true,
    });

    // Mock SpeechSynthesisUtterance
    global.SpeechSynthesisUtterance = vi.fn().mockImplementation(text => ({
      text,
      lang: '',
      voice: null,
      rate: 1,
      pitch: 1,
      volume: 1,
      onend: null,
      onerror: null,
    })) as unknown as typeof SpeechSynthesisUtterance;
  });

  afterEach(() => {
    // Clean up
    resetTTSService();
    vi.clearAllMocks();
  });

  describe('isSupported', () => {
    it('should return true when speechSynthesis is available', () => {
      expect(isTTSSupported()).toBe(true);
    });

    it('should return false when speechSynthesis is not available', () => {
      // Provide null synthesis to simulate unsupported browser
      const service = getTTSService(() => null);
      expect(service.isSupported()).toBe(false);
    });
  });

  describe('getAvailableVoices', () => {
    it('should return list of available voices', async () => {
      const voices = await getAvailableVoices();

      expect(voices).toHaveLength(4);
      expect(voices[0]).toMatchObject({
        name: 'Google US English',
        lang: 'en-US',
        default: true,
      });
    });

    it('should return empty array when no voices available', async () => {
      // Reset and create new mock with no voices
      vi.resetModules();

      const emptyMockSynthesis = {
        ...mockSpeechSynthesis,
        getVoices: vi.fn(() => []),
      };

      Object.defineProperty(window, 'speechSynthesis', {
        value: emptyMockSynthesis,
        writable: true,
        configurable: true,
      });

      const { getAvailableVoices: getVoices } = await import(
        '../src/utils/tts-service'
      );
      const voices = await getVoices();
      expect(voices).toHaveLength(0);
    });
  });

  describe('getVoicesForLanguage', () => {
    it('should return voices for exact language match', async () => {
      const voices = await getVoicesForLanguage('en-US');

      expect(voices).toHaveLength(1);
      expect(voices[0].lang).toBe('en-US');
    });

    it('should return voices for language prefix match', async () => {
      const voices = await getVoicesForLanguage('en');

      expect(voices.length).toBeGreaterThanOrEqual(2);
      expect(voices.every(v => v.lang.startsWith('en'))).toBe(true);
    });

    it('should return empty array for unsupported language', async () => {
      const voices = await getVoicesForLanguage('zh-CN');

      expect(voices).toHaveLength(0);
    });

    it('should handle case-insensitive language codes', async () => {
      const voices = await getVoicesForLanguage('EN-US');

      expect(voices).toHaveLength(1);
      expect(voices[0].lang).toBe('en-US');
    });
  });

  describe('speak', () => {
    it('should speak text with default options', async () => {
      // Initialize service with mock
      getTTSService(() => mockSpeechSynthesis as unknown as SpeechSynthesis);

      const speakPromise = speak('Hello world');

      await new Promise(resolve => setTimeout(resolve, 10));

      const utterance = (
        global.SpeechSynthesisUtterance as unknown as ReturnType<typeof vi.fn>
      ).mock.results[0].value;
      if (utterance.onend) {
        utterance.onend();
      }

      await speakPromise;

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith(
        'Hello world'
      );
    });

    it('should speak text with custom language', async () => {
      const speakPromise = speak('Bonjour', { language: 'fr-FR' });

      // Wait for async voice selection
      await new Promise(resolve => setTimeout(resolve, 10));

      const utterance = (
        global.SpeechSynthesisUtterance as unknown as ReturnType<typeof vi.fn>
      ).mock.results[0].value;
      if (utterance.onend) {
        utterance.onend();
      }

      await speakPromise;

      expect(utterance.lang).toBe('fr-FR');
    });

    it('should speak text with custom rate and pitch', async () => {
      const speakPromise = speak('Test', { rate: 1.5, pitch: 1.2 });

      // Wait for async voice selection
      await new Promise(resolve => setTimeout(resolve, 10));

      const utterance = (
        global.SpeechSynthesisUtterance as unknown as ReturnType<typeof vi.fn>
      ).mock.results[0].value;
      if (utterance.onend) {
        utterance.onend();
      }

      await speakPromise;

      expect(utterance.rate).toBe(1.5);
      expect(utterance.pitch).toBe(1.2);
    });

    it('should throw error when TTS is not supported', async () => {
      vi.resetModules();

      Object.defineProperty(window, 'speechSynthesis', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { speak: speakFn } = await import('../src/utils/tts-service');
      await expect(speakFn('Test')).rejects.toMatchObject({
        type: 'not_supported',
      });
    });

    it('should throw error when no voices available', async () => {
      vi.resetModules();

      const emptyMockSynthesis = {
        ...mockSpeechSynthesis,
        getVoices: vi.fn(() => []),
      };

      Object.defineProperty(window, 'speechSynthesis', {
        value: emptyMockSynthesis,
        writable: true,
        configurable: true,
      });

      const { speak: speakFn } = await import('../src/utils/tts-service');

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 10));

      await expect(speakFn('Test')).rejects.toMatchObject({
        type: 'no_voices',
      });
    });

    it('should handle synthesis errors', async () => {
      const speakPromise = speak('Test');

      // Wait for async voice selection
      await new Promise(resolve => setTimeout(resolve, 10));

      const utterance = (
        global.SpeechSynthesisUtterance as unknown as ReturnType<typeof vi.fn>
      ).mock.results[0].value;
      if (utterance.onerror) {
        utterance.onerror({ error: 'network' });
      }

      await expect(speakPromise).rejects.toMatchObject({
        type: 'synthesis_failed',
      });
    });

    it('should handle cancellation', async () => {
      const speakPromise = speak('Test');

      // Wait for async voice selection
      await new Promise(resolve => setTimeout(resolve, 10));

      const utterance = (
        global.SpeechSynthesisUtterance as unknown as ReturnType<typeof vi.fn>
      ).mock.results[0].value;
      if (utterance.onerror) {
        utterance.onerror({ error: 'canceled' });
      }

      await expect(speakPromise).rejects.toMatchObject({
        type: 'cancelled',
      });
    });
  });

  describe('stopSpeaking', () => {
    it('should cancel current speech', () => {
      // Initialize service with mock
      getTTSService(() => mockSpeechSynthesis as unknown as SpeechSynthesis);

      stopSpeaking();

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
  });

  describe('TTSService instance methods', () => {
    it('should check if speaking', () => {
      // Use property getter to make mock reactive
      let speakingState = false;
      Object.defineProperty(mockSpeechSynthesis, 'speaking', {
        get: () => speakingState,
        configurable: true,
      });

      const service = getTTSService(
        () => mockSpeechSynthesis as unknown as SpeechSynthesis
      );

      speakingState = true;
      expect(service.isSpeaking()).toBe(true);

      speakingState = false;
      expect(service.isSpeaking()).toBe(false);
    });

    it('should check if paused', () => {
      // Use property getter to make mock reactive
      let pausedState = false;
      Object.defineProperty(mockSpeechSynthesis, 'paused', {
        get: () => pausedState,
        configurable: true,
      });

      const service = getTTSService(
        () => mockSpeechSynthesis as unknown as SpeechSynthesis
      );

      pausedState = true;
      expect(service.isPaused()).toBe(true);

      pausedState = false;
      expect(service.isPaused()).toBe(false);
    });

    it('should pause speech', () => {
      Object.defineProperty(mockSpeechSynthesis, 'speaking', {
        get: () => true,
        configurable: true,
      });

      const service = getTTSService(
        () => mockSpeechSynthesis as unknown as SpeechSynthesis
      );

      service.pause();

      expect(mockSpeechSynthesis.pause).toHaveBeenCalled();
    });

    it('should resume speech', () => {
      Object.defineProperty(mockSpeechSynthesis, 'paused', {
        get: () => true,
        configurable: true,
      });

      const service = getTTSService(
        () => mockSpeechSynthesis as unknown as SpeechSynthesis
      );

      service.resume();

      expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    });

    it('should stop speech', () => {
      const service = getTTSService(
        () => mockSpeechSynthesis as unknown as SpeechSynthesis
      );

      service.stop();

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
  });

  describe('Voice selection', () => {
    it('should select default voice when no language specified', async () => {
      const speakPromise = speak('Test');

      const utterance = (
        global.SpeechSynthesisUtterance as unknown as ReturnType<typeof vi.fn>
      ).mock.results[0].value;

      // Wait for voice selection
      await new Promise(resolve => setTimeout(resolve, 0));

      if (utterance.onend) {
        utterance.onend();
      }

      await speakPromise;

      expect(utterance.voice).toBeTruthy();
    });

    it('should select voice matching language', async () => {
      const speakPromise = speak('Hola', { language: 'es-ES' });

      const utterance = (
        global.SpeechSynthesisUtterance as unknown as ReturnType<typeof vi.fn>
      ).mock.results[0].value;

      // Wait for voice selection
      await new Promise(resolve => setTimeout(resolve, 0));

      if (utterance.onend) {
        utterance.onend();
      }

      await speakPromise;

      expect(utterance.voice?.lang).toBe('es-ES');
    });

    it('should fallback to default voice for unsupported language', async () => {
      const speakPromise = speak('Test', { language: 'zh-CN' });

      const utterance = (
        global.SpeechSynthesisUtterance as unknown as ReturnType<typeof vi.fn>
      ).mock.results[0].value;

      // Wait for voice selection
      await new Promise(resolve => setTimeout(resolve, 0));

      if (utterance.onend) {
        utterance.onend();
      }

      await speakPromise;

      expect(utterance.voice).toBeTruthy();
    });
  });
});
