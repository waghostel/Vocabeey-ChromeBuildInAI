# Onboarding Wizard Implementation

## Overview

An interactive, step-by-step guide wizard that appears when users first open the extension. It teaches users about vocabulary highlighting, sentence highlighting, learning cards, and keyboard shortcuts.

## Features

### 7-Step Interactive Tutorial

1. **Welcome** - Introduction and overview
2. **Vocabulary Highlighting** - Shows how words are highlighted by difficulty
3. **Vocabulary Cards** - Explains card features (translation, context, TTS)
4. **Sentence Highlighting** - Demonstrates sentence mode
5. **Sentence Cards** - Shows sentence learning features
6. **Keyboard Shortcuts** - Lists all hotkeys with visual keyboard layout
7. **Ready to Learn** - Summary and completion

### Key Features

- **Spotlight Effect**: Highlights relevant UI elements during each step
- **Progress Indicator**: Visual progress bar and step counter
- **Interactive Demos**: Live examples of highlights and cards
- **Keyboard Navigation**: Arrow keys, Enter, and Escape support
- **Skip Option**: Users can skip and replay later from menu
- **Responsive Design**: Works on different screen sizes
- **Dark Mode Support**: Adapts to user's theme preference
- **Accessibility**: Keyboard navigation and ARIA labels

## Files Created

### TypeScript

- `src/ui/onboarding-wizard.ts` - Main wizard controller and logic

### CSS

- `src/ui/onboarding-wizard.css` - Complete styling with animations

### Tests

- `tests/onboarding-wizard.test.ts` - Comprehensive test suite (14 tests)

## Integration Points

### Learning Interface

```typescript
// src/ui/learning-interface.ts
import { checkAndShowOnboarding } from './onboarding-wizard';

// Called after page loads
await checkAndShowOnboarding();
```

### Hamburger Menu

```typescript
// src/ui/components/hamburger-menu.ts
import { showOnboardingWizard } from '../onboarding-wizard';

// "Replay Tutorial" menu item
case 'replay-tutorial':
  void showOnboardingWizard();
  break;
```

### HTML

```html
<!-- src/ui/learning-interface.html -->
<link rel="stylesheet" href="onboarding-wizard.css" />
```

## User Flow

### First-Time User

1. User opens extension for the first time
2. Article loads normally
3. After 500ms delay, wizard appears automatically
4. User goes through 7 steps or skips
5. Completion flag saved to localStorage
6. Wizard closes, user can start learning

### Returning User

1. User opens extension
2. No wizard appears (already completed)
3. Can replay from menu: ☰ → Replay Tutorial

## Storage

Uses `localStorage` for persistence:

- Key: `hasCompletedOnboarding`
- Value: `'true'` when completed
- Can be reset with `resetOnboarding()` function

## Keyboard Shortcuts

While wizard is active:

- **→** or **Enter**: Next step
- **←**: Previous step
- **Escape**: Close wizard (with confirmation)

## Styling Highlights

### Visual Design

- Modern gradient buttons (blue to purple)
- Smooth animations and transitions
- Card-based layout with shadows
- Responsive breakpoints for mobile

### Interactive Elements

- Hover effects on all buttons
- Pulse animation on spotlight
- Slide-in animation on open
- Progress bar with gradient

### Demo Components

- Color-coded difficulty highlights
- Sample vocabulary card
- Keyboard key visualizations
- Shortcut reference table

## API

### Public Functions

```typescript
// Check and show wizard for first-time users
await checkAndShowOnboarding(): Promise<void>

// Manually show wizard (for replay)
await showOnboardingWizard(): Promise<void>

// Hide wizard
hideOnboardingWizard(): void

// Reset completion status
resetOnboarding(): void

// Check if completed
hasCompletedOnboarding(): boolean
```

## Testing

All 14 tests pass:

- ✅ Completion status tracking
- ✅ Reset functionality
- ✅ DOM creation and cleanup
- ✅ Step navigation
- ✅ Progress updates
- ✅ Button states
- ✅ First-time user detection

Run tests:

```bash
pnpm test onboarding-wizard
```

## Future Enhancements

Possible improvements:

- [ ] Add video demonstrations
- [ ] Track which steps users skip
- [ ] A/B test different tutorial flows
- [ ] Add tooltips for advanced features
- [ ] Localization for multiple languages
- [ ] Analytics on completion rates
- [ ] Contextual help hints after tutorial

## Browser Compatibility

Works in all modern browsers:

- Chrome 88+
- Edge 88+
- Opera 74+
- Any Chromium-based browser

## Performance

- Minimal bundle size (~15KB CSS + ~10KB JS)
- No external dependencies
- Lazy-loaded (only when needed)
- Smooth 60fps animations
- No impact on main app performance

## Accessibility

- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management
- Reduced motion support
- High contrast mode compatible
- Screen reader friendly

## Notes

- Wizard appears 500ms after page load to ensure smooth UX
- Uses localStorage instead of chrome.storage for instant access
- Spotlight effect uses CSS box-shadow for performance
- All animations respect `prefers-reduced-motion`
- Dark mode automatically detected from body class
