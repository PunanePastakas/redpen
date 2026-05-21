---
title: "feat: Streamline Dashboard Grading Flow"
type: feat
status: active
date: 2026-05-21
related_plan: docs/plans/2026-05-21-001-feat-empty-state-live-grading-flow-plan.md
---

# feat: Streamline Dashboard Grading Flow

## Overview

Refine the authenticated RedPen teacher dashboard so the first-run, test setup, work upload/preview, analysis, review queue, and result actions read as one coherent grading workflow instead of several competing panels.

The desired experience is:

1. An authenticated teacher with no tests sees the whole dashboard in an empty state, with the create-test action anchored in the `Kontrolltööd` container.
2. Clicking create opens a modal test-creation form.
3. Once a test exists, its title, feedback language, and `hindamisjuhend` controls are edited inside the test area where the test appears, not in dashboard-level cards.
4. Student work upload and preview are merged into one tight middle-column surface. Before any work is uploaded, it shows only the upload action. After upload, it supports preview, selection, additional uploads, and easy reversible removal.
5. Analysis initiation, task review queue, student linking, confirmation, sharing, and mock export live together in the third column as the selected work's review/result rail.

This plan does not change the product model or the AI pipeline. It reorganizes the current live workbench around clearer state transitions and adds the minimal Convex support needed for reversible work/file removal.

## Research Summary

### Local Findings

- No relevant brainstorm document exists in `docs/brainstorms/`.
- No institutional learnings exist in `docs/solutions/`; there is no `critical-patterns.md` to inherit.
- `README.md` describes the current MVP as a dense teacher workbench that starts empty after login, then lets the teacher create a test, upload context, upload student work, run analysis, review/edit drafts, confirm results, share student links, and create mock exports.
- `docs/plans/2026-05-21-001-feat-empty-state-live-grading-flow-plan.md` is completed and already established the live Convex-backed empty-first flow. This plan is a UX simplification layer on top of that work.
- `components/workbench-shell.tsx` is the main implementation file and currently contains the full dashboard state machine, upload handlers, create-test form, work list, document preview, review queue, student linking, final result, sharing, and mock export.
- The authenticated no-tests state currently renders only `CreateTestPanel` in a narrow container, not the whole dashboard empty state requested here.
- Test creation currently appears inline in the `Kontrolltööd` card after toggling `showCreateTestForm`; it is not a modal.
- `CreateTestPanel` currently includes title, feedback language, and optional `hindamisjuhend` upload. The main dashboard also shows separate top cards for grading guide, selected student work, and feedback language, which creates the clutter this request aims to remove.
- `convex/tests.ts` already has `create` and `update`, so inline editing of test title/language can reuse existing mutations.
- `convex/uploads.ts` supports upload URL generation, upload recording, and listing by test/work. It has no archive/remove mutation yet.
- `convex/works.ts` supports creating works, listing by test, requesting analysis, confirming name matches, and applying AI drafts. It has no teacher-facing archive/remove/restore mutation yet.
- `components/document-viewer.tsx` already supports an empty preview state and real image/PDF/text previews. It can be reused inside a combined upload-preview surface.
- Existing tests are mostly library/contract tests under `tests/`. There are no browser or component tests for the dashboard UI, so the implementation should add focused React/browser coverage only if the existing test setup can support it without a large harness.

### External Research Decision

External research is not needed for this plan. The change is a product/UI composition refinement using existing Next.js, React, Tailwind, lucide-react, and Convex patterns already present in the repository. No new framework behavior, security model, payment flow, or external API integration is introduced.

## Problem Statement / Motivation

The live workbench is functional, but the dashboard still exposes setup and review controls as separate dashboard-level cards. This makes a new teacher decide where to look before there is any real work to review, and it keeps test metadata controls visible even when the teacher is focused on a selected student work.

The main usability problems are:

- The no-tests state exits the dashboard layout entirely, so it does not teach the teacher where tests, work upload, and review/result actions will live.
- Test creation is inline and expands inside the side rail, which works mechanically but is easy to lose among other controls.
- Test setup fields appear both during creation and as dashboard-level summary cards, so title/language/guide compete with the selected work preview.
- Work upload and work preview are separated, even though the teacher thinks of them as one object: "the work I just uploaded and need to inspect."
- The `Run analysis` action is in the middle content area while its output, review queue, and final result live in the right rail. That splits one decision flow across columns.
- Removing an accidentally uploaded file or work is not supported, so the upload flow is not comfortably reversible.

## Proposed Solution

Reshape the workbench into three persistent zones:

- Left rail: `Kontrolltööd` and selected-test setup.
- Middle workspace: selected work upload, selection, preview, additional uploads, and reversible removal.
- Right rail: selected work analysis, review queue, student linking, final result, share/export actions.

The authenticated no-tests state should still render these zones. The left rail shows an empty `Kontrolltööd` container with a primary create button. The middle and right zones show restrained empty placeholders with disabled or absent actions until a test exists, but no setup fields outside the test area.

Test creation should move to a modal. After a test is created, the test item/selected-test section becomes the only place where the teacher edits title, feedback language, and `hindamisjuhend`.

Work upload and preview should become one compact, stateful surface. With no works, the middle area shows only a clear upload target/button. With works, it shows selected work metadata, a compact work/file list or selector, the document preview, an add-files action, and a removal action with undo.

Analysis and result-related actions should move into the right rail. The right rail should answer, in order: can this work be analyzed, what drafts need review, what is ready to confirm, and what can be shared/exported?

## Scope

### In Scope

- Authenticated dashboard empty state with the same high-level columns used after data exists.
- Modal-based test creation.
- Selected-test editing inside the `Kontrolltööd` area.
- Moving title/language/`hindamisjuhend` controls out of dashboard-level cards.
- Merged work upload and preview surface.
- Additional upload and reversible removal affordances for uploaded works/files.
- Moving analysis initiation into the right review/result column.
- Clear disabled/empty/running/error states for the selected work.
- Minimal Convex mutations needed for work/file archive and restore.
- Focused tests for new pure helpers and backend mutations where practical.

### Out Of Scope

- New AI analysis behavior or prompt/schema changes.
- Phase 3b Azure/OpenAI provider hardening.
- A broad redesign of authentication, student routes, or compliance docs.
- New school/class/roster concepts.
- Full mobile-first redesign. The app remains desktop-first, with mobile readability preserved.
- Permanent hard deletion of raw uploaded files from storage as part of this UX change. Retention/deletion policy remains separate.

## User Flow Overview

### Flow 1: First Authenticated Visit With No Tests

1. Teacher signs in.
2. Dashboard renders with the left `Kontrolltööd` rail, middle work area, and right review/result rail.
3. `Kontrolltööd` shows an empty state and a primary create button.
4. Middle work area has no upload affordance until a test exists, or shows a disabled upload state explaining that a test is required.
5. Right rail shows no analysis/review/result actions.
6. Teacher clicks create.
7. Create-test modal opens.
8. Teacher enters title and optional setup fields, submits, and lands on the selected newly created test.

### Flow 2: Editing A Created Test

1. Teacher selects a test in `Kontrolltööd`.
2. The selected test item or adjacent selected-test detail area exposes title, feedback language, and `hindamisjuhend`.
3. Teacher edits title/language inline and saves.
4. Teacher uploads, adds, or removes grading guide files in the same selected-test area.
5. The main dashboard no longer renders separate title/language/guide cards.

### Flow 3: Uploading First Work

1. Teacher selects or creates a test.
2. Middle work area detects no student works.
3. It renders only the upload option.
4. Teacher uploads one or more JPG/PNG/PDF files.
5. Each uploaded work appears in the same middle surface and the most recent/newest work becomes selected.
6. Preview renders immediately when a previewable URL is available.
7. Right rail enables `Run analysis` for the selected uploaded work.

### Flow 4: Managing Uploaded Works

1. Teacher has one or more uploaded works.
2. Middle surface shows selected work preview plus compact controls for selecting another work, adding files, or removing the selected file/work.
3. Teacher removes an accidental upload.
4. UI hides the item immediately after the mutation succeeds and shows an undo action.
5. Teacher can undo within the current session/state window.
6. If the removed item was selected, selection moves to the next available work or returns to the first-upload empty state.

### Flow 5: Analysis, Review, And Result

1. Teacher selects a work in the middle surface.
2. Right rail shows analysis readiness and status.
3. Teacher runs analysis.
4. While running, right rail shows queued/running status and disables duplicate analysis.
5. When drafts exist, right rail shows review queue and selected task editor.
6. After all task reviews are handled, final result controls are enabled in the same rail.
7. Teacher links/creates a student, confirms the result, shares it, and optionally copies mock export from the same rail.

## Flow Permutations Matrix

| Area | Empty State | Active State | Error/Recovery State |
| --- | --- | --- | --- |
| Tests | No tests, create button in `Kontrolltööd` | Test list plus selected-test editor | Modal validation error, test update error, guide upload error |
| Work upload/preview | Selected test has no works, upload only | Work selector, preview, add files, remove with undo | Upload validation error, storage/metadata failure, removed selected item |
| Analysis/review/result | No selected work, no actions | Run analysis, review drafts, confirm/share/export | Analysis error with retry, blocked confirm/share reasons |
| Navigation | New teacher first run | Returning teacher with selected/first test | Selected IDs become stale after remove/archive |

## Technical Approach

### Component Structure

Keep the work localized to the dashboard area, but split `components/workbench-shell.tsx` into smaller private components or nearby files if the implementation starts fighting the current 900+ line component.

Suggested component boundaries:

- `components/workbench-shell.tsx`: data wiring, selected IDs, high-level layout.
- `components/create-test-modal.tsx`: modal wrapper and create form.
- `components/test-rail.tsx`: `Kontrolltööd`, no-tests empty state, selected-test editor, grading guide uploads.
- `components/work-upload-preview.tsx`: upload-only empty state, work selector, preview, add/remove/undo controls, `DocumentViewer` usage.
- `components/review-result-rail.tsx`: analysis button/status, review queue, task editor, student link, final result, share/export.

If the change remains small enough, these can start as internal functions in `workbench-shell.tsx`, but the plan should prefer extraction once the modal and rail state make the file hard to scan.

### Dashboard Layout

Use the same three-column shell for both no-tests and data-present states:

```tsx
// components/workbench-shell.tsx
<div className="mx-auto grid max-w-[1500px] gap-4 p-4 xl:grid-cols-[300px_minmax(0,1fr)_430px]">
  <TestRail ... />
  <WorkUploadPreview ... />
  <ReviewResultRail ... />
</div>
```

For `tests.length === 0`, avoid returning a separate narrow create panel. Instead:

- `TestRail` shows an empty `Kontrolltööd` state with create button.
- `WorkUploadPreview` shows a subdued state with no upload action or a disabled upload action until a test exists.
- `ReviewResultRail` shows a subdued state with no analysis/review/result actions.

### Create-Test Modal

Replace inline `showCreateTestForm` behavior with modal state:

- `isCreateTestModalOpen`
- `handleOpenCreateTestModal`
- `handleCloseCreateTestModal`
- `handleCreateTest`

Modal requirements:

- `role="dialog"` and `aria-modal="true"`.
- Labelled title.
- Close button and cancel button.
- Escape key and backdrop click close if there is no pending submit.
- Focus should move into the modal on open and return to the create button on close if practical.
- Preserve pending, success, and error handling from the current form.
- After successful create, close modal, select the new test, and keep the teacher in the full dashboard layout.

### Selected-Test Editing

Use existing `api.tests.update` for title and feedback language. Keep `hindamisjuhend` uploads as `uploadedFiles.role === "grading_context"` attached to the selected test.

Behavior:

- Test tile/list item shows compact title/status metadata.
- Selected test editor inside the `Kontrolltööd` section exposes:
  - title input or edit/save affordance;
  - feedback language segmented/select control;
  - grading guide file list;
  - add guide button;
  - remove guide button if removal support is added for test-level uploads.
- Remove the dashboard-level cards for `Hindamisjuhend / Grading guide`, `Student work`, and `Feedback language`.
- Keep upload status and errors visible near the action that caused them.

### Work Upload And Preview Surface

Middle column should own all work intake and file preview UI.

With no selected test:

- Render a quiet empty state.
- Do not offer a working upload action.

With selected test and no works:

- Render only the upload action/drop target.
- Avoid extra cards, counters, setup text, or result controls.

With one or more works:

- Render a compact header with selected work name/status and action buttons.
- Render a compact work selector/list only as much as needed to switch works.
- Render `DocumentViewer` directly below.
- Show add-file/add-work action next to the selected work controls.
- Show remove action for the selected work or selected uploaded file.
- Keep the UI tight by avoiding a separate work-upload card outside the preview surface.

Implementation detail:

```tsx
// components/work-upload-preview.tsx
if (!activeTestId) return <WorkPreviewEmpty reason="no_test" />
if (!works?.length) return <UploadOnlyState onUpload={openWorkInput} pending={uploading} />
return (
  <>
    <WorkPreviewToolbar ... />
    <DocumentViewer ... />
  </>
)
```

### Reversible Removal

Add minimal teacher-owned archive/restore behavior rather than hard deletion.

Preferred backend additions:

- `convex/works.ts`
  - `archive`: verifies teacher ownership, patches `studentWorks.status = "archived"`, `archivedAt`, `updatedAt`.
  - `restore`: verifies teacher ownership, clears `archivedAt`, sets a safe status such as `uploaded` unless there is an existing result/review state that should be preserved.
- `convex/uploads.ts`
  - `archive`: verifies ownership through `testId` or `studentWorkId`, patches `retentionState = "retained_by_policy"` or another existing non-active marker only if that aligns with retention semantics.
  - If upload-level archive would distort retention policy, skip upload-level removal for this plan and archive whole works only.
- `convex/works.listByTest` should exclude archived works by default.
- Consider an optional `includeArchived` arg for future admin/recovery views, but keep the dashboard query simple.

UI behavior:

- "Remove" should mean "remove from this active workflow," not permanent deletion.
- Show a short-lived undo action after archiving.
- Undo calls `works.restore`.
- If archiving is not possible for confirmed/shared works, disable remove with a clear title/tooltip.
- For already confirmed/shared works, prefer "archive from active list" only if the result remains accessible and audit semantics stay correct.

### Review And Result Rail

Move `runAnalysis` into the third column and make it contextual to the selected work.

Right rail order:

1. Analysis status/action:
   - disabled with reason when no work is selected;
   - enabled when selected work has uploaded files and is not running;
   - running status for `transcribing`, `mapped`, `drafted`;
   - retry action when status is `error`.
2. Review queue:
   - empty until `taskReviews` exist;
   - task list and selected task editor once drafts exist.
3. Student/result:
   - link/create student;
   - final feedback/grade/visibility controls;
   - confirm/share/open link/mock export.

This rail should be the only place where analysis and result-related actions appear.

### State And Selection Rules

- When a test is selected, clear selected work, selected review, result draft, latest result ID, and share link unless the selected work still belongs to the new test.
- When a work is removed, select the next visible work if available; otherwise return to no-works upload-only state.
- When a new work is uploaded, select it and clear `latestResultId`/`shareLink`.
- When analysis starts, keep the selected work stable.
- When task reviews change, selected review should remain if it still exists; otherwise choose the first review.

## System-Wide Impact

### Interaction Graph

Teacher opens dashboard -> `api.tests.list` loads tests -> selected test drives `uploads.listByTest` and `works.listByTest` -> selected work drives `uploads.listByWork`, `reviews.listByWork`, `results.getByWork`, and `results.mockExport`.

Teacher creates a test -> `tests.create` writes `tests` -> dashboard query refreshes -> modal closes -> selected test state updates -> middle/right rails leave no-test empty states.

Teacher edits selected test -> `tests.update` patches title/language/metadata -> test rail refreshes -> confirmation feedback language uses updated selected test.

Teacher uploads work -> `works.create` writes `studentWorks` -> browser uploads file to Convex storage -> `uploads.recordUploadedFile` writes `uploadedFiles` -> middle preview selects new work -> right rail enables analysis.

Teacher archives/removes work -> `works.archive` patches `studentWorks` -> `works.listByTest` no longer returns it -> selection recalculates -> undo can call `works.restore`.

Teacher runs analysis -> `works.requestAnalysis` validates ownership and uploads -> schedules `aiActions.analyzeWorkInternal` -> action writes `aiAttempts`, patches work status, inserts `taskReviews` -> right rail shows drafts/result flow.

### Error & Failure Propagation

- Create/update test errors should appear in the modal or selected-test editor, not as unrelated global dashboard messages.
- Guide/work upload validation errors should appear near the upload control.
- Storage upload success plus metadata failure can still create orphaned storage content; this plan should not worsen that existing risk. If touched, document a cleanup follow-up.
- Work archive errors should leave the work visible and show an inline error.
- Undo failure should restore no local optimistic state unless the backend confirms restore.
- Analysis errors remain on `studentWorks.error` and should be visible in the right rail with retry.

### State Lifecycle Risks

- Archiving a work with existing task reviews or a confirmed/shared result can hide data that still matters. Decide whether remove is disabled for confirmed/shared works or only removes from the active queue while preserving result access.
- Upload-level archive may conflict with retention policy semantics. Prefer work-level archive for the MVP unless upload-level removal is clearly needed.
- Moving run analysis into the right rail should not change `works.requestAnalysis` ownership checks or scheduling.
- Editing feedback language after drafts exist may not automatically re-run analysis or translate existing drafts. The UI should make language changes a test-level setting for future confirmation and analysis; re-analysis remains explicit.

### API Surface Parity

The dashboard is the only teacher-facing surface for these actions today. Convex mutations must remain teacher-owned and should not expose client-provided teacher IDs.

If new archive/restore mutations are added, they should follow the same ownership pattern as:

- `convex/tests.ts:update`
- `convex/works.ts:requestAnalysis`
- `convex/uploads.ts:recordUploadedFile`
- `convex/results.ts:confirm`

### Integration Test Scenarios

- New authenticated teacher with zero tests sees the three-zone dashboard, opens create modal, creates a test, and lands on that selected test.
- Teacher edits title/language in the test rail, reloads, and sees persisted values.
- Teacher uploads first work from the middle upload-only state and sees the preview replace the upload-only state.
- Teacher uploads two works, removes the selected one, and selection moves predictably; undo restores it.
- Teacher runs analysis from the right rail and sees review queue/result controls in the same rail.
- Teacher cannot remove or gets a safe archive behavior for confirmed/shared work according to the chosen policy.

## Acceptance Criteria

### Functional Requirements

- [x] Authenticated no-tests state renders the full dashboard layout instead of the standalone create panel.
- [x] The `Kontrolltööd` container includes the create-test button in no-tests and tests-present states.
- [x] Clicking create opens a modal; the create form no longer expands inline in the left rail.
- [x] Modal create success closes the modal, selects the new test, and keeps the teacher in the dashboard.
- [x] Created/selected test title can be edited in the `Kontrolltööd` area using `api.tests.update`.
- [x] Feedback language can be edited in the selected-test area and no longer appears as a dashboard-level summary card.
- [x] `Hindamisjuhend` upload/list controls live only in the selected-test area and no longer appear as a middle dashboard card.
- [x] The separate top cards for grading guide, selected student work, and feedback language are removed.
- [x] With a selected test and no works, the middle area displays only the work upload option.
- [x] After the first work upload, the same middle area displays selected work preview, compact work selection, add upload, and remove action.
- [x] Removing a work/file is clear, reversible with undo, and does not hard-delete storage content in this plan.
- [x] Analysis initiation appears in the third column with review queue/result controls, not in the middle preview area.
- [x] Review queue, task editor, student link, final result, share link, and mock export remain functional after the layout move.
- [x] Running/error states for analysis are still visible and retryable.
- [x] Selection state stays valid when tests change, works are uploaded, or works are removed/restored.

### Non-Functional Requirements

- [x] Controls remain keyboard accessible, including modal open/close and icon buttons with labels/titles.
- [x] The dashboard remains desktop-first and does not overlap at common laptop widths.
- [x] No UI cards are nested inside other UI cards.
- [x] Text fits inside buttons and compact controls at mobile and desktop widths.
- [x] The color palette stays consistent with existing RedPen styling and does not introduce a new theme.
- [x] No synthetic data is introduced into authenticated dashboard states.

### Quality Gates

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test`
- [x] Add or update unit tests for any new archive/restore or selection helper logic.
- [x] If feasible without a large test harness, add a browser/component test for modal creation and upload-only empty state. Existing tests do not include a component/browser harness, so this was covered by unit tests plus browser smoke instead.
- [ ] Manually smoke test authenticated states: no tests, test created/no works, first work uploaded, multiple works, removed/undo, analysis error/running/review, confirmed/shared.

## Implementation Plan

### Phase 1: Layout State And Modal Creation

Tasks:

- Update `components/workbench-shell.tsx` so `tests.length === 0` returns the same three-column dashboard shell.
- Replace inline `showCreateTestForm` rendering with modal state.
- Extract or create `CreateTestModal` using the existing `CreateTestPanel` form logic.
- Ensure create success selects the created test and resets modal state.

Success criteria:

- New authenticated teachers see the full dashboard empty state.
- Create-test action is anchored in `Kontrolltööd` and opens a modal.

### Phase 2: Test Rail Owns Test Setup

Tasks:

- Add selected-test editing UI in the `Kontrolltööd` rail.
- Wire title and feedback language changes to `api.tests.update`.
- Move grading guide upload/list from the main middle card into the selected-test rail.
- Remove the top dashboard cards for grading guide, student work, and feedback language.
- Keep upload errors near the guide upload action.

Success criteria:

- Title/language/guide exist only in the test rail.
- Main dashboard no longer carries test metadata clutter.

### Phase 3: Merge Work Upload And Preview

Tasks:

- Create or extract `WorkUploadPreview`.
- Move work upload input/action from the left `Tööd` card into the middle preview surface.
- With no works, render upload-only state.
- With works, render selected work selector/header, `DocumentViewer`, add upload, and remove action.
- Preserve current upload validation and selected-work behavior.

Success criteria:

- Uploading the first work immediately transitions the middle area from upload-only to preview.
- Additional uploads and work selection remain compact and obvious.

### Phase 4: Reversible Work Removal

Tasks:

- Add `works.archive` and `works.restore` mutations in `convex/works.ts`.
- Update `works.listByTest` to exclude archived works by default.
- Decide whether confirmed/shared works can be archived; encode that rule in the mutation and UI disabled state.
- Add UI remove/undo behavior in `WorkUploadPreview`.
- Update generated Convex types if required by the local Convex workflow.

Success criteria:

- A teacher can remove an accidental uploaded work from the active workflow.
- Undo restores the work.
- No hard storage deletion is introduced.

### Phase 5: Move Analysis Into Review/Result Rail

Tasks:

- Move `runAnalysis` button and status messaging to the third column.
- Combine analysis readiness, review queue, selected task editor, student link, final result, share, open link, and mock export in one right rail component.
- Remove analysis actions from the middle preview surface.
- Ensure disabled states explain missing selected work, running analysis, missing reviews, missing linked student, and missing final feedback.

Success criteria:

- The third column owns everything analysis/review/result-related.
- Existing confirmation, share, and mock export behavior still works.

### Phase 6: Verification And Polish

Tasks:

- Run `npm run typecheck`, `npm run lint`, and `npm test`.
- Manually verify empty and populated states with Convex configured.
- Check responsive behavior at desktop and narrow widths.
- Inspect modal keyboard/focus behavior.
- Update `README.md` only if the documented workbench behavior becomes materially more specific.

Success criteria:

- Quality checks pass.
- Dashboard reads as a simpler three-zone workflow.
- No Node-backed local process remains running after verification unless explicitly requested.

## Dependencies & Risks

- Convex generated API types may need regeneration after adding archive/restore mutations.
- The current dashboard is a large client component, so moving controls may create state coupling bugs unless selection reset rules are made explicit.
- Upload removal semantics must not imply permanent deletion when retention policy still owns storage cleanup.
- Editing feedback language after AI drafts exist could confuse teachers if existing drafts remain in the old language. Prefer explicit copy: language applies to future analysis/confirmation unless the teacher re-runs analysis.
- Browser/component testing may require setup that does not currently exist. Do not introduce a large testing stack just for this refinement unless the project already supports it cleanly.

## Open Questions

- Should "remove" be allowed for works that already have confirmed/shared results, or should those be locked from removal and only archival happen in a later management view?
- Should `hindamisjuhend` support removing individual guide files in this plan, or is adding/listing guide files enough for the simplification request?
- Should uploading multiple files create multiple works as it does today, or should the middle surface make it clearer when multiple files belong to one student work versus separate student works?

Reasonable defaults if unanswered:

- Disable removal for confirmed/shared works.
- Support guide upload/listing now; defer individual guide removal unless upload-level archive is straightforward.
- Preserve the current behavior where each uploaded file creates a separate `studentWorks` record.

## Sources & References

- [components/workbench-shell.tsx](/Users/andrius/Projects/redpen/components/workbench-shell.tsx): current dashboard, create form, upload handlers, review/result rail, and selection state.
- [components/document-viewer.tsx](/Users/andrius/Projects/redpen/components/document-viewer.tsx): existing preview component and empty preview state.
- [convex/tests.ts](/Users/andrius/Projects/redpen/convex/tests.ts): existing `create` and `update` mutations for selected-test editing.
- [convex/uploads.ts](/Users/andrius/Projects/redpen/convex/uploads.ts): upload generation, recording, and list queries.
- [convex/works.ts](/Users/andrius/Projects/redpen/convex/works.ts): work creation/listing, analysis request, and draft application.
- [convex/results.ts](/Users/andrius/Projects/redpen/convex/results.ts): confirm/share/mock export behavior that should remain in the right rail.
- [README.md](/Users/andrius/Projects/redpen/README.md): current MVP behavior and quality commands.
- [docs/prd/mvp-prd.md](/Users/andrius/Projects/redpen/docs/prd/mvp-prd.md): product requirements for test creation, upload, AI analysis, teacher review, and final result.
- [docs/architecture/system-model.md](/Users/andrius/Projects/redpen/docs/architecture/system-model.md): teacher-owned data model and dashboard responsibility.
- [docs/plans/2026-05-21-001-feat-empty-state-live-grading-flow-plan.md](/Users/andrius/Projects/redpen/docs/plans/2026-05-21-001-feat-empty-state-live-grading-flow-plan.md): completed live-flow foundation for this refinement.
