# Quick Reference

## 🚀 Essential Commands

```bash
# Development
pnpm dev              # Watch mode development
pnpm build            # Production build
pnpm test             # Run test suite
pnpm lint             # Code quality check

# Quality
pnpm lint:fix         # Auto-fix linting issues
pnpm format           # Format code with Prettier
pnpm type-check       # TypeScript validation
pnpm validate:extension  # Full validation pipeline
```

## 📂 Project Structure

```
src/
├── background/       # Service worker (no DOM access)
├── content/          # Content scripts (DOM access)
├── offscreen/        # AI processing (heavy tasks)
├── ui/               # User interface components
├── types/            # TypeScript definitions (centralized)
└── utils/            # Shared utilities (single responsibility)

docs/                 # Documentation (organized by topic)
tests/                # Test suite (700+ tests, 92% coverage)
dist/                 # Build output (load in Chrome)
```

## 🎯 Chrome Extension Context Rules

| Context        | DOM | Chrome APIs | Console | Use Case              |
| -------------- | --- | ----------- | ------- | --------------------- |
| Service Worker | ❌  | ✅          | ✅      | Background processing |
| Content Script | ✅  | Limited     | ⚠️      | Page interaction      |
| Offscreen Doc  | ✅  | Specific    | ✅      | AI processing         |
| UI Components  | ✅  | ✅          | ⚠️      | User interface        |

## 🔧 Quick Fixes

```bash
# Build issues
rm -rf dist node_modules && pnpm install && pnpm build

# Linting issues
pnpm lint:fix && pnpm format

# Test issues
pnpm test --run --reporter=verbose

# Extension loading issues
# 1. Check dist/manifest.json exists
# 2. Reload extension in chrome://extensions
# 3. Check Chrome version (needs 140+)
```

## 📖 Documentation Quick Links

- **[🏃 Quick Start](docs/development/quick-start.md)** - 5-minute setup
- **[👥 User Guide](docs/user-guide/README.md)** - End-user docs
- **[🏗️ Architecture](docs/architecture/README.md)** - System design
- **[🔧 API Reference](docs/api/README.md)** - Chrome AI integration
- **[🧪 Testing](docs/testing/README.md)** - Test suite guide

## 💡 Development Tips

### Code Quality (Automated)

- **Pre-commit hooks**: Auto-format and lint on commit
- **Dual linting**: Oxlint (fast) + ESLint (comprehensive)
- **Type safety**: Strict TypeScript with Chrome types

### Chrome Extension Development

- **Load extension**: Build → chrome://extensions → Load unpacked → Select `dist/`
- **Debug contexts**: Service worker, content script, offscreen doc have different DevTools
- **Message passing**: Use typed interfaces for component communication

### Testing

- **700+ tests**: Unit, integration, user acceptance, system tests
- **92% coverage**: Comprehensive validation of all components
- **Fast execution**: Vitest with parallel execution and mocking

---

**Need help?** Check [docs/README.md](docs/README.md) for complete documentation index
