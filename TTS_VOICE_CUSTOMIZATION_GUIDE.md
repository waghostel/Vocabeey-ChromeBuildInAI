# TTS Voice Customization Guide

## Problem Solved ✅

The pronunciation now uses the **same voice** for both:

- Clicking on highlighted words in the article
- Clicking pronunciation buttons on vocabulary cards

Both now pass the article's language to the TTS service, ensuring consistent voice selection.

---

## How Voice Selection Works

The TTS service automatically selects the best voice based on:

1. **Language Match**: Finds voices matching the article's language
2. **Priority Order**:
   - Exact language match (e.g., `ja-JP` for Japanese)
   - Language prefix match (e.g., `ja` matches `ja-JP`)
   - Default system voice as fallback

---

## Current Implementation

### Vocabulary Cards & Highlighted Words

```typescript
// Both now use the same code:
const language = state.currentArticle?.originalLanguage;
await speak(text, { language });
```

This ensures:

- Japanese articles use Japanese voices
- French articles use French voices
- English articles use English voices
- Etc.

---

## Customization Options

### Option 1: Change Voice Parameters (Rate, Pitch, Volume)

You can modify the TTS options in both files:

**In `src/ui/learning-interface.ts` (line ~730):**

```typescript
// Speak the text
await speak(text, {
  language,
  rate: 0.9, // Slower (0.1-10, default 1)
  pitch: 1.0, // Normal pitch (0-2, default 1)
  volume: 1.0, // Full volume (0-1, default 1)
});
```

**In `src/ui/highlight-manager.ts` (line ~590):**

```typescript
await speak(text, {
  language,
  rate: 0.9, // Match the same settings
  pitch: 1.0,
  volume: 1.0,
});
```

### Option 2: List Available Voices

Add a debug function to see what voices are available:

```typescript
import {
  getAvailableVoices,
  getVoicesForLanguage,
} from '../utils/tts-service.js';

// List all voices
const allVoices = await getAvailableVoices();
console.log('Available voices:', allVoices);

// List voices for specific language
const japaneseVoices = await getVoicesForLanguage('ja');
console.log('Japanese voices:', japaneseVoices);
```

### Option 3: Force Specific Voice

Modify `src/utils/tts-service.ts` to prefer specific voices:

```typescript
// In selectVoice method (around line 160)
private async selectVoice(language?: string): Promise<SpeechSynthesisVoice | null> {
  if (!this.isInitialized) {
    await this.initializeVoices();
  }

  if (this.voices.length === 0) return null;

  // Normalize language code
  const normalizedLang = language?.toLowerCase();

  // CUSTOM: Prefer specific voices by name
  if (normalizedLang === 'ja') {
    // Try to find preferred Japanese voice
    const preferredVoice = this.voices.find(v =>
      v.name.includes('Kyoko') || // macOS
      v.name.includes('Google 日本語') // Chrome
    );
    if (preferredVoice) return preferredVoice;
  }

  // Continue with existing logic...
  // (rest of the method)
}
```

---

## Testing Different Voices

### Step 1: Check Available Voices

Open browser console on the learning interface page and run:

```javascript
speechSynthesis.getVoices().forEach(voice => {
  console.log(
    `${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`
  );
});
```

### Step 2: Test Specific Voice

```javascript
const utterance = new SpeechSynthesisUtterance('こんにちは');
const voices = speechSynthesis.getVoices();
utterance.voice = voices.find(v => v.name.includes('Kyoko'));
speechSynthesis.speak(utterance);
```

---

## Common Voice Names by Platform

### Windows

- **Japanese**: Microsoft Haruka, Microsoft Ichiro
- **French**: Microsoft Hortense, Microsoft Paul
- **Spanish**: Microsoft Helena, Microsoft Pablo
- **German**: Microsoft Hedda, Microsoft Stefan

### macOS

- **Japanese**: Kyoko, Otoya
- **French**: Amelie, Thomas
- **Spanish**: Monica, Jorge
- **German**: Anna, Yannick

### Chrome (Google Voices)

- **Japanese**: Google 日本語
- **French**: Google français
- **Spanish**: Google español
- **German**: Google Deutsch

---

## Recommended Settings by Use Case

### For Language Learning (Slower, Clear)

```typescript
await speak(text, {
  language,
  rate: 0.8, // 20% slower for clarity
  pitch: 1.0, // Normal pitch
  volume: 1.0,
});
```

### For Native Speed Practice

```typescript
await speak(text, {
  language,
  rate: 1.0, // Normal speed
  pitch: 1.0,
  volume: 1.0,
});
```

### For Quick Review

```typescript
await speak(text, {
  language,
  rate: 1.2, // 20% faster
  pitch: 1.0,
  volume: 1.0,
});
```

---

## Future Enhancement Ideas

### 1. User Settings UI

Add voice customization to the settings page:

```typescript
interface TTSSettings {
  rate: number;
  pitch: number;
  volume: number;
  preferredVoices: Record<string, string>; // language -> voice name
}
```

### 2. Per-Language Settings

Allow different settings for different languages:

```typescript
const settings = {
  ja: { rate: 0.8, pitch: 1.0 }, // Slower for Japanese
  en: { rate: 1.0, pitch: 1.0 }, // Normal for English
  fr: { rate: 0.9, pitch: 1.0 }, // Slightly slower for French
};
```

### 3. Voice Preview

Add a "Test Voice" button in settings to preview different voices.

---

## Troubleshooting

### Issue: Voice sounds robotic

**Solution**: Try different voices or adjust pitch:

```typescript
await speak(text, { language, pitch: 1.1 });
```

### Issue: Voice is too fast/slow

**Solution**: Adjust rate:

```typescript
await speak(text, { language, rate: 0.85 });
```

### Issue: Wrong language voice

**Solution**: Check that `article.originalLanguage` is correctly detected. Add logging:

```typescript
console.log('Article language:', state.currentArticle?.originalLanguage);
```

### Issue: No voice available for language

**Solution**: Install language packs in your OS or use Chrome's built-in voices.

---

## Quick Fix Applied

**Files Modified:**

- `src/ui/highlight-manager.ts` - Added language parameter to TTS calls

**Result:**

- ✅ Highlighted words now use the same voice as vocabulary cards
- ✅ Both respect the article's language
- ✅ Consistent pronunciation experience

**To Apply:**

1. Reload the extension in Chrome
2. Test by clicking on highlighted words
3. Compare with vocabulary card pronunciation
4. Both should now sound identical!
