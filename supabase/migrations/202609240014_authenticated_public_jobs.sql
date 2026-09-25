-- Signed-in job seekers need the same published-job visibility as guests.
-- Draft, archived and expired records remain restricted to administrators.
alter policy "read current published jobs" on public.jobs to anon,authenticated;
notify pgrst, 'reload schema';
