# Blue Flower Garden — standalone GLB candidate

An original procedural fantasy meadow asset for Three.js / React Three Fiber. This package is separate from the live portfolio; no existing model was replaced and no website route imports it.

## Deliverables

- `blue-flower-garden.glb`: Draco-compressed glTF 2.0, roughly 1.5 MB. Eight skinned material batches, **109,466 triangles**, three six-second animation clips.
- `garden-runtime.mjs` and `garden-runtime.d.mts`: Three.js runtime and TypeScript declarations. Handles the continuous 12-second crystal spin, petal alpha fades, mana emission pulse, cloud depth writing, transparent single-pass rendering and optional reduced motion.
- `BlueFlowerGarden.tsx`: optional R3F component using an owned SkeletonUtils clone. It is outside `src` and is not part of the portfolio build.
- `preview.html` / `preview.mjs`: standalone orbitable viewer; `previews/` contains inspected overview, detail, underside and mobile screenshots plus measured validation.
- `manifest.json` / `inspection.json`: generated specification counts and decoded asset inventory.
- Generator: `../../scripts/build-blue-flower-garden-candidate.mjs`.

## Specification choices

The agreed coordinate endpoints are retained: Y = −3.8 to +0.42 m, a **4.22 m** core span. This intentionally takes precedence over the conflicting 5.2 m description. Vegetation and horizon clouds naturally extend above the terrain crest. +Y is up and +Z is forward; the main terrain has an irregular approximately 9 m radius. Mesh-node transforms are identity; geometry placement is baked. Bones carry animation pivots; nonrendering staging anchors carry positions.

The flat 1.8 m hero circle centered at [0, 0.42, 0.1] has only short flowers; its tallest blossom is **0.561 m** in the generated geometry. Empty `Himmel_StagingAnchor` and `Frieren_StagingAnchor` nodes reserve positions. Character models are not included.

The scene includes 4,200 meadow flowers with exactly 2,100 blue, 1,050 cyan, 630 lavender and 420 white blossoms; 120 additional shrub flowers do not change those meadow percentages. There are 24 shrubs, three trees at the requested positions, 1,250 three-blade grass tufts, 150 clover tufts, the south stair landing, east stone arch/pedestal with ivy, six underbelly crystals, eight satellite rocks/crystals, 64 petals and 40 mana motes. The cloud bank forms a horizon crescent with an open foreground to protect the island silhouette. Color variation is baked into vertex colors; only a tiny embedded emissive mask texture is required.

## Animation and materials

All three embedded clips are 6.0 seconds, use LINEAR interpolation, and are played with Three.js LoopRepeat by the helper:

1. `Island_Idle_Breeze`: 0.5 Hz branch/foliage sway and subtle flower-sector motion. Rigid skinning lets independent sectors move without creating separate render submissions.
2. `Floating_Orbit_Crystals`: phase-offset ±0.18 m satellite bob. The helper rotates crystal bones once every 12 seconds independently of the six-second clip boundary.
3. `Petal_Wind_Drift`: spiral rising petal motion, tumbling, scale fade around the wrap, and mote scale pulsing. The helper adds continuous interpolated spiral positioning, per-vertex alpha fades and emission cycling 0.6 → 1.8 → 0.6.

Standard glTF node animation cannot encode material opacity/emissive keyframes, runtime `depthWrite`, or an enforced loop mode. Those are applied by the supplied helper, as agreed. A generic glTF viewer still displays the model and core clips, but does not reproduce every effect. The helper also adds a subtle back-face diffuse lift to opaque double-sided petals; it is a stylized translucency approximation, not physical subsurface scattering. Emissive crystals do not cast light without an application lighting setup.

PBR material families follow the supplied roughness/metalness values: terrain .95/0, rock .88/.05, blossoms .92/0, crystals .25/.15 and emissive strength 1.4, clouds .98/0 with .88 alpha. Eight batches are terrain/grass/shrubs, rock/ruins, bark, canopy/flowers, golden stamens, crystals, clouds, and drifting particles. Detail colors use vertex attributes instead of increasing material count.

## Rendering budget and verification

Chrome/Three.js measured **eight model draw calls** and 109,466 submitted triangles in overview, detail, underside and mobile viewports. This is the model color pass with shadows disabled and `forceSinglePass` on transparent materials. Enabling shadow passes, adding characters, outlines or postprocessing increases whole-scene calls; eight is not a promise for the entire portfolio.

The asset uses 151 joints to batch animated subobjects into eight meshes. This trades fewer calls for skinning work; profile actual target phones before deployment. The helper updates only the small particle batch's alpha attributes and owns its cloned materials/particle geometry. It never disposes cached loader geometries or textures. Dispose the helper when its owned clone is removed.

Validation decodes the GLB, checks finite geometry and animation poses, normalized skin weights, triangle/primitive budgets and live renderer counts. Poses at 0, 1.5, 3, 5.999, 6 and 12 seconds were exercised. Screenshots were inspected in Three.js; the R3F wrapper passes a standalone strict TypeScript check. See `previews/verification.json` for GPU/browser and frame sampling. The mobile image is viewport emulation on desktop hardware. This has not been tested on physical iOS/Android devices or with a separate Khronos conformance validator.

## Use and reproduce

From the repository root, with existing dependencies installed:

```powershell
node scripts/build-blue-flower-garden-candidate.mjs
node .agents/skills/3d-model-quality/scripts/inspect-assets.mjs artifacts/blue-flower-garden artifacts/blue-flower-garden/inspection.json
npm run dev -- --host 127.0.0.1 --port 5188 --strictPort
# Open http://127.0.0.1:5188/artifacts/blue-flower-garden/preview.html
# In another terminal:
node scripts/verify-blue-flower-garden-candidate.mjs
```

Generation is seeded and only writes the standalone artifact directory. No new dependency is needed. The viewer uses installed Three.js modules and the repository's local Draco decoder.

For an authorized future integration, copy the GLB to the chosen public URL, place the helper/component together in the application, then mount `<BlueFlowerGarden url="/models/your-candidate.glb" />` inside Canvas. The component supplies the local `/draco/gltf/` decoder path explicitly. Use one camera controller and tune framing to include the horizon extent. Do not retain the old garden at the same time unless intentionally comparing them.

Example imperative use:

```js
const ownedScene = clone(gltf.scene); // SkeletonUtils.clone
scene.add(ownedScene);
const garden = createGardenRuntime(ownedScene, gltf.animations);
// in the render loop:
garden.update(deltaSeconds);
// on teardown:
garden.dispose();
scene.remove(ownedScene);
```

To compare deterministic poses, call `garden.setTime(seconds)`. Resolve camera, lighting, physical-device performance and final art approval in the target application before replacing the original production garden.
