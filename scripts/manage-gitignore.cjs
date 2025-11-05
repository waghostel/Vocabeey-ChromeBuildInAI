/**
 * Helper script to manage .gitignore for different branches
 * Usage:
 *   node scripts/manage-gitignore.cjs dev  - Configure for dev branch (track dist/, dev-docs/)
 *   node scripts/manage-gitignore.cjs main - Configure for main branch (ignore dist/, dev-docs/)
 */

const fs = require('fs');
const path = require('path');

const gitignorePath = path.join(process.cwd(), '.gitignore');
const devDocsLine = 'dev-docs/';
const distLine = 'dist/';

const action = process.argv[2];

if (!action || !['dev', 'main'].includes(action)) {
  console.error('❌ Invalid usage!');
  console.log('\nUsage:');
  console.log('  node scripts/manage-gitignore.cjs dev  - Configure for dev branch');
  console.log('  node scripts/manage-gitignore.cjs main - Configure for main branch');
  process.exit(1);
}

function toggleLine(lines, lineToToggle, shouldInclude) {
  const hasLine = lines.some(line => line.trim() === lineToToggle);
  
  if (shouldInclude && !hasLine) {
    lines.push(lineToToggle);
    return true; // changed
  } else if (!shouldInclude && hasLine) {
    const index = lines.findIndex(line => line.trim() === lineToToggle);
    lines.splice(index, 1);
    return true; // changed
  }
  return false; // no change
}

try {
  let content = fs.readFileSync(gitignorePath, 'utf8');
  let lines = content.split('\n');
  let changes = [];

  if (action === 'dev') {
    // Dev branch: Remove dist/ and dev-docs/ from .gitignore to track them
    console.log('🔧 Configuring .gitignore for dev branch...\n');
    
    if (toggleLine(lines, distLine, false)) {
      changes.push('✓ Removed dist/ from .gitignore (will track build output)');
    }
    if (toggleLine(lines, devDocsLine, false)) {
      changes.push('✓ Removed dev-docs/ from .gitignore (will track dev docs)');
    }
    
    if (changes.length === 0) {
      console.log('ℹ️  .gitignore already configured for dev branch');
    } else {
      fs.writeFileSync(gitignorePath, lines.join('\n'));
      changes.forEach(msg => console.log(msg));
      console.log('\n✅ Dev branch configuration complete!');
      console.log('   dist/ and dev-docs/ will now be tracked in git');
    }
    
  } else if (action === 'main') {
    // Main branch: Keep dist/ tracked, only ignore dev-docs/
    console.log('🔧 Configuring .gitignore for main branch...\n');
    
    // Remove dist/ from .gitignore if present (we want to track it on main)
    if (toggleLine(lines, distLine, false)) {
      changes.push('✓ Removed dist/ from .gitignore (will track for users)');
    }
    
    // Add dev-docs/ to .gitignore
    if (toggleLine(lines, devDocsLine, true)) {
      changes.push('✓ Added dev-docs/ to .gitignore (will exclude dev docs)');
    }
    
    if (changes.length === 0) {
      console.log('ℹ️  .gitignore already configured for main branch');
    } else {
      fs.writeFileSync(gitignorePath, lines.join('\n'));
      changes.forEach(msg => console.log(msg));
      console.log('\n✅ Main branch configuration complete!');
      console.log('   dist/ will be tracked (for easy user installation)');
      console.log('   dev-docs/ will be excluded');
    }
  }
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
