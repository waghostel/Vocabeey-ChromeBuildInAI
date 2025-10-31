# Development Setup Guide

Complete setup guide for the Language Learning Chrome Extension development environment.

## Prerequisites

### Required Software

- **Node.js 18+**: JavaScript runtime
- **pnpm 8+**: Package manager (enforced via preinstall hook)
- **Chrome 140+**: For built-in AI APIs testing
- **Git**: Version control

### Chrome AI Setup

Enable Chrome's built-in AI before development:

1. Navigate to `chrome://flags/#optimization-guide-on-device-model`
2. Set "Optimization Guide On Device Model" to **Enabled**
3. Relaunch Chrome
4. Verify: Open console and run `console.log('ai' in window);`

### Verification

```bash
node --version    # Should be 18+
pnpm --version    # Should be 8+
chrome --version  # Should be 140+
git --version     # Any recent version
```

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd language-learning-extension
```

### 2. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Initialize git hooks
pnpm prepare
```

### 3. Verify Installation

```bash
# Check TypeScript compilation
pnpm type-check

# Check linting
pnpm lint

# Run tests
pnpm test

# Build extension
pnpm build
```

## Development Environment

### Code Quality Tools

The project includes comprehensive code quality automation:

- ✅ **Oxlint**: Fast Rust-based linting (default)
- ✅ **ESLint**: Comprehensive TypeScript linting (alternative)
- ✅ **Prettier**: Code formatting
- ✅ **Husky**: Git hooks
- ✅ **lint-staged**: Pre-commit checks

### Pre-commit Automation

Every commit automatically:

1. **Prettier** formats staged files
2. **Oxlint** checks and fixes issues
3. Blocks commit if errors remain

Test the pre-commit hook:

```bash
# Make a change and stage it
echo "// test comment" >> src/types/index.ts
git add src/types/index.ts

# Commit (hooks run automatically)
git commit -m "test: verify pre-commit hook"
```

### Linting Strategy

**Dual Linter Setup:**

- **Oxlint (Default)**: ~10-100x faster, ideal for development
- **ESLint (Alternative)**: Comprehensive analysis for CI/CD

Switch between linters:

```bash
# Use Oxlint (fast)
pnpm run lint:switch --oxlint

# Use ESLint (comprehensive)
pnpm run lint:switch --eslint
```

## Project Configuration

### TypeScript Configuration

- **Target**: ES2022 with ES2022 modules
- **Strict Mode**: Enabled with explicit return types
- **Chrome Types**: Included for extension APIs
- **Source Maps**: Generated for debugging

### Code Style Rules

- **Quotes**: Single quotes (`'`)
- **Semicolons**: Required (`;`)
- **Indentation**: 2 spaces
- **Line Width**: 80 characters
- **Trailing Commas**: ES5 style

### Chrome Extension Context Rules

| Context         | DOM Access | Chrome APIs | Console | Restrictions           |
| --------------- | ---------- | ----------- | ------- | ---------------------- |
| Service Worker  | ❌         | ✅          | ✅      | No `window`/`document` |
| Content Scripts | ✅         | Limited     | ⚠️      | Page isolation         |
| Offscreen Docs  | ✅         | Specific    | ✅      | Heavy processing       |
| UI Components   | ✅         | ✅          | ⚠️      | Full access            |

## Build System

### Build Configuration

```bash
# Development build with watch mode
pnpm dev

# Production build
pnpm build

# Type checking only
pnpm type-check
```

### Build Output Structure

```
dist/
├── background/service-worker.js    # Service worker
├── content/content-script.js       # Content scripts
├── offscreen/ai-processor.js       # AI processing
├── ui/*.js                         # UI components
└── manifest.json                   # Extension manifest
```

### Asset Pipeline

- **TypeScript Compilation**: `src/` → `dist/`
- **Asset Copying**: Static files via `scripts/copy-assets.js`
- **Source Maps**: Generated for debugging
- **Manifest Processing**: Chrome Extension Manifest V3

## Testing Setup

### Test Framework

- **Vitest**: Fast unit testing with TypeScript support
- **jsdom**: DOM implementation for Node.js
- **Chrome API Mocks**: Comprehensive extension API simulation

### Test Structure

```
tests/
├── setup.ts                    # Global test configuration
├── setup/chrome-mock.ts        # Chrome API mocking utilities
├── *.test.ts                   # Unit tests
├── integration.test.ts         # Component integration
├── user-acceptance.test.ts     # End-to-end workflows
└── system-integration.test.ts  # System-wide testing
```

### Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Interactive UI
pnpm test:ui

# Specific test file
pnpm test tests/chrome-ai.test.ts
```

## Chrome Extension Development

### Loading Extension in Chrome

1. Build the extension: `pnpm build`
2. Open Chrome: `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/` folder

### Debugging Different Contexts

**Service Worker:**

- chrome://extensions → Inspect views → service worker

**Content Scripts:**

- Open page DevTools → Sources tab → Content scripts

**Offscreen Documents:**

- chrome://extensions → Inspect views → offscreen.html

**Storage:**

- DevTools → Application → Storage → Extension storage

### Message Passing

Use typed interfaces for inter-component communication:

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

## Troubleshooting

### Common Issues

**Build Failures:**

```bash
# Clear cache and rebuild
rm -rf dist node_modules
pnpm install
pnpm build
```

**Linting Errors:**

```bash
# Clear ESLint cache
pnpm exec eslint --clear-cache

# Auto-fix issues
pnpm lint:fix

# Format code
pnpm format
```

**Test Failures:**

```bash
# Run specific test
pnpm test tests/failing-test.test.ts

# Debug with UI
pnpm test:ui

# Clear test cache
pnpm test --run --reporter=verbose
```

**Extension Loading Issues:**

- Verify `dist/manifest.json` exists
- Check Chrome DevTools console for errors
- Ensure Chrome version 140+
- Try reloading extension in chrome://extensions

### Git Hook Issues

```bash
# Reinitialize Husky
pnpm exec husky init

# Check hook permissions
chmod +x .husky/pre-commit
```

### TypeScript Issues

```bash
# Check configuration
pnpm type-check

# Verify Chrome types
pnpm add -D @types/chrome chrome-types
```

## Advanced Configuration

### Custom ESLint Rules

Edit `eslint.config.js` for project-specific rules:

```javascript
export default [
  // ... existing config
  {
    files: ['src/custom/**/*.ts'],
    rules: {
      // Custom rules for specific directories
    },
  },
];
```

### Custom Prettier Configuration

Edit `.prettierrc` for formatting preferences:

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Vitest Configuration

Edit `vitest.config.ts` for test customization:

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    // Custom test configuration
  },
});
```

## Next Steps

After setup completion:

1. **Explore Codebase**: Review `src/` directory structure
2. **Run Tests**: Ensure all tests pass with `pnpm test`
3. **Load Extension**: Test in Chrome browser
4. **Read Documentation**: Check [Architecture Guide](../architecture/README.md)
5. **Start Development**: Follow [Development Workflow](README.md)

## Getting Help

If you encounter issues:

1. Check this setup guide
2. Review [Development Guide](README.md)
3. Consult [Testing Documentation](../testing/README.md)
4. Check project issues and discussions

Happy coding! 🚀
