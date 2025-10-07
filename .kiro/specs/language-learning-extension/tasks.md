# Implementation Plan

- [ ] 1. Set up project structure and core interfaces
  - Create Chrome Extension Manifest V3 structure with proper directories
  - Define TypeScript interfaces for all core data models (UserSettings, ProcessedArticle, VocabularyItem, SentenceItem)
  - Set up build configuration with webpack/rollup for TypeScript compilation
  - _Requirements: 8.1, 8.2_

- [ ] 2. Implement Chrome Extension foundation
- [ ] 2.1 Create manifest.json with required permissions
  - Write manifest.json with activeTab, scripting, storage, offscreen permissions
  - Configure content scripts and background service worker
  - Set up web accessible resources for learning interface
  - _Requirements: 10.1, 10.2_

- [ ] 2.2 Implement service worker background script
  - Code background.js to handle extension icon clicks
  - Implement tab management and content script injection
  - Create system capability detection for Chrome AI
  - _Requirements: 1.7, 10.1, 10.2_

- [ ] 2.3 Create content script for page interaction
  - Write content script to extract page content
  - Implement DOM interaction for article detection
  - Handle communication with service worker
  - _Requirements: 1.1, 1.2, 1.3_

- [ ]\* 2.4 Write unit tests for extension foundation
  - Create tests for manifest validation
  - Write tests for service worker functionality
  - Test content script injection and communication
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3. Implement content extraction pipeline
- [ ] 3.1 Create Readability.js integration
  - Integrate Readability.js library for primary content extraction
  - Implement content validation and sanitization
  - Handle extraction failures gracefully
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3.2 Implement Jina Reader API fallback
  - Code Jina Reader API client with authentication
  - Create fallback mechanism when Readability.js fails
  - Handle API errors and rate limiting
  - _Requirements: 1.2, 1.3, 9.4_

- [ ] 3.3 Create basic DOM parsing fallback
  - Implement basic DOM content extraction as final fallback
  - Prioritize article, main, and content-rich elements
  - Apply minimum content length filtering
  - _Requirements: 1.3, 9.1_

- [ ]\* 3.4 Write unit tests for content extraction
  - Test Readability.js extraction with various page types
  - Test fallback mechanisms and error handling
  - Validate content sanitization and filtering
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 4. Implement Chrome AI integration
- [ ] 4.1 Create Language Detector API integration
  - Implement language detection for extracted articles
  - Handle detection failures with user manual selection
  - Cache language detection results
  - _Requirements: 2.1, 2.5_

- [ ] 4.2 Implement Summarizer API for content processing
  - Code article summarization with hierarchical approach for long content
  - Create content subdivision into 1-3 paragraph parts
  - Implement noise filtering for ads and navigation
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4.3 Create Rewriter API for difficulty adaptation
  - Implement content rewriting based on user difficulty level
  - Maintain factual accuracy while adapting language complexity
  - Handle different content types (news, technical, fiction)
  - _Requirements: 2.2, 2.3, 7.3_

- [ ] 4.4 Implement Translator API for vocabulary translation
  - Create context-aware vocabulary translation
  - Implement batch processing for up to 20 words per call
  - Handle translation failures and fallbacks
  - _Requirements: 3.2, 4.2, 3.6_

- [ ] 4.5 Create Prompt API integration for vocabulary analysis
  - Implement vocabulary difficulty assessment
  - Generate example sentences for vocabulary cards
  - Filter proper nouns and identify technical terms
  - _Requirements: 3.3, 3.8, 7.4_

- [ ]\* 4.6 Write unit tests for AI integration
  - Test each Chrome AI API integration
  - Test fallback mechanisms and error handling
  - Validate batch processing and caching
  - _Requirements: 2.1, 2.2, 3.2, 4.2_

- [ ] 5. Implement Gemini API fallback system
- [ ] 5.1 Create Gemini API client
  - Implement Gemini API client with structured output
  - Handle authentication with user-provided API keys
  - Create rate limiting and error handling
  - _Requirements: 2.5, 7.5, 9.2_

- [ ] 5.2 Implement AI service coordinator
  - Create fallback chain: Chrome AI → Gemini API → Error
  - Implement service availability detection
  - Handle graceful degradation when all services fail
  - _Requirements: 2.5, 9.1, 9.2_

- [ ]\* 5.3 Write unit tests for fallback system
  - Test Gemini API integration
  - Test fallback chain functionality
  - Validate error handling and service coordination
  - _Requirements: 2.5, 9.1, 9.2_

- [ ] 6. Create storage management system
- [ ] 6.1 Implement versioned storage schema
  - Create storage schema with version tracking
  - Implement data validation for all stored objects
  - Handle storage quota monitoring and alerts
  - _Requirements: 8.1, 8.2, 8.4_

- [ ] 6.2 Create data migration system
  - Implement schema migration handlers for version updates
  - Create backward compatibility validation
  - Handle migration failures gracefully
  - _Requirements: 8.2, 9.5_

- [ ] 6.3 Implement cache management
  - Create article processing cache with expiration
  - Implement vocabulary and sentence storage
  - Handle automatic cleanup when storage approaches limits
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 6.4 Create import/export functionality
  - Implement data export to Markdown format
  - Create import functionality for backup restoration
  - Handle large dataset export with compression
  - _Requirements: 8.6, 8.5_

- [ ]\* 6.5 Write unit tests for storage system
  - Test storage schema validation and migration
  - Test cache management and cleanup
  - Validate import/export functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.6_

- [ ] 7. Implement learning interface UI
- [ ] 7.1 Create article rendering system
  - Build card-based article display in new tab
  - Implement progressive loading for article parts
  - Create navigation between article parts with arrows and keyboard shortcuts
  - _Requirements: 1.7, 6.1, 6.2, 6.4_

- [ ] 7.2 Implement vocabulary highlighting system
  - Create text selection and highlighting for vocabulary mode
  - Generate vocabulary cards with translations and context
  - Implement hover popups and click-to-pronounce functionality
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 7.3 Create sentence highlighting system
  - Implement sentence selection and highlighting
  - Generate sentence cards with translations
  - Handle overlapping highlights by merging into phrases
  - _Requirements: 4.1, 4.2, 4.4, 3.7_

- [ ] 7.4 Build vocabulary learning mode
  - Create grid layout for vocabulary card display
  - Implement language display options (A+B, A only, B only)
  - Add hover behavior for hidden language display
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ] 7.5 Create sentence learning mode
  - Build sentence review interface
  - Implement TTS pronunciation for sentences
  - Display sentence translations and details
  - _Requirements: 5.4, 5.5_

- [ ] 7.6 Implement navigation and mode switching
  - Create tab-based navigation between Reading/Vocabulary/Sentences modes
  - Implement keyboard shortcuts for all navigation actions
  - Add right-click context menus for highlight editing
  - _Requirements: 6.1, 6.2, 6.3, 6.6_

- [ ]\* 7.7 Write unit tests for UI components
  - Test article rendering and navigation
  - Test highlighting systems and card generation
  - Validate learning mode functionality
  - _Requirements: 6.1, 6.2, 3.1, 4.1, 5.1_

- [ ] 8. Implement settings and configuration
- [ ] 8.1 Create first-time setup wizard
  - Build welcome screen with feature overview
  - Implement language selection (native and learning languages)
  - Create difficulty level slider and auto-highlight toggle
  - Add tutorial with Alice in Wonderland sample article
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 8.2 Build settings interface
  - Create settings panel with all configuration options
  - Implement API key management for Gemini and Jina Reader
  - Add keyboard shortcut customization
  - Create dark mode and font size controls
  - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 8.3 Implement settings persistence
  - Save all user preferences to chrome.storage.local
  - Handle settings validation and default values
  - Create settings import/export functionality
  - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [ ]\* 8.4 Write unit tests for settings system
  - Test setup wizard functionality
  - Test settings persistence and validation
  - Validate API key management
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 9. Implement TTS and pronunciation features
- [ ] 9.1 Create Web Speech API integration
  - Implement text-to-speech for vocabulary pronunciation
  - Add TTS support for sentence pronunciation
  - Handle different languages and voice selection
  - _Requirements: 3.5, 4.5, 5.5_

- [ ] 9.2 Add pronunciation controls
  - Create click-to-pronounce functionality for vocabulary cards
  - Implement pronunciation controls in learning modes
  - Handle TTS errors and fallbacks gracefully
  - _Requirements: 3.5, 4.5, 5.5_

- [ ]\* 9.3 Write unit tests for TTS system
  - Test Web Speech API integration
  - Test pronunciation functionality across different languages
  - Validate error handling for TTS failures
  - _Requirements: 3.5, 4.5, 5.5_

- [ ] 10. Implement error handling and user feedback
- [ ] 10.1 Create comprehensive error handling system
  - Implement retry logic with exponential backoff for AI failures
  - Create user-friendly error messages with suggested actions
  - Handle hardware capability detection and Gemini API suggestions
  - _Requirements: 9.1, 9.2, 9.3, 10.2_

- [ ] 10.2 Build progress indication system
  - Create progress bars for AI model downloads
  - Implement streaming progress for article processing
  - Add loading states for all async operations
  - _Requirements: 6.4, 6.5, 10.7_

- [ ] 10.3 Implement offline and network error handling
  - Create offline mode with cached content
  - Handle network timeouts and API rate limiting
  - Implement graceful degradation for service failures
  - _Requirements: 9.4, 9.5_

- [ ]\* 10.4 Write unit tests for error handling
  - Test retry mechanisms and error recovery
  - Test progress indication and user feedback
  - Validate offline mode and network error handling
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 11. Implement performance optimizations
- [ ] 11.1 Create batch processing system
  - Implement vocabulary batch processing (20 words per call)
  - Create progressive article loading for better user experience
  - Optimize AI API calls to reduce latency
  - _Requirements: 10.3, 10.4, 10.5_

- [ ] 11.2 Implement memory management
  - Create proper cleanup for AI sessions and offscreen documents
  - Implement tab resource management
  - Add memory usage monitoring and optimization
  - _Requirements: 10.5, 10.6_

- [ ] 11.3 Add caching and optimization
  - Implement intelligent caching for processed articles
  - Create vocabulary translation caching
  - Optimize storage operations for better performance
  - _Requirements: 8.3, 10.4, 10.6_

- [ ]\* 11.4 Write performance tests
  - Test memory usage and cleanup
  - Validate processing speed and optimization
  - Test caching effectiveness
  - _Requirements: 10.3, 10.4, 10.5, 10.6_

- [ ] 12. Final integration and testing
- [ ] 12.1 Integrate all components
  - Connect all systems into complete workflow
  - Test end-to-end article processing pipeline
  - Validate all user interaction flows
  - _Requirements: All requirements_

- [ ] 12.2 Create comprehensive error scenarios testing
  - Test all fallback mechanisms under various failure conditions
  - Validate graceful degradation across different hardware configurations
  - Test extension behavior with network issues and API failures
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 12.3 Perform user acceptance testing
  - Test complete user workflows from setup to learning
  - Validate all features work as specified in requirements
  - Test extension performance under realistic usage conditions
  - _Requirements: All requirements_

- [ ]\* 12.4 Write integration tests
  - Create end-to-end test suite
  - Test cross-component interactions
  - Validate complete user workflows
  - _Requirements: All requirements_
