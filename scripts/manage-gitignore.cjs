/**
 * Helper script to manage .gitignore for different branches
 * Usage:
 *   node scripts/manage-gitignore.js add    - Add dev-docs/ to .gitignore (for main branch)
 *   node scripts/manage-gitignore.js remove - Remove dev-docs/ from .gitignore (for dev branch)
 */

const fs = require('fs');
const path = require('path');

const gitignorePath = path.join(process.cwd(), '.gitignore');
const devDocsLine = 'dev-docs/';

const action = process.argv[2];

if (!action || !['add', 'remove'].includes(action)) {
  console.error('❌ Invalid usage!');
  console.log('\nUsage:');
  console.log('  node scripts/manage-gitignore.js add    - Add dev-docs/ to .gitignore');
  console.log('  node scripts/manage-gitignore.js remove - Remove dev-docs/ from .gitignore');
  process.exit(1);
}

try {
  let content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split('\n');
  const hasDevDocs = lines.some(line => line.trim() === devDocsLine);

  if (action === 'add') {
    if (hasDevDocs) {
      console.log('ℹ️  dev-docs/ is already in .gitignore');
    } else {
      // Add dev-docs/ at the end
      if (!content.endsWith('\n')) {
        content += '\n';
      }
      content += devDocsLine + '\n';
      fs.writeFileSync(gitignorePath, content);
      console.log('✅ Added dev-docs/ to .gitignore');
      console.log('   (Use this on main branch to hide dev-docs from GitHub)');
    }
  } else if (action === 'remove') {
    if (!hasDevDocs) {
      console.log('ℹ️  dev-docs/ is not in .gitignore');
    } else {
      // Remove dev-docs/ line
      const newLines = lines.filter(line => line.trim() !== devDocsLine);
      content = newLines.join('\n');
      fs.writeFileSync(gitignorePath, content);
      console.log('✅ Removed dev-docs/ from .gitignore');
      console.log('   (Use this on dev branch to track dev-docs)');
    }
  }
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
