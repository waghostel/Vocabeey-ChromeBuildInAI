/**
 * Text-to-Speech Service - Web Speech API integration
 * Implements Requirements: 3.5, 4.5, 5.5
 */

// ============================================================================
// Types
// ============================================================================

export interface TTSOptions {
  language?: string;
  rate?: number; // 0.1 to 10, default 1
  pitch?: number; // 0 to 2, default 1
  volume?: number; // 0 to 1, default 1
}

export interface TTSVoice {
  name: string;
  lang: string;
  default: boolean;
  localService: boolean;
}

export interface TTSError {
  type: 'not_supported' | 'no_voices' | 'synthesis_failed' | 'cancelled';
  message: string;
  originalError?: Error;
}

// ============================================================================
// TTS Service Class
// ============================================================================

class TTSService {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  // @ts-ignore - Used in event handlers
  private _currentUtterance: SpeechSynthesisUtterance | null = null;
  private isInitialized = false;

  constructor(synthesisProvider?: () => SpeechSynthesis | null) {
    // Allow injection for testing, default to window.speechSynthesis
    if (synthesisProvider) {
      this.synthesis = synthesisProvider();
    } else if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }

    if (this.synthesis) {
      void this.initializeVoices();
    }
  }

  /**
   * Initialize and load available voices
   */
  private async initializeVoices(): Promise<void> {
    if (!this.synthesis) return;

    // Load voices
    this.voices = this.synthesis.getVoices();

    // If voices not loaded yet, wait for voiceschanged event
    if (this.voices.length === 0) {
      await new Promise<void>(resolve => {
        if (!this.synthesis) {
          resolve();
          return;
        }

        this.synthesis.addEventListener('voiceschanged', () => {
          if (this.synthesis) {
            this.voices = this.synthesis.getVoices();
          }
          resolve();
        });

        // Timeout after 3 seconds
        setTimeout(() => resolve(), 3000);
      });
    }

    this.isInitialized = true;
  }

  /**
   * Check if TTS is supported
   */
  public isSupported(): boolean {
    return this.synthesis !== null && 'speechSynthesis' in window;
  }

  /**
   * Check if TTS is ready
   */
  public async isReady(): Promise<boolean> {
    if (!this.isSupported()) return false;

    if (!this.isInitialized) {
      await this.initializeVoices();
    }

    return this.voices.length > 0;
  }

  /**
   * Get available voices
   */
  public async getAvailableVoices(): Promise<TTSVoice[]> {
    if (!this.isSupported()) return [];

    if (!this.isInitialized) {
      await this.initializeVoices();
    }

    return this.voices.map(voice => ({
      name: voice.name,
      lang: voice.lang,
      default: voice.default,
      localService: voice.localService,
    }));
  }

  /**
   * Get voices for specific language
   */
  public async getVoicesForLanguage(language: string): Promise<TTSVoice[]> {
    const allVoices = await this.getAvailableVoices();

    // Normalize language code (e.g., 'en-US' or 'en')
    const normalizedLang = language.toLowerCase();

    return allVoices.filter(voice => {
      const voiceLang = voice.lang.toLowerCase();
      return (
        voiceLang === normalizedLang ||
        voiceLang.startsWith(`${normalizedLang}-`)
      );
    });
  }

  /**
   * Select best voice for language
   */
  private async selectVoice(
    language?: string
  ): Promise<SpeechSynthesisVoice | null> {
    if (!this.isInitialized) {
      await this.initializeVoices();
    }

    if (this.voices.length === 0) return null;

    // If no language specified, use default voice
    if (!language) {
      return this.voices.find(v => v.default) || this.voices[0];
    }

    // Normalize language code
    const normalizedLang = language.toLowerCase();

    // Try exact match first
    let voice = this.voices.find(v => v.lang.toLowerCase() === normalizedLang);

    // Try language prefix match (e.g., 'en' matches 'en-US')
    if (!voice) {
      voice = this.voices.find(v =>
        v.lang.toLowerCase().startsWith(`${normalizedLang}-`)
      );
    }

    // Try reverse match (e.g., 'en-US' matches 'en')
    if (!voice && normalizedLang.includes('-')) {
      const langPrefix = normalizedLang.split('-')[0];
      voice = this.voices.find(v =>
        v.lang.toLowerCase().startsWith(langPrefix)
      );
    }

    // Fallback to default voice
    return voice || this.voices.find(v => v.default) || this.voices[0];
  }

  /**
   * Speak text
   */
  public async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      throw this.createError(
        'not_supported',
        'Text-to-speech is not supported in this browser'
      );
    }

    if (!this.synthesis) {
      throw this.createError('not_supported', 'Speech synthesis not available');
    }

    // Cancel any ongoing speech
    this.stop();

    // Wait for voices to load
    if (!this.isInitialized) {
      await this.initializeVoices();
    }

    if (this.voices.length === 0) {
      throw this.createError(
        'no_voices',
        'No speech synthesis voices available'
      );
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Set voice
      const voice = this.selectVoice(options.language);
      void voice.then(selectedVoice => {
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        // Set language
        if (options.language) {
          utterance.lang = options.language;
        }

        // Set speech parameters
        utterance.rate = options.rate ?? 1;
        utterance.pitch = options.pitch ?? 1;
        utterance.volume = options.volume ?? 1;

        // Event handlers
        utterance.onend = () => {
          this._currentUtterance = null;
          resolve();
        };

        utterance.onerror = event => {
          this._currentUtterance = null;

          // Check if it was cancelled
          if (event.error === 'canceled' || event.error === 'interrupted') {
            reject(
              this.createError(
                'cancelled',
                'Speech synthesis was cancelled',
                event.error as unknown as Error
              )
            );
          } else {
            reject(
              this.createError(
                'synthesis_failed',
                `Speech synthesis failed: ${event.error}`,
                event.error as unknown as Error
              )
            );
          }
        };

        // Store current utterance
        this._currentUtterance = utterance;

        // Speak
        try {
          this.synthesis!.speak(utterance);
        } catch (error) {
          this._currentUtterance = null;
          reject(
            this.createError(
              'synthesis_failed',
              'Failed to start speech synthesis',
              error as Error
            )
          );
        }
      });
    });
  }

  /**
   * Stop current speech
   */
  public stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this._currentUtterance = null;
    }
  }

  /**
   * Pause current speech
   */
  public pause(): void {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  public resume(): void {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  public isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false;
  }

  /**
   * Check if currently paused
   */
  public isPaused(): boolean {
    return this.synthesis?.paused ?? false;
  }

  /**
   * Create TTS error
   */
  private createError(
    type: TTSError['type'],
    message: string,
    originalError?: Error
  ): TTSError {
    return {
      type,
      message,
      originalError,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let ttsServiceInstance: TTSService | null = null;

/**
 * Get TTS service instance
 * @param synthesisProvider Optional provider for testing (allows mock injection)
 */
export function getTTSService(
  synthesisProvider?: () => SpeechSynthesis | null
): TTSService {
  if (!ttsServiceInstance) {
    ttsServiceInstance = new TTSService(synthesisProvider);
  }
  return ttsServiceInstance;
}

/**
 * Reset TTS service instance (for testing)
 * @internal
 */
export function resetTTSService(): void {
  if (ttsServiceInstance) {
    ttsServiceInstance.stop();
  }
  ttsServiceInstance = null;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Speak text with default options
 */
export async function speak(text: string, options?: TTSOptions): Promise<void> {
  const service = getTTSService();
  return service.speak(text, options);
}

/**
 * Stop speaking
 */
export function stopSpeaking(): void {
  const service = getTTSService();
  service.stop();
}

/**
 * Check if TTS is supported
 */
export function isTTSSupported(): boolean {
  const service = getTTSService();
  return service.isSupported();
}

/**
 * Get available voices
 */
export async function getAvailableVoices(): Promise<TTSVoice[]> {
  const service = getTTSService();
  return service.getAvailableVoices();
}

/**
 * Get voices for language
 */
export async function getVoicesForLanguage(
  language: string
): Promise<TTSVoice[]> {
  const service = getTTSService();
  return service.getVoicesForLanguage(language);
}
