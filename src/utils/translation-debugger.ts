export interface TranslationDebugInfo {
  timestamp: number;
  operationId: string;
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  context: string;
  attempts: number;
  success: boolean;
  result?: string;
  error?: string;
  duration: number;
  cacheHit: boolean;
  apiAvailability?: string;
  sessionReused: boolean;
  sameLanguage?: boolean;
}

export class TranslationDebugger {
  private debugLog: TranslationDebugInfo[] = [];
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
      const { debugMode } = await chrome.storage.local.get('debugMode');
      this.debugMode = debugMode || false;
    } catch {
      this.debugMode = false;
    }
  }

  /**
   * Enable debug mode
   */
  async enableDebugMode(): Promise<void> {
    this.debugMode = true;
    await chrome.storage.local.set({ debugMode: true });
    console.log('🐛 Translation debug mode ENABLED');
  }

  /**
   * Disable debug mode
   */
  async disableDebugMode(): Promise<void> {
    this.debugMode = false;
    await chrome.storage.local.set({ debugMode: false });
    console.log('🐛 Translation debug mode DISABLED');
  }

  /**
   * Log translation attempt
   */
  logTranslation(info: TranslationDebugInfo): void {
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
  private logToConsole(info: TranslationDebugInfo): void {
    const emoji = info.success ? '✅' : '❌';
    const cacheEmoji = info.cacheHit ? '💾' : '🌐';

    console.group(`${emoji} ${cacheEmoji} Translation [${info.operationId}]`);
    console.log('Text:', info.text.substring(0, 50) + '...');
    console.log(
      'Languages:',
      `${info.sourceLanguage} → ${info.targetLanguage}`
    );
    console.log('Context:', info.context);
    console.log('Attempts:', info.attempts);
    console.log('Duration:', `${info.duration}ms`);
    console.log('Cache Hit:', info.cacheHit);
    console.log('API Availability:', info.apiAvailability);
    console.log('Session Reused:', info.sessionReused);

    if (info.success) {
      console.log('Result:', info.result?.substring(0, 50) + '...');
    } else {
      console.error('Error:', info.error);
    }

    console.groupEnd();
  }

  /**
   * Get debug log
   */
  getDebugLog(): TranslationDebugInfo[] {
    return [...this.debugLog];
  }

  /**
   * Get debug statistics
   */
  getDebugStats(): {
    total: number;
    successful: number;
    failed: number;
    cacheHits: number;
    avgDuration: number;
    avgAttempts: number;
    errorTypes: Record<string, number>;
  } {
    const total = this.debugLog.length;
    const successful = this.debugLog.filter(l => l.success).length;
    const failed = total - successful;
    const cacheHits = this.debugLog.filter(l => l.cacheHit).length;

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

    return {
      total,
      successful,
      failed,
      cacheHits,
      avgDuration: Math.round(avgDuration),
      avgAttempts: Math.round(avgAttempts * 10) / 10,
      errorTypes,
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
        translationDebugLog: this.debugLog,
        translationDebugTimestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Failed to save debug log:', error);
    }
  }

  /**
   * Load debug log from storage
   */
  async loadDebugLog(): Promise<void> {
    try {
      const { translationDebugLog } = await chrome.storage.local.get(
        'translationDebugLog'
      );
      if (translationDebugLog) {
        this.debugLog = translationDebugLog;
      }
    } catch (error) {
      console.warn('Failed to load debug log:', error);
    }
  }

  /**
   * Clear debug log
   */
  async clearDebugLog(): Promise<void> {
    this.debugLog = [];
    await chrome.storage.local.remove([
      'translationDebugLog',
      'translationDebugTimestamp',
    ]);
    console.log('🗑️ Translation debug log cleared');
  }
}

// Singleton instance
let debuggerInstance: TranslationDebugger | null = null;

export function getTranslationDebugger(): TranslationDebugger {
  if (!debuggerInstance) {
    debuggerInstance = new TranslationDebugger();
  }
  return debuggerInstance;
}
