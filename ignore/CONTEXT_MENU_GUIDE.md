# Context Menu Feature Guide

## Overview

The context menu feature allows users to interact with text in different ways depending on the current highlight mode.

## Feature Modes

### 1. None Mode (NEW!)

**Purpose**: Read without accidental highlighting, add items intentionally

**How to use**:

1. Click the "🚫 None" button in the highlight mode selector
2. Select any text in the article
3. **Right-click** on the selected text
4. Context menu appears with options:
   - **Add as Vocabulary** - Creates a vocabulary highlight (1-3 words only)
   - **Add as Sentence** - Creates a sentence highlight (min 10 characters)
   - **Pronounce** - Speaks the selected text

**Keyboard shortcut**: Press `0`, `3`, or `Esc` to switch to None mode

### 2. Vocabulary Mode

**Purpose**: Automatically highlight vocabulary as you select

**How to use**:

1. Click the "📝 Vocabulary" button
2. Select 1-3 words
3. Vocabulary is automatically highlighted and translated
4. Right-click on existing vocabulary highlights for options:
   - **Remove** - Deletes the vocabulary item
   - **Pronounce** - Speaks the word

**Keyboard shortcut**: Press `1` to switch to Vocabulary mode

### 3. Sentence Mode

**Purpose**: Automatically highlight sentences as you select

**How to use**:

1. Click the "💬 Sentences" button
2. Select a sentence (or double-click to auto-select)
3. Sentence is automatically highlighted and translated
4. Right-click on existing sentence highlights for options:
   - **Remove** - Deletes the sentence item
   - **Pronounce** - Speaks the sentence

**Keyboard shortcut**: Press `2` to switch to Sentence mode

## Context Menu Behavior

### For New Selections (None Mode)

```
┌─────────────────────────┐
│ Add as Vocabulary       │
│ Add as Sentence         │
│ Pronounce               │
└─────────────────────────┘
```

### For Existing Highlights (All Modes)

```
┌─────────────────────────┐
│ Remove                  │
│ Pronounce               │
└─────────────────────────┘
```

## Smart Features

### Validation

- **Vocabulary**: Only accepts 1-3 words
- **Sentence**: Requires minimum 10 characters
- Shows helpful error messages if validation fails

### Smart Positioning

- Menu appears near cursor/selection
- Automatically adjusts if near viewport edges
- Never goes off-screen

### Overlapping Highlights

- You can highlight vocabulary within sentences
- Nested highlights are preserved
- Each highlight maintains its own context menu

## Tips & Tricks

1. **Use None mode for reading**: Switch to None mode when you just want to read without highlighting
2. **Quick vocabulary**: In None mode, select a word and choose "Add as Vocabulary" for intentional learning
3. **Pronounce before adding**: Use "Pronounce" to hear the text before deciding to add it
4. **Right-click to remove**: Made a mistake? Right-click and remove any highlight
5. **Keyboard shortcuts**: Use number keys (0-3) to quickly switch modes

## Workflow Examples

### Example 1: Careful Reading

1. Start in None mode (🚫 None)
2. Read the article without distractions
3. When you find an interesting word, select it
4. Choose "Add as Vocabulary" from context menu
5. Continue reading

### Example 2: Active Learning

1. Start in Vocabulary mode (📝 Vocabulary)
2. Select words as you read
3. They're automatically highlighted and translated
4. Switch to None mode when you want to just read
5. Switch back to Vocabulary mode to continue learning

### Example 3: Sentence Practice

1. Switch to Sentence mode (💬 Sentences)
2. Double-click on any word to auto-select the sentence
3. Sentence is highlighted and translated
4. Right-click to pronounce or remove

## Accessibility

- All context menu items are keyboard accessible
- Screen reader friendly
- High contrast support
- Touch-friendly on mobile devices

## Browser Compatibility

- ✅ Chrome/Edge (Chromium-based browsers)
- ✅ Desktop and mobile
- ✅ Touch and mouse input
- ✅ Keyboard navigation
