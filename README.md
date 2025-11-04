# Language Learning Assistant

Interactive language learning extension using Chrome's built-in AI APIs to transform web articles into learning experiences.

## Quick Start

```bash
# Install dependencies
pnpm install

# Setup git hooks
pnpm prepare

# Start development (watch mode)
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## Documentation

- **[Complete Documentation](docs/README.md)** - Full documentation index
- **[Quick Start Guide](docs/development/quick-start.md)** - Get running in 5 minutes
- **[User Guide](docs/user-guide/README.md)** - End-user documentation
- **[Architecture](docs/architecture/README.md)** - Technical architecture
- **[API Reference](docs/api/README.md)** - Chrome AI integration
- **[Testing Guide](docs/testing/README.md)** - Test suite and coverage

## Features

- **AI-Powered Processing**: Chrome Built-in AI APIs with Gemini fallback
- **Smart Content Extraction**: Readability.js → Jina Reader API → DOM parsing pipeline
- **Interactive Learning Interface**: Full-page takeover with card-based UI
- **Dual Highlighting System**: Vocabulary mode and sentence mode learning
- **Text-to-Speech Support**: Native pronunciation with TTS service
- **Privacy-First Storage**: Local-first data with offline capability
- **Performance Optimized**: Memory management and caching system
- **Keyboard Shortcuts**: Fast navigation and mode switching with hotkeys

## Keyboard Shortcuts

### Navigation

- **← (Left Arrow)**: Navigate to previous article part
- **→ (Right Arrow)**: Navigate to next article part

### Learning Mode Switching

- **R**: Switch to Reading mode (📖)
- **V**: Switch to Vocabulary learning mode (📝)
- **S**: Switch to Sentences learning mode (💬)

### Highlight Mode Switching (Reading Mode)

- **1**: Vocabulary highlight mode
- **2**: Sentence highlight mode
- **3**, **0**, or **Esc**: None (disable highlighting)

### Highlight Management

- **Delete** or **Backspace**: Delete selected highlight
- **Esc**: Deselect highlight without deleting

### Bulk Delete (None Mode)

1. Switch to None mode (`0`, `3`, or `Esc`)
2. Select text by clicking and dragging
3. Press `Delete` or `Backspace` to delete all selected highlights
4. Press `Esc` to cancel bulk delete preview

### Edit Mode (Paragraph Editing)

- **Enter**: Save changes
- **Esc**: Cancel editing

## Development

### Prerequisites

- Node.js 18+ & pnpm 8+
- Chrome 140+ (for built-in AI APIs)

### Chrome AI Module Requirements

Chrome's built-in AI APIs require:

- **Chrome Version**: 140+ (stable channel)
- **Storage**: 22GB for AI model downloads (automatic)
- **RAM**: 4GB minimum, 8GB recommended
- **VRAM**: 4GB recommended
- **Platform**: Windows 10+, macOS 13+, Linux, or ChromeOS

**Chrome Built-in AI APIs Used**:

1. **Language Detector API** - Automatic language detection for articles
2. **Summarizer API** - Content summarization for learning
3. **Rewriter API** - Difficulty-based content rewriting (1-10 scale)
4. **Translator API** - Vocabulary and sentence translation
5. **Prompt API (Language Model)** - Advanced vocabulary analysis using Gemini Nano

**Setup Steps**:

1. Navigate to `chrome://flags/#optimization-guide-on-device-model`
2. Set "Optimization Guide On Device Model" to **Enabled**
3. Relaunch Chrome
4. AI models will download automatically (22GB)

**Verify Installation**:

```javascript
// Open any webpage console and run:
console.log('Chrome AI available:', 'ai' in window);
```

### Project Structure

```
src/
├── background/       # Service worker (extension lifecycle)
├── content/          # Content scripts (DOM interaction)
├── offscreen/        # Offscreen documents (AI processing)
├── ui/               # User interface components
│   ├── learning-interface.ts    # Main learning UI
│   ├── settings.ts              # Settings management
│   └── setup-wizard.ts          # Initial setup
├── types/            # TypeScript type definitions
└── utils/            # Shared utilities and services
    ├── ai-service-coordinator.ts  # AI service orchestration
    ├── cache-manager.ts           # Caching system
    ├── chrome-ai.ts               # Chrome AI integration
    ├── content-extraction.ts      # Article extraction
    ├── storage-manager.ts         # Data persistence
    └── tts-service.ts             # Text-to-speech

docs/                 # Documentation
tests/                # Test suite (22 test files, 740+ tests)
```

### Key Commands

```bash
# Development
pnpm dev              # TypeScript watch mode
pnpm build            # Production build
pnpm copy-assets      # Copy static assets

# Code Quality
pnpm lint             # Oxlint checking
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Prettier formatting
pnpm type-check       # TypeScript validation

# Testing
pnpm test             # Run test suite once
pnpm test:watch       # Watch mode testing
pnpm test:coverage    # Coverage reports
pnpm test:ui          # Vitest UI

# Validation
pnpm validate:extension  # Full validation pipeline
```

## Quality Assurance

- **740+ Tests**: Comprehensive test coverage across 22 test files
- **Dual Linting**: Oxlint (primary) + ESLint (fallback) with TypeScript rules
- **Type Safety**: Strict TypeScript with Chrome extension types
- **Pre-commit Hooks**: Husky with lint-staged for automated quality checks
- **Performance Testing**: Memory management and benchmark tests included

## Architecture

- **Chrome Extension**: Manifest V3 with service worker architecture
- **AI Integration**: Chrome Built-in AI APIs with Gemini fallback
  - Language Detector API - Automatic language detection
  - Summarizer API - Content summarization
  - Rewriter API - Difficulty-based rewriting
  - Translator API - Vocabulary and sentence translation
  - Prompt API (Language Model) - Vocabulary analysis with Gemini Nano
- **Content Processing**: Multi-stage extraction pipeline with caching
- **Storage**: Versioned schema with local-first privacy approach
- **Testing**: Vitest with jsdom environment and Chrome API mocking

## License

MIT - See [LICENSE](LICENSE) for details

---

**Ready to start?** Check the [Quick Start Guide](docs/development/quick-start.md) or [User Guide](docs/user-guide/README.md).
