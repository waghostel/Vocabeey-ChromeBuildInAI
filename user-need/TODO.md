## High

[ ] Language detection is not display correctly

# Medium

[ ] WHEN translation unavailabe, display retry button.

## Low

[ ] Copy the vocabulary, Sentence and Copy ALL
[ ] Create a sentence for each vocabularary
[ ] Popup message when user doesn't have Chrome build-in AI tool installation
[ ] Dark theme

## done

[x] Add delete context menu on vocabularary card
[x] Add delete on sentence card

Key Findings:

Only Translation API is actively used - You were correct! The other 4 Chrome Built-in AI APIs are fully implemented but sitting dormant.

What's implemented but unused:

Language Detector API - Could auto-detect article language
Summarizer API - Could create article summaries
Rewriter API - Could adapt content to difficulty level (this is actually a core feature that's coded but not exposed!)
Prompt API (Vocabulary Analyzer) - Could show difficulty levels and generate example sentences
Architecture is solid - Three-layer design (UI → Background → Offscreen) makes it easy to enable these features

Low-hanging fruit:

Language detection: 1-2 hours to enable
Article summarization: 4-6 hours
Difficulty-based rewriting: 8-12 hours (but it's a core feature!)
