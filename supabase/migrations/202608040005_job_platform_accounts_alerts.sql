alter table public.jobs add column if not exists filled_at timestamptz;

alter table public.job_alerts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.job_alerts add column if not exists verified_at timestamptz;
alter table public.job_alerts add column if not exists last_sent_at timestamptz;
alter table public.job_alerts add column if not exists unsubscribe_token uuid not null default gen_random_uuid();
create unique index if not exists job_alerts_unsubscribe_token_key on public.job_alerts (unsubscribe_token);

create policy "seekers read own alerts" on public.job_alerts for select to authenticated using (user_id = auth.uid());
create policy "seekers create own alerts" on public.job_alerts for insert to authenticated
with check (user_id = auth.uid() and email = lower(auth.jwt()->>'email'));
create policy "seekers update own alerts" on public.job_alerts for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid() and email = lower(auth.jwt()->>'email'));
create policy "seekers delete own alerts" on public.job_alerts for delete to authenticated using (user_id = auth.uid());
grant select, delete on public.job_alerts to authenticated;
grant insert (email, keywords, location, work_mode, consented_at, user_id, verified_at) on public.job_alerts to authenticated;
grant update (keywords, location, work_mode, active) on public.job_alerts to authenticated;

create table if not exists public.saved_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);
alter table public.saved_jobs enable row level security;
create policy "seekers manage own saved jobs" on public.saved_jobs for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, delete on public.saved_jobs to authenticated;

create table if not exists public.job_applications (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null default 'applied' check (status in ('applied', 'interviewing', 'offered', 'rejected', 'withdrawn')),
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, job_id)
);
alter table public.job_applications enable row level security;
create policy "seekers manage own applications" on public.job_applications for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.job_applications to authenticated;

create table if not exists public.job_reports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  reason text not null check (reason in ('expired', 'broken_link', 'misleading', 'fee_requested', 'other')),
  details text not null default '' check (length(details) <= 1000),
  reporter_email text check (reporter_email is null or length(reporter_email) between 5 and 254),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);
alter table public.job_reports enable row level security;
create policy "anyone reports a job" on public.job_reports for insert to anon, authenticated with check (status = 'open');
create policy "admins read reports" on public.job_reports for select to authenticated using (public.is_current_user_admin());
create policy "admins update reports" on public.job_reports for update to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());
grant insert (job_id, reason, details, reporter_email) on public.job_reports to anon, authenticated;
grant select on public.job_reports to authenticated;
grant update (status) on public.job_reports to authenticated;

create table if not exists public.job_notifications (
  alert_id uuid not null references public.job_alerts(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  provider_message_id text,
  sent_at timestamptz not null default now(),
  primary key (alert_id, job_id)
);
alter table public.job_notifications enable row level security;

create or replace function public.admin_job_metrics()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when public.is_current_user_admin() then jsonb_build_object(
    'published_jobs', (select count(*) from public.jobs where status = 'published' and expires_at >= current_date),
    'expired_jobs', (select count(*) from public.jobs where status = 'expired' or expires_at < current_date),
    'pending_submissions', (select count(*) from public.job_submissions where review_status = 'pending'),
    'open_reports', (select count(*) from public.job_reports where status = 'open'),
    'active_alerts', (select count(*) from public.job_alerts where active),
    'saved_jobs', (select count(*) from public.saved_jobs),
    'tracked_applications', (select count(*) from public.job_applications),
    'apply_clicks_30d', (select coalesce(sum(event_count), 0) from public.analytics_daily where event_name = 'job_apply_clicked' and event_date >= current_date - 30)
  ) else null end;
$$;
revoke all on function public.admin_job_metrics() from public, anon, authenticated;
grant execute on function public.admin_job_metrics() to authenticated;

create or replace function public.unsubscribe_job_alert(p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.job_alerts set active = false where unsubscribe_token = p_token and active;
  return found;
end;
$$;
revoke all on function public.unsubscribe_job_alert(uuid) from public, anon, authenticated;
grant execute on function public.unsubscribe_job_alert(uuid) to anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

do $$ begin
  if not exists (select 1 from vault.secrets where name = 'job_alert_cron_secret') then
    perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'job_alert_cron_secret');
  end if;
end $$;

create or replace function public.verify_job_alert_cron_secret(p_secret text)
returns boolean language sql stable security definer set search_path = public, vault as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'job_alert_cron_secret' and decrypted_secret = p_secret);
$$;
revoke all on function public.verify_job_alert_cron_secret(text) from public, anon, authenticated;
grant execute on function public.verify_job_alert_cron_secret(text) to service_role;

select cron.unschedule(jobid) from cron.job where jobname = 'salarysabi-job-alerts';
select cron.schedule(
  'salarysabi-job-alerts',
  '0 7 * * *',
  $$
    select net.http_post(
      url := 'https://npiujcemzypvuuvnxfem.supabase.co/functions/v1/send-job-alerts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'job_alert_cron_secret')
      ),
      body := '{}'::jsonb
    );
  $$
);

notify pgrst, 'reload schema';
