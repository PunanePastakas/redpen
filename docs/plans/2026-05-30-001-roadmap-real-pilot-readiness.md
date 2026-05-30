---
title: "roadmap: Human+AI Development To Real Pilot Readiness"
type: roadmap
status: draft
date: 2026-05-30
related_docs:
  - docs/compliance/eu-data-residency-evaluation.md
  - docs/prd/mvp-prd.md
  - docs/compliance/DPIA-draft.md
  - docs/compliance/subprocessor-register-outline.md
---

# roadmap: Human+AI Development To Real Pilot Readiness

## Overview

This roadmap moves RedPen from a functional synthetic-data MVP toward a small real-student pilot. It is a gated readiness program, not a feature wishlist. The product may process real student work only after deployment evidence, compliance decisions, retention operations, benchmark evidence, and pilot procedures are complete.

The work should deliberately combine human judgment and AI-assisted development. Humans own legal, school, deployment, and go/no-go decisions. AI agents can accelerate implementation, tests, documentation drafts, checklist maintenance, benchmark harnesses, and repeated audits, but they must not approve real-student processing or make policy decisions.

## Current Readiness Baseline

### Already Strong

- RedPen has a teacher-controlled Next.js and Convex MVP shell with auth, teacher ownership, uploads, AI analysis, review, confirmation, sharing, and mock export flows.
- The backend now supports a guarded Azure OpenAI provider path with provider, endpoint, region, deployment type, content logging, prompt version, schema version, and attempt metadata.
- The repository has public-collaboration guardrails, synthetic fixtures, config checks, AI contract tests, retention policy logic, and compliance document outlines.
- The product stance is correct for a pilot: AI drafts assist the teacher, while the teacher confirms every assessment, feedback sentence, point value, share action, and student-facing result.

### Not Ready Yet

- The EU data residency evaluation states that RedPen is not production-ready for a strict "everything in the EU" claim until actual deployment evidence is attached.
- Retention policy calculations exist, but scheduled deletion and storage-delete audit evidence still need to be verified in a live deployment.
- The DPIA, DPA, subprocessor register, AI Act documentation, parent/school notice pack, and controller/processor decision are still outlines or open decisions.
- Real model quality has not yet been measured against a teacher-reviewed benchmark set.
- Pilot operations are not yet documented enough for incident response, support access, data subject requests, school onboarding, or go/no-go review.

## Human And AI Ownership Model

### Human-Owned Decisions

- Approve the controller/processor model for individual-teacher and school-led pilots.
- Approve the lawful basis, DPIA, DPA, subprocessor register, parent/student notice text, and any DPO recommendations.
- Verify actual Convex, Azure OpenAI, hosting, monitoring, email, and support-access evidence.
- Decide whether the first pilot allows real student data, anonymized teacher-reviewed data, or synthetic-only rehearsals.
- Define benchmark acceptance thresholds and decide whether results are good enough for pilot use.
- Make the final pilot go/no-go decision and document residual risk acceptance.

### AI-Assisted Work

- Draft implementation plans, checklists, compliance text, test cases, runbooks, and benchmark report templates for human review.
- Implement bounded engineering tasks such as retention jobs, config checks, audit coverage, smoke scripts, and benchmark harnesses.
- Search the codebase for missing ownership checks, raw file exposure, unbounded queries, unsafe env variables, and public-repo hygiene risks.
- Generate synthetic fixture variations and evaluation prompts that do not contain real student work.
- Summarize verification output and maintain traceability from roadmap gates to repository evidence.

### Human Review Gates For AI Work

- Any auth, retention, AI-provider, deployment, or compliance-sensitive code needs human code review before pilot use.
- Any generated compliance text must be reviewed by the responsible legal/DPO reviewer before being treated as policy.
- Any benchmark summary must include raw evidence locations and cannot be accepted from AI narrative alone.
- AI agents may recommend, but cannot approve, student-data processing.

## Roadmap Phases

### Phase 0: Roadmap Acceptance And Scope Freeze

Goal: agree what "real pilot readiness" means before adding more product surface.

Deliverables:

- Pilot readiness definition with the exact data type allowed at each stage: synthetic, anonymized, or real student data.
- Named owners for engineering, deployment, legal/DPO, school relationship, benchmark review, and pilot operations.
- Decision log for unresolved PRD questions: point visibility, student access model, retention periods, controller/processor model, and annotation depth.
- Frozen out-of-scope list for the first pilot: autonomous grading, production eKool/Stuudium integration, school admin hierarchy, fine-tuning, and real student fixtures in the public repo.

Exit gate:

- A human owner signs off the pilot scope and confirms that real student data remains blocked until later gates pass.

### Phase 1: Deployment And Provider Evidence

Goal: prove that the configured runtime matches the EU-first architecture.

Deliverables:

- Convex deployment evidence: URL, region, backup/support posture, and confirmation that files, functions, database, audit logs, and retention events stay in the approved EU deployment.
- Azure OpenAI evidence: tenant/resource, endpoint, deployment names, API version, model, deployment type, region/data zone, content logging setting, no-training posture, DPA terms, and quota limits.
- Frontend hosting evidence: runtime region for middleware/functions, logging settings, support access, and confirmation that raw student files do not pass through non-EU server routes.
- Environment checklist proving `pnpm check:config`, `pnpm test:config`, and a synthetic live-provider smoke run pass with production-like variables.

Human role:

- Verify vendor account evidence and approve subprocessors.

AI/developer role:

- Maintain config checks, smoke scripts, and evidence templates.

Exit gate:

- A production-like synthetic run completes through the reviewed Convex and AI provider path, and all deployment evidence is attached to the compliance record.

### Phase 2: Retention, Audit, And Access Controls

Goal: prove sensitive data can be controlled, traced, and deleted.

Deliverables:

- Scheduled retention cleanup for raw uploads and derived artifacts, including queued, deleted, delete-failed, and retry behavior.
- Retention audit events that prove what was deleted, when, under which policy, and whether deletion failed.
- Expanded audit coverage for upload, AI attempt, review decision, result confirmation, share, invite-token access, deletion, and support/admin access if any exists.
- Data subject request runbook covering access, correction, deletion, restriction, objection, and manual-grading fallback.
- Security review for public Convex functions: ownership checks, no client-supplied `teacherId`, narrow student invite-token reads, and no raw prompt/content exposure in logs.

Human role:

- Approve audit retention periods, support access restrictions, and data subject request handling.

AI/developer role:

- Implement jobs, tests, audit checks, and access-control reviews.

Exit gate:

- A synthetic retention drill shows raw files deleted after policy deadlines, deletion events recorded, and active review files preserved.

### Phase 3: Compliance Pack Completion

Goal: convert compliance outlines into pilot-ready documents.

Deliverables:

- Completed DPIA with legal basis, controller/processor model, risk assessment, DPO/legal advice, residual risks, and approval status.
- Completed subprocessor register for Convex, Azure OpenAI/Microsoft, hosting, and any enabled email, monitoring, analytics, or support tools.
- DPA outline adapted for the first pilot model.
- Privacy notice, AI transparency notice, parent/school notification pack, and internal support-access policy.
- AI Act technical documentation updated with architecture, human oversight, logging, benchmark plan, known limitations, and change-management process.

Human role:

- Draft or approve legal/policy substance and record decisions.

AI/developer role:

- Keep docs consistent with implemented architecture and generate review checklists.

Exit gate:

- Legal/DPO reviewer approves the compliance pack for the chosen pilot scope.

### Phase 4: Benchmark And Quality Evidence

Goal: measure whether the AI-assisted workflow is safe enough to put in front of pilot teachers.

Deliverables:

- Synthetic and explicitly anonymized handwritten mathematics benchmark set stored outside public real-student data paths as needed.
- Benchmark runner or repeatable evaluation protocol for guided and no-guide tests.
- Metrics for task boundary acceptance, transcription quality, name detection uncertainty, point suggestion error, feedback edit rate, annotation target acceptance, false confidence, review time, and student feedback comprehension where applicable.
- Teacher-reviewed benchmark report with examples of accepted, edited, rejected, and unsafe outputs.
- Model/prompt/schema change policy requiring benchmark reruns before changes that affect grading behavior.

Human role:

- Review benchmark outputs and decide whether quality is acceptable.

AI/developer role:

- Build harnesses, summarize results, and identify recurring failure modes.

Exit gate:

- Benchmark report meets the pilot thresholds chosen by human reviewers, or the pilot remains blocked with specific remediation tasks.

### Phase 5: Pilot Workflow Hardening

Goal: make the teacher and student journey reliable enough for a small supervised pilot.

Deliverables:

- End-to-end smoke script for create test, upload guide, upload multiple works, extract task model, analyze, review, link student, confirm result, share result, deny unrelated student access, and trigger retention cleanup.
- Manual QA checklist for desktop-first teacher workflow and student result view.
- Error and retry behavior for failed guide extraction, failed analysis, missing provider config, expired invite tokens, and upload validation errors.
- Clear pilot support runbook: how to stop processing, revoke links, delete data, handle teacher reports, and record incidents.
- Product polish limited to pilot blockers, not broad new scope: task split/merge usability, multi-page edge cases, batch review clarity, and accessibility issues found in QA.

Human role:

- Run pilot rehearsal with synthetic or anonymized data and approve operational readiness.

AI/developer role:

- Implement narrow fixes, generate QA scripts, and keep regression checks green.

Exit gate:

- A full synthetic or anonymized pilot rehearsal completes with no blocking defects and documented recovery for expected failures.

### Phase 6: Controlled Real Pilot Launch

Goal: process real student work only inside the approved pilot boundary.

Deliverables:

- Pilot participant list and data-processing authorization.
- Confirmed environment snapshot: app version, Convex deployment, Azure deployment, env config, prompt/schema versions, and compliance document versions.
- Teacher onboarding that explains AI limits, mandatory review, uncertainty flags, sharing controls, and student/parent communication.
- Pilot monitoring plan for errors, review time, edit rate, teacher feedback, deletion jobs, and incident reports.
- Go/no-go meeting notes with residual risks and rollback criteria.

Human role:

- Make the launch decision, onboard participants, monitor real-world risks, and pause the pilot if gates are violated.

AI/developer role:

- Monitor technical evidence, summarize logs without exposing student work, and prepare fixes for human review.

Exit gate:

- Pilot runs within approved scope, with review checkpoints and a documented post-pilot decision before expansion.

## Cross-Cutting Quality Gates

Every phase should maintain these checks:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm test:config`
- `pnpm test:ai-contracts`
- `pnpm test:retention`
- `pnpm test:fixtures`
- `pnpm check:config`
- `pnpm build`

For docs-only changes, code tests are not required unless the change claims implemented behavior. For compliance-sensitive claims, repository text must distinguish implemented evidence from deployment evidence and legal approval.

## Pilot Readiness Checklist

- [ ] Pilot scope, data class, and owners are approved.
- [ ] Real student data remains blocked until deployment, retention, compliance, benchmark, and operations gates pass.
- [ ] Convex EU deployment evidence is attached.
- [ ] Azure OpenAI EU deployment evidence is attached.
- [ ] Frontend hosting region and logging posture are attached.
- [ ] No unapproved email, monitoring, analytics, export, or support tool processes student content.
- [ ] Retention cleanup is implemented, scheduled, tested, and audited.
- [ ] Data subject request and incident runbooks are approved.
- [ ] DPIA, DPA, subprocessor register, notices, and AI Act technical documentation are completed and approved.
- [ ] Benchmark report meets human-approved pilot thresholds.
- [ ] Full synthetic or anonymized pilot rehearsal passes.
- [ ] Go/no-go decision is recorded with rollback criteria.

## Recommended First Work Packages

1. **Retention operations:** implement and verify Convex scheduled cleanup plus deletion audit evidence.
2. **Deployment evidence pack:** collect Convex, Azure, and hosting evidence and wire it into the compliance docs.
3. **Benchmark harness:** create repeatable synthetic/anonymized evaluation runs and report format.
4. **Compliance completion sprint:** finish DPIA/subprocessor/DPA/notice drafts with human legal review.
5. **Pilot rehearsal:** run the full workflow with synthetic or anonymized data and record defects.

These packages should stay separate so legal/deployment blockers do not hide engineering risk, and engineering progress does not imply permission to process real student data.

## References

- `docs/compliance/eu-data-residency-evaluation.md` - current EU-readiness verdict and required production evidence.
- `docs/prd/mvp-prd.md` - non-functional requirements, success metrics, acceptance scenarios, and open questions.
- `docs/compliance/DPIA-draft.md` - DPIA outline and required human legal review.
- `docs/compliance/subprocessor-register-outline.md` - subprocessors that must be completed before production use.
- `docs/compliance/ai-act-technical-documentation-outline.md` - benchmark, audit, risk, cybersecurity, and lifecycle requirements.
- `docs/plans/2026-05-20-001-feat-ai-assisted-grading-mvp-plan.md` - source MVP plan and production-hardening notes.
