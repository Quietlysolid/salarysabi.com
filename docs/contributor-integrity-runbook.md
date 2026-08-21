# Contributor integrity runbook

This system treats contributor payment and public data publication as separate decisions. It is designed to make honest submissions simple while limiting bots, duplicate evidence, coordinated benchmark manipulation and multi-account payout abuse.

## Required production configuration

Set these server-side Supabase Edge Function secrets:

- `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile secret. Never expose it to the browser.
- `RISK_FINGERPRINT_SECRET`: at least 32 random bytes. Rotate only with a planned migration because rotation changes protected fingerprints.
- `PUBLIC_SITE_URL=https://salarysabi.com`: the browser origin allowed to submit rewarded contributions.

Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the web deployment. Local development may render a preview placeholder, but the Edge Function fails closed without the real secret. Cloudflare's published test site/secret keys may be used in a dedicated local Supabase environment.

Deploy in this order:

1. Apply database migration `202608210004_contributor_integrity.sql`.
2. Set the three Edge Function secrets.
3. Deploy `submit-rewarded-contribution`.
4. Set the public Turnstile site key and deploy the web app.
5. Submit one test salary claim and one job-source claim with a low-value internal campaign before reopening public campaigns.

Never deploy the web form first: the old direct rewarded RPCs are deliberately revoked by the migration.

## Daily review workflow

1. Review protected risk warnings first. A warning is a reason to verify more carefully, not proof of wrongdoing.
2. For a job source, compare the live employer page with the server-captured domain, title and salary excerpt. Complete every source check.
3. For a salary report, decide only whether the contributor earned the reward. Approval sends the report to quarantine; it does not publish it.
4. In Benchmark quarantine, check salary plausibility and whether the developing cohort appears independent. Release only safe reports to the anonymous pool.
5. Process payouts only after the wallet says the balance is available. New accounts use airtime first; bank transfer unlocks with contributor trust.
6. Write a specific reason for rejection, suppression or publication. Status changes are recorded in the append-only audit log.

Do not tell contributors exact risk scores, rate limits, fingerprint matches or internal thresholds. Give a useful outcome reason such as “the official vacancy page did not show the stated salary.”

## Incident response

If coordinated abuse is suspected:

1. Pause the affected campaign. Do not close it permanently unless the pilot is ending.
2. Leave claims pending while evidence is preserved; do not bulk-reject based only on one shared-network signal.
3. Mark the contributor profile for review or ban it only after corroborating evidence.
4. Stop or reject pending payouts tied to the investigation.
5. Export the relevant append-only audit rows and claim IDs. Do not export raw payout destinations into working notes.
6. Document the decision and affected budget, then adjust rules server-side. Avoid public changes that reveal the exact detection boundary.

## Retention and privacy

- Raw IP addresses and browser user-agent strings are not written to contributor records.
- Keyed network and browser-installation fingerprints are cleared after 90 days.
- Short source salary excerpts are cleared after 180 days; integrity fingerprints and canonical source metadata remain.
- Expired risk events and rate-limit buckets are removed by the scheduled retention function.
- Admin audit history is not editable or automatically deleted.
- Contributor deletion requests must also be evaluated against payment, fraud-prevention and legal recordkeeping needs before records are removed.

## Metrics to watch

Track outcomes rather than publishing anti-abuse thresholds:

- submission-to-approval rate by contribution type;
- median review time and payout time;
- duplicate and unverifiable-source rejection share;
- number of reward-approved salary reports still quarantined;
- successful benchmark groups formed from independently reviewed reports;
- payout destination conflicts and reversed rewards;
- appeal volume and the share of decisions changed on appeal.

A rising rejection rate is not automatically success. It can mean abuse increased, but it can also mean the offer or evidence instructions are confusing.
