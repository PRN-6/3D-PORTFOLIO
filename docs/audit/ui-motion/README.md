# UI motion pass — verification frames

Branch `codex/ui-motion-polish`, based on `eea84c0`. Captured 2026-11-24 with headless
Chrome 157 (puppeteer-core, software WebGL) against `npm run dev -- --port 5175 --strictPort`.

## What changed

| Area | Motion |
| --- | --- |
| Preloader | P/R/N letters rise in with a stagger + gentle float; eased loading thread and caption; caption lifts away before the existing curved brand flight. Fires `prn:preloader-done` when the brand docks. |
| Navbar brand | Letters lift with a staggered spring on hover/focus. |
| Desktop nav | Pill indicator slides between links, following hover and returning to the active route. |
| Mobile menu | Burger morphs into an X; sheet unfolds from the button (clip + scale) with staggered, numbered items; it now animates out instead of disappearing. |
| Route change | Top progress thread + "NN / 06 — label" chapter card when the world changes (skipped on first load and for the contact/fun overlays). |
| Hero subtitle | Characters rise in after the preloader docks (capsule unfolds in light theme). |
| Overlays | The `animate-in fade-in zoom-in-95 slide-in-*` classes used across modals were undefined; `styles/motion.css` now implements them. Contact, Products and the About scroll also animate out (`usePresence`). |
| Reduced motion | Preloader skips the flight and dissolves; CSS animations collapse to 1 ms. |

## Frames

`desktop-1440-*` at 1440×900 (DPR 1) and `mobile-390-*` at 390×844 (DPR 2, touch emulation).
Mid-animation frames (`*-opening`, `*-closing`, `*-exit-mid`, `*-chapter-card`) are timed captures,
so their exact progress will vary between runs.

## Checked

- `npm run build` passes; `npm run lint` reports 0 errors and no new warnings. The one warning in a touched
  file (`Preloader.tsx`, ref written during render) predates this change.
- No console or page errors during either capture run.
- Mobile menu unmounts after its exit animation; contact modal unmounts after Escape.
- Reduced motion (390×844): overlay gone after ~3.2 s, brand/footer/music visible, menu animation 1 ms,
  no chapter card on the `/about` deep link.

## Not covered

- Real phones/GPUs and frame-time measurements: headless desktop emulation only.
- Browser back/forward was not re-run for this pass; routing code was not modified.
- `ProjectsModal`, `FunModal` and `ProjectDetailModal` exits are unchanged. The first two had
  uncommitted work in progress and were left alone.
