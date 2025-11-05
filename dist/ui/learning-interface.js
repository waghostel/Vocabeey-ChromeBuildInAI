/**
 * Learning Interface - Main UI controller for article rendering and learning modes
 * Implements Requirements: 1.7, 6.1, 6.2, 6.4, 3.1, 3.2, 3.4, 3.5
 */
import { getMemoryManager } from '../utils/memory-manager.js';
import { getMemoryProfiler, checkMemory } from '../utils/memory-profiler.js';
import { initializeHighlightManager, setHighlightMode, cleanupHighlightManager, pauseHighlightManager, resumeHighlightManager, restoreHighlightsForPart, } from './highlight-manager.js';
import { initializeHamburgerMenu } from './components/hamburger-menu.js';
import { pronounceText } from './tts-handler.js';
import { checkAndShowOnboarding } from './onboarding-wizard.js';
// ============================================================================
// Language Data
// ============================================================================
const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'nl', name: 'Dutch' },
    { code: 'pl', name: 'Polish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'th', name: 'Thai' },
    { code: 'sv', name: 'Swedish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'cs', name: 'Czech' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'ro', name: 'Romanian' },
    { code: 'uk', name: 'Ukrainian' },
];
const state = {
    currentMode: 'reading',
    currentArticle: null,
    currentPartIndex: 0,
    displayMode: 'both',
    vocabularyItems: [],
    sentenceItems: [],
    highlightMode: 'vocabulary',
    targetLanguage: 'en',
};
// ============================================================================
// DOM Elements
// ============================================================================
const elements = {
    // Mode tabs
    tabButtons: document.querySelectorAll('.tab-button'),
    modeContents: document.querySelectorAll('.mode-content'),
    // Article header
    articleHeader: document.querySelector('.article-header'),
    articleTitle: document.querySelector('.article-title'),
    articleUrl: document.querySelector('.article-url'),
    languageBadge: document.querySelector('.language-badge'),
    languageCode: document.querySelector('.language-code'),
    confidenceIndicator: document.querySelector('.confidence-indicator'),
    // Language selector
    languageInput: document.getElementById('target-language-input'),
    languageDropdown: document.querySelector('.language-dropdown'),
    languageOptions: document.querySelector('.language-options'),
    // Article content
    articlePartContent: document.querySelector('.article-part-content'),
    vocabularyCardsSection: document.querySelector('.vocabulary-cards'),
    sentenceCardsSection: document.querySelector('.sentence-cards'),
    // Navigation
    prevButton: document.getElementById('prev-part'),
    nextButton: document.getElementById('next-part'),
    currentPartSpan: document.querySelector('.current-part'),
    totalPartsSpan: document.querySelector('.total-parts'),
    // Learning modes
    displayOptions: document.querySelectorAll('.display-option'),
    vocabularyGrid: document.querySelector('.vocabulary-grid'),
    sentenceList: document.querySelector('.sentence-list'),
    // Loading overlay
    loadingOverlay: document.querySelector('.loading-overlay'),
    loadingText: document.querySelector('.loading-text'),
    // Context menu
    contextMenu: document.querySelector('.context-menu'),
    // Edit dialog
    editDialog: document.querySelector('.article-edit-dialog'),
    editDialogTitle: document.querySelector('.edit-dialog-title'),
    editTitleInput: document.querySelector('.edit-title-input'),
    editUrlInput: document.querySelector('.edit-url-input'),
    editLanguageInput: document.querySelector('.edit-language-input'),
    editLanguageDropdown: document.querySelector('.edit-language-dropdown'),
    editLanguageOptions: document.querySelector('.edit-language-options'),
    editParagraphTextarea: document.querySelector('.edit-paragraph-textarea'),
};
// ============================================================================
// Diagnostic Functions (for debugging)
// ============================================================================
/**
 * Diagnostic function to inspect current article structure
 * Call from browser console: window.diagnoseArticle()
 */
function diagnoseArticle() {
    console.log('🔍 === ARTICLE DIAGNOSTIC REPORT ===');
    if (!state.currentArticle) {
        console.error('❌ No article loaded');
        return;
    }
    const article = state.currentArticle;
    console.log('📊 Basic Info:', {
        id: article.id,
        title: article.title,
        url: article.url,
        language: article.originalLanguage,
        confidence: article.detectedLanguageConfidence,
        processedAt: article.processedAt,
        status: article.processingStatus,
    });
    console.log('📄 Parts Structure:', {
        hasParts: !!article.parts,
        partsCount: article.parts?.length || 0,
        currentPartIndex: state.currentPartIndex,
        currentPartNumber: state.currentPartIndex + 1,
    });
    if (article.parts && article.parts.length > 0) {
        console.log('📝 Parts Details:');
        article.parts.forEach((part, i) => {
            const wordCount = part.content
                .split(/\s+/)
                .filter(w => w.length > 0).length;
            console.log(`  Part ${i + 1}:`, {
                id: part.id,
                partIndex: part.partIndex,
                contentLength: part.content.length,
                wordCount,
                vocabularyCount: part.vocabulary?.length || 0,
                sentencesCount: part.sentences?.length || 0,
                preview: part.content.substring(0, 100) + '...',
            });
        });
    }
    else {
        console.error('❌ NO PARTS ARRAY FOUND!');
    }
    console.log('🎯 Current State:', {
        mode: state.currentMode,
        highlightMode: state.highlightMode,
        displayMode: state.displayMode,
        vocabularyItemsTotal: state.vocabularyItems.length,
        sentenceItemsTotal: state.sentenceItems.length,
    });
    console.log('🔍 === END DIAGNOSTIC REPORT ===');
}
// Expose diagnostic function to window for console access
window.diagnoseArticle = diagnoseArticle;
// ============================================================================
// Initialization
// ============================================================================
async function initialize() {
    try {
        showLoading('Loading article...');
        // Take initial memory snapshot
        checkMemory('initialization:start');
        // Initialize hamburger menu
        initializeHamburgerMenu();
        // Initialize memory monitoring
        initializeMemoryMonitoring();
        // Start memory profiling (always enabled for monitoring)
        const profiler = getMemoryProfiler();
        profiler.startMonitoring(60000); // Every minute
        // Initialize TTS debug console
        const { initTTSDebugConsole } = await import('../utils/tts-debug-console.js');
        initTTSDebugConsole();
        // Initialize language selector
        await initializeLanguageSelector();
        // Get article data from session storage
        const tabId = await getCurrentTabId();
        const articleData = await getArticleData(tabId);
        if (!articleData) {
            showError('No article data found');
            return;
        }
        // Load article
        await loadArticle(articleData);
        // Setup event listeners
        setupEventListeners();
        hideLoading();
        // Check and show onboarding wizard for first-time users
        await checkAndShowOnboarding();
    }
    catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to load article');
    }
}
/**
 * Get current tab ID
 */
async function getCurrentTabId() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) {
        throw new Error('No active tab found');
    }
    return tabs[0].id;
}
/**
 * Get article data from session storage
 */
async function getArticleData(tabId) {
    const data = await chrome.storage.session.get(`article_${tabId}`);
    return data[`article_${tabId}`] || null;
}
// ============================================================================
// Article Loading and Rendering
// ============================================================================
/**
 * Cleanup current article and release memory
 */
async function cleanupCurrentArticle() {
    if (!state.currentArticle) {
        return;
    }
    console.log('🧹 Cleaning up current article...');
    // Clean up highlights and event listeners
    cleanupHighlightManager();
    // Clear article content from DOM
    if (elements.articlePartContent) {
        elements.articlePartContent.innerHTML = '';
    }
    // Clear vocabulary cards
    if (elements.vocabularyCardsSection) {
        elements.vocabularyCardsSection.innerHTML = '';
    }
    // Clear sentence cards
    if (elements.sentenceCardsSection) {
        elements.sentenceCardsSection.innerHTML = '';
    }
    // Nullify state to allow garbage collection
    state.currentArticle = null;
    state.vocabularyItems = [];
    state.sentenceItems = [];
    state.currentPartIndex = 0;
    console.log('✅ Article cleanup complete');
}
/**
 * Load and display article
 */
async function loadArticle(article) {
    console.log('📖 === LOADING ARTICLE DIAGNOSTIC ===');
    console.log('📊 Article Structure:', {
        id: article.id,
        title: article.title,
        url: article.url,
        language: article.originalLanguage,
        hasParts: !!article.parts,
        partsCount: article.parts?.length || 0,
        processingStatus: article.processingStatus,
        processedAt: article.processedAt,
    });
    if (article.parts && article.parts.length > 0) {
        console.log('📄 Parts Details:', article.parts.map((part, i) => ({
            index: i + 1,
            partId: part.id,
            contentLength: part.content.length,
            vocabularyCount: part.vocabulary?.length || 0,
            sentencesCount: part.sentences?.length || 0,
            contentPreview: part.content.substring(0, 100) + '...',
        })));
    }
    else {
        console.error('❌ NO PARTS FOUND IN ARTICLE! This article needs re-segmentation.');
    }
    // Clean up previous article first
    await cleanupCurrentArticle();
    state.currentArticle = article;
    // Try to restore previous navigation position
    const restoredPartIndex = await restoreNavigationState(article.id);
    console.log('🔄 Navigation State:', {
        restoredPartIndex,
        willStartAt: restoredPartIndex + 1,
    });
    state.currentPartIndex = restoredPartIndex;
    // Store article language in local storage for translation to access
    await chrome.storage.local.set({
        currentArticleLanguage: article.originalLanguage,
    });
    // Render article header
    renderArticleHeader(article);
    // Render article part (restored position or first part)
    renderArticlePart(state.currentPartIndex);
    // Load vocabulary and sentences for this article
    await loadVocabularyAndSentences(article.id);
    console.log('✅ Article loaded successfully');
    console.log('📖 === END LOADING DIAGNOSTIC ===\n');
}
/**
 * Render article header
 */
function renderArticleHeader(article) {
    elements.articleTitle.textContent = article.title;
    elements.articleUrl.textContent = article.url;
    elements.articleUrl.title = article.url;
    // Render language badge with confidence indicator
    renderLanguageBadge(article.originalLanguage, article.detectedLanguageConfidence);
    // Setup article header context menu
    setupArticleHeaderContextMenu();
}
/**
 * Setup article header context menu
 */
function setupArticleHeaderContextMenu() {
    if (!elements.articleHeader)
        return;
    // Remove existing listener if any
    const existingHandler = elements.articleHeader._contextMenuHandler;
    if (existingHandler) {
        elements.articleHeader.removeEventListener('contextmenu', existingHandler);
    }
    // Create new handler
    const contextMenuHandler = (e) => {
        const event = e;
        const target = event.target;
        // Don't show context menu if clicking on header controls (language selector, highlight mode buttons)
        const headerControls = elements.articleHeader.querySelector('.header-controls');
        if (headerControls && headerControls.contains(target)) {
            return; // Allow default browser context menu for controls
        }
        // Prevent default and show custom context menu
        event.preventDefault();
        showArticleHeaderContextMenu(elements.articleHeader, event);
    };
    // Store handler reference for cleanup
    elements.articleHeader._contextMenuHandler = contextMenuHandler;
    // Add listener
    elements.articleHeader.addEventListener('contextmenu', contextMenuHandler);
}
/**
 * Render language badge with confidence indicator
 */
function renderLanguageBadge(languageCode, confidence = 0.5) {
    // Get full language name
    const language = LANGUAGES.find(l => l.code === languageCode);
    const languageName = language?.name || languageCode.toUpperCase();
    // Set language code
    elements.languageCode.textContent = languageCode.toUpperCase();
    // Determine confidence level
    let confidenceClass;
    let confidenceText;
    if (confidence >= 0.8) {
        confidenceClass = 'high-confidence';
        confidenceText = 'High confidence';
    }
    else if (confidence >= 0.5) {
        confidenceClass = 'medium-confidence';
        confidenceText = 'Medium confidence';
    }
    else {
        confidenceClass = 'low-confidence';
        confidenceText = 'Low confidence';
    }
    // Hide confidence indicator (no emoji)
    elements.confidenceIndicator.textContent = '';
    // Update badge class
    elements.languageBadge.className = `language-badge ${confidenceClass}`;
    // Set tooltip with detailed information
    const confidencePercent = Math.round(confidence * 100);
    elements.languageBadge.title = `${languageName}\n${confidenceText} (${confidencePercent}%)\nDetected using Chrome AI`;
}
/**
 * Render article part
 */
function renderArticlePart(partIndex) {
    if (!state.currentArticle)
        return;
    const part = state.currentArticle.parts[partIndex];
    if (!part)
        return;
    state.currentPartIndex = partIndex;
    // Cleanup previous highlight manager
    cleanupHighlightManager();
    // Render content
    elements.articlePartContent.innerHTML = formatArticleContent(part.content);
    // Add copy buttons to paragraphs
    addCopyButtonsToParagraphs();
    // Initialize highlight manager for this part
    initializeHighlightManager(state.currentArticle.id, part.id, state.highlightMode, state.currentArticle.originalLanguage);
    // Restore existing highlights for this part
    // Use requestAnimationFrame to ensure DOM is fully rendered before restoring highlights
    requestAnimationFrame(() => {
        void restoreHighlightsForPart(state.currentArticle.id, part.id);
    });
    // Update navigation
    updateNavigation();
    // Render vocabulary and sentence cards for this part
    renderPartVocabularyCards(part);
    renderPartSentenceCards(part);
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Persist current part index to session storage
    void persistNavigationState();
}
/**
 * Format article content into paragraphs
 */
function formatArticleContent(content) {
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    return paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
}
/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
/**
 * Add copy buttons to all paragraphs
 */
function addCopyButtonsToParagraphs() {
    const paragraphs = elements.articlePartContent.querySelectorAll('p');
    paragraphs.forEach(paragraph => {
        // Create copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'paragraph-copy-btn';
        copyBtn.setAttribute('aria-label', 'Copy paragraph');
        copyBtn.setAttribute('title', 'Copy paragraph');
        // Add copy icon (SVG)
        copyBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
        // Add click handler
        copyBtn.addEventListener('click', e => {
            e.stopPropagation();
            void handleParagraphCopy(paragraph, copyBtn);
        });
        // Add mousemove handler to show button only when near top-right corner
        paragraph.addEventListener('mousemove', (e) => {
            const rect = paragraph.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            // Define the trigger area: top-right corner (80px from right, 40px from top)
            const triggerWidth = 80;
            const triggerHeight = 40;
            const isInTopRightCorner = mouseX > rect.width - triggerWidth && mouseY < triggerHeight;
            if (isInTopRightCorner) {
                copyBtn.style.opacity = '1';
            }
            else {
                copyBtn.style.opacity = '0';
            }
        });
        // Hide button when mouse leaves paragraph
        paragraph.addEventListener('mouseleave', () => {
            copyBtn.style.opacity = '0';
        });
        // Add right-click context menu handler
        const contextMenuHandler = (e) => {
            const target = e.target;
            // Check if click is on a highlight element
            const isHighlight = target.classList.contains('highlight-vocabulary') ||
                target.classList.contains('highlight-sentence') ||
                target.closest('.highlight-vocabulary') ||
                target.closest('.highlight-sentence');
            // If clicking on a highlight, let the highlight handler take over
            if (isHighlight) {
                return; // Don't prevent default, let highlight handler handle it
            }
            // Only show paragraph menu if clicking on plain text
            e.preventDefault();
            showParagraphContextMenu(paragraph, e);
        };
        // Store reference to handler for later removal during edit mode
        paragraph._paragraphContextMenuHandler = contextMenuHandler;
        // Add listener
        paragraph.addEventListener('contextmenu', contextMenuHandler);
        // Append to paragraph
        paragraph.appendChild(copyBtn);
    });
}
/**
 * Handle paragraph copy action
 */
async function handleParagraphCopy(paragraph, button) {
    try {
        // Get paragraph text (excluding the copy button)
        const copyButton = paragraph.querySelector('.paragraph-copy-btn');
        const textToCopy = Array.from(paragraph.childNodes)
            .filter(node => node !== copyButton)
            .map(node => node.textContent || '')
            .join('')
            .trim();
        // Copy to clipboard
        await navigator.clipboard.writeText(textToCopy);
        // Change icon to checkmark (same color, no background)
        button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
        // Show tooltip
        showTooltip('Paragraph copied!');
        // Reset after 2 seconds
        setTimeout(() => {
            button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
        }, 2000);
    }
    catch (error) {
        console.error('Failed to copy paragraph:', error);
        showTooltip('Failed to copy paragraph');
    }
}
/**
 * Show context menu for paragraph right-click
 */
function showParagraphContextMenu(paragraph, event) {
    const contextMenu = elements.contextMenu;
    if (!contextMenu)
        return;
    // Store paragraph reference and context type
    contextMenu.dataset.itemType = 'paragraph';
    contextMenu.dataset.paragraphElement = 'true';
    // Store paragraph element reference (we'll use it in the action handler)
    contextMenu._paragraphElement = paragraph;
    // Update menu items visibility - show only "Copy"
    updateContextMenuItems('paragraph');
    // Position menu at cursor
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
    // Show menu
    contextMenu.classList.remove('hidden');
}
/**
 * Update context menu items based on context type
 */
function updateContextMenuItems(contextType) {
    // Only select items from the regular context menu, not the edit context menu
    const menuItems = document.querySelectorAll('.context-menu .context-menu-item');
    menuItems.forEach(item => {
        const action = item.dataset.action;
        if (contextType === 'paragraph') {
            // For paragraphs, show only "Copy" and "Edit"
            if (action === 'copy' || action === 'edit') {
                item.style.display = 'block';
                // Set custom text for paragraph context menu
                if (action === 'copy') {
                    item.textContent = 'Copy paragraph';
                }
                else if (action === 'edit') {
                    item.textContent = 'Edit Paragraph';
                }
            }
            else {
                item.style.display = 'none';
            }
        }
        else if (contextType === 'card') {
            // For cards, show "Remove" and "Edit"
            if (action === 'remove') {
                item.style.display = 'block';
                item.textContent = 'Remove';
            }
            else if (action === 'edit') {
                item.style.display = 'block';
                item.textContent = 'Edit';
            }
            else {
                item.style.display = 'none';
            }
        }
        else if (contextType === 'article-header') {
            // For article header, show only "Edit Article"
            if (action === 'edit') {
                item.style.display = 'block';
                item.textContent = 'Edit Article';
            }
            else {
                item.style.display = 'none';
            }
        }
        else {
            // For vocabulary/sentence highlights and selections, hide "Copy" and "Edit"
            if (action === 'copy' || action === 'edit') {
                item.style.display = 'none';
            }
            else {
                // Reset to default display for other items
                item.style.display = 'block';
            }
        }
    });
}
/**
 * Show context menu for card right-click
 */
function showCardContextMenu(card, itemId, itemType, event) {
    const contextMenu = elements.contextMenu;
    if (!contextMenu)
        return;
    // Store card reference and context type
    contextMenu.dataset.itemType = 'card';
    contextMenu.dataset.itemId = itemId;
    contextMenu.dataset.cardType = itemType;
    // Store card element reference (we'll use it in the action handler)
    contextMenu._cardElement = card;
    // Update menu items visibility - show only "Edit"
    updateContextMenuItems('card');
    // Position menu at cursor
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
    // Show menu
    contextMenu.classList.remove('hidden');
}
/**
 * Show context menu for article header right-click
 */
function showArticleHeaderContextMenu(header, event) {
    const contextMenu = elements.contextMenu;
    if (!contextMenu)
        return;
    // Store header reference and context type
    contextMenu.dataset.itemType = 'article-header';
    // Store header element reference (we'll use it in the action handler)
    contextMenu._articleHeaderElement = header;
    // Update menu items visibility - show only "Edit"
    updateContextMenuItems('article-header');
    // Position menu at cursor
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
    // Show menu
    contextMenu.classList.remove('hidden');
}
// ============================================================================
// Article Header Edit Dialog
// ============================================================================
// Edit dialog state
let editDialogSelectedLanguage = '';
let editDialogOriginalValues = {
    title: '',
    url: '',
    language: '',
    content: '',
};
// Resize state
let dialogWidth = 900;
let isResizing = false;
let resizeStartX = 0;
let resizeStartWidth = 0;
let resizeDirection = 'right';
const DIALOG_MIN_WIDTH = 600;
const DIALOG_MAX_WIDTH = 1400;
const DIALOG_WIDTH_STORAGE_KEY = 'articleEditDialogWidth';
/**
 * Show article header edit dialog
 */
function showArticleHeaderEditDialog() {
    if (!elements.editDialog || !state.currentArticle)
        return;
    // Populate fields with current values
    elements.editTitleInput.value = state.currentArticle.title || '';
    elements.editUrlInput.value = state.currentArticle.url || '';
    // Set language
    editDialogSelectedLanguage = state.currentArticle.originalLanguage || 'en';
    const selectedLang = LANGUAGES.find(l => l.code === editDialogSelectedLanguage);
    if (selectedLang && elements.editLanguageInput) {
        elements.editLanguageInput.value = selectedLang.name;
    }
    // Populate paragraph content from current part
    let currentContent = '';
    if (state.currentArticle.parts && state.currentArticle.parts.length > 0) {
        const currentPart = state.currentArticle.parts[state.currentPartIndex];
        if (currentPart && elements.editParagraphTextarea) {
            currentContent = currentPart.content || '';
            elements.editParagraphTextarea.value = currentContent;
        }
    }
    // Store original values for change detection
    editDialogOriginalValues = {
        title: state.currentArticle.title || '',
        url: state.currentArticle.url || '',
        language: state.currentArticle.originalLanguage || 'en',
        content: currentContent,
    };
    // Setup language selector
    setupEditDialogLanguageSelector();
    // Clear any previous errors
    clearEditDialogErrors();
    // Show dialog
    elements.editDialog.classList.remove('hidden');
    // Focus first input
    setTimeout(() => elements.editTitleInput.focus(), 100);
    // Setup event listeners
    setupEditDialogEventListeners();
    // Setup resize functionality
    setupDialogResize();
    // Load and apply saved width
    loadDialogWidth();
}
/**
 * Hide article header edit dialog
 */
function hideArticleHeaderEditDialog() {
    if (!elements.editDialog)
        return;
    // Hide dialog
    elements.editDialog.classList.add('hidden');
    // Clear fields
    elements.editTitleInput.value = '';
    elements.editUrlInput.value = '';
    elements.editLanguageInput.value = '';
    elements.editParagraphTextarea.value = '';
    // Hide language dropdown
    if (elements.editLanguageDropdown) {
        elements.editLanguageDropdown.classList.remove('active');
    }
    // Clear errors
    clearEditDialogErrors();
    // Remove event listeners
    removeEditDialogEventListeners();
}
/**
 * Check if there are unsaved changes in the edit dialog
 */
function hasUnsavedChanges() {
    const currentTitle = elements.editTitleInput.value.trim();
    const currentUrl = elements.editUrlInput.value.trim();
    const currentLanguage = editDialogSelectedLanguage;
    const currentContent = elements.editParagraphTextarea.value.trim();
    return (currentTitle !== editDialogOriginalValues.title ||
        currentUrl !== editDialogOriginalValues.url ||
        currentLanguage !== editDialogOriginalValues.language ||
        currentContent !== editDialogOriginalValues.content);
}
/**
 * Handle close button click with unsaved changes check
 */
function handleEditDialogClose() {
    if (hasUnsavedChanges()) {
        showUnsavedChangesDialog();
    }
    else {
        hideArticleHeaderEditDialog();
    }
}
/**
 * Show unsaved changes confirmation dialog
 */
function showUnsavedChangesDialog() {
    const dialog = document.querySelector('.unsaved-changes-dialog');
    if (!dialog)
        return;
    // Show dialog
    dialog.classList.remove('hidden');
    // Setup button handlers
    const saveBtn = dialog.querySelector('.dialog-btn-save');
    const discardBtn = dialog.querySelector('.dialog-btn-discard');
    const cancelBtn = dialog.querySelector('.dialog-btn-cancel');
    const handleSave = () => {
        dialog.classList.add('hidden');
        void saveArticleHeaderEdit();
        cleanup();
    };
    const handleDiscard = () => {
        dialog.classList.add('hidden');
        hideArticleHeaderEditDialog();
        cleanup();
    };
    const handleCancel = () => {
        dialog.classList.add('hidden');
        cleanup();
    };
    const cleanup = () => {
        saveBtn.removeEventListener('click', handleSave);
        discardBtn.removeEventListener('click', handleDiscard);
        cancelBtn.removeEventListener('click', handleCancel);
    };
    saveBtn.addEventListener('click', handleSave);
    discardBtn.addEventListener('click', handleDiscard);
    cancelBtn.addEventListener('click', handleCancel);
}
/**
 * Setup edit dialog language selector
 */
function setupEditDialogLanguageSelector() {
    if (!elements.editLanguageOptions)
        return;
    // Populate language options
    elements.editLanguageOptions.innerHTML = LANGUAGES.map(lang => {
        const isSelected = lang.code === editDialogSelectedLanguage;
        return `
      <div class="edit-language-option ${isSelected ? 'selected' : ''}" data-code="${lang.code}">
        <span class="edit-language-option-name">${escapeHtml(lang.name)}</span>
        <span class="edit-language-option-code">${lang.code.toUpperCase()}</span>
        ${isSelected ? '<span class="edit-language-option-checkmark">✓</span>' : ''}
      </div>
    `;
    }).join('');
    // Add click listeners to options
    const options = elements.editLanguageOptions.querySelectorAll('.edit-language-option');
    options.forEach(option => {
        option.addEventListener('click', () => {
            const code = option.dataset.code;
            if (code) {
                selectEditDialogLanguage(code);
            }
        });
    });
}
/**
 * Select language in edit dialog
 */
function selectEditDialogLanguage(code) {
    const lang = LANGUAGES.find(l => l.code === code);
    if (!lang)
        return;
    // Update selected language
    editDialogSelectedLanguage = code;
    // Update input value
    if (elements.editLanguageInput) {
        elements.editLanguageInput.value = lang.name;
    }
    // Hide dropdown
    if (elements.editLanguageDropdown) {
        elements.editLanguageDropdown.classList.remove('active');
    }
    // Update options display
    setupEditDialogLanguageSelector();
}
/**
 * Filter edit dialog language options
 */
function filterEditDialogLanguageOptions(search) {
    if (!elements.editLanguageOptions)
        return;
    const searchLower = search.toLowerCase();
    const options = elements.editLanguageOptions.querySelectorAll('.edit-language-option');
    options.forEach(option => {
        const nameElement = option.querySelector('.edit-language-option-name');
        const name = nameElement?.textContent?.toLowerCase() || '';
        if (name.includes(searchLower)) {
            option.style.display = 'flex';
        }
        else {
            option.style.display = 'none';
        }
    });
}
/**
 * Validate edit dialog fields
 */
function validateEditDialogFields() {
    let isValid = true;
    // Clear previous errors
    clearEditDialogErrors();
    // Validate title
    const title = elements.editTitleInput.value.trim();
    if (!title) {
        showEditDialogFieldError(elements.editTitleInput, 'Title is required');
        isValid = false;
    }
    else if (title.length > 500) {
        showEditDialogFieldError(elements.editTitleInput, 'Title is too long (max 500 characters)');
        isValid = false;
    }
    // Validate URL
    const url = elements.editUrlInput.value.trim();
    if (!url) {
        showEditDialogFieldError(elements.editUrlInput, 'URL is required');
        isValid = false;
    }
    else if (url.length > 2000) {
        showEditDialogFieldError(elements.editUrlInput, 'URL is too long (max 2000 characters)');
        isValid = false;
    }
    // Validate language
    if (!editDialogSelectedLanguage) {
        showEditDialogFieldError(elements.editLanguageInput, 'Language is required');
        isValid = false;
    }
    // Validate paragraph content
    const paragraphContent = elements.editParagraphTextarea.value.trim();
    if (!paragraphContent) {
        showEditDialogFieldError(elements.editParagraphTextarea, 'Article content is required');
        isValid = false;
    }
    else if (paragraphContent.length > 50000) {
        showEditDialogFieldError(elements.editParagraphTextarea, 'Content is too long (max 50,000 characters)');
        isValid = false;
    }
    return isValid;
}
/**
 * Show field error
 */
function showEditDialogFieldError(input, message) {
    input.classList.add('error');
    const errorSpan = input.parentElement?.querySelector('.field-error');
    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.classList.remove('hidden');
    }
}
/**
 * Clear all edit dialog errors
 */
function clearEditDialogErrors() {
    // Remove error class from inputs
    elements.editTitleInput.classList.remove('error');
    elements.editUrlInput.classList.remove('error');
    elements.editLanguageInput.classList.remove('error');
    elements.editParagraphTextarea.classList.remove('error');
    // Hide error messages
    const errorSpans = elements.editDialog.querySelectorAll('.field-error');
    errorSpans.forEach(span => {
        span.classList.add('hidden');
        span.textContent = '';
    });
}
/**
 * Save edit dialog changes
 */
async function saveArticleHeaderEdit() {
    // Validate fields
    if (!validateEditDialogFields()) {
        return;
    }
    if (!state.currentArticle)
        return;
    try {
        // Get values
        const title = elements.editTitleInput.value.trim();
        const url = elements.editUrlInput.value.trim();
        const language = editDialogSelectedLanguage;
        const paragraphContent = elements.editParagraphTextarea.value.trim();
        // Update article in state
        state.currentArticle.title = title;
        state.currentArticle.url = url;
        state.currentArticle.originalLanguage = language;
        // Update current part content
        if (state.currentArticle.parts &&
            state.currentArticle.parts[state.currentPartIndex]) {
            state.currentArticle.parts[state.currentPartIndex].content =
                paragraphContent;
        }
        // Update session storage
        const tabId = await getCurrentTabId();
        await chrome.storage.session.set({
            [`article_${tabId}`]: state.currentArticle,
        });
        // Re-render article header
        renderArticleHeader(state.currentArticle);
        // Re-render article part to show updated content
        renderArticlePart(state.currentPartIndex);
        // Show success message
        showTooltip('Article updated successfully!');
        // Close dialog
        hideArticleHeaderEditDialog();
    }
    catch (error) {
        console.error('Error saving article:', error);
        showTooltip('Failed to save changes');
    }
}
/**
 * Setup edit dialog event listeners
 */
function setupEditDialogEventListeners() {
    // Close button
    const closeBtn = elements.editDialog.querySelector('.dialog-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', handleEditDialogCloseBtn);
    }
    // Save button
    const saveBtn = elements.editDialog.querySelector('.dialog-btn-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleEditDialogSave);
    }
    // Cancel button
    const cancelBtn = elements.editDialog.querySelector('.dialog-btn-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', handleEditDialogCancel);
    }
    // Overlay click
    const overlay = elements.editDialog.querySelector('.dialog-overlay');
    if (overlay) {
        overlay.addEventListener('click', handleEditDialogOverlayClick);
    }
    // Language input focus
    if (elements.editLanguageInput) {
        elements.editLanguageInput.addEventListener('focus', handleEditLanguageInputFocus);
        elements.editLanguageInput.addEventListener('input', handleEditLanguageInputChange);
        elements.editLanguageInput.addEventListener('blur', handleEditLanguageInputBlur);
    }
    // Keyboard shortcuts
    document.addEventListener('keydown', handleEditDialogKeydown);
}
/**
 * Remove edit dialog event listeners
 */
function removeEditDialogEventListeners() {
    const closeBtn = elements.editDialog.querySelector('.dialog-close-btn');
    if (closeBtn) {
        closeBtn.removeEventListener('click', handleEditDialogCloseBtn);
    }
    const saveBtn = elements.editDialog.querySelector('.dialog-btn-save');
    if (saveBtn) {
        saveBtn.removeEventListener('click', handleEditDialogSave);
    }
    const cancelBtn = elements.editDialog.querySelector('.dialog-btn-cancel');
    if (cancelBtn) {
        cancelBtn.removeEventListener('click', handleEditDialogCancel);
    }
    const overlay = elements.editDialog.querySelector('.dialog-overlay');
    if (overlay) {
        overlay.removeEventListener('click', handleEditDialogOverlayClick);
    }
    if (elements.editLanguageInput) {
        elements.editLanguageInput.removeEventListener('focus', handleEditLanguageInputFocus);
        elements.editLanguageInput.removeEventListener('input', handleEditLanguageInputChange);
        elements.editLanguageInput.removeEventListener('blur', handleEditLanguageInputBlur);
    }
    document.removeEventListener('keydown', handleEditDialogKeydown);
}
/**
 * Handle close button click
 */
function handleEditDialogCloseBtn() {
    handleEditDialogClose();
}
/**
 * Handle edit dialog save button click
 */
function handleEditDialogSave() {
    void saveArticleHeaderEdit();
}
/**
 * Handle edit dialog cancel button click
 */
function handleEditDialogCancel() {
    handleEditDialogClose();
}
/**
 * Handle overlay click
 */
function handleEditDialogOverlayClick() {
    handleEditDialogClose();
}
/**
 * Handle language input focus
 */
function handleEditLanguageInputFocus() {
    if (elements.editLanguageDropdown) {
        elements.editLanguageDropdown.classList.add('active');
    }
    // Clear input to show all languages
    elements.editLanguageInput.value = '';
    filterEditDialogLanguageOptions('');
}
/**
 * Handle language input change
 */
function handleEditLanguageInputChange() {
    const search = elements.editLanguageInput.value;
    filterEditDialogLanguageOptions(search);
}
/**
 * Handle language input blur
 */
function handleEditLanguageInputBlur() {
    // Delay to allow click on option
    setTimeout(() => {
        if (elements.editLanguageDropdown) {
            elements.editLanguageDropdown.classList.remove('active');
        }
        // Restore selected language name
        const selectedLang = LANGUAGES.find(l => l.code === editDialogSelectedLanguage);
        if (selectedLang) {
            elements.editLanguageInput.value = selectedLang.name;
        }
    }, 200);
}
/**
 * Handle edit dialog keyboard shortcuts
 */
function handleEditDialogKeydown(event) {
    // Only handle if dialog is visible
    if (elements.editDialog.classList.contains('hidden'))
        return;
    if (event.key === 'Escape') {
        event.preventDefault();
        handleEditDialogClose();
    }
    else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        void saveArticleHeaderEdit();
    }
}
// ============================================================================
// Dialog Resize Functionality
// ============================================================================
/**
 * Setup dialog resize functionality
 */
function setupDialogResize() {
    const dialogContent = elements.editDialog.querySelector('.article-edit-dialog-content');
    if (!dialogContent)
        return;
    const rightHandle = dialogContent.querySelector('.resize-handle-right');
    const leftHandle = dialogContent.querySelector('.resize-handle-left');
    if (rightHandle) {
        rightHandle.addEventListener('mousedown', e => handleResizeStart(e, 'right'));
        rightHandle.addEventListener('touchstart', e => handleResizeTouchStart(e, 'right'));
    }
    if (leftHandle) {
        leftHandle.addEventListener('mousedown', e => handleResizeStart(e, 'left'));
        leftHandle.addEventListener('touchstart', e => handleResizeTouchStart(e, 'left'));
    }
}
/**
 * Handle resize start (mouse)
 */
function handleResizeStart(e, direction) {
    e.preventDefault();
    const dialogContent = elements.editDialog.querySelector('.article-edit-dialog-content');
    if (!dialogContent)
        return;
    isResizing = true;
    resizeDirection = direction;
    resizeStartX = e.clientX;
    resizeStartWidth = dialogContent.offsetWidth;
    // Add resizing class
    document.body.classList.add('resizing');
    const handle = direction === 'right'
        ? dialogContent.querySelector('.resize-handle-right')
        : dialogContent.querySelector('.resize-handle-left');
    handle?.classList.add('resizing');
    // Add document-level listeners
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
}
/**
 * Handle resize start (touch)
 */
function handleResizeTouchStart(e, direction) {
    e.preventDefault();
    const dialogContent = elements.editDialog.querySelector('.article-edit-dialog-content');
    if (!dialogContent)
        return;
    const touch = e.touches[0];
    isResizing = true;
    resizeDirection = direction;
    resizeStartX = touch.clientX;
    resizeStartWidth = dialogContent.offsetWidth;
    // Add resizing class
    document.body.classList.add('resizing');
    const handle = direction === 'right'
        ? dialogContent.querySelector('.resize-handle-right')
        : dialogContent.querySelector('.resize-handle-left');
    handle?.classList.add('resizing');
    // Add document-level listeners
    document.addEventListener('touchmove', handleResizeTouchMove);
    document.addEventListener('touchend', handleResizeTouchEnd);
}
/**
 * Handle resize move (mouse)
 */
function handleResizeMove(e) {
    if (!isResizing)
        return;
    const dialogContent = elements.editDialog.querySelector('.article-edit-dialog-content');
    if (!dialogContent)
        return;
    const delta = e.clientX - resizeStartX;
    let newWidth;
    if (resizeDirection === 'right') {
        newWidth = resizeStartWidth + delta;
    }
    else {
        newWidth = resizeStartWidth - delta;
    }
    // Clamp width
    newWidth = Math.max(DIALOG_MIN_WIDTH, Math.min(DIALOG_MAX_WIDTH, newWidth));
    // Apply width
    dialogContent.style.width = `${newWidth}px`;
    dialogWidth = newWidth;
}
/**
 * Handle resize move (touch)
 */
function handleResizeTouchMove(e) {
    if (!isResizing)
        return;
    const dialogContent = elements.editDialog.querySelector('.article-edit-dialog-content');
    if (!dialogContent)
        return;
    const touch = e.touches[0];
    const delta = touch.clientX - resizeStartX;
    let newWidth;
    if (resizeDirection === 'right') {
        newWidth = resizeStartWidth + delta;
    }
    else {
        newWidth = resizeStartWidth - delta;
    }
    // Clamp width
    newWidth = Math.max(DIALOG_MIN_WIDTH, Math.min(DIALOG_MAX_WIDTH, newWidth));
    // Apply width
    dialogContent.style.width = `${newWidth}px`;
    dialogWidth = newWidth;
}
/**
 * Handle resize end (mouse)
 */
function handleResizeEnd() {
    if (!isResizing)
        return;
    isResizing = false;
    // Remove resizing class
    document.body.classList.remove('resizing');
    const dialogContent = elements.editDialog.querySelector('.article-edit-dialog-content');
    if (dialogContent) {
        dialogContent
            .querySelector('.resize-handle-right')
            ?.classList.remove('resizing');
        dialogContent
            .querySelector('.resize-handle-left')
            ?.classList.remove('resizing');
    }
    // Remove document-level listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    // Save width
    saveDialogWidth(dialogWidth);
}
/**
 * Handle resize end (touch)
 */
function handleResizeTouchEnd() {
    if (!isResizing)
        return;
    isResizing = false;
    // Remove resizing class
    document.body.classList.remove('resizing');
    const dialogContent = elements.editDialog.querySelector('.article-edit-dialog-content');
    if (dialogContent) {
        dialogContent
            .querySelector('.resize-handle-right')
            ?.classList.remove('resizing');
        dialogContent
            .querySelector('.resize-handle-left')
            ?.classList.remove('resizing');
    }
    // Remove document-level listeners
    document.removeEventListener('touchmove', handleResizeTouchMove);
    document.removeEventListener('touchend', handleResizeTouchEnd);
    // Save width
    saveDialogWidth(dialogWidth);
}
/**
 * Load dialog width from localStorage
 */
function loadDialogWidth() {
    try {
        const savedWidth = localStorage.getItem(DIALOG_WIDTH_STORAGE_KEY);
        if (savedWidth) {
            const width = parseInt(savedWidth, 10);
            if (!isNaN(width) &&
                width >= DIALOG_MIN_WIDTH &&
                width <= DIALOG_MAX_WIDTH) {
                dialogWidth = width;
                const dialogContent = elements.editDialog.querySelector('.article-edit-dialog-content');
                if (dialogContent) {
                    dialogContent.style.width = `${dialogWidth}px`;
                }
            }
        }
    }
    catch (error) {
        console.error('Error loading dialog width:', error);
    }
}
/**
 * Save dialog width to localStorage
 */
function saveDialogWidth(width) {
    try {
        localStorage.setItem(DIALOG_WIDTH_STORAGE_KEY, width.toString());
    }
    catch (error) {
        console.error('Error saving dialog width:', error);
    }
}
// ============================================================================
// Card Edit Dialog
// ============================================================================
// Card edit dialog state
let editingCardId = '';
let editingCardType = 'vocabulary';
// Card dialog resize state
let cardDialogWidth = 900;
let isCardResizing = false;
let cardResizeStartX = 0;
let cardResizeStartWidth = 0;
let cardResizeDirection = 'right';
const CARD_DIALOG_WIDTH_STORAGE_KEY = 'cardEditDialogWidth';
/**
 * Show card edit dialog
 */
async function showCardEditDialog(itemId, itemType) {
    const dialog = document.querySelector('.card-edit-dialog');
    if (!dialog)
        return;
    // Store editing state
    editingCardId = itemId;
    editingCardType = itemType;
    // Load card data from storage
    if (itemType === 'vocabulary') {
        const vocab = state.vocabularyItems.find(v => v.id === itemId);
        if (!vocab) {
            showTooltip('Vocabulary item not found');
            return;
        }
        populateVocabularyEditFields(vocab);
    }
    else {
        const sentence = state.sentenceItems.find(s => s.id === itemId);
        if (!sentence) {
            showTooltip('Sentence item not found');
            return;
        }
        populateSentenceEditFields(sentence);
    }
    // Show dialog
    dialog.classList.remove('hidden');
    // Focus first input
    setTimeout(() => {
        if (itemType === 'vocabulary') {
            const wordInput = document.getElementById('edit-vocab-word');
            wordInput?.focus();
        }
        else {
            const contentTextarea = document.getElementById('edit-sentence-content');
            contentTextarea?.focus();
        }
    }, 100);
    // Setup event listeners
    setupCardEditDialogEventListeners();
    // Setup resize functionality
    setupCardDialogResize();
    // Load and apply saved width
    loadCardDialogWidth();
}
/**
 * Populate vocabulary edit fields
 */
function populateVocabularyEditFields(vocab) {
    // Show vocabulary fields, hide sentence fields
    const vocabFields = document.querySelector('.vocab-edit-fields');
    const sentenceFields = document.querySelector('.sentence-edit-fields');
    if (vocabFields)
        vocabFields.classList.remove('hidden');
    if (sentenceFields)
        sentenceFields.classList.add('hidden');
    // Update dialog title
    const dialogTitle = document.querySelector('.card-edit-dialog .edit-dialog-title');
    if (dialogTitle)
        dialogTitle.textContent = 'Edit Vocabulary Card';
    // Populate fields
    const wordInput = document.getElementById('edit-vocab-word');
    const translationInput = document.getElementById('edit-vocab-translation');
    const contextTextarea = document.getElementById('edit-vocab-context');
    const examplesTextarea = document.getElementById('edit-vocab-examples');
    if (wordInput)
        wordInput.value = vocab.word || '';
    if (translationInput)
        translationInput.value = vocab.translation || '';
    if (contextTextarea)
        contextTextarea.value = vocab.context || '';
    if (examplesTextarea) {
        examplesTextarea.value = vocab.exampleSentences.join('\n');
    }
    // Clear errors
    clearCardEditDialogErrors();
}
/**
 * Populate sentence edit fields
 */
function populateSentenceEditFields(sentence) {
    // Show sentence fields, hide vocabulary fields
    const vocabFields = document.querySelector('.vocab-edit-fields');
    const sentenceFields = document.querySelector('.sentence-edit-fields');
    if (vocabFields)
        vocabFields.classList.add('hidden');
    if (sentenceFields)
        sentenceFields.classList.remove('hidden');
    // Update dialog title
    const dialogTitle = document.querySelector('.card-edit-dialog .edit-dialog-title');
    if (dialogTitle)
        dialogTitle.textContent = 'Edit Sentence Card';
    // Populate fields
    const contentTextarea = document.getElementById('edit-sentence-content');
    const translationTextarea = document.getElementById('edit-sentence-translation');
    if (contentTextarea)
        contentTextarea.value = sentence.content || '';
    if (translationTextarea)
        translationTextarea.value = sentence.translation || '';
    // Clear errors
    clearCardEditDialogErrors();
}
/**
 * Setup card edit dialog event listeners
 */
function setupCardEditDialogEventListeners() {
    const dialog = document.querySelector('.card-edit-dialog');
    if (!dialog)
        return;
    // Remove existing listeners
    removeCardEditDialogEventListeners();
    // Close button
    const closeBtn = dialog.querySelector('.dialog-close-btn');
    if (closeBtn) {
        const closeHandler = () => hideCardEditDialog();
        closeBtn.addEventListener('click', closeHandler);
        closeBtn._cardEditCloseHandler = closeHandler;
    }
    // Overlay click
    const overlay = dialog.querySelector('.dialog-overlay');
    if (overlay) {
        const overlayHandler = () => hideCardEditDialog();
        overlay.addEventListener('click', overlayHandler);
        overlay._cardEditOverlayHandler = overlayHandler;
    }
    // Cancel button
    const cancelBtn = dialog.querySelector('.dialog-btn-cancel');
    if (cancelBtn) {
        const cancelHandler = () => hideCardEditDialog();
        cancelBtn.addEventListener('click', cancelHandler);
        cancelBtn._cardEditCancelHandler = cancelHandler;
    }
    // Save button
    const saveBtn = dialog.querySelector('.dialog-btn-save');
    if (saveBtn) {
        const saveHandler = () => void handleCardEditSave();
        saveBtn.addEventListener('click', saveHandler);
        saveBtn._cardEditSaveHandler = saveHandler;
    }
    // Keyboard shortcuts
    const keyHandler = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            hideCardEditDialog();
        }
        else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            void handleCardEditSave();
        }
    };
    document.addEventListener('keydown', keyHandler);
    dialog._cardEditKeyHandler = keyHandler;
}
/**
 * Remove card edit dialog event listeners
 */
function removeCardEditDialogEventListeners() {
    const dialog = document.querySelector('.card-edit-dialog');
    if (!dialog)
        return;
    // Close button
    const closeBtn = dialog.querySelector('.dialog-close-btn');
    if (closeBtn && closeBtn._cardEditCloseHandler) {
        closeBtn.removeEventListener('click', closeBtn._cardEditCloseHandler);
        delete closeBtn._cardEditCloseHandler;
    }
    // Overlay
    const overlay = dialog.querySelector('.dialog-overlay');
    if (overlay && overlay._cardEditOverlayHandler) {
        overlay.removeEventListener('click', overlay._cardEditOverlayHandler);
        delete overlay._cardEditOverlayHandler;
    }
    // Cancel button
    const cancelBtn = dialog.querySelector('.dialog-btn-cancel');
    if (cancelBtn && cancelBtn._cardEditCancelHandler) {
        cancelBtn.removeEventListener('click', cancelBtn._cardEditCancelHandler);
        delete cancelBtn._cardEditCancelHandler;
    }
    // Save button
    const saveBtn = dialog.querySelector('.dialog-btn-save');
    if (saveBtn && saveBtn._cardEditSaveHandler) {
        saveBtn.removeEventListener('click', saveBtn._cardEditSaveHandler);
        delete saveBtn._cardEditSaveHandler;
    }
    // Keyboard handler
    if (dialog._cardEditKeyHandler) {
        document.removeEventListener('keydown', dialog._cardEditKeyHandler);
        delete dialog._cardEditKeyHandler;
    }
}
/**
 * Hide card edit dialog
 */
function hideCardEditDialog() {
    const dialog = document.querySelector('.card-edit-dialog');
    if (!dialog)
        return;
    // Hide dialog
    dialog.classList.add('hidden');
    // Clear fields
    const wordInput = document.getElementById('edit-vocab-word');
    const translationInput = document.getElementById('edit-vocab-translation');
    const contextTextarea = document.getElementById('edit-vocab-context');
    const examplesTextarea = document.getElementById('edit-vocab-examples');
    const contentTextarea = document.getElementById('edit-sentence-content');
    const translationTextarea = document.getElementById('edit-sentence-translation');
    if (wordInput)
        wordInput.value = '';
    if (translationInput)
        translationInput.value = '';
    if (contextTextarea)
        contextTextarea.value = '';
    if (examplesTextarea)
        examplesTextarea.value = '';
    if (contentTextarea)
        contentTextarea.value = '';
    if (translationTextarea)
        translationTextarea.value = '';
    // Clear errors
    clearCardEditDialogErrors();
    // Remove event listeners
    removeCardEditDialogEventListeners();
    // Reset state
    editingCardId = '';
}
/**
 * Validate card edit fields
 */
function validateCardEditFields() {
    let isValid = true;
    // Clear previous errors
    clearCardEditDialogErrors();
    if (editingCardType === 'vocabulary') {
        // Validate word
        const wordInput = document.getElementById('edit-vocab-word');
        const word = wordInput?.value.trim() || '';
        if (!word) {
            showCardEditFieldError(wordInput, 'Word/phrase is required');
            isValid = false;
        }
        else if (word.length > 200) {
            showCardEditFieldError(wordInput, 'Word/phrase is too long (max 200 characters)');
            isValid = false;
        }
        // Validate translation
        const translationInput = document.getElementById('edit-vocab-translation');
        const translation = translationInput?.value.trim() || '';
        if (!translation) {
            showCardEditFieldError(translationInput, 'Translation is required');
            isValid = false;
        }
        else if (translation.length > 500) {
            showCardEditFieldError(translationInput, 'Translation is too long (max 500 characters)');
            isValid = false;
        }
        // Validate context (optional)
        const contextTextarea = document.getElementById('edit-vocab-context');
        const context = contextTextarea?.value.trim() || '';
        if (context.length > 1000) {
            showCardEditFieldError(contextTextarea, 'Context is too long (max 1000 characters)');
            isValid = false;
        }
    }
    else {
        // Validate sentence content
        const contentTextarea = document.getElementById('edit-sentence-content');
        const content = contentTextarea?.value.trim() || '';
        if (!content) {
            showCardEditFieldError(contentTextarea, 'Sentence is required');
            isValid = false;
        }
        else if (content.length > 1000) {
            showCardEditFieldError(contentTextarea, 'Sentence is too long (max 1000 characters)');
            isValid = false;
        }
        // Validate translation
        const translationTextarea = document.getElementById('edit-sentence-translation');
        const translation = translationTextarea?.value.trim() || '';
        if (!translation) {
            showCardEditFieldError(translationTextarea, 'Translation is required');
            isValid = false;
        }
        else if (translation.length > 1000) {
            showCardEditFieldError(translationTextarea, 'Translation is too long (max 1000 characters)');
            isValid = false;
        }
    }
    return isValid;
}
/**
 * Show field error in card edit dialog
 */
function showCardEditFieldError(field, message) {
    const editField = field.closest('.edit-field');
    if (!editField)
        return;
    const errorSpan = editField.querySelector('.field-error');
    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.classList.remove('hidden');
    }
    field.classList.add('error');
}
/**
 * Clear all errors in card edit dialog
 */
function clearCardEditDialogErrors() {
    const dialog = document.querySelector('.card-edit-dialog');
    if (!dialog)
        return;
    const errorSpans = dialog.querySelectorAll('.field-error');
    errorSpans.forEach(span => {
        span.classList.add('hidden');
        span.textContent = '';
    });
    const errorFields = dialog.querySelectorAll('.error');
    errorFields.forEach(field => {
        field.classList.remove('error');
    });
}
/**
 * Handle card edit save
 */
async function handleCardEditSave() {
    // Validate fields
    if (!validateCardEditFields()) {
        return;
    }
    try {
        if (editingCardType === 'vocabulary') {
            await saveVocabularyCardEdit();
        }
        else {
            await saveSentenceCardEdit();
        }
        // Show success message
        showTooltip('Card updated successfully');
        // Hide dialog
        hideCardEditDialog();
    }
    catch (error) {
        console.error('Error saving card edit:', error);
        showTooltip('Failed to save card changes');
    }
}
/**
 * Save vocabulary card edit
 */
async function saveVocabularyCardEdit() {
    // Get field values
    const wordInput = document.getElementById('edit-vocab-word');
    const translationInput = document.getElementById('edit-vocab-translation');
    const contextTextarea = document.getElementById('edit-vocab-context');
    const examplesTextarea = document.getElementById('edit-vocab-examples');
    const word = wordInput.value.trim();
    const translation = translationInput.value.trim();
    const context = contextTextarea.value.trim();
    const examplesText = examplesTextarea.value.trim();
    // Parse examples (one per line, filter empty lines)
    const exampleSentences = examplesText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 5); // Max 5 examples
    // Find and update vocabulary item
    const vocabIndex = state.vocabularyItems.findIndex(v => v.id === editingCardId);
    if (vocabIndex === -1) {
        throw new Error('Vocabulary item not found');
    }
    // Update item
    state.vocabularyItems[vocabIndex] = {
        ...state.vocabularyItems[vocabIndex],
        word,
        translation,
        context,
        exampleSentences,
    };
    // Save to storage
    await chrome.storage.local.set({
        vocabularyItems: state.vocabularyItems,
    });
    // Update card in DOM
    if (state.currentArticle) {
        const part = state.currentArticle.parts[state.currentPartIndex];
        if (part) {
            renderPartVocabularyCards(part);
        }
    }
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('vocabulary-updated'));
}
/**
 * Save sentence card edit
 */
async function saveSentenceCardEdit() {
    // Get field values
    const contentTextarea = document.getElementById('edit-sentence-content');
    const translationTextarea = document.getElementById('edit-sentence-translation');
    const content = contentTextarea.value.trim();
    const translation = translationTextarea.value.trim();
    // Find and update sentence item
    const sentenceIndex = state.sentenceItems.findIndex(s => s.id === editingCardId);
    if (sentenceIndex === -1) {
        throw new Error('Sentence item not found');
    }
    // Update item
    state.sentenceItems[sentenceIndex] = {
        ...state.sentenceItems[sentenceIndex],
        content,
        translation,
    };
    // Save to storage
    await chrome.storage.local.set({
        sentenceItems: state.sentenceItems,
    });
    // Update card in DOM
    if (state.currentArticle) {
        const part = state.currentArticle.parts[state.currentPartIndex];
        if (part) {
            renderPartSentenceCards(part);
        }
    }
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('sentences-updated'));
}
// ============================================================================
// Card Dialog Resize Functionality
// ============================================================================
/**
 * Setup card dialog resize functionality
 */
function setupCardDialogResize() {
    const dialog = document.querySelector('.card-edit-dialog');
    if (!dialog)
        return;
    const dialogContent = dialog.querySelector('.card-edit-dialog-content');
    if (!dialogContent)
        return;
    const rightHandle = dialogContent.querySelector('.resize-handle-right');
    const leftHandle = dialogContent.querySelector('.resize-handle-left');
    if (rightHandle) {
        rightHandle.addEventListener('mousedown', e => handleCardResizeStart(e, 'right'));
        rightHandle.addEventListener('touchstart', e => handleCardResizeTouchStart(e, 'right'));
    }
    if (leftHandle) {
        leftHandle.addEventListener('mousedown', e => handleCardResizeStart(e, 'left'));
        leftHandle.addEventListener('touchstart', e => handleCardResizeTouchStart(e, 'left'));
    }
}
/**
 * Handle card resize start (mouse)
 */
function handleCardResizeStart(e, direction) {
    e.preventDefault();
    const dialog = document.querySelector('.card-edit-dialog');
    if (!dialog)
        return;
    const dialogContent = dialog.querySelector('.card-edit-dialog-content');
    if (!dialogContent)
        return;
    isCardResizing = true;
    cardResizeDirection = direction;
    cardResizeStartX = e.clientX;
    cardResizeStartWidth = dialogContent.offsetWidth;
    // Add resizing class
    document.body.classList.add('resizing');
    const handle = direction === 'right'
        ? dialogContent.querySelector('.resize-handle-right')
        : dialogContent.querySelector('.resize-handle-left');
    handle?.classList.add('resizing');
    // Add document-level listeners
    document.addEventListener('mousemove', handleCardResizeMove);
    document.addEventListener('mouseup', handleCardResizeEnd);
}
/**
 * Handle card resize start (touch)
 */
function handleCardResizeTouchStart(e, direction) {
    e.preventDefault();
    const dialog = document.querySelector('.card-edit-dialog');
    if (!dialog)
        return;
    const dialogContent = dialog.querySelector('.card-edit-dialog-content');
    if (!dialogContent)
        return;
    const touch = e.touches[0];
    isCardResizing = true;
    cardResizeDirection = direction;
    cardResizeStartX = touch.clientX;
    cardResizeStartWidth = dialogContent.offsetWidth;
    // Add resizing class
    document.body.classList.add('resizing');
    const handle = direction === 'right'
        ? dialogContent.querySelector('.resize-handle-right')
        : dialogContent.querySelector('.resize-handle-left');
    handle?.classList.add('resizing');
    // Add document-level listeners
    document.addEventListener('touchmove', handleCardResizeTouchMove);
    document.addEventListener('touchend', handleCardResizeTouchEnd);
}
/**
 * Handle card resize move (mouse)
 */
function handleCardResizeMove(e) {
    if (!isCardResizing)
        return;
    const dialog = document.querySelector('.card-edit-dialog');
    if (!dialog)
        return;
    const dialogContent = dialog.querySelector('.card-edit-dialog-content');
    if (!dialogContent)
        return;
    const delta = e.clientX - cardResizeStartX;
    let newWidth;
    if (cardResizeDirection === 'right') {
        newWidth = cardResizeStartWidth + delta;
    }
    else {
        newWidth = cardResizeStartWidth - delta;
    }
    // Clamp width
    newWidth = Math.max(DIALOG_MIN_WIDTH, Math.min(DIALOG_MAX_WIDTH, newWidth));
    // Apply width
    dialogContent.style.width = `${newWidth}px`;
    cardDialogWidth = newWidth;
}
/**
 * Handle card resize move (touch)
 */
function handleCardResizeTouchMove(e) {
    if (!isCardResizing)
        return;
    const dialog = document.querySelector('.card-edit-dialog');
    if (!dialog)
        return;
    const dialogContent = dialog.querySelector('.card-edit-dialog-content');
    if (!dialogContent)
        return;
    const touch = e.touches[0];
    const delta = touch.clientX - cardResizeStartX;
    let newWidth;
    if (cardResizeDirection === 'right') {
        newWidth = cardResizeStartWidth + delta;
    }
    else {
        newWidth = cardResizeStartWidth - delta;
    }
    // Clamp width
    newWidth = Math.max(DIALOG_MIN_WIDTH, Math.min(DIALOG_MAX_WIDTH, newWidth));
    // Apply width
    dialogContent.style.width = `${newWidth}px`;
    cardDialogWidth = newWidth;
}
/**
 * Handle card resize end (mouse)
 */
function handleCardResizeEnd() {
    if (!isCardResizing)
        return;
    isCardResizing = false;
    // Remove resizing class
    document.body.classList.remove('resizing');
    const dialog = document.querySelector('.card-edit-dialog');
    if (dialog) {
        const dialogContent = dialog.querySelector('.card-edit-dialog-content');
        if (dialogContent) {
            dialogContent
                .querySelector('.resize-handle-right')
                ?.classList.remove('resizing');
            dialogContent
                .querySelector('.resize-handle-left')
                ?.classList.remove('resizing');
        }
    }
    // Remove document-level listeners
    document.removeEventListener('mousemove', handleCardResizeMove);
    document.removeEventListener('mouseup', handleCardResizeEnd);
    // Save width
    saveCardDialogWidth(cardDialogWidth);
}
/**
 * Handle card resize end (touch)
 */
function handleCardResizeTouchEnd() {
    if (!isCardResizing)
        return;
    isCardResizing = false;
    // Remove resizing class
    document.body.classList.remove('resizing');
    const dialog = document.querySelector('.card-edit-dialog');
    if (dialog) {
        const dialogContent = dialog.querySelector('.card-edit-dialog-content');
        if (dialogContent) {
            dialogContent
                .querySelector('.resize-handle-right')
                ?.classList.remove('resizing');
            dialogContent
                .querySelector('.resize-handle-left')
                ?.classList.remove('resizing');
        }
    }
    // Remove document-level listeners
    document.removeEventListener('touchmove', handleCardResizeTouchMove);
    document.removeEventListener('touchend', handleCardResizeTouchEnd);
    // Save width
    saveCardDialogWidth(cardDialogWidth);
}
/**
 * Load card dialog width from localStorage
 */
function loadCardDialogWidth() {
    try {
        const savedWidth = localStorage.getItem(CARD_DIALOG_WIDTH_STORAGE_KEY);
        if (savedWidth) {
            const width = parseInt(savedWidth, 10);
            if (!isNaN(width) &&
                width >= DIALOG_MIN_WIDTH &&
                width <= DIALOG_MAX_WIDTH) {
                cardDialogWidth = width;
                const dialog = document.querySelector('.card-edit-dialog');
                if (dialog) {
                    const dialogContent = dialog.querySelector('.card-edit-dialog-content');
                    if (dialogContent) {
                        dialogContent.style.width = `${cardDialogWidth}px`;
                    }
                }
            }
        }
    }
    catch (error) {
        console.error('Error loading card dialog width:', error);
    }
}
/**
 * Save card dialog width to localStorage
 */
function saveCardDialogWidth(width) {
    try {
        localStorage.setItem(CARD_DIALOG_WIDTH_STORAGE_KEY, width.toString());
    }
    catch (error) {
        console.error('Error saving card dialog width:', error);
    }
}
// ============================================================================
// Paragraph Edit Mode
// ============================================================================
// Edit mode state
let editingParagraph = null;
let originalParagraphText = '';
let removedHighlights = [];
let editModeSelectionRange = null;
/**
 * Handle paragraph edit action
 */
async function handleParagraphEdit(paragraph) {
    // Check if paragraph has highlights
    const highlights = paragraph.querySelectorAll('[data-highlight-type]');
    const vocabCount = paragraph.querySelectorAll('[data-highlight-type="vocabulary"]').length;
    const sentenceCount = paragraph.querySelectorAll('[data-highlight-type="sentence"]').length;
    if (highlights.length > 0) {
        // Show confirmation dialog
        await showEditConfirmationDialog(paragraph, vocabCount, sentenceCount);
    }
    else {
        // No highlights, directly enable edit mode
        await enableEditMode(paragraph);
    }
}
/**
 * Show edit confirmation dialog
 */
async function showEditConfirmationDialog(paragraph, vocabCount, sentenceCount) {
    const dialog = document.querySelector('.edit-confirmation-dialog');
    if (!dialog)
        return;
    const highlightCountSpan = dialog.querySelector('.highlight-count');
    const confirmBtn = dialog.querySelector('.dialog-btn-confirm');
    const cancelBtn = dialog.querySelector('.dialog-btn-cancel');
    // Build highlight count message
    const parts = [];
    if (vocabCount > 0) {
        parts.push(`${vocabCount} vocabulary item${vocabCount > 1 ? 's' : ''}`);
    }
    if (sentenceCount > 0) {
        parts.push(`${sentenceCount} sentence${sentenceCount > 1 ? 's' : ''}`);
    }
    highlightCountSpan.textContent = parts.join(' and ');
    // Show dialog
    dialog.classList.remove('hidden');
    // Wait for user action
    return new Promise(resolve => {
        const handleConfirm = () => {
            dialog.classList.add('hidden');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            void enableEditMode(paragraph);
            resolve();
        };
        const handleCancel = () => {
            dialog.classList.add('hidden');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            resolve();
        };
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        // Handle Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}
/**
 * Enable edit mode for a paragraph
 */
async function enableEditMode(paragraph) {
    // Store original state
    editingParagraph = paragraph;
    originalParagraphText = paragraph.textContent || '';
    // Remove and store highlights
    await removeHighlightsFromParagraph(paragraph);
    // Make paragraph editable
    paragraph.contentEditable = 'true';
    paragraph.classList.add('editing');
    // Hide copy button
    const copyBtn = paragraph.querySelector('.paragraph-copy-btn');
    if (copyBtn) {
        copyBtn.style.display = 'none';
    }
    // Remove paragraph context menu handler to disable it during edit mode
    const paragraphContextMenuHandler = paragraph
        ._paragraphContextMenuHandler;
    if (paragraphContextMenuHandler) {
        paragraph.removeEventListener('contextmenu', paragraphContextMenuHandler);
    }
    // Focus paragraph
    paragraph.focus();
    // Show edit toolbar
    showEditToolbar(paragraph);
    // Setup keyboard handlers
    setupEditModeKeyboardHandlers(paragraph);
    // Setup context menu handler for edit mode
    paragraph.addEventListener('contextmenu', handleEditModeContextMenu);
    paragraph._editContextMenuHandler = handleEditModeContextMenu;
    // Setup click outside handler to hide context menu
    const handleClickOutside = (e) => {
        const menu = document.querySelector('.edit-context-menu');
        if (menu && !menu.contains(e.target)) {
            hideEditContextMenu();
        }
    };
    document.addEventListener('click', handleClickOutside);
    paragraph._editClickOutsideHandler = handleClickOutside;
    // Setup input handler to hide context menu when typing
    const handleInput = () => {
        hideEditContextMenu();
    };
    paragraph.addEventListener('input', handleInput);
    paragraph._editInputHandler = handleInput;
    // Disable navigation and mode switching
    disableUIControls();
    // Pause highlight manager to prevent highlighting during edit
    pauseHighlightManager();
}
/**
 * Remove highlights from paragraph and store them
 */
async function removeHighlightsFromParagraph(paragraph) {
    removedHighlights = [];
    // Find all highlights in this paragraph
    const highlights = paragraph.querySelectorAll('[data-highlight-type]');
    // Get storage data once
    const vocabData = await chrome.storage.local.get('vocabulary');
    const sentenceData = await chrome.storage.local.get('sentences');
    const vocabulary = vocabData.vocabulary || {};
    const sentences = sentenceData.sentences || {};
    // Collect highlights to remove
    highlights.forEach(highlightEl => {
        const id = highlightEl.getAttribute('data-highlight-id');
        const type = highlightEl.getAttribute('data-highlight-type');
        if (!id || !type)
            return;
        // Store the data before removing
        if (type === 'vocabulary' && vocabulary[id]) {
            removedHighlights.push({
                id,
                type,
                data: vocabulary[id],
            });
        }
        else if (type === 'sentence' && sentences[id]) {
            removedHighlights.push({
                id,
                type,
                data: sentences[id],
            });
        }
        // Remove highlight from DOM (unwrap)
        const parent = highlightEl.parentNode;
        if (parent) {
            while (highlightEl.firstChild) {
                parent.insertBefore(highlightEl.firstChild, highlightEl);
            }
            parent.removeChild(highlightEl);
        }
    });
    // Remove from storage
    await removeHighlightsFromStorage(removedHighlights);
}
/**
 * Remove highlights from storage
 */
async function removeHighlightsFromStorage(highlights) {
    try {
        // Remove vocabulary items
        const vocabIds = highlights
            .filter(h => h.type === 'vocabulary')
            .map(h => h.id);
        if (vocabIds.length > 0) {
            const data = await chrome.storage.local.get('vocabulary');
            const vocabulary = data.vocabulary || {};
            vocabIds.forEach(id => delete vocabulary[id]);
            await chrome.storage.local.set({ vocabulary });
            // Update state
            state.vocabularyItems = state.vocabularyItems.filter(v => !vocabIds.includes(v.id));
        }
        // Remove sentence items
        const sentenceIds = highlights
            .filter(h => h.type === 'sentence')
            .map(h => h.id);
        if (sentenceIds.length > 0) {
            const data = await chrome.storage.local.get('sentences');
            const sentences = data.sentences || {};
            sentenceIds.forEach(id => delete sentences[id]);
            await chrome.storage.local.set({ sentences });
            // Update state
            state.sentenceItems = state.sentenceItems.filter(s => !sentenceIds.includes(s.id));
        }
        // Re-render cards
        if (state.currentArticle) {
            const part = state.currentArticle.parts[state.currentPartIndex];
            if (part) {
                renderPartVocabularyCards(part);
                renderPartSentenceCards(part);
            }
        }
    }
    catch (error) {
        console.error('Error removing highlights from storage:', error);
    }
}
/**
 * Show edit toolbar
 */
function showEditToolbar(paragraph) {
    const toolbar = document.querySelector('.edit-toolbar');
    if (!toolbar)
        return;
    // Position toolbar below paragraph
    const rect = paragraph.getBoundingClientRect();
    toolbar.style.left = `${rect.left}px`;
    toolbar.style.top = `${rect.bottom + window.scrollY + 8}px`;
    // Show toolbar
    toolbar.classList.remove('hidden');
    // Setup button handlers
    const saveBtn = toolbar.querySelector('.edit-btn-save');
    const cancelBtn = toolbar.querySelector('.edit-btn-cancel');
    saveBtn.onclick = () => void saveEdit();
    cancelBtn.onclick = () => void cancelEdit();
}
/**
 * Setup keyboard handlers for edit mode
 */
function setupEditModeKeyboardHandlers(paragraph) {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void saveEdit();
        }
        else if (e.key === 'Escape') {
            e.preventDefault();
            // Hide edit context menu if visible
            hideEditContextMenu();
            void cancelEdit();
        }
    };
    paragraph.addEventListener('keydown', handleKeyDown);
    paragraph._editKeyHandler = handleKeyDown;
}
/**
 * Handle context menu in edit mode
 */
function handleEditModeContextMenu(event) {
    console.log('🖱️ Right-click detected in edit mode');
    // Only handle if we're in edit mode
    if (!editingParagraph) {
        console.log('⚠️ Not in edit mode, ignoring');
        return;
    }
    const target = event.target;
    // Only handle if clicking within the editing paragraph
    if (target !== editingParagraph && !editingParagraph.contains(target)) {
        console.log('⚠️ Click outside editing paragraph, ignoring');
        return;
    }
    // Get current selection
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
        console.log('⚠️ No text selection, allowing browser default');
        // No selection - allow browser default context menu
        return;
    }
    const selectedText = selection.toString().trim();
    if (!selectedText) {
        console.log('⚠️ Empty selection, allowing browser default');
        // Empty selection - allow browser default
        return;
    }
    console.log('✅ Valid selection detected:', {
        text: selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''),
        length: selectedText.length,
    });
    // We have a valid selection - prevent default and show custom menu
    event.preventDefault();
    // Store the selection range (clone it to preserve)
    const range = selection.getRangeAt(0);
    editModeSelectionRange = range.cloneRange();
    // Show edit context menu at cursor position
    showEditContextMenu(event.pageX, event.pageY);
}
/**
 * Show edit context menu at specified position
 */
function showEditContextMenu(x, y) {
    const menu = document.querySelector('.edit-context-menu');
    if (!menu) {
        console.error('❌ Edit context menu element not found in DOM');
        return;
    }
    const menuItems = menu.querySelectorAll('.context-menu-item');
    console.log('📋 Showing edit context menu:', {
        position: { x, y },
        itemCount: menuItems.length,
        items: Array.from(menuItems).map(item => ({
            action: item.dataset.action,
            text: item.textContent?.trim(),
            innerHTML: item.innerHTML,
        })),
    });
    // Position menu at cursor
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    // Check if menu goes off-screen and adjust
    menu.classList.remove('hidden');
    // Get menu dimensions after showing
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    console.log('📐 Menu dimensions:', {
        width: menuRect.width,
        height: menuRect.height,
        position: { left: menuRect.left, top: menuRect.top },
    });
    // Log detailed computed styles for each menu item
    console.log('🎨 Menu item computed styles:');
    menuItems.forEach((item, index) => {
        const computed = window.getComputedStyle(item);
        console.log(`  Item ${index} (${item.dataset.action}):`, {
            textContent: item.textContent,
            fontSize: computed.fontSize,
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            display: computed.display,
            lineHeight: computed.lineHeight,
            padding: computed.padding,
            width: computed.width,
            height: computed.height,
            opacity: computed.opacity,
            visibility: computed.visibility,
            overflow: computed.overflow,
            whiteSpace: computed.whiteSpace,
            fontFamily: computed.fontFamily,
            fontWeight: computed.fontWeight,
        });
    });
    // Adjust horizontal position if off-screen
    if (menuRect.right > viewportWidth) {
        menu.style.left = `${x - menuRect.width}px`;
        console.log('↔️ Adjusted horizontal position to prevent overflow');
    }
    // Adjust vertical position if off-screen
    if (menuRect.bottom > viewportHeight) {
        menu.style.top = `${y - menuRect.height}px`;
        console.log('↕️ Adjusted vertical position to prevent overflow');
    }
}
/**
 * Hide edit context menu
 */
function hideEditContextMenu() {
    const menu = document.querySelector('.edit-context-menu');
    if (menu) {
        menu.classList.add('hidden');
    }
    editModeSelectionRange = null;
}
/**
 * Handle copy selection action in edit mode
 */
async function handleCopySelection() {
    if (!editModeSelectionRange)
        return;
    try {
        // Get text from stored range
        const text = editModeSelectionRange.toString();
        // Copy to clipboard
        await navigator.clipboard.writeText(text);
        // Show success message
        showTooltip('Text copied!');
        // Hide menu
        hideEditContextMenu();
        // Optionally restore selection for better UX
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(editModeSelectionRange);
        }
    }
    catch (error) {
        console.error('Failed to copy text:', error);
        showTooltip('Failed to copy text');
    }
}
/**
 * Handle delete selection action in edit mode
 */
function handleDeleteSelection() {
    if (!editModeSelectionRange || !editingParagraph)
        return;
    try {
        // Delete content from range
        editModeSelectionRange.deleteContents();
        // Collapse range to start position
        editModeSelectionRange.collapse(true);
        // Update selection
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(editModeSelectionRange);
        }
        // Hide menu
        hideEditContextMenu();
        // Focus back on paragraph
        editingParagraph.focus();
    }
    catch (error) {
        console.error('Failed to delete text:', error);
        showTooltip('Failed to delete text');
    }
}
/**
 * Save paragraph edit
 */
async function saveEdit() {
    if (!editingParagraph || !state.currentArticle)
        return;
    try {
        // Get edited text
        const editedText = editingParagraph.textContent?.trim() || '';
        // Validate
        if (!editedText) {
            showTooltip('Paragraph cannot be empty');
            return;
        }
        if (editedText.length > 10000) {
            showTooltip('Paragraph is too long (max 10,000 characters)');
            return;
        }
        // Update article part in session storage
        const part = state.currentArticle.parts[state.currentPartIndex];
        if (part) {
            // Find paragraph index
            const paragraphs = part.content.split('\n\n');
            const allParagraphs = elements.articlePartContent.querySelectorAll('p');
            const paragraphIndex = Array.from(allParagraphs).indexOf(editingParagraph);
            if (paragraphIndex >= 0 && paragraphIndex < paragraphs.length) {
                paragraphs[paragraphIndex] = editedText;
                part.content = paragraphs.join('\n\n');
                // Update in session storage
                const tabId = await getCurrentTabId();
                await chrome.storage.session.set({
                    [`article_${tabId}`]: state.currentArticle,
                });
            }
        }
        // Exit edit mode
        exitEditMode();
        // Show success message
        showTooltip('Paragraph updated');
        // Clear removed highlights (they're permanently deleted)
        removedHighlights = [];
    }
    catch (error) {
        console.error('Error saving paragraph edit:', error);
        showTooltip('Failed to save changes');
    }
}
/**
 * Cancel paragraph edit
 */
async function cancelEdit() {
    if (!editingParagraph)
        return;
    // Restore original text
    editingParagraph.textContent = originalParagraphText;
    // Restore highlights
    await restoreHighlights();
    // Exit edit mode
    exitEditMode();
    // Show cancelled message
    showTooltip('Edit cancelled');
}
/**
 * Restore highlights after cancelling edit
 */
async function restoreHighlights() {
    if (removedHighlights.length === 0)
        return;
    try {
        // Restore to storage
        const vocabToRestore = removedHighlights.filter(h => h.type === 'vocabulary');
        const sentencesToRestore = removedHighlights.filter(h => h.type === 'sentence');
        if (vocabToRestore.length > 0) {
            const data = await chrome.storage.local.get('vocabulary');
            const vocabulary = data.vocabulary || {};
            vocabToRestore.forEach(h => {
                vocabulary[h.id] = h.data;
            });
            await chrome.storage.local.set({ vocabulary });
            // Update state
            state.vocabularyItems.push(...vocabToRestore.map(h => h.data));
        }
        if (sentencesToRestore.length > 0) {
            const data = await chrome.storage.local.get('sentences');
            const sentences = data.sentences || {};
            sentencesToRestore.forEach(h => {
                sentences[h.id] = h.data;
            });
            await chrome.storage.local.set({ sentences });
            // Update state
            state.sentenceItems.push(...sentencesToRestore.map(h => h.data));
        }
        // Re-render the paragraph to restore highlights
        if (state.currentArticle) {
            renderArticlePart(state.currentPartIndex);
        }
        // Clear removed highlights
        removedHighlights = [];
    }
    catch (error) {
        console.error('Error restoring highlights:', error);
    }
}
/**
 * Exit edit mode
 */
function exitEditMode() {
    if (!editingParagraph)
        return;
    // Remove contenteditable
    editingParagraph.contentEditable = 'false';
    editingParagraph.classList.remove('editing');
    // Show copy button
    const copyBtn = editingParagraph.querySelector('.paragraph-copy-btn');
    if (copyBtn) {
        copyBtn.style.display = '';
    }
    // Restore paragraph context menu handler
    const paragraphContextMenuHandler = editingParagraph
        ._paragraphContextMenuHandler;
    if (paragraphContextMenuHandler) {
        editingParagraph.addEventListener('contextmenu', paragraphContextMenuHandler);
    }
    // Remove keyboard handler
    const keyHandler = editingParagraph._editKeyHandler;
    if (keyHandler) {
        editingParagraph.removeEventListener('keydown', keyHandler);
        delete editingParagraph._editKeyHandler;
    }
    // Remove edit mode context menu handler
    const editContextMenuHandler = editingParagraph
        ._editContextMenuHandler;
    if (editContextMenuHandler) {
        editingParagraph.removeEventListener('contextmenu', editContextMenuHandler);
        delete editingParagraph._editContextMenuHandler;
    }
    // Remove click outside handler
    const clickOutsideHandler = editingParagraph
        ._editClickOutsideHandler;
    if (clickOutsideHandler) {
        document.removeEventListener('click', clickOutsideHandler);
        delete editingParagraph._editClickOutsideHandler;
    }
    // Remove input handler
    const inputHandler = editingParagraph._editInputHandler;
    if (inputHandler) {
        editingParagraph.removeEventListener('input', inputHandler);
        delete editingParagraph._editInputHandler;
    }
    // Hide edit context menu
    hideEditContextMenu();
    // Hide toolbar
    const toolbar = document.querySelector('.edit-toolbar');
    if (toolbar) {
        toolbar.classList.add('hidden');
    }
    // Re-enable UI controls
    enableUIControls();
    // Resume highlight manager to re-enable highlighting
    resumeHighlightManager();
    // Clear state
    editingParagraph = null;
    originalParagraphText = '';
    editModeSelectionRange = null;
}
/**
 * Disable UI controls during edit mode
 */
function disableUIControls() {
    elements.prevButton.disabled = true;
    elements.nextButton.disabled = true;
    elements.tabButtons.forEach(btn => (btn.disabled = true));
    // Disable highlight mode buttons
    const highlightModeButtons = document.querySelectorAll('.highlight-mode-btn');
    highlightModeButtons.forEach(btn => {
        btn.disabled = true;
        btn.title =
            'Highlight modes are disabled while editing a paragraph';
    });
}
/**
 * Enable UI controls after edit mode
 */
function enableUIControls() {
    updateNavigation(); // This will set correct disabled states
    elements.tabButtons.forEach(btn => (btn.disabled = false));
    // Re-enable highlight mode buttons and restore original tooltips
    const highlightModeButtons = document.querySelectorAll('.highlight-mode-btn');
    highlightModeButtons.forEach(btn => {
        btn.disabled = false;
        const mode = btn.dataset.highlightMode;
        // Restore original tooltips
        if (mode === 'vocabulary') {
            btn.title = 'Switch to Vocabulary mode (Press 1)';
        }
        else if (mode === 'sentence') {
            btn.title = 'Switch to Sentence mode (Press 2)';
        }
        else if (mode === 'none') {
            btn.title = 'Disable highlighting (Press 0, 3, or Esc)';
        }
    });
}
/**
 * Update navigation controls
 */
function updateNavigation() {
    if (!state.currentArticle)
        return;
    const totalParts = state.currentArticle.parts.length;
    const currentPart = state.currentPartIndex + 1;
    elements.currentPartSpan.textContent = currentPart.toString();
    elements.totalPartsSpan.textContent = totalParts.toString();
    // Update button states
    elements.prevButton.disabled = state.currentPartIndex === 0;
    elements.nextButton.disabled = state.currentPartIndex === totalParts - 1;
}
/**
 * Persist current navigation state to session storage
 */
async function persistNavigationState() {
    if (!state.currentArticle)
        return;
    try {
        const key = `article_nav_${state.currentArticle.id}`;
        await chrome.storage.session.set({
            [key]: {
                partIndex: state.currentPartIndex,
                timestamp: Date.now(),
            },
        });
    }
    catch (error) {
        console.error('Failed to persist navigation state:', error);
    }
}
/**
 * Restore navigation state from session storage
 */
async function restoreNavigationState(articleId) {
    try {
        const key = `article_nav_${articleId}`;
        const data = await chrome.storage.session.get(key);
        const navState = data[key];
        if (navState && typeof navState.partIndex === 'number') {
            // Check if the saved state is recent (within last hour)
            const ONE_HOUR = 60 * 60 * 1000;
            if (Date.now() - navState.timestamp < ONE_HOUR) {
                return navState.partIndex;
            }
        }
    }
    catch (error) {
        console.error('Failed to restore navigation state:', error);
    }
    // Default to first part
    return 0;
}
// ============================================================================
// Vocabulary and Sentence Cards
// ============================================================================
/**
 * Load vocabulary and sentences for article
 */
async function loadVocabularyAndSentences(articleId) {
    try {
        // Get all vocabulary items
        const vocabData = await chrome.storage.local.get('vocabulary');
        const allVocab = vocabData.vocabulary || {};
        state.vocabularyItems = Object.values(allVocab).filter(v => v.articleId === articleId);
        // Get all sentence items
        const sentenceData = await chrome.storage.local.get('sentences');
        const allSentences = sentenceData.sentences || {};
        state.sentenceItems = Object.values(allSentences).filter(s => s.articleId === articleId);
    }
    catch (error) {
        console.error('Error loading vocabulary and sentences:', error);
    }
}
/**
 * Render vocabulary cards for current part
 */
function renderPartVocabularyCards(part) {
    const partVocab = state.vocabularyItems.filter(v => v.partId === part.id);
    if (partVocab.length === 0) {
        const totalParts = state.currentArticle?.parts.length || 1;
        const currentPartNum = state.currentPartIndex + 1;
        elements.vocabularyCardsSection.innerHTML = `
      <div class="empty-state">
        <p class="text-secondary">No vocabulary items in this part yet.</p>
        <p class="text-hint">Highlight words in the text above to add them as vocabulary.</p>
        ${totalParts > 1 ? `<p class="text-hint-small">Part ${currentPartNum} of ${totalParts}</p>` : ''}
      </div>
    `;
        return;
    }
    elements.vocabularyCardsSection.innerHTML = partVocab
        .map(vocab => createVocabularyCardHTML(vocab))
        .join('');
    // Add event listeners to cards
    partVocab.forEach(vocab => {
        const card = document.querySelector(`[data-vocab-id="${vocab.id}"]`);
        if (card) {
            card.addEventListener('click', () => toggleCardCollapse(vocab.id, 'vocab'));
            // Original language speaker
            const pronounceBtn = card.querySelector('.pronounce-btn');
            const wordTextElement = card.querySelector('.card-word-text');
            if (pronounceBtn && wordTextElement) {
                pronounceBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    void handlePronounceClick(wordTextElement, vocab.word, state.currentArticle?.originalLanguage);
                });
            }
            // Translation language speaker
            const pronounceBtnTranslation = card.querySelector('.pronounce-btn-translation');
            const translationTextElement = card.querySelector('.card-translation-text');
            if (pronounceBtnTranslation && translationTextElement) {
                pronounceBtnTranslation.addEventListener('click', e => {
                    e.stopPropagation();
                    void handlePronounceClick(translationTextElement, vocab.translation, state.targetLanguage);
                });
            }
            // Add context menu listener
            card.addEventListener('contextmenu', e => {
                e.preventDefault();
                showCardContextMenu(card, vocab.id, 'vocabulary', e);
            });
        }
    });
}
/**
 * Create vocabulary card HTML
 */
function createVocabularyCardHTML(vocab) {
    return `
    <div class="vocab-card collapsed" data-vocab-id="${vocab.id}">
      <div class="card-header">
        <span class="card-word"><span class="card-word-text">${escapeHtml(vocab.word)}</span></span>
        <div class="card-actions">
          <button class="card-action-btn pronounce-btn" data-lang="original" title="Pronounce original">🔊</button>
        </div>
      </div>
      <div class="card-translation">
        <span class="card-translation-text">${escapeHtml(vocab.translation)}</span>
        <button class="card-action-btn pronounce-btn-translation" data-lang="translation" title="Pronounce translation">🔊</button>
      </div>
      <div class="card-details">
        <div class="card-context">"${escapeHtml(vocab.context)}"</div>
        ${vocab.exampleSentences.length > 0
        ? `
          <div class="card-examples">
            <div class="card-examples-title">Example sentences:</div>
            ${vocab.exampleSentences.map(ex => `<div class="card-example">• ${escapeHtml(ex)}</div>`).join('')}
          </div>
        `
        : ''}
      </div>
    </div>
  `;
}
/**
 * Render sentence cards for current part
 */
function renderPartSentenceCards(part) {
    const partSentences = state.sentenceItems.filter(s => s.partId === part.id);
    if (partSentences.length === 0) {
        const totalParts = state.currentArticle?.parts.length || 1;
        const currentPartNum = state.currentPartIndex + 1;
        elements.sentenceCardsSection.innerHTML = `
      <div class="empty-state">
        <p class="text-secondary">No sentences in this part yet.</p>
        <p class="text-hint">Highlight sentences in the text above to add them.</p>
        ${totalParts > 1 ? `<p class="text-hint-small">Part ${currentPartNum} of ${totalParts}</p>` : ''}
      </div>
    `;
        return;
    }
    elements.sentenceCardsSection.innerHTML = partSentences
        .map(sentence => createSentenceCardHTML(sentence))
        .join('');
    // Add event listeners to cards
    partSentences.forEach(sentence => {
        const card = document.querySelector(`[data-sentence-id="${sentence.id}"]`);
        if (card) {
            card.addEventListener('click', () => toggleCardCollapse(sentence.id, 'sentence'));
            // Original language speaker
            const pronounceBtn = card.querySelector('.pronounce-btn');
            const sentenceTextElement = card.querySelector('.card-sentence-text');
            if (pronounceBtn && sentenceTextElement) {
                pronounceBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    void handlePronounceClick(sentenceTextElement, sentence.content, state.currentArticle?.originalLanguage);
                });
            }
            // Translation language speaker
            const pronounceBtnTranslation = card.querySelector('.pronounce-btn-translation');
            const translationTextElement = card.querySelector('.card-translation-text');
            if (pronounceBtnTranslation && translationTextElement) {
                pronounceBtnTranslation.addEventListener('click', e => {
                    e.stopPropagation();
                    void handlePronounceClick(translationTextElement, sentence.translation, state.targetLanguage);
                });
            }
            // Add context menu listener
            card.addEventListener('contextmenu', e => {
                e.preventDefault();
                showCardContextMenu(card, sentence.id, 'sentence', e);
            });
        }
    });
}
/**
 * Create sentence card HTML
 */
function createSentenceCardHTML(sentence) {
    return `
    <div class="sentence-card collapsed" data-sentence-id="${sentence.id}">
      <div class="card-header">
        <span class="card-sentence"><span class="card-sentence-text">${escapeHtml(sentence.content)}</span></span>
        <div class="card-actions">
          <button class="card-action-btn pronounce-btn" data-lang="original" title="Pronounce original">🔊</button>
        </div>
      </div>
      <div class="card-details">
        <div class="card-translation">
          <span class="card-translation-text">${escapeHtml(sentence.translation)}</span>
          <button class="card-action-btn pronounce-btn-translation" data-lang="translation" title="Pronounce translation">🔊</button>
        </div>
      </div>
    </div>
  `;
}
/**
 * Toggle card collapse state
 */
function toggleCardCollapse(id, type) {
    const card = document.querySelector(`[data-${type === 'vocab' ? 'vocab' : 'sentence'}-id="${id}"]`);
    if (card) {
        card.classList.toggle('collapsed');
    }
}
// ============================================================================
// Mode Switching
// ============================================================================
/**
 * Switch learning mode
 */
function switchMode(mode) {
    state.currentMode = mode;
    // Update tab buttons
    elements.tabButtons.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
        else {
            btn.classList.remove('active');
        }
    });
    // Update content visibility
    elements.modeContents.forEach(content => {
        if (content.dataset.mode === mode) {
            content.classList.add('active');
        }
        else {
            content.classList.remove('active');
        }
    });
    // Render mode-specific content
    if (mode === 'vocabulary') {
        renderVocabularyLearningMode();
    }
    else if (mode === 'sentences') {
        renderSentenceLearningMode();
    }
}
/**
 * Render vocabulary learning mode
 */
function renderVocabularyLearningMode() {
    if (state.vocabularyItems.length === 0) {
        elements.vocabularyGrid.innerHTML =
            '<p class="text-center text-secondary">No vocabulary items yet. Go to Reading mode and highlight words.</p>';
        return;
    }
    elements.vocabularyGrid.innerHTML = state.vocabularyItems
        .map(vocab => createVocabularyLearningCardHTML(vocab))
        .join('');
    // Add event listeners
    state.vocabularyItems.forEach(vocab => {
        const card = document.querySelector(`[data-vocab-learning-id="${vocab.id}"]`);
        if (card) {
            // Add click listener to the word (original language)
            const wordElement = card.querySelector('.vocab-learning-word');
            if (wordElement) {
                wordElement.addEventListener('click', e => {
                    e.stopPropagation();
                    void handlePronounceClick(wordElement, vocab.word, state.currentArticle?.originalLanguage);
                });
            }
            // Add click listener to the translation (target language)
            const translationElement = card.querySelector('.vocab-learning-translation');
            if (translationElement) {
                translationElement.addEventListener('click', e => {
                    e.stopPropagation();
                    void handlePronounceClick(translationElement, vocab.translation, state.targetLanguage);
                });
            }
            // Fallback: clicking on card (but not on word or translation) pronounces the word
            card.addEventListener('click', () => {
                void handlePronounceClick(card, vocab.word, state.currentArticle?.originalLanguage);
            });
        }
    });
}
/**
 * Create vocabulary learning card HTML
 */
function createVocabularyLearningCardHTML(vocab) {
    const showWord = state.displayMode === 'both' || state.displayMode === 'learning_only';
    const showTranslation = state.displayMode === 'both' || state.displayMode === 'native_only';
    const hideTranslation = state.displayMode === 'learning_only';
    return `
    <div class="vocab-learning-card" data-vocab-learning-id="${vocab.id}">
      ${showWord ? `<div class="vocab-learning-word clickable-text" title="Click to pronounce">${escapeHtml(vocab.word)}</div>` : ''}
      ${showTranslation ? `<div class="vocab-learning-translation clickable-text ${hideTranslation ? 'hidden-lang' : ''}" title="Click to pronounce translation">${escapeHtml(vocab.translation)}</div>` : ''}
    </div>
  `;
}
/**
 * Render sentence learning mode
 */
function renderSentenceLearningMode() {
    if (state.sentenceItems.length === 0) {
        elements.sentenceList.innerHTML =
            '<p class="text-center text-secondary">No sentences yet. Go to Reading mode and highlight sentences.</p>';
        return;
    }
    elements.sentenceList.innerHTML = state.sentenceItems
        .map(sentence => createSentenceLearningCardHTML(sentence))
        .join('');
    // Add event listeners
    state.sentenceItems.forEach(sentence => {
        const card = document.querySelector(`[data-sentence-learning-id="${sentence.id}"]`);
        if (card) {
            // Add click listener to the sentence content (original language)
            const contentElement = card.querySelector('.sentence-learning-content');
            if (contentElement) {
                contentElement.addEventListener('click', e => {
                    e.stopPropagation();
                    void handlePronounceClick(contentElement, sentence.content, state.currentArticle?.originalLanguage);
                });
            }
            // Add click listener to the translation (target language)
            const translationElement = card.querySelector('.sentence-learning-translation');
            if (translationElement) {
                translationElement.addEventListener('click', e => {
                    e.stopPropagation();
                    void handlePronounceClick(translationElement, sentence.translation, state.targetLanguage);
                });
            }
            // Fallback: clicking on card (but not on content or translation) pronounces the sentence
            card.addEventListener('click', () => {
                void handlePronounceClick(card, sentence.content, state.currentArticle?.originalLanguage);
            });
        }
    });
}
/**
 * Create sentence learning card HTML
 */
function createSentenceLearningCardHTML(sentence) {
    return `
    <div class="sentence-learning-card" data-sentence-learning-id="${sentence.id}">
      <div class="sentence-learning-content clickable-text" title="Click to pronounce">${escapeHtml(sentence.content)}</div>
      <div class="sentence-learning-translation clickable-text" title="Click to pronounce translation">${escapeHtml(sentence.translation)}</div>
    </div>
  `;
}
// ============================================================================
// Event Listeners
// ============================================================================
function setupEventListeners() {
    // Mode tab switching
    elements.tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            switchMode(mode);
        });
    });
    // Navigation buttons
    elements.prevButton.addEventListener('click', () => {
        if (state.currentPartIndex > 0) {
            renderArticlePart(state.currentPartIndex - 1);
        }
    });
    elements.nextButton.addEventListener('click', () => {
        if (state.currentArticle &&
            state.currentPartIndex < state.currentArticle.parts.length - 1) {
            renderArticlePart(state.currentPartIndex + 1);
        }
    });
    // Display mode options
    elements.displayOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            const displayMode = btn.dataset.display;
            state.displayMode = displayMode;
            // Update active state
            elements.displayOptions.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Re-render vocabulary learning mode
            renderVocabularyLearningMode();
        });
    });
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    // Close context menu on click outside
    document.addEventListener('click', e => {
        const target = e.target;
        // Don't hide if clicking inside the context menu
        if (!elements.contextMenu.contains(target)) {
            elements.contextMenu.classList.add('hidden');
        }
    });
    // Close card context menu when clicking on cards (but not on action buttons)
    document.addEventListener('click', e => {
        const target = e.target;
        // Check if clicking on a card but not on action buttons
        const card = target.closest('.vocab-card, .sentence-card');
        const actionBtn = target.closest('.card-action-btn, .pronounce-btn-translation');
        if (card && !actionBtn) {
            // Hide context menu when clicking on card content
            elements.contextMenu.classList.add('hidden');
        }
    });
    // Highlight mode switching
    const highlightModeButtons = document.querySelectorAll('.highlight-mode-btn');
    highlightModeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.highlightMode;
            switchHighlightMode(mode);
        });
    });
    // Listen for highlight events
    document.addEventListener('vocabulary-added', handleVocabularyAdded);
    document.addEventListener('sentence-added', handleSentenceAdded);
    document.addEventListener('vocabulary-removed', handleVocabularyRemoved);
    document.addEventListener('sentence-removed', handleSentenceRemoved);
    // Context menu actions
    const contextMenuItems = document.querySelectorAll('.context-menu-item');
    contextMenuItems.forEach(item => {
        item.addEventListener('click', e => {
            e.stopPropagation(); // Prevent document click from hiding menu prematurely
            void handleContextMenuAction(e);
        });
    });
    // Edit context menu actions
    const editContextMenuItems = document.querySelectorAll('.edit-context-menu .context-menu-item');
    console.log('🔧 Setting up edit context menu listeners:', {
        itemCount: editContextMenuItems.length,
        items: Array.from(editContextMenuItems).map(item => ({
            action: item.dataset.action,
            text: item.textContent?.trim(),
        })),
    });
    editContextMenuItems.forEach(item => {
        item.addEventListener('click', e => {
            e.stopPropagation();
            const action = item.dataset.action;
            console.log('🖱️ Edit context menu item clicked:', action);
            if (action === 'copy-selection') {
                void handleCopySelection();
            }
            else if (action === 'delete-selection') {
                handleDeleteSelection();
            }
        });
    });
}
/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(event) {
    // Ignore if typing in input or contenteditable
    if (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target.contentEditable === 'true') {
        return;
    }
    // Ignore navigation and mode shortcuts if in edit mode
    const isEditMode = editingParagraph !== null;
    switch (event.key) {
        case 'ArrowLeft':
        case 'd':
        case 'D':
            if (isEditMode)
                return; // Ignore during edit mode
            event.preventDefault();
            if (state.currentPartIndex > 0) {
                renderArticlePart(state.currentPartIndex - 1);
            }
            break;
        case 'ArrowRight':
        case 'f':
        case 'F':
            if (isEditMode)
                return; // Ignore during edit mode
            event.preventDefault();
            if (state.currentArticle &&
                state.currentPartIndex < state.currentArticle.parts.length - 1) {
                renderArticlePart(state.currentPartIndex + 1);
            }
            break;
        case 'v':
            if (isEditMode)
                return; // Ignore during edit mode
            event.preventDefault();
            switchMode('vocabulary');
            break;
        case 's':
            if (isEditMode)
                return; // Ignore during edit mode
            event.preventDefault();
            switchMode('sentences');
            break;
        case 'r':
            if (isEditMode)
                return; // Ignore during edit mode
            event.preventDefault();
            switchMode('reading');
            break;
        case 'Escape':
            if (isEditMode)
                return; // Let edit mode handler handle Escape
            event.preventDefault();
            switchHighlightMode('none');
            break;
        case '1':
            if (isEditMode)
                return; // Ignore during edit mode
            event.preventDefault();
            switchHighlightMode('vocabulary');
            break;
        case '2':
            if (isEditMode)
                return; // Ignore during edit mode
            event.preventDefault();
            switchHighlightMode('sentence');
            break;
        case '0':
        case '3':
            if (isEditMode)
                return; // Ignore during edit mode
            event.preventDefault();
            switchHighlightMode('none');
            break;
    }
}
// ============================================================================
// Highlight Mode Switching
// ============================================================================
/**
 * Switch highlight mode and update UI
 */
function switchHighlightMode(mode) {
    // Update state
    state.highlightMode = mode;
    // Update highlight manager
    setHighlightMode(mode);
    // Update button active states
    const highlightModeButtons = document.querySelectorAll('.highlight-mode-btn');
    highlightModeButtons.forEach(btn => {
        const btnMode = btn.dataset.highlightMode;
        if (btnMode === mode) {
            btn.classList.add('active');
        }
        else {
            btn.classList.remove('active');
        }
    });
    // Show brief feedback
    const modeNames = {
        vocabulary: 'Vocabulary',
        sentence: 'Sentences',
        none: 'None',
    };
    showTooltip(`Highlight mode: ${modeNames[mode]}`);
}
// ============================================================================
// Text-to-Speech
// ============================================================================
/**
 * Handle pronounce button click with visual feedback
 * Delegates to shared TTS handler
 */
async function handlePronounceClick(button, text, language) {
    await pronounceText(button, text, language);
}
/**
 * Show tooltip message
 */
function showTooltip(message) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tts-tooltip';
    tooltip.textContent = message;
    tooltip.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease-out;
  `;
    document.body.appendChild(tooltip);
    setTimeout(() => {
        tooltip.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => tooltip.remove(), 300);
    }, 3000);
}
// ============================================================================
// Loading and Error States
// ============================================================================
function showLoading(message) {
    elements.loadingText.textContent = message;
    elements.loadingOverlay.classList.remove('hidden');
}
function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}
function showError(message) {
    hideLoading();
    alert(message); // TODO: Replace with better error UI
}
// ============================================================================
// Highlight Event Handlers
// ============================================================================
/**
 * Handle vocabulary added event
 */
function handleVocabularyAdded(event) {
    const customEvent = event;
    const vocab = customEvent.detail;
    // Add to state
    state.vocabularyItems.push(vocab);
    // Re-render vocabulary cards for current part
    if (state.currentArticle) {
        const part = state.currentArticle.parts[state.currentPartIndex];
        if (part) {
            renderPartVocabularyCards(part);
        }
    }
}
/**
 * Handle sentence added event
 */
function handleSentenceAdded(event) {
    const customEvent = event;
    const sentence = customEvent.detail;
    // Add to state
    state.sentenceItems.push(sentence);
    // Re-render sentence cards for current part
    if (state.currentArticle) {
        const part = state.currentArticle.parts[state.currentPartIndex];
        if (part) {
            renderPartSentenceCards(part);
        }
    }
}
/**
 * Handle vocabulary removed event
 */
function handleVocabularyRemoved(event) {
    const customEvent = event;
    const { id } = customEvent.detail;
    // Remove from state
    state.vocabularyItems = state.vocabularyItems.filter(v => v.id !== id);
    // Re-render vocabulary cards for current part
    if (state.currentArticle) {
        const part = state.currentArticle.parts[state.currentPartIndex];
        if (part) {
            renderPartVocabularyCards(part);
        }
    }
}
/**
 * Handle sentence removed event
 */
function handleSentenceRemoved(event) {
    const customEvent = event;
    const { id } = customEvent.detail;
    // Remove from state
    state.sentenceItems = state.sentenceItems.filter(s => s.id !== id);
    // Re-render sentence cards for current part
    if (state.currentArticle) {
        const part = state.currentArticle.parts[state.currentPartIndex];
        if (part) {
            renderPartSentenceCards(part);
        }
    }
}
/**
 * Handle context menu actions
 */
async function handleContextMenuAction(event) {
    const target = event.target;
    const action = target.dataset.action;
    const contextMenu = document.querySelector('.context-menu');
    if (!contextMenu)
        return;
    const itemId = contextMenu.dataset.itemId;
    const itemType = contextMenu.dataset.itemType;
    // Handle paragraph context menu
    if (itemType === 'paragraph') {
        if (action === 'copy') {
            const paragraph = contextMenu._paragraphElement;
            if (paragraph) {
                try {
                    // Get paragraph text (excluding the copy button)
                    const copyButton = paragraph.querySelector('.paragraph-copy-btn');
                    const textToCopy = Array.from(paragraph.childNodes)
                        .filter(node => node !== copyButton)
                        .map(node => node.textContent || '')
                        .join('')
                        .trim();
                    // Copy to clipboard
                    await navigator.clipboard.writeText(textToCopy);
                    // Show tooltip
                    showTooltip('Paragraph copied!');
                }
                catch (error) {
                    console.error('Failed to copy paragraph:', error);
                    showTooltip('Failed to copy paragraph');
                }
            }
        }
        else if (action === 'edit') {
            const paragraph = contextMenu._paragraphElement;
            if (paragraph) {
                await handleParagraphEdit(paragraph);
            }
        }
        contextMenu.classList.add('hidden');
        return;
    }
    // Handle card context menu
    if (itemType === 'card') {
        const cardType = contextMenu.dataset.cardType;
        if (action === 'remove') {
            // Remove the card
            if (itemId && cardType) {
                const { removeHighlight } = await import('./highlight-manager.js');
                await removeHighlight(itemId, cardType);
                // Update state and re-render
                if (cardType === 'vocabulary') {
                    state.vocabularyItems = state.vocabularyItems.filter(v => v.id !== itemId);
                    if (state.currentArticle) {
                        const part = state.currentArticle.parts[state.currentPartIndex];
                        if (part) {
                            renderPartVocabularyCards(part);
                        }
                    }
                }
                else if (cardType === 'sentence') {
                    state.sentenceItems = state.sentenceItems.filter(s => s.id !== itemId);
                    if (state.currentArticle) {
                        const part = state.currentArticle.parts[state.currentPartIndex];
                        if (part) {
                            renderPartSentenceCards(part);
                        }
                    }
                }
                // Show confirmation tooltip
                showTooltip(`${cardType === 'vocabulary' ? 'Vocabulary' : 'Sentence'} removed`);
            }
        }
        else if (action === 'edit') {
            if (itemId && cardType) {
                await showCardEditDialog(itemId, cardType);
            }
        }
        contextMenu.classList.add('hidden');
        return;
    }
    // Handle article header context menu
    if (itemType === 'article-header') {
        if (action === 'edit') {
            showArticleHeaderEditDialog();
        }
        contextMenu.classList.add('hidden');
        return;
    }
    // Handle selection context menu (None mode)
    if (itemType === 'selection') {
        if (action === 'add-vocabulary' ||
            action === 'add-sentence' ||
            action === 'pronounce') {
            const { handleSelectionContextMenuAction } = await import('./highlight-manager.js');
            await handleSelectionContextMenuAction(action);
        }
        contextMenu.classList.add('hidden');
        return;
    }
    // Handle existing highlight context menu
    if (!itemId || !itemType)
        return;
    if (action === 'remove') {
        const { removeHighlight } = await import('./highlight-manager.js');
        await removeHighlight(itemId, itemType);
        // Direct state update and re-render as fallback
        if (itemType === 'vocabulary') {
            state.vocabularyItems = state.vocabularyItems.filter(v => v.id !== itemId);
            if (state.currentArticle) {
                const part = state.currentArticle.parts[state.currentPartIndex];
                if (part) {
                    renderPartVocabularyCards(part);
                }
            }
        }
        else if (itemType === 'sentence') {
            state.sentenceItems = state.sentenceItems.filter(s => s.id !== itemId);
            if (state.currentArticle) {
                const part = state.currentArticle.parts[state.currentPartIndex];
                if (part) {
                    renderPartSentenceCards(part);
                }
            }
        }
    }
    else if (action === 'change-to-sentence') {
        // Convert vocabulary to sentence
        const { convertVocabularyToSentence } = await import('./highlight-manager.js');
        await convertVocabularyToSentence(itemId);
        // Reload vocabulary and sentences to reflect changes
        if (state.currentArticle) {
            await loadVocabularyAndSentences(state.currentArticle.id);
            const part = state.currentArticle.parts[state.currentPartIndex];
            if (part) {
                renderPartVocabularyCards(part);
                renderPartSentenceCards(part);
            }
        }
    }
    else if (action === 'change-to-vocabulary') {
        // Convert sentence to vocabulary
        const { convertSentenceToVocabulary } = await import('./highlight-manager.js');
        await convertSentenceToVocabulary(itemId);
        // Reload vocabulary and sentences to reflect changes
        if (state.currentArticle) {
            await loadVocabularyAndSentences(state.currentArticle.id);
            const part = state.currentArticle.parts[state.currentPartIndex];
            if (part) {
                renderPartVocabularyCards(part);
                renderPartSentenceCards(part);
            }
        }
    }
    else if (action === 'pronounce') {
        // Get the highlight element and pronounce its text
        const highlightElement = document.querySelector(`[data-highlight-id="${itemId}"]`);
        if (highlightElement) {
            const text = highlightElement.textContent || '';
            await handlePronounceClick(highlightElement, text, state.currentArticle?.originalLanguage);
        }
    }
    // Hide context menu
    contextMenu.classList.add('hidden');
}
// ============================================================================
// Memory Monitoring
// ============================================================================
function initializeMemoryMonitoring() {
    const memoryManager = getMemoryManager();
    // Add memory usage callback
    const unsubscribe = memoryManager.onMemoryUsageChange((usage) => {
        updateMemoryIndicator(usage);
        // Show warning if memory usage is high (absolute threshold: 100MB)
        if (usage.memory.used > 100 * 1024 * 1024) {
            showMemoryWarning(usage);
        }
    });
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        unsubscribe();
    });
}
function updateMemoryIndicator(usage) {
    // Create or update memory indicator in the UI
    let indicator = document.getElementById('memory-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'memory-indicator';
        indicator.className = 'memory-indicator';
        document.body.appendChild(indicator);
    }
    const memoryMB = (usage.memory.used / 1024 / 1024).toFixed(1);
    const storagePercent = usage.storage.percentage.toFixed(1);
    indicator.innerHTML = `
    <div class="memory-stats">
      <span>Memory: ${memoryMB}MB</span>
      <span>Storage: ${storagePercent}%</span>
      <span>Tabs: ${usage.activeTabs}</span>
    </div>
  `;
    // Add warning class if usage is high (100MB for memory, 80% for storage)
    if (usage.memory.used > 100 * 1024 * 1024 || usage.storage.percentage > 80) {
        indicator.classList.add('warning');
    }
    else {
        indicator.classList.remove('warning');
    }
}
function showMemoryWarning(_usage) {
    // Show a non-intrusive warning about high memory usage
    const warning = document.createElement('div');
    warning.className = 'memory-warning';
    warning.innerHTML = `
    <div class="warning-content">
      <span>⚠️ High memory usage detected</span>
      <button class="cleanup-btn">Clean up</button>
      <button class="dismiss-btn">×</button>
    </div>
  `;
    // Add event listeners
    const cleanupBtn = warning.querySelector('.cleanup-btn');
    const dismissBtn = warning.querySelector('.dismiss-btn');
    cleanupBtn?.addEventListener('click', async () => {
        const memoryManager = getMemoryManager();
        await memoryManager.forceCleanup();
        warning.remove();
    });
    dismissBtn?.addEventListener('click', () => {
        warning.remove();
    });
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        warning.remove();
    }, 10000);
    document.body.appendChild(warning);
}
// ============================================================================
// Language Selector
// ============================================================================
/**
 * Initialize language selector
 */
async function initializeLanguageSelector() {
    // Load saved target language
    const data = await chrome.storage.local.get('targetLanguage');
    state.targetLanguage = data.targetLanguage || 'en';
    // Set initial value
    const selectedLang = LANGUAGES.find(l => l.code === state.targetLanguage);
    if (selectedLang && elements.languageInput) {
        elements.languageInput.value = selectedLang.name;
    }
    // Populate language options
    populateLanguageOptions();
    // Setup event listeners
    if (elements.languageInput) {
        elements.languageInput.addEventListener('focus', () => {
            showLanguageDropdown();
        });
        elements.languageInput.addEventListener('input', () => {
            filterLanguageOptions(elements.languageInput.value);
        });
        elements.languageInput.addEventListener('blur', () => {
            // Delay to allow click on option
            setTimeout(() => {
                hideLanguageDropdown();
            }, 200);
        });
    }
}
/**
 * Populate language options
 */
function populateLanguageOptions() {
    if (!elements.languageOptions)
        return;
    elements.languageOptions.innerHTML = LANGUAGES.map(lang => {
        const isSelected = lang.code === state.targetLanguage;
        return `
    <div class="language-option ${isSelected ? 'selected' : ''}" data-code="${lang.code}">
      <span class="language-option-name">${escapeHtml(lang.name)}</span>
      ${isSelected ? '<span class="language-option-checkmark">✓</span>' : ''}
    </div>
  `;
    }).join('');
    // Add click listeners
    const options = elements.languageOptions.querySelectorAll('.language-option');
    options.forEach(option => {
        option.addEventListener('click', () => {
            const code = option.dataset.code;
            if (code) {
                void selectLanguage(code);
            }
        });
    });
}
/**
 * Show language dropdown
 */
function showLanguageDropdown() {
    if (elements.languageDropdown) {
        elements.languageDropdown.classList.add('active');
    }
    // Clear input to show all languages when dropdown opens
    if (elements.languageInput) {
        elements.languageInput.value = '';
    }
    // Show all languages initially
    filterLanguageOptions('');
}
/**
 * Hide language dropdown
 */
function hideLanguageDropdown() {
    if (elements.languageDropdown) {
        elements.languageDropdown.classList.remove('active');
    }
}
/**
 * Filter language options based on search
 */
function filterLanguageOptions(search) {
    if (!elements.languageOptions)
        return;
    const searchLower = search.toLowerCase();
    const options = elements.languageOptions.querySelectorAll('.language-option');
    options.forEach(option => {
        const nameElement = option.querySelector('.language-option-name');
        const name = nameElement?.textContent?.toLowerCase() || '';
        if (name.includes(searchLower)) {
            option.style.display = 'flex';
        }
        else {
            option.style.display = 'none';
        }
    });
}
/**
 * Select a language
 */
async function selectLanguage(code) {
    const lang = LANGUAGES.find(l => l.code === code);
    if (!lang)
        return;
    const previousLanguage = state.targetLanguage;
    // Update state
    state.targetLanguage = code;
    // Update input to show selected language name
    if (elements.languageInput) {
        elements.languageInput.value = lang.name;
    }
    // Save to storage
    await chrome.storage.local.set({ targetLanguage: code });
    // Repopulate options to update checkmark
    populateLanguageOptions();
    // Hide dropdown
    hideLanguageDropdown();
    // Show confirmation with option to re-translate
    if (previousLanguage !== code &&
        (state.vocabularyItems.length > 0 || state.sentenceItems.length > 0)) {
        showLanguageChangeConfirmation(lang.name);
    }
    else {
        showTooltip(`Translation language set to ${lang.name}`);
    }
}
/**
 * Show language change confirmation with re-translate option
 */
function showLanguageChangeConfirmation(languageName) {
    const confirmation = document.createElement('div');
    confirmation.className = 'language-change-confirmation';
    confirmation.innerHTML = `
    <div class="confirmation-content">
      <p>Translation language changed to <strong>${languageName}</strong></p>
      <p>Would you like to re-translate existing vocabulary and sentences?</p>
      <div class="confirmation-actions">
        <button class="btn-retranslate">Re-translate</button>
        <button class="btn-dismiss">Not now</button>
      </div>
    </div>
  `;
    document.body.appendChild(confirmation);
    // Add event listeners
    const retranslateBtn = confirmation.querySelector('.btn-retranslate');
    const dismissBtn = confirmation.querySelector('.btn-dismiss');
    retranslateBtn?.addEventListener('click', async () => {
        confirmation.remove();
        await retranslateAll();
    });
    dismissBtn?.addEventListener('click', () => {
        confirmation.remove();
        showTooltip(`Translation language set to ${languageName}`);
    });
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        if (document.body.contains(confirmation)) {
            confirmation.remove();
            showTooltip(`Translation language set to ${languageName}`);
        }
    }, 10000);
}
/**
 * Re-translate all vocabulary and sentence items to the new target language
 */
async function retranslateAll() {
    const totalItems = state.vocabularyItems.length + state.sentenceItems.length;
    if (totalItems === 0)
        return;
    showLoading(`Re-translating ${totalItems} items...`);
    try {
        let vocabSuccess = 0;
        let vocabFail = 0;
        let sentenceSuccess = 0;
        let sentenceFail = 0;
        // Re-translate vocabulary items
        if (state.vocabularyItems.length > 0) {
            const vocabResult = await retranslateVocabularyItems();
            vocabSuccess = vocabResult.successCount;
            vocabFail = vocabResult.failCount;
        }
        // Re-translate sentence items
        if (state.sentenceItems.length > 0) {
            const sentenceResult = await retranslateSentenceItems();
            sentenceSuccess = sentenceResult.successCount;
            sentenceFail = sentenceResult.failCount;
        }
        // Re-render current part
        if (state.currentArticle) {
            const part = state.currentArticle.parts[state.currentPartIndex];
            if (part) {
                renderPartVocabularyCards(part);
                renderPartSentenceCards(part);
            }
        }
        // Re-render learning modes if active
        if (state.currentMode === 'vocabulary') {
            renderVocabularyLearningMode();
        }
        else if (state.currentMode === 'sentences') {
            renderSentenceLearningMode();
        }
        hideLoading();
        // Show result
        const totalSuccess = vocabSuccess + sentenceSuccess;
        const totalFail = vocabFail + sentenceFail;
        if (totalFail === 0) {
            showTooltip(`✓ Successfully re-translated ${totalSuccess} items`);
        }
        else {
            showTooltip(`Re-translated ${totalSuccess} items (${totalFail} failed)`);
        }
    }
    catch (error) {
        console.error('Error during re-translation:', error);
        hideLoading();
        showTooltip('Failed to re-translate items');
    }
}
/**
 * Re-translate vocabulary items to the new target language
 */
async function retranslateVocabularyItems() {
    let successCount = 0;
    let failCount = 0;
    // Re-translate each vocabulary item
    for (const vocab of state.vocabularyItems) {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'TRANSLATE_TEXT',
                payload: {
                    text: vocab.word,
                    context: vocab.context,
                    type: 'vocabulary',
                    targetLanguage: state.targetLanguage,
                    sourceLanguage: state.currentArticle?.originalLanguage,
                },
            });
            if (response.success) {
                // Update the vocabulary item with new translation
                vocab.translation = response.data.translation;
                successCount++;
            }
            else {
                failCount++;
                console.error('Failed to translate:', vocab.word, response.error);
            }
        }
        catch (error) {
            failCount++;
            console.error('Error translating:', vocab.word, error);
        }
    }
    // Save updated vocabulary to storage
    const vocabMap = {};
    state.vocabularyItems.forEach(v => {
        vocabMap[v.id] = v;
    });
    await chrome.storage.local.set({ vocabulary: vocabMap });
    return { successCount, failCount };
}
/**
 * Re-translate sentence items to the new target language
 */
async function retranslateSentenceItems() {
    let successCount = 0;
    let failCount = 0;
    // Re-translate each sentence item
    for (const sentence of state.sentenceItems) {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'TRANSLATE_TEXT',
                payload: {
                    text: sentence.content,
                    context: sentence.content,
                    type: 'sentence',
                    targetLanguage: state.targetLanguage,
                    sourceLanguage: state.currentArticle?.originalLanguage,
                },
            });
            if (response.success) {
                // Update the sentence item with new translation
                sentence.translation = response.data.translation;
                // Update translations cache if it exists
                if (sentence.translations) {
                    sentence.translations[state.targetLanguage] =
                        response.data.translation;
                }
                successCount++;
            }
            else {
                failCount++;
                console.error('Failed to translate:', sentence.content, response.error);
            }
        }
        catch (error) {
            failCount++;
            console.error('Error translating:', sentence.content, error);
        }
    }
    // Save updated sentences to storage
    const sentenceMap = {};
    state.sentenceItems.forEach(s => {
        sentenceMap[s.id] = s;
    });
    await chrome.storage.local.set({ sentences: sentenceMap });
    return { successCount, failCount };
}
// ============================================================================
// Initialize on page load
// ============================================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        void initialize();
    });
}
else {
    void initialize();
}
//# sourceMappingURL=learning-interface.js.map