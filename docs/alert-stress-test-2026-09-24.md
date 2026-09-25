# Job-alert stress test

24 September 2026. These tests found failures; they do not certify readiness for larger workloads.

## Method

Run `python scripts/run-staging-alert-stress.py`. The launcher verifies the staging project and passes credentials in environment variables. The Node harness executes the current handler with real staging Auth and PostgREST calls. Selection is restricted to test-owned alerts and jobs. Cloudflare sends are intercepted: no real email is sent. The harness creates 1,105 isolated published job fixtures and one confirmed test user, then removes all test jobs, alerts, notifications and the user in `finally`.

This runs the handler in Node, not inside the deployed Edge runtime. Database latency is real, email-provider latency is simulated. Therefore elapsed time is a measured test result, not a production throughput guarantee. Downloaded production handler code was inspected and contains the same unpaginated selections, send-before-notification-write sequence and lack of provider timeout.

## Confirmed failures in the original worker

| Scenario | Observed result |
| --- | --- |
| Ten simultaneous runs reach the same unsent batch | Ten provider acceptances for the same email; only 20 unique job notification rows. All ten handlers returned 200. The notification primary key prevents duplicate rows, not duplicate emails. |
| Email accepted, notification insert receives simulated 503, then retry | Two provider acceptances. The failing run still returned 200. |
| 1,105 matching jobs; first database page already notified | Job selection returned 1,000 rows. A subsequent run sent nothing, leaving 105 matching jobs unseen. |
| 1,005 active alerts with no matching jobs | Handler reported 1,000 processed in 70.41 seconds. Five alerts were omitted and elapsed time exceeded the 60-second scheduler HTTP timeout without sending any email. |
| Seven matching alerts, each provider call delayed nine seconds | Seven acceptances; handler returned 200 after 64.92 seconds, beyond the scheduler's 60-second timeout. |

Raw scenario results, including the slow-provider case, are saved under ignored `supabase/.temp/alert-stress-results.json`.

## Changes needed

1. Use durable, atomic delivery claims so overlapping workers cannot independently send the same batch.
2. Persist delivery intent before contacting the provider. Treat provider acceptance followed by a persistence failure as an uncertain outcome requiring reconciliation, rather than automatically resending. Provider idempotency must be verified before relying on it for exactly-once behavior.
3. Paginate alerts and eligible jobs with stable ordering and a durable continuation cursor.
4. Limit each run to a bounded amount of work; resume remaining work in later batches. Add provider deadlines, retry/backoff and checked database writes.
5. Report incomplete/failed delivery distinctly from successful completion. Measure again in the Edge runtime after these changes.

No production code, settings or subscriber records were changed by this test. The earlier current-workload cron checks remain valid; large-workload and concurrent-run readiness is now explicitly failed. ATS-import and stale-check stress behavior has not been load-tested by this alert-focused harness.

## Subsequent remediation

The above records the original worker's failures. The replacement worker is now deployed and passed database-backed and actual Edge-runtime regression tests. See [durable job-alert delivery](durable-job-alert-delivery-2026-09-24.md) for results, deployment evidence, repeatable commands and remaining limits. The scripts named above now run the replacement regression suite; they no longer reproduce the original implementation.
