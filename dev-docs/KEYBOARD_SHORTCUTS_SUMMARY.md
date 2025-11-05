# Keyboard Shortcuts Summary

## Implemented Highlight Mode Shortcuts

### New Number Key Shortcuts

- **1**: Switch to Vocabulary highlight mode
- **2**: Switch to Sentence highlight mode
- **3** or **0**: Switch to None highlight mode (disable highlighting)
- **Escape**: Switch to None highlight mode (alternative shortcut)

### Why These Keys?

- **No conflicts** with Chrome browser shortcuts (Ctrl+1, Ctrl+2 are reserved for tab switching)
- **Fast and ergonomic** - single key press, no modifiers needed
- **Intuitive numbering** - matches the visual order of buttons in the UI
- **Easy to remember** - 1 for first option, 2 for second, 0 to disable

## Complete Keyboard Shortcuts Reference

### Navigation

- **← (Left Arrow)** or **D**: Navigate to previous article part
- **→ (Right Arrow)** or **F**: Navigate to next article part

### Main Mode Switching (Tabs)

- **R**: Switch to Reading mode (📖)
- **V**: Switch to Vocabulary learning mode (📝)
- **S**: Switch to Sentences learning mode (💬)

### Highlight Mode Switching (Within Reading Mode)

- **1**: Vocabulary highlight mode
- **2**: Sentence highlight mode
- **3**, **0**, or **Escape**: None (disable highlighting)

## Implementation Details

### Files Modified

1. `src/ui/learning-interface.ts` - Added keyboard event handlers for keys 1, 2, 3, 0
2. `src/ui/learning-interface.html` - Added tooltips to buttons showing shortcuts
3. `docs/user-guide/README.md` - Updated documentation

### Technical Notes

- Shortcuts are ignored when typing in input fields or text areas
- All shortcuts call the centralized `switchHighlightMode()` function
- Visual feedback is provided via tooltip when mode changes
- Button active states update automatically

### User Experience

- Tooltips on buttons show the keyboard shortcuts
- Brief notification appears when switching modes
- Consistent behavior across all switching methods (click, keyboard, ESC)
