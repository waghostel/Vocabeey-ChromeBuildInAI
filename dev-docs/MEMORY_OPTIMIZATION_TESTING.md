# Memory Optimization Testing Guide

**Date:** November 4, 2025  
**Purpose:** Verify Phase 1 memory optimization fixes

---

## Quick Test Checklist

### ✅ Test 1: AI Session Cleanup

**Goal:** Verify AI sessions are destroyed after use

**Steps:**

1. Open Chrome DevTools Console
2. Load an article
3. Run: `window.memoryProfiler.check('before-translation')`
4. Translate several words (hover over highlights)
5. Run: `window.memoryProfiler.check('after-translation')`
6. Wait 30 seconds
7. Run: `window.memoryProfiler.growth()`

**Expected Result:**

- Memory growth should be < 5MB
- No continuous growth after translations complete

---

### ✅ Test 2: Highlight Cleanup

**Goal:** Verify highlights are cleaned up when switching articles

**Steps:**

1. Open Console: `window.memoryProfiler.check('article1-start')`
2. Load article 1
3. Create 20+ vocabulary highlights
4. Check memory: `window.memoryProfiler.check('article1-highlighted')`
5. Load article 2 (click extension icon on new page)
6. Check memory: `window.memoryProfiler.check('article2-loaded')`
7. Check growth: `window.memoryProfiler.growth()`

**Expected Result:**

- Memory should not grow significantly between articles
- Growth should be < 1MB per article
- Console should show "🧹 Cleaning up highlight manager..."

---

### ✅ Test 3: Cache Eviction

**Goal:** Verify cache stays under 5MB limit

**Steps:**

1. Open Console
2. Load an article
3. Translate 50+ different words
4. Check console for cache messages
5. Look for: "📦 Cache set: ..." messages
6. Look for: "🗑️ Evicting LRU cache item: ..." messages

**Expected Result:**

- Should see eviction messages when cache fills up
- Cache size should stay under 5MB
- No errors about storage quota

---

### ✅ Test 4: Article Data Release

**Goal:** Verify article data is released when loading new articles

**Steps:**

1. Start monitoring: `window.memoryProfiler.start()`
2. Load article 1
3. Wait 1 minute
4. Load article 2
5. Wait 1 minute
6. Load article 3
7. Wait 1 minute
8. Check growth: `window.memoryProfiler.growth()`
9. Export data: `window.memoryProfiler.export()`

**Expected Result:**

- Memory should stabilize after each article
- Total growth should be < 3MB for 3 articles
- No continuous upward trend

---

### ✅ Test 5: Memory Profiler

**Goal:** Verify memory profiler works correctly

**Steps:**

1. Open Console
2. Run: `window.memoryProfiler.check('test')`
3. Run: `window.memoryProfiler.start()`
4. Wait 2 minutes
5. Run: `window.memoryProfiler.stop()`
6. Run: `window.memoryProfiler.snapshots()`
7. Run: `window.memoryProfiler.export()`

**Expected Result:**

- Should see memory snapshots logged every minute
- `snapshots()` should return array of snapshots
- `export()` should return CSV data
- No errors

---

## Detailed Testing Scenarios

### Scenario 1: Heavy Usage (30 minutes)

**Setup:**

1. Open extension on a long article
2. Start memory monitoring: `window.memoryProfiler.start()`

**Actions:**

1. Read through article (5 min)
2. Highlight 30+ vocabulary words
3. Translate all highlights
4. Switch to sentence mode
5. Highlight 10+ sentences
6. Navigate between article parts
7. Load a new article
8. Repeat steps 2-6
9. Load a third article
10. Repeat steps 2-6

**Measurements:**

- Take snapshots every 5 minutes
- Check memory growth
- Look for memory leaks

**Expected Results:**

- Memory should stabilize around 4-5MB
- No continuous growth
- No service worker terminations
- No UI lag

---

### Scenario 2: Rapid Article Switching

**Setup:**

1. Prepare 5 different articles (open in tabs)
2. Start monitoring: `window.memoryProfiler.start()`

**Actions:**

1. Click extension on article 1
2. Wait 10 seconds
3. Click extension on article 2
4. Wait 10 seconds
5. Repeat for articles 3, 4, 5
6. Go back to article 1
7. Repeat cycle 3 times

**Measurements:**

- Check memory after each article
- Look for cleanup messages in console
- Check for memory leaks

**Expected Results:**

- Memory should not grow with each cycle
- Should see cleanup messages
- Memory should stabilize around 3-4MB

---

### Scenario 3: Translation Stress Test

**Setup:**

1. Load article with 100+ unique words
2. Start monitoring: `window.memoryProfiler.start()`

**Actions:**

1. Highlight 50 vocabulary words
2. Hover over each to trigger translation
3. Wait for all translations to complete
4. Check cache size
5. Highlight 50 more words
6. Hover over each
7. Check cache size again

**Measurements:**

- Monitor cache eviction messages
- Check memory growth
- Verify translations are cached

**Expected Results:**

- Cache should evict old items
- Memory should stay under 5MB for cache
- Translations should still work
- No errors

---

## Console Commands Reference

### Memory Profiler

```javascript
// Take a snapshot
window.memoryProfiler.check('my-label');

// Start monitoring (logs every minute)
window.memoryProfiler.start();

// Stop monitoring
window.memoryProfiler.stop();

// Check memory growth
window.memoryProfiler.growth();
// Returns: { absolute: 1234567, percentage: 15.2, formatted: "1.18MB (15.2%)" }

// Get all snapshots
window.memoryProfiler.snapshots();

// Export as CSV
const csv = window.memoryProfiler.export();
console.log(csv);
```

### Article Diagnostics

```javascript
// Diagnose current article structure
window.diagnoseArticle();
```

---

## Success Criteria

### Phase 1 Goals

- ✅ Baseline memory < 2.5MB
- ✅ Memory growth < 1MB per article
- ✅ Cache stays < 5MB
- ✅ No memory leaks in 30-minute test
- ✅ No service worker terminations
- ✅ Smooth UI performance

### Warning Signs

- ❌ Memory growing continuously
- ❌ Cache exceeding 5MB
- ❌ Service worker terminations
- ❌ UI lag or freezing
- ❌ Console errors about memory
- ❌ Extension becoming unresponsive

---

## Troubleshooting

### Issue: Memory Still Growing

**Possible Causes:**

- AI sessions not being destroyed
- Highlights not being cleaned up
- Cache not evicting

**Debug Steps:**

1. Check console for cleanup messages
2. Look for "🧹 Destroying..." messages
3. Check for "🗑️ Evicting..." messages
4. Verify `cleanupHighlightManager()` is called

### Issue: Cache Exceeding 5MB

**Possible Causes:**

- Eviction not working
- Size estimation incorrect
- Too many large items

**Debug Steps:**

1. Check console for eviction messages
2. Verify `MAX_CACHE_SIZE_BYTES` is set
3. Check `estimateSize()` function
4. Look for large cached items

### Issue: Service Worker Terminating

**Possible Causes:**

- Memory usage too high
- Long-running operations
- Not handling restarts

**Debug Steps:**

1. Check service worker memory
2. Look for long operations
3. Verify state is persisted
4. Check for memory leaks

---

## Reporting Issues

If you find issues, please report with:

1. **Memory Snapshots**

   ```javascript
   window.memoryProfiler.export();
   ```

2. **Console Logs**
   - Copy all console output
   - Include timestamps

3. **Steps to Reproduce**
   - Exact actions taken
   - Articles used
   - Time taken

4. **Expected vs Actual**
   - What should happen
   - What actually happened

5. **Environment**
   - Chrome version
   - OS
   - Extension version

---

## Next Steps

After Phase 1 testing:

1. Verify all tests pass
2. Monitor in production
3. Collect user feedback
4. Plan Phase 2 optimizations

**Phase 2 Preview:**

- Lazy loading of article parts
- Virtual scrolling for cards
- IndexedDB for highlights
- Further optimizations
