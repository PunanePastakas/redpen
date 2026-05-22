# PRD: RedPen Functional MVP

Status: draft
Date: 2026-05-20

## Overview

RedPen MVP is a desktop-first web application for mathematics teachers working with students aged 13+. A teacher uploads student work and optional grading context, receives structured AI-assisted drafts, reviews and edits the output, then confirms feedback, points, annotations, and optional grades before anything is shared.

The MVP uses a simplified product model: one teacher owns their account, tests, uploaded files, and student entities. Students are attached to the teacher's account and can view only results the teacher explicitly shares with them. There are no school, school admin, MTU admin, or superadmin roles in the MVP data model.

## Goals

- Reduce teacher time spent drafting useful feedback and red-pen markings.
- Preserve teacher authority over assessment and student-facing feedback.
- Support Estonian and English UI/feedback flows from the start.
- Keep production customer content in EU-controlled infrastructure.
- Support student-facing shared feedback without broad account hierarchy.
- Keep the public repository safe for collaboration under AGPL-3.0-only.
- Produce the minimum documentation needed for GDPR, EU AI Act, DPA, privacy notice, and transparency review.

## Non-Goals

- No autonomous grading or automatic student publishing.
- No institution-wide roster, class, school admin, MTU admin, or superadmin system in MVP.
- No production eKool/Stuudium integration in MVP; only mock export if useful.
- No fine-tuning or model training on student work.
- No mandatory crop-first image pipeline.
- No mobile-first workflow; mobile should be readable, but desktop is primary.
- No support for subjects beyond mathematics in MVP.

## Users

- Teacher: primary user; owns tests, student entities, uploads, AI drafts, review decisions, and final results.
- Student aged 13+: optional viewer; sees shared teacher-confirmed feedback for their linked teacher-owned student entity.
- External reviewer/DPO/legal collaborator: reviews public documentation and deployment posture outside the product role model.

## Functional Requirements

### F1: Authentication And Ownership

- [ ] Teacher accounts exist in Convex-backed auth/user tables.
- [ ] Optional student access exists through a student login, magic link, invite token, or equivalent teacher-issued access mechanism.
- [ ] Every test, upload, student entity, AI attempt, review, and result belongs to exactly one teacher account.
- [ ] Teachers can access only records they own.
- [ ] Students can access only results explicitly shared with the student entity linked to their access identity.
- [ ] There are no school, school admin, MTU admin, or superadmin product roles in the MVP.

### F2: Teacher-Owned Student Entities

- [ ] Teacher can create, edit, archive, and merge student entities in their own account.
- [ ] Student entities can have a display name, optional external reference, preferred language, and access status.
- [ ] Uploaded work can start with a detected name and remain unmatched until the teacher links it to a student entity.
- [ ] Name matching is advisory. The teacher can correct or ignore it before final sharing.

### F3: Test Creation And Context

- [ ] Teacher can create a mathematics test with title, date, optional grade/level, default feedback language, optional max points, and optional notes.
- [ ] Teacher can provide grading context as image, PDF, or text. This may include `hindamisjuhis`, rubric, answer key, solved examples, or free-text instructions.
- [ ] Grading context is optional. The system must still process student work when no instruction document is available.
- [ ] The system can propose a task model from the student work and available context: likely tasks, labels, criteria, max points, evidence references, and uncertainty.
- [ ] When a `hindamisjuhis` is available, the system first extracts a stable guide-derived task model before analyzing student work, then reuses that same task structure for every work in the test.
- [ ] Teacher can edit, split, merge, or ignore the proposed task model.

### F4: Student Work Upload

- [ ] Teacher can upload a collection of JPG/PNG/PDF student work files.
- [ ] System stores originals in Convex storage in the EU deployment.
- [ ] System records file metadata, hashes, language hints, and retention state.
- [ ] System detects visible student names when present and asks teacher to confirm uncertain matches.
- [ ] Real student files are blocked from public fixtures and sample data.

### F5: AI Analysis

- [ ] System can send whole uncropped work images/PDF pages, including visible names, to the EU-resident LLM path for the prototype when this is the simplest reliable approach.
- [ ] System analyzes one student's complete uploaded work in one LLM request. For guided tests, this work call uses the previously extracted task model from the guide.
- [ ] AI output uses the structured `GradingAnalysis` contract: visible student name, full transcription, task-wise transcript split, evidence references, likely mistake types, guidance-motivated grading rationale, suggested points, draft feedback, minimal annotation targets, and review flags.
- [ ] For guided tests, every student analysis returns the same expected task keys, labels, ordering, and max points. Expected tasks not visible in an upload are flagged as not visible or uncertain rather than omitted or automatically graded as zero.
- [ ] AI output does not include detected language, requested feedback language, language notes, language confidence, or model-produced feedback-language fields.
- [ ] Teacher-selected feedback language is app-owned request/persistence metadata and can guide Estonian or English feedback drafts.
- [ ] AI-generated math uses `\(...\)` / `\[...\]` spans inside task-wise transcript and feedback text so the UI can render it with KaTeX.
- [ ] Cropping is optional and used only for annotation precision, unclear handwriting, cost control, partial retry, or teacher-requested re-analysis.
- [ ] AI attempts are logged with model/deployment, region mode, prompt/schema version, purpose, input hashes/file refs, timestamps, status, and error.
- [ ] AI calls use Azure OpenAI / Foundry Models EU Data Zone or single EU region in production.

### F6: Teacher Review

- [ ] Teacher can review full-work drafts and task-level drafts.
- [ ] Teacher can inspect original pages, transcription, task-wise transcript excerpts, AI evidence, grading rationale, suggested points, and annotation draft.
- [ ] Teacher can edit task boundaries, split/merge tasks, adjust feedback, change points, and edit annotations.
- [ ] Teacher can accept, edit, reject, or manually replace each AI-assisted draft.
- [ ] System records teacher decision and review time.
- [ ] Teacher-visible UI marks AI-generated content and uncertainty.

### F7: Final Student Result

- [ ] Teacher sees confirmed points and per-task status per student work.
- [ ] Teacher can write/edit final feedback in Estonian or English.
- [ ] Teacher may assign an optional grade.
- [ ] Teacher can confirm the overall result after reviewing the draft or manually overriding it.
- [ ] Optional eKool/Stuudium mock export is available after confirmation.

### F8: Student Feedback View

- [ ] Teacher can share a confirmed result with the linked student entity.
- [ ] Student sees only teacher-shared feedback, confirmed annotations, optional points/grade if the teacher chooses to show them, AI transparency language, and teacher confirmation timestamp.
- [ ] Student cannot see other students' work, hidden teacher notes, raw AI prompts, unconfirmed drafts, or unrelated teacher records.

### F9: Compliance Documentation In App

- [ ] Privacy notice and AI transparency notice are linked from the app footer and relevant feedback views.
- [ ] Teacher can access the DPA outline, sub-processor register, template notification pack, and AI Act technical documentation.
- [ ] AI-generated content is visibly marked before teacher confirmation and in the student feedback view where applicable.

### F10: Retention And Deletion

- [ ] Raw uploaded images, full-page transcriptions, derived crops, and AI drafts have configurable retention.
- [ ] Default MVP policy: retain raw/crop images during active review and delete after sharing or after a short configured period.
- [ ] Teacher-confirmed feedback and audit logs follow the teacher's configured retention policy and applicable law.
- [ ] Deletion jobs produce audit entries.

### F11: Public Collaboration And License

- [ ] Repository includes no secrets or real student data.
- [ ] Repository uses AGPL-3.0-only.
- [ ] `.env.example` documents required provider and region variables.
- [ ] Sample fixtures are synthetic or explicitly anonymized.

## Non-Functional Requirements

- Estonian and English UI/feedback support.
- Strict TypeScript contracts for AI outputs, Convex validators, and UI state.
- Desktop-first review workspace with no overlapping controls at common laptop sizes.
- EU data residency documented and enforced through deployment configuration.
- No provider-side training on customer content.
- Accessibility basics: keyboard navigable controls, labels for icon buttons, and sufficient contrast.
- Observability: error logs, AI attempt logs, retention logs, and teacher-owned audit exports.

## Success Metrics

- Teacher median review time per student result is measured.
- At least 70% of AI draft feedback is accepted with no or minor teacher edits in the first teacher-reviewed benchmark set.
- At least 80% of generated task splits are usable without major restructuring in the first benchmark fixture set.
- 100% of shared student feedback has a teacher confirmation record.
- 100% of AI drafts include review flags where transcription, rubric fit, or point suggestions are uncertain.
- 100% of AI-generated math display strings render through the shared KaTeX-safe path or fall back without crashing.
- 0 production AI calls use a global/non-EU deployment configuration.
- 0 raw student work files remain after the configured retention deadline.

## MVP Acceptance Test Scenarios

- Teacher creates a test, optionally uploads `hindamisjuhis`, uploads three student works, receives full-document transcriptions and AI drafts, reviews outputs, confirms one student result, and shares it.
- Teacher processes a student work without a grading instruction document.
- Teacher corrects an uncertain student name match before sharing.
- Teacher splits or merges model-proposed tasks during review.
- Teacher requests crop refinement for an unclear handwritten region.
- Teacher switches feedback language between Estonian and English.
- Student opens a shared result and sees only that result.
- Student attempts to open another result and is denied.
- Retention job deletes raw/crop files after the configured policy.
- Production config check fails startup or deployment when Azure deployment mode is global or Convex region is not EU.

## Open Questions

- Should students see points by default, or only narrative feedback unless the teacher opts in?
- Should student access use passwordless email, teacher-issued invite code, or another lightweight authentication method?
- What exact default retention period should the prototype use for raw images and derived crops?
- Should lawful basis and DPA language assume teacher-as-controller for direct teacher use, or processor-for-controller when hosted for an institution? The simplified product model does not remove this legal analysis.
- How much annotation geometry is needed in MVP if full-document transcription is the base pipeline?

## References

- Architecture: [../architecture/system-model.md](../architecture/system-model.md)
- MVP plan: [../plans/2026-05-20-001-feat-ai-assisted-grading-mvp-plan.md](../plans/2026-05-20-001-feat-ai-assisted-grading-mvp-plan.md)
