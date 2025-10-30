/**
 * Article Processor - Converts ExtractedContent to ProcessedArticle
 * Handles language detection, content splitting, and structure creation
 */

import type { ExtractedContent, ProcessedArticle, ArticlePart } from '../types';

/**
 * Process extracted content into a structured article
 */
export async function processArticle(
  extracted: ExtractedContent
): Promise<ProcessedArticle> {
  // Generate unique ID
  const articleId = generateArticleId();

  // Detect language (use provided or detect from content)
  const language = await detectLanguage(extracted);

  // Split content into parts for better UX
  const parts = splitContentIntoParts(extracted.content, articleId);

  // Create ProcessedArticle
  const processedArticle: ProcessedArticle = {
    id: articleId,
    url: extracted.url,
    title: extracted.title,
    originalLanguage: language,
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
 */
async function detectLanguage(extracted: ExtractedContent): Promise<string> {
  // If language is already provided, use it
  if (extracted.language) {
    return extracted.language;
  }

  try {
    // Try to detect language using Chrome AI or Gemini API
    const textSample = extracted.content.substring(0, 1000); // First 1000 chars

    const response = await chrome.runtime.sendMessage({
      type: 'DETECT_LANGUAGE',
      data: { text: textSample },
    });

    if (response?.success && response.data) {
      return response.data;
    }
  } catch (error) {
    console.warn('Language detection failed, using fallback:', error);
  }

  // Fallback: Try to detect from common patterns
  return detectLanguageFallback(extracted.content);
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
