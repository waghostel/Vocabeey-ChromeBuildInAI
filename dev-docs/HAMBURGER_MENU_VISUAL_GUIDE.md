# Hamburger Menu - Visual Guide

## Component Location

```
┌─────────────────────────────────────────────────────────┐
│  Language Learning Interface              [☰] ← Hamburger│
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Article Title                                   │    │
│  │  ─────────────────────────────────────────────  │    │
│  │  Article content goes here...                   │    │
│  │                                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Menu States

### 1. Closed State (Default)

```
┌──────┐
│  ☰   │  ← Hamburger button (top-right corner)
└──────┘
```

### 2. Open State (Menu Visible)

```
┌──────┐
│  ☰   │  ← Button turns blue when active
└──────┘
   │
   └─────────────────┐
                     │
   ┌─────────────────┴──────────────┐
   │  THEME                         │
   │  ┌──────────┐  ┌──────────┐  │
   │  │    ☀️    │  │    🌙    │  │
   │  │  Light   │  │   Dark   │  │
   │  └──────────┘  └──────────┘  │
   └────────────────────────────────┘
```

## Theme Options

### Light Theme Button

```
┌──────────────┐
│      ☀️      │
│    Light     │  ← White background, blue border when active
└──────────────┘
```

### Dark Theme Button

```
┌──────────────┐
│      🌙      │
│     Dark     │  ← White background, blue border when active
└──────────────┘
```

## Visual States

### Hamburger Button States

1. **Default (Light Mode)**
   - Background: White
   - Border: Light gray
   - Icon: Dark gray

2. **Hover**
   - Background: Light gray
   - Border: Blue
   - Slight upward movement
   - Shadow increases

3. **Active (Menu Open)**
   - Background: Blue
   - Border: Blue
   - Icon: White

4. **Dark Mode**
   - Background: Dark gray (#2c3e50)
   - Border: Darker gray (#34495e)
   - Icon: Light gray

### Theme Option States

1. **Default**
   - Background: Light gray
   - Border: Gray
   - Text: Dark

2. **Hover**
   - Border: Blue
   - Slight upward movement
   - Shadow appears

3. **Active (Selected)**
   - Background: Blue
   - Border: Blue
   - Text: White
   - Icon: White

## Color Scheme

### Light Theme

- Background: #f5f7fa (light gray)
- Text: #2c3e50 (dark blue-gray)
- Primary: #4a90e2 (blue)
- Cards: White

### Dark Theme

- Background: #1a1a1a (almost black)
- Text: #ecf0f1 (light gray)
- Primary: #5dade2 (lighter blue)
- Cards: #2c3e50 (dark gray)

## Animations

### Menu Open

```
Opacity: 0 → 1
Position: translateY(-10px) → translateY(0)
Duration: 0.3s
Easing: ease-out
```

### Button Hover

```
Transform: translateY(0) → translateY(-2px)
Shadow: small → medium
Duration: 0.3s
Easing: ease
```

### Theme Switch

```
All colors transition smoothly
Duration: 0.3s
Easing: ease
```

## Interaction Flow

```
User clicks hamburger button
         ↓
Menu slides down with animation
         ↓
User clicks theme option
         ↓
Theme applies immediately
         ↓
Menu closes automatically
         ↓
Theme saved to storage
```

## Responsive Behavior

- Button stays fixed in top-right corner
- Menu dropdown aligns to the right
- Works on all screen sizes
- Touch-friendly on mobile devices

## Accessibility Features

- ARIA label on hamburger button: "Settings menu"
- Keyboard support: ESC to close
- Click outside to close
- Visual focus indicators
- High contrast in both themes
- Large touch targets (48x48px button)

## CSS Classes Reference

### Button

- `.hamburger-button` - Main button
- `.hamburger-button.active` - When menu is open

### Menu

- `.hamburger-menu` - Menu container
- `.hamburger-menu.hidden` - Hidden state
- `.menu-section` - Section container
- `.menu-section-title` - Section heading

### Theme Options

- `.theme-options` - Container for theme buttons
- `.theme-option` - Individual theme button
- `.theme-option.active` - Selected theme
- `.theme-icon` - Emoji icon
- `.theme-label` - Text label

### Dark Mode

- `body.dark-mode` - Applied to body when dark theme is active
