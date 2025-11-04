# Sentence Click-to-Pronounce Implementation

## Overview

Implemented click-to-pronounce functionality for the Sentence learning page to match the user experience of the Vocabulary learning page. Users can now click directly on sentence text to hear pronunciation instead of using separate buttons.

## Changes Made

### 1. TypeScript Changes (`src/ui/learning-interface.ts`)

#### Updated `createSentenceLearningCardHTML()` function:

- **Removed**: `.sentence-learning-actions` div with two pronounce buttons
- **Added**: `clickable-text` class to `.sentence-learning-content` (original sentence)
- **Added**: `clickable-text` class to `.sentence-learning-translation` (translated sentence)
- **Added**: `title` attributes for user guidance ("Click to pronounce")

**Before:**

```typescript
<div class="sentence-learning-actions">
  <button class="sentence-action-btn sentence-pronounce-btn">
    <span>🔊</span>
    Pronounce Original
  </button>
  <button class="sentence-action-btn sentence-pronounce-btn-translation">
    <span>🔊</span>
    Pronounce Translation
  </button>
</div>
```

**After:**

```typescript
<div class="sentence-learning-content clickable-text" title="Click to pronounce">
<div class="sentence-learning-translation clickable-text" title="Click to pronounce translation">
```

#### Updated `renderSentenceLearningMode()` function:

- **Removed**: Event listeners for `.sentence-pronounce-btn` and `.sentence-pronounce-btn-translation`
- **Added**: Click event listener on `.sentence-learning-content` to pronounce original sentence
- **Added**: Click event listener on `.sentence-learning-translation` to pronounce translation
- **Added**: Fallback click listener on card itself to pronounce original sentence
- **Maintained**: Use of existing `handlePronounceClick()` function with appropriate language parameters

### 2. CSS Changes (`src/ui/learning-interface.css`)

#### Updated `.sentence-learning-card` styles:

- **Added**: `cursor: pointer` to indicate interactivity
- **Added**: `transform: translateY(-2px)` on hover for visual feedback

#### Updated `.sentence-learning-content` styles:

- **Added**: `cursor: pointer` for clickable indication
- **Added**: `transition` for smooth animations
- **Added**: `padding: 0.5rem` and `border-radius: 6px` for better click target
- **Added**: Hover state with subtle background color
- **Added**: Active state with scale transform
- **Added**: Speaking state with primary color background and pulse animation

#### Updated `.sentence-learning-translation` styles:

- **Added**: Same interactive styles as content (cursor, padding, border-radius)
- **Added**: Hover state with subtle background color
- **Added**: Active state with scale transform
- **Added**: Speaking state with primary color background and pulse animation

#### Removed styles:

- `.sentence-learning-actions` (no longer needed)
- `.sentence-action-btn` (no longer needed)

## Features

### User Experience Improvements

1. **Direct Interaction**: Click directly on text to hear pronunciation
2. **Visual Feedback**: Hover effects show text is clickable
3. **Consistent UX**: Matches vocabulary learning page behavior
4. **Cleaner UI**: Removed button clutter from cards
5. **Space Efficient**: More compact card design

### Technical Features

1. **TTS Integration**: Reuses existing `handlePronounceClick()` function
2. **Language Support**: Correctly uses original language for content, target language for translation
3. **Speaking Indicator**: Visual feedback with pulse animation during speech
4. **Stop on Click**: Clicking while speaking stops current speech
5. **Event Propagation**: Proper `stopPropagation()` to prevent conflicts

## Testing Checklist

- [x] TypeScript compiles without errors
- [x] CSS has no syntax errors
- [x] Build process completes successfully
- [ ] Click on sentence content pronounces in original language
- [ ] Click on sentence translation pronounces in target language
- [ ] Hover effects display correctly
- [ ] Speaking animation shows during TTS playback
- [ ] Clicking while speaking stops current speech
- [ ] Works with different languages
- [ ] Dark mode styles work correctly
- [ ] Mobile/touch interactions work
- [ ] Keyboard navigation still functional

## Files Modified

1. `src/ui/learning-interface.ts` - Updated HTML generation and event listeners
2. `src/ui/learning-interface.css` - Updated styles for interactive text

## Consistency with Vocabulary Page

The implementation now matches the vocabulary learning page:

- ✅ Click on text to pronounce
- ✅ No separate buttons
- ✅ Hover effects indicate interactivity
- ✅ Speaking animation during playback
- ✅ Same visual feedback patterns
- ✅ Consistent user experience across learning modes

## Next Steps

1. Load the extension in Chrome and test the functionality
2. Verify TTS works with various languages
3. Test on different screen sizes
4. Verify accessibility features still work
5. Test with keyboard navigation
6. Verify dark mode appearance

## Notes

- The existing `clickable-text` CSS class was already defined and is now reused for sentence cards
- Dark mode styles are already in place and work automatically
- The implementation maintains backward compatibility with existing TTS infrastructure
- No breaking changes to other parts of the application
