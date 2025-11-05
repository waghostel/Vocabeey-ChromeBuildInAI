/**
 * Content extraction utilities using Readability.js
 */
import { Readability } from '@mozilla/readability';
/**
 * Readability.js extractor for primary content extraction
 */
export class ReadabilityExtractor {
    /**
     * Extract article content using Readability.js
     */
    async extract(document) {
        try {
            // Clone the document to avoid modifying the original
            const documentClone = document.cloneNode(true);
            // Create Readability instance and parse
            const reader = new Readability(documentClone);
            const article = reader.parse();
            if (!article) {
                throw new Error('Readability.js failed to extract content');
            }
            // Validate extracted content
            const textContent = article.textContent || '';
            if (!this.validate(textContent)) {
                throw new Error('Extracted content failed validation');
            }
            // Sanitize the content
            const sanitizedContent = this.sanitize(textContent);
            // Count words and paragraphs
            const wordCount = this.countWords(sanitizedContent);
            const paragraphCount = this.countParagraphs(sanitizedContent);
            return {
                title: article.title || document.title || 'Untitled',
                content: sanitizedContent,
                url: document.location?.href || '',
                wordCount,
                paragraphCount,
            };
        }
        catch (error) {
            throw new Error(`Readability extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Validate extracted content
     */
    validate(content) {
        if (!content || typeof content !== 'string') {
            return false;
        }
        // Minimum content length (100 characters)
        if (content.trim().length < 100) {
            return false;
        }
        // Check for minimum word count (20 words)
        const wordCount = this.countWords(content);
        if (wordCount < 20) {
            return false;
        }
        return true;
    }
    /**
     * Sanitize extracted content
     */
    sanitize(content) {
        if (!content) {
            return '';
        }
        // Remove excessive whitespace
        let sanitized = content.replace(/\s+/g, ' ');
        // Remove leading/trailing whitespace
        sanitized = sanitized.trim();
        // Remove control characters except newlines and tabs
        // eslint-disable-next-line no-control-regex
        sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
        // Normalize line breaks
        sanitized = sanitized.replace(/\r\n/g, '\n');
        sanitized = sanitized.replace(/\r/g, '\n');
        // Remove excessive line breaks (more than 2 consecutive)
        sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
        return sanitized;
    }
    /**
     * Count words in text
     */
    countWords(text) {
        if (!text)
            return 0;
        return text
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 0).length;
    }
    /**
     * Count paragraphs in text
     */
    countParagraphs(text) {
        if (!text)
            return 0;
        return text.split(/\n\n+/).filter(para => para.trim().length > 0).length;
    }
}
/**
 * Jina Reader API extractor for fallback content extraction
 */
export class JinaReaderExtractor {
    apiKey;
    apiBaseUrl = 'https://r.jina.ai';
    maxRetries = 3;
    retryDelay = 1000; // 1 second
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    /**
     * Extract article content using Jina Reader API
     */
    async extract(document) {
        const url = document.location?.href;
        if (!url) {
            throw new Error('No URL available for Jina Reader extraction');
        }
        try {
            const content = await this.fetchWithRetry(url);
            if (!this.validate(content)) {
                throw new Error('Jina Reader content failed validation');
            }
            const sanitizedContent = this.sanitize(content);
            const wordCount = this.countWords(sanitizedContent);
            const paragraphCount = this.countParagraphs(sanitizedContent);
            return {
                title: document.title || 'Untitled',
                content: sanitizedContent,
                url,
                wordCount,
                paragraphCount,
            };
        }
        catch (error) {
            throw new Error(`Jina Reader extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Fetch content with retry logic
     */
    async fetchWithRetry(url, attempt = 1) {
        try {
            const response = await this.fetchContent(url);
            return response;
        }
        catch (error) {
            if (attempt >= this.maxRetries) {
                throw error;
            }
            // Handle rate limiting with exponential backoff
            if (error instanceof Error && error.message.includes('429')) {
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                await this.sleep(delay);
                return this.fetchWithRetry(url, attempt + 1);
            }
            throw error;
        }
    }
    /**
     * Fetch content from Jina Reader API
     */
    async fetchContent(url) {
        const jinaUrl = `${this.apiBaseUrl}/${url}`;
        const headers = {
            Accept: 'text/plain',
        };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        const response = await fetch(jinaUrl, {
            method: 'GET',
            headers,
        });
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid Jina Reader API key');
            }
            if (response.status === 429) {
                throw new Error('Rate limit exceeded (429)');
            }
            throw new Error(`Jina Reader API error: ${response.status} ${response.statusText}`);
        }
        const content = await response.text();
        if (!content) {
            throw new Error('Empty response from Jina Reader API');
        }
        return content;
    }
    /**
     * Validate extracted content
     */
    validate(content) {
        if (!content || typeof content !== 'string') {
            return false;
        }
        if (content.trim().length < 100) {
            return false;
        }
        const wordCount = this.countWords(content);
        if (wordCount < 20) {
            return false;
        }
        return true;
    }
    /**
     * Sanitize extracted content
     */
    sanitize(content) {
        if (!content) {
            return '';
        }
        let sanitized = content.replace(/\s+/g, ' ');
        sanitized = sanitized.trim();
        // eslint-disable-next-line no-control-regex
        sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
        sanitized = sanitized.replace(/\r\n/g, '\n');
        sanitized = sanitized.replace(/\r/g, '\n');
        sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
        return sanitized;
    }
    /**
     * Count words in text
     */
    countWords(text) {
        if (!text)
            return 0;
        return text
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 0).length;
    }
    /**
     * Count paragraphs in text
     */
    countParagraphs(text) {
        if (!text)
            return 0;
        return text.split(/\n\n+/).filter(para => para.trim().length > 0).length;
    }
    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
/**
 * Basic DOM parser for final fallback content extraction
 */
export class DOMExtractor {
    minContentLength = 100;
    minWordCount = 20;
    /**
     * Extract article content using basic DOM parsing
     */
    async extract(document) {
        try {
            // Try to find content in priority order
            const content = this.extractFromPriorityElements(document);
            if (!this.validate(content)) {
                throw new Error('DOM extraction failed validation');
            }
            const sanitizedContent = this.sanitize(content);
            const wordCount = this.countWords(sanitizedContent);
            const paragraphCount = this.countParagraphs(sanitizedContent);
            return {
                title: document.title || 'Untitled',
                content: sanitizedContent,
                url: document.location?.href || '',
                wordCount,
                paragraphCount,
            };
        }
        catch (error) {
            throw new Error(`DOM extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Extract content from priority elements
     */
    extractFromPriorityElements(document) {
        // Priority selectors for content-rich elements
        const selectors = [
            'article',
            'main',
            '[role="main"]',
            '.article-content',
            '.post-content',
            '.entry-content',
            '.content',
            '#content',
            '.main-content',
            '#main-content',
        ];
        // Try each selector
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = this.extractTextFromElement(element);
                if (text.length >= this.minContentLength) {
                    return text;
                }
            }
        }
        // Fallback to body if no priority elements found
        const bodyText = this.extractTextFromElement(document.body);
        if (bodyText.length >= this.minContentLength) {
            return bodyText;
        }
        throw new Error('No content found in document');
    }
    /**
     * Extract text from an element, filtering out unwanted content
     */
    extractTextFromElement(element) {
        // Clone element to avoid modifying original
        const clone = element.cloneNode(true);
        // Remove unwanted elements
        const unwantedSelectors = [
            'script',
            'style',
            'nav',
            'header',
            'footer',
            'aside',
            '.advertisement',
            '.ad',
            '.sidebar',
            '.comments',
            '.social-share',
            '[role="navigation"]',
            '[role="complementary"]',
        ];
        unwantedSelectors.forEach(selector => {
            clone.querySelectorAll(selector).forEach(el => el.remove());
        });
        // Get text content
        const text = clone.textContent || '';
        return text;
    }
    /**
     * Validate extracted content
     */
    validate(content) {
        if (!content || typeof content !== 'string') {
            return false;
        }
        if (content.trim().length < this.minContentLength) {
            return false;
        }
        const wordCount = this.countWords(content);
        if (wordCount < this.minWordCount) {
            return false;
        }
        return true;
    }
    /**
     * Sanitize extracted content
     */
    sanitize(content) {
        if (!content) {
            return '';
        }
        let sanitized = content.replace(/\s+/g, ' ');
        sanitized = sanitized.trim();
        // eslint-disable-next-line no-control-regex
        sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
        sanitized = sanitized.replace(/\r\n/g, '\n');
        sanitized = sanitized.replace(/\r/g, '\n');
        sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
        return sanitized;
    }
    /**
     * Count words in text
     */
    countWords(text) {
        if (!text)
            return 0;
        return text
            .trim()
            .split(/\s+/)
            .filter(word => word.length > 0).length;
    }
    /**
     * Count paragraphs in text
     */
    countParagraphs(text) {
        if (!text)
            return 0;
        return text.split(/\n\n+/).filter(para => para.trim().length > 0).length;
    }
}
/**
 * Content extraction coordinator with fallback chain
 */
export class ContentExtractionCoordinator {
    readabilityExtractor;
    jinaReaderExtractor;
    domExtractor;
    constructor(jinaApiKey) {
        this.readabilityExtractor = new ReadabilityExtractor();
        this.jinaReaderExtractor = new JinaReaderExtractor(jinaApiKey);
        this.domExtractor = new DOMExtractor();
    }
    /**
     * Extract content with fallback chain:
     * Readability.js → Jina Reader API → Basic DOM parsing
     */
    async extractContent(document) {
        const errors = [];
        // Try Readability.js first
        try {
            const content = await this.readabilityExtractor.extract(document);
            return content;
        }
        catch (error) {
            errors.push(`Readability: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // Try Jina Reader API as fallback
        try {
            const content = await this.jinaReaderExtractor.extract(document);
            return content;
        }
        catch (error) {
            errors.push(`Jina Reader: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // Try basic DOM parsing as final fallback
        try {
            const content = await this.domExtractor.extract(document);
            return content;
        }
        catch (error) {
            errors.push(`DOM Parser: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // All extraction methods failed
        throw new Error(`All content extraction methods failed:\n${errors.join('\n')}`);
    }
    /**
     * Update Jina Reader API key
     */
    updateJinaApiKey(apiKey) {
        this.jinaReaderExtractor = new JinaReaderExtractor(apiKey);
    }
}
//# sourceMappingURL=content-extraction.js.map