# Onboarding Wizard - Visual Guide

## 🎨 What Users Will See

### Step 1: Welcome Screen

```
┌─────────────────────────────────────────────────────┐
│  ×                                            [====] │
│                                                      │
│  Welcome to Language Learning! 🎉                   │
│                                                      │
│  Transform any web article into an interactive      │
│  language learning experience.                       │
│                                                      │
│  This quick guide will show you how to:             │
│  • Highlight vocabulary and sentences               │
│  • Use learning cards with translations             │
│  • Navigate with keyboard shortcuts                 │
│                                                      │
│  ⏱️ Takes about 2 minutes                           │
│                                                      │
│  Step 1 / 7                                         │
│  [Skip Tutorial]  [Previous]  [Next →]              │
└─────────────────────────────────────────────────────┘
```

### Step 2: Vocabulary Highlighting

```
┌─────────────────────────────────────────────────────┐
│  ×                                        [========] │
│                                                      │
│  Vocabulary Highlighting 📝                         │
│                                                      │
│  In Vocabulary mode, words are highlighted by       │
│  difficulty level:                                   │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │ [Easy words] [Medium words] [Hard words] │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
│  Try it: Click any highlighted word in the          │
│  article to see its translation!                    │
│                                                      │
│  💡 Tip: Words are automatically highlighted        │
│  based on your learning level                       │
│                                                      │
│  Step 2 / 7                                         │
│  [Skip Tutorial]  [← Previous]  [Next →]            │
└─────────────────────────────────────────────────────┘
```

### Step 3: Vocabulary Cards

```
┌─────────────────────────────────────────────────────┐
│  ×                                    [============] │
│                                                      │
│  Vocabulary Cards 🗂️                                │
│                                                      │
│  When you click a word, a vocabulary card           │
│  appears with:                                       │
│  • Translation in your native language              │
│  • Context from the article                         │
│  • Example sentences for practice                   │
│  • Audio pronunciation (click 🔊)                   │
│                                                      │
│  ┌────────────────────────────┐                    │
│  │  example              🔊   │                    │
│  │  ejemplo                   │                    │
│  └────────────────────────────┘                    │
│                                                      │
│  💡 Tip: Right-click on cards to edit or remove    │
│                                                      │
│  Step 3 / 7                                         │
│  [Skip Tutorial]  [← Previous]  [Next →]            │
└─────────────────────────────────────────────────────┘
```

### Step 6: Keyboard Shortcuts

```
┌─────────────────────────────────────────────────────┐
│  ×                            [====================] │
│                                                      │
│  Keyboard Shortcuts ⌨️                              │
│                                                      │
│  Master these shortcuts for faster learning:        │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  [1]    Switch to Vocabulary mode          │    │
│  │  [2]    Switch to Sentence mode            │    │
│  │  [0]    Disable highlighting               │    │
│  │  [←][→] Navigate between article parts     │    │
│  │  [Space] Play/pause audio on cards         │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  💡 Tip: Hover over buttons to see shortcuts       │
│                                                      │
│  Step 6 / 7                                         │
│  [Skip Tutorial]  [← Previous]  [Next →]            │
└─────────────────────────────────────────────────────┘
```

### Step 7: Ready to Learn

```
┌─────────────────────────────────────────────────────┐
│  ×                        [========================] │
│                                                      │
│  You're Ready to Learn! 🚀                          │
│                                                      │
│  You now know how to:                               │
│  ✅ Highlight vocabulary and sentences              │
│  ✅ Use learning cards with translations            │
│  ✅ Navigate with keyboard shortcuts                │
│                                                      │
│  Start learning by clicking any highlighted         │
│  word or sentence!                                  │
│                                                      │
│  You can replay this tutorial anytime from          │
│  the menu (☰)                                       │
│                                                      │
│  Step 7 / 7                                         │
│  [Skip Tutorial]  [← Previous]  [Start Learning]    │
└─────────────────────────────────────────────────────┘
```

## 🎯 Spotlight Effect

When highlighting UI elements, the wizard creates a spotlight:

```
┌─────────────────────────────────────────────────────┐
│                                                      │
│  Article Header                                     │
│  ┌──────────────────────────────────────────┐      │
│  │ Translate to: [English ▼]               │      │
│  │                                          │      │
│  │ Highlight Mode:                          │      │
│  │ ╔════════════╗ [Sentences] [None]       │ ← Spotlight
│  │ ║[Vocabulary]║                           │      │
│  │ ╚════════════╝                           │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
│  [Wizard appears here explaining this feature]      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 🎨 Color Scheme

### Light Mode

- **Primary**: Blue gradient (#3b82f6 → #8b5cf6)
- **Background**: White (#ffffff)
- **Text**: Dark gray (#111827)
- **Borders**: Light gray (#e5e7eb)

### Dark Mode

- **Primary**: Light blue (#5dade2)
- **Background**: Dark gray (#1f2937)
- **Text**: Light gray (#f3f4f6)
- **Borders**: Medium gray (#374151)

## 📱 Responsive Design

### Desktop (>640px)

```
┌─────────────────────────────────────────────────────┐
│                   Full Width                        │
│              Max 600px centered                     │
│                                                      │
│  [Content with side margins]                        │
│                                                      │
│  [Buttons in row]                                   │
└─────────────────────────────────────────────────────┘
```

### Mobile (<640px)

```
┌──────────────────────────┐
│     95% Width            │
│                          │
│  [Content full width]   │
│                          │
│  [Buttons stacked]      │
│  [Button 1]             │
│  [Button 2]             │
│  [Button 3]             │
└──────────────────────────┘
```

## 🎭 Animations

### Entrance

```
Wizard slides in from bottom:
  ↓ Fade in + Scale up
  ↓ 300ms ease-out
  ✓ Fully visible
```

### Progress Bar

```
Step 1: [====                    ] 14%
Step 2: [========                ] 28%
Step 3: [============            ] 42%
Step 4: [================        ] 57%
Step 5: [====================    ] 71%
Step 6: [========================] 85%
Step 7: [========================] 100%
```

### Spotlight Pulse

```
Normal:  ◯ (border + shadow)
Pulse:   ⊙ (larger shadow)
Normal:  ◯ (back to normal)
Repeat every 2 seconds
```

## 🎮 Interactive Elements

### Buttons

```
Normal:   [Button]
Hover:    [Button] ← Slightly raised, shadow
Active:   [Button] ← Pressed down
Disabled: [Button] ← Grayed out, no hover
```

### Demo Highlights

```
Easy:    [word] ← Green background
Medium:  [word] ← Orange background
Hard:    [word] ← Red background
```

### Demo Card

```
┌────────────────────────────┐
│  example              🔊   │ ← Hover: scale up
│  ejemplo                   │
└────────────────────────────┘
```

## 🔤 Typography

### Sizes

- **Title**: 24px, Bold
- **Body**: 16px, Regular
- **Tips**: 14px, Regular
- **Buttons**: 14px, Semi-bold
- **Shortcuts**: 14px, Monospace

### Weights

- **Titles**: 700 (Bold)
- **Body**: 400 (Regular)
- **Buttons**: 600 (Semi-bold)
- **Emphasis**: 600 (Semi-bold)

## 🎯 User Interactions

### Click Targets

```
Close Button:     48×48px (top-right)
Navigation Btns:  Auto width, 44px height
Skip Button:      Auto width, 44px height
Overlay:          Full screen (closes wizard)
```

### Keyboard Focus

```
Tab Order:
1. Close button (×)
2. Skip Tutorial
3. Previous
4. Next / Start Learning
```

## 📐 Layout Measurements

### Spacing

- **Padding**: 24px (desktop), 20px (mobile)
- **Gap**: 16px between elements
- **Margin**: 16px between sections

### Sizes

- **Max Width**: 600px
- **Max Height**: 85vh
- **Border Radius**: 16px (container), 8-12px (elements)
- **Border Width**: 2px

## 🎨 Visual Hierarchy

```
1. Title (Largest, Bold)
   ↓
2. Body Text (Medium, Regular)
   ↓
3. Demo Elements (Highlighted)
   ↓
4. Tips (Smaller, Colored background)
   ↓
5. Navigation (Bottom, Buttons)
```

## 🌈 Accessibility Features

### Visual

- High contrast text
- Clear focus indicators
- Large click targets (44×44px minimum)
- Color not sole indicator

### Keyboard

- Full keyboard navigation
- Visible focus states
- Logical tab order
- Escape to close

### Motion

- Respects `prefers-reduced-motion`
- No flashing or rapid animations
- Smooth, predictable transitions

## 🎬 Complete User Journey

```
1. User opens extension
   ↓
2. Article loads (500ms delay)
   ↓
3. Wizard slides in with welcome
   ↓
4. User reads and clicks "Next"
   ↓
5. Each step shows new content + spotlight
   ↓
6. Progress bar fills gradually
   ↓
7. Final step shows summary
   ↓
8. User clicks "Start Learning"
   ↓
9. Wizard slides out
   ↓
10. User can now use all features!
```

## 💡 Design Principles

1. **Progressive Disclosure**: One concept per step
2. **Show, Don't Tell**: Visual demos over text
3. **Immediate Value**: Quick 2-minute tutorial
4. **Escape Hatch**: Skip option always visible
5. **Replay Friendly**: Easy to access from menu
6. **Contextual**: Highlights actual UI elements
7. **Encouraging**: Positive, friendly tone
8. **Accessible**: Works for everyone

---

This visual guide shows exactly what users will experience when they first open your extension!
