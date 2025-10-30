/**
 * Visual Debugging Workflow Integration
 *
 * This module demonstrates how to integrate the visual debugging system
 * into the extension testing workflow, capturing screenshots and snapshots
 * at key points.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import {
  VisualDebuggingSystem,
  CapturePoint,
  ScreenshotConfig,
} from './visual-debugging-system';

/**
 * Workflow step with visual debugging
 */
export interface WorkflowStep {
  step: number;
  name: string;
  description: string;
  capturePoint: CapturePoint;
  captureScreenshot: boolean;
  captureSnapshot: boolean;
  fullPage?: boolean;
  mcpCalls: Array<{
    tool: string;
    parameters: any;
    purpose: string;
  }>;
}

/**
 * Generate workflow with visual debugging integration
 *
 * This function creates a complete workflow that includes screenshot
 * and snapshot capture at all key points.
 */
export function generateVisualDebuggingWorkflow(
  debugSystem: VisualDebuggingSystem,
  scenario: string = 'complete-workflow'
): WorkflowStep[] {
  return [
    // Step 1: Extension Loaded
    {
      step: 1,
      name: 'Extension Loaded',
      description: 'Capture extension state after loading',
      capturePoint: CapturePoint.EXTENSION_LOADED,
      captureScreenshot: true,
      captureSnapshot: true,
      fullPage: false,
      mcpCalls: [
        {
          tool: 'mcp_playwright_browser_navigate',
          parameters: {
            url: 'chrome://extensions',
          },
          purpose: 'Navigate to extensions page to verify loading',
        },
        {
          tool: 'mcp_playwright_browser_wait_for',
          parameters: { time: 2 },
          purpose: 'Wait for extension page to load',
        },
        {
          ...debugSystem.getScreenshotParameters({
            capturePoint: CapturePoint.EXTENSION_LOADED,
            description: 'Extension loaded on chrome://extensions page',
            scenario,
            fullPage: false,
          }),
          purpose: 'Capture screenshot of extension loaded state',
        },
        {
          ...debugSystem.getSnapshotParameters(),
          purpose: 'Capture accessibility snapshot of extension page',
        },
      ],
    },

    // Step 2: Content Script Injected
    {
      step: 2,
      name: 'Content Script Injected',
      description: 'Capture page state after content script injection',
      capturePoint: CapturePoint.CONTENT_SCRIPT_INJECTED,
      captureScreenshot: true,
      captureSnapshot: true,
      fullPage: true,
      mcpCalls: [
        {
          tool: 'mcp_playwright_browser_navigate',
          parameters: {
            url:
              'file://' + process.cwd().replace(/\\/g, '/') + '/test-page.html',
          },
          purpose: 'Navigate to test page for content script injection',
        },
        {
          tool: 'mcp_playwright_browser_wait_for',
          parameters: { time: 2 },
          purpose: 'Wait for content script to inject',
        },
        {
          ...debugSystem.getScreenshotParameters({
            capturePoint: CapturePoint.CONTENT_SCRIPT_INJECTED,
            description: 'Test page with content script injected',
            scenario,
            fullPage: true,
          }),
          purpose: 'Capture screenshot after content script injection',
        },
        {
          ...debugSystem.getSnapshotParameters(),
          purpose: 'Capture accessibility snapshot of test page',
        },
      ],
    },

    // Step 3: Article Page Initial State
    {
      step: 3,
      name: 'Article Page Initial',
      description: 'Capture article page before processing',
      capturePoint: CapturePoint.ARTICLE_PAGE_INITIAL,
      captureScreenshot: true,
      captureSnapshot: true,
      fullPage: true,
      mcpCalls: [
        {
          ...debugSystem.getScreenshotParameters({
            capturePoint: CapturePoint.ARTICLE_PAGE_INITIAL,
            description: 'Article page initial state before processing',
            scenario,
            fullPage: true,
          }),
          purpose: 'Capture screenshot of article page initial state',
        },
        {
          ...debugSystem.getSnapshotParameters(),
          purpose: 'Capture accessibility snapshot of article page',
        },
        {
          tool: 'mcp_playwright_browser_console_messages',
          parameters: { onlyErrors: false },
          purpose: 'Capture console state before processing',
        },
      ],
    },

    // Step 4: Article Processing Start
    {
      step: 4,
      name: 'Article Processing Start',
      description: 'Capture state when processing begins',
      capturePoint: CapturePoint.ARTICLE_PROCESSING_START,
      captureScreenshot: true,
      captureSnapshot: true,
      fullPage: false,
      mcpCalls: [
        {
          tool: 'mcp_playwright_browser_evaluate',
          parameters: {
            function: `() => {
              // Trigger article processing
              if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({ 
                  type: 'TRIGGER_EXTRACTION', 
                  url: window.location.href 
                });
              }
              return { triggered: true, timestamp: Date.now() };
            }`,
          },
          purpose: 'Trigger article extraction',
        },
        {
          tool: 'mcp_playwright_browser_wait_for',
          parameters: { time: 1 },
          purpose: 'Wait for processing to start',
        },
        {
          ...debugSystem.getScreenshotParameters({
            capturePoint: CapturePoint.ARTICLE_PROCESSING_START,
            description: 'Article processing started',
            scenario,
            fullPage: false,
          }),
          purpose: 'Capture screenshot when article processing starts',
        },
        {
          ...debugSystem.getSnapshotParameters(),
          purpose: 'Capture accessibility snapshot during processing',
        },
      ],
    },

    // Step 5: Learning Interface Opened
    {
      step: 5,
      name: 'Learning Interface Opened',
      description: 'Capture learning interface when it opens',
      capturePoint: CapturePoint.LEARNING_INTERFACE_OPENED,
      captureScreenshot: true,
      captureSnapshot: true,
      fullPage: false,
      mcpCalls: [
        {
          tool: 'mcp_playwright_browser_wait_for',
          parameters: { time: 5 },
          purpose: 'Wait for learning interface to open',
        },
        {
          tool: 'mcp_playwright_browser_tabs',
          parameters: { action: 'list' },
          purpose: 'List tabs to find learning interface',
        },
        {
          tool: 'mcp_playwright_browser_tabs',
          parameters: { action: 'select', index: 1 },
          purpose: 'Switch to learning interface tab',
        },
        {
          tool: 'mcp_playwright_browser_wait_for',
          parameters: { time: 2 },
          purpose: 'Wait for interface to load',
        },
        {
          ...debugSystem.getScreenshotParameters({
            capturePoint: CapturePoint.LEARNING_INTERFACE_OPENED,
            description: 'Learning interface opened in new tab',
            scenario,
            fullPage: false,
          }),
          purpose: 'Capture screenshot of learning interface opened',
        },
        {
          ...debugSystem.getSnapshotParameters(),
          purpose: 'Capture accessibility snapshot of learning interface',
        },
      ],
    },

    // Step 6: Learning Interface Rendered
    {
      step: 6,
      name: 'Learning Interface Rendered',
      description: 'Capture fully rendered learning interface',
      capturePoint: CapturePoint.LEARNING_INTERFACE_RENDERED,
      captureScreenshot: true,
      captureSnapshot: true,
      fullPage: true,
      mcpCalls: [
        {
          tool: 'mcp_playwright_browser_wait_for',
          parameters: { time: 3 },
          purpose: 'Wait for complete rendering',
        },
        {
          ...debugSystem.getScreenshotParameters({
            capturePoint: CapturePoint.LEARNING_INTERFACE_RENDERED,
            description: 'Learning interface fully rendered with content',
            scenario,
            fullPage: true,
          }),
          purpose: 'Capture screenshot of fully rendered interface',
        },
        {
          ...debugSystem.getSnapshotParameters(),
          purpose: 'Capture accessibility snapshot of rendered interface',
        },
        {
          tool: 'mcp_playwright_browser_console_messages',
          parameters: { onlyErrors: true },
          purpose: 'Check for rendering errors',
        },
      ],
    },

    // Step 7: Vocabulary Highlighted
    {
      step: 7,
      name: 'Vocabulary Highlighted',
      description: 'Capture vocabulary highlighting state',
      capturePoint: CapturePoint.VOCABULARY_HIGHLIGHTED,
      captureScreenshot: true,
      captureSnapshot: true,
      fullPage: true,
      mcpCalls: [
        {
          tool: 'mcp_playwright_browser_evaluate',
          parameters: {
            function: `() => {
              const highlighted = document.querySelectorAll('[data-vocabulary], .vocabulary-highlight').length;
              return { highlightedWords: highlighted };
            }`,
          },
          purpose: 'Count highlighted vocabulary words',
        },
        {
          ...debugSystem.getScreenshotParameters({
            capturePoint: CapturePoint.VOCABULARY_HIGHLIGHTED,
            description: 'Vocabulary words highlighted in article',
            scenario,
            fullPage: true,
          }),
          purpose: 'Capture screenshot of vocabulary highlighting',
        },
        {
          ...debugSystem.getSnapshotParameters(),
          purpose: 'Capture accessibility snapshot with highlighted vocabulary',
        },
      ],
    },

    // Step 8: Translation Popup
    {
      step: 8,
      name: 'Translation Popup',
      description: 'Capture translation popup display',
      capturePoint: CapturePoint.TRANSLATION_POPUP,
      captureScreenshot: true,
      captureSnapshot: true,
      fullPage: false,
      mcpCalls: [
        {
          tool: 'mcp_playwright_browser_click',
          parameters: {
            element: 'First vocabulary word',
            ref: '[data-vocabulary]',
          },
          purpose: 'Click vocabulary word to show translation',
        },
        {
          tool: 'mcp_playwright_browser_wait_for',
          parameters: { time: 1 },
          purpose: 'Wait for translation popup',
        },
        {
          ...debugSystem.getScreenshotParameters({
            capturePoint: CapturePoint.TRANSLATION_POPUP,
            description: 'Translation popup displayed for vocabulary word',
            scenario,
            fullPage: false,
          }),
          purpose: 'Capture screenshot of translation popup',
        },
        {
          ...debugSystem.getSnapshotParameters(),
          purpose: 'Capture accessibility snapshot of popup',
        },
      ],
    },

    // Step 9: Sentence Mode Active
    {
      step: 9,
      name: 'Sentence Mode Active',
      description: 'Capture sentence mode highlighting',
      capturePoint: CapturePoint.SENTENCE_MODE_ACTIVE,
      captureScreenshot: true,
      captureSnapshot: true,
      fullPage: true,
      mcpCalls: [
        {
          tool: 'mcp_playwright_browser_click',
          parameters: {
            element: 'Sentence mode toggle',
            ref: '[data-sentence-mode]',
          },
          purpose: 'Toggle sentence mode on',
        },
        {
          tool: 'mcp_playwright_browser_wait_for',
          parameters: { time: 1 },
          purpose: 'Wait for sentence highlighting',
        },
        {
          ...debugSystem.getScreenshotParameters({
            capturePoint: CapturePoint.SENTENCE_MODE_ACTIVE,
            description: 'Sentence mode active with sentence highlighting',
            scenario,
            fullPage: true,
          }),
          purpose: 'Capture screenshot of sentence mode active',
        },
        {
          ...debugSystem.getSnapshotParameters(),
          purpose: 'Capture accessibility snapshot in sentence mode',
        },
      ],
    },

    // Step 10: TTS Activated
    {
      step: 10,
      name: 'TTS Activated',
      description: 'Capture TTS button activation',
      capturePoint: CapturePoint.TTS_ACTIVATED,
      captureScreenshot: true,
      captureSnapshot: true,
      fullPage: false,
      mcpCalls: [
        {
          tool: 'mcp_playwright_browser_click',
          parameters: {
            element: 'TTS button',
            ref: '[data-tts]',
          },
          purpose: 'Click TTS button',
        },
        {
          tool: 'mcp_playwright_browser_wait_for',
          parameters: { time: 1 },
          purpose: 'Wait for TTS activation',
        },
        {
          ...debugSystem.getScreenshotParameters({
            capturePoint: CapturePoint.TTS_ACTIVATED,
            description: 'TTS button activated',
            scenario,
            fullPage: false,
          }),
          purpose: 'Capture screenshot of TTS activated state',
        },
        {
          ...debugSystem.getSnapshotParameters(),
          purpose: 'Capture accessibility snapshot with TTS active',
        },
        {
          tool: 'mcp_playwright_browser_console_messages',
          parameters: { onlyErrors: false },
          purpose: 'Capture TTS console messages',
        },
      ],
    },
  ];
}

/**
 * Generate MCP call sequence for visual debugging workflow
 */
export function generateMCPCallSequence(workflow: WorkflowStep[]): Array<{
  step: number;
  name: string;
  tool: string;
  parameters: any;
  purpose: string;
}> {
  const calls: Array<{
    step: number;
    name: string;
    tool: string;
    parameters: any;
    purpose: string;
  }> = [];

  workflow.forEach(workflowStep => {
    workflowStep.mcpCalls.forEach(call => {
      calls.push({
        step: workflowStep.step,
        name: workflowStep.name,
        tool: call.tool,
        parameters: call.parameters,
        purpose: call.purpose,
      });
    });
  });

  return calls;
}

/**
 * Generate visual debugging workflow documentation
 */
export function generateWorkflowDocumentation(
  workflow: WorkflowStep[]
): string {
  const lines: string[] = [];

  lines.push('# Visual Debugging Workflow');
  lines.push('');
  lines.push(
    'This document describes the complete visual debugging workflow with'
  );
  lines.push('screenshot and snapshot capture at all key points.');
  lines.push('');
  lines.push('## Workflow Steps');
  lines.push('');

  workflow.forEach(step => {
    lines.push(`### Step ${step.step}: ${step.name}`);
    lines.push('');
    lines.push(`**Description:** ${step.description}`);
    lines.push('');
    lines.push(`**Capture Point:** \`${step.capturePoint}\``);
    lines.push('');
    lines.push('**Visual Debugging:**');
    lines.push(`- Screenshot: ${step.captureScreenshot ? '✅' : '❌'}`);
    lines.push(`- Snapshot: ${step.captureSnapshot ? '✅' : '❌'}`);
    lines.push(`- Full Page: ${step.fullPage ? '✅' : '❌'}`);
    lines.push('');
    lines.push('**MCP Calls:**');
    lines.push('');

    step.mcpCalls.forEach((call, index) => {
      lines.push(`${index + 1}. **${call.tool}**`);
      lines.push(`   - Purpose: ${call.purpose}`);
      lines.push(`   - Parameters:`);
      lines.push('   ```json');
      lines.push(
        '   ' +
          JSON.stringify(call.parameters, null, 2).split('\n').join('\n   ')
      );
      lines.push('   ```');
      lines.push('');
    });

    lines.push('---');
    lines.push('');
  });

  lines.push('## Artifact Organization');
  lines.push('');
  lines.push('All artifacts are organized in timestamped session directories:');
  lines.push('');
  lines.push('```');
  lines.push('debug/playwright-reports/');
  lines.push('  session-YYYYMMDD-HHMMSS/');
  lines.push('    screenshots/');
  lines.push('      {timestamp}-{capture-point}.png');
  lines.push('    snapshots/');
  lines.push('      {timestamp}-{capture-point}.txt');
  lines.push('    logs/');
  lines.push('      console-logs.json');
  lines.push('      network-requests.json');
  lines.push('    artifact-index.json');
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}
