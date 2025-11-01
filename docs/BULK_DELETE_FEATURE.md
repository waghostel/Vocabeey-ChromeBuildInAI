# Bulk Delete Highlights Feature

## Overview

This feature allows users to delete multiple highlights (vocabulary and/or sentences) at once by selecting a text region in "None" mode. This provides a fast and efficient way to clean up unwanted highlights without having to delete them one by one.

## User Workflow

### Step-by-Step Process (Keyboard-Only)

1. **Switch to None Mode**
   - Press `0`, `3`, or `Esc` to enter "None" mode
   - Or click the "🚫 None" button in the highlight mode selector

2. **Select Text Region**
   - Click and drag to select text in the article
   - The selection can span multiple paragraphs and include multiple highlights

3. **Preview Highlights to Delete**
   - All highlights fully enclosed within the selection will be marked with a red tint
   - A pulsing animation indicates which highlights will be deleted
   - No button appears - this is a keyboard-only workflow

4. **Execute Deletion**
   - Press `Delete` or `Backspace` key
   - Both vocabulary and sentence highlights are removed

5. **Confirmation**
   - A success notification appears showing how many highlights were deleted
   - The notification includes a breakdown (e.g., "Deleted 5 highlights (3 vocabulary, 2 sentences)")

### Canceling Bulk Delete

- **Press `Esc`**: Clears the selection and preview highlighting
- **Click elsewhere**: Clears the selection automatically
- **Switch modes**: Automatically cancels bulk delete

## Technical Implementation

### Core Components

#### 1. Selection Detection (`highlight-manager.ts`)

**State Variables:**

```typescript
let bulkDeleteButton: HTMLElement | null = null;
let highlightsToDelete: Array<{
  id: string;
  type: 'vocabulary' | 'sentence';
  element: HTMLElement;
}> = [];
```

**Key Functions:**

- `handleNoneModeTextSelection()`: Detects text selection in None mode
- `getHighlightsInRange()`: Finds all highlights within a selection range
- `isHighlightFullyEnclosed()`: Checks if a highlight is fully within the selection

#### 2. Range Comparison Algorithm

Uses the DOM Range API to determine if a highlight is fully enclosed:

```typescript
function isHighlightFullyEnclosed(
  highlightElement: HTMLElement,
  selectionRange: Range
): boolean {
  const highlightRange = document.createRange();
  highlightRange.selectNodeContents(highlightElement);

  const startComparison = selectionRange.compareBoundaryPoints(
    Range.START_TO_START,
    highlightRange
  );
  const endComparison = selectionRange.compareBoundaryPoints(
    Range.END_TO_END,
    highlightRange
  );

  // Fully enclosed if selection starts before/at highlight
  // and ends after/at highlight
  return startComparison <= 0 && endComparison >= 0;
}
```

#### 3. Visual Preview System

**CSS Classes:**

- `.will-delete`: Applied to highlights that will be deleted
- Pulsing red animation to clearly indicate deletion target
- Higher z-index to ensure visibility

**Preview Behavior:**

- Highlights marked immediately when selection is made
- Preview cleared when selection changes or is canceled
- Works with both vocabulary and sentence highlights

#### 4. Keyboard-Only Deletion

**Workflow:**

- No floating button - cleaner, simpler UI
- User selects text to see preview (red highlights)
- User presses Delete/Backspace to execute deletion
- Faster workflow with fewer steps

**Benefits:**

- Less visual clutter
- More predictable keyboard-driven interaction
- Consistent with power-user workflows
- No need to move mouse to button

#### 5. Batch Storage Operations

**Vocabulary Deletion:**

```typescript
async function bulkRemoveVocabulary(vocabularyIds: string[]): Promise<void> {
  const data = await chrome.storage.local.get('vocabulary');
  const vocabulary: Record<string, VocabularyItem> = data.vocabulary || {};

  for (const id of vocabularyIds) {
    delete vocabulary[id];
    removeDOMHighlight(id);
    highlights.delete(id);
    dispatchHighlightEvent('vocabulary-removed', { id });
  }

  // Single write operation for efficiency
  await chrome.storage.local.set({ vocabulary });
}
```

**Sentence Deletion:**

- Similar batch operation for sentences
- Single storage write for performance
- DOM cleanup for all highlights
- Event dispatching for UI updates

#### 6. Success Notification

**Features:**

- Shows total count of deleted highlights
- Breaks down by type (vocabulary vs sentences)
- Auto-dismisses after 3 seconds
- Smooth fade-in/fade-out animations
- Positioned at bottom-right corner

## Edge Cases Handled

### 1. Partial Selection

**Scenario**: User selects text that partially overlaps a highlight
**Behavior**: Highlight is NOT deleted (only fully enclosed highlights are removed)

### 2. Nested Highlights

**Scenario**: Selection contains both a sentence and vocabulary highlights within it
**Behavior**: Both are deleted if both are fully enclosed

### 3. Empty Selection

**Scenario**: User selects text with no highlights
**Behavior**: Delete button does not appear

### 4. Mode Switching

**Scenario**: User switches from None mode while selection is active
**Behavior**: Selection is cleared, button is hidden, preview is removed

### 5. Rapid Selections

**Scenario**: User makes multiple selections quickly
**Behavior**: Button updates smoothly, previous preview is cleared

### 6. Viewport Boundaries

**Scenario**: Selection near edge of screen
**Behavior**: Button repositions to stay within viewport

### 7. Large Deletions

**Scenario**: User selects many highlights (e.g., 20+)
**Behavior**: All are deleted efficiently with batch storage operation

## Keyboard Shortcuts

| Key                     | Action                                                   |
| ----------------------- | -------------------------------------------------------- |
| `Delete` or `Backspace` | Execute bulk delete (when selection exists in None mode) |
| `Esc`                   | Cancel bulk delete and clear selection                   |
| `0`, `3`, or `Esc`      | Switch to None mode (prerequisite for bulk delete)       |

## User Experience Considerations

### Visual Feedback

1. **Preview State**: Red tint with pulsing animation clearly shows what will be deleted
2. **Button Count**: Shows exact number of highlights to be deleted
3. **Success Message**: Confirms action with detailed breakdown
4. **Smooth Animations**: All transitions are smooth and non-jarring

### Accessibility

- Clear visual indicators for highlights to be deleted
- Keyboard shortcuts for power users
- Button positioned to avoid obscuring content
- High contrast colors for visibility

### Performance

- Batch storage operations minimize write overhead
- Single DOM update cycle for all deletions
- Efficient range comparison algorithm
- No lag even with many highlights

## Integration with Existing Features

### Compatibility with Single-Highlight Delete

- Single-highlight delete (click + Delete) works in Vocabulary/Sentence modes
- Bulk delete works only in None mode
- No conflicts between the two systems

### Compatibility with Context Menu

- Right-click context menu still works for individual highlights
- Bulk delete provides alternative for mass deletion
- Both methods coexist without interference

### Compatibility with Overlapping Highlights

- Correctly handles nested vocabulary within sentences
- Correctly handles nested sentences within vocabulary
- Both parent and child deleted if both fully enclosed

## Files Modified

### 1. `src/ui/highlight-manager.ts`

**Added:**

- Bulk delete state variables
- `isHighlightFullyEnclosed()` function
- `getHighlightsInRange()` function
- `showBulkDeleteButton()` function
- `hideBulkDeleteButton()` function
- `executeBulkDelete()` function
- `bulkRemoveVocabulary()` function
- `bulkRemoveSentences()` function
- `showBulkDeleteNotification()` function
- `handleNoneModeTextSelection()` function

**Modified:**

- `handleKeyPress()`: Added bulk delete keyboard support
- `setHighlightMode()`: Clear bulk delete state on mode change
- `cleanupHighlightManager()`: Clean up bulk delete state
- `handleTextSelection()`: Route to bulk delete handler in None mode

### 2. `src/ui/learning-interface.css`

**Added:**

- `.will-delete` class for preview highlighting
- `@keyframes pulse-delete` animation
- `.bulk-delete-button` styles
- `.bulk-delete-notification` styles
- Dark mode support for bulk delete

## Testing Checklist

### Basic Functionality

- [x] Select text in None mode → Delete button appears
- [x] Button shows correct count of highlights
- [x] Click button → Highlights are deleted
- [x] Press Delete key → Highlights are deleted
- [x] Press Esc → Selection cleared, button hidden

### Preview System

- [x] Highlights marked with red tint
- [x] Pulsing animation visible
- [x] Preview cleared when selection changes
- [x] Preview cleared when mode changes

### Edge Cases

- [x] Partial selection → Highlight not deleted
- [x] Nested highlights → Both deleted if both enclosed
- [x] Empty selection → Button doesn't appear
- [x] Mode switch → State cleared properly
- [x] Viewport boundaries → Button positioned correctly

### Storage & Performance

- [x] Vocabulary items removed from storage
- [x] Sentence items removed from storage
- [x] DOM elements removed properly
- [x] UI cards updated correctly
- [x] No lag with many highlights

### Integration

- [x] Single-highlight delete still works
- [x] Context menu still works
- [x] Overlapping highlights handled correctly
- [x] Build succeeds without errors
- [x] No TypeScript errors

## Future Enhancements

### Potential Improvements

1. **Undo Functionality**
   - Allow users to undo bulk deletions
   - Store deleted highlights temporarily
   - Provide "Undo" button in notification

2. **Confirmation Dialog**
   - Optional confirmation for large deletions (e.g., >10 highlights)
   - User preference setting
   - "Don't ask again" checkbox

3. **Selection Statistics**
   - Show breakdown before deletion (e.g., "3 vocabulary, 2 sentences")
   - Display in button tooltip
   - Help users make informed decisions

4. **Drag-to-Select Mode**
   - Alternative selection method specifically for highlights
   - Visual highlight of selectable regions
   - More precise control

5. **Select All Button**
   - Quick way to select all highlights in current article part
   - Useful for clearing entire sections
   - Confirmation required

6. **Partial Delete Option**
   - Allow deletion of partially selected highlights
   - Toggle setting for user preference
   - Clear visual indication of behavior

## Conclusion

The bulk delete feature provides a powerful and efficient way to manage highlights in the language learning interface. It complements the existing single-highlight delete functionality and follows the same design principles:

- **Intuitive**: Clear visual feedback and simple workflow
- **Efficient**: Batch operations for performance
- **Safe**: Preview system prevents accidental deletions
- **Flexible**: Multiple methods (button, keyboard) for different user preferences

The implementation handles edge cases gracefully and integrates seamlessly with existing features.
