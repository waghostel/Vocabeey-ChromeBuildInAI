/**
 * Hamburger Menu Component
 * Provides settings menu with theme switching functionality
 */
export type Theme = 'light' | 'dark';
/**
 * Initialize hamburger menu
 */
export declare function initializeHamburgerMenu(): void;
/**
 * Set theme
 */
export declare function setTheme(theme: Theme): Promise<void>;
/**
 * Get current theme
 */
export declare function getCurrentTheme(): Theme;
/**
 * Cleanup hamburger menu
 */
export declare function cleanupHamburgerMenu(): void;
//# sourceMappingURL=hamburger-menu.d.ts.map