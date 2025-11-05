/**
 * Highlight Manager - Handles text selection and highlighting for vocabulary and sentences
 * Implements Requirements: 3.1, 3.2, 3.4, 3.5, 4.1, 4.2, 4.4, 3.7
 */
import type { Highlight } from '../types';
export type HighlightMode = 'vocabulary' | 'sentence' | 'none';
/**
 * Initialize highlight manager
 */
export declare function initializeHighlightManager(articleId: string, partId: string, mode?: HighlightMode, articleLanguage?: string): void;
/**
 * Restore highlights for a specific article part
 * This function reads stored vocabulary and sentence items and recreates their highlights in the DOM
 */
export declare function restoreHighlightsForPart(articleId: string, partId: string): Promise<void>;
/**
 * Set highlight mode
 */
export declare function setHighlightMode(mode: HighlightMode): void;
/**
 * Get current highlight mode
 */
export declare function getHighlightMode(): HighlightMode;
/**
 * Cleanup highlight manager
 * CRITICAL: Properly removes all event listeners and DOM elements to prevent memory leaks
 */
export declare function cleanupHighlightManager(): void;
/**
 * Pause highlight manager (disable event listeners during edit mode)
 */
export declare function pauseHighlightManager(): void;
/**
 * Resume highlight manager (re-enable event listeners after edit mode)
 */
export declare function resumeHighlightManager(): void;
/**
 * Merge overlapping highlights
 */
export declare function mergeOverlappingHighlights(newHighlights: Highlight[]): Highlight[];
/**
 * Remove highlight
 */
export declare function removeHighlight(highlightId: string, type: 'vocabulary' | 'sentence'): Promise<void>;
/**
 * Show context menu with smart positioning relative to the highlighted word or cursor
 */
export declare function showContextMenu(element: HTMLElement, itemId: string, type: 'vocabulary' | 'sentence', event?: MouseEvent): void;
/**
 * Handle context menu action for pending selection
 */
export declare function handleSelectionContextMenuAction(action: string): Promise<void>;
/**
 * Convert a vocabulary item to a sentence item
 */
export declare function convertVocabularyToSentence(vocabularyId: string): Promise<void>;
/**
 * Convert a sentence item to a vocabulary item
 */
export declare function convertSentenceToVocabulary(sentenceId: string): Promise<void>;
//# sourceMappingURL=highlight-manager.d.ts.map