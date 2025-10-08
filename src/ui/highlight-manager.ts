/**
 * Highlight Manager - Handles text selection and highlighting for vocabulary and sentences
 * Implements Requirements: 3.1, 3.2, 3.4, 3.5, 4.1, 4.2, 4.4, 3.7
 */

import type { VocabularyItem, SentenceItem, Highlight } from '../types';

// ============================================================================
// Types
// ============================================================================

export type HighlightMode = 'vocabulary' | 'sentence' | 'none';

interface HighlightData {
  text: string;
  context: string;
  range: Range;
  highlightElement: HTMLElement;
}

// ============================================================================
// State
// ============================================================================

let currentMode: HighlightMode = 'none';
let currentArticleId: string | null = null;
let currentPartId: string | null = null;
let highlights: Map<string, Highlight> = new Map();

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize highlight manager
 */
export function initializeHighlightManager(
  articleId: string,
  partId: string,
  mode: HighlightMode = 'vocabulary'
): void {
  currentArticleId = articleId;
  currentPartId = partId;
  currentMode = mode;

  // Setup selection listener
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('touchend', handleTextSelection);
}

/**
 * Set highlight mode
 */
export function setHighlightMode(mode: HighlightMode): void {
  currentMode = mode;
}

/**
 * Get current highlight mode
 */
export function getHighlightMode(): HighlightMode {
  return currentMode;
}

/**
 * Cleanup highlight manager
 */
export function cleanupHighlightManager(): void {
  document.removeEventListener('mouseup', handleTextSelection);
  document.removeEventListener('touchend', handleTextSelection);
  highlights.clear();
}

// ============================================================================
// Text Selection and Highlighting
// ============================================================================

/**
 * Handle text selection
 */
async function handleTextSelection(
  event: MouseEvent | TouchEvent
): Promise<void> {
  if (currentMode === 'none') return;

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const selectedText = selection.toString().trim();
  if (!selectedText) return;

  // Check if selection is within article content
  const articleContent = document.querySelector('.article-part-content');
  if (!articleContent) return;

  const range = selection.getRangeAt(0);
  if (!articleContent.contains(range.commonAncestorContainer)) return;

  // Prevent highlighting if clicking on existing highlight
  const target = event.target as HTMLElement;
  if (
    target.classList.contains('highlight-vocabulary') ||
    target.classList.contains('highlight-sentence')
  ) {
    return;
  }

  try {
    if (currentMode === 'vocabulary') {
      await handleVocabularyHighlight(selectedText, range);
    } else if (currentMode === 'sentence') {
      await handleSentenceHighlight(selectedText, range);
    }

    // Clear selection
    selection.removeAllRanges();
  } catch (error) {
    console.error('Error handling highlight:', error);
  }
}

/**
 * Handle vocabulary highlighting
 */
async function handleVocabularyHighlight(
  text: string,
  range: Range
): Promise<void> {
  if (!currentArticleId || !currentPartId) return;

  // Validate vocabulary selection (should be 1-3 words)
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 3) {
    showTooltip('Please select 1-3 words for vocabulary', range);
    return;
  }

  // Get context (surrounding text)
  const context = getContext(range, 50);

  // Create highlight
  const highlightData = createHighlight(text, range, 'vocabulary');

  // Translate the vocabulary
  const translation = await translateVocabulary(text, context);

  // Create vocabulary item
  const vocabItem: VocabularyItem = {
    id: generateId(),
    word: text,
    translation: translation,
    context: context,
    exampleSentences: [],
    articleId: currentArticleId,
    partId: currentPartId,
    createdAt: new Date(),
    lastReviewed: new Date(),
    reviewCount: 0,
    difficulty: 5,
  };

  // Save to storage
  await saveVocabularyItem(vocabItem);

  // Store highlight reference
  highlights.set(vocabItem.id, {
    id: vocabItem.id,
    text: text,
    startOffset: 0,
    endOffset: text.length,
    type: 'vocabulary',
  });

  // Add click listener for pronunciation
  highlightData.highlightElement.addEventListener('click', () => {
    void pronounceText(text);
  });

  // Add hover listener for translation popup
  highlightData.highlightElement.addEventListener('mouseenter', e => {
    showTranslationPopup(e.target as HTMLElement, translation);
  });

  highlightData.highlightElement.addEventListener('mouseleave', () => {
    hideTranslationPopup();
  });

  // Add context menu listener
  highlightData.highlightElement.addEventListener('contextmenu', e => {
    e.preventDefault();
    showContextMenu(e as MouseEvent, vocabItem.id, 'vocabulary');
  });

  // Trigger UI update
  dispatchHighlightEvent('vocabulary-added', vocabItem);
}

/**
 * Handle sentence highlighting
 */
async function handleSentenceHighlight(
  text: string,
  range: Range
): Promise<void> {
  if (!currentArticleId || !currentPartId) return;

  // Validate sentence selection
  if (text.length < 10) {
    showTooltip('Please select a complete sentence', range);
    return;
  }

  // Create highlight
  const highlightData = createHighlight(text, range, 'sentence');

  // Translate the sentence
  const translation = await translateSentence(text);

  // Create sentence item
  const sentenceItem: SentenceItem = {
    id: generateId(),
    content: text,
    translation: translation,
    articleId: currentArticleId,
    partId: currentPartId,
    createdAt: new Date(),
  };

  // Save to storage
  await saveSentenceItem(sentenceItem);

  // Store highlight reference
  highlights.set(sentenceItem.id, {
    id: sentenceItem.id,
    text: text,
    startOffset: 0,
    endOffset: text.length,
    type: 'sentence',
  });

  // Add click listener for pronunciation
  highlightData.highlightElement.addEventListener('click', () => {
    void pronounceText(text);
  });

  // Add context menu listener
  highlightData.highlightElement.addEventListener('contextmenu', e => {
    e.preventDefault();
    showContextMenu(e as MouseEvent, sentenceItem.id, 'sentence');
  });

  // Trigger UI update
  dispatchHighlightEvent('sentence-added', sentenceItem);
}

/**
 * Create highlight element
 */
function createHighlight(
  text: string,
  range: Range,
  type: 'vocabulary' | 'sentence'
): HighlightData {
  const highlightClass =
    type === 'vocabulary' ? 'highlight-vocabulary' : 'highlight-sentence';

  // Create highlight span
  const highlight = document.createElement('span');
  highlight.className = highlightClass;
  highlight.textContent = text;
  highlight.setAttribute('data-highlight-type', type);
  highlight.setAttribute('data-highlight-text', text);

  // Get context
  const context = getContext(range, 100);

  // Replace range with highlight
  try {
    range.deleteContents();
    range.insertNode(highlight);
  } catch (error) {
    console.error('Error creating highlight:', error);
  }

  return {
    text,
    context,
    range,
    highlightElement: highlight,
  };
}

/**
 * Get context around selection
 */
function getContext(range: Range, maxLength: number): string {
  const container = range.commonAncestorContainer;
  const parent =
    container.nodeType === Node.TEXT_NODE
      ? container.parentElement
      : (container as HTMLElement);

  if (!parent) return '';

  const fullText = parent.textContent || '';
  const selectedText = range.toString();
  const startIndex = fullText.indexOf(selectedText);

  if (startIndex === -1) return fullText.substring(0, maxLength);

  // Get context before and after
  const contextStart = Math.max(0, startIndex - maxLength / 2);
  const contextEnd = Math.min(
    fullText.length,
    startIndex + selectedText.length + maxLength / 2
  );

  return fullText.substring(contextStart, contextEnd);
}

/**
 * Merge overlapping highlights
 */
export function mergeOverlappingHighlights(
  newHighlights: Highlight[]
): Highlight[] {
  // Sort by start offset
  const sorted = [...newHighlights].sort(
    (a, b) => a.startOffset - b.startOffset
  );
  const merged: Highlight[] = [];

  for (const highlight of sorted) {
    if (merged.length === 0) {
      merged.push(highlight);
      continue;
    }

    const last = merged[merged.length - 1];

    // Check for overlap
    if (highlight.startOffset <= last.endOffset) {
      // Merge highlights
      last.endOffset = Math.max(last.endOffset, highlight.endOffset);
      last.text = last.text + ' ' + highlight.text;
    } else {
      merged.push(highlight);
    }
  }

  return merged;
}

/**
 * Remove highlight
 */
export async function removeHighlight(
  highlightId: string,
  type: 'vocabulary' | 'sentence'
): Promise<void> {
  // Remove from storage
  if (type === 'vocabulary') {
    await removeVocabularyItem(highlightId);
  } else {
    await removeSentenceItem(highlightId);
  }

  // Remove from DOM
  const highlightElements = document.querySelectorAll(
    `[data-highlight-id="${highlightId}"]`
  );
  highlightElements.forEach(el => {
    const text = el.textContent || '';
    const textNode = document.createTextNode(text);
    el.parentNode?.replaceChild(textNode, el);
  });

  // Remove from map
  highlights.delete(highlightId);

  // Trigger UI update
  dispatchHighlightEvent(
    type === 'vocabulary' ? 'vocabulary-removed' : 'sentence-removed',
    { id: highlightId }
  );
}

// ============================================================================
// Translation
// ============================================================================

/**
 * Translate vocabulary
 */
async function translateVocabulary(
  text: string,
  context: string
): Promise<string> {
  try {
    // Send message to background script for translation
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_TEXT',
      payload: { text, context, type: 'vocabulary' },
    });

    if (response.success) {
      return response.data.translation;
    } else {
      console.error('Translation failed:', response.error);
      return `[Translation unavailable: ${text}]`;
    }
  } catch (error) {
    console.error('Error translating vocabulary:', error);
    return `[Translation error: ${text}]`;
  }
}

/**
 * Translate sentence
 */
async function translateSentence(text: string): Promise<string> {
  try {
    // Send message to background script for translation
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_TEXT',
      payload: { text, type: 'sentence' },
    });

    if (response.success) {
      return response.data.translation;
    } else {
      console.error('Translation failed:', response.error);
      return `[Translation unavailable]`;
    }
  } catch (error) {
    console.error('Error translating sentence:', error);
    return `[Translation error]`;
  }
}

// ============================================================================
// Storage Operations
// ============================================================================

/**
 * Save vocabulary item
 */
async function saveVocabularyItem(vocab: VocabularyItem): Promise<void> {
  const data = await chrome.storage.local.get('vocabulary');
  const vocabulary: Record<string, VocabularyItem> = data.vocabulary || {};
  vocabulary[vocab.id] = vocab;
  await chrome.storage.local.set({ vocabulary });
}

/**
 * Save sentence item
 */
async function saveSentenceItem(sentence: SentenceItem): Promise<void> {
  const data = await chrome.storage.local.get('sentences');
  const sentences: Record<string, SentenceItem> = data.sentences || {};
  sentences[sentence.id] = sentence;
  await chrome.storage.local.set({ sentences });
}

/**
 * Remove vocabulary item
 */
async function removeVocabularyItem(id: string): Promise<void> {
  const data = await chrome.storage.local.get('vocabulary');
  const vocabulary: Record<string, VocabularyItem> = data.vocabulary || {};
  delete vocabulary[id];
  await chrome.storage.local.set({ vocabulary });
}

/**
 * Remove sentence item
 */
async function removeSentenceItem(id: string): Promise<void> {
  const data = await chrome.storage.local.get('sentences');
  const sentences: Record<string, SentenceItem> = data.sentences || {};
  delete sentences[id];
  await chrome.storage.local.set({ sentences });
}

// ============================================================================
// UI Helpers
// ============================================================================

/**
 * Show tooltip
 */
function showTooltip(message: string, range: Range): void {
  const tooltip = document.createElement('div');
  tooltip.className = 'highlight-tooltip';
  tooltip.textContent = message;
  tooltip.style.cssText = `
    position: absolute;
    background: #333;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 1000;
    pointer-events: none;
  `;

  const rect = range.getBoundingClientRect();
  tooltip.style.left = `${rect.left + window.scrollX}px`;
  tooltip.style.top = `${rect.top + window.scrollY - 40}px`;

  document.body.appendChild(tooltip);

  setTimeout(() => {
    tooltip.remove();
  }, 2000);
}

/**
 * Show translation popup
 */
function showTranslationPopup(element: HTMLElement, translation: string): void {
  // Remove existing popup
  hideTranslationPopup();

  const popup = document.createElement('div');
  popup.className = 'translation-popup';
  popup.textContent = translation;
  popup.style.cssText = `
    position: absolute;
    background: white;
    border: 1px solid #e1e8ed;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    max-width: 300px;
    pointer-events: none;
  `;

  const rect = element.getBoundingClientRect();
  popup.style.left = `${rect.left + window.scrollX}px`;
  popup.style.top = `${rect.bottom + window.scrollY + 5}px`;

  document.body.appendChild(popup);
}

/**
 * Hide translation popup
 */
function hideTranslationPopup(): void {
  const popup = document.querySelector('.translation-popup');
  if (popup) {
    popup.remove();
  }
}

/**
 * Show context menu
 */
function showContextMenu(
  event: MouseEvent,
  itemId: string,
  type: 'vocabulary' | 'sentence'
): void {
  const contextMenu = document.querySelector('.context-menu') as HTMLElement;
  if (!contextMenu) return;

  contextMenu.classList.remove('hidden');
  contextMenu.style.left = `${event.pageX}px`;
  contextMenu.style.top = `${event.pageY}px`;

  // Store item info for context menu actions
  contextMenu.dataset.itemId = itemId;
  contextMenu.dataset.itemType = type;
}

/**
 * Pronounce text using Web Speech API
 */
async function pronounceText(text: string): Promise<void> {
  try {
    const { speak, isTTSSupported } = await import('../utils/tts-service');

    if (!isTTSSupported()) {
      console.warn('Text-to-speech is not supported in this browser');
      return;
    }

    await speak(text);
  } catch (error) {
    console.error('TTS error:', error);
  }
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Dispatch custom event for UI updates
 */
function dispatchHighlightEvent(eventName: string, detail: unknown): void {
  const event = new CustomEvent(eventName, { detail });
  document.dispatchEvent(event);
}
