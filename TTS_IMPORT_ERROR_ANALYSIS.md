# TTS Import Error Analysis Report

## Error Summary

**Error Type:** `Failed to load resource: net::ERR_FILE_NOT_FOUND`

**Error Location:** `learning-interface.ts:718`

**Full Error Message:**

```
Failed to load resource: net::ERR_FILE_NOT_FOUND
learning-interface.ts:718 TTS error: TypeError: Failed to fetch dynamically imported module:
chrome-extension://ckehhllajbfpeoejdjifemgbidefoaka/utils/tts-service
```

---

## Root Cause Analysis

### 1. **Dynamic Import Path Issue**

The error occurs when the learning interface attempts to dynamically import the TTS service module:

**Source Code (line 718 in learning-interface.ts):**

```typescript
const { speak, stopSpeaking, isTTSSupported, getTTSService } = await import(
  '../utils/tts-service'
);
```

**Compiled Output (dist/ui/learning-interface.js):**

```javascript
const { speak, stopSpeaking, isTTSSupported, getTTSService } = await import(
  '../utils/tts-service'
);
```

### 2. **Chrome Extension Context Problem**

The issue stems from how Chrome extensions resolve module paths in different contexts:

- **Current Path:** `chrome-extension://[id]/ui/learning-interface.html`
- **Import Attempt:** `../utils/tts-service`
- **Resolved Path:** `chrome-extension://[id]/utils/tts-service` ❌
- **Actual File Location:** `chrome-extension://[id]/utils/tts-service.js` ✅

### 3. **Missing File Extension**

Chrome extensions running in HTML pages (not service workers) require **explicit file extensions** for dynamic imports. The TypeScript compiler preserves the relative import path without adding `.js` extension.

---

## Why This Happens

### Manifest V3 + ES Modules Behavior

1. **Service Workers:** Can use extensionless imports because they're treated as modules
2. **HTML Pages (UI):** Require explicit `.js` extensions for dynamic imports
3. **TypeScript Compilation:** Preserves import paths as-is, doesn't add extensions

### File System Verification

The file **does exist** in the correct location:

```
dist/
├── ui/
│   ├── learning-interface.js  ← Running here
│   └── learning-interface.html
└── utils/
    └── tts-service.js  ← Target file exists
```

However, the browser cannot resolve `../utils/tts-service` without the `.js` extension when loaded from an HTML page context.

---

## Impact Assessment

### Affected Functionality

- ✅ **Text-to-Speech (TTS)** - Completely broken
- ✅ **Pronunciation buttons** - Non-functional
- ✅ **Vocabulary card audio** - Cannot play
- ✅ **Sentence pronunciation** - Cannot play

### User Experience

- Users click pronunciation buttons → Nothing happens
- Error appears in console but no user-facing error message
- Silent failure degrades learning experience

### Scope

- **Affected Files:** `src/ui/learning-interface.ts` (1 location)
- **Other Dynamic Imports:** Need to verify if other UI files have similar issues

---

## Technical Details

### Chrome Extension Module Resolution Rules

| Context        | Import Type | Extension Required | Example                                               |
| -------------- | ----------- | ------------------ | ----------------------------------------------------- |
| Service Worker | Static      | No                 | `import { x } from './module'`                        |
| Service Worker | Dynamic     | No                 | `await import('./module')`                            |
| HTML Page      | Static      | Yes                | `<script type="module" src="./module.js">`            |
| HTML Page      | Dynamic     | **Yes**            | `await import('./module.js')` ← **This is the issue** |

### TypeScript Configuration

Current `tsconfig.json` settings:

```json
{
  "compilerOptions": {
    "module": "ES2022",
    "moduleResolution": "node",
    "target": "ES2022"
  }
}
```

TypeScript does **not** automatically add `.js` extensions to dynamic imports, even with `"module": "ES2022"`.

---

## Solution Options

### Option 1: Add .js Extension to Dynamic Import (Recommended)

**Change:**

```typescript
// Before
const { speak, stopSpeaking, isTTSSupported, getTTSService } = await import(
  '../utils/tts-service'
);

// After
const { speak, stopSpeaking, isTTSSupported, getTTSService } = await import(
  '../utils/tts-service.js'
);
```

**Pros:**

- Simple, direct fix
- Follows Chrome extension best practices
- No build system changes needed
- Works in all contexts

**Cons:**

- Looks unusual in TypeScript source
- Need to remember for future dynamic imports

---

### Option 2: Convert to Static Import

**Change:**

```typescript
// At top of file
import { speak, stopSpeaking, isTTSSupported, getTTSService } from '../utils/tts-service';

// In function
async function handlePronounceClick(button: HTMLElement, text: string): Promise<void> {
  try {
    if (!isTTSSupported()) {
      showTooltip('Text-to-speech is not supported in your browser');
      return;
    }
    // ... rest of code
  }
}
```

**Pros:**

- No extension issues
- Better for tree-shaking
- Faster (no async loading)
- TypeScript handles it correctly

**Cons:**

- Increases initial bundle size slightly
- Loses lazy-loading benefit (minimal in this case)

---

### Option 3: Build System Post-Processing

Add a build step to automatically append `.js` to dynamic imports in UI files.

**Pros:**

- Automatic solution
- Works for all future dynamic imports

**Cons:**

- Adds build complexity
- Requires custom tooling
- Overkill for single import

---

## Recommended Solution

**Use Option 1: Add `.js` extension**

This is the most pragmatic solution because:

1. **Minimal Change:** One-line fix
2. **Standard Practice:** Chrome extension documentation recommends explicit extensions
3. **No Build Changes:** Works with current setup
4. **Clear Intent:** Makes the extension requirement explicit

### Implementation

**File:** `src/ui/learning-interface.ts`

**Line 718:** Change from:

```typescript
const { speak, stopSpeaking, isTTSSupported, getTTSService } = await import(
  '../utils/tts-service'
);
```

To:

```typescript
const { speak, stopSpeaking, isTTSSupported, getTTSService } = await import(
  '../utils/tts-service.js'
);
```

---

## Additional Recommendations

### 1. Audit Other Dynamic Imports

Search for other dynamic imports in UI files:

```bash
grep -r "await import" src/ui/
```

### 2. Add to Coding Standards

Document in `.kiro/steering/tech.md`:

```markdown
## Dynamic Imports in Chrome Extensions

- Service workers: Extensions optional
- UI files (HTML context): **Must include .js extension**
- Example: `await import('../utils/module.js')`
```

### 3. Consider Static Import

Given that TTS is used immediately on page load (not conditionally), consider converting to static import for better performance.

### 4. Add Error Handling

Improve user feedback when TTS fails:

```typescript
catch (error: unknown) {
  console.error('TTS error:', error);

  // Better user feedback
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    showTooltip('Audio feature unavailable. Please reload the extension.');
  } else {
    showTooltip('Failed to pronounce text');
  }
}
```

---

## Testing Checklist

After implementing the fix:

- [ ] Rebuild extension: `pnpm build`
- [ ] Reload extension in Chrome
- [ ] Open learning interface
- [ ] Test vocabulary card pronunciation button
- [ ] Test sentence card pronunciation button
- [ ] Test vocabulary learning mode pronunciation
- [ ] Test sentence learning mode pronunciation
- [ ] Verify no console errors
- [ ] Test with different languages

---

## Prevention

### ESLint Rule (Future Enhancement)

Consider adding a custom ESLint rule to catch this pattern:

```javascript
// .eslintrc.js
rules: {
  'no-extensionless-dynamic-import': 'error' // Custom rule
}
```

### TypeScript Plugin

Explore TypeScript plugins that can automatically add extensions:

- `typescript-transform-paths`
- `@zerollup/ts-transform-paths`

---

## Conclusion

The error is caused by Chrome's requirement for explicit `.js` extensions in dynamic imports when executed from HTML page contexts. The fix is straightforward: add `.js` to the import path. This is a one-line change that resolves the issue completely.

**Priority:** High (breaks core feature)  
**Complexity:** Low (one-line fix)  
**Risk:** Minimal (isolated change)
