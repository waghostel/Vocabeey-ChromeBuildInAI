# Click-to-Select and Delete Feature Implementation

## Overview

This document describes the implementation of the click-to-select and keyboard delete functionality for vocabulary and sentence highlights in the language learning interface.

## Features Implemented

### 1. Hover Color Change (Both Vocabulary and Sentences)

**Problem Solved:**

- Previously, vocabulary highlights had translation popups that appeared quickly and obscured the hover color change
- Sentence highlights didn't have hover translation popups at all

**Solution:**

- Increased popup delay from 200ms to 500ms for both vocabulary and sentence highlights
- This allows users to see the hover color change before the popup appears
- Added hover translation popups to sentence highlights for consistency
- Improved popup positioning to show below highlight if there's no room above

**CSS Changes:**

- Existing `:hover` styles now visible due to increased delay
- Hover changes background color slightly for visual feedback

### 2. Click-to-Select Functionality

**Behavior:**

- Left-clicking any highlight (vocabulary or sentence) selects it
- Selected highlights get a distinct visual appearance:
  - Thicker border (2px solid instead of bottom-only)
  - Slightly darker/more saturated background
  - Subtle box-shadow for depth
  - Border-radius for rounded corners
  - Higher z-index (10) to appear on top

**Implementation:**

- Added selection state management in `highlight-manager.ts`:
  - `selectedHighlightId`: Tracks which highlight is selected
  - `selectedHighlightType`: Tracks if it's vocabulary or sentence
  - `selectedHighlightElement`: Reference to the DOM element
- Functions added:
  - `selectHighlight()`: Marks a highlight as selected
  - `deselectHighlight()`: Removes selection state
  - `getSelectedHighlight()`: Returns current selection info
  - `deleteSelectedHighlight()`: Removes the selected highlight

**Click Handler Changes:**

- Vocabulary highlights: Changed from pronouncing text to selecting
- Sentence highlights: Added click listener for selection (was missing)
- Both use `e.stopPropagation()` to prevent nested highlights from both being selected

### 3. Mouse Leave Deselection

**Behavior:**

- When the mouse leaves a selected highlight, it automatically deselects
- This provides a clean UX where selection is temporary and contextual
- Prevents confusion about what's selected

**Implementation:**

- Extended existing `mouseleave` handlers for both vocabulary and sentence highlights
- Checks if the leaving highlight is currently selected
- Calls `deselectHighlight()` if it matches

**Edge Case Handling:**

- Translation popup has `pointer-events: none`, so moving to popup doesn't trigger `mouseleave`
- Nested highlights handle deselection independently

### 4. Keyboard Delete Functionality

**Behavior:**

- Press `Delete` or `Backspace` key to remove the selected highlight
- Press `Escape` key to deselect without deleting
- Only works when a highlight is selected
- Prevents browser back navigation when Backspace is pressed with selection

**Implementation:**

- Added global keyboard event listener: `handleKeyPress()`
- Listens for:
  - `Delete` or `Backspace`: Calls `deleteSelectedHighlight()`
  - `Escape`: Calls `deselectHighlight()`
- Properly prevents default browser behavior when appropriate
- Listener added in `initializeHighlightManager()`
- Listener removed in `cleanupHighlightManager()`

### 5. Mode Switching Behavior

**Behavior:**

- Switching between modes (vocabulary/sentence/none) clears any selection
- Prevents confusion about what's selected in different modes

**Implementation:**

- Modified `setHighlightMode()` to call `deselectHighlight()`

## CSS Classes Added

### Selected State Styles

```css
/* Vocabulary selected */
.highlight-vocabulary.selected {
  background-color: rgba(255, 235, 59, 0.75);
  border: 2px solid rgba(255, 193, 7, 1);
  border-radius: 3px;
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.3);
  z-index: 10;
}

/* Sentence selected */
.highlight-sentence.selected {
  background-color: rgba(129, 212, 250, 0.65);
  border: 2px solid rgba(33, 150, 243, 1);
  border-radius: 3px;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.3);
  z-index: 10;
}

/* Nested vocabulary selected */
.highlight-sentence .highlight-vocabulary.selected {
  background-color: rgba(255, 235, 59, 0.85);
  border: 2px solid rgba(255, 193, 7, 1);
  border-radius: 3px;
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.4);
  z-index: 11;
}

/* Nested sentence selected */
.highlight-vocabulary .highlight-sentence.selected {
  background-color: rgba(129, 212, 250, 0.75);
  border: 2px solid rgba(33, 150, 243, 1);
  border-radius: 3px;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.4);
  z-index: 11;
}
```

## User Workflow

### Deleting a Highlight

**Method 1: Click + Delete Key (New)**

1. Hover over a highlight → See color change
2. Wait 500ms → See translation popup
3. Click the highlight → It becomes selected (visual change)
4. Press Delete or Backspace → Highlight is removed
5. Or move mouse away → Selection is cleared

**Method 2: Right-Click Menu (Existing)**

1. Right-click a highlight
2. Select "Remove" from context menu
3. Highlight is removed

### Viewing Translations

**Both vocabulary and sentences now show translation on hover:**

1. Hover over any highlight
2. Wait 500ms
3. Translation popup appears above (or below if no room)
4. Move mouse away → Popup disappears

## Edge Cases Handled

### Overlapping Highlights

- Clicking nested vocabulary selects only the vocabulary (not the sentence)
- Clicking sentence (non-vocab part) selects only the sentence
- `e.stopPropagation()` prevents both from being selected
- Higher z-index (11) for nested selected highlights

### Multiple Selections

- Only one highlight can be selected at a time
- Clicking a new highlight deselects the previous one
- Implemented in `selectHighlight()` by calling `deselectHighlight()` first

### Mode Switching

- Selection is cleared when switching modes
- Prevents confusion about what's selected in different contexts

### Translation Popup Interaction

- Popup has `pointer-events: none`
- Moving to popup doesn't trigger `mouseleave`
- Selection remains while popup is visible
- Popup hides when mouse leaves highlight

### Keyboard Shortcuts

- Delete/Backspace only works when highlight is selected
- Prevents accidental deletions
- Escape key provides way to deselect without deleting
- Backspace default behavior prevented when selection exists

## Files Modified

### 1. `src/ui/highlight-manager.ts`

- Added selection state variables
- Added selection management functions
- Modified vocabulary click handler
- Modified sentence click handler
- Added hover translation to sentences
- Extended mouseleave handlers
- Added keyboard event handler
- Updated initialization and cleanup

### 2. `src/ui/learning-interface.css`

- Added `.selected` class styles for vocabulary
- Added `.selected` class styles for sentences
- Added nested selected state styles
- Maintained existing hover styles

## Testing Checklist

### Hover Behavior

- [x] Vocabulary hover shows color change
- [x] Sentence hover shows color change
- [x] Translation popup appears after 500ms
- [x] Popup positioned correctly (doesn't obscure highlight)
- [x] Nested highlights show correct hover colors

### Click Selection

- [x] Click vocabulary → Gets selected
- [x] Click sentence → Gets selected
- [x] Click nested vocabulary → Only vocabulary selected
- [x] Click different highlight → Previous deselects
- [x] Selected state visually distinct

### Mouse Leave Deselection

- [x] Mouse leaves vocabulary → Deselects
- [x] Mouse leaves sentence → Deselects
- [x] Mouse to popup → Doesn't deselect

### Delete Functionality

- [x] Select + Delete key → Removes highlight
- [x] Select + Backspace key → Removes highlight
- [x] Escape key → Deselects without deleting
- [x] Delete with no selection → Nothing happens
- [x] Right-click delete still works

### Edge Cases

- [x] Mode switching clears selection
- [x] Only one highlight selected at a time
- [x] Nested highlights handle correctly
- [x] Build succeeds without errors

## Future Enhancements

### Potential Improvements

1. **Visual feedback for delete**: Brief animation or notification when highlight is deleted
2. **Undo functionality**: Allow users to undo accidental deletions
3. **Keyboard navigation**: Tab through highlights, Enter to pronounce
4. **Multi-select**: Hold Ctrl/Cmd to select multiple highlights
5. **Batch delete**: Delete multiple selected highlights at once
6. **Confirmation dialog**: Optional confirmation before deleting (user preference)

### Accessibility

1. **Screen reader support**: Announce selection and deletion
2. **Focus indicators**: Keyboard focus styles for accessibility
3. **ARIA attributes**: Proper roles and states for highlights

## Conclusion

This implementation provides a streamlined workflow for managing highlights:

- **Hover** to see translation and color change
- **Click** to select
- **Delete** to remove
- **Mouse away** to deselect

The feature is intuitive, handles edge cases properly, and maintains consistency across vocabulary and sentence highlights.
