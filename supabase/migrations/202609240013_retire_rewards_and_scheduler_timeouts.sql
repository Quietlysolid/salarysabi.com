-- The contribution reward feature was retired before public use.
-- Preserve records but stop accepting new rewarded claims.
update public.contribution_campaigns set status='closed' where status in ('draft','active','paused');

-- pg_net's five-second default was timing out scheduled Edge Function calls.
-- Preserve the job schedule and active state; do not trigger a job here.
do $$
declare job record;
begin
  for job in select jobid,command from cron.job
    where jobname in ('salarysabi-job-alerts','salarysabi-ats-jobs-import','salarysabi-stale-job-check')
      and command not like '%timeout_milliseconds%'
  loop
    if position('body := ''{}''::jsonb' in job.command) = 0 then
      raise exception 'Unexpected scheduler command for job %',job.jobid;
    end if;
    perform cron.alter_job(job.jobid,command := replace(job.command,
      'body := ''{}''::jsonb','body := ''{}''::jsonb, timeout_milliseconds := 60000'));
  end loop;
end $$;
