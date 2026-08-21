-- Avoid PL/pgSQL variable/column ambiguity in lifecycle analytics triggers.
create or replace function public.record_reward_claim_lifecycle()
returns trigger language plpgsql security definer set search_path = public as $$
declare lifecycle_event_name text;
begin
  if tg_op = 'INSERT' then lifecycle_event_name := 'reward_submission_succeeded';
  elsif old.status is distinct from new.status and new.status = 'approved' then lifecycle_event_name := 'reward_claim_approved';
  elsif old.status is distinct from new.status and new.status = 'rejected' then lifecycle_event_name := 'reward_claim_rejected';
  else return new;
  end if;
  insert into public.analytics_daily(event_date,event_name,page_path,referrer_host,event_count)
  values(current_date,lifecycle_event_name,'/contributors/' || new.contribution_type,'internal',1)
  on conflict(event_date,event_name,page_path,referrer_host) do update set event_count=analytics_daily.event_count+1;
  return new;
end; $$;

create or replace function public.record_reward_payout_lifecycle()
returns trigger language plpgsql security definer set search_path = public as $$
declare lifecycle_event_name text;
begin
  if tg_op = 'INSERT' then lifecycle_event_name := 'reward_payout_requested';
  elsif old.status is distinct from new.status and new.status = 'paid' then lifecycle_event_name := 'reward_payout_completed';
  else return new;
  end if;
  insert into public.analytics_daily(event_date,event_name,page_path,referrer_host,event_count)
  values(current_date,lifecycle_event_name,'/contributions','internal',1)
  on conflict(event_date,event_name,page_path,referrer_host) do update set event_count=analytics_daily.event_count+1;
  return new;
end; $$;
