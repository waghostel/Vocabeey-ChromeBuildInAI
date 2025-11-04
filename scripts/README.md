# Cleanup Scripts

This directory contains scripts to prepare the repository for public GitHub release.

## Scripts Overview

### 1. preview-cleanup.js

**Purpose**: Preview what will be moved/removed without making changes

**Usage**:

```bash
node scripts/preview-cleanup.js
```

**Output**: Shows files to move, remove, and total size affected

---

### 2. cleanup-for-github.js

**Purpose**: Execute the cleanup process

**Usage**:

```bash
node scripts/cleanup-for-github.js
```

**Actions**:

1. Creates `dev-docs/` folder
2. Moves 70+ development markdown files to `dev-docs/`
3. Removes test/demo HTML files
4. Removes development config files
5. Removes development tool directories (`.kiro/`, `.amazonq/`, etc.)

**Important**: After running, you must add `dev-docs/` to `.gitignore`

---

### 3. manage-gitignore.js

**Purpose**: Add or remove `dev-docs/` from `.gitignore`

**Usage**:

```bash
# Add dev-docs/ to .gitignore (for main branch)
node scripts/manage-gitignore.js add

# Remove dev-docs/ from .gitignore (for dev branch)
node scripts/manage-gitignore.js remove
```

**Why**: Allows `dev-docs/` to be hidden on main branch but tracked on dev branch

---

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    CLEANUP WORKFLOW                          │
└─────────────────────────────────────────────────────────────┘

1. Preview (Optional)
   └─> node scripts/preview-cleanup.js

2. Switch to main branch
   └─> git checkout main
   └─> git merge dev

3. Run cleanup
   └─> node scripts/cleanup-for-github.js

4. Update .gitignore
   └─> node scripts/manage-gitignore.js add

5. Commit and push
   └─> git add -A
   └─> git commit -m "chore: clean up for public release"
   └─> git push origin main

6. Return to dev
   └─> git checkout dev
   └─> node scripts/manage-gitignore.js remove
   └─> git commit -am "chore: keep dev-docs tracked"
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
dev-docs/
```

**Dev Branch** (Local/GitLab):

```gitignore
# ... existing patterns ...
# (no dev-docs/ line)
```

This allows:

- Main branch: `dev-docs/` is ignored (not pushed to GitHub)
- Dev branch: `dev-docs/` is tracked (preserved in development)

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
