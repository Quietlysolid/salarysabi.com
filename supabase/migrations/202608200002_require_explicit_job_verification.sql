-- Make employer-submission publication require the same explicit evidence confirmations as imported drafts.
create or replace function public.approve_verified_job_submission(
  p_submission_id uuid,
  p_application_confirmed boolean,
  p_salary_confirmed boolean,
  p_source_confirmed boolean
)
returns uuid language plpgsql security definer set search_path = public as $$
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  if not coalesce(p_application_confirmed,false) then raise exception 'Confirm that the application page is active'; end if;
  if not coalesce(p_salary_confirmed,false) then raise exception 'Confirm that the exact salary appears in the source'; end if;
  if not coalesce(p_source_confirmed,false) then raise exception 'Confirm the source identity and confidence level'; end if;
  return public.approve_job_submission(p_submission_id);
end;
$$;

revoke execute on function public.approve_job_submission(uuid) from authenticated;
revoke all on function public.approve_verified_job_submission(uuid,boolean,boolean,boolean) from public, anon, authenticated;
grant execute on function public.approve_verified_job_submission(uuid,boolean,boolean,boolean) to authenticated;
notify pgrst, 'reload schema';
