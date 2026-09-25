# SalarySabi

Pay, jobs and payroll tools for people and businesses in Nigeria.

**[Visit SalarySabi](https://salarysabi.com)**

- **For individuals:** estimate take-home pay, check payslip PAYE, find jobs with published salaries, and compare community salary reports.
- **For employers:** post and manage job listings, prepare payroll and payslips, and estimate company tax.

Built with Next.js, TypeScript, Supabase and Cloudflare Workers.

## Run locally

```bash
npm ci
```

Copy `.env.example` to `.env.local`, add your Supabase public configuration, then run:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). Database features require the migrations in `supabase/migrations`; see the [staging guide](docs/staging.md) for isolated testing. Keep credentials out of Git.

## Check and deploy

```bash
npm test
npm run lint
npm run build
npm run deploy:cloudflare
```

Deployment requires Cloudflare authentication and the intended environment configuration. Supabase migrations and Edge Functions are deployed separately.

Calculations are estimates. Payroll prepares records; it does not transfer salaries or file taxes. See [calculation rules and official sources](https://salarysabi.com/tax-updates) and [supported scenarios](https://salarysabi.com/calculation-notes).
