# Quick Start: Extension Validation

## 1. Build Extension

```bash
pnpm build
```

## 2. Run Validation

```bash
npx tsx debug/run-extension-validation.ts
```

## 3. Load Extension Manually

1. Open Chrome: `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `dist/` directory
5. Copy Extension ID

## 4. Run Full Validation

```bash
EXTENSION_ID=your_extension_id npx tsx debug/run-extension-validation.ts
```

## 5. Review Reports

```bash
# View validation report
cat debug/playwright-reports/validation-report.md

# View MCP call guide
cat debug/playwright-reports/mcp-call-guide.md

# View console analysis guide
cat debug/playwright-reports/console-analysis-guide.md
```

## Common Issues

### Extension Not Loading

```bash
# Check dist/ exists
ls dist/

# Verify manifest
cat dist/manifest.json

# Rebuild
pnpm build
```

### Import Errors

- Add `.js` extensions to imports
- Use relative paths (`./file.js`)
- Check TypeScript config

### Path Errors

- Verify files exist in dist/
- Check paths are relative to dist/ root
- Fix typos in file names

## MCP Testing

Use the generated MCP call guide to test with Playwright:

```typescript
// Navigate to test page
mcp_playwright_browser_navigate({ url: 'https://example.com' });

// Check content script
mcp_playwright_browser_evaluate({
  function:
    "() => ({ hasExtension: typeof window.__LANGUAGE_LEARNING_EXTENSION__ !== 'undefined' })",
});

// Capture console errors
mcp_playwright_browser_console_messages({ onlyErrors: true });
```

## Help

For detailed documentation, see:

- `debug/playwright-extension-testing-README.md` - Complete guide
- `debug/playwright-mcp-extension-test.md` - Testing guide
- `debug/playwright-reports/TASK_2_COMPLETION_SUMMARY.md` - Implementation details
