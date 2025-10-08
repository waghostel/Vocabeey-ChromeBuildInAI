# Project Structure

This document describes the organization of the Language Learning Chrome Extension project.

## Directory Structure

```
.
├── src/                          # Source code
│   ├── background/               # Background service worker
│   │   └── service-worker.ts     # Main background script
│   ├── content/                  # Content scripts
│   │   └── content-script.ts     # Main content script
│   ├── offscreen/                # Offscreen documents for AI processing
│   ├── ui/                       # User interface components
│   │   ├── popup/                # Extension popup
│   │   └── sidebar/              # Learning interface sidebar
│   ├── types/                    # TypeScript type definitions
│   │   └── index.ts              # Core data models and interfaces
│   └── utils/                    # Shared utilities
│
├── dist/                         # Compiled output (generated)
│   ├── background/
│   ├── content/
│   ├── offscreen/
│   ├── ui/
│   └── manifest.json
│
├── icons/                        # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
│
├── scripts/                      # Build scripts
│   └── copy-assets.js            # Asset copying script
│
├── .kiro/                        # Kiro IDE configuration
│   └── specs/                    # Feature specifications
│
├── manifest.json                 # Chrome Extension Manifest V3
├── package.json                  # pnpm dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

## Core Components

### Type Definitions (`src/types/index.ts`)

All TypeScript interfaces and types are centralized in this file:

- **UserSettings**: User preferences and configuration
- **ProcessedArticle**: Article data structure with parts
- **VocabularyItem**: Individual vocabulary entries
- **SentenceItem**: Sentence translations
- **AIProcessor**: AI service interfaces
- **StorageManager**: Data persistence interfaces
- **LearningInterface**: UI component interfaces
- **Message types**: Inter-component communication

### Background Service Worker

Handles:

- Extension lifecycle
- Message routing
- Background processing
- Storage management

### Content Scripts

Injected into web pages to:

- Extract article content
- Render learning interface
- Handle user interactions
- Manage highlights

### Offscreen Documents

Used for:

- AI API calls (Chrome's built-in AI)
- Heavy processing tasks
- Maintaining context

## Build Configuration

### TypeScript Compilation

- **Target**: ES2022
- **Module**: ES2022
- **Output**: `dist/` directory
- **Source Maps**: Enabled for debugging

### Build Scripts

- `pnpm run build`: Compile TypeScript and copy assets
- `pnpm run dev`: Watch mode for development
- `pnpm run type-check`: Type checking without compilation
- `pnpm run lint`: ESLint code quality checks
- `pnpm run format`: Prettier code formatting

## Chrome Extension Manifest V3

Key features:

- Service worker background script
- Content script injection
- Offscreen document support
- Storage and activeTab permissions
- Web accessible resources for UI components

## Development Workflow

1. Make changes in `src/`
2. Run `pnpm run build` to compile
3. Load `dist/` folder as unpacked extension in Chrome
4. Test functionality
5. Iterate

For active development, use `pnpm run dev` to watch for changes.
