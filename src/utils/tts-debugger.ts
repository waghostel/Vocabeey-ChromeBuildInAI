/**
 * TTS Debugger
 * Debug logging and statistics for Text-to-Speech operations
 */

export interface TTSDebugInfo {
  timestamp: number;
  operationId: string;
  text: string;
  language: string;
  attempts: number;
  success: boolean;
  error?: string;
  duration: number;
  voiceUsed?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export class TTSDebugger {
  private debugLog: TTSDebugInfo[] = [];
  private readonly maxLogSize = 200;
  private debugMode = false;

  constructor() {
    // Check if debug mode is enabled
    void this.loadDebugMode();
  }

  /**
   * Load debug mode from storage
   */
  private async loadDebugMode(): Promise<void> {
    try {
      const { ttsDebugMode } = await chrome.storage.local.get('ttsDebugMode');
      this.debugMode = ttsDebugMode || false;
    } catch {
      this.debugMode = false;
    }
  }

  /**
   * Enable debug mode
   */
  async enableDebugMode(): Promise<void> {
    this.debugMode = true;
    await chrome.storage.local.set({ ttsDebugMode: true });
    console.log('🔊 TTS debug mode ENABLED');
  }

  /**
   * Disable debug mode
   */
  async disableDebugMode(): Promise<void> {
    this.debugMode = false;
    await chrome.storage.local.set({ ttsDebugMode: false });
    console.log('🔊 TTS debug mode DISABLED');
  }

  /**
   * Log TTS attempt
   */
  logTTSAttempt(info: TTSDebugInfo): void {
    this.debugLog.push(info);

    // Keep only last N entries
    if (this.debugLog.length > this.maxLogSize) {
      this.debugLog.shift();
    }

    // Log to console if debug mode is enabled
    if (this.debugMode) {
      this.logToConsole(info);
    }

    // Auto-save to storage periodically
    if (this.debugLog.length % 10 === 0) {
      void this.saveDebugLog();
    }
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(info: TTSDebugInfo): void {
    const emoji = info.success ? '✅' : '❌';

    console.group(`${emoji} 🔊 TTS [${info.operationId}]`);
    console.log('Text:', info.text.substring(0, 50) + '...');
    console.log('Language:', info.language);
    console.log('Attempts:', info.attempts);
    console.log('Duration:', `${info.duration}ms`);

    if (info.voiceUsed) {
      console.log('Voice:', info.voiceUsed);
    }
    if (info.rate !== undefined) {
      console.log('Rate:', info.rate);
    }
    if (info.pitch !== undefined) {
      console.log('Pitch:', info.pitch);
    }
    if (info.volume !== undefined) {
      console.log('Volume:', info.volume);
    }

    if (info.success) {
      console.log('✅ Speech completed successfully');
    } else {
      console.error('Error:', info.error);
    }

    console.groupEnd();
  }

  /**
   * Get debug log
   */
  getDebugLog(): TTSDebugInfo[] {
    return [...this.debugLog];
  }

  /**
   * Get debug statistics
   */
  getDebugStats(): {
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
    avgAttempts: number;
    errorTypes: Record<string, number>;
    languageDistribution: Record<string, number>;
    mostUsedVoices: Record<string, number>;
  } {
    const total = this.debugLog.length;
    const successful = this.debugLog.filter(l => l.success).length;
    const failed = total - successful;

    const avgDuration =
      total > 0
        ? this.debugLog.reduce((sum, l) => sum + l.duration, 0) / total
        : 0;

    const avgAttempts =
      total > 0
        ? this.debugLog.reduce((sum, l) => sum + l.attempts, 0) / total
        : 0;

    const errorTypes: Record<string, number> = {};
    this.debugLog
      .filter(l => !l.success && l.error)
      .forEach(l => {
        const errorType = l.error!.split(':')[0];
        errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
      });

    const languageDistribution: Record<string, number> = {};
    this.debugLog.forEach(l => {
      languageDistribution[l.language] =
        (languageDistribution[l.language] || 0) + 1;
    });

    const mostUsedVoices: Record<string, number> = {};
    this.debugLog
      .filter(l => l.voiceUsed)
      .forEach(l => {
        mostUsedVoices[l.voiceUsed!] = (mostUsedVoices[l.voiceUsed!] || 0) + 1;
      });

    return {
      total,
      successful,
      failed,
      avgDuration: Math.round(avgDuration),
      avgAttempts: Math.round(avgAttempts * 10) / 10,
      errorTypes,
      languageDistribution,
      mostUsedVoices,
    };
  }

  /**
   * Export debug log as JSON
   */
  exportDebugLog(): string {
    return JSON.stringify(
      {
        timestamp: Date.now(),
        stats: this.getDebugStats(),
        log: this.debugLog,
      },
      null,
      2
    );
  }

  /**
   * Save debug log to storage
   */
  private async saveDebugLog(): Promise<void> {
    try {
      await chrome.storage.local.set({
        ttsDebugLog: this.debugLog,
        ttsDebugTimestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Failed to save TTS debug log:', error);
    }
  }

  /**
   * Load debug log from storage
   */
  async loadDebugLog(): Promise<void> {
    try {
      const { ttsDebugLog } = await chrome.storage.local.get('ttsDebugLog');
      if (ttsDebugLog) {
        this.debugLog = ttsDebugLog;
      }
    } catch (error) {
      console.warn('Failed to load TTS debug log:', error);
    }
  }

  /**
   * Clear debug log
   */
  async clearDebugLog(): Promise<void> {
    this.debugLog = [];
    await chrome.storage.local.remove(['ttsDebugLog', 'ttsDebugTimestamp']);
    console.log('🗑️ TTS debug log cleared');
  }
}

// Singleton instance
let debuggerInstance: TTSDebugger | null = null;

export function getTTSDebugger(): TTSDebugger {
  if (!debuggerInstance) {
    debuggerInstance = new TTSDebugger();
  }
  return debuggerInstance;
}
