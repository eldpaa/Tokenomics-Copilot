# 001 — Apple Search Spotlight Fluid Motion & Timing Redesign

- **Status**: DONE
- **Commit**: f474303
- **Severity**: HIGH
- **Category**: Easing & duration, Physicality & origin, Performance
- **Estimated scope**: 2 files (`frontend1/src/index.css`, `frontend1/src/components/dashboard/SearchBar.tsx`)

## Problem

When pressing the `/` shortcut key (or clicking the search input), the search bar feels stiff and appears as if there is "no animation" (`"masih kerasa kaku tidak ada animasi nya"`).

Root cause analysis reveals three technical flaws:
1. **Aggressive Easing Derivative Trap**: The current curve `cubic-bezier(0.16, 1, 0.3, 1)` completes 85% of its movement in the first 40ms (~2 frames at 60Hz). To the human visual system, this is perceived as an instant snap/pop rather than a continuous fluid transition.
2. **GPU Rasterization Stall from Multi-Filter Chaining**: Animate `filter: blur(4px)` simultaneously inside a container with `backdrop-filter: blur(24px)` / `backdrop-blur-3xl` causes Chromium and Safari to drop intermediate interpolation frames, rendering only the initial and final states.
3. **Absence of Spatial Momentum & Cascade**: In genuine Apple Spotlight (macOS Sonoma/Sequoia & iOS), search activation features a subtle spring bloom (`scale` and `translateY`) on the container and a micro-staggered cascade on search results. Currently, the container has zero physical motion (only background color changes), and results appear as a static frozen block.

Cited locations:
```css
/* frontend1/src/index.css:156-187 — current */
.apple-search-panel {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  pointer-events: none;
  transition: grid-template-rows 240ms cubic-bezier(0.16, 1, 0.3, 1),
              opacity 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.apple-search-panel.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
  pointer-events: auto;
}

.apple-search-content {
  opacity: 0;
  transform: translateY(-8px) scale(0.99);
  filter: blur(4px);
  transition: opacity 220ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 240ms cubic-bezier(0.16, 1, 0.3, 1),
              filter 200ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform, filter;
}

.apple-search-content.is-open {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}
```

```tsx
// frontend1/src/components/dashboard/SearchBar.tsx:161-167 — current
<div
    className={`absolute top-0 left-0 right-0 w-full rounded-[28px] transition-[border-radius,background-color,box-shadow,border-color] duration-240 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isFocused
            ? "bg-[#090b10]/95 backdrop-blur-3xl border border-white/25 shadow-[0_24px_64px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.18),0_0_24px_rgba(255,255,255,0.06)]"
            : "bg-white/20 backdrop-blur-sm border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-white/40"
    }`}
>
```

## Target

1. **Apple Fluid Spring Curve**: Adopt Apple's genuine fluid motion curve `--ease-apple-spring: cubic-bezier(0.2, 0.9, 0.25, 1)` and extend the open duration to **320ms** (with **220ms** close). This gives the human eye sufficient frames (80–120ms) to perceive the smooth descent without feeling sluggish.
2. **Tactile Container Bloom**: When `/` is pressed, the spotlight container executes a subtle physical bloom (`transform: scale(0.988) translateY(-4px)` to `scale(1) translateY(0)`) giving immediate tactile feedback that the keyboard shortcut was registered.
3. **Drop Expensive CSS Blur Animation**: Remove `filter: blur(4px)` during transition to eliminate GPU rasterization bottlenecks, ensuring a rock-solid 60/120fps.
4. **Spotlight Result Cascade**: Introduce an authentic 30ms micro-stagger on token items so search results glide into position sequentially like macOS Spotlight search results.

```css
/* target CSS in frontend1/src/index.css */
:root {
  --ease-apple-spring: cubic-bezier(0.2, 0.9, 0.25, 1);
  --ease-apple-out: cubic-bezier(0.23, 1, 0.32, 1);
}

.apple-search-container {
  transform-origin: center top;
  transition: transform 320ms var(--ease-apple-spring),
              background-color 260ms ease-out,
              box-shadow 320ms var(--ease-apple-spring),
              border-color 260ms ease-out;
}

.apple-search-container.is-active {
  transform: scale(1) translateY(0);
}

.apple-search-panel {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  pointer-events: none;
  transform-origin: top center;
  transition: grid-template-rows 320ms var(--ease-apple-spring),
              opacity 240ms ease-out;
  will-change: grid-template-rows, opacity;
}

.apple-search-panel.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
  pointer-events: auto;
}

.apple-search-content {
  opacity: 0;
  transform: translateY(-8px) scale(0.99);
  transition: opacity 260ms var(--ease-apple-spring),
              transform 320ms var(--ease-apple-spring);
  will-change: opacity, transform;
}

.apple-search-content.is-open {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.apple-token-item {
  transition: transform 280ms var(--ease-apple-spring),
              opacity 240ms ease-out,
              background-color 120ms ease-out;
  will-change: transform, opacity;
}

.apple-search-content:not(.is-open) .apple-token-item {
  transform: translateY(-4px);
  opacity: 0;
  transition-duration: 100ms;
}

.apple-search-content.is-open .apple-token-item {
  transform: translateY(0);
  opacity: 1;
}
```

## Repo conventions to follow

- Custom animation classes and tokens live in `frontend1/src/index.css`.
- Tailwind utility classes are blended with designated semantic animation classes (e.g. `.apple-search-panel`, `.apple-search-content`).
- Zero layout shift policy: SearchBar must remain strictly inside its fixed `h-[58px]` anchor container `containerRef`.
- `prefers-reduced-motion` must be respected for accessibility.

## Steps

1. In `frontend1/src/index.css`:
   - Add Apple motion tokens:
     ```css
     --ease-apple-spring: cubic-bezier(0.2, 0.9, 0.25, 1);
     --ease-apple-out: cubic-bezier(0.23, 1, 0.32, 1);
     ```
   - Update `.apple-search-panel` to use `320ms var(--ease-apple-spring)`.
   - Update `.apple-search-content` to remove `filter: blur(...)` and use `320ms var(--ease-apple-spring)`.
   - Add `.apple-search-container` and `.apple-token-item` rules with staggered entrance capabilities.
   - Update `@media (prefers-reduced-motion: reduce)` block to eliminate transforms and staggers while retaining instant opacity.

2. In `frontend1/src/components/dashboard/SearchBar.tsx`:
   - Add `.apple-search-container` class and `${isFocused ? "is-active" : ""}` to the floating container.
   - Apply `apple-token-item` class to each token row in `filteredTokens.map`.
   - Set inline `style={{ transitionDelay: isFocused ? `${Math.min(idx * 28 + 30, 150)}ms` : '0ms' }}` on each token item.

## Boundaries

- Do NOT alter any DOM layout outside `SearchBar.tsx` and `index.css`.
- Do NOT change the visual appearance, border radius (28px), badge styling, token metrics, or colors.
- Do NOT re-introduce any vertical or horizontal layout shifts (parent container must stay `h-[58px]`).
- Do NOT add external dependencies (Framer Motion, React Spring, GSAP). Use pure CSS and hardware-accelerated transforms.

## Verification

- **Mechanical**: Run `npm run build` or Vite build in `frontend1` to ensure zero compilation or CSS errors.
- **Feel check**:
  1. Open the page and press `/` on the keyboard:
     - Notice the subtle, responsive bloom on the search pill.
     - Observe the dropdown unfold with palpable Apple-grade spring smoothness (320ms).
     - Notice the token results cascading into view sequentially (30ms stagger) instead of jumping in unison.
  2. In Chrome DevTools > Animations panel, throttle animation speed to 10%:
     - Verify there are zero dropped frames and no blur re-rasterization spikes.
     - Confirm that closing (pressing `Esc` or clicking outside) finishes cleanly in ~200ms without delay.
  3. Emulate `prefers-reduced-motion: reduce` in DevTools Rendering panel:
     - Verify transforms and staggers are dropped, switching instantly with a gentle fade.
- **Done when**: Pressing `/` feels unmistakably smooth, fluid, and natural like macOS Spotlight, with zero jerkiness and zero layout shifting.
