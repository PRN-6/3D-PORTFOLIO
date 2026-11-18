# Level 04 — Rune Creation Workshop

Complete reusable asset pack for the Projects destination. Twenty GLBs form an open-front stone-and-timber workshop on an irregular floating island, with five distinct interactive project stations and a separate reference to the existing Eisen character.

All new files are confined to this directory. No website components, existing islands, navigation, transitions, character assets or staircase assets were changed. This pack does not include a magical staircase.

## Export inventory

Dimensions are default-pose mesh bounds, X × Y × Z, in metres. They include ornaments and satellite stones where present, but not full animation envelopes. Exact bounds, materials, animations, hashes and placements are recorded in [asset-inventory.json](./asset-inventory.json).

| File | Dimensions (m) | Origin / contents |
|---|---:|---|
| island/workshop-island.glb | 24.340 × 6.291 × 16.989 | Island-local reference origin; terrain top Y=0.20, layered underside down to Y=-6, six animated satellite rocks, crystals and veins |
| architecture/rune-workshop.glb | 11.950 × 6.700 × 8.000 | Pavilion floor datum; geometry extends toward -Z. Stone foundation, timber frames, slate roofs, windows, rear rune arch and crystal-capped flue |
| workshop/rune-crafting-table.glb | 2.400 × 1.650 × 2.400 | Ground beneath table centre; engraved top, workpiece and Eisen anchor |
| workshop/shelves-and-benches.glb | 10.020 × 2.780 × 3.005 | Fitted collection aligned to pavilion coordinates; two component shelves, two workbenches, books, jars, lamps and scrolls |
| workshop/crafting-tools.glb | 0.630 × 0.210 × 0.605 | Bottom of tool tray; hammer, tongs, measuring cup and small scroll |
| project-displays/station-01.glb | 1.704 × 1.718 × 1.704 | Ground beneath pedestal centre; floating rune relic |
| project-displays/station-02.glb | 1.704 × 1.493 × 1.704 | Ground beneath pedestal centre; rotating enchanted mechanism |
| project-displays/station-03.glb | 1.704 × 1.850 × 1.704 | Ground beneath pedestal centre; hovering crystal construction |
| project-displays/station-04.glb | 1.704 × 1.840 × 1.704 | Ground beneath pedestal centre; miniature architectural creation |
| project-displays/station-05.glb | 1.704 × 1.783 × 1.704 | Ground beneath pedestal centre; experimental ring-and-orb instrument |
| magical-objects/arcane-rings.glb | 2.150 × 1.464 × 2.150 | Common ring centre, with three independent local rotation pivots |
| magical-objects/rune-symbol.glb | 0.984 × 0.984 × 0.028 | Centre of upright rune seal, facing +Z |
| magical-objects/rune-floor-circle.glb | 4.064 × 0.036 × 4.064 | Centre of horizontal XZ rune circle; strokes slightly above local Y=0 |
| magical-objects/crystal-cluster.glb | 0.625 × 0.986 × 0.680 | Ground beneath rock and four crystals |
| magical-objects/enchanted-scroll.glb | 0.636 × 0.081 × 0.500 | Centre of horizontal parchment |
| magical-objects/floating-tome.glb | 0.627 × 0.123 × 0.480 | Centre of open floating book |
| magical-objects/decorative-artifacts.glb | 0.753 × 0.380 × 0.376 | Tabletop datum; divination sphere and hourglass ornament |
| magical-objects/workshop-motes.glb | 6.657 × 1.164 × 5.587 | Island-local effect collection; 24 opaque low-poly motes |
| decorations/enchanted-lamp.glb | 0.300 × 1.574 × 0.300 | Ground beneath post base |
| decorations/island-landscaping.glb | 18.699 × 3.689 × 13.815 | Island-local paths, sparse plants/rocks and two rear trees |

The artifact themes above describe visual geometry only. There are no invented project titles, descriptions, logos, technologies or personal portfolio content.

## Coordinates and local assembly

Use metres, +Y up, +Z toward the front, and a right-handed coordinate system. Place everything under a single workshop group. The coordinates below and in [manifest.json](./manifest.json) are local composition coordinates; Antigravity chooses the final world position/elevation.

All rotations are zero and scales are [1,1,1] unless specified.

| Module | Recommended local position [X,Y,Z] |
|---|---|
| Island | [0,0,0] |
| Architecture | [0,0.20,-0.60] |
| Crafting table | [0.55,0.39,-0.50] |
| Shelves and benches | [0,0.39,-0.60] |
| Crafting tools | [3.45,1.34,-2.90] |
| Arcane rings | [0.55,2.25,-0.50], scale 0.70 |
| Floating rune | [0,3.85,-3.50] |
| Floor circle | [0.55,0.415,-0.50] |
| Crystal clusters | [-6.9,0.20,-1.8]; [6.9,0.20,-2.1]; [4.8,0.20,5.5] at scale 0.70 |
| Enchanted scroll | [-3.2,2.10,-2.90], Euler XYZ [0.16,0,0.10] radians |
| Floating tome | [3.55,2.25,-2.80], Euler XYZ [0.20,0,-0.10] radians |
| Decorative artifacts | [-4.5,1.34,-2.90] |
| Enchanted lamps | [-7,0.20,3.7]; [7,0.20,3.7]; [-2,0.20,5.8]; [2,0.20,5.8] |
| Landscaping | [0,0,0] |
| Motes | [0,0,0] |

Do not centre or normalize the fitted architecture/furnishings/landscape collection geometries. Their offsets intentionally line up. The building is an open-front presentation pavilion, preserving a clear view of the central table and Eisen. It is not a closed interior requiring a new camera system.

The workshop floor supports Eisen and the complete crafting circle. Its finished surface is approximately Y=0.3965 (Y=0.38 between tiles); the rune strokes are slightly above it. Main island grass is Y=0.20.

## Five project stations

| Slot | File | Root node | Position |
|---|---|---|---|
| project-slot-01 | project-displays/station-01.glb | ProjectStation_01 | [-6.4,0.20,1.55] |
| project-slot-02 | project-displays/station-02.glb | ProjectStation_02 | [-3.6,0.20,4.10] |
| project-slot-03 | project-displays/station-03.glb | ProjectStation_03 | [0,0.20,5.15] |
| project-slot-04 | project-displays/station-04.glb | ProjectStation_04 | [3.6,0.20,4.10] |
| project-slot-05 | project-displays/station-05.glb | ProjectStation_05 | [6.4,0.20,1.55] |

Each named root has userData.interactionTarget=true, a neutral slotId, and contentSource="website". Its pedestal and Artifact_XX child belong to the same interactive assembly. Each artifact pivots at [0,0.91,0] relative to its station, keeping animation independent of the pedestal.

ProjectInfoAnchor_XX is at [0,1.8,0.12] within each station and is a reference for future information placement, not an existing label or navigation action. Adjust label clearance to final camera and typography. Leave the clear areas around the stations open.

Use recursive raycasting on each ProjectStation_XX root, or walk parents from the hit mesh to that root. Antigravity maps the slot IDs to actual project content and click behaviour.

## Eisen: preserve and reuse

Existing source: **/models/transition/eisen.glb**. It is referenced, not copied into this pack.

- Root: Eisen.
- Recommended position: [-1.50,0.39,0.55].
- Recommended local yaw: 0.28 radians, facing forward with a slight turn toward the central workpiece.
- Scale: [1,1,1], preserving the other party members' Chibi scale.
- Placement reference: EisenWorkAnchor in rune-crafting-table.glb, at [-2.05,0,1.05] relative to that file. Its assembled world-within-island position matches the recommendation.
- Selected existing animation: **eisen_idle**, representing quiet inspection beside the workpiece.
- Available standalone clips inspected: eisen_idle, eisen_jump, eisen_fall, eisen_landing_prepare, eisen_landing.
- Source SHA-256: d69f8fb6c191cbfd160148dbfc2afdb7442ac30f71f06b7ea1229d1be5d04b84.

The original one-skin rig, mesh, face atlas, clothes, armor, hair, accessories, proportions and clips are unchanged. The preview applies the existing createPartyPalette() from src/components/Scene/partyMaterials.ts to retain the established toon shading and skinned outline. The helper and original file were not edited.

The home asset also contains Eisen_Idle, Eisen_Walk, Eisen_Listen, Eisen_Speak, Eisen_Chop, Eisen_Axe and Eisen_Lift. These are not assumed to exist in the standalone model and are not used or retargeted by this pack. No new working animation or rig is supplied.

Load/clone Eisen independently using SkeletonUtils.clone if consuming a cached skinned asset. Root the mixer at Eisen, put scene placement on the character root or a parent, and keep skeletal animation local. Convert anchor positions into the character parent's coordinate space when applying a transformed island group. Reuse the existing palette lifecycle and dispose the dressing on unload.

## Entry and exit references

Both nodes are in island/workshop-island.glb:

| Node | Island-local position | Orientation |
|---|---|---|
| EntryAnchor | [0,0.23,7.0] | Identity, +Z outward toward the front |
| ExitAnchor | [7.0,0.23,-0.4] | Yaw +π/2, +X outward |

These are reference points only, 0.03 m above the main terrain. Antigravity determines arrival direction, final world placement, transitions and collisions. They do not define a staircase, bridge, navigation route or camera move.

## Animation clips and pivots

All animations use lightweight transform tracks on exported nodes; playback creates no geometry. Play the clips on a mixer rooted at the loaded scene and retain the original node hierarchy.

| File / targets | Actual clips | Duration |
|---|---|---|
| Island / SatelliteRock_0…5 | RockDrift_0…5 | 10–15 s respectively |
| Station 01 / Artifact_01 | ArtifactFloat_01 | 8 s |
| Station 02 / Artifact_02 | MechanismTurn_02 | 24 s |
| Station 03 / Artifact_03 | CrystalFloat_03 | 9 s |
| Station 04 / Artifact_04 | MiniatureFloat_04 | 11 s |
| Station 05 / Artifact_05 | ExperimentTurn_05 | 18 s |
| Arcane rings / RingPivot_0…2 | RingOrbit_0, RingOrbit_1, RingOrbit_2 | 18, 25, 32 s |
| Rune symbol / FloatingRune | RuneHover | 9 s |
| Scroll / EnchantedScroll | ScrollDrift | 12 s |
| Tome / FloatingTome | TomeDrift | 14 s |
| Motes / WorkshopMotes | MoteDrift | 15 s |

Use LoopRepeat. Spin clips rotate about local +Y at the named pivot; geometry includes intentional ring tilts. Hover clips combine gentle vertical motion and small angular movement. Other models are static. The exact channel targets and durations are in asset-inventory.json. Bounds listed in the inventory are default-pose bounds; allow animated motion when computing culling regions.

## Materials, textures and lighting

The models use standard glTF metallic/roughness materials, indexed low-poly geometry, normals and UVs. Every exported material is used. All new materials are opaque: emissive mesh strokes provide glow without large translucent particle layers.

Stone and wood grain textures are embedded PNGs, 256×256, inside the GLBs that need them. Source textures are in textures/stone.png and textures/wood.png. No external texture download or decoder extension is required. Standard GLTFLoader is sufficient; no Draco or KTX2 setup is needed.

The palette uses slate/midnight stone, timber, muted violet/blue roofing, warm metallic gold, parchment and cyan/lavender emissive accents. Emissive surfaces do not illuminate nearby objects by themselves. The preview uses broad cool lights plus only two local point lights, recorded in manifest.suggestedLights:
- Warm crafting light: [0.55,2.1,-0.5], colour #ffd79c, intensity 3, distance 7.
- Soft violet rear light: [0,3.5,-3.5], colour #9fa7fa, intensity 2, distance 7.

Light intensity is renderer/exposure-dependent; these are integration starting values. No real-time shadows, bloom or screen-space effects are required by the assets. Match existing world lighting and avoid creating a real light for every lamp. Do not apply environment material replacements to Eisen.

## Three.js / React Three Fiber integration

Example assembly, to be adapted inside the existing scene lifecycle:

~~~js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const base = '/models/rune-workshop/';
const manifest = await (await fetch(base + 'manifest.json')).json();
const loader = new GLTFLoader();
const group = new THREE.Group();
const mixers = [];

for (const asset of manifest.assets) {
  const gltf = await loader.loadAsync(base + asset.file);
  for (const placement of asset.placements) {
    const root = gltf.scene.clone(true); // Environment GLBs are not skinned.
    root.position.fromArray(placement.position);
    if (placement.rotation) root.rotation.set(...placement.rotation);
    if (placement.scale) root.scale.fromArray(placement.scale);
    group.add(root);
    if (gltf.animations.length) {
      const mixer = new THREE.AnimationMixer(root);
      gltf.animations.forEach(clip => mixer.clipAction(clip).play());
      mixers.push(mixer);
    }
  }
}
// Add group at the world transform chosen by Antigravity.
// Update mixers with deltaSeconds in the existing render loop.
// Load Eisen separately using the preserved character workflow.
~~~

In R3F, use the existing loader/cache strategy and useFrame for mixers. Repeated non-skinned props can share geometry/materials, and the existing scene can instance matching opaque meshes if profiling warrants it. Animation mixers must remain independent per animated clone. Stop/uncache mixers and dispose only owned resources; do not dispose shared cache geometry when removing one instance.

A project selection can use raycaster.intersectObject(stationRoot, true); bind returned neutral slotId to the website's real project modal. No UI, modal, camera, collision system or navigation has been implemented here.

## Verification and performance

[verification.json](./verification.json) records the final browser run and GLB hashes. [asset-inventory.json](./asset-inventory.json) records structural and preservation checks.

Passed:
- All 20 manifest-listed GLBs load through Three.js without page, console or HTTP errors.
- Binary headers, buffer/accessor ranges, index ranges, finite values and declared bounds.
- UV/normal attributes, nondegenerate triangles, valid animation targets and ordered keys.
- Used-material inventory and embedded PNG/material/texture/image links.
- 34 texture bindings decoded in the assembled preview.
- All five project stations are in frame, raycastable and visible in the supplied front view.
- Eisen is in frame and visible, using the actual existing idle clip.
- Entry, exit and Eisen work-anchor coordinates match the assembly.
- Thirteen floor-support ray tests cover Eisen and the crafting-circle perimeter.
- Animation updates preserve finite scene transforms.
- Desktop 1500×1100 and portrait 390×844 rendering.
- Hashes of all 84 pre-existing files under public/models match the captured baseline.
- Oxlint passes on the maintained authoring, audit and preview scripts.

Export size: **2,350,480 bytes** across 20 GLBs. Unique exported geometry: **34,748 triangles**. The assembled preview plus the original Eisen uses **57,254 unique geometry triangles**, **82,080 rendered triangles including repeated props/outline**, and **138 draw calls** in the checked front view.

The count and material audit are real checks; the browser used Chrome with SwiftShader. Physical-device frame-rate testing, external Khronos validator execution, final multi-island profiling, collision behaviour and production integration were not performed. Budget shadows/lights, cap pixel ratio and unload inactive destinations in the final application.

## Preview and regeneration

The seven renders in previews/ cover front, angled overview, interior, Eisen, displays, underside and mobile portrait. preview.html and preview.js form a development-only fixed-view inspection scene; they are not a website navigation or camera system.

From the repository root:

~~~powershell
node public/models/rune-workshop/audit-assets.mjs
npm.cmd run dev -- --host 127.0.0.1 --port 4185 --strictPort
# With the server running:
node public/models/rune-workshop/verify-render.mjs
~~~

Open http://127.0.0.1:4185/models/rune-workshop/preview.html . The viewer uses Vite's Three.js bundle and the existing partyMaterials.ts helper. The verification script uses installed Windows Chrome; adjust its executable path for another machine.

build-assets.mjs contains the complete procedural source and reuses the two supplied source textures. Optional filename arguments restrict re-export to selected models. Integration does not require rebuilding anything.

Supporting files: manifest.json, asset-inventory.json, verification.json, preservation-baseline.json, README.md, HANDOFF.md, build-assets.mjs, audit-assets.mjs, preview.html, preview.js, verify-render.mjs, textures/ and previews/.

