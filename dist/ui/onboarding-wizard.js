/**
 * Onboarding Wizard - Interactive guide for first-time users
 * Shows users how to use vocabulary/sentence highlighting, cards, and hotkeys
 */
// ============================================================================
// Wizard Steps Configuration
// ============================================================================
const WIZARD_STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to Language Learning! 🎉',
        content: `
      <p>Transform any web article into an interactive language learning experience.</p>
      <p>This quick guide will show you how to:</p>
      <ul>
        <li>Create vocabulary and sentence cards</li>
        <li>Get instant translations with audio</li>
        <li>Navigate with keyboard shortcuts</li>
      </ul>
      <p class="wizard-time-estimate">⏱️ Takes about 1 minute</p>
    `,
    },
    {
        id: 'highlight-modes',
        title: 'Highlighting Modes 📝',
        content: `
      <p>Choose what you want to learn by switching modes:</p>
      <ul>
        <li><strong>Vocabulary mode</strong> - For learning individual words</li>
        <li><strong>Sentence mode</strong> - For understanding full sentences</li>
        <li><strong>None</strong> - Just read without highlighting</li>
      </ul>
      <p><strong>How to create a card:</strong></p>
      <ol>
        <li>Select any text in the article</li>
        <li>Right-click to open the menu</li>
        <li>Choose "Add as Vocabulary" or "Add as Sentence"</li>
      </ol>
      <p class="wizard-tip">💡 Tip: Press <kbd>1</kbd> for Vocabulary, <kbd>2</kbd> for Sentences, <kbd>0</kbd> to disable</p>
    `,
        highlightElement: '.highlight-mode-selector',
    },
    {
        id: 'vocabulary-cards',
        title: 'Vocabulary Cards 🗂️',
        content: `
      <p>After creating a vocabulary card, you'll see:</p>
      <ul>
        <li><strong>The word or phrase</strong> you selected</li>
        <li><strong>Translation</strong> in your target language</li>
        <li><strong>Context</strong> from where it appeared</li>
        <li><strong>Audio pronunciation</strong> (click 🔊)</li>
      </ul>
      <div class="wizard-card-demo">
        <div class="demo-card">
          <div class="demo-card-word">example</div>
          <div class="demo-card-translation">ejemplo</div>
          <button class="demo-tts-btn">🔊</button>
        </div>
      </div>
      <p class="wizard-tip">💡 Tip: Right-click on cards to edit or remove them</p>
    `,
        highlightElement: '.vocabulary-cards-section',
    },
    {
        id: 'sentence-cards',
        title: 'Sentence Cards 📋',
        content: `
      <p>Sentence cards work the same way:</p>
      <ol>
        <li>Switch to <strong>Sentence mode</strong></li>
        <li>Select a sentence in the article</li>
        <li>Right-click → "Add as Sentence"</li>
      </ol>
      <p>Your sentence card will show:</p>
      <ul>
        <li><strong>Original sentence</strong> in the learning language</li>
        <li><strong>Translation</strong> for understanding</li>
        <li><strong>Audio playback</strong> for pronunciation</li>
      </ul>
      <p class="wizard-tip">💡 Tip: Sentences help you learn grammar and natural expressions</p>
    `,
        highlightElement: '.sentence-cards-section',
    },
    {
        id: 'learning-modes',
        title: 'Learning Modes 📚',
        content: `
      <p>Switch between three different views:</p>
      <div class="wizard-shortcuts">
        <div class="shortcut-row">
          <kbd>R</kbd>
          <span><strong>Reading Mode</strong> - View article with your cards</span>
        </div>
        <div class="shortcut-row">
          <kbd>V</kbd>
          <span><strong>Vocabulary Mode</strong> - Review all vocabulary cards</span>
        </div>
        <div class="shortcut-row">
          <kbd>S</kbd>
          <span><strong>Sentences Mode</strong> - Review all sentence cards</span>
        </div>
      </div>
      <p class="wizard-tip">💡 Tip: Click the tabs at the top to switch modes</p>
    `,
        highlightElement: '.mode-tabs',
    },
    {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts ⌨️',
        content: `
      <p>Work faster with these shortcuts:</p>
      <div class="wizard-shortcuts">
        <div class="shortcut-row">
          <kbd>1</kbd>
          <span>Switch to Vocabulary highlighting</span>
        </div>
        <div class="shortcut-row">
          <kbd>2</kbd>
          <span>Switch to Sentence highlighting</span>
        </div>
        <div class="shortcut-row">
          <kbd>0</kbd> or <kbd>Esc</kbd>
          <span>Turn off highlighting</span>
        </div>
        <div class="shortcut-row">
          <kbd>←</kbd> <kbd>→</kbd> or <kbd>D</kbd> <kbd>F</kbd>
          <span>Navigate between article parts</span>
        </div>
        <div class="shortcut-row">
          <kbd>R</kbd> <kbd>V</kbd> <kbd>S</kbd>
          <span>Switch learning modes</span>
        </div>
      </div>
      <p class="wizard-tip">💡 Tip: Hover over buttons to see their shortcuts</p>
    `,
    },
    {
        id: 'ready',
        title: "You're Ready to Learn! 🚀",
        content: `
      <p>You now know how to:</p>
      <ul>
        <li>✅ Select text and create vocabulary/sentence cards</li>
        <li>✅ Get instant translations with audio</li>
        <li>✅ Switch between learning modes</li>
        <li>✅ Use keyboard shortcuts</li>
      </ul>
      <p><strong>Start learning:</strong> Select any text in the article, right-click, and choose "Add as Vocabulary" or "Add as Sentence"!</p>
      <p class="wizard-replay">You can replay this tutorial anytime from the menu (☰)</p>
    `,
    },
];
// ============================================================================
// Wizard State
// ============================================================================
let currentStepIndex = 0;
let wizardContainer = null;
let isWizardActive = false;
// ============================================================================
// Initialization
// ============================================================================
/**
 * Check if user has completed onboarding and show wizard if needed
 */
export async function checkAndShowOnboarding() {
    try {
        // Check if onboarding has been completed
        const hasCompleted = localStorage.getItem('hasCompletedOnboarding');
        if (!hasCompleted) {
            // Wait a bit for the page to fully load
            setTimeout(() => {
                void showOnboardingWizard();
            }, 500);
        }
    }
    catch (error) {
        console.error('Error checking onboarding status:', error);
    }
}
/**
 * Show onboarding wizard (can be called manually to replay)
 */
export async function showOnboardingWizard() {
    if (isWizardActive)
        return;
    isWizardActive = true;
    currentStepIndex = 0;
    // Create wizard container
    createWizardContainer();
    // Show first step
    showStep(0);
}
/**
 * Hide onboarding wizard
 */
export function hideOnboardingWizard() {
    if (!isWizardActive)
        return;
    isWizardActive = false;
    // Remove wizard container
    if (wizardContainer) {
        wizardContainer.remove();
        wizardContainer = null;
    }
    // Remove spotlight
    removeSpotlight();
}
// ============================================================================
// Wizard UI Creation
// ============================================================================
/**
 * Create wizard container
 */
function createWizardContainer() {
    // Remove existing wizard if any
    const existing = document.querySelector('.onboarding-wizard');
    if (existing) {
        existing.remove();
    }
    // Create wizard HTML
    wizardContainer = document.createElement('div');
    wizardContainer.className = 'onboarding-wizard';
    wizardContainer.innerHTML = `
    <div class="wizard-overlay"></div>
    <div class="wizard-content">
      <div class="wizard-header">
        <button class="wizard-close-btn" aria-label="Close tutorial" title="Close (you can replay later)">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="wizard-progress">
          <div class="wizard-progress-bar"></div>
        </div>
      </div>
      <div class="wizard-body">
        <h2 class="wizard-title"></h2>
        <div class="wizard-step-content"></div>
      </div>
      <div class="wizard-footer">
        <div class="wizard-step-indicator">
          <span class="wizard-current-step">1</span> / <span class="wizard-total-steps">${WIZARD_STEPS.length}</span>
        </div>
        <div class="wizard-actions">
          <button class="wizard-btn wizard-btn-skip">Skip Tutorial</button>
          <button class="wizard-btn wizard-btn-prev" disabled>Previous</button>
          <button class="wizard-btn wizard-btn-next wizard-btn-primary">Next</button>
        </div>
      </div>
    </div>
  `;
    // Append to body
    document.body.appendChild(wizardContainer);
    // Setup event listeners
    setupWizardEventListeners();
}
/**
 * Setup wizard event listeners
 */
function setupWizardEventListeners() {
    if (!wizardContainer)
        return;
    // Close button
    const closeBtn = wizardContainer.querySelector('.wizard-close-btn');
    closeBtn?.addEventListener('click', handleSkip);
    // Skip button
    const skipBtn = wizardContainer.querySelector('.wizard-btn-skip');
    skipBtn?.addEventListener('click', handleSkip);
    // Previous button
    const prevBtn = wizardContainer.querySelector('.wizard-btn-prev');
    prevBtn?.addEventListener('click', handlePrevious);
    // Next button
    const nextBtn = wizardContainer.querySelector('.wizard-btn-next');
    nextBtn?.addEventListener('click', handleNext);
    // Keyboard shortcuts
    document.addEventListener('keydown', handleWizardKeydown);
    // Overlay click (optional: close on overlay click)
    const overlay = wizardContainer.querySelector('.wizard-overlay');
    overlay?.addEventListener('click', handleSkip);
}
/**
 * Remove wizard event listeners
 */
function removeWizardEventListeners() {
    document.removeEventListener('keydown', handleWizardKeydown);
}
// ============================================================================
// Step Navigation
// ============================================================================
/**
 * Show specific step
 */
function showStep(stepIndex) {
    if (!wizardContainer)
        return;
    const step = WIZARD_STEPS[stepIndex];
    if (!step)
        return;
    currentStepIndex = stepIndex;
    // Update title
    const titleElement = wizardContainer.querySelector('.wizard-title');
    if (titleElement) {
        titleElement.textContent = step.title;
    }
    // Update content
    const contentElement = wizardContainer.querySelector('.wizard-step-content');
    if (contentElement) {
        contentElement.innerHTML = step.content;
    }
    // Update progress bar
    const progressBar = wizardContainer.querySelector('.wizard-progress-bar');
    if (progressBar) {
        const progress = ((stepIndex + 1) / WIZARD_STEPS.length) * 100;
        progressBar.style.width = `${progress}%`;
    }
    // Update step indicator
    const currentStepSpan = wizardContainer.querySelector('.wizard-current-step');
    if (currentStepSpan) {
        currentStepSpan.textContent = (stepIndex + 1).toString();
    }
    // Update button states
    updateButtonStates();
    // Handle spotlight
    if (step.highlightElement) {
        showSpotlight(step.highlightElement);
    }
    else {
        removeSpotlight();
    }
    // Execute step action if any
    if (step.action) {
        step.action();
    }
}
/**
 * Update button states based on current step
 */
function updateButtonStates() {
    if (!wizardContainer)
        return;
    const prevBtn = wizardContainer.querySelector('.wizard-btn-prev');
    const nextBtn = wizardContainer.querySelector('.wizard-btn-next');
    // Previous button
    if (prevBtn) {
        prevBtn.disabled = currentStepIndex === 0;
    }
    // Next button
    if (nextBtn) {
        const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;
        nextBtn.textContent = isLastStep ? 'Start Learning' : 'Next';
    }
}
// ============================================================================
// Event Handlers
// ============================================================================
/**
 * Handle next button click
 */
function handleNext() {
    if (currentStepIndex < WIZARD_STEPS.length - 1) {
        showStep(currentStepIndex + 1);
    }
    else {
        // Last step - complete onboarding
        completeOnboarding();
    }
}
/**
 * Handle previous button click
 */
function handlePrevious() {
    if (currentStepIndex > 0) {
        showStep(currentStepIndex - 1);
    }
}
/**
 * Handle skip button click
 */
function handleSkip() {
    const confirmed = confirm('Are you sure you want to skip the tutorial?\n\nYou can replay it anytime from the menu (☰).');
    if (confirmed) {
        completeOnboarding();
    }
}
/**
 * Handle keyboard shortcuts
 */
function handleWizardKeydown(event) {
    if (!isWizardActive)
        return;
    if (event.key === 'Escape') {
        event.preventDefault();
        handleSkip();
    }
    else if (event.key === 'ArrowRight' || event.key === 'Enter') {
        event.preventDefault();
        handleNext();
    }
    else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevious();
    }
}
/**
 * Complete onboarding
 */
function completeOnboarding() {
    // Mark as completed
    localStorage.setItem('hasCompletedOnboarding', 'true');
    // Hide wizard
    hideOnboardingWizard();
    // Remove event listeners
    removeWizardEventListeners();
}
// ============================================================================
// Spotlight Effect
// ============================================================================
let spotlightElement = null;
/**
 * Show spotlight on specific element
 */
function showSpotlight(selector) {
    // Remove existing spotlight
    removeSpotlight();
    // Find target element
    const targetElement = document.querySelector(selector);
    if (!targetElement)
        return;
    // Create spotlight overlay
    spotlightElement = document.createElement('div');
    spotlightElement.className = 'wizard-spotlight';
    // Position spotlight
    const rect = targetElement.getBoundingClientRect();
    spotlightElement.style.top = `${rect.top - 8}px`;
    spotlightElement.style.left = `${rect.left - 8}px`;
    spotlightElement.style.width = `${rect.width + 16}px`;
    spotlightElement.style.height = `${rect.height + 16}px`;
    // Add to body
    document.body.appendChild(spotlightElement);
    // Add highlight class to target
    targetElement.classList.add('wizard-highlighted');
    // Scroll target into view
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
/**
 * Remove spotlight
 */
function removeSpotlight() {
    if (spotlightElement) {
        spotlightElement.remove();
        spotlightElement = null;
    }
    // Remove highlight class from all elements
    document.querySelectorAll('.wizard-highlighted').forEach(el => {
        el.classList.remove('wizard-highlighted');
    });
}
// ============================================================================
// Public API
// ============================================================================
/**
 * Reset onboarding (for testing or user request)
 */
export function resetOnboarding() {
    localStorage.removeItem('hasCompletedOnboarding');
}
/**
 * Check if onboarding has been completed
 */
export function hasCompletedOnboarding() {
    return localStorage.getItem('hasCompletedOnboarding') === 'true';
}
//# sourceMappingURL=onboarding-wizard.js.map