# Language Selector Implementation

## Overview

A searchable dropdown language selector has been added to the learning interface, positioned in the top-right area of the article header, to the left of the memory indicator.

## Features

- **Searchable Dropdown**: Users can type to filter languages
- **26 Languages Supported**: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese (Simplified), Chinese (Traditional), Arabic, Hindi, Dutch, Polish, Turkish, Vietnamese, Thai, Swedish, Norwegian, Danish, Finnish, Czech, Hungarian, Romanian, Ukrainian
- **Persistent Selection**: Selected language is saved to Chrome storage
- **Visual Feedback**: Tooltip confirmation when language is changed

## User Interface

### Location

- Positioned in the article header controls section
- Left of the memory indicator
- Right of the article metadata

### Interaction

1. Click or focus on the input field to open the dropdown
2. Type to search/filter languages
3. Click on a language to select it
4. Selected language is saved automatically

## Implementation Details

### HTML Structure (`learning-interface.html`)

```html
<div class="language-selector-container">
  <label for="target-language-input">Translate to:</label>
  <div class="language-selector-wrapper">
    <input
      type="text"
      id="target-language-input"
      class="language-input"
      placeholder="Search language..."
      autocomplete="off"
    />
    <div class="language-dropdown">
      <div class="language-options"></div>
    </div>
  </div>
</div>
```

### Language Codes

The extension uses standard language codes:

- **Simplified Chinese**: `zh-CN`
- **Traditional Chinese**: `zh-TW`
- **Other languages**: ISO 639-1 codes (e.g., `en`, `es`, `fr`, `ja`, `ko`)

### CSS Styling (`learning-interface.css`)

- Clean, modern design matching the extension's style
- Dropdown appears below the input with smooth transitions
- Hover effects on language options
- Max height of 300px with scrolling for long lists
- Z-index of 1000 to appear above other content

### TypeScript Logic (`learning-interface.ts`)

#### State Management

```typescript
state: {
  targetLanguage: string; // Current selected language code
}
```

#### Key Functions

1. **initializeLanguageSelector()**: Loads saved language and sets up event listeners
2. **populateLanguageOptions()**: Renders all language options in the dropdown
3. **showLanguageDropdown()**: Opens the dropdown and filters options
4. **hideLanguageDropdown()**: Closes the dropdown
5. **filterLanguageOptions(search)**: Filters languages based on search input
6. **selectLanguage(code)**: Updates state, saves to storage, and shows confirmation

#### Storage

- Key: `targetLanguage`
- Value: Language code (e.g., 'en', 'es', 'fr')
- Storage type: `chrome.storage.local`

## Usage in Translation

The selected target language is stored in `state.targetLanguage` and can be accessed by:

1. **AI Processing**: Pass to translation APIs when processing vocabulary/sentences
2. **Highlight Manager**: Use when requesting translations for highlighted text
3. **Learning Cards**: Display translations in the selected language

### Translation Flow

1. **User highlights text** → Highlight Manager requests translation
2. **Highlight Manager** → Reads `targetLanguage` from storage
3. **Background Service Worker** → Receives translation request with target language
4. **AI Processing** → Translates to the specified target language
5. **Result** → Displayed in vocabulary/sentence cards

### Example Integration

```typescript
// In highlight-manager.ts
const { targetLanguage } = await chrome.storage.local.get('targetLanguage');
const response = await chrome.runtime.sendMessage({
  type: 'TRANSLATE_TEXT',
  payload: {
    text,
    context,
    type: 'vocabulary',
    targetLanguage: targetLanguage || 'en',
  },
});
```

## Re-translation Feature

When users change the target language, they're prompted to re-translate existing vocabulary:

### Features

- **Smart Prompt**: Only shows if vocabulary items exist
- **Batch Processing**: Re-translates all vocabulary items
- **Progress Indicator**: Shows loading state during re-translation
- **Error Handling**: Reports success/failure counts
- **Auto-save**: Updates storage with new translations
- **UI Update**: Refreshes all vocabulary displays

### User Experience

1. User selects new language
2. Confirmation dialog appears with two options:
   - "Re-translate" - Updates all existing vocabulary
   - "Not now" - Keeps existing translations
3. If re-translate is chosen:
   - Loading overlay shows progress
   - Each vocabulary item is re-translated
   - Cards update automatically
   - Success message displays

### Implementation Details

```typescript
async function retranslateAllVocabulary(): Promise<void> {
  // Re-translate each vocabulary item
  for (const vocab of state.vocabularyItems) {
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE_TEXT',
      payload: {
        text: vocab.word,
        context: vocab.context,
        type: 'vocabulary',
        targetLanguage: state.targetLanguage,
      },
    });
    vocab.translation = response.data.translation;
  }
  // Save and refresh UI
}
```

## Future Enhancements

Potential improvements:

- Add language flags/icons
- Show recently used languages at the top
- Add language detection for auto-selection
- Support custom language preferences per article
- Add keyboard navigation (arrow keys) in dropdown
- Batch re-translation with progress bar
- Option to re-translate sentences as well
- Language-specific TTS voice selection
