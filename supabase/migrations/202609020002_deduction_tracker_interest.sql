-- Validate demand for deduction-remittance tracking without collecting pay values.
alter table public.analytics_daily drop constraint if exists analytics_daily_event_name_check;
alter table public.analytics_daily add constraint analytics_daily_event_name_check check (event_name in (
  'page_view','paye_input_started','paye_calculated','paye_to_payslip_clicked','payslip_check_started','payslip_checked',
  'deduction_tracker_interest_yes','deduction_tracker_interest_no',
  'pdf_exported','excel_exported','print_opened','verify_interest','payroll_interest',
  'payslip_signup_viewed','payslip_signup_submitted','payslip_signup_succeeded','payroll_signup_viewed','payroll_signup_submitted','payroll_signup_succeeded',
  'payroll_workspace_created','payroll_first_employee_added','payroll_import_completed','payroll_run_finalised','payroll_second_month_finalised','payroll_register_downloaded','payroll_payslip_downloaded',
  'job_apply_clicked','job_submission_started','job_submission_succeeded','job_alert_created','account_signup_started','account_signup_succeeded','account_signin_succeeded',
  'contributor_interest_viewed','contributor_interest_submitted','contributor_interest_succeeded',
  'tax_update_signup_viewed','tax_update_signup_submitted','tax_update_signup_succeeded','paye_result_shared',
  'reward_offer_viewed','reward_offer_clicked','reward_offer_shared','reward_submission_started','reward_submission_succeeded',
  'reward_claim_approved','reward_claim_rejected','reward_payout_requested','reward_payout_completed'
));

create or replace function public.record_analytics_event(p_event_name text,p_page_path text,p_referrer_host text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_event_name not in (
    'page_view','paye_input_started','paye_calculated','paye_to_payslip_clicked','payslip_check_started','payslip_checked',
    'deduction_tracker_interest_yes','deduction_tracker_interest_no',
    'pdf_exported','excel_exported','print_opened','verify_interest','payroll_interest',
    'payslip_signup_viewed','payslip_signup_submitted','payslip_signup_succeeded','payroll_signup_viewed','payroll_signup_submitted','payroll_signup_succeeded',
    'payroll_workspace_created','payroll_first_employee_added','payroll_import_completed','payroll_run_finalised','payroll_second_month_finalised','payroll_register_downloaded','payroll_payslip_downloaded',
    'job_apply_clicked','job_submission_started','job_submission_succeeded','job_alert_created','account_signup_started','account_signup_succeeded','account_signin_succeeded',
    'contributor_interest_viewed','contributor_interest_submitted','contributor_interest_succeeded',
    'tax_update_signup_viewed','tax_update_signup_submitted','tax_update_signup_succeeded','paye_result_shared',
    'reward_offer_viewed','reward_offer_clicked','reward_offer_shared','reward_submission_started','reward_submission_succeeded',
    'reward_claim_approved','reward_claim_rejected','reward_payout_requested','reward_payout_completed'
  ) then return; end if;
  if p_page_path ~ '^/(admin|e2e-fixtures)(/|$)' then return; end if;

  insert into public.analytics_daily(event_date,event_name,page_path,referrer_host,event_count)
  values(current_date,p_event_name,left(p_page_path,160),left(p_referrer_host,120),1)
  on conflict(event_date,event_name,page_path,referrer_host)
  do update set event_count=public.analytics_daily.event_count+1;
end; $$;

revoke all on function public.record_analytics_event(text,text,text) from public,anon,authenticated;
grant execute on function public.record_analytics_event(text,text,text) to anon;

create or replace function public.admin_product_analytics()
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  result jsonb;
  clean_start constant date := date '2026-09-02';
begin
  if not public.is_current_user_admin() then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'reporting_started_on', clean_start,
    'totals', coalesce((
      select jsonb_object_agg(event_name, total)
      from (
        select event_name, sum(event_count)::bigint as total
        from public.analytics_daily
        where event_date >= greatest(current_date - 29, clean_start)
        group by event_name
      ) event_totals
    ), '{}'::jsonb),
    'previous', coalesce((
      select jsonb_object_agg(event_name, total)
      from (
        select event_name, sum(event_count)::bigint as total
        from public.analytics_daily
        where event_date between greatest(current_date - 59, clean_start) and current_date - 30
        group by event_name
      ) event_totals
    ), '{}'::jsonb),
    'funnel', (
      select jsonb_build_object(
        'paye_guide_views', coalesce(sum(event_count) filter (where event_name='page_view' and page_path='/paye-guide'),0)::bigint,
        'paye_input_starts', coalesce(sum(event_count) filter (where event_name='paye_input_started' and page_path='/paye-guide'),0)::bigint,
        'paye_calculations', coalesce(sum(event_count) filter (where event_name='paye_calculated' and page_path='/paye-guide'),0)::bigint,
        'paye_to_payslip_clicks', coalesce(sum(event_count) filter (where event_name='paye_to_payslip_clicked' and page_path='/paye-guide'),0)::bigint,
        'payslip_checker_views', coalesce(sum(event_count) filter (where event_name='page_view' and page_path='/payslip-checker'),0)::bigint,
        'payslip_check_starts', coalesce(sum(event_count) filter (where event_name='payslip_check_started' and page_path='/payslip-checker'),0)::bigint,
        'payslip_checks', coalesce(sum(event_count) filter (where event_name='payslip_checked' and page_path='/payslip-checker'),0)::bigint,
        'deduction_tracker_interest_yes', coalesce(sum(event_count) filter (where event_name='deduction_tracker_interest_yes' and page_path='/payslip-checker'),0)::bigint,
        'deduction_tracker_interest_no', coalesce(sum(event_count) filter (where event_name='deduction_tracker_interest_no' and page_path='/payslip-checker'),0)::bigint
      )
      from public.analytics_daily
      where event_date >= greatest(current_date - 29, clean_start)
    ),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object('date', day, 'page_views', page_views, 'calculations', calculations) order by day)
      from (
        select series::date as day,
          coalesce(sum(event_count) filter (where event_name='page_view'),0)::bigint as page_views,
          coalesce(sum(event_count) filter (where event_name='paye_calculated'),0)::bigint as calculations
        from generate_series(greatest(current_date - 13, clean_start), current_date, interval '1 day') series
        left join public.analytics_daily on event_date=series::date
          and page_path !~ '^/(admin|e2e-fixtures)(/|$)'
        group by series
      ) days
    ), '[]'::jsonb),
    'top_pages', coalesce((
      select jsonb_agg(jsonb_build_object('path',page_path,'views',views) order by views desc)
      from (
        select page_path,sum(event_count)::bigint as views
        from public.analytics_daily
        where event_date >= greatest(current_date - 29, clean_start)
          and event_name='page_view'
          and page_path !~ '^/(admin|e2e-fixtures)(/|$)'
        group by page_path order by views desc limit 6
      ) pages
    ), '[]'::jsonb),
    'referrers', coalesce((
      select jsonb_agg(jsonb_build_object('source',referrer_host,'views',views) order by views desc)
      from (
        select referrer_host,sum(event_count)::bigint as views
        from public.analytics_daily
        where event_date >= greatest(current_date - 29, clean_start)
          and event_name='page_view'
          and page_path !~ '^/(admin|e2e-fixtures)(/|$)'
        group by referrer_host order by views desc limit 6
      ) sources
    ), '[]'::jsonb),
    'accounts_total', (select count(*) from auth.users),
    'accounts_30d', (select count(*) from auth.users where created_at >= now() - interval '30 days')
  ) into result;
  return result;
end; $$;

revoke all on function public.admin_product_analytics() from public,anon,authenticated;
grant execute on function public.admin_product_analytics() to authenticated;
