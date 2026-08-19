alter table public.job_submissions add column if not exists submitter_type text not null default 'employer';
alter table public.job_submissions add column if not exists recruiter_company text;
alter table public.job_submissions add column if not exists client_display_name text;
alter table public.job_submissions add column if not exists authority_confirmed boolean not null default false;
alter table public.job_submissions add column if not exists no_candidate_fees_confirmed boolean not null default false;
alter table public.job_submissions add constraint job_submissions_submitter_type_check check (submitter_type in ('employer', 'recruiter'));
alter table public.job_submissions add constraint recruiter_details_required check (
  submitter_type = 'employer' or (
    length(trim(coalesce(recruiter_company, ''))) >= 2 and
    length(trim(coalesce(client_display_name, ''))) >= 2 and
    authority_confirmed and no_candidate_fees_confirmed
  )
);
grant insert (submitter_type, recruiter_company, client_display_name, authority_confirmed, no_candidate_fees_confirmed) on public.job_submissions to anon;

create or replace function public.approve_job_submission(p_submission_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare s public.job_submissions%rowtype; new_id uuid; new_slug text;
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  select * into s from public.job_submissions where id = p_submission_id and review_status = 'pending' for update;
  if not found then raise exception 'Pending submission not found'; end if;
  if not s.no_candidate_fees_confirmed then raise exception 'Candidate fee declaration is required'; end if;
  if s.submitter_type = 'recruiter' and (not s.authority_confirmed or length(trim(coalesce(s.recruiter_company, ''))) < 2 or length(trim(coalesce(s.client_display_name, ''))) < 2) then
    raise exception 'Recruiter identity, client designation and recruiting authority are required';
  end if;
  new_id := gen_random_uuid();
  new_slug := lower(trim(both '-' from regexp_replace(s.title || '-' || s.company_name || '-' || left(new_id::text, 8), '[^a-zA-Z0-9]+', '-', 'g')));
  insert into public.jobs (id, slug, title, company_name, location, work_mode, employment_type, description, salary_min, salary_max, salary_period, salary_type, salary_currency, engagement_type, application_url, source_url, employer_verified, source_verified_at, source_last_seen_at, source_kind, source_name, salary_source, published_at, expires_at, status)
  values (new_id, new_slug, s.title, s.company_name, s.location, s.work_mode, s.employment_type, s.description, s.salary_min, s.salary_max, s.salary_period, s.salary_type, s.salary_currency, s.engagement_type, s.application_url, s.application_url, false, now(), now(), 'employer_submission', case when s.submitter_type = 'recruiter' then s.recruiter_company else s.company_name end, 'employer_disclosed', now(), s.expires_at, 'published');
  update public.job_submissions set review_status = 'approved' where id = s.id;
  return new_id;
end;
$$;

notify pgrst, 'reload schema';
