# LEVEL 05 — BLUE FLOWER GARDEN
## Himmel & Frieren — The Eternal Meadow of Memory

> **Environment Asset Package for Antigravity & Three.js**  
> *Inspired by the emotional, nostalgic atmosphere of Frieren: Beyond Journey's End.*

---

## 1. Overview & Visual Concept

**Blue Flower Garden** is the Level 05 floating destination in the connected 3D portfolio world.

The environment depicts an enormous, dreamy magical flower garden suspended in the open sky:
- **Dense Blue Flower Meadow:** Over 4,800 blossoms in vibrant shades of sky blue (Nemophila / Blue Moonweed), soft cyan, dreamy lavender, royal violet, with white and pale-pink star flower accents completely blanketing the island.
- **Himmel & Frieren:** Reusing the original character models standing together at the center of the meadow, surrounded by blossoms reaching their lower legs while keeping their faces, hair, cloaks, and upper bodies prominent.
- **Dreamy Pastel Sky:** Low-poly anime cumulus clouds in soft white, sunlight blush-pink, and lavender undertones wrapping around the horizon.
- **Floating Island Architecture:** Sculpted organic terrain cresting gently at the center knoll, craggy fantasy rock underside tapering into jagged stalactite spires, and orbiting satellite rocks with glowing mana crystals.

---

## 2. Asset Directory Structure

All assets are located in `public/models/blue-flower-garden/`:

```
public/models/blue-flower-garden/
├── island/
│   ├── flower-garden-island.glb          # Floating island terrain, soil band, craggy rock underside & spires (570.0 KB)
│   └── floating-rocks.glb                # 8 satellite floating rocks with glowing mana crystals & animation (83.2 KB)
├── flowers/
│   ├── dense-flower-meadow.glb           # 4,800+ flowers densely blanketing the entire upper island terrain (54.5 MB)
│   ├── foreground-flowers-detailed.glb   # 42 detailed 5-petal blossoms with stamens for foreground camera framing (1.2 MB)
│   ├── flower-cluster-a.glb              # Modular cluster of 24 sky-blue & cyan blossoms (280.2 KB)
│   ├── flower-cluster-b.glb              # Modular cluster of 24 lavender, violet & pink blossoms (282.5 KB)
│   ├── flower-single-blue.glb            # Single sky-blue flower with stem and leaves (17.3 KB)
│   ├── flower-single-lavender.glb        # Single lavender flower with stem and leaves (17.3 KB)
│   ├── flower-single-white.glb           # Single white star blossom with stem and leaves (17.3 KB)
│   └── flower-wreath.glb                 # Flower wreath / bouquet held by characters (42.2 KB)
├── vegetation/
│   ├── flowering-trees.glb               # 3 fantasy trees with gnarled cedar trunks & pastel blossom canopies (91.8 KB)
│   ├── garden-shrubs.glb                 # 22 rounded flowering garden shrubs along the outer rim (142.4 KB)
│   └── grass-patches.glb                 # 180 multi-blade grass tufts & clover undergrowth (225.0 KB)
├── environment/
│   ├── dreamy-clouds.glb                 # Fluffy cumulus cloud banks in white, pink & lavender (228.6 KB)
│   └── sky-dome.glb                      # Inverted pastel horizon sky hemisphere (23.3 KB)
├── effects/
│   ├── floating-petals.glb               # 75 drifting flower petals with floating wave animation (320.7 KB)
│   └── magical-motes.glb                 # 60 glowing golden pollen & mana motes with float animation (226.0 KB)
├── blue-flower-garden-complete.glb       # Master unified assembly of the entire environment (40.2 MB)
├── asset-inventory.json                  # Complete technical audit (dimensions, bounds, triangles, vertices)
├── manifest.json                         # Position coordinates, lights, cameras, character configurations
├── preview.html                          # Standalone WebGL inspection preview
└── preview.js                            # Three.js preview viewer script with Himmel & Frieren staging
```

---

## 3. Character Placement & Integration

The original character models are preserved intact in their original paths:
- **Himmel Model:** `public/models/transition/himmel.glb`
- **Frieren Model:** `public/models/transition/frieren.glb`

### Recommended Placement Coordinates
| Character | Position $[X, Y, Z]$ | Yaw Rotation | Idle Animation Clip | Wreath Attachment |
| :--- | :--- | :--- | :--- | :--- |
| **Himmel** | `[-0.48, 0.42, 0.12]` | `+0.15` rad (~8.5°) | `himmel_idle` | `[-0.30, 0.88, 0.28]` |
| **Frieren** | `[+0.48, 0.40, 0.08]` | `-0.15` rad (~-8.5°) | `frieren_idle` | `[+0.32, 0.85, 0.26]` |

- **Standing Clearance:** Characters stand at `y ~ 0.40m–0.42m` on the sunny crest of the knoll.
- **Flower Height Framing:** The surrounding meadow flowers reach `y ~ 0.65m` (around their lower calves/boots, below their knees), ensuring their full outfits, cloaks, hands, faces, and hairstyles are completely visible and unobstructed.
- **Cel-Shading:** Applied via `createPartyPalette().dress(mesh)` from `src/components/Scene/partyMaterials.ts`.

---

## 4. Transition Anchors

| Anchor | Coordinates $[X, Y, Z]$ | Orientation | Purpose |
| :--- | :--- | :--- | :--- |
| **Entry Staircase Landing** | `[0.0, 0.32, 7.8]` | Yaw `3.14` (facing south) | Where magical transition stairs arrive on the meadow |
| **Center Hero Knoll** | `[0.0, 0.42, 0.1]` | Yaw `0.0` | Central staging knoll between Himmel and Frieren |
| **Exit Scenic Outlook** | `[0.0, 0.46, -7.2]` | Yaw `0.0` (facing north) | Cliff outlook viewing the vast cloud horizon |

---

## 5. Suggested Lighting & Atmosphere

```json
{
  "sunLight": {
    "type": "DirectionalLight",
    "color": "#fff4e2",
    "intensity": 2.2,
    "position": [-7.5, 13.5, 9.5]
  },
  "hemisphereLight": {
    "type": "HemisphereLight",
    "skyColor": "#d2e6fc",
    "groundColor": "#65916d",
    "intensity": 1.35
  },
  "pinkRim": {
    "type": "DirectionalLight",
    "color": "#fadbee",
    "intensity": 1.5,
    "position": [9.5, 7.5, -11.0]
  },
  "underBounce": {
    "type": "DirectionalLight",
    "color": "#8ec2fa",
    "intensity": 0.65,
    "position": [0, -6.5, 7.0]
  },
  "centralGlow": {
    "type": "PointLight",
    "color": "#aee2ff",
    "intensity": 1.2,
    "distance": 8.0,
    "position": [0, 1.2, 0.5]
  }
}
```

---

## 6. Camera Presets (Matching Reference Composition)

1. **Reference Composition (`heroFront`):**
   - Camera Position: `[0.0, 1.45, 4.8]` | Target: `[0.0, 0.85, 0.0]` | FOV: `42°`
   - *Directly reproduces Reference Image 1 with Himmel & Frieren standing together framed by foreground flowers and anime clouds.*
2. **Aerial Overview (`overview`):**
   - Camera Position: `[0.0, 7.5, 16.5]` | Target: `[0.0, 0.5, 0.0]` | FOV: `38°`
3. **Intimate Close-Up (`romanceCloseUp`):**
   - Camera Position: `[0.0, 1.15, 2.3]` | Target: `[0.0, 0.95, 0.1]` | FOV: `36°`
4. **Horizon Diagonal (`horizonDistant`):**
   - Camera Position: `[9.5, 4.2, 12.0]` | Target: `[-0.5, 0.8, -1.0]` | FOV: `35°`
5. **Underside & Floating Crystals (`undersideInspection`):**
   - Camera Position: `[0.0, -7.5, 14.0]` | Target: `[0.0, -3.0, 0.0]` | FOV: `40°`

---

## 7. Interactive Preview

Start the Vite dev server (`npm run dev`) and navigate to:
```
http://localhost:5173/models/blue-flower-garden/preview.html
```
The preview scene features full OrbitControls, interactive camera preset buttons, live lighting, and animated Himmel and Frieren characters.

