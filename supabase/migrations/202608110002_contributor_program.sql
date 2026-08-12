-- Controlled contributor rewards: campaigns are draft until an administrator activates them.
create table if not exists public.contributor_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  level text not null default 'new' check (level in ('new','verified','trusted')),
  status text not null default 'active' check (status in ('active','paused','banned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contribution_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  contribution_type text not null check (contribution_type in ('salary_report','job_source')),
  title text not null check (char_length(title) between 4 and 120),
  description text not null check (char_length(description) between 10 and 500),
  eligibility_note text not null default '',
  target_approved integer not null check (target_approved > 0),
  reward_kobo bigint not null check (reward_kobo >= 0),
  budget_kobo bigint not null check (budget_kobo >= 0),
  committed_kobo bigint not null default 0 check (committed_kobo >= 0),
  paid_kobo bigint not null default 0 check (paid_kobo >= 0),
  max_rewards_per_contributor integer not null default 1 check (max_rewards_per_contributor between 1 and 100),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft','active','paused','closed')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (committed_kobo <= budget_kobo),
  check (paid_kobo <= committed_kobo)
);

create table if not exists public.contribution_claims (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.contribution_campaigns(id),
  contributor_id uuid not null references auth.users(id) on delete cascade,
  contribution_type text not null check (contribution_type in ('salary_report','job_source')),
  source_record_id uuid not null,
  reward_kobo bigint not null check (reward_kobo >= 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected','reversed')),
  review_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, contribution_type, source_record_id)
);

create table if not exists public.contributor_ledger (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references auth.users(id) on delete cascade,
  claim_id uuid references public.contribution_claims(id),
  entry_type text not null check (entry_type in ('reward','reversal','payout')),
  amount_kobo bigint not null check (amount_kobo <> 0),
  note text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists contributor_ledger_one_reward_per_claim on public.contributor_ledger(claim_id) where entry_type = 'reward';

create table if not exists public.contributor_payout_requests (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references auth.users(id) on delete cascade,
  amount_kobo bigint not null check (amount_kobo >= 250000),
  payout_method text not null check (payout_method in ('airtime','bank_transfer')),
  payout_destination text not null check (char_length(payout_destination) between 5 and 200),
  payout_reference text,
  status text not null default 'pending' check (status in ('pending','processing','paid','rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.contributor_profiles enable row level security;
alter table public.contribution_campaigns enable row level security;
alter table public.contribution_claims enable row level security;
alter table public.contributor_ledger enable row level security;
alter table public.contributor_payout_requests enable row level security;

create policy "contributors read own profile" on public.contributor_profiles for select to authenticated using (user_id = auth.uid() or public.is_current_user_admin());
create policy "contributors read own claims" on public.contribution_claims for select to authenticated using (contributor_id = auth.uid() or public.is_current_user_admin());
create policy "contributors read own ledger" on public.contributor_ledger for select to authenticated using (contributor_id = auth.uid() or public.is_current_user_admin());
create policy "contributors read own payouts" on public.contributor_payout_requests for select to authenticated using (contributor_id = auth.uid() or public.is_current_user_admin());
create policy "admins manage campaigns" on public.contribution_campaigns for all to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());
create policy "admins manage claims" on public.contribution_claims for all to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());
create policy "admins manage payouts" on public.contributor_payout_requests for all to authenticated using (public.is_current_user_admin()) with check (public.is_current_user_admin());

create or replace function public.ensure_contributor_profile()
returns public.contributor_profiles language plpgsql security definer set search_path = public as $$
declare result public.contributor_profiles;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  insert into public.contributor_profiles(user_id) values(auth.uid()) on conflict (user_id) do nothing;
  select * into result from public.contributor_profiles where user_id = auth.uid();
  return result;
end; $$;

create or replace function public.public_active_contribution_campaigns()
returns table(id uuid, slug text, contribution_type text, title text, description text, eligibility_note text, target_approved integer, approved_count bigint, reward_kobo bigint, budget_remaining_kobo bigint, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.id,c.slug,c.contribution_type,c.title,c.description,c.eligibility_note,c.target_approved,
    count(cl.id) filter(where cl.status='approved') approved_count,c.reward_kobo,(c.budget_kobo-c.committed_kobo) budget_remaining_kobo,c.ends_at
  from public.contribution_campaigns c left join public.contribution_claims cl on cl.campaign_id=c.id
  where c.status='active' and now() between c.starts_at and c.ends_at and c.committed_kobo+c.reward_kobo<=c.budget_kobo
  group by c.id order by c.ends_at;
$$;

create or replace function public.reserve_contribution_claim(p_campaign_id uuid, p_type text, p_source_record_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare c public.contribution_campaigns; claim_id uuid; existing_count integer;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  perform public.ensure_contributor_profile();
  select * into c from public.contribution_campaigns where id=p_campaign_id for update;
  if c.id is null or c.status<>'active' or now() not between c.starts_at and c.ends_at then raise exception 'Campaign is not active'; end if;
  if c.contribution_type<>p_type then raise exception 'Wrong campaign type'; end if;
  if c.committed_kobo+c.reward_kobo>c.budget_kobo then raise exception 'Campaign budget exhausted'; end if;
  select count(*) into existing_count from public.contribution_claims where campaign_id=c.id and contributor_id=auth.uid() and status in ('pending','approved');
  if existing_count>=c.max_rewards_per_contributor then raise exception 'Contributor campaign limit reached'; end if;
  insert into public.contribution_claims(campaign_id,contributor_id,contribution_type,source_record_id,reward_kobo)
  values(c.id,auth.uid(),p_type,p_source_record_id,c.reward_kobo) returning id into claim_id;
  update public.contribution_campaigns set committed_kobo=committed_kobo+c.reward_kobo where id=c.id;
  return claim_id;
end; $$;

create or replace function public.submit_rewarded_salary_report(p_campaign_id uuid,p_role text,p_industry text,p_location text,p_experience_band text,p_company_size text,p_monthly_gross numeric,p_pay_reliability text)
returns uuid language plpgsql security definer set search_path = public as $$
declare report_id uuid;
begin
  insert into public.salary_reports(role,industry,location,experience_band,company_size,monthly_gross,pay_reliability)
  values(trim(p_role),trim(p_industry),trim(p_location),p_experience_band,p_company_size,p_monthly_gross,p_pay_reliability) returning id into report_id;
  perform public.reserve_contribution_claim(p_campaign_id,'salary_report',report_id);
  return report_id;
end; $$;

create or replace function public.submit_rewarded_job_source(p_campaign_id uuid,p_official_url text,p_company_name text,p_advertised_salary text,p_notes text)
returns uuid language plpgsql security definer set search_path = public as $$
declare suggestion_id uuid; v_email text;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select lower(email) into v_email from auth.users where id=auth.uid();
  insert into public.job_suggestions(official_url,company_name,advertised_salary,notes,submitter_email)
  values(trim(p_official_url),trim(p_company_name),trim(p_advertised_salary),trim(p_notes),v_email) returning id into suggestion_id;
  perform public.reserve_contribution_claim(p_campaign_id,'job_source',suggestion_id);
  return suggestion_id;
end; $$;

create or replace function public.contributor_wallet()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'balance_kobo',coalesce((select sum(amount_kobo) from public.contributor_ledger where contributor_id=auth.uid()),0),
    'pending_kobo',coalesce((select sum(reward_kobo) from public.contribution_claims where contributor_id=auth.uid() and status='pending'),0),
    'approved_claims',(select count(*) from public.contribution_claims where contributor_id=auth.uid() and status='approved'),
    'pending_claims',(select count(*) from public.contribution_claims where contributor_id=auth.uid() and status='pending')
  );
$$;

create or replace function public.request_contributor_payout(p_amount_kobo bigint,p_payout_method text,p_payout_destination text)
returns uuid language plpgsql security definer set search_path = public as $$
declare available_balance bigint; request_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_amount_kobo < 250000 then raise exception 'Minimum payout is NGN 2,500'; end if;
  if p_payout_method not in ('airtime','bank_transfer') then raise exception 'Invalid payout method'; end if;
  if char_length(trim(p_payout_destination)) not between 5 and 200 then raise exception 'Payout destination is required'; end if;
  perform public.ensure_contributor_profile();
  perform 1 from public.contributor_profiles where user_id=auth.uid() for update;
  if exists(select 1 from public.contributor_payout_requests where contributor_id=auth.uid() and status in ('pending','processing')) then raise exception 'A payout request is already being processed'; end if;
  select coalesce(sum(amount_kobo),0) into available_balance from public.contributor_ledger where contributor_id=auth.uid();
  if p_amount_kobo > available_balance then raise exception 'Payout exceeds available balance'; end if;
  insert into public.contributor_payout_requests(contributor_id,amount_kobo,payout_method,payout_destination)
  values(auth.uid(),p_amount_kobo,p_payout_method,trim(p_payout_destination)) returning id into request_id;
  return request_id;
end; $$;

create or replace function public.admin_complete_contributor_payout(p_request_id uuid,p_decision text,p_reference text default '')
returns void language plpgsql security definer set search_path = public as $$
declare request public.contributor_payout_requests; available_balance bigint;
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  if p_decision not in ('processing','paid','rejected') then raise exception 'Invalid payout decision'; end if;
  select * into request from public.contributor_payout_requests where id=p_request_id for update;
  if request.id is null or request.status not in ('pending','processing') then raise exception 'Payout request is not actionable'; end if;
  if p_decision='paid' then
    select coalesce(sum(amount_kobo),0) into available_balance from public.contributor_ledger where contributor_id=request.contributor_id;
    if request.amount_kobo > available_balance then raise exception 'Contributor balance is insufficient'; end if;
    insert into public.contributor_ledger(contributor_id,entry_type,amount_kobo,note) values(request.contributor_id,'payout',-request.amount_kobo,'Contributor payout '||coalesce(nullif(trim(p_reference),''),request.id::text));
  end if;
  update public.contributor_payout_requests set status=p_decision,payout_reference=nullif(trim(p_reference),''),reviewed_by=auth.uid(),reviewed_at=now() where id=request.id;
end; $$;

create or replace function public.admin_review_contribution_claim(p_claim_id uuid,p_decision text,p_note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare cl public.contribution_claims;
begin
  if not public.is_current_user_admin() then raise exception 'Administrator access required'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  select * into cl from public.contribution_claims where id=p_claim_id for update;
  if cl.id is null or cl.status<>'pending' then raise exception 'Claim is not pending'; end if;
  update public.contribution_claims set status=p_decision,review_note=nullif(trim(p_note),''),reviewed_by=auth.uid(),reviewed_at=now() where id=cl.id;
  if p_decision='approved' then
    insert into public.contributor_ledger(contributor_id,claim_id,entry_type,amount_kobo,note) values(cl.contributor_id,cl.id,'reward',cl.reward_kobo,'Approved contributor reward');
  else
    update public.contribution_campaigns set committed_kobo=greatest(0,committed_kobo-cl.reward_kobo) where id=cl.campaign_id;
  end if;
end; $$;

revoke all on function public.ensure_contributor_profile() from public,anon,authenticated;
revoke all on function public.public_active_contribution_campaigns() from public,anon,authenticated;
revoke all on function public.reserve_contribution_claim(uuid,text,uuid) from public,anon,authenticated;
revoke all on function public.submit_rewarded_salary_report(uuid,text,text,text,text,text,numeric,text) from public,anon,authenticated;
revoke all on function public.submit_rewarded_job_source(uuid,text,text,text,text) from public,anon,authenticated;
revoke all on function public.contributor_wallet() from public,anon,authenticated;
revoke all on function public.request_contributor_payout(bigint,text,text) from public,anon,authenticated;
revoke all on function public.admin_complete_contributor_payout(uuid,text,text) from public,anon,authenticated;
revoke all on function public.admin_review_contribution_claim(uuid,text,text) from public,anon,authenticated;
grant execute on function public.public_active_contribution_campaigns() to anon,authenticated;
grant execute on function public.ensure_contributor_profile(),public.contributor_wallet() to authenticated;
grant execute on function public.request_contributor_payout(bigint,text,text),public.admin_complete_contributor_payout(uuid,text,text) to authenticated;
grant execute on function public.submit_rewarded_salary_report(uuid,text,text,text,text,text,numeric,text),public.submit_rewarded_job_source(uuid,text,text,text,text) to authenticated;
grant execute on function public.admin_review_contribution_claim(uuid,text,text) to authenticated;

insert into public.contribution_campaigns(slug,contribution_type,title,description,eligibility_note,target_approved,reward_kobo,budget_kobo,max_rewards_per_contributor,starts_at,ends_at,status)
values
('salary-pilot-2026','salary_report','Founding salary-report pilot','Help unlock the first trustworthy Nigerian salary benchmark groups.','One approved reward per contributor during the pilot.',100,50000,6000000,1,now(),now()+interval '90 days','draft'),
('transparent-jobs-pilot-2026','job_source','Transparent jobs scout pilot','Find current vacancies on official employer pages where salary is already visible.','The job must be open, non-duplicated and verifiable on the employer website.',40,100000,6000000,5,now(),now()+interval '90 days','draft')
on conflict (slug) do nothing;
