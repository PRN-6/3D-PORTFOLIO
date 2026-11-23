---
name: 3d-model-quality
description: Audit and optimize this portfolio's GLB/glTF geometry, textures, materials, rigs and animations with measured visual-preservation checks. Use for 3D asset quality or rendering performance work, not unrelated UI edits.
---

# 3D model quality

Treat this repository's fantasy/cel look, character proportions, expression atlases and authored motion as the reference. An audit does not authorize changing models or redesigning the site.

## Inspect first

Read the root AGENTS.md, relevant loader/world component, and the asset's manifest/build script. Trace the active route: FOREST currently uses BlueFlowerGarden, and the EXPLODED setting currently selects BubbleIslandTransition. Separate live assets from legacy modules and duplicated assemblies; a large file on disk is not necessarily requested by the current route.

Run the read-only inventory from the repository root:

```sh
node .agents/skills/3d-model-quality/scripts/inspect-assets.mjs public/models <new-output-directory>/assets.json
```

The helper uses the existing glTF Transform/Draco dependencies and reports hashes, decoded triangle/primitive counts, scene instances, rest bounds, materials, texture dimensions/memory estimates, skins and animation channels/durations. It never writes models. A decode error must remain an error, not an omitted file. GLTF entry-file bytes exclude external buffers/images; include those resource sizes separately when applicable. GPU instancing multiplicity is not expanded. This is not a topology or Khronos conformance validator.

Inspect normals, winding, UV seams, degenerates, skin weights, inverse bind matrices, morph targets and animated bounds when the proposed change could affect them. Inspect in Three.js or a verified Blender connection; do not infer visual defects from polygon counts alone. Record findings as measured, source-confirmed, visually observed or unverified.

## Decide and preserve

- Measure the relevant production route before selecting an optimization: compare draw calls, visible triangles, frame-time percentiles, cold requests/decode/warmup, texture dimensions and GPU/device context. Primitive count is not draw-call count; shadows, outlines and transparency add passes. Compressed file size is not decoded memory.
- Prefer eliminating unnecessary loading and hidden updates before reducing visible quality. Consider instancing repeated rigid geometry, material-compatible batching, LOD, texture reuse, compression and clip resampling only when the bottleneck supports them.
- Never merge across independently animated/interactive nodes or remove names used by picking and anchors. Preserve SkeletonUtils clone behavior, bone names, hierarchy, joint weights, morphs, clip targets/durations and loop continuity. Keep the four expression atlas rows aligned with `partyMaterials.ts`.
- Keep world-space bounds, units, transforms, silhouettes, thin petals, faces/hands and material appearance intact. Preserve sRGB versus linear texture roles, UV channels, normal-map orientation, alpha mode/cutoff, double-sidedness, roughness/metalness and emissive values. Test texture compression on expression details and transparent edges before adopting it.
- For authorized implementation, export a candidate to a separate path on a task branch/worktree. Do not run the existing overwrite-in-place optimization/build scripts blindly. Explain any additional dependency and its need before installation. Blender MCP is optional: verify available tools and a live connection; otherwise use installed readers and report the missing inspection capability.

## Validate the result

Compare before/after inventory and hashes. Check rest and animated bounds, representative poses, full clip loops, skinning, expressions, material response and picking in the actual app. Match camera, theme, exposure, viewport/DPR and animation time for visual comparisons; never judge preservation from mismatched poses alone.

Run build/lint and relevant existing tests. Use `scripts/audit-browser-baseline.mjs` with a fresh `AUDIT_OUT`, production `AUDIT_URL` and optional `CHROME_PATH`. Inspect desktop/mobile screenshots and measure transitions as well as settled scenes. Run real mobile hardware checks before promising phone FPS. For animation edits, scrub endpoints/midpoints and test interruption, rapid navigation, reverse flow and tab resume. Inspect disposal and resource counts after repeated navigation.

Accept a candidate only when the intended measurable benefit is demonstrated without visual/behavior regressions. Report exact metrics and remaining limitations; keep the original if the tradeoff is unproven. Replacing the original must be within the user's implementation scope.
