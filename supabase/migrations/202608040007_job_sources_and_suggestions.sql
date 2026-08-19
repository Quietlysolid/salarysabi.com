alter table public.jobs add column if not exists salary_currency text not null default 'NGN';
alter table public.jobs add column if not exists salary_source text not null default 'employer_disclosed';
alter table public.jobs add column if not exists source_kind text not null default 'employer_submission';
alter table public.jobs add column if not exists source_name text;
alter table public.jobs add column if not exists source_job_id text;
alter table public.jobs add column if not exists canonical_url text;
alter table public.jobs add column if not exists source_last_seen_at timestamptz;
alter table public.jobs add column if not exists global_remote boolean not null default false;
alter table public.jobs add column if not exists engagement_type text not null default 'employee';
alter table public.jobs add constraint jobs_salary_currency_check check (salary_currency in ('NGN', 'USD', 'GBP', 'EUR'));
alter table public.jobs add constraint jobs_salary_source_check check (salary_source in ('employer_disclosed', 'source_reported', 'third_party_estimate'));
alter table public.jobs add constraint jobs_source_kind_check check (source_kind in ('employer_submission', 'official_page', 'licensed_feed', 'community_tip'));
alter table public.jobs add constraint jobs_engagement_type_check check (engagement_type in ('employee', 'contractor', 'unknown'));
create unique index if not exists jobs_source_identity_key on public.jobs (source_name, source_job_id) where source_job_id is not null;

alter table public.job_submissions add column if not exists salary_currency text not null default 'NGN';
alter table public.job_submissions add column if not exists engagement_type text not null default 'employee';
alter table public.job_submissions add constraint job_submissions_salary_currency_check check (salary_currency in ('NGN', 'USD', 'GBP', 'EUR'));
alter table public.job_submissions add constraint job_submissions_engagement_type_check check (engagement_type in ('employee', 'contractor', 'unknown'));
grant insert (salary_currency, engagement_type) on public.job_submissions to anon;

create table if not exists public.job_suggestions (
  id uuid primary key default gen_random_uuid(),
  submitter_email text,
  official_url text not null check (official_url ~ '^https://'),
  company_name text not null check (length(company_name) between 2 and 120),
  advertised_salary text not null check (length(advertised_salary) between 3 and 160),
  notes text not null default '' check (length(notes) <= 1000),
  review_status text not null default 'pending' check (review_status in ('pending', 'reviewed', 'rejected')),
  created_at timestamptz not null default now()
);
alter table public.job_suggestions enable row level security;
create policy "anyone suggests official jobs" on public.job_suggestions for insert to anon, authenticated with check (review_status = 'pending');
create policy "admins read suggestions" on public.job_suggestions for select to authenticated using (public.is_current_user_admin());
create policy "admins update suggestions" on public.job_suggestions for update to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());
grant insert (submitter_email, official_url, company_name, advertised_salary, notes) on public.job_suggestions to anon, authenticated;
grant select on public.job_suggestions to authenticated;
grant update (review_status) on public.job_suggestions to authenticated;

create or replace function public.approve_job_submission(p_submission_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare s public.job_submissions%rowtype; new_id uuid; new_slug text;
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  select * into s from public.job_submissions where id = p_submission_id and review_status = 'pending' for update;
  if not found then raise exception 'Pending submission not found'; end if;
  new_id := gen_random_uuid();
  new_slug := lower(trim(both '-' from regexp_replace(s.title || '-' || s.company_name || '-' || left(new_id::text, 8), '[^a-zA-Z0-9]+', '-', 'g')));
  insert into public.jobs (id, slug, title, company_name, location, work_mode, employment_type, description, salary_min, salary_max, salary_period, salary_type, salary_currency, engagement_type, application_url, source_url, employer_verified, source_verified_at, source_last_seen_at, source_kind, source_name, salary_source, published_at, expires_at, status)
  values (new_id, new_slug, s.title, s.company_name, s.location, s.work_mode, s.employment_type, s.description, s.salary_min, s.salary_max, s.salary_period, s.salary_type, s.salary_currency, s.engagement_type, s.application_url, s.application_url, false, now(), now(), 'employer_submission', s.company_name, 'employer_disclosed', now(), s.expires_at, 'published');
  update public.job_submissions set review_status = 'approved' where id = s.id;
  return new_id;
end;
$$;

notify pgrst, 'reload schema';
