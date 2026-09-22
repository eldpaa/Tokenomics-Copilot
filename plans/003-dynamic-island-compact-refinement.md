# 003 — Dynamic Island Compact Proportions & Material Cohesion

- **Status**: DONE
- **Severity**: HIGH
- **Category**: Physicality & origin, Purpose & frequency, Performance, Cohesion & tokens
- **Estimated scope**: 2 files (`frontend1/src/components/shared/Layout.tsx`, `frontend1/src/components/shared/NetworkSwitcher.tsx`)

## Problem & Audit (`improve-animations`)

The top Dynamic Island navbar felt "kurang pas" (disproportionate and visually unaligned with the web theme) due to four critical flaws:
1. **Excessive Desktop Width (`max-w-5xl` / 1024px)**: The island stretched across 1024px like a standard bulky website header, defeating the intimate, organic capsule identity of an Apple Dynamic Island.
2. **Asymmetric Void on Dashboard**: At the top of the homepage, the brand title was hidden (`opacity-0`), leaving ~800px of empty space on the left and two buttons pushed to the far right.
3. **Material Discontinuity**: The island used an opaque dark gradient (`from-[#18191F]/90 to-[#0A0B0E]/95`) and heavy drop shadows, clashing with the SearchBar's luminous Space Black Titanium frosted glass.
4. **Exaggerated 56% Bounce Overshoot**: The entrance used `cubic-bezier(0.34, 1.56, 0.64, 1)` with `blur(2px)`, causing rubbery cartoonish bouncing and GPU rasterization stalls.

## Motion Vocabulary Mapping (`animation-vocabulary`)

- **Morph** — *One shape smoothly turns into another shape, e.g. Dynamic Island.*
  - The island expands from compact state (~440px) to full reading state (~640px) as the user scrolls.
- **Continuity transition** — *A change that keeps the user oriented by visually connecting before and after. For example, making the same rectangle bigger and smaller.*
  - Material, border, and position are preserved continuously.
- **Layout animation** — *When an element's size or position changes, it animates to the new spot instead of snapping.*
  - Smooth flex layout transitions between compact and expanded states.
- **Spring** — *Motion driven by physics (tension, mass, damping) rather than a set duration.*
  - Replaced over-bounce with critically-damped Apple spring `cubic-bezier(0.2, 0.9, 0.25, 1)`.
- **Press / Tap feedback** — *A subtle scale-down when an element is clicked, so it feels physical.*
  - Proportional `scale(0.97)` on buttons.

## Target Specifications

| Parameter | Before | After |
| :--- | :--- | :--- |
| **Max Width** | `max-w-5xl` (1024px) | Compact `max-w-xl` (~560px) to `max-w-2xl` (~680px) |
| **Height** | `h-14 sm:h-15` (56-60px) | `h-12` (48px) |
| **Material** | Gradient `from-[#18191F]/90 to-[#0A0B0E]/95` | `bg-[#12151f]/85 backdrop-blur-2xl border-white/20` |
| **Brand on Dashboard** | Blank empty void (0px) | Compact brand anchor `[⌘] Copilot` |
| **Spring Curve** | `cubic-bezier(0.34, 1.56, 0.64, 1)` (56% bounce) | `cubic-bezier(0.2, 0.9, 0.25, 1)` (Apple Spring) |
