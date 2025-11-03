# Requirements Document

## Introduction

This document specifies the requirements for adding an Edit Paragraph feature to the Language Learning Chrome Extension. The feature allows users to modify paragraph text in the reading interface through a context menu action. This MVP implementation takes a simple approach: editing a paragraph will remove all associated highlights (vocabulary and sentence) from that paragraph, providing a clean slate for the user to re-highlight content as needed after editing.

## Glossary

- **Learning Interface**: The full-page UI where users read articles and interact with learning features
- **Paragraph**: A single `<p>` element within the article content area
- **Context Menu**: The right-click menu that appears when users interact with paragraphs or highlights
- **Highlight**: A vocabulary or sentence item that has been marked by the user for learning
- **Edit Mode**: The state when a paragraph becomes editable (contenteditable)
- **Article Part**: A section of the article content, stored in the ProcessedArticle data structure
- **Session Storage**: Chrome's session storage where article data is temporarily stored
- **Local Storage**: Chrome's local storage where vocabulary and sentence items are persisted

## Requirements

### Requirement 1: Context Menu Edit Option

**User Story:** As a language learner, I want to see an "Edit" option when I right-click on a paragraph, so that I can correct errors or modify text for better understanding.

#### Acceptance Criteria

1. WHEN the user right-clicks on a paragraph in the article content area, THE Learning Interface SHALL display a context menu containing both "Copy" and "Edit" options
2. WHEN the user right-clicks on a highlight element within a paragraph, THE Learning Interface SHALL display the highlight context menu and SHALL NOT display the paragraph context menu
3. WHEN the user right-clicks on plain text within a paragraph, THE Learning Interface SHALL display the paragraph context menu with "Edit" and "Copy" options

### Requirement 2: Edit Mode Activation with Warning

**User Story:** As a language learner, I want to be warned before editing a paragraph that contains highlights, so that I understand the consequences of my action.

#### Acceptance Criteria

1. WHEN the user clicks the "Edit" option on a paragraph that contains vocabulary or sentence highlights, THE Learning Interface SHALL display a confirmation dialog warning that editing will remove all highlights from the paragraph
2. WHEN the user clicks the "Edit" option on a paragraph that contains no highlights, THE Learning Interface SHALL immediately enable edit mode without showing a warning dialog
3. WHEN the user clicks "Cancel" in the confirmation dialog, THE Learning Interface SHALL close the dialog and SHALL NOT enable edit mode
4. WHEN the user clicks "Confirm" in the confirmation dialog, THE Learning Interface SHALL enable edit mode and SHALL remove all highlights from the paragraph
5. THE confirmation dialog SHALL display the count of vocabulary and sentence highlights that will be removed

### Requirement 3: Edit Mode Interface

**User Story:** As a language learner, I want a clear interface for editing paragraph text, so that I can make changes easily and know how to save or cancel my edits.

#### Acceptance Criteria

1. WHEN edit mode is enabled for a paragraph, THE Learning Interface SHALL make the paragraph contenteditable
2. WHEN edit mode is enabled, THE Learning Interface SHALL display a floating toolbar with "Save" and "Cancel" buttons positioned near the paragraph
3. WHEN edit mode is enabled, THE Learning Interface SHALL apply a visual indicator (border or background color) to show the paragraph is in edit mode
4. WHEN edit mode is enabled, THE Learning Interface SHALL automatically focus the paragraph for immediate editing
5. WHEN edit mode is active, THE Learning Interface SHALL disable the copy button for that paragraph

### Requirement 4: Highlight Removal

**User Story:** As a language learner, I want all highlights removed from a paragraph when I edit it, so that I start with clean text and can re-highlight what I need.

#### Acceptance Criteria

1. WHEN the user confirms editing a paragraph, THE Learning Interface SHALL remove all vocabulary highlight elements from the paragraph DOM
2. WHEN the user confirms editing a paragraph, THE Learning Interface SHALL remove all sentence highlight elements from the paragraph DOM
3. WHEN the user confirms editing a paragraph, THE Learning Interface SHALL delete all vocabulary items associated with that paragraph from local storage
4. WHEN the user confirms editing a paragraph, THE Learning Interface SHALL delete all sentence items associated with that paragraph from local storage
5. WHEN highlights are removed, THE Learning Interface SHALL dispatch events to update the vocabulary and sentence card sections

### Requirement 5: Save Functionality

**User Story:** As a language learner, I want to save my paragraph edits, so that the changes persist in my reading session.

#### Acceptance Criteria

1. WHEN the user clicks the "Save" button in edit mode, THE Learning Interface SHALL capture the edited paragraph text
2. WHEN the user presses the Enter key while in edit mode, THE Learning Interface SHALL save the changes
3. WHEN paragraph changes are saved, THE Learning Interface SHALL update the corresponding ArticlePart content in session storage
4. WHEN paragraph changes are saved, THE Learning Interface SHALL exit edit mode and restore the paragraph to normal display
5. WHEN paragraph changes are saved, THE Learning Interface SHALL display a success notification showing "Paragraph updated"
6. WHEN the saved paragraph text is empty or contains only whitespace, THE Learning Interface SHALL display an error message and SHALL NOT save the changes

### Requirement 6: Cancel Functionality

**User Story:** As a language learner, I want to cancel my edits without saving, so that I can revert to the original text if I make a mistake.

#### Acceptance Criteria

1. WHEN the user clicks the "Cancel" button in edit mode, THE Learning Interface SHALL restore the paragraph to its original text
2. WHEN the user presses the Escape key while in edit mode, THE Learning Interface SHALL cancel the edit and restore the original text
3. WHEN an edit is cancelled, THE Learning Interface SHALL exit edit mode and restore the paragraph to normal display
4. WHEN an edit is cancelled, THE Learning Interface SHALL NOT update the ArticlePart content in session storage
5. IF highlights were removed when entering edit mode, WHEN the user cancels the edit, THE Learning Interface SHALL restore all removed highlights to their original positions

### Requirement 7: Edit Mode Constraints

**User Story:** As a language learner, I want the system to prevent conflicting actions while editing, so that I don't lose my work or encounter errors.

#### Acceptance Criteria

1. WHILE a paragraph is in edit mode, THE Learning Interface SHALL disable navigation to other article parts
2. WHILE a paragraph is in edit mode, THE Learning Interface SHALL disable mode switching (Reading, Vocabulary, Sentences tabs)
3. WHILE a paragraph is in edit mode, THE Learning Interface SHALL disable highlight mode changes
4. WHEN the user attempts to navigate away while in edit mode, THE Learning Interface SHALL display a confirmation dialog asking to save or discard changes
5. WHEN only one paragraph is in edit mode, THE Learning Interface SHALL prevent other paragraphs from entering edit mode simultaneously

### Requirement 8: UI Updates After Edit

**User Story:** As a language learner, I want the interface to update correctly after I edit a paragraph, so that I see accurate information about my learning progress.

#### Acceptance Criteria

1. WHEN a paragraph is saved with changes, THE Learning Interface SHALL re-render the vocabulary cards section to reflect removed items
2. WHEN a paragraph is saved with changes, THE Learning Interface SHALL re-render the sentence cards section to reflect removed items
3. WHEN highlights are removed due to editing, THE Learning Interface SHALL update the vocabulary and sentence counts displayed in the interface
4. WHEN a paragraph is saved, THE Learning Interface SHALL maintain the scroll position so the user remains at the edited paragraph
5. WHEN a paragraph is saved, THE Learning Interface SHALL re-enable all disabled UI controls (navigation, mode switching, etc.)

### Requirement 9: Error Handling

**User Story:** As a language learner, I want clear error messages if something goes wrong during editing, so that I understand what happened and can try again.

#### Acceptance Criteria

1. IF saving paragraph changes to session storage fails, THEN THE Learning Interface SHALL display an error notification and SHALL keep the paragraph in edit mode
2. IF removing highlights from local storage fails, THEN THE Learning Interface SHALL display a warning notification but SHALL continue with the edit operation
3. IF the paragraph element is removed from the DOM during edit mode, THEN THE Learning Interface SHALL exit edit mode gracefully and display an error message
4. IF the user's edited text exceeds 10,000 characters, THEN THE Learning Interface SHALL display a warning message and SHALL NOT allow saving
5. WHEN an error occurs during edit operations, THE Learning Interface SHALL log detailed error information to the console for debugging

### Requirement 10: Accessibility

**User Story:** As a language learner using assistive technology, I want the edit feature to be accessible, so that I can edit paragraphs using keyboard navigation and screen readers.

#### Acceptance Criteria

1. WHEN edit mode is enabled, THE Learning Interface SHALL announce "Edit mode enabled" to screen readers
2. WHEN the Save or Cancel buttons are focused, THE Learning Interface SHALL provide clear ARIA labels describing their function
3. WHEN the user navigates using Tab key in edit mode, THE Learning Interface SHALL move focus between the paragraph, Save button, and Cancel button in logical order
4. WHEN edit mode is exited, THE Learning Interface SHALL announce the result ("Paragraph saved" or "Edit cancelled") to screen readers
5. THE confirmation dialog SHALL be keyboard accessible with Tab navigation and Enter/Escape key support
