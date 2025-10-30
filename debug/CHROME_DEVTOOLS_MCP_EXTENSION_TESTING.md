# Chrome DevTools MCP Extension Testing Guide

## Problem Statement

The chrome-devtools MCP server launches its own isolated Chrome instance with a clean profile, which means:

- Your Chrome extensions are not mounted
- Your logins, settings, and cache are missing
- You cannot test your extension in the MCP-controlled browser

This guide provides a **confirmed workaround** to connect the chrome-devtools MCP to your manually launched Chrome instance that has your extension loaded.

---

## Solution Overview

Instead of letting the MCP launch Chrome, you:

1. Launch Chrome manually with remote debugging enabled
2. Load your extension in that Chrome instance
3. Configure the MCP to connect to your running Chrome

---

## Step-by-Step Setup

### Step 1: Close All Chrome Instances

Before starting, ensure no Chrome processes are running:

**Windows:**

```cmd
taskkill /F /IM chrome.exe
```

**macOS/Linux:**

```bash
killall "Google Chrome"
```

### Step 2: Launch Chrome with Remote Debugging

Start Chrome manually with the remote debugging port exposed:

**Windows:**

```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome-dev-profile"
```

**macOS:**

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="~/chrome-dev-profile"
```

**Linux:**

```bash
google-chrome --remote-debugging-port=9222 --user-data-dir="~/chrome-dev-profile"
```

**Important flags:**

- `--remote-debugging-port=9222`: Exposes the DevTools protocol on port 9222
- `--user-data-dir`: Uses an isolated profile (recommended for safety)

### Step 3: Load Your Extension

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select your extension's `dist/` folder
5. Verify the extension is loaded and active

### Step 4: Verify Remote Debugging is Active

Open in any browser (or the same Chrome instance):

```
http://localhost:9222/json
```

You should see a JSON response listing all open tabs and their WebSocket URLs, like:

```json
[
  {
    "description": "",
    "devtoolsFrontendUrl": "/devtools/inspector.html?ws=localhost:9222/devtools/page/...",
    "id": "...",
    "title": "New Tab",
    "type": "page",
    "url": "chrome://newtab/",
    "webSocketDebuggerUrl": "ws://localhost:9222/devtools/page/..."
  }
]
```

### Step 5: Configure MCP to Connect to Running Chrome

#### Option A: Auto-Detection (Recommended)

Most versions of chrome-devtools-mcp automatically detect an existing Chrome instance on port 9222.

**Standard MCP config (`.kiro/settings/mcp.json` or `~/.kiro/settings/mcp.json`):**

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"],
      "disabled": false
    }
  }
}
```

The MCP will detect the running Chrome and connect to it instead of launching a new instance.

#### Option B: Explicit Target Connection

If auto-detection doesn't work, specify the target explicitly:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--target",
        "ws://localhost:9222"
      ],
      "disabled": false
    }
  }
}
```

### Step 6: Test the Connection

1. Restart the MCP server (or reconnect from the MCP Server view in Kiro)
2. Use MCP tools to interact with Chrome
3. Verify your extension is accessible and functional

---

## Testing Your Extension

### Basic Extension Testing

Once connected, you can:

1. **Navigate to test pages:**
   - Use MCP tools to open URLs where your extension should activate
2. **Inspect extension behavior:**
   - Check if content scripts are injected
   - Verify background service worker is running
   - Test extension UI components

3. **Debug with DevTools:**
   - Your extension's DevTools remain fully accessible
   - Service worker console: `chrome://extensions/` → "Inspect views: service worker"
   - Content script console: Regular page DevTools

### Example Test Workflow

```typescript
// Example: Testing article extraction extension
// 1. Navigate to an article page
await navigateToUrl('https://example.com/article');

// 2. Trigger extension (e.g., click extension icon or use keyboard shortcut)
// 3. Verify extension behavior through DevTools or MCP tools
// 4. Check storage, cache, or other extension features
```

---

## Important Notes

### Port Conflicts

- Only one Chrome instance can bind to port 9222 at a time
- If you get "port already in use", close all Chrome instances and try again

### Profile Isolation

- Using `--user-data-dir` creates an isolated profile
- This is safer than using your main profile
- Extensions must be loaded each time you start this profile

### Extension Persistence

- Extensions loaded in the dev profile persist across sessions
- You don't need to reload the extension every time unless you rebuild it

### Service Worker Limitations

- Manifest V3 service workers work normally in this setup
- Background scripts, offscreen documents, and all extension APIs function as expected

### MCP Connection Stability

- Keep the Chrome instance running while using MCP
- If Chrome closes, the MCP loses connection
- Restart Chrome with the same command to reconnect

---

## Troubleshooting

### MCP Still Launches New Chrome

**Problem:** MCP ignores the running Chrome and starts a new instance.

**Solutions:**

1. Ensure Chrome is running with `--remote-debugging-port=9222`
2. Verify port 9222 is accessible: `http://localhost:9222/json`
3. Try explicit target connection (Option B above)
4. Check MCP server logs for connection errors

### Extension Not Loading

**Problem:** Extension doesn't appear in the dev profile.

**Solutions:**

1. Manually load the extension via `chrome://extensions/`
2. Ensure the extension is built (`pnpm build`)
3. Check for manifest errors in the Extensions page

### Port Already in Use

**Problem:** Error when starting Chrome with `--remote-debugging-port=9222`.

**Solutions:**

1. Close all Chrome instances completely
2. Check for lingering processes:
   - Windows: `tasklist | findstr chrome`
   - macOS/Linux: `ps aux | grep chrome`
3. Kill any remaining processes
4. Try a different port (e.g., 9223) and update MCP config accordingly

### MCP Tools Not Working with Extension

**Problem:** MCP can control Chrome but can't interact with extension features.

**Solutions:**

1. Verify extension is active in `chrome://extensions/`
2. Check extension permissions in manifest.json
3. Ensure content scripts are injected (check page DevTools)
4. Review service worker console for errors

---

## Alternative: Using Playwright with Extensions

If the chrome-devtools MCP approach doesn't meet your needs, consider using Playwright with extension support:

```typescript
import { chromium } from 'playwright';

const context = await chromium.launchPersistentContext('', {
  headless: false,
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
  ],
});
```

See `debug/PLAYWRIGHT_DEBUGGING_GUIDE.md` for more details.

---

## Summary

| Goal                              | Method                                            | Status       |
| --------------------------------- | ------------------------------------------------- | ------------ |
| Use Chrome with extensions loaded | Launch Chrome with `--remote-debugging-port=9222` | ✅ Confirmed |
| Connect chrome-devtools MCP to it | Configure MCP to attach to existing Chrome        | ✅ Confirmed |
| Test extension functionality      | Use MCP tools + manual DevTools inspection        | ✅ Confirmed |

This method allows you to test your Chrome extension in a real browser environment while maintaining MCP control for automation and debugging.

---

## Related Documentation

- [Playwright Extension Debugging Guide](./PLAYWRIGHT_DEBUGGING_GUIDE.md)
- [Chrome Development Workflow](../docs/development/chrome-dev-workflow.md)
- [Troubleshooting Flowchart](./TROUBLESHOOTING_FLOWCHART.md)
