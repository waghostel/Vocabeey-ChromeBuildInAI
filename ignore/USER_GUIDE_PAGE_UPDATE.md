# User Guide Page Update - D and F Hotkeys

## Summary

Updated the user guide page (docs/user-guide-page/index.html) to reflect the correct keyboard shortcuts for page navigation: D and F instead of E and R.

## Changes Made

### File: `docs/user-guide-page/index.html`

**Section**: Keyboard Shortcuts (line ~437-448)

**Before**:

```html
<div class="shortcut-item">
  <div class="shortcut-keys"><kbd>E</kbd> <kbd>R</kbd></div>
  <div class="shortcut-desc">Previous (E) / Next (R) part</div>
</div>
```

**After**:

```html
<div class="shortcut-item">
  <div class="shortcut-keys"><kbd>D</kbd> <kbd>F</kbd></div>
  <div class="shortcut-desc">Previous (D) / Next (F) part</div>
</div>
```

## Consistency Across Documentation

All documentation now consistently shows the correct keyboard shortcuts:

### Navigation Shortcuts

- **← (Left Arrow)** or **D**: Navigate to previous article part
- **→ (Right Arrow)** or **F**: Navigate to next article part

### Updated Files

1. ✅ `src/ui/learning-interface.ts` - Core implementation
2. ✅ `src/ui/onboarding-wizard.ts` - Interactive tutorial
3. ✅ `README.md` - Main project documentation
4. ✅ `KEYBOARD_SHORTCUTS_SUMMARY.md` - Complete shortcuts reference
5. ✅ `ARTICLE_SEGMENTATION_USER_GUIDE.md` - Navigation guide
6. ✅ `docs/user-guide-page/index.html` - User guide landing page

## Deployment

The user guide page is deployed on Vercel. To update the live site:

1. **Automatic**: Push changes to GitHub (if Vercel is connected)
2. **Manual**: Run `vercel --prod` from `docs/user-guide-page/` directory

## Testing

To test the user guide page locally:

```bash
cd docs/user-guide-page
python -m http.server 8000
# or
npx http-server
```

Then open http://localhost:8000 in your browser.

## Date

November 5, 2025
