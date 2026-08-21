-- Measure discovery of funded contributor offers without collecting personal data.
alter table public.analytics_daily drop constraint if exists analytics_daily_event_name_check;
alter table public.analytics_daily add constraint analytics_daily_event_name_check check (event_name in (
  'page_view','paye_calculated','payslip_checked','pdf_exported','excel_exported','print_opened','verify_interest','payroll_interest',
  'payslip_signup_viewed','payslip_signup_submitted','payslip_signup_succeeded','payroll_signup_viewed','payroll_signup_submitted','payroll_signup_succeeded',
  'job_apply_clicked','job_submission_started','job_submission_succeeded','job_alert_created','account_signup_started','account_signup_succeeded','account_signin_succeeded',
  'contributor_interest_viewed','contributor_interest_submitted','contributor_interest_succeeded',
  'tax_update_signup_viewed','tax_update_signup_submitted','tax_update_signup_succeeded','paye_result_shared','reward_offer_clicked'
));

create or replace function public.record_analytics_event(p_event_name text,p_page_path text,p_referrer_host text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_event_name not in (
    'page_view','paye_calculated','payslip_checked','pdf_exported','excel_exported','print_opened','verify_interest','payroll_interest',
    'payslip_signup_viewed','payslip_signup_submitted','payslip_signup_succeeded','payroll_signup_viewed','payroll_signup_submitted','payroll_signup_succeeded',
    'job_apply_clicked','job_submission_started','job_submission_succeeded','job_alert_created','account_signup_started','account_signup_succeeded','account_signin_succeeded',
    'contributor_interest_viewed','contributor_interest_submitted','contributor_interest_succeeded',
    'tax_update_signup_viewed','tax_update_signup_submitted','tax_update_signup_succeeded','paye_result_shared','reward_offer_clicked'
  ) then return; end if;
  insert into public.analytics_daily(event_date,event_name,page_path,referrer_host,event_count)
  values(current_date,p_event_name,left(p_page_path,160),left(p_referrer_host,120),1)
  on conflict(event_date,event_name,page_path,referrer_host) do update set event_count=analytics_daily.event_count+1;
end; $$;
revoke all on function public.record_analytics_event(text,text,text) from public,anon,authenticated;
grant execute on function public.record_analytics_event(text,text,text) to anon;
