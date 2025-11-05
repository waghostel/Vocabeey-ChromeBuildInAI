/**
 * Core data types for the Language Learning Chrome Extension
 */
export interface UserSettings {
    nativeLanguage: string;
    learningLanguage: string;
    difficultyLevel: number;
    autoHighlight: boolean;
    darkMode: boolean;
    fontSize: number;
    apiKeys: {
        gemini?: string;
        jinaReader?: string;
    };
    keyboardShortcuts?: KeyboardShortcuts;
}
export interface ExtractedContent {
    title: string;
    content: string;
    url: string;
    language?: string;
    wordCount: number;
    paragraphCount: number;
}
export interface ProcessedArticle {
    id: string;
    url: string;
    title: string;
    originalLanguage: string;
    detectedLanguageConfidence?: number;
    processedAt: Date;
    parts: ArticlePart[];
    processingStatus: 'processing' | 'completed' | 'failed';
    cacheExpires: Date;
}
export interface ArticlePart {
    id: string;
    content: string;
    originalContent: string;
    vocabulary: string[];
    sentences: string[];
    partIndex: number;
}
export interface VocabularyItem {
    id: string;
    word: string;
    phrase?: string;
    translation: string;
    translations?: Record<string, string>;
    context: string;
    exampleSentences: string[];
    articleId: string;
    partId: string;
    createdAt: Date;
    lastReviewed: Date;
    reviewCount: number;
    difficulty: number;
}
export interface SentenceItem {
    id: string;
    content: string;
    translation: string;
    translations?: Record<string, string>;
    articleId: string;
    partId: string;
    createdAt: Date;
}
export interface KeyboardShortcuts {
    navigateLeft: string;
    navigateRight: string;
    vocabularyMode: string;
    sentenceMode: string;
    readingMode: string;
}
export interface ContentExtractor {
    extract(document: Document): Promise<ExtractedContent>;
    validate(content: string): boolean;
    sanitize(content: string): string;
}
export interface SummaryOptions {
    maxLength?: number;
    format?: 'paragraph' | 'bullet';
}
export interface VocabularyAnalysis {
    word: string;
    difficulty: number;
    isProperNoun: boolean;
    isTechnicalTerm: boolean;
    exampleSentences: string[];
}
export interface AIProcessor {
    detectLanguage(text: string): Promise<{
        language: string;
        confidence: number;
    }>;
    summarizeContent(text: string, options: SummaryOptions): Promise<string>;
    rewriteContent(text: string, difficulty: number): Promise<string>;
    translateText(text: string, from: string, to: string): Promise<string>;
    analyzeVocabulary(words: string[], context: string): Promise<VocabularyAnalysis[]>;
}
export type AITask = 'language_detection' | 'summarization' | 'rewriting' | 'translation' | 'vocabulary_analysis';
export type ErrorType = 'network' | 'api_unavailable' | 'rate_limit' | 'invalid_input' | 'processing_failed';
export interface AIError {
    type: ErrorType;
    message: string;
    retryable: boolean;
    originalError?: Error;
}
export interface AIServiceManager {
    isAvailable(): Promise<boolean>;
    processWithFallback<T>(task: AITask, data: unknown): Promise<T>;
    handleError(error: AIError): Promise<void>;
}
export type LearningMode = 'reading' | 'vocabulary' | 'sentences';
export type LanguageDisplayMode = 'both' | 'learning_only' | 'native_only';
export interface VocabularyCard {
    id: string;
    word: string;
    translation: string;
    context: string;
    exampleSentences: string[];
    collapsed: boolean;
}
export interface SentenceCard {
    id: string;
    content: string;
    translation: string;
    collapsed: boolean;
}
export interface Highlight {
    id: string;
    text: string;
    startOffset: number;
    endOffset: number;
    type: 'vocabulary' | 'sentence';
}
export interface LearningInterface {
    renderArticle(article: ProcessedArticle): void;
    createVocabularyCard(word: string, translation: string): VocabularyCard;
    createSentenceCard(sentence: string, translation: string): SentenceCard;
    switchMode(mode: LearningMode): void;
    navigateToArticlePart(partIndex: number): void;
}
export interface HighlightManager {
    highlightVocabulary(selection: Selection): Promise<VocabularyCard>;
    highlightSentence(selection: Selection): Promise<SentenceCard>;
    mergeOverlappingHighlights(highlights: Highlight[]): Highlight[];
    removeHighlight(highlightId: string): void;
}
export type ExportFormat = 'markdown' | 'json';
export interface StorageManager {
    saveVocabulary(vocab: VocabularyItem): Promise<void>;
    saveSentence(sentence: SentenceItem): Promise<void>;
    saveArticle(article: ProcessedArticle): Promise<void>;
    getUserSettings(): Promise<UserSettings>;
    exportData(format: ExportFormat): Promise<string>;
    importData(data: string): Promise<void>;
}
export interface DataMigrator {
    getCurrentVersion(): Promise<string>;
    migrateToVersion(targetVersion: string): Promise<void>;
    validateSchema(data: unknown): boolean;
}
export interface ProcessingTask {
    type: 'article_processing' | 'vocabulary_analysis' | 'translation';
    articleId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    data: unknown;
}
export interface BackgroundProcessor {
    queueTask(task: ProcessingTask): Promise<void>;
    processQueue(): Promise<void>;
    getTaskStatus(taskId: string): Promise<ProcessingTask>;
}
export type MessageType = 'EXTRACT_CONTENT' | 'PROCESS_ARTICLE' | 'SAVE_VOCABULARY' | 'SAVE_SENTENCE' | 'GET_SETTINGS' | 'UPDATE_SETTINGS' | 'TRANSLATE_TEXT' | 'ANALYZE_VOCABULARY' | 'EXPORT_DATA' | 'IMPORT_DATA' | 'GET_INJECTION_DEBUG_INFO';
export interface Message<T = unknown> {
    type: MessageType;
    payload: T;
    requestId?: string;
}
export interface MessageResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    requestId?: string;
}
export interface ExtensionState {
    isActive: boolean;
    currentMode: LearningMode;
    currentArticleId?: string;
    currentPartIndex: number;
    displayMode: LanguageDisplayMode;
}
export interface ChromeStorageData {
    settings: UserSettings;
    articles: Record<string, ProcessedArticle>;
    vocabulary: Record<string, VocabularyItem>;
    sentences: Record<string, SentenceItem>;
    extensionState: ExtensionState;
}
export interface InjectionError {
    attemptedPath: string;
    tabId: number;
    tabUrl?: string;
    error: string;
    timestamp: number;
    suggestions: string[];
    chromeErrorCode?: string;
    contextInfo: {
        manifestVersion: string;
        extensionId: string;
        buildTimestamp?: string;
    };
}
export interface InjectionSuccess {
    scriptPath: string;
    tabId: number;
    tabUrl?: string;
    timestamp: number;
    injectionTime: number;
    contextInfo: {
        manifestVersion: string;
        extensionId: string;
    };
}
export interface InjectionDebugInfo {
    recentErrors: InjectionError[];
    recentSuccesses: InjectionSuccess[];
    statistics: {
        totalErrors: number;
        totalSuccesses: number;
        successRate: number;
        averageInjectionTime: number;
    };
    systemInfo: {
        manifestVersion: string;
        extensionId: string;
        buildVersion: string;
    };
}
//# sourceMappingURL=index.d.ts.map