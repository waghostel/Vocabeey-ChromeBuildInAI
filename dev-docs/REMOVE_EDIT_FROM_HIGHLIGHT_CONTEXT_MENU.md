# Remove Edit Option from Vocabulary/Sentence Highlight Context Menu

## Summary

Removed the "Edit" option from the context menu that appears when right-clicking on vocabulary or sentence highlights. The "Edit" option remains available when right-clicking on paragraphs.

## Changes Made

### 1. `src/ui/highlight-manager.ts`

#### Modified `showContextMenu()` function (line ~1935)

- Added explicit handling for the "edit" button
- Set `editBtn.style.display = 'none'` to hide the Edit option for vocabulary and sentence highlights

#### Modified `showSelectionContextMenu()` function (line ~1845)

- Added explicit handling for the "edit" button
- Set `editBtn.style.display = 'none'` to hide the Edit option for text selections in None mode

### 2. `src/ui/learning-interface.ts`

#### Updated `updateContextMenuItems()` function (line ~498)

- Added clarifying comment: "For vocabulary/sentence highlights and selections, hide 'Copy' and 'Edit'"
- No functional change, but improved code documentation

## Behavior After Changes

### Context Menu Visibility Matrix

| Context Type                   | Copy    | Edit    | Remove  | Pronounce | To Sentence/Vocabulary  | Add as Vocabulary/Sentence |
| ------------------------------ | ------- | ------- | ------- | --------- | ----------------------- | -------------------------- |
| **Paragraph**                  | ✅ Show | ✅ Show | ❌ Hide | ❌ Hide   | ❌ Hide                 | ❌ Hide                    |
| **Vocabulary Highlight**       | ❌ Hide | ❌ Hide | ✅ Show | ✅ Show   | ✅ Show (To Sentence)   | ❌ Hide                    |
| **Sentence Highlight**         | ❌ Hide | ❌ Hide | ✅ Show | ✅ Show   | ✅ Show (To Vocabulary) | ❌ Hide                    |
| **Text Selection (None mode)** | ❌ Hide | ❌ Hide | ❌ Hide | ✅ Show   | ❌ Hide                 | ✅ Show                    |

## Testing Checklist

- [x] Right-click on vocabulary highlight → "Edit" should NOT appear
- [x] Right-click on sentence highlight → "Edit" should NOT appear
- [x] Right-click on paragraph → "Edit" SHOULD appear
- [x] Other context menu options still work correctly
- [x] No TypeScript compilation errors

## Files Modified

1. `src/ui/highlight-manager.ts` - Added explicit hiding of Edit button for highlights
2. `src/ui/learning-interface.ts` - Updated comment for clarity

## Notes

- The HTML file (`src/ui/learning-interface.html`) was NOT modified - the Edit button still exists in the DOM but is hidden via CSS `display: none` based on context
- This approach maintains flexibility - if Edit functionality is needed for highlights in the future, it can be easily re-enabled
- The paragraph edit functionality remains fully intact and unaffected
