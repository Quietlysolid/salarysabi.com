-- Make the paid job-scout pilot safe to activate and review end to end.
update public.contribution_campaigns
set description = 'Find current Nigerian vacancies on official employer pages where an offered salary is already visible.',
    eligibility_note = 'Rewarded after SalarySabi confirms the vacancy is open, Nigeria-relevant, non-duplicated and shows an offered salary with its pay period.'
where slug = 'transparent-jobs-pilot-2026';

create or replace function public.admin_set_contribution_campaign_status(
  p_campaign_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  campaign public.contribution_campaigns;
begin
  if not public.is_current_user_admin() then
    raise exception 'Administrator access required';
  end if;
  if p_status not in ('active', 'paused', 'closed') then
    raise exception 'Invalid campaign status';
  end if;

  select * into campaign
  from public.contribution_campaigns
  where id = p_campaign_id
  for update;

  if campaign.id is null then raise exception 'Campaign not found'; end if;
  if campaign.status = 'closed' then raise exception 'Closed campaigns cannot be reopened'; end if;

  if p_status = 'active' then
    if campaign.ends_at <= now() then raise exception 'Extend the campaign end date before activation'; end if;
    if campaign.starts_at > now() then raise exception 'The campaign start date has not arrived'; end if;
    if campaign.reward_kobo <= 0 then raise exception 'Set a positive reward before activation'; end if;
    if campaign.budget_kobo - campaign.committed_kobo < campaign.reward_kobo then
      raise exception 'The remaining budget cannot fund another reward';
    end if;
  elsif p_status = 'paused' and campaign.status <> 'active' then
    raise exception 'Only an active campaign can be paused';
  end if;

  update public.contribution_campaigns set status = p_status where id = campaign.id;
end;
$$;

create or replace function public.admin_review_job_source_claim(
  p_claim_id uuid,
  p_decision text,
  p_note text default '',
  p_application_confirmed boolean default false,
  p_salary_confirmed boolean default false,
  p_nigeria_confirmed boolean default false,
  p_duplicate_checked boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  claim public.contribution_claims;
  suggestion public.job_suggestions;
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'Invalid decision'; end if;

  select * into claim
  from public.contribution_claims
  where id = p_claim_id
  for update;

  if claim.id is null or claim.status <> 'pending' or claim.contribution_type <> 'job_source' then
    raise exception 'Pending job-source claim not found';
  end if;

  select * into suggestion
  from public.job_suggestions
  where id = claim.source_record_id
  for update;

  if suggestion.id is null then raise exception 'The linked job suggestion is missing'; end if;

  if p_decision = 'approved' then
    if not (p_application_confirmed and p_salary_confirmed and p_nigeria_confirmed and p_duplicate_checked) then
      raise exception 'Complete all four source checks before approving the reward';
    end if;
    if suggestion.official_url !~ '^https://' then raise exception 'A secure official source URL is required'; end if;
    if suggestion.advertised_salary !~* '(₦|NGN|Naira|USD|GBP|EUR|\$|£|€)' or suggestion.advertised_salary !~ '[0-9]' then
      raise exception 'The source must state a currency and numerical salary';
    end if;

    update public.job_suggestions set review_status = 'reviewed' where id = suggestion.id;
    update public.contribution_claims
    set status = 'approved', review_note = nullif(trim(p_note), ''), reviewed_by = auth.uid(), reviewed_at = now()
    where id = claim.id;
    insert into public.contributor_ledger(contributor_id, claim_id, entry_type, amount_kobo, note)
    values(claim.contributor_id, claim.id, 'reward', claim.reward_kobo, 'Approved salary-transparent job source');
  else
    if char_length(trim(p_note)) < 5 then raise exception 'Add a clear rejection reason'; end if;
    update public.job_suggestions set review_status = 'rejected' where id = suggestion.id;
    update public.contribution_claims
    set status = 'rejected', review_note = trim(p_note), reviewed_by = auth.uid(), reviewed_at = now()
    where id = claim.id;
    update public.contribution_campaigns
    set committed_kobo = greatest(0, committed_kobo - claim.reward_kobo)
    where id = claim.campaign_id;
  end if;
end;
$$;

drop policy if exists "admins read salary reports" on public.salary_reports;
create policy "admins read salary reports"
on public.salary_reports for select to authenticated
using (public.is_current_user_admin());
grant select on public.salary_reports to authenticated;

create or replace function public.admin_review_salary_report_claim(
  p_claim_id uuid,
  p_decision text,
  p_note text default '',
  p_plausibility_confirmed boolean default false,
  p_privacy_confirmed boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  claim public.contribution_claims;
  report public.salary_reports;
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'Invalid decision'; end if;

  select * into claim
  from public.contribution_claims
  where id = p_claim_id
  for update;
  if claim.id is null or claim.status <> 'pending' or claim.contribution_type <> 'salary_report' then
    raise exception 'Pending salary-report claim not found';
  end if;

  select * into report from public.salary_reports where id = claim.source_record_id for update;
  if report.id is null then raise exception 'The linked salary report is missing'; end if;

  if p_decision = 'approved' then
    if not (p_plausibility_confirmed and p_privacy_confirmed) then
      raise exception 'Complete both salary-report checks before approving the reward';
    end if;
    update public.salary_reports set approved = true where id = report.id;
    update public.contribution_claims
    set status = 'approved', review_note = nullif(trim(p_note), ''), reviewed_by = auth.uid(), reviewed_at = now()
    where id = claim.id;
    insert into public.contributor_ledger(contributor_id, claim_id, entry_type, amount_kobo, note)
    values(claim.contributor_id, claim.id, 'reward', claim.reward_kobo, 'Approved anonymous salary report');
  else
    if char_length(trim(p_note)) < 5 then raise exception 'Add a clear rejection reason'; end if;
    update public.salary_reports set approved = false where id = report.id;
    update public.contribution_claims
    set status = 'rejected', review_note = trim(p_note), reviewed_by = auth.uid(), reviewed_at = now()
    where id = claim.id;
    update public.contribution_campaigns
    set committed_kobo = greatest(0, committed_kobo - claim.reward_kobo)
    where id = claim.campaign_id;
  end if;
end;
$$;

revoke all on function public.admin_set_contribution_campaign_status(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_review_job_source_claim(uuid, text, text, boolean, boolean, boolean, boolean) from public, anon, authenticated;
revoke all on function public.admin_review_salary_report_claim(uuid, text, text, boolean, boolean) from public, anon, authenticated;
grant execute on function public.admin_set_contribution_campaign_status(uuid, text) to authenticated;
grant execute on function public.admin_review_job_source_claim(uuid, text, text, boolean, boolean, boolean, boolean) to authenticated;
grant execute on function public.admin_review_salary_report_claim(uuid, text, text, boolean, boolean) to authenticated;

notify pgrst, 'reload schema';
