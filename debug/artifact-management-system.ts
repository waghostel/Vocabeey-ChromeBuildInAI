/**
 * Artifact Management System
 *
 * This module provides comprehensive artifact organization, including
 * timestamped directories, scenario grouping, and report generation.
 *
 * Requirements: 5.4, 5.5
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ArtifactMetadata {
  timestamp: string;
  scenario: string;
  type: 'screenshot' | 'snapshot' | 'console-log' | 'network-log' | 'report';
  description?: string;
  relatedArtifacts?: string[];
}

export interface DebugReport {
  sessionId: string;
  timestamp: string;
  scenario: string;
  artifacts: ArtifactMetadata[];
  summary: string;
  errors?: string[];
  recommendations?: string[];
}

export class ArtifactManager {
  private baseDir: string;
  private sessionId: string;
  private artifacts: Map<string, ArtifactMetadata>;

  constructor(baseDir: string = './debug/reports') {
    this.baseDir = baseDir;
    this.sessionId = this.generateSessionId();
    this.artifacts = new Map();
    this.ensureDirectoryStructure();
  }

  /**
   * Generate unique session ID with timestamp
   */
  private generateSessionId(): string {
    const now = new Date();
    return `session-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  }

  /**
   * Ensure directory structure exists
   */
  private ensureDirectoryStructure(): void {
    const sessionDir = path.join(this.baseDir, this.sessionId);
    const subdirs = ['screenshots', 'snapshots', 'logs', 'reports'];

    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }

    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    subdirs.forEach(subdir => {
      const dirPath = path.join(sessionDir, subdir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  /**
   * Save screenshot artifact
   */
  async saveScreenshot(
    scenario: string,
    screenshotData: Buffer,
    description?: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${scenario}-${timestamp}.png`;
    const filepath = path.join(
      this.baseDir,
      this.sessionId,
      'screenshots',
      filename
    );

    fs.writeFileSync(filepath, screenshotData);

    const metadata: ArtifactMetadata = {
      timestamp,
      scenario,
      type: 'screenshot',
      description,
    };

    this.artifacts.set(filename, metadata);
    return filepath;
  }

  /**
   * Save accessibility snapshot artifact
   */
  async saveSnapshot(
    scenario: string,
    snapshotData: string,
    description?: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${scenario}-${timestamp}.txt`;
    const filepath = path.join(
      this.baseDir,
      this.sessionId,
      'snapshots',
      filename
    );

    fs.writeFileSync(filepath, snapshotData, 'utf-8');

    const metadata: ArtifactMetadata = {
      timestamp,
      scenario,
      type: 'snapshot',
      description,
    };

    this.artifacts.set(filename, metadata);
    return filepath;
  }

  /**
   * Save console logs
   */
  async saveConsoleLogs(
    scenario: string,
    logs: string[],
    description?: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${scenario}-console-${timestamp}.log`;
    const filepath = path.join(this.baseDir, this.sessionId, 'logs', filename);

    fs.writeFileSync(filepath, logs.join('\n'), 'utf-8');

    const metadata: ArtifactMetadata = {
      timestamp,
      scenario,
      type: 'console-log',
      description,
    };

    this.artifacts.set(filename, metadata);
    return filepath;
  }

  /**
   * Save network logs
   */
  async saveNetworkLogs(
    scenario: string,
    requests: any[],
    description?: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${scenario}-network-${timestamp}.json`;
    const filepath = path.join(this.baseDir, this.sessionId, 'logs', filename);

    fs.writeFileSync(filepath, JSON.stringify(requests, null, 2), 'utf-8');

    const metadata: ArtifactMetadata = {
      timestamp,
      scenario,
      type: 'network-log',
      description,
    };

    this.artifacts.set(filename, metadata);
    return filepath;
  }

  /**
   * Link related artifacts together
   */
  linkArtifacts(artifactName: string, relatedArtifacts: string[]): void {
    const metadata = this.artifacts.get(artifactName);
    if (metadata) {
      metadata.relatedArtifacts = relatedArtifacts;
    }
  }

  /**
   * Generate debug report for a scenario
   */
  async generateReport(
    scenario: string,
    summary: string,
    errors?: string[],
    recommendations?: string[]
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    const scenarioArtifacts = Array.from(this.artifacts.entries())
      .filter(([_, metadata]) => metadata.scenario === scenario)
      .map(([_, metadata]) => metadata);

    const report: DebugReport = {
      sessionId: this.sessionId,
      timestamp,
      scenario,
      artifacts: scenarioArtifacts,
      summary,
      errors,
      recommendations,
    };

    const reportFilename = `${scenario}-report-${timestamp.replace(/[:.]/g, '-')}.md`;
    const reportPath = path.join(
      this.baseDir,
      this.sessionId,
      'reports',
      reportFilename
    );

    const reportContent = this.formatReportAsMarkdown(report);
    fs.writeFileSync(reportPath, reportContent, 'utf-8');

    const metadata: ArtifactMetadata = {
      timestamp,
      scenario,
      type: 'report',
      description: summary,
    };

    this.artifacts.set(reportFilename, metadata);
    return reportPath;
  }

  /**
   * Format report as markdown
   */
  private formatReportAsMarkdown(report: DebugReport): string {
    let markdown = `# Debug Report: ${report.scenario}\n\n`;
    markdown += `**Session ID:** ${report.sessionId}\n`;
    markdown += `**Timestamp:** ${report.timestamp}\n\n`;

    markdown += `## Summary\n\n${report.summary}\n\n`;

    if (report.errors && report.errors.length > 0) {
      markdown += `## Errors\n\n`;
      report.errors.forEach((error, index) => {
        markdown += `${index + 1}. ${error}\n`;
      });
      markdown += `\n`;
    }

    if (report.recommendations && report.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      report.recommendations.forEach((rec, index) => {
        markdown += `${index + 1}. ${rec}\n`;
      });
      markdown += `\n`;
    }

    markdown += `## Artifacts\n\n`;
    const groupedArtifacts = this.groupArtifactsByType(report.artifacts);

    Object.entries(groupedArtifacts).forEach(([type, artifacts]) => {
      markdown += `### ${this.capitalizeType(type)}\n\n`;
      artifacts.forEach(artifact => {
        markdown += `- **${artifact.timestamp}**`;
        if (artifact.description) {
          markdown += `: ${artifact.description}`;
        }
        if (artifact.relatedArtifacts && artifact.relatedArtifacts.length > 0) {
          markdown += `\n  - Related: ${artifact.relatedArtifacts.join(', ')}`;
        }
        markdown += `\n`;
      });
      markdown += `\n`;
    });

    return markdown;
  }

  /**
   * Group artifacts by type
   */
  private groupArtifactsByType(
    artifacts: ArtifactMetadata[]
  ): Record<string, ArtifactMetadata[]> {
    return artifacts.reduce(
      (groups, artifact) => {
        const type = artifact.type;
        if (!groups[type]) {
          groups[type] = [];
        }
        groups[type].push(artifact);
        return groups;
      },
      {} as Record<string, ArtifactMetadata[]>
    );
  }

  /**
   * Capitalize artifact type for display
   */
  private capitalizeType(type: string): string {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get session directory path
   */
  getSessionDir(): string {
    return path.join(this.baseDir, this.sessionId);
  }

  /**
   * Get all artifacts for a scenario
   */
  getScenarioArtifacts(scenario: string): ArtifactMetadata[] {
    return Array.from(this.artifacts.values()).filter(
      artifact => artifact.scenario === scenario
    );
  }

  /**
   * Generate session summary report
   */
  async generateSessionSummary(): Promise<string> {
    const timestamp = new Date().toISOString();
    const summaryPath = path.join(
      this.baseDir,
      this.sessionId,
      'SESSION_SUMMARY.md'
    );

    let markdown = `# Debug Session Summary\n\n`;
    markdown += `**Session ID:** ${this.sessionId}\n`;
    markdown += `**Generated:** ${timestamp}\n\n`;

    const scenarios = new Set(
      Array.from(this.artifacts.values()).map(a => a.scenario)
    );
    markdown += `## Scenarios Tested\n\n`;
    scenarios.forEach(scenario => {
      const scenarioArtifacts = this.getScenarioArtifacts(scenario);
      markdown += `### ${scenario}\n`;
      markdown += `- Total Artifacts: ${scenarioArtifacts.length}\n`;

      const typeCount = scenarioArtifacts.reduce(
        (counts, artifact) => {
          counts[artifact.type] = (counts[artifact.type] || 0) + 1;
          return counts;
        },
        {} as Record<string, number>
      );

      Object.entries(typeCount).forEach(([type, count]) => {
        markdown += `  - ${this.capitalizeType(type)}: ${count}\n`;
      });
      markdown += `\n`;
    });

    markdown += `## Directory Structure\n\n`;
    markdown += `\`\`\`\n`;
    markdown += `${this.sessionId}/\n`;
    markdown += `├── screenshots/\n`;
    markdown += `├── snapshots/\n`;
    markdown += `├── logs/\n`;
    markdown += `└── reports/\n`;
    markdown += `\`\`\`\n\n`;

    markdown += `## Artifact Index\n\n`;
    const sortedArtifacts = Array.from(this.artifacts.entries()).sort(
      ([_, a], [__, b]) => a.timestamp.localeCompare(b.timestamp)
    );

    sortedArtifacts.forEach(([filename, metadata]) => {
      markdown += `- **${filename}** (${metadata.type})\n`;
      markdown += `  - Scenario: ${metadata.scenario}\n`;
      markdown += `  - Timestamp: ${metadata.timestamp}\n`;
      if (metadata.description) {
        markdown += `  - Description: ${metadata.description}\n`;
      }
      markdown += `\n`;
    });

    fs.writeFileSync(summaryPath, markdown, 'utf-8');
    return summaryPath;
  }
}
