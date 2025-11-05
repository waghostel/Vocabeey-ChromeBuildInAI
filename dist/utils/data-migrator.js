/**
 * Data Migrator - Schema migration handlers with backward compatibility
 * Implements Requirements: 8.2, 9.5
 */
import { CURRENT_SCHEMA_VERSION } from './storage-manager.js';
// ============================================================================
// Version Comparison Utility
// ============================================================================
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;
        if (part1 > part2)
            return 1;
        if (part1 < part2)
            return -1;
    }
    return 0;
}
// ============================================================================
// Migration Definitions
// ============================================================================
const MIGRATIONS = [
    // Example migration from 0.0.0 to 1.0.0
    {
        version: '1.0.0',
        description: 'Initial schema version',
        migrate: async (data) => {
            // If migrating from no schema, initialize with defaults
            if (!data.schema_version) {
                return {
                    schema_version: '1.0.0',
                    user_settings: data.user_settings || {
                        nativeLanguage: 'en',
                        learningLanguage: 'es',
                        difficultyLevel: 5,
                        autoHighlight: false,
                        darkMode: false,
                        fontSize: 16,
                        apiKeys: {},
                    },
                    articles: data.articles || {},
                    vocabulary: data.vocabulary || {},
                    sentences: data.sentences || {},
                    processing_queue: data.processing_queue || [],
                    statistics: data.statistics || {
                        articlesProcessed: 0,
                        vocabularyLearned: 0,
                        sentencesHighlighted: 0,
                        lastActivity: new Date().toISOString(),
                    },
                };
            }
            return data;
        },
    },
    // Future migrations would be added here
    // {
    //   version: '1.1.0',
    //   description: 'Add new field to user settings',
    //   migrate: async (data: any) => {
    //     // Migration logic here
    //     return data;
    //   },
    // },
];
// ============================================================================
// Data Migrator Class
// ============================================================================
export class DataMigrator {
    /**
     * Get current schema version from storage
     */
    async getCurrentVersion() {
        const data = await chrome.storage.local.get('schema_version');
        return data.schema_version || '0.0.0';
    }
    /**
     * Migrate data to target version
     */
    async migrateToVersion(targetVersion) {
        const currentVersion = await this.getCurrentVersion();
        // No migration needed if already at target version
        if (compareVersions(currentVersion, targetVersion) === 0) {
            console.log(`Already at version ${targetVersion}`);
            return;
        }
        // Cannot downgrade
        if (compareVersions(currentVersion, targetVersion) > 0) {
            throw new Error(`Cannot downgrade from ${currentVersion} to ${targetVersion}`);
        }
        console.log(`Migrating from ${currentVersion} to ${targetVersion}`);
        try {
            // Get all current data
            const allData = await chrome.storage.local.get(null);
            // Apply migrations in order
            let migratedData = { ...allData };
            for (const migration of MIGRATIONS) {
                // Only apply migrations that are between current and target version
                if (compareVersions(migration.version, currentVersion) > 0 &&
                    compareVersions(migration.version, targetVersion) <= 0) {
                    console.log(`Applying migration to ${migration.version}: ${migration.description}`);
                    migratedData = await migration.migrate(migratedData);
                    migratedData.schema_version = migration.version;
                }
            }
            // Validate migrated data
            if (!this.validateSchema(migratedData)) {
                throw new Error('Migration resulted in invalid schema');
            }
            // Save migrated data
            await chrome.storage.local.clear();
            await chrome.storage.local.set(migratedData);
            console.log(`Successfully migrated to version ${targetVersion}`);
        }
        catch (error) {
            console.error('Migration failed:', error);
            await this.handleMigrationFailure(currentVersion, error);
            throw error;
        }
    }
    /**
     * Migrate to latest version
     */
    async migrateToLatest() {
        await this.migrateToVersion(CURRENT_SCHEMA_VERSION);
    }
    /**
     * Validate storage schema
     */
    validateSchema(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        const schema = data;
        // Check required fields
        if (!schema.schema_version || typeof schema.schema_version !== 'string') {
            return false;
        }
        if (!schema.user_settings || typeof schema.user_settings !== 'object') {
            return false;
        }
        if (!schema.articles || typeof schema.articles !== 'object') {
            return false;
        }
        if (!schema.vocabulary || typeof schema.vocabulary !== 'object') {
            return false;
        }
        if (!schema.sentences || typeof schema.sentences !== 'object') {
            return false;
        }
        if (!Array.isArray(schema.processing_queue)) {
            return false;
        }
        if (!schema.statistics || typeof schema.statistics !== 'object') {
            return false;
        }
        // Validate user settings structure
        const settings = schema.user_settings;
        if (typeof settings.nativeLanguage !== 'string' ||
            typeof settings.learningLanguage !== 'string' ||
            typeof settings.difficultyLevel !== 'number' ||
            typeof settings.autoHighlight !== 'boolean' ||
            typeof settings.darkMode !== 'boolean' ||
            typeof settings.fontSize !== 'number' ||
            typeof settings.apiKeys !== 'object') {
            return false;
        }
        // Validate statistics structure
        const stats = schema.statistics;
        if (typeof stats.articlesProcessed !== 'number' ||
            typeof stats.vocabularyLearned !== 'number' ||
            typeof stats.sentencesHighlighted !== 'number' ||
            typeof stats.lastActivity !== 'string') {
            return false;
        }
        return true;
    }
    /**
     * Check if migration is needed
     */
    async needsMigration() {
        const currentVersion = await this.getCurrentVersion();
        return compareVersions(currentVersion, CURRENT_SCHEMA_VERSION) < 0;
    }
    /**
     * Get list of pending migrations
     */
    async getPendingMigrations() {
        const currentVersion = await this.getCurrentVersion();
        return MIGRATIONS.filter(migration => compareVersions(migration.version, currentVersion) > 0 &&
            compareVersions(migration.version, CURRENT_SCHEMA_VERSION) <= 0);
    }
    /**
     * Create backup before migration
     */
    async createBackup() {
        const allData = await chrome.storage.local.get(null);
        const backup = JSON.stringify(allData, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `storage-backup-${timestamp}.json`;
        // In a real extension, this would trigger a download
        // For now, we'll just return the backup data
        console.log(`Backup created: ${filename}`);
        return backup;
    }
    /**
     * Restore from backup
     */
    async restoreFromBackup(backupData) {
        try {
            const data = JSON.parse(backupData);
            if (!this.validateSchema(data)) {
                throw new Error('Invalid backup data schema');
            }
            await chrome.storage.local.clear();
            await chrome.storage.local.set(data);
            console.log('Successfully restored from backup');
        }
        catch (error) {
            console.error('Failed to restore from backup:', error);
            throw new Error('Backup restoration failed');
        }
    }
    /**
     * Handle migration failure
     */
    async handleMigrationFailure(previousVersion, error) {
        console.error('Migration failed, attempting recovery...');
        // Log the error for debugging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Migration error: ${errorMessage}`);
        // In a production environment, you might want to:
        // 1. Notify the user
        // 2. Attempt to restore from a backup
        // 3. Reset to a safe state
        // 4. Send error telemetry (if user consents)
        // For now, we'll just log the failure
        console.error(`Failed to migrate from version ${previousVersion}. Data may be in an inconsistent state.`);
    }
    /**
     * Test migration without applying changes
     */
    async testMigration(targetVersion) {
        const errors = [];
        try {
            const currentVersion = await this.getCurrentVersion();
            const allData = await chrome.storage.local.get(null);
            let testData = { ...allData };
            // Apply migrations to test data
            for (const migration of MIGRATIONS) {
                if (compareVersions(migration.version, currentVersion) > 0 &&
                    compareVersions(migration.version, targetVersion) <= 0) {
                    testData = await migration.migrate(testData);
                    testData.schema_version = migration.version;
                }
            }
            // Validate result
            if (!this.validateSchema(testData)) {
                errors.push('Migration would result in invalid schema');
            }
            return {
                success: errors.length === 0,
                errors,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Migration test failed: ${errorMessage}`);
            return {
                success: false,
                errors,
            };
        }
    }
}
// ============================================================================
// Export singleton instance
// ============================================================================
export const dataMigrator = new DataMigrator();
//# sourceMappingURL=data-migrator.js.map