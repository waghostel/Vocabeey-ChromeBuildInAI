/**
 * TTS Handler - Shared text-to-speech functionality for UI components
 * Provides click-to-pronounce with visual feedback and abort control
 */

let currentSpeakingElement: HTMLElement | null = null;
let isTTSActive = false;
let currentTTSAbortController: AbortController | null = null;
let currentTTSRetryIndicator: HTMLElement | null = null;

/**
 * Pronounce text with visual feedback on the clicked element
 */
export async function pronounceText(
  element: HTMLElement,
  text: string,
  language?: string
): Promise<void> {
  console.log('TTS: pronounceText called for:', text.substring(0, 30));

  // Check if clicking the same element (cancel action)
  if (isTTSActive && currentSpeakingElement === element) {
    console.log('TTS: Same element clicked, cancelling...');
    cancelTTS();
    return;
  }

  // If switching elements, abort the current TTS execution
  if (currentTTSAbortController) {
    console.log('TTS: Aborting previous TTS execution...');
    currentTTSAbortController.abort();
  }

  // Create new abort controller for this execution
  const abortController = new AbortController();
  currentTTSAbortController = abortController;

  try {
    const { speak, stopSpeaking, isTTSSupported } = await import(
      '../utils/tts-service.js'
    );

    // Check if aborted before proceeding
    if (abortController.signal.aborted) {
      console.log('TTS: Aborted before TTS check');
      return;
    }

    if (!isTTSSupported()) {
      showTooltip('Text-to-speech is not supported in your browser');
      return;
    }

    // Stop any ongoing speech immediately
    stopSpeaking();

    // Check if aborted after stopping
    if (abortController.signal.aborted) {
      console.log('TTS: Aborted after stopping previous speech');
      return;
    }

    // Remove speaking indicator from old element
    removeSpeakingIndicators();

    // Set TTS as active and update UI immediately
    isTTSActive = true;
    element.classList.add('speaking');
    currentSpeakingElement = element;

    // Show indicator
    showTTSRetryIndicator(text);

    console.log('TTS: Starting speech for:', text.substring(0, 30));

    // Speak the text with specified language
    await speak(text, { language });

    // Check if this execution was aborted during speech
    if (abortController.signal.aborted) {
      console.log('TTS: Aborted during speech');
      return;
    }

    // TTS completed successfully
    if (currentTTSAbortController === abortController) {
      console.log('TTS: Speech completed successfully');
      isTTSActive = false;
      hideTTSRetryIndicator();
      removeSpeakingIndicators();
      currentTTSAbortController = null;
    }
  } catch (error: unknown) {
    // Check if this execution was aborted
    if (abortController.signal.aborted) {
      console.log('TTS: Execution was aborted, ignoring error');
      return;
    }

    console.error('TTS error:', error);

    const ttsError = error as { type?: string; message?: string };
    const wasCancelled = ttsError.type === 'cancelled';

    // Only clean up if this is still the current execution
    if (currentTTSAbortController === abortController) {
      if (!wasCancelled) {
        isTTSActive = false;
        hideTTSRetryIndicator();
        removeSpeakingIndicators();
        currentTTSAbortController = null;

        // Show user-friendly error message
        if (ttsError.message?.includes('after retries')) {
          showTooltip(
            'Speech failed after 3 attempts. Check console for details.'
          );
        } else if (ttsError.message?.includes('not supported')) {
          showTooltip('Text-to-speech is not supported in your browser');
        } else {
          showTooltip('Speech synthesis failed');
        }
      }
    }
  }
}

/**
 * Cancel current TTS playback
 */
export async function cancelTTS(): Promise<void> {
  if (currentTTSAbortController) {
    currentTTSAbortController.abort();
    currentTTSAbortController = null;
  }

  isTTSActive = false;
  const { stopSpeaking } = await import('../utils/tts-service.js');
  stopSpeaking();
  hideTTSRetryIndicator();
  removeSpeakingIndicators();
}

/**
 * Remove speaking indicators from all elements
 */
function removeSpeakingIndicators(): void {
  if (currentSpeakingElement) {
    currentSpeakingElement.classList.remove('speaking');
    currentSpeakingElement = null;
  }

  // Defensive cleanup
  const speakingElements = document.querySelectorAll('.speaking');
  if (speakingElements.length > 0) {
    console.log(
      'TTS: Cleaning up',
      speakingElements.length,
      'orphaned .speaking classes'
    );
    speakingElements.forEach(el => {
      el.classList.remove('speaking');
    });
  }
}

/**
 * Show tooltip message
 */
function showTooltip(message: string): void {
  const tooltip = document.createElement('div');
  tooltip.className = 'tts-tooltip';
  tooltip.textContent = message;
  tooltip.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #333;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(tooltip);

  setTimeout(() => {
    tooltip.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => tooltip.remove(), 300);
  }, 3000);
}

/**
 * Update TTS retry indicator content
 */
function updateTTSRetryIndicator(text: string): void {
  if (!currentTTSRetryIndicator) {
    console.warn('TTS: Indicator not found, recreating...');
    currentTTSRetryIndicator = null;
    showTTSRetryIndicator(text);
    return;
  }

  if (!document.body.contains(currentTTSRetryIndicator)) {
    console.warn('TTS: Indicator not in DOM, recreating...');
    currentTTSRetryIndicator = null;
    showTTSRetryIndicator(text);
    return;
  }

  const truncatedText = text.length > 30 ? text.substring(0, 30) + '...' : text;
  const messageElement =
    currentTTSRetryIndicator.querySelector('.tts-retry-message');
  if (messageElement) {
    messageElement.textContent = `"${truncatedText}"`;
  } else {
    console.warn('TTS: Message element not found, recreating...');
    currentTTSRetryIndicator.remove();
    currentTTSRetryIndicator = null;
    showTTSRetryIndicator(text);
  }
}

/**
 * Show TTS retry indicator
 */
function showTTSRetryIndicator(text: string): void {
  if (currentTTSRetryIndicator) {
    updateTTSRetryIndicator(text);
    return;
  }

  const indicator = document.createElement('div');
  indicator.className = 'tts-retry-indicator';

  const truncatedText = text.length > 30 ? text.substring(0, 30) + '...' : text;

  indicator.innerHTML = `
    <div class="tts-retry-content">
      <span class="tts-retry-icon">🔊</span>
      <div class="tts-retry-text">
        <div class="tts-retry-label">Speaking</div>
        <div class="tts-retry-message">"${truncatedText}"</div>
      </div>
      <button class="tts-cancel-btn">Cancel</button>
    </div>
  `;

  document.body.appendChild(indicator);
  currentTTSRetryIndicator = indicator;

  const cancelBtn = indicator.querySelector('.tts-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      void cancelTTS();
    });
  }
}

/**
 * Hide TTS retry indicator
 */
function hideTTSRetryIndicator(): void {
  if (currentTTSRetryIndicator) {
    currentTTSRetryIndicator.remove();
    currentTTSRetryIndicator = null;
  }
}
