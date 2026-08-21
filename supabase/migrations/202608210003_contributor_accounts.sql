-- Complete the contributor loop: transparent status, safer payouts and lifecycle metrics.
create extension if not exists pgcrypto with schema extensions;

alter table public.contributor_payout_requests
add column if not exists payout_destination text
  check (payout_destination is null or char_length(payout_destination) between 5 and 200),
add column if not exists payout_destination_fingerprint text;

-- Some early production databases were created without the raw destination
-- column even though the payout RPC already referenced it. Keep the repair
-- nullable so historic requests remain valid; every new request supplies it.
update public.contributor_payout_requests
set payout_destination_fingerprint = encode(
  extensions.digest(payout_method || ':' || lower(regexp_replace(trim(payout_destination), '\s+', '', 'g')), 'sha256'),
  'hex'
)
where payout_destination_fingerprint is null
  and payout_destination is not null;

create index if not exists contributor_payout_destination_fingerprint_idx
on public.contributor_payout_requests(payout_destination_fingerprint)
where status in ('pending', 'processing', 'paid');

create or replace function public.contributor_claim_history()
returns table(
  claim_id uuid,
  campaign_title text,
  contribution_type text,
  reward_kobo bigint,
  status text,
  review_note text,
  reviewed_at timestamptz,
  submitted_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select cl.id, c.title, cl.contribution_type, cl.reward_kobo, cl.status,
    cl.review_note, cl.reviewed_at, cl.created_at
  from public.contribution_claims cl
  join public.contribution_campaigns c on c.id = cl.campaign_id
  where cl.contributor_id = auth.uid()
  order by cl.created_at desc;
$$;

create or replace function public.contributor_wallet()
returns jsonb language sql stable security definer set search_path = public as $$
  with totals as (
    select
      coalesce((select sum(amount_kobo) from public.contributor_ledger where contributor_id = auth.uid()), 0)::bigint as balance_kobo,
      coalesce((select sum(reward_kobo) from public.contribution_claims where contributor_id = auth.uid() and status = 'pending'), 0)::bigint as pending_kobo,
      coalesce((select sum(amount_kobo) from public.contributor_payout_requests where contributor_id = auth.uid() and status in ('pending','processing')), 0)::bigint as pending_payout_kobo
  )
  select jsonb_build_object(
    'balance_kobo', balance_kobo,
    'available_to_request_kobo', case when pending_payout_kobo > 0 then 0 else balance_kobo end,
    'pending_kobo', pending_kobo,
    'pending_payout_kobo', pending_payout_kobo,
    'approved_claims', (select count(*) from public.contribution_claims where contributor_id = auth.uid() and status = 'approved'),
    'pending_claims', (select count(*) from public.contribution_claims where contributor_id = auth.uid() and status = 'pending'),
    'minimum_payout_kobo', 50000
  ) from totals;
$$;

create or replace function public.request_contributor_payout(p_amount_kobo bigint,p_payout_method text,p_payout_destination text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  available_balance bigint;
  request_id uuid;
  normalized_destination text;
  bank_name text;
  account_number text;
  destination_fingerprint text;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_amount_kobo < 50000 then raise exception 'Minimum payout is NGN 500'; end if;
  if p_payout_method not in ('airtime','bank_transfer') then raise exception 'Choose airtime or bank transfer'; end if;
  if char_length(trim(p_payout_destination)) not between 5 and 200 then raise exception 'Payout destination is required'; end if;

  if p_payout_method = 'airtime' then
    normalized_destination := regexp_replace(p_payout_destination, '\D', '', 'g');
    if char_length(normalized_destination) not between 10 and 15 then raise exception 'Enter a valid mobile number'; end if;
  else
    bank_name := lower(trim(split_part(p_payout_destination, '|', 1)));
    account_number := regexp_replace(split_part(p_payout_destination, '|', 2), '\D', '', 'g');
    if bank_name = '' or char_length(account_number) <> 10 or trim(split_part(p_payout_destination, '|', 3)) = '' then
      raise exception 'Enter bank name, 10-digit account number and account name';
    end if;
    normalized_destination := bank_name || ':' || account_number;
  end if;
  destination_fingerprint := encode(extensions.digest(p_payout_method || ':' || normalized_destination, 'sha256'), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(destination_fingerprint, 0));

  if exists(
    select 1 from public.contributor_payout_requests
    where payout_destination_fingerprint = destination_fingerprint
      and contributor_id <> auth.uid()
      and status in ('pending','processing','paid')
  ) then
    raise exception 'This payout destination is already linked to another contributor. Contact support if this is a mistake.';
  end if;

  perform public.ensure_contributor_profile();
  perform 1 from public.contributor_profiles where user_id = auth.uid() for update;
  if exists(select 1 from public.contributor_payout_requests where contributor_id = auth.uid() and status in ('pending','processing')) then
    raise exception 'A payout request is already being processed';
  end if;
  select coalesce(sum(amount_kobo),0) into available_balance from public.contributor_ledger where contributor_id = auth.uid();
  if p_amount_kobo > available_balance then raise exception 'Payout exceeds available balance'; end if;

  insert into public.contributor_payout_requests(
    contributor_id, amount_kobo, payout_method, payout_destination, payout_destination_fingerprint
  ) values (
    auth.uid(), p_amount_kobo, p_payout_method, trim(p_payout_destination), destination_fingerprint
  ) returning id into request_id;
  return request_id;
end; $$;

alter table public.analytics_daily drop constraint if exists analytics_daily_event_name_check;
alter table public.analytics_daily add constraint analytics_daily_event_name_check check (event_name in (
  'page_view','paye_calculated','payslip_checked','pdf_exported','excel_exported','print_opened','verify_interest','payroll_interest',
  'payslip_signup_viewed','payslip_signup_submitted','payslip_signup_succeeded','payroll_signup_viewed','payroll_signup_submitted','payroll_signup_succeeded',
  'job_apply_clicked','job_submission_started','job_submission_succeeded','job_alert_created','account_signup_started','account_signup_succeeded','account_signin_succeeded',
  'contributor_interest_viewed','contributor_interest_submitted','contributor_interest_succeeded',
  'tax_update_signup_viewed','tax_update_signup_submitted','tax_update_signup_succeeded','paye_result_shared',
  'reward_offer_viewed','reward_offer_clicked','reward_offer_shared','reward_submission_started','reward_submission_succeeded',
  'reward_claim_approved','reward_claim_rejected','reward_payout_requested','reward_payout_completed'
));

create or replace function public.record_analytics_event(p_event_name text,p_page_path text,p_referrer_host text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_event_name not in (
    'page_view','paye_calculated','payslip_checked','pdf_exported','excel_exported','print_opened','verify_interest','payroll_interest',
    'payslip_signup_viewed','payslip_signup_submitted','payslip_signup_succeeded','payroll_signup_viewed','payroll_signup_submitted','payroll_signup_succeeded',
    'job_apply_clicked','job_submission_started','job_submission_succeeded','job_alert_created','account_signup_started','account_signup_succeeded','account_signin_succeeded',
    'contributor_interest_viewed','contributor_interest_submitted','contributor_interest_succeeded',
    'tax_update_signup_viewed','tax_update_signup_submitted','tax_update_signup_succeeded','paye_result_shared',
    'reward_offer_viewed','reward_offer_clicked','reward_offer_shared','reward_submission_started','reward_submission_succeeded',
    'reward_claim_approved','reward_claim_rejected','reward_payout_requested','reward_payout_completed'
  ) then return; end if;
  insert into public.analytics_daily(event_date,event_name,page_path,referrer_host,event_count)
  values(current_date,p_event_name,left(p_page_path,160),left(p_referrer_host,120),1)
  on conflict(event_date,event_name,page_path,referrer_host) do update set event_count=analytics_daily.event_count+1;
end; $$;

create or replace function public.record_reward_claim_lifecycle()
returns trigger language plpgsql security definer set search_path = public as $$
declare event_name text;
begin
  if tg_op = 'INSERT' then event_name := 'reward_submission_succeeded';
  elsif old.status is distinct from new.status and new.status = 'approved' then event_name := 'reward_claim_approved';
  elsif old.status is distinct from new.status and new.status = 'rejected' then event_name := 'reward_claim_rejected';
  else return new;
  end if;
  insert into public.analytics_daily(event_date,event_name,page_path,referrer_host,event_count)
  values(current_date,event_name,'/contributors/' || new.contribution_type,'internal',1)
  on conflict(event_date,event_name,page_path,referrer_host) do update set event_count=analytics_daily.event_count+1;
  return new;
end; $$;

create or replace function public.record_reward_payout_lifecycle()
returns trigger language plpgsql security definer set search_path = public as $$
declare event_name text;
begin
  if tg_op = 'INSERT' then event_name := 'reward_payout_requested';
  elsif old.status is distinct from new.status and new.status = 'paid' then event_name := 'reward_payout_completed';
  else return new;
  end if;
  insert into public.analytics_daily(event_date,event_name,page_path,referrer_host,event_count)
  values(current_date,event_name,'/contributions','internal',1)
  on conflict(event_date,event_name,page_path,referrer_host) do update set event_count=analytics_daily.event_count+1;
  return new;
end; $$;

drop trigger if exists contribution_claim_lifecycle_analytics on public.contribution_claims;
create trigger contribution_claim_lifecycle_analytics
after insert or update of status on public.contribution_claims
for each row execute function public.record_reward_claim_lifecycle();

drop trigger if exists contributor_payout_lifecycle_analytics on public.contributor_payout_requests;
create trigger contributor_payout_lifecycle_analytics
after insert or update of status on public.contributor_payout_requests
for each row execute function public.record_reward_payout_lifecycle();

revoke all on function public.contributor_claim_history() from public,anon,authenticated;
revoke all on function public.request_contributor_payout(bigint,text,text) from public,anon,authenticated;
revoke all on function public.record_reward_claim_lifecycle() from public,anon,authenticated;
revoke all on function public.record_reward_payout_lifecycle() from public,anon,authenticated;
grant execute on function public.contributor_claim_history(), public.contributor_wallet(), public.request_contributor_payout(bigint,text,text) to authenticated;
