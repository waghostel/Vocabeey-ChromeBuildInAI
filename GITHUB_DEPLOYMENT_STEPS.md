# GitHub Deployment Steps

## Overview

This guide will help you merge `dev` into `main` and push a clean version to GitHub (origin) while keeping the full development version on GitLab.

## Prerequisites

- All changes on `dev` branch are committed
- Working tree is clean

## Step-by-Step Instructions

### 1. Verify Current State

```bash
# Check you're on dev branch
git branch

# Ensure working tree is clean
git status

# Check remotes
git remote -v
```

### 2. Commit Any Pending Changes on Dev

```bash
# If you have uncommitted changes
git add .
git commit -m "chore: final dev updates before merge"
```

### 3. Switch to Main Branch

```bash
git checkout main
```

### 4. Merge Dev into Main

```bash
# Merge dev branch into main
git merge dev

# If there are conflicts, resolve them and:
# git add .
# git commit -m "chore: merge dev into main"
```

### 5. Run Cleanup Script

```bash
# This moves dev markdown files and removes dev tool folders
node scripts/cleanup-for-github.js
```

### 6. Add dev-docs/ to .gitignore

```bash
# Add dev-docs folder to gitignore (main branch only)
echo dev-docs/ >> .gitignore
```

### 7. Review Changes

```bash
# See what was moved/removed
git status

# Review the changes
git diff --stat

# Check dev-docs folder was created
ls dev-docs/
```

### 8. Stage and Commit Cleanup

```bash
# Stage all changes
git add -A

# Commit the cleanup
git commit -m "chore: clean up repository for public GitHub release

- Move development markdown files to dev-docs/ folder
- Add dev-docs/ to .gitignore
- Remove development tool folders (.kiro, .amazonq, debug, ignore)
- Remove test/demo files
- Keep essential user-facing documentation
- Maintain clean public repository structure"
```

### 9. Push to GitHub (Origin)

```bash
# Push main branch to GitHub
git push origin main

# Verify it's pushed
git log origin/main -1
```

### 10. Switch Back to Dev Branch

```bash
# Return to dev for continued development
git checkout dev

# Verify you're back on dev
git branch
```

### 11. Remove dev-docs/ from .gitignore on Dev Branch

```bash
# On dev branch, remove the dev-docs/ line from .gitignore
# This ensures dev-docs/ is tracked on dev branch

# Edit .gitignore and remove the "dev-docs/" line
# Or use this command (Windows):
findstr /V "dev-docs/" .gitignore > .gitignore.tmp && move /Y .gitignore.tmp .gitignore

# Commit the change
git add .gitignore
git commit -m "chore: keep dev-docs tracked on dev branch"
```

### 12. Optional: Push Dev to GitLab

```bash
# Keep full development history on GitLab
git push gitlab dev
git push gitlab main
```

## What Gets Moved/Removed from Main (GitHub)

### Moved to dev-docs/ (hidden via .gitignore on main)

- All `*_IMPLEMENTATION.md` files (implementation notes)
- All `*_FIX_SUMMARY.md` files (fix documentation)
- All `LANGUAGE_DETECTION_*.md` files
- All `TRANSLATION_*.md` files (implementation docs)
- All `TTS_*.md` files (implementation docs)
- All `MEMORY_OPTIMIZATION_*.md` files
- All `ONBOARDING_WIZARD_*.md` files
- Other development process documentation (70+ files)

### Folders Removed

- `.kiro/` - Kiro IDE specs and configuration
- `.amazonq/` - Amazon Q configuration
- `debug/` - Debugging utilities and test files
- `ignore/` - Temporary documentation
- `demo-page/` - Demo files
- `prompt-api-test/` - Test files
- `coverage/` - Test coverage reports

### Files Removed

- Test HTML files (`test-*.html`, `demo-*.html`)
- Development config files (`mcp-config.json`, `eslint-output.json`)
- Generated files (`vitest.config.d.ts`, `*.js.map` for config)

## What Stays on Main (GitHub)

### Essential Documentation

- `README.md` - Main documentation
- `QUICK_START.md` - Getting started
- `QUICK_REFERENCE.md` - Quick reference
- `FEATURE_GUIDE.md` - Feature documentation
- `USAGE_EXAMPLES.md` - Usage examples
- `TESTING_GUIDE.md` - Testing guide
- `TESTING_CHECKLIST.md` - Testing checklist
- `DEPLOYMENT_CHECKLIST.md` - Deployment guide

### Architecture & Guides

- `CHROME_AI_ARCHITECTURE.md` - Architecture overview
- `CHROME_AI_QUICK_REFERENCE.md` - API reference
- `CONTEXT_MENU_GUIDE.md` - Context menu guide
- `ARTICLE_SEGMENTATION_USER_GUIDE.md` - User guide

### Code & Configuration

- `src/` - All source code
- `assets/` - Static assets
- `icons/` - Extension icons
- `scripts/` - Build scripts
- `tests/` - Test files
- `docs/` - Structured documentation
- `user-need/` - Requirements and roadmap
- All configuration files (package.json, tsconfig.json, etc.)

## Verification

After pushing to GitHub, verify:

1. Visit your GitHub repository
2. Check that development folders are gone
3. Verify essential documentation is present
4. Ensure source code is intact
5. Test that the extension can be built from the GitHub version

## Troubleshooting

### If you need to undo the cleanup:

```bash
# While still on main branch
git reset --hard HEAD~1

# This reverts the cleanup commit
```

### If you accidentally pushed and want to fix:

```bash
# Reset main to before cleanup
git reset --hard HEAD~1

# Force push (use with caution!)
git push origin main --force
```

### To keep both branches in sync on GitLab:

```bash
git push gitlab dev
git push gitlab main
```

## Notes

- **GitHub (origin)**: Only `main` branch, clean public version
- **GitLab (gitlab)**: Both `dev` and `main` branches, full development history
- **Local**: Both branches maintained, switch between them as needed
- The `dev` branch retains all development files for your continued work

## Future Updates

When you want to update GitHub:

1. Make changes on `dev` branch
2. Commit and test
3. Switch to `main`: `git checkout main`
4. Merge: `git merge dev`
5. Run cleanup: `node scripts/cleanup-for-github.js`
6. Add to gitignore: `echo dev-docs/ >> .gitignore`
7. Commit: `git add -A && git commit -m "chore: update and clean for public release"`
8. Push: `git push origin main`
9. Switch back: `git checkout dev`
10. Remove dev-docs from gitignore on dev: Edit `.gitignore` and remove `dev-docs/` line
11. Commit: `git commit -am "chore: keep dev-docs tracked on dev branch"`

## Important Notes

### About dev-docs/ Folder

- **On main branch**: Added to `.gitignore`, so it won't be pushed to GitHub
- **On dev branch**: NOT in `.gitignore`, so it's tracked and preserved
- **Contains**: All development process markdown files for your reference
- **Benefit**: Keeps your `.gitignore` clean and organized

### Branch-Specific .gitignore

The `.gitignore` file will be different on each branch:

- **main branch**: Includes `dev-docs/` line
- **dev branch**: Does NOT include `dev-docs/` line

This is intentional and allows the same folder to be hidden on main but tracked on dev.
