---
title: "feat: Create PunanePastakas-Inspired Design System"
type: feat
status: completed
date: 2026-05-22
---

# feat: Create PunanePastakas-Inspired Design System

## Overview

Create a RedPen design system that makes the application feel like a mature sibling of PunanePastakas: dense, paper-oriented, teacher-controlled, and unmistakably about marking mathematics work. The design system should borrow PunanePastakas motifs such as paper grids, ink borders, correction red, brass warning accents, hard offset shadows, compact icon controls, and review-workbench composition, while preserving RedPen's current MVP product boundary, live empty-first behavior, warm olive primary actions, privacy posture, and student-facing restraint.

This is a design-system and migration plan. It does not change Convex schema, AI prompts, student access, file retention, or grading workflow semantics.

## Research Summary

### Brainstorm Check

- No relevant brainstorm document exists in `docs/brainstorms/`.
- The feature description is clear enough to proceed: create a RedPen design system using motifs and elements from the local `~/Projects/PunanePastakas` repository.

### RedPen Repository Findings

- `AGENTS.md:108` defines the RedPen UI as desktop-first, dense, and operational. It also requires warm off-white backgrounds, white surfaces, green/teal primary actions, red annotation/error accents, lucide icon buttons, empty-first authenticated state, workflow-specific disabled states, and student-facing AI transparency without drafts. This plan should satisfy the warmer green side of that constraint by replacing teal with an olive primary.
- `app/globals.css:4` currently defines only a small token set: `--background`, `--foreground`, `--surface`, `--muted`, `--border`, `--accent`, `--accent-strong`, `--warning`, and `--danger`. These are useful but not yet a full design system.
- `components/workbench-shell.tsx:536` already uses the three-zone dashboard shape from the active streamline-dashboard plan: left test rail, middle work upload/preview workspace, and right analysis/review/result rail.
- `components/workbench-shell.tsx:538` through `components/workbench-shell.tsx:760` contains many repeated inline hex values, rounded panels, buttons, empty states, status colors, and selected-item styles. These are the main migration target.
- `components/document-viewer.tsx:27` uses a soft rounded viewer with a light gray preview background. This should become the strongest "paper-on-desk" surface in the design system.
- `components/annotation-canvas.tsx` already uses RedPen correction red for annotation rendering and should keep filtered, geometry-checked annotation targets.
- `components/status-pill.tsx`, `components/ai-transparency-marker.tsx`, `components/auth-panel.tsx`, `components/student-result-view.tsx`, and `components/global-navbar.tsx` contain reusable design concepts but encode styling locally rather than through shared primitives.
- The app uses Next.js 16, React 19, Tailwind CSS 4, lucide-react, Convex, KaTeX, and Excalidraw-compatible dependencies in `package.json`.
- The worktree already has active uncommitted work for dashboard streamlining and AI-pipeline simplification. This plan should be implemented after or alongside those changes carefully, without reverting unrelated edits.

### PunanePastakas Reference Findings

- `~/Projects/PunanePastakas/AGENTS.md:100` documents a complete visual system: functional teacher workbench, cream paper grid, ink text/borders, paper panels, correction red, brass warnings, slate-blue restraint, square corners, hard offset shadows, Source Sans 3 plus Fraunces, lucide icons, dense task-review layout, and no nested cards.
- `~/Projects/PunanePastakas/app/globals.css:14` applies the notebook-grid body background with low-opacity ink lines and paper cream.
- `~/Projects/PunanePastakas/tailwind.config.ts:7` defines the important named colors: `ink`, `paper`, `correction`, `brass`, and `slateblue`.
- `~/Projects/PunanePastakas/components/app-sidebar.tsx` demonstrates the strongest brand motif: black ink border, red correction stripe, hard shadow, square navigation tiles, numbered navigation, and compact teacher-workbench language.
- `~/Projects/PunanePastakas/components/ai-guidance-panel.tsx` shows the most relevant review-card pattern: red-tinted correction summary, brass uncertainty block, uppercase micro-labels, compact badges, and dense math feedback.
- `~/Projects/PunanePastakas/components/annotation-canvas.tsx` shows how correction-red annotation tooling can feel like a real red pen: icon toolbar, active red tool state, red AI mark badge, and white paper canvas.
- PunanePastakas' broader crop-first architecture is not a design requirement for RedPen. RedPen should borrow the visual/workbench motifs, not the prototype's access-token model, eKool mock, crop pipeline, or broader prototype assumptions.

### Institutional Learnings

- RedPen does not currently have `docs/solutions/` or `docs/solutions/patterns/critical-patterns.md`, so there are no local learnings to carry forward.
- PunanePastakas has one documented integration learning about mixed file analysis, but it is implementation-oriented rather than visual-system-specific. Its prevention advice still reinforces schema-validated UI boundaries and fixture-based smoke tests.

### External Research Decision

External research is not needed for this plan. The design target is defined by two local repositories, and the implementation should use RedPen's existing Next.js, React, Tailwind, lucide-react, and Convex patterns. No new external service, security model, payment flow, or library migration is introduced.

## Problem Statement

RedPen's current UI is functional and live-first, but its visual language is still mostly a collection of local Tailwind classes. The result is softer and more generic than the product idea deserves:

- Repeated raw hex values make it hard to evolve the palette consistently.
- Rounded cards and soft shadows dilute the red-pen-on-paper grading metaphor.
- Status pills, empty states, modals, buttons, panels, and document surfaces do not yet share a strong component grammar.
- The document viewer and annotation layer are not visually central enough, even though they are the teacher's closest equivalent to a physical paper.
- Student-facing views need the same trustworthy RedPen identity, but with less teacher-workbench density and no hidden draft context.

The goal is not to copy PunanePastakas pixel-for-pixel. RedPen is now a live authenticated product with teacher-owned tests, student entities, invite-token sharing, EU/privacy guardrails, and a simplified whole-work AI pipeline. The design system should translate the useful PunanePastakas motifs into RedPen's narrower MVP.

## Proposed Solution

Build a small first-party design system around CSS tokens, reusable React primitives, and a staged migration of existing surfaces.

The system should define:

- **Tokens** in `app/globals.css`: color, typography, radius, shadow, border, focus, paper-grid, and status variables.
- **Primitives** in `components/ui/`: buttons, icon buttons, panels, panel headers, status badges, fields, select/segmented controls, modal shell, empty state, file dropzone, toolbar, notice, and progress/step indicators.
- **Workbench patterns** for the test rail, upload/preview workspace, review/result rail, document viewer, annotation toolbar, AI transparency blocks, and student result page.
- **Documentation** in `docs/design-system/redpen-design-system.md` with motif translation rules, examples, accessibility rules, and migration guidance.
- **Migration guardrails** that keep RedPen empty-first, teacher-confirmed, workflow-specific, privacy-aware, and desktop-first.

## Motif Translation

| PunanePastakas motif | RedPen adaptation |
| --- | --- |
| Cream paper body with subtle grid | Keep RedPen warm off-white base, add a very subtle notebook-grid layer through tokens so the app feels like a desk surface without becoming decorative. |
| Ink `#111111` borders and hard shadows | Use ink borders and hard offset shadows for primary workbench panels, selected items, modals, and document containers; keep low-risk secondary surfaces quieter. |
| Correction red `#b91c1c` | Use for annotations, destructive actions, errors, active correction tools, and AI-review emphasis. Do not make every primary CTA red. |
| Primary action color | Replace the current teal with a warm olive primary for creation, upload, run, confirm, share, and setup actions. It should feel at home with paper, ink, correction red, and brass while keeping red reserved for correction, destructive, and error states. |
| Brass warning `#b78339` | Add as the standard uncertainty/rubric/check-this color for AI review flags, partial confidence, guide warnings, and non-blocking caution states. |
| Square corners and hard workbench panels | Reduce existing `rounded-lg`/`rounded-md` usage to square or near-square radii for functional panels and controls, while keeping tiny radii only where they improve touch/focus affordance. |
| Source Sans 3 plus Fraunces | Use Source Sans 3 for dense UI and a restrained display serif for brand/page headings. If font loading is deferred, create the token contract first and use system fallbacks. |
| Red correction stripe/sidebar | Use a thin correction stripe on the app frame, selected workbench panels, or important review sections. Do not introduce PunanePastakas' full route sidebar unless it improves the RedPen workflow. |
| Excalidraw red-pen toolbar | Apply the toolbar grammar to RedPen's document viewer and future annotation controls: icon-first, labelled with `title`/`aria-label`, stable dimensions, red active tool state. |
| Dense task-review guidance cards | Use compact red/brass/ink review blocks for AI draft, rationale, flags, and teacher decision states in the right rail. |

## User Flow Overview

### Flow 1: Authenticated Teacher First Run

1. Teacher signs in.
2. RedPen renders the three-zone workbench with the new app frame and paper-grid background.
3. The left test rail uses the new panel, empty-state, and button primitives.
4. Middle and right zones remain empty/disabled until a test exists.
5. The teacher sees a stronger RedPen identity without any synthetic tests, students, works, or links.

### Flow 2: Test Setup And Upload

1. Teacher creates or selects a test.
2. Test rail uses shared fields, segmented language control, file-list rows, and modal primitives.
3. Middle workspace uses a file dropzone/upload primitive and compact work-selector tiles.
4. Upload and validation states use consistent danger/warning/success treatments.

### Flow 3: Analysis And Review

1. Teacher runs analysis from the right rail.
2. Running, retry, draft, needs-review, confirmed, shared, and error states use one status-badge grammar.
3. AI draft review uses an AI transparency notice, red correction summary, brass uncertainty blocks, and compact teacher controls.
4. Annotation targets continue to render only after existing geometry self-checks pass.

### Flow 4: Student Shared Result

1. Student opens an invite-token result page.
2. The page shares RedPen's paper/ink identity but drops dense teacher-only controls.
3. It emphasizes teacher confirmation and AI transparency.
4. It never exposes unconfirmed drafts, hidden teacher notes, raw AI internals, or unrelated work.

### Flow 5: Developer Adds A New UI Surface

1. Developer chooses from documented tokens and primitives.
2. New UI avoids raw hex values and ad hoc button/card variants.
3. The component follows the documented accessibility, state, and layout rules.
4. Typecheck, lint, focused tests, build, and visual smoke checks remain the quality gate.

## Flow Permutations Matrix

| Surface | Empty/First State | Active State | Error/Recovery State |
| --- | --- | --- | --- |
| App frame | Setup required, auth loading, unauthenticated, no tests | Authenticated workbench and student result | Missing Convex config, auth errors |
| Test rail | No tests, create action | Test list, selected test metadata, guide controls | Create/update/upload failure |
| Work preview | No selected test, no works, loading works | Work selector, upload controls, document viewer | Invalid file, upload failure, removed/archived work |
| Review rail | No selected work, no drafts | Analysis, review queue, final result, share/export | Analysis error, blocked confirm/share, retry |
| Student result | Loading invite, shared result | Confirmed teacher feedback | Expired/invalid token, archived/unshared result |
| Developer workflow | No primitive for need yet | Reuse primitive and token | Document new primitive or justify exception |

## SpecFlow Analysis

### Missing Elements & Gaps

- **Design-token ownership**: RedPen currently has CSS variables but no explicit token taxonomy. The implementation must define which values are stable product tokens versus one-off component internals.
- **Motif intensity**: PunanePastakas is intentionally strong: square corners, hard shadows, black ink, and correction red. RedPen should adopt the motif at a production-workbench intensity, not a hackathon prototype intensity.
- **Font loading**: Adding Source Sans 3/Fraunces changes app layout metrics. Implementation should verify long Estonian and English labels in buttons, panels, and mobile widths.
- **Component extraction order**: `components/workbench-shell.tsx` is large and actively changing. Implementation should extract primitives first, then migrate surfaces one by one to avoid mixing visual refactor with workflow logic.
- **Student-facing density**: Student result pages should feel related to the teacher workbench but calmer and more readable.
- **Visual testing**: The repo does not currently have a dedicated browser screenshot test harness. The implementation should at least run a local browser smoke check and capture manual screenshots for key states when practical.

### Assumptions

- RedPen uses warm olive as the main action color and uses correction red as the grading/annotation/error color.
- No Storybook or external component library is added for the first pass.
- The design system starts as plain React components plus CSS variables, not a package or separate workspace.
- The first migration targets the existing app surfaces, not future school/class/admin features that are outside the MVP.

### Recommended Next Steps From SpecFlow

- Define token names before changing component styling.
- Migrate one surface at a time and verify that workflow state behavior is unchanged.
- Include accessibility and responsive checks in acceptance criteria.
- Document the "adapt PunanePastakas, do not clone it" rule prominently.

## Technical Approach

### Design Tokens

Update `app/globals.css` to expand the current variables into a small named system:

```css
/* app/globals.css */
:root {
  --rp-paper: #f6f8f5;
  --rp-paper-warm: #f7f2ea;
  --rp-paper-grid: rgba(17, 17, 17, 0.028);
  --rp-ink: #111111;
  --rp-text: #15201b;
  --rp-muted: #647067;
  --rp-surface: #ffffff;
  --rp-surface-warm: #fffaf2;
  --rp-border: #dbe2dc;
  --rp-primary: #53622f;
  --rp-primary-strong: #3f4b24;
  --rp-correction: #b91c1c;
  --rp-brass: #b78339;
  --rp-success: #047857;
  --rp-shadow-ink: 6px 6px 0 #111111;
  --rp-shadow-correction: 5px 5px 0 #b91c1c;
  --rp-radius-panel: 2px;
  --rp-radius-control: 3px;
}
```

Implementation should tune exact values against the live UI. The important requirement is that component code refers to stable tokens or documented Tailwind token aliases rather than scattering raw hex colors.

### Component Primitives

Create a focused primitive layer:

```text
components/ui/button.tsx
components/ui/icon-button.tsx
components/ui/panel.tsx
components/ui/status-badge.tsx
components/ui/notice.tsx
components/ui/field.tsx
components/ui/select.tsx
components/ui/segmented-control.tsx
components/ui/modal.tsx
components/ui/empty-state.tsx
components/ui/file-dropzone.tsx
components/ui/toolbar.tsx
components/ui/progress-steps.tsx
```

Primitive rules:

- No hidden Convex or workflow behavior inside primitives.
- Accept `className` only for layout escape hatches, not for redefining core variants.
- Button variants should cover `primary`, `secondary`, `ink`, `danger`, `ghost`, and `tool`.
- Panel variants should cover `default`, `selected`, `paper`, `warning`, `danger`, and `success`.
- Icon-only buttons must require `aria-label` and should support `title`.
- Controls should have stable dimensions so icons, loading spinners, and labels do not shift layout.

### App Frame And Typography

Update `app/layout.tsx` and `app/globals.css` to support a RedPen app frame:

- Keep `html lang="et"`.
- Use a self-hosted Next font path or system fallback strategy for Source Sans 3 and a restrained display serif.
- Apply a subtle paper-grid background through `body`, using lower intensity than PunanePastakas if needed.
- Keep global letter spacing at `0`.
- Add a `font-display` utility for headings/brand moments only.
- Preserve setup-required UI when `NEXT_PUBLIC_CONVEX_URL` is missing.

### Workbench Migration

Migrate the workbench without changing data flow:

- `components/global-navbar.tsx`: adopt ink/paper header treatment, RedPen wordmark, correction accent, and shared auth button styles.
- `components/workbench-shell.tsx`: replace inline panel/button/status classes with primitives while preserving selection, upload, analysis, review, result, share, and undo logic.
- `components/status-pill.tsx`: replace local status color branching with `StatusBadge` variants and RedPen status tokens.
- `components/ai-transparency-marker.tsx`: convert to `Notice`/`Badge` primitives with AI-specific copy and icon.
- `components/document-viewer.tsx`: make the document surface the primary paper object: ink border, paper desk background, stable toolbar, red annotation emphasis, and less soft card styling.
- `components/annotation-canvas.tsx`: keep existing geometry filtering and correction-red SVG rendering; only align colors/stroke semantics with tokens.
- `components/auth-panel.tsx`: apply shared fields/buttons while preserving Convex Auth behavior.
- `components/student-result-view.tsx`: use calmer paper/ink panels and AI transparency without teacher-only density.

### Documentation

Add `docs/design-system/redpen-design-system.md` containing:

- Token table with intended uses.
- Motif translation from PunanePastakas to RedPen.
- Component inventory and examples.
- Accessibility rules for focus, contrast, icon labels, disabled actions, and touch targets.
- Workflow-state styling rules for setup, upload, analysis, review, confirmation, sharing, student view, and errors.
- "Do not" examples: decorative nested cards, fake data, autonomous grading language, broad school/admin concepts, raw student data in screenshots, and raw hex in migrated components.

## Implementation Phases

### Phase 1: Token And Documentation Foundation

- Add design-token definitions to `app/globals.css`.
- Decide and document font strategy in `app/layout.tsx` and the design-system doc.
- Add `docs/design-system/redpen-design-system.md`.
- Document which PunanePastakas motifs are adopted, softened, or rejected.
- Keep UI behavior unchanged in this phase.

Acceptance:

- [x] Token names cover paper, ink, surface, muted text, border, warm olive action, correction red, brass warning, success, danger, radii, shadows, and focus rings.
- [x] Body background can support a subtle paper grid without hurting setup/auth/empty states.
- [x] Design-system doc explains that RedPen uses warm olive primary actions and red for correction/error.
- [x] No Convex, AI, schema, or workflow behavior changes are included.

### Phase 2: Primitive Components

- Add the `components/ui/` primitives listed above.
- Migrate `StatusPill` to the new status badge primitive or replace it.
- Migrate `AITransparencyMarker` to the new notice/badge primitive or wrap it.
- Add small pure tests only if primitives include nontrivial variant logic.

Acceptance:

- [x] Button variants have consistent disabled/loading/focus styles.
- [x] Icon-only controls require accessible labels at call sites.
- [x] Panel, notice, badge, field, and modal primitives cover existing RedPen states.
- [x] Primitives do not import Convex APIs or domain-specific workflow code.

### Phase 3: Workbench Surface Migration

- Migrate `GlobalNavbar`, unauthenticated/setup states, test rail, work upload/preview surface, review/result rail, and modals to primitives.
- Keep `docs/plans/2026-05-21-002-feat-streamline-dashboard-grading-flow-plan.md` as the workflow source of truth while changing visual styling.
- Preserve the live empty-first experience and all existing state-specific disabled actions.
- Replace repeated raw hex values in migrated sections with tokens or primitives.

Acceptance:

- [x] Authenticated no-tests state still renders without synthetic tests/students/works.
- [x] The three-zone workbench remains intact.
- [x] Create/edit test, upload guide, upload work, remove/restore work, run analysis, review drafts, confirm result, share, and mock export flows keep their current behavior.
- [x] Visual treatment now uses paper grid, ink borders, restrained hard shadows, warm olive actions, correction red, and brass warning states.
- [x] No cards are nested inside decorative cards.

### Phase 4: Document, Annotation, And AI Review Polish

- Migrate `DocumentViewer` to the paper-on-desk motif.
- Align annotation colors and selection emphasis with correction tokens.
- Refine AI draft/review display using red correction and brass uncertainty blocks.
- Ensure `MathText` output remains readable inside redesigned panels.
- Keep annotation filtering through `lib/annotation-geometry.ts`.

Acceptance:

- [x] Image/PDF/text preview states fit the new visual system and remain usable at desktop and narrow widths.
- [x] Annotation targets render with correction-red affordance and selected-state emphasis.
- [x] AI-generated content remains clearly marked as teacher-reviewable draft content.
- [x] Invalid or missing preview files use design-system error/empty states.

### Phase 5: Student-Facing And Accessibility Pass

- Migrate `StudentResultView` to the calmer student-facing version of the system.
- Verify that shared results still show only confirmed teacher-shared content.
- Check contrast, focus indicators, keyboard modal behavior, icon labels, disabled states, and text wrapping.
- Add or update targeted tests where behavior is affected.

Acceptance:

- [x] Student result page uses RedPen identity without exposing drafts or hidden teacher context.
- [x] Focus rings are visible against paper, white, red, warm olive, and brass surfaces.
- [x] Long Estonian and English text does not overflow buttons, status badges, panels, or mobile layouts.
- [x] Reduced viewport widths remain readable with wrapping toolbars and stable controls.

## Alternative Approaches Considered

### Copy PunanePastakas Styling Directly

Rejected. PunanePastakas is a prototype with a stronger hackathon visual style, a route sidebar, crop-first flow, access-token persistence, and an eKool mock. RedPen needs a live authenticated MVP design system that borrows the best motifs without importing unrelated product assumptions.

### Cosmetic Refresh Without Primitives

Rejected. Replacing hex values inline would be fast but would leave the same maintenance problem. The point of this plan is to make future UI work easier and more consistent.

### Add A Third-Party Component Library

Rejected for the first pass. RedPen already has a small surface area, strong local motifs, Tailwind CSS, and lucide-react. A third-party design library would likely fight the paper/ink/correction-red workbench language.

### Add Storybook Immediately

Deferred. Storybook or a component gallery could be useful later, but the MVP need is a grounded design system in the app and docs. A lightweight internal examples route can be considered later if component drift becomes a problem.

## System-Wide Impact

### Interaction Graph

- `app/layout.tsx` and `app/globals.css` define global typography, body background, and tokens.
- `components/ui/*` provides visual primitives.
- `components/global-navbar.tsx`, `components/auth-panel.tsx`, `components/workbench-shell.tsx`, `components/document-viewer.tsx`, `components/status-pill.tsx`, `components/ai-transparency-marker.tsx`, and `components/student-result-view.tsx` consume primitives.
- Convex queries/mutations/actions remain unchanged.
- AI schema, prompt, provider, and persistence code remain unchanged.

### Error & Failure Propagation

- UI errors should continue to be surfaced near the action that caused them.
- Design primitives should make error/warning/success states more consistent, not swallow errors or replace workflow messages with generic copy.
- Modal and upload styling changes must preserve existing pending/error handling.

### State Lifecycle Risks

- Visual refactors can accidentally hide disabled reasons, undo affordances, or confirmation requirements. Each migrated surface must be checked against the current workflow states.
- Styling changes to `DocumentViewer` can affect annotation overlay alignment if image sizing changes. Keep image sizing and overlay positioning behavior stable.
- Font changes can shift text and cause overflow. Verify dense controls after typography updates.

### API Surface Parity

- Teacher workbench and student shared result should both use the same tokens, but not the same density.
- Status semantics should stay aligned with Convex validators:
  - `studentWorks.status`
  - `taskReviews.status`
  - `studentResults.status`
  - `uploadedFiles.retentionState`
- AI transparency markers should stay available in both teacher and student contexts.

### Integration Test Scenarios

- Authenticated teacher with no tests sees the new app frame, empty test rail, disabled upload/review zones, and no fake data.
- Teacher creates a test, uploads a guide, uploads a work, removes/restores it, and sees all states with consistent styling.
- Teacher runs analysis with mock provider or existing configured local flow and reviews task drafts without layout overlap.
- Teacher confirms and shares a result; student invite page shows only confirmed shared content with the new student-facing visual system.
- Missing Convex config still shows setup-required UI and does not use synthetic data.

## Acceptance Criteria

### Functional Requirements

- [x] A documented RedPen design system exists in `docs/design-system/redpen-design-system.md`.
- [x] `app/globals.css` exposes stable RedPen design tokens inspired by PunanePastakas and compatible with existing RedPen palette requirements.
- [x] Shared UI primitives exist under `components/ui/` and cover buttons, icon buttons, panels, notices, badges, fields, modals, empty states, upload/dropzone, toolbar, and progress/status patterns.
- [x] Core teacher workbench surfaces use the primitives instead of repeating local hex-heavy class strings.
- [x] Student result view uses the design system without exposing teacher-only workflow density.
- [x] The design system preserves empty-first runtime behavior and all teacher-confirmation boundaries.

### Non-Functional Requirements

- [x] No new runtime dependency is added unless implementation discovers a clear need and documents it.
- [x] No new schema, Convex API, AI prompt, or provider behavior is introduced.
- [x] Accessibility is maintained or improved for keyboard focus, labels, contrast, disabled states, and reduced-width layouts.
- [x] Visual changes do not cause document preview or annotation overlay misalignment.
- [x] The UI does not become dominated by a single hue; warm olive, correction red, ink, paper, and brass each have clear roles.

### Quality Gates

- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm test`
- [x] `npm run build`
- [x] Browser smoke check for setup-required/auth/no-tests/test-created/work-uploaded/review/student-result states when practical.
- [x] Screenshot review at desktop and narrow viewport widths for text overlap and control stability.

## Success Metrics

- New or changed RedPen UI code can choose shared primitives instead of inventing local button/panel/status styling.
- Raw hex usage in migrated components drops substantially and remaining exceptions are documented.
- Teacher workbench reads more like a paper-based correction tool while still feeling like a production MVP.
- The document preview becomes visually central without making the rest of the workflow harder to scan.
- Student-facing result pages feel trustworthy, calm, and connected to the RedPen identity.

## Dependencies & Risks

- The active dashboard plan (`docs/plans/2026-05-21-002-feat-streamline-dashboard-grading-flow-plan.md`) is closely related. Implement design-system migration after its workflow structure is stable, or migrate only surfaces whose logic has settled.
- The active AI-pipeline plan (`docs/plans/2026-05-21-003-feat-simplify-mvp-ai-analysis-pipeline-plan.md`) may alter review output shapes. Keep visual primitives schema-agnostic where possible.
- `components/workbench-shell.tsx` is large and currently carries much of the state machine. Do not combine broad workflow rewrites with design-system extraction.
- Font changes and square-corner styling can affect layout density. Verify long Estonian labels.
- PunanePastakas uses very strong ink/red motifs. RedPen should remain operational and trustworthy, not overly playful or prototype-like.
- This repository is public and privacy-sensitive. Do not create screenshots or docs containing real student work.

## Documentation Plan

- Add `docs/design-system/redpen-design-system.md`.
- Link the design-system doc from `README.md` or architecture docs only after the first implementation pass is complete and accurate.
- Update relevant plan/todo files as implementation proceeds.
- Document any intentional exceptions, such as annotation SVG stroke colors or third-party iframe/PDF rendering constraints.

## Sources & References

### RedPen

- `AGENTS.md:108` - frontend conventions for dense operational workbench, palette, empty-first behavior, icons, and student-facing transparency.
- `app/globals.css:4` - current RedPen CSS variables and global styling.
- `components/workbench-shell.tsx:536` - current three-zone workbench layout and main migration target.
- `components/document-viewer.tsx:27` - current preview surface and annotation overlay container.
- `components/status-pill.tsx` - current status display component.
- `components/ai-transparency-marker.tsx` - current AI transparency component.
- `components/student-result-view.tsx` - current student invite result UI.
- `docs/architecture/system-model.md` - product and architecture constraints, including PunanePastakas as a reference rather than definitive pipeline.
- `docs/plans/2026-05-21-002-feat-streamline-dashboard-grading-flow-plan.md` - active dashboard flow plan.
- `docs/plans/2026-05-21-003-feat-simplify-mvp-ai-analysis-pipeline-plan.md` - active AI pipeline simplification plan.

### PunanePastakas

- `~/Projects/PunanePastakas/AGENTS.md:100` - visual-system source of truth.
- `~/Projects/PunanePastakas/app/globals.css:14` - paper grid global background and font utilities.
- `~/Projects/PunanePastakas/tailwind.config.ts:7` - named color motifs.
- `~/Projects/PunanePastakas/components/app-sidebar.tsx` - paper/ink/correction stripe navigation motif.
- `~/Projects/PunanePastakas/components/ai-guidance-panel.tsx` - red/brass AI guidance and review motif.
- `~/Projects/PunanePastakas/components/annotation-canvas.tsx` - red-pen annotation toolbar and Excalidraw workbench motif.
- `~/Projects/PunanePastakas/README.md` - prototype workflow context and boundaries.

### External References

- None. Local repository context is sufficient for this plan.
