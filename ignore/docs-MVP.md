# Language Learning Chrome Extension - MVP Specification

## Overview

A Chrome Extension (Manifest V3) that transforms web articles into an interactive language learning experience using Chrome's built-in AI APIs and optional Gemini API integration.

## Core Features

### 1. Clean Reading Mode

- **Content Extraction Pipeline:**
  1. Readability.js (primary)
  2. Jina Reader API (fallback, requires API key)
  3. Basic DOM parsing (final fallback)
- **Content Processing:**
  - Count words/paragraphs first for length assessment
  - For long articles: Use hierarchical summarization (2-3 paragraphs → summary → second-order summary)
  - Use Chrome's Rewriter/Summarizer API with prompts to focus on article content only (ignore ads, comments)
  - Target 1-3 paragraphs per card
  - Progressive loading: Generate part 1 + vocabulary first, then subsequent parts
  - Minimum content length threshold to filter noise
  - Prioritize `<article>`, `<main>` elements
- **UI:** Card-based layout in new tab, each part displayed as individual cards

### 2. Highlighting System

**Two Modes:**

- **Vocabulary Mode:** Highlight words/phrases → creates vocabulary cards
- **Sentence Mode:** Highlight sentences → creates sentence cards

**Vocabulary Cards:**

- Display word/phrase + translation (Language B)
- Double-click: Show 1-3 example sentences (LLM-generated)
- Mouse hover: Show translation popup
- Click word: TTS pronunciation
- Auto-collapse after 1 second

**Sentence Cards:**

- Display sentence + translation
- Double-click: Show detailed translation
- Click: TTS pronunciation
- Auto-collapse after 1 second

**Phrase Handling:**

- Group related words (run/running/ran) as same vocabulary
- Highlight entire phrases together
- Display as phrase in vocabulary card
- Overlapping highlights: Merge into phrase or longer sentence
- Context-aware translations: Provide translation specific to article context
- Ignore proper nouns (names, places, brands) - LLM instructed to skip them
- Technical terms treated as regular vocabulary/phrases

**User Interaction:**

- Right-click highlights: Show edit/remove options
- Batch processing: Process up to 20 vocabulary words per AI call (tunable parameter)

### 3. Vocabulary Learning Mode

- Display all vocabulary cards in grid layout
- **Display Options Dropdown:**
  - Language A+B (default)
  - Language A only (B shows on 0.5s hover)
  - Language B only (A shows on 0.5s hover)
- Double-click cards: Show example sentences
- TTS support for pronunciation

### 4. Sentence Learning Mode

- Display all highlighted sentences
- Click for TTS pronunciation
- Show translations

## Technical Architecture

### Extension Structure

- **Full-page takeover:** Opens new tab for reading interface
- **Permissions:** `activeTab`, `scripting`, `storage`
- **Content Scripts:** Handle page content extraction
- **Offscreen Documents:** Heavy AI processing to avoid service worker timeouts
- **Storage:** `chrome.storage.session` for processing state, `chrome.storage.local` for user data

### AI Integration

**Chrome Built-in AI (Primary):**

- Summarizer API: Article processing
- Rewriter API: Content simplification
- Translator API: Translations (EN/ES/JA)
- Language Detector API: Auto-detect source language

**Gemini API (Fallback/Extended):**

- Required for non-supported languages
- Structured output for consistent formatting
- User provides API key in settings

**Fallback Chain:**

1. Chrome Built-in AI
2. Gemini API (if key provided)
3. Error message to user

### Hardware Requirements

- **Minimum:** Chrome 140+, Windows 10+/macOS 13+/Linux/ChromeOS
- **Recommended:** 22GB+ free space, 4GB+ VRAM, unlimited internet
- **Detection:** Auto-detect system capabilities, suggest Gemini API for insufficient hardware

## User Experience

### First-Time Setup Wizard

1. Welcome & feature overview
2. Native language selection (Language B)
3. Learning difficulty level (slider)
4. API key setup (optional)
5. Tutorial with sample article (Alice in Wonderland)

### Navigation

- **Article Parts:** Left/right arrows + keyboard shortcuts (←/→)
- **Modes:** Tab-based navigation (Reading/Vocabulary/Sentences)
- **Settings:** Gear icon access

### Progress Indicators

- Model download: Progress bar `[>>>>>----------30%]`
- Article processing: Streaming word-by-word generation
- Error handling: 3 retry attempts, then user notification

### Automatic Features

- **Auto-highlight:** Major vocabulary based on difficulty setting + LLM analysis
- **Caching:** Processed articles cached for revisits
- **Auto-cleanup:** Old vocabulary when storage approaches limits

## Settings & Configuration

### Article Processing

- **Length Options:**
  - Original length
  - Short summary (1-3 paragraphs)
  - Custom paragraph count
- **Difficulty Level:** Slider for vocabulary complexity
- **Auto-highlight:** Toggle for automatic vocabulary detection

### Language Settings

- **Native Language (B):** User's first language for translations (user-selectable UI)
- **Learning Language (A):** Auto-detected by LLM or manual selection (user-adjustable UI next to Language B selector)
- **Language Processing:** Convert all content from prominent language A to user's language B

### API Configuration

- **Chrome Built-in AI:** Default, auto-detected
- **Gemini API:** Optional key input, model selection (2.5 Pro/Flash/Light)
- **Jina Reader API:** Optional key for content extraction fallback

### UI Preferences

- **Dark Mode:** Toggle
- **Font Size:** Adjustment slider
- **Keyboard Shortcuts:** Customizable hotkeys

## Data Management

### Storage Strategy

- **Local Storage:** Vocabulary cards, sentences, settings, processed articles cache
- **File Management:** Auto-export to Markdown when approaching limits
- **Import/Export:** Manual backup/restore functionality
- **No Analytics:** Privacy-focused, no tracking
- **Duplicate Handling:** Same vocabulary across articles listed under each article part
- **Memory Management:** No current limitations (future optimization if crashes occur)

### Storage Limits

- Monitor `chrome.storage.local` usage
- Auto-archive old vocabulary to downloadable files
- User notification before cleanup

## Data Storage Format

### Storage Schema (Version 1.0)

```javascript
// chrome.storage.local structure
{
  "schema_version": "1.0.0",
  "user_settings": {
    "native_language": "en",
    "learning_language": "auto",
    "difficulty_level": 5,
    "auto_highlight": true,
    "dark_mode": false,
    "font_size": 16,
    "api_keys": {
      "gemini": "",
      "jina_reader": ""
    },
    "keyboard_shortcuts": {
      "next_part": "ArrowRight",
      "prev_part": "ArrowLeft",
      "highlight_vocab": "v",
      "highlight_sentence": "s"
    }
  },
  "articles": {
    "[article_id]": {
      "id": "article_123",
      "url": "https://example.com/article",
      "title": "Article Title",
      "original_language": "en",
      "processed_at": "2025-01-15T10:30:00Z",
      "parts": [
        {
          "id": "part_1",
          "content": "Processed article content...",
          "original_content": "Original content...",
          "vocabulary": ["vocab_id_1", "vocab_id_2"],
          "sentences": ["sentence_id_1"]
        }
      ],
      "processing_status": "completed", // "processing", "completed", "failed"
      "cache_expires": "2025-01-22T10:30:00Z"
    }
  },
  "vocabulary": {
    "[vocab_id]": {
      "id": "vocab_123",
      "word": "example",
      "phrase": "for example",
      "translation": "por ejemplo",
      "context": "In this article context...",
      "example_sentences": [
        "This is an example sentence.",
        "Another example here."
      ],
      "article_id": "article_123",
      "part_id": "part_1",
      "created_at": "2025-01-15T10:30:00Z",
      "last_reviewed": "2025-01-15T10:30:00Z",
      "review_count": 0
    }
  },
  "sentences": {
    "[sentence_id]": {
      "id": "sentence_123",
      "content": "This is a highlighted sentence.",
      "translation": "Esta es una oración destacada.",
      "article_id": "article_123",
      "part_id": "part_1",
      "created_at": "2025-01-15T10:30:00Z"
    }
  },
  "processing_queue": [
    {
      "type": "article_processing",
      "article_id": "article_124",
      "status": "pending",
      "created_at": "2025-01-15T10:35:00Z"
    }
  ],
  "statistics": {
    "articles_processed": 5,
    "vocabulary_learned": 150,
    "sentences_highlighted": 25,
    "last_activity": "2025-01-15T10:30:00Z"
  }
}
```

### Migration Strategy

```javascript
// Migration handler for schema updates
const MIGRATIONS = {
  '1.0.0': data => data, // Initial version
  '1.1.0': data => {
    // Example: Add new field
    data.user_settings.tts_voice = 'default';
    return data;
  },
  '2.0.0': data => {
    // Example: Restructure vocabulary format
    // Migration logic here
    return data;
  },
};

async function migrateData() {
  const data = await chrome.storage.local.get();
  const currentVersion = data.schema_version || '1.0.0';
  const targetVersion = '1.1.0'; // Current extension version

  if (currentVersion !== targetVersion) {
    let migratedData = data;
    // Apply migrations sequentially
    for (const [version, migrationFn] of Object.entries(MIGRATIONS)) {
      if (
        compareVersions(version, currentVersion) > 0 &&
        compareVersions(version, targetVersion) <= 0
      ) {
        migratedData = migrationFn(migratedData);
      }
    }
    migratedData.schema_version = targetVersion;
    await chrome.storage.local.set(migratedData);
  }
}
```

### Storage Management

- **Automatic Cleanup:** Request for cleanup and help user to remove articles when space is close to full(80%)
- **Export Format:** JSON + Markdown hybrid for human readability
- **Backup Strategy:** Weekly auto-export to Downloads folder
- **Size Monitoring:** Alert at 80% of chrome.storage.local quota (5MB)
- **Compression:** Use JSON compression for large vocabulary sets

## Error Handling

### Content Extraction Failures

1. Try Readability.js
2. Try Jina Reader API (if configured)
3. Basic DOM parsing
4. Show error message with manual paste option

### AI Processing Failures

- 3 retry attempts with exponential backoff
- Clear error messages
- Fallback to alternative AI service
- Graceful degradation (show original text)

### Network Issues

- Offline mode: Use cached content only
- API timeouts: Clear user feedback
- Rate limiting: Queue requests with user notification

### Extension Lifecycle

- **Tab Management:** Continue if original article accessible, show error if not
- **Browser Crashes:** Notify user of failed previous status, ask to reload current page
- **Data Migration:** Maintain backward-compatible storage format with version tracking

## MVP Scope Limitations

### Excluded from MVP

- Spaced repetition algorithms
- Performance tracking/analytics
- Multi-device sync
- Advanced statistics
- Cross-browser support
- Images/code blocks processing
- Advanced content formatting

### Future Considerations

- Firefox/Safari support with different AI backends
- Advanced learning algorithms
- Social features (sharing vocabulary lists)
- Offline AI models
- Advanced content type handling

## Success Metrics

### Technical

- Content extraction success rate >90%
- AI processing completion rate >95%
- Extension load time <3 seconds
- Memory usage <100MB per tab

### User Experience

- Setup completion rate >80%
- Feature discovery rate >60%
- Daily active usage >5 minutes
- User retention >30% after 1 week

## Development Phases

### Phase 1: Core Infrastructure (Week 1-2)

- Extension manifest and permissions
- Content extraction pipeline
- Basic UI framework
- Chrome AI integration

### Phase 2: Reading Mode (Week 3-4)

- Article processing and display
- Card-based UI implementation
- Navigation system
- Basic highlighting

### Phase 3: Learning Features (Week 5-6)

- Vocabulary and sentence modes
- TTS integration
- Translation system
- Storage management

### Phase 4: Polish & Testing (Week 7-8)

- Settings interface
- Error handling
- Performance optimization
- User testing and feedback

## Technical Dependencies

### Required APIs

- Chrome Extension APIs (Manifest V3)
- Chrome Built-in AI APIs (140+)
- Web Speech API (TTS)
- Readability.js library

### Optional APIs

- Gemini API (Google AI)
- Jina Reader API
- Custom TTS services

### Browser Requirements

- Chrome 140+ (stable channel)
- Hardware meeting Chrome AI requirements
- Active internet connection for initial setup

## Technical Specification

### System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Content       │    │   Service        │    │   Learning      │
│   Script        │───▶│   Worker         │───▶│   Interface     │
│                 │    │                  │    │   (New Tab)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   DOM           │    │   Offscreen      │    │   Chrome        │
│   Extraction    │    │   Document       │    │   Storage       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Chrome AI      │
                       │   APIs           │
                       └──────────────────┘
```

### Chrome Built-in AI API Usage Map

#### 1. Language Detector API

**Usage:** Primary language detection for articles
**Implementation:**

```javascript
// Detect article language before processing
const detector = await LanguageDetector.create();
const detectedLanguage = await detector.detect(articleText);
```

**Fallback:** User manual selection if detection fails
**Performance:** Fast, no model download required

#### 2. Summarizer API

**Usage:** Article content processing and subdivision
**Implementation:**

```javascript
// Primary article processing
const summarizer = await Summarizer.create({
  type: 'key-points',
  format: 'plain-text',
  length: 'medium',
  sharedContext:
    'Focus on main article content, ignore advertisements and navigation',
});

// For long articles - hierarchical summarization
const firstPass = await summarizer.summarize(longArticleText);
const secondPass = await summarizer.summarize(firstPass, {
  context: 'Create 2-3 paragraph summary suitable for language learning',
});
```

**Specific Tasks:**

- Initial article cleaning and structuring
- Long article hierarchical summarization (2-level)
- Content subdivision into 1-3 paragraph parts
- Noise filtering (ads, comments, navigation)

#### 3. Rewriter API

**Usage:** Content adaptation for different difficulty levels
**Implementation:**

```javascript
// Adjust article difficulty
const rewriter = await Rewriter.create({
  tone: 'as-is',
  format: 'plain-text',
  length: 'as-is',
  sharedContext: 'Rewrite for language learners, maintain factual accuracy',
});

// Difficulty-based rewriting
const adaptedContent = await rewriter.rewrite(originalText, {
  context: `Adjust vocabulary complexity for ${difficultyLevel}/10 difficulty level. 
           Preserve all facts and main ideas. Focus on educational content only.`,
});
```

**Specific Tasks:**

- Vocabulary complexity adjustment based on user difficulty setting
- Sentence structure simplification for beginners
- Technical term explanation integration
- Maintaining factual accuracy while adapting language

#### 4. Translator API

**Usage:** Real-time vocabulary and sentence translation
**Implementation:**

```javascript
// Context-aware vocabulary translation
const translator = await Translator.create({
  sourceLanguage: detectedLanguage,
  targetLanguage: userNativeLanguage,
});

// Batch vocabulary translation (up to 20 words)
const vocabularyBatch = selectedWords.join('\n');
const translations = await translator.translate(vocabularyBatch, {
  context: `Translate in context of: "${articleContext}". 
           Provide contextually appropriate translations only.`,
});
```

**Specific Tasks:**

- Context-aware vocabulary translation
- Sentence translation for highlighted content
- Batch processing of vocabulary lists
- Maintaining context relevance in translations

#### 5. Prompt API (Gemini Nano)

**Usage:** Advanced vocabulary analysis and example generation
**Implementation:**

```javascript
// Advanced vocabulary processing
const session = await LanguageModel.create({
  systemPrompt: `You are a language learning assistant. 
                 Analyze vocabulary and generate educational content.
                 Ignore proper nouns, focus on learning value.`,
});

// Vocabulary difficulty assessment and example generation
const vocabularyAnalysis = await session.prompt(`
  Analyze these words from the article context: "${articleContext}"
  Words: ${vocabularyList}
  
  For each word:
  1. Assess difficulty level (1-10)
  2. Generate 2-3 example sentences using the word
  3. Identify if it's a technical term
  4. Skip proper nouns (names, places, brands)
  
  Return structured JSON format.
`);
```

**Specific Tasks:**

- Automatic vocabulary difficulty assessment
- Example sentence generation for vocabulary cards
- Technical term identification and explanation
- Proper noun filtering
- Context-aware vocabulary selection

### API Integration Strategy

#### Primary Processing Pipeline

```javascript
// 1. Content Extraction & Language Detection
const extractedContent = await extractWithReadability(pageContent);
const language = await detectLanguage(extractedContent);

// 2. Content Processing (Summarizer + Rewriter)
const processedParts = await processArticleContent(
  extractedContent,
  userSettings
);

// 3. Vocabulary Analysis (Prompt API)
const vocabularyData = await analyzeVocabulary(processedParts, language);

// 4. Translation (Translator API)
const translations = await translateContent(vocabularyData, userNativeLanguage);

// 5. Storage & Caching
await cacheProcessedArticle(articleId, processedData);
```

#### Fallback Chain Implementation

```javascript
class AIServiceManager {
  async processWithFallback(task, data) {
    try {
      // Try Chrome Built-in AI first
      return await this.processChromeAI(task, data);
    } catch (chromeError) {
      console.warn('Chrome AI failed:', chromeError);

      if (this.hasGeminiKey()) {
        try {
          // Fallback to Gemini API
          return await this.processGeminiAPI(task, data);
        } catch (geminiError) {
          console.error('Gemini API failed:', geminiError);
          throw new Error('All AI services unavailable');
        }
      } else {
        throw new Error('Chrome AI unavailable, Gemini key not configured');
      }
    }
  }
}
```

### Performance Optimization

#### Batch Processing Strategy

```javascript
// Vocabulary batch processing (tunable parameter: 20 words)
const BATCH_SIZE = 20;
const vocabularyBatches = chunkArray(vocabularyList, BATCH_SIZE);

const processedVocabulary = await Promise.all(
  vocabularyBatches.map(batch => this.translateBatch(batch, context))
);
```

#### Progressive Loading Implementation

```javascript
// Process article parts incrementally
async function processArticleProgressively(articleParts) {
  const results = [];

  for (let i = 0; i < articleParts.length; i++) {
    // Process current part
    const processedPart = await processArticlePart(articleParts[i]);
    results.push(processedPart);

    // Update UI immediately
    await updateUIWithPart(processedPart, i);

    // Show progress
    updateProgressBar(((i + 1) / articleParts.length) * 100);
  }

  return results;
}
```

### Extension Architecture Details

#### Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "Language Learning Reader",
  "version": "1.0.0",
  "permissions": ["activeTab", "scripting", "storage", "offscreen"],
  "host_permissions": ["https://r.jina.ai/*"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "web_accessible_resources": [
    {
      "resources": ["learning-interface.html"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

#### Service Worker Implementation

```javascript
// background.js - Service Worker
chrome.action.onClicked.addListener(async tab => {
  // Check if Chrome AI is available
  const aiAvailable = await checkAIAvailability();

  if (!aiAvailable) {
    // Show setup instructions
    chrome.tabs.create({
      url: chrome.runtime.getURL('setup.html'),
    });
    return;
  }

  // Inject content script and start processing
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: initializeContentExtraction,
  });
});
```

#### Offscreen Document for AI Processing

```javascript
// offscreen.js - Heavy AI processing
class AIProcessor {
  async processArticle(articleData) {
    // Create offscreen document for heavy processing
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['LOCAL_STORAGE'],
      justification: 'AI processing requires persistent context',
    });

    // Process with Chrome AI APIs
    const result = await this.runAIProcessing(articleData);

    // Clean up
    await chrome.offscreen.closeDocument();

    return result;
  }
}
```

### Error Handling & Recovery

#### AI Service Error Handling

```javascript
class ErrorHandler {
  async handleAIError(error, task, data) {
    const errorTypes = {
      MODEL_NOT_AVAILABLE: () => this.suggestModelDownload(),
      INSUFFICIENT_RESOURCES: () => this.suggestGeminiAPI(),
      RATE_LIMITED: () => this.queueRequest(task, data),
      NETWORK_ERROR: () => this.useOfflineMode(),
      QUOTA_EXCEEDED: () => this.cleanupStorage(),
    };

    const handler = errorTypes[error.type] || this.showGenericError;
    return await handler();
  }
}
```

#### Progressive Degradation

```javascript
// Graceful feature degradation
const featureAvailability = {
  chromeAI: await checkChromeAI(),
  geminiAPI: this.hasGeminiKey(),
  offlineMode: await checkCachedContent(),
};

// Adjust UI based on available features
this.updateUICapabilities(featureAvailability);
```

### Security & Privacy

#### Data Protection

- All processing happens locally (Chrome AI) or with user-provided API keys
- No telemetry or usage tracking
- Vocabulary data never leaves user's device
- API keys stored securely in Chrome storage

#### Content Security

```javascript
// Sanitize extracted content
const sanitizedContent = DOMPurify.sanitize(extractedContent, {
  ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  ALLOWED_ATTR: [],
});
```

This technical specification provides a complete implementation roadmap with specific Chrome AI API usage patterns, fallback strategies, and architectural decisions optimized for the language learning use case.
