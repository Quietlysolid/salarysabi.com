-- Salary period is explicit; legacy reports remain undated and are not treated as current.
alter table public.salary_reports add column if not exists observed_month date;
alter table public.salary_reports add constraint salary_observed_month_start check (observed_month is null or observed_month = date_trunc('month',observed_month)::date);
create or replace function public.submit_recent_salary_report(p_role text,p_industry text,p_location text,p_experience_band text,p_company_size text,p_monthly_gross numeric,p_pay_reliability text,p_observed_month date)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_observed_month is null or p_observed_month <> date_trunc('month',p_observed_month)::date or p_observed_month > date_trunc('month',current_date)::date or p_observed_month < (date_trunc('month',current_date)-interval '11 months')::date then
    raise exception 'Choose a salary month within the last 12 calendar months';
  end if;
  insert into public.salary_reports(role,industry,location,experience_band,company_size,monthly_gross,pay_reliability,observed_month,approved,publication_status)
  values(trim(p_role),trim(p_industry),trim(p_location),p_experience_band,p_company_size,p_monthly_gross,p_pay_reliability,p_observed_month,false,'pending');
end; $$;
revoke all on function public.submit_recent_salary_report(text,text,text,text,text,numeric,text,date) from public;
grant execute on function public.submit_recent_salary_report(text,text,text,text,text,numeric,text,date) to anon,authenticated;
create or replace function public.public_recent_salary_benchmarks()
returns table(role text,industry text,location text,experience_band text,sample_size bigint,median_monthly_gross numeric,low_monthly_gross numeric,high_monthly_gross numeric,period_start date,period_end date)
language sql stable security definer set search_path=public as $$
  with reports as (
    -- Exact duplicate pay/role/month reports count once. This is not identity verification.
    select distinct lower(trim(role)) role,lower(trim(industry)) industry,lower(trim(location)) location,experience_band,monthly_gross,observed_month
    from public.salary_reports
    where approved and publication_status='published' and observed_month between (date_trunc('month',current_date)-interval '11 months')::date and date_trunc('month',current_date)::date
  )
  select role,industry,location,experience_band,count(*),
    percentile_cont(.5) within group(order by monthly_gross)::numeric,
    percentile_cont(.25) within group(order by monthly_gross)::numeric,
    percentile_cont(.75) within group(order by monthly_gross)::numeric,
    min(observed_month),max(observed_month)
  from reports group by role,industry,location,experience_band having count(*)>=5 order by count(*) desc,role limit 100;
$$;
revoke all on function public.public_recent_salary_benchmarks() from public;
grant execute on function public.public_recent_salary_benchmarks() to anon,authenticated;
notify pgrst, 'reload schema';
