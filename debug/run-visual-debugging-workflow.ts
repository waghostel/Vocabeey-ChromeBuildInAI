/**
 * Visual Debugging Workflow Execution Script
 *
 * This script demonstrates how to execute the visual debugging workflow
 * with screenshot and snapshot capture at all key points.
 *
 * Usage: Run this through Kiro agent with Playwright MCP access
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import * as fs from 'fs';
import * as path from 'path';
import { VisualDebuggingSystem, CapturePoint } from './visual-debugging-system';
import {
  generateVisualDebuggingWorkflow,
  generateMCPCallSequence,
  generateWorkflowDocumentation,
} from './visual-debugging-workflow';

/**
 * Main execution function
 */
export function main(): void {
  console.log('🎨 Visual Debugging Workflow Execution\n');

  // Initialize visual debugging system
  const debugSystem = new VisualDebuggingSystem();

  console.log(`📁 Session ID: ${debugSystem.getSessionId()}`);
  console.log(`📂 Report Directory: ${debugSystem.getReportDir()}\n`);

  // Generate workflow
  const scenario = 'complete-extension-test';
  const workflow = generateVisualDebuggingWorkflow(debugSystem, scenario);

  console.log(`📋 Generated workflow with ${workflow.length} steps\n`);

  // Generate MCP call sequence
  const mcpCalls = generateMCPCallSequence(workflow);

  console.log(`🔧 Total MCP calls: ${mcpCalls.length}\n`);

  // Display workflow summary
  console.log('📊 Workflow Summary:\n');
  workflow.forEach(step => {
    console.log(`  ${step.step}. ${step.name}`);
    console.log(`     - Capture Point: ${step.capturePoint}`);
    console.log(`     - Screenshot: ${step.captureScreenshot ? '✅' : '❌'}`);
    console.log(`     - Snapshot: ${step.captureSnapshot ? '✅' : '❌'}`);
    console.log(`     - MCP Calls: ${step.mcpCalls.length}`);
    console.log('');
  });

  // Generate and save workflow documentation
  const documentation = generateWorkflowDocumentation(workflow);
  const docPath = path.join(
    debugSystem.getReportDir(),
    'workflow-documentation.md'
  );
  fs.writeFileSync(docPath, documentation);

  console.log(`📄 Workflow documentation saved: ${docPath}\n`);

  // Save MCP call sequence
  const mcpCallsPath = path.join(debugSystem.getReportDir(), 'mcp-calls.json');
  fs.writeFileSync(mcpCallsPath, JSON.stringify(mcpCalls, null, 2));

  console.log(`🔧 MCP call sequence saved: ${mcpCallsPath}\n`);

  // Generate execution guide
  const executionGuide = generateExecutionGuide(workflow, debugSystem);
  const guidePath = path.join(debugSystem.getReportDir(), 'execution-guide.md');
  fs.writeFileSync(guidePath, executionGuide);

  console.log(`📖 Execution guide saved: ${guidePath}\n`);

  // Display next steps
  console.log('✅ Visual debugging workflow setup complete!\n');
  console.log('📌 Next Steps:\n');
  console.log('1. Review the workflow documentation');
  console.log('2. Execute MCP calls through Kiro agent');
  console.log('3. Capture screenshots and snapshots at each step');
  console.log('4. Review artifacts in the report directory');
  console.log('');
  console.log(
    `📂 All artifacts will be saved to: ${debugSystem.getReportDir()}`
  );
}

/**
 * Generate execution guide for the workflow
 */
function generateExecutionGuide(
  workflow: any[],
  debugSystem: VisualDebuggingSystem
): string {
  const lines: string[] = [];

  lines.push('# Visual Debugging Workflow Execution Guide');
  lines.push('');
  lines.push(`**Session ID:** ${debugSystem.getSessionId()}`);
  lines.push(`**Report Directory:** ${debugSystem.getReportDir()}`);
  lines.push('');
  lines.push('## Overview');
  lines.push('');
  lines.push(
    'This guide provides step-by-step instructions for executing the visual'
  );
  lines.push('debugging workflow with Playwright MCP tools.');
  lines.push('');
  lines.push('## Prerequisites');
  lines.push('');
  lines.push('- Playwright MCP server configured and running');
  lines.push('- Chrome extension built in `dist/` directory');
  lines.push('- Test page available at `test-page.html`');
  lines.push('- Kiro agent with MCP access');
  lines.push('');
  lines.push('## Execution Steps');
  lines.push('');

  workflow.forEach(step => {
    lines.push(`### Step ${step.step}: ${step.name}`);
    lines.push('');
    lines.push(`**Objective:** ${step.description}`);
    lines.push('');
    lines.push('**Actions:**');
    lines.push('');

    step.mcpCalls.forEach((call: any, index: number) => {
      lines.push(`${index + 1}. Call \`${call.tool}\``);

      if (call.tool === 'mcp_playwright_browser_take_screenshot') {
        lines.push('   - This will capture a screenshot');
        lines.push(
          `   - Saved to: \`screenshots/${call.parameters.filename}\``
        );
      } else if (call.tool === 'mcp_playwright_browser_snapshot') {
        lines.push('   - This will capture an accessibility snapshot');
        lines.push('   - Save the result to a text file in `snapshots/`');
      } else {
        lines.push(`   - Purpose: ${call.purpose}`);
      }

      lines.push('');
    });

    lines.push('**Expected Results:**');
    lines.push('');

    if (step.captureScreenshot) {
      lines.push(`- Screenshot captured: \`${step.capturePoint}.png\``);
    }

    if (step.captureSnapshot) {
      lines.push(`- Snapshot captured: \`${step.capturePoint}.txt\``);
    }

    lines.push('');
    lines.push('---');
    lines.push('');
  });

  lines.push('## After Execution');
  lines.push('');
  lines.push('1. Review all screenshots in `screenshots/` directory');
  lines.push('2. Review all snapshots in `snapshots/` directory');
  lines.push('3. Check console logs in `logs/console-logs.json`');
  lines.push('4. Check network requests in `logs/network-requests.json`');
  lines.push('5. Review artifact index in `artifact-index.json`');
  lines.push('');
  lines.push('## Troubleshooting');
  lines.push('');
  lines.push('If screenshots or snapshots are missing:');
  lines.push('');
  lines.push('- Verify Playwright MCP connection');
  lines.push('- Check browser is running and accessible');
  lines.push('- Ensure proper permissions for file writing');
  lines.push('- Review console messages for errors');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate comparison report for snapshots
 */
export function generateSnapshotComparisonReport(
  debugSystem: VisualDebuggingSystem
): string {
  const artifacts = debugSystem.getArtifacts();
  const lines: string[] = [];

  lines.push('# Snapshot Comparison Report');
  lines.push('');
  lines.push(`**Session:** ${debugSystem.getSessionId()}`);
  lines.push(`**Total Snapshots:** ${artifacts.snapshots.length}`);
  lines.push('');

  // Group snapshots by capture point
  const snapshotsByPoint = new Map<string, typeof artifacts.snapshots>();

  artifacts.snapshots.forEach(snapshot => {
    const point = snapshot.capturePoint;
    if (!snapshotsByPoint.has(point)) {
      snapshotsByPoint.set(point, []);
    }
    snapshotsByPoint.get(point)!.push(snapshot);
  });

  lines.push('## Snapshots by Capture Point');
  lines.push('');

  snapshotsByPoint.forEach((snapshots, point) => {
    lines.push(`### ${point}`);
    lines.push('');
    lines.push(`**Count:** ${snapshots.length}`);
    lines.push('');

    snapshots.forEach(snapshot => {
      lines.push(`- **${snapshot.filename}**`);
      lines.push(`  - Description: ${snapshot.description}`);
      lines.push(`  - Elements: ${snapshot.elementCount || 'N/A'}`);
      lines.push(
        `  - Interactive: ${snapshot.hasInteractiveElements ? '✅' : '❌'}`
      );
      lines.push(`  - Path: \`${snapshot.fullPath}\``);
      lines.push('');
    });
  });

  lines.push('## Comparison Instructions');
  lines.push('');
  lines.push('To compare snapshots:');
  lines.push('');
  lines.push('1. Use `diff` command to compare snapshot files');
  lines.push('2. Look for changes in element structure');
  lines.push('3. Identify new or removed interactive elements');
  lines.push('4. Check for unexpected DOM changes');
  lines.push('');
  lines.push('Example:');
  lines.push('```bash');
  lines.push('diff snapshots/snapshot1.txt snapshots/snapshot2.txt');
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate screenshot gallery HTML
 */
export function generateScreenshotGallery(
  debugSystem: VisualDebuggingSystem
): string {
  const artifacts = debugSystem.getArtifacts();
  const lines: string[] = [];

  lines.push('<!DOCTYPE html>');
  lines.push('<html lang="en">');
  lines.push('<head>');
  lines.push('  <meta charset="UTF-8">');
  lines.push(
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">'
  );
  lines.push(
    `  <title>Screenshot Gallery - ${debugSystem.getSessionId()}</title>`
  );
  lines.push('  <style>');
  lines.push(
    '    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }'
  );
  lines.push('    h1 { color: #333; }');
  lines.push(
    '    .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }'
  );
  lines.push(
    '    .screenshot { background: white; border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }'
  );
  lines.push(
    '    .screenshot img { width: 100%; border-radius: 4px; cursor: pointer; }'
  );
  lines.push('    .screenshot h3 { margin: 10px 0 5px 0; color: #555; }');
  lines.push(
    '    .screenshot p { margin: 5px 0; color: #777; font-size: 14px; }'
  );
  lines.push(
    '    .metadata { font-size: 12px; color: #999; margin-top: 10px; }'
  );
  lines.push('  </style>');
  lines.push('</head>');
  lines.push('<body>');
  lines.push(`  <h1>Screenshot Gallery - ${debugSystem.getSessionId()}</h1>`);
  lines.push(`  <p>Total Screenshots: ${artifacts.screenshots.length}</p>`);
  lines.push('  <div class="gallery">');

  artifacts.screenshots.forEach(screenshot => {
    const relativePath = path.relative(
      debugSystem.getReportDir(),
      screenshot.fullPath
    );

    lines.push('    <div class="screenshot">');
    lines.push(`      <h3>${screenshot.capturePoint}</h3>`);
    lines.push(`      <p>${screenshot.description}</p>`);
    lines.push(
      `      <img src="${relativePath}" alt="${screenshot.description}" onclick="window.open(this.src)">`
    );
    lines.push('      <div class="metadata">');
    lines.push(`        <div>Filename: ${screenshot.filename}</div>`);
    lines.push(
      `        <div>Timestamp: ${new Date(screenshot.timestamp).toLocaleString()}</div>`
    );
    lines.push(
      `        <div>Full Page: ${screenshot.fullPage ? 'Yes' : 'No'}</div>`
    );
    if (screenshot.scenario) {
      lines.push(`        <div>Scenario: ${screenshot.scenario}</div>`);
    }
    lines.push('      </div>');
    lines.push('    </div>');
  });

  lines.push('  </div>');
  lines.push('</body>');
  lines.push('</html>');

  return lines.join('\n');
}

/**
 * Save all reports
 */
export function saveAllReports(debugSystem: VisualDebuggingSystem): void {
  // Save snapshot comparison report
  const comparisonReport = generateSnapshotComparisonReport(debugSystem);
  const comparisonPath = path.join(
    debugSystem.getReportDir(),
    'snapshot-comparison.md'
  );
  fs.writeFileSync(comparisonPath, comparisonReport);
  console.log(`📊 Snapshot comparison report saved: ${comparisonPath}`);

  // Save screenshot gallery
  const gallery = generateScreenshotGallery(debugSystem);
  const galleryPath = path.join(
    debugSystem.getReportDir(),
    'screenshot-gallery.html'
  );
  fs.writeFileSync(galleryPath, gallery);
  console.log(`🖼️  Screenshot gallery saved: ${galleryPath}`);

  // Generate artifact index
  const indexPath = debugSystem.generateArtifactIndex();
  console.log(`📑 Artifact index saved: ${indexPath}`);
}

// Run if executed directly
if (require.main === module) {
  main();
}
