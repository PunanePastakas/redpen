# AI Act Technical Documentation Outline

Status: draft outline
Date: 2026-05-20

Purpose: technical documentation for an education AI system that evaluates or
supports evaluation of learning outcomes. The working assumption is that RedPen
should be treated as high-risk unless counsel/DPO analysis reaches a different
documented conclusion.

## 1. System Identification

- Name: RedPen.
- Version: MVP draft.
- Provider/operator: MTU for hosted service.
- Intended deployers: Estonian schools and mathematics teachers.
- Intended users: teachers, students aged 13+, school admins.
- Intended purpose: assist teachers with OCR, task segmentation, feedback
  drafting, point suggestion, annotation suggestion, and review workflow.

## 2. High-Risk Classification

Education use cases involving evaluation of learning outcomes are listed in the
EU AI Act high-risk context. RedPen materially supports assessment, even though
teacher confirmation remains mandatory, so MVP controls should follow
high-risk-system expectations.

## 3. Architecture

Reference: [../architecture/system-model.md](../architecture/system-model.md)

Document:

- UI components and review flow.
- Convex schema and authorization functions.
- File storage lifecycle.
- AI provider adapter and deployment mode.
- Prompt and structured output contracts.
- Knowledge/RAG sources.
- Logging and retention jobs.

## 4. Data Inputs And Outputs

Inputs:

- Grading instruction images/PDFs.
- Student work images/PDFs.
- Teacher-edited task breakdown and context.
- Curated mathematics pedagogy/curriculum references.

Outputs:

- Task breakdown.
- Transcription.
- Mistake/rubric analysis.
- Suggested points.
- Draft feedback in Estonian.
- Annotation suggestions.
- Teacher-confirmed results.

## 5. Human Oversight Design

- AI drafts are not shown to students until teacher confirmation.
- Teacher reviews task-by-task and can edit every output.
- Teacher can reject output, adjust crop, re-run analysis, or override points.
- UI shows uncertainty flags and crop/handwriting warnings.
- Final sharing requires explicit teacher action.
- Student can request correction/explanation through teacher/school process.

## 6. Accuracy And Benchmarking

Minimum MVP benchmark set:

- Synthetic and anonymized handwritten mathematics fixtures.
- Teacher-reviewed pilot samples only when authorized and not committed to the
  public repository.

Metrics:

- task boundary acceptance rate;
- OCR/transcription accuracy by task;
- student-name detection precision and uncertain-match rate;
- point suggestion absolute error vs teacher-confirmed points;
- feedback acceptance/edit rate;
- annotation localization acceptance rate;
- false confidence rate where AI is confident but teacher rejects;
- review time per task/student;
- student comprehension rating for shared feedback.

## 7. Known Limitations

- Handwriting, lighting, skew, cropped pages, multi-page work, and unusual
  notation may degrade OCR.
- Multiple valid mathematical solution paths can make point suggestions
  uncertain.
- Rubrics supplied only as photos may be incomplete or ambiguous.
- AI may overfit to visible answer patterns and miss reasoning gaps.
- Estonian mathematical terminology must be checked in benchmark review.
- The system is not a substitute for teacher judgement.

## 8. Audit Trail Specification

Log these events:

- sign-in/sign-out and failed auth checks;
- user, role, school, class, and test membership changes;
- file upload, file hash, storage ref, deletion;
- task breakdown creation, teacher edit, teacher confirmation;
- AI attempt started/completed/failed;
- model provider, deployment name, region mode, API version, prompt version;
- source file/crop refs and hashes, not raw prompt text in admin dashboards;
- task review status changes;
- teacher edits to feedback/points/annotations;
- final result confirmation and sharing;
- optional mock export;
- student view access;
- admin/support access;
- retention deletion job output.

Logs must support school-level export and investigation while minimizing raw
student content exposure.

## 9. Risk Management

Risk register categories:

- incorrect feedback or points;
- automation bias by teacher;
- student privacy breach;
- unauthorized student access;
- model/provider data residency misconfiguration;
- discriminatory or language-biased output;
- excessive retention of raw images;
- public repository data leak;
- support/admin over-access;
- failure to provide meaningful transparency.

Each risk should include severity, likelihood, mitigation, residual risk, owner,
and review cadence.

## 10. Cybersecurity Measures

- Authenticated Convex functions with role checks.
- Internal functions for private server workflows.
- Signed or authorized file access only.
- Secret management through platform environment variables.
- Rate limits on upload and AI-triggering endpoints.
- Dependency and build checks before deploy.
- Incident response and breach notification workflow.

## 11. Lifecycle And Change Management

- Version prompts and structured output schemas.
- Store model/deployment version in AI attempts.
- Run benchmark set before model or prompt changes.
- Document release notes for changes that affect grading behavior.
- Keep technical documentation updated with architecture and benchmark changes.

## Sources

- EU AI Act Annex/technical documentation obligations:
  https://eur-lex.europa.eu/eli/reg/2024/1689/oj
