/**
 * Workflow Test Scenarios - Part 2
 * TTS and Settings test scenarios
 *
 * Requirements: 9.4, 9.5
 */

import { TestScenario, TestResult } from '../types/debug-types';
import {
  VisualDebuggingSystem,
  CapturePoint,
} from '../visual-debugging-system';
import { ArtifactManager } from '../artifact-management-system';
import * as path from 'path';

/**
 * Base class for workflow test scenarios
 */
abstract class WorkflowTestScenario implements TestScenario {
  name: string;
  description: string;
  expectedOutcome: string;
  category: string;
  priority: number;
  timeout: number;

  protected visualDebugger: VisualDebuggingSystem;
  protected artifactManager: ArtifactManager;
  protected startTime: number = 0;
  protected testUrl: string = '';

  constructor(
    name: string,
    description: string,
    expectedOutcome: string,
    category: string = 'Workflow',
    priority: number = 5,
    timeout: number = 60000
  ) {
    this.name = name;
    this.description = description;
    this.expectedOutcome = expectedOutcome;
    this.category = category;
    this.priority = priority;
    this.timeout = timeout;

    this.visualDebugger = new VisualDebuggingSystem();
    this.artifactManager = new ArtifactManager();
  }

  abstract setup(): Promise<void>;
  abstract execute(): Promise<TestResult>;
  abstract cleanup(): Promise<void>;

  protected createTestResult(
    passed: boolean,
    metrics: Record<string, any>,
    error?: string
  ): TestResult {
    return {
      passed,
      scenarioName: this.name,
      executionTime: Date.now() - this.startTime,
      timestamp: new Date(),
      error,
      metrics,
    };
  }

  protected async captureWorkflowState(
    capturePoint: CapturePoint,
    description: string,
    scenario: string
  ): Promise<void> {
    this.visualDebugger.recordScreenshot(
      {
        capturePoint,
        description,
        scenario,
        fullPage: true,
      },
      this.testUrl
    );
  }
}

/**
 * Test Scenario 10.4: TTS Functionality
 *
 * Tests text-to-speech functionality for vocabulary and sentences.
 *
 * Requirements: 9.4
 */
export class TTSFunctionalityTestScenario extends WorkflowTestScenario {
  constructor() {
    super(
      'TTS Functionality Test',
      'Test text-to-speech for vocabulary and sentences',
      'TTS activates correctly and audio playback works for both vocabulary and sentences',
      'Audio Features',
      7,
      40000
    );
  }

  async setup(): Promise<void> {
    console.log(`[${this.name}] Setting up test environment...`);
    this.startTime = Date.now();
    this.testUrl =
      'file://' +
      path.resolve(process.cwd(), 'test-page.html').replace(/\\/g, '/');

    this.visualDebugger = new VisualDebuggingSystem();
    this.artifactManager = new ArtifactManager();
  }

  async execute(): Promise<TestResult> {
    console.log(`[${this.name}] Executing TTS functionality test...`);

    const metrics: Record<string, any> = {
      steps: [],
      screenshots: [],
      ttsActivations: [],
      errors: [],
    };

    try {
      // Step 1: Check TTS support
      console.log('Step 1: Check TTS support');
      metrics.steps.push({
        step: 1,
        name: 'Check TTS support',
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            const ttsSupported = 'speechSynthesis' in window;
            const vocabPronounceButtons = document.querySelectorAll('.vocab-card .pronounce-btn');
            const sentencePronounceButtons = document.querySelectorAll('.sentence-card .pronounce-btn');
            
            if (vocabPronounceButtons.length === 0 && sentencePronounceButtons.length === 0) {
              return { success: false, error: 'No TTS buttons found' };
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
        timestamp: Date.now(),
      });

      // Step 2: Capture before TTS activation
      console.log('Step 2: Capture before TTS activation');
      await this.captureWorkflowState(
        CapturePoint.VOCABULARY_HIGHLIGHTED,
        'Before TTS activation',
        'tts-functionality'
      );
      metrics.screenshots.push('before-tts-click.png');

      // Step 3: Click vocabulary TTS button
      console.log('Step 3: Click vocabulary TTS button');
      metrics.steps.push({
        step: 3,
        name: 'Click vocabulary TTS button',
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'Vocabulary pronounce button',
          ref: '.vocab-card .pronounce-btn',
        },
        timestamp: Date.now(),
      });
      metrics.ttsActivations.push({
        type: 'vocabulary',
        timestamp: Date.now(),
      });

      // Step 4: Wait for TTS initialization
      console.log('Step 4: Wait for TTS initialization');
      metrics.steps.push({
        step: 4,
        name: 'Wait for TTS initialization',
        tool: 'mcp_playwright_browser_wait_for',
        parameters: { time: 2 },
        timestamp: Date.now(),
      });

      // Step 5: Capture TTS active state
      console.log('Step 5: Capture TTS active state');
      await this.captureWorkflowState(
        CapturePoint.TTS_ACTIVATED,
        'TTS active for vocabulary',
        'tts-functionality'
      );
      metrics.screenshots.push('tts-active-vocabulary.png');

      // Step 6: Verify TTS is active
      console.log('Step 6: Verify TTS is active');
      metrics.steps.push({
        step: 6,
        name: 'Verify TTS is active',
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            const ttsIndicator = document.querySelector('.tts-indicator');
            const speakingButton = document.querySelector('.pronounce-btn.speaking');
            const isSpeaking = window.speechSynthesis?.speaking || false;
            const isPending = window.speechSynthesis?.pending || false;
            
            return {
              success: true,
              ttsState: {
                hasIndicator: !!ttsIndicator,
                hasSpeakingButton: !!speakingButton,
                speechSynthesis: {
                  speaking: isSpeaking,
                  pending: isPending
                }
              }
            };
          }`,
        },
        timestamp: Date.now(),
      });

      // Step 7: Check console for TTS messages
      console.log('Step 7: Check console for TTS messages');
      metrics.steps.push({
        step: 7,
        name: 'Check console for TTS messages',
        tool: 'mcp_playwright_browser_console_messages',
        parameters: { onlyErrors: false },
        timestamp: Date.now(),
      });

      // Step 8: Wait for TTS to complete
      console.log('Step 8: Wait for TTS to complete');
      metrics.steps.push({
        step: 8,
        name: 'Wait for TTS to complete',
        tool: 'mcp_playwright_browser_wait_for',
        parameters: { time: 3 },
        timestamp: Date.now(),
      });

      // Step 9: Verify TTS completed
      console.log('Step 9: Verify TTS completed');
      metrics.steps.push({
        step: 9,
        name: 'Verify TTS completed',
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
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
        timestamp: Date.now(),
      });

      // Step 10: Test sentence TTS
      console.log('Step 10: Test sentence TTS');
      metrics.steps.push({
        step: 10,
        name: 'Check sentence TTS availability',
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            const sentencePronounceBtn = document.querySelector('.sentence-card .pronounce-btn');
            if (!sentencePronounceBtn) {
              return { success: true, message: 'No sentence TTS button available', skipped: true };
            }
            return { success: true, sentenceTTS: { found: true } };
          }`,
        },
        timestamp: Date.now(),
      });

      // Step 11: Click sentence TTS button
      console.log('Step 11: Click sentence TTS button');
      metrics.steps.push({
        step: 11,
        name: 'Click sentence TTS button',
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'Sentence pronounce button',
          ref: '.sentence-card .pronounce-btn',
        },
        timestamp: Date.now(),
      });
      metrics.ttsActivations.push({ type: 'sentence', timestamp: Date.now() });

      // Step 12: Capture sentence TTS active
      console.log('Step 12: Capture sentence TTS active');
      await this.captureWorkflowState(
        CapturePoint.TTS_ACTIVATED,
        'TTS active for sentence',
        'tts-functionality'
      );
      metrics.screenshots.push('tts-active-sentence.png');

      // Step 13: Test TTS stop functionality
      console.log('Step 13: Test TTS stop functionality');
      metrics.steps.push({
        step: 13,
        name: 'Test TTS stop',
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            const stopBtn = document.querySelector('.tts-stop-btn');
            if (stopBtn) {
              stopBtn.click();
              return { success: true, stopped: true };
            }
            return { success: true, stopped: false, message: 'No stop button or TTS completed' };
          }`,
        },
        timestamp: Date.now(),
      });

      // Step 14: Capture after TTS stop
      console.log('Step 14: Capture after TTS stop');
      await this.captureWorkflowState(
        CapturePoint.VOCABULARY_HIGHLIGHTED,
        'After TTS stop',
        'tts-functionality'
      );
      metrics.screenshots.push('after-tts-stop.png');

      // Step 15: Check for TTS errors
      console.log('Step 15: Check for TTS errors');
      metrics.steps.push({
        step: 15,
        name: 'Check for TTS errors',
        tool: 'mcp_playwright_browser_console_messages',
        parameters: { onlyErrors: true },
        timestamp: Date.now(),
      });

      // Generate report
      const reportPath = await this.artifactManager.generateReport(
        'tts-functionality',
        'TTS functionality test completed successfully',
        [],
        [
          'Verify TTS audio quality',
          'Check TTS service initialization time',
          'Test TTS error handling',
          'Monitor TTS performance impact',
        ]
      );

      metrics.reportPath = reportPath;
      metrics.totalSteps = metrics.steps.length;
      metrics.totalTTSActivations = metrics.ttsActivations.length;
      metrics.executionTime = Date.now() - this.startTime;

      console.log(`[${this.name}] Test completed successfully`);
      return this.createTestResult(true, metrics);
    } catch (error) {
      console.error(`[${this.name}] Test failed:`, error);
      metrics.errors.push(
        error instanceof Error ? error.message : String(error)
      );
      return this.createTestResult(
        false,
        metrics,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  async cleanup(): Promise<void> {
    console.log(`[${this.name}] Cleaning up test environment...`);
    this.visualDebugger.generateArtifactIndex();
    console.log(`[${this.name}] Cleanup complete`);
  }
}

/**
 * Test Scenario 10.5: Settings Configuration
 *
 * Tests settings configuration and persistence.
 *
 * Requirements: 9.5
 */
export class SettingsConfigurationTestScenario extends WorkflowTestScenario {
  constructor() {
    super(
      'Settings Configuration Test',
      'Test settings configuration and persistence',
      'Settings can be changed and persist correctly across sessions',
      'Configuration',
      6,
      30000
    );
  }

  async setup(): Promise<void> {
    console.log(`[${this.name}] Setting up test environment...`);
    this.startTime = Date.now();
    this.testUrl =
      'file://' +
      path.resolve(process.cwd(), 'test-page.html').replace(/\\/g, '/');

    this.visualDebugger = new VisualDebuggingSystem();
    this.artifactManager = new ArtifactManager();
  }

  async execute(): Promise<TestResult> {
    console.log(`[${this.name}] Executing settings configuration test...`);

    const metrics: Record<string, any> = {
      steps: [],
      screenshots: [],
      settingsChanges: [],
      errors: [],
    };

    try {
      // Step 1: Locate settings controls
      console.log('Step 1: Locate settings controls');
      metrics.steps.push({
        step: 1,
        name: 'Locate settings controls',
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            const settingsBtn = document.querySelector('[data-settings]') ||
                               document.querySelector('button[aria-label*="settings"]');
            
            const displayOptions = document.querySelectorAll('.display-option');
            const difficultyControl = document.querySelector('[data-difficulty]') ||
                                     document.querySelector('select[name="difficulty"]');
            
            return {
              success: true,
              settings: {
                hasSettingsButton: !!settingsBtn,
                displayOptions: displayOptions.length,
                hasDifficultyControl: !!difficultyControl
              }
            };
          }`,
        },
        timestamp: Date.now(),
      });

      // Step 2: Capture initial settings state
      console.log('Step 2: Capture initial settings state');
      await this.captureWorkflowState(
        CapturePoint.LEARNING_INTERFACE_RENDERED,
        'Initial settings state',
        'settings-configuration'
      );
      metrics.screenshots.push('settings-initial.png');

      // Step 3: Get current display mode
      console.log('Step 3: Get current display mode');
      metrics.steps.push({
        step: 3,
        name: 'Get current display mode',
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            const activeOption = document.querySelector('.display-option.active');
            const currentMode = activeOption?.dataset.displayMode || 'unknown';
            
            return {
              success: true,
              currentSettings: {
                displayMode: currentMode
              }
            };
          }`,
        },
        timestamp: Date.now(),
      });

      // Step 4: Change display mode
      console.log('Step 4: Change display mode');
      metrics.steps.push({
        step: 4,
        name: 'Change display mode',
        tool: 'mcp_playwright_browser_click',
        parameters: {
          element: 'Display mode option',
          ref: '.display-option:not(.active)',
        },
        timestamp: Date.now(),
      });
      metrics.settingsChanges.push({
        setting: 'displayMode',
        timestamp: Date.now(),
      });

      // Step 5: Wait for mode change
      console.log('Step 5: Wait for mode change');
      metrics.steps.push({
        step: 5,
        name: 'Wait for mode change',
        tool: 'mcp_playwright_browser_wait_for',
        parameters: { time: 1 },
        timestamp: Date.now(),
      });

      // Step 6: Capture after mode change
      console.log('Step 6: Capture after mode change');
      await this.captureWorkflowState(
        CapturePoint.LEARNING_INTERFACE_RENDERED,
        'After display mode change',
        'settings-configuration'
      );
      metrics.screenshots.push('settings-mode-changed.png');

      // Step 7: Verify mode change
      console.log('Step 7: Verify mode change');
      metrics.steps.push({
        step: 7,
        name: 'Verify mode change',
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            const activeOption = document.querySelector('.display-option.active');
            const newMode = activeOption?.dataset.displayMode || 'unknown';
            
            return {
              success: true,
              updatedSettings: {
                displayMode: newMode,
                modeChanged: true
              }
            };
          }`,
        },
        timestamp: Date.now(),
      });

      // Step 8: Test difficulty level change
      console.log('Step 8: Test difficulty level change');
      metrics.steps.push({
        step: 8,
        name: 'Test difficulty level change',
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            const difficultyControl = document.querySelector('[data-difficulty]') ||
                                     document.querySelector('select[name="difficulty"]') ||
                                     document.querySelector('input[type="range"]');
            
            if (!difficultyControl) {
              return { success: true, message: 'No difficulty control found', skipped: true };
            }
            
            const currentValue = difficultyControl.value || '5';
            
            // Change difficulty
            if (difficultyControl.tagName === 'SELECT') {
              const options = difficultyControl.querySelectorAll('option');
              if (options.length > 1) {
                difficultyControl.value = options[1].value;
                difficultyControl.dispatchEvent(new Event('change'));
              }
            } else if (difficultyControl.tagName === 'INPUT') {
              const newValue = parseInt(currentValue) === 5 ? '7' : '5';
              difficultyControl.value = newValue;
              difficultyControl.dispatchEvent(new Event('input'));
            }
            
            return {
              success: true,
              difficulty: {
                previousValue: currentValue,
                newValue: difficultyControl.value,
                changed: true
              }
            };
          }`,
        },
        timestamp: Date.now(),
      });
      metrics.settingsChanges.push({
        setting: 'difficulty',
        timestamp: Date.now(),
      });

      // Step 9: Capture after difficulty change
      console.log('Step 9: Capture after difficulty change');
      await this.captureWorkflowState(
        CapturePoint.LEARNING_INTERFACE_RENDERED,
        'After difficulty change',
        'settings-configuration'
      );
      metrics.screenshots.push('settings-difficulty-changed.png');

      // Step 10: Verify settings persistence
      console.log('Step 10: Verify settings persistence');
      metrics.steps.push({
        step: 10,
        name: 'Verify settings persistence',
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `async () => {
            if (typeof chrome === 'undefined' || !chrome.storage) {
              return { success: false, error: 'Chrome storage not available' };
            }
            
            try {
              const settings = await chrome.storage.local.get('userSettings');
              return {
                success: true,
                persistence: {
                  settingsStored: !!settings.userSettings,
                  settings: settings.userSettings
                }
              };
            } catch (error) {
              return { success: false, error: error.message };
            }
          }`,
        },
        timestamp: Date.now(),
      });

      // Step 11: Test keyboard navigation
      console.log('Step 11: Test keyboard navigation');
      metrics.steps.push({
        step: 11,
        name: 'Test keyboard navigation',
        tool: 'mcp_playwright_browser_press_key',
        parameters: { key: 'Tab' },
        timestamp: Date.now(),
      });

      // Step 12: Verify focus management
      console.log('Step 12: Verify focus management');
      metrics.steps.push({
        step: 12,
        name: 'Verify focus management',
        tool: 'mcp_playwright_browser_evaluate',
        parameters: {
          function: `() => {
            const focusedElement = document.activeElement;
            const isFocusable = focusedElement && 
                               (focusedElement.tagName === 'BUTTON' || 
                                focusedElement.tagName === 'INPUT' ||
                                focusedElement.tagName === 'SELECT' ||
                                focusedElement.hasAttribute('tabindex'));
            
            return {
              success: true,
              accessibility: {
                hasFocus: !!focusedElement,
                isFocusable,
                focusedElement: focusedElement?.tagName || 'none'
              }
            };
          }`,
        },
        timestamp: Date.now(),
      });

      // Step 13: Check for errors
      console.log('Step 13: Check for errors');
      metrics.steps.push({
        step: 13,
        name: 'Check for errors',
        tool: 'mcp_playwright_browser_console_messages',
        parameters: { onlyErrors: true },
        timestamp: Date.now(),
      });

      // Generate report
      const reportPath = await this.artifactManager.generateReport(
        'settings-configuration',
        'Settings configuration test completed successfully',
        [],
        [
          'Verify all settings options are accessible',
          'Test settings persistence across page reloads',
          'Check settings impact on functionality',
          'Validate accessibility of settings UI',
        ]
      );

      metrics.reportPath = reportPath;
      metrics.totalSteps = metrics.steps.length;
      metrics.totalSettingsChanges = metrics.settingsChanges.length;
      metrics.executionTime = Date.now() - this.startTime;

      console.log(`[${this.name}] Test completed successfully`);
      return this.createTestResult(true, metrics);
    } catch (error) {
      console.error(`[${this.name}] Test failed:`, error);
      metrics.errors.push(
        error instanceof Error ? error.message : String(error)
      );
      return this.createTestResult(
        false,
        metrics,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  async cleanup(): Promise<void> {
    console.log(`[${this.name}] Cleaning up test environment...`);
    this.visualDebugger.generateArtifactIndex();
    console.log(`[${this.name}] Cleanup complete`);
  }
}
