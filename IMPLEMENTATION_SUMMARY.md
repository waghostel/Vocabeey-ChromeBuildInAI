# Context Menu Conversion Feature - Implementation Summary

## Overview

Added "Change to Sentence" and "Change to Vocabulary" options to the context menu that appears when right-clicking on highlighted vocabulary or sentence items in the reading interface.

## Changes Made

### 1. HTML Structure (`src/ui/learning-interface.html`)

- Added two new context menu items:
  - `<button class="context-menu-item" data-action="change-to-sentence">Change to Sentence</button>`
  - `<button class="context-menu-item" data-action="change-to-vocabulary">Change to Vocabulary</button>`

### 2. Context Menu Display Logic (`src/ui/highlight-manager.ts`)

#### Updated `showContextMenu()` function:

- Added references to the new menu items
- Implemented conditional display logic:
  - When right-clicking on **vocabulary**: shows "Remove", "Pronounce", and "Change to Sentence"
  - When right-clicking on **sentence**: shows "Remove", "Pronounce", and "Change to Vocabulary"
  - Hides the inappropriate conversion option for each type

#### Updated `showSelectionContextMenu()` function:

- Added references to the new menu items
- Ensures conversion options are hidden when showing menu for new text selections (None mode)

#### Added Conversion Functions:

**`convertVocabularyToSentence(vocabularyId: string)`**

- Retrieves vocabulary item from storage
- Creates new sentence item with:
  - Same text (word as content)
  - Same translation
  - Same articleId and partId
  - New unique ID
- Removes vocabulary item from storage
- Updates DOM highlight attributes (changes type from vocabulary to sentence)
- Updates internal highlights map
- Dispatches events for UI updates

**`convertSentenceToVocabulary(sentenceId: string)`**

- Retrieves sentence item from storage
- Creates new vocabulary item with:
  - Sentence content as word
  - Same translation
  - Context set to sentence content
  - Empty exampleSentences array
  - Same articleId and partId
  - New unique ID
  - Default values (difficulty: 5, reviewCount: 0)
- Removes sentence item from storage
- Updates DOM highlight attributes (changes type from sentence to vocabulary)
- Updates internal highlights map
- Dispatches events for UI updates

**`updateHighlightType(oldId, oldType, newId, newType)`**

- Finds all DOM elements with the old highlight ID
- Updates data attributes (data-highlight-id, data-highlight-type)
- Updates CSS classes (removes old type class, adds new type class)
- Re-attaches event listeners for the new type:
  - Context menu listener
  - Click listener for None mode selection

### 3. Action Handler (`src/ui/learning-interface.ts`)

#### Updated `handleContextMenuAction()` function:

- Added handlers for 'change-to-sentence' and 'change-to-vocabulary' actions
- Imports conversion functions from highlight-manager
- Calls appropriate conversion function based on action
- Reloads vocabulary and sentences from storage after conversion
- Re-renders both vocabulary and sentence card sections to reflect changes

## How It Works

### User Flow:

1. User right-clicks on a highlighted vocabulary word or sentence in the article
2. Context menu appears with appropriate options:
   - For vocabulary: "Remove", "Change to Sentence", "Pronounce"
   - For sentence: "Remove", "Change to Vocabulary", "Pronounce"
3. User clicks on conversion option
4. System converts the item:
   - Updates storage (removes old item, adds new item)
   - Updates DOM highlights (changes type and ID)
   - Updates internal state
   - Triggers UI re-render
5. User sees the item moved to the appropriate section (vocabulary cards ↔ sentence cards)

### Technical Details:

- **Storage**: Uses Chrome's local storage API for persistence
- **DOM Updates**: Modifies highlight element attributes and classes in-place
- **Event System**: Uses custom events for UI synchronization
- **ID Management**: Generates new unique IDs for converted items
- **Translation Preservation**: Keeps existing translations to avoid re-translation overhead

## Benefits

1. **Flexibility**: Users can reclassify items if they initially chose the wrong type
2. **No Data Loss**: Preserves translations and metadata during conversion
3. **Seamless UX**: Updates happen instantly with visual feedback
4. **Consistent State**: Ensures storage, DOM, and UI state remain synchronized

## Testing Recommendations

1. Convert vocabulary to sentence and verify:
   - Item appears in sentence cards section
   - Item removed from vocabulary cards section
   - DOM highlight changes color/style
   - Storage updated correctly

2. Convert sentence to vocabulary and verify:
   - Item appears in vocabulary cards section
   - Item removed from sentence cards section
   - DOM highlight changes color/style
   - Storage updated correctly

3. Test edge cases:
   - Very long vocabulary words
   - Very short sentences
   - Items with special characters
   - Multiple conversions in sequence
   - Conversion with overlapping highlights

4. Test UI updates:
   - Card sections re-render correctly
   - Learning mode displays updated items
   - Navigation between article parts maintains state

## Files Modified

1. `src/ui/learning-interface.html` - Added menu items
2. `src/ui/highlight-manager.ts` - Added conversion logic and menu display updates
3. `src/ui/learning-interface.ts` - Added action handlers

## Build Status

✅ TypeScript compilation successful
✅ No diagnostic errors
✅ Build completed successfully
