/**
 * Settings types for hamburger menu
 */
export interface UISettings {
    fontSize: number;
    lineSpacing: number;
    theme: 'light' | 'dark' | 'sepia';
    highlightOpacity: number;
    difficultyLevel: number;
    targetLanguage: string;
    nativeLanguage: string;
    autoPlayTTS: boolean;
    highlightMode: 'vocabulary' | 'sentence' | 'none';
    showTranslations: boolean;
    wordFrequencyFilter: 'all' | 'common' | 'uncommon';
    aiProvider: 'chrome' | 'gemini';
    geminiApiKey?: string;
    processingQuality: 'fast' | 'thorough';
    cacheEnabled: boolean;
    showProgressBar: boolean;
    cardLayout: 'compact' | 'expanded';
    keyboardShortcutsEnabled: boolean;
    autoSaveProgress: boolean;
}
export declare const DEFAULT_UI_SETTINGS: UISettings;
//# sourceMappingURL=settings.d.ts.map