# SalarySabi

A search-first MVP for a free 2026 Nigerian PAYE calculator that can grow into
lightweight payroll software for small employers.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm test
npm run lint
npm run build
```

## Calculation model

The engine annualises employment income, subtracts user-provided eligible
deductions, and applies the 2026 graduated bands:

| Chargeable income band | Rate |
| --- | ---: |
| First ₦800,000 | 0% |
| Next ₦2,200,000 | 15% |
| Next ₦9,000,000 | 18% |
| Next ₦13,000,000 | 21% |
| Next ₦25,000,000 | 23% |
| Above ₦50,000,000 | 25% |

Rent relief is 20% of rent attributable to the year, capped at ₦500,000.
Pension, NHF, NHIS, qualifying mortgage interest and life-insurance premiums
are entered as actual annual amounts. The calculator does not infer them from
gross salary.

Primary references:

- [Joint Revenue Board Personal Income Tax Guidelines 2026](https://www.jrb.gov.ng/assets/2026-pit-guidelines-TJG3n9-T.pdf)
- [Nigeria Tax Act 2025](https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf)

The output is an estimate and not tax advice. Calculation logic should be
reviewed by a Nigerian tax professional before a public commercial launch.

## MVP boundary

Implemented:

- Monthly and annual gross-income modes
- Eligible deductions and capped rent relief
- Transparent band-by-band results
- Print-friendly output
- Browser-generated PDF and Excel-compatible exports
- Live derived rent-relief feedback
- Responsive landing page and SEO metadata
- Methodology, tax-band, deductions, privacy and disclaimer pages
- Sitemap, robots policy and structured application metadata
- Unit-tested calculation and export engines
- Server-only Supabase waitlist persistence with consent and deduplication
- Cookieless, aggregate first-party analytics that respects Do Not Track
- Spam honeypot and minimum-completion-time protection
- Salary-transparent job search with permanent, indexable job pages
- Moderated employer submissions, reports, editing and expiration controls
- Job-seeker accounts with saved jobs and application tracking
- Verified account alerts with scheduled matching and unsubscribe links

Not implemented yet:

- Saved employees
- Payslip generation
- Employer payroll registers
- State revenue-service remittance workflows
- Billing

## Launch configuration

The public beta is branded **SalarySabi** at `salarysabi.com`. `PAYEwise` was
retired before launch because an existing payroll business already uses the
name.

Apply `supabase/migrations/202607290001_launch_infrastructure.sql` in a Supabase
project, then configure these server-side environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
NEXT_PUBLIC_SITE_URL=https://YOUR_PUBLIC_HOST
```

The Supabase anonymous key is designed for browser use. The migration enables
Row Level Security so browsers can insert signups and increment aggregate
analytics but cannot read either table. Never use a service-role key here.
Without the Supabase values, calculations remain functional, analytics fail
silently, and the early-access form returns a temporary-unavailable message.

The production artifact must be built in an environment where the public
Supabase values are present. Configure the Supabase Auth site URL as
`https://salarysabi.com` and allow `https://salarysabi.com/account` as a redirect.

Job alert delivery also requires a domain onboarded for Cloudflare Email Sending
and the following Supabase Edge Function secrets:

```text
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_EMAIL_API_TOKEN=your_email_sending_api_token
JOB_ALERT_FROM=SalarySabi Jobs <jobs@salarysabi.com>
```

The database schedules the `send-job-alerts` Edge Function daily at 07:00 UTC.
Without those Resend settings, alerts can be saved but no email is sent.

## Cloudflare production deployment

The repository uses OpenNext on Cloudflare Workers. The Worker renders dynamic
job detail pages and serves the static application assets.

For a one-off deployment from an authenticated development machine:

```bash
npm run deploy:cloudflare
```

For automatic production deployments, import this repository from **Workers &
Pages → Create application → Import a repository** and use:

```text
Worker name: salarysabi
Production branch: main
Build command: npx opennextjs-cloudflare build
Deploy command: npx wrangler deploy
```

Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
`NEXT_PUBLIC_SITE_URL=https://salarysabi.com` as Cloudflare **build variables**.
The two Supabase values are publishable browser configuration, never a Supabase
service-role key.

After the first successful deployment, attach `salarysabi.com` as the Worker's
custom domain. Cloudflare will manage its DNS record and certificate.
