/**
 * Article Processor - Converts ExtractedContent to ProcessedArticle
 * Handles language detection, content splitting, and structure creation
 */
import type { ExtractedContent, ProcessedArticle } from '../types';
/**
 * Process extracted content into a structured article
 *
 * @param extracted - The extracted content
 * @param languageDetectionHandler - Optional handler for language detection (for service worker context)
 */
export declare function processArticle(extracted: ExtractedContent, languageDetectionHandler?: (payload: {
    text: string;
}) => Promise<{
    language: string;
    confidence: number;
}>): Promise<ProcessedArticle>;
/**
 * Validate processed article
 */
export declare function validateProcessedArticle(article: ProcessedArticle): boolean;
//# sourceMappingURL=article-processor.d.ts.map