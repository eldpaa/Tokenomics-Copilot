# 007 — AI Analysis Step Transition Polish: Apple Intelligence Pacing & Blur-Masked Crossfade

- **Status**: DONE
- **Severity**: MEDIUM
- **Category**: Easing & duration, Physicality & origin, Polish & effects
- **Estimated scope**: 2 files (`frontend1/src/components/dashboard/AiAnalysisIndicator.tsx`, `frontend1/src/index.css`)

## Problem & Audit (`improve-animations`)

1. **Rushed Cadence ("Terlalu Buru-Buru")**:
   - The analysis step cycle timer was set to `950ms`. For a technical sentence with 33–41 characters ("Synthesizing on-chain signals...", "Auditing bytecode & liquidity vectors...", "Computing multi-factor risk score..."), 950ms is too fast for human reading comprehension (~3 words per second average). This created a perception of panic rather than calm, profound analytical intelligence.
2. **Abrupt Text Snapping ("Kaku")**:
   - When `stepIndex` incremented, the string swapped instantaneously without intermediate frames or interpolation.
3. **Radar Beacon Horizontal Layout Jitter**:
   - The green radar dot was placed immediately adjacent to `{ANALYSIS_STEPS[stepIndex]}` in an unstabilized `flex items-center gap-2` container. Because the three step strings have varying lengths (33 vs 41 vs 37 characters), the radar dot snapped 50px right, then 25px left on every step transition, producing jarring visual instability.

## Motion Vocabulary Mapping (`animation-vocabulary`)

- **Crossfade** — *One element fades out as another fades in, in the same spot.*
  - Applied bidirectional crossfade between sequential status phases.
- **Blur** — *A blur filter used to soften an element or mask tiny imperfections.*
  - Applied Emil Kowalski's blur-masking technique (`filter: blur(2px)`) during the 160ms exit and 260ms entrance to bridge the visual gap and eliminate harsh character swaps.
- **Translate** — *Move an element along the X or Y axis.*
  - Directional departure (`translateY(-1.5px)`) and arrival (`translateY(3px)` to `0`) so the advancement of analysis steps has an intuitive upward progression.
- **Perceived performance** — *The right animation makes an interface feel faster, even when it isn't.*
  - Extending the interval to 1650ms paradoxically makes the AI feel deeper, more credible, and calmer without slowing down the actual user flow.
- **Spatial consistency** — *Animating so an element keeps its identity and position across states, so users never lose track of where things went.*
  - Anchored container (`min-w-[240px] sm:min-w-[275px] h-5 justify-between`) prevents any twitching of the radar dot or capsule boundaries.

## Target Specifications

| Parameter | Before | After |
| :--- | :--- | :--- |
| **Cycle Interval** | `950ms` (Rushed) | `1650ms` (Serene & deliberate) |
| **Step Exit Transition** | Instantaneous cut (0ms) | `160ms cubic-bezier(0.23, 1, 0.32, 1)` with `translateY(-1.5px)`, `opacity: 0`, `filter: blur(2px)` |
| **Step Enter Transition** | Instantaneous cut (0ms) | `260ms cubic-bezier(0.2, 0.9, 0.25, 1)` with `translateY(3px) -> 0`, `opacity: 0 -> 1`, `filter: blur(2px) -> 0` |
| **Status Line Container** | Unconstrained `flex items-center gap-2` | `min-w-[240px] sm:min-w-[275px] h-5 justify-between` |
| **Radar Dot Positioning** | Fluctuating inline position next to dynamic string | Anchored right-edge anchor (`ml-1.5`) with zero horizontal displacement |

## Verification Checklist

- [x] Step cycle interval is calm and readable at 1650ms.
- [x] Text transition uses blur-masked directional crossfade with zero character snap.
- [x] Radar dot remains stably anchored without horizontal jumping or micro-jitter.
- [x] Respects `prefers-reduced-motion` global token in `index.css`.
