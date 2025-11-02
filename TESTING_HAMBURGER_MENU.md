# Testing the Hamburger Menu Implementation

## Quick Test Options

### Option 1: Standalone Demo (Fastest)

Open the demo HTML file in your browser:

```bash
# Open in default browser (Windows)
start hamburger-menu-demo.html

# Or just double-click the file
```

This demo shows the hamburger menu in isolation with all functionality working.

### Option 2: Chrome Extension (Full Integration)

Load the extension in Chrome to test it in the actual learning interface:

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `dist` folder from this project
5. Navigate to any article and click the extension icon

## Test Checklist

### Visual Tests

- [ ] Hamburger button appears in top-right corner
- [ ] Button has proper styling (white background, gray border)
- [ ] Button shows hover effect (blue border, slight lift)
- [ ] Menu dropdown appears below button when clicked
- [ ] Menu has smooth slide-down animation
- [ ] Theme options are displayed as cards with icons
- [ ] Active theme is highlighted in blue

### Functional Tests

- [ ] Clicking hamburger button opens menu
- [ ] Clicking hamburger button again closes menu
- [ ] Clicking outside menu closes it
- [ ] Pressing ESC key closes menu
- [ ] Clicking Light theme applies light theme
- [ ] Clicking Dark theme applies dark theme
- [ ] Theme changes apply immediately
- [ ] Menu closes after selecting a theme
- [ ] Selected theme is highlighted in menu

### Theme Tests - Light Mode

- [ ] Background is light gray (#f5f7fa)
- [ ] Text is dark (#2c3e50)
- [ ] Cards have white background
- [ ] Hamburger button has white background
- [ ] Menu dropdown has white background
- [ ] All text is readable

### Theme Tests - Dark Mode

- [ ] Background is dark (#1a1a1a)
- [ ] Text is light (#ecf0f1)
- [ ] Cards have dark gray background (#2c3e50)
- [ ] Hamburger button has dark background
- [ ] Menu dropdown has dark background
- [ ] All text is readable with good contrast

### Persistence Tests

- [ ] Select dark theme and refresh page
- [ ] Theme should still be dark after refresh
- [ ] Select light theme and refresh page
- [ ] Theme should still be light after refresh
- [ ] Close and reopen browser
- [ ] Theme preference persists across sessions

### Interaction Tests

- [ ] Hover over hamburger button shows visual feedback
- [ ] Hover over theme options shows visual feedback
- [ ] Click animations are smooth
- [ ] No layout shifts when menu opens/closes
- [ ] No console errors

### Responsive Tests

- [ ] Resize browser window to small size
- [ ] Hamburger button stays in top-right
- [ ] Menu dropdown stays aligned to right
- [ ] Touch interactions work (if testing on touch device)

### Accessibility Tests

- [ ] Tab to hamburger button with keyboard
- [ ] Press Enter to open menu
- [ ] Tab through theme options
- [ ] Press Enter to select theme
- [ ] Press ESC to close menu
- [ ] Screen reader announces button label

## Expected Behavior

### Opening Menu

1. Click hamburger button
2. Button background turns blue
3. Button icon turns white
4. Menu slides down smoothly (0.3s animation)
5. Menu appears with theme options

### Selecting Light Theme

1. Click "Light" theme option
2. Theme option highlights in blue
3. Body class removes 'dark-mode'
4. All colors transition smoothly
5. Menu closes automatically
6. Theme saved to chrome.storage.local

### Selecting Dark Theme

1. Click "Dark" theme option
2. Theme option highlights in blue
3. Body class adds 'dark-mode'
4. All colors transition smoothly to dark
5. Menu closes automatically
6. Theme saved to chrome.storage.local

### Closing Menu

1. Click outside menu area
2. Menu fades out
3. Button returns to default state
4. OR press ESC key for same result

## Debugging

### Check Console

Open browser DevTools (F12) and check for:

- No JavaScript errors
- Theme changes logged (if debug mode enabled)
- Storage operations successful

### Inspect Storage

In Chrome DevTools:

1. Go to Application tab
2. Expand "Storage" → "Local Storage"
3. Check for `settings` key
4. Verify `darkMode` property is boolean

### Verify CSS

In Chrome DevTools:

1. Inspect hamburger button
2. Check computed styles
3. Verify CSS variables are applied
4. Check `body.dark-mode` class when dark theme active

### Check Build Output

Verify files exist in `dist/`:

```
dist/
├── ui/
│   ├── components/
│   │   └── hamburger-menu.js
│   ├── learning-interface.js
│   └── learning-interface.css
```

## Common Issues

### Menu Not Appearing

- Check if `initializeHamburgerMenu()` is called
- Verify hamburger-menu.js is loaded
- Check console for import errors

### Theme Not Persisting

- Check chrome.storage.local permissions
- Verify storage operations in console
- Check if settings object is properly structured

### Styles Not Applied

- Verify learning-interface.css is loaded
- Check if CSS variables are defined
- Inspect element to see computed styles

### Button Not Visible

- Check z-index (should be 1001)
- Verify position: fixed is applied
- Check if button is created in DOM

## Performance Tests

### Animation Smoothness

- Open/close menu multiple times rapidly
- Should remain smooth without lag
- No visual glitches

### Theme Switch Speed

- Switch between themes multiple times
- Should be instant (< 100ms perceived)
- No flash of unstyled content

### Memory Usage

- Open DevTools Performance tab
- Record while using menu
- Check for memory leaks
- Verify cleanup on page unload

## Browser Compatibility

Tested and working on:

- ✅ Chrome 120+
- ✅ Edge 120+
- ✅ Brave (Chromium-based)

Not tested (but should work):

- Opera (Chromium-based)
- Vivaldi (Chromium-based)

## Automated Testing

To run automated tests (if available):

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test hamburger-menu

# Run with coverage
pnpm test:coverage
```

## Manual Test Script

Follow this script for comprehensive testing:

1. **Initial Load**
   - Open demo or extension
   - Verify hamburger button visible
   - Verify default theme (light)

2. **Open Menu**
   - Click hamburger button
   - Verify menu appears
   - Verify animation smooth

3. **Select Dark Theme**
   - Click dark theme option
   - Verify theme changes
   - Verify menu closes

4. **Verify Dark Theme**
   - Check all UI elements are dark
   - Check text is readable
   - Check contrast is good

5. **Reopen Menu**
   - Click hamburger button again
   - Verify dark theme option is highlighted

6. **Select Light Theme**
   - Click light theme option
   - Verify theme changes back
   - Verify menu closes

7. **Test Close Methods**
   - Open menu
   - Click outside to close
   - Open menu again
   - Press ESC to close

8. **Test Persistence**
   - Select dark theme
   - Refresh page
   - Verify still dark
   - Select light theme
   - Refresh page
   - Verify still light

9. **Test Interactions**
   - Hover over button
   - Hover over theme options
   - Verify all hover effects work

10. **Final Check**
    - No console errors
    - No visual glitches
    - All animations smooth
    - Theme persists correctly

## Success Criteria

✅ All visual tests pass
✅ All functional tests pass
✅ Both themes work correctly
✅ Theme persists across sessions
✅ No console errors
✅ Smooth animations
✅ Good accessibility
✅ Works in Chrome extension context

## Reporting Issues

If you find any issues:

1. Note the exact steps to reproduce
2. Check browser console for errors
3. Note browser version
4. Take screenshots if visual issue
5. Check if issue occurs in demo vs extension
