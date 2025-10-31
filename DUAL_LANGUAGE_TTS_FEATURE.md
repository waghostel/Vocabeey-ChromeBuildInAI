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
