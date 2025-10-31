# Chinese Language Support

## Overview

The extension now supports both Simplified Chinese and Traditional Chinese as separate translation target languages, allowing users to choose their preferred Chinese variant.

## Language Codes

- **Simplified Chinese**: `zh-CN` (中文简体)
- **Traditional Chinese**: `zh-TW` (中文繁體)

## Implementation

### Language List Update

The LANGUAGES array in `src/ui/learning-interface.ts` now includes:

```typescript
const LANGUAGES = [
  // ... other languages
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  // ... other languages
];
```

### User Experience

Users can now:

1. Search for "Chinese" in the language selector
2. See both options:
   - Chinese (Simplified)
   - Chinese (Traditional)
3. Select their preferred variant
4. Get translations in the selected Chinese variant

## Translation Behavior

### Chrome Built-in AI Translation API

- Supports both `zh-CN` and `zh-TW` language codes
- Automatically handles character conversion
- Provides contextually appropriate translations

### Gemini API Fallback

- Also supports both Chinese variants
- Uses language codes to determine output format
- Maintains consistency with Chrome AI translations

## Use Cases

### Simplified Chinese (zh-CN)

- Used in Mainland China, Singapore, Malaysia
- Simplified character set (简体字)
- Example: 学习 (learning)

### Traditional Chinese (zh-TW)

- Used in Taiwan, Hong Kong, Macau
- Traditional character set (繁體字)
- Example: 學習 (learning)

## Technical Details

### Storage

```typescript
// User selects Simplified Chinese
{
  targetLanguage: 'zh-CN';
}

// User selects Traditional Chinese
{
  targetLanguage: 'zh-TW';
}
```

### Translation Request

```typescript
{
  type: 'TRANSLATE_TEXT',
  payload: {
    text: 'Hello',
    targetLanguage: 'zh-CN'  // or 'zh-TW'
  }
}
```

### Expected Results

**Simplified Chinese (zh-CN)**:

- "Hello" → "你好"
- "Learning" → "学习"
- "Vocabulary" → "词汇"

**Traditional Chinese (zh-TW)**:

- "Hello" → "你好"
- "Learning" → "學習"
- "Vocabulary" → "詞彙"

## Testing Recommendations

1. **Selection Test**:
   - Search for "Chinese" in language selector
   - Verify both variants appear
   - Select each variant and verify it saves correctly

2. **Translation Test**:
   - Select Simplified Chinese
   - Highlight vocabulary
   - Verify translation uses simplified characters
   - Switch to Traditional Chinese
   - Re-translate vocabulary
   - Verify translation uses traditional characters

3. **Search Test**:
   - Type "simplified" → Should show Chinese (Simplified)
   - Type "traditional" → Should show Chinese (Traditional)
   - Type "中文" → Should show both options (if search supports Unicode)

4. **Re-translation Test**:
   - Create vocabulary in Simplified Chinese
   - Switch to Traditional Chinese
   - Re-translate all vocabulary
   - Verify character conversion is correct

## Notes

- Both variants share the same base language but use different character sets
- The translation API automatically handles character conversion
- Users learning Chinese can now choose their preferred variant
- TTS (Text-to-Speech) will use appropriate pronunciation for each variant
- The extension respects the user's choice throughout the learning experience

## Future Enhancements

- Add language flags/icons for visual distinction
- Support for Cantonese (zh-HK) if needed
- Character conversion tool (Simplified ↔ Traditional)
- Pinyin/Zhuyin romanization support
- Regional vocabulary preferences
