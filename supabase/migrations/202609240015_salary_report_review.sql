-- Review ordinary community submissions without the retired rewards workflow.
create or replace function public.review_community_salary_report(
  p_report_id uuid, p_publish boolean, p_note text, p_checks_confirmed boolean
) returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  if p_publish is null or p_note is null or length(trim(p_note)) not between 5 and 1000 then
    raise exception 'A decision and review note are required';
  end if;
  if p_publish and p_checks_confirmed is distinct from true then raise exception 'Complete the review checks'; end if;
  update public.salary_reports set approved=p_publish,
    publication_status=case when p_publish then 'published' else 'suppressed' end,
    published_at=case when p_publish then now() else null end,
    publication_reviewed_by=auth.uid(),publication_review_note=trim(p_note)
  where id=p_report_id and publication_status='pending';
  if not found then raise exception 'Pending report not found; refresh the queue'; end if;
end $$;
revoke all on function public.review_community_salary_report(uuid,boolean,text,boolean) from public,anon,authenticated;
grant execute on function public.review_community_salary_report(uuid,boolean,text,boolean) to authenticated;
notify pgrst, 'reload schema';
