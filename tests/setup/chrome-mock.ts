/**
 * Chrome API Mocks for Testing
 * Provides mock implementations of Chrome extension APIs
 */

import { vi } from 'vitest';

/**
 * Mock chrome.storage.local API
 */
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
              if (key in storage) {
                result[key] = storage[key];
              }
            });
            return Promise.resolve(result);
          }
          if (keys === null || keys === undefined) {
            return Promise.resolve({ ...storage });
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
      session: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
      },
    },
  } as any;

  return {
    storage,
    cleanup: () => {
      // Clear the storage object completely
      Object.keys(storage).forEach(key => delete storage[key]);
      delete (global as any).chrome;
    },
  };
}

/**
 * Mock chrome.offscreen API
 */
export function mockChromeOffscreen() {
  if (!global.chrome) {
    global.chrome = {} as any;
  }

  (global.chrome as any).offscreen = {
    createDocument: vi.fn().mockResolvedValue(undefined),
    closeDocument: vi.fn().mockResolvedValue(undefined),
    Reason: {
      DOM_PARSER: 'DOM_PARSER',
      USER_MEDIA: 'USER_MEDIA',
    },
  };

  return () => {
    delete (global.chrome as any).offscreen;
  };
}

/**
 * Mock chrome.tabs API
 */
export function mockChromeTabs() {
  if (!global.chrome) {
    global.chrome = {} as any;
  }

  const listeners = new Set<Function>();

  (global.chrome as any).tabs = {
    onRemoved: {
      addListener: vi.fn((listener: Function) => {
        listeners.add(listener);
      }),
      removeListener: vi.fn((listener: Function) => {
        listeners.delete(listener);
      }),
    },
    onUpdated: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  };

  return () => {
    delete (global.chrome as any).tabs;
  };
}

/**
 * Mock chrome.runtime API
 */
export function mockChromeRuntime() {
  if (!global.chrome) {
    global.chrome = {} as any;
  }

  const messageListeners = new Set<Function>();

  (global.chrome as any).runtime = {
    onMessage: {
      addListener: vi.fn((listener: Function) => {
        messageListeners.add(listener);
      }),
      removeListener: vi.fn((listener: Function) => {
        messageListeners.delete(listener);
      }),
    },
    sendMessage: vi.fn().mockResolvedValue(undefined),
    getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
  };

  return () => {
    delete (global.chrome as any).runtime;
  };
}
