# Extension Icons

This directory contains the extension icons in various sizes.

Required sizes:

- icon16.png (16x16) - Favicon
- icon32.png (32x32) - Windows computers
- icon48.png (48x48) - Extension management page
- icon128.png (128x128) - Chrome Web Store

## Current Icons

The icons are generated from `bee only-2.png` using the Sharp image processing library.

To regenerate icons from the source:

```bash
pnpm run convert-icons
```

This script automatically converts `bee only-2.png` to all required sizes with proper transparency and optimization.
