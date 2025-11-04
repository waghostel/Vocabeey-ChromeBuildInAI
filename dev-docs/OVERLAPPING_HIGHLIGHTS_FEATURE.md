# Overlapping Highlights Feature

## Overview

Implemented support for overlapping vocabulary and sentence highlights with intelligent mode-aware behavior.

## Key Features

### 1. Overlapping Highlight Support

- **Vocabulary within Sentence**: Users can now select and highlight vocabulary words within already-highlighted sentences
- **Sentence over Vocabulary**: Users can highlight sentences that contain previously highlighted vocabulary
- **Visual Distinction**: Nested highlights use subtle outlines to show both highlight types simultaneously

### 2. Mode-Aware Click Behavior

- **Vocabulary Mode**: Clicking on existing highlights does NOT trigger pronunciation (allows text selection)
- **Sentence Mode**: Clicking on existing highlights does NOT trigger pronunciation (allows text selection)
- **Other Modes**: Clicking highlights triggers pronunciation as expected

### 3. Smart Selection Detection

- Removed blocking logic that prevented selection within existing highlights
- Users can freely select text regardless of existing highlights
- Double-click sentence selection works even on highlighted text

## Technical Implementation

### Modified Files

#### `src/ui/highlight-manager.ts`

1. **Removed Selection Blocking**
   - Eliminated checks that prevented highlighting within existing highlights
   - Both `handleTextSelection()` and `handleDoubleClick()` now allow overlapping

2. **Enhanced `createHighlight()` Function**
   - Uses `extractContents()` to preserve existing highlight elements
   - Wraps existing highlights within new highlight spans
   - Maintains nested DOM structure for overlapping highlights

3. **Mode-Aware Click Handlers**
   - Vocabulary highlights: Don't pronounce in vocabulary mode
   - Sentence highlights: Don't pronounce in sentence mode
   - Added `stopPropagation()` to prevent event bubbling

#### `src/ui/learning-interface.css`

Added comprehensive styling for overlapping highlights:

1. **Base Highlight Styles**
   - Vocabulary: Yellow background with amber border
   - Sentence: Light blue background with blue border

2. **Nested Highlight Styles**
   - Vocabulary inside sentence: Enhanced yellow with blue outline
   - Sentence inside vocabulary: Enhanced blue with yellow outline

3. **Dark Mode Support**
   - Adjusted opacity and colors for dark theme
   - Maintained visual distinction in both themes

## User Experience

### Vocabulary Mode

1. Click on any word (even in highlighted sentences) to select it
2. Selected vocabulary is highlighted in yellow
3. Hover shows translation popup
4. Click does NOT trigger pronunciation (allows selection)

### Sentence Mode

1. Select text or double-click any word to highlight the sentence
2. Selected sentence is highlighted in blue
3. Can select sentences containing vocabulary highlights
4. Click does NOT trigger pronunciation (allows selection)

### Visual Feedback

- Overlapping highlights show both colors with subtle outlines
- Hover effects work independently for each highlight type
- Clear visual hierarchy: vocabulary takes precedence when nested

## Benefits

1. **Flexibility**: Users can build their vocabulary collection incrementally
2. **Context Preservation**: Sentence context remains visible even with vocabulary highlights
3. **Natural Workflow**: No need to decide between vocabulary or sentence first
4. **Visual Clarity**: Clear indication of both highlight types when overlapping

## CSS Classes

```css
.highlight-vocabulary              /* Base vocabulary highlight */
.highlight-sentence                /* Base sentence highlight */
.highlight-sentence .highlight-vocabulary  /* Vocab inside sentence */
.highlight-vocabulary .highlight-sentence  /* Sentence inside vocab */
```

## Future Enhancements

Potential improvements:

- Add visual indicator showing number of overlapping highlights
- Context menu option to "unwrap" nested highlights
- Keyboard shortcuts for quick mode switching
- Bulk operations on overlapping highlights
