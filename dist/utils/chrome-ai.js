/**
 * Chrome Built-in AI APIs integration
 * Provides language detection, summarization, rewriting, translation, and vocabulary analysis
 */
import { RetryHandler } from './retry-handler.js';
import { DEFAULT_TRANSLATION_RETRY_CONFIG } from './retry-config.js';
import { getTranslationDebugger } from './translation-debugger.js';
// ============================================================================
// Language Detector
// ============================================================================
export class ChromeLanguageDetector {
    cache = new Map();
    maxCacheSize = 100;
    activeSessions = new Set();
    /**
     * Detect language of text using Chrome's Language Detector API
     * Returns language code and confidence score
     */
    async detectLanguage(text) {
        // Check cache first
        const cacheKey = this.getCacheKey(text);
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        let detector = null;
        try {
            // Check if API is available (global LanguageDetector)
            console.log('🔎 Checking if LanguageDetector API is available...');
            console.log('typeof LanguageDetector:', typeof LanguageDetector);
            if (typeof LanguageDetector === 'undefined') {
                console.error('❌ LanguageDetector API is undefined!');
                console.log('Available globals:', Object.keys(globalThis).filter(k => k.includes('Language') || k.includes('Detect')));
                throw this.createError('api_unavailable', 'Language Detector API not available in this context');
            }
            // Create detector and detect language
            detector = await LanguageDetector.create();
            this.activeSessions.add(detector);
            const results = await detector.detect(text);
            if (!results || results.length === 0) {
                throw this.createError('processing_failed', 'No language detected');
            }
            // Get the most confident result
            const sortedResults = [...results].sort((a, b) => b.confidence - a.confidence);
            const topResult = sortedResults[0];
            const result = {
                language: topResult.detectedLanguage,
                confidence: topResult.confidence,
            };
            // Cache the result
            this.cacheResult(cacheKey, result);
            return result;
        }
        catch (error) {
            console.error('❌ Language detection error caught:', error);
            console.error('Error details:', {
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                isAIError: this.isAIError(error),
            });
            if (this.isAIError(error)) {
                throw error;
            }
            throw this.createError('processing_failed', `Language detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            // Always destroy the detector instance to free memory
            if (detector) {
                this.activeSessions.delete(detector);
                // Note: LanguageDetector doesn't have a destroy() method in the API
                // but we remove it from tracking to allow garbage collection
            }
        }
    }
    /**
     * Destroy all active sessions
     */
    destroyAllSessions() {
        // Clear session tracking to allow garbage collection
        this.activeSessions.clear();
        console.log('🧹 All language detector sessions cleared');
    }
    /**
     * Check if Language Detector API is available
     */
    async isAvailable() {
        try {
            // Check for global LanguageDetector API
            return typeof LanguageDetector !== 'undefined';
        }
        catch {
            return false;
        }
    }
    /**
     * Clear the language detection cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Destroy and cleanup all resources
     */
    destroy() {
        this.destroyAllSessions();
        this.clearCache();
    }
    /**
     * Generate cache key from text (first 200 chars)
     */
    getCacheKey(text) {
        return text.substring(0, 200).trim();
    }
    /**
     * Cache detection result with size limit
     */
    cacheResult(key, result) {
        // Implement LRU-like behavior: remove oldest if at capacity
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, result);
    }
    /**
     * Create standardized AI error
     */
    createError(type, message) {
        return {
            type,
            message,
            retryable: type === 'network' || type === 'rate_limit',
        };
    }
    /**
     * Type guard for AI errors
     */
    isAIError(error) {
        return (typeof error === 'object' &&
            error !== null &&
            'type' in error &&
            'message' in error);
    }
}
// ============================================================================
// Summarizer
// ============================================================================
export class ChromeSummarizer {
    activeSessions = [];
    /**
     * Summarize content with hierarchical approach for long content
     */
    async summarizeContent(text, options = {}) {
        try {
            // Check if API is available
            if (!window.ai?.summarizer) {
                throw this.createError('api_unavailable', 'Summarizer API not available');
            }
            const capabilities = await window.ai.summarizer.capabilities();
            if (capabilities.available !== 'readily') {
                throw this.createError('api_unavailable', 'Summarizer not ready');
            }
            // For long content, use hierarchical summarization
            if (text.length > 10000) {
                return await this.hierarchicalSummarize(text, options);
            }
            // For shorter content, summarize directly
            return await this.summarizeChunk(text, options);
        }
        catch (error) {
            if (this.isAIError(error)) {
                throw error;
            }
            throw this.createError('processing_failed', `Summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Subdivide article into 1-3 paragraph parts
     */
    async subdivideArticle(content) {
        // Split content into paragraphs
        const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
        if (paragraphs.length === 0) {
            return [content];
        }
        const parts = [];
        let currentPart = [];
        let currentLength = 0;
        const targetLength = 500; // Target ~500 words per part
        for (const paragraph of paragraphs) {
            const wordCount = paragraph.split(/\s+/).length;
            // If adding this paragraph would exceed 3 paragraphs or target length significantly
            if (currentPart.length >= 3 ||
                (currentPart.length > 0 &&
                    currentLength + wordCount > targetLength * 1.5)) {
                parts.push(currentPart.join('\n\n'));
                currentPart = [paragraph];
                currentLength = wordCount;
            }
            else {
                currentPart.push(paragraph);
                currentLength += wordCount;
            }
        }
        // Add remaining paragraphs
        if (currentPart.length > 0) {
            parts.push(currentPart.join('\n\n'));
        }
        return parts;
    }
    /**
     * Check if Summarizer API is available
     */
    async isAvailable() {
        try {
            if (!window.ai?.summarizer) {
                return false;
            }
            const capabilities = await window.ai.summarizer.capabilities();
            return capabilities.available === 'readily';
        }
        catch {
            return false;
        }
    }
    /**
     * Clean up all active summarizer sessions
     */
    destroy() {
        this.activeSessions.forEach(session => {
            try {
                session.destroy();
            }
            catch {
                // Ignore cleanup errors
            }
        });
        this.activeSessions = [];
    }
    /**
     * Hierarchical summarization for long content
     */
    async hierarchicalSummarize(text, options) {
        // Split into chunks of ~5000 characters
        const chunkSize = 5000;
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.substring(i, i + chunkSize));
        }
        // Summarize each chunk
        const summaries = await Promise.all(chunks.map(chunk => this.summarizeChunk(chunk, options)));
        // If we have multiple summaries, combine and summarize again
        if (summaries.length > 1) {
            const combined = summaries.join('\n\n');
            return await this.summarizeChunk(combined, options);
        }
        return summaries[0];
    }
    /**
     * Summarize a single chunk of text
     */
    async summarizeChunk(text, options) {
        const summarizer = await window.ai.summarizer.create({
            type: 'tl;dr',
            format: options.format === 'bullet' ? 'markdown' : 'plain-text',
            length: this.mapLength(options.maxLength),
        });
        this.activeSessions.push(summarizer);
        try {
            const summary = await summarizer.summarize(text);
            // Filter out noise (ads, navigation, etc.)
            const cleaned = this.filterNoise(summary);
            return cleaned;
        }
        finally {
            // Clean up session
            const index = this.activeSessions.indexOf(summarizer);
            if (index > -1) {
                this.activeSessions.splice(index, 1);
            }
            summarizer.destroy();
        }
    }
    /**
     * Filter out noise like ads and navigation elements
     */
    filterNoise(text) {
        // Remove common ad/navigation patterns
        const noisePatterns = [
            /advertisement/gi,
            /click here/gi,
            /subscribe now/gi,
            /sign up/gi,
            /follow us/gi,
            /share this/gi,
            /related articles/gi,
            /you may also like/gi,
            /recommended for you/gi,
        ];
        let cleaned = text;
        noisePatterns.forEach(pattern => {
            cleaned = cleaned.replace(pattern, '');
        });
        // Remove excessive whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        return cleaned;
    }
    /**
     * Map maxLength option to Chrome API length parameter
     */
    mapLength(maxLength) {
        if (!maxLength)
            return 'medium';
        if (maxLength < 100)
            return 'short';
        if (maxLength < 300)
            return 'medium';
        return 'long';
    }
    /**
     * Create standardized AI error
     */
    createError(type, message) {
        return {
            type,
            message,
            retryable: type === 'network' || type === 'rate_limit',
        };
    }
    /**
     * Type guard for AI errors
     */
    isAIError(error) {
        return (typeof error === 'object' &&
            error !== null &&
            'type' in error &&
            'message' in error);
    }
}
// ============================================================================
// Rewriter
// ============================================================================
export class ChromeRewriter {
    activeSessions = [];
    /**
     * Rewrite content based on user difficulty level (1-10)
     */
    async rewriteContent(text, difficulty) {
        try {
            // Validate difficulty level
            if (difficulty < 1 || difficulty > 10) {
                throw this.createError('invalid_input', 'Difficulty must be between 1 and 10');
            }
            // Check if API is available
            if (!window.ai?.rewriter) {
                throw this.createError('api_unavailable', 'Rewriter API not available');
            }
            const capabilities = await window.ai.rewriter.capabilities();
            if (capabilities.available !== 'readily') {
                throw this.createError('api_unavailable', 'Rewriter not ready');
            }
            // Map difficulty to tone and approach
            const tone = this.mapDifficultyToTone(difficulty);
            // For long content, process in chunks
            if (text.length > 5000) {
                return await this.rewriteInChunks(text, tone);
            }
            return await this.rewriteChunk(text, tone);
        }
        catch (error) {
            if (this.isAIError(error)) {
                throw error;
            }
            throw this.createError('processing_failed', `Rewriting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Check if Rewriter API is available
     */
    async isAvailable() {
        try {
            if (!window.ai?.rewriter) {
                return false;
            }
            const capabilities = await window.ai.rewriter.capabilities();
            return capabilities.available === 'readily';
        }
        catch {
            return false;
        }
    }
    /**
     * Clean up all active rewriter sessions
     */
    destroy() {
        this.activeSessions.forEach(session => {
            try {
                session.destroy();
            }
            catch {
                // Ignore cleanup errors
            }
        });
        this.activeSessions = [];
    }
    /**
     * Map difficulty level to rewriting tone
     * 1-3: More formal, simpler vocabulary
     * 4-7: Casual, moderate vocabulary
     * 8-10: As-is, preserve original complexity
     */
    mapDifficultyToTone(difficulty) {
        if (difficulty <= 3) {
            return 'more-formal'; // Simpler, clearer language
        }
        else if (difficulty <= 7) {
            return 'more-casual'; // Moderate, accessible language
        }
        else {
            return 'as-is'; // Preserve original complexity
        }
    }
    /**
     * Rewrite content in chunks for long text
     */
    async rewriteInChunks(text, tone) {
        // Split by paragraphs to maintain structure
        const paragraphs = text.split(/\n\n+/);
        const chunkSize = 3; // Process 3 paragraphs at a time
        const chunks = [];
        for (let i = 0; i < paragraphs.length; i += chunkSize) {
            const chunk = paragraphs.slice(i, i + chunkSize).join('\n\n');
            chunks.push(chunk);
        }
        // Rewrite each chunk
        const rewritten = await Promise.all(chunks.map(chunk => this.rewriteChunk(chunk, tone)));
        return rewritten.join('\n\n');
    }
    /**
     * Rewrite a single chunk of text
     */
    async rewriteChunk(text, tone) {
        const rewriter = await window.ai.rewriter.create({
            tone,
            format: 'plain-text',
            length: 'as-is', // Maintain original length
        });
        this.activeSessions.push(rewriter);
        try {
            const rewritten = await rewriter.rewrite(text);
            // Validate that factual accuracy is maintained
            // (basic check - ensure similar length and structure)
            if (!this.validateRewrite(text, rewritten)) {
                console.warn('Rewrite validation failed, returning original');
                return text;
            }
            return rewritten;
        }
        finally {
            // Clean up session
            const index = this.activeSessions.indexOf(rewriter);
            if (index > -1) {
                this.activeSessions.splice(index, 1);
            }
            rewriter.destroy();
        }
    }
    /**
     * Validate that rewritten content maintains factual accuracy
     * Basic checks: similar length, structure preserved
     */
    validateRewrite(original, rewritten) {
        // Check if rewritten text is not empty
        if (!rewritten || rewritten.trim().length === 0) {
            return false;
        }
        // Check if length is within reasonable bounds (50% to 150% of original)
        const originalLength = original.length;
        const rewrittenLength = rewritten.length;
        if (rewrittenLength < originalLength * 0.5 ||
            rewrittenLength > originalLength * 1.5) {
            return false;
        }
        // Check if paragraph structure is roughly maintained
        const originalParas = original.split(/\n\n+/).length;
        const rewrittenParas = rewritten.split(/\n\n+/).length;
        if (Math.abs(originalParas - rewrittenParas) > originalParas * 0.5) {
            return false;
        }
        return true;
    }
    /**
     * Create standardized AI error
     */
    createError(type, message) {
        return {
            type,
            message,
            retryable: type === 'network' || type === 'rate_limit',
        };
    }
    /**
     * Type guard for AI errors
     */
    isAIError(error) {
        return (typeof error === 'object' &&
            error !== null &&
            'type' in error &&
            'message' in error);
    }
}
export class ChromeTranslator {
    activeSessions = new Map();
    translationCache = new Map();
    maxCacheSize = 500;
    maxBatchSize = 20;
    retryHandler;
    debugger = getTranslationDebugger();
    constructor() {
        this.retryHandler = new RetryHandler(DEFAULT_TRANSLATION_RETRY_CONFIG);
    }
    /**
     * Translate text from source to target language with retry and debugging
     */
    async translateText(text, sourceLanguage, targetLanguage, context) {
        const operationId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        // Check if source and target languages are the same
        if (sourceLanguage === targetLanguage) {
            console.log(`[ChromeTranslator] Same language detected (${sourceLanguage} -> ${targetLanguage}), returning original text`);
            // Log for debugging purposes
            this.debugger.logTranslation({
                timestamp: startTime,
                operationId,
                text,
                sourceLanguage,
                targetLanguage,
                context: context || 'none',
                attempts: 0,
                success: true,
                result: text,
                duration: Date.now() - startTime,
                cacheHit: false,
                sessionReused: false,
                sameLanguage: true,
            });
            return text;
        }
        // Check cache first
        const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);
        const cached = this.translationCache.get(cacheKey);
        if (cached) {
            // Log cache hit
            this.debugger.logTranslation({
                timestamp: startTime,
                operationId,
                text,
                sourceLanguage,
                targetLanguage,
                context: context || 'none',
                attempts: 0,
                success: true,
                result: cached,
                duration: Date.now() - startTime,
                cacheHit: true,
                sessionReused: false,
            });
            return cached;
        }
        // Execute translation with retry
        const result = await this.retryHandler.executeWithRetry(() => this.translateTextOnce(text, sourceLanguage, targetLanguage), `translate(${sourceLanguage}->${targetLanguage})`);
        // Log translation attempt
        this.debugger.logTranslation({
            timestamp: startTime,
            operationId,
            text,
            sourceLanguage,
            targetLanguage,
            context: context || 'none',
            attempts: result.attempts.length,
            success: result.success,
            result: result.result,
            error: result.error?.message,
            duration: result.totalDuration,
            cacheHit: false,
            apiAvailability: await this.checkAvailability(sourceLanguage, targetLanguage),
            sessionReused: this.activeSessions.has(`${sourceLanguage}-${targetLanguage}`),
        });
        if (result.success && result.result) {
            // Cache successful translation
            this.cacheTranslation(cacheKey, result.result);
            return result.result;
        }
        // All retries failed
        throw result.error || new Error('Translation failed after retries');
    }
    /**
     * Single translation attempt (no retry)
     */
    async translateTextOnce(text, sourceLanguage, targetLanguage) {
        // Check if global Translator API is available
        if (typeof Translator === 'undefined') {
            const error = new Error('Translator API not available in this context (offscreen document limitation)');
            error.name = 'api_unavailable'; // Non-retryable
            throw error;
        }
        // Check if language pair is available
        const availability = await Translator.availability({
            sourceLanguage,
            targetLanguage,
        });
        if (availability === 'no') {
            const error = new Error(`Translation not available for ${sourceLanguage} to ${targetLanguage}`);
            error.name = 'language_pair_unavailable'; // Non-retryable
            throw error;
        }
        // Handle model download
        if (availability === 'after-download') {
            console.log('[TRANSLATOR] Model download required');
            // This might take time, but it's not an error
        }
        // Get or create translator session
        const translator = await this.getTranslator(sourceLanguage, targetLanguage);
        // Translate
        const translation = await translator.translate(text);
        if (!translation || translation.trim().length === 0) {
            throw new Error('Empty translation result');
        }
        return translation;
    }
    /**
     * Check API availability for debugging
     */
    async checkAvailability(sourceLanguage, targetLanguage) {
        try {
            if (typeof Translator === 'undefined') {
                return 'api_unavailable';
            }
            const availability = await Translator.availability({
                sourceLanguage,
                targetLanguage,
            });
            return availability;
        }
        catch {
            return 'check_failed';
        }
    }
    /**
     * Translate text with streaming for long content
     */
    async translateStreaming(text, sourceLanguage, targetLanguage, onChunk) {
        try {
            // Check if source and target languages are the same
            if (sourceLanguage === targetLanguage) {
                console.log(`[ChromeTranslator] Same language detected in streaming translate (${sourceLanguage} -> ${targetLanguage}), returning original text`);
                onChunk(text);
                return text;
            }
            const translator = await this.getTranslator(sourceLanguage, targetLanguage);
            let fullTranslation = '';
            const stream = translator.translateStreaming(text);
            for await (const chunk of stream) {
                fullTranslation += chunk;
                onChunk(chunk);
            }
            // Cache the result
            const cacheKey = this.getCacheKey(text, sourceLanguage, targetLanguage);
            this.cacheTranslation(cacheKey, fullTranslation);
            return fullTranslation;
        }
        catch (error) {
            if (this.isAIError(error)) {
                throw error;
            }
            throw this.createError('processing_failed', `Streaming translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Batch translate multiple words/phrases (up to 20 per call)
     */
    async batchTranslate(requests, sourceLanguage, targetLanguage) {
        try {
            // Validate batch size
            if (requests.length > this.maxBatchSize) {
                throw this.createError('invalid_input', `Batch size exceeds maximum of ${this.maxBatchSize}`);
            }
            // Check if source and target languages are the same
            if (sourceLanguage === targetLanguage) {
                console.log(`[ChromeTranslator] Same language detected in batch translate (${sourceLanguage} -> ${targetLanguage}), returning original texts`);
                return requests.map(req => ({
                    original: req.text,
                    translation: req.text,
                    context: req.context,
                }));
            }
            // Check cache for each request
            const results = [];
            const uncachedRequests = [];
            const uncachedIndices = [];
            requests.forEach((req, index) => {
                const cacheKey = this.getCacheKey(req.text, sourceLanguage, targetLanguage);
                const cached = this.translationCache.get(cacheKey);
                if (cached) {
                    results[index] = {
                        original: req.text,
                        translation: cached,
                        context: req.context,
                    };
                }
                else {
                    uncachedRequests.push(req);
                    uncachedIndices.push(index);
                }
            });
            // If all were cached, return immediately
            if (uncachedRequests.length === 0) {
                return results;
            }
            // Translate uncached items
            const translator = await this.getTranslator(sourceLanguage, targetLanguage);
            // Combine all texts with markers for splitting later
            const combinedText = uncachedRequests
                .map((req, i) => `[${i}] ${req.context ? req.context + ': ' : ''}${req.text}`)
                .join('\n');
            const combinedTranslation = await translator.translate(combinedText);
            // Split translations back
            const translations = this.splitBatchTranslation(combinedTranslation, uncachedRequests.length);
            // Fill in results and cache
            uncachedIndices.forEach((originalIndex, i) => {
                const translation = translations[i] || uncachedRequests[i].text;
                const cacheKey = this.getCacheKey(uncachedRequests[i].text, sourceLanguage, targetLanguage);
                this.cacheTranslation(cacheKey, translation);
                results[originalIndex] = {
                    original: uncachedRequests[i].text,
                    translation,
                    context: uncachedRequests[i].context,
                };
            });
            return results;
        }
        catch (error) {
            if (this.isAIError(error)) {
                throw error;
            }
            throw this.createError('processing_failed', `Batch translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Check if Translator API is available for a language pair
     */
    async isAvailable(sourceLanguage, targetLanguage) {
        try {
            // Check for global Translator API
            if (typeof Translator === 'undefined') {
                return false;
            }
            const availability = await Translator.availability({
                sourceLanguage,
                targetLanguage,
            });
            return availability === 'readily' || availability === 'after-download';
        }
        catch {
            return false;
        }
    }
    /**
     * Get download progress for a language pair
     */
    async createWithProgress(sourceLanguage, targetLanguage, onProgress) {
        if (typeof Translator === 'undefined') {
            throw this.createError('api_unavailable', 'Translator API not available');
        }
        return await Translator.create({
            sourceLanguage,
            targetLanguage,
            monitor(m) {
                m.addEventListener('downloadprogress', (e) => {
                    onProgress(e.loaded || 0, e.total || 1);
                });
            },
        });
    }
    /**
     * Clear translation cache
     */
    clearCache() {
        this.translationCache.clear();
    }
    /**
     * Get or create translator session for language pair
     */
    async getTranslator(sourceLanguage, targetLanguage) {
        const sessionKey = `${sourceLanguage}-${targetLanguage}`;
        let translator = this.activeSessions.get(sessionKey);
        if (!translator) {
            // Use global Translator.create()
            translator = await Translator.create({
                sourceLanguage,
                targetLanguage,
            });
            this.activeSessions.set(sessionKey, translator);
        }
        return translator;
    }
    /**
     * Split batch translation back into individual translations
     */
    splitBatchTranslation(combined, count) {
        const translations = [];
        // Try to split by markers [0], [1], etc.
        for (let i = 0; i < count; i++) {
            const pattern = new RegExp(`\\[${i}\\]\\s*([^\\[]*?)(?=\\[${i + 1}\\]|$)`, 's');
            const match = combined.match(pattern);
            if (match && match[1]) {
                translations.push(match[1].trim());
            }
            else {
                // Fallback: split by newlines
                const lines = combined.split('\n').filter(l => l.trim());
                if (lines[i]) {
                    translations.push(lines[i].replace(/^\[\d+\]\s*/, '').trim());
                }
            }
        }
        return translations;
    }
    /**
     * Generate cache key for translation
     */
    getCacheKey(text, source, target) {
        return `${source}:${target}:${text.substring(0, 100)}`;
    }
    /**
     * Cache translation with size limit
     */
    cacheTranslation(key, translation) {
        // Implement LRU-like behavior
        if (this.translationCache.size >= this.maxCacheSize) {
            const firstKey = this.translationCache.keys().next().value;
            if (firstKey) {
                this.translationCache.delete(firstKey);
            }
        }
        this.translationCache.set(key, translation);
    }
    /**
     * Create standardized AI error
     */
    createError(type, message) {
        return {
            type,
            message,
            retryable: type === 'network' || type === 'rate_limit',
        };
    }
    /**
     * Type guard for AI errors
     */
    isAIError(error) {
        return (typeof error === 'object' &&
            error !== null &&
            'type' in error &&
            'message' in error);
    }
    /**
     * Destroy all active translator sessions
     */
    destroyAllSessions() {
        for (const [key, translator] of this.activeSessions) {
            try {
                translator.destroy();
                console.log(`🧹 Destroyed translator session: ${key}`);
            }
            catch (error) {
                console.warn(`Failed to destroy translator session ${key}:`, error);
            }
        }
        this.activeSessions.clear();
        this.translationCache.clear();
    }
    /**
     * Destroy and cleanup all resources
     */
    destroy() {
        this.destroyAllSessions();
        this.retryHandler = new RetryHandler(DEFAULT_TRANSLATION_RETRY_CONFIG);
    }
}
// ============================================================================
// Prompt API (for Vocabulary Analysis)
// ============================================================================
export class ChromeVocabularyAnalyzer {
    activeSession = null;
    systemPrompt = `You are a language learning assistant that analyzes vocabulary words.
For each word, you should:
1. Assess difficulty level (1-10, where 1 is basic and 10 is advanced)
2. Identify if it's a proper noun (name, place, brand)
3. Identify if it's a technical term
4. Generate 1-3 example sentences showing the word in different contexts

Respond in JSON format:
{
  "word": "example",
  "difficulty": 5,
  "isProperNoun": false,
  "isTechnicalTerm": false,
  "exampleSentences": ["sentence 1", "sentence 2", "sentence 3"]
}`;
    /**
     * Analyze vocabulary words for difficulty and generate examples
     */
    async analyzeVocabulary(words, context) {
        try {
            // Check if API is available
            if (!window.ai?.languageModel) {
                throw this.createError('api_unavailable', 'Prompt API not available');
            }
            const capabilities = await window.ai.languageModel.capabilities();
            if (capabilities.available !== 'readily') {
                throw this.createError('api_unavailable', 'Prompt API not ready');
            }
            // Get or create session
            const session = await this.getSession();
            // Analyze each word
            const analyses = [];
            for (const word of words) {
                try {
                    const analysis = await this.analyzeWord(session, word, context);
                    // Filter out proper nouns if detected
                    if (!analysis.isProperNoun) {
                        analyses.push(analysis);
                    }
                }
                catch (error) {
                    console.warn(`Failed to analyze word "${word}":`, error);
                    // Continue with other words
                }
            }
            return analyses;
        }
        catch (error) {
            if (this.isAIError(error)) {
                throw error;
            }
            throw this.createError('processing_failed', `Vocabulary analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Generate example sentences for a vocabulary word
     */
    async generateExamples(word, count = 3) {
        try {
            const session = await this.getSession();
            const prompt = `Generate ${count} example sentences using the word "${word}" in different contexts. 
Return only the sentences, one per line, without numbering or additional text.`;
            const response = await session.prompt(prompt);
            // Parse sentences from response
            const sentences = response
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0 && s.toLowerCase().includes(word.toLowerCase()))
                .slice(0, count);
            return sentences;
        }
        catch (error) {
            if (this.isAIError(error)) {
                throw error;
            }
            throw this.createError('processing_failed', `Example generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Check if Prompt API is available
     */
    async isAvailable() {
        try {
            if (!window.ai?.languageModel) {
                return false;
            }
            const capabilities = await window.ai.languageModel.capabilities();
            return capabilities.available === 'readily';
        }
        catch {
            return false;
        }
    }
    /**
     * Clean up active session
     */
    destroy() {
        if (this.activeSession) {
            try {
                this.activeSession.destroy();
            }
            catch {
                // Ignore cleanup errors
            }
            this.activeSession = null;
        }
    }
    /**
     * Get or create prompt session
     */
    async getSession() {
        if (!this.activeSession) {
            this.activeSession = await window.ai.languageModel.create({
                systemPrompt: this.systemPrompt,
            });
        }
        return this.activeSession;
    }
    /**
     * Analyze a single word
     */
    async analyzeWord(session, word, context) {
        const prompt = `Analyze the word "${word}" in this context:
"${context.substring(0, 500)}"

Provide analysis in JSON format.`;
        const response = await session.prompt(prompt);
        try {
            // Try to parse JSON response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                return {
                    word: analysis.word || word,
                    difficulty: this.validateDifficulty(analysis.difficulty),
                    isProperNoun: Boolean(analysis.isProperNoun),
                    isTechnicalTerm: Boolean(analysis.isTechnicalTerm),
                    exampleSentences: Array.isArray(analysis.exampleSentences)
                        ? analysis.exampleSentences.slice(0, 3)
                        : [],
                };
            }
        }
        catch (parseError) {
            console.warn('Failed to parse vocabulary analysis JSON:', parseError);
        }
        // Fallback: create basic analysis
        return {
            word,
            difficulty: this.estimateDifficulty(word),
            isProperNoun: this.isLikelyProperNoun(word),
            isTechnicalTerm: false,
            exampleSentences: [],
        };
    }
    /**
     * Validate and normalize difficulty level
     */
    validateDifficulty(difficulty) {
        const num = Number(difficulty);
        if (isNaN(num) || num < 1 || num > 10) {
            return 5; // Default to medium difficulty
        }
        return Math.round(num);
    }
    /**
     * Estimate difficulty based on word length and complexity
     */
    estimateDifficulty(word) {
        const length = word.length;
        if (length <= 4)
            return 2;
        if (length <= 6)
            return 4;
        if (length <= 8)
            return 6;
        if (length <= 10)
            return 7;
        return 8;
    }
    /**
     * Check if word is likely a proper noun
     */
    isLikelyProperNoun(word) {
        // Check if first letter is uppercase and rest are lowercase
        if (word.length === 0)
            return false;
        const firstChar = word[0];
        const restChars = word.slice(1);
        return (firstChar === firstChar.toUpperCase() &&
            restChars === restChars.toLowerCase() &&
            word.length > 1);
    }
    /**
     * Create standardized AI error
     */
    createError(type, message) {
        return {
            type,
            message,
            retryable: type === 'network' || type === 'rate_limit',
        };
    }
    /**
     * Type guard for AI errors
     */
    isAIError(error) {
        return (typeof error === 'object' &&
            error !== null &&
            'type' in error &&
            'message' in error);
    }
}
// ============================================================================
// Chrome AI Manager (Unified Interface)
// ============================================================================
export class ChromeAIManager {
    languageDetector;
    summarizer;
    rewriter;
    translator;
    vocabularyAnalyzer;
    constructor() {
        this.languageDetector = new ChromeLanguageDetector();
        this.summarizer = new ChromeSummarizer();
        this.rewriter = new ChromeRewriter();
        this.translator = new ChromeTranslator();
        this.vocabularyAnalyzer = new ChromeVocabularyAnalyzer();
    }
    /**
     * Detect language of text
     */
    async detectLanguage(text) {
        return await this.languageDetector.detectLanguage(text);
    }
    /**
     * Summarize content
     */
    async summarizeContent(text, options = {}) {
        return await this.summarizer.summarizeContent(text, options);
    }
    /**
     * Rewrite content based on difficulty level
     */
    async rewriteContent(text, difficulty) {
        return await this.rewriter.rewriteContent(text, difficulty);
    }
    /**
     * Translate text
     */
    async translateText(text, from, to) {
        return await this.translator.translateText(text, from, to);
    }
    /**
     * Analyze vocabulary words
     */
    async analyzeVocabulary(words, context) {
        return await this.vocabularyAnalyzer.analyzeVocabulary(words, context);
    }
    /**
     * Batch translate vocabulary items
     */
    async batchTranslateVocabulary(words, sourceLanguage, targetLanguage, context) {
        const requests = words.map(word => ({
            text: word,
            context,
        }));
        return await this.translator.batchTranslate(requests, sourceLanguage, targetLanguage);
    }
    /**
     * Subdivide article into parts
     */
    async subdivideArticle(content) {
        return await this.summarizer.subdivideArticle(content);
    }
    /**
     * Generate example sentences for vocabulary
     */
    async generateExamples(word, count = 3) {
        return await this.vocabularyAnalyzer.generateExamples(word, count);
    }
    /**
     * Check if all Chrome AI services are available
     */
    async checkAvailability() {
        const [languageDetector, summarizer, rewriter, translator, vocabularyAnalyzer,] = await Promise.all([
            this.languageDetector.isAvailable(),
            this.summarizer.isAvailable(),
            this.rewriter.isAvailable(),
            this.translator.isAvailable('en', 'es'), // Test with common pair
            this.vocabularyAnalyzer.isAvailable(),
        ]);
        return {
            languageDetector,
            summarizer,
            rewriter,
            translator,
            vocabularyAnalyzer,
            allAvailable: languageDetector &&
                summarizer &&
                rewriter &&
                translator &&
                vocabularyAnalyzer,
        };
    }
    /**
     * Check if specific translator language pair is available
     */
    async isTranslatorAvailable(sourceLanguage, targetLanguage) {
        return await this.translator.isAvailable(sourceLanguage, targetLanguage);
    }
    /**
     * Clear all caches
     */
    clearCaches() {
        this.languageDetector.clearCache();
        this.translator.clearCache();
    }
    /**
     * Clean up all active sessions
     */
    destroy() {
        console.log('🧹 Destroying all Chrome AI sessions...');
        this.languageDetector.destroy();
        this.summarizer.destroy();
        this.rewriter.destroy();
        this.translator.destroy();
        this.vocabularyAnalyzer.destroy();
        console.log('✅ All Chrome AI sessions destroyed');
    }
}
/**
 * Create a singleton instance of ChromeAIManager
 */
let chromeAIInstance = null;
export function getChromeAI() {
    if (!chromeAIInstance) {
        chromeAIInstance = new ChromeAIManager();
    }
    return chromeAIInstance;
}
/**
 * Reset the singleton instance (useful for testing)
 */
export function resetChromeAI() {
    if (chromeAIInstance) {
        chromeAIInstance.destroy();
        chromeAIInstance = null;
    }
}
//# sourceMappingURL=chrome-ai.js.map