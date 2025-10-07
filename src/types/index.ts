/**
 * Core data types for the Language Learning Chrome Extension
 */

export interface UserSettings {
  nativeLanguage: string;
  learningLanguage: string;
  difficultyLevel: number; // 1-10
  autoHighlight: boolean;
  darkMode: boolean;
  fontSize: number;
  apiKeys: {
    gemini?: string;
    jinaReader?: string;
  };
}

export interface ExtractedContent {
  title: string;
  content: string;
  url: string;
  language?: string;
  wordCount: number;
  paragraphCount: number;
}

export interface ProcessedArticle {
  id: string;
  url: string;
  title: string;
  originalLanguage: string;
  processedAt: Date;
  parts: ArticlePart[];
  processingStatus: 'processing' | 'completed' | 'failed';
  cacheExpires: Date;
}

export interface ArticlePart {
  id: string;
  content: string;
  originalContent: string;
  vocabulary: string[];
  sentences: string[];
  partIndex: number;
}

export interface VocabularyItem {
  id: string;
  word: string;
  phrase?: string;
  translation: string;
  context: string;
  exampleSentences: string[];
  articleId: string;
  partId: string;
  createdAt: Date;
  lastReviewed: Date;
  reviewCount: number;
  difficulty: number;
}

export interface SentenceItem {
  id: string;
  content: string;
  translation: string;
  articleId: string;
  partId: string;
  createdAt: Date;
}
