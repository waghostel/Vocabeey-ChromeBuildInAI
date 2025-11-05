# Testing Checklist - Context Menu Conversion Feature

## Pre-Testing Setup

1. ✅ Build the extension: `pnpm build`
2. ✅ Load the extension in Chrome (chrome://extensions/)
3. ✅ Navigate to an article and process it
4. ✅ Create some vocabulary and sentence highlights in Reading mode

## Test Cases

### Test 1: Convert Vocabulary to Sentence

**Steps:**

1. In Reading mode, highlight a word to create a vocabulary item
2. Verify the word appears in the "Vocabulary" section below the article
3. Right-click on the highlighted word in the article
4. Verify the context menu shows: "Remove", "Pronounce", "Change to Sentence"
5. Click "Change to Sentence"

**Expected Results:**

- ✅ The highlight color/style changes in the article
- ✅ The item disappears from the "Vocabulary" section
- ✅ The item appears in the "Sentences" section
- ✅ The translation is preserved
- ✅ Right-clicking now shows "Change to Vocabulary" instead

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

### Test 2: Convert Sentence to Vocabulary

**Steps:**

1. In Reading mode, highlight a sentence to create a sentence item
2. Verify the sentence appears in the "Sentences" section below the article
3. Right-click on the highlighted sentence in the article
4. Verify the context menu shows: "Remove", "Pronounce", "Change to Vocabulary"
5. Click "Change to Vocabulary"

**Expected Results:**

- ✅ The highlight color/style changes in the article
- ✅ The item disappears from the "Sentences" section
- ✅ The item appears in the "Vocabulary" section
- ✅ The translation is preserved
- ✅ Right-clicking now shows "Change to Sentence" instead

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

### Test 3: Context Menu Display - Vocabulary

**Steps:**

1. Create a vocabulary highlight
2. Right-click on the vocabulary highlight

**Expected Results:**

- ✅ Menu shows: "Remove" (first)
- ✅ Menu shows: "Pronounce" (second)
- ✅ Menu shows: "Change to Sentence" (third)
- ✅ Menu does NOT show: "Add as Vocabulary"
- ✅ Menu does NOT show: "Add as Sentence"
- ✅ Menu does NOT show: "Change to Vocabulary"

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

### Test 4: Context Menu Display - Sentence

**Steps:**

1. Create a sentence highlight
2. Right-click on the sentence highlight

**Expected Results:**

- ✅ Menu shows: "Remove" (first)
- ✅ Menu shows: "Pronounce" (second)
- ✅ Menu shows: "Change to Vocabulary" (third)
- ✅ Menu does NOT show: "Add as Vocabulary"
- ✅ Menu does NOT show: "Add as Sentence"
- ✅ Menu does NOT show: "Change to Sentence"

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

### Test 5: Context Menu Display - New Selection (None Mode)

**Steps:**

1. Switch to "None" highlight mode
2. Select some text in the article
3. Right-click on the selected text

**Expected Results:**

- ✅ Menu shows: "Add as Vocabulary"
- ✅ Menu shows: "Add as Sentence"
- ✅ Menu shows: "Pronounce"
- ✅ Menu does NOT show: "Remove"
- ✅ Menu does NOT show: "Change to Sentence"
- ✅ Menu does NOT show: "Change to Vocabulary"

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

### Test 6: Storage Persistence

**Steps:**

1. Create a vocabulary item
2. Convert it to a sentence
3. Refresh the page
4. Navigate back to the same article part

**Expected Results:**

- ✅ The item is still a sentence (not reverted to vocabulary)
- ✅ The highlight is still present in the article
- ✅ The item appears in the "Sentences" section
- ✅ The translation is still present

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

### Test 7: Multiple Conversions

**Steps:**

1. Create a vocabulary item
2. Convert it to a sentence
3. Convert it back to vocabulary
4. Convert it to a sentence again

**Expected Results:**

- ✅ Each conversion works correctly
- ✅ No duplicate items are created
- ✅ The item appears in the correct section after each conversion
- ✅ Translation is preserved through all conversions

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

### Test 8: Vocabulary Learning Mode

**Steps:**

1. Create several vocabulary items
2. Convert one to a sentence
3. Switch to "Vocabulary" learning mode

**Expected Results:**

- ✅ The converted item does NOT appear in vocabulary learning mode
- ✅ Other vocabulary items still appear correctly
- ✅ No errors in console

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

### Test 9: Sentence Learning Mode

**Steps:**

1. Create several sentence items
2. Convert one to vocabulary
3. Switch to "Sentences" learning mode

**Expected Results:**

- ✅ The converted item does NOT appear in sentence learning mode
- ✅ Other sentence items still appear correctly
- ✅ No errors in console

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

### Test 10: Navigation Between Parts

**Steps:**

1. Create vocabulary and sentence items in Part 1
2. Convert a vocabulary item to sentence
3. Navigate to Part 2
4. Navigate back to Part 1

**Expected Results:**

- ✅ The converted item is still a sentence
- ✅ The item appears in the correct section
- ✅ The highlight is still present
- ✅ No duplicate items

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

### Test 11: Long Text Conversion

**Steps:**

1. Create a sentence item with a very long sentence (100+ characters)
2. Convert it to vocabulary

**Expected Results:**

- ✅ Conversion succeeds
- ✅ The full text is preserved as the vocabulary word
- ✅ The vocabulary card displays correctly (may wrap or truncate)
- ✅ No errors in console

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

### Test 12: Special Characters

**Steps:**

1. Create vocabulary with special characters (é, ñ, 中文, etc.)
2. Convert to sentence
3. Convert back to vocabulary

**Expected Results:**

- ✅ Special characters are preserved
- ✅ Translation is preserved
- ✅ No encoding issues

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

### Test 13: Pronounce After Conversion

**Steps:**

1. Create a vocabulary item
2. Convert it to a sentence
3. Right-click and select "Pronounce"

**Expected Results:**

- ✅ Text-to-speech works correctly
- ✅ The correct text is pronounced
- ✅ No errors in console

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

### Test 14: Remove After Conversion

**Steps:**

1. Create a vocabulary item
2. Convert it to a sentence
3. Right-click and select "Remove"

**Expected Results:**

- ✅ The sentence item is removed
- ✅ The highlight is removed from the article
- ✅ The item disappears from the "Sentences" section
- ✅ No errors in console

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

### Test 15: Console Errors

**Steps:**

1. Open Chrome DevTools Console
2. Perform various conversions (vocabulary ↔ sentence)
3. Monitor for errors

**Expected Results:**

- ✅ No JavaScript errors
- ✅ No TypeScript errors
- ✅ Only expected console.log messages (if any)

**Status:** [ ] Pass [ ] Fail

**Notes:**

---

---

## Browser Compatibility

Test in different Chrome versions if possible:

- [ ] Chrome Stable (latest)
- [ ] Chrome Beta
- [ ] Chrome Dev
- [ ] Chromium

## Performance Testing

- [ ] Test with 50+ vocabulary items
- [ ] Test with 50+ sentence items
- [ ] Test rapid conversions (10+ in quick succession)
- [ ] Monitor memory usage during conversions

## Edge Cases

- [ ] Convert immediately after creating (no page refresh)
- [ ] Convert while TTS is speaking
- [ ] Convert while context menu is open for another item
- [ ] Convert with multiple browser tabs open

## Regression Testing

Ensure existing features still work:

- [ ] Creating new vocabulary highlights
- [ ] Creating new sentence highlights
- [ ] Removing highlights
- [ ] Pronouncing text
- [ ] Switching between learning modes
- [ ] Navigation between article parts
- [ ] Language selector
- [ ] Display mode options (A+B, A only, B only)

## Test Summary

**Total Tests:** 15 core + edge cases + regression
**Passed:** **\_**
**Failed:** **\_**
**Blocked:** **\_**

**Overall Status:** [ ] Ready for Release [ ] Needs Fixes

**Critical Issues:**

---

**Minor Issues:**

---

**Recommendations:**

---
