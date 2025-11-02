# Testing Instructions - Language Learning Assistant

Simple manual testing guide for the Language Learning Chrome Extension.

## Prerequisites

Before testing, ensure you have:

- Chrome 140+ installed
- Extension loaded in Developer Mode (`chrome://extensions/`)
- Chrome Built-in AI enabled at `chrome://flags/#optimization-guide-on-device-model`
- AI models downloaded (22GB - check at `chrome://on-device-internals`)

**Quick AI Check**:

```javascript
// Open DevTools Console (F12) on any webpage
console.log('Chrome AI available:', 'ai' in window);
// Should show: true
```

## Test Scenarios

### 1. Basic Article Processing

**Goal**: Verify the extension can extract and process web articles

**Steps**:

1. Navigate to a news article (e.g., BBC News, Medium, Wikipedia)
2. Click the Language Learning Assistant extension icon in toolbar
3. Wait for processing to complete
4. Verify learning interface opens in a new tab

**Expected Results**:

- Article content extracted cleanly (no ads, navigation, or clutter)
- Title and URL displayed correctly
- Language automatically detected
- Content split into readable parts
- No error notifications

**Test Articles**:

- Simple: Wikipedia article (clear structure)
- Medium: News article (standard layout)
- Complex: Blog post (varied formatting)

---

### 2. Vocabulary Highlighting

**Goal**: Test vocabulary selection and translation

**Steps**:

1. Process an article (see Test 1)
2. Select "📝 Vocabulary" from highlight mode selector
3. Click on 1-3 words in the article
4. Verify vocabulary card appears below article
5. Hover over highlighted word to see translation popup
6. Click highlighted word to hear pronunciation

**Expected Results**:

- Words highlight with visual indicator
- Translation card displays with context
- Hover shows quick translation popup
- TTS pronunciation works (if supported)
- Card includes surrounding context

**Test Cases**:

- Single word selection
- 2-3 word phrase selection
- Multiple vocabulary items in same article

---

### 3. Sentence Learning

**Goal**: Test sentence highlighting and translation

**Steps**:

1. Process an article
2. Select "💬 Sentences" from highlight mode selector
3. Highlight a complete sentence (minimum 10 characters)
4. Verify sentence card appears below article
5. Click speaker button to hear pronunciation

**Expected Results**:

- Sentence highlights correctly
- Translation card shows original and translated text
- TTS works for full sentence
- Context preserved from article

**Test Cases**:

- Short sentence (10-20 words)
- Long sentence (20+ words)
- Multiple sentences from same article

---

### 4. Mode Switching

**Goal**: Verify navigation between different modes

**Steps**:

1. Process an article with some vocabulary and sentences
2. Click "📖 Reading" tab - verify article view
3. Click "📝 Vocabulary" tab - verify vocabulary grid
4. Click "💬 Sentences" tab - verify sentence list
5. Test keyboard shortcuts: R (reading), V (vocabulary), S (sentences)

**Expected Results**:

- Each mode displays correct content
- Navigation smooth without errors
- Keyboard shortcuts work
- Previously highlighted items persist across modes

---

### 5. Settings Configuration

**Goal**: Test settings interface and persistence

**Steps**:

1. Open extension settings (click settings icon or navigate to settings page)
2. Change learning language (e.g., Spanish)
3. Change native language (e.g., English)
4. Adjust difficulty level slider (try 3, 5, 8)
5. Toggle auto-highlight on/off
6. Click "Save Settings"
7. Close and reopen settings to verify persistence

**Expected Results**:

- All settings save correctly
- Settings persist after closing
- Language changes reflected in new articles
- Difficulty affects content processing
- Cannot select same language for learning and native

**Optional API Tests** (if you have keys):

- Add Gemini API key - verify it saves
- Add Jina Reader API key - verify it saves
- Test article processing with APIs enabled

---

### 6. Display Options

**Goal**: Test vocabulary display modes

**Steps**:

1. Process an article and highlight 3-5 vocabulary items
2. Switch to Vocabulary mode (📝)
3. Click "Both Languages (A + B)" - verify both shown
4. Click "Learning Only (A only)" - verify only learning language shown
5. Click "Native Only (B only)" - verify only translations shown

**Expected Results**:

- Display toggles work correctly
- Cards update immediately
- All vocabulary items visible in each mode
- Layout remains clean and readable

---

### 7. Text-to-Speech

**Goal**: Verify pronunciation features work

**Steps**:

1. Process an article in a language with TTS support (English, Spanish, French, etc.)
2. Highlight vocabulary and sentences
3. Click highlighted vocabulary word - should hear pronunciation
4. Click speaker icon on sentence card - should hear sentence
5. Test stop button during playback

**Expected Results**:

- TTS starts on click
- Correct language voice selected
- Visual feedback during playback (speaking indicator)
- Stop button works
- Graceful error if TTS unavailable

**Test Languages**:

- English (widely supported)
- Spanish (common)
- French (common)
- Other languages (may vary by system)

---

### 8. Storage Management

**Goal**: Test data persistence and cleanup

**Steps**:

1. Process 2-3 articles with vocabulary
2. Open settings → Storage section
3. Verify storage usage displayed (MB and percentage)
4. Click "Export Data" - verify JSON file downloads
5. Click "Clear All Data" - confirm double prompt
6. Verify all data cleared (check vocabulary mode)
7. Click "Import Data" - select exported file
8. Verify data restored

**Expected Results**:

- Storage usage accurate
- Export creates valid JSON file
- Clear data requires confirmation
- All data removed after clear
- Import restores previous state
- No data loss during export/import cycle

---

### 9. Navigation Controls

**Goal**: Test article part navigation

**Steps**:

1. Process a long article (splits into multiple parts)
2. Click "Next" button - verify moves to part 2
3. Click "Previous" button - verify returns to part 1
4. Test keyboard shortcuts: → (next), ← (previous)
5. Verify part indicator updates (e.g., "Part 1 of 3")

**Expected Results**:

- Navigation buttons work correctly
- Keyboard shortcuts functional
- Part indicator accurate
- Content updates smoothly
- Highlighted items persist across parts

---

### 10. Error Handling

**Goal**: Verify graceful error handling

**Test Cases**:

**A. No Article Content**

- Navigate to Chrome internal page (e.g., `chrome://extensions/`)
- Click extension icon
- Expected: Error notification "Could not find article content"

**B. Unsupported Page**

- Navigate to image-only page or video page
- Click extension icon
- Expected: Error notification about content extraction failure

**C. AI Unavailable**

- Disable Chrome AI (or test without AI models)
- Try processing article
- Expected: Clear error message about AI unavailability

**D. Network Issues**

- Disconnect internet (if using Gemini API)
- Try processing article
- Expected: Network error message with retry option

**E. Invalid Text Selection**

- Try highlighting less than minimum characters
- Expected: No card created or helpful error message

---

## Quick Smoke Test (5 minutes)

For rapid verification after changes:

1. **Load Extension**: Verify extension loads without errors
2. **Process Article**: Open any news article, click extension icon
3. **Highlight Vocabulary**: Select 2-3 words, verify translation
4. **Highlight Sentence**: Select one sentence, verify translation
5. **Switch Modes**: Test Reading → Vocabulary → Sentences tabs
6. **TTS**: Click one highlighted word to hear pronunciation
7. **Settings**: Open settings, change one option, save

If all steps pass, core functionality is working.

---

## Browser Console Checks

Open DevTools Console (F12) during testing to monitor for:

- JavaScript errors (red messages)
- Warning messages (yellow)
- Network failures
- Storage quota issues

**Common Console Commands**:

```javascript
// Check AI availability
console.log('AI available:', 'ai' in window);

// Check translator capabilities
await window.ai.translator.capabilities();

// Check storage usage
chrome.storage.local.getBytesInUse(null, bytes => {
  console.log('Storage used:', bytes, 'bytes');
});
```

---

## Performance Checks

Monitor during testing:

- **Memory Usage**: Should stay under 100MB per tab
- **Processing Time**: Article processing should complete in 5-15 seconds
- **UI Responsiveness**: No lag when switching modes or highlighting
- **Storage Growth**: Check storage doesn't grow excessively

**Check Memory** (Chrome Task Manager):

1. Press Shift+Esc to open Task Manager
2. Find "Extension: Language Learning Assistant"
3. Monitor memory usage during testing

---

## Test Data Cleanup

After testing:

1. Open extension settings
2. Navigate to Storage Management
3. Export data if you want to keep test results
4. Click "Clear All Data" to reset
5. Confirm deletion

---

## Reporting Issues

When you find a bug, document:

- **Chrome Version**: Check at `chrome://version/`
- **OS**: Windows/macOS/Linux version
- **Steps to Reproduce**: Exact sequence of actions
- **Expected vs Actual**: What should happen vs what happened
- **Console Errors**: Any error messages from DevTools
- **Screenshot**: If UI issue, include screenshot
- **Article URL**: If not sensitive, include test article URL

---

## Test Coverage Summary

This manual test suite covers:

- ✅ Content extraction and processing
- ✅ Vocabulary highlighting and translation
- ✅ Sentence learning and translation
- ✅ Mode switching and navigation
- ✅ Settings configuration and persistence
- ✅ Display options and customization
- ✅ Text-to-speech functionality
- ✅ Storage management and data export/import
- ✅ Navigation controls and keyboard shortcuts
- ✅ Error handling and edge cases

For automated testing, see the [Testing Guide](testing/README.md) which covers 740+ unit and integration tests.

---

# User Experience Testing Guide

Test the extension from a learner's perspective.

## Step 1: Turn Any Article Into a Learning Experience

1. Find an interesting article online (news, blog, Wikipedia)
2. Click the extension icon in your toolbar
3. Watch as the article transforms into a clean learning interface
4. Notice the clutter (ads, sidebars) is gone
5. See your article title, source, and detected language at the top

---

## Step 2: Learn New Vocabulary Words

1. Click the "📝 Vocabulary" button at the top
2. Click on any word or short phrase (1-3 words) you want to learn
3. See the word highlight and a translation card appear below
4. Hover your mouse over the highlighted word for a quick translation
5. Click the highlighted word to hear how it's pronounced

---

## Step 3: Understand Full Sentences

1. Click the "💬 Sentences" button at the top
2. Select an entire sentence you want to understand
3. See the sentence highlight with its translation below
4. Click the speaker icon to hear the sentence pronounced
5. Compare the original and translated versions side-by-side

---

## Step 4: Switch Between Learning Views

1. After highlighting some words and sentences, explore the tabs:
2. Click "📖 Reading" to see your article with highlights
3. Click "📝 Vocabulary" to review all your saved words in a grid
4. Click "💬 Sentences" to see all your saved sentences
5. Try keyboard shortcuts: Press R for Reading, V for Vocabulary, S for Sentences

---

## Step 5: Customize Your Learning

1. Click the settings icon (gear or menu)
2. Choose which language you're learning (e.g., Spanish)
3. Choose your native language for translations (e.g., English)
4. Slide the difficulty level to match your skill (1=beginner, 10=advanced)
5. Turn auto-highlight on or off based on your preference
6. Click "Save Settings" and reopen to confirm they stuck

---

## Step 6: Study Your Vocabulary Different Ways

1. Go to the Vocabulary tab with some saved words
2. Click "Both Languages (A + B)" to see word and translation together
3. Click "Learning Only (A only)" to test yourself (translation hidden)
4. Click "Native Only (B only)" to practice recall (original word hidden)
5. Click any card to hear the pronunciation

---

## Step 7: Practice Pronunciation

1. Open an article in a language you're learning
2. Highlight some words and sentences
3. Click any highlighted word to hear it spoken
4. Click the speaker icon on sentence cards to hear full sentences
5. Use the stop button if you need to pause playback

---

## Step 8: Save and Backup Your Progress

1. After learning from a few articles, open settings
2. Check the Storage section to see how much you've saved
3. Click "Export Data" to download your vocabulary as a file
4. Click "Clear All Data" if you want to start fresh (confirms twice!)
5. Click "Import Data" to restore from a previous backup
6. Verify your words and sentences came back

---

## Step 9: Navigate Long Articles

1. Open a longer article that splits into multiple parts
2. Click the "Next" button to read the next section
3. Click "Previous" to go back
4. Use arrow keys on your keyboard (→ for next, ← for previous)
5. Watch the part indicator (e.g., "Part 2 of 4") update as you navigate

---

## Step 10: See How Errors Are Handled

**A. Try on a page with no article**: Go to `chrome://extensions/` → Click icon → See helpful error

**B. Try on an image page**: Open an image-only page → Click icon → See error message

**C. Without AI enabled**: Disable Chrome AI → Try processing → See clear instructions

**D. Without internet**: Disconnect wifi → Try processing → See network error

**E. Select too little text**: Highlight just 2-3 letters → Nothing happens or see helpful tip

---

## Quick 5-Minute Check

1. Install the extension
2. Open any news article and click the extension icon
3. Highlight 2-3 words you want to learn
4. Highlight one full sentence
5. Switch between Reading, Vocabulary, and Sentences tabs
6. Click a word to hear it pronounced
7. Open settings and change one preference

If everything works smoothly, you're ready to start learning!

---

## What Good Performance Looks Like

- Extension feels snappy and responsive
- Articles process in 5-15 seconds
- Switching between tabs is instant
- Memory stays reasonable (check with Shift+Esc if curious)
- Your vocabulary collection grows without slowing down

---

## If Something Goes Wrong

Share these details:

- Your Chrome version: Check at `chrome://version/`
- Your computer: Windows, Mac, or Linux
- What you were doing step-by-step
- What you expected vs what actually happened
- Any error messages you saw (press F12 to see console)
- Screenshot if it helps show the problem
- The article URL (if you're comfortable sharing)
