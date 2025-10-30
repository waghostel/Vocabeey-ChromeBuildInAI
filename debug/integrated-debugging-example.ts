/**
 * Integrated Debugging Example
 *
 * This script demonstrates how to use the VisualDebuggingSystem
 * together with the ArtifactManager for comprehensive debugging.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 *
 * Usage:
 *   npx tsx debug/integrated-debugging-example.ts
 */

import { VisualDebuggingSystem } from './visual-debugging-system';
import { ArtifactManager } from './artifact-management-system';

async function runIntegratedDebuggingExample() {
  console.log('🔍 Integrated Debugging System Example\n');

  // Initialize both systems
  const visualDebugger = new VisualDebuggingSystem('./debug/visual-artifacts');
  const artifactManager = new ArtifactManager('./debug/reports');

  console.log(`✅ Visual debugger initialized`);
  console.log(
    `✅ Artifact manager initialized: ${artifactManager.getSessionDir()}\n`
  );

  // Scenario 1: Extension Loading
  console.log('📦 Scenario 1: Extension Loading');
  console.log('   Simulating extension load and capture...\n');

  // Capture screenshot (simulated)
  const extensionLoadScreenshot = Buffer.from('extension-load-screenshot-data');
  const screenshotPath1 = await artifactManager.saveScreenshot(
    'extension-loading',
    extensionLoadScreenshot,
    'Extension loaded in chrome://extensions page'
  );
  console.log(`   ✓ Screenshot saved: ${screenshotPath1}`);

  // Capture accessibility snapshot (simulated)
  const extensionLoadSnapshot = `
heading "Extensions" [level=1]
  button "Developer mode" [pressed=true]
  region "Extension: Language Learning Extension"
    text "ID: abcdef123456"
    text "Version: 1.0.0"
    button "Details"
    button "Remove"
  `;
  const snapshotPath1 = await artifactManager.saveSnapshot(
    'extension-loading',
    extensionLoadSnapshot,
    'Extension list accessibility tree'
  );
  console.log(`   ✓ Snapshot saved: ${snapshotPath1}`);

  // Save console logs
  const consoleLogs1 = [
    '[INFO] Extension manifest loaded',
    '[INFO] Service worker registered: chrome-extension://abcdef123456/background/service-worker.js',
    '[INFO] Content scripts configured',
    '[SUCCESS] Extension loaded successfully',
  ];
  const consoleLogPath1 = await artifactManager.saveConsoleLogs(
    'extension-loading',
    consoleLogs1,
    'Extension loading console output'
  );
  console.log(`   ✓ Console logs saved: ${consoleLogPath1}`);

  // Generate report for extension loading
  const report1 = await artifactManager.generateReport(
    'extension-loading',
    'Extension loaded successfully with all components initialized. Service worker is active and all manifest paths are valid.',
    [],
    [
      'Extension ID: abcdef123456',
      'Service worker status: Active',
      'All manifest paths validated',
      'No console errors detected',
    ]
  );
  console.log(`   ✓ Report generated: ${report1}\n`);

  // Scenario 2: Content Script Injection
  console.log('📝 Scenario 2: Content Script Injection');
  console.log('   Simulating content script injection and testing...\n');

  // Capture before injection
  const beforeInjectionScreenshot = Buffer.from('before-injection-screenshot');
  const screenshotPath2a = await artifactManager.saveScreenshot(
    'content-script-injection',
    beforeInjectionScreenshot,
    'Test page before content script injection'
  );
  console.log(`   ✓ Before screenshot saved: ${screenshotPath2a}`);

  // Capture after injection
  const afterInjectionScreenshot = Buffer.from('after-injection-screenshot');
  const screenshotPath2b = await artifactManager.saveScreenshot(
    'content-script-injection',
    afterInjectionScreenshot,
    'Test page after content script injection'
  );
  console.log(`   ✓ After screenshot saved: ${screenshotPath2b}`);

  // Link related artifacts
  artifactManager.linkArtifacts(screenshotPath2b.split('/').pop()!, [
    screenshotPath2a.split('/').pop()!,
  ]);

  // Capture accessibility snapshot
  const injectionSnapshot = `
article "Test Article for Language Learning"
  heading "Sample Article Title" [level=1]
  paragraph "This is a test article with vocabulary words."
    span "vocabulary" [class="highlighted-word"]
  paragraph "More content for testing."
  `;
  const snapshotPath2 = await artifactManager.saveSnapshot(
    'content-script-injection',
    injectionSnapshot,
    'Page structure after content script injection'
  );
  console.log(`   ✓ Snapshot saved: ${snapshotPath2}`);

  // Save network logs
  const networkRequests = [
    {
      url: 'https://example.com/test-article',
      method: 'GET',
      status: 200,
      timing: { duration: 150 },
    },
    {
      url: 'chrome-extension://abcdef123456/content/content-script.js',
      method: 'GET',
      status: 200,
      timing: { duration: 45 },
    },
  ];
  const networkLogPath = await artifactManager.saveNetworkLogs(
    'content-script-injection',
    networkRequests,
    'Network activity during content script injection'
  );
  console.log(`   ✓ Network logs saved: ${networkLogPath}`);

  // Save console logs
  const consoleLogs2 = [
    '[INFO] Content script injected',
    '[INFO] DOM ready, initializing highlighting',
    '[INFO] Found 5 vocabulary words',
    '[SUCCESS] Content script initialization complete',
  ];
  const consoleLogPath2 = await artifactManager.saveConsoleLogs(
    'content-script-injection',
    consoleLogs2,
    'Content script injection console output'
  );
  console.log(`   ✓ Console logs saved: ${consoleLogPath2}`);

  // Generate report
  const report2 = await artifactManager.generateReport(
    'content-script-injection',
    'Content script successfully injected and functional. Vocabulary highlighting working as expected.',
    ['Minor injection delay of 200ms observed'],
    [
      'Content script injected successfully',
      'Vocabulary highlighting active',
      'Consider preloading content script to reduce injection delay',
      'Optimize script size for faster loading',
    ]
  );
  console.log(`   ✓ Report generated: ${report2}\n`);

  // Scenario 3: Article Processing
  console.log('📚 Scenario 3: Article Processing Workflow');
  console.log('   Simulating complete article processing...\n');

  // Capture processing stages
  const stages = [
    { name: 'extraction', desc: 'Article content extracted' },
    { name: 'ai-processing', desc: 'AI processing in progress' },
    { name: 'learning-interface', desc: 'Learning interface rendered' },
  ];

  for (const stage of stages) {
    const screenshot = Buffer.from(`${stage.name}-screenshot`);
    const path = await artifactManager.saveScreenshot(
      'article-processing',
      screenshot,
      stage.desc
    );
    console.log(`   ✓ ${stage.name} screenshot saved: ${path}`);
  }

  // Save processing logs
  const processingLogs = [
    '[INFO] Article extraction started',
    '[INFO] Using Readability.js for content extraction',
    '[SUCCESS] Article extracted: 1500 words',
    '[INFO] Sending to AI processor',
    '[INFO] AI processing: vocabulary identification',
    '[INFO] AI processing: difficulty analysis',
    '[SUCCESS] Processing complete',
    '[INFO] Opening learning interface',
    '[SUCCESS] Learning interface rendered',
  ];
  const processingLogPath = await artifactManager.saveConsoleLogs(
    'article-processing',
    processingLogs,
    'Complete article processing workflow logs'
  );
  console.log(`   ✓ Processing logs saved: ${processingLogPath}`);

  // Generate report
  const report3 = await artifactManager.generateReport(
    'article-processing',
    'Complete article processing workflow executed successfully. All stages completed without errors.',
    [],
    [
      'Article extraction: 1500 words processed',
      'AI processing time: 2.3 seconds',
      'Learning interface rendered successfully',
      'All interactive features functional',
    ]
  );
  console.log(`   ✓ Report generated: ${report3}\n`);

  // Generate session summary
  console.log('📊 Generating Session Summary...');
  const summaryPath = await artifactManager.generateSessionSummary();
  console.log(`   ✓ Session summary: ${summaryPath}\n`);

  // Display statistics
  console.log('📈 Session Statistics:');
  const scenarios = [
    'extension-loading',
    'content-script-injection',
    'article-processing',
  ];
  let totalArtifacts = 0;

  scenarios.forEach(scenario => {
    const artifacts = artifactManager.getScenarioArtifacts(scenario);
    totalArtifacts += artifacts.length;
    console.log(`   ${scenario}: ${artifacts.length} artifacts`);
  });

  console.log(`   Total: ${totalArtifacts} artifacts\n`);

  console.log('✅ Integrated debugging example complete!');
  console.log(
    `\n📁 All artifacts saved to: ${artifactManager.getSessionDir()}`
  );
  console.log('\n💡 Next steps:');
  console.log('   1. Review generated reports in the reports/ directory');
  console.log('   2. Compare screenshots to identify visual issues');
  console.log('   3. Analyze console logs for errors or warnings');
  console.log('   4. Use snapshots for accessibility testing');
}

// Run the example
runIntegratedDebuggingExample().catch(error => {
  console.error('❌ Error running integrated debugging example:', error);
  process.exit(1);
});
