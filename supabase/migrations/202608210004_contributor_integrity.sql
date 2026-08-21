-- Contributor integrity: server-only rewarded submissions, data quarantine,
-- reputation-aware limits, payout cooling periods and append-only audit history.

alter table public.contributor_profiles
  add column if not exists approved_claims_count integer not null default 0,
  add column if not exists rejected_claims_count integer not null default 0,
  add column if not exists risk_status text not null default 'clear',
  add column if not exists last_reviewed_at timestamptz;

alter table public.contributor_profiles drop constraint if exists contributor_profiles_risk_status_check;
alter table public.contributor_profiles add constraint contributor_profiles_risk_status_check
  check (risk_status in ('clear','review','blocked'));

alter table public.contribution_claims
  add column if not exists risk_score smallint not null default 0,
  add column if not exists risk_status text not null default 'review',
  add column if not exists risk_reasons text[] not null default '{}',
  add column if not exists submission_fingerprint text,
  add column if not exists network_fingerprint text,
  add column if not exists device_fingerprint text,
  add column if not exists publication_status text not null default 'not_applicable';

alter table public.contribution_claims drop constraint if exists contribution_claims_risk_score_check;
alter table public.contribution_claims add constraint contribution_claims_risk_score_check check (risk_score between 0 and 100);
alter table public.contribution_claims drop constraint if exists contribution_claims_risk_status_check;
alter table public.contribution_claims add constraint contribution_claims_risk_status_check check (risk_status in ('low','review','high','blocked'));
alter table public.contribution_claims drop constraint if exists contribution_claims_publication_status_check;
alter table public.contribution_claims add constraint contribution_claims_publication_status_check
  check (publication_status in ('not_applicable','pending','quarantined','published','suppressed'));

create unique index if not exists contribution_claim_unique_submission_fingerprint
on public.contribution_claims(submission_fingerprint)
where submission_fingerprint is not null and status in ('pending','approved');
create index if not exists contribution_claim_network_risk_idx on public.contribution_claims(network_fingerprint, created_at desc);
create index if not exists contribution_claim_device_risk_idx on public.contribution_claims(device_fingerprint, created_at desc);

alter table public.salary_reports
  add column if not exists publication_status text not null default 'pending',
  add column if not exists published_at timestamptz,
  add column if not exists publication_reviewed_by uuid references auth.users(id),
  add column if not exists publication_review_note text;

alter table public.salary_reports drop constraint if exists salary_reports_publication_status_check;
alter table public.salary_reports add constraint salary_reports_publication_status_check
  check (publication_status in ('pending','quarantined','published','suppressed'));

update public.salary_reports
set publication_status = case when approved then 'published' else 'pending' end,
    published_at = case when approved then coalesce(published_at, created_at) else null end;

alter table public.contributor_ledger add column if not exists available_at timestamptz not null default now();
create index if not exists contributor_ledger_available_idx on public.contributor_ledger(contributor_id, available_at);

create table if not exists public.contribution_evidence_snapshots (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.contribution_claims(id) on delete cascade,
  source_url text not null,
  canonical_url text not null,
  source_domain text not null,
  page_title text,
  salary_excerpt text,
  content_fingerprint text,
  fetch_status text not null check (fetch_status in ('verified','unavailable','mismatch')),
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.contribution_rate_limits (
  action text not null,
  bucket_hash text not null,
  window_started_at timestamptz not null,
  attempt_count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key(action, bucket_hash)
);

create table if not exists public.contributor_risk_events (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid references auth.users(id) on delete cascade,
  claim_id uuid references public.contribution_claims(id) on delete cascade,
  category text not null,
  severity smallint not null check (severity between 1 and 100),
  code text not null,
  detail text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.contributor_admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  subject_type text not null,
  subject_id text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.contribution_evidence_snapshots enable row level security;
alter table public.contribution_rate_limits enable row level security;
alter table public.contributor_risk_events enable row level security;
alter table public.contributor_admin_audit_log enable row level security;

create policy "admins read contribution evidence" on public.contribution_evidence_snapshots
  for select to authenticated using (public.is_current_user_admin());
create policy "admins read contributor risk events" on public.contributor_risk_events
  for select to authenticated using (public.is_current_user_admin());
create policy "admins read contributor audit history" on public.contributor_admin_audit_log
  for select to authenticated using (public.is_current_user_admin());

grant select on public.contribution_evidence_snapshots, public.contributor_risk_events, public.contributor_admin_audit_log to authenticated;

create or replace function public.service_consume_contribution_rate_limit(p_action text, p_bucket_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_limit integer;
  v_window interval;
  v_row public.contribution_rate_limits;
begin
  if current_user not in ('service_role','postgres') then raise exception 'Service access required'; end if;
  if char_length(p_bucket_hash) < 32 then raise exception 'Invalid rate-limit bucket'; end if;
  case p_action
    when 'reward_submit_network' then v_limit := 6; v_window := interval '1 hour';
    when 'reward_submit_device' then v_limit := 4; v_window := interval '1 hour';
    when 'reward_submit_contributor' then v_limit := 3; v_window := interval '1 hour';
    else raise exception 'Unknown rate-limit action';
  end case;
  perform pg_advisory_xact_lock(hashtextextended(p_action || ':' || p_bucket_hash, 0));
  select * into v_row from public.contribution_rate_limits where action=p_action and bucket_hash=p_bucket_hash for update;
  if v_row.action is null or v_row.window_started_at + v_window <= now() then
    insert into public.contribution_rate_limits(action,bucket_hash,window_started_at,attempt_count,updated_at)
    values(p_action,p_bucket_hash,now(),1,now())
    on conflict(action,bucket_hash) do update set window_started_at=excluded.window_started_at,attempt_count=1,updated_at=now();
    return true;
  end if;
  update public.contribution_rate_limits set attempt_count=attempt_count+1,updated_at=now()
  where action=p_action and bucket_hash=p_bucket_hash;
  return v_row.attempt_count < v_limit;
end; $$;

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
  reasons text[] := '{}';
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

create or replace function public.service_submit_rewarded_salary_report(
  p_contributor_id uuid,p_campaign_id uuid,p_role text,p_industry text,p_location text,
  p_experience_band text,p_company_size text,p_monthly_gross numeric,p_pay_reliability text,
  p_submission_fingerprint text,p_network_fingerprint text,p_device_fingerprint text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare report_id uuid; claim_id uuid;
begin
  if current_user not in ('service_role','postgres') then raise exception 'Service access required'; end if;
  if char_length(trim(p_role)) not between 2 and 80 or char_length(trim(p_industry)) not between 2 and 80 or char_length(trim(p_location)) not between 2 and 80 then raise exception 'Complete the job details'; end if;
  if p_experience_band not in ('0-2','3-5','6-9','10+') or p_company_size not in ('1-10','11-50','51-200','201+') or p_pay_reliability not in ('on-time','sometimes-late','frequently-late') then raise exception 'Invalid salary report selection'; end if;
  if p_monthly_gross not between 1000 and 100000000 then raise exception 'Enter a realistic monthly salary'; end if;
  insert into public.salary_reports(role,industry,location,experience_band,company_size,monthly_gross,pay_reliability,approved,publication_status)
  values(trim(p_role),trim(p_industry),trim(p_location),p_experience_band,p_company_size,p_monthly_gross,p_pay_reliability,false,'pending') returning id into report_id;
  begin
    claim_id:=public.reserve_contribution_claim_for(p_contributor_id,p_campaign_id,'salary_report',report_id,p_submission_fingerprint,p_network_fingerprint,p_device_fingerprint);
  exception when others then delete from public.salary_reports where id=report_id; raise; end;
  return jsonb_build_object('report_id',report_id,'claim_id',claim_id,'status','in_review');
end; $$;

create or replace function public.service_submit_rewarded_job_source(
  p_contributor_id uuid,p_campaign_id uuid,p_official_url text,p_company_name text,p_advertised_salary text,p_notes text,
  p_submission_fingerprint text,p_network_fingerprint text,p_device_fingerprint text,
  p_canonical_url text,p_source_domain text,p_page_title text,p_salary_excerpt text,p_content_fingerprint text,p_fetch_status text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare suggestion_id uuid; claim_id uuid; v_email text;
begin
  if current_user not in ('service_role','postgres') then raise exception 'Service access required'; end if;
  if p_official_url !~ '^https://' then raise exception 'Use a secure official vacancy URL'; end if;
  if char_length(trim(p_company_name)) not between 2 and 120 then raise exception 'Enter the employer name'; end if;
  if char_length(trim(p_advertised_salary)) not between 3 and 160 or p_advertised_salary !~ '[0-9]' then raise exception 'Enter the salary exactly as published'; end if;
  if p_fetch_status <> 'verified' then raise exception 'The official vacancy page could not be verified'; end if;
  select lower(email) into v_email from auth.users where id=p_contributor_id;
  insert into public.job_suggestions(official_url,company_name,advertised_salary,notes,submitter_email)
  values(trim(p_official_url),trim(p_company_name),trim(p_advertised_salary),left(trim(p_notes),1000),v_email) returning id into suggestion_id;
  begin
    claim_id:=public.reserve_contribution_claim_for(p_contributor_id,p_campaign_id,'job_source',suggestion_id,p_submission_fingerprint,p_network_fingerprint,p_device_fingerprint);
  exception when others then delete from public.job_suggestions where id=suggestion_id; raise; end;
  insert into public.contribution_evidence_snapshots(claim_id,source_url,canonical_url,source_domain,page_title,salary_excerpt,content_fingerprint,fetch_status)
  values(claim_id,p_official_url,p_canonical_url,p_source_domain,nullif(left(trim(p_page_title),240),''),nullif(left(trim(p_salary_excerpt),500),''),p_content_fingerprint,p_fetch_status);
  return jsonb_build_object('suggestion_id',suggestion_id,'claim_id',claim_id,'status','in_review');
end; $$;

create or replace function public.recalculate_contributor_trust()
returns trigger language plpgsql security definer set search_path = public as $$
declare approved_count integer; rejected_count integer; next_level text;
begin
  if tg_op='UPDATE' and old.status is not distinct from new.status then return new; end if;
  select count(*) filter(where status='approved'),count(*) filter(where status='rejected')
  into approved_count,rejected_count from public.contribution_claims where contributor_id=new.contributor_id;
  next_level:=case when approved_count>=5 and rejected_count<=1 then 'trusted' when approved_count>=2 then 'verified' else 'new' end;
  update public.contributor_profiles set level=next_level,approved_claims_count=approved_count,rejected_claims_count=rejected_count,
    risk_status=case when status='banned' then 'blocked' when rejected_count>=3 then 'review' else risk_status end,
    last_reviewed_at=case when new.status in ('approved','rejected') then now() else last_reviewed_at end,updated_at=now()
  where user_id=new.contributor_id;
  return new;
end; $$;

drop trigger if exists contribution_claim_trust_refresh on public.contribution_claims;
create trigger contribution_claim_trust_refresh after insert or update of status on public.contribution_claims
for each row execute function public.recalculate_contributor_trust();

create or replace function public.reward_release_time(p_contributor_id uuid)
returns timestamptz language sql stable security definer set search_path=public as $$
  select now()+case coalesce((select level from public.contributor_profiles where user_id=p_contributor_id),'new')
    when 'trusted' then interval '0 days' when 'verified' then interval '1 day' else interval '7 days' end;
$$;

drop function if exists public.admin_review_job_source_claim(uuid,text,text,boolean,boolean,boolean,boolean);
create function public.admin_review_job_source_claim(
  p_claim_id uuid,p_decision text,p_note text default '',p_application_confirmed boolean default false,
  p_salary_confirmed boolean default false,p_nigeria_confirmed boolean default false,p_duplicate_checked boolean default false,
  p_risk_reviewed boolean default false
)
returns void language plpgsql security definer set search_path=public as $$
declare claim public.contribution_claims; suggestion public.job_suggestions; snapshot public.contribution_evidence_snapshots;
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  select * into claim from public.contribution_claims where id=p_claim_id for update;
  if claim.id is null or claim.status<>'pending' or claim.contribution_type<>'job_source' then raise exception 'Pending job-source claim not found'; end if;
  select * into suggestion from public.job_suggestions where id=claim.source_record_id for update;
  select * into snapshot from public.contribution_evidence_snapshots where claim_id=claim.id;
  if suggestion.id is null then raise exception 'The linked job suggestion is missing'; end if;
  if p_decision='approved' then
    if claim.risk_status='blocked' then raise exception 'This claim is blocked'; end if;
    if claim.risk_score>0 and not p_risk_reviewed then raise exception 'Review the protected risk signals before approving'; end if;
    if not (p_application_confirmed and p_salary_confirmed and p_nigeria_confirmed and p_duplicate_checked) then raise exception 'Complete all source checks before approving the reward'; end if;
    if snapshot.id is not null and snapshot.fetch_status<>'verified' then raise exception 'The captured source evidence is not verified'; end if;
    update public.job_suggestions set review_status='reviewed' where id=suggestion.id;
    update public.contribution_claims set status='approved',risk_status=case when risk_status='blocked' then risk_status else 'low' end,
      review_note=nullif(trim(p_note),''),reviewed_by=auth.uid(),reviewed_at=now() where id=claim.id;
    insert into public.contributor_ledger(contributor_id,claim_id,entry_type,amount_kobo,note,available_at)
    values(claim.contributor_id,claim.id,'reward',claim.reward_kobo,'Approved salary-transparent job source',public.reward_release_time(claim.contributor_id));
  else
    if char_length(trim(p_note))<5 then raise exception 'Add a clear rejection reason'; end if;
    update public.job_suggestions set review_status='rejected' where id=suggestion.id;
    update public.contribution_claims set status='rejected',review_note=trim(p_note),reviewed_by=auth.uid(),reviewed_at=now() where id=claim.id;
    update public.contribution_campaigns set committed_kobo=greatest(0,committed_kobo-claim.reward_kobo) where id=claim.campaign_id;
  end if;
end; $$;

drop function if exists public.admin_review_salary_report_claim(uuid,text,text,boolean,boolean);
create function public.admin_review_salary_report_claim(
  p_claim_id uuid,p_decision text,p_note text default '',p_plausibility_confirmed boolean default false,
  p_privacy_confirmed boolean default false,p_risk_reviewed boolean default false
)
returns void language plpgsql security definer set search_path=public as $$
declare claim public.contribution_claims; report public.salary_reports;
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  select * into claim from public.contribution_claims where id=p_claim_id for update;
  if claim.id is null or claim.status<>'pending' or claim.contribution_type<>'salary_report' then raise exception 'Pending salary-report claim not found'; end if;
  select * into report from public.salary_reports where id=claim.source_record_id for update;
  if report.id is null then raise exception 'The linked salary report is missing'; end if;
  if p_decision='approved' then
    if claim.risk_status='blocked' then raise exception 'This claim is blocked'; end if;
    if claim.risk_score>0 and not p_risk_reviewed then raise exception 'Review the protected risk signals before approving'; end if;
    if not (p_plausibility_confirmed and p_privacy_confirmed) then raise exception 'Complete both salary-report checks before approving the reward'; end if;
    update public.salary_reports set approved=false,publication_status='quarantined' where id=report.id;
    update public.contribution_claims set status='approved',publication_status='quarantined',risk_status=case when risk_status='blocked' then risk_status else 'low' end,
      review_note=nullif(trim(p_note),''),reviewed_by=auth.uid(),reviewed_at=now() where id=claim.id;
    insert into public.contributor_ledger(contributor_id,claim_id,entry_type,amount_kobo,note,available_at)
    values(claim.contributor_id,claim.id,'reward',claim.reward_kobo,'Approved anonymous salary report',public.reward_release_time(claim.contributor_id));
  else
    if char_length(trim(p_note))<5 then raise exception 'Add a clear rejection reason'; end if;
    update public.salary_reports set approved=false,publication_status='suppressed',publication_review_note=trim(p_note) where id=report.id;
    update public.contribution_claims set status='rejected',publication_status='suppressed',review_note=trim(p_note),reviewed_by=auth.uid(),reviewed_at=now() where id=claim.id;
    update public.contribution_campaigns set committed_kobo=greatest(0,committed_kobo-claim.reward_kobo) where id=claim.campaign_id;
  end if;
end; $$;

create or replace function public.admin_release_salary_report(
  p_report_id uuid,p_decision text,p_note text,p_anomaly_checked boolean,p_independence_checked boolean
)
returns void language plpgsql security definer set search_path=public as $$
declare report public.salary_reports; claim public.contribution_claims;
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  if p_decision not in ('published','suppressed') then raise exception 'Invalid publication decision'; end if;
  if char_length(trim(p_note))<5 then raise exception 'Record a publication-review note'; end if;
  select * into report from public.salary_reports where id=p_report_id for update;
  if report.id is null or report.publication_status<>'quarantined' then raise exception 'Quarantined salary report not found'; end if;
  select * into claim from public.contribution_claims where contribution_type='salary_report' and source_record_id=report.id and status='approved' for update;
  if claim.id is null then raise exception 'The reward claim is not approved'; end if;
  if p_decision='published' and not (p_anomaly_checked and p_independence_checked) then raise exception 'Complete both publication checks'; end if;
  update public.salary_reports set approved=(p_decision='published'),publication_status=p_decision,published_at=case when p_decision='published' then now() else null end,
    publication_reviewed_by=auth.uid(),publication_review_note=trim(p_note) where id=report.id;
  update public.contribution_claims set publication_status=p_decision where id=claim.id;
end; $$;

create or replace function public.admin_set_contributor_account_status(p_contributor_id uuid,p_status text,p_note text)
returns void language plpgsql security definer set search_path=public as $$
declare profile public.contributor_profiles;
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('active','paused','banned') then raise exception 'Invalid contributor status'; end if;
  if char_length(trim(p_note))<5 then raise exception 'Record a clear account-review reason'; end if;
  select * into profile from public.contributor_profiles where user_id=p_contributor_id for update;
  if profile.user_id is null then raise exception 'Contributor profile not found'; end if;
  update public.contributor_profiles set status=p_status,
    risk_status=case when p_status='banned' then 'blocked' when p_status='active' and risk_status='blocked' then 'review' else risk_status end,
    updated_at=now(),last_reviewed_at=now() where user_id=p_contributor_id;
  insert into public.contributor_admin_audit_log(actor_id,action,subject_type,subject_id,reason,metadata)
  values(auth.uid(),'contributor.'||p_status,'contributor_profiles',p_contributor_id::text,trim(p_note),jsonb_build_object('from',profile.status,'to',p_status));
end; $$;

create or replace function public.public_salary_benchmarks()
returns table(role text,industry text,location text,experience_band text,sample_size bigint,median_monthly_gross numeric,low_monthly_gross numeric,high_monthly_gross numeric)
language sql stable security definer set search_path=public as $$
  select role,industry,location,experience_band,count(*) sample_size,
    percentile_cont(.5) within group(order by monthly_gross)::numeric,
    percentile_cont(.25) within group(order by monthly_gross)::numeric,
    percentile_cont(.75) within group(order by monthly_gross)::numeric
  from public.salary_reports where approved and publication_status='published'
  group by role,industry,location,experience_band having count(*)>=5 order by count(*) desc,role limit 100;
$$;

create or replace function public.contributor_wallet()
returns jsonb language sql stable security definer set search_path=public as $$
  with totals as (
    select
      coalesce((select sum(amount_kobo) from public.contributor_ledger where contributor_id=auth.uid()),0)::bigint balance_kobo,
      coalesce((select sum(amount_kobo) from public.contributor_ledger where contributor_id=auth.uid() and available_at<=now()),0)::bigint released_kobo,
      coalesce((select sum(amount_kobo) from public.contributor_ledger where contributor_id=auth.uid() and amount_kobo>0 and available_at>now()),0)::bigint cooling_kobo,
      coalesce((select sum(reward_kobo) from public.contribution_claims where contributor_id=auth.uid() and status='pending'),0)::bigint pending_kobo,
      coalesce((select sum(amount_kobo) from public.contributor_payout_requests where contributor_id=auth.uid() and status in ('pending','processing')),0)::bigint pending_payout_kobo
  ), profile as (select coalesce(level,'new') level from public.contributor_profiles where user_id=auth.uid())
  select jsonb_build_object(
    'balance_kobo',balance_kobo,'available_to_request_kobo',case when pending_payout_kobo>0 then 0 else greatest(released_kobo,0) end,
    'cooling_kobo',cooling_kobo,'next_available_at',(select min(available_at) from public.contributor_ledger where contributor_id=auth.uid() and amount_kobo>0 and available_at>now()),
    'pending_kobo',pending_kobo,'pending_payout_kobo',pending_payout_kobo,
    'approved_claims',(select count(*) from public.contribution_claims where contributor_id=auth.uid() and status='approved'),
    'pending_claims',(select count(*) from public.contribution_claims where contributor_id=auth.uid() and status='pending'),
    'minimum_payout_kobo',50000,'contributor_level',coalesce((select level from profile),'new'),
    'allowed_payout_methods',case when coalesce((select level from profile),'new')='new' then jsonb_build_array('airtime') else jsonb_build_array('airtime','bank_transfer') end
  ) from totals;
$$;

create or replace function public.request_contributor_payout(p_amount_kobo bigint,p_payout_method text,p_payout_destination text)
returns uuid language plpgsql security definer set search_path=public as $$
declare available_balance bigint; request_id uuid; normalized_destination text; bank_name text; account_number text; destination_fingerprint text; profile public.contributor_profiles;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_amount_kobo<50000 then raise exception 'Minimum payout is NGN 500'; end if;
  if p_payout_method not in ('airtime','bank_transfer') then raise exception 'Choose airtime or bank transfer'; end if;
  perform public.ensure_contributor_profile();
  select * into profile from public.contributor_profiles where user_id=auth.uid() for update;
  if profile.status<>'active' or profile.risk_status='blocked' then raise exception 'Payouts are paused for this account'; end if;
  if profile.level='new' and p_payout_method='bank_transfer' then raise exception 'Your first payout is available as airtime while your contributor account is being verified'; end if;
  if p_payout_method='airtime' then
    normalized_destination:=regexp_replace(p_payout_destination,'\D','','g');
    if char_length(normalized_destination) not between 10 and 15 then raise exception 'Enter a valid mobile number'; end if;
  else
    bank_name:=lower(trim(split_part(p_payout_destination,'|',1))); account_number:=regexp_replace(split_part(p_payout_destination,'|',2),'\D','','g');
    if bank_name='' or char_length(account_number)<>10 or trim(split_part(p_payout_destination,'|',3))='' then raise exception 'Enter bank name, 10-digit account number and account name'; end if;
    normalized_destination:=bank_name||':'||account_number;
  end if;
  destination_fingerprint:=encode(extensions.digest(p_payout_method||':'||normalized_destination,'sha256'),'hex');
  perform pg_advisory_xact_lock(hashtextextended(destination_fingerprint,0));
  if exists(select 1 from public.contributor_payout_requests where payout_destination_fingerprint=destination_fingerprint and contributor_id<>auth.uid() and status in ('pending','processing','paid')) then raise exception 'This payout destination is already linked to another contributor. Contact support if this is a mistake.'; end if;
  if exists(select 1 from public.contributor_payout_requests where contributor_id=auth.uid() and status in ('pending','processing')) then raise exception 'A payout request is already being processed'; end if;
  select coalesce(sum(amount_kobo),0) into available_balance from public.contributor_ledger where contributor_id=auth.uid() and available_at<=now();
  if p_amount_kobo>available_balance then raise exception 'Payout exceeds available balance'; end if;
  insert into public.contributor_payout_requests(contributor_id,amount_kobo,payout_method,payout_destination,payout_destination_fingerprint)
  values(auth.uid(),p_amount_kobo,p_payout_method,trim(p_payout_destination),destination_fingerprint) returning id into request_id;
  return request_id;
end; $$;

create or replace function public.record_contributor_admin_audit()
returns trigger language plpgsql security definer set search_path=public as $$
declare subject text; action_name text; reason_text text; meta jsonb;
begin
  subject:=coalesce(new.id::text,old.id::text);
  if tg_table_name='contribution_claims' then
    if tg_op<>'UPDATE' or old.status is not distinct from new.status then return new; end if;
    action_name:='claim.'||new.status; reason_text:=new.review_note; meta:=jsonb_build_object('from',old.status,'to',new.status,'risk_status',new.risk_status);
  elsif tg_table_name='contributor_payout_requests' then
    if tg_op<>'UPDATE' or old.status is not distinct from new.status then return new; end if;
    action_name:='payout.'||new.status; meta:=jsonb_build_object('from',old.status,'to',new.status,'amount_kobo',new.amount_kobo);
  elsif tg_table_name='contribution_campaigns' then
    if tg_op<>'UPDATE' or old.status is not distinct from new.status then return new; end if;
    action_name:='campaign.'||new.status; meta:=jsonb_build_object('from',old.status,'to',new.status);
  elsif tg_table_name='salary_reports' then
    if tg_op<>'UPDATE' or old.publication_status is not distinct from new.publication_status then return new; end if;
    action_name:='salary_report.'||new.publication_status; reason_text:=new.publication_review_note; meta:=jsonb_build_object('from',old.publication_status,'to',new.publication_status);
  else return new;
  end if;
  insert into public.contributor_admin_audit_log(actor_id,action,subject_type,subject_id,reason,metadata)
  values(auth.uid(),action_name,tg_table_name,subject,reason_text,meta);
  return new;
end; $$;

drop trigger if exists contribution_claim_audit on public.contribution_claims;
create trigger contribution_claim_audit after update of status on public.contribution_claims for each row execute function public.record_contributor_admin_audit();
drop trigger if exists contributor_payout_audit on public.contributor_payout_requests;
create trigger contributor_payout_audit after update of status on public.contributor_payout_requests for each row execute function public.record_contributor_admin_audit();
drop trigger if exists contribution_campaign_audit on public.contribution_campaigns;
create trigger contribution_campaign_audit after update of status on public.contribution_campaigns for each row execute function public.record_contributor_admin_audit();
drop trigger if exists salary_publication_audit on public.salary_reports;
create trigger salary_publication_audit after update of publication_status on public.salary_reports for each row execute function public.record_contributor_admin_audit();

create or replace function public.purge_expired_contribution_risk_data()
returns void language plpgsql security definer set search_path=public as $$
begin
  delete from public.contribution_rate_limits where updated_at<now()-interval '7 days';
  delete from public.contributor_risk_events where expires_at is not null and expires_at<now();
  update public.contribution_claims set network_fingerprint=null,device_fingerprint=null
    where created_at<now()-interval '90 days' and (network_fingerprint is not null or device_fingerprint is not null);
  update public.contribution_evidence_snapshots set salary_excerpt=null
    where fetched_at<now()-interval '180 days' and salary_excerpt is not null;
end; $$;

do $$ begin
  if exists(select 1 from pg_extension where extname='pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname='salarysabi-contributor-risk-retention';
    perform cron.schedule('salarysabi-contributor-risk-retention','25 4 * * *',$cron$select public.purge_expired_contribution_risk_data();$cron$);
  end if;
end $$;

revoke all on function public.service_consume_contribution_rate_limit(text,text) from public,anon,authenticated;
revoke all on function public.reserve_contribution_claim_for(uuid,uuid,text,uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.service_submit_rewarded_salary_report(uuid,uuid,text,text,text,text,text,numeric,text,text,text,text) from public,anon,authenticated;
revoke all on function public.service_submit_rewarded_job_source(uuid,uuid,text,text,text,text,text,text,text,text,text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.submit_rewarded_salary_report(uuid,text,text,text,text,text,numeric,text) from public,anon,authenticated;
revoke all on function public.submit_rewarded_job_source(uuid,text,text,text,text) from public,anon,authenticated;
revoke all on function public.admin_review_job_source_claim(uuid,text,text,boolean,boolean,boolean,boolean,boolean) from public,anon,authenticated;
revoke all on function public.admin_review_salary_report_claim(uuid,text,text,boolean,boolean,boolean) from public,anon,authenticated;
revoke all on function public.admin_release_salary_report(uuid,text,text,boolean,boolean) from public,anon,authenticated;
revoke all on function public.admin_set_contributor_account_status(uuid,text,text) from public,anon,authenticated;
revoke all on function public.recalculate_contributor_trust() from public,anon,authenticated;
revoke all on function public.reward_release_time(uuid) from public,anon,authenticated;
revoke all on function public.record_contributor_admin_audit() from public,anon,authenticated;
revoke all on function public.purge_expired_contribution_risk_data() from public,anon,authenticated;
grant execute on function public.service_consume_contribution_rate_limit(text,text) to service_role;
grant execute on function public.service_submit_rewarded_salary_report(uuid,uuid,text,text,text,text,text,numeric,text,text,text,text) to service_role;
grant execute on function public.service_submit_rewarded_job_source(uuid,uuid,text,text,text,text,text,text,text,text,text,text,text,text,text) to service_role;
grant execute on function public.admin_review_job_source_claim(uuid,text,text,boolean,boolean,boolean,boolean,boolean) to authenticated;
grant execute on function public.admin_review_salary_report_claim(uuid,text,text,boolean,boolean,boolean) to authenticated;
grant execute on function public.admin_release_salary_report(uuid,text,text,boolean,boolean) to authenticated;
grant execute on function public.admin_set_contributor_account_status(uuid,text,text) to authenticated;
grant execute on function public.contributor_wallet(),public.request_contributor_payout(bigint,text,text) to authenticated;
grant execute on function public.public_salary_benchmarks() to anon,authenticated;

notify pgrst, 'reload schema';
