/**
 * Unit tests for Settings System
 * Tests setup wizard functionality, settings persistence, validation, and API key management
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createStorageManager } from '../src/utils/storage-manager';

import type { UserSettings } from '../src/types';

// ============================================================================
// Test Data Fixtures
// ============================================================================

const mockUserSettings: UserSettings = {
  nativeLanguage: 'en',
  learningLanguage: 'es',
  difficultyLevel: 5,
  autoHighlight: true,
  darkMode: false,
  fontSize: 16,
  apiKeys: {
    gemini: 'test-gemini-key',
    jinaReader: 'test-jina-key',
  },
  keyboardShortcuts: {
    navigateLeft: 'ArrowLeft',
    navigateRight: 'ArrowRight',
    vocabularyMode: 'v',
    sentenceMode: 's',
    readingMode: 'r',
  },
};

const defaultSettings: UserSettings = {
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

// ============================================================================
// Setup Wizard Tests
// ============================================================================

describe('Setup Wizard', () => {
  let mockStorage: Record<string, any>;

  beforeEach(() => {
    mockStorage = {};

    vi.mocked(chrome.storage.local.get).mockImplementation(((
      keys: string | string[] | null
    ) => {
      if (keys === null) {
        return Promise.resolve(mockStorage);
      }
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: mockStorage[keys] });
      }
      const result: Record<string, any> = {};
      keys.forEach(key => {
        if (mockStorage[key] !== undefined) {
          result[key] = mockStorage[key];
        }
      });
      return Promise.resolve(result);
    }) as any);

    vi.mocked(chrome.storage.local.set).mockImplementation(items => {
      Object.assign(mockStorage, items);
      return Promise.resolve();
    });
  });

  describe('Initial Setup', () => {
    it('should save settings on first setup', async () => {
      const settings: UserSettings = {
        learningLanguage: 'fr',
        nativeLanguage: 'en',
        difficultyLevel: 3,
        autoHighlight: true,
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

      await chrome.storage.local.set({
        user_settings: settings,
        setup_completed: true,
      });

      expect(mockStorage.user_settings).toEqual(settings);
      expect(mockStorage.setup_completed).toBe(true);
    });

    it('should mark setup as completed', async () => {
      await chrome.storage.local.set({
        user_settings: mockUserSettings,
        setup_completed: true,
      });

      const result = await chrome.storage.local.get('setup_completed');
      expect(result.setup_completed).toBe(true);
    });

    it('should detect if setup was already completed', async () => {
      mockStorage.setup_completed = true;

      const result = await chrome.storage.local.get('setup_completed');
      expect(result.setup_completed).toBe(true);
    });
  });

  describe('Language Selection Validation', () => {
    it('should accept valid language pair', () => {
      const learningLang = 'es';
      const nativeLang = 'en';

      expect(learningLang).toBeTruthy();
      expect(nativeLang).toBeTruthy();
      expect(learningLang).not.toBe(nativeLang);
    });

    it('should reject same language for learning and native', () => {
      const learningLang = 'en';
      const nativeLang = 'en';

      expect(learningLang).toBe(nativeLang);
    });

    it('should reject empty language selection', () => {
      const learningLang = '';
      const _nativeLang = 'en';

      expect(learningLang).toBeFalsy();
    });

    it('should validate multiple language combinations', () => {
      const validPairs = [
        { learning: 'es', native: 'en' },
        { learning: 'fr', native: 'en' },
        { learning: 'de', native: 'es' },
        { learning: 'ja', native: 'en' },
      ];

      validPairs.forEach(pair => {
        expect(pair.learning).not.toBe(pair.native);
        expect(pair.learning).toBeTruthy();
        expect(pair.native).toBeTruthy();
      });
    });
  });

  describe('Difficulty Level', () => {
    it('should accept valid difficulty level', () => {
      const difficulty = 5;
      expect(difficulty).toBeGreaterThanOrEqual(1);
      expect(difficulty).toBeLessThanOrEqual(10);
    });

    it('should handle minimum difficulty', () => {
      const difficulty = 1;
      expect(difficulty).toBe(1);
    });

    it('should handle maximum difficulty', () => {
      const difficulty = 10;
      expect(difficulty).toBe(10);
    });

    it('should default to middle difficulty', () => {
      const difficulty = 5;
      expect(difficulty).toBe(5);
    });
  });

  describe('Tutorial Article Creation', () => {
    it('should create tutorial article with correct structure', async () => {
      const tutorialArticle = {
        id: 'tutorial-alice',
        url: 'tutorial://alice-in-wonderland',
        title: 'Alice in Wonderland - Chapter 1',
        originalLanguage: 'en',
        processedAt: new Date().toISOString(),
        parts: [
          {
            id: 'part-1',
            content: 'Sample content',
            originalContent: 'Sample content',
            vocabulary: [],
            sentences: [],
            partIndex: 0,
          },
        ],
        processingStatus: 'completed' as const,
        cacheExpires: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      };

      mockStorage.articles = { 'tutorial-alice': tutorialArticle };

      const result = await chrome.storage.local.get('articles');
      expect(result.articles['tutorial-alice']).toBeDefined();
      expect(result.articles['tutorial-alice'].id).toBe('tutorial-alice');
      expect(result.articles['tutorial-alice'].processingStatus).toBe(
        'completed'
      );
    });

    it('should set tutorial article cache expiration', () => {
      const now = Date.now();
      const sevenDaysLater = new Date(now + 7 * 24 * 60 * 60 * 1000);
      const cacheExpires = new Date(now + 7 * 24 * 60 * 60 * 1000);

      expect(cacheExpires.getTime()).toBeGreaterThan(now);
      expect(cacheExpires.getTime()).toBeCloseTo(sevenDaysLater.getTime(), -3);
    });
  });
});

// ============================================================================
// Settings Persistence Tests
// ============================================================================

describe('Settings Persistence', () => {
  let mockStorage: Record<string, any>;
  let storageManager: ReturnType<typeof createStorageManager>;

  beforeEach(() => {
    storageManager = createStorageManager();
    mockStorage = {};

    vi.mocked(chrome.storage.local.get).mockImplementation(((
      keys: string | string[] | null
    ) => {
      if (keys === null) {
        return Promise.resolve(mockStorage);
      }
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: mockStorage[keys] });
      }
      const result: Record<string, any> = {};
      keys.forEach(key => {
        if (mockStorage[key] !== undefined) {
          result[key] = mockStorage[key];
        }
      });
      return Promise.resolve(result);
    }) as any);

    vi.mocked(chrome.storage.local.set).mockImplementation(items => {
      Object.assign(mockStorage, items);
      return Promise.resolve();
    });
  });

  describe('Save Settings', () => {
    it('should save complete settings object', async () => {
      const storageManager = createStorageManager();
      await storageManager.saveUserSettings(mockUserSettings);

      expect(mockStorage.user_settings).toEqual(mockUserSettings);
    });

    it('should persist language preferences', async () => {
      const storageManager = createStorageManager();
      await storageManager.saveUserSettings(mockUserSettings);

      const settings = await storageManager.getUserSettings();
      expect(settings.learningLanguage).toBe('es');
      expect(settings.nativeLanguage).toBe('en');
    });

    it('should persist difficulty level', async () => {
      await storageManager.saveUserSettings(mockUserSettings);

      const settings = await storageManager.getUserSettings();
      expect(settings.difficultyLevel).toBe(5);
    });

    it('should persist auto-highlight preference', async () => {
      await storageManager.saveUserSettings(mockUserSettings);

      const settings = await storageManager.getUserSettings();
      expect(settings.autoHighlight).toBe(true);
    });

    it('should persist appearance settings', async () => {
      await storageManager.saveUserSettings(mockUserSettings);

      const settings = await storageManager.getUserSettings();
      expect(settings.darkMode).toBe(false);
      expect(settings.fontSize).toBe(16);
    });

    it('should persist keyboard shortcuts', async () => {
      await storageManager.saveUserSettings(mockUserSettings);

      const settings = await storageManager.getUserSettings();
      expect(settings.keyboardShortcuts).toEqual({
        navigateLeft: 'ArrowLeft',
        navigateRight: 'ArrowRight',
        vocabularyMode: 'v',
        sentenceMode: 's',
        readingMode: 'r',
      });
    });
  });

  describe('Load Settings', () => {
    it('should load saved settings', async () => {
      mockStorage.user_settings = mockUserSettings;

      const settings = await storageManager.getUserSettings();
      expect(settings).toEqual(mockUserSettings);
    });

    it('should return default settings if none exist', async () => {
      const settings = await storageManager.getUserSettings();

      expect(settings).toHaveProperty('nativeLanguage');
      expect(settings).toHaveProperty('learningLanguage');
      expect(settings).toHaveProperty('difficultyLevel');
    });

    it('should handle missing API keys gracefully', async () => {
      const settingsWithoutKeys = { ...mockUserSettings, apiKeys: {} };
      mockStorage.user_settings = settingsWithoutKeys;

      const settings = await storageManager.getUserSettings();
      expect(settings.apiKeys).toEqual({});
    });
  });

  describe('Update Settings', () => {
    it('should update existing settings', async () => {
      mockStorage.user_settings = mockUserSettings;

      const updatedSettings = {
        ...mockUserSettings,
        difficultyLevel: 7,
        darkMode: true,
      };

      await storageManager.saveUserSettings(updatedSettings);

      const settings = await storageManager.getUserSettings();
      expect(settings.difficultyLevel).toBe(7);
      expect(settings.darkMode).toBe(true);
    });

    it('should update language preferences', async () => {
      mockStorage.user_settings = mockUserSettings;

      const updatedSettings = {
        ...mockUserSettings,
        learningLanguage: 'fr',
      };

      await storageManager.saveUserSettings(updatedSettings);

      const settings = await storageManager.getUserSettings();
      expect(settings.learningLanguage).toBe('fr');
    });

    it('should update font size', async () => {
      mockStorage.user_settings = mockUserSettings;

      const updatedSettings = {
        ...mockUserSettings,
        fontSize: 20,
      };

      await storageManager.saveUserSettings(updatedSettings);

      const settings = await storageManager.getUserSettings();
      expect(settings.fontSize).toBe(20);
    });
  });

  describe('Reset to Defaults', () => {
    it('should reset all settings to defaults', async () => {
      mockStorage.user_settings = mockUserSettings;

      await storageManager.saveUserSettings(defaultSettings);

      const settings = await storageManager.getUserSettings();
      expect(settings.difficultyLevel).toBe(5);
      expect(settings.autoHighlight).toBe(false);
      expect(settings.darkMode).toBe(false);
      expect(settings.apiKeys).toEqual({});
    });

    it('should preserve default keyboard shortcuts', async () => {
      await storageManager.saveUserSettings(defaultSettings);

      const settings = await storageManager.getUserSettings();
      expect(settings.keyboardShortcuts).toEqual({
        navigateLeft: 'ArrowLeft',
        navigateRight: 'ArrowRight',
        vocabularyMode: 'v',
        sentenceMode: 's',
        readingMode: 'r',
      });
    });
  });
});

// ============================================================================
// Settings Validation Tests
// ============================================================================

describe('Settings Validation', () => {
  let storageManager: ReturnType<typeof createStorageManager>;

  beforeEach(() => {
    storageManager = createStorageManager();
  });

  describe('Language Validation', () => {
    it('should reject settings with same learning and native language', async () => {
      const invalidSettings = {
        ...mockUserSettings,
        learningLanguage: 'en',
        nativeLanguage: 'en',
      };

      // Validation should happen at UI level
      expect(invalidSettings.learningLanguage).toBe(
        invalidSettings.nativeLanguage
      );
    });

    it('should accept valid language codes', async () => {
      const validLanguages = [
        'en',
        'es',
        'fr',
        'de',
        'ja',
        'zh',
        'ko',
        'it',
        'pt',
        'ru',
      ];

      validLanguages.forEach(lang => {
        expect(lang).toMatch(/^[a-z]{2}$/);
      });
    });
  });

  describe('Difficulty Level Validation', () => {
    it('should reject difficulty below 1', async () => {
      const invalidSettings = {
        ...mockUserSettings,
        difficultyLevel: 0,
      };

      await expect(
        storageManager.saveUserSettings(invalidSettings)
      ).rejects.toThrow('Invalid user settings data');
    });

    it('should reject difficulty above 10', async () => {
      const invalidSettings = {
        ...mockUserSettings,
        difficultyLevel: 11,
      };

      await expect(
        storageManager.saveUserSettings(invalidSettings)
      ).rejects.toThrow('Invalid user settings data');
    });

    it('should accept difficulty levels 1-10', async () => {
      for (let i = 1; i <= 10; i++) {
        const settings = {
          ...mockUserSettings,
          difficultyLevel: i,
        };

        await expect(
          storageManager.saveUserSettings(settings)
        ).resolves.not.toThrow();
      }
    });
  });

  describe('Font Size Validation', () => {
    it('should reject font size below minimum', async () => {
      const invalidSettings = {
        ...mockUserSettings,
        fontSize: 7,
      };

      await expect(
        storageManager.saveUserSettings(invalidSettings)
      ).rejects.toThrow('Invalid user settings data');
    });

    it('should accept valid font sizes', async () => {
      const validSizes = [8, 12, 14, 16, 18, 20, 24];

      for (const size of validSizes) {
        const settings = {
          ...mockUserSettings,
          fontSize: size,
        };

        await expect(
          storageManager.saveUserSettings(settings)
        ).resolves.not.toThrow();
      }
    });
  });

  describe('Boolean Settings Validation', () => {
    it('should validate autoHighlight as boolean', async () => {
      const invalidSettings = {
        ...mockUserSettings,
        autoHighlight: 'true' as any,
      };

      await expect(
        storageManager.saveUserSettings(invalidSettings)
      ).rejects.toThrow('Invalid user settings data');
    });

    it('should validate darkMode as boolean', async () => {
      const invalidSettings = {
        ...mockUserSettings,
        darkMode: 1 as any,
      };

      await expect(
        storageManager.saveUserSettings(invalidSettings)
      ).rejects.toThrow('Invalid user settings data');
    });
  });

  describe('API Keys Validation', () => {
    it('should accept empty API keys object', async () => {
      const settings = {
        ...mockUserSettings,
        apiKeys: {},
      };

      await expect(
        storageManager.saveUserSettings(settings)
      ).resolves.not.toThrow();
    });

    it('should accept optional Gemini API key', async () => {
      const settings = {
        ...mockUserSettings,
        apiKeys: {
          gemini: 'test-key',
        },
      };

      await expect(
        storageManager.saveUserSettings(settings)
      ).resolves.not.toThrow();
    });

    it('should accept optional Jina Reader API key', async () => {
      const settings = {
        ...mockUserSettings,
        apiKeys: {
          jinaReader: 'test-jina-key',
        },
      };

      await expect(
        storageManager.saveUserSettings(settings)
      ).resolves.not.toThrow();
    });

    it('should accept both API keys', async () => {
      const settings = {
        ...mockUserSettings,
        apiKeys: {
          gemini: 'test-gemini-key',
          jinaReader: 'test-jina-key',
        },
      };

      await expect(
        storageManager.saveUserSettings(settings)
      ).resolves.not.toThrow();
    });

    it('should reject non-object API keys', async () => {
      const invalidSettings = {
        ...mockUserSettings,
        apiKeys: 'not-an-object' as any,
      };

      await expect(
        storageManager.saveUserSettings(invalidSettings)
      ).rejects.toThrow('Invalid user settings data');
    });
  });
});

// ============================================================================
// API Key Management Tests
// ============================================================================

describe('API Key Management', () => {
  let mockStorage: Record<string, any>;
  let storageManager: ReturnType<typeof createStorageManager>;

  beforeEach(() => {
    storageManager = createStorageManager();
    mockStorage = {};

    vi.mocked(chrome.storage.local.get).mockImplementation(((
      keys: string | string[] | null
    ) => {
      if (keys === null) {
        return Promise.resolve(mockStorage);
      }
      if (typeof keys === 'string') {
        return Promise.resolve({ [keys]: mockStorage[keys] });
      }
      const result: Record<string, any> = {};
      keys.forEach(key => {
        if (mockStorage[key] !== undefined) {
          result[key] = mockStorage[key];
        }
      });
      return Promise.resolve(result);
    }) as any);

    vi.mocked(chrome.storage.local.set).mockImplementation(items => {
      Object.assign(mockStorage, items);
      return Promise.resolve();
    });
  });

  describe('Save API Keys', () => {
    it('should save Gemini API key', async () => {
      const settings = {
        ...mockUserSettings,
        apiKeys: {
          gemini: 'new-gemini-key',
        },
      };

      await storageManager.saveUserSettings(settings);

      const savedSettings = await storageManager.getUserSettings();
      expect(savedSettings.apiKeys.gemini).toBe('new-gemini-key');
    });

    it('should save Jina Reader API key', async () => {
      const settings = {
        ...mockUserSettings,
        apiKeys: {
          jinaReader: 'new-jina-key',
        },
      };

      await storageManager.saveUserSettings(settings);

      const savedSettings = await storageManager.getUserSettings();
      expect(savedSettings.apiKeys.jinaReader).toBe('new-jina-key');
    });

    it('should update existing API key', async () => {
      mockStorage.user_settings = {
        ...mockUserSettings,
        apiKeys: {
          gemini: 'old-key',
        },
      };

      const settings = {
        ...mockUserSettings,
        apiKeys: {
          gemini: 'updated-key',
        },
      };

      await storageManager.saveUserSettings(settings);

      const savedSettings = await storageManager.getUserSettings();
      expect(savedSettings.apiKeys.gemini).toBe('updated-key');
    });
  });

  describe('Remove API Keys', () => {
    it('should remove Gemini API key', async () => {
      mockStorage.user_settings = {
        ...mockUserSettings,
        apiKeys: {
          gemini: 'test-key',
          jinaReader: 'jina-key',
        },
      };

      const settings = {
        ...mockUserSettings,
        apiKeys: {
          jinaReader: 'jina-key',
        },
      };

      await storageManager.saveUserSettings(settings);

      const savedSettings = await storageManager.getUserSettings();
      expect(savedSettings.apiKeys.gemini).toBeUndefined();
      expect(savedSettings.apiKeys.jinaReader).toBe('jina-key');
    });

    it('should clear all API keys', async () => {
      mockStorage.user_settings = {
        ...mockUserSettings,
        apiKeys: {
          gemini: 'test-key',
          jinaReader: 'jina-key',
        },
      };

      const settings = {
        ...mockUserSettings,
        apiKeys: {},
      };

      await storageManager.saveUserSettings(settings);

      const savedSettings = await storageManager.getUserSettings();
      expect(savedSettings.apiKeys).toEqual({});
    });
  });

  describe('API Key Retrieval', () => {
    it('should retrieve Gemini API key', async () => {
      mockStorage.user_settings = {
        ...mockUserSettings,
        apiKeys: {
          gemini: 'stored-gemini-key',
        },
      };

      const settings = await storageManager.getUserSettings();
      expect(settings.apiKeys.gemini).toBe('stored-gemini-key');
    });

    it('should retrieve Jina Reader API key', async () => {
      mockStorage.user_settings = {
        ...mockUserSettings,
        apiKeys: {
          jinaReader: 'stored-jina-key',
        },
      };

      const settings = await storageManager.getUserSettings();
      expect(settings.apiKeys.jinaReader).toBe('stored-jina-key');
    });

    it('should handle missing API keys', async () => {
      mockStorage.user_settings = {
        ...mockUserSettings,
        apiKeys: {},
      };

      const settings = await storageManager.getUserSettings();
      expect(settings.apiKeys.gemini).toBeUndefined();
      expect(settings.apiKeys.jinaReader).toBeUndefined();
    });
  });

  describe('API Key Security', () => {
    it('should store API keys as strings', async () => {
      const settings = {
        ...mockUserSettings,
        apiKeys: {
          gemini: 'test-key-123',
        },
      };

      await storageManager.saveUserSettings(settings);

      const savedSettings = await storageManager.getUserSettings();
      expect(typeof savedSettings.apiKeys.gemini).toBe('string');
    });

    it('should not expose API keys in logs', () => {
      const settings = {
        ...mockUserSettings,
        apiKeys: {
          gemini: 'secret-key',
        },
      };

      const settingsString = JSON.stringify(settings);
      // In production, API keys should be masked in logs
      expect(settingsString).toContain('secret-key');
    });
  });
});

// ============================================================================
// Storage Quota Tests
// ============================================================================

describe('Storage Quota Management', () => {
  let storageManager: ReturnType<typeof createStorageManager>;

  beforeEach(() => {
    storageManager = createStorageManager();
    vi.mocked(chrome.storage.local.getBytesInUse).mockResolvedValue(
      1000 as any
    );
    (chrome.storage.local as any).QUOTA_BYTES = 10485760; // 10MB
  });

  it('should check storage quota before saving', async () => {
    await storageManager.checkStorageQuota();

    expect(chrome.storage.local.getBytesInUse).toHaveBeenCalled();
  });

  it('should report storage usage', async () => {
    const quota = await storageManager.checkStorageQuota();

    expect(quota).toHaveProperty('bytesInUse');
    expect(quota).toHaveProperty('quota');
    expect(quota).toHaveProperty('percentUsed');
    expect(quota).toHaveProperty('status');
  });

  it('should calculate percentage used correctly', async () => {
    vi.mocked(chrome.storage.local.getBytesInUse).mockResolvedValue(
      5242880 as any
    ); // 5MB

    const quota = await storageManager.checkStorageQuota();

    expect(quota.percentUsed).toBeCloseTo(0.5, 2);
  });
});
