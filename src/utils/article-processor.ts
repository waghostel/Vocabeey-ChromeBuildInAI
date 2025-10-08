/**
 * Article processing pipeline using Chrome AI
 * Coordinates content extraction and AI processing
 */

import { getChromeAI } from './chrome-ai';
import { ContentExtractionCoordinator } from './content-extraction';

import type { ProcessedArticle, ArticlePart, UserSettings } from '../types';

export class ArticleProcessor {
  private chromeAI = getChromeAI();
  private contentExtractor: ContentExtractionCoordinator;

  constructor(jinaApiKey?: string) {
    this.contentExtractor = new ContentExtractionCoordinator(jinaApiKey);
  }

  /**
   * Process article from document to structured learning content
   */
  async processArticle(
    document: Document,
    settings: UserSettings
  ): Promise<ProcessedArticle> {
    try {
      // Step 1: Extract content
      const extracted = await this.contentExtractor.extractContent(document);

      // Step 2: Detect language
      const language = await this.chromeAI.detectLanguage(extracted.content);

      // Step 3: Summarize and clean content
      const summarized = await this.chromeAI.summarizeContent(
        extracted.content,
        {
          maxLength: 300,
          format: 'paragraph',
        }
      );

      // Step 4: Subdivide into parts
      const contentParts = await this.chromeAI.subdivideArticle(summarized);

      // Step 5: Adapt difficulty for each part
      const adaptedParts = await Promise.all(
        contentParts.map(part =>
          this.chromeAI.rewriteContent(part, settings.difficultyLevel)
        )
      );

      // Step 6: Create article parts
      const parts: ArticlePart[] = adaptedParts.map((content, index) => ({
        id: `${Date.now()}-${index}`,
        content,
        originalContent: contentParts[index],
        vocabulary: [],
        sentences: [],
        partIndex: index,
      }));

      // Create processed article
      const article: ProcessedArticle = {
        id: `article-${Date.now()}`,
        url: extracted.url,
        title: extracted.title,
        originalLanguage: language,
        processedAt: new Date(),
        parts,
        processingStatus: 'completed',
        cacheExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };

      return article;
    } catch (error) {
      throw new Error(
        `Article processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process vocabulary for an article part
   */
  async processVocabulary(
    words: string[],
    context: string,
    sourceLanguage: string,
    targetLanguage: string
  ) {
    try {
      // Translate vocabulary in batch
      const translations = await this.chromeAI.batchTranslateVocabulary(
        words,
        sourceLanguage,
        targetLanguage,
        context
      );

      // Analyze vocabulary
      const analyses = await this.chromeAI.analyzeVocabulary(words, context);

      // Combine results
      return translations.map(translation => {
        const analysis = analyses.find(a => a.word === translation.original);

        return {
          word: translation.original,
          translation: translation.translation,
          context: translation.context || context,
          difficulty: analysis?.difficulty || 5,
          isTechnicalTerm: analysis?.isTechnicalTerm || false,
          exampleSentences: analysis?.exampleSentences || [],
        };
      });
    } catch (error) {
      throw new Error(
        `Vocabulary processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Translate a sentence
   */
  async translateSentence(
    sentence: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> {
    return await this.chromeAI.translateText(
      sentence,
      sourceLanguage,
      targetLanguage
    );
  }

  /**
   * Check if Chrome AI is available
   */
  async checkAvailability() {
    return await this.chromeAI.checkAvailability();
  }

  /**
   * Update Jina API key
   */
  updateJinaApiKey(apiKey: string): void {
    this.contentExtractor.updateJinaApiKey(apiKey);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.chromeAI.destroy();
  }
}
