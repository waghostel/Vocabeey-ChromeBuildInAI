# Fix for Premature Article Data Cleanup

## Root Cause Identified ✅

The article data is being deleted **immediately after being stored** because:

1. Service worker creates new tab for learning interface
2. Service worker stores article with key `article_${tabId}`
3. **Tab loads `learning-interface.html` → triggers `chrome.tabs.onUpdated` event**
4. **Memory manager detects URL change → calls `unregisterTab()`**
5. **Memory manager calls `cleanupTabResources()` → calls storage manager**
6. **Storage manager deletes `article_${tabId}` from session storage**
7. Learning interface tries to load → finds no data → shows error

## Evidence from Logs

```
service-worker.ts:523 Article stored for tab 1709054965
memory-manager.ts:82 Unregistered tab 1709054965  ← PROBLEM!
storage-manager.ts:474 Cleaned up storage data for tab 1709054965  ← DATA DELETED!
```

## The Problematic Code

### Memory Manager (src/utils/memory-manager.ts)

```typescript
// This listener is too aggressive!
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.url && this.activeTabs.has(tabId)) {
    // Tab navigated away from learning interface
    await this.unregisterTab(tabId); // ← FIRES WHEN TAB LOADS!
  }
});
```

**Problem:** This fires when the tab **first loads** the learning interface URL, not just when it navigates away!

## Solution Options

### Option 1: Check if URL is Learning Interface (Recommended)

Only unregister if the tab navigates **away from** the learning interface, not **to** it.

**File:** `src/utils/memory-manager.ts`

```typescript
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.url && this.activeTabs.has(tabId)) {
    // Check if navigating away from learning interface
    const learningInterfaceUrl = chrome.runtime.getURL(
      'ui/learning-interface.html'
    );

    // Only cleanup if navigating to a different URL
    if (!changeInfo.url.startsWith(learningInterfaceUrl)) {
      console.log(
        `Tab ${tabId} navigated away from learning interface to ${changeInfo.url}`
      );
      await this.unregisterTab(tabId);
    }
  }
});
```

### Option 2: Add Delay Before Cleanup

Give the learning interface time to load before allowing cleanup.

**File:** `src/utils/memory-manager.ts`

```typescript
private tabRegistrationTime: Map<number, number> = new Map();

registerTab(tabId: number): void {
  this.activeTabs.add(tabId);
  this.tabRegistrationTime.set(tabId, Date.now());
  console.log(
    `Registered tab ${tabId}, total active tabs: ${this.activeTabs.size}`
  );
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.url && this.activeTabs.has(tabId)) {
    // Don't cleanup if tab was just registered (within 5 seconds)
    const registrationTime = this.tabRegistrationTime.get(tabId);
    if (registrationTime && Date.now() - registrationTime < 5000) {
      console.log(`Tab ${tabId} recently registered, skipping cleanup`);
      return;
    }

    // Tab navigated away from learning interface
    await this.unregisterTab(tabId);
  }
});
```

### Option 3: Only Listen to Tab Close, Not Navigation

Remove the navigation listener entirely and only cleanup on tab close.

**File:** `src/utils/memory-manager.ts`

```typescript
// Remove or comment out this listener:
/*
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.url && this.activeTabs.has(tabId)) {
    await this.unregisterTab(tabId);
  }
});
*/

// Keep only the tab removal listener:
chrome.tabs.onRemoved.addListener(async (tabId: number) => {
  await this.unregisterTab(tabId);
});
```

## Recommended Fix (Option 1)

This is the most robust solution. Here's the complete implementation:

**File:** `src/utils/memory-manager.ts`

Find this code (around line 263-269):

```typescript
// Listen for tab updates (navigation)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.url && this.activeTabs.has(tabId)) {
    // Tab navigated away from learning interface
    await this.unregisterTab(tabId);
  }
});
```

Replace with:

```typescript
// Listen for tab updates (navigation)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.url && this.activeTabs.has(tabId)) {
    // Get the learning interface URL
    const learningInterfaceUrl = chrome.runtime.getURL(
      'ui/learning-interface.html'
    );

    // Only cleanup if navigating away from learning interface
    // Don't cleanup when initially loading the learning interface
    if (
      !changeInfo.url.startsWith(learningInterfaceUrl) &&
      !changeInfo.url.startsWith('chrome-extension://')
    ) {
      console.log(
        `Tab ${tabId} navigated away from learning interface to ${changeInfo.url}`
      );
      await this.unregisterTab(tabId);
    } else {
      console.log(
        `Tab ${tabId} is still on learning interface, keeping registered`
      );
    }
  }
});
```

## Testing the Fix

### Before Fix

```
1. Click extension on IANA page
2. Article stored for tab X
3. Tab immediately unregistered
4. Article data deleted
5. Learning interface shows "No article data found"
```

### After Fix

```
1. Click extension on IANA page
2. Article stored for tab X
3. Tab loads learning-interface.html (NOT unregistered)
4. Article data remains in storage
5. Learning interface loads article successfully ✅
```

### Verification Steps

1. Apply the fix to `src/utils/memory-manager.ts`
2. Rebuild: `pnpm build`
3. Reload extension in Chrome
4. Open service worker console
5. Navigate to IANA page and click extension
6. Check logs - should see:

```
✅ Article stored for tab X
✅ Tab X is still on learning interface, keeping registered
✅ (No "Unregistered tab" message)
✅ (No "Cleaned up storage data" message)
```

7. Learning interface should load successfully

## Additional Improvements

### Add Tab State Tracking

To make this more robust, track which tabs are learning interface tabs:

```typescript
private learningInterfaceTabs: Set<number> = new Set();

registerTab(tabId: number): void {
  this.activeTabs.add(tabId);
  this.learningInterfaceTabs.add(tabId);
  console.log(
    `Registered tab ${tabId}, total active tabs: ${this.activeTabs.size}`
  );
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  // Only check tabs we're tracking
  if (!this.learningInterfaceTabs.has(tabId)) {
    return;
  }

  if (changeInfo.url) {
    const learningInterfaceUrl = chrome.runtime.getURL('ui/learning-interface.html');

    // If navigating away from learning interface
    if (!changeInfo.url.startsWith(learningInterfaceUrl)) {
      console.log(`Tab ${tabId} navigated away, cleaning up`);
      this.learningInterfaceTabs.delete(tabId);
      await this.unregisterTab(tabId);
    }
  }
});

chrome.tabs.onRemoved.addListener(async (tabId: number) => {
  this.learningInterfaceTabs.delete(tabId);
  await this.unregisterTab(tabId);
});
```

## Why This Happened

The memory manager was designed to cleanup resources when tabs navigate away to prevent memory leaks. However, it didn't account for the initial page load triggering the `onUpdated` event.

The `chrome.tabs.onUpdated` event fires when:

- Tab URL changes (navigation)
- Tab loads a new page
- Tab status changes (loading → complete)

So when the learning interface tab is created and loads `learning-interface.html`, it triggers `onUpdated` with the new URL, which the memory manager interprets as "navigation away" and cleans up the data.

## Related Issues

This same issue would affect:

- Any tab that takes time to load
- Any tab that redirects during load
- Any tab with hash/query parameter changes

The fix ensures we only cleanup when truly navigating away, not during initial load.
