# Scheduled-task verification

24 September 2026, 22:39 UTC. Verified production scheduling through pg_cron and inspected the resulting pg_net HTTP responses, rather than treating SQL enqueue success as application completion.

## Production results

Temporary cron entries copied the exact commands from the three regular jobs, including their 60-second timeout. They ran at 22:39 UTC and unscheduled themselves. The regular schedules and active states were unchanged.

| Task | HTTP request | Result |
| --- | --- | --- |
| ATS imports | 131 | HTTP 200, no timeout; five sources, 187 roles received, 93 Nigeria-relevant, zero salary-eligible, zero drafts/deletions, no reported failures |
| Job alerts | 132 | HTTP 200, no timeout; zero active alerts, zero emails |
| Stale-job checks | 133 | HTTP 200, no timeout; two checked, two healthy, zero expired/held |

All five source sync records show success. The stale-check timestamps were updated for both checked jobs. No fabricated production jobs or alert subscriptions were created.

All three temporary entries were removed. One temporary SQL execution reports `job canceled` during its self-unscheduling; its independently queued HTTP request 132 completed with 200. This cleanup artifact is not evidence of a failed alert handler. The other two temporary SQL executions report success.

Regular schedules remain: stale checks 05:15 UTC, imports 06:30 UTC, alerts 07:00 UTC. The retention task remains at 04:25 UTC and already had a successful daily run; it is SQL-only, not an HTTP worker.

## Alert processing with a matching job

`scripts/verify-staging-alert-run.mjs` runs the repository's alert handler against real staging Auth and database records. Its test harness resolves Deno imports for Node, limits the selected alerts to its own fixture, and mocks only outbound Cloudflare email delivery. Credentials are supplied through process environment variables, not stored in the script. Created user, job, alert and notification fixtures are cleaned up.

Passed: unauthorized rejection; matching a published job to a confirmed account; failed email sends leave no notification row; retry persists a notification after provider acceptance; a later sequential run does not send that job again. No emails were sent by this staging test. Production email delivery was separately verified in `email-delivery-verification-2026-09-24.md`.

## Limits

Follow-up stress tests found duplicate sends, unpaginated backlogs and runtime overruns. See `alert-stress-test-2026-09-24.md`. The small-workload results above must not be read as concurrent-run or scale readiness.

These checks establish successful scheduled execution for the present workload. They do not prove overlapping runs are duplicate-proof, crash recovery after provider acceptance is exactly-once, or a large backlog completes within 60 seconds. The current handler can return 200 when an email provider rejects a send; the staging check confirms it remains eligible for retry, not that operational error reporting is complete. No live subscriber matching/send was exercised because there were no active production subscriptions.

No frontend or production handler code was changed by this verification.

## Subsequent alert-worker deployment

The statements above describe the original verification. The alert worker was subsequently replaced with durable claims, bounded batches, provider deadlines and explicit failure reporting. Its active production schedule is now every five minutes, with a 24-hour interval per successfully sent alert. The deployment and passing overlap/backlog/timeout tests are documented in [durable job-alert delivery](durable-job-alert-delivery-2026-09-24.md). ATS imports and stale checks retain their prior schedules and have not been stress-tested by this work.
