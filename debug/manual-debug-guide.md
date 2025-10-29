# Manual Chrome Extension Debugging Guide

Since MCP chrome-devtools can't access your extension, use these manual debugging methods:

## 1. Service Worker Debugging

1. **Navigate to**: `chrome://extensions/`
2. **Find**: "Language Learning Assistant"
3. **Click**: "Inspect views: service worker"
4. **Use Console**: Run these commands:

```javascript
// Check service worker status
console.log('Service worker active:', self.registration.active);

// Test storage
chrome.storage.local.get(null).then(data => console.log('Storage:', data));

// Test message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message, 'from:', sender);
});

// Test extension capabilities
console.log('Extension ID:', chrome.runtime.id);
console.log('Manifest:', chrome.runtime.getManifest());
```

## 2. Content Script Debugging

1. **Navigate to**: Any webpage (e.g., Wikipedia article)
2. **Open DevTools**: F12
3. **Go to Console**
4. **Run**:

```javascript
// Check if content script loaded
console.log('Content script loaded:', window.contentScriptLoaded);

// Test DOM manipulation
console.log('Page title:', document.title);
console.log('Article content:', document.body.innerText.length, 'characters');

// Test extension communication
chrome.runtime.sendMessage({ type: 'test' }, response => {
  console.log('Extension response:', response);
});
```

## 3. Chrome AI Testing

**In any webpage console**:

```javascript
// Check Chrome AI availability
console.log('Chrome AI available:', 'ai' in window);
console.log(
  'Summarizer available:',
  'ai' in window && 'summarizer' in window.ai
);

// Test summarizer
if ('ai' in window && 'summarizer' in window.ai) {
  window.ai.summarizer
    .create()
    .then(summarizer => {
      console.log('Summarizer created:', summarizer);
      return summarizer.summarize(
        'This is a test article about machine learning.'
      );
    })
    .then(summary => {
      console.log('Summary:', summary);
    })
    .catch(error => {
      console.error('Summarizer error:', error);
    });
}
```

## 4. Network Debugging

1. **Open DevTools**: F12
2. **Go to Network tab**
3. **Filter by**: XHR/Fetch
4. **Look for**: Extension-related requests
5. **Check**: Request/response headers and data

## 5. Storage Debugging

**In extension service worker console**:

```javascript
// View all stored data
chrome.storage.local.get(null).then(data => {
  console.log('All storage data:', data);
  console.log('Storage keys:', Object.keys(data));
});

// Check storage quota
navigator.storage.estimate().then(estimate => {
  console.log('Storage quota:', estimate);
});

// Clear storage (if needed)
// chrome.storage.local.clear();
```

## 6. Error Monitoring

**Add to your extension code**:

```javascript
// Global error handler
window.addEventListener('error', event => {
  console.error('Global error:', event.error);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});
```

## 7. Performance Debugging

**In DevTools Performance tab**:

1. **Start recording**
2. **Trigger extension functionality**
3. **Stop recording**
4. **Analyze**: CPU usage, memory allocation, function calls

## 8. Memory Debugging

**In DevTools Memory tab**:

1. **Take heap snapshot**
2. **Use extension features**
3. **Take another snapshot**
4. **Compare**: Look for memory leaks

## Common Issues to Check

### Extension Not Loading

- Check `chrome://extensions/` for errors
- Verify manifest.json syntax
- Check file paths in manifest

### Content Script Issues

- Verify script injection in DevTools > Sources
- Check for CSP violations in Console
- Test on different websites

### Service Worker Problems

- Check if service worker is active
- Look for registration errors
- Verify message passing

### Chrome AI Issues

- Check Chrome flags: `chrome://flags/#optimization-guide-on-device-model`
- Verify Chrome version (121+)
- Test on different websites

### Storage Problems

- Check quota limits
- Verify permissions in manifest
- Test storage operations in console

## Debug Commands Cheatsheet

```javascript
// Extension info
chrome.runtime.id;
chrome.runtime.getManifest();

// Storage operations
chrome.storage.local.get(null);
chrome.storage.local.set({ key: 'value' });
chrome.storage.local.remove('key');

// Tab operations
chrome.tabs.query({ active: true, currentWindow: true });
chrome.scripting.executeScript({ target: { tabId: id }, func: () => {} });

// Chrome AI
window.ai.summarizer.create();
window.ai.languageDetector.detect('text');
window.ai.translator.create({ sourceLanguage: 'en', targetLanguage: 'es' });
```
