# SalarySabi analytics contract

## What the system measures

SalarySabi sends an allow-listed event name, the current pathname and the referring hostname to the aggregated Supabase counter. The administrator report uses those grouped counts for 30-day product metrics, prior-period comparisons, daily activity, top pages and traffic sources. Account totals come directly from Supabase Auth.

## Privacy boundary

Analytics must never include salary amounts, PAYE amounts, deductions, payslip values, passwords, email addresses, job-description text, form values or URL query strings. SalarySabi does not set an analytics cookie or retain a visitor identifier between browser sessions. Browser Do Not Track and reduced-data preferences disable collection.

Because identifiers are not retained, the local dashboard reports page views and actions rather than claiming an exact unique-visitor count. Supabase account totals are exact database counts.

Internal reviewers can exclude their browser from analytics by visiting any production page once with `?analytics=off`. The preference is kept in local storage and the query parameter is immediately removed from the URL. Visit once with `?analytics=on` to resume collection. Analytics is always disabled on local development builds.

## Local setup

1. Apply `supabase/migrations/202608070001_product_analytics.sql` to the intended non-production Supabase project.
2. Configure the public Supabase URL and publishable key from `.env.example`.
3. Restart the local server after changing public environment variables.

## Core funnel

The initial decision funnel is:

`page_view → paye_calculated → payslip_checked or guide page view → account_signup_succeeded → job_alert_created or job_apply_clicked`

Review the taxonomy before adding events. Prefer a small event that answers a product question over broad automatic capture.
