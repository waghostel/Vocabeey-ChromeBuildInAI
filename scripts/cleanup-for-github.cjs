/**
 * Cleanup script for preparing main branch for GitHub
 * Moves development markdown files to dev-docs/ folder
 * Removes development tool folders
 */

const fs = require('fs');
const path = require('path');

// Development markdown files to move to dev-docs/
const devMarkdownFiles = [
  'ARTICLE_SEGMENTATION_IMPLEMENTATION.md',
  'BEFORE_AFTER_COMPARISON.md',
  'BUILD_FIX_SUMMARY.md',
  'CARD_CONTEXT_MENU_IMPLEMENTATION.md',
  'CARD_EDIT_DIALOG_IMPLEMENTATION.md',
  'CHINESE_LANGUAGE_SUPPORT.md',
  'CHROME_AI_API_FIX_SUMMARY.md',
  'CHROME_AI_API_NAMESPACES.md',
  'CHROME_AI_USAGE_ANALYSIS.md',
  'CODE_CHANGES.md',
  'CONSOLE_LOGGING_FIX_SUMMARY.md',
  'content-flow-analysis.md',
  'CONTEXT_MENU_FIX.md',
  'CORRECT_API_NAMESPACES.md',
  'diagnose-translation.md',
  'DIAGNOSTIC_IMPLEMENTATION_SUMMARY.md',
  'DISABLE_PARAGRAPH_CONTEXT_MENU_IN_EDIT_MODE.md',
  'DUAL_LANGUAGE_TTS_FEATURE.md',
  'DYNAMIC_TRANSLATION_POPUP_FIX.md',
  'FINAL_FIX_AND_TEST_GUIDE.md',
  'FINAL_FIX_SUMMARY.md',
  'FINAL_IMPLEMENTATION_SUMMARY.md',
  'FIX_COMPLETE_SUMMARY.md',
  'HAMBURGER_MENU_IMPLEMENTATION.md',
  'HAMBURGER_MENU_VISUAL_GUIDE.md',
  'HIGHLIGHT_RESTORATION_IMPLEMENTATION.md',
  'IMPLEMENTATION_COMPLETE.md',
  'IMPLEMENTATION_SUMMARY.md',
  'KEYBOARD_SHORTCUTS_SUMMARY.md',
  'LANGUAGE_BADGE_VISUAL_REFERENCE.md',
  'LANGUAGE_DETECTION_API_IMPLEMENTATION_GUIDE.md',
  'LANGUAGE_DETECTION_BEFORE_AFTER.md',
  'LANGUAGE_DETECTION_CONSOLE_EXAMPLES.md',
  'LANGUAGE_DETECTION_DIAGNOSTIC_LOGGING.md',
  'LANGUAGE_DETECTION_FIX_SUMMARY.md',
  'LANGUAGE_DETECTION_FLOW_ANALYSIS.md',
  'LANGUAGE_DETECTION_IMPLEMENTATION_SUMMARY.md',
  'LANGUAGE_DETECTION_ISSUE_FOUND.md',
  'LANGUAGE_DETECTION_TEST_SCRIPT.md',
  'LANGUAGE_SELECTOR_IMPLEMENTATION.md',
  'MEMORY_OPTIMIZATION_COMPLETE.md',
  'MEMORY_OPTIMIZATION_IMPLEMENTATION.md',
  'MEMORY_OPTIMIZATION_TESTING.md',
  'MEMORY_USAGE_ANALYSIS_REPORT.md',
  'OFFSCREEN_DOCUMENT_ERROR_ANALYSIS.md',
  'OFFSCREEN_DOCUMENT_FIX_SUMMARY.md',
  'ONBOARDING_WIZARD_IMPLEMENTATION.md',
  'ONBOARDING_WIZARD_SUMMARY.md',
  'ONBOARDING_WIZARD_VISUAL_GUIDE.md',
  'OVERLAPPING_HIGHLIGHTS_FEATURE.md',
  'PARAGRAPH_EDIT_FEATURE.md',
  'QUICK_DIAGNOSTIC_REFERENCE.md',
  'README_DOCUMENTATION.md',
  'reload-extension.md',
  'REMOVE_EDIT_FROM_HIGHLIGHT_CONTEXT_MENU.md',
  'RETRY_MECHANISM_COMPARISON.md',
  'SAME_LANGUAGE_TRANSLATION_FIX.md',
  'SEGMENTATION_DIAGNOSTIC_GUIDE.md',
  'SENTENCE_CLICK_TO_PRONOUNCE_IMPLEMENTATION.md',
  'SERVICE_WORKER_IMPORT_FIX.md',
  'SMART_CONTEXT_IMPLEMENTATION.md',
  'test-report.md',
  'TESTING_GUIDE_TRANSLATION_FIX.md',
  'TESTING_HAMBURGER_MENU.md',
  'TRANSLATION_API_COMPARISON_REPORT.md',
  'TRANSLATION_API_OFFICIAL_COMPARISON.md',
  'TRANSLATION_AUTO_RETRY_IMPLEMENTATION.md',
  'TRANSLATION_ERROR_ROOT_CAUSE_ANALYSIS.md',
  'TRANSLATION_FIX_SUMMARY.md',
  'TRANSLATOR_API_OPTIMIZATION_RECOMMENDATIONS.md',
  'TRANSLATOR_API_RETRY_DEBUG_PLAN.md',
  'TTS_AUTO_RETRY_IMPLEMENTATION.md',
  'TTS_AUTO_RETRY_IMPLEMENTATION_PLAN.md',
  'TTS_AUTO_RETRY_TESTING_GUIDE.md',
  'TTS_CANCELLATION_FIX.md',
  'TTS_CANCEL_BUTTON_FIX.md',
  'TTS_IMPORT_ERROR_ANALYSIS.md',
  'TTS_VOICE_CUSTOMIZATION_GUIDE.md',
  'VOCABULARY_TRANSLATION_CONTEXT_ANALYSIS.md',
  'VOCABULARY_TRANSLATION_UPDATE.md',
  'youtube transcript.md',
  'test-language-detection-api.html',
  'test-page.html',
  'hamburger-menu-demo.html',
  'demo-page.html',
  'mcp-config.json',
  'eslint-output.json',
  'vitest.config.d.ts',
  'vitest.config.d.ts.map',
  'vitest.config.js',
  'vitest.config.js.map',
  'vocabeey-user-flow.svg',
  '.github-cleanup.md',
  'QUICK_START_ONBOARDING.md'
];

// Test/demo HTML files to remove
const testFilesToRemove = [
  'test-language-detection-api.html',
  'test-page.html',
  'hamburger-menu-demo.html',
  'demo-page.html'
];

// Config files to remove
const configFilesToRemove = [
  'mcp-config.json',
  'eslint-output.json',
  'vitest.config.d.ts',
  'vitest.config.d.ts.map',
  'vitest.config.js',
  'vitest.config.js.map'
];

// Directories to remove
const dirsToRemove = [
  '.kiro',
  '.amazonq',
  'debug',
  'ignore',
  'demo-page',
  'prompt-api-test',
  'coverage'
];

console.log('🧹 Starting GitHub cleanup...\n');

// Create dev-docs directory if it doesn't exist
const devDocsDir = path.join(process.cwd(), 'dev-docs');
if (!fs.existsSync(devDocsDir)) {
  fs.mkdirSync(devDocsDir, { recursive: true });
  console.log('✓ Created dev-docs/ directory\n');
}

// Move development markdown files to dev-docs/
let filesMoved = 0;
let filesNotFound = 0;

console.log('📦 Moving development markdown files to dev-docs/...\n');

devMarkdownFiles.forEach(file => {
  const sourcePath = path.join(process.cwd(), file);
  const destPath = path.join(devDocsDir, file);
  
  if (fs.existsSync(sourcePath)) {
    try {
      fs.renameSync(sourcePath, destPath);
      console.log(`✓ Moved: ${file} → dev-docs/${file}`);
      filesMoved++;
    } catch (err) {
      console.error(`✗ Error moving ${file}:`, err.message);
    }
  } else {
    filesNotFound++;
  }
});

// Remove test files
console.log('\n🗑️  Removing test/demo files...\n');
let filesRemoved = 0;

[...testFilesToRemove, ...configFilesToRemove].forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✓ Removed: ${file}`);
      filesRemoved++;
    } catch (err) {
      console.error(`✗ Error removing ${file}:`, err.message);
    }
  }
});

// Remove directories
console.log('\n🗑️  Removing development tool directories...\n');
let dirsRemoved = 0;
let dirsNotFound = 0;

dirsToRemove.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✓ Removed directory: ${dir}/`);
      dirsRemoved++;
    } catch (err) {
      console.error(`✗ Error removing ${dir}:`, err.message);
    }
  } else {
    dirsNotFound++;
  }
});

console.log('\n📊 Cleanup Summary:');
console.log(`   Markdown files moved to dev-docs/: ${filesMoved}`);
console.log(`   Test/config files removed: ${filesRemoved}`);
console.log(`   Directories removed: ${dirsRemoved}`);
console.log(`   Files not found: ${filesNotFound + dirsNotFound}`);
console.log('\n✅ Cleanup complete!');
console.log('\n⚠️  IMPORTANT: Add dev-docs/ to .gitignore before committing!');
console.log('\nNext steps:');
console.log('1. Add to .gitignore: echo "dev-docs/" >> .gitignore');
console.log('2. Review changes: git status');
console.log('3. Stage changes: git add -A');
console.log('4. Commit: git commit -m "chore: clean up repository for public release"');
console.log('5. Push to GitHub: git push origin main');
console.log('\n💡 Note: dev-docs/ folder will remain on dev branch for your reference');
