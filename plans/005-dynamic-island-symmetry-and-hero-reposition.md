# 005 — Dynamic Island Symmetrical Medium Compact & Dashboard Hero Optical Elevation

- **Status**: DONE
- **Severity**: MEDIUM
- **Category**: Physicality & origin, Easing & duration, Cohesion & tokens
- **Estimated scope**: 2 files (`frontend1/src/components/shared/Layout.tsx`, `frontend1/src/pages/Dashboard.tsx`)

## Problem & Audit (`improve-animations`)

1. **Dynamic Island Length & Symmetrical Balance**:
   - The navigation bar was previously `max-w-xl sm:max-w-2xl` (~672px). With ~190px of left-side branding and ~215px of right-side controls, a 672px width left a wide 267px hollow gap in the center, causing the two sides to feel visually disconnected rather than unified as a single Apple Dynamic Island.
   - The user requested a "sedang" (medium) width that is transparent and strictly symmetrical in both layout and padding.
2. **Dashboard Hero Sinking (Mathematical vs. Optical Centering)**:
   - Mathematical vertical centering (`justify-center` in a `min-h-[calc(100vh-8rem)]` container + `pt-20` in `Layout.tsx`) placed the visual center of gravity at ~47% of the viewport.
   - To human vision, this feels "sinking" and sluggish because the natural eye line rests in the **Golden Upper-Third** (~32% to 36% of the screen height).
   - The user specifically requested elevating the text and dashboard elements higher up with strict horizontal and vertical symmetry.

## Motion Vocabulary Mapping (`animation-vocabulary`)

- **Translate** — *Move an element along the X or Y axis.*
  - Applied `-translate-y-12 sm:-translate-y-16 md:-translate-y-20` to elevate the Dashboard hero container into the Golden Upper-Third sweet spot.
- **Blur** — *A blur filter used to soften an element or mask tiny imperfections.*
  - Applied `backdrop-blur-2xl backdrop-saturate-[180%]` paired with crystal transparency `bg-black/20 hover:bg-black/25` for pure VisionOS glass.
- **Continuity transition** — *A change that keeps the user oriented by visually connecting before and after.*
  - Dynamic Island maintains medium compact width (`max-w-[560px] sm:max-w-[600px]`) and consistent frosted glass materiality across viewports.
- **Press / Tap feedback** — *A subtle scale-down when an element is clicked, so it feels physical.*
  - Kept responsive `active:scale-[0.97]` on all buttons and pills.

## Target Specifications

| Parameter | Before | After |
| :--- | :--- | :--- |
| **Island Container Width** | `max-w-xl sm:max-w-2xl` (~672px) | `max-w-[560px] sm:max-w-[600px]` (Medium "Sedang", ~580px balanced) |
| **Island Transparency** | `bg-[#0d1017]/40` | `bg-black/20 hover:bg-black/25 backdrop-blur-2xl backdrop-saturate-[180%]` |
| **Island Padding** | `px-3.5 sm:px-4.5` | `px-3 sm:px-4` (strictly symmetrical left/right) |
| **Hero Y Elevation** | `-translate-y-6 sm:-translate-y-10` (~47% viewport) | `-translate-y-12 sm:-translate-y-16 md:-translate-y-20` (~33% Golden Upper-Third) |
| **Layout `<main>` Top Padding** | `pt-16 sm:pt-20 pb-14` | `pt-14 sm:pt-16 pb-8` |
| **Hero Symmetry** | Generic wrapper | Symmetrically constrained `max-w-xl mx-auto flex flex-col items-center` |

## Verification Checklist

- [x] Dynamic Island is noticeably translucent, allowing the background shader to shimmer through without visual murkiness.
- [x] Dynamic Island is medium length (`~580px-600px`) and has identical left and right padding.
- [x] Dashboard text and search bar are elevated visibly into the upper-third viewport sweet spot.
- [x] All items inside the hero block maintain perfect horizontal symmetry and center alignment.
