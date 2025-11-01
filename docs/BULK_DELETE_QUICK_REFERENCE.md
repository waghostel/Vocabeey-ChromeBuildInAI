# Bulk Delete - Quick Reference

## For Developers

### Key Functions

```typescript
// Check if highlight is fully enclosed in selection
isHighlightFullyEnclosed(element: HTMLElement, range: Range): boolean

// Get all highlights within a range
getHighlightsInRange(range: Range): Array<{id, type, element}>

// Clear preview state (keyboard-only)
clearBulkDeletePreview(): void

// Execute deletion
executeBulkDelete(): Promise<void>

// Batch operations
bulkRemoveVocabulary(ids: string[]): Promise<void>
bulkRemoveSentences(ids: string[]): Promise<void>
```

### State Variables

```typescript
let highlightsToDelete: Array<{
  id: string;
  type: 'vocabulary' | 'sentence';
  element: HTMLElement;
}> = [];
```

### CSS Classes

```css
.will-delete              /* Preview state for highlights */
.bulk-delete-notification /* Success message */
```

### Event Flow

```
User selects text in None mode
    ↓
handleTextSelection() called
    ↓
handleNoneModeTextSelection() called
    ↓
getHighlightsInRange() finds enclosed highlights
    ↓
Highlights marked with .will-delete class (preview)
    ↓
User presses Delete or Backspace
    ↓
executeBulkDelete() called
    ↓
bulkRemoveVocabulary() + bulkRemoveSentences()
    ↓
DOM cleanup + storage update
    ↓
showBulkDeleteNotification()
    ↓
clearBulkDeletePreview() cleans up
```

### Range Comparison Logic

```typescript
// Highlight is fully enclosed if:
// 1. Selection starts before or at highlight start
// 2. Selection ends after or at highlight end

const startComparison = selectionRange.compareBoundaryPoints(
  Range.START_TO_START,
  highlightRange
);
const endComparison = selectionRange.compareBoundaryPoints(
  Range.END_TO_END,
  highlightRange
);

return startComparison <= 0 && endComparison >= 0;
```

### Integration Points

**Modified Functions:**

- `handleKeyPress()` - Keyboard support
- `setHighlightMode()` - Mode switching cleanup
- `cleanupHighlightManager()` - Cleanup on unmount
- `handleTextSelection()` - Route to bulk delete handler

**Storage Operations:**

- Uses `chrome.storage.local.get()` and `set()`
- Batch operations for efficiency
- Single write per deletion

**Event Dispatching:**

- `vocabulary-removed` event for each vocab item
- `sentence-removed` event for each sentence item
- UI updates automatically via event listeners

### Testing

```typescript
// Test files
tests/bulk-delete.test.ts

// Run tests
pnpm test bulk-delete.test.ts

// Coverage areas
- Range comparison
- Highlight detection
- DOM manipulation
- Storage operations
- Button positioning
- Notification formatting
```

### Debugging

```typescript
// Enable debug logging
console.log('Highlights to delete:', highlightsToDelete);
console.log('Selection range:', range);
console.log('Enclosed highlights:', getHighlightsInRange(range));

// Check state
console.log('Current mode:', currentMode);
console.log('Button visible:', bulkDeleteButton !== null);
```

### Common Issues

**Preview not appearing:**

- Check if in None mode
- Verify highlights exist in selection
- Ensure highlights are fully enclosed

**Highlights not deleted:**

- Check storage permissions
- Verify IDs match between DOM and storage
- Check console for errors

**Preview not showing:**

- Verify `.will-delete` CSS is loaded
- Check if class is being applied
- Inspect element styles

### Performance Tips

1. **Batch Operations**: Always use bulk functions, not loops
2. **Single Write**: Update storage once, not per item
3. **DOM Queries**: Cache selectors when possible
4. **Event Handlers**: Use event delegation where appropriate

### Code Style

```typescript
// Good: Batch operation
await bulkRemoveVocabulary(vocabularyIds);

// Bad: Loop with individual operations
for (const id of vocabularyIds) {
  await removeVocabularyItem(id); // Multiple writes!
}

// Good: Single storage write
const vocabulary = {...};
vocabularyIds.forEach(id => delete vocabulary[id]);
await chrome.storage.local.set({ vocabulary });

// Bad: Multiple storage writes
for (const id of vocabularyIds) {
  const data = await chrome.storage.local.get('vocabulary');
  delete data.vocabulary[id];
  await chrome.storage.local.set(data); // Slow!
}
```

## For Users

### Quick Start

1. Press `0` → None mode
2. Select text → Highlights turn red
3. Press `Delete` → Done!

### Keyboard Shortcuts

| Key                   | Action    |
| --------------------- | --------- |
| `0`, `3`, `Esc`       | None mode |
| `Delete`, `Backspace` | Delete    |
| `Esc` (selecting)     | Cancel    |

### Tips

- ✅ Only fully selected highlights are deleted
- ✅ Preview shows what will be deleted
- ✅ Works with both vocabulary and sentences
- ✅ Can select across paragraphs

### Troubleshooting

**Button not showing?**

- Are you in None mode?
- Did you select text?
- Are there highlights in selection?

**Wrong highlights marked?**

- Adjust selection to fully cover desired highlights
- Partially selected highlights won't be deleted

## Quick Links

- [Full Documentation](./BULK_DELETE_FEATURE.md)
- [User Guide](./BULK_DELETE_USAGE_GUIDE.md)
- [Implementation Summary](./BULK_DELETE_IMPLEMENTATION_SUMMARY.md)
- [Test File](../tests/bulk-delete.test.ts)
- [Source Code](../src/ui/highlight-manager.ts)

---

**Last Updated**: November 1, 2025
