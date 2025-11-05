# GitHub Dual-Branch Workflow Guide

This guide explains how to manage the Vocabeey Chrome Extension repository with separate `dev` and `main` branches for GitHub.

## Overview

- **dev branch**: Contains all development files, build artifacts, debug files, and documentation
- **main branch**: Clean, production-ready code suitable for public distribution on GitHub
- **GitLab**: Private repository with full development history
- **GitHub**: Public repository with clean main branch

## Branch Strategy

### Dev Branch (Development)

- All development work happens here
- Tracks `dist/` folder for quick testing
- Includes all markdown documentation and debug files
- Contains development tools and temporary files
- Synced with GitLab

### Main Branch (Production)

- Clean, minimal file structure
- Excludes `dist/` folder (users build from source)
- Excludes development markdown files
- Only essential documentation in `docs/`
- Ready for public GitHub distribution

## Quick Commands

### Switch to Dev Branch Configuration

```bash
# Configure .gitignore for dev branch
node scripts/manage-gitignore.cjs dev

# Verify dist/ is now tracked
git status
```

### Prepare Main Branch for GitHub

```bash
# 1. Switch to main branch
git checkout main

# 2. Merge latest changes from dev
git merge dev

# 3. Configure .gitignore for main branch
node scripts/manage-gitignore.cjs main

# 4. Run cleanup script
node scripts/cleanup-for-github.cjs

# 5. Review changes
git status

# 6. Stage and commit
git add -A
git commit -m "chore: prepare clean release for GitHub"

# 7. Push to GitHub
git push origin main
```

## Detailed Workflow

### Initial Setup

1. **Verify remotes are configured**:

```bash
git remote -v
```

You should see:

- `origin` → GitHub (https://github.com/waghostel/Vocabeey-ChromeBuildInAI.git)
- `gitlab` → GitLab (https://gitlab.com/waghostel-group/vocabee.git)

2. **Configure dev branch**:

```bash
git checkout dev
node scripts/manage-gitignore.cjs dev
git add .gitignore
git commit -m "chore: configure gitignore for dev branch"
```

### Daily Development Workflow

1. **Work on dev branch**:

```bash
git checkout dev
# Make your changes
git add .
git commit -m "feat: your feature description"
```

2. **Push to GitLab** (private backup):

```bash
git push gitlab dev
```

3. **Build and test**:

```bash
pnpm build
# dist/ folder is tracked in dev branch
git add dist/
git commit -m "build: update dist"
```

### Releasing to GitHub (Main Branch)

When you're ready to update the public GitHub repository:

1. **Ensure dev branch is clean**:

```bash
git checkout dev
git status  # Should be clean
pnpm build  # Ensure latest build
pnpm test   # Run tests
```

2. **Switch to main branch**:

```bash
git checkout main
```

3. **Merge changes from dev**:

```bash
git merge dev
```

4. **Configure for main branch**:

```bash
node scripts/manage-gitignore.cjs main
```

5. **Run cleanup script**:

```bash
node scripts/cleanup-for-github.cjs
```

This will:

- Move development markdown files to `dev-docs/`
- Remove debug folders (`debug/`, `ignore/`, `user-need/`, etc.)
- Remove demo/test HTML files
- Remove temporary config files
- Remove `dist/` folder
- Remove `.kiro/` folder

6. **Review what will be committed**:

```bash
git status
git diff
```

7. **Stage and commit**:

```bash
git add -A
git commit -m "chore: clean repository for public release"
```

8. **Push to GitHub**:

```bash
git push origin main
```

9. **Switch back to dev branch**:

```bash
git checkout dev
node scripts/manage-gitignore.cjs dev
```

## What Gets Cleaned Up

### Files Moved to dev-docs/

All development markdown files including:

- Implementation summaries (\*\_IMPLEMENTATION.md)
- Fix summaries (\*\_FIX_SUMMARY.md)
- Testing guides (\*\_TESTING.md)
- Feature guides (\*\_FEATURE.md)
- Debug analysis files
- Workflow documentation

### Directories Removed

- `.kiro/` - Kiro AI configuration
- `debug/` - Debug outputs
- `ignore/` - Temporary files
- `user-need/` - User requirements
- `demo-page/` - Demo pages
- `prompt-api-test/` - API tests
- `coverage/` - Test coverage
- `assets/` - Development assets
- `dist/` - Build output

### Files Removed

- Test HTML files (test-_.html, demo-_.html)
- Temporary config files (mcp-config.json, eslint-output.json)
- Build artifacts (_.js.map, _.d.ts)

## What Stays on Main Branch

### Essential Files

- `README.md` - Main documentation
- `QUICK_START.md` - Quick start guide
- `package.json` - Dependencies
- `manifest.json` - Extension manifest
- `tsconfig.json` - TypeScript config
- Configuration files (.prettierrc, eslint.config.js, etc.)

### Directories

- `src/` - Source code
- `tests/` - Test files
- `scripts/` - Build scripts
- `icons/` - Extension icons
- `docs/` - Organized documentation
  - `docs/api/` - API documentation
  - `docs/architecture/` - Architecture docs
  - `docs/development/` - Development guides
  - `docs/testing/` - Testing guides
  - `docs/deployment/` - Deployment guides
  - `docs/user-guide-page/` - User guide website

## Troubleshooting

### dist/ folder still showing in git status on main

```bash
# Make sure .gitignore is configured
node scripts/manage-gitignore.cjs main

# Remove dist/ from git tracking
git rm -r --cached dist/
git commit -m "chore: remove dist from tracking"
```

### dev-docs/ showing up on main branch

```bash
# Ensure dev-docs/ is in .gitignore
node scripts/manage-gitignore.cjs main

# Remove from tracking
git rm -r --cached dev-docs/
git commit -m "chore: remove dev-docs from tracking"
```

### Accidentally pushed dev files to main

```bash
# Reset main to previous clean state
git checkout main
git reset --hard origin/main

# Re-run cleanup process
node scripts/cleanup-for-github.cjs
git add -A
git commit -m "chore: clean repository"
git push origin main --force
```

### Need to recover deleted files

Don't worry! All files are safe in the dev branch:

```bash
git checkout dev
# All your development files are here
```

## Best Practices

1. **Always work on dev branch** - Never commit directly to main
2. **Regular GitLab backups** - Push dev branch to GitLab frequently
3. **Test before releasing** - Run full test suite before merging to main
4. **Review cleanup output** - Check what files are being removed
5. **Keep main clean** - Only merge to main when ready for public release
6. **Document changes** - Update CHANGELOG or release notes

## GitHub Release Process

After pushing clean main branch to GitHub:

1. **Create a release**:
   - Go to GitHub repository
   - Click "Releases" → "Create a new release"
   - Tag version (e.g., v1.0.0)
   - Add release notes

2. **Build and attach ZIP**:

```bash
# On dev branch
pnpm build
cd dist
# Manually create ZIP of dist contents
# Upload to GitHub release
```

3. **Update README** with installation instructions

## Summary

- **Dev branch**: Full development environment with all files
- **Main branch**: Clean, public-ready code
- **Scripts automate** the cleanup process
- **GitLab preserves** full development history
- **GitHub shows** clean, professional repository

This workflow ensures users see a clean, organized repository while you maintain full development flexibility.
