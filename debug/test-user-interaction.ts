/**
 * User Interaction Testing with Playwright MCP
 *
 * This script tests user interactions with the learning interface including
 * vocabulary cards, sentence mode, TTS features, and settings.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

/**
 * Test 7.1: Test vocabulary card interactions
 *
 * This function demonstrates the MCP calls needed to:
 * - Click vocabulary cards to test translation display
 * - Verify translation popup appears
 * - Check translation content accuracy
 * - Capture interaction screenshots
 */
export function generateVocabularyCardInteractionTest(): {
  description: string;
  mcpCalls: Array<{
    step: number;
    tool: string;
    parameters: any;
    purpose: string;
    validation: string;
  }>;
} {
  return {
    description:
      'Test vocabulary card click interactions and translation display',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_snapshot',
        parameters: {},
        purpose:
          'Capture initial learning interface state to identify vocabulary cards',
        validation:
          'Snapshot contains vocabulary card elements with uid references',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Find all vocabulary cards
            const vocabCards = document.querySelectorAll('.vocab-card');
            
            if (vocabCards.length === 0) {
              return {
                success: false,
                error: 'No vocabulary cards found',
                hint: 'Make sure article has been processed and vocabulary extracted'
              };
            }
            
            // Get information about first vocabulary card
            const firstCard = vocabCards[0] as HTMLElement;
            const rect = firstCard.getBoundingClientRect();
            const vocabId = firstCard.dataset.vocabId;
            const word = firstCard.querySelector('.card-word')?.textContent || '';
            const isCollapsed = firstCard.classList.contains('collapsed');
            
            return {
              success: true,
              vocabulary: {
                totalCards: vocabCards.length,
                firstCard: {
                  id: vocabId,
                  word: word.trim(),
                  isCollapsed,
                  position: {
                    x: rect.x + rect.width / 2,
                    y: rect.y + rect.height / 2
                  },
                  hasTranslation: !!firstCard.querySelector('.card-translation'),
                  hasPronounceBtn: !!firstCard.querySelector('.pronounce-btn')
                }
              }
            };
          }`,
        },
        purpose: 'Identify vocabulary cards and get first card information',
        validation: 'Vocabulary cards found with clickable elements',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'vocabulary-cards-before-click.png',
          fullPage: true,
        },
        purpose: 'Capture state before clicking vocabulary card',
        validation: 'Screenshot shows vocabulary cards in collapsed state',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'First vocabulary card',
          ref: '.vocab-card',
        },
        purpose: 'Click first vocabulary card to expand and show translation',
        validation: 'Card expands to show translation and details',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for card expansion animation to complete',
        validation: 'Card fully expanded with translation visible',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'vocabulary-card-expanded.png',
        },
        purpose: 'Capture expanded vocabulary card with translation',
        validation: 'Screenshot shows translation and card details',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Verify card is expanded and translation is visible
            const firstCard = document.querySelector('.vocab-card') as HTMLElement;
            
            if (!firstCard) {
              return {
                success: false,
                error: 'Vocabulary card not found after click'
              };
            }
            
            const isExpanded = !firstCard.classList.contains('collapsed');
            const translation = firstCard.querySelector('.card-translation')?.textContent || '';
            const context = firstCard.querySelector('.card-context')?.textContent || '';
            const examples = Array.from(firstCard.querySelectorAll('.card-example'))
              .map(ex => ex.textContent?.trim() || '');
            
            // Check if translation is visible
            const translationElement = firstCard.querySelector('.card-translation') as HTMLElement;
            const isTranslationVisible = translationElement && 
              window.getComputedStyle(translationElement).display !== 'none';
            
            return {
              success: true,
              cardState: {
                isExpanded,
                isTranslationVisible,
                translation: translation.trim(),
                context: context.trim(),
                exampleCount: examples.length,
                examples: examples.slice(0, 2) // First 2 examples
              }
            };
          }`,
        },
        purpose: 'Verify card expanded and translation content is displayed',
        validation:
          'Card is expanded with translation, context, and examples visible',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Test clicking another vocabulary card
            const vocabCards = document.querySelectorAll('.vocab-card');
            
            if (vocabCards.length < 2) {
              return {
                success: true,
                message: 'Only one vocabulary card available',
                skipped: true
              };
            }
            
            const secondCard = vocabCards[1] as HTMLElement;
            const word = secondCard.querySelector('.card-word')?.textContent || '';
            
            return {
              success: true,
              secondCard: {
                word: word.trim(),
                isCollapsed: secondCard.classList.contains('collapsed')
              }
            };
          }`,
        },
        purpose: 'Check if multiple vocabulary cards are available for testing',
        validation: 'Multiple cards available or single card test sufficient',
      },
      {
        step: 9,
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'Second vocabulary card',
          ref: '.vocab-card:nth-child(2)',
        },
        purpose:
          'Click second vocabulary card to test multiple card interactions',
        validation: 'Second card expands while first remains expanded',
      },
      {
        step: 10,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for second card expansion',
        validation: 'Second card fully expanded',
      },
      {
        step: 11,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'vocabulary-multiple-cards-expanded.png',
          fullPage: true,
        },
        purpose: 'Capture state with multiple vocabulary cards expanded',
        validation:
          'Screenshot shows multiple expanded cards with translations',
      },
      {
        step: 12,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: true,
        },
        purpose: 'Check for errors during vocabulary card interactions',
        validation: 'No errors during card click and expansion',
      },
    ],
  };
}

/**
 * Test 7.2: Test sentence mode functionality
 *
 * This function demonstrates the MCP calls needed to:
 * - Click sentence mode toggle button
 * - Verify sentence highlighting activates
 * - Test sentence click for contextual translation
 * - Validate sentence mode UI changes
 */
export function generateSentenceModeTest(): {
  description: string;
  mcpCalls: Array<{
    step: number;
    tool: string;
    parameters: any;
    purpose: string;
    validation: string;
  }>;
} {
  return {
    description:
      'Test sentence mode toggle and sentence highlighting functionality',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Find sentence mode toggle button
            const sentenceModeBtn = document.querySelector('[data-highlight-mode="sentence"]') as HTMLElement;
            
            if (!sentenceModeBtn) {
              return {
                success: false,
                error: 'Sentence mode button not found',
                availableButtons: Array.from(document.querySelectorAll('.highlight-mode-btn'))
                  .map(btn => (btn as HTMLElement).dataset.highlightMode)
              };
            }
            
            const isActive = sentenceModeBtn.classList.contains('active');
            const buttonText = sentenceModeBtn.textContent?.trim() || '';
            
            return {
              success: true,
              sentenceModeButton: {
                found: true,
                isActive,
                text: buttonText,
                enabled: !sentenceModeBtn.hasAttribute('disabled')
              }
            };
          }`,
        },
        purpose: 'Locate sentence mode toggle button and check current state',
        validation: 'Sentence mode button found and accessible',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'before-sentence-mode.png',
          fullPage: true,
        },
        purpose:
          'Capture article with vocabulary highlighting before switching to sentence mode',
        validation: 'Screenshot shows vocabulary highlighting active',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'Sentence mode toggle button',
          ref: '[data-highlight-mode="sentence"]',
        },
        purpose: 'Click sentence mode button to activate sentence highlighting',
        validation: 'Sentence mode activated',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for sentence highlighting to apply to article content',
        validation: 'Highlighting changes applied',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'sentence-mode-active.png',
          fullPage: true,
        },
        purpose: 'Capture article with sentence highlighting active',
        validation:
          'Screenshot shows sentence highlighting instead of vocabulary',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Verify sentence mode is active
            const sentenceModeBtn = document.querySelector('[data-highlight-mode="sentence"]') as HTMLElement;
            const isActive = sentenceModeBtn?.classList.contains('active');
            
            // Check for sentence highlighting in article content
            const articleContent = document.querySelector('.article-part-content');
            if (!articleContent) {
              return {
                success: false,
                error: 'Article content not found'
              };
            }
            
            // Look for sentence highlights (implementation may vary)
            const sentenceHighlights = articleContent.querySelectorAll('[data-sentence-highlight]').length ||
                                      articleContent.querySelectorAll('.sentence-highlight').length ||
                                      articleContent.querySelectorAll('span[data-sentence]').length;
            
            // Check sentence cards section
            const sentenceCards = document.querySelectorAll('.sentence-card').length;
            
            return {
              success: true,
              sentenceMode: {
                isActive,
                sentenceHighlights,
                sentenceCards,
                hasSentenceElements: sentenceHighlights > 0 || sentenceCards > 0
              }
            };
          }`,
        },
        purpose:
          'Verify sentence mode is active and sentence highlighting is applied',
        validation: 'Sentence mode active with sentence elements visible',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Find first sentence card to test interaction
            const sentenceCards = document.querySelectorAll('.sentence-card');
            
            if (sentenceCards.length === 0) {
              return {
                success: false,
                error: 'No sentence cards found',
                hint: 'Sentences may need to be highlighted first'
              };
            }
            
            const firstCard = sentenceCards[0] as HTMLElement;
            const sentence = firstCard.querySelector('.card-sentence')?.textContent || '';
            const isCollapsed = firstCard.classList.contains('collapsed');
            
            return {
              success: true,
              sentenceCard: {
                totalCards: sentenceCards.length,
                firstSentence: sentence.trim().substring(0, 100),
                isCollapsed
              }
            };
          }`,
        },
        purpose: 'Identify sentence cards for interaction testing',
        validation: 'Sentence cards found and ready for interaction',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'First sentence card',
          ref: '.sentence-card',
        },
        purpose:
          'Click sentence card to expand and show contextual translation',
        validation: 'Sentence card expands with translation',
      },
      {
        step: 9,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for sentence card expansion',
        validation: 'Card fully expanded',
      },
      {
        step: 10,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'sentence-card-expanded.png',
        },
        purpose: 'Capture expanded sentence card with translation',
        validation: 'Screenshot shows sentence translation',
      },
      {
        step: 11,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Verify sentence card is expanded with translation
            const firstCard = document.querySelector('.sentence-card') as HTMLElement;
            
            if (!firstCard) {
              return {
                success: false,
                error: 'Sentence card not found after click'
              };
            }
            
            const isExpanded = !firstCard.classList.contains('collapsed');
            const translation = firstCard.querySelector('.card-translation')?.textContent || '';
            
            return {
              success: true,
              cardState: {
                isExpanded,
                hasTranslation: translation.length > 0,
                translation: translation.trim().substring(0, 100)
              }
            };
          }`,
        },
        purpose: 'Verify sentence card expanded with contextual translation',
        validation: 'Sentence translation displayed correctly',
      },
      {
        step: 12,
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'Vocabulary mode toggle button',
          ref: '[data-highlight-mode="vocabulary"]',
        },
        purpose: 'Switch back to vocabulary mode to test mode toggling',
        validation: 'Vocabulary mode reactivated',
      },
      {
        step: 13,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for vocabulary highlighting to reapply',
        validation: 'Highlighting switched back to vocabulary',
      },
      {
        step: 14,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'back-to-vocabulary-mode.png',
          fullPage: true,
        },
        purpose: 'Capture article after switching back to vocabulary mode',
        validation: 'Screenshot shows vocabulary highlighting restored',
      },
      {
        step: 15,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: true,
        },
        purpose: 'Check for errors during sentence mode interactions',
        validation: 'No errors during mode switching and sentence interactions',
      },
    ],
  };
}

/**
 * Test 7.3: Test TTS and audio features
 *
 * This function demonstrates the MCP calls needed to:
 * - Click TTS buttons for vocabulary and sentences
 * - Monitor for audio playback indicators
 * - Verify TTS service initialization
 * - Check for audio-related errors
 */
export function generateTTSFeaturesTest(): {
  description: string;
  mcpCalls: Array<{
    step: number;
    tool: string;
    parameters: any;
    purpose: string;
    validation: string;
  }>;
} {
  return {
    description:
      'Test text-to-speech functionality for vocabulary and sentences',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check if TTS is supported in browser
            const ttsSupported = 'speechSynthesis' in window;
            
            // Find TTS buttons in vocabulary cards
            const vocabPronounceButtons = document.querySelectorAll('.vocab-card .pronounce-btn');
            
            // Find TTS buttons in sentence cards
            const sentencePronounceButtons = document.querySelectorAll('.sentence-card .pronounce-btn');
            
            if (vocabPronounceButtons.length === 0 && sentencePronounceButtons.length === 0) {
              return {
                success: false,
                error: 'No TTS buttons found',
                hint: 'Make sure vocabulary or sentence cards are visible'
              };
            }
            
            return {
              success: true,
              tts: {
                browserSupported: ttsSupported,
                vocabButtons: vocabPronounceButtons.length,
                sentenceButtons: sentencePronounceButtons.length,
                totalButtons: vocabPronounceButtons.length + sentencePronounceButtons.length
              }
            };
          }`,
        },
        purpose: 'Check TTS support and locate TTS buttons',
        validation: 'TTS supported and buttons found',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'before-tts-click.png',
        },
        purpose: 'Capture state before clicking TTS button',
        validation: 'Screenshot shows TTS buttons available',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'First vocabulary pronounce button',
          ref: '.vocab-card .pronounce-btn',
        },
        purpose: 'Click TTS button on vocabulary card to trigger speech',
        validation: 'TTS button clicked and speech initiated',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for TTS to initialize and start speaking',
        validation: 'TTS has time to initialize and begin playback',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'tts-active-vocabulary.png',
        },
        purpose: 'Capture state while TTS is active',
        validation: 'Screenshot shows TTS indicator or speaking state',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check for TTS indicator
            const ttsIndicator = document.querySelector('.tts-indicator');
            const speakingButton = document.querySelector('.pronounce-btn.speaking');
            
            // Check speechSynthesis state
            const isSpeaking = window.speechSynthesis?.speaking || false;
            const isPending = window.speechSynthesis?.pending || false;
            
            return {
              success: true,
              ttsState: {
                hasIndicator: !!ttsIndicator,
                indicatorText: ttsIndicator?.textContent?.trim() || '',
                hasSpeakingButton: !!speakingButton,
                speechSynthesis: {
                  speaking: isSpeaking,
                  pending: isPending
                }
              }
            };
          }`,
        },
        purpose: 'Verify TTS is active and indicators are shown',
        validation: 'TTS indicator visible and speech synthesis active',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: false,
        },
        purpose: 'Capture console messages for TTS initialization and playback',
        validation: 'Console shows TTS activity without critical errors',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 3,
        },
        purpose: 'Wait for TTS to complete speaking',
        validation: 'TTS completes or continues speaking',
      },
      {
        step: 9,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check if TTS completed
            const ttsIndicator = document.querySelector('.tts-indicator');
            const isSpeaking = window.speechSynthesis?.speaking || false;
            
            return {
              success: true,
              ttsCompleted: {
                indicatorRemoved: !ttsIndicator,
                stillSpeaking: isSpeaking
              }
            };
          }`,
        },
        purpose: 'Check if TTS completed or is still active',
        validation: 'TTS state tracked correctly',
      },
      {
        step: 10,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Find sentence pronounce button
            const sentencePronounceBtn = document.querySelector('.sentence-card .pronounce-btn') as HTMLElement;
            
            if (!sentencePronounceBtn) {
              return {
                success: true,
                message: 'No sentence TTS button available',
                skipped: true
              };
            }
            
            return {
              success: true,
              sentenceTTS: {
                found: true,
                enabled: !sentencePronounceBtn.hasAttribute('disabled')
              }
            };
          }`,
        },
        purpose: 'Check if sentence TTS button is available',
        validation: 'Sentence TTS button found or test skipped',
      },
      {
        step: 11,
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'Sentence pronounce button',
          ref: '.sentence-card .pronounce-btn',
        },
        purpose: 'Click TTS button on sentence card to test sentence speech',
        validation: 'Sentence TTS activated',
      },
      {
        step: 12,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 2,
        },
        purpose: 'Wait for sentence TTS to initialize',
        validation: 'Sentence TTS has time to start',
      },
      {
        step: 13,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'tts-active-sentence.png',
        },
        purpose: 'Capture state while sentence TTS is active',
        validation: 'Screenshot shows sentence TTS indicator',
      },
      {
        step: 14,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Test TTS stop functionality
            const stopBtn = document.querySelector('.tts-stop-btn') as HTMLElement;
            
            if (stopBtn) {
              stopBtn.click();
              return {
                success: true,
                stopped: true,
                message: 'TTS stop button clicked'
              };
            }
            
            return {
              success: true,
              stopped: false,
              message: 'No stop button found or TTS already completed'
            };
          }`,
        },
        purpose: 'Test TTS stop functionality',
        validation: 'TTS can be stopped by user',
      },
      {
        step: 15,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for TTS to stop',
        validation: 'TTS stopped successfully',
      },
      {
        step: 16,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'after-tts-stop.png',
        },
        purpose: 'Capture state after stopping TTS',
        validation: 'Screenshot shows TTS indicator removed',
      },
      {
        step: 17,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: true,
        },
        purpose: 'Check for TTS-related errors',
        validation: 'No errors during TTS operations',
      },
    ],
  };
}

/**
 * Test 7.4: Test settings and configuration
 *
 * This function demonstrates the MCP calls needed to:
 * - Navigate to settings page
 * - Test difficulty level changes
 * - Verify settings persistence
 * - Test keyboard navigation
 */
export function generateSettingsConfigurationTest(): {
  description: string;
  mcpCalls: Array<{
    step: number;
    tool: string;
    parameters: any;
    purpose: string;
    validation: string;
  }>;
} {
  return {
    description: 'Test settings configuration and keyboard navigation',
    mcpCalls: [
      {
        step: 1,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Look for settings button or link
            const settingsBtn = document.querySelector('[data-settings]') ||
                               document.querySelector('button[aria-label*="settings"]') ||
                               document.querySelector('button[aria-label*="Settings"]') ||
                               Array.from(document.querySelectorAll('button, a'))
                                 .find(el => {
                                   const text = el.textContent?.toLowerCase() || '';
                                   return text.includes('settings') || text.includes('⚙');
                                 });
            
            if (!settingsBtn) {
              return {
                success: true,
                message: 'No settings button found in current view',
                note: 'Settings may be in extension popup or separate page'
              };
            }
            
            return {
              success: true,
              settings: {
                found: true,
                text: settingsBtn.textContent?.trim() || '',
                type: settingsBtn.tagName.toLowerCase()
              }
            };
          }`,
        },
        purpose: 'Locate settings button or navigation',
        validation: 'Settings access point found or noted as unavailable',
      },
      {
        step: 2,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check for display mode options (already visible in learning interface)
            const displayOptions = document.querySelectorAll('.display-option');
            
            if (displayOptions.length === 0) {
              return {
                success: true,
                message: 'Display options not in current view',
                note: 'May need to switch to vocabulary or sentences mode'
              };
            }
            
            const activeOption = document.querySelector('.display-option.active') as HTMLElement;
            const currentMode = activeOption?.dataset.display || 'unknown';
            
            return {
              success: true,
              displayOptions: {
                found: true,
                totalOptions: displayOptions.length,
                currentMode,
                availableModes: Array.from(displayOptions)
                  .map(opt => (opt as HTMLElement).dataset.display)
              }
            };
          }`,
        },
        purpose: 'Check for display mode configuration options',
        validation: 'Display options found or noted as unavailable',
      },
      {
        step: 3,
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'Vocabulary tab',
          ref: '[data-mode="vocabulary"]',
        },
        purpose: 'Switch to vocabulary mode to access display options',
        validation: 'Vocabulary mode activated',
      },
      {
        step: 4,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for vocabulary mode to load',
        validation: 'Vocabulary mode fully loaded',
      },
      {
        step: 5,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'vocabulary-mode-with-display-options.png',
        },
        purpose: 'Capture vocabulary mode with display options visible',
        validation: 'Screenshot shows display configuration options',
      },
      {
        step: 6,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Get current display mode
            const activeOption = document.querySelector('.display-option.active') as HTMLElement;
            const currentMode = activeOption?.dataset.display || 'both';
            
            return {
              success: true,
              currentDisplayMode: currentMode
            };
          }`,
        },
        purpose: 'Get current display mode setting',
        validation: 'Current display mode identified',
      },
      {
        step: 7,
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'Learning language only display option',
          ref: '[data-display="learning_only"]',
        },
        purpose: 'Change display mode to show only learning language',
        validation: 'Display mode changed',
      },
      {
        step: 8,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for display mode change to apply',
        validation: 'Display updated',
      },
      {
        step: 9,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'display-mode-learning-only.png',
          fullPage: true,
        },
        purpose: 'Capture vocabulary display with only learning language shown',
        validation: 'Screenshot shows only learning language words',
      },
      {
        step: 10,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Verify display mode changed
            const activeOption = document.querySelector('.display-option.active') as HTMLElement;
            const newMode = activeOption?.dataset.display || '';
            
            // Check if translations are hidden
            const hiddenTranslations = document.querySelectorAll('.vocab-learning-translation.hidden-lang').length;
            const visibleWords = document.querySelectorAll('.vocab-learning-word').length;
            
            return {
              success: true,
              displayModeChanged: {
                newMode,
                isLearningOnly: newMode === 'learning_only',
                hiddenTranslations,
                visibleWords
              }
            };
          }`,
        },
        purpose: 'Verify display mode change applied correctly',
        validation: 'Display mode changed and translations hidden',
      },
      {
        step: 11,
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'Both languages display option',
          ref: '[data-display="both"]',
        },
        purpose: 'Change display mode back to show both languages',
        validation: 'Display mode restored to both',
      },
      {
        step: 12,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for display mode change',
        validation: 'Display updated to show both languages',
      },
      {
        step: 13,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'display-mode-both.png',
        },
        purpose: 'Capture vocabulary display with both languages shown',
        validation: 'Screenshot shows both learning language and translations',
      },
      {
        step: 14,
        tool: 'mcp_playwright_browser_press_key',
        parameters: {
          key: 'r',
        },
        purpose: 'Test keyboard shortcut to switch to reading mode',
        validation: 'Reading mode activated via keyboard',
      },
      {
        step: 15,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for mode switch',
        validation: 'Mode switched successfully',
      },
      {
        step: 16,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Verify reading mode is active
            const activeTab = document.querySelector('.tab-button.active') as HTMLElement;
            const currentMode = activeTab?.dataset.mode || '';
            
            return {
              success: true,
              keyboardNavigation: {
                currentMode,
                isReadingMode: currentMode === 'reading'
              }
            };
          }`,
        },
        purpose: 'Verify keyboard shortcut worked',
        validation: 'Reading mode activated via keyboard shortcut',
      },
      {
        step: 17,
        tool: 'mcp_playwright_browser_press_key',
        parameters: {
          key: 'v',
        },
        purpose: 'Test keyboard shortcut to switch to vocabulary mode',
        validation: 'Vocabulary mode activated via keyboard',
      },
      {
        step: 18,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for mode switch',
        validation: 'Mode switched successfully',
      },
      {
        step: 19,
        tool: 'mcp_playwright_browser_press_key',
        parameters: {
          key: 's',
        },
        purpose: 'Test keyboard shortcut to switch to sentences mode',
        validation: 'Sentences mode activated via keyboard',
      },
      {
        step: 20,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for mode switch',
        validation: 'Mode switched successfully',
      },
      {
        step: 21,
        tool: 'mcp_playwright_browser_take_screenshot',
        parameters: {
          filename: 'keyboard-navigation-test.png',
        },
        purpose: 'Capture final state after keyboard navigation tests',
        validation: 'Screenshot shows sentences mode after keyboard navigation',
      },
      {
        step: 22,
        tool: 'mcp_playwright_browser_press_key',
        parameters: {
          key: 'ArrowRight',
        },
        purpose: 'Test keyboard navigation to next article part',
        validation: 'Next part navigation via keyboard',
      },
      {
        step: 23,
        tool: 'mcp_playwright_browser_wait_for',
        parameters: {
          time: 1,
        },
        purpose: 'Wait for part navigation',
        validation: 'Article part changed',
      },
      {
        step: 24,
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            // Check current part number
            const currentPart = document.querySelector('.current-part')?.textContent || '1';
            const totalParts = document.querySelector('.total-parts')?.textContent || '1';
            
            return {
              success: true,
              navigation: {
                currentPart: parseInt(currentPart),
                totalParts: parseInt(totalParts),
                canNavigate: parseInt(totalParts) > 1
              }
            };
          }`,
        },
        purpose: 'Verify article part navigation',
        validation: 'Part navigation tracked correctly',
      },
      {
        step: 25,
        tool: 'mcp_playwright_browser_console_messages',
        parameters: {
          onlyErrors: true,
        },
        purpose:
          'Check for errors during settings and keyboard navigation tests',
        validation:
          'No errors during configuration changes and keyboard navigation',
      },
    ],
  };
}

/**
 * Generate complete user interaction test documentation
 */
export function generateUserInteractionTestDocumentation(): string {
  const lines: string[] = [];

  lines.push('# User Interaction Testing Suite');
  lines.push('');
  lines.push(
    'Complete testing of user interactions with the learning interface including'
  );
  lines.push(
    'vocabulary cards, sentence mode, TTS features, and settings configuration.'
  );
  lines.push('');
  lines.push('## Test Coverage');
  lines.push('');
  lines.push(
    '- **Test 7.1**: Vocabulary card interactions and translation display'
  );
  lines.push('- **Test 7.2**: Sentence mode toggle and sentence highlighting');
  lines.push(
    '- **Test 7.3**: Text-to-speech functionality for vocabulary and sentences'
  );
  lines.push('- **Test 7.4**: Settings configuration and keyboard navigation');
  lines.push('');

  const test71 = generateVocabularyCardInteractionTest();
  lines.push('## Test 7.1: Vocabulary Card Interactions');
  lines.push('');
  lines.push(test71.description);
  lines.push('');
  lines.push(`**Total Steps:** ${test71.mcpCalls.length}`);
  lines.push('');

  const test72 = generateSentenceModeTest();
  lines.push('## Test 7.2: Sentence Mode Functionality');
  lines.push('');
  lines.push(test72.description);
  lines.push('');
  lines.push(`**Total Steps:** ${test72.mcpCalls.length}`);
  lines.push('');

  const test73 = generateTTSFeaturesTest();
  lines.push('## Test 7.3: TTS and Audio Features');
  lines.push('');
  lines.push(test73.description);
  lines.push('');
  lines.push(`**Total Steps:** ${test73.mcpCalls.length}`);
  lines.push('');

  const test74 = generateSettingsConfigurationTest();
  lines.push('## Test 7.4: Settings and Configuration');
  lines.push('');
  lines.push(test74.description);
  lines.push('');
  lines.push(`**Total Steps:** ${test74.mcpCalls.length}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Main execution function
 */
export function main(): void {
  console.log('🧪 User Interaction Testing Suite\n');

  const test71 = generateVocabularyCardInteractionTest();
  console.log(`\n📋 Test 7.1: ${test71.description}`);
  console.log(`   Steps: ${test71.mcpCalls.length}`);

  const test72 = generateSentenceModeTest();
  console.log(`\n📋 Test 7.2: ${test72.description}`);
  console.log(`   Steps: ${test72.mcpCalls.length}`);

  const test73 = generateTTSFeaturesTest();
  console.log(`\n📋 Test 7.3: ${test73.description}`);
  console.log(`   Steps: ${test73.mcpCalls.length}`);

  const test74 = generateSettingsConfigurationTest();
  console.log(`\n📋 Test 7.4: ${test74.description}`);
  console.log(`   Steps: ${test74.mcpCalls.length}`);

  console.log('\n✅ User interaction test suite generation complete!');
  console.log(
    '\n📝 Total test steps:',
    test71.mcpCalls.length +
      test72.mcpCalls.length +
      test73.mcpCalls.length +
      test74.mcpCalls.length
  );
}

if (process.argv[1]?.includes('test-user-interaction')) {
  main();
}
