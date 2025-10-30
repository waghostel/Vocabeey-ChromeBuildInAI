/**
 * Visual Debugging System for Playwright MCP Extension Testing
 *
 * This module provides screenshot capture, accessibility snapshot management,
 * and artifact organization for visual debugging of the Chrome extension.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Screenshot capture points in the workflow
 */
export enum CapturePoint {
  EXTENSION_LOADED = 'extension-loaded',
  CONTENT_SCRIPT_INJECTED = 'content-script-injected',
  ARTICLE_PAGE_INITIAL = 'article-page-initial',
  ARTICLE_PROCESSING_START = 'article-processing-start',
  ARTICLE_PROCESSING_COMPLETE = 'article-processing-complete',
  LEARNING_INTERFACE_OPENED = 'learning-interface-opened',
  LEARNING_INTERFACE_RENDERED = 'learning-interface-rendered',
  VOCABULARY_HIGHLIGHTED = 'vocabulary-highlighted',
  TRANSLATION_POPUP = 'translation-popup',
  SENTENCE_MODE_ACTIVE = 'sentence-mode-active',
  TTS_ACTIVATED = 'tts-activated',
  ERROR_STATE = 'error-state',
}

/**
 * Screenshot metadata
 */
export interface ScreenshotMetadata {
  capturePoint: CapturePoint;
  timestamp: number;
  filename: string;
  fullPath: string;
  description: string;
  scenario?: string;
  pageUrl?: string;
  fullPage: boolean;
}

/**
 * Accessibility snapshot metadata
 */
export interface SnapshotMetadata {
  capturePoint: CapturePoint;
  timestamp: number;
  filename: string;
  fullPath: string;
  description: string;
  scenario?: string;
  pageUrl?: string;
  elementCount?: number;
  hasInteractiveElements?: boolean;
}

/**
 * Debugging artifact collection
 */
export interface DebuggingArtifacts {
  screenshots: ScreenshotMetadata[];
  snapshots: SnapshotMetadata[];
  consoleLogs: string;
  networkRequests: string;
  reportPath: string;
}

/**
 * Screenshot capture configuration
 */
export interface ScreenshotConfig {
  capturePoint: CapturePoint;
  fullPage?: boolean;
  description: string;
  scenario?: string;
}

/**
 * Visual Debugging System
 *
 * Manages screenshot capture, accessibility snapshots, and artifact organization
 */
export class VisualDebuggingSystem {
  private reportDir: string;
  private screenshotsDir: string;
  private snapshotsDir: string;
  private logsDir: string;
  private screenshots: ScreenshotMetadata[] = [];
  private snapshots: SnapshotMetadata[] = [];
  private sessionId: string;

  constructor(baseDir: string = 'debug/playwright-reports') {
    this.sessionId = this.generateSessionId();
    this.reportDir = path.join(baseDir, this.sessionId);
    this.screenshotsDir = path.join(this.reportDir, 'screenshots');
    this.snapshotsDir = path.join(this.reportDir, 'snapshots');
    this.logsDir = path.join(this.reportDir, 'logs');

    this.initializeDirectories();
  }

  /**
   * Generate unique session ID with timestamp
   */
  private generateSessionId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `session-${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  /**
   * Initialize directory structure for debugging artifacts
   */
  private initializeDirectories(): void {
    const dirs = [
      this.reportDir,
      this.screenshotsDir,
      this.snapshotsDir,
      this.logsDir,
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Generate screenshot filename with timestamp and capture point
   */
  private generateScreenshotFilename(config: ScreenshotConfig): string {
    const timestamp = Date.now();
    const capturePoint = config.capturePoint.replace(/_/g, '-');
    const scenario = config.scenario ? `-${config.scenario}` : '';

    return `${timestamp}-${capturePoint}${scenario}.png`;
  }

  /**
   * Generate snapshot filename with timestamp and capture point
   */
  private generateSnapshotFilename(config: ScreenshotConfig): string {
    const timestamp = Date.now();
    const capturePoint = config.capturePoint.replace(/_/g, '-');
    const scenario = config.scenario ? `-${config.scenario}` : '';

    return `${timestamp}-${capturePoint}${scenario}.txt`;
  }

  /**
   * Get MCP screenshot parameters for a capture point
   *
   * Requirements: 5.1, 5.2
   */
  public getScreenshotParameters(config: ScreenshotConfig): {
    tool: string;
    parameters: {
      filename: string;
      fullPage?: boolean;
      type?: string;
    };
  } {
    const filename = this.generateScreenshotFilename(config);
    const fullPath = path.join(this.screenshotsDir, filename);

    return {
      tool: 'mcp_playwright_browser_take_screenshot',
      parameters: {
        filename: fullPath,
        fullPage: config.fullPage ?? false,
        type: 'png',
      },
    };
  }

  /**
   * Record screenshot capture
   */
  public recordScreenshot(
    config: ScreenshotConfig,
    pageUrl?: string
  ): ScreenshotMetadata {
    const filename = this.generateScreenshotFilename(config);
    const fullPath = path.join(this.screenshotsDir, filename);

    const metadata: ScreenshotMetadata = {
      capturePoint: config.capturePoint,
      timestamp: Date.now(),
      filename,
      fullPath,
      description: config.description,
      scenario: config.scenario,
      pageUrl,
      fullPage: config.fullPage ?? false,
    };

    this.screenshots.push(metadata);
    return metadata;
  }

  /**
   * Get MCP snapshot parameters for a capture point
   *
   * Requirements: 5.3
   */
  public getSnapshotParameters(): {
    tool: string;
    parameters: Record<string, never>;
  } {
    return {
      tool: 'mcp_playwright_browser_snapshot',
      parameters: {},
    };
  }

  /**
   * Record accessibility snapshot capture
   */
  public recordSnapshot(
    config: ScreenshotConfig,
    snapshotData: any,
    pageUrl?: string
  ): SnapshotMetadata {
    const filename = this.generateSnapshotFilename(config);
    const fullPath = path.join(this.snapshotsDir, filename);

    // Save snapshot data to file
    const snapshotContent =
      typeof snapshotData === 'string'
        ? snapshotData
        : JSON.stringify(snapshotData, null, 2);

    fs.writeFileSync(fullPath, snapshotContent);

    // Extract element count and interactive elements
    const elementCount = this.countElements(snapshotData);
    const hasInteractiveElements = this.hasInteractiveElements(snapshotData);

    const metadata: SnapshotMetadata = {
      capturePoint: config.capturePoint,
      timestamp: Date.now(),
      filename,
      fullPath,
      description: config.description,
      scenario: config.scenario,
      pageUrl,
      elementCount,
      hasInteractiveElements,
    };

    this.snapshots.push(metadata);
    return metadata;
  }

  /**
   * Count elements in snapshot data
   */
  private countElements(snapshotData: any): number {
    if (typeof snapshotData === 'string') {
      // Count lines as rough element count
      return snapshotData.split('\n').length;
    }

    if (Array.isArray(snapshotData)) {
      return snapshotData.length;
    }

    return 0;
  }

  /**
   * Check if snapshot contains interactive elements
   */
  private hasInteractiveElements(snapshotData: any): boolean {
    const content =
      typeof snapshotData === 'string'
        ? snapshotData
        : JSON.stringify(snapshotData);

    const interactiveKeywords = [
      'button',
      'link',
      'input',
      'select',
      'checkbox',
      'radio',
      'clickable',
    ];

    return interactiveKeywords.some(keyword =>
      content.toLowerCase().includes(keyword)
    );
  }

  /**
   * Save console logs to file
   *
   * Requirements: 5.4, 5.5
   */
  public saveConsoleLogs(logs: any[], scenario?: string): string {
    const filename = scenario
      ? `console-logs-${scenario}.json`
      : 'console-logs.json';

    const fullPath = path.join(this.logsDir, filename);

    fs.writeFileSync(fullPath, JSON.stringify(logs, null, 2));

    return fullPath;
  }

  /**
   * Save network requests to file
   *
   * Requirements: 5.4, 5.5
   */
  public saveNetworkRequests(requests: any[], scenario?: string): string {
    const filename = scenario
      ? `network-requests-${scenario}.json`
      : 'network-requests.json';

    const fullPath = path.join(this.logsDir, filename);

    fs.writeFileSync(fullPath, JSON.stringify(requests, null, 2));

    return fullPath;
  }

  /**
   * Get all debugging artifacts
   */
  public getArtifacts(): DebuggingArtifacts {
    return {
      screenshots: this.screenshots,
      snapshots: this.snapshots,
      consoleLogs: path.join(this.logsDir, 'console-logs.json'),
      networkRequests: path.join(this.logsDir, 'network-requests.json'),
      reportPath: this.reportDir,
    };
  }

  /**
   * Organize artifacts by scenario
   *
   * Requirements: 5.4, 5.5
   */
  public organizeByScenario(scenario: string): {
    screenshots: ScreenshotMetadata[];
    snapshots: SnapshotMetadata[];
  } {
    return {
      screenshots: this.screenshots.filter(s => s.scenario === scenario),
      snapshots: this.snapshots.filter(s => s.scenario === scenario),
    };
  }

  /**
   * Generate artifact index file
   */
  public generateArtifactIndex(): string {
    const indexPath = path.join(this.reportDir, 'artifact-index.json');

    const index = {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      screenshots: this.screenshots,
      snapshots: this.snapshots,
      directories: {
        screenshots: this.screenshotsDir,
        snapshots: this.snapshotsDir,
        logs: this.logsDir,
      },
    };

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));

    return indexPath;
  }

  /**
   * Get report directory path
   */
  public getReportDir(): string {
    return this.reportDir;
  }

  /**
   * Get screenshots directory path
   */
  public getScreenshotsDir(): string {
    return this.screenshotsDir;
  }

  /**
   * Get snapshots directory path
   */
  public getSnapshotsDir(): string {
    return this.snapshotsDir;
  }

  /**
   * Get session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }
}
