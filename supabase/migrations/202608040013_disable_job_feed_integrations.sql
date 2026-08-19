-- SalarySabi is using manually checked official listings for its initial inventory.
-- Keep provider credentials and source code available, but stop all scheduled imports.
select cron.unschedule(jobid)
from cron.job
where jobname = 'salarysabi-startup-jobs-import';
