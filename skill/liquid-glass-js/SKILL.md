---
name: liquid-glass-js
description: >-
  Use Liquid Glass JS for Apple-style "liquid glass" refraction effects on the
  web — frosted, refractive UI elements and surfaces built with
  backdrop-filter + SVG feDisplacementMap. Trigger proactively for frontend/
  design tasks wanting glassmorphism with real refraction, specular highlights,
  and chromatic aberration on buttons, cards, nav bars, or logos. Vanilla and
  React options available. Companion to liquid-logo and gsap.
---

# Liquid Glass JS

"Liquid glass" is the Apple-style treatment that goes beyond plain
glassmorphism: a `backdrop-filter` blur PLUS an SVG displacement map so the
content behind the element is optically refracted (warped), with specular
highlights and often chromatic aberration. Implement it directly with
CSS+SVG, or use a small library.

## When to use

- Glass panels, nav capsules, buttons, cards that refract their backdrop.
- A premium "physical" UI feel over flat frosted glass.
- Apply the same technique to a logo/wordmark → see the `liquid-logo` skill.

## Core technique (framework-agnostic)

```html
<div class="glass">content</div>
<svg width="0" height="0">
  <filter id="lg">
    <feImage result="map" href="data:image/svg+xml,.../>  <!-- a radial bump map -->
    <feDisplacementMap in="SourceGraphic" in2="map" scale="40"
      xChannelSelector="R" yChannelSelector="G" />
  </filter>
</svg>
```

```css
.glass {
  backdrop-filter: blur(8px) saturate(140%) url(#lg);
  -webkit-backdrop-filter: blur(8px) saturate(140%) url(#lg);
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.4),
              0 10px 30px rgba(0,0,0,0.25);
  border-radius: 20px;
  contain: strict;            /* isolate paint cost */
}
/* Progressive enhancement: SVG url() filters break on iOS Safari/Chrome,
   so only apply the displacement where it actually works. */
@supports (backdrop-filter: url(#lg)) and (hover: hover) and (pointer: fine) {
  .glass { backdrop-filter: blur(8px) saturate(140%) url(#lg); }
}
```

## Library options

Vanilla (zero-dep, also ships React bindings):
```bash
npm install liquid-glass-component-kit   # Apple-inspired, vanilla + React
# or
npm install simple-liquid-glass          # ~10KB, SVG-displacement, SSR-safe
```

React component:
```bash
npm install @liquidglass/react           # <LiquidGlass /> with props
# or
npm install liquid-glass-react           # mode: standard | polar | prominent | shader
```

```jsx
import { LiquidGlass } from '@liquidglass/react';
<LiquidGlass borderRadius={20} blur={0.5} contrast={1.2} saturation={1.2}>
  <h2>Refracted content</h2>
</LiquidGlass>
```

## Best practices

- Keep the displant map subtle (`scale` 20–50) — too much looks broken.
- Use `contain: strict` + small element bounds to protect Interaction-to-Next-
  Paint (INP) on heavy blur+displacement.
- Add a plain `backdrop-filter: blur()` fallback for browsers without SVG-filter
  support (especially iOS Safari/Chrome where `url()` displacement is dropped).
- Always keep text behind glass readable — refraction can wreck contrast; add a
  scrim or reduce displacement under text.
- Respect `prefers-reduced-motion`; animate highlights sparingly.

## Gotchas

- `backdrop-filter: url(#filter)` reports supported via `@supports` on iOS but
  silently fails — detect with `(hover:hover) and (pointer:fine)` and fall back.
- SVG displacement only refracts what's *behind* the element in the same
  stacking/compositing context — the element must sit over real content.
- WebGL-based "shader" glass modes look best but cost the most GPU.
