# 004 — Dynamic Island Transparency, Medium Width & Dashboard Hero Optical Alignment

- **Status**: DONE
- **Severity**: MEDIUM
- **Category**: Physicality & origin, Easing & duration, Cohesion & tokens
- **Estimated scope**: 2 files (`frontend1/src/components/shared/Layout.tsx`, `frontend1/src/pages/Dashboard.tsx`)

## Problem & Audit (`improve-animations`)

1. **Island Opacity & Width Imbalance**: The island's previous material (`bg-[#12151f]/85`) was too dark and opaque, blocking the cosmic 3D shader beneath it instead of acting as a genuine translucent Apple glass layer. Additionally, the size felt either too narrow when compact (~440px) or too wide (~1024px); the user requested a balanced "sedang" (medium) length.
2. **Dashboard Hero Sinking (Mathematical vs. Optical Centering)**: The hero title "Tokenomics Copilot", badge, and search bar were positioned with `min-h-[calc(100vh-9.5rem)] justify-center` combined with `pt-24` in `Layout.tsx`, pushing the visual weight toward the lower 58% of the viewport.

## Motion Vocabulary Mapping (`animation-vocabulary`)

- **Blur** — *A blur filter used to soften an element or mask tiny imperfections.*
  - Applied with `backdrop-blur-2xl backdrop-saturate-[190%]` to create Apple VisionOS translucent frosted glass.
- **Translate** — *Move an element along the X or Y axis.*
  - Applied `-translate-y-6 sm:-translate-y-10` on the hero container to lift it ~40px into the golden eye-line.
- **Continuity transition** — *A change that keeps the user oriented by visually connecting before and after.*
  - The island preserves its medium length (`max-w-xl sm:max-w-2xl`) and frosted glass continuity across all pages.
- **Press / Tap feedback** — *A subtle scale-down when an element is clicked, so it feels physical.*

## Target Specifications

| Parameter | Before | After |
| :--- | :--- | :--- |
| **Island Glass** | `bg-[#12151f]/85` (Opaque) | `bg-[#0d1017]/40 backdrop-blur-2xl backdrop-saturate-[190%]` (Transparent) |
| **Island Width** | Unstable morphing | `max-w-xl sm:max-w-2xl` (~580px–672px "Sedang") |
| **Hero Y Position** | Lower 58% of viewport | Elevated by ~48px into Golden Upper-Third |
| **Main Top Padding**| `pt-24` (96px) | `pt-16 sm:pt-20` (64px–80px) |
