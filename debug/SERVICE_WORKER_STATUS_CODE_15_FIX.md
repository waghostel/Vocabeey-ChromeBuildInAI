# Service Worker Status Code 15 Fix

## Problem

The Chrome extension was showing:

- **Service worker (Inactive)** status
- **Status code: 15** error
- Error at `utils/memory-manager.js:147`

## Root Cause

The `memory-manager.ts` was using browser-specific APIs that don't exist in service worker contexts:

1. **`window.setInterval`** - Service workers don't have a `window` object
2. **`window.gc()`** - Service workers don't have a `window` object

Service workers run in a different JavaScript context (using `self` or `globalThis` instead of `window`).

## Solution

### Fixed `startMonitoring()` method:

**Before:**

```typescript
this.monitoringInterval = window.setInterval(async () => {
  // ...
}, this.MONITORING_INTERVAL);
```

**After:**

```typescript
this.monitoringInterval = setInterval(async () => {
  // ...
}, this.MONITORING_INTERVAL) as unknown as number;
```

### Fixed `forceGarbageCollection()` method:

**Before:**

```typescript
if ('gc' in window) {
  (window as any).gc();
} else if ('webkitRequestAnimationFrame' in window) {
  requestAnimationFrame(() => {});
}
```

**After:**

```typescript
if ('gc' in globalThis) {
  (globalThis as any).gc();
}
// Service workers don't have requestAnimationFrame, so we skip that fallback
```

## Changes Made

1. Replaced `window.setInterval` with `setInterval` (global function)
2. Replaced `window.gc()` with `globalThis.gc()`
3. Removed `requestAnimationFrame` fallback (not available in service workers)
4. Rebuilt the extension with `pnpm build`

## Testing

After applying these fixes:

1. Reload the extension in Chrome
2. Check `chrome://extensions` - service worker should show as **(Active)**
3. No more status code 15 errors

## Technical Notes

- Service workers use `globalThis` or `self` instead of `window`
- Global functions like `setInterval`, `setTimeout`, `fetch` are available directly
- DOM APIs like `requestAnimationFrame`, `document`, `window` are NOT available
- The `gc()` function is only available when Chrome is run with `--js-flags=--expose-gc`
