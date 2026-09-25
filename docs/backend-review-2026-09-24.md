# Backend and website integration review

24 September 2026. Tests use the isolated SalarySabi staging project. No synthetic vacancies or payroll runs were created in production, and no emails were sent.

## Findings and fixes

| Finding | Change | Applied where |
| --- | --- | --- |
| Production lacked the salary-recency migration used by the website | Installed migration 202609240003; legacy reports remain undated rather than being treated as current | Production |
| Production Auth site URL pointed at localhost | Set the public site URL and explicit account/payroll confirmation and recovery redirects | Production |
| An old anonymous alert policy bypassed account ownership checks | Removed the permissive policy and restricted insert columns | Staging and production, migration 012 |
| Retired reward campaigns remained active | Closed campaigns without deleting records | Staging and production, migration 013 |
| Scheduled HTTP requests had timed out at five seconds | Increased scheduled request timeout to 60 seconds without invoking jobs or changing their active state | Staging and production, migration 013 |
| Signed-in non-admin users could not read published jobs | Extended the public published-job read policy to authenticated users | Staging and production, migration 014 |
| Ordinary salary reports had no admin review path independent of rewards | Added a guarded review RPC, required review note/checks, and an admin Salary reports view | RPC in staging and production, migration 015; UI local |
| Account password recovery lacked a password-change form | Added recovery event handling, confirmation and password update | Local UI, tested against staging Auth |
| Create-alert link had no working form | Added authenticated alert creation and retained account deletion/unsubscribe support | Local UI, tested against staging |
| Account query failures could look like empty records | Added explicit load failure/retry, request timeout and stale-account response protection | Local UI |
| Job actions were available before saved-state lookup completed | Wait for the stored state before exposing signed-in actions | Local UI |
| Withdrawn job relations silently disappeared from saved/application lists | Show an unavailable-listing state | Local UI |
| Lint inspected generated staging output | Excluded generated build directories and generated Worker declarations | Local tooling |

## Verified

- 127 unit tests covering the existing calculation, contract and data helpers passed.
- TypeScript and optimized staging build passed, including all 38 generated pages.
- Real Supabase signup-token confirmation and password sign-in; tokens generated without sending messages.
- Employer submission ownership, cross-account isolation, admin publication checks and anonymous published-job access.
- Browser submission through admin approval, persisted employer status and public listing.
- Desktop and mobile published job → calculator → payslip-check journey, dated community submission, payroll history and PDF/CSV downloads.
- Payroll confirmation/cancellation, persistence, duplicate rejection, draft/finalised exports and saved export immutability after current employee edits.
- Real account saved-job/application persistence, alert creation/deletion, account switching and password recovery.
- Alert guest/forged-owner rejection, cross-account read/write denial, token unsubscribe and deletion. Reports remain private to administrators.
- Salary review rejects non-admins and missing checks. Four approved reports remain hidden; five distinct approved reports expose the correct median. Browser admin review also saves successfully.
- All public-schema tables have RLS enabled in both environments. This is a configuration check, not a claim that every possible attack has been tested.
- Production scheduled-function endpoints reject unauthenticated requests with 401. Recent salary benchmark and retired-campaign RPCs return 200; retired campaigns return no active entries.
- Production homepage, account, salaries, payroll, post-a-job and jobs API return 200 with a normal browser user-agent. The deployed Worker has both API rate-limit bindings.

## Remaining release and delivery checks

1. **Completed: deploy the current frontend.** Deployed on 24 September 2026. `/hiring` and `/individuals` now return 200. The UI fixes labelled local above are included in this release. See the production verification record below.
2. **Completed: verify inbox delivery.** On 24 September, production confirmation arrived at hello@salarysabi.com (forwarded to the owner's Gmail), production password resets arrived at both owner-approved addresses, and labelled job-alert delivery probes arrived at both. See `email-delivery-verification-2026-09-24.md` for scope and evidence. Scheduled subscriber selection/delivery remains part of item 3.
3. **Completed: scheduled-task verification after the timeout change.** Temporary cron entries executed the exact production commands at 22:39 UTC; imports, freshness checks and alerts returned HTTP 200 with no timeouts. Regular schedules were preserved. A separate real-database staging check passed alert matching, failed-send retry, persistence and sequential duplicate prevention with mocked email transport. See `scheduled-task-verification-2026-09-24.md` for results and limits.

The audit does not certify legal/tax compliance, full penetration resistance, external application destinations, email deliverability or load capacity.

## Production deployment verification

- Cloudflare Worker version: `afa196e6-7580-40f1-b793-49218dde14cc`, deployed to salarysabi.com and www.salarysabi.com with existing deployed variables preserved.
- Previous version for rollback: `b7ec7f5e-011d-43a9-84ad-7290c0102760`.
- Production Next.js build and TypeScript checks passed; 38 pages generated.
- `node scripts/verify-production-frontend.mjs` passed against salarysabi.com: twelve public routes returned 200 with visible headings, no staging banner, and no browser exceptions.
- Verified `/talent` redirects to `/individuals`, blank job-form validation, signed-out hiring guidance, public jobs API response, and no horizontal overflow at 390px on individuals, hiring and post-a-job.
- This frontend deployment check submitted no production records and sent no emails. Authenticated write journeys were tested in staging as listed above. Subsequent authorized email-delivery and scheduled-task checks are documented separately above.

## Repeating the checks

Start the current staging dev app on port 3002 with `STAGING_PORT=3002` using `npm run dev:staging` (PowerShell: `$env:STAGING_PORT='3002'`). Staging credentials remain under ignored `supabase/.temp`.

- `python scripts/verify-staging.py` creates isolated fixtures; run before dependent browser scripts.
- `python scripts/verify-staging-permissions.py`
- `node scripts/verify-staging-browser.mjs`
- `node scripts/verify-staging-publication.mjs`
- `node scripts/verify-staging-account.mjs` generates a fresh recovery link without email.
- `node scripts/verify-payroll-workflow.mjs`

These scripts are allowlisted to staging and create or amend test records there. They must not be pointed at production.

## Job-alert concurrency and backlog follow-up

The duplicate-send, row-cap and timeout failures discovered by the initial alert stress test have been fixed and deployed. Real staging database tests and Supabase Edge-runtime tests passed for ten overlapping workers, 1,005 alerts, matches beyond 1,000 jobs, continuation, provider rejection and uncertain-outcome recovery. Production's scheduler command returned HTTP 200 with no active subscribers. See [durable job-alert delivery](durable-job-alert-delivery-2026-09-24.md) for exact scope, measurements and the manual reconciliation requirement. This does not establish load readiness of other scheduled workers or the entire product.

## Expanded verification findings

The subsequent [platform verification pass](platform-verification-2026-09-24.md) found unresolved ATS cleanup, freshness-check concurrency/runtime, legacy salary-aggregation, password-policy, dependency-advisory, API-boundary and admin-contrast issues. Earlier passing main-flow checks must not be read as a clean bill of health for these failure paths. See that report for reproduction scripts, exact results and scope.
