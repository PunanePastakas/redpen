---
status: complete
priority: p1
issue_id: "006"
tags: [ai, grading, schema, convex, fixtures]
dependencies: []
---

# Guide-Derived Dynamic Task Schema

## Problem Statement

Execute `docs/plans/2026-05-22-002-feat-guide-derived-dynamic-schema-plan.md`: when a `hindamisjuhis` / grading guide is uploaded, RedPen should extract a stable test task model first and use that expected task structure for every later student-work analysis in the same test.

## Findings

- Current student analysis is one call per work and prompt-guided only, so task labels, counts, and max points can drift between students.
- The schema already has `tests.taskModel` and a `testTasks` table, but no guide extraction action populates them.
- The fixture scenario uses a four-exercise synthetic guide and two JPG student works showing the first two exercises.
- Missing expected tasks must be represented safely as not visible or uncertain, not silently omitted and not automatically graded as zero.

## Proposed Solutions

### Option 1: Guide-first extraction with expected-task validation

**Approach:** Add a guide task-model schema, persist expected test tasks, generate a keyed expected-task analysis schema for guided works, and validate exact task coverage server-side.

**Pros:**
- Preserves one stable rubric spine across students.
- Keeps no-guide behavior flexible.
- Matches the plan and existing `testTasks` model.

**Cons:**
- Touches AI schema, prompts, Convex orchestration, fixtures, tests, and a small UI state surface.

**Effort:** Large

**Risk:** Medium

### Option 2: Prompt-only guide consistency

**Approach:** Strengthen the current prompt without changing persistence or schema.

**Pros:**
- Smaller change.

**Cons:**
- Does not enforce identical expected fields across students.
- Leaves point maxima and task names vulnerable to drift.

**Effort:** Small

**Risk:** High product risk

## Recommended Action

Use option 1. Build backend and pure contract tests first, then add minimal workbench status for extracted/pending/stale guide task models.

## Technical Details

Affected files:

- `lib/ai-schemas.ts`
- `lib/ai/prompts.ts`
- `lib/ai/dynamic-analysis-schema.ts`
- `lib/ai/expected-task-validation.ts`
- `convex/schema.ts`
- `convex/validators.ts`
- `convex/tests.ts`
- `convex/uploads.ts`
- `convex/works.ts`
- `convex/aiActions.ts`
- `components/workbench-shell.tsx`
- `tests/ai-schemas.test.ts`
- new focused AI contract/validation tests

## Resources

- Plan: `docs/plans/2026-05-22-002-feat-guide-derived-dynamic-schema-plan.md`
- Fixtures: `fixtures/synthetic/juhis.pdf`, `fixtures/synthetic/1o.jpg`, `fixtures/synthetic/1v.jpg`
- OpenAI structured outputs: https://platform.openai.com/docs/guides/structured-outputs

## Acceptance Criteria

- [x] Guide task model schema is strict-output compatible.
- [x] Synthetic guide extraction fixture parses.
- [x] Guided student analysis output includes every expected guide task exactly once.
- [x] Missing/not-visible guide tasks remain present and flagged for teacher review.
- [x] Task reviews for guided analyses link to `testTasks`.
- [x] No-guide analysis still works with flexible task discovery.
- [x] Workbench shows task-model extraction state and blocks guided analysis while stale/failed.
- [x] Relevant tests, typecheck, and lint pass.

## Work Log

### 2026-05-22 - Start Implementation

**By:** Codex

**Actions:**
- Created branch `feat/guide-derived-dynamic-schema` from `main`.
- Read the plan and relevant local AI/Convex/UI files.
- Chose the plan defaults: lazy/on-demand extraction before first guided analysis and a dedicated task evidence status.

**Learnings:**
- The current Convex path already schedules one work analysis at a time; the main change is making guide task extraction a prerequisite for guided works and validating keyed expected task output before adapting it to the existing array-based review flow.

### 2026-05-22 - Complete Implementation

**By:** Codex

**Actions:**
- Added guide task-model schemas, dynamic expected-task analysis schemas, and post-parse validation.
- Added Convex guide extraction orchestration, guide upload scheduling, task-model persistence, analysis blocking while guide tasks are not ready, and `taskReviews.taskId` linking.
- Updated mock AI output to produce a four-task guided analysis with later tasks marked `not_visible_in_upload`.
- Added workbench guide task-model status and retry controls.
- Updated architecture, PRD, README, plan, and AI contract tests.
- Ran `npx convex codegen`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:ai-contracts`, and `npm run test:fixtures`.

**Learnings:**
- A keyed dynamic schema plus server-side validation keeps the model output aligned to the persisted guide while still adapting back to the existing `GradingAnalysis` array shape.
- Guide extraction jobs need a source-hash guard so older scheduled jobs cannot overwrite a newer guide model when multiple guide files are uploaded together.
