# Inform users of model download

Published: October 1, 2025

Before any of the built-in AI APIs can be used, the underlying model and any customizations (such as fine-tunings) must be downloaded from the network, the compressed data be extracted, and finally be loaded into memory. This guide documents some of the best practices for improving the user experience as they wait for this download.

Note: The following examples use the Prompt API, but the concepts can be applied to all other built-in AI APIs (Summarizer API, Writer API, Rewriter API, Proofreader API, Translator API, Language Detector API).

## Monitor and share download progress

Every built-in AI API has the create() function to start a session. The create() function has a monitor option so you can access download progress to share it with the user.

Note: Some models may require fine tuning. The download progress monitor doesn't consider those as individual resources. Instead, it treats all resources as one and reports on overall download progress.

While built-in AI APIs are built for client-side AI, where data is processed in the browser and on the user's device, some applications can allow for data to be processed on a server. How you address your user in the model download progress is dependent on that question: does the data processing have to be run locally only or not? If this is true, your application is client-side only. If not, your application could use a hybrid implementation.

Note: To test the user experience as if the model wasn't downloaded yet, launch Chrome with the --user-data-dir flag set to an empty temporary directory to override your regular user data directory.

### Client-side only

In some scenarios, client-side data processing is required. For example, a healthcare application that allows for patients to ask questions about their personal information likely wants that information to remain private to the user's device. The user has to wait until the model and all customizations are downloaded and ready before they can use any data processing features.

In this case, if the model isn't already available, you should expose download progress information to the user.

```html
<style>
  progress[hidden] ~ label {
    display: none;
  }
</style>
<button type="button">Create LanguageModel session</button>
<progress hidden id="progress" value="0"></progress>
<label for="progress">Model download progress</label>
```

Now to make this functional, a bit of JavaScript is required. The code first resets the progress interface to the initial state (progress hidden and zero), checks if the API is supported at all, and then checks the API's availability:

- The API is 'unavailable': Your application cannot be used client-side on this device. Alert the user that the feature is unavailable.
- The API is 'available': The API can be used immediately, no need to show the progress UI.
- The API is 'downloadable' or 'downloading': The API can be used once the download is complete. Show a progress indicator and update it whenever the downloadprogress event fires.

Caution: Always pass the same options to the availability() function that you use in prompt() or promptStreaming(). This is critical to align model language and modality capabilities.

### Hybrid implementation

If you prefer to use client-side AI, but can temporarily send data to the cloud, you can set up a hybrid implementation. This means users can experience features immediately, while in parallel downloading the local model. Once the model is downloaded, dynamically switch to the local session.

Note: A real-world example of this pattern is the shopping site Miravia, which initially uses a server-side model to summarize product reviews while the built-in model is downloading. Once ready, the site switches to performing inference locally.

You can use any server-side implementation for hybrid, but it's probably best to stick with the same model family in both the cloud and locally to ensure you get comparable result quality.

## Conclusion

What category does your app fall into? Do you require 100% client-side processing or can you use a hybrid approach? After you've answered this question, the next step is to implement the model download strategy that works best for you.

Be sure your users always know when and if they can use your app client-side yet by showing them model download progress as outlined in this guide.

Remember that this isn't just a one-time challenge: if the browser purges the model due to storage pressure or when a new model version becomes available, the browser needs to download the model again.
