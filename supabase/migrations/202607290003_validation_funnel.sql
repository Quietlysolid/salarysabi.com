alter table public.early_access_signups
drop constraint if exists early_access_signups_email_key;

alter table public.early_access_signups
drop constraint if exists early_access_signups_source_check;

alter table public.early_access_signups
add constraint early_access_signups_source_check
check (source in ('homepage', 'payslip_checker', 'employer_payroll'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'early_access_signups_email_source_key'
      and conrelid = 'public.early_access_signups'::regclass
  ) then
    alter table public.early_access_signups
    add constraint early_access_signups_email_source_key unique (email, source);
  end if;
end;
$$;

drop policy if exists "allow anonymous early-access signup"
on public.early_access_signups;

create policy "allow anonymous early-access signup"
on public.early_access_signups
for insert
to anon
with check (
  source in ('payslip_checker', 'employer_payroll')
  and length(email) between 5 and 254
  and email = lower(email)
);

alter table public.analytics_daily
drop constraint if exists analytics_daily_event_name_check;

alter table public.analytics_daily
add constraint analytics_daily_event_name_check
check (
  event_name in (
    'page_view',
    'paye_calculated',
    'pdf_exported',
    'excel_exported',
    'print_opened',
    'verify_interest',
    'payroll_interest',
    'payslip_signup_viewed',
    'payslip_signup_submitted',
    'payslip_signup_succeeded',
    'payroll_signup_viewed',
    'payroll_signup_submitted',
    'payroll_signup_succeeded'
  )
);

create or replace function public.record_analytics_event(
  p_event_name text,
  p_page_path text,
  p_referrer_host text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_name not in (
    'page_view',
    'paye_calculated',
    'pdf_exported',
    'excel_exported',
    'print_opened',
    'verify_interest',
    'payroll_interest',
    'payslip_signup_viewed',
    'payslip_signup_submitted',
    'payslip_signup_succeeded',
    'payroll_signup_viewed',
    'payroll_signup_submitted',
    'payroll_signup_succeeded'
  ) then
    return;
  end if;

  insert into public.analytics_daily (
    event_date,
    event_name,
    page_path,
    referrer_host,
    event_count
  )
  values (
    current_date,
    p_event_name,
    left(p_page_path, 160),
    left(p_referrer_host, 120),
    1
  )
  on conflict (event_date, event_name, page_path, referrer_host)
  do update set event_count = analytics_daily.event_count + 1;
end;
$$;

revoke all on function public.record_analytics_event(text, text, text)
from public, anon, authenticated;

grant execute on function public.record_analytics_event(text, text, text)
to anon;
