create table if not exists public.payroll_organisations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (length(name) between 2 and 120),
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_employees (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.payroll_organisations(id) on delete cascade,
  employee_number text not null check (length(employee_number) between 1 and 40),
  full_name text not null check (length(full_name) between 2 and 120),
  email text,
  monthly_gross numeric(14,2) not null check (monthly_gross >= 0),
  monthly_pension numeric(14,2) not null default 0 check (monthly_pension >= 0),
  monthly_nhf numeric(14,2) not null default 0 check (monthly_nhf >= 0),
  monthly_nhis numeric(14,2) not null default 0 check (monthly_nhis >= 0),
  monthly_mortgage_interest numeric(14,2) not null default 0 check (monthly_mortgage_interest >= 0),
  monthly_life_insurance numeric(14,2) not null default 0 check (monthly_life_insurance >= 0),
  monthly_rent numeric(14,2) not null default 0 check (monthly_rent >= 0),
  monthly_other_deductions numeric(14,2) not null default 0 check (monthly_other_deductions >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, employee_number)
);

create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.payroll_organisations(id) on delete cascade,
  pay_period date not null,
  status text not null default 'finalised' check (status in ('draft', 'finalised', 'superseded')),
  revision_number integer not null default 1 check (revision_number > 0),
  supersedes_run_id uuid references public.payroll_runs(id) on delete restrict,
  correction_note text check (correction_note is null or length(correction_note) between 3 and 500),
  ruleset_version text not null,
  total_gross numeric(16,2) not null,
  total_paye numeric(16,2) not null,
  total_deductions numeric(16,2) not null,
  total_net numeric(16,2) not null,
  created_at timestamptz not null default now(),
  unique (organisation_id, pay_period, revision_number)
);

create table if not exists public.payroll_run_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid references public.payroll_employees(id) on delete set null,
  employee_number text not null,
  full_name text not null,
  email text,
  monthly_gross numeric(14,2) not null,
  monthly_paye numeric(14,2) not null,
  monthly_statutory_deductions numeric(14,2) not null,
  monthly_other_deductions numeric(14,2) not null,
  monthly_net_pay numeric(14,2) not null
);

alter table public.payroll_organisations enable row level security;
alter table public.payroll_employees enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.payroll_run_items enable row level security;

drop policy if exists "owners manage payroll organisation" on public.payroll_organisations;
drop policy if exists "owners manage payroll employees" on public.payroll_employees;
drop policy if exists "owners manage payroll runs" on public.payroll_runs;
drop policy if exists "owners manage payroll run items" on public.payroll_run_items;

create policy "owners manage payroll organisation" on public.payroll_organisations for all to authenticated
using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "owners manage payroll employees" on public.payroll_employees for all to authenticated
using (exists (select 1 from public.payroll_organisations o where o.id = organisation_id and o.owner_user_id = auth.uid()))
with check (exists (select 1 from public.payroll_organisations o where o.id = organisation_id and o.owner_user_id = auth.uid()));
create policy "owners manage payroll runs" on public.payroll_runs for all to authenticated
using (exists (select 1 from public.payroll_organisations o where o.id = organisation_id and o.owner_user_id = auth.uid()))
with check (exists (select 1 from public.payroll_organisations o where o.id = organisation_id and o.owner_user_id = auth.uid()));
create policy "owners manage payroll run items" on public.payroll_run_items for all to authenticated
using (exists (select 1 from public.payroll_runs r join public.payroll_organisations o on o.id = r.organisation_id where r.id = run_id and o.owner_user_id = auth.uid()))
with check (exists (select 1 from public.payroll_runs r join public.payroll_organisations o on o.id = r.organisation_id where r.id = run_id and o.owner_user_id = auth.uid()));

grant select, insert, update, delete on public.payroll_organisations, public.payroll_employees, public.payroll_runs, public.payroll_run_items to authenticated;

create or replace function public.finalise_payroll_run(
  p_organisation_id uuid,
  p_pay_period date,
  p_ruleset_version text,
  p_items jsonb,
  p_supersedes_run_id uuid default null,
  p_correction_note text default null
) returns public.payroll_runs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous public.payroll_runs%rowtype;
  v_run public.payroll_runs%rowtype;
  v_revision integer := 1;
  v_item_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  perform 1 from public.payroll_organisations
  where id = p_organisation_id and owner_user_id = auth.uid()
  for update;
  if not found then raise exception 'Payroll organisation not found'; end if;

  if p_pay_period <> date_trunc('month', p_pay_period)::date then
    raise exception 'Pay period must be the first day of a month';
  end if;
  if length(trim(p_ruleset_version)) < 1 then raise exception 'Ruleset version is required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one payroll item is required';
  end if;

  if p_supersedes_run_id is not null then
    select * into v_previous from public.payroll_runs
    where id = p_supersedes_run_id
      and organisation_id = p_organisation_id
      and pay_period = p_pay_period
      and status = 'finalised'
    for update;
    if not found then raise exception 'Finalised payroll run to amend was not found'; end if;
    if length(trim(coalesce(p_correction_note, ''))) < 3 then
      raise exception 'A correction note is required for an amendment';
    end if;
    v_revision := v_previous.revision_number + 1;
  elsif exists (
    select 1 from public.payroll_runs
    where organisation_id = p_organisation_id and pay_period = p_pay_period
  ) then
    raise exception 'A payroll run already exists for this month';
  end if;

  select count(*), count(distinct item.employee_id)
  into v_item_count, v_revision
  from jsonb_to_recordset(p_items) as item(employee_id uuid);
  if v_item_count <> v_revision then raise exception 'Payroll items contain duplicate employees'; end if;
  v_revision := coalesce(v_previous.revision_number + 1, 1);

  if v_item_count <> (
    select count(*) from public.payroll_employees
    where organisation_id = p_organisation_id and active
  ) or exists (
    select 1
    from jsonb_to_recordset(p_items) as item(employee_id uuid, monthly_gross numeric)
    left join public.payroll_employees employee
      on employee.id = item.employee_id
      and employee.organisation_id = p_organisation_id
      and employee.active
    where employee.id is null or employee.monthly_gross <> item.monthly_gross
  ) then
    raise exception 'Payroll items must match the active employee roster';
  end if;

  insert into public.payroll_runs (
    organisation_id, pay_period, status, revision_number, supersedes_run_id,
    correction_note, ruleset_version, total_gross, total_paye,
    total_deductions, total_net
  )
  select p_organisation_id, p_pay_period, 'finalised', v_revision,
    p_supersedes_run_id, nullif(trim(p_correction_note), ''), p_ruleset_version,
    sum(item.monthly_gross), sum(item.monthly_paye),
    sum(item.monthly_statutory_deductions + item.monthly_other_deductions),
    sum(item.monthly_net_pay)
  from jsonb_to_recordset(p_items) as item(
    monthly_gross numeric, monthly_paye numeric,
    monthly_statutory_deductions numeric, monthly_other_deductions numeric,
    monthly_net_pay numeric
  )
  where item.monthly_gross >= 0 and item.monthly_paye >= 0
    and item.monthly_statutory_deductions >= 0 and item.monthly_other_deductions >= 0
    and item.monthly_net_pay >= 0
  returning * into v_run;
  if not found then raise exception 'Payroll items contain invalid amounts'; end if;

  insert into public.payroll_run_items (
    run_id, employee_id, employee_number, full_name, email, monthly_gross,
    monthly_paye, monthly_statutory_deductions, monthly_other_deductions,
    monthly_net_pay
  )
  select v_run.id, employee.id, employee.employee_number, employee.full_name,
    employee.email, item.monthly_gross, item.monthly_paye,
    item.monthly_statutory_deductions, item.monthly_other_deductions,
    item.monthly_net_pay
  from jsonb_to_recordset(p_items) as item(
    employee_id uuid, monthly_gross numeric, monthly_paye numeric,
    monthly_statutory_deductions numeric, monthly_other_deductions numeric,
    monthly_net_pay numeric
  )
  join public.payroll_employees employee on employee.id = item.employee_id
  where employee.organisation_id = p_organisation_id and employee.active;

  if p_supersedes_run_id is not null then
    update public.payroll_runs set status = 'superseded'
    where id = p_supersedes_run_id;
  end if;

  return v_run;
end;
$$;

revoke all on function public.finalise_payroll_run(uuid, date, text, jsonb, uuid, text) from public, anon, authenticated;
grant execute on function public.finalise_payroll_run(uuid, date, text, jsonb, uuid, text) to authenticated;
notify pgrst, 'reload schema';
