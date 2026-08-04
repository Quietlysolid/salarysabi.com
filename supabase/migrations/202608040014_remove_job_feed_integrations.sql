-- Remove database support that existed only to diagnose automated job feeds.
drop function if exists public.latest_job_import_response();

-- No feed-created jobs were published. Remove any dormant feed records if they
-- are ever present from an earlier test run.
delete from public.jobs
where source_name in ('Startup Jobs', 'Careerjet', 'Adzuna');
