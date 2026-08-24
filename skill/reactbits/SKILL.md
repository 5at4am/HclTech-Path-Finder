---
name: reactbits
description: >-
  Use React Bits (reactbits.dev) — a library of copy-paste animated React +
  Tailwind (or CSS) components: text animations, background effects, and
  interactive UI pieces. Trigger proactively for frontend/design tasks in React
  that need ready-made animated components (animated headings, aurora/grid/
  particle backgrounds, buttons, cards) without building from scratch.
  Companion to gsap, three-js, react-three-fiber, shader-gradient.
---

# React Bits

reactbits.dev is a collection of open-source, copy-paste animated React
components. You do NOT usually `npm install` a single package — you copy the
component source (Tailwind or plain-CSS variant) into your project and own it.

## When to use

- Need a polished animated component fast: text reveals, backgrounds, buttons,
  hover effects, loaders.
- Categories: Text Animations (Shiny Text, Gradient Text, Decrypted Text…),
  Animations/Backgrounds (Aurora, Grid, Ballpit, Iridescence, Light Rays…),
  Components (Star Border, Click Spark, Meta Balls…).
- Great for hero sections, landing pages, and creative UI.

## Installation (official: copy-paste)

1. Browse https://reactbits.dev, pick a component.
2. Choose the **Tailwind** or **CSS** tab, copy the code.
3. Paste into `src/components/<Name>.tsx` (ensure Tailwind is set up if using
   the Tailwind variant).
4. Import and use. Many need peer deps like `framer-motion`/`motion`,
   `three`, or `gsap` — install only what the component's import list requires.

```bash
npm install motion        # most animated components
npm install three @react-three/fiber @react-three/drei   # 3D/WebGL ones
npm install gsap          # GSAP-driven ones
```

## Install via jsrepo CLI (optional)

```bash
npx jsrepo add https://reactbits.dev/<Category>/<ComponentName>
```

## npm package alternative

`@appletosolutions/reactbits` ships 80+ components as a real package:

```bash
npm install @appletosolutions/reactbits
# peers you actually use:
npm install three @react-three/fiber @react-three/drei   # 3D
npm install gsap                                          # GSAP anims
npm install framer-motion                                 # motion ones
```

Next.js: add `transpilePackages: ['@appletosolutions/reactbits']` to
`next.config`. Vite: add it to `optimizeDeps.include`.

## Best practices

- Prefer the **Tailwind** variant when the project already uses Tailwind;
  otherwise use the **CSS** variant to avoid style conflicts.
- Components are unstyled/self-contained — wrap them in your own layout/theme.
- Keep `motion`/`framer-motion` as the single animation dependency to avoid
  mixing GSAP and Framer in one file unless intentional.
- React Bits Pro also ships "agent skills" / an MCP server
  (`reactbits-dev-mcp-server`) that returns copy-paste code — useful for agents.

## Gotchas

- Copy-paste components import their own deps; missing a peer dep throws at
  runtime, not install time. Read the import block before pasting.
- Some background components are GPU-heavy (Ballpit, Iridescence) — gate them
  on `prefers-reduced-motion` and/or pause when offscreen on mobile.
