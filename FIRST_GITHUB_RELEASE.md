# First GitHub Release - Step by Step

This guide walks you through preparing your first clean release to GitHub.

## Prerequisites

- You're currently on the `dev` branch
- All your changes are committed
- Tests are passing

## Step-by-Step Process

### 1. Verify Current State

```bash
# Check which branch you're on
git branch

# Should show: * dev

# Check git status
git status

# Should be clean (no uncommitted changes)
```

### 2. Configure Dev Branch

```bash
# Configure .gitignore for dev branch (allows tracking dist/)
pnpm run gitignore:dev

# Commit this change
git add .gitignore
git commit -m "chore: configure gitignore for dev branch"
```

### 3. Build and Test

```bash
# Run full validation
pnpm run validate:extension

# This runs:
# - Linting
# - Tests
# - Build
```

### 4. Preview What Will Be Cleaned

```bash
# See what files will be moved/removed
pnpm run cleanup:preview
```

This shows you:

- Markdown files that will move to `dev-docs/`
- Directories that will be removed
- Total size affected

### 5. Switch to Main Branch

```bash
# Switch to main branch
git checkout main

# Merge latest changes from dev
git merge dev
```

### 6. Prepare for GitHub

```bash
# Run the full preparation (this does everything)
pnpm run release:prepare
```

This command:

1. Validates extension (lint + test + build)
2. Configures .gitignore for main branch
3. Runs cleanup script

Or run steps manually:

```bash
# Step by step
pnpm run gitignore:main
pnpm run cleanup:github
```

### 7. Review Changes

```bash
# See what changed
git status

# Review specific changes
git diff

# Check that dev files are gone
ls -la  # Should not see development markdown files
```

You should see:

- ✓ `dev-docs/` folder created with development files
- ✓ Debug folders removed
- ✓ `dist/` folder removed
- ✓ Clean source code structure

### 8. Commit Changes

```bash
# Stage all changes
git add -A

# Commit with version number
git commit -m "chore: prepare v1.0.0 release for GitHub"
```

### 9. Push to GitHub

```bash
# Push to GitHub (origin remote)
git push origin main
```

### 10. Verify on GitHub

1. Go to https://github.com/waghostel/Vocabeey-ChromeBuildInAI
2. Check that only clean files are visible
3. Verify `dist/` folder is not present
4. Check that development markdown files are gone

### 11. Switch Back to Dev Branch

```bash
# Go back to dev branch for continued development
git checkout dev

# Reconfigure for dev
pnpm run gitignore:dev
```

## What You Should See on GitHub

### ✓ Present on Main Branch

- `src/` - Source code
- `tests/` - Test files
- `docs/` - Documentation
- `scripts/` - Build scripts
- `icons/` - Extension icons
- `README.md` - Main documentation
- `QUICK_START.md` - Quick start guide
- `package.json` - Dependencies
- `manifest.json` - Extension manifest
- Configuration files

### ✗ Not Present on Main Branch

- `dist/` - Build output
- `dev-docs/` - Development documentation
- `debug/` - Debug files
- `ignore/` - Temporary files
- `user-need/` - Requirements
- `.kiro/` - Kiro configuration
- Development markdown files

## Creating a GitHub Release

After pushing to main:

1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Click "Choose a tag" → Type `v1.0.0` → "Create new tag"
4. Release title: `v1.0.0 - Initial Release`
5. Description:

```markdown
# Vocabeey - Language Learning Chrome Extension

First public release of Vocabeey, a Chrome Extension that transforms web articles into interactive language learning experiences.

## Features

- Clean reading mode with article extraction
- Vocabulary highlighting and translation
- Interactive learning cards
- Text-to-speech support
- Chrome Built-in AI integration

## Installation

See [README.md](README.md) for installation instructions.

## Requirements

- Chrome 127+ with AI features enabled
- Node.js 18+ and pnpm (for building from source)
```

6. Click "Publish release"

## Optional: Attach Pre-built Extension

If you want users to install without building:

```bash
# On dev branch (where dist/ exists)
git checkout dev
pnpm build

# Create a ZIP of the dist folder
# On Windows: Right-click dist/ → Send to → Compressed folder
# Or use PowerShell:
Compress-Archive -Path dist\* -DestinationPath vocabeey-v1.0.0.zip
```

Then attach `vocabeey-v1.0.0.zip` to your GitHub release.

## Troubleshooting

### "dist/ folder still showing in git status"

```bash
git rm -r --cached dist/
git commit -m "chore: remove dist from tracking"
```

### "Development files still visible"

```bash
# Make sure cleanup ran
pnpm run cleanup:github

# Check .gitignore
cat .gitignore | grep -E "(dist|dev-docs)"
```

### "Want to start over"

```bash
# Reset main to match GitHub
git checkout main
git reset --hard origin/main

# Try again
git merge dev
pnpm run release:prepare
```

## Next Steps

- Update README.md with installation instructions
- Add screenshots to docs/
- Consider submitting to Chrome Web Store
- Set up GitHub Actions for automated builds

## Daily Workflow After First Release

See [GITHUB_WORKFLOW.md](GITHUB_WORKFLOW.md) for ongoing development workflow.
