create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 3 and 120),
  company_name text not null check (length(company_name) between 2 and 120),
  location text not null check (length(location) between 2 and 120),
  work_mode text not null check (work_mode in ('onsite', 'hybrid', 'remote')),
  employment_type text not null check (employment_type in ('Full time', 'Part time', 'Contract', 'Internship')),
  description text not null check (length(description) between 80 and 8000),
  salary_min numeric(14,2) not null check (salary_min > 0),
  salary_max numeric(14,2) not null check (salary_max >= salary_min),
  salary_period text not null check (salary_period in ('monthly', 'annual')),
  salary_type text not null check (salary_type in ('gross', 'net')),
  application_url text not null check (application_url ~ '^https://'),
  source_url text check (source_url is null or source_url ~ '^https://'),
  employer_verified boolean not null default false,
  source_verified_at timestamptz not null,
  published_at timestamptz not null default now(),
  expires_at date not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'expired', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at >= published_at::date)
);

create index if not exists jobs_public_listing_idx
on public.jobs (status, expires_at, published_at desc);

alter table public.jobs enable row level security;
create policy "read current published jobs" on public.jobs for select to anon
using (status = 'published' and expires_at >= current_date);
grant select on public.jobs to anon;

create table if not exists public.job_submissions (
  id uuid primary key default gen_random_uuid(),
  contact_email text not null check (length(contact_email) between 5 and 254 and contact_email = lower(contact_email)),
  title text not null check (length(title) between 3 and 120),
  company_name text not null check (length(company_name) between 2 and 120),
  location text not null check (length(location) between 2 and 120),
  work_mode text not null check (work_mode in ('onsite', 'hybrid', 'remote')),
  employment_type text not null check (employment_type in ('Full time', 'Part time', 'Contract', 'Internship')),
  description text not null check (length(description) between 80 and 8000),
  salary_min numeric(14,2) not null check (salary_min > 0),
  salary_max numeric(14,2) not null check (salary_max >= salary_min),
  salary_period text not null check (salary_period in ('monthly', 'annual')),
  salary_type text not null check (salary_type in ('gross', 'net')),
  application_url text not null check (application_url ~ '^https://'),
  expires_at date not null check (expires_at >= current_date),
  consented_at timestamptz not null,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.job_submissions enable row level security;
create policy "allow anonymous job submission" on public.job_submissions for insert to anon
with check (review_status = 'pending' and expires_at >= current_date);
grant insert (
  contact_email, title, company_name, location, work_mode, employment_type,
  description, salary_min, salary_max, salary_period, salary_type,
  application_url, expires_at, consented_at
) on public.job_submissions to anon;

create table if not exists public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  email text not null check (length(email) between 5 and 254 and email = lower(email)),
  keywords text not null check (length(keywords) between 2 and 100),
  location text not null default '' check (length(location) <= 100),
  work_mode text not null check (work_mode in ('all', 'onsite', 'hybrid', 'remote')),
  consented_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (email, keywords, location, work_mode)
);

alter table public.job_alerts enable row level security;
create policy "allow anonymous job alerts" on public.job_alerts for insert to anon
with check (active = true and email = lower(email));
grant insert (email, keywords, location, work_mode, consented_at) on public.job_alerts to anon;

alter table public.analytics_daily drop constraint if exists analytics_daily_event_name_check;
alter table public.analytics_daily add constraint analytics_daily_event_name_check check (
  event_name in (
    'page_view', 'paye_calculated', 'pdf_exported', 'excel_exported',
    'print_opened', 'verify_interest', 'payroll_interest',
    'payslip_signup_viewed', 'payslip_signup_submitted', 'payslip_signup_succeeded',
    'payroll_signup_viewed', 'payroll_signup_submitted', 'payroll_signup_succeeded',
    'job_apply_clicked', 'job_submission_started', 'job_submission_succeeded',
    'job_alert_created'
  )
);

create or replace function public.record_analytics_event(
  p_event_name text, p_page_path text, p_referrer_host text
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_event_name not in (
    'page_view', 'paye_calculated', 'pdf_exported', 'excel_exported',
    'print_opened', 'verify_interest', 'payroll_interest',
    'payslip_signup_viewed', 'payslip_signup_submitted', 'payslip_signup_succeeded',
    'payroll_signup_viewed', 'payroll_signup_submitted', 'payroll_signup_succeeded',
    'job_apply_clicked', 'job_submission_started', 'job_submission_succeeded',
    'job_alert_created'
  ) then return; end if;
  insert into public.analytics_daily (event_date, event_name, page_path, referrer_host, event_count)
  values (current_date, p_event_name, left(p_page_path, 160), left(p_referrer_host, 120), 1)
  on conflict (event_date, event_name, page_path, referrer_host)
  do update set event_count = analytics_daily.event_count + 1;
end;
$$;

revoke all on function public.record_analytics_event(text, text, text) from public, anon, authenticated;
grant execute on function public.record_analytics_event(text, text, text) to anon;
