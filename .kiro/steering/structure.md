# Project Structure & Architecture Patterns

## Directory Organization

### Source Code (`src/`)

```
src/
├── background/           # Service worker (background processing)
├── content/             # Content scripts (DOM interaction)
├── offscreen/           # Offscreen documents (AI processing)
├── ui/                  # User interface components
├── types/               # TypeScript type definitions (centralized)
├── utils/               # Shared utilities and services
```

### Key Architecture Principles

- **Separation of Concerns**: Each directory has a specific responsibility
- **Centralized Types**: All TypeScript interfaces in `src/types/index.ts`
- **Utility-First**: Shared logic in `src/utils/` with single-responsibility modules
- **Chrome Extension Boundaries**: Respect service worker vs content script limitations

## File Naming Conventions

- **Kebab-case**: All file names use kebab-case (`content-script.ts`, `ai-processor.ts`)
- **Descriptive Names**: Files clearly indicate their purpose
- **Component Grouping**: Related functionality grouped in same directory

## Architecture Patterns

### Chrome Extension Components

- **Service Worker** (`background/`): Extension lifecycle, message routing, background tasks
- **Content Scripts** (`content/`): DOM manipulation, user interaction, content extraction
- **Offscreen Documents** (`offscreen/`): Heavy AI processing, maintaining context
- **UI Components** (`ui/`): Learning interface, settings, setup wizard

### Utility Modules (`src/utils/`)

Each utility module follows single-responsibility principle:

- `storage-manager.ts`: Data persistence with versioned schema
- `cache-manager.ts`: Article and processing result caching
- `ai-service-coordinator.ts`: AI service orchestration and fallbacks
- `chrome-ai.ts`: Chrome Built-in AI API integration
- `gemini-api.ts`: Gemini API fallback integration
- `content-extraction.ts`: Article content extraction pipeline
- `error-handler.ts`: Centralized error handling and recovery
- `memory-manager.ts`: Memory usage optimization
- `tts-service.ts`: Text-to-speech functionality

### Data Flow Architecture

```
Content Script → Service Worker → Offscreen Document → AI APIs
     ↓                ↓                    ↓
Storage Manager ← Cache Manager ← Processing Results
```

## Code Organization Rules

### Type Definitions

- **Centralized**: All interfaces in `src/types/index.ts`
- **Exported**: Use named exports for all types
- **Documented**: JSDoc comments for complex interfaces
- **Versioned**: Storage schema includes version tracking

### Error Handling

- **Consistent**: Use centralized `ErrorHandler` class
- **Graceful Degradation**: Fallback chains for AI services
- **User-Friendly**: Clear error messages with recovery suggestions

### Testing Structure

```
tests/
├── setup.ts                    # Global test configuration
├── *.test.ts                   # Unit tests (co-located with features)
├── integration.test.ts         # Cross-component integration
├── setup/chrome-mock.ts        # Chrome API mocking
```

### Configuration Files

- **Root Level**: Build and tooling configuration
- **Manifest**: Chrome extension configuration
- **TypeScript**: Strict mode with Chrome types
- **ESLint**: Context-specific rules (background vs content vs UI)

## Import/Export Patterns

- **Named Exports**: Prefer named exports over default exports
- **Barrel Exports**: Use index files for clean imports
- **Type Imports**: Use `import type` for type-only imports
- **Relative Imports**: Use relative paths within same module, absolute for cross-module

## Chrome Extension Specific Rules

- **Service Worker Limitations**: No DOM access, no `window` object
- **Content Script Context**: Full DOM access, limited Chrome APIs
- **Message Passing**: Use typed message interfaces
- **Storage Patterns**: Versioned schema with migration support
- **Permissions**: Minimal required permissions in manifest

## Development Workflow

1. **Types First**: Define interfaces in `src/types/`
2. **Utility Implementation**: Build core logic in `src/utils/`
3. **Component Integration**: Wire components together
4. **Testing**: Unit tests for utilities, integration tests for workflows
5. **Build Validation**: Use `pnpm validate:extension` before commits
