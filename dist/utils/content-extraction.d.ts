/**
 * Content extraction utilities using Readability.js
 */
import type { ExtractedContent, ContentExtractor } from '../types';
/**
 * Readability.js extractor for primary content extraction
 */
export declare class ReadabilityExtractor implements ContentExtractor {
    /**
     * Extract article content using Readability.js
     */
    extract(document: Document): Promise<ExtractedContent>;
    /**
     * Validate extracted content
     */
    validate(content: string): boolean;
    /**
     * Sanitize extracted content
     */
    sanitize(content: string): string;
    /**
     * Count words in text
     */
    private countWords;
    /**
     * Count paragraphs in text
     */
    private countParagraphs;
}
/**
 * Jina Reader API extractor for fallback content extraction
 */
export declare class JinaReaderExtractor implements ContentExtractor {
    private apiKey?;
    private readonly apiBaseUrl;
    private readonly maxRetries;
    private readonly retryDelay;
    constructor(apiKey?: string | undefined);
    /**
     * Extract article content using Jina Reader API
     */
    extract(document: Document): Promise<ExtractedContent>;
    /**
     * Fetch content with retry logic
     */
    private fetchWithRetry;
    /**
     * Fetch content from Jina Reader API
     */
    private fetchContent;
    /**
     * Validate extracted content
     */
    validate(content: string): boolean;
    /**
     * Sanitize extracted content
     */
    sanitize(content: string): string;
    /**
     * Count words in text
     */
    private countWords;
    /**
     * Count paragraphs in text
     */
    private countParagraphs;
    /**
     * Sleep utility for retry delays
     */
    private sleep;
}
/**
 * Basic DOM parser for final fallback content extraction
 */
export declare class DOMExtractor implements ContentExtractor {
    private readonly minContentLength;
    private readonly minWordCount;
    /**
     * Extract article content using basic DOM parsing
     */
    extract(document: Document): Promise<ExtractedContent>;
    /**
     * Extract content from priority elements
     */
    private extractFromPriorityElements;
    /**
     * Extract text from an element, filtering out unwanted content
     */
    private extractTextFromElement;
    /**
     * Validate extracted content
     */
    validate(content: string): boolean;
    /**
     * Sanitize extracted content
     */
    sanitize(content: string): string;
    /**
     * Count words in text
     */
    private countWords;
    /**
     * Count paragraphs in text
     */
    private countParagraphs;
}
/**
 * Content extraction coordinator with fallback chain
 */
export declare class ContentExtractionCoordinator {
    private readabilityExtractor;
    private jinaReaderExtractor;
    private domExtractor;
    constructor(jinaApiKey?: string);
    /**
     * Extract content with fallback chain:
     * Readability.js → Jina Reader API → Basic DOM parsing
     */
    extractContent(document: Document): Promise<ExtractedContent>;
    /**
     * Update Jina Reader API key
     */
    updateJinaApiKey(apiKey: string): void;
}
//# sourceMappingURL=content-extraction.d.ts.map