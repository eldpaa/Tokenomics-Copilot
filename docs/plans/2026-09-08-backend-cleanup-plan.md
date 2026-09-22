---
title: Backend Cleanup - Plan
type: chore
date: 2026-09-08
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
---

## Goal Capsule

- **Objective:** The backend repository is clean of all deprecated scratch files and stale audit artifacts, making it ready for production integration.
- **Means:** Remove the old JavaScript/TypeScript scratch scripts and empty the `backend/output` directory of legacy failed test results.
- **Stop Condition:** `check_checksum.js`, `check_checksum2.js`, and `cek_model.ts` are deleted; `backend/output/` is cleared of old logs.

## Product Contract

### Summary
The backend directory contains several leftover scratch files from earlier development iterations (such as `check_checksum.js`) and stale output files from failed audit batch runs. We need to clean these up so the backend is structured professionally.

### Problem Frame
During initial development, scratch files were used to test models and logic. These are now deprecated since the logic was merged into `anomaly.ts` and `core.ts`. Additionally, the output folder is polluted with old failure logs that could confuse users.

### Requirements

- R1. Deprecated root-level scratch files in the `backend/` directory must be removed.
- R2. The `backend/output/` directory's generated files must be cleared to ensure only fresh audit runs populate it.

## Planning Contract

- KTD1. **Direct file deletion.** The backend scratch files and output files will be deleted directly via filesystem APIs since they are unneeded.

## Implementation Units

### U1. Delete Backend Scratch Files
- **Goal:** Remove the deprecated development scratch files.
- **Files:**
  - `backend/check_checksum.js`
  - `backend/check_checksum2.js`
  - `backend/cek_model.ts`
- **Approach:** Use filesystem tools to permanently delete these three files.
- **Verification:** Run `ls backend` to verify the files no longer exist.
- **Covers:** R1

### U2. Clear Backend Output Caches
- **Goal:** Empty the `backend/output` directory of all previous audit JSON and txt files.
- **Files:**
  - `backend/output/*`
- **Approach:** Delete all `.json` and `.txt` files in `backend/output`.
- **Verification:** Run `ls backend/output` to verify it is empty.
- **Covers:** R2

## Verification Contract

| Verification Target | Command | Done Signal |
|---|---|---|
| Backend scratch deletion | `find backend -name "check_checksum*"` | No results found |
| Output cleanup | `ls backend/output` | No `.json` or `.txt` files present |

## Definition of Done

- All deprecated scratch files (`check_checksum.js`, `check_checksum2.js`, `cek_model.ts`) are deleted.
- All stale audit results in `backend/output/` are removed.
- The `backend/index.ts`, `backend/core.ts`, and `backend/server.ts` run correctly without errors.
