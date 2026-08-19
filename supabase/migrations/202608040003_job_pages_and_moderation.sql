alter table public.jobs add column if not exists slug text;

update public.jobs
set slug = lower(trim(both '-' from regexp_replace(title || '-' || company_name || '-' || left(id::text, 8), '[^a-zA-Z0-9]+', '-', 'g')))
where slug is null;

alter table public.jobs alter column slug set not null;
create unique index if not exists jobs_slug_key on public.jobs (slug);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

create or replace function public.is_current_user_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_current_user_admin() from public, anon, authenticated;
grant execute on function public.is_current_user_admin() to authenticated;

create policy "admins read submissions" on public.job_submissions for select to authenticated using (public.is_current_user_admin());
create policy "admins update submissions" on public.job_submissions for update to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());
create policy "admins manage jobs" on public.jobs for all to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());

create or replace function public.approve_job_submission(p_submission_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare s public.job_submissions%rowtype; new_id uuid; new_slug text;
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  select * into s from public.job_submissions where id = p_submission_id and review_status = 'pending' for update;
  if not found then raise exception 'Pending submission not found'; end if;
  new_id := gen_random_uuid();
  new_slug := lower(trim(both '-' from regexp_replace(s.title || '-' || s.company_name || '-' || left(new_id::text, 8), '[^a-zA-Z0-9]+', '-', 'g')));
  insert into public.jobs (id, slug, title, company_name, location, work_mode, employment_type, description, salary_min, salary_max, salary_period, salary_type, application_url, source_url, employer_verified, source_verified_at, published_at, expires_at, status)
  values (new_id, new_slug, s.title, s.company_name, s.location, s.work_mode, s.employment_type, s.description, s.salary_min, s.salary_max, s.salary_period, s.salary_type, s.application_url, s.application_url, false, now(), now(), s.expires_at, 'published');
  update public.job_submissions set review_status = 'approved' where id = s.id;
  return new_id;
end;
$$;

create or replace function public.reject_job_submission(p_submission_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  update public.job_submissions set review_status = 'rejected' where id = p_submission_id and review_status = 'pending';
end;
$$;

revoke all on function public.approve_job_submission(uuid) from public, anon, authenticated;
revoke all on function public.reject_job_submission(uuid) from public, anon, authenticated;
grant execute on function public.approve_job_submission(uuid) to authenticated;
grant execute on function public.reject_job_submission(uuid) to authenticated;

notify pgrst, 'reload schema';
