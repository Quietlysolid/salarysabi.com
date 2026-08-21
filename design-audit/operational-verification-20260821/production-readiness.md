# SalarySabi production-readiness verification

Verified and deployed 21 August 2026. Production changes were made after explicit approval and tested with controlled, reversible records.

## Verdict

The public site, contributor programme, calculator, navigation, ATS imports, stale-job checks, reward security, contributor dashboard, payout guard and administrative rejection path are operational. The contributor release is live on Cloudflare worker version `f5196f98-e2f9-4cb4-a4fc-5edfaa1d36a4`.

## Verified healthy

- `npm test`: 14 files and 90 tests passed.
- `npm run lint`: no errors; two generated declaration-file warnings only.
- Production build: successful with 44 routes.
- Layout suite: 58/58 desktop and mobile browser tests passed.
- Dependency audit: zero production vulnerabilities.
- Database lint: zero findings.
- Live public routes, jobs API, robots and sitemap return successfully over HTTPS.
- Security headers include HSTS, CSP, MIME sniffing protection, referrer policy, permissions policy, clickjacking protection and no-store behavior for `/admin`.
- Anonymous database access cannot read admin users, ATS sources, contribution claims or payout requests.
- Private scheduled functions reject unauthenticated requests.
- Five active ATS sources ran at 06:30 UTC on 21 August 2026.
- The stale-job schedule ran at 05:15 UTC on 21 August 2026.
- Both funded campaigns are active and within budget.
- `/contributions` is live and the real Turnstile widget is configured for `salarysabi.com` and `www.salarysabi.com`.
- The home page, contributor offers and contribution tracker passed live desktop and mobile smoke tests without horizontal overflow.

## Controlled contributor verification

- A controlled salary claim passed authentication, Turnstile verification, reward reservation, private dashboard display, wallet calculation and the unapproved-balance payout guard.
- A controlled job-source claim passed source fetching, salary-evidence matching, evidence snapshot creation and review-queue insertion.
- A temporary administrator rejected both claims through the production review functions.
- Anti-abuse rate limiting correctly stopped repeated submissions from the controlled test network.
- The test reports, suggestions, accounts, audit rows, rate-limit buckets and reward reservations were removed afterward.
- The stored Supabase Turnstile secret hash matches the real Cloudflare widget secret after controlled test mode was removed.

## Defects found and corrected

1. Early production payout tables lacked `payout_destination`. Migration `202608210003` repairs the column before installing the secure payout function.
2. The contributor risk accumulator produced a `text`/`text[]` lint warning. Forward migration `202608210005` makes the array type explicit.
3. Reward lifecycle analytics used `event_name` as both a PL/pgSQL variable and a column, which blocked every claim insert. Forward migration `202608210006` removes the ambiguity for claim and payout triggers.
4. The edge function discarded structured Supabase error messages. It now safely returns the designed database error instead of an unhelpful generic 422.
5. The production Turnstile site key and site URL are retained in the ignored local deployment environment so a later deployment cannot silently omit the challenge.

## Final production state

- Migrations `202608210001` through `202608210006`: applied locally and remotely.
- `submit-rewarded-contribution`: active.
- Required Supabase secrets: configured.
- Controlled test residue: zero temporary users, claims, payout requests, rate-limit buckets or committed campaign funds.
- Cloudflare CSP allows Turnstile without weakening the other security boundaries.

The only intentionally unexecuted test is real outbound job-alert email delivery because production currently has no alert subscribers. Its schedule, authorization boundary and deployed function are healthy, but delivery requires a real subscriber and mailbox confirmation.
