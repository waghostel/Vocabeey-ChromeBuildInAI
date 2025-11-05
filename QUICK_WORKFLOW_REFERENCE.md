# Quick Workflow Reference

## Your Setup

```
GitLab (gitlab) → Primary development (private)
GitHub (origin) → Public releases (open source)
```

## Daily Work

```bash
# Start
git checkout dev
git pull

# Work
git commit -am "your changes"
git push  # → Goes to GitLab automatically

# Done!
```

## Public Release

```bash
# 1. Merge to main
git checkout main
git merge dev

# 2. Clean up
node scripts/cleanup-for-github.cjs
node scripts/manage-gitignore.cjs add

# 3. Push to GitHub
git add -A
git commit -m "chore: public release"
git push origin main

# 4. Back to dev
git checkout dev
```

## Key Commands

| Action             | Command                           |
| ------------------ | --------------------------------- |
| **Daily push**     | `git push` (→ GitLab)             |
| **Public release** | `git push origin main` (→ GitHub) |
| **Check status**   | `git status`                      |
| **See remotes**    | `git branch -vv`                  |

## What Goes Where

### GitLab (Private)

✅ Everything (all files, all branches)

### GitHub (Public)

✅ main branch only (cleaned up)
❌ No dev branch
❌ No dev-docs/
❌ No user-need/

## Remember

- **Work on dev** (pushes to GitLab)
- **Release on main** (push to GitHub)
- **Run cleanup** before GitHub push
- **GitLab = default**, GitHub = explicit

---

**Quick Help**: See `GITLAB_GITHUB_WORKFLOW.md` for full details
