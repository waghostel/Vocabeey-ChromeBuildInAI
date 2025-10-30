/**
 * Load Extension with Playwright MCP
 *
 * This script demonstrates how to use Playwright MCP tools to:
 * - Launch browser and load extension
 * - Verify extension contexts
 * - Capture console errors
 *
 * Note: This script is meant to be executed by Kiro agent with MCP access.
 * It documents the MCP calls needed for extension loading and validation.
 */

import * as fs from 'fs';
import * as path from 'path';

interface MCPCallPlan {
  step: number;
  description: string;
  mcpTool: string;
  parameters: Record<string, any>;
  expectedOutcome: string;
}

/**
 * Generate the plan for loading and validating extension via MCP
 */
export function generateExtensionLoadingPlan(): MCPCallPlan[] {
  const distPath = path.resolve(process.cwd(), 'dist');

  return [
    {
      step: 1,
      description: 'Navigate to chrome://extensions page',
      mcpTool: 'mcp_playwright_browser_navigate',
      parameters: {
        url: 'chrome://extensions',
      },
      expectedOutcome: 'Browser navigates to extensions management page',
    },
    {
      step: 2,
      description: 'Take initial snapshot of extensions page',
      mcpTool: 'mcp_playwright_browser_snapshot',
      parameters: {},
      expectedOutcome:
        'Capture accessibility tree to find developer mode toggle',
    },
    {
      step: 3,
      description: 'Enable developer mode (if not already enabled)',
      mcpTool: 'mcp_playwright_browser_click',
      parameters: {
        element: 'Developer mode toggle',
        ref: '[uid from snapshot]',
      },
      expectedOutcome:
        'Developer mode is enabled, showing "Load unpacked" button',
    },
    {
      step: 4,
      description: 'Click "Load unpacked" button',
      mcpTool: 'mcp_playwright_browser_click',
      parameters: {
        element: 'Load unpacked button',
        ref: '[uid from snapshot]',
      },
      expectedOutcome: 'File picker dialog opens',
    },
    {
      step: 5,
      description: 'Handle file picker dialog',
      mcpTool: 'mcp_playwright_browser_handle_dialog',
      parameters: {
        accept: true,
      },
      expectedOutcome:
        'Dialog is accepted (Note: File path selection may need alternative approach)',
    },
    {
      step: 6,
      description: 'Take snapshot after extension loads',
      mcpTool: 'mcp_playwright_browser_snapshot',
      parameters: {},
      expectedOutcome: 'Capture extension card with ID and status',
    },
    {
      step: 7,
      description: 'Capture console messages',
      mcpTool: 'mcp_playwright_browser_console_messages',
      parameters: {
        onlyErrors: false,
      },
      expectedOutcome: 'Get all console logs including any loading errors',
    },
    {
      step: 8,
      description: 'Navigate to test page to verify content script injection',
      mcpTool: 'mcp_playwright_browser_navigate',
      parameters: {
        url: 'https://example.com',
      },
      expectedOutcome: 'Navigate to test page for content script verification',
    },
    {
      step: 9,
      description: 'Check for content script markers',
      mcpTool: 'mcp_playwright_browser_evaluate',
      parameters: {
        function: `() => {
          // Check if content script has injected any markers
          return {
            hasContentScript: window.__LANGUAGE_LEARNING_EXTENSION__ !== undefined,
            extensionId: document.documentElement.dataset.extensionId || null
          };
        }`,
      },
      expectedOutcome: 'Verify content script successfully injected',
    },
    {
      step: 10,
      description: 'Capture console messages from test page',
      mcpTool: 'mcp_playwright_browser_console_messages',
      parameters: {
        onlyErrors: true,
      },
      expectedOutcome: 'Get any content script errors',
    },
  ];
}

/**
 * Document the extension loading workflow
 */
export function documentExtensionLoadingWorkflow(): string {
  const plan = generateExtensionLoadingPlan();
  const distPath = path.resolve(process.cwd(), 'dist');

  const lines: string[] = [];
  lines.push('# Extension Loading Workflow with Playwright MCP');
  lines.push('');
  lines.push(
    'This document outlines the MCP calls needed to load and validate the extension.'
  );
  lines.push('');

  lines.push('## Prerequisites');
  lines.push('');
  lines.push('1. Playwright MCP server configured in mcp-config.json');
  lines.push('2. Extension built in dist/ directory');
  lines.push('3. Kiro agent with MCP access');
  lines.push('');

  lines.push('## Loading Steps');
  lines.push('');

  plan.forEach(step => {
    lines.push(`### Step ${step.step}: ${step.description}`);
    lines.push('');
    lines.push(`**MCP Tool:** \`${step.mcpTool}\``);
    lines.push('');
    lines.push('**Parameters:**');
    lines.push('```json');
    lines.push(JSON.stringify(step.parameters, null, 2));
    lines.push('```');
    lines.push('');
    lines.push(`**Expected Outcome:** ${step.expectedOutcome}`);
    lines.push('');
  });

  lines.push('## Alternative Approach: Using Chromium Launch Args');
  lines.push('');
  lines.push(
    'Playwright supports launching Chromium with extension pre-loaded:'
  );
  lines.push('');
  lines.push('```javascript');
  lines.push('// This would be done at browser launch');
  lines.push(
    'const browser = await chromium.launchPersistentContext(userDataDir, {'
  );
  lines.push('  headless: false,');
  lines.push('  args: [');
  lines.push(`    '--disable-extensions-except=${distPath}',`);
  lines.push(`    '--load-extension=${distPath}'`);
  lines.push('  ]');
  lines.push('});');
  lines.push('```');
  lines.push('');
  lines.push(
    'However, this requires direct Playwright API access, not available through MCP.'
  );
  lines.push('');

  lines.push('## Validation Checks');
  lines.push('');
  lines.push('After loading, verify:');
  lines.push('');
  lines.push('1. ✅ Extension appears in chrome://extensions');
  lines.push('2. ✅ Extension ID is captured');
  lines.push('3. ✅ Service worker is registered (check status)');
  lines.push('4. ✅ Content script injects on test pages');
  lines.push('5. ✅ No console errors during loading');
  lines.push('6. ✅ Offscreen document capability available');
  lines.push('7. ✅ UI pages are accessible');
  lines.push('');

  return lines.join('\n');
}

/**
 * Console error analysis utilities
 */
export class ConsoleErrorAnalyzer {
  /**
   * Analyze console messages and categorize errors
   */
  static analyzeConsoleMessages(messages: any[]): {
    errors: any[];
    warnings: any[];
    byType: Record<string, any[]>;
    summary: string;
  } {
    const errors = messages.filter(m => m.type === 'error');
    const warnings = messages.filter(
      m => m.type === 'warning' || m.type === 'warn'
    );

    const byType: Record<string, any[]> = {
      loading: [],
      runtime: [],
      import: [],
      path: [],
      other: [],
    };

    errors.forEach(error => {
      const message = error.text || error.message || '';
      const type = this.categorizeError(message);
      byType[type].push(error);
    });

    const summary = this.generateSummary(errors, warnings, byType);

    return { errors, warnings, byType, summary };
  }

  /**
   * Categorize error by type
   */
  static categorizeError(message: string): string {
    const lower = message.toLowerCase();

    if (
      lower.includes('failed to load') ||
      lower.includes('cannot load extension')
    ) {
      return 'loading';
    }

    if (
      lower.includes('import') ||
      lower.includes('module') ||
      lower.includes('cannot find module')
    ) {
      return 'import';
    }

    if (
      lower.includes('404') ||
      lower.includes('not found') ||
      lower.includes('failed to fetch')
    ) {
      return 'path';
    }

    if (
      lower.includes('runtime') ||
      lower.includes('undefined') ||
      lower.includes('null')
    ) {
      return 'runtime';
    }

    return 'other';
  }

  /**
   * Generate error summary
   */
  static generateSummary(
    errors: any[],
    warnings: any[],
    byType: Record<string, any[]>
  ): string {
    const lines: string[] = [];

    lines.push('\n=== Console Error Analysis ===\n');
    lines.push(`Total Errors: ${errors.length}`);
    lines.push(`Total Warnings: ${warnings.length}\n`);

    if (errors.length > 0) {
      lines.push('Errors by Type:');
      Object.entries(byType).forEach(([type, typeErrors]) => {
        if (typeErrors.length > 0) {
          lines.push(`  ${type}: ${typeErrors.length}`);
        }
      });
      lines.push('');

      // Show first few errors
      lines.push('First 5 Errors:');
      errors.slice(0, 5).forEach((error, index) => {
        const message = error.text || error.message || 'Unknown error';
        lines.push(`  ${index + 1}. ${message}`);
      });
    } else {
      lines.push('✅ No errors detected!');
    }

    return lines.join('\n');
  }
}

/**
 * Extension context verification
 */
export class ExtensionContextVerifier {
  /**
   * Generate verification checks for extension contexts
   */
  static generateVerificationChecks(): {
    check: string;
    method: string;
    description: string;
  }[] {
    return [
      {
        check: 'Service Worker Registration',
        method: 'Navigate to chrome://serviceworker-internals',
        description: 'Verify service worker is registered and running',
      },
      {
        check: 'Content Script Injection',
        method: 'Navigate to test page and evaluate window markers',
        description: 'Check if content script successfully injects',
      },
      {
        check: 'Offscreen Document',
        method: 'Check chrome.offscreen API availability',
        description: 'Verify offscreen document can be created',
      },
      {
        check: 'UI Pages Accessibility',
        method: 'Navigate to chrome-extension://[id]/ui/learning.html',
        description: 'Verify UI pages load without errors',
      },
    ];
  }

  /**
   * Generate JavaScript to check extension contexts
   */
  static generateContextCheckScript(): string {
    return `
// Extension Context Verification Script
(async () => {
  const results = {
    serviceWorker: false,
    contentScript: false,
    offscreen: false,
    uiPages: false,
    errors: []
  };
  
  try {
    // Check if running in extension context
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      results.extensionContext = true;
      
      // Check service worker
      if (chrome.runtime.getManifest) {
        const manifest = chrome.runtime.getManifest();
        results.serviceWorker = !!manifest.background?.service_worker;
      }
      
      // Check offscreen capability
      results.offscreen = typeof chrome.offscreen !== 'undefined';
      
      // Check content script markers
      results.contentScript = !!window.__LANGUAGE_LEARNING_EXTENSION__;
    }
  } catch (error) {
    results.errors.push(error.message);
  }
  
  return results;
})();
    `.trim();
  }
}

// Generate and save documentation
const isMainModule =
  import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule) {
  const workflow = documentExtensionLoadingWorkflow();
  const outputPath = path.join(
    process.cwd(),
    'debug',
    'EXTENSION_LOADING_WORKFLOW.md'
  );

  fs.writeFileSync(outputPath, workflow);
  console.log(`✅ Workflow documentation saved to: ${outputPath}`);

  // Generate verification checks
  const checks = ExtensionContextVerifier.generateVerificationChecks();
  console.log('\n📋 Extension Context Verification Checks:');
  checks.forEach((check, index) => {
    console.log(`\n${index + 1}. ${check.check}`);
    console.log(`   Method: ${check.method}`);
    console.log(`   Description: ${check.description}`);
  });

  // Show context check script
  console.log('\n📝 Context Check Script:');
  console.log(ExtensionContextVerifier.generateContextCheckScript());
}
