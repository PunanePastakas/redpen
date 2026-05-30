# Deployment Evidence Checklist

Status: draft evidence template  
Date: 2026-05-30  
Scope: real pilot readiness evidence, not a live production audit

## Purpose

This checklist records the deployment evidence required before RedPen processes real student work. It implements Phase 1 of the real pilot readiness roadmap: prove that the configured runtime matches the EU-first architecture.

Do not mark this checklist complete from repository configuration alone. Each item needs account, vendor, deployment, or test-run evidence from the actual pilot environment.

## Evidence Rules

- Store evidence links or file references in the private compliance workspace, not in the public repository when they include account IDs, tenant IDs, screenshots with sensitive data, contracts, or support contacts.
- Record the reviewer, date, source system, and decision for every approved evidence item.
- Do not enable real student processing while any required item is missing, ambiguous, or contradicted by runtime configuration.
- Treat AI-generated summaries as drafting aids only. A human owner must verify the source evidence.

## Required Evidence Summary

| Area | Required before pilot | Evidence owner | Status |
| --- | --- | --- | --- |
| Convex | EU deployment, storage/functions/database region, auth setup, support posture | Human deployment owner | Not started |
| Azure OpenAI | EU Data Zone or single EU region, deployment type, content logging disabled, no-training/DPA posture | Human deployment owner + legal/DPO | Not started |
| Frontend hosting | EU runtime/logging posture for middleware/functions and no raw-file proxying outside EU | Human deployment owner | Not started |
| Runtime config | Production-like config checks pass with pilot variables | Developer | Not started |
| Synthetic smoke | Full synthetic workbench flow passes through reviewed deployment/provider path | Developer + pilot owner | Not started |
| Compliance record | Evidence attached to DPIA/subprocessor/DPA/technical documentation records | Legal/DPO owner | Not started |

## Convex Evidence

Required proof:

- [ ] Deployment URL and deployment name are recorded privately.
- [ ] Deployment region is EU West/Ireland or another documented EU region accepted by `lib/config.ts`.
- [ ] Database, functions, file storage, auth/session data, audit logs, and retention events are in the same approved deployment region.
- [ ] Existing deployment was created in the approved region; no region migration assumption is being made.
- [ ] Convex Auth setup is complete for the pilot environment.
- [ ] Support/admin access posture is documented for the subprocessor register.
- [ ] Backup, restore, and incident-support posture is recorded or explicitly marked as a residual risk for DPO review.

Repository checks to run:

```bash
pnpm check:config
pnpm test:config
```

Evidence to attach privately:

- Convex dashboard region proof.
- Convex deployment URL.
- Auth setup confirmation.
- Support/access and DPA references.

## Azure OpenAI Evidence

Required proof:

- [ ] `REDPEN_AI_PROVIDER=azure_openai` is selected for real-student use.
- [ ] Azure resource endpoint is recorded privately.
- [ ] Deployment names are recorded for analysis and guide task-model extraction.
- [ ] API version is recorded.
- [ ] Region or data zone is EU-only for the chosen pilot posture.
- [ ] Deployment type is `DataZoneStandard`, `Standard`, or another reviewed non-global EU-safe type accepted by `lib/config.ts`.
- [ ] Global or non-EU deployment types are not used.
- [ ] Content logging is disabled for the deployment posture used with student data.
- [ ] No provider-side training/storage commitments are documented in the DPA or vendor terms.
- [ ] Model quota and rate limits are sufficient for the pilot without forcing fallback to an unapproved provider.
- [ ] Content filtering, abuse monitoring, and support escalation behavior are reviewed for student-work risk.

Repository checks to run:

```bash
pnpm check:config
pnpm test:config
pnpm test:ai-contracts
```

Evidence to attach privately:

- Azure resource region/data-zone proof.
- Deployment type proof.
- Content logging setting proof.
- DPA/vendor terms reference.
- Model/deployment name mapping.

## Direct OpenAI Fallback Decision

Direct OpenAI must remain development or synthetic-only unless a separate legal/vendor review approves it for real student data.

- [ ] If `REDPEN_AI_PROVIDER=openai` is proposed for real student data, legal/DPO review explicitly approves the OpenAI project, regional endpoint, DPA posture, data controls, abuse-monitoring behavior, and retention terms.
- [ ] If that review is not complete, direct OpenAI is blocked for real student work.
- [ ] No automatic fallback can route real student work from Azure OpenAI to direct OpenAI.

## Frontend Hosting Evidence

Required proof:

- [ ] Hosting provider and project are recorded privately.
- [ ] Runtime region for middleware, server functions, and any server-side route is EU-based or the route is proven not to process raw student files.
- [ ] Logging retention and log content rules are documented.
- [ ] Support/admin access posture is documented.
- [ ] No raw file upload proxy is enabled outside the approved EU runtime.
- [ ] `RAW_FILE_PROXY_ENABLED` and `FRONTEND_RUNTIME_REGION` match the actual deployment posture.
- [ ] Error monitoring, analytics, and email providers are disabled or listed in the subprocessor register before real student data is processed.

Repository checks to run:

```bash
pnpm check:config
pnpm test:config
```

Evidence to attach privately:

- Hosting runtime region proof.
- Logging configuration proof.
- Raw-file routing statement.
- Support/access terms.

## Environment Snapshot

Record the exact pilot environment values without secrets:

| Key | Expected pilot posture | Recorded value |
| --- | --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | Pilot Convex deployment URL | TBD |
| `CONVEX_DEPLOYMENT_REGION` | EU West/Ireland or approved EU region | TBD |
| `REDPEN_AI_PROVIDER` | `azure_openai` unless separately approved | TBD |
| `AZURE_OPENAI_ENDPOINT` | Private Azure endpoint reference, not public docs | Recorded privately |
| `AZURE_OPENAI_API_VERSION` | Reviewed API version | TBD |
| `AZURE_OPENAI_DEPLOYMENT` | Reviewed deployment name | Recorded privately |
| `AZURE_OPENAI_ANALYSIS_DEPLOYMENT` | Optional reviewed deployment name | Recorded privately |
| `AZURE_OPENAI_TASK_MODEL_DEPLOYMENT` | Optional reviewed deployment name | Recorded privately |
| `AZURE_OPENAI_REGION` | EU region or EU data zone | TBD |
| `AZURE_OPENAI_DEPLOYMENT_TYPE` | Non-global EU-safe deployment type | TBD |
| `AZURE_OPENAI_CONTENT_LOGGING_DISABLED` | `true` | TBD |
| `REAL_STUDENT_PILOT_MODE` | `true` only after approval | TBD |
| `DPIA_DECISION_PATH` | Approved DPIA decision reference | TBD |
| `RAW_FILE_RETENTION_DAYS` | No more than 14 for MVP default | TBD |
| `DELETE_AFTER_SHARE_HOURS` | No more than 24 for MVP default | TBD |
| `ABANDONED_DRAFT_RETENTION_DAYS` | No more than 30 for MVP default | TBD |
| `RAW_FILE_PROXY_ENABLED` | `false` unless explicitly reviewed | TBD |
| `FRONTEND_RUNTIME_REGION` | EU runtime when server routes are relevant | TBD |

Never record API keys, JWT private keys, JWKS values, tenant secrets, or production access tokens in this file.

## Synthetic Live-Provider Smoke

Run only with synthetic fixtures until this checklist is approved.

Scenario:

1. Sign in as a pilot test teacher.
2. Create a test.
3. Upload `fixtures/synthetic/juhis.pdf` as grading context.
4. Wait for guide task extraction to become ready.
5. Upload `fixtures/synthetic/1o.jpg` and `fixtures/synthetic/1v.jpg` as student works.
6. Run analysis through the reviewed provider path.
7. Confirm that guided analyses use the same expected task structure.
8. Review and confirm one synthetic result.
9. Share the result and verify student invite access is limited to that result.
10. Record AI attempt metadata: provider, endpoint class, deployment/model, region/data posture, prompt version, schema version, and status.

Pass condition:

- [ ] The flow completes without synthetic-data fallback, real student data, unapproved providers, or raw-file proxying outside the approved environment.
- [ ] `aiAttempts` metadata matches the approved provider evidence.
- [ ] No logs or screenshots include real student work.

## Required Commands

Run these from the repository root against the pilot configuration or the closest production-like local configuration:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:config
pnpm test:ai-contracts
pnpm test:fixtures
pnpm check:config
pnpm build
```

For each command, record:

- command;
- date/time;
- environment name;
- commit SHA;
- pass/fail;
- output artifact location if retained.

## Approval Record

| Gate | Required approver | Decision | Date | Evidence reference |
| --- | --- | --- | --- | --- |
| Convex deployment evidence | Deployment owner | TBD | TBD | TBD |
| Azure OpenAI evidence | Deployment owner + legal/DPO | TBD | TBD | TBD |
| Frontend hosting evidence | Deployment owner | TBD | TBD | TBD |
| Runtime config checks | Developer | TBD | TBD | TBD |
| Synthetic live-provider smoke | Developer + pilot owner | TBD | TBD | TBD |
| Compliance attachment | Legal/DPO owner | TBD | TBD | TBD |

## Exit Gate

Phase 1 is complete only when all required evidence is approved, all required commands pass, the synthetic live-provider smoke passes, and the compliance record links to the approved evidence. Until then, RedPen remains safe for synthetic development only.

## References

- `docs/plans/2026-05-30-001-roadmap-real-pilot-readiness.md`
- `docs/compliance/eu-data-residency-evaluation.md`
- `docs/compliance/subprocessor-register-outline.md`
- `docs/compliance/DPIA-draft.md`
- `docs/compliance/ai-act-technical-documentation-outline.md`
- `README.md`
- `.env.example`
