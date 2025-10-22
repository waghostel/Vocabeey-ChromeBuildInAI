# Structured output support for the Prompt API

Published: May 13, 2025

Large language models (LLMs) are notorious for their occasional lengthy responses. Even if you tell the model to answer with just "true" or "false," the model may respond with a friendly output and more than you asked for, such as: "Certainly, the answer is: true."

To address this challenge, the Prompt API lets you specify a JSON output format of the model's response by passing a JSON Schema to the LanguageModel.prompt() and LanguageModel.promptStreaming() methods. Structured output support is available as of Chrome version 137.

Important: Gemini Nano is a generative AI model. Before you build with APIs that use Gemini Nano, you should review the People + AI Guidebook for best practices, methods, and examples for designing with AI.

## What is JSON Schema

JSON Schema is a vocabulary that enables JSON data consistency, validity, and interoperability at scale. When it comes to data exchange, JSON Schema stands out as a powerful standard for defining the structure and rules of JSON data. It uses a set of keywords to define the properties of your data.

JSON Schema is the industry standard for ensuring structured output, used, among others, by the OpenAI API and Gemini API.

For example, you prompt the model to assign at most three hashtags for a post on an online social network, such as Mastodon. The ideal output could look similar to the following JSON:

```json
{
  "hashtags": ["#pottery", "#dyi"]
}
```

The corresponding JSON Schema for this requested output object shape would then look as follows:

```json
{
  "type": "object",
  "properties": {
    "hashtags": {
      "type": "array",
      "maxItems": 3,
      "items": {
        "type": "string",
        "pattern": "^#[^\\s#]+$"
      }
    }
  },
  "required": ["hashtags"],
  "additionalProperties": false
}
```

This JSON Schema defines a structure for an object that must contain a hashtags field with specific constraints.

Read the JSON Schema Basics documentation for a complete description of the format's capabilities.

In fact, LLMs are really good at creating JSON Schema. Describe the constraints in natural language in your prompt and provide a valid example JSON object, and you're halfway there.

## Pass a JSON Schema to the Prompt API

To make sure the model respects a requested JSON Schema, you need to pass the JSON Schema as an argument to the prompt() or the promptStreaming() methods' options object as the value of a responseConstraint field.

Here's a very basic JSON Schema example that makes sure the model responds with either true or false in classifying whether a given message is about pottery.

```javascript
const session = await LanguageModel.create();
const schema = {
  type: 'boolean',
};
const post =
  "Mugs and ramen bowls, both a bit smaller than intended- but that's how it goes with reclaim. Glaze crawled the first time around, but pretty happy with it after refiring.";
const result = await session.prompt(`Is this post about pottery?\n\n${post}`, {
  responseConstraint: schema,
});
console.log(JSON.parse(result)); // true
```

## Support predictable outputs

Structured output support for the Prompt API makes the responses of the LLM a lot more predictable. Rather than extracting an object from a Markdown response or other post-processing, developers can now assume the model's response is valid JSON.

This brings built-in AI one step closer to cloud-based APIs, with all the benefits of running local, client-side AI.
