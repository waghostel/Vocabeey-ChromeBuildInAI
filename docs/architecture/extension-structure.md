# Chrome Extension Structure

## Manifest V3 Implementation

The Language Learning Chrome Extension is built using Chrome Extension Manifest V3 with modern service worker architecture.

## Manifest Configuration

### Core Manifest (`manifest.json`)

```json
{
  "manifest_version": 3,
  "name": "Language Learning Reader",
  "version": "1.0.0",
  "description": "Transform web articles into interactive language learning experiences",

  "permissions": ["activeTab", "scripting", "storage", "offscreen"],

  "host_permissions": ["https://r.jina.ai/*"],

  "background": {
    "service_worker": "background/service-worker.js"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content-script.js"],
      "run_at": "document_idle"
    }
  ],

  "action": {},

  "web_accessible_resources": [
    {
      "resources": ["ui/learning-interface.html"],
      "matches": ["<all_urls>"]
    }
  ],

  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### Permission Justification

| Permission  | Purpose                    | Usage                                      |
| ----------- | -------------------------- | ------------------------------------------ |
| `activeTab` | Access current tab content | Extract article content from active tab    |
| `scripting` | Inject content scripts     | Execute content extraction on demand       |
| `storage`   | Local data persistence     | Store user settings, vocabulary, articles  |
| `offscreen` | Heavy AI processing        | Chrome AI API calls without timeout limits |

### Host Permissions

- `https://r.jina.ai/*`: Jina Reader API for content extraction fallback

## Extension Components

### 1. Service Worker (`background/service-worker.js`)

**Role**: Extension lifecycle and message coordination

**Key Features**:

- Extension icon click handling
- Tab management and cleanup
- Message routing between components
- Storage initialization
- System capability detection

**Trigger Mechanism**:

The extension uses **click-based activation** rather than automatic processing:

- **Empty Action Object**: `"action": {}` in manifest means no popup is defined
- **Click Handler**: `chrome.action.onClicked` listener responds to toolbar icon clicks
- **On-Demand Processing**: Content extraction only occurs when user explicitly requests it
- **No Auto-Processing**: Extension does NOT automatically process pages on load

**Implementation**:

```typescript
// Extension icon click handler
chrome.action.onClicked.addListener(async (tab): Promise<void> => {
  if (!tab.id) return;

  // Validate tab URL (skip chrome:// pages)
  if (
    !tab.url ||
    tab.url.startsWith('chrome://') ||
    tab.url.startsWith('chrome-extension://')
  ) {
    console.warn('Cannot process chrome:// or extension pages');
    return;
  }

  // Inject content script dynamically
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['dist/content/content-script.js'],
  });
});

// Message handling between components
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'CONTENT_EXTRACTED':
      handleContentExtracted(message.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'OPEN_LEARNING_INTERFACE':
      openLearningInterface(message.data)
        .then(tabId => sendResponse({ success: true, data: { tabId } }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
  }
});
```

**Limitations**:

- No DOM access
- No `window` or `document` objects
- 5-minute inactivity timeout (mitigated by offscreen documents)

### 2. Content Scripts (`content/content-script.js`)

**Role**: Web page interaction and content extraction

**Injection Strategy**:

- **On-demand injection**: Via `chrome.scripting.executeScript`
- **Document idle**: Runs after page load completion
- **All URLs**: Universal content extraction capability

**Key Features**:

```typescript
// Content extraction
function extractContent(): void {
  const content = extractArticleContent();
  const metadata = extractMetadata();

  chrome.runtime.sendMessage({
    type: 'CONTENT_EXTRACTED',
    content,
    metadata,
  });
}

// Article content extraction
function extractArticleContent(): string {
  // Try multiple extraction strategies
  return (
    tryReadability() ||
    tryArticleSelectors() ||
    tryMainContent() ||
    tryFallbackExtraction()
  );
}
```

**Content Extraction Pipeline**:

1. **Readability.js**: Primary extraction method
2. **Semantic selectors**: `<article>`, `<main>`, `.content`
3. **Heuristic extraction**: Content-based detection
4. **Fallback parsing**: Basic DOM traversal

### 3. Offscreen Documents (`offscreen/ai-processor.js`)

**Role**: Heavy AI processing without service worker limitations

**Creation Strategy**:

```typescript
// Create offscreen document for AI processing
await chrome.offscreen.createDocument({
  url: 'offscreen/ai-processor.html',
  reasons: ['LOCAL_STORAGE'],
  justification: 'AI processing requires persistent context',
});
```

**AI Processing Pipeline**:

```typescript
class AIProcessor {
  async processArticle(content: string): Promise<ProcessedArticle> {
    // Language detection
    const language = await this.detectLanguage(content);

    // Content summarization
    const summary = await this.summarizeContent(content);

    // Difficulty adaptation
    const adapted = await this.adaptContent(summary, userDifficulty);

    // Vocabulary extraction and translation
    const vocabulary = await this.processVocabulary(adapted, language);

    return {
      content: adapted,
      vocabulary,
      language,
      metadata: { processedAt: Date.now() },
    };
  }
}
```

**Advantages**:

- No service worker timeout limits
- Persistent AI session context
- DOM access for processing
- Dedicated processing environment

### 4. UI Components (`ui/`)

**Structure**:

```
ui/
├── popup/                    # Extension popup
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── learning-interface/       # Main learning interface
│   ├── learning-interface.html
│   ├── learning-interface.js
│   └── learning-interface.css
├── settings/                 # Settings page
│   ├── settings.html
│   ├── settings.js
│   └── settings.css
└── shared/                   # Shared UI components
    ├── components.js
    └── styles.css
```

**Learning Interface Features**:

- **Full-page takeover**: Opens in new tab
- **Card-based layout**: Article content in digestible parts
- **Mode switching**: Reading, Vocabulary, Sentence modes
- **Interactive highlighting**: Click-to-highlight vocabulary/sentences
- **TTS integration**: Text-to-speech for pronunciation

## File Organization

### Source Structure

```
src/
├── background/
│   └── service-worker.ts     # Service worker implementation
├── content/
│   └── content-script.ts     # Content extraction logic
├── offscreen/
│   ├── ai-processor.ts       # AI processing coordinator
│   └── ai-processor.html     # Offscreen document HTML
├── ui/
│   ├── popup/               # Extension popup
│   ├── learning-interface/  # Main learning UI
│   ├── settings/           # Settings interface
│   └── shared/             # Shared UI components
├── types/
│   └── index.ts            # TypeScript type definitions
└── utils/
    ├── chrome-ai.ts        # Chrome AI integration
    ├── storage-manager.ts  # Storage abstraction
    ├── cache-manager.ts    # Caching system
    └── content-extraction.ts # Content extraction utilities
```

### Build Output Structure

```
dist/
├── background/
│   └── service-worker.js
├── content/
│   └── content-script.js
├── offscreen/
│   ├── ai-processor.js
│   └── ai-processor.html
├── ui/
│   ├── popup/
│   ├── learning-interface/
│   └── settings/
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── manifest.json
```

## Context Isolation

### Service Worker Context

```typescript
// ✅ Available
chrome.runtime.*
chrome.action.*
chrome.tabs.*
chrome.storage.*
chrome.scripting.*
console.*

// ❌ Not Available
window
document
DOM APIs
localStorage
sessionStorage
```

### Content Script Context

```typescript
// ✅ Available
document
window (page window)
DOM APIs
chrome.runtime.sendMessage
chrome.runtime.onMessage

// ❌ Limited
chrome.storage (use messaging)
chrome.tabs (use messaging)
Page script variables (isolated)
```

### Offscreen Document Context

```typescript
// ✅ Available
document
window
DOM APIs
chrome.runtime.*
chrome.storage.*
AI APIs (window.ai.*)

// ❌ Not Available
Page DOM access
Content script APIs
```

## Communication Patterns

### Message Types

```typescript
interface MessageTypes {
  // Content extraction
  EXTRACT_CONTENT: { url: string };
  CONTENT_EXTRACTED: { content: string; metadata: ContentMetadata };

  // AI processing
  PROCESS_ARTICLE: { articleId: string; content: string };
  PROCESSING_PROGRESS: { articleId: string; progress: number };
  PROCESSING_COMPLETE: { articleId: string; result: ProcessedArticle };

  // UI coordination
  OPEN_LEARNING_INTERFACE: { articleId: string };
  UPDATE_VOCABULARY: { articleId: string; vocabulary: VocabularyItem[] };

  // System
  CHECK_SYSTEM_CAPABILITIES: {};
  SYSTEM_CAPABILITIES: { chromeAI: boolean; hardware: HardwareInfo };
}
```

### Communication Flow

```
Content Script → Service Worker → Offscreen Document → AI APIs
     ↓                ↓                    ↓
Storage Update ← Message Response ← Processing Result
     ↓
UI Update (Learning Interface)
```

## Web Accessible Resources

### Purpose

Allow learning interface to be loaded in new tabs with extension context.

### Configuration

```json
"web_accessible_resources": [{
  "resources": [
    "ui/learning-interface.html",
    "ui/learning-interface.js",
    "ui/learning-interface.css",
    "ui/shared/components.js",
    "ui/shared/styles.css"
  ],
  "matches": ["<all_urls>"]
}]
```

### Usage

```typescript
// Open learning interface in new tab
const interfaceUrl = chrome.runtime.getURL('ui/learning-interface.html');
await chrome.tabs.create({
  url: `${interfaceUrl}?articleId=${articleId}`,
});
```

## Security Considerations

### Content Security Policy

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'"
}
```

### Security Features

- **No inline scripts**: All JavaScript in separate files
- **No eval()**: Strict CSP prevents code injection
- **Sanitized content**: All extracted content sanitized
- **Secure communication**: Message validation and type checking

### Data Protection

- **Local processing**: AI processing happens locally when possible
- **User-controlled keys**: Gemini API keys stored securely by user
- **No telemetry**: Privacy-focused with no usage tracking
- **Secure storage**: Chrome storage with proper access controls

## Performance Optimizations

### Lazy Loading

```typescript
// Load components on demand
const loadLearningInterface = async () => {
  if (!learningInterfaceLoaded) {
    await import('./ui/learning-interface/learning-interface.js');
    learningInterfaceLoaded = true;
  }
};
```

### Resource Management

```typescript
// Cleanup offscreen documents
class OffscreenManager {
  private static instance: OffscreenManager;
  private documentCreated = false;

  async createDocument(): Promise<void> {
    if (!this.documentCreated) {
      await chrome.offscreen.createDocument({
        url: 'offscreen/ai-processor.html',
        reasons: ['LOCAL_STORAGE'],
        justification: 'AI processing',
      });
      this.documentCreated = true;
    }
  }

  async cleanup(): Promise<void> {
    if (this.documentCreated) {
      await chrome.offscreen.closeDocument();
      this.documentCreated = false;
    }
  }
}
```

### Memory Management

- **Automatic cleanup**: Service worker cleanup on tab close
- **Resource monitoring**: Memory usage tracking
- **Cache limits**: Bounded cache sizes with LRU eviction
- **Session management**: AI session cleanup and reuse

## Extension Lifecycle

### Installation

1. Extension installed → Service worker activated
2. Default settings initialized in storage
3. Chrome AI availability detected
4. Setup wizard presented to user

### Runtime

1. User clicks extension icon → Content script injected
2. Content extracted → Service worker processes
3. Offscreen document created → AI processing
4. Results stored → Learning interface opened

### Update

1. Extension updated → Service worker restarted
2. Storage schema migration if needed
3. New features enabled
4. User notified of changes

### Uninstall

1. User data export offered
2. Storage cleanup performed
3. Extension removed

This Chrome Extension structure provides a robust, secure, and performant foundation for the Language Learning Reader, leveraging Manifest V3 capabilities while maintaining clear separation of concerns and optimal user experience.
