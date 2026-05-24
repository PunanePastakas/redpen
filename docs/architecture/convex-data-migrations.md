# Convex Data Migrations

Last reviewed: 2026-05-22

This guide is for production data shape changes in RedPen's Convex database. It is especially relevant for changes where old documents may still contain fields that new code no longer writes, such as the move from line-wise AI transcript output to task-wise transcript blocks.

## Principles

- Treat every migration as a privacy-sensitive operation. Do not log student work, names, grades, file contents, transcript text, or feedback text. Log counts, document IDs, schema versions, and hashes only when needed.
- Use an expand, migrate, contract sequence. First deploy code that can read both old and new shapes, then backfill old data, then remove old fields and old read paths after verification.
- Make migrations idempotent. Running the same migration twice should either do nothing on already-migrated documents or produce the same final shape.
- Prefer small batches. Convex mutations have execution limits, and large tables should be processed in resumable pages or with the Convex migrations component.
- Keep migration code server-side. Use internal Convex functions or the migrations component. Never run data transformations from browser code.
- Verify before and after. A migration is not done until counts show that old-shape documents are gone or intentionally retained.

## Convex Mechanics

Convex schema enforcement means old data must match the deployed schema. Safe schema evolution usually means:

- add new optional fields first;
- write new fields while reads still tolerate old fields;
- backfill old documents;
- remove old fields from documents;
- only then tighten validators or remove fallback code.

Convex `db.patch` shallow merges document changes. Setting a field to `undefined` removes that field:

```ts
await ctx.db.patch(documentId, { oldField: undefined })
```

Use `db.replace` only when intentionally rewriting the whole document. For RedPen migrations, prefer `db.patch` because it reduces the risk of accidentally dropping audit, ownership, or retention fields.

Indexes are created and backfilled during Convex deploy. Removing an index from the schema deletes it on deploy, so remove indexes only after code no longer queries them.

## Recommended Tooling

For small one-off migrations, an internal mutation with paginated reads is acceptable.

For repeated production migrations, prefer `@convex-dev/migrations`. Current Convex migration docs show this pattern:

- define one migration with `migrations.define({ table, migrateOne })`;
- export a runner with `migrations.runner(...)`;
- run it with `pnpm exec convex run migrations:runName`;
- use a `reset` argument only when intentionally rerunning a migration from the beginning;
- use `runToCompletion` in tests or controlled internal actions when a synchronous full run is useful.

This repository does not currently include `@convex-dev/migrations`; add it in the same PR as the first production migration that needs the component, along with a tiny test or staging runbook.

## Deployment Sequence

1. Expand readers and writers.
   New writes should produce the new shape. Reads should tolerate both the new shape and the legacy shape. For example, transcript rendering can prefer `transcription.tasks[]` and fall back to legacy `transcription.pages[].lines[]`.

2. Add verification functions.
   Add an internal query or mutation that reports counts of legacy-shape documents without returning sensitive content.

3. Run the migration in staging.
   Use synthetic or anonymized data. Confirm the migration is idempotent by running it twice and checking the second run changes zero documents.

4. Deploy to production with fallbacks still present.
   Run the production migration in batches. Watch Convex function errors, audit logs, and any teacher-facing analysis errors.

5. Verify production.
   Confirm old-shape counts are zero or documented exceptions. Spot-check only non-sensitive metadata unless a controlled privacy-approved support procedure exists.

6. Contract.
   Remove fallback code, tighten schemas, and delete migration code only after the production verification window passes.

## Current Transcript Cleanup

The grading analysis schema now uses task-wise transcription:

```ts
transcription: {
  tasks: [
    {
      stableKey: string,
      label: string,
      likelyTaskNumber: string | null,
      text: string,
      pageRefs: PageRef[],
      missingOrUnclearRegions: PageRef[]
    }
  ],
  unassignedText: string | null
}
```

Each grading task now carries:

```ts
taskTranscript: string
```

Legacy data may still contain:

```ts
transcription.pages[].lines[].rawText
transcription.pages[].lines[].normalizedMathLatex
taskReviews.transcription.transcriptExcerpt
```

### Migration Goal

- `studentWorks.fullTranscription` should contain `tasks[]` and `unassignedText`, not `pages[]`.
- `taskReviews.transcription` should contain `taskTranscript`, not `transcriptExcerpt`.
- Old line-wise fields should be removed after the new fields are present.

### Suggested Mapping

For each `studentWorks.fullTranscription` with legacy `pages[]`:

- find the work's `taskReviews`;
- for each review, use `review.transcription.stableKey` or `review.stableKey` as the new transcript task key;
- set the transcript task text from `review.transcription.taskTranscript` if already present, then `review.transcription.transcriptExcerpt` if present;
- if no task review transcript exists, group legacy `rawText` lines into `unassignedText`;
- preserve page references when available as `pageRefs`;
- carry any legacy `missingOrUnclearRegions` into the closest task when obvious, otherwise leave them on an unassigned or unclear transcript section.

For each `taskReviews.transcription` with legacy `transcriptExcerpt`:

- patch `taskTranscript` to the old `transcriptExcerpt`;
- patch `transcriptExcerpt` to `undefined` only after `taskTranscript` is present;
- leave all teacher-confirmed fields untouched.

### Verification Queries

The migration should report at least these counts:

- student works with `fullTranscription.pages`;
- student works with `fullTranscription.tasks`;
- task reviews with `transcription.transcriptExcerpt`;
- task reviews with `transcription.taskTranscript`;
- documents skipped because the shape was ambiguous.

Do not print transcript text in these reports.

### Rollback

Before the contract step, rollback is code-only: redeploy the version that still reads both shapes. Because the migration is destructive only when it removes old fields, keep the old fields until verification is complete.

If old fields have already been removed, rollback depends on backups or a separately retained export. Do not remove legacy fields in the same deploy that first introduces the new shape.
