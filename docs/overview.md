# Project Overview

## Language Learning Chrome Extension

A Chrome Extension (Manifest V3) that transforms web articles into interactive language learning experiences using Chrome's built-in AI APIs.

### Core Purpose

Transform web articles into interactive language learning experiences with:

- Clean reading mode with card-based UI
- Dual highlighting system (vocabulary and sentence modes)
- AI-powered content processing and translation
- Progressive learning with difficulty adaptation
- Offline capability with local storage

### Target Users

Language learners who want to practice with real-world content from web articles.

### Key Features

#### Content Processing

- **Extraction Pipeline**: Readability.js → Jina Reader API → DOM parsing fallback
- **AI Processing**: Chrome Built-in AI APIs with Gemini fallback
- **Content Adaptation**: Difficulty-based rewriting and summarization

#### Learning Modes

- **Vocabulary Mode**: Word/phrase highlighting with translation cards
- **Sentence Mode**: Sentence highlighting with contextual translations
- **Learning Interface**: Grid layout with display options and TTS support

#### AI Integration

- **Chrome Built-in AI**: Summarizer, Translator, Rewriter, Language Detector
- **Gemini API Fallback**: Extended functionality for unsupported languages
- **Intelligent Processing**: Context-aware translations and vocabulary analysis

#### Data Management

- **Local Storage**: Privacy-focused with no tracking
- **Caching System**: Processed articles and translations
- **Export/Import**: Backup and restore functionality

### Technical Approach

#### Extension Architecture

- **Click-based Activation**: User-initiated processing via toolbar icon click
- **Full-page takeover**: New tab for learning interface
- **Service Worker**: Background processing and message routing
- **Content Scripts**: On-demand page content extraction
- **Offscreen Documents**: Heavy AI processing without timeout limits

#### AI Service Chain

```
Chrome Built-in AI (Primary) → Gemini API (Fallback) → Error Handling
```

#### Storage Strategy

- **Session Storage**: Processing state and temporary data
- **Local Storage**: User settings and vocabulary
- **Cache Management**: Article content and AI results

### Hardware Requirements

- **Minimum**: Chrome 140+, Windows 10+/macOS 13+/Linux/ChromeOS
- **Recommended**: 22GB+ free space, 4GB+ VRAM, unlimited internet
- **Auto-detection**: System capabilities with Gemini API suggestions

### Development Status

- **Completed**: Core infrastructure and Chrome AI integration
- **Completed**: Content extraction and processing pipeline
- **Completed**: Comprehensive test suite (700+ tests)
- **Completed**: Code quality tools (ESLint, Prettier, Husky)
- **In Progress**: Learning interface implementation
- **In Progress**: Settings and configuration UI
- **Planned**: User acceptance testing and polish

### Success Metrics

- Content extraction success rate >90%
- AI processing completion rate >95%
- Extension load time <3 seconds
- Memory usage <100MB per tab
