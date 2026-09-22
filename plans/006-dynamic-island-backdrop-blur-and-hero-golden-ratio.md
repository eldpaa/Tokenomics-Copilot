# 006 — Dynamic Island True Backdrop Blur, Rounded Capsule Transitions & Hero Golden Upper-Third

- **Status**: DONE
- **Severity**: HIGH
- **Category**: Physicality & origin, Easing & duration, Cohesion & tokens
- **Estimated scope**: 3 files (`frontend1/src/components/shared/NetworkSwitcher.tsx`, `frontend1/src/components/shared/Layout.tsx`, `frontend1/src/pages/Dashboard.tsx`)

## Problem & Audit (`improve-animations`)

1. **Stacking Context & Backdrop Trap ("Cuman Kotak Gitu Doang")**:
   - In `NetworkSwitcher.tsx`, the ambient dimming scrim (`fixed inset-0`) was rendered directly inside `<header>`, which had `.animate-island-enter` keyframes with `animation-fill-mode: both`.
   - By W3C CSS Transforms Module Level 1 specification, any non-identity `transform` on an ancestor element creates a new stacking context and acts as the containing block for all `position: fixed` descendants.
   - Consequently, the `fixed inset-0` backdrop was trapped within the 48px header strip, creating an unnatural rectangular box blur artifact across the navigation pill while leaving the dashboard behind the opened dropdown unblurred, leading to visual clashing ("tabrakan").
2. **Dynamic Island Capsule Blur Shape**:
   - In `Layout.tsx`, the morphing content layer lacked `rounded-full`, causing any CSS blur transition (`blur-xs`) to display as a sharp rectangular box rather than wrapping the rounded capsule of the island.
3. **Dynamic Island Size Tuning**:
   - The user requested making it medium ("sedang") and symmetrical: "jangan terlalu besar jangan terllau kecil, coba besarkan dikit".
   - Adjusted from `max-w-[560px] sm:max-w-[600px]` to `max-w-[620px] sm:max-w-[660px]` and `h-11 sm:h-12` (44px on mobile, 48px on desktop).
4. **Dashboard Hero Elevation**:
   - Elevated hero text and search bar further upward into the optical **Golden Upper-Third** (`-translate-y-16 sm:-translate-y-22 md:-translate-y-26`).

## Motion Vocabulary Mapping (`animation-vocabulary`)

- **Blur** — *A blur filter used to soften an element or mask tiny imperfections.*
  - Portalled full-screen backdrop with `backdrop-blur-md bg-black/45` to eliminate visual collision behind open dropdown cards.
- **Translate** — *Move an element along the X or Y axis.*
  - Applied `-translate-y-16 sm:-translate-y-22 md:-translate-y-26` to lift the hero block to ~29%–33% viewport height.
- **Continuity transition** — *A change that keeps the user oriented by visually connecting before and after.*
  - Kept capsule geometry consistent with `rounded-full` on all dynamic island layers.
- **Spatial consistency** — *Animating so an element keeps its identity and position across states, so users never lose track of where things went.*
  - Dropdown originates naturally below the trigger pill with full-viewport blur isolation.
- **Press / Tap feedback** — *A subtle scale-down when an element is clicked, so it feels physical.*
  - Retained `active:scale-[0.97]` across all interactive triggers.

## Target Specifications

| Parameter | Before | After |
| :--- | :--- | :--- |
| **NetworkSwitcher Backdrop** | Trapped inside header (`backdrop-blur-[1.5px]`) | Portalled to `document.body` via `createPortal` with `fixed inset-0 z-[950] bg-black/45 backdrop-blur-md` |
| **Dynamic Island Layers** | Unrounded inner `div` causing box blur | `rounded-full overflow-hidden` wrapper ensuring capsule-conforming blur |
| **Dynamic Island Width** | `max-w-[560px] sm:max-w-[600px]` | `max-w-[620px] sm:max-w-[660px]` (Medium "Sedang" & Symmetrical) |
| **Dynamic Island Height** | `h-10 sm:h-11` | `h-11 sm:h-12` (44px–48px) |
| **Header Drop-in Keyframe** | `animation: ... both` (Permanent transform) | `animation: ...` (Frees stacking context after 350ms) |
| **Dashboard Hero Elevation** | `-translate-y-12 sm:-translate-y-16 md:-translate-y-20` | `-translate-y-16 sm:-translate-y-22 md:-translate-y-26` |
| **Layout `<main>` Padding** | `pt-14 sm:pt-16 pb-8` | `pt-12 sm:pt-14 pb-6` |

## Verification Checklist

- [x] When clicking NetworkSwitcher, the entire viewport behind the card softly blurs (`backdrop-blur-md`), preventing any visual overlap/clash with dashboard elements.
- [x] No rectangular box blur artifact appears inside or around the Dynamic Island; the island retains its `rounded-full` capsule integrity at all times.
- [x] Dynamic Island is medium sized, not too small and not too large, with balanced left and right padding.
- [x] Dashboard hero text and search bar are elevated cleanly to the upper third of the screen with strict horizontal symmetry.
