-- Additive safeguards for salary-transparent job ingestion.
alter table public.jobs add column if not exists dedupe_key text;
alter table public.jobs add column if not exists source_confidence text;
alter table public.jobs add column if not exists salary_verified_at timestamptz;
alter table public.jobs add column if not exists application_verified_at timestamptz;
alter table public.jobs add column if not exists stale_check_failures integer not null default 0;
alter table public.jobs add column if not exists last_availability_check_at timestamptz;

alter table public.jobs drop constraint if exists jobs_source_confidence_check;
alter table public.jobs add constraint jobs_source_confidence_check
  check (source_confidence in ('high','medium','low'));
alter table public.jobs add constraint jobs_stale_check_failures_check
  check (stale_check_failures >= 0);

create or replace function public.normalize_job_identity_part(value text)
returns text language sql immutable strict as $$
  select trim(regexp_replace(lower(value), '[^a-z0-9]+', ' ', 'g'));
$$;

create or replace function public.make_job_dedupe_key(p_title text, p_company text, p_location text)
returns text language sql immutable strict as $$
  select public.normalize_job_identity_part(p_title) || '|' ||
         public.normalize_job_identity_part(p_company) || '|' ||
         public.normalize_job_identity_part(p_location);
$$;

update public.jobs set
  dedupe_key = public.make_job_dedupe_key(title, company_name, location),
  source_confidence = case
    when source_kind in ('employer_submission','official_page') and salary_source = 'employer_disclosed' then 'high'
    when source_kind in ('official_page','community_tip') then 'medium'
    else 'low'
  end,
  salary_verified_at = case when status = 'published' then coalesce(source_verified_at, published_at) else salary_verified_at end,
  application_verified_at = case when status = 'published' then coalesce(source_verified_at, published_at) else application_verified_at end,
  verification_status = case when status = 'published' then 'verified' else coalesce(verification_status, 'pending') end
where dedupe_key is null or source_confidence is null or (status = 'published' and (salary_verified_at is null or application_verified_at is null));

create index if not exists jobs_dedupe_key_idx on public.jobs (dedupe_key);
create index if not exists jobs_canonical_url_idx on public.jobs (canonical_url) where canonical_url is not null;

create or replace function public.prepare_and_guard_job()
returns trigger language plpgsql set search_path = public as $$
begin
  new.dedupe_key := public.make_job_dedupe_key(new.title, new.company_name, new.location);
  new.source_confidence := coalesce(new.source_confidence, case
    when new.source_kind in ('employer_submission','official_page') and new.salary_source = 'employer_disclosed' then 'high'
    when new.source_kind in ('official_page','community_tip') then 'medium'
    else 'low'
  end);
  if new.status = 'published' then
    if new.salary_min <= 0 or new.salary_max < new.salary_min then raise exception 'A verified positive salary range is required before publication'; end if;
    if new.source_url is null or new.source_url !~ '^https://' then raise exception 'An HTTPS evidence URL is required before publication'; end if;
    if new.salary_verified_at is null then raise exception 'Confirm the advertised salary before publication'; end if;
    if new.application_verified_at is null then raise exception 'Confirm the active application page before publication'; end if;
    if coalesce(new.verification_status, 'pending') <> 'verified' then raise exception 'Set verification status to verified before publication'; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prepare_and_guard_job_trigger on public.jobs;
create trigger prepare_and_guard_job_trigger before insert or update on public.jobs
for each row execute function public.prepare_and_guard_job();

create table if not exists public.job_import_sources (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('greenhouse','lever')),
  source_key text not null,
  company_name text not null check (length(trim(company_name)) >= 2),
  active boolean not null default true,
  nigeria_only boolean not null default true,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_message text,
  created_at timestamptz not null default now(),
  unique(provider, source_key)
);
alter table public.job_import_sources enable row level security;
create policy "admins manage import sources" on public.job_import_sources for all to authenticated
using (public.is_current_user_admin()) with check (public.is_current_user_admin());
grant select, insert, update, delete on public.job_import_sources to authenticated;

create or replace function public.find_job_duplicate(p_dedupe_key text, p_canonical_url text default null)
returns table(id uuid, slug text, status text) language sql stable security definer set search_path = public as $$
  select j.id, j.slug, j.status from public.jobs j
  where j.status in ('draft','published') and (
    j.dedupe_key = p_dedupe_key or
    (p_canonical_url is not null and j.canonical_url = p_canonical_url)
  ) order by case when j.status = 'published' then 0 else 1 end limit 1;
$$;
revoke all on function public.find_job_duplicate(text,text) from public, anon, authenticated;
grant execute on function public.find_job_duplicate(text,text) to service_role;

-- Existing approved employer submissions remain a deliberate human verification action.
create or replace function public.approve_job_submission(p_submission_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare s public.job_submissions%rowtype; new_id uuid; new_slug text; duplicate_id uuid;
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  select * into s from public.job_submissions where id = p_submission_id and review_status = 'pending' for update;
  if not found then raise exception 'Pending submission not found'; end if;
  if not s.no_candidate_fees_confirmed then raise exception 'Candidate fee declaration is required'; end if;
  if s.submitter_type = 'recruiter' and (not s.authority_confirmed or length(trim(coalesce(s.recruiter_company, ''))) < 2 or length(trim(coalesce(s.client_display_name, ''))) < 2) then raise exception 'Recruiter identity, client designation and recruiting authority are required'; end if;
  select id into duplicate_id from public.jobs where status in ('draft','published') and dedupe_key = public.make_job_dedupe_key(s.title,s.company_name,s.location) limit 1;
  if duplicate_id is not null then raise exception 'A matching job already exists in the review queue or public board'; end if;
  new_id := gen_random_uuid();
  new_slug := lower(trim(both '-' from regexp_replace(s.title || '-' || s.company_name || '-' || left(new_id::text, 8), '[^a-zA-Z0-9]+', '-', 'g')));
  insert into public.jobs (id,slug,title,company_name,location,work_mode,employment_type,description,salary_min,salary_max,salary_period,salary_type,salary_currency,engagement_type,application_url,source_url,employer_verified,source_verified_at,source_last_seen_at,source_kind,source_name,salary_source,published_at,expires_at,status,source_confidence,salary_verified_at,application_verified_at,verification_status)
  values (new_id,new_slug,s.title,s.company_name,s.location,s.work_mode,s.employment_type,s.description,s.salary_min,s.salary_max,s.salary_period,s.salary_type,s.salary_currency,s.engagement_type,s.application_url,s.application_url,false,now(),now(),'employer_submission',case when s.submitter_type='recruiter' then s.recruiter_company else s.company_name end,'employer_disclosed',now(),s.expires_at,'published','high',now(),now(),'verified');
  update public.job_submissions set review_status = 'approved' where id = s.id;
  return new_id;
end;
$$;

select cron.unschedule(jobid) from cron.job where jobname = 'salarysabi-ats-jobs-import';
select cron.schedule('salarysabi-ats-jobs-import','30 6 * * *',$$select net.http_post(
  url := 'https://npiujcemzypvuuvnxfem.supabase.co/functions/v1/import-ats-jobs',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='job_alert_cron_secret')),
  body := '{}'::jsonb);$$);

select cron.unschedule(jobid) from cron.job where jobname = 'salarysabi-stale-job-check';
select cron.schedule('salarysabi-stale-job-check','15 5 * * *',$$select net.http_post(
  url := 'https://npiujcemzypvuuvnxfem.supabase.co/functions/v1/check-stale-jobs',
  headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select decrypted_secret from vault.decrypted_secrets where name='job_alert_cron_secret')),
  body := '{}'::jsonb);$$);

notify pgrst, 'reload schema';
