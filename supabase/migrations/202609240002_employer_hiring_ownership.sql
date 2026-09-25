-- New authenticated submissions are owned by their author. Never infer ownership from email.
alter table public.job_submissions add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
alter table public.job_submissions alter column owner_user_id set default auth.uid();
alter table public.job_submissions add column if not exists published_job_id uuid references public.jobs(id) on delete set null;
create index if not exists job_submissions_owner_idx on public.job_submissions(owner_user_id, created_at desc);
create policy "employers submit their own pending jobs" on public.job_submissions for insert to authenticated
with check (owner_user_id = auth.uid() and review_status = 'pending' and published_job_id is null and expires_at >= current_date);
grant insert (contact_email,title,company_name,location,work_mode,employment_type,description,salary_min,salary_max,salary_period,salary_type,salary_currency,engagement_type,submitter_type,recruiter_company,client_display_name,authority_confirmed,no_candidate_fees_confirmed,application_url,expires_at,consented_at) on public.job_submissions to authenticated;
-- Owners use a narrow read RPC: no write permission to moderation or ownership fields.
create or replace function public.employer_hiring_records()
returns table(id uuid,title text,company_name text,review_status text,created_at timestamptz,expires_at date,job_slug text,job_status text)
language sql stable security definer set search_path = public as $$
  select s.id,s.title,s.company_name,s.review_status,s.created_at,s.expires_at,j.slug,j.status
  from public.job_submissions s left join public.jobs j on j.id=s.published_job_id
  where s.owner_user_id=auth.uid() and auth.uid() is not null order by s.created_at desc;
$$;
revoke all on function public.employer_hiring_records() from public,anon;
grant execute on function public.employer_hiring_records() to authenticated;
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
  update public.job_submissions set review_status = 'approved', published_job_id = new_id where id = s.id;
  return new_id;
end;
$$;


notify pgrst, 'reload schema';
