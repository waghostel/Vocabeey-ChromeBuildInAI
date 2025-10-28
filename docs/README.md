# Language Learning Chrome Extension - Documentation

This directory contains all documentation for the Language Learning Chrome Extension project.

## Documentation Structure

### Core Documentation

- **[Project Overview](overview.md)** - Product vision, features, and architecture
- **[Development Guide](development/README.md)** - Setup, workflow, and contribution guidelines
- **[API Documentation](api/README.md)** - Chrome AI integration and API references

### Getting Started

- **[Quick Start](development/quick-start.md)** - Get up and running in 5 minutes
- **[Setup Guide](development/setup.md)** - Detailed installation and configuration

### Architecture

- **[Technical Architecture](architecture/README.md)** - System design and component overview
- **[Chrome Extension Structure](architecture/extension-structure.md)** - Manifest V3 implementation details

### Testing

- **[Testing Guide](testing/README.md)** - Test structure and execution

### User Guide

- **[User Manual](user-guide/README.md)** - End-user documentation

## Quick Reference

### Daily Commands

```bash
pnpm dev              # Start development
pnpm build            # Build for production
pnpm test             # Run tests
pnpm lint             # Check code quality
```

### Project Structure

```
src/
├── background/       # Service worker
├── content/         # Content scripts
├── offscreen/       # AI processing
├── ui/              # User interface
├── types/           # TypeScript definitions
└── utils/           # Shared utilities
```

### Key Technologies

- **Chrome Extension**: Manifest V3 with service worker
- **AI Integration**: Chrome Built-in AI APIs + Gemini fallback
- **Language**: TypeScript with strict mode
- **Testing**: Vitest with comprehensive coverage
- **Code Quality**: ESLint + Prettier + Husky

## Contributing

See the [Development Guide](development/README.md) for contribution guidelines and workflow.

## Support

For issues and questions:

1. Check the [Development Guide](development/README.md)
2. Review [Testing Documentation](testing/README.md)
3. Consult [API Documentation](api/README.md)
