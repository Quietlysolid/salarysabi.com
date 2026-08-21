alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs add constraint jobs_status_check
  check (status in ('draft', 'published', 'expired', 'filled', 'rejected', 'archived'));

alter table public.jobs add column if not exists archived_at timestamptz;

create or replace function public.admin_delete_job(
  p_job_id uuid,
  p_confirmation text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.jobs%rowtype;
  saved_count integer;
  application_count integer;
  report_count integer;
  notification_count integer;
begin
  if not public.is_current_user_admin() then
    raise exception 'Administrator access required';
  end if;

  select * into target
  from public.jobs
  where id = p_job_id
  for update;

  if not found then
    raise exception 'Job not found';
  end if;

  if target.status not in ('expired', 'filled', 'rejected', 'archived')
    and not (target.status = 'published' and target.expires_at < current_date) then
    raise exception 'Archive or expire this job before deleting it permanently';
  end if;

  if trim(coalesce(p_confirmation, '')) <> target.title then
    raise exception 'Type the exact job title to confirm permanent deletion';
  end if;

  select count(*) into saved_count from public.saved_jobs where job_id = p_job_id;
  select count(*) into application_count from public.job_applications where job_id = p_job_id;
  select count(*) into report_count from public.job_reports where job_id = p_job_id;
  select count(*) into notification_count from public.job_notifications where job_id = p_job_id;

  delete from public.jobs where id = p_job_id;

  return jsonb_build_object(
    'deleted', true,
    'title', target.title,
    'saved_jobs_removed', saved_count,
    'applications_removed', application_count,
    'reports_removed', report_count,
    'notifications_removed', notification_count
  );
end;
$$;

revoke all on function public.admin_delete_job(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_delete_job(uuid, text) to authenticated;

notify pgrst, 'reload schema';
