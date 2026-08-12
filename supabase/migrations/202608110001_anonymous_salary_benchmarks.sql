create table if not exists public.salary_reports (
  id uuid primary key default gen_random_uuid(),
  role text not null check (char_length(role) between 2 and 80),
  industry text not null check (char_length(industry) between 2 and 80),
  location text not null check (char_length(location) between 2 and 80),
  experience_band text not null check (experience_band in ('0-2', '3-5', '6-9', '10+')),
  company_size text not null check (company_size in ('1-10', '11-50', '51-200', '201+')),
  monthly_gross numeric(14,2) not null check (monthly_gross between 1000 and 100000000),
  pay_reliability text not null check (pay_reliability in ('on-time', 'sometimes-late', 'frequently-late')),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.salary_reports enable row level security;

create or replace function public.submit_salary_report(p_role text, p_industry text, p_location text, p_experience_band text, p_company_size text, p_monthly_gross numeric, p_pay_reliability text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.salary_reports(role, industry, location, experience_band, company_size, monthly_gross, pay_reliability)
  values(trim(p_role), trim(p_industry), trim(p_location), p_experience_band, p_company_size, p_monthly_gross, p_pay_reliability);
end; $$;
revoke all on function public.submit_salary_report(text,text,text,text,text,numeric,text) from public, anon, authenticated;
grant execute on function public.submit_salary_report(text,text,text,text,text,numeric,text) to anon, authenticated;

create or replace function public.public_salary_benchmarks()
returns table(role text, industry text, location text, experience_band text, sample_size bigint, median_monthly_gross numeric, low_monthly_gross numeric, high_monthly_gross numeric)
language sql stable security definer set search_path = public as $$
  select role, industry, location, experience_band, count(*) sample_size,
    percentile_cont(.5) within group(order by monthly_gross)::numeric median_monthly_gross,
    percentile_cont(.25) within group(order by monthly_gross)::numeric low_monthly_gross,
    percentile_cont(.75) within group(order by monthly_gross)::numeric high_monthly_gross
  from public.salary_reports where approved
  group by role, industry, location, experience_band
  having count(*) >= 5 order by count(*) desc, role limit 100;
$$;
revoke all on function public.public_salary_benchmarks() from public, anon, authenticated;
grant execute on function public.public_salary_benchmarks() to anon, authenticated;
