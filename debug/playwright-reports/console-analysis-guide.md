# Console Error Analysis Guide

## Capturing Console Messages

### Get All Messages

```typescript
mcp_playwright_browser_console_messages({
  onlyErrors: false,
});
```

### Get Only Errors

```typescript
mcp_playwright_browser_console_messages({
  onlyErrors: true,
});
```

## Error Categories

### 1. Loading Errors (CRITICAL)

- Extension failed to load
- Manifest parsing errors
- Missing required files

**Example:**

```
Failed to load extension from: /path/to/dist
```

**Fix:** Verify manifest.json and all referenced files exist

### 2. Import Errors (CRITICAL)

- Module resolution failures
- Missing .js extensions
- Incorrect relative paths

**Example:**

```
Failed to resolve module specifier "./utils/storage-manager"
```

**Fix:** Add .js extension: "./utils/storage-manager.js"

### 3. Path Errors (HIGH)

- 404 file not found
- Incorrect file paths
- Missing resources

**Example:**

```
Failed to fetch: chrome-extension://abc123/content/content-script.js (404)
```

**Fix:** Verify file exists and path is correct

### 4. Runtime Errors (MEDIUM)

- Undefined variables
- Null reference errors
- Permission errors

**Example:**

```
Uncaught TypeError: Cannot read property 'sendMessage' of undefined
```

**Fix:** Add null checks and verify API availability

## Analysis Process

1. Capture all console messages
2. Filter errors and warnings
3. Categorize by type
4. Extract file and line information
5. Generate suggestions
6. Prioritize by severity
7. Create actionable report
