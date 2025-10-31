# Reload Extension After Build

After running `pnpm build`, you must reload the extension in Chrome:

## Method 1: Quick Reload

1. Go to `chrome://extensions/`
2. Find "Language Learning Assistant"
3. Click the reload icon (🔄)

## Method 2: Toggle

1. Go to `chrome://extensions/`
2. Toggle the extension OFF
3. Toggle the extension ON

## Method 3: Remove and Re-add

1. Go to `chrome://extensions/`
2. Click "Remove"
3. Click "Load unpacked"
4. Select the `dist/` folder

## Why This Is Needed

Chrome caches the extension files. After rebuilding, you must reload to use the new version.

## Verify the Fix

After reloading, test the translation feature. The error should be gone and you should see:

- `[Translation unavailable: text]` if translation fails (graceful fallback)
- Proper translation if it succeeds
