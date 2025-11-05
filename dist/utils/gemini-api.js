/**
 * Gemini API client for fallback AI processing
 * Provides language detection, summarization, rewriting, translation, and vocabulary analysis
 */
// ============================================================================
// Rate Limiter
// ============================================================================
class RateLimiter {
    requests = [];
    maxRequests;
    windowMs;
    constructor(maxRequests = 60, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }
    async waitForSlot() {
        const now = Date.now();
        // Remove old requests outside the window
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        // If at capacity, wait
        if (this.requests.length >= this.maxRequests) {
            const oldestRequest = this.requests[0];
            const waitTime = this.windowMs - (now - oldestRequest);
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return this.waitForSlot(); // Recursive check
            }
        }
        // Record this request
        this.requests.push(now);
    }
    reset() {
        this.requests = [];
    }
}
// ============================================================================
// Gemini API Client
// ============================================================================
export class GeminiAPIClient {
    config;
    rateLimiter;
    defaultModel = 'gemini-2.0-flash-exp';
    baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    constructor(config) {
        this.config = {
            ...config,
            model: config.model || this.defaultModel,
            baseUrl: config.baseUrl || this.baseUrl,
        };
        this.rateLimiter = new RateLimiter(60, 60000); // 60 requests per minute
    }
    /**
     * Update API key
     */
    setApiKey(apiKey) {
        this.config.apiKey = apiKey;
    }
    /**
     * Check if API key is configured
     */
    isConfigured() {
        return !!this.config.apiKey && this.config.apiKey.length > 0;
    }
    /**
     * Detect language of text
     * Returns language code with medium confidence (0.5) since Gemini doesn't provide confidence scores
     */
    async detectLanguage(text) {
        try {
            await this.rateLimiter.waitForSlot();
            const prompt = `Detect the language of the following text and return ONLY the ISO 639-1 language code (e.g., "en", "es", "fr", "de", "ja", "zh").

Text: ${text.substring(0, 500)}`;
            const response = await this.generateContent(prompt, {
                temperature: 0.1,
                maxOutputTokens: 10,
            });
            const languageCode = response.trim().toLowerCase();
            // Validate it's a reasonable language code
            if (languageCode.length !== 2 || !/^[a-z]{2}$/.test(languageCode)) {
                throw this.createError('processing_failed', 'Invalid language code returned');
            }
            // Gemini doesn't provide confidence scores, so we return medium confidence
            return {
                language: languageCode,
                confidence: 0.5,
            };
        }
        catch (error) {
            if (this.isAIError(error)) {
                throw error;
            }
            throw this.createError('processing_failed', `Language detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Summarize content
     */
    async summarizeContent(text, options = {}) {
        try {
            await this.rateLimiter.waitForSlot();
            const maxLength = options.maxLength || 300;
            const format = options.format || 'paragraph';
            const prompt = `Summarize the following text in approximately ${maxLength} words. ${format === 'bullet' ? 'Use bullet points.' : 'Use paragraph format.'}

Remove any advertisements, navigation elements, or irrelevant content. Focus only on the main article content.

Text:
${text}`;
            const response = await this.generateContent(prompt, {
                temperature: 0.3,
                maxOutputTokens: Math.ceil(maxLength * 1.5),
            });
            return response.trim();
        }
        catch (error) {
            if (this.isAIError(error)) {
                throw error;
            }
            throw this.createError('processing_failed', `Summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Rewrite content based on difficulty level
     */
    async rewriteContent(text, difficulty) {
        try {
            if (difficulty < 1 || difficulty > 10) {
                throw this.createError('invalid_input', 'Difficulty must be between 1 and 10');
            }
            await this.rateLimiter.waitForSlot();
            const difficultyDescription = this.getDifficultyDescription(difficulty);
            const prompt = `Rewrite the following text to match a ${difficultyDescription} language proficiency level (difficulty ${difficulty}/10).

Guidelines:
- Maintain all factual information and meaning
- Adjust vocabulary complexity appropriately
- Keep the same structure and length
- Do not add or remove information

Text:
${text}`;
            const response = await this.generateContent(prompt, {
                temperature: 0.5,
                maxOutputTokens: Math.ceil(text.length * 1.5),
            });
            return response.trim();
        }
        catch (error) {
            if (this.isAIError(error)) {
                throw error;
            }
            throw this.createError('processing_failed', `Rewriting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Translate text from source to target language
     */
    async translateText(text, from, to) {
        try {
            // Check if source and target languages are the same
            if (from === to) {
                console.log(`[GeminiAPI] Same language detected (${from} -> ${to}), returning original text`);
                return text;
            }
            await this.rateLimiter.waitForSlot();
            const prompt = `Translate the following text from ${from} to ${to}. Provide ONLY the translation, no explanations.

Text: ${text}`;
            const response = await this.generateContent(prompt, {
                temperature: 0.3,
                maxOutputTokens: Math.ceil(text.length * 2),
            });
            return response.trim();
        }
        catch (error) {
            if (this.isAIError(error)) {
                throw error;
            }
            throw this.createError('processing_failed', `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Analyze vocabulary words
     */
    async analyzeVocabulary(words, context) {
        try {
            await this.rateLimiter.waitForSlot();
            const schema = {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        word: { type: 'string' },
                        difficulty: { type: 'number' },
                        isProperNoun: { type: 'boolean' },
                        isTechnicalTerm: { type: 'boolean' },
                        exampleSentences: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                    },
                    required: [
                        'word',
                        'difficulty',
                        'isProperNoun',
                        'isTechnicalTerm',
                        'exampleSentences',
                    ],
                },
            };
            const prompt = `Analyze the following vocabulary words in the given context. For each word:
1. Assess difficulty level (1-10, where 1 is basic and 10 is advanced)
2. Identify if it's a proper noun (name, place, brand)
3. Identify if it's a technical term
4. Generate 1-3 example sentences showing the word in different contexts

Context: ${context}

Words: ${words.join(', ')}`;
            const response = await this.generateContent(prompt, {
                temperature: 0.7,
                maxOutputTokens: 2000,
                responseMimeType: 'application/json',
                responseSchema: schema,
            });
            const analyses = JSON.parse(response);
            // Filter out proper nouns
            return analyses.filter(a => !a.isProperNoun);
        }
        catch (error) {
            if (this.isAIError(error)) {
                throw error;
            }
            throw this.createError('processing_failed', `Vocabulary analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Check if Gemini API is available
     */
    async isAvailable() {
        if (!this.isConfigured()) {
            return false;
        }
        try {
            // Make a simple test request
            await this.generateContent('Test', {
                temperature: 0,
                maxOutputTokens: 5,
            });
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Generate content using Gemini API
     */
    async generateContent(prompt, config) {
        if (!this.isConfigured()) {
            throw this.createError('api_unavailable', 'Gemini API key not configured');
        }
        const request = {
            contents: [
                {
                    parts: [{ text: prompt }],
                    role: 'user',
                },
            ],
            generationConfig: {
                temperature: config?.temperature ?? 0.7,
                maxOutputTokens: config?.maxOutputTokens ?? 1024,
                responseMimeType: config?.responseMimeType,
                responseSchema: config?.responseSchema,
            },
        };
        const url = `${this.config.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });
            if (!response.ok) {
                const errorData = (await response.json());
                throw this.handleAPIError(errorData, response.status);
            }
            const data = (await response.json());
            if (!data.candidates || data.candidates.length === 0) {
                throw this.createError('processing_failed', 'No response from Gemini API');
            }
            const candidate = data.candidates[0];
            if (!candidate.content ||
                !candidate.content.parts ||
                candidate.content.parts.length === 0) {
                throw this.createError('processing_failed', 'Empty response from Gemini API');
            }
            return candidate.content.parts[0].text;
        }
        catch (error) {
            if (this.isAIError(error)) {
                throw error;
            }
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw this.createError('network', 'Network error connecting to Gemini API');
            }
            throw this.createError('processing_failed', `Gemini API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Handle API error responses
     */
    handleAPIError(errorData, status) {
        const { code, message } = errorData.error;
        // Rate limiting
        if (code === 429 || status === 429) {
            return this.createError('rate_limit', 'Gemini API rate limit exceeded');
        }
        // Invalid API key
        if (code === 401 || code === 403 || status === 401 || status === 403) {
            return this.createError('api_unavailable', 'Invalid Gemini API key');
        }
        // Service unavailable
        if (code === 503 || status === 503) {
            return this.createError('api_unavailable', 'Gemini API temporarily unavailable');
        }
        // Generic error
        return this.createError('processing_failed', `Gemini API error: ${message}`);
    }
    /**
     * Get difficulty description for prompts
     */
    getDifficultyDescription(difficulty) {
        if (difficulty <= 2)
            return 'beginner (A1)';
        if (difficulty <= 4)
            return 'elementary (A2)';
        if (difficulty <= 6)
            return 'intermediate (B1-B2)';
        if (difficulty <= 8)
            return 'advanced (C1)';
        return 'proficient (C2)';
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
//# sourceMappingURL=gemini-api.js.map