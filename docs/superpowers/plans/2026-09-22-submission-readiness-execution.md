# Submission Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Tokenomics Copilot repository into an institutional-grade, submission-ready project equipped with a complete Mintlify documentation portal, a dual-language master README, an on-chain Solidity escrow contract, and a word-for-word 2–4 minute video demo script.

**Architecture:** Create static documentation artifacts under `/docs` structured for Mintlify deployment (`mint.json` + MDX pages), write the Solidity payment escrow contract under `/contracts`, author a comprehensive root `README.md`, and produce a ready-to-record video demo narration sheet.

**Tech Stack:** Mintlify (MDX), Solidity 0.8.20, Markdown, Mermaid, Viem, BNB Smart Chain Testnet.

**Spec:** `docs/plans/2026-09-22-submission-readiness-and-demo-video-plan.md`

## Global Constraints
- Target network: BNB Smart Chain Testnet (Chain ID: 97).
- One-liner must feature: "An agent can secure your assets while you sleep at 3am" / "An autonomous AI security copilot that audits and secures your Web3 assets while you sleep at 3 AM."
- All docs, README, and scripts must provide both English (official submission) and Indonesian (localization).
- No placeholder strings like "TODO" or "TBD" in deliverables.

---

### Task 1: Root Master Production `README.md`

**Files:**
- Create/Overwrite: `README.md`

- [ ] **Step 1: Write the production README.md**
Include badges, One-liner, Submission links table, Problem/Solution statement, Features, Tech stack, Contract verification table, Architecture diagram, and VC Roadmap.

---

### Task 2: Solidity Escrow Contract for BNB Chain Testnet

**Files:**
- Create: `contracts/TokenomicsAuditEscrow.sol`

- [ ] **Step 1: Implement TokenomicsAuditEscrow.sol**
Implement `payForAudit(string calldata tokenSymbol)` accepting `0.001 ether` fee, emitting `AuditPaid(address indexed user, string indexed tokenSymbol, uint256 amount, uint256 timestamp)` and owner withdrawal.

---

### Task 3: Mintlify Documentation Portal Setup

**Files:**
- Create: `docs/mint.json`
- Create: `docs/introduction.mdx`
- Create: `docs/quickstart.mdx`
- Create: `docs/user-flow.mdx`
- Create: `docs/smart-contract.mdx`
- Create: `docs/architecture.mdx`

- [ ] **Step 1: Create `docs/mint.json` configuration**
Configure navigation groups ("Getting Started", "On-Chain Architecture", "API Reference"), primary theme color (`#10B981`), topbar links, and logo settings.

- [ ] **Step 2: Create documentation MDX pages**
Author comprehensive pages covering user flow, architecture, quickstart guide, and smart contract verification on BscScan Testnet.

---

### Task 4: Video Demo Script & Recording Guide (2–4 Minutes)

**Files:**
- Create: `docs/DEMO_VIDEO_SCRIPT.md`

- [ ] **Step 1: Author word-for-word voiceover script**
Break down into 5 timed scenes (0:00 to 3:15) with precise on-screen action directives and English narration lines for recording or ElevenLabs voice synthesis.

---

### Task 5: Git Atomic Multi-Commit Shell Script

**Files:**
- Create: `scripts/build-submission-commits.sh`

- [ ] **Step 1: Write atomic commit staging script**
Organize repository changes into 8 clean, logical commits resolving the mentor's "❌ 1 commit" warning.
