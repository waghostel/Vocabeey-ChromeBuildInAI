# Bulk Delete Highlights - User Guide

## Quick Start

Want to delete multiple highlights at once? Here's how:

### 1. Switch to None Mode

Press `0`, `3`, or `Esc` to disable highlighting mode.

Or click the **🚫 None** button at the top of the page.

### 2. Select the Text

Click and drag to select the text region containing the highlights you want to delete.

💡 **Tip**: You can select across multiple paragraphs!

### 3. Review What Will Be Deleted

- Highlights that will be deleted turn **red** with a pulsing animation
- A button appears showing: **"Delete X highlights"**
- Only highlights **fully inside** your selection will be deleted

### 4. Delete the Highlights

Press the `Delete` or `Backspace` key

### 5. Confirmation

A green notification appears showing:

- Total number of highlights deleted
- Breakdown by type (vocabulary vs sentences)

Example: _"Deleted 5 highlights (3 vocabulary, 2 sentences)"_

## Tips & Tricks

### ✅ Best Practices

1. **Preview Before Deleting**
   - Always check the red-highlighted items before clicking delete
   - Make sure only the intended highlights are marked

2. **Use Keyboard Shortcuts**
   - `0` or `3` → Switch to None mode
   - Select text → `Delete` → Done!
   - Much faster than clicking

3. **Select Carefully**
   - Only **fully enclosed** highlights are deleted
   - Partially selected highlights are **not** deleted
   - This prevents accidental deletions

4. **Cancel Anytime**
   - Press `Esc` to cancel without deleting
   - Click elsewhere to clear the selection
   - Switch modes to cancel

### ❌ Common Mistakes

1. **Selecting in Wrong Mode**
   - Bulk delete only works in **None mode**
   - In Vocabulary/Sentence mode, selection creates new highlights
   - Always check your mode first!

2. **Partial Selection**
   - If a highlight is only partially selected, it won't be deleted
   - Make sure your selection fully covers the highlights you want to remove

3. **Forgetting to Confirm**
   - The red preview doesn't delete anything
   - You must click the button or press Delete to actually remove highlights

## Visual Guide

### What You'll See

```
┌─────────────────────────────────────────┐
│  🚫 None Mode (Active)                  │
└─────────────────────────────────────────┘

This is some text with [word1] and [word2].
                        ↑ Select this region ↑

After selection:
This is some text with [word1] and [word2].
                       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
                       (Red pulsing)

                Press Delete or Backspace ⌨️
```

## Keyboard Shortcuts Reference

| Key                     | Action                     |
| ----------------------- | -------------------------- |
| `0`, `3`, or `Esc`      | Switch to None mode        |
| `Delete` or `Backspace` | Delete selected highlights |
| `Esc` (when selecting)  | Cancel and clear selection |

## Frequently Asked Questions

### Q: Can I undo a bulk delete?

**A**: Not currently. Be careful to review the preview before deleting. Future versions may include undo functionality.

### Q: What happens to nested highlights?

**A**: If both the parent and nested highlights are fully selected, both will be deleted. For example, if you select a sentence that contains vocabulary highlights, and both are fully enclosed, both will be removed.

### Q: Can I delete highlights from different parts of the article?

**A**: Not in a single operation. You need to make separate selections for different regions. However, you can select across multiple paragraphs in one go.

### Q: Why isn't the preview showing?

**A**: Check these things:

1. Are you in **None mode**? (not Vocabulary or Sentence mode)
2. Have you **selected text**?
3. Are there any **highlights** within your selection?
4. Are the highlights **fully enclosed** in your selection?

### Q: Can I delete all highlights at once?

**A**: Yes! Select all the text in the article (Ctrl+A or Cmd+A), and all fully enclosed highlights will be marked for deletion. However, be careful with this approach!

### Q: Does this work on mobile?

**A**: Yes! Touch and drag to select text, then tap the delete button.

## Troubleshooting

### Problem: Preview appears but Delete key doesn't work

**Solution**: Make sure you're in None mode and the highlights have the red preview. Check the browser console for errors.

### Problem: Wrong highlights are being marked

**Solution**: Adjust your selection to fully enclose only the highlights you want to delete.

### Problem: Can't select text

**Solution**: Make sure you're in None mode. In other modes, selection creates new highlights instead.

### Problem: Highlights not being removed from storage

**Solution**: Check that you have the necessary permissions. Try reloading the extension.

## Examples

### Example 1: Clean Up a Paragraph

**Scenario**: You highlighted too many words in a paragraph and want to start over.

**Steps**:

1. Press `0` to enter None mode
2. Select the entire paragraph
3. Review the red-highlighted words (preview)
4. Press `Delete` or `Backspace`
5. Done! All highlights in that paragraph are removed

### Example 2: Remove Specific Highlights

**Scenario**: You want to remove 3 specific vocabulary words that are close together.

**Steps**:

1. Switch to None mode
2. Carefully select just those 3 words
3. Verify only those 3 are marked in red (preview)
4. Press `Delete` or `Backspace`
5. Success!

### Example 3: Mixed Deletion

**Scenario**: You want to remove both vocabulary and sentence highlights in a section.

**Steps**:

1. Enter None mode
2. Select the entire section
3. Check the preview - you'll see both types marked
4. Press `Delete`
5. Notification shows: "Deleted 8 highlights (5 vocabulary, 3 sentences)"

## Need Help?

If you encounter issues or have suggestions for improving this feature, please:

1. Check the troubleshooting section above
2. Review the documentation in `docs/BULK_DELETE_FEATURE.md`
3. Report bugs or request features through the appropriate channels

---

**Happy learning! 📚✨**
