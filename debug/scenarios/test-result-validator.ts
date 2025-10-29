/**
 * Test Result Validator
 * Validates test results against expected outcomes and criteria
 */

import {
  TestResult,
  ValidationCriteria,
  ValidationResult,
} from '../types/debug-types';

export class TestResultValidator {
  private validationRules: Map<string, ValidationCriteria> = new Map();

  /**
   * Register validation criteria for a specific scenario
   */
  registerValidationCriteria(
    scenarioName: string,
    criteria: ValidationCriteria
  ): void {
    this.validationRules.set(scenarioName, criteria);
    console.log(`Registered validation criteria for scenario: ${scenarioName}`);
  }

  /**
   * Validate a single test result
   */
  validateResult(result: TestResult): ValidationResult {
    const criteria = this.validationRules.get(result.scenarioName);
    if (!criteria) {
      return {
        isValid: result.passed,
        score: result.passed ? 1.0 : 0.0,
        violations: result.passed
          ? []
          : ['Test failed without specific validation criteria'],
        recommendations: [],
      };
    }

    const violations: string[] = [];
    const recommendations: string[] = [];
    let score = 0;
    let maxScore = 0;

    // Validate execution time
    if (criteria.maxExecutionTime) {
      maxScore += 1;
      if (result.executionTime <= criteria.maxExecutionTime) {
        score += 1;
      } else {
        violations.push(
          `Execution time ${result.executionTime}ms exceeds maximum ${criteria.maxExecutionTime}ms`
        );
        recommendations.push(
          'Consider optimizing the test scenario or increasing timeout'
        );
      }
    }

    // Validate required metrics
    if (criteria.requiredMetrics) {
      for (const metricName of criteria.requiredMetrics) {
        maxScore += 1;
        if (result.metrics && result.metrics[metricName] !== undefined) {
          score += 1;
        } else {
          violations.push(`Required metric '${metricName}' is missing`);
          recommendations.push(
            `Ensure the test scenario captures the '${metricName}' metric`
          );
        }
      }
    }

    // Validate metric thresholds
    if (criteria.metricThresholds && result.metrics) {
      for (const [metricName, threshold] of Object.entries(
        criteria.metricThresholds
      )) {
        maxScore += 1;
        const metricValue = result.metrics[metricName];
        if (typeof metricValue === 'number') {
          if (threshold.min !== undefined && metricValue < threshold.min) {
            violations.push(
              `Metric '${metricName}' value ${metricValue} is below minimum ${threshold.min}`
            );
            recommendations.push(
              `Investigate why '${metricName}' is performing below expectations`
            );
          } else if (
            threshold.max !== undefined &&
            metricValue > threshold.max
          ) {
            violations.push(
              `Metric '${metricName}' value ${metricValue} exceeds maximum ${threshold.max}`
            );
            recommendations.push(
              `Optimize performance for '${metricName}' metric`
            );
          } else {
            score += 1;
          }
        } else {
          violations.push(
            `Metric '${metricName}' is not a number: ${metricValue}`
          );
        }
      }
    }

    // Validate custom conditions
    if (criteria.customValidation) {
      maxScore += 1;
      try {
        const customResult = criteria.customValidation(result);
        if (customResult.isValid) {
          score += 1;
        } else {
          violations.push(...customResult.violations);
          recommendations.push(...customResult.recommendations);
        }
      } catch (error) {
        violations.push(
          `Custom validation failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Overall validation
    const isValid = result.passed && violations.length === 0;
    const finalScore =
      maxScore > 0 ? score / maxScore : result.passed ? 1.0 : 0.0;

    return {
      isValid,
      score: finalScore,
      violations,
      recommendations,
    };
  }

  /**
   * Validate multiple test results
   */
  validateResults(results: TestResult[]): ValidationResult[] {
    return results.map(result => this.validateResult(result));
  }

  /**
   * Generate validation summary for multiple results
   */
  generateValidationSummary(results: TestResult[]): {
    totalTests: number;
    passedTests: number;
    validTests: number;
    averageScore: number;
    overallViolations: string[];
    overallRecommendations: string[];
  } {
    const validationResults = this.validateResults(results);

    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const validTests = validationResults.filter(v => v.isValid).length;
    const averageScore =
      validationResults.reduce((sum, v) => sum + v.score, 0) / totalTests;

    const overallViolations: string[] = [];
    const overallRecommendations: string[] = [];

    validationResults.forEach((validation, index) => {
      const scenarioName = results[index].scenarioName;
      validation.violations.forEach(violation => {
        overallViolations.push(`${scenarioName}: ${violation}`);
      });
      validation.recommendations.forEach(recommendation => {
        overallRecommendations.push(`${scenarioName}: ${recommendation}`);
      });
    });

    return {
      totalTests,
      passedTests,
      validTests,
      averageScore,
      overallViolations,
      overallRecommendations,
    };
  }

  /**
   * Create default validation criteria for common scenarios
   */
  createDefaultCriteria(scenarioType: string): ValidationCriteria {
    const baseCriteria: ValidationCriteria = {
      maxExecutionTime: 30000, // 30 seconds default
      requiredMetrics: [],
      metricThresholds: {},
    };

    switch (scenarioType) {
      case 'content-extraction':
        return {
          ...baseCriteria,
          maxExecutionTime: 10000, // 10 seconds for content extraction
          requiredMetrics: ['contentLength', 'processingTime'],
          metricThresholds: {
            contentLength: { min: 100 }, // At least 100 characters
            processingTime: { max: 5000 }, // Max 5 seconds processing
          },
        };

      case 'ai-processing':
        return {
          ...baseCriteria,
          maxExecutionTime: 15000, // 15 seconds for AI processing
          requiredMetrics: ['processingTime', 'responseQuality'],
          metricThresholds: {
            processingTime: { max: 10000 }, // Max 10 seconds
            responseQuality: { min: 0.7 }, // At least 70% quality score
          },
        };

      case 'ui-interaction':
        return {
          ...baseCriteria,
          maxExecutionTime: 5000, // 5 seconds for UI interactions
          requiredMetrics: ['responseTime', 'elementsFound'],
          metricThresholds: {
            responseTime: { max: 1000 }, // Max 1 second response
            elementsFound: { min: 1 }, // At least 1 element found
          },
        };

      case 'storage-operation':
        return {
          ...baseCriteria,
          maxExecutionTime: 3000, // 3 seconds for storage operations
          requiredMetrics: ['operationTime', 'dataIntegrity'],
          metricThresholds: {
            operationTime: { max: 1000 }, // Max 1 second
            dataIntegrity: { min: 1.0 }, // 100% data integrity
          },
        };

      case 'performance':
        return {
          ...baseCriteria,
          maxExecutionTime: 20000, // 20 seconds for performance tests
          requiredMetrics: ['memoryUsage', 'cpuUsage', 'responseTime'],
          metricThresholds: {
            memoryUsage: { max: 100 * 1024 * 1024 }, // Max 100MB
            cpuUsage: { max: 80 }, // Max 80% CPU
            responseTime: { max: 2000 }, // Max 2 seconds
          },
        };

      default:
        return baseCriteria;
    }
  }

  /**
   * Auto-register default criteria for common scenario patterns
   */
  autoRegisterDefaultCriteria(): void {
    const scenarioTypes = [
      'content-extraction',
      'ai-processing',
      'ui-interaction',
      'storage-operation',
      'performance',
    ];

    scenarioTypes.forEach(type => {
      const criteria = this.createDefaultCriteria(type);
      this.validationRules.set(`${type}-test`, criteria);
    });

    console.log(
      'Auto-registered default validation criteria for common scenario types'
    );
  }

  /**
   * Get all registered validation rules
   */
  getValidationRules(): Map<string, ValidationCriteria> {
    return new Map(this.validationRules);
  }

  /**
   * Remove validation criteria for a scenario
   */
  removeValidationCriteria(scenarioName: string): boolean {
    return this.validationRules.delete(scenarioName);
  }

  /**
   * Clear all validation criteria
   */
  clearValidationCriteria(): void {
    this.validationRules.clear();
  }
}
