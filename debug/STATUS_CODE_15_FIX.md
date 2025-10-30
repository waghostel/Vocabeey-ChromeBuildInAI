# Service Worker Status Code 15 - Fix Applied

## Issue Identified

**Status Code 15** in Chrome extensions means "Failed to load extension module" or "Extension file not found".

## Root Cause

Found an incorrect path in `src/utils/offscreen-manager.ts`:

```typescript
// ❌ INCORRECT (before fix)
url: chrome.runtime.getURL('dist/offscreen/ai-processor.html');

// ✅ CORRECT (after fix)
url: chrome.runtime.getURL('offscreen/ai-processor.html');
```

**Why this was wrong:** When the extension is loaded in Chrome, the `dist/` folder becomes the extension root. Using `dist/` in the path creates an invalid path like `chrome-extension://[id]/dist/offscreen/ai-processor.html` which doesn't exist.

## Fix Applied

1. ✅ Removed `dist/` prefix from offscreen document URL in `src/utils/offscreen-manager.ts`
2. ✅ Rebuilt the extension with `pnpm build`
3. ✅ Verified all file paths are correct
4. ✅ Confirmed service worker syntax is valid
5. ✅ All imports have proper `.js` extensions

## Verification Results

All checks passed:

- ✅ Extension structure is valid
- ✅ Service worker exists and has correct imports
- ✅ All dependencies are present
- ✅ Content scripts exist
- ✅ Icons are in place
- ✅ No syntax errors

## How to Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right corner)
3. Click **"Load unpacked"**
4. Select the `dist/` folder from this project:
   ```
   C:\Users\Cheney\Documents\Github\ChromeBuildInAI\dist
   ```
5. The extension should load successfully!

## If Status Code 15 Still Appears

If you still encounter Status Code 15, try these steps:

### Step 1: Check Chrome Console

1. On the `chrome://extensions/` page, click **"Errors"** button for your extension
2. Look for specific error messages
3. Share the error message for further diagnosis

### Step 2: Verify Chrome Version

- Ensure you're using Chrome 88+ (for Manifest V3 support)
- Check: `chrome://version/`

### Step 3: Clear Extension Cache

```powershell
# Remove and rebuild
Remove-Item -Recurse -Force dist
pnpm build
```

### Step 4: Check for Module Loading Issues

Open Chrome DevTools on the extension's service worker:

1. Go to `chrome://extensions/`
2. Find your extension
3. Click "service worker" link
4. Check Console for any import errors

## Additional Diagnostics

Run the diagnostic script anytime:

```bash
node debug/test-extension-loading.js
```

This will verify:

- Extension structure
- File existence
- Import paths
- Manifest validity

## Files Modified

- `src/utils/offscreen-manager.ts` - Fixed offscreen document URL path

## Build Output

The extension is now properly built in the `dist/` folder with:

- Correct ES module imports (all have `.js` extensions)
- Valid manifest.json
- All required assets copied
- Proper file structure

## Next Steps

1. Load the extension in Chrome using the instructions above
2. Test the extension by clicking the icon on a web page
3. If any issues occur, check the Chrome DevTools console
4. Report any new errors for further investigation

---

**Build Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Status:** ✅ Ready to load
