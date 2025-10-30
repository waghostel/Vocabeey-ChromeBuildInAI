/**
 * Import Path Scanner for Chrome Extension
 * Scans all JavaScript files in dist/ for import path issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const issues = {
  missingExtensions: [],
  totalImports: 0,
  filesScanned: 0,
};

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Match import statements with relative paths
    const importMatch = line.match(/^import\s+.*\s+from\s+['"](\..+?)['"]/);

    if (importMatch) {
      issues.totalImports++;
      const importPath = importMatch[1];

      // Check if missing .js extension
      if (!importPath.endsWith('.js') && !importPath.endsWith('.json')) {
        issues.missingExtensions.push({
          file: filePath,
          line: index + 1,
          currentPath: importPath,
          suggestedPath: importPath + '.js',
          lineContent: line.trim(),
        });
      }
    }
  });
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      issues.filesScanned++;
      scanFile(fullPath);
    }
  }
}

// Start scanning
const distPath = path.join(__dirname, '..', 'dist');
console.log('Scanning dist/ directory for import path issues...\n');
scanDirectory(distPath);

// Generate report
console.log('='.repeat(80));
console.log('IMPORT PATH ANALYSIS REPORT');
console.log('='.repeat(80));
console.log(`\nFiles Scanned: ${issues.filesScanned}`);
console.log(`Total Imports Found: ${issues.totalImports}`);
console.log(`Missing .js Extensions: ${issues.missingExtensions.length}\n`);

if (issues.missingExtensions.length > 0) {
  console.log('CRITICAL ISSUES - Missing .js Extensions:');
  console.log('-'.repeat(80));

  issues.missingExtensions.forEach((issue, index) => {
    console.log(`\n${index + 1}. ${issue.file}:${issue.line}`);
    console.log(`   Current:  ${issue.currentPath}`);
    console.log(`   Should be: ${issue.suggestedPath}`);
    console.log(`   Line: ${issue.lineContent}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('ROOT CAUSE:');
  console.log('='.repeat(80));
  console.log('TypeScript is compiling imports without .js extensions.');
  console.log("Chrome's ES module system requires explicit .js extensions.");
  console.log(
    'This causes "Service worker registration failed. Status code: 3" error.\n'
  );

  console.log('RECOMMENDED FIXES:');
  console.log('-'.repeat(80));
  console.log('1. Add .js extensions in TypeScript source files (imports)');
  console.log('2. Use a post-build script to add .js extensions automatically');
  console.log('3. Configure TypeScript with moduleResolution: "bundler"\n');
}

// Save report to file
const reportPath = path.join(__dirname, 'import-path-report.json');
fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));
console.log(`\nDetailed report saved to: ${reportPath}`);
