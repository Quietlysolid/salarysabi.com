# Platform verification — 24 September 2026

Remediation is tracked in [Verification fixes](platform-remediation-2026-09-24.md). The findings below are the original audit baseline.

Status: **not all checks pass**. This is a broader verification pass, not a release certification. The main user journeys work in the tests below, but scheduled imports/freshness checks and legacy endpoints have confirmed defects. No product fixes or production deployments were made during this pass.

## Confirmed findings, in priority order

### 1. Installed dependencies have security advisories

`npm audit --omit=dev --json` reports one critical package (`next` 16.2.12) and one high package (`sharp` 0.35.3). These are package advisory severities, not proof that an attacker can exploit the production deployment.

- [Next.js Windows-hosted server advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36): affected 16.x versions below 16.3.3. The local development environment is Windows; production is Cloudflare Workers.
- [Next.js AVIF image-optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4): patched in 16.3.3. This repository configures `images.unoptimized: true`; no exploit was attempted.
- [Sharp/libheif advisory](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c): affected below 0.35.4 when processing untrusted input. The repository explicitly overrides Sharp to 0.35.3.

Action: update compatible Next.js/ESLint/OpenNext dependencies and the Sharp override, then repeat build, route and deployment checks. Do not interpret successful functional tests as resolving these advisories.

### 2. ATS cleanup can remove the wrong drafts

Real staging database tests executed the unchanged `import-ats-jobs` handler with simulated provider responses:

- Provider returned an unexpected object instead of a jobs array. The handler treated it as an empty board and deleted the existing unverified test draft, returning HTTP 200.
- A source key containing `_` matched a different board through SQL `LIKE` wildcard semantics. Cleanup deleted that other board's test draft.
- With 1,005 obsolete drafts, cleanup returned `Bad Request`, deleted zero records and still returned HTTP 200. The selection also lacks pagination and the deletion constructs a large `in` request.
- A provider 503 was included in the response body but the worker still returned HTTP 200.
- One provider response delayed 65 seconds produced a 65.650-second handler run, beyond the scheduler's 60-second HTTP timeout.

Positive controls passed: a valid salary-bearing vacancy becomes a pending draft, a sequential repeat does not duplicate it, and cleanup preserves published/verified records.

Action: validate complete provider payloads before cleanup; use exact board ownership; paginate and batch deletions; add durable claims, bounded continuation and provider deadlines; surface failures through HTTP status and monitoring.

### 3. Freshness checks miss records and mishandle overlaps/failures

Real staging tests of the unchanged `check-stale-jobs` handler found:

- Two runs over 260 published imported jobs repeatedly checked the first 250; ten remained unchecked.
- An injected database write failure returned HTTP 200 and `healthy: 1`, although no availability timestamp was saved.
- Ten concurrent checks of one temporarily unavailable job raised its failure count to three and changed it to draft. Concurrent executions should not turn one scheduled observation into several failures.
- Six simulated 10.5-second provider calls took 63.918 seconds. Each call is individually below its 12-second deadline, but the batch exceeds the scheduler timeout.

Action: claim due records atomically, persist continuation and next-check times, prevent concurrent checks of the same record, bound each run, and check every write result.

Downloaded production function bundles contain the corresponding fixed-limit/loop/cleanup code. Load and injected-failure tests were performed against staging, not production or external employers' servers.

### 4. Legacy salary aggregation bypasses the distinct-report threshold

Five identical approved test reports were suppressed by `public_recent_salary_benchmarks`, but anonymous access to the older `public_salary_benchmarks` returned a group with `sample_size: 5`. This older function remains publicly executable. Staging and production function-definition hashes match for both routines.

Action: retire the old RPC or make it use the same distinctness, recency and publication rules. This is a legacy endpoint finding; the current website's recent-comparison path passed its threshold tests.

### 5. Server password minimum differs from the UI

Both environments report a six-character server minimum. In staging, a generated signup link, confirmation and password sign-in succeeded with a six-character password; no email was sent. The website requires eight characters in its forms.

Action: align the server-side password policy with the product's intended minimum. UI validation does not protect direct Auth API calls. The generated-link test is an administrator-assisted account-creation path, not a claim that every public signup path was exercised.

### 6. Admin sign-in heading has low contrast

The live `/admin` heading uses foreground `#13231d` on `#084c38`: axe-core 4.13.0 measured 1.63:1, below its 3:1 large-text threshold. Reproduced at 1440px and 390px. No other definite WCAG A/AA violations were reported in the 62 route/viewport scans, but axe also flagged checks requiring manual review; this is not full accessibility certification.

Action: give the heading an appropriate light text color and verify keyboard, focus and contrast in authenticated states too.

### 7. Extreme pagination returns a server error

Production `/api/jobs?page=9007199254740991` returned 503. Normal limits, excessive limits (capped at 50), negative pages and nonnumeric pages behaved as expected. Page validation allows a safe integer whose multiplication into an offset is not safe.

Action: reject out-of-range offsets with 400 or return a valid empty page without issuing an invalid database range.

### 8. Older browser assertions no longer match the product

The existing Playwright suite still expects removed hero images and wording, the old privacy cards, `.site-header` on pages now using the gateway header, and `/payslip-checker` as the final destination even though it redirects to `/calculator`. These failures are test-maintenance defects, not evidence that the replacement UI is broken. Fresh production route checks and the dedicated real-database user journeys are recorded separately.

The complete existing suite ran all 66 desktop/mobile cases: 40 passed and 26 failed. Twenty-two failures involve outdated UI/route expectations. Four were local timing failures: a focused six-case desktop/mobile rerun with one worker and a 90-second timeout passed all six, including all four previously timed-out cases. The original result is preserved rather than reclassified as an all-green run. The 22 stale assertions remain to be updated.

## Checks that passed during this pass

- All 127 unit tests across 17 files, TypeScript and repository lint before adding the new audit scripts. Targeted lint of the new scripts also passed.
- Optimized staging build generated all 38 pages. Initial attempts failed because C: was full, then because relocated output could not resolve dependencies; both environmental problems were resolved and the build rerun successfully.
- Fresh real Auth/signup confirmation, password sign-in, employer ownership, cross-account isolation, guarded admin publication and public visibility.
- Payroll finalisation, duplicate rejection, snapshot amendments, cancellation, draft/final PDF and CSV downloads, persisted history and export immutability after employee edits.
- Desktop and mobile job-to-calculator-to-payslip journeys and dated salary submissions.
- Job submission through persisted employer records, admin checks and anonymous published listing.
- Saved jobs, application statuses, alert creation/deletion, account switching, password mismatch handling, password update and sign-in using the changed password.
- Anonymous/forged-owner alert denial, cross-account read/write isolation, unsubscribe tokens and private report access. Salary moderation requires the designated checks and the recent comparison enforces its five-distinct-report minimum.
- All public-schema tables have RLS enabled in staging and production. Both environments have migrations through `202609240017`.
- All 31 public/admin entry routes loaded on live desktop and mobile: 62 route/viewport combinations, no horizontal overflow, no page JavaScript exceptions, one main landmark and h1, document language and expected security headers. Sixty combinations passed every automated check; two reported the same admin contrast defect.
- Homepage keyboard skip link reaches main content. Production test-fixture and nonexistent-job routes return 404.
- Analytics rejects missing/cross-site Origin, malformed JSON, unexpected salary fields and oversized requests. Headless clients intentionally return 204 before payload validation; the validation assertions used a non-headless user-agent to exercise the relevant branch.
- Thirty-four generated client JavaScript bundles contain neither environment's actual service-role key. This checks those keys specifically, not every possible secret.
- Existing production smoke script passed its twelve routes, redirect, empty-form validation, hiring sign-in guidance, mobile layout and jobs API checks.
- Fresh production link checks passed all 30 collected internal destinations, including redirects and anchor targets, and all ten tax-tool card clicks (five tools at desktop and mobile widths).

The earlier durable job-alert overlap/backlog/timeout checks remain documented in `durable-job-alert-delivery-2026-09-24.md`. They were not unnecessarily rerun against unchanged code during this pass. Production cron history now also records natural five-minute alert ticks.

## Scope and reproducibility

New checks:

```text
python scripts/run-staging-alert-stress.py scripts/verify-scheduled-workers.mjs
python scripts/verify-staging-legacy-surface.py
node scripts/verify-public-surface.mjs
node scripts/verify-production-boundaries.mjs
node scripts/verify-live-links.mjs
node node_modules/@playwright/test/cli.js test --config scripts/playwright-staging.config.ts
```

The scheduled-worker harness accepts `SCHEDULED_WORKER_CASE=ats-extra`, `ats-cleanup` or `ats-timeout` for the additional focused cases. Tests deliberately return a failing exit code for unresolved product findings. External ATS/freshness responses are simulated; actual staging PostgREST and Auth are used. New worker and legacy-RPC fixtures use unique test-owned identifiers and are removed in `finally`; cleanup counts were verified zero. The existing end-to-end suite retains its shared staging fixtures and ignored credential manifest for repeat runs.

The public-surface script uses axe-core 4.13.0 unpacked under ignored `supabase/.temp/axe-audit/package`; it does not add a production dependency. Results and screenshots are in `test-results/public-surface`. Other JSON evidence is under ignored `supabase/.temp`. Dependency audit and full legacy Playwright results are under `D:/SalarySabi-audit-20260924` because C: ran out of space. `.next-staging` is now a junction to that drive's `staging-build` folder; no source files were moved or deleted.

All generated vacancies, payroll operations, failure injection and account changes used staging. No real emails were sent. Production checks read public routes and configuration, or sent deliberately invalid analytics requests expected to be rejected; no synthetic production jobs or subscribers were created.

This pass does not establish independent Nigerian tax review, exhaustive penetration resistance, real screen-reader usability, Safari/Firefox compatibility, backup restoration, sustained internet-scale load or guaranteed third-party email delivery. Those are distinct verification activities, not conclusions implied by a green unit suite.
