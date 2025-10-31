# Diagnose Translation Issues

## Error: "No AI services available for translation"

This error means **both** Chrome AI and Gemini API are unavailable.

## Step 1: Check Chrome AI Status

Open DevTools Console (F12) on any webpage and run:

```javascript
// Check if Chrome AI is available
console.log('window.ai exists:', 'ai' in window);

// Check translator specifically
if (window.ai?.translator) {
  const caps = await window.ai.translator.capabilities();
  console.log('Translator status:', caps.available);

  // Check your language pair (example: English to Spanish)
  const pairStatus = await caps.languagePairAvailable('en', 'es');
  console.log('EN->ES available:', pairStatus);
} else {
  console.log('❌ Translator API not available');
}

// Check language model (Gemini Nano)
if (window.ai?.languageModel) {
  const modelCaps = await window.ai.languageModel.capabilities();
  console.log('Language Model status:', modelCaps.available);
} else {
  console.log('❌ Language Model API not available');
}
```

### Expected Results:

- ✅ `available: "readily"` or `"available"` = Ready to use
- ⏳ `"downloading"` = Model downloading, wait a few minutes
- 📥 `"downloadable"` = Model needs to be downloaded
- ❌ `"unavailable"` = Not supported on this device

## Step 2: Check Model Download Status

Navigate to: `chrome://on-device-internals`

1. Click "Model Status" tab
2. Look for "Gemini Nano" or translation models
3. Check download status and any errors

## Step 3: Verify Chrome Flags

1. Go to `chrome://flags/#optimization-guide-on-device-model`
2. Ensure it's set to **Enabled**
3. Relaunch Chrome if you just enabled it

## Step 4: Check System Requirements

- ✅ Chrome 140+ installed
- ✅ 22GB free storage space
- ✅ 4GB+ RAM available
- ✅ Unmetered network connection (Wi-Fi, not cellular)

## Step 5: Add Gemini API Key (Fallback)

If Chrome AI isn't working, add a Gemini API key:

1. Click extension icon → Settings
2. Scroll to "API Configuration"
3. Add your Gemini API key from: https://aistudio.google.com/app/apikey
4. Click "Save Settings"

## Step 6: Test Translation in Extension

After fixing Chrome AI or adding Gemini API key:

1. Reload the extension: `chrome://extensions/` → Click reload icon
2. Open an article
3. Try highlighting text for translation
4. Check console for any new errors

## Common Issues

### Issue: "Translator API not available"

**Solution**:

- Enable `chrome://flags/#optimization-guide-on-device-model`
- Wait for model download (check `chrome://on-device-internals`)
- Ensure 22GB free storage

### Issue: Language pair not supported

**Solution**:

- Check supported pairs: `await caps.languagePairAvailable('from', 'to')`
- Use Gemini API as fallback (supports more languages)

### Issue: Model downloading but stuck

**Solution**:

- Ensure unmetered connection (Wi-Fi)
- Check available storage (need 22GB)
- Restart Chrome
- Wait 10-15 minutes for download to complete

## Debug Commands

Run in extension service worker console (`chrome://extensions/` → Inspect service worker):

```javascript
// Check extension settings
chrome.storage.local.get('settings').then(data => {
  console.log('Settings:', data.settings);
  console.log('Learning language:', data.settings?.learningLanguage);
  console.log('Native language:', data.settings?.nativeLanguage);
  console.log('Has Gemini API key:', !!data.settings?.apiKeys?.gemini);
});

// Check system capabilities
chrome.runtime
  .sendMessage({ type: 'CHECK_SYSTEM_CAPABILITIES' })
  .then(response => console.log('Capabilities:', response.data));
```

## Quick Fix

If you need translation to work immediately:

1. Get Gemini API key: https://aistudio.google.com/app/apikey
2. Extension Settings → API Configuration → Add key
3. Save and test

This bypasses Chrome AI and uses Gemini API directly.
