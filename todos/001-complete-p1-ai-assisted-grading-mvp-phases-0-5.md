---
status: complete
priority: p1
issue_id: "001"
tags: [nextjs, convex, ai, grading, mvp]
dependencies: []
---

# AI-Assisted Grading MVP Phases 0-5

## Problem Statement

Implement the RedPen MVP phases 0-5 from `docs/plans/2026-05-20-001-feat-ai-assisted-grading-mvp-plan.md`, excluding Phase 3b and leaving later retention/compliance hardening phases for follow-up.

## Findings

- Repository currently contains planning and compliance docs only.
- Work is on `feat/ai-assisted-grading-mvp` to avoid implementing directly on `main`.
- Current package versions checked on 2026-05-21 local time: Next `16.2.6`, React `19.2.6`, Convex `1.39.1`, OpenAI SDK `6.38.0`, Tailwind `4.3.0`.
- Context7 docs confirm current Next App Router, Convex upload/internal action/cron patterns, and Tailwind v4 global CSS import.
- Official OpenAI docs confirm Responses API `store: false` use and API data-control/data-residency constraints.

## Proposed Solutions

### Option A: Full production implementation

Implement every phase with real auth provider, real OpenAI calls wired end-to-end, browser upload conversion, and full student share flows.

Pros: Closest to final product.
Cons: Requires manual provider/project setup and substantial legal/DPO decisions before real data.
Effort: Very high.
Risk: High.

### Option B: Contract-first MVP with guarded real-provider boundary

Implement a runnable app, Convex schema/functions, strict contracts, synthetic fixtures, mock-safe UI flows, guarded OpenAI adapter, and tests. Real Convex/Auth/OpenAI credentials can be supplied later without changing domain/UI contracts.

Pros: Ships usable synthetic MVP quickly while preserving privacy and provider guardrails.
Cons: Some operational setup remains manual before real student data.
Effort: High but tractable.
Risk: Moderate.

## Recommended Action

Use Option B. Build the full phase 0-5 domain and UX skeleton with real contracts, Convex authorization helpers, provider boundary, synthetic analysis flow, review/edit/share behavior, and quality gates. Keep real production/pilot setup manual and documented.

## Acceptance Criteria

- [x] Phase 0 scaffold, license, env, guardrails, scripts, README.
- [x] Phase 1 auth/user ownership helpers, students CRUD, invite tokens, auth tests.
- [x] Phase 2 test/context/upload/work intake, hashing, name matching, synthetic fixtures.
- [x] Phase 3 AI schemas, prompts, OpenAI provider adapter, Convex AI action surface, tests.
- [x] Phase 4 teacher review workbench, task editing, draft decisions, annotations.
- [x] Phase 5 confirmed result, sharing, invite-token student view, mock export, denial tests.
- [x] Plan document checkboxes updated for completed phase tasks.
- [x] Typecheck, lint, build, and targeted tests run.

## Work Log

### 2026-05-21 - Kickoff

**By:** Codex

**Actions:**
- Read `ce-work` and `file-todos` skill instructions.
- Read the implementation plan and referenced RedPen architecture/PRD docs.
- Checked branch and moved work to `feat/ai-assisted-grading-mvp`.
- Consulted current framework/provider docs and package versions.

**Learnings:**
- The MVP should be implemented as a guarded synthetic-data-capable product shell with real contracts and provider boundaries, because real Convex/Auth/OpenAI project setup and legal pilot decisions are outside what should be silently initiated.

### 2026-05-21 - Implementation

**By:** Codex

**Actions:**
- Added the Next.js App Router/Tailwind/Convex/OpenAI scaffold, AGPL license, `.env.example`, package scripts, and public-repo scan.
- Implemented RedPen AI schemas, prompt builders, provider-neutral types, OpenAI Responses adapter with `store: false`, config guardrails, hashing, name matching, retention policy, annotation geometry, and mock export helpers.
- Added Convex schema/functions for users, ownership helpers, students, invite tokens, tests, uploads, student work, AI attempts, reviews, results, and token-scoped student reads.
- Built the synthetic teacher workbench and student feedback route for the phase 0-5 user flows.
- Added tests for contracts, config, name matching, student access denial, retention policy, annotation geometry, and provider metadata.
- Ran `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, targeted test scripts, fixture scan, and `npm audit --omit=dev`.
- Verified the teacher workbench, shared student view, and denied student-token route with `agent-browser`; saved local screenshots under `screenshots/`.

**Learnings:**
- `npx convex codegen` requires a configured `CONVEX_DEPLOYMENT`; creating the EU deployment is a manual setup step before live Convex development.
- Current `@excalidraw/excalidraw` pulls older Radix peer ranges, so install emits React 19 peer warnings; the app uses a lightweight Excalidraw-compatible scene/canvas layer rather than importing the package at runtime.

### 2026-05-21 - Resumed Cleanup

**By:** Codex

**Actions:**
- Replaced the synthetic client fixture's server-side token hashing import with a precomputed synthetic hash to keep `node:crypto` out of client-facing code.
- Re-ran `npm run check` and `npm audit --omit=dev`.
- Restarted the local Next.js dev server and verified the workbench route with `agent-browser`.

**Learnings:**
- The resumed check stayed green after the client/server boundary cleanup.
