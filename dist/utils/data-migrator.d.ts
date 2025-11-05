/**
 * Data Migrator - Schema migration handlers with backward compatibility
 * Implements Requirements: 8.2, 9.5
 */
type MigrationFunction = (data: any) => Promise<any>;
interface Migration {
    version: string;
    description: string;
    migrate: MigrationFunction;
}
export declare class DataMigrator {
    /**
     * Get current schema version from storage
     */
    getCurrentVersion(): Promise<string>;
    /**
     * Migrate data to target version
     */
    migrateToVersion(targetVersion: string): Promise<void>;
    /**
     * Migrate to latest version
     */
    migrateToLatest(): Promise<void>;
    /**
     * Validate storage schema
     */
    validateSchema(data: unknown): boolean;
    /**
     * Check if migration is needed
     */
    needsMigration(): Promise<boolean>;
    /**
     * Get list of pending migrations
     */
    getPendingMigrations(): Promise<Migration[]>;
    /**
     * Create backup before migration
     */
    createBackup(): Promise<string>;
    /**
     * Restore from backup
     */
    restoreFromBackup(backupData: string): Promise<void>;
    /**
     * Handle migration failure
     */
    private handleMigrationFailure;
    /**
     * Test migration without applying changes
     */
    testMigration(targetVersion: string): Promise<{
        success: boolean;
        errors: string[];
    }>;
}
export declare const dataMigrator: DataMigrator;

//# sourceMappingURL=data-migrator.d.ts.map