# Playwright Extension Testing Scripts

This directory contains scripts for loading and validating the Language Learning Chrome Extension using Playwright MCP.

## Overview

The extension validation system consists of three main components:

1. **Extension Loading** - Scripts to load the extension in a browser
2. **Context Verification** - Verify all extension contexts are working
3. **Console Error Analysis** - Capture and analyze console errors

## Scripts

### Main Validation Script

**File:** `run-extension-validation.ts`

Complete validation workflow that:

- Verifies prerequisites (dist/ directory, manifest.json, key files)
- Documents extension loading workflow
- Generates MCP call guides
- Creates comprehensive reports

**Usage:**

```bash
npx tsx debug/run-extension-validation.ts
```

**With Extension ID:**

```bash
EXTENSION_ID=your_extension_id npx tsx debug/run-extension-validation.ts
```

### Extension Context Verifier

**File:** `extension-context-verifier.ts`

Verifies all extension contexts:

- Service Worker registration and status
- Content Script injection capability
- Offscreen Document availability
- UI Pages accessibility

**Usage:**

```bash
npx tsx debug/extension-context-verifier.ts YOUR_EXTENSION_ID
```

### Console Error Analyzer

**File:** `console-error-analyzer.ts`

Analyzes console messages and categorizes errors:

- Loading errors (critical)
- Import errors (critical)
- Path errors (high)
- Runtime errors (medium)

**Usage:**

```bash
npx tsx debug/console-error-analyzer.ts
```

### Extension Loader

**File:** `playwright-extension-loader.ts`

Core extension loading logic and validation utilities.

### Load Extension with Playwright

**File:** `load-extension-with-playwright.ts`

Documents MCP calls needed for extension loading and generates workflow documentation.

**Usage:**

```bash
npx tsx debug/load-extension-with-playwright.ts
```

## Workflow

### 1. Build Extension

```bash
pnpm build
```

This creates the `dist/` directory with compiled extension files.

### 2. Run Validation

```bash
npx tsx debug/run-extension-validation.ts
```

This generates:

- `debug/playwright-reports/validation-report.md` - Overall validation status
- `debug/playwright-reports/loading-workflow.md` - Extension loading instructions
- `debug/playwright-reports/console-analysis-guide.md` - Console error analysis guide
- `debug/playwright-reports/mcp-call-guide.json` - MCP calls for testing
- `debug/playwright-reports/mcp-call-guide.md` - MCP calls documentation

### 3. Manual Extension Loading

Since Playwright MCP cannot automate the file picker dialog, you must manually load the extension:

1. Open Chrome/Chromium browser
2. Navigate to `chrome://extensions`
3. Enable "Developer mode" toggle (top right)
4. Click "Load unpacked"
5. Select the `dist/` directory
6. Copy the Extension ID (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### 4. Run Validation with Extension ID

```bash
EXTENSION_ID=your_extension_id npx tsx debug/run-extension-validation.ts
```

This will perform full context verification.

### 5. Use MCP Calls for Testing

Follow the MCP call guide to test the extension:

```bash
# View the guide
cat debug/playwright-reports/mcp-call-guide.md
```

The guide includes MCP calls for:

- Navigating to test pages
- Checking content script injection
- Capturing console messages
- Taking screenshots
- Testing UI pages

## Generated Reports

### Validation Report

**Location:** `debug/playwright-reports/validation-report.md`

Contains:

- Overall validation status
- Completed validation steps
- Next steps
- Generated files list

### Loading Workflow

**Location:** `debug/playwright-reports/loading-workflow.md`

Contains:

- Manual loading instructions
- Automated validation steps
- MCP call examples

### Console Analysis Guide

**Location:** `debug/playwright-reports/console-analysis-guide.md`

Contains:

- Error categories and examples
- Fix suggestions
- Analysis process

### MCP Call Guide

**Location:** `debug/playwright-reports/mcp-call-guide.md`

Contains:

- Step-by-step MCP calls
- Parameters for each call
- Purpose of each step

## Error Categories

### Loading Errors (CRITICAL)

Extension failed to load or manifest parsing errors.

**Example:**

```
Failed to load extension from: /path/to/dist
```

**Fix:** Verify manifest.json and all referenced files exist

### Import Errors (CRITICAL)

Module resolution failures or missing .js extensions.

**Example:**

```
Failed to resolve module specifier "./utils/storage-manager"
```

**Fix:** Add .js extension: `"./utils/storage-manager.js"`

### Path Errors (HIGH)

404 file not found or incorrect file paths.

**Example:**

```
Failed to fetch: chrome-extension://abc123/content/content-script.js (404)
```

**Fix:** Verify file exists and path is correct

### Runtime Errors (MEDIUM)

Undefined variables, null references, or permission errors.

**Example:**

```
Uncaught TypeError: Cannot read property 'sendMessage' of undefined
```

**Fix:** Add null checks and verify API availability

## Troubleshooting

### Extension Not Loading

1. Verify `dist/` directory exists: `ls dist/`
2. Check manifest.json is valid: `cat dist/manifest.json`
3. Rebuild extension: `pnpm build`
4. Check for build errors in console

### Context Verification Fails

1. Ensure extension is loaded in Chrome
2. Verify Extension ID is correct
3. Check chrome://extensions for errors
4. Review service worker status at chrome://serviceworker-internals

### Console Errors

1. Run console error analyzer
2. Review categorized errors
3. Follow fix suggestions
4. Rebuild and re-test

## Integration with Kiro Agent

These scripts are designed to work with Kiro agent's MCP access. The agent can:

1. Run validation scripts
2. Read generated reports
3. Execute MCP calls for testing
4. Analyze console errors
5. Provide fix recommendations

## Requirements

- Node.js 18+
- pnpm package manager
- Playwright MCP server configured
- Extension built in dist/ directory

## Related Files

- `.kiro/specs/playwright-extension-debugging/` - Spec files
- `debug/playwright-reports/` - Generated reports
- `dist/` - Built extension files
- `mcp-config.json` - MCP server configuration

## Next Steps

1. Review validation report
2. Fix identified issues
3. Rebuild extension
4. Re-run validation
5. Test with MCP calls
6. Verify all contexts work correctly

## Support

For issues or questions:

1. Review generated reports
2. Check console error analysis
3. Follow fix suggestions
4. Consult MCP call guide
5. Review extension loading workflow
