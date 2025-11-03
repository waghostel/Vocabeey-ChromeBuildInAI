# Disable Paragraph Context Menu in Edit Mode

## Overview

Implemented a fix to disable the paragraph context menu (right-click menu) when a paragraph is in edit mode. This prevents users from triggering the paragraph context menu showing "Copy" and "Edit" options while they're already editing the paragraph.

## Problem

Previously, when a paragraph was in edit mode, the right-click context menu handler remained active. This meant users could still see the paragraph context menu (with "Copy" and "Edit" options) even while editing, which was confusing and unnecessary.

## Solution

Implemented Option 1 from the plan: Remove and restore the context menu event listener when entering/exiting edit mode.

## Changes Made

### 1. Store Context Menu Handler Reference

**File**: `src/ui/learning-interface.ts`  
**Function**: `addCopyButtonsToParagraphs()`

Changed the anonymous context menu handler to a named function and stored a reference to it on the paragraph element:

```typescript
// Add right-click context menu handler
const contextMenuHandler = (e: Event) => {
  const target = (e as MouseEvent).target as HTMLElement;

  // Check if click is on a highlight element
  const isHighlight =
    target.classList.contains('highlight-vocabulary') ||
    target.classList.contains('highlight-sentence') ||
    target.closest('.highlight-vocabulary') ||
    target.closest('.highlight-sentence');

  // If clicking on a highlight, let the highlight handler take over
  if (isHighlight) {
    return; // Don't prevent default, let highlight handler handle it
  }

  // Only show paragraph menu if clicking on plain text
  e.preventDefault();
  showParagraphContextMenu(paragraph, e as MouseEvent);
};

// Store reference to handler for later removal during edit mode
(paragraph as any)._paragraphContextMenuHandler = contextMenuHandler;

// Add listener
paragraph.addEventListener('contextmenu', contextMenuHandler);
```

### 2. Remove Context Menu Handler in Edit Mode

**File**: `src/ui/learning-interface.ts`  
**Function**: `enableEditMode()`

Added code to remove the paragraph context menu handler when entering edit mode:

```typescript
// Remove paragraph context menu handler to disable it during edit mode
const paragraphContextMenuHandler = (paragraph as any)
  ._paragraphContextMenuHandler;
if (paragraphContextMenuHandler) {
  paragraph.removeEventListener('contextmenu', paragraphContextMenuHandler);
}
```

This is placed right after hiding the copy button and before focusing the paragraph.

### 3. Restore Context Menu Handler After Edit

**File**: `src/ui/learning-interface.ts`  
**Function**: `exitEditMode()`

Added code to restore the paragraph context menu handler when exiting edit mode:

```typescript
// Restore paragraph context menu handler
const paragraphContextMenuHandler = (editingParagraph as any)
  ._paragraphContextMenuHandler;
if (paragraphContextMenuHandler) {
  editingParagraph.addEventListener('contextmenu', paragraphContextMenuHandler);
}
```

This is placed right after showing the copy button and before removing other edit mode handlers.

Also renamed the variable in the cleanup section for clarity:

- Changed `contextMenuHandler` to `editContextMenuHandler` to distinguish it from the paragraph context menu handler

## Behavior

### Before Edit Mode

- Right-click on paragraph → Shows paragraph context menu with "Copy" and "Edit" options

### During Edit Mode

- Right-click on paragraph → Shows browser's default context menu (for cut/copy/paste text editing)
- Paragraph context menu is completely disabled
- Edit mode context menu (for selected text) still works as expected

### After Edit Mode (Save or Cancel)

- Right-click on paragraph → Shows paragraph context menu with "Copy" and "Edit" options
- Context menu functionality fully restored

## Benefits

1. **Clean separation**: Context menu is completely disabled during edit mode
2. **No conditional checks**: Handler doesn't need to check edit state
3. **Consistent pattern**: Follows existing pattern used for other edit mode handlers (`_editContextMenuHandler`, `_editClickOutsideHandler`, etc.)
4. **Better UX**: Users get the standard browser context menu for text editing operations
5. **Easy to maintain**: Clear entry/exit points for edit mode behavior

## Testing Checklist

- [x] Right-click on paragraph in normal mode → context menu appears
- [x] Enter edit mode → right-click on paragraph → no paragraph context menu (browser default appears)
- [x] In edit mode, browser's default context menu appears for cut/copy/paste
- [x] Save edit → right-click on paragraph → context menu works again
- [x] Cancel edit → right-click on paragraph → context menu works again
- [x] No TypeScript errors or diagnostics

## Technical Details

### Handler Storage Pattern

The implementation uses the same pattern as other edit mode handlers:

- `_paragraphContextMenuHandler`: Original paragraph context menu handler (persistent)
- `_editContextMenuHandler`: Edit mode context menu handler (temporary)
- `_editKeyHandler`: Edit mode keyboard handler (temporary)
- `_editClickOutsideHandler`: Edit mode click outside handler (temporary)
- `_editInputHandler`: Edit mode input handler (temporary)

### Event Listener Management

- **Add**: When paragraph is created in `addCopyButtonsToParagraphs()`
- **Remove**: When entering edit mode in `enableEditMode()`
- **Restore**: When exiting edit mode in `exitEditMode()`
- **Never deleted**: The handler reference is kept on the paragraph element for the lifetime of the paragraph

## Conclusion

This implementation successfully disables the paragraph context menu during edit mode while preserving normal browser functionality for text editing. The solution is clean, maintainable, and follows existing code patterns in the project.
