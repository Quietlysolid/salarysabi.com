-- Service-only state. Public jobs never expose claim tokens or provider snapshots.
create table public.job_freshness_work (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  next_check_at timestamptz not null default now(),
  claim_token uuid, lease_until timestamptz, claimed_url text
);
alter table public.job_freshness_work enable row level security;
revoke all on public.job_freshness_work from public, anon, authenticated;
grant all on public.job_freshness_work to service_role;
create index job_freshness_due on public.job_freshness_work(next_check_at);

create function public.claim_job_freshness(p_job_ids uuid[] default null)
returns table(job_id uuid, application_url text, claim_token uuid)
language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_token uuid := gen_random_uuid();
begin
  insert into public.job_freshness_work(job_id,next_check_at)
  select id,coalesce(last_availability_check_at+interval '24 hours','-infinity'::timestamptz)
  from public.jobs where status='published' and source_job_id is not null
  on conflict do nothing;
  select w.job_id into v_id from public.job_freshness_work w join public.jobs j on j.id=w.job_id
  where j.status='published' and j.source_job_id is not null and w.next_check_at<=now()
    and (p_job_ids is null or j.id=any(p_job_ids))
    and (w.lease_until is null or w.lease_until<now())
  order by w.next_check_at,w.job_id for update of w skip locked limit 1;
  if v_id is null then return; end if;
  update public.job_freshness_work w set claim_token=v_token,lease_until=now()+interval '2 minutes',
    claimed_url=j.application_url from public.jobs j where w.job_id=v_id and j.id=v_id;
  return query select w.job_id,w.claimed_url,w.claim_token from public.job_freshness_work w where w.job_id=v_id;
end $$;

create function public.finish_job_freshness(p_job_id uuid,p_token uuid,p_status integer)
returns text language plpgsql security definer set search_path=public as $$
declare w public.job_freshness_work%rowtype; j public.jobs%rowtype; outcome text;
begin
  select * into w from public.job_freshness_work where job_id=p_job_id for update;
  if not found or w.claim_token is distinct from p_token or w.lease_until<now() then raise exception 'Stale freshness claim'; end if;
  select * into j from public.jobs where id=p_job_id for update;
  if j.status<>'published' or j.source_job_id is null or j.application_url is distinct from w.claimed_url then
    outcome := 'changed';
  elsif p_status between 200 and 299 then
    update public.jobs set stale_check_failures=0,last_availability_check_at=now(),source_last_seen_at=now() where id=p_job_id;
    outcome := 'healthy';
  elsif p_status in (404,410) then
    update public.jobs set status='expired',stale_check_failures=stale_check_failures+1,last_availability_check_at=now() where id=p_job_id;
    outcome := 'expired';
  else
    update public.jobs set stale_check_failures=stale_check_failures+1,last_availability_check_at=now(),
      status=case when stale_check_failures>=2 then 'draft' else status end where id=p_job_id;
    outcome := case when j.stale_check_failures>=2 then 'heldForReview' else 'unavailable' end;
  end if;
  update public.job_freshness_work set claim_token=null,lease_until=null,claimed_url=null,
    next_check_at=now()+case when outcome='unavailable' then interval '1 hour' else interval '24 hours' end where job_id=p_job_id;
  return outcome;
end $$;

create table public.ats_import_work (
  source_id uuid primary key references public.job_import_sources(id) on delete cascade,
  next_sync_at timestamptz not null default now(), claim_token uuid, lease_until timestamptz,
  source_prefix text, snapshot jsonb, snapshot_at timestamptz, cursor integer not null default 0,
  phase text not null default 'fetch' check(phase in ('fetch','import','cleanup'))
);
alter table public.ats_import_work enable row level security;
revoke all on public.ats_import_work from public, anon, authenticated;
grant all on public.ats_import_work to service_role;

create function public.claim_ats_import(p_source_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.job_import_sources%rowtype; w public.ats_import_work%rowtype; v_token uuid:=gen_random_uuid(); v_id uuid;
begin
  insert into public.ats_import_work(source_id) select id from public.job_import_sources where active on conflict do nothing;
  select a.source_id into v_id from public.ats_import_work a join public.job_import_sources j on j.id=a.source_id
  where j.active and (p_source_id is null or j.id=p_source_id)
    and (a.lease_until is null or a.lease_until<now())
    and (a.next_sync_at<=now() or (p_source_id is not null and (j.last_sync_at is null or j.last_sync_at<now()-interval '1 minute')))
  order by a.next_sync_at,a.source_id for update of a skip locked limit 1;
  if v_id is null then return null; end if;
  select * into s from public.job_import_sources where id=v_id;
  select * into w from public.ats_import_work where source_id=v_id;
  if w.source_prefix is distinct from s.provider||':'||s.source_key||':' then
    update public.ats_import_work set snapshot=null,cursor=0,phase='fetch',snapshot_at=null where source_id=v_id;
  end if;
  update public.ats_import_work set claim_token=v_token,lease_until=now()+interval '2 minutes',
    source_prefix=s.provider||':'||s.source_key||':' where source_id=v_id returning * into w;
  return jsonb_build_object('source',to_jsonb(s),'token',v_token,'phase',w.phase);
end $$;

create function public.save_ats_snapshot(p_source_id uuid,p_token uuid,p_jobs jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
  if jsonb_typeof(p_jobs)<>'array' or jsonb_array_length(p_jobs)>10000 then raise exception 'Invalid ATS snapshot'; end if;
  update public.ats_import_work set snapshot=p_jobs,snapshot_at=now(),cursor=0,phase='import'
  where source_id=p_source_id and claim_token=p_token and lease_until>now() and phase='fetch';
  if not found then raise exception 'Stale ATS claim'; end if;
end $$;

-- Insertion and cursor advancement commit together; an HTTP timeout can be retried safely.
create function public.advance_ats_import(p_source_id uuid,p_token uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare w public.ats_import_work%rowtype; s public.job_import_sources%rowtype; item jsonb;
  drafted integer:=0; duplicates integer:=0; removed integer:=0; inserted integer; next_cursor integer; done boolean:=false;
begin
  select * into w from public.ats_import_work where source_id=p_source_id for update;
  if not found or w.claim_token is distinct from p_token or w.lease_until<now() then raise exception 'Stale ATS claim'; end if;
  select * into s from public.job_import_sources where id=p_source_id;
  if not s.active or w.source_prefix is distinct from s.provider||':'||s.source_key||':' then raise exception 'Source changed during import'; end if;
  if w.snapshot is null then raise exception 'Validated snapshot required'; end if;
  if w.phase='import' then
    next_cursor := least(w.cursor+50,jsonb_array_length(w.snapshot));
    -- Serialize identity checks with other ATS batches, including different boards.
    perform pg_advisory_xact_lock(8246019);
    for item in select value from jsonb_array_elements(w.snapshot) with ordinality t(value,n) where n>w.cursor and n<=next_cursor loop
      if exists(select 1 from public.jobs where source_job_id=item->>'source_job_id' or
        (status in ('draft','published') and (dedupe_key=item->>'dedupe_key' or canonical_url=item->>'canonical_url'))) then
        duplicates:=duplicates+1;
      else
        insert into public.jobs(slug,title,company_name,location,work_mode,employment_type,description,
          salary_min,salary_max,salary_period,salary_type,salary_currency,salary_source,application_url,
          source_url,canonical_url,employer_verified,source_verified_at,source_last_seen_at,source_kind,
          source_name,source_job_id,global_remote,engagement_type,published_at,expires_at,status,source_confidence,verification_status,dedupe_key)
        values(item->>'slug',item->>'title',item->>'company_name',item->>'location',item->>'work_mode',item->>'employment_type',item->>'description',
          (item->>'salary_min')::numeric,(item->>'salary_max')::numeric,item->>'salary_period','not_stated','NGN','employer_disclosed',item->>'application_url',
          item->>'source_url',item->>'canonical_url',false,now(),now(),'official_page',item->>'source_name',item->>'source_job_id',
          (item->>'global_remote')::boolean,'unknown',now(),(current_date+30),'draft','high','pending',item->>'dedupe_key') on conflict do nothing;
        get diagnostics inserted=row_count;
        drafted:=drafted+inserted; duplicates:=duplicates+1-inserted;
      end if;
    end loop;
    update public.ats_import_work set cursor=next_cursor,phase=case when next_cursor=jsonb_array_length(w.snapshot) then 'cleanup' else 'import' end where source_id=p_source_id;
  elsif w.phase='cleanup' then
    -- Literal prefix comparison, not LIKE. Bounded DELETE avoids PostgREST row caps and long URLs.
    with candidates as (
      select j.id from public.jobs j where j.status='draft' and j.verification_status='pending'
        and left(j.source_job_id,length(w.source_prefix))=w.source_prefix
        and j.created_at<=w.snapshot_at
        and not exists(select 1 from jsonb_array_elements(w.snapshot) a where a->>'source_job_id'=j.source_job_id)
      order by j.id for update of j limit 100
    ) delete from public.jobs where id in (select id from candidates);
    get diagnostics removed=row_count;
    done:=removed=0;
    if done then
      update public.ats_import_work set snapshot=null,snapshot_at=null,cursor=0,phase='fetch',
        claim_token=null,lease_until=null,next_sync_at=now()+interval '24 hours' where source_id=p_source_id;
      update public.job_import_sources set last_sync_at=now(),last_sync_status='ok',last_sync_message='Import and draft cleanup completed.' where id=p_source_id;
    end if;
  end if;
  return jsonb_build_object('drafted',drafted,'duplicates',duplicates,'removedIneligible',removed,'done',done);
end $$;

create function public.release_ats_import(p_source_id uuid,p_token uuid,p_error text default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  update public.ats_import_work set claim_token=null,lease_until=null,
    next_sync_at=now()+case when p_error is null then interval '0 minutes' else interval '15 minutes' end
  where source_id=p_source_id and claim_token=p_token and lease_until>now();
  if not found then raise exception 'Stale ATS claim'; end if;
  update public.job_import_sources set last_sync_at=now(),last_sync_status=case when p_error is null then 'warning' else 'error' end,
    last_sync_message=case when p_error is null then 'Import in progress; next scheduled run will continue.' else left(p_error,500) end where id=p_source_id;
end $$;

revoke all on function public.claim_job_freshness(uuid[]),public.finish_job_freshness(uuid,uuid,integer),
  public.claim_ats_import(uuid),public.save_ats_snapshot(uuid,uuid,jsonb),public.advance_ats_import(uuid,uuid),public.release_ats_import(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.claim_job_freshness(uuid[]),public.finish_job_freshness(uuid,uuid,integer),
  public.claim_ats_import(uuid),public.save_ats_snapshot(uuid,uuid,jsonb),public.advance_ats_import(uuid,uuid),public.release_ats_import(uuid,uuid,text) to service_role;

-- Frequent bounded work; individual sources/jobs have their own persisted due dates.
do $$ declare j record; begin
  for j in select jobid from cron.job where jobname in ('salarysabi-ats-jobs-import','salarysabi-stale-job-check') loop
    perform cron.alter_job(j.jobid,schedule := '*/5 * * * *');
  end loop;
end $$;
notify pgrst, 'reload schema';
