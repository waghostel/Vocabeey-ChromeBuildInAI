/**
 * Complete Extension Validation Script
 *
 * Integrates all three subtasks:
 * 1. Launch browser and load extension from dist/
 * 2. Verify extension contexts (service worker, content scripts, offscreen, UI)
 * 3. Capture and analyze console errors
 *
 * This script provides the complete workflow for extension validation
 * using Playwright MCP tools.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import * as fs from 'fs';
import * as path from 'path';
import { ExtensionContextVerifier } from './extension-context-verifier';
import { ConsoleErrorAnalyzer } from './console-error-analyzer';

interface ValidationConfig {
  distPath: string;
  testUrl: string;
  outputDir: string;
  captureScreenshots: boolean;
}

interface CompleteValidationResult {
  extensionId: string | null;
  loadingSuccess: boolean;
  contextVerification: any;
  consoleAnalysis: any;
  overallStatus: 'success' | 'partial' | 'failed';
  timestamp: number;
}

/**
 * Complete Extension Validation Workflow
 */
export class ExtensionValidator {
  private config: ValidationConfig;

  constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      distPath: path.resolve(process.cwd(), 'dist'),
      testUrl: 'https://example.com',
      outputDir: path.join(process.cwd(), 'debug', 'playwright-reports'),
      captureScreenshots: true,
      ...config,
    };
  }

  /**
   * Run complete validation workflow
   */
  async runCompleteValidation(): Promise<CompleteValidationResult> {
    console.log('🚀 Starting Complete Extension Validation\n');
    console.log('='.repeat(50));
    console.log('\n');

    const result: CompleteValidationResult = {
      extensionId: null,
      loadingSuccess: false,
      contextVerification: null,
      consoleAnalysis: null,
      overallStatus: 'failed',
      timestamp: Date.now(),
    };

    try {
      // Step 1: Verify prerequisites
      console.log('📋 Step 1: Verifying Prerequisites\n');
      const prereqCheck = this.verifyPrerequisites();
      if (!prereqCheck.success) {
        console.error('❌ Prerequisites check failed');
        prereqCheck.errors.forEach(err => console.error(`  - ${err}`));
        return result;
      }
      console.log('✅ Prerequisites verified\n');

      // Step 2: Document extension loading workflow
      console.log('📋 Step 2: Extension Loading Workflow\n');
      this.documentLoadingWorkflow();
      console.log('✅ Loading workflow documented\n');

      // Step 3: Verify extension contexts (requires extension ID)
      console.log('📋 Step 3: Extension Context Verification\n');
      console.log('⚠️  Note: Extension must be manually loaded first');
      console.log('   1. Open Chrome and navigate to chrome://extensions');
      console.log('   2. Enable Developer mode');
      console.log('   3. Click "Load unpacked" and select dist/ directory');
      console.log('   4. Copy the Extension ID\n');

      // For demonstration, we'll use a placeholder
      const extensionId =
        process.env.EXTENSION_ID || 'PLACEHOLDER_EXTENSION_ID';
      result.extensionId = extensionId;

      if (extensionId !== 'PLACEHOLDER_EXTENSION_ID') {
        const verifier = new ExtensionContextVerifier(extensionId);
        result.contextVerification = await verifier.verifyAllContexts();
        result.loadingSuccess =
          result.contextVerification.overallStatus !== 'failed';
        console.log('✅ Context verification complete\n');
      } else {
        console.log(
          '⚠️  Skipping context verification (no extension ID provided)\n'
        );
      }

      // Step 4: Console error analysis
      console.log('📋 Step 4: Console Error Analysis\n');
      this.documentConsoleAnalysis();
      console.log('✅ Console analysis workflow documented\n');

      // Step 5: Generate MCP call guide
      console.log('📋 Step 5: Generating MCP Call Guide\n');
      this.generateMCPCallGuide(extensionId);
      console.log('✅ MCP call guide generated\n');

      // Determine overall status
      result.overallStatus = this.determineOverallStatus(result);

      // Generate final report
      this.generateFinalReport(result);

      return result;
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }

  /**
   * Verify prerequisites
   */
  private verifyPrerequisites(): { success: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check dist directory
    if (!fs.existsSync(this.config.distPath)) {
      errors.push('dist/ directory not found. Run "pnpm build" first.');
    }

    // Check manifest.json
    const manifestPath = path.join(this.config.distPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      errors.push('manifest.json not found in dist/ directory');
    } else {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        console.log(`  ✅ Extension: ${manifest.name} v${manifest.version}`);
      } catch (error) {
        errors.push('manifest.json is not valid JSON');
      }
    }

    // Check key files
    const keyFiles = [
      'background/service-worker.js',
      'content/content-script.js',
      'offscreen/ai-processor.js',
      'offscreen/ai-processor.html',
    ];

    keyFiles.forEach(file => {
      const filePath = path.join(this.config.distPath, file);
      if (fs.existsSync(filePath)) {
        console.log(`  ✅ ${file}`);
      } else {
        errors.push(`Required file not found: ${file}`);
      }
    });

    return {
      success: errors.length === 0,
      errors,
    };
  }

  /**
   * Document extension loading workflow
   */
  private documentLoadingWorkflow(): void {
    const workflow = `
# Extension Loading Workflow

## Manual Loading (Required)

Since Playwright MCP cannot automate the "Load unpacked" file picker dialog,
the extension must be loaded manually:

1. Open Chrome/Chromium browser
2. Navigate to chrome://extensions
3. Enable "Developer mode" toggle (top right)
4. Click "Load unpacked"
5. Select the dist/ directory: ${this.config.distPath}
6. Copy the Extension ID (e.g., abcdefghijklmnopqrstuvwxyz123456)

## Automated Validation (After Manual Loading)

Once loaded, use Playwright MCP to validate:

### 1. Navigate to Test Page
\`\`\`
mcp_playwright_browser_navigate({ url: "${this.config.testUrl}" })
\`\`\`

### 2. Check Content Script Injection
\`\`\`
mcp_playwright_browser_evaluate({
  function: "() => ({ hasExtension: typeof window.__LANGUAGE_LEARNING_EXTENSION__ !== 'undefined' })"
})
\`\`\`

### 3. Capture Console Messages
\`\`\`
mcp_playwright_browser_console_messages({ onlyErrors: false })
\`\`\`

### 4. Take Screenshot
\`\`\`
mcp_playwright_browser_take_screenshot({ fullPage: true })
\`\`\`
    `.trim();

    const workflowPath = path.join(
      this.config.outputDir,
      'loading-workflow.md'
    );
    fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
    fs.writeFileSync(workflowPath, workflow);

    console.log(`  📄 Workflow saved to: ${workflowPath}`);
  }

  /**
   * Document console analysis workflow
   */
  private documentConsoleAnalysis(): void {
    const guide = `
# Console Error Analysis Guide

## Capturing Console Messages

### Get All Messages
\`\`\`typescript
mcp_playwright_browser_console_messages({
  onlyErrors: false
})
\`\`\`

### Get Only Errors
\`\`\`typescript
mcp_playwright_browser_console_messages({
  onlyErrors: true
})
\`\`\`

## Error Categories

### 1. Loading Errors (CRITICAL)
- Extension failed to load
- Manifest parsing errors
- Missing required files

**Example:**
\`\`\`
Failed to load extension from: /path/to/dist
\`\`\`

**Fix:** Verify manifest.json and all referenced files exist

### 2. Import Errors (CRITICAL)
- Module resolution failures
- Missing .js extensions
- Incorrect relative paths

**Example:**
\`\`\`
Failed to resolve module specifier "./utils/storage-manager"
\`\`\`

**Fix:** Add .js extension: "./utils/storage-manager.js"

### 3. Path Errors (HIGH)
- 404 file not found
- Incorrect file paths
- Missing resources

**Example:**
\`\`\`
Failed to fetch: chrome-extension://abc123/content/content-script.js (404)
\`\`\`

**Fix:** Verify file exists and path is correct

### 4. Runtime Errors (MEDIUM)
- Undefined variables
- Null reference errors
- Permission errors

**Example:**
\`\`\`
Uncaught TypeError: Cannot read property 'sendMessage' of undefined
\`\`\`

**Fix:** Add null checks and verify API availability

## Analysis Process

1. Capture all console messages
2. Filter errors and warnings
3. Categorize by type
4. Extract file and line information
5. Generate suggestions
6. Prioritize by severity
7. Create actionable report
    `.trim();

    const guidePath = path.join(
      this.config.outputDir,
      'console-analysis-guide.md'
    );
    fs.writeFileSync(guidePath, guide);

    console.log(`  📄 Guide saved to: ${guidePath}`);
  }

  /**
   * Generate MCP call guide
   */
  private generateMCPCallGuide(extensionId: string): void {
    const guide = {
      title: 'Playwright MCP Call Guide for Extension Validation',
      extensionId,
      calls: [
        {
          step: 1,
          name: 'Navigate to Test Page',
          tool: 'mcp_playwright_browser_navigate',
          params: { url: this.config.testUrl },
          purpose: 'Load a page where content script should inject',
        },
        {
          step: 2,
          name: 'Capture Page Snapshot',
          tool: 'mcp_playwright_browser_snapshot',
          params: {},
          purpose: 'Get accessibility tree for structure verification',
        },
        {
          step: 3,
          name: 'Check Content Script',
          tool: 'mcp_playwright_browser_evaluate',
          params: {
            function: `() => ({
              hasExtension: typeof window.__LANGUAGE_LEARNING_EXTENSION__ !== 'undefined',
              hasChromeRuntime: typeof chrome !== 'undefined',
              documentReady: document.readyState
            })`,
          },
          purpose: 'Verify content script successfully injected',
        },
        {
          step: 4,
          name: 'Capture All Console Messages',
          tool: 'mcp_playwright_browser_console_messages',
          params: { onlyErrors: false },
          purpose: 'Get all console logs for analysis',
        },
        {
          step: 5,
          name: 'Capture Error Messages',
          tool: 'mcp_playwright_browser_console_messages',
          params: { onlyErrors: true },
          purpose: 'Get filtered error messages',
        },
        {
          step: 6,
          name: 'Take Screenshot',
          tool: 'mcp_playwright_browser_take_screenshot',
          params: { fullPage: true, type: 'png' },
          purpose: 'Capture visual state for debugging',
        },
        {
          step: 7,
          name: 'Check Network Requests',
          tool: 'mcp_playwright_browser_network_requests',
          params: {},
          purpose: 'Identify failed requests or API errors',
        },
        {
          step: 8,
          name: 'Navigate to UI Page',
          tool: 'mcp_playwright_browser_navigate',
          params: { url: `chrome-extension://${extensionId}/ui/learning.html` },
          purpose: 'Test UI page accessibility',
        },
        {
          step: 9,
          name: 'Capture UI Console Messages',
          tool: 'mcp_playwright_browser_console_messages',
          params: { onlyErrors: true },
          purpose: 'Check for UI page errors',
        },
        {
          step: 10,
          name: 'Take UI Screenshot',
          tool: 'mcp_playwright_browser_take_screenshot',
          params: { type: 'png' },
          purpose: 'Capture UI page state',
        },
      ],
    };

    const guidePath = path.join(this.config.outputDir, 'mcp-call-guide.json');
    fs.writeFileSync(guidePath, JSON.stringify(guide, null, 2));

    console.log(`  📄 MCP guide saved to: ${guidePath}`);

    // Also create markdown version
    const mdLines: string[] = [];
    mdLines.push(`# ${guide.title}`);
    mdLines.push('');
    mdLines.push(`**Extension ID:** ${guide.extensionId}`);
    mdLines.push('');

    guide.calls.forEach(call => {
      mdLines.push(`## Step ${call.step}: ${call.name}`);
      mdLines.push('');
      mdLines.push(`**Tool:** \`${call.tool}\``);
      mdLines.push('');
      mdLines.push('**Parameters:**');
      mdLines.push('```json');
      mdLines.push(JSON.stringify(call.params, null, 2));
      mdLines.push('```');
      mdLines.push('');
      mdLines.push(`**Purpose:** ${call.purpose}`);
      mdLines.push('');
    });

    const mdPath = path.join(this.config.outputDir, 'mcp-call-guide.md');
    fs.writeFileSync(mdPath, mdLines.join('\n'));
  }

  /**
   * Determine overall status
   */
  private determineOverallStatus(
    result: CompleteValidationResult
  ): 'success' | 'partial' | 'failed' {
    if (!result.loadingSuccess) {
      return 'failed';
    }

    if (result.contextVerification?.overallStatus === 'failed') {
      return 'failed';
    }

    if (result.contextVerification?.overallStatus === 'degraded') {
      return 'partial';
    }

    return 'success';
  }

  /**
   * Generate final report
   */
  private generateFinalReport(result: CompleteValidationResult): void {
    const lines: string[] = [];

    lines.push('# Extension Validation Report');
    lines.push('');
    lines.push(`**Generated:** ${new Date(result.timestamp).toISOString()}`);
    lines.push(`**Extension ID:** ${result.extensionId || 'Not loaded'}`);
    lines.push(
      `**Overall Status:** ${this.getStatusEmoji(result.overallStatus)} ${result.overallStatus.toUpperCase()}`
    );
    lines.push('');

    lines.push('## Validation Steps');
    lines.push('');
    lines.push('- [x] Prerequisites verified');
    lines.push('- [x] Loading workflow documented');
    lines.push(
      `- [${result.contextVerification ? 'x' : ' '}] Context verification completed`
    );
    lines.push('- [x] Console analysis workflow documented');
    lines.push('- [x] MCP call guide generated');
    lines.push('');

    lines.push('## Next Steps');
    lines.push('');
    lines.push(
      '1. Manually load extension in Chrome (see loading-workflow.md)'
    );
    lines.push(
      '2. Copy Extension ID and set EXTENSION_ID environment variable'
    );
    lines.push('3. Run validation again with actual extension ID');
    lines.push('4. Use MCP calls from mcp-call-guide.md to test extension');
    lines.push('5. Review console errors and fix issues');
    lines.push('6. Rebuild and re-test');
    lines.push('');

    lines.push('## Generated Files');
    lines.push('');
    lines.push(`- loading-workflow.md - Extension loading instructions`);
    lines.push(`- console-analysis-guide.md - Console error analysis guide`);
    lines.push(`- mcp-call-guide.json - MCP calls for validation`);
    lines.push(`- mcp-call-guide.md - MCP calls documentation`);
    lines.push('');

    const reportPath = path.join(this.config.outputDir, 'validation-report.md');
    fs.writeFileSync(reportPath, lines.join('\n'));

    console.log(`\n📄 Final report saved to: ${reportPath}`);
  }

  /**
   * Get status emoji
   */
  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'success':
        return '✅';
      case 'partial':
        return '⚠️';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  }
}

// Run if executed directly - always run for now
const validator = new ExtensionValidator();

validator
  .runCompleteValidation()
  .then(result => {
    console.log('\n' + '='.repeat(50));
    console.log(
      `\n✅ Validation Complete: ${result.overallStatus.toUpperCase()}\n`
    );
    process.exit(result.overallStatus === 'failed' ? 1 : 0);
  })
  .catch(error => {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  });
