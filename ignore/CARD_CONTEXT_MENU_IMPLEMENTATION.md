# Card Context Menu Implementation

## Overview

Added a context menu feature for vocabulary and sentence cards in the reading mode. When users right-click on a card, a context menu appears with an "Edit" option (placeholder for future functionality).

## Changes Made

### 1. Modified `src/ui/learning-interface.ts`

#### Added Card Context Menu Function

- **Function**: `showCardContextMenu(card, itemId, itemType, event)`
- Shows a context menu when right-clicking on vocabulary or sentence cards
- Stores card reference and metadata for future actions
- Positions menu at cursor location

#### Updated Context Menu Item Visibility

- **Function**: `updateContextMenuItems(contextType)`
- Added 'card' as a new context type
- For cards, only the "Edit" menu item is shown
- Reuses existing context menu UI component

#### Updated Event Handlers

- Modified `renderPartVocabularyCards()` to use `showCardContextMenu` instead of `showContextMenu`
- Modified `renderPartSentenceCards()` to use `showCardContextMenu` instead of `showContextMenu`
- Added click handler to close context menu when clicking on card content

#### Updated Context Menu Action Handler

- **Function**: `handleContextMenuAction(event)`
- Added 'card' to the itemType union type
- Added handler for card context menu actions
- Currently shows "Card edit feature coming soon!" tooltip when Edit is clicked
- Logs card information for debugging

### 2. Reused Existing UI Components

- Leveraged the existing `.context-menu` HTML element
- Reused the same styling and positioning logic as paragraph context menu
- Maintained consistency with existing UX patterns

## How It Works

1. **User Action**: User right-clicks on a vocabulary or sentence card in reading mode
2. **Menu Display**: Context menu appears at cursor position with "Edit" option
3. **Menu Interaction**:
   - Clicking "Edit" shows a placeholder message
   - Clicking outside the menu closes it
   - Clicking on card content also closes the menu
4. **Future Extension**: The Edit action is ready to be implemented with actual card editing functionality

## Technical Details

### Context Menu Types

The context menu now supports 5 types:

- `paragraph` - Shows Copy and Edit
- `card` - Shows Edit only
- `vocabulary` - Shows highlight-related actions
- `sentence` - Shows highlight-related actions
- `selection` - Shows add vocabulary/sentence actions

### Data Flow

```
Right-click on card
  → showCardContextMenu()
  → Store card reference and metadata
  → updateContextMenuItems('card')
  → Show only "Edit" item
  → User clicks "Edit"
  → handleContextMenuAction()
  → Show placeholder message
```

## Testing Recommendations

1. **Manual Testing**:
   - Load an article in reading mode
   - Highlight some vocabulary and sentences to create cards
   - Right-click on vocabulary cards - verify context menu appears with "Edit"
   - Right-click on sentence cards - verify context menu appears with "Edit"
   - Click "Edit" - verify placeholder message appears
   - Click outside menu - verify it closes
   - Click on card content - verify menu closes

2. **Edge Cases**:
   - Right-click on card action buttons (pronounce, etc.) - should not show context menu
   - Multiple rapid right-clicks
   - Context menu positioning at viewport edges

## Future Enhancements

The Edit functionality is currently a placeholder. Future implementation could include:

- Inline editing of card translations
- Editing example sentences
- Changing card difficulty level
- Adding notes to cards
- Merging or splitting cards

## Files Modified

- `src/ui/learning-interface.ts` - Main implementation

## Build Status

✅ TypeScript compilation successful
✅ No linting errors
✅ Build completed successfully
