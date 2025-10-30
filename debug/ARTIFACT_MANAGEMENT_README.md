# Artifact Management System

## Overview

The Artifact Management System provides comprehensive organization and reporting for debugging artifacts generated during Playwright extension testing. It creates timestamped session directories, organizes artifacts by scenario, and generates detailed reports.

**Requirements:** 5.4, 5.5

## Features

- **Timestamped Sessions**: Each debugging session gets a unique timestamped directory
- **Scenario Organization**: Artifacts are grouped by test scenario
- **Multiple Artifact Types**: Screenshots, snapshots, console logs, network logs, and reports
- **Artifact Linking**: Related artifacts can be linked together
- **Automated Reports**: Generate markdown reports for each scenario
- **Session Summaries**: Comprehensive overview of all artifacts in a session

## Directory Structure

```
debug/reports/
└── session-YYYYMMDD-HHMMSS/
    ├── screenshots/
    │   ├── extension-loading-2024-01-15T10-30-00.png
    │   ├── content-script-injection-2024-01-15T10-30-15.png
    │   └── article-processing-2024-01-15T10-30-30.png
    ├── snapshots/
    │   ├── extension-loading-2024-01-15T10-30-00.txt
    │   ├── content-script-injection-2024-01-15T10-30-15.txt
    │   └── article-processing-2024-01-15T10-30-30.txt
    ├── logs/
    │   ├── extension-loading-console-2024-01-15T10-30-00.log
    │   ├── content-script-injection-network-2024-01-15T10-30-15.json
    │   └── article-processing-console-2024-01-15T10-30-30.log
    ├── reports/
    │   ├── extension-loading-report-2024-01-15T10-30-05.md
    │   ├── content-script-injection-report-2024-01-15T10-30-20.md
    │   └── article-processing-report-2024-01-15T10-30-35.md
    └── SESSION_SUMMARY.md
```

## Usage

### Basic Setup

```typescript
import { ArtifactManager } from './artifact-management-system';

// Initialize artifact manager
const artifactManager = new ArtifactManager('./debug/reports');

// Get session directory
console.log(`Session: ${artifactManager.getSessionDir()}`);
```

### Saving Screenshots

```typescript
// Capture and save screenshot
const screenshotData = Buffer.from(/* screenshot data */);
const screenshotPath = await artifactManager.saveScreenshot(
  'extension-loading',
  screenshotData,
  'Extension loaded in chrome://extensions'
);
```

### Saving Accessibility Snapshots

```typescript
// Save accessibility snapshot
const snapshotData = `
  heading "Extensions" [level=1]
    button "Developer mode" [pressed=true]
`;
const snapshotPath = await artifactManager.saveSnapshot(
  'extension-loading',
  snapshotData,
  'Extension list accessibility tree'
);
```

### Saving Console Logs

```typescript
// Save console logs
const consoleLogs = [
  '[INFO] Extension loaded',
  '[INFO] Service worker registered',
  '[SUCCESS] Initialization complete',
];
const logPath = await artifactManager.saveConsoleLogs(
  'extension-loading',
  consoleLogs,
  'Extension loading console output'
);
```

### Saving Network Logs

```typescript
// Save network request logs
const networkRequests = [
  { url: 'https://example.com', status: 200, method: 'GET' },
  { url: 'chrome-extension://abc/script.js', status: 200, method: 'GET' },
];
const networkPath = await artifactManager.saveNetworkLogs(
  'content-script-injection',
  networkRequests,
  'Network activity during injection'
);
```

### Linking Related Artifacts

```typescript
// Link related artifacts together
artifactManager.linkArtifacts('after-injection-screenshot.png', [
  'before-injection-screenshot.png',
  'injection-snapshot.txt',
]);
```

### Generating Scenario Reports

```typescript
// Generate report for a scenario
const reportPath = await artifactManager.generateReport(
  'extension-loading',
  'Extension loaded successfully with all components initialized',
  [], // errors (optional)
  [
    // recommendations (optional)
    'Service worker is active',
    'All manifest paths are valid',
    'No console errors detected',
  ]
);
```

### Generating Session Summary

```typescript
// Generate comprehensive session summary
const summaryPath = await artifactManager.generateSessionSummary();
console.log(`Session summary: ${summaryPath}`);
```

### Querying Artifacts

```typescript
// Get all artifacts for a specific scenario
const artifacts = artifactManager.getScenarioArtifacts('extension-loading');
console.log(`Found ${artifacts.length} artifacts for extension-loading`);

// Iterate through artifacts
artifacts.forEach(artifact => {
  console.log(`${artifact.type}: ${artifact.timestamp}`);
  if (artifact.description) {
    console.log(`  Description: ${artifact.description}`);
  }
});
```

## Integration with Visual Debugging System

The Artifact Management System works seamlessly with the Visual Debugging System:

```typescript
import { VisualDebuggingSystem } from './visual-debugging-system';
import { ArtifactManager } from './artifact-management-system';

// Initialize both systems
const visualDebugger = new VisualDebuggingSystem('./debug/visual-artifacts');
const artifactManager = new ArtifactManager('./debug/reports');

// Capture and save in one workflow
async function captureAndOrganize(scenario: string, description: string) {
  // Capture screenshot (using Playwright MCP)
  const screenshot = await captureScreenshot();

  // Save to artifact manager
  await artifactManager.saveScreenshot(scenario, screenshot, description);

  // Capture snapshot
  const snapshot = await captureSnapshot();

  // Save to artifact manager
  await artifactManager.saveSnapshot(scenario, snapshot, description);
}
```

## Report Format

Generated reports follow this markdown structure:

```markdown
# Debug Report: scenario-name

**Session ID:** session-20240115-103000
**Timestamp:** 2024-01-15T10:30:00.000Z

## Summary

[Summary text provided when generating report]

## Errors

1. [Error 1]
2. [Error 2]

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

## Artifacts

### Screenshots

- **2024-01-15T10:30:00**: Extension loaded in chrome://extensions

### Snapshots

- **2024-01-15T10:30:00**: Extension list accessibility tree

### Console Logs

- **2024-01-15T10:30:00**: Extension loading console output
```

## Best Practices

### 1. Consistent Scenario Naming

Use consistent, descriptive scenario names:

- `extension-loading`
- `content-script-injection`
- `article-processing`
- `user-interaction`

### 2. Descriptive Artifact Descriptions

Provide clear descriptions for each artifact:

```typescript
// Good
await artifactManager.saveScreenshot(
  'extension-loading',
  screenshot,
  'Extension loaded in chrome://extensions with developer mode enabled'
);

// Less helpful
await artifactManager.saveScreenshot(
  'extension-loading',
  screenshot,
  'Screenshot'
);
```

### 3. Link Related Artifacts

Link before/after screenshots and related snapshots:

```typescript
// Save before state
const beforePath = await artifactManager.saveScreenshot(
  'content-script-injection',
  beforeScreenshot,
  'Before injection'
);

// Save after state
const afterPath = await artifactManager.saveScreenshot(
  'content-script-injection',
  afterScreenshot,
  'After injection'
);

// Link them
artifactManager.linkArtifacts(afterPath.split('/').pop()!, [
  beforePath.split('/').pop()!,
]);
```

### 4. Generate Reports After Each Scenario

Generate a report immediately after completing each test scenario:

```typescript
// Run test scenario
await testExtensionLoading();

// Generate report
await artifactManager.generateReport(
  'extension-loading',
  'Summary of findings',
  errors,
  recommendations
);
```

### 5. Always Generate Session Summary

Generate a session summary at the end of your debugging session:

```typescript
// After all scenarios complete
await artifactManager.generateSessionSummary();
```

## Example Workflows

### Complete Extension Testing Workflow

```typescript
async function runCompleteTest() {
  const artifactManager = new ArtifactManager('./debug/reports');

  // Test 1: Extension Loading
  const loadScreenshot = await captureExtensionLoad();
  await artifactManager.saveScreenshot(
    'extension-loading',
    loadScreenshot,
    'Extension loaded'
  );

  const loadLogs = await getConsoleLogs();
  await artifactManager.saveConsoleLogs(
    'extension-loading',
    loadLogs,
    'Loading logs'
  );

  await artifactManager.generateReport(
    'extension-loading',
    'Extension loaded successfully',
    [],
    ['All components initialized']
  );

  // Test 2: Content Script Injection
  const injectionScreenshot = await captureInjection();
  await artifactManager.saveScreenshot(
    'content-script-injection',
    injectionScreenshot,
    'Content script injected'
  );

  await artifactManager.generateReport(
    'content-script-injection',
    'Content script working',
    [],
    ['Injection successful']
  );

  // Generate session summary
  await artifactManager.generateSessionSummary();
}
```

## Running Examples

### Basic Example

```bash
npx tsx debug/run-artifact-management-example.ts
```

### Integrated Example

```bash
npx tsx debug/integrated-debugging-example.ts
```

## API Reference

### ArtifactManager

#### Constructor

```typescript
constructor(baseDir: string = './debug/reports')
```

#### Methods

- `saveScreenshot(scenario: string, screenshotData: Buffer, description?: string): Promise<string>`
- `saveSnapshot(scenario: string, snapshotData: string, description?: string): Promise<string>`
- `saveConsoleLogs(scenario: string, logs: string[], description?: string): Promise<string>`
- `saveNetworkLogs(scenario: string, requests: any[], description?: string): Promise<string>`
- `linkArtifacts(artifactName: string, relatedArtifacts: string[]): void`
- `generateReport(scenario: string, summary: string, errors?: string[], recommendations?: string[]): Promise<string>`
- `generateSessionSummary(): Promise<string>`
- `getSessionDir(): string`
- `getScenarioArtifacts(scenario: string): ArtifactMetadata[]`

### Interfaces

#### ArtifactMetadata

```typescript
interface ArtifactMetadata {
  timestamp: string;
  scenario: string;
  type: 'screenshot' | 'snapshot' | 'console-log' | 'network-log' | 'report';
  description?: string;
  relatedArtifacts?: string[];
}
```

#### DebugReport

```typescript
interface DebugReport {
  sessionId: string;
  timestamp: string;
  scenario: string;
  artifacts: ArtifactMetadata[];
  summary: string;
  errors?: string[];
  recommendations?: string[];
}
```

## Troubleshooting

### Directory Permission Issues

If you encounter permission errors:

```typescript
// Ensure base directory is writable
const artifactManager = new ArtifactManager('./debug/reports');
```

### Large Artifact Files

For large screenshots or logs, consider:

- Compressing screenshots before saving
- Splitting large log files
- Using streaming for network logs

### Session ID Conflicts

Session IDs are timestamped to the second. If running multiple tests per second:

```typescript
// Add a unique identifier
const artifactManager = new ArtifactManager(`./debug/reports-${process.pid}`);
```

## Related Documentation

- [Visual Debugging System](./VISUAL_DEBUGGING_SYSTEM_README.md)
- [Article Processing Workflow](./ARTICLE_PROCESSING_WORKFLOW_README.md)
- [Content Script Testing](./CONTENT_SCRIPT_TESTING_README.md)
- [User Interaction Testing](./USER_INTERACTION_TESTING_README.md)
