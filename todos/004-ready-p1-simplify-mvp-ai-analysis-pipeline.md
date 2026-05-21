---
status: completed
priority: p1
issue_id: "004"
tags: [ai, grading, schema, convex, frontend, katex]
dependencies: []
---

# Simplify MVP AI Analysis Pipeline

## Problem Statement

Execute `docs/plans/2026-05-21-003-feat-simplify-mvp-ai-analysis-pipeline-plan.md`: replace the heavier `RedPenAnalysis` AI draft contract with a lean `GradingAnalysis` contract, update prompt/provider/persistence paths, add shared KaTeX rendering validation, support batch analysis scheduling, and align docs/tests.

## Findings

- Current code still uses `RedPenAnalysisSchema`, `taskDrafts`, `workMap`, `contextInterpretation`, `overallDraft`, language metadata, and `normalizedMath`.
- The live Convex path assembles one request per `studentWorks` record already, which matches the simplified pipeline.
- The workbench and annotation components consume `AnnotationTarget` from the AI schema, so type compatibility needs to be preserved while simplifying annotation shapes.

## Proposed Solutions

1. Replace schema and adapt call sites directly.
   - Pros: aligns code with MVP plan quickly.
   - Cons: touches several files at once.

2. Add compatibility adapter for old and new output.
   - Pros: lower migration risk.
   - Cons: retains complexity the plan explicitly removes.

## Recommended Action

Use option 1. This branch is already focused on grading-flow simplification, and the current implementation has not shipped as a stable external API.

## Acceptance Criteria

- [x] `GradingAnalysisSchema` replaces `RedPenAnalysisSchema`.
- [x] Prompt asks for whole-work grading and KaTeX-compatible math.
- [x] Convex persistence creates task reviews from `analysis.tasks`.
- [x] Batch analysis can queue multiple works independently.
- [x] Shared KaTeX parsing/rendering is used for AI-generated text.
- [x] Architecture/PRD/README or plan checkboxes are updated where applicable.
- [x] Typecheck, lint, and relevant tests pass.

## Work Log

### 2026-05-22 - Start Implementation

**By:** Codex

**Actions:**
- Read `ce-work`, `file-todos`, project instructions, and the simplified pipeline plan.
- Confirmed current branch is `feat/streamline-dashboard-grading-flow` and continuing there as requested.

**Learnings:**
- The Convex AI action already operates on one work and resolves uploaded guide/work references server-side, so the main changes are schema/prompt/persistence/UI contract alignment rather than a brand-new orchestration path.

### 2026-05-22 - Complete Implementation

**By:** Codex

**Actions:**
- Replaced the strict AI output contract with `GradingAnalysis` and updated prompt, OpenAI, Convex, synthetic fixture, annotation, and UI call sites.
- Added batch analysis scheduling for uploaded works in a selected test.
- Added shared KaTeX validation/rendering and AI math normalization.
- Updated architecture, PRD, README, project instructions, and the source plan.
- Ran typecheck, lint, AI contract tests, and focused math/annotation Vitest tests.

**Learnings:**
- Keeping feedback language as app-owned request metadata lets the model draft in the requested language without reintroducing brittle model-produced language fields.
- Invalid KaTeX should be treated as a review concern and render-time fallback, not as a UI-crashing condition.
