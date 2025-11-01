# Overlapping Vocabulary Highlight Fix

## Problem Description

When users created overlapping vocabulary highlights (e.g., first highlighting "an", then highlighting "an apple" which encompasses the first highlight), the system created nested DOM highlights but maintained separate vocabulary cards for each. When the outer highlight was deleted, the inner highlight's vocabulary card became orphaned, creating confusion and data inconsistency.

**Example Scenario:**

1. User highlights "an" → Creates vocabulary card for "an"
2. User highlights "an apple" → Creates vocabulary card for "an apple" (DOM nests "an" inside "an apple")
3. User deletes "an apple" → Only removes "an apple" card, leaving "an" card orphaned

## Solution Implemented

The fix implements automatic vocabulary consolidation when overlapping highlights are created, ensuring a one-to-one relationship between DOM highlights and vocabulary cards.

### Key Changes

#### 1. Overlap Detection (`detectOverlappingVocabulary`)

- Detects all existing vocabulary highlights within a new selection range
- Extracts their IDs from `data-highlight-id` attributes
- Returns array of overlapping vocabulary IDs

#### 2. Vocabulary Consolidation (`removeSubsumedVocabulary`)

- Removes subsumed vocabulary items from storage
- Dispatches removal events for UI updates
- Uses batch storage operations for performance
- Shows user-friendly notification

#### 3. User Notification (`showConsolidationNotification`)

- Displays brief toast notification when consolidation occurs
- Shows which vocabulary items were consolidated
- Auto-dismisses after 2 seconds
- Only shown in vocabulary mode

#### 4. Enhanced Highlight Removal (`removeHighlight`)

- Checks for nested highlights before removal
- Unwraps outer element while preserving inner highlights
- Ensures nested highlights remain functional when outer is deleted

### Code Flow

```
User selects overlapping text
    ↓
handleVocabularyHighlight()
    ↓
detectOverlappingVocabulary(range)
    ↓
[If overlaps found]
    ↓
removeSubsumedVocabulary(overlappingIds)
    ↓
- Remove from storage
- Dispatch removal events
- Show notification
    ↓
createHighlight() - Creates new encompassing highlight
    ↓
Result: Only one vocabulary card exists
```

## Testing Instructions

### Manual Testing

#### Test Case 1: Basic Overlap (Smaller → Larger)

1. Open an article in the extension
2. Switch to Vocabulary mode
3. Highlight the word "an"
   - ✅ Verify vocabulary card is created for "an"
4. Highlight "an apple" (encompassing "an")
   - ✅ Verify notification shows: "Consolidated 'an' into larger phrase"
   - ✅ Verify only "an apple" vocabulary card exists
   - ✅ Verify "an" card is removed from vocabulary list

#### Test Case 2: Multiple Overlaps

1. Highlight "the"
2. Highlight "the cat"
3. Highlight "the cat sat"
   - ✅ Verify notification shows: "Consolidated 2 items: the, the cat"
   - ✅ Verify only "the cat sat" vocabulary card exists

#### Test Case 3: Reverse Deletion (Delete Outer, Keep Inner)

1. Highlight "an"
2. Highlight "an apple" (consolidates "an")
3. Right-click on "an apple" and delete
   - ✅ Verify "an apple" highlight is removed from DOM
   - ✅ Verify "an apple" card is removed
   - ✅ Verify no orphaned cards remain

#### Test Case 4: Non-Overlapping Highlights

1. Highlight "cat"
2. Highlight "dog" (separate word)
   - ✅ Verify both vocabulary cards exist
   - ✅ Verify no consolidation notification appears

#### Test Case 5: Sentence Mode (Should Not Affect)

1. Switch to Sentence mode
2. Highlight a sentence containing vocabulary highlights
   - ✅ Verify sentence highlight is created
   - ✅ Verify vocabulary highlights remain unchanged
   - ✅ Verify no consolidation occurs

### Automated Testing

Run the existing test suite:

```bash
pnpm test
```

The existing "Overlapping Highlights" test suite in `tests/ui-components.test.ts` validates the merge logic.

### Edge Cases to Verify

1. **Three-level nesting**: "a" → "a big" → "a big apple"
   - Should consolidate all into "a big apple"

2. **Partial overlap**: "big apple" then "apple pie"
   - Should create two separate cards (different words)

3. **Same text, different location**: "apple" in paragraph 1, "apple" in paragraph 2
   - Should create two separate cards (different contexts)

4. **Rapid highlighting**: Quickly highlight multiple overlapping selections
   - Should handle all consolidations correctly

## Files Modified

- `src/ui/highlight-manager.ts`
  - Added `detectOverlappingVocabulary()` function
  - Added `removeSubsumedVocabulary()` function
  - Added `showConsolidationNotification()` function
  - Modified `handleVocabularyHighlight()` to detect and remove overlaps
  - Modified `removeHighlight()` to preserve nested highlights

## Performance Considerations

- **Overlap detection**: O(n) where n is number of nested highlights (typically 1-3)
- **Storage operations**: Batched into single write operation
- **UI updates**: Debounced through event system
- **Notification**: Lightweight toast with CSS transitions

## Future Enhancements

1. **Undo functionality**: Allow users to undo consolidation
2. **Consolidation history**: Track which items were consolidated
3. **User preference**: Option to disable automatic consolidation
4. **Visual indicator**: Show nested highlights with different styling
5. **Bulk consolidation**: Consolidate all overlapping highlights in article

## Related Documentation

- [Overlapping Highlights Feature](../OVERLAPPING_HIGHLIGHTS_FEATURE.md)
- [Context Menu Guide](../CONTEXT_MENU_GUIDE.md)
- [Testing Instructions](./TESTING_INSTRUCTIONS.md)
