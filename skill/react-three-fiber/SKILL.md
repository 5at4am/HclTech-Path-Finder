---
name: react-three-fiber
description: >-
  Use React Three Fiber (R3F) to build Three.js scenes declaratively inside
  React. Trigger proactively for frontend/design tasks in a React/Next.js
  project that need 3D, WebGL backgrounds, shaders, or 3D product viewers.
  Requires three and @react-three/fiber. Add @react-three/drei for helpers.
  Companion to three-js, shader-gradient, and gsap skills.
---

# React Three Fiber (R3F)

Declarative React renderer for Three.js. You write `<mesh>`, `<ambientLight>`
etc. as JSX; R3F syncs them to the WebGL scene graph. Use this (not raw
`three-js`) whenever the app is already React.

## When to use

- The project is React/Next.js and needs 3D or WebGL content.
- You want component-driven, reusable 3D (props, state, hooks).
- Pair with `shader-gradient` (which is built on R3F) and `gsap` for motion.

## Install

```bash
# React 18
npm i three @react-three/fiber @react-three/drei
npm i -D @types/three

# React 19 / Next 15 App Router — MUST use R3F v9
npm i three @react-three/fiber@^9 @react-three/drei
```

> Version match matters: R3F v9 requires React 19; R3F v8 requires React 18.
> Mismatches (e.g. R3F v8 on Next 15 App Router's React 19) break at runtime.

## Core pattern

```jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';

function Sphere() {
  return (
    <Float speed={2} rotationIntensity={1}>
      <mesh rotation={[0.4, 0.2, 0]}>
        <icosahedronGeometry args={[1, 4]} />
        <meshStandardMaterial color="#e0973f" roughness={0.35} />
      </mesh>
    </Float>
  );
}

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }} dpr={[1, 2]}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 5]} intensity={1} />
      <Sphere />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}
```

## Best practices

- `dpr={[1, 2]}` caps pixel ratio for performance (don't hardcode high values).
- Use `@react-three/drei` for camera controls, loaders, `Float`, `Environment`,
  `ShaderMaterial` helpers — don't hand-roll what it provides.
- Animate in `useFrame` (the R3F render loop), not `requestAnimationFrame`.
- Keep the `Canvas` mounted once; drive changes through props/state.
- For complex scenes use `@react-three/postprocessing` (bloom, etc.).

## Gotchas

- A WebGL `<Canvas>` must have a sized parent (height/width) or it won't show.
- In Next.js App Router, mark 3D components `'use client'` and consider
  dynamic import with `ssr: false` to avoid SSR/window errors.
- Dispose resources on unmount; R3F does most of this, but custom materials/
  geometries created in effects need cleanup.
