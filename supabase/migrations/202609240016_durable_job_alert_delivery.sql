-- Only service_role can claim/send/complete deliveries. Public alert ownership is unchanged.
alter table public.job_alerts add column next_check_at timestamptz not null default now();
create index job_alerts_due_idx on public.job_alerts(next_check_at,id) where active;
create table public.job_alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.job_alerts(id) on delete cascade,
  status text not null check(status in ('prepared','sending','retry','uncertain','sent','cancelled')),
  claim_token uuid not null default gen_random_uuid(),
  lease_until timestamptz not null,
  next_attempt_at timestamptz not null default now(),
  attempts integer not null default 0,
  job_ids uuid[] not null,
  payload jsonb not null,
  provider_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index job_alert_one_open_delivery on public.job_alert_deliveries(alert_id)
  where status in ('prepared','sending','retry','uncertain');
create index job_alert_delivery_ready_idx on public.job_alert_deliveries(next_attempt_at,lease_until)
  where status in ('prepared','sending','retry');
alter table public.job_alert_deliveries enable row level security;
revoke all on public.job_alert_deliveries from public,anon,authenticated;
grant all on public.job_alert_deliveries to service_role;

create or replace function public.claim_job_alert_delivery(p_alert_ids uuid[] default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp
set statement_timeout='7s' as $$
declare a record; d public.job_alert_deliveries; jobs jsonb; ids uuid[]; checked integer:=0;
begin
  -- A terminated sender may already have delivered. Never reclaim it for automatic sending.
  update public.job_alert_deliveries set status='uncertain',last_error='sending_lease_expired',updated_at=now()
    where status='sending' and lease_until<now() and (p_alert_ids is null or alert_id=any(p_alert_ids));
  select * into d from public.job_alert_deliveries
    where ((status='prepared' and lease_until<now()) or (status='retry' and next_attempt_at<=now()))
      and (p_alert_ids is null or alert_id=any(p_alert_ids))
    order by next_attempt_at,id for update skip locked limit 1;
  if found then
    update public.job_alert_deliveries set status='prepared',claim_token=gen_random_uuid(),lease_until=now()+interval '2 minutes',updated_at=now()
      where id=d.id returning * into d;
    return jsonb_build_object('checked',0,'delivery',to_jsonb(d));
  end if;
  for a in select ja.*,u.email as confirmed_email,u.email_confirmed_at
    from public.job_alerts ja left join auth.users u on u.id=ja.user_id
    where ja.active and ja.next_check_at<=now()
      and (p_alert_ids is null or ja.id=any(p_alert_ids))
      and not exists(select 1 from public.job_alert_deliveries x where x.alert_id=ja.id and x.status in ('prepared','sending','retry','uncertain'))
    order by ja.next_check_at,ja.id for update of ja skip locked limit 50
  loop
    checked:=checked+1;
    update public.job_alerts set next_check_at=now()+interval '24 hours' where id=a.id;
    if a.email_confirmed_at is null or lower(a.confirmed_email)<>lower(a.email) then continue; end if;
    -- Matching and exclusion happen inside PostgreSQL, before LIMIT, avoiding API row caps.
    select jsonb_agg(to_jsonb(j) order by j.published_at,j.id),array_agg(j.id order by j.published_at,j.id)
      into jobs,ids from (
        select j.id,j.slug,j.title,j.company_name,j.location,j.salary_currency,j.salary_min,j.salary_max,
          j.salary_type,j.salary_period,j.published_at
        from public.jobs j where j.status='published' and j.expires_at>=current_date
          and (a.location='' or strpos(lower(j.location),lower(a.location))>0)
          and (a.work_mode='all' or j.work_mode=a.work_mode)
          and not exists(select 1 from regexp_split_to_table(lower(trim(a.keywords)),E'\\s+') w
            where w<>'' and strpos(lower(concat_ws(' ',j.title,j.company_name,j.location,j.employment_type)),w)=0)
          and not exists(select 1 from public.job_notifications n where n.alert_id=a.id and n.job_id=j.id)
        order by j.published_at,j.id limit 20
      ) j;
    if coalesce(cardinality(ids),0)=0 then continue; end if;
    insert into public.job_alert_deliveries(alert_id,status,lease_until,job_ids,payload)
      values(a.id,'prepared',now()+interval '2 minutes',ids,jsonb_build_object('recipient',a.confirmed_email,'keywords',a.keywords,'unsubscribe_token',a.unsubscribe_token,'jobs',jobs))
      returning * into d;
    return jsonb_build_object('checked',checked,'delivery',to_jsonb(d));
  end loop;
  return jsonb_build_object('checked',checked,'delivery',null);
end $$;

create or replace function public.begin_job_alert_delivery(p_id uuid,p_token uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.job_alert_deliveries;
begin
  select * into d from public.job_alert_deliveries where id=p_id for update;
  if not found or d.status<>'prepared' or d.claim_token<>p_token or d.lease_until<=now() then return false; end if;
  if not exists(select 1 from public.job_alerts a join auth.users u on u.id=a.user_id
    where a.id=d.alert_id and a.active and u.email_confirmed_at is not null
      and lower(u.email)=lower(a.email) and lower(u.email)=lower(d.payload->>'recipient'))
    or exists(select 1 from unnest(d.job_ids) jid where not exists(
      select 1 from public.jobs j where j.id=jid and j.status='published' and j.expires_at>=current_date)) then
    update public.job_alert_deliveries set status='cancelled',last_error='recipient_or_jobs_changed',updated_at=now() where id=p_id;
    update public.job_alerts set next_check_at=now() where id=d.alert_id;
    return false;
  end if;
  update public.job_alert_deliveries set status='sending',attempts=attempts+1,lease_until=now()+interval '2 minutes',updated_at=now() where id=p_id;
  return true;
end $$;

create or replace function public.finish_job_alert_delivery(p_id uuid,p_token uuid,p_outcome text,p_message_id text default null,p_error text default null)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare d public.job_alert_deliveries;
begin
  select * into d from public.job_alert_deliveries where id=p_id for update;
  if not found or d.claim_token<>p_token then return false; end if;
  if d.status='sent' and p_outcome='sent' then return true; end if;
  if d.status not in ('sending','uncertain') then return false; end if;
  if p_outcome='sent' then
    if coalesce(length(p_message_id),0)=0 then raise exception 'Provider message ID required'; end if;
    insert into public.job_notifications(alert_id,job_id,provider_message_id)
      select d.alert_id,j.id,p_message_id from public.jobs j where j.id=any(d.job_ids)
      on conflict(alert_id,job_id) do nothing;
    update public.job_alerts set last_sent_at=now(),next_check_at=now()+interval '24 hours' where id=d.alert_id;
    update public.job_alert_deliveries set status='sent',provider_message_id=p_message_id,last_error=null,updated_at=now() where id=p_id;
  elsif p_outcome='retry' then
    -- Only explicit non-acceptance is retryable. Uncertain outcomes need reconciliation.
    if d.status='uncertain' then raise exception 'Uncertain delivery requires reconciliation'; end if;
    update public.job_alert_deliveries set status=case when attempts>=5 then 'uncertain' else 'retry' end,
      next_attempt_at=now()+make_interval(secs=>least(86400,300*power(2,least(attempts-1,8)))::integer),
      last_error=left(p_error,200),updated_at=now() where id=p_id;
  elsif p_outcome='uncertain' then
    update public.job_alert_deliveries set status='uncertain',provider_message_id=p_message_id,last_error=left(p_error,200),updated_at=now() where id=p_id;
  else raise exception 'Invalid outcome'; end if;
  return true;
end $$;

revoke all on function public.claim_job_alert_delivery(uuid[]) from public,anon,authenticated;
revoke all on function public.begin_job_alert_delivery(uuid,uuid) from public,anon,authenticated;
revoke all on function public.finish_job_alert_delivery(uuid,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.claim_job_alert_delivery(uuid[]) to service_role;
grant execute on function public.begin_job_alert_delivery(uuid,uuid) to service_role;
grant execute on function public.finish_job_alert_delivery(uuid,uuid,text,text,text) to service_role;
