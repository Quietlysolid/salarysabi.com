# Verification fixes — 24 September 2026

This follows the failures recorded in [the platform verification report](platform-verification-2026-09-24.md). That report remains the original baseline.

## Changes

- Upgraded Next.js and its ESLint configuration to 16.3.6, OpenNext Cloudflare to 1.20.6, Sharp to 0.35.4, and Vitest to 4.1.11. Updated the vulnerable transitive js-yaml package. Full dependency audit now reports zero advisories.
- ATS imports validate provider payloads before saving a complete eligible-job snapshot. Import batches commit inserts and cursor progress together. Cleanup uses a literal board prefix and batches of 100; it never deletes published or verified listings. Exclusive, expiring claims fence late workers. Provider requests stop after eight seconds, database requests after five, and each invocation starts work only within a 20-second budget. Interrupted imports continue from their saved snapshot. Feeds above 8 MB or 10,000 jobs fail explicitly without cleanup.
- Freshness checks claim due jobs atomically and persist outcomes before counting them. Healthy jobs are due again after 24 hours; temporary failures after one hour. Expired claims can be resumed, with old tokens rejected. An invocation handles at most 20 records and starts no new work after 20 seconds.
- Both maintenance schedules now run every five minutes to drain resumable work. Each source retains its own 24-hour due date. Import errors back off for 15 minutes. An administrator can request a specific source, with a one-minute cooldown after completion or failure.
- The legacy salary RPC keeps its old response shape but delegates to the current distinct-report, recency and publication rules.
- Supabase's password minimum is eight characters in both staging and production, matching the UI.
- Unsafe jobs API pagination returns HTTP 400 before reading the database.
- Admin sign-in heading contrast is corrected with a scoped white-text rule. Fixture dates are fixed so server rendering and browser test clocks agree.
- Browser assertions now exercise current audience links, calculator handoff, privacy disclosures, payroll limitations and intentional redirects, rather than removed UI.

## Database and worker evidence

Migrations `202609240018` and `202609240019` were applied to staging, exercised, and then applied to production. Routine definition hashes match between the projects. Both new maintenance tables have RLS enabled; none of the six maintenance RPCs can be executed by anonymous or ordinary authenticated users.

Local handlers with real staging PostgREST passed:

- All 260 freshness fixtures checked once across 13 bounded batches.
- Ten overlapping freshness invocations counted one observation.
- Injected persistence failure returned HTTP 503 with zero successful checks.
- Cleanup removed all 1,005 obsolete drafts.
- Malformed feeds and provider 503 responses returned errors without deleting valid drafts.
- A board key containing an underscore could not delete another board's drafts.
- Valid vacancies entered as pending drafts; repeat imports did not duplicate them; published records survived cleanup.
- A lost response after a committed 50-job batch preserved the cursor. Ten overlapping resumptions finished 1,005 jobs without duplicates or refetching the changed provider feed.
- Expired freshness leases were reclaimed; old tokens were rejected; successful jobs were not immediately claimed again.
- Slow freshness batches finished in about 24.5 seconds; stalled ATS requests stopped in about 8.5 seconds.

A temporary, staging-only Supabase Edge probe generated from the same handlers repeated the overlap, 260-job backlog, 1,005-job snapshot, and slow-provider tests. All assertions passed. Slow freshness work took 24.357 seconds; a stalled ATS request returned 503 after 8.191 seconds. External provider responses were simulated; the database and Edge runtime were real. Synthetic records and the deployed probe were removed afterward. No test emails were sent.

The production scheduler's actual commands queued requests 163 and 164. Both returned HTTP 200 without timeout: one ATS board was read (two jobs, neither salary-eligible), while no freshness records were due. Both schedules were restored to active after the worker replacement. This live check verifies deployment and scheduling, not production-scale load; scale and fault injection were tested in staging.

The salary privacy regression returned no public group for five identical reports through either endpoint. Six-character signup-link creation was rejected with HTTP 422 after the server policy update; no email was sent.

## Frontend verification

The complete Playwright suite passed all 66 desktop/mobile cases in one clean run (10.6 minutes). Final lint, TypeScript and all 130 unit tests across 18 files passed after the last source change. Browser evidence is in `D:/SalarySabi-audit-20260924/playwright-final.json`.

The final Cloudflare/OpenNext build passed and was deployed to `salarysabi.com` and `www.salarysabi.com`, preserving live variables. Release version: `34c8ad65-04f3-4882-b669-8960cd0bb784`.

Live smoke checks passed all 12 entry routes, the legacy audience redirect, required-field validation, hiring sign-in, mobile reflow and jobs API, without browser exceptions. All 13 production boundary checks passed, including HTTP 400 for extreme pagination, rejected malformed/cross-origin analytics and HTTP 404 for test-only/nonexistent routes. The 33 generated client JavaScript bundles contain neither project's service-role key nor the staging project reference.

All 62 live route/viewport scans passed (31 routes at 1440 and 390 pixels): no definite axe WCAG A/AA violations, horizontal overflow, page exceptions, missing security headers or landmark/title failures. Both admin contrast regressions are resolved. Axe still reports 48 rule/route entries needing manual review; passing this automated sweep is not a claim of complete accessibility conformance. Evidence: `test-results/public-surface/results.json`.

The final live link sweep passed all 30 collected internal destinations, including redirects and fragment targets, and all 10 tax-tool card navigations (five tools on desktop and mobile). Evidence: `supabase/.temp/live-link-results.json`. The local development server was restored on port 3000 after deployment.

Already passed: 130 unit tests, TypeScript, lint, optimized staging build (38 pages), and Cloudflare/OpenNext build. The admin entry page passed automated contrast and layout checks at 1440 and 390 pixels. Fresh staging tests also passed account isolation, salary moderation, the desktop/mobile hiring-to-pay journey, payroll draft/final exports and immutable history, saved jobs, alerts and password recovery. The full real submission-to-publication browser test passed against optimized staging on port 3001. Its earlier development-server attempts were interrupted by Next Fast Refresh during concurrent route compilation; they are not counted as passing runs.

## Reproduction and evidence

- `python scripts/run-staging-alert-stress.py scripts/verify-scheduled-workers.mjs`
- Additional worker cases: `SCHEDULED_WORKER_CASE=ats-extra`, `ats-timeout`, `ats-cleanup`, or `resilience`.
- `python scripts/prepare-maintenance-edge-probe.py` generates the guarded staging probe. Deploy it only to staging, run `scripts/verify-maintenance-edge.mjs` through the staging launcher, then delete the deployed probe and generated files.
- `python scripts/verify-staging-legacy-surface.py`
- `node node_modules/@playwright/test/cli.js test --config scripts/playwright-staging.config.ts`
- Worker and deployment JSON: ignored `supabase/.temp/*maintenance*`, `scheduled-worker*-results.json`, and `legacy-surface-results.json`.
- Final dependency audit: `D:/SalarySabi-audit-20260924/npm-audit-fixed.json`.

No simulated vacancies or accounts were created in production. Production maintenance processed only configured real sources. The original report's limits still apply: this work is not an independent tax review, exhaustive penetration test, screen-reader certification, backup-restoration exercise or guarantee of third-party availability.
