# Quick Reference Card

## 🚀 Daily Commands

```bash
# Start development
pnpm dev

# Check code quality
pnpm lint
pnpm type-check

# Fix issues
pnpm lint:fix
pnpm format

# Build
pnpm build
```

## 📂 Where to Put Files

```
src/background/     → Service worker, background scripts
src/content/        → Content scripts (inject into pages)
src/offscreen/      → Offscreen documents (AI processing)
src/ui/             → UI components, popup, options page
src/types/          → TypeScript type definitions
src/utils/          → Shared utilities
tests/              → Test files
```

## ⚡ Pre-commit Hook

Runs automatically on `git commit`:

1. Prettier formats code
2. ESLint fixes issues
3. Commit proceeds if no errors

## 🎯 ESLint Rules by File Type

| Location          | Console    | window/document | Strictness |
| ----------------- | ---------- | --------------- | ---------- |
| `src/background/` | ✅ Allowed | ❌ Blocked      | High       |
| `src/content/`    | ⚠️ Warning | ✅ Allowed      | High       |
| `src/ui/`         | ⚠️ Warning | ✅ Allowed      | High       |
| `tests/`          | ✅ Allowed | ✅ Allowed      | Relaxed    |

## 🔧 Troubleshooting

```bash
# Clear ESLint cache
pnpm exec eslint --clear-cache

# Reinstall dependencies
rm -rf node_modules && pnpm install

# Check ESLint config for a file
pnpm exec eslint --print-config src/types/index.ts
```

## 📦 Package Manager

**Always use pnpm** (not npm or yarn):

```bash
pnpm install <package>      # Add dependency
pnpm add -D <package>       # Add dev dependency
pnpm remove <package>       # Remove dependency
pnpm update                 # Update all packages
```

## 🎨 Code Style

- **Quotes**: Single quotes (`'`)
- **Semicolons**: Required (`;`)
- **Indentation**: 2 spaces
- **Line width**: 80 characters
- **Trailing commas**: ES5 style

## 🔍 VS Code Extensions

Recommended (install from Extensions panel):

- ESLint
- Prettier
- TypeScript

## 📝 TypeScript Tips

```typescript
// ✅ Good - explicit return type
function getData(): Promise<string> {
  return fetch('/api').then(r => r.text());
}

// ⚠️ Warning - implicit return type
function getData() {
  return fetch('/api').then(r => r.text());
}

// ✅ Good - unused param with underscore
function handler(_event: Event): void {
  console.log('handled');
}

// ❌ Error - unused param
function handler(event: Event): void {
  console.log('handled');
}
```

## 🌐 Chrome Extension Globals

Available everywhere:

- `chrome.*` - Chrome Extension APIs
- `console.*` - Console methods

Service worker only:

- `self` - Service worker global
- ❌ No `window` or `document`

Content scripts:

- `window` - Page window
- `document` - Page DOM
- `chrome.*` - Extension APIs

---

**Keep this handy!** 📌
