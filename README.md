# RedPen

RedPen is a GDPR and EU AI Act-conscious AI-assisted mathematics grading
platform for Estonian teachers and students aged 13+.

The first implementation target is a desktop-first teacher workbench inspired by
PunanePastakas, backed by Convex in the EU region and an OpenAI API provider
adapter for the MVP. Azure OpenAI / Microsoft Foundry EU deployment remains the
later production-hardening path.

## Current MVP

This repository now contains a live empty-first MVP shell for phases 0-5 of the
implementation plan:

- Next.js App Router, React, TypeScript, Tailwind CSS, lucide-react, Convex,
  zod, OpenAI SDK, pdfjs-dist, KaTeX, and Excalidraw-compatible annotation
  dependencies.
- A dense teacher workbench that starts empty after login, then lets the teacher
  create a test, upload optional grading context, upload student work, run
  analysis, review/edit drafts, confirm results, share student links, and create
  mock exports.
- Convex schema and function surface for teacher-owned users, students, tests,
  uploads, student work, AI attempts, task reviews, confirmed results, invite
  tokens, audit logs, and retention events.
- RedPen-specific `GradingAnalysis` schemas, prompt builders, provider-neutral
  adapter types, Convex-side OpenAI Responses analysis with stored upload
  inputs, KaTeX-safe AI text rendering, and an OpenAI adapter that sets
  `store: false`.
- Guardrail scripts and tests for provider/region config, synthetic fixtures,
  token-scoped student access, retention policy, name matching, annotation
  geometry, and AI contracts.

When Convex is not configured, the UI shows a setup-required state. It no longer
fills the workbench with placeholder tests, students, works, or student links.
Synthetic data is reserved for tests, fixtures, and an explicit mock AI provider
mode.

## Local Development

Install dependencies:

```bash
pnpm install
```

The pnpm version is pinned in `package.json`. If `pnpm` is not available on your
machine yet, run `corepack enable pnpm` once and then retry `pnpm install`. The
root `pnpm-workspace.yaml` also commits the small native build-script allowlist
that pnpm needs for dependencies such as `sharp` and `esbuild`.

Start the Next.js app:

```bash
pnpm dev
```

Open the teacher workbench at `http://localhost:3000`.

To enable live Convex functions, create/configure a Convex project manually in an
EU region, then run:

```bash
pnpm dev:convex
```

This creates or connects the dev deployment and writes the local Convex values
used by the Next app. Keep the deployment in an EU region.

Set up native Convex Auth after the deployment exists:

```bash
pnpm setup:auth
```

The app uses Convex's native `@convex-dev/auth` password provider. You do not
need Clerk, Auth0, or a separate OIDC tenant for the MVP. The Convex Auth setup
command configures `SITE_URL`, `JWT_PRIVATE_KEY`, and `JWKS` for the Convex
deployment. `convex/auth.config.ts` uses Convex's deployment-provided
`CONVEX_SITE_URL`.

Configure OpenAI on the Convex backend, not in the Next app. The preferred MVP
model is `gpt-5.5`:

```bash
pnpm exec convex env set -- OPENAI_API_KEY "sk-..."
pnpm exec convex env set -- OPENAI_MODEL "gpt-5.5"
```

For local tests or demos that must not call OpenAI, explicitly enable the mock
provider on Convex:

```bash
pnpm exec convex env set -- REDPEN_AI_PROVIDER "mock"
```

Do not use the mock provider to evaluate real work. Without
`REDPEN_AI_PROVIDER=mock`, analysis requires `OPENAI_API_KEY`; missing provider
configuration is surfaced as an analysis error instead of synthetic success.

If your OpenAI project uses the Europe regional endpoint, set that on Convex as
well:

```bash
pnpm exec convex env set -- OPENAI_BASE_URL "https://eu.api.openai.com"
```

Use `--prod` with the same `pnpm exec convex env set` commands for production
deployments. Do not put OpenAI keys in `NEXT_PUBLIC_*` variables or commit them
to the repository.

Do not process real student work until the Convex deployment region, Convex Auth
settings, OpenAI project/data controls, DPIA decision, and sub-processor posture
are reviewed and documented.

## Synthetic Fixture Smoke Test

The public fixtures under `fixtures/synthetic/` are fabricated examples for
manual smoke testing only:

- `fixtures/synthetic/juhis.pdf` as grading context
- `fixtures/synthetic/1o.jpg` and `fixtures/synthetic/1v.jpg` as student work

With Convex/Auth configured, sign in, create a test, upload the PDF as grading
context, wait for guide task extraction to become ready, upload the two JPG
files as works, then run analysis. Guided analyses should use the same extracted
task structure for both JPG works, including expected guide tasks that are not
visible in the uploaded pages. Use `REDPEN_AI_PROVIDER=mock` for a no-OpenAI
smoke test, or a reviewed OpenAI backend configuration for a synthetic
live-provider smoke test.

## Environment

Copy `.env.example` to `.env.local` for local development. Important MVP
guardrails:

- `CONVEX_DEPLOYMENT_REGION` must be EU West/Ireland or a documented EU region.
- Convex Auth uses Convex's deployment-provided `CONVEX_SITE_URL` plus backend
  env vars `SITE_URL`, `JWT_PRIVATE_KEY`, and `JWKS`; there is no
  `CONVEX_AUTH_DOMAIN` when using native password auth.
- OpenAI runtime secrets belong in Convex backend env, not `.env.local`.
- `OPENAI_MODEL` defaults to `gpt-5.5` when not set on Convex.
- If you use OpenAI's Europe regional endpoint, set
  `OPENAI_BASE_URL=https://eu.api.openai.com` on Convex.
- Azure/Foundry variables are blocked until Phase 3b is implemented and reviewed.
- `RAW_FILE_RETENTION_DAYS` defaults to `14`, `DELETE_AFTER_SHARE_HOURS` to `24`,
  and `ABANDONED_DRAFT_RETENTION_DAYS` to `30`.

Check production-like configuration:

```bash
pnpm check:config
```

## Quality Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:fixtures
pnpm audit --prod
```

Shortcut:

```bash
pnpm check
```

## Public Repository Hygiene

This repository is AGPL-3.0-only and public-collaboration safe by default.

- Never commit real student work, classroom exports, raw student screenshots, or
  secrets.
- Keep fixtures synthetic or explicitly anonymized.
- Use `pnpm test:fixtures` before committing changes that touch fixtures,
  screenshots, docs, or public assets.
- Do not paste real student work into AI tools, GitHub issues, screenshots, docs,
  benchmark commits, or support tickets.

## Documentation

- [System model and architecture](docs/architecture/system-model.md)
- [MVP PRD](docs/prd/mvp-prd.md)
- [MVP implementation plan](docs/plans/2026-05-20-001-feat-ai-assisted-grading-mvp-plan.md)
- [Compliance document outlines](docs/compliance/)
