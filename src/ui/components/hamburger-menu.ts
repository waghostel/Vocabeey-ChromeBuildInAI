/**
 * Hamburger Menu Component
 * Provides settings menu with theme switching functionality
 */

import { showOnboardingWizard } from '../onboarding-wizard';

export type Theme = 'light' | 'dark';

interface MenuState {
  isOpen: boolean;
  currentTheme: Theme;
}

const state: MenuState = {
  isOpen: false,
  currentTheme: 'light',
};

let menuElement: HTMLElement | null = null;
let hamburgerButton: HTMLElement | null = null;

/**
 * Initialize hamburger menu
 */
export function initializeHamburgerMenu(): void {
  createHamburgerButton();
  createMenuDropdown();
  loadSavedTheme();
  setupEventListeners();
}

/**
 * Create hamburger button
 */
function createHamburgerButton(): void {
  hamburgerButton = document.createElement('button');
  hamburgerButton.className = 'hamburger-button';
  hamburgerButton.setAttribute('aria-label', 'Settings menu');
  hamburgerButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  `;

  document.body.appendChild(hamburgerButton);
}

/**
 * Create menu dropdown
 */
function createMenuDropdown(): void {
  menuElement = document.createElement('div');
  menuElement.className = 'hamburger-menu hidden';
  menuElement.innerHTML = `
    <div class="menu-section">
      <h3 class="menu-section-title">Help</h3>
      <button class="menu-item" data-action="replay-tutorial">
        <span class="menu-item-icon">🎓</span>
        <span class="menu-item-label">Replay Tutorial</span>
      </button>
    </div>
    <div class="menu-section">
      <h3 class="menu-section-title">Theme</h3>
      <div class="theme-options">
        <button class="theme-option" data-theme="light">
          <span class="theme-icon">☀️</span>
          <span class="theme-label">Light</span>
        </button>
        <button class="theme-option" data-theme="dark">
          <span class="theme-icon">🌙</span>
          <span class="theme-label">Dark</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(menuElement);
}

/**
 * Setup event listeners
 */
function setupEventListeners(): void {
  // Toggle menu on hamburger button click
  hamburgerButton?.addEventListener('click', e => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close menu when clicking outside
  document.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    if (
      state.isOpen &&
      menuElement &&
      !menuElement.contains(target) &&
      !hamburgerButton?.contains(target)
    ) {
      closeMenu();
    }
  });

  // Menu item clicks
  const menuItems = menuElement?.querySelectorAll('.menu-item');
  menuItems?.forEach(item => {
    item.addEventListener('click', () => {
      const action = (item as HTMLElement).dataset.action;
      handleMenuAction(action);
    });
  });

  // Theme option clicks
  const themeOptions = menuElement?.querySelectorAll('.theme-option');
  themeOptions?.forEach(option => {
    option.addEventListener('click', () => {
      const theme = (option as HTMLElement).dataset.theme as Theme;
      setTheme(theme);
    });
  });

  // Close menu on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.isOpen) {
      closeMenu();
    }
  });
}

/**
 * Handle menu action
 */
function handleMenuAction(action: string | undefined): void {
  if (!action) return;

  switch (action) {
    case 'replay-tutorial':
      closeMenu();
      void showOnboardingWizard();
      break;
    default:
      console.warn('Unknown menu action:', action);
  }
}

/**
 * Toggle menu open/close
 */
function toggleMenu(): void {
  if (state.isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}

/**
 * Open menu
 */
function openMenu(): void {
  state.isOpen = true;
  menuElement?.classList.remove('hidden');
  hamburgerButton?.classList.add('active');
}

/**
 * Close menu
 */
function closeMenu(): void {
  state.isOpen = false;
  menuElement?.classList.add('hidden');
  hamburgerButton?.classList.remove('active');
}

/**
 * Set theme
 */
export async function setTheme(theme: Theme): Promise<void> {
  state.currentTheme = theme;

  // Apply theme to document
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }

  // Update active state in menu
  updateThemeSelection(theme);

  // Save to storage
  await saveTheme(theme);

  // Close menu after selection
  closeMenu();
}

/**
 * Update theme selection UI
 */
function updateThemeSelection(theme: Theme): void {
  const themeOptions = menuElement?.querySelectorAll('.theme-option');
  themeOptions?.forEach(option => {
    const optionTheme = (option as HTMLElement).dataset.theme;
    if (optionTheme === theme) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

/**
 * Load saved theme from storage
 */
async function loadSavedTheme(): Promise<void> {
  try {
    const data = await chrome.storage.local.get('settings');
    const settings = data.settings as { darkMode?: boolean } | undefined;
    const theme: Theme = settings?.darkMode ? 'dark' : 'light';
    await setTheme(theme);
  } catch (error) {
    console.error('Error loading theme:', error);
    // Default to light theme
    await setTheme('light');
  }
}

/**
 * Save theme to storage
 */
async function saveTheme(theme: Theme): Promise<void> {
  try {
    const data = await chrome.storage.local.get('settings');
    const settings = (data.settings || {}) as Record<string, unknown>;
    settings.darkMode = theme === 'dark';
    await chrome.storage.local.set({ settings });
  } catch (error) {
    console.error('Error saving theme:', error);
  }
}

/**
 * Get current theme
 */
export function getCurrentTheme(): Theme {
  return state.currentTheme;
}

/**
 * Cleanup hamburger menu
 */
export function cleanupHamburgerMenu(): void {
  hamburgerButton?.remove();
  menuElement?.remove();
  hamburgerButton = null;
  menuElement = null;
}
