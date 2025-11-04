<div align="center">
  <img src="icons/Vocabee.png" alt="Vocabeey Logo" width="128" height="128">
  
  # Vocabeey
  
  Transform any web article into an interactive language learning experience powered by AI.
  
  Learn languages naturally by reading real content with smart vocabulary highlighting, instant translations, and interactive learning cards.
  
  <br>
  
  **[📖 Interactive User Guide](https://vocabeey.vercel.app)** • **[🚀 Quick Start](#-installation)** • **[💡 Features](#-features)**
  
</div>

---

## ✨ What is Vocabeey?

Vocabeey turns your everyday web browsing into a powerful language learning tool. Read articles in your target language and get instant help with vocabulary, sentence structure, and pronunciation - all powered by Chrome's built-in AI.

Perfect for language learners who want to practice with real-world content instead of textbooks.

## 🚀 Features

- **📖 Smart Reading Mode**: Clean, distraction-free article view with AI-powered content extraction
- **🎯 Dual Highlighting System**: Switch between vocabulary and sentence learning modes
- **🤖 AI-Powered Translations**: Instant translations with context-aware explanations
- **🔊 Text-to-Speech**: Hear correct pronunciation for any word or sentence
- **💡 Interactive Learning Cards**: Review vocabulary and sentences with spaced repetition
- **🎨 Difficulty Adaptation**: Content automatically adjusted to your learning level (1-10 scale)
- **🔒 Privacy-First**: All your learning data stays local on your device
- **⚡ Works Offline**: Continue learning even without internet connection
- **⌨️ Keyboard Shortcuts**: Navigate and learn faster with intuitive hotkeys

## 📥 Installation

### Requirements

- **Chrome Browser**: Version 140 or higher
- **Storage Space**: 22GB for AI model downloads (one-time, automatic)
- **RAM**: 4GB minimum (8GB recommended for best performance)
- **Platform**: Windows 10+, macOS 13+, Linux, or ChromeOS

### Step 1: Enable Chrome AI

1. Open Chrome and navigate to: `chrome://flags/#optimization-guide-on-device-model`
2. Set "Optimization Guide On Device Model" to **Enabled**
3. Restart Chrome
4. AI models will download automatically in the background (22GB, may take some time)

### Step 2: Install Vocabeey

**Option A: From Chrome Web Store** (Coming Soon)

- Visit the Chrome Web Store
- Click "Add to Chrome"
- Start learning!

**Option B: Install from Source** (For Early Adopters)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the extension directory
6. The Vocabeey icon will appear in your toolbar

### Step 3: Verify Installation

Open any webpage, press F12 to open DevTools Console, and run:

```javascript
console.log('Chrome AI available:', 'ai' in window);
```

If it returns `true`, you're ready to go!

## 🎓 How to Use

> **💡 New to Vocabeey?** Check out our [**Interactive User Guide**](https://vocabeey-guide.vercel.app) for a visual, step-by-step walkthrough of all features!

### Getting Started

1. **Find an Article**: Navigate to any article or blog post in your target language
2. **Click the Extension**: Click the Vocabeey icon in your Chrome toolbar
3. **Start Learning**: The article opens in a clean learning interface with AI-powered features

### Learning Modes

**📖 Reading Mode**

- Read the article with optional vocabulary or sentence highlighting
- Click any highlighted word for instant translation and explanation
- Switch highlight modes on the fly

**📝 Vocabulary Mode**

- Review all vocabulary words from the article
- See difficulty ratings, translations, and example sentences
- Practice with interactive flashcards

**💬 Sentences Mode**

- Study complete sentences with translations
- Understand grammar and sentence structure
- Listen to native pronunciation

## ⌨️ Keyboard Shortcuts

Master Vocabeey with these time-saving shortcuts:

### Navigate Articles

- **← / →** (Arrow Keys): Move between article sections

### Switch Learning Modes

- **R**: Reading mode 📖
- **V**: Vocabulary mode 📝
- **S**: Sentences mode 💬

### Control Highlighting (Reading Mode)

- **1**: Highlight vocabulary words
- **2**: Highlight sentences
- **3 / 0 / Esc**: Turn off highlighting

### Manage Highlights

- **Delete / Backspace**: Remove selected highlight
- **Esc**: Deselect without deleting

### Quick Editing

- **Enter**: Save your edits
- **Esc**: Cancel editing

## 🌍 Supported Languages

Vocabeey works with any language pair supported by Chrome's AI translation:

- English, Spanish, French, German, Italian, Portuguese
- Chinese (Simplified & Traditional), Japanese, Korean
- Arabic, Russian, Hindi, and many more!

The AI automatically detects the article's language and provides translations to your preferred language.

## 💡 Tips for Best Results

- **Start with easier content**: Begin with articles at your current level and gradually increase difficulty
- **Use keyboard shortcuts**: They make learning much faster and more enjoyable
- **Review regularly**: Revisit vocabulary and sentences in learning mode to reinforce memory
- **Adjust difficulty**: Use the rewriter feature to simplify or complexify content
- **Practice pronunciation**: Use text-to-speech to hear correct pronunciation
- **Stay consistent**: Make it a daily habit to read one article in your target language

## 📚 Learn More

- **[🌐 Interactive User Guide](https://vocabeey-guide.vercel.app)** - Visual, interactive guide with examples
- **[Complete User Guide](docs/user-guide/README.md)** - Detailed usage instructions
- **[Troubleshooting](docs/user-guide/README.md#troubleshooting)** - Common issues and solutions
- **[FAQ](docs/user-guide/README.md#faq)** - Frequently asked questions

---

## 👨‍💻 For Developers

Want to contribute or build your own features? Check out our developer documentation below.

## Development Setup

### Prerequisites

- Node.js 18+ & pnpm 8+
- Chrome 140+ (for built-in AI APIs)

### Quick Start for Developers

```bash
# Install dependencies
pnpm install

# Setup git hooks
pnpm prepare

# Start development (watch mode)
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

### Developer Documentation

- **[Quick Start Guide](docs/development/quick-start.md)** - Get running in 5 minutes
- **[Architecture](docs/architecture/README.md)** - Technical architecture
- **[API Reference](docs/api/README.md)** - Chrome AI integration
- **[Testing Guide](docs/testing/README.md)** - Test suite and coverage
- **[Complete Documentation](docs/README.md)** - Full documentation index

### Tech Stack

- **Chrome Extension**: Manifest V3 with service worker architecture
- **Language**: TypeScript with strict mode
- **AI Integration**: Chrome Built-in AI APIs (Language Detector, Summarizer, Rewriter, Translator, Prompt API)
- **Testing**: Vitest with 740+ tests across 22 test files
- **Code Quality**: Oxlint + ESLint, Prettier, Husky pre-commit hooks
- **Build System**: TypeScript compiler with custom asset pipeline

## 🤝 Contributing

We welcome contributions! Whether it's bug reports, feature requests, or code contributions, we'd love your help making Vocabeey better.

Check out our [development documentation](docs/development/quick-start.md) to get started.

## 📄 License

MIT - See [LICENSE](LICENSE) for details

---

<div align="center">
  
**Ready to transform your language learning?**

[Get Started](#-installation) • [User Guide](docs/user-guide/README.md) • [Report an Issue](https://github.com/yourusername/vocabeey/issues)

Made with ❤️ for language learners everywhere

</div>
