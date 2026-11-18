# Level 03 — Whispering Forest

Reusable GLB asset pack for Antigravity integration. All 29 GLBs are exported and load in Three.js. The pack contains nine environment modules and twenty existing connection/detail modules. No character replacement is embedded. No website, Home, Archive, navigation, or world-placement changes are included.

## Files and measured dimensions

Dimensions below are **X × Y × Z in metres**, measured from transformed mesh bounds in the default pose. They include ornaments, rails, and floating rocks where present; they are not collision bounds or animation envelopes. Exact bounds, material names, clip durations, triangle counts, and SHA-256 hashes are in [asset-dimensions.json](./asset-dimensions.json).

| File | Dimensions (m) | Contents |
|---|---:|---|
| whispering-forest-island.glb | 23.963 × 8.833 × 20.211 | Organic terrain, layered rocky underside, cracks, hanging roots/vines, crystals, eight floating stones, arrival anchor |
| ancient-tree.glb | 11.174 × 8.996 × 10.281 | Twisted trunk, spreading roots/branches, foliage, hanging lanterns, runes, mushrooms, crystals |
| forest-vegetation.glb | 17.004 × 5.338 × 14.803 | Perimeter trees, bushes, grass, flowers, mushrooms; batched by material |
| enchanted-pond.glb | 4.867 × 0.577 × 7.180 | Pond, continuous stream, bank stones, lilies, flowers, animated ripple rings |
| forest-waterfall.glb | 0.880 × 8.400 × 0.279 | Water curtain and seven looping downward-flow ribbons |
| heiter-resting-area.glb | 3.145 × 1.501 × 1.914 | Bench, side table, book, goblet, lantern, plants, Heiter anchors |
| about-interaction-assets.glb | 3.500 × 2.526 × 3.500 | Stone platform/pedestal, separate biography book, reading desk and scroll, blank noticeboard, shelf books, floating pages |
| forest-decorations.glb | 10.554 × 1.591 × 8.057 | Curving stone paths, stream bridge, hill steps, markers, lanterns |
| forest-effects.glb | 11.148 × 5.700 × 11.378 | Fireflies, drifting leaves/petals, tiny spirits, glowing leaves |
| stairs-straight.glb | 1.658 × 2.490 × 3.270 | Existing eight-step straight stair |
| stairs-ceremonial.glb | 3.950 × 2.892 × 4.870 | Existing ten-step wide stair, ornamental entry posts |
| stairs-small.glb | 1.462 × 1.491 × 1.403 | Existing three-step elevation change |
| stairs-curved.glb | 3.007 × 2.813 × 3.012 | Existing ten-step quarter-turn stair |
| stairs-spiral.glb | 5.369 × 5.334 × 5.369 | Existing 24-step full-turn spiral |
| bridge-wooden.glb | 1.844 × 1.329 × 4.046 | Arched wooden deck and rails |
| bridge-stone.glb | 2.236 × 1.330 × 4.844 | Arched stone deck and rails |
| bridge-curved.glb | 3.879 × 1.330 × 3.902 | Quarter-turn wooden bridge with continuous deck |
| walkway-narrow.glb | 1.100 × 0.140 × 2.990 | Narrow planked walkway |
| platform-small.glb | 1.800 × 1.449 × 1.800 | Small floating landing |
| platform-medium.glb | 3.200 × 2.359 × 3.200 | Medium floating landing |
| platform-large.glb | 4.800 × 3.399 × 4.800 | Large floating landing |
| stepping-stone.glb | 0.800 × 0.799 × 0.800 | Small floating stepping stone |
| platform-decorative.glb | 2.600 × 1.969 × 2.600 | Rune-trimmed floating landing |
| detail-arch.glb | 2.850 × 3.363 × 0.500 | Pointed fantasy arch |
| detail-pillar.glb | 0.650 × 2.700 × 0.650 | Stone pillar |
| detail-railing.glb | 0.084 × 0.962 × 2.050 | Two-metre railing module |
| detail-lantern.glb | 0.249 × 1.550 × 0.249 | Lantern and wooden post |
| detail-crystal-light.glb | 0.507 × 1.341 × 0.450 | Emissive crystal and rock base |
| detail-runestone.glb | 1.156 × 1.148 × 0.480 | Carved stone marker and luminous glyph |

Connections are separate files rather than one duplicated forest-connections.glb. Load only the pieces needed for the final layout.

## Coordinates and suggested local assembly

Right-handed coordinates; +Y is up and +Z is forward. Use unit scale. Every position in [manifest.json](./manifest.json) is **relative to one forest group**, not a final world coordinate. Antigravity places, rotates, and uniformly scales that group as needed.

| Environment module | Local translation [X,Y,Z] | Origin |
|---|---|---|
| whispering-forest-island.glb | [0,0,0] | Terrain reference origin; rock underside extends below Y=0 |
| ancient-tree.glb | [0.7,0.645390,-2.6] | Trunk foot |
| forest-vegetation.glb | [0,0,0] | Island-aligned planted collection |
| enchanted-pond.glb | [0,0,0] | Island-aligned pond and stream; water at approximately Y=0.13 |
| forest-waterfall.glb | [0,0,0] | Island-aligned outlet; geometry is offset from origin |
| heiter-resting-area.glb | [-5.5,0.263859,1] | Ground beneath bench centre |
| about-interaction-assets.glb | [1.35,0.434853,0.5] | Story platform centre at ground |
| forest-decorations.glb | [0,0,0] | Island-aligned paths and bridge |
| forest-effects.glb | [0,0,0] | Island-aligned effect collection |

Use the full-precision manifest values in code. Do not automatically centre the island-aligned assets: their offsets are intentional. Keep animation targets under their original GLTF scene root.

Important named nodes:

- ForestArrivalAnchor: suggested local arrival point on the existing path.
- HeiterIdleAnchor: [-0.08,0,0.70] within the resting-area scene.
- HeiterSeatAnchor: [0,0.09,0], optional unverified seated alignment; bench seat top is 0.48 m.
- BiographyBook: separate root group in the About GLB at [0,1.12,0], with independently raycastable child meshes.
- AboutModalFocusAnchor: [0,1.2,0.8] in the About scene. This is metadata, not a camera implementation.
- Entry / Exit: connector sockets, described below.

## Connection dimensions and assembly

These are the existing staircase designs. All Entry sockets are [0,0,0]. Their +Z axis points along travel. Exit rotation supplies the onward direction. Connector rise/run are nominal walking dimensions, not whole-object bounding boxes.

| File | Walking width | Run / centreline arc | Rise | Steps / tread | Exit [X,Y,Z] / yaw |
|---|---:|---:|---:|---|---|
| stairs-straight.glb | 1.60 | 3.20 | 1.60 | 8 × 0.20 rise; 0.40 tread | [0,1.6,3.2] / 0° |
| stairs-ceremonial.glb | 3.40 | 4.80 | 2.00 | 10 × 0.20 rise; 0.48 tread | [0,2,4.8] / 0° |
| stairs-small.glb | 1.40 | 1.35 | 0.60 | 3 × 0.20 rise; 0.45 tread | [0,0.6,1.35] / 0° |
| stairs-curved.glb | 1.50 | 3.456 | 1.80 | 10 × 0.18 rise; radius 2.20, 90° | [2.2,1.8,2.2] / 90° |
| stairs-spiral.glb | 1.30 | 12.566 | 4.32 | 24 × 0.18 rise; radius 2.00, 360° | [0,4.32,0] / 360° |
| bridge-wooden.glb | 1.80 | 4.00 | 0 | Deck crown +0.35 | [0,0,4] / 0° |
| bridge-stone.glb | 2.20 | 4.80 | 0 | Deck crown +0.35 | [0,0,4.8] / 0° |
| bridge-curved.glb | 1.70 | 4.702 | 0 | Radius 2.993631, 90°; crown +0.35 | [2.993631,0,2.993631] / 90° |
| walkway-narrow.glb | 1.10 | 3.00 | 0 | 12 planks, 0.01 gaps | [0,0,3] / 0° |

The curved bridge manifest run is its rounded 4.70 m design value; its actual radius and endpoint are authoritative. Stair Entry is immediately before the first riser. Straight-stair trim adds up to 0.012 m above the nominal tread; allow this small lip in collision construction. Spiral assembly requires an approach/exit landing and clearance from adjacent modules.

Platform Entry is the front edge; Exit is the opposite edge. Their centres are [0,0,diameter/2], and the main top is Y=0. Diameters are 0.8, 1.8, 2.6, 3.2 and 4.8 m. Railings and ornament extend outside nominal walking widths. For detail-* files the Entry/Exit nodes are placement references only; a pillar, lamp or crystal is not traversable.

For two pieces in a common parent coordinate system:
1. Compute the first piece's Exit transform in that parent.
2. Multiply it by the inverse of the next piece's local Entry transform.
3. Apply the result to the next piece.

General matrix equation: nextLocal = inverse(parentWorld) × previousExitWorld × inverse(nextEntryRelativeToRoot). Update world matrices before reading sockets. Keep positive uniform scale; mirrored/nonuniform transforms change tread geometry and normals. The GLBs contain renderable walkable surfaces, but no physics engine, navigation mesh, or runtime collider system.

## Materials and textures

GLB v2 metallic/roughness materials load directly with GLTFLoader. Every primitive has normals and UVs. The small stone and wood grain PNGs are **embedded inside each GLB that uses them**, so no external image path is required at runtime. The two 256×256 files in textures/ are source assets for the authoring script. Other materials use flat base colours, roughness, and selected emissive colours.

The pond uses blended water at opacity 0.86. The waterfall curtain is double-sided geometry with animated narrow ribbons; ripple rings and mesh movement provide stylized water animation. There is no fluid simulation, refraction shader, or baked cloud volume. Emissive lanterns/crystals do not illuminate neighbouring meshes by themselves: the preview uses restrained point lights, which Antigravity should budget within its existing lighting setup. Bloom is optional.

Environment GLBs use standard materials; they do not bake the website's custom toon or outline shaders. Preserve map, colour, emissive, alpha and side settings if adapting them to an existing environment material system. The preview uses cool directional/hemisphere light and warm lantern fills. Do not apply an environment material override to Heiter.

## Verified animation names

Play the clips together within each asset's own AnimationMixer. They loop with Three.js's default LoopRepeat.

| Asset | Actual exported names | Seconds |
|---|---|---|
| whispering-forest-island.glb | FloatingStoneDrift_0 … FloatingStoneDrift_7 | 7 … 14 |
| enchanted-pond.glb | PondRipplePulse_0 … PondRipplePulse_3 | 4 each |
| forest-waterfall.glb | WaterFlow_0 … WaterFlow_6 | 4 each |
| about-interaction-assets.glb | StoryPageDrift_0 … StoryPageDrift_2 | 7, 8, 9 |
| forest-effects.glb | FireflyDrift, LeafDrift, SpiritDrift | 11, 13, 9 |

The other forest GLBs are static. Water ribbons reset while scaled to zero at loop boundaries. These are lightweight transform animations, not skeletal animation. Expand animation/culling bounds if using aggressive culling.

## Heiter: reuse and preservation

Load **/models/transition/heiter.glb** separately, without re-exporting or replacing it. This file's SHA-256 is:

c12f31fcabe2d662b12c2f80f3102398d4a753a6f3a90664c7039f1191e83b7c

The audit confirms the file is unchanged from the preserved source. Its one skin, mesh, face atlas, proportions, clothes, colours and rig are retained. The actual available clips are heiter_idle, heiter_jump, heiter_fall, heiter_landing_prepare and heiter_landing. The preview uses **heiter_idle**.

Place the Heiter root at HeiterIdleAnchor, facing local yaw 1.0 radian toward the pond, at original scale. Convert the anchor's world position into the character scene's local coordinates if its parent has a transform. Use the project's existing createPartyPalette() from src/components/Scene/partyMaterials.ts to restore the established toon material and skinned silhouette outline, exactly as preview.js does; this reads the existing character texture and does not edit the GLB.

When using a cached character in React Three Fiber, clone its hierarchy with SkeletonUtils.clone before independent placement/animation, and use a separate mixer. Reuse the application's palette lifecycle and clean up the dressing/outline on unmount.

The home GLB also contains Heiter_Drink, but this is **not** in the standalone model. The optional HeiterSeatAnchor is only an integration hint. Seated drinking was not validated in the final forest preview. If Antigravity chooses it, load the home clip and corresponding source bone defaults, restore the source rest transforms before applying it, and verify foot/seat/goblet alignment. Use the verified standing idle until that optional setup is tested.

## Loading and About interaction

The following code belongs in Antigravity's integration, not in a new camera/navigation system:

~~~js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const base = '/models/whispering-forest/';
const manifest = await (await fetch(base + 'manifest.json')).json();
const loader = new GLTFLoader();
const forest = new THREE.Group();
const mixers = [];
const loaded = new Map();

await Promise.all(manifest.files.map(async ({ file, position }) => {
  const gltf = await loader.loadAsync(base + file);
  gltf.scene.position.fromArray(position);
  forest.add(gltf.scene);
  loaded.set(file, gltf);
  if (gltf.animations.length) {
    const mixer = new THREE.AnimationMixer(gltf.scene);
    gltf.animations.forEach(clip => mixer.clipAction(clip).play());
    mixers.push(mixer);
  }
}));

// Attach forest to the existing scene at the world transform selected by Antigravity.
// Update these mixers with deltaSeconds in the existing render loop.
// Any connector loads through the same loader:
const bridge = await loader.loadAsync(base + 'bridge-curved.glb');

const story = loaded.get('about-interaction-assets.glb').scene;
const book = story.getObjectByName('BiographyBook');
// In the existing pointer handler:
const hits = raycaster.intersectObject(book, true);
if (hits.length) openAboutModal();
~~~

raycaster and openAboutModal above are supplied by the website. BiographyBook carries userData.interactionTarget=true and contentId="about-me". In R3F, bind clicks to that subtree or walk parents from the intersected mesh to the named root. Keep the blank noticeboard and scroll available for actual content. No personal biography or achievements are invented.

Reuse static connector geometry/materials across clones. Do not dispose shared geometry when removing one clone. Stop/uncache mixers, remove palette dressing, and dispose owned resources on final unload.

## Verification and performance

See [verification.json](./verification.json) for the browser result and hashes, and [asset-dimensions.json](./asset-dimensions.json) for the structural audit.

Passed checks:
- All 29 manifest-listed GLBs exist; valid binary headers, buffer ranges and accessor bounds.
- Finite vertex data, indexed triangles, normals and UVs; no degenerate triangles.
- Embedded PNG headers/dimensions and all primitive/material/texture/image links.
- Three.js browser loading with no console/page/resource errors; 38 decoded texture bindings.
- Twenty connector positions and Exit rotations match the manifest.
- 381 downward ray samples across three lateral positions on every existing stair and bridge section.
- Scene animation update and finite transforms; BiographyBook recursive raycast succeeds.
- Desktop 1440×1080 and portrait 390×844 preview rendering.
- Existing Heiter byte hash and actual idle clip verified.
- Oxlint passes on the four maintained JavaScript files.

The 29 GLBs total approximately 11.43 MB uncompressed. The assembled nine-module forest plus Heiter contains 137,328 unique geometry triangles; the sampled preview recorded 103 draw calls. The complete export inventory, including unloaded connection pieces, has 143,820 triangles. Counts vary with camera culling, outlines, shadows and final integration.

The browser check used Chrome with SwiftShader. It is **not a physical mobile-device FPS benchmark**. No Khronos external validator or final-site collision/navigation test was run. Antigravity should profile the integrated world on target devices, cap pixel ratio, unload hidden destinations, and avoid loading the entire connector catalogue when unnecessary.

## Preview files and maintenance

Eight PNGs are in previews/: forest-overview, forest-tree, forest-pond, forest-heiter, forest-about, forest-underside, forest-connections and forest-mobile.

Supporting files:
- manifest.json: local assembly positions, connection socket metadata, Heiter and interaction references.
- asset-dimensions.json: measured bounds, dimensions, materials, clips, counts, hashes.
- verification.json: browser checks and matching GLB hashes.
- build-assets.mjs: existing procedural source; accepts optional GLB filenames for selective repair/export.
- audit-assets.mjs: structural, material and preservation checks; refreshes asset-dimensions.json.
- preview.html / preview.js: development-only viewer using the existing Vite dependencies and character palette.
- verify-render.mjs: local Chrome verification and screenshot capture.
- textures/stone.png and textures/wood.png: source textures embedded at export.
- HANDOFF.md: final integration checklist and remaining responsibilities.

Run from the repository root:

~~~powershell
node public/models/whispering-forest/audit-assets.mjs
npm.cmd run dev -- --host 127.0.0.1 --port 4185 --strictPort
# In a second terminal, with the local server running:
node public/models/whispering-forest/verify-render.mjs
~~~

Preview URL: http://127.0.0.1:4185/models/whispering-forest/preview.html . The viewer expects Vite's Three.js dependency bundle and the existing partyMaterials.ts source; it is not a standalone production page. The verification script currently points to installed Windows Chrome. Adjust that executable path if running elsewhere.

A selective repair export is supported, for example:

~~~powershell
node public/models/whispering-forest/build-assets.mjs whispering-forest-island.glb
~~~

Normal integration does not require rebuilding assets.

