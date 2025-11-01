# Code Changes Summary

## Files Modified

### 1. `src/ui/learning-interface.html`

**Changes**: Added new context menu items

```html
<!-- Before -->
<div class="context-menu hidden">
  <button class="context-menu-item" data-action="remove">Remove</button>
</div>

<!-- After -->
<div class="context-menu hidden">
  <button class="context-menu-item" data-action="remove">Remove</button>
  <button class="context-menu-item" data-action="add-vocabulary">
    Add as Vocabulary
  </button>
  <button class="context-menu-item" data-action="add-sentence">
    Add as Sentence
  </button>
  <button class="context-menu-item" data-action="pronounce">Pronounce</button>
</div>
```

### 2. `src/ui/highlight-manager.ts`

**Changes**: Added None mode selection handling and fixed native context menu blocking

#### New State Variable

```typescript
let pendingSelection: { text: string; range: Range; context: string } | null =
  null;
```

#### Modified Initialization

```typescript
// Added contextmenu event listener
export function initializeHighlightManager(...) {
  // ... existing code ...
  document.addEventListener('contextmenu', handleContextMenu);
}

// Added cleanup
export function cleanupHighlightManager() {
  // ... existing code ...
  document.removeEventListener('contextmenu', handleContextMenu);
}
```

#### Modified `handleTextSelection()` Function

```typescript
// In None mode, do nothing on mouseup - wait for contextmenu event (right-click)
if (currentMode === 'none') {
  return;
}
```

#### New Functions Added

**1. `handleContextMenu()` (NEW - Fixes native menu blocking)**

```typescript
function handleContextMenu(event: MouseEvent): void {
  // Intercepts right-click events
  // Prevents native browser context menu
  // Shows custom menu for selections in None mode
  // Key line: event.preventDefault()
}
```

**2. `handleNoneModeSelection()`**

```typescript
function handleNoneModeSelection(
  text: string,
  range: Range,
  event: MouseEvent | TouchEvent
): void {
  // Stores selection and shows context menu
}
```

**3. `showSelectionContextMenu()`**

```typescript
function showSelectionContextMenu(
  text: string,
  clientX: number,
  clientY: number
): void {
  // Shows context menu with Add/Pronounce options
  // Hides Remove button, shows Add buttons
}
```

**4. `handleSelectionContextMenuAction()` (Exported)**

```typescript
export async function handleSelectionContextMenuAction(
  action: string
): Promise<void> {
  // Handles add-vocabulary, add-sentence, pronounce actions
  // Validates and creates highlights
}
```

#### Modified `showContextMenu()` Function

```typescript
// Added dynamic menu item visibility
const removeBtn = contextMenu.querySelector('[data-action="remove"]');
const addVocabBtn = contextMenu.querySelector('[data-action="add-vocabulary"]');
const addSentenceBtn = contextMenu.querySelector(
  '[data-action="add-sentence"]'
);
const pronounceBtn = contextMenu.querySelector('[data-action="pronounce"]');

// Show Remove for existing highlights
if (removeBtn) removeBtn.style.display = 'block';
if (addVocabBtn) addVocabBtn.style.display = 'none';
if (addSentenceBtn) addSentenceBtn.style.display = 'none';
if (pronounceBtn) pronounceBtn.style.display = 'block';
```

### 3. `src/ui/learning-interface.ts`

**Changes**: Enhanced context menu action handler

#### Modified `handleContextMenuAction()` Function

```typescript
async function handleContextMenuAction(event: Event): Promise<void> {
  const itemType = contextMenu.dataset.itemType as
    | 'vocabulary'
    | 'sentence'
    | 'selection';

  // NEW: Handle selection context menu (None mode)
  if (itemType === 'selection') {
    if (
      action === 'add-vocabulary' ||
      action === 'add-sentence' ||
      action === 'pronounce'
    ) {
      const { handleSelectionContextMenuAction } = await import(
        './highlight-manager.js'
      );
      await handleSelectionContextMenuAction(action);
    }
    contextMenu.classList.add('hidden');
    return;
  }

  // Existing: Handle highlight context menu
  if (action === 'remove') {
    const { removeHighlight } = await import('./highlight-manager.js');
    void removeHighlight(itemId, itemType);
  } else if (action === 'pronounce') {
    // NEW: Added pronounce action for existing highlights
    const highlightElement = document.querySelector(
      `[data-highlight-id="${itemId}"]`
    );
    if (highlightElement) {
      const text = highlightElement.textContent || '';
      await handlePronounceClick(
        highlightElement as HTMLElement,
        text,
        state.currentArticle?.originalLanguage
      );
    }
  }
}
```

## Key Implementation Details

### 1. Selection Preservation

- Selection is cloned and stored in `pendingSelection`
- Preserved until action is taken or menu is closed
- Allows async operations without losing selection

### 2. Dynamic Menu Items

- Menu items shown/hidden based on context:
  - **Selection context**: Show Add/Pronounce, hide Remove
  - **Highlight context**: Show Remove/Pronounce, hide Add
- Uses `display: block/none` for visibility control

### 3. Validation

- **Vocabulary**: Checks word count (1-3 words)
- **Sentence**: Checks minimum length (10 characters)
- Shows tooltip with error message if validation fails

### 4. Smart Positioning

- Calculates menu position based on cursor/element
- Checks viewport boundaries
- Adjusts position to prevent overflow
- Works with both mouse and touch events

### 5. Event Flow

```
User selects text in None mode
    ↓
handleTextSelection() detects None mode
    ↓
handleNoneModeSelection() stores selection
    ↓
showSelectionContextMenu() displays menu
    ↓
User clicks menu item
    ↓
handleContextMenuAction() routes to handler
    ↓
handleSelectionContextMenuAction() processes action
    ↓
Creates highlight or pronounces text
    ↓
Clears selection and hides menu
```

## Testing Checklist

- [x] TypeScript compilation successful
- [x] No linting errors
- [x] No diagnostic issues
- [ ] Manual testing in browser:
  - [ ] Select text in None mode
  - [ ] Context menu appears
  - [ ] "Add as Vocabulary" works (1-3 words)
  - [ ] "Add as Sentence" works (10+ chars)
  - [ ] "Pronounce" works
  - [ ] Validation errors show correctly
  - [ ] Right-click on existing highlights works
  - [ ] Menu positioning near edges works
  - [ ] Touch events work on mobile

## Backward Compatibility

✅ All existing functionality preserved:

- Vocabulary mode still auto-highlights
- Sentence mode still auto-highlights
- Existing highlights still have Remove option
- No breaking changes to existing code

## Performance Impact

- Minimal: Only adds event listener for text selection
- No impact when not in None mode
- Selection storage is lightweight
- Menu rendering is fast (simple DOM manipulation)
