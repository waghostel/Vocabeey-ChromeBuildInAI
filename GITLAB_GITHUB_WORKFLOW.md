# GitLab + GitHub Dual Remote Workflow

## Overview

This document describes your dual-remote Git workflow where:

- **GitLab** is your primary development remote (private)
- **GitHub** is your public release remote (open source)

## Current Configuration

### Remotes

```
gitlab (primary)  → https://gitlab.com/waghostel-group/vocabee.git
origin (public)   → https://github.com/waghostel/Vocabeey-ChromeBuildInAI.git
```

### Branch Tracking

| Local Branch | Tracks        | Purpose                                 |
| ------------ | ------------- | --------------------------------------- |
| `dev`        | `gitlab/dev`  | Primary development branch              |
| `main`       | `gitlab/main` | Stable releases (also synced to GitHub) |

### Repository Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL REPOSITORY                          │
│                                                              │
│  ┌──────────┐                    ┌──────────┐              │
│  │   dev    │ ←── Primary ────→  │   main   │              │
│  │ (gitlab) │     Development    │ (gitlab) │              │
│  └────┬─────┘                    └────┬─────┘              │
│       │                               │                     │
└───────┼───────────────────────────────┼─────────────────────┘
        │                               │
        ↓                               ↓
┌──────────────────┐           ┌───────────────────┐
│     GITLAB       │           │      GITHUB       │
│    (Primary)     │           │     (Public)      │
│                  │           │                   │
│  ✅ dev          │           │  ✅ main (clean)  │
│  ✅ main         │           │  ❌ dev (not      │
│                  │           │     published)    │
│  Full history    │           │  Public release   │
│  All dev files   │           │  Cleaned up       │
│  Private         │           │  Open source      │
└──────────────────┘           └───────────────────┘
```

## Daily Development Workflow

### 1. Working on Features (dev branch)

```bash
# Start working
git checkout dev
git pull  # Pulls from gitlab/dev automatically

# Make changes
# ... edit files ...

# Commit changes
git add .
git commit -m "feat: your feature description"

# Push to GitLab (primary remote)
git push  # Pushes to gitlab/dev automatically
```

### 2. Creating a Public Release (main branch)

When you're ready to publish to GitHub:

```bash
# Switch to main
git checkout main

# Merge latest dev changes
git merge dev

# Run cleanup for public release
node scripts/cleanup-for-github.cjs
node scripts/manage-gitignore.cjs add

# Review changes
git status
git diff

# Commit cleanup
git add -A
git commit -m "chore: prepare for public release"

# Push to GitHub (public)
git push origin main

# Optionally push to GitLab main (if not protected)
# git push gitlab main

# Return to dev
git checkout dev
```

## Common Commands

### Check Status

```bash
# See which remote you're tracking
git branch -vv

# See all remotes
git remote -v

# Check branch status
git status
```

### Pushing to Specific Remotes

```bash
# Push dev to GitLab (default)
git push

# Push main to GitHub
git push origin main

# Push main to GitLab
git push gitlab main

# Push to both remotes
git push origin main
git push gitlab main
```

### Pulling from Specific Remotes

```bash
# Pull from default remote (GitLab)
git pull

# Pull from GitHub
git pull origin main

# Pull from GitLab
git pull gitlab dev
```

## Branch Management

### Creating New Feature Branches

```bash
# Create from dev
git checkout dev
git checkout -b feature/new-feature

# Work on feature
git commit -am "feat: implement new feature"

# Push to GitLab
git push gitlab feature/new-feature

# Set upstream for future pushes
git branch --set-upstream-to=gitlab/feature/new-feature
```

### Merging Features

```bash
# Switch to dev
git checkout dev

# Merge feature
git merge feature/new-feature

# Push to GitLab
git push

# Delete feature branch (optional)
git branch -d feature/new-feature
git push gitlab --delete feature/new-feature
```

## GitHub Public Release Workflow

### Full Release Process

```bash
# 1. Ensure dev is up to date
git checkout dev
git pull
git push

# 2. Switch to main and merge
git checkout main
git merge dev

# 3. Clean up for public release
node scripts/cleanup-for-github.cjs
node scripts/manage-gitignore.cjs add

# 4. Verify cleanup
ls *.md  # Should only show README.md and QUICK_START.md
git status

# 5. Commit and push to GitHub
git add -A
git commit -m "chore: public release v1.x.x

- Clean up development files
- Update documentation
- Remove internal notes"

git push origin main

# 6. Return to dev
git checkout dev

# 7. Remove dev-docs from gitignore on dev
node scripts/manage-gitignore.cjs remove
git commit -am "chore: keep dev-docs tracked on dev"
```

### Quick Release (No New Cleanup)

If you've already cleaned up and just want to push updates:

```bash
git checkout main
git merge dev
git push origin main
git checkout dev
```

## What Gets Published Where

### GitLab (Private - Full Development)

✅ All source code
✅ All markdown documentation (100+ files)
✅ Development tools (.kiro/, debug/, etc.)
✅ dev-docs/ folder
✅ user-need/ folder
✅ Test files and demos
✅ All branches (dev, main, feature branches)

### GitHub (Public - Clean Release)

✅ Source code (src/)
✅ Essential documentation (README.md, QUICK_START.md)
✅ Structured docs (docs/ folder)
✅ Build scripts and configuration
✅ Tests
❌ Development tools (.kiro/, .amazonq/, debug/)
❌ dev-docs/ folder (hidden via .gitignore)
❌ user-need/ folder
❌ Extra markdown files in root
❌ dev branch

## Advantages of This Setup

### GitLab as Primary

✅ **Full Development Environment**: All files, branches, and history
✅ **Private Repository**: Internal notes and planning stay private
✅ **Default Push/Pull**: Simple `git push` and `git pull` commands
✅ **Team Collaboration**: Full access for development team
✅ **CI/CD Integration**: Can set up GitLab CI/CD pipelines

### GitHub for Public

✅ **Clean Public Face**: Only essential files visible
✅ **Open Source Friendly**: Easy for contributors to understand
✅ **Professional Appearance**: No clutter or internal docs
✅ **Separate Concerns**: Development vs. public release
✅ **Community Engagement**: GitHub's social features

## Troubleshooting

### "Your branch is ahead of 'gitlab/dev'"

This means you have local commits not pushed to GitLab:

```bash
git push  # Push to GitLab
```

### "Your branch is behind 'gitlab/dev'"

Someone else pushed to GitLab:

```bash
git pull  # Pull from GitLab
```

### "Your branch and 'gitlab/dev' have diverged"

Your local and remote have different commits:

```bash
# Option 1: Merge (recommended)
git pull --no-rebase

# Option 2: Rebase (if you prefer linear history)
git pull --rebase

# Option 3: Force push (use with caution!)
git push --force
```

### Accidentally Pushed to Wrong Remote

```bash
# If you pushed dev to GitHub by mistake
git push origin :dev  # Delete dev from GitHub

# If you need to undo a push to GitHub main
# (This is destructive, use carefully!)
git push origin main --force
```

### Need to Update Both Remotes

```bash
# Push to both GitLab and GitHub
git push gitlab main
git push origin main
```

## Configuration Commands

### View Current Configuration

```bash
# See branch tracking
git branch -vv

# See remote URLs
git remote -v

# See all git config
git config --list
```

### Change Tracking Branch

```bash
# Set dev to track GitLab
git branch --set-upstream-to=gitlab/dev dev

# Set main to track GitLab
git branch --set-upstream-to=gitlab/main main

# Remove tracking
git branch --unset-upstream dev
```

### Rename Remotes (Optional)

If you want to rename remotes for clarity:

```bash
# Rename 'origin' to 'github'
git remote rename origin github

# Now you have:
# - gitlab (primary)
# - github (public)
```

## Best Practices

### 1. Always Work on Dev

- Do all development on `dev` branch
- Only use `main` for releases
- Create feature branches from `dev`

### 2. Regular Pushes to GitLab

```bash
# Push frequently to backup your work
git push  # Goes to GitLab by default
```

### 3. Careful with GitHub Pushes

- Only push `main` to GitHub
- Never push `dev` to GitHub (keep it private)
- Always run cleanup scripts before pushing to GitHub

### 4. Keep Branches in Sync

```bash
# Regularly merge dev into main
git checkout main
git merge dev
git checkout dev
```

### 5. Document Your Releases

```bash
# Use descriptive commit messages for GitHub
git commit -m "chore: release v1.2.0

- Add new feature X
- Fix bug Y
- Update documentation"
```

## Quick Reference

### Daily Commands

```bash
# Start work
git checkout dev
git pull

# Save work
git commit -am "your message"
git push

# Create release
git checkout main
git merge dev
# ... run cleanup ...
git push origin main
git checkout dev
```

### Remote-Specific Commands

```bash
# GitLab (primary)
git push                    # Push to GitLab
git pull                    # Pull from GitLab
git push gitlab dev         # Explicit push to GitLab

# GitHub (public)
git push origin main        # Push to GitHub
git pull origin main        # Pull from GitHub
```

## Summary

| Aspect           | GitLab              | GitHub                 |
| ---------------- | ------------------- | ---------------------- |
| **Purpose**      | Primary development | Public releases        |
| **Visibility**   | Private             | Public                 |
| **Branches**     | dev + main          | main only              |
| **Content**      | Full (all files)    | Clean (essential only) |
| **Default Push** | ✅ Yes              | ❌ No (explicit)       |
| **Team Access**  | ✅ Full             | 👁️ Read-only           |
| **CI/CD**        | ✅ Can configure    | ⚠️ Public workflows    |

---

**Setup Date**: November 5, 2025
**Primary Remote**: GitLab (gitlab)
**Public Remote**: GitHub (origin)
**Default Branch**: dev (tracks gitlab/dev)
