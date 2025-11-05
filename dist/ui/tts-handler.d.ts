/**
 * TTS Handler - Shared text-to-speech functionality for UI components
 * Provides click-to-pronounce with visual feedback and abort control
 */
/**
 * Pronounce text with visual feedback on the clicked element
 */
export declare function pronounceText(element: HTMLElement, text: string, language?: string): Promise<void>;
/**
 * Cancel current TTS playback
 */
export declare function cancelTTS(): Promise<void>;
//# sourceMappingURL=tts-handler.d.ts.map