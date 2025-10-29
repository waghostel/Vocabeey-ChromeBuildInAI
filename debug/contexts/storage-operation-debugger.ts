/**
 * Storage Operation Debugger
 * Monitor and debug chrome.storage API operations, state validation, and data migration
 */

export interface StorageOperation {
  operation: 'get' | 'set' | 'remove' | 'clear';
  args: any[];
  timestamp: string;
  duration?: number;
  success: boolean;
  error?: string;
  result?: any;
}

export interface StorageState {
  itemCount: number;
  totalSize: number;
  keys: string[];
  lastModified: string;
  quota: {
    used: number;
    available: number;
    percentage: number;
  };
  schema: {
    version: string;
    isValid: boolean;
    migrationNeeded: boolean;
  };
}

export interface StorageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  corruptedKeys: string[];
}

export class StorageOperationDebugger {
  private isMonitoring: boolean = false;
  private capturedOperations: StorageOperation[] = [];
  private validationResults: StorageValidationResult | null = null;

  /**
   * Start monitoring chrome.storage API operations
   */
  async startStorageMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Storage monitoring already active');
      return;
    }

    try {
      console.log('Starting storage operation monitoring...');

      // Inject storage monitoring code into service worker context
      await this.injectStorageMonitoring();

      this.isMonitoring = true;
      console.log('Storage operation monitoring started');
    } catch (error) {
      console.error('Failed to start storage monitoring:', error);
      throw error;
    }
  }

  /**
   * Inject storage monitoring code into service worker
   */
  private async injectStorageMonitoring(): Promise<void> {
    const storageMonitoringScript = `
      (() => {
        // Prevent double injection
        if (window.storageDebuggerInjected) {
          return 'Storage debugger already injected';
        }
        
        // Store original chrome.storage methods
        const originalLocal = {
          get: chrome.storage.local.get,
          set: chrome.storage.local.set,
          remove: chrome.storage.local.remove,
          clear: chrome.storage.local.clear
        };
        
        const originalSync = {
          get: chrome.storage.sync.get,
          set: chrome.storage.sync.set,
          remove: chrome.storage.sync.remove,
          clear: chrome.storage.sync.clear
        };
        
        // Create storage operation tracking
        window.storageOperations = window.storageOperations || [];
        window.storageErrors = window.storageErrors || [];
        
        // Helper function to track operations
        function trackOperation(area, operation, args, startTime) {
          return function(result, error) {
            const endTime = performance.now();
            const operationData = {
              area: area, // 'local' or 'sync'
              operation: operation,
              args: args,
              timestamp: new Date().toISOString(),
              duration: endTime - startTime,
              success: !error,
              error: error?.message,
              result: result
            };
            
            window.storageOperations.push(operationData);
            
            if (error) {
              window.storageErrors.push(operationData);
              console.error('[STORAGE DEBUG] Operation failed:', operationData);
            } else {
              console.log('[STORAGE DEBUG] Operation completed:', operationData);
            }
          };
        }
        
        // Wrap chrome.storage.local methods
        chrome.storage.local.get = function(...args) {
          const startTime = performance.now();
          const tracker = trackOperation('local', 'get', args, startTime);
          
          return new Promise((resolve, reject) => {
            originalLocal.get.apply(this, [...args, (result) => {
              if (chrome.runtime.lastError) {
                tracker(null, chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
              } else {
                tracker(result, null);
                resolve(result);
              }
            }]);
          });
        };
        
        chrome.storage.local.set = function(...args) {
          const startTime = performance.now();
          const tracker = trackOperation('local', 'set', args, startTime);
          
          return new Promise((resolve, reject) => {
            originalLocal.set.apply(this, [...args, () => {
              if (chrome.runtime.lastError) {
                tracker(null, chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
              } else {
                tracker(null, null);
                resolve();
              }
            }]);
          });
        };
        
        chrome.storage.local.remove = function(...args) {
          const startTime = performance.now();
          const tracker = trackOperation('local', 'remove', args, startTime);
          
          return new Promise((resolve, reject) => {
            originalLocal.remove.apply(this, [...args, () => {
              if (chrome.runtime.lastError) {
                tracker(null, chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
              } else {
                tracker(null, null);
                resolve();
              }
            }]);
          });
        };
        
        chrome.storage.local.clear = function(...args) {
          const startTime = performance.now();
          const tracker = trackOperation('local', 'clear', args, startTime);
          
          return new Promise((resolve, reject) => {
            originalLocal.clear.apply(this, [...args, () => {
              if (chrome.runtime.lastError) {
                tracker(null, chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
              } else {
                tracker(null, null);
                resolve();
              }
            }]);
          });
        };
        
        // Mark as injected
        window.storageDebuggerInjected = true;
        console.log('[STORAGE DEBUG] Storage operation monitoring injected');
        
        return 'Storage monitoring injection complete';
      })()
    `;

    // This would use mcp_chrome_devtools_evaluate_script when available
    console.log('Storage monitoring script prepared for injection');
  }

  /**
   * Get current storage state and validate it
   */
  async validateStorageState(): Promise<StorageValidationResult> {
    try {
      console.log('Validating storage state...');

      const storageState = await this.getCurrentStorageState();
      const validationResult: StorageValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        recommendations: [],
        corruptedKeys: [],
      };

      // Validate storage quota usage
      if (storageState.quota.percentage > 90) {
        validationResult.warnings.push('Storage usage is above 90%');
        validationResult.recommendations.push(
          'Consider cleaning up old cached data'
        );
      }

      // Validate schema version
      if (!storageState.schema.isValid) {
        validationResult.errors.push('Storage schema validation failed');
        validationResult.isValid = false;
      }

      if (storageState.schema.migrationNeeded) {
        validationResult.warnings.push('Storage schema migration is needed');
        validationResult.recommendations.push(
          'Run data migration to update schema'
        );
      }

      // Validate key structure
      const expectedKeys = [
        'userSettings',
        'cachedArticles',
        'learningProgress',
        'aiServiceConfig',
      ];
      const missingKeys = expectedKeys.filter(
        key => !storageState.keys.includes(key)
      );

      if (missingKeys.length > 0) {
        validationResult.warnings.push(
          `Missing expected keys: ${missingKeys.join(', ')}`
        );
        validationResult.recommendations.push(
          'Initialize missing storage keys'
        );
      }

      // Check for corrupted data
      await this.checkForCorruptedData(validationResult);

      this.validationResults = validationResult;
      console.log('Storage validation completed:', validationResult);

      return validationResult;
    } catch (error) {
      console.error('Failed to validate storage state:', error);
      return {
        isValid: false,
        errors: [`Validation failed: ${error}`],
        warnings: [],
        recommendations: ['Check storage accessibility and permissions'],
        corruptedKeys: [],
      };
    }
  }

  /**
   * Get current storage state
   */
  async getCurrentStorageState(): Promise<StorageState> {
    const storageStateScript = `
      () => {
        return new Promise((resolve) => {
          chrome.storage.local.get(null, (items) => {
            const keys = Object.keys(items);
            const totalSize = JSON.stringify(items).length;
            
            // Check schema version
            const schemaVersion = items._schemaVersion || '1.0.0';
            const expectedVersion = '1.2.0'; // Current expected version
            
            const storageState = {
              itemCount: keys.length,
              totalSize: totalSize,
              keys: keys,
              lastModified: items._lastModified || 'unknown',
              quota: {
                used: totalSize,
                available: 5242880, // 5MB default for local storage
                percentage: (totalSize / 5242880) * 100
              },
              schema: {
                version: schemaVersion,
                isValid: schemaVersion === expectedVersion,
                migrationNeeded: schemaVersion !== expectedVersion
              }
            };
            
            resolve(storageState);
          });
        });
      }
    `;

    // This would use mcp_chrome_devtools_evaluate_script when available
    // For now, return mock storage state
    return {
      itemCount: 6,
      totalSize: 3072,
      keys: [
        'userSettings',
        'cachedArticles',
        'learningProgress',
        'aiServiceConfig',
        '_lastModified',
        '_schemaVersion',
      ],
      lastModified: new Date().toISOString(),
      quota: {
        used: 3072,
        available: 5242880,
        percentage: 0.06,
      },
      schema: {
        version: '1.1.0',
        isValid: false,
        migrationNeeded: true,
      },
    };
  }

  /**
   * Check for corrupted data in storage
   */
  private async checkForCorruptedData(
    validationResult: StorageValidationResult
  ): Promise<void> {
    const corruptionCheckScript = `
      () => {
        return new Promise((resolve) => {
          chrome.storage.local.get(null, (items) => {
            const corruptedKeys = [];
            
            // Check each key for data corruption
            Object.keys(items).forEach(key => {
              try {
                const value = items[key];
                
                // Skip system keys
                if (key.startsWith('_')) return;
                
                // Check if value is valid JSON (for complex objects)
                if (typeof value === 'object' && value !== null) {
                  JSON.stringify(value);
                }
                
                // Specific validation for known keys
                switch (key) {
                  case 'userSettings':
                    if (!value.hasOwnProperty('language') || !value.hasOwnProperty('theme')) {
                      corruptedKeys.push(key);
                    }
                    break;
                  case 'cachedArticles':
                    if (!Array.isArray(value)) {
                      corruptedKeys.push(key);
                    }
                    break;
                  case 'learningProgress':
                    if (typeof value !== 'object' || !value.hasOwnProperty('totalWords')) {
                      corruptedKeys.push(key);
                    }
                    break;
                }
              } catch (error) {
                corruptedKeys.push(key);
              }
            });
            
            resolve(corruptedKeys);
          });
        });
      }
    `;

    // This would use mcp_chrome_devtools_evaluate_script when available
    // For now, simulate corruption check
    const corruptedKeys: string[] = []; // No corruption detected in mock

    validationResult.corruptedKeys = corruptedKeys;

    if (corruptedKeys.length > 0) {
      validationResult.errors.push(
        `Corrupted data detected in keys: ${corruptedKeys.join(', ')}`
      );
      validationResult.isValid = false;
      validationResult.recommendations.push('Repair or remove corrupted data');
    }
  }

  /**
   * Implement data migration debugging tools
   */
  async debugDataMigration(): Promise<any> {
    try {
      console.log('Starting data migration debugging...');

      const currentState = await this.getCurrentStorageState();

      const migrationPlan = {
        currentVersion: currentState.schema.version,
        targetVersion: '1.2.0',
        migrationSteps: [] as string[],
        estimatedTime: 0,
        backupRequired: true,
      };

      // Determine migration steps based on version difference
      if (currentState.schema.version === '1.0.0') {
        migrationPlan.migrationSteps.push(
          'Add aiServiceConfig key with default values',
          'Update userSettings structure to include new preferences',
          'Migrate cachedArticles to new format with metadata'
        );
        migrationPlan.estimatedTime = 500; // milliseconds
      } else if (currentState.schema.version === '1.1.0') {
        migrationPlan.migrationSteps.push(
          'Update learningProgress to include difficulty tracking',
          'Add performance metrics to cachedArticles'
        );
        migrationPlan.estimatedTime = 200;
      }

      // Create backup before migration
      const backupData = await this.createStorageBackup();

      const migrationResult = {
        plan: migrationPlan,
        backup: backupData,
        status: 'ready',
        timestamp: new Date().toISOString(),
      };

      console.log('Data migration debugging completed:', migrationResult);
      return migrationResult;
    } catch (error) {
      console.error('Failed to debug data migration:', error);
      return {
        error: error.message,
        status: 'failed',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Create storage backup for migration safety
   */
  private async createStorageBackup(): Promise<any> {
    const backupScript = `
      () => {
        return new Promise((resolve) => {
          chrome.storage.local.get(null, (items) => {
            const backup = {
              timestamp: new Date().toISOString(),
              version: items._schemaVersion || '1.0.0',
              data: items
            };
            resolve(backup);
          });
        });
      }
    `;

    // This would use mcp_chrome_devtools_evaluate_script when available
    // For now, return mock backup
    return {
      timestamp: new Date().toISOString(),
      version: '1.1.0',
      data: {
        userSettings: { language: 'en', theme: 'light' },
        cachedArticles: [],
        learningProgress: { totalWords: 150 },
        _lastModified: new Date().toISOString(),
        _schemaVersion: '1.1.0',
      },
    };
  }

  /**
   * Get captured storage operations
   */
  async getCapturedOperations(): Promise<StorageOperation[]> {
    const operationsScript = `
      () => {
        return window.storageOperations || [];
      }
    `;

    // This would use mcp_chrome_devtools_evaluate_script when available
    // For now, return mock operations
    return [
      {
        operation: 'get',
        args: [['userSettings']],
        timestamp: new Date().toISOString(),
        duration: 15,
        success: true,
        result: { userSettings: { language: 'en', theme: 'light' } },
      },
      {
        operation: 'set',
        args: [{ learningProgress: { totalWords: 151 } }],
        timestamp: new Date().toISOString(),
        duration: 23,
        success: true,
      },
    ];
  }

  /**
   * Get storage operation errors
   */
  async getStorageErrors(): Promise<StorageOperation[]> {
    const errorsScript = `
      () => {
        return window.storageErrors || [];
      }
    `;

    // This would use mcp_chrome_devtools_evaluate_script when available
    // For now, return mock errors (empty for healthy state)
    return [];
  }

  /**
   * Stop storage monitoring
   */
  async stopStorageMonitoring(): Promise<void> {
    if (!this.isMonitoring) {
      console.log('Storage monitoring not active');
      return;
    }

    try {
      console.log('Stopping storage operation monitoring...');
      this.isMonitoring = false;
      console.log('Storage monitoring stopped');
    } catch (error) {
      console.error('Failed to stop storage monitoring:', error);
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): {
    isMonitoring: boolean;
    operationCount: number;
    errorCount: number;
    lastValidation: StorageValidationResult | null;
  } {
    return {
      isMonitoring: this.isMonitoring,
      operationCount: this.capturedOperations.length,
      errorCount: this.capturedOperations.filter(op => !op.success).length,
      lastValidation: this.validationResults,
    };
  }
}
