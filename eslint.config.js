import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';

export default [
  // Ignore patterns
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js'],
  },

  // Global base configuration
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        chrome: 'readonly',
        browser: 'readonly',
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        self: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },

  // JavaScript files
  {
    files: ['**/*.js', '**/*.mjs'],
    ...js.configs.recommended,
    plugins: {
      prettier,
      import: importPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // TypeScript files (prioritized with stricter rules)
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      prettier,
      import: importPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // Chrome Extension Background/Service Worker specific
  {
    files: [
      'src/background/**/*.ts',
      'src/background/**/*.js',
      '**/service-worker.ts',
      '**/background.ts',
    ],
    languageOptions: {
      globals: {
        chrome: 'readonly',
        self: 'readonly',
        importScripts: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-restricted-globals': ['error', 'window', 'document'],
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },

  // Content Script specific
  {
    files: ['src/content/**/*.ts', 'src/content/**/*.js'],
    languageOptions: {
      globals: {
        chrome: 'readonly',
        document: 'readonly',
        window: 'readonly',
        MutationObserver: 'readonly',
        Element: 'readonly',
        HTMLElement: 'readonly',
      },
    },
    rules: {
      'no-console': 'warn',
    },
  },

  // Offscreen Document specific
  {
    files: ['src/offscreen/**/*.ts', 'src/offscreen/**/*.js'],
    languageOptions: {
      globals: {
        chrome: 'readonly',
        document: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },

  // UI/Interface files
  {
    files: ['src/ui/**/*.ts', 'src/ui/**/*.js'],
    languageOptions: {
      globals: {
        chrome: 'readonly',
        document: 'readonly',
        window: 'readonly',
        HTMLElement: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
      },
    },
  },

  // Test files
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*.ts'],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
