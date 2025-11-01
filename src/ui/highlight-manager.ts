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

  // Setup double-click listener for sentence mode
  document.addEventListener('dblclick', handleDoubleClick);
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
  document.removeEventListener('dblclick', handleDoubleClick);
  highlights.clear();
}

// ============================================================================
// Text Selection and Highlighting
// ============================================================================

/**
 * Handle double-click for sentence selection in sentence mode
 */
async function handleDoubleClick(event: MouseEvent): Promise<void> {
  // Only handle in sentence mode
  if (currentMode !== 'sentence') return;

  const target = event.target as HTMLElement;

  // Check if double-click is within article content
  const articleContent = document.querySelector('.article-part-content');
  if (!articleContent || !articleContent.contains(target)) return;

  // Allow double-click on existing highlights - overlapping is supported

  // Find the sentence containing the clicked word
  const sentence = findSentenceAtPoint(event);
  if (!sentence) return;

  try {
    // Create a range for the sentence
    const range = document.createRange();
    range.selectNodeContents(sentence.node);
    range.setStart(sentence.node, sentence.startOffset);
    range.setEnd(sentence.node, sentence.endOffset);

    // Select the sentence visually (optional, for user feedback)
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Process the sentence highlight
    await handleSentenceHighlight(sentence.text, range);

    // Clear selection after processing
    if (selection) {
      selection.removeAllRanges();
    }
  } catch (error) {
    console.error('Error handling double-click sentence selection:', error);
  }
}

/**
 * Find the complete sentence at the clicked point
 */
function findSentenceAtPoint(event: MouseEvent): {
  text: string;
  node: Node;
  startOffset: number;
  endOffset: number;
} | null {
  const target = event.target as Node;

  // Get the text node
  let textNode: Node | null = target;
  if (textNode.nodeType !== Node.TEXT_NODE) {
    // If clicked on an element, try to find text node
    const walker = document.createTreeWalker(
      target,
      NodeFilter.SHOW_TEXT,
      null
    );
    textNode = walker.nextNode();
  }

  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return null;

  const fullText = textNode.textContent || '';

  // Get the character offset within the text node
  const range = document.caretRangeFromPoint(event.clientX, event.clientY);
  if (!range) return null;

  const clickOffset = range.startOffset;

  // Sentence boundary patterns
  // Matches: . ! ? followed by space/newline/end, or start of text
  const sentenceEndPattern = /[.!?][\s\n]|[.!?]$/g;

  // Find sentence start (look backwards from click point)
  let startOffset = 0;
  const textBeforeClick = fullText.substring(0, clickOffset);
  const matches = Array.from(textBeforeClick.matchAll(sentenceEndPattern));
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    startOffset = (lastMatch.index || 0) + lastMatch[0].length;
  }

  // Find sentence end (look forwards from click point)
  let endOffset = fullText.length;
  const textAfterClick = fullText.substring(clickOffset);
  const endMatch = textAfterClick.match(sentenceEndPattern);
  if (endMatch && endMatch.index !== undefined) {
    endOffset = clickOffset + endMatch.index + endMatch[0].trimEnd().length;
  }

  // Extract sentence text and trim
  const sentenceText = fullText.substring(startOffset, endOffset).trim();

  // Adjust offsets for trimmed text
  const trimStart = fullText
    .substring(startOffset, endOffset)
    .indexOf(sentenceText);
  startOffset += trimStart;
  endOffset = startOffset + sentenceText.length;

  // Validate sentence (should be at least 10 characters)
  if (sentenceText.length < 10) return null;

  return {
    text: sentenceText,
    node: textNode,
    startOffset,
    endOffset,
  };
}

/**
 * Handle text selection
 */
async function handleTextSelection(
  _event: MouseEvent | TouchEvent
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

  // Allow selection within existing highlights - overlapping is now supported
  // No need to prevent highlighting on existing highlights

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

  // Set the ID attribute on the DOM element for removal
  highlightData.highlightElement.setAttribute(
    'data-highlight-id',
    vocabItem.id
  );

  // Store highlight reference
  highlights.set(vocabItem.id, {
    id: vocabItem.id,
    text: text,
    startOffset: 0,
    endOffset: text.length,
    type: 'vocabulary',
  });

  // Add click listener - mode-aware behavior
  highlightData.highlightElement.addEventListener('click', (e: Event) => {
    e.stopPropagation(); // Prevent event bubbling

    // In vocabulary mode, clicking should NOT pronounce (user is selecting)
    // Only pronounce if we're NOT in vocabulary mode or if explicitly requested
    if (currentMode !== 'vocabulary') {
      void pronounceText(text);
    }
  });

  // Add hover listener for translation popup with delay
  let hoverTimeout: number | null = null;

  highlightData.highlightElement.addEventListener('mouseenter', e => {
    // Add delay to avoid accidental triggers and cursor overlap
    hoverTimeout = window.setTimeout(() => {
      showTranslationPopup(e.target as HTMLElement, translation);
    }, 200);
  });

  highlightData.highlightElement.addEventListener('mouseleave', () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    hideTranslationPopup();
  });

  // Add context menu listener
  highlightData.highlightElement.addEventListener('contextmenu', e => {
    e.preventDefault();
    showContextMenu(highlightData.highlightElement, vocabItem.id, 'vocabulary');
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

  // Set the ID attribute on the DOM element for removal
  highlightData.highlightElement.setAttribute(
    'data-highlight-id',
    sentenceItem.id
  );

  // Store highlight reference
  highlights.set(sentenceItem.id, {
    id: sentenceItem.id,
    text: text,
    startOffset: 0,
    endOffset: text.length,
    type: 'sentence',
  });

  // Add click listener - mode-aware behavior
  highlightData.highlightElement.addEventListener('click', (e: Event) => {
    e.stopPropagation(); // Prevent event bubbling

    // In sentence mode, clicking should NOT pronounce (user is selecting)
    // Only pronounce if we're NOT in sentence mode or if explicitly requested
    if (currentMode !== 'sentence') {
      void pronounceText(text);
    }
  });

  // Add context menu listener
  highlightData.highlightElement.addEventListener('contextmenu', e => {
    e.preventDefault();
    showContextMenu(
      highlightData.highlightElement,
      sentenceItem.id,
      'sentence'
    );
  });

  // Trigger UI update
  dispatchHighlightEvent('sentence-added', sentenceItem);
}

/**
 * Create highlight element with support for overlapping highlights
 */
function createHighlight(
  text: string,
  range: Range,
  type: 'vocabulary' | 'sentence'
): HighlightData {
  const highlightClass =
    type === 'vocabulary' ? 'highlight-vocabulary' : 'highlight-sentence';

  // Get context before modifying DOM
  const context = getContext(range, 100);

  // Check for trailing whitespace before extracting
  const rangeText = range.toString();
  const hasTrailingSpace = rangeText !== rangeText.trimEnd();
  const trailingWhitespace = hasTrailingSpace
    ? rangeText.slice(rangeText.trimEnd().length)
    : '';

  // Extract the contents of the range (may include existing highlights)
  const fragment = range.extractContents();

  // Create new highlight span
  const highlight = document.createElement('span');
  highlight.className = highlightClass;
  highlight.setAttribute('data-highlight-type', type);
  highlight.setAttribute('data-highlight-text', text);

  // Check if fragment contains existing highlights
  const existingHighlights = fragment.querySelectorAll('[data-highlight-type]');

  if (existingHighlights.length > 0) {
    // Preserve existing highlights by wrapping them
    highlight.appendChild(fragment);
  } else {
    // No existing highlights, just set text content
    highlight.textContent = text;
  }

  // Insert the new highlight
  try {
    range.insertNode(highlight);

    // Restore trailing whitespace if it was present
    if (trailingWhitespace) {
      const whitespaceNode = document.createTextNode(trailingWhitespace);
      highlight.parentNode?.insertBefore(whitespaceNode, highlight.nextSibling);
    }
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
    // Get user-selected target language
    const { targetLanguage } = await chrome.storage.local.get('targetLanguage');

    // Send message to background script for translation
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_TEXT',
      payload: {
        text,
        context,
        type: 'vocabulary',
        targetLanguage: targetLanguage || 'en',
      },
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
    // Get user-selected target language
    const { targetLanguage } = await chrome.storage.local.get('targetLanguage');

    // Send message to background script for translation
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_TEXT',
      payload: {
        text,
        type: 'sentence',
        targetLanguage: targetLanguage || 'en',
      },
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
 * Show translation popup with smart positioning
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
    opacity: 0;
    transition: opacity 0.2s ease;
  `;

  document.body.appendChild(popup);

  // Get dimensions after adding to DOM
  const rect = element.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  const offset = 12; // Distance from the word

  // Always show above the word to avoid cursor overlap
  // (users typically hover from bottom of word)
  popup.style.top = `${rect.top + window.scrollY - popupRect.height - offset}px`;

  // If popup would go off top of screen, adjust position
  if (rect.top - popupRect.height - offset < 0) {
    popup.style.top = `${window.scrollY + 10}px`; // 10px from top of viewport
  }

  // Smart horizontal positioning
  let leftPosition = rect.left + window.scrollX;

  // Check if popup would overflow right edge
  if (leftPosition + popupRect.width > viewportWidth) {
    // Align to right edge of word
    leftPosition = rect.right + window.scrollX - popupRect.width;
  }

  // Ensure popup doesn't overflow left edge
  if (leftPosition < 0) {
    leftPosition = 10; // Small margin from edge
  }

  popup.style.left = `${leftPosition}px`;

  // Fade in
  requestAnimationFrame(() => {
    popup.style.opacity = '1';
  });
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
 * Show context menu with smart positioning relative to the highlighted word or cursor
 */
export function showContextMenu(
  element: HTMLElement,
  itemId: string,
  type: 'vocabulary' | 'sentence',
  event?: MouseEvent
): void {
  const contextMenu = document.querySelector('.context-menu') as HTMLElement;
  if (!contextMenu) return;

  contextMenu.classList.remove('hidden');

  // Get the position of the element
  const rect = element.getBoundingClientRect();
  const menuRect = contextMenu.getBoundingClientRect();

  const offset = 8; // Distance from the cursor/element

  // Determine positioning based on whether event is provided
  let top: number;
  let left: number;
  let referenceY: number; // Y position to check against viewport

  if (event) {
    // For cards: position relative to cursor
    referenceY = event.clientY; // Cursor position in viewport
    top = event.pageY + offset; // Position below cursor
    left = event.pageX; // Horizontal at cursor
  } else {
    // For highlights: position relative to element
    referenceY = rect.bottom; // Element bottom in viewport
    top = rect.bottom + window.scrollY + offset; // Position below element
    left = rect.left + window.scrollX; // Horizontal at element
  }

  // Boundary checking for viewport edges
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Check if menu would overflow bottom of viewport
  if (referenceY + menuRect.height + offset > viewportHeight) {
    // Not enough space below, position above instead
    if (event) {
      // Position above cursor
      top = event.pageY - menuRect.height - offset;
    } else {
      // Position above element
      top = rect.top + window.scrollY - menuRect.height - offset;
    }
  }

  // Ensure menu doesn't go above viewport top
  const minTop = window.scrollY + 10; // 10px margin from top
  if (top < minTop) {
    top = minTop;
  }

  // Check if menu would overflow right edge
  if (left + menuRect.width > viewportWidth) {
    left = viewportWidth - menuRect.width - 10;
  }

  // Check if menu would overflow left edge
  if (left < 0) {
    left = 10; // Small margin from edge
  }

  // Apply positioning
  contextMenu.style.left = `${left}px`;
  contextMenu.style.top = `${top}px`;

  // Store item info for context menu actions
  contextMenu.dataset.itemId = itemId;
  contextMenu.dataset.itemType = type;
}

/**
 * Pronounce text using Web Speech API
 */
async function pronounceText(text: string): Promise<void> {
  try {
    const { speak, isTTSSupported } = await import('../utils/tts-service.js');

    if (!isTTSSupported()) {
      console.warn('Text-to-speech is not supported in this browser');
      return;
    }

    // Get language from article metadata
    const language = await getArticleLanguage();

    await speak(text, { language });
  } catch (error) {
    console.error('TTS error:', error);
  }
}

/**
 * Get the language of the current article
 */
async function getArticleLanguage(): Promise<string | undefined> {
  if (!currentArticleId) return undefined;

  try {
    // Get article from session storage
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0]?.id;
    if (!tabId) return undefined;

    const data = await chrome.storage.session.get(`article_${tabId}`);
    const article = data[`article_${tabId}`];
    return article?.originalLanguage;
  } catch (error) {
    console.error('Error getting article language:', error);
    return undefined;
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
