# Chrome AI Architecture - Visual Guide

## API Namespace Structure

```
Chrome Browser
│
├── Global Scope (self/window)
│   │
│   ├── Translator ✅ GLOBAL API
│   │   ├── availability(options)
│   │   └── create(options) → TranslatorInstance
│   │       ├── translate(text)
│   │       ├── translateStreaming(text)
│   │       └── destroy()
│   │
│   └── LanguageDetector ✅ GLOBAL API
│       └── create() → LanguageDetectorInstance
│           └── detect(text)
│
└── window.ai
    │
    ├── summarizer ✅ UNDER window.ai
    │   ├── capabilities()
    │   └── create(options) → SummarizerInstance
    │       ├── summarize(text)
    │       └── destroy()
    │
    ├── rewriter ✅ UNDER window.ai
    │   ├── capabilities()
    │   └── create(options) → RewriterInstance
    │       ├── rewrite(text)
    │       └── destroy()
    │
    └── languageModel ✅ UNDER window.ai (Prompt API)
        ├── capabilities()
        └── create(options) → PromptSession
            ├── prompt(text)
            └── destroy()
```

## Extension Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Action                              │
│                  (Click on vocabulary word)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Content Script                                │
│                 (learning-interface.ts)                          │
│                                                                   │
│  • Captures user click                                           │
│  • Extracts word/sentence                                        │
│  • Sends message to service worker                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ chrome.runtime.sendMessage()
                             │ { type: 'TRANSLATE_TEXT', payload: {...} }
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Service Worker                                 │
│                (service-worker.ts)                               │
│                                                                   │
│  • Receives translation request                                  │
│  • Gets user language preferences                                │
│  • Routes to offscreen document                                  │
│  • Returns translation to content script                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ executeOffscreenAITask()
                             │ { taskType: 'translation', data: {...} }
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Offscreen Manager                               │
│                (offscreen-manager.ts)                            │
│                                                                   │
│  • Ensures offscreen document exists                             │
│  • Manages task queue                                            │
│  • Handles timeouts                                              │
│  • Routes messages                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ chrome.runtime.sendMessage()
                             │ { type: 'OFFSCREEN_TASK', ... }
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Offscreen Document                               │
│                  (ai-processor.ts)                               │
│                                                                   │
│  • Receives task from offscreen manager                          │
│  • Calls Chrome AI APIs                                          │
│  • Returns result                                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Uses Chrome AI APIs
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Chrome AI Layer                               │
│                    (chrome-ai.ts)                                │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ChromeTranslator                                         │   │
│  │  • translateText()                                        │   │
│  │  • translateStreaming()                                   │   │
│  │  • batchTranslate()                                       │   │
│  │  • Uses: global Translator API ✅                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ChromeLanguageDetector                                   │   │
│  │  • detectLanguage()                                       │   │
│  │  • Uses: global LanguageDetector API ✅                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ChromeSummarizer                                         │   │
│  │  • summarizeContent()                                     │   │
│  │  • Uses: window.ai.summarizer ✅                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ChromeRewriter                                           │   │
│  │  • rewriteContent()                                       │   │
│  │  • Uses: window.ai.rewriter ✅                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ChromeVocabularyAnalyzer                                 │   │
│  │  • analyzeVocabulary()                                    │   │
│  │  • Uses: window.ai.languageModel ✅                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Direct API calls
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Chrome Built-in AI APIs                         │
│                                                                   │
│  Global APIs:                                                    │
│  • Translator                                                    │
│  • LanguageDetector                                              │
│                                                                   │
│  window.ai APIs:                                                 │
│  • summarizer                                                    │
│  • rewriter                                                      │
│  • languageModel                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Context Availability

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chrome Extension Contexts                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   Service Worker     │  ❌ NO Chrome AI APIs
│  (Background)        │  • Can't access Translator
│                      │  • Can't access window.ai
│  • Message routing   │  • Must delegate to offscreen
│  • State management  │
└──────────────────────┘

┌──────────────────────┐
│   Content Script     │  ❌ NO Chrome AI APIs (in practice)
│  (Page context)      │  • Isolated from page
│                      │  • Limited API access
│  • DOM manipulation  │  • Must delegate to offscreen
│  • User interaction  │
└──────────────────────┘

┌──────────────────────┐
│  Offscreen Document  │  ✅ ALL Chrome AI APIs
│  (Hidden page)       │  • Has Translator (global)
│                      │  • Has LanguageDetector (global)
│  • AI processing     │  • Has window.ai.summarizer
│  • Heavy computation │  • Has window.ai.rewriter
│                      │  • Has window.ai.languageModel
└──────────────────────┘

┌──────────────────────┐
│   Popup / Options    │  ✅ ALL Chrome AI APIs
│  (Extension pages)   │  • Full API access
│                      │  • Can use directly
│  • UI rendering      │  • No delegation needed
│  • Settings          │
└──────────────────────┘
```

## Translation Request Flow (Detailed)

```
1. User clicks word "casa"
   │
   ▼
2. Content Script (highlight-manager.ts)
   │
   ├─► Extract word: "casa"
   ├─► Get context: "Mi casa es grande"
   └─► Send message to service worker
       │
       ▼
3. Service Worker (service-worker.ts)
   │
   ├─► Receive: { type: 'TRANSLATE_TEXT', payload: { text: 'casa' } }
   ├─► Get settings: { learningLanguage: 'es', nativeLanguage: 'en' }
   └─► Call: executeOffscreenAITask('translation', {...})
       │
       ▼
4. Offscreen Manager (offscreen-manager.ts)
   │
   ├─► Check if offscreen document exists
   ├─► Create if needed
   ├─► Generate task ID: "task_123456"
   ├─► Add to pending tasks queue
   ├─► Set timeout (15 seconds)
   └─► Send message to offscreen document
       │
       ▼
5. Offscreen Document (ai-processor.ts)
   │
   ├─► Receive: { type: 'OFFSCREEN_TASK', taskType: 'translation' }
   ├─► Extract data: { text: 'casa', sourceLanguage: 'es', targetLanguage: 'en' }
   └─► Call: chromeAI.translateText(...)
       │
       ▼
6. Chrome AI Layer (chrome-ai.ts)
   │
   ├─► Check cache: getCacheKey('casa', 'es', 'en')
   ├─► Cache miss
   ├─► Check API: typeof Translator !== 'undefined' ✅
   ├─► Check availability: Translator.availability({ sourceLanguage: 'es', targetLanguage: 'en' })
   ├─► Get/create translator: getTranslator('es', 'en')
   └─► Translate: translator.translate('casa')
       │
       ▼
7. Chrome Built-in AI
   │
   ├─► Load model (if not cached)
   ├─► Process translation
   └─► Return: "house"
       │
       ▼
8. Chrome AI Layer
   │
   ├─► Cache result: cacheTranslation('es:en:casa', 'house')
   └─► Return: "house"
       │
       ▼
9. Offscreen Document
   │
   └─► Send result: { type: 'OFFSCREEN_TASK_RESULT', taskId: 'task_123456', result: 'house' }
       │
       ▼
10. Offscreen Manager
    │
    ├─► Receive result
    ├─► Find pending task: task_123456
    ├─► Clear timeout
    ├─► Remove from queue
    └─► Resolve promise: resolve('house')
        │
        ▼
11. Service Worker
    │
    └─► Return to content script: { success: true, data: { translation: 'house' } }
        │
        ▼
12. Content Script
    │
    ├─► Receive translation: "house"
    ├─► Update UI
    └─► Show tooltip: "casa → house"
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Error Scenarios                             │
└─────────────────────────────────────────────────────────────────┘

Scenario 1: API Not Available
├─► Check: typeof Translator === 'undefined'
├─► Throw: AIError { type: 'api_unavailable' }
├─► Catch in offscreen processor
├─► Try fallback: Gemini API
└─► If no fallback: Return error to user

Scenario 2: Language Pair Not Supported
├─► Check: Translator.availability() === 'no'
├─► Throw: AIError { type: 'api_unavailable' }
├─► Try fallback: Gemini API
└─► Show user message: "Translation not available for this language pair"

Scenario 3: Translation Timeout
├─► Offscreen manager timeout (15s)
├─► Cancel task
├─► Reject promise
├─► Try fallback: Gemini API
└─► Show user message: "Translation timed out"

Scenario 4: Model Download Failed
├─► downloadprogress events stop
├─► ready promise rejected
├─► Catch error
├─► Try fallback: Gemini API
└─► Show user message: "Failed to download translation model"

Scenario 5: Network Error (Gemini Fallback)
├─► Chrome AI failed
├─► Try Gemini API
├─► Network request fails
└─► Show user message: "Translation unavailable"
```

## Caching Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                      Cache Layers                                │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Memory Cache (ChromeTranslator)
├─► Key: "sourceLanguage:targetLanguage:text"
├─► Size: 500 entries (LRU)
├─► Speed: <10ms
└─► Scope: Per translator instance

Layer 2: Session Cache (Chrome Storage)
├─► Key: "translation_cache_${hash}"
├─► Size: Unlimited (session only)
├─► Speed: ~50ms
└─► Scope: Extension session

Layer 3: Model Cache (Chrome)
├─► Managed by Chrome
├─► Downloaded once per language pair
├─► Persisted across sessions
└─► Automatic cleanup

Translation Flow with Cache:
1. Check memory cache → Hit? Return immediately
2. Check session cache → Hit? Return + update memory
3. Call Chrome AI → Cache result in both layers
4. Return translation
```

## Summary

This architecture ensures:

- ✅ Correct API namespace usage
- ✅ Proper context isolation
- ✅ Efficient message passing
- ✅ Robust error handling
- ✅ Smart caching
- ✅ Fallback support
- ✅ Good performance
