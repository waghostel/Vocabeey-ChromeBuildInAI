# Testing Guide

## Test Suite Overview

The Language Learning Chrome Extension has a comprehensive test suite covering unit testing, integration testing, performance testing, and user acceptance testing. The test suite is built with Vitest and includes extensive Chrome API mocking for reliable extension testing.

## Test Structure

### Test Categories

| Category                  | Files     | Purpose                                 |
| ------------------------- | --------- | --------------------------------------- |
| **Unit Tests**            | 15+ files | Individual component functionality      |
| **Integration Tests**     | 4 files   | Component interaction and data flow     |
| **Performance Tests**     | 3 files   | Memory usage and caching performance    |
| **User Acceptance Tests** | 1 file    | End-to-end user workflows               |
| **System Integration**    | 1 file    | Extension lifecycle and cross-component |
| **Error Handling Tests**  | 2 files   | Error scenarios and recovery mechanisms |

### Test Framework

- **Vitest**: Fast unit testing with TypeScript support and ES modules
- **jsdom**: DOM implementation for Node.js testing environment
- **Chrome API Mocks**: Comprehensive extension API simulation in `tests/setup/`
- **Coverage**: V8 provider with HTML/JSON/text reports
- **TypeScript**: Full TypeScript support with strict type checking

## Running Tests

### Basic Commands

```bash
# Run all tests once (production mode)
pnpm test

# Run tests in watch mode (development)
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
pnpm test --reporter=verbose    # Detailed output
pnpm test --reporter=json       # JSON format
pnpm test --reporter=html       # HTML report

# Run tests with specific timeout (default: 10000ms)
pnpm test --testTimeout=15000

# Run tests in parallel (default behavior)
pnpm test --threads

# Run tests with debugging
pnpm test --inspect-brk

# Run tests without coverage
pnpm test --run --no-coverage

# Run tests with specific environment
pnpm test --environment=jsdom
```

### Package.json Scripts

The following test scripts are available in `package.json`:

- `pnpm test` - Run all tests once with Vitest
- `pnpm test:watch` - Run tests in watch mode for development
- `pnpm test:ui` - Launch Vitest UI for interactive testing
- `pnpm test:coverage` - Generate coverage reports (HTML, JSON, text)
- `pnpm validate:extension` - Full validation pipeline (lint + test + build)

## Test Organization

### Directory Structure

```
tests/
├── setup.ts                           # Global test configuration and Chrome API mocks
├── setup/
│   └── chrome-mock.ts                 # Specialized Chrome API mocking utilities
├── ai-fallback.test.ts                # AI service fallback mechanisms
├── batch-processor-integration.test.ts # Batch processing integration
├── cache-manager.test.ts              # Cache management functionality
├── cache-manager-edge-cases.test.ts   # Cache edge cases and error scenarios
├── cache-performance-benchmark.test.ts # Cache performance testing
├── chrome-ai.test.ts                  # Chrome Built-in AI API integration
├── content-extraction.test.ts         # Content extraction pipeline
├── content-script.test.ts             # Content script functionality
├── cross-component-integration.test.ts # Cross-component integration
├── error-handling.test.ts             # Error handling and recovery
├── error-scenarios.test.ts            # Error scenario testing
├── integration.test.ts                # Main integration tests
├── manifest.test.ts                   # Extension manifest validation
├── memory-management.test.ts          # Memory usage optimization
├── performance.test.ts                # Performance benchmarking
├── service-worker.test.ts             # Background service worker
├── settings-system.test.ts            # User settings management
├── storage-system.test.ts             # Data persistence and storage
├── system-integration.test.ts         # System-wide integration
├── tts-service.test.ts                # Text-to-speech functionality
├── ui-components.test.ts              # User interface components
└── user-acceptance.test.ts            # End-to-end user workflows
```

### Test File Naming Conventions

- **Component Tests**: `component-name.test.ts` (e.g., `chrome-ai.test.ts`)
- **Integration Tests**: `*-integration.test.ts` (e.g., `system-integration.test.ts`)
- **Performance Tests**: `*-performance*.test.ts` (e.g., `cache-performance-benchmark.test.ts`)
- **Edge Case Tests**: `*-edge-cases.test.ts` (e.g., `cache-manager-edge-cases.test.ts`)
- **Error Tests**: `error-*.test.ts` (e.g., `error-handling.test.ts`)
- **Setup Files**: `setup.ts`, `setup/*.ts`

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

### Chrome API Mocking (`tests/setup.ts` and `tests/setup/chrome-mock.ts`)

The test suite includes comprehensive Chrome extension API mocks:

#### Global Setup (`tests/setup.ts`)

```typescript
/**
 * Test setup file for Vitest
 * Mocks Chrome Extension APIs globally
 */
import { beforeEach } from 'node:test';
import { vi } from 'vitest';

// Mock Chrome APIs globally
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
  },
  action: { onClicked: { addListener: vi.fn() } },
  tabs: { create: vi.fn(), onRemoved: { addListener: vi.fn() } },
  scripting: { executeScript: vi.fn() },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
      QUOTA_BYTES: 10485760, // 10MB
    },
    session: { get: vi.fn(), set: vi.fn(), remove: vi.fn(), clear: vi.fn() },
  },
  downloads: { download: vi.fn() },
};

global.chrome = mockChrome as any;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
```

#### Specialized Mocks (`tests/setup/chrome-mock.ts`)

```typescript
/**
 * Chrome API Mocks for Testing
 * Provides specialized mock implementations
 */

// Mock chrome.storage with state management
export function mockChromeStorage(initialData: Record<string, any> = {}) {
  const storage = { ...initialData };

  global.chrome = {
    storage: {
      local: {
        get: vi.fn().mockImplementation(keys => {
          if (typeof keys === 'string') {
            return Promise.resolve({ [keys]: storage[keys] });
          }
          if (Array.isArray(keys)) {
            const result: Record<string, any> = {};
            keys.forEach(key => {
              if (key in storage) result[key] = storage[key];
            });
            return Promise.resolve(result);
          }
          return Promise.resolve({ ...storage });
        }),
        set: vi.fn().mockImplementation(items => {
          Object.assign(storage, items);
          return Promise.resolve();
        }),
        remove: vi.fn().mockImplementation(keys => {
          const keysArray = Array.isArray(keys) ? keys : [keys];
          keysArray.forEach(key => delete storage[key]);
          return Promise.resolve();
        }),
        clear: vi.fn().mockImplementation(() => {
          Object.keys(storage).forEach(key => delete storage[key]);
          return Promise.resolve();
        }),
        getBytesInUse: vi.fn().mockImplementation(() => {
          const dataSize = JSON.stringify(storage).length;
          return Promise.resolve(dataSize);
        }),
      },
    },
  } as any;

  return { storage, cleanup: () => delete (global as any).chrome };
}

// Mock chrome.offscreen API
export function mockChromeOffscreen() {
  if (!global.chrome) global.chrome = {} as any;

  (global.chrome as any).offscreen = {
    createDocument: vi.fn().mockResolvedValue(undefined),
    closeDocument: vi.fn().mockResolvedValue(undefined),
    Reason: { DOM_PARSER: 'DOM_PARSER', USER_MEDIA: 'USER_MEDIA' },
  };

  return () => delete (global.chrome as any).offscreen;
}

// Mock chrome.tabs API
export function mockChromeTabs() {
  const listeners = new Set<Function>();

  (global.chrome as any).tabs = {
    onRemoved: {
      addListener: vi.fn((listener: Function) => listeners.add(listener)),
      removeListener: vi.fn((listener: Function) => listeners.delete(listener)),
    },
    onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
  };

  return () => delete (global.chrome as any).tabs;
}

// Mock chrome.runtime API
export function mockChromeRuntime() {
  const messageListeners = new Set<Function>();

  (global.chrome as any).runtime = {
    onMessage: {
      addListener: vi.fn((listener: Function) =>
        messageListeners.add(listener)
      ),
      removeListener: vi.fn((listener: Function) =>
        messageListeners.delete(listener)
      ),
    },
    sendMessage: vi.fn().mockResolvedValue(undefined),
    getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
  };

  return () => delete (global.chrome as any).runtime;
}
```

## Test Configuration

### Vitest Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Enable global test functions
    environment: 'jsdom', // DOM environment for browser testing
    setupFiles: ['./tests/setup.ts'], // Global setup file
    coverage: {
      provider: 'v8', // V8 coverage provider
      reporter: ['text', 'json', 'html'], // Multiple report formats
      exclude: [
        // Exclude from coverage
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.config.*',
      ],
    },
    typecheck: {
      enabled: false, // Disable type checking in tests
    },
  },
});
```

### Global Test Setup (`tests/setup.ts`)

The global setup file configures Chrome API mocks and test utilities:

```typescript
/**
 * Test setup file for Vitest
 * Mocks Chrome Extension APIs
 */
import { beforeEach } from 'node:test';
import { vi } from 'vitest';

// Mock Chrome APIs globally for all tests
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn(), removeListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
  },
  action: { onClicked: { addListener: vi.fn() } },
  tabs: { create: vi.fn(), onRemoved: { addListener: vi.fn() } },
  scripting: { executeScript: vi.fn() },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
      QUOTA_BYTES: 10485760, // 10MB
    },
    session: { get: vi.fn(), set: vi.fn(), remove: vi.fn(), clear: vi.fn() },
  },
  downloads: { download: vi.fn() },
};

// Add chrome to global scope
global.chrome = mockChrome as any;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
```

### Test Environment Configuration

- **Environment**: jsdom for DOM manipulation testing
- **Globals**: Enabled for convenient test function access
- **Setup Files**: Automatic Chrome API mocking
- **TypeScript**: Full TypeScript support with strict checking
- **Timeouts**: Default 5000ms test timeout, configurable per test

## Coverage Reports

### Coverage Configuration

Coverage is provided by V8 with multiple output formats:

- **Text**: Console output during test runs
- **HTML**: Interactive coverage report in `coverage/index.html`
- **JSON**: Machine-readable data in `coverage/coverage-final.json`

### Coverage Targets

- **Overall Coverage**: Target >85%
- **Function Coverage**: Target >90%
- **Branch Coverage**: Target >80%
- **Line Coverage**: Target >85%

### Generating Coverage Reports

```bash
# Generate coverage report with all formats
pnpm test:coverage

# View HTML coverage report (Windows)
start coverage/index.html

# View HTML coverage report (cross-platform)
npx serve coverage

# View JSON coverage data
type coverage\coverage-final.json

# Generate coverage without running tests (if coverage data exists)
npx vitest --coverage --run --reporter=html
```

### Coverage Output Structure

```
coverage/
├── index.html              # Main coverage report
├── coverage-final.json     # JSON coverage data
├── base.css               # Report styling
├── block-navigation.js    # Report navigation
├── prettify.css          # Code syntax highlighting
├── prettify.js           # Code formatting
├── sorter.js             # Table sorting functionality
└── [component-folders]/   # Individual component coverage
```

### Excluded from Coverage

The following are excluded from coverage analysis:

- `node_modules/` - Third-party dependencies
- `dist/` - Build output
- `tests/` - Test files themselves
- `**/*.config.*` - Configuration files

## Testing Strategy

### Test Categories and Focus

#### Unit Tests

- **Focus**: Individual component functionality
- **Isolation**: Heavy use of mocks for external dependencies
- **Coverage**: Core business logic and utility functions
- **Examples**: `chrome-ai.test.ts`, `cache-manager.test.ts`, `storage-system.test.ts`

#### Integration Tests

- **Focus**: Component interaction and data flow
- **Scope**: Cross-component communication and workflows
- **Examples**: `integration.test.ts`, `cross-component-integration.test.ts`

#### Performance Tests

- **Focus**: Memory usage, caching efficiency, and benchmarking
- **Tools**: Custom performance measurement utilities
- **Examples**: `cache-performance-benchmark.test.ts`, `memory-management.test.ts`

#### Error Handling Tests

- **Focus**: Error scenarios, recovery mechanisms, and edge cases
- **Coverage**: Network failures, API errors, invalid inputs
- **Examples**: `error-handling.test.ts`, `error-scenarios.test.ts`

#### System Integration Tests

- **Focus**: Complete workflows and extension lifecycle
- **Scope**: End-to-end functionality without external dependencies
- **Examples**: `system-integration.test.ts`, `user-acceptance.test.ts`

### Test Execution Strategy

#### Development Workflow

```bash
# Watch mode for active development
pnpm test:watch

# Quick validation during development
pnpm test --run --reporter=basic

# Full validation before commits
pnpm validate:extension  # Includes lint + test + build
```

#### CI/CD Integration

```bash
# Production test run (used in CI)
pnpm test

# Coverage generation for reports
pnpm test:coverage
```

## Continuous Integration

### Validation Pipeline

The extension uses a comprehensive validation pipeline:

```bash
# Full extension validation (package.json script)
pnpm validate:extension
```

This runs:

1. **Linting**: `pnpm lint:extension` (Oxlint + Prettier)
2. **Testing**: `pnpm test` (all tests with Vitest)
3. **Building**: `pnpm build` (TypeScript compilation + asset copying)

### Quality Gates

#### Required Checks

- ✅ All tests must pass
- ✅ No linting errors (Oxlint + Prettier)
- ✅ TypeScript compilation successful
- ✅ Extension manifest validation
- ✅ Asset copying successful

#### Optional Checks

- 📊 Coverage reporting (informational)
- 🔍 Performance benchmarks (monitoring)
- 📝 Documentation updates (manual review)

### Local Development Integration

#### Git Hooks (Husky)

```bash
# Pre-commit hook runs automatically
# Configured in .husky/pre-commit
pnpm lint:fix  # Auto-fix linting issues
pnpm format    # Format code with Prettier
```

#### Lint-staged Configuration

```json
{
  "lint-staged": {
    "*.{ts,js}": ["prettier --write", "oxlint --fix"],
    "*.{json,md}": ["prettier --write"],
    "manifest.json": ["prettier --write"],
    "src/**/*.{html,css}": ["prettier --write"]
  }
}
```

## Debugging Tests

### Debug Configuration

```bash
# Run tests with Node.js debugging
pnpm test --inspect-brk

# Run specific test file with debugging
pnpm test --inspect-brk tests/chrome-ai.test.ts

# Run tests with verbose output
pnpm test --reporter=verbose

# Run tests with UI for interactive debugging
pnpm test:ui

# Run tests with detailed error output
pnpm test --reporter=verbose --no-coverage

# Debug specific test pattern
pnpm test --inspect-brk --run --reporter=verbose cache
```

### Debugging Approaches

#### 1. Interactive UI Debugging

```bash
# Launch Vitest UI for visual debugging
pnpm test:ui
```

The Vitest UI provides:

- Visual test runner with real-time results
- Interactive test filtering and search
- Detailed error messages and stack traces
- Coverage visualization
- Test re-running on file changes

#### 2. Console Debugging

```typescript
// Add console.log statements in tests
describe('Chrome AI Integration', () => {
  it('should detect language', async () => {
    console.log('Starting language detection test');
    const result = await detector.detectLanguage('Hello world');
    console.log('Detection result:', result);
    expect(result).toBe('en');
  });
});
```

#### 3. Mock Inspection

```typescript
// Verify mock calls and arguments
it('should call Chrome API correctly', async () => {
  await chromeAI.detectLanguage('test text');

  // Inspect mock calls
  console.log(
    'Mock calls:',
    vi.mocked(chrome.ai.languageDetector.create).mock.calls
  );
  expect(vi.mocked(chrome.ai.languageDetector.create)).toHaveBeenCalledTimes(1);
});
```

#### 4. Async Debugging

```typescript
// Debug async operations with proper error handling
it('should handle async operations', async () => {
  try {
    const result = await asyncOperation();
    console.log('Async result:', result);
    expect(result).toBeDefined();
  } catch (error) {
    console.error('Async error:', error);
    throw error;
  }
});
```

### Common Debugging Scenarios

#### Test Failures

1. **Check Mock Setup**: Ensure Chrome APIs are properly mocked
2. **Verify Async Handling**: Use proper `await` statements
3. **Inspect Error Messages**: Read full error output for context
4. **Check Test Isolation**: Ensure tests don't interfere with each other

#### Performance Issues

1. **Use `--reporter=verbose`** to see slow tests
2. **Check for Memory Leaks** in long-running test suites
3. **Optimize Mock Setup** to reduce overhead
4. **Use `--threads=false`** to disable parallelization for debugging

## Best Practices

### Test Writing Guidelines

#### 1. Descriptive Test Names

```typescript
// ✅ Good: Describes what is being tested
it('should cache language detection results for identical text', async () => {
  // test implementation
});

// ❌ Bad: Vague and unclear
it('should work correctly', async () => {
  // test implementation
});
```

#### 2. Arrange-Act-Assert Pattern

```typescript
it('should store article with correct metadata', async () => {
  // Arrange
  const mockStorage = mockChromeStorage();
  const storageManager = new StorageManager();
  const article = createMockArticle();

  // Act
  await storageManager.storeArticle(article);

  // Assert
  expect(chrome.storage.local.set).toHaveBeenCalledWith({
    [`article_${article.id}`]: article,
  });
});
```

#### 3. Proper Mock Isolation

```typescript
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();

  // Setup fresh mock storage
  mockStorage = mockChromeStorage();

  // Reset singleton instances
  resetCacheManagerInstance();
});

afterEach(() => {
  // Cleanup resources
  mockStorage.cleanup();
});
```

#### 4. Async Test Handling

```typescript
// ✅ Good: Proper async/await usage
it('should handle async operations correctly', async () => {
  const result = await asyncOperation();
  expect(result).toBeDefined();
});

// ❌ Bad: Missing await
it('should handle async operations correctly', () => {
  const result = asyncOperation(); // Returns Promise, not result
  expect(result).toBeDefined(); // Will fail
});
```

### Performance Considerations

#### 1. Efficient Mock Setup

- Use lightweight mocks that only implement needed functionality
- Avoid over-mocking APIs that aren't used in specific tests
- Reset mocks efficiently with `vi.clearAllMocks()`

#### 2. Resource Management

```typescript
afterEach(async () => {
  // Clean up storage
  await chrome.storage.local.clear();

  // Reset singleton instances
  resetCacheManagerInstance();

  // Clear all mocks
  vi.clearAllMocks();

  // Cleanup mock utilities
  mockStorage.cleanup();
});
```

#### 3. Parallel Test Execution

- Tests run in parallel by default (Vitest)
- Ensure tests are isolated and don't share state
- Use unique identifiers for test data to avoid conflicts

### Test Maintenance

#### 1. Regular Updates

- Update tests when changing component interfaces
- Maintain test coverage as new features are added
- Remove obsolete tests for deprecated functionality

#### 2. Coverage Monitoring

```bash
# Monitor coverage trends
pnpm test:coverage

# Check coverage for specific components
pnpm test:coverage --reporter=html
```

#### 3. Flaky Test Detection

- Identify tests that fail intermittently
- Fix timing issues with proper async handling
- Ensure proper cleanup to prevent state leakage

#### 4. Documentation Maintenance

- Keep test documentation current with codebase changes
- Document complex test scenarios and their purposes
- Update debugging guides when new tools are introduced

### Common Pitfalls to Avoid

#### 1. Improper Async Handling

```typescript
// ❌ Bad: Not awaiting async operations
it('should process data', () => {
  processData(); // If this is async, test will complete before processing
  expect(result).toBe(expected);
});

// ✅ Good: Proper async handling
it('should process data', async () => {
  await processData();
  expect(result).toBe(expected);
});
```

#### 2. Shared Test State

```typescript
// ❌ Bad: Shared state between tests
let sharedData = {};

it('test 1', () => {
  sharedData.value = 'test1';
  // test logic
});

it('test 2', () => {
  // This test depends on test 1's state
  expect(sharedData.value).toBe('test1');
});

// ✅ Good: Isolated test state
it('test 1', () => {
  const localData = { value: 'test1' };
  // test logic with localData
});

it('test 2', () => {
  const localData = { value: 'test2' };
  // independent test logic
});
```

#### 3. Over-mocking

```typescript
// ❌ Bad: Mocking everything unnecessarily
vi.mock('../src/utils/every-utility');
vi.mock('../src/types/all-types');
vi.mock('../src/components/all-components');

// ✅ Good: Mock only what's needed
vi.mock('../src/utils/chrome-ai', () => ({
  ChromeLanguageDetector: vi.fn(),
}));
```

## Related Documentation

- **[Development Guide](../development/README.md)** - Setup and contribution guidelines
- **[Architecture Overview](../architecture/README.md)** - System design and component relationships
- **[API Reference](../api/README.md)** - Chrome AI integration details
- **[User Guide](../user-guide/README.md)** - End-user feature documentation

This comprehensive testing guide ensures the Language Learning Chrome Extension maintains high quality and reliability through thorough automated testing with proper practices and maintenance strategies.
