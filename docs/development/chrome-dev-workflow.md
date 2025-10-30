# Chrome Extension Development Workflow

A practical guide for developing and testing the extension in Chrome using `pnpm dev`.

## Quick Start

### Initial Setup (First Time Only)

```bash
# 1. Install dependencies
pnpm install

# 2. Initial build (creates dist/ folder with all assets)
pnpm build

# 3. Load extension in Chrome
# - Open chrome://extensions/
# - Enable "Developer mode" (top right toggle)
# - Click "Load unpacked"
# - Select the dist/ folder from your project
```

### Daily Development Workflow

```bash
# Start TypeScript watch mode
pnpm dev
```

Now you can:

- Edit TypeScript files in `src/`
- Changes automatically compile to `dist/`
- Reload extension in Chrome to see changes

## Understanding the Build Process

### What `pnpm dev` Does

```bash
pnpm dev  # Runs: tsc --watch
```

- ✅ Watches TypeScript files in `src/`
- ✅ Automatically recompiles on changes
- ✅ Outputs JavaScript to `dist/`
- ❌ Does NOT copy static assets (manifest.json, HTML, CSS, icons)

### What `pnpm build` Does

```bash
pnpm build  # Runs: tsc && pnpm run copy-assets && pnpm run fix-imports
```

- ✅ Compiles TypeScript to JavaScript
- ✅ Copies manifest.json to dist/
- ✅ Copies HTML/CSS files to dist/
- ✅ Copies icons to dist/
- ✅ Fixes import paths

### When to Use Each Command

| Scenario           | Command            | Why                              |
| ------------------ | ------------------ | -------------------------------- |
| First time setup   | `pnpm build`       | Creates complete dist/ folder    |
| TypeScript changes | `pnpm dev`         | Fast auto-recompilation          |
| Manifest changes   | `pnpm copy-assets` | Updates manifest.json in dist/   |
| HTML/CSS changes   | `pnpm copy-assets` | Updates UI files in dist/        |
| Icon changes       | `pnpm copy-assets` | Updates icons in dist/           |
| Before commit      | `pnpm build`       | Ensures everything is up to date |

## Step-by-Step Development Guide

### 1. Initial Build and Load

```bash
# Build the extension
pnpm build

# Verify dist/ folder exists with these files:
# dist/
# ├── manifest.json
# ├── background/service-worker.js
# ├── content/content-script.js
# ├── offscreen/ai-processor.js
# ├── ui/*.js, *.html, *.css
# └── icons/
```

**Load in Chrome:**

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Navigate to your project folder
5. Select the `dist/` folder
6. Click "Select Folder"

### 2. Start Development Mode

```bash
# Terminal 1: Start TypeScript watch mode
pnpm dev
```

You should see:

```
[HH:MM:SS AM] Starting compilation in watch mode...
[HH:MM:SS AM] Found 0 errors. Watching for file changes.
```

### 3. Make Changes and Test

**For TypeScript Changes:**

1. Edit any `.ts` file in `src/`
2. Watch terminal - it will show recompilation
3. Go to `chrome://extensions/`
4. Click the reload icon ↻ on your extension
5. Test your changes

**For Manifest Changes:**

1. Edit `manifest.json` (root folder)
2. Run: `pnpm copy-assets`
3. Go to `chrome://extensions/`
4. Click the reload icon ↻ on your extension
5. Test your changes

**For HTML/CSS Changes:**

1. Edit files in `src/ui/` or `src/offscreen/`
2. Run: `pnpm copy-assets`
3. Go to `chrome://extensions/`
4. Click the reload icon ↻ on your extension
5. Test your changes

### 4. Debugging Different Contexts

**Service Worker (Background Script):**

```
chrome://extensions/ → Find your extension → "Inspect views: service worker"
```

- View console logs
- Set breakpoints
- Inspect storage

**Content Script:**

```
Open any webpage → Right-click → Inspect → Sources tab → Content scripts
```

- Debug page interaction
- View console logs
- Inspect DOM changes

**Offscreen Document:**

```
chrome://extensions/ → Find your extension → "Inspect views: offscreen.html"
```

- Debug AI processing
- View console logs
- Monitor performance

**UI Pages (Learning Interface, Settings):**

```
Open the UI page → Right-click → Inspect
```

- Debug UI interactions
- View console logs
- Test responsive design

## Common Development Scenarios

### Scenario 1: Adding a New Feature

```bash
# 1. Start watch mode
pnpm dev

# 2. Create/edit TypeScript files
# src/utils/new-feature.ts

# 3. Watch terminal for compilation
# [HH:MM:SS AM] File change detected. Starting incremental compilation...
# [HH:MM:SS AM] Found 0 errors.

# 4. Reload extension in Chrome
# chrome://extensions/ → Click reload ↻

# 5. Test the feature
```

### Scenario 2: Updating UI

```bash
# 1. Edit HTML/CSS files
# src/ui/learning-interface.html
# src/ui/learning-interface.css

# 2. Copy assets
pnpm copy-assets

# 3. Reload extension in Chrome
# chrome://extensions/ → Click reload ↻

# 4. Test UI changes
```

### Scenario 3: Changing Permissions

```bash
# 1. Edit manifest.json (root)
# Add/remove permissions

# 2. Copy to dist/
pnpm copy-assets

# 3. Reload extension in Chrome
# chrome://extensions/ → Click reload ↻

# 4. Chrome will prompt for new permissions
```

### Scenario 4: Debugging an Issue

```bash
# 1. Ensure latest build
pnpm build

# 2. Reload extension
# chrome://extensions/ → Click reload ↻

# 3. Open appropriate DevTools
# - Service worker: Inspect views → service worker
# - Content script: Page DevTools → Sources
# - UI: Right-click page → Inspect

# 4. Check console for errors
# 5. Set breakpoints in Sources tab
# 6. Reproduce the issue
```

## Troubleshooting

### Extension Not Loading

**Problem:** "Load unpacked" doesn't work

**Solution:**

```bash
# Ensure dist/ folder exists
ls dist/

# Rebuild if missing
pnpm build

# Verify manifest.json in dist/
cat dist/manifest.json
```

### Changes Not Appearing

**Problem:** Code changes don't show up in Chrome

**Checklist:**

- [ ] Is `pnpm dev` running?
- [ ] Did TypeScript compilation succeed? (check terminal)
- [ ] Did you reload the extension? (chrome://extensions/ → reload ↻)
- [ ] Did you refresh the webpage? (if testing content script)
- [ ] Did you close and reopen DevTools? (for service worker)

**Solution:**

```bash
# Hard reset
# 1. Stop pnpm dev (Ctrl+C)
# 2. Remove extension from Chrome
# 3. Clean build
rm -rf dist
pnpm build
# 4. Reload extension in Chrome
# 5. Start dev mode
pnpm dev
```

### Manifest Changes Not Working

**Problem:** Updated manifest.json but changes don't apply

**Solution:**

```bash
# Copy assets to dist/
pnpm copy-assets

# Reload extension in Chrome
# chrome://extensions/ → Click reload ↻

# For permission changes, Chrome will prompt
```

### Service Worker Errors

**Problem:** Service worker shows errors or "inactive"

**Solution:**

1. Go to `chrome://extensions/`
2. Find your extension
3. Click "Errors" button (if visible)
4. Click "Inspect views: service worker"
5. Check console for errors
6. Click reload ↻ on extension card

**Common causes:**

- Syntax errors in `src/background/service-worker.ts`
- Missing permissions in manifest.json
- Unhandled promise rejections

### Content Script Not Injecting

**Problem:** Content script doesn't run on pages

**Checklist:**

- [ ] Is the URL pattern correct in manifest.json?
- [ ] Does the page match the pattern?
- [ ] Are there console errors? (Page DevTools → Console)
- [ ] Is the content script compiled? (check `dist/content/content-script.js`)

**Solution:**

```bash
# Check manifest.json content_scripts section
cat manifest.json | grep -A 10 "content_scripts"

# Rebuild and reload
pnpm build
# Reload extension in chrome://extensions/
# Refresh the webpage
```

### TypeScript Compilation Errors

**Problem:** `pnpm dev` shows TypeScript errors

**Solution:**

```bash
# Check specific errors in terminal
# Fix TypeScript issues in src/

# Verify types
pnpm type-check

# If stuck, restart watch mode
# Ctrl+C to stop
pnpm dev
```

## Performance Tips

### Fast Iteration

```bash
# Keep pnpm dev running in background
# Only reload extension when testing
# Use Chrome DevTools for quick debugging
```

### Selective Reloading

- **TypeScript changes**: Reload extension
- **Content script changes**: Reload extension + refresh page
- **Service worker changes**: Reload extension (service worker restarts)
- **UI changes**: Reload extension + reopen UI page

### Debugging Performance

```bash
# Use Chrome DevTools Performance tab
# 1. Open DevTools on extension context
# 2. Go to Performance tab
# 3. Click Record
# 4. Perform action
# 5. Stop recording
# 6. Analyze timeline
```

## Best Practices

### Development Workflow

1. **Always start with `pnpm build`** for initial setup
2. **Use `pnpm dev`** for TypeScript development
3. **Run `pnpm copy-assets`** when changing static files
4. **Reload extension** after every change
5. **Check console** in appropriate context for errors

### Code Quality

```bash
# Before committing
pnpm lint          # Check code quality
pnpm format        # Format code
pnpm type-check    # Verify types
pnpm test          # Run tests
pnpm build         # Ensure clean build
```

### Git Workflow

```bash
# Pre-commit hooks automatically run:
# - Prettier formatting
# - Oxlint checking
# - Auto-fix issues

# Manual validation
pnpm validate:extension  # Full pipeline: lint + test + build
```

## Quick Reference

### Essential Commands

```bash
pnpm build              # Full build (first time, before commit)
pnpm dev                # Watch mode (daily development)
pnpm copy-assets        # Copy static files (manifest, HTML, CSS, icons)
pnpm lint               # Check code quality
pnpm test               # Run tests
pnpm validate:extension # Full validation pipeline
```

### Chrome URLs

```
chrome://extensions/           # Extension management
chrome://extensions-internals/ # Extension debugging info
chrome://inspect/#extensions   # Extension inspection
```

### File Locations

```
manifest.json          # Source manifest (edit this)
dist/manifest.json     # Built manifest (Chrome loads this)
src/**/*.ts            # Source TypeScript (edit these)
dist/**/*.js           # Built JavaScript (Chrome runs these)
```

## Next Steps

- **[Development Guide](README.md)** - Complete development workflow
- **[Architecture Overview](../architecture/README.md)** - System design
- **[Testing Guide](../testing/README.md)** - Test suite and coverage
- **[API Reference](../api/README.md)** - Chrome AI integration

Happy developing! 🚀

## Frequently Asked Questions (Q&A)

### Q: Should I load the dist folder even when I use `pnpm dev`?

**A: Yes, you always load the `dist/` folder in Chrome, regardless of whether you're using `pnpm dev` or `pnpm build`.**

Here's why:

**Chrome only understands the built extension:**

- Chrome extensions must be loaded from a folder containing `manifest.json` and compiled JavaScript files
- Your `src/` folder contains TypeScript source code that Chrome cannot execute directly
- The `dist/` folder contains the compiled JavaScript that Chrome can run

**How the workflow works:**

```bash
# 1. Initial setup (creates dist/ folder)
pnpm build

# 2. Load dist/ in Chrome (one time)
# chrome://extensions/ → Load unpacked → Select dist/

# 3. Start development mode
pnpm dev

# 4. Make changes to src/*.ts files
# TypeScript automatically compiles to dist/*.js

# 5. Reload extension in Chrome to see changes
# chrome://extensions/ → Click reload ↻
```

**The relationship:**

```
src/background/service-worker.ts  →  [pnpm dev]  →  dist/background/service-worker.js
                                                              ↑
                                                         Chrome loads this
```

**Key points:**

- `pnpm dev` watches `src/` and outputs to `dist/`
- Chrome loads and runs code from `dist/`
- You never load `src/` in Chrome
- The `dist/` folder stays loaded in Chrome while you develop
- You just reload the extension after changes compile

**Think of it this way:**

- `src/` = Your workspace (where you write code)
- `dist/` = The product (what Chrome runs)
- `pnpm dev` = The assembly line (converts workspace to product)

### Q: What happens if I modify manifest.json while using `pnpm dev`?

**A: You need to manually run `pnpm copy-assets` to update `dist/manifest.json`.**

**Why:**

- `pnpm dev` only watches and compiles TypeScript files (`.ts` → `.js`)
- It does NOT copy static assets like `manifest.json`, HTML, CSS, or icons
- Chrome loads `dist/manifest.json`, not the root `manifest.json`

**Workflow for manifest changes:**

```bash
# 1. Edit root manifest.json
# (make your changes)

# 2. Copy to dist/
pnpm copy-assets

# 3. Reload extension in Chrome
# chrome://extensions/ → Click reload ↻

# 4. If you added new permissions, Chrome will prompt you
```

**Alternative - use full build:**

```bash
# This does everything: compile TypeScript + copy assets
pnpm build

# Then reload extension in Chrome
```

### Q: Do I need to reload the extension every time I make a change?

**A: Yes, Chrome extensions don't have true hot-reload like web apps.**

**When to reload:**

| Change Type     | Steps Required                                  |
| --------------- | ----------------------------------------------- |
| TypeScript file | Wait for compilation → Reload extension         |
| Manifest.json   | Run `pnpm copy-assets` → Reload extension       |
| HTML/CSS file   | Run `pnpm copy-assets` → Reload extension       |
| Content script  | Reload extension → Refresh webpage              |
| Service worker  | Reload extension (service worker auto-restarts) |

**How to reload:**

1. Go to `chrome://extensions/`
2. Find your extension
3. Click the reload icon ↻

**Pro tip:** Use keyboard shortcut

- On the extensions page, you can use `Ctrl+R` (Windows) or `Cmd+R` (Mac) after clicking the extension card

### Q: Can I use `pnpm dev` without running `pnpm build` first?

**A: No, you need `pnpm build` at least once to create the complete `dist/` folder.**

**Why:**

- `pnpm dev` only compiles TypeScript files
- It doesn't create the initial folder structure
- It doesn't copy `manifest.json`, HTML, CSS, or icons
- Chrome needs ALL these files to load the extension

**First-time setup:**

```bash
# ❌ Wrong - dist/ is incomplete
pnpm dev
# Load dist/ in Chrome → ERROR: manifest.json not found

# ✅ Correct - dist/ has everything
pnpm build
# Load dist/ in Chrome → SUCCESS
pnpm dev  # Now you can use watch mode
```

**What each command creates:**

```bash
# pnpm dev (TypeScript only)
dist/
├── background/service-worker.js  ✅
├── content/content-script.js     ✅
├── utils/*.js                    ✅
└── manifest.json                 ❌ MISSING

# pnpm build (everything)
dist/
├── background/service-worker.js  ✅
├── content/content-script.js     ✅
├── utils/*.js                    ✅
├── manifest.json                 ✅
├── icons/                        ✅
└── ui/*.html, *.css              ✅
```

### Q: How do I know if my changes compiled successfully?

**A: Watch the terminal where `pnpm dev` is running.**

**Success output:**

```
[HH:MM:SS AM] File change detected. Starting incremental compilation...
[HH:MM:SS AM] Found 0 errors. Watching for file changes.
```

**Error output:**

```
[HH:MM:SS AM] File change detected. Starting incremental compilation...
src/utils/example.ts:10:5 - error TS2322: Type 'string' is not assignable to type 'number'.

10     const x: number = "hello";
       ~~~~~

[HH:MM:SS AM] Found 1 error. Watching for file changes.
```

**What to do:**

- ✅ **0 errors**: Safe to reload extension and test
- ❌ **Errors found**: Fix TypeScript errors before reloading
- ⚠️ **No output**: Check if `pnpm dev` is still running

**Pro tip:** Keep the terminal visible while developing so you can see compilation status in real-time.

### Q: What's the difference between reloading the extension and refreshing the page?

**A: They serve different purposes in the development workflow.**

**Reloading the extension** (`chrome://extensions/` → reload ↻):

- Restarts the service worker
- Reloads all extension code
- Re-injects content scripts on next page load
- Required after code changes

**Refreshing the page** (F5 or Ctrl+R on webpage):

- Reloads the webpage
- Re-injects content scripts
- Does NOT reload extension code
- Required after content script changes

**When to do both:**

```bash
# Scenario: Changed content script

# 1. Make changes to src/content/content-script.ts
# 2. Wait for compilation (pnpm dev)
# 3. Reload extension (chrome://extensions/ → reload ↻)
# 4. Refresh the webpage (F5)
# 5. Test changes
```

**When to reload extension only:**

```bash
# Scenario: Changed service worker or utilities

# 1. Make changes to src/background/service-worker.ts
# 2. Wait for compilation (pnpm dev)
# 3. Reload extension (chrome://extensions/ → reload ↻)
# 4. Test changes (no page refresh needed)
```
