# Context Menu Conversion Feature - User Guide

## Feature Overview

This feature allows you to convert highlighted vocabulary items to sentences and vice versa through a simple right-click context menu.

## How to Use

### Converting Vocabulary to Sentence

1. **Right-click** on any highlighted vocabulary word in the article
2. A context menu will appear with these options:
   - Remove
   - **Change to Sentence** ← Click this
   - Pronounce
3. The vocabulary item will be converted to a sentence item
4. You'll see it move from the "Vocabulary" section to the "Sentences" section

### Converting Sentence to Vocabulary

1. **Right-click** on any highlighted sentence in the article
2. A context menu will appear with these options:
   - Remove
   - **Change to Vocabulary** ← Click this
   - Pronounce
3. The sentence item will be converted to a vocabulary item
4. You'll see it move from the "Sentences" section to the "Vocabulary" section

## Context Menu Behavior

### When Right-Clicking on Vocabulary:

```
┌─────────────────────────┐
│ Remove                  │
│ Pronounce               │
│ Change to Sentence      │ ← New option
└─────────────────────────┘
```

### When Right-Clicking on Sentence:

```
┌─────────────────────────┐
│ Remove                  │
│ Pronounce               │
│ Change to Vocabulary    │ ← New option
└─────────────────────────┘
```

### When Right-Clicking on New Selection (None Mode):

```
┌─────────────────────────┐
│ Add as Vocabulary       │
│ Add as Sentence         │
│ Pronounce               │
└─────────────────────────┘
```

(Conversion options are hidden for new selections)

## What Gets Preserved During Conversion

### Vocabulary → Sentence:

- ✅ Text content (word becomes sentence content)
- ✅ Translation
- ✅ Article and part association
- ✅ Highlight position in article
- ❌ Example sentences (not applicable to sentences)
- ❌ Context (not applicable to sentences)
- ❌ Review count and difficulty (not applicable to sentences)

### Sentence → Vocabulary:

- ✅ Text content (sentence becomes vocabulary word)
- ✅ Translation
- ✅ Article and part association
- ✅ Highlight position in article
- ➕ Context is set to the sentence content
- ➕ Example sentences array is empty (can be added later)
- ➕ Default difficulty (5) and review count (0)

## Use Cases

### When to Convert Vocabulary to Sentence:

- You highlighted a single word but realize it's better learned as a complete phrase
- The word is part of an idiom or expression
- You want to practice the word in its full context

### When to Convert Sentence to Vocabulary:

- You highlighted a full sentence but only need to learn a specific word
- The sentence is too long and you want to focus on key terms
- You want to add the phrase to your vocabulary flashcards

## Visual Feedback

After conversion:

1. The highlight color/style changes in the article (vocabulary and sentence highlights have different styles)
2. The item disappears from its original card section
3. The item appears in the new card section
4. The change is saved automatically to storage

## Keyboard Shortcuts

Currently, conversion is only available through the context menu (right-click). There are no keyboard shortcuts for this action.

## Tips

- **Review before converting**: Make sure the conversion makes sense for your learning goals
- **Translations are preserved**: You won't need to wait for re-translation
- **Undo by converting back**: If you change your mind, just convert it back using the same method
- **Works with all languages**: The feature works regardless of the article's language

## Technical Notes

- Conversions are instant and don't require internet connection
- Each converted item gets a new unique ID
- The original item is completely removed from storage
- DOM highlights are updated in real-time
- All changes are persisted to Chrome's local storage

## Troubleshooting

**Q: The context menu doesn't show conversion options**

- A: Make sure you're right-clicking on an existing highlight (vocabulary or sentence), not on plain text

**Q: The item didn't move to the other section**

- A: Try refreshing the page or navigating to another article part and back

**Q: Can I convert multiple items at once?**

- A: No, currently you can only convert one item at a time

**Q: What happens to my review progress?**

- A: Review progress (for vocabulary items) is reset when converting to sentence, as sentences don't have review tracking

## Future Enhancements

Potential improvements for future versions:

- Bulk conversion (select multiple items)
- Keyboard shortcuts for conversion
- Confirmation dialog for conversions
- Undo/redo functionality
- Preserve review progress when converting back
