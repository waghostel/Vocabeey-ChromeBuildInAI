# Technology Stack & Build System

## Core Technologies

- **TypeScript**: ES2022 target with strict mode enabled
- **Chrome Extension**: Manifest V3 with service worker architecture
- **Package Manager**: pnpm (required, enforced via preinstall hook)
- **Node.js**: 18+ required

## Build System

- **Compiler**: TypeScript with ES2022 modules
- **Output**: `dist/` directory with source maps
- **Asset Pipeline**: Custom script (`scripts/copy-assets.js`)
- **Watch Mode**: `tsc --watch` for development

## Code Quality Tools

- **Linter**: Oxlint (primary) + ESLint (fallback) with TypeScript-specific rules
- **Formatter**: Prettier with automatic formatting
- **Git Hooks**: Husky with pre-commit checks via lint-staged
- **Type Checking**: Strict TypeScript with `noUnusedLocals`, `noImplicitReturns`

## Testing Framework

- **Test Runner**: Vitest with jsdom environment
- **Setup**: Global test setup in `tests/setup.ts`
- **Coverage**: V8 provider with HTML/JSON reports
- **Mocking**: Chrome APIs mocked in test setup

## Chrome Extension Architecture

- **Background**: Service worker (`src/background/service-worker.ts`)
- **Content Scripts**: DOM interaction (`src/content/content-script.ts`)
- **Offscreen Documents**: AI processing (`src/offscreen/ai-processor.ts`)
- **UI Components**: Learning interface in `src/ui/`
- **Permissions**: `storage`, `activeTab`, `scripting`, `offscreen`

## AI Integration

- **Primary**: Chrome Built-in AI APIs (Summarizer, Translator, Rewriter, Language Detector)
- **Fallback**: Gemini API with user-provided keys
- **Content Extraction**: Readability.js → Jina Reader API → DOM parsing

## Dependencies

- **Runtime**: `@mozilla/readability` for content extraction
- **Dev Dependencies**: Chrome types, testing libraries, build tools
- **No Runtime Framework**: Vanilla TypeScript/JavaScript

## Common Commands

### Development

```bash
pnpm install          # Install dependencies
pnpm prepare          # Setup Husky hooks
pnpm dev              # Watch mode development
pnpm build            # Production build
```

### Code Quality

```bash
pnpm lint             # Oxlint checking
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Prettier formatting
pnpm type-check       # TypeScript validation
```

### Testing

```bash
pnpm test             # Run tests once
pnpm test:watch       # Watch mode testing
pnpm test:coverage    # Coverage reports
pnpm test:ui          # Vitest UI
```

### Extension Development

```bash
pnpm validate:extension  # Full validation pipeline
pnpm copy-assets        # Copy static assets
```

## Build Output Structure

```
dist/
├── background/service-worker.js
├── content/content-script.js
├── offscreen/ai-processor.js
├── ui/*.js
└── manifest.json
```

## Rules

- Don't create Kiro Spec until user ask you to do
- Don't create markdown file for task summary or question answering purpose ==> Report it back in chat directly
- Only create markdown document when it is a guide for system, place it in a supdirectory in docs folder.
