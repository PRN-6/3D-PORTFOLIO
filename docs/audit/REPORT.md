# 3D portfolio audit — 23 November 2026

Initial audit of source commit `13cbe199c97730cca4cd46899b1b3e74e0976336`, on branch `codex/3d-quality-audit`. No application source, original models, dependencies or lockfile changed. The pre-existing edit to `scripts/qa-project-background-name.mjs` is excluded from the audit commit.

## Scope and evidence

Repository-wide file inventory (409 tracked files at start), package/lock/build configuration, active route and scene graph, alternate scene/animation systems, loaders, shader/material setup, CSS/UI/audio, model manifests/generators, and existing QA entry points were reviewed. All 87 GLBs were decoded and inventoried. This is an architectural and measured runtime audit, not a line-by-line correctness proof of every historical script.

- [Full asset inventory](ASSETS.md): all models, sizes, geometry, primitive counts, textures, animation counts and observed initial-request membership.
- [Machine-readable model baseline](baseline/assets.json): SHA-256, material properties, bounds, rigs, clips and texture dimensions for every file.
- [Browser baseline](baseline/browser.json): 12 direct-route captures with frame sampling, requests, warnings, errors, control rectangles and renderer counters.
- [Interaction baseline](baseline/interactions.json): warm transitions, themes, back/forward and reset.
- [Screenshots](baseline): desktop 1440×900 at DPR 1; mobile 390×844 emulated at DPR 2, canvas DPR capped at 1.5.
- [Build log](baseline/build.txt), [mathematical test log](baseline/tests.txt), and [verification summary](baseline/verification.json).

## Architecture and tooling

Resolved lockfile versions: React 19.3.1, TypeScript 7.0.2, Vite 8.3.8, Three.js 0.187.0, R3F 9.8.2, Drei 10.7.9, GSAP 3.15.1, React Router 7, Tailwind 4, and Puppeteer Core 25.18.1. Oxlint is the linter. glTF Transform and Draco are already development dependencies.

`main.tsx` → `App.tsx` → `pages/Home.tsx` → `Scene.tsx` is the main path. One Canvas renders four persistently mounted world groups controlled by the bubble state machine. DOM navigation, marquee, preloader and overlays sit above/behind it. The root [AGENTS.md](../../AGENTS.md) now describes the actual architecture and preservation/verification standards.

| Route | Runtime scene | Asset source |
| --- | --- | --- |
| `/` | WorldA_HeroIsland / EnvironmentLoader / partyLife | home-island.glb |
| `/products` | WorldE_RuneWorkshop | 20 workshop modules + Eisen |
| `/projects` | WorldC_ArchiveIsland / Archive components | library/island/decorations, books/grimoires, Frieren |
| `/about` | WorldD_WhisperingForest / BlueFlowerGarden | complete garden assembly, Himmel, Frieren, wreath |
| `/contact`, `/fun` | HOME + modal | same mounted worlds |

The `EXPLODED` config value selects `BubbleIslandTransition`; the old modular exploded system is not the default. `STAIRCASE` has an alternate renderer. Legacy forest assets remain; they are not the current About garden. This distinction prevents optimizing the largest unused file while missing the live bottleneck.

Animations combine GSAP DOM timelines, R3F frame callbacks, GLSL bubble shaders, Three mixers/Drei useAnimations, character schedules, and older assembly/rail engines. Character materials intentionally use cel shading and outline passes. Proportions, expression atlas rows, rig names and interaction anchors are preservation constraints.

Loading uses module-level `useGLTF.preload`, runtime useGLTF/Suspense/error boundaries and some legacy `GLTFLoader.loadAsync` paths. Main config sets `/draco/gltf/`; eager preloads execute during static module evaluation, so verify decoder configuration ordering before relying on that setting for every first preload. Fonts are both local/preloaded and remotely fetched from Google Fonts. Audio preloads metadata for the section tracks.

Available npm scripts are only `dev`, `build` (`tsc -b && vite build`), `lint` (`oxlint`), and `preview`. There is no npm `test` entry or tracked CI workflow. The repository contains 68 standalone `test-*`/`qa-*` files. Many hard-code Chrome, localhost:5173 and another tool's absolute output directory; some target removed UI. They are not a reliable aggregate regression suite. `vite.config.ts` has no dev port setting; it splits vendor bundles and copies index.html to 404.html. Hosting rewrites live under public.

## Model findings

87 GLB files, **23,828,068 bytes (22.72 MiB)**; no `.gltf` or `.blend` source files found in the tracked repository. All decoded successfully. Totals across files: 821,458 unique-mesh triangles, 769 primitives, 371 animation clips and 62 embedded image records. These totals include overlapping master/module assets and do not represent one rendered scene. 17 files declare mesh compression. All decoded primitives contain normals; zero channels have missing target nodes. These checks do not prove correct normals, UVs, skin weights, loop continuity or topology.

| Asset | MiB | Triangles | Primitives | Audit significance |
| --- | ---: | ---: | ---: | --- |
| whispering-forest/forest-vegetation.glb | 3.76 | 46,622 | 8 | Largest file; uncompressed legacy asset, not requested in measured default routes |
| home-island.glb | 2.49 | 132,372 | 45 | Active; characters/outlines/shadows raise rendered work well beyond base geometry |
| whispering-forest/whispering-forest-island.glb | 1.87 | 19,234 | 24 | Legacy; bytes are high relative to geometry |
| whispering-forest/ancient-tree.glb | 1.86 | 27,812 | 12 | Legacy; lower priority than live loading |
| blue-flower-garden/blue-flower-garden-complete.glb | 0.90 | 123,009 | 114 | Active; 70 clips; batching/animation/shadow targets |
| blue-flower-garden/flowers/dense-flower-meadow.glb | 0.73 | 97,092 | 10 | Standalone module; not a separate initial request, overlaps assembled content |
| transition/eisen.glb | 0.58 | 22,506 | 1 | Character silhouette/rig require care before simplification |

**Textures:** maximum dimension is 2048; character expression atlases are 512×2048, about 5.33 MiB each as uncompressed RGBA8 with mipmaps. No 4K/8K textures were found. Encoded image bytes across files total 3,855,947, with duplication across standalone characters and home. Runtime clones also matter: home shows 13–14 renderer textures versus 5 embedded source images. Neither figure measures actual VRAM. Investigate sharing/ownership before aggressive downsizing. There are no normal-textured materials in the inventory; that is consistent with stylization, not automatically a defect. Selective roughness/normal detail could help stone/wood later without changing character cel shading.

**Materials/lighting:** screenshot review shows the archive's foreground/underside very dark, with weak separation from the black marquee. Runtime sees 12 visible lights and no shadow-casting lights there, so adding more lights indiscriminately is unlikely to solve grounding. The workshop's uniform grass/stone surfaces and rounded tree blobs could benefit from subtle material variation. The garden's bright, nearly white characters lose detail; clouds dominate and clip the composition; the underside shows a mottled pattern. The pattern's cause is not established: isolate overlapping surfaces, normals and shadow bias before assuming a texture problem.

**Geometry/draw calls:** workshop and garden each record 243 calls, archive 162, home 94. These are optimization candidates, not universal budget violations. Garden's 114 source primitives plus two characters, outlines and shadows produce 327,822 submitted triangles. Home reports 341,196 versus 132,372 source triangles. Measure pass cost before decimation; repeated shadow and outline rendering is significant. Do not remove animated flower nodes or pickable books just to reduce primitive count.

## Runtime baseline and bottlenecks

Chrome 157.0.8103.80; Windows; AMD Ryzen 5 8645HS / Radeon 760M-class integrated graphics, ANGLE D3D11. Production preview on loopback port 5187; fresh context per route, cache disabled, no CPU/network throttle. Each route waits for network idle, disappearance of the loader and nonzero renderer calls, settles five seconds, then samples rAF for five seconds. This is one exploratory run, not a statistical device benchmark.

| Scene | Render calls | Submitted triangles | Desktop p95 frame interval | Mobile-emulated p95 |
| --- | ---: | ---: | ---: | ---: |
| Home | 94 | 341,196 | 7.1 ms | 7.1 ms |
| Workshop | 243 | 138,370 | 7.1 ms | 7.1 ms |
| Archive | 162 | 185,718 | 7.1 ms | 7.1 ms |
| Garden | 243 | 327,822 | 7.1 ms | 14.0 ms |
| Contact overlay | 94 | 341,196 | 7.1 ms | 14.0 ms |
| Fun overlay | 94 | 341,196 | 7.1 ms | 7.1 ms |

Most samples are refresh-limited near 144 rAF callbacks/s on this machine. These intervals are not GPU render times; emulated mobile uses the same GPU. No claim of real-phone FPS, energy use or thermal stability is justified. Three counters are existing app snapshots from every 30 frames and can include extra passes. Geometry/texture counts reflect renderer allocations, not total decoded CPU memory.

Warm SPA navigation checks passed on both viewports, including back/forward and camera reset, with no JavaScript exceptions. However, first visits within the desktop session showed **515 ms, 1,113 ms and 682 ms maximum frame gaps** entering workshop, archive and garden. Mobile-emulated runs later in the process showed 76–90 ms maxima. The long isolated stalls are hidden by an otherwise good p95; investigate first-use shader compilation/upload before claiming smooth transitions. After visiting all worlds, renderer allocations rose to 431 geometries / 52 textures / 56 programs. This is compatible with persistent caching and is not by itself proof of a leak. Eight additional dark-theme screenshots confirm that archive darkness and oversized garden clouds persist across themes.

Every measured route requested **33 GLBs totaling 9,255,292 bytes (8.83 MiB)**, including nonvisible worlds. All four groups remain mounted: **457 mesh objects**, of which 49/125/151/132 are visible in home/workshop/archive/garden. Visible flags prevent rendering but do not suspend mixers or frame callbacks. Asset bytes over the network are separate from full `public` deployment contents (about 50.57 MiB, including previews/generators/audio/fonts/legacy assets).

Observed ready-check times ranged from 2.99 to 30.30 seconds, but this includes `networkidle0` and external font delays, so it is **not time-to-first-island**. Desktop workshop/archive had Google Fonts `ERR_CONNECTION_CLOSED`; local models did not produce HTTP errors. Audio metadata requests were often `ERR_ABORTED`, which is not proof playback is broken. Add explicit marks for route-critical fetch/decode/compile/reveal before setting a loading SLA.

Source-confirmed bottlenecks/risks:

1. `useSceneReady.ts` unconditionally marks assets loaded at 700 ms and forces every gate at 4.5 seconds. `SceneWarmupCompiler` compiles once immediately; late-arriving models are not guaranteed warmed. Progress can claim 100% before visible assets are ready.
2. Eager imports/preloads and persistent worlds make home pay for other routes. Several callbacks/mixers update without checking ancestor visibility. Pause inactive work, then introduce deliberate next-route prefetch/cache policy.
3. `BubbleIslandTransition` sets React state for progress every frame, rerendering a large world subtree. Move high-frequency shader/object values into refs/uniforms while keeping phase state explicit.
4. On About, `WorldD` mounts `GardenCameraController` when enabled while the shared presentation controller is also present. Two controllers can write the same camera; investigate ownership before changing framing.
5. Garden modules start all 70 clips; validate which must run together. Workshop uses unclamped mixer delta while home/garden clamp it differently; test tab resume and dropped frames. Asset channels have valid targets, but no exhaustive full-loop/pose inspection has been performed.
6. `GardenEnvironment` clones cloud materials but does not explicitly release them; its multi-material loop assigns each clone to the whole mesh, retaining only the last. Current assets need no redesign to audit ownership. Workshop palette lifecycle also warrants review. No leak has yet been proven by a repeated-navigation memory trace.
7. Browser warns that `THREE.Clock` is deprecated and `PCFSoftShadowMap` falls back to `PCFShadowMap`. Resolve compatibility deliberately rather than masking warnings or upgrading dependencies blindly.
8. No reduced-motion handling was found in application TS/TSX/CSS. Continuous marquee, bubble motion and camera transitions need an accessible reduced-motion path.

## Visual and responsive review

Light-theme captures cover all six routes at both sizes. Main header/nav/audio/social/footer controls are separated and document horizontal overflow is false. Contact and Fun modals fit the captured phone viewport. This does not establish keyboard accessibility, safe-area behavior or landscape/tablet coverage.

Home is the strongest material/lighting reference: roof variation, glowing windows, campfire and cohesive silhouettes. Preserve it. Archive foreground detail and interactive book visibility need more controlled fill/contrast. Garden clouds extend beyond the right edge at desktop and mobile; its central characters are tiny and washed out relative to the meadow. Mobile home approaches the side boundaries and archive floating rocks clip at edges: framing should be tested against animated bounds, not merely document overflow. Kinetic title edge cropping is intentional marquee behavior; it should not be mistaken for a DOM overflow bug.

## Prioritized implementation plan

| Priority | Work | Acceptance evidence |
| --- | --- | --- |
| P0 | Make readiness asset-aware, compile after the visible scene mounts, report failures and timeouts honestly; configure decoder before eager requests; add loading phase marks | Throttled cold deep links never reveal empty/incomplete islands; failures produce an explicit usable fallback; record route-critical timings |
| P0 | Establish one camera owner for About; fix cloud framing and investigate the mottled underside; tune garden character exposure and archive fill | Matched light/dark desktop/mobile shots retain art direction, clear silhouettes and interaction targets; no jitter, clipping or new material artifacts |
| P1 | Pause invisible animation work and move per-frame bubble values out of React state; load current world first with bounded next-world prefetch | Compare three cold/warm runs on the same hardware; reduce initial 33 GLBs/8.83 MiB without increasing navigation stalls; record transition p95 and CPU work |
| P1 | Profile workshop/garden draw passes; selectively batch static same-material props or instance repeated geometry, tune shadow casters and use measured quality tiers | Lower calls/pass cost while retaining named interaction/animation nodes; target desktop 16.7 ms p95 and mobile 33.3 ms p95 on named real devices, as proposed budgets |
| P1 | Standardize animation timing/visibility, clip selection and interruption; reduced-motion mode | Full loop/end/mid poses, rapid navigation, reverse inspection, tab resume and back/forward pass; no snapping/sliding; calm reduced-motion flow |
| P2 | Improve stone/wood roughness/normal variation and local grounding; retain toon faces and expression atlas layout | Equal-camera A/B material review at both themes; no silhouette/palette loss; performance remains within agreed budgets |
| P2 | Character texture reuse, selective KTX2 trial, geometry LOD and flower instancing only where profiling supports them | Candidate assets in separate paths; hashes/bounds/rig/UV/clip preservation; measure decode/VRAM/frame cost, not just file bytes; no dependency added without rationale |
| P2 | Make QA portable and enforce a focused regression suite in CI; exclude generated Draco code from lint rather than changing it | Configurable URL/browser/output, failure assertions, six-route smoke tests, transition checks, visual references, build/lint policy with existing debt tracked |
| P3 | Separate legacy/demo/generator artifacts from deploy output after tracing references | No broken fallback/alternate routes; smaller deploy payload; original source assets retained |

Do not apply all optimizations together. Start with loading/camera correctness, then measure one rendering change at a time. Avoid blanket decimation, blanket texture reduction, merging rigs, or adding postprocessing merely to suggest realism.

## Integration evaluation

**Blender MCP:** useful for inspecting topology, UVs, normals, rig poses and multi-angle candidate exports. No Blender tools are exposed in this session; `blender` and `uvx` were not found on PATH, nor Blender in the checked standard Program Files locations. This does not prove no custom installation exists. Python is present. The third-party project now uses the package name `mcp-for-blender`. Setup needs Blender, uv/server, the enabled Blender add-on, client registration and a verified running connection. None were installed or configured during this audit. See the [maintainer's setup instructions](https://github.com/ahujasid/mcp-for-blender#quickstart).

**Browser plugin:** browser automation is valuable for visual regressions, console/network inspection and interactions. Native browser/computer-use tools are exposed, but a separately installed plugin named Browser was not verified; plugin-directory search returned no exact Blender/Browser match. Directory results are not exhaustive. The existing Puppeteer Core dependency and installed Chrome were sufficient and actually used here. A new browser plugin is optional; it does not replace real-device profiling. No integration was claimed connected or installed.

## Reproduce

Use the existing dependencies (`npm ci` if starting from a fresh checkout), Node 24 and an installed Chrome executable. No new dependency is required.

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 5187 --strictPort
# In another terminal:
$env:AUDIT_URL = 'http://127.0.0.1:5187'
$env:AUDIT_OUT = 'docs/audit/comparison'
$env:CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
node .agents/skills/3d-model-quality/scripts/inspect-assets.mjs public/models docs/audit/comparison/assets.json
node scripts/audit-browser-baseline.mjs
node scripts/audit-interactions.mjs
node scripts/test-assembly-engine.mjs
npm run lint
```

The browser scripts use isolated temporary Chrome contexts. The initial environment required Chrome and preview to run outside the restrictive sandbox; port 5175 was occupied, hence 5187. The first unreachable preview/browser attempts produced no valid performance results and were superseded. The interaction harness's initial button selector was corrected to the existing navigation anchors before the final run.

Remaining limits: no real iOS/Android hardware, network-throttled repeat suite, GPU timer query, sustained thermal test, exhaustive clip/rig/topology validation, contact submission, grimoire close/reverse inspection stress test or full accessibility audit. Time-dependent screenshots are visual references, not deterministic pixel-diff goldens. No original asset was optimized in this phase.
