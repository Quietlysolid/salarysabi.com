// Real staging Auth/Postgres, production runner, simulated outbound mail only.
import {createClient} from '@supabase/supabase-js';
import {readFileSync,writeFileSync} from 'node:fs';
import {runJobAlertBatch} from '../supabase/functions/_shared/job-alert-runner.ts';
import assert from 'node:assert/strict';
const url='https://vcgqxlbhsbilxlkratbw.supabase.co';
const key=process.env.STAGING_ALERT_SERVICE_KEY;
assert(key,'Run through run-staging-alert-stress.py');
const db=createClient(url,key,{auth:{persistSession:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(5000)})}});
const stamp='durable'+crypto.randomUUID().replaceAll('-','').slice(0,16),email=stamp+'@example.com';
const results=[];let uid,ids=[],accepts=0,calls=0,delay=0,reject=false,failSave=false;
const check=r=>{if(r.error)throw r.error;return r.data;};
const rpc=async(name,args)=>check(await db.rpc(name,args));
const log=(scenario,details={})=>{const row={scenario,passed:true,...details};results.push(row);console.log(JSON.stringify(row));};
const claim=()=>rpc('claim_job_alert_delivery',{p_alert_ids:ids});
const begin=d=>rpc('begin_job_alert_delivery',{p_id:d.id,p_token:d.claim_token});
async function finish(d,outcome,messageId=null,error=null){
 if(failSave&&outcome==='sent'){failSave=false;throw Error('Injected save outage');}
 assert.equal(await rpc('finish_job_alert_delivery',{p_id:d.id,p_token:d.claim_token,p_outcome:outcome,p_message_id:messageId,p_error:error}),true);
}
const deps={claim,begin,finish,unsubscribeBase:url+'/functions/v1/send-job-alerts',send:async(mail,signal)=>{
 assert.equal(mail.to[0],email);calls++;
 if(delay)await new Promise((resolve,rejectDelay)=>{const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},delay);const abort=()=>{clearTimeout(timer);rejectDelay(signal.reason);};signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();});
 if(reject)return Response.json({success:false},{status:429});
 accepts++;return Response.json({success:true,result:{message_id:'mock-'+crypto.randomUUID()}});
}};
async function reset(count=1,matching=true){
 if(uid)check(await db.from('job_alerts').delete().eq('user_id',uid));
 ids=Array.from({length:count},()=>crypto.randomUUID());accepts=0;calls=0;delay=0;reject=false;failSave=false;
 const rows=ids.map((id,i)=>({id,user_id:uid,email,keywords:stamp+(matching?'':' absent')+(count>1?' '+i:''),work_mode:'all',active:true,consented_at:new Date().toISOString()}));
 for(let i=0;i<rows.length;i+=200)check(await db.from('job_alerts').insert(rows.slice(i,i+200)));
}
const delivery=async()=>check(await db.from('job_alert_deliveries').select('*').eq('alert_id',ids[0]).single());
const countNotifications=async()=>{const r=await db.from('job_notifications').select('*',{count:'exact',head:true}).eq('alert_id',ids[0]);check(r);return r.count;};
try{
 uid=check(await db.auth.admin.createUser({email,password:crypto.randomUUID(),email_confirm:true})).user.id;
 const source=check(await db.from('jobs').select('*').eq('status','published').limit(1))[0];assert(source);
 for(const k of ['id','created_at','updated_at'])delete source[k];
 const jobs=Array.from({length:1105},(_,i)=>({...source,id:crypto.randomUUID(),source_job_id:null,slug:`${stamp}-${i}`,title:`TEST ONLY ${stamp} ${i}`,dedupe_key:`${stamp}-${i}`,expires_at:'2099-12-31',application_url:'https://example.com/staging-only'}));
 for(let i=0;i<jobs.length;i+=200)check(await db.from('jobs').insert(jobs.slice(i,i+200)));
 await reset();delay=250;
 await Promise.all(Array.from({length:10},()=>runJobAlertBatch(deps)));
 assert.equal(accepts,1);assert.equal(await countNotifications(),20);log('10 overlapping runs: one acceptance and one saved batch',{accepts});

 await reset();failSave=true;const failed=await runJobAlertBatch(deps);assert.equal(failed.uncertain,1);
 await runJobAlertBatch(deps);assert.equal(accepts,1);assert.equal((await delivery()).status,'uncertain');assert.equal(await countNotifications(),0);
 let d=await delivery();await finish(d,'sent',d.provider_message_id);assert.equal(await countNotifications(),20);
 await runJobAlertBatch(deps);assert.equal(accepts,1);log('Save outage: held, not resent; provider acceptance reconciled atomically');

 await reset();
 for(let i=0;i<1000;i+=200)check(await db.from('job_notifications').insert(jobs.slice(i,i+200).map(j=>({alert_id:ids[0],job_id:j.id,provider_message_id:'previous-fixture'}))));
 await runJobAlertBatch(deps);assert.equal(accepts,1);assert.equal(await countNotifications(),1020);
 d=await delivery();assert(d.job_ids.every(id=>jobs.slice(1000).some(j=>j.id===id)));log('1,105 jobs: matches beyond 1,000 reached',{previous:1000,new:20});

 await reset(1005,false);let processed=0;const start=performance.now();let rounds=0;
 for(;rounds<10;rounds++){const r=await runJobAlertBatch(deps);processed+=r.alerts_processed;assert(r.elapsed_ms<55000);if(r.complete)break;}
 assert.equal(processed,1005);assert.equal(accepts,0);log('1,005 alerts: every alert processed in bounded batches',{processed,rounds:rounds+1,seconds:+((performance.now()-start)/1000).toFixed(2)});

 await reset(70);let total=0;rounds=0;
 for(;rounds<10;rounds++){const r=await runJobAlertBatch(deps);total+=r.emails_sent;assert(r.batches<=30&&r.elapsed_ms<55000);if(r.complete)break;}
 assert.equal(total,70);assert.equal(accepts,70);log('70 matching alerts: continuation drains backlog without duplicate sends',{rounds:rounds+1,accepts});

 await reset();reject=true;const rateLimited=await runJobAlertBatch(deps);assert.equal(rateLimited.retryable,1);
 d=await delivery();assert.equal(d.status,'retry');await runJobAlertBatch(deps);assert.equal(calls,1);
 check(await db.from('job_alert_deliveries').update({next_attempt_at:new Date(0).toISOString()}).eq('id',d.id));reject=false;
 await runJobAlertBatch(deps);assert.equal(accepts,1);assert.equal((await delivery()).attempts,2);log('Explicit 429: backoff enforced, retry succeeds once');

 await reset();const first=(await claim()).delivery;assert(first);
 check(await db.from('job_alert_deliveries').update({lease_until:new Date(0).toISOString()}).eq('id',first.id));
 const reclaimed=(await claim()).delivery;assert.notEqual(first.claim_token,reclaimed.claim_token);assert.equal(await begin(first),false);
 assert.equal(await begin(reclaimed),true);check(await db.from('job_alert_deliveries').update({lease_until:new Date(0).toISOString()}).eq('id',first.id));
 await runJobAlertBatch(deps);assert.equal(accepts,0);assert.equal((await delivery()).status,'uncertain');log('Lease fencing: pre-send claims recover; expired send claims held without resend');

 await reset();d=(await claim()).delivery;check(await db.from('job_alerts').update({active:false}).eq('id',ids[0]));assert.equal(await begin(d),false);assert.equal((await delivery()).status,'cancelled');log('Unsubscribe between claim and send cancels delivery');

 const anonConfig=JSON.parse(readFileSync('supabase/.temp/staging-public.json','utf8'));
 const anon=createClient(url,anonConfig.key,{auth:{persistSession:false}});
 for(const [name,args] of [['claim_job_alert_delivery',{p_alert_ids:ids}],['begin_job_alert_delivery',{p_id:d.id,p_token:d.claim_token}],['finish_job_alert_delivery',{p_id:d.id,p_token:d.claim_token,p_outcome:'sent',p_message_id:'forged'}]])assert((await anon.rpc(name,args)).error);
 assert((await anon.from('job_alert_deliveries').select('*')).error);log('Anonymous callers cannot read or mutate delivery state');

 await reset(7);delay=9000;let maxMs=0;
 for(let i=0;i<5;i++){const r=await runJobAlertBatch(deps);maxMs=Math.max(maxMs,r.elapsed_ms);assert(r.elapsed_ms<55000);if(r.complete)break;}
 assert.equal(accepts,0);assert.equal(calls,7);
 const held=check(await db.from('job_alert_deliveries').select('status').in('alert_id',ids));assert.equal(held.length,7);assert(held.every(d=>d.status==='uncertain'));
 await runJobAlertBatch(deps);assert.equal(calls,7);log('7 slow sends: provider deadlines hold uncertain outcomes, runs stay below 60 seconds',{max_run_seconds:+(maxMs/1000).toFixed(2),automatic_resends:0});
}finally{
 if(uid)check(await db.from('job_alerts').delete().eq('user_id',uid));
 check(await db.from('jobs').delete().like('slug',stamp+'-%'));
 if(uid)check(await db.auth.admin.deleteUser(uid));
 writeFileSync('supabase/.temp/durable-alert-results.json',JSON.stringify({date:new Date().toISOString(),results},null,2));
 console.log('All created fixtures removed; no email sent.');
}
