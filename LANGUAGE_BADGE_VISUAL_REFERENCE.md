# Language Badge Visual Reference

## Badge Appearance

### High Confidence (>80%)

```
╔════════════════════════════════════╗
║  🟢 Green Gradient Background      ║
║                                    ║
║         EN ✅                      ║
║                                    ║
║  Tooltip:                          ║
║  English                           ║
║  High confidence (92%)             ║
║  Detected using Chrome AI          ║
╚════════════════════════════════════╝
```

**CSS Classes**: `.language-badge.high-confidence`  
**Background**: `linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)`  
**Text Color**: White  
**Emoji**: ✅

---

### Medium Confidence (50-80%)

```
╔════════════════════════════════════╗
║  🟡 Yellow/Orange Gradient         ║
║                                    ║
║         ES ⚠️                      ║
║                                    ║
║  Tooltip:                          ║
║  Spanish                           ║
║  Medium confidence (65%)           ║
║  Detected using Chrome AI          ║
╚════════════════════════════════════╝
```

**CSS Classes**: `.language-badge.medium-confidence`  
**Background**: `linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)`  
**Text Color**: Dark (#2c3e50)  
**Emoji**: ⚠️

---

### Low Confidence (<50%)

```
╔════════════════════════════════════╗
║  🔴 Red Gradient Background        ║
║                                    ║
║         ?? ❓                      ║
║                                    ║
║  Tooltip:                          ║
║  Unknown                           ║
║  Low confidence (35%)              ║
║  Detected using Chrome AI          ║
╚════════════════════════════════════╝
```

**CSS Classes**: `.language-badge.low-confidence`  
**Background**: `linear-gradient(135deg, #e74c3c 0%, #ec7063 100%)`  
**Text Color**: White  
**Emoji**: ❓

---

## Interactive States

### Hover Effect

```
Before Hover:
┌──────────────┐
│  EN ✅       │  Shadow: 0 1px 3px
└──────────────┘

On Hover:
┌──────────────┐
│  EN ✅       │  Shadow: 0 2px 6px (elevated)
└──────────────┘  Transform: translateY(-1px)
```

### Dark Mode

All badges maintain their gradient backgrounds but with adjusted shadows:

- Shadow: `0 1px 3px rgba(0, 0, 0, 0.3)`
- Hover shadow: `0 2px 6px rgba(0, 0, 0, 0.4)`
- Medium confidence text color: `#1a1a1a` (darker for contrast)

---

## Badge Dimensions

```
┌─────────────────────────────────┐
│  Padding: 0.4rem 0.9rem         │
│  Border-radius: 20px            │
│  Font-size: 0.85rem             │
│  Font-weight: 600               │
│  Gap between elements: 0.5rem   │
└─────────────────────────────────┘
```

---

## Emoji Reference

| Confidence Level | Emoji | Unicode | Meaning                  |
| ---------------- | ----- | ------- | ------------------------ |
| High (>80%)      | ✅    | U+2705  | Check mark, verified     |
| Medium (50-80%)  | ⚠️    | U+26A0  | Warning sign, caution    |
| Low (<50%)       | ❓    | U+2753  | Question mark, uncertain |

---

## Language Code Display

### Supported Languages (Examples)

```
EN - English
ES - Spanish
FR - French
DE - German
IT - Italian
PT - Portuguese
RU - Russian
JA - Japanese
KO - Korean
ZH-CN - Chinese (Simplified)
ZH-TW - Chinese (Traditional)
AR - Arabic
HI - Hindi
```

### Unknown Languages

```
?? - Unknown/Undetected
```

---

## Tooltip Format

```
┌─────────────────────────────────┐
│ {Full Language Name}            │
│ {Confidence Level} ({Percent}%) │
│ Detected using Chrome AI        │
└─────────────────────────────────┘

Example:
┌─────────────────────────────────┐
│ English                         │
│ High confidence (92%)           │
│ Detected using Chrome AI        │
└─────────────────────────────────┘
```

---

## Integration in Article Header

```html
<header class="article-header">
  <h1 class="article-title">Article Title Here</h1>
  <div class="article-meta">
    <span class="article-url">https://example.com/article</span>

    <!-- Language Badge -->
    <div class="language-badge high-confidence" title="...">
      <span class="language-code">EN</span>
      <span class="confidence-indicator">✅</span>
    </div>
  </div>
  <!-- ... rest of header ... -->
</header>
```

---

## Responsive Behavior

### Desktop (>768px)

```
┌────────────────────────────────────────────────┐
│ Article Title                                  │
│ https://example.com/article    EN ✅          │
└────────────────────────────────────────────────┘
```

### Mobile (<768px)

```
┌──────────────────────────┐
│ Article Title            │
│ https://example.com/...  │
│ EN ✅                    │
└──────────────────────────┘
```

The badge wraps to a new line on smaller screens due to `flex-wrap: wrap` on `.article-meta`.

---

## Accessibility

- **Cursor**: `help` - indicates additional information available
- **Title attribute**: Provides full context on hover
- **High contrast**: All badges maintain WCAG AA contrast ratios
- **Semantic HTML**: Uses appropriate div/span structure
- **Screen readers**: Tooltip text is accessible via title attribute

---

## Animation & Transitions

```css
transition: all 0.3s ease;

/* Hover animation */
transform: translateY(-1px);
box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
```

Smooth 300ms transitions for:

- Transform (elevation)
- Box shadow (depth)
- All other properties

---

## Color Palette

### High Confidence (Green)

- Start: `#27ae60` (Nephritis)
- End: `#2ecc71` (Emerald)

### Medium Confidence (Yellow/Orange)

- Start: `#f39c12` (Orange)
- End: `#f1c40f` (Sun Flower)

### Low Confidence (Red)

- Start: `#e74c3c` (Alizarin)
- End: `#ec7063` (Light Red)

All colors from Flat UI color palette for consistency.

---

## Browser Support

- **Chrome 138+**: Full support with native emojis
- **Gradients**: Supported in all modern browsers
- **Flexbox**: Supported in all modern browsers
- **CSS Variables**: Supported in all modern browsers

---

## Performance

- **Render time**: <1ms (simple CSS)
- **No JavaScript**: Badge styling is pure CSS
- **No images**: Uses native emojis
- **Lightweight**: ~2KB CSS (minified)

---

**Last Updated**: November 3, 2025  
**Version**: 1.0.0
