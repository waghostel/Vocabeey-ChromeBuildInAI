# Development Guide

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+ (required, enforced via preinstall hook)
- Chrome 140+ (for built-in AI APIs)

### Quick Setup

```bash
# Clone and install
git clone <repository-url>
cd language-learning-extension
pnpm install

# Initialize git hooks
pnpm prepare

# Start development
pnpm dev
```

## Development Workflow

### Daily Commands

```bash
# Development
pnpm dev              # Watch mode compilation
pnpm build            # Production build

# Code Quality
pnpm lint             # Oxlint (fast) checking
pnpm lint:fix         # Auto-fix issues
pnpm format           # Prettier formatting
pnpm type-check       # TypeScript validation

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Watch mode testing
pnpm test:coverage    # Coverage reports
pnpm test:ui          # Vitest UI

# Extension Validation
pnpm validate:extension  # Full validation pipeline
```

### Code Quality Automation

#### Pre-commit Hooks

Every commit automatically runs:

1. Prettier formats staged files
2. Oxlint checks and fixes issues
3. Commit proceeds if no errors

#### Linting Strategy

- **Oxlint (Default)**: Fast Rust-based linting for development
- **ESLint (Alternative)**: Comprehensive analysis for CI/CD
- **Switch between linters**: `pnpm run lint:switch --oxlint|--eslint`

## Project Structure

```
src/
├── background/       # Service worker (no DOM access)
├── content/          # Content scripts (DOM interaction)
├── offscreen/        # Offscreen documents (AI processing)
├── ui/               # User interface components
├── types/            # TypeScript type definitions (centralized)
└── utils/            # Shared utilities (single-responsibility)

tests/                # Test files with comprehensive coverage
dist/                 # Compiled output (generated)
docs/                 # Documentation
.kiro/                # Kiro IDE configuration and specs
```

### Architecture Principles

- **Separation of Concerns**: Each directory has specific responsibility
- **Centralized Types**: All TypeScript interfaces in `src/types/index.ts`
- **Utility-First**: Shared logic in `src/utils/` with single-responsibility
- **Chrome Extension Boundaries**: Respect service worker vs content script limitations

## Chrome Extension Development

### Context-Specific Rules

- **Service Worker** (`background/`): No DOM access, Chrome APIs only
- **Content Scripts** (`content/`): Full DOM access + Chrome messaging
- **Offscreen Documents** (`offscreen/`): DOM + specific Chrome APIs
- **UI Components** (`ui/`): Full DOM access + Chrome extension APIs

### Message Passing

Use typed message interfaces for inter-component communication:

```typescript
// Define in src/types/index.ts
interface ExtractContentMessage {
  type: 'EXTRACT_CONTENT';
  url: string;
}

// Use in components
chrome.runtime.sendMessage<ExtractContentMessage>({
  type: 'EXTRACT_CONTENT',
  url: window.location.href,
});
```

### Storage Patterns

- **Versioned Schema**: Include version tracking for migrations
- **Session vs Local**: Temporary data in session, persistent in local
- **Cache Management**: Automatic cleanup when approaching limits

## Testing Strategy

### Test Structure

```
tests/
├── setup.ts                    # Global test configuration
├── setup/chrome-mock.ts        # Chrome API mocking utilities
├── *.test.ts                   # Unit tests
├── integration.test.ts         # Cross-component integration
├── user-acceptance.test.ts     # End-to-end user workflows
└── system-integration.test.ts  # System-wide integration
```

### Test Categories

- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component interaction and data flow
- **User Acceptance Tests**: Complete user workflows
- **System Tests**: Extension lifecycle and performance

### Running Tests

```bash
# All tests
pnpm test

# Specific test file
pnpm test tests/chrome-ai.test.ts

# Watch mode for development
pnpm test:watch

# Coverage report
pnpm test:coverage
```

## Code Style Guidelines

### TypeScript

- **Strict Mode**: Enabled with explicit return types
- **Named Exports**: Prefer over default exports
- **Type Imports**: Use `import type` for type-only imports
- **No `any`**: Use proper types or `unknown`

### File Naming

- **Kebab-case**: All files use kebab-case (`content-script.ts`)
- **Descriptive Names**: Files clearly indicate purpose
- **Component Grouping**: Related functionality in same directory

### Import/Export Patterns

```typescript
// ✅ Good - named exports
export { CacheManager, getCacheManager };

// ✅ Good - type imports
import type { UserSettings } from './types';

// ✅ Good - relative imports within module
import { validateContent } from './validation';

// ✅ Good - absolute imports for cross-module
import { getCacheManager } from '../utils/cache-manager';
```

## Build System

### TypeScript Compilation

- **Target**: ES2022 with ES2022 modules
- **Output**: `dist/` directory with source maps
- **Type Checking**: Strict mode with Chrome types

### Asset Pipeline

- **Static Assets**: Copied via `scripts/copy-assets.js`
- **Manifest**: Chrome Extension Manifest V3
- **Icons**: Multiple sizes for different contexts

### Build Output

```
dist/
├── background/service-worker.js
├── content/content-script.js
├── offscreen/ai-processor.js
├── ui/*.js
└── manifest.json
```

## Debugging

### Chrome Extension Debugging

1. Load `dist/` as unpacked extension
2. Use Chrome DevTools for each context:
   - **Service Worker**: chrome://extensions → Inspect views
   - **Content Script**: Page DevTools → Sources
   - **Offscreen**: chrome://extensions → Inspect views

### Common Issues

- **Service Worker Limitations**: No `window` or `document` access
- **Content Script Context**: Isolated from page scripts
- **Message Passing**: Ensure proper message type definitions
- **Storage Quota**: Monitor usage and implement cleanup

## Contributing

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Run `pnpm validate:extension`
4. Submit PR with clear description

### Code Review Checklist

- [ ] Tests pass and cover new functionality
- [ ] Code follows style guidelines
- [ ] TypeScript types are properly defined
- [ ] Chrome extension context rules followed
- [ ] Documentation updated if needed

### Commit Messages

Use conventional commits:

```
feat: add vocabulary highlighting system
fix: resolve cache manager export issues
docs: update API documentation
test: add integration tests for AI fallback
```

## Troubleshooting

### Common Development Issues

#### ESLint/Oxlint Errors

```bash
# Clear cache
pnpm exec eslint --clear-cache

# Switch linters
pnpm run lint:switch --oxlint
```

#### Test Failures

```bash
# Run specific test
pnpm test tests/failing-test.test.ts

# Debug with UI
pnpm test:ui
```

#### Build Issues

```bash
# Clean build
rm -rf dist node_modules
pnpm install
pnpm build
```

#### Chrome Extension Issues

- Check manifest.json syntax
- Verify permissions in Chrome
- Check service worker console for errors
- Ensure content scripts are injected properly

### Getting Help

1. Check this documentation
2. Review test files for usage examples
3. Consult Chrome Extension documentation
4. Check project issues and discussions
