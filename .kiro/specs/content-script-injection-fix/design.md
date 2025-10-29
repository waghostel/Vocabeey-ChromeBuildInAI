# Content Script Injection Fix Design

## Overview

The Chrome extension is failing to inject content scripts due to incorrect file path references in the service worker. The root cause is that the service worker is using `'dist/content/content-script.js'` as the file path, but Chrome extensions resolve paths relative to the extension root directory, not including the `dist/` prefix.

## Architecture

### Current Problem

```
Extension Root/
├── dist/
│   ├── content/
│   │   └── content-script.js  ← File exists here
│   └── manifest.json
└── src/
    └── background/
        └── service-worker.ts  ← References 'dist/content/content-script.js'
```

Chrome extension file resolution:

- Extension root = `dist/` directory (where manifest.json is located)
- File paths in chrome.scripting.executeScript are relative to extension root
- Current path `'dist/content/content-script.js'` resolves to `dist/dist/content/content-script.js` ❌

### Solution Architecture

```
Extension Root (dist/)/
├── content/
│   └── content-script.js  ← File location
├── background/
│   └── service-worker.js  ← References 'content/content-script.js'
└── manifest.json
```

Correct file resolution:

- Extension root = `dist/` directory
- File path `'content/content-script.js'` resolves to `dist/content/content-script.js` ✅

## Components and Interfaces

### Service Worker Updates

**File**: `src/background/service-worker.ts`

**Current Implementation**:

```typescript
await chrome.scripting.executeScript({
  target: { tabId },
  files: ['dist/content/content-script.js'], // ❌ Incorrect path
});
```

**Fixed Implementation**:

```typescript
await chrome.scripting.executeScript({
  target: { tabId },
  files: ['content/content-script.js'], // ✅ Correct path
});
```

### Manifest Consistency Check

**File**: `manifest.json` and `dist/manifest.json`

**Current State**:

```json
{
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content-script.js"], // ✅ Already correct
      "run_at": "document_idle"
    }
  ]
}
```

The manifest is already using the correct path format. The service worker needs to match this pattern.

### Path Resolution Strategy

1. **Extension Root**: Always `dist/` directory (where built manifest.json resides)
2. **File References**: Always relative to extension root, no `dist/` prefix
3. **Consistency**: Service worker paths must match manifest paths

## Data Models

### File Path Interface

```typescript
interface ExtensionFilePaths {
  contentScript: 'content/content-script.js';
  serviceWorker: 'background/service-worker.js';
  learningInterface: 'ui/learning-interface.html';
  offscreenProcessor: 'offscreen/ai-processor.js';
}
```

### Error Context Interface

```typescript
interface InjectionError {
  attemptedPath: string;
  tabId: number;
  error: string;
  timestamp: number;
  suggestions: string[];
}
```

## Error Handling

### Enhanced Error Logging

```typescript
async function processCurrentTab(tabId: number): Promise<void> {
  const scriptPath = 'content/content-script.js';

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [scriptPath],
    });

    console.log(`Content script injected successfully: ${scriptPath}`);
  } catch (error) {
    const injectionError: InjectionError = {
      attemptedPath: scriptPath,
      tabId,
      error: error.message,
      timestamp: Date.now(),
      suggestions: [
        'Verify file exists in dist/content/',
        'Check manifest.json content_scripts paths',
        'Ensure build process completed successfully',
      ],
    };

    console.error('Content script injection failed:', injectionError);
    throw error;
  }
}
```

### Fallback Strategy

If dynamic injection fails, the extension can rely on the manifest-declared content scripts, but this requires page reload:

```typescript
async function handleInjectionFailure(tabId: number): Promise<void> {
  console.warn(
    'Dynamic injection failed, content script will load on page refresh'
  );

  // Optionally notify user or attempt page reload
  await chrome.tabs.reload(tabId);
}
```

## Testing Strategy

### Unit Tests

1. **Path Resolution Tests**: Verify correct path construction
2. **Error Handling Tests**: Test error logging and context capture
3. **Injection Success Tests**: Mock successful chrome.scripting calls

### Integration Tests

1. **Real Extension Tests**: Load extension in test Chrome instance
2. **File Existence Tests**: Verify all referenced files exist in dist/
3. **Cross-Component Tests**: Test service worker → content script communication

### Manual Testing

1. **Build and Load**: `pnpm build` → Load unpacked extension
2. **Icon Click Test**: Click extension icon on various websites
3. **Console Monitoring**: Check for injection success/failure messages
4. **Content Script Verification**: Confirm content script functions execute

## Implementation Plan

### Phase 1: Fix Service Worker Paths

- Update `src/background/service-worker.ts` file paths
- Remove `dist/` prefix from all file references
- Add enhanced error logging

### Phase 2: Verify Build Process

- Confirm build output matches expected structure
- Validate manifest.json consistency
- Test file path resolution

### Phase 3: Testing and Validation

- Run manual tests with fixed paths
- Verify content script injection works
- Confirm extension functionality restored
