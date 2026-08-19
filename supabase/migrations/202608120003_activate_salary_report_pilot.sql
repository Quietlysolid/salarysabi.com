-- Fund a bounded first batch: 20 approved reports at NGN 500 each.
update public.contribution_campaigns set
  target_approved=20, reward_kobo=50000, budget_kobo=1000000,
  max_rewards_per_contributor=1, starts_at=now(), ends_at=now()+interval '90 days',
  status='active', title='Founding salary-report pilot',
  description='Earn NGN 500 after an anonymous salary report is approved.',
  eligibility_note='First 20 approved reports. One paid report per person.'
where slug='salary-pilot-2026';

update public.contribution_campaigns set status='draft' where slug='transparent-jobs-pilot-2026';

alter table public.contributor_payout_requests drop constraint if exists contributor_payout_requests_amount_kobo_check;
alter table public.contributor_payout_requests add constraint contributor_payout_requests_amount_kobo_check check (amount_kobo >= 50000);

create or replace function public.request_contributor_payout(p_amount_kobo bigint,p_payout_method text,p_payout_destination text)
returns uuid language plpgsql security definer set search_path=public as $$
declare available_balance bigint; request_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_amount_kobo < 50000 then raise exception 'Minimum payout is NGN 500'; end if;
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
revoke all on function public.request_contributor_payout(bigint,text,text) from public,anon,authenticated;
grant execute on function public.request_contributor_payout(bigint,text,text) to authenticated;
