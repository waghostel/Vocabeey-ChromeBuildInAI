# Chrome Translation & Language Detection API Analysis

**Source**: [GoogleChromeLabs/web-ai-demos](https://github.com/GoogleChromeLabs/web-ai-demos/tree/main/translation-language-detection-api-playground)

## Overview

This document analyzes the implementation of Chrome's built-in Translation and Language Detection APIs from the Google Chrome Labs demo project. These APIs provide on-device AI capabilities for language detection and translation without requiring external API calls.

## API Architecture

### 1. Language Detector API

**Namespace**: `self.LanguageDetector`

**Initialization**:

```javascript
const detector = await LanguageDetector.create();
```

**Detection Method**:

```javascript
const results = await detector.detect(text);
// Returns array: [{ detectedLanguage: 'en', confidence: 0.95 }]
```

**Key Features**:

- Returns array of detection results (ordered by confidence)
- Each result contains:
  - `detectedLanguage`: BCP 47 language tag (e.g., 'en', 'fr', 'ja')
  - `confidence`: Float between 0-1 indicating detection certainty

### 2. Translator API

**Namespace**: `self.Translator`

**Availability Check**:

```javascript
const availability = await Translator.availability({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
});
// Returns: 'available', 'unavailable', or 'after-download'
```

**Initialization**:

```javascript
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
});
```

**Translation Method**:

```javascript
const translatedText = await translator.translate(inputText);
```

## Implementation Flow

### Step 1: Feature Detection

```javascript
if (!('LanguageDetector' in self)) {
  // API not supported - show error message
  return;
}
```

**Purpose**: Check browser support before attempting to use APIs

### Step 2: Language Detection (Real-time)

```javascript
input.addEventListener('input', async () => {
  if (!input.value.trim()) return;

  const { detectedLanguage, confidence } = (
    await detector.detect(input.value.trim())
  )[0];

  // Display: "95.0% sure that this is English"
  detected.textContent = `${(confidence * 100).toFixed(1)}% sure...`;
});
```

**Key Points**:

- Triggered on every input change (real-time detection)
- Uses first result from detection array (highest confidence)
- Converts confidence to percentage for display
- Uses `Intl.DisplayNames` for human-readable language names

### Step 3: Language Name Formatting

```javascript
const languageTagToHumanReadable = (languageTag, targetLanguage) => {
  const displayNames = new Intl.DisplayNames([targetLanguage], {
    type: 'language',
  });
  return displayNames.of(languageTag);
};
```

**Purpose**: Convert BCP 47 tags ('en', 'fr') to readable names ('English', 'French')

### Step 4: Translation Process

```javascript
form.addEventListener('submit', async e => {
  e.preventDefault();

  // 1. Detect source language
  const sourceLanguage = (await detector.detect(input.value.trim()))[0]
    .detectedLanguage;

  // 2. Get target language from user selection
  const targetLanguage = language.value;

  // 3. Check availability
  const availability = await Translator.availability({
    sourceLanguage,
    targetLanguage,
  });

  if (availability === 'unavailable') {
    output.textContent = `${source} - ${target} pair not supported.`;
    return;
  }

  // 4. Create translator instance
  const translator = await Translator.create({
    sourceLanguage,
    targetLanguage,
  });

  // 5. Perform translation
  output.textContent = await translator.translate(input.value.trim());
});
```

## Key Design Patterns

### 1. Progressive Enhancement

```javascript
if ('Translator' in self) {
  // Show translation UI elements
  document
    .querySelectorAll('[hidden]:not(.not-supported-message)')
    .forEach(el => el.removeAttribute('hidden'));
}
```

**Benefit**: Language detection works independently; translation is optional enhancement

### 2. Graceful Degradation

```javascript
const isUnavailable = availability === 'unavailable';
if (isUnavailable) {
  output.textContent = `${source} - ${target} pair not supported.`;
  return;
}
```

**Benefit**: Handles unsupported language pairs without crashing

### 3. Error Handling

```javascript
try {
  // Translation logic
} catch (err) {
  output.textContent = 'An error occurred. Please try again.';
  console.error(err.name, err.message);
}
```

## API Characteristics

### Language Detector

- **Async initialization**: `await LanguageDetector.create()`
- **Async detection**: `await detector.detect(text)`
- **Returns array**: Multiple results with confidence scores
- **No configuration**: Works out-of-the-box

### Translator

- **Availability check**: Required before creation
- **Language pair specific**: One translator per source-target pair
- **Async creation**: `await Translator.create({ sourceLanguage, targetLanguage })`
- **Async translation**: `await translator.translate(text)`
- **Reusable instance**: Can translate multiple texts with same pair

## Comparison with Your Project

### Similarities

1. Both use Chrome's built-in AI APIs
2. Both require feature detection
3. Both handle async operations
4. Both use on-device processing (privacy-first)

### Differences

| Aspect                 | Chrome Labs Demo      | Your Project                      |
| ---------------------- | --------------------- | --------------------------------- |
| **Language Detection** | Real-time on input    | On-demand for articles            |
| **Translation Scope**  | Full text translation | Vocabulary + sentence translation |
| **UI Pattern**         | Simple form           | Full-page learning interface      |
| **Storage**            | None (ephemeral)      | Local storage with versioning     |
| **Fallback**           | None                  | Gemini API fallback               |
| **Use Case**           | General translation   | Language learning                 |

## Integration Recommendations

### 1. Adopt Availability Checking

```javascript
// Add to your chrome-ai.ts
async checkTranslationAvailability(sourceLanguage, targetLanguage) {
  if (!('Translator' in self)) return 'unavailable';

  return await Translator.availability({
    sourceLanguage,
    targetLanguage
  });
}
```

### 2. Reuse Translator Instances

```javascript
// Cache translators by language pair
const translatorCache = new Map();

async function getTranslator(source, target) {
  const key = `${source}-${target}`;
  if (!translatorCache.has(key)) {
    translatorCache.set(
      key,
      await Translator.create({
        sourceLanguage: source,
        targetLanguage: target,
      })
    );
  }
  return translatorCache.get(key);
}
```

### 3. Confidence Threshold

```javascript
// Only use detection if confidence is high enough
const MIN_CONFIDENCE = 0.7;

const results = await detector.detect(text);
if (results[0].confidence >= MIN_CONFIDENCE) {
  return results[0].detectedLanguage;
} else {
  // Fallback to user selection or default
}
```

## Performance Considerations

1. **Initialization Cost**: Both APIs require async initialization - do this once and reuse
2. **Detection Speed**: Language detection is fast (suitable for real-time)
3. **Translation Speed**: Depends on text length and language pair
4. **Memory**: Each translator instance holds model data - cache wisely

## Browser Requirements

- **Chrome Version**: 140+ (same as your project)
- **Feature Flags**: Same as Prompt API requirements
- **Model Download**: Automatic (part of 22GB AI model package)
- **Offline Support**: Works offline after model download

## Error Scenarios

1. **API Not Available**: Browser doesn't support the API
2. **Language Pair Unavailable**: Specific translation pair not supported
3. **Model Not Downloaded**: User hasn't enabled AI features
4. **Network Error**: During model download (first use)
5. **Invalid Input**: Empty or malformed text

## Best Practices

1. **Always check availability** before creating translator
2. **Cache detector and translator instances** - don't recreate unnecessarily
3. **Trim input text** before processing
4. **Handle empty input** gracefully
5. **Use Intl.DisplayNames** for language name localization
6. **Provide user feedback** during async operations
7. **Implement error boundaries** for production use

## Conclusion

The Chrome Labs demo provides a clean, minimal implementation of the Translation and Language Detection APIs. Key takeaways:

- **Simple API surface**: Easy to integrate
- **Progressive enhancement**: Works in layers
- **Real-time capable**: Fast enough for live detection
- **Privacy-focused**: All processing on-device
- **Production-ready patterns**: Error handling and availability checks

Your language learning extension can leverage these same APIs with additional features like caching, fallback strategies, and learning-specific UI patterns.
