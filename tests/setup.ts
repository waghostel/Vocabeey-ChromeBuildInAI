/**
 * Test setup file for Vitest
 * Mocks Chrome Extension APIs
 */

import { beforeEach } from 'node:test';

import { vi } from 'vitest';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
  },
  action: {
    onClicked: {
      addListener: vi.fn(),
    },
  },
  tabs: {
    create: vi.fn(),
    onRemoved: {
      addListener: vi.fn(),
    },
  },
  scripting: {
    executeScript: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      getBytesInUse: vi.fn(),
      QUOTA_BYTES: 10485760, // 10MB
    },
    session: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
  },
  downloads: {
    download: vi.fn(),
  },
};

// Add chrome to global scope
global.chrome = mockChrome as any;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
