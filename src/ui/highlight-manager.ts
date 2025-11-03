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
let pendingSelection: { text: string; range: Range; context: string } | null =
  null;

// Selection state for click-to-select and delete functionality
let selectedHighlightId: string | null = null;
let selectedHighlightType: 'vocabulary' | 'sentence' | null = null;
let selectedHighlightElement: HTMLElement | null = null;

// Bulk delete state for None mode (keyboard-only)
let highlightsToDelete: Array<{
  id: string;
  type: 'vocabulary' | 'sentence';
  element: HTMLElement;
}> = [];

// Translation popup state for tracking and cleanup
let currentPopupElement: HTMLElement | null = null;
let currentPopupHighlightElement: HTMLElement | null = null;
let popupCheckInterval: number | null = null;

// ============================================================================
// Selection Management
// ============================================================================

/**
 * Select a highlight (adds visual selected state)
 */
function selectHighlight(
  id: string,
  type: 'vocabulary' | 'sentence',
  element: HTMLElement
): void {
  // Deselect any previously selected highlight
  deselectHighlight();

  // Set new selection
  selectedHighlightId = id;
  selectedHighlightType = type;
  selectedHighlightElement = element;

  // Add selected class
  element.classList.add('selected');
}

/**
 * Deselect the currently selected highlight
 */
function deselectHighlight(): void {
  if (selectedHighlightElement) {
    selectedHighlightElement.classList.remove('selected');
  }

  selectedHighlightId = null;
  selectedHighlightType = null;
  selectedHighlightElement = null;
}

/**
 * Get currently selected highlight info
 */
function getSelectedHighlight(): {
  id: string;
  type: 'vocabulary' | 'sentence';
  element: HTMLElement;
} | null {
  if (
    selectedHighlightId &&
    selectedHighlightType &&
    selectedHighlightElement
  ) {
    return {
      id: selectedHighlightId,
      type: selectedHighlightType,
      element: selectedHighlightElement,
    };
  }
  return null;
}

/**
 * Delete the currently selected highlight
 */
async function deleteSelectedHighlight(): Promise<void> {
  const selected = getSelectedHighlight();
  if (!selected) return;

  try {
    await removeHighlight(selected.id, selected.type);
    deselectHighlight();
  } catch (error) {
    console.error('Error deleting selected highlight:', error);
  }
}

// ============================================================================
// Bulk Delete Functionality (None Mode)
// ============================================================================

/**
 * Check if a highlight element is fully enclosed within a selection range
 */
function isHighlightFullyEnclosed(
  highlightElement: HTMLElement,
  selectionRange: Range
): boolean {
  try {
    // Create a range for the highlight element
    const highlightRange = document.createRange();
    highlightRange.selectNodeContents(highlightElement);

    // Compare ranges
    // Highlight is fully enclosed if:
    // - Selection starts before or at highlight start
    // - Selection ends after or at highlight end
    const startComparison = selectionRange.compareBoundaryPoints(
      Range.START_TO_START,
      highlightRange
    );
    const endComparison = selectionRange.compareBoundaryPoints(
      Range.END_TO_END,
      highlightRange
    );

    // startComparison <= 0 means selection starts before or at highlight
    // endComparison >= 0 means selection ends after or at highlight
    return startComparison <= 0 && endComparison >= 0;
  } catch (error) {
    console.error('Error checking highlight enclosure:', error);
    return false;
  }
}

/**
 * Get all highlights (vocabulary and sentence) that are fully enclosed in a range
 */
function getHighlightsInRange(range: Range): Array<{
  id: string;
  type: 'vocabulary' | 'sentence';
  element: HTMLElement;
}> {
  const enclosedHighlights: Array<{
    id: string;
    type: 'vocabulary' | 'sentence';
    element: HTMLElement;
  }> = [];

  // Find all highlight elements in the article content
  const articleContent = document.querySelector('.article-part-content');
  if (!articleContent) return enclosedHighlights;

  // Get all vocabulary and sentence highlights
  const allHighlights = articleContent.querySelectorAll(
    '[data-highlight-type][data-highlight-id]'
  );

  allHighlights.forEach(element => {
    const highlightElement = element as HTMLElement;
    const id = highlightElement.getAttribute('data-highlight-id');
    const type = highlightElement.getAttribute('data-highlight-type') as
      | 'vocabulary'
      | 'sentence';

    if (!id || !type) return;

    // Check if this highlight is fully enclosed in the selection
    if (isHighlightFullyEnclosed(highlightElement, range)) {
      enclosedHighlights.push({ id, type, element: highlightElement });
    }
  });

  return enclosedHighlights;
}

/**
 * Clear bulk delete preview state (keyboard-only workflow)
 */
function clearBulkDeletePreview(): void {
  // Clear preview highlighting
  highlightsToDelete.forEach(({ element }) => {
    element.classList.remove('will-delete');
  });

  highlightsToDelete = [];

  // Clear text selection
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
  }
}

/**
 * Execute bulk delete of all selected highlights (keyboard-triggered)
 */
async function executeBulkDelete(): Promise<void> {
  if (highlightsToDelete.length === 0) return;

  const count = highlightsToDelete.length;

  try {
    // Separate vocabulary and sentence IDs
    const vocabularyIds: string[] = [];
    const sentenceIds: string[] = [];

    highlightsToDelete.forEach(({ id, type }) => {
      if (type === 'vocabulary') {
        vocabularyIds.push(id);
      } else {
        sentenceIds.push(id);
      }
    });

    // Remove vocabulary items
    if (vocabularyIds.length > 0) {
      await bulkRemoveVocabulary(vocabularyIds);
    }

    // Remove sentence items
    if (sentenceIds.length > 0) {
      await bulkRemoveSentences(sentenceIds);
    }

    // Show success notification
    showBulkDeleteNotification(count, vocabularyIds.length, sentenceIds.length);
  } catch (error) {
    console.error('Error executing bulk delete:', error);
  } finally {
    // Clean up preview state
    clearBulkDeletePreview();
  }
}

/**
 * Bulk remove vocabulary items
 */
async function bulkRemoveVocabulary(vocabularyIds: string[]): Promise<void> {
  if (vocabularyIds.length === 0) return;

  try {
    // Get current vocabulary from storage
    const data = await chrome.storage.local.get('vocabulary');
    const vocabulary: Record<string, VocabularyItem> = data.vocabulary || {};

    // Remove each vocabulary item
    for (const id of vocabularyIds) {
      delete vocabulary[id];

      // Remove DOM highlight elements
      removeDOMHighlight(id);

      // Remove from highlights map
      highlights.delete(id);

      // Dispatch removal event for UI update
      dispatchHighlightEvent('vocabulary-removed', { id });
    }

    // Batch update storage (single write operation)
    await chrome.storage.local.set({ vocabulary });
  } catch (error) {
    console.error('Error bulk removing vocabulary:', error);
  }
}

/**
 * Bulk remove sentence items
 */
async function bulkRemoveSentences(sentenceIds: string[]): Promise<void> {
  if (sentenceIds.length === 0) return;

  try {
    // Get current sentences from storage
    const data = await chrome.storage.local.get('sentences');
    const sentences: Record<string, SentenceItem> = data.sentences || {};

    // Remove each sentence item
    for (const id of sentenceIds) {
      delete sentences[id];

      // Remove DOM highlight elements
      removeDOMHighlight(id);

      // Remove from highlights map
      highlights.delete(id);

      // Dispatch removal event for UI update
      dispatchHighlightEvent('sentence-removed', { id });
    }

    // Batch update storage (single write operation)
    await chrome.storage.local.set({ sentences });
  } catch (error) {
    console.error('Error bulk removing sentences:', error);
  }
}

/**
 * Show bulk delete success notification
 */
function showBulkDeleteNotification(
  total: number,
  vocabCount: number,
  sentenceCount: number
): void {
  const notification = document.createElement('div');
  notification.className = 'bulk-delete-notification';

  let message = `Deleted ${total} highlight${total > 1 ? 's' : ''}`;
  if (vocabCount > 0 && sentenceCount > 0) {
    message += ` (${vocabCount} vocabulary, ${sentenceCount} sentence${sentenceCount > 1 ? 's' : ''})`;
  } else if (vocabCount > 0) {
    message += ` (vocabulary)`;
  } else if (sentenceCount > 0) {
    message += ` (sentence${sentenceCount > 1 ? 's' : ''})`;
  }

  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
    max-width: 350px;
  `;

  document.body.appendChild(notification);

  // Fade in
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
  });

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

/**
 * Handle text selection in None mode for bulk delete (keyboard-only)
 */
function handleNoneModeTextSelection(_event: MouseEvent | TouchEvent): void {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    // No selection, clear preview if visible
    if (highlightsToDelete.length > 0) {
      clearBulkDeletePreview();
    }
    return;
  }

  const selectedText = selection.toString().trim();
  if (!selectedText) {
    if (highlightsToDelete.length > 0) {
      clearBulkDeletePreview();
    }
    return;
  }

  // Check if selection is within article content
  const articleContent = document.querySelector('.article-part-content');
  if (!articleContent) return;

  const range = selection.getRangeAt(0);
  if (!articleContent.contains(range.commonAncestorContainer)) return;

  // Get all highlights fully enclosed in the selection
  const enclosedHighlights = getHighlightsInRange(range);

  if (enclosedHighlights.length === 0) {
    // No highlights to delete, clear any existing preview
    if (highlightsToDelete.length > 0) {
      clearBulkDeletePreview();
    }
    return;
  }

  // Clear previous preview
  highlightsToDelete.forEach(({ element }) => {
    element.classList.remove('will-delete');
  });

  // Store highlights to delete
  highlightsToDelete = enclosedHighlights;

  // Add preview highlighting (red tint with pulsing animation)
  highlightsToDelete.forEach(({ element }) => {
    element.classList.add('will-delete');
  });
}

/**
 * Handle keyboard events for highlight management
 */
function handleKeyPress(event: KeyboardEvent): void {
  // Delete or Backspace key - delete selected highlight or bulk delete
  if (event.key === 'Delete' || event.key === 'Backspace') {
    // Check if we're in bulk delete mode (None mode with text selection)
    if (currentMode === 'none' && highlightsToDelete.length > 0) {
      event.preventDefault();
      void executeBulkDelete();
      return;
    }

    // Otherwise, handle single highlight deletion
    const selected = getSelectedHighlight();
    if (selected) {
      event.preventDefault(); // Prevent browser back navigation on Backspace
      void deleteSelectedHighlight();
    }
  }

  // Escape key - deselect without deleting or cancel bulk delete
  if (event.key === 'Escape') {
    if (currentMode === 'none' && highlightsToDelete.length > 0) {
      clearBulkDeletePreview();
    } else {
      deselectHighlight();
    }
  }
}

/**
 * Handle global mouse movement to detect when mouse leaves highlight area
 * This prevents stuck translation popups
 */
function handleGlobalMouseMove(event: MouseEvent): void {
  // Only check if we have an active popup
  if (!currentPopupElement || !currentPopupHighlightElement) {
    return;
  }

  // Get the element currently under the mouse cursor
  const elementUnderMouse = document.elementFromPoint(
    event.clientX,
    event.clientY
  );

  if (!elementUnderMouse) {
    // Mouse is outside the document, hide popup
    hideTranslationPopup();
    return;
  }

  // Check if the mouse is over the highlight element or any of its children
  const isOverHighlight =
    elementUnderMouse === currentPopupHighlightElement ||
    currentPopupHighlightElement.contains(elementUnderMouse);

  // Check if the mouse is over any highlight element (for nested highlights)
  const isOverAnyHighlight = elementUnderMouse.closest('[data-highlight-type]');

  // If mouse is not over the original highlight or any highlight, hide the popup
  if (!isOverHighlight && !isOverAnyHighlight) {
    hideTranslationPopup();
  }
}

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

  // Setup context menu listener to prevent native menu in None mode
  document.addEventListener('contextmenu', handleContextMenu);

  // Setup keyboard listener for delete functionality
  document.addEventListener('keydown', handleKeyPress);

  // Setup global mousemove listener to handle stuck popups
  document.addEventListener('mousemove', handleGlobalMouseMove);
}

/**
 * Set highlight mode
 */
export function setHighlightMode(mode: HighlightMode): void {
  currentMode = mode;
  // Clear selection when mode changes
  deselectHighlight();
  // Clear bulk delete state when mode changes
  clearBulkDeletePreview();
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
  document.removeEventListener('contextmenu', handleContextMenu);
  document.removeEventListener('keydown', handleKeyPress);
  document.removeEventListener('mousemove', handleGlobalMouseMove);
  highlights.clear();
  deselectHighlight();
  clearBulkDeletePreview();
  hideTranslationPopup();

  // Clear popup check interval if running
  if (popupCheckInterval) {
    clearInterval(popupCheckInterval);
    popupCheckInterval = null;
  }
}

// ============================================================================
// Text Selection and Highlighting
// ============================================================================

/**
 * Handle context menu event to prevent native menu in None mode
 */
function handleContextMenu(event: MouseEvent): void {
  // Check if right-click is within article content
  const articleContent = document.querySelector('.article-part-content');
  if (!articleContent) return;

  const target = event.target as HTMLElement;
  if (!articleContent.contains(target)) return;

  // Check if there's a text selection
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const selectedText = selection.toString().trim();
  if (!selectedText) return;

  // In None mode, prevent native context menu and show custom menu
  if (currentMode === 'none') {
    event.preventDefault();
    handleNoneModeSelection(selectedText, selection.getRangeAt(0), event);
    return;
  }

  // For other modes (vocabulary/sentence), check if clicking on existing highlight
  // If clicking on existing highlight, it has its own contextmenu handler
  // If clicking on new selection, let the mode handle it normally
  const isHighlight = target.closest('[data-highlight-type]');
  if (!isHighlight) {
    // New selection in vocabulary/sentence mode - prevent native menu
    // The mouseup handler will create the highlight automatically
    event.preventDefault();
  }
}

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
  event: MouseEvent | TouchEvent
): Promise<void> {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    // No selection - clear bulk delete preview if in None mode
    if (currentMode === 'none' && highlightsToDelete.length > 0) {
      clearBulkDeletePreview();
    }
    return;
  }

  const selectedText = selection.toString().trim();
  if (!selectedText) {
    if (currentMode === 'none' && highlightsToDelete.length > 0) {
      clearBulkDeletePreview();
    }
    return;
  }

  // Check if selection is within article content
  const articleContent = document.querySelector('.article-part-content');
  if (!articleContent) return;

  const range = selection.getRangeAt(0);
  if (!articleContent.contains(range.commonAncestorContainer)) return;

  // In None mode, handle bulk delete selection (keyboard-only)
  if (currentMode === 'none') {
    handleNoneModeTextSelection(event);
    return;
  }

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
 * Handle text selection in None mode - show context menu
 */
function handleNoneModeSelection(
  text: string,
  range: Range,
  event: MouseEvent | TouchEvent
): void {
  // Store the selection for later use
  const context = getContext(range, 100);

  // Clone the range to preserve it
  const clonedRange = range.cloneRange();

  pendingSelection = {
    text,
    range: clonedRange,
    context,
  };

  // Get mouse position for context menu
  let clientX: number;
  let clientY: number;

  if (event instanceof MouseEvent) {
    clientX = event.clientX;
    clientY = event.clientY;
  } else {
    // TouchEvent
    const touch = event.changedTouches[0];
    clientX = touch.clientX;
    clientY = touch.clientY;
  }

  // Show context menu with selection options
  showSelectionContextMenu(text, clientX, clientY);
}

/**
 * Detect overlapping vocabulary highlights within a range
 */
function detectOverlappingVocabulary(range: Range): string[] {
  const overlappingIds: string[] = [];

  try {
    // Clone the range to avoid modifying the original
    const clonedRange = range.cloneRange();
    const fragment = clonedRange.cloneContents();

    // Find all vocabulary highlights within the fragment
    const vocabularyHighlights = fragment.querySelectorAll(
      '[data-highlight-type="vocabulary"][data-highlight-id]'
    );

    vocabularyHighlights.forEach(element => {
      const id = element.getAttribute('data-highlight-id');
      if (id) {
        overlappingIds.push(id);
      }
    });
  } catch (error) {
    console.error('Error detecting overlapping vocabulary:', error);
  }

  return overlappingIds;
}

/**
 * Remove DOM highlight element by ID
 * Unwraps the element and replaces it with plain text or preserves nested content
 */
function removeDOMHighlight(highlightId: string): void {
  // Find all elements with this highlight ID
  const highlightElements = document.querySelectorAll(
    `[data-highlight-id="${highlightId}"]`
  );

  highlightElements.forEach(el => {
    // Check if this highlight contains nested highlights
    const nestedHighlights = el.querySelectorAll('[data-highlight-type]');

    if (nestedHighlights.length > 0) {
      // Has nested highlights - unwrap while preserving inner content
      const parent = el.parentNode;
      if (parent) {
        // Move all child nodes to the parent
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        // Remove the now-empty outer element
        parent.removeChild(el);
      }
    } else {
      // No nested highlights - replace with text node
      const text = el.textContent || '';
      const textNode = document.createTextNode(text);
      el.parentNode?.replaceChild(textNode, el);
    }
  });
}

/**
 * Remove subsumed vocabulary items from storage and DOM
 */
async function removeSubsumedVocabulary(
  vocabularyIds: string[]
): Promise<void> {
  if (vocabularyIds.length === 0) return;

  try {
    // Get current vocabulary from storage
    const data = await chrome.storage.local.get('vocabulary');
    const vocabulary: Record<string, VocabularyItem> = data.vocabulary || {};

    // Collect words for notification
    const removedWords: string[] = [];

    // Remove each vocabulary item
    for (const id of vocabularyIds) {
      if (vocabulary[id]) {
        removedWords.push(vocabulary[id].word);
        delete vocabulary[id];
      }

      // Remove DOM highlight elements
      removeDOMHighlight(id);

      // Remove from highlights map
      highlights.delete(id);

      // Dispatch removal event for UI update
      dispatchHighlightEvent('vocabulary-removed', { id });
    }

    // Batch update storage (single write operation)
    await chrome.storage.local.set({ vocabulary });

    // Show consolidation notification if items were removed
    if (removedWords.length > 0) {
      showConsolidationNotification(removedWords.length, removedWords);
    }
  } catch (error) {
    console.error('Error removing subsumed vocabulary:', error);
  }
}

/**
 * Show consolidation notification
 */
function showConsolidationNotification(count: number, words: string[]): void {
  // Only show in vocabulary mode
  if (currentMode !== 'vocabulary') return;

  const notification = document.createElement('div');
  notification.className = 'consolidation-notification';

  const message =
    count === 1
      ? `Consolidated "${words[0]}" into larger phrase`
      : count <= 3
        ? `Consolidated ${count} items: ${words.join(', ')}`
        : `Consolidated ${count} vocabulary items into phrase`;

  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
    max-width: 300px;
  `;

  document.body.appendChild(notification);

  // Fade in
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
  });

  // Auto-dismiss after 2 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 2000);
}

/**
 * Handle vocabulary highlighting
 */
async function handleVocabularyHighlight(
  text: string,
  range: Range
): Promise<void> {
  if (!currentArticleId || !currentPartId) return;

  // Detect overlapping vocabulary highlights
  const overlappingIds = detectOverlappingVocabulary(range);

  // Remove subsumed vocabulary items before creating new highlight
  if (overlappingIds.length > 0) {
    await removeSubsumedVocabulary(overlappingIds);
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

  // Add click listener - select the highlight
  highlightData.highlightElement.addEventListener('click', (e: Event) => {
    e.stopPropagation(); // Prevent event bubbling
    selectHighlight(vocabItem.id, 'vocabulary', highlightData.highlightElement);
  });

  // Add hover listener for translation popup with delay
  let hoverTimeout: number | null = null;

  highlightData.highlightElement.addEventListener('mouseenter', e => {
    // Increased delay to allow hover color to be visible before popup appears
    hoverTimeout = window.setTimeout(() => {
      showTranslationPopup(e.target as HTMLElement, translation);
    }, 500);
  });

  highlightData.highlightElement.addEventListener('mouseleave', () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    hideTranslationPopup();

    // Deselect when mouse leaves the highlight
    if (selectedHighlightId === vocabItem.id) {
      deselectHighlight();
    }
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

  // Add click listener - select the highlight
  highlightData.highlightElement.addEventListener('click', (e: Event) => {
    e.stopPropagation(); // Prevent event bubbling
    selectHighlight(
      sentenceItem.id,
      'sentence',
      highlightData.highlightElement
    );
  });

  // Add hover listener for translation popup with delay
  let hoverTimeout: number | null = null;

  highlightData.highlightElement.addEventListener('mouseenter', e => {
    // Increased delay to allow hover color to be visible before popup appears
    hoverTimeout = window.setTimeout(() => {
      showTranslationPopup(e.target as HTMLElement, translation);
    }, 500);
  });

  highlightData.highlightElement.addEventListener('mouseleave', () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    hideTranslationPopup();

    // Deselect when mouse leaves the highlight
    if (selectedHighlightId === sentenceItem.id) {
      deselectHighlight();
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
 * Configuration for context extraction
 */
const CONTEXT_CONFIG = {
  maxWordsLeft: 200, // Maximum words to include on the left side
  maxWordsRight: 200, // Maximum words to include on the right side
  stopAtSentenceBoundary: true, // Stop at sentence-ending punctuation
};

/**
 * Check if character is a sentence-ending punctuation
 * Supports multiple languages: Latin, CJK, Devanagari, Arabic
 */
function isSentenceEndPunctuation(char: string): boolean {
  // Latin: . ! ?
  // CJK (Chinese/Japanese): 。！？
  // Devanagari (Hindi): । ॥
  // Arabic: . ؟ !
  return /[.!?。！？।॥؟]/.test(char);
}

/**
 * Split text into words (handles multiple languages)
 * For CJK languages, each character is treated as a word
 */
function splitIntoWords(text: string): string[] {
  // Check if text contains CJK characters
  const hasCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(text);

  if (hasCJK) {
    // For CJK text, split into characters
    return text.split('');
  } else {
    // For other languages, split by whitespace and filter empty strings
    return text.split(/\s+/).filter(word => word.length > 0);
  }
}

/**
 * Find context boundary moving backward (left) from position
 * Counts words and stops at sentence boundary or word limit
 */
function findContextBoundaryLeft(
  text: string,
  startPos: number,
  maxWords: number
): number {
  // Get text from start to startPos
  const textBefore = text.substring(0, startPos);

  // Find the last sentence boundary before startPos
  let lastSentenceBoundary = -1;
  for (let i = textBefore.length - 1; i >= 0; i--) {
    if (isSentenceEndPunctuation(textBefore[i])) {
      // Check if this is followed by whitespace (to avoid abbreviations)
      if (i + 1 < textBefore.length && /\s/.test(textBefore[i + 1])) {
        lastSentenceBoundary = i + 1; // Position after punctuation
        break;
      }
    }
  }

  // If we found a sentence boundary and config says to stop there
  if (CONTEXT_CONFIG.stopAtSentenceBoundary && lastSentenceBoundary !== -1) {
    // Count words from sentence boundary to startPos
    const textSegment = textBefore.substring(lastSentenceBoundary, startPos);
    const words = splitIntoWords(textSegment);

    if (words.length <= maxWords) {
      // Sentence is within word limit, use sentence boundary
      return lastSentenceBoundary;
    }
  }

  // No sentence boundary or too many words, count back maxWords
  const words = splitIntoWords(textBefore);
  if (words.length <= maxWords) {
    // All text before is within limit
    return 0;
  }

  // Take last maxWords words
  const wordsToInclude = words.slice(-maxWords);
  const contextText = wordsToInclude.join(' ');

  // Find where this context starts in the original text
  const contextStart = textBefore.lastIndexOf(contextText);
  return contextStart !== -1 ? contextStart : 0;
}

/**
 * Find context boundary moving forward (right) from position
 * Counts words and stops at sentence boundary or word limit
 */
function findContextBoundaryRight(
  text: string,
  startPos: number,
  maxWords: number
): number {
  // Get text from startPos to end
  const textAfter = text.substring(startPos);

  // Find the first sentence boundary after startPos
  let firstSentenceBoundary = -1;
  for (let i = 0; i < textAfter.length; i++) {
    if (isSentenceEndPunctuation(textAfter[i])) {
      firstSentenceBoundary = i + 1; // Position after punctuation
      break;
    }
  }

  // If we found a sentence boundary and config says to stop there
  if (CONTEXT_CONFIG.stopAtSentenceBoundary && firstSentenceBoundary !== -1) {
    // Count words from startPos to sentence boundary
    const textSegment = textAfter.substring(0, firstSentenceBoundary);
    const words = splitIntoWords(textSegment);

    if (words.length <= maxWords) {
      // Sentence is within word limit, use sentence boundary
      return startPos + firstSentenceBoundary;
    }
  }

  // No sentence boundary or too many words, count forward maxWords
  const words = splitIntoWords(textAfter);
  if (words.length <= maxWords) {
    // All text after is within limit
    return text.length;
  }

  // Take first maxWords words
  const wordsToInclude = words.slice(0, maxWords);
  const contextText = wordsToInclude.join(' ');

  // Find where this context ends in the original text
  const contextEnd = text.indexOf(contextText, startPos) + contextText.length;
  return contextEnd !== -1 ? contextEnd : text.length;
}

/**
 * Get context around selection with word-based boundary detection
 * Extends up to maxWordsLeft/maxWordsRight words, stopping at sentence boundaries
 * Note: maxLength parameter is kept for backward compatibility but not used
 */
function getContext(range: Range, _maxLength: number): string {
  const container = range.commonAncestorContainer;
  const parent =
    container.nodeType === Node.TEXT_NODE
      ? container.parentElement
      : (container as HTMLElement);

  if (!parent) return '';

  const fullText = parent.textContent || '';
  const selectedText = range.toString();
  const startIndex = fullText.indexOf(selectedText);
  const endIndex = startIndex + selectedText.length;

  if (startIndex === -1) return '';

  // Find context boundaries using word-based counting
  const contextStart = findContextBoundaryLeft(
    fullText,
    startIndex,
    CONTEXT_CONFIG.maxWordsLeft
  );

  const contextEnd = findContextBoundaryRight(
    fullText,
    endIndex,
    CONTEXT_CONFIG.maxWordsRight
  );

  // Extract and trim the context
  let context = fullText.substring(contextStart, contextEnd).trim();

  // Remove leading/trailing punctuation that might be artifacts (but not sentence-ending punctuation)
  context = context.replace(/^[,;:]\s*/, '');

  // Don't remove trailing sentence punctuation as it's intentional
  // Only remove trailing commas, semicolons, colons
  context = context.replace(/\s*[,;:]$/, '');

  return context;
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

  // Remove from DOM using helper function
  removeDOMHighlight(highlightId);

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
    // Translation happens silently in background (no popup)

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

      // Show retry button only on failure after 3 attempts
      if (response.error.includes('after retries')) {
        showRetryButton(text, context);
        return `[Translation failed. Click retry button to try again.]`;
      } else if (response.error.includes('not available')) {
        return `[Translation API not available in this context]`;
      } else {
        return `[Translation unavailable: ${text}]`;
      }
    }
  } catch (error) {
    console.error('Error translating vocabulary:', error);
    showRetryButton(text, context);
    return `[Translation error. Click retry button to try again.]`;
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
  // Only set positioning styles inline, let CSS handle colors/theme
  popup.style.cssText = `
    position: absolute;
    opacity: 0;
  `;

  document.body.appendChild(popup);

  // Track the popup and its associated highlight element
  currentPopupElement = popup;
  currentPopupHighlightElement = element;

  // Get dimensions after adding to DOM
  const rect = element.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  const viewportWidth = window.innerWidth;

  const offset = 16; // Increased distance to keep highlight visible

  // Always show above the word to avoid cursor overlap and keep highlight visible
  // (users typically hover from bottom of word)
  popup.style.top = `${rect.top + window.scrollY - popupRect.height - offset}px`;

  // If popup would go off top of screen, show below instead
  if (rect.top - popupRect.height - offset < 0) {
    // Position below the highlight
    popup.style.top = `${rect.bottom + window.scrollY + offset}px`;
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

  // Clear tracked state
  currentPopupElement = null;
  currentPopupHighlightElement = null;
}

/**
 * Show context menu for text selection in None mode
 */
function showSelectionContextMenu(
  text: string,
  clientX: number,
  clientY: number
): void {
  const contextMenu = document.querySelector('.context-menu') as HTMLElement;
  if (!contextMenu) return;

  // Show appropriate menu items for selection
  const removeBtn = contextMenu.querySelector(
    '[data-action="remove"]'
  ) as HTMLElement;
  const addVocabBtn = contextMenu.querySelector(
    '[data-action="add-vocabulary"]'
  ) as HTMLElement;
  const addSentenceBtn = contextMenu.querySelector(
    '[data-action="add-sentence"]'
  ) as HTMLElement;
  const pronounceBtn = contextMenu.querySelector(
    '[data-action="pronounce"]'
  ) as HTMLElement;

  if (removeBtn) removeBtn.style.display = 'none';
  if (addVocabBtn) addVocabBtn.style.display = 'block';
  if (addSentenceBtn) addSentenceBtn.style.display = 'block';
  if (pronounceBtn) pronounceBtn.style.display = 'block';

  contextMenu.classList.remove('hidden');

  // Position menu at cursor
  const pageX = clientX + window.scrollX;
  const pageY = clientY + window.scrollY;

  // Get menu dimensions after showing
  const menuRect = contextMenu.getBoundingClientRect();
  const offset = 8;

  let top = pageY + offset;
  let left = pageX;

  // Boundary checking
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Check if menu would overflow bottom
  if (clientY + menuRect.height + offset > viewportHeight) {
    top = pageY - menuRect.height - offset;
  }

  // Check if menu would overflow right edge
  if (clientX + menuRect.width > viewportWidth) {
    left = pageX - menuRect.width;
  }

  // Ensure menu doesn't go off left edge
  if (left < window.scrollX) {
    left = window.scrollX + 10;
  }

  // Ensure menu doesn't go off top
  const minTop = window.scrollY + 10;
  if (top < minTop) {
    top = minTop;
  }

  contextMenu.style.left = `${left}px`;
  contextMenu.style.top = `${top}px`;

  // Store selection info
  contextMenu.dataset.itemId = '';
  contextMenu.dataset.itemType = 'selection';
  contextMenu.dataset.selectedText = text;
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

  // Show appropriate menu items for existing highlights
  const removeBtn = contextMenu.querySelector(
    '[data-action="remove"]'
  ) as HTMLElement;
  const addVocabBtn = contextMenu.querySelector(
    '[data-action="add-vocabulary"]'
  ) as HTMLElement;
  const addSentenceBtn = contextMenu.querySelector(
    '[data-action="add-sentence"]'
  ) as HTMLElement;
  const pronounceBtn = contextMenu.querySelector(
    '[data-action="pronounce"]'
  ) as HTMLElement;

  if (removeBtn) removeBtn.style.display = 'block';
  if (addVocabBtn) addVocabBtn.style.display = 'none';
  if (addSentenceBtn) addSentenceBtn.style.display = 'none';
  if (pronounceBtn) pronounceBtn.style.display = 'block';

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
  contextMenu.dataset.selectedText = '';
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
  const event = new CustomEvent(eventName, {
    detail,
    bubbles: true,
    composed: true,
  });
  document.dispatchEvent(event);
}

/**
 * Handle context menu action for pending selection
 */
export async function handleSelectionContextMenuAction(
  action: string
): Promise<void> {
  if (!pendingSelection) return;

  const { text, range } = pendingSelection;

  try {
    if (action === 'add-vocabulary') {
      await handleVocabularyHighlight(text, range);
    } else if (action === 'add-sentence') {
      // Validate sentence selection
      if (text.length < 10) {
        showTooltip('Please select a complete sentence', range);
        return;
      }
      await handleSentenceHighlight(text, range);
    } else if (action === 'pronounce') {
      await pronounceText(text);
    }
  } catch (error) {
    console.error('Error handling selection action:', error);
  } finally {
    // Clear pending selection
    pendingSelection = null;

    // Clear text selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }
}

/**
 * Show retry button on translation failure
 */
function showRetryButton(text: string, context: string): void {
  // Remove existing retry button if any
  hideRetryButton();

  const retryButton = document.createElement('div');
  retryButton.id = 'translation-retry-button';
  retryButton.className = 'retry-button';

  const truncatedText = text.length > 30 ? text.substring(0, 30) + '...' : text;

  retryButton.innerHTML = `
    <div class="retry-button-content">
      <span class="retry-button-icon">⚠️</span>
      <div class="retry-button-text">
        <div class="retry-button-title">Translation Failed</div>
        <div class="retry-button-message">"${truncatedText}"</div>
      </div>
      <button class="retry-button-action">Retry</button>
      <button class="retry-button-close">×</button>
    </div>
  `;

  document.body.appendChild(retryButton);

  // Add event listeners
  const retryBtn = retryButton.querySelector('.retry-button-action');
  const closeBtn = retryButton.querySelector('.retry-button-close');

  if (retryBtn) {
    retryBtn.addEventListener('click', async () => {
      hideRetryButton();
      // Retry translation
      const translation = await translateVocabulary(text, context);
      console.log('Retry translation result:', translation);
      // Note: The vocabulary card will need to be manually refreshed to show new translation
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideRetryButton();
    });
  }

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    hideRetryButton();
  }, 10000);
}

/**
 * Hide retry button
 */
function hideRetryButton(): void {
  const retryButton = document.getElementById('translation-retry-button');
  if (retryButton) {
    retryButton.remove();
  }
}
