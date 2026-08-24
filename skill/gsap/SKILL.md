---
name: gsap
description: >-
  Use GSAP (GreenSock Animation Platform) for high-performance JavaScript
  animation in any frontend project — UI micro-interactions, scroll-driven
  sequences, timelines, and SVG/canvas motion. Framework-agnostic (works in
  vanilla JS, React, Vue, etc.). Trigger proactively for frontend/design tasks
  involving animation, transitions, scroll effects, staggered reveals, or
  replacing CSS keyframes with richer motion. Pairs well with the three-js,
  react-three-fiber, reactbits, shader-gradient, liquid-glass-js and
  liquid-logo skills.
---

# GSAP

Production-grade JavaScript animation library. Use it whenever a task needs
smooth, reliable, timeline-based motion that CSS alone handles awkwardly
(scroll-linked animation, sequenced reveals, draggable/physics, SVG morphing).

## When to use

- Entrance/exit animations, staggered lists, hover micro-interactions.
- Scroll-triggered reveals and pinned sections (`ScrollTrigger`).
- Coordinating many elements on a single timeline.
- Animating SVG, canvas, or any DOM property with full control.
- Prefer GSAP over CSS `@keyframes` when timing/sequencing gets complex.

## Install

```bash
npm install gsap
# or: pnpm add gsap / yarn add gsap
```

GSAP core is free (including ScrollTrigger, Draggable, Flip, etc. as of v3.12+).

## Core API

```js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// tween to a state
gsap.to('.card', { x: 100, opacity: 0.5, duration: 0.8, ease: 'power3.out' });

// timeline for sequences
const tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.6 } });
tl.from('.title', { y: 40, opacity: 0 })
  .from('.subtitle', { y: 20, opacity: 0 }, '-=0.3')
  .from('.card', { y: 30, opacity: 0, stagger: 0.1 }, '-=0.2');

// scroll-triggered
gsap.from('.reveal', {
  scrollTrigger: { trigger: '.section', start: 'top 80%' },
  y: 60, opacity: 0, stagger: 0.15,
});
```

## Best practices

- Use `gsap.context()` (or `useGSAP` hook from `@gsap/react` in React) for
  automatic cleanup and scoping — prevents duplicate tweens on re-render.
- Animate `transform`/`opacity` for GPU-friendly, jank-free motion; avoid
  animating layout properties (`width`, `top`, etc.).
- Let GSAP manage `will-change`; don't hand-set it.
- Respect `prefers-reduced-motion`: `gsap.matchMedia()` lets you disable motion
  for users who request it.
- For React, prefer `@gsap/react`'s `useGSAP()` over `useEffect` + manual revert.

## Gotchas

- Always `registerPlugin(...)` before using a plugin.
- GSAP tweens overwrite by default only for conflicting properties — use
  `overwrite: 'auto'` when multiple tweens target the same element.
- `ScrollTrigger` needs a refresh after dynamic content/layout changes:
  `ScrollTrigger.refresh()`.
