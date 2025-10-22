# Quick Start Guide

Get the Language Learning Chrome Extension running in 5 minutes.

## Prerequisites Check

Ensure you have:

- ✅ Node.js 18+ (`node --version`)
- ✅ pnpm 8+ (`pnpm --version`)
- ✅ Chrome 140+ (for built-in AI APIs)

## 1. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Initialize git hooks
pnpm prepare
```

## 2. Build the Extension

```bash
# Build for development
pnpm build

# Or start watch mode
pnpm dev
```

## 3. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `dist/` folder from your project

## 4. Test the Extension

1. Click the extension icon in Chrome toolbar
2. Navigate to any article webpage
3. Click the extension icon to start processing

## 5. Development Workflow

```bash
# Make changes to src/ files
# Extension auto-reloads with pnpm dev

# Check code quality
pnpm lint

# Run tests
pnpm test

# Format code
pnpm format
```

## Quick Commands Reference

| Command                   | Purpose                |
| ------------------------- | ---------------------- |
| `pnpm dev`                | Watch mode development |
| `pnpm build`              | Production build       |
| `pnpm test`               | Run all tests          |
| `pnpm lint`               | Check code quality     |
| `pnpm format`             | Format code            |
| `pnpm validate:extension` | Full validation        |

## Project Structure Overview

```
src/
├── background/       # Service worker
├── content/          # Content scripts
├── offscreen/        # AI processing
├── ui/               # User interface
├── types/            # TypeScript types
└── utils/            # Utilities

dist/                 # Built extension (load this in Chrome)
tests/                # Test files
docs/                 # Documentation
```

## Next Steps

- 📖 Read the [Development Guide](README.md) for detailed workflow
- 🏗️ Check [Architecture Documentation](../architecture/README.md)
- 🧪 Explore [Testing Guide](../testing/README.md)
- 🔧 Review [API Documentation](../api/README.md)

## Troubleshooting

### Extension not loading?

- Check `dist/manifest.json` exists
- Verify no console errors in Chrome DevTools
- Try rebuilding: `rm -rf dist && pnpm build`

### Build failing?

- Clear cache: `rm -rf node_modules && pnpm install`
- Check Node.js version: `node --version` (needs 18+)
- Verify pnpm: `pnpm --version` (needs 8+)

### Tests failing?

- Run specific test: `pnpm test tests/specific.test.ts`
- Check test setup: `pnpm test:ui`
- Clear test cache: `pnpm test --run --reporter=verbose`

### Code quality issues?

- Auto-fix: `pnpm lint:fix`
- Format: `pnpm format`
- Switch linter: `pnpm run lint:switch --oxlint`

## Development Tips

### Pre-commit Hooks

Every commit automatically:

1. Formats code with Prettier
2. Fixes linting issues with Oxlint
3. Blocks commit if errors remain

### Chrome Extension Debugging

- **Service Worker**: chrome://extensions → Inspect views
- **Content Script**: Page DevTools → Sources tab
- **Storage**: DevTools → Application → Storage

### Hot Reload

With `pnpm dev` running:

1. Make changes to `src/` files
2. Extension rebuilds automatically
3. Refresh extension in chrome://extensions if needed

Ready to start developing! 🚀
