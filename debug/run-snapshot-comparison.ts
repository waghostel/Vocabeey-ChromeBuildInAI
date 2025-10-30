/**
 * Snapshot Comparison Execution Script
 *
 * This script demonstrates how to use the snapshot comparison system
 * to analyze and compare accessibility snapshots.
 *
 * Requirements: 5.3
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  SnapshotComparisonSystem,
  ElementReference,
} from './snapshot-comparison-system';

/**
 * Example: Compare snapshots from a test session
 */
export function compareSessionSnapshots(sessionDir: string): void {
  console.log('📊 Snapshot Comparison Analysis\n');

  const snapshotsDir = path.join(sessionDir, 'snapshots');

  if (!fs.existsSync(snapshotsDir)) {
    console.error(`❌ Snapshots directory not found: ${snapshotsDir}`);
    return;
  }

  // Get all snapshot files
  const snapshotFiles = fs
    .readdirSync(snapshotsDir)
    .filter(file => file.endsWith('.txt'))
    .sort();

  console.log(`📁 Found ${snapshotFiles.length} snapshots\n`);

  const system = new SnapshotComparisonSystem();

  // Analyze each snapshot
  console.log('🔍 Analyzing snapshots...\n');

  snapshotFiles.forEach(file => {
    const snapshotPath = path.join(snapshotsDir, file);

    try {
      const analysis = system.analyzeSnapshot(snapshotPath);

      console.log(`📄 ${file}`);
      console.log(`   Elements: ${analysis.totalElements}`);
      console.log(`   Interactive: ${analysis.interactiveElements.length}`);
      console.log(`   Buttons: ${analysis.buttons.length}`);
      console.log(`   Links: ${analysis.links.length}`);
      console.log('');

      // Save analysis report
      const reportPath = path.join(
        snapshotsDir,
        file.replace('.txt', '-analysis.md')
      );
      system.saveAnalysisReport(analysis, reportPath);
    } catch (error) {
      console.error(`   ❌ Error analyzing: ${error}`);
    }
  });

  // Compare consecutive snapshots
  if (snapshotFiles.length >= 2) {
    console.log('🔄 Comparing consecutive snapshots...\n');

    for (let i = 0; i < snapshotFiles.length - 1; i++) {
      const snapshot1 = path.join(snapshotsDir, snapshotFiles[i]);
      const snapshot2 = path.join(snapshotsDir, snapshotFiles[i + 1]);

      try {
        const comparison = system.compareSnapshots(snapshot1, snapshot2);

        console.log(`📊 ${snapshotFiles[i]} → ${snapshotFiles[i + 1]}`);
        console.log(`   Added: ${comparison.addedElements.length}`);
        console.log(`   Removed: ${comparison.removedElements.length}`);
        console.log(`   Modified: ${comparison.modifiedElements.length}`);
        console.log(`   Unchanged: ${comparison.unchangedCount}`);
        console.log('');

        // Save comparison report
        const reportPath = path.join(
          snapshotsDir,
          `comparison-${i + 1}-to-${i + 2}.md`
        );
        system.saveComparisonReport(comparison, reportPath);
      } catch (error) {
        console.error(`   ❌ Error comparing: ${error}`);
      }
    }
  }

  console.log('✅ Snapshot comparison complete!\n');
}

/**
 * Example: Extract interactive elements for testing
 */
export function extractInteractiveElements(snapshotPath: string): void {
  console.log('🎯 Extracting Interactive Elements\n');

  const system = new SnapshotComparisonSystem();

  try {
    const elements = system.extractInteractiveElements(snapshotPath);

    console.log(`📄 Snapshot: ${path.basename(snapshotPath)}`);
    console.log(`🎯 Found ${elements.length} interactive elements\n`);

    if (elements.length > 0) {
      console.log('Interactive Elements:');
      console.log('');

      elements.forEach((element, index) => {
        console.log(`${index + 1}. ${element.type} (uid: ${element.uid})`);
        if (element.name) console.log(`   Name: ${element.name}`);
        if (element.role) console.log(`   Role: ${element.role}`);
        console.log('');
      });

      // Save to JSON for easy reference
      const outputPath = snapshotPath.replace('.txt', '-interactive.json');
      fs.writeFileSync(outputPath, JSON.stringify(elements, null, 2));

      console.log(`💾 Interactive elements saved to: ${outputPath}\n`);
    } else {
      console.log('⚠️  No interactive elements found\n');
    }
  } catch (error) {
    console.error(`❌ Error: ${error}\n`);
  }
}

/**
 * Example: Generate diff commands for manual review
 */
export function generateDiffCommands(sessionDir: string): void {
  console.log('📝 Generating Diff Commands\n');

  const snapshotsDir = path.join(sessionDir, 'snapshots');

  if (!fs.existsSync(snapshotsDir)) {
    console.error(`❌ Snapshots directory not found: ${snapshotsDir}`);
    return;
  }

  const snapshotFiles = fs
    .readdirSync(snapshotsDir)
    .filter(file => file.endsWith('.txt'))
    .sort();

  if (snapshotFiles.length < 2) {
    console.log('⚠️  Need at least 2 snapshots for comparison\n');
    return;
  }

  const system = new SnapshotComparisonSystem();
  const commands: string[] = [];

  console.log('Diff Commands:\n');

  for (let i = 0; i < snapshotFiles.length - 1; i++) {
    const snapshot1 = path.join(snapshotsDir, snapshotFiles[i]);
    const snapshot2 = path.join(snapshotsDir, snapshotFiles[i + 1]);

    const command = system.generateDiffCommand(snapshot1, snapshot2);
    commands.push(command);

    console.log(`# Compare ${snapshotFiles[i]} → ${snapshotFiles[i + 1]}`);
    console.log(command);
    console.log('');
  }

  // Save commands to file
  const commandsPath = path.join(sessionDir, 'diff-commands.sh');
  fs.writeFileSync(commandsPath, commands.join('\n\n'));

  console.log(`💾 Commands saved to: ${commandsPath}\n`);
}

/**
 * Example: Batch comparison workflow
 */
export function batchComparisonWorkflow(sessionDir: string): void {
  console.log('🔄 Batch Comparison Workflow\n');

  const snapshotsDir = path.join(sessionDir, 'snapshots');

  if (!fs.existsSync(snapshotsDir)) {
    console.error(`❌ Snapshots directory not found: ${snapshotsDir}`);
    return;
  }

  const snapshotFiles = fs
    .readdirSync(snapshotsDir)
    .filter(file => file.endsWith('.txt'))
    .sort();

  console.log(`📁 Processing ${snapshotFiles.length} snapshots\n`);

  const system = new SnapshotComparisonSystem();

  // Step 1: Batch analyze all snapshots
  console.log('Step 1: Analyzing all snapshots...');

  const snapshotPaths = snapshotFiles.map(file =>
    path.join(snapshotsDir, file)
  );

  const analyses = system.batchAnalyze(snapshotPaths);

  console.log(`✅ Analyzed ${analyses.length} snapshots\n`);

  // Step 2: Batch compare consecutive pairs
  console.log('Step 2: Comparing consecutive pairs...');

  const pairs: Array<{ before: string; after: string }> = [];
  for (let i = 0; i < snapshotPaths.length - 1; i++) {
    pairs.push({
      before: snapshotPaths[i],
      after: snapshotPaths[i + 1],
    });
  }

  const comparisons = system.batchCompare(pairs);

  console.log(`✅ Compared ${comparisons.length} pairs\n`);

  // Step 3: Generate summary report
  console.log('Step 3: Generating summary report...');

  const summaryLines: string[] = [];

  summaryLines.push('# Batch Comparison Summary');
  summaryLines.push('');
  summaryLines.push(`**Session:** ${path.basename(sessionDir)}`);
  summaryLines.push(`**Snapshots Analyzed:** ${analyses.length}`);
  summaryLines.push(`**Comparisons Made:** ${comparisons.length}`);
  summaryLines.push('');

  summaryLines.push('## Analysis Summary');
  summaryLines.push('');

  analyses.forEach((analysis, index) => {
    summaryLines.push(`### ${index + 1}. ${analysis.filename}`);
    summaryLines.push('');
    summaryLines.push(`- Total Elements: ${analysis.totalElements}`);
    summaryLines.push(`- Interactive: ${analysis.interactiveElements.length}`);
    summaryLines.push(`- Buttons: ${analysis.buttons.length}`);
    summaryLines.push(`- Links: ${analysis.links.length}`);
    summaryLines.push('');
  });

  summaryLines.push('## Comparison Summary');
  summaryLines.push('');

  comparisons.forEach((comparison, index) => {
    summaryLines.push(`### Comparison ${index + 1}`);
    summaryLines.push('');
    summaryLines.push(`**From:** ${path.basename(comparison.snapshot1)}`);
    summaryLines.push(`**To:** ${path.basename(comparison.snapshot2)}`);
    summaryLines.push('');
    summaryLines.push(`- Added: ${comparison.addedElements.length}`);
    summaryLines.push(`- Removed: ${comparison.removedElements.length}`);
    summaryLines.push(`- Modified: ${comparison.modifiedElements.length}`);
    summaryLines.push(`- Unchanged: ${comparison.unchangedCount}`);
    summaryLines.push('');
  });

  const summaryPath = path.join(sessionDir, 'batch-comparison-summary.md');
  fs.writeFileSync(summaryPath, summaryLines.join('\n'));

  console.log(`✅ Summary saved to: ${summaryPath}\n`);
}

/**
 * Main execution function
 */
export function main(): void {
  console.log('🎨 Snapshot Comparison System\n');

  // Example usage - replace with actual session directory
  const exampleSessionDir = 'debug/playwright-reports/session-20241030-143022';

  if (fs.existsSync(exampleSessionDir)) {
    console.log(`Using session: ${exampleSessionDir}\n`);

    // Run all comparison workflows
    compareSessionSnapshots(exampleSessionDir);
    generateDiffCommands(exampleSessionDir);
    batchComparisonWorkflow(exampleSessionDir);
  } else {
    console.log('ℹ️  Example session directory not found');
    console.log(
      '   Create a session first by running visual debugging workflow\n'
    );

    console.log('📖 Usage Examples:\n');
    console.log('1. Compare session snapshots:');
    console.log(
      '   compareSessionSnapshots("debug/playwright-reports/session-XXX")'
    );
    console.log('');
    console.log('2. Extract interactive elements:');
    console.log('   extractInteractiveElements("path/to/snapshot.txt")');
    console.log('');
    console.log('3. Generate diff commands:');
    console.log(
      '   generateDiffCommands("debug/playwright-reports/session-XXX")'
    );
    console.log('');
    console.log('4. Batch comparison:');
    console.log(
      '   batchComparisonWorkflow("debug/playwright-reports/session-XXX")'
    );
    console.log('');
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
