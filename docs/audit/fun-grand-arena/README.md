# Fun courtyard and demon update

The Fun scene now has a broad ruined courtyard, smaller characters, and a revised animated demon. The original GLB remains available; the app and download link select `public/models/fun/demon-battle-grand-arena.glb`. No dependencies were added.

## Changes

- Terrain bounds grew from 6.03 × 4.65 to 11.61 × 9.43 world units in X/Z: approximately four times the footprint. Open arches, stone steps, overgrowth, broken masonry, braziers and inset rings give the environment scale.
- Hero wrapper scales are 0.82; the demon wrapper is 0.88. Hero proportions, source meshes, rig hierarchies, inverse bind matrices, texture atlases, and original animation channels are preserved.
- Demon refinements include inset almond eyes, brows, swept ivory horns, articulated braids and casting forearm, skirt/boot detailing, gold trim, and a broader cape. Stone, cloth and skin now explicitly use nonmetallic materials.
- The exported eight-second `Party_vs_Demon` loop has 31 channels sampled at 24 Hz: casting anticipation, levitation, recoil, cape/braid motion, tilting scales, rotating runes, charging halo, orbiting embers, expanding runic wave, and witchflame motion. Existing hero clips remain embedded.
- Wider/taller modal and responsive camera framing accommodate the courtyard. Shadow coverage follows the enlarged environment. Orbit, zoom, pause, reset and reduced motion remain supported.
- Fixed two existing Fun presentation defects: a fixed background layer covered the modal, and a Drei HTML loading fallback caused a React DOM cleanup exception. Loading/error text now belongs to the surrounding DOM.
- Reset clears remaining orbit momentum. Home-world unmount disposes cloned skeleton bone textures; repeated Fun/home navigation no longer adds four textures per round trip.

## Asset evidence

| Measurement | Original | Candidate |
| --- | ---: | ---: |
| GLB bytes | 2,053,992 | 2,269,988 |
| Decoded unique mesh triangles | 105,732 | 153,548 |
| Mesh primitives | 25 | 38 |
| Degenerate triangles | 1 | 1 |
| Invalid indices / nonfinite attributes / zero normals / invalid weight sums | 0 | 0 |

Original SHA-256: `d6340e4fe3718e106911f700e5e8ad232d75c399658d8439d4180bd0e3063f90`.

Candidate SHA-256: `763fd42bd33968b4037adfd6cffb892314ed2df8c6d933327b9426764df5e61f`.

All four source character GLB hashes match the initial inventory. Decoded source clip data and skin/inverse-bind data match the original battle export exactly. There are no unexpected choreography loop seams. The two projectile translations reset only while scaled to zero, as in the original.

The rigid demon hierarchy was sampled at all 193 authored frames. Its animated bounds are X 0.599–1.893, Y 0.048–2.104, Z −1.300–−0.100. The full casting pose intentionally levitates. Screenshots at 0, 2, 5.75 and 8 seconds were inspected in the app; endpoint screenshots match. No visible hair, cape, horn or face discontinuities were observed. These checks are not a Khronos conformance validation or an exhaustive topology/UV audit.

## Production comparison

Baseline: `127cad4e98870024446f82bcb1080104d8124ca9`. Verified runtime: `faf86819abeff13b5764dfcd88ab3348bd05d1a8` (later commits add verification artifacts).

Chrome 158.0.8127.88, Windows 10.0.26300, AMD Ryzen 5 8645HS / Radeon 760M, ANGLE D3D11. Route `/fun`, unthrottled loopback production preview at port 5187, fresh browser context and disabled HTTP cache per route. Five-second settle and five-second requestAnimationFrame sample. Desktop 1440×900 at DPR 1; mobile viewport 390×844 at emulated DPR 2, with renderer DPR capped at 1.5. Both use this laptop GPU.

| Viewport / run | p50 frame ms | p95 frame ms | Ready observed ms | Calls / triangles |
| --- | ---: | ---: | ---: | ---: |
| Desktop before | 7.0 | 7.5 | 7,906 | 43 / 207,392 |
| Desktop after | 6.9 | 7.1 | 3,098 | 68 / 302,400 |
| Desktop after repeat | 6.9 | 7.1 | 2,845 | 68 / 302,400 |
| Mobile viewport before | 6.9 | 7.1 | 6,214 | 43 / 207,392 |
| Mobile viewport after | 6.9 | 7.1 | 3,405 | 68 / 302,400 |
| Mobile viewport after repeat | 6.9 | 7.0 | 3,410 | 68 / 302,400 |

The candidate increases rendering work. Samples remain near this display's 144 Hz limit, so these results do not establish GPU headroom or phone FPS. Renderer counters include multiple passes and differ from unique mesh triangles; they are snapshots, not GPU timings or complete VRAM measurements. Cold readiness includes loader/UI behavior and the baseline's DOM exception, so the readiness change is not an isolated asset-loading speedup. Detailed network resources are in the browser reports. LoadingManager fallbacks still mean readiness is not guaranteed asset-complete warmup.

## Verification

- `npm run build` passes (`tsc -b && vite build`).
- `npm run lint` exits 0 with **2,435 existing warnings**, identical to the baseline, and zero errors. This is not a warning-free lint result.
- Desktop/mobile screenshots inspected in light and dark themes: readable text and controls, contained modal, no horizontal overflow or navigation/music/footer collisions. One Canvas remains mounted.
- Pause freezes six animated demon/effect nodes; resume changes them. Reduced motion freezes them and disables the motion control.
- Orbit, zoom, exact reset, Escape/close, direct `/fun`, browser back/forward, five rapid forward/back interruptions, and simulated frozen-tab resume pass.
- Three repeated route cycles retain 83 renderer geometries and 12 textures after home resources have been loaded. Fresh Fun has 38 geometries and 11 textures. These counts are not a complete memory-leak proof.
- An intentionally failed candidate request displays the error message and still permits closing the modal.
- Zero unexpected browser errors or failed HTTP responses in the successful candidate route checks. Existing Three.js Clock/PCFSoftShadowMap deprecation warnings remain.

Not tested: real phone hardware, touch pinch on a physical device, every other destination/selection modal, separate transition frame-time distributions, arbitrary animation blending in external viewers, or exhaustive extreme-orbit views. The source hero clips and other scene framing were not changed.

## Reproduce

From the repository root, using the installed dependencies:

```powershell
node scripts/build-fun-battle.mjs public/models/fun/demon-battle-grand-arena.glb
node .agents/skills/3d-model-quality/scripts/inspect-assets.mjs public/models/fun <fresh-output>/assets.json
node scripts/inspect-fun-arena.mjs <fresh-output>/quality.json
npm run build
npm run lint
npm run preview -- --host 127.0.0.1 --port 5187 --strictPort
```

In a second shell, choose fresh output folders to preserve the reference records:

```powershell
$env:AUDIT_ROUTES='/fun'
$env:AUDIT_URL='http://127.0.0.1:5187'
$env:AUDIT_OUT='<fresh-output>/production'
node scripts/audit-browser-baseline.mjs
$env:QA_URL='http://127.0.0.1:5187'
$env:QA_OUT='<fresh-output>/interaction'
node scripts/qa-fun-arena.mjs
```

`capture-fun-arena-poses.mjs` uses the stored quality report's tracks, and `qa-fun-arena-lifecycle.mjs` checks the port-5187 lifecycle/error flow. Early `candidate-*` and `after/interaction` records document defects subsequently fixed; `after/interaction-verified`, `after/lifecycle.json`, and both `after/production*` reports are the final verification.
