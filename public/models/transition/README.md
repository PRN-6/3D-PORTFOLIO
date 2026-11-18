# Hero’s Home transition assets

Four self-contained character GLBs reuse the current home model’s geometry, skins, materials and embedded expression atlases. All positions use metres, +Y up and +Z forward. Each character root is at the soles in its standing pose. Character heights match the home asset.

## Contents

| File | Contents |
| --- | --- |
| frieren.glb | Original Frieren mesh and skeleton, idle, jump, fall, landing preparation, landing and magic landing |
| himmel.glb | Original Himmel mesh and skeleton, idle, jump, fall, landing preparation and landing |
| heiter.glb | Original Heiter mesh and skeleton, idle, jump, fall, landing preparation and landing |
| eisen.glb | Original Eisen mesh and skeleton, idle, jump, fall, landing preparation and landing |
| frieren-magic.glb | Circular glyph, two outer energy rings, inner ring and translucent protection field |
| project-display.glb | Beveled graphite display housing, recessed 16:9 preview plane, caption surface, anchors and feet |
| *-expressions.png | Identical copies of each character’s embedded texture atlas |
| manifest.json | Asset URLs, named clips, durations, looping flags and coordinate conventions |

The 17 new transition clips and four existing idle performances are separate named AnimationClips inside their respective GLBs. Each file includes its own skeleton and textures, so no external retargeting or texture downloads are required.

## Character clip playback

Replace CHARACTER with frieren, himmel, heiter or eisen.

| Clip | Duration | Playback |
| --- | --- | --- |
| CHARACTER_jump | 1.25 s | LoopOnce, takeoff at 0.52 s |
| CHARACTER_fall | 2.40 s | LoopRepeat |
| CHARACTER_landing_prepare | 1.40 s | LoopOnce |
| CHARACTER_landing | 1.10 s | LoopOnce, clamp at finish, then blend to idle |
| CHARACTER_idle | 5.20 s | LoopRepeat |
| frieren_magic_land | 2.80 s | LoopOnce, casting followed by landing preparation |

Load with Three.js GLTFLoader and play with an AnimationMixer rooted at the named character root. Clone reusable cached rigs with SkeletonUtils.clone. Clip names and bone names are case-sensitive. Crossfade over approximately 0.20 s between the looped fall and preparation. The landing pose ends at the first idle pose.

Skeleton clips animate the pelvis relative to the character origin. Translation through the sky belongs on the character root or a parent group. Keep root motion separate so the same clips work between different island heights and destination layouts. Foot placement targets the ground plane at local Y=0 during the landing, with knee flexion absorbing the impact.

Himmel extends into a heroic pose with an asymmetric leg position. Heiter spreads his arms to balance. Eisen keeps a compact, heavier stance. Frieren stays controlled and raises her staff and free hand for the spell. Hair, cape, beard-attached head movement and robe controls follow the skeletal performance. Weapons and the mug remain aligned to the hands.

## Reusable Three.js sequence

The typed helper lives at src/assets3d/transitionSequence.ts. It is an optional asset playback utility with no website navigation dependencies. It reuses the project’s existing toon palette and expression system.

Example from application code:

    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
    import {
      createTransitionSequence,
      transitionNames,
      type TransitionName,
    } from './assets3d/transitionSequence';
    import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

    const loader = new GLTFLoader();
    const entries = await Promise.all(transitionNames.map(async name => [
      name,
      await loader.loadAsync('/models/transition/' + name.toLowerCase() + '.glb'),
    ] as const));
    const characters = Object.fromEntries(entries) as Record<TransitionName, GLTF>;
    const magic = await loader.loadAsync('/models/transition/frieren-magic.glb');
    const sequence = createTransitionSequence(characters, magic);
    scene.add(sequence.group);

    // Inside the caller's render loop, using elapsed seconds:
    sequence.update(delta);

    // Scrub, replay or capture any pose deterministically:
    sequence.seek(6.15);

    // On removal:
    sequence.dispose();

The example choreography lasts 9.1 seconds. The group starts at Y=5, jumps, falls, decelerates under the magic field and lands at Y=0, Z=6. Forward travel clears the departure ledge during the jump. Transform sequence.group to position the entire sequence. The caller supplies a camera, scene lighting, a departure surface and a destination surface.

| Time | Performance |
| --- | --- |
| 0–1.25 s | Crouch, push off, move into airborne pose |
| 1.25–5.20 s | Individual falling loops and gentle body rotation |
| 5.20–8.00 s | Frieren casts and gradually decelerates the whole group |
| 6.60–8.00 s | Companions prepare their feet and knees for contact |
| 8.00–9.10 s | Soft impact, balance recovery and idle pose |

The helper finishes at the idle pose. Subsequent idle playback can use the exported idle clips. Use delta in seconds. It owns cloned character materials, an optional point light and the dynamic effects it creates. Dispose the original loaded geometry and textures only when their shared asset cache is no longer needed.

## Magic effect

The glyph’s radius is 2.1 m and its origin is directly below the group. Its horizontal surface is in the XZ plane. The GLB contains real mesh rings and strokes with emissive gold and pale violet materials.

The playback helper fades and rotates the effect, adds 40 soft radial particles and a low-intensity violet light, and reduces the downward velocity to zero at contact. The GLB is also usable independently in other glTF viewers. Dynamic particles, expression changes and light timing are provided by the helper. The field is faint by design. Bloom is optional and belongs to the consuming renderer.

The face atlas contains four equal-height rows for neutral, blink, speaking/surprised and smile. The existing partyMaterials module applies a row offset and the toon outline. A generic GLB viewer displays the original PBR materials and neutral row.

## Project display module

The housing is approximately 5.6 m wide, 3.8 m high and 0.65 m deep, with feet on Y=0 and the front facing +Z. Mesh names provide replacement and layout hooks.

- ProjectPreview is a flat 4.76 × 2.6775 m plane with normalized UVs and a 16:9 aspect ratio.
- ProjectTitleAnchor is the upper-left caption anchor, with 4.64 m of available width.
- ProjectDescriptionAnchor is the left-aligned secondary caption anchor.
- NextModuleAnchor is 6.4 m to the right, for repeated modules.

ProjectPreview is intentionally blank for your later screenshot. Assign a project screenshot texture to it when ready. For a Three.js TextureLoader texture, use SRGBColorSpace and the loader’s default flipY=true on this plane. Its UVs follow PlaneGeometry conventions.

The caption anchors contain removable dummy text meshes named DummyProjectTitle and DummyProjectDescription. They display “Project title” and “Short project description goes here.” Hide or remove these two children when attaching your real text at the same anchors. Each dummy mesh is marked with userData.placeholder and userData.text. Their baked outlines use the website’s Windows system-font fallback and render directly in a GLB viewer.

The module follows the written direction for dark, modern, layered architectural display boxes, with the dummy text and blank image area requested for later customization.

## Rebuilding and verification

Run from the repository root with the existing Node dependencies:

    node scripts/build-transition-assets.mjs
    npm run build
    npm run lint

The generator reads public/models/home-island.glb and writes only public/models/transition. It copies the character mesh buffers, inverse bind matrices and texture bytes, creates new clips, and exports the two reusable modules. The source character rigs must retain the named bones in the current asset.

The asset preview was rendered from these GLBs using GLTFLoader, AnimationMixer and the supplied helper. Validation includes clip parsing, finite skeletal transforms across the full sequence, loop endpoints, mesh and texture preservation, repeatable seeking and source model immutability.

