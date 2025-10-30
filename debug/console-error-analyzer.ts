/**
 * Console Error Analyzer
 *
 * Captures and analyzes console messages from extension contexts:
 * - Retrieves all console logs using mcp_playwright_browser_console_messages
 * - Filters and categorizes errors by type (loading, runtime, import, path)
 * - Generates error summary with file and line information
 *
 * Requirements: 2.4
 */

import * as fs from 'fs';
import * as path from 'path';

// Types for console error analysis
export interface ConsoleMessage {
  type:
    | 'log'
    | 'debug'
    | 'info'
    | 'warning'
    | 'error'
    | 'dir'
    | 'dirxml'
    | 'table'
    | 'trace'
    | 'clear'
    | 'assert';
  text: string;
  location?: {
    url: string;
    lineNumber?: number;
    columnNumber?: number;
  };
  args?: any[];
  stackTrace?: StackFrame[];
  timestamp: number;
}

export interface StackFrame {
  functionName: string;
  url: string;
  lineNumber: number;
  columnNumber: number;
}

export interface CategorizedError {
  type: 'loading' | 'runtime' | 'import' | 'path';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stackTrace?: string;
  context?: string;
  suggestion?: string;
  timestamp: number;
}

export interface ErrorAnalysisResult {
  totalMessages: number;
  totalErrors: number;
  totalWarnings: number;
  categorizedErrors: {
    loading: CategorizedError[];
    runtime: CategorizedError[];
    import: CategorizedError[];
    path: CategorizedError[];
  };
  summary: string;
  recommendations: string[];
}

/**
 * Console Error Analyzer Class
 */
export class ConsoleErrorAnalyzer {
  private messages: ConsoleMessage[] = [];
  private errors: CategorizedError[] = [];

  /**
   * Add console messages for analysis
   */
  addMessages(messages: any[]): void {
    this.messages = messages.map(msg => this.normalizeMessage(msg));
  }

  /**
   * Normalize console message format
   */
  private normalizeMessage(msg: any): ConsoleMessage {
    return {
      type: msg.type || 'log',
      text: msg.text || msg.message || String(msg),
      location:
        msg.location || msg.url
          ? {
              url: msg.location?.url || msg.url || '',
              lineNumber: msg.location?.lineNumber || msg.lineNumber,
              columnNumber: msg.location?.columnNumber || msg.columnNumber,
            }
          : undefined,
      args: msg.args,
      stackTrace: msg.stackTrace,
      timestamp: msg.timestamp || Date.now(),
    };
  }

  /**
   * Analyze all console messages
   */
  analyze(): ErrorAnalysisResult {
    console.log('🔍 Analyzing Console Messages...\n');

    // Filter errors and warnings
    const errors = this.messages.filter(m => m.type === 'error');
    const warnings = this.messages.filter(m => m.type === 'warning');

    console.log(`📊 Total Messages: ${this.messages.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️  Warnings: ${warnings.length}\n`);

    // Categorize errors
    const categorizedErrors: ErrorAnalysisResult['categorizedErrors'] = {
      loading: [],
      runtime: [],
      import: [],
      path: [],
    };

    errors.forEach(error => {
      const categorized = this.categorizeError(error);
      categorizedErrors[categorized.type].push(categorized);
    });

    // Generate summary
    const summary = this.generateSummary(categorizedErrors);

    // Generate recommendations
    const recommendations = this.generateRecommendations(categorizedErrors);

    return {
      totalMessages: this.messages.length,
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      categorizedErrors,
      summary,
      recommendations,
    };
  }

  /**
   * Categorize error by type and extract details
   */
  private categorizeError(error: ConsoleMessage): CategorizedError {
    const text = error.text.toLowerCase();
    const categorized: CategorizedError = {
      type: 'runtime',
      severity: 'medium',
      message: error.text,
      timestamp: error.timestamp,
    };

    // Extract file and line information
    if (error.location) {
      categorized.file = error.location.url;
      categorized.line = error.location.lineNumber;
      categorized.column = error.location.columnNumber;
    }

    // Extract from stack trace if available
    if (error.stackTrace && error.stackTrace.length > 0) {
      const frame = error.stackTrace[0];
      categorized.file = categorized.file || frame.url;
      categorized.line = categorized.line || frame.lineNumber;
      categorized.column = categorized.column || frame.columnNumber;
      categorized.stackTrace = this.formatStackTrace(error.stackTrace);
    }

    // Categorize by error type
    if (this.isLoadingError(text)) {
      categorized.type = 'loading';
      categorized.severity = 'critical';
      categorized.suggestion = this.getLoadingErrorSuggestion(text);
    } else if (this.isImportError(text)) {
      categorized.type = 'import';
      categorized.severity = 'critical';
      categorized.suggestion = this.getImportErrorSuggestion(text);
    } else if (this.isPathError(text)) {
      categorized.type = 'path';
      categorized.severity = 'high';
      categorized.suggestion = this.getPathErrorSuggestion(text);
    } else {
      categorized.type = 'runtime';
      categorized.severity = this.getRuntimeErrorSeverity(text);
      categorized.suggestion = this.getRuntimeErrorSuggestion(text);
    }

    // Extract context from message
    categorized.context = this.extractContext(error.text);

    return categorized;
  }

  /**
   * Check if error is a loading error
   */
  private isLoadingError(text: string): boolean {
    const patterns = [
      'failed to load',
      'cannot load extension',
      'extension load error',
      'manifest error',
      'invalid manifest',
    ];
    return patterns.some(pattern => text.includes(pattern));
  }

  /**
   * Check if error is an import error
   */
  private isImportError(text: string): boolean {
    const patterns = [
      'failed to resolve module',
      'cannot find module',
      'module not found',
      'import error',
      'failed to fetch module',
      'error resolving module specifier',
      'relative reference must start with',
    ];
    return patterns.some(pattern => text.includes(pattern));
  }

  /**
   * Check if error is a path error
   */
  private isPathError(text: string): boolean {
    const patterns = [
      '404',
      'not found',
      'failed to fetch',
      'net::err_file_not_found',
      'failed to load resource',
      'no such file',
    ];
    return patterns.some(pattern => text.includes(pattern));
  }

  /**
   * Get loading error suggestion
   */
  private getLoadingErrorSuggestion(text: string): string {
    if (text.includes('manifest')) {
      return 'Check manifest.json syntax and required fields. Ensure all referenced files exist.';
    }
    return 'Verify extension files are properly built in dist/ directory. Run "pnpm build".';
  }

  /**
   * Get import error suggestion
   */
  private getImportErrorSuggestion(text: string): string {
    if (text.includes('module specifier')) {
      return 'Add .js extension to import statements. ES modules require explicit file extensions.';
    }
    if (text.includes('relative reference')) {
      return 'Use relative paths starting with ./ or ../ for local modules.';
    }
    return 'Check import paths and ensure they are relative to the importing file with .js extensions.';
  }

  /**
   * Get path error suggestion
   */
  private getPathErrorSuggestion(text: string): string {
    if (text.includes('404')) {
      return 'File not found. Check file path is correct and file exists in dist/ directory.';
    }
    return 'Verify file paths are relative to dist/ root and all referenced files exist.';
  }

  /**
   * Get runtime error severity
   */
  private getRuntimeErrorSeverity(
    text: string
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (text.includes('uncaught') || text.includes('unhandled rejection')) {
      return 'high';
    }
    if (text.includes('undefined') || text.includes('null')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Get runtime error suggestion
   */
  private getRuntimeErrorSuggestion(text: string): string {
    if (text.includes('undefined')) {
      return 'Check for undefined variables or properties. Add null checks.';
    }
    if (text.includes('null')) {
      return 'Add null/undefined checks before accessing properties.';
    }
    if (text.includes('permission')) {
      return 'Check manifest.json permissions. Ensure required permissions are declared.';
    }
    return 'Review error message and stack trace for specific issue.';
  }

  /**
   * Extract context from error message
   */
  private extractContext(message: string): string | undefined {
    // Try to extract module name or file path
    const moduleMatch = message.match(/["']([^"']+)["']/);
    if (moduleMatch) {
      return moduleMatch[1];
    }

    // Try to extract URL
    const urlMatch = message.match(
      /(https?:\/\/[^\s]+|chrome-extension:\/\/[^\s]+)/
    );
    if (urlMatch) {
      return urlMatch[1];
    }

    return undefined;
  }

  /**
   * Format stack trace
   */
  private formatStackTrace(frames: StackFrame[]): string {
    return frames
      .map(frame => {
        const func = frame.functionName || '<anonymous>';
        const location = `${frame.url}:${frame.lineNumber}:${frame.columnNumber}`;
        return `  at ${func} (${location})`;
      })
      .join('\n');
  }

  /**
   * Generate summary
   */
  private generateSummary(
    categorized: ErrorAnalysisResult['categorizedErrors']
  ): string {
    const lines: string[] = [];

    lines.push('=== Console Error Analysis Summary ===\n');

    const total = Object.values(categorized).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    lines.push(`Total Errors: ${total}\n`);

    if (total === 0) {
      lines.push('✅ No errors detected!');
      return lines.join('\n');
    }

    lines.push('Errors by Type:');
    Object.entries(categorized).forEach(([type, errors]) => {
      if (errors.length > 0) {
        const critical = errors.filter(e => e.severity === 'critical').length;
        const high = errors.filter(e => e.severity === 'high').length;
        lines.push(
          `  ${type}: ${errors.length} (${critical} critical, ${high} high)`
        );
      }
    });

    return lines.join('\n');
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    categorized: ErrorAnalysisResult['categorizedErrors']
  ): string[] {
    const recommendations: string[] = [];

    // Loading errors
    if (categorized.loading.length > 0) {
      recommendations.push('🔴 CRITICAL: Fix extension loading errors first');
      recommendations.push('  - Verify manifest.json is valid');
      recommendations.push('  - Ensure all referenced files exist in dist/');
      recommendations.push('  - Run "pnpm build" to rebuild extension');
    }

    // Import errors
    if (categorized.import.length > 0) {
      recommendations.push('🔴 CRITICAL: Fix module import errors');
      recommendations.push('  - Add .js extensions to all import statements');
      recommendations.push('  - Use relative paths (./file.js or ../file.js)');
      recommendations.push(
        '  - Check TypeScript configuration for module resolution'
      );
    }

    // Path errors
    if (categorized.path.length > 0) {
      recommendations.push('🟠 HIGH: Fix file path errors');
      recommendations.push('  - Verify all file paths are correct');
      recommendations.push('  - Ensure paths are relative to dist/ root');
      recommendations.push('  - Check for typos in file names');
    }

    // Runtime errors
    if (categorized.runtime.length > 0) {
      recommendations.push('🟡 MEDIUM: Fix runtime errors');
      recommendations.push('  - Add null/undefined checks');
      recommendations.push('  - Verify API permissions in manifest');
      recommendations.push('  - Review error messages and stack traces');
    }

    return recommendations;
  }

  /**
   * Generate detailed report
   */
  generateReport(result: ErrorAnalysisResult): string {
    const lines: string[] = [];

    lines.push('# Console Error Analysis Report');
    lines.push('');
    lines.push(`**Generated:** ${new Date().toISOString()}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push(`- **Total Messages:** ${result.totalMessages}`);
    lines.push(`- **Total Errors:** ${result.totalErrors}`);
    lines.push(`- **Total Warnings:** ${result.totalWarnings}`);
    lines.push('');

    // Errors by type
    lines.push('## Errors by Type');
    lines.push('');
    Object.entries(result.categorizedErrors).forEach(([type, errors]) => {
      lines.push(`### ${type.toUpperCase()} (${errors.length})`);
      lines.push('');

      if (errors.length === 0) {
        lines.push('✅ No errors');
        lines.push('');
        return;
      }

      errors.forEach((error, index) => {
        lines.push(
          `#### ${index + 1}. ${error.severity.toUpperCase()} - ${error.message.substring(0, 100)}...`
        );
        lines.push('');
        if (error.file) {
          lines.push(
            `**File:** ${error.file}${error.line ? `:${error.line}` : ''}`
          );
        }
        if (error.context) {
          lines.push(`**Context:** ${error.context}`);
        }
        if (error.suggestion) {
          lines.push(`**Suggestion:** ${error.suggestion}`);
        }
        if (error.stackTrace) {
          lines.push('');
          lines.push('**Stack Trace:**');
          lines.push('```');
          lines.push(error.stackTrace);
          lines.push('```');
        }
        lines.push('');
      });
    });

    // Recommendations
    if (result.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      result.recommendations.forEach(rec => {
        lines.push(rec);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Save analysis results
   */
  saveResults(result: ErrorAnalysisResult, outputDir: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = path.join(outputDir, `console-analysis-${timestamp}`);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Save JSON
    const jsonPath = path.join(reportDir, 'analysis-result.json');
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));

    // Save markdown report
    const mdPath = path.join(reportDir, 'analysis-report.md');
    fs.writeFileSync(mdPath, this.generateReport(result));

    // Save error list
    const errorsPath = path.join(reportDir, 'errors.txt');
    const errorLines: string[] = [];
    Object.entries(result.categorizedErrors).forEach(([type, errors]) => {
      errors.forEach(error => {
        errorLines.push(`[${type.toUpperCase()}] ${error.message}`);
        if (error.file) {
          errorLines.push(`  File: ${error.file}:${error.line || 0}`);
        }
        errorLines.push('');
      });
    });
    fs.writeFileSync(errorsPath, errorLines.join('\n'));

    console.log(`\n📄 Analysis results saved to: ${reportDir}`);
  }
}

/**
 * Generate MCP calls for console error capture
 */
export function generateConsoleCaptureMCPCalls(): any[] {
  return [
    {
      step: 1,
      description: 'Capture all console messages',
      tool: 'mcp_playwright_browser_console_messages',
      params: {
        onlyErrors: false,
      },
      note: 'Get all console logs for comprehensive analysis',
    },
    {
      step: 2,
      description: 'Capture only error messages',
      tool: 'mcp_playwright_browser_console_messages',
      params: {
        onlyErrors: true,
      },
      note: 'Get filtered error messages for quick review',
    },
  ];
}

// Run if executed directly
const isMainModule =
  import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule) {
  console.log('Console Error Analyzer');
  console.log('=====================\n');

  // Example usage with mock data
  const analyzer = new ConsoleErrorAnalyzer();

  // Mock console messages for demonstration
  const mockMessages = [
    {
      type: 'error',
      text: 'Failed to resolve module specifier "./utils/storage-manager"',
      location: {
        url: 'chrome-extension://abc123/background/service-worker.js',
        lineNumber: 5,
        columnNumber: 10,
      },
      timestamp: Date.now(),
    },
    {
      type: 'error',
      text: 'Failed to fetch: chrome-extension://abc123/content/content-script.js (404)',
      location: {
        url: 'chrome-extension://abc123/manifest.json',
        lineNumber: 1,
      },
      timestamp: Date.now(),
    },
  ];

  analyzer.addMessages(mockMessages);
  const result = analyzer.analyze();

  console.log(result.summary);
  console.log('\n' + analyzer.generateReport(result));

  // Save results
  const outputDir = path.join(process.cwd(), 'debug', 'playwright-reports');
  analyzer.saveResults(result, outputDir);
}
