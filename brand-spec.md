# Concave Dashboard Reference System

Source: `mqkg0jm3-image.png`, provided as the visual reference.

## Tokens

```css
:root {
  --bg:      oklch(96% 0.006 120);
  --surface: oklch(100% 0 0);
  --fg:      oklch(18% 0.012 145);
  --muted:   oklch(52% 0.014 145);
  --border:  oklch(91% 0.01 130);
  --accent:  oklch(72% 0.17 128);

  --font-display: 'Söhne', 'Avenir Next', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-body:    -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'IBM Plex Mono', ui-monospace, Menlo, monospace;
}
```

Supporting colors:

```css
:root {
  --pastel-mint:   oklch(91% 0.075 150);
  --pastel-yellow: oklch(91% 0.12 100);
  --pastel-peach:  oklch(86% 0.09 55);
  --soft-blue:     oklch(90% 0.05 235);
  --danger:        oklch(64% 0.18 25);
  --success:       oklch(66% 0.16 145);
}
```

## Layout Posture

- Use a cool off-white app canvas with white cards and soft grey panel gutters.
- Keep panels rounded but controlled: 10-14px for content cards, 8px for buttons and form fields.
- Prefer hairline borders and very soft shadows; elevation should feel like paper on a desk, not glass.
- Use lime as the primary action and validation signal; use yellow and peach only for field-type chips, progress, and small moments.
- Optimize for speed: persistent sidebar, prominent quick-create affordance, command/search entry, and a right-side assistant/checklist for the current workflow.

## Typography

- Display and UI labels use a rounded modern sans stack.
- Body copy stays compact and system-native for dashboard scanning.
- Schema slugs, generated code, and IDs use mono with tabular numerics.
```
