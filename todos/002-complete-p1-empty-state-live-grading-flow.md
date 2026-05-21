---
status: complete
priority: p1
issue_id: "002"
tags: [nextjs, convex, ai, grading, empty-state]
dependencies: []
---

# Empty State And Live Grading Flow

## Problem Statement

Execute `docs/plans/2026-05-21-001-feat-empty-state-live-grading-flow-plan.md`: replace the synthetic-first RedPen workbench with a live post-login empty state, upload intake, AI analysis flow, review, confirmation, sharing, and live student access for phases 0-5, excluding Phase 3b.

## Findings

- The current workbench imports `lib/synthetic-demo.ts` and renders placeholder tests, students, works, reviews, annotations, and student links.
- `convex/aiActions.ts` currently records attempts but returns synthetic analysis instead of using uploaded files or the OpenAI provider.
- Convex schema and most CRUD functions already exist for the target MVP model.
- Synthetic fixtures now exist under `fixtures/synthetic/`: `juhis.pdf`, `1o.jpg`, and `1v.jpg`.

## Proposed Solutions

### Option A: Full live path only

Remove all synthetic runtime paths and require Convex/OpenAI for every interaction.

Pros: Honest product state.
Cons: Harder to test locally without live services.

### Option B: Live default with explicit mock/test provider

Make the UI and runtime live by default, while allowing synthetic/mock provider output only through tests or explicit backend env.

Pros: Honest product state plus testability.
Cons: Requires clear config boundaries.

## Recommended Action

Use Option B. The production/default app should never silently render placeholder data or return synthetic analysis, while tests may keep synthetic fixtures behind explicit mock paths.

## Acceptance Criteria

- [x] Authenticated empty workbench shows no placeholder data.
- [x] Teacher can create a test.
- [x] Teacher can upload grading context and student works.
- [x] Analysis uses uploaded files/context or explicit mock provider only.
- [x] Teacher can review, confirm, share, and open a live student result.
- [x] Student result access denies invalid or mismatched token/result pairs.
- [x] Original plan checkboxes are updated.
- [x] Quality checks pass.

## Work Log

### 2026-05-21 - Started

**By:** Codex

**Actions:**
- Read the `ce-work` instructions and empty-state live-flow plan.
- Confirmed work should continue on `feat/ai-assisted-grading-mvp`.
- Created this todo to track execution.

**Learnings:**
- The implementation should preserve the existing phase 0-5 model and remove synthetic behavior from the default app path rather than expanding scope into Phase 3b.

### 2026-05-21 - Completed

**By:** Codex

**Actions:**
- Reworked the teacher workbench to use live Convex queries/mutations and show an honest setup/login/empty state instead of synthetic placeholder data.
- Added live upload, analysis enqueue, review, student linking, confirmation, sharing, mock export, and result-link UI paths.
- Replaced the synthetic student page with a live token/result route.
- Reworked Convex AI actions so analysis reads stored work/context uploads, uses OpenAI Responses with `store: false`, records failed attempts, and only returns synthetic output when `REDPEN_AI_PROVIDER=mock`.
- Updated README and fixture docs for the empty-first flow and fixture smoke-test path.
- Ran `npm run check`, `npm run test:ai-contracts`, `npm audit --omit=dev`, and a browser smoke on port 3001.

**Learnings:**
- The local port 3000 server was a different app, so RedPen browser smoke used port 3001 and then stopped only that server.
- Authenticated fixture upload and live OpenAI smoke remain environment-gated because they require a configured Convex/Auth session and reviewed provider credentials.
