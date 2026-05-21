# Privacy Notice And AI Transparency Notice Outline

Status: draft outline
Date: 2026-05-20

Purpose: user-facing notice for the app and website covering GDPR Articles 13/14
and EU AI Act transparency/human oversight expectations.

## Plain-Language Lead

RedPen helps your teacher review mathematics work. AI may help read handwriting,
split work into tasks, draft feedback, suggest points, and place red-pen marks.
Your teacher checks and confirms the result before it is shared with you.

## Who Is Responsible

- Controller: the school or education organization using RedPen.
- Processor/service operator: the MTU administering the hosted RedPen service.
- DPO/contact: school-provided contact.
- Platform contact: MTU support contact.

## What Data We Process

- Account and login details.
- Class/test membership.
- Uploaded homework/test images and grading instructions.
- Student name detected from work, if present.
- Transcription of handwritten work.
- Task-level AI drafts, point suggestions, annotations, and uncertainty flags.
- Teacher edits, confirmations, final feedback, optional grade.
- Student access/viewing records.
- Audit, security, and AI attempt logs.

## Why We Process It

- Provide teacher-reviewed feedback.
- Help the teacher assess task-level mathematical reasoning.
- Share confirmed feedback with the student.
- Keep records needed for security, accountability, and legal compliance.
- Improve prompts and product quality using anonymized or synthetic evaluation
  data only, unless separate consent and anonymization are documented.

## Legal Basis

The school/controller must state the chosen basis. The notice should include the
configured basis, for example:

- public task or legal obligation for school assessment and feedback;
- legitimate interests, where the school has completed an LIA and the interests
  are not overridden by students' rights and freedoms;
- consent only for optional processing where consent is freely given.

## AI Transparency Notice

Disclose:

- AI is used to assist OCR, task detection, feedback drafting, point suggestions,
  and annotation suggestions.
- AI output may be wrong, incomplete, or affected by handwriting/image quality.
- The teacher must review and confirm before the student sees feedback.
- Students can ask the teacher to explain or correct feedback.
- The system is not used to make solely automated final decisions.
- Logs are kept so the school can audit what happened.

Suggested Estonian app copy:

> See tagasiside on koostatud tehisintellekti abil ja õpetaja poolt üle
> vaadatud. AI võib eksida, eriti käsikirja, foto kvaliteedi või mitme
> lahendustee korral. Kui midagi tundub vale või ebaselge, küsi õpetajalt
> selgitust.

## Who Receives Data

- Teacher and authorized school staff.
- Student, but only after feedback is shared.
- MTU support staff only when needed and audited.
- Approved sub-processors listed in the register.
- eKool/Stuudium only if a real integration is later enabled and documented.

## Data Residency And Transfers

- Production database and file storage are intended to run in Convex EU West.
- Production AI calls are intended to use Azure OpenAI / Foundry Models with EU
  Data Zone or single EU region processing.
- If any provider causes residual transfers, the school notice and
  sub-processor register must explain the transfer and safeguards.

## Retention

Draft default:

- Raw uploads and crops: retained during review, then deleted after sharing or
  after the configured short retention period.
- Confirmed feedback and points: retained according to school assessment policy.
- Audit logs: retained for accountability according to school/MTU policy.

## Your Rights

Explain how students/guardians/teachers can request:

- access;
- correction;
- deletion where applicable;
- restriction;
- objection where legitimate interests is used;
- portability where applicable;
- human review/explanation/contest of significant decisions;
- complaint to the supervisory authority.

## Sources

- GDPR Articles 13 and 14:
  https://eur-lex.europa.eu/eli/reg/2016/679/oj
- EU AI Act:
  https://eur-lex.europa.eu/eli/reg/2024/1689/oj
