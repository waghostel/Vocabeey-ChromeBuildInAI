/**
 * Onboarding Wizard - Interactive guide for first-time users
 * Shows users how to use vocabulary/sentence highlighting, cards, and hotkeys
 */
/**
 * Check if user has completed onboarding and show wizard if needed
 */
export declare function checkAndShowOnboarding(): Promise<void>;
/**
 * Show onboarding wizard (can be called manually to replay)
 */
export declare function showOnboardingWizard(): Promise<void>;
/**
 * Hide onboarding wizard
 */
export declare function hideOnboardingWizard(): void;
/**
 * Reset onboarding (for testing or user request)
 */
export declare function resetOnboarding(): void;
/**
 * Check if onboarding has been completed
 */
export declare function hasCompletedOnboarding(): boolean;
//# sourceMappingURL=onboarding-wizard.d.ts.map