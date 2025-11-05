# Prompt: Chrome Extension Linting Setup with Oxlint/ESLint Toggle (TypeScript First)

## Usage

Run with flags to choose your linter:

- `--oxlint` (default): Use Oxlint for fast, Rust-based linting
- `--eslint`: Use ESLint for comprehensive, configurable linting

## Oxlint Setup (Default - Fast & Efficient)

1. **Install Oxlint and Chrome extension support.**
   - Use: `oxlint` as the primary linter
   - Install `@types/chrome` and `chrome-types` for Chrome API typing
   - **Note:** Oxlint is significantly faster than ESLint, written in Rust

2. **Configure Oxlint for Chrome extension contexts.**
   - Create `oxlint.json` with Chrome extension specific rules
   - Configure different rule sets for background, content, and offscreen contexts
   - **Note:** Oxlint has built-in TypeScript support without additional plugins

3. **Set up Oxlint scripts in package.json.**

   ```json
   {
     "scripts": {
       "lint": "oxlint src",
       "lint:fix": "oxlint src --fix",
       "lint:manifest": "prettier --check manifest.json",
       "lint:extension": "oxlint src && pnpm run lint:manifest"
     }
   }
   ```

4. **Configure Oxlint for Chrome extension file patterns.**
   - Background/Service Worker: Restrict DOM globals, allow Chrome APIs
   - Content Scripts: Allow DOM and Chrome messaging APIs
   - Offscreen Documents: Allow DOM and specific Chrome APIs
   - UI/Popup: Full DOM access with Chrome extension APIs

## ESLint Setup (Comprehensive & Configurable)

1. **Install ESLint with Chrome extension plugins.**
   - Use comprehensive ESLint setup with `@typescript-eslint/eslint-plugin`
   - Add `eslint-plugin-chrome-extension` for Chrome-specific rules
   - Install `eslint-plugin-import` for import ordering
   - **Note:** More configurable but slower than Oxlint

2. **Configure ESLint flat config for Chrome extensions.**
   - Set up context-specific configurations
   - Add Chrome extension globals and API restrictions
   - Configure TypeScript-first approach with stricter rules

3. **Set up ESLint scripts in package.json.**
   ```json
   {
     "scripts": {
       "lint": "eslint src --ext .ts,.js",
       "lint:fix": "eslint src --ext .ts,.js --fix",
       "lint:manifest": "prettier --check manifest.json",
       "lint:extension": "eslint src --ext .ts,.js && pnpm run lint:manifest"
     }
   }
   ```

## Prettier Integration (Both Setups)

1. **Install Prettier for code formatting.**
   - Add `prettier` for consistent code formatting
   - Configure `.prettierrc` for Chrome extension development
   - **Note:** Both Oxlint and ESLint work with Prettier for formatting

2. **Configure Prettier for Chrome extension files.**
   ```json
   {
     "semi": true,
     "trailingComma": "es5",
     "singleQuote": true,
     "printWidth": 80,
     "tabWidth": 2,
     "useTabs": false,
     "bracketSpacing": true,
     "arrowParens": "avoid",
     "endOfLine": "lf"
   }
   ```

## Husky + lint-staged Setup (Both Setups)

1. **Install and configure Husky.**

   ```bash
   pnpm add -D husky lint-staged
   pnpm exec husky install
   echo "pnpm exec lint-staged" > .husky/pre-commit
   ```

2. **Configure lint-staged for Chrome extensions.**

   ```json
   "lint-staged": {
     "*.{ts,js}": [
       "prettier --write",
       "pnpm run lint:fix"
     ],
     "*.{json,md}": [
       "prettier --write"
     ],
     "manifest.json": [
       "prettier --write"
     ],
     "src/**/*.{html,css}": [
       "prettier --write"
     ]
   }
   ```

3. **Add prepare script for Husky auto-install.**
   ```json
   {
     "scripts": {
       "prepare": "husky"
     }
   }
   ```

## Testing Integration

1. **Configure Vitest with linting.**
   - Add test-specific linting rules
   - Configure Chrome API mocking for tests
   - Set up proper globals for test files

2. **Add testing scripts.**
   ```json
   {
     "scripts": {
       "test": "vitest --run",
       "test:watch": "vitest",
       "test:coverage": "vitest --run --coverage",
       "validate:extension": "pnpm run lint:extension && pnpm run test && pnpm run build"
     }
   }
   ```

## Configuration Files

### Oxlint Configuration (`oxlint.json`)

```json
{
  "rules": {
    "typescript": "error",
    "correctness": "error",
    "suspicious": "error",
    "perf": "warn"
  },
  "globals": {
    "chrome": "readonly",
    "browser": "readonly"
  },
  "env": {
    "webextensions": true,
    "es2022": true
  }
}
```

### ESLint Configuration (`eslint.config.js`)

```javascript
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        chrome: 'readonly',
        browser: 'readonly',
      },
    },
  },
  // Chrome extension specific configurations...
];
```

## Installation Scripts

### Oxlint Setup (Default)

```bash
# Install Oxlint and dependencies
pnpm add -D oxlint prettier husky lint-staged
pnpm add -D @types/chrome chrome-types

# Initialize Husky
pnpm exec husky install
echo "pnpm exec lint-staged" > .husky/pre-commit

# Create oxlint.json configuration
# (Configuration will be created automatically)
```

### ESLint Setup (Alternative)

```bash
# Install ESLint and plugins
pnpm add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
pnpm add -D eslint-plugin-chrome-extension eslint-plugin-import
pnpm add -D prettier eslint-config-prettier eslint-plugin-prettier
pnpm add -D husky lint-staged @types/chrome chrome-types

# Initialize Husky
pnpm exec husky install
echo "pnpm exec lint-staged" > .husky/pre-commit

# Create eslint.config.js configuration
# (Configuration will be created automatically)
```

## Chrome Extension Specific Features

1. **Manifest validation**
   - Prettier formatting for manifest.json
   - Schema validation for Manifest v3
   - Permission usage validation

2. **Context-aware linting**
   - Service Worker restrictions (no DOM globals)
   - Content Script permissions (DOM + Chrome APIs)
   - Offscreen Document capabilities
   - UI/Popup full access

3. **Build integration**
   - Type checking with TypeScript
   - Asset copying and validation
   - Extension packaging preparation

---

**Performance Comparison:**

- **Oxlint**: ~10-100x faster than ESLint, built in Rust, fewer configuration options
- **ESLint**: More plugins and rules available, slower but more comprehensive

**Recommendation**: Use Oxlint for development speed, ESLint for comprehensive linting in CI/CD pipelines.
