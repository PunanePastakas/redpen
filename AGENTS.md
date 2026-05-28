# Agent Instructions

## Project Mental Model

RedPen is a teacher-controlled AI-assisted mathematics grading workbench for Estonian teachers and students aged 13+. The important product boundary is simple: AI drafts help the teacher, but the teacher owns every assessment decision, point value, annotation, confirmation, share action, and student-facing sentence.

The MVP is intentionally narrow:

- One product role in the authenticated app: `teacher`.
- `students` are teacher-owned entities, not institution-wide identities.
- Student access is narrow invite-token access to a teacher-shared, teacher-confirmed result.
- There are no schools, classes, school admins, MTU admins, or superadmins in the product model.
- Mathematics only; Estonian and English are the supported feedback languages.

Do not introduce autonomous grading, automatic publishing, broad roster/institution concepts, production eKool/Stuudium integration, or hidden operator/admin product roles unless the user explicitly asks for a scoped architectural change.

## Current Product Shape

The current app is a live empty-first MVP, not a synthetic demo:

- `app/page.tsx` renders `components/workbench-shell.tsx`.
- If `NEXT_PUBLIC_CONVEX_URL` is missing, the app shows setup-required UI instead of fake data.
- Authenticated teachers start with no placeholder tests, students, works, review drafts, or student links.
- The teacher flow is: create a test, optionally add `hindamisjuhend` / grading context, upload student work, run analysis, review/edit AI drafts, link/create a student, confirm the result, then share or mock-export it.
- The dashboard is being streamlined into three zones: left test rail, middle upload/preview workspace, right analysis/review/result rail. Check `docs/plans/2026-05-21-002-feat-streamline-dashboard-grading-flow-plan.md` before changing that flow.

Synthetic data still exists, but it is for tests, fixtures, and explicit mock-provider mode only. Runtime UI should not silently fall back to `lib/synthetic-demo.ts`.

## Where Things Live

- `app/`: Next.js App Router entry points, root layout, Convex provider, and student share routes.
- `components/workbench-shell.tsx`: main teacher dashboard orchestration. It currently holds most state wiring and many local subcomponents, so refactor carefully and keep behavior grounded in the live Convex flow.
- `components/document-viewer.tsx`: preview surface for uploaded image/PDF/text files plus annotation overlay.
- `components/annotation-canvas.tsx`: SVG rendering of vetted annotation targets.
- `components/student-result-view.tsx`: invite-token student result view; it must show only shared confirmed results.
- `components/auth-panel.tsx`: Convex Auth password sign-in/sign-up UI.
- `convex/schema.ts`: primary domain model and indexes.
- `convex/auth.ts`: Convex Auth setup and ownership helpers. Use these helpers rather than trusting client-provided ownership.
- `convex/tests.ts`, `students.ts`, `uploads.ts`, `works.ts`, `reviews.ts`, `results.ts`: public Convex API surface for the teacher/student workflows.
- `convex/aiActions.ts`: scheduled/internal AI orchestration. External provider calls belong here or behind a server-side provider boundary, not in the browser.
- `lib/ai-schemas.ts`: canonical Zod schema for model output. This contract ties prompts, persistence, UI, and tests together.
- `lib/ai/prompts.ts`: versioned system/user prompt builders.
- `lib/file-validation.ts`, `lib/config.ts`, `lib/retention-policy.ts`, `lib/workflow-state.ts`, `lib/annotation-geometry.ts`: shared policy and pure logic with Vitest coverage.
- `docs/architecture/system-model.md` and `docs/prd/mvp-prd.md`: source of truth for product and architecture decisions beyond the README.
- `docs/plans/`: living implementation plans with frontmatter status. Read active plans before implementing related work.
- `todos/`: file-based implementation todos that mirror plan progress.

## Domain And State

The central records are teacher-owned:

- `tests`: the teacher's assessment container, including title, subject, feedback language, notes, max points, and task model.
- `uploadedFiles`: metadata and Convex storage references for grading context, student work, derived pages, or crops.
- `studentWorks`: one submitted work within a test; starts as uploaded and moves through analysis/review/result statuses.
- `taskReviews`: AI draft plus teacher decision for a task-level review.
- `studentResults`: teacher-confirmed output that can later be shared.
- `studentAccessTokens`: hashed invite tokens scoped to a student.
- `aiAttempts`, `auditLogs`, `retentionEvents`: accountability, provider attempt, and deletion trail.

Use the validators in `convex/validators.ts` for exact enum values. Common workflow statuses include:

- `studentWorks.status`: `uploaded`, `transcribing`, `mapped`, `drafted`, `needs_review`, `reviewed`, `confirmed`, `shared`, `archived`, `error`.
- `taskReviews.status`: `needs_review`, `accepted`, `edited`, `rejected`, `manual`, `confirmed`.
- `studentResults.status`: `draft`, `confirmed`, `shared`, `archived`.
- `uploadedFiles.retentionState`: `active`, `queued_for_deletion`, `deleted`, `delete_failed`, `retained_by_policy`.

When adding new records, keep `teacherId` explicit and indexed in the same style as existing tables.

## Authorization Rules

Every public Convex query/mutation/action must derive identity from Convex Auth and enforce ownership server-side.

Use:

- `requireTeacher(ctx)` for normal teacher reads/writes.
- `ensureTeacher(ctx)` when provisioning/upserting the current teacher profile during creation flows.
- `requireOwnedTest`, `requireOwnedStudent`, `requireOwnedWork`, and `requireOwnedTaskReview` before touching teacher-owned records.

Never let the client assert `teacherId`. Never expose unconfirmed drafts, raw AI internals, other students' work, or unrelated teacher records through student routes. `results.getSharedByInviteToken` is the model for narrow student access: hash the token, check active/not expired, require `result.status === "shared"`, and require the result's `studentId` to match the token's `studentId`.

## AI Pipeline Rules

AI output is a structured draft, not truth.

- Keep full-document-first analysis as the base path. Crops are optional refinements for precision, cost, unclear handwriting, or retries.
- Validate model output with `GradingAnalysisSchema`.
- Keep `GRADING_ANALYSIS_SCHEMA_VERSION` and `GRADING_ANALYSIS_PROMPT_VERSION` meaningful when contracts change.
- Store prompt/schema/model/provider metadata and hashes in `aiAttempts`.
- The OpenAI Responses call in `convex/aiActions.ts` must use `store: false`.
- OpenAI secrets belong in Convex backend environment variables, never `NEXT_PUBLIC_*`.
- `REDPEN_AI_PROVIDER=mock` is the only acceptable synthetic analysis path.
- Missing provider configuration should surface as an analysis error, not synthetic success.

Prompt behavior should preserve the product stance: visible names are advisory, the teacher must confirm matches, grading context is context rather than student work, uncertainty must be explicit through review flags, suggested points must indicate whether the rubric is clear, and math-bearing display text must be KaTeX-renderable through the shared renderer.

## Privacy, Compliance, And Public Repo Rules

This repository is public-collaboration oriented and AGPL-3.0-only. Treat student work as sensitive personal data.

- Never commit real student work, names, grades, classroom exports, screenshots with identifiable students, API keys, or production runtime data.
- Keep fixtures synthetic or explicitly anonymized. Use `fixtures/synthetic/` for manual smoke testing.
- `validateUploadFile` intentionally rejects filenames that look like real student data.
- Do not paste real student work into issues, docs, screenshots, tests, prompts, or external tools.
- Production/customer-content posture is EU-first: Convex EU region, EU-resident inference path, no provider-side training, documented DPIA/subprocessor posture, and short retention.
- Azure OpenAI is now available only through the reviewed backend provider path; keep EU region, non-global deployment type, content logging disabled, and no-training posture documented before real student use. Microsoft Foundry routing remains blocked until separately implemented and reviewed.
- Raw uploads and derived artifacts should follow `lib/retention-policy.ts`; confirmed feedback and audit logs have separate retention concerns.

## Frontend Conventions

The workbench is desktop-first, dense, and operational. Favor clear workflow surfaces over marketing-style pages.

- Use the existing restrained palette from `app/globals.css`: warm off-white background, white surfaces, green/teal primary action, red annotation/error accents.
- Keep cards for functional panels only. Avoid decorative nested card layouts.
- Use `lucide-react` icons in icon buttons and give icon-only buttons `title` and `aria-label`.
- Preserve the empty-first experience: no fake tests/students/works after login.
- Keep setup, upload, analysis, review, confirmation, and sharing state-specific. Disabled actions should make sense in the current workflow.
- Document preview and annotation geometry are approximate; only render annotation targets that have usable normalized boxes and no rejection reason according to `lib/annotation-geometry.ts`.
- Student-facing UI must emphasize teacher confirmation and AI transparency without showing drafts or hidden teacher context.

## Convex And Data Flow Conventions

- Prefer direct browser upload to Convex storage via `uploads.generateUploadUrl`, followed by `uploads.recordUploadedFile` with hash and metadata.
- Side-effectful external API work should be scheduled from a mutation with `ctx.scheduler.runAfter(...)` and run in an internal action.
- Keep public functions small and ownership-checked. Put shared pure logic in `lib/` when it needs tests or UI/backend reuse.
- If you change Convex function names, schema, or validators, regenerate/check generated Convex types as needed and run typecheck.
- Do not persist transient storage URLs. Persist storage IDs, upload IDs, roles, hashes, provider metadata, and cleanup-relevant IDs instead.
- Re-analysis should replace stale draft reviews or upsert by stable keys rather than accumulating duplicate active drafts.

## Sharp Edges For Future Agents

- `components/workbench-shell.tsx` is large and currently carries much of the dashboard state machine. Before broad edits, identify the exact flow state you are changing and avoid reshuffling unrelated panels.
- `convex/aiActions.ts` contains both a public action and the scheduled internal action path. The normal UI should authorize through `works.requestAnalysis`; if you touch or expose the public action, make sure it enforces teacher ownership before analyzing a `workId`.
- `lib/ai/openai.ts` is a provider-boundary implementation, but the current Convex action assembles the live Responses request directly. Do not assume the provider class is wired into production flow without checking call sites.
- Several PRD items are still aspirational or partial, especially retention jobs, audit coverage, compliance links, task split/merge editing, and production Azure/Foundry hardening. Check `docs/plans/` and `todos/` before treating a requirement as complete.
- Current preview behavior is intentionally simple: the selected work shows the first uploaded student-work file, PDFs render in an iframe, and image annotations depend on normalized boxes plus rejection reasons.

## Testing And Verification

Available checks:

- Use pnpm for Node dependency management. The project pins pnpm in `package.json`
  and keeps dependency build-script approvals in `pnpm-workspace.yaml`.
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm test:ai-contracts`
- `pnpm test:retention`
- `pnpm test:config`
- `pnpm check:config`
- `pnpm test:fixtures`
- `pnpm build`
- `pnpm check`

For pure logic changes in `lib/`, add or update focused Vitest tests under `tests/`. For schema/prompt/provider changes, run the AI contract tests. For config, retention, fixture, upload, or public-repo hygiene changes, run the targeted guardrail script/test. For UI flow changes, run the narrowest useful tests plus a local browser smoke check when practical.

## Local Node Processes

- When starting a Node-backed local process such as `pnpm dev`, `pnpm dev:convex`, `next dev`, `convex dev`, Playwright servers, or one-off preview servers, track the PID or tool session that owns it.
- Before finishing the turn, stop any Node process you started unless the user explicitly asks to keep it running.
- Verify cleanup with `lsof -nP -iTCP -sTCP:LISTEN` and kill only the relevant local server PIDs. Avoid killing editor helper processes or unrelated Node processes that are not listening on local ports.
- If an existing Node server was already running before the work began, do not kill it unless the user explicitly asks to stop all local Node servers.
