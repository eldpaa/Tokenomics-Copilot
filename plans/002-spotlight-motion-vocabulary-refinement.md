# 002 — Apple Search Spotlight Motion Style & Vocabulary Refinement

- **Status**: DONE
- **Severity**: MEDIUM
- **Category**: Purpose & frequency, Physicality & origin, Performance, Accessibility
- **Estimated scope**: 3 files (`frontend1/src/index.css`, `frontend1/src/components/dashboard/SearchBar.tsx`, `frontend1/src/pages/Dashboard.tsx`)

## Problem & Motion Audit (`improve-animations`)

When pressing the `/` key or clicking the search bar, the transition required a cohesive, unified motion style that avoids three specific flaws:
1. **Keyframe Interruption Flaw**: Using `@keyframes appleSpotlightBloom` on `.apple-search-container.is-active` forced the browser to restart the animation from 0% every time `/` or Escape was triggered rapidly, causing visible jumping. Per Emil Kowalski's rules, toggles and rapidly-triggered elements must use CSS transitions that smoothly retarget from the current value.
2. **Subpixel Text Jitter from Vertical Item Translation**: Moving token items with `translateY(-4px)` caused temporary subpixel text antialiasing shifts while rendering.
3. **Loose Transitions**: Scrim and subtitle containers previously used `transition-all duration-300` and undefined timing classes (`ease-apple-out`). Per hard rules, exact properties (`opacity`, `transform`) must be named.

## Motion Style Vocabulary (`animation-vocabulary`)

The interaction is structured across three distinct phases using authoritative terms from Emil Kowalski's motion vocabulary:

### Phase 1: Sebelum & Saat Tombol `/` Diklik (Trigger & Tactile Feedback)
- **Hover effect** — Visual change when the cursor moves over an element.
  - *Applied*: Button scales subtly to `scale(1.04)` with an illuminated border (`border-white/30`).
- **Press / Tap feedback** — A subtle scale-down when an element is clicked, so it feels physical.
  - *Applied*: The `/` keycap depresses physically into its socket (`translateY(1.5px) scale(0.88)`) with an inner mechanical shadow (`inset 0 2px 4px rgba(0,0,0,0.5)`), matching real keyboard travel.

### Phase 2: Sesudah Tombol `/` Diklik (Membuka & Menampilkan Hasil)
- **Continuity transition** — A change that keeps the user oriented by visually connecting before and after. For example, making the same rectangle bigger and smaller.
  - *Applied*: The search pill morphs into the spotlight window while remaining anchored in place.
- **Accordion / Collapse** — A section smoothly expands and collapses its height to show or hide content.
  - *Applied*: CSS Grid `grid-template-rows: 0fr` to `1fr` expands the results dropdown without reflowing parent elements.
- **Scale in** — Element grows from smaller to full size as it appears, often paired with a fade.
  - *Applied*: Replaced vertical translations with `scale(0.98)` to `scale(1.0)` + `opacity: 0` to `1` on token items, keeping text razor sharp.
- **Stagger** — Animate several items one after another with a small delay between each, creating a cascade.
  - *Applied*: Staggered entry (`idx * 24ms + 30ms`) where all 3 items settle gracefully in under 80ms.
- **Spring** — Motion driven by physics (tension, mass, damping) rather than a set duration.
  - *Applied*: `cubic-bezier(0.2, 0.9, 0.25, 1)` provides Apple's signature fluid critically-damped spring settle.

### Phase 3: Saat Menutup / Reset (Exit)
- **Asymmetric easing** — A curve that accelerates and decelerates at different rates. Feels more alive than a symmetric one.
  - *Applied*: Opening uses fluid spring (`260ms var(--ease-apple-spring)`), closing uses swift ease-out (`180ms var(--ease-out)`).
- **Exit** — The animation an element plays when it's added to or removed from the screen.
  - *Applied*: Clean exit along the exact same path without lingering.

## Target Motion Specifications

| Element | Property | Open Curve | Open Duration | Close Curve | Close Duration |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Keycap (`/`)** | `transform`, `box-shadow` | `ease-out` | 120ms | `ease-out` | 120ms |
| **Spotlight Panel** | `grid-template-rows`, `opacity` | `var(--ease-apple-spring)` | 260ms | `var(--ease-out)` | 180ms |
| **Search Content** | `opacity` | `var(--ease-out)` | 200ms | `var(--ease-out)` | 140ms |
| **Token Item (x3)** | `transform` (scale), `opacity` | `var(--ease-apple-spring)` | 240ms (stagger 24ms) | `var(--ease-out)` | 140ms |
| **Focus Scrim** | `opacity` | `ease-out` | 240ms | `ease-out` | 240ms |

## Verification & Feel-Check

1. **Physical Keycap Press**:
   - Pressing `/` or clicking the `/` badge depresses the keycap by 1.5px with tactile inner shadow, resetting in 140ms.
2. **Subpixel Text Sharpness**:
   - Because items use **Scale In + Fade In** rather than vertical translation, token symbols and names remain crisp without antialiasing shimmer.
3. **Interruptibility**:
   - Pressing `/` and `Esc` in rapid succession cleanly retargets mid-flight without keyframe stutter.
4. **Reduced Motion**:
   - Honors `@media (prefers-reduced-motion: reduce)` by converting motion to static instant fades.
