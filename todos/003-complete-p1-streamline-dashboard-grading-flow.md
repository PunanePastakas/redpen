---
status: complete
priority: p1
issue_id: "003"
tags: [nextjs, convex, dashboard, grading-flow, ui]
dependencies: []
---

# Streamline Dashboard Grading Flow

## Problem Statement

Execute `docs/plans/2026-05-21-002-feat-streamline-dashboard-grading-flow-plan.md`: simplify the authenticated RedPen dashboard into a clear three-zone grading workflow with modal test creation, test-local setup controls, combined work upload/preview, reversible removal, and analysis/review/result actions in the third column.

## Findings

- The current branch started from `main` and now continues on `feat/streamline-dashboard-grading-flow`.
- `components/workbench-shell.tsx` owns the dashboard UI and state.
- Existing Convex mutations already support test create/update, work creation, uploads, analysis, review decisions, result confirmation, sharing, and student linking.
- Work removal/undo needs a small teacher-owned archive/restore surface.

## Proposed Solutions

### Option A: Minimal in-place refactor

Keep most dashboard state in `components/workbench-shell.tsx` and extract only where the file becomes hard to maintain.

Pros: Fast, low migration risk.
Cons: Keeps one large client component.

### Option B: Full component split

Move each rail/modal into its own file immediately.

Pros: Cleaner boundaries.
Cons: More prop plumbing and larger change set.

## Recommended Action

Use Option A with private helper components/functions first. Extract only if the implementation becomes unwieldy.

## Acceptance Criteria

- [x] Full authenticated no-tests dashboard state is implemented.
- [x] Create-test modal replaces inline create form.
- [x] Test title, feedback language, and `hindamisjuhend` controls live in the test rail.
- [x] Work upload and preview are one middle-column surface.
- [x] Work removal is reversible without hard-deleting storage.
- [x] Analysis/review/result actions live in the third column.
- [x] Plan checkboxes are updated.
- [x] Quality checks pass.

## Work Log

### 2026-05-21 - Started

**By:** Codex

**Actions:**
- Read the `ce-work` skill and the streamline dashboard plan.
- Created feature branch `feat/streamline-dashboard-grading-flow`.
- Created this todo to track execution.

**Learnings:**
- Use the plan's defaults: disable removal for confirmed/shared works, preserve one-uploaded-file-per-work behavior, and avoid upload-level hard deletion.

### 2026-05-21 - Completed

**By:** Codex

**Actions:**
- Added teacher-owned work archive/restore mutations and excluded archived works from the default work list.
- Added workflow-state helpers and Vitest coverage for removal eligibility and next-work selection.
- Reworked `components/workbench-shell.tsx` into a three-zone dashboard: test rail, work upload/preview workspace, and analysis/review/result rail.
- Replaced inline test creation with an accessible modal.
- Moved title, feedback language, and `hindamisjuhend` controls into the test rail.
- Moved analysis initiation into the right rail and disabled it for running, confirmed, or shared work.
- Ran `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
- Captured a browser smoke screenshot at `screenshots/streamline-dashboard-smoke.png` against the existing local dev server on port 3001.

**Learnings:**
- The current local server was already running on port 3001, so no new persistent Node server was left running.
- Authenticated Convex state was not manually exercised because there was no existing browser session and creating test data in the user's deployment would be intrusive.
