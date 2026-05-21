---
title: RedPen Design System
status: draft
date: 2026-05-22
---

# RedPen Design System

RedPen's interface is a dense teacher workbench: paper, ink, correction marks, clear workflow states, and teacher control. It borrows useful PunanePastakas motifs without importing prototype-only product assumptions.

## Motif Translation

| Motif | RedPen rule |
| --- | --- |
| Paper desk | Use warm off-white page backgrounds with a subtle grid. Keep real work surfaces white or warm paper. |
| Ink | Use ink borders and restrained hard shadows for primary panels, modals, selected objects, and document containers. |
| Correction red | Use for annotations, errors, destructive actions, and review emphasis. Do not use it for normal primary actions. |
| Warm olive | Use as the primary action color for create, upload, run, confirm, share, and setup actions. |
| Brass | Use for uncertainty, rubric warnings, partial confidence, and non-blocking cautions. |
| Square workbench controls | Prefer `2px` panel radius and `3px` control radius. Avoid soft decorative card styling. |
| Dense review UI | Put teacher decisions close to AI drafts, status, points, and transcript context. |

## Tokens

Tokens live in `app/globals.css`.

| Token | Purpose |
| --- | --- |
| `--rp-paper`, `--rp-paper-warm`, `--rp-paper-soft` | Page and paper backgrounds. |
| `--rp-paper-grid` | Subtle notebook-grid line color. |
| `--rp-ink`, `--rp-text`, `--rp-text-soft` | Ink borders, primary text, and supporting dark text. |
| `--rp-muted`, `--rp-muted-strong` | Secondary labels and subdued helper text. |
| `--rp-surface`, `--rp-surface-warm`, `--rp-surface-subtle` | Panel and document surfaces. |
| `--rp-border`, `--rp-border-strong` | Normal and stronger structural borders. |
| `--rp-primary`, `--rp-primary-strong`, `--rp-primary-soft`, `--rp-primary-wash` | Warm olive primary actions and selected/action washes. |
| `--rp-correction`, `--rp-correction-strong`, `--rp-correction-soft`, `--rp-correction-wash` | Red-pen annotations, destructive states, and AI review emphasis. |
| `--rp-brass`, `--rp-brass-strong`, `--rp-brass-soft` | Warning and uncertainty states. |
| `--rp-success`, `--rp-success-soft` | Confirmed/shared/success states. |
| `--rp-focus` | Keyboard focus outline. |
| `--rp-shadow-ink`, `--rp-shadow-ink-soft`, `--rp-shadow-correction` | Hard offset shadows. |
| `--rp-radius-panel`, `--rp-radius-control` | Stable square-ish corners. |

Legacy variables such as `--background`, `--accent`, and `--danger` map to RedPen tokens so older code can migrate gradually.

## Primitives

Shared primitives live in `components/ui/`.

| Primitive | Use |
| --- | --- |
| `Button` | Text/icon command buttons with `primary`, `secondary`, `ink`, `danger`, `ghost`, and `tool` variants. |
| `IconButton` | Icon-only buttons; call sites must provide `aria-label` and should provide `title`. |
| `Panel`, `PanelHeader` | Functional workbench panels and selected/warning/danger/success surfaces. |
| `StatusBadge` | Compact status and score labels. |
| `Notice` | AI transparency, warning, error, success, and informational messages. |
| `Field`, `TextInput`, `Textarea`, `Select` | Form controls with consistent border, focus, and type scale. |
| `SegmentedControl` | Compact mode/language choices. |
| `Modal` | Ink-bordered dialog shell with backdrop, Escape close, and close button. |
| `EmptyState` | Dashed paper placeholders for unavailable or empty workflow states. |
| `FileDropzone` | Upload-first empty surface for files. |
| `Toolbar`, `ToolbarGroup` | Icon-first document and annotation toolbars. |
| `ProgressSteps` | Step/status progress where a workflow needs explicit staged state. |

Primitives should not import Convex APIs, AI schemas, or workflow mutations. They accept `className` for layout escape hatches, not for redefining core variants.

## Workflow Styling

- Setup/auth/no-tests states use the same paper-grid app frame as the authenticated workbench.
- Test rail, upload/preview workspace, and review/result rail remain the main desktop workbench zones.
- Upload, analysis, review, confirmation, sharing, and student result states should each have local disabled/error copy.
- AI-generated text is always marked as teacher-reviewable and must render through the shared math renderer when it may contain math.
- Student-facing result pages use the same paper/ink identity with calmer density and no teacher-only draft controls.
- Raw student work, real student names, and production data must never appear in screenshots, docs, or fixtures.

## Accessibility

- Icon-only controls require `aria-label`; unfamiliar controls also need `title`.
- Focus rings must be visible against paper, white, red, warm olive, and brass surfaces.
- Disabled actions should remain legible and explainable in nearby state copy.
- Long Estonian and English labels must wrap or truncate intentionally without overlapping adjacent controls.
- Toolbars and dense button groups should keep stable dimensions when loading spinners or status labels appear.

## Do Not

- Do not add decorative nested cards.
- Do not reintroduce fake runtime data for authenticated teachers.
- Do not use autonomous grading or automatic publishing language.
- Do not add school, class, admin, or broad roster concepts as part of design-system work.
- Do not scatter new raw hex values in migrated components unless the exception is documented.
