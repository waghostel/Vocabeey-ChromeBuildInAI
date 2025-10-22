# ESLint + Prettier Setup Guide

## ✅ Installation Complete

Your Chrome extension project is now configured with:

- ✅ **pnpm** as package manager
- ✅ **TypeScript** with strict mode
- ✅ **ESLint** with TypeScript support
- ✅ **Prettier** for code formatting
- ✅ **Husky** for git hooks
- ✅ **lint-staged** for pre-commit checks

## Quick Start

### 1. Development Workflow

```bash
# Start development with watch mode
pnpm dev

# Check your code
pnpm lint
pnpm type-check

# Format your code
pnpm format

# Build for production
pnpm build
```

### 2. Pre-commit Hook

Every time you commit, the following happens automatically:

1. **Prettier** formats your staged files
2. **ESLint** checks and fixes linting issues

To test it:

```bash
# Make a change to a file
# Stage it
git add src/types/index.ts

# Commit (hooks will run automatically)
git commit -m "test: verify pre-commit hook"
```

### 3. Project Structure

```
ChromeBuildInAI/
├── src/
│   ├── background/       # Service worker (no window/document)
│   ├── content/          # Content scripts (DOM access)
│   ├── offscreen/        # Offscreen documents
│   ├── ui/               # UI components
│   ├── types/            # TypeScript types
│   └── utils/            # Utilities
├── dist/                 # Compiled output
├── tests/                # Test files
├── .husky/               # Git hooks
├── eslint.config.js      # ESLint configuration
├── tsconfig.json         # TypeScript configuration
├── .prettierrc           # Prettier configuration
└── package.json          # Dependencies and scripts
```

## Configuration Details

### ESLint Rules

**TypeScript files** (stricter):

- Explicit function return types (warning)
- No unused variables (error)
- No floating promises (error)
- Import ordering enforced

**Service Worker** (`src/background/`):

- Cannot use `window` or `document`
- Console allowed
- Floating promises are errors

**Content Scripts** (`src/content/`):

- Full DOM access
- Console warnings (not errors)

**Test files** (`*.test.ts`, `*.spec.ts`):

- Relaxed rules for `any` types
- Jest globals available

### Prettier Settings

- Single quotes
- 2 spaces indentation
- 80 character line width
- Semicolons required
- Trailing commas (ES5)

### TypeScript Settings

- Target: ES2022
- Module: ES2022
- Strict mode enabled
- Chrome types included
- Source maps generated

## Troubleshooting

### ESLint errors after editing config

```bash
# Clear ESLint cache
pnpm exec eslint --cache-location .eslintcache --clear-cache
```

### Husky hooks not running

```bash
# Reinitialize Husky
pnpm exec husky init
```

### Type errors in Chrome APIs

Make sure `@types/chrome` is installed:

```bash
pnpm add -D @types/chrome
```

## Next Steps

1. Create `manifest.json` in `src/` directory
2. Add more source files following the structure
3. Configure build tools (webpack/rollup) if needed
4. Add Jest for testing
5. Set up CI/CD pipeline

## Useful Commands

```bash
# Check what will be formatted
pnpm format:check

# Fix all auto-fixable issues
pnpm lint:fix

# Run type checking without building
pnpm type-check

# Update dependencies
pnpm update

# Check for outdated packages
pnpm outdated
```

## Chrome Extension Specific Notes

- Service workers run in a different context (no DOM)
- Content scripts have access to page DOM
- Use message passing for communication
- Chrome APIs are async (use promises)
- Manifest V3 requires ES modules

Happy coding! 🚀
