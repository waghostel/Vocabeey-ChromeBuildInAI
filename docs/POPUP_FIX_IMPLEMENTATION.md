# Translation Popup Stuck Issue - Fix Implementation

## Problem Description

Users occasionally experienced translation popups that would not disappear after moving the mouse away from highlighted text. The popup would remain visible and block underlying text, with no way to dismiss it.

## Root Cause Analysis

The issue occurred due to race conditions and edge cases in the hover event handling:

1. **Race Conditions**: Fast mouse movements could cause `mouseleave` events to fire before or after timeout completion in unexpected ways
2. **Event Bubbling**: Nested highlights (vocabulary inside sentences) could cause event propagation issues
3. **No Fallback Mechanism**: If the `mouseleave` event failed to fire, there was no backup cleanup mechanism

## Solution: Global Mouse Movement Tracking (Strategy 1)

### Implementation Overview

Added a document-level `mousemove` listener that continuously monitors the mouse position and automatically hides the popup when the mouse is no longer over any highlight element.

### Key Changes

#### 1. Added State Variables (Lines 44-47)

```typescript
// Translation popup state for tracking and cleanup
let currentPopupElement: HTMLElement | null = null;
let currentPopupHighlightElement: HTMLElement | null = null;
let popupCheckInterval: number | null = null;
```

These variables track:

- `currentPopupElement`: Reference to the active popup DOM element
- `currentPopupHighlightElement`: Reference to the highlight element that triggered the popup
- `popupCheckInterval`: Reserved for future interval-based checking if needed

#### 2. Updated `showTranslationPopup()` Function

```typescript
function showTranslationPopup(element: HTMLElement, translation: string): void {
  // ... existing code ...

  // Track the popup and its associated highlight element
  currentPopupElement = popup;
  currentPopupHighlightElement = element;

  // ... rest of positioning code ...
}
```

Now tracks which popup is active and which highlight owns it.

#### 3. Updated `hideTranslationPopup()` Function

```typescript
function hideTranslationPopup(): void {
  const popup = document.querySelector('.translation-popup');
  if (popup) {
    popup.remove();
  }

  // Clear tracked state
  currentPopupElement = null;
  currentPopupHighlightElement = null;
}
```

Clears the tracking state when popup is hidden.

#### 4. Added `handleGlobalMouseMove()` Function (Lines 463-495)

```typescript
function handleGlobalMouseMove(event: MouseEvent): void {
  // Only check if we have an active popup
  if (!currentPopupElement || !currentPopupHighlightElement) {
    return;
  }

  // Get the element currently under the mouse cursor
  const elementUnderMouse = document.elementFromPoint(
    event.clientX,
    event.clientY
  );

  if (!elementUnderMouse) {
    // Mouse is outside the document, hide popup
    hideTranslationPopup();
    return;
  }

  // Check if the mouse is over the highlight element or any of its children
  const isOverHighlight =
    elementUnderMouse === currentPopupHighlightElement ||
    currentPopupHighlightElement.contains(elementUnderMouse);

  // Check if the mouse is over any highlight element (for nested highlights)
  const isOverAnyHighlight = elementUnderMouse.closest('[data-highlight-type]');

  // If mouse is not over the original highlight or any highlight, hide the popup
  if (!isOverHighlight && !isOverAnyHighlight) {
    hideTranslationPopup();
  }
}
```

This function:

- Only runs when a popup is active (performance optimization)
- Uses `document.elementFromPoint()` to detect what's under the cursor
- Handles nested highlights (vocabulary inside sentences)
- Automatically hides popup when mouse leaves all highlight areas

#### 5. Registered Global Listener in `initializeHighlightManager()`

```typescript
export function initializeHighlightManager(...) {
  // ... existing listeners ...

  // Setup global mousemove listener to handle stuck popups
  document.addEventListener('mousemove', handleGlobalMouseMove);
}
```

#### 6. Added Cleanup in `cleanupHighlightManager()`

```typescript
export function cleanupHighlightManager(): void {
  // ... existing cleanup ...
  document.removeEventListener('mousemove', handleGlobalMouseMove);
  hideTranslationPopup();

  // Clear popup check interval if running
  if (popupCheckInterval) {
    clearInterval(popupCheckInterval);
    popupCheckInterval = null;
  }
}
```

Ensures proper cleanup when the highlight manager is destroyed.

## How It Works

### Normal Flow

1. User hovers over highlight → `mouseenter` fires → 500ms timeout starts
2. Timeout completes → `showTranslationPopup()` called → popup shown and tracked
3. User moves mouse away → `mouseleave` fires → `hideTranslationPopup()` called
4. Popup removed and state cleared

### Backup Flow (Fixes the Bug)

1. User hovers over highlight → popup shown and tracked
2. `mouseleave` fails to fire (race condition/edge case)
3. User moves mouse → `handleGlobalMouseMove()` fires continuously
4. Function detects mouse is no longer over highlight
5. `hideTranslationPopup()` called automatically
6. Popup removed and state cleared

### Edge Case Handling

- **Nested Highlights**: Checks both the original highlight and any highlight under cursor
- **Fast Mouse Movement**: Global listener catches all movements regardless of event timing
- **Mouse Outside Document**: Detects and hides popup immediately
- **Multiple Popups**: Always hides existing popup before showing new one

## Performance Considerations

- **Minimal Overhead**: Function returns immediately if no popup is active
- **Efficient DOM Queries**: Uses `elementFromPoint()` which is highly optimized
- **No Polling**: Event-driven approach, only runs when mouse actually moves
- **Single Listener**: One global listener handles all highlights

## Testing Recommendations

Test these scenarios to verify the fix:

1. ✅ **Rapid Hover**: Quickly move mouse over and away from highlights
2. ✅ **Nested Highlights**: Hover over vocabulary inside sentences
3. ✅ **Edge Scrolling**: Hover near viewport edges and scroll
4. ✅ **Mode Switching**: Change modes while popup is visible
5. ✅ **Fast Navigation**: Quickly move between multiple highlights
6. ✅ **Long Hover**: Leave mouse on highlight for extended time
7. ✅ **Click While Hovering**: Click on highlight while popup is visible

## Future Enhancements (Optional)

If issues persist, consider adding these additional strategies:

- **Strategy 2**: Auto-hide timeout (10 seconds maximum)
- **Strategy 3**: Click-to-dismiss anywhere on page
- **Strategy 4**: Escape key to dismiss
- **Strategy 5**: MutationObserver to detect orphaned popups

## Files Modified

- `src/ui/highlight-manager.ts`: Added global mouse tracking and state management

## Build Status

✅ TypeScript compilation successful
✅ No linting errors
✅ Build completed successfully
