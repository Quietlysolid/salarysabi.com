# Connected product rollout

Updated 24 September 2026. See [staging setup and verification](staging.md).

Implemented and verified on staging:

- Authenticated employer submission -> private hiring record -> checked admin
  publication -> public job page. Guest submissions are never assigned by email.
- NGN gross employee salary -> calculator -> payslip checker with figures retained
  in browser state, requiring actual PAYE input. Personal amounts stay out of URLs.
- Salary reports include an observation month; public comparisons use approved,
  published reports from the last 12 calendar months, with at least five distinct
  reports. Exact duplicates count once. Undated legacy reports are excluded.
- Published role -> explicit employee entry in payroll; advertised pay never creates
  an employee automatically. Employer navigation connects hiring, payroll and tax.
- Owner-only payroll finalisation and immutable saved-run amendments. Original
  figures and the current employee roster are preserved. Direct saved-run writes
  and inconsistent totals are rejected by the database.
- Desktop/mobile browser checks cover the connected routes, salary submissions,
  history, PDF and CSV downloads. Real Supabase API checks exercise cross-account
  and anonymous access. All 109 unit tests and TypeScript checks pass.

Production release gates:

- Apply the pending migrations to production only as a separate deployment, after
  reviewing the staged changes. Production has not been modified by these scripts.
- Test actual confirmation/reset email delivery and redirect links; token confirmation
  has passed, but no user inbox was exercised.
- Verify the Cloudflare deployment and external importer/alert Edge Functions; local
  staging exercises the Next app and Supabase, not the deployed Workers runtime.
- Salary benchmarks remain self-reported community data, not independently verified
  market rates. Historic submissions cannot be safely dated or assigned by guessing.

Current staging security changes are in migration 202609240004: normalized submission
insert privileges, anonymous ownership checks, read-only saved payroll API access,
and validated finalisation through the owner-checking function.
