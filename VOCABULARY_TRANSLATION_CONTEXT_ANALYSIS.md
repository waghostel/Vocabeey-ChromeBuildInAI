# Vocabulary Translation Context Analysis Report

**Date:** November 3, 2025  
**Project:** Language Learning Chrome Extension  
**Analysis Focus:** How vocabulary words are translated and whether sentence context is considered

---

## Executive Summary

**Finding:** Vocabulary translations currently do NOT consider the word's meaning within its sentence context. Words are translated generically, which can lead to incorrect or suboptimal translations for polysemous words (words with multiple meanings).

---

## Current Implementation Analysis

### 1. Translation Flow

The vocabulary translation process follows this path:

```
User clicks word → Extract word → Check cache → Translate word → Display translation
```

**Key Components:**

- `ChromeTranslator.batchTranslate()` - Handles multiple word translations
- `ChromeTranslator.translateText()` - Single word translation with retry logic
- Chrome's built-in Translator API - Underlying translation engine

### 2. How Batch Translation Works

Located in: `src/utils/chrome-ai.ts` (lines ~1000-1100)

```typescript
async batchTranslate(
  requests: TranslationRequest[],
  sourceLanguage: string,
  targetLanguage: string
): Promise<TranslationResult[]>
```

**Process:**

1. Checks cache for each word individually
2. Combines uncached words with markers: `[0] word1`, `[1] word2`, etc.
3. Sends combined text to Translator API
4. Splits the translated result back into individual words
5. Caches each translation separately

**Context Parameter:**

- The `TranslationRequest` interface includes an optional `context` field
- When present, context is prepended: `[0] context: word`
- However, this doesn't guarantee context-aware translation

### 3. Cache Mechanism

Located in: `src/utils/chrome-ai.ts` (lines ~1115-1135)

```typescript
private getCacheKey(text: string, source: string, target: string): string {
  return `${source}:${target}:${text.substring(0, 100)}`;
}
```

**Cache Key Structure:** `sourceLanguage:targetLanguage:wordText`

**Implication:** The same word always gets the same translation regardless of context, because the cache key doesn't include sentence context.

### 4. Translation API Call

Located in: `src/utils/chrome-ai.ts` (lines ~850-920)

```typescript
private async translateTextOnce(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string>
```

**Process:**

- Uses Chrome's global `Translator` API
- Calls `translator.translate(text)` with just the word
- No sentence context is passed to the underlying API

---

## Problem: Polysemous Words

### What Are Polysemous Words?

Words with multiple meanings depending on context. Examples:

| Word       | Context 1            | Meaning 1             | Context 2        | Meaning 2            |
| ---------- | -------------------- | --------------------- | ---------------- | -------------------- |
| **bank**   | "I went to the bank" | Financial institution | "River bank"     | Edge of river        |
| **light**  | "Turn on the light"  | Illumination          | "Light weight"   | Not heavy            |
| **run**    | "I run every day"    | Physical exercise     | "Run a business" | Manage/operate       |
| **bat**    | "Baseball bat"       | Sports equipment      | "A bat flew by"  | Flying mammal        |
| **spring** | "Spring season"      | Time of year          | "Water spring"   | Natural water source |

### Current Behavior

With the current implementation:

1. User clicks "bank" in "I deposited money at the bank"
2. System translates "bank" generically (likely as financial institution)
3. Same translation is cached and reused

If later the user clicks "bank" in "We sat by the river bank": 4. System retrieves cached translation (financial institution) 5. **Wrong translation is shown** because context wasn't considered

---

## Code Evidence

### Evidence 1: No Context in Translation Call

From `src/utils/chrome-ai.ts`:

```typescript
// Translate uncached items
const translator = await this.getTranslator(sourceLanguage, targetLanguage);

// Combine all texts with markers for splitting later
const combinedText = uncachedRequests
  .map((req, i) => `[${i}] ${req.context ? req.context + ': ' : ''}${req.text}`)
  .join('\n');

const combinedTranslation = await translator.translate(combinedText);
```

**Issue:** While context is included in the string, the Translator API treats this as a simple text translation, not as "translate this word considering this context."

### Evidence 2: Cache Ignores Context

From `src/utils/chrome-ai.ts`:

```typescript
const cacheKey = this.getCacheKey(req.text, sourceLanguage, targetLanguage);
const cached = this.translationCache.get(cacheKey);
```

**Issue:** Cache key is based only on the word itself, not the sentence it appears in.

### Evidence 3: Vocabulary Analysis Doesn't Feed Translation

From `src/utils/chrome-ai.ts` (lines ~1200-1300):

The `ChromeVocabularyAnalyzer` class uses the Prompt API to analyze words in context:

```typescript
private async analyzeWord(
  session: PromptSession,
  word: string,
  context: string
): Promise<VocabularyAnalysis>
```

**However:** This analysis is separate from translation. The vocabulary analyzer understands context, but that understanding isn't used when translating.

---

## Impact on User Experience

### For Language Learners

**Negative Impacts:**

1. **Incorrect Meanings:** Users learn wrong translations for context-specific words
2. **Confusion:** Translations don't match how the word is actually used in the sentence
3. **Reduced Learning Quality:** Missing the nuance of how words change meaning
4. **Trust Issues:** Users may lose confidence in the tool's accuracy

**Example Scenario:**

```
Article: "The company will run a new marketing campaign."
User clicks: "run"
Current translation: "correr" (Spanish for physical running)
Correct translation: "ejecutar/llevar a cabo" (to execute/carry out)
```

---

## Comparison: What Works Well

### Vocabulary Analysis DOES Use Context

The `ChromeVocabularyAnalyzer` demonstrates proper context usage:

```typescript
const prompt = `Analyze the word "${word}" in this context:
"${context.substring(0, 500)}"

Provide analysis in JSON format.`;
```

This shows the system CAN use context effectively - it's just not applied to translation.

---

## Recommendations

### Option 1: Sentence-Based Translation (Recommended)

**Approach:**

1. Pass the full sentence to the Translator API
2. Translate the entire sentence
3. Extract the translated word from the translated sentence
4. Use word alignment or position matching

**Pros:**

- Most accurate context-aware translation
- Leverages full power of translation models
- Natural language understanding

**Cons:**

- More complex implementation
- Slightly slower (translating full sentences)
- Need word alignment logic

### Option 2: Prompt-Based Translation

**Approach:**

1. Use the Prompt API (like vocabulary analyzer does)
2. Ask: "Translate the word '{word}' as used in this sentence: '{sentence}'"
3. Parse the response

**Pros:**

- Explicit context consideration
- Can request specific translation format
- Flexible and controllable

**Cons:**

- Depends on Prompt API availability
- May be slower than direct translation
- Requires response parsing

### Option 3: Hybrid Approach

**Approach:**

1. Use sentence-based translation for first occurrence
2. Cache with context fingerprint (sentence hash)
3. Reuse if same word appears in similar context
4. Fall back to generic translation if context very different

**Pros:**

- Balance between accuracy and performance
- Smart caching reduces API calls
- Best of both worlds

**Cons:**

- Most complex to implement
- Need context similarity detection
- Larger cache size

---

## Technical Implementation Considerations

### Cache Key Modification

Current:

```typescript
`${source}:${target}:${text.substring(0, 100)}`;
```

Proposed:

```typescript
`${source}:${target}:${text}:${contextHash}`;
```

Where `contextHash` is a hash of the surrounding sentence or paragraph.

### API Call Modification

Current:

```typescript
await translator.translate(word);
```

Proposed:

```typescript
const sentenceTranslation = await translator.translate(fullSentence);
const wordTranslation = extractWordFromTranslation(
  sentenceTranslation,
  wordPosition
);
```

---

## Conclusion

The current vocabulary translation system prioritizes speed and simplicity over accuracy. While this works for many common words, it fails for polysemous words where context determines meaning.

**Key Findings:**

- ❌ Context is NOT considered in translation
- ❌ Cache prevents context-aware translations
- ✅ Infrastructure exists (vocabulary analyzer shows context CAN be used)
- ✅ Relatively straightforward to fix

**Recommendation:** Implement sentence-based translation (Option 1) for vocabulary words to provide accurate, context-aware translations that enhance the language learning experience.

---

## Related Files

- `src/utils/chrome-ai.ts` - Main translation logic (lines 850-1150)
- `src/utils/ai-service-coordinator.ts` - Service orchestration
- `src/offscreen/ai-processor.ts` - Translation processing
- `src/types/index.ts` - Type definitions for translation interfaces

---

**Report prepared by:** AI Code Analysis  
**For:** Language Learning Chrome Extension Development Team
