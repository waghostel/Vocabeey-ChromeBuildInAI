/**
 * Highlight Manager - Handles text selection and highlighting for vocabulary and sentences
 * Implements Requirements: 3.1, 3.2, 3.4, 3.5, 4.1, 4.2, 4.4, 3.7
 */
import { pronounceText } from './tts-handler.js';
// ============================================================================
// State
// ============================================================================
let currentMode = 'none';
let currentArticleId = null;
let currentPartId = null;
let currentArticleLanguage = null;
let highlights = new Map();
let pendingSelection = null;
// Selection state for click-to-select and delete functionality
let selectedHighlightId = null;
let selectedHighlightType = null;
let selectedHighlightElement = null;
// Bulk delete state for None mode (keyboard-only)
let highlightsToDelete = [];
// Translation popup state for tracking and cleanup
let currentPopupElement = null;
let currentPopupHighlightElement = null;
let popupCheckInterval = null;
// ============================================================================
// Selection Management
// ============================================================================
/**
 * Select a highlight (adds visual selected state)
 */
function selectHighlight(id, type, element) {
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
function deselectHighlight() {
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
function getSelectedHighlight() {
    if (selectedHighlightId &&
        selectedHighlightType &&
        selectedHighlightElement) {
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
async function deleteSelectedHighlight() {
    const selected = getSelectedHighlight();
    if (!selected)
        return;
    try {
        await removeHighlight(selected.id, selected.type);
        deselectHighlight();
    }
    catch (error) {
        console.error('Error deleting selected highlight:', error);
    }
}
// ============================================================================
// Bulk Delete Functionality (None Mode)
// ============================================================================
/**
 * Check if a highlight element is fully enclosed within a selection range
 */
function isHighlightFullyEnclosed(highlightElement, selectionRange) {
    try {
        // Create a range for the highlight element
        const highlightRange = document.createRange();
        highlightRange.selectNodeContents(highlightElement);
        // Compare ranges
        // Highlight is fully enclosed if:
        // - Selection starts before or at highlight start
        // - Selection ends after or at highlight end
        const startComparison = selectionRange.compareBoundaryPoints(Range.START_TO_START, highlightRange);
        const endComparison = selectionRange.compareBoundaryPoints(Range.END_TO_END, highlightRange);
        // startComparison <= 0 means selection starts before or at highlight
        // endComparison >= 0 means selection ends after or at highlight
        return startComparison <= 0 && endComparison >= 0;
    }
    catch (error) {
        console.error('Error checking highlight enclosure:', error);
        return false;
    }
}
/**
 * Get all highlights (vocabulary and sentence) that are fully enclosed in a range
 */
function getHighlightsInRange(range) {
    const enclosedHighlights = [];
    // Find all highlight elements in the article content
    const articleContent = document.querySelector('.article-part-content');
    if (!articleContent)
        return enclosedHighlights;
    // Get all vocabulary and sentence highlights
    const allHighlights = articleContent.querySelectorAll('[data-highlight-type][data-highlight-id]');
    allHighlights.forEach(element => {
        const highlightElement = element;
        const id = highlightElement.getAttribute('data-highlight-id');
        const type = highlightElement.getAttribute('data-highlight-type');
        if (!id || !type)
            return;
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
function clearBulkDeletePreview() {
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
async function executeBulkDelete() {
    if (highlightsToDelete.length === 0)
        return;
    const count = highlightsToDelete.length;
    try {
        // Separate vocabulary and sentence IDs
        const vocabularyIds = [];
        const sentenceIds = [];
        highlightsToDelete.forEach(({ id, type }) => {
            if (type === 'vocabulary') {
                vocabularyIds.push(id);
            }
            else {
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
    }
    catch (error) {
        console.error('Error executing bulk delete:', error);
    }
    finally {
        // Clean up preview state
        clearBulkDeletePreview();
    }
}
/**
 * Bulk remove vocabulary items
 */
async function bulkRemoveVocabulary(vocabularyIds) {
    if (vocabularyIds.length === 0)
        return;
    try {
        // Get current vocabulary from storage
        const data = await chrome.storage.local.get('vocabulary');
        const vocabulary = data.vocabulary || {};
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
    }
    catch (error) {
        console.error('Error bulk removing vocabulary:', error);
    }
}
/**
 * Bulk remove sentence items
 */
async function bulkRemoveSentences(sentenceIds) {
    if (sentenceIds.length === 0)
        return;
    try {
        // Get current sentences from storage
        const data = await chrome.storage.local.get('sentences');
        const sentences = data.sentences || {};
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
    }
    catch (error) {
        console.error('Error bulk removing sentences:', error);
    }
}
/**
 * Show bulk delete success notification
 */
function showBulkDeleteNotification(total, vocabCount, sentenceCount) {
    const notification = document.createElement('div');
    notification.className = 'bulk-delete-notification';
    let message = `Deleted ${total} highlight${total > 1 ? 's' : ''}`;
    if (vocabCount > 0 && sentenceCount > 0) {
        message += ` (${vocabCount} vocabulary, ${sentenceCount} sentence${sentenceCount > 1 ? 's' : ''})`;
    }
    else if (vocabCount > 0) {
        message += ` (vocabulary)`;
    }
    else if (sentenceCount > 0) {
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
function handleNoneModeTextSelection(_event) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
        // No selection, clear preview if visible
        if (highlightsToDelete.length > 0) {
            clearBulkDeletePreview();
        }
        return;
    }
    const selectedText = selection.toString();
    // Check if selection is empty (only whitespace) without modifying the text
    if (!selectedText.trim()) {
        if (highlightsToDelete.length > 0) {
            clearBulkDeletePreview();
        }
        return;
    }
    // Check if selection is within article content
    const articleContent = document.querySelector('.article-part-content');
    if (!articleContent)
        return;
    const range = selection.getRangeAt(0);
    if (!articleContent.contains(range.commonAncestorContainer))
        return;
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
function handleKeyPress(event) {
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
        }
        else {
            deselectHighlight();
        }
    }
}
/**
 * Handle global mouse movement to detect when mouse leaves highlight area
 * This prevents stuck translation popups
 */
function handleGlobalMouseMove(event) {
    // Only check if we have an active popup
    if (!currentPopupElement || !currentPopupHighlightElement) {
        return;
    }
    // Get the element currently under the mouse cursor
    const elementUnderMouse = document.elementFromPoint(event.clientX, event.clientY);
    if (!elementUnderMouse) {
        // Mouse is outside the document, hide popup
        hideTranslationPopup();
        return;
    }
    // Check if the mouse is over the highlight element or any of its children
    const isOverHighlight = elementUnderMouse === currentPopupHighlightElement ||
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
export function initializeHighlightManager(articleId, partId, mode = 'vocabulary', articleLanguage) {
    currentArticleId = articleId;
    currentPartId = partId;
    currentMode = mode;
    currentArticleLanguage = articleLanguage || null;
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
 * Restore highlights for a specific article part
 * This function reads stored vocabulary and sentence items and recreates their highlights in the DOM
 */
export async function restoreHighlightsForPart(articleId, partId) {
    console.log('🔄 Restoring highlights for part:', { articleId, partId });
    try {
        // Get vocabulary items for this part
        const vocabData = await chrome.storage.local.get('vocabulary');
        const allVocab = vocabData.vocabulary || {};
        const partVocab = Object.values(allVocab).filter(v => v.articleId === articleId && v.partId === partId);
        // Get sentence items for this part
        const sentenceData = await chrome.storage.local.get('sentences');
        const allSentences = sentenceData.sentences || {};
        const partSentences = Object.values(allSentences).filter(s => s.articleId === articleId && s.partId === partId);
        console.log('📊 Found items to restore:', {
            vocabulary: partVocab.length,
            sentences: partSentences.length,
        });
        if (partVocab.length === 0 && partSentences.length === 0) {
            console.log('ℹ️ No highlights to restore for this part');
            return;
        }
        let restoredVocab = 0;
        let restoredSentences = 0;
        let failedVocab = 0;
        let failedSentences = 0;
        // Restore vocabulary highlights
        for (const vocabItem of partVocab) {
            const success = await restoreVocabularyHighlight(vocabItem);
            if (success) {
                restoredVocab++;
            }
            else {
                failedVocab++;
            }
        }
        // Restore sentence highlights
        for (const sentenceItem of partSentences) {
            const success = await restoreSentenceHighlight(sentenceItem);
            if (success) {
                restoredSentences++;
            }
            else {
                failedSentences++;
            }
        }
        console.log('✅ Highlight restoration complete:', {
            vocabulary: { restored: restoredVocab, failed: failedVocab },
            sentences: { restored: restoredSentences, failed: failedSentences },
        });
        if (failedVocab > 0 || failedSentences > 0) {
            console.warn('⚠️ Some highlights could not be restored. This may happen if the article content was edited.');
        }
    }
    catch (error) {
        console.error('❌ Error restoring highlights:', error);
    }
}
/**
 * Restore a vocabulary highlight in the DOM
 * Returns true if successful, false otherwise
 */
async function restoreVocabularyHighlight(vocabItem) {
    try {
        // Find the text in the DOM using the word and context
        const range = findTextInDOM(vocabItem.word, vocabItem.context);
        if (!range) {
            console.warn('⚠️ Could not find text in DOM for vocabulary:', vocabItem.word);
            return false;
        }
        // Create the highlight element
        const highlightData = createHighlight(vocabItem.word, range, 'vocabulary');
        // Set the ID attribute on the DOM element
        highlightData.highlightElement.setAttribute('data-highlight-id', vocabItem.id);
        // Store highlight reference
        highlights.set(vocabItem.id, {
            id: vocabItem.id,
            text: vocabItem.word,
            startOffset: 0,
            endOffset: vocabItem.word.length,
            type: 'vocabulary',
        });
        // Add click listener - pronounce the word
        highlightData.highlightElement.addEventListener('click', (e) => {
            e.stopPropagation();
            void pronounceText(highlightData.highlightElement, vocabItem.word, currentArticleLanguage || undefined);
        });
        // Add hover listener for translation popup with delay
        let hoverTimeout = null;
        highlightData.highlightElement.addEventListener('mouseenter', e => {
            hoverTimeout = window.setTimeout(() => {
                void getTranslationForHighlight(vocabItem.id, 'vocabulary').then(currentTranslation => {
                    showTranslationPopup(e.target, currentTranslation);
                });
            }, 50);
        });
        highlightData.highlightElement.addEventListener('mouseleave', () => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            hideTranslationPopup();
            if (selectedHighlightId === vocabItem.id) {
                deselectHighlight();
            }
        });
        // Add context menu listener
        highlightData.highlightElement.addEventListener('contextmenu', e => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(highlightData.highlightElement, vocabItem.id, 'vocabulary');
        });
        // Add click listener for selection in None mode
        highlightData.highlightElement.addEventListener('click', e => {
            if (currentMode === 'none') {
                e.stopPropagation();
                selectHighlight(vocabItem.id, 'vocabulary', highlightData.highlightElement);
            }
        });
        return true;
    }
    catch (error) {
        console.error('❌ Error restoring vocabulary highlight:', vocabItem.word, error);
        return false;
    }
}
/**
 * Restore a sentence highlight in the DOM
 * Returns true if successful, false otherwise
 */
async function restoreSentenceHighlight(sentenceItem) {
    try {
        // Find the text in the DOM using the sentence content
        const range = findTextInDOM(sentenceItem.content, sentenceItem.content);
        if (!range) {
            console.warn('⚠️ Could not find text in DOM for sentence:', sentenceItem.content.substring(0, 50));
            return false;
        }
        // Create the highlight element
        const highlightData = createHighlight(sentenceItem.content, range, 'sentence');
        // Set the ID attribute on the DOM element
        highlightData.highlightElement.setAttribute('data-highlight-id', sentenceItem.id);
        // Store highlight reference
        highlights.set(sentenceItem.id, {
            id: sentenceItem.id,
            text: sentenceItem.content,
            startOffset: 0,
            endOffset: sentenceItem.content.length,
            type: 'sentence',
        });
        // Add click listener - pronounce the sentence
        highlightData.highlightElement.addEventListener('click', (e) => {
            e.stopPropagation();
            void pronounceText(highlightData.highlightElement, sentenceItem.content, currentArticleLanguage || undefined);
        });
        // Add hover listener for translation popup with delay
        let hoverTimeout = null;
        highlightData.highlightElement.addEventListener('mouseenter', e => {
            hoverTimeout = window.setTimeout(() => {
                void getTranslationForHighlight(sentenceItem.id, 'sentence').then(currentTranslation => {
                    showTranslationPopup(e.target, currentTranslation);
                });
            }, 50);
        });
        highlightData.highlightElement.addEventListener('mouseleave', () => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            hideTranslationPopup();
            if (selectedHighlightId === sentenceItem.id) {
                deselectHighlight();
            }
        });
        // Add context menu listener
        highlightData.highlightElement.addEventListener('contextmenu', e => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(highlightData.highlightElement, sentenceItem.id, 'sentence');
        });
        // Add click listener for selection in None mode
        highlightData.highlightElement.addEventListener('click', e => {
            if (currentMode === 'none') {
                e.stopPropagation();
                selectHighlight(sentenceItem.id, 'sentence', highlightData.highlightElement);
            }
        });
        return true;
    }
    catch (error) {
        console.error('❌ Error restoring sentence highlight:', sentenceItem.content.substring(0, 50), error);
        return false;
    }
}
/**
 * Find text in the DOM and return a Range object
 * Uses context to disambiguate when text appears multiple times
 */
function findTextInDOM(text, context) {
    const articleContent = document.querySelector('.article-part-content');
    if (!articleContent) {
        console.error('Article content not found');
        return null;
    }
    const trimmedText = text.trim();
    // Create a TreeWalker to traverse all text nodes
    const walker = document.createTreeWalker(articleContent, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
        // Skip empty text nodes and nodes that are already inside highlights
        const textNode = node;
        const parent = textNode.parentElement;
        // Skip if parent is already a highlight element
        if (parent && parent.hasAttribute('data-highlight-id')) {
            continue;
        }
        textNodes.push(textNode);
    }
    // Strategy 1: Try exact match with context verification
    for (const textNode of textNodes) {
        const nodeText = textNode.textContent || '';
        const index = nodeText.indexOf(trimmedText);
        if (index !== -1) {
            // Found the text, create a range
            const range = document.createRange();
            range.setStart(textNode, index);
            range.setEnd(textNode, index + trimmedText.length);
            // Verify this is the right occurrence by checking context
            if (context && context.length > trimmedText.length) {
                // Get surrounding text to verify context
                const parent = textNode.parentElement;
                if (parent) {
                    const parentText = parent.textContent || '';
                    const textInParent = parentText.indexOf(trimmedText);
                    if (textInParent !== -1) {
                        // Extract context around the found text
                        const contextStart = Math.max(0, textInParent - 100);
                        const contextEnd = Math.min(parentText.length, textInParent + trimmedText.length + 100);
                        const foundContext = parentText.substring(contextStart, contextEnd);
                        // Check if the stored context is similar to the found context
                        // Use a simple substring check (could be improved with fuzzy matching)
                        if (context.includes(trimmedText) &&
                            foundContext.includes(trimmedText)) {
                            return range;
                        }
                    }
                }
            }
            else {
                // No context to verify, return the first match
                return range;
            }
        }
    }
    // Strategy 2: If exact match not found, try normalized whitespace search
    for (const textNode of textNodes) {
        const nodeText = textNode.textContent || '';
        // Normalize whitespace for comparison
        const normalizedNodeText = nodeText.replace(/\s+/g, ' ').trim();
        const normalizedSearchText = trimmedText.replace(/\s+/g, ' ').trim();
        const index = normalizedNodeText.indexOf(normalizedSearchText);
        if (index !== -1) {
            // Found with normalized text, now find the actual position in original text
            // We need to map the normalized index back to the original text
            let normalizedCharCount = 0;
            let startIndex = -1;
            for (let i = 0; i < nodeText.length; i++) {
                const char = nodeText[i];
                const isWhitespace = /\s/.test(char);
                if (!isWhitespace || (i > 0 && !/\s/.test(nodeText[i - 1]))) {
                    if (normalizedCharCount === index) {
                        startIndex = i;
                    }
                    normalizedCharCount++;
                }
                if (startIndex !== -1 &&
                    normalizedCharCount >= index + normalizedSearchText.length) {
                    const range = document.createRange();
                    range.setStart(textNode, startIndex);
                    range.setEnd(textNode, i + 1);
                    return range;
                }
            }
            // Fallback: try simple indexOf
            const actualIndex = nodeText.indexOf(trimmedText);
            if (actualIndex !== -1) {
                const range = document.createRange();
                range.setStart(textNode, actualIndex);
                range.setEnd(textNode, actualIndex + trimmedText.length);
                return range;
            }
        }
    }
    // Strategy 3: Try case-insensitive search as last resort
    const lowerText = trimmedText.toLowerCase();
    for (const textNode of textNodes) {
        const nodeText = textNode.textContent || '';
        const lowerNodeText = nodeText.toLowerCase();
        const index = lowerNodeText.indexOf(lowerText);
        if (index !== -1) {
            const range = document.createRange();
            range.setStart(textNode, index);
            range.setEnd(textNode, index + trimmedText.length);
            return range;
        }
    }
    console.warn('⚠️ Text not found in DOM:', trimmedText.substring(0, 50));
    return null;
}
/**
 * Set highlight mode
 */
export function setHighlightMode(mode) {
    currentMode = mode;
    // Clear selection when mode changes
    deselectHighlight();
    // Clear bulk delete state when mode changes
    clearBulkDeletePreview();
}
/**
 * Get current highlight mode
 */
export function getHighlightMode() {
    return currentMode;
}
/**
 * Cleanup highlight manager
 * CRITICAL: Properly removes all event listeners and DOM elements to prevent memory leaks
 */
export function cleanupHighlightManager() {
    console.log('🧹 Cleaning up highlight manager...');
    // Remove global event listeners
    document.removeEventListener('mouseup', handleTextSelection);
    document.removeEventListener('touchend', handleTextSelection);
    document.removeEventListener('dblclick', handleDoubleClick);
    document.removeEventListener('contextmenu', handleContextMenu);
    document.removeEventListener('keydown', handleKeyPress);
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    // Clear translation popup interval
    if (popupCheckInterval) {
        clearInterval(popupCheckInterval);
        popupCheckInterval = null;
    }
    // Remove and cleanup translation popup
    hideTranslationPopup();
    if (currentPopupElement) {
        currentPopupElement.remove();
        currentPopupElement = null;
    }
    currentPopupHighlightElement = null;
    // Remove all highlight elements from DOM and their event listeners
    const articleContent = document.querySelector('.article-part-content');
    if (articleContent) {
        // Find all highlight elements
        const highlightElements = articleContent.querySelectorAll('[data-highlight-id]');
        highlightElements.forEach(element => {
            const parent = element.parentNode;
            if (parent) {
                // Replace highlight with plain text to free memory
                const textNode = document.createTextNode(element.textContent || '');
                parent.replaceChild(textNode, element);
            }
        });
    }
    // Clear all state
    highlights.clear();
    deselectHighlight();
    clearBulkDeletePreview();
    // Reset module-level state
    currentMode = 'none';
    currentArticleId = null;
    currentPartId = null;
    currentArticleLanguage = null;
    pendingSelection = null;
    console.log('✅ Highlight manager cleaned up');
}
/**
 * Pause highlight manager (disable event listeners during edit mode)
 */
export function pauseHighlightManager() {
    document.removeEventListener('mouseup', handleTextSelection);
    document.removeEventListener('touchend', handleTextSelection);
    document.removeEventListener('dblclick', handleDoubleClick);
    document.removeEventListener('contextmenu', handleContextMenu);
    document.removeEventListener('keydown', handleKeyPress);
    document.removeEventListener('mousemove', handleGlobalMouseMove);
}
/**
 * Resume highlight manager (re-enable event listeners after edit mode)
 */
export function resumeHighlightManager() {
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('touchend', handleTextSelection);
    document.addEventListener('dblclick', handleDoubleClick);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('mousemove', handleGlobalMouseMove);
}
// ============================================================================
// Text Selection and Highlighting
// ============================================================================
/**
 * Handle context menu event to prevent native menu in None mode
 */
function handleContextMenu(event) {
    // Check if right-click is within article content
    const articleContent = document.querySelector('.article-part-content');
    if (!articleContent)
        return;
    const target = event.target;
    if (!articleContent.contains(target))
        return;
    // Check if there's a text selection
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed)
        return;
    const selectedText = selection.toString();
    // Check if selection is empty (only whitespace) without modifying the text
    if (!selectedText.trim())
        return;
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
async function handleDoubleClick(event) {
    // Only handle in sentence mode
    if (currentMode !== 'sentence')
        return;
    const target = event.target;
    // Check if double-click is within article content
    const articleContent = document.querySelector('.article-part-content');
    if (!articleContent || !articleContent.contains(target))
        return;
    // Allow double-click on existing highlights - overlapping is supported
    // Find the sentence containing the clicked word
    const sentence = findSentenceAtPoint(event);
    if (!sentence)
        return;
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
    }
    catch (error) {
        console.error('Error handling double-click sentence selection:', error);
    }
}
/**
 * Find the complete sentence at the clicked point
 */
function findSentenceAtPoint(event) {
    const target = event.target;
    // Get the text node
    let textNode = target;
    if (textNode.nodeType !== Node.TEXT_NODE) {
        // If clicked on an element, try to find text node
        const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null);
        textNode = walker.nextNode();
    }
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE)
        return null;
    const fullText = textNode.textContent || '';
    // Get the character offset within the text node
    const range = document.caretRangeFromPoint(event.clientX, event.clientY);
    if (!range)
        return null;
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
    if (sentenceText.length < 10)
        return null;
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
async function handleTextSelection(event) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
        // No selection - clear bulk delete preview if in None mode
        if (currentMode === 'none' && highlightsToDelete.length > 0) {
            clearBulkDeletePreview();
        }
        return;
    }
    const selectedText = selection.toString();
    // Check if selection is empty (only whitespace) without modifying the text
    if (!selectedText.trim()) {
        if (currentMode === 'none' && highlightsToDelete.length > 0) {
            clearBulkDeletePreview();
        }
        return;
    }
    // Check if selection is within article content
    const articleContent = document.querySelector('.article-part-content');
    if (!articleContent)
        return;
    const range = selection.getRangeAt(0);
    if (!articleContent.contains(range.commonAncestorContainer))
        return;
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
        }
        else if (currentMode === 'sentence') {
            await handleSentenceHighlight(selectedText, range);
        }
        // Clear selection
        selection.removeAllRanges();
    }
    catch (error) {
        console.error('Error handling highlight:', error);
    }
}
/**
 * Handle text selection in None mode - show context menu
 */
function handleNoneModeSelection(text, range, event) {
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
    let clientX;
    let clientY;
    if (event instanceof MouseEvent) {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    else {
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
function detectOverlappingVocabulary(range) {
    const overlappingIds = [];
    try {
        // Clone the range to avoid modifying the original
        const clonedRange = range.cloneRange();
        const fragment = clonedRange.cloneContents();
        // Find all vocabulary highlights within the fragment
        const vocabularyHighlights = fragment.querySelectorAll('[data-highlight-type="vocabulary"][data-highlight-id]');
        vocabularyHighlights.forEach(element => {
            const id = element.getAttribute('data-highlight-id');
            if (id) {
                overlappingIds.push(id);
            }
        });
    }
    catch (error) {
        console.error('Error detecting overlapping vocabulary:', error);
    }
    return overlappingIds;
}
/**
 * Remove DOM highlight element by ID
 * Unwraps the element and replaces it with plain text or preserves nested content
 */
function removeDOMHighlight(highlightId) {
    // Find all elements with this highlight ID
    const highlightElements = document.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
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
        }
        else {
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
async function removeSubsumedVocabulary(vocabularyIds) {
    if (vocabularyIds.length === 0)
        return;
    try {
        // Get current vocabulary from storage
        const data = await chrome.storage.local.get('vocabulary');
        const vocabulary = data.vocabulary || {};
        // Collect words for notification
        const removedWords = [];
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
    }
    catch (error) {
        console.error('Error removing subsumed vocabulary:', error);
    }
}
/**
 * Show consolidation notification
 */
function showConsolidationNotification(count, words) {
    // Only show in vocabulary mode
    if (currentMode !== 'vocabulary')
        return;
    const notification = document.createElement('div');
    notification.className = 'consolidation-notification';
    const message = count === 1
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
async function handleVocabularyHighlight(text, range) {
    if (!currentArticleId || !currentPartId)
        return;
    // Trim text for storage and translation, but preserve original for display
    const trimmedText = text.trim();
    // Detect overlapping vocabulary highlights
    const overlappingIds = detectOverlappingVocabulary(range);
    // Remove subsumed vocabulary items before creating new highlight
    if (overlappingIds.length > 0) {
        await removeSubsumedVocabulary(overlappingIds);
    }
    // Get context (surrounding text)
    const context = getContext(range, 50);
    // Create highlight with original text (preserves whitespace in DOM)
    const highlightData = createHighlight(trimmedText, range, 'vocabulary');
    // Translate the vocabulary using trimmed text
    const translation = await translateVocabulary(trimmedText, context);
    // Get current target language for initial translation cache
    const { targetLanguage } = await chrome.storage.local.get('targetLanguage');
    const currentTargetLang = targetLanguage || 'en';
    // Create vocabulary item with trimmed text and translations cache
    const vocabItem = {
        id: generateId(),
        word: trimmedText,
        translation: translation,
        translations: {
            [currentTargetLang]: translation, // Cache the initial translation
        },
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
    highlightData.highlightElement.setAttribute('data-highlight-id', vocabItem.id);
    // Store highlight reference
    highlights.set(vocabItem.id, {
        id: vocabItem.id,
        text: text,
        startOffset: 0,
        endOffset: text.length,
        type: 'vocabulary',
    });
    // Add click listener - pronounce the word
    highlightData.highlightElement.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        void pronounceText(highlightData.highlightElement, vocabItem.word, currentArticleLanguage || undefined);
    });
    // Add hover listener for translation popup with delay - DYNAMIC TRANSLATION
    let hoverTimeout = null;
    highlightData.highlightElement.addEventListener('mouseenter', e => {
        // Fast popup display for better user experience
        hoverTimeout = window.setTimeout(() => {
            // Dynamically fetch translation for current target language
            void getTranslationForHighlight(vocabItem.id, 'vocabulary').then(currentTranslation => {
                showTranslationPopup(e.target, currentTranslation);
            });
        }, 50);
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
        e.stopPropagation();
        showContextMenu(highlightData.highlightElement, vocabItem.id, 'vocabulary');
    });
    // Trigger UI update
    dispatchHighlightEvent('vocabulary-added', vocabItem);
}
/**
 * Handle sentence highlighting
 */
async function handleSentenceHighlight(text, range) {
    if (!currentArticleId || !currentPartId)
        return;
    // Trim text for storage and translation, but preserve original for display
    const trimmedText = text.trim();
    // Validate sentence selection
    if (trimmedText.length < 10) {
        showTooltip('Please select a complete sentence', range);
        return;
    }
    // Create highlight with trimmed text (preserves whitespace in DOM)
    const highlightData = createHighlight(trimmedText, range, 'sentence');
    // Translate the sentence using trimmed text
    const translation = await translateSentence(trimmedText);
    // Get current target language for initial translation cache
    const { targetLanguage } = await chrome.storage.local.get('targetLanguage');
    const currentTargetLang = targetLanguage || 'en';
    // Create sentence item with trimmed text and translations cache
    const sentenceItem = {
        id: generateId(),
        content: trimmedText,
        translation: translation,
        translations: {
            [currentTargetLang]: translation, // Cache the initial translation
        },
        articleId: currentArticleId,
        partId: currentPartId,
        createdAt: new Date(),
    };
    // Save to storage
    await saveSentenceItem(sentenceItem);
    // Set the ID attribute on the DOM element for removal
    highlightData.highlightElement.setAttribute('data-highlight-id', sentenceItem.id);
    // Store highlight reference
    highlights.set(sentenceItem.id, {
        id: sentenceItem.id,
        text: text,
        startOffset: 0,
        endOffset: text.length,
        type: 'sentence',
    });
    // Add click listener - pronounce the sentence
    highlightData.highlightElement.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        void pronounceText(highlightData.highlightElement, sentenceItem.content, currentArticleLanguage || undefined);
    });
    // Add hover listener for translation popup with delay - DYNAMIC TRANSLATION
    let hoverTimeout = null;
    highlightData.highlightElement.addEventListener('mouseenter', e => {
        // Fast popup display for better user experience
        hoverTimeout = window.setTimeout(() => {
            // Dynamically fetch translation for current target language
            void getTranslationForHighlight(sentenceItem.id, 'sentence').then(currentTranslation => {
                showTranslationPopup(e.target, currentTranslation);
            });
        }, 50);
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
        e.stopPropagation();
        showContextMenu(highlightData.highlightElement, sentenceItem.id, 'sentence');
    });
    // Trigger UI update
    dispatchHighlightEvent('sentence-added', sentenceItem);
}
/**
 * Create highlight element with support for overlapping highlights
 */
function createHighlight(text, range, type) {
    const highlightClass = type === 'vocabulary' ? 'highlight-vocabulary' : 'highlight-sentence';
    // Get context before modifying DOM
    const context = getContext(range, 100);
    // Clone the range to preserve the original
    const workingRange = range.cloneRange();
    // Get the text from the range to detect whitespace
    const rangeText = workingRange.toString();
    const trimmedText = rangeText.trim();
    // Calculate leading and trailing whitespace lengths
    const leadingWhitespaceLength = rangeText.length - rangeText.trimStart().length;
    const trailingWhitespaceLength = rangeText.length - rangeText.trimEnd().length;
    // Adjust range boundaries to exclude leading whitespace
    if (leadingWhitespaceLength > 0) {
        const startContainer = workingRange.startContainer;
        const startOffset = workingRange.startOffset;
        if (startContainer.nodeType === Node.TEXT_NODE) {
            // Move start position forward by the leading whitespace length
            workingRange.setStart(startContainer, startOffset + leadingWhitespaceLength);
        }
        else {
            // For element nodes, we need to find the text node and adjust
            const walker = document.createTreeWalker(startContainer, NodeFilter.SHOW_TEXT, null);
            let textNode = walker.nextNode();
            if (textNode) {
                workingRange.setStart(textNode, leadingWhitespaceLength);
            }
        }
    }
    // Adjust range boundaries to exclude trailing whitespace
    if (trailingWhitespaceLength > 0) {
        const endContainer = workingRange.endContainer;
        const endOffset = workingRange.endOffset;
        if (endContainer.nodeType === Node.TEXT_NODE) {
            // Move end position backward by the trailing whitespace length
            workingRange.setEnd(endContainer, endOffset - trailingWhitespaceLength);
        }
        else {
            // For element nodes, we need to find the text node and adjust
            const walker = document.createTreeWalker(endContainer, NodeFilter.SHOW_TEXT, null);
            let textNode = walker.nextNode();
            if (textNode) {
                const textContent = textNode.textContent || '';
                workingRange.setEnd(textNode, textContent.length - trailingWhitespaceLength);
            }
        }
    }
    // Create new highlight span before extracting to minimize reflow
    const highlight = document.createElement('span');
    highlight.className = highlightClass;
    highlight.setAttribute('data-highlight-type', type);
    highlight.setAttribute('data-highlight-text', text);
    // Batch DOM operations to prevent visual flicker
    try {
        // Store the parent element to minimize reflows
        const startContainer = workingRange.startContainer;
        const parentElement = (startContainer.nodeType === Node.TEXT_NODE
            ? startContainer.parentElement
            : startContainer);
        if (parentElement && parentElement.style) {
            // Use CSS to hide the visual update during DOM manipulation
            const originalVisibility = parentElement.style.visibility;
            parentElement.style.visibility = 'hidden';
            // Extract only the trimmed content (whitespace remains in DOM)
            const fragment = workingRange.extractContents();
            // Check if fragment contains existing highlights
            const existingHighlights = fragment.querySelectorAll('[data-highlight-type]');
            if (existingHighlights.length > 0) {
                // Preserve existing highlights by wrapping them
                highlight.appendChild(fragment);
            }
            else {
                // No existing highlights, just set text content
                highlight.textContent = trimmedText;
            }
            // Insert the new highlight at the adjusted position
            workingRange.insertNode(highlight);
            // Restore visibility immediately (single reflow)
            parentElement.style.visibility = originalVisibility;
        }
        else {
            // Fallback without visibility management
            const fragment = workingRange.extractContents();
            const existingHighlights = fragment.querySelectorAll('[data-highlight-type]');
            if (existingHighlights.length > 0) {
                highlight.appendChild(fragment);
            }
            else {
                highlight.textContent = trimmedText;
            }
            workingRange.insertNode(highlight);
        }
    }
    catch (error) {
        console.error('Error creating highlight:', error);
    }
    return {
        text,
        context,
        range: workingRange,
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
function isSentenceEndPunctuation(char) {
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
function splitIntoWords(text) {
    // Check if text contains CJK characters
    const hasCJK = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(text);
    if (hasCJK) {
        // For CJK text, split into characters
        return text.split('');
    }
    else {
        // For other languages, split by whitespace and filter empty strings
        return text.split(/\s+/).filter(word => word.length > 0);
    }
}
/**
 * Find context boundary moving backward (left) from position
 * Counts words and stops at sentence boundary or word limit
 */
function findContextBoundaryLeft(text, startPos, maxWords) {
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
function findContextBoundaryRight(text, startPos, maxWords) {
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
function getContext(range, _maxLength) {
    const container = range.commonAncestorContainer;
    const parent = container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : container;
    if (!parent)
        return '';
    const fullText = parent.textContent || '';
    const selectedText = range.toString();
    const startIndex = fullText.indexOf(selectedText);
    const endIndex = startIndex + selectedText.length;
    if (startIndex === -1)
        return '';
    // Find context boundaries using word-based counting
    const contextStart = findContextBoundaryLeft(fullText, startIndex, CONTEXT_CONFIG.maxWordsLeft);
    const contextEnd = findContextBoundaryRight(fullText, endIndex, CONTEXT_CONFIG.maxWordsRight);
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
export function mergeOverlappingHighlights(newHighlights) {
    // Sort by start offset
    const sorted = [...newHighlights].sort((a, b) => a.startOffset - b.startOffset);
    const merged = [];
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
        }
        else {
            merged.push(highlight);
        }
    }
    return merged;
}
/**
 * Remove highlight
 */
export async function removeHighlight(highlightId, type) {
    // Remove from storage
    if (type === 'vocabulary') {
        await removeVocabularyItem(highlightId);
    }
    else {
        await removeSentenceItem(highlightId);
    }
    // Remove from DOM using helper function
    removeDOMHighlight(highlightId);
    // Remove from map
    highlights.delete(highlightId);
    // Trigger UI update
    dispatchHighlightEvent(type === 'vocabulary' ? 'vocabulary-removed' : 'sentence-removed', { id: highlightId });
}
// ============================================================================
// Translation
// ============================================================================
/**
 * Translate vocabulary
 */
async function translateVocabulary(text, context) {
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
        }
        else {
            console.error('Translation failed:', response.error);
            // Show retry button only on failure after 3 attempts
            if (response.error.includes('after retries')) {
                showRetryButton(text, context);
                return `[Translation failed. Click retry button to try again.]`;
            }
            else if (response.error.includes('not available')) {
                return `[Translation API not available in this context]`;
            }
            else {
                return `[Translation unavailable: ${text}]`;
            }
        }
    }
    catch (error) {
        console.error('Error translating vocabulary:', error);
        showRetryButton(text, context);
        return `[Translation error. Click retry button to try again.]`;
    }
}
/**
 * Translate sentence
 */
async function translateSentence(text) {
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
        }
        else {
            console.error('Translation failed:', response.error);
            return `[Translation unavailable]`;
        }
    }
    catch (error) {
        console.error('Error translating sentence:', error);
        return `[Translation error]`;
    }
}
/**
 * Get translation for a highlight in the current target language
 * Fetches from cache or requests new translation if needed
 */
async function getTranslationForHighlight(highlightId, type) {
    try {
        // Get current target language
        const { targetLanguage } = await chrome.storage.local.get('targetLanguage');
        const currentTargetLang = targetLanguage || 'en';
        // Fetch the item from storage
        if (type === 'vocabulary') {
            const data = await chrome.storage.local.get('vocabulary');
            const vocabulary = data.vocabulary || {};
            const vocabItem = vocabulary[highlightId];
            if (!vocabItem) {
                return '[Item not found]';
            }
            // Check if we have a cached translation for this language
            if (vocabItem.translations && vocabItem.translations[currentTargetLang]) {
                return vocabItem.translations[currentTargetLang];
            }
            // If not cached, request new translation
            const newTranslation = await translateVocabulary(vocabItem.word, vocabItem.context);
            // Cache the new translation
            if (!vocabItem.translations) {
                vocabItem.translations = {};
            }
            vocabItem.translations[currentTargetLang] = newTranslation;
            // Update primary translation for backward compatibility
            vocabItem.translation = newTranslation;
            // Save updated item
            vocabulary[highlightId] = vocabItem;
            await chrome.storage.local.set({ vocabulary });
            return newTranslation;
        }
        else {
            // Sentence type
            const data = await chrome.storage.local.get('sentences');
            const sentences = data.sentences || {};
            const sentenceItem = sentences[highlightId];
            if (!sentenceItem) {
                return '[Item not found]';
            }
            // Check if we have a cached translation for this language
            if (sentenceItem.translations &&
                sentenceItem.translations[currentTargetLang]) {
                return sentenceItem.translations[currentTargetLang];
            }
            // If not cached, request new translation
            const newTranslation = await translateSentence(sentenceItem.content);
            // Cache the new translation
            if (!sentenceItem.translations) {
                sentenceItem.translations = {};
            }
            sentenceItem.translations[currentTargetLang] = newTranslation;
            // Update primary translation for backward compatibility
            sentenceItem.translation = newTranslation;
            // Save updated item
            sentences[highlightId] = sentenceItem;
            await chrome.storage.local.set({ sentences });
            return newTranslation;
        }
    }
    catch (error) {
        console.error('Error getting translation for highlight:', error);
        return '[Translation error]';
    }
}
// ============================================================================
// Storage Operations
// ============================================================================
/**
 * Save vocabulary item
 */
async function saveVocabularyItem(vocab) {
    const data = await chrome.storage.local.get('vocabulary');
    const vocabulary = data.vocabulary || {};
    vocabulary[vocab.id] = vocab;
    await chrome.storage.local.set({ vocabulary });
}
/**
 * Save sentence item
 */
async function saveSentenceItem(sentence) {
    const data = await chrome.storage.local.get('sentences');
    const sentences = data.sentences || {};
    sentences[sentence.id] = sentence;
    await chrome.storage.local.set({ sentences });
}
/**
 * Remove vocabulary item
 */
async function removeVocabularyItem(id) {
    const data = await chrome.storage.local.get('vocabulary');
    const vocabulary = data.vocabulary || {};
    delete vocabulary[id];
    await chrome.storage.local.set({ vocabulary });
}
/**
 * Remove sentence item
 */
async function removeSentenceItem(id) {
    const data = await chrome.storage.local.get('sentences');
    const sentences = data.sentences || {};
    delete sentences[id];
    await chrome.storage.local.set({ sentences });
}
// ============================================================================
// UI Helpers
// ============================================================================
/**
 * Show tooltip
 */
function showTooltip(message, range) {
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
function showTranslationPopup(element, translation) {
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
function hideTranslationPopup() {
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
function showSelectionContextMenu(text, clientX, clientY) {
    const contextMenu = document.querySelector('.context-menu');
    if (!contextMenu)
        return;
    // Show appropriate menu items for selection
    const copyBtn = contextMenu.querySelector('[data-action="copy"]');
    const editBtn = contextMenu.querySelector('[data-action="edit"]');
    const removeBtn = contextMenu.querySelector('[data-action="remove"]');
    const addVocabBtn = contextMenu.querySelector('[data-action="add-vocabulary"]');
    const addSentenceBtn = contextMenu.querySelector('[data-action="add-sentence"]');
    const changeToSentenceBtn = contextMenu.querySelector('[data-action="change-to-sentence"]');
    const changeToVocabBtn = contextMenu.querySelector('[data-action="change-to-vocabulary"]');
    const pronounceBtn = contextMenu.querySelector('[data-action="pronounce"]');
    if (copyBtn)
        copyBtn.style.display = 'none';
    if (editBtn)
        editBtn.style.display = 'none';
    if (removeBtn)
        removeBtn.style.display = 'none';
    if (addVocabBtn)
        addVocabBtn.style.display = 'block';
    if (addSentenceBtn)
        addSentenceBtn.style.display = 'block';
    if (changeToSentenceBtn)
        changeToSentenceBtn.style.display = 'none';
    if (changeToVocabBtn)
        changeToVocabBtn.style.display = 'none';
    if (pronounceBtn)
        pronounceBtn.style.display = 'block';
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
export function showContextMenu(element, itemId, type, event) {
    const contextMenu = document.querySelector('.context-menu');
    if (!contextMenu)
        return;
    // Show appropriate menu items for existing highlights
    const copyBtn = contextMenu.querySelector('[data-action="copy"]');
    const editBtn = contextMenu.querySelector('[data-action="edit"]');
    const removeBtn = contextMenu.querySelector('[data-action="remove"]');
    const addVocabBtn = contextMenu.querySelector('[data-action="add-vocabulary"]');
    const addSentenceBtn = contextMenu.querySelector('[data-action="add-sentence"]');
    const changeToSentenceBtn = contextMenu.querySelector('[data-action="change-to-sentence"]');
    const changeToVocabBtn = contextMenu.querySelector('[data-action="change-to-vocabulary"]');
    const pronounceBtn = contextMenu.querySelector('[data-action="pronounce"]');
    if (copyBtn)
        copyBtn.style.display = 'none';
    if (editBtn)
        editBtn.style.display = 'none';
    if (removeBtn)
        removeBtn.style.display = 'block';
    if (addVocabBtn)
        addVocabBtn.style.display = 'none';
    if (addSentenceBtn)
        addSentenceBtn.style.display = 'none';
    if (pronounceBtn)
        pronounceBtn.style.display = 'block';
    // Show conversion options based on type
    if (type === 'vocabulary') {
        if (changeToSentenceBtn)
            changeToSentenceBtn.style.display = 'block';
        if (changeToVocabBtn)
            changeToVocabBtn.style.display = 'none';
    }
    else if (type === 'sentence') {
        if (changeToSentenceBtn)
            changeToSentenceBtn.style.display = 'none';
        if (changeToVocabBtn)
            changeToVocabBtn.style.display = 'block';
    }
    contextMenu.classList.remove('hidden');
    // Get the position of the element
    const rect = element.getBoundingClientRect();
    const menuRect = contextMenu.getBoundingClientRect();
    const offset = 8; // Distance from the cursor/element
    // Determine positioning based on whether event is provided
    let top;
    let left;
    let referenceY; // Y position to check against viewport
    if (event) {
        // For cards: position relative to cursor
        referenceY = event.clientY; // Cursor position in viewport
        top = event.pageY + offset; // Position below cursor
        left = event.pageX; // Horizontal at cursor
    }
    else {
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
        }
        else {
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
 * Generate unique ID
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * Dispatch custom event for UI updates
 */
function dispatchHighlightEvent(eventName, detail) {
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
export async function handleSelectionContextMenuAction(action) {
    if (!pendingSelection)
        return;
    const { text, range } = pendingSelection;
    try {
        if (action === 'add-vocabulary') {
            await handleVocabularyHighlight(text, range);
        }
        else if (action === 'add-sentence') {
            // Validate sentence selection
            if (text.length < 10) {
                showTooltip('Please select a complete sentence', range);
                return;
            }
            await handleSentenceHighlight(text, range);
        }
        else if (action === 'pronounce') {
            // Create a temporary element for TTS feedback
            const tempElement = document.createElement('span');
            await pronounceText(tempElement, text, currentArticleLanguage || undefined);
        }
    }
    catch (error) {
        console.error('Error handling selection action:', error);
    }
    finally {
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
function showRetryButton(text, context) {
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
function hideRetryButton() {
    const retryButton = document.getElementById('translation-retry-button');
    if (retryButton) {
        retryButton.remove();
    }
}
// ============================================================================
// Conversion Functions
// ============================================================================
/**
 * Convert a vocabulary item to a sentence item
 */
export async function convertVocabularyToSentence(vocabularyId) {
    try {
        // Get vocabulary item from storage
        const data = await chrome.storage.local.get('vocabulary');
        const vocabulary = data.vocabulary || {};
        const vocabItem = vocabulary[vocabularyId];
        if (!vocabItem) {
            console.error('Vocabulary item not found:', vocabularyId);
            return;
        }
        // Create new sentence item
        const sentenceItem = {
            id: generateId(),
            content: vocabItem.word,
            translation: vocabItem.translation,
            articleId: vocabItem.articleId,
            partId: vocabItem.partId,
            createdAt: new Date(),
        };
        // Get sentences from storage
        const sentenceData = await chrome.storage.local.get('sentences');
        const sentences = sentenceData.sentences || {};
        // Add new sentence
        sentences[sentenceItem.id] = sentenceItem;
        // Remove vocabulary item
        delete vocabulary[vocabularyId];
        // Update storage
        await chrome.storage.local.set({ vocabulary, sentences });
        // Update DOM highlights
        updateHighlightType(vocabularyId, 'vocabulary', sentenceItem.id, 'sentence');
        // Update highlights map
        highlights.delete(vocabularyId);
        highlights.set(sentenceItem.id, {
            id: sentenceItem.id,
            text: sentenceItem.content,
            startOffset: 0,
            endOffset: sentenceItem.content.length,
            type: 'sentence',
        });
        // Dispatch events for UI updates
        dispatchHighlightEvent('vocabulary-removed', { id: vocabularyId });
        dispatchHighlightEvent('sentence-added', sentenceItem);
        console.log('Converted vocabulary to sentence:', vocabItem.word);
    }
    catch (error) {
        console.error('Error converting vocabulary to sentence:', error);
    }
}
/**
 * Convert a sentence item to a vocabulary item
 */
export async function convertSentenceToVocabulary(sentenceId) {
    try {
        // Get sentence item from storage
        const data = await chrome.storage.local.get('sentences');
        const sentences = data.sentences || {};
        const sentenceItem = sentences[sentenceId];
        if (!sentenceItem) {
            console.error('Sentence item not found:', sentenceId);
            return;
        }
        // Create new vocabulary item
        const vocabItem = {
            id: generateId(),
            word: sentenceItem.content,
            translation: sentenceItem.translation,
            context: sentenceItem.content,
            exampleSentences: [],
            articleId: sentenceItem.articleId,
            partId: sentenceItem.partId,
            createdAt: new Date(),
            lastReviewed: new Date(),
            reviewCount: 0,
            difficulty: 5,
        };
        // Get vocabulary from storage
        const vocabData = await chrome.storage.local.get('vocabulary');
        const vocabulary = vocabData.vocabulary || {};
        // Add new vocabulary
        vocabulary[vocabItem.id] = vocabItem;
        // Remove sentence item
        delete sentences[sentenceId];
        // Update storage
        await chrome.storage.local.set({ vocabulary, sentences });
        // Update DOM highlights
        updateHighlightType(sentenceId, 'sentence', vocabItem.id, 'vocabulary');
        // Update highlights map
        highlights.delete(sentenceId);
        highlights.set(vocabItem.id, {
            id: vocabItem.id,
            text: vocabItem.word,
            startOffset: 0,
            endOffset: vocabItem.word.length,
            type: 'vocabulary',
        });
        // Dispatch events for UI updates
        dispatchHighlightEvent('sentence-removed', { id: sentenceId });
        dispatchHighlightEvent('vocabulary-added', vocabItem);
        console.log('Converted sentence to vocabulary:', sentenceItem.content);
    }
    catch (error) {
        console.error('Error converting sentence to vocabulary:', error);
    }
}
/**
 * Update highlight type in DOM
 */
function updateHighlightType(oldId, oldType, newId, newType) {
    // Find all elements with the old highlight ID
    const highlightElements = document.querySelectorAll(`[data-highlight-id="${oldId}"]`);
    highlightElements.forEach(element => {
        const el = element;
        // Update data attributes
        el.setAttribute('data-highlight-id', newId);
        el.setAttribute('data-highlight-type', newType);
        // Update CSS classes
        el.classList.remove(`highlight-${oldType}`);
        el.classList.add(`highlight-${newType}`);
        // Re-attach event listeners for the new type
        // Remove old listeners by cloning the element
        const newElement = el.cloneNode(true);
        el.parentNode?.replaceChild(newElement, el);
        // Add new context menu listener
        newElement.addEventListener('contextmenu', e => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(newElement, newId, newType);
        });
        // Add click listener for selection in None mode
        newElement.addEventListener('click', e => {
            if (currentMode === 'none') {
                e.stopPropagation();
                selectHighlight(newId, newType, newElement);
            }
        });
    });
}
//# sourceMappingURL=highlight-manager.js.map