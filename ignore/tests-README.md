# Unit Tests for Language Learning Extension

This directory contains comprehensive unit tests for the extension foundation components.

## Test Structure

### Test Files

- **manifest.test.ts** - Validates the Chrome Extension manifest configuration
- **service-worker.test.ts** - Tests the background service worker functionality
- **content-script.test.ts** - Tests content extraction and page interaction

### Setup Files

- **setup.ts** - Test environment setup with Chrome API mocks
- **vitest.config.ts** - Vitest configuration (in project root)
- **tsconfig.test.json** - TypeScript configuration for tests (in project root)

## Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

## Test Coverage

### Manifest Validation (11 tests)

- ✓ Manifest version 3 compliance
- ✓ Required extension metadata
- ✓ Permissions configuration
- ✓ Background service worker setup
- ✓ Content scripts configuration
- ✓ Extension icons
- ✓ Web accessible resources
- ✓ Content security policy
- ✓ No deprecated Manifest V2 fields

### Service Worker (22 tests)

- ✓ Extension icon click handling
- ✓ Content script injection
- ✓ Message handling (CONTENT_EXTRACTED, CHECK_SYSTEM_CAPABILITIES, OPEN_LEARNING_INTERFACE)
- ✓ Learning interface tab management
- ✓ System capabilities detection (Chrome AI APIs)
- ✓ Tab cleanup and resource management
- ✓ Extension installation and settings initialization
- ✓ Error handling for storage and tab operations

### Content Script (38 tests)

- ✓ Content extraction from various HTML structures
- ✓ Title extraction strategies
- ✓ Content sanitization (removing scripts, ads, navigation)
- ✓ Message communication with background script
- ✓ User notifications (success/error)
- ✓ URL validation
- ✓ Content validation (length, text presence)
- ✓ Edge cases (empty documents, nested structures, malformed HTML)

## Test Framework

- **Vitest** - Fast unit test framework with TypeScript support
- **jsdom** - DOM implementation for Node.js
- **@testing-library/dom** - DOM testing utilities

## Chrome API Mocking

The test setup includes comprehensive mocks for Chrome Extension APIs:

- `chrome.runtime` - Message passing and extension lifecycle
- `chrome.action` - Extension icon interactions
- `chrome.tabs` - Tab management
- `chrome.scripting` - Content script injection
- `chrome.storage` - Local and session storage

## Requirements Coverage

These tests cover the following requirements from the specification:

- **Requirement 1.1, 1.2, 1.3** - Content extraction and processing
- **Requirement 8.1, 8.2** - Data storage and management
- **Requirement 10.1, 10.2** - Extension permissions and configuration

## Adding New Tests

When adding new tests:

1. Create a new test file in the `tests/` directory
2. Import necessary utilities from vitest
3. Use the Chrome API mocks from `setup.ts`
4. Follow the existing test structure and naming conventions
5. Run tests to ensure they pass

Example:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('My Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines and can be integrated with:

- GitHub Actions
- GitLab CI
- Jenkins
- Other CI/CD platforms

The tests run quickly (< 5 seconds) and provide comprehensive coverage of the extension foundation.
