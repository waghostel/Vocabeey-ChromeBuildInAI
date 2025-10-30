/**
 * Artifact Management System Example
 *
 * This script demonstrates how to use the ArtifactManager to organize
 * debugging artifacts from Playwright extension testing.
 *
 * Usage:
 *   npx tsx debug/run-artifact-management-example.ts
 */

import { ArtifactManager } from './artifact-management-system';

async function demonstrateArtifactManagement() {
  console.log('🗂️  Artifact Management System Demo\n');

  // Initialize artifact manager
  const artifactManager = new ArtifactManager('./debug/reports');
  console.log(`✅ Session created: ${artifactManager.getSessionDir()}\n`);

  // Simulate saving various artifacts for extension loading scenario
  console.log('📸 Saving extension loading artifacts...');

  // Save screenshot
  const screenshotData = Buffer.from('fake-screenshot-data');
  const screenshotPath = await artifactManager.saveScreenshot(
    'extension-loading',
    screenshotData,
    'Extension loaded in chrome://extensions'
  );
  console.log(`   Screenshot saved: ${screenshotPath}`);

  // Save accessibility snapshot
  const snapshotData = `
    heading "Extensions" [level=1]
      button "Developer mode" [pressed=true]
      text "Chrome Extension Debugger"
  `;
  const snapshotPath = await artifactManager.saveSnapshot(
    'extension-loading',
    snapshotData,
    'Extension list accessibility tree'
  );
  console.log(`   Snapshot saved: ${snapshotPath}`);

  // Save console logs
  const consoleLogs = [
    '[INFO] Extension loaded successfully',
    '[INFO] Service worker registered',
    '[WARN] Content script injection pending',
  ];
  const consoleLogPath = await artifactManager.saveConsoleLogs(
    'extension-loading',
    consoleLogs,
    'Extension loading console output'
  );
  console.log(`   Console logs saved: ${consoleLogPath}\n`);

  // Simulate content script injection scenario
  console.log('📸 Saving content script injection artifacts...');

  const injectionScreenshot = await artifactManager.saveScreenshot(
    'content-script-injection',
    Buffer.from('fake-injection-screenshot'),
    'Test page with content script injected'
  );
  console.log(`   Screenshot saved: ${injectionScreenshot}`);

  const injectionSnapshot = await artifactManager.saveSnapshot(
    'content-script-injection',
    'article "Test Article"\n  paragraph "Content here"',
    'Page structure after injection'
  );
  console.log(`   Snapshot saved: ${injectionSnapshot}`);

  const networkRequests = [
    { url: 'https://example.com/article', status: 200, method: 'GET' },
    {
      url: 'chrome-extension://abc123/content-script.js',
      status: 200,
      method: 'GET',
    },
  ];
  const networkLogPath = await artifactManager.saveNetworkLogs(
    'content-script-injection',
    networkRequests,
    'Network activity during injection'
  );
  console.log(`   Network logs saved: ${networkLogPath}\n`);

  // Generate scenario reports
  console.log('📝 Generating scenario reports...');

  const loadingReport = await artifactManager.generateReport(
    'extension-loading',
    'Extension loaded successfully with all components initialized',
    [],
    [
      'Service worker is active and responding',
      'All manifest paths are valid',
      'No console errors detected',
    ]
  );
  console.log(`   Report generated: ${loadingReport}`);

  const injectionReport = await artifactManager.generateReport(
    'content-script-injection',
    'Content script injected and functional on test page',
    ['Minor delay in script injection (200ms)'],
    [
      'Consider preloading content script',
      'Optimize script size for faster injection',
    ]
  );
  console.log(`   Report generated: ${injectionReport}\n`);

  // Generate session summary
  console.log('📊 Generating session summary...');
  const summaryPath = await artifactManager.generateSessionSummary();
  console.log(`   Summary generated: ${summaryPath}\n`);

  // Display session statistics
  console.log('📈 Session Statistics:');
  console.log(
    `   Extension Loading Artifacts: ${artifactManager.getScenarioArtifacts('extension-loading').length}`
  );
  console.log(
    `   Content Script Injection Artifacts: ${artifactManager.getScenarioArtifacts('content-script-injection').length}`
  );
  console.log(
    `   Total Artifacts: ${artifactManager.getScenarioArtifacts('extension-loading').length + artifactManager.getScenarioArtifacts('content-script-injection').length}`
  );

  console.log('\n✅ Artifact management demo complete!');
  console.log(`\n📁 View artifacts in: ${artifactManager.getSessionDir()}`);
}

// Run the demo
demonstrateArtifactManagement().catch(error => {
  console.error('❌ Error running artifact management demo:', error);
  process.exit(1);
});
