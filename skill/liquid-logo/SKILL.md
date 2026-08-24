---
name: liquid-logo
description: >-
  Use Liquid Logo technique to apply an Apple-style liquid-glass refraction
  treatment to a logo, wordmark, or brand mark on the web. Trigger proactively
  for frontend/design/branding tasks that want a logo to look refractive,
  glassy, and physical — refracting the background behind it. Built from the
  same backdrop-filter + SVG feDisplacementMap approach as liquid-glass-js.
  Companion to liquid-glass-js, gsap, shader-gradient.
---

# Liquid Logo

A "liquid logo" is a brand mark (SVG logo, wordmark, or monogram) rendered with
the Apple-style liquid-glass treatment: the backdrop behind the logo is
refracted through it, giving a physical, premium glass feel. There is no single
canonical npm package named "liquid-logo"; it is composed from the liquid-glass
technique applied to a logo element.

## When to use

- Brand/hero logos that should feel "liquid", glassy, or refractive.
- Replacing a flat PNG/SVG logo with one that warps its backdrop.
- Anywhere a logo sits over imagery, a gradient, or a video and you want depth.

## Approach

1. Take your logo as inline SVG (so it can sit inside the glass element and
   receive the displacement).
2. Wrap it in a liquid-glass surface using `backdrop-filter` + an SVG
   `feDisplacementMap` (see the `liquid-glass-js` skill for the full
   technique and progressive-enhancement fallback).

```jsx
import { LiquidGlass } from '@liquidglass/react';

export function LiquidLogo() {
  return (
    <LiquidGlass borderRadius={999} blur={0.6} saturation={1.3} contrast={1.15}
      className="logo-glass">
      <svg viewBox="0 0 100 100" width="56" height="56" aria-label="Logo">
        {/* your mark */}
        <path d="M20 70 L50 20 L80 70 Z" fill="white" />
      </svg>
    </LiquidGlass>
  );
}
```

Or, vanilla, wrap the logo in a `.glass` element per the `liquid-glass-js`
CSS+SVG recipe.

## Best practices

- Inline the logo SVG (not an `<img>`) so the displacement can act on it and so
  it stays crisp/themeable.
- Keep displacement low (`scale` 20–40) for a logo — legibility matters more
  than drama.
- Keep the mark high-contrast (white/near-white) so it reads over busy
  backdrops; add a faint scrim if needed.
- Provide a static, non-refracted logo fallback for reduced-motion users and
  for browsers that drop SVG `url()` backdrop filters (iOS Safari/Chrome).
- Animate the highlight/glare subtly with `gsap` rather than constantly
  morphing the logo shape — constant distortion hurts brand recognition.

## Gotchas

- SVG `feDisplacementMap` only refracts content *behind* the element; the logo
  must overlay real imagery/gradient to show the effect.
- On iOS, `backdrop-filter: url(#filter)` is reported as supported but fails —
  gate the displacement behind `(hover:hover) and (pointer:fine)` and keep a
  plain blur fallback (see `liquid-glass-js`).
- Too much refraction on a logo destroys recognizability — prefer a tasteful,
  mostly-frosted look.
