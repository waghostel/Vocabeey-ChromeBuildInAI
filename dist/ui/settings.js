/**
 * Settings Interface - Configuration panel for user preferences
 * Implements Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */
import { StorageManager } from '../utils/storage-manager.js';
// ============================================================================
// State Management
// ============================================================================
let currentSettings = null;
const storageManager = new StorageManager();
// ============================================================================
// Initialization
// ============================================================================
async function initializeSettings() {
    try {
        // Load current settings
        currentSettings = await storageManager.getUserSettings();
        // Populate form fields
        if (currentSettings) {
            populateFormFields(currentSettings);
        }
        // Update storage info
        await updateStorageInfo();
        // Set up event listeners
        setupEventListeners();
    }
    catch (error) {
        console.error('Failed to initialize settings:', error);
        showToast('Failed to load settings', 'error');
    }
}
function populateFormFields(settings) {
    // Language settings
    const learningLangSelect = document.getElementById('learning-language');
    const nativeLangSelect = document.getElementById('native-language');
    if (learningLangSelect)
        learningLangSelect.value = settings.learningLanguage;
    if (nativeLangSelect)
        nativeLangSelect.value = settings.nativeLanguage;
    // Learning preferences
    const difficultySlider = document.getElementById('difficulty-slider');
    const autoHighlightCheckbox = document.getElementById('auto-highlight');
    if (difficultySlider) {
        difficultySlider.value = settings.difficultyLevel.toString();
        updateDifficultyValue(settings.difficultyLevel.toString());
    }
    if (autoHighlightCheckbox)
        autoHighlightCheckbox.checked = settings.autoHighlight;
    // API keys
    const geminiApiKeyInput = document.getElementById('gemini-api-key');
    const jinaApiKeyInput = document.getElementById('jina-api-key');
    if (geminiApiKeyInput)
        geminiApiKeyInput.value = settings.apiKeys.gemini || '';
    if (jinaApiKeyInput)
        jinaApiKeyInput.value = settings.apiKeys.jinaReader || '';
    // Appearance
    const darkModeCheckbox = document.getElementById('dark-mode');
    const fontSizeSlider = document.getElementById('font-size-slider');
    if (darkModeCheckbox)
        darkModeCheckbox.checked = settings.darkMode;
    if (fontSizeSlider) {
        fontSizeSlider.value = settings.fontSize.toString();
        updateFontSizeValue(settings.fontSize.toString());
    }
}
function setupEventListeners() {
    // Difficulty slider
    const difficultySlider = document.getElementById('difficulty-slider');
    if (difficultySlider) {
        difficultySlider.addEventListener('input', e => {
            updateDifficultyValue(e.target.value);
        });
    }
    // Font size slider
    const fontSizeSlider = document.getElementById('font-size-slider');
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', e => {
            updateFontSizeValue(e.target.value);
        });
    }
    // Import file input
    const importFileInput = document.getElementById('import-file-input');
    if (importFileInput) {
        importFileInput.addEventListener('change', handleFileImport);
    }
}
// ============================================================================
// UI Update Functions
// ============================================================================
function updateDifficultyValue(value) {
    const difficultyValueElement = document.getElementById('difficulty-value');
    if (difficultyValueElement) {
        difficultyValueElement.textContent = value;
    }
}
function updateFontSizeValue(value) {
    const fontSizeValueElement = document.getElementById('font-size-value');
    if (fontSizeValueElement) {
        fontSizeValueElement.textContent = value;
    }
}
async function updateStorageInfo() {
    try {
        const quotaInfo = await storageManager.checkStorageQuota();
        const usedMB = (quotaInfo.bytesInUse / (1024 * 1024)).toFixed(2);
        const quotaMB = (quotaInfo.quota / (1024 * 1024)).toFixed(2);
        const percentUsed = (quotaInfo.percentUsed * 100).toFixed(1);
        const storageUsedBar = document.getElementById('storage-used-bar');
        const storageUsedText = document.getElementById('storage-used');
        const storageQuotaText = document.getElementById('storage-quota');
        if (storageUsedBar) {
            storageUsedBar.style.width = `${percentUsed}%`;
            // Change color based on usage
            if (quotaInfo.status === 'critical') {
                storageUsedBar.style.background = '#f56565';
            }
            else if (quotaInfo.status === 'warning') {
                storageUsedBar.style.background = '#ed8936';
            }
        }
        if (storageUsedText)
            storageUsedText.textContent = usedMB;
        if (storageQuotaText)
            storageQuotaText.textContent = quotaMB;
    }
    catch (error) {
        console.error('Failed to update storage info:', error);
    }
}
// ============================================================================
// Settings Actions
// ============================================================================
async function saveSettings() {
    try {
        // Gather form values
        const learningLanguage = document.getElementById('learning-language')?.value;
        const nativeLanguage = document.getElementById('native-language')?.value;
        const difficultyLevel = parseInt(document.getElementById('difficulty-slider')
            ?.value || '5');
        const autoHighlight = document.getElementById('auto-highlight')?.checked;
        const geminiApiKey = document.getElementById('gemini-api-key')?.value;
        const jinaApiKey = document.getElementById('jina-api-key')?.value;
        const darkMode = document.getElementById('dark-mode')
            ?.checked;
        const fontSize = parseInt(document.getElementById('font-size-slider')
            ?.value || '16');
        // Validate
        if (!learningLanguage || !nativeLanguage) {
            showToast('Please select both languages', 'error');
            return;
        }
        if (learningLanguage === nativeLanguage) {
            showToast('Learning and native languages must be different', 'error');
            return;
        }
        // Create settings object
        const settings = {
            learningLanguage,
            nativeLanguage,
            difficultyLevel,
            autoHighlight: autoHighlight || false,
            darkMode: darkMode || false,
            fontSize,
            apiKeys: {
                gemini: geminiApiKey || undefined,
                jinaReader: jinaApiKey || undefined,
            },
            keyboardShortcuts: currentSettings?.keyboardShortcuts || {
                navigateLeft: 'ArrowLeft',
                navigateRight: 'ArrowRight',
                vocabularyMode: 'v',
                sentenceMode: 's',
                readingMode: 'r',
            },
        };
        // Save to storage
        await storageManager.saveUserSettings(settings);
        currentSettings = settings;
        showToast('Settings saved successfully', 'success');
    }
    catch (error) {
        console.error('Failed to save settings:', error);
        showToast('Failed to save settings', 'error');
    }
}
async function resetToDefaults() {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
        return;
    }
    try {
        const defaultSettings = {
            nativeLanguage: 'en',
            learningLanguage: 'es',
            difficultyLevel: 5,
            autoHighlight: false,
            darkMode: false,
            fontSize: 16,
            apiKeys: {},
            keyboardShortcuts: {
                navigateLeft: 'ArrowLeft',
                navigateRight: 'ArrowRight',
                vocabularyMode: 'v',
                sentenceMode: 's',
                readingMode: 'r',
            },
        };
        await storageManager.saveUserSettings(defaultSettings);
        currentSettings = defaultSettings;
        // Repopulate form
        populateFormFields(defaultSettings);
        showToast('Settings reset to defaults', 'success');
    }
    catch (error) {
        console.error('Failed to reset settings:', error);
        showToast('Failed to reset settings', 'error');
    }
}
// ============================================================================
// Data Management
// ============================================================================
async function exportData() {
    try {
        const data = await storageManager.exportData('json');
        // Create download link
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `language-learning-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Data exported successfully', 'success');
    }
    catch (error) {
        console.error('Failed to export data:', error);
        showToast('Failed to export data', 'error');
    }
}
function importData() {
    const fileInput = document.getElementById('import-file-input');
    if (fileInput) {
        fileInput.click();
    }
}
async function handleFileImport(event) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file)
        return;
    try {
        const text = await file.text();
        await storageManager.importData(text);
        // Reload settings
        currentSettings = await storageManager.getUserSettings();
        if (currentSettings) {
            populateFormFields(currentSettings);
        }
        await updateStorageInfo();
        showToast('Data imported successfully', 'success');
    }
    catch (error) {
        console.error('Failed to import data:', error);
        showToast('Failed to import data. Please check the file format.', 'error');
    }
    // Reset file input
    input.value = '';
}
async function clearAllData() {
    if (!confirm('Are you sure you want to clear ALL data? This will delete all articles, vocabulary, and sentences. This cannot be undone!')) {
        return;
    }
    // Double confirmation for safety
    if (!confirm('This is your last warning. All your learning data will be permanently deleted. Continue?')) {
        return;
    }
    try {
        await storageManager.clearAll();
        await updateStorageInfo();
        showToast('All data cleared', 'success');
    }
    catch (error) {
        console.error('Failed to clear data:', error);
        showToast('Failed to clear data', 'error');
    }
}
// ============================================================================
// Utility Functions
// ============================================================================
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast)
        return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}
// ============================================================================
// Export functions to global scope for HTML onclick handlers
// ============================================================================
window.saveSettings = saveSettings;
window.resetToDefaults = resetToDefaults;
window.exportData = exportData;
window.importData = importData;
window.clearAllData = clearAllData;
window.togglePasswordVisibility = togglePasswordVisibility;
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        void initializeSettings();
    });
}
else {
    void initializeSettings();
}
//# sourceMappingURL=settings.js.map