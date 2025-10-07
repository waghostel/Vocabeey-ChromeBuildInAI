# Rewriter API

Published: May 20, 2025

| Explainer | Web          | Extensions   | Chrome Status | Intent               |
| --------- | ------------ | ------------ | ------------- | -------------------- |
| GitHub    | Origin trial | Origin trial | View          | Intent to Experiment |

The Rewriter API helps you revise and restructure text. This API and the Writer API are part of the Writing Assistance APIs proposal.

These APIs can help you improve content created by users.

Important: Gemini Nano is a generative AI model. Before you build with APIs that use Gemini Nano, you should review the People + AI Guidebook for best practices, methods, and examples for designing with AI.

### Use cases

Refine existing text by making it longer or shorter, or changing the tone. For example, you could:

- Rewrite a short email so that it sounds more polite and formal.
- Suggest edits to customer reviews to help other customers understand the feedback or remove toxicity.
- Format content to meet the expectations of certain audiences.

Is your use case missing? Join the early preview program to share your feedback.

## Get started

Join the Rewriter API origin trial, running in Chrome 137 to 142.

### Review the hardware requirements

The following requirements exist for developers and the users who operate features using these APIs in Chrome. Other browsers may have different operating requirements.

The Language Detector and Translator APIs work in Chrome on desktop. These APIs do not work on mobile devices. The Prompt API, Summarizer API, Writer API, Rewriter API, and Proofreader API work in Chrome when the following conditions are met:

- Operating system: Windows 10 or 11; macOS 13+ (Ventura and onwards); Linux; or ChromeOS (from Platform 16389.0.0 and onwards) on Chromebook Plus devices.
- Storage: At least 22 GB of free space on the volume that contains your Chrome profile.
- GPU: Strictly more than 4 GB of VRAM.
- Network: Unlimited data or an unmetered connection.

### Sign up for the origin trial

The Rewriter API is available in a joint origin trial with the Writer API. To start using these APIs:

1. Acknowledge Google's Generative AI Prohibited Uses Policy.
2. Go to the Rewriter API origin trial.
3. Click Register and fill out the form.
4. To submit, click Register.
5. Copy the token provided, and add it to every participating web page on your origin or include it in your Extension manifest.
6. Start using the Rewriter API.

### Add support to localhost

To access the Writer and Rewriter APIs on localhost during the origin trial:

1. Go to chrome://flags/#rewriter-api-for-gemini-nano.
2. Select Enabled.
3. Click Relaunch or restart Chrome.

## Use the Rewriter API

First, run feature detection to see if the browser supports these APIs.

```javascript
if ('Rewriter' in self) {
  // The Rewriter API is supported.
}
```

To determine if the model is ready to use, call the asynchronous Rewriter.availability() function.

```javascript
const availability = await Rewriter.availability();
```

To trigger model download and start the rewriter, check for user activation and call the Rewriter.create() function.

```javascript
const rewriter = await Rewriter.create({
  monitor(m) {
    m.addEventListener('downloadprogress', e => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});
```

### API functions

The create() function lets you configure a new rewriter object. It takes an optional options object with the following parameters:

- tone: Writing tone can refer to the style, character, or attitude of the content. The value can be set to more-formal, as-is (default), or more-casual.
- format: The output formatting, with the allowed values as-is (default), markdown, and plain-text.
- length: The length of the output, with the allowed values shorter, as-is (default), and longer.
- sharedContext: When rewriting multiple pieces of content, a shared context can help the model create content better aligned with your expectations.

### Start rewriting

There are two ways to output content from the model: non-streaming and streaming.

#### Non-streaming output

```javascript
const rewriter = await Rewriter.create({
  sharedContext: 'A review for the Flux Capacitor 3000 from TimeMachines Inc.',
});
const result = await rewriter.rewrite(reviewEl.textContent, {
  context: 'Avoid any toxic language and be as constructive as possible.',
});
```

#### Stream rewriting output

```javascript
const rewriter = await Rewriter.create({
  sharedContext: 'A review for the Flux Capacitor 3000 from TimeMachines Inc.',
});
const stream = rewriter.rewriteStreaming(reviewEl.textContent, {
  context: 'Avoid any toxic language and be as constructive as possible.',
  tone: 'more-casual',
});
for await (const chunk of stream) {
  composeTextbox.append(chunk);
}
```

## Permission Policy, iframes, and Web Workers

By default, the Rewriter API is only available to top-level windows and to their same-origin iframes. Access to the API can be delegated to cross-origin iframes using the Permission Policy allow="" attribute:

```html
<iframe src="https://cross-origin.example.com/" allow="rewriter"></iframe>
```

The Rewriter API isn't available in Web Workers.

## Engage and share feedback

The Writer and Rewriter APIs are under active discussion and subject to change in the future. If you try this API and have feedback, we'd love to hear it.

- Read the explainer, raise questions and participate in discussion.
- Review the implementation for Chrome on Chrome Status.
- Join the early preview program for an early look at new APIs and access to our mailing list.
- If you have feedback on Chrome's implementation, file a Chromium bug.
