/**
 * Article Processor - Converts ExtractedContent to ProcessedArticle
 * Handles language detection, content splitting, and structure creation
 */

import type { ExtractedContent, ProcessedArticle, ArticlePart } from '../types';

/**
 * Process extracted content into a structured article
 *
 * @param extracted - The extracted content
 * @param languageDetectionHandler - Optional handler for language detection (for service worker context)
 */
export async function processArticle(
  extracted: ExtractedContent,
  languageDetectionHandler?: (payload: {
    text: string;
  }) => Promise<{ language: string; confidence: number }>
): Promise<ProcessedArticle> {
  // Generate unique ID
  const articleId = generateArticleId();

  // Detect language (use provided or detect from content)
  const detectionResult = await detectLanguage(
    extracted,
    languageDetectionHandler
  );

  // Split content into parts for better UX
  const parts = splitContentIntoParts(extracted.content, articleId);

  // Create ProcessedArticle
  const processedArticle: ProcessedArticle = {
    id: articleId,
    url: extracted.url,
    title: extracted.title,
    originalLanguage: detectionResult.language,
    detectedLanguageConfidence: detectionResult.confidence,
    processedAt: new Date(),
    parts,
    processingStatus: 'completed',
    cacheExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };

  return processedArticle;
}

/**
 * Generate unique article ID
 */
function generateArticleId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `article_${timestamp}_${random}`;
}

/**
 * Detect language from extracted content
 * Returns both language code and confidence score
 *
 * @param extracted - The extracted content
 * @param languageDetectionHandler - Optional handler for direct calls (service worker context)
 */
async function detectLanguage(
  extracted: ExtractedContent,
  languageDetectionHandler?: (payload: {
    text: string;
  }) => Promise<{ language: string; confidence: number }>
): Promise<{ language: string; confidence: number }> {
  // If language is already provided, use it with high confidence
  if (extracted.language) {
    console.log(
      `🌍 Language provided by user: ${extracted.language.toUpperCase()} (100% confidence)`
    );
    return {
      language: extracted.language,
      confidence: 1.0, // User-provided language has full confidence
    };
  }

  console.log('🔍 Detecting article language...');
  console.log('📊 Content stats:', {
    totalLength: extracted.content.length,
    wordCount: extracted.wordCount,
    paragraphCount: extracted.paragraphCount,
  });

  try {
    // Try to detect language using Chrome AI or Gemini API
    const textSample = extracted.content.substring(0, 1000); // First 1000 chars
    console.log(`📝 Analyzing first ${textSample.length} characters...`);
    console.log('📄 Text sample being analyzed:', {
      preview: textSample.substring(0, 200) + '...',
      fullLength: textSample.length,
    });

    // If handler is provided (service worker context), use it directly
    if (languageDetectionHandler) {
      console.log(
        '🔧 Using provided language detection handler (service worker context)...'
      );
      const result = await languageDetectionHandler({ text: textSample });
      console.log('✅ Language detected:', result);
      return result;
    }

    // Otherwise, use message passing (content script context)
    console.log('📤 Sending DETECT_LANGUAGE message to service worker...');
    const response = await chrome.runtime.sendMessage({
      type: 'DETECT_LANGUAGE',
      data: { text: textSample },
    });

    console.log('📥 Received response from service worker:', response);

    if (response?.success && response.data) {
      const result = {
        language: response.data.language || response.data,
        confidence: response.data.confidence || 0.5,
      };
      console.log(
        `✅ Language detected: ${result.language.toUpperCase()} (${(result.confidence * 100).toFixed(2)}% confidence)`
      );
      return result;
    } else {
      console.warn('⚠️ Invalid response from service worker:', response);
    }
  } catch (error) {
    console.error('❌ Language detection failed with error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  // Fallback: Try to detect from common patterns (low confidence)
  console.log('🔄 Using heuristic fallback detection...');
  const fallbackLanguage = detectLanguageFallback(extracted.content);
  console.log(
    `⚠️ Fallback detected: ${fallbackLanguage.toUpperCase()} (30% confidence - heuristic)`
  );
  return {
    language: fallbackLanguage,
    confidence: 0.3, // Low confidence for heuristic detection
  };
}

/**
 * Fallback language detection using simple heuristics
 */
function detectLanguageFallback(content: string): string {
  const sample = content.substring(0, 500).toLowerCase();

  // Common word patterns for different languages
  const patterns = {
    en: /\b(the|and|is|in|to|of|a|for|on|with)\b/g,
    es: /\b(el|la|de|que|y|en|un|por|con|para)\b/g,
    fr: /\b(le|la|de|et|un|une|dans|pour|avec|sur)\b/g,
    de: /\b(der|die|das|und|in|zu|den|von|mit|für)\b/g,
    it: /\b(il|la|di|e|un|una|in|per|con|da)\b/g,
    pt: /\b(o|a|de|que|e|do|da|em|um|para)\b/g,
  };

  let maxMatches = 0;
  let detectedLang = 'en';

  for (const [lang, pattern] of Object.entries(patterns)) {
    const matches = sample.match(pattern);
    const count = matches ? matches.length : 0;

    if (count > maxMatches) {
      maxMatches = count;
      detectedLang = lang;
    }
  }

  return detectedLang;
}

/**
 * Split content into manageable parts
 */
function splitContentIntoParts(
  content: string,
  articleId: string
): ArticlePart[] {
  const MAX_WORDS_PER_PART = 500;
  const parts: ArticlePart[] = [];

  // Split by paragraphs first
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());

  if (paragraphs.length === 0) {
    // No paragraphs found, treat entire content as one part
    return [createArticlePart(content, content, articleId, 0)];
  }

  let currentPart = '';
  let currentWordCount = 0;
  let partIndex = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = countWords(paragraph);

    // If adding this paragraph exceeds limit and we have content, create a part
    if (
      currentWordCount + paragraphWords > MAX_WORDS_PER_PART &&
      currentPart.length > 0
    ) {
      parts.push(
        createArticlePart(
          currentPart.trim(),
          currentPart.trim(),
          articleId,
          partIndex
        )
      );
      partIndex++;
      currentPart = '';
      currentWordCount = 0;
    }

    // Add paragraph to current part
    currentPart += (currentPart ? '\n\n' : '') + paragraph;
    currentWordCount += paragraphWords;
  }

  // Add remaining content as final part
  if (currentPart.trim()) {
    parts.push(
      createArticlePart(
        currentPart.trim(),
        currentPart.trim(),
        articleId,
        partIndex
      )
    );
  }

  // If no parts were created, create one with all content
  if (parts.length === 0) {
    parts.push(createArticlePart(content, content, articleId, 0));
  }

  return parts;
}

/**
 * Create an article part
 */
function createArticlePart(
  content: string,
  originalContent: string,
  articleId: string,
  partIndex: number
): ArticlePart {
  const partId = `${articleId}_part_${partIndex + 1}`;

  return {
    id: partId,
    content,
    originalContent,
    vocabulary: [],
    sentences: [],
    partIndex,
  };
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;
}

/**
 * Validate processed article
 */
export function validateProcessedArticle(article: ProcessedArticle): boolean {
  if (!article.id || !article.url || !article.title) {
    return false;
  }

  if (!article.parts || article.parts.length === 0) {
    return false;
  }

  if (!article.originalLanguage) {
    return false;
  }

  // Validate each part
  for (const part of article.parts) {
    if (!part.id || !part.content) {
      return false;
    }
  }

  return true;
}
