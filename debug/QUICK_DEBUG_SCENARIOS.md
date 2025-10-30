# Quick Debug Scenarios Reference

## Common Debugging Scenarios

This is a quick reference for the most common debugging scenarios. For detailed information, see [PLAYWRIGHT_DEBUGGING_GUIDE.md](./PLAYWRIGHT_DEBUGGING_GUIDE.md).

## Scenario 1: Extension Won't Load

**Symptoms:**

- Extension not visible in chrome://extensions
- "Failed to load extension" error
- Service worker won't start

**Quick Fix:**

```bash
# 1. Check build output
pnpm build
ls -la dist/

# 2. Validate extension
npx tsx debug/run-extension-validation.ts

# 3. Check report for specific errors
cat debug/playwright-reports/latest/report.md
```

**Common Causes:**

- Missing files in dist/
- Invalid manifest.json
- Incorrect file paths in manifest

## Scenario 2: Module Import Errors

**Symptoms:**

- "Failed to resolve module specifier"
- 404 errors for .js files
- Service worker registration fails

**Quick Fix:**

```bash
# 1. Run validation to identify path issues
npx tsx debug/run-extension-validation.ts

# 2. Check import-path-report.json
cat debug/import-path-report.json

# 3. Fix imports by adding .js extensions
# Example: './utils/storage-manager' → './utils/storage-manager.js'

# 4. Rebuild
pnpm build
```

**Common Causes:**

- Missing .js extensions in imports
- Incorrect relative paths (wrong number of ../)
- Absolute paths instead of relative

## Scenario 3: Content Script Not Working

**Symptoms:**

- Content script doesn't inject
- No DOM manipulation occurs
- Extension action has no effect

**Quick Fix:**

```bash
# 1. Test content script injection
npx tsx debug/test-content-script-injection.ts

# 2. Check manifest content_scripts configuration
cat dist/manifest.json | grep -A 10 content_scripts

# 3. Verify file exists
ls -la dist/content/content-script.js

# 4. Check console for CSP errors
# Look in debug/playwright-reports/*/console-logs.json
```

**Common Causes:**

- Incorrect match patterns in manifest
- CSP violations on target pages
- Content script file path incorrect
- Script execution timing issues

## Scenario 4: Article Processing Fails

**Symptoms:**

- Processing hangs or times out
- No learning interface appears
- AI service errors

**Quick Fix:**

```bash
# 1. Test article processing workflow
npx tsx debug/test-article-processing-workflow.ts

# 2. Check screenshots to see where it fails
ls -la debug/playwright-reports/*/screenshots/

# 3. Review console logs for AI errors
cat debug/playwright-reports/*/console-logs.json | grep -i "ai\|error"

# 4. Verify offscreen document loads
# Check validation report for offscreen context status
```

**Common Causes:**

- Chrome AI APIs not available
- Offscreen document not loading
- Message passing failures
- Network connectivity issues

## Scenario 5: UI Not Rendering

**Symptoms:**

- Blank page after processing
- Learning interface doesn't appear
- UI elements missing

**Quick Fix:**

```bash
# 1. Test UI rendering
npx tsx debug/test-user-interaction.ts

# 2. Check screenshots
open debug/playwright-reports/*/screenshots/04-learning-ui.png

# 3. Look for JavaScript errors
cat debug/playwright-reports/*/console-logs.json | grep -i "error"

# 4. Verify HTML and JS files exist
ls -la dist/ui/
```

**Common Causes:**

- JavaScript errors in UI code
- Missing CSS or asset files
- DOM not ready when script runs
- Incorrect file paths in HTML

## Scenario 6: Performance Issues

**Symptoms:**

- Slow article processing
- UI feels sluggish
- High memory usage

**Quick Fix:**

```bash
# 1. Run performance monitoring
npx tsx debug/run-performance-monitoring.ts

# 2. Check performance metrics in report
cat debug/playwright-reports/*/report.md | grep -A 20 "Performance"

# 3. Identify bottlenecks
# Look for longest duration operations

# 4. Profile specific areas
# Use Chrome DevTools for detailed profiling
```

**Common Causes:**

- Sequential processing instead of parallel
- No caching of repeated operations
- Memory leaks
- Inefficient algorithms

## Scenario 7: Vocabulary Highlighting Not Working

**Symptoms:**

- No vocabulary highlighted in article
- Translation popups don't appear
- Vocabulary cards empty

**Quick Fix:**

```bash
# 1. Test vocabulary workflow
npx tsx debug/test-user-interaction.ts

# 2. Check AI processing results
# Look for vocabulary extraction in console logs

# 3. Verify highlighting logic
# Check screenshots for visual confirmation

# 4. Test on different articles
# Some articles may not have suitable vocabulary
```

**Common Causes:**

- AI processing failed
- Vocabulary extraction returned empty
- CSS highlighting not applied
- DOM manipulation errors

## Scenario 8: TTS Not Working

**Symptoms:**

- No audio playback
- TTS buttons don't respond
- Audio errors in console

**Quick Fix:**

```bash
# 1. Test TTS functionality
npx tsx debug/test-user-interaction.ts

# 2. Check for audio-related errors
cat debug/playwright-reports/*/console-logs.json | grep -i "audio\|tts"

# 3. Verify TTS service initialization
# Check service worker logs

# 4. Test browser TTS support
# Ensure browser supports Web Speech API
```

**Common Causes:**

- TTS service not initialized
- Browser doesn't support Web Speech API
- Audio permissions not granted
- TTS language not available

## Scenario 9: Settings Not Persisting

**Symptoms:**

- Settings reset after reload
- Changes don't save
- Default values always used

**Quick Fix:**

```bash
# 1. Test settings system
npx tsx debug/test-user-interaction.ts

# 2. Check storage operations
# Look for storage errors in console

# 3. Verify storage permissions
cat dist/manifest.json | grep -A 5 permissions

# 4. Test storage manager
# Check if data is being written
```

**Common Causes:**

- Storage permission missing
- Storage quota exceeded
- Storage manager errors
- Incorrect storage key usage

## Scenario 10: Network Errors

**Symptoms:**

- API calls failing
- Timeout errors
- Network request errors

**Quick Fix:**

```bash
# 1. Run validation with network monitoring
npx tsx debug/run-extension-validation.ts

# 2. Check network requests
cat debug/playwright-reports/*/network-requests.json

# 3. Look for failed requests
# Check status codes and error messages

# 4. Verify API endpoints
# Test endpoints manually
```

**Common Causes:**

- API endpoint incorrect
- CORS issues
- Network connectivity problems
- API rate limiting

## Quick Command Reference

### Essential Commands

```bash
# Build extension
pnpm build

# Quick validation
npx tsx debug/run-extension-validation.ts

# Test specific area
npx tsx debug/test-content-script-injection.ts
npx tsx debug/test-article-processing-workflow.ts
npx tsx debug/test-user-interaction.ts
npx tsx debug/test-error-handling-edge-cases.ts

# Performance check
npx tsx debug/run-performance-monitoring.ts

# Full report
npx tsx debug/run-comprehensive-report-generator.ts
```

### Viewing Results

```bash
# View latest report
cat debug/playwright-reports/latest/report.md

# View console logs
cat debug/playwright-reports/latest/console-logs.json

# View network requests
cat debug/playwright-reports/latest/network-requests.json

# View screenshots
ls -la debug/playwright-reports/latest/screenshots/

# Open screenshot (macOS)
open debug/playwright-reports/latest/screenshots/01-extension-loaded.png

# Open screenshot (Windows)
start debug/playwright-reports/latest/screenshots/01-extension-loaded.png
```

### Debugging Workflow

```bash
# 1. Build
pnpm build

# 2. Validate
npx tsx debug/run-extension-validation.ts

# 3. If issues found, check report
cat debug/playwright-reports/latest/report.md

# 4. Fix issues in source code

# 5. Rebuild and retest
pnpm build && npx tsx debug/run-extension-validation.ts
```

## Troubleshooting Decision Tree

```
Issue Detected
    ↓
Does extension load?
    ├─ No → Run extension validation
    │       Check manifest and paths
    │       Fix and rebuild
    │
    └─ Yes → Does content script inject?
            ├─ No → Run content script test
            │       Check manifest and CSP
            │       Fix injection issues
            │
            └─ Yes → Does processing work?
                    ├─ No → Run workflow test
                    │       Check AI services
                    │       Fix processing pipeline
                    │
                    └─ Yes → Does UI render?
                            ├─ No → Run UI test
                            │       Check console errors
                            │       Fix UI issues
                            │
                            └─ Yes → Run performance test
                                    Optimize as needed
```

## Getting More Help

- **Detailed Guide**: See [PLAYWRIGHT_DEBUGGING_GUIDE.md](./PLAYWRIGHT_DEBUGGING_GUIDE.md)
- **Report Generator**: See [reports/COMPREHENSIVE_REPORT_GENERATOR_README.md](./reports/COMPREHENSIVE_REPORT_GENERATOR_README.md)
- **Architecture**: See [docs/architecture/](../docs/architecture/)
- **Development**: See [docs/development/](../docs/development/)

## Tips for Efficient Debugging

1. **Always build before testing**: `pnpm build`
2. **Start with validation**: Catches most common issues
3. **Use specific tests**: Don't always run comprehensive tests
4. **Check screenshots first**: Visual issues are obvious
5. **Read console logs**: Error messages are informative
6. **Compare with working state**: Use previous reports
7. **Test incrementally**: Fix one issue at a time
8. **Document solutions**: Help future debugging

## Common Error Messages

| Error Message                        | Likely Cause          | Quick Fix                    |
| ------------------------------------ | --------------------- | ---------------------------- |
| "Failed to resolve module specifier" | Missing .js extension | Add .js to import            |
| "Failed to load extension"           | Invalid manifest      | Check manifest.json          |
| "Refused to execute inline script"   | CSP violation         | Check page CSP               |
| "Cannot read property of null"       | DOM not ready         | Add DOMContentLoaded         |
| "Service worker registration failed" | Import error          | Check service worker imports |
| "Extension context invalidated"      | Extension reloaded    | Reload page                  |
| "Storage quota exceeded"             | Too much data         | Clear cache                  |
| "Network request failed"             | API issue             | Check network tab            |

## Best Practices Checklist

- [ ] Build before every test session
- [ ] Run validation after code changes
- [ ] Check screenshots for visual issues
- [ ] Review console logs for errors
- [ ] Test on multiple page types
- [ ] Monitor performance regularly
- [ ] Document issues and solutions
- [ ] Keep reports organized
- [ ] Use version control for debugging artifacts
- [ ] Share findings with team
