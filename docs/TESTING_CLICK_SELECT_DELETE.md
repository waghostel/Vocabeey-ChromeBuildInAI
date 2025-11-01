# Testing Guide: Click-to-Select and Delete Feature

## Quick Test Steps

### Test 1: Hover Color Change

**Vocabulary Highlights:**

1. Open an article with vocabulary highlights
2. Hover your mouse over a vocabulary highlight
3. ✅ **Expected**: Background color changes slightly (becomes more yellow)
4. Wait 500ms
5. ✅ **Expected**: Translation popup appears above the word

**Sentence Highlights:**

1. Switch to sentence mode or find a sentence highlight
2. Hover your mouse over a sentence highlight
3. ✅ **Expected**: Background color changes slightly (becomes more blue)
4. Wait 500ms
5. ✅ **Expected**: Translation popup appears above the sentence

### Test 2: Click to Select

**Vocabulary:**

1. Click on a vocabulary highlight
2. ✅ **Expected**:
   - Highlight gets a thicker border
   - Background becomes more saturated
   - Subtle box-shadow appears
   - Border has rounded corners

**Sentence:**

1. Click on a sentence highlight
2. ✅ **Expected**: Same visual changes as vocabulary (but blue instead of yellow)

**Multiple Clicks:**

1. Click on one highlight (it becomes selected)
2. Click on a different highlight
3. ✅ **Expected**: First highlight deselects, second highlight becomes selected

### Test 3: Mouse Leave Deselection

1. Click on a highlight to select it
2. Move your mouse away from the highlight
3. ✅ **Expected**: Highlight deselects (returns to normal appearance)

**With Translation Popup:**

1. Hover over a highlight (wait for popup)
2. Click to select it
3. Move mouse slightly toward the popup
4. ✅ **Expected**: Highlight stays selected (popup has pointer-events: none)
5. Move mouse completely away
6. ✅ **Expected**: Highlight deselects and popup disappears

### Test 4: Delete with Keyboard

**Delete Key:**

1. Click on a highlight to select it
2. Press the `Delete` key
3. ✅ **Expected**: Highlight is removed from the article and from storage

**Backspace Key:**

1. Click on a highlight to select it
2. Press the `Backspace` key
3. ✅ **Expected**: Highlight is removed (same as Delete)

**Escape Key:**

1. Click on a highlight to select it
2. Press the `Escape` key
3. ✅ **Expected**: Highlight deselects but is NOT removed

**No Selection:**

1. Don't select any highlight
2. Press `Delete` or `Backspace`
3. ✅ **Expected**: Nothing happens (no error)

### Test 5: Overlapping Highlights

**Vocabulary Inside Sentence:**

1. Create a sentence highlight
2. Create a vocabulary highlight within that sentence
3. Click on the vocabulary part
4. ✅ **Expected**: Only vocabulary is selected (not the sentence)
5. Click on the sentence part (not on vocabulary)
6. ✅ **Expected**: Only sentence is selected

**Hover on Nested:**

1. Hover over vocabulary inside a sentence
2. ✅ **Expected**: Vocabulary hover color shows (yellow)
3. Hover over sentence part without vocabulary
4. ✅ **Expected**: Sentence hover color shows (blue)

### Test 6: Mode Switching

1. Click on a highlight to select it
2. Switch to a different mode (vocabulary → sentence → none)
3. ✅ **Expected**: Selection is cleared when mode changes

### Test 7: Right-Click Menu (Still Works)

1. Right-click on a highlight
2. Select "Remove" from context menu
3. ✅ **Expected**: Highlight is removed (alternative to Delete key)

## Visual Indicators Reference

### Hover State

- **Vocabulary**: `rgba(255, 235, 59, 0.6)` - Light yellow
- **Sentence**: `rgba(129, 212, 250, 0.5)` - Light blue

### Selected State

- **Vocabulary**:
  - Background: `rgba(255, 235, 59, 0.75)` - Darker yellow
  - Border: `2px solid rgba(255, 193, 7, 1)` - Solid yellow border
  - Box-shadow: `0 0 0 2px rgba(255, 193, 7, 0.3)` - Yellow glow
- **Sentence**:
  - Background: `rgba(129, 212, 250, 0.65)` - Darker blue
  - Border: `2px solid rgba(33, 150, 243, 1)` - Solid blue border
  - Box-shadow: `0 0 0 2px rgba(33, 150, 243, 0.3)` - Blue glow

## Common Issues and Solutions

### Issue: Hover color not visible

**Cause**: Translation popup appearing too quickly
**Solution**: Popup delay increased to 500ms - wait and observe

### Issue: Can't see selected state

**Cause**: Mouse leaving too quickly
**Solution**: Keep mouse over the highlight after clicking

### Issue: Delete key not working

**Cause**: Highlight not selected
**Solution**: Click the highlight first, then press Delete

### Issue: Both highlights selected (nested)

**Cause**: Event propagation issue
**Solution**: Should not happen - `e.stopPropagation()` prevents this

### Issue: Selection persists after mode switch

**Cause**: Selection not cleared
**Solution**: Should not happen - `setHighlightMode()` clears selection

## Browser Console Testing

Open browser DevTools console and check for:

```javascript
// Check if selection state is working
// After clicking a highlight, you should see it has the 'selected' class
document.querySelector('.highlight-vocabulary.selected');
document.querySelector('.highlight-sentence.selected');

// Check if keyboard listener is attached
// Should see 'keydown' listener on document
getEventListeners(document);
```

## Performance Testing

1. Create 20+ highlights in an article
2. Rapidly hover over multiple highlights
3. ✅ **Expected**: No lag, smooth transitions
4. Click and delete multiple highlights
5. ✅ **Expected**: Instant response, no delays

## Accessibility Testing

1. Use keyboard only (Tab, Enter, Delete, Escape)
2. ✅ **Expected**: Can navigate and delete highlights
3. Use screen reader
4. ✅ **Expected**: Announces highlight state (future enhancement)

## Regression Testing

Ensure existing features still work:

- [ ] Creating vocabulary highlights (select text)
- [ ] Creating sentence highlights (double-click)
- [ ] Translation popup shows correct translation
- [ ] Context menu (right-click) works
- [ ] Vocabulary cards update when highlights added/removed
- [ ] Sentence cards update when highlights added/removed
- [ ] Storage persists highlights correctly
- [ ] Mode switching works (vocabulary/sentence/none)

## Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________
Version: ___________

Test 1: Hover Color Change
- Vocabulary: [ ] Pass [ ] Fail
- Sentence: [ ] Pass [ ] Fail

Test 2: Click to Select
- Vocabulary: [ ] Pass [ ] Fail
- Sentence: [ ] Pass [ ] Fail
- Multiple: [ ] Pass [ ] Fail

Test 3: Mouse Leave Deselection
- Basic: [ ] Pass [ ] Fail
- With Popup: [ ] Pass [ ] Fail

Test 4: Delete with Keyboard
- Delete Key: [ ] Pass [ ] Fail
- Backspace Key: [ ] Pass [ ] Fail
- Escape Key: [ ] Pass [ ] Fail
- No Selection: [ ] Pass [ ] Fail

Test 5: Overlapping Highlights
- Click Nested: [ ] Pass [ ] Fail
- Hover Nested: [ ] Pass [ ] Fail

Test 6: Mode Switching
- Clear Selection: [ ] Pass [ ] Fail

Test 7: Right-Click Menu
- Still Works: [ ] Pass [ ] Fail

Notes:
_________________________________
_________________________________
_________________________________
```

## Automated Testing (Future)

Consider adding unit tests for:

- `selectHighlight()` function
- `deselectHighlight()` function
- `deleteSelectedHighlight()` function
- `handleKeyPress()` function
- Event listener attachment/removal

## Conclusion

This feature should provide a smooth, intuitive experience for managing highlights. The key interactions are:

1. **Hover** → See color change + translation
2. **Click** → Select highlight
3. **Delete** → Remove highlight
4. **Mouse away** → Deselect

All tests should pass before considering the feature complete.
