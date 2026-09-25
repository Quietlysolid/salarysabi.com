-- Retain the legacy response shape without a second, less restrictive publication path.
create or replace function public.public_salary_benchmarks()
returns table(role text, industry text, location text, experience_band text, sample_size bigint,
  median_monthly_gross numeric, low_monthly_gross numeric, high_monthly_gross numeric)
language sql stable security definer set search_path = public as $$
  select role, industry, location, experience_band, sample_size,
    median_monthly_gross, low_monthly_gross, high_monthly_gross
  from public.public_recent_salary_benchmarks();
$$;
revoke all on function public.public_salary_benchmarks() from public;
grant execute on function public.public_salary_benchmarks() to anon, authenticated;
notify pgrst, 'reload schema';
