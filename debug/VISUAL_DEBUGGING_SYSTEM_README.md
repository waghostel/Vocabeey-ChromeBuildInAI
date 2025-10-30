# Visual Debugging System

Complete visual debugging system for Chrome extension testing with Playwright MCP, featuring screenshot capture, accessibility snapshots, and organized artifact management.

## Overview

The Visual Debugging System provides automated screenshot and snapshot capture at key workflow points during extension testing. It organizes all debugging artifacts in timestamped session directories for easy review and comparison.

**Requirements Addressed:** 5.1, 5.2, 5.3, 5.4, 5.5

## Features

### Screenshot Capture (Requirement 5.1, 5.2)

- Capture screenshots at key workflow points
- Support for full-page and viewport screenshots
- Descriptive filenames with timestamps
- Organized by scenario and capture point

### Accessibility Snapshots (Requirement 5.3)

- Text-based page structure capture
- Element reference extraction (uid)
- Easy diffing between snapshots
- Interactive element detection

### Artifact Organization (Requirement 5.4, 5.5)

- Timestamped session directories
- Organized by screenshot/snapshot type
- Console logs and network requests
- Artifact index for easy navigation

## Architecture

```
debug/
├── visual-debugging-system.ts       # Core system implementation
├── visual-debugging-workflow.ts     # Workflow integration
├── run-visual-debugging-workflow.ts # Execution script
└── playwright-reports/              # Output directory
    └── session-YYYYMMDD-HHMMSS/    # Session directory
        ├── screenshots/             # Screenshot files
        ├── snapshots/               # Snapshot text files
        ├── logs/                    # Console and network logs
        ├── artifact-index.json      # Artifact metadata
        ├── workflow-documentation.md
        ├── execution-guide.md
        ├── snapshot-comparison.md
        └── screenshot-gallery.html
```

## Key Components

### VisualDebuggingSystem Class

Main class for managing visual debugging artifacts.

```typescript
const debugSystem = new VisualDebuggingSystem();

// Get screenshot parameters for MCP call
const screenshotParams = debugSystem.getScreenshotParameters({
  capturePoint: CapturePoint.EXTENSION_LOADED,
  description: 'Extension loaded state',
  scenario: 'extension-test',
  fullPage: false,
});

// Record screenshot capture
debugSystem.recordScreenshot(config, pageUrl);

// Record snapshot capture
debugSystem.recordSnapshot(config, snapshotData, pageUrl);

// Save console logs
debugSystem.saveConsoleLogs(logs, scenario);

// Save network requests
debugSystem.saveNetworkRequests(requests, scenario);
```

### Capture Points

Predefined capture points for consistent workflow tracking:

- `EXTENSION_LOADED` - After extension loads
- `CONTENT_SCRIPT_INJECTED` - After content script injection
- `ARTICLE_PAGE_INITIAL` - Before article processing
- `ARTICLE_PROCESSING_START` - When processing begins
- `ARTICLE_PROCESSING_COMPLETE` - After processing finishes
- `LEARNING_INTERFACE_OPENED` - When UI opens
- `LEARNING_INTERFACE_RENDERED` - After UI renders
- `VOCABULARY_HIGHLIGHTED` - Vocabulary highlighting active
- `TRANSLATION_POPUP` - Translation popup displayed
- `SENTENCE_MODE_ACTIVE` - Sentence mode enabled
- `TTS_ACTIVATED` - TTS button clicked
- `ERROR_STATE` - Error occurred

## Usage

### Basic Usage

```typescript
import { VisualDebuggingSystem, CapturePoint } from './visual-debugging-system';

// Initialize system
const debugSystem = new VisualDebuggingSystem();

// Get MCP parameters for screenshot
const params = debugSystem.getScreenshotParameters({
  capturePoint: CapturePoint.EXTENSION_LOADED,
  description: 'Extension loaded on chrome://extensions',
  fullPage: false,
});

// Make MCP call with parameters
// mcp_playwright_browser_take_screenshot(params.parameters)

// Record the capture
debugSystem.recordScreenshot(
  {
    capturePoint: CapturePoint.EXTENSION_LOADED,
    description: 'Extension loaded on chrome://extensions',
    fullPage: false,
  },
  'chrome://extensions'
);
```

### Complete Workflow

```typescript
import { generateVisualDebuggingWorkflow } from './visual-debugging-workflow';

// Generate complete workflow
const workflow = generateVisualDebuggingWorkflow(debugSystem, 'my-test');

// Execute each step
workflow.forEach(step => {
  console.log(`Executing: ${step.name}`);

  // Execute MCP calls
  step.mcpCalls.forEach(call => {
    // Make MCP call through Kiro agent
    console.log(`  - ${call.tool}`);
  });
});
```

### Running the Workflow

```bash
# Generate workflow and documentation
npx ts-node debug/run-visual-debugging-workflow.ts
```

This will:

1. Create a new session directory
2. Generate workflow documentation
3. Create execution guide
4. Save MCP call sequence
5. Prepare artifact directories

## Workflow Steps

The complete visual debugging workflow includes 10 key steps:

1. **Extension Loaded** - Verify extension installation
2. **Content Script Injected** - Check content script injection
3. **Article Page Initial** - Capture pre-processing state
4. **Article Processing Start** - Monitor processing start
5. **Learning Interface Opened** - Detect UI opening
6. **Learning Interface Rendered** - Verify UI rendering
7. **Vocabulary Highlighted** - Check highlighting
8. **Translation Popup** - Test translation display
9. **Sentence Mode Active** - Verify sentence mode
10. **TTS Activated** - Test audio functionality

Each step includes:

- Screenshot capture
- Accessibility snapshot
- Console log capture
- Relevant MCP calls

## MCP Integration

### Screenshot Capture

```typescript
// Get parameters
const params = debugSystem.getScreenshotParameters(config);

// MCP call
mcp_playwright_browser_take_screenshot({
  filename: params.parameters.filename,
  fullPage: params.parameters.fullPage,
  type: 'png',
});
```

### Snapshot Capture

```typescript
// Get parameters
const params = debugSystem.getSnapshotParameters();

// MCP call
const snapshot = mcp_playwright_browser_snapshot();

// Record snapshot
debugSystem.recordSnapshot(config, snapshot, pageUrl);
```

### Console Logs

```typescript
// Capture console messages
const logs = mcp_playwright_browser_console_messages({ onlyErrors: false });

// Save to file
debugSystem.saveConsoleLogs(logs, 'scenario-name');
```

### Network Requests

```typescript
// Capture network requests
const requests = mcp_playwright_browser_network_requests();

// Save to file
debugSystem.saveNetworkRequests(requests, 'scenario-name');
```

## Artifact Organization

### Directory Structure

```
session-20241030-143022/
├── screenshots/
│   ├── 1730304622000-extension-loaded.png
│   ├── 1730304625000-content-script-injected.png
│   └── 1730304630000-learning-interface-rendered.png
├── snapshots/
│   ├── 1730304622000-extension-loaded.txt
│   ├── 1730304625000-content-script-injected.txt
│   └── 1730304630000-learning-interface-rendered.txt
├── logs/
│   ├── console-logs.json
│   └── network-requests.json
├── artifact-index.json
├── workflow-documentation.md
├── execution-guide.md
├── snapshot-comparison.md
└── screenshot-gallery.html
```

### Artifact Index

The `artifact-index.json` file contains metadata for all artifacts:

```json
{
  "sessionId": "session-20241030-143022",
  "timestamp": 1730304622000,
  "screenshots": [
    {
      "capturePoint": "extension-loaded",
      "timestamp": 1730304622000,
      "filename": "1730304622000-extension-loaded.png",
      "fullPath": "debug/playwright-reports/session-20241030-143022/screenshots/1730304622000-extension-loaded.png",
      "description": "Extension loaded on chrome://extensions",
      "fullPage": false
    }
  ],
  "snapshots": [...],
  "directories": {
    "screenshots": "debug/playwright-reports/session-20241030-143022/screenshots",
    "snapshots": "debug/playwright-reports/session-20241030-143022/snapshots",
    "logs": "debug/playwright-reports/session-20241030-143022/logs"
  }
}
```

## Reports

### Screenshot Gallery

HTML gallery for visual review of all screenshots:

```bash
# Open in browser
open debug/playwright-reports/session-YYYYMMDD-HHMMSS/screenshot-gallery.html
```

Features:

- Grid layout with thumbnails
- Click to view full size
- Metadata display
- Organized by capture point

### Snapshot Comparison

Markdown report for comparing snapshots:

```bash
# View comparison report
cat debug/playwright-reports/session-YYYYMMDD-HHMMSS/snapshot-comparison.md
```

Includes:

- Snapshots grouped by capture point
- Element counts
- Interactive element detection
- Diff instructions

### Workflow Documentation

Complete workflow documentation with MCP calls:

```bash
# View workflow docs
cat debug/playwright-reports/session-YYYYMMDD-HHMMSS/workflow-documentation.md
```

## Best Practices

### Screenshot Capture

1. **Use full-page screenshots** for layout verification
2. **Use viewport screenshots** for specific UI elements
3. **Capture before and after** state changes
4. **Use descriptive names** for easy identification

### Snapshot Capture

1. **Capture at same points** as screenshots
2. **Save snapshots as text files** for easy diffing
3. **Extract element references** for interaction testing
4. **Compare snapshots** to detect unexpected changes

### Artifact Organization

1. **Use scenario names** to group related tests
2. **Keep session directories** for historical comparison
3. **Review artifact index** for quick navigation
4. **Clean up old sessions** periodically

## Troubleshooting

### Screenshots Not Captured

- Verify Playwright MCP connection
- Check browser is running
- Ensure proper file permissions
- Review console for errors

### Snapshots Empty

- Verify page is loaded
- Check snapshot tool availability
- Ensure proper timing (wait for page load)
- Review MCP call parameters

### Artifacts Not Organized

- Check directory permissions
- Verify session initialization
- Review file paths
- Check for file system errors

## Examples

### Example 1: Basic Screenshot Capture

```typescript
const debugSystem = new VisualDebuggingSystem();

// Capture extension loaded state
const params = debugSystem.getScreenshotParameters({
  capturePoint: CapturePoint.EXTENSION_LOADED,
  description: 'Extension loaded',
  fullPage: false,
});

// Make MCP call (through Kiro agent)
// Result: Screenshot saved to screenshots/ directory
```

### Example 2: Complete Workflow

```typescript
const debugSystem = new VisualDebuggingSystem();
const workflow = generateVisualDebuggingWorkflow(debugSystem, 'full-test');

// Execute workflow
// Result: 10 screenshots, 10 snapshots, organized artifacts
```

### Example 3: Scenario-Based Testing

```typescript
const debugSystem = new VisualDebuggingSystem();

// Test vocabulary workflow
const vocabScenario = 'vocabulary-test';
debugSystem.recordScreenshot({
  capturePoint: CapturePoint.VOCABULARY_HIGHLIGHTED,
  description: 'Vocabulary highlighted',
  scenario: vocabScenario,
  fullPage: true,
});

// Organize by scenario
const artifacts = debugSystem.organizeByScenario(vocabScenario);
console.log(`Vocabulary test: ${artifacts.screenshots.length} screenshots`);
```

## API Reference

### VisualDebuggingSystem

#### Constructor

```typescript
constructor(baseDir?: string)
```

#### Methods

- `getScreenshotParameters(config: ScreenshotConfig)` - Get MCP parameters
- `recordScreenshot(config, pageUrl?)` - Record screenshot metadata
- `getSnapshotParameters()` - Get snapshot MCP parameters
- `recordSnapshot(config, data, pageUrl?)` - Record snapshot metadata
- `saveConsoleLogs(logs, scenario?)` - Save console logs
- `saveNetworkRequests(requests, scenario?)` - Save network requests
- `getArtifacts()` - Get all artifacts
- `organizeByScenario(scenario)` - Get artifacts by scenario
- `generateArtifactIndex()` - Generate index file
- `getReportDir()` - Get report directory path
- `getSessionId()` - Get session ID

### Workflow Functions

- `generateVisualDebuggingWorkflow(debugSystem, scenario)` - Generate workflow
- `generateMCPCallSequence(workflow)` - Generate MCP calls
- `generateWorkflowDocumentation(workflow)` - Generate docs

## Related Documentation

- [Article Processing Workflow](./ARTICLE_PROCESSING_WORKFLOW_README.md)
- [Content Script Testing](./CONTENT_SCRIPT_TESTING_README.md)
- [Playwright MCP Guide](./playwright-reports/mcp-call-guide.md)
- [Debugging Best Practices](./DEBUGGING_BEST_PRACTICES.md)

## Requirements Mapping

- **5.1** - Screenshot capture at key workflow points ✅
- **5.2** - Descriptive names and timestamps ✅
- **5.3** - Accessibility snapshot system ✅
- **5.4** - Timestamped report directories ✅
- **5.5** - Organized artifacts with logs ✅
