# PRINSON — 3D Fantasy RPG Portfolio

> High-performance, cinematic 3D fantasy RPG portfolio and interactive digital realm for Prinson ([prinson.is-a.dev](https://prinson.is-a.dev)).

---

## 🛠️ Tech Stack & Key Libraries

- **Framework**: React 19 + TypeScript + Vite 8
- **3D Graphics & WebGL**: Three.js (`three` 0.187), `@react-three/fiber` (v9), `@react-three/drei` (v10)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, modern `@layer` architecture)
- **Animations & Transitions**: GSAP 3.15 (`gsap.timeline`, `gsap.fromTo`, Flip animations)
- **Icons & UI**: Lucide React (`lucide-react`)
- **Linting & Tooling**: Oxlint (`oxlint`), Draco 3D GLTF decoders

---

## 🗺️ Project Architecture & Navigation Realms

The portfolio is structured around 4 interactive 3D destination islands, linked via dynamic camera tracking, physics-based liquid bubble transitions, and unified presentation anchors:

1. **Hero's Home (`/` | `HOME`)**:
   - **Component**: `WorldA_HeroIsland.tsx`
   - **Setting**: Floating pastoral fantasy island with farmhouse, vegetable garden, cobblestone path, and anime hero companions (Himmel, Frieren, Heiter, Eisen) gathered around a warm animated campfire.
   - **Background**: Monumental infinite kinetic typography traveling in opposing directions (`PRINSON ROYAL NAZARETH`).
   - **Subtitle**: Floating capsule `"JUST A DEVELOPER"`.

2. **Rune Creation Workshop (`/products` | `WORKSHOP`)**:
   - **Component**: `WorldE_RuneWorkshop.tsx`
   - **Setting**: Magical forge & workshop featuring interactive crafting stations, digital software inventions, and tools.
   - **Scale & Offset**: `scale: [0.59, 0.59, 0.59]`, `position: [-0.48, 0.65, 0.35]`.

3. **Grand Mage's Archive (`/projects` | `ARCHIVE`)**:
   - **Component**: `WorldC_ArchiveIsland.tsx`
   - **Setting**: Gothic grand library in the clouds with Frieren seated at her study desk, floating grimoires, torches, bookshelves, and spiral staircase.
   - **Scale & Offset**: `scale: [0.70, 0.70, 0.70]`, `position: [0.0, 0.60, 0.0]`.
   - **Interactivity**: Clicking floating grimoires triggers the organic black liquid bubble animation and project detail inspect mode.

4. **Blue Flower Garden (`/about` | `FOREST`)**:
   - **Component**: `WorldD_WhisperingForest.tsx`
   - **Setting**: Ethereal meadow of blooming blue flowers featuring Himmel and Frieren beneath the sacred tree, celebrating memory, companionship, and craftsmanship.
   - **Scale & Offset**: `scale: [0.58, 0.58, 0.58]`, `position: [0.0, 0.50, 0.0]`.

5. **Modals & Overlays**:
   - **Contact (`/contact`)**: Glassmorphism inquiry and direct communication modal.
   - **Fun (`/fun`)**: Interactive developer experiments, sandbox playground, and camera orbit controls.

---

## 🎬 Core Animation Systems

### 1. Asset-Gated Preloader & Hero Brand-Flight (`Preloader.tsx`)
- Gates reveal until all 3D geometries, GLTF assets, shaders, and fonts (`document.fonts.ready`) are 100% loaded.
- Pre-warms WebGL shaders via `renderer.compile(scene, camera)`.
- Smoothly flies the centered bold wordmark `P R N` along an organic parabolic trajectory into the persistent top-left header slot across all routes.
- Stagger-reveals header navigation, audio controls, and footer links.

### 2. Full Black Sweeping Bubble Transition (`BubbleIslandTransition.tsx`)
- Physics-inspired liquid bubble transition:
  - **Forming**: Glossy obsidian liquid bubble sweeps in from bottom-right, engulfing the outgoing 3D model with rim droplets.
  - **Sealed**: Solid 100% enclosed black sphere concealing the model.
  - **Tearing**: Ruptures and tears open from bottom-right with fluid droplet sprays along the boundary.
  - **Reveal**: Smoothly settles the newly loaded destination island into place.

### 3. Background Monumental Kinetic Typography (`CinematicBackgroundTitle.tsx`)
- Two-line infinite traveling marquee in opposing directions:
  - Upper Line: Travels right (`->`)
  - Lower Line: Travels left (`<-`)
- Rendered with `Anton` / `Bebas Neue` font stack, responsive `clamp()`, and `overflow-visible` to ensure zero letter clipping.

---

## 📐 Layout & Spatial Rules

- **Top-Left**: Persistent docked brandmark `P R N` (anchors back to home `/`).
- **Top-Center**: Floating dark navigation pill capsule (`home · products · projects · about me · contact · fun`).
- **Top-Right**: Theme toggle (`Light / Dark`) + Reset camera button (`↺ reset view`).
- **Bottom-Center**: Floating audio player capsule (`MusicControls.tsx`) displaying the current section soundtrack (`home.mp3`, `products.mp3`, etc.), equalizer bars, play/pause, volume slider, and mute toggles.
- **Bottom-Left**: Social links (GitHub, LinkedIn, Email).
- **Bottom-Right**: Sparkle star + Visitor counter & copyright.

---

## ⚡ Developer Guidelines & Commands

```bash
# Start local development server (runs on port 5175)
npm run dev

# Run TypeScript check & build production assets
npm run build

# Run Oxlint
npm run lint
```

### Critical Development Rules:
1. **GitHub Synchronization**: Always commit and push changes to GitHub (`git push origin <branch>`) after making updates.
2. **Build Verification**: Always run `npm run build` before completing a task to verify 0 TypeScript / bundler errors.
3. **Responsive Verification**: Ensure all UI elements maintain negative space and never collide across desktop (1440x900) and mobile (390x844).
