/**
 * Recommendation System
 * Generates actionable recommendations based on debugging data analysis
 */

import {
  Recommendation,
  TestResult,
  DebugReport,
  ValidationSummary,
  PerformanceMetrics,
} from '../types/debug-types';

export interface RecommendationRule {
  id: string;
  name: string;
  description: string;
  condition: (data: RecommendationContext) => boolean;
  generateRecommendation: (data: RecommendationContext) => Recommendation;
  priority: number;
}

export interface RecommendationContext {
  testResults: TestResult[];
  validationSummary: ValidationSummary;
  performanceMetrics: PerformanceMetrics;
  historicalData?: {
    previousReports: DebugReport[];
    trends: any[];
  };
}

export class RecommendationSystem {
  private rules: Map<string, RecommendationRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default recommendation rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: RecommendationRule[] = [
      // Performance Rules
      {
        id: 'high-execution-time',
        name: 'High Execution Time',
        description: 'Detects scenarios with consistently high execution times',
        priority: 8,
        condition: data => {
          const slowTests = data.testResults.filter(
            r => r.executionTime > 15000
          );
          return slowTests.length > 0;
        },
        generateRecommendation: data => {
          const slowTests = data.testResults.filter(
            r => r.executionTime > 15000
          );
          const avgTime =
            slowTests.reduce((sum, r) => sum + r.executionTime, 0) /
            slowTests.length;

          return {
            type: 'performance',
            severity:
              avgTime > 30000
                ? 'critical'
                : avgTime > 20000
                  ? 'high'
                  : 'medium',
            title: 'Optimize Slow Test Scenarios',
            description: `${slowTests.length} scenarios have execution times exceeding 15 seconds (average: ${Math.round(avgTime / 1000)}s)`,
            actionItems: [
              'Profile slow scenarios to identify bottlenecks',
              'Optimize extension code paths used in these scenarios',
              'Consider breaking down complex scenarios into smaller parts',
              'Increase timeout values if operations are inherently slow',
              'Review MCP connection stability and performance',
            ],
            relatedScenarios: slowTests.map(r => r.scenarioName),
          };
        },
      },

      {
        id: 'memory-leak-detection',
        name: 'Memory Leak Detection',
        description: 'Detects potential memory leaks based on usage patterns',
        priority: 9,
        condition: data => {
          const memoryUsages = data.testResults
            .map(r => r.metrics?.memoryUsage || 0)
            .filter(usage => usage > 0);
          return memoryUsages.some(usage => usage > 200); // 200MB threshold
        },
        generateRecommendation: data => {
          const highMemoryTests = data.testResults.filter(
            r => (r.metrics?.memoryUsage || 0) > 200
          );
          const maxMemory = Math.max(
            ...data.testResults.map(r => r.metrics?.memoryUsage || 0)
          );

          return {
            type: 'performance',
            severity: maxMemory > 500 ? 'critical' : 'high',
            title: 'Investigate Memory Usage',
            description: `High memory usage detected (peak: ${Math.round(maxMemory)}MB)`,
            actionItems: [
              'Use Chrome DevTools Memory tab to identify memory leaks',
              'Review extension cleanup procedures',
              'Implement proper disposal of event listeners and observers',
              'Optimize data structures and caching strategies',
              'Consider implementing memory usage monitoring in production',
            ],
            relatedScenarios: highMemoryTests.map(r => r.scenarioName),
          };
        },
      },

      // Reliability Rules
      {
        id: 'high-failure-rate',
        name: 'High Failure Rate',
        description: 'Detects scenarios with high failure rates',
        priority: 10,
        condition: data => {
          const failureRate =
            data.testResults.filter(r => !r.passed).length /
            data.testResults.length;
          return failureRate > 0.2; // 20% failure rate threshold
        },
        generateRecommendation: data => {
          const failedTests = data.testResults.filter(r => !r.passed);
          const failureRate = failedTests.length / data.testResults.length;

          return {
            type: 'reliability',
            severity:
              failureRate > 0.5
                ? 'critical'
                : failureRate > 0.3
                  ? 'high'
                  : 'medium',
            title: 'Address High Test Failure Rate',
            description: `${Math.round(failureRate * 100)}% of tests are failing (${failedTests.length}/${data.testResults.length})`,
            actionItems: [
              'Analyze common failure patterns and root causes',
              'Improve error handling and recovery mechanisms',
              'Review test scenario assumptions and expectations',
              'Implement retry logic for flaky operations',
              'Stabilize extension initialization and state management',
            ],
            relatedScenarios: failedTests.map(r => r.scenarioName),
          };
        },
      },

      {
        id: 'recurring-errors',
        name: 'Recurring Errors',
        description:
          'Detects the same errors occurring across multiple scenarios',
        priority: 9,
        condition: data => {
          const errors = data.testResults
            .filter(r => r.error)
            .map(r => r.error!);
          const errorCounts = new Map<string, number>();
          errors.forEach(error => {
            const normalized = this.normalizeError(error);
            errorCounts.set(normalized, (errorCounts.get(normalized) || 0) + 1);
          });
          return Array.from(errorCounts.values()).some(count => count >= 3);
        },
        generateRecommendation: data => {
          const errors = data.testResults.filter(r => r.error);
          const errorCounts = new Map<string, TestResult[]>();

          errors.forEach(result => {
            const normalized = this.normalizeError(result.error!);
            const existing = errorCounts.get(normalized) || [];
            existing.push(result);
            errorCounts.set(normalized, existing);
          });

          const recurringErrors = Array.from(errorCounts.entries())
            .filter(([_, results]) => results.length >= 3)
            .sort((a, b) => b[1].length - a[1].length);

          const topError = recurringErrors[0];

          return {
            type: 'reliability',
            severity: topError[1].length >= 5 ? 'critical' : 'high',
            title: 'Fix Recurring Error Pattern',
            description: `Error "${topError[0]}" occurs in ${topError[1].length} scenarios`,
            actionItems: [
              'Investigate the root cause of this recurring error',
              'Implement proper error handling for this scenario',
              'Review extension permissions and API usage',
              'Add defensive programming practices',
              'Consider implementing error recovery mechanisms',
            ],
            relatedScenarios: topError[1].map(r => r.scenarioName),
          };
        },
      },

      // Functionality Rules
      {
        id: 'validation-violations',
        name: 'Validation Violations',
        description: 'Detects scenarios failing validation criteria',
        priority: 7,
        condition: data => {
          return data.validationSummary.overallViolations.length > 0;
        },
        generateRecommendation: data => {
          const violationCount =
            data.validationSummary.overallViolations.length;
          const affectedScenarios = [
            ...new Set(
              data.validationSummary.overallViolations.map(v => v.split(':')[0])
            ),
          ];

          return {
            type: 'functionality',
            severity:
              violationCount > 10
                ? 'high'
                : violationCount > 5
                  ? 'medium'
                  : 'low',
            title: 'Address Validation Violations',
            description: `${violationCount} validation violations detected across ${affectedScenarios.length} scenarios`,
            actionItems: [
              'Review and update validation criteria to ensure they are appropriate',
              'Fix functionality issues causing validation failures',
              'Improve test scenario implementations',
              'Ensure extension behavior matches expected outcomes',
              'Update documentation to reflect actual behavior',
            ],
            relatedScenarios: affectedScenarios,
          };
        },
      },

      // Security Rules
      {
        id: 'security-errors',
        name: 'Security-Related Errors',
        description: 'Detects security-related issues in test results',
        priority: 10,
        condition: data => {
          return data.testResults.some(
            r =>
              r.error &&
              (r.error.toLowerCase().includes('security') ||
                r.error.toLowerCase().includes('permission') ||
                r.error.toLowerCase().includes('cors') ||
                r.error.toLowerCase().includes('csp'))
          );
        },
        generateRecommendation: data => {
          const securityErrors = data.testResults.filter(
            r =>
              r.error &&
              (r.error.toLowerCase().includes('security') ||
                r.error.toLowerCase().includes('permission') ||
                r.error.toLowerCase().includes('cors') ||
                r.error.toLowerCase().includes('csp'))
          );

          return {
            type: 'security',
            severity: 'high',
            title: 'Address Security-Related Issues',
            description: `${securityErrors.length} scenarios encountered security-related errors`,
            actionItems: [
              'Review extension manifest permissions',
              'Validate Content Security Policy configuration',
              'Ensure proper handling of cross-origin requests',
              'Review API access patterns and authentication',
              'Implement proper input validation and sanitization',
            ],
            relatedScenarios: securityErrors.map(r => r.scenarioName),
          };
        },
      },

      // Extension-Specific Rules
      {
        id: 'mcp-connection-issues',
        name: 'MCP Connection Issues',
        description: 'Detects issues with MCP chrome-devtools connection',
        priority: 8,
        condition: data => {
          return data.testResults.some(
            r =>
              r.error &&
              (r.error.toLowerCase().includes('mcp') ||
                r.error.toLowerCase().includes('chrome-devtools') ||
                r.error.toLowerCase().includes('connection'))
          );
        },
        generateRecommendation: data => {
          const mcpErrors = data.testResults.filter(
            r =>
              r.error &&
              (r.error.toLowerCase().includes('mcp') ||
                r.error.toLowerCase().includes('chrome-devtools') ||
                r.error.toLowerCase().includes('connection'))
          );

          return {
            type: 'functionality',
            severity: 'high',
            title: 'Fix MCP Connection Issues',
            description: `${mcpErrors.length} scenarios failed due to MCP connection problems`,
            actionItems: [
              'Verify MCP chrome-devtools server is running and accessible',
              'Check MCP configuration and connection parameters',
              'Implement connection retry logic with exponential backoff',
              'Add connection health checks before test execution',
              'Consider fallback debugging strategies when MCP is unavailable',
            ],
            relatedScenarios: mcpErrors.map(r => r.scenarioName),
          };
        },
      },

      {
        id: 'extension-context-issues',
        name: 'Extension Context Issues',
        description: 'Detects issues with Chrome extension contexts',
        priority: 9,
        condition: data => {
          return data.testResults.some(
            r =>
              r.error &&
              (r.error.toLowerCase().includes('service worker') ||
                r.error.toLowerCase().includes('content script') ||
                r.error.toLowerCase().includes('offscreen') ||
                r.error.toLowerCase().includes('extension'))
          );
        },
        generateRecommendation: data => {
          const contextErrors = data.testResults.filter(
            r =>
              r.error &&
              (r.error.toLowerCase().includes('service worker') ||
                r.error.toLowerCase().includes('content script') ||
                r.error.toLowerCase().includes('offscreen') ||
                r.error.toLowerCase().includes('extension'))
          );

          return {
            type: 'functionality',
            severity: 'high',
            title: 'Fix Extension Context Issues',
            description: `${contextErrors.length} scenarios failed due to extension context problems`,
            actionItems: [
              'Verify extension is properly loaded and initialized',
              'Check extension manifest configuration',
              'Ensure proper message passing between contexts',
              'Review extension lifecycle management',
              'Add context availability checks before operations',
            ],
            relatedScenarios: contextErrors.map(r => r.scenarioName),
          };
        },
      },
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });

    console.log(
      `Initialized ${defaultRules.length} default recommendation rules`
    );
  }

  /**
   * Generate recommendations based on context data
   */
  generateRecommendations(context: RecommendationContext): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Apply all rules and collect recommendations
    for (const rule of this.rules.values()) {
      try {
        if (rule.condition(context)) {
          const recommendation = rule.generateRecommendation(context);
          recommendations.push(recommendation);
        }
      } catch (error) {
        console.warn(`Error applying recommendation rule ${rule.id}:`, error);
      }
    }

    // Sort by severity and priority
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => {
      const severityDiff =
        severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;

      // If same severity, sort by number of affected scenarios
      return b.relatedScenarios.length - a.relatedScenarios.length;
    });

    return recommendations;
  }

  /**
   * Add custom recommendation rule
   */
  addRule(rule: RecommendationRule): void {
    this.rules.set(rule.id, rule);
    console.log(`Added custom recommendation rule: ${rule.name}`);
  }

  /**
   * Remove recommendation rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      console.log(`Removed recommendation rule: ${ruleId}`);
    }
    return removed;
  }

  /**
   * Get all registered rules
   */
  getRules(): Map<string, RecommendationRule> {
    return new Map(this.rules);
  }

  /**
   * Generate recommendations with priority filtering
   */
  generatePriorityRecommendations(
    context: RecommendationContext,
    minPriority: number = 7
  ): Recommendation[] {
    const allRecommendations = this.generateRecommendations(context);

    // Filter by rule priority (rules that generated these recommendations)
    const priorityRecommendations = allRecommendations.filter(rec => {
      // Find the rule that generated this recommendation
      for (const rule of this.rules.values()) {
        if (rule.priority >= minPriority && rule.condition(context)) {
          try {
            const testRec = rule.generateRecommendation(context);
            if (testRec.title === rec.title) {
              return true;
            }
          } catch (error) {
            // Ignore errors in test generation
          }
        }
      }
      return false;
    });

    return priorityRecommendations;
  }

  /**
   * Generate recommendations by type
   */
  generateRecommendationsByType(
    context: RecommendationContext,
    type: 'performance' | 'functionality' | 'reliability' | 'security'
  ): Recommendation[] {
    const allRecommendations = this.generateRecommendations(context);
    return allRecommendations.filter(rec => rec.type === type);
  }

  /**
   * Normalize error messages for pattern matching
   */
  private normalizeError(error: string): string {
    return error
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, '[TIMESTAMP]')
      .replace(/\b\d+ms\b/g, '[TIME]')
      .replace(
        /\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/g,
        '[UUID]'
      )
      .replace(/\b\d+\b/g, '[NUMBER]')
      .toLowerCase()
      .trim();
  }

  /**
   * Export recommendation rules configuration
   */
  exportRulesConfiguration(): any {
    const rules = Array.from(this.rules.values()).map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      priority: rule.priority,
    }));

    return {
      rules,
      totalRules: rules.length,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Get recommendation statistics
   */
  getRecommendationStatistics(context: RecommendationContext): {
    totalRules: number;
    applicableRules: number;
    recommendationsByType: Record<string, number>;
    recommendationsBySeverity: Record<string, number>;
  } {
    const recommendations = this.generateRecommendations(context);
    const applicableRules = recommendations.length;

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    recommendations.forEach(rec => {
      byType[rec.type] = (byType[rec.type] || 0) + 1;
      bySeverity[rec.severity] = (bySeverity[rec.severity] || 0) + 1;
    });

    return {
      totalRules: this.rules.size,
      applicableRules,
      recommendationsByType: byType,
      recommendationsBySeverity: bySeverity,
    };
  }
}
