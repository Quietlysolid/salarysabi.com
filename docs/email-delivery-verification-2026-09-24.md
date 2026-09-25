# Email delivery verification

24 September 2026. The owner explicitly requested verification messages to hello@salarysabi.com and ozichinwosu@gmail.com.

## Observed results

| Message | Recipient | Evidence |
| --- | --- | --- |
| Account confirmation | hello@salarysabi.com | Gmail INBOX, forwarded message addressed to hello; 22:22:14 UTC |
| Password reset | ozichinwosu@gmail.com | Gmail INBOX; 22:21:39 UTC |
| Password reset | hello@salarysabi.com | Gmail INBOX, forwarded message addressed to hello; 22:26:15 UTC |
| Labelled job-alert delivery test | hello@salarysabi.com | Cloudflare accepted; Gmail INBOX; 22:25:37 UTC |
| Labelled job-alert delivery test | ozichinwosu@gmail.com | Cloudflare accepted; Gmail INBOX; 22:25:38 UTC |

These are inbox observations, not merely HTTP acceptance. Gmail's authentication headers for confirmation and the direct password reset report SPF, DKIM and DMARC passing. Cloudflare reports the sending domain's DNS status as ready.

## Method and limits

- Confirmation and reset messages were requested through production Supabase Auth with production account redirects. Gmail was already a confirmed account; hello had no account, so the confirmation check created one with a random password. No existing account password was changed. The owner has the reset email to choose a password if they want to use the hello account.
- The job-alert probe used the repository's email builder, production JOB_ALERT_FROM, and the deployed CLOUDFLARE_EMAIL_API_TOKEN. Its content explicitly identified a delivery test, contained no fabricated vacancy, and did not create subscriptions or notification records.
- A temporary backend probe was restricted to the two approved recipients and protected by a verification secret. Missing-secret requests returned 401. The probe was deleted from production immediately after the send; absence was verified. Its local source and temporary secret were removed.
- The connected Cloudflare tool could read sending configuration but could not send. The backend's production email credentials did send successfully.
- An initial direct SMTP login test using the value returned by the Auth configuration API failed. That did not establish a production SMTP failure: actual production Auth messages subsequently arrived. No SMTP credentials or email settings were changed.
- Confirmation/recovery links were not consumed and no existing user password was reset by this check. Browser recovery and password changes had already been tested in staging.
- This proves the tested delivery paths at this time, not universal deliverability. Scheduled alert matching, notification persistence and the next cron completion were not exercised here. No bulk subscriber run was invoked.

Scheduled task completion was subsequently verified; see `scheduled-task-verification-2026-09-24.md`.
