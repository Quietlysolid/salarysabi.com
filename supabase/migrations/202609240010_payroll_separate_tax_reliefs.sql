-- Cash deductions remain unchanged. Historical monthly entries cannot establish
-- annual relief eligibility; new relief fields deliberately start at zero.
alter table public.payroll_employees
  add column if not exists annual_mortgage_interest_relief numeric(14,2) not null default 0 check (annual_mortgage_interest_relief >= 0),
  add column if not exists preceding_year_life_insurance_relief numeric(14,2) not null default 0 check (preceding_year_life_insurance_relief >= 0);
