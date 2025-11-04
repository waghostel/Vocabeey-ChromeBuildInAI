/**
 * Onboarding Wizard Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  checkAndShowOnboarding,
  showOnboardingWizard,
  hideOnboardingWizard,
  resetOnboarding,
  hasCompletedOnboarding,
} from '../src/ui/onboarding-wizard';

describe('Onboarding Wizard', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Clean up
    hideOnboardingWizard();
    localStorage.clear();
  });

  describe('hasCompletedOnboarding', () => {
    it('should return false when onboarding has not been completed', () => {
      expect(hasCompletedOnboarding()).toBe(false);
    });

    it('should return true when onboarding has been completed', () => {
      localStorage.setItem('hasCompletedOnboarding', 'true');
      expect(hasCompletedOnboarding()).toBe(true);
    });
  });

  describe('resetOnboarding', () => {
    it('should clear the onboarding completion flag', () => {
      localStorage.setItem('hasCompletedOnboarding', 'true');
      expect(hasCompletedOnboarding()).toBe(true);

      resetOnboarding();
      expect(hasCompletedOnboarding()).toBe(false);
    });
  });

  describe('showOnboardingWizard', () => {
    it('should create wizard container in DOM', async () => {
      await showOnboardingWizard();

      const wizard = document.querySelector('.onboarding-wizard');
      expect(wizard).toBeTruthy();
    });

    it('should show first step by default', async () => {
      await showOnboardingWizard();

      const title = document.querySelector('.wizard-title');
      expect(title?.textContent).toContain('Welcome');
    });

    it('should show progress bar', async () => {
      await showOnboardingWizard();

      const progressBar = document.querySelector('.wizard-progress-bar');
      expect(progressBar).toBeTruthy();
    });

    it('should show navigation buttons', async () => {
      await showOnboardingWizard();

      const nextBtn = document.querySelector('.wizard-btn-next');
      const prevBtn = document.querySelector('.wizard-btn-prev');
      const skipBtn = document.querySelector('.wizard-btn-skip');

      expect(nextBtn).toBeTruthy();
      expect(prevBtn).toBeTruthy();
      expect(skipBtn).toBeTruthy();
    });
  });

  describe('hideOnboardingWizard', () => {
    it('should remove wizard from DOM', async () => {
      await showOnboardingWizard();
      expect(document.querySelector('.onboarding-wizard')).toBeTruthy();

      hideOnboardingWizard();
      expect(document.querySelector('.onboarding-wizard')).toBeFalsy();
    });
  });

  describe('checkAndShowOnboarding', () => {
    it('should show wizard for first-time users', async () => {
      vi.useFakeTimers();

      await checkAndShowOnboarding();

      // Fast-forward timer
      vi.advanceTimersByTime(600);

      const wizard = document.querySelector('.onboarding-wizard');
      expect(wizard).toBeTruthy();

      vi.useRealTimers();
    });

    it('should not show wizard if already completed', async () => {
      localStorage.setItem('hasCompletedOnboarding', 'true');

      await checkAndShowOnboarding();

      const wizard = document.querySelector('.onboarding-wizard');
      expect(wizard).toBeFalsy();
    });
  });

  describe('Wizard Navigation', () => {
    it('should disable previous button on first step', async () => {
      await showOnboardingWizard();

      const prevBtn = document.querySelector(
        '.wizard-btn-prev'
      ) as HTMLButtonElement;
      expect(prevBtn?.disabled).toBe(true);
    });

    it('should show "Start Learning" on last step', async () => {
      await showOnboardingWizard();

      // Navigate to last step
      const nextBtn = document.querySelector(
        '.wizard-btn-next'
      ) as HTMLButtonElement;

      // Click next multiple times to reach last step (7 steps total, need 6 clicks)
      for (let i = 0; i < 6; i++) {
        nextBtn?.click();
      }

      expect(nextBtn?.textContent).toContain('Start Learning');
    });
  });

  describe('Step Content', () => {
    it('should show different content for each step', async () => {
      await showOnboardingWizard();

      const title1 = document.querySelector('.wizard-title')?.textContent;

      // Click next
      const nextBtn = document.querySelector(
        '.wizard-btn-next'
      ) as HTMLButtonElement;
      nextBtn?.click();

      const title2 = document.querySelector('.wizard-title')?.textContent;

      expect(title1).not.toBe(title2);
    });

    it('should update progress bar as user navigates', async () => {
      await showOnboardingWizard();

      const progressBar = document.querySelector(
        '.wizard-progress-bar'
      ) as HTMLElement;
      const initialWidth = progressBar?.style.width;

      // Click next
      const nextBtn = document.querySelector(
        '.wizard-btn-next'
      ) as HTMLButtonElement;
      nextBtn?.click();

      const newWidth = progressBar?.style.width;

      expect(newWidth).not.toBe(initialWidth);
    });
  });
});
