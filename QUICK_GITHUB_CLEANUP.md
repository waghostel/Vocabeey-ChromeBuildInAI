# Quick GitHub Cleanup Reference

## TL;DR

Move dev docs to `dev-docs/` folder, add to `.gitignore` on main branch only.

## Commands (Copy & Paste)

```bash
# Preview what will happen
node scripts/preview-cleanup.js

# Execute cleanup
git checkout main
git merge dev
node scripts/cleanup-for-github.js
node scripts/manage-gitignore.js add
git add -A
git commit -m "chore: clean up repository for public release"
git push origin main

# Return to dev
git checkout dev
node scripts/manage-gitignore.js remove
git add .gitignore
git commit -m "chore: keep dev-docs tracked on dev branch"
```

## What Happens?

| Action     | Files/Folders                                 | Result               |
| ---------- | --------------------------------------------- | -------------------- |
| **Move**   | 70+ dev markdown files                        | → `dev-docs/` folder |
| **Remove** | `.kiro/`, `.amazonq/`, `debug/`, `ignore/`    | Deleted              |
| **Remove** | `demo-page/`, `prompt-api-test/`, `coverage/` | Deleted              |
| **Remove** | `test-*.html`, `demo-*.html`                  | Deleted              |
| **Remove** | `mcp-config.json`, `eslint-output.json`       | Deleted              |
| **Keep**   | `src/`, `docs/`, `README.md`, etc.            | Unchanged            |

## Branch Differences

| Branch   | dev-docs/ in .gitignore? | dev-docs/ tracked? | Pushed to?   |
| -------- | ------------------------ | ------------------ | ------------ |
| **main** | ✅ Yes                   | ❌ No (ignored)    | GitHub       |
| **dev**  | ❌ No                    | ✅ Yes (tracked)   | GitLab/Local |

## Helper Scripts

```bash
# Preview cleanup
node scripts/preview-cleanup.js

# Execute cleanup
node scripts/cleanup-for-github.js

# Add dev-docs/ to .gitignore (main branch)
node scripts/manage-gitignore.js add

# Remove dev-docs/ from .gitignore (dev branch)
node scripts/manage-gitignore.js remove
```

## Verification

```bash
# Check current branch
git branch

# Check if dev-docs/ is ignored
git check-ignore dev-docs/

# See ignored files
git status --ignored

# Check .gitignore content
grep "dev-docs/" .gitignore
```

## Undo (Before Push)

```bash
# Undo last commit
git reset --hard HEAD~1

# Discard all changes
git reset --hard HEAD
```

## Full Documentation

- **Quick Summary**: `GITHUB_CLEANUP_SUMMARY.md`
- **Step-by-Step Guide**: `GITHUB_DEPLOYMENT_STEPS.md`
- **Detailed Plan**: `.github-cleanup.md`
- **Script Documentation**: `scripts/README.md`
