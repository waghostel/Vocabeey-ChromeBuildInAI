# Chrome Prompt API Test - MVP

A minimal test application to verify Chrome's built-in Prompt API with Gemini Nano.

## Prerequisites

Before running this test, you need:

1. **Chrome Canary** version **138.0.7190.0** or newer
   - Download: https://www.google.com/chrome/canary/

2. **At least 22 GB of free storage space**
   - The model requires significant space to download

3. **Hardware requirements met**
   - Check: https://developer.chrome.com/docs/ai/get-started#hardware

## Setup Instructions

### Step 1: Enable Required Flags

1. Open Chrome Canary and navigate to:

   ```
   chrome://flags/#optimization-guide-on-device-model
   ```

   Select: **Enabled BypassPerfRequirement**

2. Navigate to:

   ```
   chrome://flags/#prompt-api-for-gemini-nano-multimodal-input
   ```

   Select: **Enabled**

3. Click **Relaunch** to restart Chrome

### Step 2: Wait for Model Download

After restarting Chrome:

- The Gemini Nano model will download automatically
- This takes approximately **3-5 minutes** depending on your connection
- Keep Chrome running during this time

### Step 3: Verify Model is Ready

1. Open DevTools Console (F12)
2. Run this command:
   ```javascript
   await LanguageModel.availability();
   ```
3. Possible responses:
   - `"downloadable"` - Model not downloaded yet. Run `await LanguageModel.create()` to start download
   - `"after-download"` - Currently downloading, wait 3-5 minutes
   - `"available"` - Ready to use!
   - `"no"` - Not available (check hardware requirements)

## Running the Test

1. Open `index.html` in Chrome Canary
2. Wait for the status to show "✓ Ready! Gemini Nano is available."
3. Enter a prompt or click one of the examples
4. Click "Send Prompt" or press Ctrl+Enter
5. View the response from Gemini Nano

## Test Examples

Try these prompts:

- "Write a haiku about coding"
- "Explain what an API is in simple terms"
- "Give me 3 tips for better productivity"

## Troubleshooting

### "LanguageModel API not found"

- Make sure you enabled both required flags
- Restart Chrome Canary after enabling flags

### "Model not available"

- Check that you have at least 22 GB free storage
- Verify your hardware meets the requirements
- Wait 3-5 minutes for the model to download

### Model is downloading

- The page will show "Model is downloading..."
- Keep Chrome running and wait
- The page will auto-retry every 5 seconds

### Still not working?

- Check the full documentation: [Built-in AI Early Preview Program document]
- Report issues: https://goo.gle/chrome-ai-dev-preview-feedback-quality

## API Reference

### Basic Usage

```javascript
// Check availability
const availability = await LanguageModel.availability();

// Create session
const session = await LanguageModel.create();

// Send prompt
const result = await session.prompt('Your text here');

// Clean up
session.destroy();
```

### Advanced: Monitor Download Progress

```javascript
// Step 1: Check if the model is downloadable (optional, but good practice)
const availability = await LanguageModel.availability();

if (availability === 'downloadable' || availability === 'downloading') {
  // Step 2: Call create() and pass the monitor option
  const session = await LanguageModel.create({
    monitor(m) {
      // 'm' is the monitor object. Attach an event listener for progress.
      m.addEventListener('downloadprogress', event => {
        // 'event' contains 'loaded' and 'total' properties
        const loaded = event.loaded;
        const total = event.total;
        const percentage = Math.round((loaded / total) * 100);
        console.log(
          `Model Download Progress: ${percentage}% (${loaded} / ${total} bytes)`
        );

        // Update a progress bar or text element in your UI here
        // e.g., document.getElementById('progress-bar').value = percentage;
      });

      // You can also listen for the 'error' event on 'm'
      m.addEventListener('error', errorEvent => {
        console.error('Download failed:', errorEvent);
      });
    },
  });

  // The code here runs once the session is created AND the download is complete/model is ready
  console.log('Language Model session created and ready for use!');
  // You can now use: await session.prompt('...');
} else if (availability === 'available') {
  // Model is already on the device, just create the session
  const session = await LanguageModel.create();
  console.log('Model already available, session created.');
} else {
  console.log('Language Model is unavailable on this device.');
}
```

### Important Notes

- The namespace changed from `ai.languageModel` to `LanguageModel` in Chrome 138+
- Default context token size is 6144
- The model runs entirely on your device (no internet required after download)

## Resources

- [Prompt API Documentation](https://developer.chrome.com/docs/extensions/ai/prompt-api)
- [Prompt Design Strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)
- [GitHub Spec](https://github.com/webmachinelearning/prompt-api)

## License

This is a test/demo application for educational purposes.
