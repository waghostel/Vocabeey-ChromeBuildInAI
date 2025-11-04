# Quick Start - Onboarding Wizard

## 🚀 See It In Action

### 1. Build the Extension

```bash
pnpm build
```

### 2. Load in Chrome

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top-right)
4. Click "Load unpacked"
5. Select the `dist/` folder

### 3. Test the Wizard

#### First-Time Experience

1. Click the extension icon
2. Navigate to any article
3. Click "Start Learning" or similar
4. **Wizard appears automatically after 500ms!**

#### Replay Tutorial

1. Open the extension
2. Click the hamburger menu (☰) in bottom-right
3. Click "🎓 Replay Tutorial"
4. Wizard appears again!

## 🎯 What to Look For

### Visual Elements

- ✅ Smooth slide-in animation
- ✅ Progress bar at top
- ✅ Step counter (1/7, 2/7, etc.)
- ✅ Gradient "Next" button
- ✅ Close button (×) in top-right

### Interactive Features

- ✅ Click "Next" to advance
- ✅ Click "Previous" to go back
- ✅ Press → or Enter for next
- ✅ Press ← for previous
- ✅ Press Esc to close (with confirmation)

### Spotlight Effect

- ✅ Step 2: Vocabulary button highlighted
- ✅ Step 3: Vocabulary cards section highlighted
- ✅ Step 4: Sentence button highlighted
- ✅ Step 5: Sentence cards section highlighted
- ✅ Pulsing blue border around highlighted elements

### Demo Components

- ✅ Step 2: Color-coded word examples (green/orange/red)
- ✅ Step 3: Sample vocabulary card with speaker icon
- ✅ Step 6: Keyboard shortcuts with visual keys

## 🧪 Testing Checklist

### Basic Flow

- [ ] Wizard appears on first load
- [ ] Can navigate through all 7 steps
- [ ] Progress bar updates correctly
- [ ] Can skip tutorial
- [ ] Completion is saved (doesn't show again)

### Navigation

- [ ] "Previous" disabled on step 1
- [ ] "Next" changes to "Start Learning" on step 7
- [ ] Keyboard shortcuts work (←, →, Enter, Esc)
- [ ] Step counter updates (1/7 → 7/7)

### Replay

- [ ] Menu shows "Replay Tutorial" option
- [ ] Clicking it shows wizard again
- [ ] Works same as first time

### Visual

- [ ] Animations are smooth
- [ ] Spotlight highlights correct elements
- [ ] Demo components render correctly
- [ ] Responsive on different screen sizes

### Dark Mode

- [ ] Switch to dark mode (from menu)
- [ ] Replay tutorial
- [ ] Colors adapt correctly
- [ ] Text remains readable

## 🐛 Troubleshooting

### Wizard Doesn't Appear

```bash
# Check localStorage
# Open DevTools → Console
localStorage.getItem('hasCompletedOnboarding')
# Should be null for first-time

# Force reset
localStorage.removeItem('hasCompletedOnboarding')
# Reload page
```

### Spotlight Not Working

- Make sure you're on the learning interface page
- Check that the highlighted elements exist in DOM
- Try different steps (not all have spotlight)

### Build Issues

```bash
# Clean build
rm -rf dist/
pnpm build

# Check for errors
pnpm lint
pnpm type-check
```

## 📝 Reset for Testing

### Clear Completion Flag

```javascript
// In DevTools Console
localStorage.removeItem('hasCompletedOnboarding');
location.reload();
```

### Or Use API

```javascript
// In DevTools Console
import { resetOnboarding } from './onboarding-wizard.js';
resetOnboarding();
location.reload();
```

## 🎨 Customization

### Change Step Content

Edit `src/ui/onboarding-wizard.ts`:

```typescript
const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Your Custom Title',
    content: `Your custom HTML content`,
  },
  // ... more steps
];
```

### Change Colors

Edit `src/ui/onboarding-wizard.css`:

```css
.wizard-btn-primary {
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
}
```

### Change Timing

Edit `src/ui/onboarding-wizard.ts`:

```typescript
setTimeout(() => {
  void showOnboardingWizard();
}, 500); // Change delay here
```

## 📊 Verify Tests

```bash
# Run all onboarding tests
pnpm test onboarding-wizard

# Should see:
# ✓ 14 tests passing
```

## 🎉 Success Criteria

Your implementation is working if:

1. ✅ Wizard appears automatically for new users
2. ✅ All 7 steps display correctly
3. ✅ Navigation works (buttons + keyboard)
4. ✅ Spotlight highlights UI elements
5. ✅ Demo components render properly
6. ✅ Can skip and replay from menu
7. ✅ Completion is saved
8. ✅ All tests pass
9. ✅ No console errors
10. ✅ Smooth animations

## 🎬 Demo Script

Want to show someone? Follow this:

1. **Reset**: Clear localStorage
2. **Load**: Open extension on article
3. **Wait**: Wizard appears after 500ms
4. **Welcome**: "This is the welcome screen"
5. **Vocabulary**: "See how words are highlighted"
6. **Cards**: "Click words to see translations"
7. **Sentences**: "Switch to sentence mode"
8. **Shortcuts**: "Here are the keyboard shortcuts"
9. **Complete**: "Click Start Learning"
10. **Replay**: "Access from menu anytime"

## 📱 Mobile Testing

1. Open Chrome DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device
4. Reload page
5. Verify responsive layout

## 🎯 Next Steps

After verifying it works:

1. Gather user feedback
2. Track completion rates
3. Identify drop-off points
4. Iterate on content
5. Add more interactive demos
6. Consider A/B testing

---

**That's it!** Your onboarding wizard is ready to guide users through your extension's features. 🎉
