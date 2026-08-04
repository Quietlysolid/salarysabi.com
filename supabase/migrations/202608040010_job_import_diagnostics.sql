create or replace function public.latest_job_import_response()
returns table(status_code integer, response_body text)
language sql security definer set search_path = public, net
as $$
  select r.status_code, r.content::text
  from net._http_response r
  where r.created at time zone 'UTC' > now() at time zone 'UTC' - interval '6 hours'
  order by r.created desc
  limit 1;
$$;
revoke all on function public.latest_job_import_response() from public, anon, authenticated;
grant execute on function public.latest_job_import_response() to service_role;
