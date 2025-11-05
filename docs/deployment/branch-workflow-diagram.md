# Branch Workflow Diagram

Visual representation of the dual-branch GitHub workflow.

## Repository Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    REMOTE REPOSITORIES                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GitHub (origin)                  GitLab (gitlab)           │
│  ├── main (clean)                 ├── main                  │
│  └── [public]                     ├── dev (full)            │
│                                    └── [private backup]      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                    ▲                        ▲
                    │                        │
                    │ push                   │ push
                    │ (after cleanup)        │ (regular)
                    │                        │
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL REPOSITORY                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐         ┌──────────────────┐          │
│  │   main branch   │◄────────│   dev branch     │          │
│  │   (clean)       │  merge  │   (full dev)     │          │
│  └─────────────────┘         └──────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## File Tracking Differences

```
┌──────────────────────────────────────────────────────────────┐
│                      DEV BRANCH                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ✓ src/                    (source code)                     │
│  ✓ tests/                  (test files)                      │
│  ✓ docs/                   (documentation)                   │
│  ✓ dist/                   (build output) ◄─ TRACKED         │
│  ✓ dev-docs/               (dev markdown) ◄─ TRACKED         │
│  ✓ debug/                  (debug files)                     │
│  ✓ user-need/              (requirements)                    │
│  ✓ .kiro/                  (Kiro config)                     │
│  ✓ *_IMPLEMENTATION.md     (dev docs)                        │
│  ✓ *_FIX_SUMMARY.md        (fix docs)                        │
│                                                               │
│  .gitignore: (minimal ignores)                               │
│    node_modules/                                             │
│    .env                                                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘

                            │
                            │ pnpm run release:prepare
                            │ (merge + configure + cleanup)
                            ▼

┌──────────────────────────────────────────────────────────────┐
│                      MAIN BRANCH                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ✓ src/                    (source code)                     │
│  ✓ tests/                  (test files)                      │
│  ✓ docs/                   (documentation)                   │
│  ✗ dist/                   (removed) ◄─ IGNORED              │
│  ✗ dev-docs/               (removed) ◄─ IGNORED              │
│  ✗ debug/                  (removed)                         │
│  ✗ user-need/              (removed)                         │
│  ✗ .kiro/                  (removed)                         │
│  ✗ *_IMPLEMENTATION.md     (moved to dev-docs/)              │
│  ✗ *_FIX_SUMMARY.md        (moved to dev-docs/)              │
│                                                               │
│  .gitignore: (excludes dev files)                            │
│    node_modules/                                             │
│    .env                                                      │
│    dist/                   ◄─ ADDED                          │
│    dev-docs/               ◄─ ADDED                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Workflow Steps

```
┌─────────────────────────────────────────────────────────────┐
│                   DAILY DEVELOPMENT                          │
└─────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │  dev branch  │
    └──────┬───────┘
           │
           ├─► Make changes
           ├─► pnpm build (dist/ tracked)
           ├─► pnpm test
           ├─► git commit
           └─► git push gitlab dev


┌─────────────────────────────────────────────────────────────┐
│                   RELEASE TO GITHUB                          │
└─────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │  dev branch  │
    └──────┬───────┘
           │
           ├─► pnpm run validate:extension
           │
           ▼
    ┌──────────────┐
    │ git checkout │
    │     main     │
    └──────┬───────┘
           │
           ├─► git merge dev
           │
           ▼
    ┌──────────────────────┐
    │ pnpm run             │
    │   release:prepare    │
    └──────┬───────────────┘
           │
           ├─► Validate (lint + test + build)
           ├─► Configure .gitignore (add dist/, dev-docs/)
           └─► Cleanup (move/remove dev files)
           │
           ▼
    ┌──────────────┐
    │  git commit  │
    │  git push    │
    │    origin    │
    │     main     │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   GitHub     │
    │  (public)    │
    └──────────────┘
```

## File Flow During Cleanup

```
┌─────────────────────────────────────────────────────────────┐
│                    BEFORE CLEANUP                            │
│                    (after merge)                             │
└─────────────────────────────────────────────────────────────┘

    main branch/
    ├── src/
    ├── tests/
    ├── docs/
    ├── dist/                          ◄─ Will be removed
    ├── debug/                         ◄─ Will be removed
    ├── user-need/                     ◄─ Will be removed
    ├── .kiro/                         ◄─ Will be removed
    ├── IMPLEMENTATION_SUMMARY.md      ◄─ Will be moved
    ├── FIX_COMPLETE_SUMMARY.md        ◄─ Will be moved
    ├── TESTING_GUIDE.md               ◄─ Will be moved
    └── ... (100+ dev markdown files)  ◄─ Will be moved


                    │
                    │ pnpm run cleanup:github
                    ▼


┌─────────────────────────────────────────────────────────────┐
│                    AFTER CLEANUP                             │
│                    (ready for GitHub)                        │
└─────────────────────────────────────────────────────────────┘

    main branch/
    ├── src/                           ✓ Kept
    ├── tests/                         ✓ Kept
    ├── docs/                          ✓ Kept
    ├── scripts/                       ✓ Kept
    ├── icons/                         ✓ Kept
    ├── README.md                      ✓ Kept
    ├── QUICK_START.md                 ✓ Kept
    ├── package.json                   ✓ Kept
    ├── manifest.json                  ✓ Kept
    ├── tsconfig.json                  ✓ Kept
    └── dev-docs/                      ✓ Created (but ignored)
        ├── IMPLEMENTATION_SUMMARY.md
        ├── FIX_COMPLETE_SUMMARY.md
        ├── TESTING_GUIDE.md
        └── ... (all dev markdown)
```

## .gitignore Configuration

```
┌─────────────────────────────────────────────────────────────┐
│                  DEV BRANCH .gitignore                       │
└─────────────────────────────────────────────────────────────┘

    # Dependencies
    node_modules/

    # Build output
    # dist/              ◄─ COMMENTED OUT (tracked in dev)

    # IDE
    .vscode/

    # Environment
    .env

    # Cache
    .eslintcache

    # dev-docs/          ◄─ NOT PRESENT (tracked in dev)


┌─────────────────────────────────────────────────────────────┐
│                  MAIN BRANCH .gitignore                      │
└─────────────────────────────────────────────────────────────┘

    # Dependencies
    node_modules/

    # Build output
    dist/                ◄─ ADDED (ignored on main)

    # IDE
    .vscode/

    # Environment
    .env

    # Cache
    .eslintcache

    dev-docs/            ◄─ ADDED (ignored on main)
```

## Command Reference

```
┌─────────────────────────────────────────────────────────────┐
│                    AVAILABLE COMMANDS                        │
└─────────────────────────────────────────────────────────────┘

    Development:
    ├─► pnpm run gitignore:dev      Configure for dev branch
    ├─► pnpm build                  Build extension
    └─► pnpm test                   Run tests

    Release Preparation:
    ├─► pnpm run cleanup:preview    Preview cleanup
    ├─► pnpm run gitignore:main     Configure for main
    ├─► pnpm run cleanup:github     Execute cleanup
    └─► pnpm run release:prepare    All-in-one preparation

    Validation:
    └─► pnpm run validate:extension Lint + test + build
```

## Safety Features

```
┌─────────────────────────────────────────────────────────────┐
│                    SAFETY MECHANISMS                         │
└─────────────────────────────────────────────────────────────┘

    1. Preview Before Cleanup
       └─► pnpm run cleanup:preview
           Shows what will be affected

    2. Files Moved, Not Deleted
       └─► Dev markdown → dev-docs/
           Can be recovered if needed

    3. All Files Safe on Dev Branch
       └─► git checkout dev
           Everything is preserved

    4. Reversible Before Push
       └─► git reset --hard HEAD
           Undo cleanup before pushing

    5. GitLab Backup
       └─► Full history on GitLab
           Private backup of everything
```

## Summary

- **Dev Branch**: Full development environment with all files
- **Main Branch**: Clean, public-ready code for GitHub
- **Automated**: Scripts handle the cleanup process
- **Safe**: Preview, reversible, files preserved on dev
- **Simple**: Easy npm scripts for common tasks

See [GITHUB_WORKFLOW.md](../../GITHUB_WORKFLOW.md) for quick reference.
