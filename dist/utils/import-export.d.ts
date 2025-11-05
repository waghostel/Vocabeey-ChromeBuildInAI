/**
 * Import/Export Manager - Data export to Markdown and import for backup restoration
 * Implements Requirements: 8.6, 8.5
 */
import { type StorageManager } from './storage-manager';
export type ExportFormat = 'markdown' | 'json';
export declare class ImportExportManager {
    private storageManager;
    constructor(storageManager?: StorageManager);
    /**
     * Export all data to JSON format
     */
    exportToJSON(): Promise<string>;
    /**
     * Export all data to Markdown format
     */
    exportToMarkdown(): Promise<string>;
    /**
     * Export data in specified format
     */
    exportData(format: ExportFormat): Promise<string>;
    /**
     * Import data from JSON backup
     */
    importData(jsonData: string): Promise<void>;
    /**
     * Validate import data structure
     */
    private validateImportData;
    /**
     * Download export file
     */
    downloadExport(format: ExportFormat): Promise<void>;
    /**
     * Export vocabulary only
     */
    exportVocabularyOnly(format: ExportFormat): Promise<string>;
    /**
     * Export sentences only
     */
    exportSentencesOnly(format: ExportFormat): Promise<string>;
    /**
     * Get export size estimate
     */
    getExportSize(format: ExportFormat): Promise<number>;
    /**
     * Compress export data (for large datasets)
     */
    compressExport(data: string): Promise<Blob>;
    /**
     * Decompress import data
     */
    decompressImport(blob: Blob): Promise<string>;
}
export declare const importExportManager: ImportExportManager;
//# sourceMappingURL=import-export.d.ts.map