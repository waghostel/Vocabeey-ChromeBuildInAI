# GitHub Cleanup Summary

## Quick Overview

This cleanup strategy moves development markdown files to a `dev-docs/` folder and uses `.gitignore` to hide it from GitHub's main branch, while keeping it tracked on the dev branch.

## Why This Approach?

✅ **Clean .gitignore**: Only 1 line added instead of 70+ individual file patterns
✅ **Preserved Documentation**: All dev docs remain accessible on dev branch
✅ **Easy Maintenance**: Future dev docs just go in `dev-docs/` folder
✅ **Simple**: Easy to understand and maintain

## Quick Start

### Preview First (Recommended)

```bash
node scripts/preview-cleanup.js
```

### Execute Cleanup

```bash
# 1. Switch to main and merge dev
git checkout main
git merge dev

# 2. Run cleanup script (creates dev-docs/ and moves files)
node scripts/cleanup-for-github.js

# 3. Add dev-docs/ to .gitignore
node scripts/manage-gitignore.js add

# 4. Commit and push
git add -A
git commit -m "chore: clean up repository for public release"
git push origin main

# 5. Switch back to dev
git checkout dev

# 6. Remove dev-docs/ from .gitignore on dev branch
node scripts/manage-gitignore.js remove
git add .gitignore
git commit -m "chore: keep dev-docs tracked on dev branch"
```

## What Happens?

### Files Moved to dev-docs/

- 70+ development markdown files (implementation notes, fix summaries, etc.)
- All `*_IMPLEMENTATION.md`, `*_FIX_SUMMARY.md`, etc.

### Folders Removed

- `.kiro/`, `.amazonq/`, `debug/`, `ignore/`
- `demo-page/`, `prompt-api-test/`, `coverage/`

### Files Removed

- Test HTML files: `test-*.html`, `demo-*.html`
- Dev config: `mcp-config.json`, `eslint-output.json`
- Generated files: `vitest.config.d.ts`, etc.

### Files Kept (Essential)

- All source code (`src/`)
- User documentation (`README.md`, `QUICK_START.md`, etc.)
- Architecture docs (`CHROME_AI_ARCHITECTURE.md`, etc.)
- Build configuration (`package.json`, `tsconfig.json`, etc.)
- Structured docs (`docs/`, `user-need/`)

## Branch Differences

### Main Branch (GitHub)

- `.gitignore` includes `dev-docs/`
- `dev-docs/` folder exists but is ignored by git
- Clean public repository

### Dev Branch (Local/GitLab)

- `.gitignore` does NOT include `dev-docs/`
- `dev-docs/` folder is tracked and committed
- Full development history preserved

## Helper Scripts

### Preview Cleanup

```bash
node scripts/preview-cleanup.js
```

Shows what will be moved/removed without making changes.

### Execute Cleanup

```bash
node scripts/cleanup-for-github.js
```

Moves markdown files to dev-docs/ and removes dev tool folders.

### Manage .gitignore

```bash
# Add dev-docs/ to .gitignore (for main branch)
node scripts/manage-gitignore.js add

# Remove dev-docs/ from .gitignore (for dev branch)
node scripts/manage-gitignore.js remove
```

## Detailed Guide

For step-by-step instructions, see: `GITHUB_DEPLOYMENT_STEPS.md`

## Future Updates

When updating GitHub in the future:

1. Work on `dev` branch as usual
2. Switch to `main` and merge
3. Run cleanup script
4. Add dev-docs/ to .gitignore
5. Commit and push to GitHub
6. Switch back to dev
7. Remove dev-docs/ from .gitignore

## Verification

After pushing to GitHub, verify:

- Visit your GitHub repository
- Check that `dev-docs/` folder is not visible
- Verify `.kiro/`, `.amazonq/`, etc. are gone
- Ensure essential documentation is present
- Confirm source code is intact

## Troubleshooting

### Undo cleanup (before pushing)

```bash
git reset --hard HEAD~1
```

### Check which branch you're on

```bash
git branch
```

### Check if dev-docs/ is in .gitignore

```bash
grep "dev-docs/" .gitignore
```

### See what's ignored

```bash
git status --ignored
```

## Notes

- This is a **one-time setup** for the main branch
- Future cleanups use the same process
- Dev branch always keeps full history
- GitHub only sees the clean main branch
- GitLab can maintain both branches if needed
