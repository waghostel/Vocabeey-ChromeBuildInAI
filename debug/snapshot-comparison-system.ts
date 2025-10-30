/**
 * Accessibility Snapshot Comparison System
 *
 * This module provides tools for comparing accessibility snapshots,
 * extracting element references (uid), and generating comparison reports.
 *
 * Requirements: 5.3
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Element reference extracted from snapshot
 */
export interface ElementReference {
  uid: string;
  type: string;
  role?: string;
  name?: string;
  value?: string;
  description?: string;
  line: number;
}

/**
 * Snapshot comparison result
 */
export interface SnapshotComparison {
  snapshot1: string;
  snapshot2: string;
  addedElements: ElementReference[];
  removedElements: ElementReference[];
  modifiedElements: Array<{
    before: ElementReference;
    after: ElementReference;
  }>;
  unchangedCount: number;
  summary: string;
}

/**
 * Snapshot analysis result
 */
export interface SnapshotAnalysis {
  filename: string;
  totalElements: number;
  interactiveElements: ElementReference[];
  headings: ElementReference[];
  buttons: ElementReference[];
  links: ElementReference[];
  inputs: ElementReference[];
  images: ElementReference[];
  structure: {
    hasNavigation: boolean;
    hasMain: boolean;
    hasArticle: boolean;
    hasForm: boolean;
  };
}

/**
 * Snapshot Comparison System
 *
 * Provides tools for analyzing and comparing accessibility snapshots
 */
export class SnapshotComparisonSystem {
  /**
   * Parse snapshot file and extract element references
   *
   * Requirements: 5.3
   */
  public parseSnapshot(snapshotPath: string): ElementReference[] {
    if (!fs.existsSync(snapshotPath)) {
      throw new Error(`Snapshot file not found: ${snapshotPath}`);
    }

    const content = fs.readFileSync(snapshotPath, 'utf-8');
    const elements: ElementReference[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Extract element references from snapshot
      // Format varies by MCP implementation, adapt as needed

      // Look for uid patterns
      const uidMatch = line.match(/uid[=:]\s*["']?(\d+)["']?/i);

      // Look for role patterns
      const roleMatch = line.match(/role[=:]\s*["']?(\w+)["']?/i);

      // Look for name/label patterns
      const nameMatch = line.match(/name[=:]\s*["']?([^"'\n]+)["']?/i);

      // Look for element type
      const typeMatch =
        line.match(/type[=:]\s*["']?(\w+)["']?/i) || line.match(/<(\w+)/);

      if (uidMatch || roleMatch || typeMatch) {
        elements.push({
          uid: uidMatch ? uidMatch[1] : `line-${index}`,
          type: typeMatch ? typeMatch[1] : 'unknown',
          role: roleMatch ? roleMatch[1] : undefined,
          name: nameMatch ? nameMatch[1].trim() : undefined,
          line: index + 1,
        });
      }
    });

    return elements;
  }

  /**
   * Extract interactive elements from snapshot
   *
   * Requirements: 5.3
   */
  public extractInteractiveElements(snapshotPath: string): ElementReference[] {
    const allElements = this.parseSnapshot(snapshotPath);

    const interactiveRoles = [
      'button',
      'link',
      'textbox',
      'checkbox',
      'radio',
      'combobox',
      'slider',
      'tab',
      'menuitem',
    ];

    const interactiveTypes = ['button', 'a', 'input', 'select', 'textarea'];

    return allElements.filter(element => {
      const hasInteractiveRole =
        element.role && interactiveRoles.includes(element.role.toLowerCase());

      const hasInteractiveType = interactiveTypes.includes(
        element.type.toLowerCase()
      );

      return hasInteractiveRole || hasInteractiveType;
    });
  }

  /**
   * Compare two snapshots and identify differences
   *
   * Requirements: 5.3
   */
  public compareSnapshots(
    snapshot1Path: string,
    snapshot2Path: string
  ): SnapshotComparison {
    const elements1 = this.parseSnapshot(snapshot1Path);
    const elements2 = this.parseSnapshot(snapshot2Path);

    // Create maps for efficient lookup
    const map1 = new Map(elements1.map(e => [e.uid, e]));
    const map2 = new Map(elements2.map(e => [e.uid, e]));

    // Find added elements (in snapshot2 but not in snapshot1)
    const addedElements = elements2.filter(e => !map1.has(e.uid));

    // Find removed elements (in snapshot1 but not in snapshot2)
    const removedElements = elements1.filter(e => !map2.has(e.uid));

    // Find modified elements (in both but different)
    const modifiedElements: Array<{
      before: ElementReference;
      after: ElementReference;
    }> = [];

    elements1.forEach(e1 => {
      const e2 = map2.get(e1.uid);
      if (e2 && this.isElementModified(e1, e2)) {
        modifiedElements.push({ before: e1, after: e2 });
      }
    });

    // Count unchanged elements
    const unchangedCount = elements1.filter(e1 => {
      const e2 = map2.get(e1.uid);
      return e2 && !this.isElementModified(e1, e2);
    }).length;

    // Generate summary
    const summary = this.generateComparisonSummary({
      snapshot1: snapshot1Path,
      snapshot2: snapshot2Path,
      addedElements,
      removedElements,
      modifiedElements,
      unchangedCount,
    });

    return {
      snapshot1: snapshot1Path,
      snapshot2: snapshot2Path,
      addedElements,
      removedElements,
      modifiedElements,
      unchangedCount,
      summary,
    };
  }

  /**
   * Check if element has been modified
   */
  private isElementModified(
    element1: ElementReference,
    element2: ElementReference
  ): boolean {
    return (
      element1.type !== element2.type ||
      element1.role !== element2.role ||
      element1.name !== element2.name ||
      element1.value !== element2.value
    );
  }

  /**
   * Generate comparison summary text
   */
  private generateComparisonSummary(
    comparison: Omit<SnapshotComparison, 'summary'>
  ): string {
    const lines: string[] = [];

    lines.push('# Snapshot Comparison Summary');
    lines.push('');
    lines.push(`**Snapshot 1:** ${path.basename(comparison.snapshot1)}`);
    lines.push(`**Snapshot 2:** ${path.basename(comparison.snapshot2)}`);
    lines.push('');
    lines.push('## Changes');
    lines.push('');
    lines.push(`- Added Elements: ${comparison.addedElements.length}`);
    lines.push(`- Removed Elements: ${comparison.removedElements.length}`);
    lines.push(`- Modified Elements: ${comparison.modifiedElements.length}`);
    lines.push(`- Unchanged Elements: ${comparison.unchangedCount}`);
    lines.push('');

    if (comparison.addedElements.length > 0) {
      lines.push('### Added Elements');
      lines.push('');
      comparison.addedElements.slice(0, 10).forEach(element => {
        lines.push(`- ${element.type} (uid: ${element.uid})`);
        if (element.name) lines.push(`  - Name: ${element.name}`);
        if (element.role) lines.push(`  - Role: ${element.role}`);
      });
      if (comparison.addedElements.length > 10) {
        lines.push(`- ... and ${comparison.addedElements.length - 10} more`);
      }
      lines.push('');
    }

    if (comparison.removedElements.length > 0) {
      lines.push('### Removed Elements');
      lines.push('');
      comparison.removedElements.slice(0, 10).forEach(element => {
        lines.push(`- ${element.type} (uid: ${element.uid})`);
        if (element.name) lines.push(`  - Name: ${element.name}`);
        if (element.role) lines.push(`  - Role: ${element.role}`);
      });
      if (comparison.removedElements.length > 10) {
        lines.push(`- ... and ${comparison.removedElements.length - 10} more`);
      }
      lines.push('');
    }

    if (comparison.modifiedElements.length > 0) {
      lines.push('### Modified Elements');
      lines.push('');
      comparison.modifiedElements.slice(0, 5).forEach(({ before, after }) => {
        lines.push(`- ${before.type} (uid: ${before.uid})`);
        if (before.name !== after.name) {
          lines.push(`  - Name: "${before.name}" → "${after.name}"`);
        }
        if (before.role !== after.role) {
          lines.push(`  - Role: "${before.role}" → "${after.role}"`);
        }
      });
      if (comparison.modifiedElements.length > 5) {
        lines.push(`- ... and ${comparison.modifiedElements.length - 5} more`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Analyze snapshot structure and content
   *
   * Requirements: 5.3
   */
  public analyzeSnapshot(snapshotPath: string): SnapshotAnalysis {
    const elements = this.parseSnapshot(snapshotPath);
    const content = fs.readFileSync(snapshotPath, 'utf-8').toLowerCase();

    // Extract specific element types
    const interactiveElements = elements.filter(e => {
      const interactiveRoles = ['button', 'link', 'textbox', 'checkbox'];
      return e.role && interactiveRoles.includes(e.role.toLowerCase());
    });

    const headings = elements.filter(
      e => e.type.match(/^h[1-6]$/i) || e.role === 'heading'
    );

    const buttons = elements.filter(
      e => e.type === 'button' || e.role === 'button'
    );

    const links = elements.filter(e => e.type === 'a' || e.role === 'link');

    const inputs = elements.filter(
      e => e.type === 'input' || e.role === 'textbox'
    );

    const images = elements.filter(e => e.type === 'img' || e.role === 'img');

    // Analyze structure
    const structure = {
      hasNavigation: content.includes('navigation') || content.includes('nav'),
      hasMain: content.includes('main') || content.includes('role="main"'),
      hasArticle:
        content.includes('article') || content.includes('role="article"'),
      hasForm: content.includes('form') || content.includes('role="form"'),
    };

    return {
      filename: path.basename(snapshotPath),
      totalElements: elements.length,
      interactiveElements,
      headings,
      buttons,
      links,
      inputs,
      images,
      structure,
    };
  }

  /**
   * Generate snapshot analysis report
   */
  public generateAnalysisReport(analysis: SnapshotAnalysis): string {
    const lines: string[] = [];

    lines.push(`# Snapshot Analysis: ${analysis.filename}`);
    lines.push('');
    lines.push('## Overview');
    lines.push('');
    lines.push(`- Total Elements: ${analysis.totalElements}`);
    lines.push(
      `- Interactive Elements: ${analysis.interactiveElements.length}`
    );
    lines.push(`- Headings: ${analysis.headings.length}`);
    lines.push(`- Buttons: ${analysis.buttons.length}`);
    lines.push(`- Links: ${analysis.links.length}`);
    lines.push(`- Inputs: ${analysis.inputs.length}`);
    lines.push(`- Images: ${analysis.images.length}`);
    lines.push('');

    lines.push('## Page Structure');
    lines.push('');
    lines.push(
      `- Navigation: ${analysis.structure.hasNavigation ? '✅' : '❌'}`
    );
    lines.push(`- Main Content: ${analysis.structure.hasMain ? '✅' : '❌'}`);
    lines.push(`- Article: ${analysis.structure.hasArticle ? '✅' : '❌'}`);
    lines.push(`- Form: ${analysis.structure.hasForm ? '✅' : '❌'}`);
    lines.push('');

    if (analysis.interactiveElements.length > 0) {
      lines.push('## Interactive Elements');
      lines.push('');
      analysis.interactiveElements.forEach(element => {
        lines.push(`- **${element.type}** (uid: ${element.uid})`);
        if (element.name) lines.push(`  - Name: ${element.name}`);
        if (element.role) lines.push(`  - Role: ${element.role}`);
      });
      lines.push('');
    }

    if (analysis.headings.length > 0) {
      lines.push('## Headings');
      lines.push('');
      analysis.headings.forEach(heading => {
        lines.push(`- ${heading.type}: ${heading.name || '(no text)'}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Save comparison report to file
   */
  public saveComparisonReport(
    comparison: SnapshotComparison,
    outputPath: string
  ): void {
    fs.writeFileSync(outputPath, comparison.summary);
  }

  /**
   * Save analysis report to file
   */
  public saveAnalysisReport(
    analysis: SnapshotAnalysis,
    outputPath: string
  ): void {
    const report = this.generateAnalysisReport(analysis);
    fs.writeFileSync(outputPath, report);
  }

  /**
   * Generate diff command for manual comparison
   */
  public generateDiffCommand(
    snapshot1Path: string,
    snapshot2Path: string
  ): string {
    return `diff "${snapshot1Path}" "${snapshot2Path}"`;
  }

  /**
   * Batch compare multiple snapshot pairs
   */
  public batchCompare(
    snapshotPairs: Array<{ before: string; after: string }>
  ): SnapshotComparison[] {
    return snapshotPairs.map(pair =>
      this.compareSnapshots(pair.before, pair.after)
    );
  }

  /**
   * Batch analyze multiple snapshots
   */
  public batchAnalyze(snapshotPaths: string[]): SnapshotAnalysis[] {
    return snapshotPaths.map(path => this.analyzeSnapshot(path));
  }
}

/**
 * Helper function to create snapshot comparison system
 */
export function createSnapshotComparisonSystem(): SnapshotComparisonSystem {
  return new SnapshotComparisonSystem();
}

/**
 * Quick comparison function for convenience
 */
export function compareSnapshots(
  snapshot1: string,
  snapshot2: string
): SnapshotComparison {
  const system = new SnapshotComparisonSystem();
  return system.compareSnapshots(snapshot1, snapshot2);
}

/**
 * Quick analysis function for convenience
 */
export function analyzeSnapshot(snapshotPath: string): SnapshotAnalysis {
  const system = new SnapshotComparisonSystem();
  return system.analyzeSnapshot(snapshotPath);
}
