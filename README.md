# Language Learning Chrome Extension

Transform web articles into interactive language learning experiences using Chrome's built-in AI APIs.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install && pnpm prepare

# Start development
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

## 📖 Documentation

- **[📚 Complete Documentation](docs/README.md)** - Full documentation index
- **[🏃 Quick Start Guide](docs/development/quick-start.md)** - Get running in 5 minutes
- **[👥 User Guide](docs/user-guide/README.md)** - End-user documentation
- **[🏗️ Architecture](docs/architecture/README.md)** - Technical architecture
- **[🔧 API Reference](docs/api/README.md)** - Chrome AI integration
- **[🧪 Testing Guide](docs/testing/README.md)** - Test suite and coverage

## ✨ Features

- **🤖 AI-Powered Processing**: Chrome Built-in AI + Gemini fallback
- **📝 Smart Content Extraction**: Clean, focused article content
- **🎯 Adaptive Difficulty**: Content adapted to your learning level
- **💬 Interactive Translation**: Context-aware vocabulary and sentences
- **🔊 Text-to-Speech**: Native pronunciation support
- **💾 Privacy-First**: Local processing, no tracking

## 🛠️ Development

### Prerequisites

- Node.js 18+ & pnpm 8+
- Chrome 140+ (for built-in AI APIs)

### Project Structure

```
src/
├── background/       # Service worker
├── content/          # Content scripts
├── offscreen/        # AI processing
├── ui/               # User interface
├── types/            # TypeScript definitions
└── utils/            # Shared utilities

docs/                 # Documentation
tests/                # Test suite (700+ tests)
```

### Key Commands

```bash
pnpm dev              # Watch mode development
pnpm build            # Production build
pnpm test             # Run test suite
pnpm lint             # Code quality check
pnpm validate:extension  # Full validation
```

## 🧪 Quality Assurance

- **700+ Tests**: Comprehensive test coverage (92.3%)
- **Dual Linting**: Oxlint (fast) + ESLint (comprehensive)
- **Type Safety**: Strict TypeScript with Chrome types
- **Pre-commit Hooks**: Automated code quality checks

## 🏗️ Architecture

- **Chrome Extension**: Manifest V3 with service worker
- **AI Integration**: Chrome Built-in AI APIs with Gemini fallback
- **Storage**: Local-first with privacy focus
- **Testing**: Vitest with comprehensive mocking

## 📄 License

MIT - See [LICENSE](LICENSE) for details

---

**Ready to start?** Check the [Quick Start Guide](docs/development/quick-start.md) or [User Guide](docs/user-guide/README.md)
