-- Supabase default table grants are broader than column grants: revoke the table
-- INSERT grant before granting only the employer-supplied fields.
revoke insert on public.job_submissions from anon, authenticated;
grant insert (contact_email,title,company_name,location,work_mode,employment_type,
  description,salary_min,salary_max,salary_period,salary_type,salary_currency,
  engagement_type,submitter_type,recruiter_company,client_display_name,
  authority_confirmed,no_candidate_fees_confirmed,application_url,expires_at,consented_at)
on public.job_submissions to anon,authenticated;
alter policy "allow anonymous job submission" on public.job_submissions
with check (review_status='pending' and owner_user_id is null
  and published_job_id is null and expires_at >= current_date);

-- Saved payroll is read-only through the API. Definer functions are the only
-- writers and retain the owner checks and transactional revision handling.
revoke all on public.payroll_runs,public.payroll_run_items from anon,authenticated;
grant select on public.payroll_runs,public.payroll_run_items to authenticated;

alter function public.finalise_payroll_run(uuid,date,text,jsonb,uuid,text)
rename to finalise_payroll_run_internal;
revoke all on function public.finalise_payroll_run_internal(uuid,date,text,jsonb,uuid,text)
from public,anon,authenticated;

create function public.finalise_payroll_run(
  p_organisation_id uuid,p_pay_period date,p_ruleset_version text,p_items jsonb,
  p_supersedes_run_id uuid default null,p_correction_note text default null
) returns public.payroll_runs language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_pay_period is null or p_ruleset_version is null or length(trim(p_ruleset_version)) not between 1 and 80 then
    raise exception 'Pay period and ruleset version are required';
  end if;
  if p_supersedes_run_id is not null then
    raise exception 'Use the saved-run amendment flow to correct payroll';
  end if;
  if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'Payroll items are required'; end if;
  if jsonb_array_length(p_items)=0 then raise exception 'At least one payroll item is required'; end if;
  if exists (
    select 1 from jsonb_to_recordset(p_items) as x(monthly_gross numeric,monthly_paye numeric,monthly_statutory_deductions numeric,monthly_other_deductions numeric,monthly_net_pay numeric)
    cross join lateral (values(x.monthly_gross),(x.monthly_paye),(x.monthly_statutory_deductions),(x.monthly_other_deductions),(x.monthly_net_pay)) as amount(value)
    where amount.value is null or amount.value::text in ('NaN','Infinity','-Infinity')
      or amount.value<0 or amount.value>999999999999.99 or amount.value<>round(amount.value,2)
      or x.monthly_net_pay<>x.monthly_gross-x.monthly_paye-x.monthly_statutory_deductions-x.monthly_other_deductions
  ) then raise exception 'Invalid payroll amounts or net pay'; end if;
  return public.finalise_payroll_run_internal(p_organisation_id,p_pay_period,p_ruleset_version,p_items,null,null);
end; $$;
revoke all on function public.finalise_payroll_run(uuid,date,text,jsonb,uuid,text) from public,anon,authenticated;
grant execute on function public.finalise_payroll_run(uuid,date,text,jsonb,uuid,text) to authenticated;
notify pgrst, 'reload schema';
