# Git Upstream Warning - Quick Fix

## The Warning

```
Your branch is based on 'origin/dev', but the upstream is gone.
(use "git branch --unset-upstream" to fixup)
```

## What It Means

- Your local `dev` branch is trying to track `origin/dev` on GitHub
- But `origin/dev` doesn't exist on GitHub (you only pushed `main`)
- Git is warning you it can't find the tracking target

## Is It Serious?

**No!** It's just a warning. Everything still works fine.

## Quick Fix

### Option 1: Remove Upstream Tracking (Recommended)

```bash
git branch --unset-upstream dev
```

**When to use:** You don't want `dev` on GitHub (your current strategy)

### Option 2: Track GitLab Instead

```bash
git branch --set-upstream-to=gitlab/dev dev
```

**When to use:** You want `dev` to track GitLab's dev branch

### Option 3: Push Dev to GitHub

```bash
git push origin dev
```

**When to use:** You want `dev` on both GitHub and GitLab

## Recommended for Your Setup

Since you want only `main` on GitHub:

```bash
# Remove the upstream tracking
git branch --unset-upstream dev

# Verify the warning is gone
git status
```

## After the Fix

When pushing `dev`, specify the remote:

```bash
# Push to GitLab
git push gitlab dev

# Push to GitHub (if needed)
git push origin dev
```

## Your Current Setup

```
GitHub (origin):  ✅ main only
GitLab (gitlab):  ✅ main + dev
Local:            ✅ main + dev
```

This is intentional and correct for your strategy!

---

**Quick Command:** `git branch --unset-upstream dev`
