"use strict";
/**
 * Debug console commands for translation debugging
 * Usage: Open browser console and type these commands
 */
// Enable debug mode
window.enableTranslationDebug = async () => {
    const response = await chrome.runtime.sendMessage({
        type: 'DEBUG_ENABLE_TRANSLATION',
    });
    console.log('Translation debug mode:', response.success ? 'ENABLED ✅' : 'FAILED ❌');
};
// Disable debug mode
window.disableTranslationDebug = async () => {
    const response = await chrome.runtime.sendMessage({
        type: 'DEBUG_DISABLE_TRANSLATION',
    });
    console.log('Translation debug mode:', response.success ? 'DISABLED' : 'FAILED ❌');
};
// Get translation statistics
window.getTranslationStats = async () => {
    const response = await chrome.runtime.sendMessage({
        type: 'DEBUG_GET_TRANSLATION_STATS',
    });
    if (response.success) {
        console.table(response.data);
        return response.data;
    }
    else {
        console.error('Failed to get stats');
    }
};
// Get translation log
window.getTranslationLog = async () => {
    const response = await chrome.runtime.sendMessage({
        type: 'DEBUG_GET_TRANSLATION_LOG',
    });
    if (response.success) {
        console.log('Translation log:', response.data);
        return response.data;
    }
    else {
        console.error('Failed to get log');
    }
};
// Export translation log
window.exportTranslationLog = async () => {
    const response = await chrome.runtime.sendMessage({
        type: 'DEBUG_EXPORT_TRANSLATION_LOG',
    });
    if (response.success) {
        // Download as JSON file
        const blob = new Blob([response.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `translation-debug-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        console.log('Translation log exported ✅');
    }
    else {
        console.error('Failed to export log');
    }
};
// Clear translation log
window.clearTranslationLog = async () => {
    const response = await chrome.runtime.sendMessage({
        type: 'DEBUG_CLEAR_TRANSLATION_LOG',
    });
    console.log('Translation log:', response.success ? 'CLEARED ✅' : 'FAILED ❌');
};
// Show help
window.translationDebugHelp = () => {
    console.log(`
🐛 Translation Debug Commands:

enableTranslationDebug()    - Enable detailed logging
disableTranslationDebug()   - Disable detailed logging
getTranslationStats()       - Show translation statistics
getTranslationLog()         - Show full translation log
exportTranslationLog()      - Download log as JSON file
clearTranslationLog()       - Clear the debug log
translationDebugHelp()      - Show this help message

Example:
  await enableTranslationDebug();
  // ... use the extension ...
  await getTranslationStats();
  await exportTranslationLog();
  `);
};
// Auto-show help on load
console.log('💡 Type translationDebugHelp() for translation debugging commands');
//# sourceMappingURL=debug-console.js.map