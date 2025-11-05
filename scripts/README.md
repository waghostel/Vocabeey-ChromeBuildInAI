# Build and Deployment Scripts

This directory contains scripts for building the extension and preparing it for GitHub release.

## Build Scripts

### copy-assets.js

Copies static assets (HTML, CSS, manifest) to the `dist/` folder during build.

### fix-imports.js

Fixes import paths in compiled JavaScript files to ensure proper module resolution.

### convert-icons.js / generate-icons.js

Generate extension icons in various sizes from source images.

### lint-switcher.js

Switches between Oxlint and ESLint for linting.

## GitHub Deployment Scripts

### 1. preview-cleanup.cjs

**Purpose**: Preview what will be moved/removed without making changes

**Usage**:

```bash
node scripts/preview-cleanup.cjs
# Or via npm script:
pnpm run cleanup:preview
```

**Output**: Shows files to move, remove, and total size affected

---

### 2. cleanup-for-github.cjs

**Purpose**: Execute the cleanup process for GitHub release

**Usage**:

```bash
node scripts/cleanup-for-github.cjs
# Or via npm script:
pnpm run cleanup:github
```

**Actions**:

1. Creates `dev-docs/` folder
2. Moves 100+ development markdown files to `dev-docs/`
3. Removes test/demo HTML files
4. Removes development config files
5. Removes development tool directories (`.kiro/`, `debug/`, `user-need/`, etc.)
6. Removes `dist/` folder

---

### 3. manage-gitignore.cjs

**Purpose**: Configure `.gitignore` for different branches

**Usage**:

```bash
# Configure for dev branch (tracks dist/ and dev-docs/)
node scripts/manage-gitignore.cjs dev
# Or: pnpm run gitignore:dev

# Configure for main branch (ignores dist/ and dev-docs/)
node scripts/manage-gitignore.cjs main
# Or: pnpm run gitignore:main
```

**Why**: Allows different file tracking on dev vs main branches

---

## Quick Workflow

### Using NPM Scripts (Recommended)

```bash
# 1. Preview what will be cleaned (optional)
pnpm run cleanup:preview

# 2. Switch to main and merge
git checkout main
git merge dev

# 3. Prepare for GitHub (all-in-one)
pnpm run release:prepare

# 4. Commit and push
git add -A
git commit -m "chore: prepare v1.x.x release"
git push origin main

# 5. Return to dev
git checkout dev
pnpm run gitignore:dev
```

### Manual Workflow

```bash
# 1. Preview (optional)
node scripts/preview-cleanup.cjs

# 2. Switch to main branch
git checkout main
git merge dev

# 3. Configure gitignore
node scripts/manage-gitignore.cjs main

# 4. Run cleanup
node scripts/cleanup-for-github.cjs

# 5. Commit and push
git add -A
git commit -m "chore: clean up for public release"
git push origin main

# 6. Return to dev
git checkout dev
node scripts/manage-gitignore.cjs dev
```

## What Gets Moved vs Removed

### Moved to dev-docs/ (70+ files)

- `*_IMPLEMENTATION.md` - Implementation notes
- `*_FIX_SUMMARY.md` - Fix documentation
- `LANGUAGE_DETECTION_*.md` - Language detection docs
- `TRANSLATION_*.md` - Translation implementation docs
- `TTS_*.md` - TTS implementation docs
- `MEMORY_OPTIMIZATION_*.md` - Memory optimization docs
- And many more development process documents

### Removed Completely

**Folders**:

- `.kiro/` - Kiro IDE configuration
- `.amazonq/` - Amazon Q configuration
- `debug/` - Debug utilities
- `ignore/` - Temporary docs
- `demo-page/` - Demo files
- `prompt-api-test/` - Test files
- `coverage/` - Test coverage

**Files**:

- `test-*.html` - Test pages
- `demo-*.html` - Demo pages
- `mcp-config.json` - MCP config
- `eslint-output.json` - Lint output
- `vitest.config.d.ts*` - Generated types

## Branch-Specific .gitignore

The key to this approach is having different `.gitignore` on each branch:

**Main Branch** (GitHub):

```gitignore
# ... existing patterns ...
dist/
dev-docs/
```

**Dev Branch** (Local/GitLab):

```gitignore
# ... existing patterns ...
# (no dist/ or dev-docs/ lines - these are tracked)
```

This allows:

- **Main branch**: `dist/` and `dev-docs/` are ignored (not pushed to GitHub)
- **Dev branch**: `dist/` and `dev-docs/` are tracked (preserved in development)

## Verification

After cleanup, verify:

```bash
# Check what's ignored
git status --ignored

# Check dev-docs exists but is ignored (on main)
ls dev-docs/
git check-ignore dev-docs/

# Check .gitignore content
grep "dev-docs/" .gitignore
```

## Troubleshooting

### Script fails with "file not found"

- This is normal if some files don't exist
- The script will skip missing files and continue

### dev-docs/ still shows in git status

- Make sure you ran: `node scripts/manage-gitignore.js add`
- Check `.gitignore` contains `dev-docs/` line

### Want to undo cleanup

```bash
# Before committing
git reset --hard HEAD

# After committing (but before pushing)
git reset --hard HEAD~1
```

## Notes

- Always run `preview-cleanup.js` first to see what will happen
- The cleanup is designed to be safe and reversible (before pushing)
- All moved files remain accessible on dev branch
- Scripts are idempotent (safe to run multiple times)
