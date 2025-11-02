/**
 * TTS Debug Console Commands
 * Browser console commands for TTS debugging
 */

import { getTTSDebugger } from './tts-debugger';

/**
 * Initialize TTS debug console commands
 */
export function initTTSDebugConsole(): void {
  const ttsDebugger = getTTSDebugger();

  // Enable TTS debug mode
  (window as any).enableTTSDebug = async () => {
    await ttsDebugger.enableDebugMode();
    console.log('✅ TTS debug mode enabled');
    console.log('Use getTTSStats() to view statistics');
    console.log('Use getTTSLog() to view debug log');
    console.log('Use exportTTSLog() to export log as JSON');
    console.log('Use clearTTSLog() to clear the log');
    console.log('Use disableTTSDebug() to disable debug mode');
  };

  // Disable TTS debug mode
  (window as any).disableTTSDebug = async () => {
    await ttsDebugger.disableDebugMode();
    console.log('✅ TTS debug mode disabled');
  };

  // Get TTS statistics
  (window as any).getTTSStats = () => {
    const stats = ttsDebugger.getDebugStats();
    console.log('📊 TTS Statistics:');
    console.table({
      'Total Attempts': stats.total,
      Successful: stats.successful,
      Failed: stats.failed,
      'Success Rate': `${((stats.successful / stats.total) * 100).toFixed(1)}%`,
      'Avg Duration': `${stats.avgDuration}ms`,
      'Avg Attempts': stats.avgAttempts,
    });

    if (Object.keys(stats.errorTypes).length > 0) {
      console.log('\n❌ Error Types:');
      console.table(stats.errorTypes);
    }

    if (Object.keys(stats.languageDistribution).length > 0) {
      console.log('\n🌍 Language Distribution:');
      console.table(stats.languageDistribution);
    }

    if (Object.keys(stats.mostUsedVoices).length > 0) {
      console.log('\n🔊 Most Used Voices:');
      console.table(stats.mostUsedVoices);
    }

    return stats;
  };

  // Get TTS log
  (window as any).getTTSLog = () => {
    const log = ttsDebugger.getDebugLog();
    console.log(`📋 TTS Debug Log (${log.length} entries):`);
    console.table(
      log.map(entry => ({
        Time: new Date(entry.timestamp).toLocaleTimeString(),
        Text: entry.text.substring(0, 30) + '...',
        Language: entry.language,
        Attempts: entry.attempts,
        Success: entry.success ? '✅' : '❌',
        Duration: `${entry.duration}ms`,
        Voice: entry.voiceUsed || 'N/A',
      }))
    );
    return log;
  };

  // Export TTS log
  (window as any).exportTTSLog = () => {
    const json = ttsDebugger.exportDebugLog();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tts-debug-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('✅ TTS debug log exported');
  };

  // Clear TTS log
  (window as any).clearTTSLog = async () => {
    await ttsDebugger.clearDebugLog();
    console.log('✅ TTS debug log cleared');
  };

  // Show help
  (window as any).ttsDebugHelp = () => {
    console.log('🔊 TTS Debug Commands:');
    console.log('');
    console.log('  enableTTSDebug()    - Enable TTS debug mode');
    console.log('  disableTTSDebug()   - Disable TTS debug mode');
    console.log('  getTTSStats()       - View TTS statistics');
    console.log('  getTTSLog()         - View TTS debug log');
    console.log('  exportTTSLog()      - Export log as JSON file');
    console.log('  clearTTSLog()       - Clear the debug log');
    console.log('  ttsDebugHelp()      - Show this help message');
    console.log('');
    console.log('Example usage:');
    console.log('  1. enableTTSDebug()');
    console.log('  2. Click pronounce buttons to test TTS');
    console.log('  3. getTTSStats() to view statistics');
    console.log('  4. exportTTSLog() to download debug data');
  };

  // Show help on initialization
  console.log('🔊 TTS Debug Console initialized');
  console.log('Type ttsDebugHelp() for available commands');
}
