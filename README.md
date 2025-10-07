# Language Learning Chrome Extension

Chrome Extension for interactive language learning using built-in AI APIs.

## Development Setup

This project uses **pnpm** as the package manager with ESLint + Prettier for code quality.

### Prerequisites

- Node.js 18+
- pnpm 8+
- Chrome 140+ (for built-in AI APIs)

### Installation

```bash
# Install dependencies
pnpm install

# Initialize Husky hooks
pnpm prepare
```

### Available Scripts

```bash
# Linting
pnpm lint              # Check for linting errors
pnpm lint:fix          # Fix linting errors automatically

# Formatting
pnpm format            # Format all files
pnpm format:check      # Check formatting without modifying files

# Type Checking
pnpm type-check        # Run TypeScript type checking

# Building
pnpm build             # Compile TypeScript to JavaScript
pnpm dev               # Watch mode for development
```

### Project Structure

```
src/
├── background/        # Service worker and background scripts
├── content/          # Content scripts for web page interaction
├── offscreen/        # Offscreen documents for AI processing
├── ui/               # User interface components
├── types/            # TypeScript type definitions
└── utils/            # Utility functions

tests/                # Test files
dist/                 # Compiled output (generated)
```

### Code Quality

This project enforces code quality through:

- **ESLint**: Linting with TypeScript-specific rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **lint-staged**: Run linters on staged files only

### Pre-commit Hooks

Before each commit, the following checks run automatically:

1. Prettier formats staged files
2. ESLint checks and fixes staged files

### Chrome Extension Specific Rules

- Service workers cannot use `window` or `document` globals
- Content scripts have access to DOM APIs
- TypeScript files have stricter rules than JavaScript files
- Console logs are allowed in background scripts but warned in content scripts

### TypeScript Configuration

- Target: ES2022
- Module: ES2022
- Strict mode enabled
- Chrome types included

## License

MIT
