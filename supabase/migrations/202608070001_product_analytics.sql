alter table public.analytics_daily drop constraint if exists analytics_daily_event_name_check;
alter table public.analytics_daily add constraint analytics_daily_event_name_check check (
  event_name in (
    'page_view', 'paye_calculated', 'payslip_checked', 'pdf_exported', 'excel_exported',
    'print_opened', 'verify_interest', 'payroll_interest', 'payslip_signup_viewed',
    'payslip_signup_submitted', 'payslip_signup_succeeded', 'payroll_signup_viewed',
    'payroll_signup_submitted', 'payroll_signup_succeeded', 'job_apply_clicked',
    'job_submission_started', 'job_submission_succeeded', 'job_alert_created',
    'account_signup_started', 'account_signup_succeeded', 'account_signin_succeeded'
  )
);

create or replace function public.record_analytics_event(
  p_event_name text, p_page_path text, p_referrer_host text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_event_name not in (
    'page_view', 'paye_calculated', 'payslip_checked', 'pdf_exported', 'excel_exported',
    'print_opened', 'verify_interest', 'payroll_interest', 'payslip_signup_viewed',
    'payslip_signup_submitted', 'payslip_signup_succeeded', 'payroll_signup_viewed',
    'payroll_signup_submitted', 'payroll_signup_succeeded', 'job_apply_clicked',
    'job_submission_started', 'job_submission_succeeded', 'job_alert_created',
    'account_signup_started', 'account_signup_succeeded', 'account_signin_succeeded'
  ) then return; end if;
  insert into public.analytics_daily (event_date, event_name, page_path, referrer_host, event_count)
  values (current_date, p_event_name, left(p_page_path, 160), left(p_referrer_host, 120), 1)
  on conflict (event_date, event_name, page_path, referrer_host)
  do update set event_count = analytics_daily.event_count + 1;
end;
$$;

revoke all on function public.record_analytics_event(text, text, text) from public, anon, authenticated;
grant execute on function public.record_analytics_event(text, text, text) to anon;

create or replace function public.admin_product_analytics()
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare result jsonb;
begin
  if not public.is_current_user_admin() then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'totals', coalesce((
      select jsonb_object_agg(event_name, total)
      from (
        select event_name, sum(event_count)::bigint as total
        from public.analytics_daily
        where event_date >= current_date - 29
        group by event_name
      ) event_totals
    ), '{}'::jsonb),
    'previous', coalesce((
      select jsonb_object_agg(event_name, total)
      from (
        select event_name, sum(event_count)::bigint as total
        from public.analytics_daily
        where event_date between current_date - 59 and current_date - 30
        group by event_name
      ) event_totals
    ), '{}'::jsonb),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('date', day, 'page_views', page_views, 'calculations', calculations) order by day)
      from (
        select series::date as day,
          coalesce(sum(event_count) filter (where event_name = 'page_view'), 0)::bigint as page_views,
          coalesce(sum(event_count) filter (where event_name = 'paye_calculated'), 0)::bigint as calculations
        from generate_series(current_date - 13, current_date, interval '1 day') series
        left join public.analytics_daily on event_date = series::date
        group by series
      ) days
    ), '[]'::jsonb),
    'top_pages', coalesce((
      select jsonb_agg(jsonb_build_object('path', page_path, 'views', views) order by views desc)
      from (
        select page_path, sum(event_count)::bigint as views
        from public.analytics_daily
        where event_date >= current_date - 29 and event_name = 'page_view'
        group by page_path order by views desc limit 6
      ) pages
    ), '[]'::jsonb),
    'referrers', coalesce((
      select jsonb_agg(jsonb_build_object('source', referrer_host, 'views', views) order by views desc)
      from (
        select referrer_host, sum(event_count)::bigint as views
        from public.analytics_daily
        where event_date >= current_date - 29 and event_name = 'page_view'
        group by referrer_host order by views desc limit 6
      ) sources
    ), '[]'::jsonb),
    'accounts_total', (select count(*) from auth.users),
    'accounts_30d', (select count(*) from auth.users where created_at >= now() - interval '30 days')
  ) into result;
  return result;
end;
$$;

revoke all on function public.admin_product_analytics() from public, anon, authenticated;
grant execute on function public.admin_product_analytics() to authenticated;
