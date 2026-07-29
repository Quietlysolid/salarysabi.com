with totals as (
  select
    event_name,
    sum(event_count)::bigint as events
  from public.analytics_daily
  where event_date >= current_date - 30
  group by event_name
),
funnel as (
  select
    coalesce(max(events) filter (where event_name = 'page_view'), 0) as page_views,
    coalesce(max(events) filter (where event_name = 'paye_calculated'), 0) as calculations,
    coalesce(max(events) filter (where event_name = 'verify_interest'), 0) as payslip_interest,
    coalesce(max(events) filter (where event_name = 'payslip_signup_succeeded'), 0) as payslip_signups,
    coalesce(max(events) filter (where event_name = 'payroll_interest'), 0) as payroll_interest,
    coalesce(max(events) filter (where event_name = 'payroll_signup_succeeded'), 0) as payroll_signups
  from totals
)
select
  *,
  round(100.0 * calculations / nullif(page_views, 0), 1) as calculation_rate_pct,
  round(100.0 * payslip_interest / nullif(calculations, 0), 1) as payslip_interest_rate_pct,
  round(100.0 * payslip_signups / nullif(payslip_interest, 0), 1) as payslip_signup_rate_pct,
  round(100.0 * payroll_interest / nullif(calculations, 0), 1) as payroll_interest_rate_pct,
  round(100.0 * payroll_signups / nullif(payroll_interest, 0), 1) as payroll_signup_rate_pct
from funnel;

select
  source,
  count(*) as signups
from public.early_access_signups
group by source
order by signups desc;
