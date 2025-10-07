# Built-in AI

Published: May 14, 2024, Last updated: May 20, 2024

We're developing web platform APIs and browser features designed to work with AI models, expert models, and large language models (LLMs), built in the browser. With built-in AI, your website or web application can perform AI-powered tasks, without needing to deploy, manage, or self-host models.

Discover the benefits of built-in AI, our implementation plan, and how you can start implementing these tools.

Important: Chrome implements built-in AI APIs with expert models and Gemini Nano. We continue to change and adapt the model as we test and address feedback.

If you're new to AI on the web, read our web AI glossary and concepts.

## Benefits of built-in AI for web developers

With built-in AI, your browser provides and manages foundation and expert models.

Key Term: Expert models focus on a specific use case, resulting in higher performance and quality. For example, the Translator API works with an expert model that's focused on translating content to new languages. Expert models tend to have low hardware requirements.

With built-in AI, your website connects with browser APIs to the local processor (CPU, GPU, or NPU). Then it communicates with a local model, which sends a response. The API returns the response.

Built-in AI offers the following benefits:

- Ease of deployment: The browser distributes the models, accounting for device capability, and manages updates. This means you aren't responsible for downloading or updating large models over a network. You don't have to solve for storage eviction, runtime memory budget, serving costs, and other challenges.
- Access to hardware acceleration: The browser's AI runtime is optimized to make the most out of the available hardware, whether with GPU, NPU, or falling back to CPU. Consequently, your app can get the best performance on each device.

## Benefits of running client-side

With built-in AI, you can perform AI client-side, which means you get these benefits:

- Local processing of sensitive data: Client-side AI can improve your privacy story. For example, if you work with sensitive data, you can offer AI features to users with end-to-end encryption.
- Snappy user experience: In some cases, ditching the round trip to the server means you can offer near-instant results. Client-side AI can be the difference between a viable feature and a sub-optimal user experience.
- Greater access to AI: Your users' devices can shoulder some of the processing load in exchange for more access to features. For example, if you offer premium AI features, you could preview these features with client-side AI so that potential customers can see the benefits of your product, without additional cost to you. This hybrid approach can also help you manage inference costs especially on frequently used user flows.
- Offline AI usage: Your users can access AI features even when there is no internet connection. This means your sites and web apps can work as expected offline or with variable connectivity.

### Hybrid AI: Client-side and server-side

While client-side AI can handle a large array of use cases, some use cases require server-side support. Server-side AI is a great option for large models, and it can support a wider range of platforms and devices.

You may consider a hybrid approach if your application requires:

- Complexity: Specific, approachable use cases are easier to support with on-device AI. For complex use cases, consider server-side implementation.
- Resiliency: Use server-side by default, and use on-device when the device is offline or on a spotty connection.
- Graceful fallback: Adoption of browsers with built-in AI will take time, some models may be unavailable, and older or less powerful devices may not meet the hardware requirements for running all models optimally. Offer server-side AI for those users.

For example, if you use the built-in Prompt API, the API is only available in Chrome Extensions, on Windows, macOS, and Linux. To make sure all of your users can benefit from your AI feature, set up a hybrid architecture with Firebase AI Logic.

## Access built-in AI

You can access built-in AI capabilities primarily with task APIs, such as the Translator API or the Summarizer API. Task APIs are designed to run inference against the best model for the assignment, be it a language or expert model.

Key Term: Fine tuning is a way to dynamically improve a model's ability to perform a specific task, without having to download a new model for each task.

## When to use built-in AI

Here are a few ways built-in AI can benefit you and your users:

- AI-enhanced content consumption: Including summarization, translation, categorization, characterization, and as a knowledge provider.
- AI-supported content creation: Such as writing assistance, proofreading, grammar correction, and rephrasing.

Several of the built-in AI APIs are available in Chrome stable and origin trials. Exploratory APIs and early-stage APIs are available to Early Preview Program (EPP) participants.

## Preview new features

We need your input to shape the APIs to help fulfill your use cases, and inform our discussions with other browser vendors for standardization.

Join the EPP to provide feedback on early-stage built-in AI ideas, and discover opportunities to test in-progress APIs through local prototyping.

Note: Giving feedback through the EPP helps us build the best features possible, and focuses on unreleased, early-stage tools. You can sign up for origin trials or use stable APIs without joining the EPP.

## Standardization effort

We're working to standardize all of these APIs for cross-browser compatibility.

The Language Detector API and Translator API have been adopted by the W3C WebML Working Group. We've asked Mozilla and WebKit for their standards positions.

The Summarizer API, Writer API, and Rewriter API have also been adopted by the W3C WebML Working Group. We've asked asked Mozilla and WebKit for their standards positions.
