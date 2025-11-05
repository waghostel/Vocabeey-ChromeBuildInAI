/**
 * Setup Wizard - First-time setup experience
 * Implements Requirements: 7.1, 7.2, 7.3, 7.4
 */
// ============================================================================
// Constants
// ============================================================================
const ALICE_IN_WONDERLAND_SAMPLE = {
    title: 'Alice in Wonderland - Chapter 1',
    content: `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"

So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.

There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.`,
    url: 'tutorial://alice-in-wonderland',
    language: 'en',
};
// ============================================================================
// State Management
// ============================================================================
let currentStep = 1;
const totalSteps = 4;
const wizardState = {
    learningLanguage: '',
    nativeLanguage: 'en',
    difficultyLevel: 5,
    autoHighlight: false,
};
// ============================================================================
// Navigation Functions
// ============================================================================
function nextStep() {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
        return;
    }
    if (currentStep < totalSteps) {
        currentStep++;
        updateWizardDisplay();
    }
}
function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateWizardDisplay();
    }
}
function updateWizardDisplay() {
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(step => {
        step.classList.remove('active');
    });
    // Show current step
    const currentStepElement = document.querySelector(`.wizard-step[data-step="${currentStep}"]`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
    // Update progress dots
    document.querySelectorAll('.progress-dot').forEach((dot, index) => {
        if (index < currentStep) {
            dot.classList.add('active');
        }
        else {
            dot.classList.remove('active');
        }
    });
}
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            return true; // Welcome screen, no validation needed
        case 2: {
            // Language selection validation
            const learningLang = document.getElementById('learning-language')?.value;
            const nativeLang = document.getElementById('native-language')?.value;
            if (!learningLang || !nativeLang) {
                alert('Please select both languages to continue.');
                return false;
            }
            if (learningLang === nativeLang) {
                alert('Learning language and native language must be different.');
                return false;
            }
            wizardState.learningLanguage = learningLang;
            wizardState.nativeLanguage = nativeLang;
            return true;
        }
        case 3: {
            // Settings validation
            const difficultySlider = document.getElementById('difficulty-slider');
            const autoHighlight = document.getElementById('auto-highlight');
            wizardState.difficultyLevel = parseInt(difficultySlider?.value || '5');
            wizardState.autoHighlight = autoHighlight?.checked || false;
            return true;
        }
        case 4:
            return true; // Tutorial screen, no validation needed
        default:
            return true;
    }
}
// ============================================================================
// Settings Functions
// ============================================================================
function updateDifficultyValue(value) {
    const difficultyValueElement = document.getElementById('difficulty-value');
    if (difficultyValueElement) {
        difficultyValueElement.textContent = value;
    }
}
async function saveSettings() {
    const settings = {
        learningLanguage: wizardState.learningLanguage,
        nativeLanguage: wizardState.nativeLanguage,
        difficultyLevel: wizardState.difficultyLevel,
        autoHighlight: wizardState.autoHighlight,
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
    try {
        await chrome.storage.local.set({
            user_settings: settings,
            setup_completed: true,
        });
    }
    catch (error) {
        console.error('Failed to save settings:', error);
        throw error;
    }
}
// ============================================================================
// Tutorial Functions
// ============================================================================
async function startTutorial() {
    try {
        // Save settings first
        await saveSettings();
        // Create tutorial article in storage
        const tutorialArticle = {
            id: 'tutorial-alice',
            url: ALICE_IN_WONDERLAND_SAMPLE.url,
            title: ALICE_IN_WONDERLAND_SAMPLE.title,
            originalLanguage: ALICE_IN_WONDERLAND_SAMPLE.language,
            processedAt: new Date().toISOString(),
            parts: [
                {
                    id: 'part-1',
                    content: ALICE_IN_WONDERLAND_SAMPLE.content,
                    originalContent: ALICE_IN_WONDERLAND_SAMPLE.content,
                    vocabulary: [],
                    sentences: [],
                    partIndex: 0,
                },
            ],
            processingStatus: 'completed',
            cacheExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        // Save tutorial article
        const articlesData = await chrome.storage.local.get('articles');
        const articles = articlesData.articles || {};
        articles['tutorial-alice'] = tutorialArticle;
        await chrome.storage.local.set({ articles });
        // Open learning interface with tutorial article
        const learningInterfaceUrl = chrome.runtime.getURL('ui/learning-interface.html');
        await chrome.tabs.create({
            url: `${learningInterfaceUrl}?articleId=tutorial-alice&tutorial=true`,
        });
        // Close setup wizard
        window.close();
    }
    catch (error) {
        console.error('Failed to start tutorial:', error);
        alert('Failed to start tutorial. Please try again.');
    }
}
async function skipTutorial() {
    try {
        // Save settings
        await saveSettings();
        // Close setup wizard
        window.close();
    }
    catch (error) {
        console.error('Failed to save settings:', error);
        alert('Failed to save settings. Please try again.');
    }
}
// ============================================================================
// Initialization
// ============================================================================
function initializeWizard() {
    // Set up language selection change handlers
    const learningLanguageSelect = document.getElementById('learning-language');
    const nativeLanguageSelect = document.getElementById('native-language');
    if (learningLanguageSelect && nativeLanguageSelect) {
        const updateNextButton = () => {
            const nextButton = document.getElementById('language-next');
            if (nextButton) {
                const hasSelection = learningLanguageSelect.value && nativeLanguageSelect.value;
                nextButton.disabled = !hasSelection;
            }
        };
        learningLanguageSelect.addEventListener('change', updateNextButton);
        nativeLanguageSelect.addEventListener('change', updateNextButton);
        updateNextButton(); // Initial check
    }
    // Set up difficulty slider
    const difficultySlider = document.getElementById('difficulty-slider');
    if (difficultySlider) {
        updateDifficultyValue(difficultySlider.value);
    }
    // Check if setup was already completed
    void chrome.storage.local.get('setup_completed').then(data => {
        if (data.setup_completed) {
            // Redirect to settings page instead
            window.location.href = chrome.runtime.getURL('src/ui/settings.html');
        }
    });
}
// ============================================================================
// Export functions to global scope for HTML onclick handlers
// ============================================================================
window.nextStep = nextStep;
window.previousStep = previousStep;
window.updateDifficultyValue = updateDifficultyValue;
window.startTutorial = startTutorial;
window.skipTutorial = skipTutorial;
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWizard);
}
else {
    initializeWizard();
}
export {};
//# sourceMappingURL=setup-wizard.js.map