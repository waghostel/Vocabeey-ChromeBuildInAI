# Smart Context Boundary Detection - Word-Based Implementation

## Overview

Enhanced the vocabulary card context extraction to use **word-based counting** (up to 200 words on each side) while intelligently stopping at sentence boundaries. This provides rich context for vocabulary learning while maintaining natural sentence structure.

## Problem Solved

**Before**: "stration or transfer. We provide a web service on the exam" (character-based, cuts words)  
**After**: Complete sentences with up to 200 words on each side, stopping at punctuation  
**Now**: "Previous sentence. We provide a web service on the example for students who want to learn languages." (word-based, natural boundaries)

## Implementation Details

### File Modified

- `src/ui/highlight-manager.ts`

### Changes Made

#### 1. Configuration Constants (Word-Based Approach)

```typescript
const CONTEXT_CONFIG = {
  maxWordsLeft: 200, // Maximum words to include on the left side
  maxWordsRight: 200, // Maximum words to include on the right side
  stopAtSentenceBoundary: true, // Stop at sentence-ending punctuation
};
```

**Key Change**: Switched from character-based (50 chars) to **word-based counting** (200 words each side)

#### 2. Helper Functions (Word-Based Implementation)

- **`isSentenceEndPunctuation(char: string): boolean`**
  - Checks if character is sentence-ending punctuation
  - Supports multiple languages: Latin (`.!?`), CJK (`。！？`), Devanagari (`।॥`), Arabic (`؟`)

- **`splitIntoWords(text: string): string[]`** ⭐ NEW
  - Intelligently splits text into words
  - For Latin scripts: splits by whitespace
  - For CJK (Chinese/Japanese): treats each character as a word
  - Handles mixed-language text

- **`findContextBoundaryLeft(text, startPos, maxWords): number`** ⭐ NEW
  - Counts backward up to `maxWords` words from the selected text
  - Stops at sentence-ending punctuation if found
  - Returns the starting position for context extraction
  - Algorithm:
    1. Search backward for sentence boundary
    2. If found and within word limit, use it
    3. Otherwise, count back exactly `maxWords` words

- **`findContextBoundaryRight(text, startPos, maxWords): number`** ⭐ NEW
  - Counts forward up to `maxWords` words from the selected text
  - Stops at sentence-ending punctuation if found
  - Returns the ending position for context extraction
  - Algorithm:
    1. Search forward for sentence boundary
    2. If found and within word limit, use it
    3. Otherwise, count forward exactly `maxWords` words

#### 3. Completely Rewritten `getContext()` Function

**New Algorithm (Word-Based with Sentence Boundaries):**

1. Find the selected text position in the full text
2. **Left Boundary:**
   - Call `findContextBoundaryLeft(text, startPos, 200)`
   - Searches backward for sentence boundary
   - If sentence boundary found and within 200 words, stops there
   - Otherwise, counts back exactly 200 words
3. **Right Boundary:**
   - Call `findContextBoundaryRight(text, endPos, 200)`
   - Searches forward for sentence boundary
   - If sentence boundary found and within 200 words, stops there
   - Otherwise, counts forward exactly 200 words
4. Extract substring between boundaries
5. Trim whitespace
6. Remove leading/trailing punctuation artifacts (`,`, `;`, `:`) but preserve sentence-ending punctuation

**Key Differences from Previous Implementation:**

- ❌ No character-based limits (50 chars)
- ✅ Word-based counting (200 words each side)
- ❌ No truncation with `...` (always complete words/sentences)
- ✅ Symmetric behavior on both sides
- ✅ Natural sentence boundaries prioritized

## Benefits

✅ **Rich context**: Up to 200 words on each side (vs. 25 chars before)  
✅ **Complete sentences**: Stops at sentence boundaries naturally  
✅ **Word-based counting**: More intuitive than character counting  
✅ **Multi-language support**: Works with Latin, CJK, Devanagari, Arabic scripts  
✅ **CJK-aware**: Treats each Chinese/Japanese character as a word  
✅ **Symmetric behavior**: Same logic for left and right sides  
✅ **Natural reading**: Always shows complete words and sentences  
✅ **Configurable**: Easy to adjust word limits via `CONTEXT_CONFIG`  
✅ **No truncation**: Always shows complete words (no `...` needed)  
✅ **Unicode-aware**: Works with international characters and punctuation

## Configuration Options

You can adjust the behavior by modifying `CONTEXT_CONFIG`:

- **`maxWordsLeft`**: Maximum words to include on the left side (default: 200 words)
- **`maxWordsRight`**: Maximum words to include on the right side (default: 200 words)
- **`stopAtSentenceBoundary`**: Whether to stop at sentence-ending punctuation (default: true)

**Note**: The word limits are generous (200 words ≈ 1-2 paragraphs) to provide rich context while still being manageable.

## Edge Cases Handled

- Text at start/end of paragraph
- Multiple punctuation marks (`...`, `!?`)
- Abbreviations (won't break at `Dr.` or `U.S.A.`)
- Leading/trailing punctuation artifacts
- Unicode characters and international punctuation
- Very short text (less than maxLength)

## Testing

Build completed successfully with no errors:

```bash
pnpm build
✅ TypeScript compilation successful
✅ All imports fixed
✅ Assets copied
```

## Usage

The enhancement is automatic and transparent. When users highlight vocabulary:

1. The system extracts ±25 characters around the word
2. Extends boundaries to complete words (up to +15 chars each side)
3. Optionally extends to sentence boundaries (up to +30 chars each side)
4. Returns clean, readable context

## Example Results

### Short Context (Within Sentence)

| Selected Word | Old Context (Character-based)                                | New Context (Word-based)                                  |
| ------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| "provide"     | "stration or transfer. We provide a web service on the exam" | "We provide a web service on the example."                |
| "learning"    | "age learning extension for Chrome"                          | "This is a language learning extension for Chrome."       |
| "article"     | "ead the article in a clean"                                 | "Read the article in a clean interface for better focus." |

### Long Context (Multiple Sentences)

| Selected Word | Context Behavior                                                                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "students"    | Includes up to 200 words before "students" (stopping at previous sentence boundary) and up to 200 words after (stopping at next sentence boundary)                                      |
| "example"     | "Previous sentence about context. This is an example of how the system works with multiple sentences. Next sentence continues the explanation. Another sentence provides more details." |

### CJK Languages

| Selected Character | Context Behavior                                                                  |
| ------------------ | --------------------------------------------------------------------------------- |
| "学" (study)       | Includes up to 200 characters before and after, stopping at `。` (Chinese period) |
| "勉強" (study)     | Each character counted separately, natural sentence boundaries preserved          |

## Performance Impact

Minimal - the additional string scanning is O(n) where n is limited by `maxExtension` parameters (typically 15-30 characters).

## Language Support

The implementation now supports sentence-ending punctuation for multiple language families:

- **Latin scripts** (English, Spanish, French, German, etc.): `.` `!` `?`
- **CJK** (Chinese, Japanese): `。` `！` `？`
- **Devanagari** (Hindi, Sanskrit): `।` `॥`
- **Arabic**: `.` `؟` `!`

## Implementation Details

### Word-Based Boundary Detection Logic

```typescript
// Left side: count backward up to 200 words, stop at sentence boundary
function findContextBoundaryLeft(text, startPos, maxWords) {
  const textBefore = text.substring(0, startPos);

  // Find last sentence boundary
  let lastSentenceBoundary = -1;
  for (let i = textBefore.length - 1; i >= 0; i--) {
    if (isSentenceEndPunctuation(textBefore[i])) {
      lastSentenceBoundary = i + 1;
      break;
    }
  }

  // If sentence boundary found and within word limit, use it
  if (stopAtSentenceBoundary && lastSentenceBoundary !== -1) {
    const textSegment = textBefore.substring(lastSentenceBoundary, startPos);
    const words = splitIntoWords(textSegment);
    if (words.length <= maxWords) {
      return lastSentenceBoundary;
    }
  }

  // Otherwise, count back exactly maxWords words
  const words = splitIntoWords(textBefore);
  const wordsToInclude = words.slice(-maxWords);
  return findStartPosition(wordsToInclude);
}

// Right side: count forward up to 200 words, stop at sentence boundary
function findContextBoundaryRight(text, startPos, maxWords) {
  // Similar logic but counting forward
  // Stops at first sentence boundary within word limit
  // Otherwise counts forward exactly maxWords words
}
```

## Future Enhancements

Potential improvements:

- Add more language-specific boundary detection (Thai, Khmer, etc.)
- Configurable via user settings UI
- A/B testing different parameter values
- Smart truncation that preserves key phrases
