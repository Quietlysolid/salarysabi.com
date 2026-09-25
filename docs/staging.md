# SalarySabi staging

Updated 24 September 2026.

## Environment

- Project: **SalarySabi Staging**
- Reference: `vcgqxlbhsbilxlkratbw`
- Region: `us-east-1`
- Dashboard: https://supabase.com/dashboard/project/vcgqxlbhsbilxlkratbw
- Local app: http://localhost:3001
- Production reference: `npiujcemzypvuuvnxfem` (never used by staging scripts)

Production environment variables, records and deployments were not changed.
Oddhum was paused with the owner's authorization to free the staging project slot.

## Run it

`npm run dev:staging` starts the staging app on port 3001 with its own build directory.
Stop that server before running `npm run build:staging`; then `npm run start:staging`
serves the optimized build on port 3001. The existing app on port 3000 is separate.

The launcher reads only the staging URL and public key from ignored
`supabase/.temp/staging-public.json`. It refuses a different project URL. The
banner says **Staging - Test data only**. Robots and response headers disallow
indexing; ads and product analytics are disabled. Local staging uses Node without
Cloudflare rate-limit bindings. This does not verify the deployed Workers runtime.

## Database setup

`python scripts/staging_supabase.py` applies unapplied migrations using the existing
Supabase CLI management login. It checks the staging project ID/name first, records
migration versions and statements transactionally, and never targets production.

44 migration versions are applied, through `202609240004_protect_connected_records`.
Staging-only differences in historical migrations are recorded in the bootstrap script:

- Skip the production admin assignment and two one-off remote importer requests.
- Preserve schema changes but exclude historical job listing seeds.
- Replace hardcoded production function hosts with the staging host.
- Disable scheduled jobs in the same transaction in which they are created.

All scheduled jobs are disabled. No live records, users, storage objects, mail
credentials or third-party API secrets were copied. Edge Functions and automated
imports/alerts are not deployed or verified by this work.

The database password is encrypted for the current Windows user in ignored
`supabase/.temp/staging-password.dpapi`. Test account credentials and short-lived
sessions live only in ignored `supabase/.temp/staging-verification.json`; do not
commit or share it. A rerun creates fresh isolated accounts and TEST ONLY records.

## Verification

- `npm run test:staging:api`: real Supabase Auth token confirmation/password sign-in;
  owned submission persistence; another employer cannot read or approve it; guest
  and owner cannot forge ownership; explicit admin checks required; published job
  becomes publicly readable and links back to its employer.
- Payroll: owner-only access, finalisation, duplicate-month prevention, correct net
  totals, rejection of invalid amounts, revision 2 creation, original snapshot and
  current employee figures preserved. Direct writes to saved runs/items rejected.
- Salary community: future month rejected; pending, undated and stale reports
  excluded; fewer than five distinct approved reports suppressed; exact duplicates
  counted once; median and observation-month metadata returned; raw rows private.
- `npm run test:staging:browser` with the app running: desktop and 390px mobile,
  employer sign-in -> hiring -> published role -> calculator -> payslip check;
  dated salary submission; payroll history; valid PDF/CSV downloads; no horizontal
  overflow in payroll. Also tests the real job form -> persisted record after
  refresh -> admin sign-in/checks -> publication -> anonymous job page.
- Public jobs API returns the staged published listings.
- 109 unit tests passed; TypeScript and targeted ESLint checks passed.
- Optimized Next.js build passed and is served at localhost:3001.

Signup confirmation was verified with real Auth tokens generated via the admin
API, without sending email. Inbox delivery, email template links, real-user
onboarding and production deployment remain separate verification steps. The
synthetic vacancies are confined to the staging database.
