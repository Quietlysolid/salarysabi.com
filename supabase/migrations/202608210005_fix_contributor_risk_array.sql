-- Keep the risk-reason accumulator explicitly typed for PL/pgSQL linting.
create or replace function public.reserve_contribution_claim_for(
  p_contributor_id uuid, p_campaign_id uuid, p_type text, p_source_record_id uuid,
  p_submission_fingerprint text, p_network_fingerprint text, p_device_fingerprint text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  c public.contribution_campaigns;
  profile public.contributor_profiles;
  claim_id uuid;
  campaign_count integer;
  pending_count integer;
  network_count integer;
  device_count integer;
  rejection_count integer;
  score integer := 0;
  reasons text[] := '{}'::text[];
  claim_risk text := 'low';
begin
  if current_user not in ('service_role','postgres') then raise exception 'Service access required'; end if;
  if not exists(select 1 from auth.users where id=p_contributor_id) then raise exception 'Contributor account not found'; end if;
  insert into public.contributor_profiles(user_id) values(p_contributor_id) on conflict(user_id) do nothing;
  select * into profile from public.contributor_profiles where user_id=p_contributor_id for update;
  if profile.status <> 'active' or profile.risk_status='blocked' then raise exception 'This contributor account cannot submit reward claims'; end if;

  select * into c from public.contribution_campaigns where id=p_campaign_id for update;
  if c.id is null or c.status<>'active' or now() not between c.starts_at and c.ends_at then raise exception 'Campaign is not active'; end if;
  if c.contribution_type<>p_type then raise exception 'Wrong campaign type'; end if;
  if c.committed_kobo+c.reward_kobo>c.budget_kobo then raise exception 'Campaign budget exhausted'; end if;
  select count(*) into campaign_count from public.contribution_claims where campaign_id=c.id and contributor_id=p_contributor_id and status in ('pending','approved');
  if campaign_count>=c.max_rewards_per_contributor then raise exception 'Contributor campaign limit reached'; end if;
  select count(*) into pending_count from public.contribution_claims where contributor_id=p_contributor_id and status='pending';
  if (profile.level='new' and pending_count>=1) or (profile.level='verified' and pending_count>=3) or pending_count>=5 then
    raise exception 'Finish the current review before sending more rewarded contributions';
  end if;
  if exists(select 1 from public.contribution_claims where submission_fingerprint=p_submission_fingerprint and status in ('pending','approved')) then
    raise exception 'This contribution has already been submitted';
  end if;

  select count(*) into network_count from public.contribution_claims where network_fingerprint=p_network_fingerprint and created_at>now()-interval '30 days';
  select count(*) into device_count from public.contribution_claims where device_fingerprint=p_device_fingerprint and created_at>now()-interval '30 days';
  select count(*) into rejection_count from public.contribution_claims where contributor_id=p_contributor_id and status='rejected' and created_at>now()-interval '90 days';
  if network_count>=3 then score:=score+25; reasons:=array_append(reasons,'Several recent claims share a protected network fingerprint.'); end if;
  if device_count>=2 then score:=score+30; reasons:=array_append(reasons,'Several recent claims share a protected device fingerprint.'); end if;
  if rejection_count>=2 then score:=score+35; reasons:=array_append(reasons,'This contributor has multiple recent rejected claims.'); end if;
  score:=least(score,100);
  claim_risk:=case when score>=80 then 'high' when score>0 then 'review' else 'low' end;

  insert into public.contribution_claims(
    campaign_id,contributor_id,contribution_type,source_record_id,reward_kobo,
    risk_score,risk_status,risk_reasons,submission_fingerprint,network_fingerprint,device_fingerprint,publication_status
  ) values(
    c.id,p_contributor_id,p_type,p_source_record_id,c.reward_kobo,
    score,claim_risk,reasons,p_submission_fingerprint,p_network_fingerprint,p_device_fingerprint,
    case when p_type='salary_report' then 'pending' else 'not_applicable' end
  ) returning id into claim_id;
  update public.contribution_campaigns set committed_kobo=committed_kobo+c.reward_kobo where id=c.id;
  if score>0 then
    insert into public.contributor_risk_events(contributor_id,claim_id,category,severity,code,detail,expires_at)
    values(p_contributor_id,claim_id,'submission',score,'automated-review',array_to_string(reasons,' '),now()+interval '180 days');
    update public.contributor_profiles set risk_status='review',updated_at=now() where user_id=p_contributor_id and risk_status='clear';
  end if;
  return claim_id;
end; $$;
