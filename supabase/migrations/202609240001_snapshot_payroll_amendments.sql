-- Amend immutable saved line totals without changing the current employee roster.
create or replace function public.amend_payroll_run(p_run_id uuid, p_correction_note text, p_items jsonb)
returns public.payroll_runs language plpgsql security definer set search_path = public as $$
declare
 old_run public.payroll_runs%rowtype;
 new_run public.payroll_runs%rowtype;
 item_count integer;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select r.* into old_run from public.payroll_runs r
 join public.payroll_organisations o on o.id = r.organisation_id
 where r.id = p_run_id and o.owner_user_id = auth.uid() for update of r;
 if not found then raise exception 'Payroll run not found'; end if;
 if old_run.status <> 'finalised' then raise exception 'This run has already been superseded. Reload history.'; end if;
 if p_correction_note is null or length(trim(p_correction_note)) not between 3 and 500 then raise exception 'A correction reason of 3 to 500 characters is required'; end if;
 if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'Payroll items are required'; end if;
 item_count := jsonb_array_length(p_items);
 if item_count = 0 or item_count <> (select count(*) from public.payroll_run_items where run_id = old_run.id) then raise exception 'Include every employee from the original run'; end if;
 if (select count(distinct x.original_item_id) from jsonb_to_recordset(p_items) as x(original_item_id uuid)) <> item_count
 or exists (select 1 from jsonb_to_recordset(p_items) as x(original_item_id uuid) left join public.payroll_run_items i on i.id=x.original_item_id and i.run_id=old_run.id where i.id is null)
 then raise exception 'Items must match the original run'; end if;
 if exists (select 1 from jsonb_to_recordset(p_items) as x(monthly_gross numeric, monthly_paye numeric, monthly_statutory_deductions numeric, monthly_other_deductions numeric, monthly_net_pay numeric)
 cross join lateral (values(x.monthly_gross),(x.monthly_paye),(x.monthly_statutory_deductions),(x.monthly_other_deductions),(x.monthly_net_pay)) as amount(value)
 where amount.value is null or amount.value::text in ('NaN','Infinity','-Infinity') or amount.value < 0 or amount.value > 999999999999.99 or amount.value <> round(amount.value,2)
 or x.monthly_net_pay <> x.monthly_gross-x.monthly_paye-x.monthly_statutory_deductions-x.monthly_other_deductions)
 then raise exception 'Invalid payroll amounts or net pay'; end if;
 if not exists (select 1 from jsonb_to_recordset(p_items) as x(original_item_id uuid, monthly_gross numeric, monthly_paye numeric, monthly_statutory_deductions numeric, monthly_other_deductions numeric)
 join public.payroll_run_items i on i.id=x.original_item_id
 where (x.monthly_gross,x.monthly_paye,x.monthly_statutory_deductions,x.monthly_other_deductions) is distinct from (i.monthly_gross,i.monthly_paye,i.monthly_statutory_deductions,i.monthly_other_deductions))
 then raise exception 'No payroll figures have changed'; end if;
 insert into public.payroll_runs(organisation_id,pay_period,status,revision_number,supersedes_run_id,correction_note,ruleset_version,total_gross,total_paye,total_deductions,total_net)
 select old_run.organisation_id,old_run.pay_period,'finalised',old_run.revision_number+1,old_run.id,trim(p_correction_note),old_run.ruleset_version,
 sum(x.monthly_gross),sum(x.monthly_paye),sum(x.monthly_statutory_deductions+x.monthly_other_deductions),sum(x.monthly_net_pay)
 from jsonb_to_recordset(p_items) as x(monthly_gross numeric,monthly_paye numeric,monthly_statutory_deductions numeric,monthly_other_deductions numeric,monthly_net_pay numeric)
 returning * into new_run;
 insert into public.payroll_run_items(run_id,employee_id,employee_number,full_name,email,monthly_gross,monthly_paye,monthly_statutory_deductions,monthly_other_deductions,monthly_net_pay)
 select new_run.id,i.employee_id,i.employee_number,i.full_name,i.email,x.monthly_gross,x.monthly_paye,x.monthly_statutory_deductions,x.monthly_other_deductions,x.monthly_net_pay
 from jsonb_to_recordset(p_items) as x(original_item_id uuid,monthly_gross numeric,monthly_paye numeric,monthly_statutory_deductions numeric,monthly_other_deductions numeric,monthly_net_pay numeric)
 join public.payroll_run_items i on i.id=x.original_item_id and i.run_id=old_run.id;
 update public.payroll_runs set status='superseded' where id=old_run.id;
 return new_run;
end; $$;
revoke all on function public.amend_payroll_run(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.amend_payroll_run(uuid,text,jsonb) to authenticated;
notify pgrst, 'reload schema';
