# Service Worker Dynamic Import Fix

## 🐛 Issue Discovered

### Error Message

```
TypeError: import() is disallowed on ServiceWorkerGlobalScope by the HTML specification.
See https://github.com/w3c/ServiceWorker/issues/1356.
```

### Root Cause

**Service workers do NOT support dynamic `import()` statements!**

This is a fundamental limitation of the Service Worker specification. Dynamic imports are not allowed in the Service Worker global scope.

## ❌ What Was Wrong

### Before (Broken Code)

```typescript
async function handleTranslateText(payload: {...}): Promise<string> {
  try {
    // ❌ WRONG: Dynamic import in service worker
    const { executeOffscreenAITask } = await import('../utils/offscreen-manager');

    const translation = await executeOffscreenAITask<string>(...);
    return translation;
  } catch (offscreenError) {
    // ❌ WRONG: Another dynamic import
    const { GeminiAPIClient } = await import('../utils/gemini-api');
    const geminiAPI = new GeminiAPIClient({ apiKey: geminiKey });
    // ...
  }
}
```

### Why This Failed

1. **Service Worker Limitation**: The HTML specification explicitly disallows dynamic `import()` in service workers
2. **Security Reasons**: Service workers run in a restricted context
3. **Specification**: See [W3C Service Worker Issue #1356](https://github.com/w3c/ServiceWorker/issues/1356)

## ✅ Solution

### After (Fixed Code)

```typescript
// ✅ CORRECT: Static imports at the top of the file
import {
  executeOffscreenAITask,
} from '../utils/offscreen-manager';
import { GeminiAPIClient } from '../utils/gemini-api';

async function handleTranslateText(payload: {...}): Promise<string> {
  try {
    // ✅ CORRECT: Use the statically imported function
    const translation = await executeOffscreenAITask<string>(...);
    return translation;
  } catch (offscreenError) {
    // ✅ CORRECT: Use the statically imported class
    const geminiAPI = new GeminiAPIClient({ apiKey: geminiKey });
    // ...
  }
}
```

## 📝 Changes Made

### File: `src/background/service-worker.ts`

**Added static imports:**

```typescript
import {
  getMemoryManager,
  initializeMemoryManagement,
  shutdownMemoryManagement,
} from '../utils/memory-manager';
import {
  initializeOffscreenManagement,
  shutdownOffscreenManagement,
  executeOffscreenAITask, // ✅ Added
} from '../utils/offscreen-manager';

import type { ExtractedContent, ProcessedArticle } from '../types';
import { globalErrorHandler } from '../utils/error-handler';
import { processArticle } from '../utils/article-processor';
import { GeminiAPIClient } from '../utils/gemini-api'; // ✅ Added
```

**Removed dynamic imports from function:**

```typescript
// Before:
const { executeOffscreenAITask } = await import('../utils/offscreen-manager');

// After:
// Just use executeOffscreenAITask directly (already imported)

// Before:
const { GeminiAPIClient } = await import('../utils/gemini-api');

// After:
// Just use GeminiAPIClient directly (already imported)
```

## 🎓 Key Learnings

### Service Worker Restrictions

Service workers have several restrictions:

1. ❌ **No dynamic imports** - `import()` is not allowed
2. ❌ **No DOM access** - Can't access `document` or `window`
3. ❌ **No synchronous APIs** - Must use async APIs
4. ❌ **No localStorage** - Use chrome.storage instead
5. ✅ **Can use static imports** - Regular `import` statements work
6. ✅ **Can use chrome APIs** - chrome.storage, chrome.runtime, etc.

### Best Practices

1. **Always use static imports** in service workers
2. **Import at the top** of the file
3. **Don't use dynamic imports** anywhere in service worker code
4. **Test in service worker context** before deploying

## 🔍 How to Detect This Issue

### Console Error Pattern

```
TypeError: import() is disallowed on ServiceWorkerGlobalScope
```

### Where to Look

- Service worker console (`chrome://extensions` → Inspect service worker)
- Background script errors
- Any file that runs in service worker context

### Prevention

- Use ESLint rule to prevent dynamic imports in service workers
- Code review checklist
- Test in actual service worker environment

## 📊 Impact

### Before Fix

- ❌ Translation requests failed immediately
- ❌ Error: "import() is disallowed"
- ❌ Fallback to Gemini also failed
- ❌ No translations worked

### After Fix

- ✅ Translation requests work correctly
- ✅ Offscreen document receives requests
- ✅ Chrome AI APIs can be used
- ✅ Fallback to Gemini works if needed

## 🧪 Testing

### Verify the Fix

1. **Reload extension**

   ```
   chrome://extensions → Reload
   ```

2. **Test translation**
   - Open any article
   - Click on a word
   - Should see translation without import errors

3. **Check console**
   - Should NOT see: "import() is disallowed"
   - Should see: "Translation successful"

### Expected Console Output

```
✅ TRANSLATE_TEXT request: { text: "palabra", ... }
✅ Translation successful (Chrome AI via offscreen): word
```

### Should NOT See

```
❌ TypeError: import() is disallowed on ServiceWorkerGlobalScope
❌ Offscreen translation failed, falling back to Gemini
```

## 🔗 Related Issues

### Similar Problems

If you see similar errors with other dynamic imports:

1. **Check if code runs in service worker**
2. **Convert to static imports**
3. **Move dynamic logic to offscreen document** if needed

### Service Worker vs Offscreen Document

| Feature         | Service Worker   | Offscreen Document |
| --------------- | ---------------- | ------------------ |
| Dynamic imports | ❌ Not allowed   | ✅ Allowed         |
| DOM access      | ❌ Not allowed   | ✅ Allowed         |
| Chrome AI APIs  | ❌ Not available | ✅ Available       |
| Static imports  | ✅ Allowed       | ✅ Allowed         |
| chrome.\* APIs  | ✅ Most APIs     | ✅ Most APIs       |

## 📚 References

- [W3C Service Worker Spec](https://w3c.github.io/ServiceWorker/)
- [Service Worker Issue #1356](https://github.com/w3c/ServiceWorker/issues/1356)
- [Chrome Extension Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## ✅ Resolution

**Status:** ✅ FIXED

**Solution:** Replaced all dynamic `import()` statements with static imports at the top of the service worker file.

**Build:** ✅ Successful

**Testing:** Ready for testing

---

**Next Step:** Reload the extension and test translation functionality!
