---
name: three-js
description: >-
  Use Three.js for WebGL 3D graphics in the browser — 3D scenes, animated
  backgrounds, shaders, particle systems, product viewers. Framework-agnostic
  core library (vanilla JS/TS). Trigger proactively for frontend/design tasks
  involving 3D, generative visuals, shader backgrounds, or canvas-based
  rendering. In a React project prefer the react-three-fiber skill instead.
  Pairs with gsap, shader-gradient, react-three-fiber, liquid-glass-js.
---

# Three.js

WebGL 3D library. Use for any real-time 3D rendering in the browser:
backgrounds, hero visuals, data viz, interactive objects, custom GLSL shaders.

## When to use

- A 3D scene, model viewer, or perspective camera is needed.
- Animated/generative backgrounds, particle fields, distortion meshes.
- Custom shaders (GLSL) for unique visual effects.
- NOT needed for simple 2D animation — use gsap or CSS then.

## Install

```bash
npm install three
npm install -D @types/three   # if using TypeScript
```

## Core pattern

```js
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const geo = new THREE.IcosahedronGeometry(1, 4);
const mat = new THREE.MeshStandardMaterial({ color: 0xe0973f, roughness: 0.4 });
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const key = new THREE.DirectionalLight(0xffffff, 1);
key.position.set(3, 3, 5);
scene.add(key);

function tick() {
  mesh.rotation.y += 0.004;
  mesh.rotation.x += 0.002;
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
```

## Best practices

- Cap `setPixelRatio` at 2 — higher kills performance on retina/phones.
- Dispose geometries, materials, and the renderer on teardown to avoid GPU leaks.
- Keep the render loop single and `requestAnimationFrame`-driven.
- Use `BufferGeometry` and instancing (`InstancedMesh`) for many objects.
- For post-processing (bloom, etc.) use `three/examples/jsm/postprocessing`.
- Consider `OrbitControls` from `three/examples/jsm/controls` for interactivity.

## Gotchas

- WebGL context can fail on low-end devices — guard with a fallback (static
  image/CSS gradient).
- `alpha: true` + a transparent clear color lets CSS backgrounds show through.
- Heavy scenes hurt mobile INP — throttle or pause when offscreen.
- Prefer `react-three-fiber` when the host app is React.
