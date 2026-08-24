---
name: shader-gradient
description: >-
  Use Shader Gradient (@shadergradient/react) to render beautiful, animated 3D
  gradient backgrounds and meshes in React. Trigger proactively for frontend/
  design tasks needing a moving gradient hero background, glassy color field,
  or animated mesh — in a React/Next.js project. Built on React Three Fiber,
  so three + R3F are required peers. Companion to react-three-fiber, gsap,
  reactbits.
---

# Shader Gradient

`@shadergradient/react` (v2) renders customizable, animated 3D gradients on a
WebGL canvas. Ideal for hero backgrounds, ambient color fields, and "alive"
gradient meshes without hand-writing GLSL.

## When to use

- Animated gradient / color-mesh background in a React app.
- Replacing a static CSS gradient with something that moves and feels premium.
- Designing via the visual editor at shadergradient.co/customize, then pasting
  the generated settings into code.

## Install

```bash
npm i @shadergradient/react @react-three/fiber three three-stdlib camera-controls
npm i -D @types/three
```

> Version note: For **Next.js 15 App Router** (React 19) you MUST use
> `@react-three/fiber@^9`. For Next 14 / Vite / React 18 use matching 8.x/9.x.
> Stay on these combos — no `next.config` aliases needed.

## Core usage

```jsx
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

export default function Background() {
  return (
    <ShaderGradientCanvas
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      pixelDensity={1.5}
      fov={45}
    >
      <ShaderGradient
        cDistance={32}
        cPolarAngle={125}
        color1="#52ff89"
        color2="#dbba95"
        color3="#d0bce1"
        uSpeed={0.4}
        uStrength={4}
        uFrequency={5.5}
      />
    </ShaderGradientCanvas>
  );
}
```

## Use settings from the visual editor

1. Go to https://www.shadergradient.co/customize, tune colors/motion.
2. Copy the generated URL and pass it: `control='query'` + that `urlString`.
   (Less code, easy to tweak later.)

## Best practices

- Keep `pixelDensity` modest (1–1.5); higher hurts performance with no visual
  gain on most screens.
- Place the canvas `position:absolute; inset:0` behind content; give content a
  higher `z-index` and ensure text remains readable (overlay a scrim if needed).
- Pause/reduce on mobile or respect `prefers-reduced-motion` for accessibility.
- `@shadergradient/react` v2 only ships the renderer; there is no built-in
  control UI — drive it with your own state or the `query` URL approach.

## Gotchas

- It is a WebGL canvas — if WebGL is unavailable, provide a CSS-gradient
  fallback behind it.
- Heavy on low-end devices; avoid stacking multiple gradient canvases.
- SSR: mark the component `'use client'` and dynamically import with
  `ssr: false` in Next.js App Router to avoid `window`/`document` errors.
