/**
 * Content Script for Language Learning Chrome Extension
 * Extracts article content from web pages
 */
interface ExtractedContent {
    title: string;
    content: string;
    url: string;
    language?: string;
    wordCount: number;
    paragraphCount: number;
}
/**
 * Extract article content from the current page using multiple strategies
 */
declare function extractContent(): ExtractedContent | null;
/**
 * Extract title from the page
 */
declare function extractTitle(): string;
/**
 * Extract clean text content from an element
 */
declare function extractTextContent(element: Element): string;
/**
 * Send extracted content to background script
 */
declare function sendContentToBackground(content: ExtractedContent): void;
/**
 * Show a temporary success notification
 */
declare function showSuccessNotification(): void;
/**
 * Show a temporary error notification
 */
declare function showErrorNotification(message: string): void;
/**
 * Create a notification element
 */
declare function createNotification(message: string, type: 'success' | 'error'): HTMLDivElement;
//# sourceMappingURL=content-script.d.ts.map