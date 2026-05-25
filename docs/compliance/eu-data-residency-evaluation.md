# EU Data Residency Evaluation

Status: evaluation draft  
Date: 2026-05-25  
Scope: refactored RedPen MVP repository, not a live production audit

## Executive Summary

RedPen is designed to be made EU-resident, but the refactored MVP cannot yet be truthfully described as "everything in the EU" for production student data without further provider and deployment work.

The strongest current evidence is positive: the architecture requires Convex EU West, stores uploaded originals in Convex storage, logs AI attempts with endpoint and residency metadata, keeps model calls in Convex actions, uses `store: false`, and already blocks public OpenAI keys and Azure variables in the Next runtime.

The main blocker is the active provider implementation. The MVP path still uses direct OpenAI-compatible Responses calls through `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and `OPENAI_MODEL`. Azure OpenAI / Microsoft Foundry EU deployment is explicitly documented as a later production-hardening path and is blocked by `validateRuntimeConfig` until Phase 3b exists. Therefore the repo is EU-ready in architecture, but not yet production-ready for a strict EU-only student-data claim.

## Evidence Checklist

| Surface | Current repo evidence | Status | Risk | Required action |
| --- | --- | --- | --- | --- |
| Convex database/functions/storage | `.env.example` sets `CONVEX_DEPLOYMENT_REGION=eu-west-1`; `lib/config.ts` fails closed for non-EU Convex regions; architecture names "Convex EU West deployment". | EU-ready if deployed as configured | Account-level deployment region must be verified outside the repo. Existing Convex deployments cannot be region-switched in place. | Create or verify the Convex deployment in EU West/Ireland before any real student pilot; record the deployment URL and region in the DPIA/subprocessor register. |
| Browser uploads and raw files | `convex/uploads.ts` uses `ctx.storage.generateUploadUrl()` and records `storageId`, hashes, role, retention state, and `deleteAfter`. | EU-ready if Convex is EU | Raw files stay in Convex storage until retention jobs actually delete them. | Keep direct browser-to-Convex uploads; verify retention deletion implementation and scheduled cleanup before real data. |
| AI inference provider | `convex/aiActions.ts` defaults to `OPENAI_BASE_URL || "https://api.openai.com"`, `OPENAI_MODEL || "gpt-5.5"`; `store: false` is set for guide extraction and work analysis. | Needs provider replacement/configuration | Default direct OpenAI global endpoint is not enough for a strict EU-only claim. `store: false` is not the same as EU-only processing. | Implement Phase 3b Azure/Foundry provider support and require Azure OpenAI/Foundry `DataZoneStandard` in the EU data zone or `Standard` in a single EU region for production student data. |
| Azure OpenAI / Foundry | `docs/architecture/system-model.md` requires Data Zone/single EU region and prohibits global deployment types; `docs/prd/mvp-prd.md` says production AI calls use Azure OpenAI / Foundry Models EU Data Zone or single EU region. `lib/config.ts` currently blocks `AZURE_OPENAI_` and `FOUNDRY_` vars until Phase 3b. | Not implemented | Operators could assume Azure is already wired because docs mention it, but runtime blocks it. | Add provider configuration for Azure endpoint, deployment name, API version, and deployment type; add tests that reject Global/GlobalStandard for production. |
| Direct OpenAI regional endpoint | README mentions `OPENAI_BASE_URL=https://eu.api.openai.com` for OpenAI Europe regional endpoint. `aiAttempts.dataResidencyRegion` is set to `europe` only for that exact endpoint. | Needs vendor/account confirmation | OpenAI Europe endpoint availability and controls depend on organization/project eligibility and data-control settings. | Treat direct OpenAI Europe as development or fallback only unless legal/vendor review confirms eligibility, residency, retention, abuse monitoring, and DPA posture. |
| Vercel/Next runtime region | `next.config.ts` has no `preferredRegion`; `proxy.ts` runs Convex Auth middleware in Next. README has `FRONTEND_RUNTIME_REGION=eu-west-1`, but it is only checked when `RAW_FILE_PROXY_ENABLED=true`. | Needs deployment configuration | Next middleware/server runtime could execute outside the EU depending on hosting settings. | Pin Vercel functions/middleware to an EU region such as `fra1` or avoid raw-file handling in Next entirely; document the hosting provider and runtime region in the subprocessor register. |
| Server-side file proxying | Current architecture prefers direct Convex storage upload; no app API upload route was found in the tracked file list. | Mostly EU-ready | If future upload proxy routes are added, they could become hidden processors of raw files. | Keep upload flow browser-to-Convex; if a proxy is introduced, require EU runtime pinning and no raw-file persistence. |
| AI attempt audit metadata | `convex/schema.ts` stores `provider`, `endpoint`, `dataControlMode`, optional `dataResidencyRegion`, model, versions, purpose, status, and input/output hashes. | EU-ready audit foundation | It records claimed endpoint/region metadata but does not itself enforce provider terms. | Keep this metadata, add Azure deployment type/API version, and make production config checks fail for global deployments. |
| Retention defaults | `.env.example` sets raw file retention to 14 days, shared deletion to 24 hours, abandoned drafts to 30 days; `lib/retention-policy.ts` enforces those calculations. | Policy-ready | Repository evidence does not prove scheduled deletion is active in a deployment. | Verify scheduled cleanup jobs and storage deletion audit before real student work. |
| Optional RAG/knowledge | Architecture describes runtime retrieval as optional and not the first implementation. No active RAG dependency is in `package.json`; no embedding provider path was found. | Not in hot path | Future RAG could add non-EU embedding/vector providers. | Keep out of production student-data path until the embedding/vector store is EU-bound and in the subprocessor register. |
| Error monitoring/analytics/email | Subprocessor outline marks email, monitoring, analytics, and frontend hosting as TBD/optional. | Unknown | These services can leak metadata or student content through logs, screenshots, email bodies, or traces. | Do not enable them for real student data until each is listed with DPA, EU residency/transfer terms, and log-scrubbing rules. |
| Public repository hygiene | README says never commit real student work or secrets; `scripts/scan-real-student-data.ts` exists and `pnpm test:fixtures` is documented. | EU-ready public-repo guardrail | Repo hygiene is necessary but separate from runtime residency. | Continue synthetic-only fixtures and secret scanning before commits. |

## Required Production Configuration For "Everything In The EU"

1. **Convex**
   - Use a Convex deployment created in EU West/Ireland.
   - Set `CONVEX_DEPLOYMENT_REGION=eu-west-1` or another documented EU value accepted by `lib/config.ts`.
   - Store originals, derived pages/crops, review state, audit logs, and retention events only in that deployment.

2. **AI provider**
   - Implement the planned Azure OpenAI / Microsoft Foundry provider path before production student-data processing.
   - Use one of these production deployment modes:
     - Azure OpenAI / Foundry `DataZoneStandard` in the EU data zone; or
     - Azure OpenAI / Foundry `Standard` in a single EU region when stricter single-region processing is required.
   - Explicitly reject `Global`, `GlobalStandard`, and other global deployment types for real student data.
   - Keep `store: false` or the Azure equivalent/no-training posture, but do not rely on `store: false` alone as a residency guarantee.

3. **Next/Vercel hosting**
   - Pin any server-side Next runtime, middleware, or upload proxy to an EU region such as `fra1`, or keep raw-file handling entirely in direct browser-to-Convex flows.
   - Record the hosting provider, region, logs, and support access model in the subprocessor register.

4. **Retention and deletion**
   - Verify scheduled deletion of raw uploads and derived artifacts according to `RAW_FILE_RETENTION_DAYS`, `DELETE_AFTER_SHARE_HOURS`, and `ABANDONED_DRAFT_RETENTION_DAYS`.
   - Keep teacher-confirmed feedback and audit records under a separate documented policy.

5. **Operational subprocessors**
   - Do not enable analytics, error monitoring, email, or export integrations for real student data until the subprocessor register has entity, DPA, residency, transfer mechanism, retention, and breach-notice details.

## Provider-Specific Findings

### Convex

The repo is already strongly aligned with an EU Convex posture. The configuration guard requires an EU Convex region, uploads go to Convex storage, and the architecture says the Convex deployment must be EU West/Ireland. This must still be verified against the actual Convex project because the repository cannot prove account-level deployment region or migration state.

### Azure OpenAI / Microsoft Foundry

Azure/Foundry is the right production direction for a strict EU deployment, but it is not wired yet. `lib/config.ts` deliberately blocks `AZURE_OPENAI_` and `FOUNDRY_` variables until Phase 3b, which is a good fail-closed guardrail. Phase 3b should add explicit deployment-type configuration so production checks can distinguish `DataZoneStandard` or regional `Standard` from prohibited `GlobalStandard` deployments.

### Direct OpenAI

The active MVP OpenAI path can be useful for synthetic development and controlled tests. For real student data, the default `https://api.openai.com` endpoint is not enough for an EU-only claim. Even `https://eu.api.openai.com` should be treated as conditional until the OpenAI project is verified for Europe data residency, no-training/data controls, DPA terms, and abuse-monitoring behavior.

### Vercel / Frontend Hosting

The repo does not currently pin Next runtime placement in code. That is acceptable for local development, but a production deployment must pin middleware/server execution to EU infrastructure or avoid processing raw files in Next. Since `proxy.ts` runs Convex Auth middleware, session/auth metadata may still pass through the frontend host even when raw file uploads go directly to Convex.

## Unknowns Requiring Account Or Vendor Verification

- Actual Convex deployment URL, region, backup region, and support access posture.
- Actual production hosting provider and function/middleware runtime region.
- Whether real uploads ever pass through Next server routes, logs, previews, screenshots, support tools, or analytics.
- Azure tenant, Azure OpenAI/Foundry resource region, deployment type, model quota, content filtering/logging settings, DPA, and EU Data Boundary configuration.
- If using direct OpenAI, project eligibility for Europe data residency and exact data-control/retention terms.
- Whether retention cleanup is scheduled and audited in the live Convex deployment.
- Email, monitoring, analytics, and any school-system export subprocessors.

## Recommended Implementation Sequence

1. Keep the current fail-closed config guardrails.
2. Add Phase 3b Azure/Foundry provider configuration and tests:
   - endpoint/resource URL;
   - deployment name;
   - API version;
   - deployment type (`DataZoneStandard`, `Standard`, etc.);
   - region/data zone metadata;
   - hard failure for global deployment types in production/real pilot mode.
3. Pin or document EU runtime placement for Next middleware/server routes.
4. Run `pnpm check:config`, `pnpm test:config`, and a synthetic live-provider smoke with the production-like EU provider.
5. Complete the subprocessor register, DPIA decision, DPA outline, and technical documentation evidence before any real student pilot.

## Current Verdict

**Not production-ready for a strict "everything in the EU" claim yet.**

**EU-ready architecture:** yes.  
**EU-ready Convex path:** yes, if the actual deployment is EU West/Ireland.  
**EU-ready AI path:** not yet; Azure/Foundry Phase 3b is required.  
**EU-ready frontend hosting:** unknown until Vercel/hosting region is pinned and verified.  
**Safe for synthetic development:** yes, with the existing mock/direct OpenAI guardrails.

No secrets are included in this evaluation.
