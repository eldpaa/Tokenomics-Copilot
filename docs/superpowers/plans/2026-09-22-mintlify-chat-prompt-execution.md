# Mintlify AI Chat Prompting & Documentation Activation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Submit the exact prompt and configuration directives to the Mintlify AI chat assistant with the uploaded deployment guide, ensuring Mintlify correctly detects `docs/mint.json` and deploys the live documentation portal.

**Architecture:** Mintlify's AI assistant ingests the attached deployment guide file and executes the repository setup on `eldpaa/Tokenomics-Copilot`. It points the documentation root to `/docs`, configures the `#10B981` theme, and deploys the site to `tokenomics-copilot.mintlify.app`.

**Tech Stack:** Mintlify Cloud, Mintlify AI Assistant, GitHub Webhook, MDX, JSON.

**Spec:** `docs/superpowers/plans/2026-09-22-mintlify-deployment-guide.md`

## Global Constraints
- Repository: `eldpaa/Tokenomics-Copilot` (Branch: `main`).
- Documentation root: `/docs`.
- Configuration file: `docs/mint.json`.
- Output domain: `https://tokenomics-copilot.mintlify.app` (or custom domain).

---

### Task 1: Submit Tailored Activation Prompt to Mintlify Chat

**Target:** Mintlify Web Chat Interface (with `2026-09-22-mintlify-deployment-guide.md` attached)

**Interfaces:**
- Consumes: The attached deployment guide markdown file.
- Produces: Mintlify AI automated project initialization targeting `/docs`.

- [ ] **Step 1: Copy the official English instruction prompt**

```text
Please set up and deploy the documentation for Tokenomics Copilot following this attached guide. All documentation files, MDX pages, and the configuration file (mint.json) are located in the "/docs" directory of our connected GitHub repository (eldpaa/Tokenomics-Copilot). Please set the documentation root folder to "/docs" and initialize the documentation portal with our dark Space Black / Electric Indigo theme (#6366F1).
```

- [ ] **Step 2: Paste the prompt into the Mintlify chat box**
Paste the text into the input field adjacent to the uploaded file.

- [ ] **Step 3: Press Send / Enter**
Submit the message and allow Mintlify's AI agent to parse the file and initialize the documentation build.

---

### Task 2: Evaluate Mintlify AI Output & Confirm Live Site

**Target:** Mintlify Console / Preview Window

**Interfaces:**
- Consumes: Build output and live URL from Mintlify.
- Produces: Confirmed live documentation URL for hackathon submission.

- [ ] **Step 1: Verify Mintlify detects `/docs` folder**
Check Mintlify's response to ensure it mapped to `/docs` and loaded `mint.json` rather than root.

- [ ] **Step 2: Verify live deployment link**
Click the generated preview link (e.g. `https://tokenomics-copilot.mintlify.app`) and confirm all 5 pages render:
- Introduction (`docs/introduction.mdx`)
- Quickstart (`docs/quickstart.mdx`)
- User Flow (`docs/user-flow.mdx`)
- Smart Contract (`docs/smart-contract.mdx`)
- Architecture (`docs/architecture.mdx`)

---

### Task 3: Sync Active Live URL to Repository & README

**Files:**
- Modify: `README.md:19`
- Modify: `docs/superpowers/plans/2026-09-22-submission-readiness-execution.md`

- [ ] **Step 1: Update README.md with the live Mintlify URL**
Ensure the documentation row in `README.md` points directly to the active Mintlify URL.

- [ ] **Step 2: Commit and push update to GitHub**
```bash
git add README.md docs/
git commit -m "docs: link verified live Mintlify documentation portal"
git push origin main
```
