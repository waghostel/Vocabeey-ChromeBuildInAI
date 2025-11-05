/**
 * Preview what will be moved/removed by cleanup script
 * Run this before actual cleanup to verify
 */

const fs = require('fs');
const path = require('path');

// Development markdown files to move to dev-docs/
const devMarkdownFiles = [
  'ARTICLE_SEGMENTATION_IMPLEMENTATION.md',
  'ARTICLE_SEGMENTATION_USER_GUIDE.md',
  'BEFORE_AFTER_COMPARISON.md',
  'BUILD_FIX_SUMMARY.md',
  'CARD_CONTEXT_MENU_IMPLEMENTATION.md',
  'CARD_EDIT_DIALOG_IMPLEMENTATION.md',
  'CHINESE_LANGUAGE_SUPPORT.md',
  'CHROME_AI_API_FIX_SUMMARY.md',
  'CHROME_AI_API_NAMESPACES.md',
  'CHROME_AI_USAGE_ANALYSIS.md',
  'CLEANUP_EXECUTION_SUMMARY.md',
  'CODE_CHANGES.md',
  'CONSOLE_LOGGING_FIX_SUMMARY.md',
  'content-flow-analysis.md',
  'CONTEXT_MENU_FIX.md',
  'CORRECT_API_NAMESPACES.md',
  'D_F_HOTKEYS_IMPLEMENTATION.md',
  'diagnose-translation.md',
  'DIAGNOSTIC_IMPLEMENTATION_SUMMARY.md',
  'DISABLE_PARAGRAPH_CONTEXT_MENU_IN_EDIT_MODE.md',
  'DUAL_LANGUAGE_TTS_FEATURE.md',
  'DYNAMIC_TRANSLATION_POPUP_FIX.md',
  'FEATURE_GUIDE.md',
  'FINAL_CLEANUP_SUMMARY.md',
  'FINAL_FIX_AND_TEST_GUIDE.md',
  'FINAL_FIX_SUMMARY.md',
  'FINAL_IMPLEMENTATION_SUMMARY.md',
  'FIX_COMPLETE_SUMMARY.md',
  'GIT_UPSTREAM_ISSUE_ANALYSIS.md',
  'GIT_UPSTREAM_QUICK_FIX.md',
  'GITHUB_CLEANUP_SUMMARY.md',
  'GITHUB_DEPLOYMENT_STEPS.md',
  'GITLAB_GITHUB_WORKFLOW.md',
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
  'QUICK_GITHUB_CLEANUP.md',
  'QUICK_REFERENCE.md',
  'QUICK_START_ONBOARDING.md',
  'QUICK_WORKFLOW_REFERENCE.md',
  'README_DOCUMENTATION.md',
  'reload-extension.md',
  'REMOVE_EDIT_FROM_HIGHLIGHT_CONTEXT_MENU.md',
  'RETRY_MECHANISM_COMPARISON.md',
  'SAME_LANGUAGE_TRANSLATION_FIX.md',
  'SEGMENTATION_DIAGNOSTIC_GUIDE.md',
  'SENTENCE_CLICK_TO_PRONOUNCE_IMPLEMENTATION.md',
  'SERVICE_WORKER_IMPORT_FIX.md',
  'SETUP_COMPLETE_SUMMARY.md',
  'SMART_CONTEXT_IMPLEMENTATION.md',
  'test-report.md',
  'TESTING_CHECKLIST.md',
  'TESTING_GUIDE.md',
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
  'USER_GUIDE_PAGE_UPDATE.md',
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
  '.github-cleanup.md'
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

// Directories to remove (dist/ is kept for users)
const dirsToRemove = [
  '.kiro',
  '.amazonq',
  'debug',
  'ignore',
  'demo-page',
  'prompt-api-test',
  'coverage',
  'user-need',
  'assets'
];

console.log('🔍 Preview of cleanup actions:\n');

// Check markdown files to move
console.log('📦 MARKDOWN FILES TO MOVE TO dev-docs/:');
let markdownFound = 0;
let markdownNotFound = 0;
let markdownSize = 0;

devMarkdownFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    markdownSize += stats.size;
    console.log(`   ✓ ${file} (${sizeKB} KB)`);
    markdownFound++;
  } else {
    markdownNotFound++;
  }
});

// Check files to remove
console.log('\n🗑️  FILES TO REMOVE:');
let filesFound = 0;
let filesNotFound = 0;
let totalFileSize = markdownSize;

[...testFilesToRemove, ...configFilesToRemove].forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalFileSize += stats.size;
    console.log(`   ✓ ${file} (${sizeKB} KB)`);
    filesFound++;
  } else {
    filesNotFound++;
  }
});

// Check directories
console.log('\n🗑️  DIRECTORIES TO REMOVE:');
let dirsFound = 0;
let dirsNotFound = 0;

function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    });
  } catch (err) {
    // Ignore errors
  }
  return size;
}

dirsToRemove.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    const size = getDirSize(dirPath);
    const sizeMB = (size / 1024 / 1024).toFixed(2);
    totalFileSize += size;
    console.log(`   ✓ ${dir}/ (${sizeMB} MB)`);
    dirsFound++;
  } else {
    dirsNotFound++;
  }
});

const totalSizeMB = (totalFileSize / 1024 / 1024).toFixed(2);
const markdownSizeMB = (markdownSize / 1024 / 1024).toFixed(2);

console.log('\n📊 Summary:');
console.log(`   Markdown files to move: ${markdownFound} (${markdownSizeMB} MB)`);
console.log(`   Files to remove: ${filesFound}`);
console.log(`   Directories to remove: ${dirsFound}`);
console.log(`   Total size affected: ${totalSizeMB} MB`);

console.log('\n💡 Actions:');
console.log('   1. Creates dev-docs/ folder');
console.log('   2. Moves development markdown files to dev-docs/');
console.log('   3. Removes test/demo files and dev tool directories');
console.log('   4. You must add "dev-docs/" to .gitignore');

console.log('\n🚀 To proceed with cleanup:');
console.log('   node scripts/cleanup-for-github.js');
