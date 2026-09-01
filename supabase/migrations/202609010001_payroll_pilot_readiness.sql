-- Privacy-safe employer payroll milestones. Only aggregate event names are
-- recorded. No organisation, employee, salary, deduction or account values
-- are copied into analytics_daily.
alter table public.analytics_daily drop constraint if exists analytics_daily_event_name_check;
alter table public.analytics_daily add constraint analytics_daily_event_name_check check (event_name in (
  'page_view','paye_calculated','payslip_checked','pdf_exported','excel_exported','print_opened','verify_interest','payroll_interest',
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
    'page_view','paye_calculated','payslip_checked','pdf_exported','excel_exported','print_opened','verify_interest','payroll_interest',
    'payslip_signup_viewed','payslip_signup_submitted','payslip_signup_succeeded','payroll_signup_viewed','payroll_signup_submitted','payroll_signup_succeeded',
    'payroll_workspace_created','payroll_first_employee_added','payroll_import_completed','payroll_run_finalised','payroll_second_month_finalised','payroll_register_downloaded','payroll_payslip_downloaded',
    'job_apply_clicked','job_submission_started','job_submission_succeeded','job_alert_created','account_signup_started','account_signup_succeeded','account_signin_succeeded',
    'contributor_interest_viewed','contributor_interest_submitted','contributor_interest_succeeded',
    'tax_update_signup_viewed','tax_update_signup_submitted','tax_update_signup_succeeded','paye_result_shared',
    'reward_offer_viewed','reward_offer_clicked','reward_offer_shared','reward_submission_started','reward_submission_succeeded',
    'reward_claim_approved','reward_claim_rejected','reward_payout_requested','reward_payout_completed'
  ) then return; end if;
  insert into public.analytics_daily(event_date,event_name,page_path,referrer_host,event_count)
  values(current_date,p_event_name,left(p_page_path,160),left(p_referrer_host,120),1)
  on conflict(event_date,event_name,page_path,referrer_host) do update set event_count=analytics_daily.event_count+1;
end; $$;
revoke all on function public.record_analytics_event(text,text,text) from public,anon,authenticated;
grant execute on function public.record_analytics_event(text,text,text) to anon;

create or replace function public.record_payroll_lifecycle()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  lifecycle_event_name text;
  distinct_periods integer;
  runs_for_new_period integer;
begin
  if tg_table_name = 'payroll_organisations' then
    lifecycle_event_name := 'payroll_workspace_created';
  elsif tg_table_name = 'payroll_employees' then
    if exists (
      select 1 from public.payroll_employees
      where organisation_id = new.organisation_id and id <> new.id
    ) then return new; end if;
    lifecycle_event_name := 'payroll_first_employee_added';
  elsif tg_table_name = 'payroll_runs' then
    insert into public.analytics_daily(event_date,event_name,page_path,referrer_host,event_count)
    values(current_date,'payroll_run_finalised','/payroll','internal',1)
    on conflict(event_date,event_name,page_path,referrer_host)
    do update set event_count=public.analytics_daily.event_count+1;

    select count(distinct pay_period), count(*) filter (where pay_period = new.pay_period)
    into distinct_periods, runs_for_new_period
    from public.payroll_runs where organisation_id = new.organisation_id;
    if distinct_periods = 2 and runs_for_new_period = 1 then
      insert into public.analytics_daily(event_date,event_name,page_path,referrer_host,event_count)
      values(current_date,'payroll_second_month_finalised','/payroll','internal',1)
      on conflict(event_date,event_name,page_path,referrer_host)
      do update set event_count=public.analytics_daily.event_count+1;
    end if;
    return new;
  else
    return new;
  end if;

  insert into public.analytics_daily(event_date,event_name,page_path,referrer_host,event_count)
  values(current_date,lifecycle_event_name,'/payroll','internal',1)
  on conflict(event_date,event_name,page_path,referrer_host)
  do update set event_count=public.analytics_daily.event_count+1;
  return new;
end; $$;

revoke all on function public.record_payroll_lifecycle() from public,anon,authenticated;

drop trigger if exists payroll_organisation_lifecycle_analytics on public.payroll_organisations;
create trigger payroll_organisation_lifecycle_analytics after insert on public.payroll_organisations
for each row execute function public.record_payroll_lifecycle();

drop trigger if exists payroll_employee_lifecycle_analytics on public.payroll_employees;
create trigger payroll_employee_lifecycle_analytics after insert on public.payroll_employees
for each row execute function public.record_payroll_lifecycle();

drop trigger if exists payroll_run_lifecycle_analytics on public.payroll_runs;
create trigger payroll_run_lifecycle_analytics after insert on public.payroll_runs
for each row execute function public.record_payroll_lifecycle();
