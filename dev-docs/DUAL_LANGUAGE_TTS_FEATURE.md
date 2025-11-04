# Dual Language TTS Feature

## Overview

Added support for pronouncing both the original language and translated language in vocabulary and sentence cards.

## Changes Made

### 1. Vocabulary Cards (`src/ui/learning-interface.ts`)

- Added a second speaker icon next to the translation text
- Original language speaker icon remains in the card header
- Translation speaker icon appears inline with the translation text

### 2. Sentence Cards (`src/ui/learning-interface.ts`)

- Added a second speaker icon for the translation
- Original language speaker icon remains in the card header
- Translation speaker icon appears inline with the translation text in the card details

### 3. Sentence Learning Mode (`src/ui/learning-interface.ts`)

- Updated to show two buttons: "Pronounce Original" and "Pronounce Translation"
- Each button speaks in the appropriate language

### 4. TTS Functionality (`src/ui/learning-interface.ts`)

- Updated `handlePronounceClick()` to accept an optional `language` parameter
- Automatically uses the correct language for each speaker button:
  - Original text uses `state.currentArticle?.originalLanguage`
  - Translation text uses `state.targetLanguage`

### 5. Styling (`src/ui/learning-interface.css`)

- Updated `.card-translation` to use flexbox layout for proper alignment
- Added `.pronounce-btn-translation` styling with hover and speaking states
- Reused existing pulse animation for visual feedback

## User Experience

### Vocabulary Cards

```
┌─────────────────────────────────────┐
│ maintained              🔊          │  ← Original language
├─────────────────────────────────────┤
│ mantenuto               🔊          │  ← Translation language
└─────────────────────────────────────┘
```

### Sentence Cards

```
┌─────────────────────────────────────┐
│ The system is maintained...  🔊     │  ← Original language
├─────────────────────────────────────┤
│ Il sistema è mantenuto... 🔊        │  ← Translation language
└─────────────────────────────────────┘
```

### Sentence Learning Mode

```
┌─────────────────────────────────────┐
│ The system is maintained regularly. │
│ Il sistema è mantenuto regolarmente.│
├─────────────────────────────────────┤
│ [🔊 Pronounce Original]             │
│ [🔊 Pronounce Translation]          │
└─────────────────────────────────────┘
```

## Technical Details

- Both speaker buttons use the same TTS service
- Language is automatically selected based on button context
- Visual feedback (pulse animation) shows which text is being spoken
- Clicking a speaker button while another is speaking will stop the current speech
- All existing TTS features (stop, pause, resume) continue to work

## Testing

Build completed successfully with no errors:

- TypeScript compilation: ✓
- Asset copying: ✓
- Import fixing: ✓

## Files Modified

1. `src/ui/learning-interface.ts` - Added dual language TTS support
2. `src/ui/learning-interface.css` - Added styling for translation speaker button

## Update: Vocabulary Learning Mode (A+B Mode)

### New Interactive Click Behavior

In the Vocabulary Learning Mode, users can now click directly on text to pronounce it:

**Behavior:**

- Click on the **top text** (original word) → Pronounces in original language
- Click on the **bottom text** (translation) → Pronounces in target language
- No speaker icons needed - the text itself is clickable

**Visual Feedback:**

- Hover effect: Text gets a subtle background and scales slightly
- Speaking state: Text highlights with primary color and pulses
- Cursor changes to pointer on hover
- Tooltips show "Click to pronounce" hints

**Example:**

```
┌─────────────────────────────────────┐
│                                     │
│         maintained                  │  ← Click here for English
│                                     │
│         mantenuto                   │  ← Click here for Italian
│                                     │
└─────────────────────────────────────┘
```

### Technical Implementation

**Event Handling:**

- Separate click listeners for word and translation elements
- `stopPropagation()` prevents event bubbling
- Language automatically selected based on clicked element
- Fallback: clicking card background pronounces original word

**CSS Enhancements:**

- `.clickable-text` class for interactive text elements
- Smooth hover transitions with background and scale effects
- Active state feedback on click
- Speaking animation reuses existing pulse keyframes

### Code Changes

**Modified Functions:**

1. `renderVocabularyLearningMode()` - Added separate click handlers for word and translation
2. `createVocabularyLearningCardHTML()` - Added `clickable-text` class and tooltips

**CSS Additions:**

- `.clickable-text` - Base clickable text styling
- `.clickable-text:hover` - Hover state with background and scale
- `.clickable-text:active` - Click feedback
- `.clickable-text.speaking` - Speaking state with pulse animation
