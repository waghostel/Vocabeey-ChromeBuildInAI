A language learning google chrome extension convert article to clean reading mode

I would like build a chrome extension which can help user to learn langeuage by providing these feature:

1. A clean reading mode: Article of current tab will be purify and clean with Chrome build-in AI. It will first be rewrite and subdivided into several parts. Each part can be 1~3 paragraphs. For each part of the article, it display in a card shape object. The length of card shape object is determine by the length of each part of the article.

2. Hightlight feature, article part card, vocaburary card, and sentence card: There are two highlight mode, which let user highlight the new vocabulary and a good sentence, respectively. In the first highlight mode, user highlight the word or phrase will be created into a card shape object below the pragraph. In the card shape object, it display the vocaburary(or phrase), and the translation of the word. When user double click on the vocabularary card, it further shows 1 to 3 sentence which use this vocaburary(Which is created by the LLM). When user highlight the vocaburary or phrase, it will further add an effect where when user move mouse on the word, it display the the translation and sentance in a pop out. For the sentance highlight, it will only generate a translation of that sentance card, when user double click on the sentence card, it will also display the translation of that sentence in the sentence card. Both vocabularary and sentance card auto collapse after 1 sec. All the card other than that part of paragraph. In this design, only the keyword and sentence which has been shown in that part of article will be display underneath the part of article(which is also displaying in a card). User can click on the small left and right arrow on the left or right of webpage to switch between part of article. When user click on the word of vocaburary card, it directly pronounce the word.

3. Vocabulary learning mode: The part of article reading mode is a mode that user read and find unfamiliar word or interesting sentance. Where the vocaburary learning mode is the mode which help user to remember words. In this mode, There is no part of article being display in the card being shown. All the vocabularary cards which can be fill in the screen will be shown. There is dropdown select which let user to select display language A+B(default), language A(the language user is learning), language B(user’s native language). When selecting display only language A for example, language B will not be display at the card. It will only be shown as a pop up when user move cursor onto the card for 0.5 sec. These card will also display the sentence related to the vocaburary when double click on it.

4. Sentence mode: The user highlight sentence will be displayed in this page. As usual , user can click on the sentence to let the tts to pronounce it.

- Support local storage only
-

Main user settings

- Article length and rewrite: User can determine the length and hardness of article to be generated.
  A. Original length: Use the original length
  B. Short summary: A short summary with average 1~3 paragraphs
  C. Paragraph number: Number of paragraph user need
- Article hardness: User can choose the hardness of the article.
- Automatic vocaburary toggle: Automatic highlight the major vocaburary for user.
- Native language setting: User can set the native language(language B).
- API key: User can fill in the API key(connect by langchain to gemini) and choose gemini model. There is a toggle button which can toggle to chose the chrome build-in AI or other remote AI model(Support Gemini 2.5 pro, flash, light only)
- Article lists: A list of articles where user have been learn with this extension.
