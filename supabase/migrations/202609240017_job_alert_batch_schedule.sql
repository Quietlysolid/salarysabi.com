-- Short resumable batches. Each alert still receives at most one digest per 24 hours.
-- Preserve the existing command, secret, HTTP timeout and active state.
do $$
declare j record;
begin
  for j in select jobid from cron.job where jobname='salarysabi-job-alerts' loop
    perform cron.alter_job(j.jobid,schedule := '*/5 * * * *');
  end loop;
end $$;
