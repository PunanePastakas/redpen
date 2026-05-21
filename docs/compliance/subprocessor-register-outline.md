# Sub-Processor Register Outline

Status: draft outline
Date: 2026-05-20

This register must be completed before production use and kept current.

| Sub-processor | Purpose | Data categories | Production residency requirement | Status |
| --- | --- | --- | --- | --- |
| Convex | Database, backend functions, file storage, auth/session data if Convex Auth is used | Accounts, tests, files, task reviews, audit logs | EU West (Ireland) deployment | Required |
| Microsoft Azure OpenAI / Foundry Models | AI inference for OCR, task analysis, feedback and annotation drafts | Cropped work images, instruction context, pseudonymized metadata, AI outputs | EU Data Zone or single EU region; no Global deployment types | Required |
| Frontend hosting provider | Website/app delivery and optional serverless routes | Account/session metadata; raw files only if upload proxy is used | EU runtime/region; prefer no raw file persistence | TBD |
| Email provider | Magic links, account notifications, parent/school notices if enabled | Email address, message metadata, notification content | EU-compatible processing and DPA | TBD |
| Error monitoring | Operational errors and performance diagnostics if enabled | Pseudonymized logs; no raw student work | EU region or no student content | Optional |
| Analytics | Product usage if enabled | Aggregated/pseudonymized usage events | No student work; documented opt-out if needed | Optional |
| eKool/Stuudium | Future grade export | Student identifiers, grade/points if real integration is enabled | Not in MVP; mock only | Future |

## Register Fields To Add For Each Approved Sub-Processor

- legal entity and address;
- DPA link/status;
- security documentation;
- data residency statement;
- international transfer mechanism;
- breach notification commitment;
- retention/deletion terms;
- support/admin access restrictions;
- date approved by controller/MTU;
- date last reviewed.

## Deployment Guardrails

- Do not enable optional sub-processors until they are listed here.
- Do not send student work to analytics or public error monitoring.
- Do not enable global AI deployment types for production student data.
- Do not enable real eKool/Stuudium export until the integration has a separate
  DPIA update and sub-processor/controller analysis.
