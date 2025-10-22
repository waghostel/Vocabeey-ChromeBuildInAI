# Testing Guide

## Test Suite Overview

The Language Learning Chrome Extension has a comprehensive test suite with over 700 tests covering unit testing, integration testing, and user acceptance testing.

## Test Structure

### Test Categories

| Category              | Files     | Tests      | Purpose                             |
| --------------------- | --------- | ---------- | ----------------------------------- |
| **Unit Tests**        | 15+ files | 400+ tests | Individual component functionality  |
| **Integration Tests** | 4 files   | 200+ tests | Component interaction and data flow |
| **User Acceptance**   | 1 file    | 50+ tests  | End-to-end user workflows           |
| **System Tests**      | 1 file    | 50+ tests  | Extension lifecycle and performance |

### Test Framework

- **Vitest**: Fast unit testing with TypeScript support
- **jsdom**: DOM implementation for Node.js testing
- **Chrome API Mocks**: Comprehensive extension API simulation
- **Coverage**: V8 provider with HTML/JSON reports

## Running Tests

### Basic Commands

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage report
pnpm test:coverage

# Run with interactive UI
pnpm test:ui

# Run specific test file
pnpm test tests/chrome-ai.test.ts

# Run tests matching pattern
pnpm test --run --reporter=verbose cache
```

### Test Execution Options

```bash
# Run tests with different reporters
pnpm test --reporter=verbose
pnpm test --reporter=json
pnpm test --reporter=html

# Run tests with specific timeout
pnpm test --testTimeout=10000

# Run tests in parallel
pnpm test --threads

# Run tests with debugging
pnpm test --inspect-brk
```

## Test Organization

### Directory Structure

```
tests/
├── setup.ts                    # Global test configuration
├── setup/
│   └── chrome-mock.ts          # Chrome API mocking utilities
├── *.test.ts                   # Unit tests
├── integration.test.ts         # Cross-component integration
├── user-acceptance.test.ts     # End-to-end user workflows
├── system-integration.test.ts  # System-wide integration
└── README.md                   # Test documentation
```

### Test File Naming

- **Unit Tests**: `component-name.test.ts`
- **Integration Tests**: `integration.test.ts`, `cross-component-integration.test.ts`
- **System Tests**: `system-integration.test.ts`, `user-acceptance.test.ts`
- **Setup Files**: `setup.ts`, `setup/chrome-mock.ts`

## Unit Tests

### Core Components Tested

#### 1. Chrome AI Integration (`chrome-ai.test.ts`)

- **58 tests** covering all AI services
- Language detection with caching
- Content summarization and subdivision
- Translation with batch processing
- Vocabulary analysis and filtering
- Error handling and fallback mechanisms

#### 2. Storage System (`storage-system.test.ts`)

- **45 tests** for data persistence
- Schema versioning and migration
- User settings management
- Article and vocabulary storage
- Cache coordination
- Storage quota management

#### 3. Cache Management (`cache-manager.test.ts`)

- **35 tests** for caching functionality
- LRU cache implementation
- Content hash generation
- Cache expiration and cleanup
- Memory usage optimization

#### 4. Content Extraction (`content-extraction.test.ts`)

- **40 tests** for content processing
- Readability.js integration
- Fallback extraction methods
- Content sanitization
- Metadata extraction

#### 5. Error Handling (`error-handling.test.ts`)

- **67 tests** for error scenarios
- Retry logic with exponential backoff
- User-friendly error messages
- Network timeout handling
- Offline mode capabilities

### Unit Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChromeLanguageDetector } from '../src/utils/chrome-ai';

describe('ChromeLanguageDetector', () => {
  let detector: ChromeLanguageDetector;

  beforeEach(() => {
    vi.clearAllMocks();
    detector = new ChromeLanguageDetector();
  });

  it('should detect language correctly', async () => {
    // Mock Chrome AI API
    const mockDetector = {
      detect: vi
        .fn()
        .mockResolvedValue([{ detectedLanguage: 'en', confidence: 0.9 }]),
    };

    vi.mocked(window.ai.languageDetector.create).mockResolvedValue(
      mockDetector
    );

    const result = await detector.detectLanguage('Hello world');

    expect(result).toBe('en');
    expect(mockDetector.detect).toHaveBeenCalledWith('Hello world');
  });

  it('should cache detection results', async () => {
    const mockDetector = {
      detect: vi
        .fn()
        .mockResolvedValue([{ detectedLanguage: 'en', confidence: 0.9 }]),
    };

    vi.mocked(window.ai.languageDetector.create).mockResolvedValue(
      mockDetector
    );

    // First call
    await detector.detectLanguage('Hello world');
    // Second call (should use cache)
    await detector.detectLanguage('Hello world');

    expect(mockDetector.detect).toHaveBeenCalledTimes(1);
  });
});
```

## Integration Tests

### Cross-Component Integration (`cross-component-integration.test.ts`)

Tests interaction between different system components:

#### 1. Service Worker ↔ Content Script Communication

```typescript
describe('Service Worker to Content Script Communication', () => {
  it('should handle content extraction workflow', async () => {
    // Mock content script injection
    const mockExecuteScript = vi
      .fn()
      .mockResolvedValue([{ result: 'success' }]);
    vi.mocked(chrome.scripting.executeScript).mockImplementation(
      mockExecuteScript
    );

    // Simulate extension icon click
    await handleExtensionIconClick({ id: 1, url: 'https://example.com' });

    expect(mockExecuteScript).toHaveBeenCalledWith({
      target: { tabId: 1 },
      function: expect.any(Function),
    });
  });
});
```

#### 2. AI Processing Pipeline Integration

```typescript
describe('AI Processing Pipeline Integration', () => {
  it('should coordinate multiple AI services', async () => {
    const coordinator = new AIServiceCoordinator();

    const result = await coordinator.processArticle({
      content: 'Sample article content...',
      language: 'en',
      difficulty: 5,
    });

    expect(result).toMatchObject({
      processedContent: expect.any(String),
      vocabulary: expect.any(Array),
      translations: expect.any(Array),
      analyses: expect.any(Array),
    });
  });
});
```

#### 3. Storage and Cache Integration

```typescript
describe('Storage and Cache Integration', () => {
  it('should coordinate between storage and cache', async () => {
    const storageManager = new StorageManager();
    const cacheManager = getCacheManager();

    // Store article
    await storageManager.storeArticle(sampleArticle);

    // Verify cache updated
    const cached = await cacheManager.getArticle(sampleArticle.id);
    expect(cached).toEqual(sampleArticle);
  });
});
```

### System Integration (`system-integration.test.ts`)

Tests complete system workflows:

#### 1. End-to-End Article Processing

```typescript
describe('Complete Article Processing Workflow', () => {
  it('should process article from URL to learning interface', async () => {
    // Mock all system components
    setupSystemMocks();

    // Simulate user clicking extension icon
    await simulateExtensionIconClick('https://example.com/article');

    // Verify complete workflow
    expect(mockContentExtraction).toHaveBeenCalled();
    expect(mockAIProcessing).toHaveBeenCalled();
    expect(mockStorageUpdate).toHaveBeenCalled();
    expect(mockLearningInterfaceOpen).toHaveBeenCalled();
  });
});
```

#### 2. Multi-Tab Session Management

```typescript
describe('Multi-Tab and Session Management', () => {
  it('should handle multiple learning interface tabs', async () => {
    // Create multiple learning interface tabs
    const tab1 = await createLearningInterfaceTab('article1');
    const tab2 = await createLearningInterfaceTab('article2');

    // Verify independent session management
    expect(getSessionData(tab1.id)).not.toEqual(getSessionData(tab2.id));

    // Verify cleanup on tab close
    await simulateTabClose(tab1.id);
    expect(getSessionData(tab1.id)).toBeUndefined();
  });
});
```

## User Acceptance Tests

### Complete User Workflows (`user-acceptance.test.ts`)

Tests end-to-end user scenarios:

#### 1. First-Time User Setup

```typescript
describe('First-Time User Setup Workflow', () => {
  it('should guide user through complete setup', async () => {
    // Simulate fresh installation
    await simulateExtensionInstallation();

    // Verify setup wizard appears
    expect(await getSetupWizardState()).toBe('welcome');

    // Complete setup steps
    await completeLanguageSelection('es');
    await completeDifficultySelection(5);
    await completeAPIKeySetup('optional');
    await completeTutorial();

    // Verify setup completion
    const settings = await getUserSettings();
    expect(settings.nativeLanguage).toBe('es');
    expect(settings.difficultyLevel).toBe(5);
    expect(settings.setupCompleted).toBe(true);
  });
});
```

#### 2. Article Learning Workflow

```typescript
describe('Article Learning Workflow', () => {
  it('should support complete learning workflow', async () => {
    // Setup user with preferences
    await setupUserWithPreferences();

    // Process article
    const articleUrl = 'https://example.com/article';
    await processArticleFromUrl(articleUrl);

    // Verify learning interface
    const learningInterface = await getLearningInterface();
    expect(learningInterface.mode).toBe('reading');
    expect(learningInterface.parts).toHaveLength(3);

    // Test vocabulary highlighting
    await highlightVocabulary('example');
    const vocabulary = await getVocabularyCards();
    expect(vocabulary).toContainEqual(
      expect.objectContaining({ word: 'example' })
    );

    // Test mode switching
    await switchToVocabularyMode();
    expect(await getCurrentMode()).toBe('vocabulary');

    // Test TTS functionality
    await testTextToSpeech('example');
    expect(mockTTSService.speak).toHaveBeenCalledWith('example');
  });
});
```

## Test Utilities and Mocks

### Chrome API Mocking (`setup/chrome-mock.ts`)

Comprehensive Chrome extension API mocks:

```typescript
export function mockChromeStorage(initialData = {}) {
  const storage = { ...initialData };

  const mockGet = vi.fn().mockImplementation(keys => {
    if (keys === null) return Promise.resolve(storage);
    if (typeof keys === 'string')
      return Promise.resolve({ [keys]: storage[keys] });
    if (Array.isArray(keys)) {
      const result = {};
      keys.forEach(key => (result[key] = storage[key]));
      return Promise.resolve(result);
    }
    return Promise.resolve({});
  });

  const mockSet = vi.fn().mockImplementation(items => {
    Object.assign(storage, items);
    return Promise.resolve();
  });

  vi.mocked(chrome.storage.local.get).mockImplementation(mockGet);
  vi.mocked(chrome.storage.local.set).mockImplementation(mockSet);

  return () => {
    vi.mocked(chrome.storage.local.get).mockReset();
    vi.mocked(chrome.storage.local.set).mockReset();
  };
}
```

### AI Service Mocking

```typescript
export function mockChromeAI() {
  const mockLanguageDetector = {
    detect: vi
      .fn()
      .mockResolvedValue([{ detectedLanguage: 'en', confidence: 0.9 }]),
    destroy: vi.fn(),
  };

  const mockSummarizer = {
    summarize: vi.fn().mockResolvedValue('Summarized content'),
    destroy: vi.fn(),
  };

  const mockTranslator = {
    translate: vi.fn().mockResolvedValue('Translated text'),
    destroy: vi.fn(),
  };

  vi.mocked(window.ai.languageDetector.create).mockResolvedValue(
    mockLanguageDetector
  );
  vi.mocked(window.ai.summarizer.create).mockResolvedValue(mockSummarizer);
  vi.mocked(window.ai.translator.create).mockResolvedValue(mockTranslator);

  return {
    mockLanguageDetector,
    mockSummarizer,
    mockTranslator,
  };
}
```

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', 'dist/', '**/*.d.ts'],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```

### Global Test Setup (`tests/setup.ts`)

```typescript
import { vi } from 'vitest';
import { mockChromeAPIs } from './setup/chrome-mock';

// Setup Chrome API mocks
beforeEach(() => {
  mockChromeAPIs();
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  createMockArticle: () => ({
    /* mock article data */
  }),
  createMockUser: () => ({
    /* mock user data */
  }),
  simulateUserInteraction: async action => {
    /* simulation logic */
  },
};
```

## Coverage Reports

### Coverage Targets

- **Overall Coverage**: >90%
- **Function Coverage**: >95%
- **Branch Coverage**: >85%
- **Line Coverage**: >90%

### Coverage by Component

| Component | Lines | Functions | Branches | Statements |
| --------- | ----- | --------- | -------- | ---------- |
| Chrome AI | 95%   | 98%       | 90%      | 95%        |
| Storage   | 92%   | 95%       | 88%      | 92%        |
| Cache     | 90%   | 93%       | 85%      | 90%        |
| Content   | 88%   | 90%       | 82%      | 88%        |
| UI        | 85%   | 88%       | 80%      | 85%        |

### Generating Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# View HTML coverage report
open coverage/index.html

# View JSON coverage data
cat coverage/coverage-final.json
```

## Continuous Integration

### GitHub Actions Integration

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json
```

### Quality Gates

- All tests must pass
- Coverage thresholds must be met
- No linting errors
- TypeScript compilation successful

## Debugging Tests

### Debug Configuration

```bash
# Run tests with debugging
pnpm test --inspect-brk

# Run specific test with debugging
pnpm test --inspect-brk tests/chrome-ai.test.ts

# Run tests with verbose output
pnpm test --reporter=verbose

# Run tests with UI for interactive debugging
pnpm test:ui
```

### Common Debugging Techniques

1. **Console Logging**: Add `console.log` statements in tests
2. **Breakpoints**: Use `debugger` statements
3. **Mock Inspection**: Verify mock calls and arguments
4. **State Inspection**: Check component state at different points
5. **Async Debugging**: Use `await` and proper promise handling

## Best Practices

### Test Writing Guidelines

1. **Descriptive Names**: Test names should clearly describe what is being tested
2. **Single Responsibility**: Each test should test one specific behavior
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
4. **Mock Isolation**: Use mocks to isolate components under test
5. **Cleanup**: Always clean up resources and mocks after tests

### Performance Considerations

1. **Parallel Execution**: Tests run in parallel by default
2. **Mock Efficiency**: Use lightweight mocks for better performance
3. **Resource Management**: Clean up resources to prevent memory leaks
4. **Timeout Management**: Set appropriate timeouts for async operations

### Maintenance

1. **Regular Updates**: Keep tests updated with code changes
2. **Coverage Monitoring**: Monitor coverage trends over time
3. **Flaky Test Detection**: Identify and fix unreliable tests
4. **Documentation**: Keep test documentation current

This comprehensive testing guide ensures the Language Learning Chrome Extension maintains high quality and reliability through thorough automated testing.
