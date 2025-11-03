# Offscreen Document Error Analysis

## Error Message

```
Failed to create offscreen document: Error: Only a single offscreen document may be created.
Offscreen translation failed, falling back to Gemini: Error: Only a single offscreen document may be created.
TRANSLATE_TEXT error: Error: Translation API not available and no Gemini API key configured
Translation failed: Translation API not available and no Gemini API key configured
```

## Root Cause Analysis

### ❌ The Problem: Chrome's Offscreen Document Limitation

**Chrome only allows ONE offscreen document per extension at a time.**

When we implemented language detection, we added a new call to create an offscreen document during article processing. However, the offscreen document was **already created** during initialization, causing a conflict.

### 📊 Sequence of Events

```
1. Extension loads
   ↓
2. initializeOffscreenManagement() called
   ↓
3. Offscreen document created ✅
   ↓
4. User processes article
   ↓
5. Language detection runs
   ↓
6. Tries to create offscreen document again ❌
   ↓
7. Error: "Only a single offscreen document may be created"
   ↓
8. Language detection fails
   ↓
9. Falls back to Gemini API
   ↓
10. No Gemini API key configured ❌
    ↓
11. Translation also fails (same offscreen issue)
```

### 🔍 Code Analysis

#### Current Implementation (PROBLEMATIC)

**In `offscreen-manager.ts` line 95:**

```typescript
async createDocument(config?: Partial<OffscreenDocumentConfig>): Promise<string> {
  // Check if document already exists
  if (this.activeDocument) {
    return this.activeDocument;  // ✅ Should return existing
  }

  // ... create new document
  await chrome.offscreen.createDocument(documentConfig);  // ❌ Fails if already exists
}
```

**The issue:** The check `if (this.activeDocument)` only works if the same manager instance is used. However, Chrome's internal state might have an offscreen document that our manager doesn't know about.

### 🐛 Why This Happens

1. **Initialization**: `initializeOffscreenManagement()` creates the offscreen document
2. **State Tracking**: `this.activeDocument` is set to track it
3. **Problem**: If the document is created outside the manager, or if there's a race condition, the manager's state can be out of sync with Chrome's actual state

### 🔄 Conflict Between Language Detection and Translation

**NO - There is NO conflict between the APIs themselves.**

The conflict is in the **offscreen document management**:

- Both language detection and translation need the offscreen document
- Both try to ensure it exists
- Chrome only allows one offscreen document
- The error occurs when trying to create a second one

### 📝 Current Offscreen Document Usage

| Feature             | Uses Offscreen | When                                   |
| ------------------- | -------------- | -------------------------------------- |
| Language Detection  | ✅ Yes         | During article processing              |
| Translation         | ✅ Yes         | When highlighting vocabulary/sentences |
| Summarization       | ✅ Yes         | During article processing              |
| Rewriting           | ✅ Yes         | During article processing              |
| Vocabulary Analysis | ✅ Yes         | During article processing              |

**All features share the SAME offscreen document** - this is correct and efficient.

## The Real Issue

### Issue 1: Race Condition

When multiple AI tasks run simultaneously (e.g., language detection + translation), they might both try to create the offscreen document at the same time.

### Issue 2: Document State Desync

If the offscreen document is closed or crashes, the manager's `activeDocument` state might not reflect reality.

### Issue 3: Chrome API Check Missing

The code doesn't check Chrome's actual offscreen document state before trying to create one.

## Solution Strategy

### ✅ Solution 1: Check Chrome's Actual State (RECOMMENDED)

Before creating a document, check if Chrome already has one:

```typescript
async createDocument(config?: Partial<OffscreenDocumentConfig>): Promise<string> {
  // Check manager's state
  if (this.activeDocument) {
    return this.activeDocument;
  }

  // Check Chrome's actual state
  try {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
    });

    if (existingContexts.length > 0) {
      // Document already exists in Chrome
      const documentId = `offscreen_${Date.now()}`;
      this.activeDocument = documentId;
      return documentId;
    }
  } catch (error) {
    console.warn('Could not check existing offscreen contexts:', error);
  }

  // Create new document
  await chrome.offscreen.createDocument(documentConfig);
  // ... rest of creation logic
}
```

### ✅ Solution 2: Catch and Handle "Already Exists" Error

```typescript
try {
  await chrome.offscreen.createDocument(documentConfig);
  // ... success logic
} catch (error) {
  if (error.message.includes('Only a single offscreen document')) {
    // Document already exists, that's fine
    console.log('Offscreen document already exists, reusing it');
    const documentId = `offscreen_${Date.now()}`;
    this.activeDocument = documentId;
    return documentId;
  }
  throw error; // Re-throw other errors
}
```

### ✅ Solution 3: Singleton Pattern with Lock (BEST)

Add a creation lock to prevent race conditions:

```typescript
private creationLock: Promise<string> | null = null;

async createDocument(config?: Partial<OffscreenDocumentConfig>): Promise<string> {
  // If already creating, wait for that to finish
  if (this.creationLock) {
    return await this.creationLock;
  }

  // If already created, return it
  if (this.activeDocument) {
    return this.activeDocument;
  }

  // Create with lock
  this.creationLock = this._createDocumentInternal(config);

  try {
    const result = await this.creationLock;
    return result;
  } finally {
    this.creationLock = null;
  }
}

private async _createDocumentInternal(config?: Partial<OffscreenDocumentConfig>): Promise<string> {
  // Actual creation logic here
}
```

## Recommended Fix

**Combine Solutions 1, 2, and 3** for maximum reliability:

1. Add creation lock to prevent race conditions
2. Check Chrome's actual state before creating
3. Catch and handle "already exists" errors gracefully

## Why Translation Failed

The translation failure is a **cascade effect**:

1. ❌ Offscreen document creation failed
2. ❌ Chrome AI translation unavailable (needs offscreen)
3. ❌ Fallback to Gemini API
4. ❌ No Gemini API key configured
5. ❌ Translation completely fails

**The root cause is still the offscreen document issue, not a conflict between APIs.**

## Testing the Fix

After implementing the fix, test:

1. ✅ Process an article (language detection)
2. ✅ Highlight vocabulary (translation)
3. ✅ Highlight sentence (translation)
4. ✅ Navigate between parts (multiple translations)
5. ✅ Process another article (language detection again)

All should work without "Only a single offscreen document" errors.

## Impact Assessment

### Before Fix

- ❌ Language detection fails after first use
- ❌ Translation fails randomly
- ❌ User sees "Translation API not available" errors
- ❌ Extension appears broken

### After Fix

- ✅ Language detection works consistently
- ✅ Translation works reliably
- ✅ No offscreen document errors
- ✅ Smooth user experience

## Conclusion

**There is NO conflict between Language Detection API and Translation API.**

The issue is in the **offscreen document management** - specifically:

1. Race conditions when creating the document
2. Not checking Chrome's actual state
3. Not handling "already exists" errors gracefully

The fix is to improve the offscreen document manager to be more robust and handle these edge cases.

---

**Analysis Date**: November 3, 2025  
**Severity**: High (breaks core functionality)  
**Complexity**: Medium (well-understood problem)  
**Fix Priority**: Immediate
