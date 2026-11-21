# Cinematic 3D Pop-Up Assembly & Blender Spline Animation Architecture

This document specifies the technical architecture, mathematical kinematics, and interactive controls for the **Isometric Papercraft Pop-Up Assembly Animation** and the **Blender 3D NURBS Spline Rail System** within the 3D Portfolio application.

---

## 1. Overview & Vision

The system offers two synchronized, production-grade 3D assembly animation modes:

1. **Blender 3D Spline Assembly (`SPIRAL` / `CINEMATIC` Presets)**:
   - Components travel along authentic 3D Catmull-Rom/NURBS spline tracks (`NurbsPath.005` - `011`) looping through 3D space above the diorama.
   - Objects bank, pitch, and roll tangentially along the curvature of their trajectories.
   - Ground impact and tactile overshoot are governed by Blender Graph Editor F-curve easing, landing cleanly at normalized time $u = 1.0$ (frame 75).
   - Real-time 3D guide rails render directly in WebGL, matching the Blender viewport workspace.

2. **Miniature Papercraft Pop-Up (`PAPERCRAFT` Preset)**:
   - Emulates an intricate pop-up book architectural diorama unfolding from a flat state.
   - Walls hinge upward around pinned bottom edges ($Y_{\text{hinge}} = \min(Y)$) unfolding from $-86.4^\circ$.
   - Furniture and interior props pop upward from their floor contact planes with elastic overshoot ($0.00 \to 1.08 \to 0.97 \to 1.00$).
   - Foliage and vegetation sweep outward along curved radial arcs with decaying secondary sway settling.
   - Includes an instant non-destructive Cardstock Paper material mode and a locked Orthographic Isometric Camera (`Camera Orthographic`).

---

## 2. Mathematical Kinematics & Stages

### Stage 1: Floor Emergence ($u \in [0.00, 0.28]$)
- The bedrock and tiled floor rise vertically from beneath the diorama with smooth cubic deceleration.
- An elastic settle locks the base platform to $Y = 0.0000$ before architectural walls begin hinging.

### Stage 2: Wall Bottom-Hinge Unfolding ($u \in [0.18, 0.58]$)
- **Bottom Hinge Pinning**: Unlike standard center-point rotations, wall objects are pivoted along their bottom bounding edge:
  $$\vec{H}_{\text{pivot}} = \begin{bmatrix} X_{\text{center}} \\ Y_{\text{min}} \\ Z_{\text{edge}} \end{bmatrix}$$
- **Fold Angle & Arc Compensation**:
  $$\theta_{\text{fold}} = -86.4^\circ \cdot (1 - \text{hingeOvershootEase}(t))$$
  $$\vec{P}(t) = \vec{H}_{\text{pivot}} + \mathbf{Q}_{\text{hinge}}(t) \cdot (\vec{P}_{\text{orig}} - \vec{H}_{\text{pivot}})$$
  This guarantees that the bottom edge of every wall stays locked to the floor plane throughout the entire unfolding motion.

### Stage 3: Base-Surface Furniture Pop-Up ($u \in [0.42, 0.78]$)
- **Base Surface Anchoring**: Rather than scaling from center (which causes objects to sink into the ground), scaling is anchored to the base contact plane:
  $$\Delta Y = (S(t) - 1.0) \cdot Y_{\text{baseOffset}}$$
- **Tactile Elastic Overshoot**:
  $$S(t) = 1.0 - e^{-6.2 \cdot t} \cdot \cos(2.8 \cdot \pi \cdot t) \cdot (1 - t)$$
  Produces the tactile curve: $0.00 \to 1.08 \to 0.97 \to 1.000000$.

### Stage 4: Cascading Props & Accessories ($u \in [0.60, 0.88]$)
- Books, lanterns, crafting tools, and crystals emerge in domino-like staggered cascades (2–4 frame intervals).
- Interpolated with `propEaseOutBack` for energetic snap without visual harshness.

### Stage 5: Foliage & Ribbon Growth ($u \in [0.70, 0.96]$)
- Trees, shrubs, and ivy sweep outward along radial curved arcs:
  $$\Delta \vec{P}_{\text{radial}} = \vec{R}_{\text{outward}} \cdot (1 - t) \cdot 1.8$$
- Secondary wind sway decays harmonically:
  $$\theta_{\text{sway}} = 0.08 \cdot \sin(3.5 \cdot \pi \cdot t) \cdot e^{-4.0 \cdot t}$$

### Stage 6: Mathematical Zero-Drift Lock ($u \ge 0.99999$)
- Whenever progress reaches $\ge 0.99999$, the engine executes a hard memory copy:
  $$\vec{P} = \vec{P}_{\text{orig}}, \quad \mathbf{Q} = \mathbf{Q}_{\text{orig}}, \quad \vec{S} = \vec{S}_{\text{orig}}$$
- Automated verification confirms spatial drift $< 1.0 \times 10^{-5}$ units.

---

## 3. Blender 3D Spline Guide Rails & F-Curve Easing

The spline rails directly recreate the Blender scene collection (`Part 2`, `NurbsPath.005` - `011`):
- **Archetypes**:
  - `OVERHEAD_LOOP`: High-altitude parabolic roller-coaster curves arching over the diorama before diving in.
  - `PERIMETER_SWOOP`: Wide horizontal S-curves sweeping from the outer perimeter into interior sockets.
  - `HELICAL_CORKSCREW`: Inward-winding logarithmic spirals for magical motes, floating tomes, and characters.
  - `FOUNDATION_ASCENT`: Deep subterranean curves for floating island bedrock.
- **Velocity Alignment & Banking**:
  Objects compute forward velocity tangents and bank their roll angle proportional to curve curvature:
  $$\text{BankAngle} = \text{clamp}((\vec{T}_{\text{ahead}} - \vec{T}) \cdot \vec{U}_{\text{world}} \cdot \text{bankStrength}, -0.55, 0.55)$$
- **F-Curve Graph Editor Easing**:
  Matches Blender's keyframe at frame 75: steep initial acceleration, soaring flight, slight tactile overshoot dip, and horizontal zero-tangent landing.

---

## 4. Non-Destructive Cardstock Material Manager

- `PapercraftMaterialManager.ts` dynamically switches all scene meshes to warm, matte cardstock paper:
  - `roughness`: 0.82
  - `metalness`: 0.0
  - Light anime-inspired pastel paper tones (warm parchment `#F7F2EA`, timber cardstock `#D8C7B0`, foliage green cardstock `#8BA888`, roof blue cardstock `#809BB5`).
- Uses `WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>` to cache original GLTF PBR materials and textures, guaranteeing instant, 100% lossless restoration upon toggle.

---

## 5. Orthographic Isometric Studio Camera

- `IsometricStudioCamera.tsx` mounts a locked orthographic camera matching Blender's `Camera Orthographic (75)` viewport:
  - Fixed isometric diagonal position: $[22, 17, 22]$
  - Look-at target: $[0, 0.8, 0]$
  - Matched viewport frustum: 18.5 units
  - Warm studio sunlight (`#FFF4E0`, intensity 1.8) and soft cool fill (`#E6F0FF`, intensity 0.75) with soft ground contact shadow plane.

---

## 6. HUD Controls & User Interface

The bottom-right `Cinematic Assembly` floating pill provides:
- **Transport Controls**: Play Forward (Assemble), Play Reverse (Disassemble), Pause, Restart.
- **Scrubber**: High-precision timeline slider (0% to 100%).
- **Speed Multipliers**: $0.25\times$, $0.5\times$, $1.0\times$, $1.5\times$, $2.0\times$.
- **Preset Grid**:
  - `Papercraft Pop-Up`: Intricate pop-up book unfolding with bottom-hinge kinematics.
  - `3D Spiral Rails`: Full Blender NURBS spline rail trajectories with banking.
  - `Linear Stagger`: Pure sequential architectural emergence.
  - `Soft Float`: Gentle, low-velocity organic assembly.
  - `High Velocity`: Fast, dramatic trajectory arcs.
- **Mode Toggles**:
  - `3D Guide Rails`: Toggles visible Blender NURBS guide tracks in WebGL.
  - `Papercraft Cardstock`: Toggles matte papercraft material textures.
  - `Studio Isometric`: Toggles locked orthographic isometric camera view.

---

## 7. Verification & Automated Testing

- Automated test suite: `scripts/test-popup-assembly.mjs`
  - Tests bottom hinge axis identification, fold angles, base-pinned furniture overshoot, 100-scrub zero-drift assertions, and forward/reverse playback.
- Visual browser QA: `scripts/qa-popup-papercraft.mjs`
  - Captures high-resolution screenshots across all animation stages, Cardstock mode, and Light/Dark themes in Headless Chrome.

