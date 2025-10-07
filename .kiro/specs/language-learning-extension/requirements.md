# Requirements Document

## Introduction

The Language Learning Chrome Extension transforms web articles into interactive language learning experiences using Chrome's built-in AI APIs. Users can read articles in a clean, card-based interface while highlighting vocabulary and sentences for learning. The extension processes content locally using Chrome's AI capabilities, with optional Gemini API fallback for extended language support.

## Requirements

### Requirement 1: Content Extraction and Processing

**User Story:** As a language learner, I want to convert any web article into a clean, structured reading format, so that I can focus on learning without distractions from ads and navigation elements.

#### Acceptance Criteria

1. WHEN a user clicks the extension icon on any webpage THEN the system SHALL extract the main article content using Readability.js as the primary method
2. IF Readability.js fails THEN the system SHALL attempt content extraction using Jina Reader API (if configured)
3. IF both primary methods fail THEN the system SHALL use basic DOM parsing as a final fallback
4. WHEN content is extracted THEN the system SHALL detect the article language using Chrome's Language Detector API
5. WHEN processing long articles THEN the system SHALL use hierarchical summarization to create manageable content chunks
6. WHEN content is processed THEN the system SHALL subdivide articles into parts of 1-3 paragraphs each
7. WHEN content processing is complete THEN the system SHALL display the article in a new tab with a card-based layout

### Requirement 2: AI-Powered Article Enhancement

**User Story:** As a language learner, I want articles to be automatically adapted to my learning level, so that I can understand content appropriate to my proficiency.

#### Acceptance Criteria

1. WHEN processing article content THEN the system SHALL use Chrome's Summarizer API to clean and structure the text
2. WHEN user has set a difficulty level THEN the system SHALL use Chrome's Rewriter API to adjust vocabulary complexity accordingly
3. WHEN rewriting content THEN the system SHALL maintain factual accuracy while adapting language complexity
4. WHEN processing content THEN the system SHALL ignore advertisements, comments, and navigation elements
5. IF Chrome built-in AI is unavailable THEN the system SHALL fallback to Gemini API (if configured)
6. WHEN AI processing fails after 3 retries THEN the system SHALL display an error message and show original content

### Requirement 3: Interactive Vocabulary Learning

**User Story:** As a language learner, I want to highlight unfamiliar words and phrases to create vocabulary cards with translations and examples, so that I can learn new vocabulary in context.

#### Acceptance Criteria

1. WHEN a user highlights text in vocabulary mode THEN the system SHALL create a vocabulary card below the article part
2. WHEN creating vocabulary cards THEN the system SHALL use Chrome's Translator API to provide context-aware translations
3. WHEN a user double-clicks a vocabulary card THEN the system SHALL display 1-3 example sentences using Chrome's Prompt API
4. WHEN a user hovers over highlighted vocabulary THEN the system SHALL show a translation popup
5. WHEN a user clicks on vocabulary text THEN the system SHALL use Web Speech API for pronunciation
6. WHEN processing vocabulary THEN the system SHALL group related words (run/running/ran) as the same vocabulary item
7. WHEN highlighting overlapping text THEN the system SHALL merge highlights into phrases or longer sentences
8. WHEN processing vocabulary THEN the system SHALL ignore proper nouns (names, places, brands)
9. WHEN vocabulary cards are displayed THEN they SHALL auto-collapse after 1 second unless interacted with

### Requirement 4: Sentence Learning and Translation

**User Story:** As a language learner, I want to highlight interesting sentences to save them with translations, so that I can study sentence structures and expressions.

#### Acceptance Criteria

1. WHEN a user highlights text in sentence mode THEN the system SHALL create a sentence card with translation
2. WHEN creating sentence cards THEN the system SHALL use Chrome's Translator API for accurate translation
3. WHEN a user double-clicks a sentence card THEN the system SHALL show detailed translation information
4. WHEN a user clicks on sentence text THEN the system SHALL use Web Speech API for pronunciation
5. WHEN sentence cards are displayed THEN they SHALL auto-collapse after 1 second unless interacted with

### Requirement 5: Learning Mode Interfaces

**User Story:** As a language learner, I want dedicated modes for reviewing vocabulary and sentences, so that I can practice what I've learned separately from reading.

#### Acceptance Criteria

1. WHEN a user switches to vocabulary learning mode THEN the system SHALL display all vocabulary cards in a grid layout
2. WHEN in vocabulary mode THEN the system SHALL provide display options: Language A+B, Language A only, Language B only
3. WHEN "Language A only" is selected THEN Language B SHALL appear on 0.5-second hover
4. WHEN a user switches to sentence learning mode THEN the system SHALL display all highlighted sentences
5. WHEN in any learning mode THEN the system SHALL support TTS pronunciation for all content
6. WHEN a user double-clicks cards in learning modes THEN the system SHALL show example sentences or detailed translations

### Requirement 6: Navigation and User Interface

**User Story:** As a language learner, I want intuitive navigation between article parts and learning modes, so that I can efficiently move through content and switch between reading and learning activities.

#### Acceptance Criteria

1. WHEN viewing article parts THEN the system SHALL provide left/right arrow navigation
2. WHEN navigating THEN the system SHALL support keyboard shortcuts (←/→ for parts, v for vocab mode, s for sentence mode)
3. WHEN switching between modes THEN the system SHALL use tab-based navigation (Reading/Vocabulary/Sentences)
4. WHEN processing articles THEN the system SHALL show progress indicators with streaming word-by-word generation
5. WHEN downloading AI models THEN the system SHALL display progress bar with percentage completion
6. WHEN user right-clicks on highlights THEN the system SHALL show edit/remove options

### Requirement 7: Settings and Configuration

**User Story:** As a language learner, I want to customize the extension settings for my learning preferences and API configurations, so that the tool works optimally for my needs.

#### Acceptance Criteria

1. WHEN first using the extension THEN the system SHALL display a setup wizard for language selection and difficulty level
2. WHEN in settings THEN the user SHALL be able to select native language (Language B) and learning language (Language A)
3. WHEN in settings THEN the user SHALL be able to adjust difficulty level via slider (1-10)
4. WHEN in settings THEN the user SHALL be able to toggle automatic vocabulary highlighting
5. WHEN in settings THEN the user SHALL be able to configure API keys for Gemini and Jina Reader
6. WHEN in settings THEN the user SHALL be able to customize keyboard shortcuts
7. WHEN in settings THEN the user SHALL be able to toggle dark mode and adjust font size

### Requirement 8: Data Storage and Management

**User Story:** As a language learner, I want my vocabulary, sentences, and progress to be saved locally, so that I can continue learning across browser sessions while maintaining privacy.

#### Acceptance Criteria

1. WHEN vocabulary or sentences are created THEN the system SHALL store them in chrome.storage.local
2. WHEN storing data THEN the system SHALL use a versioned schema for future compatibility
3. WHEN storage approaches limits THEN the system SHALL notify users and offer export options
4. WHEN storage is full THEN the system SHALL auto-export old data to Markdown files
5. WHEN articles are processed THEN the system SHALL cache results to avoid reprocessing
6. WHEN users request THEN the system SHALL provide import/export functionality for backup
7. WHEN storing data THEN the system SHALL maintain privacy with no external tracking or analytics

### Requirement 9: Error Handling and Reliability

**User Story:** As a language learner, I want the extension to handle errors gracefully and provide clear feedback, so that I can understand what's happening and take appropriate action.

#### Acceptance Criteria

1. WHEN AI processing fails THEN the system SHALL retry up to 3 times with exponential backoff
2. WHEN all AI services are unavailable THEN the system SHALL display clear error messages with suggested actions
3. WHEN hardware is insufficient for Chrome AI THEN the system SHALL suggest using Gemini API
4. WHEN network issues occur THEN the system SHALL use cached content when available
5. WHEN the original article tab is closed THEN the system SHALL continue if content is accessible, otherwise show error
6. WHEN browser crashes occur THEN the system SHALL notify users of failed status and suggest reloading

### Requirement 10: Performance and Hardware Compatibility

**User Story:** As a language learner, I want the extension to work efficiently on my device and provide feedback about system requirements, so that I can have a smooth learning experience.

#### Acceptance Criteria

1. WHEN extension loads THEN the system SHALL detect hardware capabilities for Chrome AI
2. WHEN Chrome AI requirements are not met THEN the system SHALL suggest Gemini API as alternative
3. WHEN processing vocabulary THEN the system SHALL batch up to 20 words per AI call for efficiency
4. WHEN processing long articles THEN the system SHALL use progressive loading to show parts incrementally
5. WHEN extension is active THEN memory usage SHALL not exceed 100MB per tab
6. WHEN extension loads THEN startup time SHALL be less than 3 seconds
7. WHEN AI models need downloading THEN the system SHALL require user activation and show progress
