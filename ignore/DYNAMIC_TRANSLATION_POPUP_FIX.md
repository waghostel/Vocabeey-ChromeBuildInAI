# Dynamic Translation Popup Fix

## Problem

When users switched the target language (e.g., from English to Spanish), the translation cards updated correctly, but the hover popups on highlighted text still showed the old translation. This was because:

1. Translations were captured in closures when highlights were created
2. The translation value never updated when the target language changed
3. Hover event listeners used the static translation value from creation time

## Solution Implemented

Implemented **Option 1: Re-translate on hover (Dynamic, Always Fresh)**

This approach dynamically fetches the translation for the current target language when the user hovers over a highlight, ensuring the popup always shows the correct translation.

## Changes Made

### 1. Updated Type Definitions (`src/types/index.ts`)

Added `translations` field to store multiple language translations:

```typescript
export interface VocabularyItem {
  // ... existing fields
  translation: string; // Primary translation (backward compatibility)
  translations?: Record<string, string>; // Multi-language cache { 'en': 'hello', 'es': 'hola' }
  // ... rest of fields
}

export interface SentenceItem {
  // ... existing fields
  translation: string; // Primary translation (backward compatibility)
  translations?: Record<string, string>; // Multi-language cache { 'en': 'hello', 'es': 'hola' }
  // ... rest of fields
}
```

### 2. Added Dynamic Translation Retrieval (`src/ui/highlight-manager.ts`)

Created new function `getTranslationForHighlight()`:

```typescript
async function getTranslationForHighlight(
  highlightId: string,
  type: 'vocabulary' | 'sentence'
): Promise<string>;
```

This function:

- Gets the current target language from storage
- Fetches the vocabulary/sentence item from storage
- Checks if translation exists for the target language in the cache
- If cached, returns it immediately
- If not cached, requests new translation, caches it, and returns it

### 3. Updated Vocabulary Highlight Creation

Modified `handleVocabularyHighlight()` to:

- Initialize the `translations` cache with the first translation
- Use dynamic translation lookup on hover instead of static closure

**Before:**

```typescript
highlightData.highlightElement.addEventListener('mouseenter', e => {
  hoverTimeout = window.setTimeout(() => {
    showTranslationPopup(e.target as HTMLElement, translation); // Static!
  }, 50);
});
```

**After:**

```typescript
highlightData.highlightElement.addEventListener('mouseenter', e => {
  hoverTimeout = window.setTimeout(() => {
    void getTranslationForHighlight(vocabItem.id, 'vocabulary').then(
      currentTranslation => {
        showTranslationPopup(e.target as HTMLElement, currentTranslation); // Dynamic!
      }
    );
  }, 50);
});
```

### 4. Updated Sentence Highlight Creation

Applied the same changes to `handleSentenceHighlight()` for consistency.

## Benefits

1. **Always Current**: Hover popups always show translation in the current target language
2. **Cached Performance**: Translations are cached per language, so switching back is instant
3. **Backward Compatible**: Maintains the `translation` field for existing code
4. **No Breaking Changes**: Existing highlights continue to work
5. **Automatic Updates**: No need to manually refresh or re-create highlights

## User Experience

### Before Fix

1. User highlights "hello" → sees "hola" (Spanish)
2. User switches to French
3. Cards update to show "bonjour" ✓
4. Hover popup still shows "hola" ✗

### After Fix

1. User highlights "hello" → sees "hola" (Spanish)
2. User switches to French
3. Cards update to show "bonjour" ✓
4. Hover popup shows "bonjour" ✓
5. User switches back to Spanish
6. Hover popup shows "hola" instantly (cached) ✓

## Technical Details

### Translation Cache Structure

```typescript
{
  id: "vocab_123",
  word: "hello",
  translation: "hola", // Primary (current language)
  translations: {
    "en": "hello",
    "es": "hola",
    "fr": "bonjour",
    "de": "hallo"
  }
}
```

### Performance Considerations

- **First hover**: Slight delay while fetching translation (~50-200ms)
- **Subsequent hovers**: Instant (cached)
- **Language switch**: First hover fetches new translation, then cached
- **Storage impact**: Minimal (~50-100 bytes per language per item)

### Edge Cases Handled

1. **Missing translation**: Returns `[Item not found]` gracefully
2. **Translation API failure**: Returns error message with retry option
3. **Backward compatibility**: Works with items that don't have `translations` field
4. **Multiple languages**: Supports unlimited target languages

## Testing Checklist

- [x] Build succeeds without errors
- [x] Type checking passes
- [ ] Create new highlight → hover shows correct translation
- [ ] Switch target language → hover shows new translation
- [ ] Switch back → hover shows cached translation (fast)
- [ ] Reload page → highlights still work with current language
- [ ] Multiple highlights → all update correctly
- [ ] Cards and popups show same translation

## Future Enhancements

1. **Pre-cache common languages**: Pre-translate to popular languages on creation
2. **Translation history**: Track which languages have been used
3. **Bulk re-translate**: Option to re-translate all items to new language
4. **Export with translations**: Include all translations in export data

## Files Modified

1. `src/types/index.ts` - Added `translations` field to interfaces
2. `src/ui/highlight-manager.ts` - Added dynamic translation logic

## Migration Notes

- **No migration required**: The `translations` field is optional
- **Backward compatible**: Existing items work without the field
- **Automatic upgrade**: New translations are cached as users hover
- **No data loss**: Primary `translation` field is maintained

## Related Issues

- Fixes: Translation popup shows old language after switching target language
- Related to: Language selector implementation
- Depends on: Translation API and storage system
