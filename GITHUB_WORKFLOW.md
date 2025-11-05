# GitHub Workflow Quick Reference

Quick commands for managing the dual-branch GitHub workflow.

## Daily Development (Dev Branch)

```bash
# Work on dev branch
git checkout dev

# Configure gitignore for dev (tracks dist/)
pnpm run gitignore:dev

# Make changes, build, test
pnpm build
pnpm test

# Commit and push to GitLab
git add .
git commit -m "feat: your changes"
git push gitlab dev
```

## Release to GitHub (Main Branch)

```bash
# 1. Ensure dev is clean and tested
git checkout dev
pnpm run validate:extension

# 2. Switch to main and merge
git checkout main
git merge dev

# 3. Prepare for GitHub (automated)
pnpm run release:prepare

# 4. Review changes
git status
git diff

# 5. Commit and push
git add -A
git commit -m "chore: prepare v1.x.x release"
git push origin main

# 6. Switch back to dev
git checkout dev
pnpm run gitignore:dev
```

## Available Scripts

| Command                    | Description                                               |
| -------------------------- | --------------------------------------------------------- |
| `pnpm run gitignore:dev`   | Configure .gitignore for dev branch (tracks dist/)        |
| `pnpm run gitignore:main`  | Configure .gitignore for main branch (ignores dist/)      |
| `pnpm run cleanup:github`  | Remove dev files and prepare for GitHub                   |
| `pnpm run release:prepare` | Full release preparation (validate + configure + cleanup) |

## What Gets Cleaned Up

### Removed from Main Branch

- ✗ Development markdown files (_\_SUMMARY.md, _\_GUIDE.md, etc.)
- ✗ Debug folders (debug/, ignore/, user-need/)
- ✗ Demo/test HTML files
- ✗ Build output (dist/)
- ✗ Development tools (.kiro/)

### Kept on Main Branch

- ✓ Source code (src/)
- ✓ Tests (tests/)
- ✓ Documentation (docs/)
- ✓ Configuration files
- ✓ README.md & QUICK_START.md

## Branch Differences

| Feature       | Dev Branch | Main Branch          |
| ------------- | ---------- | -------------------- |
| dist/ folder  | ✓ Tracked  | ✗ Ignored            |
| Dev markdown  | ✓ Included | ✗ Moved to dev-docs/ |
| Debug folders | ✓ Included | ✗ Removed            |
| Source code   | ✓ Included | ✓ Included           |
| Tests         | ✓ Included | ✓ Included           |

## Troubleshooting

### dist/ still showing on main

```bash
git rm -r --cached dist/
git commit -m "chore: remove dist from tracking"
```

### Need to recover deleted files

```bash
git checkout dev  # All files are safe here
```

### Accidentally pushed dev files to main

```bash
git checkout main
git reset --hard origin/main
pnpm run release:prepare
git add -A
git commit -m "chore: clean repository"
git push origin main --force
```

## Full Documentation

See [docs/deployment/github-workflow-guide.md](docs/deployment/github-workflow-guide.md) for detailed workflow documentation.
