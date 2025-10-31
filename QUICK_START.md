# Quick Start Guide - Chrome AI Translation Fix

## 🚀 Get Started in 5 Minutes

### Step 1: Reload Extension (30 seconds)

```bash
# Extension is already built, just reload it
```

1. Open Chrome
2. Navigate to `chrome://extensions`
3. Find "Language Learning Chrome Extension"
4. Click the reload button 🔄

### Step 2: Verify Chrome Flags (1 minute)

1. Navigate to `chrome://flags`
2. Search for "translation"
3. Enable "Translation API"
4. Search for "prompt api"
5. Enable "Prompt API for Gemini Nano"
6. Restart Chrome

### Step 3: Test Translation (2 minutes)

1. Navigate to any Spanish article (e.g., BBC Mundo, El País)
2. Click the extension icon
3. Wait for article processing
4. Click on any word
5. See translation appear! ✨

### Step 4: Check Console (1 minute)

1. Right-click on page → Inspect
2. Go to Console tab
3. Look for:
   ```
   ✅ Translation successful (Chrome AI via offscreen): [translation]
   ```
4. Should NOT see:
   ```
   ❌ Translation API not available
   ```

### Step 5: Celebrate! 🎉

If you see translations working, you're done! The fix is working correctly.

---

## 🔍 Quick Troubleshooting

### Problem: "Translation API not available"

**Solution:**

1. Check Chrome version (need 138+)
2. Enable Translation API flag
3. Restart Chrome
4. Reload extension

### Problem: Translations are slow

**Solution:**

- First translation downloads model (5-30s)
- Subsequent translations are fast (100-500ms)
- This is normal behavior

### Problem: No translation appears

**Solution:**

1. Check console for errors
2. Verify Chrome flags enabled
3. Check offscreen document console
4. See `TESTING_GUIDE.md` for details

---

## 📚 What Changed?

### Before

```typescript
// ❌ WRONG
if (window.ai?.translator) {
  const translator = await window.ai.translator.create({...});
}
```

### After

```typescript
// ✅ CORRECT
if (typeof Translator !== 'undefined') {
  const translator = await Translator.create({...});
}
```

**Key Change:** Translator is a global API, not under `window.ai`

---

## 📖 Documentation

- **Quick Reference:** `CHROME_AI_QUICK_REFERENCE.md`
- **Testing Guide:** `TESTING_GUIDE.md`
- **Architecture:** `CHROME_AI_ARCHITECTURE.md`
- **Full Summary:** `FIX_COMPLETE_SUMMARY.md`

---

## 🎯 Expected Behavior

### ✅ What Should Work

- Word translation
- Sentence translation
- Language detection
- Caching (instant second translation)
- Vocabulary highlighting
- Sentence mode

### ⏱️ Performance

- First translation: 5-30 seconds (model download)
- Subsequent: 100-500ms
- Cached: <10ms

### 🔄 Fallback

- Chrome AI fails → Gemini API (if configured)
- No Gemini key → Error message

---

## 🆘 Need Help?

1. **Check Console:** Look for error messages
2. **Read Testing Guide:** `TESTING_GUIDE.md`
3. **Check Architecture:** `CHROME_AI_ARCHITECTURE.md`
4. **Review API Reference:** `CHROME_AI_QUICK_REFERENCE.md`

---

## ✨ That's It!

You're ready to use Chrome's built-in AI translation. Enjoy! 🎉
