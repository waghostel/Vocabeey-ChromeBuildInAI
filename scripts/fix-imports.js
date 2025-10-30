/**
 * Post-Build Import Fixer
 * Adds .js extensions to all relative imports in compiled JavaScript files
 *
 * This fixes the "Service worker registration failed. Status code: 3" error
 * caused by Chrome's strict ES module requirements.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fix imports in a single JavaScript file
 * @param {string} filePath - Path to the JavaScript file
 * @returns {boolean} - True if file was modified
 */
function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix relative imports with ../ pattern (without .js extension)
  const parentImportRegex = /from\s+['"](\.\.[/\\][^'"]+)['"]/g;
  content = content.replace(parentImportRegex, (match, importPath) => {
    if (!importPath.endsWith('.js') && !importPath.endsWith('.json')) {
      modified = true;
      return `from '${importPath}.js'`;
    }
    return match;
  });

  // Fix relative imports with ./ pattern (without .js extension)
  const currentImportRegex = /from\s+['"](\.\/[^'"]+)['"]/g;
  content = content.replace(currentImportRegex, (match, importPath) => {
    if (!importPath.endsWith('.js') && !importPath.endsWith('.json')) {
      modified = true;
      return `from '${importPath}.js'`;
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Fixed: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  return false;
}

/**
 * Recursively process all JavaScript files in a directory
 * @param {string} dir - Directory to process
 * @returns {number} - Number of files fixed
 */
function processDirectory(dir) {
  let fixedCount = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      fixedCount += processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      if (fixImportsInFile(fullPath)) {
        fixedCount++;
      }
    }
  }

  return fixedCount;
}

// Main execution
console.log('🔧 Fixing import paths in dist/...\n');

const distPath = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(distPath)) {
  console.error('❌ Error: dist/ directory not found. Run `pnpm build` first.');
  process.exit(1);
}

const startTime = Date.now();
const fixedCount = processDirectory(distPath);
const duration = Date.now() - startTime;

console.log('\n' + '='.repeat(60));
if (fixedCount > 0) {
  console.log(`✅ Successfully fixed ${fixedCount} file(s) in ${duration}ms`);
  console.log('   All imports now have .js extensions');
} else {
  console.log('✅ No fixes needed - all imports already have .js extensions');
}
console.log('='.repeat(60));
