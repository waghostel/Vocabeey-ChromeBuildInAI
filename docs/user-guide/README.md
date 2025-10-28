# User Guide

## Getting Started with Language Learning Assistant

Transform any web article into an interactive language learning experience using Chrome's built-in AI APIs.

## Installation

### System Requirements

- **Chrome Browser**: Version 140 or later (required for Chrome Built-in AI APIs)
- **Operating System**: Windows 10+, macOS 13+, Linux, or ChromeOS
- **Hardware**: 4GB RAM minimum, 8GB recommended for optimal AI processing
- **Internet**: Required for article processing and optional Gemini API fallback

### Install the Extension

1. Load the extension in Chrome Developer Mode (currently in development)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The Language Learning Assistant icon will appear in your toolbar

### First-Time Setup

After installation, the setup wizard will guide you through:

1. **Welcome Screen**: Overview of features and capabilities
2. **Language Selection**: Choose your learning language and native language for translations
3. **Learning Preferences**: Set your difficulty level (1-10 scale) and auto-highlight preferences
4. **API Configuration**: Optionally add Gemini API key for extended features and Jina Reader API for better content extraction
5. **Tutorial**: Interactive walkthrough with Alice in Wonderland sample content

## Basic Usage

### Processing an Article

1. **Navigate to an Article**: Visit any webpage with article content
2. **Click Extension Icon**: Click the Language Learning Assistant icon in your toolbar
3. **Automatic Extraction**: The extension automatically extracts and processes the content
4. **Learning Interface Opens**: A new tab opens with the processed article in learning mode

### Learning Interface Overview

The learning interface has three main modes accessible via navigation tabs:

#### Reading Mode (Default)

- **Article Header**: Shows title, URL, and detected language
- **Highlight Mode Selector**: Choose between Vocabulary, Sentences, or None
- **Article Content**: Clean, readable text split into manageable parts
- **Interactive Highlighting**: Click/select text to create vocabulary or sentence cards
- **Navigation Controls**: Previous/Next buttons and part indicator
- **Real-time Cards**: Vocabulary and sentence cards appear below the article content

#### Vocabulary Mode

- **Learning Grid**: All highlighted vocabulary displayed in card format
- **Display Options**: Toggle between showing both languages, learning language only, or native language only
- **Click to Pronounce**: Click any vocabulary card to hear pronunciation
- **Progress Tracking**: Review count and difficulty level for each word

#### Sentences Mode

- **Sentence Collection**: All highlighted sentences with translations
- **Pronunciation Support**: Click speaker button to hear sentence pronunciation
- **Contextual Learning**: Sentences maintain their original context from the article

## Core Features

### Content Processing

#### Automatic Content Extraction

- Intelligently extracts main article content from web pages
- Removes ads, navigation, sidebars, and other clutter
- Uses multiple extraction strategies (article tags, main elements, content selectors)
- Validates content quality with minimum length requirements

#### AI-Powered Language Detection

- Automatically detects article language using Chrome's Built-in AI
- Supports major world languages including English, Spanish, French, German, Italian, Portuguese, Japanese, and Chinese
- Falls back to Gemini API for extended language support

#### Smart Content Processing

- Splits long articles into digestible parts for better learning
- Maintains original content structure and context
- Processes content using Chrome's Built-in AI APIs with Gemini fallback

### Interactive Learning Tools

#### Vocabulary Highlighting System

1. **Select Highlight Mode**: Choose "📝 Vocabulary" from the highlight mode selector
2. **Click Words**: Select 1-3 words to create vocabulary cards
3. **Instant Translation**: Get context-aware translations using AI
4. **Hover for Quick View**: Hover over highlighted words to see translations
5. **Pronunciation**: Click highlighted words or speaker icons for text-to-speech
6. **Context Preservation**: Each vocabulary item includes surrounding context

#### Sentence Learning System

1. **Select Highlight Mode**: Choose "💬 Sentences" from the highlight mode selector
2. **Select Sentences**: Highlight complete sentences (minimum 10 characters)
3. **Contextual Translation**: Get sentence-level translations that consider article context
4. **Pronunciation Support**: Click speaker buttons to hear sentence pronunciation
5. **Original Comparison**: View original and translated versions side by side

#### Advanced Text-to-Speech

- **Web Speech API Integration**: Uses browser's native speech synthesis
- **Multi-language Support**: Automatically selects appropriate voice for detected language
- **Voice Selection**: Chooses best available voice with language matching
- **Visual Feedback**: Shows speaking indicator and stop controls during playback
- **Error Handling**: Graceful fallback when TTS is unavailable

## Advanced Features

### Settings and Customization

Access settings through the dedicated settings interface:

#### Language Configuration

- **Learning Language**: Select the language you want to learn (auto-detected from articles)
- **Native Language**: Your first language for translations (default: English)
- **Language Validation**: Prevents selecting the same language for both learning and native

#### Learning Preferences

- **Difficulty Level**: Slider from 1-10 to adjust content complexity
  - **Beginner (1-3)**: Simpler vocabulary and sentence structures
  - **Intermediate (4-7)**: Balanced complexity with natural language
  - **Advanced (8-10)**: Preserve original complexity and technical terms
- **Auto Highlight**: Toggle automatic highlighting of new vocabulary
- **Font Size**: Adjustable text size (slider control) for comfortable reading

#### API Configuration

- **Chrome Built-in AI**: Primary AI service (requires Chrome 140+)
- **Gemini API Key**: Optional fallback for extended language support and features
- **Jina Reader API Key**: Optional service for enhanced content extraction from complex websites
- **Secure Storage**: API keys stored securely in Chrome's extension storage

#### Appearance Settings

- **Dark Mode**: Toggle between light and dark themes
- **Display Modes**: In vocabulary learning mode, choose between:
  - **Both Languages (A + B)**: Show word and translation
  - **Learning Only (A only)**: Show only the learning language
  - **Native Only (B only)**: Show only translations

### Data Management

#### Privacy and Storage

- **Local-First Architecture**: All learning data stored locally on your device
- **No Telemetry**: Extension doesn't track usage or send analytics
- **Chrome Storage API**: Uses secure browser storage for all data
- **Storage Monitoring**: Real-time display of storage usage with visual indicators

#### Import and Export

- **JSON Export**: Export all vocabulary, sentences, and settings as JSON
- **Data Import**: Import previously exported data to restore learning progress
- **Backup Creation**: Automatic filename generation with date stamps
- **Settings Migration**: Export and import user preferences

#### Storage Management

- **Storage Quota Display**: Visual progress bar showing used vs. available storage
- **Usage Statistics**: Shows storage in MB and percentage used
- **Clear All Data**: Complete data reset with double confirmation for safety
- **Selective Cleanup**: Remove specific articles or vocabulary items

## Keyboard Shortcuts

### Navigation Controls

- **← (Left Arrow)**: Navigate to previous article part
- **→ (Right Arrow)**: Navigate to next article part
- **Home**: Jump to first article part
- **End**: Jump to last article part

### Mode Switching

- **R**: Switch to Reading mode (📖)
- **V**: Switch to Vocabulary mode (📝)
- **S**: Switch to Sentences mode (💬)

### Learning Interactions

- **Click**: Highlight vocabulary (in vocabulary mode) or pronounce highlighted text
- **Text Selection**: Highlight sentences (in sentence mode)
- **Hover**: Show translation popup for highlighted vocabulary
- **Right-click**: Open context menu for highlighted items (edit/remove options)

### Interface Controls

- **Escape**: Close context menus and popups
- **Tab**: Navigate between interface elements
- **Enter**: Activate buttons and controls

### Customization

Keyboard shortcuts are defined in the user settings and can be customized:

```typescript
keyboardShortcuts: {
  navigateLeft: 'ArrowLeft',
  navigateRight: 'ArrowRight',
  vocabularyMode: 'v',
  sentenceMode: 's',
  readingMode: 'r'
}
```

Note: Keyboard shortcuts are ignored when typing in input fields or text areas.

## Troubleshooting

### Common Issues

#### Extension Not Responding

**Problem**: Extension icon is inactive or not responding to clicks
**Solutions**:

- Verify you're on a webpage with article content (not Chrome internal pages)
- Check Chrome version - requires Chrome 140+ for Built-in AI APIs
- Refresh the page and try clicking the extension icon again
- Check if the page has content extraction restrictions (paywall, login required)
- Look for error notifications in the top-right corner of the page

#### Content Extraction Failures

**Problem**: "Could not find article content on this page" notification appears
**Solutions**:

- Try a different article or news website with clear article structure
- Ensure the page has substantial text content (minimum 100 characters)
- Check if the page uses standard HTML article tags or content containers
- Consider adding a Jina Reader API key in settings for better extraction from complex sites
- Avoid pages with heavy JavaScript rendering or dynamic content loading

#### AI Processing Issues

**Problem**: Translation or processing fails with error messages
**Solutions**:

- Verify Chrome 140+ is installed and Chrome Built-in AI is available
- Add a Gemini API key in settings as a fallback option
- Check internet connection for API calls
- Try with shorter text selections (1-3 words for vocabulary, complete sentences only)
- Ensure the detected language is supported by the AI services

#### Text-to-Speech Problems

**Problem**: Pronunciation doesn't work or shows "not supported" message
**Solutions**:

- Verify your browser supports the Web Speech API
- Check if voices are available for the detected language
- Try different text selections or shorter phrases
- Ensure audio is not muted and volume is adequate
- Wait for voices to load (may take a few seconds on first use)

### Performance Issues

#### High Memory Usage

**Problem**: Browser becomes slow or shows memory warnings
**Solutions**:

- Monitor memory usage with the built-in memory indicator
- Use the cleanup button when memory warnings appear
- Close unused learning interface tabs
- Clear old articles and vocabulary from storage
- Restart Chrome to free up memory

#### Slow Article Processing

**Problem**: Long delays when processing articles
**Solutions**:

- Try shorter articles first (under 1000 words)
- Close other resource-intensive browser tabs
- Check available system RAM (4GB minimum, 8GB recommended)
- Consider using Gemini API which may be faster for some operations

### Storage and Data Issues

#### Storage Quota Warnings

**Problem**: "Storage quota exceeded" or high storage usage warnings
**Solutions**:

- Use the storage management tools in settings
- Export vocabulary and articles before clearing data
- Remove old or unused articles from storage
- Clear all data if necessary (with backup first)

#### Settings Not Saving

**Problem**: Configuration changes don't persist
**Solutions**:

- Ensure you click "Save Settings" after making changes
- Check for error messages in the settings interface
- Verify Chrome storage permissions are granted
- Try resetting to defaults and reconfiguring

### API and Network Errors

#### "Chrome AI Not Available"

- **Cause**: Chrome Built-in AI APIs not supported or enabled
- **Solution**: Update to Chrome 140+, check hardware requirements, or add Gemini API key

#### "Translation failed" Messages

- **Cause**: AI service unavailable or unsupported language pair
- **Solution**: Verify language settings, check API key configuration, ensure internet connectivity

#### "Network Error" During Processing

- **Cause**: Internet connection issues or API service problems
- **Solution**: Check network connection, try again later, verify API keys are valid

### Interface and Interaction Issues

#### Highlighting Not Working

**Problem**: Text selection doesn't create vocabulary or sentence cards
**Solutions**:

- Ensure correct highlight mode is selected (Vocabulary/Sentences)
- Select appropriate text length (1-3 words for vocabulary, complete sentences)
- Click within the article content area, not in headers or navigation
- Check that highlight mode is not set to "None"

#### Cards Not Displaying

**Problem**: Vocabulary or sentence cards don't appear after highlighting
**Solutions**:

- Check the cards sections below the article content
- Switch to Vocabulary or Sentences mode to see all collected items
- Verify the highlighting was successful (text should be visually highlighted)
- Look for error messages about translation failures

## Tips for Effective Learning

### Getting Started

1. **Complete the Setup Wizard**: Use the Alice in Wonderland tutorial to familiarize yourself with all features
2. **Start with Familiar Topics**: Choose articles about subjects you already know to build confidence
3. **Set Appropriate Difficulty**: Begin with level 5 and adjust based on comfort (3-4 for beginners, 7-8 for advanced)
4. **Use Chrome 140+**: Ensure you have the latest Chrome version for optimal AI performance

### Building Vocabulary Effectively

1. **Strategic Highlighting**: Focus on 5-10 new words per article for better retention
2. **Context Matters**: Pay attention to the context shown in vocabulary cards
3. **Use Pronunciation**: Click highlighted words and speaker icons to improve pronunciation
4. **Review Regularly**: Switch to Vocabulary mode to review all collected words
5. **Export for Spaced Repetition**: Export vocabulary data to use with external flashcard apps

### Mastering Sentence Learning

1. **Select Complete Sentences**: Highlight full sentences (minimum 10 characters) for better context
2. **Compare Translations**: Study how sentence structure differs between languages
3. **Practice Pronunciation**: Use the speaker button to hear natural sentence flow
4. **Focus on Grammar Patterns**: Look for recurring grammatical structures in translations

### Optimizing Your Workflow

1. **Use Display Modes**: In Vocabulary mode, toggle between showing both languages, learning only, or native only
2. **Navigate Efficiently**: Use arrow keys to move between article parts quickly
3. **Manage Storage**: Regularly export and clean up old articles to maintain performance
4. **Leverage Keyboard Shortcuts**: Use R/V/S keys to switch between modes quickly

### Memory and Retention Strategies

1. **Active Engagement**: Don't just read - actively highlight and interact with the content
2. **Multiple Exposures**: Return to processed articles to reinforce learning
3. **Cross-Modal Learning**: Combine reading, listening (TTS), and translation for better retention
4. **Progressive Difficulty**: Gradually increase difficulty level as you improve

## Privacy and Security

### Data Protection

- **Local-First Architecture**: All learning data (vocabulary, sentences, articles) stored locally using Chrome's storage APIs
- **No Telemetry or Analytics**: Extension doesn't track your usage, reading habits, or send any analytics data
- **Chrome Storage Security**: Uses Chrome's secure extension storage with built-in encryption
- **User-Controlled Data**: Complete control over data export, import, and deletion through settings interface
- **No External Servers**: Core functionality works without sending data to external servers (except for optional API services)

### API Key Security

- **User-Provided Keys**: You provide and manage your own Gemini and Jina Reader API keys
- **Secure Storage**: API keys stored securely in Chrome's extension storage, never in plain text
- **No Key Sharing**: Keys never transmitted to third parties or shared with other services
- **Easy Management**: Add, update, or remove API keys anytime through the settings interface
- **Optional Usage**: API keys are optional - core features work with Chrome's Built-in AI

### Content Privacy

- **Local Processing**: Article content processed locally when using Chrome's Built-in AI
- **No Content Logging**: Extension doesn't log, store, or transmit your reading history
- **Secure API Calls**: When using external APIs (Gemini, Jina Reader), connections use HTTPS encryption
- **User Consent**: All features require explicit user action - no automatic data collection
- **Content Isolation**: Each article's data is isolated and can be individually deleted

### Extension Permissions

The extension requests minimal permissions:

- **storage**: Store learning data locally
- **activeTab**: Access current tab for content extraction
- **scripting**: Inject content scripts for article extraction
- **offscreen**: Create offscreen documents for AI processing
- **tabs**: Open learning interface in new tabs
- **host_permissions**: Access web pages for content extraction (only when user clicks extension icon)

## Related Documentation

- **[Development Guide](../development/README.md)** - Setup and contribution guidelines
- **[API Reference](../api/README.md)** - Chrome AI integration details
- **[Architecture Overview](../architecture/README.md)** - Technical system design
- **[Testing Guide](../testing/README.md)** - Test suite and coverage

## Support and Feedback

### Getting Help

1. **Consult this User Guide**: Check the comprehensive troubleshooting section for common issues
2. **Review Extension Settings**: Verify language settings, API keys, and difficulty levels
3. **Check Chrome Version**: Ensure Chrome 140+ is installed for Built-in AI support
4. **Test with Different Articles**: Try various websites to isolate content extraction issues
5. **Monitor Browser Console**: Check for error messages in Chrome Developer Tools

### Reporting Issues

When reporting problems, please include:

- **Chrome Version**: Found in `chrome://version/`
- **Operating System**: Windows, macOS, Linux, or ChromeOS version
- **Article URL**: If not private or sensitive
- **Error Messages**: Any notifications or console errors
- **Steps to Reproduce**: Detailed sequence of actions that caused the issue
- **Extension Settings**: Current language and difficulty settings
- **API Configuration**: Whether using Gemini or Jina Reader APIs (don't include actual keys)

### Development and Contributions

This extension is currently in development:

- **Source Code**: Available for review and contributions
- **Issue Tracking**: Report bugs and request features through the project repository
- **Development Setup**: Follow the development guide for local setup and testing
- **Code Quality**: All contributions must pass linting, type checking, and tests

### Feature Requests

We welcome suggestions for improvements:

- **Additional Language Support**: Request support for specific language pairs
- **UI/UX Enhancements**: Suggest interface improvements or new interaction patterns
- **Learning Features**: Propose new learning tools or study methods
- **Integration Ideas**: Suggest integrations with other learning platforms or tools
- **Performance Optimizations**: Ideas for improving speed or memory usage

### Community and Learning

- **Best Practices**: Share effective learning strategies with the extension
- **Language Learning Tips**: Exchange advice on using the tool for different languages
- **Content Recommendations**: Suggest good websites or articles for language learning
- **Study Methods**: Discuss how to integrate the extension into broader language learning routines

## Frequently Asked Questions

### General Questions

**Q: Is the extension free to use?**
A: Yes, the core features using Chrome's Built-in AI are completely free. Optional Gemini and Jina Reader APIs require your own API keys and may have associated costs based on usage.

**Q: What languages are supported?**
A: Chrome's Built-in AI supports major languages including English, Spanish, French, German, Italian, Portuguese, Japanese, and Chinese. Gemini API extends support to 100+ additional languages.

**Q: Does it work offline?**
A: Previously processed articles and vocabulary work offline. New article processing and translation require internet connection for AI services.

**Q: Can I use it on mobile devices?**
A: Currently designed for desktop Chrome only. Mobile Chrome doesn't support the required Chrome Built-in AI APIs or extension architecture.

### Technical Questions

**Q: Why do I need Chrome 140 or later?**
A: Chrome's Built-in AI APIs (Summarizer, Translator, Rewriter, Language Detector) were introduced in version 140. Earlier versions lack these essential AI capabilities.

**Q: How much storage space does it use?**
A: Typically 10-50MB depending on usage. The extension includes a storage monitor and cleanup tools. Each article uses approximately 50-200KB depending on length and vocabulary collected.

**Q: Can I sync data across multiple devices?**
A: Data is stored locally per Chrome installation. Use the export/import functionality in settings to manually transfer data between devices.

**Q: Is my learning data secure and private?**
A: Yes, all vocabulary, sentences, and articles are stored locally using Chrome's secure storage APIs. No learning data is transmitted to external servers except when using optional API services with your own keys.

**Q: What happens if I uninstall the extension?**
A: All local data (vocabulary, articles, settings) will be permanently deleted. Export your data first if you want to preserve it.

### Learning and Usage Questions

**Q: What difficulty level should I start with?**
A: Begin with level 5 (intermediate) and adjust based on your experience. Beginners (levels 1-3) get simpler vocabulary, while advanced learners (levels 7-10) see more complex language preserved.

**Q: How many words should I highlight per article?**
A: Focus on 5-10 new vocabulary items per article for optimal retention. Quality and regular review are more important than quantity.

**Q: Should I use vocabulary mode or sentence mode?**
A: Use both! Vocabulary mode is great for building word knowledge, while sentence mode helps with grammar and context understanding. Start with vocabulary, then add sentences.

**Q: How do I get the best pronunciation results?**
A: The extension uses your browser's built-in text-to-speech. For best results, ensure your system has voices installed for your learning language. Chrome will automatically select the best available voice.

**Q: Can I edit or remove highlighted items?**
A: Yes, right-click on any highlighted vocabulary or sentence to access edit and remove options through the context menu.

### Setup and Configuration Questions

**Q: Do I need API keys to use the extension?**
A: No, API keys are optional. Chrome's Built-in AI provides core functionality. Add Gemini API for extended language support and Jina Reader API for better content extraction from complex websites.

**Q: How do I know if Chrome Built-in AI is working?**
A: The extension will show error messages if Chrome AI is unavailable. Ensure you have Chrome 140+, sufficient system resources (4GB+ RAM), and that AI features aren't disabled by enterprise policies.

**Q: What should I do if content extraction fails?**
A: Try different articles or websites, ensure the page has substantial text content, and consider adding a Jina Reader API key for better extraction from complex sites with heavy JavaScript or unusual layouts.

This comprehensive user guide covers all aspects of the Language Learning Assistant extension. For additional technical support, refer to the troubleshooting section or check the extension's development documentation.
