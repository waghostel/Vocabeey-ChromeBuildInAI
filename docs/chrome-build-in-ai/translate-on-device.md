# Client-side translation with AI

Published: May 16, 2024, Last updated: November 13, 2024

| Explainer | Web        | Extensions | Chrome Status | Intent         |
| --------- | ---------- | ---------- | ------------- | -------------- |
| MDN       | Chrome 138 | Chrome 138 | View          | Intent to Ship |

Note: The following document was published for Google I/O 2024. While it's still a useful walkthrough, you may find the code isn't as up-to-date. Take a look at the Translator API documentation.

Expanding your business into international markets can be expensive. More markets likely means more languages to support, and more languages can lead to challenges with interactive features and flows, such as after-sale support chat. If your company only has English-speaking support agents, non-native speakers may find it difficult to explain exactly what problem they've encountered.

How can we use AI to improve the experience for speakers of multiple languages, while minimizing risk and confirming if it's worth investing in support agents who speak additional languages?

Some users try to overcome the language barrier with their browser's built-in page translation feature or third-party tools. But the user experience is sub-par with interactive features, like our after-sale support chat.

For chat tools with integrated translation, it's important to minimize delays. By processing language on device, you can translate in real-time, before the user even submits the message.

That said, transparency is critical when bridging a language gap with automated tools. Remember, before the conversation starts, make it clear you've implemented AI tools which allow for this translation. This sets expectations and helps avoid awkward moments if the translation isn't perfect. Link out to your policy with more information.

We're working on a client-side Translator API with a model built into Chrome.

### Review the hardware requirements

The Language Detector and Translator APIs work in Chrome on desktop. These APIs do not work on mobile devices. The Prompt API, Summarizer API, Writer API, Rewriter API, and Proofreader API work in Chrome when the following conditions are met:

- Operating system: Windows 10 or 11; macOS 13+ (Ventura and onwards); Linux; or ChromeOS (from Platform 16389.0.0 and onwards) on Chromebook Plus devices.
- Storage: At least 22 GB of free space on the volume that contains your Chrome profile.
- GPU: Strictly more than 4 GB of VRAM.
- Network: Unlimited data or an unmetered connection.

## Demo chat

We've built a customer support chat which allows for users to type in their first language and receive real-time translation for the support agent.

## Use the Translator API

To determine if the Translator API is supported, run the following feature detection snippet.

```javascript
if ('Translator' in self) {
  // The Translator API is supported.
}
```

### Check language pair support

Translation is managed with language packs, downloaded on demand. A language pack is like a dictionary for a given language.

- sourceLanguage: The current language for the text.
- targetLanguage: The final language the text should be translated into.

Use BCP 47 language short codes as strings. For example, 'es' for Spanish or 'fr' for French.

Determine the model availability and listen for the downloadprogress:

```javascript
const translator = await Translator.create({
  sourceLanguage: 'es',
  targetLanguage: 'fr',
  monitor(m) {
    m.addEventListener('downloadprogress', e => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});
```

If the download fails, then downloadprogress events stop and the ready promise is rejected.

### Create and run the translator

To create a translator, call the asynchronous create() function. It requires an options parameter with two fields, one for the sourceLanguage and one for the targetLanguage.

```javascript
// Create a translator that translates from English to French.
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
});
```

Once you have a translator, call the asynchronous translate() function to translate your text.

```javascript
await translator.translate('Where is the next bus stop, please?');
// "Où est le prochain arrêt de bus, s'il vous plaît ?"
```

## Next steps

We want to see what you're building with the Translator API. Share your websites and web applications with us on X, YouTube, and LinkedIn.

You can sign up for the Early Preview Program to test this API and others with local prototypes.
