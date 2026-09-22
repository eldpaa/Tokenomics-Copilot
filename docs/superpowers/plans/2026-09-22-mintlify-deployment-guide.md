# Mintlify Documentation Setup & Deployment Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the `eldpaa/Tokenomics-Copilot` GitHub repository to Mintlify, configure the `/docs` path, and deploy a live, interactive Web3 documentation portal accessible at `https://tokenomics-copilot.mintlify.app` (or custom domain).

**Architecture:** Connect Mintlify's cloud compiler directly to the GitHub repository webhook. Mintlify ingests `docs/mint.json` and renders MDX documentation pages (`introduction.mdx`, `quickstart.mdx`, `user-flow.mdx`, `smart-contract.mdx`, `architecture.mdx`) with real-time GitHub branch syncing on `main`.

**Tech Stack:** Mintlify Cloud, GitHub Apps integration, MDX (Markdown + React components), Mermaid.js sequence diagrams, DNS CNAME.

**Spec:** `docs/plans/2026-09-22-submission-readiness-and-demo-video-plan.md`

## Global Constraints
- Target repository: `https://github.com/eldpaa/Tokenomics-Copilot` (Branch: `main`).
- Documentation subfolder: `/docs` (containing `mint.json` and all `.mdx` content).
- Brand color: `#10B981` (Emerald Green - BNB Ecosystem alignment).
- Official URL for hackathon form: `https://tokenomics-copilot.mintlify.app` (or custom domain if configured).

---

### Task 1: Pre-Deployment Audit of Local Documentation Assets

**Files:**
- Audit: `docs/mint.json`
- Audit: `docs/introduction.mdx`
- Audit: `docs/quickstart.mdx`
- Audit: `docs/user-flow.mdx`
- Audit: `docs/smart-contract.mdx`
- Audit: `docs/architecture.mdx`

**Interfaces:**
- Consumes: Static MDX files and JSON configuration in `/docs`.
- Produces: Validated, syntax-error-free documentation tree ready for Mintlify cloud build.

- [ ] **Step 1: Verify `docs/mint.json` schema and paths**
  Confirm that every slug in `navigation.pages` maps 1:1 to an existing `.mdx` file without leading `/` or `.mdx` extension.
- [ ] **Step 2: Check Mermaid syntax in `docs/user-flow.mdx`**
  Ensure sequence diagram quotes and actor definitions do not contain unsupported symbols.
- [ ] **Step 3: Verify external hyperlinks in docs**
  Ensure GitHub CTA points to `https://github.com/eldpaa/Tokenomics-Copilot` and live app links point to production dApp.

---

### Task 2: Mintlify Dashboard Project Creation & GitHub App Authorization

**Platform:** Mintlify Web Dashboard (`https://dashboard.mintlify.com` or `https://mintlify.com/start`)

- [ ] **Step 1: Sign in with GitHub**
  Navigate to Mintlify and log in via GitHub OAuth using the `eldpaa` account.
- [ ] **Step 2: Authorize Mintlify GitHub App**
  Grant Mintlify read & webhook access to the repository `eldpaa/Tokenomics-Copilot`.
- [ ] **Step 3: Select Repository & Branch**
  - Choose `Tokenomics-Copilot`.
  - Set production branch to `main`.
- [ ] **Step 4: Configure Docs Directory Path**
  In repository settings / setup screen, specify `docs` as the documentation root (since `mint.json` lives in `/docs`).
- [ ] **Step 5: Define Subdomain**
  Set subdomain name: `tokenomics-copilot` (producing `https://tokenomics-copilot.mintlify.app`).

---

### Task 3: Build Verification & Live Quality Assurance

**Target:** `https://tokenomics-copilot.mintlify.app`

- [ ] **Step 1: Monitor Initial Build in Mintlify Console**
  Verify that the build passes with status `Success` and zero MDX parsing errors.
- [ ] **Step 2: Verify Navigation & Page Hierarchy**
  - Check "Getting Started" group: Introduction, Quickstart, User Flow.
  - Check "On-Chain Architecture" group: Smart Contract, Architecture.
- [ ] **Step 3: Test Interactive Elements**
  - Test copy-to-clipboard on code blocks.
  - Verify dark mode rendering with emerald accent highlights.
  - Test topbar CTA buttons ("Live dApp" and "GitHub").

---

### Task 4: (Optional) Custom Domain Binding

**Platform:** DNS Provider (Cloudflare, Namecheap, GoDaddy, Vercel DNS)

- [ ] **Step 1: Add Custom Domain in Mintlify Settings**
  Enter `docs.tokenomics-copilot.xyz` in Mintlify Project Settings -> Custom Domain.
- [ ] **Step 2: Configure CNAME Record**
  - Type: `CNAME`
  - Host: `docs`
  - Value: `cname.mintlify.com` (or value specified in Mintlify dashboard)
- [ ] **Step 3: Verify SSL Generation**
  Wait 2-5 minutes for Mintlify to auto-provision Let's Encrypt SSL certificate.

---

### Task 5: Synchronize Live Documentation URL across Project & Submission Form

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-09-22-submission-readiness-execution.md`

- [ ] **Step 1: Update README.md with Live Mintlify URL**
  Replace any placeholder docs URL with the active `https://tokenomics-copilot.mintlify.app`.
- [ ] **Step 2: Commit and Push**
  Push the updated README to GitHub so judges immediately see the active docs link.
