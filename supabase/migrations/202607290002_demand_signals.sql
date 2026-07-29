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
    'payroll_interest'
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
    'payroll_interest'
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
