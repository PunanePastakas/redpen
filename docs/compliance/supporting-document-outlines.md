# Supporting Compliance Document Outlines

Status: draft
Date: 2026-05-20

This file maps the supporting documents that should live in the repository for
school review, DPO review, implementation, and public collaboration.

`docs/compliance/DPIA-draft.md` was moved from the repository root. It currently
uses a direct OpenAI EU endpoint framing in several places. Before production,
align it with the target architecture in
[../architecture/system-model.md](../architecture/system-model.md): Convex EU
West storage plus Azure OpenAI / Foundry Models EU Data Zone or single EU region
inference.

## Document Set

- `DPIA-draft.md`: Data Protection Impact Assessment, including LIA, risk
  register, data flow diagram, and sub-processor register or link.
- `dpa-for-schools-outline.md`: Article 28 DPA outline for schools/teachers.
- `privacy-and-ai-transparency-notice-outline.md`: user-facing privacy notice
  plus AI transparency notice.
- `ai-act-technical-documentation-outline.md`: AI Act technical documentation,
  including audit trail spec.
- `template-notification-pack-outline.md`: ready-made text for school DPOs,
  teachers, parents, and students.
- `subprocessor-register-outline.md`: living table of processors and hosting
  providers.

## Controller And Processor Assumption

Default hosted-service assumption:

- School or teacher/school as organization: controller for student/teacher data
  and educational assessment decisions.
- MTU administering RedPen: processor acting under documented instructions from
  the school/controller.
- Microsoft Azure OpenAI, Convex, hosting provider, email provider, analytics or
  monitoring provider if enabled: sub-processors of the MTU, unless the school
  contracts with them directly.

If RedPen is offered directly to individual teachers outside a school agreement,
the role analysis must be revisited before production use.

## Lawful Basis Notes

The documentation should not hard-code one lawful basis for every school. It
should provide controller-selectable language and require the school/DPO to
confirm:

- public task / legal obligation where school law supports processing for
  assessment and feedback;
- legitimate interests where appropriate, with the LIA completed before use and
  special attention to children;
- consent only where it is freely given and not used to bypass imbalance in
  school contexts.

Regardless of lawful basis, the MVP should keep the strongest safeguards:
teacher review, no autonomous decision, data minimization, retention limits,
student rights workflow, and clear AI disclosure.

## Sources

- GDPR: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- EU AI Act: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
- Estonian Data Protection Inspectorate, legitimate interest:
  https://www.aki.ee/oigustatud-huvi
- Estonian Data Protection Inspectorate, DPIA checklist:
  https://www.aki.ee/lisa-1-andmekaitsealase-mojuhinnangu-tegemise-kontrollnimekiri
