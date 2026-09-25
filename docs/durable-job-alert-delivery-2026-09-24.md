# Durable job-alert delivery — 24 September 2026

The failures in `alert-stress-test-2026-09-24.md` have been addressed and the replacement worker deployed to production. This report covers job alerts, not load testing of ATS imports, stale checks or the rest of the platform.

## Changes

- PostgreSQL locks and a unique open-delivery constraint prevent concurrent workers from independently sending the same alert. Delivery intent is stored before sending; notification records and successful completion are committed together.
- Matching and notification exclusion happen inside PostgreSQL before the 20-job digest limit. There is no dependency on the API's 1,000-row response cap.
- Due-alert selection provides durable continuation. Each run performs at most 30 claims, each checking at most 50 alerts, and starts no further iteration after 22 seconds. Database requests have five-second deadlines; provider requests have eight-second deadlines.
- Explicit provider rejections use backoff. Ambiguous responses, timeouts, expired sending leases and persistence failures are held for review rather than automatically resent.
- The scheduler now runs every five minutes to resume backlogs. Successfully sent alerts are not due again for 24 hours; this is not a five-minute email frequency.
- The worker returns 202 for unfinished batches, 502 for retryable or uncertain outcomes, and 503 for database interruptions. HTTP 200 means the current due-work selection completed.

## Evidence

Real staging Auth/PostgreSQL tests used the production runner with simulated email transport. No real email was sent.

| Scenario | Result |
| --- | --- |
| Ten overlapping workers | One provider acceptance and one saved digest |
| Acceptance followed by a save outage | Held without resend; verified acceptance could be reconciled atomically |
| 1,105 jobs, first 1,000 already notified | Next 20 selected from the remaining 105 |
| 1,005 alerts without matches | All checked; 6.64 seconds in the Node harness |
| 70 matching alerts | All delivered across three bounded runs; no duplicate acceptances |
| Explicit 429 response | Backoff enforced; subsequent retry succeeded once |
| Expired claims | Prepared claims recovered with fresh tokens; sending claims held |
| Unsubscribe after claim | Delivery cancelled before sending |
| Anonymous access | Delivery table and RPC access denied |
| Seven slow provider requests | Deadlines held uncertain outcomes; no automatic resend |

The same runner was then exercised in Supabase's actual Edge runtime:

- Ten concurrent requests produced one simulated delivery.
- All 1,005 no-match alerts were processed in one run, taking 1.60 seconds.
- Seven provider calls delayed nine seconds were interrupted by their eight-second deadlines. The longest batch was 24.845 seconds; later runs did not resend uncertain deliveries.

All 127 existing unit tests passed. ESLint passed for the worker, runner and database regression script; the runner passed a strict TypeScript check. The Node slow-provider test used the earlier 28-second loop budget (longest batch 32.79 seconds); the Edge test used the final 22-second budget.

These are measured test sizes and simulated provider failures, not a guarantee of unlimited throughput or exactly-once email delivery under every external failure.

## Deployment and production checks

- Migrations `202609240016` and `202609240017` applied to staging and production.
- Production `send-job-alerts` deployed as version 30, active. Gateway JWT verification is disabled because the worker validates the dedicated cron secret itself.
- Production alert schedule is `*/5 * * * *`, active. Staging's corresponding schedule remains disabled.
- Executing the existing production scheduler command queued request 134: HTTP 200, no timeout, `complete: true`, zero active alerts and zero emails sent. This was an explicit execution of the scheduler command; the next natural five-minute tick was not yet observed when this record was written.
- Unauthenticated POST returned 401; ordinary GET returned 405.
- The temporary staging Edge probe was removed after testing. Fixture jobs, users and delivery records were verified removed.

## Handling uncertain deliveries

Only service-role operations can access the delivery table and RPCs. Inspect `job_alert_deliveries` for `status = 'uncertain'` and sending leases that have expired. The worker also reports uncertain counts in its response and logs persistence failures with delivery and provider message IDs.

An uncertain delivery blocks further automatic sends for that alert. Check provider records using the saved `provider_message_id` or logged message ID. If acceptance is confirmed, call `finish_job_alert_delivery` with the delivery ID, its existing claim token, outcome `sent` and the verified provider message ID. This atomically records notifications and releases the alert for its next daily check.

Do not blindly retry an uncertain delivery: the email may already have been accepted. If non-acceptance is independently confirmed, an operator can cancel the held record and make the alert due again in a reviewed transaction, recording the reason. There is no automatic provider reconciliation, operator UI or separate incident notification in this change. Provider acceptance also does not prove inbox delivery.

## Repeating tests

Run `python scripts/run-staging-alert-stress.py` for the database regression suite. It verifies the staging project and passes credentials in process environment variables. Results are stored in ignored `supabase/.temp/durable-alert-results.json`.

For Edge tests, deploy `verify-alert-edge-runtime` only to staging project `vcgqxlbhsbilxlkratbw` with `--use-api --no-verify-jwt`, then run `python scripts/run-staging-alert-stress.py scripts/verify-alert-edge-runtime.mjs`. The probe hard-restricts its project, checks the cron secret, and simulates all mail. Delete the remote probe after testing. Results are in ignored `supabase/.temp/alert-edge-results.json`.
