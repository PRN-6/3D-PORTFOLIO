# Island 02 — Grand Mage's Archive Asset Specifications

This directory (`public/models/archive/`) houses the 3D models and textures for **Island 02: Grand Mage's Archive** in the Frieren-inspired 3D Portfolio.

---

## 1. Scene Coordinate & Scale Standards

- **Units**: 1 Unit = 1 Metre.
- **Up Axis**: `+Y` is UP.
- **Forward Axis**: `+Z` is Forward (towards viewer/entrance).
- **Assembly Origin**: `[0, 0, 0]` at the centre of the archive island ground plane.
- **Character Scale**: Scaled consistently with Chibi Frieren (`scale ~0.51` desktop, `~0.44` mobile).

---

## 2. Expected 3D Asset Files

| Filename | Description | Expected Anchors / Nodes |
| :--- | :--- | :--- |
| `archive-island.glb` | Base floating rock island, grass, moss, carved arcane runes, edge crystals | `ArchiveIsland`, `FloatingRock_0..8`, `ArchiveLandingAnchor` |
| `archive-library.glb` | Grand Archive building, spiral stairs, book alcoves, reading mezzanine | `GrandLibrary`, `SpiralStaircase`, `UpperGalleryAnchor`, `FrierenReadAnchor`, `FrierenStandAnchor` |
| `archive-grimoires.glb` | Master collection of 6 skill grimoires on pedestals | `Grimoire_1..6`, `GrimoirePedestal_0..5` |
| `archive-floating-books.glb` | Ambient floating grimoires & turning parchment pages | `FloatingBook_0..7`, `TurningPage_0, 2, 4, 6` |
| `archive-decorations.glb` | Candle chandeliers, reading desk, armchair, motes | `ArchiveReadingFurniture`, `ReadingDesk`, `CandleChandelier_*`, `ArchiveMotes` |
| `grimoire-frontend.glb` | Standalone Frontend Magic Grimoire | `Grimoire_1`, `Grimoire_1_glow` |
| `grimoire-backend.glb` | Standalone Backend Alchemy Grimoire | `Grimoire_2`, `Grimoire_2_rune` |
| `grimoire-ai-agents.glb` | Standalone AI & Autonomous Agents Grimoire | `Grimoire_3`, `Grimoire_3_glow` |
| `grimoire-systems.glb` | Standalone Systems & Low-Level Grimoire | `Grimoire_4`, `Grimoire_4_rune` |
| `grimoire-creative-3d.glb` | Standalone 3D & Creative Tech Grimoire | `Grimoire_5`, `Grimoire_5_glow` |
| `grimoire-tools.glb` | Standalone Dev Tools & DevOps Grimoire | `Grimoire_6`, `Grimoire_6_rune` |

---

## 3. Key Anchor Transforms (from `archive-library.glb` & `manifest.json`)

- **`FrierenReadAnchor`**: Position `[-1.25, 0.36, 0.25]`. Frieren is seated reading at her study desk.
- **`FrierenStandAnchor`**: Position `[-1.25, 0.36, 1.75]`. Standing idle pose.
- **`ArchiveLandingAnchor`**: Position `[0.0, 0.0, 6.5]`. Main approach viewpoint.
- **Grimoire Arc Positions (Y = 1.3m)**:
  - Grimoire 1 (Frontend): `[-6.09, 1.30, 3.25]`
  - Grimoire 2 (Backend): `[-4.38, 1.30, 4.04]`
  - Grimoire 3 (AI Agents): `[-1.59, 1.30, 4.53]`
  - Grimoire 4 (Systems): `[1.59, 1.30, 4.53]`
  - Grimoire 5 (3D / Creative): `[4.38, 1.30, 4.04]`
  - Grimoire 6 (Tools): `[6.09, 1.30, 3.25]`

---

## 4. Reused Characters & Animations

- **Frieren Model**: `/models/transition/frieren.glb` (standalone rig & skinned mesh)
- **Frieren Magic**: `/models/transition/frieren-magic.glb`
- **Animation Clips**:
  - `Frieren_Read` (from `/models/home-island.glb`)
  - `Frieren_Idle` (from `/models/transition/frieren.glb` or `/models/home-island.glb`)
  - `Frieren_Cast` (from `/models/home-island.glb`)

---

## 5. Visual & Material Guidelines

- **Atmosphere**: Magical twilight / celestial night (`#030409` celestial sky, `#1e2540` deep ambient, `#a6c5ff` moonlight).
- **Cel Shading**: Characters dressed using `partyMaterials.ts` cel paint & silhouette outline.
- **Magical Accents**: Glowing runes, candle flames, and floating motes with emissive materials and bloom-friendly highlights.
