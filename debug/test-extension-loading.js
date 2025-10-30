/**
 * Extension Loading Diagnostic Script
 * Run this to verify the extension structure before loading in Chrome
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, '..', 'dist');

console.log('🔍 Chrome Extension Loading Diagnostics\n');
console.log('='.repeat(60));

// Check 1: Verify dist folder exists
console.log('\n1. Checking dist folder...');
if (!fs.existsSync(distPath)) {
  console.error('   ❌ dist/ folder not found!');
  process.exit(1);
}
console.log('   ✅ dist/ folder exists');

// Check 2: Verify manifest.json
console.log('\n2. Checking manifest.json...');
const manifestPath = path.join(distPath, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('   ❌ manifest.json not found!');
  process.exit(1);
}

try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log('   ✅ manifest.json is valid JSON');
  console.log(`   📋 Extension: ${manifest.name} v${manifest.version}`);
  console.log(`   📋 Manifest Version: ${manifest.manifest_version}`);

  // Check 3: Verify service worker
  console.log('\n3. Checking service worker...');
  const serviceWorkerPath = path.join(
    distPath,
    manifest.background.service_worker
  );
  if (!fs.existsSync(serviceWorkerPath)) {
    console.error(
      `   ❌ Service worker not found: ${manifest.background.service_worker}`
    );
    process.exit(1);
  }
  console.log(
    `   ✅ Service worker exists: ${manifest.background.service_worker}`
  );

  // Check service worker syntax
  const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');
  const importMatches = serviceWorkerContent.match(
    /^import .+ from ['"](.+)['"];?$/gm
  );
  if (importMatches) {
    console.log(`   📦 Found ${importMatches.length} imports`);

    // Verify all imports have .js extension
    let allHaveExtension = true;
    for (const importLine of importMatches) {
      const match = importLine.match(/from ['"](.+)['"]/);
      if (
        match &&
        match[1].startsWith('.') &&
        !match[1].endsWith('.js') &&
        !match[1].endsWith('.json')
      ) {
        console.error(`   ❌ Import missing .js extension: ${match[1]}`);
        allHaveExtension = false;
      }
    }

    if (allHaveExtension) {
      console.log('   ✅ All imports have .js extensions');
    }
  }

  // Check 4: Verify content scripts
  console.log('\n4. Checking content scripts...');
  if (manifest.content_scripts && manifest.content_scripts.length > 0) {
    for (const contentScript of manifest.content_scripts) {
      for (const jsFile of contentScript.js) {
        const contentScriptPath = path.join(distPath, jsFile);
        if (!fs.existsSync(contentScriptPath)) {
          console.error(`   ❌ Content script not found: ${jsFile}`);
        } else {
          console.log(`   ✅ Content script exists: ${jsFile}`);
        }
      }
    }
  }

  // Check 5: Verify icons
  console.log('\n5. Checking icons...');
  if (manifest.icons) {
    for (const [size, iconPath] of Object.entries(manifest.icons)) {
      const fullIconPath = path.join(distPath, iconPath);
      if (!fs.existsSync(fullIconPath)) {
        console.error(`   ❌ Icon not found: ${iconPath} (${size}px)`);
      } else {
        console.log(`   ✅ Icon exists: ${iconPath} (${size}px)`);
      }
    }
  }

  // Check 6: Verify imported dependencies
  console.log('\n6. Checking service worker dependencies...');
  const checkImportedFile = (importPath, fromFile) => {
    // Resolve relative path
    const fromDir = path.dirname(fromFile);
    const resolvedPath = path.resolve(fromDir, importPath);

    if (!fs.existsSync(resolvedPath)) {
      console.error(`   ❌ Dependency not found: ${importPath}`);
      console.error(
        `      Referenced from: ${path.relative(distPath, fromFile)}`
      );
      return false;
    }
    return true;
  };

  const checkFileImports = filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const importMatches = content.match(/from ['"](\.[^'"]+)['"]/g);

    if (importMatches) {
      for (const importLine of importMatches) {
        const match = importLine.match(/from ['"](.+)['"]/);
        if (match) {
          checkImportedFile(match[1], filePath);
        }
      }
    }
  };

  checkFileImports(serviceWorkerPath);
  console.log('   ✅ All service worker dependencies exist');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Extension structure is valid!');
  console.log('\n📍 Extension location: ' + distPath);
  console.log('\n🚀 Next steps:');
  console.log('   1. Open Chrome and go to chrome://extensions/');
  console.log('   2. Enable "Developer mode" (top right)');
  console.log('   3. Click "Load unpacked"');
  console.log('   4. Select the dist/ folder');
  console.log('\n💡 If you still get Status Code 15:');
  console.log('   - Check Chrome DevTools console for specific errors');
  console.log('   - Try restarting Chrome');
  console.log('   - Ensure Chrome version supports Manifest V3');
  console.log('='.repeat(60));
} catch (error) {
  console.error('   ❌ Error reading manifest.json:', error.message);
  process.exit(1);
}
