/**
 * Import/Export Manager - Data export to Markdown and import for backup restoration
 * Implements Requirements: 8.6, 8.5
 */
import { getStorageManager } from './storage-manager.js';
// ============================================================================
// Import/Export Manager Class
// ============================================================================
export class ImportExportManager {
    storageManager;
    constructor(storageManager) {
        this.storageManager = storageManager || getStorageManager();
    }
    /**
     * Export all data to JSON format
     */
    async exportToJSON() {
        const settings = await this.storageManager.getUserSettings();
        const articles = await this.storageManager.getAllArticles();
        const vocabulary = await this.storageManager.getAllVocabulary();
        const sentences = await this.storageManager.getAllSentences();
        const statistics = await this.storageManager.getStatistics();
        const version = await this.storageManager.getSchemaVersion();
        const exportData = {
            exportedAt: new Date().toISOString(),
            version,
            settings,
            articles,
            vocabulary,
            sentences,
            statistics,
        };
        return JSON.stringify(exportData, null, 2);
    }
    /**
     * Export all data to Markdown format
     */
    async exportToMarkdown() {
        const settings = await this.storageManager.getUserSettings();
        const articles = await this.storageManager.getAllArticles();
        const vocabulary = await this.storageManager.getAllVocabulary();
        const sentences = await this.storageManager.getAllSentences();
        const statistics = await this.storageManager.getStatistics();
        let markdown = '# Language Learning Extension - Data Export\n\n';
        markdown += `**Exported:** ${new Date().toISOString()}\n\n`;
        // Settings
        markdown += '## Settings\n\n';
        markdown += `- **Native Language:** ${settings.nativeLanguage}\n`;
        markdown += `- **Learning Language:** ${settings.learningLanguage}\n`;
        markdown += `- **Difficulty Level:** ${settings.difficultyLevel}/10\n`;
        markdown += `- **Auto Highlight:** ${settings.autoHighlight ? 'Yes' : 'No'}\n`;
        markdown += `- **Dark Mode:** ${settings.darkMode ? 'Yes' : 'No'}\n`;
        markdown += `- **Font Size:** ${settings.fontSize}px\n\n`;
        // Statistics
        markdown += '## Statistics\n\n';
        markdown += `- **Articles Processed:** ${statistics.articlesProcessed}\n`;
        markdown += `- **Vocabulary Learned:** ${statistics.vocabularyLearned}\n`;
        markdown += `- **Sentences Highlighted:** ${statistics.sentencesHighlighted}\n`;
        markdown += `- **Last Activity:** ${new Date(statistics.lastActivity).toLocaleString()}\n\n`;
        // Articles
        markdown += `## Articles (${articles.length})\n\n`;
        for (const article of articles) {
            markdown += `### ${article.title}\n\n`;
            markdown += `- **URL:** ${article.url}\n`;
            markdown += `- **Language:** ${article.originalLanguage}\n`;
            markdown += `- **Processed:** ${new Date(article.processedAt).toLocaleString()}\n`;
            markdown += `- **Status:** ${article.processingStatus}\n`;
            markdown += `- **Parts:** ${article.parts.length}\n\n`;
        }
        // Vocabulary
        markdown += `## Vocabulary (${vocabulary.length})\n\n`;
        // Group vocabulary by article
        const vocabByArticle = vocabulary.reduce((acc, vocab) => {
            if (!acc[vocab.articleId]) {
                acc[vocab.articleId] = [];
            }
            acc[vocab.articleId].push(vocab);
            return acc;
        }, {});
        for (const [articleId, vocabItems] of Object.entries(vocabByArticle)) {
            const article = articles.find(a => a.id === articleId);
            const articleTitle = article ? article.title : 'Unknown Article';
            markdown += `### ${articleTitle}\n\n`;
            for (const vocab of vocabItems) {
                markdown += `#### ${vocab.word}${vocab.phrase ? ` (${vocab.phrase})` : ''}\n\n`;
                markdown += `- **Translation:** ${vocab.translation}\n`;
                markdown += `- **Context:** ${vocab.context}\n`;
                markdown += `- **Difficulty:** ${vocab.difficulty}/10\n`;
                markdown += `- **Review Count:** ${vocab.reviewCount}\n`;
                markdown += `- **Last Reviewed:** ${new Date(vocab.lastReviewed).toLocaleString()}\n`;
                if (vocab.exampleSentences.length > 0) {
                    markdown += `- **Example Sentences:**\n`;
                    for (const sentence of vocab.exampleSentences) {
                        markdown += `  - ${sentence}\n`;
                    }
                }
                markdown += '\n';
            }
        }
        // Sentences
        markdown += `## Sentences (${sentences.length})\n\n`;
        // Group sentences by article
        const sentencesByArticle = sentences.reduce((acc, sentence) => {
            if (!acc[sentence.articleId]) {
                acc[sentence.articleId] = [];
            }
            acc[sentence.articleId].push(sentence);
            return acc;
        }, {});
        for (const [articleId, sentenceItems] of Object.entries(sentencesByArticle)) {
            const article = articles.find(a => a.id === articleId);
            const articleTitle = article ? article.title : 'Unknown Article';
            markdown += `### ${articleTitle}\n\n`;
            for (const sentence of sentenceItems) {
                markdown += `#### ${sentence.content}\n\n`;
                markdown += `- **Translation:** ${sentence.translation}\n`;
                markdown += `- **Created:** ${new Date(sentence.createdAt).toLocaleString()}\n\n`;
            }
        }
        return markdown;
    }
    /**
     * Export data in specified format
     */
    async exportData(format) {
        if (format === 'markdown') {
            return await this.exportToMarkdown();
        }
        else {
            return await this.exportToJSON();
        }
    }
    /**
     * Import data from JSON backup
     */
    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            // Validate import data
            if (!this.validateImportData(data)) {
                throw new Error('Invalid import data format');
            }
            // Import settings
            await this.storageManager.saveUserSettings(data.settings);
            // Import articles
            for (const article of data.articles) {
                await this.storageManager.saveArticle(article);
            }
            // Import vocabulary
            for (const vocab of data.vocabulary) {
                await this.storageManager.saveVocabulary(vocab);
            }
            // Import sentences
            for (const sentence of data.sentences) {
                await this.storageManager.saveSentence(sentence);
            }
            console.log('Data import completed successfully');
        }
        catch (error) {
            console.error('Failed to import data:', error);
            throw new Error('Data import failed');
        }
    }
    /**
     * Validate import data structure
     */
    validateImportData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        const exportData = data;
        if (!exportData.exportedAt || typeof exportData.exportedAt !== 'string') {
            return false;
        }
        if (!exportData.version || typeof exportData.version !== 'string') {
            return false;
        }
        if (!exportData.settings || typeof exportData.settings !== 'object') {
            return false;
        }
        if (!Array.isArray(exportData.articles)) {
            return false;
        }
        if (!Array.isArray(exportData.vocabulary)) {
            return false;
        }
        if (!Array.isArray(exportData.sentences)) {
            return false;
        }
        if (!exportData.statistics || typeof exportData.statistics !== 'object') {
            return false;
        }
        return true;
    }
    /**
     * Download export file
     */
    async downloadExport(format) {
        const data = await this.exportData(format);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = format === 'markdown' ? 'md' : 'json';
        const filename = `language-learning-export-${timestamp}.${extension}`;
        // Create blob and download
        const blob = new Blob([data], {
            type: format === 'markdown' ? 'text/markdown' : 'application/json',
        });
        const url = URL.createObjectURL(blob);
        // Trigger download using Chrome downloads API
        await chrome.downloads.download({
            url,
            filename,
            saveAs: true,
        });
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        console.log(`Export downloaded: ${filename}`);
    }
    /**
     * Export vocabulary only
     */
    async exportVocabularyOnly(format) {
        const vocabulary = await this.storageManager.getAllVocabulary();
        const articles = await this.storageManager.getAllArticles();
        if (format === 'json') {
            return JSON.stringify({
                exportedAt: new Date().toISOString(),
                type: 'vocabulary',
                vocabulary,
            }, null, 2);
        }
        // Markdown format
        let markdown = '# Vocabulary Export\n\n';
        markdown += `**Exported:** ${new Date().toISOString()}\n\n`;
        markdown += `**Total Items:** ${vocabulary.length}\n\n`;
        // Group by article
        const vocabByArticle = vocabulary.reduce((acc, vocab) => {
            if (!acc[vocab.articleId]) {
                acc[vocab.articleId] = [];
            }
            acc[vocab.articleId].push(vocab);
            return acc;
        }, {});
        for (const [articleId, vocabItems] of Object.entries(vocabByArticle)) {
            const article = articles.find(a => a.id === articleId);
            const articleTitle = article ? article.title : 'Unknown Article';
            markdown += `## ${articleTitle}\n\n`;
            for (const vocab of vocabItems) {
                markdown += `### ${vocab.word}\n\n`;
                markdown += `- **Translation:** ${vocab.translation}\n`;
                markdown += `- **Context:** ${vocab.context}\n`;
                markdown += `- **Difficulty:** ${vocab.difficulty}/10\n\n`;
            }
        }
        return markdown;
    }
    /**
     * Export sentences only
     */
    async exportSentencesOnly(format) {
        const sentences = await this.storageManager.getAllSentences();
        const articles = await this.storageManager.getAllArticles();
        if (format === 'json') {
            return JSON.stringify({
                exportedAt: new Date().toISOString(),
                type: 'sentences',
                sentences,
            }, null, 2);
        }
        // Markdown format
        let markdown = '# Sentences Export\n\n';
        markdown += `**Exported:** ${new Date().toISOString()}\n\n`;
        markdown += `**Total Items:** ${sentences.length}\n\n`;
        // Group by article
        const sentencesByArticle = sentences.reduce((acc, sentence) => {
            if (!acc[sentence.articleId]) {
                acc[sentence.articleId] = [];
            }
            acc[sentence.articleId].push(sentence);
            return acc;
        }, {});
        for (const [articleId, sentenceItems] of Object.entries(sentencesByArticle)) {
            const article = articles.find(a => a.id === articleId);
            const articleTitle = article ? article.title : 'Unknown Article';
            markdown += `## ${articleTitle}\n\n`;
            for (const sentence of sentenceItems) {
                markdown += `### ${sentence.content}\n\n`;
                markdown += `**Translation:** ${sentence.translation}\n\n`;
            }
        }
        return markdown;
    }
    /**
     * Get export size estimate
     */
    async getExportSize(format) {
        const data = await this.exportData(format);
        return new Blob([data]).size;
    }
    /**
     * Compress export data (for large datasets)
     */
    async compressExport(data) {
        // Convert string to Uint8Array
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(data);
        // Use CompressionStream API (available in modern browsers)
        const stream = new Blob([uint8Array])
            .stream()
            .pipeThrough(new CompressionStream('gzip'));
        // Convert stream to blob
        const compressedBlob = await new Response(stream).blob();
        return compressedBlob;
    }
    /**
     * Decompress import data
     */
    async decompressImport(blob) {
        // Use DecompressionStream API
        const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
        // Convert stream to text
        const decompressedText = await new Response(stream).text();
        return decompressedText;
    }
}
// ============================================================================
// Export singleton instance
// ============================================================================
export const importExportManager = new ImportExportManager();
//# sourceMappingURL=import-export.js.map