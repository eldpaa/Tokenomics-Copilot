# Animation Improvement Plans

This directory contains self-contained motion engineering implementation plans following the [AUDIT.md](../.agents/skills/improve-animations/AUDIT.md) and [PLAN-TEMPLATE.md](../.agents/skills/improve-animations/PLAN-TEMPLATE.md) specifications.

## Plan Catalog

| Plan | Title | Severity | Status | Dependencies | Target Files |
| --- | --- | --- | --- | --- | --- |
| [001](001-apple-search-spotlight-motion.md) | Apple Search Spotlight Fluid Motion & Timing Redesign | HIGH | DONE | None | `frontend1/src/index.css`, `frontend1/src/components/dashboard/SearchBar.tsx` |
| [002](002-spotlight-motion-vocabulary-refinement.md) | Apple Search Spotlight Motion Style & Vocabulary Refinement | MEDIUM | DONE | 001 | `frontend1/src/index.css`, `frontend1/src/components/dashboard/SearchBar.tsx`, `frontend1/src/pages/Dashboard.tsx` |
| [003](003-dynamic-island-compact-refinement.md) | Dynamic Island Compact Proportions & Material Cohesion | HIGH | DONE | 001 | `frontend1/src/components/shared/Layout.tsx`, `frontend1/src/components/shared/NetworkSwitcher.tsx` |
| [004](004-dynamic-island-transparency-and-hero-alignment.md) | Dynamic Island Transparency, Medium Width & Dashboard Hero Optical Alignment | MEDIUM | DONE | 003 | `frontend1/src/components/shared/Layout.tsx`, `frontend1/src/pages/Dashboard.tsx` |
| [005](005-dynamic-island-symmetry-and-hero-reposition.md) | Dynamic Island Symmetrical Medium Compact & Dashboard Hero Optical Elevation | MEDIUM | DONE | 004 | `frontend1/src/components/shared/Layout.tsx`, `frontend1/src/pages/Dashboard.tsx` |
| [006](006-dynamic-island-backdrop-blur-and-hero-golden-ratio.md) | Dynamic Island True Backdrop Blur, Rounded Capsule Transitions & Hero Golden Upper-Third | HIGH | DONE | 005 | `frontend1/src/components/shared/NetworkSwitcher.tsx`, `frontend1/src/components/shared/Layout.tsx`, `frontend1/src/pages/Dashboard.tsx` |
| [007](007-ai-analysis-step-transition-polish.md) | AI Analysis Step Transition Polish: Apple Intelligence Pacing & Blur-Masked Crossfade | MEDIUM | DONE | None | `frontend1/src/components/dashboard/AiAnalysisIndicator.tsx`, `frontend1/src/index.css` |

## Execution Guidelines

To execute any plan:
1. Ensure the executor reviews `plans/NNN-*.md` in full.
2. Maintain strict boundaries: zero layout shift, zero modifications to geometry, buttons, or design tokens outside the specified motion changes.
3. Verify using the feel-check procedure specified in each plan.
