# Language Detection Test Script

## Quick Console Test

You can run this script in the browser console to test language detection directly and compare results.

### Test 1: Direct API Test (Run in any page)

```javascript
// Test if Language Detection API is available
console.log('Testing Language Detection API availability...');
console.log('typeof LanguageDetector:', typeof LanguageDetector);

if (typeof LanguageDetector !== 'undefined') {
  // Test with the IANA example text
  const testText = `Example Domains As described in RFC 2606 and RFC 6761, a number of domains such as example.com and example.org are maintained for documentation purposes. These domains may be used as illustrative examples in documents without prior coordination with us. They are not available for registration or transfer. We provide a web service on the example domain hosts to provide basic information on the purpose of the domain. These web services are provided as best effort, but are not designed to support production applications. While incidental traffic for incorrectly configured applications is expected, please do not design applications that require the example domains to have operating HTTP service. Further Reading IANA-managed Reserved Domains Last revised 2017-05-13.`;

  console.log('Testing with text:', testText.substring(0, 100) + '...');
  console.log('Text length:', testText.length);

  LanguageDetector.create()
    .then(detector => {
      console.log('✅ Detector created successfully');
      return detector.detect(testText);
    })
    .then(results => {
      console.log('📥 Raw results:', results);
      console.log('\n🌍 Language Detection Results:');

      const sorted = [...results].sort((a, b) => b.confidence - a.confidence);
      sorted.forEach((result, index) => {
        const percentage = (result.confidence * 100).toFixed(2);
        const bar = '█'.repeat(Math.round(result.confidence * 20));
        console.log(
          `  ${index + 1}. ${result.detectedLanguage.toUpperCase()} - ${percentage}% ${bar}`
        );
      });

      console.log('\n✅ Top result:', sorted[0]);
    })
    .catch(error => {
      console.error('❌ Error:', error);
    });
} else {
  console.error('❌ LanguageDetector API is not available in this context');
  console.log(
    'Available globals with "Language" or "Detect":',
    Object.keys(window).filter(
      k => k.includes('Language') || k.includes('Detect')
    )
  );
}
```

### Test 2: Test via Extension Message (Run in extension context)

```javascript
// Send a language detection request to the extension
const testText = `Example Domains As described in RFC 2606 and RFC 6761, a number of domains such as example.com and example.org are maintained for documentation purposes. These domains may be used as illustrative examples in documents without prior coordination with us.`;

console.log('Sending DETECT_LANGUAGE message...');
console.log('Text length:', testText.length);

chrome.runtime.sendMessage(
  {
    type: 'DETECT_LANGUAGE',
    data: { text: testText },
  },
  response => {
    console.log('Response received:', response);

    if (response?.success) {
      console.log('✅ Detection successful!');
      console.log('Language:', response.data.language);
      console.log(
        'Confidence:',
        (response.data.confidence * 100).toFixed(2) + '%'
      );
    } else {
      console.error('❌ Detection failed:', response?.error);
    }
  }
);
```

### Test 3: Compare Content Extraction

Run this in the IANA example page to see what content is being extracted:

```javascript
// Check what content the extension extracts
console.log('=== Content Extraction Test ===');
console.log('Document title:', document.title);
console.log('Document body text length:', document.body.innerText.length);
console.log(
  'Document body text preview:',
  document.body.innerText.substring(0, 200)
);

// Try to extract using Readability (if available)
if (typeof Readability !== 'undefined') {
  const documentClone = document.cloneNode(true);
  const reader = new Readability(documentClone);
  const article = reader.parse();

  if (article) {
    console.log('\n=== Readability Extraction ===');
    console.log('Title:', article.title);
    console.log('Content length:', article.textContent.length);
    console.log('Content preview:', article.textContent.substring(0, 200));
    console.log('Word count:', article.textContent.split(/\s+/).length);
  }
} else {
  console.log('Readability not available');
}
```

### Test 4: Check Offscreen Document Context

Run this in the service worker console:

```javascript
// Check offscreen document status
console.log('=== Offscreen Document Status ===');

// Try to get offscreen manager status
chrome.storage.session.get(null, data => {
  console.log('Session storage:', data);

  const offscreenKeys = Object.keys(data).filter(k => k.includes('offscreen'));
  console.log('Offscreen-related keys:', offscreenKeys);
});

// Try to send a test message to offscreen
chrome.runtime.sendMessage(
  {
    type: 'DETECT_LANGUAGE',
    data: {
      text: 'This is a test message to check if offscreen document is working.',
    },
  },
  response => {
    console.log('Test message response:', response);
  }
);
```

## Expected Results

### If Working Correctly:

- **Test 1:** Should show `typeof LanguageDetector: function` and detect EN with ~99% confidence
- **Test 2:** Should return `{ success: true, data: { language: 'en', confidence: 0.99 }}`
- **Test 3:** Should show the extracted content matches what you expect
- **Test 4:** Should show offscreen document is active and responding

### If Not Working:

- **Test 1:** May show `typeof LanguageDetector: undefined` (API not available in that context)
- **Test 2:** May return error or low confidence (30%)
- **Test 3:** May show different content than expected
- **Test 4:** May show offscreen document not responding

## Comparison Test

To compare with the official demo:

1. **Go to:** https://developer.chrome.com/docs/ai/language-detection (or the demo page you used)
2. **Open DevTools Console**
3. **Run Test 1** with the same text
4. **Compare the confidence scores**

If the demo shows 99% but your extension shows 30%, then:

- The API is working in the demo context
- Something is different in your extension's context
- Check the diagnostic logs to see where it diverges

## Debugging Checklist

- [ ] Run Test 1 in a regular page - Does it work?
- [ ] Run Test 1 in the offscreen document - Does it work?
- [ ] Run Test 2 from content script - Does it reach service worker?
- [ ] Check service worker console - Are there error messages?
- [ ] Check offscreen document console - Is it receiving messages?
- [ ] Compare extracted content - Is it the same as demo input?
- [ ] Check Chrome version - Is Language Detection API supported?
- [ ] Check Chrome flags - Are AI features enabled?

## Chrome AI Feature Flags

Make sure these are enabled in `chrome://flags/`:

- **Prompt API for Gemini Nano:** Enabled
- **Summarization API for Gemini Nano:** Enabled
- **Translation API:** Enabled
- **Language Detection API:** Enabled (if available as a flag)

You can check all AI-related flags with:

```
chrome://flags/#optimization-guide-on-device-model
```
