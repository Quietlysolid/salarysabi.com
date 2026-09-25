// Executes the current handlers with real staging PostgREST and simulated external services.
// Synthetic records never reach production. Findings are recorded rather than hidden by early exit.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const url='https://vcgqxlbhsbilxlkratbw.supabase.co';
const key=process.env.STAGING_ALERT_SERVICE_KEY,secret=process.env.STAGING_ALERT_CRON_SECRET;
assert(key&&secret);
const realFetch=globalThis.fetch;
const db=createClient(url,key,{auth:{persistSession:false},global:{fetch:realFetch}});
const check=r=>{if(r.error)throw r.error;return r.data;};
const stamp='workerqa'+crypto.randomUUID().replaceAll('-','').slice(0,12);
const results=[],tempFiles=[];let failAdvanceAfterCommit=false;let fixtureIds=[];let sourceId,mode='healthy',failWrites=false,fetches=0,atsPayload={jobs:[]};
const record=(test,passed,details)=>{const r={test,passed,...details};results.push(r);console.log(JSON.stringify(r));};
globalThis.fetch=async(input,init={})=>{
 const u=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
 if(u.origin===url){
  if(u.pathname==='/rest/v1/rpc/advance_ats_import'&&failAdvanceAfterCommit){
   failAdvanceAfterCommit=false;const committed=await realFetch(u,init);assert(committed.ok,await committed.text());
   return Response.json({message:'Injected lost response after commit',code:'XX000'},{status:503});
  }
  if(u.pathname==='/rest/v1/rpc/claim_job_freshness') init={...init,body:JSON.stringify({p_job_ids:fixtureIds})};
  if(u.pathname==='/rest/v1/rpc/finish_job_freshness'&&failWrites)return Response.json({message:'Injected database write failure',code:'XX000'},{status:503});
  if(u.pathname==='/rest/v1/jobs'){
   if((init.method||'GET')==='GET')u.searchParams.append('slug','like.'+stamp+'%');
   if(init.method==='PATCH'&&failWrites)return Response.json({message:'Injected database write failure',code:'XX000'},{status:503});
  }
  return realFetch(u,init);
 }
 if(u.hostname==='boards-api.greenhouse.io'){
  if(mode==='ats-slow')await new Promise((done,reject)=>{const t=setTimeout(done,65000);init.signal?.addEventListener('abort',()=>{clearTimeout(t);reject(new Error('timeout'));},{once:true});});
  return mode==='ats-error'?new Response('Unavailable',{status:503}):Response.json(atsPayload);
 }
 if(u.hostname==='example.com'){
  fetches++;
  if(mode==='slow')await new Promise((done,reject)=>{const t=setTimeout(done,10500);init.signal?.addEventListener('abort',()=>{clearTimeout(t);reject(new Error('timeout'));},{once:true});});
  return new Response('',{status:mode==='unavailable'?503:200});
 }
 throw new Error('Blocked unexpected test destination: '+u.origin);
};
async function load(name){
 let handler;
 globalThis.Deno={env:{get:n=>({SUPABASE_URL:url,SUPABASE_SERVICE_ROLE_KEY:key})[n]},serve:fn=>{handler=fn;}};
 let code=readFileSync(`supabase/functions/${name}/index.ts`,'utf8').replace('npm:@supabase/supabase-js@2','@supabase/supabase-js');
 code=code.replaceAll('"../_shared/','"'+pathToFileURL(resolve('supabase/functions/_shared')).href+'/');
 const p=resolve(`supabase/.temp/${stamp}-${name}.ts`);tempFiles.push(p);writeFileSync(p,code);
 await import(pathToFileURL(p).href);assert(handler);return handler;
}
const request=(body={})=>new Request('https://test.invalid/',{method:'POST',headers:{'x-cron-secret':secret,'content-type':'application/json'},body:JSON.stringify(body)});
async function resetSource(){
 check(await db.from('ats_import_work').delete().eq('source_id',sourceId));
 check(await db.from('job_import_sources').update({last_sync_at:null}).eq('id',sourceId));
}
async function drain(ats){
 let total=0,r,body;
 for(let i=0;i<30;i++){
  r=await ats(request({sourceId}));body=await r.json();total+=body.removedIneligible||0;
  if(r.status>=400||!body.pending)break;
 }
 return {r,body:{...body,removedIneligible:total}};
}
let template;
async function seed(n,status='published'){
 check(await db.from('jobs').delete().like('slug',stamp+'%'));
 const rows=Array.from({length:n},(_,i)=>({...template,slug:stamp+'-'+i,title:stamp+' '+i,source_job_id:'greenhouse:'+stamp+':'+i,source_name:stamp,application_url:'https://example.com/'+stamp+'/'+i,canonical_url:'https://example.com/'+stamp+'/'+i,dedupe_key:stamp+'-'+i,status,verification_status:status==='published'?'verified':'pending',expires_at:'2099-12-31',stale_check_failures:0,last_availability_check_at:null}));
 for(let i=0;i<n;i+=200)check(await db.from('jobs').insert(rows.slice(i,i+200)));
 fixtureIds=check(await db.from('jobs').select('id').like('slug',stamp+'%')).map(j=>j.id);
}
try{
 template=check(await db.from('jobs').select('*').eq('status','published').limit(1))[0];assert(template);
 for(const k of ['id','created_at','updated_at'])delete template[k];
 const stale=await load('check-stale-jobs'),ats=await load('import-ats-jobs');
 if(process.env.SCHEDULED_WORKER_CASE==='resilience'){
  sourceId=check(await db.from('job_import_sources').insert({provider:'greenhouse',source_key:stamp,company_name:stamp,active:true,nigeria_only:true}).select('id').single()).id;
  const description='NGN 500,000 - 700,000 monthly. This is an isolated staging quality assurance vacancy for testing import behaviour, never a genuine job.';
  atsPayload={jobs:Array.from({length:1005},(_,i)=>({id:i+1,title:stamp+' engineer '+i,location:{name:'Lagos, Nigeria'},content:description,absolute_url:'https://example.com/'+stamp+'/'+i}))};
  failAdvanceAfterCommit=true;
  const failed=await ats(request({sourceId}));
  const progress=check(await db.from('ats_import_work').select('cursor,snapshot,phase').eq('source_id',sourceId).single());
  record('Committed import progress survives a lost HTTP response',failed.status===503&&progress.cursor===50&&progress.phase==='import',{http:failed.status,cursor:progress.cursor});
  check(await db.from('ats_import_work').update({next_sync_at:new Date(0).toISOString()}).eq('source_id',sourceId));
  // Subsequent invocations must use the saved snapshot, not a changed provider response.
  atsPayload={error:'provider changed while run was in progress'};
  const concurrent=await Promise.all(Array.from({length:10},()=>ats(request({sourceId}))));
  const continued=await drain(ats);
  const count=await db.from('jobs').select('id',{count:'exact',head:true}).like('source_job_id','greenhouse:'+stamp+':%');check(count);
  record('Overlapping resumptions finish 1,005 jobs without duplicate inserts or refetch',count.count===1005&&concurrent.every(r=>r.status<400)&&continued.r.status<400,{records:count.count,statuses:concurrent.map(r=>r.status)});
  check(await db.from('jobs').delete().like('source_job_id','greenhouse:'+stamp+':%'));
  await seed(1);
  const old=check(await db.rpc('claim_job_freshness',{p_job_ids:fixtureIds}))[0];
  check(await db.from('job_freshness_work').update({lease_until:new Date(0).toISOString()}).eq('job_id',old.job_id));
  const fresh=check(await db.rpc('claim_job_freshness',{p_job_ids:fixtureIds}))[0];
  const late=await db.rpc('finish_job_freshness',{p_job_id:old.job_id,p_token:old.claim_token,p_status:503});
  const completed=await db.rpc('finish_job_freshness',{p_job_id:fresh.job_id,p_token:fresh.claim_token,p_status:200});
  record('Expired freshness lease resumes and rejects the old worker',!!late.error&&!completed.error&&completed.data==='healthy',{oldRejected:!!late.error,outcome:completed.data});
  const before=check(await db.from('jobs').select('last_availability_check_at').eq('id',fresh.job_id).single());
  const again=check(await db.rpc('claim_job_freshness',{p_job_ids:fixtureIds}));
  record('Successful freshness check is not immediately claimed again',again.length===0&&!!before.last_availability_check_at,{claims:again.length});
 }else if(process.env.SCHEDULED_WORKER_CASE==='ats-cleanup'){
  sourceId=check(await db.from('job_import_sources').insert({provider:'greenhouse',source_key:stamp,company_name:stamp,active:true,nigeria_only:true}).select('id').single()).id;
  await seed(1005,'draft');const {r,body}=await drain(ats);
  const left=await db.from('jobs').select('id',{count:'exact',head:true}).like('slug',stamp+'%');check(left);
  record('ATS cleanup handles 1,005 obsolete drafts',left.count===0,{remaining:left.count,http:r.status,removed:body.removedIneligible,failures:body.failures});
 }else if(process.env.SCHEDULED_WORKER_CASE==='ats-timeout'){
  sourceId=check(await db.from('job_import_sources').insert({provider:'greenhouse',source_key:stamp,company_name:stamp,active:true,nigeria_only:true}).select('id').single()).id;
  mode='ats-slow';const started=Date.now();const r=await ats(request({sourceId}));
  record('ATS provider delay stays below scheduler 60-second deadline',Date.now()-started<60000,{milliseconds:Date.now()-started,http:r.status});
 }else if(process.env.SCHEDULED_WORKER_CASE==='ats-extra'){
  sourceId=check(await db.from('job_import_sources').insert({provider:'greenhouse',source_key:stamp,company_name:stamp,active:true,nigeria_only:true}).select('id').single()).id;
  const description='Compensation: NGN 500,000 - 700,000 monthly. This is an isolated staging quality assurance vacancy for testing import behaviour, never a genuine job.';
  atsPayload={jobs:[{id:1,title:stamp+' engineer',location:{name:'Lagos, Nigeria'},content:description,absolute_url:'https://example.com/'+stamp+'/1'}]};
  const first=await ats(request({sourceId}));const firstBody=await first.json();
  const imported=check(await db.from('jobs').select('id,status,verification_status,salary_min').like('slug',stamp+'%'));
  // Imported slugs derive from company/title, so identify test-owned rows by source ID too.
  const owned=check(await db.from('jobs').select('id,status,verification_status,salary_min,slug').eq('source_job_id','greenhouse:'+stamp+':1'));
  record('Eligible ATS vacancy imports only as an unverified draft',owned.length===1&&owned[0].status==='draft'&&owned[0].verification_status==='pending'&&owned[0].salary_min===500000,{http:first.status,drafted:firstBody.drafted,records:owned.length});
  await resetSource();await ats(request({sourceId}));const duplicates=check(await db.from('jobs').select('id').eq('source_job_id','greenhouse:'+stamp+':1'));
  record('Sequential ATS import does not duplicate an existing job',duplicates.length===1,{records:duplicates.length});
  // Delete by exact test-owned source ID before running the next isolated case.
  check(await db.from('jobs').delete().eq('source_job_id','greenhouse:'+stamp+':1'));
  void imported;
  await resetSource();await seed(1,'draft');const wildcardKey=stamp+'_board';
  check(await db.from('job_import_sources').update({source_key:wildcardKey}).eq('id',sourceId));
  check(await db.from('jobs').update({source_job_id:'greenhouse:'+stamp+'Xboard:1'}).like('slug',stamp+'%'));
  atsPayload={jobs:[]};await ats(request({sourceId}));
  const other=check(await db.from('jobs').select('id').like('slug',stamp+'%'));
  record('ATS cleanup is restricted to the exact source key',other.length===1,{other_source_records_remaining:other.length});
  check(await db.from('job_import_sources').update({source_key:stamp}).eq('id',sourceId));
  await resetSource();await seed(1);atsPayload={jobs:[]};await ats(request({sourceId}));
  const published=check(await db.from('jobs').select('status').like('slug',stamp+'%'));
  record('ATS cleanup preserves published verified records',published.length===1&&published[0].status==='published',{records:published.length});
 }else{
 const denied=await stale(new Request('https://test.invalid/',{method:'POST'}));record('Stale checker rejects unauthorized requests',denied.status===401,{status:denied.status});
 await seed(260);fetches=0;let runs=0;for(;runs<30;runs++){const r=await stale(request());assert(r.status<400,await r.text());const left=await db.from('jobs').select('id',{count:'exact',head:true}).like('slug',stamp+'%').is('last_availability_check_at',null);check(left);if(!left.count)break;}
 const unchecked=check(await db.from('jobs').select('id',{count:'exact'}).like('slug',stamp+'%').is('last_availability_check_at',null));
 record('Stale checker advances beyond its first 250 records',unchecked.length===0&&fetches===260,{still_unchecked:unchecked.length,total:260,runs:runs+1,fetches});
 await seed(1);failWrites=true;const failed=await stale(request());const failedBody=await failed.json();failWrites=false;
 const saved=check(await db.from('jobs').select('last_availability_check_at').like('slug',stamp+'%'));
 record('Stale checker reports failed persistence',failed.status>=400,{http:failed.status,reported:failedBody,saved:saved[0].last_availability_check_at});
 await seed(1);mode='unavailable';await Promise.all(Array.from({length:10},()=>stale(request())));
 const concurrent=check(await db.from('jobs').select('stale_check_failures,status').like('slug',stamp+'%'))[0];
 record('Overlapping freshness runs count one scheduled observation',concurrent.stale_check_failures===1,{runs:10,...concurrent});
 mode='healthy';sourceId=check(await db.from('job_import_sources').insert({provider:'greenhouse',source_key:stamp,company_name:stamp,active:true,nigeria_only:true}).select('id').single()).id;
 await seed(1005,'draft');const {r:cleanup,body:cleanupBody}=await drain(ats);
 const left=await db.from('jobs').select('id',{count:'exact',head:true}).like('slug',stamp+'%');check(left);
 record('ATS cleanup handles more than 1,000 obsolete drafts',left.count===0,{remaining:left.count,http:cleanup.status,removed:cleanupBody.removedIneligible,failures:cleanupBody.failures});
 await resetSource();await seed(1,'draft');atsPayload={error:'Unexpected provider payload'};const malformed=await ats(request({sourceId}));const remaining=check(await db.from('jobs').select('id').like('slug',stamp+'%'));
 record('Malformed ATS payload cannot delete existing drafts',remaining.length===1&&malformed.status>=400,{remaining:remaining.length,http:malformed.status});
 await resetSource();mode='ats-error';const upstream=await ats(request({sourceId}));const upstreamBody=await upstream.json();record('ATS failure produces a non-success HTTP status',upstream.status>=400,{http:upstream.status,failures:upstreamBody.failures});
 await seed(6);mode='slow';fetches=0;const started=Date.now();const slow=await stale(request());record('Freshness workload stays below scheduler 60-second deadline',Date.now()-started<60000,{milliseconds:Date.now()-started,external_calls:fetches,http:slow.status});
 }
}finally{
 globalThis.fetch=realFetch;
 check(await db.from('jobs').delete().like('slug',stamp+'%'));
 check(await db.from('jobs').delete().like('source_job_id','greenhouse:'+stamp+':%'));
 if(sourceId)check(await db.from('job_import_sources').delete().eq('id',sourceId));
 for(const p of tempFiles)unlinkSync(p);
 const suffix={'resilience':'-resilience','ats-extra':'-extra','ats-cleanup':'-cleanup','ats-timeout':'-timeout'}[process.env.SCHEDULED_WORKER_CASE]||'';
 writeFileSync('supabase/.temp/scheduled-worker'+suffix+'-results.json',JSON.stringify(results,null,2));
 console.log('Synthetic staging jobs and source removed. No production writes or real external fetches.');
}
if(results.some(r=>!r.passed))process.exitCode=1;
