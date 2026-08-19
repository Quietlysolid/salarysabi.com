alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs add constraint jobs_status_check
  check (status in ('draft', 'published', 'expired', 'filled', 'rejected'));

create or replace function public.admin_job_metrics()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.is_current_user_admin() then jsonb_build_object(
    'published_jobs', (select count(*) from public.jobs where status = 'published' and expires_at >= current_date),
    'expired_jobs', (select count(*) from public.jobs where status in ('expired', 'filled') or expires_at < current_date),
    'pending_submissions', (select count(*) from public.job_submissions where review_status = 'pending'),
    'open_reports', (select count(*) from public.job_reports where status = 'open'),
    'active_alerts', (select count(*) from public.job_alerts where active),
    'saved_jobs', (select count(*) from public.saved_jobs),
    'tracked_applications', (select count(*) from public.job_applications),
    'apply_clicks_30d', (select coalesce(sum(event_count), 0) from public.analytics_daily where event_name = 'job_apply_clicked' and event_date >= current_date - 30)
  ) else null end;
$$;

notify pgrst, 'reload schema';
