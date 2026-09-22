---
title: Fix Frontend Blank Screen & Module Import Failures - Plan
type: bugfix
date: 2026-09-22
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan
execution: code
---

## Goal Capsule

- **Objective:** Fix the frontend rendering crash so the Tokenomics Copilot web interface loads completely and reliably on `http://localhost:5173`, eliminating the blank/color-only screen.
- **Means:** Eliminate invalid named imports in dead code (`@hugeicons` in `demo.tsx`/`stacked-list.tsx`), normalize ESM configurations (`tailwind.config.js`, `vite.config.ts`), add global script-level error diagnostics in `index.html`, and verify end-to-end bundling.
- **Stop Condition:** Opening `http://localhost:5173` renders the full UI (Dynamic Island navigation, Spotlight Search Bar, BNB Chain telemetry, and WebGL WarpShader) without any blank screen or browser console errors.

---

## Product Contract

### Summary
When starting the local dev server and navigating to `http://localhost:5173`, users previously encountered a completely blank screen ("warna polos") with zero UI elements rendered. This plan outlines the root cause diagnosis, code adjustments, configuration standardizations, and systematic verification steps required to restore the frontend.

### Problem Frame & Root Cause Analysis
1. **SyntaxError from Missing Named Exports (Fatal Blocker):**
   `App.tsx` statically imported `Demo` from `pages/demo.tsx`, which imported `components/ui/stacked-list.tsx`. In `stacked-list.tsx`:
   - `HugeiconsIcon` was imported from `@hugeicons/react`, but it is only a TypeScript `type` declaration in `@hugeicons/react`, not a runtime value.
   - `ProfileIcon`, `Search01Icon`, `Cancel01Icon`, etc., were imported from `@hugeicons/core-free-icons`, but those icons do not exist in that package.
   - In ES Modules / Vite, an invalid named export triggers an immediate `Uncaught SyntaxError: The requested module does not provide an export named '...'` at script evaluation time. Because this occurs before React mounts, React and the React ErrorBoundary cannot run, leaving only the body background color visible.
2. **ESM vs CommonJS Config Mismatch:**
   `frontend1/package.json` specifies `"type": "module"`. However, `tailwind.config.js` was written in CommonJS (`module.exports` and `require("tailwindcss-animate")`), causing PostCSS compilation conflicts.
3. **ESM Path Resolution:**
   `vite.config.ts` used `__dirname` without declaring it via `fileURLToPath(import.meta.url)`, which can throw in pure ESM Node runtimes.
4. **Dev Server Launch Ambiguity:**
   Running `bun run` without subcommands merely prints available scripts without starting Vite. The command must be `bun run dev` (or `cd frontend1 && bun run dev`).

### Requirements
- R1. All invalid imports (`@hugeicons/*` and unused `Demo` routes) must be disconnected or replaced with working primitives.
- R2. `tailwind.config.js` and `vite.config.ts` must adhere to standard ES Module syntax (`import` / `export default`).
- R3. An on-screen diagnostic catcher (`window.addEventListener('error')`) must exist in `index.html` to surface any future script-level crashes immediately to developers.
- R4. Both the frontend and backend must launch seamlessly with documented single-step terminal commands.

---

## Planning Contract

- KTD1. **Decoupling Unused Experiments:** The `demo.tsx` and `stacked-list.tsx` files are standalone UI experiment components not used in the core Tokenomics Copilot product. Removing `Demo` from `App.tsx` prevents experimental dependencies from crashing production routes.
- KTD2. **Defensive Storage & WebGL:** All `sessionStorage` access must be wrapped with fallback guards so private/incognito browsing never triggers `DOMException`.
- KTD3. **Zero-Bundle Regressions:** The core UI uses `lucide-react`, which is fully installed and valid.

---

## Implementation Units

### U1. Eliminate Broken Imports & Prune Dead Routes
- **Goal:** Prevent ESM syntax errors from halting bundle evaluation.
- **Target Files:**
  - `frontend1/src/App.tsx`
  - `frontend1/src/pages/demo.tsx`
- **Actions:**
  - Remove `import Demo from "@/pages/demo"` and `<Route path="/demo" ... />` from `App.tsx`.
  - Replace `demo.tsx` with a lightweight placeholder that does not import `@hugeicons`.
- **Covers:** R1

### U2. Standardize Configuration Files to ES Modules
- **Goal:** Ensure PostCSS and Vite compile without module format warnings or errors.
- **Target Files:**
  - `frontend1/tailwind.config.js`
  - `frontend1/vite.config.ts`
- **Actions:**
  - Update `tailwind.config.js` to `import tailwindcssAnimate from "tailwindcss-animate"` and `export default`.
  - In `vite.config.ts`, define `const __dirname = path.dirname(fileURLToPath(import.meta.url))`.
- **Covers:** R2

### U3. Embed Diagnostic Error Interceptors & Styling Baselines
- **Goal:** Ensure the user never sees a silent blank screen if any runtime exception occurs.
- **Target Files:**
  - `frontend1/index.html`
  - `frontend1/src/main.tsx`
- **Actions:**
  - Set `class="dark bg-[#08080B] text-white"` on `<body>` in `index.html`.
  - Add visual `window.addEventListener('error')` script in `index.html` to catch script-level load failures.
  - Wrap `<App />` inside a styled React `ErrorBoundary` in `main.tsx`.
- **Covers:** R3

### U4. Safe Storage Wrappers & Backend Cache Speedup
- **Goal:** Ensure resilient browser state and sub-15ms audit queries for cached tokens.
- **Target Files:**
  - `frontend1/src/lib/walletContext.tsx`
  - `frontend1/src/pages/AuditDetailPage.tsx`
  - `backend/server.ts`
- **Actions:**
  - Wrap `sessionStorage` operations with `safeGetSession`, `safeSetSession`, `safeRemoveSession`.
  - In `backend/server.ts`, check `muatProgress()` before triggering live Gemini/RPC calls on `GET /audit/:symbol`.
- **Covers:** R4

---

## Verification Contract

| Verification Target | Command / Action | Expected Done Signal |
|---|---|---|
| Module Evaluation | `cd frontend1 && bun run dev` | Vite server starts on `http://localhost:5173` without error |
| UI Rendering | Open `http://localhost:5173` in browser | Dynamic Island, Spotlight Search, and BNB Intelligence Header render |
| Search Interaction | Type `CAKE` or `/` into SearchBar | Token results and radial risk score display smoothly |
| Error Immunity | Inspect DevTools (`F12` -> Console) | 0 Uncaught SyntaxErrors or script crash reports |

---

## Definition of Done

1. Frontend loads cleanly at `http://localhost:5173` without showing an empty or blank screen.
2. All components in the main user journey (Dashboard, Search, Wallet Gate, Audit Detail) function as intended.
3. No broken or unresolvable imports remain in the source tree.
