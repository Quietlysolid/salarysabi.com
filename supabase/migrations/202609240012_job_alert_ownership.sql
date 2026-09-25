-- Alerts require the signed-in account's identity. The old permissive guest
-- policy also applied to authenticated users and bypassed that ownership check.
drop policy if exists "allow anonymous job alerts" on public.job_alerts;
revoke insert on public.job_alerts from anon, authenticated;
revoke insert (email, keywords, location, work_mode, consented_at, user_id, verified_at) on public.job_alerts from anon, authenticated;
grant insert (email, keywords, location, work_mode, consented_at, user_id) on public.job_alerts to authenticated;
notify pgrst, 'reload schema';
