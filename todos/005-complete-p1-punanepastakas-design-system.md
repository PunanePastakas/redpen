---
status: complete
priority: p1
issue_id: "005"
tags: [frontend, design-system, workbench]
dependencies: []
---

# PunanePastakas-Inspired Design System

## Problem Statement

RedPen needs the active PunanePastakas-inspired design-system plan implemented on a new branch. The UI should move from scattered local Tailwind styling toward shared RedPen tokens, primitives, and migrated workbench/student-facing surfaces while preserving live empty-first behavior and teacher-confirmed workflow boundaries.

## Findings

- Work plan: `docs/plans/2026-05-22-001-feat-punanepastakas-inspired-design-system-plan.md`.
- Current branch started from clean `main` as `feat/punanepastakas-design-system`.
- Current UI uses repeated raw hex classes in `components/workbench-shell.tsx`, `components/document-viewer.tsx`, `components/auth-panel.tsx`, `components/student-result-view.tsx`, `components/global-navbar.tsx`, `components/status-pill.tsx`, and `components/ai-transparency-marker.tsx`.
- The design direction is paper/ink/correction/brass with warm olive primary actions, square-ish controls, hard offset shadows, dense teacher workbench layout, and calmer student-facing result pages.

## Proposed Solutions

1. Add CSS tokens and React primitives first, then migrate surfaces incrementally.
   - Pros: Keeps behavior stable and gives future UI code a reusable grammar.
   - Cons: More files touched than a cosmetic inline refresh.

2. Refresh inline classes only.
   - Pros: Fastest visual change.
   - Cons: Leaves the same maintainability problem and does not satisfy the plan.

## Recommended Action

Implement option 1. Keep Convex, AI, schema, prompt, and workflow behavior unchanged. Run typecheck, lint, tests, build, and browser smoke checks after migration.

## Acceptance Criteria

- [x] RedPen design tokens exist in `app/globals.css`.
- [x] Shared UI primitives exist under `components/ui/`.
- [x] Design-system documentation exists under `docs/design-system/`.
- [x] Navbar, auth, status, AI transparency, document viewer, workbench, and student result surfaces use the new system.
- [x] Empty-first and teacher-confirmation workflow behavior is preserved.
- [x] Plan checkboxes are updated as work is completed.
- [x] Typecheck, lint, tests, build, and browser smoke checks are run or documented.

## Work Log

### 2026-05-22 - Start Implementation

**By:** Codex

**Actions:**
- Created branch `feat/punanepastakas-design-system` from clean `main`.
- Read the design-system plan and related dashboard/architecture context.
- Created this persistent todo to track implementation.

**Learnings:**
- The safest implementation path is tokens/primitives first, then surface migration with no Convex or workflow changes.

### 2026-05-22 - Tokens, Primitives, And Surface Migration

**By:** Codex

**Actions:**
- Added RedPen design tokens, paper-grid background, focus styling, and font fallback strategy in `app/globals.css`.
- Added shared UI primitives under `components/ui/`.
- Added `docs/design-system/redpen-design-system.md`.
- Migrated navbar, auth controls, status badges, AI transparency marker, document viewer, annotation color, workbench shell, student result views, and token-only student fallback page styling.
- Ran `npm run typecheck` after foundational changes and after workbench migration.

**Learnings:**
- The visual migration could stay behavior-only because the existing dashboard plan had already centralized the three-zone workflow.
- CSS variable-backed Tailwind arbitrary values keep the first pass dependency-free and compatible with the current Tailwind 4 setup.

### 2026-05-22 - Quality Checks And Browser Smoke

**By:** Codex

**Actions:**
- Ran `npm run check`, which completed typecheck, lint, unit tests, production build, and fixture hygiene scan.
- Re-ran `npm run typecheck` and `npm run lint` after a final primitive review tweak.
- Ran browser smoke checks against `next start` on port 3001 while preserving the pre-existing port 3000 server.
- Captured screenshots:
  - Desktop unauthenticated home: `tmp/screenshots/redpen-home-unauthenticated.png` / https://files.catbox.moe/d6u52k.png
  - Mobile unauthenticated home: `tmp/screenshots/redpen-home-mobile.png` / https://files.catbox.moe/cniwr0.png
  - Student token error page: `tmp/screenshots/redpen-student-token-error.png` / https://files.catbox.moe/l8l9gf.png
- Verified no browser console errors were reported during the smoke check.

**Learnings:**
- Tailwind 4 cascade layers meant the unlayered global `a { color: inherit }` rule overrode link-button text utilities. Narrowing it to `a:not([class])` restored intended button contrast.
- A production `next start` server is a useful fallback when another `next dev` instance already owns the checkout lock.
